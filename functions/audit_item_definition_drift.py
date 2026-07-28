#!/usr/bin/env python3
"""HTML設計書の画面項目定義（必須/任意・最大文字数）と現行ソースの乖離を差分出力する。

## 何を突き合わせるか

- **HTML側（Excel由来）**: `excel_to_html/output/*.html` のシートパネル内「画面項目定義」テーブル。
  各行の 必須（◯/-）と 最大文字数（255字 等）。これは顧客合意済みのExcel基本設計の値。
- **実装確認値側**: 各シートパネルに埋め込まれた `function-design-embed` の
  `data-source` が指す機能設計書 `functions/**/*.md` の `### 入力項目` 節。
  この節はソースコード（FormType＋config定数＋Doctrine）から起こした値で、
  ラベル⇄フォームキー⇄DBカラム⇄`NotBlank`/`Length` の橋渡しを確立している。

HTMLの識別IDと実装フィールドの直接リンクは無いため、突合は**シートパネル内でラベル名**で行う
（シート内に閉じるので他書番のラベル衝突は起きない）。ソースの最大文字数は config.yml 定数参照で
コードからの完全自動抽出が不可能なため、確立済みの機能設計書層を実装確認値として使う
（本スクリプトは config.yml もソースコードも読まない）。重複仕様の正はExcelであり、
不一致はExcelの欠陥と決めつけず、Excel要求と実装確認値の差として人が分類する。

## 出力（read-only。HTML・Excel・機能設計書は一切書き換えない）

- `functions/item_definition_drift.tsv`  … 機械可読の全差分行
- `functions/item_definition_drift_report.md` … 人が読むサマリ

検出する差分:
  required  … 必須/任意の不一致（HTML必須◯ vs 設計書任意 など）
  maxlen    … 最大文字数の不一致（255 vs 4096 など）
  unmatched … HTMLの入力項目に対応する設計書入力項目が見つからない（未リバース or ラベル不一致）
"""
from __future__ import annotations

import csv
import html as H
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "excel_to_html" / "output"
FUNCTIONS_DIR = ROOT / "functions"
TSV = FUNCTIONS_DIR / "item_definition_drift.tsv"
REPORT = FUNCTIONS_DIR / "item_definition_drift_report.md"

EMBED_RE = re.compile(
    r"<!-- function-design-embed:start .*?<!-- function-design-embed:end[^>]*-->", re.S
)
PANEL_RE = re.compile(r'<section class="sheet-panel(?: is-active)?" id="(sheet-\d+)">')
HEADING_RE = re.compile(r"<h2>([^<]*)</h2>")
DATA_SOURCE_RE = re.compile(
    r'<!-- function-design-embed:start [^>]*-->\s*'
    r'<section class="function-design-embed"[^>]*data-source="(functions/[^"]+)"'
)
TR_RE = re.compile(r'<tr id="item-(sheet-\d+-[0-9A-Za-z-]+)">(.*?)</tr>', re.S)
CELL_RE = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)
HEADER_TR_RE = re.compile(r"<tr[^>]*>((?:\s*<th\b.*?</th>\s*)+)</tr>", re.S)

# HTML「必須」列の記号 → 判定
REQUIRED_MARKS = {"◯", "○", "〇"}
CONDITIONAL_MARKS = {"△"}
# HTML「書式・制限」列が入力型（必須/最大文字数が意味を持つ）と判断するキーワード
INPUT_FORMAT_RE = re.compile(r"全角|半角|数値|数字|文字列|テキスト|メール|Eメール|パスワード|入力")
# 文字型（最大「文字数」の比較が意味を持つ）。数値項目は「最大値」であり文字数ではないので
# maxlen 比較の対象外にする（例: 基準価格 9999999999 は金額の上限で文字数ではない）。
TEXT_FORMAT_RE = re.compile(r"全角|半角|文字列|テキスト|メール|Eメール|パスワード")
NUMERIC_FORMAT_RE = re.compile(r"^数値|^数字|整数|金額|価格|通貨")


