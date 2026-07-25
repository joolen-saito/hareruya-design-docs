#!/usr/bin/env python3
"""codex 判定済み twig メッセージ(front/admin 共通)を正本へ統合する（捏造ゼロ・冪等）。

merge_front_twig_msgs.py の汎用版。--msgs で最終JSON、--fid2name で機能名を渡す。
- verdict=message のみ（join 済み）。fid 未確定は EE-FRONT/EE-ADMIN へ退避。
- 文言(ja/en)は yaml 逐語。メタは codex 由来。不能は 要ソース確認。
- 既存の根拠(trans key)に同キーがあれば skip（冪等）。追記のみ。

使い方:
  python3 merge_twig_msgs.py --msgs /tmp/admin_msgs_final.json --fid2name /tmp/fid2name.json \
      --unresolved-area EE-ADMIN --resolve-tag "key(admin twig trans / codex割当)"
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"


def esc(s: str) -> str:
    if s is None:
        return ""
    return s.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "\\n").replace("\t", " ")


def primary_fid(raw: str) -> str:
    if not raw or raw in ("要ソース確認", "null", "None"):
        return ""
    return re.split(r"[,\s/／]+", raw.strip())[0].lower()


def derive_element(ja: str) -> str:
    m = re.match(r"^(.+?)を(入力|選択)してください", ja)
    if m:
        return f"{m.group(1)} {'入力欄' if m.group(2)=='入力' else '選択欄'}"
    return "要ソース確認"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--msgs", required=True)
    ap.add_argument("--fid2name", required=True)
    ap.add_argument("--unresolved-area", default="EE-ADMIN")
    ap.add_argument("--resolve-tag", default="key(admin twig trans / codex割当)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    FID2NAME = json.load(open(args.fid2name, encoding="utf-8"))
    MSGS = json.load(open(args.msgs, encoding="utf-8"))

    lines = TSV.read_text(encoding="utf-8").split("\n")
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    body = [l for l in lines[1:] if l.strip()]

    screen = {}
    maxnum = {}
    existing_ev = "\n".join(body)
    for l in body:
        f = l.split("\t")
        mid = f[0]
        area = re.sub(r"-MSG-.*", "", mid)
        n = mid.split("-MSG-")[-1]
        if n.isdigit():
            maxnum[area] = max(maxnum.get(area, 0), int(n))
        if f[ic["画面"]]:
            screen.setdefault(area, f[ic["画面"]])

    def screen_label(fid: str) -> str:
        area = fid.upper()
        if area in screen:
            return screen[area]
        name = FID2NAME.get(fid, fid)
        return f"{area} — {name}"

    added = skipped = 0
    for o in MSGS:
        key = o["key"]
        fid = primary_fid(o.get("fid", ""))
        area = fid.upper() if fid else args.unresolved_area
        if key in existing_ev:
            skipped += 1
            continue
        maxnum[area] = maxnum.get(area, 0) + 1
        mid = f"{area}-MSG-{maxnum[area]:03d}"
        ja = o["ja"]
        en = o.get("en") or "（英訳なし）"
        occ = o.get("occ") or ""
        ev = f"{occ}; trans key {key}（messages.ja.yaml）"
        row = [""] * len(header)
        row[ic["メッセージID"]] = mid
        row[ic["画面"]] = esc(screen_label(fid) if fid else "管理画面（機能未確定）")
        row[ic["要素"]] = esc(derive_element(ja))
        row[ic["トリガー（条件）"]] = esc(o.get("trigger") or "要ソース確認")
        row[ic["種別"]] = esc(o.get("kind") or "要ソース確認")
        row[ic["どこに"]] = esc(o.get("where") or "要ソース確認")
        row[ic["要素(表示)"]] = esc(o.get("disp") or "要ソース確認")
        row[ic["メッセージ内容"]] = esc(ja)
        row[ic["メッセージ内容(英語)"]] = esc(en)
        row[ic["後続処理"]] = esc(o.get("followup") or "要ソース確認")
        row[ic["根拠(file:line)"]] = esc(ev)
        row[ic["解決状態"]] = args.resolve_tag
        row[ic["機能候補(要検証)"]] = fid or "要ソース確認"
        body.append("\t".join(row))
        added += 1

    if not args.dry_run:
        TSV.write_text("\t".join(header) + "\n" + "\n".join(body) + "\n", encoding="utf-8")
    print(f"統合: 追加{added} / 冪等skip{skipped} / 総行{len(body)}"
          + ("  (dry-run)" if args.dry_run else ""))


if __name__ == "__main__":
    main()
