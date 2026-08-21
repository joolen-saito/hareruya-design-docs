#!/usr/bin/env python3
"""Verify that the generated HTML faithfully reflects the source Excel.

For each workbook in the input folder and its HTML in the output folder, checks:

1. Sheet coverage   - every visible worksheet title appears as a sidebar entry/panel.
2. Cell-text coverage - every non-empty visible-sheet cell value appears in the HTML body.
3. Image coverage   - every visible-sheet DrawingML <pic> is embedded as a data: image,
                      including split screen-image layers on a sheet.
4. Diagram coverage - every rendered transition/flow diagram keeps Excel layout
                      and renders one SVG connector path per source cxnSp.
5. Callout linkage  - every numbered callout whose No. matches the item table is
                      cross-linked (pin anchor <-> item row), with no dead links.
6. Output exclusion  - nothing that the output-exclusion policy forbids reaches the
                       HTML: struck-through Excel text (cells and DrawingML runs),
                       the 図形・テキストボックス内テキスト inventory (recorded in
                       shape_textbox_sheets.csv instead), the 実装差分追補 section, and
                       the excluded headings/columns inside Markdown-derived embed
                       blocks. The policy itself is documented in
                       .cursor/skills/output-exclusion-policy/SKILL.md; the lists live
                       in the generators and are imported here, never re-declared.
7. Hidden sheet exclusion - hidden and veryHidden sheets do not appear in the
                            sidebar or sheet-panel headings.
8. Superseded-spec notices - every ledger entry in functions/superseded_specs.json is
                             rendered as a "刷新後は実装不要" banner in the embedded
                             function-design section and its standalone preview, is
                             written into the source Markdown, and no newly-detected
                             abolition instruction is left untriaged.

Run: uv run python verify.py [--input-dir DIR] [--output-dir DIR]
Exit code is non-zero if any hard check fails.
"""

from __future__ import annotations

import argparse
import csv
import html
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

import convert
import independent_cells

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
SKILL_SCRIPTS = REPO_ROOT / ".cursor" / "skills" / "function-spec-html-render" / "scripts"
sys.path.insert(0, str(SKILL_SCRIPTS))
import superseded_specs  # noqa: E402
import phase2_specs  # noqa: E402
import detect_superseded_specs  # noqa: E402
import detect_phase2_specs  # noqa: E402
# 出力除外規約の見出し判定は、Markdown→HTML変換側と同じ実装を使う（二重定義で
# 除外リストがずれるのを防ぐ）。
import convert_function_spec_html as md_converter  # noqa: E402

# 実装差分追補の出力可否も、生成側（endpoint-supplement）のフラグを直接参照する。
sys.path.insert(
    0, str(REPO_ROOT / ".cursor" / "skills" / "endpoint-supplement" / "scripts")
)
import build_endpoint_supplement as endpoint_supplement  # noqa: E402

PREVIEW_ROOT = REPO_ROOT / "function_spec_html_preview"
BANNER_MARK = '<span class="superseded-badge">'
PHASE2_MARK = '<span class="phase2-badge">'
# フェーズ2の機能単位の除外は、テスト生成側でもハードコードされている。台帳と食い違うと
# 「設計書ではPh2なのにテストは作られる」状態になるため、同期を機械で検査する。
SCENARIO_EXCLUSION_SOURCE = (
    REPO_ROOT / ".codex" / "skills" / "hareruya-scenario-test-cases" / "scripts" / "generate_scenarios.py"
)
MAX_DIAGNOSTICS = 10


def _norm(text: str) -> str:
    """Collapse whitespace so cell text and HTML text compare cleanly."""
    return re.sub(r"\s+", "", text)


def _html_text(document: str) -> str:
    """Plain text of the HTML body: strip tags, unescape entities, drop spaces."""
    body = re.sub(r"<style.*?</style>", "", document, flags=re.S)
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
    body = re.sub(r"<[^>]+>", "", body)
    return _norm(html.unescape(body))


def _html_fragment_text(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", "", fragment)
    return _norm(html.unescape(text))


def _html_fragment_plain(fragment: str) -> str:
    """Plain text of an HTML fragment, preserving sheet-name whitespace."""
    return html.unescape(re.sub(r"<[^>]+>", "", fragment))


def _sidebar_sheet_names(document: str) -> list[str]:
    """Return sheet names rendered in the sidebar navigation."""
    return [
        _html_fragment_plain(fragment)
        for fragment in re.findall(
            r'<a\b[^>]*\bdata-sheet="sheet-[^"]+"[^>]*>(.*?)</a>',
            document,
            flags=re.S,
        )
    ]


def _sheet_heading_names(document: str) -> list[str]:
    """Return sheet names rendered as panel headings."""
    return [
        _html_fragment_plain(fragment)
        for fragment in re.findall(r"<h2>(.*?)</h2>", document, flags=re.S)
    ]


def _sheet_panel_fragment(document: str, sheet_id: str) -> str:
    """Return the rendered HTML fragment for one sheet panel."""
    match = re.search(
        rf'<section class="sheet-panel[^"]*" id="{re.escape(sheet_id)}">',
        document,
    )
    if match is None:
        return ""
    start = match.start()
    next_panel = re.search(r'<section class="sheet-panel[^"]*" id="sheet-', document[match.end():])
    if next_panel is not None:
        return document[start : match.end() + next_panel.start()]
    warnings_start = document.find('<section class="conversion-warnings"', match.end())
    end = warnings_start if warnings_start != -1 else len(document)
    return document[start:end]


def _wf_pin_texts(document: str) -> Counter[str]:
    """Return rendered image-pin labels, normalized like other HTML text."""
    labels: Counter[str] = Counter()
    for fragment in re.findall(
        r'<(?:a|span)\b[^>]*class="[^"]*\bwf-pin\b[^"]*"[^>]*>(.*?)</(?:a|span)>',
        document,
        flags=re.S,
    ):
        text = _html_fragment_text(fragment)
        if text:
            labels[text] += 1
    return labels


def _short_text(text: str, limit: int = 90) -> str:
    """Compact a diagnostic snippet without losing the actionable content."""
    compact = re.sub(r"\s+", " ", text.strip())
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3] + "..."


def _diagram_figures(document: str) -> list[str]:
    return re.findall(
        r'<figure class="diagram-frame"[^>]*>[\s\S]*?</figure>',
        document,
    )


def _tag_attr(tag: str, attr: str) -> str:
    match = re.search(rf'\b{re.escape(attr)}="([^"]*)"', tag)
    return html.unescape(match.group(1)) if match else ""


def _diagram_connector_path_count(figure: str) -> int:
    # Each diagram SVG contains one marker arrowhead path in <defs>; connector
    # paths are the remaining move-paths rendered from DrawingML cxnSp objects.
    return max(0, len(re.findall(r'<path\b[^>]*\bd="M ', figure)) - 1)


def _shape_section_rows(document: str, shape_anchor: str) -> list[dict[str, str]]:
    match = re.search(
        rf'<section class="shape-block" id="{re.escape(shape_anchor)}">([\s\S]*?)</section>',
        document,
    )
    if match is None:
        return []
    rows: list[dict[str, str]] = []
    for row_match in re.finditer(
        r'<tr\b(?=[^>]*\bdata-shape-index=")([^>]*)>([\s\S]*?)</tr>',
        match.group(1),
    ):
        attrs = row_match.group(1)
        cells = re.findall(r"<td\b[^>]*>([\s\S]*?)</td>", row_match.group(2))
        text_cell = cells[-1] if cells else row_match.group(2)
        rows.append(
            {
                "index": _tag_attr(attrs, "data-shape-index"),
                "ref": _tag_attr(attrs, "data-shape-ref"),
                "text": _html_fragment_text(text_cell),
            }
        )
    return rows


def _shape_diagnostic(sheet_title: str, shape: dict[str, object]) -> str:
    text = str(shape.get("text", ""))
    no = convert.normalize_pin_id(text)
    no_part = f" / 正規化No={no}" if no else ""
    return (
        f"{sheet_title} / {shape.get('cellref', '?')} / "
        f"テキスト={_short_text(text)!r}{no_part}"
    )


def _shape_residual_rows(summary_path: Path, file_name: str) -> list[dict[str, str]]:
    if not summary_path.exists():
        return []
    rows: list[dict[str, str]] = []
    with summary_path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get("file_name") != file_name:
                continue
            rows.append({key: value or "" for key, value in row.items()})
    return rows


# 実装差分追補「利用者視点の入口」が表組(<table>)であることの判定。
# endpoint-supplement スキルの不変条件（箇条書き・段落で出力しない）をここで担保する。
_SUPPLEMENT_START = "<!-- endpoint-supplement:start -->"
_SUPPLEMENT_ENTRY_TABLE_RE = re.compile(
    r'<h2 id="endpoint-supplement-user-entry">[^<]*</h2>\s*'
    r'<div class="table-wrap"><table>.*?</table></div>',
    re.S,
)


