#!/usr/bin/env python3
"""登録順の検査: (1) 「先に登録するもの」が区分の段で自分より後ろ(例: 店舗が管理者の後)のもの。needs(作り方が明示)が根拠のものは除く。(2) 呼び名を控える側と使う側の向き違反: 先に登録するもの(y)が、自分(x)の控える呼び名を使っているもの"""
import re, glob, os, csv
csv.field_size_limit(10**9)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(R, 'tools', 'seed_order.py'), encoding='utf-8').read().split("# --- 作り方のコード")[0].replace("os.path.dirname(os.path.dirname(os.path.abspath(__file__)))", repr(R))
ns = {'__file__': os.path.join(R, 'tools', 'seed_order.py')}
exec(src, ns)
tier, seeds = ns['tier'], ns['seeds']
LAB = re.compile(r'〔[^〕]+〕')
def defuse(sid):
    t = seeds[sid][3] + '\n' + seeds[sid][5]; d = set(); u = set()
    for m in LAB.finditer(t):
        (d if '控え' in t[max(0, m.start() - 30): m.end() + 10] else u).add(m.group(0))
    return d, u - d
bad = []
for f in sorted(glob.glob(os.path.join(R, 'seed_files', '*', '_order.md'))):
    for l in open(f, encoding='utf-8'):
        c = [x.strip() for x in l.split('|')]
        if len(c) < 9 or not c[1].isdigit(): continue
        x = c[2]
        basis = c[7]
        for y in [p.replace('（他機能）', '') for p in c[6].split('、') if p]:
            if y in seeds:
                tx, ty = tier(seeds[x][1]), tier(seeds[y][1])
                if tx is not None and ty is not None and ty > tx and 'needs' not in basis: bad.append((x, seeds[x][1], y, seeds[y][1], basis))
                dx, ux = defuse(x); dy, uy = defuse(y)
                if (dx & uy) and not (dy & ux): bad.append((x, '呼び名の向き違反', y, sorted(dx & uy)[:2], basis))
print(len(bad))
for b in bad[:40]: print(b)
