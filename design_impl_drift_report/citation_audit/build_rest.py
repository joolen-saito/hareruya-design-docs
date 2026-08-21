#!/usr/bin/env python3
"""未検証の admin/front 指摘を codex 検証パケットに分割する。

既に results/ にある rowId は除外する（trial/ab/spot 済み分）。
"""
import csv, json, os, glob

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_open.tsv')
OUT = os.path.join(BASE, 'packets')
CHUNK = 20

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度', '観点',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照', '対応状況']

done = set()
for p in glob.glob(os.path.join(BASE, 'results', '*.json')):
    for r in json.load(open(p, encoding='utf-8'), strict=False)['results']:
        done.add(int(r['rowId']))

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
target = [(i, r) for i, r in enumerate(rows, 1) if i not in done]

# 機能Noでまとめる（同一機能の資料を使い回せて効率が良い）
target.sort(key=lambda x: (x[1]['機能No'], x[0]))

manifest = []
for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"rest_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': 'rowId は drift_findings_list_open.tsv の行番号(ヘッダ除く1始まり)',
               'count': len(part),
               'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS}) for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    manifest.append({'packetId': pid, 'count': len(part)})

print(f"未検証 {len(target)}件 (判定済み{len(done)}件を除外) -> {len(manifest)}パケット")
from collections import Counter
print('区分:', dict(Counter(r['区分(画面種別)'] for _, r in target)))
