# -*- coding: utf-8 -*-
"""HTML設計書 再生成＆不具合再調査チェックリスト生成（drift_findings_list_remaining.tsv 由来／捏造ゼロ）"""
import csv, os, collections, json

ROOT = '/home/y-saito/Developments/hareruya-design-docs'
TSV = os.path.join(ROOT, 'design_impl_drift_report/drift_findings_list_remaining.tsv')
OUTDIR = os.path.join(ROOT, 'excel_to_html/output')
INDIR = os.path.join(ROOT, 'excel_to_html/input')
DEST = os.path.join(ROOT, 'design_impl_drift_report/HTML_REGEN_RECHECK_CHECKLIST.md')
STATE = os.path.join(ROOT, 'design_impl_drift_report/html_regen_checklist_state.tsv')  # チェック状態の正本（MDは生成物）

docs = sorted(f for f in os.listdir(OUTDIR) if f.endswith('.html') and f != 'index.html')
def _norm(n):
    return n.replace(' ', '').replace('\u3000', '')

# 0406 は入力ファイル名に半角スペースが混じる（'...管理) .xlsx'）ため空白除去で突合
inputs = {_norm(f) for f in os.listdir(INDIR)}

def stem(f):
    return f[:-len('.html')].strip()

# 長い名前を優先して排他マッチ（0211 の base と _詳細設計 の取り違え防止）
keys = sorted(((stem(d), d) for d in docs), key=lambda kv: -len(kv[0]))

rows = list(csv.DictReader(open(TSV, encoding='utf-8'), delimiter='\t'))

# チェック状態: DONE のみ完了扱い（空欄=未着手）。MDを手で編集しても再生成で消えるため、状態はこのTSVが正本
state = {}
if os.path.exists(STATE):
    for r in csv.DictReader(open(STATE, encoding='utf-8'), delimiter='\t'):
        state[r['設計書']] = r
def done(d, col):
    return (state.get(stem(d), {}).get(col) or '').strip().upper() == 'DONE'
def mark(d, col):
    return '☑' if done(d, col) else '☐'
def box(d, col):
    return '[x]' if done(d, col) else '[ ]'
def note(d, col):
    """再生成／再調査それぞれの備考を返す。列を分けて片方の上書きを防ぐ。"""
    r = state.get(stem(d), {})
    body = (r.get(col + '備考') or '').strip()
    if not body:  # 更新日だけの空注記を出さない（もう片方の欄の日付が漏れて見える）
        return ''
    return '　← %s' % ' '.join(x for x in ((r.get('更新日') or '').strip(), body) if x)

per = collections.defaultdict(lambda: collections.Counter())
per_ids = collections.defaultdict(set)
unmatched = []
for r in rows:
    hit = None
    for col in ('設計書参照', '設計書対象', '正本根拠'):  # 優先順位: 指摘が指す設計書 > 設計書作業対象 > 正本根拠
        ref = r.get(col) or ''
        for k, d in keys:
            if k in ref:
                hit = d
                break
        if hit:
            break
    if hit is None:
        unmatched.append(r); continue
    c = per[hit]
    c['total'] += 1
    if (r.get('設計書作業') or '') in ('ADD', 'FIX', 'IMAGE'):
        c['docwork'] += 1
    if (r.get('優先度') or '') == 'P1':
        c['p1'] += 1
    if (r.get('仕様確定要') or '') == 'YES':
        c['spec'] += 1
    if (r.get('トリアージ区分') or '') in ('要再調査', '要設計判断(正本内で記述が矛盾)', '要再起票(記述が事実と相違)'):
        c['recheck'] += 1
    per_ids[hit].add(r.get('機能No') or '')

assert not unmatched, len(unmatched)

def group(d):
    n = d[:2]
    return {'00': '0000 共通', '02': '02xx 管理画面', '03': '03xx フロント',
            '04': '04xx バッチ', '05': '05xx API', '06': '06xx その他'}.get(n, 'その他')

