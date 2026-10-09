#!/usr/bin/env python3
"""codex の出力（束）から最終回答を取り出し、機能ごとの findings に割る。 extract.py <巡>
→ <機能ID>_r<巡>_findings.md（指摘のある機能だけ）。指摘の無い機能は作らない。"""
import glob, pathlib, re, sys, collections
rnd = sys.argv[1]
for p in glob.glob(f"*_r{rnd}_findings.md"):
    pathlib.Path(p).unlink()
by, bad = collections.defaultdict(list), []
for p in sorted(glob.glob(f"R{rnd}_*_out.txt")):
    s = open(p, encoding="utf-8", errors="replace").read()
    if "tokens used" not in s:
        bad.append(p); continue
    fin = s[s.rfind("\ncodex\n") + 7:]
    fin = re.split(r"\n(?:\[[^\]]*\] )?tokens used", fin)[0]
    for blk in re.split(r"(?m)^(?=### 指摘)", fin):
        m = re.match(r"### 指摘[（(]\s*([A-Z]\d\d-\d\d)", blk)
        if m:
            by[m.group(1)].append(blk.strip())
        elif blk.strip().startswith("### 指摘"):
            bad.append(p + ": 機能IDを読めない指摘 " + blk[:60].replace("\n", " "))
for f, bl in by.items():
    pathlib.Path(f"{f}_r{rnd}_findings.md").write_text("\n\n".join(bl) + "\n", encoding="utf-8")
print(len(by), "機能", sum(len(v) for v in by.values()), "件", bad)
