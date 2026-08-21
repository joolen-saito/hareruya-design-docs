#!/usr/bin/env python3
"""機能設計書が5分類を満たしているか（＝現行ソースから抜け漏れなく取れているか）を監査する。

詳細設計の記述は 処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理 の5分類
だけとする（2026-08-13 ユーザー決定）。Excel基本設計に無い仕様は現行ソースからしか決まらない
ため、この5節が埋まっていない設計書は「未取得」を意味する。

検査するもの:
  1. 5分類の充足（欠落＝現行ソースから補完すべき作業リスト）
  2. 5分類の外にある節が本文に残っていないこと（写像もれ）
  3. ソース根拠（`file:line`）を持つ節の割合（記述が現行ソース由来であることの目安）

  python3 .cursor/skills/reverse-design/scripts/audit_five_sections.py --repo .
  python3 .cursor/skills/reverse-design/scripts/audit_five_sections.py --repo . \
      --from-html "excel_to_html/output/0203_基本設計仕様書(受注管理機能).html"
  python3 .cursor/skills/reverse-design/scripts/audit_five_sections.py --repo . --report /tmp/five.tsv
"""

from __future__ import annotations

import argparse
import importlib.util
import re
import sys
from pathlib import Path

CONVERTER = (
    Path(__file__).resolve().parents[3]
    / "skills/function-spec-html-render/scripts/convert_function_spec_html.py"
)
DOC_IN_HTML_RE = re.compile(r"functions/[a-z0-9\-]+/[a-z0-9_\-]+\.md")
FUNCTION_FILE_RE = re.compile(r"^([a-z]\d{2}-\d{2}[a-z]?_|admin_|front_|api_|batch_|other_)")
# 現行ソースの根拠。`Controller.php:123` のような file:line と、行番号付きテンプレート参照。
EVIDENCE_RE = re.compile(r"[A-Za-z0-9_/\.\-]+\.(?:php|twig|yaml|yml|js|ts|sql):\d+")


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER)
    module = importlib.util.module_from_spec(spec)
    sys.modules["convert_function_spec_html"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def target_docs(repo: Path, from_html: Path | None) -> list[Path]:
    if from_html:
        html = from_html.read_text(encoding="utf-8")
        return [repo / p for p in sorted(set(DOC_IN_HTML_RE.findall(html)))]
    return sorted(
        p
        for p in (repo / "functions").glob("*/*.md")
        if FUNCTION_FILE_RE.match(p.name)
    )


def sections_of(converter, text: str) -> list[tuple[str, list[str]]]:
    """節レベル（H2）で (見出し, 本文行) に分ける。"""
    sections: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] | None = None
    fence: str | None = None
    for line in text.split("\n"):
        fence_match = converter.FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
        elif fence is None:
            heading = converter.HEADING_RE.match(line)
            if heading and len(heading.group(1)) == converter.SECTION_HEADING_LEVEL:
                if current:
                    sections.append(current)
                current = (heading.group(2).strip(), [])
                continue
        if current:
            current[1].append(line)
    if current:
        sections.append(current)
    return sections


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--from-html", type=Path, help="このHTMLに埋め込まれた設計書だけを対象にする")
    parser.add_argument("--report", type=Path, help="機能×5分類のマトリクスをTSV出力する")
    parser.add_argument("--strict", action="store_true", help="欠落があれば非ゼロ終了する")
    args = parser.parse_args()

    repo = args.repo.resolve()
    converter = load_converter()
    allowed = list(converter.ALLOWED_SECTION_TITLES)
    docs = target_docs(repo, args.from_html)
    if not docs:
        print("対象の設計書が無い", file=sys.stderr)
        return 1

    rows = ["doc\t" + "\t".join(allowed) + "\tstray\tevidence"]
    missing_count = {title: 0 for title in allowed}
    stray_total = 0
    without_evidence = 0
    for doc in docs:
        text = doc.read_text(encoding="utf-8")
        sections = sections_of(converter, text)
        present = {title for title, _lines in sections}
        stray = [title for title in present if title not in allowed]
        stray_total += len(stray)
        has_evidence = bool(EVIDENCE_RE.search(text))
        if not has_evidence:
            without_evidence += 1
        cells = []
        for title in allowed:
            ok = title in present
            if not ok:
                missing_count[title] += 1
            cells.append("○" if ok else "欠落")
        rows.append(
            f"{doc.relative_to(repo)}\t" + "\t".join(cells)
            + f"\t{'/'.join(stray) if stray else '-'}\t{'○' if has_evidence else '無'}"
        )

    if args.report:
        args.report.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"マトリクス: {args.report}")

    print(f"対象設計書: {len(docs)}本")
    for title in allowed:
        missing = missing_count[title]
        print(f"  {title:8s} 充足 {len(docs) - missing:3d}本 / 欠落 {missing:3d}本")
    print(f"  5分類外の節が残っている: {stray_total}件")
    print(f"  現行ソース根拠(file:line)が1件も無い設計書: {without_evidence}本")

    failed = stray_total > 0 or (args.strict and any(missing_count.values()))
    print("AUDIT FAILED" if failed else "AUDIT OK")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
