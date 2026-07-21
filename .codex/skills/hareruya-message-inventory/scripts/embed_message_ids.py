#!/usr/bin/env python3
"""機能docの『表示メッセージ』表に メッセージID 列を付与する（決定的・冪等）。

方針（捏造ゼロ・間違い防止）:
- メッセージIDが機能ID（例 M04-12）を接頭に持つ行だけを、その機能docへ埋め込む。
- 表内の日本語文言セルと一覧の「メッセージ内容」を正規化して**厳密/包含一致**した
  行にのみIDを入れる。曖昧なもの・未一致は空欄（—）にして後段codexへ委譲する。
- 既にID列がある表は再利用（冪等）。手作業やcodexの追記を壊さない。
- 一致しなかった一覧側メッセージは stdout に「未埋め込み」として列挙（codexが追記判断）。

使い方:
  python3 embed_message_ids.py --fid m04-12          # 単一機能
  python3 embed_message_ids.py --all                 # 全マッピング機能
  python3 embed_message_ids.py --fid m04-12 --dry-run
"""
from __future__ import annotations

import argparse
import csv
import re
import unicodedata
from pathlib import Path

import lib_messages as L

TSV = L.DOC_ROOT / "message_inventory" / "message_inventory.tsv"
ID_COL = "メッセージID"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[`'\"（）()\s、。：:；;！!？?　]", "", s)
    return s.strip()


def load_fid_docs() -> dict[str, Path]:
    _f, _r, meta = L.load_function_map()
    out: dict[str, Path] = {}
    for fid, m in meta.items():
        dp = m.get("doc_path", "")
        if not dp:
            continue
        # doc_path 例: hareruya-design-docs/functions/ec-cube-enterprise/x.md
        rel = dp.split("hareruya-design-docs/", 1)[-1]
        p = L.DOC_ROOT / rel
        if p.exists():
            out[fid] = p
    return out


def messages_for_fid(fid: str) -> list[tuple[str, str]]:
    """(メッセージID, メッセージ内容) を返す（当該機能接頭のIDのみ）。"""
    area = fid.upper().replace("_", "-") + "-MSG-"
    out: list[tuple[str, str]] = []
    with TSV.open(encoding="utf-8") as fh:
        for r in csv.DictReader(fh, delimiter="\t"):
            if r[ID_COL].startswith(area):
                out.append((r[ID_COL], r["メッセージ内容"]))
    return out


def embed_doc(fid: str, path: Path, dry: bool) -> tuple[int, list[str]]:
    msgs = messages_for_fid(fid)
    if not msgs:
        return 0, []
    norm_index = [(mid, norm(content)) for mid, content in msgs if content and "要ソース確認" not in content]
    used: set[str] = set()
    lines = path.read_text(encoding="utf-8").splitlines()

    def is_sep_line(s: str) -> bool:
        if not s.lstrip().startswith("|"):
            return False
        cs = [c.strip() for c in s.strip().strip("|").split("|")]
        return bool(cs) and all(re.fullmatch(r":?-{2,}:?", c) or c == "" for c in cs)

    out: list[str] = []
    in_section = False
    embedded = 0
    table_has_id = False       # 現在の表が既にID列を持つか（冪等）
    for idx, line in enumerate(lines):
        if re.match(r"^## ", line):  # レベル2見出しのみで節を切替（###小見出しは節内）
            in_section = line.strip() == "## 表示メッセージ"
        is_table_row = in_section and line.lstrip().startswith("|")
        if not is_table_row:
            out.append(line)
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        nxt = lines[idx + 1] if idx + 1 < len(lines) else ""
        is_header = is_sep_line(nxt)      # 次行が区切り＝この行がヘッダ（Markdown定義）
        is_sep = is_sep_line(line)

        if is_header:
            table_has_id = cells and cells[0] == ID_COL
            out.append(line if table_has_id else "| " + " | ".join([ID_COL] + cells) + " |")
            continue
        if table_has_id:
            out.append(line)  # この表は既に処理済み: 一切触らない（冪等）
            continue
        if is_sep:
            out.append("| " + " | ".join(["---"] + cells) + " |")
            continue
        # データ行: 文言セルと一致するIDを探す
        rown = norm("".join(cells))
        found = ""
        for mid, cn in norm_index:
            if mid in used or not cn:
                continue
            if cn in rown or rown in cn:
                found = mid
                used.add(mid)
                embedded += 1
                break
        out.append("| " + " | ".join([found or "—"] + cells) + " |")

    if not dry and embedded:
        path.write_text("\n".join(out) + "\n", encoding="utf-8")
    unmatched = [f"{mid}: {c[:40]}" for mid, c in msgs if mid not in used]
    return embedded, unmatched


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fid")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    fid_docs = load_fid_docs()
    targets = []
    if args.all:
        targets = sorted(fid_docs)
    elif args.fid:
        targets = [args.fid]
    else:
        ap.error("--fid または --all を指定")

    total_emb = 0
    for fid in targets:
        path = fid_docs.get(fid)
        if not path:
            print(f"[skip] {fid}: docなし")
            continue
        emb, unmatched = embed_doc(fid, path, args.dry_run)
        total_emb += emb
        tag = "(dry)" if args.dry_run else ""
        print(f"[{fid}]{tag} 埋込={emb}  未埋込(codex追記候補)={len(unmatched)}  {path.name}")
        for u in unmatched[:8]:
            print("    -", u)
    print(f"\n合計 埋込={total_emb}")


if __name__ == "__main__":
    main()
