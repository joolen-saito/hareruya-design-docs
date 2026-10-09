#!/usr/bin/env python3
"""指摘反映の依頼文を標準出力へ。 mk_fix.py <巡> <機能ID>"""
import pathlib, sys
G = pathlib.Path(__file__).resolve().parent
r, fid = sys.argv[1], sys.argv[2]
prev = "" if r == "1" else f"4. 1巡目の指摘と自分の処置: `nosheet/review/{fid}_r1_findings.md`・`{fid}_r1_dispositions.md`\n"
print((G / "FIX_BRIEF.md").read_text(encoding="utf-8").replace("{FID}", fid).replace("{R}", r).replace("{PREV}", prev))
