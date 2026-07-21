#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path


GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-cases -->"

HEADER = [
    "シナリオID",
    "業務",
    "シナリオ名",
    "SCNファイル",
    "目的",
    "分類",
    "優先度",
    "業務トリガー",
    "業務フロー番号",
    "経路ID",
    "経路種別",
    "親業務フローパターン",
    "業務経路条件",
    "最終業務状態",
    "出典",
    "主アクター",
    "副アクター",
    "関連システム",
    "事前条件",
    "テストデータ(SEED)",
    "環境/マスタ",
    "実行用テストデータ",
    "データパターン数",
    "データパターン",
    "正常系ステップ数",
    "メインフロー（正常系）",
    "実行手順（正常系）",
    "分岐数",
    "代替フロー / 異常系分岐",
    "実行手順（代替系・異常系）",
    "完了条件",
    "システムテストカバレッジ",
    "エッジケース要約",
    "期待する主要機能No",
    "シナリオに紐づく機能No",
    "トレーサビリティ",
]

# 集約TSVの並び順は scenario_test/test_items 側の集約TSV/索引と揃える。
# 業務を「その業務が最初に触れる機能Noの最小ランク」で並べ、同一業務のSCNは連続させる。
BUSINESS_ORDER = [
    "M11", "M10", "M16", "M14", "M03", "M04", "M09", "F06", "M08", "F03",
    "F04", "M05", "F08", "M06", "O01", "F05", "M07", "F01", "F02", "M13",
    "F07", "M15", "M12",
]
BUSINESS_RANK = {prefix: index for index, prefix in enumerate(BUSINESS_ORDER)}
UNRANKED = len(BUSINESS_ORDER) + 1
FEATURE_RE = re.compile(r"\b[A-Z]\d{2}-\d{2}\b", re.I)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def compact(value: str) -> str:
    lines: list[str] = []
    for raw_line in value.replace("<br>", " / ").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if re.fullmatch(r"\|[\s:|-]+\|", line):
            continue
        line = re.sub(r"^\s*-\s+", "", line)
        line = line.replace("`", "")
        line = line.replace("**", "")
        line = line.replace("\t", " ")
        line = re.sub(r"<[^>]+>", "", line)
        line = re.sub(r"[ ]+", " ", line).strip()
        if line:
            lines.append(line)
    return " / ".join(lines)


