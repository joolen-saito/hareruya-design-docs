#!/usr/bin/env python3
"""Convert function-spec Markdown into a read-only HTML preview.

The converter intentionally preserves source content. It only changes
presentation, including rendering embedded or attached screen-item definitions
as tables.
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import io
import re
import sys
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))
import phase2_specs  # noqa: E402  フェーズ2対応（フェーズ1では実装しない）仕様のバナー
import superseded_specs  # noqa: E402  Excel基本設計により廃止された仕様のバナー


CODE_TOKEN = "\x00CODE{}\x00"
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
TABLE_SEP_RE = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
ORDERED_RE = re.compile(r"^(\s*)(\d+)\.\s+(.*)$")
UNORDERED_RE = re.compile(r"^(\s*)[-*+]\s+(.*)$")
HR_RE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$")
# Block-level raw HTML used in the Markdown source for collapsible sections
# (e.g. the "Excel設計書からの抽出" block). Such lines are passed through
# verbatim so the browser renders a real <details> instead of escaped text.
RAW_HTML_BLOCK_RE = re.compile(
    r"^\s*(</?details>|<summary\b[^>]*>.*?</summary>)\s*$", re.IGNORECASE
)
SCREEN_ITEM_HEADER_TERMS = (
    "識別ID",
    "ラベル",
    "書式・制限",
    "必須",
    "初期値",
    "画面部品の説明",
)

# 詳細設計の5分類（2026-08-13 ユーザー決定）: 機能設計書の節はこの5つだけとする。
# Excel基本設計に無い仕様（処理の順序・分岐、DB副作用、メッセージ文言、エラー時の挙動）は
# 現行ソースからしか決まらないため、そこに記述を集中させる。
# 判定は**節レベルの見出しだけ**に掛ける（配下の小見出しは親の扱いに従う）。
# 3分類（2026-08-19 ユーザー決定・0203 の出力を正とする）。
# 旧5分類のうち「処理フロー」「エラー処理」はHTML設計書へ出力しない。0203 の現行仕様が
# 業務ロジックと入出力だけで構成されており、そこへ揃える決定。SECTION_ALIASES が
# これらへ寄せていた旧節も同じく非出力になる。Markdown正本は変更しない（表示だけの措置）。
ALLOWED_SECTION_TITLES = (
    "入出力",
    "業務ロジック",
    "表示メッセージ",
)
# 旧5分類の名残。写像先としては受け付けるが本文へは出さない。
RETIRED_SECTION_TITLES = (
    "処理フロー",
    "エラー処理",
)
# 5分類のうち「表示メッセージ」だけは現行仕様ではなくリニューアル後の仕様（2026-08-19
# ユーザー決定）。Markdown正本には現行仕様／リニューアル後の区別を書かせず、HTML描画の
# ときだけ本文の末尾へ回し、境目に RENEWAL_SECTION_LABEL の見出しを出す。
RENEWAL_SECTION_TITLES = ("表示メッセージ",)
RENEWAL_SECTION_LABEL = "リニューアル後の仕様"
# 旧節 → 5分類の写像。Markdown正本の節統合（sync_markdown_exclusions.py map）と
# HTML側の許可判定が同じ定義を使う。ここに無い節は本文から外し、退避先へ移す。
SECTION_ALIASES = {
    # 処理フロー: 入口（URL・HTTPメソッド・導線）、判定順序、画面の動的挙動
    "利用者視点の入口": "処理フロー",
    "利用者視点の入口（エンドポイント）": "処理フロー",
    "フロント挙動": "処理フロー",
    "ページネーション": "処理フロー",
    # 入出力: 入力・出力・DB副作用・外部連携・実行結果・記録
    "副作用": "入出力",
    "出力列とデータの対応": "入出力",
    "API/バッチ結果": "入出力",
    "API・バッチ結果": "入出力",
    "API／バッチ結果": "入出力",
    "API／バッチ": "入出力",
    "ログ・監査": "入出力",
    "通知": "入出力",
    "出力ファイル": "入出力",
    # 業務ロジック: 業務ルール・計算・整合性・機能固有の認証/権限ロジック
    "業務ルール・計算": "業務ロジック",
    "データ整合性": "業務ロジック",
    "集計・判定・計算": "業務ロジック",
    "認証・認可": "業務ロジック",
    # 表示メッセージ
    "フラッシュメッセージ": "表示メッセージ",
    "出力: 表示メッセージ": "表示メッセージ",
    # エラー処理
    "エッジケース": "エラー処理",
}
# 「…時の判定順序」のような可変見出しは処理フローへ寄せる。
SECTION_ALIAS_PATTERNS = ((re.compile(r"判定順序"), "処理フロー"),)
# 節レベル。機能設計書はH1がタイトル、H2が節、H3以下が節内の小見出し。
SECTION_HEADING_LEVEL = 2
# 共通仕様（[[common-spec]]）へ集約済みで、共通内容と一致する機能では本文から外す節。
# 機能固有の内容を持つ機能（common_spec の例外）では「業務ロジック」へ寄せて残す。
COMMON_SPEC_SECTION_TITLES = (
    "権限・認可",
    "セッション",
    "Cookie",
    "排他制御・トランザクション",
    "試行制限",
    "ログに出してはいけないもの",
)
# 共通仕様・粒度規約で「機能設計書に書かない」と決めた定型節。**見出しレベルを問わず**
# 本文ごと非出力にする（2026-08-19 ユーザー決定。0203 の記述方法を正とする）。
# 旧世代のMarkdownはこれらをH3/H4の小見出しとして持ち、H2限定の判定をすり抜けていた。
# 内容は [[common-spec]] 側にあり、ログ出力・セッション/Cookie は
# reverse-design/GRANULARITY.md 3.7 / 3.7b で「設計書に書かない」と決まっている。
# 除外はHTML表示だけの措置で、Markdown正本は一切変更しない。
BOILERPLATE_SUBSECTION_TITLES = (
    "ログ・監査",
    "ログに出してはいけないもの",
    "権限・認可",
    "セッション",
    "本機能におけるセッション",
    "セッションへ保存しない情報",
    "Cookie",
    "排他制御・トランザクション",
    "試行制限",
)

# Excel基本設計仕様書が正の節と、仕様ではない補助節。5分類へ写像せず本文から外す
# （退避先へ移すので内容は失われない）。
ARCHIVED_SECTION_TITLES = (
    "概要",
    "リニューアル移行時の扱い",
    "集計条件",
    "DBカラム",
    "バリデーション",
    "調査補助",
    "画面遷移",
    "文書情報",
    "改訂履歴",
    "機能の目的と役割",
    "本書で扱うこと",
    "本書で扱わないこと",
    "用語",
    "参考",
    "TODO",
    "実装要確認",
)
# 区分限定の扱いは5分類化で不要になった（旧「API/バッチ結果」「フロント挙動」は
# SECTION_ALIASES で 入出力／処理フロー へ寄せる）。区分そのものは表の列除外と
# レポートで使い続けるため、判定関数は残す。
SCREEN_KINDS = ("admin", "front")
# 管理画面のみ、表から落とす列（2026-08-12 ユーザー決定）。「表示メッセージ」節の
# メッセージ一覧表にある英語文言の列で、管理画面の設計書では不要。フロント・APIの
# 設計書では残す。列見出しの正規化一致で判定し、行側のセルも同じ位置で落とす。
ADMIN_ONLY_EXCLUDED_TABLE_COLUMNS = ("画面上の文言(英語)",)
# カスタマイズ区分（todo-list.md の「カスタマイズ区分」列）で出力可否が変わる節
# （2026-08-12 ユーザー決定）。ここに載る節は、値が許可リストに入っている機能でだけ
# 出力し、それ以外の区分では落とす。区分が引けない機能は落とさない（安全側）。
CUSTOMIZATION_SCOPED_SECTIONS = {
    "ログ・監査": ("現行踏襲", "カスタマイズ"),
}
# 共通仕様（[[common-spec]]）へ集約した節。共通内容と一致すると判定された機能だけ、
# その節をHTMLから落とす（機能固有の内容を持つ例外機能では残す）。判定結果の台帳は
# common_spec/common_spec_data.json で、生成は build_common_spec.py が行う。
COMMON_SPEC_DATA = Path(__file__).resolve().parents[4] / "common_spec" / "common_spec_data.json"
_COMMON_SPEC_MEMBERS: dict[str, set[str]] | None = None
TODO_LIST = Path(__file__).resolve().parents[4] / "functions" / "todo-list.md"
TODO_MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")
_CUSTOMIZATION_BY_DOC: dict[str, str] | None = None
# 機能区分の判定材料。todo-list.md の区分が最優先で、無い場合はファイル名の種別
# （`m04-01_admin_...` / `f06-05_front_...` / `a06-14_api_...` / `b01-02_batch_...`、
# 機能No接頭辞を持たない `admin_...` 形式も可）、それも読めない場合は機能Noの接頭辞を使う。
# どれでも判定できなければ None＝区分不明として、区分限定の除外は適用しない（安全側）。
DIVISION_KINDS = {
    "管理画面": "admin",
    "フロント": "front",
    "API": "api",
    "バッチ": "batch",
    "その他": "other",
}
FILE_KINDS = {"admin", "front", "api", "batch", "other"}
FEATURE_PREFIX_KINDS = {"M": "admin", "F": "front", "A": "api", "B": "batch", "O": "other"}
FUNCTION_FILE_RE = re.compile(r"^([a-zA-Z])\d{2}-\d{2}[a-zA-Z]?_([a-z]+)_")
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
HEADING_NUMBER_RE = re.compile(r"^\d+(?:[.\-]\d+)*[.、．)）]?\s*")
HEADING_SUBTITLE_RE = re.compile(r"[（(][^）)]*[）)]\s*$")
HEADING_SEPARATOR_RE = re.compile(r"[／・]")


CSS = """
:root {
  --bg: #ffffff;
  --panel: #fffdf8;
  --text: #2b2a26;
  --muted: #7a756a;
  --line: #d6cdbd;
  --line-soft: #ebe2d3;
  --band: #f3ede1;
  --clay: #c25a37;
  --clay-soft: #f4e6dd;
  --olive: #5f7048;
  --olive-soft: #e9ecdf;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", Meiryo, sans-serif;
  font-size: 14px;
  line-height: 1.7;
}
.page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 32px;
  max-width: 1480px;
  margin: 0 auto;
  padding: 28px 28px 64px;
}
.sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 12px;
  border-right: 1px solid var(--line-soft);
}
.sidebar-title {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.toc a {
  display: block;
  padding: 4px 0 4px 12px;
  border-left: 2px solid var(--line-soft);
  color: var(--muted);
  text-decoration: none;
}
.toc a:hover { color: var(--clay); border-left-color: var(--clay); }
.toc .lv3 { padding-left: 24px; font-size: 13px; }
.doc-content { min-width: 0; }
header.page-header {
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.crumb {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
}
h1 { margin: 0; font-size: 28px; line-height: 1.3; }
h2 {
  margin: 34px 0 12px;
  padding-bottom: 7px;
  border-bottom: 2px solid var(--clay);
  font-size: 21px;
}
h3 { margin: 26px 0 10px; font-size: 17px; color: var(--olive); }
h4 { margin: 20px 0 8px; font-size: 15px; color: var(--muted); }
.renewal-spec-banner {
  margin: 40px 0 0;
  padding-top: 18px;
  border-top: 2px solid var(--clay);
}
.renewal-spec-banner h3 {
  margin: 0;
  color: var(--clay);
  font-size: 20px;
}
p { margin: 9px 0; }
a { color: var(--clay); }
code {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--band);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 90%;
}
pre {
  overflow-x: auto;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
pre code { padding: 0; background: transparent; }
hr { margin: 26px 0; border: 0; border-top: 1px solid var(--line); }
ul, ol { margin: 9px 0; padding-left: 26px; }
li { margin: 3px 0; }
.table-wrap {
  overflow-x: auto;
  margin: 14px 0 22px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 13px;
}
th, td {
  border: 1px solid var(--line-soft);
  padding: 7px 9px;
  text-align: left;
  vertical-align: top;
}
th {
  position: sticky;
  top: 0;
  background: var(--band);
  font-weight: 700;
  white-space: nowrap;
}
tbody tr:nth-child(even) { background: #fffaf0; }
.screen-item-table table { min-width: 1120px; }
.section-row td {
  background: var(--olive-soft);
  color: var(--olive);
  font-weight: 700;
}
.tabbed-note {
  white-space: pre-wrap;
  overflow-x: auto;
  padding: 10px 12px;
  border-left: 3px solid var(--olive);
  background: var(--panel);
}
details {
  margin: 34px 0 12px;
}
details > summary {
  cursor: pointer;
  padding-bottom: 7px;
  border-bottom: 2px solid var(--clay);
  font-size: 21px;
  font-weight: 700;
  list-style: revert;
}
details[open] > summary { margin-bottom: 12px; }
footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 900px) {
  .page { display: block; padding: 20px 16px 48px; }
  .sidebar {
    position: static;
    max-height: none;
    margin-bottom: 24px;
    padding-right: 0;
    border-right: 0;
    border-bottom: 1px solid var(--line-soft);
    padding-bottom: 16px;
  }
  h1 { font-size: 23px; }
}
""".strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--screen-source",
        action="append",
        default=[],
        type=Path,
        help=(
            "Optional screen-item definition Markdown to integrate into the "
            "same HTML. Repeat to attach multiple files."
        ),
    )
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not validate_markdown_path(source, "source"):
        return 1

    screen_sources = [path.resolve() for path in args.screen_source]
    for screen_source in screen_sources:
        if not validate_markdown_path(screen_source, "screen-source"):
            return 1

    markdown = build_combined_markdown(source, screen_sources)
    document = render_document(markdown, source, screen_sources)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(document, encoding="utf-8")
    print(f"created: {output}")
    return 0


def validate_markdown_path(path: Path, label: str) -> bool:
    if not path.exists():
        print(f"ERROR: {label} not found: {path}", file=sys.stderr)
        return False
    if path.suffix.lower() != ".md":
        print(f"ERROR: {label} must be Markdown: {path}", file=sys.stderr)
        return False
    return True


def build_combined_markdown(source: Path, screen_sources: list[Path]) -> str:
    markdown = source.read_text(encoding="utf-8")
    if not screen_sources:
        return markdown

    additions = []
    for screen_source in screen_sources:
        screen_text = screen_source.read_text(encoding="utf-8")
        screen_title, screen_body = split_markdown_title(screen_text, screen_source.stem)
        additions.append(
            "\n".join(
                [
                    "---",
                    "",
                    f"## 画面項目定義: {screen_title}",
                    "",
                    f"_Source: `{screen_source}`_",
                    "",
                    screen_body.strip(),
                ]
            )
        )
    return markdown.rstrip() + "\n\n" + "\n\n".join(additions) + "\n"


def split_markdown_title(markdown: str, fallback: str) -> tuple[str, str]:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = fallback
    for index, line in enumerate(lines):
        if not line.strip():
            continue
        match = re.match(r"^#\s+(.*?)\s*#*\s*$", line)
        if match:
            title = match.group(1).strip()
            del lines[index]
        break
    return title, "\n".join(lines)


def extract_title_and_body(markdown: str, fallback: str) -> tuple[str, str]:
    body_lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = fallback
    for index, line in enumerate(body_lines):
        if not line.strip():
            continue
        match = re.match(r"^#\s+(.*?)\s*#*\s*$", line)
        if match:
            title = match.group(1).strip()
            del body_lines[index]
        break
    return title, "\n".join(body_lines)


def render_document(markdown: str, source: Path, screen_sources: list[Path] | None = None) -> str:
    screen_sources = screen_sources or []
    title, body_markdown = extract_title_and_body(markdown, source.stem)

    headings: list[tuple[int, str, str]] = []
    renewal_only = is_renewal_only_document(source=source)
    body_html = markdown_to_html(
        body_markdown,
        headings,
        kind=function_kind(source),
        customization=customization_kind(source),
        common_titles=common_spec_titles(source),
        renewal_only=renewal_only,
    )
    if renewal_only:
        # 新規実装の機能は文書全体がリニューアル後の仕様。単体プレビューでも冒頭で明示する。
        body_html = (
            f'<div class="renewal-spec-banner"><h3>{html.escape(RENEWAL_SECTION_LABEL, quote=False)}</h3></div>\n'
            + body_html
        )
    toc = render_toc(headings)
    source_paths = [source] + screen_sources
    source_label = "<br>".join(html.escape(str(path), quote=False) for path in source_paths)
    title_html = render_inline(title)
    html_title = html.escape(f"{title} - 機能仕様書", quote=False)
    superseded = render_superseded_notice(source)

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_title}</title>
  <style>
{CSS}
    {superseded_specs.SUPERSEDED_CSS}
    {phase2_specs.PHASE2_CSS}
  </style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <p class="sidebar-title">On this page</p>
      {toc}
    </aside>
    <main class="doc-content">
      <header class="page-header">
        <p class="crumb">Source:<br>{source_label}</p>
        <h1>{title_html}</h1>
      </header>
      {superseded}
      {body_html}
      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
    </main>
  </div>
</body>
</html>
"""


def render_superseded_notice(source: Path, href_prefix: str = superseded_specs.HREF_FROM_PREVIEW) -> str:
    """実装不要であることを示すバナー（フェーズ2対応、およびExcel基本設計による廃止）。

    既定の href_prefix は単体プレビュー（`function_spec_html_preview/<repo>/x.html`）用。
    excel_to_html/output へ直接書き出す文書（orphan group）は空文字を渡す。
    台帳外の md では空文字を返すので、呼び出し側で分岐する必要はない。
    """
    try:
        key = superseded_specs.doc_key(source)
    except ValueError:
        return ""  # リポジトリ外の md（テスト等）は対象外
    return "\n      ".join(
        n for n in (
            phase2_specs.render_notice(key, href_prefix),
            superseded_specs.render_notice(key, href_prefix),
        ) if n
    )


def render_toc(headings: Iterable[tuple[int, str, str]]) -> str:
    links = []
    for level, text, slug in headings:
        cls = f"lv{level}"
        links.append(
            f'<a class="{cls}" href="#{html.escape(slug, quote=True)}">'
            f"{html.escape(text, quote=False)}</a>"
        )
    return '<nav class="toc">' + "\n".join(links) + "</nav>" if links else ""


def normalize_heading_title(text: str) -> str:
    """Reduce a heading to a comparable title (numbering / decoration / subtitle removed)."""
    title = re.sub(r"[`*_]", "", text).strip()
    title = HEADING_NUMBER_RE.sub("", title)
    title = HEADING_SUBTITLE_RE.sub("", title)  # 「利用者視点の入口（エンドポイント）」の副題
    title = title.replace(" ", "").replace("　", "").strip()
    # 「API/バッチ結果」「API・バッチ結果」「API／バッチ結果」を同一視する。
    title = HEADING_SEPARATOR_RE.sub("/", title)
    return title.replace("入り口", "入口")


def function_kind(
    source: Path | str | None = None,
    division: str | None = None,
    feature_no: str | None = None,
) -> str | None:
    """Return the function's 区分 as 'admin'/'front'/'api'/'batch'/'other', or None.

    Decided from todo-list.md の区分 → ファイル名の種別 → 機能No接頭辞 の順。判定材料が
    無い・読めない場合は None を返し、呼び出し側は区分限定の除外を適用しない。
    """
    if division:
        kind = DIVISION_KINDS.get(division.strip())
        if kind:
            return kind
    if source is not None:
        stem = Path(source).name
        match = FUNCTION_FILE_RE.match(stem)
        if match:
            if match.group(2) in FILE_KINDS:
                return match.group(2)
            feature_no = feature_no or match.group(1)
        else:
            # 機能No接頭辞を持たない設計書（例: `admin_customer_point.md`）は先頭の種別トークン。
            token = stem.split("_", 1)[0].lower()
            if token in FILE_KINDS:
                return token
    if feature_no:
        return FEATURE_PREFIX_KINDS.get(feature_no.strip()[:1].upper())
    return None


def is_screen_function(
    source: Path | str | None = None,
    division: str | None = None,
    feature_no: str | None = None,
) -> bool:
    """True for 管理画面／フロント（画面系）機能の設計書."""
    return function_kind(source, division, feature_no) in SCREEN_KINDS


def customization_by_doc() -> dict[str, str]:
    """Map `<区分ディレクトリ>/<ファイル名>.md` -> カスタマイズ区分 from todo-list.md."""
    global _CUSTOMIZATION_BY_DOC
    if _CUSTOMIZATION_BY_DOC is None:
        mapping: dict[str, str] = {}
        if TODO_LIST.exists():
            for line in TODO_LIST.read_text(encoding="utf-8").split("\n"):
                if not line.startswith("|"):
                    continue
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cells) < 8:
                    continue
                link = TODO_MD_LINK_RE.search(cells[7])
                if not link:
                    continue
                mapping[link.group(1).strip()] = cells[5]
        _CUSTOMIZATION_BY_DOC = mapping
    return _CUSTOMIZATION_BY_DOC


def customization_kind(
    source: Path | str | None = None, customization: str | None = None
) -> str | None:
    """Return the doc's カスタマイズ区分（標準／現行踏襲／カスタマイズ／新規実装）or None.

    渡された値が最優先。無ければ todo-list.md の `[md](…)` リンクで引く。台帳に無い・
    空欄の文書は None（＝カスタマイズ区分による除外を適用しない安全側）。
    """
    if customization and customization.strip():
        return customization.strip()
    if source is None:
        return None
    path = Path(source)
    key = "/".join(path.parts[-2:]) if len(path.parts) >= 2 else path.name
    value = customization_by_doc().get(key) or customization_by_doc().get(path.name)
    return value.strip() if value and value.strip() else None


def common_spec_members() -> dict[str, set[str]]:
    """Map `<区分>/<ファイル名>.md` -> 共通仕様へ集約済みの節名の集合."""
    global _COMMON_SPEC_MEMBERS
    if _COMMON_SPEC_MEMBERS is None:
        members: dict[str, set[str]] = {}
        if COMMON_SPEC_DATA.exists():
            data = json.loads(COMMON_SPEC_DATA.read_text(encoding="utf-8"))
            for title, section in data.items():
                for doc in section.get("members", []):
                    key = "/".join(Path(doc).parts[-2:])
                    members.setdefault(key, set()).add(title)
        _COMMON_SPEC_MEMBERS = members
    return _COMMON_SPEC_MEMBERS


def common_spec_titles(source: Path | str | None) -> tuple[str, ...]:
    """共通仕様へ集約済みで、この文書からは落としてよい節名."""
    if source is None:
        return ()
    path = Path(source)
    key = "/".join(path.parts[-2:]) if len(path.parts) >= 2 else path.name
    return tuple(sorted(common_spec_members().get(key, ())))


def canonical_section_title(text: str, common_titles: tuple[str, ...] = ()) -> str | None:
    """節見出しを5分類のどれへ寄せるかを返す。寄せ先が無ければ None（本文から外す）。

    共通仕様へ集約済みの節は、その文書が共通内容と一致すると判定されている場合だけ
    None（＝退避）にし、機能固有の内容を持つ例外機能では「業務ロジック」へ寄せて残す。
    """
    title = normalize_heading_title(text)
    retired = {normalize_heading_title(t) for t in RETIRED_SECTION_TITLES}
    if title in retired:
        return None
    allowed = {normalize_heading_title(t): t for t in ALLOWED_SECTION_TITLES}
    if title in allowed:
        return allowed[title]
    aliases = {normalize_heading_title(k): v for k, v in SECTION_ALIASES.items()}
    if title in aliases:
        target = aliases[title]
        return None if target in RETIRED_SECTION_TITLES else target
    archived = {normalize_heading_title(t) for t in ARCHIVED_SECTION_TITLES}
    if title in archived:
        return None
    common = {normalize_heading_title(t) for t in COMMON_SPEC_SECTION_TITLES}
    if title in common:
        aggregated = {normalize_heading_title(t) for t in common_titles}
        return None if title in aggregated else "業務ロジック"
    for pattern, target in SECTION_ALIAS_PATTERNS:
        if pattern.search(title):
            return None if target in RETIRED_SECTION_TITLES else target
    return None


def is_allowed_section_heading(text: str, common_titles: tuple[str, ...] = ()) -> bool:
    """その節見出しをHTMLへ出すか（＝5分類のどれかに属するか）。"""
    return canonical_section_title(text, common_titles) is not None


def is_boilerplate_subsection(text: str) -> bool:
    """階層を問わず非出力にする定型小見出しか（BOILERPLATE_SUBSECTION_TITLES）。"""
    title = normalize_heading_title(text)
    return title in {normalize_heading_title(t) for t in BOILERPLATE_SUBSECTION_TITLES}


def excluded_section_titles(
    kind: str | None = None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
) -> tuple[str, ...]:
    """後方互換: 5分類化で「許可リスト以外は全部除外」になったため、許可集合を返す側を使う。

    旧APIを参照している呼び出し元のために、共通仕様へ集約済みで退避対象になる節名だけを
    返す（列除外・レポート用途）。節の取捨は `canonical_section_title()` が唯一の判定。
    """
    return tuple(t for t in COMMON_SPEC_SECTION_TITLES if t in common_titles)


def is_excluded_section_heading(
    text: str,
    kind: str | None = None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
    level: int | None = None,
) -> bool:
    """節レベルの見出しが5分類の外なら True（＝HTMLに出ていてはいけない）。

    小見出し（`###` 以下）は親の節に属するので判定しない。`level` を渡さない
    呼び出しでは節レベルとみなす（従来の呼び出し互換）。
    """
    if level is not None and level != SECTION_HEADING_LEVEL:
        return False
    return not is_allowed_section_heading(text, common_titles)


def excluded_table_columns(kind: str | None = None) -> tuple[str, ...]:
    """Table column headers excluded for a function of this 区分."""
    return ADMIN_ONLY_EXCLUDED_TABLE_COLUMNS if kind == "admin" else ()


def normalize_column_title(text: str) -> str:
    """Normalize a table header for comparison.

    見出し用の `normalize_heading_title()` と違い、末尾の括弧は落とさない。列名は
    「画面上の文言(英語)」と「画面上の文言」が別物なので、括弧を落とすと日本語列まで
    巻き添えになる。全角括弧は半角に寄せて表記ゆれだけ吸収する。
    """
    title = re.sub(r"[`*_]", "", text).strip()
    title = title.replace(" ", "").replace("　", "")
    return title.replace("（", "(").replace("）", ")")


def is_excluded_table_column(header: str, kind: str | None = None) -> bool:
    return normalize_column_title(header) in excluded_table_columns(kind)


def drop_excluded_columns(
    header: list[str], rows: list[list[str]], kind: str | None = None
) -> tuple[list[str], list[list[str]]]:
    """Remove excluded columns from a parsed Markdown table (header + rows).

    列の対応はヘッダの位置で決まる。行のセル数がヘッダと違う（区切りが崩れている）
    表は列位置を信用できないので、何も落とさずそのまま返す。
    """
    if not excluded_table_columns(kind):
        return header, rows
    drop = {i for i, cell in enumerate(header) if is_excluded_table_column(cell, kind)}
    if not drop or len(drop) == len(header):
        return header, rows
    if any(len(row) != len(header) for row in rows):
        return header, rows
    keep = [i for i in range(len(header)) if i not in drop]
    return [header[i] for i in keep], [[row[i] for i in keep] for row in rows]


def strip_excluded_sections(
    md_text: str,
    kind: str | None = None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
) -> str:
    """5分類の外にある節を、見出しごと落とす。

    5分類の判定は節レベル（H2）の見出しだけに掛ける。小見出しは親の節に従うので、
    「処理フロー」配下の `### 通常一覧を表示する（…）` などは落ちない。
    例外は BOILERPLATE_SUBSECTION_TITLES で、これは**見出しレベルを問わず**本文ごと落とす。
    許可・写像・退避の唯一の判定は `canonical_section_title()`。

    Fenced code blocks are tracked so a `#` comment inside a fence is never
    mistaken for a heading, and a fence opened inside an excluded section does
    not leak the fence state into the kept text.
    """
    lines = md_text.split("\n")
    kept: list[str] = []
    fence: str | None = None
    skip_level = 0
    for line in lines:
        fence_match = FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            if fence is None:
                fence = marker
            elif fence == marker:
                fence = None
        elif fence is None:
            heading = HEADING_RE.match(line)
            if heading:
                level = len(heading.group(1))
                if skip_level and level <= skip_level:
                    skip_level = 0
                if (
                    not skip_level
                    and level == SECTION_HEADING_LEVEL
                    and not is_allowed_section_heading(heading.group(2), common_titles)
                ):
                    skip_level = level
                    continue
                # 定型小見出しは階層を問わず本文ごと落とす（H2限定の判定では
                # 旧世代Markdownの ### ログ・監査 / ### 権限・認可 等が素通りする）。
                if not skip_level and is_boilerplate_subsection(heading.group(2)):
                    skip_level = level
                    continue
        if skip_level:
            continue
        kept.append(line)
    return "\n".join(kept)


def markdown_to_html(
    md_text: str,
    headings: list[tuple[int, str, str]],
    slug_prefix: str = "",
    kind: str | None = None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
    renewal_only: bool = False,
) -> str:
    # 出力除外規約: 除外節はHTML化の入口で落とす。ここが単一の関門なので、
    # 単体プレビュー・Excel HTMLへの埋め込み・orphanグループの全経路に効く。
    # kind（機能区分）で画面系限定・管理画面限定の除外も合わせて適用する。
    cleaned = strip_excluded_sections(md_text, kind, customization, common_titles)
    # リニューアル後の仕様として出すのは「表示メッセージ」だけ（2026-08-19 ユーザー決定。
    # 0203 の出力を正とする）。新規実装＝文書全体がリニューアル後の仕様の機能でも、
    # 表示メッセージ以外の節はHTML設計書へ出さない。表示メッセージが無ければ何も出さない。
    if renewal_only:
        _, renewal_only_md = split_renewal_sections(cleaned, common_titles)
        if not renewal_only_md.strip():
            return ""
        return "\n".join(
            render_markdown_blocks(renewal_only_md, headings, set(), slug_prefix, kind)
        )
    # 表示メッセージだけはリニューアル後の仕様なので、末尾へ回して見出しで括る。
    current_md, renewal_md = split_renewal_sections(cleaned, common_titles)
    used_slugs: set[str] = set()
    out = render_markdown_blocks(current_md, headings, used_slugs, slug_prefix, kind)
    if renewal_md.strip():
        out.append(render_renewal_heading(headings, used_slugs, slug_prefix))
        out.extend(render_markdown_blocks(renewal_md, headings, used_slugs, slug_prefix, kind))
    return "\n".join(out)


def split_renewal_sections(
    md_text: str, common_titles: tuple[str, ...] = ()
) -> tuple[str, str]:
    """節を「現行仕様」と「リニューアル後の仕様」に分ける。

    判定は節レベル（H2）の見出しだけに掛け、寄せ先（`canonical_section_title()`）が
    `RENEWAL_SECTION_TITLES` に入る節だけを後者へ回す。節の中身と並びは変えない。
    """
    current: list[str] = []
    renewal: list[str] = []
    target = current
    fence: str | None = None
    for line in md_text.split("\n"):
        fence_match = FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            if fence is None:
                fence = marker
            elif fence == marker:
                fence = None
        elif fence is None:
            heading = HEADING_RE.match(line)
            if heading:
                level = len(heading.group(1))
                if level < SECTION_HEADING_LEVEL:
                    target = current
                elif level == SECTION_HEADING_LEVEL:
                    canonical = canonical_section_title(heading.group(2), common_titles)
                    target = renewal if canonical in RENEWAL_SECTION_TITLES else current
        target.append(line)
    return "\n".join(current), "\n".join(renewal)


# 新規実装の機能は現行ソースに実装が無い。設計書の正本は Excel基本設計であり、
# 内容は現行仕様ではなくリニューアル後の仕様である（2026-08-19 ユーザー指摘）。
RENEWAL_ONLY_CUSTOMIZATIONS = ("新規実装",)


def is_renewal_only_document(
    source: Path | str | None = None, customization: str | None = None
) -> bool:
    """文書全体がリニューアル後の仕様か（＝新規実装の機能か）。"""
    value = customization_kind(source=source, customization=customization)
    return bool(value) and value in RENEWAL_ONLY_CUSTOMIZATIONS


def has_current_spec_sections(
    md_text: str,
    kind: str | None = None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
) -> bool:
    """除外後に「現行仕様」側の節が残るか。表示メッセージしか無い文書は False。"""
    cleaned = strip_excluded_sections(md_text, kind, customization, common_titles)
    current, _ = split_renewal_sections(cleaned, common_titles)
    return bool(current.strip())


def render_renewal_heading(
    headings: list[tuple[int, str, str]],
    used_slugs: set[str],
    slug_prefix: str = "",
) -> str:
    """現行仕様とリニューアル後の仕様の境目。Markdown正本ではなくここで作る見出し。"""
    slug = slugify(RENEWAL_SECTION_LABEL, used_slugs)
    if slug_prefix:
        slug = f"{slug_prefix}{slug}"
    headings.append((SECTION_HEADING_LEVEL, RENEWAL_SECTION_LABEL, slug))
    label = html.escape(RENEWAL_SECTION_LABEL, quote=False)
    return (
        '<div class="renewal-spec-banner">'
        f'<h3 id="{html.escape(slug, quote=True)}">{label}</h3>'
        "</div>"
    )


def render_markdown_blocks(
    md_text: str,
    headings: list[tuple[int, str, str]],
    used_slugs: set[str],
    slug_prefix: str = "",
    kind: str | None = None,
) -> list[str]:
    lines = md_text.split("\n")
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if re.match(r"^\s*```", line):
            block, i = parse_code_block(lines, i)
            out.append(block)
            continue

        if line.strip() == "":
            i += 1
            continue

        if is_screen_item_header(lines, i):
            block, i = parse_screen_item_table(lines, i)
            out.append(block)
            continue

        if HR_RE.match(line) and not line.strip().startswith("|"):
            out.append("<hr>")
            i += 1
            continue

        match = HEADING_RE.match(line)
        if match:
            level = len(match.group(1))
            raw_text = match.group(2).strip()
            slug = slugify(raw_text, used_slugs)
            if slug_prefix:
                slug = f"{slug_prefix}{slug}"
            if 2 <= level <= 3:
                headings.append((level, raw_text, slug))
            out.append(f'<h{level} id="{html.escape(slug, quote=True)}">{render_inline(raw_text)}</h{level}>')
            i += 1
            continue

        if "|" in line and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1]):
            block, i = parse_markdown_table(lines, i, kind)
            out.append(block)
            continue

        if UNORDERED_RE.match(line) or ORDERED_RE.match(line):
            block, i = parse_list(lines, i)
            out.append(block)
            continue

        if "\t" in line and not is_screen_item_header(lines, i):
            block, i = parse_tabbed_note(lines, i)
            out.append(block)
            continue

        if RAW_HTML_BLOCK_RE.match(line):
            out.append(line.strip())
            i += 1
            continue

        paragraph = [line]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if is_special_start(lines, i):
                break
            paragraph.append(nxt)
            i += 1
        text = " ".join(part.strip() for part in paragraph)
        out.append(f"<p>{render_inline(text)}</p>")

    return out


