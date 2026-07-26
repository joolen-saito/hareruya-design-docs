#!/usr/bin/env python3
"""エラー系候補(codex判定 verdict=message)を正本へ統合する（捏造ゼロ・冪等）。

候補は occ(file:line) で同定。クラス別に根拠(evidence)を正確に記す:
- php_exception (trans key)   → 「{occ}; 例外メッセージ trans key {key}（messages.ja.yaml）」
- php_exception (literal)     → 「{occ}; 例外メッセージ(ソース直リテラル)」
- php_json_literal            → 「{occ}; JsonResponse 直リテラル」
- twig_hardcoded              → 「{occ}; twig ハードコード表示(|trans無し)」
fid 未確定は EE-ERROR バケットへ退避（MESSAGE_LIST/連番化の対象外）。

使い方: python3 merge_error_msgs.py [--dry-run]
"""
from __future__ import annotations

import argparse
import glob
import json
import re
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
FID2NAME = json.load(open("/tmp/fid2name.json", encoding="utf-8")) if Path("/tmp/fid2name.json").exists() else {}
EVID = {
    "php_exception_key": "{occ}; 例外メッセージ trans key {key}（messages.ja.yaml）",
    "php_exception_lit": "{occ}; 例外メッセージ(ソース直リテラル)",
    "php_json_literal": "{occ}; JsonResponse 直リテラル(Ajaxエラー)",
    "twig_hardcoded": "{occ}; twig ハードコード表示(|trans無し)",
}


def esc(s: str) -> str:
    if s is None:
        return ""
    return s.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "\\n").replace("\t", " ")


def primary_fid(raw: str) -> str:
    if not raw or raw in ("要ソース確認", "null", "None", ""):
        return ""
    return re.split(r"[,\s/／]+", raw.strip())[0].lower()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cands = {c["occ"]: c for c in json.load(open("/tmp/error_msg_candidates.json", encoding="utf-8"))}
    verd = {}
    for d in ("/tmp/error_assign", "/tmp/error_assign_miss"):
        for f in sorted(glob.glob(d + "/batch_*.json")):
            for o in json.load(open(f, encoding="utf-8")):
                verd[o["occ"]] = o

    lines = TSV.read_text(encoding="utf-8").split("\n")
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    body = [l for l in lines[1:] if l.strip()]
    existing_ev = "\n".join(body)
    screen = {}
    maxnum = {}
    for l in body:
        f = l.split("\t")
        area = re.sub(r"-MSG-.*", "", f[0])
        n = f[0].split("-MSG-")[-1]
        if n.isdigit():
            maxnum[area] = max(maxnum.get(area, 0), int(n))
        if f[ic["画面"]]:
            screen.setdefault(area, f[ic["画面"]])

    def screen_label(fid: str) -> str:
        a = fid.upper()
        if a in screen:
            return screen[a]
        return f"{a} — {FID2NAME.get(fid, fid)}"

    added = skipped = 0
    for occ, o in verd.items():
        if o.get("verdict") != "message":
            continue
        c = cands.get(occ)
        if not c:
            continue
        if occ in existing_ev:
            skipped += 1
            continue
        fid = primary_fid(o.get("fid", ""))
        area = fid.upper() if fid else "EE-ERROR"
        maxnum[area] = maxnum.get(area, 0) + 1
        mid = f"{area}-MSG-{maxnum[area]:03d}"
        cls = c["cls"]
        if cls == "php_exception" and c.get("key"):
            ev = EVID["php_exception_key"].format(occ=occ, key=c["key"])
        elif cls == "php_exception":
            ev = EVID["php_exception_lit"].format(occ=occ)
        else:
            ev = EVID[cls].format(occ=occ)
        en = o.get("en") or c.get("en") or "（英訳なし）"
        row = [""] * len(header)
        row[ic["メッセージID"]] = mid
        row[ic["画面"]] = esc(screen_label(fid) if fid else "エラー系（機能未確定）")
        row[ic["要素"]] = "要ソース確認"
        row[ic["トリガー（条件）"]] = esc(o.get("trigger") or "要ソース確認")
        row[ic["種別"]] = esc(o.get("kind") or "エラー")
        row[ic["どこに"]] = esc(o.get("where") or "要ソース確認")
        row[ic["要素(表示)"]] = esc(o.get("disp") or "要ソース確認")
        row[ic["メッセージ内容"]] = esc(c["ja"])
        row[ic["メッセージ内容(英語)"]] = esc(en)
        row[ic["後続処理"]] = esc(o.get("followup") or "要ソース確認")
        row[ic["根拠(file:line)"]] = esc(ev)
        row[ic["解決状態"]] = f"error源({cls}) / codex判定"
        row[ic["機能候補(要検証)"]] = fid or "要ソース確認"
        body.append("\t".join(row))
        added += 1

    if not args.dry_run:
        TSV.write_text("\t".join(header) + "\n" + "\n".join(body) + "\n", encoding="utf-8")
    print(f"統合: 追加{added} / 冪等skip{skipped} / 総行{len(body)}" + ("  (dry-run)" if args.dry_run else ""))


if __name__ == "__main__":
    main()
