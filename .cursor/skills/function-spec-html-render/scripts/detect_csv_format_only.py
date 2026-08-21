#!/usr/bin/env python3
"""CSV/TSVの項目定義しか無いシートを洗い出す（現行仕様を埋め込まない候補）。

`functions/csv-format-only.tsv` のヘッダはこの道具で候補を再抽出できると書いていたが、
実体が無かった（2026-08-21 判明）。そのため登録が4件で止まり、
0206「買取商品一覧CSV出力項目」のようなCSV項目だけのシートに現行仕様が埋め込まれていた。

判定（2026-08-21 改訂）:
  見出しの有無では決まらない。0203「受注一覧CSV出力」は機能について・処理概要・カスタマイズ説明を
  持つが、中身は84行中65行が項目表で、説明文は★項目追加のリスト14行だけだった。
  そこで**説明文の量**で判定する。
  1. 説明文（表でもなく節見出しでもない行）が MAX_NARRATIVE 行以下。
  2. 表の行が本文の TABLE_RATIO 以上。
  較正（2026-08-21 実測）:
    CSV項目のみ  0203 sheet-5/6/7/8 = 説明文 14〜15行 / 表率 76〜82%
                 0202 sheet-9       = 説明文  5行     / 表率 95%
    本物の仕様   0202 sheet-4/6/14, 0203 sheet-3, 0205 sheet-3 = 説明文 45〜518行 / 表率 15〜41%
埋め込み済みの現行仕様ブロックは判定材料から外す（埋め込みの有無で結果が変わらないようにする）。

  python3 detect_csv_format_only.py               # 候補一覧
  python3 detect_csv_format_only.py --unregistered # 未登録の候補だけ
終了コードは、未登録の候補があれば 1（再生成の前に人が台帳へ登録する）。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "design_impl_drift_report"))
import lib_design_doc as L  # noqa: E402

# どのシートにも必ず付く表題ブロック。ラベルと値が1行ずつ並ぶためタブを含まず、
# 小さなCSV項目シートでは本文の7割を占めて表内率を潰す（実測: 0206 sheet-7 は 31% になっていた）。
# 表内率を測る前に必ず落とす。
META_LABELS = ("ドキュメント名", "セクション", "プロジェクト名", "作成者", "作成日",
               "更新者", "更新日", "機能No", "機能名", "概要", "備考")
EMBED_START = re.compile(r"^Source:$")
# 表が主体というだけでは足りない。別添資料の機能一覧や対応表まで拾ってしまう
# （実測: 0204「スマレジ連携機能一覧」0304「注文ステータスと表示画像の紐付け」）。
# CSV/TSVの項目定義であることの signal を要求する。
CSV_TITLE_RE = re.compile(r"CSV|TSV|フォーマット")
CSV_HEADER_RE = re.compile(r"識別ID\t|項目名|出力項目|入力項目")
# 節見出しの行。説明文の量を数えるときに除く。
SECTION_HEADS = ("機能について", "処理概要", "カスタマイズ説明", "機能仕様",
                 "要件説明", "レイアウト図", "識別ID")
MAX_NARRATIVE = 25
TABLE_RATIO = 0.60
MIN_LINES = 8


def sheet_body(book: Path, sheet) -> list[str]:
    """埋め込み（Source: 以降）を除いたシート本文。"""
    lines = L.sheet_text(book, sheet).splitlines()
    for i, line in enumerate(lines):
        if EMBED_START.match(line.strip()):
            return lines[:i]
    return lines


def strip_meta_header(lines: list[str], title: str = "") -> list[str]:
    """表題ブロック（ラベル行とその次の値行）とシート名の見出し行を落とす。

    シート名はパネル見出しとシート内の表題セルで2回出ることが多く、内容ではない。
    残すと小さなCSV項目シートの表内率が下がる（実測: 0206 sheet-7 は 83% で閾値に届かなかった）。
    """
    key = re.sub(r"\s+", "", title)
    out, skip_next = [], False
    for line in lines:
        t = line.strip()
        if skip_next:
            skip_next = False
            continue
        if t in META_LABELS:
            skip_next = True
            continue
        if key and re.sub(r"\s+", "", t) == key:
            continue
        out.append(line)
    return out


def looks_csv_only(lines: list[str], title: str = "") -> tuple[bool, int, float]:
    body = [l for l in strip_meta_header(lines, title) if l.strip()]
    if len(body) < MIN_LINES:
        return False, len(body), 0.0
    if not (CSV_TITLE_RE.search(title) or CSV_HEADER_RE.search("\n".join(body[:4]))):
        return False, len(body), 0.0
    table = sum(1 for l in body if "\t" in l)
    narrative = sum(1 for l in body
                    if "\t" not in l and not any(l.strip().startswith(h) for h in SECTION_HEADS))
    ratio = table / len(body)
    return (narrative <= MAX_NARRATIVE and ratio >= TABLE_RATIO), len(body), ratio


def registered() -> set[str]:
    p = ROOT / "functions" / "csv-format-only.tsv"
    if not p.is_file():
        return set()
    out = set()
    for line in p.read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or line.startswith("Markdown") or not line.strip():
            continue
        c = line.split("\t")
        if len(c) >= 3:
            out.add((c[1].strip(), c[2].strip()))
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--unregistered", action="store_true")
    args = ap.parse_args()

    reg = registered()
    rows = []
    for book in L.list_books():
        if book.name == "index.html":
            continue
        num = L.book_number(book.name) or "?"
        try:
            sheets = L.sheet_index(book)
        except L.DesignDocError:
            continue
        for s in sheets:
            ok, n, ratio = looks_csv_only(sheet_body(book, s), s.title)
            if not ok:
                continue
            is_reg = (num, s.title) in reg
            if args.unregistered and is_reg:
                continue
            rows.append((num, s.sheet_id, s.title, n, ratio, is_reg))

    print(f"{'書':6}{'シート':10}{'行':>4}{'表内率':>7}{'登録':>5}  シート名")
    for num, sid, title, n, ratio, is_reg in rows:
        print(f"{num:6}{sid:10}{n:4}{ratio:6.0%}{'済' if is_reg else '未':>5}  {title}")
    unreg = [r for r in rows if not r[5]]
    print(f"\n候補 {len(rows)}件 / 未登録 {len(unreg)}件")
    if unreg:
        print("未登録の候補は、人が確認して functions/csv-format-only.tsv へ登録してから再生成する。")
    sys.exit(1 if unreg else 0)


if __name__ == "__main__":
    main()
