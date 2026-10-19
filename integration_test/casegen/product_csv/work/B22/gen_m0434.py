import re
from common import *
ih, I = load('M04-34')
ii = {c: i for i, c in enumerate(ih)}
PAIR = re.compile(
    r"商品登録画面で商品名に「(?P<nm>[^」]+)」、カテゴリに(?P<cat>サプライ以外のカテゴリ|サプライのカテゴリ|シングルカードでもサプライでもないカテゴリ)を選び"
    r"(?P<mid>、略称タグに「(?P<tag>[^」]+)」を選び、カード詳細検索で登録したカード詳細を選んで|、カード詳細を選ばずに|)登録する。"
    r"商品規格登録画面でその商品の商品コードに「(?P<code>[^」]+)」(?P<rest>[^。]*?)登録する。")
LANGS = {'JP': '日本語', 'EN': '英語', 'FR': 'フランス語'}
stats = {'n': 0}

def make(m, sid):
    nm, cat, tag, code, rest = m['nm'], m['cat'], m['tag'], m['code'], m['rest']
    lang = LANGS[re.search(r"言語に(\w+)", rest).group(1)] if "言語に" in rest else '日本語'
    state = re.search(r"状態に(\w+)", rest).group(1) if "状態に" in rest else 'NM'
    bm = re.search(r"基準価格\(円\)に(\d+)", rest)
    base = int(bm.group(1)) if bm else 1000
    sm = re.search(r"販売価格\(円\)に(\d+)", rest)
    sale = int(sm.group(1)) if sm else None
    shelf = re.search(r"棚番号に「([^」]+)」", rest)
    shelf = shelf.group(1) if shelf else None
    saleflag = "セールフラグにチェック" in rest
    assert saleflag == (sale is not None)
    supply = cat == "サプライのカテゴリ"
    nonsingle = cat.startswith("シングルカードでも")
    has_card = tag is not None
    csvcode = code if state == 'NM' else code + "-NM"
    catkey = 'info' if nonsingle else 'goods'
    cols = csv_cols(csvcode, nm, nm, lang, catkey, base, base, 1000 if base >= 1000 else base)
    s = csv_step(cols)
    need_prod_edit = (not supply) and (not nonsingle)
    need_cls_edit = bool(shelf) or saleflag or state != 'NM'
    if need_prod_edit or need_cls_edit:
        s += search_step(csvcode)
    if need_prod_edit:
        if has_card:
            s += f"「カード指定 >」ボタンを押し、カード検索ポップアップで直前に登録したカード詳細の行の決定ボタンを押す。続けて商品名(日)に「{nm}」、商品名(英)に「{nm}」を入れ（カード指定で自動で入った値は書き換える）、略称タグに「{tag}」を選び、"
        s += "商品カテゴリはサプライ・グッズの選択を外して単体カードのカテゴリを選び、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す。"
    elif need_cls_edit:
        s += "（商品の編集は不要）"
    if need_cls_edit:
        lead = "商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、"
        if state == 'NM':
            e = f"言語{lang}・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で"
            if shelf: e += f"棚番号に「{shelf}」を選び、"
            if saleflag: e += f"セールフラグにチェックを入れ、販売価格(円)に{sale}を入れ、"
            e += "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
        else:
            e = (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に{lang}、状態に{state}（ヘビープレイド）、商品コードに「{code}」、基準価格(円)・販売価格(円)に{base}、買取価格(円)に1000を入れ、"
                 + (f"棚番号に「{shelf}」を選び、" if shelf else "") + "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
                 f"商品規格一覧で状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で「商品規格を削除」ボタンを押す。")
        s += lead + e
    s = s.replace("（商品の編集は不要）", "")
    if need_cls_edit and not need_prod_edit:
        # 商品登録編集画面を開く手順を足す（編集画面を開いてから規格設定へ）
        s = s.replace("商品登録編集画面の「規格設定」ボタンから", "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから", 1)
        s = s.replace(search_step(csvcode), search_step(csvcode).replace("商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、", ""), 1)
    stats['n'] += 1
    return s

rows = []
for r in I:
    sid, how = r[0], r[ii['投入方法']]
    before = stats['n']
    new = PAIR.sub(lambda m: make(m, sid), how)
    k = stats['n'] - before
    assert k == how.count("商品登録画面で商品名に") and k >= 1, (sid, k)
    assert "商品登録画面で" not in new and "商品規格登録画面で" not in new, sid
    reason = ("元の商品名・カテゴリは商品登録編集画面で戻した。カテゴリは、CSVにサプライ・グッズ（サプライの判定に使うカテゴリ）を入れ、サプライでない商品は取り込み後に単体カードのカテゴリへ付け替えた"
              "（「シングルカードでもサプライでもない」商品はCSVで情報商材のカテゴリIDを入れた）。買取価格・商品名(英)・サイズ・重量・購入グループは元に無くCSVの必須列の都合で決めた値（買取価格は1000、商品名(英)は商品名と同じ、サイズ・重量は1、購入グループは「通常商品」）。"
              "元に基準価格の指定が無い商品は基準価格・販売価格を1000にした。")
    rows.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0221、M03-02 L0075〜L0077・L0092、M03-09 L0077・L0130〜L0134・L0183・L0197、M04-34 L0051〜L0054", reason])
write('M04-34', rows)
print(len(rows), stats)
