#!/usr/bin/env python3
"""アプリ定義(FormType)を正とした時に DB登録/更新できない項目の検出 — 厳密版。

前版の欠陥: field名だけでDB列を引いたため、同名列が複数Entityにあると断定できず
            Assert\\Length保持481件中50件(10%)しか結合できなかった。

本版: FormType の `data_class` で **Entityを一意に確定** してから、そのEntityの
      プロパティ/列に対してのみ突き合わせる。data_class が無い FormType は
      「判定対象外(Entity不明)」として明示的に除外し、0件を「問題なし」と誤読させない。

検出:
  F1 長さ超過   : Assert\\Length(max=M) > DB列長 L
                 ee=PostgreSQL varchar(n): 超過は ERROR → **登録/更新不能**
                 pf=MySQL: strict=ERROR / 非strict=切り捨て(サイレント破損)
  F2 NOTNULL違反: DB列 nullable:false かつ Form に NotBlank/NotNull 無し
  F3 検証欠落   : DB列に length があるのに Form に Assert\\Length が無い
                 (attr maxlength だけの場合を含む。クライアント側は回避可能)

すべて実装内部の自己矛盾のみ。設計書(HTML)は一切参照しない。
"""
from __future__ import annotations
import json, re
from pathlib import Path
from collections import defaultdict, Counter

PF = Path('/home/y-saito/Developments/pf-eccube3')
EE = Path('/home/y-saito/Developments/ec-cube-enterprise')
SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')

form = json.load(open(SP / 'factbase.json'))
db = json.load(open(SP / 'dbfacts.json'))

# ---- FormTypeファイル -> data_class(Entity短名) を決定的に取る ----
DC_EE = re.compile(r"'data_class'\s*=>\s*([A-Za-z0-9_]+)::class")
DC_PF = re.compile(r"'data_class'\s*=>\s*'([^']+)'")

def form_entity(system, relfile):
    root = PF if system == 'pf' else EE
    p = root / relfile
    if not p.exists():
        return None
    t = p.read_text(encoding='utf-8', errors='replace')
    m = DC_EE.search(t) or DC_PF.search(t)
    if not m:
        return None
    return m.group(1).split('\\')[-1]

# ---- Entity短名 -> {プロパティ/列: dbfact} ----
ent_idx = defaultdict(dict)
for x in db:
    short = x['entity'].split('\\')[-1]
    ent_idx[(x['system'], short)][x['field']] = x
    ent_idx[(x['system'], short)][x['column']] = x

# 検索専用フォーム = 永続化しない → 対象外
SEARCH = re.compile(r'Search|search')

cache = {}
rows = []
stats = Counter()
for f in form:
    key = (f['system'], f['file'])
    if key not in cache:
        cache[key] = form_entity(*key)
    ent = cache[key]
    if SEARCH.search(Path(f['file']).stem):
        stats[f"{f['system']}: 検索フォーム(永続化しない→対象外)"] += 1
        continue
    if not ent:
        stats[f"{f['system']}: data_class無し(Entity不明→判定対象外)"] += 1
        continue
    c = ent_idx.get((f['system'], ent), {}).get(f['field'])
    if not c:
        stats[f"{f['system']}: Entity特定済だが同名列なし(mapped:false等)"] += 1
        continue
    stats[f"{f['system']}: 厳密結合できた"] += 1

    m, L = f['assert_max'], c['length']
    base = dict(system=f['system'], engine=c['engine'], entity=ent,
                field=f['field'], column=c['column'],
                form_ref=f"{f['file']}:{f['line']}", db_ref=f"{c['file']}:{c['line']}",
                form_max=m, form_expr=f['assert_max_expr'], db_type=c['type'], db_len=L)

    # --- F1: 長さ超過。Assert\Length(max) が読めた行だけが対象＝偽陽性が原理的に出ない ---
    if m is not None and L is not None and m > L:
        rows.append(dict(base, cls='F1_長さ超過', impact=(
            'PostgreSQL varchar超過=ERROR → 登録/更新不能'
            if c['engine'] == 'postgresql' else
            'MySQL strict=ERROR / 非strict=切り捨て')))

    # --- F2/F3 は「制約が無いこと」の主張。委譲型を静的に追えないため断定しない ---
    # 実証済みの反例: ->add('email', 'repeated_email') は複合型 RepeatedEmailType 側に
    # NotBlank を持つ（pf EntryType.php:70 / ee は first_notblank_message を渡す）。
    # よって本パーサの「NotBlankが無い」は不在の証明にならない。
    # インライン制約が1つでも読めた行に限り「Lengthだけが無い」を候補として出す。
    inline_constraints = f['notblank'] or f['assert_max'] is not None
    if L is not None and m is None and inline_constraints:
        rows.append(dict(base, cls='F3候補_長さ検証欠落(要確認)',
                         impact=f'DB列は{L}文字上限。同じadd()内に他のAssertはあるが'
                                f'Assert\\Lengthが無い'
                                + ('（attr maxlengthのみ=クライアント側で回避可能）'
                                   if f['attr_max'] else '（表示属性すら無し）')))

json.dump(rows, open(SP / 'appdb_strict.json', 'w'), ensure_ascii=False)
print('=== 結合カバレッジ（0件を「問題なし」と誤読しないため必ず読むこと） ===')
for k, v in sorted(stats.items()):
    print(f'  {v:5d}  {k}')
print()
print('=== 検出結果（Entityをdata_classで一意確定できた分のみ） ===')
for k, v in Counter((r['cls'], r['system'], r['engine']) for r in rows).most_common():
    print(f'  {v:4d}  {k[0]}  {k[1]}({k[2]})')
for cls in ("F1_長さ超過", "F3候補_長さ検証欠落(要確認)"):
    sub = [r for r in rows if r['cls'] == cls]
    if not sub:
        continue
    print(f'\n--- {cls} {len(sub)}件 ---')
    for r in sub[:12]:
        print(f"  [{r['system']}/{r['engine'][:5]}] {r['entity']}.{r['column']:22s} form={r['form_max']} db={r['db_len']}({r['db_type']})")
        print(f"        form: {r['form_ref']}   db: {r['db_ref']}")
        print(f"        → {r['impact']}")
