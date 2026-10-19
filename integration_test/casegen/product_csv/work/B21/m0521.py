from common import *
import re
R, ids = load("M05-21")
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0225〜L0229、M03-02 L0075〜L0077・L0092・L0111、M03-08 L0059、M03-09 L0123〜L0172"
CARDCAT = "「カード」のカテゴリ"

class Pr:
    def __init__(s, code, name, price=1000, card=None, cat=None, tag=None, shelf=None, sid=None, pid=None,
                 lang="日本語", keep_name=False, state_note=None, goods=False):
        s.__dict__.update(locals())

def open_by_code(code, pid=None):
    t = f"商品マスター(検索入力)で商品コードに「{code}」を入れて「検索する >」を押し、"
    if pid:
        t += f"商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{pid}〕）。"
    return t + OPEN_EDIT

def attach(p):
    parts = []
    if p.card:
        parts.append("「カード指定 >」ボタンを押し、カード検索ポップアップで" + p.card + "の行の決定ボタンを押す。続けて")
        if p.keep_name:
            parts.append("商品名(日)・商品名(英)はカード指定で自動で入った値のままにし、")
        else:
            parts.append(f"商品名(日)に「{p.name}」、商品名(英)に「{p.name}」を入れ（カード指定で自動で入った値は書き換える）、")
    else:
        parts.append("")
    if p.tag:
        parts.append(f"略称タグに{p.tag}を選び、")
    cat = p.cat or CARDCAT
    parts.append(f"商品カテゴリはサプライ・グッズの選択を外して{cat}を選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。")
    return "".join(parts)

def spec_edit(p):
    t = SPEC_LIST + "。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で"
    if p.shelf:
        t += f"棚番号に「{p.shelf}」を入れ、"
    t += "部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
    if p.sid:
        t += f"商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔{p.sid}〕）。"
    return t

def needs_edit(p): return bool(p.card or p.cat or p.tag)
def needs_spec(p): return bool(p.shelf or p.sid)

def flow(p):
    if not (needs_edit(p) or needs_spec(p) or p.pid):
        return ""
    t = open_by_code(p.code, p.pid)
    if needs_edit(p):
        t += "、" + attach(p)
        if needs_spec(p): t += spec_edit(p)
    elif needs_spec(p):
        t += "、" + spec_edit(p)
    else:
        t = t.rsplit("商品マスター(検索結果)の行から", 1)[0]  # 開く必要なし（IDを控えるだけ）
    return t

def product_segment(ps, rows_extra=None):
    if len(ps) == 1 or len(ps) <= 6 and len({p.lang for p in ps}) >= 1:
        rows = [row(p.code, p.name, p.name, lang=p.lang, base=p.price, buy=10 if p.price > 10 else 1) for p in ps]
        t = csv_up(rows, stock_note=False)
    t += "".join(flow(p) for p in ps)
    return t

def many(codes, names, price, cardcat, tag, pidlabel, sidlabel, n, rng):
    t = csv_many(codes, names, base=price, buy=10)
    t += (f"{n}商品それぞれについて、商品マスター(検索入力)で商品コードに{rng[0]}を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{pidlabel}〕の{n}件）。"
          f"{n}商品それぞれについて、" + OPEN_EDIT + "、「カード指定 >」ボタンを押し、カード検索ポップアップで登録したカード詳細の行の決定ボタンを押す。続けて商品名(日)と商品名(英)に取り込んだときの商品名（" + rng[1] + "）を入れ直し（カード指定で自動で入った値は書き換える）、"
          f"商品カテゴリはサプライ・グッズの選択を外して{cardcat}を選び、割引率に販売割引率に登録済みの割引率を選び、公開状態は「公開」のまま「商品を登録」ボタンを押す。"
          + SPEC_LIST + "。商品規格一覧で言語日本語・状態NMの規格（取り込みで作られた規格）の行を開き、商品規格登録編集画面で部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。"
          f"商品規格登録編集画面の商品規格ID欄に表示された番号を{n}件とも控える（〔{sidlabel}〕の{n}件）。")
    return t

