#!/usr/bin/env python3
"""中間成果物のMarkdownからも出力除外規約の対象節・対象列を落とすハーネス。

HTML側と**同じ定義**（`convert_function_spec_html.py` の `EXCLUDED_SECTION_TITLES` ほか、
`function_kind()` / `customization_kind()` / `common_spec_titles()`）を import して使うので、
規約を増減しても Markdown と HTML がずれない。

サブコマンド:
  check  除外対象が残っているMarkdownを一覧する（変更しない。残件があれば exit 1）。
  apply  除外対象の節・列をMarkdownから実際に落とす。`.bak` は作らない（git で戻せる）。

対象は機能設計書 `functions/<区分>/*.md`。`functions/` 直下のレポート類と todo-list は触らない。
"""
from __future__ import annotations

import argparse
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FUNCTIONS_DIR = ROOT / "functions"
CONVERTER_PATH = Path(__file__).with_name("convert_function_spec_html.py")


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def iter_docs() -> list[Path]:
    return sorted(p for p in FUNCTIONS_DIR.glob("*/*.md") if p.is_file())


def strip_columns(converter, text: str, kind: str | None) -> str:
    """区分限定の除外列（管理画面の「画面上の文言(英語)」等）をMarkdown表から落とす。"""
    if not converter.excluded_table_columns(kind):
        return text
    lines = text.split("\n")
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if (
            "|" in line
            and i + 1 < len(lines)
            and converter.TABLE_SEP_RE.match(lines[i + 1])
        ):
            header = converter.split_md_row(line)
            rows = []
            j = i + 2
            while j < len(lines) and "|" in lines[j] and lines[j].strip():
                rows.append(converter.split_md_row(lines[j]))
                j += 1
            new_header, new_rows = converter.drop_excluded_columns(header, rows, kind)
            if new_header != header:
                out.append("| " + " | ".join(new_header) + " |")
                out.append("| " + " | ".join("---" for _ in new_header) + " |")
                out.extend("| " + " | ".join(row) + " |" for row in new_rows)
                i = j
                continue
        out.append(line)
        i += 1
    return "\n".join(out)


ARCHIVE_DIR = ROOT / "functions" / "_archive"
ARCHIVE_NOTE = (
    "<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ\n"
    "     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。\n"
    "     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->\n"
)


def split_sections(converter, text: str) -> tuple[list[str], list[tuple[str, list[str]]]]:
    """(節より前の行, [(節見出しの文字列, 節の行)]) に分ける（コードフェンス考慮）。"""
    preamble: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    fence: str | None = None
    current: tuple[str, list[str]] | None = None
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
        (current[1] if current else preamble).append(line)
    if current:
        sections.append(current)
    return preamble, sections


def demote_headings(converter, lines: list[str]) -> list[str]:
    """節内の小見出しを1段下げる（新しく差し込む `###` の配下に収めるため）。"""
    out: list[str] = []
    fence: str | None = None
    for line in lines:
        fence_match = converter.FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
            out.append(line)
            continue
        heading = converter.HEADING_RE.match(line) if fence is None else None
        if heading and len(heading.group(1)) >= converter.SECTION_HEADING_LEVEL + 1:
            out.append("#" + line)
        else:
            out.append(line)
    return out


def body_lines(lines: list[str]) -> list[str]:
    """見出し以外の中身（欠落ゼロゲート用）。"""
    return [line.strip() for line in lines if line.strip() and not line.lstrip().startswith("#")]


