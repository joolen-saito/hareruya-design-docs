#!/usr/bin/env python3
"""未検証領域(admin/front)から無作為抽出して抜き打ち検証パケットを作る。

api/batch は ab_* パケットで全件カバー中のため対象外。
シードを固定し、再現可能な標本にする。
"""
import csv, json, os, random

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_open.tsv')
OUT = os.path.join(BASE, 'packets')
SEED = 20260728
N = 40
CHUNK = 20

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度', '観点',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照', '対応状況']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
pool = [(i, r) for i, r in enumerate(rows, 1) if r['区分(画面種別)'] in ('admin', 'front')]

rnd = random.Random(SEED)
picked = sorted(rnd.sample(pool, min(N, len(pool))), key=lambda x: x[0])

for n in range(0, len(picked), CHUNK):
    part = picked[n:n + CHUNK]
    pid = f"spot_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': f'無作為抽出(seed={SEED}) admin/front母集団{len(pool)}件から{len(picked)}件',
               'count': len(part),
               'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS}) for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f"{pid}: {len(part)}件")

from collections import Counter
print(f"\n母集団 {len(pool)}件 から {len(picked)}件 抽出 (seed={SEED})")
print('区分:', Counter(r['区分(画面種別)'] for _, r in picked))
print('重要度:', Counter(r['重要度'] for _, r in picked))
print('指摘区分:', Counter(r['指摘区分'] for _, r in picked))
print('ドメイン:', Counter(r['ドメイン'] for _, r in picked).most_common(10))
