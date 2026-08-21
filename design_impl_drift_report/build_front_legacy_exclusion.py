#!/usr/bin/env python3
"""フロント機能のうち、現行ソースとの比較で挙がった指摘を除外リストにする。

判定は `確定根拠区分` で行う。この列は再検証で確定させた「期待挙動の裏付けがどこに
あるか」で、`LEGACY_BACKED` は Excel正本に記述が無く旧実装（pf-eccube3）にだけ
根拠がある＝現行ソースとの比較で挙がった指摘、を意味する。`SPEC_BACKED`
（Excel正本に裏付けがある）は残す。

  対象 = 区分(画面種別) が front かつ 確定根拠区分 が LEGACY_BACKED

入力: drift_findings_list_effort.tsv
出力: drift_findings_excluded_front_legacy.tsv
      FRONT_LEGACY_EXCLUSION.md
最終リストの組み立ては build_remaining_list.py が行う。
"""
import csv
import sys
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parent
SCREEN = "front"
CLASS = "LEGACY_BACKED"


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

    # 既に別の理由で除外済みの行は二重に数えない
    prior = {}
    for name in ("duplicate", "entrypoint"):
        p = BASE / f"drift_findings_excluded_{name}.tsv"
        if p.exists():
            for r in csv.DictReader(p.open(encoding="utf-8"), delimiter="\t"):
                prior[int(r["drift行番号"])] = name

    front = [ln for ln, r in idx.items() if r["区分(画面種別)"] == SCREEN]
    target = [ln for ln in front if idx[ln]["確定根拠区分"] == CLASS]
    excluded, already = [], []
    for ln in target:
        if ln in prior:
            already.append((ln, prior[ln]))
            continue
        r = dict(idx[ln])
        r["除外理由"] = ("フロント挙動の指摘で、根拠がExcel設計書ではなく"
                     "現行ソース(pf-eccube3)との比較")
        r["除外根拠"] = f"区分(画面種別)={SCREEN} かつ 確定根拠区分={CLASS}"
        r["drift行番号"] = ln
        excluded.append(r)

    fields = list(rows[0].keys()) + ["除外理由", "除外根拠", "drift行番号"]
    with (BASE / "drift_findings_excluded_front_legacy.tsv").open("w", encoding="utf-8",
                                                                  newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, delimiter="\t", lineterminator="\n",
                           extrasaction="ignore")
        w.writeheader()
        for r in excluded:
            w.writerow({k: (v.replace("\t", " ").replace("\n", " ") if isinstance(v, str) else v)
                        for k, v in r.items()})

    kept = [ln for ln in front if ln not in target and ln not in prior]
    lines = [
        "# フロント × 現行ソース比較の指摘 除外",
        "",
        "フロント機能（`区分(画面種別)=front`、機能No が F 始まり）の指摘のうち、",
        "期待挙動の裏付けが Excel正本ではなく旧実装 pf-eccube3 にしかないもの",
        "（`確定根拠区分=LEGACY_BACKED`）を除外した。",
        "Excel設計書に裏付けのある `SPEC_BACKED` は残している。",
        "",
        "| | 件数 | codex工数 |",
        "|---|---:|---:|",
        f"| フロント指摘（1034件中） | {len(front)} | {hours([idx[l] for l in front]):.2f}人日 |",
        f"| うち現行ソース比較（{CLASS}） | {len(target)} | {hours([idx[l] for l in target]):.2f}人日 |",
        f"| うち既に別理由で除外済み | {len(already)} | — |",
        f"| **今回の除外** | **{len(excluded)}** | **{hours(excluded):.2f}人日** |",
        f"| 残すフロント指摘 | {len(kept)} | {hours([idx[l] for l in kept]):.2f}人日 |",
        "",
        "残すフロント指摘の根拠区分の内訳: "
        + " / ".join(f"{k} {v}件" for k, v in Counter(
            idx[l]["確定根拠区分"] for l in kept).most_common()) + "。",
        "",
        f"除外リスト: `drift_findings_excluded_front_legacy.tsv`（{len(excluded)}件）",
        "",
        "## 除外した指摘",
        "",
        "| drift行 | 機能No | 機能名 | 優先度 | 工数 | トリアージ区分 | 内容 |",
        "|---:|---|---|---|---:|---|---|",
    ]
    for r in excluded:
        exp = r["設計期待値"].replace("\n", " ")[:60]
        lines.append(f"| {r['drift行番号']} | {r['機能No']} | {r['機能名']} | {r['優先度']} | "
                     f"{r['codex工数']} | {r['トリアージ区分']} | {exp} |")
    if already:
        lines += ["", "## 既に別理由で除外済み", "",
                  "| drift行 | 先に除外した理由 |", "|---:|---|"]
        for ln, why in already:
            lines.append(f"| {ln} | {why} |")
    lines.append("")
    (BASE / "FRONT_LEGACY_EXCLUSION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"front={len(front)} 現行ソース比較={len(target)} 既除外={len(already)} "
          f"今回除外={len(excluded)} 残すフロント={len(kept)} "
          f"除外工数={hours(excluded):.2f}人日")
    return 0


if __name__ == "__main__":
    sys.exit(main())
