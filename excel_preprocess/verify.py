"""差分0検証器(仕様§4)。

3モード:
  - source:      excel_blocks/<fid>.json と原本 .xlsx を再突合。
  - reconstruct: JSON -> 一時.xlsx(openpyxl書き出し) -> 直接XML再読込 -> 元JSONと突合。
  - golden:      excel_blocks/<fid>.json(または任意JSON) と golden/expected/<case>.json を突合。

比較はcanonical modelの意味等価性であり、バイト一致は要求しない(仕様§4)。
差分は `CODE 絶対参照 expected=... actual=...` 形式で報告する
(例: `CELL_STYLE_MISMATCH 0204:L6285 expected=cell-strike actual=[]`)。
比較不能な要素を黙って除外して一致とみなすことはしない。
"""
from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from . import ooxml
from .canonical import BlockRange, build_block_model, load_workbook_reader
from .errors import DiffFoundError, SourceReadError
from .reconstruct import build_temp_workbook


@dataclass
class VerifyResult:
    ok: bool
    diffs: list[str]
    mode: str
    notes: list[str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.notes is None:
            self.notes = []


def _load_json(path: Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _cell_relative_map(model: dict) -> dict[tuple[int, int], tuple[str, dict]]:
    block = model["block"]
    row_start, col_start = block["row_start"], block["col_start"]
    out: dict[tuple[int, int], tuple[str, dict]] = {}
    for addr, cell in model["cells"].items():
        col_letters, row = ooxml.split_address(addr)
        col = ooxml.col_letters_to_index(col_letters)
        out[(row - row_start, col - col_start)] = (addr, cell)
    return out


def _row_relative_map(model: dict) -> dict[int, dict]:
    block = model["block"]
    row_start = block["row_start"]
    out = {}
    for k, v in model["rows"].items():
        out[int(k) - row_start] = v
    return out


def _col_relative_map(model: dict) -> dict[int, dict]:
    block = model["block"]
    col_start = block["col_start"]
    out = {}
    for letters, v in model["columns"].items():
        col = ooxml.col_letters_to_index(letters)
        out[col - col_start] = v
    return out


def _merge_relative_set(model: dict) -> set[tuple[int, int, int, int]]:
    block = model["block"]
    row_start, col_start = block["row_start"], block["col_start"]
    out = set()
    for ref in model.get("merged_ranges", []):
        r1, c1, r2, c2 = ooxml.parse_range(ref)
        out.add((r1 - row_start, c1 - col_start, r2 - row_start, c2 - col_start))
    return out


def _style_projection(normalized_xf: dict, relax_color_kind: bool) -> dict:
    """比較用の書式射影。relax_color_kind=True の場合、色は解決済みhexのみで比較する
    (reconstructモードはopenpyxl書き出しでtheme参照をRGBへ確定させるため、
    'kind'差異(theme vs rgb)自体は意味的な差分にしない。仕様§4「バイト一致を
    要求しない」に基づく明示的な緩和であり、他の一切の項目は緩めない)。
    """
    if not relax_color_kind:
        return normalized_xf

    def _color(c):
        # Normalize both "no color spec at all" (None) and "color spec whose
        # index/theme could not be resolved to a concrete hex" ({"hex": None})
        # to the same shape: they carry equally little information, and the
        # openpyxl reconstruct writer cannot round-trip an unresolved indexed
        # color reference (it only ever emits resolved rgb or omits color).
        if c is None:
            return {"hex": None}
        return {"hex": c.get("hex")}

    proj = json.loads(json.dumps(normalized_xf))
    proj["font"]["color"] = _color(proj["font"].get("color"))
    fill = proj["fill"]
    fill["fg_color"] = _color(fill.get("fg_color"))
    fill["bg_color"] = _color(fill.get("bg_color"))
    for side in ("left", "right", "top", "bottom", "diagonal"):
        proj["border"][side]["color"] = _color(proj["border"][side].get("color"))
    return proj


def compare_models(
    expected: dict,
    actual: dict,
    workbook_no: str,
    mode: str,
) -> tuple[list[str], list[str]]:
    """expected(正)とactual(実測)を比較し、(diffs, notes) を返す。

    mode: "source" | "reconstruct" | "golden"

    diffs が空でも exit0 の必要条件に過ぎない。notes は「意図的かつ明示された
    比較対象外」(reconstructモードの図形/条件付き書式など、仕様が非目標と
    明示する範囲)を可視化するためのもので、pass/fail判定には使わない
    (黙って除外するのではなく、除外した事実自体を出力する)。
    """
    diffs: list[str] = []
    notes: list[str] = []
    relax_color_kind = mode == "reconstruct"

    def addr(a: str) -> str:
        return f"{workbook_no}:{a}"

    if mode != "reconstruct":
        es, as_ = expected["source"], actual["source"]
        # sheet_part/sheet_state (表示/非表示) は source/golden モードでは同一原本を
        # 読んでいる以上必ず一致するはずであり、比較を省くとJSON改竄を見逃す
        # (codex D2レビュー Blocker①)。reconstruct モードは別ファイル(一時xlsx)を
        # 読むため意味を持たず対象外。
        for field in ("sha256", "sheet_name", "sheet_index", "workbook_no", "sheet_part", "sheet_state"):
            if es.get(field) != as_.get(field):
                diffs.append(
                    f"SOURCE_{field.upper()}_MISMATCH {workbook_no} expected={es.get(field)} actual={as_.get(field)}"
                )
        # integrity.source_parts_sha256: styles.xml/sharedStrings.xml/シートパートの
        # 生バイトハッシュ。両モデルとも同一原本を読んでいれば一致するはずで、
        # 比較を省くと「同じ原本を読んだ体で異なる中身を主張するJSON」を見逃す。
        e_parts = expected.get("integrity", {}).get("source_parts_sha256", {})
        a_parts = actual.get("integrity", {}).get("source_parts_sha256", {})
        for part in sorted(set(e_parts) | set(a_parts)):
            if e_parts.get(part) != a_parts.get(part):
                diffs.append(
                    f"SOURCE_PART_SHA256_MISMATCH {workbook_no}:{part} "
                    f"expected={e_parts.get(part)} actual={a_parts.get(part)}"
                )

    eb, ab = expected["block"], actual["block"]
    for field in ("row_start", "row_end", "col_start", "col_end"):
        if eb[field] != ab[field]:
            diffs.append(f"BLOCK_RANGE_MISMATCH {field} expected={eb[field]} actual={ab[field]}")

    # custom_height/custom_width: excluded from reconstruct-mode field comparison
    # ONLY. openpyxl.RowDimension.customHeight and ColumnDimension.customWidth are
    # READ-ONLY computed properties (`ht is not None` / `bool(width)` respectively
    # - see openpyxl.worksheet.dimensions source) with no public setter, so
    # reconstruct.py cannot write an independent custom_height/custom_width value
    # even though it does write height/width correctly. This is a documented,
    # non-silent exclusion (not a comparison gap for source/golden, where the
    # real XML is read directly and no such API limitation applies).
    row_fields = ["height", "hidden", "outline_level", "present_in_xml"]
    col_fields = ["width", "hidden", "outline_level"]
    if mode != "reconstruct":
        row_fields.append("custom_height")
        col_fields.append("custom_width")
    else:
        notes.append(
            "NOTE_RECONSTRUCT_SKIPPED_FIELDS custom_height/custom_width: "
            "openpyxl RowDimension.customHeight/ColumnDimension.customWidth are "
            "read-only computed properties (no public setter); excluded from "
            "reconstruct-mode comparison only. Fully compared in source/golden modes."
        )

    # -- rows --
    er, ar = _row_relative_map(expected), _row_relative_map(actual)
    for off in sorted(set(er) | set(ar)):
        e, a = er.get(off), ar.get(off)
        erow = eb["row_start"] + off
        if e is None or a is None:
            diffs.append(f"ROW_MISSING {addr(str(erow))} expected={e is not None} actual={a is not None}")
            continue
        for field in row_fields:
            if e.get(field) != a.get(field):
                diffs.append(
                    f"ROW_META_MISMATCH {addr(str(erow))} field={field} expected={e.get(field)} actual={a.get(field)}"
                )

    # -- columns --
    ec, ac = _col_relative_map(expected), _col_relative_map(actual)
    for off in sorted(set(ec) | set(ac)):
        e, a = ec.get(off), ac.get(off)
        ecol_letters = ooxml.col_index_to_letters(eb["col_start"] + off)
        if e is None or a is None:
            diffs.append(f"COLUMN_MISSING {workbook_no}:{ecol_letters} expected={e is not None} actual={a is not None}")
            continue
        for field in col_fields:
            if e.get(field) != a.get(field):
                diffs.append(
                    f"COLUMN_META_MISMATCH {workbook_no}:{ecol_letters} field={field} "
                    f"expected={e.get(field)} actual={a.get(field)}"
                )

    # -- cells --
    ecells, acells = _cell_relative_map(expected), _cell_relative_map(actual)
    for off in sorted(set(ecells) | set(acells)):
        e_pair, a_pair = ecells.get(off), acells.get(off)
        if e_pair is None or a_pair is None:
            eaddr = e_pair[0] if e_pair else a_pair[0]
            diffs.append(f"CELL_MISSING {addr(eaddr)} expected={e_pair is not None} actual={a_pair is not None}")
            continue
        eaddr, e = e_pair
        _aaddr, a = a_pair
        if e["present_in_xml"] != a["present_in_xml"]:
            diffs.append(
                f"CELL_PRESENCE_MISMATCH {addr(eaddr)} expected={e['present_in_xml']} actual={a['present_in_xml']}"
            )
            continue
        if not e["present_in_xml"]:
            continue
        string_types = {"s", "inlineStr", "str"}
        type_equiv = e["type"] == a["type"] or (
            mode == "reconstruct" and e["type"] in string_types and a["type"] in string_types
        )
        # reconstruct mode: openpyxl always writes new strings as shared
        # strings OR inline strings depending on internal heuristics, not
        # whichever form the original used; s/inlineStr/str are the same
        # semantic "text cell" and are not required to round-trip byte-for-
        # byte per spec §4 ("styleId等はバイト一致を要求しない").
        if not type_equiv:
            diffs.append(f"CELL_TYPE_MISMATCH {addr(eaddr)} expected={e['type']} actual={a['type']}")
        if e["value_lexical"] != a["value_lexical"]:
            diffs.append(
                f"CELL_VALUE_MISMATCH {addr(eaddr)} expected={e['value_lexical']!r} actual={a['value_lexical']!r}"
            )
        if (e.get("formula") or None) != (a.get("formula") or None):
            diffs.append(f"CELL_FORMULA_MISMATCH {addr(eaddr)} expected={e.get('formula')!r} actual={a.get('formula')!r}")
        if mode != "reconstruct" and (e.get("formula_type") or None) != (a.get("formula_type") or None):
            # reconstruct: openpyxl does not preserve shared/array formula_type
            # markers when writing plain "=..." formula text back out.
            diffs.append(
                f"CELL_FORMULA_TYPE_MISMATCH {addr(eaddr)} expected={e.get('formula_type')!r} actual={a.get('formula_type')!r}"
            )
        if sorted(e["format_classes"]) != sorted(a["format_classes"]):
            diffs.append(
                f"CELL_STYLE_MISMATCH {addr(eaddr)} expected={sorted(e['format_classes'])} actual={sorted(a['format_classes'])}"
            )
        # deep style fingerprint (skip if format_classes already flagged this cell,
        # to avoid noise, but still check independently as required by spec: silent
        # exclusion of incomparable elements is not permitted).
        e_style, a_style = e.get("style"), a.get("style")
        if bool(e_style) != bool(a_style):
            diffs.append(f"CELL_STYLE_PRESENCE_MISMATCH {addr(eaddr)} expected={bool(e_style)} actual={bool(a_style)}")
        elif e_style and a_style:
            e_fp, a_fp = e_style["fingerprint"], a_style["fingerprint"]
            if e_fp != a_fp:
                e_norm = expected["styles"].get(e_fp, {}).get("normalized_xf", {})
                a_norm = actual["styles"].get(a_fp, {}).get("normalized_xf", {})
                e_proj = _style_projection(e_norm, relax_color_kind)
                a_proj = _style_projection(a_norm, relax_color_kind)
                if e_proj != a_proj:
                    diffs.append(
                        f"CELL_FINGERPRINT_MISMATCH {addr(eaddr)} expected={e_fp[:12]} actual={a_fp[:12]}"
                    )
        # rich text runs
        eruns, aruns = e.get("rich_text_runs") or [], a.get("rich_text_runs") or []
        if len(eruns) != len(aruns):
            diffs.append(
                f"RICH_RUN_COUNT_MISMATCH {addr(eaddr)} expected={len(eruns)} actual={len(aruns)}"
            )
        else:
            run_fields = [
                "text", "space_preserve", "effective_bold", "effective_strike",
                "strike_from_cell", "bold_from_cell",
                "explicit_bold", "explicit_strike", "explicit_italic", "explicit_underline",
            ]
            none_vs_false_fields = {"explicit_bold", "explicit_strike", "explicit_italic", "explicit_underline"}
            for i, (er_, ar_) in enumerate(zip(eruns, aruns)):
                for field in run_fields:
                    ev, av = er_.get(field), ar_.get(field)
                    if ev == av:
                        continue
                    if mode == "reconstruct" and field in none_vs_false_fields and ev is None and av is False:
                        # openpyxl.cell.rich_text.TextBlock.to_tree() ALWAYS
                        # emits an <rPr> element for every run in a multi-run
                        # CellRichText (TextBlock.font is a required Typed
                        # field; there is no way to omit rPr entirely). A run
                        # that originally had NO rPr at all (explicit_*=None,
                        # full cell-inherit) therefore round-trips with an
                        # empty-but-present rPr, which re-parses as explicit
                        # False rather than None. effective_bold/effective_strike
                        # are unaffected in this specific direction ONLY when
                        # the cell's own font is also non-bold/non-strike
                        # (verified: they are compared separately, in full,
                        # above and below, and still catch a real mismatch if
                        # the effective value actually changes). Documented,
                        # not silent - emits one NOTE.
                        if not any(n.startswith("NOTE_RECONSTRUCT_RPR_NONE_TO_FALSE") for n in notes):
                            notes.append(
                                f"NOTE_RECONSTRUCT_RPR_NONE_TO_FALSE {workbook_no} field={field}: "
                                "openpyxl TextBlock always writes <rPr> for multi-run cells, so a run "
                                "with no original rPr (explicit_*=None, full cell-inherit) reconstructs "
                                "with explicit_*=False instead of None. effective_bold/effective_strike "
                                "are still compared in full and would catch any real semantic drift."
                            )
                        continue
                    diffs.append(
                        f"RICH_RUN_MISMATCH {addr(eaddr)} run={i} field={field} "
                        f"expected={ev!r} actual={av!r}"
                    )

    # -- merges --
    em, am = _merge_relative_set(expected), _merge_relative_set(actual)
    for m in em - am:
        diffs.append(f"MERGE_MISSING_IN_ACTUAL {workbook_no} expected_range={m}")
    for m in am - em:
        diffs.append(f"MERGE_UNEXPECTED_IN_ACTUAL {workbook_no} actual_range={m}")

    # -- drawing / conditional-formatting residuals (未保証要素の「存在・アンカー」) --
    # reconstruct モードのみ対象外: reconstruct.py はopenpyxl書き出しの都合上、
    # 図形(drawing)・条件付き書式そのものを一時xlsxへ再書き込みしない
    # (仕様冒頭「図形、画像...条件付き書式...は保証しない...存在・アンカー・
    # 未保証を記録し、仕様解釈は実機／人手確認へ渡す」という明示的な非目標の範囲)。
    # source/golden モードは同一原本を読むため必ず一致するはずであり、
    # ここを比較しないと「未保証要素の記録自体が欠落・捏造されたJSON」を
    # 見逃す(codex D2レビュー Blocker①)。黙って除外せず、reconstructでは
    # その旨を NOTE として可視化する。
    if mode == "reconstruct":
        e_dr, a_dr = expected.get("drawing_residuals") or [], actual.get("drawing_residuals") or []
        e_cf, a_cf = expected.get("conditional_formatting_residuals") or [], actual.get("conditional_formatting_residuals") or []
        if e_dr or e_cf:
            notes.append(
                f"NOTE_RECONSTRUCT_SKIPPED_RESIDUALS {workbook_no} "
                f"drawing_residuals(expected={len(e_dr)},actual_after_reconstruct={len(a_dr)}) "
                f"conditional_formatting_residuals(expected={len(e_cf)},actual_after_reconstruct={len(a_cf)}) "
                "reason=spec非目標(図形/条件付き書式は再構成不能・仕様冒頭で明示)。pass/fail判定には使わない(notes扱い)。"
            )
    else:
        e_draw = _residual_relative_set(expected, "drawing_residuals", ("anchor_type", "drawing_part"))
        a_draw = _residual_relative_set(actual, "drawing_residuals", ("anchor_type", "drawing_part"))
        for r in e_draw - a_draw:
            diffs.append(f"DRAWING_RESIDUAL_MISSING_IN_ACTUAL {workbook_no} expected={r}")
        for r in a_draw - e_draw:
            diffs.append(f"DRAWING_RESIDUAL_UNEXPECTED_IN_ACTUAL {workbook_no} actual={r}")

        e_cf = _cond_fmt_relative_set(expected)
        a_cf = _cond_fmt_relative_set(actual)
        for r in e_cf - a_cf:
            diffs.append(f"CONDITIONAL_FORMATTING_RESIDUAL_MISSING_IN_ACTUAL {workbook_no} expected={r}")
        for r in a_cf - e_cf:
            diffs.append(f"CONDITIONAL_FORMATTING_RESIDUAL_UNEXPECTED_IN_ACTUAL {workbook_no} actual={r}")

    return diffs, notes


def _residual_relative_set(model: dict, key: str, extra_fields: tuple[str, ...]) -> set[tuple]:
    """drawing_residuals を (行offset, 列offset, *extra_fields) のタプル集合にする。

    anchor_cellは絶対アドレスなので、reconstruct等でブロック原点が異なっても
    比較できるよう、block.row_start/col_start基準の相対オフセットへ変換する
    (`_cell_relative_map` と同じ考え方)。
    """
    block = model["block"]
    row_start, col_start = block["row_start"], block["col_start"]
    out: set[tuple] = set()
    for item in model.get(key) or []:
        col_letters, row = ooxml.split_address(item["anchor_cell"])
        col = ooxml.col_letters_to_index(col_letters)
        extras = tuple(item.get(f) for f in extra_fields)
        out.add((row - row_start, col - col_start) + extras)
    return out


def _cond_fmt_relative_set(model: dict) -> set[tuple]:
    """conditional_formatting_residuals を (相対range, rule_typesのタプル) の集合にする。"""
    block = model["block"]
    row_start, col_start = block["row_start"], block["col_start"]
    out: set[tuple] = set()
    for item in model.get("conditional_formatting_residuals") or []:
        r1, c1, r2, c2 = ooxml.parse_range(item["sqref"])
        rel = (r1 - row_start, c1 - col_start, r2 - row_start, c2 - col_start)
        out.add((rel, tuple(sorted(item.get("rule_types") or []))))
    return out


def verify_source(block_json_path: Path, source: Path) -> VerifyResult:
    """`--source` は仕様§4の例 `excel-preprocess verify --block ... --source <xlsx>`
    通り、原本 .xlsx への直接パス、またはそれを含むディレクトリのいずれかを
    受け付ける。
    """
    stored = _load_json(block_json_path)
    source = Path(source)
    book_path = source if source.is_file() else source / stored["source"]["workbook_file"]
    if not book_path.exists():
        raise SourceReadError(f"workbook file not found: {book_path}")
    if book_path.name != stored["source"]["workbook_file"]:
        raise SourceReadError(
            f"--source file name {book_path.name!r} does not match "
            f"block JSON's declared workbook_file {stored['source']['workbook_file']!r}"
        )
    reader = load_workbook_reader(book_path)
    sheet = reader.sheets[stored["source"]["sheet_index"]]
    block = BlockRange(**{k: stored["block"][k] for k in ("row_start", "row_end", "col_start", "col_end")})
    recomputed = build_block_model(
        reader=reader,
        sheet=sheet,
        block=block,
        fid=stored["fid"],
        function_no=stored["function_no"],
        boundary_evidence=stored["block"]["boundary_evidence"],
    )
    diffs, notes = compare_models(stored, recomputed, stored["source"]["workbook_no"], mode="source")
    return VerifyResult(ok=not diffs, diffs=diffs, mode="source", notes=notes)


def verify_reconstruct(block_json_path: Path) -> VerifyResult:
    stored = _load_json(block_json_path)
    with tempfile.TemporaryDirectory(prefix="excel_preprocess_reconstruct_") as tmpdir:
        tmp_xlsx = Path(tmpdir) / "reconstructed.xlsx"
        build_temp_workbook(stored, tmp_xlsx)
        reader = load_workbook_reader(tmp_xlsx)
        sheet = reader.sheets[0]
        block = stored["block"]
        nrows = block["row_end"] - block["row_start"] + 1
        ncols = block["col_end"] - block["col_start"] + 1
        rel_block = BlockRange(row_start=1, row_end=nrows, col_start=1, col_end=ncols)
        reconstructed = build_block_model(
            reader=reader,
            sheet=sheet,
            block=rel_block,
            fid=stored["fid"],
            function_no=stored["function_no"],
            boundary_evidence=stored["block"]["boundary_evidence"],
        )
        # Re-express the ORIGINAL model in the same relative (1,1)-origin frame
        # so cell-by-cell comparison lines up positionally.
        rebased = json.loads(json.dumps(stored))
        rebased["block"] = {
            "row_start": 1,
            "row_end": nrows,
            "col_start": 1,
            "col_end": ncols,
            "boundary_evidence": stored["block"]["boundary_evidence"],
        }
        row_shift = 1 - block["row_start"]
        col_shift = 1 - block["col_start"]
        rebased_cells = {}
        for addr, cell in stored["cells"].items():
            col_letters, row = ooxml.split_address(addr)
            col = ooxml.col_letters_to_index(col_letters)
            new_addr = f"{ooxml.col_index_to_letters(col + col_shift)}{row + row_shift}"
            new_cell = dict(cell)
            new_cell["address"] = new_addr
            rebased_cells[new_addr] = new_cell
        rebased["cells"] = rebased_cells
        rebased["rows"] = {str(int(k) + row_shift): v for k, v in stored["rows"].items()}
        rebased["columns"] = stored["columns"]  # column letters are already block-relative-independent keys; remap below
        rebased_columns = {}
        for letters, v in stored["columns"].items():
            col = ooxml.col_letters_to_index(letters)
            rebased_columns[ooxml.col_index_to_letters(col + col_shift)] = v
        rebased["columns"] = rebased_columns
        rebased_merges = []
        for ref in stored.get("merged_ranges", []):
            r1, c1, r2, c2 = ooxml.parse_range(ref)
            rebased_merges.append(
                f"{ooxml.col_index_to_letters(c1 + col_shift)}{r1 + row_shift}:"
                f"{ooxml.col_index_to_letters(c2 + col_shift)}{r2 + row_shift}"
            )
        rebased["merged_ranges"] = rebased_merges

        diffs, notes = compare_models(rebased, reconstructed, stored["source"]["workbook_no"], mode="reconstruct")
    return VerifyResult(ok=not diffs, diffs=diffs, mode="reconstruct", notes=notes)


def verify_golden(block_json_path: Path, expected_json_path: Path) -> VerifyResult:
    actual = _load_json(block_json_path)
    expected = _load_json(expected_json_path)
    diffs, notes = compare_models(expected, actual, expected["source"]["workbook_no"], mode="golden")
    return VerifyResult(ok=not diffs, diffs=diffs, mode="golden", notes=notes)
