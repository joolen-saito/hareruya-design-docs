#!/usr/bin/env python3
"""確定させた作り方（out/<機能ID>.tsv）を、シードの作業ファイル（gapfill/cases・nosheet/cases）の投入方法へ当てる。
何度流しても同じ。流したあと nosheet/merge_into_cases.py → gapfill/merge_into_cases.py → build_all_test_cases.py。
all.tsv に全件の判定をまとめる。"""
import csv, glob, pathlib
G = pathlib.Path(__file__).resolve().parent
CG = G.parent
csv.field_size_limit(10**9)
new, allr = {}, []
for p in sorted(glob.glob(str(G / "out/*.tsv"))):
    f = pathlib.Path(p).stem
    for r in csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE):
        new[r["シードID"].strip()] = (r["新しい投入方法"] or "").strip()
        allr.append([r["シードID"].strip(), f, (r["判定"] or "").strip(), (r["新しい投入方法"] or "").strip(), (r.get("根拠") or "").strip(), (r.get("備考") or "").strip()])
n = 0
for p in glob.glob(str(CG / "gapfill/cases/*_gf_seed_data.tsv")) + glob.glob(str(CG / "nosheet/cases/*_ns_seed_data.tsv")):
    rows = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
    ch = False
    for r in rows[1:]:
        if r and r[0] in new and new[r[0]] and r[5] != new[r[0]]:
            r[5] = new[r[0]]; ch = True; n += 1
    if ch:
        # csv の書き出しは逆斜線や引用符を書き換えるので使わない（セル内にタブ・改行は無い決まり）
        open(p, "w", encoding="utf-8", newline="").write("".join("\t".join(r) + "\n" for r in rows))
with open(G / "all.tsv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
    w.writerow(["シードID", "機能ID", "判定", "新しい投入方法", "根拠", "備考"]); w.writerows(allr)
print(len(new), "件のうち", n, "件を書き換えた")
