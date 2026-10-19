from common import *
import re
R, ids = load("F06-08")
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0225〜L0229、M03-02 L0075〜L0077・L0092、M03-08 L0059、M03-09 L0123〜L0172"
SH = "F0608-"
def L(x): return f"商品ID-F0608-{x}"
def S(x): return f"商品規格ID-F0608-{x}"

def plain(code, pid, sid, name=None, lang="JP", state="NM", memo=None, image_note=""):
    name = name or code
    lg = {"JP": "日本語", "EN": "英語"}[lang]
    t = csv_up([row(code, name, name, lang=lg, base=100, buy=10)], stock_note=False) + image_note
    t += lookup(code, pid)
    t += OPEN_EDIT + "、" + SPEC_LIST + "。" + first_spec(lg, state, sid, memo)
    return t

def card(code, pid, sid, name=None, which="登録したカード詳細", lang="JP", state="NM", memo=None, extra="", image_note=""):
    name = name or code
    lg = {"JP": "日本語", "EN": "英語"}[lang]
    t = csv_up([row(code, name, name, lang=lg, base=100, buy=10)], stock_note=False) + image_note
    t += lookup(code, pid)
    t += OPEN_EDIT + "、" + card_attach(name, which, extra) + SPEC_LIST + "。" + first_spec(lg, state, sid, memo)
    return t

def blk(sid_):
    f = "S-F06-08-"
    k = sid_[len(f):]
    n = k.split("-")[-1]
    if k.startswith("NAV"):   return plain("F0608-NAV-001", L("F0608-001"[7:]), S("001"))
    raise

blocks = {}
blocks["NAV-001"] = plain("F0608-NAV-001", L("001"), S("001"))
# 005: 3商品（A,Bはカード指定なし、Cはカード指定）
def multi_basic(tag, ntotal, card_last_only=True):
    pass
codes5 = ["F0608-005A", "F0608-005B", "F0608-005C"]
b = csv_many(codes5, base=100, buy=10)
for c, x in zip(codes5, "ABC"):
    b += lookup(c, L("005" + x))
    b += OPEN_EDIT + "、" + (card_attach(c) if x == "C" else "") + SPEC_LIST + "。" + first_spec("日本語", "NM", None if x == "B" else S("005" + x))
blocks["BASIC-005"] = b
# 006: 20商品（20商品目だけカード指定）
import string
let20 = string.ascii_uppercase[:20]
codes6 = [f"F0608-006{x}" for x in let20]
b = csv_many(codes6, base=100, buy=10)
b += ("20商品それぞれについて、商品マスター(検索入力)で商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える"
      f"（登録順に〔{L('006A')}〕〜〔{L('006T')}〕）。"
      "20商品目（" + codes6[-1] + "）は、" + OPEN_EDIT + "、" + card_attach(codes6[-1]) +
      "20商品それぞれについて、" + OPEN_EDIT + "、" + SPEC_LIST + "。" + first_spec("日本語", "NM") +
      f"20商品それぞれの商品規格ID欄に表示された番号を登録順に控える（〔{S('006A')}〕〜〔{S('006T')}〕）。")
