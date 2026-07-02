#!/usr/bin/env python3
"""Markdown 内の最初の ```tsv フェンスを読み、セル内改行・CSV 引用規則に整形する。

前提条件・入力の複数「・」、操作手順の「1.」「2.」連結を正規化する。
期待結果列は1行1判定を前提とし、セル内の単一期待の整形のみ行う（複数期待の行分割は expand_expect_rows.py）。

ブロック構成は次のとおりである。

1. 1行目は列見出し（10列固定。先頭列は `機能名`）。4列目は `テスト観点`（`テスト観点.md` の観点列）。`テストレベル` は出力しない。
2. 2行目以降がデータ（各10列）。`機能名` 列に元設計の表示名（例 `管理画面_認証機能`）を繰り返す。
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from io import StringIO
from pathlib import Path

EXPECTED_COLUMNS = 10
FEATURE_NAME_COLUMN = "機能名"
TEST_LEVEL_COLUMN = "テストレベル"
TEST_VIEWPOINT_COLUMN = "テスト観点"
LEGACY_VIEWPOINT_COLUMN = "観点"
LEGACY_SUMMARY_COLUMN = "テスト観点"  # 旧ケース要約列（観点列と併存時のみ除去）
DEPRECATED_COLUMNS = (TEST_LEVEL_COLUMN,)
HEADER_MARKER = "テストID"
# [TEMPLATE.md] / [TERMINOLOGY.md] と一致。4列目は「テスト観点」（旧 I/F種別 は使わない）
EXPECTED_HEADER = [
    "機能名",
    "テストID",
    "I/FID",
    TEST_VIEWPOINT_COLUMN,
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
]

# 旧形式: 機能名なし
OLD_HEADER_WITH_LEVEL = [
    "テストID",
    "I/FID",
    TEST_LEVEL_COLUMN,
    LEGACY_VIEWPOINT_COLUMN,
    LEGACY_SUMMARY_COLUMN,
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
]
OLD_HEADER_WITH_VIEWPOINT = [
    "テストID",
    "I/FID",
    LEGACY_VIEWPOINT_COLUMN,
    LEGACY_SUMMARY_COLUMN,
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
]

COL_FEATURE = 0
COL_TEST_ID = 1
COL_IFID = 2
COL_TEST_VIEWPOINT = 3
COL_PRIORITY = 4
COL_ITEM_NAME = 5
COL_PREMISE = 6
COL_INPUT = 7
COL_STEPS = 8
COL_EXPECT = 9


def is_legacy_feature_row(row: list[str]) -> bool:
    """旧形式: 先頭行が機能名のみ1列。"""
    return len(row) == 1 and bool(row[0].strip())


def is_header_row(row: list[str]) -> bool:
    return len(row) > 0 and row[0].strip() == FEATURE_NAME_COLUMN


def default_feature_name(rows: list[list[str]]) -> str:
    if rows and is_legacy_feature_row(rows[0]):
        return rows[0][0].strip()
    for row in rows[1:]:
        if len(row) == EXPECTED_COLUMNS and row[COL_FEATURE].strip():
            return row[COL_FEATURE].strip()
    return "機能名未設定"


def drop_deprecated_columns(rows: list[list[str]]) -> list[list[str]]:
    """ヘッダに `テストレベル` がある場合、その列を全行から除去する。"""
    if not rows or not is_header_row(rows[0]):
        return rows
    result = rows
    for col_name in DEPRECATED_COLUMNS:
        hdr = [c.strip() for c in result[0]]
        if col_name not in hdr:
            continue
        idx = hdr.index(col_name)
        result = [
            row[:idx] + row[idx + 1 :] if len(row) > idx else row for row in result
        ]
    return result


def drop_legacy_summary_column(rows: list[list[str]]) -> list[list[str]]:
    """旧ケース要約の `テスト観点` 列（`観点` 列の直後）を除去する。"""
    if not rows or not is_header_row(rows[0]):
        return rows
    hdr = [c.strip() for c in rows[0]]
    if LEGACY_VIEWPOINT_COLUMN not in hdr or LEGACY_SUMMARY_COLUMN not in hdr:
        return rows
    vp_idx = hdr.index(LEGACY_VIEWPOINT_COLUMN)
    summary_idx = hdr.index(LEGACY_SUMMARY_COLUMN)
    if summary_idx <= vp_idx:
        return rows
    idx = summary_idx
    return [row[:idx] + row[idx + 1 :] if len(row) > idx else row for row in rows]


def rename_viewpoint_column(rows: list[list[str]]) -> list[list[str]]:
    """列名 `観点` を `テスト観点` に変更する。"""
    if not rows or not is_header_row(rows[0]):
        return rows
    hdr = [c.strip() for c in rows[0]]
    if LEGACY_VIEWPOINT_COLUMN not in hdr:
        return rows
    idx = hdr.index(LEGACY_VIEWPOINT_COLUMN)
    new_hdr = list(rows[0])
    new_hdr[idx] = TEST_VIEWPOINT_COLUMN
    return [new_hdr] + rows[1:]


def normalize_tsv_columns(rows: list[list[str]]) -> list[list[str]]:
    return rename_viewpoint_column(drop_legacy_summary_column(drop_deprecated_columns(rows)))


def migrate_rows(rows: list[list[str]]) -> list[list[str]]:
    """旧形式を現行10列形式へ変換する。"""
    if not rows:
        return rows

    if is_legacy_feature_row(rows[0]):
        name = rows[0][0].strip()
        if len(rows) < 2:
            raise ValueError("ヘッダ行がありません")
        hdr = rows[1]
        stripped_hdr = [c.strip() for c in hdr]
        if stripped_hdr in (OLD_HEADER_WITH_LEVEL, OLD_HEADER_WITH_VIEWPOINT):
            hdr = EXPECTED_HEADER
        elif stripped_hdr == EXPECTED_HEADER[1:]:
            hdr = EXPECTED_HEADER
        elif hdr[0].strip() == HEADER_MARKER:
            hdr = [FEATURE_NAME_COLUMN] + hdr
        data: list[list[str]] = []
        for row in rows[2:]:
            if len(row) in (len(OLD_HEADER_WITH_LEVEL), len(OLD_HEADER_WITH_VIEWPOINT)):
                data.append([name] + row)
            elif len(row) == EXPECTED_COLUMNS:
                row = list(row)
                row[COL_FEATURE] = name
                data.append(row)
        rows = [hdr] + data
    elif is_header_row(rows[0]):
        rows = list(rows)
    else:
        return normalize_tsv_columns(rows)

    return normalize_tsv_columns(rows)

SUFFIXES = (
    "されていないこと",
    "されていること",
    "していないこと",
    "していること",
    "なっていること",
    "であること",
    "ないこと",
    "無いこと",
    "いないこと",
    "しないこと",
    "できないこと",
    "ありません",
    "なこと",
    "すること",
    "されること",
    "ならないこと",
    "留まること",
    "できること",
    "けること",
    "えること",
    "われること",
    "表示されること",
    "誘導されること",
    "含まれないこと",
    "記録されること",
    "機能していること",
    "整合すること",
    "一致すること",
    "クリアすること",
    "現れないこと",
    "なっていないこと",
    "観測できること",
    "満たすこと",
    "ブロックされること",
    "発生しないこと",
    "過剰でないこと",
    "成立しないこと",
    "戻ること",
    "いること",
    "あること",
    "内）",
)


def ends_with_suffix(fragment: str) -> bool:
    t = fragment.rstrip()
    return any(t.endswith(s) for s in SUFFIXES)


def dedupe_lines(cell: str) -> list[str]:
    lines = [ln.strip() for ln in cell.split("\n") if ln.strip()]
    out: list[str] = []
    for ln in lines:
        if out and ln == out[-1]:
            continue
        out.append(ln)
    return out


def flatten_expect(cell: str) -> str:
    lines = dedupe_lines(cell)
    parts = [ln.lstrip("・").strip() for ln in lines if ln.strip()]
    collapsed: list[str] = []
    for p in parts:
        if collapsed and p == collapsed[-1]:
            continue
        collapsed.append(p)
    return "・".join(collapsed)


def halve_if_repeat_sequence(flat: str) -> str:
    parts = flat.split("・")
    n = len(parts)
    if n >= 2 and n % 2 == 0:
        k = n // 2
        if parts[:k] == parts[k:]:
            return "・".join(parts[:k])
    return flat


def split_expect_flat(text: str) -> str:
    text = text.strip().lstrip("・").strip()
    if not text:
        return ""
    segments: list[str] = []
    cur = 0
    i = 0
    while i < len(text):
        j = text.find("・", i)
        if j == -1:
            segments.append(text[cur:].strip())
            break
        chunk = text[cur:j].strip()
        if chunk and ends_with_suffix(chunk):
            segments.append(chunk)
            cur = j + 1
        i = j + 1
    tail = text[cur:].strip()
    if tail:
        segments.append(tail)
    seen: set[str] = set()
    uniq: list[str] = []
    for s in segments:
        if s in seen:
            continue
        seen.add(s)
        uniq.append(s)
    return "\n".join("・" + s for s in uniq)


def normalize_expect(cell: str) -> str:
    flat = flatten_expect(cell)
    flat = halve_if_repeat_sequence(flat)
    return split_expect_flat(flat)


def bullet_lines_premise(s: str) -> str:
    s = s.strip()
    if not s:
        return s
    inner = s.lstrip("・")
    if "・" not in inner:
        return s
    chunks = [c.strip() for c in inner.split("・") if c.strip()]
    return "\n".join("・" + c for c in chunks)


def split_steps(s: str) -> str:
    s = s.strip()
    if not s:
        return s
    parts = re.split(r"・(?=\d+\.)", s)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) <= 1:
        return s
    return "\n".join(parts)


def maybe_input_lines(s: str) -> str:
    s = s.strip()
    if s.count("・") >= 2:
        return bullet_lines_premise(s)
    return s


def normalize_row(row: list[str]) -> list[str]:
    if is_header_row(row) or is_legacy_feature_row(row):
        return row
    if len(row) != EXPECTED_COLUMNS:
        return row
    row = list(row)
    row[COL_PREMISE] = bullet_lines_premise(row[COL_PREMISE])
    row[COL_INPUT] = maybe_input_lines(row[COL_INPUT])
    row[COL_STEPS] = split_steps(row[COL_STEPS])
    row[COL_EXPECT] = normalize_expect(row[COL_EXPECT])
    return row


def extract_first_tsv_fence(text: str) -> tuple[int, int, str]:
    start_marker = "```tsv\n"
    idx = text.find(start_marker)
    if idx == -1:
        raise ValueError("```tsv の開始が見つからない")
    block_start = idx + len(start_marker)
    end_idx = text.find("\n```", block_start)
    if end_idx == -1:
        raise ValueError("``` の終了が見つからない")
    return block_start, end_idx, text[block_start:end_idx]


def validate_rows(rows: list[list[str]], *, context: str) -> None:
    if not rows:
        raise ValueError(f"{context}: 行がありません")

    if is_legacy_feature_row(rows[0]):
        raise ValueError(
            f"{context}: 旧形式（機能名のみの先頭行）のままです。"
            " format_tsv.py を実行して移行してください。"
        )

    hdr = rows[0]
    if not is_header_row(hdr):
        raise ValueError(
            f"{context}: 1 行目は列見出しで先頭セルが {FEATURE_NAME_COLUMN!r} である必要があります"
        )
    if [c.strip() for c in hdr] != EXPECTED_HEADER:
        raise ValueError(
            f"{context}: 1 行目の列見出しが正典と一致しません。"
            f" 期待: {EXPECTED_HEADER!r} 実際: {[c.strip() for c in hdr]!r}"
        )

    feature = default_feature_name(rows)
    for i, row in enumerate(rows[1:], start=2):
        if len(row) != EXPECTED_COLUMNS:
            raise ValueError(
                f"{context}: {i} 行目の列数が {len(row)}、期待は {EXPECTED_COLUMNS}"
            )
        if not row[COL_FEATURE].strip():
            raise ValueError(f"{context}: {i} 行目の機能名が空です")
        if row[COL_FEATURE].strip() != feature:
            raise ValueError(
                f"{context}: {i} 行目の機能名が不一致"
                f"（期待 {feature!r}、実際 {row[COL_FEATURE].strip()!r}）"
            )


def rows_to_tsv_block(rows: list[list[str]]) -> str:
    bio = StringIO()
    w = csv.writer(
        bio,
        delimiter="\t",
        quoting=csv.QUOTE_MINIMAL,
        doublequote=True,
        lineterminator="\n",
    )
    for row in rows:
        w.writerow(row)
    return bio.getvalue().rstrip("\n")


def parse_tsv_block(block: str) -> list[list[str]]:
    return list(csv.reader(StringIO(block), delimiter="\t"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Markdown 内の TSV フェンスを整形する")
    parser.add_argument("markdown_file", type=Path, help="対象 Markdown のパス")
    parser.add_argument(
        "--check",
        action="store_true",
        help="列数検証のみ。ファイルは書き換えない",
    )
    args = parser.parse_args()

    path = args.markdown_file
    if not path.is_file():
        print(f"エラー: ファイルがない {path}", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8")
    try:
        block_start, fence_end, block = extract_first_tsv_fence(text)
    except ValueError as e:
        print(f"エラー: {e}", file=sys.stderr)
        return 1

    try:
        rows = parse_tsv_block(block)
    except csv.Error as e:
        print(f"エラー: TSV の解析に失敗 {e}", file=sys.stderr)
        return 1

    rows = migrate_rows(rows)
    validate_rows(rows, context="入力")

    if args.check:
        return 0

    new_rows = [normalize_row(r) for r in rows]
    validate_rows(new_rows, context="正規化後")

    new_block = rows_to_tsv_block(new_rows)
    new_text = text[:block_start] + new_block + text[fence_end:]
    path.write_text(new_text, encoding="utf-8")
    print(f"更新した: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
