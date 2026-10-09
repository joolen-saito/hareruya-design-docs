#!/usr/bin/env python3
"""単位の依頼文を標準出力へ。 mk_prompt.py 0203_sheet-24"""
import csv, pathlib, sys
A = pathlib.Path(__file__).resolve().parent
u = sys.argv[1]
b, sid = u.split("_")
r = next(r for r in csv.DictReader(open(A / "units.tsv", encoding="utf-8"), delimiter="\t") if r["書番"] == b and r["シートID"] == sid)
t = (A / "AUDIT_PROMPT.md").read_text(encoding="utf-8")
print(t.replace("{UNIT}", u).replace("{BOOK}", b).replace("{SID}", sid).replace("{NAME}", r["シート名"]).replace("{FIDS}", r["機能"] or "なし（対応する機能が無いシート）"))
