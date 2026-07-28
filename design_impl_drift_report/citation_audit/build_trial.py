#!/usr/bin/env python3
"""codex 試行用パケットを作る。

api/batch 区分から、旧実装に根拠がありそうな指摘を優先して 20 件抽出する。
"""
import csv, json, os

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_open.tsv')
OUT = os.path.join(BASE, 'trial')
os.makedirs(OUT, exist_ok=True)

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度', '観点',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照', '対応状況']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))

# A02-02（既に人手で確証済み）を先頭に置き、codex の判定が一致するか較正に使う
anchor = [(i, r) for i, r in enumerate(rows, 1) if r['機能No'].startswith('A02-02')]
others = [(i, r) for i, r in enumerate(rows, 1)
          if r['区分(画面種別)'] in ('api', 'batch') and not r['機能No'].startswith('A02-02')]

picked = anchor[:2] + others[:20 - len(anchor[:2])]

packet = {
    'packetId': 'trial_01',
    'note': 'codex 試行用。rowId は drift_findings_list_open.tsv の行番号(ヘッダ除く1始まり)',
    'count': len(picked),
    'findings': [dict({'rowId': i}, **{k: r[k] for k in FIELDS}) for i, r in picked],
}
p = os.path.join(OUT, 'trial_01.json')
json.dump(packet, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"{p}: {len(picked)}件")
for i, r in picked:
    print(f"  row{i:5d} {r['機能No']:12s} {r['区分(画面種別)']:6s} {r['機能名'][:44]}")
