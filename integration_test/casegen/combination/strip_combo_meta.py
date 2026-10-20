#!/usr/bin/env python3
"""ケースの事前準備に足された「組の値を並べただけの項目」（【組の値: …】・この組の値: …・このケースで試す値の組: …）を外し、残りの丸数字を①から振り直す。
strip_combo_meta.py [ファイル...]（既定は cases/*_cb_test_cases*.tsv）。著者が verify の「注意」を消すために足したもので、テストの手順ではない（2026-10-20）。
手順・期待結果・出典が丸数字で事前準備を指しているファイルは振り直さずに止める。"""
import glob, re, sys, pathlib
NUM = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
META = re.compile(r"^\s*[①-⑳]\s*(【?組の値|この組の値|このケースで試す値の組)")
files = sys.argv[1:] or sorted(glob.glob(str(pathlib.Path(__file__).parent / "cases/*_cb_test_cases*.tsv")))
for f in files:
    p = pathlib.Path(f)
    lines = p.read_text(encoding="utf-8").split("\n")
    head = lines[0].split("\t")
    ix = {k: head.index(k) for k in ("事前準備", "手順", "期待結果", "出典")}
    n = 0
    for i in range(1, len(lines)):
        if not lines[i]:
            continue
        c = lines[i].split("\t")
        items = c[ix["事前準備"]].split("／")
        keep = [it for it in items if not META.match(it)]
        if len(keep) == len(items):
            continue
        if any(re.search(r"[①-⑳]", c[ix[k]]) for k in ("手順", "期待結果", "出典")):
            sys.exit(f"{p.name} {c[0]}: 手順・期待結果・出典が丸数字で事前準備を指している。手で直す")
        k = 0
        out = []
        for it in keep:
            m = re.match(r"^(\s*)([①-⑳])", it)
            if m:
                it = m.group(1) + NUM[k] + it[m.end():]
                k += 1
            out.append(it)
        c[ix["事前準備"]] = "／".join(out)
        lines[i] = "\t".join(c)
        n += 1
    if n:
        p.write_text("\n".join(lines), encoding="utf-8")
        print(p.name, n)
