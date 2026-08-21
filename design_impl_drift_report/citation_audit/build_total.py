#!/usr/bin/env python3
"""3つの軸の工数を統合し、見積不可の行を1人日で埋めた全容を出す。

軸:
  A 実装の修正（設計書乖離 1,034件）
  B 設計書（正本Excel）の最新化
  C Backlog「不具合（バグ）」対応中チケット
見積が取れなかった行（仕様確定待ち・判断つかず）は、ユーザー指示により一律 1人日 で計上する。
"""
import csv, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
MD = os.path.join(REPORT, 'TOTAL_ESTIMATE.md')

UNEST = 1.0          # 見積不可・未見積の1件あたり（指示による仮置き）
PER_BOOK = 0.75      # 設計書の書籍単位固定費（再生成0.25＋改版・レビュー0.5）
SCEN = {'楽観': (1.00, 1.15), '基準': (1.25, 1.30), '保守': (1.50, 1.60)}


def num(v):
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    B = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))
    live = [r for r in F if not r['トリアージ区分'].endswith('クローズ')]
    fix = [r for r in live if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]

    # --- A 実装の修正 ---
    a_est = [r for r in fix if r['仕様確定要'] != 'YES']
    a_nd = [r for r in fix if r['仕様確定要'] == 'YES']          # 仕様確定待ち
    a_dr = [r for r in live if r['優先度'] in ('D', 'R')]        # 設計判断待ち・要再調査
    a_e = sum(num(r['codex工数']) for r in a_est)
    a_u = (len(a_nd) + len(a_dr)) * UNEST

    # --- B 設計書の最新化 ---
    b_work = [r for r in F if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    b_uns = [r for r in F if r['設計書作業'] == 'UNSURE']
    b_e = sum(num(r['設計書工数']) for r in b_work)
    b_u = len(b_uns) * UNEST
    books = set()
    for r in b_work + b_uns:
        m = re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照'])
        if m:
            books.add(m.group(1))
    b_fix = len(books) * PER_BOOK

    # --- C Backlog ---
    c_est = [r for r in B if r['仕様確定要'] != 'YES']
    c_nd = [r for r in B if r['仕様確定要'] == 'YES']
    c_e = sum(num(r['工数']) for r in c_est)
    c_u = len(c_nd) * UNEST

    L, A = [], lambda x: L.append(x)
    A('# 改修工数の全容\n')
    A('3つの軸の工数をまとめたもの。**見積が取れなかった行（仕様確定待ち・判断つかず）は'
      f'一律 {UNEST:.0f}人日 で計上**している（指示による仮置き）。')
    A('工数は実装／編集のみの素の値で、テスト・レビュー・リリース作業は含まない'
      '（含める係数は後段のシナリオ表に入れてある）。\n')

    A('## 素の見積（諸経費なし）\n')
    A('| 軸 | 見積済 | 人日 | 見積不可 | ×1人日 | 固定費 | 小計 |')
    A('|---|---:|---:|---:|---:|---:|---:|')
    A(f'| A 実装の修正（乖離1,034件） | {len(a_est)} | {a_e:.1f} | '
      f'{len(a_nd)+len(a_dr)} | {a_u:.1f} | — | **{a_e+a_u:.1f}** |')
    A(f'| B 設計書（正本Excel）の最新化 | {len(b_work)} | {b_e:.1f} | '
      f'{len(b_uns)} | {b_u:.1f} | {b_fix:.1f} | **{b_e+b_u+b_fix:.1f}** |')
    A(f'| C Backlog 不具合・対応中 | {len(c_est)} | {c_e:.1f} | '
      f'{len(c_nd)} | {c_u:.1f} | — | **{c_e+c_u:.1f}** |')
    a_t, b_t, c_t = a_e + a_u, b_e + b_u + b_fix, c_e + c_u
    A(f'| **合計** | | **{a_e+b_e+c_e:.1f}** | '
      f'**{len(a_nd)+len(a_dr)+len(b_uns)+len(c_nd)}** | '
      f'**{a_u+b_u+c_u:.1f}** | **{b_fix:.1f}** | **{a_t+b_t+c_t:.1f}** |')

    A('\n### 見積不可の内訳\n')
    A('| 軸 | 種類 | 件数 |')
    A('|---|---|---:|')
    A(f'| A | 仕様確定待ち（設計が矛盾し何を作るか未定） | {len(a_nd)} |')
    A(f'| A | 設計判断待ち（正本内でテキストと画像が矛盾） | {sum(1 for r in a_dr if r["優先度"]=="D")} |')
    A(f'| A | 要再調査（確信度が低く判断材料不足） | {sum(1 for r in a_dr if r["優先度"]=="R")} |')
    A(f'| B | 設計書側の作業を判断できず | {len(b_uns)} |')
    A(f'| C | 仕様確定待ち | {len(c_nd)} |')
    A(f'| | **合計** | **{len(a_nd)+len(a_dr)+len(b_uns)+len(c_nd)}** |')
    A('')
    A(f'これらは本来「先に仕様を決める作業」であって開発工数ではない。'
      f'1人日は実態の裏付けがない仮置きなので、**{len(a_nd)+len(a_dr)+len(b_uns)+len(c_nd)}件を'
      f'意思決定タスクとして別枠に出す**ほうが計画は正確になる。')

    A('\n## バッファ込みの計画値\n')
    A('| シナリオ | 単価掛け率 | 諸経費係数 | A 実装 | B 設計書 | C Backlog | 合計 |')
    A('|---|---:|---:|---:|---:|---:|---:|')
    vals = {}
    for n, (mul, oh) in SCEN.items():
        av = (a_e * mul + a_u) * oh
        bv = (b_e * mul + b_u + b_fix) * oh
        cv = (c_e * mul + c_u) * oh
        vals[n] = (av, bv, cv, av + bv + cv)
        A(f'| {n} | {mul} | {oh} | {av:.0f} | {bv:.0f} | {cv:.0f} | **{av+bv+cv:.0f}** |')
    A('')
    A(f'**計画値は保守シナリオの {vals["保守"][3]:.0f}人日**（楽観 {vals["楽観"][3]:.0f} 〜 '
      f'保守 {vals["保守"][3]:.0f}、基準 {vals["基準"][3]:.0f}）。')
    A(f'1人月20人日なら約 {vals["保守"][3]/20:.0f}人月。')

    A('\n## AとCは重複する（合算不可）\n')
    A(f'- C の {sum(1 for r in B if r["種別"]=="未実装・実装乖離リスト")}件が種別'
      '「未実装・実装乖離リスト」で、A と同じ乖離分析に由来する可能性が高い。')
    A('- 課題キーと機能Noの対応表が残っておらず、機能Noが本文に現れるのは 82/255件だけで'
      '**厳密な突合ができない**。')
    A(f'- したがって上の合計 {vals["保守"][3]:.0f}人日 は**重複を含んだ上限値**である。')
    A(f'- 仮に C の 241件が全部 A に含まれるなら、C の実質増分は残り 14件ぶんに縮む。'
      f'その場合の計画値は **A+B のみで {vals["保守"][0]+vals["保守"][1]:.0f}人日** が下限側の目安。')
    A('- 実数を出すには、チケット本文の「分類／機能／設計書」欄と乖離リストの'
      '機能名・設計書参照を突合して対応表を作る必要がある。**これは機械的に作れる。**')

    A('\n## 軸別の中身\n')
    A('### A 実装の修正（改修区分別・見積済のみ）\n')
    A('| 区分 | 件数 | 人日 |')
    A('|---|---:|---:|')
    NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
            '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
    by = defaultdict(list)
    for r in a_est:
        by[r['確定改修区分']].append(r)
    for k in sorted(NAME):
        g = by.get(k, [])
        if g:
            A(f'| ({k}) {NAME[k]} | {len(g)} | {sum(num(r["codex工数"]) for r in g):.1f} |')

    A('\n### B 設計書の最新化（作業種別）\n')
    A('| 種類 | 件数 | 人日 |')
    A('|---|---:|---:|')
    WN = {'ADD': '記述を書き足す', 'FIX': '既存記述を直す',
          'IMAGE': '画面レイアウト画像を差し替える', 'RESOLVE': '正本内部の矛盾を解消する'}
    bw = defaultdict(list)
    for r in b_work:
        bw[r['設計書作業']].append(r)
    for k in ['ADD', 'FIX', 'IMAGE', 'RESOLVE']:
        g = bw.get(k, [])
        if g:
            A(f'| {k} {WN[k]} | {len(g)} | {sum(num(r["設計書工数"]) for r in g):.1f} |')
    A(f'| 書籍単位の固定費 | {len(books)}冊 | {b_fix:.1f} |')

    A('\n### C Backlog 不具合・対応中（改修区分別・見積済のみ）\n')
    A('| 区分 | 件数 | 人日 |')
    A('|---|---:|---:|')
    cb = defaultdict(list)
    for r in c_est:
        cb[r['改修区分']].append(r)
    for k in sorted(NAME):
        g = cb.get(k, [])
        if g:
            A(f'| ({k}) {NAME[k]} | {len(g)} | {sum(num(r["工数"]) for r in g):.1f} |')

    A('\n## 前提と限界\n')
    A(f'- 見積不可 {len(a_nd)+len(a_dr)+len(b_uns)+len(c_nd)}件の 1人日 は**指示による仮置き**で、'
      '実態の裏付けはない。実際は0.1人日で済むものから数人日かかるものまで混在する。')
    A('- 設計書の書籍固定費 0.75人日/冊、単価掛け率、諸経費係数はいずれも実測ではない。'
      '1冊やってみれば固定費は実測できる。')
    A('- A と C は重複する。合算値は上限として扱うこと。')
    A('- 「どちらを正とするか」の裁定そのもの（会議・確認）は工数に含めていない。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}\n')
    print(f'  A 実装   見積{len(a_est)}件 {a_e:.1f} + 不可{len(a_nd)+len(a_dr)}件 {a_u:.1f} = {a_t:.1f}')
    print(f'  B 設計書 見積{len(b_work)}件 {b_e:.1f} + 不可{len(b_uns)}件 {b_u:.1f} + 固定費 {b_fix:.1f} = {b_t:.1f}')
    print(f'  C BL     見積{len(c_est)}件 {c_e:.1f} + 不可{len(c_nd)}件 {c_u:.1f} = {c_t:.1f}')
    print(f'  素の合計 {a_t+b_t+c_t:.1f}人日')
    for n in SCEN:
        print(f'  {n}: {vals[n][3]:.0f}人日')


if __name__ == '__main__':
    main()
