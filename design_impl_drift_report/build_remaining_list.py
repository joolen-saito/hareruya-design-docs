#!/usr/bin/env python3
"""除外リストを全部適用して、残りの指摘リストを組み立てる。

  drift_findings_list_effort.tsv
    − drift_findings_excluded_duplicate.tsv     同一機能内の重複
    − drift_findings_excluded_entrypoint.tsv    利用者視点の入口
    − drift_findings_excluded_front_legacy.tsv    フロント×現行ソース比較
    − drift_findings_excluded_wording_legacy.tsv  現行ソース比較×表示文言
    − drift_findings_excluded_backlog_duplicate.tsv Backlog課題と重複
    = drift_findings_list_remaining.tsv

各除外リストの `drift行番号` は元 TSV の行番号（ヘッダ込み）。同じ行が複数の
除外リストに現れていないかも検査し、重なりがあれば異常終了する。
"""
import csv
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
SRC = BASE / "drift_findings_list_effort.tsv"
EXCLUSIONS = [
    ("duplicate", "同一機能内の重複"),
    ("entrypoint", "利用者視点の入口"),
    ("front_legacy", "フロント×現行ソース比較"),
    ("wording_legacy", "現行ソース比較×表示文言"),
    ("backlog_duplicate", "Backlog課題と重複"),
]


def main() -> int:
    rows = list(csv.DictReader(SRC.open(encoding="utf-8"), delimiter="\t"))
    idx = {i + 2: r for i, r in enumerate(rows)}

    dropped, owner = set(), {}
    report = []
    for name, label in EXCLUSIONS:
        p = BASE / f"drift_findings_excluded_{name}.tsv"
        if not p.exists():
            print(f"除外リストが無い: {p.name}", file=sys.stderr)
            return 1
        lns = [int(r["drift行番号"]) for r in
               csv.DictReader(p.open(encoding="utf-8"), delimiter="\t")]
        dup = sorted(set(lns) & dropped)
        if dup:
            print(f"{p.name} が既存の除外と重複: {dup}", file=sys.stderr)
            return 1
        if len(set(lns)) != len(lns):
            print(f"{p.name} 内に同じ行が複数ある", file=sys.stderr)
            return 1
        bad = [ln for ln in lns if ln not in idx]
        if bad:
            print(f"{p.name} に元TSVに無い行番号: {bad}", file=sys.stderr)
            return 1
        dropped |= set(lns)
        for ln in lns:
            owner[ln] = label
        report.append((label, p.name, len(lns)))

    remaining = [idx[ln] for ln in sorted(idx) if ln not in dropped]
    with (BASE / "drift_findings_list_remaining.tsv").open("w", encoding="utf-8",
                                                           newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), delimiter="\t",
                           lineterminator="\n")
        w.writeheader()
        w.writerows(remaining)

    def hours(rs):
        s = 0.0
        for r in rs:
            try:
                s += float(r["codex工数"])
            except (TypeError, ValueError):
                pass
        return s

    lines = [
        "# 除外の内訳と残り",
        "",
        "`drift_findings_list_effort.tsv`（1034件）から除外リストを順に引いた結果。",
        "",
        "| 除外 | ファイル | 件数 | codex工数 |",
        "|---|---|---:|---:|",
    ]
    for label, fname, n in report:
        hs = hours([idx[ln] for ln in dropped if owner[ln] == label])
        lines.append(f"| {label} | `{fname}` | {n} | {hs:.2f}人日 |")
    lines += [
        f"| **除外計** | | **{len(dropped)}** | **{hours([idx[l] for l in dropped]):.2f}人日** |",
        f"| **残り** | `drift_findings_list_remaining.tsv` | **{len(remaining)}** | "
        f"**{hours(remaining):.2f}人日** |",
        "",
        f"元: {len(rows)}件 / {hours(rows):.2f}人日",
        "",
    ]
    (BASE / "EXCLUSION_SUMMARY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    for label, fname, n in report:
        print(f"  {label}: {n}")
    print(f"除外計={len(dropped)} 残り={len(remaining)} "
          f"工数 {hours(rows):.2f} → {hours(remaining):.2f}人日")
    return 0


if __name__ == "__main__":
    sys.exit(main())
