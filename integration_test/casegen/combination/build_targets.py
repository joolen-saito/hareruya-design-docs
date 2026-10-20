#!/usr/bin/env python3
"""機械が並べた組（combos/<機能ID>.tsv）の数と、ケースの開始番号を機能ごとに出す。 build_targets.py → targets.tsv

開始番号は既存の連番の続き（テストから外した番号・移した番号・合流後に消した番号も避ける）。以前この作業で足した分（cb_map.tsv）は数えない。
標準機能（functions/todo-list.md の区分が「標準」）は結合テストケース不要の決定（2026-10-06）により外す。
"""
import csv, glob, pathlib, re, collections

P = pathlib.Path(__file__).resolve().parent
CG = P.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)


def rd(p):
    with open(p, encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))


cat = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.split("|")]
    if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
        cat[c[5]] = c[6]
names = {r["機能ID"]: r["機能名"] for r in rd(P / "units.tsv")}
mine = {r["テストID"] for r in rd(P / "cb_map.tsv")} if (P / "cb_map.tsv").exists() else set()
used = collections.defaultdict(int)


def note(t):
    m = re.fullmatch(r"IT-([A-Z]\d\d-\d\d)-(\d{3})", t or "")
    if m and t not in mine:
        used[m.group(1)] = max(used[m.group(1)], int(m.group(2)))


for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
    for l in open(p, encoding="utf-8"):
        note(l.split("\t")[0])
for fn in ("excluded_hold_cases.tsv", "excluded_open_cases.tsv", "excluded_scope_cases.tsv"):
    for r in rd(CG / fn):
        note(r["テストID"]); note(r.get("元_テストID", ""))
for r in rd(CG / "precond/moved_cases.tsv"):
    note(r["旧テストID"]); note(r["新テストID"])
for r in rd(CG / "link_pub/merged_gone.tsv"):
    note(r["新テストID"])
T = []
for p in sorted(glob.glob(str(P / "combos/[A-Z][0-9][0-9]-[0-9][0-9].tsv"))):
    f = pathlib.Path(p).stem
    if cat.get(f) == "標準":
        continue
    n = len(rd(pathlib.Path(p)))
    T.append([f, names.get(f, ""), n, f"{used[f] + 1:03d}"])
with open(P / "targets.tsv", "w", encoding="utf-8", newline="") as fp:
    fp.write("機能ID\t機能名\t組の数\t開始番号\n")
    for x in T:
        fp.write("\t".join(map(str, x)) + "\n")
print(len(T), "機能", sum(x[2] for x in T), "組")
