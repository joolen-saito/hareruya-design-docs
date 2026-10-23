#!/usr/bin/env python3
"""PER_FUNCTION_FP.md に載せる全体の数字を出す（out/function_fp.tsv と out/function_fp_summary.json から）。"""
import csv, json, collections, statistics, pathlib
H = pathlib.Path(__file__).resolve().parent
r = list(csv.DictReader(open(H / "out/function_fp.tsv", encoding="utf-8"), delimiter="\t"))
s = json.load(open(H / "out/function_fp_summary.json", encoding="utf-8"))
F = float
D = {"P25": 668.8, "中央": 1782.3, "P75": 3450.8}
need = [x for x in r if x["状態"] in ("ケースあり", "ケースなし（その他）")]
fp_need = sum(F(x["FP"]) for x in need)
tot = s["FP合計(バッチ込み)"]
cases = sum(int(x["ケース数"]) for x in r)
print("FP合計(バッチ込み)", tot, "うちケースが要る機能", round(fp_need, 1))
for k, d in D.items():
    print(k, "全量", round(tot * d / 1000), "ケースが要る機能", round(fp_need * d / 1000))
std_fp = 1706
net = 5732 - std_fp
std_fn = sum(F(x["FP"]) for x in r if x["状態"] == "標準（ケース不要）")
print("差分方式: 純増", net, "×改良開発中央1807.8 =", round(net * 1.8078), "+ 標準機能", round(std_fn, 1), "FP×1782.3 =", round(std_fn * 1.7823),
      "計", round(net * 1.8078 + std_fn * 1.7823))
print("実際", cases, "件 / ケースが要る機能の密度", round(cases / fp_need * 1000), "件/KFP", "中央比", round(cases / (fp_need * 1.7823), 2))
print("判定", collections.Counter(x["判定"] for x in r))
by = collections.defaultdict(lambda: [0, 0.0, 0])
for x in need:
    b = by[x["区分"]]; b[0] += 1; b[1] += F(x["FP"]); b[2] += int(x["ケース数"])
for k, (n, fp, c) in by.items():
    print(k, n, "機能", round(fp), "FP 目安中央", round(fp * 1.7823), "実際", c, "密度", round(c / fp * 1000) if fp else "-")
by = collections.defaultdict(lambda: [0, 0.0, 0])
for x in need:
    b = by[x["カスタマイズ区分"]]; b[0] += 1; b[1] += F(x["FP"]); b[2] += int(x["ケース数"])
for k, (n, fp, c) in by.items():
    print("区分", k, n, "機能", round(fp), "FP 目安中央", round(fp * 1.7823), "実際", c, "密度", round(c / fp * 1000) if fp else "-")
