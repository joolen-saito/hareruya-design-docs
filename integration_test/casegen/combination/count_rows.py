#!/usr/bin/env python3
"""全機能の要因表を gate に通し、組の数を数える。 count_rows.py [出力TSV]（既定 review/rows_after_fix.tsv）

gate_factors.py を機能ごとに流し（合格すると combos/ を作り直す）、combos/<機能ID>.tsv の行の数（＝ケースにする組の数）、
処理・要因の数、設計書から結果が決まらない組（_undetermined.tsv）の数を書く。直す前の数 review/rows_before_fix.tsv と並べる。
"""
import csv, glob, pathlib, subprocess, sys

G = pathlib.Path(__file__).resolve().parent
csv.field_size_limit(10**9)


def n(p):
    return max(0, sum(1 for _ in open(p, encoding="utf-8")) - 1) if p.exists() else 0


out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else G / "review/rows_after_fix.tsv"
before = {r["機能ID"]: r["組の数"] for r in csv.DictReader(open(G / "review/rows_before_fix.tsv", encoding="utf-8"), delimiter="\t")}
fids = sorted({pathlib.Path(p).name.split("_")[0] for p in glob.glob(str(G / "factors/*_processes.tsv"))})
rows, ng = [], []
for f in fids:
    r = subprocess.run([sys.executable, str(G / "gate_factors.py"), f], capture_output=True, text=True)
    ok = r.returncode == 0 and "合格" in r.stdout
    if not ok:
        ng.append(f)
    rows.append([f, "合格" if ok else "不合格", n(G / f"factors/{f}_processes.tsv"), n(G / f"factors/{f}_factors.tsv"),
                 before.get(f, ""), n(G / f"combos/{f}.tsv"), n(G / f"combos/{f}_undetermined.tsv")])
with open(out, "w", encoding="utf-8", newline="") as fp:
    w = csv.writer(fp, delimiter="\t", lineterminator="\n")
    w.writerow(["機能ID", "gate", "処理", "要因", "組の数（直す前）", "組の数", "結果が決まらない組"])
    w.writerows(rows)
tot = sum(r[5] for r in rows)
tb = sum(int(r[4]) for r in rows if r[4] != "")
print(f"機能 {len(rows)}・不合格 {len(ng)} {' '.join(ng)}")
print(f"組 {tb} → {tot}・組のある機能 {sum(1 for r in rows if r[5])}・組0の機能 {sum(1 for r in rows if not r[5])}"
      f"・結果が決まらない組 {sum(r[6] for r in rows)}")
