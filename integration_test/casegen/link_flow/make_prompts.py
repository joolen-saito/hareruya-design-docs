#!/usr/bin/env python3
"""groups.tsv の群ごとに gen_<群>/prompt.md を作る（link_pub/make_prompts.py と同じ）。"""
import csv, pathlib
P = pathlib.Path(__file__).resolve().parent
tpl = (P / "PROMPT_TEMPLATE.md").read_text(encoding="utf-8")
for g in csv.DictReader((P / "groups.tsv").open(encoding="utf-8"), delimiter="\t"):
    d = P / f"gen_{g['群']}"
    d.mkdir(exist_ok=True)
    s = (tpl.replace("{CODE}", g["群"]).replace("{DIRECTION}", g["方向"]).replace("{JUDGES}", g["判定ID"])
         .replace("{UPSTREAM}", g["上流機能"]).replace("{CANDIDATES}", g["下流候補"]).replace("{HINT}", g["手がかり"]))
    assert "{" not in s.replace("{{", ""), g["群"]
    (d / "prompt.md").write_text(s, encoding="utf-8")
    print(g["群"], d / "prompt.md")
