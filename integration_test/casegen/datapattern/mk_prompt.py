#!/usr/bin/env python3
"""units.tsv の機能ごとに units/<機能ID>/prompt.md（監査の依頼文）を作る。 mk_prompt.py [機能ID...]"""
import csv, pathlib, sys

P = pathlib.Path(__file__).resolve().parent
tpl = (P / "AUDIT_PROMPT.md").read_text(encoding="utf-8")
want = set(sys.argv[1:])
n = 0
for u in csv.DictReader((P / "units.tsv").open(encoding="utf-8"), delimiter="\t"):
    if want and u["機能ID"] not in want:
        continue
    com = "、".join("`integration_test/casegen/datapattern/units/_common/{}`（{}".format(*c.split("（", 1))
                   for c in u["共通シート"].split("・") if c) or "（無し）"
    s = tpl.replace("{FID}", u["機能ID"]).replace("{FNAME}", u["機能名"]).replace("{COMMON}", com)
    assert "{" not in s.replace("{}", ""), u["機能ID"]
    (P / "units" / u["機能ID"] / "prompt.md").write_text(s, encoding="utf-8")
    n += 1
print(f"{n} 本")
