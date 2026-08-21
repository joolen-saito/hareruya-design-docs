#!/usr/bin/env python3
"""Backlog課題と重複している乖離指摘を除外リストにする。

Backlog側にチケットが立っていて追跡されているので、乖離リスト側からは落とす。
対象は review_backlog_drift_duplicates.py で「重複」と判定した74課題が指す乖離行。
「部分重複」8課題は範囲がずれるため対象にしない。

  74課題 → 乖離61行（1行に複数課題がぶら下がるため件数が合わない）

先行する除外との整合を2つ取る。
  1. 同一機能内の重複で既に統合された行は、その統合先の行へ付け替える
     （統合先が生きている＝同じ欠陥がそちらに残っているため）
  2. 既に別の理由で除外済みの行は二重に数えない

入力: drift_findings_list_effort.tsv
      backlog_wip/backlog_drift_mapping.tsv
      drift_findings_excluded_*.tsv（先行分）
出力: drift_findings_excluded_backlog_duplicate.tsv
      BACKLOG_DUPLICATE_EXCLUSION.md
最終リストの組み立ては build_remaining_list.py が行う。
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

csv.field_size_limit(10 ** 9)

BASE = Path(__file__).resolve().parent
MAP = BASE / "backlog_wip" / "backlog_drift_mapping.tsv"
PRIOR = ("duplicate", "entrypoint", "front_legacy", "wording_legacy")


def hours(rs):
    s = 0.0
    for r in rs:
        try:
            s += float(r["codex工数"])
        except (TypeError, ValueError):
            pass
    return s


def main() -> int:
    rows = list(csv.DictReader((BASE / "drift_findings_list_effort.tsv").open(encoding="utf-8"),
                               delimiter="\t"))
    idx = {i + 2: r for i, r in enumerate(rows)}

    prior, merged_into = {}, {}
    for name in PRIOR:
        p = BASE / f"drift_findings_excluded_{name}.tsv"
        if not p.exists():
            print(f"先行の除外リストが無い: {p.name}", file=sys.stderr)
            return 1
        for r in csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"):
            ln = int(r["drift行番号"])
            prior[ln] = name
            if name == "duplicate":
                merged_into[ln] = int(r["統合先drift行番号"])

    pairs = [r for r in csv.DictReader(MAP.open(encoding="utf-8"), delimiter="\t")
             if r["判定"] == "重複"]

    tickets = defaultdict(list)   # 除外対象行 -> 課題
    redirected, already = [], []
    for p in pairs:
        ln = int(p["drift行番号"])
        note = ""
        if ln in merged_into:
            # 同一機能内の重複で統合済み。同じ欠陥は統合先に残っているのでそちらへ
            tgt = merged_into[ln]
            redirected.append((p["課題キー"], ln, tgt))
            note = f"行{ln}は同一機能内の重複で行{tgt}へ統合済みのため付け替え"
            ln = tgt
        if ln in prior:
            already.append((p["課題キー"], ln, prior[ln]))
            continue
        tickets[ln].append((p, note))

    excluded = []
    for ln in sorted(tickets):
        r = dict(idx[ln])
        ts = tickets[ln]
        r["除外理由"] = "Backlogに同じ欠陥の課題があり、そちらで追跡されている"
        r["対応するBacklog課題"] = ",".join(p["課題キー"] for p, _ in ts)
        r["Backlog課題の状態"] = ",".join(p["状態"] for p, _ in ts)
        r["Backlog課題件数"] = len(ts)
        r["Backlog課題の件名"] = " ／ ".join(
            p["件名"].replace("\t", " ").replace("\n", " ") for p, _ in ts)
        r["付け替えメモ"] = next((n for _, n in ts if n), "")
        r["drift行番号"] = ln
        excluded.append(r)

    fields = list(rows[0].keys()) + [
        "除外理由", "対応するBacklog課題", "Backlog課題の状態", "Backlog課題件数",
        "Backlog課題の件名", "付け替えメモ", "drift行番号"]
    with (BASE / "drift_findings_excluded_backlog_duplicate.tsv").open(
            "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter="\t", lineterminator="\n",
                           extrasaction="ignore")
        w.writeheader()
        for r in excluded:
            w.writerow({k: (v.replace("\t", " ").replace("\n", " ") if isinstance(v, str) else v)
                        for k, v in r.items()})

    covered = sum(int(r["Backlog課題件数"]) for r in excluded)
    lines = [
        "# Backlog課題と重複している乖離指摘の除外",
        "",
        "Backlog「不具合（バグ）」未対応・処理中の277件と突合し、**重複**と判定した",
        f"74課題が指す乖離指摘を除外した。Backlog側にチケットがあり、そちらで追跡されるため。",
        "「部分重複」8課題は範囲がずれるので対象にしていない。",
        "",
        "| | 件数 | codex工数 |",
        "|---|---:|---:|",
        f"| 重複と判定したBacklog課題 | 74 | — |",
        f"| それが指す乖離行 | {len({int(p['drift行番号']) for p in pairs})} | — |",
        f"| うち既に別の理由で除外済み | {len(already)} | — |",
        f"| **今回の除外** | **{len(excluded)}** | **{hours(excluded):.2f}人日** |",
        "",
        f"除外した{len(excluded)}行がカバーするBacklog課題: {covered}件。",
        "",
        "除外リスト: `drift_findings_excluded_backlog_duplicate.tsv`",
        "（乖離側の全63列＋`対応するBacklog課題`・`Backlog課題の状態`・`Backlog課題件数`・"
        "`Backlog課題の件名`・`付け替えメモ`）",
        "",
        "対応表そのものは `BACKLOG_DRIFT_MAPPING.md` を参照。",
        "",
    ]

    if redirected:
        lines += [
            "## 統合先への付け替え", "",
            "同一機能内の重複で既に統合された行を指していたもの。同じ欠陥は統合先に",
            "残っているので、統合先の行を除外した。",
            "",
            "| Backlog課題 | 突合した行 | 実際に除外した行 |", "|---|---:|---:|",
        ]
        for key, src, tgt in redirected:
            lines.append(f"| {key} | {src}（統合済み） | **{tgt}** |")
        lines.append("")

    if already:
        lines += [
            "## 既に別の理由で除外済み", "",
            "| Backlog課題 | 乖離行 | 先に除外した理由 |", "|---|---:|---|",
        ]
        for key, ln, why in already:
            lines.append(f"| {key} | {ln} | {why} |")
        lines.append("")

    lines += [
        "## 除外した乖離指摘",
        "",
        "| drift行 | 機能No | 機能名 | 優先度 | 工数 | 対応するBacklog課題 |",
        "|---:|---|---|---|---:|---|",
    ]
    for r in excluded:
        lines.append(f"| {r['drift行番号']} | {r['機能No']} | {r['機能名'][:26]} | "
                     f"{r['優先度']} | {r['codex工数'] or '—'} | "
                     + ", ".join(k.replace("ECCUBE_HARERUYA-", "#")
                                 for k in r["対応するBacklog課題"].split(",")) + " |")
    lines.append("")
    (BASE / "BACKLOG_DUPLICATE_EXCLUSION.md").write_text("\n".join(lines) + "\n",
                                                         encoding="utf-8")

    print(f"重複課題74 → 乖離行{len({int(p['drift行番号']) for p in pairs})} / "
          f"付け替え{len(redirected)} / 既除外{len(already)} / "
          f"今回除外{len(excluded)}行（課題{covered}件ぶん）工数{hours(excluded):.2f}人日")
    return 0


if __name__ == "__main__":
    sys.exit(main())
