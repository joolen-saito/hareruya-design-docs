#!/usr/bin/env python3
"""codex の反証結果を集める。 collect_verify.py  → verified.tsv（指摘＋2巡目の判定）

codex の出力には依頼文も入るので、最後の「codex」行より後ろ（最終回答）だけを読む。
"""
import csv, glob, pathlib, re, collections
A = pathlib.Path(__file__).resolve().parent
V = {"妥当", "確認済み", "保留除外済み", "対象外", "正解未定", "読み違い"}
F = [r for n in ("findings.tsv", "findings14.tsv") if (A / n).exists()
     for r in csv.DictReader(open(A / n, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE)]
res, bad = {}, []
for p in sorted(glob.glob(str(A / "verify/[VW]*_out.txt"))):
    s = open(p, encoding="utf-8", errors="replace").read()
    if "tokens used" not in s:
        bad.append(pathlib.Path(p).name + ": 未完了"); continue
    fin = s[s.rfind("\ncodex\n"):]
    for l in fin.split("\n"):
        c = l.split("\t")
        if re.fullmatch(r"[GH]\d{4}", c[0].strip()) and len(c) >= 2 and c[1].strip() in V:
            c += [""] * (4 - len(c))
            res[c[0].strip()] = [c[1].strip(), c[2].strip(), " ".join(x.strip() for x in c[3:])]
miss = [f["指摘ID"] for f in F if f["指摘ID"] not in res]
with open(A / "verified.tsv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
    w.writerow(list(F[0].keys()) + ["2巡目の判定", "2巡目のテストID", "2巡目の根拠"])
    for x in F:
        w.writerow(list(x.values()) + res.get(x["指摘ID"], ["未判定", "", ""]))
print(collections.Counter(v[0] for v in res.values()))
print("未判定", len(miss), miss[:20], bad)
