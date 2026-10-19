import re, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from lib import *
from post import *

FID = "F05-03"
hdr, rows = read_in(FID)
END = "（販売種別・販売価格(円)・基準価格(円)・部門など残りの必須項目は任意の値）。"
STARTS = [r"次の\d商品を", r"商品ID F0503-\d+-\d+〜", r"商品ID F0503-\d+-\d+ の", r"商品は次の順に", r"商品は管理画面の商品管理＞商品登録で",
          r"管理画面の商品管理＞商品登録で、商品名", r"次の6商品を"]
EXT = [r"登録後の商品規格登録画面の「商品規格ID」に表示された番号を控える（〔[^〕]+〕）。",
       r"[A-Z0-9-]+の商品規格を登録した後、商品規格登録画面の「商品規格ID」に表示された番号を控える（〔[^〕]+〕）。",
       r"（3商品とも商品コードは商品名と同じ文字列にする）"]

BASIS = ("M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0143・L0144・L0150・L0194-L0238、"
         "M03-02 L0075〜L0077・L0092、M03-09 L0086〜L0087・L0155・L0171")
NOTE_COMMON = ("元は販売価格・基準価格・サイズ・重量・購入グループなどを任意の値としていたので、基準価格と販売価格を同額（買取価格以上）、"
               "買取価格は元のとおり、原価単価は10にした（買取価格は販売価格を上回れない M03-27 L0119）。"
               "支店の商品公開ステータスは元に指定が無く画面の初期値（公開）だったので1（公開）にした。"
               "グッズ商品CSVには規格の部門と公開ステータスの列が無いので、取り込み後に規格の画面で部門を先頭の選択肢・公開ステータスを公開にした（M03-09 L0155・L0171）")


def P(code, buy=600, base=None, **kw):
    base = base if base is not None else max(1000, buy)
    p = prod(code, buy=buy, base=base, search=kw.pop("search", None),
             tags=kw.pop("tags", None), group=kw.pop("group", GRP_NORMAL), lang=kw.pop("lang", "日本語"),
             label=kw.pop("label", None))
    p.update(kw)
    return p


def block(ps, class_labels=None, between=None, extra_classes=None, loop=None):
    """CSV の文 + 商品ごとの取り込み後の操作"""
    class_labels = class_labels or {}
    extra_classes = extra_classes or {}
    b = csv_clause(ps)
    b += "グッズ商品は状態ニアミントの規格が1件作られる。"
    if loop:
        b += loop
        return b
    for i, p in enumerate(ps):
        b += edit_sentence(p, first=(i == 0))
        b += class_sentence(p, label=class_labels.get(p["code"]))
        for e in extra_classes.get(p["code"], []):
            b += e
    return b


def region(t):
    idx = [m.start() for s in STARTS for m in [re.search(s, t)] if m]
    st = min(idx)
    en = t.rfind(END) + len(END)
    for e in EXT:
        m = re.match(e, t[en:])
        if m:
            en += m.end()
    return st, en


def loop_text(codes_desc, n, cat, lead_label=None):
    return (f"取り込んだ{n}商品（{codes_desc}）のそれぞれについて、次の操作をする。"
            "商品マスター(検索入力)で商品コードにその商品の商品コードを入れて「検索する >」を押し、"
            "その行から商品登録編集画面（既存の商品の編集）を開き、"
            f"商品カテゴリはサプライ・グッズの選択を外して「{cat}」を選び、割引率に販売割引率に登録済みの割引率を選び、"
            "公開状態は「公開」のまま「商品を登録」ボタンを押す。商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、"
            "商品規格一覧で言語日本語・状態ニアミントの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で"
            "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")


SPEC = {}

# 009
SPEC["S-F05-03-TAG-009"] = dict(ps=[P("TAG-001-009", tags="〔タグレコードID-F0503-009〕に控えた番号")])
# 011
SPEC["S-F05-03-BREADCRUMB-011"] = dict(ps=[P(
    "BREAD-001-011", card="BREAD-CARD-011",
    cat="スタンダード-011＞タルキール：龍嵐録-011＞タルキール：龍嵐録-011（最下層）",
    tags="〔タグレコードID-F0503-011〕に控えた番号")])
