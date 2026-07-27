"""fid_kubun.tsv からT2対象集合を機械抽出し、計画側集合との差分を報告する。

仕様冒頭の確認事項:
  「CONCRETIZATION_ROLLOUT_PLAN.md は T2 を305機能と記載する一方、現行
  fid_kubun.tsv ヘッダは excel_pf=306 と記録している。本ツールの対象集合は
  件数をコードへ固定せず、実行時の fid_kubun.tsv から抽出し、計画側との集合
  差分を exit 1 とする。」

このモジュールは件数をハードコードしない。fid_kubun.tsv を都度パースし、
CONCRETIZATION_ROLLOUT_PLAN.md の §0.2 表(総数/候補確定/残)を正規表現で
抽出して算術的に整合するか照合する。
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .errors import FidSetMismatchError, SourceReadError

T2_SOURCE_CLASS = "excel-primary+pf-fallback"


@dataclass
class FidRow:
    function_no: str
    fid: str
    function_name: str
    status: str
    customization: str
    design_md: str
    source_class: str
    held: str


def parse_fid_kubun_tsv(path: Path) -> list[FidRow]:
    rows: list[FidRow] = []
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()
    header_idx = None
    for i, line in enumerate(lines):
        if line.startswith("機能No\t"):
            header_idx = i
            break
    if header_idx is None:
        raise SourceReadError(f"{path}: header row starting with '機能No' not found")
    for line in lines[header_idx + 1 :]:
        line = line.rstrip("\n")
        if not line.strip():
            continue
        cols = line.split("\t")
        while len(cols) < 8:
            cols.append("")
        rows.append(
            FidRow(
                function_no=cols[0],
                fid=cols[1],
                function_name=cols[2],
                status=cols[3],
                customization=cols[4],
                design_md=cols[5],
                source_class=cols[6],
                held=cols[7],
            )
        )
    return rows


def t2_candidate_fids(rows: list[FidRow]) -> list[FidRow]:
    """T2候補 = source_class許可 == excel-primary+pf-fallback かつ 保留 != 1。"""
    return [r for r in rows if r.source_class == T2_SOURCE_CLASS and r.held.strip() != "1"]


_PLAN_ROW_RE = re.compile(
    r"\|\s*T2\s*現行踏襲・カスタマイズ[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*\*\*(\d+)\*\*\s*\|"
)


@dataclass
class PlanReconciliation:
    tsv_total: int
    plan_total: int
    plan_confirmed: int
    plan_remaining: int
    arithmetic_ok: bool
    totals_match: bool

    @property
    def ok(self) -> bool:
        return self.arithmetic_ok and self.totals_match


def reconcile_with_plan(fid_kubun_path: Path, rollout_plan_path: Path) -> PlanReconciliation:
    rows = parse_fid_kubun_tsv(fid_kubun_path)
    candidates = t2_candidate_fids(rows)
    tsv_total = len(candidates)

    plan_text = Path(rollout_plan_path).read_text(encoding="utf-8")
    m = _PLAN_ROW_RE.search(plan_text)
    if not m:
        raise FidSetMismatchError(
            f"could not locate T2 row in {rollout_plan_path} (pattern did not match; "
            "plan document format may have changed - manual reconciliation required)"
        )
    plan_total, plan_confirmed, plan_remaining = (int(m.group(1)), int(m.group(2)), int(m.group(3)))

    arithmetic_ok = (plan_total - plan_confirmed) == plan_remaining
    totals_match = tsv_total == plan_total

    result = PlanReconciliation(
        tsv_total=tsv_total,
        plan_total=plan_total,
        plan_confirmed=plan_confirmed,
        plan_remaining=plan_remaining,
        arithmetic_ok=arithmetic_ok,
        totals_match=totals_match,
    )
    if not result.ok:
        raise FidSetMismatchError(
            f"T2 set mismatch: fid_kubun.tsv extracted {tsv_total} candidates "
            f"(source_class={T2_SOURCE_CLASS}, 保留=0) but "
            f"{rollout_plan_path} declares 総数={plan_total} 候補確定={plan_confirmed} "
            f"残={plan_remaining} (arithmetic_ok={arithmetic_ok} totals_match={totals_match})"
        )
    return result
