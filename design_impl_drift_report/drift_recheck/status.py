#!/usr/bin/env python3
"""再検証の進捗を集計する。"""
import json, glob, os
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
packets = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(BASE, 'packets', '*.json'))}
done = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(BASE, 'results', '*.json'))}
stale = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(BASE, 'results_stale', '*.json'))}

counts, judged = Counter(), 0
for pid in done:
    for r in json.load(open(os.path.join(BASE, "results", pid + ".json"), encoding="utf-8"), strict=False)['results']:
        counts[r['status']] += 1
        judged += 1

total = sum(json.load(open(os.path.join(BASE, 'packets', p + '.json'), encoding='utf-8'))['count'] for p in packets)
todo = sorted(packets - done)

print(f"パケット: 完了 {len(done)} / {len(packets)}　（要再実行 {len(stale)}）")
print(f"判定済み指摘: {judged} / {total}")
for k in ('対応済み', '部分対応', '未対応'):
    print(f"  {k}: {counts.get(k, 0)}")
print(f"\n未処理パケット {len(todo)}:")
print('  ' + ' '.join(todo))
