import re, sys
sys.path.insert(0, ".")
from lib import *

hdr, I = load("M04-17")
O = []
B = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075-L0077"
KEYS = ["商品登録編集画面で商品名", "規格設定から", "商品コードに「", "同じ画面の順で", "同じ手順で商品名", "商品規格を登録を押"]

def P(code, name=None, base=100, buy=10, name_en=None, **kw):
    d = dict(code=code, name=name or code, base=base, buy=buy, name_en=name_en)
    d.update(kw)
    return d

def seqs(prefix, suffixes, **kw):
    return [P(f"{prefix}{s}", **kw) for s in suffixes]

NM_EXTRA = {}
defs = {}
defs["002"] = [P("TEXT-M0417-002-JP", "TEXT-JP-002 針M0417", name_en="TEXT-JP-002"),
               P("TEXT-M0417-002-EN", "TEXT-EN-002", name_en="TEXT-EN-002 針M0417"),
               P("TEXT-M0417-002-CARD", "TEXT-CARD-002", card="先に登録したカード（カード名(日)「TEXT-CARD-002 針M0417」）"),
               P("TEXT-M0417-002-CODE", "TEXT-CODE-002")]
defs["003"] = [P(c) for c in ["SRC-M0417-003-HQ", "SRC-M0417-003-BR", "SRC-M0417-003-SR"]]
defs["004"] = [P(c) for c in ["AND-M0417-004-A-EC", "AND-M0417-004-A-SR", "AND-M0417-004-B-EC"]]
tc5 = "先に登録したカード（カードセット「EX-A-005」・レアリティ「レア」・プロモ種別「ノーマル」）"
defs["005"] = [P("FILTER-M0417-005-TARGET", "FILTER-TARGET-005", card=tc5, cat="商品カテゴリ「シングル-005」"),
               P("FILTER-M0417-005-C1", card=tc5, cat="商品カテゴリ「シングル」"),
               P("FILTER-M0417-005-C2", card=tc5, cat="商品カテゴリ「シングル-005」", pub="1（非公開）"),
               P("FILTER-M0417-005-C3", card="先に登録した対照用のカード（カードセットだけ「EX-A」）", cat="商品カテゴリ「シングル-005」"),
               P("FILTER-M0417-005-C4", card="先に登録した対照用のカード（レアリティだけ「レア」以外）", cat="商品カテゴリ「シングル-005」"),
               P("FILTER-M0417-005-C5", card="先に登録した対照用のカード（プロモ種別だけ「ノーマル」以外）", cat="商品カテゴリ「シングル-005」")]
tc6 = "先に登録したFoil「通常」のカード"
defs["006"] = [P("FILTER-M0417-006-TARGET", "FILTER-TARGET-006", card=tc6),
               P("FILTER-M0417-006-L", card=tc6, lang="日本語以外の言語（英語）のID"),
               P("FILTER-M0417-006-S", card=tc6, state="SP"),
               P("FILTER-M0417-006-F", card="先に登録したFoilが「通常」以外のカード")]
defs["007"] = [P("FILTER-M0417-007-TARGET", "FILTER-TARGET-007"), P("FILTER-M0417-007-ID"), P("FILTER-M0417-007-SRC")]
defs["008"] = [P("FILTER-M0417-008-TARGET", "FILTER-TARGET-008")] + [P(f"FILTER-M0417-008-C{k}") for k in range(1, 7)]
def rng(n, names, prices=None, bases=None):
    out = []
    for i, s in enumerate(names):
        c = f"RANGE-M0417-{n}-{s}"
        nm = f"RANGE-{s}-{n}"
        b = (bases[i] if bases else 100)
        out.append(P(c, nm, base=b, buy=min(10, b)))
    return out
for n in ["009", "010", "011", "013", "014", "015", "016"]:
    defs[n] = rng(n, ["01", "02", "03", "NULL"])