def _endpoint_supplement_failures(document: str) -> list[str]:
    if not endpoint_supplement.RENDER_ENDPOINT_SUPPLEMENT:
        # 出力除外規約: 追補節はHTMLへ出さない。残っていれば規約違反。
        if _SUPPLEMENT_START in document or 'endpoint-supplement-user-entry' in document:
            return [
                '出力除外規約に反して「実装差分追補」がHTMLに出力されている'
                '（endpoint-supplement の build で除去してください）'
            ]
        return []
    if _SUPPLEMENT_START not in document:
        return []
    if 'endpoint-supplement-user-entry' not in document:
        return ['実装差分追補に「利用者視点の入口」見出しが無い']
    out: list[str] = []
    if not _SUPPLEMENT_ENTRY_TABLE_RE.search(document):
        out.append(
            '実装差分追補「利用者視点の入口」が表組(<table>)になっていない'
            '（endpoint-supplement の build で表組へ修復してください）'
        )
    elif '/* endpoint-supplement-style:start */' not in document:
        out.append(
            '実装差分追補テーブルの装飾CSS(.endpoint-supplement)が未適用で、本文テーブルと見た目が揃っていない'
            '（endpoint-supplement の build で適用してください）'
        )
    return out


def verify_workbook(xlsx: Path, html_path: Path) -> tuple[list[str], list[str]]:
    """Return (failures, notes) for one workbook/HTML pair."""
    failures: list[str] = []
    notes: list[str] = []
    if xlsx.stat().st_mtime > html_path.stat().st_mtime:
        failures.append(
            "入力Excelが出力HTMLより新しいため、convert.pyで再生成してください: "
            f"{xlsx.name}"
        )
    document = html_path.read_text(encoding="utf-8")
    failures.extend(_endpoint_supplement_failures(document))
    body_text = _html_text(document)
    wf_pin_texts = _wf_pin_texts(document)
    wb = load_workbook(xlsx, data_only=True, rich_text=True)
    visible_sheets = convert.visible_worksheets(wb)
    hidden_sheets = [
        ws for ws in wb.worksheets if getattr(ws, "sheet_state", "visible") != "visible"
    ]
    visible_titles = {ws.title for ws in visible_sheets}
    shapes_by, pins_by, images_by, diagrams_by, _ = convert.collect_workbook_shapes(
        xlsx, sheet_titles=visible_titles
    )

    # 1) sheet coverage
    sidebar_names = _sidebar_sheet_names(document)
    heading_names = _sheet_heading_names(document)
    for ws in visible_sheets:
        if ws.title not in sidebar_names:
            failures.append(f"表示シート名がサイドバーに見つからない: {ws.title!r}")
        if ws.title not in heading_names:
            failures.append(f"表示シート名がパネル見出しに見つからない: {ws.title!r}")
    leaked_hidden = [
        ws.title
        for ws in hidden_sheets
        if ws.title in sidebar_names or ws.title in heading_names
    ]
    notes.append(f"非表示シート除外: {len(hidden_sheets)}件")
    if leaked_hidden:
        failures.append(f"非表示シートがHTMLに出力されている: {leaked_hidden}")

    # 2) cell-text coverage
    # 期待値は convert.py と同じ OOXML direct-read モデルから作る。取り消し線の文章は
    # 出力除外規約で落ちるため、期待値からも同じ規則で除外する（除外と欠落を混同しない）。
    cell_style_models = convert.collect_cell_style_models(xlsx, sheet_titles=visible_titles)
    missing_cells = 0
    total_cells = 0
    kept_cell_texts: set[str] = set()
    for ws in visible_sheets:
        model = cell_style_models.get(ws.title, {})
        for row in ws.iter_rows():
            for cell in row:
                text = convert.format_cell_value(cell.value, cell.number_format).strip()
                if not text:
                    continue
                xml_cell = model.get((cell.row, cell.column))
                runs = convert.cell_text_runs(cell, xml_cell)
                if convert.struck_run_texts(runs):
                    kept = convert.apply_strike_exclusion(runs)
                    text = "".join(run["text"] for run in kept).strip()
                    if not text:
                        continue  # 全体が取り消し線＝出力対象外
                total_cells += 1
                kept_cell_texts.add(_norm(text))
                if _norm(text) not in body_text:
                    missing_cells += 1
    if total_cells:
        cov = 100 * (total_cells - missing_cells) / total_cells
        notes.append(f"セル値カバレッジ: {cov:.2f}% ({total_cells - missing_cells}/{total_cells})")
        if cov < 99.5:
            failures.append(f"セル値カバレッジが低い: {cov:.2f}%（欠落 {missing_cells}）")

    # 2.1) 独立検証（2026-08-19 codex R1「検証の不備」への対応）
    #      上のカバレッジは期待値を convert.py の取り消し線モデルから作るため、変換器が
    #      誤判定すると検証器も同じ誤りをする（共倒れ）。加えて `in body_text` は座標も
    #      出現回数も見ない。ここでは independent_cells.py が OOXML を独自に読んだ事実と
    #      突き合わせ、セル座標（data-excel-ref）単位で文言と出現を照合する。
    failures_21, notes_21 = _verify_cells_independently(
        document, visible_sheets, xlsx, cell_style_models
    )
    failures.extend(failures_21)
    notes.extend(notes_21)

    # 2.5) 出力除外規約（取り消し線）— 期待値は convert.py と同じ OOXML direct-read
    # モデル（run単位strike / セル継承 / <strike val="0">=false）と DrawingML の
    # a:rPr@strike から作る。取り消し線の文章がHTMLに出ていないことを検査する。
    struck_texts: Counter[str] = Counter()
    for ws in visible_sheets:
        model = cell_style_models.get(ws.title, {})
        for row in ws.iter_rows():
            for cell in row:
                xml_cell = model.get((cell.row, cell.column))
                for text in convert.struck_run_texts(convert.cell_text_runs(cell, xml_cell)):
                    if text.strip():
                        struck_texts[_norm(text.strip())] += 1
    struck_shapes = 0
    for shapes in shapes_by.values():
        for shape in shapes:
            if not shape.get("struck"):
                continue
            struck_shapes += 1
            removed = _removed_shape_text(shape)
            if removed:
                struck_texts[_norm(removed)] += 1
    if convert.RENDER_STRUCK_TEXT:
        notes.append("取り消し線: 出力する設定（RENDER_STRUCK_TEXT=True）のため除外検査はスキップ")
    elif struck_texts:
        marked = len(re.findall(r'<span class="cell-strike">', document))
        if marked:
            failures.append(
                f"出力除外規約に反して取り消し線付きテキストが出力されている: {marked}件"
            )
        # 同じ文字列が取り消し線なしのセル・図形にも存在する場合、本文への出現は正当
        # （例: 別の図形が同じ行を取り消し線なしで持つ）。取り消し線側にしか無い文字列
        # だけを漏洩として扱う。
        kept_texts = set(kept_cell_texts)
        for shapes in shapes_by.values():
            for shape in shapes:
                surviving = str(shape.get("text") or "").strip()
                if surviving:
                    kept_texts.add(_norm(surviving))
        leaked: list[str] = []
        for text in struck_texts:
            if text in body_text and not any(text in kept for kept in kept_texts):
                leaked.append(text[:60])
        notes.append(
            f"取り消し線: 非出力 {len(struck_texts)}種"
            f"（セル＋図形{struck_shapes}件・HTML残存 {len(leaked)}種）"
        )
        if leaked:
            failures.append(
                f"取り消し線の文章がHTMLに残っている: {len(leaked)}種 例:{leaked[:MAX_DIAGNOSTICS]}"
            )
    else:
        notes.append("取り消し線: 対象なし")

    # 3) image coverage
    total_pics = sum(len(v) for v in images_by.values())
    embedded = document.count("data:image/")
    notes.append(f"画像: DrawingML pic={total_pics} / HTML埋め込み={embedded}")
    if embedded < total_pics:
        failures.append(f"画像が欠落: pic={total_pics} 埋め込み={embedded}")

    expected_layer_groups = 0
    rendered_layer_groups = 0
    for index, ws in enumerate(visible_sheets, start=1):
        expected_counts = sorted(
            len(group)
            for group in convert.group_overlapping_images(images_by.get(ws.title, []))
            if len(group) > 1
        )
        if not expected_counts:
            continue
        expected_layer_groups += len(expected_counts)
        panel = _sheet_panel_fragment(document, f"sheet-{index}")
        rendered_counts = sorted(
            int(count)
            for count in re.findall(r'data-image-layer-count="([0-9]+)"', panel)
        )
        rendered_layer_groups += len(rendered_counts)
        if rendered_counts != expected_counts:
            failures.append(
                f"{ws.title}: 画像レイヤー群が一致しない "
                f"expected={expected_counts} rendered={rendered_counts}"
            )
    if expected_layer_groups:
        notes.append(
            f"画像レイヤー群: {rendered_layer_groups}/{expected_layer_groups}"
        )

    target_sheet = "在庫移動指示検索"
    if target_sheet in visible_titles:
        target_images = images_by.get(target_sheet, [])
        target_pins = [
            convert.normalize_pin_id(pin.get("text", ""))
            for pin in pins_by.get(target_sheet, [])
            if convert.is_number_pin_id(
                convert.normalize_pin_id(pin.get("text", ""))
            )
        ]
        notes.append(f"{target_sheet}: DrawingML番号pin={len(target_pins)}")
        required_source_pins = {"1-1", "2-1", "2-2", "3-1", "3-16"}
        missing_source_pins = required_source_pins - set(target_pins)
        if missing_source_pins:
            failures.append(
                f"{target_sheet}: DrawingML番号pinが不足: {sorted(missing_source_pins)}"
            )
        notes.append(f"{target_sheet}: DrawingML画像={len(target_images)}")
        target_index = next(
            (index for index, ws in enumerate(visible_sheets, start=1) if ws.title == target_sheet),
            None,
        )
        target_panel = (
            _sheet_panel_fragment(document, f"sheet-{target_index}")
            if target_index is not None
            else ""
        )
        target_rendered_images = target_panel.count("data:image/")
        target_layer_counts = [
            int(count)
            for count in re.findall(r'data-image-layer-count="([0-9]+)"', target_panel)
        ]
        expected_target_images = len(target_images)
        if (
            target_rendered_images != expected_target_images
            and expected_target_images not in target_layer_counts
        ):
            failures.append(
                f"{target_sheet}: HTML画像出力が一致しない "
                f"expected={expected_target_images} "
                f"data:image={target_rendered_images} layer_counts={target_layer_counts}"
            )
        if "画像内ラベル:" in target_panel:
            failures.append(f"{target_sheet}: 暫定caption補完が残っている")
        search_layout_heading = "レイアウト図 在庫移動指示検索画面"
        modal_layout_heading = "レイアウト図 在庫移動実績CSV登録モーダル"
        modal_layout_image = "在庫移動指示検索 / D155 / image 1"
        search_heading_pos = target_panel.find(search_layout_heading)
        modal_heading_pos = target_panel.find(modal_layout_heading)
        modal_image_pos = target_panel.find(modal_layout_image)
        if modal_heading_pos < 0:
            failures.append(f"{target_sheet}: モーダルのレイアウト図見出しが不足")
        if modal_image_pos < 0:
            failures.append(f"{target_sheet}: モーダルのレイアウト図画像が不足: {modal_layout_image}")
        elif modal_heading_pos >= 0 and modal_image_pos < modal_heading_pos:
            failures.append(
                f"{target_sheet}: モーダル画像が見出しより前に出力されている: {modal_layout_image}"
            )
        if (
            search_heading_pos >= 0
            and modal_heading_pos >= 0
            and modal_layout_image in target_panel[search_heading_pos:modal_heading_pos]
        ):
            failures.append(
                f"{target_sheet}: モーダル画像が検索画面レイアウト図へ結合されている"
            )
        status_transition_heading = "移動登録ステータス遷移（在庫移動のものを転用）"
        status_transition_pos = target_panel.find(status_transition_heading)
        if status_transition_pos < 0:
            failures.append(f"{target_sheet}: 移動登録ステータス遷移の見出しが不足")
        else:
            status_transition_fragment = target_panel[
                status_transition_pos : status_transition_pos + 25000
            ]
            if 'data-diagram-layout="excel"' not in status_transition_fragment:
                failures.append(
                    f"{target_sheet}: 移動登録ステータス遷移図がExcel座標で再構成されていない"
                )
            for label in ("アクション", "ステータス", "入庫先", "NG", "在庫移動指示リスト"):
                if _norm(label) not in _norm(status_transition_fragment):
                    failures.append(
                        f"{target_sheet}: 移動登録ステータス遷移図のラベルが不足: {label}"
                    )
        rendered_pin_labels = _wf_pin_texts(target_panel)
        if not rendered_pin_labels:
            failures.append(f"{target_sheet}: wf-pin が出力されていない")
        for no in sorted(required_source_pins):
            pin_id = f'pin-sheet-{target_index}-{no}'
            item_id = f'item-sheet-{target_index}-{no}'
            if f'id="{pin_id}"' not in target_panel:
                failures.append(f"{target_sheet}: HTML pin id が不足: {pin_id}")
            if f'id="{item_id}"' not in target_panel:
                failures.append(f"{target_sheet}: HTML item id が不足: {item_id}")
        for label in ("NG", "アクション", "ステータス"):
            if rendered_pin_labels.get(_norm(label), 0) > 0:
                failures.append(
                    f"{target_sheet}: 非番号テキストがwf-pin化されている: {label}"
                )

    # 3.5) vector-like DrawingML diagrams - transition diagrams made of
    # shapes/connectors should be rendered as an inline SVG/HTML stage instead
    # of only appearing as a fallback text table.
    expected_diagrams = 0
    expected_connectors = 0
    expected_transition_edges = 0
    for ws in visible_sheets:
        diagram = diagrams_by.get(ws.title)
        actual_images = images_by.get(ws.title, [])
        if not actual_images:
            fallback_image_rows, _fallback_warnings = convert.collect_images_by_anchor_row(ws)
            actual_images = [
                img for row in sorted(fallback_image_rows) for img in fallback_image_rows[row]
            ]
        if convert.diagram_should_render(diagram, actual_images):
            expected_diagrams += 1
            expected_connectors += len(diagram.get("connectors", []))
            expected_transition_edges += len(convert.build_transition_graph(diagram)["edges"])
    rendered_connector_counts = [
        int(count)
        for count in re.findall(r'data-diagram-connectors="([0-9]+)"', document)
    ]
    rendered_edge_counts = [
        int(count)
        for count in re.findall(r'data-transition-edges="([0-9]+)"', document)
    ]
    rendered_diagrams = len(rendered_connector_counts)
    rendered_connectors = sum(rendered_connector_counts)
    rendered_transition_edges = sum(rendered_edge_counts)
    diagram_figures = _diagram_figures(document)
    bad_layouts: list[str] = []
    connector_path_mismatches: list[str] = []
    for figure_index, figure in enumerate(diagram_figures, start=1):
        figure_tag = figure.split(">", 1)[0]
        layout = _tag_attr(figure_tag, "data-diagram-layout")
        # Excel-coordinate diagrams render one SVG path per source connector.
        # Degenerate diagrams (extreme aspect ratio) are reconstructed from the
        # transition graph and render one path per transition edge instead, so
        # validate each figure against the matching count for its layout.
        if layout == "excel":
            expected_path_attr = "data-diagram-connectors"
        elif layout == "graph":
            expected_path_attr = "data-transition-edges"
        else:
            bad_layouts.append(f"#{figure_index}:{layout or 'missing'}")
            continue
        try:
            expected_path_count = int(_tag_attr(figure_tag, expected_path_attr))
        except (TypeError, ValueError):
            expected_path_count = -1
        rendered_path_count = _diagram_connector_path_count(figure)
        if rendered_path_count != expected_path_count:
            connector_path_mismatches.append(
                f"#{figure_index}({layout}): expected={expected_path_count} "
                f"rendered={rendered_path_count}"
            )
    if expected_diagrams:
        notes.append(
            f"画面遷移図SVG: {rendered_diagrams}/{expected_diagrams} "
            f"(コネクタ {rendered_connectors}/{expected_connectors}, "
            f"遷移 {rendered_transition_edges}/{expected_transition_edges})"
        )
        if (
            rendered_diagrams != expected_diagrams
            or rendered_connectors != expected_connectors
            or rendered_transition_edges != expected_transition_edges
        ):
            failures.append(
                f"画面遷移図SVGが一致しない: diagram={rendered_diagrams}/{expected_diagrams} "
                f"connector={rendered_connectors}/{expected_connectors} "
                f"transition={rendered_transition_edges}/{expected_transition_edges}"
            )
        if bad_layouts:
            failures.append(
                "画面遷移図のレイアウト種別が不正（excel/graph 以外）: "
                + ", ".join(bad_layouts[:MAX_DIAGNOSTICS])
            )
        if connector_path_mismatches:
            failures.append(
                "画面遷移図のSVG path数が一致しない: "
                + ", ".join(connector_path_mismatches[:MAX_DIAGNOSTICS])
            )

    # 3.6) unresolved connectors — recompute per diagram and require the HTML
    # connector ledger to reflect them. A connector whose stCxn/endCxn references
    # a shape absent from the drawing (state="hard") is genuinely 解決できない:
    # spec §5/§188 require exit 1 if any exist. Soft-recorded connectors
    # (decorative/self-loop/undirected/non-text endpoint) are inventory-only.
    expected_hard = 0
    expected_hard_ids: list[str] = []
    for ws in visible_sheets:
        diagram = diagrams_by.get(ws.title)
        if not diagram or not diagram.get("connectors"):
            continue
        graph = convert.build_transition_graph(diagram)
        for item in graph.get("unresolved", []):
            if item.get("state") == "hard":
                expected_hard += 1
                expected_hard_ids.append(f"{ws.title}:connector={item.get('id')}")
    # 出力除外規約: コネクタ解決台帳はHTMLへ出さない。握り潰し検知の突合先を
    # connector_ledger_sheets.csv へ移す（HTMLに出す設定へ戻したときはHTML側を見る）。
    if convert.RENDER_CONNECTOR_LEDGER_SECTION:
        recorded_hard = sum(
            int(count)
            for count in re.findall(r'data-connector-unresolved="([0-9]+)"', document)
        )
        source = "HTML台帳"
    else:
        if '<details class="connector-ledger"' in document or "コネクタ解決台帳" in document:
            failures.append("出力除外規約に反して「コネクタ解決台帳」がHTMLに出力されている")
        ledger_rows = _connector_ledger_rows(html_path.parent / "connector_ledger_sheets.csv", xlsx.name)
        recorded_hard = sum(1 for row in ledger_rows if row.get("state") == "hard")
        recorded_all = len(ledger_rows)
        expected_all = 0
        for ws in visible_sheets:
            diagram = diagrams_by.get(ws.title)
            if diagram and diagram.get("connectors"):
                expected_all += len(convert.build_transition_graph(diagram).get("unresolved", []))
        if recorded_all != expected_all:
            failures.append(
                "非出力にしたコネクタが connector_ledger_sheets.csv で追えない: "
                f"台帳{recorded_all}/{expected_all}"
            )
        source = "CSV台帳"
    notes.append(f"未解決connector(hard): 期待={expected_hard} {source}={recorded_hard}")
    if recorded_hard != expected_hard:
        failures.append(
            f"コネクタ解決台帳の未解決数が{source}と一致しない（握り潰し疑い）: "
            f"期待={expected_hard} 台帳={recorded_hard}"
        )
    if expected_hard:
        failures.append(
            f"未解決connectorが{expected_hard}件（推測遷移を正本にできない・spec §5 exit1）: "
            f"{expected_hard_ids[:MAX_DIAGNOSTICS]}"
        )

    # 4) callout linkage / dead links
    pin_targets = set(re.findall(r'href="#(item-sheet-[0-9]+-[0-9A-Za-z-]+)"', document))
    item_ids = set(re.findall(r'id="(item-sheet-[0-9]+-[0-9A-Za-z-]+)"', document))
    item_targets = set(re.findall(r'href="#(pin-sheet-[0-9]+-[0-9A-Za-z-]+)"', document))
    pin_ids = set(re.findall(r'id="(pin-sheet-[0-9]+-[0-9A-Za-z-]+)"', document))
    dead_fwd = pin_targets - item_ids
    dead_rev = item_targets - pin_ids
    if dead_fwd:
        failures.append(f"callout→item デッドリンク {len(dead_fwd)}件: {sorted(dead_fwd)[:5]}")
    if dead_rev:
        failures.append(f"item→pin デッドリンク {len(dead_rev)}件: {sorted(dead_rev)[:5]}")
    notes.append(f"リンク: item行id={len(item_ids)} pin id={len(pin_ids)} (デッドリンク {len(dead_fwd)+len(dead_rev)})")

    # 5) 出力除外規約（図形・テキストボックス内テキスト）
    #    全件表はHTMLへ出さない。ただし抽出結果を黙って捨てないため、除外した図形は
    #    shape_textbox_sheets.csv へ全件（連番・セル位置・本文一致で）記録させる。
    #    RENDER_SHAPE_TEXT_SECTION=True へ戻した場合は従来の非欠落検証へ切り替わる。
    failures_5, notes_5 = _verify_shape_text_policy(
        document, visible_sheets, shapes_by, body_text, wf_pin_texts, html_path, xlsx
    )
    failures.extend(failures_5)
    notes.extend(notes_5)

    # 5.5) 出力除外規約（番号pin対応台帳）
    #      台帳テーブルはHTMLへ出さない。抽出したpinを黙って捨てないため、対応状況は
    #      pin_ledger_sheets.csv へ全件（シート・pin本文・対応状態で）記録させる。
    #      RENDER_PIN_LEDGER_SECTION=True へ戻した場合はHTML側に台帳が在ることを見る。
    failures_55, notes_55 = _verify_pin_ledger_policy(
        document, visible_sheets, pins_by, html_path, xlsx
    )
    failures.extend(failures_55)
    notes.extend(notes_55)

    # 6) 出力除外規約（Markdown由来の節・列）
    #    埋め込みブロック内に限定して、除外対象の見出し・列が残っていないことを見る。
    #    対象一覧は .cursor/skills/output-exclusion-policy/SKILL.md（規約の正本）と、
    #    それを実装する convert_function_spec_html.py の定数（import して使う）。
    excluded_headings = _excluded_section_headings(document)
    notes.append(f"出力除外セクション見出し: {len(excluded_headings)}件")
    if excluded_headings:
        failures.append(
            "出力除外セクションがHTMLに残っている: "
            + ", ".join(sorted(set(excluded_headings))[:MAX_DIAGNOSTICS])
        )

    mislabeled = _current_spec_label_violations(document)
    notes.append(f"新規実装なのに「現行仕様」: {len(mislabeled)}件")
    if mislabeled:
        failures.append(
            "新規実装の機能が「現行仕様」の見出しで出力されている: "
            + ", ".join(mislabeled[:MAX_DIAGNOSTICS])
        )

    new_screen_embeds = _new_screen_embed_violations(document)
    notes.append(f"【新規】シートへの埋め込み: {len(new_screen_embeds)}件")
    if new_screen_embeds:
        failures.append(
            "【新規】画面のシートに機能設計書が埋め込まれている: "
            + ", ".join(new_screen_embeds[:MAX_DIAGNOSTICS])
        )

    return failures, notes


