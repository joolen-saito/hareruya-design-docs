#!/usr/bin/env python3
"""Manage one-by-one fact checking for Backlog drift exports."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPORT_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = REPORT_ROOT.parents[1]
FINDINGS_DIR = REPORT_ROOT / "findings"
VERIFIED_DIR = REPORT_ROOT / "backlog_verified_items"
QUEUE_PATH = REPORT_ROOT / "backlog_factcheck_queue.json"
REVIEW_DIR = REPORT_ROOT / "reviews" / "backlog_factcheck"

STATUS_PENDING = "pending"
STATUS_VERIFIED = "verified"
STATUS_REJECTED = "rejected"
STATUS_NEEDS_REVIEW = "needs_review"
# 事実確認済みだが backlog_verified_items/ 未登録。verified は registry 登録済みを意味し
# sync() が registry の有無で上書きするため、事実確認だけ終えた項目を別ステータスで保持する。
STATUS_CONFIRMED = "confirmed"
STATUSES = {STATUS_PENDING, STATUS_VERIFIED, STATUS_REJECTED, STATUS_NEEDS_REVIEW, STATUS_CONFIRMED}


def main() -> int:
    parser = argparse.ArgumentParser(description="Track one-by-one fact checking for Backlog Markdown exports.")
    sub = parser.add_subparsers(dest="command", required=True)

    sync = sub.add_parser("sync", help="Synchronize findings into the fact-check queue.")
    sync.add_argument("--write", action="store_true", help="Write backlog_factcheck_queue.json.")

    status = sub.add_parser("status", help="Print queue status counts.")
    status.add_argument("--json", action="store_true", help="Print machine-readable JSON.")

    nxt = sub.add_parser("next", help="Print next candidates to fact-check.")
    nxt.add_argument("--limit", type=int, default=10)
    nxt.add_argument("--status", choices=sorted(STATUSES), default=STATUS_PENDING)
    nxt.add_argument("--implementation-gap-first", action="store_true")

    reject = sub.add_parser("reject", help="Mark a candidate as rejected after source review.")
    reject.add_argument("--key", required=True)
    reject.add_argument("--reason", required=True)

    needs_review = sub.add_parser("needs-review", help="Mark a candidate as requiring critical review.")
    needs_review.add_argument("--key", required=True)
    needs_review.add_argument("--reason", required=True)

    confirm = sub.add_parser("confirm", help="Mark a candidate as fact-checked against source (not yet exported).")
    confirm.add_argument("--key", required=True)
    confirm.add_argument("--reason", required=True)

    pack = sub.add_parser("review-pack", help="Write a critical-review packet for one candidate.")
    pack.add_argument("--key", required=True)

    validate = sub.add_parser("validate", help="Validate queue and verified registry consistency.")
    validate.add_argument("--strict", action="store_true", help="Fail if queue is not fully resolved.")

    args = parser.parse_args()
    if args.command == "sync":
        queue = sync_queue(write=args.write)
        print_summary(queue, as_json=False)
    elif args.command == "status":
        print_summary(load_queue(), as_json=args.json)
    elif args.command == "next":
        print_next(load_queue(), args.limit, args.status, args.implementation_gap_first)
    elif args.command == "reject":
        mark(args.key, STATUS_REJECTED, args.reason)
    elif args.command == "needs-review":
        mark(args.key, STATUS_NEEDS_REVIEW, args.reason)
    elif args.command == "confirm":
        mark(args.key, STATUS_CONFIRMED, args.reason)
    elif args.command == "review-pack":
        write_review_pack(args.key)
    elif args.command == "validate":
        validate_queue(strict=args.strict)
    else:
        raise AssertionError(args.command)
    return 0


def sync_queue(write: bool) -> list[dict[str, Any]]:
    existing = {entry["key"]: entry for entry in load_queue(allow_missing=True)}
    verified = load_verified_index()
    queue: list[dict[str, Any]] = []

    for finding_path in sorted(FINDINGS_DIR.glob("*.json")):
        data = load_json(finding_path)
        source_finding = rel_to_workspace(finding_path)
        for index, finding in enumerate(data.get("findings", [])):
            if not isinstance(finding, dict):
                continue
            finding_id = str(finding.get("id") or f"{finding_path.stem}#{index}")
            key = f"{source_finding}#{finding_id}"
            previous = existing.get(key, {})
            verified_item = verified.get(key)
            status = STATUS_VERIFIED if verified_item else previous.get("status", STATUS_PENDING)
            if status not in STATUSES:
                status = STATUS_PENDING
            entry = {
                "key": key,
                "status": status,
                "sourceFinding": source_finding,
                "sourceFindingId": finding_id,
                "findingIndex": index,
                "verifiedItemId": verified_item.get("id") if verified_item else previous.get("verifiedItemId"),
                "functionId": finding.get("functionId") or data.get("functionId"),
                "title": data.get("title") or data.get("sheetName"),
                "dimension": finding.get("dimension"),
                "confidence": finding.get("confidence") or finding.get("verdict"),
                "implementationGap": bool(finding.get("implementationGap")),
                "issueCategory": "実装漏れ" if finding.get("implementationGap") is True else "実装違い",
                "severity": finding.get("severity"),
                "designExpectation": finding.get("designExpectation") or first_comparison_value(finding, "design"),
                "implementationActual": finding.get("implementationActual") or first_comparison_value(finding, "implementation"),
                "mismatchReason": finding.get("mismatchReason") or finding.get("difference"),
                "notes": previous.get("notes", []),
                "updatedAt": previous.get("updatedAt"),
            }
            if verified_item:
                entry["updatedAt"] = verified_item.get("verification", {}).get("verifiedAt") or entry["updatedAt"]
            queue.append(entry)

        requirements = (data.get("requirementTraceGate") or {}).get("requirements") or []
        for index, requirement in enumerate(requirements):
            if not isinstance(requirement, dict) or requirement.get("coveredByFinding") is True:
                continue
            requirement_id = str(requirement.get("id") or f"{finding_path.stem}-req-{index}")
            key = f"{source_finding}#{requirement_id}"
            previous = existing.get(key, {})
            verified_item = verified.get(key)
            status = STATUS_VERIFIED if verified_item else previous.get("status", STATUS_PENDING)
            if status not in STATUSES:
                status = STATUS_PENDING
            entry = {
                "key": key,
                "status": status,
                "candidateType": "requirement",
                "sourceFinding": source_finding,
                "sourceRequirementId": requirement_id,
                "requirementIndex": index,
                "verifiedItemId": verified_item.get("id") if verified_item else previous.get("verifiedItemId"),
                "functionId": data.get("functionId"),
                "title": data.get("title") or data.get("sheetName"),
                "dimension": "未カバー個別要求",
                "confidence": "UNVERIFIED",
                "implementationGap": False,
                "issueCategory": "要事実確認",
                "severity": None,
                "designExpectation": requirement.get("designRequirement"),
                "implementationActual": "未照合。設計要求に対応する実装箇所または乖離所見がまだ確認されていない。",
                "mismatchReason": "requirementTraceGate で coveredByFinding=false のため、ソースコードとの個別事実確認が必要。",
                "notes": previous.get("notes", []),
                "updatedAt": previous.get("updatedAt"),
            }
            if verified_item:
                entry["updatedAt"] = verified_item.get("verification", {}).get("verifiedAt") or entry["updatedAt"]
            queue.append(entry)

    queue.sort(key=queue_sort_key)
    if write:
        QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return queue


def load_verified_index() -> dict[str, dict[str, Any]]:
    verified: dict[str, dict[str, Any]] = {}
    for path in sorted(VERIFIED_DIR.glob("*.json")):
        item = load_json(path)
        source = require(item, "sourceFinding", path)
        source_id = item.get("sourceFindingId") or item.get("sourceRequirementId")
        if not isinstance(source_id, str) or not source_id:
            raise SystemExit(f"{path}: missing required sourceFindingId or sourceRequirementId")
        key = f"{source}#{source_id}"
        if key in verified:
            raise SystemExit(f"duplicate verified source finding: {key}")
        verified[key] = item
    return verified


def load_queue(allow_missing: bool = False) -> list[dict[str, Any]]:
    if not QUEUE_PATH.exists():
        if allow_missing:
            return []
        raise SystemExit(f"queue not found; run: {Path(__file__).name} sync --write")
    data = load_json(QUEUE_PATH)
    if not isinstance(data, list):
        raise SystemExit(f"{QUEUE_PATH}: queue root must be a list")
    return data


def print_summary(queue: list[dict[str, Any]], as_json: bool) -> None:
    counts = Counter(entry["status"] for entry in queue)
    gap_counts = Counter(entry["status"] for entry in queue if entry.get("implementationGap"))
    type_counts = Counter(entry.get("candidateType", "finding") for entry in queue)
    type_status_counts = {
        candidate_type: dict(sorted(Counter(entry["status"] for entry in queue if entry.get("candidateType", "finding") == candidate_type).items()))
        for candidate_type in sorted(type_counts)
    }
    summary = {
        "total": len(queue),
        "statuses": dict(sorted(counts.items())),
        "implementationGapStatuses": dict(sorted(gap_counts.items())),
        "candidateTypes": dict(sorted(type_counts.items())),
        "candidateTypeStatuses": type_status_counts,
        "queuePath": rel_to_workspace(QUEUE_PATH),
        "verifiedRegistryCount": len(load_verified_index()),
    }
    if as_json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    print(f"queue: {summary['queuePath']}")
    print(f"total: {summary['total']}")
    for status in sorted(STATUSES):
        print(f"{status}: {counts.get(status, 0)}")
    print(f"verified registry: {summary['verifiedRegistryCount']}")
    print("candidate types:")
    for candidate_type, count in summary["candidateTypes"].items():
        print(f"  {candidate_type}: {count}")
    print("implementationGap:")
    for status in sorted(STATUSES):
        print(f"  {status}: {gap_counts.get(status, 0)}")


def print_next(queue: list[dict[str, Any]], limit: int, status: str, implementation_gap_first: bool) -> None:
    rows = [entry for entry in queue if entry["status"] == status]
    if implementation_gap_first:
        rows.sort(key=queue_sort_key)
    for entry in rows[:limit]:
        print("---")
        print(f"key: {entry['key']}")
        source_id = entry.get("sourceFindingId") or entry.get("sourceRequirementId")
        print(f"source: {entry['sourceFinding']}#{source_id}")
        print(f"type: {entry.get('candidateType', 'finding')}")
        print(f"function: {entry.get('functionId') or '-'} / {entry.get('title') or '-'}")
        print(f"category: {entry.get('issueCategory')} / {entry.get('dimension')} / severity={entry.get('severity')}")
        print(f"design: {one_line(entry.get('designExpectation'))}")
        print(f"actual: {one_line(entry.get('implementationActual'))}")
        print(f"reason: {one_line(entry.get('mismatchReason'))}")


def mark(key: str, status: str, reason: str) -> None:
    queue = load_queue()
    now = datetime.now(timezone.utc).isoformat()
    for entry in queue:
        if entry["key"] == key:
            entry["status"] = status
            entry["updatedAt"] = now
            notes = entry.setdefault("notes", [])
            notes.append({"at": now, "status": status, "reason": reason})
            QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"marked {status}: {key}")
            return
    raise SystemExit(f"key not found: {key}")


def mark_many(updates: list[tuple[str, str, str]]) -> tuple[int, list[str]]:
    """Apply many (key, status, reason) updates in one read-modify-write.

    mark() rewrites the whole 6MB queue per call, so bulk callers must not loop over it.
    Returns (applied_count, missing_keys).
    """
    queue = load_queue()
    index = {entry["key"]: entry for entry in queue}
    now = datetime.now(timezone.utc).isoformat()
    applied = 0
    missing: list[str] = []
    for key, status, reason in updates:
        if status not in STATUSES:
            raise SystemExit(f"invalid status for {key}: {status}")
        entry = index.get(key)
        if entry is None:
            missing.append(key)
            continue
        entry["status"] = status
        entry["updatedAt"] = now
        entry.setdefault("notes", []).append({"at": now, "status": status, "reason": reason})
        applied += 1
    if applied:
        QUEUE_PATH.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return applied, missing


def write_review_pack(key: str) -> None:
    queue = load_queue()
    entry = next((row for row in queue if row["key"] == key), None)
    if entry is None:
        raise SystemExit(f"key not found: {key}")
    candidate = load_source_candidate(entry)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    out = REVIEW_DIR / f"{slugify(entry['sourceFindingId'])}.md"
    lines = [
        "# Backlog Drift Fact-Check Review Pack",
        "",
        "## Review Request",
        "Critically review this single candidate. Do not trust the existing finding by itself.",
        "Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.",
        "",
        "## Candidate",
        f"- key: `{entry['key']}`",
        f"- sourceFinding: `{entry['sourceFinding']}`",
        f"- sourceFindingId: `{entry.get('sourceFindingId') or ''}`",
        f"- sourceRequirementId: `{entry.get('sourceRequirementId') or ''}`",
        f"- candidateType: `{entry.get('candidateType', 'finding')}`",
        f"- function: `{entry.get('functionId') or ''}` / {entry.get('title') or ''}",
        f"- issueCategory: {entry.get('issueCategory')}",
        f"- dimension: {entry.get('dimension')}",
        "",
        "## Finding Fields",
        f"- designExpectation: {one_line(candidate.get('designExpectation') or candidate.get('designRequirement'))}",
        f"- implementationActual: {one_line(candidate.get('implementationActual'))}",
        f"- mismatchReason: {one_line(candidate.get('mismatchReason') or candidate.get('difference') or entry.get('mismatchReason'))}",
        f"- designRefDetail: {one_line(candidate.get('designRefDetail') or candidate.get('designRef'))}",
        f"- implRef: {one_line(candidate.get('implRef'))}",
        "",
        "## Required Checks",
        "- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.",
        "- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.",
        "- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.",
        "- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.",
        "- If false or weak, mark the queue item rejected or needs_review with the reason.",
        "",
        "## Raw Finding JSON",
        "```json",
        json.dumps(candidate, ensure_ascii=False, indent=2),
        "```",
        "",
    ]
    out.write_text("\n".join(lines), encoding="utf-8")
    print(rel_to_workspace(out))


def validate_queue(strict: bool) -> None:
    queue = load_queue()
    keys = {entry["key"] for entry in queue}
    if len(keys) != len(queue):
        raise SystemExit("queue contains duplicate keys")
    verified = load_verified_index()
    missing = sorted(set(verified) - keys)
    if missing:
        raise SystemExit("verified items missing from queue:\n" + "\n".join(missing))
    for entry in queue:
        if entry["status"] not in STATUSES:
            raise SystemExit(f"invalid status for {entry['key']}: {entry['status']}")
    if strict:
        unresolved = [entry for entry in queue if entry["status"] in {STATUS_PENDING, STATUS_NEEDS_REVIEW}]
        if unresolved:
            raise SystemExit(f"unresolved queue entries remain: {len(unresolved)}")
    print("queue validation passed")


def load_source_finding(source_finding: str, source_finding_id: str) -> dict[str, Any]:
    data = load_json(WORKSPACE_ROOT / source_finding)
    for finding in data.get("findings", []):
        if isinstance(finding, dict) and finding.get("id") == source_finding_id:
            return finding
    raise SystemExit(f"sourceFindingId not found: {source_finding}#{source_finding_id}")


def load_source_requirement(source_finding: str, source_requirement_id: str) -> dict[str, Any]:
    data = load_json(WORKSPACE_ROOT / source_finding)
    requirements = (data.get("requirementTraceGate") or {}).get("requirements") or []
    for requirement in requirements:
        if isinstance(requirement, dict) and requirement.get("id") == source_requirement_id:
            return requirement
    raise SystemExit(f"sourceRequirementId not found: {source_finding}#{source_requirement_id}")


def load_source_candidate(entry: dict[str, Any]) -> dict[str, Any]:
    if entry.get("sourceFindingId"):
        return load_source_finding(entry["sourceFinding"], entry["sourceFindingId"])
    if entry.get("sourceRequirementId"):
        return load_source_requirement(entry["sourceFinding"], entry["sourceRequirementId"])
    raise SystemExit(f"queue entry has no source id: {entry.get('key')}")


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"{path}: invalid JSON: {exc}") from exc


def require(item: dict[str, Any], key: str, path: Path) -> str:
    value = item.get(key)
    if not isinstance(value, str) or not value:
        raise SystemExit(f"{path}: missing required string {key}")
    return value


def first_comparison_value(finding: dict[str, Any], key: str) -> str | None:
    rows = finding.get("comparisonRows")
    if not isinstance(rows, list) or not rows:
        return None
    first = rows[0]
    if not isinstance(first, dict):
        return None
    value = first.get(key)
    return str(value) if value is not None else None


def rel_to_workspace(path: Path) -> str:
    return str(path.resolve().relative_to(WORKSPACE_ROOT))


def one_line(value: Any, limit: int = 240) -> str:
    text = "" if value is None else str(value)
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    return slug.strip("-") or "item"


def status_sort(status: str) -> int:
    return {
        STATUS_PENDING: 0,
        STATUS_NEEDS_REVIEW: 1,
        STATUS_CONFIRMED: 2,
        STATUS_VERIFIED: 3,
        STATUS_REJECTED: 4,
    }.get(status, 9)


def queue_sort_key(entry: dict[str, Any]) -> tuple[Any, ...]:
    candidate_type = entry.get("candidateType", "finding")
    position = entry.get("findingIndex") if candidate_type == "finding" else entry.get("requirementIndex")
    if not isinstance(position, int):
        position = 0
    return (
        status_sort(entry["status"]),
        0 if entry.get("implementationGap") else 1,
        0 if candidate_type == "finding" else 1,
        entry["sourceFinding"],
        position,
    )


if __name__ == "__main__":
    raise SystemExit(main())
