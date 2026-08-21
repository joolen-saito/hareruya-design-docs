#!/usr/bin/env python3
"""Backlog247件の分類結果を取り込み、乖離1,034件と同じ軸で合算した内訳を出す。

出力:
  backlog_wip/backlog_bug_classified.tsv   分類列を足したBacklog明細
  COMBINED_BREAKDOWN.md                    1,034 + 247 = 1,281件の合算内訳
"""
import csv, glob, json, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BLSRC = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_inprogress.tsv')
OUT_TSV = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_classified.tsv')
MD = os.path.join(REPORT, 'COMBINED_BREAKDOWN.md')

INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20
BOOK_MAKE, BOOK_REVIEW = 0.50, 0.25

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
WN = {'NONE': '設計書は触らない', 'ADD': '記述が無い項目を書き足す',
      'FIX': '実装と食い違う既存記述を直す', 'IMAGE': '画面レイアウト画像を差し替える',
      'RESOLVE': '正本内部の矛盾を解消する', 'UNSURE': '判断できない'}


def n(v):
    try:
        return float(v or 0)
    except (ValueError, TypeError):
        return 0.0


def flat(s, m=200):
    return re.sub(r'[\s　]+', ' ', str(s or '')).strip()[:m]


def priority(harm, basis, needs_decision):
    """乖離リストと同じ規則。仕様確定待ちは D（設計判断待ち）に寄せる。"""
    if needs_decision:
        return 'D'
    if basis == 'UNCERTAIN':
        return 'R'
    if basis == 'UNSUPPORTED':
        return 'D'
    if harm == 'high':
        return 'P1'
    if harm == 'low':
        return 'P4'
    return 'P2' if basis == 'SPEC_BACKED' else 'P3'


def triage(basis, needs_decision):
    if needs_decision:
        return '要設計判断(仕様確定待ち)'
    return {'SPEC_BACKED': '要修正-設計準拠',
            'LEGACY_BACKED': '要修正-移植漏れ(設計書追記も要)',
            'UNSUPPORTED': '要設計判断(正本に根拠なし)',
            'UNCERTAIN': '要再調査'}.get(basis, '要再調査')