blocks["MAX20-006"] = b
def loop19(pref, tag, with_sp):
    codes = [f"{pref}"] + [f"{pref}-{i:02d}" for i in range(2, 20)]
    b = csv_many(codes, base=100, buy=10)
    b += (f"19商品それぞれについて、商品マスター(検索入力)で商品コードを入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える"
          f"（登録順に〔{L(tag+'A')}〕〜〔{L(tag+'S')}〕。{pref}が〔{L(tag+'A')}〕）。"
          "19商品それぞれについて、" + OPEN_EDIT + "、「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカードを検索して、商品ごとに別の詳細情報の行の決定ボタンを押す。"
          "続けて商品名(日)と商品名(英)に取り込んだときの商品名（1商品目は「" + pref + "」、2商品目以降は商品コードと同じ値）を入れ直し（カード指定で自動で入った値は書き換える）、"
          "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。"
          "19商品それぞれについて、" + SPEC_LIST + "。" + first_spec("日本語", "NM"))
    if not with_sp:
        b += f"19商品それぞれの商品規格ID欄に表示された番号を登録順に控える（〔{S(tag+'A')}〕〜〔{S(tag+'S')}〕。{pref}が〔{S(tag+'A')}〕）。"
    else:
        b += (f"{pref}のNM規格の商品規格ID欄に表示された番号を控える（〔{S(tag+'A')}〕）。残り18商品の規格も同じ操作で、商品規格ID欄に表示された番号を登録順に控える（〔{S(tag+'C')}〕〜〔{S(tag+'T')}〕）。"
              f"{pref}にはもう1規格、" + add_spec("JP", "SP", pref, 100, 10, S(tag+"B")) + "商品詳細画面は100円未満のNM以外の規格を表示しないため、基準価格は100にする。")
    return b
blocks["LIMIT19-007"] = loop19("CARD-LIMIT19-007", "007", False)
blocks["LIMIT20-008"] = loop19("CARD-LIMIT20-008", "008", True)
blocks["NAME-009"] = plain("F0608-NAME-009", L("009"), S("009"))
blocks["BREADCRUMB-010"] = plain("F0608-BREADCRUMB-010", L("010"), S("010"))
blocks["HOME-011"] = plain("F0608-HOME-011", L("011"), S("011"))
# 012: カード、JP NM + EN NM（同じ商品コード）
c = "CARD-LANG-012"
blocks["LANG-012"] = card(c, L("012"), S("012A")) + "同じ商品にもう1規格、" + add_spec("EN", "NM", c, 100, 10, S("012B"))
c = "CARD-GROUP-013"
blocks["GROUP-013"] = card(c, L("013"), S("013A")) + "同じ商品にもう1規格、" + add_spec("JP", "SP", c, 100, 10, S("013B")) + "商品詳細画面は100円未満のNM以外の規格を表示しないため、基準価格は100にする。"
c = "CARD-FILTER-014"
b = csv_up([row(c, c, c, base=1111, buy=10)], stock_note=False) + lookup(c, L("014")) + OPEN_EDIT + "、" + card_attach(c) + SPEC_LIST + "。" + first_spec("日本語", "NM", S("014A"))
b += "同じ商品にもう1規格、" + add_spec("JP", "SP", c, 2222, 10, S("014B")) + "セール中にしないので販売価格は基準価格と同じ値になる。"
blocks["FILTER-014"] = b
c = "CARD-GROUP-015"
b = card(c, L("015"), S("015A"), memo="特記A")
b += "同じ商品にもう1規格、" + add_spec("JP", "SP", c, 100, 10, S("015B")) + "状態別称（個別メモ）は空のままにする。商品詳細画面は100円未満のNM以外の規格を表示しないため、基準価格は100にする。"
blocks["STATE-015"] = b
c = "CARD-GROUP-016"
b = csv_up([row(c, c, c, base=123456, buy=10)], stock_note=False) + lookup(c, L("016")) + OPEN_EDIT + "、" + card_attach(c) + SPEC_LIST + "。" + first_spec("日本語", "NM", S("016"))
blocks["PRICE-016"] = b
blocks["NOIMAGE-017"] = plain("NOIMAGE-PRODUCT-017", L("017"), S("017"), image_note="商品画像は登録しない（規格画像の列も使わない）。")
blocks["FOIL-018"] = card("FOIL-PRODUCT-018", L("018"), S("018"), name="テストFoilカード-018")
blocks["IMAGE-LANG-019"] = card("CARD-LANG-019", L("019"), S("019"), extra="商品画像に任意の画像ファイルを登録し、")
blocks["IMAGE-HIGH-020"] = card("HIGH-PRODUCT-020", L("020"), S("020"), extra="商品画像に任意の画像ファイルを登録し、")
blocks["NAME-LANG-021"] = card("CARD-LANG-021", L("021"), S("021"), lang="EN")
blocks["SAMECARD-022"] = card("CARD-LANG-022", L("022"), S("022"))
blocks["NONCARD-023"] = plain("NONCARD-PRODUCT-023", L("023"), S("023"))
# 025: カード詳細2件、2商品
a, bb = "CARD-LANG-025", "CARD-BULK-025"
t = csv_many([a, bb], base=100, buy=10)
t += lookup(a, L("025A")) + OPEN_EDIT + "、" + card_attach(a, "1件目の詳細情報のカード詳細") + SPEC_LIST + "。" + first_spec("日本語", "NM", S("025"))
t += lookup(bb, L("025B")) + OPEN_EDIT + "、" + card_attach(bb, "2件目の詳細情報のカード詳細") + "どちらの規格も在庫数は取り込み直後の0のままにする。"
blocks["BUTTONS-025"] = t
c = "CARD-FILTER-026"
blocks["RELOAD-CLASS-026"] = card(c, L("026"), S("026A")) + "同じ商品にもう1規格、" + add_spec("JP", "SP", c, 100, 10, S("026B")) + "。"
blocks["RELOAD-BULK-027"] = card("CARD-LANG-027", L("027"), S("027"))
blocks["SINGLE-032"] = plain("SINGLE-F0608-032", L("032"), S("032"), name="テスト単品通知-032")
blocks["NOFOIL-033"] = card("NOFOIL-CARD-F0608-033", L("033"), S("033"), name="テスト非Foilカード-033")

