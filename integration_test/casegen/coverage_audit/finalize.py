#!/usr/bin/env python3
"""2巡目（codex 反証）を通した結果を仕分ける。 finalize.py

confirmed_gaps.tsv   2巡目も「妥当」＝ケースが要る抜け
spec_questions.tsv   2巡目が「正解未定」＝設計書の記述が矛盾・不足していて期待結果が決まらない（設計者への確認事項）
dropped.tsv          2巡目で落ちた指摘（確認済み／保留除外済み／対象外／読み違い）と根拠
by_unit.tsv          単位ごとの件数
"""
import csv, pathlib, collections
A = pathlib.Path(__file__).resolve().parent
R = list(csv.DictReader(open(A / "verified.tsv", encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE))
H = list(R[0].keys())
def wr(name, rows, head=H):
    with open(A / name, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_NONE, quotechar=None, escapechar="\\")
        w.writerow(head); w.writerows(rows)
g = lambda v: [list(r.values()) for r in R if r["2巡目の判定"] in v]
wr("confirmed_gaps.tsv", g({"妥当"}))
wr("spec_questions.tsv", g({"正解未定"}))
wr("dropped.tsv", g({"確認済み", "保留除外済み", "対象外", "読み違い"}))
c = collections.defaultdict(collections.Counter)
for r in R:
    c[(r["単位"], r["シート名"], r["機能"])][r["2巡目の判定"]] += 1
V = ["妥当", "正解未定", "確認済み", "保留除外済み", "対象外", "読み違い"]
wr("by_unit.tsv", [list(k) + [v.get(x, 0) for x in V] for k, v in sorted(c.items())], ["単位", "シート名", "機能"] + V)
print({x: sum(v.get(x, 0) for v in c.values()) for x in V})
