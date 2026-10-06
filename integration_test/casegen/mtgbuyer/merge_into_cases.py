#!/usr/bin/env python3
"""MTGバイヤーのケース（mtgbuyer/cases・12列）を、機能ごとのケースファイル（cases/・11列）へ置く。

O01-02・O01-03 は既存ケースが無いので、テストIDはそのまま使う。判定IDは mb_map.tsv に残す。
何度実行しても同じ結果になる（cases/ の O01-02・O01-03 のファイルと mb_map.tsv は作り直し、added_cases.tsv は O01-02・O01-03 の行を入れ替える）。
"""
import csv, pathlib, datetime

CG = pathlib.Path(__file__).resolve().parents[1]
G = CG / "mtgbuyer"
FIDS = [f for f in ["O01-01", "O01-02", "O01-03", "A07-07"] if (G / f"cases/{f}_mb_test_cases.tsv").exists()]
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
DAY = "2026-10-06"


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def write(p, hdr, rows):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(hdr); w.writerows(rows)


def main():
    m = []
    for fid in FIDS:
        C = read(G / f"cases/{fid}_mb_test_cases.tsv")
        write(CG / f"cases/{fid}_test_cases.tsv", HDR, [[x[h] for h in HDR] for x in C])
        (CG / f"cases/{fid}_seed_data.tsv").write_text(
            (G / f"cases/{fid}_mb_seed_data.tsv").read_text(encoding="utf-8"), encoding="utf-8")
        m += [[x["テストID"], x["判定ID"], fid] for x in C]
    write(G / "mb_map.tsv", ["テストID", "判定ID", "機能ID"], m)
    ap = CG / "precond/added_cases.tsv"
    A = read(ap)
    keep = [[r["テストID"], r["追加日"], r["由来"]] for r in A if not r["テストID"].startswith(tuple(f"IT-{f}-" for f in FIDS))]
    write(ap, ["テストID", "追加日", "由来"], keep + [[t, DAY, f"MTGバイヤー（{j}）"] for t, j, _ in m])
    print(f"{len(m)}件を cases/ へ置いた")


if __name__ == "__main__":
    main()
