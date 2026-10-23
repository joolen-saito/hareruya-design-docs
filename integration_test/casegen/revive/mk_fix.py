#!/usr/bin/env python3
"""codex の指摘（review/R<巡>_*_out.txt）を担当ごとに切り出し、直しの依頼文を作る。 mk_fix.py <巡>
→ review/<機能ID>_<担当>_R<巡>_findings.md・prompts/fix_R<巡>_<機能ID>_<担当>.md

見出し「### 指摘（<機能ID> / <テストID または シードID>）」で切り、テストIDの番号（シードIDは末尾の3桁、無ければ書いた担当のファイル）で担当を決める。
共通の環境シードへの指摘は review/shared_R<巡>.md に集める（依頼元が捌く）。
"""
import collections, csv, glob, pathlib, re, sys

R = pathlib.Path(__file__).resolve().parent
rnd = sys.argv[1]
parts = list(csv.DictReader(open(R / "parts.tsv", encoding="utf-8"), delimiter="\t"))
shared = {l.split("\t", 1)[0] for p in glob.glob(str(R / "cases/*_rv_shared_seeds.tsv")) for l in open(p, encoding="utf-8").read().split("\n")[1:] if l}
seed_part = {}
for p in glob.glob(str(R / "cases/*_rv_seed_data.tsv")):
    nm = pathlib.Path(p).name.split("_")
    for l in open(p, encoding="utf-8").read().split("\n")[1:]:
        if l:
            seed_part[l.split("\t", 1)[0]] = nm[1]


def part_of(fid, ref):
    m = re.search(r"-(\d{3})$", ref)
    if ref.startswith("S-") and ref in seed_part:
        return seed_part[ref]
    if m:
        n = int(m.group(1))
        for p in parts:
            if p["機能ID"] == fid and int(p["開始"]) <= n <= int(p["終了"]):
                return p["担当"]
    return None


found, sh = collections.defaultdict(list), []
for p in sorted(glob.glob(str(R / f"review/R{rnd}_*_out.txt"))):
    ls = pathlib.Path(p).read_text(encoding="utf-8").split("\n")
    st = max(i for i, l in enumerate(ls) if l.strip() == "codex")
    en = next((i for i in range(st, len(ls)) if ls[i].startswith("tokens used")), len(ls))
    for blk in re.split(r"(?=^### 指摘)", "\n".join(ls[st + 1:en]), flags=re.M):
        m = re.match(r"### 指摘（([A-Z]\d\d-\d\d)\s*/\s*([^）\s]+)", blk)
        if not m:
            continue
        fid, ref = m.group(1), m.group(2)
        if ref in shared:
            sh.append(blk.strip()); continue
        pt = part_of(fid, ref)
        if pt is None:
            sh.append(blk.strip()); continue
        found[(fid, pt)].append(blk.strip())
tpl = (R / "FIX_PROMPT.md").read_text(encoding="utf-8")
for (f, pt), bs in sorted(found.items()):
    (R / f"review/{f}_{pt}_R{rnd}_findings.md").write_text("\n\n".join(bs) + "\n", encoding="utf-8")
    s = tpl.replace("{FID}", f).replace("{PART}", pt).replace("{ROUND}", rnd).replace("{EXTRA}", "")
    (R / f"prompts/fix_R{rnd}_{f}_{pt}.md").write_text(s, encoding="utf-8")
(R / f"review/shared_R{rnd}.md").write_text("\n\n".join(sh) + "\n", encoding="utf-8")
print({f"{f}_{p}": len(b) for (f, p), b in sorted(found.items())}, "共通・担当不明:", len(sh))
