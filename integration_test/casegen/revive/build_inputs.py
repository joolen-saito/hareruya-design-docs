#!/usr/bin/env python3
"""依頼者の決定（2026-10-23）で戻せるようになった除外ケースの材料を、機能ごとに切り出す。 build_inputs.py

決定: B16-09 サイトマップは「どの情報がサイトマップに出力されるか」を確かめればよい（生成の手段は問わない）。
      MTGバイヤーの試験端末は用意できる（O01-01〜03。中継・模擬応答・時刻固定・障害注入は引き続き用意しない）。
出力: units/<機能ID>/excluded_cases.tsv（テストID・判定ID・除外理由・未確定の内容・11列）・excluded_seeds.tsv（7列＋使用していた除外ケース）
"""
import csv, glob, pathlib

R = pathlib.Path(__file__).resolve().parent
CG = R.parent
FIDS = ["B16-09", "O01-01", "O01-02", "O01-03"]
H11 = ["テストID", "要求ID", "連鎖ID", "観点ID", "優先度", "実行区分", "使用シード", "事前準備", "手順", "期待結果", "出典"]
SH = ["シードID", "区分", "論理名", "状態・属性", "用途", "投入方法", "共有"]
csv.field_size_limit(10**9)


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))


def wr(p, h, rs):
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, escapechar=None, quotechar="\x01")
        w.writerow(h); w.writerows(rs)


def main():
    judg = {}
    for p in glob.glob(str(CG / "*/*map*.tsv")):
        for r in rd(p):
            if r.get("テストID") and r.get("判定ID"):
                judg.setdefault(r["テストID"], r["判定ID"])
    C = rd(CG / "excluded_open_cases.tsv")
    S = rd(CG / "excluded_open_seeds.tsv")
    for f in FIDS:
        d = R / f"units/{f}"
        d.mkdir(parents=True, exist_ok=True)
        rows = [[r["テストID"], judg.get(r["テストID"], ""), r["除外理由"], r["未確定の内容"]] + [r["元_" + h] for h in H11[1:]]
                for r in C if r["機能ID"] == f]
        rows = [[x[0], x[1], x[2], x[3]] + x[4:] for x in rows]
        wr(d / "excluded_cases.tsv", ["テストID", "判定ID", "除外理由", "未確定の内容"] + H11[1:], rows)
        srows = [[r[h] for h in SH] + [r["使用していた除外ケース"]] for r in S if r["機能ID"] == f]
        wr(d / "excluded_seeds.tsv", SH + ["使用していた除外ケース"], srows)
        print(f, len(rows), "件", len(srows), "シード", "判定IDなし", sum(1 for x in rows if not x[1]))


if __name__ == "__main__":
    main()
