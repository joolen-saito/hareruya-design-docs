#!/usr/bin/env python3
"""単体レベルの判定表（judg/*.tsv）の機械検査。 gate_judg.py [束...]
形式（見出し・3列・区分）、テストIDの実在と機能、重なり、外さないケース（protected.tsv）を外していない、束の全機能に表がある。"""
import csv, pathlib, sys, collections
D = pathlib.Path(__file__).resolve().parent
CG = D.parent
H = ["外すテストID", "区分", "理由"]
KINDS = {"入力チェック", "書式・変換", "計算", "一致条件・並び順", "サニタイズ"}
rd = lambda p: list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))
ids = {l.split("\t", 1)[0] for p in CG.glob("cases/*_test_cases.tsv") for l in list(open(p, encoding="utf-8"))[1:]}
prot = {r["テストID"] for r in rd(D / "protected.tsv")}
B = {r["束"]: r["機能ID"].split(",") for r in rd(D / "batches.tsv")}
names = [f for b in sys.argv[1:] for f in B[b]] if sys.argv[1:] else sorted(p.stem for p in (D / "judg").glob("*.tsv"))
err, rows = [], []
for n in names:
    p = D / f"judg/{n}.tsv"
    if not p.exists():
        err.append((n, "表が無い")); continue
    raw = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8") if l.strip()]
    if not raw or raw[0] != H:
        err.append((n, f"見出しが違う: {raw[0] if raw else '空'}")); continue
    for k, r in enumerate(raw[1:], 2):
        if len(r) != 3:
            err.append((n, f"{k}行目: 列が{len(r)}")); continue
        rows.append((n, k, r))
cnt = collections.Counter(r[0] for _, _, r in rows)
for n, k, (a, kind, why) in rows:
    w = f"{n}:{k} {a}"
    if a not in ids: err.append((w, "テストIDが無い"))
    if a[3:9] != n: err.append((w, "別の機能のケース"))
    if kind not in KINDS: err.append((w, f"区分が不正: {kind}"))
    if cnt[a] > 1: err.append((w, "重なる"))
    if a in prot: err.append((w, "外さないケース（E2E・Playwright）を外している"))
    if not why.strip(): err.append((w, "理由が無い"))
for e in err:
    print("NG", *e, sep="\t")
print(f"表 {len(names)}・外す {len(rows)} {dict(collections.Counter(r[1] for _, _, r in rows))}・NG {len(err)}")
sys.exit(1 if err else 0)
