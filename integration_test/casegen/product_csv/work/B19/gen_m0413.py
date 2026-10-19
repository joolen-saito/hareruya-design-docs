import re, sys
sys.path.insert(0, ".")
from lib import *

hdr, I = load("M04-13")
O = []
B_CSV = "M03-27 L0092・L0119・L0123・L0124・L0129・L0134・L0192-L0238、M03-02 L0075-L0077"
SEG = re.compile(r"グッズ商品CSV登録画面で、商品IDを空にし、.*?CSVファイルのアップロードボタンを押す。")
ROLE = re.compile(r"（商品コードは他のデータと重ならない任意の値。以下、([^）]+)）")

def parse_seg(seg, num):
    """セグメントから行を作る"""
    rows = []
    if "の1行と、商品コードM0413-JP-049-001" in seg:
        rows.append(dict(code=f"M0413-JOIN-T-{num}", name=f"M0413-JOIN-T-{num}", base=100, buy=10, role="結合対象商品"))
        for k in range(1, 22):
            c = f"M0413-JP-049-{k:03d}"
            rows.append(dict(code=c, name=c, base=100, buy=10))
        return rows
    body = seg.split("商品IDを空にし、", 1)[1]
    body = body.split("とし、そのほかの必須列", 1)[0] if "とし、そのほかの必須列" in body else body
    for it in body.split("／"):
        it = it.strip()
        m = ROLE.search(it)
        if m:
            role = m.group(1)
            suf = role.replace("結合対象商品", "").replace("結合元商品", "")
            kind = "T" if role.startswith("結合対象") else "S"
            c = f"M0413-JOIN-{kind}-{num}{suf}"
            rows.append(dict(code=c, name=c, base=100, buy=10, role=role))
            continue
        m = re.match(r"商品コード(M0413-[A-Z0-9\-]+)(?:・基準価格(\d+))?$", it)
        if not m:
            m = re.match(r"商品コード(M0413-[A-Z0-9\-]+)(?:・基準価格(\d+))?", it)
        assert m, (num, it)
        rows.append(dict(code=m.group(1), name=m.group(1), base=int(m.group(2) or 100), buy=10))
    return rows

