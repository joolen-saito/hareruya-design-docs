#!/usr/bin/env python3
"""review/prompt_<群>_r3.md を作る（3巡目＝2巡目の反映・合流前の置き換え・手直しだけを見る。../link_pub/make_review3.py と同じ）。 make_review3.py <群>..."""
import csv, pathlib, sys
P = pathlib.Path(__file__).resolve().parent
tpl = (P / "REVIEW3_TEMPLATE.md").read_text(encoding="utf-8")
log = list(csv.DictReader((P / "fix_idents_log.tsv").open(encoding="utf-8"), delimiter="\t"))
# 合流の直前に依頼元が手で直したもの（README.md の「結果」の節）
MANUAL = {
    "AB": "公開側にログインする会員（ケース専用シード S-A06-03-AB-ORDER-004・005、S-A06-05-AB-ORDER-003・004）のパスワードを、共有の管理者と同じ「Passw0rd-A0603AB」「Passw0rd-A0605AB」から、末尾にシードの番号を付けた「Passw0rd-A0603AB-004」などに変えた（シードの状態・属性と投入方法、それを使うケースの事前準備・手順）。同じ文字列が共有の管理者とケース専用の会員の両方にあると、前提条件の検査 G5 に掛かったため。記録は fix_idents_log.tsv の置換前「Passw0rd-A060xAB（会員）」の行。",
}
for code in sys.argv[1:]:
    n = sum(1 for r in log if r["群"] == code)
    m = f"\n**C. 手で直したもの**\n- {MANUAL[code]}\n" if code in MANUAL else ""
    s = tpl.replace("{CODE}", code).replace("{NLOG}", str(n)).replace("{MANUAL}", m)
    (P / f"review/prompt_{code}_r3.md").write_text(s, encoding="utf-8")
    print(P / f"review/prompt_{code}_r3.md")