# 差し替え
out = []
START = re.compile(r"管理画面の商品管理の商品登録画面で|次の商品登録と商品規格登録を")
for sid in ids:
    key = sid[len("S-F06-08-"):]
    old = R[sid][5]
    if key not in blocks:
        out.append([sid, "直す", "", "", "", "BLOCK無し"]); continue
    m = START.search(old)
    if not m:
        out.append([sid, "直す", "", "", "", "開始位置が見つからない"]); continue
    s0 = m.start(); s1 = old.find("フロントに「", s0)
    oldblk = old[s0:s1]
    newblk = blocks[key]
    # 末尾の前置き（元は「次の…くり返す（…）: 」など）は不要。元のブロック内の呼び名が全部残ること
    lost = set(re.findall(r"〔[^〕]+〕", oldblk)) - set(re.findall(r"〔[^〕]+〕", newblk))
    assert not lost, (sid, lost)
    new = old[:s0] + newblk + old[s1:]
    why = ""
    cardp = "カード指定" in oldblk and "カード指定は行わず" not in oldblk
    if key in ("BASIC-005", "MAX20-006"):
        why = "元はカード指定のあるのは最後の1商品だけ。それ以外はカード指定をしない。"
    if cardp or key in ("BASIC-005", "MAX20-006"):
        why += "元のカテゴリは「任意」だったので、カード指定の商品は単体カードのカテゴリに付け替えた（A07-06と同じ型）。"
    why += "元の価格は「任意」の項目は基準価格・販売価格100・買取価格10にした（100円未満のNM以外の規格は商品詳細画面に出ないため100以上）。"
    why = why.strip()
    if key in ("GROUP-013", "STATE-015", "LIMIT20-008", "FILTER-014", "RELOAD-CLASS-026", "LANG-012"):
        why += "追加の規格は元のシードと同じ商品コードで商品規格一覧の「新規作成」から足す（元のシードも同じ商品コードの規格を重ねて登録していた）。"
    if key in ("GROUP-013", "STATE-015", "IMAGE-HIGH-020"):
        why += "シードの後半にある高額商品コード・3つ目の規格を足す文の「同じ手順」は元の文のまま（規格を足すだけで商品は作らないため。手順の中身は上の新規作成と同じ）。"
    if key == "STATE-015":
        why += "元は状態別称「特記A」をNM規格に入れる。取り込んだNM規格を開いて入れる。"
    out.append([sid, "直す", new, "", BASIS, why])
save("F06-08", out)
print(len(out))
