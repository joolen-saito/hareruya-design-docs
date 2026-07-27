#!/usr/bin/env python3
"""正本設計書HTML（excel_to_html/output/*.html）へのアクセス。

設計方針:
- 巨大HTML（最大67MB）を全文で返さない。シートが特定できなければ例外を投げる。
  audit_harness.extract_sheet_html はアンカー不一致時に全文を返すため、ここでは使わない。
- 表構造を保持したテキスト化を行う。audit_harness.strip_html は </td> も改行にするため
  列の対応関係が壊れる。ここでは </td>/</th> をタブ、</tr> を改行に変換する。
- 設計書名からHTMLへの解決は、完全一致 → 正規化一致 → 書籍番号一致 の順で試み、
  複数該当・不一致はエラーとして候補を提示する（自動で1つ選ばない）。
"""

from __future__ import annotations

import html as html_module
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

DOCS_ROOT = Path(__file__).resolve().parents[1]
DESIGN_HTML_DIR = DOCS_ROOT / "excel_to_html" / "output"

# 別系統の設計資料（正本HTMLに無い場合の補助。探索したことの証跡に使う）
WORKSPACE_ROOT = DOCS_ROOT.parent
SPLIT_SHEET_DIRS = WORKSPACE_ROOT / "ec-cube-enterprise" / ".cursor" / "design" / "html" / "excel"
MDFILE_DIR = WORKSPACE_ROOT / "ec-cube-enterprise" / ".cursor" / "docs" / "MDfile"

_SHEET_PANEL_RE = re.compile(
    r'<section class="sheet-panel[^"]*" id="(sheet-\d+)"',
)
_SHEET_HEADING_RE = re.compile(
    r'<section class="sheet-panel[^"]*" id="(sheet-\d+)"\s*>\s*'
    r'<div class="sheet-heading">\s*<h2>(.*?)</h2>',
    re.S,
)
_BOOK_NUMBER_RE = re.compile(r"^\s*(\d{4})")


class DesignDocError(Exception):
    """設計書の解決・抽出に失敗した。呼び出し側は握りつぶさないこと。"""


@dataclass(frozen=True)
class Sheet:
    sheet_id: str
    title: str
    start: int
    end: int


