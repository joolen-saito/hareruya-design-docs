#!/usr/bin/env python3
"""codex の指摘（review/R<巡>_*_out.txt）を機能ごとに切り出し、直しの依頼文を作る。 mk_fix.py <巡>  → review/<機能ID>_R<巡>_findings.md・prompts/fix_R<巡>_<機能ID>.md

指摘の見出し「### 指摘（<機能ID> / …）」で切る。codex の出力は最後の「codex」の行から「tokens used」の行までを本文とみなす。
前提条件の検査の不合格（review/<機能ID>_gate.txt）がある機能も依頼文を作る。依頼元が機能ごとに足す指示は extra.tsv（機能ID・指示）に書く。
"""
import collections, csv, glob, pathlib, re, sys

G = pathlib.Path(__file__).resolve().parent
rnd = sys.argv[1]
found = collections.defaultdict(list)
for p in sorted(glob.glob(str(G / f"review/R{rnd}_*_out.txt"))):
    ls = pathlib.Path(p).read_text(encoding="utf-8").split("\n")
    st = max(i for i, l in enumerate(ls) if l.strip() == "codex")
    en = next((i for i in range(st, len(ls)) if ls[i].startswith("tokens used")), len(ls))
    body = "\n".join(ls[st + 1:en])
    for blk in re.split(r"(?=^### 指摘)", body, flags=re.M):
        m = re.match(r"### 指摘（([A-Z]\d\d-\d\d)", blk)
        if m:
            found[m.group(1)].append(blk.strip())
extra = {}
if (G / "extra.tsv").exists():
    for r in csv.DictReader(open(G / "extra.tsv", encoding="utf-8"), delimiter="\t"):
        extra.setdefault(r["機能ID"], []).append(r["指示"])
gates = {pathlib.Path(p).name[:6] for p in glob.glob(str(G / "review/[A-Z][0-9][0-9]-[0-9][0-9]_gate.txt"))}
tpl = (G / "FIX_PROMPT.md").read_text(encoding="utf-8")
fids = sorted(set(found) | gates | set(extra))
for f in fids:
    if found.get(f):
        (G / f"review/{f}_R{rnd}_findings.md").write_text("\n\n".join(found[f]) + "\n", encoding="utf-8")
    ex = "\n".join(f"3. 依頼元から: {x}" for x in extra.get(f, []))
    s = tpl.replace("{FID}", f).replace("{ROUND}", rnd).replace("{EXTRA}", ex)
    (G / f"prompts/fix_R{rnd}_{f}.md").write_text(s, encoding="utf-8")
print(len(fids), "機能", {f: len(found.get(f, [])) for f in fids}, "G5:", sorted(gates))