defs["012"] = rng("012", ["01", "02", "03", "NULL"], bases=[500, 1000, 2000, 0])
defs["020"] = [P("STOCK-001-020")]
defs["023"] = [P("BASE-001-023")]
defs["024"] = [P("BASE-001-024", "基本商品", base=1000, card="先に登録したFoil「通常」のカード")]
defs["025"] = [P("STATE-M0417-025-MEMO", "STATE-MEMO-025", state="NM", memo="Near Mint特記"),
               P("STATE-M0417-025-CODE", "STATE-CODE-025", state="SP")]
defs["026"] = [P("BASE-001-026", base=1000)]
defs["027"] = [P("PURCHASE-NULL-027")]
defs["028"] = [P("APP-M0417-028-APPROVED", "APP-APPROVED-028"), P("APP-M0417-028-WAIT", "APP-WAIT-028"), P("APP-M0417-028-NONE", "APP-NONE-028")]
defs["029"] = [P("BASE-001-029")]
defs["030"] = [P("SORT-M0417-030-Z002", "SORT-Z002-030"), P("SORT-M0417-030-Z001-S20", "SORT-Z001-S20-030"),
               P("SORT-M0417-030-Z001-S10-A", "SORT-Z001-S10-A-030"), P("SORT-M0417-030-Z001-S10-N", "SORT-Z001-S10-N-030"),
               P("SORT-M0417-030-Z001-S10-O", "SORT-Z001-S10-O-030")]
defs["031"] = [P("PENDING-M0417-031")]
defs["037"] = [P("BASE-001-037")]
defs["038"] = [P("LINK-APP-038-REG"), P("LINK-APP-038-BULK"), P("LINK-APP-038-CSV")]
defs["041"] = [P("LINK-STOCKTAKE-041")]
defs["042"] = [P("LINK-ORDER-042")]
defs["052"] = [P("M0417-052-A", "買取価格保存商品", base=1000, buy=800, card="先に登録したFoil「通常」のカード")]
defs["053"] = [P(c) for c in ["CATSEL-M0417-053-A", "CATSEL-M0417-053-B", "CATSEL-M0417-053-C"]]
defs["055"] = [P("MIX-M0417-055-N"), P("MIX-M0417-055-P")]

def spec_new(code, state, base, buy, memo=None):
    s = ("商品規格一覧の「新規作成」ボタンを押し、商品規格登録編集画面で、商品コードに「" + code + "」、言語に「日本語」、状態に「" + {"SP": "スライトリープレイド"}[state]
         + "」、基準価格(円)・販売価格(円)に" + str(base) + "、買取価格(円)に" + str(buy) + "を入れ、")
    s += ("状態別称に「" + memo + "」を入れ、" if memo else "状態別称は空のまま、")
    s += "部門は選択肢の先頭を選んで「商品規格を登録」ボタンを押す"
    return s

