#!/usr/bin/env python3
"""Find likely mismatches between Excel-derived HTML and embedded function docs.

This is a triage tool, not a proof. It looks for Excel text that says a
quantity changed, such as "5個から4個", then flags embedded function-design
blocks on the same sheet that still describe the old quantity.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "excel_to_html" / "output"
REPORT_PATH = ROOT / "functions" / "excel_markdown_consistency_audit.md"

CHANGE_RE = re.compile(
    r"(?P<old>[0-9０-９]+)\s*(?P<unit>個|件|枠|つ|種類|列|行)"
    r"\s*(?:から|→|->|⇒)\s*"
    r"(?P<new>[0-9０-９]+)\s*(?P=unit)"
)
EMBED_RE = re.compile(
    r"<!-- function-design-embed:start (?P<key>[^ ]+) -->"
    r"(?P<body>.*?)"
    r"<!-- function-design-embed:end (?P=key) -->",
    re.S,
)
PANEL_RE = re.compile(
    r'<section class="sheet-panel[^"]*" id="(?P<sheet_id>sheet-[^"]+)">'
    r"(?P<body>.*?)(?=<section class=\"sheet-panel|\Z)",
    re.S,
)
HEADING_RE = re.compile(r"<h2>(?P<heading>.*?)</h2>", re.S)
SOURCE_RE = re.compile(r'data-source="(?P<source>[^"]+)"')


FULLWIDTH_DIGITS = str.maketrans("０１２３４５６７８９", "0123456789")


@dataclass(frozen=True)
class Finding:
    html_file: str
    sheet: str
    key: str
    source: str
    excel_change: str
    embedded_hit: str
    excel_context: str
    embedded_context: str


def plain_text(fragment: str) -> str:
    fragment = re.sub(r"<style.*?</style>", "", fragment, flags=re.S)
    fragment = re.sub(r"<script.*?</script>", "", fragment, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", fragment))
    return re.sub(r"\s+", " ", text).strip()


def snippet(text: str, start: int, end: int, radius: int = 90) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    return text[left:right].strip()


def old_quantity_patterns(old: str, unit: str) -> list[re.Pattern[str]]:
    old = old.translate(FULLWIDTH_DIGITS)
    fw_old = old.translate(str.maketrans("0123456789", "０１２３４５６７８９"))
    units = {unit}
    if unit == "個":
        units.update({"つ", "枠"})
    if unit in {"つ", "枠"}:
        units.update({"個"})
    return [
        re.compile(rf"{re.escape(value)}\s*(?:{'|'.join(map(re.escape, sorted(units)))})")
        for value in {old, fw_old}
    ]


def audit_html(path: Path) -> list[Finding]:
    document = path.read_text(encoding="utf-8", errors="replace")
    findings: list[Finding] = []
    for panel_match in PANEL_RE.finditer(document):
        panel = panel_match.group("body")
        heading_match = HEADING_RE.search(panel)
        sheet = plain_text(heading_match.group("heading")) if heading_match else panel_match.group("sheet_id")

        excel_only = EMBED_RE.sub(" ", panel)
        excel_text = plain_text(excel_only)
        changes = list(CHANGE_RE.finditer(excel_text))
        if not changes:
            continue

        for embed_match in EMBED_RE.finditer(panel):
            key = embed_match.group("key")
            embed_html = embed_match.group("body")
            embed_text = plain_text(embed_html)
            source_match = SOURCE_RE.search(embed_html)
            source = source_match.group("source") if source_match else ""

            for change in changes:
                old = change.group("old").translate(FULLWIDTH_DIGITS)
                new = change.group("new").translate(FULLWIDTH_DIGITS)
                unit = change.group("unit")
                if old == new:
                    continue
                for pattern in old_quantity_patterns(old, unit):
                    hit = pattern.search(embed_text)
                    if hit is None:
                        continue
                    findings.append(
                        Finding(
                            html_file=str(path.relative_to(ROOT)),
                            sheet=sheet,
                            key=key,
                            source=source,
                            excel_change=change.group(0),
                            embedded_hit=hit.group(0),
                            excel_context=snippet(excel_text, change.start(), change.end()),
                            embedded_context=snippet(embed_text, hit.start(), hit.end()),
                        )
                    )
                    break
    return findings


def render_report(findings: list[Finding]) -> str:
    lines = [
        "# Excel/Markdown Consistency Audit",
        "",
        "This report lists heuristic candidates where Excel-derived text says a quantity changed, "
        "but an embedded function-design block on the same sheet still mentions the old quantity.",
        "",
        f"Findings: {len(findings)}",
        "",
    ]
    for index, finding in enumerate(findings, 1):
        lines.extend(
            [
                f"## {index}. {finding.key}",
                "",
                f"- HTML: `{finding.html_file}`",
                f"- Sheet: {finding.sheet}",
                f"- Source: `{finding.source}`",
                f"- Excel change: `{finding.excel_change}`",
                f"- Embedded old-quantity hit: `{finding.embedded_hit}`",
                f"- Excel context: {finding.excel_context}",
                f"- Embedded context: {finding.embedded_context}",
                "",
            ]
        )
    return "\n".join(lines)


def main() -> int:
    findings: list[Finding] = []
    for path in sorted(OUTPUT_DIR.glob("*.html")):
        if path.name == "index.html":
            continue
        findings.extend(audit_html(path))
    REPORT_PATH.write_text(render_report(findings), encoding="utf-8")
    print(f"Wrote {REPORT_PATH} ({len(findings)} findings)")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