def map_to_five_sections(converter, path: Path) -> tuple[str, str, str, dict[str, int]]:
    """(原文, 5分類へ寄せた本文, 退避する本文, 統計) を返す。"""
    original = path.read_text(encoding="utf-8")
    common_titles = converter.common_spec_titles(path)
    preamble, sections = split_sections(converter, original)

    grouped: dict[str, list[tuple[str, list[str]]]] = {}
    archived: list[tuple[str, list[str]]] = []
    for title, lines in sections:
        target = converter.canonical_section_title(title, common_titles)
        if target is None:
            archived.append((title, lines))
        else:
            grouped.setdefault(target, []).append((title, lines))

    out: list[str] = [line for line in preamble]
    while out and not out[-1].strip():
        out.pop()
    for canonical in converter.ALLOWED_SECTION_TITLES:
        entries = grouped.get(canonical)
        if not entries:
            continue
        out.append("")
        out.append(f"{'#' * converter.SECTION_HEADING_LEVEL} {canonical}")
        for title, lines in entries:
            keep = list(lines)
            if title != canonical:
                # 元の節名を小見出しとして残し、配下の見出しを1段下げる。
                keep = demote_headings(converter, keep)
                out.append("")
                out.append(f"{'#' * (converter.SECTION_HEADING_LEVEL + 1)} {title}")
            out.extend(keep)
        while out and not out[-1].strip():
            out.pop()

    mapped = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).rstrip() + "\n"

    archive_text = ""
    if archived:
        body: list[str] = []
        for title, lines in archived:
            body.append(f"{'#' * converter.SECTION_HEADING_LEVEL} {title}")
            body.extend(lines)
        archive_text = re.sub(r"\n{3,}", "\n\n", "\n".join(body)).rstrip() + "\n"

    stats = {
        "sections_in": len(sections),
        "sections_out": sum(1 for c in converter.ALLOWED_SECTION_TITLES if c in grouped),
        "archived": len(archived),
    }
    return original, mapped, archive_text, stats


def map_gate(original: str, mapped: str, archive_text: str) -> str | None:
    """欠落ゼロゲート: 見出し以外の本文行が、本体＋退避で過不足なく保たれること。"""
    before = sorted(body_lines(original.split("\n")))
    after = sorted(body_lines(mapped.split("\n")) + body_lines(archive_text.split("\n")))
    if before != after:
        missing = [line for line in before if line not in after][:3]
        extra = [line for line in after if line not in before][:3]
        return f"本文行が保存されていない（欠落例 {missing} / 余剰例 {extra}）"
    return None


def rewrite(converter, path: Path) -> tuple[str, str]:
    """Return (原文, 規約適用後の本文)."""
    original = path.read_text(encoding="utf-8")
    kind = converter.function_kind(source=path)
    customization = converter.customization_kind(source=path)
    common_titles = converter.common_spec_titles(path)
    stripped = converter.strip_excluded_sections(
        original, kind, customization, common_titles
    )
    stripped = strip_columns(converter, stripped, kind)
    # 節を落とした跡の空行が積み上がらないようにする（本文は変えない）。
    stripped = re.sub(r"\n{3,}", "\n\n", stripped).rstrip() + "\n"
    return original, stripped


# 機能設計書ではない調査資料。節構成が5分類の対象外なので写像しない。
MAP_SKIP_NAMES = ("smaregi_api_and_functions_extract.md",)


def run_map(converter, args) -> int:
    """機能設計書の節を5分類へ寄せ、写像先の無い節を退避先へ移す。"""
    docs = [p if p.is_absolute() else ROOT / p for p in args.docs] or [
        p for p in iter_docs() if p.name not in MAP_SKIP_NAMES
    ]
    changed = 0
    archived_files = 0
    total_archived_sections = 0
    for path in docs:
        original, mapped, archive_text, stats = map_to_five_sections(converter, path)
        failure = map_gate(original, mapped, archive_text)
        if failure:
            print(f"NG: {path.relative_to(ROOT)}: {failure}", file=sys.stderr)
            return 1
        if mapped == original and not archive_text:
            continue
        changed += 1
        total_archived_sections += stats["archived"]
        if archive_text:
            archived_files += 1
        if args.dry_run:
            continue
        path.write_text(mapped, encoding="utf-8")
        if archive_text:
            target = ARCHIVE_DIR / path.parent.name / path.name
            target.parent.mkdir(parents=True, exist_ok=True)
            header = f"# {path.stem} — 5分類外の退避\n\n{ARCHIVE_NOTE}\n"
            target.write_text(header + archive_text, encoding="utf-8")
    suffix = "（dry-run）" if args.dry_run else ""
    print(f"map: 対象 {len(docs)}本 / 変更 {changed}本{suffix}")
    print(f"     退避 {total_archived_sections}節（{archived_files}本分を functions/_archive/ へ）")
    return 0


