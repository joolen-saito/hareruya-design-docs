import re, pathlib
P = pathlib.Path(__file__).resolve().parents[2]
HDR = "シードID\t判定\t新しい投入方法\t新しい状態・属性\t根拠\t理由"
CAT = "サプライ・グッズのカテゴリID（カテゴリ登録/編集画面の最上位の一覧で「サプライ・グッズ」の行のID欄に表示された値）"
BASIS = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075〜L0077"
BASIS_STOCK = BASIS + "、M03-09 L0073・L0074・L0097、M04-21 L0127〜L0135・L0166〜L0168、M04-32 L0108・L0110・L0141・L0297"


def cols(r):
    b = r.get("branch", 0)
    s = (f"商品IDは空・商品コードは「{r['code']}」・商品名(日)は「{r['nja']}」・商品名(英)は「{r['nen']}」"
         f"・言語(ID)は{r.get('lang', '日本語のID')}・商品公開ステータスは2（公開）"
         f"・支店の商品公開ステータスは{b}（{'公開' if b else '非公開'}）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}"
         f"・購入グループ名称は既存の購入グループの名称・基準価格{r['price']}・販売価格{r['price']}"
         f"・買取価格{r['buy']}・原価単価10")
    if r.get("region") is not None:
        s += f"・地域別販売制限は{r['region']}"
    return s + "・部門IDは空"


def csv_sentence(rows, label=None, search=False):
    n = len(rows)
    head = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、" + (f"{n}行" if n > 1 else "1行")
            + "を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（")
    if n == 1:
        body = cols(rows[0])
    else:
        body = "／".join(f"{i+1}行目は{cols(r)}" for i, r in enumerate(rows))
    s = head + body + "）。グッズ商品は状態ニアミントの規格が1件作られる"
    if search:
        s += f"。商品マスター(検索入力)で商品コードに「{rows[0]['code']}」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔{label}〕）"
    return s


APPROVER = "承認通知先に承認するメンバー（在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバー）を選び"
def stock(items, store="本店"):
    n = len(items)
    rows = "、".join(f"商品コード「{c}」・在庫増減数「100」・仕入単価「100」" for c in items)
    return (f"在庫変更CSV登録画面で、店舗に「{store}」、在庫区分に「EC-CUBE」、在庫変動区分に入庫の区分、在庫変動理由に「シード作成」を入れ、{APPROVER}、"
            f"{rows}の{n}行を書いたCSVを「ファイルを選択」で選んで「一括登録を実行」を押す（M04-21 L0127〜L0135・L0166〜L0168）。"
            "在庫を登録したメンバーとは別の、その店舗の承認権限を持つメンバーで承認一覧を開き、この申請の行にチェックを入れて「一括承認」を押し、表示された確認モーダルで「承認する」を押す（M04-32 L0108・L0110・L0141・L0297）")


