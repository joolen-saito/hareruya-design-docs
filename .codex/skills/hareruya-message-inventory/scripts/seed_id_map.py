#!/usr/bin/env python3
"""現行の raw_messages.jsonl と message_inventory.tsv から安定ID台帳 id_map.tsv を生成する（初回シード）。

再抽出（新規JSメッセージ追加など）で既存 -MSG-### が振り直されないよう、
(area, file, line, occ) → メッセージID を台帳に固定する。キーは build_inventory.py と同一。

重要: キーは raw_messages.jsonl（決定的・ソース由来の file:line）から作り、IDは現行マスタの
同位置行から取る。マスタ側の 根拠(file:line) は codex が補正している場合があるため位置対応で紐付ける
（raw のソート順 == 現行マスタ行順。両者は同一抽出）。

前提: このスクリプトは「新JS抽出を反映する前」の raw_messages.jsonl（現行マスタと同一抽出）で実行する。

使い方:
  python3 seed_id_map.py            # id_map.tsv を生成（既存があれば --force 必要）
  python3 seed_id_map.py --force
"""
from __future__ import annotations

import argparse
import csv
import json

import lib_messages as L
import build_inventory as B

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
RAW = L.DOC_ROOT / "message_inventory" / "raw_messages.jsonl"
ID_MAP = L.DOC_ROOT / "message_inventory" / "id_map.tsv"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    if ID_MAP.exists() and not args.force:
        ap.error(f"{ID_MAP} が既に存在。上書きは --force")

    master = []
    with TSV.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh, delimiter="\t"):
            master.append(r["メッセージID"].strip())

    _f, _r, meta = L.load_function_map()
    rows = [json.loads(l) for l in RAW.read_text(encoding="utf-8").splitlines() if l.strip()]
    rows.sort(key=lambda r: (r["file"], r["line"]))
    if len(rows) != len(master):
        ap.error(f"raw({len(rows)}) と master({len(master)}) の行数不一致。同一抽出で実行すること。")

    id_map: dict[str, str] = {}
    occ: dict[tuple, int] = {}
    bad = 0
    for i, r in enumerate(rows):
        _screen, fid = B.screen_for(r, meta)
        area = B.id_area(r, fid)
        if not master[i].startswith(area + "-MSG-"):
            bad += 1
            continue
        ok = (area, r["file"], r["line"])
        occ[ok] = occ.get(ok, 0) + 1
        key = f"{area}|{r['file']}|{r['line']}|{occ[ok] - 1}"
        id_map[key] = master[i]

    with ID_MAP.open("w", encoding="utf-8") as fh:
        for k in sorted(id_map):
            fh.write(f"{k}\t{id_map[k]}\n")
    print(f"seeded id_map: {len(id_map)} keys -> {ID_MAP}  (area-mismatch skipped={bad})")


if __name__ == "__main__":
    main()
