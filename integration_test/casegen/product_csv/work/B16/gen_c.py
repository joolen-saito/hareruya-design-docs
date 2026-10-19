import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib import *
from gen_a import rows, write

T1 = "管理画面の商品登録画面で、商品・商品規格・販売価格・公開状態・在庫を登録する"
T2 = "管理画面の会員登録画面で会員を、商品登録画面で商品・商品規格・販売価格・公開状態・在庫を登録する"
T2N = "管理画面の会員登録画面で会員を、商品登録画面で商品・商品規格・販売価格・公開状態を登録する"
T3 = "管理画面のレイアウト設定でTOP画面に商品リストを配置し、商品登録画面で商品を登録して各リストの対象タグを商品に割り当てる"
T4 = "管理画面の会員登録画面で会員を、商品登録画面で商品を登録し、会員でお気に入り登録する"
T5 = "管理画面の商品登録画面で商品を登録し、レイアウト設定で買い物かご画面の先頭部へ試験用ブロック（フリー入力のスクリプト）を置く"
T6 = "管理画面の商品登録画面で商品を登録し、レイアウト設定で買い物かご画面の先頭部にタグの管理サービスのスクリプトと受け渡し領域へ積むブロックが無いことを確認する"
T7 = "管理画面のレイアウト設定でTOP画面に商品リスト（新着）を配置し、商品登録画面で商品を登録して新着リストの対象タグを割り当てる"
# テンプレートごとの (前の文, 後ろの文)
TPL = {
    T1: ([], []),
    T2: (["管理画面の会員登録画面で会員を登録する"], []),
    T2N: (["管理画面の会員登録画面で会員を登録する"], []),
    T3: (["管理画面のレイアウト設定でTOP画面に商品リストを配置する"], []),
    T4: (["管理画面の会員登録画面で会員を登録する"], ["会員でお気に入り登録する"]),
    T5: ([], ["管理画面のレイアウト設定で買い物かご画面の先頭部へ試験用ブロック（フリー入力のスクリプト）を置く"]),
    T6: ([], ["管理画面のレイアウト設定で買い物かご画面の先頭部にタグの管理サービスのスクリプトと受け渡し領域へ積むブロックが無いことを確認する"]),
    T7: (["管理画面のレイアウト設定でTOP画面に商品リスト（新着）を配置する"], []),
}


def sp(lang, state, price):
    return (lang, state, price)


J500 = [("ja", "NM", 500)]
J500S = [("ja", "NM", 500), ("ja", "SP", 400)]
JE = [("ja", "NM", 500), ("en", "NM", 700)]

# key: (商品名, [規格], 在庫あり, 公開, タグ)
def prod(name, specs, stock=True, pub=True, tag=None):
    return dict(name=name, specs=specs, stock=stock, pub=pub, tag=tag)

N = "F1003-"
D = {}  # 番号 -> (prods, 価格が元に無い, ケース影響メモ)
D["001"] = [prod(N + "001-A", [("ja", "NM", 500)]), prod(N + "001-B", [("ja", "NM", 1000)])]
D["002"] = [prod(N + "002-C", [("ja", "NM", 500)]), prod(N + "002-D", [("ja", "NM", 1000)])]
D["003"] = [prod(N + "003-A", J500S), prod(N + "003-B", J500)]
for n in ("004", "005", "008", "009", "032", "033", "034", "051", "052", "053", "056"):
    D[n] = [prod(N + n, J500)]
D["010"] = [prod(N + "010", [("en", "NM", 600)])]
D["011"] = [prod(N + "011", J500, stock=False)]
D["012"] = [prod(N + "012", J500S, stock=False)]
D["013"] = [prod(N + "013", J500S, stock=False)]
D["014"] = [prod(N + "014", JE, stock=False)]
D["015"] = [prod(N + "015", [("en", "NM", 700)], stock=False)]
D["016"] = [prod(N + "016", J500, stock=False)]
D["017"] = [prod(N + "017", [("ja", "NM", 500), ("ja", "SP", 400), ("en", "NM", 700), ("en", "PL", 300)], stock=False)]
D["018"] = [prod(N + "018", JE, stock=False)]
for n in ("019", "020", "050"):
    D[n] = [prod(N + n, J500S, stock=False)]
for n in ("021", "022"):
    D[n] = [prod(N + n, JE, stock=False)]
D["023"] = [prod(N + "023", J500, stock=False, pub=False)]
D["024"] = [prod(N + "024", J500, stock=False)]
D["025"] = [prod(N + "025-A", [("ja", "NM", 100)]), prod(N + "025-B", [("ja", "NM", 200)]), prod(N + "025-C", [("ja", "NM", 300)])]
D["026"] = [prod(N + "026-P", [("ja", "NM", 100), ("en", "NM", 150)]), prod(N + "026-Q", [("ja", "NM", 200)])]
D["028"] = [prod(N + "028-A", J500), prod(N + "028-B", J500)]
D["029"] = [prod(N + "029-X", J500)]
D["030"] = [prod(N + "030", [("en", "NM", 600)])]
for n in ("035", "036", "037"):
    D[n] = [prod(N + n, J500, stock=False)]
for n in ("038", "039"):
    D[n] = [prod(N + n + "-A", [("ja", "NM", 100)]), prod(N + n + "-B", [("ja", "NM", 200)])]
