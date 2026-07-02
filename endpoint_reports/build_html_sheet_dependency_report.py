#!/usr/bin/env python3
import csv
import re
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_DIR = ROOT / "excel_to_html" / "output"
IT_DIR = ROOT / "integration_test"
OUT_DIR = ROOT / "endpoint_reports"
SOURCE_EDGE_PATH = OUT_DIR / "ec_enterprise_source_dependency_edges.tsv"

FUNC_ID_RE = re.compile(r"\b([MFABO])(\d{2})[-_](\d{2})(?!\d)", re.IGNORECASE)
TABLE_RE = re.compile(r"\b(?:dtb|mtb|plg|trn|mt|d|t)_[a-zA-Z0-9_]+\b")
ROUTE_RE = re.compile(
    r"\b(?:admin|api|front|block|shopping|mypage|entry|cart|product|smaregi)_[a-zA-Z0-9_]+\b"
)
URL_RE = re.compile(r"/(?:%eccube_admin_route%|\{admin_route\}|api|block|mypage|cart|shopping|products?)[^\s<。）、)）\"']*")
IT_ID_RE = re.compile(r"\bIT-\d{2}\b")
PRIORITY_RE = re.compile(r"\t(P[123])\t")
COMMON_TABLES = {
    "dtb_member",
    "dtb_member_base_info",
    "dtb_base_info",
    "dtb_csv",
    "mtb_csv",
    "mtb_csv_type",
    "mtb_pref",
    "mtb_country",
    "mtb_sex",
    "mtb_job",
    "mtb_authority",
    "mtb_department",
    "mtb_work",
    "mtb_device_type",
    "mtb_tax_type",
    "mtb_tax_display_type",
    "mtb_rounding_type",
    "mtb_option",
}

REASON_LABELS = {
    "source_feature_dependency": "ソース解析上の機能間依存",
    "shared_route": "共通Route",
    "route_related": "Route関連",
    "shared_table": "共通テーブル",
    "same_doc_shared_business_term": "同一設計書内の業務語彙共有",
    "adjacent_sheet": "同一設計書内の隣接シート",
    "same_function_id": "同一機能ID",
}

SOURCE_REASON_LABELS = {
    "source_shared_table": "ソース上の共通テーブル参照",
    "source_shared_repository": "ソース上の共通Repository参照",
    "source_shared_service": "ソース上の共通Service参照",
    "source_route_call": "ソース上のRoute呼び出し",
    "source_reverse_route_call": "ソース上の逆方向Route参照",
    "same_domain_cross_layer": "同一ドメイン内のレイヤー間関連",
    "doc_direct_ref": "設計書上の直接参照",
}

EDGE_HEADER_LABELS = {
    "source_doc": "依存元ドキュメント",
    "source_sheet": "依存元シート",
    "source_functions": "依存元機能ID",
    "target_doc": "依存先ドキュメント",
    "target_sheet": "依存先シート",
    "target_functions": "依存先機能ID",
    "score": "スコア",
    "reasons": "判定理由",
    "source_reason": "依存元理由",
    "shared_routes": "共通ルート",
    "shared_tables": "共通テーブル",
    "shared_keywords": "共通キーワード",
    "route_links": "ルートリンク",
}

SKIP_SHEET_TITLES = {
    "表紙",
    "目次",
}


def normalize_func_id(value: str) -> str:
    match = FUNC_ID_RE.search(value)
    if not match:
        return ""
    return f"{match.group(1).lower()}{match.group(2)}-{match.group(3)}"


def func_sort_key(fid: str) -> tuple[str, int, int]:
    match = re.match(r"([a-z])(\d{2})-(\d{2})", fid)
    if not match:
        return (fid, 0, 0)
    return (match.group(1), int(match.group(2)), int(match.group(3)))


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def translate_csv_tokens(value: str, labels: dict[str, str]) -> str:
    tokens = [token for token in value.split(",") if token]
    return ",".join(labels.get(token, token) for token in tokens)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


class SheetHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.nav_titles: dict[str, str] = {}
        self.sheets: list[dict] = []
        self._current: dict | None = None
        self._capture_nav: str | None = None
        self._capture_h2 = False
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {k: v or "" for k, v in attrs_list}
        if tag in {"script", "style"}:
            self._skip_depth += 1
            return
        if tag == "a" and attrs.get("data-sheet"):
            self._capture_nav = attrs["data-sheet"]
            return
        if tag == "section" and "sheet-panel" in attrs.get("class", ""):
            self._current = {
                "sheet_id": attrs.get("id", ""),
                "title": "",
                "texts": [],
                "sources": set(),
            }
            return
        if self._current is None:
            return
        if tag == "h2" and not self._current["title"]:
            self._capture_h2 = True
        if tag == "section" and attrs.get("data-source"):
            self._current["sources"].add(attrs["data-source"])

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag == "a":
            self._capture_nav = None
        if tag == "h2":
            self._capture_h2 = False
        if tag == "section" and self._current is not None:
            if self._current["sheet_id"]:
                nav_title = self.nav_titles.get(self._current["sheet_id"], "")
                if nav_title and (not self._current["title"] or self._current["title"] == self._current["sheet_id"]):
                    self._current["title"] = nav_title
                self.sheets.append(self._current)
            self._current = None

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        text = clean_text(data)
        if not text:
            return
        if self._capture_nav:
            self.nav_titles[self._capture_nav] = text
            return
        if self._current is not None:
            self._current["texts"].append(text)
            if self._capture_h2 and not self._current["title"]:
                self._current["title"] = text


def load_html_sheets() -> list[dict]:
    rows: list[dict] = []
    for path in sorted(HTML_DIR.glob("*.html")):
        if path.name == "index.html":
            continue
        parser = SheetHtmlParser()
        parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
        doc_code = path.name.split("_", 1)[0]
        doc_title = path.stem
        for order, sheet in enumerate(parser.sheets, start=1):
            text = "\n".join(sheet["texts"])
            title = sheet["title"] or parser.nav_titles.get(sheet["sheet_id"], sheet["sheet_id"])
            funcs = {normalize_func_id(m.group(0)) for m in FUNC_ID_RE.finditer(text)}
            tables = {
                token
                for token in TABLE_RE.findall(text)
                if not token.endswith("_idx") and "_idx_" not in token
            }
            routes = set(ROUTE_RE.findall(text))
            urls = set(URL_RE.findall(text))
            source_paths = set(sheet["sources"])
            if not funcs:
                funcs = {normalize_func_id(src) for src in source_paths if normalize_func_id(src)}
            rows.append(
                {
                    "sheet_key": f"{path.name}#{sheet['sheet_id']}",
                    "html_file": rel(path),
                    "doc_code": doc_code,
                    "doc_title": doc_title,
                    "sheet_id": sheet["sheet_id"],
                    "sheet_order": order,
                    "sheet_title": title,
                    "sheet_type": classify_sheet(title, funcs, text),
                    "function_ids": funcs,
                    "routes": routes,
                    "urls": urls,
                    "tables": tables,
                    "source_paths": source_paths,
                    "keywords": extract_keywords(text, title),
                    "text_len": len(text),
                }
            )
    return rows


def classify_sheet(title: str, funcs: set[str], text: str) -> str:
    if title in SKIP_SHEET_TITLES:
        return "meta"
    if "別添" in title or "資料" in title or "フォーマット" in title:
        return "reference"
    if funcs or "機能No" in text or ROUTE_RE.search(text):
        return "function"
    return "unknown"


