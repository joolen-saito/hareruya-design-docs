#!/usr/bin/env python3
"""Excel基本設計の「廃止指示」を検出し、機能設計書に残っている現行仕様と突き合わせる。

Excel基本設計（＝刷新後の仕様）が「識別ID:4-3『チームメンバー確認済み』は削除する」の
ように項目・画面の廃止を宣言していても、現行実装からリバースした機能設計書
（`functions/**/*.md`）はその機能を現行仕様として書く。放置すると読み手が
「実装すべき仕様」と誤読する。本スクリプトはその候補を洗い出す。

入力は生成HTML（`excel_to_html/output/*.html`）の**本文側**である。Excel原本ではなく
HTMLを読むのは、verify.py の規則7 が「全DrawingML図形テキストがHTMLに残っていること」を
機械強制しており、出力HTMLがセル本文＋図形注記の検証済みスーパーセットになっているため。
HTML基準なら根拠アンカーもそのまま得られる。

素朴なキーワードgrepは死ぬ（「削除する」は出力HTML全体で500回以上出現し、大半は
「ボタン押下で削除する」といった正常な機能仕様）。そこで構造フィルタを噛ませる。

  - 走査対象は本文側のみ（function-design-embed 節と endpoint-supplement 節を除く）
  - 指示行の型（識別ID付き、または ・/★ で始まる箇条書き）
  - 廃止語（削除する／削除とする／廃止／不要／踏襲しない／なくなる）
  - 「」で名指しされた項目名が `functions/**/*.md` に残っているか

出力はノイズ込みの候補TSVであり、人手トリアージ前提。判定結果は
`functions/superseded_specs.json`（台帳）へ記録する。偽陽性は verdict=not-superseded
として台帳に残すこと（残さないと毎回同じ候補が再提示される）。

サブコマンド:
  scan      候補をTSVへ出力する（既定の出力先 functions/superseded_candidates.tsv）
  baseline  現在の候補をベースラインとして保存する（ratchet の起点）
  check     ベースラインにも台帳にも無い「新規候補」を検出する（非ゼロ終了）
"""
from __future__ import annotations

import argparse
import csv
import html as H
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import superseded_specs  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
OUTPUT_DIR = ROOT / "excel_to_html" / "output"
FUNCTIONS_DIR = ROOT / "functions"
CANDIDATES_TSV = FUNCTIONS_DIR / "superseded_candidates.tsv"
BASELINE_TSV = FUNCTIONS_DIR / "superseded_candidates_baseline.tsv"

# 廃止を宣言する語。「削除」単独は「ボタン押下で削除する」等の正常仕様を大量に拾うので採らない。
SUPERSEDE_RE = re.compile(r"削除する|削除とする|削除となる|を削除|は削除|廃止|不要なため|踏襲しない|対象外とする|なくなるため")
# フェーズ延期は別台帳（design_impl_drift_report/phase2_excluded_functions.json）の領分。
PH2_RE = re.compile(r"[Pp][Hh]2|フェーズ2|フェーズ２|フェーズⅡ")
IDENT_RE = re.compile(r"識別ID[:：]?\s*([0-9]+(?:\s*-\s*[0-9]+)?)")
QUOTED_RE = re.compile(r"[「『]([^」』]{2,40})[」』]")

# 埋め込み節（現行ソース由来）と追補節は本文ではないので走査対象から外す。
EMBED_RE = re.compile(r"<!-- function-design-embed:start.*?<!-- function-design-embed:end[^>]*-->", re.S)
SUPPLEMENT_RE = re.compile(r"<!-- endpoint-supplement:start -->.*?<!-- endpoint-supplement:end -->", re.S)
PANEL_RE = re.compile(r'<section class="sheet-panel(?: is-active)?" id="(sheet-\d+)">')
HEADING_RE = re.compile(r"<h2>([^<]*)</h2>")
FEATURE_NO_RE = re.compile(r"<dt>機能No</dt><dd>([^<]*)</dd>")
BLOCK_RE = re.compile(r"<(p|div|td)\b[^>]*>(.*?)</\1>", re.S)

TODO = FUNCTIONS_DIR / "todo-list.md"

FIELDS = [
    "status", "book", "sheetId", "sheetName", "featureNo",
    "primaryDoc", "targetInPrimary", "identifierId",
    "targets", "rippleDocs", "ph2", "line",
]


