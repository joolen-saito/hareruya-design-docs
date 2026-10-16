#!/usr/bin/env python3
"""targets.tsv の機能ごとに units/<機能ID>/gen_prompt.md（著者への依頼文）を作る。 mk_gen.py [機能ID...]"""
import csv, pathlib, re, sys

P = pathlib.Path(__file__).resolve().parent
tpl = (P / "GEN_PROMPT.md").read_text(encoding="utf-8")
want = set(sys.argv[1:])
n = 0
for t in csv.DictReader((P / "targets.tsv").open(encoding="utf-8"), delimiter="\t"):
    f = t["機能ID"]
    if want and f not in want:
        continue
    s = (tpl.replace("{FID}", f).replace("{FNAME}", t["機能名"]).replace("{N}", t["抜けの件数"])
         .replace("{START}", t["開始番号"]).replace("{FIDC}", f.replace("-", "")).replace("{FIDL}", f.replace("-", "").lower()))
    assert not re.search(r"\{[A-Z]+\}", s), f
    (P / "units" / f / "gen_prompt.md").write_text(s, encoding="utf-8")
    n += 1
print(n, "本")
