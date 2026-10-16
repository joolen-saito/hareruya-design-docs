#!/usr/bin/env python3
"""design.txt の各行に出所（Excel由来か、埋め込みの機能設計書か）を付ける。 prov.py <出力先> <機能ID>...
build_units.py と同じ起こし方で、埋め込み区間の前後に目印の行を挟んで起こし、design.txt と1行ずつ一致することを確かめる。"""
import sys, re, glob, pathlib, csv, collections, importlib.util
DP = pathlib.Path("/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/datapattern")
ROOT = DP.parents[2]
src = (DP / "build_units.py").read_text(encoding="utf-8").replace("\nmain()\n", "\n")
ns = {"__file__": str(DP / "build_units.py")}
exec(compile(src, "build_units", "exec"), ns)
to_text = ns["to_text"]
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
want = set(sys.argv[2:])

def mark(sec):
    # function-design-embed の区間を、対応する </section> まで深さを数えて目印で囲む
    out, i = [], 0
    for m in re.finditer(r'<section class="function-design-embed"[^>]*data-source="([^"]+)"[^>]*>', sec):
        if m.start() < i:
            continue
        depth, j = 1, m.end()
        for t in re.finditer(r"<section\b|</section>", sec[m.end():]):
            depth += 1 if t.group(0).startswith("<section") else -1
            if depth == 0:
                j = m.end() + t.end(); break
        out.append(sec[i:m.start()]); out.append(f"<p>§EMB {m.group(1)}§</p>"); out.append(sec[m.start():j]); out.append("<p>§END§</p>")
        i = j
    out.append(sec[i:])
    return "".join(out)

fmap = collections.defaultdict(list)
for r in csv.DictReader(open(ROOT / "functions/function-sheet-map.tsv", encoding="utf-8"), delimiter="\t"):
    if r["状態"] in ("確定", "候補") and r["シートID"]:
        fmap[(r["ブック"], r["シートID"])].append((r["機能No"], r["状態"]))
sheets = collections.defaultdict(list)
for path in sorted(glob.glob(str(ROOT / "excel_to_html/output/0*.html"))):
    if "詳細設計" in path:
        continue
    book = pathlib.Path(path).name[:4]
    s = open(path, encoding="utf-8").read()
    secs = re.split(r'(?=<section class="sheet-panel(?: is-active)?" id="sheet-\d+")', s)[1:]
    doc = not secs
    if doc:
        secs = re.split(r'(?=<section class="doc-section" id="[^"]+")', s)[1:]
    for sec in secs:
        sid = re.search(r'id="([^"]+)"', sec).group(1)
        m = re.search(r'class="sheet-heading"[^>]*>\s*(?:<h2[^>]*>)?(.*?)</h2>', sec, re.S) or re.search(r"<h[12][^>]*>(.*?)</h[12]>", sec, re.S)
        import html as H
        name = H.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else "?"
        if name in ("表紙", "目次"):
            continue
        fids = [(sid.upper(), "確定")] if doc else fmap.get((book, sid), [])
        conf = list(dict.fromkeys([f for f, st in fids if st == "確定"] or [f for f, st in fids]))
        for f in conf:
            if f in want:
                sheets[f].append((book, sid, name, path, to_text(mark(sec))))
for f in sorted(want):
    rows, n, cur = [], 0, "Excel"
    for book, sid, name, path, lines in sheets.get(f, []):
        rows.append(f"##### {book} {sid} {name}\t{pathlib.Path(path).name}\n")
        cur = "Excel"
        for l in lines:
            m = re.fullmatch(r"§EMB (.+)§", l)
            if m:
                cur = "埋め込み " + m.group(1); continue
            if l == "§END§":
                cur = "Excel"; continue
            n += 1
            rows.append(f"L{n:04d}\t{cur}\t{l}\n")
    ref = [l for l in open(DP / f"units/{f}/design.txt", encoding="utf-8") if l.startswith("L")]
    got = [l for l in rows if l.startswith("L")]
    ok = len(ref) == len(got) and all(a.split("\t", 1)[1] == b.split("\t", 2)[2] for a, b in zip(ref, got))
    (OUT / f"{f}.tsv").write_text("".join(rows), encoding="utf-8")
    print(f, len(got), "一致" if ok else f"不一致 design.txt={len(ref)}")
