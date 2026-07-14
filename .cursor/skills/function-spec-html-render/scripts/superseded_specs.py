#!/usr/bin/env python3
"""Excel基本設計により廃止された仕様の台帳ローダとバナーレンダラ。

機能設計書Markdown（`functions/**/*.md`）は現行実装からのリバースであり、
Excel基本設計（＝顧客合意済みの刷新後仕様）が「この項目を削除する」と廃止を
宣言していても、現行挙動をそのまま書いてしまう。読み手はそれを「実装すべき仕様」と
誤読する。

そこで記述は消さずに残し、**刷新後は実装不要であることをバナーで明示する**。
台帳 `functions/superseded_specs.json` が機械用の正本で、本モジュールはそれを読んで
バナーHTMLを組み立てる。

このバナーは後段注入ではなく `render_block()` / `render_document()` の**描画の一部**として
出す。integrate は `strip_existing_embeds()` で埋め込みブロックを毎回作り直すため、
ブロック内部への後段注入は integrate を回すたびに消えるからである。描画に組み込めば
冪等性・実行順序・復元の問題が構造的に消える。
"""
from __future__ import annotations

import html
import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[4]  # hareruya-design-docs/
LEDGER = ROOT / "functions" / "superseded_specs.json"
OUTPUT_DIR = ROOT / "excel_to_html" / "output"

# バナーへ描画する verdict。not-superseded（偽陽性）と needs-triage（未判定）は描画しない。
RENDER_VERDICTS = ("deleted", "replaced", "restructured")
ALL_VERDICTS = RENDER_VERDICTS + ("not-superseded", "needs-triage")

VERDICT_LABEL = {
    "deleted": "削除",
    "replaced": "変更",
    "restructured": "画面再編",
}

# Excel由来HTMLからの相対パス（バナーと同じ文書内にあるので接頭辞なし）
HREF_FROM_EXCEL_OUTPUT = ""
# function_spec_html_preview/<repo>/x.html から excel_to_html/output/ への相対パス
HREF_FROM_PREVIEW = "../../excel_to_html/output/"

SUPERSEDED_CSS = """/* superseded-notice:start */
    .superseded-notice {
      margin: 0 0 18px;
      padding: 12px 14px;
      border: 1px solid #d9a1a1;
      border-left: 5px solid #b3413a;
      border-radius: 6px;
      background: #fdf3f2;
      font-size: 13px;
      line-height: 1.7;
    }
    .superseded-badge {
      display: inline-block;
      margin-right: 8px;
      padding: 2px 9px;
      border-radius: 999px;
      background: #b3413a;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .superseded-notice-head {
      margin: 0 0 8px;
    }
    .superseded-notice-list {
      margin: 0;
      padding-left: 1.2em;
    }
    .superseded-notice-list > li {
      margin: 6px 0;
    }
    .superseded-target {
      font-weight: 700;
    }
    .superseded-implied {
      display: block;
      margin-top: 2px;
      color: #6b4a47;
    }
    .superseded-notice a {
      color: #8c322c;
    }
    /* superseded-notice:end */"""