def is_special_start(lines: list[str], i: int) -> bool:
    line = lines[i]
    if line.strip() == "":
        return True
    if re.match(r"^\s*```", line) or HEADING_RE.match(line):
        return True
    if is_screen_item_header(lines, i):
        return True
    if UNORDERED_RE.match(line) or ORDERED_RE.match(line):
        return True
    if HR_RE.match(line) and not line.strip().startswith("|"):
        return True
    if RAW_HTML_BLOCK_RE.match(line):
        return True
    return "|" in line and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1])


def parse_code_block(lines: list[str], i: int) -> tuple[str, int]:
    lang = lines[i].strip()[3:].strip().lower()
    i += 1
    buf = []
    while i < len(lines) and not re.match(r"^\s*```\s*$", lines[i]):
        buf.append(lines[i])
        i += 1
    if i < len(lines):
        i += 1
    if lang in {"csv", "tsv"}:
        delimiter = "\t" if lang == "tsv" else ","
        return render_delimited_table("\n".join(buf), delimiter), i
    code = html.escape("\n".join(buf), quote=False)
    lang_attr = f' class="language-{html.escape(lang, quote=True)}"' if lang else ""
    return f"<pre><code{lang_attr}>{code}</code></pre>", i


def parse_markdown_table(
    lines: list[str], i: int, kind: str | None = None
) -> tuple[str, int]:
    header = split_md_row(lines[i])
    i += 2
    rows = []
    while i < len(lines) and "|" in lines[i] and lines[i].strip():
        rows.append(split_md_row(lines[i]))
        i += 1
    # 出力除外規約（区分限定の列）: 管理画面の「画面上の文言(英語)」など。
    header, rows = drop_excluded_columns(header, rows, kind)
    return render_table(header, rows), i


