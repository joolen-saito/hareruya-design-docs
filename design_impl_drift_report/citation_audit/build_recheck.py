#!/usr/bin/env python3
"""再事実確認・批判的レビュー用パケットを作る。

対象: drift_findings_list_final.tsv のうち、前回の批判的レビュー(rv_*)を
受けていない全行（実装違い663件 + 根拠区分UNCERTAIN 32件）。
各findingには mech_check.py の機械検証フラグを添える。
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
          '対応の根拠(現develop)', '再確認HEAD']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
mech = {m['rowId']: m for m in json.load(open(MECH, encoding='utf-8'))}

target = [(i, r) for i, r in enumerate(rows, 1) if not r['レビュー結果']]

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)

target.sort(key=lambda x: (x[1]['機能No'], x[0]))   # 同一機能はまとめて調べる方が確実


def mflags(i):
    m = mech.get(i, {})
    d = {'quote': m.get('quoteVerdict'), 'stale': m.get('staleVerdict')}
    if m.get('implVerdict') == 'FILE_MISSING':
        d['implFile'] = 'FILE_MISSING'
    if m.get('implVerdict') == 'LINE_OUT':
        d['implLine'] = 'LINE_OUT'
    if m.get('staleFiles'):
        d['changedFiles'] = m['staleFiles'][:5]
    if m.get('quoteVerdict') in ('EMBED_ONLY', 'NOT_FOUND'):
        d['quoteDetail'] = [q['quote'] for q in m.get('quotes', []) if q['found'] == m['quoteVerdict']][:3]
    return d


for n in range(0, len(target), CHUNK):
    part = target[n:n + CHUNK]
    pid = f"rc_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': 'rowId は drift_findings_list_final.tsv の行番号(ヘッダ除く1始まり)。'
                       'mech は機械検証フラグ(手掛かりであって正解ではない)。',
               'count': len(part),
               'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS},
                                 **{'mech': mflags(i)}) for i, r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

npkt = (len(target) + CHUNK - 1) // CHUNK
print(f"レビュー対象 {len(target)}件 -> {npkt}パケット")
print('指摘区分:', dict(Counter(r['指摘区分'] for _, r in target)))
print('根拠区分:', dict(Counter(r['根拠区分'] for _, r in target)))
print('機械フラグ quote:', dict(Counter(mech[i]['quoteVerdict'] for i, _ in target)))
print('機械フラグ stale:', dict(Counter(mech[i]['staleVerdict'] for i, _ in target)))
sizes = [os.path.getsize(p) for p in glob.glob(os.path.join(OUT, '*.json'))]
print(f'パケットサイズ: 平均 {sum(sizes)//len(sizes)//1024}KB 最大 {max(sizes)//1024}KB')
