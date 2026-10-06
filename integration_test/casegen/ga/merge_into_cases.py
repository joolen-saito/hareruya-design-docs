#!/usr/bin/env python3
"""アクセス解析連携ケース（ga/cases・12列）を、機能ごとのケースファイル（cases/・11列）へ置く。

F10-01〜03 は既存ケースが無いので、テストIDはそのまま使う。判定IDは ga_map.tsv に残す。
何度実行しても同じ結果になる（cases/ の F10 のファイルと ga_map.tsv は作り直し、added_cases.tsv は F10 の行を入れ替える）。
"""
import csv, pathlib, datetime

CG = pathlib.Path(__file__).resolve().parents[1]
G = CG / "ga"
FIDS = ["F10-01", "F10-02", "F10-03"]
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
        C = read(G / f"cases/{fid}_ga_test_cases.tsv")
        write(CG / f"cases/{fid}_test_cases.tsv", HDR, [[x[h] for h in HDR] for x in C])
        (CG / f"cases/{fid}_seed_data.tsv").write_text(
            (G / f"cases/{fid}_ga_seed_data.tsv").read_text(encoding="utf-8"), encoding="utf-8")
        m += [[x["テストID"], x["判定ID"], fid] for x in C]
    write(G / "ga_map.tsv", ["テストID", "判定ID", "機能ID"], m)
    ap = CG / "precond/added_cases.tsv"
    A = read(ap)
    keep = [[r["テストID"], r["追加日"], r["由来"]] for r in A if not r["テストID"].startswith("IT-F10-")]
    write(ap, ["テストID", "追加日", "由来"], keep + [[t, DAY, f"アクセス解析連携（{j}）"] for t, j, _ in m])
    print(f"{len(m)}件を cases/ へ置いた")


if __name__ == "__main__":
    main()
