#!/usr/bin/env python3
"""EEスライス(slices/ee/<slug>.resolved.tsv)をマスタへ反映する。

反映前ゲート:
  - 割り当てられた機能IDは functions/ に実在する設計書のものだけ。存在しない機能へ
    割り当てられた行は未割当へ戻す（設計書不在＝カバレッジ欠落として残す）。
  - スライスは当該IDの行のみ更新（新規ID追加はしない）。

使い方:
  python3 ee_merge.py --check   # ゲートのみ（書き込みなし）
  python3 ee_merge.py --apply
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
EE_DIR = L.DOC_ROOT / "message_inventory" / "slices" / "ee"
FUNCTIONS = L.DOC_ROOT / "functions"
FID_RE = re.compile(r"^[a-z]\d{2}-\d{2}$")


def existing_fids() -> set[str]:
    out = set()
    for md in FUNCTIONS.rglob("*.md"):
        m = re.match(r"([a-z]\d{2}-\d{2})_", md.name)
        if m:
            out.add(m.group(1))
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if not (args.check or args.apply):
        ap.error("--check か --apply")

    docs = existing_fids()
    lines = TSV.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}
    jcol = ic["機能候補(要検証)"]
    master = {l.split("\t")[0]: l.split("\t") for l in lines[1:] if l.strip()}

    updated = 0
    ghost = 0
    for sp in sorted(EE_DIR.glob("*.resolved.tsv")):
        for line in sp.read_text(encoding="utf-8").splitlines()[1:]:
            f = line.split("\t")
            if not f or f[0] not in master:
                continue
            f = (f + [""] * len(hdr))[: len(hdr)]
            cand = f[jcol].strip()
            s = [x.strip() for x in cand.split(",") if FID_RE.match(x.strip())]
            if len(s) == 1 and s[0] not in docs:
                # 存在しない機能への割当はゲートで未割当へ戻す
                f[jcol] = f"未割当（割当 {s[0]} は設計書不在・要再検証）"
                ghost += 1
            if args.apply:
                master[f[0]] = f
                updated += 1

    print(f"スライス反映対象={updated}  設計書不在の割当を差戻し={ghost}")
    if args.apply:
        order = [l.split("\t")[0] for l in lines[1:] if l.strip()]
        TSV.write_text("\t".join(hdr) + "\n" + "\n".join("\t".join(master[m]) for m in order) + "\n", encoding="utf-8")
        print(f"merged -> {TSV.name}")


if __name__ == "__main__":
    main()
