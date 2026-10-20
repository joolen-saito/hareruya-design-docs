#!/usr/bin/env python3
"""codex の反証の束ごとに、直しの依頼文を2本ずつ作る。 mk_fix.py <束>... → prompts/<束>_fix1.md・_fix2.md"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
tpl = (G / "FIX_ROLLOUT_PROMPT.md").read_text(encoding="utf-8")
B = {}
for fn in ("V_bundles.tsv", "W_bundles.tsv", "X_bundles.tsv", "Y_bundles.tsv"):
    p = G / "review" / fn
    if p.exists():
        B.update({r["束"]: r["機能ID"].split("・") for r in csv.DictReader(open(p, encoding="utf-8"), delimiter="\t")})
for b in sys.argv[1:]:
    fs = B[b]; h = (len(fs) + 1) // 2
    for i, part in enumerate([fs[:h], fs[h:]], 1):
        if part:
            t = tpl.replace("{FIDS}", "・".join(part)).replace("{REVIEW}", b)
            if b.startswith("X_"):   # 機能設計書を足した分の反証（2026-10-20）。前の処置の控えを上書きしない
                t = t.replace("_factors_v_dispositions.tsv", "_factors_x_dispositions.tsv").replace(
                    "3. 指摘とは別に、**rules_1020b.md の2つの決まりに当たる所が無いかを見直す**（3つ以上の要因をまとめた「効き合う」行、組の多い処理を特に）。当たる所は直す。",
                    "3. 写しの末尾に機能設計書を足してある（`##### 機能設計書` の行より後ろ）。機能設計書は埋め込みの現行仕様節と同じ扱いで、Excel 由来の本文・表示メッセージ節と食い違うときはそちらが優先する。"
                    "これまでの処置 `review/<機能ID>_factors_v_dispositions.tsv`・`_factors_md_dispositions.tsv` と食い違う直しをしない（変えるときは理由を書く）。決まりの見直しは済んでいるので、指摘に関わる所だけ直す。")
                assert "_factors_x_dispositions.tsv" in t and "機能設計書を足してある" in t
            if b.startswith("Y_"):   # 3つの決定の当て方の反証（2026-10-20）
                t = t.replace("_factors_v_dispositions.tsv", "_factors_y_dispositions.tsv").replace(
                    "3. 指摘とは別に、**rules_1020b.md の2つの決まりに当たる所が無いかを見直す**（3つ以上の要因をまとめた「効き合う」行、組の多い処理を特に）。当たる所は直す。",
                    "3. この指摘は、依頼者の3つの決定（`integration_test/casegen/combination/SWEEP_PROMPT.md` の表。打ち切り側は1回でよい／列ごとに独立して決まる値は組にしない／結果が同じ値はまとめる）の当て方についてのもの。"
                    "決定そのものは変えない。担当の処置 `review/<機能ID>_factors_s_dispositions.tsv` を読み、設計書で確かめて、当て方が誤っている所だけ直す。決まりの見直しはしない。")
                assert "_factors_y_dispositions.tsv" in t and "3つの決定" in t
            (G / f"prompts/{b}_fix{i}.md").write_text(t, encoding="utf-8")
            print(f"{b}_fix{i}", "・".join(part))