@lru_cache(maxsize=1)
def load_ledger() -> dict:
    if not LEDGER.exists():
        return {"entries": []}
    return json.loads(LEDGER.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def _entries_by_doc() -> dict[str, list[dict]]:
    index: dict[str, list[dict]] = {}
    for entry in load_ledger().get("entries", []):
        for affected in entry.get("affects", []):
            index.setdefault(affected["doc"], []).append(entry)
    return index


def entries_for_doc(doc: str | Path, *, renderable_only: bool = True) -> list[dict]:
    """機能設計書Markdown（リポジトリルートからの相対パス）に効いている廃止エントリ。"""
    key = doc.as_posix() if isinstance(doc, Path) else str(doc)
    entries = _entries_by_doc().get(key, [])
    if renderable_only:
        entries = [e for e in entries if e.get("verdict") in RENDER_VERDICTS]
    return entries


def doc_key(source: Path) -> str:
    """md の絶対パス -> 台帳キー（リポジトリルートからの相対パス）。"""
    return source.resolve().relative_to(ROOT).as_posix()


def md_marker(entry: dict) -> str:
    """機能設計書Markdownに必ず書かせる定型句。verify が台帳⇔md の同期をこれで検査する。

    識別IDがある指示は「Excel基本設計 0214 識別ID:4-3 により廃止」。
    識別IDが無い指示（★注記など）はシート名だけでは同一シート内の複数指示を区別できないため、
    対象名を添えて「Excel基本設計 0303 商品詳細検索「カードセット（検索条件）」により廃止」とする。
    エントリごとに一意でなければならない（`assert_unique_markers()` が保証する）。
    """
    book = entry.get("book", "")
    ident = entry.get("identifierId")
    if ident:
        return f"Excel基本設計 {book} 識別ID:{ident} により廃止"
    sheets = entry.get("sheets") or [{}]
    sheet_name = sheets[0].get("sheetName", "")
    # 鉤括弧のあとに空白を置くと日本語として不自然なので、ここだけ空白を入れない。
    return f"Excel基本設計 {book} {sheet_name}「{entry.get('target', '')}」により廃止"


def assert_unique_markers() -> list[str]:
    """定型句がエントリ間で衝突していないか検査する。衝突すると verify が同期を見分けられない。"""
    seen: dict[str, str] = {}
    errors: list[str] = []
    for entry in load_ledger().get("entries", []):
        marker = md_marker(entry)
        other = seen.get(marker)
        if other:
            errors.append(f"定型句が重複: 「{marker}」 が {other} と {entry.get('id')} で衝突")
        else:
            seen[marker] = entry.get("id", "?")
    return errors


@lru_cache(maxsize=64)
def _book_html(book: str) -> str | None:
    """書番 -> Excel由来HTMLのファイル名（リンク先）。見つからなければ None。"""
    matches = sorted(OUTPUT_DIR.glob(f"{book}_*.html"))
    return matches[0].name if matches else None


def _evidence_link(entry: dict, href_prefix: str) -> str:
    """Excel該当行への根拠リンク。アンカーが無ければリンクだけ、HTMLが無ければ素のテキスト。"""
    book = entry.get("book", "")
    label_parts = [book]
    sheets = entry.get("sheets") or []
    if sheets:
        label_parts.append(sheets[0].get("sheetName", ""))
    if entry.get("identifierId"):
        label_parts.append(f"識別ID:{entry['identifierId']}")
    label = html.escape(" ".join(p for p in label_parts if p), quote=False)

    name = _book_html(book)
    if not name:
        return label
    anchor = sheets[0].get("anchor") if sheets else None
    href = f"{href_prefix}{quote(name)}" + (f"#{anchor}" if anchor else "")
    return f'<a href="{html.escape(href, quote=True)}">{label}</a>'


def _entry_line(entry: dict, href_prefix: str) -> str:
    target = html.escape(entry.get("target", ""), quote=False)
    verdict = entry.get("verdict")
    if verdict == "replaced":
        what = f"は {html.escape(entry.get('replacement', ''), quote=False)} へ変更"
    elif verdict == "restructured":
        replacement = entry.get("replacement")
        what = "は廃止し、" + html.escape(replacement, quote=False) + "へ再編" if replacement else "は廃止"
    else:
        what = "は削除"
    line = (
        f'<li><span class="superseded-target">{target}</span> {what}'
        f"（{_evidence_link(entry, href_prefix)}）"
    )
    implied = entry.get("impliedUnneeded") or []
    if implied:
        items = "／".join(html.escape(i, quote=False) for i in implied)
        line += f'<span class="superseded-implied">これに伴い実装不要: {items}</span>'
    return line + "</li>"


def render_notice(doc: str | Path, href_prefix: str = HREF_FROM_EXCEL_OUTPUT) -> str:
    """機能設計書の冒頭に出す「刷新後は実装不要」バナー。該当が無ければ空文字。"""
    entries = entries_for_doc(doc)
    if not entries:
        return ""
    key = doc.as_posix() if isinstance(doc, Path) else str(doc)
    repo = Path(key).parent.name  # functions/<repo>/xxx.md
    lines = "\n        ".join(_entry_line(e, href_prefix) for e in entries)
    return f"""<div class="superseded-notice">
      <p class="superseded-notice-head"><span class="superseded-badge">刷新後は実装不要</span>本節は現行実装（{html.escape(repo, quote=False)}）からのリバースです。次の記述は Excel基本設計により廃止されており、刷新後に実装する必要はありません。</p>
      <ul class="superseded-notice-list">
        {lines}
      </ul>
    </div>"""


def main() -> int:
    """台帳の中身を確認する（`python3 superseded_specs.py`）。"""
    ledger = load_ledger()
    entries = ledger.get("entries", [])
    print(f"台帳: {LEDGER.relative_to(ROOT)}  entries={len(entries)}")
    counts: dict[str, int] = {}
    for e in entries:
        counts[e.get("verdict", "?")] = counts.get(e.get("verdict", "?"), 0) + 1
    print("  verdict:", ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    docs = _entries_by_doc()
    print(f"  影響する機能設計書: {len(docs)} 件")
    for doc in sorted(docs):
        print(f"    - {doc}")
        for e in docs[doc]:
            print(f"        {md_marker(e)}")
    errors = assert_unique_markers()
    if errors:
        print("\nNG: 定型句の重複", *(f"  - {e}" for e in errors), sep="\n")
        return 1
    print("\nOK: 定型句はエントリごとに一意です")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
