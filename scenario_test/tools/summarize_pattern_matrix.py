#!/usr/bin/env python3
"""全業務のシナリオパターンのマトリクスを1枚に集計する。

各業務の matrix.tsv（build_pattern_matrix.py の出力）を読み、
scenario_test/coverage/scenario_pattern_matrix/00_全業務の集計.md を作る。
"""
import csv
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "coverage" / "scenario_pattern_matrix"
KINDS = ["通っている", "テストケースだけ", "抜け", "判断待ち", "他層", "適用外", "他業務"]


def main():
    rows, wait, gaps = [], [], []
    for d in sorted(p for p in BASE.iterdir() if p.is_dir() and not p.name.startswith("_")):
        mt = d / "matrix.tsv"
        if not mt.exists():
            continue
        with open(mt, encoding="utf-8", newline="") as f:
            r = list(csv.DictReader(f, delimiter="\t"))
        head = r[0].keys() if r else []
        nscn = sum(1 for k in head if k.startswith("SCN-"))
        c = Counter(x["判定"] for x in r)
        rows.append((d.name, nscn, len(r), c))
        fac = {x["値ID"]: x for x in csv.DictReader(open(d / "factors.tsv", encoding="utf-8", newline=""), delimiter="\t")}
        for x in r:
            if x["判定"] == "判断待ち":
                wait.append((d.name, x["値ID"], x["業務条件"], x["値"], fac[x["値ID"]]["備考"]))
            elif x["判定"] == "抜け":
                gaps.append((d.name, x["値ID"], x["業務条件"], x["値"]))
    L = ["# シナリオパターンのマトリクス：全業務の集計（自動生成）", "",
         "生成元は `scenario_test/tools/summarize_pattern_matrix.py`。各業務の表は `<業務>/matrix.md`、抜けの一覧は `<業務>/gaps.tsv`。", "",
         "| 業務 | シナリオ | 値 | " + " | ".join(KINDS) + " |", "|---|---:|---:|" + "---:|" * len(KINDS)]
    tot = Counter()
    for name, nscn, n, c in rows:
        L.append(f"| [{name}]({name}/matrix.md) | {nscn} | {n} | " + " | ".join(str(c[k]) for k in KINDS) + " |")
        tot.update(c)
        tot["_scn"] += nscn
        tot["_n"] += n
    L.append(f"| 合計 | {tot['_scn']} | {tot['_n']} | " + " | ".join(str(tot[k]) for k in KINDS) + " |")
    L += ["", "## 判断待ちの値", "", "| 業務 | 値ID | 業務条件 | 値 | 理由 |", "|---|---|---|---|---|"]
    for w in wait:
        L.append("| " + " | ".join(s.replace("|", "｜") for s in w) + " |")
    L += ["", "## 抜けの値", "", "| 業務 | 値ID | 業務条件 | 値 |", "|---|---|---|---|"]
    for g in gaps:
        L.append("| " + " | ".join(s.replace("|", "｜") for s in g) + " |")
    (BASE / "00_全業務の集計.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"OK: {len(rows)}業務 / 値 {tot['_n']} / 抜け {tot['抜け']} / 判断待ち {tot['判断待ち']}")


if __name__ == "__main__":
    main()
