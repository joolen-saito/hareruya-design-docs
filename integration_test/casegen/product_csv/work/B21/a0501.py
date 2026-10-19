from common import *
import re
R, ids = load("A05-01")
out = []
pat = re.compile(r"商品登録画面と商品規格登録画面で、商品「([^」]+)」(?:（販売価格は税込(\d+)円）)?を登録する。")
BASIS = "M03-27 L0092・L0119・L0124・L0129・L0134・L0151・L0225〜L0229、M03-02 L0075〜L0077"
for sid in ids:
    r = R[sid]; old = r[5]
    if not pat.search(old):
        out.append([sid, "直さない", "", "", "", "投入方法に商品を新しく作る操作が無い（「この店舗の商品を登録せず」と書いてある）"])
        continue
    def rep(m):
        name = m.group(1); price = int(m.group(2) or 1000)
        code = name.replace("検証商品", "")
        return csv_up([row(code, name, name, base=price, buy=100)])
    new = pat.sub(rep, old)
    why = ""
    if "税込1500円" in old:
        why = "元の「販売価格は税込1500円」は、CSVの基準価格・販売価格を1500にして表した（税込か税抜かは元のシードのまま。ケースが合計金額1500を確かめるので、取り込み後の販売価格の扱いが合うかは実機で確認が要る）。"
    out.append([sid, "直す", new, "", BASIS, why])
save("A05-01", out)
print(sum(1 for o in out if o[1]=="直す"), len(out))