def extract_keywords(text: str, title: str) -> set[str]:
    candidates = [
        "受注",
        "出荷",
        "配送",
        "納品書",
        "送り状",
        "メール",
        "ステータス",
        "対応状況",
        "在庫",
        "欠品",
        "棚卸",
        "移動",
        "分割",
        "結合",
        "商品",
        "カード",
        "会員",
        "顧客",
        "ポイント",
        "スマレジ",
        "買取",
        "店頭",
        "ネット買取",
        "CSV",
        "PDF",
        "API",
        "バッチ",
        "検索",
        "登録",
        "編集",
        "削除",
        "承認",
        "一括",
        "インポート",
        "エクスポート",
    ]
    haystack = f"{title}\n{text}"
    return {word for word in candidates if word in haystack}


def load_test_coverage() -> dict[str, dict]:
    coverage: dict[str, dict] = defaultdict(lambda: {"files": set(), "case_count": 0, "it_ids": set(), "priority": Counter()})
    for path in sorted(IT_DIR.glob("*_it_cases.md")):
        fid = normalize_func_id(path.name)
        if not fid:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        cov = coverage[fid]
        cov["files"].add(rel(path))
        cov["case_count"] += len(re.findall(r"\n.+?\tIT-[A-Z0-9-]+", text))
        cov["it_ids"].update(IT_ID_RE.findall(text))
        cov["priority"].update(PRIORITY_RE.findall(text))
    return coverage


def load_source_feature_edges() -> dict[tuple[str, str], dict]:
    edges: dict[tuple[str, str], dict] = {}
    if not SOURCE_EDGE_PATH.exists():
        return edges
    with SOURCE_EDGE_PATH.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            key = (row["source_id"], row["target_id"])
            edges[key] = row
    return edges


