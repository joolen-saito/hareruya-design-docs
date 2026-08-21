#!/usr/bin/env python3
"""Backlog カテゴリ「不具合（バグ）」＝着手中（処理中系）チケットの工数を、
PROCESS_WORK_AND_BASIS.md と同じ工程モデルで算出する。

工程モデル（build_plan.py / build_process_basis.py と同一）:
  2 実装修正   = 見積 x (1+INV)
  3 UT         = 工程2 x UT
  4 レビュー   = (工程1+工程2) x RV   ※Backlogは工程1未判定なので工程1=0
  5 レビューバック = (工程1+工程2) x RB
工程1（基本設計書）はチケット単位で要否判定していないため 0 とし、下振れであることを明記する。
"""
import csv, json, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ALL = os.path.join(REPORT, 'backlog_wip', 'issues_bug_all.json')
EFF = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
OV = os.path.join(REPORT, 'backlog_wip', 'overlap_map.tsv')
OUT_TSV = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_inprogress.tsv')
MD = os.path.join(REPORT, 'BACKLOG_BUG_INPROGRESS_EFFORT.md')

INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20

STRICT = {'処理中'}
INPROG = {'処理中', '実装中(25%)', '単体テスト実装中(50%)', 'レビュー中(80%)'}
NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}


def n(v):
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


def flat(s, m=110):
    s = re.sub(r'[\s　]+', ' ', s or '').strip()
    return s[:m] + ('…' if len(s) > m else '')


