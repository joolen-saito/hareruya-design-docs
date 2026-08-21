#!/usr/bin/env python3
"""「利用者視点の入口」に関する指摘を除外リストへ移す。

対象は、設計期待値・実装実態・差分内容・観点のいずれかに `利用者視点の入口`
（表記ゆれ `入り口` を含む）と明記されている行だけ。抽出は機械で行い、
拾った行番号が VERIFIED と一致しなければ異常終了する（黙って範囲が動かないため）。
22件は全て、URLパス・ルート名・コンソールコマンド名といった
「その機能にどう辿り着くか」の契約不一致であることを1件ずつ読んで確認した。

入力: drift_findings_list_effort.tsv（1034件）
      drift_findings_excluded_duplicate.tsv（重複除外76件。二重計上を避けるため参照）
出力: drift_findings_excluded_entrypoint.tsv … 除外リスト
      ENTRYPOINT_EXCLUSION.md                … サマリ
最終リストの組み立ては build_remaining_list.py が行う。
"""
import csv
import re
import sys
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parent
PAT = re.compile(r"利用者視点の(入口|入り口)")
COLS = ("設計期待値", "実装実態", "差分内容", "観点")

# 目視確認済みの対象行（drift_findings_list_effort.tsv の行番号／ヘッダ込み）
VERIFIED = {
    73, 77, 182, 186, 189, 191, 197, 213, 306, 375, 386, 629,
    680, 799, 832, 864, 881, 890, 1012, 1019, 1024, 1028,
}


def main() -> int:
    rows = list(csv.DictReader((BASE / "drift_findings_list_effort.tsv").open(encoding="utf-8"),
                               delimiter="\t"))
    idx = {i + 2: r for i, r in enumerate(rows)}

    hit = {ln for ln, r in idx.items() if PAT.search(" ".join(r[c] for c in COLS))}
    if hit != VERIFIED:
        print(f"抽出が VERIFIED と一致しない: 増={sorted(hit - VERIFIED)} "
              f"減={sorted(VERIFIED - hit)}", file=sys.stderr)
        return 1

    dup = {int(r["drift行番号"]): r for r in
           csv.DictReader((BASE / "drift_findings_excluded_duplicate.tsv").open(encoding="utf-8"),
                          delimiter="\t")}
    keep_of = {}
    for r in dup.values():
        keep_of.setdefault(int(r["統合先drift行番号"]), []).append(int(r["drift行番号"]))

    excluded, already, reps = [], [], []
    for ln in sorted(hit):
        r = dict(idx[ln])
        note = ""
        if ln in dup:
            # 重複除外で既に落ちている行。ここで二重に数えない。
            already.append((ln, int(dup[ln]["統合先drift行番号"])))
            continue
        if ln in keep_of:
            note = ("重複クラスタの代表。統合先として残していた行なので、"
                    f"クラスタ({','.join(str(x) for x in sorted(keep_of[ln] + [ln]))})ごと除外になる")
            reps.append((ln, keep_of[ln]))
        r["除外理由"] = "利用者視点の入口（URL・ルート名・コンソールコマンド名など到達手段）の契約不一致"
        r["除外根拠"] = "設計期待値・実装実態・差分内容・観点に『利用者視点の入口』と明記"
        r["重複除外との関係"] = note
        r["drift行番号"] = ln
        excluded.append(r)

    ex_fields = list(rows[0].keys()) + ["除外理由", "除外根拠", "重複除外との関係", "drift行番号"]
    with (BASE / "drift_findings_excluded_entrypoint.tsv").open("w", encoding="utf-8",
                                                                newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=ex_fields, delimiter="\t", lineterminator="\n",
                           extrasaction="ignore")
        w.writeheader()
        for r in excluded:
            w.writerow({k: (v.replace("\t", " ").replace("\n", " ") if isinstance(v, str) else v)
                        for k, v in r.items()})

    def hours(rs):
        s = 0.0
        for r in rs:
            try:
                s += float(r["codex工数"])
            except (TypeError, ValueError):
                pass
        return s

    lines = [
        "# 「利用者視点の入口」指摘の除外",
        "",
        "`利用者視点の入口` と明記された指摘を除外リストへ移した。",
        "URLパス・ルート名・HTTPメソッド・コンソールコマンド名といった",
        "「その機能にどう辿り着くか」の契約不一致で、実装の挙動そのものへの指摘ではない。",
        "",
        "| | 件数 | codex工数 |",
        "|---|---:|---:|",
        f"| 抽出（1034件中） | {len(hit)} | {hours([idx[l] for l in hit]):.2f}人日 |",
        f"| うち重複除外で既に落ちている行 | {len(already)} | — |",
        f"| **今回の除外** | **{len(excluded)}** | **{hours(excluded):.2f}人日** |",
        "",
        f"- 除外リスト: `drift_findings_excluded_entrypoint.tsv`（{len(excluded)}件）",
        "- 残りリストの組み立ては `build_remaining_list.py`（`EXCLUSION_SUMMARY.md`）。",
        "- 抽出22件のトリアージ区分: "
        + " / ".join(f"{k} {v}件" for k, v in sorted(
            Counter(idx[l]["トリアージ区分"] for l in hit).items(), key=lambda kv: -kv[1]))
        + "。優先度: "
        + " / ".join(f"{k} {v}件" for k, v in sorted(
            Counter(idx[l]["優先度"] for l in hit).items()))
        + "。",
        "",
        "## 対象",
        "",
        "| drift行 | 機能No | 機能名 | 優先度 | 工数 | 入口の内容 |",
        "|---:|---|---|---|---:|---|",
    ]
    for r in excluded:
        exp = r["設計期待値"].replace("\n", " ")[:70]
        lines.append(f"| {r['drift行番号']} | {r['機能No']} | {r['機能名']} | {r['優先度']} | "
                     f"{r['codex工数']} | {exp} |")

    lines += ["", "## 注意（重複除外との関係）", ""]
    if reps:
        lines.append("次の行は重複クラスタの代表として残していたものなので、クラスタごと消える。")
        lines.append("")
        lines.append("| 代表行 | 同時に消えるクラスタ内の行 |")
        lines.append("|---:|---|")
        for ln, members in reps:
            lines.append(f"| {ln} | {', '.join(str(m) for m in sorted(members))} |")
        lines.append("")
    if already:
        lines += [
            "次の行は既に重複除外済みで、統合先の行が残っている。",
            "統合先は同じ入口契約の指摘だが本文に『利用者視点の入口』の語が無く、",
            "今回の抽出条件（語の明記）では拾えていない。**扱いの判断が要る。**",
            "",
            "| 入口として抽出された行 | 統合先として残っている行 |",
            "|---:|---:|",
        ]
        for ln, keep in already:
            lines.append(f"| {ln}（除外済み） | **{keep}（残っている）** |")
        lines.append("")

    (BASE / "ENTRYPOINT_EXCLUSION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"抽出={len(hit)} 既に重複除外={len(already)} 今回除外={len(excluded)} "
          f"除外工数={hours(excluded):.2f}人日 代表行={len(reps)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
