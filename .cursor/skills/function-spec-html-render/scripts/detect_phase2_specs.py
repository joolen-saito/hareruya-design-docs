#!/usr/bin/env python3
"""フェーズ2（Ph2）対応の機能・仕様を検出し、機能設計書との突合を出す。

Excel基本設計が「Ph2で対応するため、Ph1では実装しない」「フェーズ2以降で設計予定とする」と
書いている機能・項目は、フェーズ1では実装しない。ところが現行実装からリバースした機能設計書
（`functions/**/*.md`）はその機能を現行仕様として書くため、読み手は「実装すべき仕様」と誤読する。

## なぜHTML本文を読むのか（既存検出器との違い）

先行する `.codex/skills/hareruya-integration-test-cases/scripts/detect_ph2_features.py` は
Excel の DrawingML（`xl/drawings/*.xml`）だけを走査しており、**セル本文に書かれたPh2注記を
取りこぼす**。実例: `0302 グローバルナビ` は通知がPh2だと6シートに書かれているが、図形注記は
2件（通知シート・別添資料）だけで、ナビ4シート（PC版・スマホ版・支店PC版・支店スマホ版）の
注記はセル本文にあるため検出できていなかった。

生成HTMLは `excel_to_html/verify.py` の規則6（全DrawingML図形テキストのHTML残存を機械強制）に
より、**セル本文＋図形注記の検証済みスーパーセット**になっている。したがってHTML本文を読めば
両方を取りこぼさない。根拠アンカーもそのまま得られる。

サブコマンド:
  scan      候補をTSVへ出力する
  baseline  現在の要トリアージ候補をベースラインへ退避する（ratchet の起点）
  check     ベースラインにも台帳にも無い新規候補があれば非ゼロ終了
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import phase2_specs  # noqa: E402
from detect_superseded_specs import (  # noqa: E402
    FUNCTIONS_DIR,
    OUTPUT_DIR,
    ROOT,
    body_of,
    md_index,
    plain,
    sheet_at,
    sheet_map,
    todo_docs,
)

# 走査単位は2パスに分ける。finditer は非重複なので、外側の `<div class="table-wrap">` に
# マッチすると表全体が1マッチに飲み込まれ、図形テキスト表のセルに書かれたPh2注記
#（例: 0202「在庫切れリストCSV出力はPh2で対応するため、Ph1では実装しない」）を
# 個別の行として取り出せない。段落・箇条書き用と、表セル用を別々に走査する。
BLOCK_RE = re.compile(r"<(p|div)\b[^>]*>(.*?)</\1>", re.S)
CELL_RE = re.compile(r"<td\b[^>]*>(.*?)</td>", re.S)


def iter_lines(body: str):
    """(位置, 1行テキスト) を返す。段落・箇条書きと、表セルの両方を拾う。"""
    for m in BLOCK_RE.finditer(body):
        yield m.start(), m.group(2)
    for m in CELL_RE.finditer(body):
        yield m.start(), m.group(1)

CANDIDATES_TSV = FUNCTIONS_DIR / "phase2_candidates.tsv"
BASELINE_TSV = FUNCTIONS_DIR / "phase2_candidates_baseline.tsv"

# Ph2 を示す語。表記ゆれを吸収する。
PH2_RE = re.compile(r"[Pp][Hh]2|フェーズ2|フェーズ２|フェーズⅡ")
# 番号の羅列（"(1)(2)(3)…"）のような、Ph2と無関係な行を落とす。
NUMBER_LIST_RE = re.compile(r"^[\s\(\)0-9\-,、･・]+$")
# 「図形・テキストボックス内テキスト」表を丸ごと1ブロックとして拾ってしまうのを避ける。
# 表そのものではなく、その中の個々のセル（同じ BLOCK_RE が拾う）を候補にしたい。
TABLE_DUMP_RE = re.compile(r"^位置\s*テキスト")

FIELDS = [
    "status", "book", "sheetId", "sheetName", "featureNo",
    "primaryDoc", "ph2InDoc", "line",
]


def scan() -> list[dict]:
    docs = md_index()
    todo = todo_docs()
    rows: list[dict] = []
    seen: set[tuple] = set()
    for path in sorted(OUTPUT_DIR.glob("*基本設計仕様書*.html")):
        book = path.name[:4]
        body = body_of(path)
        panels = sheet_map(body)
        for pos, fragment in iter_lines(body):
            line = re.sub(r"\s+", " ", plain(fragment)).strip()
            if not line or len(line) > 300 or NUMBER_LIST_RE.fullmatch(line):
                continue
            if TABLE_DUMP_RE.match(line) or not PH2_RE.search(line):
                continue
            sid, sname, feature_no = sheet_at(panels, pos)
            key = (book, sid, line)
            if key in seen:
                continue
            seen.add(key)

            primary = todo.get(feature_no, "")
            primary_text = docs.get(primary, "")
            rows.append(
                {
                    "status": "known" if phase2_specs.ledger_hit(book, feature_no, line) else "candidate",
                    "book": book,
                    "sheetId": sid,
                    "sheetName": sname,
                    "featureNo": feature_no,
                    "primaryDoc": primary,
                    # 機能設計書がPh2だと書いているか。書いていなければ読み手に伝わっていない。
                    "ph2InDoc": "yes" if (primary_text and PH2_RE.search(primary_text)) else "",
                    "line": line,
                }
            )
    return rows


def open_candidates(rows: list[dict]) -> list[dict]:
    """台帳未判定の行（＝要トリアージ）。"""
    return [r for r in rows if r["status"] == "candidate"]


def write_tsv(rows: list[dict], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def read_keys(path: Path) -> set[tuple[str, str, str]]:
    if not path.exists():
        return set()
    with path.open(encoding="utf-8", newline="") as fh:
        return {(r["book"], r["sheetId"], r["line"]) for r in csv.DictReader(fh, delimiter="\t")}


def cmd_scan(args) -> int:
    rows = scan()
    write_tsv(rows, CANDIDATES_TSV)
    openers = open_candidates(rows)
    print(f"scan: Ph2注記 {len(rows)} 件 -> {CANDIDATES_TSV.relative_to(ROOT)}")
    print(f"  台帳で判定済み: {sum(1 for r in rows if r['status'] == 'known')}")
    print(f"  要トリアージ  : {len(openers)}")
    silent = [r for r in rows if not r["ph2InDoc"] and r["primaryDoc"]]
    print(f"  うち機能設計書にPh2の記述が無い（読み手に伝わっていない）: {len(silent)}")
    for r in openers[: args.limit]:
        print(f"    [{r['book']} {r['sheetName']} {r['featureNo'] or '機能No不明'}] {r['line'][:60]}")
    if len(openers) > args.limit:
        print(f"    …ほか {len(openers) - args.limit} 件（TSVを参照）")
    return 0


def cmd_baseline(args) -> int:
    rows = scan()
    openers = open_candidates(rows)
    write_tsv(openers, BASELINE_TSV)
    print(f"baseline: 要トリアージ {len(openers)} 件を退避 -> {BASELINE_TSV.relative_to(ROOT)}")
    return 0


def cmd_check(args) -> int:
    rows = scan()
    baseline = read_keys(BASELINE_TSV)
    fresh = [
        r for r in open_candidates(rows)
        if (r["book"], r["sheetId"], r["line"]) not in baseline
    ]
    if fresh:
        print("NG: 台帳にもベースラインにも無い新規のPh2注記があります", file=sys.stderr)
        for r in fresh:
            print(f"  - [{r['book']} {r['sheetName']} {r['featureNo'] or '-'}] {r['line'][:70]}", file=sys.stderr)
        print("\n判定して functions/phase2_specs.json へ記録してください。", file=sys.stderr)
        return 1
    known = sum(1 for r in rows if r["status"] == "known")
    print(f"OK: 新規のPh2注記なし（判定済み {known} / ベースライン {len(baseline)}）")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan", help="候補をTSVへ出力")
    s.add_argument("--limit", type=int, default=20)
    sub.add_parser("baseline", help="要トリアージ候補をベースラインへ退避")
    sub.add_parser("check", help="新規候補があれば非ゼロ終了")
    args = p.parse_args()
    return {"scan": cmd_scan, "baseline": cmd_baseline, "check": cmd_check}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
