import re, pathlib
P = pathlib.Path(__file__).resolve().parent.parent
HDR = ["シードID", "判定", "新しい投入方法", "新しい状態・属性", "根拠", "理由"]

def load(f):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{f}.tsv", encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]

CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
def row(code, name, buy, base, sale, cardset=None):
    cs = f"・カードセット(ID)は{cardset}" if cardset else ""
    return (f"商品IDは空・商品コードは「{code}」・商品名(日)は「{name}」・商品名(英)は「{name}」・言語(ID)は日本語のID"
            f"・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}"
            f"・購入グループ名称は既存の購入グループの名称{cs}・基準価格{base}・販売価格{sale}・買取価格{buy}・原価単価10・部門IDは空")

def csv_sentence(rows):
    if len(rows) == 1:
        body = rows[0]
    else:
        body = "／".join(f"{i+1}行目は{r}" for i, r in enumerate(rows))
    s = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、" + ("1行" if len(rows)==1 else f"{len(rows)}行") +
         "を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（" + body + "）")
    return s + "。グッズ商品は状態ニアミント・日本語の規格が1件作られる"

def idnote(code, label):
    return f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）"

def rewrite(old, rows, notes, tail_after_csv=None):
    ss = old.split("。")
    out, placed = [], False
    for s in ss:
        if "「商品を登録」を押す" in s or "商品IDを控える" in s and "登録後の商品登録編集画面" in s or s.startswith("続けて規格設定を押し"):
            if not placed:
                out.append(csv_sentence(rows)); out += notes + (tail_after_csv or []); placed = True
            continue
        out.append(s)
    assert placed
    return "。".join(out)

def S(code, name, cs=None, buy=10, price=100):
    return row(code, name, buy, price, price, cs)

# ---- F02-02
hdr, I = load("F02-02")
O = []
B1 = "M03-27 L0092・L0123・L0124・L0129・L0134・L0223（カードセット(ID)列）、M03-02 L0075〜L0077"
specs = {
 "S-F02-02-PRODUCTS-004": ([("F0202-P-004-1","火の試験カード-004","〔カードセットID-F0202-004A〕"),("F0202-P-004-2","火の別セットカード-004","〔カードセットID-F0202-004B〕"),("F0202-P-004-3","水の試験カード-004","〔カードセットID-F0202-004A〕")],["商品ID-F0202-004A","商品ID-F0202-004B","商品ID-F0202-004C"]),
 "S-F02-02-PRODUCTS-005": ([("F0202-P-005-1","火の試験カード-005","〔カードセットID-F0202-005〕")],["商品ID-F0202-005"]),
 "S-F02-02-PRODUCTS-006": ([("F0202-P-006-1","火の試験カード-006","〔カードセットID-F0202-006〕")],["商品ID-F0202-006"]),
 "S-F02-02-PRODUCTS-007": ([("F0202-P-007-1","火の試験カード-007","〔カードセットID-F0202-007〕")],["商品ID-F0202-007"]),
 "S-F02-02-CART-009": ([("F0202-P-009-1","F0202-P-009-1",None),("F0202-P-009-3","F0202-P-009-3",None)],["商品ID-F0202-009A","商品ID-F0202-009B"]),
 "S-F02-02-CART-010": ([("F0202-P-010-1","F0202-P-010-1",None),("F0202-P-010-3","F0202-P-010-3",None)],["商品ID-F0202-010A","商品ID-F0202-010B"]),
 "S-F02-02-PRODUCTS-011": ([("F0202-P-011-1","火の試験カード-011",None),("F0202-P-011-2","火の別セットカード-011",None)],["商品ID-F0202-011A","商品ID-F0202-011B"]),
 "S-F02-02-PRODUCTS-012": ([("F0202-P-012-1","火の試験カード-012",None),("F0202-P-012-2","火の別セットカード-012",None)],["商品ID-F0202-012A","商品ID-F0202-012B"]),
 "S-F02-02-CART-065": ([("F0202-P-065-1","F0202-P-065-1",None)],["商品ID-F0202-065A"]),
 "S-F02-02-CART-066": ([("F0202-P-066-1","F0202-P-066-1",None)],["商品ID-F0202-066A"]),
 "S-F02-02-PRODUCTS-067": ([("F0202-P-067-1","F0202-P-067-1",None)],["商品ID-F0202-067A"]),
}
COMMON_WHY = "元は商品規格登録編集画面で言語・状態・部門を選択肢の先頭にしていたが、CSVはニアミント・日本語の規格を作る（部門IDは空）。"
for r in I:
    sid = r[0]; old = r[5]
    if sid in specs:
        prods, labels = specs[sid]
        rows = [S(c, n, cs) for c, n, cs in prods]
        notes = [idnote(c, l) for (c, n, cs), l in zip(prods, labels)]
        new = rewrite(old, rows, notes)
        basis = B1 if any(p[2] for p in prods) else "M03-27 L0092・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077"
        why = COMMON_WHY
        if any(p[2] for p in prods):
            why += "カードセットはグッズ商品CSVのカードセット(ID)列で入れる（元は商品登録画面で名称を選択）。"
        O.append([sid, "直す", new, "", basis, why])
    elif sid == "S-F02-02-L-PRODUCT-062":
        code, name = "F0202-P-062-1", "連携商品001"
        ss = old.split("。")
        pre = ss[0].split("、管理画面の商品登録編集画面で")[0]
        assert pre.startswith("S-F02-02-L-CARDSET-062 のカードセットを登録した後")
        csvs = csv_sentence([S(code, name).replace("・部門IDは空","・地域別販売制限は0（日本語英語両サイト）・部門IDは空")])
        edit = ("商品マスター(検索入力)で商品コードに「" + code + "」を入れて「検索する >」を押し、商品マスター(検索結果)の行から商品登録編集画面（既存の商品の編集）を開き、"
                "カードセットで「連携試験セット001」を選び、割引率に販売割引率に登録済みのものを選んで「商品を登録」を押す")
        new = "。".join([pre + "、" + csvs.split("。")[0] + "。" + csvs.split("。")[1], edit] + ss[1:])
        O.append([sid, "直す", new, "", "M03-27 L0092・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077・L0073・L0146・L0129（識別ID 35）、M03-27 L0232",
                  "元の商品コードは無いため、シード専用の「F0202-P-062-1」を足した。カードセットは名称で選ぶ（このシードのカードセットはIDを控えていないので呼び名を増やさず、取り込み後に商品登録編集画面で付ける）。CSVはニアミント・日本語の規格を1件作る（元は規格を作っていない。なお元の手順は規格が無く、M03-02 L0144により公開操作ができない状態だった）。ケースは規格に触れない"])
    elif sid.startswith("S-F02-02-MEMBER"):
        O.append([sid, "直さない", "", "", "", "会員の登録。商品は S-F02-02-PRODUCTS-" + sid[-3:] + " が作る（そちらで直す）"])
    else:
        raise SystemExit(sid)