D["040"] = [prod(N + "040-X", J500, tag="商品リスト（新着）の対象タグ")]
D["041"] = [prod(N + "041-X", J500, tag="商品リスト（新着）の対象タグ"), prod(N + "041-Y", J500, tag="商品リスト（値下げ）の対象タグ"), prod(N + "041-Z", J500, tag="商品リスト（おすすめ）の対象タグ")]
for n in ("042", "043"):
    D[n] = [prod(N + n + "-X", J500), prod(N + n + "-Y", J500)]
D["044"] = [prod(N + "044-X", J500)]
D["045"] = [prod(N + "045-X", J500)]
D["046"] = [prod(N + "046-A", J500)]
D["047"] = [prod(N + "047-A", J500)]
D["049"] = [prod(N + "049-A", JE), prod(N + "049-B", [("ja", "NM", 1000)])]
D["054"] = [prod(N + "054", J500, tag="商品リスト（新着）の対象タグ")]
D["055"] = [prod(N + "055", J500, tag="商品リスト（新着）の対象タグ")]

SUF = {("ja", "NM"): "", ("ja", "SP"): "-SP", ("en", "NM"): "-EN", ("en", "PL"): "-EN-PL", ("fr", "NM"): "-FR"}


def build(sid, old):
    num = sid.split("-")[-1]
    sents = old.split("。")
    main = sents[0]
    assert main in TPL, (sid, main)
    pre, post = TPL[main]
    prods = D[num]
    new = list(pre)
    # CSV
    csvp = []
    for p in prods:
        l0, s0, price0 = p["specs"][0]
        assert s0 == "NM"
        extra = f"・タグ(ID)は{p['tag']}に設定したタグのID" if p["tag"] else ""
        csvp.append(dict(code=p["name"], ja=p["name"], en=p["name"], lang=l0, base=price0, buy=10, pub=p["pub"], extra=extra))
    new.append(upload_sentence(csvp))
    new.append(after_upload(csvp))
    stock_items = []
    for p, cp in zip(prods, csvp):
        new.append(open_edit(cp))
        new.append("商品登録編集画面の「規格設定」ボタンから商品規格一覧を開く")
        l0 = p["specs"][0][0]
        new.append(first_spec(dict(lang=l0)))
        if p["stock"]:
            stock_items.append((p["name"], l0, "NM", 10))
        for (l, s, price) in p["specs"][1:]:
            code = p["name"] + SUF[(l, s)]
            new.append(new_spec(dict(lang=l, state=s, code=code, base=price, buy=10)))
            if p["stock"]:
                stock_items.append((code, l, s, 10))
    if stock_items:
        new.extend(stock_sentences(stock_items))
    new.extend(post)
    new.extend(sents[1:])
    return "。".join(new), prods


def reason(num, prods, main):
    parts = []
    parts.append("元の方法は商品の登録を1文で言うだけだったので、状態・属性に書かれた商品名・商品規格（言語・状態・税抜価格）・在庫を、グッズ商品CSV登録（最初の規格）・商品規格一覧の「新規作成」（追加の規格）・在庫編集（在庫10）の手順に書き起こした")
    parts.append("商品コードは商品名と同じ値にし、追加の規格は末尾に -SP・-EN・-EN-PL を付けた。CSVの基準価格＝販売価格＝税抜価格、買取価格10・原価単価10・サイズ1・重量1・商品カテゴリはサプライ・グッズ・購入グループ名称は既存の購入グループの名称・地域別販売制限は0（日英の両サイト）にした。税込は画面が計算する")
    if num in ("003", "028", "029", "030", "040", "041", "042", "043", "044", "045"):
        parts.append("価格は元の状態・属性に定めが無いので、500（030は英語版のため600）を入れた" if num != "003" else "価格は元の状態・属性に定めが無いので、NM=500・SP=400・商品B=500を入れた")
    if all(not p["stock"] for p in prods):
        parts.append("状態・属性に在庫の定めが無いので在庫は入れない（元の方法の文は在庫も登録するとあるが、この商品は在庫なしの前提で読んだ）")
    else:
        parts.append("在庫は新しく作る規格が0なので、在庫編集で入庫して承認する（M04-21 L0056〜L0113、登録者とは別の承認者）")
    if any(not p["pub"] for p in prods):
        parts.append("本店で非公開なので商品公開ステータスは1（非公開）にした")
    if num in ("040", "041", "054", "055"):
        parts.append("対象タグの割り当てはCSVのタグ(ID)の列で入れる（M03-27 L0221）。タグそのものはレイアウト設定で商品リストに設定した対象タグを使う")
    if num in ("042", "043"):
        parts.append("元の方法にはカードを登録して商品に紐付ける手順が無く（状態・属性のカードID 9100304x9・基本土地かどうかも作られない）、ここでは直していない")
    if num in ("013", "017", "050"):
        parts.append("規格IDを固定の番号で指す期待結果があるが、規格IDも画面で指定できない")
    parts.append("ケースに影響: 事前準備と期待結果が商品ID 9100300xx1 のような固定の番号を使っているが、商品IDはCSVでも商品登録画面でも自動で振られ、画面では指定できない（元のシードも同じ。ここでは直していない）")
    return "。".join(parts)


def f1003():
    h, I = rows("F10-03")
    ix = {c: i for i, c in enumerate(h)}
    out = []
    basis = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0221、M03-09 L0086〜L0087・L0125〜L0134、M03-02 L0075〜L0077、M04-21 L0056〜L0113"
    for src in I:
        sid, old = src[0], src[ix["投入方法"]]
        method, prods = build(sid, old)
        out.append([sid, "直す", method, "", basis, reason(sid.split("-")[-1], prods, old.split("。")[0])])
    write("F10-03", out)


f1003()
