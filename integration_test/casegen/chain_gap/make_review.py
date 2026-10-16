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
    tg = (f"| 群 | 連鎖ID | 遷移元機能 | 遷移先機能 | 作成したケース |\n| --- | --- | --- | --- | --- |\n"
          f"| {code} | {g['連鎖ID']} | {g['遷移元機能']} | {g['遷移先機能']} | {n}件 |\n\n手がかり（依頼文）: {g['手がかり']}")
    prior = ""
    if rnd != "1":
        prior = (f"- 前の巡の指摘と裁定: `review/{code}_r{int(rnd)-1}_findings.md` と `review/{code}_r{int(rnd)-1}_dispositions.tsv`。"
                 "裁定で却下した指摘は理由を読み、新しい根拠が無ければ再提示するな。直した箇所が正しく直っているか、直したことで新しい誤りが出ていないかを見よ。"
                 "\n- 前の巡の反映で**追加したケース**と**変えた判定**はどのレビューも通っていない。1巡目と同じ深さで検証せよ。")
    s = tpl.replace("{CODES}", code).replace("{ROUND}", rnd).replace("{TARGETS}", tg).replace("{PRIOR}", prior)
    (P / f"review/prompt_{code}_r{rnd}.md").write_text(s, encoding="utf-8")
    print(P / f"review/prompt_{code}_r{rnd}.md")
