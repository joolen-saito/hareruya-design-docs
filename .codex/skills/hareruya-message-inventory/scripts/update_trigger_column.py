#!/usr/bin/env python3
"""設計書『表示メッセージ』表の表示条件セルを、マスタの簡潔化済みトリガーで更新する。

表単位でヘッダから「条件」を含む列位置を特定し、各 MSG-ID 行のその列セルだけを
マスタ message_inventory.tsv の トリガー（条件） で置換する。他セル・見出しは触らない。

使い方:
  python3 update_trigger_column.py --dry-run
  python3 update_trigger_column.py --apply
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


def load_trigger() -> dict[str, str]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    return {l.split("\t")[0]: l.split("\t")[ic["トリガー（条件）"]] for l in lines[1:] if l.strip()}


def cellval(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def split_cells(line: str) -> list[str]:
    """md表行 → セル配列（前後の空 | を除く。エスケープ \\| は分割しない）。"""
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
    trig = load_trigger()

    docs = updated = 0
    for md in sorted(FUNCTIONS.rglob("*.md")):
        lines = md.read_text(encoding="utf-8").splitlines()
        out = []
        changed = False
        i = 0
        n = len(lines)
        while i < n:
            l = lines[i]
            if l.startswith("|") and i + 1 < n and SEP.match(lines[i + 1]) and "メッセージID" in l:
                header_cells = [c.strip() for c in split_cells(l)]
                # 「条件」を含む列（表示条件/条件/表示条件（利用者視点）等）
                cond_idx = next((j for j, c in enumerate(header_cells) if "条件" in c), None)
                out.append(l)
                out.append(lines[i + 1])
                i += 2
                while i < n and lines[i].startswith("|"):
                    m = MSGID.match(lines[i])
                    if m and cond_idx is not None and m.group(1) in trig:
                        cells = split_cells(lines[i])
                        if cond_idx < len(cells):
                            newv = " " + cellval(trig[m.group(1)]) + " "
                            if cells[cond_idx] != newv:
                                cells[cond_idx] = newv
                                out.append("|" + "|".join(cells) + "|")
                                updated += 1
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

    print(f"表示条件セル更新: {docs}doc  {updated}行")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
