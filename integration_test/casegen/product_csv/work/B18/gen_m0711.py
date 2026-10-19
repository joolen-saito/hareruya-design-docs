import re, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from lib import *

FID = "M07-11"
hdr, rows = read_in(FID)
PAIR = re.compile(
    r"管理画面の商品登録画面で商品名に(?:「(?P<name>[^」]+)」|任意の値)を入れ、そのほかの必須項目に任意の有効な値を入れて「商品を登録」を押す。"
    r"その商品の商品規格登録画面で商品コードに「(?P<code>[^」]+)」、基準価格\(円\)に「(?P<base>\d+)」(?:、買取価格\(円\)に「(?P<buy>\d+)」)?"
    r"を入れ、言語・状態などそのほかの必須項目に任意の有効な値を入れて「商品規格を登録」を押す。")
REPEAT = re.compile(r"この商品登録と商品規格登録を、商品名「(?P<n1>[^」]+)」〜「(?P<n2>[^」]+)」・商品コード「(?P<c1>[^」]+)」〜「(?P<c2>[^」]+)」"
                    r"の末尾の番号をそろえて(?P<n>\d+)件ぶんくり返す（基準価格\(円\)はすべて「4200」）。")
BASIS = "M03-27 L0092・L0119・L0124・L0129・L0134・L0194-L0238、M03-02 L0075〜L0077"
NAMEFIX = {"012": {"M0711-012-PX": "M0711-012-商品X", "M0711-012-PY": "M0711-012-商品Y", "M0711-012-PZ": "M0711-012-商品Z"}}

out = []
for r in rows:
    sid, kind, lab, attr, use, how, share, cases = r
    n = sid[-3:]
    pairs = list(PAIR.finditer(how))
    rep = REPEAT.search(how)
    assert pairs, sid
    ps = []
    for m in pairs:
        code = m.group("code")
        name = m.group("name") or NAMEFIX[n][code]
        buy = int(m.group("buy")) if m.group("buy") else 1000
        ps.append(prod(code, name=name, base=int(m.group("base")), buy=buy))
    if rep:
        k = int(rep.group("n"))
        assert len(ps) == 1
        base_name, base_code = ps[0]["name"], ps[0]["code"]
        w = len(re.search(r"(\d+)$", rep.group("c1")).group(1))
        for i in range(2, k + 1):
            suf = f"{i:0{w}d}"
            ps.append(prod(re.sub(r"\d+$", suf, base_code), name=re.sub(r"\d+$", suf, base_name), base=4200, buy=1000))
        assert ps[-1]["code"] == rep.group("c2"), (ps[-1]["code"], rep.group("c2"))
        assert ps[-1]["name"] == rep.group("n2"), (ps[-1]["name"], rep.group("n2"))
    block = csv_clause(ps) + "グッズ商品は状態ニアミント・日本語の規格が1件作られる。"
    new = how
    for i, m in enumerate(pairs):
        new = new.replace(m.group(0), block if i == 0 else "", 1)
    if rep:
        new = new.replace(rep.group(0), "", 1)
    reasons = [
        "元は規格の基準価格だけを指定していたので、基準価格と販売価格を同額（元の基準価格）にした。"
        + ("買取価格は元の値（1800）" if any(p["buy"] == 1800 for p in ps) else
           "買取価格は元に指定が無いので、買取明細の買取価格（DBへ直接設定する値）と違う1000にした（買取価格は販売価格を上回れない M03-27 L0119）"),
        "サイズ1・重量1・購入グループは既存の購入グループ・原価単価10は元に指定が無い仮の値で、このケースでは使わない。支店の商品公開ステータスは元に指定が無く画面の初期値（公開）だったので1（公開）にした",
        "取り込みで作られる規格は日本語・ニアミント。元が言語・状態を任意の値にしていたので、規格の画面での編集（部門・公開ステータス）は、買取履歴の検索・CSV出力に使わないため足していない",
    ]
    if n == "012":
        reasons.append("元は商品名を任意の値としていたので、CSVの必須列は商品コードの末尾（PX・PY・PZ）を使った名前にした")
    out.append([sid, "直す", new, "", BASIS, "。".join(reasons)])
write_out(FID, out)
print(len(out))
