#!/usr/bin/env python3
"""extract_findings.py <群> <巡>: review/<群>_r<巡>_out.txt の最終回答だけを <群>_r<巡>_findings.md に書き、件数を出す。"""
import sys, pathlib
P = pathlib.Path(__file__).resolve().parent / "review"
c, r = sys.argv[1], sys.argv[2]
# 完了は review.sh が書く進捗ログで判定する（2巡目は前の巡の出力を読むので、出力中の "tokens used" は当てにならない）
log = P / f"progress_r{r}.log"
if not (log.exists() and f" done {c}\n" in log.read_text(encoding="utf-8")):
    print(c, "未完了"); sys.exit(0)
s = (P / f"{c}_r{r}_out.txt").read_text(encoding="utf-8")
i = s.rfind("\ncodex\n")
t = s[i + 7:] if i >= 0 else s
t = t[: t.rfind("tokens used")]
(P / f"{c}_r{r}_findings.md").write_text(t, encoding="utf-8")
print(c, "指摘", t.count("### 指摘"), "NONE" if t.strip().startswith("NONE") else "")
