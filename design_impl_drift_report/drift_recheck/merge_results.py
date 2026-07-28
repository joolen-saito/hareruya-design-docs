#!/usr/bin/env python3
"""再検証結果をマージし、残存/除外のTSVを出力する。

除外は2種類:
  1. 対応済み … 現 develop が設計期待値を完全に満たす（部分対応は残存側）
  2. 実装対象外 … NOT_PLANNED に列挙した機能。実装しない方針が決まっているもの
"""
import csv, json, os, glob, re, subprocess, sys

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(BASE, '..')
SRC = os.path.join(REPORT, 'drift_findings_list_filtered.tsv')
OPEN_TSV = os.path.join(REPORT, 'drift_findings_list_open.tsv')
EXCL_TSV = os.path.join(REPORT, 'drift_findings_excluded_resolved.tsv')
NOTPLAN_TSV = os.path.join(REPORT, 'drift_findings_excluded_not_planned.tsv')

# 実装しない方針が決まっている機能（2026-07-28 指示）
NOT_PLANNED = ['B16-05', 'B16-07', 'B16-08', 'B16-12', 'B13-02', 'B02-04', 'B08-01']
NOT_PLANNED_RE = re.compile(r'^(' + '|'.join(map(re.escape, NOT_PLANNED)) + r')(?![0-9])')

EE = '/home/y-saito/Developments/ec-cube-enterprise'
head = subprocess.check_output(['git', '-C', EE, 'rev-parse', '--short=10', 'HEAD'], text=True).strip()

verdict = {}
missing_packets = []
for path in sorted(glob.glob(os.path.join(BASE, 'packets', '*.json'))):
    pid = os.path.basename(path)[:-5]
    rp = os.path.join(BASE, 'results', pid + '.json')
    if not os.path.exists(rp):
        missing_packets.append(pid)
        continue
    for r in json.load(open(rp, encoding='utf-8'), strict=False)['results']:
        verdict[int(r['rowId'])] = r

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
fields = list(rows[0].keys()) + ['対応状況', '対応の根拠(現develop)', '再確認HEAD']

kept, excluded, not_planned, unjudged = [], [], [], []
for i, r in enumerate(rows, start=1):
    v = verdict.get(i)
    if v is None:
        unjudged.append(i)
        r.update({'対応状況': '未判定', '対応の根拠(現develop)': '', '再確認HEAD': ''})
    else:
        r.update({'対応状況': v['status'],
                  '対応の根拠(現develop)': v.get('evidence', '').replace('\t', ' ').replace('\n', ' '),
                  '再確認HEAD': head})

    # 実装対象外の機能は再検証結果によらず除外する
    if NOT_PLANNED_RE.match(r['機能No']):
        r['対応状況'] = '実装対象外'
        not_planned.append(r)
    elif v is not None and v['status'] == '対応済み':
        # 完全対応のみ除外。部分対応・未対応は残す。
        excluded.append(r)
    else:
        kept.append(r)

for path, data in ((OPEN_TSV, kept), (EXCL_TSV, excluded), (NOTPLAN_TSV, not_planned)):
    with open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(data)

print(f"入力 {len(rows)} 件 / 残存 {len(kept)} 件 -> {os.path.basename(OPEN_TSV)}")
print(f"           除外(対応済み)   {len(excluded)} 件 -> {os.path.basename(EXCL_TSV)}")
print(f"           除外(実装対象外) {len(not_planned)} 件 -> {os.path.basename(NOTPLAN_TSV)}")
if missing_packets:
    print(f"!! 未処理パケット {len(missing_packets)}: {', '.join(missing_packets[:10])}", file=sys.stderr)
if unjudged:
    print(f"!! 未判定行 {len(unjudged)} 件（対応状況=未判定 として残存側に温存）", file=sys.stderr)
