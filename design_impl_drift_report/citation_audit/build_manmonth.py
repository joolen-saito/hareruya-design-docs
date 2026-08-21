#!/usr/bin/env python3
"""改修区分ごとの人月を出す（1人月 = 20人日）。

工程モデルは他の生成物と同一:
  1 基本設計書 = 設計書編集 x (1+INV)  [＋書籍固定費は区分に按分できないので別枠]
  2 実装修正   = 実装見積 x (1+INV)
  3 UT         = 工程2 x UT
  4 レビュー   = (工程1+工程2) x RV
  5 レビューバック = (工程1+工程2) x RB
"""
import csv, os, re
from collections import defaultdict

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_classified.tsv')
MD = os.path.join(REPORT, 'MANMONTH_BY_CATEGORY.md')

MD_DAYS = 20.0          # 1人月
INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20
BOOK_MAKE, BOOK_REVIEW = 0.50, 0.25

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}


def n(v):
    try:
        return float(v or 0)
    except (ValueError, TypeError):
        return 0.0


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    C = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))

    cnt = defaultdict(int)
    est = defaultdict(int)
    impl = defaultdict(float)
    doc = defaultdict(float)
    docn = defaultdict(int)
    p1 = defaultdict(int)
    books = set()
    for r in F:
        k = r['確定改修区分']
        cnt[k] += 1
        if r['優先度'] == 'P1':
            p1[k] += 1
        if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES':
            est[k] += 1
            impl[k] += n(r['codex工数'])
        if r['設計書作業'] not in ('NONE', '', 'UNSURE'):
            doc[k] += n(r['設計書工数'])
            docn[k] += 1
            if (m := re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照'])):
                books.add(m.group(1))
    for r in C:
        k = r['改修区分']
        cnt[k] += 1
        if r['優先度(実害基準)'] == 'P1':
            p1[k] += 1
        if r['仕様確定要'] != 'YES':
            est[k] += 1
            impl[k] += n(r['実装見積'])
        if r['設計書作業'] not in ('NONE', '', 'UNSURE'):
            doc[k] += n(r['設計書工数'])
            docn[k] += 1
            if (m := re.search(r'(\d{4}[^/\s,、]*?)\.xlsx', r['設計書対象'])):
                books.add(m.group(1))

    def steps(k):
        s1 = doc[k] * (1 + INV)
        s2 = impl[k] * (1 + INV)
        s3 = s2 * UT
        s4 = (s1 + s2) * RV
        s5 = (s1 + s2) * RB
        return [s1, s2, s3, s4, s5]

    nb = len(books)
    # 書籍固定費（区分に按分不可）。工程1ぶんにもレビュー・レビューバックは発生する。
    bm = nb * BOOK_MAKE
    bk = [bm, 0.0, 0.0, nb * BOOK_REVIEW + bm * RV, bm * RB]

    L, A = [], lambda x: L.append(x)
    A('# 改修区分ごとの人月\n')
    A(f'**1人月 = {MD_DAYS:.0f}人日**。対象は設計書乖離1,034件＋Backlog不具合247件 = 1,281件。')
    A('工程は 1 基本設計書 → 2 実装修正 → 3 ユニットテスト → 4 レビュー → 5 レビューバック対応。')
    A('')
    A('**結合テスト・シナリオテスト、意思決定152件、移行・環境・リリースは含まない。**\n')

    A('## 区分別の人月\n')
    A('| 区分 | 件数 | 見積可 | 人日 | **人月** | 割合 |')
    A('|---|---:|---:|---:|---:|---:|')
    tot = sum(sum(steps(k)) for k in NAME) + sum(bk)
    for k in sorted(NAME, key=lambda x: -sum(steps(x))):
        t = sum(steps(k))
        A(f'| ({k}) {NAME[k]} | {cnt[k]} | {est[k]} | {t:.0f} | **{t/MD_DAYS:.1f}人月** | '
          f'{t/tot*100:.0f}% |')
    A(f'| 書籍単位の固定費（{nb}冊） | — | — | {sum(bk):.1f} | **{sum(bk)/MD_DAYS:.1f}人月** | '
      f'{sum(bk)/tot*100:.0f}% |')
    A(f'| **計** | **{sum(cnt.values())}** | **{sum(est.values())}** | **{tot:.0f}** | '
      f'**{tot/MD_DAYS:.1f}人月** | |')
    A('')
    A('書籍固定費（正本Excelの再生成・差分確認・改版管理・書籍単位の設計レビュー）は'
      '**改修区分に按分できない**ので別枠にしてある。')

    A('\n## 工程別の内訳（人月）\n')
    A('| 区分 | 1 設計書 | 2 実装 | 3 UT | 4 レビュー | 5 レビューバック | 計 |')
    A('|---|---:|---:|---:|---:|---:|---:|')
    agg = [0.0] * 5
    for k in sorted(NAME, key=lambda x: -sum(steps(x))):
        s = steps(k)
        agg = [a + b for a, b in zip(agg, s)]
        A(f'| ({k}) {NAME[k]} | ' + ' | '.join(f'{x/MD_DAYS:.1f}' for x in s) +
          f' | **{sum(s)/MD_DAYS:.1f}** |')
    agg = [a + b for a, b in zip(agg, bk)]
    A(f'| 書籍固定費 | ' + ' | '.join(f'{x/MD_DAYS:.1f}' if x else '—' for x in bk) +
      f' | **{sum(bk)/MD_DAYS:.1f}** |')
    A('| **計** | ' + ' | '.join(f'**{x/MD_DAYS:.1f}**' for x in agg) +
      f' | **{sum(agg)/MD_DAYS:.1f}** |')

    A('\n## 何人でやると何か月か\n')
    A('工程には順序があり（設計書→実装→UT→レビュー→レビューバック）、'
      '同じ機能を並行して直せないため、**人数を増やしても単純には短縮しない**。'
      '下表は理論値であって計画値ではない。')
    A('')
    A('| 人数 | 期間（理論値） |')
    A('|---:|---:|')
    for p in [5, 8, 10, 15, 20]:
        A(f'| {p}人 | {tot/MD_DAYS/p:.1f}か月 |')
    A('')
    A('**並列化には統合コストが伴う**（rebase、競合解消、共有基盤の変更調整、'
      '依存変更による再テスト）。これは上の人月に入っていない。')

    A('\n## 区分ごとの性格（人員配置の判断材料）\n')
    A('| 区分 | 人月 | 1件平均 | P1 | 並列化 |')
    A('|---|---:|---:|---:|---|')
    PAR = {'1': '機能単位に分割しやすい', '2': '**翻訳キーを共有するため衝突する**',
           '3': '**スキーマ変更が競合。先行凍結が要る**', '4': '機能単位に分割しやすい',
           '5': '機能単位に分割しやすい', '6': '独立性が高い',
           '7': '**連携先ごとに検証環境が要る**', '8': '**共通基盤に触るため直列**'}
    for k in sorted(NAME, key=lambda x: -sum(steps(x))):
        t = sum(steps(k))
        A(f'| ({k}) {NAME[k]} | {t/MD_DAYS:.1f} | '
          f'{t/est[k]*8:.1f}h | {p1[k]} | {PAR[k]} |' if est[k] else
          f'| ({k}) {NAME[k]} | {t/MD_DAYS:.1f} | — | {p1[k]} | {PAR[k]} |')

    A('\n## この人月に含まれないもの\n')
    A('| 未計上 | 規模 |')
    A('|---|---|')
    A('| 意思決定（何を作るか未定） | 152件 |')
    A('| 結合テスト・シナリオテスト | 対象246機能 / 約1,067ケース |')
    A('| 移行・環境・リリース・PR運用・並列化の統合 | 未算定 |')
    A('')
    A(f'また乖離とBacklogは重複する（確度A 8件・確度B 73件）。'
      f'この{tot/MD_DAYS:.0f}人月は重複を含んだ上限側の値である。')
    A('')
    A(f'**{tot/MD_DAYS:.0f}人月のうち、実測に基づくのは工程1・2の'
      f'{(agg[0]+agg[1])/sum(agg)*100:.0f}%。'
      f'残る工程3-5（{(agg[2]+agg[3]+agg[4])/sum(agg)*100:.0f}%）は係数で作った数字である。**')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    for k in sorted(NAME, key=lambda x: -sum(steps(x))):
        print(f'  ({k}) {NAME[k]}: {sum(steps(k)):.0f}人日 = {sum(steps(k))/MD_DAYS:.1f}人月')
    print(f'  書籍固定費: {sum(bk):.0f}人日 = {sum(bk)/MD_DAYS:.1f}人月')
    print(f'  計 {tot:.0f}人日 = {tot/MD_DAYS:.1f}人月')


if __name__ == '__main__':
    main()
