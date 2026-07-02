#!/usr/bin/env python3
"""integration_test の *_it_cases.md 内の TSV を1つのプレーン TSV へ結合する。

各 Markdown の最初の ```tsv フェンスを読み、ヘッダを1行だけ採用して全データ行を
テストIDそのままで連結する。TSV 処理は integration-test-cases スキルの
format_tsv.py を再利用する（重複実装しない）。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# integration-test-cases スキルの scripts を import 対象に追加
_FORMAT_TSV_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "integration-test-cases"
    / "scripts"
)
sys.path.insert(0, str(_FORMAT_TSV_DIR))

from format_tsv import (  # noqa: E402
    COL_TEST_ID,
    EXPECTED_COLUMNS,
    EXPECTED_HEADER,
    extract_first_tsv_fence,
    migrate_rows,
    parse_tsv_block,
    rows_to_tsv_block,
    validate_rows,
)

# 既定の入出力（リポジトリルートからの相対）
DEFAULT_DIR = Path(".cursor/design/integration_test")
DEFAULT_OUT = DEFAULT_DIR / "all_it_cases.tsv"
SOURCE_GLOB = "*_it_cases.md"


def load_source_rows(path: Path) -> list[list[str]]:
    """1ファイルから検証済みの行（ヘッダ＋データ）を返す。"""
    text = path.read_text(encoding="utf-8")
    _, _, block = extract_first_tsv_fence(text)
    rows = migrate_rows(parse_tsv_block(block))
    validate_rows(rows, context=path.name)
    return rows


def collect(src_dir: Path, out_path: Path) -> tuple[list[list[str]], list[tuple[str, int]], list[str]]:
    """対象ファイルを連結し、(全行, ファイル別件数, ID重複) を返す。"""
    files = sorted(
        p
        for p in src_dir.glob(SOURCE_GLOB)
        if p.is_file() and p.resolve() != out_path.resolve()
    )
    if not files:
        raise ValueError(f"対象ファイルが無い: {src_dir}/{SOURCE_GLOB}")

    merged: list[list[str]] = []
    per_file: list[tuple[str, int]] = []
    id_owner: dict[str, str] = {}
    dup: list[str] = []

    for path in files:
        rows = load_source_rows(path)
        header, data = rows[0], rows[1:]
        if [c.strip() for c in header] != EXPECTED_HEADER:
            raise ValueError(f"{path.name}: ヘッダが正典と一致しません")
        if not merged:
            merged.append([c.strip() for c in EXPECTED_HEADER])
        for row in data:
            tid = row[COL_TEST_ID].strip()
            if tid in id_owner:
                dup.append(f"{tid}（{id_owner[tid]} と {path.name}）")
            else:
                id_owner[tid] = path.name
            merged.append(row)
        per_file.append((path.name, len(data)))

    return merged, per_file, dup


def main() -> int:
    parser = argparse.ArgumentParser(
        description="integration_test の *_it_cases.md の TSV を1つに結合する"
    )
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="入力ディレクトリ")
    parser.add_argument("--out", type=Path, default=None, help="出力TSVパス")
    parser.add_argument(
        "--check",
        action="store_true",
        help="書き出さず、検証・ヘッダ整合・ID重複のみ報告する",
    )
    parser.add_argument(
        "--allow-dup-id",
        action="store_true",
        help="テストID重複を警告にとどめ、停止しない",
    )
    args = parser.parse_args()

    src_dir: Path = args.dir
    out_path: Path = args.out or (src_dir / DEFAULT_OUT.name)

    if not src_dir.is_dir():
        print(f"エラー: ディレクトリが無い {src_dir}", file=sys.stderr)
        return 1

    try:
        merged, per_file, dup = collect(src_dir, out_path)
    except ValueError as e:
        print(f"エラー: {e}", file=sys.stderr)
        return 1

    data_total = len(merged) - 1
    for name, n in per_file:
        print(f"  {name}: {n} 行")
    print(f"結合ファイル数: {len(per_file)} / 合計データ行: {data_total}")

    if dup:
        print(f"テストID重複: {len(dup)} 件", file=sys.stderr)
        for d in dup:
            print(f"  - {d}", file=sys.stderr)
        if not args.allow_dup_id:
            print("ID重複のため中断した（--allow-dup-id で継続可）", file=sys.stderr)
            return 1

    # 出力前の整合確認（全行が10列・先頭が正典ヘッダ）
    if [c.strip() for c in merged[0]] != EXPECTED_HEADER:
        print("エラー: ヘッダが正典と一致しません", file=sys.stderr)
        return 1
    for i, row in enumerate(merged[1:], start=2):
        if len(row) != EXPECTED_COLUMNS:
            print(f"エラー: {i} 行目の列数が {len(row)}", file=sys.stderr)
            return 1

    if args.check:
        print("検証のみ（書き出しなし）: 問題なし")
        return 0

    out_path.write_text(rows_to_tsv_block(merged) + "\n", encoding="utf-8")
    print(f"書き出した: {out_path}（ヘッダ1行＋データ {data_total} 行）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