def parse_list(lines: list[str], i: int) -> tuple[str, int]:
    ordered = bool(ORDERED_RE.match(lines[i]))
    tag = "ol" if ordered else "ul"
    items = []
    while i < len(lines):
        match = ORDERED_RE.match(lines[i]) if ordered else UNORDERED_RE.match(lines[i])
        if not match:
            break
        content = match.group(3) if ordered else match.group(2)
        items.append(f"<li>{render_inline(content)}</li>")
        i += 1
    return f"<{tag}>{''.join(items)}</{tag}>", i


def parse_tabbed_note(lines: list[str], i: int) -> tuple[str, int]:
    buf = []
    while i < len(lines) and lines[i].strip() and "\t" in lines[i] and not is_screen_item_header(lines, i):
        buf.append(lines[i].rstrip())
        i += 1
    text = html.escape("\n".join(buf), quote=False)
    return f'<pre class="tabbed-note">{text}</pre>', i


def parse_screen_item_table(lines: list[str], i: int) -> tuple[str, int]:
    start = i
    buf = []
    quote_open = False
    while i < len(lines):
        current = lines[i]
        if i > start and not quote_open and "\t" not in current:
            break
        buf.append(current)
        quote_open = quote_open ^ has_odd_unescaped_quotes(current)
        i += 1

    rows = list(csv.reader(io.StringIO("\n".join(buf)), delimiter="\t"))
    rows = [[cell.strip() for cell in row] for row in rows]
    if not rows:
        return "", i

    header_indices = [idx for idx, value in enumerate(rows[0]) if value.strip()]
    header = [rows[0][idx].strip() for idx in header_indices]
    table_rows = []
    for raw_row in rows[1:]:
        values = [raw_row[idx].strip() if idx < len(raw_row) else "" for idx in header_indices]
        if not any(values):
            continue
        table_rows.append(values)
    return render_table(header, table_rows, class_name="screen-item-table"), i


