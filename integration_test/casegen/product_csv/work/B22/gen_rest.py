import re
from common import *

# ---- M10-04
ih, I = load('M10-04'); ii = {c: i for i, c in enumerate(ih)}
OLD = "管理画面の商品登録編集画面で、商品名に「QJ1004-001商品」、商品コードに「QJ1004-001」、販売価格に税込1100円となる額を入れ、公開にして登録し、在庫変更CSV登録画面で"
rows = []
for r in I:
    sid, how = r[0], r[ii['投入方法']]
    assert OLD in how
    cols = csv_cols("QJ1004-001", "QJ1004-001商品", "QJ1004-001商品", '日本語', 'goods', 1100, 1100, 1000)
    new = how.replace(OLD, csv_step(cols) + "在庫変更CSV登録画面で")
    reason = ("元は販売価格を「税込1100円となる額」と書いていた。価格は税込みで登録する仕様（ee の ProductClass.php、F04-02 design.txt L0319）なので、税込みの額 1100 を基準価格・販売価格に入れた。商品名(英)・購入グループ・サイズ・重量・買取価格は元に無く、CSVの必須列の都合で決めた値"
              "（商品名(英)は商品名と同じ、購入グループは「通常商品」、サイズ・重量は1、買取価格は1000）。商品コードの規格はニアミント・日本語で作られる。"
              "元の「在庫増減数に1以上」は曖昧な書き方だが、商品を作る部分ではないので直していない。")
    rows.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192〜L0238、M03-02 L0075〜L0077", reason])
write('M10-04', rows)

# ---- M04-01
ih, I = load('M04-01'); ii = {c: i for i, c in enumerate(ih)}
rows = []
for r in I:
    sid, how = r[0], r[ii['投入方法']]
    assert "グッズ商品CSV登録画面で" in how and "商品登録画面で商品名" not in how
    base = "既にグッズ商品CSV登録で商品を作っており、商品登録画面の新規登録は使っていない。"
    notes = []
    edits = re.search(r"商品を登録」ボタンを押す", how)
    if edits and "割引率" not in how:
        notes.append("取り込んだ商品を商品登録編集画面で「商品を登録」するのに割引率を選んでいない（編集では必須。M03-30の23件と同じ誤り）。")
    if "規格一覧の新規登録ボタン" in how:
        notes.append("商品規格一覧の新規登録で規格を足す操作は、刷新後も使える（M03-08 L0059）ので変えない。")
    notes.append("CSVの必須列に「任意の正の整数」と書かれ、アップロード後の確認モーダルでの確定も書かれていない（誤りだが依頼文の決まりで直していない）。")
    rows.append([sid, "直さない", "", "", "M03-27 L0092（確認モーダル）、M03-02 L0075〜L0077", base + "".join(notes)])
write('M04-01', rows)
print('ok')
