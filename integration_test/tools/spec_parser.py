#!/usr/bin/env python3
"""正本HTML（機能仕様書）パーサ — 結合テスト再生成パイプライン Phase1。

正本HTML（function_spec_html_preview/**/*.html）を、元HTMLの行番号付きで構造化する。
捏造ゼロ・ゲート（policy §7-A）を機械的に支えるための最小情報を抽出する:

  - meta            : 機能ID・タイトル・元md
  - excluded        : phase2-notice / superseded-notice の項目（テスト生成対象外）
  - sections        : 節見出し → {line, next_line}
  - input_fields    : 「入力項目」表 [{name, required, maxlen, initial, storage, line, flags}]
  - tables          : 主要節（バリデーション/DBカラム/権限・認可/画面遷移/エラー処理/データ整合性）の表（行＋行番号）
  - negations       : 明示的否定文（OUT判定の唯一の根拠）[{text, line}]

出力は JSON。file:line 根拠は「<htmlパス>:<line>」で参照できる。

使い方:
  python3 spec_parser.py <html...>            # 各ファイルのサマリを1行TSVで
  python3 spec_parser.py --json <html>        # 1ファイルの完全JSON
"""
from __future__ import annotations
import argparse, html, json, re, sys
from bisect import bisect_right
from pathlib import Path

# 主要節（表を持つ想定）。表ヘッダ署名で入力項目表を同定する。
KEY_SECTIONS = [
    "入力項目", "バリデーション", "DBカラム", "権限・認可", "画面遷移",
    "エラー処理", "データ整合性", "集計条件", "業務ルール・計算", "入出力",
    "エッジケース", "遷移時に引き継ぐ状態", "排他制御・トランザクション",
]
# 明示的否定文の型（OUT の根拠になり得るもの）。「記載の不存在」は含めない。
NEGATION_PATTERNS = [
    r"扱わない", r"行わない", r"持たない", r"設けない", r"制約は?無",
    r"上限は?無", r"追加制約は?無", r"チェックは?無", r"設定しない",
    r"更新しない", r"保存しない", r"再計算.*行わない",
]
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def strip_tags(s: str) -> str:
    return html.unescape(WS_RE.sub(" ", TAG_RE.sub(" ", s))).strip()


class LineMap:
    """全文オフセット → 1始まり行番号。"""

    def __init__(self, raw_lines):
        self.starts = []
        off = 0
        for ln in raw_lines:
            self.starts.append(off)
            off += len(ln) + 1  # +1 = 改行
        self.text = "\n".join(raw_lines)

    def line_of(self, offset: int) -> int:
        return bisect_right(self.starts, offset)


def body_start_offset(text: str) -> int:
    """TOC/CSS を飛ばし、本文（Source: コメント or 最初の h2）から始める。"""
    m = re.search(r"Source:\s*/", text)
    if m:
        return m.start()
    m = re.search(r"<h2\b", text)
    return m.start() if m else 0


def parse_notices(text: str, lm: LineMap):
    """phase2-notice / superseded-notice ブロックの項目を抽出（テスト対象外）。"""
    out = {"phase2": [], "superseded": []}
    for kind, cls in (("phase2", "phase2-notice"), ("superseded", "superseded-notice")):
        # class にマーカーを含む要素（div/ul/li 等）を広めに拾い、li テキストを項目化
        for m in re.finditer(
            r'<(?:div|section|ul)[^>]*class="[^"]*' + cls + r'[^"]*"[^>]*>(.*?)</(?:div|section|ul)>',
            text, re.S,
        ):
            block = m.group(1)
            base_line = lm.line_of(m.start(1))
            items = re.findall(r"<li[^>]*>(.*?)</li>", block, re.S)
            if not items:
                items = [block]
            for it in items:
                t = strip_tags(it)
                if t and len(t) > 4:
                    out[kind].append({"text": t[:300], "line": base_line})
    return out


def parse_headings(text: str, lm: LineMap, body_off: int):
    """h2/h3/summary の見出し → 行番号。TOC(body_off より前)は除外。"""
    heads = []
    for m in re.finditer(r"<(h2|h3|summary)\b[^>]*>(.*?)</\1>", text, re.S):
        if m.start() < body_off:
            continue
        title = strip_tags(m.group(2))
        if title:
            heads.append({"title": title, "line": lm.line_of(m.start()), "offset": m.start()})
    # next_line 付与
    for i, h in enumerate(heads):
        h["next_offset"] = heads[i + 1]["offset"] if i + 1 < len(heads) else len(text)
    return heads


