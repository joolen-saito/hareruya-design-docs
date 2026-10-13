#!/usr/bin/env python3
"""依頼文を標準出力へ。 mk.py <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
print((G / "SCREEN_PROMPT.md").read_text(encoding="utf-8").replace("{FIDC}", sys.argv[1].replace("-", "")).replace("{FID}", sys.argv[1]))
