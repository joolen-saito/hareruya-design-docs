import re, pathlib
P = pathlib.Path(__file__).resolve().parent.parent.parent
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(f):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{f}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]

def write(f, out):
    _, I = load(f)
    assert [r[0] for r in out] == [r[0] for r in I], f
    for r in out:
        assert len(r) == 6, r[0]
        for c in r:
            assert "\t" not in c and "\n" not in c, r[0]
    with open(P / f"out/{f}.tsv", "w", encoding="utf-8") as o:
        o.write("\t".join(HDR) + "\n")
        for r in out:
            o.write("\t".join(r) + "\n")

CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
LANG = {"日本語": "日本語のID", "英語": "英語のID", "FR": "言語FRのID"}

def row(code, nj, ne, base, buy, sale=None, lang="日本語", cardset=None):
    sale = base if sale is None else sale
    cs = f"・カードセット(ID)は{cardset}" if cardset else ""
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{nj}」・商品名(英)は「{ne}」・言語(ID)は{LANG[lang]}"
            f"・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}"
            f"・購入グループ名称は既存の購入グループの名称{cs}・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10"
            f"・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def csv_sentence(rows):
    n = len(rows)
    body = rows[0] if n == 1 else "／".join(f"{i+1}行目は{r}" for i, r in enumerate(rows))
    s = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、" + ("1行" if n == 1 else f"{n}行") +
         "を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（" + body + "）")
    return s + ("。グッズ商品は状態ニアミントの規格が1件作られる" if n == 1 else "。グッズ商品は商品ごとに状態ニアミントの規格が1件ずつ作られる")

def idnote(code, label=None):
    s = f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を"
    return s + (f"控える（{label}）" if label else "控える")

OPEN_EDIT = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き"
SPEC_LIST = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く"

def card_edit(name_ja, name_en, card_desc, extra="", cat_to=None):
    s = f"{OPEN_EDIT}、「カード指定 >」ボタンを押し、カード検索ポップアップで{card_desc}の行の決定ボタンを押す。続けて商品名(日)に「{name_ja}」、商品名(英)に「{name_en}」を入れ（カード指定で自動で入った値は書き換える）、"
    if cat_to:
        s += f"商品カテゴリはサプライ・グッズの選択を外して{cat_to}を選び、"
    s += extra
    s += "割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す"
    return s

def nm_edit(lang="日本語", pub=True, dept=True, label=None, pre=""):
    """CSVが作ったニアミントの規格を開いて直す"""
    s = f"商品規格一覧で言語{lang}・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で{pre}"
    if dept:
        s += "部門は選択肢の先頭を選び、"
    if pub:
        s += "公開ステータスに「公開」を選び、"
    s += "「商品規格を登録」ボタンを押す"
    if label:
        s += f"。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{label}）"
    return s

def new_class(lang, state, code, base, sale, buy, extra="", label=None, pub=True):
    s = (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{lang}、状態に{state}を選び、商品コードに「{code}」、"
         f"基準価格(円)に{base}、販売価格(円)に{sale}、買取価格(円)に{buy}を入れ、{extra}部門は選択肢の先頭を選び、")
    if pub:
        s += "公開ステータスに「公開」を選び、"
    s += "「商品規格を登録」ボタンを押す"
    if label:
        s += f"。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{label}）"
    return s

def del_tmp(code):
    return f"商品規格一覧で状態NMの規格（取り込みで作られた規格。商品コード「{code}」）の行を開き、「商品規格を削除」ボタンを押す（残す規格だけにする）"

def stock_csv(code, qty, shop, kind="入庫"):
    return (f"在庫変更CSV登録画面で店舗に{shop}を選び、在庫区分にEC-CUBE、在庫変動区分に{kind}の区分、在庫変動理由に任意の文字、承認通知先（所属選択・メンバー選択）に承認できるメンバーを入れ、"
            f"商品コード「{code}」・在庫増減数{qty}・仕入単価100 の1行のCSVファイルを選んで「一括登録を実行」を押す。在庫編集承認一覧画面でその行を選び一括承認ボタンを押して承認する")
