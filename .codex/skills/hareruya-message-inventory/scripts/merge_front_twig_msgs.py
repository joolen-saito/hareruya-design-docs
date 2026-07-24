#!/usr/bin/env python3
"""codex 判定済みフロント twig メッセージ(/tmp/front_msgs_final.json)を正本へ統合する。

- verdict=message のみ。fid 未確定は EE-FRONT へ退避。
- 文言(ja/en)は yaml 逐語。メタは codex 由来。不能は 要ソース確認。
- 既存ID台帳(id_map)は触らず、追記のみ。冪等: 同一(key,fid)が既存なら skip。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

TSV = Path("message_inventory/message_inventory.tsv")
FID2NAME = json.load(open("/tmp/fid2name.json", encoding="utf-8"))
MSGS = json.load(open("/tmp/front_msgs_final.json", encoding="utf-8"))

DAIBUNRUI = {"f01": "トップ", "f02": "グローバルナビ", "f03": "商品", "f04": "カート",
             "f05": "ネット買取", "f06": "会員", "f07": "イベント", "f08": "店頭買取"}


def esc(s: str) -> str:
    """セル値の実改行/タブを正本規約(\\n)へ。TSV行破壊を防ぐ。"""
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
    lines = TSV.read_text(encoding="utf-8").split("\n")
    header = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(header)}
    body = [l for l in lines[1:] if l.strip()]

    # 既存: fid→画面ラベル, fid→最大MSG番号, 既存(key in 根拠)集合
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
        grp = fid[:3]
        name = FID2NAME.get(fid, fid)
        return f"{area} {DAIBUNRUI.get(grp, '')} — {name}".replace("  ", " ")

    added = 0
    skipped = 0
    for o in MSGS:
        key = o["key"]
        fid = primary_fid(o.get("fid", ""))
        area = fid.upper() if fid else "EE-FRONT"
        # 冪等: 同キーが既存根拠にあれば skip
        if key in existing_ev:
            skipped += 1
            continue
        maxnum[area] = maxnum.get(area, 0) + 1
        mid = f"{area}-MSG-{maxnum[area]:03d}"
        ja = o["ja"]
        en = o.get("en") or "（英訳なし）"
        kind = o.get("kind") or "要ソース確認"
        where = o.get("where") or "要ソース確認"
        disp = o.get("disp") or "要ソース確認"
        trigger = o.get("trigger") or "要ソース確認"
        followup = o.get("followup") or "要ソース確認"
        occ = o.get("occ") or ""
        ev = f"{occ}; trans key {key}（messages.ja.yaml）"
        row = [""] * len(header)
        row[ic["メッセージID"]] = mid
        row[ic["画面"]] = esc(screen_label(fid) if fid else "フロント（機能未確定）")
        row[ic["要素"]] = esc(derive_element(ja))
        row[ic["トリガー（条件）"]] = esc(trigger)
        row[ic["種別"]] = esc(kind)
        row[ic["どこに"]] = esc(where)
        row[ic["要素(表示)"]] = esc(disp)
        row[ic["メッセージ内容"]] = esc(ja)
        row[ic["メッセージ内容(英語)"]] = esc(en)
        row[ic["後続処理"]] = esc(followup)
        row[ic["根拠(file:line)"]] = esc(ev)
        row[ic["解決状態"]] = "key(front twig trans / codex割当)"
        row[ic["機能候補(要検証)"]] = fid or "要ソース確認"
        body.append("\t".join(row))
        added += 1

    TSV.write_text("\t".join(header) + "\n" + "\n".join(body) + "\n", encoding="utf-8")
    print(f"統合: 追加{added}件 / 冪等skip{skipped}件 / 総行{len(body)}")


if __name__ == "__main__":
    main()
