#!/usr/bin/env python3
"""pf-eccube3 / pf-api の概算FPと、設計区分別の結合テスト規模を算定する。

ee の ``build_fp.py`` と同じ IFPUG 未調整FPの平均重みを使う。旧環境には
vendor がなくルータを起動できないため、ルート定義を静的に抽出する。
"""
from __future__ import annotations

import re
from collections import Counter, defaultdict
from pathlib import Path


HERE = Path(__file__).resolve().parent
REPO = HERE.parent
OUT = HERE / "out"
PF_EC = Path("/home/y-saito/Developments/pf-eccube3")
PF_API = Path("/home/y-saito/Developments/pf-api")

WEIGHTS = {
    "平均": {"EI": 4, "EO": 5, "EQ": 4, "ILF": 10, "EIF": 7},
    "単純": {"EI": 3, "EO": 4, "EQ": 3, "ILF": 7, "EIF": 5},
    "複雑": {"EI": 6, "EO": 7, "EQ": 6, "ILF": 15, "EIF": 10},
}
IMPORT_TOKENS = {"import", "upload"}
EO_TOKENS = {"export", "download", "csv", "pdf", "print", "output", "invoice", "receipt"}
EI_TOKENS = {
    "new", "edit", "delete", "update", "insert", "save", "upload", "import", "bulk",
    "regist", "cancel", "approve", "execute", "copy", "sync", "complete", "activate",
    "enable", "disable", "sort", "move", "add", "remove", "apply", "post", "put",
}
WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

B16_EXCLUDED = {"B16-01", "B16-02", "B16-03", "B16-04", "B16-05", "B16-07", "B16-08", "B16-12"}
PH2_EXCLUDED = {"M03-43", "M04-06", "M04-07", "M06-13", "M08-11", "M08-15", "M08-16",
                "A06-14", "B01-02", "B01-03", "F02-05"}


def classify(name: str, path: str, methods: list[str]) -> tuple[str, str]:
    tokens = set(re.split(r"[^a-z0-9]+", f"{name} {path}".lower()))
    hit = sorted(tokens & IMPORT_TOKENS)
    if hit:
        return "EI", f"取込語 {','.join(hit)}"
    hit = sorted(tokens & EO_TOKENS)
    if hit:
        return "EO", f"出力語 {','.join(hit)}"
    hit = sorted(tokens & EI_TOKENS)
    if hit:
        return "EI", f"更新語 {','.join(hit)}"
    hit = sorted(set(methods) & WRITE_METHODS)
    if hit:
        return "EI", f"更新メソッド {','.join(hit)}"
    return "EQ", "参照のみ"


def extract_pf_api_routes() -> list[dict]:
    path = PF_API / "config/routes.yaml"
    routes: list[dict] = []
    current: dict | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line and not line.startswith((" ", "\t", "#")) and line.rstrip().endswith(":"):
            if current and current.get("controller"):
                routes.append(current)
            current = {"system": "pf-api", "route": line[:-1].strip(), "source": str(path)}
            continue
        if current is None:
            continue
        m = re.match(r"\s+(path|controller|methods):\s*(.*?)\s*$", line)
        if not m:
            continue
        key, value = m.groups()
        if key == "methods":
            current[key] = re.findall(r"[A-Z]+", value) or ["ANY"]
        else:
            current[key] = value.strip("'\"")
    if current and current.get("controller"):
        routes.append(current)
    return routes


PHP_ROUTE = re.compile(
    r"\$(?:c|app)->(?P<verb>match|get|post|put|delete)\s*\((?P<body>.*?)\)"
    r"(?P<chain>.*?)->bind\(\s*['\"](?P<name>[^'\"]+)['\"]\s*\)",
    re.S,
)


