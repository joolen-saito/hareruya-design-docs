#!/usr/bin/env python3
"""改修区分・工数の批判的レビュー用パケットを作る。対象は改修対象(P1-P4)の全行。"""
import csv, json, os, re, glob

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_effort.tsv')
OUT = os.path.join(BASE, 'effort_packets')
CHUNK = 28


def cut(s, n):
    return re.sub(r'[\s　]+', ' ', s or '')[:n]


rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
target = [(i, r) for i, r in enumerate(rows, 1) if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]
target.sort(key=lambda x: (x[1]['機能No'], x[0]))   # 同一機能はまとめて見せる

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)

for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"ef_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': 'authorCat は語スコアによる機械分類。約2割が誤りで重い区分へ寄る傾向がある。'
                       '同一機能の指摘が並んでいるので、まとめて直せるかも工数の判断材料にしてよい。',
               'findings': [{'rowId': i,
                             '機能No': r['機能No'], '機能名': r['機能名'],
                             '区分(画面種別)': r['区分(画面種別)'],
                             '指摘区分': r['指摘区分'], '優先度': r['優先度'],
                             '実害': r['再検証_実害'] or r['重要度'],
                             'authorCat': r['改修区分'], 'authorCatName': r['改修区分名'],
                             'authorEffort': r['工数中央'],
                             'authorHint': r['分類の手掛かり'],
                             '設計期待値': cut(r['設計期待値'], 300),
                             '実装実態': cut(r['実装実態'], 250),
                             '差分内容': cut(r['差分内容'], 400),
                             '実装参照': cut(r['実装参照'], 200)}
                            for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

npkt = (len(target) + CHUNK - 1) // CHUNK
sizes = [os.path.getsize(p) for p in glob.glob(os.path.join(OUT, '*.json'))]
print(f'対象 {len(target)}件 -> {npkt}パケット  平均{sum(sizes)//len(sizes)//1024}KB 最大{max(sizes)//1024}KB')