# 015
c15 = "絞り込み確認カテゴリ-015"
SPEC["S-F05-03-FILTER-015"] = dict(ps=[
    P("FILTER-ALL", card="FILTER-CARD-ALL-015", cat=c15),
    P("FILTER-NG-LANG-015", card="FILTER-CARD-ALL-015", cat=c15, lang="英語"),
    P("FILTER-NG-FOIL-015", card="FILTER-CARD-FOIL-015", cat=c15),
    P("FILTER-NG-RARITY-015", card="FILTER-CARD-RARITY-015", cat=c15),
    P("FILTER-NG-COLOR-015", card="FILTER-CARD-COLOR-015", cat=c15),
    P("FILTER-NG-TYPE-015", card="FILTER-CARD-TYPE-015", cat=c15)])
# 016
c16 = "マナコスト確認カテゴリ-016"
SPEC["S-F05-03-FILTER-016"] = dict(ps=[P("MANA-3-016", card="MANA-CARD-3-016", cat=c16),
                                      P("MANA-4-016", card="MANA-CARD-4-016", cat=c16)])
c17 = "カラー確認カテゴリ-017"
SPEC["S-F05-03-FILTER-017"] = dict(ps=[P("COLOR-R-017", card="COLOR-CARD-R-017", cat=c17),
                                      P("COLOR-U-017", card="COLOR-CARD-U-017", cat=c17)])
# 018
sw = "F0503-SORT-018"
SPEC["S-F05-03-SORT-018"] = dict(ps=[
    P("REL-NEW-100-JP-018", card="REL-CARD-100-018", search=sw, label="〔商品レコードID-F0503-018B〕"),
    P("REL-NEW-200-JP-018", name="REL-NEW-200-018", name_en="REL-NEW-200-018", card="REL-CARD-200-018", search=sw,
      label="〔商品レコードID-F0503-018A〕"),
    P("REL-OLD-300-JP-018", card="REL-CARD-300-018", search=sw),
    P("REL-SUPPLY-400-018", search=sw)],
    extra={"REL-NEW-200-JP-018": [add_class_sentence("REL-NEW-200-EN-018", "英語", "NM", 600, 1000)]},
    post="〔商品レコードID-F0503-018A〕が〔商品レコードID-F0503-018B〕より大きいことを確かめる。")
# 019
c19 = "F0503色順カテゴリ-019"
SPEC["S-F05-03-SORT-019"] = dict(ps=[P("SORT-COLOR-W-019", card="SORT-CARD-W-019", cat=c19),
                                    P("SORT-COLOR-U-019", card="SORT-CARD-U-019", cat=c19),
                                    P("SORT-COLOR-R-019", card="SORT-CARD-R-019", cat=c19)])
# 020 / 032
for n, cat in (("020", "表示属性確認カテゴリ-020"), ("032", "表示属性確認カテゴリ-032")):
    SPEC[f"S-F05-03-VIEW-{n}"] = dict(ps=[P(f"CARD-001-{n}", card=f"VIEW-CARD-{n}", cat=cat),
                                         P(f"CARD-002-{n}", card=f"VIEW-CARD-{n}", cat=cat),
                                         P(f"SUPPLY-001-{n}", cat=cat)])
# 025
SPEC["S-F05-03-PRICE-025"] = dict(ps=[P("PRICE-001-025", buy=700, search="F0503-PRICE-025")],
                                  class_labels={"PRICE-001-025": "〔商品規格レコードID-F0503-025〕"})
# 026
c26 = "買取価格順確認カテゴリ-026"
SPEC["S-F05-03-SORT-026"] = dict(ps=[P("PRICE-HIGH-026", buy=3000, cat=c26), P("PRICE-MID-026", buy=2000, cat=c26),
                                    P("PRICE-LOW-026", buy=1000, cat=c26)])
# 033-037
for n in ("033", "034", "035", "036", "037"):
    cat = f"カート確認カテゴリ-{n}"
    SPEC[f"S-F05-03-CART-{n}"] = dict(
        ps=[P(f"CART-499-{n}", buy=499, cat=cat), P(f"CART-500-{n}", buy=500, cat=cat)],
        class_labels={f"CART-500-{n}": f"〔商品規格レコードID-F0503-{n}〕"} if n != "033" else {})
