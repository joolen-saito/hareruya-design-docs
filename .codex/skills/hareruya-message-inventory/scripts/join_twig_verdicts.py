#!/usr/bin/env python3
"""codex 判定バッチ(verdict/fid/メタ)を候補(ja/en/occ)と結合し、message のみの最終JSONを作る。

front/admin 共通。merge_twig_msgs.py の入力になる。
使い方:
  python3 join_twig_verdicts.py --cands /tmp/admin_twig_candidates.json \
      --assign /tmp/admin_assign --out /tmp/admin_msgs_final.json
"""
from __future__ import annotations

import argparse
import glob
import json


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cands", required=True)
    ap.add_argument("--assign", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cands = {c["key"]: c for c in json.load(open(args.cands, encoding="utf-8"))}
    verd = {}
    for f in sorted(glob.glob(f"{args.assign}/batch_*.json")):
        for o in json.load(open(f, encoding="utf-8")):
            verd[o["key"]] = o  # 後勝ち（再実行分優先）

    out = []
    missing = [k for k in cands if k not in verd]
    for key, v in verd.items():
        if v.get("verdict") != "message":
            continue
        c = cands.get(key)
        if not c:
            continue
        out.append({
            "key": key,
            "ja": c["ja"],
            "en": c.get("en") or "",
            "occ": (c.get("occurrences") or [""])[0],
            "fid": v.get("fid") or "要ソース確認",
            "kind": v.get("kind") or "要ソース確認",
            "where": v.get("where") or "要ソース確認",
            "disp": v.get("disp") or "要ソース確認",
            "trigger": v.get("trigger") or "要ソース確認",
            "followup": v.get("followup") or "要ソース確認",
        })
    json.dump(out, open(args.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    vc = Counter(v.get("verdict") for v in verd.values())
    print(f"判定済 {len(verd)} / 未判定 {len(missing)} / verdict {dict(vc)} / message={len(out)} → {args.out}")
    if missing:
        print("未判定キー(先頭10):", missing[:10])


if __name__ == "__main__":
    main()
