#!/usr/bin/env python3
"""全機能のテストデータ識別子の台帳 ident_registry.tsv を作る。著者が改名先の重なりを避けるために読む。

書き直し済みの機能はケース専用シードの識別子、未着手の機能は基線シードの全識別子を載せる。
"""
import csv, glob, pathlib, sys

PC = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(PC))
from gate_precond import idents, read  # noqa: E402

rows = set()
for p in sorted(glob.glob(str(PC.parent / "cases/*_seed_data.tsv"))):
    fid = pathlib.Path(p).name.split("_")[0]
    for r in read(p):
        if "共有" in r and r["共有"].strip() != "ケース専用":
            continue
        for t in idents(r.get("状態・属性", "")):
            rows.add((t, fid, r["シードID"]))
with open(PC / "ident_registry.tsv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t", lineterminator="\n")
    w.writerow(["識別子", "機能", "シードID"])
    w.writerows(sorted(rows))
print(len(rows))
