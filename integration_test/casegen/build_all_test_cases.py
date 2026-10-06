#!/usr/bin/env python3
"""cases/<機能ID>_test_cases.tsv を機能IDの順に連結して all_test_cases.tsv を作る。

列は11列のまま。行の並びは機能ごとのファイルの並びを保つ。
2026-10-06 に、それまでの一覧（8,325件）がこの連結と一致することを確かめてからスクリプトにした。
"""
import csv, glob, io, pathlib

CG = pathlib.Path(__file__).resolve().parent


def main():
    hdr, rows = None, []
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        r = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t"))
        assert hdr is None or r[0] == hdr, f"列が違う: {p}"
        hdr = r[0]
        rows += [x for x in r[1:] if x]
    ids = [x[0] for x in rows]
    assert len(ids) == len(set(ids)), "テストIDが重複している"
    b = io.StringIO()
    w = csv.writer(b, delimiter="\t", lineterminator="\n")
    w.writerow(hdr); w.writerows(rows)
    (CG / "all_test_cases.tsv").write_text(b.getvalue(), encoding="utf-8")
    print(f"{len(rows)} 件 / {len({i[3:9] for i in ids})} 機能")


if __name__ == "__main__":
    main()