def _src_cell_spans(document: str) -> dict[str, list[str]]:
    """Return {data-excel-ref: [rendered text, ...]} for every src-cell span.

    ネストした `<span>`（取り消し線表示モードの `cell-strike` など）があるため、
    非貪欲マッチではなく開始タグから対応する `</span>` まで数えて取り出す。
    """
    spans: dict[str, list[str]] = defaultdict(list)
    for match in re.finditer(r'<span class="src-cell"[^>]*data-excel-ref="([^"]+)"[^>]*>', document):
        ref = html.unescape(match.group(1))
        depth = 1
        pos = match.end()
        while depth and pos < len(document):
            nxt = re.compile(r"</?span\b").search(document, pos)
            if nxt is None:
                break
            depth += 1 if nxt.group(0) == "<span" else -1
            pos = nxt.end()
            if depth == 0:
                spans[ref].append(document[match.end() : nxt.start()])
                break
    return spans


def _verify_cells_independently(
    document: str,
    visible_sheets: list[Any],
    xlsx: Path,
    cell_style_models: dict[str, dict[tuple[int, int], dict[str, Any]]],
) -> tuple[list[str], list[str]]:
    """Cross-check the converter against an independently-read OOXML cell model.

    1. 取り消し線モデルの独立突合（共倒れ検出）。independent_cells.py は convert.py の
       関数を一切呼ばずに全文/部分の取り消し線セルを求める。両者が食い違えば不合格。
    2. 座標単位のカバレッジ。文字列セルの期待文言が、その **セル自身の data-excel-ref** を
       持つ span に出ているかを見る（別セルの同一文言では成立させない）。
    3. 全文取り消し線セルは、その座標の span がHTMLに存在しないこと。
    4. 部分取り消し線セルは、取り消された文字列がそのセルの描画文言に残っていないこと。
    """
    failures: list[str] = []
    notes: list[str] = []
    titles = {ws.title for ws in visible_sheets}
    facts_by_sheet = independent_cells.read_cell_facts(xlsx, sheet_titles=titles)
    book_no = independent_cells.book_number(xlsx.stem)
    spans = _src_cell_spans(document)

    # --- 1) 取り消し線モデルの独立突合 -------------------------------------
    independent_full: set[tuple[str, str]] = set()
    independent_partial: set[tuple[str, str]] = set()
    for title, cells in facts_by_sheet.items():
        for ref, cell in cells.items():
            if cell.merged_hidden:
                continue
            if cell.fully_struck:
                independent_full.add((title, ref))
            elif cell.partially_struck:
                independent_partial.add((title, ref))

    converter_full: set[tuple[str, str]] = set()
    converter_partial: set[tuple[str, str]] = set()
    for ws in visible_sheets:
        model = cell_style_models.get(ws.title, {})
        for row in ws.iter_rows():
            for cell in row:
                xml_cell = model.get((cell.row, cell.column))
                runs = convert.cell_text_runs(cell, xml_cell)
                if not convert.struck_run_texts(runs):
                    continue
                raw = "".join(run["text"] for run in runs).strip()
                if not raw:
                    continue
                kept = "".join(
                    run["text"] for run in convert.apply_strike_exclusion(runs)
                ).strip()
                ref = f"{get_column_letter(cell.column)}{cell.row}"
                if kept:
                    converter_partial.add((ws.title, ref))
                else:
                    converter_full.add((ws.title, ref))

    model_gaps: list[str] = []
    for label, independent_set, converter_set in (
        ("全文取り消し線", independent_full, converter_full),
        ("部分取り消し線", independent_partial, converter_partial),
    ):
        only_independent = sorted(independent_set - converter_set)
        only_converter = sorted(converter_set - independent_set)
        for title, ref in only_independent[:MAX_DIAGNOSTICS]:
            model_gaps.append(f"{label} 独立側のみ {title}!{ref}")
        for title, ref in only_converter[:MAX_DIAGNOSTICS]:
            model_gaps.append(f"{label} 変換器側のみ {title}!{ref}")
    if model_gaps:
        failures.append(
            "取り消し線モデルが変換器と独立読み取りで食い違う: " + "; ".join(model_gaps)
        )
    notes.append(
        "取り消し線 独立突合: "
        f"全文{len(independent_full)}・部分{len(independent_partial)}"
        + ("（変換器と一致）" if not model_gaps else "（食い違いあり）")
    )

    # --- 2〜4) 座標単位の照合 ------------------------------------------------
    checked = 0
    missing_ref: list[str] = []
    text_mismatch: list[str] = []
    ghost_full: list[str] = []
    value_only_missing: list[str] = []
    value_only_checked = 0
    for title, cells in facts_by_sheet.items():
        for ref, cell in cells.items():
            if cell.merged_hidden:
                # 結合範囲の非先頭セル: Excel上も表示されない残留値なので期待値にしない。
                continue
            full_ref = f"{book_no}:{title}!{ref}"
            if not cell.is_string:
                # 数値・日付・数式セル: 表示文字列は書式に依存するので文言は比べない。
                # 座標がHTMLに在ることだけは独立に見る（黙って落ちるのを防ぐ）。
                if cell.has_value and not cell.cell_font_struck:
                    value_only_checked += 1
                    if not spans.get(full_ref):
                        value_only_missing.append(full_ref)
                continue
            rendered = spans.get(full_ref, [])
            if cell.fully_struck:
                if rendered:
                    ghost_full.append(full_ref)
                continue
            expected = _norm(cell.kept_text)
            if not expected:
                continue
            checked += 1
            if not rendered:
                missing_ref.append(full_ref)
                continue
            rendered_texts = [_norm(_strip_tags(text)) for text in rendered]
            # 厳密一致で見る。部分一致にすると、取り消し線の残存など「期待に無い文字が
            # 混ざった描画」を通してしまう（規約適合の0202/0203は全セル厳密一致で通る）。
            if expected not in rendered_texts:
                text_mismatch.append(
                    f"{full_ref} 期待={cell.kept_text[:40]!r} 実際={rendered_texts[0][:40]!r}"
                )
            # 部分取り消し線の残存は、上の「厳密一致」で既に捕まえている（取り消された
            # 文字が残れば描画文言が期待値と一致しない）。ここで部分文字列判定を重ねると、
            # 取り消された語が生き残った文にも出てくる正当なケースを誤検知する
            #（例: 0204 商品マスター(検索入力)!AG117 は「限定公開」を取り消したうえで
            #  「選択肢「限定公開」を除去する」という文が残る）。

    if missing_ref:
        failures.append(
            f"セル座標がHTMLに無い: {len(missing_ref)}件 例:{missing_ref[:MAX_DIAGNOSTICS]}"
        )
    if text_mismatch:
        failures.append(
            f"セル座標の文言が一致しない: {len(text_mismatch)}件 "
            f"例:{text_mismatch[:MAX_DIAGNOSTICS]}"
        )
    if ghost_full:
        failures.append(
            "全文取り消し線のセルがHTMLに出力されている: "
            f"{len(ghost_full)}件 例:{ghost_full[:MAX_DIAGNOSTICS]}"
        )
    if value_only_missing:
        failures.append(
            f"値セルの座標がHTMLに無い: {len(value_only_missing)}件 "
            f"例:{value_only_missing[:MAX_DIAGNOSTICS]}"
        )
    notes.append(
        f"セル座標照合: {checked - len(missing_ref) - len(text_mismatch)}/{checked}"
        f"（文字列セル・文言一致） 値セル座標: "
        f"{value_only_checked - len(value_only_missing)}/{value_only_checked}"
    )
    return failures, notes