def main():
    rows = list(csv.DictReader(open(BLSRC, encoding='utf-8'), delimiter='\t'))
    res = {}
    for p in sorted(glob.glob(os.path.join(BASE, 'blclass_results', 'bc_*.json'))):
        try:
            d = json.load(open(p, encoding='utf-8'), strict=False)
        except Exception as e:                       # 壊れたJSONは黙って捨てない
            print(f'  !! 読めない: {os.path.basename(p)}: {e}')
            continue
        for x in d.get('results', []):
            res[x['issueKey']] = x
    miss = [r['課題キー'] for r in rows if r['課題キー'] not in res]
    print(f'分類 {len(res)} / チケット {len(rows)}' + (f' / 欠落 {len(miss)}' if miss else ''))

    for r in rows:
        x = res.get(r['課題キー'], {})
        nd = r['仕様確定要'] == 'YES'
        r['指摘区分'] = x.get('shitekiKubun', '')
        r['実害'] = x.get('harm', '')
        r['根拠区分'] = x.get('basis', '')
        r['優先度(実害基準)'] = priority(x.get('harm'), x.get('basis'), nd) if x else ''
        r['トリアージ区分'] = triage(x.get('basis'), nd) if x else ''
        r['設計書作業'] = x.get('docWork', '')
        r['設計書工数'] = x.get('docEffortDays', '')
        r['設計書対象'] = flat(x.get('docTarget'), 200)
        r['分類根拠'] = flat(x.get('reason'), 300)
        r['分類確信度'] = x.get('confidence', '')

    with open(OUT_TSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    # ---- 乖離側 ----
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    dfix = [r for r in F if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES']
    ddoc = [r for r in F if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    books_d = {m.group(1) for r in ddoc
               if (m := re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']))}
    d_edit = sum(n(r['設計書工数']) for r in ddoc)
    i_dr = sum(n(r['codex工数']) for r in dfix)

    cfix = [r for r in rows if r['仕様確定要'] != 'YES']
    cdoc = [r for r in rows if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    i_bl = sum(n(r['実装見積']) for r in cfix)
    c_edit = sum(n(r['設計書工数']) for r in cdoc)
    books_c = {m.group(1) for r in cdoc
               if (m := re.search(r'(\d{4}[^/\s,、]*?)\.xlsx', r['設計書対象']))}
    books = books_d | books_c

    def model(d, a, c, nb):
        s1 = d * (1 + INV) + nb * BOOK_MAKE
        s2 = (a + c) * (1 + INV)
        return [s1, s2, s2 * UT, (s2 + s1) * RV + nb * BOOK_REVIEW, (s2 + s1) * RB]

    before = model(d_edit, i_dr, i_bl, len(books_d))
    after = model(d_edit + c_edit, i_dr, i_bl, len(books))

    L, A = [], lambda x: L.append(x)
    A('# 設計書乖離1,034件 ＋ Backlog不具合247件 の合算内訳\n')
    A('Backlog「不具合（バグ）」／状態 処理中 の247件を、乖離リストと**同じ分類軸**'
      '（指摘区分・実害・根拠区分・改修区分・設計書作業）に載せて合算したもの。')
    A('')
    A('分類は codex が1件ずつ、チケット本文・実コード・正本Excel由来HTMLを見て判定した。'
      '**実装工数は既に確定しているので見積もり直していない。**')
    A(f'明細: `backlog_wip/backlog_bug_classified.tsv`（{len(rows)}行）\n')

    def tbl(title, keys, dget, cget, order=None, label=None):
        A(f'\n## {title}\n')
        dc, cc = Counter(dget(r) for r in F), Counter(cget(r) for r in rows)
        ks = order or sorted(set(dc) | set(cc), key=lambda k: -(dc[k] + cc[k]))
        A('| 区分 | 乖離1,034 | Backlog247 | 計 |')
        A('|---|---:|---:|---:|')
        for k in ks:
            if not (dc.get(k) or cc.get(k)):
                continue
            nm = (label or {}).get(k, k) or '(未分類)'
            A(f'| {nm} | {dc.get(k, 0)} | {cc.get(k, 0)} | **{dc.get(k, 0)+cc.get(k, 0)}** |')
        A(f'| **計** | **{len(F)}** | **{len(rows)}** | **{len(F)+len(rows)}** |')

    tbl('指摘区分', None, lambda r: r['指摘区分'], lambda r: r['指摘区分'],
        order=['未実装', '実装違い', ''])

    tbl('根拠区分（期待挙動の裏付けがどこにあるか）', None,
        lambda r: r['確定根拠区分'], lambda r: r['根拠区分'],
        order=['SPEC_BACKED', 'LEGACY_BACKED', 'UNSUPPORTED', 'UNCERTAIN', 'ALREADY_MET', ''],
        label={'SPEC_BACKED': 'SPEC_BACKED 正本に裏付けがある',
               'LEGACY_BACKED': 'LEGACY_BACKED 正本に無く旧実装に根拠（移植漏れ）',
               'UNSUPPORTED': 'UNSUPPORTED どちらにも根拠なし',
               'UNCERTAIN': 'UNCERTAIN 判断材料不足',
               'ALREADY_MET': 'ALREADY_MET 既に充足'})

    tbl('優先度（実害基準）', None, lambda r: r['優先度'], lambda r: r['優先度(実害基準)'],
        order=['P1', 'P2', 'P3', 'P4', 'D', 'R', '-'],
        label={'P1': 'P1 実害high（業務停止・データ不整合・外部連携断）',
               'P2': 'P2 実害med かつ正本に裏付けあり',
               'P3': 'P3 実害med かつ移植漏れ',
               'P4': 'P4 実害low（文言・軽微）',
               'D': 'D 設計判断待ち', 'R': 'R 要再調査', '-': '— クローズ（対応不要）'})

    tbl('トリアージ区分', None, lambda r: r['トリアージ区分'], lambda r: r['トリアージ区分'])

    A('\n## 改修区分\n')
    A('| 区分 | 乖離件数 | 乖離工数 | BL件数 | BL工数 | 計件数 | 計工数 |')
    A('|---|---:|---:|---:|---:|---:|---:|')
    for k in sorted(NAME):
        dg = [r for r in dfix if r['確定改修区分'] == k]
        cg = [r for r in cfix if r['改修区分'] == k]
        if not dg and not cg:
            continue
        de = sum(n(r['codex工数']) for r in dg)
        ce = sum(n(r['実装見積']) for r in cg)
        A(f'| ({k}) {NAME[k]} | {len(dg)} | {de:.1f} | {len(cg)} | {ce:.1f} | '
          f'**{len(dg)+len(cg)}** | **{de+ce:.1f}** |')
    A(f'| **計** | **{len(dfix)}** | **{i_dr:.1f}** | **{len(cfix)}** | **{i_bl:.1f}** | '
      f'**{len(dfix)+len(cfix)}** | **{i_dr+i_bl:.1f}** |')
    A('')
    A('工数は実装のみの素の値（探索の上乗せ・工程3-5を含まない）。'
      '仕様確定待ちの行は工数を積んでいないため件数から除いてある。')

    A('\n## 設計書側の作業\n')
    A('**Backlog側は今回はじめて判定した。**これまで工程1をゼロで計上していた分が埋まる。')
    A('')
    A('| 種類 | 乖離1,034 | Backlog247 | 計 | 乖離工数 | BL工数 |')
    A('|---|---:|---:|---:|---:|---:|')
    for k in ['NONE', 'ADD', 'FIX', 'IMAGE', 'RESOLVE', 'UNSURE']:
        dg = [r for r in F if r['設計書作業'] == k]
        cg = [r for r in rows if r['設計書作業'] == k]
        if not dg and not cg:
            continue
        A(f'| {k} {WN[k]} | {len(dg)} | {len(cg)} | **{len(dg)+len(cg)}** | '
          f'{sum(n(r["設計書工数"]) for r in dg):.1f} | {sum(n(r["設計書工数"]) for r in cg):.1f} |')
    A(f'| **設計書を触る計** | **{len(ddoc)}** | **{len(cdoc)}** | **{len(ddoc)+len(cdoc)}** | '
      f'**{d_edit:.1f}** | **{c_edit:.1f}** |')
    A('')
    A(f'対象書籍は乖離側 {len(books_d)}冊 ＋ Backlog側で新たに出た分を合わせて **{len(books)}冊**。')

    A('\n## 工程別工数（Backlogの設計書作業を反映）\n')
    A('| 工程 | 反映前 | 反映後 | 差 |')
    A('|---|---:|---:|---:|')
    for i, k in enumerate(['1 基本設計書', '2 実装修正', '3 ユニットテスト',
                           '4 レビュー', '5 レビューバック対応']):
        A(f'| {k} | {before[i]:.0f} | {after[i]:.0f} | {after[i]-before[i]:+.0f} |')
    A(f'| **計** | **{sum(before):.0f}** | **{sum(after):.0f}** | **{sum(after)-sum(before):+.0f}** |')
    A('')
    A('係数は他の生成物と同じ（探索+50%、UT 30%、レビュー10%、レビューバック20%、'
      f'書籍固定費 {BOOK_MAKE+BOOK_REVIEW}人日/冊）。')

    A('\n## 分類の確信度\n')
    A('| 確信度 | 件数 |')
    A('|---|---:|')
    for k, v in Counter(r['分類確信度'] for r in rows).most_common():
        A(f'| {k or "(不明)"} | {v} |')

    A('\n## この分類の限界\n')
    A('- Backlog側の根拠区分は、チケット本文から機能・設計書シートを特定できたものだけ確度が高い。'
      '特定できないものは UNCERTAIN に寄せている。')
    A('- 乖離側の根拠区分は codex 3巡の再検証を通しているが、'
      '**Backlog側は1巡しか通していない**。同じ精度ではない。')
    A('- 乖離とBacklogは重複する（確度A 8件・確度B 73件）。'
      'この表は重複を含んだ件数であり、単純合算は上振れしている。')
    if miss:
        A(f'- **分類が取れなかったチケットが {len(miss)}件**: {", ".join(miss[:10])}')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}\n      {OUT_TSV}')
    print(f'  指摘区分 {Counter(r["指摘区分"] for r in rows).most_common()}')
    print(f'  実害 {Counter(r["実害"] for r in rows).most_common()}')
    print(f'  根拠 {Counter(r["根拠区分"] for r in rows).most_common()}')
    print(f'  設計書 {Counter(r["設計書作業"] for r in rows).most_common()}')
    print(f'  工程計 {sum(before):.0f} -> {sum(after):.0f}')


if __name__ == '__main__':
    main()
