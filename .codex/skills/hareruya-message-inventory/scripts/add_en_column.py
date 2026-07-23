#!/usr/bin/env python3
"""設計書『表示メッセージ』表へ英語文言列を追加する(画面上の文言の直後)。

表単位でヘッダから「画面上の文言/表示文言」列の位置を特定し、その直後へ
『画面上の文言(英語)』列を挿入。各 MSG-ID 行にマスタの メッセージ内容(英語) を入れる。
補助行(非MSG)は「—」。既に英語列があればスキップ。見出し・列数整合を保つ。

使い方:
  python3 add_en_column.py --dry-run
  python3 add_en_column.py --apply
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
EN_HDR = "画面上の文言(英語)"


def load_en() -> dict[str, str]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    return {l.split("\t")[0]: l.split("\t")[ic["メッセージ内容(英語)"]] for l in lines[1:] if l.strip()}


def cellval(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def split_cells(line: str) -> list[str]:
    inner = line.strip()
    inner = inner[1:] if inner.startswith("|") else inner
    inner = inner[:-1] if inner.endswith("|") else inner
    return re.split(r"(?<!\\)\|", inner)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run")
    enmap = load_en()

    docs = rows = 0
    for md in sorted(FUNCTIONS.rglob("*.md")):
        lines = md.read_text(encoding="utf-8").splitlines()
        out = []
        changed = False
        i = 0
        n = len(lines)
        while i < n:
            l = lines[i]
            if l.startswith("|") and i + 1 < n and SEP.match(lines[i + 1]) and "メッセージID" in l and EN_HDR not in l:
                hdr = [c.strip() for c in split_cells(l)]
                # 「文言」を含む列(画面上の文言/表示文言)。英語列自身は除外
                pos = next((j for j, c in enumerate(hdr) if ("文言" in c or "メッセージ内容" in c) and "英語" not in c), None)
                if pos is None:
                    out.append(l)
                    i += 1
                    continue
                # ヘッダ・区切りに列挿入
                hcells = split_cells(l)
                hcells.insert(pos + 1, f" {EN_HDR} ")
                out.append("|" + "|".join(hcells) + "|")
                scells = split_cells(lines[i + 1])
                scells.insert(pos + 1, "----------")
                out.append("|" + "|".join(scells) + "|")
                changed = True
                i += 2
                while i < n and lines[i].startswith("|"):
                    cells = split_cells(lines[i])
                    m = MSGID.match(lines[i])
                    val = cellval(enmap.get(m.group(1), "")) if m and m.group(1) in enmap else "—"
                    if pos + 1 <= len(cells):
                        cells.insert(pos + 1, f" {val} ")
                    else:
                        cells.append(f" {val} ")
                    out.append("|" + "|".join(cells) + "|")
                    if m:
                        rows += 1
                    i += 1
                continue
            out.append(l)
            i += 1
        if changed:
            docs += 1
            if args.apply:
                md.write_text("\n".join(out) + "\n", encoding="utf-8")

    print(f"英語列追加: {docs}doc  MSG行{rows}件")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