def buy_of(p):
    return max(10, p // 10)


def price_of(s):
    m = re.search(r"税込(\d+)円となる額", s)
    if m:
        return int(m.group(1))
    m = re.search(r"販売価格に(\d+)(?:円|を入れ)", s)
    if m:
        return int(m.group(1))
    if "合計が1400円となる額" in s:
        return "SUM1400"
    return 1000


def fix_price(r):
    if r["price"] == "SUM1400":
        r["price"] = "（販売価格・送料・手数料の合計が1400円となる額。送料・手数料は本店のご注文方法指定画面での表示に合わせて求める）"
        r["buy"] = 100
    return r


F = "F04-02"


def f0402(seed, method):
    sents = method.split("。")
    out, group, notes = [], [], []

    def flush():
        nonlocal group
        if group:
            out.append(csv_sentence([fix_price(dict(r)) for r in group]))
            group = []

    for s in sents:
        if s.startswith("管理画面の商品登録編集画面で") or s.startswith("続けて商品名に"):
            rest = ""
            if "、在庫変更CSV登録画面で" in s:
                s, rest = s.split("、在庫変更CSV登録画面で", 1)
                rest = "STOCK"
            if "販売種別" in s:
                return None
            if "1人目から順に" in s:
                # 025: 会員ごとの繰り返しの中。会員に対応する1件を1行CSVで作る
                r = dict(code="F0402-BUNDLE-P-025-0N（N は会員の順番。1人目は01、6人目は06）",
                         nja="F0402-BUNDLE-P-025-0N-商品（N は会員の順番）", nen="F0402-BUNDLE-P-025-0N-商品（N は会員の順番）",
                         price=1000, buy=100)
                out.append(csv_sentence([r]))
                if rest:
                    out.append(stock(["F0402-BUNDLE-P-025-0N（Nは会員の順番。1人目は01、6人目は06）"]))
                continue
            m = re.search(r"商品コードに「([^」]+)」", s)
            code = m.group(1)
            m2 = re.search(r"商品名に「([^」]+)」", s)
            nm = m2.group(1) if m2 else f"{code}-商品"
            p = price_of(s)
            r = dict(code=code, nja=nm, nen=nm, price=p, buy=buy_of(p) if p != "SUM1400" else 100,
                     branch=1)
            if "言語に「英語」" in s:
                r["lang"] = "英語のID"
            group.append(r)
            if rest:
                flush()
                out.append(stock([code], "TC大阪" if r["branch"] and "TC大阪" in method else "本店"))
            continue
        if s.startswith("続けて商品名に") is False and group:
            flush()
        if s.startswith("在庫変更CSV登録画面で商品コード「F0402-083-PRODA」"):
            s = stock(["F0402-083-PRODA", "F0402-083-PRODB"])
        out.append(s)
    flush()
    return "。".join(out)


def m0522(seed, method):
    num = seed[-3:]
    sents = method.split("。")
    out = []
    for s in sents:
        if s.startswith("管理画面の商品登録編集画面で商品") and "商品を登録」ボタンを押し、商品規格の登録画面" in s:
            tag = f"M0522-{num}"
            if "P31-001" in s:
                rows = [dict(code=f"{tag}-{i:03d}", nja=f"P31-{i:03d}", nen=f"P31-{i:03d}", price=100, buy=10, region=0) for i in range(1, 32)]
                body = ("グッズ商品CSV登録で雛形ファイルをダウンロードし、31行を書いたCSVをCSVファイル選択で選んで「CSVファイルのアップロード」を押し、表示された確認モーダルでアップロードを確定する（"
                        f"1行目から31行目まで、商品コードは「{tag}-001」〜「{tag}-031」の連番、商品名(日)・商品名(英)は「P31-001」〜「P31-031」の連番、"
                        f"ほかの列は全行同じで、商品IDは空・言語(ID)は日本語のID・商品公開ステータスは2（公開）・支店の商品公開ステータスは1（公開）・サイズ1・重量1・商品カテゴリ(ID)は{CAT}"
                        "・購入グループ名称は既存の購入グループの名称・基準価格100・販売価格100・買取価格10・原価単価10・地域別販売制限は0・部門IDは空）。グッズ商品は状態ニアミントの規格が1件作られる")
                out.append(body)
                out.append(stock([f"{tag}-001〜{tag}-031の31商品それぞれ"]).replace("の1行を書いたCSV", "を1行ずつ書いたCSV").replace("の1行","の行"))
                continue
            if "会社比較商品A" in s:
                rows = [dict(code=f"{tag}-A", nja="会社比較商品A", nen="会社比較商品A", price=1000, buy=100, region=0),
                        dict(code=f"{tag}-B", nja="会社比較商品B", nen="会社比較商品B", price=2500, buy=250, region=0)]
            else:
                mm = re.search(r"計(\d)商品", s)
                n = int(mm.group(1)) if mm else 1
                if n == 1:
                    rows = [dict(code=f"{tag}-A", nja=f"{tag}-商品", nen=f"{tag}-商品", price=1000, buy=100, region=0)]
                else:
                    rows = [dict(code=f"{tag}-{c}", nja=f"{tag}-商品{c}", nen=f"{tag}-商品{c}", price=1000, buy=100, region=0) for c in "ABC"[:n]]
            if "受注時商品名" in s:
                rows = [dict(code=f"{tag}-A", nja="受注時商品名", nen="受注時商品名", price=1000, buy=100, region=0)]
            out.append(csv_sentence(rows, label=f"商品ID-{tag}" if "受注時商品名" in s else None, search="受注時商品名" in s))
            codes = "」「".join(r["code"] for r in rows)
            out.append(stock([r["code"] for r in rows]))
            continue
        if s.startswith("登録後の商品登録編集画面に表示された商品IDを控える"):
            continue  # CSV 取込後の商品マスター検索で控える（上の文に含めた）
        if s.startswith("管理画面の商品登録編集画面で商品〔商品ID-"):
            s = s.replace("商品名を「変更後商品名」に変えて「商品を登録」ボタンを押す", "商品名を「変更後商品名」に変え、割引率に販売割引率に登録済みのものを選んで「商品を登録」ボタンを押す")
        out.append(s)
    return "。".join(out)


def load(fid):
    ls = [l.rstrip("\n").split("\t") for l in open(P / f"in/{fid}.tsv", encoding="utf-8")]
    return [x for x in ls[1:] if x and x != [""]]


def run(fid, fn):
    res = []
    for c in load(fid):
        sid, method = c[0], c[5]
        new = fn(sid, method) if fid != "M14-10" else None
        res.append((sid, method, new))
    return res


def write(fid, lines):
    (P / f"out/{fid}.tsv").write_text(HDR + "\n" + "\n".join(lines) + "\n", encoding="utf-8")


def main():
    # F04-02
    L = []
    for sid, method, new in run("F04-02", f0402):
        if not re.search(r"商品登録編集画面", method):
            L.append("\t".join([sid, "直さない", "", "", "", "商品は作らない（商品の登録操作が無い）。既存の商品を使うだけ。"]))
        elif re.search(r"合計が1400円となる額", method):
            L.append("\t".join([sid, "直せない", "", "", "M03-27 L0194〜L0238、M03-02 L0075〜L0077",
                                "CSVの基準価格・販売価格に入れる具体額が決まらない。「販売価格・送料・手数料の合計が1400円となる額」は送料と手数料から逆算するが、このシードにも同じ機能のマスターのシード（S-F04-02-PA-ENV など）にも、このケースが使う配送方法の送料・支払方法の手数料が決まっていない（試験環境の初期データ任せ）。取り込む前に画面で確かめる手順を書いても、決まった額にならない。ケースに影響: ポイント差引前注文金額1400円。"]))
        elif new is None:
            L.append("\t".join([sid, "直せない", "", "", "M03-09 L0059〜L0172（商品規格登録/編集の項目表に販売種別が無い）、M03-27 L0194〜L0238（CSVに販売種別の列が無い）",
                                "ケースの買い物が「宅配便とゆうパックの両方が選べる販売種別」または「先頭の商品種別」の商品を要する。グッズ商品CSVに販売種別の列が無く、設計書の商品規格登録編集画面（M03-09）の項目表にも販売種別が無いので、CSVと編集画面で販売種別を指定する手順を設計書から書けない（実装のProductClassTypeには販売種別の必須項目がある）。ケースに影響: 商品の販売種別を前提にした配送方法の選択。"]))
        else:
            reason = "商品名は元が「ケース専用の名称」だったので「商品コード-商品」とした。"
            reason += "支店の商品公開ステータスは、元が支店非公開と書いていないので既定どおり1（公開）にした。"
            if "合計が1400円" in method:
                reason += "価格は元の指定（合計1400円）のまま。送料・手数料は環境で決まるため具体額を決められない。"
            elif "税込" in method:
                reason += "価格は税込みで登録する仕様なので、元の税込額（1100・550）をそのまま基準価格・販売価格に入れた。"
            elif "販売価格に" not in method:
                reason += "価格は元に指定が無いので基準価格・販売価格1000、買取価格100、原価単価10にした。"
            reason += "CSVで作った商品の販売種別は設計書で確認できない（配送方法の選択肢に響く恐れ）。商品IDを控える手順は元に無いので足さない。在庫は在庫変更CSV登録（M04-21）で100入庫し別メンバーが承認（M04-32）する。承認するメンバーは、このシードにも同じ機能の他のシードにも別の管理者が無いので、試験環境の初期データの承認権限を持つメンバーを使う。"
            L.append("\t".join([sid, "直す", new, "", BASIS_STOCK, reason]))
    # PA-ENV はその場で上書き
    L = [l if not l.startswith("S-F04-02-PA-ENV\t") else "\t".join(["S-F04-02-PA-ENV", "直さない", "", "", "", "商品を作る操作が無い（配送方法と商品種別の確認だけ）。文中の「商品の登録では…」は、これを使う S-F04-02-PA-ORDER-090〜093 が直せないため、そのまま残す。"]) for l in L]
    write("F04-02", L)
    # M05-22
    L = []
    for sid, method, new in run("M05-22", m0522):
        if new == method:
            L.append("\t".join([sid, "直さない", "", "", "", "商品を作る操作が無い。"]))
            continue
        reason = "商品名は元に指定が無い分は「機能ID-番号-商品」の形にした。価格は元に指定が無いので基準価格・販売価格1000、買取価格100、原価単価10にした。支店の商品公開ステータスは元が非公開と書いていないので既定の1（公開）にした。元は商品規格の登録画面で在庫数を入れていたが、規格の画面に在庫数の入力欄が無い（M03-09 L0073・L0074・L0097）ので、在庫変更CSV登録（M04-21）で100入庫し別メンバーが承認（M04-32）する。承認するメンバーは、S-M05-22-ADM のほかに管理者のシードが無いので、試験環境の初期データの承認権限を持つ別のメンバーを使う。注文の配送方法は元と同じく画面で選び、受注側で宅配便に直す手順も元のまま。"
        reason += "CSVで作った商品の販売種別は設計書で確認できない（配送方法の選択肢に響く恐れ）。"
        if sid.endswith("018"):
            reason += "商品の編集は割引率が必須なので販売割引率に登録済みのものを選ぶ。〔商品ID-M0522-018〕はCSV取込後の商品マスター検索で控える。"
        if sid.endswith("019"):
            reason += "31商品は1つのCSVに並べる。"
        L.append("\t".join([sid, "直す", new, "", BASIS_STOCK, reason]))
    write("M05-22", L)
    # M14-10
    L = ["\t".join(["S-M14-10-QL-NAMEORDER-058", "直さない", "", "", "", "商品は元からカード商品CSV登録で作っている。商品登録編集画面は取り込んだ商品の編集（販売制限の選択）にだけ使っている。商品登録画面での新規登録は無い。"])]
    write("M14-10", L)


main()
