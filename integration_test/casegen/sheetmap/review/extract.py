#!/usr/bin/env python3
"""codex の出力から最終回答だけを取り出す。 extract.py <巡> → review/<機能ID>_r<巡>_findings.md"""
import glob, pathlib, re, sys
G = pathlib.Path(__file__).resolve().parent
for p in sorted(glob.glob(str(G / f"*_r{sys.argv[1]}_out.txt"))):
    s = pathlib.Path(p).read_text(encoding="utf-8", errors="replace")
    f = pathlib.Path(p).name.split("_")[0]
    if "tokens used" not in s:
        print(f, "未完了"); continue
    body = s.rsplit("\ncodex\n", 1)[-1]
    body = re.split(r"\ntokens used", body)[0].strip()
    (G / f"{f}_r{sys.argv[1]}_findings.md").write_text(body + "\n", encoding="utf-8")
    print(f, "指摘", len(re.findall(r"^### 指摘", body, re.M)), "NONE" if body.strip() == "NONE" else "")
