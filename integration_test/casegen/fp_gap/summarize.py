#!/usr/bin/env python3
"""機能ごとの結果（項目・扱い・ケース数・ケースにしなかった理由の内訳）を summary.tsv に出す。 summarize.py

ケースにしなかった理由は、仕分けの理由欄の語で大まかに分ける（読み物用。正本は cases/<機能ID>_fg_dispositions.tsv の理由欄）。
"""
import collections, csv, pathlib

G = pathlib.Path(__file__).resolve().parent
RULES = [  # 上から当てる
    ("範囲外", ("範囲外", "実装しない", "フェーズ2", "廃止", "SCOPE")),
    ("用意しない前提（中継・模擬応答・時刻固定・障害・隔離・試験端末）", ("中継", "模擬", "時刻", "障害", "隔離", "試験サーバー", "試験端末", "応答を切り替", "応答切替", "注入", "未整備")),
    ("単体テストレベル", ("単体",)),
    ("既存・同じ扱いの値・外したケースと同じ確かめ", ("同じ確かめ", "同じ扱い", "確認済み", "重複", "既存")),
    ("結果が設計書から決まらない・食い違い・保留", ("決まらない", "定めが無", "記述が無", "食い違", "保留", "裁定", "未定義", "確定できない", "一意に")),
    ("作り方が決まらない", ("作り方", "投入方法", "手段が無", "方法が無", "未確定")),
]


def rd(p):
    return list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"))


def main():
    T = rd(G / "targets.tsv")
    out, tot = [], collections.Counter()
    for t in T:
        f = t["機能ID"]
        D = rd(G / f"cases/{f}_fg_dispositions.tsv")
        C = rd(G / f"cases/{f}_fg_test_cases.tsv")
        k = collections.Counter(r["扱い"] for r in D)
        why = collections.Counter()
        for r in D:
            if r["扱い"] != "ケースにしない":
                continue
            why[next((name for name, ws in RULES if any(w in r["理由"] for w in ws)), "その他")] += 1
        tot.update(k); tot["ケース"] += len(C)
        out.append([f, t["機能名"], t["種類"], t["いまのケース数"], t["目安P25"], t["目安中央"], len(D), k["ケース化"], len(C),
                    k["既存ケースで確認済み"], k["ケースにしない"], "／".join(f"{a} {b}" for a, b in why.most_common())])
    with open(G / "summary.tsv", "w", encoding="utf-8", newline="") as fo:
        w = csv.writer(fo, delimiter="\t", lineterminator="\n")
        w.writerow(["機能ID", "機能名", "種類", "前からのケース数", "目安P25", "目安中央", "項目", "ケース化した項目", "足したケース",
                    "既存ケースで確認済み", "ケースにしない", "ケースにしなかった理由の内訳"])
        w.writerows(out)
    print(dict(tot), "ケースのある機能", sum(1 for r in out if r[8]))


if __name__ == "__main__":
    main()
