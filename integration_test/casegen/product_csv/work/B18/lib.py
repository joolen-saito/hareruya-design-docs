"""B18 共通部品。商品を新しく作る部分（CSV 取込）の文を組み立てる。"""
import re, pathlib

P = pathlib.Path(__file__).resolve().parents[2]
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

CAT = ("サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行の"
       "ID欄に表示された値）")
GRP_NORMAL = "購入グループ名称は既存の購入グループ（予約商品フラグが付いていないもの）の名称"
GRP_RESERVED = "購入グループ名称は予約商品フラグが付いた既存の購入グループの名称"


def read_in(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def write_out(fid, rows):
    for r in rows:
        assert len(r) == 6, r
        for x in r:
            assert "\t" not in x and "\n" not in x, (r[0], x[:40])
    with open(P / f"out/{fid}.tsv", "w", encoding="utf-8") as f:
        f.write("\t".join(HDR) + "\n")
        for r in rows:
            f.write("\t".join(r) + "\n")


def prod(code, name=None, name_en=None, lang="日本語", base=1000, sale=None, buy=100, cost=10,
         pub=2, branch=1, limit=None, tags=None, sales_tags=None, group=GRP_NORMAL, label=None, search=None):
    return dict(code=code, name=name or code, name_en=name_en or name or code, lang=lang, base=base,
                sale=sale if sale is not None else base, buy=buy, cost=cost, pub=pub, branch=branch,
                limit=limit, tags=tags, sales_tags=sales_tags, group=group, label=label, search=search)


def pub_txt(v):
    return {2: "2（公開）", 1: "1（非公開）", 3: "3（廃止）"}[v]


def br_txt(v):
    return {1: "1（公開）", 0: "0（非公開）"}[v]


def cols_of(p, opt=()):
    """1商品ぶんの CSV の列と値（順序つき）"""
    c = [
        ("商品ID", "商品IDは空"),
        ("商品コード", f"商品コードは「{p['code']}」"),
        ("商品名(日)", f"商品名(日)は「{p['name']}」"),
        ("商品名(英)", f"商品名(英)は「{p['name_en']}」"),
        ("言語", f"言語(ID)は{p['lang']}のID"),
        ("公開", f"商品公開ステータスは{pub_txt(p['pub'])}"),
        ("支店", f"支店の商品公開ステータスは{br_txt(p['branch'])}"),
        ("サイズ", "サイズ1"),
        ("重量", "重量1"),
        ("カテゴリ", f"商品カテゴリ(ID)は{CAT}"),
        ("購入グループ", p["group"]),
    ]
    if p["tags"] or "タグ" in opt:
        c.append(("タグ", f"タグ(ID)は{p['tags']}" if p["tags"] else "タグ(ID)は空"))
    if p["sales_tags"] or "売上分析タグ" in opt:
        c.append(("売上分析タグ", f"売上分析タグ(ID)は{p['sales_tags']}" if p["sales_tags"] else "売上分析タグ(ID)は空"))
    if p.get("search") or "検索ワード" in opt:
        c.append(("検索ワード", f"検索ワードは「{p['search']}」" if p.get("search") else "検索ワードは空"))
    if p["limit"] or "販売制限数" in opt:
        c.append(("販売制限数", f"販売制限数{p['limit']}" if p["limit"] else "販売制限数は空"))
    c += [
        ("基準価格", f"基準価格{p['base']}"),
        ("販売価格", f"販売価格{p['sale']}"),
        ("買取価格", f"買取価格{p['buy']}"),
        ("原価単価", f"原価単価{p['cost']}"),
        ("地域別", "地域別販売制限は0（日英の両サイト）"),
        ("スマレジ", "スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"),
    ]
    return c


def csv_clause(ps):
    """CSV 取込の文。複数行のときは共通の列を先に、行ごとに違う列を行ごとに書く"""
    n = len(ps)
    head = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、"
            + ("1行を書いたCSV" if n == 1 else f"{n}行（1行に1商品）を書いたCSV")
            + "をCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
              "表示された確認モーダルでアップロードを確定する（")
    opt = set()
    for p in ps:
        if p["tags"]: opt.add("タグ")
        if p["sales_tags"]: opt.add("売上分析タグ")
        if p["limit"]: opt.add("販売制限数")
        if p.get("search"): opt.add("検索ワード")
    allc = [cols_of(p, opt) for p in ps]
    if n == 1:
        return head + "・".join(v for _, v in allc[0]) + "）。"
    keys = [k for k, _ in allc[0]]
    for a in allc:
        assert [k for k, _ in a] == keys, "列の構成が行で違う"
    common, diff = [], []
    for i, k in enumerate(keys):
        vals = {a[i][1] for a in allc}
        (common if len(vals) == 1 else diff).append(i)
    # 同じ列は全行共通として先に書く。順序を保つため、先頭行から取る
    s = "全行共通は" if common else ""
    s += "・".join(allc[0][i][1] for i in common) if common else ""
    # 基準価格と販売価格が違う列扱いになると G9 が読みにくいので、行ごとの列でも先頭に並べる
    rows = []
    for r, a in enumerate(allc, 1):
        rows.append(f"{r}行目は" + "・".join(a[i][1] for i in diff))
    return head + (s + "。" if s else "") + "。".join(rows) + "）。"


def search_sentence(code, label):
    return (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
            f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（{label}）。") if label else \
           (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押す。")


def open_class_sentence(code, first=True):
    lead = "その行から" if first else f"商品コード「{code}」の行から"
    return (f"{lead}商品登録編集画面（既存の商品を開くだけで登録はしない）を開き、"
            "「規格設定」ボタンから商品規格一覧を開く。")


def class_edit_sentence(unlimited=False, label=None, extra="", lang="日本語"):
    s = (f"商品規格一覧で言語{lang}・状態ニアミントの規格（取り込みで作られた規格）の行を開き、"
         "商品規格登録編集画面で")
    if unlimited:
        s += "在庫無制限にチェックを入れ、"
    s += extra
    s += "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す"
    if label:
        s += f"。登録後の商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{label}）"
    return s + "。"
