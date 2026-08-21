#!/usr/bin/env python3
"""改修区分・工数のcodexレビュー結果を反映し、見積を締め直す。

著者の機械分類(代表値ベース)と、codexの1件ごとの見積を並べて差を出す。
"""
import csv, json, glob, os
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
MD = os.path.join(REPORT, 'EFFORT_SUMMARY.md')

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
ADD = ['区分レビュー', '確定改修区分', '確定改修区分名', 'codex工数', '工数根拠', '仕様確定要']


def flat(s):
    return (s or '').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    rv = {}
    broken = []
    for p in sorted(glob.glob(os.path.join(BASE, 'effort_results', 'ef_*.json'))):
        try:
            j = json.load(open(p, encoding='utf-8'), strict=False)
        except Exception as e:
            broken.append((os.path.basename(p), str(e)[:60]))
            continue
        for x in j.get('results', []):
            rv[int(x['rowId'])] = x
    if broken:
        print('読めなかった結果:', broken)
    print(f'レビュー結果 {len(rv)} 行分')

    fields = list(rows[0].keys()) + [c for c in ADD if c not in rows[0]]
    for i, r in enumerate(rows, 1):
        x = rv.get(i)
        if not x:
            for c in ADD:
                r.setdefault(c, '')
            r['確定改修区分'] = r['改修区分']
            r['確定改修区分名'] = r['改修区分名']
            continue
        v = x.get('verdict', '')
        cc = (x.get('correctedCat') or '') if v == 'REFUTED' else ''
        cat = cc if cc in NAME else r['改修区分']
        r['区分レビュー'] = v
        r['確定改修区分'] = cat
        r['確定改修区分名'] = NAME[cat]
        r['codex工数'] = x.get('effortDays', '') if not x.get('needsDecision') else 0
        r['工数根拠'] = flat(x.get('effortBasis') or x.get('reason'))[:300]
        r['仕様確定要'] = 'YES' if x.get('needsDecision') else ''

    with open(SRC, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    fix = [r for r in rows if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]
    rev = [r for r in fix if r['区分レビュー']]

    def cx(r):
        try:
            return float(r['codex工数'] or 0)
        except ValueError:
            return 0.0

    author = sum(float(r['工数中央']) for r in rev)
    codex = sum(cx(r) for r in rev)
    nd = [r for r in rev if r['仕様確定要'] == 'YES']

    print(f'\nレビュー済 {len(rev)}件')
    print('  区分判定:', dict(Counter(r['区分レビュー'] for r in rev)))
    moved = Counter((r['改修区分'], r['確定改修区分']) for r in rev if r['改修区分'] != r['確定改修区分'])
    print(f'  区分の訂正: {sum(moved.values())}件')
    for (a, b), n in moved.most_common(10):
        print(f'    ({a}){NAME[a]} -> ({b}){NAME[b]}: {n}')
    print(f'\n  著者(代表値) {author:.0f}人日  vs  codex(個別) {codex:.0f}人日  '
          f'差 {codex-author:+.0f} ({codex/author*100-100:+.0f}%)')
    print(f'  仕様確定が先に要る(見積不能) {len(nd)}件')

    # ---- サマリを追記 ----
    L = ['', '', '## codexレビュー後の確定値', '']
    L.append(f'改修対象 {len(fix)}件のうち {len(rev)}件をレビュー。')
    L.append('')
    L.append('| | 件数 | 著者(代表値) | codex(個別見積) |')
    L.append('|---|---:|---:|---:|')
    byc = defaultdict(list)
    for r in rev:
        byc[r['確定改修区分']].append(r)
    for k in sorted(NAME):
        g = byc.get(k, [])
        if not g:
            continue
        L.append(f'| ({k}) {NAME[k]} | {len(g)} | '
                 f'{sum(float(x["工数中央"]) for x in g):.0f} | {sum(cx(x) for x in g):.0f} |')
    L.append(f'| **合計** | **{len(rev)}** | **{author:.0f}** | **{codex:.0f}** |')
    L.append(f'| **＋諸経費(1.6倍)** | | **{author*1.6:.0f}** | **{codex*1.6:.0f}** |')
    L.append('')
    L.append(f'- 区分の訂正 {sum(moved.values())}件（レビュー済の {sum(moved.values())/len(rev)*100:.0f}%）')
    L.append(f'- 仕様確定が先に要り工数を出せない行 {len(nd)}件')
    L.append('- codex工数は1件ずつの独立見積。区分の代表値に依らないため、'
             'まとめ直しの効果は織り込まれていない。')

    open(MD, 'a', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'\n更新: {SRC}\n      {MD}')


if __name__ == '__main__':
    main()
