"""業務フローの Excel を直接読み、パターン・工程・判断の分かれ道を取り出す（書き起こしの md とは別に読む）。

scenario_test/markdown/NN_*.md（tools/xlsx_to_md.py の書き起こし）が Excel のとおりかを確かめるための、独立した読み取り。
xlsx_to_md.py のコードは使わない（同じ読み違いを重ねないため）。

取り出すもの（シートごと）
  patterns   業務フローパターンの表（番号・名前）。「業務フローパターン」の行から「参考マニュアル」「アクター」の前まで
  steps      工程の # 列の値（スイムレーン見出し「＃」の行より下）
  decisions  図形の「判断」（prstGeom=flowChartDecision・diamond）と、その判断から出る矢印の行き先の図形の文字

使い方
  python3 -I tools/flow_from_xlsx.py dump [md番号 ...]     取り出した内容を TSV で出す
"""
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]  # scenario_test
MD = ROOT / "markdown"
XLSX = {"在庫": ROOT / "在庫に関連する_業務一覧_業務フロー.xlsx", "02": ROOT / "02_業務一覧_業務フロー.xlsx"}
NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}
# 判断の図形：フローチャートの判断と、ひし形（商品登録・編集の 09・10 はひし形で描かれている。2026-11-20 照合で気づいた）
DECISION = {"flowChartDecision", "diamond"}
FLOW_MD = ["05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18"]


def md_source(no):
    """md番号 → (Excel の区分, シート名)。md の1行目「# シート名　（出典: 在庫ファイル）」から"""
    f = next(MD.glob(f"{no}_*.md"))
    m = re.match(r"# (.+?)　（出典: (在庫|02)ファイル）", f.read_text(encoding="utf-8").splitlines()[0])
    return m.group(2), m.group(1)


def _sheet_paths(z):
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid = {r.get("Id"): r.get("Target") for r in rels}
    out = {}
    for s in wb.find("m:sheets", NS):
        t = rid[s.get(f"{{{NS['r']}}}id")].lstrip("/")
        out[s.get("name")] = t if t.startswith("xl/") else "xl/" + t
    return out


