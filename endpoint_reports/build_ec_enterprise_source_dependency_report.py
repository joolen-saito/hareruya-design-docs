#!/usr/bin/env python3
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
DOC_ROOT = WORKSPACE / "hareruya-design-docs"
APP_ROOT = WORKSPACE / "ec-cube-enterprise"
OUT_DIR = DOC_ROOT / "endpoint_reports"

FUNCTION_DIRS = [
    DOC_ROOT / "functions" / "ec-cube-enterprise",
    DOC_ROOT / "functions" / "pf-eccube3",
    DOC_ROOT / "functions" / "pf-api",
]
SOURCE_DIRS = [
    APP_ROOT / "src" / "Eccube",
    APP_ROOT / "app",
    APP_ROOT / "html" / "template",
    APP_ROOT / "html" / "assets" / "hareruya",
]

FUNC_ID_RE = re.compile(r"\b([fmabo]\d{2})[-_](\d{2})(?!\d)", re.IGNORECASE)
ROUTE_ATTR_RE = re.compile(r"#\[\s*Route\s*\((.*?)\)\s*\]", re.DOTALL)
ROUTE_NAME_RE = re.compile(r"name\s*:\s*['\"]([^'\"]+)['\"]|name\s*=\s*['\"]([^'\"]+)['\"]")
ROUTE_PATH_RE = re.compile(r"path\s*:\s*['\"]([^'\"]+)['\"]|path\s*=\s*['\"]([^'\"]+)['\"]|^\s*['\"]([^'\"]+)['\"]")
ROUTE_CALL_RE = re.compile(r"(?:redirectToRoute|generateUrl|forwardToRoute)\(\s*['\"]([^'\"]+)['\"]")
TWIG_ROUTE_RE = re.compile(r"\b(?:path|url)\(\s*['\"]([^'\"]+)['\"]")
TEMPLATE_RE = re.compile(r"(?:Template\(template:\s*|render\()\s*['\"]([^'\"]+\.twig)['\"]")
USE_RE = re.compile(r"^use\s+(Eccube\\[^;]+);", re.MULTILINE)
NAMESPACE_RE = re.compile(r"^namespace\s+([^;]+);", re.MULTILINE)
CLASS_RE = re.compile(r"\bclass\s+([A-Za-z0-9_]+)")
TABLE_RE = re.compile(r"#\[ORM\\Table\(name:\s*['\"]([^'\"]+)['\"]\)\]")
ENTITY_TABLE_TOKEN_RE = re.compile(r"\b(?:dtb|mtb|plg|trn|mt|d|t)_[a-zA-Z0-9_]+\b")
COMMAND_RE = re.compile(r"(?:AsCommand\(name:\s*|setName\()\s*['\"]([^'\"]+)['\"]")
ROUTEISH_PREFIXES = (
    "admin_",
    "api_",
    "block_",
    "front_",
    "shopping",
    "mypage",
    "entry",
    "cart",
    "product",
    "smaregi_",
)

SOURCE_EXTENSIONS = {".php", ".twig", ".yaml", ".yml", ".js", ".ts"}


def rel(path: Path) -> str:
    return path.relative_to(WORKSPACE).as_posix()


def normalize_func_id(value: str) -> str:
    match = FUNC_ID_RE.search(value)
    if not match:
        return ""
    return f"{match.group(1).lower()}-{match.group(2)}"


