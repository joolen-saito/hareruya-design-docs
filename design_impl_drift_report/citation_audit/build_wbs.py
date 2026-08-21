#!/usr/bin/env python3
"""工数を実際の工程に分解した内訳を出す。

工程（設計書・実装作業の実フロー）:
  1 基本設計書   正本Excelを直す
  2 実装修正     コードを直す（該当箇所の特定・影響範囲確認を含む）
  3 ユニットテスト
  4 レビュー
  5 レビューバック対応

見積の素データがどの工程に対応し、どこが係数で作った数字かを明示する。
"""
import csv, os, statistics as st
from collections import defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
MD = os.path.join(REPORT, 'WBS_BREAKDOWN.md')

HOURS = 8.0
INVESTIGATE = 0.5     # 工程2に含める該当箇所特定・影響範囲確認（codex見積に対する上乗せ）
# 書籍単位の固定費(人日/冊)。工程1と工程4に割り振る
BOOK_MAKE = 0.50      # 工程1: 再生成・差分確認・改版管理
BOOK_REVIEW = 0.25    # 工程4: 書籍単位の設計レビュー
BOOK_FIXED = BOOK_MAKE + BOOK_REVIEW

# 工程3-5 の比率（工程2に対する）
STEPS = [('3 ユニットテスト', 0.30, 'テストコードを書く／既存テストを直す。実行して通す'),
         ('4 レビュー', 0.10, 'PRを出し、レビュアーが見る時間'),
         ('5 レビューバック対応', 0.20, '指摘を直して再レビューに出す。往復ぶん')]
POST = sum(p for _, p, _ in STEPS)

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
EX = {'1': 'ルートを1本足す／レスポンス組み立ての1ファイルを直す',
      '2': 'messages.ja.yaml の翻訳値を1行直す／Twigの出力条件を移す',
      '3': 'マイグレーションを書き、Entity・Repository・バッチを直し、既存データを再集計する',
      '4': 'FormTypeに制約を1つ足す／CSV行検証に重複判定を足す',
      '5': 'Controller・Repositoryの条件分岐を直す（1〜2ファイル）',
      '6': 'ルート・Controller・Service・Twigを新設する（既存基盤は流用）',
      '7': 'スマレジ/メール/S3の呼び出し経路を追加または差し替える',
      '8': 'トランザクション境界を組み替える／set_time_limitを1行足す'}


