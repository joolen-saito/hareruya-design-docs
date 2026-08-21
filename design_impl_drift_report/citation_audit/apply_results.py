#!/usr/bin/env python3
"""codex 根拠検証の結果を TSV に反映する。

- 全行に 根拠区分 / 正本根拠 / 旧実装根拠 / 現実装 / 根拠検証メモ を付与
- UNSUPPORTED(起票が誤り) と ALREADY_MET(既に充足) を別ファイルへ除外
"""
import csv, json, glob, os

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(BASE, '..')
SRC = os.path.join(REPORT, 'drift_findings_list_open.tsv')
OPEN_TSV = os.path.join(REPORT, 'drift_findings_list_verified.tsv')
EXCL_TSV = os.path.join(REPORT, 'drift_findings_excluded_unsupported.tsv')

ADD = ['根拠区分', '正本根拠', '旧実装根拠', '現実装', '根拠検証メモ']
DROP = {'UNSUPPORTED', 'ALREADY_MET'}

def flat(s):
    return (s or '').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')

verdict = {}
for p in glob.glob(os.path.join(BASE, 'results', '*.json')):
    for r in json.load(open(p, encoding='utf-8'), strict=False)['results']:
        verdict[int(r['rowId'])] = r

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
fields = list(rows[0].keys()) + ADD

kept, excluded, unjudged = [], [], 0
for i, r in enumerate(rows, 1):
    v = verdict.get(i)
    if v is None:
        unjudged += 1
        r.update({k: '' for k in ADD})
        r['根拠区分'] = '未検証'
        kept.append(r)
        continue
    r.update({
        '根拠区分': v['verdict'],
        '正本根拠': flat(v.get('specEvidence')),
        '旧実装根拠': flat(v.get('legacyEvidence')),
        '現実装': flat(v.get('currentImpl')),
        '根拠検証メモ': flat(v.get('note')),
    })
    (excluded if v['verdict'] in DROP else kept).append(r)

for path, data in ((OPEN_TSV, kept), (EXCL_TSV, excluded)):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader(); w.writerows(data)

print(f"入力 {len(rows)} 件")
print(f"  残存(真の乖離+判断保留) {len(kept):4d} 件 -> {os.path.basename(OPEN_TSV)}")
print(f"  除外(起票誤り+既に充足) {len(excluded):4d} 件 -> {os.path.basename(EXCL_TSV)}")
if unjudged:
    print(f"  !! 未検証 {unjudged} 件（根拠区分=未検証 として残存側に温存）")
