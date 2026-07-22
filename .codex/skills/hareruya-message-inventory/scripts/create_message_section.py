#!/usr/bin/env python3
"""『表示メッセージ』節が無い設計書へ、節そのものを新設して割当メッセージを載せる。

append_doc_rows.py は既存表への追記のみ。表が無い doc には節を作れないため、本スクリプトで
節を新設する。挿入位置は慣例（処理フロー/エラー処理の後・業務ルール等の前）に合わせ、
アンカー節の直前へ入れる。アンカーが無ければ文末へ付ける。見出しは一切壊さない。

対象は割当済み(<FID>-MSG-###)でまだ doc に載っていない行のみ。文言はTSVの値をそのまま使う。

使い方:
  python3 create_message_section.py --dry-run
  python3 create_message_section.py --apply
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"
# この節より前に入れる（最初に見つかったものの直前）
ANCHORS = [
    "## 業務ルール・計算", "## 集計条件", "## データ整合性", "## API/バッチ結果",
    "## 入出力", "## バリデーション", "## 権限・認可", "## 画面遷移",
]


def doc_for(fid: str) -> Path | None:
    hits = sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
    return hits[0] if hits else None


def cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip()


def build_section(rows, ic) -> str:
    lines = ["## 表示メッセージ", "",
             "| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |",
             "|--------------|----------|--------------|----------|"]
    for r in sorted(rows, key=lambda x: x[0]):
        lines.append("| " + " | ".join([
            r[0], cell(r[ic["どこに"]]), cell(r[ic["メッセージ内容"]]), cell(r[ic["トリガー（条件）"]]),
        ]) + " |")
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    present: set[str] = set()
    id_re = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d{3})\b")
    for md in FUNCTIONS.rglob("*.md"):
        present |= set(id_re.findall(md.read_text(encoding="utf-8", errors="replace")))

    todo: dict[str, list] = defaultdict(list)
    for r in rows:
        if r[0].startswith("EE-") or r[0] in present:
            continue
        todo[r[0].rpartition("-MSG-")[0].lower()].append(r)

    made = added = skipped = 0
    for fid, rs in sorted(todo.items()):
        md = doc_for(fid)
        if md is None:
            skipped += len(rs)
            continue
        text = md.read_text(encoding="utf-8")
        if re.search(r"^## 表示メッセージ", text, re.M):
            # 既存表あり → 本スクリプトの対象外（append_doc_rows 側）
            continue
        section = build_section(rs, ic)
        # 挿入位置: アンカー節の直前。無ければ文末。
        pos = None
        for a in ANCHORS:
            m = re.search(r"^" + re.escape(a) + r"\s*$", text, re.M)
            if m:
                pos = m.start()
                break
        if pos is None:
            new = text.rstrip() + "\n\n" + section + "\n"
        else:
            new = text[:pos] + section + "\n\n" + text[pos:]
        print(f"[{fid}] 節新設 +{len(rs)}行  {'文末' if pos is None else 'アンカー前'}  {md.name}")
        made += 1
        added += len(rs)
        if args.apply:
            md.write_text(new, encoding="utf-8")

    print(f"\n節新設={made}doc  追加={added}行  docなしskip={skipped}")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
