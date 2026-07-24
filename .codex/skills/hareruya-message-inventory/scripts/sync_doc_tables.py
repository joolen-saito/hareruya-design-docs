#!/usr/bin/env python3
"""設計書『表示メッセージ』表の各セルを、正本 message_inventory.tsv と同期する。

表単位でヘッダから列種別を判定し、MSG-ID 行の各セルをマスタ値で更新する:
  表示位置/どこに      ← どこに
  画面上の文言/表示文言 ← メッセージ内容
  表示条件/条件        ← トリガー（条件）
  後続処理             ← 後続処理
ヘッダに存在する列だけ更新。他セル・見出しは触らない。列数は不変。

使い方:
  python3 sync_doc_tables.py --dry-run
  python3 sync_doc_tables.py --apply
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"
SEP = re.compile(r"^\|[\s\-:|]+\|\s*$")
MSGID = re.compile(r"^\|\s*([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d{3})\s*\|")


def load_master() -> tuple[dict, dict]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    m = {l.split("\t")[0]: l.split("\t") for l in lines[1:] if l.strip()}
    return ic, m


def cellval(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def split_cells(line: str) -> list[str]:
    inner = line.strip()
    inner = inner[1:] if inner.startswith("|") else inner
    inner = inner[:-1] if inner.endswith("|") else inner
    return re.split(r"(?<!\\)\|", inner)


def col_source(header_cell: str) -> str | None:
    h = header_cell.strip()
    if h == "メッセージID":
        return None
    if "後続処理" in h:
        return "後続処理"
    if "条件" in h:
        return "トリガー（条件）"
    if "英語" in h:
        return "メッセージ内容(英語)"
    if "文言" in h or "メッセージ内容" in h:
        return "メッセージ内容"
    if "表示位置" in h or "どこに" in h:
        return "どこに"
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run")
    ic, master = load_master()

    docs = cells = 0
    for md in sorted(FUNCTIONS.rglob("*.md")):
        lines = md.read_text(encoding="utf-8").splitlines()
        out = []
        changed = False
        i = 0
        n = len(lines)
        while i < n:
            l = lines[i]
            if l.startswith("|") and i + 1 < n and SEP.match(lines[i + 1]) and "メッセージID" in l:
                hdr = [c.strip() for c in split_cells(l)]
                colmap = {j: col_source(h) for j, h in enumerate(hdr)}
                out.append(l)
                out.append(lines[i + 1])
                i += 2
                while i < n and lines[i].startswith("|"):
                    m = MSGID.match(lines[i])
                    if m and m.group(1) in master:
                        cellsarr = split_cells(lines[i])
                        mr = master[m.group(1)]
                        rowchanged = False
                        for j, src in colmap.items():
                            if src and j < len(cellsarr):
                                newv = " " + cellval(mr[ic[src]]) + " "
                                if cellsarr[j] != newv:
                                    cellsarr[j] = newv
                                    cells += 1
                                    rowchanged = True
                        if rowchanged:
                            out.append("|" + "|".join(cellsarr) + "|")
                            changed = True
                            i += 1
                            continue
                    out.append(lines[i])
                    i += 1
                continue
            out.append(l)
            i += 1
        if changed:
            docs += 1
            if args.apply:
                md.write_text("\n".join(out) + "\n", encoding="utf-8")

    print(f"doc表セル同期: {docs}doc  {cells}セル")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
