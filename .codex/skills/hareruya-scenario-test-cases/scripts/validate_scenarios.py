#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path


REQUIRED_SECTIONS = [
    "## 概要",
    "## アクター",
    "## 事前条件・テストデータ・環境",
    "## 実行用テストデータ",
    "## メインフロー（正常系）",
    "## 実行手順（正常系）",
    "## 代替フロー / 異常系分岐",
    "## 実行手順（代替系・異常系）",
    "## 完了条件（業務的ゴール／データ状態の最終確認）",
    "## システムテストカバレッジ",
    "## エッジケース要約",
    "## トレーサビリティ",
]
FORBIDDEN = ("設計どおり", "設計書に記載のとおり", "UI標準", "要確認")
UNRESOLVED = ("UNRESOLVED_FUNCTION_SPEC", "UNRESOLVED_HTML_DESIGN_DOC")
VAGUE_EXECUTION = ("実行できる注文、商品、会員、在庫、買取、イベント等の対象データ", "対象業務が次の担当者へ引き渡せる状態")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def validate_file(repo: Path, path: Path, strict: bool) -> list[str]:
    text = read(path)
    errors: list[str] = []
    if not re.search(r"^#\s+SCN-[^\s]+\s+", text, re.M):
        errors.append("missing SCN heading")
    for section in REQUIRED_SECTIONS:
        if section == "## メインフロー（正常系）":
            ok = re.search(r"^## メインフロー（正常系", text, re.M)
        else:
            ok = section in text
        if not ok:
            errors.append(f"missing section: {section}")
    for phrase in FORBIDDEN:
        if phrase in text:
            errors.append(f"forbidden phrase: {phrase}")
    for phrase in UNRESOLVED:
        if phrase in text:
            errors.append(f"unresolved traceability: {phrase}")
    for phrase in VAGUE_EXECUTION:
        if phrase in text:
            errors.append(f"vague execution phrase: {phrase}")
    for src in re.findall(r"`(scenario_test/markdown/[^`]+\.md)`", text):
        if not (repo / src).exists():
            errors.append(f"missing trace source: {src}")
    for src in re.findall(r"`(functions/[^`]+\.md)`", text):
        if not (repo / src).exists():
            errors.append(f"missing function spec: {src}")
    for src in re.findall(r"`(excel_to_html/output/[^`]+\.html)`", text):
        if not (repo / src).exists():
            errors.append(f"missing html design doc: {src}")
    if strict and "> [要確認]" in text:
        errors.append("strict mode disallows unresolved > [要確認]")
    main_header = re.search(r"^## メインフロー（正常系.*?\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not main_header:
        errors.append("missing main-flow table")
    else:
        header = main_header.group(1)
        for column in ("担当者", "業務行動", "利用画面・機能", "確認する業務結果"):
            if column not in header:
                errors.append(f"main-flow table missing business column: {column}")
        if "画面（機能No）" in header or "操作" in header:
            errors.append("main-flow table still uses screen-first columns")
    if re.search(r"^\| \d+ \| [^|]+ \| - R\d+:", text, re.M):
        errors.append("main-flow action still starts with raw row ID")
    seed_header = re.search(r"^## 実行用テストデータ\n\| 項目 \| 値 \|\n\|[-|]+\|", text, re.M)
    if not seed_header:
        errors.append("missing executable seed data table")
    if not re.search(r"ST-(ORDER|PICKUP|STOCK|BUY|OBUY|PURCHASE|PRODUCT|PRICE|EVENT|DECK|CARD|DATA)-", text):
        errors.append("missing fixed ST-* seed identifier")
    exec_header = re.search(r"^## 実行手順（正常系）\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not exec_header:
        errors.append("missing executable normal procedure table")
    else:
        header = exec_header.group(1)
        for column in ("担当者", "操作", "入力/対象", "期待結果"):
            if column not in header:
                errors.append(f"execution procedure table missing column: {column}")
    exec_rows = re.findall(r"^\| \d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not exec_rows:
        errors.append("missing executable procedure rows")
    alt_header = re.search(r"^## 代替フロー / 異常系分岐\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not alt_header:
        errors.append("missing alternative/error branch table")
    elif "確認対象" not in alt_header.group(1):
        errors.append("alternative/error branch table missing 確認対象 column")
    branch_rows = re.findall(r"^\| [AE]\d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not branch_rows:
        errors.append("missing edge-case branch rows")
    alt_exec_header = re.search(r"^## 実行手順（代替系・異常系）\n(\|.+\|)\n(\|[-|]+\|)", text, re.M)
    if not alt_exec_header:
        errors.append("missing alternative/error execution procedure table")
    else:
        header = alt_exec_header.group(1)
        for column in ("分岐ID", "担当者", "操作", "入力/対象", "期待結果"):
            if column not in header:
                errors.append(f"alternative/error execution table missing column: {column}")
    alt_exec_rows = re.findall(r"^\| \d+ \| [AE]\d+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$", text, re.M)
    if not alt_exec_rows:
        errors.append("missing alternative/error executable procedure rows")
    if len(alt_exec_rows) < len(branch_rows):
        errors.append("alternative/error execution rows fewer than branch rows")
    if "**期待する主要機能No**" not in text:
        errors.append("missing expected function numbers")
    if "**シナリオに紐づく機能No**" not in text:
        errors.append("missing linked function numbers")
    summary = re.search(r"^## エッジケース要約\n\| 件数 \| 主なエッジケース \| 確認対象 \|\n\|[-|]+\|\n\| (\d+) \|", text, re.M)
    if not summary:
        errors.append("missing edge-case summary row")
    elif int(summary.group(1)) < 1:
        errors.append("edge-case summary count must be >= 1")
    return errors


def validate_coverage_table(repo: Path, scenario_files: list[Path]) -> list[str]:
    coverage_path = repo / "scenario_test" / "scenario" / "03_カバレッジ表.md"
    if not coverage_path.exists():
        return ["missing coverage table: scenario_test/scenario/03_カバレッジ表.md"]
    text = read(coverage_path)
    errors: list[str] = []
    required_columns = ("正常系", "代替系", "異常系", "外部連携", "データ更新", "正常系手順数", "代替/異常手順数", "期待機能不足", "HTML不足", "エッジケース数", "主なエッジケース", "確認対象", "非EC-CUBE作業", "番号重複警告")
    for column in required_columns:
        if column not in text:
            errors.append(f"coverage table missing column: {column}")
    for path in scenario_files:
        scenario_id = re.search(r"(SCN-[^_]+)", path.name)
        if scenario_id and scenario_id.group(1) not in text:
            errors.append(f"coverage table missing scenario: {scenario_id.group(1)}")
    for line in text.splitlines():
        if "| SCN-" not in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 17:
            errors.append(f"coverage table row has too few columns: {cells[2] if len(cells) > 2 else line}")
            continue
        try:
            normal_count = int(cells[10])
            branch_count = int(cells[11])
            edge_count = int(cells[14])
        except ValueError:
            errors.append(f"coverage table invalid procedure/edge count: {cells[2]}")
            continue
        if normal_count < 1:
            errors.append(f"coverage table normal procedure count must be >= 1: {cells[2]}")
        if branch_count < 1:
            errors.append(f"coverage table branch procedure count must be >= 1: {cells[2]}")
        if edge_count < 1:
            errors.append(f"coverage table edge count must be >= 1: {cells[2]}")
    return errors


def validate_feature_ledger(repo: Path) -> list[str]:
    ledger = repo / "scenario_test" / "scenario" / "05_設計書カバレッジ.md"
    if not ledger.exists():
        return ["missing feature ledger: scenario_test/scenario/05_設計書カバレッジ.md"]
    text = read(ledger)
    errors: list[str] = []
    for section in ("## サマリ", "## 要判定リスト", "## プレフィックス別ロールアップ", "## out-of-scope 明細"):
        if section not in text:
            errors.append(f"feature ledger missing section: {section}")
    for label in ("covered", "source-backed-uncovered", "excluded-ph2"):
        if label not in text:
            errors.append(f"feature ledger missing classification: {label}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--generated-only", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    files = sorted((repo / "scenario_test" / "scenario").glob("SCN-*.md"))
    if args.generated_only:
        files = [p for p in files if "<!-- generated-by: hareruya-scenario-test-cases -->" in read(p)]
    if not files:
        print("no scenario files found")
        return 1
    failed = 0
    for path in files:
        errors = validate_file(repo, path, args.strict)
        if errors:
            failed += 1
            print(f"NG {path.relative_to(repo)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK {path.relative_to(repo)}")
    for error in validate_coverage_table(repo, files):
        failed += 1
        print(f"NG scenario_test/scenario/03_カバレッジ表.md")
        print(f"  - {error}")
    for error in validate_feature_ledger(repo):
        failed += 1
        print(f"NG scenario_test/scenario/05_設計書カバレッジ.md")
        print(f"  - {error}")
    print(f"checked={len(files)} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