def extract_pf_eccube_routes() -> list[dict]:
    roots = [PF_EC / "src/Eccube", PF_EC / "app/Plugin"]
    candidates: list[dict] = []
    for root in roots:
        for php in root.rglob("*.php"):
            if any(part in {"Tests", "test", "tests", "vendor"} for part in php.parts):
                continue
            text = php.read_text(encoding="utf-8", errors="ignore")
            for m in PHP_ROUTE.finditer(text):
                body = m.group("body")
                ctrl = re.search(r"['\"](\\?[^'\"]+::[A-Za-z_][A-Za-z0-9_]*)['\"]", body)
                if not ctrl:
                    continue
                first_string = re.search(r"['\"]([^'\"]*)['\"]", body)
                verb = m.group("verb").upper()
                source = str(php.relative_to(PF_EC))
                if source.startswith("app/Plugin/HareruyaEc/"):
                    priority = 3
                elif source.startswith("app/Plugin/"):
                    priority = 2
                else:
                    priority = 1
                candidates.append({
                    "system": "pf-eccube3",
                    "route": m.group("name"),
                    "path": first_string.group(1) if first_string else "",
                    "controller": ctrl.group(1).lstrip("\\"),
                    "methods": [verb] if verb != "MATCH" else ["ANY"],
                    "source": source,
                    "priority": priority,
                })

    # EC-CUBE本体とHareruyaEcが同名ルートを定義するため、実運用と同様に
    # HareruyaEc > その他プラグイン > 本体の順で有効定義を1件にする。
    effective: dict[str, dict] = {}
    for route in candidates:
        old = effective.get(route["route"])
        if old is None or route["priority"] >= old["priority"]:
            effective[route["route"]] = route
    return sorted((r for r in effective.values() if "NotFoundController::" not in r["controller"]),
                  key=lambda x: x["route"])


def collapse_actions(routes: list[dict]) -> list[dict]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for route in routes:
        grouped[route["controller"]].append(route)
    rows = []
    for action, items in sorted(grouped.items()):
        names = sorted({x["route"] for x in items})
        paths = sorted({x.get("path", "") for x in items})
        methods = sorted({m for x in items for m in x.get("methods", ["ANY"])})
        kind, reason = classify(min(names, key=len), " ".join(paths), methods)
        rows.append({
            "システム": items[0]["system"],
            "コントローラアクション": action,
            "ルート名": ",".join(names),
            "ルート数": len(items),
            "パス": ",".join(paths),
            "HTTPメソッド": ",".join(methods),
            "FP種別": kind,
            "判定根拠": reason,
            "抽出元": ",".join(sorted({x["source"] for x in items})),
        })
    return rows


def extract_tables(system_root: Path, roots: list[Path]) -> dict[str, str]:
    found: dict[str, str] = {}
    for root in roots:
        if not root.exists():
            continue
        for ext in ("*.yml", "*.yaml"):
            for path in root.rglob(ext):
                if any(part in {"migration", "vendor", "test", "tests"} for part in path.parts):
                    continue
                text = path.read_text(encoding="utf-8", errors="ignore")
                for m in re.finditer(r"(?m)^\s*(?:table|tableName):\s*['\"]?([^'\"\s#]+)", text):
                    found.setdefault(m.group(1), str(path.relative_to(system_root)))
    return found


def fp_total(counts: Counter, grade: str = "平均") -> int:
    return sum(counts[k] * WEIGHTS[grade][k] for k in ("EI", "EO", "EQ", "ILF", "EIF"))


def measure_php_ncloc(roots: list[Path]) -> tuple[int, int]:
    files = lines = 0
    block_comment = re.compile(r"/\*.*?\*/", re.S)
    for root in roots:
        if not root.exists():
            continue
        for php in root.rglob("*.php"):
            if any(part.lower() in {"vendor", "test", "tests", "migration", "migrations"} for part in php.parts):
                continue
            files += 1
            text = block_comment.sub("", php.read_text(encoding="utf-8", errors="ignore"))
            lines += sum(1 for line in text.splitlines()
                         if line.strip() and not line.lstrip().startswith(("//", "#", "*")))
    return files, lines