def _shared(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    return [_si_text(si) for si in sst.findall("m:si", NS)]


def _si_text(si):
    """文字列の本文だけ。ふりがな（rPh）は読まない"""
    out = []
    for ch in si:
        tag = ch.tag.split("}")[1]
        if tag == "t":
            out.append(ch.text or "")
        elif tag == "r":
            out += [t.text or "" for t in ch.findall("m:t", NS)]
    return "".join(out)


def _cells(z, path, sst):
    """(行, 列) → 文字。列は1始まり"""
    ws = ET.fromstring(z.read(path))
    out = {}
    for c in ws.iter(f"{{{NS['m']}}}c"):
        ref = c.get("r")
        m = re.match(r"([A-Z]+)(\d+)", ref)
        col = 0
        for ch in m.group(1):
            col = col * 26 + ord(ch) - 64
        row = int(m.group(2))
        t = c.get("t")
        v = c.find("m:v", NS)
        if t == "s" and v is not None:
            val = sst[int(v.text)]
        elif t == "inlineStr":
            isel = c.find("m:is", NS)
            val = _si_text(isel) if isel is not None else ""
        else:
            val = v.text if v is not None else ""
        if val is not None and str(val).strip() != "":
            out[(row, col)] = str(val).strip()
    return out


def _drawing(z, sheet_path):
    rel = sheet_path.replace("worksheets/", "worksheets/_rels/") + ".rels"
    if rel not in z.namelist():
        return None
    for r in ET.fromstring(z.read(rel)):
        if "drawing" in r.get("Type", ""):
            t = r.get("Target")
            return "xl/" + t.replace("../", "") if not t.startswith("/") else t.lstrip("/")
    return None


def _text(el):
    return re.sub(r"\s+", "", "".join(t.text or "" for t in el.iter(f"{{{NS['a']}}}t")))


def _shapes(z, dpath):
    """図形 id → (種類, 文字, 行)、矢印の (始点id, 終点id)。グループの中も見る"""
    root = ET.fromstring(z.read(dpath))
    shapes, conns = {}, []
    for anc in list(root):
        frm = anc.find("xdr:from", NS)
        row = int(frm.find("xdr:row", NS).text) + 1 if frm is not None else 0
        col = int(frm.find("xdr:col", NS).text) + 1 if frm is not None else 0
        for sp in anc.iter(f"{{{NS['xdr']}}}sp"):
            nv = sp.find("xdr:nvSpPr/xdr:cNvPr", NS)
            geom = sp.find("xdr:spPr/a:prstGeom", NS)
            shapes[nv.get("id")] = (geom.get("prst") if geom is not None else "", _text(sp), row, col)
        for cx in anc.iter(f"{{{NS['xdr']}}}cxnSp"):
            st = cx.find("xdr:nvCxnSpPr/xdr:cNvCxnSpPr/a:stCxn", NS)
            en = cx.find("xdr:nvCxnSpPr/xdr:cNvCxnSpPr/a:endCxn", NS)
            ln = cx.find("xdr:spPr/a:ln/a:prstDash", NS)
            conns.append((st.get("id") if st is not None else None, en.get("id") if en is not None else None,
                          ln.get("val") if ln is not None else "solid"))
    return shapes, conns


def read_flow(no):
    src, sheet = md_source(no)
    z = zipfile.ZipFile(XLSX[src])
    paths = _sheet_paths(z)
    path = paths[sheet]
    cells = _cells(z, path, _shared(z))
    rows = sorted({r for r, _ in cells})
    # 業務フローパターンの表
    patterns, on = [], False
    for r in rows:
        line = [cells[(r, c)] for c in sorted(c for rr, c in cells if rr == r)]
        if any("業務フローパターン" == v for v in line):
            on = True
            continue
        if on and any(v.startswith(("参考マニュアル", "アクター")) for v in line):
            break
        if on and line and re.fullmatch(r"\d+", line[0]) and len(line) >= 2:
            patterns.append((line[0], line[1]))
    # 工程：スイムレーン見出し（「＃」と「作業概要」が並ぶ行のうち、アクターの行より下のもの）
    head = None
    seen_actor = False
    for r in rows:
        line = [cells[(r, c)] for c in sorted(c for rr, c in cells if rr == r)]
        if "アクター" in line:
            seen_actor = True
        if seen_actor and "＃" in line and "作業概要" in line:
            head = r
            hcol = next(c for rr, c in cells if rr == r and cells[(rr, c)] == "＃")
            break
    steps = []
    if head:
        for r in rows:
            if r > head and (r, hcol) in cells:
                steps.append((r, cells[(r, hcol)]))
    # 判断の分かれ道
    decisions = []
    shapes, conns = {}, []
    dpath = _drawing(z, path)
    if dpath:
        shapes, conns = _shapes(z, dpath)
        for sid, (prst, text, row, col) in shapes.items():
            if prst not in DECISION:
                continue
            outs = [shapes[e][1] if e in shapes else "(自由端)" for s, e, dash in conns if s == sid and dash == "solid"]
            out_shapes = [dict(text=shapes[e][1], row=shapes[e][2], col=shapes[e][3]) if e in shapes else dict(text="(自由端)", row=0, col=0)
                          for s, e, dash in conns if s == sid and dash == "solid"]
            ins = [shapes[s][1] if s in shapes else "(自由端)" for s, e, dash in conns if e == sid and dash == "solid"]
            decisions.append(dict(id=sid, text=text, row=row, col=col, outs=outs, ins=ins, out_shapes=out_shapes))
        decisions.sort(key=lambda d: (d["row"], d["id"]))
    # システムのレーン：「アクター」の行で「システム」と書かれた列から右
    syscol = None
    for (r, c), v in cells.items():
        if v == "システム" and any(cells.get((r, cc)) == "アクター" for cc in range(1, c)):
            syscol = c
    lanes = {}
    if head:
        lanes = {c: re.sub(r"\s+", "", cells[(head, c)]) for rr, c in cells if rr == head}
    return dict(src=src, sheet=sheet, patterns=patterns, steps=steps, decisions=decisions,
                shapes=shapes, conns=conns, syscol=syscol, head=head, lanes=lanes)


def main():
    if len(sys.argv) < 2 or sys.argv[1] != "dump":
        sys.exit(__doc__)
    for no in sys.argv[2:] or FLOW_MD:
        f = read_flow(no)
        for n, name in f["patterns"]:
            print(f"{no}\t{f['sheet']}\tパターン\t{n}\t{name}")
        for r, s in f["steps"]:
            print(f"{no}\t{f['sheet']}\t工程\tR{r}\t{s}")
        for d in f["decisions"]:
            print(f"{no}\t{f['sheet']}\t判断\tR{d['row']}\t{d['text']}\t入:{'／'.join(d['ins'])}\t出:{'／'.join(d['outs'])}")


if __name__ == "__main__":
    main()
