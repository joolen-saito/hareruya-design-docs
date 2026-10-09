#!/usr/bin/env python3
"""ケースが無かったExcel無し冊子の機能のケース（nosheet/cases・12列）を、機能ごとのケースファイル（cases/・11列）へ置く。

どの機能も既存ケースが無いので、テストIDはそのまま使う。判定IDは ns_map.tsv に残す。
何度実行しても同じ結果になる（cases/ の該当機能のファイルと ns_map.tsv は作り直し、added_cases.tsv は該当機能の行を入れ替える）。
"""
import csv, pathlib

CG = pathlib.Path(__file__).resolve().parents[1]
G = CG / "nosheet"
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
DAY = "2026-10-09"


def read(p):
    return list(csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"))


def write(p, hdr, rows):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(hdr); w.writerows(rows)


def main():
    fids = sorted({r["機能ID"] for r in read(G / "targets.tsv") if r["扱い"] == "ケース作成"
                   and (G / f"cases/{r['機能ID']}_ns_test_cases.tsv").exists()})
    m = []
    for fid in fids:
        C = read(G / f"cases/{fid}_ns_test_cases.tsv")
        write(CG / f"cases/{fid}_test_cases.tsv", HDR, [[x[h] for h in HDR] for x in C])
        (CG / f"cases/{fid}_seed_data.tsv").write_text(
            (G / f"cases/{fid}_ns_seed_data.tsv").read_text(encoding="utf-8"), encoding="utf-8")
        m += [[x["テストID"], x["判定ID"], fid] for x in C]
    write(G / "ns_map.tsv", ["テストID", "判定ID", "機能ID"], m)
    ap = CG / "precond/added_cases.tsv"
    A = read(ap)
    keep = [[r["テストID"], r["追加日"], r["由来"]] for r in A if not r["テストID"].startswith(tuple(f"IT-{f}-" for f in fids))]
    write(ap, ["テストID", "追加日", "由来"], keep + [[t, DAY, f"ケースが無かった機能の作成（{j}）"] for t, j, _ in m])
    # 投入方法が未確定・未整備のシードを使うケースを open_preconditions.tsv に載せる（該当機能の行を作り直す）
    op = CG / "precond/open_preconditions.tsv"
    OH = ["機能", "対象", "未確定の内容", "影響ケース", "手がかり", "状態"]
    O = [[r[h] for h in OH] for r in read(op) if r["機能"] not in fids]
    for fid in fids:
        C = read(G / f"cases/{fid}_ns_test_cases.tsv")
        for sd in read(G / f"cases/{fid}_ns_seed_data.tsv"):
            how = sd["投入方法"]
            if "未確定" not in how and "未整備" not in how:
                continue
            use = [x["テストID"] for x in C if sd["シードID"] in [v.strip() for v in x["使用シード"].replace("、", ",").split(",")]]
            O.append([fid, sd["シードID"], how, ",".join(use), f"nosheet/gen_{fid}/report.md の「試験環境に要るもの」",
                      "未整備" if "未整備" in how and "未確定" not in how else "未確定"])
    write(op, OH, O)
    print(f"{len(fids)}機能 {len(m)}件を cases/ へ置いた")


if __name__ == "__main__":
    main()
