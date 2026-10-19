import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')

def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]

def write(fid, rows):
    out = ["\t".join(["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"])]
    for r in rows:
        assert len(r) == 6, r
        for c in r:
            assert "\t" not in c and "\n" not in c
        out.append("\t".join(r))
    (P/f'out/{fid}.tsv').write_text("\n".join(out) + "\n", encoding='utf-8')

CAT = {
    'goods': "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）",
    'info': "情報商材のカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「情報商材」の行のID欄に表示された値）",
}
LANG = {'日本語': '日本語のID', '英語': '英語のID', 'フランス語': 'フランス語のID'}

def csv_cols(code, ja, en, lang='日本語', cat='goods', base=1000, sale=None, buy=1000, extra=''):
    sale = base if sale is None else sale
    return (f"商品IDは空・商品コードは「{code}」・言語(ID)は{LANG[lang]}・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）"
            f"・商品名(日)は「{ja}」・商品名(英)は「{en}」・サイズ1・重量1・商品カテゴリ(ID)は{CAT[cat]}・購入グループ名称は「通常商品」・"
            f"{extra}基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")

def csv_step(cols, n=1):
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、"
            f"表示された確認モーダルでアップロードを確定する（{cols}）。グッズ商品は状態ニアミントの規格が1件作られる。")

def search_step(code, label=None):
    s = f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
    if label:
        s += f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。"
    else:
        s += "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
    return s
