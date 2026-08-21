#!/usr/bin/env python3
"""codex 根拠検証の結果を集計する。"""
import csv, json, glob, os, sys
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_open.tsv')

LABEL = {
    'SPEC_BACKED':   'Excel正本に裏付け（真の乖離）',
    'LEGACY_BACKED': '旧実装に根拠（真の乖離／設計書は記述漏れ）',
    'UNSUPPORTED':   '根拠なし（起票が誤り）',
    'ALREADY_MET':   '現developが既に充足（監査時点との差／判定誤り）',
    'UNCERTAIN':     '判断材料不足',
}
ORDER = ['SPEC_BACKED', 'LEGACY_BACKED', 'UNSUPPORTED', 'ALREADY_MET', 'UNCERTAIN']

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
verdict = {}
for p in glob.glob(os.path.join(BASE, 'results', '*.json')):
    for r in json.load(open(p, encoding='utf-8'), strict=False)['results']:
        verdict[int(r['rowId'])] = r

n = len(verdict)
c = Counter(v['verdict'] for v in verdict.values())
print(f"=== 判定済み {n} / {len(rows)} 件 ===")
for k in ORDER:
    if c.get(k):
        print(f"  {k:15s} {c[k]:4d}  {c[k]/n*100:5.1f}%   {LABEL[k]}")
real = c['SPEC_BACKED'] + c['LEGACY_BACKED']
print(f"\n真の乖離        {real:4d}  {real/n*100:5.1f}%")
print(f"起票が誤り      {c['UNSUPPORTED']:4d}  {c['UNSUPPORTED']/n*100:5.1f}%")
print(f"既に充足        {c['ALREADY_MET']:4d}  {c['ALREADY_MET']/n*100:5.1f}%")
print(f"判断保留        {c['UNCERTAIN']:4d}  {c['UNCERTAIN']/n*100:5.1f}%")

# 区分別
by = defaultdict(Counter)
for i, v in verdict.items():
    by[rows[i-1]['区分(画面種別)']][v['verdict']] += 1
print("\n=== 区分別 ===")
for k in sorted(by):
    cc = by[k]; t = sum(cc.values())
    bad = cc['UNSUPPORTED']; met = cc['ALREADY_MET']
    print(f"  {k:6s} {t:4d}件  誤り {bad:3d}({bad/t*100:4.1f}%)  既充足 {met:3d}({met/t*100:4.1f}%)")

# ドメイン別（誤り率の高い順）
dom = defaultdict(Counter)
for i, v in verdict.items():
    dom[rows[i-1]['ドメイン']][v['verdict']] += 1
print("\n=== ドメイン別 誤り率上位10 (5件以上) ===")
sc = []
for k, cc in dom.items():
    t = sum(cc.values())
    if t >= 5:
        sc.append((cc['UNSUPPORTED'] / t, k, t, cc['UNSUPPORTED'], cc['ALREADY_MET']))
for r_, k, t, bad, met in sorted(sc, reverse=True)[:10]:
    print(f"  {k:5s} {t:4d}件  誤り {bad:3d}({r_*100:4.1f}%)  既充足 {met:3d}")
