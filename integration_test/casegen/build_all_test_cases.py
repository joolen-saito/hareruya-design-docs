#!/usr/bin/env python3
"""cases/<機能ID>_test_cases.tsv を機能IDの順に連結して all_test_cases.tsv を作る。

列は cases/ の11列から 要求ID・優先度 を除いた9列（依頼者決定 2026-10-16）。cases/ には11列のまま残る
（E2E と前提条件の検査 precond/gate_precond.py が cases/ の要求ID・優先度を読むため）。
行の並びは機能ごとのファイルの並びを保つ。
playwright_cases.tsv に挙げたケースは、一覧の実行区分を「Playwright」にする（依頼者決定 2026-10-16。
e2e/ に Playwright のテストがあり、ローカルで実行したケース。合否は問わない）。cases/ の実行区分は変えない
（E2E がDB確認の可否を cases/ の実行区分で決めるため）。テストを足して実行したら、そのIDを playwright_cases.tsv に足して流し直す。
2026-10-06 に、それまでの一覧（8,325件）がこの連結と一致することを確かめてからスクリプトにした。
"""
import csv, glob, io, pathlib

CG = pathlib.Path(__file__).resolve().parent
OMIT = ("要求ID", "優先度")   # 一覧には出さない列
PLAYWRIGHT = "Playwright"      # Playwright で実行したケースの、一覧での実行区分


def main():
    hdr, rows = None, []
    for p in sorted(glob.glob(str(CG / "cases/*_test_cases.tsv"))):
        r = list(csv.reader(open(p, encoding="utf-8"), delimiter="\t"))
        assert hdr is None or r[0] == hdr, f"列が違う: {p}"
        hdr = r[0]
        rows += [x for x in r[1:] if x]
        bad = [x[0] for x in r[1:] if x and len(x) != len(hdr)]
        assert not bad, f"列数が見出しと違う行がある（列を位置で落とすので止める）: {p} {bad[:5]}"
    ids = [x[0] for x in rows]
    assert len(ids) == len(set(ids)), "テストIDが重複している"
    pw = [x[0] for x in list(csv.reader(open(CG / "playwright_cases.tsv", encoding="utf-8"), delimiter="\t"))[1:] if x]
    assert len(pw) == len(set(pw)), "playwright_cases.tsv にテストIDの重複がある"
    missing = sorted(set(pw) - set(ids))
    assert not missing, f"playwright_cases.tsv のテストIDが cases/ に無い（除外されたケースか、IDの誤り）: {missing[:5]}"
    kind, pw_ids = hdr.index("実行区分"), set(pw)
    for x in rows:
        if x[0] in pw_ids:
            x[kind] = PLAYWRIGHT
    keep = [i for i, h in enumerate(hdr) if h not in OMIT]
    assert len(keep) == len(hdr) - len(OMIT), f"落とす列が見出しに無い: {hdr}"
    b = io.StringIO()
    w = csv.writer(b, delimiter="\t", lineterminator="\n")
    w.writerow([hdr[i] for i in keep]); w.writerows([[x[i] for i in keep] for x in rows])
    (CG / "all_test_cases.tsv").write_text(b.getvalue(), encoding="utf-8")
    print(f"{len(rows)} 件 / {len({i[3:9] for i in ids})} 機能（うち実行区分 {PLAYWRIGHT} {len(pw)} 件）")


if __name__ == "__main__":
    main()