def _strip_tags(fragment: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", " ", fragment))


def _verify_pin_ledger_policy(
    document: str,
    visible_sheets: list[Any],
    pins_by: dict[str, list[dict[str, object]]],
    html_path: Path,
    xlsx: Path,
) -> tuple[list[str], list[str]]:
    """Check the pin ledger stays out of the HTML and stays complete in the CSV.

    期待値は convert 側と同じ絞り込み（`is_number_pin_id(normalize_pin_id(text))`）で作る。
    台帳をHTMLから外した以上、CSVがpinの対応状況を追える唯一の記録になるため、
    シート単位の件数とpin本文の一致まで見る。
    """
    failures: list[str] = []
    notes: list[str] = []
    expected_by_sheet: list[tuple[str, list[str]]] = [
        (
            ws.title,
            [
                str(pin.get("text", ""))
                for pin in pins_by.get(ws.title, [])
                if convert.is_number_pin_id(
                    convert.normalize_pin_id(str(pin.get("text", "")))
                )
            ],
        )
        for ws in visible_sheets
    ]
    total_pins = sum(len(pins) for _, pins in expected_by_sheet)

    if convert.RENDER_PIN_LEDGER_SECTION:
        rendered = document.count('<details class="pin-ledger"')
        notes.append(f"番号pin対応台帳: HTML出力 {rendered}件（RENDER_PIN_LEDGER_SECTION=True）")
        if total_pins and not rendered:
            failures.append("番号pin対応台帳がHTMLに出力されていない")
        return failures, notes

    if '<details class="pin-ledger"' in document or "番号pin対応台帳" in document:
        failures.append("出力除外規約に反して「番号pin対応台帳」がHTMLに出力されている")

    ledger_path = html_path.parent / "pin_ledger_sheets.csv"
    ledger_rows = _pin_ledger_rows(ledger_path, xlsx.name)
    ledger_by_sheet: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in ledger_rows:
        ledger_by_sheet[row.get("sheet_name", "")].append(row)
    ledger_failures: list[str] = []
    for title, pins in expected_by_sheet:
        rows = ledger_by_sheet.get(title, [])
        if len(rows) != len(pins):
            ledger_failures.append(f"{title}: 台帳 {len(rows)}/{len(pins)}")
            continue
        for index, (row, text) in enumerate(zip(rows, pins), start=1):
            if _norm(row.get("pin", "")) != _norm(text):
                ledger_failures.append(
                    f"{title}: pin #{index} 台帳不一致 expected={text!r} actual={row.get('pin')!r}"
                )
    if ledger_failures:
        failures.append(
            "非出力にした番号pinが pin_ledger_sheets.csv で追えない: "
            + "; ".join(ledger_failures[:MAX_DIAGNOSTICS])
        )
    status_counts = Counter(row.get("status", "") for row in ledger_rows)
    detail = "・".join(f"{key}{value}" for key, value in sorted(status_counts.items()))
    notes.append(
        f"番号pin対応台帳: 非出力 {len(ledger_rows)}/{total_pins}"
        + (f"（{detail}）" if detail else "")
    )
    return failures, notes


def _connector_ledger_rows(ledger_path: Path, file_name: str) -> list[dict[str, str]]:
    if not ledger_path.exists():
        return []
    rows: list[dict[str, str]] = []
    with ledger_path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row.get("file_name") != file_name:
                continue
            rows.append({key: value or "" for key, value in row.items()})
    return rows


def _pin_ledger_rows(ledger_path: Path, file_name: str) -> list[dict[str, str]]:
    if not ledger_path.exists():
        return []
    rows: list[dict[str, str]] = []
    with ledger_path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row.get("file_name") != file_name:
                continue
            rows.append({key: value or "" for key, value in row.items()})
    return rows


def _verify_shape_text_policy(
    document: str,
    visible_sheets: list[Any],
    shapes_by: dict[str, list[dict[str, object]]],
    body_text: str,
    wf_pin_texts: dict[str, int],
    html_path: Path,
    xlsx: Path,
) -> tuple[list[str], list[str]]:
    failures: list[str] = []
    notes: list[str] = []
    summary_path = html_path.parent / "shape_textbox_sheets.csv"
    ledger_rows = _shape_residual_rows(summary_path, xlsx.name)

    # 台帳は原本のまま（取り消し線を含む）記録するので、期待値も原本テキストで比べる。
    expected_by_sheet: list[tuple[str, list[dict[str, object]]]] = [
        (
            ws.title,
            [
                shape
                for shape in shapes_by.get(ws.title, [])
                if _shape_source_text(shape)
            ],
        )
        for ws in visible_sheets
    ]
    total_shapes = sum(len(shapes) for _, shapes in expected_by_sheet)

    if not convert.RENDER_SHAPE_TEXT_SECTION:
        if '<section class="shape-block"' in document or "図形・テキストボックス内テキスト" in document:
            failures.append(
                "出力除外規約に反して「図形・テキストボックス内テキスト」がHTMLに出力されている"
            )
        # 除外した図形は台帳側で全件追える（シート・連番・セル位置・本文が一致する）。
        ledger_by_sheet: dict[str, list[dict[str, str]]] = defaultdict(list)
        for row in ledger_rows:
            ledger_by_sheet[row.get("sheet_name", "")].append(row)
        ledger_failures: list[str] = []
        for title, shapes in expected_by_sheet:
            rows = sorted(
                ledger_by_sheet.get(title, []),
                key=lambda row: int(row.get("shape_index") or 0),
            )
            if len(rows) != len(shapes):
                ledger_failures.append(f"{title}: 台帳 {len(rows)}/{len(shapes)}")
                continue
            for index, (row, shape) in enumerate(zip(rows, shapes), start=1):
                if (
                    row.get("shape_index") != str(index)
                    or row.get("cellref") != str(shape.get("cellref", ""))
                    or _norm(row.get("text", "")) != _norm(_shape_source_text(shape))
                ):
                    ledger_failures.append(
                        f"{title}: shape #{index} 台帳不一致 "
                        f"expected={_shape_diagnostic(title, shape)}"
                    )
        if ledger_failures:
            failures.append(
                "非出力にした図形テキストが shape_textbox_sheets.csv で追えない: "
                + "; ".join(ledger_failures[:MAX_DIAGNOSTICS])
            )
        notes.append(
            f"図形・テキストボックス内テキスト: 非出力 {len(ledger_rows)}/{total_shapes}"
            "（出力除外規約）"
        )
        return failures, notes

    # 従来モード: 全図形テキストがHTMLへ残り、全件表と1件ずつ一致すること。
    missing_shapes = 0
    inventory_failures: list[str] = []
    missing_examples: list[str] = []
    for sheet_index, (title, expected_shapes) in enumerate(expected_by_sheet, start=1):
        shape_rows = _shape_section_rows(document, f"sheet-{sheet_index}-shapes")
        # 取り消し線で出力テキストが空になった図形は行にならない（原本は台帳へ）。
        renderable = [
            (index, shape)
            for index, shape in enumerate(expected_shapes, start=1)
            if str(shape.get("text", "")).strip()
        ]
        if len(shape_rows) != len(renderable):
            inventory_failures.append(
                f"{title}: shape rows {len(shape_rows)}/{len(renderable)}"
            )
        for position, (index, shape) in enumerate(renderable, start=1):
            text = str(shape.get("text", "")).strip()
            no = convert.normalize_pin_id(text)
            present = _norm(text) in body_text or (
                no and wf_pin_texts.get(_norm(no), 0) > 0
            )
            if not present:
                missing_shapes += 1
                if len(missing_examples) < MAX_DIAGNOSTICS:
                    missing_examples.append(_shape_diagnostic(title, shape))
            row = shape_rows[position - 1] if position - 1 <= len(shape_rows) - 1 else None
            if row is None:
                continue
            if (
                row["index"] != str(index)
                or row["ref"] != str(shape.get("cellref", ""))
                or row["text"] != _norm(text)
            ):
                inventory_failures.append(
                    f"{title}: shape #{index} mismatch "
                    f"expected={_shape_diagnostic(title, shape)}"
                )
    notes.append(
        f"図形・テキストボックス内テキスト: {total_shapes - missing_shapes}/{total_shapes}"
    )
    if missing_shapes:
        failures.append(
            "図形・テキストボックス内テキストがHTMLから欠落: "
            f"{missing_shapes}件 該当:{missing_examples}"
        )
    if inventory_failures:
        failures.append(
            "図形・テキストボックス内テキストの全件表が一致しない: "
            + "; ".join(inventory_failures[:MAX_DIAGNOSTICS])
        )
    # 取り消し線で非出力になった図形は正当な残件なので未変換扱いにしない。
    residual_rows = [
        row for row in ledger_rows if "取り消し線" not in (row.get("reason") or "")
    ]
    if residual_rows:
        failures.append(
            "shape_textbox_sheets.csv に未変換残件が残っている: "
            f"{len(residual_rows)}件 該当={residual_rows[:MAX_DIAGNOSTICS]}"
        )
    notes.append(f"shape_textbox_sheets.csv 残件: {len(residual_rows)}")
    return failures, notes


def _shape_source_text(shape: dict[str, object]) -> str:
    """The shape's original text (strike included) as recorded in the ledger."""
    return str(shape.get("text_source") or shape.get("text") or "").strip()


def _removed_shape_text(shape: dict[str, object]) -> str:
    """Text a struck DrawingML shape lost to the strike-exclusion policy."""
    struck = str(shape.get("struck_text") or "").strip()
    if struck:
        return struck
    return str(shape.get("text_source") or "").strip()


def _excluded_section_headings(document: str) -> list[str]:
    """Excluded-section headings still present in the HTML (policy violation).

    検査対象はMarkdown由来の埋め込みブロックだけに限る。除外規約はMarkdown→HTML変換の
    関門で効くものであり、Excel由来の本文には掛からない（Excel設計書自身が「概要」など
    同名の見出しを持つため、全文検索にすると正当な本文を違反と誤検知する）。ブロックは
    integrate が必ず出す `function-design-embed:start/end` マーカーで切り出し、区分限定の
    除外（画面系の「API/バッチ結果」、フロント以外の「フロント挙動」）は各ブロックの
    `data-source` から判定する。
    """
    found: list[str] = []
    for match in EMBED_BLOCK_RE.finditer(document):
        block = match.group(1)
        source_match = re.search(r'data-source="([^"]+)"', block)
        source = source_match.group(1) if source_match else None
        kind = md_converter.function_kind(source=source) if source else None
        customization = (
            md_converter.customization_kind(source=source) if source else None
        )
        common_titles = (
            md_converter.common_spec_titles(source) if source else ()
        )
        found.extend(_headings_matching(block, kind, customization, common_titles))
        found.extend(_columns_matching(block, kind))
        found.extend(_db_tables_matching(block))
    return found


# 物理テーブル・列を列挙する「DB関連」表はHTML設計書へ出力しない（2026-08-19 ユーザー決定）。
# 見出しを持たない本文中の表として書かれるため、見出し名では捕まえられない。表のヘッダ行の
# 組み合わせで検出する。永続化は論理名で書く節（0203「入出力: 永続化」）なので対象外。
_DB_TABLE_HEADER_SETS = (
    ("テーブル", "列"),
    ("テーブル", "項目"),
    ("対象テーブル", "Entity"),
    ("テーブル名", "カラム"),
)


def _db_tables_matching(fragment: str) -> list[str]:
    """Return a marker for each DB column table still embedded in the HTML."""
    hits: list[str] = []
    for table in re.findall(r"<table\b[^>]*>(.*?)</table>", fragment, flags=re.S):
        header = re.search(r"<tr\b[^>]*>(.*?)</tr>", table, flags=re.S)
        if not header:
            continue
        cells = [
            _html_fragment_text(cell)
            for cell in re.findall(r"<t[hd]\b[^>]*>(.*?)</t[hd]>", header.group(1), flags=re.S)
        ]
        for wanted in _DB_TABLE_HEADER_SETS:
            if all(any(w == c for c in cells) for w in wanted):
                hits.append("DB関連表（%s）" % " / ".join(wanted))
                break
    return hits


def _current_spec_label_violations(document: str) -> list[str]:
    """新規実装の機能が「現行仕様」の見出しで出ていないか（2026-08-19 ユーザー指摘）。

    新規実装の機能は現行ソースに実装が無く、設計書の正本は Excel基本設計である。
    ブロックの見出しは `リニューアル後の仕様` でなければならない。「現行仕様」と付くと、
    これから作る仕様を現行の挙動と読み違える。
    """
    found: list[str] = []
    for match in EMBED_BLOCK_RE.finditer(document):
        block = match.group(1)
        source_match = re.search(r'data-source="([^"]+)"', block)
        if not source_match:
            continue
        source = source_match.group(1)
        if not md_converter.is_renewal_only_document(source=source):
            continue
        if "<h3>現行仕様</h3>" in block:
            found.append(Path(source).name)
    return sorted(set(found))


def _new_screen_embed_violations(document: str) -> list[str]:
    """【新規】画面のシートに機能設計書が貼られていないか（2026-08-19 ユーザー決定）。

    【新規】は現行ソースに実装が無い画面。既存機能と機能No欄を共有していると、その既存
    機能（現行仕様）の設計書が新規画面へも貼られ、別画面の仕様をその画面の仕様と読み違える。
    その画面自身の設計書（新規実装＝リニューアル後の仕様）が貼られるのは正しいので検査しない。
    """
    found: list[str] = []
    for match in re.finditer(
        r'<section class="sheet-panel[^"]*" id="(?P<id>sheet-\d+)">(?P<body>[\s\S]*?)'
        r'(?=<section class="sheet-panel"|\Z)',
        document,
    ):
        body = match.group("body")
        heading = re.search(r"<h2>([^<]+)</h2>", body)
        if not heading or "【新規】" not in heading.group(1):
            continue
        for block in EMBED_BLOCK_RE.finditer(body):
            source_match = re.search(r'data-source="([^"]+)"', block.group(1))
            if not source_match:
                continue
            source = source_match.group(1)
            if md_converter.is_renewal_only_document(source=source):
                continue
            found.append(f"{heading.group(1)} ← {Path(source).name}")
    return sorted(set(found))


def _columns_matching(fragment: str, kind: str | None) -> list[str]:
    """区分限定で除外している表の列見出し（管理画面の「画面上の文言(英語)」など）。"""
    if not md_converter.excluded_table_columns(kind):
        return []
    names: list[str] = []
    for match in re.finditer(r"<th\b[^>]*>([\s\S]*?)</th>", fragment):
        header = _html_fragment_text(match.group(1))
        if md_converter.is_excluded_table_column(header, kind):
            names.append(f"列:{header}")
    return names


def _headings_matching(
    fragment: str,
    kind: str | None,
    customization: str | None = None,
    common_titles: tuple[str, ...] = (),
) -> list[str]:
    titles: list[str] = []
    # 5分類の許可判定は節レベル（Markdownの `##`＝埋め込みHTMLの <h2>）だけに掛ける。
    # 小見出しは親の節に属するので、見出し文字列だけで違反にしない。
    for match in re.finditer(r"<h([1-6])\b[^>]*>([\s\S]*?)</h[1-6]>", fragment):
        level = int(match.group(1))
        title = _html_fragment_text(match.group(2))
        if md_converter.is_excluded_section_heading(
            title, kind, customization, common_titles, level=level
        ):
            titles.append(title)
        # 定型小見出し（ログ・監査／権限・認可／セッション等）は階層を問わず非出力。
        elif md_converter.is_boilerplate_subsection(title):
            titles.append(title)
    return titles


EMBED_SECTION_RE = re.compile(
    r'<section class="function-design-embed"[^>]*data-source="([^"]+)"[^>]*>(.*?)</section>',
    re.S,
)
# Markdown由来ブロックの境界。`<section>` 正規表現は入れ子の `</section>` で途中打ち切りに
# なるため、integrate が必ず出す start/end マーカーで切り出す（出力除外規約の検査用）。
EMBED_BLOCK_RE = re.compile(
    r"<!-- function-design-embed:start[^>]*-->([\s\S]*?)<!-- function-design-embed:end[^>]*-->"
)
CELL_RE = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.S)
# 画面項目定義の備考欄が廃止を意味する語。deleted 判定はここで裏を取る。
ABOLITION_WORDS = re.compile(r"削除|除去|廃止|不要|踏襲しない|表示しない")


