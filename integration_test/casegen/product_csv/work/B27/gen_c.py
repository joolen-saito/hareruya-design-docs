import sys, re
sys.path.insert(0, "/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv/work/B27")
from lib import *

BASE = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077"


# ---------------------------------------------------------------- M04-08
def gen_m0408():
    seeds = load("M04-08")
    full = re.compile(
        r"(?P<mark>[①②])?商品登録画面で商品名に「(?P<n>[^」]+)」を入れて登録し、その商品の商品規格登録画面で言語に(?P<lang>英語|日本語)、状態に(?P<st>NM|EX)、"
        r"基準価格に(?P<b>\d+)、スマレジ商品コードに(?P<sc>\d+)を入れ、スマレジ連携フラグを連携する側にして登録する。")
    sums = re.compile(
        r"①商品登録画面で商品名に「(?P<n1>[^」]+)」を入れて登録し、その商品の商品規格登録画面で基準価格に(?P<b1>\d+)を入れて登録する。"
        r"同様に商品名「(?P<n2>[^」]+)」・基準価格(?P<b2>\d+)で登録する。")
    out = []
    for s in seeds:
        t = s["投入方法"]
        sid = s["シードID"]
        notes = []
        if sid.endswith("-036"):
            m = sums.search(t)
            assert m
            c1, c2 = "M0408-036-A", "M0408-036-B"
            new = ("①" + upload([row(c1, m.group("n1"), m.group("n1"), int(m.group("b1"))), row(c2, m.group("n2"), m.group("n2"), int(m.group("b2")))])
                   + "規格の基準価格・販売価格はCSVで入れた値のままにする。")
            t = sums.sub(lambda _: new, t)
            reason = ("元は商品登録画面で2商品を登録していたので、グッズ商品CSV登録の2行で作った。元の投入方法に言語・商品コード・買取価格・原価単価・商品名(英)の指定が無いので、"
                      "言語は日本語、商品コードは商品名の【…】内の識別子（M0408-036-A・M0408-036-B）、買取価格と原価単価は0、商品名(英)は商品名(日)と同じ値に決めた。")
        else:
            def rep(m):
                n, lang, st, b, sc = m.group("n"), m.group("lang"), m.group("st"), int(m.group("b")), m.group("sc")
                code = re.search(r"【([^】]+)】", n).group(1)
                mark = m.group("mark") or ""
                if st == "NM":
                    cls = (f"その商品の商品規格一覧で、取り込みで作られた規格の行を開き、商品規格登録編集画面でスマレジ商品コードに{sc}を入れ、"
                           f"スマレジ連携フラグを連携する側にし、部門は登録済みの部門を選んで商品規格を登録する。")
                    notes.append("nm")
                else:
                    cls = (f"商品規格一覧の「新規作成」ボタンから商品規格登録画面を開き、言語に{lang}、状態に{st}、基準価格に{b}、スマレジ商品コードに{sc}を入れ、"
                           f"スマレジ連携フラグを連携する側にし、部門は登録済みの部門を選んで登録する。続けて、商品規格一覧で取り込みで作られた状態NMの規格の行を開き、"
                           f"商品規格登録編集画面の「商品規格を削除」ボタンで削除して、この商品の規格を言語{lang}・状態{st}の1件だけにする。")
                    notes.append("ex")
                return (mark + upload([row(code, n, n, b, lang=lang)]) + find_open(code) + cls)
            t = full.sub(rep, t)
            assert notes, sid
            reason = ("元は商品登録画面で商品を新規に作っていたので、グッズ商品CSV登録で作った。言語はCSVの言語(ID)の列で決まる（M03-27 Excel L0196）。"
                      "元の投入方法に商品コード・商品名(英)・買取価格・原価単価の指定が無いので、商品コードは商品名の【…】内の識別子、商品名(英)は商品名(日)と同じ値、買取価格と原価単価は0に決めた。"
                      "スマレジ連携に当たる。取り込みはスマレジ連携フラグ0・スマレジ商品コードと部門IDは空にし（連携フラグを有効にしたCSVは部門IDが必須で、部門IDの控え先が無いため）、"
                      "取り込み後に商品規格登録編集画面でスマレジ商品コード・スマレジ連携フラグ・部門を入れる。スマレジ商品IDとEC-CUBE在庫のDB直接設定は元のまま。")
            if "ex" in notes:
                reason += ("状態EXの規格は、グッズ商品CSVがニアミントの規格しか作らないため、商品規格一覧の「新規作成」で足し、余るニアミントの規格は削除する"
                           "（削除後は元のシードと同じく規格が1件。M03-09 L0159）。ケースは移動の明細だけを見るので影響しない。")
        assert "商品登録画面で商品名" not in t, sid
        basis = BASE + "、M03-08 L0059、M03-09 L0100・L0102〜L0104・L0127〜L0133・L0158〜L0159"
        out.append((sid, "直す", t, "", basis, reason))
    save("M04-08", out)


