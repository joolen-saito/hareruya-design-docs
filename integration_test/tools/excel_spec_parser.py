#!/usr/bin/env python3
"""Excel基本設計パーサ — オラクル源（新規実装＝Excelのみ／現行踏襲・カスタマイズのExcel言及部）。

excel_to_html/output/*.html を機能ID（A01-01 等）で索引し、機能ごとの仕様ブロックを
行番号付きで取り出す。テストの期待値（オラクル）はここから導く（実装から独立）。

  build_index()      : 全Excel文書を走査し {機能ID: [(doc, line)...]} を作る
  extract(機能ID)    : 当該機能の仕様ブロック（機能No→次の機能Noまで）を行番号付きで返す

使い方:
  python3 excel_spec_parser.py --index                 # 機能ID→文書 索引を表示
  python3 excel_spec_parser.py A01-01                  # A01-01 の仕様ブロック
"""
from __future__ import annotations
import argparse, glob, html, re, sys
from pathlib import Path

EXCEL_DIR = "excel_to_html/output"
FID_RE = re.compile(r"\b([A-Z]\d{2}-\d{2})\b")
# 「機能No A01-01」= 機能ブロックの開始マーカー
FUNC_MARK = re.compile(r"機能No\s*([A-Z]\d{2}-\d{2})")


def strip(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def doc_lines(path):
    """実ファイルの行番号を保ったまま <style> ブロックを空行化して返す
    （file:line 引用が実ファイルと一致するように）。"""
    joined = Path(path).read_text(encoding="utf-8")
    masked = re.sub(r"<style.*?</style>",
                    lambda m: "\n" * m.group(0).count("\n"), joined, flags=re.S)
    return masked.splitlines()


def build_index():
    """{機能ID: [(doc, line)...]}。機能Noマーカーの位置を記録。"""
    idx = {}
    for doc in sorted(glob.glob(f"{EXCEL_DIR}/*.html")):
        for i, l in enumerate(doc_lines(doc), 1):
            t = strip(l)
            m = FUNC_MARK.search(t)
            if m:
                idx.setdefault(m.group(1), []).append((doc, i))
    return idx


def extract(fid: str, idx=None):
    """機能ID の仕様ブロック（機能No行〜次の機能No行/文末）を行番号付きで返す。"""
    fid = fid.upper()
    idx = idx or build_index()
    if fid not in idx:
        return None
    doc, start = idx[fid][0]
    lines = doc_lines(doc)
    # 次の機能Noマーカー（別機能）まで
    end = len(lines)
    for j in range(start, len(lines)):
        m = FUNC_MARK.search(strip(lines[j]))
        if m and m.group(1) != fid:
            end = j
            break
    body = []
    for k in range(start - 1, end):
        t = strip(lines[k])
        if t and len(t) > 1:
            body.append({"line": k + 1, "text": t})
    return {"fid": fid, "doc": doc, "start": start, "end": end, "body": body}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fid", nargs="?")
    ap.add_argument("--index", action="store_true")
    ap.add_argument("--maxlines", type=int, default=60)
    args = ap.parse_args()
    idx = build_index()
    if args.index:
        print(f"# Excel基本設計 索引: {len(idx)} 機能ID")
        for fid in sorted(idx):
            docs = ", ".join(Path(d).name for d, _ in idx[fid])
            print(f"  {fid}\t{docs}")
        return
    if not args.fid:
        print("機能IDを指定（例 A01-01）。--index で一覧。")
        return
    r = extract(args.fid, idx)
    if not r:
        print(f"{args.fid}: Excel基本設計に見つからない")
        return
    print(f"# {r['fid']}  {Path(r['doc']).name}  L{r['start']}-{r['end']}")
    for b in r["body"][: args.maxlines]:
        print(f"L{b['line']}: {b['text'][:160]}")


if __name__ == "__main__":
    main()
