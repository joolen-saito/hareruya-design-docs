#!/usr/bin/env python3
"""依頼文を標準出力へ。 mk.py <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
print((G / "RESOLVE_PROMPT.md").read_text(encoding="utf-8").replace("{FID}", sys.argv[1]))
