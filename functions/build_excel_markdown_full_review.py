#!/usr/bin/env python3
"""Build a full review report for Excel-derived HTML and embedded function docs.

This script does not prove semantic consistency. It creates a deterministic
inventory of embedded function-design sections and records the current manual /
Claude-assisted findings so reviewers can rerun the HTML verification and track
which mismatches are fixed, deferred, or require Excel-source clarification.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "excel_to_html" / "output"
REPORT_PATH = ROOT / "functions" / "excel_markdown_full_review.md"

EMBED_RE = re.compile(
    r"<!-- function-design-embed:start (?P<key>[^ ]+) -->"
    r"(?P<body>.*?)"
    r"<!-- function-design-embed:end (?P=key) -->",
    re.S,
)
SOURCE_RE = re.compile(r'data-source="(?P<source>[^"]+)"')
HEADING_RE = re.compile(r"<h2>(?P<heading>.*?)</h2>", re.S)


@dataclass(frozen=True)
class EmbedInventory:
    html_file: str
    sheet: str
    key: str
    source: str


def plain_text(fragment: str) -> str:
    fragment = re.sub(r"<style.*?</style>", "", fragment, flags=re.S)
    fragment = re.sub(r"<script.*?</script>", "", fragment, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", fragment))
    return re.sub(r"\s+", " ", text).strip()


def build_inventory() -> list[EmbedInventory]:
    inventory: list[EmbedInventory] = []
    for path in sorted(OUTPUT_DIR.glob("*.html")):
        if path.name == "index.html":
            continue
        document = path.read_text(encoding="utf-8", errors="replace")
        for embed_match in EMBED_RE.finditer(document):
            body = embed_match.group("body")
            source_match = SOURCE_RE.search(body)
            heading_matches = list(HEADING_RE.finditer(document, 0, embed_match.start()))
            sheet = plain_text(heading_matches[-1].group("heading")) if heading_matches else ""
            inventory.append(
                EmbedInventory(
                    html_file=f"excel_to_html/output/{path.name}",
                    sheet=sheet,
                    key=embed_match.group("key"),
                    source=source_match.group("source") if source_match else "",
                )
            )
    return inventory


def render_report(inventory: list[EmbedInventory]) -> str:
    by_html: dict[str, list[EmbedInventory]] = {}
    for item in inventory:
        by_html.setdefault(item.html_file, []).append(item)

    lines = [
        "# Excel/Markdown Full Review",
        "",
        "このレポートは、`excel_to_html/input` 由来の基本設計内容を優先して、"
        "生成HTML内の埋め込みMarkdown設計書を確認するための全件レビュー台帳です。",
        "",
        "## Review Policy",
        "",
        "- Excel/input由来のHTML本文を優先する。",
        "- Excel本文自体に内部矛盾がある場合はMarkdownを勝手に直さず、要確認として残す。",
        "- Claude Codeの指摘は、ローカルのHTML本文とMarkdown本文で再確認してから採用する。",
        "- 重点観点: 件数、選択肢、初期値、最大文字数、CSV列、一覧列、検索条件、ページング、削除/追加項目、ステータス名。",
        "",
        "## Current Findings",
        "",
        "### Fixed in Markdown source",
        "",
        "- M09-04 ページ管理: 一覧の検索ボックス、表示列（ページ名・ルーティング名・URL・ファイル名・レイアウト名）、ページ名/URL/ファイル名/meta系の最大長255文字を反映。",
        "- M09-07 ブロック管理: 一覧の検索ボックス、表示列（ブロック名・ファイル名）、ブロック名/ファイル名の最大長255文字を反映。",
        "- M09-10 支店トップページ管理: 限定品①/②タグとタイル配置ランダム化を項目除去扱いにし、タイル属性をフォーマット別特集/最新エキスパンション/ピックアップ商品/その他に反映。",
        "",
        "### Requires Excel-source clarification",
        "",
        "- M04-22 在庫振替CSV登録: Excelのテンプレート説明は2列だが、CSV定義とMarkdownは振替元商品コード・振替先商品コード・振替点数の3列。",
        "- M04-23 在庫分割結合CSV登録: Excelのテンプレート説明は4列だが、CSV定義とMarkdownは結合元在庫区分を含む5列。",
        "- M04-13 在庫分割結合登録編集（結合）: Excel内のステータス体系とMarkdown/M04-12側のステータス体系が一致しない。",
        "- M04-24 在庫移動指示検索: Excelは表示件数50・ページネーションあり、Markdownは全件取得・ページングなし。",
        "- M11-01 メンバー管理一覧: Excelのリニューアル後一覧列と、現行pf-eccube3由来の稼働列説明が食い違う。正とする画面仕様の決定が必要。",
        "- M11-02 メンバー管理: 追加項目、2段階認証、スマレジ用アカウントの扱いにExcel内の記述差がある。正とする追加項目セットの決定が必要。",
        "",
        "## Embedded Function Inventory",
        "",
        f"Total embedded sections: {len(inventory)}",
        "",
    ]

    for html_file, items in sorted(by_html.items()):
        lines.extend([f"### {html_file}", "", f"Embedded sections: {len(items)}", ""])
        for item in items:
            lines.append(f"- `{item.key}` / {item.sheet} / `{item.source}`")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    inventory = build_inventory()
    REPORT_PATH.write_text(render_report(inventory), encoding="utf-8")
    print(f"Wrote {REPORT_PATH} ({len(inventory)} embedded sections)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
