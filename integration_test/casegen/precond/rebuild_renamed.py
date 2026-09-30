#!/usr/bin/env python3
"""改名の当て方（gate_precond.apply）を変えたときに、全機能の手順・期待結果を基線から作り直す。

期待結果: oracle_changes に無いケースは「基線＋改名」。
手順: step_changes に無いケース、または種別が「改名」だけのケースは「基線＋改名」（改名だけのものは step_changes も更新）。
"""
import csv, glob, os, pathlib, sys
PC = pathlib.Path(__file__).resolve().parent
CG = PC.parent
sys.path.insert(0, str(PC))
from gate_precond import apply, read, renames, step_changes, oracle_changes  # noqa: E402


def write(p, hdr, rows):
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(hdr); w.writerows(rows)


tot = {"期待結果": 0, "手順": 0}
for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
    fid = os.path.basename(p).split("_")[0]
    bp = PC / f"baseline/{fid}_test_cases.tsv"
    if not bp.exists():
        continue
    B = {r["テストID"]: r for r in read(bp)}
    C = read(p); hdr = list(C[0].keys()) if C else []
    rn, sc, oc = renames(fid), step_changes(fid), oracle_changes(fid)
    changed = False
    for x in C:
        b = B.get(x["テストID"])
        if not b or b["実行区分"] == "保留":
            continue
        pairs = rn.get(x["テストID"], [])
        if x["テストID"] not in oc:
            e = apply(b["期待結果"], pairs)
            if e != x["期待結果"]:
                x["期待結果"] = e; tot["期待結果"] += 1; changed = True
        s = sc.get(x["テストID"])
        if not s or s.get("種別", "").strip() == "改名":
            st = apply(b["手順"], pairs)
            if st != x["手順"]:
                x["手順"] = st; tot["手順"] += 1; changed = True
            if s:
                s["新手順"] = st
    if changed:
        write(p, hdr, ([r[h] for h in hdr] for r in C))
        print(fid, "更新")
    if sc:
        sp = PC / f"step_changes/{fid}.tsv"
        rows = read(sp); sh = list(rows[0].keys())
        for r in rows:
            if r["テストID"] in sc:
                r["新手順"] = sc[r["テストID"]]["新手順"]
        write(sp, sh, ([r[h] for h in sh] for r in rows))
print(tot)
