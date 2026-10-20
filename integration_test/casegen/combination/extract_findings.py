#!/usr/bin/env python3
"""codex のレビューの出力（review/R<巡>_NN_out.txt）から最後の答え（「tokens used」の次の行より後ろ）を取り出し、
review/R<巡>_NN_findings.md に書く。束ごとの指摘の数を R<巡>_bundles.tsv の「指摘」列に入れる。 extract_findings.py <巡>
答えが無い（at capacity などで止まった）束は名前を出して終わる（流し直す）。"""
import csv, pathlib, re, sys
G = pathlib.Path(__file__).resolve().parent / "review"
rnd = sys.argv[1]
B = list(csv.DictReader(open(G / f"R{rnd}_bundles.tsv", encoding="utf-8"), delimiter="\t"))
bad = []
for r in B:
    o = G / f"{r['束']}_out.txt"
    ls = o.read_text(encoding="utf-8").split("\n") if o.exists() else []
    ix = [i for i, l in enumerate(ls) if l.startswith("tokens used")]
    if not ix:
        bad.append(r["束"]); continue
    ans = "\n".join(ls[ix[-1] + 2:]).strip() + "\n"
    if not ans.strip():   # at capacity などで答えが空（「tokens used」は出る）
        bad.append(r["束"]); continue
    (G / f"{r['束']}_findings.md").write_text(ans, encoding="utf-8")
    r["指摘"] = str(len(re.findall(r"^### 指摘", ans, re.M)))
with open(G / f"R{rnd}_bundles.tsv", "w", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(B[0].keys()), delimiter="\t", lineterminator="\n")
    w.writeheader(); w.writerows(B)
print("指摘", sum(int(r["指摘"] or 0) for r in B), "束", len(B), "答えの無い束", bad)
