#!/usr/bin/env python3
"""Backlog「不具合（バグ）」対応中チケットの工数見積を集計し Markdown を出す。"""
import csv, json, glob, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ISSUES = os.path.join(REPORT, 'backlog_wip', 'issues.json')
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
OUT_TSV = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
MD = os.path.join(REPORT, 'BACKLOG_WIP_EFFORT.md')

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}

# バッファのシナリオ（設計書見積と同じ考え方）
SCEN = {'楽観': (1.00, 1.15, 0.00), '基準': (1.25, 1.30, 0.25), '保守': (1.50, 1.60, 0.50)}


def flat(s, n=300):
    return re.sub(r'[\s　]+', ' ', s or '')[:n]


def main():
    iss = {i['issueKey']: i for i in json.load(open(ISSUES, encoding='utf-8'))}
    rv = {}
    for p in sorted(glob.glob(os.path.join(BASE, 'backlog_results', 'bl_*.json'))):
        for x in json.load(open(p, encoding='utf-8'), strict=False).get('results', []):
            rv[x['issueKey']] = x
    print(f'見積 {len(rv)} / チケット {len(iss)}')

    rows = []
    for k, i in iss.items():
        x = rv.get(k, {})
        rows.append({
            '課題キー': k, '件名': flat(i['summary'], 120),
            '種別': i['issueType']['name'], '状態': i['status']['name'],
            '優先度': i['priority']['name'],
            '担当者': (i.get('assignee') or {}).get('name', ''),
            '改修区分': x.get('cat', ''), '改修区分名': NAME.get(x.get('cat', ''), ''),
            '工数': x.get('effortDays', 0) if not x.get('needsDecision') else 0,
            '内包件数': x.get('itemCount', 1),
            '仕様確定要': 'YES' if x.get('needsDecision') else '',
            '確信度': x.get('confidence', ''),
            '直す対象': flat(x.get('target'), 200),
            '見積根拠': flat(x.get('reason'), 300),
        })
    rows.sort(key=lambda r: (-float(r['工数'] or 0), r['課題キー']))
    with open(OUT_TSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    def ev(r):
        try:
            return float(r['工数'] or 0)
        except ValueError:
            return 0.0

    est = [r for r in rows if r['仕様確定要'] != 'YES']
    nd = [r for r in rows if r['仕様確定要'] == 'YES']
    total = sum(ev(r) for r in rows)
    items = sum(int(r['内包件数'] or 1) for r in rows)

    # 1034件との重複可能性（機能Noで追えるぶん）
    drift = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    dfn = {r['機能No'] for r in drift if not r['トリアージ区分'].endswith('クローズ')}
    pat = re.compile(r'\b([A-Z]\d{2}-\d{2})\b')
    ov = []
    for k, i in iss.items():
        t = (i['summary'] or '') + ' ' + (i.get('description') or '')
        if set(pat.findall(t)) & dfn:
            ov.append(k)

    L, A = [], lambda x: L.append(x)
    A('# Backlog「不具合（バグ）」対応中チケットの改修工数\n')
    A('対象: Backlog `ECCUBE_HARERUYA` / カテゴリ「不具合（バグ）」(categoryId 511360) / '
      '状態が着手済み未完了。')
    A('工数は codex が1件ずつ見積もった**実装のみ**の値。'
      'テスト・レビュー・リリース作業は含まない。\n')
    A(f'出力: `backlog_wip/backlog_wip_effort.tsv`（{len(rows)}行）\n')

    A('## 結論\n')
    A('| | 件数 | 人日 |')
    A('|---|---:|---:|')
    A(f'| 見積可 | {len(est)} | {total:.1f} |')
    A(f'| 仕様確定が先に要る（工数未算入） | {len(nd)} | — |')
    A(f'| **合計** | **{len(rows)}** | **{total:.1f}** |')
    A('')
    A(f'チケット {len(rows)}枚に含まれる不具合は **{items}件**'
      f'（1枚に複数まとめられているものがある）。')

    A('\n## 状態の内訳\n')
    A('プロジェクトに「対応中」という状態名は無く、着手済み未完了は3つに分かれる。')
    A('')
    A('| 状態 | 件数 | 人日 |')
    A('|---|---:|---:|')
    for k, n in Counter(r['状態'] for r in rows).most_common():
        A(f'| {k} | {n} | {sum(ev(r) for r in rows if r["状態"] == k):.1f} |')

    A('\n## 改修区分別\n')
    A('| 区分 | 件数 | 人日 | 1件平均 |')
    A('|---|---:|---:|---:|')
    by = defaultdict(list)
    for r in rows:
        by[r['改修区分']].append(r)
    for k in sorted(NAME):
        g = by.get(k, [])
        if not g:
            continue
        e = sum(ev(r) for r in g)
        A(f'| ({k}) {NAME[k]} | {len(g)} | {e:.1f} | {e/len(g):.2f} |')
    A(f'| **合計** | **{len(rows)}** | **{total:.1f}** | {total/len(rows):.2f} |')

    A('\n## 種別・優先度別\n')
    A('| 種別 | 件数 | 人日 |')
    A('|---|---:|---:|')
    for k, n in Counter(r['種別'] for r in rows).most_common():
        A(f'| {k} | {n} | {sum(ev(r) for r in rows if r["種別"] == k):.1f} |')
    A('')
    A('| 優先度 | 件数 | 人日 |')
    A('|---|---:|---:|')
    for k in ['高', '中', '低']:
        g = [r for r in rows if r['優先度'] == k]
        if g:
            A(f'| {k} | {len(g)} | {sum(ev(r) for r in g):.1f} |')

    A('\n## 工数の大きいチケット 上位20\n')
    A('| 課題キー | 区分 | 人日 | 件名 |')
    A('|---|---|---:|---|')
    for r in rows[:20]:
        A(f'| {r["課題キー"]} | {r["改修区分名"]} | {ev(r):.2f} | {r["件名"][:70]} |')

    A(f'\n## 仕様確定が先に要るチケット（{len(nd)}件）\n')
    A('設計の矛盾や確認待ちで、何を作るか決まっていないもの。工数に入れていない。')
    A('')
    A('| 課題キー | 件名 |')
    A('|---|---|')
    for r in nd[:20]:
        A(f'| {r["課題キー"]} | {r["件名"][:80]} |')
    if len(nd) > 20:
        A(f'| … | 他 {len(nd)-20}件 |')

    A('\n## バッファ込みの計画値\n')
    A('| シナリオ | 単価掛け率 | 諸経費係数 | 裁定(人日/件) | 合計(人日) |')
    A('|---|---:|---:|---:|---:|')
    vals = {}
    for n, (a, c, d) in SCEN.items():
        v = total * a * c + len(nd) * d
        vals[n] = v
        A(f'| {n} | {a} | {c} | {d} | **{v:.0f}** |')
    A('')
    A(f'**計画値は保守シナリオの {vals["保守"]:.0f}人日 を推奨する。**'
      f'（楽観 {vals["楽観"]:.0f} 〜 保守 {vals["保守"]:.0f}）')
    A('諸経費係数はテスト・レビュー・リリース作業ぶん。'
      '単価掛け率は「どこを直すか分かっている前提」の見積に調査分を足すためのもの。')

    A('\n## 設計書乖離1,034件との重複について\n')
    A(f'- 種別「未実装・実装乖離リスト」が {Counter(r["種別"] for r in rows)["未実装・実装乖離リスト"]}件 '
      f'あり、**同じ乖離分析に由来する可能性が高い**。')
    A(f'- ただし課題キーと機能Noの対応表が残っておらず、'
      f'機能Noが本文に現れるのは {len(ov)}/{len(rows)} 件だけで、**厳密な突合はできない**。')
    A(f'- 機能Noで追える範囲では {len(ov)}件が乖離リスト側の機能Noと一致する。')
    A('- したがって **この見積と乖離1,034件の見積(579人日)を単純合算してはいけない。**'
      '重複を除いた実数を出すには、課題キーと機能Noの対応付けを先に作る必要がある。')

    A('\n## この見積の前提と限界\n')
    A(f'- 確信度 low が {sum(1 for r in rows if r["確信度"] == "low")}件ある。'
      'チケット本文だけでは影響範囲が判断できず、コードを追い切れなかったもの。')
    A('- 状態が `実装中(25%)` `レビュー中(80%)` の3件は残工数で見積もっている。')
    A(f'- 担当者未設定が {sum(1 for r in rows if not r["担当者"])}件。着手順の判断材料にはならない。')
    A('- 1枚に複数の不具合がまとまったチケットは、工数を合計で答えさせている'
      '（`内包件数` 列を参照）。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}\n      {OUT_TSV}')
    print(f'  {len(rows)}件 {total:.1f}人日 / 内包不具合 {items}件 / 要仕様確定 {len(nd)}件')
    print(f'  計画値(保守) {vals["保守"]:.0f}人日')


if __name__ == '__main__':
    main()