def _cells_of_item_row(document: str, anchor: str) -> list[str] | None:
    m = re.search(r'<tr id="' + re.escape(anchor) + r'">(.*?)</tr>', document, re.S)
    if not m:
        return None
    return [
        html.unescape(re.sub(r"<[^>]+>", " ", c)).strip() for c in CELL_RE.findall(m.group(1))
    ]


def _ledger_vs_excel_failures(output_dir: Path) -> list[str]:
    """台帳の判定が Excel の記述と矛盾していないか。

    最も危険な誤りは逆方向、すなわち **Excel が刷新後も要求している機能を「不要」と
    表示してしまうこと**。これを機械で防ぐ。

    - 指示原文（designQuote）が Excel由来HTMLに実在すること。根拠のない廃止判定を作らせない。
    - verdict=deleted で画面項目定義のアンカーがある場合、その行の備考欄が廃止を意味して
      いること。Excelが「任意→必須へ変更」等と書いている項目を削除扱いにすると、
      ここで NG になる。
    """
    failures: list[str] = []
    cache: dict[str, str] = {}

    for entry in superseded_specs.load_ledger().get("entries", []):
        if entry.get("verdict") not in superseded_specs.RENDER_VERDICTS:
            continue
        book = entry.get("book", "")
        if book not in cache:
            matches = sorted(output_dir.glob(f"{book}_*.html"))
            if not matches:
                failures.append(f"台帳 {entry.get('id')}: 書番 {book} のHTMLが見つからない")
                continue
            cache[book] = matches[0].read_text(encoding="utf-8")
        document = cache[book]

        quote = (entry.get("designQuote") or "").strip()
        if quote and quote not in html.unescape(re.sub(r"<[^>]+>", " ", document)):
            failures.append(
                f"台帳 {entry.get('id')}: 指示原文がExcel由来HTMLに見つからない"
                f"（designQuote=「{quote[:40]}」）。根拠を確認してください"
            )

        if entry.get("verdict") != "deleted":
            continue
        for sheet in entry.get("sheets") or []:
            anchor = sheet.get("anchor")
            if not anchor:
                continue
            cells = _cells_of_item_row(document, anchor)
            if cells is None:
                failures.append(f"台帳 {entry.get('id')}: 画面項目定義の行 {anchor} が存在しない")
                continue
            if not ABOLITION_WORDS.search(" ".join(cells)):
                failures.append(
                    f"台帳 {entry.get('id')}: Excelの画面項目定義 {anchor} が廃止と読めない"
                    f"（{' | '.join(c for c in cells if c)[:80]}）。"
                    "Excelが刷新後も要求している項目を削除扱いにしていないか確認してください"
                )
    return failures


