import re
from common import *
ih, I = load('M09-10')
ii = {c: i for i, c in enumerate(ih)}

OPEN_CLS = ("商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
            "「規格設定」ボタンから商品規格一覧を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で")
CLS_TAIL = "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
CLS_NOPERIOD = "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す"

def tagid(tag, seed_map):
    if tag in seed_map:
        return seed_map[tag]
    return f"タグ管理の一覧で「{tag}」の行のID欄に表示されたタグID"

# --- 033 / PUBLIC / FORMAT : 商品1点の登録＋規格
P1 = re.compile(r"商品登録画面で商品名に「(?P<nm>[^」]+)」を入れ、カテゴリを1つ選び、タグで「(?P<tag>[^」]+)」(?P<tid>（タグID \d+）)?を選び、公開状態で「公開」、支店の商品公開ステータスで「公開」を選んで登録する。続けて商品規格登録画面で商品コードに「(?P=nm)」、言語で「日本語」、公開状態で「公開」、基準価格に100を入れて登録する。")
# --- 048 / 051 / 052
P2 = re.compile(r"【商品】管理画面の商品登録で、「カード指定」は任意（押す場合は既存のカードを1件選ぶ）、商品名\(日\)に「(?P<nm>[^」]+)」、商品名\(英\)に任意の値、購入グループ・サイズ・重量・割引率に任意の有効な値、販売制限=制限なし、支店の商品公開ステータス=公開、カテゴリを1つ以上選び、タグの「(?P<tag>[^」]+)」にチェック、公開状態=公開を入れて「商品を登録」を押す。")
P3 = re.compile(r"【商品規格】商品の「規格設定」から商品規格登録を開き、言語=日本語、状態=NM、商品コードに(?P<code>「[^」]+」|半角の任意の値)、販売種別=既定のまま、基準価格\(円\)=500、販売価格\(円\)=500、買取価格\(円\)=300、セールフラグ=チェックしない、高額商品コード=空のまま、部門=任意の有効な部門、スマレジ連携フラグ=連携しない、公開状態=公開を入れて「商品規格を登録」を押す（登録した規格は表示対象になり、開店中の店舗ごとの在庫が0で作られる）。")

SEEDTAG = {
    'S-M09-10-LINK-PRODUCTS-033': {'M0910バナータグA': '「M0910バナータグA」のタグID〔タグID-M0910-共有2〕'},
    'S-M09-10-PUBLIC': {'モダン特集': '「モダン特集」のタグID〔タグID-M0910-共有F1〕'},
    'S-M09-10-FORMAT-PRODUCTS': {'スタンダード': '「スタンダード」のタグID 9'},
}
rows = []
for r in I:
    sid, how = r[0], r[ii['投入方法']]
    new = how
    cnt = 0
    def r1(m):
        global cnt
        cnt += 1
        nm, tag = m['nm'], m['tag']
        t = SEEDTAG[sid][tag]
        cols = csv_cols(nm, nm, nm, '日本語', 'goods', 100, 100, 100, extra=f"タグ(ID)は{t}・")
        return csv_step(cols) + OPEN_CLS.format(code=nm) + CLS_TAIL
    new = P1.sub(r1, new)
    # 2) 048/051/052
    pend = {}
    def r2(m):
        global cnt
        cnt += 1
        nm, tag = m['nm'], m['tag']
        code = nm if re.fullmatch(r"M0910-05\d-\w+", nm) else None
        if code is None:
            code = "M0910-QI001-A" if "甲" in nm else "M0910-QI001-B"
        pend[nm] = code
        t = tagid(tag, {})
        cols = csv_cols(code, nm, nm, '日本語', 'goods', 500, 500, 300, extra=f"タグ(ID)は{t}・")
        pend['last'] = code
        return "【商品】" + csv_step(cols)
    new = P2.sub(r2, new)
    # 3) 規格の部分は直前の商品の商品コードで置き換え（出現順）
    codes = [pend[k] for k in pend if k != 'last']
    it = iter(codes)
    def r3(m):
        code = next(it)
        return "【商品規格】" + OPEN_CLS.format(code=code) + CLS_NOPERIOD + "（取り込みで作られた規格は表示対象になり、開店中の店舗ごとの在庫が0で作られる）。"
    new = P3.sub(r3, new)
    n_expect = how.count("商品登録画面で商品名に") + how.count("管理画面の商品登録で、")
    assert cnt == n_expect and cnt >= 1, (sid, cnt, n_expect)
    assert not re.search(r"商品登録画面で商品名|管理画面の商品登録で|商品規格登録画面で|商品規格登録を開き", new), sid
    if sid in SEEDTAG:
        reason = "元は商品名のほかの必須項目が「カテゴリを1つ」「割引率」などの指定で、CSVの必須列の都合で具体値にした（商品名(英)は商品名と同じ、購入グループは「通常商品」、サイズ・重量は1、カテゴリはサプライ・グッズ、買取価格は基準価格と同じ100）。割引率はグッズ商品CSVに列が無く入れていない（ケースは使わない）。タグは取り込みのタグ(ID)の列で入れた。規格の公開ステータス・部門は取り込みでは入れないので、取り込み後に商品規格登録編集画面で入れた（元は公開状態だけ）。"
        if sid.endswith("PUBLIC") or sid.endswith("033"):
            reason += "「同じ操作を…繰り返す」の残りの商品も、同じCSV登録と規格の編集を商品ごとに行う。"
        if sid.endswith("FORMAT-PRODUCTS"):
            reason += "「同じ操作を…繰り返す」の残りの商品も、同じCSV登録と規格の編集を商品ごとに行う。"
    else:
        reason = "元は商品名(英)・購入グループ・サイズ・重量・割引率・カテゴリ・規格の商品コード・買取価格以外が「任意」の指定で、CSVの必須列の都合で具体値にした（商品名(英)は商品名と同じ、購入グループは「通常商品」、サイズ・重量は1、カテゴリはサプライ・グッズ、買取価格は元の300）。割引率はグッズ商品CSVに列が無く入れていない（ケースは使わない）。「カード指定」は元が任意で押さないので押さない。タグは取り込みのタグ(ID)の列で入れた。"
        if "QI-TILE" in sid:
            reason += "規格の商品コードは元が「半角の任意の値」だったので、シード専用の「M0910-QI001-A」「M0910-QI001-B」にした。"
        reason += "規格の部門と公開ステータスは取り込みでは入れないので、取り込み後に商品規格登録編集画面で入れた（元は部門を任意の有効な部門、公開状態を公開）。"
    rows.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0221、M03-09 L0077・L0130〜L0134、M03-02 L0075〜L0077", reason])
write('M09-10', rows)
print(len(rows))
