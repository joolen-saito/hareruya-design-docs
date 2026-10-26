#!/usr/bin/env python3
"""準備用のグッズ商品CSV(seed_files/*/*/setup/*.csv と正本名のベースCSV)の検査: 列数が見出しと合う・必須列が全行で埋まっている・商品公開ステータスがアプリの値(1/2/3)・商品コードが空でない。DB・アプリには触らない。"""
import csv, glob, io, os, re, sys
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(R, 'tools'))
t = open('/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/Csv/GoodsCsvController.php', encoding='utf-8').read()
m = re.search(r'function getCsvHeader\(\)[^{]*\{\s*return \[(.*?)\n        \];', t, re.S)
REQ = [x for x, req in re.findall(r"^            '([^']+)' => \[\s*'id' => '[^']*',\s*'description' => '[^']*',\s*'required' => (true|false)", m.group(1), re.M) if req == 'true']
bad = []; n = 0
for f in sorted(glob.glob(os.path.join(R, 'seed_files', '*', 'S-*', 'setup', '*.csv'))):
    if os.path.basename(f).startswith('productcsv'): continue
    rows = [r for r in csv.reader(io.StringIO(open(f, encoding='utf-8').read())) if r]
    n += 1; head = rows[0]; pr = []
    for i, r in enumerate(rows[1:], 2):
        if len(r) != len(head): pr.append(f'行{i}: 列数{len(r)}≠{len(head)}'); continue
        d = dict(zip(head, r))
        miss = [c for c in REQ if c in d and d[c] == '']
        if miss: pr.append(f'行{i}: 必須が空 {miss}')
        if d.get('商品公開ステータス') not in ('1', '2', '3') and '商品公開ステータス' in miss: pass
    if pr: bad.append((os.path.relpath(f, R), pr[:3]))
print(f'準備用CSV {n}本／問題あり {len(bad)}')
for b in bad[:60]: print(b[0], str(b[1])[:110])