def title_from_text(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def domain_from_slug(stem: str, func_id: str) -> tuple[str, str]:
    parts = stem.split("_")
    if len(parts) >= 3:
        return parts[1], parts[2]
    prefix = func_id[:1]
    return {
        "m": ("admin", "unknown"),
        "f": ("front", "unknown"),
        "a": ("api", "unknown"),
        "b": ("batch", "unknown"),
        "o": ("other", "unknown"),
    }.get(prefix, ("unknown", "unknown"))


def load_docs() -> dict[str, dict]:
    docs: dict[str, dict] = {}
    for directory in FUNCTION_DIRS:
        if not directory.exists():
            continue
        source_label = directory.name
        for path in sorted(directory.glob("*.md")):
            fid = normalize_func_id(path.name)
            if not fid:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            layer, domain = domain_from_slug(path.stem, fid)
            existing = docs.get(fid)
            if existing and existing["source_label"] == "ec-cube-enterprise":
                continue
            if existing and source_label != "ec-cube-enterprise":
                continue
            docs[fid] = {
                "id": fid,
                "title": title_from_text(text, path.stem),
                "path": rel(path),
                "source_label": source_label,
                "layer": layer,
                "domain": domain,
                "route_names": {
                    token
                    for token in re.findall(r"\b[a-z][a-z0-9_]*_[a-z0-9_]+\b", text)
                    if token.startswith(ROUTEISH_PREFIXES)
                },
                "tables": set(ENTITY_TABLE_TOKEN_RE.findall(text)),
                "refs": {normalize_func_id(m.group(0)) for m in FUNC_ID_RE.finditer(text)} - {fid},
                "text": text,
            }
    return docs


def filter_table_tokens(tokens: set[str]) -> set[str]:
    return {
        token
        for token in tokens
        if not token.endswith("_idx")
        and "_idx_" not in token
        and not token.startswith(("dtb_order_email_idx", "dtb_product_class_price02_idx"))
    }


def extract_route_attributes(text: str) -> tuple[set[str], set[str]]:
    names: set[str] = set()
    paths: set[str] = set()
    for block in ROUTE_ATTR_RE.findall(text):
        for a, b in ROUTE_NAME_RE.findall(block):
            value = a or b
            if value:
                names.add(value)
        for a, b, c in ROUTE_PATH_RE.findall(block):
            value = a or b or c
            if value and value.startswith("/"):
                paths.add(value)
    return names, paths


def source_files() -> list[Path]:
    files: list[Path] = []
    for directory in SOURCE_DIRS:
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path.suffix in SOURCE_EXTENSIONS:
                if "/vendor/" in path.as_posix() or "/var/" in path.as_posix():
                    continue
                files.append(path)
    return sorted(files)


def build_entity_table_map(files: list[Path]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for path in files:
        if path.suffix != ".php" or "/Entity/" not in path.as_posix():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        table_match = TABLE_RE.search(text)
        ns_match = NAMESPACE_RE.search(text)
        class_match = CLASS_RE.search(text)
        if not (table_match and ns_match and class_match):
            continue
        fqcn = f"{ns_match.group(1)}\\{class_match.group(1)}"
        mapping[fqcn] = table_match.group(1)
        mapping[class_match.group(1)] = table_match.group(1)
    return mapping


def classify_import(fqcn: str) -> str:
    if "\\Entity\\" in fqcn:
        return "entity"
    if "\\Repository\\" in fqcn:
        return "repository"
    if "\\Service\\" in fqcn:
        return "service"
    if "\\Form\\" in fqcn:
        return "form"
    if "\\Controller\\" in fqcn:
        return "controller"
    if "\\Event\\" in fqcn:
        return "event"
    return "other"


def scan_source(files: list[Path], entity_tables: dict[str, str]) -> dict[str, dict]:
    source_index: dict[str, dict] = {}
    route_to_files: dict[str, set[str]] = defaultdict(set)
    route_call_to_files: dict[str, set[str]] = defaultdict(set)
    twig_route_to_files: dict[str, set[str]] = defaultdict(set)

    for path in files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        route_names, route_paths = extract_route_attributes(text)
        route_calls = set(ROUTE_CALL_RE.findall(text))
        twig_calls = set(TWIG_ROUTE_RE.findall(text)) if path.suffix == ".twig" else set()
        templates = set(TEMPLATE_RE.findall(text))
        imports = set(USE_RE.findall(text))
        commands = set(COMMAND_RE.findall(text))
        tables = filter_table_tokens(set(ENTITY_TABLE_TOKEN_RE.findall(text)))
        for imported in imports:
            table = entity_tables.get(imported) or entity_tables.get(imported.rsplit("\\", 1)[-1])
            if table:
                tables.add(table)
        imported_by_kind = defaultdict(set)
        for imported in imports:
            imported_by_kind[classify_import(imported)].add(imported)

        item = {
            "path": rel(path),
            "route_names": route_names,
            "route_paths": route_paths,
            "route_calls": route_calls,
            "twig_route_calls": twig_calls,
            "templates": templates,
            "commands": commands,
            "imports": imports,
            "imports_by_kind": imported_by_kind,
            "tables": tables,
            "text": text,
        }
        source_index[item["path"]] = item
        for route in route_names:
            route_to_files[route].add(item["path"])
        for route in route_calls:
            route_call_to_files[route].add(item["path"])
        for route in twig_calls:
            twig_route_to_files[route].add(item["path"])

    for item in source_index.values():
        item["called_by_php_files"] = set()
        item["called_by_twig_files"] = set()
        for route in item["route_names"]:
            item["called_by_php_files"].update(route_call_to_files.get(route, set()))
            item["called_by_twig_files"].update(twig_route_to_files.get(route, set()))
    return source_index


def candidate_tokens(doc: dict) -> set[str]:
    tokens = {doc["layer"], doc["domain"], doc["id"].replace("-", "_")}
    for part in re.split(r"[_\-\s]+", Path(doc["path"]).stem):
        if len(part) >= 4 and not FUNC_ID_RE.match(part):
            tokens.add(part.lower())
    tokens.update(route for route in doc["route_names"] if route.startswith(("admin_", "api_", "front_", "shopping", "mypage")))
    return {token for token in tokens if token and token != "unknown"}


def link_docs_to_source(docs: dict[str, dict], source: dict[str, dict]) -> dict[str, dict]:
    linked: dict[str, dict] = {}
    for fid, doc in docs.items():
        tokens = candidate_tokens(doc)
        scored = []
        for path, item in source.items():
            score = 0
            reasons = []
            route_overlap = doc["route_names"] & item["route_names"]
            route_call_overlap = doc["route_names"] & (item["route_calls"] | item["twig_route_calls"])
            table_overlap = doc["tables"] & item["tables"]
            if route_overlap:
                score += 10 + len(route_overlap)
                reasons.append("defines_doc_route")
            if route_call_overlap:
                score += 5 + len(route_call_overlap)
                reasons.append("calls_doc_route")
            if table_overlap:
                score += min(len(table_overlap), 5)
                reasons.append("shares_doc_table")
            lower_path = path.lower()
            token_hits = {token for token in tokens if token in lower_path}
            if token_hits:
                score += min(len(token_hits), 5)
                reasons.append("path_token")
            if score >= 5:
                scored.append((score, path, reasons, route_overlap, route_call_overlap, table_overlap))
        scored.sort(key=lambda row: (-row[0], row[1]))
        primary = [row for row in scored if "defines_doc_route" in row[2]][:8]
        if not primary:
            primary = scored[:8]
        files = {row[1] for row in primary}
        routes = set()
        route_calls = set()
        tables = set(doc["tables"])
        imports_by_kind = defaultdict(set)
        commands = set()
        callers = set()
        for _, path, _, _, _, _ in primary:
            item = source[path]
            routes.update(item["route_names"])
            route_calls.update(item["route_calls"] | item["twig_route_calls"])
            tables.update(item["tables"])
            commands.update(item["commands"])
            callers.update(item["called_by_php_files"] | item["called_by_twig_files"])
            for kind, values in item["imports_by_kind"].items():
                imports_by_kind[kind].update(values)
        linked[fid] = {
            **doc,
            "source_files": files,
            "source_routes": routes,
            "source_route_calls": route_calls,
            "source_tables": tables,
            "source_commands": commands,
            "source_callers": callers - files,
            "imports_by_kind": imports_by_kind,
            "match_score": sum(row[0] for row in primary),
            "match_count": len(primary),
        }
    return linked


def build_edges(items: dict[str, dict]) -> list[dict]:
    edges = []
    ids = sorted(items)
    for src_id in ids:
        src = items[src_id]
        for dst_id in ids:
            if src_id == dst_id:
                continue
            dst = items[dst_id]
            score = 0
            reasons = []
            shared_tables = src["source_tables"] & dst["source_tables"]
            shared_services = src["imports_by_kind"]["service"] & dst["imports_by_kind"]["service"]
            shared_repos = src["imports_by_kind"]["repository"] & dst["imports_by_kind"]["repository"]
            route_link = src["source_route_calls"] & dst["source_routes"]
            reverse_route_link = dst["source_route_calls"] & src["source_routes"]
            doc_ref = dst_id in src["refs"]
            if route_link:
                score += 8 + len(route_link)
                reasons.append("source_route_call")
            if reverse_route_link:
                score += 5 + len(reverse_route_link)
                reasons.append("source_reverse_route_call")
            if doc_ref:
                score += 4
                reasons.append("doc_direct_ref")
            if shared_tables:
                score += 3 + min(len(shared_tables), 4)
                reasons.append("source_shared_table")
            if shared_repos:
                score += 2 + min(len(shared_repos), 3)
                reasons.append("source_shared_repository")
            if shared_services:
                score += 2 + min(len(shared_services), 3)
                reasons.append("source_shared_service")
            if src["domain"] == dst["domain"] and src["layer"] != dst["layer"]:
                score += 2
                reasons.append("same_domain_cross_layer")
            if score >= 6:
                edges.append(
                    {
                        "source_id": src_id,
                        "source_title": src["title"],
                        "target_id": dst_id,
                        "target_title": dst["title"],
                        "score": score,
                        "reasons": ",".join(reasons),
                        "route_links": ",".join(sorted(route_link)),
                        "shared_tables": ",".join(sorted(shared_tables)),
                        "shared_repositories": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in shared_repos)),
                        "shared_services": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in shared_services)),
                    }
                )
    edges.sort(key=lambda row: (row["source_id"], -row["score"], row["target_id"]))
    counts = Counter()
    limited = []
    for edge in edges:
        if counts[edge["source_id"]] >= 15:
            continue
        counts[edge["source_id"]] += 1
        limited.append(edge)
    return limited