def render_table(header: list[str], rows: list[list[str]], class_name: str = "") -> str:
    class_attr = f" {class_name}" if class_name else ""
    thead = "".join(f"<th>{render_cell(cell)}</th>" for cell in header)
    body_rows = []
    for row in rows:
        normalized = row[: len(header)] + [""] * max(0, len(header) - len(row))
        non_empty = [cell for cell in normalized if cell.strip()]
        if len(non_empty) == 1 and not looks_like_item_id(non_empty[0]):
            body_rows.append(
                f'<tr class="section-row"><td colspan="{len(header)}">{render_cell(non_empty[0])}</td></tr>'
            )
            continue
        cells = "".join(f"<td>{render_cell(cell)}</td>" for cell in normalized)
        body_rows.append(f"<tr>{cells}</tr>")
    return (
        f'<div class="table-wrap{class_attr}"><table><thead><tr>{thead}</tr></thead>'
        f"<tbody>{''.join(body_rows)}</tbody></table></div>"
    )


def render_delimited_table(text: str, delimiter: str) -> str:
    rows = list(csv.reader(io.StringIO(text), delimiter=delimiter))
    rows = [[cell.strip() for cell in row] for row in rows if any(cell.strip() for cell in row)]
    if not rows:
        return "<pre><code></code></pre>"
    header = rows[0]
    body = rows[1:]
    header_text = " ".join(header)
    class_name = "screen-item-table" if "識別ID" in header_text or "No." in header_text or "No" in header_text else ""
    return render_table(header, body, class_name=class_name)