def is_text_format(fmt: str) -> bool:
    f = unicodedata.normalize("NFKC", fmt or "")
    if NUMERIC_FORMAT_RE.search(f) and not TEXT_FORMAT_RE.search(f):
        return False
    return bool(TEXT_FORMAT_RE.search(f))
# 「入力型らしさ」判定用（書式・制限列に単位付き数値があるか等の補助）
MAXLEN_RE = re.compile(r"(\d[\d,]*)\s*(?:文字|字|byte|桁)")
# 範囲表記（4〜50 / 0~999999999 / 1-1000）。上限を最大とみなす。
RANGE_RE = re.compile(r"(\d[\d,]*)\s*[〜～~\-－]\s*(\d[\d,]*)")


def parse_maxlen(cell: str) -> int | None:
    """最大文字数セルから最大値を取り出す。裸の数字・単位付き・範囲を扱い、非数値は None。

    HTMLの「最大文字数または最大値」列は「64」「255字」「4〜50」「0~999999999」など多様。
    設計書の「最大長」列も「50 文字」「4〜50 文字」「64 文字（`…const…`）」など。
    どちらも同じ規約で数値化する。純説明文（「選択」「変更なし」等）は None。
    """
    if not cell:
        return None
    c = unicodedata.normalize("NFKC", cell).strip()
    rng = RANGE_RE.search(c)
    if rng:
        return max(to_int(rng.group(1)), to_int(rng.group(2)))
    unit = MAXLEN_RE.search(c)
    if unit:
        return to_int(unit.group(1))
    # 裸の数字（セル全体が数字、または先頭が数字で単位・記号のみ後続）
    bare = re.match(r"^(\d[\d,]*)(?:\s|$|文字|字|byte|桁|以内|まで|字以内)", c)
    if bare:
        return to_int(bare.group(1))
    return None


def plain(fragment: str) -> str:
    return H.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def norm_label(s: str) -> str:
    """ラベル照合用の正規化。空白・括弧・全半角差・中黒を吸収する。

    HTML「点数で見たマナ・コスト」と設計書「点数で見たマナコスト」のように、
    カタカナ中黒（・ U+30FB / NFKC後の U+FF65）の有無で表記が割れるため除去する。
    """
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[\s()　・・･]", "", s)
    return s.strip()


def to_int(num: str) -> int:
    return int(num.replace(",", ""))


# --------------------------------------------------------------------------- #
# HTML側: シートパネルごとの画面項目定義と埋め込み設計書
# --------------------------------------------------------------------------- #
def header_index(panel: str) -> dict[str, int] | None:
    """画面項目定義テーブルのヘッダから列名→indexを引く。列順は表の型で変わるため必須。"""
    for m in HEADER_TR_RE.finditer(panel):
        cells = [plain(c) for c in re.findall(r"<th\b[^>]*>(.*?)</th>", m.group(1), re.S)]
        joined = " ".join(cells)
        if "必須" not in joined:
            continue
        idx: dict[str, int] = {}
        for i, c in enumerate(cells):
            cn = c.replace("\n", "").replace(" ", "")
            if cn.startswith("ラベル") or cn.startswith("項目名"):
                idx.setdefault("label", i)
            elif "書式" in cn or "画面部品の種類" in cn:
                idx["format"] = i
            elif cn == "必須":
                idx["required"] = i
            elif "最大文字数" in cn or cn == "最大値" or "最大文字数または最大値" in cn:
                idx.setdefault("maxlen", i)
        if "label" in idx and "required" in idx:
            return idx
    return None


