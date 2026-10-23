#!/usr/bin/env python3
"""単体レベルの除外で結合レベルのケースが無くなった機能に足したケース（added/<機能ID>_cases.tsv）を cases/ へ合流する。 merge_added.py

2026-10-21 依頼者「M04-14は足して」。何度流しても同じ（同じテストIDが cases/ にあれば中身を置き換える）。
足したケースは precond/added_cases.tsv にも載せる（gate_precond の G6 が基線との差として数える）。
使うシードは既存の共有シード。シードが除外表へ移っていても、../exclude_ut.py が使うケースのあるシードを cases/ へ戻す。
順序は merge（sheetmap・nosheet・gapfill・ga）→ merge_dp → merge_cb → これ → seed_screen/apply.py → … → exclude_ut.py。
"""
import pathlib, datetime
D = pathlib.Path(__file__).resolve().parent
CG = D.parent
CH = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]


def rows(p):
    ls = [l.rstrip("\n").split("\t") for l in open(p, encoding="utf-8")]
    return ls[0], [x for x in ls[1:] if x and x != [""]]


def main():
    ap = CG / "precond/added_cases.tsv"
    ah, A = rows(ap)
    have = {r[0] for r in A}
    n = 0
    for src in sorted((D / "added").glob("*_cases.tsv")):
        fid = src.name.split("_")[0]
        h, new = rows(src)
        assert h == CH, src
        p = CG / f"cases/{fid}_test_cases.tsv"
        ch, C = rows(p)
        assert ch == CH, p
        by = {x[0]: x for x in C}
        for r in new:
            by[r[0]] = r
            n += 1
            if r[0] not in have:
                A.append([r[0], datetime.date.today().isoformat(), "単体レベル除外の後に結合レベルのケースを足した（2026-10-21 依頼者「M04-14は足して」）"])
                have.add(r[0])
        p.write_text("\t".join(CH) + "\n" + "".join("\t".join(x) + "\n" for x in sorted(by.values(), key=lambda x: x[0])), encoding="utf-8")
    ap.write_text("\t".join(ah) + "\n" + "".join("\t".join(x) + "\n" for x in A), encoding="utf-8")
    print(f"合流 {n}件")


if __name__ == "__main__":
    main()
