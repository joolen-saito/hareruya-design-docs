import re, pathlib

P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]


def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P / f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]


def write(fid, O):
    with open(P / f'out/{fid}.tsv', 'w', encoding='utf-8') as fh:
        fh.write('\t'.join(HDR) + '\n')
        for x in O:
            assert len(x) == 6, x[0]
            assert all('\t' not in c and '\n' not in c for c in x), x[0]
            fh.write('\t'.join(x) + '\n')


GOODS = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
LANG = {"JP": "日本語", "EN": "英語", "FR": "フランス語", "DE": "ドイツ語", "KR": "韓国語"}
DISC = "割引率に販売割引率に登録済みの割引率を選んで"
PUB = {1: "1（非公開）", 2: "2（公開）", 3: "3（廃止）"}


def csv_row(code, ja, en=None, lang="日本語", pub=2, branch=1, base=1000, sale=None, buy=None, cost=10,
            region=0, tag=None, cardset=None, size=1, weight=1):
    en = en if en is not None else ja
    sale = base if sale is None else sale
    if buy is None:
        buy = min(100, base // 2)
    ex = ""
    if tag:
        ex += f"・タグ(ID)は{tag}"
    if cardset:
        ex += f"・カードセット(ID)は{cardset}"
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は{lang}のID"
            f"・商品公開ステータスは{PUB[pub]}・支店の商品公開ステータスは{branch}（{'公開' if branch else '非公開'}）"
            f"・サイズ{size}・重量{weight}・商品カテゴリ(ID)は{GOODS}・購入グループ名称は既存の購入グループの名称{ex}"
            f"・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価{cost}・地域別販売制限は{region}・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")


def csv_upload(rows, kind="ニアミント"):
    n = len(rows)
    body = rows[0] if n == 1 else "／".join(f"{i + 1}行目は{r}" for i, r in enumerate(rows))
    tail = "グッズ商品は状態ニアミントの規格が1件作られる" if n == 1 else "グッズ商品は状態ニアミントの規格が商品ごとに1件ずつ作られる"
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
            f"表示された確認モーダルでアップロードを確定する（{body}）。{tail}")


def open_edit(code=None):
    """商品コードで商品マスターを検索して既存の商品の編集画面を開く。code=None は『各商品の商品コード』"""
    c = f"「{code}」" if code else "その商品の商品コード"
    return (f"商品マスター(検索入力)で商品コードに{c}を入れて「検索する >」を押し、"
            f"商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き")


def spec_list_open():
    return "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く"


def spec_edit_nm(lang="日本語", extras="", note="取り込みで作られた規格"):
    return (f"商品規格一覧で状態ニアミント・{lang}の規格（{note}）の行を開き、商品規格登録編集画面で{extras}"
            f"部門は選択肢の先頭を選び、公開ステータスに公開を選んで「商品規格を登録」ボタンを押す")


def spec_open_edit(code=None, lang="日本語", extras="", note="取り込みで作られた規格"):
    """商品を開いて取り込みの規格を直す（商品の編集はしない）"""
    return open_edit(code) + "、" + spec_list_open() + "。" + spec_edit_nm(lang, extras, note)


def card_pick(card_desc="先に登録したカード詳細（カード名(英)が商品コードと同じカード）"):
    return f"「カード指定 >」ボタンを押し、カード検索ポップアップで{card_desc}の行の決定ボタンを押す"


def sub(sents, pat, new, n=1):
    """pat に当たる文を new に置き換える（None は削除）。当たる数が n でなければ止める"""
    idx = [i for i, s in enumerate(sents) if s is not None and re.search(pat, s)]
    assert len(idx) == n, (pat, len(idx), [sents[i][:40] for i in idx])
    for k, i in enumerate(idx):
        v = new[k] if isinstance(new, list) else new
        sents[i] = v
    return idx


def joined(sents):
    return '。'.join(s for s in sents if s is not None)


def drop(sents, pat, n=None):
    idx = [i for i, s in enumerate(sents) if s is not None and re.search(pat, s)]
    if n is not None:
        assert len(idx) == n, (pat, len(idx))
    for i in idx:
        sents[i] = None
    return idx


def stock(store, items):
    codes = "、".join(f"「{c}」" for c, _ in items)
    rows = "・".join(f"商品コード「{c}」・在庫増減数「{q}」" for c, q in items)
    return (f"在庫変更CSV登録画面で、店舗に「{store}」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、承認通知先に承認するメンバーを選び、"
            f"{rows}・仕入単価「100」の{len(items)}行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す（M04-21 L0127〜L0135・L0166〜L0168）。"
            f"在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押す（M04-32 L0108・L0110・L0141・L0297）")
