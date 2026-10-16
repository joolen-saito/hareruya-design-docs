#!/usr/bin/env python3
"""groups.tsv の群ごとに gen_<群>/prompt.md を作る（連鎖の表は ../chains.tsv から引く）。"""
import csv, pathlib
P = pathlib.Path(__file__).resolve().parent
tpl = (P / "PROMPT_TEMPLATE.md").read_text(encoding="utf-8")
ch = {r["連鎖ID"]: r for r in csv.DictReader((P.parent / "chains.tsv").open(encoding="utf-8"), delimiter="\t")}
for g in csv.DictReader((P / "groups.tsv").open(encoding="utf-8"), delimiter="\t"):
    rows = ["| 連鎖ID | 遷移元機能 | 遷移先画面 | 遷移先機能 | 契機 | 出典 | 根拠状態 |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for c in g["連鎖ID"].split(","):
        r = ch[c]
        rows.append("| " + " | ".join(r[k].replace("|", "／") or "（空）" for k in ("連鎖ID", "遷移元機能", "遷移先画面", "遷移先機能", "契機", "出典", "根拠状態")) + " |")
    d = P / f"gen_{g['群']}"
    d.mkdir(exist_ok=True)
    s = tpl.replace("{CODE}", g["群"]).replace("{CHAINS}", "\n".join(rows)).replace("{HINT}", g["手がかり"])
    assert "{" not in s, g["群"]
    (d / "prompt.md").write_text(s, encoding="utf-8")
    print(g["群"], d / "prompt.md")
