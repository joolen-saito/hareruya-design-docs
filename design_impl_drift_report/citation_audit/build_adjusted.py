#!/usr/bin/env python3
"""調整後の改修区分表（確定版）。

前提:
  - 母集合 1,281件（乖離1,034＋Backlog処理中247）から誤検出・解消済クローズ27件を除く 1,254件
  - 見積不可146件は各区分の平均で補完
  - 平均h/件（工程2-5の合計）を指示値に設定。未指定の区分は個別見積のまま
  - 工程1（基本設計書）と書籍固定費は除外
"""
import csv, os
from collections import defaultdict

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_classified.tsv')
MD = os.path.join(REPORT, 'ADJUSTED_CATEGORY_TABLE.md')

H, MDAY = 8.0, 20.0
INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20
POST = 1 + UT + RV + RB

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
TARGET = {'1': 8.0, '2': 2.0, '3': 10.0, '4': 2.0, '5': 10.0,
          '6': 40.0, '7': 10.0, '8': 16.0}   # 平均h/件（指示値・全区分）
WORK = {'1': 'ルート・URL・レスポンス形・CSV列構成を設計に合わせる',
        '2': '文言・ラベル・表示項目・並び順・活性制御を直す',
        '3': 'マイグレーション＋Entity/Repository/バッチ＋既存データ再集計',
        '4': 'FormTypeの制約・CSV行検証を設計に合わせる',
        '5': '抽出条件・計算・ステータス遷移・分岐を直す',
        '6': 'ルート・Controller・Service・Twigを新設する',
        '7': 'スマレジ/S3/メール/通知の呼び出し経路を追加・差し替え',
        '8': 'トランザクション境界・排他制御・実行時間制限を組み替える'}


