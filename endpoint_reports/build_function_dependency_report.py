#!/usr/bin/env python3
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FUNCTION_ROOT = ROOT / "functions"
IT_ROOT = ROOT / "integration_test"
OUT_DIR = ROOT / "endpoint_reports"

FUNC_ID_RE = re.compile(r"\b([fmabo]\d{2})[-_](\d{2})(?!\d)", re.IGNORECASE)
TABLE_RE = re.compile(r"\b(?:dtb|mtb|plg|trn|mt|d|t)_[a-zA-Z0-9_]+\b")
ENDPOINT_RE = re.compile(r"`((?:GET|POST|PUT|DELETE|PATCH|OPTIONS)\s+[^`]+|/[^`\s]+)`")
IT_ID_RE = re.compile(r"\bIT-\d{2}\b")
PRIORITY_RE = re.compile(r"\t(P[123])\t")
EXTERNAL_TERMS = [
    "スマレジ",
    "支店",
    "S3",
    "WordPress",
    "GMO",
    "SendGrid",
    "メール",
    "CSV",
    "PDF",
    "API",
    "バッチ",
    "Webhook",
    "RDS",
    "Redash",
]


def normalize_func_id(value: str) -> str:
    m = FUNC_ID_RE.search(value)
    if not m:
        return ""
    return f"{m.group(1).lower()}-{m.group(2)}"


