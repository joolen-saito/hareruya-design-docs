#!/usr/bin/env python3
"""機能設計書Markdownの物理名を、論理名対応表に従って論理名へ置き換える。

規約は [[logical-naming]]。置き換えるのは本文の物理名だけで、次は触らない。

  - セレクタ・`file:line`・HTTPパス・ルート名・コマンド名・実行SQL（規約の対象外）
  - `--keep` で指定した箇所（物理名の差異そのものが仕様内容になっている行）

論理名は `e2e/config/logical-names.tsv` からのみ引く。表に無い物理名は置き換えず、
未解決として報告する（推測で論理名を作らない）。

  python3 .cursor/skills/logical-naming/scripts/apply_logical_names.py --docs-from-html \\
      "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html" --dry-run
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from pathlib import Path

LEDGER_RELPATH = Path("e2e/config/logical-names.tsv")
INTERNAL_ID_RE = re.compile(
    r"(?<![0-9A-Za-z_.\-/])(?:eccube|admin|front|api|plg|mypage|shopping)"
    r"(?:\.[a-z0-9_]+){2,}(?![0-9A-Za-z_.\-/])"
)
DB_NAME_RE = re.compile(r"(?<![0-9A-Za-z_])(?:dtb|mtb|plg)_[a-z0-9_]+(?:\.[a-z0-9_]+)?")
HOSTNAME_TAIL_RE = re.compile(r"\.(?:com|net|org|jp|io|dev|local)$")
# 「翻訳キー `x`」「ロケールキーx」のように、物理名を指す語ごと言い換える必要がある形。
KEY_PHRASE_RE = re.compile(r"(?:翻訳|ロケール|メッセージ)キー[はを]?[ 　]*[`「]?([A-Za-z0-9_.]+)[`」]?")


def load_ledger(repo: Path) -> dict[str, list[tuple[str, str, str]]]:
    """物理名 → [(論理名, 機能ID, 状態)] を返す。"""
    table: dict[str, list[tuple[str, str, str]]] = {}
    path = repo / LEDGER_RELPATH
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or line.startswith("物理名\t"):
            continue
        cells = line.split("\t")
        if len(cells) != 6:
            continue
        physical, _kind, logical, fid, _evidence, status = cells
        table.setdefault(physical, []).append((logical, fid, status))
    return table


def pick_logical(entries: list[tuple[str, str, str]], fid_hint: str) -> str | None:
    """機能IDが一致する行を優先する。決まらなければ None（推測しない）。"""
    scoped = [e for e in entries if e[1] and fid_hint and e[1].upper() == fid_hint.upper()]
    pool = scoped or entries
    names = {e[0] for e in pool}
    if len(names) == 1:
        return next(iter(names))
    # メッセージIDが違っても表示文言が同じなら、文言だけは一意に決まる。
    texts = {m.group(1) for m in (re.search(r"「(.*)」", n) for n in names) if m}
    if len(texts) == 1 and all("「" in n for n in names):
        return "「" + texts.pop() + "」"
    # メッセージIDは出現箇所ごとの識別子なので、どこでも使える汎用の論理名があればそれを採る
    # （同じキーが複数画面で使われ、メッセージIDが割れている場合の解）。
    generic = {logical for logical, _f, _s in entries if not re.search(r"MSG-\d", logical)}
    if len(generic) == 1:
        return generic.pop()
    return None


def message_text(logical: str) -> str:
    """`M05-01-MSG-012「…」` 形式から表示文言だけを取り出す（無ければそのまま）。"""
    m = re.search(r"「(.*)」", logical)
    return f"「{m.group(1)}」" if m else logical


def fid_of(doc: Path) -> str:
    m = re.match(r"([a-z]\d{2}-\d{2})", doc.name)
    return m.group(1).upper() if m else ""


def physical_names(text: str) -> list[str]:
    names = [n for n in INTERNAL_ID_RE.findall(text) if not HOSTNAME_TAIL_RE.search(n)]
    names += DB_NAME_RE.findall(text)
    return names


NAME_PATTERN = (
    r"(?:(?:eccube|admin|front|api|plg|mypage|shopping)(?:\.[a-z0-9_]+){2,})"
    r"|(?:(?:dtb|mtb|plg)_[a-z0-9_]+(?:\.[a-z0-9_]+)?)"
)
QUOTED_NAME_RE = re.compile(rf"`({NAME_PATTERN})`")
BARE_NAME_RE = re.compile(rf"(?<![0-9A-Za-z_.\-/`])({NAME_PATTERN})(?![0-9A-Za-z_.\-/`])")


def rewrite(text: str, ledger, fid: str, keep: set[str]):
    """1ファイル分を書き換え、(新テキスト, 置換スパン, 置換件数, 未解決) を返す。

    置換は「原文のどの範囲を何に差し替えたか」をスパンとして記録し、
    そのスパンだけを差し替えて新テキストを組み立てる。連鎖 sub をしないので、
    記録したスパン以外は1バイトも動かないことが構造的に保証される。
    """
    replaced: Counter = Counter()
    unresolved: Counter = Counter()

    def logical_for(name: str, as_message: bool) -> str | None:
        entries = ledger.get(name)
        if not entries:
            return None
        logical = pick_logical(entries, fid)
        if logical is None:
            return None
        return message_text(logical) if as_message else logical

    spans: list[tuple[int, int, str]] = []
    taken: list[tuple[int, int]] = []

    def free(start: int, end: int) -> bool:
        return all(end <= s or start >= e for s, e in taken)

    # 1) 「翻訳キー `x`」のように、物理名を指す語ごと言い換える形を先に処理する。
    for m in KEY_PHRASE_RE.finditer(text):
        name = m.group(1)
        if name in keep or not re.fullmatch(NAME_PATTERN, name):
            continue
        logical = logical_for(name, as_message=True)
        if logical is None:
            unresolved[name] += 1
            continue
        spans.append((m.start(), m.end(), f"メッセージ{logical}" if logical.startswith("「") else logical))
        taken.append((m.start(), m.end()))
        replaced[name] += 1

    # 2) 残りの物理名（バッククォート付き→裸の順）。
    for regex in (QUOTED_NAME_RE, BARE_NAME_RE):
        for m in regex.finditer(text):
            name = m.group(1)
            if name in keep or not free(m.start(), m.end()):
                continue
            if HOSTNAME_TAIL_RE.search(name):
                continue
            as_message = not name.startswith(("dtb_", "mtb_", "plg_"))
            logical = logical_for(name, as_message)
            if logical is None:
                unresolved[name] += 1
                continue
            spans.append((m.start(), m.end(), logical))
            taken.append((m.start(), m.end()))
            replaced[name] += 1

    spans.sort()
    out: list[str] = []
    cursor = 0
    for start, end, replacement in spans:
        out.append(text[cursor:start])
        out.append(replacement)
        cursor = end
    out.append(text[cursor:])
    return "".join(out), spans, replaced, unresolved


def gate(original: str, updated: str, spans: list[tuple[int, int, str]]) -> str | None:
    """捏造ゼロゲート: 記録したスパンを原文へ戻すと、原文とバイト一致すること。

    さらに、差し替えた原文がすべて物理名（またはそれを指す語を含む形）であることを
    確認する。これで「置換以外の改変が無い」ことと「物理名以外を消していない」ことが
    同時に担保される。
    """
    rebuilt: list[str] = []
    cursor = 0
    pos = 0
    for start, end, replacement in spans:
        rebuilt.append(updated[pos : pos + (start - cursor)])
        pos += start - cursor
        if updated[pos : pos + len(replacement)] != replacement:
            return f"置換結果が記録と食い違う（原文 {start}-{end}）"
        pos += len(replacement)
        source = original[start:end]
        if not (re.fullmatch(NAME_PATTERN, source) or QUOTED_NAME_RE.fullmatch(source)
                or KEY_PHRASE_RE.fullmatch(source)):
            return f"物理名でない範囲を置換している: {source!r}"
        rebuilt.append(source)
        cursor = end
    rebuilt.append(updated[pos:])
    if "".join(rebuilt) != original:
        return "置換以外の差分がある"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--docs", nargs="*", type=Path, default=[])
    parser.add_argument("--docs-from-html", type=Path, help="埋め込み済みHTMLから対象設計書を集める")
    parser.add_argument("--keep", type=Path, help="置換しない物理名の一覧（1行1件・#でコメント）")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    repo = args.repo.resolve()
    ledger = load_ledger(repo)
    keep: set[str] = set()
    if args.keep and args.keep.exists():
        keep = {
            line.strip()
            for line in args.keep.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.startswith("#")
        }

    docs = list(args.docs)
    if args.docs_from_html:
        html = args.docs_from_html.read_text(encoding="utf-8")
        docs += [Path(p) for p in sorted(set(re.findall(r"functions/[a-z0-9\-]+/[a-z0-9_\-]+\.md", html)))]
    docs = [repo / d if not d.is_absolute() else d for d in docs]
    if not docs:
        print("対象の設計書が無い", file=sys.stderr)
        return 1

    total_replaced: Counter = Counter()
    total_unresolved: Counter = Counter()
    changed = 0
    report_lines = ["file\tphysical_name\tstatus\tcount"]
    for doc in docs:
        original = doc.read_text(encoding="utf-8")
        updated, spans, replaced, unresolved = rewrite(original, ledger, fid_of(doc), keep)
        total_unresolved.update(unresolved)
        for name, count in unresolved.items():
            report_lines.append(f"{doc.relative_to(repo)}\t{name}\t未解決\t{count}")
        if updated == original:
            continue
        failure = gate(original, updated, spans)
        if failure:
            print(f"NG: {doc}: {failure}", file=sys.stderr)
            return 1
        changed += 1
        total_replaced.update(replaced)
        for name, count in replaced.items():
            report_lines.append(f"{doc.relative_to(repo)}\t{name}\t置換\t{count}")
        if not args.dry_run:
            doc.write_text(updated, encoding="utf-8")

    if args.report:
        args.report.write_text("\n".join(report_lines) + "\n", encoding="utf-8")
        print(f"レポート: {args.report}")
    print(f"対象 {len(docs)}本 / 変更 {changed}本{'（dry-run）' if args.dry_run else ''}")
    print(f"置換 延べ{sum(total_replaced.values())}件（{len(total_replaced)}種）")
    if total_unresolved:
        print(f"未解決 延べ{sum(total_unresolved.values())}件（{len(total_unresolved)}種）:")
        for name, count in total_unresolved.most_common(15):
            print(f"  {name} × {count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
