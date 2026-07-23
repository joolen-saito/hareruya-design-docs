#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from io import StringIO
from pathlib import Path


GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-items -->"
EXPECTED_HEADER = [
    "機能名",
    "テストID",
    "I/FID",
    "テスト観点",
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
    "確認対象",
]
# `要確認` は全面禁止（依頼者確定）。許可ラベルは空。テストケースに要確認表現を残さない。
ALLOWED_UNRESOLVED_LABELS: tuple[str, ...] = ()
FORBIDDEN = (
    "UI標準",
    "設計書に記載のとおり",
    "設計どおり",
    "UNRESOLVED",
    "何らか",
    "必要に応じ",
    "適宜",
    "記載順に実行する",
    "元シナリオの正常系実行手順",
    "...",
)
EXPECTED_ALLOWED_ENDING_RE = re.compile(r"(される|されない|できる|である)こと。$")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def cell(value: str) -> str:
    value = value.replace("<br>", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("`", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def split_md_row(line: str) -> list[str]:
    return [cell(part) for part in line.strip().strip("|").split("|")]


def table_after(text: str, heading: str) -> list[dict[str, str]]:
    m = re.search(rf"^{re.escape(heading)}\n(?:[ \t]*\n)*(?P<body>(?:\|.*\|\n)+)", text, re.M)
    if not m:
        return []
    lines = [line for line in m.group("body").splitlines() if line.startswith("|")]
    if len(lines) < 2:
        return []
    header = split_md_row(lines[0])
    rows: list[dict[str, str]] = []
    for line in lines[2:]:
        parts = split_md_row(line)
        if len(parts) != len(header):
            continue
        rows.append(dict(zip(header, parts)))
    return rows


def tsv_block(text: str) -> str | None:
    m = re.search(r"```tsv\n(.*?)\n```", text, re.S)
    return m.group(1) if m else None


def parse_tsv(block: str) -> list[list[str]]:
    return list(csv.reader(StringIO(block), delimiter="\t"))


def has_allowed_expected_ending(value: str) -> bool:
    return bool(EXPECTED_ALLOWED_ENDING_RE.search(value.rstrip()))


def source_scenario_path(repo: Path, text: str) -> Path | None:
    m = re.search(r"元シナリオ:\s*`([^`]+)`", text)
    if not m:
        return None
    path = repo / m.group(1)
    return path if path.exists() else None


def feature_list_value(text: str, label: str) -> list[str]:
    m = re.search(rf"- \*\*{re.escape(label)}\*\*:\s*(.+)", text)
    if not m:
        return []
    return [part.strip().upper() for part in m.group(1).split(",") if re.match(r"^[A-Z]\d{2}-\d{2}$", part.strip(), re.I)]


def scenario_data_pattern_ids(scenario_text: str) -> set[str]:
    return {row.get("パターンID", "") for row in table_after(scenario_text, "## データパターン") if row.get("パターンID")}


def scenario_bullet_value(scenario_text: str, label: str) -> str:
    m = re.search(rf"- \*\*{re.escape(label)}\*\*:\s*(.+)", scenario_text)
    return cell(m.group(1)) if m else ""


def scenario_related_features(scenario_text: str) -> set[str]:
    return set(feature_list_value(scenario_text, "期待する主要機能No")) | set(feature_list_value(scenario_text, "シナリオに紐づく機能No"))


def scenario_branch_flow_types(scenario_text: str) -> set[str]:
    result: set[str] = set()
    for row in table_after(scenario_text, "## 実行手順（代替系・異常系）"):
        branch_id = row.get("分岐ID", "")
        if branch_id.startswith("A"):
            result.add("代替系")
        elif branch_id.startswith("E"):
            result.add("異常系")
    return result


def related_summary_by_feature(text: str) -> dict[str, dict[str, str]]:
    rows = table_after(text, "## 関連機能No対応概要")
    result: dict[str, dict[str, str]] = {}
    for row in rows:
        fno = row.get("機能No", "").upper()
        if re.match(r"^[A-Z]\d{2}-\d{2}$", fno):
            result[fno] = row
    return result


def validate_file(repo: Path, path: Path) -> list[str]:
    text = read(path)
    errors: list[str] = []
    if GENERATED_MARKER not in text:
        errors.append("missing generated marker")
    for phrase in FORBIDDEN:
        if phrase in text:
            errors.append(f"forbidden phrase: {phrase}")
    residual = text
    for label in ALLOWED_UNRESOLVED_LABELS:
        residual = residual.replace(label, "")
    if "要確認" in residual:
        errors.append("forbidden phrase: 要確認（許可された未確定ラベル以外）")
    block = tsv_block(text)
    if block is None:
        return errors + ["missing tsv block"]
    rows = parse_tsv(block)
    if not rows:
        return errors + ["empty tsv block"]
    if rows[0] != EXPECTED_HEADER:
        errors.append("invalid tsv header")
    scenario_path = source_scenario_path(repo, text)
    scenario_text = read(scenario_path) if scenario_path else ""
    if not scenario_path:
        errors.append("missing or unreadable 元シナリオ link")
    scenario_dp_ids = scenario_data_pattern_ids(scenario_text) if scenario_text else set()
    scenario_features = scenario_related_features(scenario_text) if scenario_text else set()
    scenario_route_id = scenario_bullet_value(scenario_text, "経路ID") if scenario_text else ""
    scenario_classification = scenario_bullet_value(scenario_text, "分類") if scenario_text else ""
    branch_flow_types = scenario_branch_flow_types(scenario_text) if scenario_text else set()
    related_summary = related_summary_by_feature(text)
    related_header = re.search(r"^## 関連機能No対応概要\n(?:[ \t]*\n)*(\|.+\|)", text, re.M)
    if related_header:
        for column in ("機能No", "状態", "I/FID出力"):
            if column not in related_header.group(1):
                errors.append(f"related feature summary missing column: {column}")
    else:
        errors.append("missing related feature summary table")
    seen_ids: set[str] = set()
    seen_exec: set[tuple[str, str, str, str]] = set()
    flow_types: set[str] = set()
    ifids: set[str] = set()
    has_route_item = False
    for idx, row in enumerate(rows[1:], 2):
        if len(row) != len(EXPECTED_HEADER):
            errors.append(f"row {idx}: expected {len(EXPECTED_HEADER)} columns, got {len(row)}")
            continue
        function_name, tid, ifid, viewpoint, priority, item_name, precondition, input_data, steps, expected, observation = row
        if not function_name.strip():
            errors.append(f"row {idx}: empty 機能名")
        if not tid.startswith("STI-"):
            errors.append(f"row {idx}: invalid test id")
        if tid in seen_ids:
            errors.append(f"row {idx}: duplicate test id {tid}")
        seen_ids.add(tid)
        if not ifid.strip():
            errors.append(f"row {idx}: empty I/FID")
        if re.match(r"^[A-Z]\d{2}-\d{2}$", ifid.strip(), re.I):
            ifids.add(ifid.strip().upper())
        if viewpoint == "業務経路" or "経路全体" in item_name:
            has_route_item = True
        # フロー種別はテスト項目名の接頭辞（正常系/代替系/異常系）から判定する
        m = re.match(r"(正常系|代替系|異常系)", item_name)
        if not m:
            errors.append(f"row {idx}: cannot determine flow type from item name")
        else:
            flow_types.add(m.group(1))
        if priority not in {"P1", "P2", "P3"}:
            errors.append(f"row {idx}: invalid priority {priority}")
        for label, value in (("I/FID", ifid), ("テスト観点", viewpoint), ("テスト項目名", item_name), ("前提条件", precondition), ("入力データ/リクエスト内容", input_data), ("操作手順/実行方法", steps), ("期待結果／レスポンス", expected), ("確認対象", observation)):
            if not value.strip():
                errors.append(f"row {idx}: empty {label}")
        if not has_allowed_expected_ending(expected):
            errors.append(
                f"row {idx}: 期待結果／レスポンス must end with one of "
                "されること。/されないこと。/できること。/であること。"
            )
        key = (
            re.sub(r"\s+", " ", precondition).strip(),
            re.sub(r"\s+", " ", input_data).strip(),
            re.sub(r"\s+", " ", steps).strip(),
            re.sub(r"\s+", " ", expected).strip(),
        )
        if key in seen_exec:
            errors.append(f"row {idx}: duplicate execution tuple")
        seen_exec.add(key)
        row_dp_ids = set(re.findall(r"DP-[NAEB]\d{3}", "\n".join((item_name, precondition, input_data))))
        if scenario_dp_ids and not row_dp_ids:
            errors.append(f"row {idx}: missing data pattern id")
        for dp_id in sorted(row_dp_ids):
            if scenario_dp_ids and dp_id not in scenario_dp_ids:
                errors.append(f"row {idx}: unknown data pattern id {dp_id}")
        if scenario_route_id and scenario_route_id not in "\n".join((precondition, input_data, steps)):
            errors.append(f"row {idx}: missing route id {scenario_route_id}")
    if not flow_types:
        errors.append("missing flow-typed test items")
    if not has_route_item:
        errors.append("missing route-level test item")
    if scenario_classification in {"正常系", "代替系", "異常系"} and scenario_classification not in flow_types:
        errors.append(f"missing primary route test items: {scenario_classification}")
    for branch_flow_type in sorted(branch_flow_types):
        if branch_flow_type not in flow_types:
            errors.append(f"missing branch flow test items: {branch_flow_type}")
    for ifid in sorted(ifids):
        summary = related_summary.get(ifid)
        if not summary:
            errors.append(f"related feature summary missing I/FID feature: {ifid}")
        elif summary.get("状態") != "テスト項目化":
            errors.append(f"related feature summary must mark I/FID feature as テスト項目化: {ifid}")
    for feature in sorted(scenario_features):
        if feature in ifids:
            continue
        summary = related_summary.get(feature)
        if not summary:
            errors.append(f"scenario related feature missing from I/FID or summary: {feature}")
            continue
        if summary.get("状態") not in {"参照のみ", "対象外"}:
            errors.append(f"scenario related feature without explicit non-I/FID status: {feature}")
    return errors


def validate_aggregate(repo: Path) -> list[str]:
    path = repo / "scenario_test" / "test_items" / "all_scenario_test_items.tsv"
    if not path.exists():
        return ["missing aggregate TSV"]
    rows = parse_tsv(read(path))
    errors: list[str] = []
    if not rows or rows[0] != EXPECTED_HEADER:
        errors.append("aggregate invalid header")
    expected_data_rows = 0
    for item_path in sorted((repo / "scenario_test" / "test_items").glob("STI-*.md")):
        item_text = read(item_path)
        if GENERATED_MARKER not in item_text:
            continue
        block = tsv_block(item_text)
        if block is None:
            continue
        item_rows = parse_tsv(block)
        if item_rows and item_rows[0] == EXPECTED_HEADER:
            expected_data_rows += len(item_rows) - 1
    if rows and len(rows) - 1 != expected_data_rows:
        errors.append(f"aggregate row count mismatch: aggregate={len(rows) - 1}, per_files={expected_data_rows}")
    # 操作手順/実行方法（8列目）は貼り付け時の可読性のため改行を許容する。他列は1行に畳む。
    steps_col = 8
    expected_col = EXPECTED_HEADER.index("期待結果／レスポンス")
    for idx, row in enumerate(rows[1:], 2):
        if len(row) != len(EXPECTED_HEADER):
            errors.append(f"aggregate row {idx}: expected {len(EXPECTED_HEADER)} columns, got {len(row)}")
            continue
        for i, cell in enumerate(row):
            if i != steps_col and "\n" in cell:
                errors.append(f"aggregate row {idx}: unexpected cell newline in column {i}")
        if not has_allowed_expected_ending(row[expected_col]):
            errors.append(f"aggregate row {idx}: invalid 期待結果／レスポンス ending")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    files = sorted((repo / "scenario_test" / "test_items").glob("STI-*.md"))
    if not files:
        print("no test item files found")
        return 1
    failed = 0
    for path in files:
        errors = validate_file(repo, path)
        if errors:
            failed += 1
            print(f"NG {path.relative_to(repo)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK {path.relative_to(repo)}")
    for error in validate_aggregate(repo):
        failed += 1
        print("NG scenario_test/test_items/all_scenario_test_items.tsv")
        print(f"  - {error}")
    print(f"checked={len(files)} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
