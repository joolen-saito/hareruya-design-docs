import re, pathlib

P = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv")
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

CATID = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
PUB = {1: "1（非公開）", 2: "2（公開）", 3: "3（廃止）"}


def load(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    h = ls[0]
    out = []
    for r in ls[1:]:
        if not r or r == [""]:
            continue
        out.append(dict(zip(h, r)))
    return out


def save(fid, rows):
    """rows: list of (シードID, 判定, 新投入, 新属性, 根拠, 理由)"""
    for r in rows:
        assert len(r) == 6, r[0]
        for c in r:
            assert "\t" not in c and "\n" not in c, r[0]
    with open(P / f"out/{fid}.tsv", "w", encoding="utf-8") as f:
        f.write("\t".join(HDR) + "\n")
        for r in rows:
            f.write("\t".join(r) + "\n")


def row(code, ja, en, base, buy=0, cost=0, lang="日本語", pub=2, br=1, sale=None, limit=0):
    sale = base if sale is None else sale
    brt = "1（公開）" if br else "0（非公開）"
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は{lang}のID・"
            f"商品公開ステータスは{PUB[pub]}・支店の商品公開ステータスは{brt}・サイズ1・重量1・"
            f"商品カテゴリ(ID)は{CATID}・購入グループ名称は既存の購入グループの名称・"
            f"基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価{cost}・地域別販売制限は{limit}・"
            f"スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")


def upload(rows, tail=True):
    n = len(rows)
    if n == 1:
        head, body = "1行を書いたCSV", rows[0]
    else:
        head = f"{n}行を書いたCSV"
        body = "／".join(f"{i + 1}行目は{r}" for i, r in enumerate(rows))
    t = (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{head}をCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
         f"表示された確認モーダルでアップロードを確定する（{body}）。")
    if tail:
        t += "グッズ商品は状態ニアミントの規格が" + ("商品ごとに1件ずつ" if n > 1 else "1件") + "作られる。"
    return t


def find_open(code):
    """商品マスターで検索し、商品登録編集画面（既存の商品の編集）を開き、規格設定で商品規格一覧を開く"""
    return (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から"
            f"商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンで商品規格一覧を開く。")


def find_id(code, label):
    return (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の"
            f"商品IDに表示された番号を控える（{label}）。")


def sub(text, old, new, count=1):
    assert text.count(old) == count, (text.count(old), old[:60])
    return text.replace(old, new)


def span(text, start, end, new, incl_end=False):
    """start から end の直前（incl_end なら end を含めて）までを new に置き換える"""
    i = text.index(start)
    j = text.index(end, i + len(start))
    if incl_end:
        j += len(end)
    return text[:i] + new + text[j:]
