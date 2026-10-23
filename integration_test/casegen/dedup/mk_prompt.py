#!/usr/bin/env python3
"""束ごとの依頼文を prompts/ に書く。 mk_prompt.py [束...]（引数なしは全部）"""
import csv, pathlib, sys
D = pathlib.Path(__file__).resolve().parent
B = {r["束"]: r["機能ID"] for r in csv.DictReader(open(D / "batches.tsv", encoding="utf-8"), delimiter="\t")}
for b in sys.argv[1:] or sorted(B):
    f = B[b]
    if f.startswith("_cross"):
        t = (D / "CROSS_PROMPT.md").read_text(encoding="utf-8").replace("{XFILE}", f)
    else:
        t = (D / "DEDUP_PROMPT.md").read_text(encoding="utf-8").replace("{FIDS}", "・".join(f.split(",")))
    (D / f"prompts/{b}.md").write_text(t, encoding="utf-8")
print(len(sys.argv[1:] or B))
