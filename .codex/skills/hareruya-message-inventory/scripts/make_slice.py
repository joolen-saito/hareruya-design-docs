#!/usr/bin/env python3
"""機能単位の入力スライスを切り出す（codex/fable5レビュー用）。

message_inventory.tsv から当該機能のメッセージ行を抽出し、
message_inventory/slices/<FID>.tsv に書き出す。JS未割当(EE-JS-*)のうち
candidate（テンプレ名 or domain一致）も候補として付ける。

使い方:
  python3 make_slice.py --fid m04-31
  python3 make_slice.py --list-fids     # メッセージを持つ機能ID一覧（件数付き）
"""
from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
SLICE_DIR = L.DOC_ROOT / "message_inventory" / "slices"


def rows_for_area(area: str) -> tuple[list[str], list[list[str]]]:
    with TSV.open(encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        prefix = area + "-MSG-"
        out = [r for r in reader if r and r[0].startswith(prefix)]
    return header, out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid")
    ap.add_argument("--list-fids", action="store_true")
    args = ap.parse_args()

    if args.list_fids:
        c: Counter = Counter()
        with TSV.open(encoding="utf-8") as fh:
            reader = csv.reader(fh, delimiter="\t")
            next(reader)
            for r in reader:
                if r:
                    c[r[0].rsplit("-MSG-", 1)[0]] += 1
        for area, n in c.most_common():
            print(f"{n}\t{area}")
        return

    if not args.fid:
        ap.error("--fid か --list-fids を指定")
    area = args.fid.upper().replace("_", "-")
    header, rows = rows_for_area(area)
    SLICE_DIR.mkdir(parents=True, exist_ok=True)
    out = SLICE_DIR / f"{area}.tsv"
    with out.open("w", encoding="utf-8") as fh:
        fh.write("\t".join(header) + "\n")
        for r in rows:
            fh.write("\t".join(r) + "\n")
    si = header.index("解決状態") if "解決状態" in header else -1
    unresolved = sum(1 for r in rows if si >= 0 and len(r) > si and r[si].startswith("UNRESOLVED"))
    print(f"{out}  rows={len(rows)}  未解決={unresolved}")


if __name__ == "__main__":
    main()