def parse_todo() -> list[dict]:
    rows_by_html: dict[str, dict] = {}
    excluded = B16_EXCLUDED | PH2_EXCLUDED
    for line in (REPO / "functions/todo-list.md").read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(cells) < 8 or cells[5] not in {"現行踏襲", "カスタマイズ", "新規実装", "標準"}:
            continue
        html = re.search(r"\[html\]\(([^)]+)\)", cells[7])
        if not html:
            continue
        html_path = html.group(1)
        html_stem = Path(html_path).stem.lower().replace("-", "_")
        fid = cells[4] if re.fullmatch(r"[A-Z]\d{2}-\d{2}", cells[4]) else html_stem
        source = "other"
        if "pf-eccube3/" in cells[7]:
            source = "pf-eccube3"
        elif "pf-api/" in cells[7]:
            source = "pf-api"
        elif "ec-cube-enterprise/" in cells[7]:
            source = "ec-cube-enterprise"
        category = cells[5]
        row = {
            "機能No": fid,
            "区分": cells[1],
            "分類": cells[2],
            "機能名": cells[3],
            "設計区分": category,
            "3分類": "現行踏襲" if category == "標準" else category,
            "設計書ソース": source,
            "結合試験対象": "対象外" if fid in excluded else "対象",
            "対象外理由": "B16除外" if fid in B16_EXCLUDED else ("Ph2全体" if fid in PH2_EXCLUDED else ""),
            "HTML設計書": html_path,
        }
        rows_by_html.setdefault(html_path, row)
    return list(rows_by_html.values())


def read_ipa_medians() -> dict[str, float]:
    path = HERE / "data/ipa_2022_benchmark.tsv"
    lines = path.read_text(encoding="utf-8").splitlines()
    head = lines[0].split("\t")
    rows = [dict(zip(head, line.split("\t"))) for line in lines[1:] if line.strip()]
    return {
        r["開発種別"]: float(r["中央"])
        for r in rows
        if r["規模基準"] == "FP" and r["指標"] == "結合テスト(テストケース)"
    }


