#!/usr/bin/env python3
"""「ケースにしない」とした組を集める。 collect_notmade.py → review/notmade.tsv（機能ID・組ID・理由・制約に足すべき組）と件数"""
import csv, glob, pathlib, re, collections
G = pathlib.Path(__file__).resolve().parent
csv.field_size_limit(10**9)
out = []
for p in sorted(glob.glob(str(G / "cases/*_cb_dispositions.tsv"))):
    fid = pathlib.Path(p).name.split("_")[0]
    for r in csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE):
        if r["扱い"] == "ケースにしない":
            cons = "；".join(dict.fromkeys(re.findall(r"F\d\d=[^&\s、。）)」]+(?:&F\d\d=[^&\s、。）)」]+)*", r["理由"])))
            out.append([fid, r["項目ID"], r["理由"], cons])
with open(G / "review/notmade.tsv", "w", encoding="utf-8") as f:
    f.write("機能ID\t組ID\t理由\t制約に足すべき組\n")
    for x in out:
        f.write("\t".join(x) + "\n")
print(len(out), "組", len({x[0] for x in out}), "機能", "制約の組あり", sum(1 for x in out if x[3]))