# 038
SPEC["S-F05-03-INCOMING-038"] = dict(ps=[
    P("TOP-CARD-038", card="TOP-CARDNAME-038", edit_tags="買取TOP用新着タグ（S-F05-03-MASTERのタグ）"),
    P("TOP-CARD-038-A", card="TOP-CARDNAME-038"), P("TOP-CARD-038-B", card="TOP-CARDNAME-038")])
# 041
c41 = "色順確認カテゴリ-F0503-041"
SPEC["S-F05-03-SORTCOLOR-041"] = dict(ps=[P("F0503-041-W", card="F0503-041-C", cat=c41),
                                         P("F0503-041-U", card="F0503-041-B", cat=c41),
                                         P("F0503-041-R", card="F0503-041-A", cat=c41)])
c42 = "色順確認カテゴリ-F0503-042"
SPEC["S-F05-03-SORTNAME-042"] = dict(ps=[P("F0503-042-P1", card="F0503-042-C", cat=c42),
                                        P("F0503-042-P2", card="F0503-042-A", cat=c42),
                                        P("F0503-042-P3", card="F0503-042-B", cat=c42)])
c43 = "色順確認カテゴリ-F0503-043"
SPEC["S-F05-03-SORTLANG-043"] = dict(ps=[
    P("F0503-043-EN", card="F0503-043-A", cat=c43, lang="英語", label="〔商品レコードID-F0503-043A〕"),
    P("F0503-043-JP", card="F0503-043-A", cat=c43, label="〔商品レコードID-F0503-043B〕")],
    post="〔商品レコードID-F0503-043A〕が〔商品レコードID-F0503-043B〕より小さいことを確かめる。")
c44 = "色順確認カテゴリ-F0503-044"
SPEC["S-F05-03-SORTPROD-044"] = dict(ps=[
    P("F0503-044-C", card="F0503-044-N", cat=c44, label="〔商品レコードID-F0503-044A〕"),
    P("F0503-044-A", card="F0503-044-N", cat=c44, label="〔商品レコードID-F0503-044B〕"),
    P("F0503-044-B", card="F0503-044-N", cat=c44, label="〔商品レコードID-F0503-044C〕")],
    post="")
# 045-053
SPEC["S-F05-03-PAGECUR-045"] = dict(ps=[P(f"F0503-045-{i:03d}", cat="ページング確認カテゴリ-F0503-045") for i in (1, 2, 3)])
for n in ("046", "047", "048", "053"):
    SPEC[f"S-F05-03-PAGE{ {'046':'ELL','047':'ELL','048':'DOT','053':'MID'}[n] }-{n}"] = dict(
        ps=[P(f"F0503-{n}-{i:03d}", cat=f"ページング確認カテゴリ-F0503-{n}") for i in range(1, 18)], loop=True)
SPEC["S-F05-03-QTYDEC-050"] = dict(ps=[P("F0503-050-001", cat="数量確認カテゴリ-F0503-050")])
# 054
SPEC["S-F05-03-CARTDEF-054"] = dict(ps=[P("F0503-CART-500-054", buy=500, cat="カート確認カテゴリ-054")],
                                    class_labels={"F0503-CART-500-054": "〔商品規格レコードID-F0503-054〕"})
# 055
SPEC["S-F05-03-TAG2-055"] = dict(ps=[P("F0503-TAG-BOTH-055",
                                       tags="〔タグレコードID-F0503-055A〕と〔タグレコードID-F0503-055B〕に控えた番号（カンマ区切り）")])
# 056
c56 = "発売日確認カテゴリ-056"
SPEC["S-F05-03-RELSEL-056"] = dict(ps=[
    P("F0503-REL-OLD-056", card="F0503-056-CARD-1", cat=c56),
    P("F0503-REL-NEWA-056", card="F0503-056-CARD-2", cat=c56, label="〔商品レコードID-F0503-056A〕"),
    P("F0503-REL-NEWB-056", card="F0503-056-CARD-3", cat=c56, label="〔商品レコードID-F0503-056B〕")],
    post="〔商品レコードID-F0503-056B〕が〔商品レコードID-F0503-056A〕より大きいことを確かめる。")

