#!/usr/bin/env python3
"""要因表づくりの担当の束を作る。 build_batches.py → batches.tsv（束ID・機能ID（・区切り）・分量）

分量は 設計書の行数 + ケース数×3。機能IDの順に、1束の分量が BUDGET を超えない範囲で最大 MAXN 機能まで束ねる。
標準機能（functions/todo-list.md の区分が「標準」）と、要因表のある機能（factors/<機能ID>_factors.tsv）は外す。
"""
import csv, pathlib, re
G = pathlib.Path(__file__).resolve().parent
ROOT = G.parents[2]
BUDGET, MAXN = 950, 6
cat = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.split("|")]
    if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
        cat[c[5]] = c[6]
U = [u for u in csv.DictReader(open(G / "units.tsv", encoding="utf-8"), delimiter="\t")
     if cat.get(u["機能ID"]) != "標準" and not (G / f"factors/{u['機能ID']}_factors.tsv").exists()]
out, cur, w = [], [], 0
for u in U:
    x = int(u["行数"]) + int(u["ケース数"]) * 3
    if cur and (w + x > BUDGET or len(cur) >= MAXN):
        out.append((cur, w)); cur, w = [], 0
    cur.append(u["機能ID"]); w += x
if cur:
    out.append((cur, w))
with open(G / "batches.tsv", "w", encoding="utf-8") as f:
    f.write("束ID\t機能ID\t分量\n")
    for i, (c, w) in enumerate(out, 1):
        f.write(f"FB{i:03d}\t{'・'.join(c)}\t{w}\n")
print(len(out), "束", sum(len(c) for c, _ in out), "機能")
