from common import *
hdr, I = load('M05-23')
O = []
B = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077、M03-09 L0095・L0097・L0130〜L0134"
FIRST = re.compile(r'管理画面の商品登録画面で商品名に「(?P<nm>[^」]+)」、販売価格に任意の金額を入れ、在庫数の無制限にチェックを入れ、商品公開ステータスを公開にして登録する')
PRICE = {"会社比較商品A": 1000, "会社比較商品B": 2500}
for r in I:
    sid, old = r[0], r[5]
    k = sid[len('S-M05-23-'):]
    nums = k.split('-')[-1]
    names = []
    if k.startswith('DETAILS-011'):
        m = re.search(r'管理画面の商品登録画面で、商品名が(「[^」]+」(?:「[^」]+」)*)の5商品を、それぞれ販売価格に任意の金額を入れ、在庫数の無制限にチェックを入れ、商品公開ステータスを公開にして登録する', old)
        assert m
        names = re.findall(r'「([^」]+)」', m[1]); whole = m[0]; extra_pat = []
    else:
        m = FIRST.search(old); assert m, sid
        names = [m['nm']]; whole = m[0]
        extra_pat = re.findall(r'同じ画面で商品名「([^」]+)」の商品も登録する', old)
        names += extra_pat
    def code_of(nm):
        mm = re.match(r'M0523商品(\d+[A-Z]?)$', nm)
        if mm: return 'M0523-' + mm[1]
        if k.startswith('DETAILS-011'): return 'M0523-' + nm
        if nm in ('会社比較商品A', '会社比較商品B'): return 'M0523-014' + nm[-1]
        return 'M0523-' + nums
    codes = [code_of(n) for n in names]
    rows = [csv_row(c, n, n, base=PRICE.get(n, 1000), buy=100, pub=2, branch=1) for c, n in zip(codes, names)]
    if len(names) == 1:
        edit = spec_open_edit(codes[0], extras="")
    else:
        edit = "商品コード" + "、".join(f"「{c}」" for c in codes) + "のそれぞれについて次を行う。" + spec_open_edit(None, extras="").replace("その商品の商品コード", "各商品の商品コード")
    new_first = csv_upload(rows) + "。" + edit + "。" + stock("TC東京", [(c, 100) for c in codes])
    t = old.replace(whole, new_first, 1)
    for n in extra_pat:
        t = t.replace(f"。同じ画面で商品名「{n}」の商品も登録する", "").replace(f"同じ画面で商品名「{n}」の商品も登録する", "")
    assert '商品登録画面で商品名に' not in t.replace('管理画面の商品登録画面で商品ID', ''), sid
    reason = ("元の手順は商品登録画面で商品名・販売価格・在庫数の無制限・商品公開ステータスを入れて登録していた。グッズ商品CSVで商品と状態ニアミントの規格を作り、"
              "販売価格は元のシードの『任意の金額』なので1000（会社比較商品A・Bは元の小計に合わせて1000と2500）、基準価格は販売価格と同額、買取価格100、原価単価10、在庫無制限は規格の画面に欄が無い（M03-09 L0095・L0097）ので在庫変更CSV登録で数量100を入庫して別の管理者が承認する（承認するメンバーは元のシードに無いので、在庫を登録したメンバーと別の既存の管理者を使う）、商品コードはシード専用の「M0523-…」、商品名(英)は商品名(日)と同じ値にした。")
    if k == 'SNAPSHOT-018':
        t = t.replace("商品名を「Renamed Product 523」に変えて登録する", "商品名を「Renamed Product 523」に変え、割引率に販売割引率に登録済みの割引率を選んで登録する")
        assert "割引率に販売割引率" in t
        reason += "手順6は取り込んだ商品を商品登録画面で開いて商品名を変えて登録するので、編集では必須の割引率を選ぶ操作を足した（グッズ商品CSVに割引率の列が無い）。"
    O.append([sid, "直す", t, "", B, reason])
write('M05-23', O)
print(len(O))
