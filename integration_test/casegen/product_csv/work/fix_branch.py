#!/usr/bin/env python3
"""支店の商品公開ステータスを、ee の初期値（公開）にそろえる。 work/fix_branch.py

ee の商品の「支店の商品公開ステータス」の初期値は公開（src/Eccube/Entity/Product.php の is_branch_published default true）。
元のシードが指定していなければ、元は商品登録画面の初期値（公開）で作っていた。担当によって CSV を0（非公開）にした行があるので、
「直す」の行のうち、元の投入方法が支店の非公開を書いていないものだけ、新しい投入方法の「支店の商品公開ステータスは0（非公開）」を
「支店の商品公開ステータスは1（公開）」に直し、理由の欄に書き足す。何度流しても同じ。
"""
import glob, pathlib, re

P = pathlib.Path(__file__).resolve().parents[1]
OLD, NEW = "支店の商品公開ステータスは0（非公開）", "支店の商品公開ステータスは1（公開）"
NOTE = "支店の商品公開ステータスは、元が指定していないので ee の初期値（公開）にそろえた（work/fix_branch.py）"
SAYS = re.compile(r"支店[^。]{0,20}非公開|支店の商品公開ステータス[^。]{0,10}非公開")


def main():
    src = {}
    for p in glob.glob(str(P / "in/*.tsv")):
        fid = pathlib.Path(p).stem
        for l in list(open(p, encoding="utf-8"))[1:]:
            c = l.rstrip("\n").split("\t")
            src[(fid, c[0])] = c[5]
    total = 0
    for p in sorted(glob.glob(str(P / "out/*.tsv"))):
        fid = pathlib.Path(p).stem
        ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
        n = 0
        for r in ls[1:]:
            if len(r) < 6 or r[1] != "直す" or OLD not in r[2] or SAYS.search(src[(fid, r[0])]):
                continue
            r[2] = r[2].replace(OLD, NEW)
            if NOTE not in r[5]:
                r[5] = (r[5] + "。" if r[5] else "") + NOTE
            n += 1
        if n:
            pathlib.Path(p).write_text("".join("\t".join(r) + "\n" for r in ls), encoding="utf-8")
            print(fid, n)
            total += n
    print("直した", total, "行")


if __name__ == "__main__":
    main()
