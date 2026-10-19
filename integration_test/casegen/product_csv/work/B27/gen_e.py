import sys, re
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B27")
from lib import *

VAGUE = re.compile(r"任意|取り込める|登録できる|有効な値|試験環境にある値")
NODISC = ("気づいた誤り: 取り込んだ商品を商品登録編集画面で「商品を登録」するが、割引率を選ぶ手順が無い"
          "（グッズ商品CSVに割引率の列が無く、編集では必須。functions/pf-eccube3/m03-02_admin_product_product_edit.md 17行目）。")
CARDCSV = ("既にカードを作ってからカード商品CSV登録（M03-26）で商品を作っていて、商品登録画面で商品を新しく作る操作は無いので直さない。"
           "気づいた点: カード商品CSVは登録済みの割引率の状態ごとに規格を作り価格も計算し直す（M03-26 L0150・L0165）ので、元の投入方法は余る規格を商品規格登録編集の「商品規格を削除」で消している。"
           "カード商品CSVを使わない決まりに合わせる直しは、この依頼の対象（商品登録画面で商品を作る部分）の外。")
GOODSCSV = "既にグッズ商品CSV登録で商品を作っていて、商品登録画面で商品を新しく作る操作は無いので直さない。"


def vague_note(t):
    sents = [s for s in re.split(r"(?<=。)", t) if "CSV" in s and VAGUE.search(s)]
    if sents:
        return "CSVの一部の列が「登録できる任意の値」「有効な値」「試験環境にある値」のように曖昧な書き方になっている（依頼文の決まりで直していない）。"
    return ""


def gen_nofix(fid, reason_of, basis_of=None):
    seeds = load(fid)
    out = []
    for s in seeds:
        r = reason_of(s)
        b = basis_of(s) if basis_of else "M03-27 L0092・L0123、M03-02 L0075〜L0077"
        out.append((s["シードID"], "直さない", "", "", b, r))
    save(fid, out)


# A02-01
def r_a0201(s):
    if s["シードID"].endswith("-018"):
        return GOODSCSV + "規格・在庫は元のとおり。"
    return CARDCSV


# A02-05
def r_a0205(s):
    t = s["投入方法"]
    r = GOODSCSV
    if "「カード指定 >」" in t and "割引率" not in t:
        r += NODISC
    v = vague_note(t)
    if v:
        r += v
    if re.search(r"商品カテゴリ\(ID\)=〔カテゴリID-A0205-共有〕", t):
        r += "また商品カテゴリ(ID)が〔カテゴリID-A0205-共有〕の値なので、そのカテゴリがサプライ・グッズ等の配下でないとグッズ商品CSVで取り込めない（M03-27 L0123。S-A02-05-REFの作り方次第で、ここでは確かめていない）。"
    return r


# B05-05
def r_b0505(s):
    return ("商品を作る操作はスマレジ試験環境の管理画面での商品登録（外部システム側の商品）だけで、EC-CUBEの商品登録画面では作っていない（EC-CUBE側は「在庫のある商品1点」を既存の商品から買い物かごに入れる）。")


# F03-02
def r_f0302(s):
    sid = s["シードID"]
    t = s["投入方法"]
    if sid.endswith("OTHER-VERSIONS"):
        return "DBシードとユニサーチ試験環境への登録で商品を用意していて、商品登録画面は使っていない。"
    if sid.endswith("CRUMB-SUPPLY-079"):
        return GOODSCSV + NODISC + "また、CSVの一部の列が「試験環境にある値」のように曖昧な書き方になっている（依頼文の決まりで直していない）。"
    return CARDCSV + "（カード詳細・カードの作成は元のとおり。）"


# M03-05
def r_m0305(s):
    return GOODSCSV + "商品名で検索して商品登録編集画面を開いて商品IDを控える操作は、取り込んだ商品を開いているだけ。"


# M03-22
def r_m0322(s):
    r = GOODSCSV
    if "商品を登録」" in s["投入方法"]:
        r += "商品登録編集画面では取り込んだ商品を開いて「商品を登録」するが、割引率を含む必須項目に値を入れる手順になっている。"
    v = vague_note(s["投入方法"])
    return r + v


# M03-27
def r_m0327(s):
    sid = s["シードID"]
    r = GOODSCSV
    if "QB-CSV" in sid:
        return "商品を作る操作が無い（更新用のCSVファイルを用意するだけ。商品IDはS-M03-27-QB-PRODなど商品を作った側のシードで控えた番号を書く）。"
    if sid.endswith("CASE-022"):
        return "商品を作る操作が無い（同名の商品を削除し、スマレジ連携の重複を起こすCSVを用意するだけ）。" + vague_note(s["投入方法"])
    if sid.endswith("CASE-032"):
        return GOODSCSV + "手順④で商品登録画面を開くのは取り込んだ既存の商品で、そこから規格の編集へ進むだけ。" + vague_note(s["投入方法"])
    return GOODSCSV + "他の商品のタグを外す操作は既存の商品の編集。"


# M04-18
def r_m0418(s):
    return GOODSCSV + NODISC + "また、CSVの一部の列が「取り込める値」のように曖昧な書き方になっている（依頼文の決まりで直していない）。"


if __name__ == "__main__":
    gen_nofix("A02-01", r_a0201)
    gen_nofix("A02-05", r_a0205)
    gen_nofix("B05-05", r_b0505, lambda s: "（EC-CUBEの商品登録画面を使わない。スマレジ側の商品登録）")
    gen_nofix("F03-02", r_f0302)
    gen_nofix("M03-05", r_m0305)
    gen_nofix("M03-22", r_m0322)
    gen_nofix("M03-27", r_m0327)
    gen_nofix("M04-18", r_m0418)
