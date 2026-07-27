"""承認済み `block-manifest.json` の読み書き(仕様§1・§2.3)。

manifest.json は「fid → workbook SHA-256, sheet, start_row, end_row, 根拠セル」
を持つ境界台帳であり、人手が detect() の検出レポートのアドレスだけを根拠に
承認・更新する。extract は manifest のエントリが無い、または現在のブックの
SHA-256と一致しない場合は ManifestApprovalError(exit1)とする。
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

from .canonical import BlockRange
from .errors import ManifestApprovalError


@dataclass
class ManifestEntry:
    fid: str
    function_no: str
    workbook_file: str
    workbook_sha256: str
    sheet_name: str
    sheet_index: int
    row_start: int
    row_end: int
    col_start: int
    col_end: int
    boundary_evidence: list[str]
    approved_by: str
    approved_at: str
    notes: str = ""

    def block(self) -> BlockRange:
        return BlockRange(
            row_start=self.row_start,
            row_end=self.row_end,
            col_start=self.col_start,
            col_end=self.col_end,
        )


def load_manifest(path: Path) -> dict[str, ManifestEntry]:
    p = Path(path)
    if not p.exists():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
    entries: dict[str, ManifestEntry] = {}
    for fid, raw in data.get("entries", {}).items():
        entries[fid] = ManifestEntry(
            fid=fid,
            function_no=raw["function_no"],
            workbook_file=raw["workbook_file"],
            workbook_sha256=raw["workbook_sha256"],
            sheet_name=raw["sheet_name"],
            sheet_index=raw["sheet_index"],
            row_start=raw["row_start"],
            row_end=raw["row_end"],
            col_start=raw["col_start"],
            col_end=raw["col_end"],
            boundary_evidence=raw.get("boundary_evidence", []),
            approved_by=raw.get("approved_by", ""),
            approved_at=raw.get("approved_at", ""),
            notes=raw.get("notes", ""),
        )
    return entries


def save_manifest(path: Path, entries: dict[str, ManifestEntry]) -> None:
    data = {
        "schema_version": "1.0",
        "entries": {fid: asdict(e) for fid, e in sorted(entries.items())},
    }
    Path(path).write_text(
        json.dumps(data, sort_keys=True, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def require_approved_entry(entries: dict[str, ManifestEntry], fid: str, current_workbook_sha256: str) -> ManifestEntry:
    entry = entries.get(fid)
    if entry is None:
        raise ManifestApprovalError(
            f"no approved block-manifest.json entry for fid={fid}. "
            "Run `excel-preprocess detect --fid ...` to produce a detection report, "
            "then have a human add/approve an entry before extract."
        )
    if entry.workbook_sha256 != current_workbook_sha256:
        raise ManifestApprovalError(
            f"manifest SHA mismatch for fid={fid}: manifest declares "
            f"{entry.workbook_sha256} but current workbook is {current_workbook_sha256} "
            f"(book={entry.workbook_file}). Re-approve manifest after confirming the change."
        )
    return entry
