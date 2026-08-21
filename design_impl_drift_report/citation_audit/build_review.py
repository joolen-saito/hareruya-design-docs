#!/usr/bin/env python3
"""根拠区分の批判的レビュー用パケットを作る。

対象: 指摘区分=未実装 かつ 根拠区分が SPEC_BACKED / LEGACY_BACKED の行。
「設計書に書かれているのに未実装」と「書かれておらず未実装」の切り分けが
正しいかを検証するのが目的。
"""
import csv, json, os, glob

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_verified.tsv')
OUT = os.path.join(BASE, 'review_packets')
CHUNK = 15

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照',
          '根拠区分', '正本根拠', '旧実装根拠', '現実装', '根拠検証メモ']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
target = [(i, r) for i, r in enumerate(rows, 1)
          if r['指摘区分'] == '未実装' and r['根拠区分'] in ('SPEC_BACKED', 'LEGACY_BACKED')]

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)

# 分類が混ざるように並べる（同一分類が固まると引きずられやすい）
target.sort(key=lambda x: (x[1]['機能No'], x[0]))

for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"rv_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': 'rowId は drift_findings_list_verified.tsv の行番号(ヘッダ除く1始まり)',
               'count': len(part),
               'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS}) for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

from collections import Counter
print(f"レビュー対象 {len(target)}件 -> {(len(target)+CHUNK-1)//CHUNK}パケット")
print('内訳:', dict(Counter(r['根拠区分'] for _, r in target)))
