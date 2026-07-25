#!/usr/bin/env python3
"""新規フロントメッセージ(F0*-MSG)を機能docの『表示メッセージ』表へ埋め込む（捏造ゼロ・冪等）。

既存 append_doc_rows.py は英語列が無い旧仕様で6列表を破壊するため、フロント用の
正典フォーマットに合わせた専用埋込を行う:
  | メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
  ← どこに / メッセージ内容 / メッセージ内容(英語) / トリガー（条件） / 後続処理

方針:
- 埋込対象は F0*-MSG 行のうち、まだ doc に出現していないID（冪等）。文言は正本TSV逐語。
- doc の `## 表示メッセージ` 節に**正典ヘッダの表があれば末尾に追記**。無ければ節末に新表を追加。
- `## 表示メッセージ` 節自体が無ければ、次の `## ` 直前（無ければEOF）に節を新設。
- 既存の手書き表・他フォーマット表には一切触れない（破壊防止）。

使い方: python3 embed_front_msgs_doc.py --dry-run / --apply
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
FUNCTIONS = L.DOC_ROOT / "functions"
HEADER = "| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |"
SEP = "|---|---|---|---|---|---|"
CANON_HDR_RE = re.compile(
    r"^\|\s*メッセージID\s*\|\s*表示位置\s*\|\s*画面上の文言\s*\|\s*画面上の文言\(英語\)\s*\|"
    r"\s*表示条件\s*\|\s*後続処理\s*\|\s*$"
)


def cell(s: str) -> str:
    """md表セルへ（改行/パイプ無害化）。内容は変えない。"""
    return s.replace("|", "\\|").replace("\\n", "<br>").replace("\n", "<br>").strip() or "—"


def doc_for(fid: str) -> Path | None:
    hits = sorted(FUNCTIONS.rglob(f"{fid.lower()}_*.md"))
    return hits[0] if hits else None


def build_rows(rs, ic) -> list[str]:
    out = []
    for r in sorted(rs, key=lambda x: x[0]):
        vals = [r[0], cell(r[ic["どこに"]]), cell(r[ic["メッセージ内容"]]),
                cell(r[ic["メッセージ内容(英語)"]]), cell(r[ic["トリガー（条件）"]]),
                cell(r[ic["後続処理"]])]
        out.append("| " + " | ".join(vals) + " |")
    return out


def embed(text: str, rows: list[str]) -> str:
    lines = text.splitlines()
    n = len(lines)
    # 1) 表示メッセージ節を特定
    sec_start = None
    for i, l in enumerate(lines):
        if l.strip() == "## 表示メッセージ":
            sec_start = i
            break
    if sec_start is None:
        # 節新設: 正典配置に合わせ、以下の見出しの直前に挿入（先に見つかった方）。
        # 無ければ末尾。
        anchors = ["## 業務ルール・計算", "## エラー処理", "## 入出力", "## バリデーション"]
        ins = n
        for a in anchors:
            hit = next((i for i, l in enumerate(lines) if l.strip() == a), None)
            if hit is not None:
                ins = hit
                break
        block = ["## 表示メッセージ", "", HEADER, SEP, *rows, ""]
        newlines = lines[:ins] + block + lines[ins:]
        return "\n".join(newlines).rstrip("\n") + "\n"

    # 節の範囲
    sec_end = n
    for i in range(sec_start + 1, n):
        if lines[i].startswith("## "):
            sec_end = i
            break

    # 2) 節内に正典ヘッダ表があれば、その本体末尾に追記
    for i in range(sec_start + 1, sec_end):
        if CANON_HDR_RE.match(lines[i]):
            # 区切り行の次から本体。本体末尾(非|行 or 節末)を探す
            j = i + 2
            while j < sec_end and lines[j].lstrip().startswith("|"):
                j += 1
            newlines = lines[:j] + rows + lines[j:]
            return "\n".join(newlines).rstrip("\n") + "\n"

    # 3) 正典表が無い → 節末に新表を追加（既存表は温存）
    j = sec_end
    # 節末の空行を詰めて表を置く
    while j > sec_start + 1 and lines[j - 1].strip() == "":
        j -= 1
    block = ["", HEADER, SEP, *rows]
    newlines = lines[:j] + block + lines[j:]
    return "\n".join(newlines).rstrip("\n") + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not (args.apply or args.dry_run):
        ap.error("--apply か --dry-run")

    lines = TSV.read_text(encoding="utf-8").splitlines()
    ic = {h: i for i, h in enumerate(lines[0].split("\t"))}
    rows = [l.split("\t") for l in lines[1:] if l.strip()]

    present: set[str] = set()
    idre = re.compile(r"\b([A-Z0-9]+(?:-[A-Z0-9]+)*-MSG-\d{3})\b")
    for md in FUNCTIONS.rglob("*.md"):
        present |= set(idre.findall(md.read_text(encoding="utf-8", errors="replace")))

    todo: dict[str, list] = defaultdict(list)
    for r in rows:
        mid = r[0]
        if not re.match(r"F0\d", mid) or mid in present:
            continue
        fid = mid.rpartition("-MSG-")[0].lower()
        todo[fid].append(r)

    total = added = nodoc = 0
    for fid, rs in sorted(todo.items()):
        total += len(rs)
        md = doc_for(fid)
        if md is None:
            nodoc += len(rs)
            print(f"[{fid}] docなし → skip ({len(rs)}件)")
            continue
        text = md.read_text(encoding="utf-8")
        new = embed(text, build_rows(rs, ic))
        added += len(rs)
        mode = "新設" if "## 表示メッセージ" not in text else "追記"
        print(f"[{fid}] +{len(rs)}行 ({mode})  {md.name}")
        if args.apply:
            md.write_text(new, encoding="utf-8")

    print(f"\n対象={total}  埋込={added}  docなし={nodoc}")
    if args.dry_run:
        print("(dry-run)")


if __name__ == "__main__":
    main()