def main():
    A_ISS = json.load(open(ALL, encoding='utf-8'))
    E = {r['課題キー']: r for r in csv.DictReader(open(EFF, encoding='utf-8'), delimiter='\t')}
    OVM = {r['課題キー']: r for r in csv.DictReader(open(OV, encoding='utf-8'), delimiter='\t')}

    inprog = [i for i in A_ISS if i['status']['name'] in INPROG]
    cur = [i for i in inprog if i['status']['name'] in STRICT]   # 採用＝処理中
    sub = [i for i in inprog if i['status']['name'] not in STRICT]
    missing = [i['issueKey'] for i in cur if i['issueKey'] not in E]

    rows = []
    for i in cur:
        e = E.get(i['issueKey'], {})
        o = OVM.get(i['issueKey'], {})
        rows.append({
            '課題キー': i['issueKey'], '状態': i['status']['name'],
            '種別': i['issueType']['name'], '優先度': i['priority']['name'],
            '担当者': (i.get('assignee') or {}).get('name', ''),
            '件名': flat(i['summary'], 120),
            '改修区分': e.get('改修区分', ''), '改修区分名': e.get('改修区分名', ''),
            '実装見積': e.get('工数', ''), '内包件数': e.get('内包件数', ''),
            '仕様確定要': e.get('仕様確定要', ''), '確信度': e.get('確信度', ''),
            '乖離との重複': o.get('突合確度', ''),
            '直す対象': e.get('直す対象', ''), '見積根拠': e.get('見積根拠', ''),
        })
    rows.sort(key=lambda r: (-n(r['実装見積']), r['課題キー']))
    with open(OUT_TSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    est = [r for r in rows if r['仕様確定要'] != 'YES']
    nd = [r for r in rows if r['仕様確定要'] == 'YES']
    raw = sum(n(r['実装見積']) for r in est)
    items = sum(int(r['内包件数'] or 1) for r in rows)

    s2 = raw * (1 + INV)
    s3 = s2 * UT
    s4 = s2 * RV
    s5 = s2 * RB
    TOT = s2 + s3 + s4 + s5

    dupA = [r for r in rows if r['乖離との重複'].startswith('確度A')]
    dupB = [r for r in rows if r['乖離との重複'].startswith('確度B')]
    dupC = [r for r in rows if r['乖離との重複'].startswith('確度C')]
    nodup = [r for r in rows if not r['乖離との重複'] or r['乖離との重複'] == 'なし']

    L, A = [], lambda x: L.append(x)
    A('# Backlog カテゴリ「不具合（バグ）」／状態「処理中」チケットの対応工数\n')
    A('取得元: Backlog API v2 `joolen.backlog.com` / プロジェクト `ECCUBE_HARERUYA` (id 160026) / '
      'カテゴリ `不具合（バグ）` (id 511360)。')
    A(f'出力: `backlog_wip/backlog_bug_inprogress.tsv`（{len(rows)}行）、'
      '生データ `backlog_wip/issues_bug_all.json`。\n')

    A('## 前提：このプロジェクトに「対応中」という状態名は無い\n')
    A('状態マスタを引くと次の8つで、**「対応中」は存在しない**。')
    A('')
    A('| 状態ID | 状態名 | カテゴリ配下の件数 |')
    A('|---:|---|---:|')
    cnt = Counter(i['status']['name'] for i in A_ISS)
    for sid, nm in [(1, '未対応'), (2, '処理中'), (59265, '実装中(25%)'),
                    (59266, '単体テスト実装中(50%)'), (59267, 'レビュー中(80%)'),
                    (3, '処理済み'), (62601, 'ADRへ移行'), (4, '完了')]:
        mark = ' ← **着手中**' if nm in INPROG else ''
        A(f'| {sid} | {nm}{mark} | {cnt.get(nm, 0)} |')
    A(f'| | **カテゴリ配下 計** | **{len(A_ISS)}** |')
    A('')
    A(f'「対応中」に相当するのは標準状態の **処理中 {len(cur)}件** で、'
      f'**これを母集合として採用**した。')
    A('')
    A(f'進捗サブ状態（実装中(25%) / レビュー中(80%)）の {len(sub)}件は着手済みで残工数のみのため、'
      '母集合に含めていない。参考値は次のとおり。')
    A('')
    A('| 課題キー | 状態 | 実装見積 | 件名 |')
    A('|---|---|---:|---|')
    for i in sub:
        e = E.get(i['issueKey'], {})
        A(f"| {i['issueKey']} | {i['status']['name']} | {n(e.get('工数')):.2f} "
          f"| {flat(i['summary'], 50)} |")

    A('\n## 結論\n')
    A('| | 件数 | 人日 |')
    A('|---|---:|---:|')
    A(f'| 見積可 | {len(est)} | {raw:.1f} |')
    A(f'| 仕様確定が先に要る（工数未算入） | {len(nd)} | — |')
    A(f'| **計** | **{len(rows)}** | **{raw:.1f}**（実装のみ） |')
    A('')
    A(f'チケット {len(rows)}枚に含まれる不具合は **{items}件**（1枚に複数まとめられているものがある）。')
    A('')
    A('工程を通した金額は次のとおり。')
    A('')
    A('| 工程 | 人日 | 計算 |')
    A('|---|---:|---|')
    A('| 1 基本設計書 | **0** | チケット単位で要否を判定していない（下振れ） |')
    A(f'| 2 実装修正 | {s2:.0f} | 見積 {raw:.1f} × (1 + 特定・影響範囲 {INV:.0%}) |')
    A(f'| 3 ユニットテスト | {s3:.0f} | 工程2 × {UT:.0%}（係数・実測なし） |')
    A(f'| 4 レビュー | {s4:.0f} | 工程2 × {RV:.0%}（係数・実測なし） |')
    A(f'| 5 レビューバック対応 | {s5:.0f} | 工程2 × {RB:.0%}（係数・実測なし） |')
    A(f'| **計** | **{TOT:.0f}** | |')
    A('')
    A(f'**素の実装見積 {raw:.1f}人日 → 5工程を通すと {TOT:.0f}人日**。'
      f'うち {TOT-raw:.0f}人日（{(TOT-raw)/TOT*100:.0f}%）は仮置きの係数で作った数字である。')

    A('\n## 改修区分別\n')
    A('| 区分 | 件数 | 実装見積 | 2 実装 | 3 UT | 4 レビュー | 5 レビューバック | 計 |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|')
    by = defaultdict(list)
    for r in est:
        by[r['改修区分']].append(r)
    for k in sorted(NAME):
        g = by.get(k, [])
        if not g:
            continue
        e = sum(n(r['実装見積']) for r in g)
        i2 = e * (1 + INV)
        A(f'| ({k}) {NAME[k]} | {len(g)} | {e:.1f} | {i2:.1f} | {i2*UT:.1f} | '
          f'{i2*RV:.1f} | {i2*RB:.1f} | **{i2*(1+UT+RV+RB):.1f}** |')
    A(f'| **計** | **{len(est)}** | **{raw:.1f}** | **{s2:.0f}** | **{s3:.0f}** | '
      f'**{s4:.0f}** | **{s5:.0f}** | **{TOT:.0f}** |')

    A('\n## 状態・種別・優先度の内訳\n')
    A('| 状態 | 件数 | 実装見積 |')
    A('|---|---:|---:|')
    for k, v in Counter(r['状態'] for r in rows).most_common():
        A(f'| {k} | {v} | {sum(n(r["実装見積"]) for r in rows if r["状態"] == k):.1f} |')
    A('')
    A('| 種別 | 件数 | 実装見積 |')
    A('|---|---:|---:|')
    for k, v in Counter(r['種別'] for r in rows).most_common():
        A(f'| {k} | {v} | {sum(n(r["実装見積"]) for r in rows if r["種別"] == k):.1f} |')
    A('')
    A('| 優先度 | 件数 | 実装見積 |')
    A('|---|---:|---:|')
    for k in ['高', '中', '低']:
        g = [r for r in rows if r['優先度'] == k]
        if g:
            A(f'| {k} | {len(g)} | {sum(n(r["実装見積"]) for r in g):.1f} |')

    A('\n## 工数の大きいチケット 上位20\n')
    A('| 課題キー | 区分 | 実装見積 | 5工程込み | 件名 |')
    A('|---|---|---:|---:|---|')
    for r in rows[:20]:
        v = n(r['実装見積'])
        A(f'| {r["課題キー"]} | {r["改修区分名"]} | {v:.2f} | '
          f'{v*(1+INV)*(1+UT+RV+RB):.2f} | {r["件名"][:60]} |')

    A(f'\n## 仕様確定が先に要るチケット（{len(nd)}件・工数未算入）\n')
    A('設計の矛盾や確認待ちで、何を作るかが決まっていないもの。**開発工数ではなく意思決定**として別枠。')
    A('')
    A('| 課題キー | 種別 | 件名 |')
    A('|---|---|---|')
    for r in nd[:15]:
        A(f'| {r["課題キー"]} | {r["種別"]} | {r["件名"][:70]} |')
    if len(nd) > 15:
        A(f'| … | | 他 {len(nd)-15}件 |')

    A('\n## 設計書乖離リストとの重複\n')
    A('乖離リスト（1,034件）と機械突合した結果。**重複ぶんを二重に工数計上してはいけない。**')
    A('')
    A('| 突合確度 | 意味 | 件数 | 実装見積 |')
    A('|---|---|---:|---:|')
    A(f'| 確度A | 機能Noが一致し内容も一致 | {len(dupA)} | {sum(n(r["実装見積"]) for r in dupA):.1f} |')
    A(f'| 確度B | 機能Noのみ一致 / 書籍＋内容一致 | {len(dupB)} | {sum(n(r["実装見積"]) for r in dupB):.1f} |')
    A(f'| 確度C | 書籍は一致するが内容の一致は弱い | {len(dupC)} | {sum(n(r["実装見積"]) for r in dupC):.1f} |')
    A(f'| なし | 対応する乖離指摘が見つからない | {len(nodup)} | {sum(n(r["実装見積"]) for r in nodup):.1f} |')
    A('')
    A(f'**確度Aの{len(dupA)}件は同じ不具合を指している可能性が高い。**'
      f'確度B・Cは機械判定のみで人が確認していないため、そのまま差し引くことはできない。')

    A('\n## 見積の作り方と限界\n')
    A('| 項目 | 内容 |')
    A('|---|---|')
    A(f'| 実装見積 {raw:.1f}人日 | **codexが1件ずつ、チケット本文と実コードを見て算出**。'
      '触る対象と範囲を根拠欄に書かせている（TSVの`見積根拠`列） |')
    A(f'| 特定・影響範囲 {INV:.0%} | **仮置き**。'
      'ただしBacklogのチケットは**既に起票・再現済み**なので本来はもっと軽く、ここは保守側に振れている |')
    A(f'| 工程3-5の係数 | **すべて仮置き。実測なし** |')
    A(f'| 工程1（設計書） | **未判定＝0で計上**。'
      '不具合の中には正本Excelの修正を伴うものがあるはずで、**この分は確実に下振れしている** |')
    A('')
    A(f'- 確信度 low が {sum(1 for r in rows if r["確信度"] == "low")}件。'
      'チケット本文だけでは影響範囲が判断できなかったもの。')
    A(f'- 担当者未設定が {sum(1 for r in rows if not r["担当者"])}件。')
    A(f'- 1枚に複数の不具合がまとまったチケットは合計で見積もっている（`内包件数`列）。')
    if missing:
        A(f'- **見積が無いチケットが {len(missing)}件**: {", ".join(missing[:10])}')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}\n      {OUT_TSV}')
    print(f'  カテゴリ配下 {len(A_ISS)} / 採用=処理中 {len(cur)} / サブ状態 {len(sub)}')
    print(f'  見積可 {len(est)}件 {raw:.1f}人日 / 要仕様確定 {len(nd)}件 / 内包不具合 {items}件')
    print(f'  5工程込み {TOT:.0f}人日（2:{s2:.0f} 3:{s3:.0f} 4:{s4:.0f} 5:{s5:.0f}）')
    print(f'  重複 A{len(dupA)} B{len(dupB)} C{len(dupC)} なし{len(nodup)}')
    if missing:
        print(f'  !! 見積欠落 {len(missing)}件: {missing[:5]}')


if __name__ == '__main__':
    main()
