#!/usr/bin/env python3
"""設計書参照の整合性を機械的に検査する。

各指摘の `設計書参照` は `<book>.html#sheet-N:行番号...` 形式。
参照された行番号が、そのシートの HTML 上の行範囲に収まっているかを判定する。
範囲外なら「別シートの内容を引用している」ことを意味し、根拠として成立しない。
"""
import csv, os, re, json, sys
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(BASE, '..')          # design_impl_drift_report
ROOT = os.path.join(REPORT, '..')          # hareruya-design-docs
SRC = os.path.join(REPORT, 'drift_findings_list_open.tsv')
OUTDIR = BASE

def sheet_ranges(path):
    """HTML 内の各 sheet-N の開始/終了行を返す（1始まり）。"""
    starts = []
    with open(path, encoding='utf-8', errors='replace') as f:
        for n, line in enumerate(f, 1):
            for m in re.finditer(r'<section[^>]*id="(sheet-\d+)"', line):
                starts.append((m.group(1), n))
            total = n
    ranges = {}
    for i, (sid, s) in enumerate(starts):
        e = starts[i + 1][1] - 1 if i + 1 < len(starts) else total
        ranges[sid] = (s, e)
    return ranges

REF = re.compile(r'([^/\s,]+\.html)#(sheet-\d+)(?::([\d,\-\s]+))?')

def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    cache = {}
    results = []
    for i, r in enumerate(rows, 1):
        ref = r['設計書参照']
        recs = []
        for m in REF.finditer(ref):
            fname, sid, lines = m.group(1), m.group(2), m.group(3)
            path = os.path.join(ROOT, 'excel_to_html', 'output', fname)
            if path not in cache:
                cache[path] = sheet_ranges(path) if os.path.exists(path) else None
            rng = cache[path]
            if rng is None:
                recs.append((fname, sid, 'FILE_MISSING', None, None)); continue
            if sid not in rng:
                recs.append((fname, sid, 'SHEET_MISSING', None, None)); continue
            lo, hi = rng[sid]
            if not lines:
                recs.append((fname, sid, 'NO_LINES', (lo, hi), [])); continue
            nums = []
            for part in re.split(r'[,\s]+', lines.strip()):
                if not part: continue
                if '-' in part:
                    a, _, b = part.partition('-')
                    if a.isdigit() and b.isdigit(): nums += [int(a), int(b)]
                elif part.isdigit():
                    nums.append(int(part))
            out = [n for n in nums if not (lo <= n <= hi)]
            status = 'OK' if not out else ('ALL_OUT' if len(out) == len(nums) else 'PARTIAL_OUT')
            recs.append((fname, sid, status, (lo, hi), out))

        if not recs:
            verdict, detail = 'NO_REF', ref[:120]
        else:
            sts = [x[2] for x in recs]
            verdict = ('ALL_OUT' if all(s == 'ALL_OUT' for s in sts)
                       else 'FILE_MISSING' if 'FILE_MISSING' in sts
                       else 'SHEET_MISSING' if 'SHEET_MISSING' in sts
                       else 'PARTIAL_OUT' if any(s in ('ALL_OUT', 'PARTIAL_OUT') for s in sts)
                       else 'NO_LINES' if all(s == 'NO_LINES' for s in sts)
                       else 'OK')
            detail = '; '.join(
                f"{s}[{f}#{sd}" + (f" 範囲{rg[0]}-{rg[1]} 範囲外{o}]" if rg else "]")
                for f, sd, s, rg, o in recs)
        results.append({'row': i, '機能No': r['機能No'], '機能名': r['機能名'],
                        'ドメイン': r['ドメイン'], '区分': r['区分(画面種別)'],
                        '指摘区分': r['指摘区分'], '重要度': r['重要度'],
                        'verdict': verdict, 'detail': detail, '設計書参照': ref})

    os.makedirs(OUTDIR, exist_ok=True)
    json.dump(results, open(os.path.join(OUTDIR, 'citation_check.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    c = Counter(x['verdict'] for x in results)
    print(f"検査 {len(results)} 件")
    for k, v in c.most_common():
        print(f"  {k}: {v}")
    return c

if __name__ == '__main__':
    main()