def html_items(panel: str) -> list[dict]:
    """1シートパネルの画面項目定義行（入力型のみ）。"""
    idx = header_index(panel)
    if not idx:
        return []
    items = []
    for m in TR_RE.finditer(panel):
        cells = [plain(c) for c in CELL_RE.findall(m.group(2))]
        if len(cells) <= idx["required"]:
            continue
        label = cells[idx["label"]] if idx["label"] < len(cells) else ""
        if not label:
            continue
        fmt = cells[idx["format"]] if "format" in idx and idx["format"] < len(cells) else ""
        req_raw = cells[idx["required"]]
        max_raw = cells[idx["maxlen"]] if "maxlen" in idx and idx["maxlen"] < len(cells) else ""
        # 入力型に限定（必須/最大文字数が意味を持つのはテキスト・数値入力のみ）
        if not (INPUT_FORMAT_RE.search(fmt) or parse_maxlen(max_raw) is not None):
            continue
        if req_raw in REQUIRED_MARKS:
            required = "必須"
        elif req_raw in CONDITIONAL_MARKS or ("必須" in req_raw and req_raw not in ("必須",)):
            required = "条件付き"
        elif req_raw in ("-", "", "－"):
            required = "任意"
        else:
            required = "条件付き"  # 自由文（「チェック時のみ必須」等）
        maxlen = parse_maxlen(max_raw)
        items.append({
            "item_id": m.group(1),
            "label": label,
            "format": fmt,
            "required": required,
            "required_raw": req_raw or "-",
            "maxlen": maxlen,
            "maxlen_raw": max_raw or "-",
        })
    return items


def panels_of(document: str):
    """(sheetId, シート名, パネルHTML, 埋め込み設計書パスのリスト) を返す。"""
    starts = [(m.start(), m.group(1)) for m in PANEL_RE.finditer(document)]
    bounds = starts + [(len(document), "END")]
    for i in range(len(starts)):
        s = bounds[i][0]
        e = bounds[i + 1][0]
        panel = document[s:e]
        head = HEADING_RE.search(panel)
        name = plain(head.group(1)) if head else ""
        docs = DATA_SOURCE_RE.findall(panel)
        # 画面項目定義は埋め込み節の外にあるので、突合用に埋め込みを除去したパネルを渡す
        panel_wo_embed = EMBED_RE.sub("", panel)
        yield starts[i][1], name, panel_wo_embed, docs


# --------------------------------------------------------------------------- #
# 設計書側: ### 入力項目 節（ラベル → 必須/最大長）
# --------------------------------------------------------------------------- #
_doc_cache: dict[str, dict[str, dict]] = {}

# 入力フィールドの必須/最大長を列挙している節の見出し。テンプレートによって表記が割れる。
# 「入力項目」始まり（入力項目／入力項目（モーダル）／入力項目（画面上）等）と「フォーム項目」。
# 検索条件・一覧項目・CSV列は必須/最大文字数の意味が異なるので対象外。
INPUT_SECTION_RE = re.compile(r"^### (入力項目.*|フォーム項目.*)$", re.M)


def has_input_section(rel_path: str) -> bool:
    path = ROOT / rel_path
    return path.exists() and bool(INPUT_SECTION_RE.search(path.read_text(encoding="utf-8")))