lines = []
A = lines.append
A('# HTML設計書 再生成＆不具合再調査 チェックリスト')
A('')
A('- 分母（HTML設計書 総数）: **%d本**（`excel_to_html/output/*.html` から `index.html` を除いた全数）' % len(docs))
A('- 不具合（乖離指摘）母数: **%d件**（`design_impl_drift_report/drift_findings_list_remaining.tsv`）' % len(rows))
A('- 割り当て: 指摘の `設計書参照` 列に現れる設計書名で機械割当。同列が別資料（`function_spec_html_preview/*`）を指す3件のみ `設計書対象` 列で割当。**未割当 0件**')
A('- 生成: `python3 design_impl_drift_report/build_html_regen_checklist.py` で再生成可（件数は全て機械集計、手入力なし）')
A('- 運用: **① 再生成** にチェックが入った設計書から **② 不具合再調査** に着手する')
A('- チェック状態の正本は `design_impl_drift_report/html_regen_checklist_state.tsv`（`再生成` / `再調査` 列に `DONE`、備考は `再生成備考` / `再調査備考` に分けて記録）。このMDは生成物なので直接編集しても再生成で消える')
A('')
A('## 判定欄の意味')
A('')
A('| 欄 | 意味 |')
A('| --- | --- |')
A('| ① 再生成 | 当該HTML設計書を最新の変換器で再生成し、内容欠落が無いことを確認済み |')
A('| ② 再調査 | 再生成後のHTMLを正本として、その設計書に紐づく残指摘を全件再判定済み |')
A('')
A('## サマリ（設計書別）')
A('')
A('| No | 設計書 | 入力xlsx | 残指摘 | 設計書反映要 | P1 | 仕様確定要 | 要再調査系 | ① 再生成 | ② 再調査 |')
A('| --- | --- | :---: | ---: | ---: | ---: | ---: | ---: | :---: | :---: |')
tot = collections.Counter()
for i, d in enumerate(docs, 1):
    c = per[d]
    xl = stem(d) + '.xlsx'
    has = 'あり' if _norm(xl) in inputs else '—'
    for k in ('total', 'docwork', 'p1', 'spec', 'recheck'):
        tot[k] += c[k]
    A('| %d | %s | %s | %d | %d | %d | %d | %d | %s | %s |' %
      (i, stem(d), has, c['total'], c['docwork'], c['p1'], c['spec'], c['recheck'],
       mark(d, '再生成'), mark(d, '再調査')))
n_xl = sum(1 for d in docs if _norm(stem(d) + '.xlsx') in inputs)
n_regen = sum(1 for d in docs if done(d, '再生成'))
n_recheck = sum(1 for d in docs if done(d, '再調査'))
A('| — | **合計** | %d/%d | **%d** | **%d** | **%d** | **%d** | **%d** | %d/%d | %d/%d |' %
  (n_xl, len(docs), tot['total'], tot['docwork'], tot['p1'], tot['spec'], tot['recheck'],
   n_regen, len(docs), n_recheck, len(docs)))
A('')
A('- 「設計書反映要」= `設計書作業` が ADD / FIX / IMAGE の件数（設計書そのものを直す必要があると判定済みの指摘）')
A('- 「要再調査系」= `トリアージ区分` が 要再調査 / 要設計判断(正本内で記述が矛盾) / 要再起票(記述が事実と相違)')
A('- 「入力xlsx」が `—` の設計書は `excel_to_html/input/` に元Excelが無く、機能設計書(Markdown)からの生成物。再生成手順が別系統になる')
A('')
A('## チェックリスト（着手順）')
A('')
cur = None
for d in sorted(docs, key=lambda x: (-per[x]['total'], x)):
    pass
for g in ['0000 共通', '02xx 管理画面', '03xx フロント', '04xx バッチ', '05xx API', '06xx その他']:
    members = [d for d in docs if group(d) == g]
    if not members:
        continue
    A('### %s' % g)
    A('')
    for d in members:
        c = per[d]
        xl = stem(d) + '.xlsx'
        src = '入力xlsx あり' if _norm(xl) in inputs else '入力xlsx なし（Markdown起点）'
        A('- %s **%s** — 残指摘 %d件（設計書反映要 %d / P1 %d / 要再調査系 %d）／%s' %
          ('[x]' if (done(d, '再生成') and done(d, '再調査')) else '[ ]',
           stem(d), c['total'], c['docwork'], c['p1'], c['recheck'], src))
        A('  - %s ① 再生成（変換器で出力し、正本セル・画像・シート欠落なしを確認）%s'
          % (box(d, '再生成'), note(d, '再生成')))
        if c['total']:
            A('  - %s ② 不具合再調査（対象 %d件 / 機能 %d件）%s'
              % (box(d, '再調査'), c['total'], len(per_ids[d]), note(d, '再調査')))
        else:
            A('  - %s ② 不具合再調査（対象 0件 — 再生成の確認のみ）' % box(d, '再調査'))
    A('')
A('## 指摘0件の設計書')
A('')
zeros = [stem(d) for d in docs if per[d]['total'] == 0]
A('%d本: %s' % (len(zeros), '、'.join(zeros)))
A('')
A('再調査対象の指摘は無いが、再生成の欠落確認は他と同じく必要。')
A('')

open(DEST, 'w', encoding='utf-8').write('\n'.join(lines))
print('wrote', DEST, len(lines), 'lines')
