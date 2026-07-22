#!/usr/bin/env python3
"""業務フロー補記依頼リスト生成器。

固定辞書(BUSINESS_EDGE_CASES / PATTERN_EDGE_CASES)由来で生成していた異常/代替シナリオは、
業務フロー原典に無い条件を捏造していたため generate_scenarios.py から除去した(捏造ゼロ)。
本リストは、その除去された条件を業務別に一覧化し、業務側が「フローに実在するか」を判断して
**業務フロー markdown に分岐ステップを補記→再生成**することで、出典を持って正当に復活させる
ための依頼書である(依頼者確定: 業務側補記で復活=方針B)。

業務側の記入: 各行の「判定」に次のいずれかを記入する。
  実在  : この分岐は業務フローに実在する → 業務フロー markdown に分岐ステップを追記する
          (追記後 generate_scenarios.py を再生成すると、原典由来の異常/代替シナリオとして復活)
  不要  : この分岐は実装/運用に存在しない → シナリオ化しない
  結合  : 機構的異常(権限/必須/重複/0件等)であり結合テスト層(IT-*)で担保 → 本層では不要

このリスト自体は復活シナリオを作らない。復活は業務フロー原典への補記が前提(捏造ゼロを保つ)。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".")
    args = ap.parse_args()
    repo = Path(args.repo).resolve()
    sys.path.insert(0, str(repo / ".codex/skills/hareruya-scenario-test-cases/scripts"))
    import generate_scenarios as g  # noqa: E402

    lines: list[str] = []
    lines.append("# 業務フロー補記依頼リスト（削除した異常/代替分岐の復活候補）")
    lines.append("")
    lines.append("- 生成元: `generate_scenarios.py` の固定辞書 BUSINESS_EDGE_CASES / PATTERN_EDGE_CASES")
    lines.append("  （`tools/build_flow_supplement_list.py` で抽出）")
    lines.append("- 背景: これらの条件は業務フロー原典に無いのに異常/代替シナリオを生成しており、捏造ゼロのため除去した。")
    lines.append("- 目的: 業務側が「フローに実在するか」を判断し、実在するものは**業務フロー markdown に分岐ステップを追記**して")
    lines.append("  再生成すれば、原典由来の正当なシナリオとして復活する（＝方針B: 業務側補記で復活）。")
    lines.append("")
    lines.append("## 業務側にお願いすること")
    lines.append("")
    lines.append("各行の **判定** 列に記入してください（それ以外は記入不要）。")
    lines.append("")
    lines.append("| 記入 | 意味 | その後の扱い |")
    lines.append("|---|---|---|")
    lines.append("| **実在** | この分岐は業務フローに実在する | 該当の業務フロー markdown（`scenario_test/markdown/*.md`）に分岐ステップを追記→再生成で復活 |")
    lines.append("| **不要** | 実装/運用に存在しない | シナリオ化しない |")
    lines.append("| **結合** | 機構的異常（権限/必須/重複/0件等）で結合テスト層(IT-*)が担保 | 本層では不要 |")
    lines.append("")
    lines.append("補足: このリストは復活シナリオを作りません。復活は業務フロー原典への補記が前提です（捏造ゼロを保つため）。")
    lines.append("")

    def emit(title: str, entries: list[tuple[str, str, str, str, str]]) -> None:
        lines.append(f"## {title}（{len(entries)}件）")
        lines.append("")
        lines.append("| 業務/パターン | 種別 | 条件（削除された分岐） | 期待挙動 | 確認対象 | 判定(実在/不要/結合) |")
        lines.append("|---|---|---|---|---|---|")
        for key, kind, cond, expected, obs in entries:
            k = "異常" if kind == "E" else "代替"
            lines.append(f"| {key} | {k} | {cond} | {expected} | {obs} |  |")
        lines.append("")

    biz_entries = [
        (biz, c.kind, c.condition, c.expected, c.observation)
        for biz, cases in g.BUSINESS_EDGE_CASES.items()
        for c in cases
    ]
    pat_entries = [
        (key, c.kind, c.condition, c.expected, c.observation)
        for key, cases in g.PATTERN_EDGE_CASES.items()
        for c in cases
    ]
    emit("業務単位（BUSINESS_EDGE_CASES）", biz_entries)
    emit("パターン単位（PATTERN_EDGE_CASES）", pat_entries)

    # 原典に分岐記述はあるが、判断ノード/継続行のため生成器が独立シナリオ化できていないもの。
    # これらは補記ではなく「業務フロー本文で分岐を独立ステップ化」すると復活する（codexレビュー指摘）。
    lines.append("## 原典に実在するが未分離の分岐（判断ノード/継続行のため取りこぼし）")
    lines.append("")
    lines.append("下記は業務フロー原典に分岐が**実在する**が、判断ノードや継続行の形のため生成器が独立")
    lines.append("シナリオにできていない。業務フロー本文で分岐を独立した作業ステップ（`**[＃]**`行）にすると復活する。")
    lines.append("")
    lines.append("| 業務フロー出典 | 分岐 | 現状 |")
    lines.append("|---|---|---|")
    lines.append("| `08_イベント管理.md` R161-162 | 会員登録有無で「拒否された場合はポイント受取拒否とみなして終了」 | 会員登録有無の代替経路に混在。拒否→終了の独立確認なし |")
    lines.append("| `14_ネット買取.md` R154-155,181 | 売却するか判定で「売却しない場合は着払いによる返送処理」 | 振込経路に混在。売却しない→返送の独立確認なし |")
    lines.append("")

    out = repo / "scenario_test" / "scenario" / "13_業務フロー補記依頼リスト.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out} (BUSINESS={len(biz_entries)} PATTERN={len(pat_entries)})")


if __name__ == "__main__":
    main()
