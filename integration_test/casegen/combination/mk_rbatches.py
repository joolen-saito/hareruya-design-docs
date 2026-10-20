#!/usr/bin/env python3
"""ケースのレビューの束を作り、束ごとの依頼文を書く。 mk_rbatches.py <巡> [重さの上限=45] [機能の数の上限=5]
→ review/R<巡>_bundles.tsv（束・対象・重さ）と review/R<巡>_NN_prompt.md（mk_review.py と同じ雛形）

重さは組1行ごとに、ケース化=1、既存ケースで確認済み・ケースにしない=0.5。1束は上限まで・機能の数の上限まで。
上限を超える機能は部（parts.tsv）ごとに組の範囲で分ける。試行の2機能（F04-02・M05-11）はレビュー済みなので入れない。
2巡目以降は、前の巡で指摘のあった束だけを、前の巡と同じ中身で作る（R<前>_bundles.tsv の「指摘」列が1以上）。
"""
import csv, pathlib, subprocess, sys
G = pathlib.Path(__file__).resolve().parent
rnd = sys.argv[1]
LIM = float(sys.argv[2]) if len(sys.argv) > 2 else 45
MAXF = int(sys.argv[3]) if len(sys.argv) > 3 else 5
csv.field_size_limit(10**9)
PILOT = {"F04-02", "M05-11"}


def disp(fid, sfx=""):
    p = G / f"cases/{fid}_cb_dispositions{sfx}.tsv"
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def weight(rows):
    return sum(1 if r["扱い"] == "ケース化" else 0.5 for r in rows)


if rnd == "1":
    PT = list(csv.DictReader(open(G / "parts.tsv", encoding="utf-8"), delimiter="\t"))
    units = []   # (対象, 重さ)
    for fid in dict.fromkeys(r["機能ID"] for r in PT):
        if fid in PILOT:
            continue
        rs = [r for r in PT if r["機能ID"] == fid]
        w = weight(disp(fid))
        if w == 0:
            continue
        if w > LIM and any(r["部"] for r in rs):
            for r in rs:
                units.append((f"{fid}:{r['組の開始']}-{r['組の終了']}", weight(disp(fid, "." + r["部"]))))
        else:
            units.append((fid, w))
    bundles, cur, cw = [], [], 0
    for u, w in units:
        if cur and (cw + w > LIM or len(cur) >= MAXF):
            bundles.append((cur, cw)); cur, cw = [], 0
        cur.append(u); cw += w
    if cur:
        bundles.append((cur, cw))
else:
    prev = list(csv.DictReader(open(G / f"review/R{int(rnd) - 1}_bundles.tsv", encoding="utf-8"), delimiter="\t"))
    bundles = [(r["対象"].split(" "), float(r["重さ"])) for r in prev if int(r.get("指摘") or 0) > 0]

with open(G / f"review/R{rnd}_bundles.tsv", "w", encoding="utf-8") as f:
    f.write("束\t対象\t重さ\t指摘\n")
    for i, (us, w) in enumerate(bundles, 1):
        name = f"{i:02d}"
        f.write(f"R{rnd}_{name}\t{' '.join(us)}\t{w:g}\t\n")
        subprocess.run([sys.executable, str(G / "mk_review.py"), rnd, name, *us], check=True, stdout=subprocess.DEVNULL)
print(len(bundles), "束", sum(w for _, w in bundles), "重さ")
