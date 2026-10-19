import re, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from lib import *
from post import *

FID = "F06-09"
hdr, rows = read_in(FID)
BASIS = ("M03-27 L0092・L0119・L0124・L0129・L0134・L0143・L0144・L0150・L0194-L0238、M03-02 L0075〜L0077・L0092、"
         "M03-09 L0086〜L0087・L0130〜L0134・L0155・L0171")
CARD_REF = lambda n: f"カードID〔カードID-F0609-{n}〕"


def Q(code, n, plabel, clabel, base=1000, buy=100, card=False, first_edit=None, extras=None, limit=None, high=None):
    p = prod(code, base=base, buy=buy, limit=limit, label=plabel)
    p["clabel"] = clabel
    if card:
        p["card"] = "ref"
        p["card_ref"] = CARD_REF(n)
    if first_edit:
        p["first_edit"] = first_edit
    if high:
        p["first_edit"] = dict(p.get("first_edit") or {}, high=high)
    p["extras"] = extras or []
    return p


def X(code, state, base, label, buy=10, high=None, lang="日本語"):
    return dict(code=code, state=state, base=base, buy=buy, label=label, high=high, lang=lang)


def L(prefix, n, i):
    return f"〔{prefix}-F0609-{n}{'ABCDEFG'[i]}〕"


def simple(code, n, **kw):
    return Q(code, n, f"〔商品ID-F0609-{n}〕", f"〔商品規格ID-F0609-{n}〕", **kw)


SPEC = {}
for n in ("004",):
    SPEC[n] = [Q(f"COUNT-00{i+1}", n, L("商品ID", n, i), L("商品規格ID", n, i)) for i in range(3)]
SPEC["005"] = [Q("SALE-001-005", "005", L("商品ID", "005", 0), L("商品規格ID", "005", 0),
                 first_edit=dict(sale_flag=True, base=1000, sale=800)),
               Q("REG-001-005", "005", L("商品ID", "005", 1), L("商品規格ID", "005", 1))]
SPEC["013"] = [Q("SALE-001-013", "013", L("商品ID", "013", 0), L("商品規格ID", "013", 0),
                 first_edit=dict(sale_flag=True, base=1000, sale=800)),
               Q("REG-001-013", "013", L("商品ID", "013", 1), L("商品規格ID", "013", 1))]
# 006 / 007 / 030: 状態の異なる規格を2件ずつ
pairs = [(100, 900), (200, 800), (300, 700)]
for n, names in (("006", ["SORT-A-006", "SORT-B-006", "SORT-C-006"]), ("007", ["SORT-A-007", "SORT-B-007", "SORT-C-007"]),
                 ("030", ["F0609-030-A", "F0609-030-B", "F0609-030-C"])):
    ps = []
    for i, (nm, (lo, hi)) in enumerate(zip(names, pairs)):
        ps.append(Q(nm, n, L("商品ID", n, i), L("商品規格ID", n, 2 * i), base=lo, buy=10,
                    extras=[X(nm, "EX", hi, L("商品規格ID", n, 2 * i + 1))]))
    SPEC[n] = ps
for n in ("011", "012", "025"):
    SPEC[n] = [simple(f"LINK-CARD-{n}", n, card=True)]
SPEC["024"] = [Q("LINK-CARD-024", "024", L("商品ID", "024", 0), L("商品規格ID", "024", 0), card=True),
               Q("LINK-NONCARD-024", "024", L("商品ID", "024", 1), L("商品規格ID", "024", 1))]
# 014
SPEC["014"] = [
    Q("PUB-NORMAL-014", "014", L("商品ID", "014", 0), L("商品規格ID", "014", 0)),
    Q("PRIVATE-001-014", "014", L("商品ID", "014", 1), L("商品規格ID", "014", 1)),
    Q("PUB-HIGH-ZERO-014", "014", L("商品ID", "014", 2), L("商品規格ID", "014", 2), high="HIGH-0609-014-ZERO"),
    Q("PUB-HIGH-STOCK-014", "014", L("商品ID", "014", 3), L("商品規格ID", "014", 3), high="HIGH-0609-014-STOCK"),
    Q("LANG-001-014", "014", L("商品ID", "014", 4), L("商品規格ID", "014", 4),
      extras=[X("LANG-001-014", "NM", 1000, L("商品規格ID", "014", 5), buy=100, lang="英語")]),
    Q("OTHER-001-014", "014", L("商品ID", "014", 5), L("商品規格ID", "014", 6))]
# 015 / 016
for n in ("015", "016"):
    SPEC[n] = [Q(f"DETAIL-001-{n}", n, f"〔商品ID-F0609-{n}〕", L("商品規格ID", n, 0), base=50, buy=10,
                 extras=[X(f"DETAIL-001-{n}", "EX", 99, L("商品規格ID", n, 1)),
                         X(f"DETAIL-001-{n}", "EX", 100, L("商品規格ID", n, 2))])]
SPEC["017"] = [simple("DETAIL-HIGH-001-017", "017", base=200, high="HIGH-0609-017")]
SPEC["018"] = [simple("QTY-001-018", "018", limit=1)]
SPEC["019"] = [simple("QTY-ZERO-001-019", "019")]
for n in ("020", "021", "022"):
    SPEC[n] = [simple(f"CART-001-{n}", n)]
for n in ("026", "027"):
    SPEC[n] = [simple(f"DELETE-001-{n}", n)]
