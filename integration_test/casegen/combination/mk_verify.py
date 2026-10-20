#!/usr/bin/env python3
"""要因表の codex 反証の束を作る。 mk_verify.py <束の接頭辞> [機能ID...] → review/<接頭辞>_bundles.tsv・review/<接頭辞>_<nn>_prompt.md

機能IDを書かないときは、要因表のある機能のうち試行の2機能（F04-02・M05-11）を除く全部。
1束の分量（設計書の行数＋要因表の行数×5）が BUDGET を超えない範囲で、最大 MAXN 機能まで機能IDの順に束ねる。
"""
import csv, glob, os, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
BUDGET, MAXN = 3000, 12
pre = sys.argv[1]
fids = sys.argv[2:] or sorted({pathlib.Path(p).name.split("_")[0] for p in glob.glob(str(G / "factors/*_factors.tsv"))} - {"F04-02", "M05-11"})
U = {r["機能ID"]: int(r["行数"]) for r in csv.DictReader(open(G / "units.tsv", encoding="utf-8"), delimiter="\t")}
def n(p):
    return max(0, sum(1 for _ in open(p, encoding="utf-8")) - 1) if p.exists() else 0
out, cur, w = [], [], 0
for f in fids:
    x = U.get(f, 0) + 5 * sum(n(G / f"factors/{f}_{k}.tsv") for k in ("processes", "factors", "interactions", "constraints", "existing"))
    if cur and (w + x > BUDGET or len(cur) >= MAXN):
        out.append((cur, w)); cur, w = [], 0
    cur.append(f); w += x
if cur:
    out.append((cur, w))
tpl = (G / os.environ.get("VERIFY_TPL", "VERIFY_PROMPT.md")).read_text(encoding="utf-8")   # 機能設計書を足した分は VERIFY_MD_PROMPT.md
with open(G / f"review/{pre}_bundles.tsv", "w", encoding="utf-8") as fp:
    fp.write("束\t機能ID\t分量\n")
    for i, (c, w) in enumerate(out, 1):
        name = f"{pre}_{i:02d}"
        fp.write(f"{name}\t{'・'.join(c)}\t{w}\n")
        (G / f"review/{name}_prompt.md").write_text(tpl.replace("{FIDS}", "・".join(c)), encoding="utf-8")
print(len(out), "束", sum(len(c) for c, _ in out), "機能")
