#!/usr/bin/env python3
"""改修区分ごとの「1件あたりの作業時間」を工程別に出す。

1件あたりは中央値を基準にする（平均は少数の重い行に引きずられるため両方出す）。
工程1（設計書）は「設計書を触る行だけ」の中央値であり、触らない行では0。
"""
import csv, os, statistics as st
from collections import defaultdict

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_classified.tsv')
MD = os.path.join(REPORT, 'PER_ITEM_HOURS.md')

H = 8.0
INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
EX = {'1': 'ルートを1本足す／レスポンス組み立てを直す',
      '2': '翻訳値を1行直す／Twigの出力条件を移す',
      '3': 'マイグレーション＋Entity/Repository/バッチ＋既存データ再集計',
      '4': 'FormTypeに制約を1つ足す／CSV行検証を足す',
      '5': 'Controller・Repositoryの条件分岐を直す（1〜2ファイル）',
      '6': 'ルート・Controller・Service・Twigを新設',
      '7': 'スマレジ/メール/S3の呼び出し経路を追加・差し替え',
      '8': 'トランザクション境界を組み替える'}


def n(v):
    try:
        return float(v or 0)
    except (ValueError, TypeError):
        return 0.0


def q(vals, p):
    if not vals:
        return 0.0
    s = sorted(vals)
    k = (len(s) - 1) * p
    f = int(k)
    return s[f] if f + 1 >= len(s) else s[f] + (s[f + 1] - s[f]) * (k - f)


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    C = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))

    impl = defaultdict(list)      # 区分 -> 実装見積(人日) の配列（見積が取れた行のみ）
    doc = defaultdict(list)       # 区分 -> 設計書工数(人日)（設計書を触る行のみ）
    src = defaultdict(lambda: defaultdict(list))
    for r in F:
        k = r['確定改修区分']
        if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES':
            impl[k].append(n(r['codex工数']))
            src['乖離'][k].append(n(r['codex工数']))
        if r['設計書作業'] not in ('NONE', '', 'UNSURE'):
            doc[k].append(n(r['設計書工数']))
    for r in C:
        k = r['改修区分']
        if r['仕様確定要'] != 'YES':
            impl[k].append(n(r['実装見積']))
            src['BL'][k].append(n(r['実装見積']))
        if r['設計書作業'] not in ('NONE', '', 'UNSURE'):
            doc[k].append(n(r['設計書工数']))

    L, A = [], lambda x: L.append(x)
    A('# 改修区分ごとの1件あたり作業時間\n')
    A('1人日 = 8時間。**基準は中央値**（平均は少数の重い行に引きずられる）。')
    A('工程は 1 基本設計書 → 2 実装修正 → 3 ユニットテスト → 4 レビュー → 5 レビューバック対応。\n')
    A('| 工程 | 1件あたりの計算 |')
    A('|---|---|')
    A(f'| 1 基本設計書 | 設計書編集の見積 × (1 + 探索 {INV:.0%})。**設計書を触る行だけ**に発生 |')
    A(f'| 2 実装修正 | codexの実装見積 × (1 + 特定・影響範囲 {INV:.0%}) |')
    A(f'| 3 ユニットテスト | 工程2 × {UT:.0%} |')
    A(f'| 4 レビュー | (工程1 + 工程2) × {RV:.0%} |')
    A(f'| 5 レビューバック対応 | (工程1 + 工程2) × {RB:.0%} |')
    A('')
    A('工程1・2の見積はcodexが1件ずつ実物を見て出した値。**工程3-5は係数であり実測ではない。**')

    A('\n## 1件あたりの作業時間（中央値・時間）\n')
    A('| 区分 | 件数 | 1 設計書 | 2 実装 | 3 UT | 4 レビュー | 5 レビューバック | **計** | 作業内容 |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|---|')
    for k in sorted(NAME):
        v = impl[k]
        if not v:
            continue
        m = st.median(v) * (1 + INV)
        dm = (st.median(doc[k]) if doc[k] else 0.0) * (1 + INV)
        ut, rv, rb = m * UT, (m + dm) * RV, (m + dm) * RB
        tot = dm + m + ut + rv + rb
        A(f'| ({k}) {NAME[k]} | {len(v)} | {dm*H:.1f}h | {m*H:.1f}h | {ut*H:.1f}h | '
          f'{rv*H:.1f}h | {rb*H:.1f}h | **{tot*H:.1f}h** | {EX[k]} |')
    A('')
    A('工程1の列は**設計書を触る行だけ**の中央値。触らない行（1,281件中751件）では0になる。')

    A('\n## 実装だけの1件あたり（中央値と平均のずれ）\n')
    A('| 区分 | 件数 | 最小 | 25% | 中央値 | 75% | 最大 | 平均 | 中央値との差 |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|---|')
    for k in sorted(NAME):
        v = impl[k]
        if not v:
            continue
        med, avg = st.median(v), sum(v) / len(v)
        A(f'| ({k}) {NAME[k]} | {len(v)} | {min(v)*H:.1f}h | {q(v,.25)*H:.1f}h | '
          f'**{med*H:.1f}h** | {q(v,.75)*H:.1f}h | {max(v)*H:.0f}h | {avg*H:.1f}h | '
          f'{"平均が" + f"{avg/med:.1f}倍" if med else "—"} |')
    allv = [x for v in impl.values() for x in v]
    A(f'| **全体** | {len(allv)} | {min(allv)*H:.1f}h | {q(allv,.25)*H:.1f}h | '
      f'**{st.median(allv)*H:.1f}h** | {q(allv,.75)*H:.1f}h | {max(allv)*H:.0f}h | '
      f'{sum(allv)/len(allv)*H:.1f}h | |')
    A('')
    A('**分布は右に大きく歪んでいる。**どの区分も平均が中央値を上回り、'
      '少数の重い行が総額を作っている。計画では中央値で人数を見積もると足りない。')

    A('\n## 平均で見た1件あたり（総額を件数で割った値）\n')
    A('総額を積むときはこちらが実態に近い。')
    A('')
    A('| 区分 | 件数 | 実装計(人日) | 1件平均(実装) | 1件平均(5工程込み) |')
    A('|---|---:|---:|---:|---:|')
    for k in sorted(NAME):
        v = impl[k]
        if not v:
            continue
        s = sum(v)
        A(f'| ({k}) {NAME[k]} | {len(v)} | {s:.1f} | {s/len(v)*H:.1f}h | '
          f'{s/len(v)*(1+INV)*(1+UT+RV+RB)*H:.1f}h |')
    s = sum(allv)
    A(f'| **計** | **{len(allv)}** | **{s:.1f}** | **{s/len(allv)*H:.1f}h** | '
      f'**{s/len(allv)*(1+INV)*(1+UT+RV+RB)*H:.1f}h** |')

    A('\n## 乖離側とBacklog側の単価差\n')
    A('| 区分 | 乖離 件数 | 乖離 中央値 | BL 件数 | BL 中央値 |')
    A('|---|---:|---:|---:|---:|')
    for k in sorted(NAME):
        a, b = src['乖離'][k], src['BL'][k]
        if not a and not b:
            continue
        A(f'| ({k}) {NAME[k]} | {len(a)} | {st.median(a)*H:.1f}h | {len(b)} | '
          f'{st.median(b)*H:.1f}h |' if b else
          f'| ({k}) {NAME[k]} | {len(a)} | {st.median(a)*H:.1f}h | 0 | — |')
    A('')
    A('Backlog側は起票・再現が済んでいるぶん本来は軽いはずだが、'
      f'ここでは乖離側と同じ探索{INV:.0%}を当てている。**その分は保守側に振れている。**')

    A('\n## この数字の限界\n')
    A(f'- **工程3-5は係数であり実測ではない。**1件あたりの計 のうち'
      f'{(UT+RV+RB)/(1+UT+RV+RB)*100:.0f}%前後がここから来ている。')
    A(f'- **探索の上乗せ{INV:.0%}も仮置き。**全区分一律で当てており、'
      '翻訳値1行の画面表示と複数層を追うデータ永続化を同じ率にしているのは粗い。')
    A('- 中央値は「典型的な1件」であって、総額の割り算ではない。'
      '人員計画には平均、個別のタスク見積には中央値を使い分けること。')
    A('- 同じ機能・同じ区分の指摘をまとめて直せば2件目以降は安くなる。'
      'この表は1件を単独で直す前提の値。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    for k in sorted(NAME):
        v = impl[k]
        if v:
            print(f'  ({k}) {NAME[k]}: n={len(v)} 中央値 {st.median(v)*H:.1f}h '
                  f'平均 {sum(v)/len(v)*H:.1f}h')


if __name__ == '__main__':
    main()
