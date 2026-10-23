#!/usr/bin/env python3
"""EC-CUBE Enterprise package standard versus current customization FP delta.

Both revisions are read from source with the same extraction rules so that the
comparison is not affected by framework-version differences in their runtimes.
"""
from __future__ import annotations

import argparse
import re
from collections import Counter, defaultdict
from pathlib import Path

from build_fp import WEIGHTS, classify


ROUTE_START = re.compile(
    r"(?:#\[(?:\\Symfony\\Component\\Routing\\Attribute\\)?Route\s*\(|"
    r"@Route\s*\(|^\s*Route\s*\()",
    re.M,
)
METHOD = re.compile(r"\bpublic\s+function\s+(\w+)\s*\(")
NAMESPACE = re.compile(r"^namespace\s+([^;]+);", re.M)
CLASS = re.compile(r"\bclass\s+(\w+)")
TABLE_PATTERNS = (
    re.compile(r"#\[ORM\\Table\(name:\s*['\"]([^'\"]+)['\"]"),
    re.compile(r"@ORM\\Table\(name\s*=\s*['\"]([^'\"]+)['\"]"),
)


def route_blocks(text: str):
    """Yield balanced Route declarations and the immediately following method."""
    for start in ROUTE_START.finditer(text):
        open_pos = text.find("(", start.start(), start.end() + 1)
        depth = 0
        quote = ""
        escaped = False
        end = open_pos
        for pos in range(open_pos, len(text)):
            char = text[pos]
            if quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = ""
                continue
            if char in "'\"":
                quote = char
            elif char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    end = pos + 1
                    break
        method = METHOD.search(text, end)
        if method:
            yield text[start.start():end], method.group(1)


def quoted_values(text: str) -> list[str]:
    return [a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", text)]


def parse_route(block: str, fallback: str) -> dict:
    name_match = re.search(r"\bname\s*[:=]\s*['\"]([^'\"]+)['\"]", block)
    path_match = re.search(r"\bpath\s*[:=]\s*['\"]([^'\"]*)['\"]", block)
    if not path_match:
        path_match = re.search(r"(?:#\[Route|@Route)\s*\(\s*['\"]([^'\"]*)['\"]", block)
    methods_match = re.search(r"\bmethods\s*[:=]\s*[\[{]([^\]}]*)[\]}]", block, re.S)
    methods = quoted_values(methods_match.group(1)) if methods_match else ["ANY"]
    return {
        "route": name_match.group(1) if name_match else fallback,
        "path": path_match.group(1) if path_match else "",
        "methods": methods or ["ANY"],
    }


def load_transactions(root: Path) -> list[dict]:
    controller_root = root / "src" / "Eccube" / "Controller"
    routes = []
    for php in sorted(controller_root.rglob("*.php")):
        text = php.read_text(encoding="utf-8", errors="ignore")
        if not ROUTE_START.search(text):
            continue
        ns = NAMESPACE.search(text)
        cls = CLASS.search(text)
        if not ns or not cls:
            continue
        controller = f"{ns.group(1)}\\{cls.group(1)}"
        for index, (block, method) in enumerate(route_blocks(text), 1):
            route = parse_route(block, f"{cls.group(1)}_{method}_{index}")
            route["action"] = f"{controller}::{method}"
            routes.append(route)

    by_action: dict[str, list[dict]] = defaultdict(list)
    for route in routes:
        by_action[route["action"]].append(route)
    rows = []
    for action, action_routes in sorted(by_action.items()):
        names = ",".join(r["route"] for r in action_routes)
        paths = ",".join(sorted({r["path"] for r in action_routes}))
        methods = sorted({m for r in action_routes for m in r["methods"]})
        representative = min(action_routes, key=lambda r: len(r["route"]))
        kind, reason = classify(representative["route"], representative["path"], methods)
        rows.append({
            "action": action,
            "routes": names,
            "paths": paths,
            "methods": ",".join(methods),
            "kind": kind,
            "reason": reason,
        })
    return rows


def load_tables(root: Path) -> set[str]:
    found: set[str] = set()
    for entity_root in (
        root / "src" / "Eccube" / "Entity",
        root / "app" / "Plugin",
        root / "plugin_repos" / "SlnPayment42",
    ):
        if not entity_root.exists():
            continue
        for php in entity_root.rglob("*.php"):
            if "/Tests/" in str(php) or "/vendor/" in str(php):
                continue
            text = php.read_text(encoding="utf-8", errors="ignore")
            if "MappedSuperclass" in text:
                continue
            for pattern in TABLE_PATTERNS:
                found.update(pattern.findall(text))
    return found


def counts(root: Path, eif: int) -> tuple[Counter, list[dict], set[str]]:
    tx = load_transactions(root)
    tables = load_tables(root)
    result = Counter(row["kind"] for row in tx)
    result["ILF"] = len(tables)
    result["EIF"] = eif
    return result, tx, tables


def fp(count: Counter, grade: str = "平均") -> int:
    return sum(count[k] * WEIGHTS[grade][k] for k in ("EI", "EO", "EQ", "ILF", "EIF"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--standard-root", type=Path, required=True)
    parser.add_argument("--current-root", type=Path, required=True)
    parser.add_argument("--current-eif", type=int, default=6)
    parser.add_argument("--standard-eif", type=int, default=0)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    standard, standard_tx, standard_tables = counts(args.standard_root, args.standard_eif)
    current, current_tx, current_tables = counts(args.current_root, args.current_eif)
    standard_actions = {r["action"] for r in standard_tx}
    current_actions = {r["action"] for r in current_tx}

    headers = ["revision", "EI", "EO", "EQ", "ILF", "EIF", "transactions", "FP"]
    data = [
        ["package_standard", *(standard[k] for k in ("EI", "EO", "EQ", "ILF", "EIF")),
         len(standard_tx), fp(standard)],
        ["current", *(current[k] for k in ("EI", "EO", "EQ", "ILF", "EIF")),
         len(current_tx), fp(current)],
        ["net_delta", *(current[k] - standard[k] for k in ("EI", "EO", "EQ", "ILF", "EIF")),
         len(current_tx) - len(standard_tx), fp(current) - fp(standard)],
    ]
    print("\t".join(headers))
    for row in data:
        print("\t".join(map(str, row)))
    print(f"actions_added\t{len(current_actions - standard_actions)}")
    print(f"actions_removed\t{len(standard_actions - current_actions)}")
    print(f"actions_shared\t{len(current_actions & standard_actions)}")
    print(f"tables_added\t{len(current_tables - standard_tables)}")
    print(f"tables_removed\t{len(standard_tables - current_tables)}")
    print(f"tables_shared\t{len(current_tables & standard_tables)}")

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        with args.out.open("w", encoding="utf-8") as f:
            f.write("\t".join(headers) + "\n")
            for row in data:
                f.write("\t".join(map(str, row)) + "\n")


if __name__ == "__main__":
    main()
