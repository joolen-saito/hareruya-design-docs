import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B23")
from common import *

COMMON_TAIL = "・サイズ1・重量1・商品カテゴリ(ID)は" + CAT + "・購入グループ名称は" + PG_NORMAL
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0218・L0220・L0232、M03-02 L0075〜L0077"


def csv_one(code, ja, en, pub, price, buy, extra="", tag=None, sale=None):
    sale = price if sale is None else sale
    t = ""
    if tag is not None:
        t = f"・売上分析タグ(ID)は{tag}"
    return ("グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する"
            f"（商品IDは空・商品コードは「{code}」・商品名(日)は「{ja}」・商品名(英)は「{en}」・言語(ID)は日本語のID・{pub}・支店の商品公開ステータスは1（公開）{COMMON_TAIL}{t}"
            f"・基準価格{price}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる。")


# ---------------- M03-29 ----------------
CREATE = re.compile(
    r"商品登録画面で商品名\(日\)・商品名\(英\)・購入グループ・割引率・販売制限の必須項目に値を入れ、売上分析タグ(?P<tag>でタグID 20のタグだけを選択し|は選択せず)、公開状態で「(?P<pub>公開|非公開)」を選んで「商品を登録」ボタンを押す。"
    r"登録後の商品登録画面の商品ID欄に表示された番号を控える（(?P<lab>〔商品ID-M0329-[0-9A-Z]+〕)）。")
LINK = re.compile(
    r"商品登録画面で商品名\(英\)・購入グループ・割引率・販売制限の必須項目に値を入れ、商品名\(日\)は「(?P<ja>[^」]+)」とし、売上分析タグ(?P<tag>は何も選択せず|で「[^」]+」だけを選択し)、公開状態で「公開」を選んで「商品を登録」ボタンを押す。"
    r"登録後の商品登録画面の商品ID欄に表示された番号を控える（(?P<lab>〔商品ID-M0329-[0-9]+〕)）。続けて同じ商品の商品規格登録画面で商品コードに「(?P<code>[^」]+)」を入れて登録する。")


def find_block(sid, old):
    out = old
    n = 0
    m = LINK.search(out)
    if m:
        ja, code, lab = m.group("ja"), m.group("code"), m.group("lab")
        tag = "空" if "何も選択せず" in m.group("tag") else None
        if tag is None:
            tagname = re.search(r"「([^」]+)」", m.group("tag")).group(1)
            # 同じシードの上の文で登録した売上分析タグのID
            lab_tag = re.search(r"（(〔売上分析タグID-M0329-[0-9]+〕)）", old).group(1)
            tag = f"{lab_tag}（上で登録した「{tagname}」）の売上分析タグのID"
        new = csv_one(code, ja, ja, "商品公開ステータスは2（公開）", 100, 100, tag=tag)
        new += f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（{lab}）。"
        out = out[:m.start()] + new + out[m.end():]
        return out, 1
    while True:
        m = CREATE.search(out)
        if not m:
            break
        lab = m.group("lab")
        code = lab.replace("〔商品ID-", "").replace("〕", "")
        pub = "商品公開ステータスは1（非公開）" if m.group("pub") == "非公開" else "商品公開ステータスは2（公開）"
        tag = "20" if "ID 20" in m.group("tag") else "空"
        new = csv_one(code, code, code, pub, 100, 100, tag=tag)
        new += f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（{lab}）。"
        out = out[:m.start()] + new + out[m.end():]
        n += 1
    return out, n


def m0329():
    ih, I = load("M03-29")
    ix = {c: i for i, c in enumerate(ih)}
    rows = []
    for r in I:
        sid = r[0]
        old = r[ix["投入方法"]]
        new, n = find_block(sid, old)
        assert n >= 1 and new != old, sid
        why = [("" if "-L-" in sid else "商品名は元が任意なので商品コードと同じ値にした。") + "元は割引率を入れていたが、グッズ商品CSVに列が無く、このケースは売上分析タグの更新だけを見るので割引率は入れない。販売制限は地域別販売制限の列を0（日英の両サイト）にした"]
        if "売上分析タグ" in old and "ID 20" in old:
            why.append("売上分析タグID 20だけを持つ状態は、グッズ商品CSVの売上分析タグ(ID)の列（M03-27 L0220）で入れた")
        if "非公開" in old and sid.endswith("011"):
            why.append("元は公開状態だけを非公開にしていたので、商品公開ステータスを1（非公開）にし、支店の商品公開ステータスは1のままにした")
        if sid.endswith("041") or sid.endswith("042"):
            why.append("元は商品規格登録画面で商品コードだけを入れていたので、商品コードはCSVの列で入れ、価格は元に指定が無いため基準価格・販売価格・買取価格を100にした")
        else:
            why.append("元は価格の指定が無いので基準価格・販売価格・買取価格を100にした")
        rows.append([sid, "直す", new, "", BASIS, "。".join(why)])
    write("M03-29", rows)


