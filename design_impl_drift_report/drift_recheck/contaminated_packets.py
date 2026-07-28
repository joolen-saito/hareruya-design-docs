#!/usr/bin/env python3
"""develop と作業中チェックアウトの差分ファイルに触れるパケットを洗い出す。

これらのパケットは、誤ったツリー(0ccb093c50)で判定された場合に
develop に存在しない実装を「対応済み」と誤判定しうるため再実行が必要。
"""
import json, glob, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
DELTA = '/tmp/claude-1000/-home-y-saito-Developments/7c5b906e-af70-4e7e-ae1c-8f982216692e/scratchpad/delta63.txt'
delta = [l.strip() for l in open(DELTA) if l.strip()]
delta_set = set(delta)
delta_dirs = set()
for d in delta:
    p = d
    while '/' in p:
        p = p.rsplit('/', 1)[0]
        delta_dirs.add(p)

pathre = re.compile(r'(?:/home/y-saito/Developments/ec-cube-enterprise/)?((?:src|app|html|codeception|tests)/[A-Za-z0-9_./\-]+?)(?::[\d,\- ]+)?(?=[\s,、）)]|$)')

hits = []
for path in sorted(glob.glob(os.path.join(BASE, 'packets', '*.json'))):
    pkt = json.load(open(path, encoding='utf-8'))
    touched = set()
    for f in pkt['findings']:
        for m in pathre.finditer(f['実装参照']):
            ref = m.group(1).rstrip('/,')
            # 参照が差分ファイルそのもの / 探索範囲ディレクトリ配下に差分ファイルがある
            if ref in delta_set:
                touched.add(ref)
            elif ref in delta_dirs or any(d.startswith(ref + '/') for d in delta_set):
                touched.add(ref + '/**')
    if touched:
        hits.append((pkt['packetId'], sorted(touched)[:4]))

done = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(BASE, 'results', '*.json'))}
print(f"差分に触れるパケット: {len(hits)}/137")
rerun = [p for p, _ in hits if p in done]
print(f"うち誤ツリーで判定済み(要再実行): {len(rerun)} -> {' '.join(rerun) if rerun else 'なし'}")
print()
for pid, t in hits:
    mark = ' [判定済→再実行]' if pid in done else ''
    print(f"  {pid}{mark}: {', '.join(t)}")
