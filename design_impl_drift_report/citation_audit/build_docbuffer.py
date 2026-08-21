#!/usr/bin/env python3
"""設計書最新化工数の感度分析。仮置きパラメータを振ってバッファ込みの計画値を出す。

不確かなのは次の5つ。それぞれ楽観/基準/保守の3水準を置き、組み合わせて幅を出す。
  A 1件あたり編集単価の掛け率（codex見積が下振れしている可能性）
  B 書籍単位の固定費（再生成・差分確認・改版管理・書籍レビュー）
  C レビュー往復・差し戻しの係数
  D 裁定の意思決定工数（RESOLVE/UNSURE。反映作業とは別）
  E 方針リスク（設計書を正とせず実装に合わせる行が増え、NONE→FIX が発生する割合）
"""
import csv, os
from collections import Counter

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
MD = os.path.join(REPORT, 'DOC_UPDATE_ESTIMATE.md')

FIX_UNIT = 0.13     # NONE→FIX に転んだ場合の1件あたり（FIX実績の平均）

SCEN = {
    #        A単価  B固定費/冊  C係数  D裁定/件  E方針リスク
    '楽観': (1.00, 0.50, 1.15, 0.00, 0.00),
    '基準': (1.25, 0.75, 1.30, 0.25, 0.10),
    '保守': (1.50, 1.50, 1.60, 0.50, 0.25),
}


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))

    def dv(r):
        try:
            return float(r['設計書工数'] or 0)
        except ValueError:
            return 0.0

    tgt = [r for r in rows if r['設計書作業']]
    work = [r for r in tgt if r['設計書作業'] not in ('NONE', '')]
    edit = sum(dv(r) for r in tgt)
    import re
    bw = set()
    for r in work:
        for m in re.finditer(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']):
            bw.add(m.group(1))
    nbook = len(bw)
    ndecide = sum(1 for r in tgt if r['設計書作業'] in ('RESOLVE', 'UNSURE'))
    nnone = sum(1 for r in tgt if r['設計書作業'] == 'NONE')

    print(f'素の見積: 編集 {edit:.1f}人日 / {nbook}冊 / 裁定対象 {ndecide}件 / NONE {nnone}件\n')

    out = []
    for name, (a, b, c, d, e) in SCEN.items():
        ed = edit * a
        fx = nbook * b
        dec = ndecide * d
        risk = nnone * e * FIX_UNIT
        total = (ed + fx + risk) * c + dec
        out.append((name, a, b, c, d, e, ed, fx, risk, dec, total))
        print(f'{name}: 編集{ed:6.1f} 固定費{fx:6.1f} 方針リスク{risk:5.1f} '
              f'→×{c} ＋裁定{dec:5.1f} = {total:6.1f}人日')

    lo = min(x[-1] for x in out)
    hi = max(x[-1] for x in out)
    base = [x for x in out if x[0] == '基準'][0][-1]
    plan = hi

    L, A = [], lambda x: L.append(x)
    A('\n\n## バッファ込みの計画値\n')
    A('固定費・レビュー係数・裁定工数は実測ではなく仮置きなので、'
      '振れ幅を明示して計画値を出す。')
    A('')
    A('### 振ったパラメータ\n')
    A('| | 楽観 | 基準 | 保守 | 根拠 |')
    A('|---|---:|---:|---:|---|')
    A(f'| A 1件単価の掛け率 | {SCEN["楽観"][0]} | {SCEN["基準"][0]} | {SCEN["保守"][0]} | '
      'codexの1件見積は「どこを直すか分かっている前提」で、調査分が入っていない |')
    A(f'| B 書籍固定費(人日/冊) | {SCEN["楽観"][1]} | {SCEN["基準"][1]} | {SCEN["保守"][1]} | '
      '変換実行・差分確認・verify確認・改版履歴・書籍レビュー。実測なし |')
    A(f'| C レビュー往復係数 | {SCEN["楽観"][2]} | {SCEN["基準"][2]} | {SCEN["保守"][2]} | '
      '設計レビューの差し戻し回数。実測なし |')
    A(f'| D 裁定の意思決定(人日/件) | {SCEN["楽観"][3]} | {SCEN["基準"][3]} | {SCEN["保守"][3]} | '
      f'RESOLVE/UNSURE {ndecide}件。正本内の矛盾をどちらに寄せるか決める会議・確認 |')
    A(f'| E 方針リスク(NONE→FIX率) | {SCEN["楽観"][4]:.0%} | {SCEN["基準"][4]:.0%} | '
      f'{SCEN["保守"][4]:.0%} | '
      f'「実装を正」に倒す行が出ると NONE {nnone}件の一部が設計書修正に変わる |')

    A('\n### 結果\n')
    A('| シナリオ | 編集 | 書籍固定費 | 方針リスク | 裁定 | **合計(人日)** |')
    A('|---|---:|---:|---:|---:|---:|')
    for n, a, b, c, d, e, ed, fx, risk, dec, t in out:
        A(f'| {n} | {ed:.1f} | {fx:.1f} | {risk:.1f} | {dec:.1f} | **{t:.0f}** |')

    A('')
    A(f'**計画値は保守シナリオの {plan:.0f}人日 を推奨する。**'
      f'（楽観 {lo:.0f} 〜 保守 {hi:.0f}、基準 {base:.0f}）')
    A('')
    A('仮置きが3つ重なっているため、基準値で計画すると'
      f'超過する確率が高い。保守値なら素の見積 {edit:.0f}人日 に対して'
      f'{plan/edit:.1f}倍のバッファを持つことになる。')
    A('')
    A('**先に潰すべき不確かさ**')
    A('')
    A(f'1. **書籍固定費B** — 1冊やってみれば実測できる。全体の'
      f'{nbook*SCEN["保守"][1]/plan*100:.0f}%（保守値で{nbook*SCEN["保守"][1]:.0f}人日）を占め、'
      '振れ幅も3倍と最大。0214(イベント管理)あたりを1冊通して測るのが早い。')
    A(f'2. **裁定D** — {ndecide}件の矛盾をどちらに寄せるか。'
      '開発工数ではなく意思決定なので、着手前に片付けておかないと全体が止まる。')
    A(f'3. **方針E** — 「設計書と実装のどちらを正とするか」を機能単位で決めておけば、'
      f'NONE {nnone}件が動くかどうかが確定する。')

    open(MD, 'a', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'\n計画値(保守) {plan:.0f}人日  幅 {lo:.0f}〜{hi:.0f}  追記: {MD}')


if __name__ == '__main__':
    main()
