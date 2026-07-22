#!/usr/bin/env python3
"""機能が確定した EE-* 行を <FID>-MSG-### へ再採番する。

codex/fable5 が実ソース根拠付きで単一機能へ確定した行だけを対象にする
（機能候補列が単一の機能ID形式のもの）。複数候補・未割当・理由文つきは対象外。

安定ID台帳 id_map.tsv と、既に設計書へ埋め込まれた旧IDの参照も追従更新する。

使い方:
  python3 renumber_assigned.py --dry-run
  python3 renumber_assigned.py --apply
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
ID_MAP = L.DOC_ROOT / "message_inventory" / "id_map.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"
FID_RE = re.compile(r"^[a-z]\d{2}-\d{2}$")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run を指定")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    # 既存の <FID>-MSG-### 使用番号（再採番の衝突回避）
    used: dict[str, set[int]] = defaultdict(set)
    for r in rows:
        area, _, num = r[0].rpartition("-MSG-")
        if num.isdigit():
            used[area].add(int(num))

    # ★対象は「codex/fable5 が実ソースで検証した行」だけに限定する。
    # build_inventory のヒューリスティック候補（トークン一致のヒント）は未検証なので
    # 絶対に再採番しない。検証済み＝レビュー済みスライスに存在するID。
    verified: set[str] = set()
    for sub in ("js", "ee"):
        for sl in (L.DOC_ROOT / "message_inventory" / "slices" / sub).glob("*.resolved.tsv"):
            for line in sl.read_text(encoding="utf-8").splitlines()[1:]:
                if line.strip():
                    verified.add(line.split("\t")[0])
    print(f"レビュー済み(再採番の候補母集合): {len(verified)} 行")

    mapping: dict[str, str] = {}
    for r in rows:
        if r[0] not in verified:
            continue
        cand = r[ic["機能候補(要検証)"]].strip() if len(r) > ic["機能候補(要検証)"] else ""
        # 単一の機能IDのみ（理由文・複数候補は対象外＝推測で動かさない）
        fids = [x.strip() for x in cand.split(",")]
        if len(fids) != 1 or not FID_RE.match(fids[0]):
            continue
        area = fids[0].upper()
        n = (max(used[area]) if used[area] else 0) + 1
        used[area].add(n)
        mapping[r[0]] = f"{area}-MSG-{n:03d}"

    print(f"再採番対象: {len(mapping)} 行")
    by_area: dict[str, int] = defaultdict(int)
    for _, new in mapping.items():
        by_area[new.rpartition("-MSG-")[0]] += 1
    for a, n in sorted(by_area.items()):
        print(f"  {a}: +{n}")

    # 設計書に埋め込み済みの旧IDを検出
    embedded = {}
    for md in FUNCTIONS.rglob("*.md"):
        text = md.read_text(encoding="utf-8", errors="replace")
        for old in mapping:
            if old in text:
                embedded.setdefault(old, []).append(md)
    if embedded:
        print(f"\n設計書に埋め込み済みの旧ID: {len(embedded)} 件（参照も更新する）")
        for old, mds in list(embedded.items())[:10]:
            print(f"  {old} -> {mapping[old]}  @ {', '.join(m.name for m in mds)}")

    if args.dry_run:
        return

    # 1. マスタTSV
    for r in rows:
        if r[0] in mapping:
            r[0] = mapping[r[0]]
    TSV.write_text("\t".join(hdr) + "\n" + "\n".join("\t".join(r) for r in rows) + "\n", encoding="utf-8")

    # 2. 安定ID台帳（キーの area 部分も新IDへ揃える）
    if ID_MAP.exists():
        out = []
        for line in ID_MAP.read_text(encoding="utf-8").splitlines():
            if "\t" not in line:
                continue
            k, v = line.split("\t", 1)
            if v in mapping:
                new = mapping[v]
                parts = k.split("|")
                parts[0] = new.rpartition("-MSG-")[0]
                k, v = "|".join(parts), new
            out.append(f"{k}\t{v}")
        ID_MAP.write_text("\n".join(sorted(out)) + "\n", encoding="utf-8")

    # 3. 設計書内の旧ID参照
    for old, mds in embedded.items():
        for md in mds:
            t = md.read_text(encoding="utf-8")
            md.write_text(re.sub(rf"\b{re.escape(old)}\b", mapping[old], t), encoding="utf-8")

    print(f"\napplied: master {len(mapping)}行 / id_map / docs {sum(len(v) for v in embedded.values())}箇所")


if __name__ == "__main__":
    main()
