#!/usr/bin/env python3
"""Compatibility wrapper for the current function spec HTML integration script."""

from __future__ import annotations

import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".cursor" / "skills" / "function-spec-html-render" / "scripts" / "integrate_function_docs_into_excel_html.py"


if __name__ == "__main__":
    runpy.run_path(str(SCRIPT), run_name="__main__")