def n(v):
    try:
        return float(v or 0)
    except (ValueError, TypeError):
        return 0.0


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    C = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))

    all_, tgt, est, impl, p1 = (defaultdict(int), defaultdict(int), defaultdict(int),
                                defaultdict(float), defaultdict(int))
    for r in F:
        k = r['確定改修区分']
        all_[k] += 1
        if not r['トリアージ区分'].endswith('クローズ'):
            tgt[k] += 1
        if r['優先度'] == 'P1':
            p1[k] += 1
        if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES':
            est[k] += 1
            impl[k] += n(r['codex工数'])
    for r in C:
        k = r['改修区分']
        all_[k] += 1
        tgt[k] += 1
        if r['優先度(実害基準)'] == 'P1':
            p1[k] += 1
        if r['仕様確定要'] != 'YES':
            est[k] += 1
            impl[k] += n(r['実装見積'])

    def s2_of(k):
        if k in TARGET:
            return tgt[k] * TARGET[k] / H / POST
        return impl[k] * (tgt[k] / est[k] if est[k] else 1) * (1 + INV)

    def steps(k):
        s = s2_of(k)
        return [s, s * UT, s * RV, s * RB]

    order = sorted(NAME, key=lambda x: -sum(steps(x)))
    G = sum(sum(steps(k)) for k in NAME)
    TT = sum(tgt.values())

    L, A = [], lambda x: L.append(x)
    A('# 改修区分表（調整後）\n')
    A(f'母集合 1,281件（設計書乖離1,034＋Backlog不具合 状態:処理中247）のうち、'
      f'誤検出・解消済でクローズした27件を除く **{TT:,}件** が対象。'
      f'全件を区分の平均h/件で計上している。')
    A(f'1人月 = {MDAY:.0f}人日、1人日 = {H:.0f}時間。\n')

    A('## 区分表\n')
    A('| 区分 | 件数 | 平均h/件 | 人日 | **人月** | 割合 |')
    A('|---|---:|---:|---:|---:|---:|')
    for k in order:
        t = sum(steps(k))
        mark = '★' if k in TARGET else ''
        A(f'| ({k}) {NAME[k]}{mark} | {tgt[k]} | {t/tgt[k]*H:.1f}h | {t:.0f} | '
          f'**{t/MDAY:.1f}** | {t/G*100:.0f}% |')
    A(f'| **計** | **{TT:,}** | **{G/TT*H:.1f}h** | **{G:,.0f}** | **{G/MDAY:.1f}** | |')
    A('')
    A('★は平均h/件を指示値に設定した区分。**全8区分が指示値**であり、'
      'codexの個別見積は工程2の分布確認にのみ使っている。')

    A('\n## 工程別の内訳（人日）\n')
    A('| 区分 | 2 実装修正 | 3 UT | 4 レビュー | 5 レビューバック | 計 |')
    A('|---|---:|---:|---:|---:|---:|')
    agg = [0.0] * 4
    for k in order:
        s = steps(k)
        agg = [a + b for a, b in zip(agg, s)]
        A(f'| ({k}) {NAME[k]} | ' + ' | '.join(f'{x:.0f}' for x in s) +
          f' | **{sum(s):.0f}** |')
    A('| **計** | ' + ' | '.join(f'**{x:.0f}**' for x in agg) + f' | **{sum(agg):.0f}** |')
    A('')
    A(f'工程3-5は工程2に対する係数（UT {UT:.0%} / レビュー {RV:.0%} / '
      f'レビューバック {RB:.0%}）。**実測ではない。**')

    A('\n## 区分の中身\n')
    A('| 区分 | 対応対象 | P1 | 作業内容 |')
    A('|---|---:|---:|---|')
    for k in order:
        A(f'| ({k}) {NAME[k]} | {tgt[k]} | {p1[k]} | {WORK[k]} |')

    A('\n## 前提\n')
    A('| 項目 | 扱い |')
    A('|---|---|')
    A(f'| 母集合 | 乖離1,034 ＋ Backlog247 = 1,281件 |')
    A(f'| 誤検出・解消済クローズ | 27件を除外（対応対象 {TT:,}件） |')
    A(f'| 見積 | {TT:,}件すべてを区分の平均h/件で計上（仕様確定待ち・設計判断待ち・要再調査を含む） |')
    A('| 平均h/件 | (1)8h (2)2h (3)10h (4)2h (5)10h (6)40h (7)10h (8)16h を指示値として設定。'
      '工程2はそこから逆算（例: 10h ÷ 1.6 = 6.25h） |')
    A('| **工程1 基本設計書** | **除外**（設計書編集74.7人日＋書籍固定費＋そのレビュー分 計175人日） |')
    A('| 結合テスト・シナリオテスト | 未計上（対象246機能 / 約1,067ケース） |')
    A('| 意思決定 | 未計上（146件の決裁・調査・受入条件確定） |')
    A('| 移行・環境・リリース・PR運用 | 未計上 |')

    A('\n## 留意点\n')
    A('- **設計書の作業は消えていない。**530件・74.7人日ぶん実在する。'
      '特に移植漏れ502件は正本Excelに記述が無いため、直さなければ次の乖離監査で再び指摘に上がる。')
    A('- **指示値は元の個別見積と乖離する区分がある。**'
      'データ永続化は元の工程2中央値18.0h→6.25h、入力検証は6.0h→1.25h、'
      '未実装機能は24.0h→25.0h、実行制御は7.5h→10.0h。'
      'マイグレーション・既存データ再集計・新規実装を伴う重い行は収まらない。'
      '**平準化した計画値として使い、個別のタスクを切るときは元の見積に戻すこと。**')
    A('- 乖離とBacklogは重複する（確度A 8件・確度B 73件）。この表は重複を含む。')
    A(f'- 工程3-5（{sum(agg[1:])/sum(agg)*100:.0f}%）は係数で作った数字であり、実測はない。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    for k in order:
        print(f'  ({k}) {NAME[k]}: {tgt[k]}件 {sum(steps(k)):.0f}人日 '
              f'{sum(steps(k))/MDAY:.1f}人月')
    print(f'  計 {TT}件 {G:.0f}人日 {G/MDAY:.1f}人月')


if __name__ == '__main__':
    main()
