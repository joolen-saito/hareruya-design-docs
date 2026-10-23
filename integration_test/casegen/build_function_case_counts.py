#!/usr/bin/env python3
"""all_test_cases.tsv から機能ごとのケース数を数えて function_case_counts.tsv を作る。

列: 機能ID・区分・分類・機能名・カスタマイズ区分・ケース数・うちPlaywright合格（一覧の検証方法が Playwright の件数）。
区分・分類・機能名・カスタマイズ区分は functions/todo-list.md から引き、無い機能は sheetmap/targets.tsv の機能名を使う。
一覧（build_all_test_cases.py の出力）を作り直したら、これも流し直す。
"""
import collections, csv, pathlib, re

CG = pathlib.Path(__file__).resolve().parent
ROOT = CG.parents[1]


def main():
    rows = list(csv.DictReader(open(CG / "all_test_cases.tsv", encoding="utf-8"), delimiter="\t"))
    fid = lambda r: r["テストID"][3:9]
    cnt = collections.Counter(fid(r) for r in rows)
    pw = collections.Counter(fid(r) for r in rows if r["検証方法"] == "Playwright")
    meta = {}
    for line in open(ROOT / "functions/todo-list.md", encoding="utf-8"):
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) >= 6 and re.fullmatch(r"[A-Z]\d\d-\d\d", c[4]):
            meta.setdefault(c[4], (c[1], c[2], c[3], c[5]))
    for r in csv.DictReader(open(CG / "sheetmap/targets.tsv", encoding="utf-8"), delimiter="\t"):
        meta.setdefault(r["機能ID"], ("", "", r["機能名"], ""))
    missing = sorted(f for f in cnt if f not in meta)
    assert not missing, f"機能名が見つからない機能がある: {missing}"
    with open(CG / "function_case_counts.tsv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["機能ID", "区分", "分類", "機能名", "カスタマイズ区分", "ケース数", "うちPlaywright合格"])
        w.writerows([[k, *meta[k], cnt[k], pw[k]] for k in sorted(cnt)])
    print(f"{len(cnt)} 機能 / {sum(cnt.values())} 件")


if __name__ == "__main__":
    main()
