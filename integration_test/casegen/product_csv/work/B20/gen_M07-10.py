import re, sys
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B20")
from common import *
recs = []
for s in read_in("M07-10"):
    old = s["投入方法"]
    parts = re.split(r"(?<=。)(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫])", old)
    new = []
    for p in parts:
        if p.startswith("②管理画面の商品登録で"):
            head, rest = p.split("。", 1)
            items = re.findall(r"商品名「(.+?)」・商品コード「(.+?)」・基準価格(\d+)・買取価格(\d+)", head)
            assert items, s["シードID"]
            rows = [dict(code=c, name_ja=n, name_en=n, base=b, buy=k) for n, c, b, k in items]
            rest = rest.replace("基準価格を超える値を商品登録の入力チェックが通さず画面で指定できないため、商品登録では基準価格と同じ値を入れておきDBへ直接設定する",
                                "基準価格（＝販売価格）を超える値をグッズ商品CSVの取り込みチェック（買取価格が販売価格を上回る行はエラー）が通さないため、CSVでは基準価格と同じ値を入れておきDBへ直接設定する")
            assert "商品登録" not in rest, (s["シードID"], rest)
            new.append("②次の商品を、カード情報を付けないサプライ品として登録する。" + csv_step(rows) + rest)
        elif p.startswith("③申込用のサプライ品"):
            r = [dict(code="M0710-APPLY", name_ja="M0710申込用商品", name_en="M0710申込用商品", base=1000, buy=500)]
            tail = "（買取価格が500円未満の商品はフロントの買取カートに入れられないため、申込にはこの商品を使う）。"
            assert tail in p
            new.append("③申込用のサプライ品（商品名「M0710申込用商品」・商品コード「M0710-APPLY」・基準価格1000・買取価格500・状態NM・公開）が無ければ、グッズ商品CSV登録で登録する。" + csv_step(r) + tail.replace("）。", "）。", 1))
        else:
            new.append(p)
    n = "".join(new)
    assert "商品登録" not in n, s["シードID"]
    recs.append([s["シードID"], "直す", n, "", "M03-27 L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077", "商品の新規登録は商品登録画面でなくグッズ商品CSV登録にした。言語は「任意の1つ」だったため日本語にした。状態は規格の状態NM（ニアミント固定）。販売価格は新規規格で基準価格と同額になる（M03-09 L0086〜L0087）。"])
write_out("M07-10", recs)
