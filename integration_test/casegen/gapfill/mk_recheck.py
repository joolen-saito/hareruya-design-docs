#!/usr/bin/env python3
"""再監査の依頼文を標準出力へ。 mk_recheck.py <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
print((G / "RECHECK_PROMPT.md").read_text(encoding="utf-8").replace("{FID}", sys.argv[1]))
