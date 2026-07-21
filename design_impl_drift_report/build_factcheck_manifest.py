#!/usr/bin/env python3
"""Build per-chunk fact-check manifests for the requirement-difference audit.

Groups unresolved queue candidates by functionId, splits them into small chunks, and
inlines everything a verifier agent needs (design sheet line range, prior claim,
search terms) so the agent never has to open findings.json or scan a 18MB design HTML.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

REPORT_ROOT = Path(__file__).resolve().parent
DOCS_ROOT = REPORT_ROOT.parent
WORKSPACE_ROOT = REPORT_ROOT.parents[1]
FINDINGS_JSON = REPORT_ROOT / "findings.json"
QUEUE_PATH = REPORT_ROOT / "backlog_factcheck_queue.json"
WORK_ROOT = REPORT_ROOT / "factcheck_work"
MANIFEST_DIR = WORK_ROOT / "manifest"
EXCLUDED_FUNCTIONS_PATH = REPORT_ROOT / "phase2_excluded_functions.json"

WORK_STATUSES = {"pending", "needs_review"}
EXCLUDED_BUCKET = "対象外"
SHEET_SECTION_RE = re.compile(r'<section class="sheet-panel[^"]*" id="(sheet-\d+)">')

_sheet_range_cache: dict[str, dict[str, tuple[int, int]]] = {}


def main() -> int:
    parser = argparse.ArgumentParser(description="Build fact-check manifests grouped by function.")
    parser.add_argument("--chunk-size", type=int, default=20)
    parser.add_argument("--write", action="store_true", help="Write chunk JSON files.")
    parser.add_argument("--stats", action="store_true", help="Print counts only.")
    args = parser.parse_args()

    excluded_functions = load_excluded_functions()
    items = collect_items(excluded_functions)
    chunks = build_chunks(items, args.chunk_size)

    print_stats(items, chunks, excluded_functions)
    if args.stats and not args.write:
        return 0
    if args.write:
        write_chunks(chunks)
        print(f"\nwrote {len(chunks)} chunk files to {rel(MANIFEST_DIR)}")
    return 0


def load_excluded_functions() -> set[str]:
    """Function ids whose 対象外 requirements are genuinely out of scope.

    The harness buckets a requirement 対象外 whenever its *function* carries
    phase2Verdict=NOT_IMPLEMENTED_CONFIRMED, even when the design's Ph2 note only
    scopes one field. Only functions listed here are trusted; every other 対象外
    requirement is pulled back into the work set with disputedExclusion=true.
    """
    if not EXCLUDED_FUNCTIONS_PATH.exists():
        return set()
    data = json.loads(EXCLUDED_FUNCTIONS_PATH.read_text(encoding="utf-8"))
    return {str(entry["functionId"]) for entry in data["excludedFunctions"]}


def collect_items(excluded_functions: set[str]) -> list[dict[str, Any]]:
    data = json.loads(FINDINGS_JSON.read_text(encoding="utf-8"))
    functions = {fn["functionId"]: fn for fn in data["functions"]}
    conformance = {
        row["requirementId"]: row
        for fn in data["functions"]
        for row in (fn.get("requirementConformanceAudit") or {}).get("rows") or []
    }
    findings = {
        finding["id"]: finding
        for fn in data["functions"]
        for finding in fn.get("findings", [])
        if isinstance(finding, dict) and finding.get("id")
    }

    queue = json.loads(QUEUE_PATH.read_text(encoding="utf-8"))
    items: list[dict[str, Any]] = []
    for entry in queue:
        if entry["status"] not in WORK_STATUSES:
            continue
        function = functions.get(entry["functionId"])
        if function is None:
            continue
        candidate_type = entry.get("candidateType", "finding")
        row = conformance.get(entry.get("sourceRequirementId") or "")
        disputed = False
        if candidate_type == "requirement" and row and row.get("conformanceBucket") == EXCLUDED_BUCKET:
            if entry["functionId"] in excluded_functions:
                continue
            disputed = True
        items.append(build_item(entry, function, findings, row, disputed))
    return items


def build_item(
    entry: dict[str, Any],
    function: dict[str, Any],
    findings: dict[str, dict[str, Any]],
    conformance_row: dict[str, Any] | None,
    disputed: bool,
) -> dict[str, Any]:
    design_html = function.get("designHtml") or ""
    item: dict[str, Any] = {
        "key": entry["key"],
        "candidateType": entry.get("candidateType", "finding"),
        "queueStatus": entry["status"],
        "functionId": entry["functionId"],
        "featureNo": function.get("featureNo"),
        "title": function.get("title"),
        "domain": function.get("domain"),
        "designHtml": design_html,
        "designSheet": sheet_location(design_html),
        "issueCategory": entry.get("issueCategory"),
        "dimension": entry.get("dimension"),
        "severity": entry.get("severity"),
        "priorClaim": {
            "designExpectation": entry.get("designExpectation"),
            "implementationActual": entry.get("implementationActual"),
            "mismatchReason": entry.get("mismatchReason"),
        },
        "disputedExclusion": disputed,
    }
    if disputed:
        item["disputedExclusionNote"] = (
            "ハーネスは機能単位の phase2Verdict によりこの要求を対象外にしたが、"
            "設計のPh2注記が機能全体を覆うか未確認。要求単位でPh2該当かを判定すること。"
        )

    if item["candidateType"] == "finding":
        finding = findings.get(entry.get("sourceFindingId") or "") or {}
        item["sourceFindingId"] = entry.get("sourceFindingId")
        item["designRef"] = finding.get("designRef")
        item["designQuote"] = finding.get("designQuote")
        item["implRef"] = finding.get("implRef")
        item["implementationRefs"] = finding.get("implementationRefs") or []
        item["comparisonRows"] = finding.get("comparisonRows") or []
        item["requiredChange"] = finding.get("requiredChange")
        item["searchTerms"] = finding_search_terms(finding)
    else:
        row = conformance_row or {}
        item["sourceRequirementId"] = entry.get("sourceRequirementId")
        item["designRef"] = row.get("designRef")
        item["designRequirement"] = row.get("designRequirement")
        item["conformanceBucket"] = row.get("conformanceBucket")
        item["conformanceVerdict"] = row.get("verdict")
        item["auditNote"] = row.get("auditNote")
        item["material"] = row.get("material")
        item["elementLevel"] = row.get("elementLevel")
        item["candidateRefs"] = row.get("candidateRefs") or []
        item["searchTerms"] = row.get("searchTerms") or []
    return item


def finding_search_terms(finding: dict[str, Any]) -> list[str]:
    terms: list[str] = []
    for trace in finding.get("requirementTrace") or []:
        for term in trace.get("implementationSearchTerms") or []:
            if term not in terms:
                terms.append(str(term))
    return terms[:24]


def sheet_location(design_html: str) -> dict[str, Any] | None:
    """Resolve `path.html#sheet-N` to a concrete line range in that file."""
    if "#" not in design_html:
        return None
    rel_path, _, anchor = design_html.partition("#")
    path = DOCS_ROOT / rel_path
    if not path.exists():
        return None
    ranges = sheet_ranges(path)
    span = ranges.get(anchor)
    if span is None:
        return None
    return {
        "path": f"hareruya-design-docs/{rel_path}",
        "anchor": anchor,
        "start": span[0],
        "end": span[1],
        "lines": span[1] - span[0] + 1,
    }


def sheet_ranges(path: Path) -> dict[str, tuple[int, int]]:
    cached = _sheet_range_cache.get(str(path))
    if cached is not None:
        return cached
    starts: list[tuple[int, str]] = []
    total = 0
    with path.open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            total = number
            match = SHEET_SECTION_RE.search(line)
            if match:
                starts.append((number, match.group(1)))
    ranges: dict[str, tuple[int, int]] = {}
    for index, (line_no, anchor) in enumerate(starts):
        end = starts[index + 1][0] - 1 if index + 1 < len(starts) else total
        ranges[anchor] = (line_no, end)
    _sheet_range_cache[str(path)] = ranges
    return ranges


def build_chunks(items: list[dict[str, Any]], chunk_size: int) -> list[dict[str, Any]]:
    by_function: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        by_function[item["functionId"]].append(item)

    chunks: list[dict[str, Any]] = []
    for function_id in sorted(by_function):
        group = by_function[function_id]
        total = math.ceil(len(group) / chunk_size)
        for index in range(total):
            part = group[index * chunk_size : (index + 1) * chunk_size]
            first = part[0]
            chunks.append({
                "chunkId": f"{function_id}--{index + 1:02d}",
                "functionId": function_id,
                "featureNo": first.get("featureNo"),
                "title": first.get("title"),
                "domain": first.get("domain"),
                "designHtml": first.get("designHtml"),
                "designSheet": first.get("designSheet"),
                "partIndex": index + 1,
                "partCount": total,
                "itemCount": len(part),
                "items": part,
            })
    return chunks


def write_chunks(chunks: list[dict[str, Any]]) -> None:
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    for stale in MANIFEST_DIR.glob("*.json"):
        stale.unlink()
    for chunk in chunks:
        path = MANIFEST_DIR / f"{chunk['chunkId']}.json"
        path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index = [
        {
            "chunkId": chunk["chunkId"],
            "functionId": chunk["functionId"],
            "featureNo": chunk["featureNo"],
            "domain": chunk["domain"],
            "designHtml": chunk["designHtml"],
            "itemCount": chunk["itemCount"],
            "path": rel(MANIFEST_DIR / f"{chunk['chunkId']}.json"),
        }
        for chunk in chunks
    ]
    (WORK_ROOT / "manifest_index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def print_stats(items: list[dict[str, Any]], chunks: list[dict[str, Any]], excluded: set[str]) -> None:
    types = Counter(item["candidateType"] for item in items)
    disputed = sum(1 for item in items if item["disputedExclusion"])
    missing_sheet = [item["functionId"] for item in items if not item["designSheet"]]
    print(f"work items: {len(items)}")
    print(f"  finding: {types['finding']}")
    print(f"  requirement: {types['requirement']}")
    print(f"  disputedExclusion (対象外だが機能単位フラグ由来): {disputed}")
    print(f"trusted excluded functions: {len(excluded)}")
    print(f"functions: {len({item['functionId'] for item in items})}")
    print(f"chunks: {len(chunks)}")
    if missing_sheet:
        print(f"WARNING: design sheet range unresolved for {len(set(missing_sheet))} functions:")
        for function_id in sorted(set(missing_sheet))[:10]:
            print(f"  {function_id}")


def rel(path: Path) -> str:
    return str(path.resolve().relative_to(WORKSPACE_ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