def doc_input_items(rel_path: str) -> dict[str, dict]:
    """機能設計書の入力項目節を label正規化 → {required,maxlen,...} で返す。"""
    if rel_path in _doc_cache:
        return _doc_cache[rel_path]
    path = ROOT / rel_path
    result: dict[str, dict] = {}
    if not path.exists():
        _doc_cache[rel_path] = result
        return result
    text = path.read_text(encoding="utf-8")
    # 入力項目系の節本文を全部集める
    secs = []
    for m in INPUT_SECTION_RE.finditer(text):
        body = text[m.end():]
        nxt = re.search(r"\n#{2,3} ", body)
        secs.append(body[:nxt.start()] if nxt else body)
    for sec in secs:
        for line in sec.splitlines():
            if not line.startswith("|") or "項目名" in line or re.match(r"\|[\s|:-]+\|$", line):
                continue
            cols = [c.strip() for c in line.split("|")[1:-1]]
            if len(cols) < 3 or not cols[0]:
                continue
            name, req_col, max_col = cols[0], cols[1], cols[2]
            if req_col.startswith("必須"):
                required = "必須"
            elif req_col.startswith("任意"):
                required = "任意"
            else:
                required = "条件付き"  # 条件付き必須・実質必須・キャンセル時必須 等
            maxlen = parse_maxlen(max_col)
            info = {
                "name": name,
                "required": required,
                "required_raw": req_col,
                "maxlen": maxlen,
                "maxlen_raw": max_col,
            }
            # 「パスワード／パスワード(確認)」のような結合ラベルは各要素でも引けるようにする。
            for part in re.split(r"[／/、]", name):
                part = part.strip()
                if part:
                    result.setdefault(norm_label(part), info)
    _doc_cache[rel_path] = result
    return result


# --------------------------------------------------------------------------- #
# 突合
# --------------------------------------------------------------------------- #
FIELDS = [
    "book", "sheetId", "sheetName", "itemId", "label", "kind",
    "htmlValue", "sourceValue", "sourceDoc", "note",
]


def audit() -> list[dict]:
    rows: list[dict] = []
    for path in sorted(OUTPUT_DIR.glob("*基本設計仕様書*.html")):
        book = path.name[:4]
        document = path.read_text(encoding="utf-8")
        for sheet_id, sheet_name, panel, docs in panels_of(document):
            items = html_items(panel)
            if not items:
                continue
            # このシートに埋まった全設計書の入力項目をマージ（ラベル→情報）
            src: dict[str, dict] = {}
            for d in docs:
                for k, v in doc_input_items(d).items():
                    src.setdefault(k, {**v, "doc": d})
            # このシートの設計書が入力項目節を1つでも持つか（持たない＝検索/一覧/バッチ系）
            any_input_section = any(has_input_section(d) for d in docs)
            for it in items:
                key = norm_label(it["label"])
                base = {
                    "book": book, "sheetId": sheet_id, "sheetName": sheet_name,
                    "itemId": it["item_id"], "label": it["label"],
                }
                if key not in src:
                    if not any_input_section:
                        # 設計書に入力項目節が無い（検索条件・一覧・CSV等）。真の乖離ではなく突合不能。
                        kind, note = "no-input-section", "埋め込み設計書に入力項目節が無い（検索/一覧/CSV等。必須・最大文字数の突合対象外）"
                    else:
                        kind, note = "unmatched-label", "設計書の入力項目節に対応ラベルが無い（未リバース or ラベル不一致。要確認）"
                    rows.append({**base, "kind": kind,
                                 "htmlValue": f"必須={it['required']} 最大={it['maxlen'] if it['maxlen'] is not None else '-'}",
                                 "sourceValue": "-", "sourceDoc": ";".join(d.split('/')[-1] for d in docs),
                                 "note": note})
                    continue
                s = src[key]
                doc_name = s["doc"].split("/")[-1]
                # 必須の不一致（条件付きは判定保留）
                if it["required"] in ("必須", "任意") and s["required"] in ("必須", "任意") \
                        and it["required"] != s["required"]:
                    rows.append({**base, "kind": "required",
                                 "htmlValue": it["required"], "sourceValue": s["required"],
                                 "sourceDoc": doc_name,
                                 "note": f"HTML必須記号={it['required_raw']} / 設計書={s['required_raw']}"})
                # 最大文字数の不一致。**文字型のみ**（数値項目の「最大値」は文字数ではない）。
                #  - 両方に数値があり値が違う
                #  - 設計書に数値があるのにHTMLに最大文字数が無い（HTMLが制限を書き落とし）
                #  - HTMLに数値があるのに設計書に無い（設計書がconfig委譲等で数値未記載。参考）
                if not is_text_format(it["format"]):
                    continue
                h_max, s_max = it["maxlen"], s["maxlen"]
                if h_max is not None and s_max is not None and h_max != s_max:
                    rows.append({**base, "kind": "maxlen",
                                 "htmlValue": str(h_max), "sourceValue": str(s_max),
                                 "sourceDoc": doc_name,
                                 "note": f"HTML={it['maxlen_raw']} / 設計書={s['maxlen_raw'][:30]}"})
                elif h_max is None and s_max is not None:
                    rows.append({**base, "kind": "maxlen-missing-html",
                                 "htmlValue": it["maxlen_raw"], "sourceValue": str(s_max),
                                 "sourceDoc": doc_name,
                                 "note": f"HTMLに最大文字数の記載が無いが、現行ソースは最大 {s_max} を課している（HTML={it['maxlen_raw']} / 設計書={s['maxlen_raw'][:30]}）"})
                elif h_max is not None and s_max is None:
                    rows.append({**base, "kind": "maxlen-missing-source",
                                 "htmlValue": str(h_max), "sourceValue": s["maxlen_raw"],
                                 "sourceDoc": doc_name,
                                 "note": f"HTMLは最大 {h_max} だが設計書に数値記載が無い（config委譲/範囲/非数値の可能性。要確認。設計書={s['maxlen_raw'][:30]}）"})
    return rows


