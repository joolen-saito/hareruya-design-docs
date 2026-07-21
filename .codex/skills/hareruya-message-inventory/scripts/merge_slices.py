#!/usr/bin/env python3
"""確定済みスライス(<FID>.resolved.tsv)をマスタ message_inventory.tsv へ反映する。

メッセージID をキーに、スライス側の確定値でマスタ行を上書きする（列はTEMPLATE.mdの11列）。
スライスに無い行は触らない。冪等。

使い方:
  python3 merge_slices.py --fid m04-31
  python3 merge_slices.py --all        # slices/*.resolved.tsv 全て
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
SLICE_DIR = L.DOC_ROOT / "message_inventory" / "slices"
IDCOL = "メッセージID"


def load_tsv(path: Path) -> tuple[list[str], dict[str, list[str]]]:
    with path.open(encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        rows = {r[0]: r for r in reader if r}
    return header, rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid")
    ap.add_argument("--all", action="store_true")
    args = ap.parse_args()

    slices: list[Path] = []
    if args.all:
        slices = sorted(SLICE_DIR.glob("*.resolved.tsv"))
    elif args.fid:
        p = SLICE_DIR / f"{args.fid.upper().replace('_', '-')}.resolved.tsv"
        if p.exists():
            slices = [p]
        else:
            print(f"[skip] resolved slice なし: {p.name}")
            return
    else:
        ap.error("--fid か --all を指定")

    header, master = load_tsv(TSV)
    ncol = len(header)
    updated = 0
    added: list[str] = []
    for sp in slices:
        _sh, srows = load_tsv(sp)
        for mid, row in srows.items():
            row = (row + [""] * ncol)[:ncol]  # 列数を揃える
            if mid in master:
                master[mid] = row
                updated += 1
            else:
                # レビューで発見された抜け漏れメッセージ（新規ID）は取りこぼさず追記する
                master[mid] = row
                added.append(mid)

    # メッセージID順の元順序を保つため、元ファイルを再読込して順序取得
    with TSV.open(encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter="\t")
        next(reader)
        order = [r[0] for r in reader if r]

    # 新規IDは同一エリアの既存行群の直後へ挿入（無ければ末尾）
    def area_of(mid: str) -> str:
        return mid.rpartition("-MSG-")[0]

    for mid in sorted(added):
        area = area_of(mid)
        idx = [i for i, m in enumerate(order) if area_of(m) == area]
        order.insert(idx[-1] + 1 if idx else len(order), mid)

    with TSV.open("w", encoding="utf-8") as fh:
        fh.write("\t".join(header) + "\n")
        for mid in order:
            r = master[mid]
            fh.write("\t".join(c.replace("\t", " ") for c in r) + "\n")
    print(f"merged {updated} rows, added {len(added)} new rows from {len(slices)} slice(s) -> {TSV.name}")
    if added:
        print("  新規(レビューで発見された抜け漏れ):", ", ".join(sorted(added)[:15]), "..." if len(added) > 15 else "")


if __name__ == "__main__":
    main()
