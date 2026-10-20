#!/usr/bin/env python3
"""組の多い機能を、処理の区切りで著者1本あたり MAX 行までの部に分ける。 build_parts.py → parts.tsv

部が1つの機能は部の名前を空にする（あとで組が足されて部が増えたら、前の部を p1 と呼ぶ）（著者は cases/<機能ID>_cb_*.tsv へ直接書く）。
部が2つ以上の機能は p1・p2… とし、著者は cases/<機能ID>_cb_*.p<n>.tsv へ書く。combine_parts.py が1つにつなぐ。
1つの処理が MAX 行を超えるときは、その処理の中で MAX 行ごとに切る。
"""
import csv, pathlib
G = pathlib.Path(__file__).resolve().parent
MAX = 30


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


old = rd(G / "parts.tsv") if (G / "parts.tsv").exists() else []
out = []
for t in rd(G / "targets.tsv"):
    fid, start = t["機能ID"], int(t["開始番号"])
    rows = rd(G / f"combos/{fid}.tsv")
    mine = [r for r in old if r["機能ID"] == fid]
    if mine:
        # 前に分けた部はそのまま残し、その後ろに足された組だけを新しい部にする（著者が書いた部の範囲を動かさない。2026-10-20）
        last = max(r["組の終了"] for r in mine)
        out += [[r["機能ID"], r["部"] or "p1", r["組の開始"], r["組の終了"], r["開始番号"], r["組の数"]] for r in mine]
        rest = [i for i, r in enumerate(rows) if r["組ID"] > last]
        k = len(mine)
        for j in range(0, len(rest), MAX):
            c = rest[j:j + MAX]
            k += 1
            out.append([fid, f"p{k}", rows[c[0]]["組ID"], rows[c[-1]]["組ID"], f"{start + c[0]:03d}", len(c)])
        continue
    chunks, cur, curp = [], [], None
    for i, r in enumerate(rows):
        if cur and (len(cur) >= MAX or (r["処理ID"] != curp and len(cur) + sum(1 for x in rows[i:] if x["処理ID"] == r["処理ID"]) > MAX)):
            chunks.append(cur); cur = []
        cur.append(i); curp = r["処理ID"]
    if cur:
        chunks.append(cur)
    for n, c in enumerate(chunks, 1):
        out.append([fid, "" if len(chunks) == 1 else f"p{n}", rows[c[0]]["組ID"], rows[c[-1]]["組ID"], f"{start + c[0]:03d}", len(c)])
with open(G / "parts.tsv", "w", encoding="utf-8") as f:
    f.write("機能ID\t部\t組の開始\t組の終了\t開始番号\t組の数\n")
    for x in out:
        f.write("\t".join(map(str, x)) + "\n")
for x in out:
    print(*x)
