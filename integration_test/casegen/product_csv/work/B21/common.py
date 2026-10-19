import re, pathlib
P = pathlib.Path(__file__).resolve().parents[2]
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(fid):
    ls = [l.split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8").read().split("\n")[1:] if l.strip()]
    return {r[0]: r for r in ls}, [r[0] for r in ls]

def save(fid, out):
    ids = [l.split("\t")[0] for l in open(P / f"in/{fid}.tsv", encoding="utf-8").read().split("\n")[1:] if l.strip()]
    assert [o[0] for o in out] == ids, (fid, len(out), len(ids))
    with open(P / f"out/{fid}.tsv", "w", encoding="utf-8") as f:
        f.write("\t".join(HDR) + "\n")
        for o in out:
            assert len(o) == 6 and all("\t" not in c and "\n" not in c for c in o), o[0]
            f.write("\t".join(o) + "\n")

CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"

def row(code, nja=None, nen=None, lang="日本語", base=1000, buy=10, cost=10):
    nja = nja or code
    nen = nen or nja
    lg = {"日本語": "日本語のID", "英語": "英語のID"}.get(lang, lang)
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{nja}」・商品名(英)は「{nen}」・言語(ID)は{lg}"
            f"・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}"
            f"・購入グループ名称は既存の購入グループの名称・基準価格{base}・販売価格{base}・買取価格{buy}・原価単価{cost}"
            f"・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def csv_up(rows, stock_note=True, nm_note=True):
    """rows: row() の戻り値のリスト。1行ならそのまま、複数なら行ごとに"""
    n = len(rows)
    if n == 1:
        body = rows[0]
        head = "1行を書いたCSV"
    else:
        body = "；".join(f"{i+1}行目: {r}" for i, r in enumerate(rows))
        head = f"{n}行を書いたCSV"
    s = (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{head}をCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
         f"表示された確認モーダルでアップロードを確定する（{body}）。")
    s += "グッズ商品は状態ニアミントの規格が1件作られる" + ("（開店中の店舗ごと・在庫区分ごとに在庫数0の在庫も同時に作られる）" if stock_note else "") + "。"
    return s

def lookup(code, label):
    return (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
            f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。")

COMMON_COLS = ("商品IDは空・言語(ID)は{lg}・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は" + CAT +
               "・購入グループ名称は既存の購入グループの名称・基準価格{b}・販売価格{b}・買取価格{m}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def csv_many(codes, names=None, lang="日本語", base=1000, buy=10, stock_note=False):
    """行数が多いときの書き方。共通の列を1回書き、行ごとの列（商品コード・商品名）を並べる"""
    names = names or codes
    n = len(codes)
    lg = {"日本語": "日本語のID", "英語": "英語のID"}[lang]
    lst = "・".join(f"「{c}」" for c in codes)
    nl = "・".join(f"「{c}」" for c in names)
    com = COMMON_COLS.format(lg=lg, b=base, m=buy)
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
            f"表示された確認モーダルでアップロードを確定する（全{n}行に共通の列: {com}；行ごとの列: 1行目から順に、商品コードは{lst}、商品名(日)と商品名(英)は同じ値で{nl}）。"
            f"グッズ商品は状態ニアミントの規格が{n}件（商品ごとに1件）作られる。")

OPEN_EDIT = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き"
SPEC_LIST = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く"

def card_attach(name, which="登録したカード詳細", extra=""):
    return (f"「カード指定 >」ボタンを押し、カード検索ポップアップで{which}の行の決定ボタンを押す。続けて商品名(日)に「{name}」、商品名(英)に「{name}」を入れ（カード指定で自動で入った値は書き換える）、"
            f"{extra}商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。")

def first_spec(lang, state, label=None, memo=None, listed=True):
    s = (f"商品規格一覧で言語{lang}・状態{state}の規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で"
         + (f"状態別称（個別メモ）に「{memo}」を入れ、" if memo else "")
         + "高額商品コードは空のまま、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    if label:
        s += f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{label}〕）。"
    return s

def add_spec(lang, state, code, base, buy, label=None, memo=None):
    s = (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{lang}、状態に{state}を選び、商品コードに「{code}」、"
         + (f"状態別称（個別メモ）に「{memo}」、" if memo else "")
         + f"基準価格(円)・販売価格(円)に{base}、買取価格(円)に{buy}を入れ、高額商品コードは空のまま、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    if label:
        s += f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{label}〕）。"
    return s
