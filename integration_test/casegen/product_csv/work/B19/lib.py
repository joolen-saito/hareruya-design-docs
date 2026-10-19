import re, pathlib
P = pathlib.Path(__file__).resolve().parent.parent.parent
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(f):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{f}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]

def save(f, rows):
    for r in rows:
        assert len(r) == 6, r[0]
        for c in r:
            assert "\t" not in c and "\n" not in c, r[0]
    with open(P / f"out/{f}.tsv", "w", encoding="utf-8") as o:
        o.write("\t".join(HDR) + "\n")
        for r in rows:
            o.write("\t".join(r) + "\n")

CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
COMMON = ("支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は" + CAT
          + "・購入グループ名称は既存の購入グループの名称・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def extra_code(c):
    """CSV が作るニアミントの余り規格用。元の商品コードを部分文字列に含まない値にする（ハイフンを下線に替える）"""
    e = c.replace("-", "_")
    assert e != c, c
    return e

def prow(r, idx=None):
    ne = r.get("name_en") if r.get("name_en") is not None else r["name"]
    pre = ""
    if idx:
        pre = f"{idx}行目" + (f"（以下、{r['role']}）" if r.get("role") else "") + "は"
    s = (f"{pre}商品IDは空・商品コードは「{r['code']}」・商品名(日)は「{r['name']}」・商品名(英)は「{ne}」"
         f"・言語(ID)は{r.get('lang') or '日本語のID'}・商品公開ステータスは{r.get('pub') or '2（公開）'}")
    if r.get("tag"):
        s += f"・略称タグ(ID)は{r['tag']}"
    s += f"・基準価格{r['base']}・販売価格{r['base']}・買取価格{r['buy']}"
    return s

def csv_sentence(rows):
    n = len(rows)
    if n > 1:
        body = "全行共通の列は " + COMMON + "／" + "／".join(prow(r, i + 1) for i, r in enumerate(rows))
    else:
        body = prow(rows[0]) + "・" + COMMON
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、" + ("1行" if n == 1 else f"{n}行")
            + "を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（" + body + "）。"
            + "グッズ商品は状態ニアミントの規格が1件作られる")

def find_sentence(code):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き"

def edit_product(code, card=None, names=None, cat=None, tag=None, extra=None):
    s = find_sentence(code) + "、"
    if card:
        s += f"「カード指定 >」ボタンを押して表示されたカード検索ポップアップから{card}を選び、"
        if names:
            s += f"商品名に「{names[0]}」、商品名(英)に「{names[1]}」を入れ直し、"
    if cat:
        s += f"商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、"
    if tag:
        s += f"{tag}、"
    if extra:
        s += extra + "、"
    if not (card or cat or tag or extra):
        return s[:-2] + "く"
    s += "割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す"
    return s