# 031-036: 4商品、A と C がセール対象
for n in ("031", "032", "033", "035", "036"):
    prices = [900, 800, 700, 600]
    ps = []
    for i, pr in enumerate(prices):
        fe = dict(sale_flag=True, base=1000, sale=pr) if i in (0, 2) else None
        ps.append(Q(f"F0609-{n}-{'ABCD'[i]}", n, L("商品ID", n, i), L("商品規格ID", n, i), base=pr, buy=100, first_edit=fe))
    SPEC[n] = ps
SPEC["038"] = [simple("F0609-038-A", "038")]
SPEC["039"] = [simple("F0609-039-A", "039", card=True)]
SPEC["040"] = [simple("F0609-040-A", "040", card=True)]
SPEC["041"] = [simple("F0609-041-A", "041")]
SPEC["042"] = [Q("F0609-042-A", "042", "〔商品ID-F0609-042〕", "〔商品規格ID-F0609-042A〕", base=200, buy=100,
                 extras=[X("F0609-042-A", "EX", 300, "〔商品規格ID-F0609-042B〕", buy=100)])]
SPEC["043"] = [Q("F0609-043-A", "043", "〔商品ID-F0609-043〕", "〔商品規格ID-F0609-043A〕", base=200, buy=100,
                 extras=[X("F0609-043-A", "EX", 300, "〔商品規格ID-F0609-043B〕", buy=100, high="F0609-043-HIGH")])]
SPEC["044"] = [Q(f"F0609-044-{c}", "044", f"〔商品ID-F0609-044{c}〕", f"〔商品規格ID-F0609-044{c}〕") for c in "ABC"]


def block_of(ps):
    b = csv_clause(ps) + "グッズ商品は状態ニアミント・日本語の規格が1件作られる。"
    for i, p in enumerate(ps):
        b += edit_sentence(p, first=(i == 0))
        b += class_sentence(p, label=p["clabel"])
        for e in p["extras"]:
            b += add_class_sentence(e["code"], e["lang"], e["state"], e["buy"], e["base"], label=e["label"], high=e["high"])
    return b


out = []
for r in rows:
    sid, kind, lab, attr, use, how, share, cases = r
    n = sid[-3:]
    ps = SPEC[n]
    st = how.find("管理画面の商品登録画面で")
    en = how.find("管理画面の在庫検索一覧")
    assert 0 < st < en, sid
    new = how
    if n == "044":
        # 3商品ぶんの商品登録が在庫手順と交互に並ぶ。最初のブロックに3商品ぶんをまとめ、残りの商品登録ブロックは消す
        blocks = []
        pos = 0
        for m in re.finditer(r"管理画面の商品登録画面で、F0609-044-([ABC])を登録する。.*?(?=管理画面の在庫検索一覧)", how):
            blocks.append(m)
        assert len(blocks) == 3
        new = how
        for m in reversed(blocks[1:]):
            new = new[:m.start()] + new[m.end():]
        m0 = blocks[0]
        new = new[:m0.start()] + block_of(ps) + new[m0.end():]
    else:
        new = how[:st] + block_of(ps) + how[en:]
        if n == "014":
            old = "管理画面の商品登録画面でPRIVATE-001-014の商品公開ステータスを非公開にして「商品を登録」を押す。"
            assert old in new
            new = new.replace(old, "管理画面の商品登録編集画面（既存の商品の編集）でPRIVATE-001-014の商品公開ステータスを非公開にし、"
                                   "割引率に販売割引率に登録済みの割引率を選んで「商品を登録」を押す。")
    reasons = [
        "元は販売価格・基準価格・買取価格・サイズ・重量・購入グループ・商品カテゴリを任意の値としていたので、基準価格と販売価格は元に書かれた値"
        "（書かれていなければ1000）、買取価格は販売価格以下の値（100、販売価格が100以下なら10）、サイズ1・重量1・購入グループは既存の購入グループ、"
        "商品カテゴリはサプライ・グッズにした（買取価格は販売価格を上回れない M03-27 L0119）",
        "支店の商品公開ステータスは元に指定が無く画面の初期値（公開）だったので1（公開）にした。商品公開ステータスは2（公開）で、元の最後の「商品公開ステータスを公開にして商品を登録」はCSVで済む",
        "グッズ商品CSVには規格の部門と公開ステータスの列が無いので、取り込み後に規格の画面で部門を先頭の選択肢・公開ステータスを公開にした（M03-09 L0155・L0171）",
    ]
    if any(p["card"] if "card" in p else False for p in ps):
        reasons.append("元の商品登録画面と同じく「カード指定 >」でカードを選ぶ。商品カテゴリは元が任意だったので単体カードにした")
    if any(p["extras"] for p in ps):
        reasons.append("ニアミント以外・日本語以外の規格と2件目以降の規格は、元のとおり商品規格一覧の「新規作成」から足す（M03-09 L0130〜L0134）。"
                       "元は状態を指定しない規格を『NMにする』としていたので1件目をNM、状態の異なる2件目をEXにした")
    if any((p.get("first_edit") or {}).get("sale_flag") for p in ps):
        reasons.append("新しく作る規格はセールフラグ無効で販売価格が基準価格と同額になる（M03-09 L0086〜L0087）ので、セール対象の規格は取り込み後に規格の画面でセールフラグ・基準価格・販売価格を入れた")
    if n == "014":
        reasons.append("最後のPRIVATE-001-014を非公開にする手順は既存の商品の編集で、編集の必須項目の割引率を足した")
    if n == "044":
        reasons.append("元は商品ごとに商品登録と在庫の手順が交互だったが、商品はCSVで先に3件作るので商品を作る部分だけ先頭にまとめた（在庫の手順は元のまま）")
    out.append([sid, "直す", new, "", BASIS, "。".join(reasons)])

write_out(FID, out)
print(len(out))