def write_tsv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def make_report(items: dict[str, dict], edges: list[dict], source: dict[str, dict]) -> str:
    linked = [item for item in items.values() if item["source_files"]]
    route_link_edges = [edge for edge in edges if "source_route_call" in edge["reasons"]]
    shared_table_edges = [edge for edge in edges if "source_shared_table" in edge["reasons"]]
    table_counter = Counter()
    service_counter = Counter()
    repo_counter = Counter()
    route_counter = Counter()
    for item in items.values():
        table_counter.update(item["source_tables"])
        service_counter.update(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["service"])
        repo_counter.update(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["repository"])
        route_counter.update(item["source_routes"])

    lines = [
        "# ec-cube-enterprise ソース起点の機能間依存関係",
        "",
        "## 目的",
        "",
        "不具合修正後の影響範囲特定とリグレッションテスト選定に使うため、設計書の機能IDを ec-cube-enterprise 実装へ突合し、ルート・DBテーブル・Repository・Service・Twig遷移の依存候補を整理した。",
        "",
        "## 抽出対象",
        "",
        f"- 設計書機能ID: {len(items)} 件（ec-cube-enterprise設計書を優先し、不足分はpf-eccube3/pf-api設計書で補完）。",
        f"- ソースファイル: {len(source)} 件（`ec-cube-enterprise/src/Eccube`, `app`, `html/template`, `html/assets/hareruya`）。",
        f"- ソースに突合できた機能: {len(linked)} 件。",
        f"- 依存候補エッジ: {len(edges)} 件。",
        "",
        "## 判定ルール",
        "",
        "| 依存理由 | 意味 | リグレッション優先度 |",
        "|---|---|---|",
        "| `source_route_call` | PHP/Twigが相手機能のRouteを呼ぶ | 高 |",
        "| `source_shared_table` | 同一Entity/Tableに触る | 高（更新・集計・検索条件変更時） |",
        "| `source_shared_repository` | 同一Repositoryに依存 | 中から高 |",
        "| `source_shared_service` | 同一Serviceに依存 | 中から高 |",
        "| `same_domain_cross_layer` | 同一業務ドメインで画面/API/バッチ層が異なる | 中 |",
        "| `doc_direct_ref` | 設計書本文で相手機能IDを参照 | 中 |",
        "",
        "## 使い方",
        "",
        "1. 修正したController/Service/Entity/Twigから `ec_enterprise_source_function_inventory.tsv` の `source_files` / `source_tables` / `services` を検索する。",
        "2. 見つかった機能IDを `ec_enterprise_source_dependency_edges.tsv` の `source_id` で引く。",
        "3. `source_route_call` と `source_shared_table` をまず対象化し、次に同一Repository/Serviceを確認する。",
        "4. 対象機能の結合試験観点表で P1/P2、DB更新、外部連携、再実行、CSV/PDF/API応答を優先して回す。",
        "",
        "## サマリ",
        "",
        f"- Route呼び出し由来の依存: {len(route_link_edges)} 件。",
        f"- 共有テーブル由来の依存: {len(shared_table_edges)} 件。",
        "",
        "## 共有テーブル上位",
        "",
        "| テーブル | 機能数 |",
        "|---|---:|",
    ]
    for table, count in table_counter.most_common(25):
        lines.append(f"| `{table}` | {count} |")

    lines += [
        "",
        "## 共有Service上位",
        "",
        "| Service | 機能数 |",
        "|---|---:|",
    ]
    for service, count in service_counter.most_common(20):
        lines.append(f"| `{service}` | {count} |")

    lines += [
        "",
        "## 共有Repository上位",
        "",
        "| Repository | 機能数 |",
        "|---|---:|",
    ]
    for repo, count in repo_counter.most_common(20):
        lines.append(f"| `{repo}` | {count} |")

    lines += [
        "",
        "## Route定義に突合できた主な機能",
        "",
        "| 機能ID | 機能名 | Route | 主ソース |",
        "|---|---|---|---|",
    ]
    for item in sorted(linked, key=lambda x: x["id"])[:80]:
        routes = ", ".join(f"`{r}`" for r in sorted(item["source_routes"])[:5])
        files = ", ".join(f"`{f}`" for f in sorted(item["source_files"])[:2])
        lines.append(f"| `{item['id']}` | {item['title']} | {routes} | {files} |")

    lines += [
        "",
        "## 成果物",
        "",
        "- `ec_enterprise_source_function_inventory.tsv`: 機能IDごとの突合ソース、Route、Table、Repository、Service。",
        "- `ec_enterprise_source_dependency_edges.tsv`: ソース根拠つき依存候補。",
        "- `ec_enterprise_route_inventory.tsv`: ec-cube-enterprise内のRoute定義一覧。",
        "- `build_ec_enterprise_source_dependency_report.py`: 再生成スクリプト。",
        "",
        "## 注意点",
        "",
        "- 正規表現ベースの静的解析であり、DI設定・動的Route名・動的Service呼び出しは完全には拾わない。",
        "- 共有テーブルは影響候補であり、実際の同一レコード・同一条件はPR差分で確認する。",
        "- 設計書がpf-eccube3由来の機能は、ec-cube-enterpriseソースへの突合結果を優先して扱う。",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    docs = load_docs()
    files = source_files()
    entity_tables = build_entity_table_map(files)
    source = scan_source(files, entity_tables)
    items = link_docs_to_source(docs, source)
    edges = build_edges(items)

    inventory_rows = []
    for fid, item in sorted(items.items()):
        inventory_rows.append(
            {
                "id": fid,
                "title": item["title"],
                "doc_source": item["source_label"],
                "doc_path": item["path"],
                "layer": item["layer"],
                "domain": item["domain"],
                "match_score": item["match_score"],
                "source_files": ",".join(sorted(item["source_files"])),
                "source_routes": ",".join(sorted(item["source_routes"])),
                "source_route_calls": ",".join(sorted(item["source_route_calls"])),
                "source_callers": ",".join(sorted(item["source_callers"])),
                "source_commands": ",".join(sorted(item["source_commands"])),
                "source_tables": ",".join(sorted(item["source_tables"])),
                "repositories": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["repository"])),
                "services": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["service"])),
                "forms": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["form"])),
            }
        )

    route_rows = []
    for item in source.values():
        for route in sorted(item["route_names"]):
            route_rows.append(
                {
                    "route": route,
                    "path": ",".join(sorted(item["route_paths"])),
                    "source_file": item["path"],
                    "tables": ",".join(sorted(item["tables"])),
                    "calls_routes": ",".join(sorted(item["route_calls"] | item["twig_route_calls"])),
                    "services": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["service"])),
                    "repositories": ",".join(sorted(x.rsplit("\\", 1)[-1] for x in item["imports_by_kind"]["repository"])),
                }
            )

    write_tsv(
        OUT_DIR / "ec_enterprise_source_function_inventory.tsv",
        inventory_rows,
        [
            "id",
            "title",
            "doc_source",
            "doc_path",
            "layer",
            "domain",
            "match_score",
            "source_files",
            "source_routes",
            "source_route_calls",
            "source_callers",
            "source_commands",
            "source_tables",
            "repositories",
            "services",
            "forms",
        ],
    )
    write_tsv(
        OUT_DIR / "ec_enterprise_source_dependency_edges.tsv",
        edges,
        [
            "source_id",
            "source_title",
            "target_id",
            "target_title",
            "score",
            "reasons",
            "route_links",
            "shared_tables",
            "shared_repositories",
            "shared_services",
        ],
    )
    write_tsv(
        OUT_DIR / "ec_enterprise_route_inventory.tsv",
        sorted(route_rows, key=lambda row: (row["route"], row["source_file"])),
        ["route", "path", "source_file", "tables", "calls_routes", "services", "repositories"],
    )
    (OUT_DIR / "ec_enterprise_source_dependency_report.md").write_text(
        make_report(items, edges, source), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
