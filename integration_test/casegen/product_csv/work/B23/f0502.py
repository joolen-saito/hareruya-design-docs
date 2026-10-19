import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B23")
from common import *

SHARE_A = "共有マスタの「シングルカード」（〔カテゴリID-F0502-共有A〕）"
TAG_SHARE = "共有マスタの「最新入荷アイテム」（〔タグID-F0502-共有〕）のタグのID"


def Pd(code, ja=None, en=None, price=100, buy=100, lang="日本語のID", cat=None, tag=None, hi=None, pg=None):
    return dict(code=code, ja=ja or code, en=en or ja or code, price=price, buy=buy, lang=lang, cat=cat, tag=tag, hi=hi, pg=pg)


def seq(prefix, names, **kw):
    return [Pd(f"{prefix}{n}", **kw) for n in names]


SPECS = {}
SPECS["S-F05-02-URL-004"] = dict(P=[Pd("URL-001-004", cat=SHARE_A, tag=TAG_SHARE)])
SPECS["S-F05-02-FOIL-FRAME-005"] = dict(P=[Pd("FOIL-SPECIAL-005", "F0502-FOIL-005"), Pd("FOIL-OTHER-005", "F0502-FOIL-005")])
codes6 = ["DETAIL-ALL-006"] + [f"DETAIL-DIFF-{i:02d}-006" for i in range(1, 15)]
p6 = []
for c in codes6:
    ja = "F0502-DIFF-NAME-006" if c == "DETAIL-DIFF-01-006" else "F0502-ALL-006"
    cat = "「F0502別カテゴリ」" if c == "DETAIL-DIFF-02-006" else "「F0502カテゴリ」"
    lang = "英語のID" if c == "DETAIL-DIFF-10-006" else "日本語のID"
    p6.append(Pd(c, ja, cat=cat, lang=lang))
SPECS["S-F05-02-DETAIL-006"] = dict(P=p6)
SPECS["S-F05-02-IDENTITY-007"] = dict(P=[Pd(c, "F0502-IDENTITY-007") for c in ["IDENTITY-W-007", "IDENTITY-WU-007", "IDENTITY-U-007"]])
SPECS["S-F05-02-FOIL-FRAME-008"] = dict(P=[Pd(c, "F0502-FOIL-008") for c in ["F0502-FOIL-SPECIAL-008", "F0502-FOIL-OTHER-008"]])
SPECS["S-F05-02-FOIL-FRAME-009"] = dict(P=[Pd(c, "F0502-FRAME-009") for c in ["F0502-FRAME-NORMAL-009", "F0502-FRAME-SPECIAL-009"]])
SPECS["S-F05-02-BANNED-011"] = dict(P=[Pd(c, "F0502-BAN-011") for c in ["BAN-REGULAR-011", "BAN-PROHIBITED-011"]])
T13 = "〔タグID-F0502-013〕の「T-F0502-013」のタグのID"
SPECS["S-F05-02-TAG-013"] = dict(P=[Pd("PRESERVE-BOTH-013", "F0502-PRESERVE-013", tag=T13), Pd("PRESERVE-TAG-013", tag=T13), Pd("PRESERVE-NAME-013", "F0502-PRESERVE-013")])


def carry(n):
    return [Pd(f"SOURCE-CARD-{n}", price=100, buy=100)] + [Pd(f"CARRY-{k}-{n}", f"F0502-CARRY-{n}", price=b, buy=b) for k, b in [("HIGH", 3000), ("LOW", 1000), ("NORMAL", 2000), ("OTHER", 2000)]]


def carrymap(n, a, b):
    return (f"（SOURCE-CARD-{n}・CARRY-HIGH-{n}・CARRY-LOW-{n}・CARRY-NORMAL-{n}は〔カードID-F0502-{n}A〕のカードのカード詳細を、Foilが通常・特殊・特殊・通常の順に、CARRY-OTHER-{n}は〔カードID-F0502-{n}B〕のカードのカード詳細）")


