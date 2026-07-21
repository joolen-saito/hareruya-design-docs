#!/usr/bin/env python3
"""Apply agent fact-check results to the queue and render confirmed reviews.

Agents write one result JSON per chunk. This script is the only writer of
backlog_factcheck_queue.json for that batch, so parallel agents never race on it.

Every CONFIRMED verdict must carry snippet evidence whose line range really exists
and really contains the quoted strings. A snippet that fails extraction is treated
as fabricated: the verdict is demoted to UNCERTAIN and the item goes to needs_review.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import backlog_factcheck_workflow as wf
from export_verified_backlog_items import (
    Snippet,
    ValidationError,
    extract_snippet,
    slugify,
)

REPORT_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = REPORT_ROOT.parents[1]
WORK_ROOT = REPORT_ROOT / "factcheck_work"
VERIFY_DIR = WORK_ROOT / "results"
REFUTE_DIR = WORK_ROOT / "refute"
REVIEW_DIR = REPORT_ROOT / "reviews" / "requirement_differences"

VERDICT_CONFIRMED = "CONFIRMED"
VERDICT_REFUTED = "REFUTED"
VERDICT_UNCERTAIN = "UNCERTAIN"
VERDICTS = {VERDICT_CONFIRMED, VERDICT_REFUTED, VERDICT_UNCERTAIN}

ENTERPRISE_PREFIX = "ec-cube-enterprise/"
DESIGN_PREFIX = "hareruya-design-docs/excel_to_html/output/"


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply fact-check results to queue and reviews.")
    parser.add_argument("--write", action="store_true", help="Update queue and write reviews.")
    parser.add_argument("--dry-run", action="store_true", help="Validate only; report what would change.")
    parser.add_argument("--verify-dir", type=Path, default=VERIFY_DIR)
    parser.add_argument("--refute-dir", type=Path, default=REFUTE_DIR)
    parser.add_argument("--allow-bad-files", action="store_true",
                        help="壊れた結果ファイルがあっても書き込みを続行する。")
    args = parser.parse_args()
    if not args.write and not args.dry_run:
        parser.error("pass --dry-run or --write")

    results = load_results(args.verify_dir, args.refute_dir)
    if not results:
        print("no result files found")
        return 0

    decided, demotions = decide(results)
    print_summary(results, decided, demotions)

    if BAD_FILES:
        print(f"\n読めなかった結果ファイル: {len(BAD_FILES)}（該当チャンクは未確定のまま。再実行せよ）")
        for path, why in BAD_FILES:
            print(f"  {rel(path)}: {why}")

    if args.dry_run:
        return 0

    if BAD_FILES and not args.allow_bad_files:
        raise SystemExit(
            "壊れた結果ファイルがあるため書き込みを中止した。"
            "該当チャンクを再実行するか --allow-bad-files を付けて意図的に無視すること。"
        )

    updates = skip_already_applied(
        [(key, queue_status(record), queue_reason(record)) for key, record in sorted(decided.items())]
    )
    applied, missing = wf.mark_many(updates)
    print(f"\nqueue updated: {applied} applied, {len(missing)} keys missing")
    for key in missing[:10]:
        print(f"  missing: {key}")

    confirmed = {key: record for key, record in decided.items() if record["verdict"] == VERDICT_CONFIRMED}
    written = render_reviews(confirmed)
    print(f"reviews written: {written} -> {rel(REVIEW_DIR)}")
    return 0


BAD_FILES: list[tuple[Path, str]] = []


def load_results(verify_dir: Path, refute_dir: Path) -> dict[str, dict[str, Any]]:
    """Merge verify results with refute overrides, keyed by queue key.

    An unreadable chunk is skipped, not fatal: agents occasionally emit invalid JSON
    (an unescaped quote inside a reason string). Those chunks stay undecided so the
    queue keeps them pending and the chunk can simply be re-run.
    """
    records: dict[str, dict[str, Any]] = {}
    for path in sorted(verify_dir.glob("*.json")) if verify_dir.exists() else []:
        for entry in read_chunk(path):
            entry["stage"] = "verify"
            entry["sourceFile"] = rel(path)
            records[entry["key"]] = entry

    for path in sorted(refute_dir.glob("*.json")) if refute_dir.exists() else []:
        for entry in read_chunk(path):
            base = records.get(entry["key"])
            if base is None:
                continue
            base["refute"] = entry
            if entry.get("refuted") is True:
                base["verdict"] = VERDICT_REFUTED
                base["refuteReason"] = entry.get("reason")
            elif entry.get("verdict") in VERDICTS:
                base["verdict"] = entry["verdict"]
                base["refuteReason"] = entry.get("reason")
    return records


def read_chunk(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        BAD_FILES.append((path, f"invalid JSON: {exc}"))
        return []
    rows = data.get("results") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        BAD_FILES.append((path, "expected a results list"))
        return []
    out = []
    for row in rows:
        if not isinstance(row, dict) or not row.get("key"):
            BAD_FILES.append((path, "result row missing key"))
            return []
        if row.get("verdict") not in VERDICTS and row.get("refuted") is None:
            BAD_FILES.append((path, f"bad verdict for {row['key']}: {row.get('verdict')}"))
            return []
        out.append(row)
    return out


def decide(records: dict[str, dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    """Validate evidence for every CONFIRMED. Demote whatever cannot be substantiated."""
    demotions: list[dict[str, Any]] = []
    for key, record in records.items():
        if record["verdict"] != VERDICT_CONFIRMED:
            continue
        problems = validate_confirmed(record)
        if problems:
            record["verdict"] = VERDICT_UNCERTAIN
            record["demotionReasons"] = problems
            demotions.append({"key": key, "problems": problems})
    return records, demotions


def validate_confirmed(record: dict[str, Any]) -> list[str]:
    problems: list[str] = []
    design = record.get("designEvidence")
    impl = record.get("implEvidence") or []
    category = record.get("issueCategory")

    if category not in {"実装漏れ", "実装違い"}:
        problems.append(f"issueCategory は実装漏れ/実装違いのいずれか。実際: {category!r}")
    if not isinstance(design, dict):
        problems.append("designEvidence が無い")
    if not impl:
        problems.append("implEvidence が空。ec-cube-enterprise 側の該当箇所または最寄りの不十分な実装を必ず示すこと")

    snippets: list[tuple[str, dict[str, Any]]] = []
    if isinstance(design, dict):
        snippets.append(("designEvidence", design))
    for index, spec in enumerate(impl):
        snippets.append((f"implEvidence[{index}]", spec))

    saw_enterprise = False
    for label, spec in snippets:
        if not isinstance(spec, dict):
            problems.append(f"{label}: オブジェクトでない")
            continue
        path = str(spec.get("path") or "")
        if label == "designEvidence" and not path.startswith(DESIGN_PREFIX):
            problems.append(f"{label}: 設計HTMLのパスでない: {path}")
        if label.startswith("implEvidence") and path.startswith(ENTERPRISE_PREFIX):
            saw_enterprise = True
        if not spec.get("contains"):
            problems.append(f"{label}: contains が空。引用の実在を検証できない")
            continue
        try:
            extract_snippet(spec, Path(record.get("sourceFile") or "result"))
        except (ValidationError, KeyError, ValueError, TypeError) as exc:
            problems.append(f"{label}: スニペット検証失敗: {exc}")

    if impl and not saw_enterprise:
        problems.append("implEvidence に ec-cube-enterprise/ 配下のパスが1件も無い")

    if category == "実装漏れ":
        commands = record.get("absenceCommands") or []
        if not commands or not any("rg " in str(c) for c in commands):
            problems.append("実装漏れ には不在を示した rg コマンドが必要")

    return problems


def skip_already_applied(updates: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    """Drop updates whose queue entry already carries the same status and reason.

    apply is re-run over the whole results directory after every batch, so without this
    each earlier batch would append a duplicate note on every subsequent run.
    """
    current = {entry["key"]: entry for entry in wf.load_queue()}
    fresh = []
    for key, status, reason in updates:
        entry = current.get(key)
        if entry and entry.get("status") == status:
            notes = entry.get("notes") or []
            if notes and notes[-1].get("reason") == reason:
                continue
        fresh.append((key, status, reason))
    skipped = len(updates) - len(fresh)
    if skipped:
        print(f"\n適用済みのためスキップ: {skipped}")
    return fresh


def queue_status(record: dict[str, Any]) -> str:
    return {
        VERDICT_CONFIRMED: wf.STATUS_CONFIRMED,
        VERDICT_REFUTED: wf.STATUS_REJECTED,
        VERDICT_UNCERTAIN: wf.STATUS_NEEDS_REVIEW,
    }[record["verdict"]]


def queue_reason(record: dict[str, Any]) -> str:
    parts = [str(record.get("reason") or record.get("summary") or "").strip()]
    if record.get("refuteReason"):
        parts.append(f"反証: {record['refuteReason']}")
    if record.get("demotionReasons"):
        parts.append("根拠不成立のため降格: " + " / ".join(record["demotionReasons"]))
    return " ｜ ".join(p for p in parts if p)[:1500] or "事実確認済み"


def render_reviews(confirmed: dict[str, dict[str, Any]]) -> int:
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for stale in REVIEW_DIR.glob("*.md"):
        stale.unlink()

    written = 0
    index_rows: list[tuple[str, dict[str, Any]]] = []
    for key, record in sorted(confirmed.items()):
        name = slugify(source_id(key))
        (REVIEW_DIR / f"{name}.md").write_text(render_review(key, record), encoding="utf-8")
        index_rows.append((name, record))
        written += 1

    lines = ["# 個別要求 未実装・実装違い — ソース事実確認済み", "",
             f"ec-cube-enterprise のソースを実際に照合し、反証を経て事実と確認できた {written} 件。", ""]
    for name, record in index_rows:
        lines.append(f"- [{record.get('functionId') or name}]({name}.md) "
                     f"{record.get('issueCategory')} / {one_line(record.get('summary'), 90)}")
    (REVIEW_DIR / "_index.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return written


def render_review(key: str, record: dict[str, Any]) -> str:
    lines = [
        f"# {record.get('functionId') or ''} {record.get('issueCategory') or ''}",
        "",
        f"- 判定: **{record['verdict']}**（confidence: {record.get('confidence') or '-'}）",
        f"- キュー: `{key}`",
        f"- 機能: {record.get('featureNo') or '-'} {record.get('title') or ''}",
        f"- 観点: {record.get('dimension') or '-'}",
        "",
        "## 要旨",
        str(record.get("summary") or "").strip() or "-",
        "",
        "## 判定理由",
        str(record.get("reason") or "").strip() or "-",
        "",
        "## 設計要求",
    ]
    design = record.get("designEvidence")
    if isinstance(design, dict):
        lines.extend(render_snippet(design))
    else:
        lines.append("-")

    lines += ["", "## ec-cube-enterprise 実装"]
    for spec in record.get("implEvidence") or []:
        if spec.get("note"):
            lines.append(f"{spec['note']}")
        lines.extend(render_snippet(spec))
        lines.append("")

    if record.get("absenceCommands"):
        lines += ["## 不在確認コマンド", ""]
        lines += [f"- `{command}`" for command in record["absenceCommands"]]
        lines.append("")

    if record.get("refute"):
        lines += ["## 反証結果", "",
                  f"反証を試みた結果、指摘は覆らなかった。{record['refute'].get('reason') or ''}".strip(), ""]
    return "\n".join(lines).rstrip() + "\n"


def render_snippet(spec: dict[str, Any]) -> list[str]:
    try:
        snippet: Snippet = extract_snippet(spec, Path("review"))
    except (ValidationError, KeyError, ValueError, TypeError) as exc:
        return [f"> スニペット取得不可: {exc}"]
    return [
        f"`{snippet.path}:{snippet.start}-{snippet.end}` — {snippet.label}",
        "",
        f"```{snippet.language}",
        snippet.code,
        "```",
    ]


def print_summary(results: dict, decided: dict, demotions: list) -> None:
    verdicts = Counter(record["verdict"] for record in decided.values())
    categories = Counter(
        record.get("issueCategory") for record in decided.values() if record["verdict"] == VERDICT_CONFIRMED
    )
    refuted_by_stage2 = sum(1 for r in decided.values() if r.get("refute", {}).get("refuted") is True)
    print(f"result rows: {len(results)}")
    for verdict in (VERDICT_CONFIRMED, VERDICT_REFUTED, VERDICT_UNCERTAIN):
        print(f"  {verdict}: {verdicts.get(verdict, 0)}")
    print(f"  うち反証パスで棄却: {refuted_by_stage2}")
    print(f"  根拠不成立で CONFIRMED→UNCERTAIN に降格: {len(demotions)}")
    print(f"confirmed categories: {dict(categories)}")
    for demotion in demotions[:10]:
        print(f"  demoted {demotion['key']}")
        for problem in demotion["problems"][:3]:
            print(f"    - {problem}")


def source_id(key: str) -> str:
    return key.split("#", 1)[1] if "#" in key else key


def one_line(value: Any, limit: int = 120) -> str:
    text = " ".join(str(value or "").split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def rel(path: Path) -> str:
    resolved = path.resolve()
    try:
        return str(resolved.relative_to(WORKSPACE_ROOT))
    except ValueError:
        return str(resolved)


if __name__ == "__main__":
    raise SystemExit(main())
