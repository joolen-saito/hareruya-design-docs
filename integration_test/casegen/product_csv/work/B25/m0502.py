import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("M05-02")
PAT = re.compile(r"商品登録編集画面で商品名に(?P<names>「[^。]+?」)(?:をそれぞれ|を)入れ、ほかの必須項目を入力して登録し、商品規格の登録画面で販売価格と在庫を設定し、商品公開ステータスを公開にする(?:（商品ごとに1件ずつ登録する）)?。")
out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    num = sid.split("-")[-1]
    def block(m):
        names = re.findall(r"「([^」]+)」", m.group("names"))
        codes = [f"M0502-{num}-{chr(65+i)}" for i in range(len(names))] if len(names) > 1 else [f"M0502-{num}-A"]
        rows = [row(c, n, n, 1000, 100) for c, n in zip(codes, names)]
        s = csv_sentence(rows) + "。"
        for c, n in zip(codes, names):
            s += f"{OPEN_EDIT if False else ''}"
        s += "商品マスター(検索入力)で商品コードに各行の商品コードを1つずつ入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
        s += nm_edit("日本語") + ("（商品ごとに繰り返す）。" if len(codes) > 1 else "。")
        cs = "、".join(f"商品コード「{c}」・在庫増減数10・仕入単価100" for c in codes)
        s += (f"在庫変更CSV登録画面で店舗に本店を選び、在庫区分にEC-CUBE、在庫変動区分に入庫の区分、在庫変動理由に任意の文字、承認通知先（所属選択・メンバー選択）に承認できるメンバーを入れ、"
              f"{cs} の{len(codes)}行を書いたCSVファイルを選んで「一括登録を実行」を押す。在庫編集承認一覧画面で{'その行' if len(codes)==1 else 'これらの行'}を選び一括承認ボタンを押して承認する。")
        return s
    new, n = PAT.subn(block, old)
    assert n == 1, sid
    why = "商品名は元のシードの値、商品コードはシード専用の値（M0502-…）。元が価格を書いていないので基準価格・販売価格1000円・買取価格100円にした。元は「商品規格の登録画面で在庫を設定」としていたが、規格の画面では在庫数を変えられない（M03-09 L0095・L0097）ため、在庫は在庫変更CSV登録で本店のEC-CUBEに10入れて承認する。部門と公開ステータスは取り込み後に規格を開いて入れた。"
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077、M03-09 L0077・L0095・L0097・L0130〜L0134"
    out.append([sid, "直す", new, "", basis, why])
write("M05-02", out)
