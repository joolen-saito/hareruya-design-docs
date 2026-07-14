#!/usr/bin/env python3
"""実装差分追補「利用者視点の入口」を必ず表組(<table>)で生成・検証するハーネス。

この節 (`<!-- endpoint-supplement:start -->` 〜 `:end` で囲まれた
`<section class="endpoint-supplement">`) は、Controller の本番利用 route と
既存の「利用者視点の入口」を突合して追補したものである。
本ハーネスはそのうち **「利用者視点の入口」テーブルだけ** を所有し、
入口 / URLエンドポイント / 期待されるふるまい の3列表として描画する。
追補節の他の小節（調査補助・処理フロー等の手書き内容）には触れない。

convert.py の再変換は追補節を丸ごと落とす。節が消えたファイルは入口テーブルだけでは
再構成できない（手書き小節を含むため）ので、`extract` は入口行に加えて**節そのもの**を
sections JSON へスナップショットし、`build` はそれを使って節ごと復元する。

サブコマンド:
  extract  現行 output HTML から入口行を data JSON へ、追補節全文を sections JSON へ保存する（忠実な正本化）。
  build    節が消えていれば sections JSON から復元し、入口テーブルを <table> で冪等に差し替える。
  verify   追補節の欠落と、入口が <table> でないことを検査する（CIガード）。
  rows     recheck CSV の1行から (入口ラベル / URL / ふるまい) を規約どおり導出して表示する（新規追加の確認用）。

設計上の不変条件:
  - 「利用者視点の入口」は決して箇条書き・段落で出力しない。常に3列の表。
  - data JSON に載っているファイルは追補節を必ず持つ。欠落は verify で NG とする
    （黙って読み飛ばすと、再変換で全ファイルから節が消えても検知できない）。
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[4]  # hareruya-design-docs/
OUTPUT_DIR = BASE_DIR / "excel_to_html" / "output"
DATA_JSON = BASE_DIR / "endpoint_reports" / "endpoint_supplement_data.json"
# 追補節の全文スナップショット（手書き小節を含む）。convert.py 再変換で節ごと消えたときの復元元。
SECTIONS_JSON = BASE_DIR / "endpoint_reports" / "endpoint_supplement_sections.json"
RECHECK_CSV = BASE_DIR / "endpoint_reports" / "html_entry_missing_endpoints_recheck.csv"

ENTRY_ANCHOR = 'endpoint-supplement-user-entry'
HEADER_CELLS = ("入口", "URLエンドポイント", "期待されるふるまい")

# 追補節の開始/終了マーカー。convert.py 再変換で追補が消えた後の再適用判定に使う。
SUPPLEMENT_START = "<!-- endpoint-supplement:start -->"
SUPPLEMENT_END = "<!-- endpoint-supplement:end -->"

# 追補テーブルの装飾CSS。本文テーブル(.function-design-body)と同じ見た目を、
# 追補節(.endpoint-supplement)へ自己完結で適用する。CSS変数は convert.py の
# 基底 :root で常に定義されるため、function-design 埋め込みの有無に依存しない。
STYLE_START = "/* endpoint-supplement-style:start */"
STYLE_END = "/* endpoint-supplement-style:end */"
SUPPLEMENT_STYLE = f"""{STYLE_START}
    .endpoint-supplement .table-wrap {{
      overflow-x: auto;
      margin: 14px 0 22px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }}
    .endpoint-supplement table {{
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      font-size: 13px;
    }}
    .endpoint-supplement th,
    .endpoint-supplement td {{
      border: 1px solid var(--line-soft);
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }}
    .endpoint-supplement th {{
      background: var(--band);
      font-weight: 700;
      white-space: nowrap;
    }}
    .endpoint-supplement tbody tr:nth-child(even) {{
      background: #fffaf0;
    }}
    {STYLE_END}"""

STYLE_BLOCK_RE = re.compile(
    re.escape(STYLE_START) + r".*?" + re.escape(STYLE_END), re.S
)

# 追補節そのもの（マーカー込み）。extract のスナップショットと build の復元判定に使う。
SECTION_RE = re.compile(
    re.escape(SUPPLEMENT_START) + r".*?" + re.escape(SUPPLEMENT_END), re.S
)


# 機能設計書の埋め込みブロック。追補節の中に紛れ込むことがあり（integrate が最後のシートの
# パネル範囲を追補節まで伸ばしていた既存バグ）、そのままスナップショットすると復元のたびに
# 古い詳細設計書の複製が増える。スナップショット時に必ず落とす。
EMBED_BLOCK_RE = re.compile(
    r"\n?\s*<!-- function-design-embed:start.*?<!-- function-design-embed:end[^>]*-->",
    re.S,
)


def section_of(text: str) -> str | None:
    """HTML から追補節の全文（マーカー込み）を取り出す。無ければ None。

    追補節は本スキルの所有物であり、機能設計書の埋め込みブロックを含まない。
    紛れ込んでいたら取り除いてから正本化する（混入したまま保存すると、復元のたびに
    古い埋め込みの複製が増える）。
    """
    m = SECTION_RE.search(text)
    if not m:
        return None
    return EMBED_BLOCK_RE.sub("", m.group(0))


def restore_section(text: str, section: str) -> str:
    """消えた追補節を </main> 直前へ戻す。節は本文の最後（main の末尾）に置く。

    convert.py が生成する HTML の </main> は1個。見つからない・複数ある場合は
    位置を推測せず ValueError とし、誤った場所へ挿入しない。
    """
    if text.count("</main>") != 1:
        raise ValueError("</main> が1個ではないため追補節の挿入位置を特定できません")
    idx = text.index("</main>")
    return f"{text[:idx].rstrip()}\n\n\n{section}\n\n    {text[idx:]}"


def ensure_supplement_style(text: str) -> tuple[str, bool]:
    """追補テーブル装飾CSSを <style> 内へ冪等に挿入/更新する。"""
    if STYLE_START in text:
        new = STYLE_BLOCK_RE.sub(lambda _: SUPPLEMENT_STYLE, text, count=1)
        return new, new != text
    idx = text.find("</style>")
    if idx == -1:
        return text, False
    new = text[:idx] + SUPPLEMENT_STYLE + "\n  " + text[idx:]
    return new, True

# h2#endpoint-supplement-user-entry の直後が table-wrap テーブルであることの厳格判定
# （verify / extract 用）。これに一致しなければ「表組になっていない」とみなす。
ENTRY_TABLE_RE = re.compile(
    r'(<h2 id="' + ENTRY_ANCHOR + r'">[^<]*</h2>\s*)'
    r'<div class="table-wrap"><table>.*?</table></div>',
    re.S,
)

# build 用の差し替え対象。入口見出し直後の本文ブロック（表でも、表組崩れの
# ul/ol/p/pre でも）を1個以上まとめて掴み、表に置き換える。これにより
# 「箇条書きで生成されてしまった入口」を表組へ修復できる。
_ENTRY_BLOCK = (
    r'(?:'
    r'<div class="table-wrap"><table>.*?</table></div>'
    r'|<ul>.*?</ul>'
    r'|<ol>.*?</ol>'
    r'|<p>.*?</p>'
    r'|<pre>.*?</pre>'
    r')'
)
# 末尾の空白は取り込まない（連続ブロック間の空白のみ取り込む）。
# こうすることで正常系（ブロック=表1個）では差し替え結果が元と一致し、build が冪等になる。
ENTRY_BLOCK_RE = re.compile(
    r'(<h2 id="' + ENTRY_ANCHOR + r'">[^<]*</h2>\s*)'
    + _ENTRY_BLOCK + r'(?:\s*' + _ENTRY_BLOCK + r')*',
    re.S,
)
ROW_RE = re.compile(r"<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>", re.S)


# --------------------------------------------------------------------------- #
# 表組レンダラ（唯一の生成経路。ここを通る限り必ず <table> になる）
# --------------------------------------------------------------------------- #
def render_user_entry_table(rows: list[dict]) -> str:
    """入口行リストから table-wrap 表を生成する。rows は raw な内側HTMLを保持する。"""
    head = "".join(f"<th>{c}</th>" for c in HEADER_CELLS)
    body = "".join(
        f"<tr><td>{r['entry']}</td><td>{r['url']}</td><td>{r['behavior']}</td></tr>"
        for r in rows
    )
    return (
        '<div class="table-wrap"><table>'
        f"<thead><tr>{head}</tr></thead>"
        f"<tbody>{body}</tbody>"
        "</table></div>"
    )


# --------------------------------------------------------------------------- #
# recheck CSV → 入口行 への導出規約（新規 route を表に足すとき用）
# --------------------------------------------------------------------------- #
def _classify(method: str, path: str, route: str, feature: str) -> str:
    """画面 / ファイル出力 / JSON-API のいずれかに分類する。"""
    blob = f"{path} {route} {feature}".lower()
    if any(k in blob for k in ("export", "csv", "download", "pdf", "xls")):
        return "file"
    if ".json" in path.lower() or any(k in blob for k in ("json", "ajax", "/api", "api_")):
        return "json"
    return "screen"

# (method, class) -> (入口サフィックス, 期待されるふるまい)
_SUFFIX_BEHAVIOR = {
    ("GET", "screen"): ("を開く", "指定された画面または対象データを表示する。"),
    ("GET", "file"): ("を出力する", "利用者操作に応じて対象ファイルを出力する。"),
    ("GET", "json"): ("を取得する", "指定条件に応じたデータをJSON等のレスポンスで返す。"),
    ("POST", "screen"): ("を実行する", "利用者の送信内容を処理し、処理結果を画面に反映する。"),
    ("POST", "file"): ("を出力する", "利用者操作に応じて対象ファイルを出力する。"),
    ("POST", "json"): ("を実行する", "リクエスト内容を処理し、JSON等のレスポンスで結果を返す。"),
    ("PUT", "screen"): ("を更新する", "利用者の送信内容を処理し、処理結果を画面に反映する。"),
    ("PUT", "json"): ("を更新する", "リクエスト内容を処理し、JSON等のレスポンスで結果を返す。"),
    ("DELETE", "screen"): ("を削除する", "削除操作を実行し、処理結果を画面に反映する。"),
    ("ANY", "screen"): ("を利用する", "利用者の送信内容を処理し、処理結果を画面に反映する。"),
}


def row_from_recheck(rec: dict) -> dict:
    """recheck CSV の1行 -> 表セル(エスケープ済)。新規 route を表へ足すときの正規導出。"""
    method = rec["method"].strip()
    path = rec["path"].strip()
    route = rec.get("route_name", "").strip()
    feature = rec.get("feature", "").strip()
    cls = _classify(method, path, route, feature)
    suffix, behavior = _SUFFIX_BEHAVIOR.get(
        (method, cls), _SUFFIX_BEHAVIOR.get((method, "screen"), ("を実行する", behavior_default()))
    )
    base = feature.rstrip("。. 　")
    label = f"{base}{suffix}" if base else f"{route}{suffix}"
    return {
        "entry": html.escape(label, quote=False),
        "url": f"`{html.escape(method, quote=False)} {html.escape(path, quote=False)}`",
        "behavior": html.escape(behavior, quote=False),
    }


def behavior_default() -> str:
    return "利用者の送信内容を処理し、処理結果を画面に反映する。"


# --------------------------------------------------------------------------- #
# extract: 現行 output から入口行をスナップショット
# --------------------------------------------------------------------------- #
def iter_output_files():
    return sorted(OUTPUT_DIR.glob("*基本設計仕様書*.html"))


def extract_rows(text: str) -> list[dict] | None:
    m = ENTRY_TABLE_RE.search(text)
    if not m:
        return None
    table_html = text[m.start():m.end()]
    rows = []
    for entry, url, behavior in ROW_RE.findall(table_html):
        if entry == "入口":  # ヘッダ行
            continue
        rows.append({"entry": entry, "url": url, "behavior": behavior})
    return rows


def cmd_extract(args) -> int:
    data = {}
    sections = {}
    for path in iter_output_files():
        text = path.read_text(encoding="utf-8")
        if ENTRY_ANCHOR not in text:
            continue
        rows = extract_rows(text)
        if rows is None:
            print(f"  WARN 入口テーブル未検出（表組でない可能性）: {path.name}", file=sys.stderr)
            continue
        section = section_of(text)
        if section is None:
            print(f"  WARN 追補節のマーカーが無い: {path.name}", file=sys.stderr)
            continue
        data[path.name] = rows
        sections[path.name] = section
    DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    DATA_JSON.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    SECTIONS_JSON.write_text(
        json.dumps(sections, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    total = sum(len(v) for v in data.values())
    print(f"extracted: {len(data)} files, {total} entry rows -> {DATA_JSON.relative_to(BASE_DIR)}")
    print(f"           {len(sections)} 追補節 -> {SECTIONS_JSON.relative_to(BASE_DIR)}")
    return 0


# --------------------------------------------------------------------------- #
# build: data JSON から入口テーブルを冪等に差し替え
# --------------------------------------------------------------------------- #
def cmd_build(args) -> int:
    if not DATA_JSON.exists():
        print(f"data JSON がありません: {DATA_JSON}\n先に `extract` を実行してください。", file=sys.stderr)
        return 2
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    sections = (
        json.loads(SECTIONS_JSON.read_text(encoding="utf-8"))
        if SECTIONS_JSON.exists()
        else {}
    )
    changed = 0
    restored = 0
    failed = 0
    for name, rows in data.items():
        path = OUTPUT_DIR / name
        if not path.exists():
            print(f"  WARN output が存在しません: {name}", file=sys.stderr)
            continue
        original = path.read_text(encoding="utf-8")
        text = original

        # convert.py 再変換で節ごと消えたケース。入口テーブルだけでは手書き小節を
        # 再現できないため、sections JSON のスナップショットから節ごと戻す。
        if SUPPLEMENT_START not in text:
            section = sections.get(name)
            if section is None:
                print(
                    f"  NG 追補節が消えているがスナップショットがありません: {name}"
                    "（節を持つHTMLが健全なうちに `extract` を実行してください）",
                    file=sys.stderr,
                )
                failed += 1
                continue
            try:
                text = restore_section(text, section)
            except ValueError as e:
                print(f"  NG 追補節を復元できません: {name}: {e}", file=sys.stderr)
                failed += 1
                continue
            restored += 1
            print(f"  restored: {name}（追補節を復元）")

        if ENTRY_ANCHOR not in text:
            print(f"  NG 追補節に「利用者視点の入口」見出しがありません: {name}", file=sys.stderr)
            failed += 1
            continue
        table = render_user_entry_table(rows)
        new_text, n = ENTRY_BLOCK_RE.subn(lambda mm: mm.group(1) + table, text, count=1)
        if n == 0:
            print(f"  NG 入口テーブルを差し替えできません: {name}", file=sys.stderr)
            failed += 1
            continue
        # 本文テーブルと同じ装飾を追補テーブルへ適用する。
        new_text, _ = ensure_supplement_style(new_text)
        # 比較対象はファイルの現物（original）。節を復元した分も確実に書き戻す。
        if new_text != original:
            path.write_text(new_text, encoding="utf-8")
            changed += 1
    print(
        f"build: {changed} files updated（うち追補節の復元 {restored} 件 / 差分なしは冪等で据え置き）"
    )
    if failed:
        print(f"NG: {failed} files を処理できませんでした", file=sys.stderr)
        return 1
    return 0


# --------------------------------------------------------------------------- #
# verify: 追補節の存在と、入口が <table> であることを保証
# --------------------------------------------------------------------------- #
def cmd_verify(args) -> int:
    failures = []
    checked = 0
    # data JSON に載っているファイルは追補節を必ず持つ。ここを「節が無ければ skip」に
    # すると、convert.py 再変換で全ファイルから節が消えても OK: 0 files で素通りする。
    expected = set(json.loads(DATA_JSON.read_text(encoding="utf-8"))) if DATA_JSON.exists() else set()

    for path in iter_output_files():
        text = path.read_text(encoding="utf-8")
        has_section = SUPPLEMENT_START in text
        if not has_section and path.name not in expected:
            continue
        checked += 1
        if not has_section:
            failures.append(
                f"{path.name}: 実装差分追補が消えている（convert.py 再変換後の復元漏れ。build で復元してください）"
            )
            continue
        if ENTRY_ANCHOR not in text:
            failures.append(f"{path.name}: 実装差分追補はあるが「利用者視点の入口」見出しが無い")
            continue
        if not ENTRY_TABLE_RE.search(text):
            failures.append(f"{path.name}: 「利用者視点の入口」が表組(<table>)になっていない")
        elif STYLE_START not in text:
            failures.append(
                f"{path.name}: 追補テーブルの装飾CSS(.endpoint-supplement)が未適用（build で適用してください）"
            )

    missing_files = sorted(n for n in expected if not (OUTPUT_DIR / n).exists())
    for name in missing_files:
        failures.append(f"{name}: 追補節を持つはずの output HTML が存在しない")

    if failures:
        print("NG: 実装差分追補チェック", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        return 1
    print(f"OK: {checked} files、追補節が揃い、全ての「利用者視点の入口」が表組(<table>)です")
    return 0


# --------------------------------------------------------------------------- #
# rows: recheck CSV の導出確認
# --------------------------------------------------------------------------- #
def cmd_rows(args) -> int:
    if not RECHECK_CSV.exists():
        print(f"recheck CSV がありません: {RECHECK_CSV}", file=sys.stderr)
        return 2
    with RECHECK_CSV.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        shown = 0
        for rec in reader:
            if rec["section"].strip() == "Block内部" or rec["method"].strip() == "OPTIONS":
                continue
            if args.grep and args.grep not in (rec["path"] + rec.get("feature", "")):
                continue
            r = row_from_recheck(rec)
            print(f"{r['entry']}\t{r['url']}\t{r['behavior']}")
            shown += 1
            if args.limit and shown >= args.limit:
                break
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("extract", help="現行HTMLから入口行をdata JSONへ抽出")
    sub.add_parser("build", help="data JSONから入口テーブルを冪等に差し替え")
    sub.add_parser("verify", help="入口が<table>であることを検査")
    pr = sub.add_parser("rows", help="recheck CSVから入口行を導出表示")
    pr.add_argument("--grep", default="", help="path/feature 部分一致で絞り込み")
    pr.add_argument("--limit", type=int, default=20)
    args = p.parse_args()
    return {"extract": cmd_extract, "build": cmd_build, "verify": cmd_verify, "rows": cmd_rows}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
