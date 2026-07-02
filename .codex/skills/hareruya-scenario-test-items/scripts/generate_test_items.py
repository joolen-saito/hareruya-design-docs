#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from io import StringIO
from pathlib import Path


GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-items -->"
SCENARIO_MARKER = "<!-- generated-by: hareruya-scenario-test-cases -->"
HEADER = [
    "シナリオID",
    "テストID",
    "フロー種別",
    "テスト観点",
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/対象",
    "操作手順/実行方法",
    "期待結果",
]
FORBIDDEN = (
    "UI標準",
    "設計書に記載のとおり",
    "設計どおり",
    "要確認",
    "UNRESOLVED",
    "何らか",
    "必要に応じ",
    "適宜",
    "...",
)


@dataclass(frozen=True)
class ScenarioDoc:
    path: Path
    sid: str
    title: str
    business: str
    priority: str
    business_trigger: str
    main_actor: str
    systems: str
    trace_source: str
    seed: dict[str, str]
    normal_rows: list[dict[str, str]]
    branch_rows: list[dict[str, str]]


@dataclass(frozen=True)
class TestItem:
    scenario_id: str
    test_id: str
    flow_type: str
    viewpoint: str
    priority: str
    item_name: str
    precondition: str
    input_data: str
    steps: str
    expected: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def cell(value: str) -> str:
    value = value.replace("<br>", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    value = value.replace("`", "")
    return re.sub(r"[ \t]+", " ", value).strip()


def split_md_row(line: str) -> list[str]:
    return [cell(part) for part in line.strip().strip("|").split("|")]


def table_after(text: str, heading: str) -> list[dict[str, str]]:
    m = re.search(rf"^{re.escape(heading)}\n(?P<body>(?:\|.*\|\n)+)", text, re.M)
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


def bullet_value(text: str, label: str, default: str = "-") -> str:
    m = re.search(rf"- \*\*{re.escape(label)}\*\*:\s*(.+)", text)
    return cell(m.group(1)) if m else default


def list_value(text: str, label: str, default: str = "-") -> str:
    m = re.search(rf"-\s+{re.escape(label)}:\s*(.+)", text)
    return cell(m.group(1)) if m else default


def parse_scenario(path: Path, repo: Path) -> ScenarioDoc | None:
    text = read_text(path)
    if SCENARIO_MARKER not in text:
        return None
    h = re.search(r"^#\s+(SCN-[^\s]+)\s+(.+)$", text, re.M)
    if not h:
        return None
    sid = h.group(1)
    title = cell(h.group(2))
    trace = list_value(text, "業務フロー番号")
    business = trace.split("/", 1)[0].strip() if "/" in trace else trace
    seed_rows = table_after(text, "## 実行用テストデータ")
    seed = {row.get("項目", ""): row.get("値", "") for row in seed_rows if row.get("項目")}
    return ScenarioDoc(
        path=path.relative_to(repo),
        sid=sid,
        title=title,
        business=business,
        priority=bullet_value(text, "優先度", "P2"),
        business_trigger=bullet_value(text, "業務トリガー", f"{title}を開始する"),
        main_actor=bullet_value(text, "主アクター", "業務担当者"),
        systems=bullet_value(text, "関連システム", "-"),
        trace_source=bullet_value(text, "カバーする業務フロー番号", trace),
        seed=seed,
        normal_rows=table_after(text, "## 実行手順（正常系）"),
        branch_rows=table_after(text, "## 実行手順（代替系・異常系）"),
    )


def primary_seed(seed: dict[str, str]) -> str:
    for key in ("受注番号", "商品コード", "買取受付番号", "ネット買取申込番号", "仕入番号", "イベントID", "デッキID", "価格変更CSV"):
        if seed.get(key):
            return f"{key}={seed[key]}"
    if seed:
        k = next(iter(seed))
        return f"{k}={seed[k]}"
    return "-"


def infer_viewpoint(flow_type: str, operation: str, expected: str) -> str:
    text = operation + " " + expected
    if flow_type == "異常系":
        if "権限" in text:
            return "権限"
        if "エラー" in text or "不正" in text or "不足" in text or "不一致" in text:
            return "バリデーション"
        return "異常制御"
    if flow_type == "代替系":
        if "返金" in text or "キャンセル" in text:
            return "代替業務"
        return "代替フロー"
    if "CSV" in text or "帳票" in text or "PDF" in text or "印刷" in text:
        return "CSV/帳票"
    if "メール" in text or "通知" in text:
        return "メール/通知"
    if "GMO" in text or "スマレジ" in text or "MTG" in text or "Backlog" in text:
        return "外部連携"
    if "登録" in text or "更新" in text or "ステータス" in text or "履歴" in text or "金額" in text:
        return "データ更新"
    if "照合" in text or "一致" in text:
        return "照合"
    return "業務操作"


def action_from_operation(operation: str) -> str:
    m = re.search(r"「(.+?)」", operation)
    if m:
        return cell(m.group(1))
    return cell(operation)


def normalize_action(action: str, s: ScenarioDoc) -> str:
    action = action.strip(" 。")
    action = re.sub(r"^[\-－]+", "", action)
    action = action.replace("必要に応じて", "対象条件に一致する場合は")
    action = action.replace("適宜", "対象条件に一致する場合は")
    if "何らかのトリガー" in action or not action:
        trigger = s.business_trigger.strip(" 。")
        trigger = trigger.replace("が必要になったとき", "の実施要求")
        return f"{trigger}を契機に対象データを確定する"
    return action


def function_from_operation(operation: str) -> str:
    before = operation.split("を開き", 1)[0].split("で ", 1)[0]
    return cell(before) if before else "対象画面"


def normal_steps(row: dict[str, str], s: ScenarioDoc) -> str:
    actor = row.get("担当者") or s.main_actor
    operation = row.get("操作", "")
    action = normalize_action(action_from_operation(operation), s)
    function = function_from_operation(operation)
    input_data = row.get("入力/対象", "") or primary_seed(s.seed)
    return f"担当者: {actor}\n1. {actor}が {function} を開く\n2. {input_data} を検索または指定する\n3. {action} を実行する"


def branch_steps(row: dict[str, str], s: ScenarioDoc) -> str:
    actor = row.get("担当者") or s.main_actor
    operation = row.get("操作", "")
    condition = "分岐条件"
    m = re.search(r"条件「(.+?)」", operation)
    if m:
        condition = normalize_action(m.group(1), s)
    function = function_from_operation(operation)
    input_data = row.get("入力/対象", "") or primary_seed(s.seed)
    return f"担当者: {actor}\n1. {actor}が {function} を開く\n2. {input_data} を検索または指定する\n3. 条件「{condition}」を満たすデータで実行する"


def item_title(flow_type: str, row_no: str, actor: str, operation: str, s: ScenarioDoc) -> str:
    action = normalize_action(action_from_operation(operation), s)
    return f"{flow_type} #{row_no}: {actor}が「{action}」を実行した結果を確認する"


def scenario_suffix(sid: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "-", sid.replace("SCN-", "").upper()).strip("-")


def flow_type_from_branch(branch_id: str) -> str:
    return "代替系" if branch_id.startswith("A") else "異常系"


def build_precondition(s: ScenarioDoc) -> str:
    parts = [
        f"元シナリオ: {s.sid} {s.title}",
        f"業務: {s.business}",
        f"主アクター: {s.main_actor}",
        f"関連システム: {s.systems}",
    ]
    if s.seed:
        parts.append("シードデータ: " + " / ".join(f"{k}={v}" for k, v in s.seed.items()))
    return "\n".join(parts)


def test_items_for(s: ScenarioDoc) -> list[TestItem]:
    items: list[TestItem] = []
    base = scenario_suffix(s.sid)
    precondition = build_precondition(s)
    counter = 1
    for row in s.normal_rows:
        operation = row.get("操作", "")
        expected = row.get("期待結果", "")
        input_data = row.get("入力/対象", "") or primary_seed(s.seed)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint("正常系", operation, expected)
        items.append(
            TestItem(
                s.sid,
                f"STI-{base}-{counter:03d}",
                "正常系",
                viewpoint,
                s.priority,
                item_title("正常系", row_no, actor, operation, s),
                precondition,
                input_data,
                normal_steps(row, s),
                expected,
            )
        )
        counter += 1
    for row in s.branch_rows:
        branch_id = row.get("分岐ID", "")
        flow_type = flow_type_from_branch(branch_id)
        operation = row.get("操作", "")
        expected = row.get("期待結果", "")
        input_data = row.get("入力/対象", "") or primary_seed(s.seed)
        actor = row.get("担当者") or s.main_actor
        row_no = row.get("#", str(counter))
        viewpoint = infer_viewpoint(flow_type, operation, expected)
        priority = "P1" if flow_type == "異常系" else s.priority
        items.append(
            TestItem(
                s.sid,
                f"STI-{base}-{counter:03d}",
                flow_type,
                viewpoint,
                priority,
                item_title(f"{flow_type} {branch_id}", row_no, actor, operation, s),
                precondition,
                f"{branch_id}\n{input_data}",
                branch_steps(row, s),
                expected,
            )
        )
        counter += 1
    return items


def tsv_text(rows: list[list[str]]) -> str:
    out = StringIO()
    writer = csv.writer(out, delimiter="\t", lineterminator="\n")
    writer.writerows(rows)
    return out.getvalue().rstrip("\n")


def rows_for_items(items: list[TestItem], collapse_newlines: bool = False) -> list[list[str]]:
    rows = [HEADER]
    for item in items:
        row = [
            item.scenario_id,
            item.test_id,
            item.flow_type,
            item.viewpoint,
            item.priority,
            item.item_name,
            item.precondition,
            item.input_data,
            item.steps,
            item.expected,
        ]
        if collapse_newlines:
            row = [re.sub(r"\s*\n\s*", " / ", value).strip() for value in row]
        rows.append(row)
    return rows


def output_name(s: ScenarioDoc) -> str:
    return s.path.name.replace("SCN-", "STI-", 1).replace(".md", "_test_items.md")


def render_sheet(s: ScenarioDoc, items: list[TestItem]) -> str:
    related = sorted({item.viewpoint for item in items})
    summary_rows = "\n".join(f"| {viewpoint} | {sum(1 for item in items if item.viewpoint == viewpoint)} |" for viewpoint in related)
    return f"""{GENERATED_MARKER}
# {s.sid} {s.title} シナリオテスト項目書

元シナリオ: `{s.path}`

- **業務**: {s.business}
- **業務フローキー**: {s.trace_source}
- **主アクター**: {s.main_actor}
- **関連システム**: {s.systems}
- **優先度**: {s.priority}

期待結果は画面表示、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果など、試験で観測できる結果で判定する。
TSV は10列固定で、Excel/Googleスプレッドシートへコードフェンス内を A1 に貼り付ける。

## 観点別件数

| テスト観点 | 件数 |
|---|---|
{summary_rows}

## テスト項目TSV

```tsv
{tsv_text(rows_for_items(items))}
```
"""


def discover_scenarios(repo: Path, only: str | None) -> list[ScenarioDoc]:
    result: list[ScenarioDoc] = []
    for path in sorted((repo / "scenario_test" / "scenario").glob("SCN-*.md")):
        if only and only not in path.name and only not in read_text(path):
            continue
        parsed = parse_scenario(path, repo)
        if parsed:
            result.append(parsed)
    return result


def is_generated(path: Path) -> bool:
    return GENERATED_MARKER in read_text(path)


def write_outputs(repo: Path, scenarios: list[ScenarioDoc], overwrite: bool, dry_run: bool, prune_obsolete: bool) -> None:
    out_dir = repo / "scenario_test" / "test_items"
    out_dir.mkdir(parents=True, exist_ok=True)
    all_items: list[TestItem] = []
    keep: set[Path] = set()
    index_rows = [
        "# シナリオテスト項目一覧（自動生成）",
        "",
        "| シナリオID | 業務 | テスト項目書 | 項目数 | 正常系 | 代替系 | 異常系 |",
        "|---|---|---|---|---|---|---|",
    ]
    for s in scenarios:
        items = test_items_for(s)
        all_items.extend(items)
        rel = Path("scenario_test") / "test_items" / output_name(s)
        keep.add(rel)
        normal = sum(1 for item in items if item.flow_type == "正常系")
        alt = sum(1 for item in items if item.flow_type == "代替系")
        err = sum(1 for item in items if item.flow_type == "異常系")
        index_rows.append(f"| {s.sid} | {s.business} | `{rel}` | {len(items)} | {normal} | {alt} | {err} |")
        path = repo / rel
        if path.exists() and not overwrite:
            print(f"skip existing {rel}")
            continue
        content = render_sheet(s, items)
        if any(phrase in content for phrase in FORBIDDEN):
            raise SystemExit(f"forbidden phrase generated for {s.sid}")
        if dry_run:
            print(f"would write {rel}")
        else:
            path.write_text(content, encoding="utf-8")
            print(f"wrote {rel}")
    all_tsv = tsv_text(rows_for_items(all_items, collapse_newlines=True)) + "\n"
    index = "\n".join(index_rows) + "\n"
    if dry_run:
        print(f"would write {out_dir.relative_to(repo) / 'all_scenario_test_items.tsv'}")
        print(f"would write {out_dir.relative_to(repo) / '00_テスト項目一覧.md'}")
    else:
        (out_dir / "all_scenario_test_items.tsv").write_text(all_tsv, encoding="utf-8")
        (out_dir / "00_テスト項目一覧.md").write_text(index, encoding="utf-8")
    if prune_obsolete:
        for path in sorted(out_dir.glob("STI-*.md")):
            rel = path.relative_to(repo)
            if rel in keep or not is_generated(path):
                continue
            if dry_run:
                print(f"would remove obsolete {rel}")
            else:
                path.unlink()
                print(f"removed obsolete {rel}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--only")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--prune-obsolete", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    scenarios = discover_scenarios(repo, args.only)
    if not scenarios:
        print("no generated scenario files found")
        return 1
    write_outputs(repo, scenarios, args.overwrite, args.dry_run, args.prune_obsolete)
    print(f"scenarios={len(scenarios)}")
    print(f"items={sum(len(test_items_for(s)) for s in scenarios)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
