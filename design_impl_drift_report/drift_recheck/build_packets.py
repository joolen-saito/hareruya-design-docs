#!/usr/bin/env python3
"""drift_findings_list_filtered.tsv を再検証パケットに分割する。

各パケットは同一設計書(book)内の指摘を CHUNK 件ずつまとめたもの。
エージェントが1パケットを担当し、現 develop の実コードと突き合わせて
対応済み / 部分対応 / 未対応 を根拠付きで判定する。
"""
import csv, json, re, os, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, '..', 'drift_findings_list_filtered.tsv')
OUT = os.path.join(BASE, 'packets')
CHUNK = 12

EE = '/home/y-saito/Developments/ec-cube-enterprise'
head = subprocess.check_output(['git', '-C', EE, 'rev-parse', 'HEAD'], text=True).strip()

rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))

# 行番号(1始まり, ヘッダ除く)を安定IDとして持たせ、結果マージのキーにする
by_book = {}
for i, r in enumerate(rows, start=1):
    m = re.search(r'(\d{4})_', r['設計書参照'])
    book = m.group(1) if m else 'ZZZZ'
    r['_row'] = i
    by_book.setdefault(book, []).append(r)

FIELDS = ['機能No', '機能名', 'ドメイン', '区分(画面種別)', '指摘区分', '重要度', '観点',
          '設計期待値', '実装実態', '差分内容', '実装参照', '設計書参照']

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

manifest = []
for book in sorted(by_book):
    items = by_book[book]
    for n in range(0, len(items), CHUNK):
        part = items[n:n + CHUNK]
        pid = f"{book}_{n // CHUNK + 1:02d}"
        packet = {
            'packetId': pid,
            'book': book,
            'eeHead': head,
            'count': len(part),
            'findings': [
                dict({'rowId': r['_row']}, **{k: r[k] for k in FIELDS}) for r in part
            ],
        }
        path = os.path.join(OUT, pid + '.json')
        json.dump(packet, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        manifest.append({'packetId': pid, 'book': book, 'count': len(part), 'path': path})

json.dump({'eeHead': head, 'totalFindings': len(rows), 'packets': manifest},
          open(os.path.join(BASE, 'manifest.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f"packets={len(manifest)} findings={len(rows)} eeHead={head[:10]}")
