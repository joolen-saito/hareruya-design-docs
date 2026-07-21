#!/usr/bin/env python3
"""ec-cube-enterprise 実ソースからメッセージを決定的に抽出する（捏造ゼロ）。

抽出対象（ユーザ確定スコープ）:
  1. flash … Controller の addSuccess/addError/addWarning/addInfo/addDanger(+Once)
  2. form  … src/Eccube/Form 配下の制約 message（NotBlank 等）
  3. js    … Twig/JS の confirm()/alert()（SweetAlert含む）

出力:
  message_inventory/raw_messages.jsonl  … 1メッセージ1行の中間データ
各行は必ず file:line を持ち、resolved が None のものは「要ソース確認」として
後段（codex/fable5）が実ソースを読んで確定する。ここでは推測で埋めない。

使い方:
  python3 extract_messages.py            # 全抽出→jsonl出力
  python3 extract_messages.py --stats    # 統計のみ
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import lib_messages as L

EE = L.EE_ROOT
OUT = L.DOC_ROOT / "message_inventory" / "raw_messages.jsonl"

CONTROLLER_DIRS = [EE / "src/Eccube/Controller", EE / "app"]
FORM_DIRS = [EE / "src/Eccube/Form", EE / "app"]
TEMPLATE_DIRS = [EE / "src/Eccube/Resource/template", EE / "html"]

FLASH_CALL = re.compile(r"->(?P<method>add(?:Success|Error|Warning|Info|Danger)(?:Once)?|addFlash)\s*\(")


def scan_call_args(text: str, open_pos: int) -> tuple[str, int] | None:
    """'(' 位置から対応する ')' まで括弧・クォートをバランス走査し、
    引数文字列全体と終端位置を返す。多行・入れ子括弧に対応。"""
    depth = 0
    i = open_pos
    n = len(text)
    quote = None
    while i < n:
        c = text[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ("'", '"'):
            quote = c
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return text[open_pos + 1:i], i
        i += 1
    return None


def split_top_args(arglist: str) -> list[str]:
    """トップレベルのカンマで引数分割（括弧・クォート内は無視）。"""
    args, depth, quote, start = [], 0, None, 0
    i = 0
    while i < len(arglist):
        c = arglist[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ("'", '"'):
            quote = c
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif c == "," and depth == 0:
            args.append(arglist[start:i].strip())
            start = i + 1
        i += 1
    args.append(arglist[start:].strip())
    return args
# 第1引数の代表パターン
ARG_LITERAL = re.compile(r"^'((?:[^'\\]|\\.)*)'$")
ARG_TRANS = re.compile(r"trans\(\s*'([^']+)'")  # arg内の任意位置の trans('key')
ARG_VARIABLE = re.compile(r"^\$[A-Za-z_]")


def iter_php(dirs: list[Path]):
    for d in dirs:
        if not d.exists():
            continue
        for p in sorted(d.rglob("*.php")):
            yield p


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def extract_flash(trans: dict[str, str], file_to_fids: dict[str, list[str]]) -> list[dict]:
    rows: list[dict] = []
    for path in iter_php(CONTROLLER_DIRS):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "add" not in text:
            continue
        rel = L.rel_ee(path)
        for m in FLASH_CALL.finditer(text):
            method = m.group("method")
            scanned = scan_call_args(text, m.end() - 1)
            if not scanned:
                continue
            arglist, _end = scanned
            parts = split_top_args(arglist)
            arg = parts[0].strip() if parts else ""
            # namespace: 第2引数のクォート文字列（'admin'/'front'）
            ns = "front"
            if len(parts) >= 2:
                nm = re.match(r"^'([^']*)'$", parts[1].strip())
                if nm:
                    ns = nm.group(1)
            key = None
            resolved = None
            kind = "other"
            lit = ARG_LITERAL.match(arg)
            tr = ARG_TRANS.search(arg)
            if lit:
                raw = lit.group(1).replace("\\'", "'")
                resolved, kind = L.resolve_text(raw, trans)
                if kind in ("key", "key_unknown"):
                    key = raw
            elif tr and "." in tr.group(1):
                key = tr.group(1)
                resolved, _ = L.resolve_text(key, trans)
                kind = "key" if resolved else "key_unknown"
            elif ARG_VARIABLE.match(arg):
                kind = "variable"  # $message等: codexが実ソースで確定
            rows.append(
                {
                    "source_type": "flash",
                    "method": method,
                    "kind_label": L.FLASH_KIND.get(method, "インフォ"),
                    "namespace": ns,
                    "key": key,
                    "arg_raw": arg[:120],
                    "resolved": resolved,
                    "resolve_kind": kind,
                    "file": rel,
                    "line": line_of(text, m.start()),
                    "candidate_fids": file_to_fids.get(rel, []),
                    "heuristic_fid": "" if file_to_fids.get(rel) else L.heuristic_fid(rel),
                    "display_where": "管理画面上部" if ns == "admin" else "画面上部",
                    "display_element": "フラッシュメッセージ",
                }
            )
    return rows


FORM_MSG_RE = re.compile(r"['\"]message['\"]\s*=>\s*(?P<val>'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|\$this->trans\([^)]*\))")


def extract_form(trans: dict[str, str], file_to_fids: dict[str, list[str]]) -> list[dict]:
    rows: list[dict] = []
    for path in iter_php(FORM_DIRS):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "message" not in text:
            continue
        rel = L.rel_ee(path)
        for m in FORM_MSG_RE.finditer(text):
            val = m.group("val")
            resolved = None
            kind = "other"
            key = None
            if val.startswith("$this->trans"):
                km = re.search(r"trans\(\s*'([^']+)'", val)
                if km:
                    key = km.group(1)
                    resolved, _ = L.resolve_text(key, trans)
                    kind = "key" if resolved else "key_unknown"
            else:
                raw = val[1:-1].replace("\\'", "'").replace('\\"', '"')
                resolved, kind = L.resolve_text(raw, trans)
                if kind in ("key", "key_unknown"):
                    key = raw
            rows.append(
                {
                    "source_type": "form",
                    "method": "constraint",
                    "kind_label": "エラー(バリデーション)",
                    "namespace": "",
                    "key": key,
                    "arg_raw": val[:120],
                    "resolved": resolved,
                    "resolve_kind": kind,
                    "file": rel,
                    "line": line_of(text, m.start()),
                    "candidate_fids": file_to_fids.get(rel, []),
                    "heuristic_fid": "",
                    "display_where": "入力項目直下",
                    "display_element": "フォームバリデーション",
                }
            )
    return rows


FORM_ERROR_DIRS = [EE / "src/Eccube/Form", EE / "src/Eccube/Service/Csv", EE / "app"]


def extract_form_errors(trans: dict[str, str], file_to_fids: dict[str, list[str]]) -> list[dict]:
    """Form Type / CSV 内の `$form->...->addError(new FormError(...))` 等、
    フォームレベル検証エラー（利用者向け）を抽出する。Controller由来のflashとは
    file:lineで重複しない。"""
    rows: list[dict] = []
    for path in iter_php(FORM_ERROR_DIRS):
        text = path.read_text(encoding="utf-8", errors="replace")
        if "->addError(" not in text and "->addWarning(" not in text:
            continue
        rel = L.rel_ee(path)
        for m in FLASH_CALL.finditer(text):
            method = m.group("method")
            if method not in ("addError", "addWarning"):
                continue
            scanned = scan_call_args(text, m.end() - 1)
            if not scanned:
                continue
            arglist = scanned[0]
            arg = split_top_args(arglist)[0].strip() if arglist.strip() else ""
            resolved = None
            kind = "other"
            key = None
            lit = ARG_LITERAL.match(arg)
            tr = ARG_TRANS.search(arg)
            if lit:
                raw = lit.group(1).replace("\\'", "'")
                resolved, kind = L.resolve_text(raw, trans)
                if kind in ("key", "key_unknown"):
                    key = raw
            elif tr and "." in tr.group(1):
                key = tr.group(1)
                resolved, _ = L.resolve_text(key, trans)
                kind = "key" if resolved else "key_unknown"
            elif ARG_VARIABLE.match(arg):
                kind = "variable"
            rows.append(
                {
                    "source_type": "form",
                    "method": method,
                    "kind_label": "エラー(バリデーション)",
                    "namespace": "",
                    "key": key,
                    "arg_raw": arg[:120],
                    "resolved": resolved,
                    "resolve_kind": kind,
                    "file": rel,
                    "line": line_of(text, m.start()),
                    "candidate_fids": file_to_fids.get(rel, []),
                    "heuristic_fid": "",
                    "display_where": "入力項目直下/フォーム上部",
                    "display_element": "フォームバリデーション",
                }
            )
    return rows


JS_RE = re.compile(r"\b(?P<fn>confirm|alert)\s*\(\s*(?P<q>['\"])(?P<msg>(?:(?!\2).)*)\2\s*\)", re.S)
TRANS_IN_TWIG = re.compile(r"['\"]?\{\{\s*['\"]([^'\"]+)['\"]\s*\|\s*trans[^}]*\}\}['\"]?")
JP_RE = re.compile(r"[぀-ヿ一-鿿]")

# data-* 属性経由のメッセージ（ボタン→JS が confirm / modal .text() で表示）。
# 例: data-confirm="…" / data-message="{{ 'key'|trans }}" / data-confirm-message="…"
DATA_MSG_RE = re.compile(r"data-(?P<attr>confirm-message|confirm|message)\s*=\s*\"(?P<msg>[^\"]*)\"", re.S)
# JS がモーダル本文/タイトルへ差し込む文言。引数が Twig trans か和文リテラルのものだけ拾う。
DOM_INJECT_RE = re.compile(
    r"\.(?P<fn>text|html)\s*\(\s*(?P<arg>\"\{\{[^\"]*\|\s*trans[^\"]*\}\}\"|'\{\{[^']*\|\s*trans[^']*\}\}'|\"[^\"]*[぀-ヿ一-鿿][^\"]*\"|'[^']*[぀-ヿ一-鿿][^']*')\s*\)",
    re.S,
)
# トースト/通知系のカスタム呼び出し。
NOTIFY_RE = re.compile(
    r"\b(?P<fn>toastr\.\w+|iziToast\.\w+|Swal\.fire|showToast|showMessage|showAlert|showError|showConfirm|notify)\s*\(\s*(?P<q>['\"])(?P<msg>(?:(?!\2).)*)\2",
    re.S,
)

# 非メッセージの data-confirm 値（真偽/数値/空）は除外
_SKIP_ATTR_VAL = re.compile(r"^\s*(true|false|1|0|)\s*$", re.I)


def _resolve_js(raw: str, trans: dict[str, str]) -> tuple[str | None, str]:
    """JS/属性の引数文字列を実ソース由来の確定文言へ。捏造ゼロ: literalかkey値のみ。"""
    tw = TRANS_IN_TWIG.search(raw)
    if tw:
        key = tw.group(1)
        rt, _ = L.resolve_text(key, trans)
        return (rt or raw, "key" if rt else "key_unknown")
    s = raw.strip()
    if len(s) >= 2 and s[0] in "'\"`" and s[-1] == s[0]:
        s = s[1:-1]
    if JP_RE.search(s):
        return (s, "literal_ja")
    return (None, "other")  # 変数/動的連結 → codex が実ソースで確定


def extract_js(trans: dict[str, str]) -> list[dict]:
    rows: list[dict] = []
    for d in TEMPLATE_DIRS:
        if not d.exists():
            continue
        for path in sorted(list(d.rglob("*.twig")) + list(d.rglob("*.js"))):
            text = path.read_text(encoding="utf-8", errors="replace")
            try:
                rel = L.rel_ee(path)
            except ValueError:
                rel = str(path)

            def add(fn, kind_label, msg, resolved, kind, where, element, start):
                rows.append(
                    {
                        "source_type": "js",
                        "method": fn,
                        "kind_label": kind_label,
                        "namespace": "",
                        "key": None,
                        "arg_raw": msg[:120],
                        "resolved": resolved,
                        "resolve_kind": kind,
                        "file": rel,
                        "line": line_of(text, start),
                        "candidate_fids": [],  # Twig→機能はcodex/テンプレ参照で確定
                        "heuristic_fid": "",
                        "display_where": where,
                        "display_element": element,
                    }
                )

            # 1. confirm() / alert()
            for m in JS_RE.finditer(text):
                msg = m.group("msg")
                resolved, kind = msg, "literal_ja"
                tw = TRANS_IN_TWIG.search(msg)
                if tw:
                    rt, _ = L.resolve_text(tw.group(1), trans)
                    resolved, kind = (rt or msg), ("key" if rt else "key_unknown")
                elif not JP_RE.search(msg):
                    resolved, kind = (msg or None), "other"
                is_confirm = m.group("fn") == "confirm"
                add(m.group("fn"), "確認" if is_confirm else "警告", msg, resolved, kind,
                    "画面中央(ダイアログ)", "確認ダイアログ" if is_confirm else "警告ダイアログ", m.start())

            # 2. data-confirm / data-message / data-confirm-message 属性
            for m in DATA_MSG_RE.finditer(text):
                raw = m.group("msg")
                if _SKIP_ATTR_VAL.match(raw):
                    continue
                resolved, kind = _resolve_js(raw, trans)
                if kind == "other" and not resolved:
                    # 変数のみ（和文/keyなし）は取りこぼし防止でノートだけ残す
                    resolved = None
                if resolved is None and kind == "other":
                    # 完全動的: codex 確定用に行は残す
                    pass
                is_confirm = m.group("attr") != "message"
                add(f"data-{m.group('attr')}", "確認",
                    raw, resolved, kind,
                    "画面中央(ダイアログ/モーダル)",
                    "確認ダイアログ" if is_confirm else "確認モーダル", m.start())

            # 3. モーダルへ JS で差し込む文言 (.text()/.html() に trans/和文)
            for m in DOM_INJECT_RE.finditer(text):
                raw = m.group("arg")
                resolved, kind = _resolve_js(raw, trans)
                if resolved is None:
                    continue
                add(f".{m.group('fn')}()", "インフォ", raw, resolved, kind,
                    "画面中央(モーダル)", "モーダル文言", m.start())

            # 4. トースト/通知系カスタム呼び出し
            for m in NOTIFY_RE.finditer(text):
                msg = m.group("msg")
                resolved, kind = _resolve_js(msg, trans)
                if resolved is None:
                    continue
                add(m.group("fn"), "インフォ", msg, resolved, kind,
                    "画面隅(トースト/通知)", "トースト", m.start())
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stats", action="store_true")
    args = ap.parse_args()

    trans = L.load_translations()
    file_to_fids, _route_to_fids, _meta = L.load_function_map()

    flash = extract_flash(trans, file_to_fids)
    form = extract_form(trans, file_to_fids)
    form_err = extract_form_errors(trans, file_to_fids)
    js = extract_js(trans)
    # 重複排除（同一 file:line）: form制約とform_errorが同一行を指す可能性に備える
    seen = {(r["file"], r["line"]) for r in form}
    form_err = [r for r in form_err if (r["file"], r["line"]) not in seen]
    allrows = flash + form + form_err + js

    if args.stats:
        from collections import Counter

        print(f"flash={len(flash)} form={len(form)} js={len(js)} total={len(allrows)}")
        print("resolve_kind:", dict(Counter(r["resolve_kind"] for r in allrows)))
        print("unresolved(要確認):", sum(1 for r in allrows if not r["resolved"]))
        print("flash unmapped(候補機能0):", sum(1 for r in flash if not r["candidate_fids"]))
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as fh:
        for r in allrows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"wrote {len(allrows)} rows -> {OUT}")


if __name__ == "__main__":
    main()
