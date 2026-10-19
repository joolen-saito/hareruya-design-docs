"""取り込んだあとの操作（既存の商品の編集・規格の画面）の文。F05-03 / F06-09 / M07-11 で共通"""
from lib import *

ONE_CARD_CAT = "単体カード"


def edit_sentence(p, first=True):
    """商品マスターで検索し、商品登録編集画面（既存の商品の編集）で必要な付け替えをして、規格設定へ進む。
    p のキー: code, label, card, cat, edit_tags(編集画面で選ぶタグ名), name, price_edit は別"""
    s = search_sentence(p["code"], p.get("label"))
    needs_edit = p.get("card") or p.get("cat") or p.get("edit_tags")
    lead = "その行から" if first or True else ""
    if not needs_edit:
        s += "その行から商品登録編集画面（既存の商品を開くだけで登録はしない）を開き、"
    else:
        s += "その行から商品登録編集画面（既存の商品の編集）を開き、"
        if p.get("card"):
            sel = p.get("card_ref") or f"カード名「{p['card']}」"
            s += (f"「カード指定 >」ボタンを押し、カード検索ポップアップで{sel}の行の決定ボタンを押す。"
                  f"続けて商品名(日)に「{p['name']}」、商品名(英)に「{p['name']}」を入れ（カード指定で自動で入った値は書き換える）、")
        cat = p.get("cat")
        if p.get("card") and not cat:
            cat = ONE_CARD_CAT
        if cat:
            s += f"商品カテゴリはサプライ・グッズの選択を外して「{cat}」を選び、"
        if p.get("edit_tags"):
            s += f"タグで{p['edit_tags']}を選び、"
        s += "割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。商品登録編集画面の"
    s += "「規格設定」ボタンから商品規格一覧を開く。" if not needs_edit else "「規格設定」ボタンから商品規格一覧を開く。"
    return s


def class_sentence(p, label=None, extra_before=""):
    lang = p.get("lang", "日本語")
    s = (f"商品規格一覧で言語{lang}・状態ニアミントの規格（取り込みで作られた規格）の行を開き、"
         "商品規格登録編集画面で")
    s += extra_before
    fe = p.get("first_edit") or {}
    if fe.get("sale_flag"):
        s += (f"セールフラグにチェックを入れ、基準価格(円)に「{fe['base']}」、販売価格(円)に「{fe['sale']}」を入れ、")
    if fe.get("high"):
        s += f"高額商品コードに「{fe['high']}」を入れ、"
    if p.get("unlimited"):
        s += "在庫無制限にチェックを入れ、"
    s += "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す"
    if label:
        s += f"。登録後の商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{label}）"
    return s + "。"


def add_class_sentence(code, lang, state, buy, base, label=None, high=None, sale=None, limit=None,
                       sale_flag=False, unlimited=False, dept=True):
    """商品規格一覧の「新規作成」で足す規格"""
    s = ("商品規格一覧の「新規作成」ボタンから商品規格登録編集画面を開き、"
         f"言語に「{lang}」、状態に「{state}」、商品コードに「{code}」、")
    s += f"基準価格(円)に「{base}」、"
    if sale_flag:
        s += f"セールフラグにチェックを入れて販売価格(円)に「{sale}」、"
    else:
        s += f"販売価格(円)に「{base}」、"
    s += f"買取価格(円)に「{buy}」"
    if limit:
        s += f"、販売制限数に「{limit}」"
    if high:
        s += f"、高額商品コードに「{high}」"
    if unlimited:
        s += "、在庫無制限にチェックを入れ"
    s += "、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す"
    if label:
        s += f"。登録後の商品規格登録編集画面の商品規格ID欄に表示された番号を控える（{label}）"
    return s + "。"