def build_sheet_edges(sheets: list[dict], source_feature_edges: dict[tuple[str, str], dict]) -> list[dict]:
    function_to_sheets: dict[str, set[str]] = defaultdict(set)
    by_key = {sheet["sheet_key"]: sheet for sheet in sheets}
    for sheet in sheets:
        if sheet["sheet_type"] != "function":
            continue
        for fid in sheet["function_ids"]:
            function_to_sheets[fid].add(sheet["sheet_key"])

    raw_edges: dict[tuple[str, str], dict] = {}

    def add_edge(src: dict, dst: dict, score: int, reason: str, detail: dict | None = None) -> None:
        if src["sheet_key"] == dst["sheet_key"]:
            return
        if src["sheet_type"] != "function" or dst["sheet_type"] != "function":
            return
        key = (src["sheet_key"], dst["sheet_key"])
        edge = raw_edges.setdefault(
            key,
            {
                "source_sheet_key": src["sheet_key"],
                "source_doc": src["doc_title"],
                "source_sheet": src["sheet_title"],
                "source_functions": set(src["function_ids"]),
                "target_sheet_key": dst["sheet_key"],
                "target_doc": dst["doc_title"],
                "target_sheet": dst["sheet_title"],
                "target_functions": set(dst["function_ids"]),
                "score": 0,
                "reasons": set(),
                "source_reason": "",
                "shared_routes": set(),
                "shared_tables": set(),
                "shared_keywords": set(),
                "route_links": set(),
            },
        )
        edge["score"] += score
        edge["reasons"].add(reason)
        if detail:
            for field in ["shared_routes", "shared_tables", "shared_keywords", "route_links"]:
                edge[field].update(detail.get(field, set()))
            if detail.get("source_reason"):
                edge["source_reason"] = translate_csv_tokens(detail["source_reason"], SOURCE_REASON_LABELS)

    for (src_fid, dst_fid), source_edge in source_feature_edges.items():
        for src_key in function_to_sheets.get(src_fid, set()):
            for dst_key in function_to_sheets.get(dst_fid, set()):
                src_sheet = by_key[src_key]
                dst_sheet = by_key[dst_key]
                shared_tables = set(filter(None, source_edge.get("shared_tables", "").split(",")))
                route_links = set(filter(None, source_edge.get("route_links", "").split(",")))
                business_tables = shared_tables - COMMON_TABLES
                shared_keywords = src_sheet["keywords"] & dst_sheet["keywords"]
                same_doc = src_sheet["doc_code"] == dst_sheet["doc_code"]
                if not route_links and not business_tables and not same_doc:
                    continue
                if not route_links and not business_tables and len(shared_keywords) < 2:
                    continue
                score = 10 + min(int(source_edge.get("score") or 0), 20)
                if not route_links and not same_doc:
                    score -= 8
                add_edge(
                    src_sheet,
                    dst_sheet,
                    max(score, 6),
                    "source_feature_dependency",
                    {
                        "shared_tables": shared_tables,
                        "shared_keywords": shared_keywords,
                        "route_links": route_links,
                        "source_reason": source_edge.get("reasons", ""),
                    },
                )

    for src in sheets:
        if src["sheet_type"] != "function":
            continue
        for dst in sheets:
            if dst["sheet_type"] != "function" or src["sheet_key"] == dst["sheet_key"]:
                continue
            direct_func_refs = src["function_ids"] & dst["function_ids"]
            # If one sheet embeds multiple function designs, same function IDs are a duplication signal,
            # not a dependency. Keep it low so source-derived links dominate.
            if direct_func_refs:
                add_edge(src, dst, 3, "same_function_id")
            shared_routes = src["routes"] & dst["routes"]
            route_links = src["routes"] & dst["routes"]
            shared_tables = (src["tables"] & dst["tables"]) - COMMON_TABLES
            shared_keywords = src["keywords"] & dst["keywords"]
            if shared_routes:
                add_edge(src, dst, 8 + min(len(shared_routes), 5), "shared_route", {"shared_routes": shared_routes})
            if shared_tables:
                add_edge(src, dst, 5 + min(len(shared_tables), 6), "shared_table", {"shared_tables": shared_tables})
            if src["doc_code"] == dst["doc_code"] and abs(src["sheet_order"] - dst["sheet_order"]) == 1:
                add_edge(src, dst, 2, "adjacent_sheet")
            if src["doc_code"] == dst["doc_code"] and shared_keywords and (shared_tables or shared_routes):
                add_edge(src, dst, 2, "same_doc_shared_business_term", {"shared_keywords": shared_keywords})
            if route_links:
                add_edge(src, dst, 3, "route_related", {"route_links": route_links})

    edges = list(raw_edges.values())
    for edge in edges:
        for field in [
            "source_functions",
            "target_functions",
            "reasons",
            "shared_routes",
            "shared_tables",
            "shared_keywords",
            "route_links",
        ]:
            joined = ",".join(sorted(edge[field], key=str))
            if field == "reasons":
                joined = translate_csv_tokens(joined, REASON_LABELS)
            edge[field] = joined
    edges.sort(key=lambda row: (row["source_sheet_key"], -row["score"], row["target_sheet_key"]))

    limited: list[dict] = []
    count_by_source: Counter[str] = Counter()
    for edge in edges:
        if count_by_source[edge["source_sheet_key"]] >= 20:
            continue
        count_by_source[edge["source_sheet_key"]] += 1
        limited.append(edge)
    return limited


