import re, pathlib

P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')


def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P / f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]


GOODS = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
LANG = {"JP": "日本語", "EN": "英語", "KR": "韓国語"}
DISC = "割引率に販売割引率に登録済みの割引率を選び"
OPEN_EDIT = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
SPEC_OPEN_FROM_EDIT = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く"
SPEC_OPEN_NEW = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く"


def csv_row(code, ja, en, lang="JP", branch=0, extra="", base=1000, sale=1000, buy=100, size=1, weight=1):
    return (f"商品IDは空・商品コードは「{code}」・言語(ID)は{LANG[lang]}のID・商品公開ステータスは2（公開）・"
            f"支店の商品公開ステータスは{'1（公開）' if branch else '0（非公開）'}・商品名(日)は「{ja}」・商品名(英)は「{en}」・"
            f"サイズ{size}・重量{weight}・商品カテゴリ(ID)は{GOODS}・購入グループ名称は既存の購入グループの名称・{extra}"
            f"基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")


def csv_upload(rows):
    """rows: csv_row の文字列のリスト。複数行は 1行目は…／2行目は… と並べる"""
    n = len(rows)
    if n == 1:
        body = rows[0]
    else:
        body = "／".join(f"{i + 1}行目は{r}" for i, r in enumerate(rows))
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
            f"表示された確認モーダルでアップロードを確定する（{body}）。グッズ商品は状態ニアミントの規格が1件作られる")


def search(code, label=None):
    if label:
        return (f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
                f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）")
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押す"


def spec_edit(lang="JP", extras="", price_note=""):
    """CSVが作ったニアミントの規格の行を開いて直す"""
    return (f"商品規格一覧で状態ニアミント・{LANG[lang]}の規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で{extras}"
            f"部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す")


def stock_hq(code, qty, label_loc="本店"):
    return (f"在庫検索一覧で商品コード「{code}」を検索し、{label_loc}の在庫の在庫編集画面を開き、在庫変動区分で「入庫/その他」を選び、"
            f"在庫変動理由に「試験データ」、在庫増減数に{qty}、仕入単価に0を入れ、承認通知先（メンバー選択）で承認権限を持つ別の管理者を選んで登録ボタンを押す")


def stock_approve(codes_text, qty):
    return (f"その別の管理者で管理画面に入り、在庫編集承認一覧で{codes_text}の在庫編集を選択して「一括承認」を押し、確認で「承認する」を押し、"
            f"在庫検索一覧で各商品の在庫数が{qty}であることを確かめる")
