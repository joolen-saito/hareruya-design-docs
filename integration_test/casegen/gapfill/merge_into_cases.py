#!/usr/bin/env python3
"""抜けを埋めるケース（gapfill/cases・13列）を、機能ごとのケースファイル（cases/・11列）へ足す。

何度実行しても同じ結果になる: 以前足した行（gf_map.tsv に載っているテストID・今回のシード表のシードID）を
cases/ から取り除いてから、gapfill/cases の今の内容を末尾へ足す。既存のケースとシードには触れない。
判定IDと指摘IDは gf_map.tsv に残す。足したテストIDは precond/added_cases.tsv に載せる。
sheetmap・nosheet・ga の merge_into_cases.py を流すと該当機能のファイルが作り直されるので、その後にこれを流し直す。
"""
import csv, glob, pathlib, re

G = pathlib.Path(__file__).resolve().parent
CG = G.parent
HDR = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SHDR = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
DAY = "2026-10-09"
csv.field_size_limit(10**9)


def rows(p):
    r = list(csv.reader(p.open(encoding="utf-8"), delimiter="\t"))
    return r[0], [x for x in r[1:] if x]


def write(p, hdr, rs):
    with p.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(hdr); w.writerows(rs)


def main():
    old = set()
    if (G / "gf_map.tsv").exists():
        old = {r[0] for r in rows(G / "gf_map.tsv")[1]}
    m, n = [], 0
    oph, op = rows(CG / "precond/open_preconditions.tsv")
    fids = sorted(pathlib.Path(p).name.split("_")[0] for p in glob.glob(str(G / "cases/*_gf_test_cases.tsv")))
    newseed = set()
    for fid in fids:
        newseed |= {r[0] for r in rows(G / f"cases/{fid}_gf_seed_data.tsv")[1]}
    op = [r for r in op if r[1] not in newseed and not r[4].startswith("gapfill/")]
    for fid in fids:
        h, C = rows(G / f"cases/{fid}_gf_test_cases.tsv")
        _, S = rows(G / f"cases/{fid}_gf_seed_data.tsv")
        ch, base = rows(CG / f"cases/{fid}_test_cases.tsv")
        assert ch == HDR, fid
        new_ids = {x[0] for x in C}
        base = [x for x in base if x[0] not in old and x[0] not in new_ids]
        write(CG / f"cases/{fid}_test_cases.tsv", HDR, base + [x[1 - 1:1] + x[2:12] for x in C])
        sh, sbase = rows(CG / f"cases/{fid}_seed_data.tsv")
        assert sh == SHDR, fid
        sids = {x[0] for x in S}
        write(CG / f"cases/{fid}_seed_data.tsv", SHDR, [x for x in sbase if x[0] not in newseed] + S)
        m += [[x[0], x[1], fid, x[12]] for x in C]
        n += len(C)
        for sd in S:
            how = sd[5]
            if "未確定" in how or "未整備" in how:
                use = [x[0] for x in C if sd[0] in [v.strip() for v in x[7].replace("、", ",").split(",")]]
                op.append([fid, sd[0], how, ",".join(use), f"gapfill/cases/{fid}_gf_seed_data.tsv",
                           "未整備" if "未整備" in how and "未確定" not in how else "未確定"])
    # 既存の未確定・未整備のシード（共有可）を追加ケースが使うときは、その分の行を足す（ゲートG9）。
    # 既存の行は対象の書き方がまちまちなので書き換えず、手がかりが gapfill/ で始まる行を自分の行として作り直す
    UNS = re.compile("未確定|未整備")
    for fid in fids:
        _, sbase = rows(CG / f"cases/{fid}_seed_data.tsv")
        uns = {x[0]: x[5] for x in sbase if x[0] not in newseed and UNS.search(x[5])}
        use = {}
        for x in rows(G / f"cases/{fid}_gf_test_cases.tsv")[1]:
            for s_ in [v.strip() for v in x[7].replace("、", ",").split(",") if v.strip()]:
                if s_ in uns:
                    use.setdefault(s_, []).append(x[0])
        for s_, ts in use.items():
            op.append([fid, s_, uns[s_], ",".join(ts), "gapfill/（既存シードの未確定の前提を追加ケースが使う）",
                       "未整備" if "未整備" in uns[s_] and "未確定" not in uns[s_] else "未確定"])
    write(G / "gf_map.tsv", ["テストID", "判定ID", "機能ID", "指摘ID"], m)
    write(CG / "precond/open_preconditions.tsv", oph, op)
    ah, A = rows(CG / "precond/added_cases.tsv")
    new = {x[0] for x in m}
    write(CG / "precond/added_cases.tsv", ah, [r for r in A if r[0] not in old and r[0] not in new]
          + [[t, DAY, f"被覆監査の抜け（{j}。{g}）"] for t, j, _, g in m])
    print(f"{len(fids)}機能 {n}件を cases/ へ足した")


if __name__ == "__main__":
    main()
