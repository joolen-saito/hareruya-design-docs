#!/usr/bin/env python3
"""DB定義層の事実抽出（捏造ゼロ）

pf = MySQL   : src/Eccube/Resource/doctrine/*.dcm.yml（YAMLマッピング）＋プラグイン
ee = PostgreSQL: src/Eccube/Entity/*.php の #[ORM\\Column(...)] 属性

**バイト/文字の意味論が異なる点に注意（本抽出では type をそのまま持ち回り、換算しない）**
  MySQL   TEXT       = 65,535 **バイト**（utf8mb4なら最大16,383文字）
  MySQL   MEDIUMTEXT = 16,777,215 バイト
  Postgres text      = **無制限**（バイト上限の概念が無い）
  両者 varchar(n)/string length=n = n **文字**
→ HTMLの 65535 等は MySQL のバイト上限由来であり、ee(Postgres)には対応概念が無い。
  ee 側の定数コメントにも痕跡がある:
    eccube_product_stock_change_reason_max_len: 16384 # 65535byte制限を4バイト文字の文字数制限で指定
"""
from __future__ import annotations
import json, re, yaml
from pathlib import Path
from collections import Counter

PF = Path('/home/y-saito/Developments/pf-eccube3')
EE = Path('/home/y-saito/Developments/ec-cube-enterprise')
SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')

# MySQL の型別バイト上限（文字数ではない）
MYSQL_BYTE_LIMIT = {
    'text': 65535, 'blob': 65535,
    'mediumtext': 16777215, 'longtext': 4294967295,
    'tinytext': 255,
}

def scan_pf():
    """MySQL 側: dcm.yml の fields を読む。"""
    facts = []
    roots = list(PF.glob('src/Eccube/Resource/doctrine/*.dcm.yml')) + \
            list(PF.glob('app/Plugin/*/Resource/doctrine/*.dcm.yml'))
    for f in roots:
        rel = str(f.relative_to(PF))
        try:
            y = yaml.safe_load(f.read_text(encoding='utf-8')) or {}
        except Exception:
            continue
        text = f.read_text(encoding='utf-8').splitlines()
        for entity, body in y.items():
            if not isinstance(body, dict):
                continue
            table = (body.get('table') or '')
            for fname, fdef in (body.get('fields') or {}).items():
                if not isinstance(fdef, dict):
                    continue
                typ = str(fdef.get('type', ''))
                col = fdef.get('column', fname)
                length = fdef.get('length')
                # 行番号を引用のために特定
                line = next((i + 1 for i, l in enumerate(text)
                             if re.match(rf'\s*{re.escape(str(fname))}\s*:\s*$', l)), None)
                facts.append(dict(
                    system='pf', engine='mysql', file=rel, line=line,
                    entity=str(entity), table=str(table), field=str(fname), column=str(col),
                    type=typ, length=length,
                    byte_limit=MYSQL_BYTE_LIMIT.get(typ.lower()),
                    nullable=fdef.get('nullable'),
                ))
    return facts

# 属性とプロパティ宣言の間に #[ORM\Id] や #[ORM\GeneratedValue] 等の他属性・docblockが
# 挟まることがある（実測: ee は ORM\Column が1,522件だが素朴な正規表現では400件しか取れなかった）。
# 間に挟まる行を許容する。
ORM_COL = re.compile(
    r"#\[ORM\\Column\(([^\]]*)\)\]"
    r"(?:\s*(?:#\[[^\]]*\]|/\*\*(?:[^*]|\*(?!/))*\*/|//[^\n]*)\s*)*"
    r"\s*(?:private|protected|public)[^;]{0,120}?\$([A-Za-z0-9_]+)",
    re.S)

PROP = re.compile(r'(?:private|protected|public)[^;=]{0,120}?\$([A-Za-z0-9_]+)')

def scan_ee():
    """PostgreSQL 側: #[ORM\\Column(...)] 属性を行ベースで読む。

    正規表現を1発で書くと `options: ['unsigned' => true]` の `]` で早期終了して
    大量に取りこぼす（実測: 1,522件中405件しか取れなかった）。行走査で確実に取る。
    """
    facts = []
    for f in EE.glob('src/Eccube/Entity/**/*.php'):
        rel = str(f.relative_to(EE))
        try:
            lines = f.read_text(encoding='utf-8', errors='replace').splitlines()
        except Exception:
            continue
        for i, ln in enumerate(lines):
            if '#[ORM\\Column(' not in ln:
                continue
            # 属性が複数行に跨る場合は ')]' が出るまで連結
            args = ln
            j = i
            while ')]' not in args and j + 1 < len(lines) and j - i < 8:
                j += 1
                args += ' ' + lines[j].strip()
            # 直後の最初のプロパティ宣言を探す（間に #[ORM\Id] 等が挟まる）
            prop = None
            for k in range(j + 1, min(j + 8, len(lines))):
                m = PROP.search(lines[k])
                if m:
                    prop = m.group(1)
                    break
                if '#[ORM\\Column(' in lines[k]:
                    break
            if not prop:
                continue
            name = re.search(r"name:\s*'([^']+)'", args)
            typ = re.search(r"type:\s*(?:Types::)?([A-Za-z_]+)", args)
            length = re.search(r"length:\s*(\d+)", args)
            facts.append(dict(
                system='ee', engine='postgresql', file=rel, line=i + 1,
                entity=f.stem, table=None, field=prop,
                column=name.group(1) if name else prop,
                type=(typ.group(1).lower() if typ else ''),
                length=int(length.group(1)) if length else None,
                byte_limit=None,   # Postgres の text にバイト上限は無い
                nullable=('nullable: true' in args),
            ))
    return facts

if __name__ == '__main__':
    pf, ee = scan_pf(), scan_ee()
    json.dump(pf + ee, open(SP / 'dbfacts.json', 'w'), ensure_ascii=False)
    print(f'pf(MySQL) 列事実: {len(pf)}   ee(PostgreSQL) 列事実: {len(ee)}')
    print('\npf 型分布:', Counter(x['type'] for x in pf).most_common(8))
    print('ee 型分布:', Counter(x['type'] for x in ee).most_common(8))
    print(f"\npf で length 指定あり: {sum(1 for x in pf if x['length'])}")
    print(f"ee で length 指定あり: {sum(1 for x in ee if x['length'])}")
    print(f"pf で MySQL バイト上限型(text等): {sum(1 for x in pf if x['byte_limit'])}")
    # 検算: 既知の真値
    print('\n=== 検算 ===')
    for x in ee:
        if x['entity'] == 'Member' and x['column'] in ('password', 'login_id', 'name'):
            print(f"  ee Member.{x['column']:9s} type={x['type']:8s} length={x['length']}  ({x['file']}:{x['line']})")