# 正本Markdownから削除する小見出しと表の行（2026-08-19 ユーザー決定）。
# 0203 の現行仕様に無い定型節は設計書に書かない（副作用・エッジケース・データ整合性・
# バリデーション補足）。副作用は入出力の内容と重複する。削除した内容は
# functions/_archive/ へ退避し、欠落ゼロゲートで本文行の保存を確認する。
DROP_SUBSECTION_TITLES = (
    "副作用",
    "エッジケース",
    "データ整合性",
    "バリデーション補足",
    "明細の並び",
    "出力: 画面の項目",
    "出力：画面の項目",
    "出力: 一覧の列",
    "出力：一覧の列",
    "入力項目",
    # ハーネスが既に非出力にしている定型節。正本と出力を一致させるため正本からも外す
    # （2026-08-20）。内容は共通仕様（[[common-spec]]）と粒度規約が持つ。
    "ログ・監査",
    "ログに出してはいけないもの",
    "権限・認可",
    "セッション",
    "本機能におけるセッション",
    "セッションへ保存しない情報",
    "Cookie",
    "排他制御・トランザクション",
    "試行制限",
)

# 見出しだけ落として本文は親節へ残す汎用ラッパー（0203 は内容固有の小見出しだけを持つ）。
UNWRAP_SUBSECTION_TITLES = ("業務ルール・計算", "集計・判定・計算")


def _is_drop_title(converter, text: str) -> bool:
    norm = converter.normalize_heading_title(text)
    return any(
        norm.startswith(converter.normalize_heading_title(t))
        for t in DROP_SUBSECTION_TITLES
    )


def drop_side_effect_blocks(converter, text: str) -> tuple[str, list[str]]:
    """`### 副作用` 節と `| 副作用 | … |` の表行を落とし、落とした行を返す。"""
    lines = text.split("\n")
    kept: list[str] = []
    removed: list[str] = []
    fence: str | None = None
    skip_level = 0
    for line in lines:
        fence_match = converter.FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
        elif fence is None:
            heading = converter.HEADING_RE.match(line)
            if heading:
                level = len(heading.group(1))
                if skip_level and level <= skip_level:
                    skip_level = 0
                if not skip_level and level > converter.SECTION_HEADING_LEVEL and _is_drop_title(
                    converter, heading.group(2)
                ):
                    skip_level = level
                    removed.append(line)
                    continue
            elif not skip_level:
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if line.strip().startswith("|") and cells and _is_drop_title(converter, cells[0]):
                    removed.append(line)
                    continue
        if skip_level:
            removed.append(line)
            continue
        kept.append(line)
    out = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).rstrip() + "\n"
    return out, [r for r in removed if r.strip()]


# 「入出力: 永続化」は、更新するものがある機能にだけ置く（2026-08-19 ユーザー決定）。
# 「更新しない」だけで表を持たない節は、読む価値のある内容が無いので節ごと落とす。
EMPTY_PERSISTENCE_HEADING = re.compile(r"^#{3,6} *入出力[:：] *永続化 *$")
EMPTY_PERSISTENCE_BODY = re.compile(r"(更新しない|読み書きを行わない|永続化しない|保存しない|参照のみ)")


def drop_empty_persistence(converter, text: str) -> tuple[str, list[str]]:
    """更新内容が無い「入出力: 永続化」節を落とす。表を持つ節は残す。"""
    lines = text.split("\n")
    drop_ranges: list[tuple[int, int]] = []
    for index, line in enumerate(lines):
        if not EMPTY_PERSISTENCE_HEADING.match(line):
            continue
        level = len(line) - len(line.lstrip("#"))
        end = len(lines)
        for offset in range(index + 1, len(lines)):
            probe = lines[offset]
            if re.match(r"^#{1,%d} " % level, probe):
                end = offset
                break
        body = lines[index + 1 : end]
        if any(b.strip().startswith("|") for b in body):
            continue  # 更新する対象の表がある＝残す
        joined = " ".join(" ".join(body).split())
        if joined and not EMPTY_PERSISTENCE_BODY.search(joined):
            continue  # 「更新しない」以外の内容がある＝残す
        drop_ranges.append((index, end))
    if not drop_ranges:
        return text, []
    removed: list[str] = []
    kept: list[str] = []
    skip = {i for start, end in drop_ranges for i in range(start, end)}
    for index, line in enumerate(lines):
        (removed if index in skip else kept).append(line)
    out = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).rstrip() + "\n"
    return out, [r for r in removed if r.strip()]


