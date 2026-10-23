#!/usr/bin/env python3
"""codex へのケースのレビュー依頼文を作る。 mk_review.py <巡> <束の名前> <機能ID>...  → review/R<巡>_<束>_prompt.md

2巡目は、前の巡の指摘（review/R1_*_findings.md）と処置（review/<機能ID>_R1_dispositions.tsv）を読ませる。
"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
rnd, name, args = sys.argv[1], sys.argv[2], sys.argv[3:]
kind = {r["機能ID"]: r["種類"] + (f"（{r['対になる機能']} と同一エンドポイント）" if r["対になる機能"] else "")
        for r in csv.DictReader(open(G / "targets.tsv", encoding="utf-8"), delimiter="\t")}
rows = [f"| {f} | {kind[f]} | `fp_gap/cases/{f}_fg_test_cases.tsv`・`{f}_fg_seed_data.tsv`・`{f}_fg_items.tsv`・`{f}_fg_dispositions.tsv` |" for f in args]
prev = "" if rnd == "1" else f"""
## 前の巡

{int(rnd) - 1}巡目の指摘が `fp_gap/review/R{int(rnd) - 1}_*_findings.md`、著者の処置が `fp_gap/review/<機能ID>_R{int(rnd) - 1}_dispositions.tsv` にある。却下の理由が設計書の原文に照らして妥当なら、同じ指摘を繰り返さない。採用したはずの指摘が実際に直っているか、直した結果に新しい誤りが入っていないかを見て、新しい事実の指摘だけを挙げる。
"""
s = (G / "REVIEW_PROMPT.md").read_text(encoding="utf-8")
s = s.replace("{ROUND}", rnd).replace("{NAME}", name).replace("{TARGETS}", "\n".join(rows)).replace("{PREV}", prev)
(G / "review").mkdir(exist_ok=True)
out = G / f"review/R{rnd}_{name}_prompt.md"
out.write_text(s, encoding="utf-8")
print(out.relative_to(G))
