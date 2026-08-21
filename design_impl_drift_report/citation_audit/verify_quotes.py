#!/usr/bin/env python3
"""レビュー結果の引用参照が実在するかを機械的に検証する。

- ベース名のみの参照も、全リポジトリのファイル索引から解決する
- 相対パスは各リポジトリルートを基準に解決する
- 解決できた参照は行番号が範囲内かも確認する
"""
import json, glob, os, re
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
REPOS = ['/home/y-saito/Developments/hareruya-design-docs',
         '/home/y-saito/Developments/ec-cube-enterprise',
         '/home/y-saito/Developments/pf-api',
         '/home/y-saito/Developments/pf-eccube3',
         '/home/y-saito/Developments/pf-article',
         '/home/y-saito/Developments/deck-api',
         '/home/y-saito/Developments/ec-cube']
EXT = ('.php', '.twig', '.yaml', '.yml', '.html', '.md', '.js', '.sql', '.sh')
SKIP = {'.git', 'node_modules', 'vendor', 'var', 'cache'}

# ファイル索引を作る（ベース名 -> 実パス群）
index = defaultdict(list)
allpaths = set()
for repo in REPOS:
    for dirpath, dirnames, filenames in os.walk(repo):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for fn in filenames:
            if fn.endswith(EXT):
                full = os.path.join(dirpath, fn)
                index[fn].append(full)
                allpaths.add(full)

PATHREF = re.compile(r'([A-Za-z0-9_\-./()（）]+\.(?:php|twig|yaml|yml|html|md|js|sql|sh))(?::(\d+)(?:-(\d+))?)?')

def resolve(p):
    p = p.lstrip('/')
    if os.path.isabs('/' + p) and os.path.exists('/' + p):
        return '/' + p
    for repo in REPOS:                       # リポジトリ相対
        c = os.path.join(repo, p)
        if os.path.exists(c):
            return c
    hits = index.get(os.path.basename(p))    # ベース名一致
    if hits:
        for h in hits:                       # パス末尾が一致するものを優先
            if h.endswith(p):
                return h
        return hits[0]
    return None

rs = []
for p in sorted(glob.glob(os.path.join(BASE, 'review_results', 'rv_*.json'))):
    rs += json.load(open(p, encoding='utf-8'), strict=False)['results']

stat = Counter(); problems = []
for r in rs:
    text = ' '.join(str(r.get(k) or '') for k in ('checkedQuote', 'reason'))
    refs = PATHREF.findall(text)
    if not refs:
        stat['パス参照なし(検索記述のみ)'] += 1
        continue
    for path, a, b in refs:
        full = resolve(path)
        if full is None:
            stat['解決不能'] += 1
            problems.append((r['rowId'], 'UNRESOLVED', path))
            continue
        stat['ファイル実在'] += 1
        if a:
            try:
                total = sum(1 for _ in open(full, encoding='utf-8', errors='replace'))
            except Exception:
                continue
            if int(a) > total:
                stat['行番号が範囲外'] += 1
                problems.append((r['rowId'], 'LINE_OUT', f'{path}:{a} (総{total}行)'))
            else:
                stat['行番号OK'] += 1

print(f'索引: {len(allpaths)} ファイル')
print('=== 参照の実在検証 ===')
for k, v in stat.most_common():
    print(f'  {k}: {v}')
if problems:
    print(f'\n=== 解決できなかった参照 {len(problems)}件（先頭15） ===')
    for rid, kind, d in problems[:15]:
        print(f'  row{rid} {kind}: {d}')
else:
    print('\n不整合なし')
