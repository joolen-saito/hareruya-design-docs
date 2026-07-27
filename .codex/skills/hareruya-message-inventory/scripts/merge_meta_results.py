#!/usr/bin/env python3
"""codex_meta_driver.py の判定結果を正本 message_inventory.tsv へ統合する（冪等）。

安全策:
- **更新するのは現在値が「要ソース確認」で始まる列だけ**。確定済みセルは絶対に上書きしない。
- 判定が null / 空 / 「要ソース確認」の場合は据え置き（推測で埋めない）。
- 『メッセージ内容』『メッセージ内容(英語)』は本スクリプトの対象外（触れない）。
- 更新した行の『解決状態』末尾へ由来マーカーを1回だけ付す。

使い方:
  python3 merge_meta_results.py --results <dir> --dry-run
  python3 merge_meta_results.py --results <dir> --apply
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
MARKER = " / meta確定(codex)"

# 正本の列名 -> codex 出力のキー
COLS = {
    "要素": "element",
    "要素(表示)": "disp",
    "どこに": "where",
    "トリガー（条件）": "trigger",
    "後続処理": "followup",
}


def esc(s: str) -> str:
    return s.replace("\t", " ").replace("\r", "").replace("\n", "\\n").strip()


def load_results(d: Path) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for p in sorted(d.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            print(f"WARN: 解析不能 {p.name}")
            continue
        for mid, v in data.items():
            if isinstance(v, dict):
                out[mid] = v
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not args.apply and not args.dry_run:
        ap.error("--apply か --dry-run を指定してください")

    res = load_results(Path(args.results))
    lines = TSV.read_text(encoding="utf-8").splitlines()
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    i_state = ic["解決状態"]

    out, stats, touched_rows = [lines[0]], Counter(), 0
    for line in lines[1:]:
        if not line.strip():
            continue
        row = line.split("\t")
        v = res.get(row[0])
        if not v:
            out.append(line)
            continue
        touched = False
        for col, key in COLS.items():
            cur = row[ic[col]].strip()
            if not cur.startswith("要ソース確認"):
                continue  # 確定済みは不可侵
            new = v.get(key)
            if not isinstance(new, str):
                continue
            new = esc(new)
            if not new or new.startswith("要ソース確認"):
                stats[f"{col}:据置"] += 1
                continue
            row[ic[col]] = new
            stats[f"{col}:確定"] += 1
            touched = True
        if touched:
            touched_rows += 1
            if MARKER not in row[i_state]:
                row[i_state] = row[i_state] + MARKER
            print(f"{row[0]}: {', '.join(f'{c}={row[ic[c]][:32]}' for c in COLS if MARKER)}"[:200])
        out.append("\t".join(row))

    if args.apply:
        TSV.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"\n判定件数={len(res)} / 更新行={touched_rows}"
          + ("  (dry-run)" if not args.apply else ""))
    for k, n in sorted(stats.items()):
        print(f"  {k}: {n}")


if __name__ == "__main__":
    main()
