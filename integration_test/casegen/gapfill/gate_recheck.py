#!/usr/bin/env python3
"""再監査の検査と集計。 gate_recheck.py [機能ID...]   引数なしは全機能を検査し recheck_all.tsv を書く

対象（扱いが ケース化／既存ケースで確認済み の抜け）がすべて1行ずつ判定されていること、判定が3種のいずれかであること、
テストIDが実在すること、「一部」「埋まっていない」に理由があること。
"""
import csv, pathlib, re, sys, collections
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
csv.field_size_limit(10**9)
def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
T = [r["機能ID"] for r in rd(G / "targets.tsv")]
V = {"埋まった", "一部", "埋まっていない"}
bad, allr, tot = 0, [], collections.Counter()
for fid in (sys.argv[1:] or T):
    D = {r["指摘ID"]: r for r in rd(G / f"cases/{fid}_gf_dispositions.tsv") if r["扱い"] in ("ケース化", "既存ケースで確認済み")}
    if not D:
        continue
    p = G / f"recheck/{fid}.tsv"
    if not p.exists():
        print(f"{fid}: 未判定"); bad += 1; continue
    live = {l.split("\t", 1)[0] for l in open(CG / f"cases/{fid}_test_cases.tsv", encoding="utf-8")}
    gaps = {r["指摘ID"]: r for r in rd(G / f"targets/{fid}_gaps.tsv")}
    err, seen = [], collections.Counter()
    for r in rd(p):
        g = (r.get("指摘ID") or "").strip()
        seen[g] += 1
        if g not in D:
            err.append(f"{g}: 対象でない指摘ID"); continue
        v = (r.get("判定") or "").strip()
        if v not in V:
            err.append(f"{g}: 判定 {v!r}")
        ids = [t for t in re.split(r"[,、\s]+", r.get("テストID") or "") if t]
        if not ids or any(t not in live for t in ids):
            err.append(f"{g}: テストIDが無い・実在しない {ids}")
        if v != "埋まった" and not (r.get("理由") or "").strip():
            err.append(f"{g}: 理由が無い")
        allr.append([g, fid, gaps[g]["単位"], gaps[g]["シート名"], gaps[g]["行"], gaps[g]["記述"], v, ",".join(ids), (r.get("理由") or "").strip()])
        tot[v] += 1
    for g in D:
        if seen[g] != 1:
            err.append(f"{g}: {seen[g]}行（1行であること）")
    if err:
        bad += 1
        print(f"{fid}: 不合格 {len(err)}"); [print("   ", e) for e in err[:20]]
if not sys.argv[1:]:
    with open(G / "recheck_all.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(["指摘ID", "機能ID", "単位", "シート名", "行", "記述", "判定", "テストID", "理由"]); w.writerows(allr)
    print(dict(tot))
print(f"不合格 {bad}")
sys.exit(1 if bad else 0)