SPECS["S-F05-02-CARRY-014"] = dict(P=carry("014"), cardmap=carrymap("014", "A", "B"))
SPECS["S-F05-02-CARRY-015"] = dict(P=carry("015"), cardmap=carrymap("015", "A", "B"))
SPECS["S-F05-02-CARRY-021"] = dict(P=carry("021"), cardmap=carrymap("021", "A", "B"))
SPECS["S-F05-02-PAGING-017"] = dict(P=[Pd(f"PAGING-{i:03d}-017", "F0502-PAGING-017") for i in range(1, 62)], seqcode=("PAGING-001-017", "PAGING-061-017"))
SPECS["S-F05-02-ELIGIBILITY-018"] = dict(P=[
    Pd("ELIGIBLE-NOSTOCK-018", "F0502-ELIGIBILITY-018", price=1, buy=1),
    Pd("ELIGIBLE-STOCK-018", "F0502-ELIGIBILITY-018", price=9999, buy=600),
    Pd("BUY-ZERO-018", "F0502-ELIGIBILITY-018", price=100, buy=0),
    Pd("STATE-EX-018", "F0502-ELIGIBILITY-018"),
    Pd("HIGH-CODE-018", "F0502-ELIGIBILITY-018", hi="F0502-HIGH-018"),
    Pd("RESERVED-018", "F0502-ELIGIBILITY-018", pg="上で登録した予約商品フラグ付きの購入グループの名称"),
])
SPECS["S-F05-02-TAG-019"] = dict(P=[Pd("TAG-DISPLAY-019", tag="〔タグID-F0502-019〕の「T-F0502-019」のタグのID")])
SPECS["S-F05-02-LOGIC-023"] = dict(P=[Pd(c, "F0502-LOGIC-COLOR-023") for c in ["LOGIC-R-023", "LOGIC-U-023", "LOGIC-RU-023"]] + [Pd(c, "F0502-LOGIC-TYPE-023") for c in ["LOGIC-C-023", "LOGIC-A-023", "LOGIC-CA-023"]])
SPECS["S-F05-02-ALLEMPTY-024"] = dict(P=[Pd("ALLEMPTY-024", "F0502-ALLEMPTY-024")])
SPECS["S-F05-02-DEFOP-026"] = dict(P=[Pd(c, "F0502-DEFOP-COLOR-026") for c in ["DEFOP-R-026", "DEFOP-U-026", "DEFOP-RU-026"]] + [Pd(c, "F0502-DEFOP-TYPE-026") for c in ["DEFOP-C-026", "DEFOP-A-026", "DEFOP-CA-026"]])
SPECS["S-F05-02-TYPEAND-027"] = dict(P=[Pd(c, "F0502-TYPEAND-027") for c in ["TYPEAND-C-027", "TYPEAND-A-027", "TYPEAND-CA-027"]])
SPECS["S-F05-02-IDENTITY-028"] = dict(P=[Pd(c, "F0502-IDENTITY-028") for c in ["F0502-IDW-028", "F0502-IDU-028", "F0502-IDWU-028", "F0502-IDWK-028"]])
SPECS["S-F05-02-COLORONLY-029"] = dict(P=[Pd("F0502-CR-029", "F0502-CONLY-R-029"), Pd("F0502-CU-029", "F0502-CONLY-U-029")])
SPECS["S-F05-02-MIXURL-030"] = dict(P=[Pd("F0502-MIX-030", cat=SHARE_A, tag=TAG_SHARE)])

SPAN = re.compile(r"商品管理の商品登録で、.*?商品規格登録画面の商品規格IDの欄に表示された番号を控える(（[^）]*）)?。", re.S)
PID = re.compile(r"商品登録画面の商品IDの欄に表示された番号を控える(（[^）]*）)?")
CARD = re.compile(r"カード一覧のIDの欄に表示された番号を控える(（[^）]*）)?")


def qlist(codes):
    return "".join(f"「{c}」" for c in codes)


