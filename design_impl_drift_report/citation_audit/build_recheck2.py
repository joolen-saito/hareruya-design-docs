#!/usr/bin/env python3
"""再事実確認 第2ラウンド用パケット。

対象: 前回の批判的レビュー(rv_*)済みだが、検証時HEAD(再確認HEAD)以降に
参照先の実装ファイルが変更されている行。分類は見たが「現在も再現するか」は
未確認のため、driftVerdict を取り直す。
"""
import csv, json, os, glob
from collections import Counter

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_final.tsv')
MECH = os.path.join(BASE, 'mech_check.json')
OUT = os.path.join(BASE, 'recheck_packets')
CHUNK = 12

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度', '観点',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照',
          '根拠区分', '正本根拠', '旧実装根拠', '現実装', '根拠検証メモ',
          '対応の根拠(現develop)', '再確認HEAD', 'レビュー結果', 'レビュー根拠']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
mech = {m['rowId']: m for m in json.load(open(MECH, encoding='utf-8'))}

target = [(i, r) for i, r in enumerate(rows, 1)
          if r['レビュー結果'] and mech[i]['staleVerdict'] == 'CHANGED']
target.sort(key=lambda x: (x[1]['機能No'], x[0]))

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, 'rc2_*.json')):
    os.remove(f)

for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"rc2_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': 'rowId は drift_findings_list_final.tsv の行番号(ヘッダ除く1始まり)。'
                       'これらは分類の批判的レビュー済み(レビュー結果列)だが、検証後に実装が'
                       '変更されている。classVerdict も再判定しつつ、driftVerdict を重点的に確認すること。',
               'count': len(part),
               'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS},
                                 **{'mech': {'quote': mech[i]['quoteVerdict'],
                                             'stale': 'CHANGED',
                                             'changedFiles': mech[i]['staleFiles'][:8]}})
                            for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

print(f"第2ラウンド対象 {len(target)}件 -> {(len(target)+CHUNK-1)//CHUNK}パケット")
print('指摘区分:', dict(Counter(r['指摘区分'] for _, r in target)))
print('根拠区分:', dict(Counter(r['根拠区分'] for _, r in target)))
print('前回レビュー:', dict(Counter(r['レビュー結果'] for _, r in target)))
