import re, sys
sys.path.insert(0, ".")
from lib import *
hdr, I = load("M06-03")
STATE = {"NM": "ニアミント", "SP": "スライトリープレイド", "MP": "モデレトリープレイド", "HP": "ヘビープレイド"}
BASE, BUY = 2000, 1000
P1 = re.compile(
    r"管理画面の商品登録画面で、商品名に(?P<name>任意の名前|「[^」]+」)、カード詳細に任意のカード、商品画像に任意の画像1枚(?P<cat>、カテゴリーに「カード」)?を入れ、公開ステータスで公開を選び、規格の商品コード「(?P<code>[^」]+)」（状態(?P<st>\w+)）と、言語・基準価格・買取価格に任意の値を入れて登録を押す。商品一覧のID列に表示された商品IDを控える（(?P<pl>〔[^〕]+〕)）。")
PM = re.compile(
    r"管理画面の商品登録画面で、商品名に「(?P<name>[^」]+)」、カード詳細に任意のカード、商品画像に任意の画像1枚を入れ、公開ステータスで公開を選び、登録を押したあと商品規格の登録で(?P<codes>商品コード「[^。]+?）)の(?P<n>\d)規格を、言語・基準価格・買取価格に任意の値を入れて登録する。商品一覧のID列に表示された商品IDを控える（(?P<pl>〔[^〕]+〕)）。")

def product(name, classes, label, cat=False):
    """classes: [(code, state)]"""
    has_nm = any(st == "NM" for _, st in classes)
    first_code = next((c for c, st in classes if st == "NM"), None)
    tmp = None
    if first_code is None:
        tmp = classes[0][0] + "-TMP"
        first_code = tmp
    s = csv_sentence([row(first_code, name, name, BASE, BUY)]) + "。" + idnote(first_code, label) + "。"
    s += card_edit(name, name, "検索結果の先頭", extra="商品画像はファイルをアップロードで画像1枚を選び、", cat_to=("「カード」のカテゴリ" if cat else None)) + "。"
    s += SPEC_LIST + "。"
    ops = []
    if has_nm:
        ops.append(nm_edit("日本語"))
    for c, st in classes:
        if st == "NM":
            continue
        ops.append(new_class("日本語", f"{STATE[st]}（{st}）", c, BASE, BASE, BUY))
    if tmp:
        ops.append(del_tmp(tmp))
    return s + "。".join(ops) + "。"

out = []
for r in I:
    sid, kind, lname, attr, use, old, share, cases = r
    num = sid.split("-")[-1]
    abc = iter("ABC")
    def f1(m):
        code, st = m.group("code"), m.group("st")
        nm = m.group("name")
        if nm == "任意の名前":
            nm = f"M0603-{num}-商品{next(abc)}" if re.search(r"-[ABC]-", code) and sid.endswith(("058", "059", "060")) else f"M0603-{num}-商品"
        else:
            nm = nm.strip("「」")
        return product(nm, [(code, st)], m.group("pl"), cat=bool(m.group("cat")))
    def fm(m):
        codes = re.findall(r"商品コード「([^」]+)」（状態(\w+)）", m.group("codes"))
        assert len(codes) == int(m.group("n"))
        return product(m.group("name"), codes, m.group("pl"))
    new, k1 = PM.subn(fm, old)
    new, k2 = P1.subn(f1, new)
    assert k1 + k2 >= 1 and "商品登録画面で" not in new, sid
    sp_only = "-SP" in old and "（状態SP）" in old
    why = ("商品名・商品コード・状態は元のシードの値。元が「任意」の商品名は「M0603-" + num + "-商品…」、価格は基準価格・販売価格2000円・買取価格1000円、言語は日本語にした。"
           "カード詳細は取り込み後に商品登録編集画面（既存の商品の編集）でカード指定し、商品画像はファイルをアップロードで1枚入れる。割引率は販売割引率に登録済みのものから選ぶ。")
    if sp_only:
        why += "状態SPだけの商品は、取り込みで作られるニアミントの規格（商品コードに「-TMP」を付けた仮の規格）を残したままSPの規格を足し、仮の規格を削除して作った（規格は最後の1件でなければ削除できる M03-09 L0159・L0197）。"
    if sid.endswith("080"):
        why += "カテゴリー「カード」は取り込み後の編集画面で、サプライ・グッズから付け替える。"
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0092・L0098・L0111・L0120・L0128・L0129、M03-09 L0077・L0130〜L0134・L0159・L0196〜L0198"
    out.append([sid, "直す", new, "", basis, why])
write("M06-03", out)
