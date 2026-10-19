import re, pathlib
P = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv")
HDR = "シードID\t判定\t新しい投入方法\t新しい状態・属性\t根拠\t理由"

def read_in(fid):
    ls = open(P / f"in/{fid}.tsv", encoding="utf-8").read().split("\n")
    hdr = ls[0].split("\t")
    return [dict(zip(hdr, l.split("\t"))) for l in ls[1:] if l.strip()]

def write_out(fid, recs):
    out = [HDR]
    for r in recs:
        row = [r[0], r[1], r[2], r[3], r[4], r[5]]
        for c in row:
            assert "\t" not in c and "\n" not in c, (r[0])
        out.append("\t".join(row))
    (P / f"out/{fid}.tsv").write_text("\n".join(out) + "\n", encoding="utf-8")

CATEGORY = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
LANG = {"JP": "日本語のID", "EN": "英語のID"}

def row_phrase(r, i=None, n=1):
    """r: code,name_ja,name_en,base,buy,[lang,pub,br,cost,extra]"""
    pre = f"{i}行目は" if n > 1 else ""
    s = (pre + f"商品IDは空・商品コードは「{r['code']}」・商品名(日)は「{r['name_ja']}」・商品名(英)は「{r['name_en']}」・言語(ID)は{r.get('lang','日本語のID')}"
         f"・商品公開ステータスは{r.get('pub',2)}（公開）・支店の商品公開ステータスは{r.get('br',1)}（{'公開' if r.get('br',1)==1 else '非公開'}）"
         f"・サイズ1・重量1・商品カテゴリ(ID)は{CATEGORY}・購入グループ名称は{r.get('group','既存の購入グループの名称')}"
         + (f"・{r['extra']}" if r.get('extra') else "")
         + f"・基準価格{r['base']}・販売価格{r['base']}・買取価格{r['buy']}・原価単価{r.get('cost',100)}・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")
    return s

def csv_step(rows):
    n = len(rows)
    body = "／".join(row_phrase(r, i + 1, n) for i, r in enumerate(rows))
    return (f"グッズ商品CSV登録で雛形ファイルをダウンロードし、{n}行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{body}）。"
            "グッズ商品は状態ニアミントの規格が商品ごとに1件作られる。")

def open_product(code, label=None):
    s = f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し"
    if label:
        s += f"、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）。商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き"
    else:
        s += "、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き"
    return s

def card_edit(code, label, name_ja, name_en, card, cat, extra="", rate="販売割引率に登録済みのもの"):
    return (open_product(code, label) + f"、「カード指定 >」ボタンを押し、カード検索ポップアップで{card}の行の決定ボタンを押す。"
            f"続けて商品名(日)に「{name_ja}」、商品名(英)に「{name_en}」を入れ（カード指定で自動で入った値は書き換える）、商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、"
            f"{extra}割引率に{rate}を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。")

def spec_list_open():
    return "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く。"

def spec_inplace(lang_label, fields, tail=""):
    """CSVが作ったNMの規格を直す。fields: 'xxxに...を入れ'"""
    return (spec_list_open() + f"商品規格一覧で言語{lang_label}・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で{fields}「商品規格を登録」ボタンを押す。" + tail)

def spec_new_and_delete(code_old, lang_label, state, fields, tail=""):
    """新しい規格を足し、CSVが作った日本語・NMの規格を削除する"""
    return (spec_list_open() + f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{lang_label}、状態に{state}を選び、{fields}「商品規格を登録」ボタンを押す。" + tail +
            f"商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格。商品コード「{code_old}」）の行を開き、商品規格登録編集画面の「商品規格を削除」ボタンを押して削除する（規格が最後の1件のときは削除できないので、新しい規格を先に作る）。")