def render_cell(text: str) -> str:
    # 表セルもインライン Markdown（コードスパン・リンク）を本文と同様にレンダリングする。
    # render_inline が html.escape を内包するため、ここでは改行のみ <br> に変換する。
    return render_inline(text).replace("\n", "<br>")


def split_md_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_screen_item_header(lines: list[str], i: int) -> bool:
    line = lines[i]
    if "\t" not in line:
        return False
    candidate = line
    if i + 1 < len(lines):
        candidate += "\n" + lines[i + 1]
    return all(term in candidate for term in SCREEN_ITEM_HEADER_TERMS)


def has_odd_unescaped_quotes(line: str) -> bool:
    count = 0
    i = 0
    while i < len(line):
        if line[i] == '"':
            if i + 1 < len(line) and line[i + 1] == '"':
                i += 2
                continue
            count += 1
        i += 1
    return bool(count % 2)


def looks_like_item_id(value: str) -> bool:
    return bool(re.match(r"^\d+(?:-\d+)*$", value.strip()))


def render_inline(text: str) -> str:
    codes: list[str] = []

    def stash(match: re.Match[str]) -> str:
        codes.append(match.group(1))
        return CODE_TOKEN.format(len(codes) - 1)

    text = CODE_SPAN_RE.sub(stash, text)
    text = html.escape(text, quote=False)

    def link(match: re.Match[str]) -> str:
        label = match.group(1)
        href = match.group(2).strip()
        if href.lower().endswith(".md"):
            href = Path(href).with_suffix(".html").name
        return f'<a href="{html.escape(href, quote=True)}">{label}</a>'

    text = LINK_RE.sub(link, text)

    def restore(match: re.Match[str]) -> str:
        return f"<code>{html.escape(codes[int(match.group(1))], quote=False)}</code>"

    return re.sub(r"\x00CODE(\d+)\x00", restore, text)


def slugify(text: str, used: set[str]) -> str:
    base = re.sub(r"[^0-9A-Za-z぀-ヿ一-鿿]+", "-", text).strip("-") or "sec"
    slug = base
    counter = 2
    while slug in used:
        slug = f"{base}-{counter}"
        counter += 1
    used.add(slug)
    return slug


if __name__ == "__main__":
    raise SystemExit(main())