def _superseded_failures(output_dir: Path) -> tuple[list[str], list[str]]:
    """Excel基本設計により廃止された仕様の明示が、生成物と正本から欠けていないか。

    (a) 台帳に載る機能設計書の埋め込み節・単体プレビューにバナーが出ていること。
        「バナーが無いファイルは検査対象外」にすると、レンダラが壊れて全部から
        バナーが消えても素通りする（endpoint-supplement 消失事故と同型）ので、
        台帳を起点に「在るべきものが在るか」を検査する。
    (b) 廃止の明記が機能設計書Markdown（人間用の記述正本）にあること。
        台帳とMarkdownの二重管理が腐るのを機械で止める。
    (c) 新規の廃止指示が未判定のまま残っていないこと（ベースライン ratchet）。
    """
    failures: list[str] = []
    notes: list[str] = []

    failures.extend(superseded_specs.assert_unique_markers())
    # (0) 判定そのものがExcelと矛盾していないか（Excelが要求する機能を不要と書いていないか）
    failures.extend(_ledger_vs_excel_failures(output_dir))

    entries_by_doc = superseded_specs._entries_by_doc()
    ledger_docs = {
        doc for doc, entries in entries_by_doc.items()
        if any(e.get("verdict") in superseded_specs.RENDER_VERDICTS for e in entries)
    }

    # (a) Excel由来HTMLの埋め込み節
    embedded_docs: set[str] = set()
    for path in sorted(output_dir.glob("*.html")):
        document = path.read_text(encoding="utf-8")
        for doc, section in EMBED_SECTION_RE.findall(document):
            if doc not in ledger_docs:
                continue
            embedded_docs.add(doc)
            if BANNER_MARK not in section:
                failures.append(
                    f"{path.name}: {doc} の埋め込み節に「刷新後は実装不要」バナーが無い"
                    "（integrate_function_docs_into_excel_html.py を再実行してください）"
                )

    # (a) 単体プレビュー
    for doc in sorted(ledger_docs):
        preview = PREVIEW_ROOT / Path(doc).parent.name / (Path(doc).stem + ".html")
        if not preview.exists():
            failures.append(f"プレビューHTMLが未生成: {preview.relative_to(REPO_ROOT)}")
        elif BANNER_MARK not in preview.read_text(encoding="utf-8"):
            failures.append(
                f"{preview.name}: 「刷新後は実装不要」バナーが無い"
                "（integrate_function_docs_into_excel_html.py を再実行してください）"
            )
        if doc not in embedded_docs:
            notes.append(f"埋め込み先シートなし（プレビューのみで明示）: {doc}")

    # (b) 台帳 ⇔ Markdown の同期
    for doc, entries in sorted(entries_by_doc.items()):
        source = REPO_ROOT / doc
        if not source.exists():
            failures.append(f"台帳が参照する機能設計書が存在しない: {doc}")
            continue
        text = source.read_text(encoding="utf-8")
        for entry in entries:
            if entry.get("verdict") not in superseded_specs.RENDER_VERDICTS:
                continue
            marker = superseded_specs.md_marker(entry)
            if marker not in text:
                failures.append(
                    f"{doc}: 廃止の明記が無い（台帳 {entry.get('id')}）。"
                    f"本文へ「{marker}。刷新後は実装しない」を書いてください"
                )

    # (c) 新規の廃止指示が未判定で残っていないか
    rows = detect_superseded_specs.scan()
    baseline = detect_superseded_specs.read_keys(detect_superseded_specs.BASELINE_TSV)
    fresh = [
        r for r in detect_superseded_specs.open_candidates(rows)
        if (r["book"], r["sheetId"], r["identifierId"], r["line"]) not in baseline
    ]
    for r in fresh[:MAX_DIAGNOSTICS]:
        failures.append(
            f"未判定の廃止指示: [{r['book']} {r['sheetName']} 識別ID:{r['identifierId'] or '-'}] "
            f"{r['line'][:60]} → functions/superseded_specs.json へ判定を記録してください"
        )
    if len(fresh) > MAX_DIAGNOSTICS:
        failures.append(f"未判定の廃止指示: ほか {len(fresh) - MAX_DIAGNOSTICS} 件")

    triage_left = len(detect_superseded_specs.open_candidates(rows))
    notes.append(f"台帳エントリ: {sum(len(v) for v in entries_by_doc.values())}（機能設計書 {len(entries_by_doc)} 本）")
    notes.append(f"要トリアージの廃止指示: {triage_left}（うち新規 {len(fresh)}／残りはベースライン退避済み）")
    return failures, notes