def unwrap_generic_wrappers(converter, text: str) -> tuple[str, list[str]]:
    """UNWRAP_SUBSECTION_TITLES の見出し行だけを落とす（本文は親節に残す）。"""
    lines = text.split("\n")
    kept: list[str] = []
    removed: list[str] = []
    fence: str | None = None
    wanted = {converter.normalize_heading_title(t) for t in UNWRAP_SUBSECTION_TITLES}
    for line in lines:
        fence_match = converter.FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)[0]
            fence = marker if fence is None else (None if fence == marker else fence)
        elif fence is None:
            heading = converter.HEADING_RE.match(line)
            if heading and len(heading.group(1)) > converter.SECTION_HEADING_LEVEL:
                if converter.normalize_heading_title(heading.group(2)) in wanted:
                    removed.append(line)
                    continue
        kept.append(line)
    out = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).rstrip() + "\n"
    return out, removed


def run_drop(converter, args) -> int:
    """DROP_SUBSECTION_TITLES の節・表行を正本Markdownから削除し、退避先へ移す。"""
    docs = [p if p.is_absolute() else ROOT / p for p in args.docs] or list(iter_docs())
    changed = 0
    total_lines = 0
    for path in docs:
        original = path.read_text(encoding="utf-8")
        dropped, removed = drop_side_effect_blocks(converter, original)
        dropped, removed_persistence = drop_empty_persistence(converter, dropped)
        dropped, removed_wrappers = unwrap_generic_wrappers(converter, dropped)
        removed = removed + removed_persistence + removed_wrappers
        if not removed:
            continue
        changed += 1
        total_lines += len(removed)
        if args.dry_run:
            continue
        path.write_text(dropped, encoding="utf-8")
        target = ARCHIVE_DIR / path.parent.name / path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        header = f"# {path.stem} — 5分類外の退避\n\n{ARCHIVE_NOTE}\n"
        body = target.read_text(encoding="utf-8") if target.exists() else header
        body = body.rstrip("\n") + "\n\n---\n\n## 0203に無い定型節（設計書からは削除・2026-08-19）\n\n" + "\n".join(removed) + "\n"
        target.write_text(body, encoding="utf-8")
    suffix = "（dry-run）" if args.dry_run else ""
    print(f"drop: 対象 {len(docs)}本 / 変更 {changed}本 / 削除 {total_lines}行{suffix}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mode", choices=("check", "apply", "map", "drop"))
    parser.add_argument("--limit", type=int, default=10, help="check時に表示する件数")
    parser.add_argument("--docs", nargs="*", type=Path, default=[], help="map対象を限定する")
    parser.add_argument("--dry-run", action="store_true", help="map時に書き出さない")
    args = parser.parse_args()

    converter = load_converter()

    if args.mode == "map":
        return run_map(converter, args)
    if args.mode == "drop":
        return run_drop(converter, args)
    changed: list[tuple[Path, int]] = []
    total_removed = 0
    for path in iter_docs():
        original, stripped = rewrite(converter, path)
        if stripped == original:
            continue
        removed = len(original.split("\n")) - len(stripped.split("\n"))
        total_removed += removed
        changed.append((path, removed))
        if args.mode == "apply":
            path.write_text(stripped, encoding="utf-8")

    if args.mode == "apply":
        print(f"apply: {len(changed)} files 更新（{total_removed} 行を除去）")
        return 0

    print(f"check: 除外対象が残っているMarkdown {len(changed)} 件（合計 {total_removed} 行）")
    for path, removed in sorted(changed, key=lambda item: -item[1])[: args.limit]:
        print(f"  - {path.relative_to(ROOT)}（-{removed} 行）")
    if len(changed) > args.limit:
        print(f"  … 他 {len(changed) - args.limit} 件")
    return 1 if changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
