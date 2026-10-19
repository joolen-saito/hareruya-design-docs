import re, pathlib
P = pathlib.Path(__file__).resolve().parents[2]
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-09 L0130〜L0134、M03-02 L0075〜L0077"

def load(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    h = ls[0]; ix = {c: i for i, c in enumerate(h)}
    rows = [x for x in ls[1:] if x and x != [""]]
    return ix, rows

def csv_one(code, jp, en, base, sale, buy, lang="日本語のID", status="2（公開）", restrict="0（日英の両サイト）"):
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
            f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{jp}」・商品名(英)は「{en}」・言語(ID)は{lang}・商品公開ステータスは{status}・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}・購入グループ名称は既存の購入グループの名称・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は{restrict}・部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。")

def open_prod(code):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開く。"

def spec_fix(extra="", lang="日本語", tail=""):
    return (f"「規格設定」ボタンから商品規格一覧を開き、取り込みで作られたニアミント・{lang}の規格の行から商品規格登録編集画面を開き、{extra}部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")

def stock_in(code, shop, qty, ap="承認通知先のメンバーを選んで"):
    return (f"管理画面の在庫一覧で商品コード「{code}」の{shop}・在庫区分「EC-CUBE」の在庫を選んで在庫編集画面を開き、在庫変動区分に入庫の区分、在庫変動理由に任意の文、在庫増減数に{qty}、仕入単価に任意の額を入れ、{ap}「登録」を押し、在庫編集承認一覧でこの申請を承認する。")

def write_out(fid, results):
    ix, rows = load(fid)
    ids = [r[0] for r in rows]
    assert ids == [x[0] for x in results], (fid, ids, [x[0] for x in results])
    for x in results:
        for c in x: assert "\t" not in c and "\n" not in c
        assert len(x) == 6
    p = P / f"out/{fid}.tsv"
    with open(p, "w", encoding="utf-8") as f:
        f.write("\t".join(HDR) + "\n")
        for x in results: f.write("\t".join(x) + "\n")

def keep(sid, why, basis="", ) :
    return [sid, "直さない", "", "", basis, why]