# ---------------- M05-08 ----------------
M508 = re.compile(
    r"管理画面の商品登録編集画面で商品名に「(?P<ja>[^」]+)」を入れ、商品公開ステータスを公開にして商品を登録ボタンを押す。(?P<two>2\) )?"
    r"商品規格一覧画面の新規作成ボタンから商品規格登録編集画面を開き、商品コードに「(?P<code>[^」]+)」、販売価格に1000、基準価格に1000、買取価格に1000を入れ、部門に任意の部門を選び、公開ステータスを公開にして商品規格を登録ボタンを押す。")


def m0508():
    ih, I = load("M05-08")
    ix = {c: i for i, c in enumerate(ih)}
    rows = []
    for r in I:
        sid = r[0]
        old = r[ix["投入方法"]]
        m = M508.search(old)
        assert m, sid
        ja, code, two = m.group("ja"), m.group("code"), m.group("two") or ""
        new = csv_one(code, ja, ja, "商品公開ステータスは2（公開）", 1000, 1000)
        new += (f"{two}商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
                f"商品コード「{code}」の規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
        new = old[:m.start()] + new + old[m.end():]
        why = "元の商品名は商品名(日)だけの指定だったので、商品名(英)も同じ値にした。サイズ・重量・原価単価は元に指定が無く、CSVの必須列なのでサイズ1・重量1・原価単価10を入れた。地域別販売制限は0（日英の両サイト）にした。元が商品登録編集画面で商品を登録していた分の割引率は、グッズ商品CSVに列が無く、このケースは印刷の受付を見るので入れない。規格の部門・公開ステータスは元のとおり商品規格の画面で入れる"
        rows.append([sid, "直す", new, "", BASIS + "、M03-09 L0077・L0086〜L0087、M03-08 L0059", why])
    write("M05-08", rows)


# ---------------- M08-05 ----------------
M805 = re.compile(r"管理画面の商品登録編集画面で、商品名に「(?P<ja>[^」]+)」、商品コードに「(?P<code>[^」]+)」、販売価格に1000円を入れ、公開を選んで登録し、在庫変更CSV登録画面で")


def m0805():
    ih, I = load("M08-05")
    ix = {c: i for i, c in enumerate(ih)}
    rows = []
    for r in I:
        sid = r[0]
        old = r[ix["投入方法"]]
        m = M805.search(old)
        assert m
        ja, code = m.group("ja"), m.group("code")
        new = csv_one(code, ja, ja, "商品公開ステータスは2（公開）", 1000, 500) + "続けて、在庫変更CSV登録画面で"
        new = old[:m.start()] + new + old[m.end():]
        why = "元の販売価格1000円に合わせ、基準価格も1000にした（新しく作る規格は販売価格が基準価格と同じ。M03-09 L0086〜L0087）。買取価格は元に指定が無いのでCSVの必須列として500（販売価格以下。M03-27 L0119）、商品名(英)は商品名(日)と同じ値、サイズ1・重量1・原価単価10を入れた。在庫10は元のとおり在庫変更CSV登録で入れる（M03-27 L0129 は在庫0で作る）"
        rows.append([sid, "直す", new, "", BASIS + "、M03-09 L0086〜L0087", why])
    write("M08-05", rows)


# ---------------- 直さない（M03-04・M03-08） ----------------
def nofix(fid):
    ih, I = load(fid)
    ix = {c: i for i, c in enumerate(ih)}
    rows = []
    for r in I:
        sid = r[0]
        old = r[ix["投入方法"]]
        if "グッズ商品CSV" in old:
            why = "商品はすでにグッズ商品CSV登録で作っており、商品登録画面で新規に作る操作は無い。商品登録/編集画面は取り込んだ商品を開いて規格設定ボタンへ進む・編集するためだけに使う"
        else:
            why = "商品を作らない。商品一覧の検索条件に未登録の商品IDを入れて確かめるだけ"
        extra = []
        if "任意の値" in old and "必須列" in old:
            extra.append("気づいた点（直していない）: CSVの必須列に「取込が通る任意の値」「登録できる任意の値」と書いていて、値が決まっていない")
        if "商品カテゴリ(ID)は2" in old:
            extra.append("気づいた点（直していない）: 商品カテゴリ(ID)に2を入れているが、2がサプライ・グッズ等の配下か書いておらず、確かめていない（M03-27 L0123）")
        if "「商品を登録」ボタンを押す" in old:
            extra.append("気づいた点（直していない）: 取り込んだ商品を商品登録/編集画面で「商品を登録」するのに割引率を選んでいない（編集では必須。M03-02）")
        if fid == "M03-08" and "任意の値" in old and "原価単価" in old:
            pass
        rows.append([sid, "直さない", "", "", "M03-27 L0092・L0124、M03-02 L0075〜L0077", "。".join([why] + extra)])
    write(fid, rows)


m0329()
m0508()
m0805()
nofix("M03-04")
nofix("M03-08")
