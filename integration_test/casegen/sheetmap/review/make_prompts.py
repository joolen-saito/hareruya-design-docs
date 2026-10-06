#!/usr/bin/env python3
"""レビュー依頼文を作る。 make_prompts.py <巡> [機能ID...]  → review/<機能ID>_r<巡>_prompt.md"""
import csv, pathlib, sys, collections
G = pathlib.Path(__file__).resolve().parents[1]
NOTE = {"M15-11": "- 対象シートに埋め込まれた「現行仕様」は F06-10（ポイント履歴）のもの（埋め込みの取り違え）なので根拠にしていない。M15-11 の現行仕様は機能設計書 `hareruya-design-docs/functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md` を直接の根拠にしており、出典は「M15-11 機能設計書 / <小見出し>」と書いている。"}
T = collections.OrderedDict(); N = {}
for r in csv.DictReader((G / "targets.tsv").open(encoding="utf-8"), delimiter="\t"):
    if r["扱い"] == "ケース作成":
        T.setdefault(r["機能ID"], []).append((r["書番"], r["シート名"])); N[r["機能ID"]] = r["機能名"]
rnd = sys.argv[1]
tpl = (G / "review/REVIEW_TEMPLATE.md").read_text(encoding="utf-8")
for f in sys.argv[2:] or T:
    s = (tpl.replace("{FID}", f).replace("{FNAME}", N[f]).replace("{BOOK}", T[f][0][0])
            .replace("{SHEETS}", "、".join(f"「{b} {n}」" for b, n in T[f])).replace("{NOTE}", NOTE.get(f, "")).replace("\n\n- 規約は", "\n- 規約は"))
    if rnd != "1":
        s = s.replace("## 意図的であり指摘対象外のもの\n", f"""## 前回からの経緯

これは{rnd}巡目である。1巡目の指摘は `sheetmap/review/{f}_r1_findings.md`、著者の処置は `sheetmap/review/{f}_r1_dispositions.md`。
依頼元の裁定が `sheetmap/FIX_R1_BRIEF.md` の表（A〜L）にある。**裁定に従っている箇所は指摘しない**（とくに A: 同じ冊子の別シートに書かれたその機能のふるまいは根拠にしてよい／B: 「観点内で確定」の判定単位は適用条件が設計書から言えれば期待結果を判定単位の文から決めてよい／C: 出力項目の構成と並びは IT-0156／H: 実装の制約で作れない状態は投入方法「未確定」で残す）。
今回見るのは、(1) 採用とした指摘が実際に直っているか、(2) 却下の理由が設計書の事実に合うか、(3) 直しで新しく入った誤り、(4) 裁定Aで根拠にした別シートの記述が原文どおりか、の4点である。1巡目に指摘せず、直しにも関係しない箇所の新規の指摘は、期待結果の明白な誤りに限る。

## 意図的であり指摘対象外のもの
""")
    (G / f"review/{f}_r{rnd}_prompt.md").write_text(s, encoding="utf-8")
    print(f)
