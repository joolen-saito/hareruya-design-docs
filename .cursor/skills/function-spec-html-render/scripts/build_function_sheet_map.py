#!/usr/bin/env python3
"""機能No ↔ Excel設計書シートの突合台帳を作る（機械候補 → 人が確定）。

「Excelに対応シートが無い＝リニューアルで廃止」と判定するには、まず突合が正しい必要が
ある。実測（2026-08-14）では、シートが割り当たらなかった76機能のうち54件は機能名がExcel
本文に存在し、原因は次の4つだった。

  1. Excel正本（.xlsx）が無い領域（例: デッキビルダーAPI）。廃止ではなく設計書が別系統。
  2. シートに「機能No」欄が無く索引できない（536枚中101枚）。
  3. 機能名とシート名の表記ゆれ（「出荷指示リスト詳細編集/削除」↔「出荷指示リスト編集」）。
  4. 粒度差（画面内の一操作は画面シートの一部として書かれている）。

本スクリプトは判定せず、**候補と根拠を並べる**だけにする。確定は人が `状態` 列で行う。

  python3 .cursor/skills/function-spec-html-render/scripts/build_function_sheet_map.py
  python3 .cursor/skills/function-spec-html-render/scripts/build_function_sheet_map.py --limit M05
"""

from __future__ import annotations

import argparse
import difflib
import importlib.util
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
EXCEL_OUTPUT = ROOT / "excel_to_html" / "output"
EXCEL_INPUT = ROOT / "excel_to_html" / "input"
LEDGER = ROOT / "functions" / "function-sheet-map.tsv"
INTEGRATE = Path(__file__).with_name("integrate_function_docs_into_excel_html.py")

PANEL_RE = re.compile(r'<section class="sheet-panel(?: is-active)?" id="(?P<id>[^"]+)">')
HEADING_RE = re.compile(r'class="sheet-heading"[^>]*>\s*(?:<h2[^>]*>)?(?P<value>.*?)</h2>', re.S)
TAG_RE = re.compile(r"<[^>]+>")
HEADER = [
    "機能No",
    "機能名",
    "区分",
    "ブック",
    "シートID",
    "シート見出し",
    "一致根拠",
    "スコア",
    "状態",
]
# 状態の語彙。`確定` だけを統合スクリプトが使う。
STATUS_FIXED = "確定"          # 人が確認した（または機能No欄が一致した）
STATUS_CANDIDATE = "候補"       # 名前類似・本文一致。人の確認待ち
STATUS_NO_MATCH = "Excelに該当なし"   # 廃止裁定へ回す
STATUS_NO_SOURCE = "Excel設計書なし"  # そのブックの正本(.xlsx)が無い。廃止判定の対象外


