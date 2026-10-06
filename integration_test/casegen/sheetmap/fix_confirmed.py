#!/usr/bin/env python3
"""機能とシートの対応表（functions/function-sheet-map.tsv）の、既存の「確定」の取り違えを直す（2026-10-06）。

原因は Excel のシートの機能No欄の誤記（対応表は機能No欄が一致したシートを「確定」にしている）。
根拠は各冊子の目次と、シート名・シートの機能名欄。該当行を外し、正しい機能の行を足す。ほかの行は触らない。何度流しても同じ。
"""
import csv, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
P = ROOT / "functions/function-sheet-map.tsv"
D = "2026-10-06 人手で訂正"
# 外す行: (機能No, ブック, シートID): 理由（記録用）
DROP = {
 ("M04-09", "0202", "sheet-13"): "目次は「M04-08 在庫移動・振替検索一覧(検索・結果)」。シートの機能No欄が M04-09 と誤記",
 ("M05-24", "0203", "sheet-11"): "目次は「M05-07 送り状CSV出力」。シートの機能No欄が M05-24 と誤記",
 ("M07-05", "0206", "sheet-7"): "目次は「M07-06 買取商品一覧CSV」。シートの機能No欄が M07-05 と誤記",
 ("M07-05", "0206", "sheet-8"): "目次は「M07-07 【新規】買取商品（キャンセル）CSV」。シートの機能No欄が M07-05 と誤記",
 ("M07-08", "0206", "sheet-10"): "目次は「M07-09 【新規】戻しリストPDF」。シートの機能No欄が M07-08 と誤記",
 ("M15-02", "0212", "sheet-5"): "目次は「M15-05 デッキ編集」。シートの機能No欄が M15-02 と誤記",
 ("M15-06", "0212", "sheet-13"): "目次は「M15-10 アーキタイプ登録CSV」。シートの機能No欄が M15-06 と誤記",
 ("F06-10", "0212", "sheet-14"): "目次は「M15-11 直近の大会管理」。シートの機能No欄が F06-10 と誤記",
 ("M16-08", "0213", "sheet-7"): "目次は「M16-05 販売割引率一覧」。シートの機能No欄が M16-08 と誤記",
 ("F06-12", "0305", "sheet-11"): "機能一覧では買取履歴詳細は F06-15、F06-12 はまとめて買取査定結果。シートの機能No欄と目次が F06-12 と記載",
 ("M03-44", "0204", "sheet-46"): "CSV出力のシートで、機能一覧では出力は M03-43、M03-44 は登録（フォーマットのシート）。シートの機能No欄と目次が M03-44 と記載",
}
# 足す行: 機能No: (ブック, シートID, シート見出し, 一致根拠)
ADD = {
 "M15-02": ("0212", "sheet-4", "デッキ一覧(検索結果)", "目次に「M15-01, M15-02, M15-03, M15-04 デッキ一覧(検索結果)」と記載（デッキ編集のシートの機能No欄が M15-02 と誤記されていた）"),
 "M15-10": ("0212", "sheet-13", "アーキタイプ登録CSV", "目次に「M15-10 アーキタイプ登録CSV」と記載（シートの機能No欄は M15-06 と誤記）"),
 "M14-05": ("0208", "sheet-8", "カード登録CSV", "目次に「M14-05 カード登録CSV」と記載（シートに機能No欄が無い）"),
}


def main():
    rows = list(csv.reader(P.open(encoding="utf-8"), delimiter="\t"))
    out, dropped, last, meta = [rows[0]], set(), {}, {}
    for r in rows[1:]:
        k = (r[0], r[3], r[4])
        meta[r[0]] = (r[1], r[2])
        if k in DROP:
            dropped.add(k); last.setdefault(r[0], len(out) - 1); continue   # 行が無くなる機能は、元の位置に足す
        out.append(r); last[r[0]] = len(out) - 1
    have = {(r[0], r[3], r[4]) for r in out}
    added = 0
    for f, (b, sid, h, why) in sorted(ADD.items(), key=lambda kv: -last[kv[0]]):
        if (f, b, sid) in have:
            continue
        out.insert(last[f] + 1, [f, meta[f][0], meta[f][1], b, sid, h, f"{why}（{D}）", "1.00", "確定"]); added += 1
    with P.open("w", encoding="utf-8", newline="") as fh:
        fh.write("\n".join("\t".join(r) for r in out) + "\n")
    print(f"外した {len(dropped)} 行 / 足した {added} 行")


if __name__ == "__main__":
    main()
