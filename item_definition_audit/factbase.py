#!/usr/bin/env python3
"""FormType事実ベース抽出器（捏造ゼロ設計）

原則: 値はこのパーサだけが出す。マッチした文字列以外は一切出力しない。
      解決できない参照は None のまま残し、推測で埋めない。
各事実は (system, file, line, formtype, field, label, required, maxlen, maxlen_expr) を持ち、
file:line は実ファイルへ再検証可能。
"""
from __future__ import annotations
import re, json, sys, yaml
from pathlib import Path

PF = Path('/home/y-saito/Developments/pf-eccube3')
EE = Path('/home/y-saito/Developments/ec-cube-enterprise')
OUT = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')

# ---------- config 辞書（フラット化。値は必ず出典付き） ----------
def flat(d, prefix=(), out=None):
    out = {} if out is None else out
    if isinstance(d, dict):
        for k, v in d.items():
            flat(v, prefix + (str(k),), out)
    elif isinstance(d, (int, str)) and not isinstance(d, bool):
        out[prefix] = d
    return out

def load_pf_config():
    cfg = {}
    p = PF / 'src/Eccube/Resource/config/constant.yml.dist'
    for ln in p.read_text(encoding='utf-8').splitlines():
        m = re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([0-9]+)\s*(#.*)?$', ln)
        if m:
            cfg[(m.group(1),)] = int(m.group(2))
    # プラグイン config（ネスト）
    for pl in ['HareruyaEc', 'GmoPaymentGateway', 'SlnPayment']:
        f = PF / f'app/Plugin/{pl}/config.yml'
        if f.exists():
            try:
                y = yaml.safe_load(f.read_text(encoding='utf-8')) or {}
                for k, v in flat({pl: y.get('const', y)}).items():
                    cfg[k] = v
            except Exception:
                pass
    return cfg

def load_ee_config():
    cfg = {}
    p = EE / 'app/config/eccube/packages/eccube.yaml'
    for ln in p.read_text(encoding='utf-8').splitlines():
        m = re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([0-9]+)\s*(#.*)?$', ln)
        if m:
            cfg[(m.group(1),)] = int(m.group(2))
    return cfg

PF_CFG, EE_CFG = load_pf_config(), load_ee_config()

# ---------- ->add( ブロック分割 ----------
ADD = re.compile(r"->add\(\s*'([A-Za-z0-9_]+)'")
REMOVE = re.compile(r"->remove\(\s*'([A-Za-z0-9_]+)'\s*\)")

def blocks(text):
    """->add('field' ごとに、次の ->add( / ->remove( / 文末までを1ブロックとして返す。"""
    ms = list(ADD.finditer(text))
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else min(len(text), m.start() + 4000)
        yield m.group(1), m.start(), text[m.start():end]

LABEL = re.compile(r"'label'\s*=>\s*'([^']*)'")
# 'max' => の右辺を最大120文字の窓で捕る。窓内から定数参照/リテラルを探す
# （]で打ち切ると $this->config['stext_len'] が途中で切れて解決不能になるため）
LEN_MAX = re.compile(r"Length\(\s*(?:array\(|\[)\s*(?:'min'\s*=>\s*[^,]+,\s*)?'max'\s*=>\s*(.{0,120})", re.S)
MAXLEN_ATTR = re.compile(r"'max_length'\s*=>\s*(.{0,120})", re.S)
MAXLENGTH_HTML = re.compile(r"'maxlength'\s*=>\s*(.{0,120})", re.S)
NOTBLANK = re.compile(r"NotBlank\s*\(")
NOTNULL = re.compile(r"NotNull\s*\(")
REQUIRED_FALSE = re.compile(r"'required'\s*=>\s*false")
REQUIRED_TRUE = re.compile(r"'required'\s*=>\s*true")

CFG_PF = re.compile(r"config'?\]?\s*\[\s*'([A-Za-z0-9_]+)'\s*\](?:\s*\[\s*'([A-Za-z0-9_]+)'\s*\])?(?:\s*\[\s*'([A-Za-z0-9_]+)'\s*\])?(?:\s*\[\s*'([A-Za-z0-9_]+)'\s*\])?")
CFG_EE = re.compile(r"eccubeConfig\[\s*'([A-Za-z0-9_]+)'\s*\]")

def resolve(expr, system):
    """定数式を解決。解決できなければ (None, 式) を返し、推測で埋めない。"""
    if expr is None:
        return None, None
    e = expr.strip()
    lit = re.match(r'\s*(\d+)\s*[,\)\]]', e) or re.fullmatch(r'\s*(\d+)\s*', e)
    if lit:
        return int(lit.group(1)), 'literal'
    if system == 'ee':
        m = CFG_EE.search(e)
        if m and (m.group(1),) in EE_CFG:
            return EE_CFG[(m.group(1),)], m.group(1)
        return None, e.split('\n')[0][:60]
    m = CFG_PF.search(e)
    if m:
        keys = tuple(g for g in m.groups() if g)
        for n in range(len(keys), 0, -1):
            if keys[:n] in PF_CFG:
                return PF_CFG[keys[:n]], '.'.join(keys[:n])
    return None, e.split('\n')[0][:60]

def scan(root, system, globs):
    facts = []
    files = []
    for g in globs:
        files += list(root.glob(g))
    for f in files:
        if f.suffix != '.php':
            continue
        try:
            text = f.read_text(encoding='utf-8', errors='replace')
        except Exception:
            continue
        if '->add(' not in text:
            continue
        rel = str(f.relative_to(root))
        for field, off, blk in blocks(text):
            line = text.count('\n', 0, off) + 1
            lab = LABEL.search(blk)
            lm = LEN_MAX.search(blk)
            ml = MAXLEN_ATTR.search(blk)
            mh = MAXLENGTH_HTML.search(blk)
            val, src = resolve(lm.group(1) if lm else None, system)
            aval, asrc = resolve((ml or mh).group(1) if (ml or mh) else None, system)
            facts.append(dict(
                system=system, file=rel, line=line, field=field,
                label=lab.group(1) if lab else None,
                assert_max=val, assert_max_expr=src,
                attr_max=aval, attr_max_expr=asrc,
                notblank=bool(NOTBLANK.search(blk)) or bool(NOTNULL.search(blk)),
                required_false=bool(REQUIRED_FALSE.search(blk)),
                required_true=bool(REQUIRED_TRUE.search(blk)),
            ))
    return facts

if __name__ == '__main__':
    pf = scan(PF, 'pf', ['src/Eccube/Form/**/*.php', 'app/Plugin/*/Form/**/*.php'])
    ee = scan(EE, 'ee', ['src/Eccube/Form/**/*.php'])
    json.dump(pf + ee, open(OUT / 'factbase.json', 'w'), ensure_ascii=False)
    print(f'pf定数: {len(PF_CFG)}  ee定数: {len(EE_CFG)}')
    print(f'pf事実: {len(pf)}  ee事実: {len(ee)}')
    for sysname, fs in (('pf', pf), ('ee', ee)):
        lab = [f for f in fs if f['label']]
        mx = [f for f in fs if f['assert_max'] is not None]
        un = [f for f in fs if f['assert_max'] is None and f['assert_max_expr']]
        print(f'  {sysname}: label付き={len(lab)}  max解決済={len(mx)}  max未解決(確定不能)={len(un)}')
