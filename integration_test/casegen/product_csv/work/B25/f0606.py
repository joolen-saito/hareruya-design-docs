import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("F06-06")
PAT = re.compile(
    r"管理画面の商品登録編集画面で商品名に(?P<name>「[^」]+」|任意の名称)を入れ、商品公開ステータスで公開を選んで「商品を登録」を押し、表示された商品IDを控える（(?P<pl>〔[^〕]+〕)）。"
    r"「規格設定」から商品規格登録編集画面を開き、商品コードに (?P<code>[^、]+?)、(?P<pr>[^。]*?)部門に任意の部門を入れ、公開ステータスで公開を選んで「商品規格を登録」を押す。")
PRICE = {"F0606-ECA-010": 1000, "F0606-ECB-010": 2000}
UNUSED = {"S-F06-06-DISPLAY-017": ["F0606-017-A", "F0606-017-B"]}
out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    if sid.startswith("S-F06-06-QF-ORDER"):
        out.append([sid, "直さない", "", "", "M03-27 L0092・L0124、M03-02 L0075〜L0077",
            "既にグッズ商品CSV登録で商品を作っている（商品新規登録は使えない旨も書いてある）。商品公開ステータスの公開への直しも既存の商品の編集。気づいた点（直していない）: CSVの必須列が「入力チェックを通る任意の値」と曖昧で、確認モーダルでの確定の記述が無い。"])
        continue
    seq = list(UNUSED.get(sid, []))
    def block(m):
        nm = m.group("name")
        code = m.group("code")
        if code == "任意の未使用の商品コード":
            code = seq.pop(0)
        name = nm.strip("「」") if nm != "任意の名称" else code
        price = PRICE.get(code, 1000)
        s = csv_sentence([row(code, name, name, price, 100)])
        s += "。" + idnote(code, m.group("pl"))
        s += "。" + OPEN_EDIT + "、「規格設定」ボタンから商品規格一覧を開く。" + nm_edit("日本語")
        return s + "。"
    n = len(PAT.findall(old))
    new = PAT.sub(block, old)
    assert n >= 1 and not seq, sid
    assert "商品登録編集画面で商品名" not in new, sid
    why = "商品名・商品コード・公開状態は元のシードの値。元が「任意の金額」の価格は基準価格・販売価格1000円・買取価格100円にした。部門と公開ステータスはCSVで入れられないので、取り込み後に規格を開いて入れた。"
    if sid.endswith("010"):
        why = "商品名・商品コードは元のシードの値。販売価格は2商品の合計が3000円（元の「明細計=3000円」）になるよう結合商品Aを1000円・結合商品Bを2000円にした（基準価格も同額）。買取価格は100円。部門と公開ステータスは取り込み後に規格を開いて入れた。"
    elif sid.endswith("017"):
        why = "元が商品名・商品コードを「任意」としているので、商品コードは「F0606-017-A」「F0606-017-B」、商品名は商品コードと同じにした（シード専用の値）。価格は1000円・買取価格100円。部門と公開ステータスは取り込み後に規格を開いて入れた。"
    elif "任意の名称" in old:
        why = "元の商品名は「任意の名称」なので、商品名は商品コードと同じにした。価格は1000円・買取価格100円。部門と公開ステータスは取り込み後に規格を開いて入れた。"
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077、M03-09 L0077・L0130〜L0134"
    out.append([sid, "直す", new, "", basis, why])
write("F06-06", out)
