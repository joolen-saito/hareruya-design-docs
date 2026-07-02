#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xlsx_to_md.py — 業務フローExcel(セル＋図形)をMarkdownに書き起こす。

環境に openpyxl / pandas / pip が無いため、標準ライブラリ(zipfile + re)のみで
xlsx(zip+XML)を直接パースする。

抽出するもの:
  1. セル: 上部の索引表・補足表（sharedStrings をふりがな(rPh)除外で解決）
  2. 図形(drawing): スイムレーン型フロー図の処理ボックス＋コネクタ(矢印)
     - ノード: prstGeom 種別・テキスト・アンカー位置(行,列)
     - 遷移: コネクタの stCxn/endCxn(接続先shape id) と 実線/点線 を業務フロー線/データ遷移線として復元

使い方:
  python3 xlsx_to_md.py <xlsx> "<シート名>"            # 1シートをmd出力(stdout)
  python3 xlsx_to_md.py --list <xlsx>                   # シート一覧
"""
import zipfile, re, sys

NS_MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

# ---- shared strings (ふりがな rPh を除外) -------------------------------------
def load_shared(z):
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    except KeyError:
        return []
    out = []
    for si in root:
        parts = []
        # <si> 直下の <t> か、<r><t> を拾う。<rPh>(ふりがな) は無視する。
        for child in si:
            tag = child.tag.split('}')[-1]
            if tag == 't':
                parts.append(child.text or '')
            elif tag == 'r':
                t = child.find(NS_MAIN + 't')
                if t is not None:
                    parts.append(t.text or '')
            # rPh はスキップ
        out.append(''.join(parts))
    return out

# ---- workbook → シート名と worksheet target ---------------------------------
def workbook_sheets(z):
    wb = z.read('xl/workbook.xml').decode('utf-8')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
    relmap = {}
    for m in re.finditer(r'<Relationship ([^>]+)/>', rels):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        relmap[a['Id']] = a['Target']
    res = []
    for m in re.finditer(r'<sheet ([^>]+)/>', wb):
        a = dict(re.findall(r'([\w:]+)="([^"]*)"', m.group(1)))
        res.append((a.get('name'), relmap.get(a.get('r:id'))))
    return res

def col_to_num(col):
    n = 0
    for c in col:
        n = n * 26 + (ord(c) - 64)
    return n

EMU_PER_CHAR = 7 * 9525  # 列幅(文字)→EMU: 最大数字幅7px × 9525EMU/px

def column_geometry(z, target, ncols=64):
    """worksheet の <cols>/<sheetFormatPr> から各列(1始)の左端EMU位置を算出。
    非表示列(hidden)は表示幅0として扱う（drawingの絶対座標系に合わせる）。
    返り値: left_emu[c] (c=1..ncols+1 の累積左端)。"""
    import xml.etree.ElementTree as ET
    x = z.read('xl/' + target).decode('utf-8')
    m = re.search(r'<sheetFormatPr[^>]*defaultColWidth="([\d.]+)"', x)
    default_w = float(m.group(1)) if m else 8.43
    width = {}
    hidden = set()
    for cm in re.finditer(r'<col ([^>]+)/>', x):
        a = dict(re.findall(r'(\w+)="([^"]*)"', cm.group(1)))
        lo, hi = int(a.get('min', 1)), int(a.get('max', 1))
        w = float(a.get('width', default_w))
        h = a.get('hidden') == '1'
        for c in range(lo, min(hi, ncols) + 1):
            width[c] = w
            if h:
                hidden.add(c)
    left = {1: 0.0}
    for c in range(1, ncols + 1):
        w = 0.0 if c in hidden else width.get(c, default_w)
        left[c + 1] = left[c] + w * EMU_PER_CHAR
    return left

def assign_lane_by_emu(center_x, lane, left):
    """ボックス中心X(EMU)を、レーン見出し列の中心に最も近い列へ割当て。"""
    if center_x is None or not lane:
        return None
    best, bestd = None, None
    for c in lane:
        if c + 1 not in left:
            continue
        cx = (left[c] + left[c + 1]) / 2
        d = abs(center_x - cx)
        if bestd is None or d < bestd:
            bestd, best = d, c
    return lane.get(best) if best is not None else None

# ---- セル抽出 ----------------------------------------------------------------
def extract_cells(z, target, shared):
    import xml.etree.ElementTree as ET
    root = ET.fromstring(z.read('xl/' + target))
    cells = {}
    for c in root.iter(NS_MAIN + 'c'):
        ref = c.get('r')
        if not ref:
            continue
        m = re.match(r'([A-Z]+)(\d+)', ref)
        col = col_to_num(m.group(1)); row = int(m.group(2))
        t = c.get('t')
        v = c.find(NS_MAIN + 'v')
        isn = c.find(NS_MAIN + 'is')
        val = None
        if t == 's' and v is not None:
            try:
                val = shared[int(v.text)]
            except (ValueError, IndexError):
                val = None
        elif t == 'inlineStr' and isn is not None:
            val = ''.join(x.text or '' for x in isn.iter(NS_MAIN + 't'))
        elif v is not None:
            val = v.text
        if val is not None and str(val).strip() != '':
            cells[(row, col)] = str(val).replace('\n', ' / ')
    return cells

def detect_lane_header(cells):
    """スイムレーンの実行主体(アクター/システム)ヘッダ行を推定し、{列: ラベル} を返す。
    列>=3 で非空セルが最も多い行をヘッダ行とみなす（例: '＃|作業概要|お客様|店舗|...'）。"""
    rows = sorted(set(r for r, _ in cells))
    best_row, best_cnt = None, 0
    for r in rows:
        cnt = sum(1 for (rr, c), v in cells.items() if rr == r and c >= 3 and v.strip())
        if cnt > best_cnt:
            best_cnt, best_row = cnt, r
    if best_row is None or best_cnt < 3:
        return {}, None
    lane = {c: cells[(best_row, c)] for (rr, c), _ in cells.items()
            if rr == best_row and cells[(best_row, c)].strip()}
    return lane, best_row

def cells_to_records(cells, lane, lane_row=None):
    """空列だらけの広い表を、行ごとに非空セルだけ列挙する可読形式へ。
    スイムレーン見出し行(lane_row)以降のみ列ラベルを併記する
    （上部の索引表・マニュアル表には実行主体ラベルを付けない）。"""
    if not cells:
        return '_（セルデータなし）_'
    rows = sorted(set(r for r, _ in cells))
    out = []
    for r in rows:
        use_lane = lane_row is not None and r >= lane_row
        parts = []
        for c in sorted(c for (rr, c) in cells if rr == r):
            v = cells[(r, c)].replace('|', '\\|').strip()
            if not v:
                continue
            label = lane.get(c) if use_lane else None
            if label and label.strip() != v:
                parts.append(f'**[{label.replace(chr(10)," ")}]** {v}')
            else:
                parts.append(v)
        if parts:
            out.append(f'- **R{r}**: ' + '　｜　'.join(parts))
    return '\n'.join(out)

# ---- 図形(drawing)抽出 -------------------------------------------------------
GEOM_JA = {
    'flowChartManualOperation': '手作業',
    'flowChartMagneticDisk': 'データ/DB',
    'flowChartDocument': '帳票/書類',
    'flowChartPredefinedProcess': '定義済み処理(サブフロー)',
    'flowChartDecision': '判断',
    'flowChartProcess': '処理',
    'flowChartTerminator': '開始/終了',
    'flowChartInputOutput': '入出力',
    'rect': '処理/ラベル',
    'roundRect': '処理/ラベル',
    'wedgeRoundRectCallout': '注釈(吹き出し)',
    'wedgeRectCallout': '注釈(吹き出し)',
}

def find_drawing_target(z, target):
    """worksheet target(例 worksheets/sheet8.xml) から対応する drawing パスを返す。"""
    base = target.split('/')[-1]                       # sheet8.xml
    relpath = 'xl/worksheets/_rels/' + base + '.rels'
    try:
        rels = z.read(relpath).decode('utf-8')
    except KeyError:
        return None
    for m in re.finditer(r'<Relationship ([^>]+)/>', rels):
        a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        if 'drawing' in a.get('Type', '') and a.get('Target', '').endswith('.xml'):
            tgt = a['Target'].replace('../', 'xl/')
            return tgt
    return None

def parse_drawing(z, drawing_path):
    """nodes(id->dict), edges(list) を返す。"""
    try:
        x = z.read(drawing_path).decode('utf-8')
    except KeyError:
        return {}, []
    nodes = {}
    edges = []
    for m in re.finditer(r'<xdr:(?:two|one)CellAnchor[^>]*>(.*?)</xdr:(?:two|one)CellAnchor>', x, re.S):
        b = m.group(1)
        fm = re.search(r'<xdr:from><xdr:col>(\d+)</xdr:col>.*?<xdr:row>(\d+)</xdr:row>', b, re.S)
        tm = re.search(r'<xdr:to><xdr:col>(\d+)</xdr:col>.*?<xdr:row>(\d+)</xdr:row>', b, re.S)
        frow = int(fm.group(2)) if fm else -1
        fcol = int(fm.group(1)) if fm else -1
        tcol = int(tm.group(1)) if tm else fcol
        ccol = round((fcol + tcol) / 2) if fcol >= 0 else fcol  # 箱の水平中心列＝レーン推定に使う
        sid_m = re.search(r'<xdr:cNvPr id="(\d+)"', b)
        sid = sid_m.group(1) if sid_m else None
        text = ''.join(re.findall(r'<a:t>([^<]*)</a:t>', b)).strip()
        om = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/><a:ext cx="(\d+)" cy="(\d+)"', b)
        center_x = (int(om.group(1)) + int(om.group(3)) / 2) if om else None
        if '<xdr:cxnSp' in b:
            st = re.search(r'<a:stCxn id="(\d+)"', b)
            en = re.search(r'<a:endCxn id="(\d+)"', b)
            dashed = 'prstDash val="dash"' in b or 'prstDash val="sysDash"' in b
            edges.append({
                'from': st.group(1) if st else None,
                'to': en.group(1) if en else None,
                'kind': 'データ遷移線(点線)' if dashed else '業務フロー線(実線)',
                'frow': frow, 'fcol': fcol,
            })
        else:
            g = re.search(r'prstGeom prst="([^"]+)"', b)
            geom = g.group(1) if g else 'none'
            if sid is not None:
                nodes[sid] = {'geom': geom, 'text': text, 'row': frow,
                              'col': fcol, 'ccol': ccol, 'center_x': center_x}
    return nodes, edges

def drawing_to_md(nodes, edges, lane=None, left=None):
    lane = lane or {}
    left = left or {}
    if not nodes and not edges:
        return '_（図形フローなし）_'
    out = []
    ordered = sorted(nodes.items(), key=lambda kv: (kv[1]['row'], kv[1]['col']))
    # 列0付近の asis/Tobe ラベルをフェーズ区切りとして検出
    phase_markers = {}
    for sid, n in ordered:
        if n['col'] <= 1 and re.fullmatch(r'(asis|as-is|tobe|to-be)', n['text'].strip(), re.I):
            phase_markers[n['row']] = n['text'].strip()
    out.append('### ノード一覧（位置順: 上→下 / 左→右）')
    out.append('図形ボックス＝処理。**実行主体**は配置列をスイムレーン見出しにマップして推定。'
               ' asis/Tobe は現行/将来フェーズの区切り。`*n` は同一レコード参照。')
    out.append('')
    out.append('| # | フェーズ | 実行主体(レーン) | 種別 | テキスト | 位置(行,列) |')
    out.append('|---|---|---|---|---|---|')
    idx_of = {}
    cur_phase = ''
    for i, (sid, n) in enumerate(ordered, 1):
        idx_of[sid] = i
        # フェーズ更新（同じ行以降に適用）
        for mr in sorted(phase_markers):
            if n['row'] >= mr:
                cur_phase = phase_markers[mr]
        geom_ja = GEOM_JA.get(n['geom'], n['geom'])
        txt = (n['text'] or '—').replace('|', '\\|')
        is_divider = n['col'] <= 1 and n['row'] in phase_markers
        if is_divider:
            actor, geom_ja = '—', 'フェーズ区切り'
        else:
            # 第一候補: 絶対座標(EMU)で最寄レーン。取れなければ箱中心列でフォールバック。
            actor = assign_lane_by_emu(n.get('center_x'), lane, left) \
                or lane.get(n.get('ccol', n['col']) + 1, '')
        out.append(f"| {i} | {cur_phase} | {actor} | {geom_ja} | {txt} | ({n['row']},{n['col']}) |")
    # 遷移
    out.append('')
    out.append('### 遷移（コネクタ＝矢印）')
    out.append('')
    if not edges:
        out.append('_（コネクタなし）_')
    else:
        def label(sid):
            if sid in nodes:
                t = nodes[sid]['text'] or '(無題)'
                return f"#{idx_of.get(sid,'?')} {t}"
            return f"id={sid}(接続先不明)" if sid else "(自由端)"
        # 接続が明示されているものを先に、位置順
        named = [e for e in edges if e['from'] or e['to']]
        free = [e for e in edges if not (e['from'] or e['to'])]
        named.sort(key=lambda e: (e['frow'], e['fcol']))
        for e in named:
            out.append(f"- [{e['kind']}] {label(e['from'])} → {label(e['to'])}")
        if free:
            out.append('')
            out.append(f"> 注: 始点/終点shapeに未接続のコネクタが {len(free)} 本あり（図形上の自由配置）。")
    return '\n'.join(out)

# ---- 1シートをMarkdown化 -----------------------------------------------------
def sheet_to_md(z, name, target, shared, source_label=''):
    cells = extract_cells(z, target, shared)
    lane, lane_row = detect_lane_header(cells)
    maxcol = max((c for _, c in cells), default=21)
    left = column_geometry(z, target, ncols=max(maxcol + 2, 30))
    dpath = find_drawing_target(z, target)
    nodes, edges = parse_drawing(z, dpath) if dpath else ({}, [])
    out = []
    title = f'# {name}'
    if source_label:
        title += f'　（出典: {source_label}）'
    out.append(title)
    out.append('')
    out.append(f'- セル: {len(cells)}　/　図形ノード: {len(nodes)}　/　コネクタ: {len(edges)}'
               + (f'　/　drawing: `{dpath}`' if dpath else '　/　drawing: なし'))
    if lane:
        out.append(f'- スイムレーン見出し(R{lane_row}): '
                   + ' ｜ '.join(lane[c].replace('\n', ' ') for c in sorted(lane)))
    out.append('')
    out.append('## 索引表・補足（セル抽出 / 行ごと非空セル）')
    out.append('')
    out.append(cells_to_records(cells, lane, lane_row))
    out.append('')
    out.append('## 業務フロー（図形再構成）')
    out.append('')
    out.append(drawing_to_md(nodes, edges, lane, left))
    out.append('')
    return '\n'.join(out)

def main():
    args = sys.argv[1:]
    if args and args[0] == '--list':
        z = zipfile.ZipFile(args[1])
        for i, (n, t) in enumerate(workbook_sheets(z), 1):
            print(f'{i:2d}. {n}  ->  {t}')
        return
    path, name = args[0], args[1]
    z = zipfile.ZipFile(path)
    shared = load_shared(z)
    for n, t in workbook_sheets(z):
        if n == name:
            print(sheet_to_md(z, n, t, shared))
            return
    sys.stderr.write(f'sheet not found: {name}\n')
    sys.exit(1)

if __name__ == '__main__':
    main()
