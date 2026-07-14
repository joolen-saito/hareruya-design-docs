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
6. Shape-text coverage - every DrawingML shape/textbox text is rendered either
                         as an image pin or in the fallback shape table, with
                         actionable sheet/cell diagnostics when missing.
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
from collections import Counter
from pathlib import Path

from openpyxl import load_workbook

import convert

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
SKILL_SCRIPTS = REPO_ROOT / ".cursor" / "skills" / "function-spec-html-render" / "scripts"
sys.path.insert(0, str(SKILL_SCRIPTS))
import superseded_specs  # noqa: E402
import phase2_specs  # noqa: E402
import detect_superseded_specs  # noqa: E402
import detect_phase2_specs  # noqa: E402

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
    missing_cells = 0
    total_cells = 0
    for ws in visible_sheets:
        for row in ws.iter_rows():
            for cell in row:
                text = convert.format_cell_value(cell.value, cell.number_format).strip()
                if not text:
                    continue
                total_cells += 1
                if _norm(text) not in body_text:
                    missing_cells += 1
    if total_cells:
        cov = 100 * (total_cells - missing_cells) / total_cells
        notes.append(f"セル値カバレッジ: {cov:.2f}% ({total_cells - missing_cells}/{total_cells})")
        if cov < 99.5:
            failures.append(f"セル値カバレッジが低い: {cov:.2f}%（欠落 {missing_cells}）")

    # 2.5) strikethrough coverage
    expected_strikes: Counter[str] = Counter()
    for ws in visible_sheets:
        for row in ws.iter_rows():
            for cell in row:
                for run in convert.cell_text_runs(cell):
                    text = run["text"].strip()
                    if run.get("strike") and text:
                        expected_strikes[_norm(text)] += 1
    if expected_strikes:
        rendered_strikes: Counter[str] = Counter()
        for fragment in re.findall(
            r'<span class="cell-strike">(.*?)</span>', document, flags=re.S
        ):
            text = _html_fragment_text(fragment)
            if text:
                rendered_strikes[text] += 1
        missing_strikes = 0
        missing_examples: list[str] = []
        for text, count in expected_strikes.items():
            lack = count - rendered_strikes.get(text, 0)
            if lack > 0:
                missing_strikes += lack
                if len(missing_examples) < 5:
                    missing_examples.append(text[:60])
        total_strikes = sum(expected_strikes.values())
        notes.append(
            f"取り消し線: {total_strikes - missing_strikes}/{total_strikes}"
        )
        if missing_strikes:
            failures.append(
                f"取り消し線がHTMLから欠落: {missing_strikes}件 例:{missing_examples}"
            )

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

    # 5) Shape/textbox omissions - every DrawingML shape text must survive into
    #    the HTML, either as original text in the fallback shape table/plain pin
    #    or as its normalized No. in an actual image pin. Report the sheet/cell
    #    and text so humans know exactly what to inspect next.
    missing_shapes = 0
    total_shapes = 0
    inventory_failures: list[str] = []
    missing_examples: list[str] = []
    for sheet_index, ws in enumerate(visible_sheets, start=1):
        expected_shapes = [
            shape
            for shape in shapes_by.get(ws.title, [])
            if str(shape.get("text", "")).strip()
        ]
        shape_rows = _shape_section_rows(document, f"sheet-{sheet_index}-shapes")
        if len(shape_rows) != len(expected_shapes):
            inventory_failures.append(
                f"{ws.title}: shape rows {len(shape_rows)}/{len(expected_shapes)}"
            )
        for index, shape in enumerate(expected_shapes, start=1):
            text = str(shape.get("text", "")).strip()
            total_shapes += 1
            no = convert.normalize_pin_id(text)
            present = _norm(text) in body_text or (
                no and wf_pin_texts.get(_norm(no), 0) > 0
            )
            if not present:
                missing_shapes += 1
                if len(missing_examples) < MAX_DIAGNOSTICS:
                    missing_examples.append(_shape_diagnostic(ws.title, shape))
            row = shape_rows[index - 1] if index - 1 < len(shape_rows) else None
            if row is None:
                continue
            if (
                row["index"] != str(index)
                or row["ref"] != str(shape.get("cellref", ""))
                or row["text"] != _norm(text)
            ):
                inventory_failures.append(
                    f"{ws.title}: shape #{index} mismatch "
                    f"expected={_shape_diagnostic(ws.title, shape)}"
                )
    notes.append(
        f"図形・テキストボックス内テキスト: "
        f"{total_shapes - missing_shapes}/{total_shapes}"
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
    summary_path = html_path.parent / "shape_textbox_sheets.csv"
    residual_rows = _shape_residual_rows(summary_path, xlsx.name)
    if residual_rows:
        failures.append(
            "shape_textbox_sheets.csv に未変換残件が残っている: "
            f"{len(residual_rows)}件 "
            f"該当={residual_rows[:MAX_DIAGNOSTICS]}"
        )
    notes.append(f"shape_textbox_sheets.csv 残件: {len(residual_rows)}")

    return failures, notes


EMBED_SECTION_RE = re.compile(
    r'<section class="function-design-embed"[^>]*data-source="([^"]+)"[^>]*>(.*?)</section>',
    re.S,
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
                    f"{path.name}: {doc} の埋め込み節に「フェーズ1では実装不要」バナーが無い"
                    "（integrate_function_docs_into_excel_html.py を再実行してください）"
                )

    for doc in sorted(ledger_docs):
        preview = PREVIEW_ROOT / Path(doc).parent.name / (Path(doc).stem + ".html")
        if not preview.exists():
            failures.append(f"プレビューHTMLが未生成: {preview.relative_to(REPO_ROOT)}")
        elif PHASE2_MARK not in preview.read_text(encoding="utf-8"):
            failures.append(f"{preview.name}: 「フェーズ1では実装不要」バナーが無い")
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
