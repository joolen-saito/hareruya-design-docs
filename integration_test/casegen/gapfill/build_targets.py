#!/usr/bin/env python3
"""抜けを機能ごとに束ねる。 build_targets.py

targets/<機能ID>_gaps.tsv  その機能のケースにする抜け（指摘ID/単位/シート名/行/記述/1巡目の判定/既存テストID/理由/codexの根拠）
targets.tsv                機能ごとの件数・開始番号（既存の連番の続き。保留で除外したケース・付け替えたケースの番号も避ける）・読む単位
unassigned.tsv             どの機能にも割り当たらなかった抜け
"""
import csv, glob, pathlib, re, collections
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
ROOT = CG.parents[1]
csv.field_size_limit(10**9)
def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
R = rd(CG / "coverage_audit/confirmed_gaps.tsv")
asg = {}
for p in sorted(glob.glob(str(G / "assign/*_out.tsv")), key=lambda x: ("overrides" in x, x)):
    for r in rd(p):
        asg[r["指摘ID"].strip()] = r["機能ID"].strip()
names = {}
for l in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
    c = [x.strip() for x in l.split("|")]
    if len(c) > 7 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[5]):
        names[c[5]] = c[4]
used = collections.defaultdict(int)
def note(t):
    m = re.fullmatch(r"IT-([A-Z]\d\d-\d\d)-(\d{3})", t)
    if m:
        used[m.group(1)] = max(used[m.group(1)], int(m.group(2)))
for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
    for l in open(p, encoding="utf-8"):
        note(l.split("\t")[0])
for r in rd(CG / "excluded_hold_cases.tsv"):
    note(r["テストID"]); note(r.get("元_テストID", ""))
for r in rd(CG / "precond/moved_cases.tsv"):
    note(r["旧テストID"]); note(r["新テストID"])
gf = set()   # 以前の実行で足した分は開始番号に数えない（何度流しても同じ開始番号）
if (G / "gf_map.tsv").exists():
    gf = {r["テストID"] for r in rd(G / "gf_map.tsv")}
    used = collections.defaultdict(int)
    for p in glob.glob(str(CG / "cases/*_test_cases.tsv")):
        for l in open(p, encoding="utf-8"):
            t = l.split("\t")[0]
            if t not in gf:
                note(t)
    for r in rd(CG / "excluded_hold_cases.tsv"):
        note(r["テストID"]); note(r.get("元_テストID", ""))
    for r in rd(CG / "precond/moved_cases.tsv"):
        note(r["旧テストID"]); note(r["新テストID"])
by, un = collections.defaultdict(list), []
for r in R:
    f = r["機能"] if r["機能"] and "," not in r["機能"] else asg.get(r["指摘ID"], "")
    if not re.fullmatch(r"[A-Z]\d\d-\d\d", f) or not (CG / f"cases/{f}_test_cases.tsv").exists():
        un.append([r["指摘ID"], r["単位"], r["シート名"], r["行"], r["記述"], f or "未割当"])
        continue
    by[f].append(r)
H = ["指摘ID", "単位", "シート名", "行", "記述", "1巡目の判定", "既存テストID", "理由", "codexの根拠"]
def wr(p, head, rows):
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(head); w.writerows(rows)
T = []
for f in sorted(by):
    wr(G / f"targets/{f}_gaps.tsv", H, [[r["指摘ID"], r["単位"], r["シート名"], r["行"], r["記述"], r["判定"], r["テストID"], r["理由"], r["2巡目の根拠"]] for r in by[f]])
    T.append([f, names.get(f, ""), len(by[f]), used[f] + 1, ",".join(dict.fromkeys(r["単位"] for r in by[f]))])
wr(G / "targets.tsv", ["機能ID", "機能名", "抜けの件数", "開始番号", "単位"], T)
wr(G / "unassigned.tsv", ["指摘ID", "単位", "シート名", "行", "記述", "割当"], un)
print(len(T), "機能", sum(t[2] for t in T), "件 / 未割当", len(un))
