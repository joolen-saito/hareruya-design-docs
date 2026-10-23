#!/usr/bin/env python3
"""codex の事実確認（review/V_*_out.txt）を集め、採る行を adopted.tsv、戻す行を returned.tsv に書く。 collect_verify.py
判定が無い行・読めない出力は「未確認」として止める（adopted には入れない）。
adopted.tsv が ../exclude_ut.py の入力になる。"""
import csv, pathlib, re, sys
D = pathlib.Path(__file__).resolve().parent
H = ["外すテストID", "区分", "理由"]
adopted, returned, missing = [], [], []
for t in sorted((D / "review").glob("V_*_targets.tsv")):
    name = t.name[:4]
    rows = [l.rstrip("\n").split("\t") for l in open(t, encoding="utf-8")][1:]
    o = D / f"review/{name}_out.txt"
    text = o.read_text(encoding="utf-8", errors="ignore") if o.exists() else ""
    blocks = re.findall(r"===BEGIN===\s*\n(.*?)\n===END===", text, re.S)
    verdict = {}
    if blocks:
        for l in blocks[-1].splitlines():
            c = l.split("\t")
            if len(c) >= 2 and c[0].startswith("IT-"):
                verdict[c[0].strip()] = (c[1].strip(), c[2].strip() if len(c) > 2 else "")
    for r in rows:
        v = verdict.get(r[0])
        if not v:
            missing.append([name] + r); continue
        if v[0] == "採る":
            adopted.append(r)
        else:
            returned.append(r + [v[0], v[1]])
def w(p, h, rs):
    (D / p).write_text("\t".join(h) + "\n" + "".join("\t".join(x) + "\n" for x in rs), encoding="utf-8")
w("adopted.tsv", H, sorted(adopted))
w("returned.tsv", H + ["codex判定", "codex理由"], sorted(returned))
w("review/missing.tsv", ["束"] + H, missing)
print(f"採る {len(adopted)}・戻す {len(returned)}・未確認 {len(missing)}")
sys.exit(1 if missing else 0)