def num(v):
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    B = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))
    fix = [r for r in F if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES']
    bfix = [r for r in B if r['仕様確定要'] != 'YES']
    doc = [r for r in F if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    docmap = {id(r): num(r['設計書工数']) for r in doc}
    books = set()
    import re
    for r in doc:
        m = re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照'])
        if m:
            books.add(m.group(1))
    b_fixed = len(books) * BOOK_FIXED

    L, A = [], lambda x: L.append(x)
    A('# 工数の工程別内訳\n')
    A('工程は **基本設計書 → 実装修正 → ユニットテスト → レビュー → レビューバック対応**。')
    A('各工数がどの工程の時間で、どこが実測でどこが仮置きかを示す。')
    A(f'1人日 = {HOURS:.0f}時間。\n')

    A('## 工程の定義と、見積の出どころ\n')
    A('| 工程 | 作業内容 | 見積の出どころ |')
    A('|---|---|---|')
    A('| **1 基本設計書** | 正本Excelのセル・表・画像を直す。'
      '該当シートを特定し、記述を足す/直す。書籍単位で再生成・差分確認・改版管理・レビュー '
      '| codexが1件ずつ見積（519件・70.4人日）＋書籍固定費 |')
    A('| **2 実装修正** | コードを直す。該当箇所の特定と影響範囲の確認を含む '
      f'| codexが1件ずつ見積（実コードを見て判断）＋特定・影響範囲ぶん{INVESTIGATE:.0%}上乗せ |')
    A('| **3 ユニットテスト** | テストコードを書く／既存テストを直す。実行して通す '
      f'| **係数（工程2の{STEPS[0][1]:.0%}）。実測なし** |')
    A('| **4 レビュー** | PRを出し、レビュアーが見る '
      f'| **係数（工程2の{STEPS[1][1]:.0%}）。実測なし** |')
    A('| **5 レビューバック対応** | 指摘を直して再レビューに出す。往復ぶん '
      f'| **係数（工程2の{STEPS[2][1]:.0%}）。実測なし** |')
    A('')
    A('**codexが実コードを見て個別に判断したのは工程1と工程2だけ**である。'
      '根拠欄には「messages.ja.yamlの翻訳値を1行修正する」「1ファイル内の局所修正」'
      '「2ファイルにまたがる」と、触る対象と範囲が書かれている。')
    A('')
    A('工程1は全件に発生するわけではない。'
      f'設計書に記述がある行（実装だけ直せばよい）は工程1が0で、'
      f'実際に設計書を触るのは {len(doc)}件 / {len(books)}冊。')

    # ---- 軸A ----
    A('\n## 設計書乖離 1,034件：改修区分 × 工程（人日）\n')
    by = defaultdict(list)
    for r in fix:
        by[r['確定改修区分']].append(r)
    A('| 区分 | 実装件数 | 設計書件数 | 1 設計書 | 2 実装修正 | 3 UT | 4 レビュー | 5 レビューバック | 計 |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|---:|')
    tot = defaultdict(float)
    docby = defaultdict(list)
    for r in doc:
        docby[r['確定改修区分']].append(r)
    for k in sorted(NAME):
        g = by.get(k, [])
        dg = docby.get(k, [])
        if not g and not dg:
            continue
        # 工程1: 設計書の編集は「実装見積が取れた行」に限らず全行で発生する
        d1 = sum(num(r['設計書工数']) for r in dg) * (1 + INVESTIGATE)
        im = sum(num(r['codex工数']) for r in g) * (1 + INVESTIGATE)
        ut = im * STEPS[0][1]
        rv = (im + d1) * STEPS[1][1]          # レビューは設計書にも発生する
        rb = (im + d1) * STEPS[2][1]          # レビューバックも同様
        tot['1'] += d1
        tot['2'] += im
        tot[STEPS[0][0]] += ut
        tot[STEPS[1][0]] += rv
        tot[STEPS[2][0]] += rb
        A(f'| ({k}) {NAME[k]} | {len(g)} | {len(dg)} | {d1:.0f} | {im:.0f} | '
          f'{ut:.0f} | {rv:.0f} | {rb:.0f} | **{d1+im+ut+rv+rb:.0f}** |')
    bm, br = len(books) * BOOK_MAKE, len(books) * BOOK_REVIEW
    tot['1'] += bm
    tot[STEPS[1][0]] += br
    A(f'| 書籍単位の固定費 | — | {len(books)}冊 | {bm:.0f} | — | — | {br:.0f} | — | **{bm+br:.0f}** |')
    a_tot = tot['1'] + tot['2'] + sum(tot[nm] for nm, _, _ in STEPS)
    A(f'| **計** | **{len(fix)}** | **{len(doc)}** | **{tot["1"]:.0f}** | **{tot["2"]:.0f}** | '
      + ' | '.join(f'**{tot[nm]:.0f}**' for nm, _, _ in STEPS) + f' | **{a_tot:.0f}** |')
    A('')
    A('工程1は**実装の見積が取れなかった行でも発生する**（設計判断待ち・仕様確定待ちでも'
      f'設計書の記述漏れは書き足せる）。そのため設計書件数 {len(doc)} は実装件数 {len(fix)} と一致しない。')

    A('\n### 1件あたりの実時間（中央値）\n')
    A('| 区分 | 1 設計書 | 2 実装修正 | 3 UT | 4 レビュー | 5 レビューバック | 計 | 工程2で具体的に何をするか |')
    A('|---|---:|---:|---:|---:|---:|---:|---|')
    for k in sorted(NAME):
        g = by.get(k, [])
        if not g:
            continue
        dg = docby.get(k, [])
        dm = (st.median([num(r['設計書工数']) for r in dg]) if dg else 0.0) * (1 + INVESTIGATE)
        m = st.median([num(r['codex工数']) for r in g]) * (1 + INVESTIGATE)
        cells = [m * STEPS[0][1], (m + dm) * STEPS[1][1], (m + dm) * STEPS[2][1]]
        A(f'| ({k}) {NAME[k]} | {dm*HOURS:.1f}h | {m*HOURS:.1f}h | '
          + ' | '.join(f'{c*HOURS:.1f}h' for c in cells)
          + f' | **{(dm+m+sum(cells))*HOURS:.1f}h** | {EX[k]} |')
    A('')
    A('工程1の列は「設計書を触る行だけ」の中央値。設計書を触らない行では0になる。')

    # ---- 軸C ----
    A('\n## Backlog 不具合・対応中 255件：改修区分 × 工程（人日）\n')
    A('チケットは**既に起票・再現済み**なので、工程2の特定・影響範囲ぶんは本来もっと軽い。'
      'ここでは同じ係数を当てており、保守側に振れている。')
    A('')
    A('| 区分 | 件数 | 2 実装修正 | 3 UT | 4 レビュー | 5 レビューバック | 計 |')
    A('|---|---:|---:|---:|---:|---:|---:|')
    cb = defaultdict(list)
    for r in bfix:
        cb[r['改修区分']].append(r)
    ct = defaultdict(float)
    for k in sorted(NAME):
        g = cb.get(k, [])
        if not g:
            continue
        im = sum(num(r['工数']) for r in g) * (1 + INVESTIGATE)
        cells = [im * p for _, p, _ in STEPS]
        ct['2'] += im
        for (nm, _, _), c in zip(STEPS, cells):
            ct[nm] += c
        A(f'| ({k}) {NAME[k]} | {len(g)} | {im:.0f} | '
          + ' | '.join(f'{c:.0f}' for c in cells) + f' | **{im+sum(cells):.0f}** |')
    c_tot = ct['2'] + sum(ct[nm] for nm, _, _ in STEPS)
    A(f'| **計** | **{len(bfix)}** | **{ct["2"]:.0f}** | '
      + ' | '.join(f'**{ct[nm]:.0f}**' for nm, _, _ in STEPS) + f' | **{c_tot:.0f}** |')
    A('')
    A('Backlog側にも設計書の修正が要る可能性はあるが、'
      'チケット単位では判定していないため工程1を積んでいない。**その分は下振れしている。**')

    # ---- 全体 ----
    A('\n## 工程別の総額\n')
    A('| 工程 | 乖離1,034件 | Backlog255件 | 計 | 割合 |')
    A('|---|---:|---:|---:|---:|')
    grand = a_tot + c_tot
    rows = [('1 基本設計書', tot['1'], 0.0),
            ('2 実装修正', tot['2'], ct['2'])]
    for nm, _, _ in STEPS:
        rows.append((nm, tot[nm], ct[nm]))
    for nm, av, cv in rows:
        A(f'| {nm} | {av:.0f} | {cv:.0f} | {av+cv:.0f} | {(av+cv)/grand*100:.0f}% |')
    A(f'| **合計** | **{a_tot:.0f}** | **{c_tot:.0f}** | **{grand:.0f}** | |')
    A('')
    A('見積不可153件（仕様確定待ち等）と、乖離とBacklogの重複ぶんはこの表に含めていない。')

    indiv = sum(num(r['設計書工数']) for r in doc) + tot['2'] / (1 + INVESTIGATE) + ct['2'] / (1 + INVESTIGATE)
    A('\n## どこが実測で、どこが仮置きか\n')
    A('| 工程 | 人日 | 根拠 |')
    A('|---|---:|---|')
    A(f'| 1 基本設計書 | {tot["1"]:.0f} | '
      f'1件ずつ「どのブックのどのシートの何を直すか」を判断（編集{sum(num(r["設計書工数"]) for r in doc):.1f}人日）。'
      f'該当シート特定{INVESTIGATE:.0%}上乗せと固定費{BOOK_FIXED}人日/冊は**仮置き** |')
    A(f'| 2 実装修正 | {tot["2"]+ct["2"]:.0f} | '
      f'1件ずつ実コードを見て判断（特定・影響範囲の{INVESTIGATE:.0%}上乗せは**仮置き**） |')
    A(f'| 3-5 UT・レビュー・レビューバック | '
      f'{sum(tot[nm]+ct[nm] for nm,_,_ in STEPS):.0f} | **すべて係数。実測なし** |')
    A('')
    A(f'**個別の根拠がある工程1・2で {indiv:.0f}人日（{indiv/grand*100:.0f}%）、'
      f'係数で作った工程3-5が {grand-indiv:.0f}人日（{(grand-indiv)/grand*100:.0f}%）。**')

    A('\n## 工程3-5の比率をどう決めるか\n')
    A('| 工程 | 工程2に対する比率 | 何をする時間か |')
    A('|---|---:|---|')
    for nm, p, d in STEPS:
        A(f'| {nm} | {p:.0%} | {d} |')
    A(f'| 計 | {POST:.0%} | |')
    A('')
    A('この比率に根拠はない。直近のPRから次を測れば置き換えられる。')
    A('')
    A('1. 修正コミットの作業時間に対する、テストコードのコミット時間の比 → 工程3')
    A('2. PR作成からapproveまでの、レビュアーの実作業時間 → 工程4')
    A('3. 初回PRからマージまでの、指摘対応コミットの時間 → 工程5')
    A('')
    A(f'工程3-5は全体の {(grand-indiv)/grand*100:.0f}% を占めるので、'
      'ここが実測に置き換わると総額の確度が大きく上がる。')

    A('\n## 妥当性の確かめ方\n')
    A('各区分から3件ずつ（計24件）実際に通してやってみれば、次が同時に取れる。')
    A('')
    A('- 工程1・2の個別見積が当たっているか（根拠欄に書かれた「触るファイル」と実際が合うか）')
    A(f'- 工程2の特定・影響範囲 {INVESTIGATE:.0%} が妥当か')
    A('- 工程3・4・5の比率')
    A('- 書籍固定費 0.75人日/冊（1冊通してやる場合）')
    A('')
    A(f'24件・数日の作業で、{grand:.0f}人日の数字の根拠が固まる。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    print(f'  工程1 {tot["1"]:.0f} / 工程2 {tot["2"]+ct["2"]:.0f} / '
          f'工程3-5 {sum(tot[nm]+ct[nm] for nm,_,_ in STEPS):.0f}')
    print(f'  乖離 {a_tot:.0f} + Backlog {c_tot:.0f} = {grand:.0f}人日')
    print(f'  個別根拠 {indiv:.0f} ({indiv/grand*100:.0f}%) / 係数 {grand-indiv:.0f}')


if __name__ == '__main__':
    main()