def parse_tables(text: str, lm: LineMap, body_off: int):
    """<table> を (開始行, rows[[cell...]]) で返す。body_off より前は除外。"""
    tables = []
    for m in re.finditer(r"<table\b.*?</table>", text, re.S):
        if m.start() < body_off:
            continue
        rows = []
        for tr in re.findall(r"<tr\b.*?</tr>", m.group(0), re.S):
            cells = [strip_tags(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
            if any(cells):
                rows.append(cells)
        if rows:
            tables.append({"line": lm.line_of(m.start()), "offset": m.start(), "rows": rows})
    return tables


def table_for_section(heads, tables, title):
    """指定節の見出し行〜次見出しの間にある最初の表を返す。"""
    h = next((x for x in heads if x["title"] == title), None)
    if not h:
        return None
    for t in tables:
        if h["offset"] < t["offset"] < h["next_offset"]:
            return t
    return None


def parse_input_fields(text, lm, body_off, tables):
    """入力項目表（ヘッダに『項目名』『必須』or『最大長』）から入力項目を構造化。"""
    tbl = None
    for t in tables:
        hdr = " ".join(t["rows"][0]) if t["rows"] else ""
        if "項目名" in hdr and ("必須" in hdr or "最大長" in hdr):
            tbl = t
            break
    if not tbl:
        return []
    fields = []
    for c in tbl["rows"][1:]:
        joined = " ".join(c)
        name = c[0] if c else ""
        req = "必須" in (c[1] if len(c) > 1 else "")
        nolimit = bool(re.search(r"上限は?無|上限なし|制約は?無|制限は?無|追加制約は?無", joined))
        flags = {
            "required": req,
            "has_len": bool(re.search(r"最大長|文字数|桁", joined)) and not nolimit,
            "has_num": bool(re.search(r"数値|整数|number|金額|数量", joined)),
            "nolimit": nolimit,
        }
        fields.append({
            "name": name,
            "required": "必須" if req else "任意",
            "raw": joined[:200],
            "line": tbl["line"],
            "flags": flags,
        })
    return fields


def parse_negations(text, lm, body_off):
    """明示的否定文（OUT の唯一の根拠）を行番号付きで抽出。行番号は否定語の位置。"""
    out = []
    body = text[body_off:]
    neg_re = re.compile("|".join(NEGATION_PATTERNS))
    for m in re.finditer(r"[^。]*(?:" + "|".join(NEGATION_PATTERNS) + r")[^。]*。", body):
        seg = strip_tags(m.group(0))
        if 4 < len(seg) < 200:
            km = neg_re.search(m.group(0))  # 否定語の位置＝根拠行
            kline = lm.line_of(body_off + m.start() + (km.start() if km else 0))
            out.append({"text": seg, "line": kline})
    # 重複除去
    seen, uniq = set(), []
    for n in out:
        k = n["text"]
        if k not in seen:
            seen.add(k)
            uniq.append(n)
    return uniq


def fid_from_path(p: Path):
    m = re.match(r"([a-z0-9]+)-(\d+)_", p.name)
    return f"{m.group(1)}-{m.group(2)}" if m else p.stem


def parse_html(path: Path):
    raw = path.read_text(encoding="utf-8").splitlines()
    lm = LineMap(raw)
    text = lm.text
    body_off = body_start_offset(text)
    heads = parse_headings(text, lm, body_off)
    tables = parse_tables(text, lm, body_off)
    title = next((h["title"] for h in heads if h["title"] not in ("On this page",)), path.stem)
    src = ""
    m = re.search(r"Source:\s*(\S+)", text)
    if m:
        src = m.group(1)
    result = {
        "meta": {"id": fid_from_path(path), "title": title, "source_md": src, "html": str(path), "lines": len(raw)},
        "excluded": parse_notices(text, lm),
        "sections": [{"title": h["title"], "line": h["line"]} for h in heads],
        "input_fields": parse_input_fields(text, lm, body_off, tables),
        "negations": parse_negations(text, lm, body_off),
        "tables": {},
    }
    for sec in KEY_SECTIONS:
        t = table_for_section(heads, tables, sec)
        if t:
            result["tables"][sec] = {"line": t["line"], "rows": t["rows"]}
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html", nargs="+")
    ap.add_argument("--json", action="store_true", help="1ファイルの完全JSONを出力")
    args = ap.parse_args()
    if args.json:
        print(json.dumps(parse_html(Path(args.html[0])), ensure_ascii=False, indent=2))
        return
    print("id\t入力項目数\t否定文数\tphase2\t廃止\t節数")
    for h in args.html:
        r = parse_html(Path(h))
        print(f"{r['meta']['id']}\t{len(r['input_fields'])}\t{len(r['negations'])}\t"
              f"{len(r['excluded']['phase2'])}\t{len(r['excluded']['superseded'])}\t{len(r['sections'])}")


if __name__ == "__main__":
    main()
