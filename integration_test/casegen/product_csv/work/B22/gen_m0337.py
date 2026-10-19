import re
from common import *
ih, I = load('M03-37')
ii = {c: i for i, c in enumerate(ih)}
BLK = re.compile(r"商品登録画面で商品名(?:\(日\))?に「(?P<nm>[^」]+)」を入れ、略称タグで「(?P<tag>[^」]+)」を選び、そのほかの必須項目（[^）]*）に任意の有効な値を入れて「商品を登録」ボタンを押す。登録後の商品登録画面の商品ID欄に表示された番号を控える（〔(?P<lab>商品ID-[^〕]+)〕）。")
TAGLAB = {'POR': '略称タグID-M0337-共有A', 'PRE': '略称タグID-M0337-共有B'}
rows = []
for r in I:
    sid, how, attr = r[0], r[ii['投入方法']], r[ii['状態・属性']]
    # 名前つき略称タグ(040/041)
    named = dict(re.findall(r"略称タグ一覧で名称「([^」]+)」の行のID欄に表示された番号を控える（〔([^〕]+)〕）", how))
    n = 0
    def rep(m):
        global n
        n += 1
        nm, tag, lab = m['nm'], m['tag'], m['lab']
        tl = TAGLAB.get(tag) or named[tag]
        # ATTR との突き合わせ
        if tag in TAGLAB:
            assert re.search(rf"〔{lab}〕[^／]*(?:=|は)略称タグID 〔{tl}〕", attr), (sid, lab, tl)
        else:
            assert f"略称タグID 〔{tl}〕に紐づく" in attr and f"〔{lab}〕=削除なし・略称タグID" in attr, (sid, lab, tl)
        code = "M0337-" + nm.split('商品-')[1]
        en = "M0337-Product-" + nm.split('商品-')[1]
        cols = csv_cols(code, nm, en, '日本語', 'goods', 1000, 1000, 1000, extra=f"略称タグ(ID)は略称タグ「{tag}」のID〔{tl}〕・")
        return csv_step(cols) + search_step(code, lab)
    new = BLK.sub(rep, how)
    assert n == how.count("商品登録画面で商品名"), (sid, n)
    assert "商品登録画面で" not in new
    reason = ("元の必須項目（商品名(英)・購入グループ・サイズ・重量・割引率・販売制限・カテゴリ）の「任意の有効な値」は、CSVの必須列の都合で具体値にした（商品名(英)は商品名と別の英字名、購入グループは「通常商品」、サイズ・重量は1、販売制限は地域別販売制限0、カテゴリはサプライ・グッズ）。"
              "割引率はグッズ商品CSVに列が無いため入れていない（ケースは商品の略称タグだけを使う）。商品コードは元に無いためシード専用の値にした。略称タグは取り込みの略称タグ(ID)の列で入れた。")
    rows.append([sid, "直す", new, "", "M03-27 L0092・L0123・L0124・L0129・L0134・L0219、M03-02 L0075〜L0077", reason])
write('M03-37', rows)
print(len(rows))
