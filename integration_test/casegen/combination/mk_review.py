#!/usr/bin/env python3
"""codex へのケースのレビュー依頼文を作る。 mk_review.py <巡> <束の名前> <機能ID[:組の開始-組の終了]>...  → review/R<巡>_<束>_prompt.md

組の範囲を書かないときは、その機能の組全部。ケースは cases/<機能ID>_cb_*.tsv（部に分けたものは combine_parts.py でつないだ後）を読ませる。
2巡目以降は、前の巡の指摘（review/R<前>_*_findings.md）と処置（review/<機能ID>_R<前>_dispositions.tsv）を読ませる。
"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
rnd, name, args = sys.argv[1], sys.argv[2], sys.argv[3:]
rows = []
for a in args:
    fid, _, rng = a.partition(":")
    r = rng.replace("-CB", "〜CB") if rng else "全部"
    rows.append(f"| {fid} | {r} | `combination/cases/{fid}_cb_test_cases.tsv`・`{fid}_cb_seed_data.tsv`・`{fid}_cb_dispositions.tsv`（組の範囲の行だけ） |")
prev = "" if rnd == "1" else f"""
## 前の巡

{int(rnd) - 1}巡目の指摘が `combination/review/R{int(rnd) - 1}_*_findings.md`、著者の処置が `combination/review/<機能ID>_R{int(rnd) - 1}_dispositions.tsv` にある。却下の理由が設計書の原文に照らして妥当なら、同じ指摘を繰り返さない。採用したはずの指摘が実際に直っているか、直した結果に新しい誤りが入っていないかを見て、新しい事実の指摘だけを挙げる。
"""
s = (G / "REVIEW_PROMPT.md").read_text(encoding="utf-8")
s = s.replace("{ROUND}", rnd).replace("{NAME}", name).replace("{TARGETS}", "\n".join(rows)).replace("{PREV}", prev)
out = G / f"review/R{rnd}_{name}_prompt.md"
out.write_text(s, encoding="utf-8")
print(out.relative_to(G))
