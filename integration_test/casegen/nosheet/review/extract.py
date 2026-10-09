#!/usr/bin/env python3
"""codex の出力から最終回答だけを取り出す。 extract.py <巡>  → <機能ID>_r<巡>_findings.md"""
import glob, pathlib, re, sys
for p in sorted(glob.glob(f"*_r{sys.argv[1]}_out.txt")):
    s = open(p, encoding="utf-8", errors="replace").read()
    done = "tokens used" in s
    fin = s[s.rfind("\ncodex\n") + 7:]
    fin = re.split(r"\n(?:\[[^\]]*\] )?tokens used", fin)[0].strip()
    pathlib.Path(p.replace("_out.txt", "_findings.md")).write_text(fin + "\n", encoding="utf-8")
    print(p[:6], "完了" if done else "未完了", "指摘", len(re.findall(r"^### 指摘", fin, re.M)), "NONE" if fin.strip() == "NONE" else "")