def write(f, O):
    with open(P / f"out/{f}.tsv", "w", encoding="utf-8") as fh:
        fh.write("\t".join(HDR) + "\n")
        for x in O:
            assert all("\t" not in c and "\n" not in c for c in x)
            fh.write("\t".join(x) + "\n")
write("F02-02", O)

# ---- F06-15
hdr, I = load("F06-15")
O = []
SPEC15 = {}
def prod_re(s):
    m = re.match(r"管理画面の商品登録編集画面で商品名に「([^」]+)」.*買取価格に(\d+)、", s)
    return (m.group(1), int(m.group(2))) if m else None
for r in I:
    sid = r[0]; old = r[5]; ss = old.split("。")
    prods = []; first = None
    out = []
    for i, s in enumerate(ss):
        p = prod_re(s)
        if p:
            if first is None: first = len(out); out.append(None)
            prods.append(p)
        else:
            out.append(s)
    assert prods, sid
    num = sid.split("-")[-1]
    rows = []
    for name, buy in prods:
        suf = name.replace(f"F0615-{num}-", "")
        code = f"F0615-{num}" if len(prods) == 1 else f"F0615-{num}-{suf.replace('商品','')}"
        rows.append(S(code, name, None, buy=buy, price=buy).replace("原価単価10", "原価単価10"))
    out[first] = csv_sentence(rows)
    new = "。".join(out)
    new = new.replace("（管理画面で登録した商品はカード詳細を持たない", "（グッズ商品CSV登録で登録した商品はカード詳細を持たない")
    why = "元は規格の買取価格を1000等にしていたので、買取価格はそのまま、基準価格・販売価格は買取価格と同額にした（買取価格は販売価格を上回れない M03-27 L0119）。"
    if "ご承諾" or True:
        why += "元のシードの申込み手順に「ネット買取規約同意」のチェックと申込みモーダルの「申込み」ボタンが無い（F05-06 L0060・L0062〜L0066。K03と同じ誤りだが、依頼文の決まりで直していない）。"
    O.append([sid, "直す", new, "", "M03-27 L0092・L0119・L0123・L0124・L0129・L0134、M03-02 L0075〜L0077", why])
write("F06-15", O)
