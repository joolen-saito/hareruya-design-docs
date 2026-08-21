#!/usr/bin/env python3
"""設計書(正本Excel)最新化の工数見積用パケットを作る。対象はクローズ済を除く全行。"""
import csv, json, os, re, glob
from collections import Counter

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_effort.tsv')
OUT = os.path.join(BASE, 'docupdate_packets')
CHUNK = 28


def cut(s, n):
    return re.sub(r'[\s　]+', ' ', s or '')[:n]


rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
target = [(i, r) for i, r in enumerate(rows, 1) if not r['トリアージ区分'].endswith('クローズ')]
# 同じ設計書シートの行を隣り合わせる（まとめ直しを判断させるため）
target.sort(key=lambda x: (x[1]['設計書参照'][:80], x[1]['機能No'], x[0]))

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)

for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"du_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': '同じ設計書シートの行が隣り合うよう並べてある。'
                       'まとめて直せる分は2件目以降を安く見積もってよい（sharedWithRowsに記す）。',
               'findings': [{'rowId': i,
                             '機能No': r['機能No'], '機能名': r['機能名'],
                             '区分(画面種別)': r['区分(画面種別)'],
                             '指摘区分': r['指摘区分'],
                             '確定根拠区分': r['確定根拠区分'],
                             'トリアージ区分': r['トリアージ区分'],
                             '設計書参照': cut(r['設計書参照'], 200),
                             '正本根拠': cut(r['正本根拠'], 350),
                             '設計期待値': cut(r['設計期待値'], 280),
                             '差分内容': cut(r['差分内容'], 350),
                             '実装実態': cut(r['実装実態'], 200)}
                            for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

npkt = (len(target) + CHUNK - 1) // CHUNK
sizes = [os.path.getsize(p) for p in glob.glob(os.path.join(OUT, '*.json'))]
print(f'対象 {len(target)}件 -> {npkt}パケット 平均{sum(sizes)//len(sizes)//1024}KB')
print('確定根拠区分:', dict(Counter(r['確定根拠区分'] for _, r in target)))
