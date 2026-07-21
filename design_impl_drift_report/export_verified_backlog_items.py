#!/usr/bin/env python3
"""Export fact-checked drift items as Backlog-ready Markdown."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPORT_ROOT = Path(__file__).resolve().parent
WORKSPACE_ROOT = REPORT_ROOT.parents[1]
DEFAULT_REGISTRY_DIR = REPORT_ROOT / "backlog_verified_items"
DEFAULT_OUTPUT_DIR = REPORT_ROOT / "backlog_markdown"
REFERENCE_EXAMPLE = "https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618"


class ValidationError(Exception):
    pass


@dataclass(frozen=True)
class Snippet:
    label: str
    path: str
    start: int
    end: int
    language: str
    code: str

    @property
    def ref(self) -> str:
        if self.start == self.end:
            return f"{self.path}:{self.start}"
        return f"{self.path}:{self.start}-{self.end}"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export verified Hareruya drift items to Backlog Markdown.",
    )
    parser.add_argument("--registry-dir", type=Path, default=DEFAULT_REGISTRY_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--id", action="append", dest="ids", help="Export only this item id. Can be repeated.")
    parser.add_argument("--dry-run", action="store_true", help="Validate and render without writing files.")
    args = parser.parse_args()

    try:
        items = load_items(args.registry_dir, set(args.ids or []))
        rendered = [(item["id"], render_item(item)) for item in items]
        if not args.dry_run:
            args.output_dir.mkdir(parents=True, exist_ok=True)
            for item_id, body in rendered:
                (args.output_dir / f"{slugify(item_id)}.md").write_text(body, encoding="utf-8")
            write_index(args.output_dir, items)
    except ValidationError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    action = "validated" if args.dry_run else "exported"
    print(f"{action}: {len(rendered)} item(s)")
    for item_id, _ in rendered:
        print(f"- {item_id}")
    return 0


def load_items(registry_dir: Path, wanted_ids: set[str]) -> list[dict[str, Any]]:
    if not registry_dir.exists():
        raise ValidationError(f"registry directory not found: {registry_dir}")

    items: list[dict[str, Any]] = []
    for path in sorted(registry_dir.glob("*.json")):
        item = load_json(path)
        item_id = require_str(item, "id", path)
        if wanted_ids and item_id not in wanted_ids:
            continue
        if item.get("status") != "verified":
            raise ValidationError(f"{path}: status must be verified before export")
        validate_item(item, path)
        items.append(item)

    if wanted_ids:
        found = {item["id"] for item in items}
        missing = sorted(wanted_ids - found)
        if missing:
            raise ValidationError(f"requested id(s) not found: {', '.join(missing)}")
    if not items:
        raise ValidationError("no registry items matched")
    return items


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValidationError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValidationError(f"{path}: root must be an object")
    return data


def validate_item(item: dict[str, Any], registry_path: Path) -> None:
    required = [
        "id",
        "sourceFinding",
        "classification",
        "feature",
        "issueCategory",
        "issue",
        "designBook",
        "reproSteps",
        "expected",
        "current",
        "evidence",
    ]
    for key in required:
        if key not in item:
            raise ValidationError(f"{registry_path}: missing required field: {key}")

    for key in ["id", "classification", "feature", "issueCategory", "issue", "designBook"]:
        require_str(item, key, registry_path)
    require_str(item, "sourceFinding", registry_path)
    source_finding_id = item.get("sourceFindingId")
    source_requirement_id = item.get("sourceRequirementId")
    if bool(source_finding_id) == bool(source_requirement_id):
        raise ValidationError(f"{registry_path}: exactly one of sourceFindingId or sourceRequirementId is required")
    if source_finding_id:
        require_str(item, "sourceFindingId", registry_path)
    if source_requirement_id:
        require_str(item, "sourceRequirementId", registry_path)
    require_non_empty_list(item, "reproSteps", registry_path)
    require_non_empty_list(item, "expected", registry_path)
    require_non_empty_list(item, "current", registry_path)
    require_non_empty_list(item, "evidence", registry_path)

    if not str(item["designBook"]).endswith(".xlsx"):
        raise ValidationError(f"{registry_path}: designBook must be an .xlsx name")
    if item["issueCategory"] not in {"実装漏れ", "実装違い"}:
        raise ValidationError(f"{registry_path}: issueCategory must be 実装漏れ or 実装違い")

    if source_finding_id:
        source_finding = validate_source_finding(str(item["sourceFinding"]), str(source_finding_id), registry_path)
        if source_finding.get("confidence") != "CONFIRMED" and source_finding.get("verdict") != "CONFIRMED":
            raise ValidationError(f"{registry_path}: source finding must be CONFIRMED")
        if not isinstance(source_finding.get("comparisonRows"), list) or not source_finding["comparisonRows"]:
            raise ValidationError(f"{registry_path}: source finding must include comparisonRows")
    else:
        validate_source_requirement(str(item["sourceFinding"]), str(source_requirement_id), registry_path)

    labels = collect_evidence_labels(item)
    for label in ["設計", "ec-cube-enterprise", "ベース実装"]:
        if label not in labels:
            raise ValidationError(f"{registry_path}: evidence must include {label}")

    current_source_kinds: set[str] = set()
    for section in item["current"]:
        if not isinstance(section, dict):
            raise ValidationError(f"{registry_path}: current entries must be objects")
        require_str(section, "text", registry_path)
        require_non_empty_list(section, "snippets", registry_path)
        for spec in section["snippets"]:
            validate_snippet_spec(spec, registry_path)
            kind = source_kind(str(spec.get("path", "")), str(spec.get("label", "")))
            if kind in {"ec-cube-enterprise", "ベース実装"}:
                current_source_kinds.add(kind)

    for kind in ["ec-cube-enterprise", "ベース実装"]:
        if kind not in current_source_kinds:
            raise ValidationError(f"{registry_path}: current snippets must include {kind} source code")

    for spec in item["evidence"]:
        validate_snippet_spec(spec, registry_path)

    validate_verification(item, registry_path)


def require_str(obj: dict[str, Any], key: str, registry_path: Path) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{registry_path}: {key} must be a non-empty string")
    return value


def require_non_empty_list(obj: dict[str, Any], key: str, registry_path: Path) -> list[Any]:
    value = obj.get(key)
    if not isinstance(value, list) or not value:
        raise ValidationError(f"{registry_path}: {key} must be a non-empty list")
    return value


def validate_source_finding(source: str, source_finding_id: str, registry_path: Path) -> dict[str, Any]:
    path_part = source.split("#", 1)[0]
    source_path = resolve_path(path_part)
    if not source_path.exists():
        raise ValidationError(f"{registry_path}: sourceFinding path not found: {path_part}")
    data = load_json(source_path)
    findings = data.get("findings")
    if not isinstance(findings, list):
        raise ValidationError(f"{registry_path}: sourceFinding has no findings list: {path_part}")
    for finding in findings:
        if isinstance(finding, dict) and finding.get("id") == source_finding_id:
            return finding
    raise ValidationError(f"{registry_path}: sourceFindingId not found in {path_part}: {source_finding_id}")


def validate_source_requirement(source: str, source_requirement_id: str, registry_path: Path) -> dict[str, Any]:
    path_part = source.split("#", 1)[0]
    source_path = resolve_path(path_part)
    if not source_path.exists():
        raise ValidationError(f"{registry_path}: sourceFinding path not found: {path_part}")
    data = load_json(source_path)
    requirements = (data.get("requirementTraceGate") or {}).get("requirements")
    if not isinstance(requirements, list):
        raise ValidationError(f"{registry_path}: sourceFinding has no requirementTraceGate.requirements list: {path_part}")
    for requirement in requirements:
        if isinstance(requirement, dict) and requirement.get("id") == source_requirement_id:
            return requirement
    raise ValidationError(f"{registry_path}: sourceRequirementId not found in {path_part}: {source_requirement_id}")


def validate_snippet_spec(spec: Any, registry_path: Path) -> None:
    if not isinstance(spec, dict):
        raise ValidationError(f"{registry_path}: snippet specs must be objects")
    for key in ["label", "path", "start", "end"]:
        if key not in spec:
            raise ValidationError(f"{registry_path}: snippet missing {key}")
    if not isinstance(spec["label"], str) or not spec["label"].strip():
        raise ValidationError(f"{registry_path}: snippet label must be a non-empty string")
    if not isinstance(spec["path"], str) or not spec["path"].strip():
        raise ValidationError(f"{registry_path}: snippet path must be a non-empty string")
    if not isinstance(spec["start"], int) or not isinstance(spec["end"], int):
        raise ValidationError(f"{registry_path}: snippet start/end must be integers")
    if spec["start"] < 1 or spec["end"] < spec["start"]:
        raise ValidationError(f"{registry_path}: invalid snippet range for {spec['path']}")
    if not isinstance(spec.get("contains"), list) or not spec["contains"]:
        raise ValidationError(f"{registry_path}: snippet {spec['path']}:{spec['start']}-{spec['end']} must include contains assertions")
    extract_snippet(spec, registry_path)


def collect_evidence_labels(item: dict[str, Any]) -> set[str]:
    labels = set()
    for spec in item["evidence"]:
        kind = evidence_kind(str(spec.get("path", "")))
        if kind:
            labels.add(kind)
    return labels


def evidence_kind(path: str) -> str | None:
    if path.startswith("hareruya-design-docs/excel_to_html/output/"):
        return "設計"
    if path.startswith("ec-cube-enterprise/"):
        return "ec-cube-enterprise"
    if path.startswith(
        (
            "pf-api/",
            "pf-eccube3/",
            "pf-article/",
            "ec-cube/",
            "deck-api/",
            "deck-builder/",
        )
    ):
        return "ベース実装"
    return None


def source_kind(path: str, label: str) -> str | None:
    kind = evidence_kind(path)
    if kind == "設計":
        return None
    return kind


def validate_verification(item: dict[str, Any], registry_path: Path) -> None:
    verification = item.get("verification")
    if not isinstance(verification, dict):
        raise ValidationError(f"{registry_path}: verification object is required")
    commands = verification.get("commands")
    if not isinstance(commands, list) or not commands:
        raise ValidationError(f"{registry_path}: verification.commands must be a non-empty list")
    command_texts = []
    for command in commands:
        if not isinstance(command, str) or not command.strip():
            raise ValidationError(f"{registry_path}: verification.commands entries must be non-empty strings")
        command_texts.append(command)

    joined = "\n".join(command_texts)
    if "rg " not in joined:
        raise ValidationError(f"{registry_path}: verification.commands must include rg source searches")
    for required_term in ["ec-cube-enterprise", "excel_to_html/output"]:
        if required_term not in joined:
            raise ValidationError(f"{registry_path}: verification.commands must include search/check for {required_term}")
    if not any(
        repo in joined
        for repo in ["pf-api", "pf-eccube3", "pf-article", "ec-cube", "deck-api", "deck-builder"]
    ):
        raise ValidationError(f"{registry_path}: verification.commands must include search/check for a base repository")


def render_item(item: dict[str, Any]) -> str:
    lines: list[str] = [
        f"/* 記入例: {REFERENCE_EXAMPLE} */",
        "",
        "# 基本情報【必須】",
        f"分類：{item['classification']}",
        f"機能：{item['feature']}",
        f"課題カテゴリ：{item['issueCategory']}",
        f"課題：{item['issue']}",
        f"設計書：{item['designBook']}",
        "",
        "# 再現手順【必須】",
    ]
    lines.extend(f"{index}. {step}" for index, step in enumerate(item["reproSteps"], 1))
    lines.extend(["", "# 期待される挙動【必須】"])
    lines.extend(f"- {entry}" for entry in item["expected"])
    lines.extend(["", "# 現在の挙動【必須】"])

    for section in item["current"]:
        lines.append(f"- {section['text']}")
        for spec in section["snippets"]:
            snippet = extract_snippet(spec, Path(item["id"]))
            append_snippet(lines, snippet)

    lines.extend(["", "# 根拠"])
    grouped = group_evidence(item["evidence"])
    for label in ["設計", "ec-cube-enterprise", "ベース実装"]:
        if label not in grouped:
            continue
        lines.append(f"- {label}：")
        for spec in grouped[label]:
            snippet = extract_snippet(spec, Path(item["id"]))
            lines.append(f"  - {spec.get('note', spec['label'])}: `{snippet.ref}`")
            if spec.get("includeCode", False):
                append_snippet(lines, snippet, indent="")

    verification = item.get("verification")
    if isinstance(verification, dict):
        commands = verification.get("commands")
        notes = verification.get("notes")
        if commands or notes:
            lines.append("")
            lines.append("# 確認メモ")
            if isinstance(commands, list):
                for command in commands:
                    lines.append(f"- 確認コマンド: `{command}`")
            if isinstance(notes, list):
                for note in notes:
                    lines.append(f"- {note}")

    return "\n".join(lines).rstrip() + "\n"


def group_evidence(specs: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for spec in specs:
        raw_label = str(spec["label"])
        label = "ベース実装" if raw_label.startswith("ベース実装") else raw_label
        grouped.setdefault(label, []).append(spec)
    return grouped


def append_snippet(lines: list[str], snippet: Snippet, indent: str = "") -> None:
    lines.append("")
    lines.append(f"{indent}{snippet.label}: `{snippet.ref}`")
    lines.append(f"{indent}```{snippet.language}")
    for line in snippet.code.splitlines():
        lines.append(f"{indent}{line}")
    lines.append(f"{indent}```")


def extract_snippet(spec: dict[str, Any], registry_path: Path) -> Snippet:
    file_path = resolve_path(str(spec["path"]))
    if not file_path.exists():
        raise ValidationError(f"{registry_path}: snippet file not found: {spec['path']}")
    lines = file_path.read_text(encoding="utf-8").splitlines()
    start = int(spec["start"])
    end = int(spec["end"])
    if end > len(lines):
        raise ValidationError(f"{registry_path}: snippet range exceeds file length: {spec['path']}:{start}-{end}")
    code = "\n".join(lines[start - 1 : end])
    for needle in spec.get("contains", []):
        if needle not in code:
            raise ValidationError(f"{registry_path}: snippet {spec['path']}:{start}-{end} does not contain {needle!r}")
    language = str(spec.get("language") or language_for(file_path))
    return Snippet(str(spec["label"]), str(spec["path"]), start, end, language, code)


def resolve_path(path: str) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return WORKSPACE_ROOT / candidate


def language_for(path: Path) -> str:
    return {
        ".html": "html",
        ".js": "javascript",
        ".json": "json",
        ".php": "php",
        ".twig": "twig",
        ".ts": "typescript",
        ".yaml": "yaml",
        ".yml": "yaml",
    }.get(path.suffix, "")


def write_index(output_dir: Path, items: list[dict[str, Any]]) -> None:
    lines = ["# Backlog Markdown Export", ""]
    for item in items:
        filename = f"{slugify(item['id'])}.md"
        lines.append(f"- [{item['id']}]({filename}) {item['classification']} / {item['feature']} / {item['issue']}")
    (output_dir / "_index.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    return slug.strip("-") or "item"


if __name__ == "__main__":
    raise SystemExit(main())
