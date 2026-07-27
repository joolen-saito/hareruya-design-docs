"""`extract` サブコマンドの実処理(仕様§1 I/O契約)。

入力: fid, fid_kubun.tsv, input-dir(原本.xlsx群), 承認済み block-manifest.json。
出力: excel_blocks/<fid>.json。

`load_workbook(..., data_only=True)` は使わない(そもそもopenpyxlを値取得に
使わない)。manifestに承認済みエントリが無い場合は ManifestApprovalError。
"""
from __future__ import annotations

import json
from pathlib import Path

from . import ooxml
from .canonical import build_block_model, load_workbook_reader
from .errors import SourceReadError, ToolError
from .fid_map import parse_fid_kubun_tsv
from .manifest import load_manifest, require_approved_entry


def _lookup_fid_row(fid_kubun_path: Path, fid: str):
    rows = parse_fid_kubun_tsv(fid_kubun_path)
    fid_lower = fid.lower()
    for r in rows:
        if r.fid.lower() == fid_lower or r.function_no.lower() == fid_lower:
            return r
    raise ToolError("FID_NOT_FOUND", f"fid {fid!r} not found in {fid_kubun_path}")


def extract(
    fid: str,
    fid_kubun_path: Path,
    input_dir: Path,
    manifest_path: Path,
    output_dir: Path,
) -> dict:
    entries = load_manifest(Path(manifest_path))

    # fid_kubun.tsv resolves short/canonical forms ("m03-11" or "M03-11") to
    # the full fid used as the manifest/output key. Golden/テスト専用の合成fid
    # (T2本番のfid_kubun.tsv行に対応しない、例: "m03-30-format-sheet")は
    # tsvに存在しないため、その場合は引数の fid をそのまま manifest キーとして
    # 扱い、function_no は人手承認済みmanifestエントリ自身の記述にフォールバック
    # する(仕様§2.3「人手は検出レポートのアドレスだけを根拠にmanifest.jsonを
    # 承認・更新する」の延長)。
    try:
        fid_row = _lookup_fid_row(Path(fid_kubun_path), fid)
        resolved_fid = fid_row.fid
        function_no = fid_row.function_no
    except ToolError:
        resolved_fid = fid
        function_no = None

    candidate_entry = entries.get(resolved_fid)
    if candidate_entry is None:
        raise ToolError(
            "MANIFEST_NOT_APPROVED",
            f"no approved block-manifest.json entry for fid={resolved_fid}. "
            "Run `excel-preprocess detect` first, then have a human approve an entry.",
        )
    if function_no is None:
        function_no = candidate_entry.function_no
    book_path = Path(input_dir) / candidate_entry.workbook_file
    if not book_path.exists():
        raise SourceReadError(f"workbook file not found: {book_path}")

    reader = load_workbook_reader(book_path)
    entry = require_approved_entry(entries, resolved_fid, reader.sha256)

    if entry.sheet_index >= len(reader.sheets):
        raise ToolError(
            "MANIFEST_SHEET_INDEX_INVALID",
            f"manifest sheet_index={entry.sheet_index} out of range for {book_path} "
            f"({len(reader.sheets)} sheets)",
        )
    sheet = reader.sheets[entry.sheet_index]
    if sheet.name != entry.sheet_name:
        raise ToolError(
            "MANIFEST_SHEET_NAME_MISMATCH",
            f"manifest sheet_name={entry.sheet_name!r} but sheet at index "
            f"{entry.sheet_index} is named {sheet.name!r} in {book_path}",
        )

    block = entry.block()
    model = build_block_model(
        reader=reader,
        sheet=sheet,
        block=block,
        fid=resolved_fid,
        function_no=function_no,
        boundary_evidence=entry.boundary_evidence,
    )

    out_path = Path(output_dir) / f"{resolved_fid}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(model, sort_keys=True, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return model
