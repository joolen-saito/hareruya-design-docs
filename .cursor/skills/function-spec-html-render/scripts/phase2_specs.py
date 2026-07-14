#!/usr/bin/env python3
"""フェーズ2（Ph2）対応の仕様の台帳ローダとバナーレンダラ。

Excel基本設計が「Ph2で対応するため、Ph1では実装しない」と書いている機能・項目は、
フェーズ1では実装しない。ところが現行実装からリバースした機能設計書はその機能を
現行仕様として書くため、読み手は「実装すべき仕様」と誤読する。

記述は消さずに残し、**フェーズ1では実装不要であることをバナーで明示する**。
構造は [[superseded-spec]]（Excel基本設計による廃止）とまったく同じで、違うのは
「廃止された」のか「フェーズ2へ延期された」のかという理由だけである。両者は別物として
扱う。廃止は刷新後も実装しない。Ph2はフェーズ2で実装する。

スコープを2軸で持つのが要点である。
  - FUNCTION_SCOPE: 機能まるごとがPh2（例: F02-05 通知）
  - ITEM_SCOPE   : 機能はPh1だが、画面内の項目だけがPh2（例: F02-01 PC版ナビの通知アイコン）
既存のPh2除外は「機能No単位のハードコード集合」でしか表現できず、後者を扱えなかった。
"""
from __future__ import annotations

import html
import json
import re
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[4]
LEDGER = ROOT / "functions" / "phase2_specs.json"
OUTPUT_DIR = ROOT / "excel_to_html" / "output"

# バナーへ描画する verdict。not-phase2（偽陽性）と needs-triage（未判定）は描画しない。
RENDER_VERDICTS = ("phase2",)
ALL_VERDICTS = RENDER_VERDICTS + ("not-phase2", "needs-triage")

PHASE2_CSS = """/* phase2-notice:start */
    .phase2-notice {
      margin: 0 0 18px;
      padding: 12px 14px;
      border: 1px solid #9aa8c7;
      border-left: 5px solid #3f5b96;
      border-radius: 6px;
      background: #f2f5fb;
      font-size: 13px;
      line-height: 1.7;
    }
    .phase2-badge {
      display: inline-block;
      margin-right: 8px;
      padding: 2px 9px;
      border-radius: 999px;
      background: #3f5b96;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .phase2-notice-head {
      margin: 0 0 8px;
    }
    .phase2-notice-list {
      margin: 0;
      padding-left: 1.2em;
    }
    .phase2-notice-list > li {
      margin: 6px 0;
    }
    .phase2-target {
      font-weight: 700;
    }
    .phase2-notice a {
      color: #2f4677;
    }
    /* phase2-notice:end */"""


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
    key = doc.as_posix() if isinstance(doc, Path) else str(doc)
    entries = _entries_by_doc().get(key, [])
    if renderable_only:
        entries = [e for e in entries if e.get("verdict") in RENDER_VERDICTS]
    return entries


def md_marker(entry: dict) -> str:
    """機能設計書Markdownに必ず書かせる定型句。verify が台帳⇔md の同期をこれで検査する。"""
    book = entry.get("book", "")
    target = entry.get("target", "")
    return f"Excel基本設計 {book}「{target}」はフェーズ2対応"


def assert_unique_markers() -> list[str]:
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


def ledger_hit(book: str, feature_no: str, line: str) -> bool:
    """この注記行が既に台帳で判定済みか（検出器から呼ぶ）。"""
    for entry in load_ledger().get("entries", []):
        if entry.get("book") != book:
            continue
        if feature_no and feature_no in (entry.get("featureNos") or []):
            return True
        quote_text = entry.get("designQuote") or ""
        if quote_text and (quote_text in line or line in quote_text):
            return True
    return False


@lru_cache(maxsize=64)
def _book_html(book: str) -> str | None:
    matches = sorted(OUTPUT_DIR.glob(f"{book}_*.html"))
    return matches[0].name if matches else None


def _evidence_link(entry: dict, href_prefix: str) -> str:
    book = entry.get("book", "")
    sheets = entry.get("sheets") or []
    label_parts = [book] + [s.get("sheetName", "") for s in sheets[:1]]
    label = html.escape(" ".join(p for p in label_parts if p), quote=False)
    name = _book_html(book)
    if not name:
        return label
    anchor = sheets[0].get("anchor") if sheets else None
    href = f"{href_prefix}{quote(name)}" + (f"#{anchor}" if anchor else "")
    return f'<a href="{html.escape(href, quote=True)}">{label}</a>'


def _entry_line(entry: dict, href_prefix: str) -> str:
    target = html.escape(entry.get("target", ""), quote=False)
    scope = entry.get("scope")
    what = "は機能まるごとフェーズ2対応" if scope == "FUNCTION_SCOPE" else "はフェーズ2対応"
    line = (
        f'<li><span class="phase2-target">{target}</span> {what}'
        f"（{_evidence_link(entry, href_prefix)}）"
    )
    quote_text = entry.get("designQuote")
    if quote_text:
        line += f"<br>Excel原文: {html.escape(quote_text, quote=False)}"
    return line + "</li>"


def render_notice(doc: str | Path, href_prefix: str = "") -> str:
    """機能設計書の冒頭に出す「フェーズ1では実装不要」バナー。該当が無ければ空文字。"""
    entries = entries_for_doc(doc)
    if not entries:
        return ""
    key = doc.as_posix() if isinstance(doc, Path) else str(doc)
    repo = Path(key).parent.name
    lines = "\n        ".join(_entry_line(e, href_prefix) for e in entries)
    return f"""<div class="phase2-notice">
      <p class="phase2-notice-head"><span class="phase2-badge">フェーズ1では実装不要</span>本節は現行実装（{html.escape(repo, quote=False)}）からのリバースです。次はExcel基本設計によりフェーズ2対応とされており、フェーズ1では実装・テストの対象外です。</p>
      <ul class="phase2-notice-list">
        {lines}
      </ul>
    </div>"""


def main() -> int:
    ledger = load_ledger()
    entries = ledger.get("entries", [])
    print(f"台帳: {LEDGER.relative_to(ROOT)}  entries={len(entries)}")
    counts: dict[str, int] = {}
    for e in entries:
        counts[e.get("verdict", "?")] = counts.get(e.get("verdict", "?"), 0) + 1
    print("  verdict:", ", ".join(f"{k}={v}" for k, v in sorted(counts.items())) or "(なし)")
    docs = _entries_by_doc()
    print(f"  影響する機能設計書: {len(docs)} 件")
    for doc in sorted(docs):
        print(f"    - {doc}")
        for e in docs[doc]:
            print(f"        [{e.get('scope')}] {md_marker(e)}")
    errors = assert_unique_markers()
    if errors:
        print("\nNG: 定型句の重複", *(f"  - {e}" for e in errors), sep="\n")
        return 1
    print("\nOK: 定型句はエントリごとに一意です")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
