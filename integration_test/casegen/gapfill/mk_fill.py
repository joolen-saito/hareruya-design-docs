#!/usr/bin/env python3
"""再監査の指摘反映の依頼文を標準出力へ。 mk_fill.py <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
print((G / "FILL_BRIEF.md").read_text(encoding="utf-8").replace("{FID}", sys.argv[1]))