def csv_text(ps, seqcode=None):
    n = len(ps)
    codes = [p["code"] for p in ps]
    pgs = [p["pg"] or PG_NORMAL for p in ps]
    head = f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（"
    common = f"商品IDは空・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"
    parts = [common]
    if seqcode:
        parts.append(f"商品コードは「{seqcode[0]}」から「{seqcode[1]}」まで連番で1行に1つ（61行）")
    elif n == 1:
        parts.append(f"商品コードは「{codes[0]}」")
    else:
        parts.append("商品コードは順に" + qlist(codes))
    parts.append(summarize("商品名(日)", [p["ja"] for p in ps], codes, lambda v: f"「{v}」"))
    parts.append(summarize("商品名(英)", [p["en"] for p in ps], codes, lambda v: f"「{v}」"))
    parts.append(summarize("言語(ID)", [p["lang"] for p in ps], codes))
    prices = [p["price"] for p in ps]
    if len(set(prices)) == 1:
        parts.append(f"基準価格{prices[0]}・販売価格{prices[0]}")
    else:
        parts.append("基準価格と販売価格は順に" + "・".join(str(v) for v in prices))
    buys = [p["buy"] for p in ps]
    if len(set(buys)) == 1:
        parts.append(f"買取価格{buys[0]}")
    else:
        parts.append("買取価格は順に" + "・".join(str(v) for v in buys))
    parts.append(summarize("購入グループ名称", pgs, codes))
    tags = [p["tag"] for p in ps]
    if any(tags):
        if all(tags) and len(set(tags)) == 1:
            parts.append(summarize("タグ(ID)", tags, codes))
        else:
            tg = [(c, t) for c, t in zip(codes, tags) if t]
            parts.append("タグ(ID)は" + "、".join(f"{c}は{t}" for c, t in tg) + "（ほかの行は空）")
    his = [p["hi"] for p in ps]
    return head + "・".join(parts) + "）。グッズ商品は状態ニアミントの規格が1件ずつ作られる。"


