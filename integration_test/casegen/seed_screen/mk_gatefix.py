#!/usr/bin/env python3
"""検査の不合格を直す依頼文を標準出力へ。 mk_gatefix.py <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
print((G / "GATEFIX_PROMPT.md").read_text(encoding="utf-8").replace("{FIDC}", sys.argv[1].replace("-", "")).replace("{FID}", sys.argv[1]))
