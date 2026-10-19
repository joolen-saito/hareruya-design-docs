import re
P = "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/"
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
OLDP = "管理画面の商品登録編集画面で商品名と必須項目に有効な値を入れて登録し、規格設定ボタンから開く商品規格登録編集画面で商品規格を1件登録する。商品登録編集画面で商品公開ステータスに「公開」を選んで登録する。"
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
def csvtext(code):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
            f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{code}-商品」・商品名(英)は「{code}-商品」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・基準価格1000・販売価格1000・買取価格100・原価単価10・部門IDは空）。"
            "グッズ商品は状態ニアミントの規格が1件作られる。")
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075〜L0077"
WHY = ("商品名は元が「必須項目に有効な値」だったので「商品コード-商品」とした。本店のフロントで買うので支店の商品公開ステータスは1（公開）にした。価格は元に指定が無いので基準価格・販売価格1000、買取価格100、原価単価10にした。"
       "商品IDは元のとおり在庫編集画面の商品ID欄から控える（呼び名は変えない）。在庫は元のとおり在庫検索一覧の在庫編集画面で入れる。"
       "CSVで作った商品の販売種別は設計書で確認できない（元も指定が無かったが、ゆうパックを選ぶ配送方法指定に響く恐れ）。")
NOGO = ("ケースの前提が「販売種別に先頭の商品種別」の商品（元の投入方法が明記）を要し、その商品でゆうパック・郵便振替の注文まで進む。グッズ商品CSVに販売種別の列が無く、設計書の商品規格登録編集画面（M03-09）の項目表にも販売種別が無いので、CSVと編集画面で販売種別を指定する手順を設計書から書けない（実装のProductClassTypeには販売種別の必須項目がある）。"
        "ケースに影響: 商品の販売種別を前提にした配送方法の選択。")
NOGO_BASIS = "M03-27 L0194〜L0238（CSVに販売種別の列が無い）、M03-09 L0059〜L0172（商品規格登録/編集の項目表に販売種別が無い）"
I = [l.rstrip("\n").split("\t") for l in open(P + "in/F04-03.tsv", encoding="utf-8")][1:]
out = ["\t".join(HDR)]
for c in I:
    sid, old = c[0], c[5]
    if sid == "S-F04-03-PA-ENV":
        out.append("\t".join([sid, "直さない", "", "", "", "商品を作る操作が無い（配送方法と商品種別の確認だけ）。文中の「商品の登録ではその商品種別を販売種別に入れる」は、これを使う S-F04-03-PA-ADDR-049〜051・S-F04-03-DP-ORD-056 が直せないため、そのまま残す。"]))
    elif old.startswith(OLDP):
        tail = sid.replace("S-F04-03-", "")
        code = "F0403-P-" + tail
        new = csvtext(code) + old[len(OLDP):]
        out.append("\t".join([sid, "直す", new, "", BASIS, WHY]))
    elif sid in ("S-F04-03-PA-ADDR-049", "S-F04-03-PA-ADDR-050", "S-F04-03-PA-ADDR-051", "S-F04-03-DP-ORD-056"):
        out.append("\t".join([sid, "直せない", "", "", NOGO_BASIS, NOGO]))
    else:
        raise SystemExit("unhandled " + sid)
# M03-02
J = [l.rstrip("\n").split("\t") for l in open(P + "in/M03-02.tsv", encoding="utf-8")][1:]
o2 = ["\t".join(HDR)]
for c in J:
    sid, old = c[0], c[5]
    if sid == "S-M03-02-NOTFOUND-003":
        why = "商品を作らない（商品ID=999999が無いことの確認と、あれば削除するだけ）。"
        basis = ""
    else:
        why = "既にグッズ商品CSV登録で商品を作り、商品登録編集画面では既存の商品を編集しているだけ（商品登録画面の新規は使っていない）。"
        basis = "M03-27 L0092・L0123・L0124、M03-02 L0075〜L0077"
        notes = []
        if "確認モーダル" not in old:
            notes.append("CSVのアップロード後の確認モーダルでの確定が書かれていない（M03-27 L0092）")
        if "任意の金額" in old or "任意の数値" in old:
            notes.append("CSVの基準価格・買取価格などが「任意の金額」「任意の数値」と曖昧（買取価格は販売価格以下が必要 M03-27 L0119）")
        if notes:
            why += "気づいた点（直していない）: " + "。".join(notes) + "。"
    o2.append("\t".join([sid, "直さない", "", "", basis, why]))
open(P + "out/F04-03.tsv", "w", encoding="utf-8").write("\n".join(out) + "\n")
open(P + "out/M03-02.tsv", "w", encoding="utf-8").write("\n".join(o2) + "\n")