def build(sid, old):
    spec = SPECS[sid]
    ps = spec["P"]
    n = len(ps)
    m = SPAN.search(old)
    assert m, sid
    span = m.group(0)
    pid = PID.search(span)
    pidp = pid.group(1) or ""
    cls_paren = re.search(r"商品規格登録画面の商品規格IDの欄に表示された番号を控える(（[^）]*）)?。$", span).group(1) or ""
    cards = CARD.findall(old[:m.start()])
    codes = [p["code"] for p in ps]
    if spec.get("cardmap"):
        cardnote = spec["cardmap"]
    elif cards:
        cardnote = "（カードは" + "".join(c.strip("（）") for c in cards[:1]) + "）"
    else:
        cardnote = "（上のカード新規登録で登録したカード）"
    # 1) CSV
    out = csv_text(ps, spec.get("seqcode"))
    # 2) 商品IDを控える
    if n == 1:
        out += f"商品マスター(検索入力)で商品コードに「{codes[0]}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える{pidp}。"
    else:
        out += f"商品コードの記載順に1件ずつ、商品マスター(検索入力)で商品コードに入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える{pidp}。"
    # 3) 編集
    names = [p["ja"] for p in ps]
    cats = [p["cat"] for p in ps]
    nm = summarize("商品名(日)と商品名(英)", names, codes, lambda v: f"「{v}」") if len(set(names)) == 1 or n > 4 else "、".join(f"{c}は商品名(日)と商品名(英)に「{p['ja']}」" for c, p in zip(codes, ps))
    nm = nm.replace("は全行とも", "は全商品とも").replace("の行だけ", "だけ").replace("、ほかの行は", "、ほかの商品は")
    nm = nm.replace("商品名(日)と商品名(英)は", "商品名(日)と商品名(英)に").replace("は順に", "に順に")
    cattext = ""
    if any(cats):
        if n == 1:
            cattext = f"商品カテゴリはサプライ・グッズの選択を外して{cats[0]}を選び、"
        else:
            ct = summarize("商品カテゴリ", cats, codes)
            ct = ct.replace("は全行とも", "は全商品とも").replace("の行だけ", "だけ").replace("、ほかの行は", "、ほかの商品は")
            cattext = "商品カテゴリはサプライ・グッズの選択を外して、" + ct.replace("商品カテゴリは", "") .replace("全商品とも", "全商品とも") + "を選び、"
    each = "" if n == 1 else "各商品について、"
    out += (f"{each}商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード指定のカード検索で対応するカード詳細{cardnote}を選んで決定ボタンを押す。"
            f"続けて{nm}を入れ（カード指定で自動で入った値は書き換える）、{cattext}割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。")
    # 4) 規格
    hi = [p for p in ps if p["hi"]]
    prices = [p["price"] for p in ps]
    buys = [p["buy"] for p in ps]
    if len(set(prices)) == 1 and len(set(buys)) == 1:
        pr = f"基準価格(円)と販売価格(円)に{prices[0]}、買取価格(円)に{buys[0]}"
    else:
        pr = "次の値（商品コードごと。" + "、".join(f"{c}は基準価格(円)と販売価格(円)に{p['price']}・買取価格(円)に{p['buy']}" for c, p in zip(codes, ps)) + "）"
    hitext = "".join(f"、{p['code']}だけ高額商品コードに「{p['hi']}」" for p in hi)
    each2 = "" if n == 1 else "各商品について、"
    out += (f"{each2}商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、その商品の商品コードの規格（取り込みで作られた状態NMの規格）の行を開き、商品規格登録編集画面で{pr}{hitext}を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
            f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える{cls_paren}。")
    return old[:m.start()] + out + old[m.end():]


def main():
    ih, I = load("F05-02")
    ix = {c: i for i, c in enumerate(ih)}
    rows = []
    for r in I:
        sid = r[0]
        old = r[ix["投入方法"]]
        new = build(sid, old)
        why = []
        cats = [p["cat"] for p in SPECS[sid]["P"]]
        if not any(cats):
            why.append("元のカテゴリは「任意の1件（必須項目）」なので、取り込んだサプライ・グッズのカテゴリのまま付け替えない")
        if any(p["ja"] == p["code"] and sid.split("-")[-1] not in ("028",) for p in SPECS[sid]["P"]):
            why.append("元の商品名(日)が「任意の名称」だった商品は、商品名(日)を商品コードと同じ値にした")
        why.append("商品名(英)は元が任意の名称なので商品名(日)と同じ値にした。購入グループは元の「予約商品フラグの付いていないもの」を購入グループ名称の列で指す")
        why.append("グッズ商品CSVには割引率の列が無いので、編集画面では販売割引率に登録済みのものを選ぶ")
        if sid.endswith("DETAIL-006"):
            why.append("DETAIL-DIFF-10-006 の言語は言語(ID)の列（M03-27 Excel L0196）で英語にした。ただし M03-27 L0082 は『日本語固定で登録する』とも書き、設計書内で食い違う")
        if "TAG" in sid or "URL" in sid or "MIX" in sid:
            why.append("タグはグッズ商品CSVのタグ(ID)の列（M03-27 L0221）で入れた")
        if "CARRY" in sid:
            why.append("販売価格100円をDBで設定する文は元のまま。CSVの基準価格と販売価格は買取価格と同額（M03-27 L0119・M03-09 L0086〜L0087）")
        if "ELIGIBILITY" in sid:
            why.append("販売価格0円・カード状態EXをDBで設定する文は元のまま。高額商品コードはグッズ商品CSVに列が無いので規格の画面で入れる")
        if "PAGING-017" in sid:
            why.append("61商品は1つのCSVの61行で作る。商品ごとの控え操作は元と同じ61件")
        base = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0218・L0221・L0232、M03-02 L0075〜L0077・L0092・L0152、M03-09 L0077・L0086〜L0087"
        rows.append([sid, "直す", new, "", base, "。".join(why)])
    write("F05-02", rows)


main()
