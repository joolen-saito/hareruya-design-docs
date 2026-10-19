import re, sys
sys.path.insert(0, ".")
from lib import *

hdr, I = load("F02-03")
PAT = re.compile(
    r"(?:管理画面で店舗に支店「連携試験支店」を選んだ状態で、)?商品登録画面で(?P<head>カード指定ボタンからそのカードを選び、|カード指定をせずに|)商品名に(?P<name>「[^」]+」|任意の名称)を入れ、"
    r"(?P<cs>カードセットで[^、]+を選び、)?商品公開ステータスで公開、支店の商品公開ステータスで公開を選び、そのほかの必須項目には任意の有効な値を入れる。商品を登録ボタンを押す。"
    r"(?:(?:商品マスター一覧画面で商品名「[^」]+」の行に表示された商品IDを控える|登録後に開く商品登録編集画面に表示された商品IDを控える)(?:（(?P<pl>〔[^〕]+〕)）)?。"
    r"その商品の商品規格登録画面で(?P<spec>[^。]*?)公開ステータスで公開を選び、そのほかの必須項目には任意の有効な値を入れる。商品規格を登録ボタンを押す。商品規格編集画面に表示された商品規格IDを控える(?:（(?P<cl>〔[^〕]+〕)）)?。)?")

CARDSET = {"試験セットA": "〔カードセットID-F0203-共有A〕のカードセットのID", "試験セットB": "〔カードセットID-F0203-共有B〕のカードセットのID",
           "連携試験セット001": "連携試験セット001のカードセットのID（カードセット管理(一覧)で名称「連携試験セット001」の行に表示されたID）"}
used = []

def block(m):
    head = m.group("head"); nm = m.group("name")
    card = head.startswith("カード指定ボタン")
    spec = m.group("spec") or ""
    code_m = re.search(r"商品コードに([A-Za-z0-9\-]+)", spec)
    pr_m = re.search(r"販売価格に(\d+)円", spec)
    cs = m.group("cs")
    if code_m is None:
        code = "F0203-L-050"      # 元のシードは規格を作っていない。専用の商品コードを置く
    else:
        code = code_m.group(1)
    name = nm.strip("「」") if nm != "任意の名称" else code
    price = int(pr_m.group(1)) if pr_m else 1000
    buy = 100
    cardset = None
    if cs:
        k = re.search(r"カードセットで(.+?)を選び", cs).group(1)
        cardset = CARDSET[k]
    s = csv_sentence([row(code, name, name, price, buy, cardset=cardset)])
    if m.group("spec") is not None:
        s += "。" + idnote(code, m.group("pl"))
    if card:
        s += "。" + card_edit(name, name, "先にカード詳細（登録）画面で登録したカード")
        s += "。" + SPEC_LIST + "。" + nm_edit("日本語", label=m.group("cl"))
    elif m.group("spec") is not None:
        s += "。" + OPEN_EDIT + "、" + "「規格設定」ボタンから商品規格一覧を開く。" + nm_edit("日本語", label=m.group("cl"))
    used.append((code, card))
    return s + "。"

out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    n = len(PAT.findall(old))
    new = PAT.sub(block, old)
    if sid == "S-F02-03-L-PRODUCT-050":
        new = "管理画面で店舗に支店「連携試験支店」を選んだ状態で、" + new
    assert n >= 1, sid
    assert "商品登録画面" not in new and "商品規格登録画面" not in new, (sid, new)
    note = []
    why = ""
    if sid == "S-F02-03-L-PRODUCT-050":
        why = "元のシードは規格を作っていない（商品だけ登録）ので商品コードの指定が無い。グッズ商品CSVは商品コードが必須で、状態ニアミントの規格が1件できる（M03-27 L0124）ため、シード専用の商品コード「F0203-L-050」を置いた。ケースは商品を検索で見つけて一覧へ遷移させるだけで、規格が1件あっても崩れない。"
    elif sid == "S-F02-03-SEARCH":
        why = "カードセットは商品CSVのカードセット(ID)の列で入れた（M03-27 L0223）。3商品の公開ステータスは、元が公開と書いているので取り込み後に規格を開いて公開にした。"
    elif "CART-THRESHOLD" in sid:
        why = "元の商品名は「任意の名称」なので、商品名は商品コードと同じ「F0203-THRESHOLD」にした。"
    elif sid == "S-F02-03-CART-BASE":
        why = "カード商品はカード指定のあと商品名を元の値に入れ直し、割引率は販売割引率に登録済みのものから選ぶ。商品カテゴリは元が定めていないのでCSVのサプライ・グッズのまま。"
    else:
        why = "商品名・商品コード・価格・公開状態は元のシードの値。元が価格を書いていない商品は1000円・買取価格100円にした。"
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0111・L0128・L0129、M03-09 L0077・L0130〜L0134"
    out.append([sid, "直す", new, "", basis, why])
write("F02-03", out)
print(len(out), used)