def load_integrate():
    spec = importlib.util.spec_from_file_location("integrate_docs", INTEGRATE)
    module = importlib.util.module_from_spec(spec)
    sys.modules["integrate_docs"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def text_of(html: str) -> str:
    return " ".join(TAG_RE.sub(" ", html).split())


def load_sheets(integrate) -> list[dict]:
    """全シートを拾う（機能No欄が無いシートも候補に載せる）。"""
    sheets: list[dict] = []
    for html_path in sorted(EXCEL_OUTPUT.glob("*.html")):
        if html_path.name == "index.html":
            continue
        document = integrate.strip_existing_embeds(html_path.read_text(encoding="utf-8"))
        starts = list(PANEL_RE.finditer(document))
        book = html_path.name[:4]
        has_source = any(EXCEL_INPUT.glob(f"{book}*.xls*"))
        for pos, match in enumerate(starts):
            end = starts[pos + 1].start() if pos + 1 < len(starts) else len(document)
            section = document[match.start() : end]
            # 【新規】画面のシートは機能設計書の貼り先にしないので台帳にも載せない。
            if integrate.is_embed_excluded_sheet(html_path, match.group("id")):
                continue
            heading_match = HEADING_RE.search(section)
            # Excel の機能No欄・機能名欄の誤記は統合スクリプトの上書き表で直す（正本は変えない）。
            feature_no, feature_name = integrate.apply_sheet_override(
                html_path,
                match.group("id"),
                integrate.extract_named_kv("機能No", section),
                integrate.extract_named_kv("機能名", section),
            )
            sheets.append(
                {
                    "book": book,
                    "html": html_path,
                    "id": match.group("id"),
                    "heading": text_of(heading_match.group("value")) if heading_match else "",
                    "feature_no": feature_no,
                    "feature_name": feature_name,
                    "text": text_of(section),
                    "raw": section,
                    "has_source": has_source,
                }
            )
    return sheets


def normalize(value: str) -> str:
    value = re.sub(r"[（(].*?[）)]", "", value)
    return re.sub(r"[\s　・/／\-—－_]", "", value)


def cell_ref(sheet: dict, needle: str) -> str:
    """機能名が出てくる要素の実Excel座標（`0203:シート名!B12`）を返す。

    引用規約（[[excel-to-html]]）どおり、HTMLの行番号ではなく `data-excel-ref` を使う。
    """
    for match in re.finditer(
        r'data-excel-ref="([^"]+)"[^>]*>(.*?)<', sheet["raw"], re.S
    ):
        if normalize(needle) and normalize(needle) in normalize(text_of(match.group(2))):
            return match.group(1)
    return ""


def score(row_name: str, sheet: dict) -> float:
    target = max(
        (normalize(sheet["feature_name"]), normalize(sheet["heading"])),
        key=lambda t: difflib.SequenceMatcher(None, normalize(row_name), t).ratio(),
    )
    return difflib.SequenceMatcher(None, normalize(row_name), target).ratio()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=LEDGER)
    parser.add_argument("--limit", help="機能Noの接頭辞で絞る（例: M05）")
    parser.add_argument("--top", type=int, default=3, help="候補の最大数")
    parser.add_argument(
        "--min-score",
        type=float,
        default=0.40,
        help="名前類似で候補に載せる下限。これ未満は裁定の邪魔になるので載せない",
    )
    args = parser.parse_args()

    integrate = load_integrate()
    rows = integrate.parse_todo_rows()
    sheets = load_sheets(integrate)

    # 機能No接頭辞 → その接頭辞のシートが載っているブック
    books_by_prefix: dict[str, set[str]] = defaultdict(set)
    for sheet in sheets:
        if sheet["feature_no"]:
            books_by_prefix[integrate.feature_prefix(sheet["feature_no"])].add(sheet["book"])

    by_no: dict[str, list[dict]] = defaultdict(list)
    for sheet in sheets:
        if sheet["feature_no"]:
            by_no[integrate.normalize_feature_no(sheet["feature_no"])].append(sheet)

    out = ["\t".join(HEADER)]
    counts = defaultdict(int)
    for row in rows:
        if args.limit and not row.feature_no.upper().startswith(args.limit.upper()):
            continue
        prefix = integrate.feature_prefix(row.feature_no)
        scope_books = books_by_prefix.get(prefix, set())
        scoped = [s for s in sheets if s["book"] in scope_books] if scope_books else []

        exact = by_no.get(integrate.normalize_feature_no(row.feature_no), [])
        if exact:
            for sheet in exact:
                out.append(
                    "\t".join(
                        [row.feature_no, row.feature_name, row.division, sheet["book"], sheet["id"],
                         sheet["heading"], "機能No欄が一致", "1.00", STATUS_FIXED]
                    )
                )
            counts[STATUS_FIXED] += 1
            continue

        if not scoped:
            # その接頭辞のシートがどのブックにも無い＝Excel基本設計が存在しない領域。
            # 廃止ではないので、廃止裁定の対象にしない（例: デッキビルダーAPI・管理画面TOP）。
            out.append(
                "\t".join([row.feature_no, row.feature_name, row.division, "-", "-", "-",
                           "この機能グループのシートがどのブックにも無い", "0.00", STATUS_NO_SOURCE])
            )
            counts[STATUS_NO_SOURCE] += 1
            continue

        ranked = sorted(scoped, key=lambda s: score(row.feature_name, s), reverse=True)
        contains = [
            s
            for s in scoped
            if normalize(row.feature_name) and normalize(row.feature_name) in normalize(s["text"])
        ]
        candidates: list[tuple[dict, str, float]] = []
        for sheet in contains[: args.top]:
            where = cell_ref(sheet, row.feature_name)
            if sheet["heading"] in ("目次", "表紙"):
                # 目次のヒットは貼り付け先にはならないが、「この本に載っている＝廃止ではない」
                # という裁定材料になるので残す。
                reason = f"目次に機能名が記載（掲載の裏付け・{where}）" if where else "目次に機能名が記載"
            else:
                reason = f"シート本文に機能名が出現（{where}）" if where else "シート本文に機能名が出現"
            candidates.append((sheet, reason, score(row.feature_name, sheet)))
        for sheet in ranked[: args.top]:
            if any(sheet is c[0] for c in candidates):
                continue
            value = score(row.feature_name, sheet)
            # 似ていないシートを候補に並べると裁定の邪魔にしかならない。
            if value < args.min_score:
                continue
            candidates.append((sheet, "シート名が類似", value))
        candidates = candidates[: args.top]

        if not candidates:
            out.append(
                "\t".join([row.feature_no, row.feature_name, row.division, "-", "-", "-",
                           "候補なし", "0.00", STATUS_NO_MATCH])
            )
            counts[STATUS_NO_MATCH] += 1
            continue
        counts[STATUS_CANDIDATE] += 1
        for sheet, reason, value in candidates:
            out.append(
                "\t".join([row.feature_no, row.feature_name, row.division, sheet["book"], sheet["id"],
                           sheet["heading"], reason, f"{value:.2f}", STATUS_CANDIDATE])
            )

    args.out.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"突合台帳: {args.out}")
    print(f"  シート総数: {len(sheets)}（うち機能No欄あり {sum(1 for s in sheets if s['feature_no'])}）")
    for status in (STATUS_FIXED, STATUS_CANDIDATE, STATUS_NO_MATCH, STATUS_NO_SOURCE):
        print(f"  {status}: {counts[status]}機能")
    print("  ※ 候補行は人が `状態` を 確定 / Excelに該当なし へ書き換える。統合は 確定 だけを使う。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