def write_tsv(path: Path, rows: list[dict]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    columns = list(rows[0])
    with path.open("w", encoding="utf-8") as f:
        f.write("\t".join(columns) + "\n")
        for row in rows:
            f.write("\t".join(str(row.get(c, "")) for c in columns) + "\n")


def main() -> int:
    OUT.mkdir(exist_ok=True)
    api_routes = extract_pf_api_routes()
    ec_routes = extract_pf_eccube_routes()
    transactions = collapse_actions(ec_routes) + collapse_actions(api_routes)
    write_tsv(OUT / "legacy_fp_transactions.tsv", transactions)

    ec_table_roots = [PF_EC / "src/Eccube/Resource/doctrine"]
    ec_table_roots.extend((PF_EC / "app/Plugin").glob("*/Resource/doctrine"))
    ec_tables = extract_tables(PF_EC, ec_table_roots)
    api_tables = extract_tables(PF_API, [PF_API / "src/Resources/config/doctrine"])
    file_rows = []
    for system, tables in (("pf-eccube3", ec_tables), ("pf-api", api_tables)):
        other = api_tables if system == "pf-eccube3" else ec_tables
        for table, source in sorted(tables.items()):
            file_rows.append({"システム": system, "種別": "ILF", "名称": table,
                              "他システムと重複": "yes" if table in other else "no", "根拠": source})
    write_tsv(OUT / "legacy_fp_files.tsv", file_rows)

    tx_counts = {
        system: Counter(r["FP種別"] for r in transactions if r["システム"] == system)
        for system in ("pf-eccube3", "pf-api")
    }
    # pf-eccube3が旧ポートフォリオの外部連携6系統を持つ。pf-apiのDB定義は
    # 単体FPではILF、ポートフォリオ合算ではpf-eccube3との重複を除く。
    summary_counts: list[tuple[str, Counter]] = []
    for system, ilf, eif in (("pf-eccube3", len(ec_tables), 6), ("pf-api", len(api_tables), 0)):
        c = tx_counts[system].copy()
        c["ILF"], c["EIF"] = ilf, eif
        summary_counts.append((system, c))
    combined = tx_counts["pf-eccube3"] + tx_counts["pf-api"]
    combined["ILF"] = len(set(ec_tables) | set(api_tables))
    combined["EIF"] = 6
    summary_counts.append(("移植元ポートフォリオ（ILF重複除外）", combined))

    summary_rows = []
    for system, counts in summary_counts:
        for grade in ("単純", "平均", "複雑"):
            summary_rows.append({
                "システム": system, "複雑度前提": grade,
                "EI": counts["EI"], "EO": counts["EO"], "EQ": counts["EQ"],
                "ILF": counts["ILF"], "EIF": counts["EIF"],
                "基本機能プロセス": counts["EI"] + counts["EO"] + counts["EQ"],
                "未調整FP": fp_total(counts, grade),
            })
    write_tsv(OUT / "legacy_fp_summary.tsv", summary_rows)

    sloc_rows = []
    for system, roots in (("pf-eccube3", [PF_EC / "src/Eccube", PF_EC / "app/Plugin"]),
                          ("pf-api", [PF_API / "src"])):
        files, ncloc = measure_php_ncloc(roots)
        sloc_rows.append({"システム": system, "PHPファイル数": files, "NCLOC": ncloc,
                          "バックファイアFP(J2EE/Java 49-53 SLOC/FP)": f"{round(ncloc / 53)}〜{round(ncloc / 49)}"})
    write_tsv(OUT / "legacy_sloc.tsv", sloc_rows)

    functions = parse_todo()
    write_tsv(OUT / "function_classification.tsv", functions)
    in_scope = [r for r in functions if r["結合試験対象"] == "対象"]
    original_counts = Counter(r["設計区分"] for r in in_scope)
    # 現在のtodo-listからgeneratorと同じ「HTMLパス重複排除＋Ph2除外」で382冊。
    # 既存FP報告の377機能は古い母数なので、現行HTMLを優先する。
    if len(in_scope) != 382:
        raise RuntimeError(f"結合試験対象HTMLは382冊の想定だが {len(in_scope)} 冊")

    ee_fp = 5702
    fp_per_function = ee_fp / len(in_scope)
    medians = read_ipa_medians()
    class_counts = Counter(r["3分類"] for r in in_scope)
    density_for = {"現行踏襲": medians["再開発"], "カスタマイズ": medians["改良開発"],
                   "新規実装": medians["新規開発"], "標準": medians["全開発種別"]}
    development_for = {"現行踏襲": "再開発", "カスタマイズ": "改良開発",
                       "新規実装": "新規開発", "標準": "全開発種別"}
    scale_rows = []
    allocated = 0.0
    total_cases = 0
    for category in ("現行踏襲", "カスタマイズ", "新規実装", "標準"):
        n = original_counts[category]
        fp = fp_per_function * n
        cases = round(fp / 1000 * density_for[category])
        allocated += fp
        total_cases += cases
        scale_rows.append({
            "設計区分": category,
            "3分類": "現行踏襲" if category == "標準" else category,
            "対象機能数": n,
            "配賦FP": f"{fp:.1f}",
            "適用IPA開発種別": development_for[category],
            "中央値(件/KFP)": density_for[category],
            "妥当ケース数": cases,
        })
    scale_rows.append({"設計区分": "推奨合計", "3分類": "3分類＋標準内訳", "対象機能数": len(in_scope),
                       "配賦FP": f"{allocated:.1f}", "適用IPA開発種別": "区分別加重",
                       "中央値(件/KFP)": f"{total_cases / (ee_fp / 1000):.1f}",
                       "妥当ケース数": total_cases})
    conservative_cases = total_cases + round(
        fp_per_function * original_counts["標準"] / 1000
        * (medians["再開発"] - medians["全開発種別"])
    )
    scale_rows.append({"設計区分": "保守的合計", "3分類": "標準も現行踏襲扱い", "対象機能数": len(in_scope),
                       "配賦FP": f"{allocated:.1f}", "適用IPA開発種別": "区分別加重",
                       "中央値(件/KFP)": f"{conservative_cases / (ee_fp / 1000):.1f}",
                       "妥当ケース数": conservative_cases})
    write_tsv(OUT / "test_scale_by_class.tsv", scale_rows)

    print(f"pf-eccube3 routes={len(ec_routes)} actions={len(collapse_actions(ec_routes))} tables={len(ec_tables)}")
    print(f"pf-api routes={len(api_routes)} actions={len(collapse_actions(api_routes))} tables={len(api_tables)}")
    print(f"table overlap={len(set(ec_tables) & set(api_tables))}")
    print(f"in-scope functions={len(in_scope)} classes={dict(class_counts)}")
    print(f"weighted test cases={total_cases} conservative={conservative_cases}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
