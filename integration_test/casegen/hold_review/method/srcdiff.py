"""保留ケースを持つ機能ごとに、生成時(bd3c89a5)と最新の出典テキストを比べる。"""
import csv, glob, re, sys, pathlib, difflib, collections, json
NEW = pathlib.Path('/home/y-saito/Developments/hareruya-design-docs')
OLD = pathlib.Path(sys.argv[1])
def sources(root, fid):
    parts = []
    for p in sorted(glob.glob(str(root / f"functions/*/{fid.lower()}_*.md"))):
        if "_archive" not in p:
            parts.append(open(p, encoding="utf-8").read())
    for r in csv.DictReader((root / "functions/function-sheet-map.tsv").open(encoding="utf-8"), delimiter="\t"):
        if r["機能No"].strip() != fid or r["状態"].strip() != "確定":
            continue
        for p in sorted(glob.glob(str(root / f"excel_to_html/output/{r['ブック'].strip()}_*.html"))):
            h = open(p, encoding="utf-8", errors="ignore").read()
            m = re.search(rf'id="{r["シートID"].strip()}"', h)
            if not m: continue
            n = re.search(r'id="sheet-\d+"', h[m.end():])
            t = re.sub(r"<[^>]+>", "\n", h[m.start(): (m.end() + n.start()) if n else len(h)])
            parts.append(t)
    lines = [re.sub(r"\s+", " ", l).strip() for l in "\n".join(parts).split("\n")]
    return [l for l in lines if l]
rows = [l.rstrip("\n").split("\t") for l in open(NEW/"integration_test/casegen/all_test_cases.tsv", encoding="utf-8")][1:]
hold = collections.Counter("-".join(r[0].split("-")[1:3]) for r in rows if r[5] == "保留")
out = {}
for fid in sorted(hold):
    a, b = sources(OLD, fid), sources(NEW, fid)
    sa, sb = set(a), set(b)
    add = [l for l in b if l not in sa]; rem = [l for l in a if l not in sb]
    out[fid] = {"hold": hold[fid], "added": add, "removed": rem, "old_lines": len(a), "new_lines": len(b)}
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
ch = {k: v for k, v in out.items() if v["added"] or v["removed"]}
print("funcs", len(out), "changed", len(ch), "holds in changed", sum(v["hold"] for v in ch.values()))
for k, v in ch.items(): print(k, v["hold"], "+", len(v["added"]), "-", len(v["removed"]))
empty = [k for k, v in out.items() if v["new_lines"] == 0]; print("no source", empty)