def title_from_text(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def classify_from_slug(path: Path, func_id: str) -> tuple[str, str]:
    parts = path.stem.split("_")
    if len(parts) >= 3 and normalize_func_id(parts[0]):
        return parts[1], parts[2]
    if len(parts) >= 2 and "-" in parts[0]:
        return parts[1], parts[2] if len(parts) > 2 else parts[1]
    prefix = func_id[:1]
    return {
        "m": ("admin", "unknown"),
        "f": ("front", "unknown"),
        "a": ("api", "unknown"),
        "b": ("batch", "unknown"),
        "o": ("other", "unknown"),
    }.get(prefix, ("unknown", "unknown"))


def extract_update_tables(text: str) -> set[str]:
    update_tables: set[str] = set()
    in_db_ops = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_db_ops = "DB操作" in line or "DBカラム" in line
        if not line.startswith("|"):
            continue
        if "登録/更新" in line or "更新" in line or "削除" in line or "登録" in line:
            update_tables.update(TABLE_RE.findall(line))
        elif in_db_ops and any(token in line for token in ["対象テーブル", "対象DB", "保存"]):
            update_tables.update(TABLE_RE.findall(line))
    return update_tables


def load_functions() -> dict[str, dict]:
    functions: dict[str, dict] = {}
    for path in sorted(FUNCTION_ROOT.glob("*/*.md")):
        func_id = normalize_func_id(path.name)
        if not func_id:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        layer, domain = classify_from_slug(path, func_id)
        refs = {normalize_func_id(m.group(0)) for m in FUNC_ID_RE.finditer(text)}
        refs.discard(func_id)
        tables = set(TABLE_RE.findall(text))
        update_tables = extract_update_tables(text)
        externals = {term for term in EXTERNAL_TERMS if term in text}
        functions[func_id] = {
            "id": func_id,
            "title": title_from_text(text, path.stem),
            "path": path.relative_to(ROOT).as_posix(),
            "layer": layer,
            "domain": domain,
            "refs": refs,
            "tables": tables,
            "update_tables": update_tables,
            "endpoints": ENDPOINT_RE.findall(text),
            "externals": externals,
            "text": text,
        }
    return functions


def load_test_coverage(functions: dict[str, dict]) -> dict[str, dict]:
    coverage = {
        fid: {"file": "", "case_count": 0, "it_ids": set(), "priority": Counter()}
        for fid in functions
    }
    for path in sorted(IT_ROOT.glob("*_it_cases.md")):
        func_id = normalize_func_id(path.name)
        if func_id not in coverage:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        coverage[func_id]["file"] = path.relative_to(ROOT).as_posix()
        coverage[func_id]["case_count"] = len(re.findall(r"\n.+?\tIT-[A-Z0-9-]+", text))
        coverage[func_id]["it_ids"] = set(IT_ID_RE.findall(text))
        coverage[func_id]["priority"] = Counter(PRIORITY_RE.findall(text))
    return coverage


def build_edges(functions: dict[str, dict]) -> list[dict]:
    edges = []
    ids = sorted(functions)
    for src_id in ids:
        src = functions[src_id]
        for dst_id in ids:
            if src_id == dst_id:
                continue
            dst = functions[dst_id]
            reasons = []
            score = 0
            shared_tables = src["tables"] & dst["tables"]
            shared_updates = src["update_tables"] & dst["update_tables"]
            shared_externals = src["externals"] & dst["externals"]
            direct = dst_id in src["refs"]
            reverse_direct = src_id in dst["refs"]
            if direct:
                reasons.append("direct_ref")
                score += 5
            if reverse_direct:
                reasons.append("reverse_ref")
                score += 4
            if shared_updates:
                reasons.append("shared_update_table")
                score += 4 + min(len(shared_updates), 3)
            elif shared_tables:
                reasons.append("shared_db_table")
                score += 2 + min(len(shared_tables), 3)
            if shared_externals:
                reasons.append("shared_external")
                score += 2
            if src["domain"] == dst["domain"] and src["layer"] != dst["layer"]:
                reasons.append("same_domain_cross_layer")
                score += 2
            elif src["domain"] == dst["domain"]:
                reasons.append("same_domain")
                score += 1
            if score >= 4:
                edges.append(
                    {
                        "source_id": src_id,
                        "source_title": src["title"],
                        "target_id": dst_id,
                        "target_title": dst["title"],
                        "score": score,
                        "reasons": ",".join(reasons),
                        "shared_update_tables": ",".join(sorted(shared_updates)),
                        "shared_tables": ",".join(sorted(shared_tables)),
                        "shared_externals": ",".join(sorted(shared_externals)),
                    }
                )
    return sorted(edges, key=lambda r: (r["source_id"], -r["score"], r["target_id"]))


def write_tsv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def limit_edges_per_source(edges: list[dict], limit: int = 12) -> list[dict]:
    counts = Counter()
    limited = []
    for edge in edges:
        if counts[edge["source_id"]] >= limit:
            continue
        counts[edge["source_id"]] += 1
        limited.append(edge)
    return limited


def make_report(functions: dict[str, dict], coverage: dict[str, dict], edges: list[dict]) -> str:
    table_counter = Counter()
    update_counter = Counter()
    domain_counter = Counter()
    external_counter = Counter()
    for item in functions.values():
        table_counter.update(item["tables"])
        update_counter.update(item["update_tables"])
        domain_counter.update([f"{item['layer']}/{item['domain']}"])
        external_counter.update(item["externals"])

    outgoing = Counter(edge["source_id"] for edge in edges)
    incoming = Counter(edge["target_id"] for edge in edges)
    direct_ref_count = sum(1 for edge in edges if "direct_ref" in edge["reasons"])
    shared_update_count = sum(1 for edge in edges if "shared_update_table" in edge["reasons"])

    lines = [
        "# 機能間依存関係整理（影響範囲・リグレッションテスト用）",
        "",
        "## 目的",
        "",
        "不具合修正後に、修正機能だけでなく影響しやすい周辺機能と優先して回すリグレッション観点を引けるようにするための初版整理である。",
        "",
        "## 入力と抽出方法",
        "",
        f"- 機能別設計書: `{FUNCTION_ROOT.relative_to(ROOT).as_posix()}/*/*.md` から {len(functions)} 件を抽出。",
        f"- 結合試験観点表: `{IT_ROOT.relative_to(ROOT).as_posix()}/*_it_cases.md` から各機能の IT-ID、優先度、ケース数を抽出。",
        "- 基本設計HTMLは大分類・用語の補助情報として扱い、機能ID単位の主キーは機能別Markdownを正とする。",
        "- 依存理由は `direct_ref`、`reverse_ref`、`shared_update_table`、`shared_db_table`、`shared_external`、`same_domain(_cross_layer)` に分類した。",
        "",
        "## 使い方",
        "",
        "1. 修正した機能IDを `function_dependency_inventory.tsv` で探す。",
        "2. `function_dependency_edges.tsv` の `source_id` が該当機能の行を、score降順で確認する。",
        "3. `direct_ref` と `shared_update_table` は原則リグレッション対象に入れる。",
        "4. `shared_db_table` は修正内容がテーブル読み書き・集計条件・検索条件に触れた場合に対象化する。",
        "5. `shared_external` は外部連携、CSV/PDF/API/バッチの入出力や再実行性に触れた場合に対象化する。",
        "",
        "## 抽出サマリ",
        "",
        f"- 依存候補エッジ: {len(edges)} 件（各機能あたり上位12件をTSV出力）。",
        f"- 直接参照エッジ: {direct_ref_count} 件。",
        f"- 共有更新テーブルエッジ: {shared_update_count} 件。",
        f"- テストケース紐づき機能: {sum(1 for v in coverage.values() if v['file'])} 件。",
        "",
        "## 影響範囲判定ルール",
        "",
        "| 修正内容 | 追加で見る範囲 | 推奨リグレッション |",
        "|---|---|---|",
        "| 画面表示・JS・入力項目 | 同一機能 + `same_domain` + 直接遷移先 | P1/P2のUI部品、画面遷移、送信可否制御 |",
        "| 登録・更新・削除 | `shared_update_table` + `shared_db_table` | P1/P2の登録内容、DB状態、副作用、二重送信 |",
        "| 検索・一覧・CSV出力 | 同一ドメインの一覧/CSV + 共有検索セッション | 検索条件、件数、並び順、CSV/PDF内容 |",
        "| API変更 | 同一ドメインのfront/admin/batch + 共有DB | 認証、リクエスト境界、レスポンス、状態変化 |",
        "| バッチ変更 | 共有更新テーブル + 同一外部連携 | 再実行、対象なし、例外、ログ、更新件数 |",
        "| 外部連携変更 | `shared_external` | 送信条件、失敗時、リトライ有無、ログ秘匿 |",
        "",
        "## 主要な共有DBテーブル",
        "",
        "| テーブル | 参照・言及機能数 | 更新系機能数 |",
        "|---|---:|---:|",
    ]
    for table, count in table_counter.most_common(20):
        lines.append(f"| `{table}` | {count} | {update_counter[table]} |")

    lines += [
        "",
        "## 更新系で特に波及しやすいテーブル",
        "",
        "| テーブル | 更新系機能数 | 主な確認観点 |",
        "|---|---:|---|",
    ]
    for table, count in update_counter.most_common(15):
        if "order" in table or "shipping" in table:
            viewpoint = "受注状態、出荷、ポイント、スマレジ、CSV/PDF"
        elif "product" in table or "card" in table:
            viewpoint = "商品表示、在庫、価格、検索、カード/API"
        elif "customer" in table:
            viewpoint = "会員情報、ポイント、購入履歴、認証"
        elif "stock" in table:
            viewpoint = "在庫数量、移動、承認、履歴、バッチ"
        else:
            viewpoint = "同一テーブルの登録・一覧・出力"
        lines.append(f"| `{table}` | {count} | {viewpoint} |")

    lines += [
        "",
        "## ドメイン別機能数",
        "",
        "| ドメイン | 機能数 |",
        "|---|---:|",
    ]
    for domain, count in domain_counter.most_common(25):
        lines.append(f"| `{domain}` | {count} |")

    lines += [
        "",
        "## 外部連携・入出力キーワード",
        "",
        "| キーワード | 機能数 |",
        "|---|---:|",
    ]
    for term, count in external_counter.most_common():
        lines.append(f"| {term} | {count} |")

    lines += [
        "",
        "## 依存候補が多い機能",
        "",
        "| 機能ID | 機能名 | outgoing | incoming | 主な更新テーブル |",
        "|---|---|---:|---:|---|",
    ]
    for fid, _ in (outgoing + incoming).most_common(20):
        item = functions[fid]
        update_tables = ", ".join(f"`{t}`" for t in sorted(item["update_tables"])[:5])
        lines.append(
            f"| `{fid}` | {item['title']} | {outgoing[fid]} | {incoming[fid]} | {update_tables} |"
        )

    lines += [
        "",
        "## 成果物",
        "",
        "- `function_dependency_inventory.tsv`: 機能ごとのDB、更新テーブル、外部連携、テストケース数。",
        "- `function_dependency_edges.tsv`: 機能間の依存候補。scoreが高いほどリグレッション候補として優先。",
        "- `build_function_dependency_report.py`: 再生成スクリプト。",
        "",
        "## 注意点",
        "",
        "- この初版は設計書本文からの抽出であり、実コードの呼び出しグラフではない。",
        "- 共有DBテーブルは依存候補であり、必ずしも同一レコード・同一条件を触るとは限らない。",
        "- 修正PR単位の最終影響範囲は、変更ファイル、SQL、ルート、テンプレート、フォーム、バッチコマンドを突き合わせて確定する。",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    functions = load_functions()
    coverage = load_test_coverage(functions)
    edges = limit_edges_per_source(build_edges(functions))

    inventory = []
    for fid, item in sorted(functions.items()):
        cov = coverage[fid]
        priority = cov["priority"]
        inventory.append(
            {
                "id": fid,
                "title": item["title"],
                "path": item["path"],
                "layer": item["layer"],
                "domain": item["domain"],
                "tables": ",".join(sorted(item["tables"])),
                "update_tables": ",".join(sorted(item["update_tables"])),
                "endpoints_count": len(item["endpoints"]),
                "direct_refs": ",".join(sorted(item["refs"])),
                "externals": ",".join(sorted(item["externals"])),
                "test_file": cov["file"],
                "test_case_count": cov["case_count"],
                "it_ids": ",".join(sorted(cov["it_ids"])),
                "p1": priority["P1"],
                "p2": priority["P2"],
                "p3": priority["P3"],
            }
        )

    write_tsv(
        OUT_DIR / "function_dependency_inventory.tsv",
        inventory,
        [
            "id",
            "title",
            "path",
            "layer",
            "domain",
            "tables",
            "update_tables",
            "endpoints_count",
            "direct_refs",
            "externals",
            "test_file",
            "test_case_count",
            "it_ids",
            "p1",
            "p2",
            "p3",
        ],
    )
    write_tsv(
        OUT_DIR / "function_dependency_edges.tsv",
        edges,
        [
            "source_id",
            "source_title",
            "target_id",
            "target_title",
            "score",
            "reasons",
            "shared_update_tables",
            "shared_tables",
            "shared_externals",
        ],
    )
    (OUT_DIR / "function_dependency_report.md").write_text(
        make_report(functions, coverage, edges), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
