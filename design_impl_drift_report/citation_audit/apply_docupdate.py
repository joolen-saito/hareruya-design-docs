#!/usr/bin/env python3
"""設計書(正本Excel)最新化の見積結果を集計し、レポートを出す。

1件ごとの編集工数(codex)に、書籍単位の固定費(再生成・検証・改版管理)を足す。
"""
import csv, json, glob, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
MD = os.path.join(REPORT, 'DOC_UPDATE_ESTIMATE.md')

# 書籍単位の固定費(人日)
PER_BOOK_REGEN = 0.25    # 変換実行 + 差分確認 + verify.py の結果確認
PER_BOOK_REVIEW = 0.5    # 改版管理(改訂履歴)・書籍単位のレビュー
OVERHEAD = 1.3           # レビュー往復・差し戻しの係数

WORKNAME = {
    'NONE': '設計書は触らない（実装を直せば済む）',
    'ADD': '記述を書き足す（設計書の記述漏れ）',
    'FIX': '既存記述を採用仕様に合わせて直す',
    'IMAGE': '画面レイアウト画像を差し替える',
    'RESOLVE': '正本内部の矛盾を解消する',
    'UNSURE': '判断できず',
}


def flat(s):
    return (s or '').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    rv, broken = {}, []
    for p in sorted(glob.glob(os.path.join(BASE, 'docupdate_results', 'du_*.json'))):
        try:
            j = json.load(open(p, encoding='utf-8'), strict=False)
        except Exception as e:
            broken.append((os.path.basename(p), str(e)[:60]))
            continue
        for x in j.get('results', []):
            rv[int(x['rowId'])] = x
    if broken:
        print('読めなかった結果:', broken)
    print(f'見積結果 {len(rv)} 行分')

    ADD = ['設計書作業', '設計書工数', '設計書対象', '設計書工数根拠']
    fields = list(rows[0].keys()) + [c for c in ADD if c not in rows[0]]
    for i, r in enumerate(rows, 1):
        x = rv.get(i)
        if not x:
            for c in ADD:
                r.setdefault(c, '')
            continue
        r['設計書作業'] = x.get('docWork', '')
        r['設計書工数'] = x.get('docEffortDays', 0)
        r['設計書対象'] = flat(x.get('target'))[:200]
        r['設計書工数根拠'] = flat(x.get('reason'))[:300]

    with open(SRC, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    tgt = [r for r in rows if r['設計書作業']]

    def dv(r):
        try:
            return float(r['設計書工数'] or 0)
        except ValueError:
            return 0.0

    work = [r for r in tgt if r['設計書作業'] not in ('NONE', '')]
    edit = sum(dv(r) for r in tgt)

    # 影響書籍
    def bookset(rs):
        b = set()
        for r in rs:
            for m in re.finditer(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']):
                b.add(m.group(1))
        return b

    bw = bookset(work)
    fixed = len(bw) * (PER_BOOK_REGEN + PER_BOOK_REVIEW)
    total = (edit + fixed) * OVERHEAD

    L, A = [], lambda x: L.append(x)
    A('# 設計書（正本Excel）最新化の工数見積\n')
    A('対象: 乖離指摘のうちクローズ済を除く '
      f'{len(tgt)}件。1件ごとの編集工数は codex が個別に見積もった値。\n')
    A('正本は `excel_to_html/input/*.xlsx`。HTML(`output/`)は `convert.py` の生成物なので、'
      '編集対象はExcelのセル・表・画像。\n')

    A('## 結論\n')
    A('| 内訳 | 件数/冊数 | 人日 |')
    A('|---|---:|---:|')
    A(f'| Excel編集（1件ごと） | {len(work)} | {edit:.1f} |')
    A(f'| 書籍単位の固定費（再生成{PER_BOOK_REGEN}＋改版・レビュー{PER_BOOK_REVIEW}／冊） '
      f'| {len(bw)}冊 | {fixed:.1f} |')
    A(f'| 小計 | | {edit+fixed:.1f} |')
    A(f'| **合計（レビュー往復 {OVERHEAD}倍）** | | **{total:.1f}** |')
    A('')
    A(f'設計書を触らなくてよい行が {sum(1 for r in tgt if r["設計書作業"] == "NONE")} 件。'
      f'実際に手を入れるのは **{len(work)}件 / {len(bw)}冊**。')

    A('\n## 作業の種類別\n')
    A('| 種類 | 意味 | 件数 | 人日 |')
    A('|---|---|---:|---:|')
    byw = defaultdict(list)
    for r in tgt:
        byw[r['設計書作業']].append(r)
    for k in ['ADD', 'FIX', 'IMAGE', 'RESOLVE', 'UNSURE', 'NONE']:
        g = byw.get(k, [])
        if g:
            A(f'| {k} | {WORKNAME.get(k, "")} | {len(g)} | {sum(dv(r) for r in g):.1f} |')

    A('\n## 根拠区分との対応（判定が想定どおりか）\n')
    A('| 根拠区分 | ' + ' | '.join(['NONE', 'ADD', 'FIX', 'IMAGE', 'RESOLVE', 'UNSURE']) + ' |')
    A('|---|' + '---:|' * 6)
    m = defaultdict(Counter)
    for r in tgt:
        m[r['確定根拠区分']][r['設計書作業']] += 1
    for k in sorted(m):
        A(f'| {k} | ' + ' | '.join(str(m[k].get(w, 0))
                                   for w in ['NONE', 'ADD', 'FIX', 'IMAGE', 'RESOLVE', 'UNSURE']) + ' |')

    A('\n## 書籍別（編集が発生する冊のみ・工数上位20）\n')
    A('| 書籍 | 件数 | 編集(人日) | 固定費 | 計 |')
    A('|---|---:|---:|---:|---:|')
    bb = defaultdict(list)
    for r in work:
        for mm in re.finditer(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']):
            bb[mm.group(1)].append(r)
            break
    for k in sorted(bb, key=lambda x: -sum(dv(r) for r in bb[x]))[:20]:
        e = sum(dv(r) for r in bb[k])
        A(f'| {k} | {len(bb[k])} | {e:.2f} | {PER_BOOK_REGEN+PER_BOOK_REVIEW:.2f} | '
          f'{e+PER_BOOK_REGEN+PER_BOOK_REVIEW:.2f} |')
    if len(bb) > 20:
        A(f'| （他 {len(bb)-20}冊） | | | | |')

    A('\n## 実装修正との関係\n')
    A('| | 件数 | 人日 |')
    A('|---|---:|---:|')

    def cxv(r):
        try:
            return float(r['codex工数'] or 0)
        except ValueError:
            return 0.0
    impl = [r for r in rows if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]
    A(f'| 実装の修正 | {len(impl)} | {sum(cxv(r) for r in impl):.0f} |')
    A(f'| 設計書の最新化 | {len(work)} | {total:.0f} |')
    A(f'| **合計** | | **{sum(cxv(r) for r in impl)+total:.0f}** |')
    A('')
    A('両者は対象行が重ならない部分が多い。'
      '設計書に記述があって実装が違う行(SPEC_BACKED)は実装だけ直せばよく、'
      '設計書に記述が無い行(LEGACY_BACKED)は実装の移植と設計書の追記の両方が要る。')

    A('\n## この見積の前提\n')
    A(f'- 1件ごとの編集工数は codex が個別に見積もった値。同じシートにまとまる分の'
      '割引は codex 側で織り込み済み（`sharedWithRows`）。')
    A(f'- 書籍単位の固定費は 1冊あたり 再生成・差分確認 {PER_BOOK_REGEN} 人日 ＋ '
      f'改版管理・レビュー {PER_BOOK_REVIEW} 人日 と置いた。**これは私の仮置きで、'
      '実測ではない。**運用の実態に合わせて調整のこと。')
    A(f'- 全体に レビュー往復・差し戻し分として {OVERHEAD} 倍を掛けた。これも仮置き。')
    A('- 「どちらを正とするか」の裁定そのもの（会議・確認）は含まない。'
      'RESOLVE は決まった後の反映作業だけ。')
    A('- 実装を先に直すか設計書を先に直すかで、FIX の件数は変わる。'
      'ここでは「設計書が正、実装を合わせる」を基本線として判定している。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'\n出力: {MD}')
    print(f'  Excel編集 {len(work)}件 {edit:.1f}人日 / 固定費 {len(bw)}冊 {fixed:.1f}人日')
    print(f'  合計 {total:.1f}人日')
    print('  作業種別:', {k: len(v) for k, v in byw.items()})


if __name__ == '__main__':
    main()
