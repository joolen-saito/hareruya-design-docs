#!/usr/bin/env python3
"""M*/F* 納品メッセージIDの欠番を詰めて連番化する（全参照同期・捏造ゼロ）。

方針:
- 正本 message_inventory.tsv の各機能エリア(接頭 M*/F*)内で、既存MSG番号を昇順に
  1..N へ再採番。EE-* バケットは対象外（除外IDの跡なので触らない）。
- old→new の写像を作り、**IDを参照する全ファイル**へ同時適用（トークン単位・1回置換で衝突回避）。
  対象: message_inventory/*.tsv,*.md / functions/**/*.md / function_spec_html_preview/**/*.html /
        integration_test/**/*.md ほかリポジトリ全体の .md/.tsv/.csv/.json/.html。
- 文言・内容は一切変更しない（IDトークンの数値サフィックスのみ）。

使い方:
  python3 renumber_msg_ids.py --report        # remap と対象ファイルを提示（書込なし）
  python3 renumber_msg_ids.py --apply         # 全ファイルへ適用
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

ROOT = L.DOC_ROOT
TSV = ROOT / "message_inventory" / "message_inventory.tsv"
ID_RE = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*)-MSG-(\d{3})\b")
# 連番化対象エリア（納品ID）: M* / F* 。EE-* は対象外。
TARGET_AREA = re.compile(r"^[MF]\d")
# HTMLは md からの生成物のため remap 対象外（並列再生成との競合回避）。md 修正後に再生成する。
EXTS = {".md", ".tsv", ".csv", ".json"}
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".cursor", ".codex"}


def build_remap() -> dict[str, str]:
    lines = TSV.read_text(encoding="utf-8").splitlines()
    ids = [l.split("\t")[0] for l in lines[1:] if l.strip()]
    area_nums: dict[str, list[int]] = defaultdict(list)
    for mid in ids:
        m = ID_RE.match(mid)
        if m and TARGET_AREA.match(m.group(1)):
            area_nums[m.group(1)].append(int(m.group(2)))
    remap: dict[str, str] = {}
    for area, nums in area_nums.items():
        for new_i, old_n in enumerate(sorted(nums), start=1):
            if old_n != new_i:
                remap[f"{area}-MSG-{old_n:03d}"] = f"{area}-MSG-{new_i:03d}"
    return remap


def apply_to_text(text: str, remap: dict[str, str]) -> tuple[str, int]:
    cnt = 0

    def sub(m: re.Match) -> str:
        nonlocal cnt
        full = m.group(0)
        new = remap.get(full)
        if new:
            cnt += 1
            return new
        return full

    return ID_RE.sub(sub, text), cnt


def iter_files():
    for p in ROOT.rglob("*"):
        if p.suffix not in EXTS or not p.is_file():
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if not (args.report or args.apply):
        ap.error("--report か --apply")

    remap = build_remap()
    print(f"remap 対象ID数: {len(remap)}")
    # エリア別サマリ
    by_area = defaultdict(int)
    for k in remap:
        by_area[ID_RE.match(k).group(1)] += 1
    for a in sorted(by_area):
        print(f"  {a}: {by_area[a]}件")

    if args.report:
        print("\n--- remap 明細（先頭40） ---")
        for i, (o, n) in enumerate(sorted(remap.items())):
            if i >= 40:
                print(f"  … 他 {len(remap)-40} 件")
                break
            print(f"  {o} -> {n}")
        files = [p for p in iter_files() if ID_RE.search(p.read_text(encoding='utf-8', errors='replace'))]
        print(f"\nID を含むファイル: {len(files)}")
        return

    files_changed = tot = 0
    for p in iter_files():
        text = p.read_text(encoding="utf-8", errors="replace")
        if "-MSG-" not in text:
            continue
        new, cnt = apply_to_text(text, remap)
        if cnt:
            p.write_text(new, encoding="utf-8")
            files_changed += 1
            tot += cnt
    print(f"\n適用: {files_changed}ファイル / {tot}トークン置換")


if __name__ == "__main__":
    main()