def write_outputs(rows: list[dict]) -> dict:
    with TSV.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    from collections import Counter
    by_kind = Counter(r["kind"] for r in rows)
    by_book_kind: dict[tuple, int] = Counter((r["book"], r["kind"]) for r in rows)
    books = sorted({r["book"] for r in rows})

    total_findings = sum(by_kind.values())
    lines = ["# 画面項目定義ドリフト差分レポート", ""]
    lines.append("HTML設計書の画面項目定義（Excel由来の 必須／最大文字数）を、機能設計書の入力項目節"
                 "（現行ソースから起こした実装確認値）と突き合わせ、差分を出力する。"
                 "**重複仕様の正はExcel基本設計**とし、差分は実装済み・実装違い・移行前後差へ分類する。"
                 "生成物（HTML・Excel・機能設計書）は一切書き換えない。")
    lines.append("")
    lines.append(f"生成: `functions/audit_item_definition_drift.py` ／ "
                 f"全出力: `{TSV.relative_to(ROOT)}`（{total_findings}行）")
    lines.append("")
    lines.append("## サマリ")
    lines.append("")
    lines.append("### 要対応（確定乖離）")
    lines.append(f"- **必須/任意の不一致: {by_kind.get('required', 0)} 件** — HTML(Excel)とソースで必須判定が逆")
    lines.append(f"- **最大文字数の不一致（両方に数値・値違い）: {by_kind.get('maxlen', 0)} 件** — 文字型のみ（数値項目の最大値は除外）")
    lines.append(f"- **最大文字数がHTMLに無いがソースにある: {by_kind.get('maxlen-missing-html', 0)} 件** — HTMLが文字数制限を書き落とし")
    lines.append("")
    lines.append("### 要確認")
    lines.append(f"- 最大文字数がHTMLにあるがソースに数値記載が無い: {by_kind.get('maxlen-missing-source', 0)} 件 — ソースがconfig委譲/範囲/非数値。TSV参照")
    lines.append(f"- 未マッチ（設計書に入力項目節はあるがラベル不一致）: {by_kind.get('unmatched-label', 0)} 件 — 未リバース or ラベル揺れ or Excelにのみ在る項目。TSV参照")
    lines.append("")
    lines.append("### 参考（突合対象外）")
    lines.append(f"- 設計書に入力項目節が無いシート（検索/一覧/CSV等）: {by_kind.get('no-input-section', 0)} 件")
    lines.append("")
    lines.append("## 読み方")
    lines.append("")
    lines.append("- **重複仕様の正典はExcel基本設計**。機能設計書はFormType＋config定数＋Doctrineから"
                 "リバースした実装確認値として比較し、食い違いを実装違いまたは移行前後差として分類する。"
                 "機能設計書自体の実装忠実性は別途config.yml直読みで再検証できる。")
    lines.append("- **必須**: HTML の ◯/○/〇＝必須、-/空＝任意。条件付き（△・自由文）は判定保留で乖離に数えない。")
    lines.append("- **最大文字数**: 文字型（半角/全角/文字列/テキスト/メール/パスワード）のみ比較。"
                 "数値項目の「最大値」（金額の上限等）は文字数ではないので対象外。範囲は上限を採用。")
    lines.append("- **maxlen-missing-html は自動でExcelの記載漏れと断定しない**。Excel要求、実装上限、"
                 "移行前後差を確認してから分類する。")
    lines.append("")
    lines.append("## 書番別")
    lines.append("")
    lines.append("| 書番 | 必須不一致 | 最大数値不一致 | 最大HTML欠落 | 最大ソース未記載 | 未マッチ | 対象外 |")
    lines.append("|---|---|---|---|---|---|---|")
    for b in books:
        lines.append(f"| {b} | {by_book_kind.get((b,'required'),0)} | "
                     f"{by_book_kind.get((b,'maxlen'),0)} | {by_book_kind.get((b,'maxlen-missing-html'),0)} | "
                     f"{by_book_kind.get((b,'maxlen-missing-source'),0)} | {by_book_kind.get((b,'unmatched-label'),0)} | "
                     f"{by_book_kind.get((b,'no-input-section'),0)} |")
    detail_sections = [
        ("required", "必須/任意の不一致", "HTML必須", "設計書"),
        ("maxlen", "最大文字数の不一致（両方に数値）", "HTML", "設計書"),
        ("maxlen-missing-html", "最大文字数がHTMLに無いがソースにある", "HTML", "ソース最大"),
        ("maxlen-missing-source", "最大文字数がHTMLにあるがソースに数値記載が無い（要確認）", "HTML", "設計書記載"),
    ]
    for kind, title, hcol, scol in detail_sections:
        sel = [r for r in rows if r["kind"] == kind]
        if not sel:
            continue
        lines += ["", f"## {title}（{len(sel)}件）", "",
                  f"| 書番 | シート | 識別ID | ラベル | {hcol} | {scol} | 根拠設計書 |",
                  "|---|---|---|---|---|---|---|"]
        for r in sel:
            iid = r["itemId"].split("-", 1)[-1] if "-" in r["itemId"] else r["itemId"]
            lines.append(f"| {r['book']} | {r['sheetName']} | {iid} | {r['label']} | "
                         f"{r['htmlValue']} | {r['sourceValue']} | {r['sourceDoc']} |")
    lines += ["", "## 未マッチ・突合対象外について", "",
              f"未マッチ {by_kind.get('unmatched-label',0)} 件と突合対象外 {by_kind.get('no-input-section',0)} 件は"
              f"件数が多いため本レポートには列挙しない。`{TSV.relative_to(ROOT)}` の "
              "`kind=unmatched-label` / `kind=no-input-section` を参照。未マッチには "
              "「Excelにあってソースに無い項目（真の差分）」と「ラベル表記揺れ」が混在する。", ""]
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"total": len(rows), **by_kind}


def main() -> int:
    rows = audit()
    stat = write_outputs(rows)
    print(f"差分: 必須={stat.get('required',0)}  最大数値不一致={stat.get('maxlen',0)}  "
          f"最大HTML欠落={stat.get('maxlen-missing-html',0)}  最大ソース未記載={stat.get('maxlen-missing-source',0)}  "
          f"未マッチ={stat.get('unmatched-label',0)}  対象外={stat.get('no-input-section',0)}  （計{stat['total']}）")
    print(f"  -> {TSV.relative_to(ROOT)}")
    print(f"  -> {REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
