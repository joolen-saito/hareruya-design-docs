#!/usr/bin/env python3
"""Backlog 247件を乖離リストと同じ軸で分類させるパケットを作る。"""
import csv, json, glob, os, re

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_inprogress.tsv')
ISS = os.path.join(REPORT, 'backlog_wip', 'issues_bug_all.json')
OUT = os.path.join(BASE, 'blclass_packets')
CHUNK = 20


def cut(s, n):
    return re.sub(r'[\s　]+', ' ', s or '').strip()[:n]


rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
iss = {i['issueKey']: i for i in json.load(open(ISS, encoding='utf-8'))}

os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')):
    os.remove(f)

# 同じ改修区分の行を隣り合わせる（判断のブレを減らす）
rows.sort(key=lambda r: (r['改修区分'], r['課題キー']))

for n in range(0, len(rows), CHUNK):
    part = rows[n:n + CHUNK]
    pid = f"bc_{n // CHUNK + 1:02d}"
    json.dump({'packetId': pid,
               'note': '実装工数は確定済みなので見積もり直さない。分類だけを行う。',
               'tickets': [{'issueKey': r['課題キー'],
                            '件名': r['件名'],
                            '種別': r['種別'],
                            'Backlog優先度(参考・実害ではない)': r['優先度'],
                            '改修区分': f"({r['改修区分']}) {r['改修区分名']}",
                            '実装見積(確定・変更不可)': r['実装見積'],
                            '仕様確定要': r['仕様確定要'],
                            '直す対象': cut(r['直す対象'], 220),
                            '既存の見積根拠': cut(r['見積根拠'], 320),
                            '本文': cut((iss.get(r['課題キー'], {}) or {}).get('description'), 1400)}
                           for r in part]},
              open(os.path.join(OUT, pid + '.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

sizes = [os.path.getsize(p) for p in glob.glob(os.path.join(OUT, '*.json'))]
print(f'対象 {len(rows)}件 -> {len(sizes)}パケット 平均{sum(sizes)//len(sizes)//1024}KB '
      f'最大{max(sizes)//1024}KB')
