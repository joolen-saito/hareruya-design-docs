#!/usr/bin/env python3
"""批判的レビューの結果を TSV に反映する。

- REFUTED は correctedClass で 根拠区分 を上書きする
- レビュー結果(検証結果/訂正理由/確信度)を列として付与する
- 訂正の結果 UNSUPPORTED / ALREADY_MET になった行は除外側へ移す
- 未実装行に「設計記述の有無」を表す 実装状況区分 を付ける
"""
import csv, json, glob, os
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(BASE, '..')
SRC = os.path.join(REPORT, 'drift_findings_list_verified.tsv')
OUT = os.path.join(REPORT, 'drift_findings_list_final.tsv')
EXCL = os.path.join(REPORT, 'drift_findings_excluded_unsupported.tsv')

ADD = ['実装状況区分', 'レビュー結果', 'レビュー根拠', 'レビュー確信度']
DROP = {'UNSUPPORTED', 'ALREADY_MET'}

def flat(s):
    return (s or '').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')

rv = {}
for p in glob.glob(os.path.join(BASE, 'review_results', 'rv_*.json')):
    for r in json.load(open(p, encoding='utf-8'), strict=False)['results']:
        rv[int(r['rowId'])] = r

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
fields = list(rows[0].keys()) + ADD

# 既存の除外ファイルを引き継ぐ
prev_excl = []
if os.path.exists(EXCL):
    prev_excl = list(csv.DictReader(open(EXCL, encoding='utf-8'), delimiter='\t'))

kept, newly_excl = [], []
corrected = Counter()
for i, r in enumerate(rows, 1):
    v = rv.get(i)
    r.update({k: '' for k in ADD})
    if v:
        r['レビュー結果'] = v['verdict']
        r['レビュー根拠'] = flat(v.get('reason'))
        r['レビュー確信度'] = v.get('confidence', '')
        if v['verdict'] == 'REFUTED' and v.get('correctedClass'):
            corrected[(r['根拠区分'], v['correctedClass'])] += 1
            r['根拠区分'] = v['correctedClass']
            r['レビュー根拠'] = f"[{v['original']}→{v['correctedClass']}に訂正] " + r['レビュー根拠']

    # 未実装行に、設計記述の有無を明示する区分を付ける
    if r['指摘区分'] == '未実装':
        r['実装状況区分'] = {
            'SPEC_BACKED':   '設計記述あり・未実装',
            'LEGACY_BACKED': '設計記述なし・未実装(旧実装由来)',
        }.get(r['根拠区分'], '')

    (newly_excl if r['根拠区分'] in DROP else kept).append(r)

with open(OUT, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
    w.writeheader(); w.writerows(kept)

# 除外ファイルへ追記（既存列に合わせる）
if newly_excl:
    excl_fields = list(prev_excl[0].keys()) if prev_excl else fields
    for r in newly_excl:
        for k in excl_fields:
            r.setdefault(k, '')
    with open(EXCL, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=excl_fields, delimiter='\t',
                           lineterminator='\n', extrasaction='ignore')
        w.writeheader(); w.writerows(prev_excl + newly_excl)

print(f"入力 {len(rows)} 件")
print(f"  残存      {len(kept):4d} 件 -> {os.path.basename(OUT)}")
print(f"  追加除外  {len(newly_excl):4d} 件 -> {os.path.basename(EXCL)} (計 {len(prev_excl)+len(newly_excl)}件)")
if corrected:
    print("\nレビューによる訂正:")
    for (a, b), n in corrected.most_common():
        print(f"  {a} -> {b}: {n}件")