def build_inventory(sheets: list[dict], coverage: dict[str, dict]) -> list[dict]:
    rows: list[dict] = []
    for sheet in sheets:
        cov_files: set[str] = set()
        it_ids: set[str] = set()
        priority = Counter()
        case_count = 0
        for fid in sheet["function_ids"]:
            cov = coverage.get(fid)
            if not cov:
                continue
            cov_files.update(cov["files"])
            it_ids.update(cov["it_ids"])
            priority.update(cov["priority"])
            case_count += cov["case_count"]
        rows.append(
            {
                "sheet_key": sheet["sheet_key"],
                "html_file": sheet["html_file"],
                "doc_code": sheet["doc_code"],
                "doc_title": sheet["doc_title"],
                "sheet_id": sheet["sheet_id"],
                "sheet_order": sheet["sheet_order"],
                "sheet_title": sheet["sheet_title"],
                "sheet_type": sheet["sheet_type"],
                "function_ids": ",".join(sorted(sheet["function_ids"], key=func_sort_key)),
                "routes": ",".join(sorted(sheet["routes"])),
                "urls": ",".join(sorted(sheet["urls"])),
                "tables": ",".join(sorted(sheet["tables"])),
                "keywords": ",".join(sorted(sheet["keywords"])),
                "source_paths": ",".join(sorted(sheet["source_paths"])),
                "test_files": ",".join(sorted(cov_files)),
                "test_case_count": case_count,
                "it_ids": ",".join(sorted(it_ids)),
                "p1": priority["P1"],
                "p2": priority["P2"],
                "p3": priority["P3"],
                "text_len": sheet["text_len"],
            }
        )
    return rows


def build_regression_matrix(sheets: list[dict], edges: list[dict]) -> list[dict]:
    by_key = {sheet["sheet_key"]: sheet for sheet in sheets}
    grouped: dict[str, list[dict]] = defaultdict(list)
    for edge in edges:
        grouped[edge["source_sheet_key"]].append(edge)
    rows: list[dict] = []
    for src_key, src_edges in sorted(grouped.items()):
        src = by_key[src_key]
        high = [e for e in src_edges if e["score"] >= 25]
        medium = [e for e in src_edges if 15 <= e["score"] < 25]
        low = [e for e in src_edges if e["score"] < 15]
        rows.append(
            {
                "changed_sheet_key": src_key,
                "changed_sheet": src["sheet_title"],
                "changed_functions": ",".join(sorted(src["function_ids"], key=func_sort_key)),
                "must_regress": "\n".join(f"{e['target_sheet_key']} {e['target_sheet']}" for e in high[:12]),
                "should_regress": "\n".join(f"{e['target_sheet_key']} {e['target_sheet']}" for e in medium[:12]),
                "consider_if_related": "\n".join(f"{e['target_sheet_key']} {e['target_sheet']}" for e in low[:12]),
                "main_reasons": "\n".join(f"{e['target_sheet']} => {e['reasons']}" for e in src_edges[:10]),
            }
        )
    return rows


