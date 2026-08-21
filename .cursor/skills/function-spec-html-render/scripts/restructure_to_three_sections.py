#!/usr/bin/env python3
"""機能設計書Markdownを3分類（業務ロジック / 入出力 / 表示メッセージ）へ組み替える。

0203 の型に合わせる書き直しのうち、**機械で確実にできる構造変換だけ**を行う。
文章の言い換え（実装手段の除去・手順書きから業務記述への書き換え）は人が行う。

やること:
1. 節を3分類へ寄せる。
   - 「処理フロー」の中身は業務ロジックの先頭へ移す（小見出し名はそのまま＝内容固有）。
   - 「エラー処理」の表は業務ロジックの末尾へ「エラー時の扱い」として移す。
   - 上記2節の見出し自体は残さない（3分類の外＝HTMLへ出ない）。
2. 「表示メッセージ」の表を5列（メッセージID / 表示位置 / 画面上の文言 / 表示条件 / 後続処理）へ
   正規化する。列構成の違う表・表示区分ごとの小見出しは1枚の表へ統合する。
   メッセージIDを持たない行は `—` とし、**行そのものは落とさない**。
3. 翻訳キー（`admin.xxx.yyy` 形式のバッククォート表記）を備考ごと落とす。

やらないこと（人の判断が要る）:
- 手順書き（1. 2. 3.）の業務記述への書き換え
- 実装手段（クラス名・メソッド名・イベント名）の除去
- DB物理名の論理名化（対応表に登録済みのものだけ別スクリプトで置換する）

使い方:
    python3 restructure_to_three_sections.py --docs functions/pf-eccube3/m03-01_*.md
    python3 restructure_to_three_sections.py --book 0204 [--dry-run]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
MSG_COLUMNS = ["メッセージID", "表示位置", "画面上の文言", "表示条件", "後続処理"]
# 旧列名 → 正規化後の列名
COLUMN_ALIASES = {
    "表示文言（日本語）": "画面上の文言",
    "表示文言": "画面上の文言",
    "文言": "画面上の文言",
    "画面上の文言": "画面上の文言",
    "表示条件（利用者視点）": "表示条件",
    "条件": "表示条件",
    "表示条件": "表示条件",
    "表示位置": "表示位置",
    "メッセージID": "メッセージID",
    "後続処理": "後続処理",
}
TRANSLATION_KEY_RE = re.compile(r"`[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+`")


def split_h2(text: str) -> tuple[str, list[tuple[str, list[str]]]]:
    """本文を (前文, [(節名, 行)]) に割る。フェンス内の `#` は見出しにしない。"""
    lines = text.split("\n")
    preamble: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] | None = None
    fence: str | None = None
    for line in lines:
        fence_match = re.match(r"^(```+|~~~+)", line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
        heading = re.match(r"^## (.+)$", line) if fence is None else None
        if heading:
            if current:
                sections.append(current)
            current = (heading.group(1).strip(), [])
            continue
        (current[1] if current else preamble).append(line)
    if current:
        sections.append(current)
    return "\n".join(preamble).rstrip(), sections


def table_rows(lines: list[str]) -> list[list[list[str]]]:
    """連続する表を [[セル行, ...], ...] で返す（区切り行は捨てる）。"""
    tables: list[list[list[str]]] = []
    current: list[list[str]] = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|"):
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if set("".join(cells)) <= set("-: "):
                continue
            current.append(cells)
            continue
        if current:
            tables.append(current)
            current = []
    if current:
        tables.append(current)
    return tables


def normalize_messages(lines: list[str]) -> list[str]:
    """表示メッセージ節を5列1枚の表へ正規化する。"""
    out_rows: list[list[str]] = []
    for table in table_rows(lines):
        if len(table) < 2:
            continue
        header = [COLUMN_ALIASES.get(h, h) for h in table[0]]
        for row in table[1:]:
            if len(row) != len(header):
                continue
            data = dict(zip(header, row))
            values = [data.get(col, "") for col in MSG_COLUMNS]
            if not any(values[1:]):
                continue
            values = [TRANSLATION_KEY_RE.sub("", v).strip() or "—" for v in values]
            out_rows.append(values)
    if not out_rows:
        # 表が無い節（本文だけ）はそのまま残す。
        return [l for l in lines if l.strip()]
    body = ["| " + " | ".join(MSG_COLUMNS) + " |", "| " + " | ".join(["---"] * 5) + " |"]
    seen: set[tuple[str, ...]] = set()
    for row in out_rows:
        key = tuple(row)
        if key in seen:
            continue
        seen.add(key)
        body.append("| " + " | ".join(row) + " |")
    return body


def demote(lines: list[str]) -> list[str]:
    """節内の見出しをそのまま使う（処理フローのH3は内容固有なので段階を変えない）。"""
    return lines


def restructure(text: str) -> str:
    preamble, sections = split_h2(text)
    by_title: dict[str, list[str]] = {}
    for title, lines in sections:
        by_title.setdefault(title, []).extend(lines)

    logic: list[str] = []
    for title in ("処理フロー",):
        if title in by_title:
            logic.extend(demote(by_title[title]))
    if "業務ロジック" in by_title:
        logic.extend(by_title["業務ロジック"])
    if "エラー処理" in by_title:
        body = [l for l in by_title["エラー処理"] if l.strip()]
        if body:
            logic.append("")
            logic.append("### エラー時の扱い")
            logic.append("")
            logic.extend(body)

    out: list[str] = [preamble] if preamble.strip() else []
    if any(l.strip() for l in logic):
        out += ["", "## 業務ロジック", ""] + [l for l in logic]
    if "入出力" in by_title and any(l.strip() for l in by_title["入出力"]):
        out += ["", "## 入出力", ""] + by_title["入出力"]
    if "表示メッセージ" in by_title:
        msg = normalize_messages(by_title["表示メッセージ"])
        if msg:
            out += ["", "## 表示メッセージ", ""] + msg
    body_text = "\n".join(out)
    body_text = re.sub(r"\n{3,}", "\n\n", body_text).strip() + "\n"
    return body_text


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docs", nargs="*", type=Path, default=[])
    parser.add_argument("--book", default="")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    docs = [p if p.is_absolute() else ROOT / p for p in args.docs]
    if args.book:
        html = next((ROOT / "excel_to_html" / "output").glob(f"{args.book}_*.html"))
        sources = sorted(
            set(re.findall(r'data-source="(functions/[^"]+)"', html.read_text(encoding="utf-8")))
        )
        docs = [ROOT / s for s in sources]
    if not docs:
        print("対象がありません", file=sys.stderr)
        return 1

    changed = 0
    for path in docs:
        original = path.read_text(encoding="utf-8")
        rebuilt = restructure(original)
        if rebuilt == original:
            continue
        changed += 1
        if not args.dry_run:
            path.write_text(rebuilt, encoding="utf-8")
    suffix = "（dry-run）" if args.dry_run else ""
    print(f"restructure: 対象 {len(docs)}本 / 変更 {changed}本{suffix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
