import re
from common import *
ih, I = load('M03-40')
ii = {c: i for i, c in enumerate(ih)}
SEG = re.compile(r"商品登録画面で商品名と商品名\(英\)に(?P<nm>任意の名称|「[^」]+」)を入れ、ほかの必須項目に登録できる値を入れて「商品を登録」ボタンを押し、その商品の商品規格一覧画面の新規登録ボタンから商品規格登録画面を開いて、商品コードに(?P<code>[A-Za-z0-9\-]+)を入れ、棚番号で(?P<sh>[A-Z0-9\-]+)を選び、(?P<rest>[^。]*?)を入れて「商品規格を登録」ボタンを押す。")
rows = []
for r in I:
    sid, how = r[0], r[ii['投入方法']]
    n = 0
    def rep(m):
        global n
        n += 1
        code, sh, rest = m['code'], m['sh'], m['rest']
        nm = m['nm']
        ja = en = (nm[1:-1] if nm.startswith("「") else None)
        if ja is None:
            ja, en = f"M0340商品-{code}", f"M0340-Product-{code}"
        bp = re.search(r"基準価格に(\d+)を入れ", rest)
        base = int(bp.group(1)) if bp else 1000
        cols = csv_cols(code, ja, en, '日本語', 'goods', base, base, 1000 if base >= 1000 else base)
        return (csv_step(cols)
                + f"その商品の商品規格一覧画面を開き、言語日本語・状態NMの規格（取り込みで作られた規格）の行を開いて、商品規格登録編集画面で棚番号で{sh}を選び、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    new = SEG.sub(rep, how)
    assert n == how.count("商品登録画面で商品名と商品名(英)に") and n >= 1, (sid, n)
    assert "商品登録画面で" not in new and "新規登録ボタン" not in new, sid
    reason = "元は商品名・商品名(英)・必須項目が「任意」だったので、商品名は「M0340商品-商品コード」、商品名(英)は「M0340-Product-商品コード」、購入グループは「通常商品」、サイズ・重量は1に決めた（007は元の商品名「商品甲」「商品乙」と価格1000・2000のまま）。規格の言語・状態は元が「ほかの必須項目に登録できる値」で、CSVの日本語・ニアミントにした。"
    if "007" in sid:
        reason = "商品名は元のまま「商品甲」「商品乙」、基準価格・販売価格は元の1000・2000のまま（CSVは基準価格と販売価格を同額で入れる）。買取価格は元に無く、CSVの必須列の都合で1000にした（販売価格を上回らない）。規格の言語・状態は元が「ほかの必須項目に登録できる値」で、CSVの日本語・ニアミントにした。"
    if sid.endswith(("014", "015")):
        reason += "商品コード4030は014と015の両方にある（元のまま。商品一覧で検索して該当があれば既存の規格の棚番号を選び直す分岐が元にある）。"
    if sid.endswith(("017", "018")):
        reason += "商品コード4018は017と018の両方にある（元のまま。既存があれば棚番号を選び直す分岐が元にある）。"
    rows.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-09 L0077・L0183、M03-02 L0075〜L0077", reason])
write('M03-40', rows)
print(len(rows))