def write_tsv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_tsv_with_headers(path: Path, rows: list[dict], fields: list[str], headers: dict[str, str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerow([headers.get(field, field) for field in fields])
        for row in rows:
            writer.writerow([row.get(field, "") for field in fields])


def make_report(sheets: list[dict], edges: list[dict], matrix: list[dict]) -> str:
    function_sheets = [s for s in sheets if s["sheet_type"] == "function"]
    doc_counter = Counter(s["doc_title"] for s in function_sheets)
    reason_counter = Counter()
    for edge in edges:
        reason_counter.update(edge["reasons"].split(","))
    lines = [
        "# HTML設計書シート単位の機能間依存関係",
        "",
        "## 目的",
        "",
        "HTML設計書のシートを起点に、「このシート相当の機能を修正したら、どのシート相当のテストまで回帰するか」を判断するための初版整理である。",
        "",
        "## 抽出対象",
        "",
        f"- HTML設計書: `{HTML_DIR.relative_to(ROOT).as_posix()}/*.html` から {len(sheets)} シート。",
        f"- 機能シート: {len(function_sheets)} シート。",
        f"- シート間依存候補: {len(edges)} 件（各シート上位20件）。",
        f"- 回帰マトリクス行: {len(matrix)} 件。",
        "",
        "## 依存理由と回帰優先度",
        "",
        "| 依存理由 | 意味 | 扱い |",
        "|---|---|---|",
        "| `source_feature_dependency` | ec-cube-enterpriseソース追跡で機能ID間依存がある | 原則回帰対象 |",
        "| `shared_route` / `route_related` | 同じRoute名・遷移先を扱う | 原則回帰対象 |",
        "| `shared_table` | 同じDBテーブルを扱う | 更新・検索・集計変更時は回帰対象 |",
        "| `same_doc_shared_business_term` | 同一HTML設計書内で業務語彙とDB/Routeが近い | 仕様変更時に確認 |",
        "| `adjacent_sheet` | 同一設計書内の前後シート | 画面導線変更時に確認 |",
        "| `same_function_id` | 同じ機能IDが複数シートに出る | 重複・補足シートとして確認 |",
        "",
        "## 使い方",
        "",
        "1. 修正した画面・処理に対応するHTML設計書シートを `html_sheet_inventory.tsv` で探す。",
        "2. `html_sheet_regression_matrix.tsv` の `changed_sheet_key` を引く。",
        "3. `must_regress` は基本的に回す。`should_regress` はDB/Route/Serviceに触れた場合に回す。",
        "4. `html_sheet_dependency_edges.tsv` で理由、共有Route、共有テーブルを確認して、実施範囲を絞る。",
        "",
        "## サマリ",
        "",
        "| 依存理由 | 件数 |",
        "|---|---:|",
    ]
    for reason, count in reason_counter.most_common():
        lines.append(f"| `{reason}` | {count} |")
    lines += [
        "",
        "## シート数が多いHTML設計書",
        "",
        "| HTML設計書 | 機能シート数 |",
        "|---|---:|",
    ]
    for doc, count in doc_counter.most_common(20):
        lines.append(f"| `{doc}` | {count} |")
    lines += [
        "",
        "## 成果物",
        "",
        "- `html_sheet_inventory.tsv`: HTML設計書シートごとの機能ID、Route、DBテーブル、テスト観点表。",
        "- `html_sheet_dependency_edges.tsv`: シート間依存候補と根拠。",
        "- `html_sheet_regression_matrix.tsv`: 修正シートから見た must/should/consider 回帰対象。",
        "- `build_html_sheet_dependency_report.py`: 再生成スクリプト。",
        "",
        "## 注意点",
        "",
        "- HTML本文の静的抽出であり、実行時分岐や権限差は完全には表現しない。",
        "- `shared_table` は候補であり、同一レコード・同一条件を触るかはPR差分で確認する。",
        "- `must_regress` は機械的な初期候補であり、修正内容が表示文言だけなら縮小できる。",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    sheets = load_html_sheets()
    coverage = load_test_coverage()
    source_feature_edges = load_source_feature_edges()
    inventory = build_inventory(sheets, coverage)
    edges = build_sheet_edges(sheets, source_feature_edges)
    matrix = build_regression_matrix(sheets, edges)

    write_tsv(
        OUT_DIR / "html_sheet_inventory.tsv",
        inventory,
        [
            "sheet_key",
            "html_file",
            "doc_code",
            "doc_title",
            "sheet_id",
            "sheet_order",
            "sheet_title",
            "sheet_type",
            "function_ids",
            "routes",
            "urls",
            "tables",
            "keywords",
            "source_paths",
            "test_files",
            "test_case_count",
            "it_ids",
            "p1",
            "p2",
            "p3",
            "text_len",
        ],
    )
    edge_fields = [
        "source_doc",
        "source_sheet",
        "source_functions",
        "target_doc",
        "target_sheet",
        "target_functions",
        "score",
        "reasons",
        "source_reason",
    ]
    write_tsv_with_headers(
        OUT_DIR / "html_sheet_dependency_edges.tsv",
        edges,
        edge_fields,
        EDGE_HEADER_LABELS,
    )
    write_tsv(
        OUT_DIR / "html_sheet_regression_matrix.tsv",
        matrix,
        [
            "changed_sheet_key",
            "changed_sheet",
            "changed_functions",
            "must_regress",
            "should_regress",
            "consider_if_related",
            "main_reasons",
        ],
    )
    (OUT_DIR / "html_sheet_dependency_report.md").write_text(
        make_report(sheets, edges, matrix), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
