#!/usr/bin/env python3
"""chains.tsv の遷移先機能の取り違えを、連鎖IDを変えずに直す（依頼者決定 2026-10-06）。

build_chains.py は機能名だけで遷移先を引き当て、同名の別機能を先着で採っていた。
また「商品一覧」「カテゴリ一覧」のように管理画面とフロントで同じ画面名を持つものを、フロント側へ結び付けていた。
設計書HTMLがその後変わっていて作り直すと連鎖IDがずれる（923本→927本）ため、作り直さず該当行だけを直す。

直すのは 遷移先機能 と、遷移先機能の「入力」から機械的に補っていた 引継データ（「遷移先の入力:」で始まるもの）だけ。
正しい遷移先は、遷移元と同じブック（同じ業務領域）の機能から設計書で確かめた。確かめられないものは空欄にする。
"""
import csv, io, pathlib, sys
from build_chains import input_of

CG = pathlib.Path(__file__).resolve().parent
FIX = {}
def put(ids, fid, why):
    for i in ids.split():
        FIX[i] = (fid, why)

put("CH-0128 CH-0135 CH-0136 CH-0137 CH-0138 CH-0139 CH-0141 CH-0142 CH-0149 CH-0154 CH-0155 CH-0194 CH-0195 CH-0196",
    "M03-01", "0204 の「商品一覧画面」は管理画面の商品マスター。フロントの商品一覧（F03-01）ではない")
put("CH-0130", "M03-02", "0204 の「商品詳細/編集画面」は管理画面の商品登録編集。フロントの商品詳細（F03-02）ではない")
put("CH-0197 CH-0198 CH-0199 CH-0200 CH-0201 CH-0202",
    "M03-45", "0204 の「カテゴリ一覧画面」は管理画面のカテゴリ一覧。フロントのカテゴリ一覧（F03-04）ではない")
put("CH-0301 CH-0920", "M06-01", "店頭買取管理の「買取一覧画面」は自機能の一覧。フロントの買取履歴（F06-11）ではない")
put("CH-0332 CH-0335", "M07-01", "0206 の「買取一覧」はネット買取管理の自機能の一覧。フロントの買取履歴（F06-11）ではない")
put("CH-0334", "M07-04", "0206 の「メール通知設定画面」はネット買取管理の手動メール通知。フロントの通知（F02-05）ではない")
put("CH-0337 CH-0338 CH-0339 CH-0340 CH-0341 CH-0342 CH-0343 CH-0344 CH-0345 CH-0347 CH-0348",
    "M07-03", "0206 の「買取情報編集（買取詳細）画面」はネット買取管理。店頭買取管理の買取詳細（M06-03）ではない")
put("CH-0368 CH-0369", "M08-06", "0207 の「ポイント履歴画面」は会員管理のポイント履歴確認。フロントのポイント履歴（F06-10）ではない")
put("CH-0370", "M08-08", "0207 の「手動メール通知(確認画面)」は会員管理の手動メール通知。ネット買取管理（M07-04）ではない")
put("CH-0100", "M05-06", "0203 の「手動メール通知(確認画面)」は受注管理のメール一括送信の確認画面（HTML に機能No M05-06 とある）。ネット買取管理（M07-04）ではない")
put("CH-0622", "F03-01", "支店ECTOPからの遷移先は公開側の絞り込まれた商品一覧。管理画面のトップページ管理（M09-04）ではない")


def main(apply):
    p = CG / "chains.tsv"
    rows = list(csv.reader(p.open(encoding="utf-8"), delimiter="\t"))
    h = rows[0]; iid, idst, icar = h.index("連鎖ID"), h.index("遷移先機能"), h.index("引継データ")
    log = [["連鎖ID", "遷移元機能", "遷移先画面", "旧_遷移先機能", "新_遷移先機能", "旧_引継データ", "新_引継データ", "理由"]]
    for r in rows[1:]:
        if r[iid] not in FIX:
            continue
        new, why = FIX[r[iid]]
        old, oldc = r[idst], r[icar]
        newc = oldc
        if oldc.startswith("遷移先の入力:"):     # 誤った遷移先の入力から補っていたものは引き直す
            v = input_of(new) if new else ""
            newc = f"遷移先の入力: {v[:60]}" if v else ""
        log.append([r[iid], r[h.index("遷移元機能")], r[h.index("遷移先画面")], old, new, oldc, newc, why])
        r[idst], r[icar] = new, newc
    b = io.StringIO(); csv.writer(b, delimiter="\t", lineterminator="\n").writerows(log)
    (CG / "chains_dest_fix_log.tsv").write_text(b.getvalue(), encoding="utf-8")
    print(f"直す辺 {len(log) - 1} / 表に載せた {len(FIX)}")
    if apply:
        b = io.StringIO(); csv.writer(b, delimiter="\t", lineterminator="\n").writerows(rows)
        p.write_text(b.getvalue(), encoding="utf-8")
        print("chains.tsv を更新した")


if __name__ == "__main__":
    main("--apply" in sys.argv)
