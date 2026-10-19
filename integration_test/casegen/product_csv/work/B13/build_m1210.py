import sys, re
sys.path.insert(0, '/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B13')
from common import *

BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0073・L0075〜L0077・L0091-L0130、M03-09 L0123-L0172"
REASON = ("元のシードの商品登録画面の手順（④⑧）と商品規格登録の手順（⑤⑨）を、グッズ商品CSV登録→商品登録編集画面でカード指定・割引率→取り込みでできたニアミントの規格の編集に置き換えた。"
          "元のシードの商品名(英)・カテゴリ・購入グループ・サイズ・重量・割引率・販売制限は「入力制限内の値」としか書いていないので、商品名(英)は『M1210 Product <番号>』形式、カテゴリはサプライ・グッズのまま、購入グループは既存の購入グループ、サイズ1・重量1、地域別販売制限0（日英両サイト）、割引率は販売割引率に登録済みのものにした。"
          "価格が「入力制限内の値」のシード（008）は基準1000・販売1000・買取500にした。言語(ID)は状態欄の言語ID=1に合わせて1（日本語）。支店の公開は元のシードに無いので0（非公開）。販売種別は規格登録編集画面（M03-09）に項目が無いので書かない")

SEG = re.compile(r"(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭])")


def prod_segments(code, ja, nc, cardname, label, speclabel, prices, en):
    base, sale, buy = prices
    row = csv_row(code, ja, en, 'JP', 0, "", base, sale, buy).replace("言語(ID)は日本語のID", "言語(ID)は1（日本語のID）")
    a = (csv_upload([row]) + "。" + search(code, label) +
         f"。商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「カード指定 >」ボタンを押し、カード検索ポップアップで「{cardname}」を検索して登録したカード詳細を選択し、"
         f"商品名(日)を「{ja}」、商品名(英)を「{en}」に入れ直し（カード指定で自動で入った値は書き換える）、タグは付けず、公開状態で「公開」を選択し、{DISC}て「商品を登録」ボタンを押す。")
    a = a.replace("選びて", "選んで")
    b = (f"商品登録編集画面の「規格設定」ボタンから商品規格一覧を開き、状態ニアミント・日本語の規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面でセールフラグはチェックせず、部門の必須項目を選択し、公開ステータスで「公開」を選択して「商品規格を登録」ボタンを押す（登録した商品規格は表示対象になる）。"
         f"登録後の商品規格登録編集画面の「商品規格ID」に表示された番号を控える（〔{speclabel}〕）。")
    return a, b


def convert(sid, old):
    segs = [s for s in SEG.split(old) if s]
    out = []
    n = sid.rsplit("-", 1)[1]
    k = 0
    for s in segs:
        mark = s[0] if s[0] in "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭" else ""
        body = s[len(mark):]
        if body.startswith("商品登録画面で「カード指定」を押し"):
            card = re.search(r"カード検索で「([^」]+)」", body).group(1)
            ja = re.search(r"商品名\(日\)を「([^」]+)」に書き換え", body).group(1)
            label = re.search(r"〔(商品ID-[^〕]+)〕", body).group(1)
            nxt = None
            out.append(("A", mark, card, ja, label))
            continue
        if body.startswith("この商品の商品登録画面の「商品規格登録」から"):
            code = re.search(r"商品コードに「([^」]+)」", body).group(1)
            speclabel = re.search(r"〔(商品規格ID-[^〕]+)〕", body).group(1)
            m = re.search(r"基準価格\(円\)と販売価格\(円\)に「(\d+)」、買取価格\(円\)に「(\d+)」", body)
            prices = (int(m.group(1)), int(m.group(1)), int(m.group(2))) if m else (1000, 1000, 500)
            out.append(("B", mark, code, speclabel, prices))
            continue
        out.append(("T", mark, body))
    res = ""
    i = 0
    while i < len(out):
        o = out[i]
        if o[0] == "T":
            res += o[1] + o[2]
            i += 1
            continue
        assert o[0] == "A" and out[i + 1][0] == "B", sid
        _, markA, card, ja, label = o
        _, markB, code, speclabel, prices = out[i + 1]
        en = "M1210 Product " + n if n.isdigit() and "VALUES" not in sid else None
        if "VALUES" in sid:
            en = "M1210-014-N Product"
        if "USED" in sid:
            en = "M1210 Product " + code.rsplit("-", 1)[1] + "008"[:0]
            en = "M1210 Product 008" + code.rsplit("-", 1)[1]
        a, b = prod_segments(code, ja, n, card, label, speclabel, prices, en)
        res += markA + a + markB + b
        i += 2
    return res


def main():
    h, rows = load("M12-10")
    res = ["\t".join(["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"])]
    for r in rows:
        new = convert(r[0], r[5])
        res.append("\t".join([r[0], "直す", new, "", BASIS, REASON]))
    (P / "out/M12-10.tsv").write_text("\n".join(res) + "\n", encoding="utf-8")


main()
