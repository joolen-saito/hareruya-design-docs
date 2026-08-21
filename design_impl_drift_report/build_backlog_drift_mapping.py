#!/usr/bin/env python3
"""重複と判定した Backlog課題 と 乖離指摘 の対応表を出す。

review_backlog_drift_duplicates.py の判定結果を、両側から引ける形に組み直す。
  ① 乖離行 → 課題（乖離側を直すとどの課題が消えるか）
  ② 課題 → 乖離行（課題をクローズしてよいかを課題側から確かめる）

出力: BACKLOG_DRIFT_MAPPING.md
      backlog_wip/backlog_drift_mapping.tsv
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

csv.field_size_limit(10 ** 9)

BASE = Path(__file__).resolve().parent
DUP = BASE / "backlog_wip" / "backlog_drift_duplicates.tsv"
DRIFT = BASE / "drift_findings_list_effort.tsv"
MODULE = {
    "F": "フロント", "M": "管理画面", "A": "API", "B": "バッチ",
}


def cut(s: str, n: int) -> str:
    s = (s or "").replace("\n", " ").replace("|", "｜")
    return s if len(s) <= n else s[:n] + "…"


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main() -> int:
    pairs = list(csv.DictReader(DUP.open(encoding="utf-8"), delimiter="\t"))
    rows = list(csv.DictReader(DRIFT.open(encoding="utf-8"), delimiter="\t"))
    idx = {i + 2: r for i, r in enumerate(rows)}

    by_row = defaultdict(list)
    for p in pairs:
        by_row[int(p["drift行番号"])].append(p)

    dup_rows = sorted({int(p["drift行番号"]) for p in pairs if p["判定"] == "重複"})
    part_rows = sorted({int(p["drift行番号"]) for p in pairs if p["判定"] == "部分重複"})
    n_dup = sum(1 for p in pairs if p["判定"] == "重複")
    n_part = sum(1 for p in pairs if p["判定"] == "部分重複")

    hours = sum(v for v in (num(idx[ln]["codex工数"]) for ln in dup_rows) if v is not None)

    with (BASE / "backlog_wip" / "backlog_drift_mapping.tsv").open(
            "w", encoding="utf-8", newline="") as fh:
        fields = ["判定", "drift行番号", "乖離機能No", "乖離機能名", "乖離優先度",
                  "乖離トリアージ区分", "乖離codex工数", "乖離設計期待値", "乖離差分内容",
                  "課題キー", "状態", "件名", "重複と判断した理由"]
        w = csv.DictWriter(fh, fieldnames=fields, delimiter="\t", lineterminator="\n",
                           extrasaction="ignore")
        w.writeheader()
        for p in sorted(pairs, key=lambda p: (p["乖離機能No"], int(p["drift行番号"]))):
            w.writerow(p)

    lines = [
        "# 重複した Backlog課題 ⇔ 設計書乖離指摘 の対応表",
        "",
        f"重複 **{n_dup}件**（乖離側 {len(dup_rows)}行）／部分重複 **{n_part}件**"
        f"（乖離側 {len(part_rows)}行）。",
        "課題数と乖離行数が合わないのは、1つの乖離行に複数の課題がぶら下がっているため。",
        "",
        f"重複{len(dup_rows)}行の乖離側 codex工数の合計: {hours:.2f}人日"
        "（この改修で対応する課題も同時に消える想定）。",
        "",
        "判定の根拠と機械突合のスコアは `backlog_wip/backlog_drift_duplicates.tsv`、",
        "この表そのものは `backlog_wip/backlog_drift_mapping.tsv` にも同じ内容がある。",
        "",
        "---",
        "",
        "## ① 乖離行 → Backlog課題",
        "",
        "乖離側を直したときに閉じられる課題の一覧。乖離の `行` は"
        " `drift_findings_list_effort.tsv` の行番号（ヘッダ込み）。",
        "",
    ]

    for label, target in (("重複", dup_rows), ("部分重複", part_rows)):
        lines += [f"### {label}", ""]
        cur_mod = None
        for ln in sorted(target, key=lambda x: (idx[x]["機能No"], x)):
            d = idx[ln]
            mod = MODULE.get(d["機能No"][0], "その他")
            if mod != cur_mod:
                cur_mod = mod
                lines += ["", f"#### {mod}", ""]
            ps = [p for p in by_row[ln] if p["判定"] == label]
            lines += [
                f"**行{ln}｜{d['機能No']} {d['機能名']}｜{d['優先度']}｜"
                f"{d['トリアージ区分']}｜工数 {d['codex工数'] or '—'}人日**",
                "",
                f"- 設計期待値: {cut(d['設計期待値'], 160)}",
                f"- 差分内容: {cut(d['差分内容'], 160)}",
            ]
            for p in ps:
                lines.append(f"- ⇔ **{p['課題キー']}**（{p['状態']}）{cut(p['件名'], 100)}")
                lines.append(f"    - 対応の根拠: {p['重複と判断した理由']}")
                if label == "部分重複":
                    lines.append("    - **クローズ前の確認点**: 上記のとおり範囲がずれる")
            lines.append("")

    lines += [
        "---",
        "",
        "## ② Backlog課題 → 乖離行",
        "",
        "課題キー順。クローズ検討時にこの表から引く。",
        "",
        "| 課題キー | 状態 | 件名 | 判定 | 乖離行 | 機能No | 機能名 | 優先度 | 工数 |",
        "|---|---|---|---|---:|---|---|---|---:|",
    ]
    for p in sorted(pairs, key=lambda p: int(p["課題キー"].rsplit("-", 1)[1])):
        d = idx[int(p["drift行番号"])]
        lines.append(
            f"| {p['課題キー']} | {p['状態']} | {cut(p['件名'], 58)} | {p['判定']} | "
            f"行{p['drift行番号']} | {d['機能No']} | {cut(d['機能名'], 28)} | "
            f"{d['優先度']} | {d['codex工数'] or '—'} |")

    multi = {ln: v for ln, v in by_row.items() if len(v) > 1}
    lines += [
        "", "---", "",
        "## ③ 1つの乖離行に複数の課題がぶら下がるもの",
        "",
        f"{len(multi)}行。Backlog側どうしも重複している可能性がある組み合わせ。",
        "",
        "| 乖離行 | 機能No | 内容 | 課題キー |",
        "|---:|---|---|---|",
    ]
    for ln, ps in sorted(multi.items()):
        d = idx[ln]
        lines.append(f"| {ln} | {d['機能No']} | {cut(d['設計期待値'], 50)} | "
                     + ", ".join(p["課題キー"].replace("ECCUBE_HARERUYA-", "#") for p in ps) + " |")
    lines.append("")

    (BASE / "BACKLOG_DRIFT_MAPPING.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"重複 {n_dup}件/{len(dup_rows)}行、部分重複 {n_part}件/{len(part_rows)}行、"
          f"複数ぶら下がり {len(multi)}行、乖離側工数 {hours:.2f}人日")
    return 0


if __name__ == "__main__":
    sys.exit(main())
