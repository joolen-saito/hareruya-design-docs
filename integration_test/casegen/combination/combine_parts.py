#!/usr/bin/env python3
"""部に分けて書いたケース（cases/<機能ID>_cb_*.p<n>.tsv）を部の順につなぎ、cases/<機能ID>_cb_*.tsv にする。 combine_parts.py <機能ID>...

部のファイルはそのまま残す（直すときは部のファイルを直して、これを流し直す）。
"""
import csv, pathlib, sys
G = pathlib.Path(__file__).resolve().parent
PT = list(csv.DictReader(open(G / "parts.tsv", encoding="utf-8"), delimiter="\t"))
for fid in sys.argv[1:]:
    parts = [r["部"] for r in PT if r["機能ID"] == fid and r["部"]]
    for kind in ("test_cases", "seed_data", "dispositions"):
        lines, head = [], None
        for pt in parts:
            p = G / f"cases/{fid}_cb_{kind}.{pt}.tsv"
            ls = p.read_text(encoding="utf-8").split("\n")
            head = head or ls[0]
            assert ls[0] == head, p
            lines += [l for l in ls[1:] if l.strip()]
        (G / f"cases/{fid}_cb_{kind}.tsv").write_text(head + "\n" + "".join(l + "\n" for l in lines), encoding="utf-8")
    print(fid, "部", len(parts))