CARD = "登録したカード詳細"
def prods(seed):
    s = seed
    A = lambda c, n, **k: Pr(f"M0521-{s}-{c}", n, card=k.pop("card", CARD), **k)
    G = lambda c, n, cat, **k: Pr(f"M0521-{s}-{c}", n, cat=cat, goods=True, **k)
    if s == "001":
        return [A("A", "基本カード", tag="TST", shelf="A-01-M0521-001"), A("B", "未選択カード", tag="TST", shelf="A-01-M0521-001")]
    if s == "002": return [A("A", "基本カード"), A("B", "未選択カード")]
    if s == "003": return [A("A", "M0521所属内カード-003"), A("B", "M0521所属外カード-003")]
    if s == "004": return [A("A", "M0521未選択印刷カードA"), A("B", "M0521未選択印刷カードB")]
    if s == "006": return [A("A", "集約カード", sid="商品規格ID-M0521-006")]
    if s in ("007", "009"):
        return ([A(str(i + 1), f"M0521境界カード{pr}-{s}", price=pr) for i, pr in enumerate([979, 980, 4799, 4800])]
                + [G("G", f"M0521グッズ商品-{s}", "「グッズ」のカテゴリ"), G("Y", f"M0521予約グッズ商品-{s}", "「予約グッズ」のカテゴリ")])
    if s == "008":
        return ([A(str(i + 1), f"M0521分類カード{i+1}-008") for i in range(4)]
                + [G("G", "グッズ商品", "「グッズ」のカテゴリ"), G("Y", "予約グッズ商品", "「予約グッズ」のカテゴリ")])
    if s == "011": return [A("A", "価格差カード", price=500, sid="商品規格ID-M0521-011")]
    if s == "012":
        return [A("A", "複数色数量カード", card="1件目に登録したカード（カラーは白と青）のカード詳細", cat="「カード」を含む3件のカテゴリ"),
                A("B", "色なし数量カード", card="2件目に登録したカード（カラーなし）のカード詳細", cat="「カード」を含む2件のカテゴリ")]
    if s == "013": return [A("A", "[TST]項目除去カード【JP/NM】 白/R", tag="TST")]
    if s == "014": return [G("A", "サプライ[限定] 白/R", "「グッズ」のカテゴリ")]
    if s == "015": return [A("A", "角括弧除去カード[注記A][注記B]")]
    if s == "016": return [A("A", "末尾カード 白/R")]
    if s == "017": return [A("A", "括弧カード 白/R(限定)")]
    if s == "018": return [A("A", "前半 白/R 後半")]
    if s == "019": return [A("A", "角括弧カード 白/R[注記]")]
    if s == "020":
        return [A("A", "M0521合計カードA-020", price=500), A("B", "M0521合計カードB-020", price=500), A("C", "M0521合計カードC-020", price=5000)]
    if s == "023":
        return [A("A", "M0521棚番カードA-023", price=500, shelf="A-01-023"), A("B", "M0521棚番カードB-023", price=500, shelf="B-02")]
    if s == "024":
        return [A("A", "M0521非Foilカード-024", price=500, card="Foil「なし」のカード詳細"), A("B", "M0521Foilカード-024", price=500, card="Foil「通常」のカード詳細")]
    if s == "025":
        return [A("A", "M0521略称カードAAA-025", price=500, tag="AAA"), A("B", "M0521略称カードBBB-025", price=500, tag="BBB")]
    if s == "026":
        return [A("A", "M0521レアリティなしカード-026", price=500, card="1件目のカード詳細"), A("B", "M0521レアリティRカード-026", price=500, card="2件目のカード詳細")]
    if s == "027":
        return [A("A", "M0521神話カード-027", price=500, card="レアリティ「神話」のカード詳細"), A("B", "M0521レアカード-027", price=500, card="レアリティ「レア」のカード詳細")]
    if s == "028":
        w = ["Zulu Cardのカード詳細", "Alpha Cardのカード詳細", "コレクターNoが空のカード詳細", "コレクターNo 010のカード詳細", "コレクターNo 002のカード詳細"]
        tg = ["M0521F1", "M0521F1", "M0521F1", "M0521F0", "M0521F0"]
        return [A(str(i + 1), f"M0521並びカード{i+1}-028", price=500, card=w[i], tag=tg[i], shelf="A-01-028", keep_name=True) for i in range(5)]
    if s == "029": return [A("A", "基本カード"), A("B", "未選択カード")]
    raise KeyError(s)

def sk031():
    mk = lambda c, n, card, lang: Pr(f"M0521-031-{c}", n, price=500, card=card, tag="SRT", shelf="A-01-031", lang=lang)
    return [mk("A", "並び確認A", "コレクターNo 001のカード詳細", "言語ID 2の言語"), mk("B", "並び確認B", "コレクターNo 001のカード詳細", "言語ID 1の言語"),
            mk("C", "並び確認C", "コレクターNo 120のカード詳細", "言語ID 1の言語"), mk("D", "並び確認D", "コレクターNo 045のカード詳細", "言語ID 1の言語")]

def split_old(old):
    segs = re.split(r"／(?=[①-⑨] )", old)
    return [(g[0], g[2:]) for g in segs]

