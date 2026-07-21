#!/usr/bin/env python3
"""画面項目定義の抽出器 v2 — ヘッダ駆動の列マッピング（位置固定をやめる）

v1の欠陥（fable5検出・実測で確認）:
  `tds[:7]` の位置固定で読んでいたが、実データは 3/4/5/6/7/8/9/11列 が混在。
  - 7列超 217行を**列ズレのまま読んだ**（例: 0202のCSV定義表は8列
    `識別ID/項目名/主キー/書式・制限/必須/最大文字数/入力例/説明` で、
    fmt に主キーの'○'、req に最大文字数が入るなど全列がずれた）
  - 7列未満 106行を**無言ドロップ**（例: 0212 sheet-4 は5列
    `識別ID/ラベル/書式・制限/入力チェック/説明` で、入力チェック列に
    「プレイヤー名…64文字まで」等の実仕様がある）

v2: 各テーブルの <thead> を読んで列名→インデックスを作り、名前で引く。
    未知のヘッダは推測せず、その旨を記録して落とさない。
"""
from __future__ import annotations
import re, json, html as H, glob, os
from collections import Counter, defaultdict

OUT = '/tmp/claude-1000/-home-y-saito-Developments-hareruya-design-docs/b03fa05b-17ab-44ae-856b-bab0fa393637/scratchpad'
PANEL = re.compile(r'<section class="sheet-panel(?: is-active)?" id="(sheet-\d+)">')
TABLE = re.compile(r'<table class="item-table">\s*<thead>\s*<tr>(.*?)</tr>\s*</thead>\s*<tbody>(.*?)</tbody>', re.S)
TH = re.compile(r'<th[^>]*>(.*?)</th>', re.S)
ROW = re.compile(r'<tr id="(item-sheet-[\d-]+)">(.*?)</tr>', re.S)
TD = re.compile(r'<td[^>]*>(.*?)</td>', re.S)
DS = re.compile(r'data-source="(functions/[^"]+)"')

def clean(s):
    s = re.sub(r'<br\s*/?>', '\n', s)
    s = re.sub(r'<[^>]+>', '', s)
    return H.unescape(s).replace('\t', ' ').strip()

def norm_hdr(s):
    s = clean(s).replace('\n', '')
    s = re.sub(r'\s+', '', s)
    return s

# ヘッダ名 → 正規化キー（設計書の表記ゆれを吸収）
HDR_MAP = {
    '識別ID': 'no', 'No': 'no', 'No.': 'no',
    'ラベル': 'label', '項目名': 'label', '項目': 'label',
    '書式・制限': 'fmt', '書式': 'fmt', '形式': 'fmt',
    '必須': 'req', '必須/任意': 'req', '必須・任意': 'req',
    '最大文字数または最大値': 'maxlen', '最大文字数': 'maxlen', '最大値': 'maxlen',
    '初期値': 'init', 'デフォルト値': 'init',
    '画面部品の説明': 'desc', '説明': 'desc', '備考': 'desc',
    '入力チェック': 'check', 'チェック': 'check',
    '主キー': 'pk', '入力例': 'example',
}

rows = []
stats = Counter()
unknown_hdrs = Counter()

for f in sorted(glob.glob('excel_to_html/output/*.html')):
    txt = open(f, encoding='utf-8').read()
    book = os.path.basename(f)[:4]
    parts = PANEL.split(txt)
    for i in range(1, len(parts), 2):
        sid = parts[i]
        body = parts[i + 1]
        ds = DS.search(body)
        src = ds.group(1) if ds else ''
        system = src.split('/')[1] if src else ''
        for tm in TABLE.finditer(body):
            hdr_cells = [norm_hdr(x) for x in TH.findall(tm.group(1))]
            keys = []
            for h in hdr_cells:
                k = HDR_MAP.get(h)
                if k is None:
                    unknown_hdrs[h] += 1
                keys.append(k)          # 未知は None のまま（推測しない）
            stats[f'{len(hdr_cells)}列ヘッダ'] += 1
            for m in ROW.finditer(tm.group(2)):
                tds = [clean(x) for x in TD.findall(m.group(2))]
                rec = {'book': book, 'sheet': sid, 'rowid': m.group(1),
                       'embed': src, 'system': system,
                       'ncols': len(tds), 'hdr': '|'.join(hdr_cells)}
                # ヘッダ名で引く。列数がヘッダと合わない場合も落とさず記録する
                for idx, k in enumerate(keys):
                    if k and idx < len(tds):
                        rec[k] = tds[idx]
                for k in ('no', 'label', 'fmt', 'req', 'maxlen', 'init', 'desc', 'check', 'pk', 'example'):
                    rec.setdefault(k, '')
                if len(tds) != len(hdr_cells):
                    stats['★列数がヘッダと不一致'] += 1
                    rec['warn'] = f'td={len(tds)} vs th={len(hdr_cells)}'
                rows.append(rec)
                stats['抽出行'] += 1

json.dump(rows, open(OUT + '/items2.json', 'w'), ensure_ascii=False)
print(f'=== 抽出器v2: {len(rows)}行 ===')
for k, v in sorted(stats.items()):
    print(f'  {v:5d}  {k}')
print(f'\n未知のヘッダ名（推測せず記録のみ）:')
for k, v in unknown_hdrs.most_common(12):
    print(f'  {v:4d}  {k!r}')

# v1 との差分
v1 = json.load(open(OUT + '/items.json'))
v1ids = {(x['book'], x['sheet'], x['rowid']) for x in v1}
v2ids = {(x['book'], x['sheet'], x['rowid']) for x in rows}
print(f'\nv1={len(v1)}行 / v2={len(rows)}行')
print(f'  v2で新たに拾えた行: {len(v2ids - v1ids)}')
print(f'  v1にあってv2に無い行: {len(v1ids - v2ids)}')