def normalize_name(value: str) -> str:
    """全半角・空白・拡張子の揺れを吸収した比較キーを返す。

    実データに `0406_基本設計仕様書(バッチ_店頭買取管理) .html` のように
    拡張子直前に空白を含むものがあるため、単純一致だけでは取りこぼす。
    """
    text = unicodedata.normalize("NFKC", value or "")
    text = re.sub(r"\.(xlsx|xlsm|xls|html?)$", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[\s　]+", "", text)
    return text


def book_number(value: str) -> str | None:
    match = _BOOK_NUMBER_RE.match(unicodedata.normalize("NFKC", value or ""))
    return match.group(1) if match else None


def list_books() -> list[Path]:
    if not DESIGN_HTML_DIR.is_dir():
        raise DesignDocError(f"設計HTMLディレクトリが存在しない: {DESIGN_HTML_DIR}")
    return sorted(DESIGN_HTML_DIR.glob("*.html"))


def resolve_book(name: str) -> Path:
    """設計書名（例: `0212_基本設計仕様書(デッキ管理).xlsx`）から正本HTMLを解決する。"""
    if not name or not name.strip():
        raise DesignDocError("設計書名が空")

    books = list_books()
    raw = name.strip()

    # 1) ファイル名そのままの完全一致
    for path in books:
        if path.name == raw or path.stem == raw:
            return path

    # 2) 正規化一致
    key = normalize_name(raw)
    hits = [p for p in books if normalize_name(p.name) == key]
    if len(hits) == 1:
        return hits[0]
    if len(hits) > 1:
        raise DesignDocError(
            f"設計書名 {raw!r} が複数の正本HTMLに一致した: " + ", ".join(p.name for p in hits)
        )

    # 3) 書籍番号一致
    number = book_number(raw)
    if number:
        hits = [p for p in books if book_number(p.name) == number]
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            raise DesignDocError(
                f"書籍番号 {number} が複数の正本HTMLに一致した: " + ", ".join(p.name for p in hits)
            )

    raise DesignDocError(
        f"設計書 {raw!r} に対応する正本HTMLが見つからない。\n"
        f"探索先: {DESIGN_HTML_DIR}\n"
        "候補:\n  " + "\n  ".join(p.name for p in books)
    )


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def sheet_index(book_path: Path) -> list[Sheet]:
    """シート一覧（id / 見出し / HTML内オフセット）を返す。"""
    text = _read(book_path)
    starts: list[tuple[str, int]] = [
        (m.group(1), m.start()) for m in _SHEET_PANEL_RE.finditer(text)
    ]
    if not starts:
        raise DesignDocError(f"シートセクションが1件も無い: {book_path.name}")

    titles: dict[str, str] = {}
    for match in _SHEET_HEADING_RE.finditer(text):
        titles[match.group(1)] = strip_tags(match.group(2)).strip()

    sheets: list[Sheet] = []
    for i, (sheet_id, start) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else len(text)
        sheets.append(Sheet(sheet_id, titles.get(sheet_id, ""), start, end))
    return sheets


def find_sheet(book_path: Path, *, sheet_id: str | None = None, title: str | None = None) -> Sheet:
    """シートを一意に特定する。特定できなければ例外（全文フォールバックはしない）。"""
    sheets = sheet_index(book_path)

    if sheet_id:
        wanted = sheet_id if sheet_id.startswith("sheet-") else f"sheet-{sheet_id}"
        for sheet in sheets:
            if sheet.sheet_id == wanted:
                return sheet
        raise DesignDocError(
            f"{book_path.name} に {wanted} が存在しない。"
            f" 有効なID: {sheets[0].sheet_id}..{sheets[-1].sheet_id}"
        )

    if title:
        key = normalize_name(title)
        exact = [s for s in sheets if normalize_name(s.title) == key]
        if len(exact) == 1:
            return exact[0]
        if len(exact) > 1:
            raise DesignDocError(
                f"シート名 {title!r} が複数一致: " + ", ".join(f"{s.sheet_id}({s.title})" for s in exact)
            )
        partial = [s for s in sheets if key and key in normalize_name(s.title)]
        if len(partial) == 1:
            return partial[0]
        if len(partial) > 1:
            raise DesignDocError(
                f"シート名 {title!r} が複数に部分一致: "
                + ", ".join(f"{s.sheet_id}({s.title})" for s in partial)
                + "\n--sheet-id で一意に指定すること"
            )
        raise DesignDocError(
            f"{book_path.name} にシート名 {title!r} が見つからない。\n収録シート:\n  "
            + "\n  ".join(f"{s.sheet_id}\t{s.title}" for s in sheets)
        )

    raise DesignDocError("sheet_id か title のどちらかを指定すること")


def sheet_html(book_path: Path, sheet: Sheet) -> str:
    return _read(book_path)[sheet.start : sheet.end]


def strip_tags(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", "", fragment)
    return html_module.unescape(text)


def to_text(fragment: str) -> str:
    """表構造を保持したテキスト化。

    `</td>` `</th>` はタブ、`</tr>` は改行にする。audit_harness.strip_html は
    セル区切りも改行にするため、`商品編集` 列に〇があるかといった列対応が読めなくなる。
    """
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", fragment, flags=re.S | re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</t[dh]>", "\t", text, flags=re.I)
    text = re.sub(r"</tr>", "\n", text, flags=re.I)
    text = re.sub(r"</(p|div|li|h[1-6]|dt|dd|section|tbody|thead|table)>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)
    lines = []
    for line in text.splitlines():
        line = line.rstrip()
        line = re.sub(r"[ 　]+\t", "\t", line)
        line = re.sub(r"\t[ 　]+", "\t", line)
        if line.strip(" \t　"):
            lines.append(line.strip(" 　"))
    return "\n".join(lines)


def sheet_text(book_path: Path, sheet: Sheet) -> str:
    return to_text(sheet_html(book_path, sheet))


def grep_book(book_path: Path, pattern: str, *, context: int = 0) -> list[tuple[Sheet, list[str]]]:
    """シート単位で本文を検索する。ヒットしたシートと該当行だけを返す。"""
    regex = re.compile(pattern)
    text = _read(book_path)
    results: list[tuple[Sheet, list[str]]] = []
    for sheet in sheet_index(book_path):
        fragment = text[sheet.start : sheet.end]
        if not regex.search(strip_tags(fragment)):
            continue
        lines = sheet_text(book_path, sheet).splitlines()
        hits: list[str] = []
        for i, line in enumerate(lines):
            if regex.search(line):
                lo = max(0, i - context)
                hi = min(len(lines), i + context + 1)
                hits.extend(lines[lo:hi])
        results.append((sheet, hits))
    return results


def alternate_sources(name: str) -> dict[str, list[str]]:
    """正本HTML以外の設計資料の所在。「A/B/C 全系統を当たった」証跡に使う。"""
    number = book_number(name) or ""
    split_dirs: list[str] = []
    if SPLIT_SHEET_DIRS.is_dir():
        for child in sorted(SPLIT_SHEET_DIRS.iterdir()):
            if child.is_dir() and (not number or child.name.startswith(number)):
                split_dirs.append(str(child.relative_to(WORKSPACE_ROOT)))
    md_files: list[str] = []
    if MDFILE_DIR.is_dir():
        md_files = [
            str(p.relative_to(WORKSPACE_ROOT))
            for p in sorted(MDFILE_DIR.glob("*.md"))
            if not p.name.endswith(":Zone.Identifier")
        ]
    return {"splitSheets": split_dirs, "markdown": md_files}
