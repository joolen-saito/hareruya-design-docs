#!/usr/bin/env python3
"""著者への依頼文を標準出力へ。 mk_gen.py M05-01"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
fid = sys.argv[1]
r = next(r for r in csv.DictReader(open(G / "targets.tsv", encoding="utf-8"), delimiter="\t") if r["機能ID"] == fid)
t = (G / "GEN_GAPFILL_PROMPT.md").read_text(encoding="utf-8")
for k, v in {"{FID}": fid, "{FIDC}": fid.replace("-", ""), "{FNAME}": r["機能名"], "{N}": r["抜けの件数"],
             "{START}": f'{int(r["開始番号"]):03d}', "{UNITS}": "、".join(r["単位"].split(","))}.items():
    t = t.replace(k, v)
print(t)