def body_of(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    text = EMBED_RE.sub("", text)
    return SUPPLEMENT_RE.sub("", text)


def sheet_map(body: str) -> list[tuple[int, str, str, str]]:
    """(開始位置, シートID, シート名, 機能No) の一覧。機能Noは波及先の第一候補を引くのに使う。"""
    panels = []
    for m in PANEL_RE.finditer(body):
        head = HEADING_RE.search(body, m.end(), m.end() + 2000)
        feature = FEATURE_NO_RE.search(body, m.end(), m.end() + 3000)
        panels.append(
            (
                m.start(),
                m.group(1),
                H.unescape(head.group(1)) if head else "",
                H.unescape(feature.group(1)).strip().upper() if feature else "",
            )
        )
    return panels


def sheet_at(panels: list[tuple[int, str, str, str]], pos: int) -> tuple[str, str, str]:
    cur = ("", "", "")
    for start, sid, name, feature_no in panels:
        if start <= pos:
            cur = (sid, name, feature_no)
    return cur


def plain(fragment: str) -> str:
    return H.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def is_instruction(line: str) -> bool:
    """設計変更の指示行らしさ。識別ID付き、または ・/★ の箇条書き。"""
    return bool(IDENT_RE.search(line)) or line.startswith(("・", "★", "※"))


def declares_supersede(line: str) -> bool:
    """廃止を「宣言している」行か。鉤括弧の中身は項目名・選択肢名なので判定から外す。

    商品公開ステータスには「廃止」という選択肢**値**があり、
    「『商品公開ステータス』を『廃止』とする場合は…」のような行を素朴に拾うと
    大量の偽陽性になる。鉤括弧を落としたうえで廃止語が残る行だけを指示とみなす。
    """
    outside = QUOTED_RE.sub("", line)
    return bool(SUPERSEDE_RE.search(outside))


def md_index() -> dict[str, str]:
    """機能設計書の本文。`functions/<リポ>/*.md` だけを対象にする。

    `functions/` 直下には監査レポート（`endpoint-existence-check-report.md` 等）が
    あり、これを混ぜると「残存している機能設計書」の一覧がレポートだらけになる。
    """
    return {
        md.relative_to(ROOT).as_posix(): md.read_text(encoding="utf-8")
        for md in sorted(FUNCTIONS_DIR.rglob("*/*.md"))
    }


def todo_docs() -> dict[str, str]:
    """機能No -> 機能設計書パス。`functions/todo-list.md` の詳細設計書リンクから引く。"""
    mapping: dict[str, str] = {}
    for line in TODO.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cols = [c.strip() for c in line.split("|")]
        if len(cols) < 9:
            continue
        feature_no = cols[5].upper()
        link = re.search(r"\[md\]\(([^)]+)\)", cols[8])
        if re.fullmatch(r"[A-Z]\d{2}-\d{2}", feature_no) and link:
            mapping[feature_no] = f"functions/{link.group(1)}"
    return mapping


# 一般語すぎる名指しは波及先の手がかりにならない（「削除」「OK」「はい」等）。
GENERIC_TARGETS = {"削除", "OK", "はい", "いいえ", "公開", "非公開", "編集", "登録", "更新", "検索"}


def useful_targets(line: str) -> list[str]:
    """波及先を絞り込むのに使える名指し項目だけを返す。"""
    return [
        t for t in QUOTED_RE.findall(line)
        if len(t) >= 3 and t not in GENERIC_TARGETS
    ]


def ledger_hit(book: str, ident: str, line: str) -> bool:
    """この指示行が既に台帳で判定済みか。"""
    for entry in superseded_specs.load_ledger().get("entries", []):
        if entry.get("book") != book:
            continue
        if ident and str(entry.get("identifierId") or "") == ident:
            return True
        quote = entry.get("designQuote") or ""
        if quote and (quote in line or line in quote):
            return True
    return False


def scan() -> list[dict]:
    docs = md_index()
    todo = todo_docs()
    rows: list[dict] = []
    seen: set[tuple] = set()
    for path in sorted(OUTPUT_DIR.glob("*基本設計仕様書*.html")):
        book = path.name[:4]
        body = body_of(path)
        panels = sheet_map(body)
        for m in BLOCK_RE.finditer(body):
            line = plain(m.group(2))
            if not line or len(line) > 300:
                continue
            if not declares_supersede(line) or not is_instruction(line):
                continue
            sid, sname, feature_no = sheet_at(panels, m.start())
            ident_m = IDENT_RE.search(line)
            ident = re.sub(r"\s*", "", ident_m.group(1)) if ident_m else ""
            key = (book, sid, ident, line)
            if key in seen:
                continue
            seen.add(key)

            targets = useful_targets(line)
            # 波及先の第一候補は「その指示が書かれたシートが説明している機能」。
            # 全文検索だけに頼ると「備考」「支払方法」のような一般語で無関係なmdが大量に当たる。
            primary = todo.get(feature_no, "")
            primary_text = docs.get(primary, "")
            in_primary = any(t in primary_text for t in targets) if primary_text else False
            # 他機能への波及（例: 管理画面の項目削除がフロント申込に効く）は全文検索で拾うが、
            # 第一候補とは分けて出す。
            ripple = sorted(
                {d for t in targets for d, text in docs.items() if t in text and d != primary}
            )
            rows.append(
                {
                    "status": "known" if ledger_hit(book, ident, line) else "candidate",
                    "book": book,
                    "sheetId": sid,
                    "sheetName": sname,
                    "featureNo": feature_no,
                    "primaryDoc": primary,
                    "targetInPrimary": "yes" if in_primary else "",
                    "identifierId": ident,
                    "targets": "／".join(targets),
                    "rippleDocs": " ".join(ripple),
                    "ph2": "yes" if PH2_RE.search(line) else "",
                    "line": line,
                }
            )
    return rows


def write_tsv(rows: list[dict], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def read_keys(path: Path) -> set[tuple[str, str, str, str]]:
    if not path.exists():
        return set()
    with path.open(encoding="utf-8", newline="") as fh:
        return {
            (r["book"], r["sheetId"], r["identifierId"], r["line"])
            for r in csv.DictReader(fh, delimiter="\t")
        }


def open_candidates(rows: list[dict]) -> list[dict]:
    """台帳未判定で、トリアージが要る行。

    残す条件は次のいずれか。
      - 廃止対象が機能設計書に現行仕様として残っている（第一候補または波及先）
      - **識別IDが付いている**。識別ID付きは画面項目定義を名指しした設計変更指示であり、
        対象名が短くて一般語フィルタに落ちても（例: 識別ID:26「複製」ボタンを削除する）
        取りこぼしてはならない。逆に識別IDが無い `・` 箇条書きは、
        「『OK』押下時に該当データを削除する」のような正常な機能仕様が多い。
    """
    return [
        r for r in rows
        if r["status"] == "candidate"
        and not r["ph2"]
        and (r["targetInPrimary"] or r["rippleDocs"] or r["identifierId"])
    ]


def cmd_scan(args) -> int:
    rows = scan()
    write_tsv(rows, CANDIDATES_TSV)
    openers = open_candidates(rows)
    print(f"scan: 指示行 {len(rows)} 件 -> {CANDIDATES_TSV.relative_to(ROOT)}")
    print(f"  台帳で判定済み : {sum(1 for r in rows if r['status'] == 'known')}")
    print(f"  Ph2（別台帳の領分）: {sum(1 for r in rows if r['ph2'])}")
    print(f"  要トリアージ（機能設計書に現行仕様として残存）: {len(openers)}")
    for r in openers[: args.limit]:
        print(
            f"    [{r['book']} {r['sheetName']} {r['featureNo'] or '機能No不明'} "
            f"識別ID:{r['identifierId'] or '-'}] {r['line'][:56]}"
        )
        print(f"        第一候補: {r['primaryDoc'] or '(不明)'}"
              f"{' ← 対象が現行仕様として残存' if r['targetInPrimary'] else ''}")
    if len(openers) > args.limit:
        print(f"    …ほか {len(openers) - args.limit} 件（TSVを参照）")
    return 0


def cmd_baseline(args) -> int:
    rows = scan()
    openers = open_candidates(rows)
    write_tsv(openers, BASELINE_TSV)
    print(f"baseline: 要トリアージ {len(openers)} 件を退避 -> {BASELINE_TSV.relative_to(ROOT)}")
    print("  以後、ベースラインにも台帳にも無い新規候補だけが check で NG になる。")
    return 0


def cmd_check(args) -> int:
    rows = scan()
    baseline = read_keys(BASELINE_TSV)
    fresh = [
        r for r in open_candidates(rows)
        if (r["book"], r["sheetId"], r["identifierId"], r["line"]) not in baseline
    ]
    if fresh:
        print("NG: 台帳にもベースラインにも無い新規の廃止指示があります", file=sys.stderr)
        for r in fresh:
            print(
                f"  - [{r['book']} {r['sheetName']} 識別ID:{r['identifierId'] or '-'}] {r['line'][:70]}\n"
                f"      残存: {r['docsWithTarget']}",
                file=sys.stderr,
            )
        print(
            "\n判定して functions/superseded_specs.json へ記録してください"
            "（廃止でないなら verdict=not-superseded で残す）。",
            file=sys.stderr,
        )
        return 1
    known = sum(1 for r in rows if r["status"] == "known")
    print(f"OK: 新規の廃止指示なし（判定済み {known} / ベースライン {len(baseline)}）")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan", help="候補をTSVへ出力")
    s.add_argument("--limit", type=int, default=15)
    sub.add_parser("baseline", help="現在の要トリアージ候補をベースラインへ退避")
    sub.add_parser("check", help="新規候補があれば非ゼロ終了")
    args = p.parse_args()
    return {"scan": cmd_scan, "baseline": cmd_baseline, "check": cmd_check}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
