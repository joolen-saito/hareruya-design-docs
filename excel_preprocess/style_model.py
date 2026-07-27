"""実効書式の正規化とfingerprint算出(仕様§1「styles」「format_classes」、§4検証項目)。

`ooxml.StylesTable` の生データ(cellXfsのインデックス)から、フォント/塗り/罫線/
配置/数値書式/保護/quotePrefixを解決した「正規化xf」を作り、sha256で
fingerprintする。同一の実効書式は同一fingerprintに収束する
(styleId自体はOOXML実装依存でバイト一致を要求しない、仕様§4)。
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict
from typing import Any, Optional

from . import ooxml


def _color_json(spec: Optional[dict], theme_colors: list[str]) -> Optional[dict]:
    if spec is None:
        return None
    resolved = ooxml.resolve_color(spec, theme_colors)
    return {"kind": resolved["kind"], "hex": resolved["hex"]}


def normalize_font(font: Optional[ooxml.FontSpec], theme_colors: list[str]) -> dict:
    if font is None:
        return {
            "bold": False,
            "strike": False,
            "italic": False,
            "underline": False,
            "size": None,
            "color": None,
            "name": None,
        }
    return {
        "bold": font.bold,
        "strike": font.strike,
        "italic": font.italic,
        "underline": font.underline,
        "size": font.size,
        "color": _color_json(font.color, theme_colors),
        "name": font.name,
    }


def normalize_fill(fill: Optional[ooxml.FillSpec], theme_colors: list[str]) -> dict:
    if fill is None or fill.pattern_type is None or fill.pattern_type == "none":
        return {"pattern_type": None, "fg_color": None, "bg_color": None}
    return {
        "pattern_type": fill.pattern_type,
        "fg_color": _color_json(fill.fg_color, theme_colors),
        "bg_color": _color_json(fill.bg_color, theme_colors),
    }


def _side(side: ooxml.BorderSideSpec, theme_colors: list[str]) -> dict:
    if side.style is None:
        return {"style": None, "color": None}
    return {"style": side.style, "color": _color_json(side.color, theme_colors)}


def normalize_border(border: Optional[ooxml.BorderSpec], theme_colors: list[str]) -> dict:
    if border is None:
        empty = {"style": None, "color": None}
        return {
            "left": empty,
            "right": empty,
            "top": empty,
            "bottom": empty,
            "diagonal": empty,
            "diagonal_up": False,
            "diagonal_down": False,
        }
    return {
        "left": _side(border.left, theme_colors),
        "right": _side(border.right, theme_colors),
        "top": _side(border.top, theme_colors),
        "bottom": _side(border.bottom, theme_colors),
        "diagonal": _side(border.diagonal, theme_colors),
        "diagonal_up": border.diagonal_up,
        "diagonal_down": border.diagonal_down,
    }


def normalize_alignment(alignment: Optional[ooxml.AlignmentSpec]) -> dict:
    if alignment is None:
        return {
            "horizontal": None,
            "vertical": None,
            "wrap_text": False,
            "text_rotation": None,
            "indent": None,
            "shrink_to_fit": False,
        }
    return {
        "horizontal": alignment.horizontal,
        "vertical": alignment.vertical,
        "wrap_text": alignment.wrap_text,
        "text_rotation": alignment.text_rotation,
        "indent": alignment.indent,
        "shrink_to_fit": alignment.shrink_to_fit,
    }


def normalize_protection(protection: Optional[ooxml.ProtectionSpec]) -> dict:
    if protection is None:
        return {"locked": True, "hidden": False}
    return {"locked": protection.locked, "hidden": protection.hidden}


class StyleResolver:
    """cellXfsインデックス -> 正規化xf・fingerprint を解決するキャッシュ付きリゾルバ。"""

    def __init__(self, styles: ooxml.StylesTable, theme_colors: list[str]) -> None:
        self.styles = styles
        self.theme_colors = theme_colors
        self._cache: dict[int, dict] = {}
        self._fingerprint_cache: dict[int, str] = {}

    def _xf(self, xf_id: int) -> ooxml.CellXfSpec:
        if 0 <= xf_id < len(self.styles.cell_xfs):
            return self.styles.cell_xfs[xf_id]
        # xf_id 0 must always exist in a valid workbook; degrade gracefully.
        return ooxml.CellXfSpec(
            num_fmt_id=0,
            font_id=0,
            fill_id=0,
            border_id=0,
            apply_number_format=False,
            apply_font=False,
            apply_fill=False,
            apply_border=False,
            apply_alignment=False,
            apply_protection=False,
            alignment=None,
            protection=None,
            quote_prefix=False,
        )

    def normalized_xf(self, xf_id: int) -> dict:
        if xf_id in self._cache:
            return self._cache[xf_id]
        xf = self._xf(xf_id)
        font = self.styles.fonts[xf.font_id] if 0 <= xf.font_id < len(self.styles.fonts) else None
        fill = self.styles.fills[xf.fill_id] if 0 <= xf.fill_id < len(self.styles.fills) else None
        border = self.styles.borders[xf.border_id] if 0 <= xf.border_id < len(self.styles.borders) else None
        num_fmt_code = self.styles.num_fmts.get(xf.num_fmt_id)
        result = {
            "num_fmt_id": xf.num_fmt_id,
            "num_fmt_code": num_fmt_code,
            "font": normalize_font(font, self.theme_colors),
            "fill": normalize_fill(fill, self.theme_colors),
            "border": normalize_border(border, self.theme_colors),
            "alignment": normalize_alignment(xf.alignment),
            "protection": normalize_protection(xf.protection),
            "quote_prefix": xf.quote_prefix,
        }
        self._cache[xf_id] = result
        return result

    def fingerprint(self, xf_id: int) -> str:
        if xf_id in self._fingerprint_cache:
            return self._fingerprint_cache[xf_id]
        normalized = self.normalized_xf(xf_id)
        canonical_json = json.dumps(normalized, sort_keys=True, ensure_ascii=True)
        fp = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        self._fingerprint_cache[xf_id] = fp
        return fp

    def font_strike(self, xf_id: int) -> bool:
        xf = self._xf(xf_id)
        font = self.styles.fonts[xf.font_id] if 0 <= xf.font_id < len(self.styles.fonts) else None
        return bool(font and font.strike)

    def font_bold(self, xf_id: int) -> bool:
        xf = self._xf(xf_id)
        font = self.styles.fonts[xf.font_id] if 0 <= xf.font_id < len(self.styles.fonts) else None
        return bool(font and font.bold)

    def fill_color_hex(self, xf_id: int) -> Optional[str]:
        xf = self._xf(xf_id)
        fill = self.styles.fills[xf.fill_id] if 0 <= xf.fill_id < len(self.styles.fills) else None
        if fill is None or fill.pattern_type in (None, "none"):
            return None
        resolved = ooxml.resolve_color(fill.fg_color, self.theme_colors)
        return resolved["hex"]