for r in I:
    sid, kind, lg, st, use, old, share, cases = r
    num = sid.split("-")[-1]
    prods = defs[num]
    sents = old.split("。")
    idx = [i for i, s in enumerate(sents) if any(k in s for k in KEYS) and "カード詳細" not in s]
    assert idx, sid
    run = [idx[0]]
    for i in idx[1:]:
        if i == run[-1] + 1:
            run.append(i)
        else:
            break
    idx = run
    removed = [sents[i] for i in idx]
    rows = []
    for p in prods:
        c = p["code"]
        if p.get("state", "NM") != "NM":
            c = extra_code(c)
        p["csvcode"] = c
        rows.append(dict(code=c, name=p["name"], name_en=p.get("name_en"), base=p["base"], buy=p["buy"], lang=p.get("lang"), pub=p.get("pub")))
    parts = [csv_sentence(rows)]
    for p in prods:
        if p.get("card") or p.get("cat"):
            names = (p["name"], p.get("name_en") or p["name"]) if p.get("card") else None
            parts.append(edit_product(p["csvcode"], card=p.get("card"), names=names, cat=p.get("cat")))
    for p in prods:
        if p.get("state", "NM") != "NM":
            parts.append(find_sentence(p["csvcode"]) + "、「規格設定」ボタンから" + spec_new(p["code"], p["state"], p["base"], p["buy"], p.get("memo")))
        elif p.get("memo"):
            parts.append(find_sentence(p["csvcode"]) + "、「規格設定」ボタンから商品規格一覧を開き、取り込みで作られた規格の行を開き、商品規格登録編集画面で状態別称に「" + p["memo"] + "」を入れ、部門は選択肢の先頭を選んで「商品規格を登録」ボタンを押す")
    if num == "002":
        parts.append("TEXT-CODE-002の商品コードに「針M0417」を含めることは画面で指定できないためDBへ直接設定する（取り込んだ規格の商品コードを「TEXT-M0417-002-CODE 針M0417」にする。在庫履歴を作る前に行う）")
    newtxt = "。".join(parts)
    out = sents[:idx[0]] + [newtxt] + sents[idx[-1] + 1:]
    new = "。".join(out)
    assert new != old
    why = ("元は商品名以外の項目を「任意の値」としていたので、商品名(英)は指定が無ければ商品名(日)と同じ・サイズ重量1・購入グループ名称は既存の名称・日本語・公開・地域別販売制限0・基準価格＝販売価格・買取価格10（価格の指定があるものは指定の値）にした。"
           "商品コードは元の指定のとおり（「…を含む重ならない値」「…を含む値」と書かれていたものは、シード専用に決めた）。規格の言語・状態は元が任意なので取り込みで作られる日本語・ニアミント（M03-27 L0124）のままにした。")
    if any(p.get("card") for p in prods):
        why += "カード指定の商品は、元と同じく取り込み後に商品登録編集画面の「カード指定 >」でカードを選び、カードで入る商品名を元の値に入れ直す（割引率は販売割引率に登録済みのものを選ぶ）。"
    if any(p.get("cat") for p in prods):
        why += "カテゴリはCSVではサプライ・グッズ配下しか選べない（M03-27 L0123）ので、取り込み後に商品登録編集画面で元のカテゴリに付け替える。"
    if any(p.get("state", "NM") != "NM" for p in prods):
        why += ("状態がニアミントでない規格は、CSVがニアミントの規格を1件作るので、そのCSV用の規格にはシード専用の別の商品コード（"
                + "・".join(p["csvcode"] for p in prods if p.get("state", "NM") != "NM") + "）を付け、元の商品コードの規格は商品規格一覧の「新規作成」で足す（M03-08 L0059、M03-09 L0130-L0134）。余るニアミントの規格は在庫変動履歴を持たないので履歴の検索結果には出ない。")
    if num == "012":
        why += "ケースに影響: RANGE-NULL-012は変動時販売価格0が必要なので基準価格・販売価格・買取価格を0にしたが、グッズ商品CSVが0円を受け付けるかは設計書に明記が無い（M03-27 L0119は買取価格が販売価格を上回る行だけをエラーとする）。"
    if num == "006":
        why += "言語だけ違う対照は元に「日本語以外」としか無かったので英語にした。"
    if num in ("005", "006", "007", "008"):
        why += "対照の商品は商品名の指定が無かったので商品コードと同じにした。"
    if num == "042":
        why += "商品公開ステータス=公開は商品公開ステータス2のとおり。以降の在庫数1のDB設定・購入手順は変えていない。"
    O.append([sid, "直す", new, "", B + "、M03-02 L0092・L0111・L0116・L0146、M03-09 L0130-L0134・L0154", why])
    if "--show" in sys.argv:
        print(sid); print("  REMOVED:", "。".join(removed)[:700]); print()
assert len(O) == len(I)
save("M04-17", O)
print(len(O))
