#!/usr/bin/env python3
"""MySQL(pf) → PostgreSQL(ee) 移行リスク と 設計値入力不能 の決定的検出。

設計書を参照しない検査(M1)と、設計書と突き合わせる検査(F4)の2本立て。

M1 移行時データ超過リスク:
    pf(MySQL) が `type: text`(=65,535バイト) の列を、ee(PostgreSQL) が varchar(N) に
    縮小している場合、既存データが N 文字を超えていると移行 INSERT が **ERROR** になる。
    （Postgres は切り捨てない）
    ※ 同名 Entity・同名列で突合。実データは見ていないので「リスク」であって「確定障害」ではない。

F4 設計値が入力不能:
    HTML設計値 == ee DB列長 なのに ee FormType の Assert\\Length がそれより小さい場合、
    設計どおりの長さを入力すると **フォーム検証で弾かれる**（DBには入る余地があるのに）。
"""
from __future__ import annotations
import json
from pathlib import Path
from collections import defaultdict, Counter

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')
db = json.load(open(SP / 'dbfacts.json'))
ledger = json.load(open(SP / 'ledger.json'))

# ---------- M1: text -> varchar 縮小 ----------
pf_by = {}
ee_by = {}
for x in db:
    short = x['entity'].split('\\')[-1]
    (pf_by if x['system'] == 'pf' else ee_by)[(short, x['column'])] = x

m1 = []
for key, e in ee_by.items():
    p = pf_by.get(key)
    if not p:
        continue
    # pf が text(バイト上限65535) で ee が varchar(N)
    if p['type'] == 'text' and e['type'] == 'string' and e['length']:
        m1.append(dict(
            entity=key[0], column=key[1],
            pf_type=p['type'], pf_byte_limit=p['byte_limit'],
            ee_type=e['type'], ee_len=e['length'],
            pf_ref=f"{p['file']}:{p['line']}", ee_ref=f"{e['file']}:{e['line']}",
        ))

# ---------- F4: 設計値が入力不能 ----------
f4 = []
for r in ledger:
    h, ef, ed = r.get('html_max'), r.get('ee_max'), r.get('ee_db_len')
    if h is None or ed is None or ef is None:
        continue
    if h == ed and ef < h:
        f4.append(r)

print(f'=== M1 移行リスク: pf(MySQL text=65535バイト) → ee(PostgreSQL varchar(N)) 縮小 ===')
print(f'    同名Entity・同名列で突合できた {len(m1)} 列で縮小を検出')
print(f'    → 既存データが N 文字を超えていると移行INSERTが ERROR（Postgresは切り捨てない）\n')
for x in sorted(m1, key=lambda y: y['ee_len'])[:25]:
    print(f"  {x['entity']}.{x['column']:26s} MySQL text(65535B) → varchar({x['ee_len']})")
    print(f"       pf: {x['pf_ref']}   ee: {x['ee_ref']}")
print(f'\n  ... 計 {len(m1)} 列')
print('\n  ee列長の分布:', Counter(x['ee_len'] for x in m1).most_common(8))

print(f'\n\n=== F4 設計値が入力不能（HTML設計値 == ee DB列長 > ee FormType上限） ===')
if not f4:
    print('  なし')
for r in f4:
    print(f"  {r['book']} {r['sheetTitle'][:14]:14s} {r['label'][:18]:18s}")
    print(f"       設計={r['html_max']} / ee DB列={r['ee_db_len']} / **ee Form上限={r['ee_max']}** → 設計値は入力できない")
    print(f"       form: {r['ee_ref']}   db: {r['ee_db_ref']}")

json.dump(dict(m1=m1, f4=f4), open(SP / 'migration_risk.json', 'w'), ensure_ascii=False)