out = []
for r in rows:
    sid, kind, lab, attr, use, how, share, cases = r
    reasons = [NOTE_COMMON]
    if sid == "S-F05-03-LIMIT-002":
        out.append([sid, "直さない", "", "", "",
                    "商品を新しく作らない（商品一覧で検索し、該当する商品があれば既存の商品の編集で文字列を除く）"])
        continue
    if sid == "S-F05-03-ELIGIBILITY-024":
        out.append([sid, "直せない", "", "",
                    "M03-27 L0119、M03-09 L0194-L0195",
                    "ELIGIBLE-NOSTOCK-024 が販売価格0円・買取価格1円を要るが、買取価格は販売価格を上回れず（グッズ商品CSVは行ごとにエラー、"
                    "規格の画面も販売価格が買取価格を下回ると検証エラー）、CSVでも規格の画面でも作れない。"
                    "元の書き方（商品登録画面と規格登録の画面）でも同じ検証があるので、元のシードがもともと作れない値を要求していた。"
                    "ほかの5商品（ELIGIBLE-STOCK-024・BUY-ZERO-024・STATE-EX-024・HIGH-CODE-024・RESERVED-024）は作れるが、"
                    "STATE-EX-024 はニアミントの規格が余るため、先にEXの規格を足してニアミントの規格を削除する手当て（M03-09 L0159・L0197-L0198）が要る。"
                    "ケースに影響: IT-F05-03-024 は販売価格0円の ELIGIBLE-NOSTOCK-024 を確かめるため、DBへの直接設定で販売価格を0にするか、"
                    "ケースの値を決め直すかの判断が要る"])
        continue
    if sid == "S-F05-03-MASTER":
        p = P("F0503-MASTER-001", name="まとめて買取", name_en="まとめて買取", buy=100)
        p["label"] = "〔商品レコードID-F0503-共有〕"
        new_blk = block([p])
        old = how
        a = old.find("まとめて買取商品は、管理画面の商品管理＞商品登録で")
        b = old.find("続けて管理画面の設定＞基本情報設定＞追加システム設定")
        assert 0 < a < b
        new = old[:a] + new_blk + old[b:]
        reasons = ["元は商品コードの指定が無かったので、機能IDとシードIDから作ったシード専用の値「F0503-MASTER-001」にした。"
                   "商品名(日)・商品名(英)は元のとおり「まとめて買取」。公開状態は商品公開ステータス2（公開）",
                   "元は購入グループ・サイズ・重量・割引率・販売制限を任意の値としていたので、サイズ1・重量1・購入グループは既存の購入グループ・"
                   "基準価格と販売価格を1000、買取価格を100、原価単価を10にした。支店の商品公開ステータスは元に指定が無く画面の初期値（公開）だったので1にした",
                   "グッズ商品CSVには規格の部門と公開ステータスの列が無いので、取り込み後に規格の画面で部門を先頭の選択肢・公開ステータスを公開にした"]
        out.append([sid, "直す", new, "", BASIS, "。".join(reasons)])
        continue
    sp = SPEC[sid]
    st, en = region(how)
    ps = sp["ps"]
    if sp.get("loop"):
        n = len(ps)
        codes = f"商品コード「{ps[0]['code']}」〜「{ps[-1]['code']}」"
        cat = ps[0]["cat"]
        b = csv_clause(ps) + "グッズ商品は状態ニアミントの規格が1件作られる。" + loop_text(codes, n, cat)
    else:
        b = block(ps, class_labels=sp.get("class_labels"), extra_classes=sp.get("extra"))
        b += sp.get("post", "")
    # 規格の足し方・順序つきの補足は個別
    carry = [x for x in how[st:en].split("。") if x.strip() and not re.search("商品|規格|カード|CSV|在庫", x)]
    head_c = "".join(x + "。" for x in carry if "確かめる" not in x)
    tail_c = "".join(x + "。" for x in carry if "確かめる" in x)
    new = how[:st] + head_c + b + tail_c + how[en:]
    if any(p.get("card") for p in ps):
        reasons.append("カード商品は、元の商品登録画面と同じく「カード指定 >」でカードを選ぶ。商品カテゴリは元が指定のとき（または指定が無いとき単体カード）に付け替える")
    if len(ps) > 1:
        reasons.append("CSVの行の順を元の登録順にしたので、商品IDは行の順に大きくなる（元の手順の大小の確認はそのまま）")
    out.append([sid, "直す", new, "", BASIS, "。".join(reasons)])

write_out(FID, out)
print(len(out))