for r in I:
    sid, kind, lg, st, use, old, share, cases = r
    num = sid.split("-")[-1]
    num = re.sub(r"\D", "", num)
    new = old
    if "グッズ商品CSV登録画面で" in old:
        segs = SEG.findall(old)
        assert segs, sid
        allrows = []
        def rep(m):
            rows = parse_seg(m.group(0), num)
            allrows.append(rows)
            return csv_sentence(rows) + "。"
        new = SEG.sub(rep, old)
        flat = [x for rr in allrows for x in rr]
        roles = [f"{x['role']}={x['code']}" for x in flat if x.get("role")]
        why = "元はグッズ商品CSV登録画面でそのほかの必須列を「任意の有効な値」にし、確認モーダルでの確定も書いていなかったので、列と値を具体化した（商品名は商品コードと同じ・"
        pr = sorted({x["base"] for x in flat})
        why += "基準価格=販売価格=" + "・".join(str(p) for p in pr) + "・買取価格10・原価単価10・サイズ重量1・日本語・公開・地域別販売制限0・購入グループ名称は既存の名称、カテゴリはサプライ・グッズ）。"
        if roles:
            why += "元は商品コードが「他のデータと重ならない任意の値」だったので、役割ごとにシード専用の商品コードを決めた（" + "・".join(roles) + "）。役割の呼び名はそのまま。"
        why += "在庫は取り込みで数量0の在庫が作られ（M03-27 L0129）、以降の手順で入れる。商品の作り方以外は変えていない。"
        why2 = ("元からグッズ商品CSV登録で商品を作っていて、商品登録画面では作っていないので直さない。気づいた点: CSVのそのほかの必須列が「任意の有効な値」のままで具体的な値が無く、商品コードも「他のデータと重ならない任意の値」とする役割がある。"
                "また「CSVファイルのアップロード」を押したあとの確認モーダルでの確定（M03-27 L0092）が書かれていない。")
        O.append([sid, "直さない", "", "", B_CSV, why2])
    elif sid == "S-M04-13-QE-DETAIL-097":
        pat = re.compile(r"【商品】管理画面の商品登録で、.*?【商品規格】.*?「商品規格を登録」を押す（[^）]*）。")
        assert pat.search(old)
        code, name = "QE0413-001-CODE", "QE0413-001-NAME"
        rows = [dict(code=code, name=name, base=100, buy=1)]
        txt = ("【商品】" + csv_sentence(rows) + "。" + "商品マスター(検索入力)で商品コードに「" + code + "」を入れて「検索する >」を押し、商品マスター(検索結果)の行の商品IDに表示された番号を控える（〔商品ID-M0413-001〕）。")
        new = pat.sub(lambda m: txt, old)
        why = ("元の商品登録は、商品名(英)・購入グループ・サイズ・重量・割引率・カテゴリを任意の有効な値としていたので、商品名(英)は商品名(日)と同じ・サイズ重量1・購入グループ名称は既存の名称・カテゴリはサプライ・グッズにした。"
               "規格の買取価格は「1以下の任意の金額」だったので1にした。販売制限=制限なしは地域別販売制限0。部門はCSVの部門IDが空（連携フラグ0のため必須でない M03-27 L0236-L0237）。"
               "規格の言語=日本語・状態=NMは取り込みで作られる規格のとおり（M03-27 L0124）。規格の公開状態は取り込み時の初期値（公開）のまま変えていない。"
               "商品IDは元は商品一覧で控えていたが、商品マスターの検索結果から控える。")
        O.append([sid, "直す", new, "", B_CSV + "、M03-09 L0155", why])
    elif sid.startswith("S-M04-13-RD-STOCK"):
        pat = re.compile(r"【商品】商品を登録できるメンバーで管理画面にログインし、商品登録画面で商品名に「([^」]+)」ほか必須項目を入れて登録し、続けて商品規格登録画面で、商品コード=([A-Z0-9\-]+)、スマレジ連携フラグ=連携しない、買取価格=100、指定のない基準価格ほか必須項目には任意の値を入れて「商品規格を登録」を押す。登録はM04-13 RD店舗A・M04-13 RD店舗Bが開店中の状態で行う（商品規格の登録と同時に、開店中の店舗ごと・在庫区分ごとに在庫数0・総原価0の在庫が自動で作られる）。")
        found = []
        def rep(m):
            found.append((m.group(1), m.group(2)))
            rows = [dict(code=m.group(2), name=m.group(1), base=100, buy=100)]
            return ("【商品】商品を登録できるメンバーで管理画面にログインし、" + csv_sentence(rows) + "。"
                    "取り込みはM04-13 RD店舗A・M04-13 RD店舗Bが開店中の状態で行う（取り込みで規格が作られると同時に、開店中の店舗ごと・在庫区分ごとに在庫数0・総原価0の在庫が自動で作られる M03-27 L0129）。")
        new = pat.sub(rep, old)
        assert found, sid
        why = ("元は商品名以外の必須項目と基準価格を「任意の値」としていたので、基準価格=販売価格=100（買取価格100に合わせた）・商品名(英)は商品名(日)と同じ・サイズ重量1・日本語・公開・購入グループ名称は既存の名称・カテゴリはサプライ・グッズにした。"
               "スマレジ連携フラグ=連携しないはCSVのスマレジ連携フラグ0。規格の言語・状態は取り込みで作られる日本語・ニアミント（M03-27 L0124）で、元が言語・状態を指定していなかったので変えていない。"
               "「規格の登録と同時に在庫が作られる」の記述は、取り込みで開店中の店舗ごとの在庫が数量0で作られる（M03-27 L0129）ので変えていない。")
        O.append([sid, "直す", new, "", B_CSV, why])
    else:
        raise SystemExit("unhandled " + sid)
assert len(O) == len(I)
save("M04-13", O)
print(len(O))
