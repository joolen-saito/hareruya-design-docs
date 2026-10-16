#!/usr/bin/env python3
"""review/prompt_<群>_r<巡>.md を作る。 make_review.py <巡> <群>..."""
import csv, pathlib, sys
P = pathlib.Path(__file__).resolve().parent
rnd, codes = sys.argv[1], sys.argv[2:]
tpl = (P / "REVIEW_TEMPLATE.md").read_text(encoding="utf-8")
groups = {g["群"]: g for g in csv.DictReader((P / "groups.tsv").open(encoding="utf-8"), delimiter="\t")}
for code in codes:
    g = groups[code]
    n = sum(1 for l in (P / f"cases/{code}_test_cases.tsv").open(encoding="utf-8")) - 1
    tg = (f"| 群 | 方向 | 判定ID | 上流機能 | 件数 |\n| --- | --- | --- | --- | --- |\n"
          f"| {code} | {g['方向']} | {g['判定ID']} | {g['上流機能']} | {n} |\n\n手がかり（依頼文）: {g['手がかり']}")
    prior = ""
    if rnd != "1":
        prior = (f"- 前の巡の指摘と裁定: `review/{code}_r{int(rnd)-1}_findings.md` と `review/{code}_r{int(rnd)-1}_dispositions.tsv`。"
                 "裁定で却下した指摘は理由を読み、新しい根拠が無ければ再提示するな。直した箇所が正しく直っているか、直したことで新しい誤りが出ていないかを見よ。"
                 "\n- 前の巡の反映で**追加したケース**はどのレビューも通っていない。新しいケースとして1巡目と同じ深さで検証せよ。"
                 "著者が最初の報告（`gen_<群>/report.md` の前半）で設計書の食い違いを理由に外した組を、反映で採用している場合は、その食い違いがどう解消したかを設計書で確かめよ。"
                 "裁定ファイルに「著者の自己申告」の行があれば、その結論も検証せよ。")
    s = tpl.replace("{CODES}", code).replace("{ROUND}", rnd).replace("{TARGETS}", tg).replace("{PRIOR}", prior)
    (P / f"review/prompt_{code}_r{rnd}.md").write_text(s, encoding="utf-8")
    print(P / f"review/prompt_{code}_r{rnd}.md")
