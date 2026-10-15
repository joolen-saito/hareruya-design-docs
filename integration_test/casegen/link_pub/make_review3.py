#!/usr/bin/env python3
"""review/prompt_<群>_r3.md を作る（3巡目＝2巡目の反映・合流前の置き換え・手直しだけを見る）。 make_review3.py <群>..."""
import csv, pathlib, sys
P = pathlib.Path(__file__).resolve().parent
tpl = (P / "REVIEW3_TEMPLATE.md").read_text(encoding="utf-8")
log = list(csv.DictReader((P / "fix_idents_log.tsv").open(encoding="utf-8"), delimiter="\t"))
# 合流の直前に依頼元が手で直したもの（README.md の「結果」の節）
MANUAL = {
    "QH": "IT-M08-05-QH001 の事前準備③に「（ポイント履歴画面の現在のポイントの表示は1,000）」を足した。期待結果に出る変化前の値「1,000」が事前準備に無いと、前提条件の検査 G3 に掛かったため。",
    "QM": "IT-M15-05-QM001 にケース専用シード S-M15-05-QM-NODECK-001（このケースが登録するデッキが開始時に無いことを保証する）を足し、使用シードと事前準備に入れた。ケース専用シードを1件も使っていないと、前提条件の検査 G4 に掛かったため。",
    "PA": "IT-F04-02-PA001 の要求IDから REQ-0304-sheet-7-R014（0304 決済~購入完了 機能仕様「累計合計金額に今回の購入金額…」）を外した。このケースは受注の一覧・編集に注文が出ることを見るもので、累計金額は見ないため。",
}
for code in sys.argv[1:]:
    n = sum(1 for r in log if r["群"] == code)
    m = f"\n**C. 手で直したもの**\n- {MANUAL[code]}\n" if code in MANUAL else ""
    s = tpl.replace("{CODE}", code).replace("{NLOG}", str(n)).replace("{MANUAL}", m)
    (P / f"review/prompt_{code}_r3.md").write_text(s, encoding="utf-8")
    print(P / f"review/prompt_{code}_r3.md")
