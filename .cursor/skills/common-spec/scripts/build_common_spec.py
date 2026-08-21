#!/usr/bin/env python3
"""共通仕様設計書を機能設計書Markdownから機械生成するハーネス。

多数の機能設計書に同じ内容で繰り返されている節（試行制限・Cookie・排他制御・
セッション・権限認可・ログの禁止リスト）を1本の「共通仕様」へ集約し、各機能の
HTMLからは同じ節を落とす（落とすのは共通と一致する機能だけで、機能固有の内容を
持つ機能は例外として各機能に残す）。

捏造ゼロの原則:
  - 共通仕様の本文は、実際の機能設計書に書かれている文字列をそのまま使う。要約・
    言い換え・補筆をしない。採用した文には必ず出典（path:line）と同一件数を付ける。
  - 「共通と一致するか」の判定は決定的なルールだけで行い、判定できないものは
    例外（＝各機能に残す）へ倒す。

サブコマンド:
  extract  全機能設計書を走査し、節ごとに共通本文・共通に一致する機能・例外機能を
           common_spec/common_spec_data.json へ書き出す。
  build    data JSON から common_spec/共通仕様.md と HTML を生成する。
  verify   data JSON と Markdown/HTML が同期しており、例外機能が空でないことを検査する。

Run: python3 .cursor/skills/common-spec/scripts/build_common_spec.py <extract|build|verify>
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FUNCTIONS_DIR = ROOT / "functions"
DATA_JSON = ROOT / "common_spec" / "common_spec_data.json"
MARKDOWN = ROOT / "common_spec" / "共通仕様.md"
HTML_OUTPUT = ROOT / "excel_to_html" / "output" / "0000_共通仕様.html"
CONVERTER_PATH = (
    ROOT / ".cursor" / "skills" / "function-spec-html-render" / "scripts" / "convert_function_spec_html.py"
)

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
BULLET_RE = re.compile(r"^\s*[-*+]\s+(.*)$")

# 共通仕様へ集約する節。kinds=None は全区分、タプル指定はその区分の設計書だけが対象。
# （権限・認可はフロント・APIでは全件が機能固有だったため管理画面限定。根拠は
#  fable5 の実測: admin 191本中 96% が共通ファイアウォールの2行表のみ）
COMMON_SECTIONS: tuple[dict, ...] = (
    {"title": "試行制限", "kinds": None},
    {"title": "Cookie", "kinds": None},
    {"title": "排他制御・トランザクション", "kinds": None},
    {"title": "セッション", "kinds": None},
    {"title": "権限・認可", "kinds": ("admin",)},
    {"title": "ログに出してはいけないもの", "kinds": None},
)
# 箇条書きの集合で共通判定する節（本文一致ではなく項目の包含で見る）。
ITEM_SET_SECTIONS = ("ログに出してはいけないもの",)
# 「この機能では扱わない」系の宣言。これに当たり、かつ表・小見出しを持たない短い本文は
# 機能固有の内容が無いとみなす。
NON_APPLICABLE_RE = re.compile(
    r"(扱わない|持たない|設けない|設定しない|使用しない|保存しない|書き込まない|"
    r"発行しない|新設しない|該当しない|対象外|存在しない|行わない|無し|なし)"
)
NON_APPLICABLE_MAX_CHARS = 400
# 共通本文として採用する最小件数（これ未満のクラスタしか無い節は共通化しない）。
MIN_CLUSTER = 10
# 禁止リストの共通語彙とみなす最小出現率。
ITEM_COMMON_RATIO = 0.5


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def iter_docs() -> list[Path]:
    """機能設計書のみ（`functions/<区分ディレクトリ>/*.md`）。直下のレポート類は対象外。"""
    return sorted(
        p
        for p in FUNCTIONS_DIR.glob("*/*.md")
        if p.is_file() and not p.name.startswith("_")
    )


def sections_of(text: str) -> list[tuple[str, int, list[str]]]:
    """Return (見出しテキスト, 見出しの1始まり行番号, 本文行) for every heading."""
    lines = text.split("\n")
    out: list[tuple[str, int, list[str]]] = []
    fence: str | None = None
    open_stack: list[tuple[int, int]] = []  # (level, index in out)
    for i, line in enumerate(lines):
        fence_match = FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
        if fence is not None:
            for _, idx in open_stack:
                out[idx][2].append(line)
            continue
        heading = HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            open_stack = [(lv, idx) for lv, idx in open_stack if lv < level]
            out.append((heading.group(2).strip(), i + 1, []))
            open_stack.append((level, len(out) - 1))
            continue
        for _, idx in open_stack:
            out[idx][2].append(line)
    return out


def norm(text: str) -> str:
    return re.sub(r"\s+", "", text)


# 機能固有トークン（コードスパン・機能ID・テーブル名・URL/パス・英数識別子・数字）を
# 伏字にしたうえで比較する。文言は同じで固有名だけが違う節を同一クラスタにまとめるため。
MASK_PATTERNS = (
    (re.compile(r"`[^`]*`"), "<C>"),
    (re.compile(r"[A-Za-z]\d{2}-\d{2}[A-Za-z]?"), "<ID>"),
    (re.compile(r"\b(?:dtb|mtb|plg)_[0-9a-z_]+"), "<T>"),
    (re.compile(r"https?://\S+|/[0-9A-Za-z_{}/\-.]{3,}"), "<P>"),
    (re.compile(r"[0-9A-Za-z_]{3,}"), "<W>"),
    (re.compile(r"\d+"), "0"),
)


def masked(text: str) -> str:
    """機能固有トークンを伏字化した比較用テキスト。"""
    out = text
    for pattern, token in MASK_PATTERNS:
        out = pattern.sub(token, out)
    return norm(out)


def body_text(body: list[str]) -> str:
    return "\n".join(body).strip()


def bullet_items(body: list[str]) -> list[str]:
    items = []
    for line in body:
        match = BULLET_RE.match(line)
        if match:
            items.append(norm(re.sub(r"`", "", match.group(1))))
    return items


def is_non_applicable(body: list[str]) -> bool:
    text = body_text(body)
    if not text:
        return False
    if "|" in text or HEADING_RE.search(text) or len(norm(text)) > NON_APPLICABLE_MAX_CHARS:
        return False
    return bool(NON_APPLICABLE_RE.search(text))


def cmd_extract(args) -> int:
    converter = load_converter()
    previous = (
        json.loads(DATA_JSON.read_text(encoding="utf-8")) if DATA_JSON.exists() else {}
    )
    docs = iter_docs()
    result: dict[str, dict] = {}
    for spec in COMMON_SECTIONS:
        title = spec["title"]
        kinds = spec["kinds"]
        found: list[dict] = []
        for path in docs:
            kind = converter.function_kind(source=path)
            if kinds is not None and kind not in kinds:
                continue
            text = path.read_text(encoding="utf-8")
            for heading, line_no, body in sections_of(text):
                if converter.normalize_heading_title(heading) != converter.normalize_heading_title(title):
                    continue
                found.append(
                    {
                        "doc": path.relative_to(ROOT).as_posix(),
                        "kind": kind,
                        "line": line_no,
                        "body": body_text(body),
                        "items": bullet_items(body),
                        "non_applicable": is_non_applicable(body),
                    }
                )
                break
        if not found:
            continue
        if title in ITEM_SET_SECTIONS:
            counts: Counter[str] = Counter()
            for entry in found:
                counts.update(set(entry["items"]))
            threshold = max(2, int(len(found) * ITEM_COMMON_RATIO))
            common_items = {item for item, n in counts.items() if n >= threshold}
            # 出典は「共通語彙だけで構成された最初の文書」から取る（原文をそのまま使う）。
            representative = next(
                (e for e in found if e["items"] and set(e["items"]) <= common_items), None
            )
            members = [
                e["doc"] for e in found if e["items"] and set(e["items"]) <= common_items
            ]
            exceptions = [
                {"doc": e["doc"], "reason": "共通語彙に無い項目を含む"}
                for e in found
                if e["doc"] not in members
            ]
            result[title] = {
                "kinds": list(kinds) if kinds else None,
                "mode": "item-set",
                "total": len(found),
                "common_text": representative["body"] if representative else "",
                "source": f"{representative['doc']}:{representative['line']}" if representative else "",
                "common_items": [
                    {"text": item, "docs": counts[item]}
                    for item, _ in counts.most_common()
                    if item in common_items
                ],
                "members": members,
                "exceptions": exceptions,
            }
            continue

        clusters: dict[str, list[dict]] = defaultdict(list)
        for entry in found:
            clusters[masked(entry["body"])].append(entry)
        biggest = max(clusters.values(), key=len)
        members: list[str] = []
        exceptions: list[dict] = []
        for entry in found:
            if len(biggest) >= MIN_CLUSTER and masked(entry["body"]) == masked(biggest[0]["body"]):
                members.append(entry["doc"])
            elif entry["non_applicable"]:
                members.append(entry["doc"])
            else:
                exceptions.append({"doc": entry["doc"], "reason": "機能固有の内容を持つ"})
        variants = Counter(
            e["body"] for e in found if e["doc"] in set(members)
        )
        result[title] = {
            "kinds": list(kinds) if kinds else None,
            "mode": "text",
            "total": len(found),
            "common_text": biggest[0]["body"],
            "source": f"{biggest[0]['doc']}:{biggest[0]['line']}",
            "cluster_docs": len(biggest),
            "variants": [
                {"text": text, "docs": n} for text, n in variants.most_common(5)
            ],
            "members": members,
            "exceptions": exceptions,
        }

    # 中間成果物のMarkdownから共通節を落とした後に再抽出すると、共通本文を持つ文書が
    # 消えて台帳が空になり、共通仕様の本文（＝唯一の残り場所）を失う。件数が減る場合は
    # 上書きせず止める（--force で明示的に上書きできる）。
    shrunk = [
        title
        for title, section in previous.items()
        if len(result.get(title, {}).get("members", [])) < len(section.get("members", []))
    ]
    if shrunk and not getattr(args, "force", False):
        print(
            "共通一致の件数が既存台帳より減るため中止しました（Markdown側で既に除外済みの可能性）: "
            + ", ".join(shrunk)
            + "\n意図した再抽出であれば --force を付けてください。",
            file=sys.stderr,
        )
        return 2
    DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    DATA_JSON.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for title, data in result.items():
        print(
            f"  {title}: 対象{data['total']}本 / 共通一致{len(data['members'])}本 / 例外{len(data['exceptions'])}本"
        )
    print(f"extracted -> {DATA_JSON.relative_to(ROOT)}")
    return 0


def render_markdown(data: dict) -> str:
    lines = [
        "# 共通仕様",
        "",
        "複数の機能設計書に同じ内容で繰り返し書かれていた節を、機械的に集約した文書です。",
        "本文は各機能設計書に実際に書かれている文字列をそのまま採録しており、要約・言い換えは行っていません。",
        "機能固有の内容を持つ機能は各節の「例外」に挙げ、その機能の設計書側に残しています。",
        "",
        f"生成元: `functions/*/*.md`（{len(iter_docs())}本） / 生成物: `common_spec/common_spec_data.json`",
        "",
    ]
    for title, section in data.items():
        kinds = section.get("kinds")
        scope = "全区分" if not kinds else "／".join(kinds)
        lines += [
            f"## {title}",
            "",
            f"適用範囲: {scope}　対象 {section['total']}本中 **{len(section['members'])}本**が下記の共通内容"
            f"（例外 {len(section['exceptions'])}本）。",
            "",
        ]
        if section["mode"] == "item-set":
            lines += ["ログに出力してはならない情報（共通語彙。括弧内は同じ項目を挙げている機能数）:", ""]
            for item in section["common_items"]:
                lines.append(f"- {item['text']}（{item['docs']}本）")
            lines += ["", f"出典例: `{section['source']}`", ""]
        else:
            lines += [
                f"共通内容（同一本文 {section.get('cluster_docs', 0)}本 / 出典: `{section['source']}`）:",
                "",
            ]
            for body_line in section["common_text"].split("\n"):
                lines.append(f"> {body_line}" if body_line.strip() else ">")
            lines.append("")
        if section["exceptions"]:
            lines += [
                "### 例外（各機能の設計書に残している機能）",
                "",
                "| 機能設計書 | 理由 |",
                "| --- | --- |",
            ]
            for exception in section["exceptions"]:
                lines.append(f"| `{exception['doc']}` | {exception['reason']} |")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def cmd_build(args) -> int:
    if not DATA_JSON.exists():
        print(f"data JSON がありません: {DATA_JSON}\n先に `extract` を実行してください。", file=sys.stderr)
        return 2
    data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    MARKDOWN.parent.mkdir(parents=True, exist_ok=True)
    MARKDOWN.write_text(render_markdown(data), encoding="utf-8")
    converter = load_converter()
    markdown = MARKDOWN.read_text(encoding="utf-8")
    # 共通仕様は機能設計書ではないので、出力除外規約の区分限定ルールは適用しない
    # （kind/customization を渡さない＝共通の除外節だけが対象になる）。
    HTML_OUTPUT.write_text(
        converter.render_document(markdown, MARKDOWN, []), encoding="utf-8"
    )
    print(f"built: {MARKDOWN.relative_to(ROOT)}")
    print(f"built: {HTML_OUTPUT.relative_to(ROOT)}")
    return 0


def cmd_verify(args) -> int:
    failures: list[str] = []
    if not DATA_JSON.exists():
        failures.append("common_spec_data.json がありません（extract 未実行）")
    else:
        data = json.loads(DATA_JSON.read_text(encoding="utf-8"))
        for title, section in data.items():
            if not section["members"]:
                failures.append(f"{title}: 共通一致が0本（共通化の前提が崩れている）")
            if section["mode"] == "text" and not section["common_text"].strip():
                failures.append(f"{title}: 共通本文が空")
            for doc in section["members"]:
                if not (ROOT / doc).exists():
                    failures.append(f"{title}: 共通一致に実在しない文書 {doc}")
        if not MARKDOWN.exists() or not HTML_OUTPUT.exists():
            failures.append("共通仕様のMarkdown/HTMLが未生成（build 未実行）")
        elif MARKDOWN.read_text(encoding="utf-8") != render_markdown(data):
            failures.append("共通仕様Markdownが data JSON と同期していない（build を再実行）")
    if failures:
        print("NG: 共通仕様チェック", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1
    print("OK: 共通仕様は data JSON と同期しています")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    extract = sub.add_parser("extract", help="機能設計書から共通節を抽出して data JSON を作る")
    extract.add_argument(
        "--force", action="store_true", help="共通一致が減っても台帳を上書きする"
    )
    sub.add_parser("build", help="data JSON から共通仕様Markdown/HTMLを生成する")
    sub.add_parser("verify", help="data JSON と生成物の同期を検査する")
    args = parser.parse_args()
    return {"extract": cmd_extract, "build": cmd_build, "verify": cmd_verify}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
