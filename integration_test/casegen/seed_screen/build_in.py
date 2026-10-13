#!/usr/bin/env python3
"""投入方法がDBへの直接投入に触れているシード（作り方は確定しているもの）を、機能ごとに書き出す。 build_in.py
in/<機能ID>.tsv（シードID／区分／論理名／状態・属性／用途／投入方法（いま）／共有）、targets.tsv（機能ごとの件数）"""
import csv, glob, pathlib, re
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
DB = re.compile(r"DB投入|DBシード|DBへ|DBで|DBに|DBから|SQL|データベース|フィクスチャ")
UNS = re.compile(r"未確定|未整備")
T = []
for p in sorted(glob.glob(str(CG / "cases/*_seed_data.tsv"))):
    f = pathlib.Path(p).name.split("_")[0]
    R = list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
    rows = [r for r in R if DB.search(r["投入方法"] or "") and not UNS.search(r["投入方法"] or "")]
    if not rows:
        continue
    with open(G / f"in/{f}.tsv", "w", encoding="utf-8", newline="") as o:
        w = csv.writer(o, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法（いま）", "共有"])
        w.writerows([[r[k] for k in ("シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有")] for r in rows])
    T.append((f, len(rows)))
open(G / "targets.tsv", "w", encoding="utf-8").write("機能ID\t件数\n" + "".join(f"{a}\t{b}\n" for a, b in T))
print(len(T), "機能", sum(b for _, b in T), "件", "最大", max(T, key=lambda x: x[1]))
