import re, sys
sys.path.insert(0, ".")
from lib import *

hdr, I = load("M04-33")
O = []
B_MAIN = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075-L0077・L0092・L0111・L0116・L0146、M03-09 L0130-L0134・L0154-L0155"
PROD = re.compile(r"\((\d)\) 商品登録編集画面で[^。]*。")
SPEC = re.compile(r"\((\d)\) 「規格設定」ボタンから商品規格登録編集画面を開き[^。]*。")
ITEM = re.compile(r"(?:([A-Z])の商品|商品の値): (.*?)。控える番号")
TAGDEF = re.compile(r"略称タグ登録画面で名称に「([^」]+)」.*?控える（〔(略称タグID-[^〕]+)〕）")
LANG = {"JP": "言語コード「JP」の言語のID", "EN": "言語コード「EN」の言語のID", "FR": "言語コード「FR」の言語のID"}
STATE_NAME = {"HP": "ヘビープレイド", "SP": "スライトリープレイド", "MP": "モデレトリープレイド"}

def fld(t, pat, default=None):
    m = re.search(pat, t)
    return m.group(1) if m else default

for r in I:
    sid, kind, lg, st, use, old, share, cases = r
    num = re.sub(r"\D", "", sid.split("-")[-1])
    tags = {}
    for m in TAGDEF.finditer(old):
        tags[m.group(1)] = m.group(2)
    items = []
    for m in ITEM.finditer(old):
        t = m.group(2)
        it = dict(letter=m.group(1), name=fld(t, r"商品名「([^」]+)」"), code=fld(t, r"商品コード「([^」]+)」"),
                  card=("カードは登録しない" not in t and "カードは" in t),
                  tag=fld(t, r"略称タグ「([^」]+)」"), cat=fld(t, r"商品カテゴリは([^、]+)、"),
                  lang=fld(t, r"言語コード「(\w+)」の言語", "JP"), state=fld(t, r"状態コード「(\w+)」の状態", "NM"),
                  base=fld(t, r"基準価格「(\d+)」"), sale=fld(t, r"販売価格「(\d+)」"),
                  sf=("ON" if "セールフラグをON" in t else ("OFF" if "セールフラグをOFF" in t else None)),
                  shelf=fld(t, r"棚番号「([^」]+)」"), cardtext=fld(t, r"(カードは[^、]*(?:、[^、]*)?)"))
        assert it["name"] and it["code"], (sid, t)
        it["base"] = int(it["base"]) if it["base"] else 100
        items.append(it)
    assert items, sid
    # CSV 行
    rows = []
    for it in items:
        c = it["code"]
        if it["state"] != "NM":
            c = extra_code(c)
        it["csvcode"] = c
        row = dict(code=c, name=it["name"], base=it["base"], buy=10, lang=LANG[it["lang"]])
        if it["tag"]:
            assert it["tag"] in tags, (sid, it["tag"])
            row["tag"] = "〔" + tags[it["tag"]] + "〕で控えた略称タグID"
        if len(items) > 1 and it["letter"]:
            row["role"] = None
        rows.append(row)
    # 商品の編集
    edits = []
    for it in items:
        names = (it["name"], it["name"]) if it["card"] else None
        cat = None
        if it["cat"] and it["cat"] != "任意のカテゴリ":
            cat = "、" + it["cat"] if False else it["cat"]
        card = "手順(1)で登録したこの商品のカードの詳細情報" if it["card"] else None
        e = edit_product(it["csvcode"], card=card, names=names, cat=cat) + "。この画面に表示された商品IDを控える"
        edits.append(((it["letter"] + "の商品: ") if it["letter"] else "") + e)
    prod_txt = csv_sentence(rows) + "。商品ごとに次の操作をする（" + "。".join(edits) + "）"
    # 規格
    specs = []
    for it in items:
        if it["state"] == "NM":
            s = "取り込みで作られた規格（言語・状態・基準価格・販売価格はCSVの値）の行を開き、商品規格登録編集画面で"
            ops = []
        else:
            s = ("「新規作成」ボタンを押し、商品規格登録編集画面で、商品コードに「" + it["code"] + "」、言語に言語コード「" + it["lang"] + "」の言語、状態に「" + STATE_NAME[it["state"]]
                 + "」、基準価格(円)・販売価格(円)に" + str(it["base"]) + "、買取価格(円)に10を入れ、")
            ops = []
        if it["shelf"]:
            ops.append("棚番号に「" + it["shelf"] + "」を入れ")
        if it["sf"] == "ON":
            ops.append("セールフラグにチェックを入れ、販売価格(円)に" + str(it["sale"]) + "を入れ")
        ops.append("部門は選択肢の先頭を選んで「商品規格を登録」ボタンを押し、この画面に表示された商品規格IDを控える")
        specs.append(((it["letter"] + "の商品: ") if it["letter"] else "") + "「規格設定」ボタンから商品規格一覧を開き、" + s + "、".join(ops))
    spec_txt = "。".join(specs)
    # 置換
    pm = PROD.search(old); sm = SPEC.search(old)
    assert pm and sm, sid
    new = old[:pm.start()] + f"({pm.group(1)}) " + prod_txt + "。" + old[pm.end():sm.start()] if False else None
    def rp(m): return f"({m.group(1)}) " + prod_txt + "。"
    def rs(m): return f"({m.group(1)}) " + spec_txt + "。"
    new = PROD.sub(rp, old, count=1)
    new = SPEC.sub(rs, new, count=1)
    assert new != old
    # 理由
    why = ("元は商品登録編集画面で商品名・略称タグ・商品カテゴリ・ほかの必須項目（任意の値）を入れていたので、商品名(英)は商品名(日)と同じ・サイズ重量1・購入グループ名称は既存の名称・日本語（言語指定がある商品は指定の言語）・公開・地域別販売制限0・基準価格＝販売価格・買取価格10にした。"
           "カテゴリはCSVではサプライ・グッズ配下しか選べない（M03-27 L0123）ので、取り込み後に商品登録編集画面で付け替える。割引率はCSVに列が無く編集で必須なので販売割引率に登録済みのものを選ぶ。")
    if any(i["tag"] for i in items):
        why += "略称タグは、元の手順で控えた略称タグIDをCSVの略称タグ(ID)列に入れる（M03-27 L0219）。"
    if any(i["card"] for i in items):
        why += "カード指定の商品は、元と同じく商品登録編集画面の「カード指定 >」で選び、カードで入る商品名を元の値に入れ直す。"
    if any(i["state"] != "NM" for i in items):
        hp = [i for i in items if i["state"] != "NM"]
        why += ("状態がニアミントでない規格（" + "・".join(i["code"] for i in hp) + "）は、CSVがニアミントの規格を1件作るので、そのCSV用の規格にはシード専用の別の商品コード（" + "・".join(i["csvcode"] for i in hp)
                + "）を付け、元の商品コードの規格は商品規格一覧の「新規作成」で足す（M03-08 L0059、M03-09 L0130-L0134）。余るニアミントの規格は在庫0で在庫移動の明細に入らないので、戻しリストCSVの行には出ない。")
    if any(i["sf"] == "ON" for i in items):
        why += "セールフラグは新しい規格では無効で作られる（M03-09 L0086-L0087）ので、取り込み後に商品規格登録編集画面で入れ直す。"
    why += "棚番号は元のとおりDBに直接設定したものを規格の画面で入れる。商品IDと商品規格IDは元の呼び名のまま、商品登録編集画面と商品規格登録編集画面に表示された番号を控える。"
    O.append([sid, "直す", new, "", B_MAIN, why])
assert len(O) == len(I)
save("M04-33", O)
print(len(O))
