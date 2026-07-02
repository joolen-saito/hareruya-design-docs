#!/usr/bin/env python3
"""期待結果を判定単位で行分割し、テストIDを通し採番する。

Markdown 内の最初の ```tsv ブロックを読み、各データ行の期待結果列を複数行に展開する。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from format_tsv import (
    COL_EXPECT,
    COL_TEST_ID,
    EXPECTED_COLUMNS,
    dedupe_lines,
    ends_with_suffix,
    extract_first_tsv_fence,
    flatten_expect,
    halve_if_repeat_sequence,
    migrate_rows,
    normalize_row,
    parse_tsv_block,
    rows_to_tsv_block,
    validate_rows,
)


def detect_id_prefix(rows: list[list[str]]) -> str:
    """先頭データ行のテストIDから `IT-XXX-` 形式のプレフィックスを推定する。"""
    for row in rows[1:]:
        if len(row) == EXPECTED_COLUMNS:
            m = re.match(r"^(.+-)\d+$", row[COL_TEST_ID].strip())
            if m:
                return m.group(1)
    return "IT-CASE-"


def parse_expect_segments(cell: str) -> list[str]:
    """期待結果セルを判定単位の文字列リストに分解する（先頭の・は付けない）。"""
    flat = flatten_expect(cell)
    flat = halve_if_repeat_sequence(flat)
    text = flat.strip().lstrip("・").strip()
    if not text:
        return [""]

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

    # 改行区切りも取り込む
    if len(segments) == 1 and "\n" in cell:
        lines = dedupe_lines(cell)
        if len(lines) > 1:
            segments = [ln.lstrip("・").strip() for ln in lines if ln.strip()]

    # 「、」でつながった二つの判定（両方がこと／ないことで終わる）
    expanded: list[str] = []
    for seg in segments:
        if "、" in seg and seg.count("、") == 1:
            left, right = seg.split("、", 1)
            left, right = left.strip(), right.strip()
            if (
                left
                and right
                and (
                    ends_with_suffix(left)
                    or left.endswith("こと")
                    or left.endswith("ないこと")
                )
                and (
                    ends_with_suffix(right)
                    or right.endswith("こと")
                    or right.endswith("ないこと")
                )
            ):
                expanded.extend([left, right])
                continue
        expanded.append(seg)

    seen: set[str] = set()
    uniq: list[str] = []
    for s in expanded:
        s = s.strip()
        if not s or s in seen:
            continue
        seen.add(s)
        uniq.append(s)
    return uniq if uniq else [text]


def expand_rows(
    rows: list[list[str]], *, id_prefix: str
) -> tuple[list[list[str]], dict[str, list[str]]]:
    """データ行を展開し、旧テストID→新テストIDリストの対応を返す。"""
    if len(rows) < 1:
        raise ValueError("ヘッダ行がありません")

    out: list[list[str]] = [rows[0]]
    id_map: dict[str, list[str]] = {}
    seq = 0

    for row in rows[1:]:
        if len(row) != EXPECTED_COLUMNS:
            raise ValueError(f"列数不正: {len(row)}")
        old_id = row[COL_TEST_ID].strip()
        segments = parse_expect_segments(row[COL_EXPECT])
        new_ids: list[str] = []
        for seg in segments:
            seq += 1
            new_id = f"{id_prefix}{seq:03d}"
            new_ids.append(new_id)
            new_row = list(row)
            new_row[COL_TEST_ID] = new_id
            new_row[COL_EXPECT] = seg
            out.append(new_row)
        id_map[old_id] = new_ids

    return out, id_map


def main() -> int:
    parser = argparse.ArgumentParser(description="期待結果を行分割して TSV を更新する")
    parser.add_argument("markdown_file", type=Path)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="行数と ID 対応のみ表示し、ファイルは書き換えない",
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

    rows = migrate_rows(parse_tsv_block(block))
    validate_rows(rows, context="入力")

    id_prefix = detect_id_prefix(rows)
    expanded, id_map = expand_rows(rows, id_prefix=id_prefix)
    expanded = [normalize_row(r) for r in expanded]
    validate_rows(expanded, context="展開後")

    data_count = len(expanded) - 1
    print(f"データ行: {len(rows) - 1} → {data_count}")

    if args.dry_run:
        for old, new_ids in sorted(id_map.items()):
            print(f"  {old} → {', '.join(new_ids)}")
        return 0

    new_block = rows_to_tsv_block(expanded)
    new_text = text[:block_start] + new_block + text[fence_end:]

    path.write_text(new_text, encoding="utf-8")
    print(f"更新した: {path}（{data_count} 行）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
