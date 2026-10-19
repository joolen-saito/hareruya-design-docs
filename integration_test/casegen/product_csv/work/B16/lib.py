# B16 用の共通部品。商品を作る文を、グッズ商品CSV登録の文に組み立てる。
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
LANG_ID = {"ja": "日本語のID", "en": "英語のID", "fr": "FRの言語のID"}
LANG_NAME = {"ja": "日本語", "en": "英語", "fr": "FR"}
LANG_CODE = {"JP": "ja", "EN": "en", "FR": "fr"}


def csv_row(p):
    """p: dict(code, ja, en, lang, pub(True/False), base, buy, extra)"""
    pub = "2（公開）" if p.get("pub", True) else "1（非公開）"
    extra = p.get("extra", "")
    return (
        f"商品IDは空・商品コードは「{p['code']}」・商品名(日)は「{p['ja']}」・商品名(英)は「{p['en']}」"
        f"・言語(ID)は{LANG_ID[p['lang']]}・商品公開ステータスは{pub}・支店の商品公開ステータスは1（公開）"
        f"・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称{extra}"
        f"・基準価格{p['base']}・販売価格{p['base']}・買取価格{p['buy']}・原価単価10・地域別販売制限は0"
        f"・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空"
    )


def upload_sentence(prods):
    n = len(prods)
    head = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、" + (f"{n}行を書いたCSV" if n > 1 else "1行を書いたCSV")
            + "をCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（")
    if n == 1:
        body = csv_row(prods[0])
    else:
        body = "／".join(f"{i + 1}行目は{csv_row(p)}" for i, p in enumerate(prods))
    return head + body + "）"


def after_upload(prods):
    if len(prods) == 1:
        return "グッズ商品は状態ニアミントの規格が1件作られる"
    return "グッズ商品は状態ニアミントの規格が商品ごとに1件ずつ作られる"


def open_edit(p):
    return (f"商品マスター(検索入力)で商品コードに「{p['code']}」を入れて「検索する >」を押し、"
            "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開く")


def card_steps(p):
    """カード指定。p['card']=dict(name, abbr(None可), category('単体カード'|None))"""
    c = p["card"]
    s = (f"「カード指定 >」ボタンを押し、カード検索ポップアップのカード名(日/英)に「{c['name']}」を入れて検索ボタンを押し、"
         "検索結果の行の決定ボタンを押す")
    t = f"続けて商品名(日)に「{p['ja']}」、商品名(英)に「{p['en']}」を入れ（カード指定で自動で入った値は書き換える）、"
    if c.get("abbr"):
        t += f"略称タグに「{c['abbr']}」を選び、"
    t += "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みの割引率を選び、"
    t += "公開状態は「公開」のまま「商品を登録」ボタンを押す"
    return [s, t]


def first_spec(sp):
    """CSVが作ったNM規格を開いて直す。sp: dict(lang, unlimited, sale, shelf)"""
    items = ""
    if sp.get("unlimited"):
        items += "在庫無制限にチェックを入れ、"
    if sp.get("sale") is not None:
        items += f"セールフラグにチェックを入れて販売価格(円)に{sp['sale']}を入れ、"
    if sp.get("shelf"):
        items += f"棚番号に「{sp['shelf']}」を入れ、"
    return (f"商品規格一覧で言語{LANG_NAME[sp['lang']]}・状態NMの規格（取り込みで作られた規格）の行を開き、"
            f"商品規格登録編集画面で{items}部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す")


def new_spec(sp):
    """商品規格一覧の「新規作成」から足す。sp: dict(lang,state,code,base,buy,sale,shelf,unlimited)"""
    sale = sp.get("sale")
    sell = sp["base"] if sale is None else sale
    t = (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{LANG_NAME[sp['lang']]}、状態に{sp['state']}を選び、"
         f"商品コードに「{sp['code']}」、基準価格(円)に{sp['base']}、販売価格(円)に{sell}、買取価格(円)に{sp['buy']}を入れ、")
    if sale is not None:
        t += "セールフラグにチェックを入れ、"
    if sp.get("shelf"):
        t += f"棚番号に「{sp['shelf']}」を入れ、"
    if sp.get("unlimited"):
        t += "在庫無制限にチェックを入れ、"
    t += "部門は選択肢の先頭を選び、スマレジ連携フラグは連携しないを選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す"
    return t


def stock_sentences(items, note_code=True):
    """items: [(商品コード, 規格の言語, 状態, 増減数)] 在庫を入れて承認する。"""
    out = []
    for code, lang, state, n in items:
        out.append(
            f"在庫検索一覧で商品コード「{code}」を検索し、店舗が本店・在庫区分がEC-CUBE（ECサイト在庫）の行の商品名を押して在庫編集を開き、"
            f"在庫変動区分で「入庫/その他」を選び、在庫変動理由に「結合テストのデータ作成」、在庫増減数に{n}、仕入単価に0を入れ、"
            f"承認通知先（メンバー選択）で承認者を選んで「登録」を押す")
    codes = "」「".join(i[0] for i in items)
    out.append(
        f"登録者とは別の、本店の承認権限を持つ管理者でログインし直し、在庫編集承認一覧で承認状態が「未承認」の商品コード「{codes}」の在庫編集を開いて「承認する」を押す")
    return out