out = []
for sid in ids:
    old = R[sid][5]
    key = sid.split("-")[-1]
    segs = split_old(old)
    pre = next(i for i, (_, b) in enumerate(segs) if b.startswith("在庫編集画面で") or b.startswith("フロントで") or b.startswith("出荷指示"))
    keep = [b for _, b in segs[:pre] if b.startswith("カード登録画面で") or b.startswith("略称タグ登録画面で")]
    why = ""
    if key in ("021", "022"):
        n = int(key) - 0 and (30 if key == "021" else 31)
        codes = [f"M0521-{key}-{i:02d}" for i in range(1, n + 1)]
        names = [f"M0521改頁カード{key}-{i:02d}" for i in range(1, n + 1)]
        prod = many(codes, names, 500, CARDCAT, None, f"商品ID-M0521-{key}", f"商品規格ID-M0521-{key}", n,
                    (f"「M0521-{key}-01」〜「M0521-{key}-{n:02d}」", f"「M0521改頁カード{key}-01」〜「M0521改頁カード{key}-{n:02d}」"))
        why = f"{n}商品は同じ操作のくり返しなので、CSVに{n}行を並べ、編集と規格の確認は「それぞれについて」と書いた。商品コードは機能IDとシードIDから作った値（M0521-{key}-01〜）。"
    else:
        ps = sk031() if key == "031" else prods(key)
        prod = product_segment(ps)
        if key == "031":
            prod += ("並び確認Bだけ、取り込みで作られた規格（言語ID 1の言語・状態NM）は使わないため、その規格を商品規格一覧から開いて公開ステータスを「非公開」にして「商品規格を登録」ボタンを押し、"
                     "商品規格一覧の「新規作成」を押して言語に言語ID 1の言語、状態に状態ID 2の状態を選び、商品コードに「M0521-031-B-2」、棚番号に「A-01-031」、基準価格(円)・販売価格(円)に500、買取価格(円)に10を入れ、部門は選択肢の先頭を選び、公開ステータスに「公開」を選んで「商品規格を登録」ボタンを押す。")
    # CSV の言語列の補正（031）
    if key == "031":
        prod = prod.replace("言語(ID)は言語ID 2の言語のID", "言語(ID)は言語ID 2")
    markers = [m for m, _ in segs[:pre]]
    k = len(markers) - len(keep)
    sents = [x for x in prod.split("。") if x]
    first, rest_s = sents[:2], sents[2:]
    chunks = ["。".join(first)]
    kk = min(k - 1, len(rest_s))
    if kk >= 1:
        base_n, extra = divmod(len(rest_s), kk)
        i = 0
        for j in range(kk):
            nn = base_n + (1 if j < extra else 0)
            chunks.append("。".join(rest_s[i:i + nn])); i += nn
    else:
        chunks[0] = "。".join(sents)
    new_bodies = keep + chunks
    head = "／".join(f"{markers[i]} {b}" for i, b in enumerate(new_bodies))
    rest = "／".join(f"{m} {b}" for m, b in segs[pre:])
    new = head + "／" + rest
    lost = set(re.findall(r"〔[^〕]+〕", "／".join(b for _, b in segs[:pre]))) - set(re.findall(r"〔[^〕]+〕", head))
    assert not lost, (sid, lost)
    # 元の文のうち、商品に触れない文は残るか（gate G7 の事前確認用）
    ext = "カード商品CSV登録は使わず、カード商品も" "グッズ商品CSV登録で作り、「カード指定 >」で元のカードを付けた。"
    why = (why + " " + "元の「言語、状態、販売価格」など値の指定が無い項目は、日本語・ニアミントの規格（取り込みで作られた規格）のまま、販売価格は1000（980円未満の組は500）にした。").strip()
    if any(p.goods for p in ([] if key in ("021", "022") else ps)):
        why += " グッズの商品は、CSVのカテゴリをサプライ・グッズで取り込み、編集画面で「グッズ」または「予約グッズ」のカテゴリに付け替えた。"
    if key == "001":
        why += " 商品B（未選択カード）は元が「同じ手順」なので、略称タグTSTと棚番号もAと同じにした。"
    if key == "028":
        why += " 元は商品名の指定が無いので、取り込み時の名前はカード指定で入った値に置き換わる（書き換えない）。棚番号は元が「同じ」とだけ書いていたので A-01-028 を5商品に入れた。"
    if key == "031":
        why += " ケースに影響: 並び確認Bは取り込みで作られた規格（言語ID 1・状態NM）が余るため非公開にして使わず、状態ID 2の規格を足した。状態ID 1がニアミントであることは実機で確認が要る。"
    out.append([sid, "直す", new, "", BASIS, why.strip()])
save("M05-21", out)
print(len(out))