def cell(value: str) -> str:
    value = value.replace("<br>", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("`", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def split_md_row(line: str) -> list[str]:
    return [cell(part) for part in line.strip().strip("|").split("|")]


def table_after(text: str, heading: str) -> list[dict[str, str]]:
    match = re.search(rf"^{re.escape(heading)}\n(?P<body>(?:\|.*\|\n?)+)", text, re.M)
    if not match:
        return []
    lines = [line for line in match.group("body").splitlines() if line.startswith("|")]
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


def feature_ids(value: str) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for match in FEATURE_RE.findall(value):
        feature = match.upper()
        if feature not in seen:
            seen.add(feature)
            result.append(feature)
    return result


def feature_list_value(text: str, label: str) -> list[str]:
    match = re.search(rf"^\s*-\s+\*\*{re.escape(label)}\*\*:\s*(?P<value>.*)$", text, re.M)
    return feature_ids(match.group("value")) if match else []


def mainflow_features(text: str) -> list[str]:
    features: list[str] = []
    for row in table_after(text, "## メインフロー（正常系）"):
        features.extend(feature_ids(row.get("利用画面・機能", "")))
    return features


def scenario_business_rank(text: str) -> int:
    """シナリオが最初に触れる（業務順リストにある）機能Noの業務順位。無ければ末尾。"""
    features = (
        mainflow_features(text)
        + feature_list_value(text, "シナリオに紐づく機能No")
        + feature_list_value(text, "期待する主要機能No")
    )
    for feature in features:
        prefix = feature.split("-")[0]
        if prefix in BUSINESS_RANK:
            return BUSINESS_RANK[prefix]
    return UNRANKED


def scenario_ordinal(sid: str) -> int:
    match = re.search(r"-(\d+)$", sid)
    return int(match.group(1)) if match else 999


def bold_value(text: str, label: str) -> str:
    match = re.search(rf"^\s*-\s+\*\*{re.escape(label)}\*\*:\s*(?P<value>.*)$", text, re.M)
    return compact(match.group("value")) if match else ""


def bullet_value(text: str, label: str) -> str:
    match = re.search(rf"^\s*-\s+{re.escape(label)}:\s*(?P<value>.*)$", text, re.M)
    return compact(match.group("value")) if match else ""


def section(text: str, heading: str) -> str:
    match = re.search(rf"^{re.escape(heading)}\n(?P<body>.*?)(?=^## |\Z)", text, re.S | re.M)
    return compact(match.group("body")) if match else ""


def table_row_count(text: str, heading: str) -> int:
    match = re.search(rf"^{re.escape(heading)}\n(?P<body>(?:\|.*\|\n?)+)", text, re.M)
    if not match:
        return 0
    rows = 0
    for line in match.group("body").splitlines():
        if not line.startswith("|"):
            continue
        if re.fullmatch(r"\|[\s:|-]+\|", line.strip()):
            continue
        rows += 1
    return max(rows - 1, 0)


def scenario_identity(text: str, path: Path) -> tuple[str, str]:
    match = re.search(r"^#\s+(?P<sid>SCN-[^\s]+)\s+(?P<title>.+)$", text, re.M)
    if match:
        return match.group("sid"), compact(match.group("title"))
    fallback = path.stem.split("_", 1)
    return fallback[0], compact(fallback[1] if len(fallback) > 1 else path.stem)


def business_from_flow(flow: str) -> str:
    if "/" in flow:
        return flow.split("/", 1)[0].strip()
    return flow.strip()


def relative_path(repo: Path, path: Path) -> str:
    try:
        return path.relative_to(repo).as_posix()
    except ValueError:
        return path.as_posix()


def scenario_row(repo: Path, path: Path) -> list[str]:
    text = read(path)
    sid, title = scenario_identity(text, path)
    flow = bullet_value(text, "業務フロー番号") or bold_value(text, "カバーする業務フロー番号")
    return [
        sid,
        business_from_flow(flow),
        title,
        relative_path(repo, path),
        bold_value(text, "目的"),
        bold_value(text, "分類"),
        bold_value(text, "優先度"),
        bold_value(text, "業務トリガー"),
        flow,
        bold_value(text, "経路ID"),
        bold_value(text, "経路種別"),
        bold_value(text, "親業務フローパターン"),
        bold_value(text, "業務経路条件"),
        bold_value(text, "最終業務状態"),
        bullet_value(text, "出典"),
        bold_value(text, "主アクター"),
        bold_value(text, "副アクター"),
        bold_value(text, "関連システム"),
        bold_value(text, "事前条件"),
        bold_value(text, "テストデータ(SEED)"),
        bold_value(text, "環境/マスタ"),
        section(text, "## 実行用テストデータ"),
        str(table_row_count(text, "## データパターン")),
        section(text, "## データパターン"),
        str(table_row_count(text, "## メインフロー（正常系）")),
        section(text, "## メインフロー（正常系）"),
        section(text, "## 実行手順（正常系）"),
        str(table_row_count(text, "## 代替フロー / 異常系分岐")),
        section(text, "## 代替フロー / 異常系分岐"),
        section(text, "## 実行手順（代替系・異常系）"),
        section(text, "## 完了条件（業務的ゴール／データ状態の最終確認）"),
        section(text, "## システムテストカバレッジ"),
        section(text, "## エッジケース要約"),
        bold_value(text, "期待する主要機能No"),
        bold_value(text, "シナリオに紐づく機能No"),
        section(text, "## トレーサビリティ"),
    ]


def scenario_files(repo: Path, include_manual: bool) -> list[Path]:
    scenario_dir = repo / "scenario_test" / "scenario"
    candidates = sorted(scenario_dir.glob("SCN-*.md"))
    if not include_manual:
        candidates = [path for path in candidates if GENERATED_MARKER in read(path)]

    by_id: dict[str, tuple[Path, str, str, int]] = {}
    for path in candidates:
        text = read(path)
        sid, _title = scenario_identity(text, path)
        flow = bullet_value(text, "業務フロー番号") or bold_value(text, "カバーする業務フロー番号")
        business = business_from_flow(flow)
        by_id[sid] = (path, sid, business, scenario_business_rank(text))

    records = list(by_id.values())
    business_min_rank: dict[str, int] = {}
    for _path, _sid, business, rank in records:
        business_min_rank[business] = min(business_min_rank.get(business, UNRANKED), rank)

    records.sort(key=lambda record: (
        business_min_rank[record[2]],
        record[2],
        scenario_ordinal(record[1]),
        record[1],
    ))
    return [path for path, _sid, _business, _rank in records]


def write_tsv(path: Path, rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(HEADER)
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".", help="Repository root")
    parser.add_argument("--output", default="scenario_test/scenario/all_scenarios.tsv", help="Output TSV path")
    parser.add_argument("--include-manual", action="store_true", help="Include non-generated root-level SCN files")
    parser.add_argument("--dry-run", action="store_true", help="Print target/count without writing")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    output = (repo / args.output).resolve()
    files = scenario_files(repo, args.include_manual)
    rows = [scenario_row(repo, path) for path in files]
    if args.dry_run:
        print(f"would write: {relative_path(repo, output)}")
        print(f"scenarios: {len(rows)}")
        return 0
    write_tsv(output, rows)
    print(f"wrote: {relative_path(repo, output)}")
    print(f"scenarios: {len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
