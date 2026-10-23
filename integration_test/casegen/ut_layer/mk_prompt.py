#!/usr/bin/env python3
"""束ごとの依頼文を prompts/ に書く。 mk_prompt.py [束...]"""
import csv, pathlib, sys
D = pathlib.Path(__file__).resolve().parent
B = {r["束"]: r["機能ID"] for r in csv.DictReader(open(D / "batches.tsv", encoding="utf-8"), delimiter="\t")}
t = (D / "UT_PROMPT.md").read_text(encoding="utf-8")
for b in sys.argv[1:] or sorted(B):
    (D / f"prompts/{b}.md").write_text(t.replace("{FIDS}", "・".join(B[b].split(","))), encoding="utf-8")
print(len(sys.argv[1:] or B))