# ---------------------------------------------------------------- M04-12
def gen_m0412():
    seeds = load("M04-12")
    out = []
    keep = "（登録すると、開いている全店舗のEC-CUBE在庫とスマレジ在庫の在庫行が在庫数0で作られる）。"

    def rows_of(items):
        return [row(c, n, n, p) for (c, n, p) in items]

    def mk(items, tail_old_start, tail_old_end=keep):
        pass

    for s in seeds:
        sid = s["シードID"]
        t = s["投入方法"]
        if sid == "S-M04-12-BASE":
            items = [("SPLIT-SRC-001", "1001", 500), ("M0412-BASE-SPLIT-DST-1", "M0412-BASE-SPLIT-DST-1", 150), ("M0412-BASE-SPLIT-DST-2", "M0412-BASE-SPLIT-DST-2", 150),
                     ("JOIN-DST-001", "2001", 900), ("JOIN-SRC-A1", "JOIN-SRC-A1", 400), ("JOIN-SRC-A2", "JOIN-SRC-A2", 300), ("JOIN-SRC-A3", "JOIN-SRC-A3", 300),
                     ("M0412-BASE-100", "M0412-BASE-100", 100), ("M0412-BASE-090", "M0412-BASE-090", 100), ("M0412-BASE-080", "M0412-BASE-080", 100)]
            start = "商品登録画面で商品名「1001」商品コード「SPLIT-SRC-001」"
            note = ("元の投入方法が値を決めていない商品は、商品コードをシード専用に決めた（分割先用は M0412-BASE-SPLIT-DST-1・-2、結合元用は JOIN-SRC-A を含む JOIN-SRC-A1・A2・A3 とし、"
                    "結合元用3件を「商品コードJOIN-SRC-Aを含む」で検索できるようにした）。M0412-BASE-100・090・080 の基準価格は元に指定が無いので100にした。")
        elif sid == "S-M04-12-STATUS":
            codes = [f"M0412-STATUS-{x}" for x in (401, 402, 403, 404, 501, 502, 503, 504, 505)]
            items = [(c, c, 100) for c in codes] + [("M0412-STATUS-DST", "M0412-STATUS-DST", 100), ("M0412-STATUS-SRC", "M0412-STATUS-SRC", 100)]
            start = "商品登録画面で商品コード「M0412-STATUS-401」"
            note = "元が「他のデータと重ならない商品コード」としていた分割先用・結合元用の商品は、M0412-STATUS-DST・M0412-STATUS-SRC の1件ずつに決めた。基準価格は元に指定が無いので100にした。"
        elif sid == "S-M04-12-PAGING":
            items = [(f"M0412-PAGE-{n}", f"M0412-PAGE-{n}", 100) for n in range(601, 616)]
            start = "商品登録画面で商品コード「M0412-PAGE-601」"
            note = "基準価格は元に指定が無いので100にした。"
        elif sid == "S-M04-12-JOINCHK-041":
            items = [("M0412-041-DST", "M0412-041-DST", 100), ("M0412-041-SRC", "M0412-041-SRC", 100)]
            start = "商品登録画面で商品コード「M0412-041-DST」"
            note = "基準価格は元に指定が無いので100にした。"
        elif sid == "S-M04-12-SPLITDST-042":
            items = [("M0412-042-SRC", "M0412-042-SRC", 100), ("M0412-042-DST", "M0412-042-DST", 100)]
            start = "商品登録画面で商品コード「M0412-042-SRC」"
            note = "基準価格は元に指定が無いので100にした。"
        elif sid == "S-M04-12-MIXED-043":
            items = [("M0412-043-SS", "M0412-043-SS", 400), ("M0412-043-SD", "M0412-043-SD", 100), ("M0412-043-JD", "M0412-043-JD", 700), ("M0412-043-JS", "M0412-043-JS", 250)]
            start = "商品登録画面で、商品コード「M0412-043-SS」"
            note = ""
        else:
            raise SystemExit(sid)
        t2 = span(t, start, keep, upload(rows_of(items), tail=False) + "グッズ商品は状態ニアミントの規格が商品ごとに1件ずつ作られる" + keep, incl_end=True)
        assert "商品登録画面で商品" not in t2, sid
        reason = ("元は商品登録画面で商品を作っていたので、グッズ商品CSV登録の複数行で作った。商品名は元に指定がある分（1001・2001）以外は商品コードと同じ値、商品名(英)は商品名(日)と同じ値、"
                  "買取価格と原価単価は0に決めた。規格の言語は元に指定が無いので日本語。在庫行はCSVの取り込みでも開店中の店舗ごと・在庫区分ごとに在庫数0で作られる（M03-27 L0129）。"
                  + note)
        out.append((sid, "直す", t2, "", BASE + "、M03-09 L0171", reason))
    save("M04-12", out)


if __name__ == "__main__":
    gen_m0408(); gen_m0412()
