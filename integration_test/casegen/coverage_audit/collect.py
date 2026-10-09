#!/usr/bin/env python3
"""判定を集める。 collect.py

judgement_all.tsv  全単位の判定（書番/シートID/シート名/機能/行/記述/判定/テストID/理由）
gaps.tsv           抜け・一部抜けだけ
summary.tsv        単位ごとの判定件数（未着手の単位は 未判定）
"""
import csv, pathlib, collections
A = pathlib.Path(__file__).resolve().parent
V = ["ケースあり", "一部抜け", "抜け", "保留除外", "対象外", "説明文"]
units = [r for r in csv.DictReader(open(A / "units.tsv", encoding="utf-8"), delimiter="\t")]
allr, summ = [], []
for u in units:
    key = [u["書番"], u["シートID"], u["シート名"], u["機能"]]
    if u["扱い"] != "監査":
        summ.append(key + [u["扱い"]] + [""] * len(V))
        continue
    p = A / "units" / f'{u["書番"]}_{u["シートID"]}' / "judgement.tsv"
    if not p.exists():
        summ.append(key + ["未判定"] + [""] * len(V))
        continue
    rows = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))[1:]
    c = collections.Counter(r[2] for r in rows)
    summ.append(key + ["判定済み"] + [c.get(v, 0) for v in V])
    allr += [key + r[:5] for r in rows]
H = ["書番", "シートID", "シート名", "機能"]
def wr(name, head, rows):
    with open(A / name, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(head); w.writerows(rows)
wr("judgement_all.tsv", H + ["行", "記述", "判定", "テストID", "理由"], allr)
wr("gaps.tsv", H + ["行", "記述", "判定", "テストID", "理由"], [r for r in allr if r[6] in ("抜け", "一部抜け")])
wr("summary.tsv", H + ["状態"] + V, summ)
tot = collections.Counter(r[6] for r in allr)
print("判定済み", sum(1 for s in summ if s[4] == "判定済み"), "/ 未判定", sum(1 for s in summ if s[4] == "未判定"))
print({v: tot.get(v, 0) for v in V})
