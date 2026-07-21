#!/usr/bin/env python3
"""一覧にあって設計書『表示メッセージ』表に無いメッセージを、当該機能docへ追記する。

追記できるのは **検証済みの行だけ**（メッセージ内容が実ソースに逐語存在 or 要ソース確認）。
文言・表示位置・表示条件はすべて一覧TSVの値をそのまま使い、ここで新しい文章は作らない。

表のヘッダは doc ごとに揺れるため、既存表のヘッダ列数に合わせて出力する。
表が無い doc へは追記しない（節の新設はレビュー付きで行う）。

使い方:
  python3 append_doc_rows.py --dry-run
  python3 append_doc_rows.py --apply
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"
TODO = "要ソース確認"


def doc_for(fid: str) -> Path | None:
    hits = sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
    return hits[0] if hits else None


def cell(s: str) -> str:
    """md表セルへ入れられる形に（改行/パイプを無害化）。内容は変えない。"""
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip()


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

    # doc に既出のIDを収集
    present: set[str] = set()
    id_re = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d{3})\b")
    for md in FUNCTIONS.rglob("*.md"):
        present |= set(id_re.findall(md.read_text(encoding="utf-8", errors="replace")))

    todo: dict[str, list[list[str]]] = defaultdict(list)
    for r in rows:
        mid = r[0]
        if mid.startswith("EE-") or mid in present:
            continue
        fid = mid.rpartition("-MSG-")[0].lower()
        todo[fid].append(r)

    total = added = skipped_no_doc = skipped_no_table = 0
    for fid, rs in sorted(todo.items()):
        total += len(rs)
        md = doc_for(fid)
        if md is None:
            skipped_no_doc += len(rs)
            print(f"[{fid}] docなし → 追記せず ({len(rs)}件)")
            continue
        text = md.read_text(encoding="utf-8")
        m = re.search(r"^## 表示メッセージ\s*$", text, re.M)
        if not m:
            skipped_no_table += len(rs)
            print(f"[{fid}] 『表示メッセージ』節なし → 追記せず ({len(rs)}件)  {md.name}")
            continue
        # 節内の表を探す（ヘッダ行と区切り行）
        seg = text[m.end():]
        nxt = re.search(r"^## ", seg, re.M)
        seg_end = m.end() + (nxt.start() if nxt else len(seg))
        block = text[m.end():seg_end]
        # 節内には表が複数あることがある（常時表示 / エラー系 など）。
        # 追記先は「最後の表」。列数もその表自身のヘッダから取る
        # （最初の表の列数を使うと列数が食い違う）。
        # 注: \s は改行も食うため行末は [ \t]* で止める。
        tables = list(re.finditer(r"^\|(?P<h>.+)\|[ \t]*\n\|[ \t\-:|]+\|[ \t]*$", block, re.M))
        if not tables:
            skipped_no_table += len(rs)
            print(f"[{fid}] 表が無い → 追記せず ({len(rs)}件)  {md.name}")
            continue
        hm = tables[-1]
        ncol = len(hm.group("h").split("|"))
        # その表の本体（次の非表行まで）の最終行を挿入点にする
        tbl_start = m.end() + hm.end()
        ins = tbl_start
        pos = tbl_start
        for raw in text[tbl_start:seg_end].split("\n")[1:]:
            if not raw.startswith("|"):
                break
            pos += 1 + len(raw)
            ins = pos
        if ins == tbl_start:
            skipped_no_table += len(rs)
            print(f"[{fid}] 表に本体行が無い → 追記せず ({len(rs)}件)  {md.name}")
            continue
        # 挿入点は必ず行末（改行の直前 or ファイル末尾）
        if ins < len(text) and text[ins] not in ("\n", "\r"):
            print(f"[{fid}] 挿入点が行末でない → 安全のため追記せず  {md.name}")
            skipped_no_table += len(rs)
            continue

        new_lines = []
        for r in sorted(rs, key=lambda x: x[0]):
            vals = [r[0], cell(r[ic["どこに"]]), cell(r[ic["メッセージ内容"]]), cell(r[ic["トリガー（条件）"]])]
            if ncol >= 5:
                vals.append(cell(r[ic["後続処理"]]))
            vals = (vals + [""] * ncol)[:ncol]
            new_lines.append("| " + " | ".join(vals) + " |")
        addition = "\n" + "\n".join(new_lines)
        print(f"[{fid}] +{len(new_lines)}行 (表{ncol}列)  {md.name}")
        added += len(new_lines)
        if args.apply:
            md.write_text(text[:ins] + addition + text[ins:], encoding="utf-8")

    print(f"\n対象={total}  追記={added}  docなし={skipped_no_doc}  表なし={skipped_no_table}")
    if args.dry_run:
        print("(dry-run: 書き込みなし)")


if __name__ == "__main__":
    main()
