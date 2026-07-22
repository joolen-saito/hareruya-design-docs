#!/usr/bin/env python3
"""設計書『表示メッセージ』表へ後続処理列を追加する（表単位で堅牢に検出）。

表 = 連続する `|` 始まり行で、2行目が区切り(`|---|...`)のもの。
その表の**ヘッダ(1行目)に「メッセージID」を含み、かつ「後続処理」を含まない**表だけを対象に、
ヘッダ/区切り/全データ行の末尾へ1セル追加する。データ行が MSG-ID 行ならマスタの後続処理、
それ以外(見出し的な補助行)は「—」で列数を揃える。見出し(##)は一切壊さない。

多様なヘッダ形式・1節内の複数表・メッセージID以外の補助行が混在しても、表単位で列数を保つ。

使い方:
  python3 add_followup_column.py --dry-run
  python3 add_followup_column.py --apply
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


def load_followup() -> dict[str, str]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    return {l.split("\t")[0]: l.split("\t")[ic["後続処理"]] for l in lines[1:] if l.strip()}


def cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def add_cell(line: str, val: str) -> str:
    r = line.rstrip()
    return (r + f" {val} |") if r.endswith("|") else (r + f" | {val} |")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run")
    fu = load_followup()

    docs = tables = rows = 0
    for md in sorted(FUNCTIONS.rglob("*.md")):
        lines = md.read_text(encoding="utf-8").splitlines()
        out = []
        changed = False
        i = 0
        n = len(lines)
        while i < n:
            l = lines[i]
            # 表の開始判定: ヘッダ行 + 次行が区切り
            if l.startswith("|") and i + 1 < n and SEP.match(lines[i + 1]) and "メッセージID" in l and "後続処理" not in l:
                # この表を5列化(末尾セル追加)
                out.append(add_cell(l, "後続処理"))
                out.append(lines[i + 1].rstrip() + ("----------|" if lines[i + 1].rstrip().endswith("|") else " ----------|"))
                tables += 1
                changed = True
                i += 2
                while i < n and lines[i].startswith("|"):
                    m = MSGID.match(lines[i])
                    if m:
                        out.append(add_cell(lines[i], cell(fu.get(m.group(1), ""))))
                        rows += 1
                    else:
                        out.append(add_cell(lines[i], "—"))  # 補助行も列数を揃える
                    i += 1
                continue
            out.append(l)
            i += 1
        if changed:
            docs += 1
            if args.apply:
                md.write_text("\n".join(out) + "\n", encoding="utf-8")

    print(f"5列化: {docs}doc  表{tables}個  MSG行{rows}件")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
