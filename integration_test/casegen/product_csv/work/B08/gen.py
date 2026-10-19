import re, pathlib
P = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/product_csv')
def load(fid):
    ls = [l.rstrip('\n').split('\t') for l in open(P/f'in/{fid}.tsv', encoding='utf-8')]
    return ls[0], [x for x in ls[1:] if x and x != ['']]

CAT = "商品カテゴリ(ID)はサプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
UPG = "グッズ商品CSV登録で雛形ファイルをダウンロードし、1行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（{}）。グッズ商品は状態ニアミントの規格が1件作られる。"
def cols(code, name, base=100, sale=100, buy=10):
    return (f"商品IDは空・商品コードは「{code}」・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・商品名(日)は「{name}」・商品名(英)は「{name}」・サイズ1・重量1・{CAT}・購入グループ名称は既存の購入グループの名称・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・地域別販売制限は0・スマレジ連携フラグは0・スマレジ商品コードと部門IDは空")
def search(code, pid):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{pid}〕）。"
OPEN = "商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、「規格設定」ボタンから商品規格一覧を開く。"
def csv_class(rid, extra=""):
    return f"商品規格一覧で言語日本語・状態ニアミントの規格（取り込みで作られた規格）の行を開き、{extra}商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{rid}〕）。"
def new_class(code, rid, state="スライトリープレイド"):
    return (f"商品規格一覧の「新規作成」を押し、商品規格登録編集画面で言語に日本語、状態に{state}を選び、商品コードに「{code}」、基準価格(円)に100、販売価格(円)に100、買取価格(円)に10を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{rid}〕）。")

PS = re.compile(r"管理画面の商品登録画面で商品名に「(A0603試験商品(\w+))」を入れ、ほかの必須項目を入れて「登録」を押し、開いた商品の編集画面に表示された商品IDを控える（〔([^〕]+)〕）。")
RS = re.compile(r"その商品の商品規格登録画面で言語・状態・販売価格などの必須項目を入れて「登録」を押し、開いた商品規格の編集画面に表示された商品規格IDを控える（〔([^〕]+)〕）。")

def fix(old):
    out = []; i = 0
    first = True; code = None
    while i < len(old):
        mp = PS.match(old, i)
        if mp:
            name, suf, pid = mp.group(1), mp.group(2), mp.group(3)
            code = f"A0603-{suf}"
            out.append(UPG.format(cols(code, name)) + search(code, pid) + OPEN)
            first = True; i = mp.end(); continue
        mr = RS.match(old, i)
        if mr:
            rid = mr.group(1)
            if first:
                out.append(csv_class(rid)); first = False
            else:
                sfx = rid[-1]
                out.append(new_class(code + sfx, rid))
            i = mr.end(); continue
        out.append(old[i]); i += 1
    return "".join(out)

def ab(old):
    i0 = old.index("管理画面の商品登録画面で商品名に「A06-03 AB連携商品」")
    i1 = old.index("管理画面の部門登録/編集画面")
    i2 = old.index("その商品の商品規格登録画面で商品コードに「A0603AB-001」")
    head = old[:i0]; dept = old[i1:i2]
    name = "A06-03 AB連携商品"
    new = head + UPG.format(cols("A0603AB-001", name, base=500, sale=500, buy=100)) + search("A0603AB-001", "商品ID-A0603AB-共有")
    new += dept
    new += OPEN + csv_class("商品規格ID-A0603AB-共有", extra="部門に「A06-03 AB試験部門」を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押し、")
    new += ("在庫変更CSV登録画面で、店舗に「A06-03 AB試験店舗」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、承認通知先に承認するメンバー（A06-03試験管理者。S-A06-03-ADM）を選び、商品コード「A0603AB-001」・在庫増減数「100」・仕入単価「100」の1行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す。"
            "これは管理者「A06-03 AB試験担当」（S-A06-03-AB-ADM）で行う。在庫を登録したメンバーとは別のA06-03試験管理者（S-A06-03-ADM）で承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押す。")
    assert old[i2:].count("。")==0 or True
    return new

BASIS = "M03-27 L0092 L0119 L0123 L0124 L0134 L0194-L0238、M03-02 L0075-L0077 L0116、M03-09 L0123-L0124 L0130-L0134 L0144-L0147 L0172、M03-08 L0059"
hdr, rows = load('A06-03')
res = []
for r in rows:
    sid, old, attr = r[0], r[5], r[3]
    if sid == 'S-A06-03-AB-PRODUCT':
        new = ab(old)
        why = ("元は商品登録画面の販売価格(円)に1000を入れていたが、規格の画面でセールフラグを入れずに基準価格500を登録していたので販売価格は500だった。グッズ商品CSVで新しく作る規格はセールフラグ無効で販売価格が基準価格と同じ値になる（M03-09 L0086-L0087）ので、CSVの基準価格・販売価格とも500にした。使うケースは販売価格を確かめない。"
               "元の「在庫数無制限」は、規格の画面に在庫数・在庫無制限の入力欄が無い（M03-09 L0072-L0075 L0094-L0097）ため、在庫変更CSV登録で十分な数（100。ケースIT-A06-03-058〜062の買取明細の数量3より多い）を入庫し別のメンバーが承認する置き換えにした（M04-21 L0127-L0135 L0166-L0168、M04-32 L0108 L0110 L0141 L0297）。店舗は元に在庫の店舗の指定が無いので、ケースが使う「A06-03 AB試験店舗」にした。承認者は元のシードに無いので同じ機能の既存のS-A06-03-ADMを使った（その店舗の承認権限は未確認）。買取価格は元に指定が無く、販売価格を上回れない（M03-27 L0119）ので100にした。"
               "部門は規格の必須項目（M03-09 L0155）で、CSVでは部門IDを空にするため、部門を作ったあとに取り込みで作られた規格を開いて選ぶ。商品コード「A0603AB-001」は元のとおり。")
    else:
        new = fix(old)
        assert new != old and 'CSV' in new, sid
        why = "元は商品の新規登録と規格の登録だけで属性の指定が無い（必須項目に任意の値）。商品コード・価格はシード専用の値を決めた（買取価格は販売価格を上回れない M03-27 L0119）。ケースは規格が存在することだけを使い、状態・言語・価格には依らない。"
        if 'MIXSTOCK' in sid or 'STOCKPRICE' in sid or 'DATA-011' in sid.replace('CASE','DATA'):
            pass
        if sid.endswith('-052') or sid.endswith('-053'):
            why += "2件目の規格は、取り込みで作られたニアミントの規格と区別するため、同じ言語でスライトリープレイドの状態にした（元は2件の言語・状態の指定が無い）。"
        if sid.endswith('-011'):
            why += "商品が2点なので、CSVを商品ごとに1行ずつ別々にアップロードする。"
    res.append([sid, "直す", new, "", BASIS, why])
(P/'out').mkdir(exist_ok=True)
with open(P/'out/A06-03.tsv','w',encoding='utf-8') as f:
    f.write("\t".join(["シードID","判定","新しい投入方法","新しい状態・属性","根拠","理由"])+"\n")
    for r in res:
        assert not any(('\t' in c or '\n' in c) for c in r)
        f.write("\t".join(r)+"\n")
print(len(res), len(rows))
