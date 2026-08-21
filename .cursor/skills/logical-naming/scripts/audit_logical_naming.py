#!/usr/bin/env python3
"""論理名規約の監査: テスト資産・E2Eハーネスに物理名が混入していないかを機械検出する。

規約は [[logical-naming]]（.cursor/skills/logical-naming/SKILL.md）を正本とする。
検出対象は「利用者に見えない内部識別子」と「DB物理名」の2種類:

  - 内部識別子: 翻訳キー / セッションキー / フラッシュキー / ルート名
    （例 admin.product.date_range_error, eccube.admin.order.search）
  - DB物理名: dtb_ / mtb_ / plg_ で始まるテーブル名（`テーブル.カラム` 形式を含む）

対象外（物理のまま書いてよい）: HTMLセレクタ（#admin_search_order_...）、
ソースの file:line、HTTPパス、環境変数、コマンド名。これらは論理名を持たず、
位置情報としてしか使えないため。

既存資産は「規約の組み込みのみ・一括是正はしない」方針のため、
ベースライン（棚卸し済みの既知混入）を差し引き、**新規に増えた分だけ**を違反とする。

  python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo .
  python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo . --report out.tsv
  python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --repo . --update-baseline
  python3 .cursor/skills/logical-naming/scripts/audit_logical_naming.py --selftest
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_BASELINE = SKILL_DIR / "baseline.tsv"
LEDGER_RELPATH = Path("e2e/config/logical-names.tsv")

# 規約の適用先。テストケース（納品物）とE2Eハーネス。
SCAN_ROOTS = (
    "integration_test",
    "scenario_test",
    "e2e",
    # 機能設計書の本文も対象（DB定義節は下記の例外で除く）。Excel正本の変換物は対象外。
    "functions",
)
# 設計書のDB定義節。ここは実装照合の根拠として物理名を残す（[[logical-naming]] 「対象外」）。
DB_SECTION_HEADINGS = ("DB操作", "DBカラム", "テーブル定義", "カラム定義")
SCAN_SUFFIXES = {".md", ".tsv", ".ts", ".js", ".json"}
# 生成物・外部資産・対応表そのものは対象外（対応表は物理名を持つのが役目）。
EXCLUDE_PARTS = {
    "node_modules",
    "playwright-report",
    "test-results",
    "reports",
    ".git",
    "__pycache__",
}
EXCLUDE_RELPATHS = {LEDGER_RELPATH.as_posix()}
# 実行されるシード・スキーマ定義は物理名そのものが実行値であり、論理名に置き換えられない。
# セレクタと同じ扱いで規約の対象外とする（[[logical-naming]] 「対象外」）。
# functions/_archive は5分類化で本文から外した節の退避先。現役の設計書ではないので対象外。
EXCLUDE_DIR_PREFIXES = ("e2e/seed", "e2e/db", "functions/_archive")
# 実行されるSQLの行も同じ理由で対象外。説明文ではなく実行文であることを大文字SQL語で判定する。
SQL_LINE_RE = re.compile(
    r"\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|FROM|JOIN|TRUNCATE|ALTER\s+TABLE|CREATE\s+TABLE)\b"
)

# 内部識別子: 先頭セグメントが名前空間で、2つ以上のドット区切りが続くもの。
# 前後に英数・ドット・スラッシュ・ハイフンが無いことを要求し、
# ファイル名（messages.ja.yaml）・クラス名（SearchOrderType.php）を拾わない。
INTERNAL_ID_RE = re.compile(
    r"(?<![0-9A-Za-z_.\-/])(?:eccube|admin|front|api|plg|mypage|shopping)"
    r"(?:\.[a-z0-9_]+){2,}(?![0-9A-Za-z_.\-/])"
)
# ホスト名（admin.hareruyamtg.com など）は画面に出る表示文字列であって内部識別子ではない。
HOSTNAME_TAIL_RE = re.compile(r"\.(?:com|net|org|jp|co\.jp|io|dev|local)$")
# DB物理名: テーブル名（+ 任意のカラム）。
DB_NAME_RE = re.compile(r"(?<![0-9A-Za-z_])(?:dtb|mtb|plg)_[a-z0-9_]+(?:\.[a-z0-9_]+)?")

KIND_INTERNAL = "内部識別子"
KIND_DB = "DB物理名"


def iter_target_files(repo: Path) -> list[Path]:
    """規約の適用先ファイルを列挙する（決定的な順序で返す）。"""
    files: list[Path] = []
    for root in SCAN_ROOTS:
        base = repo / root
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file() or path.suffix not in SCAN_SUFFIXES:
                continue
            rel = path.relative_to(repo)
            if EXCLUDE_PARTS & set(rel.parts):
                continue
            if rel.as_posix() in EXCLUDE_RELPATHS:
                continue
            if rel.as_posix().startswith(EXCLUDE_DIR_PREFIXES):
                continue
            files.append(path)
    return files


def scan_text(text: str) -> list[tuple[int, str, str]]:
    """1ファイル分の本文から (行番号, 種別, 物理名) を抽出する。"""
    hits: list[tuple[int, str, str]] = []
    in_db_section = False
    for lineno, line in enumerate(text.splitlines(), start=1):
        heading = re.match(r"^(#{2,4})\s+(.*)$", line)
        if heading:
            in_db_section = any(k in heading.group(2) for k in DB_SECTION_HEADINGS)
        if in_db_section:
            # DB定義節は物理名を残す規約なので検出しない。
            continue
        for match in INTERNAL_ID_RE.finditer(line):
            if HOSTNAME_TAIL_RE.search(match.group(0)):
                continue
            hits.append((lineno, KIND_INTERNAL, match.group(0)))
        if SQL_LINE_RE.search(line):
            # 実行されるSQL文。物理名が実行値なので置き換え対象にしない。
            continue
        for match in DB_NAME_RE.finditer(line):
            hits.append((lineno, KIND_DB, match.group(0)))
    return hits


def scan_repo(repo: Path) -> list[tuple[str, int, str, str]]:
    """リポジトリ全体を走査して (相対パス, 行, 種別, 物理名) を返す。"""
    found: list[tuple[str, int, str, str]] = []
    for path in iter_target_files(repo):
        rel = path.relative_to(repo).as_posix()
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for lineno, kind, name in scan_text(text):
            found.append((rel, lineno, kind, name))
    return found


def counts_by_pair(found: list[tuple[str, int, str, str]]) -> Counter:
    """(ファイル, 物理名) ごとの件数。行番号の揺れでベースラインを壊さない粒度。"""
    return Counter((rel, name) for rel, _lineno, _kind, name in found)


def load_baseline(path: Path) -> Counter:
    baseline: Counter = Counter()
    if not path.exists():
        return baseline
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("file\t"):
            continue
        rel, name, count = line.split("\t")
        baseline[(rel, name)] = int(count)
    return baseline


def write_baseline(path: Path, pairs: Counter) -> None:
    lines = ["# 論理名規約の既知混入（棚卸し済み）。新規追加分のみを違反として扱う。",
             "file\tphysical_name\tcount"]
    for (rel, name), count in sorted(pairs.items()):
        lines.append(f"{rel}\t{name}\t{count}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def new_violations(
    found: list[tuple[str, int, str, str]], baseline: Counter
) -> list[tuple[str, int, str, str]]:
    """ベースラインを超えた分だけを違反として返す（ファイル・物理名の組ごとに繰り越し）。"""
    budget = Counter(baseline)
    violations: list[tuple[str, int, str, str]] = []
    for rel, lineno, kind, name in sorted(found):
        key = (rel, name)
        if budget[key] > 0:
            budget[key] -= 1
            continue
        violations.append((rel, lineno, kind, name))
    return violations


def write_report(path: Path, found: list[tuple[str, int, str, str]], baseline: Counter) -> None:
    lines = ["file\tline\tkind\tphysical_name\tstatus"]
    known = Counter(baseline)
    for rel, lineno, kind, name in sorted(found):
        key = (rel, name)
        if known[key] > 0:
            known[key] -= 1
            status = "既知(棚卸し済み)"
        else:
            status = "新規違反"
        lines.append(f"{rel}\t{lineno}\t{kind}\t{name}\t{status}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_summary(path: Path, found: list[tuple[str, int, str, str]]) -> None:
    """既存混入の棚卸しサマリ（是正の着手順を決めるための集計）。"""
    by_kind = Counter(kind for _rel, _line, kind, _name in found)
    by_area = Counter(rel.split("/")[0] for rel, _line, _kind, _name in found)
    by_name = Counter(name for _rel, _line, _kind, name in found)
    by_file = Counter(rel for rel, _line, _kind, _name in found)
    lines = [
        "# 論理名規約 既存混入の棚卸し",
        "",
        "[[logical-naming]] の規約は新規・改修分に適用し、ここに集計した既存分は",
        "`baseline.tsv` で棚卸し済みとして扱う（監査は新規増加分だけを落とす）。",
        "このファイルは監査スクリプトの `--summary` で再生成する。",
        "",
        f"- 総ヒット: {len(found)}件 / 対象ファイル: {len(by_file)}件",
        "",
        "## 種別別",
        "",
        "| 種別 | 件数 |",
        "| --- | ---: |",
    ]
    lines += [f"| {kind} | {count} |" for kind, count in by_kind.most_common()]
    lines += ["", "## 領域別", "", "| 領域 | 件数 |", "| --- | ---: |"]
    lines += [f"| {area} | {count} |" for area, count in by_area.most_common()]
    lines += ["", "## 物理名 上位20", "", "| 物理名 | 件数 |", "| --- | ---: |"]
    lines += [f"| `{name}` | {count} |" for name, count in by_name.most_common(20)]
    lines += ["", "## ファイル 上位20", "", "| ファイル | 件数 |", "| --- | ---: |"]
    lines += [f"| `{rel}` | {count} |" for rel, count in by_file.most_common(20)]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def check_ledger(repo: Path) -> list[str]:
    """論理名対応表（e2e/config/logical-names.tsv）の壊れを検出する。"""
    path = repo / LEDGER_RELPATH
    failures: list[str] = []
    if not path.exists():
        return [f"論理名対応表が無い: {LEDGER_RELPATH.as_posix()}"]
    rows = [r for r in path.read_text(encoding="utf-8").splitlines() if r and not r.startswith("#")]
    if not rows:
        return [f"論理名対応表が空: {LEDGER_RELPATH.as_posix()}"]
    header = rows[0].split("\t")
    expected = ["物理名", "種別", "論理名", "機能ID", "出典", "状態"]
    if header != expected:
        return [f"論理名対応表の列が規約と違う: {header} != {expected}"]
    seen: set[tuple[str, str, str]] = set()
    for lineno, row in enumerate(rows[1:], start=2):
        cells = row.split("\t")
        if len(cells) != len(expected):
            failures.append(f"{LEDGER_RELPATH.as_posix()}:{lineno} 列数が {len(cells)}（{len(expected)}列必須）")
            continue
        physical, kind, logical, fid, evidence, status = cells
        if not physical or not logical:
            failures.append(f"{LEDGER_RELPATH.as_posix()}:{lineno} 物理名・論理名は空にできない")
        if not evidence:
            failures.append(f"{LEDGER_RELPATH.as_posix()}:{lineno} 出典（file:line 等）が空: {physical}")
        if status not in {"確定", "要確認"}:
            failures.append(f"{LEDGER_RELPATH.as_posix()}:{lineno} 状態は 確定/要確認 のみ: {status}")
        # 同じ物理名が複数の論理名を持つのは正常（1つの翻訳キーを複数画面が使う）。
        # 同一の論理名・出典まで重なった行だけを重複とみなす。
        key = (physical, logical, evidence)
        if key in seen:
            failures.append(f"{LEDGER_RELPATH.as_posix()}:{lineno} 同一の行が重複: {physical} / {logical}")
        seen.add(key)
    return failures


def selftest() -> int:
    """検出器の境界（拾うもの・拾わないもの）を固定する。"""
    cases_hit = [
        ("セッション eccube.admin.order.search からクエリ", "eccube.admin.order.search"),
        ("文言 admin.product.date_range_error を addError", "admin.product.date_range_error"),
        ("trans('api.deck_builder.common.not_found')", "api.deck_builder.common.not_found"),
        ("dtb_order.order_no が採番されること", "dtb_order.order_no"),
        ("mtb_authority の行が増えないこと", "mtb_authority"),
    ]
    cases_miss = [
        "#admin_search_order_order_datetime_start に日時を入れる",
        "SearchOrderType.php:363 を根拠に導出",
        "messages.ja.yaml:1418 を確認",
        "GET /%admin_route%/order を開く",
        "fixtures/admin_login.fixture を import する",
        "admin.twig の表示",  # ドット1つ（2セグメント）は識別子とみなさない
        "「admin.hareruyamtg.com」は指定できません。",  # 画面に出るホスト名は表示文字列
    ]
    failures: list[str] = []
    for text, expected in cases_hit:
        names = [name for _l, _k, name in scan_text(text)]
        if expected not in names:
            failures.append(f"検出漏れ: {text!r} → {names}")
    for text in cases_miss:
        names = [name for _l, _k, name in scan_text(text)]
        if names:
            failures.append(f"誤検出: {text!r} → {names}")
    # ベースライン差引の挙動
    found = [("a.md", 1, KIND_INTERNAL, "admin.x.y"), ("a.md", 9, KIND_INTERNAL, "admin.x.y")]
    if len(new_violations(found, Counter({("a.md", "admin.x.y"): 1}))) != 1:
        failures.append("ベースラインの繰り越しが1件だけ許可になっていない")
    if new_violations(found, Counter({("a.md", "admin.x.y"): 2})):
        failures.append("ベースライン以内なのに違反が出た")
    for failure in failures:
        print(f"SELFTEST NG: {failure}")
    print("SELFTEST OK" if not failures else "SELFTEST FAILED")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    parser.add_argument("--report", type=Path, help="全ヒットを status 付きでTSV出力する")
    parser.add_argument("--summary", type=Path, help="既存混入の棚卸しサマリをMarkdownで出力する")
    parser.add_argument("--update-baseline", action="store_true", help="現状を棚卸し済みとして記録する")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()

    if args.selftest:
        return selftest()

    repo = args.repo.resolve()
    found = scan_repo(repo)
    pairs = counts_by_pair(found)

    if args.update_baseline:
        write_baseline(args.baseline, pairs)
        print(f"ベースライン更新: {args.baseline} （{len(pairs)}組 / 延べ {sum(pairs.values())}件）")
        return 0

    baseline = load_baseline(args.baseline)
    violations = new_violations(found, baseline)
    if args.report:
        write_report(args.report, found, baseline)
        print(f"棚卸しレポート: {args.report}")
    if args.summary:
        write_summary(args.summary, found)
        print(f"棚卸しサマリ: {args.summary}")

    ledger_failures = check_ledger(repo)
    print(f"走査ファイル: {len(iter_target_files(repo))}")
    print(f"物理名ヒット: 延べ {len(found)}件（棚卸し済み {sum(baseline.values())}件）")
    for failure in ledger_failures:
        print(f"  NG: {failure}")
    if violations:
        print(f"  NG: 論理名規約に反する物理名が新規に {len(violations)}件 増えている")
        for rel, lineno, kind, name in violations[:20]:
            print(f"    {rel}:{lineno} [{kind}] {name}")
        if len(violations) > 20:
            print(f"    …ほか {len(violations) - 20}件")
        print("  → [[logical-naming]] に従い論理名へ置き換えるか、"
              f"{LEDGER_RELPATH.as_posix()} で論理名を確定してください")
    if violations or ledger_failures:
        print("AUDIT FAILED")
        return 1
    print("AUDIT OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
