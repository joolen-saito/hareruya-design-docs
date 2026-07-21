#!/usr/bin/env python3
"""DB層エージェント出力の統合 — 役割分担で捏造をゼロにする。

設計:
  エージェント = 「どのEntityのどの列に保存されるか」の**対応付けのみ**（判断が要る仕事）
  パーサ       = その列の type / length / nullable の**値を供給**（事実）

エージェントが報告した値は一切採用しない。dbfacts.json（パーサ由来）で引き直す。
これによりエージェントが値を捏造しても結果に混入しない。
（実際に「pf memo は length:65535」という誤りを報告してきたが、実ファイルは type:text で length 無し）

エージェントの entity/column がパーサ側に存在しなければ 確定不能。
"""
from __future__ import annotations
import json, glob
from pathlib import Path
from collections import Counter, defaultdict

SP = Path('/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad')
db = json.load(open(SP / 'dbfacts.json'))
ledger = json.load(open(SP / 'ledger.json'))

# パーサ由来の索引: (system, Entity短名, column) -> fact
idx = {}
for x in db:
    idx[(x['system'], x['entity'].split('\\')[-1], x['column'])] = x
    idx[(x['system'], x['entity'].split('\\')[-1], x['field'])] = x

agent = {}
for f in glob.glob(str(SP / 'out_db' / '*.json')):
    for r in json.load(open(f)):
        agent[(r.get('book'), r.get('sheet'), r.get('no'))] = r

stats = Counter()
for r in ledger:
    a = agent.get((r['book'], r['sheet'], r['no']))
    if not a:
        continue
    if a.get('persists') is False:
        r['db_note'] = 'persists:false(DBに保存されない=検索条件/平文パスワード/確認欄)'
        stats['persists:false'] += 1
        continue
    for side, sysname in (('pf_db', 'pf'), ('ee_db', 'ee')):
        d = a.get(side) or {}
        if not d.get('found'):
            stats[f'{sysname}:agent found=false'] += 1
            continue
        ent = (d.get('entity') or '').split('\\')[-1]
        col = d.get('column')
        fact = idx.get((sysname, ent, col))
        if not fact:
            stats[f'{sysname}:対応付け先がパーサ側に無い→確定不能'] += 1
            continue
        # 値は必ずパーサから。エージェントの value は捨てる。
        r[f'{sysname}_db_len'] = fact['length']
        r[f'{sysname}_db_type'] = fact['type']
        r[f'{sysname}_db_bytes'] = fact.get('byte_limit')
        r[f'{sysname}_db_ref'] = f"{fact['file']}:{fact['line']} ({ent}.{fact['column']} {fact['type']}"\
                                 + (f" length:{fact['length']}" if fact['length'] else '') + ')'
        stats[f'{sysname}:パーサで値を確定'] += 1
        if d.get('length') is not None and d.get('length') != fact['length']:
            stats[f'{sysname}:★エージェント値がパーサと不一致(エージェント値を破棄)'] += 1

json.dump(ledger, open(SP / 'ledger.json', 'w'), ensure_ascii=False)
print('=== DB層 統合結果（値はすべてパーサ由来） ===')
for k, v in sorted(stats.items()):
    print(f'  {v:4d}  {k}')

# D判定の再検討（Form上限が正。DB列長は出所の説明）
print('\n=== D判定のうち、DB列長が設計値と一致する行（値の出所の説明がつく） ===')
n = 0
for r in ledger:
    if not r['verdict'].startswith('D_'):
        continue
    for s in ('pf', 'ee'):
        dl = r.get(f'{s}_db_len')
        if dl is not None and dl == r['html_max']:
            print(f"  {r['book']} {r['label'][:16]:16s} 設計={r['html_max']} "
                  f"Form({s})={r[f'{s}_max']} ← 入力できる上限")
            print(f"        DB列={dl}  {r.get(f'{s}_db_ref')}")
            n += 1
            break
print(f'  計 {n} 件（設計値はDB列長を転記した可能性。ただし入力できないので画面仕様としては誤り）')