def _scenario_excluded_feature_ids() -> set[str]:
    """テスト生成側にハードコードされた Ph2 除外機能No（EXCLUDED_FEATURE_IDS）。"""
    if not SCENARIO_EXCLUSION_SOURCE.exists():
        return set()
    text = SCENARIO_EXCLUSION_SOURCE.read_text(encoding="utf-8")
    m = re.search(r"EXCLUDED_FEATURE_IDS\s*=\s*\{(.*?)\}", text, re.S)
    return set(re.findall(r'"([A-Z]\d{2}-\d{2})"', m.group(1))) if m else set()


def _phase2_failures(output_dir: Path) -> tuple[list[str], list[str]]:
    """フェーズ2対応（フェーズ1では実装しない）の明示が、生成物と正本から欠けていないか。

    廃止（superseded）と同じ構造で検査する。加えて、機能まるごとPh2のものが
    テスト生成側の除外リストに載っているかも見る。台帳とリストが食い違うと
    「設計書ではPh2なのにテストは作られる」状態になる。
    """
    failures: list[str] = []
    notes: list[str] = []

    failures.extend(phase2_specs.assert_unique_markers())

    entries_by_doc = phase2_specs._entries_by_doc()
    ledger_docs = {
        doc for doc, entries in entries_by_doc.items()
        if any(e.get("verdict") in phase2_specs.RENDER_VERDICTS for e in entries)
    }

    embedded_docs: set[str] = set()
    for path in sorted(output_dir.glob("*.html")):
        document = path.read_text(encoding="utf-8")
        for doc, section in EMBED_SECTION_RE.findall(document):
            if doc not in ledger_docs:
                continue
            embedded_docs.add(doc)
            if PHASE2_MARK not in section:
                failures.append(
                    f"{path.name}: {doc} の埋め込み節にフェーズ2スコープバナーが無い"
                    "（integrate_function_docs_into_excel_html.py を再実行してください）"
                )

    for doc in sorted(ledger_docs):
        preview = PREVIEW_ROOT / Path(doc).parent.name / (Path(doc).stem + ".html")
        if not preview.exists():
            failures.append(f"プレビューHTMLが未生成: {preview.relative_to(REPO_ROOT)}")
        elif PHASE2_MARK not in preview.read_text(encoding="utf-8"):
            failures.append(f"{preview.name}: フェーズ2スコープバナーが無い")
        if doc not in embedded_docs:
            notes.append(f"埋め込み先シートなし（プレビューのみで明示）: {doc}")

    # 台帳 ⇔ Markdown の同期
    for doc, entries in sorted(entries_by_doc.items()):
        source = REPO_ROOT / doc
        if not source.exists():
            failures.append(f"Ph2台帳が参照する機能設計書が存在しない: {doc}")
            continue
        text = source.read_text(encoding="utf-8")
        for entry in entries:
            if entry.get("verdict") not in phase2_specs.RENDER_VERDICTS:
                continue
            marker = phase2_specs.md_marker(entry)
            if marker not in text:
                failures.append(
                    f"{doc}: フェーズ2対応の明記が無い（Ph2台帳 {entry.get('id')}）。"
                    f"本文へ「{marker}。フェーズ1では実装しない」を書いてください"
                )

    # 機能まるごとPh2 ⊆ テスト生成側の除外リスト
    excluded = _scenario_excluded_feature_ids()
    if excluded:
        for entry in phase2_specs.load_ledger().get("entries", []):
            if entry.get("verdict") not in phase2_specs.RENDER_VERDICTS:
                continue
            if entry.get("scope") != "FUNCTION_SCOPE":
                continue  # 項目単位のPh2は機能ごと除外してはならない
            for feature_no in entry.get("featureNos") or []:
                if feature_no not in excluded:
                    failures.append(
                        f"Ph2台帳 {entry.get('id')}: {feature_no} が機能まるごとPh2なのに、"
                        "テスト生成側の EXCLUDED_FEATURE_IDS に無い"
                        f"（{SCENARIO_EXCLUSION_SOURCE.relative_to(REPO_ROOT)}）。"
                        "設計書ではPh2なのにテストが作られてしまいます"
                    )

    # 新規のPh2注記が未判定で残っていないか
    rows = detect_phase2_specs.scan()
    baseline = detect_phase2_specs.read_keys(detect_phase2_specs.BASELINE_TSV)
    fresh = [
        r for r in detect_phase2_specs.open_candidates(rows)
        if (r["book"], r["sheetId"], r["line"]) not in baseline
    ]
    for r in fresh[:MAX_DIAGNOSTICS]:
        failures.append(
            f"未判定のPh2注記: [{r['book']} {r['sheetName']} {r['featureNo'] or '-'}] "
            f"{r['line'][:60]} → functions/phase2_specs.json へ判定を記録してください"
        )
    if len(fresh) > MAX_DIAGNOSTICS:
        failures.append(f"未判定のPh2注記: ほか {len(fresh) - MAX_DIAGNOSTICS} 件")

    triage = [e for e in phase2_specs.load_ledger().get("entries", []) if e.get("verdict") == "needs-triage"]
    notes.append(f"Ph2台帳エントリ: {len(phase2_specs.load_ledger().get('entries', []))}（機能設計書 {len(entries_by_doc)} 本）")
    notes.append(f"対象が特定できず要判定のPh2注記: {len(triage)} 件")
    return failures, notes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", default=BASE_DIR / "input", type=Path)
    parser.add_argument("--output-dir", default=BASE_DIR / "output", type=Path)
    args = parser.parse_args()

    workbooks = sorted(
        p
        for p in args.input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in convert.SUPPORTED_SUFFIXES
    )
    if not workbooks:
        print(f"No Excel files in {args.input_dir}", file=sys.stderr)
        return 1

    ok = True
    for xlsx in workbooks:
        html_path = args.output_dir / f"{xlsx.stem}.html"
        print(f"\n=== {xlsx.name} ===")
        if not html_path.exists():
            print(f"  NG: HTMLが未生成: {html_path}")
            ok = False
            continue
        failures, notes = verify_workbook(xlsx, html_path)
        for note in notes:
            print(f"  - {note}")
        if failures:
            ok = False
            for f in failures:
                print(f"  NG: {f}")
        else:
            print("  OK: 全チェック合格")

    print("\n=== 廃止仕様の明示（superseded-spec） ===")
    sup_failures, sup_notes = _superseded_failures(args.output_dir)
    for note in sup_notes:
        print(f"  - {note}")
    if sup_failures:
        ok = False
        for f in sup_failures:
            print(f"  NG: {f}")
    else:
        print("  OK: 台帳の全エントリがバナー・Markdownに反映され、未判定の新規廃止指示なし")

    print("\n=== フェーズ2対応の明示（phase2-spec） ===")
    ph2_failures, ph2_notes = _phase2_failures(args.output_dir)
    for note in ph2_notes:
        print(f"  - {note}")
    if ph2_failures:
        ok = False
        for f in ph2_failures:
            print(f"  NG: {f}")
    else:
        print("  OK: Ph2台帳の全エントリがバナー・Markdownに反映され、テスト除外リストとも同期")

    print("\n" + ("VERIFY OK" if ok else "VERIFY FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
