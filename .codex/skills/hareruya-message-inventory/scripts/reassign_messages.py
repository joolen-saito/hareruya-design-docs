#!/usr/bin/env python3
"""レビューで確定した誤割当メッセージを正しい機能へ移す（ID再採番＋doc行移動）。

入力: [{"id":"M15-01-MSG-034","to":"m15-05"}, ...]（idは現行マスタのID、to は正しい機能ID）
処理:
  1) マスタTSV: 当該行のIDを <TO>-MSG-### へ（TO側の次番号）、機能候補=to、画面=to タイトルへ。
  2) 旧設計書の表から当該IDの行を削除。
  3) 新設計書の表へ当該行を追加（append_doc_rows と同じ整形）。表が無ければ節新設。
  4) id_map.tsv も追従。

捏造は増やさない（文言・条件はそのまま移すだけ）。見出しは壊さない。

使い方:
  python3 reassign_messages.py --plan /tmp/real_mis.json --dry-run
  python3 reassign_messages.py --plan /tmp/real_mis.json --apply
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
ID_MAP = L.DOC_ROOT / "message_inventory" / "id_map.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"


def doc_for(fid: str) -> Path | None:
    hits = sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
    return hits[0] if hits else None


def doc_title(fid: str) -> str:
    md = doc_for(fid)
    if md:
        for line in md.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                return line[2:].strip()
    return fid


def cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip()


def remove_doc_row(md: Path, mid: str) -> bool:
    text = md.read_text(encoding="utf-8")
    lines = text.splitlines()
    out = [l for l in lines if not (l.startswith("|") and re.search(rf"\b{re.escape(mid)}\b", l))]
    if len(out) != len(lines):
        md.write_text("\n".join(out) + "\n", encoding="utf-8")
        return True
    return False


def add_doc_row(md: Path, mid: str, where: str, content: str, trigger: str) -> str:
    text = md.read_text(encoding="utf-8")
    row = "| " + " | ".join([mid, cell(where), cell(content), cell(trigger)]) + " |"
    m = re.search(r"^## 表示メッセージ\s*$", text, re.M)
    if not m:
        # 節新設（アンカー前 or 文末）
        anchors = ["## 業務ルール・計算", "## 集計条件", "## データ整合性", "## API/バッチ結果",
                   "## 入出力", "## バリデーション", "## 権限・認可", "## 画面遷移"]
        section = "## 表示メッセージ\n\n| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |\n|---|---|---|---|\n" + row
        pos = None
        for a in anchors:
            am = re.search(r"^" + re.escape(a) + r"\s*$", text, re.M)
            if am:
                pos = am.start()
                break
        if pos is None:
            md.write_text(text.rstrip() + "\n\n" + section + "\n", encoding="utf-8")
        else:
            md.write_text(text[:pos] + section + "\n\n" + text[pos:], encoding="utf-8")
        return "節新設"
    # 既存表の最後の表本体行の直後へ
    seg = text[m.end():]
    nxt = re.search(r"^## ", seg, re.M)
    seg_end = m.end() + (nxt.start() if nxt else len(seg))
    tables = list(re.finditer(r"^\|(?P<h>.+)\|[ \t]*\n\|[ \t\-:|]+\|[ \t]*$", text[m.end():seg_end], re.M))
    if not tables:
        return "表なし(skip)"
    hm = tables[-1]
    tbl_start = m.end() + hm.end()
    ins = tbl_start
    for raw in text[tbl_start:seg_end].split("\n")[1:]:
        if not raw.startswith("|"):
            break
        ins += 1 + len(raw)
    if ins < len(text) and text[ins] not in ("\n", "\r"):
        return "挿入不可(skip)"
    md.write_text(text[:ins] + "\n" + row + text[ins:], encoding="utf-8")
    return "追記"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    plan = json.load(open(args.plan, encoding="utf-8"))
    # id -> to
    mapping = {p["id"]: p["to"] for p in plan if p.get("to") and p["to"] != "null"}

    lines = TSV.read_text(encoding="utf-8").splitlines()
    hdr = lines[0].split("\t")
    ic = {h: i for i, h in enumerate(hdr)}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    used: dict[str, set[int]] = defaultdict(set)
    for r in rows:
        a, _, n = r[0].rpartition("-MSG-")
        if n.isdigit():
            used[a].add(int(n))

    idmap: dict[str, str] = {}
    plan_rows = []
    for r in rows:
        if r[0] in mapping:
            to = mapping[r[0]].upper()
            n = (max(used[to]) if used[to] else 0) + 1
            used[to].add(n)
            newid = f"{to}-MSG-{n:03d}"
            idmap[r[0]] = newid
            plan_rows.append((r, newid))

    print(f"再割当対象: {len(plan_rows)}件")
    for r, newid in plan_rows:
        print(f"  {r[0]} → {newid}")

    if args.dry_run:
        return

    # マスタ更新
    for r, newid in plan_rows:
        old = r[0]
        to = mapping[old]
        # doc 移動
        src_md = doc_for(old.rpartition("-MSG-")[0].lower())
        dst_md = doc_for(to)
        content = r[ic["メッセージ内容"]]
        where = r[ic["どこに"]]
        trigger = r[ic["トリガー（条件）"]]
        if src_md:
            remove_doc_row(src_md, old)
        if dst_md:
            st = add_doc_row(dst_md, newid, where, content, trigger)
        else:
            st = "docなし"
        # TSV行
        r[0] = newid
        r[ic["機能候補(要検証)"]] = to
        r[ic["画面"]] = f"{to} {doc_title(to)}"
        print(f"  applied {old}->{newid}  doc={st}")

    order_out = "\t".join(hdr) + "\n" + "\n".join("\t".join(r) for r in rows) + "\n"
    TSV.write_text(order_out, encoding="utf-8")

    # id_map 追従
    if ID_MAP.exists():
        out = []
        for line in ID_MAP.read_text(encoding="utf-8").splitlines():
            if "\t" in line:
                k, v = line.split("\t", 1)
                if v in idmap:
                    parts = k.split("|")
                    parts[0] = idmap[v].rpartition("-MSG-")[0]
                    k, v = "|".join(parts), idmap[v]
                out.append(f"{k}\t{v}")
        ID_MAP.write_text("\n".join(sorted(out)) + "\n", encoding="utf-8")

    print(f"\napplied {len(plan_rows)}件")


if __name__ == "__main__":
    main()
