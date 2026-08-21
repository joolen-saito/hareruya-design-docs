#!/usr/bin/env python3
"""機械検証 + codex批判的レビューの結果を統合し、トリアージ表を出力する。

入力:
  ../drift_findings_list_final.tsv        現行の指摘一覧
  mech_check.json                          機械検証(引用実在/参照整合/陳腐化)
  review_results/rv_*.json                 第1次批判的レビュー(未実装行・分類のみ)
  recheck_results/rc_*.json, rc2_*.json    今回の再事実確認(分類＋再現性)

出力:
  ../drift_findings_list_triaged.tsv       トリアージ区分・優先度つき一覧
  ../TRIAGE_SUMMARY.md                     集計サマリ
"""
import csv, json, glob, os, sys
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_final.tsv')
OUT = os.path.join(REPORT, 'drift_findings_list_triaged.tsv')
MD = os.path.join(REPORT, 'TRIAGE_SUMMARY.md')

ADD = ['機械検証_引用', '機械検証_実装参照', '機械検証_陳腐化',
       '再検証_分類判定', '再検証_訂正区分', '再検証_再現判定', '再検証_実害',
       '再検証_確信度', '再検証_根拠', '再検証_現実装', '再検証_検索記録',
       '確定根拠区分', 'トリアージ区分', '優先度']

CLOSE = {'UNSUPPORTED', 'ALREADY_MET'}


def flat(s):
    return (s or '').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')


def load(pattern):
    d = {}
    for p in sorted(glob.glob(os.path.join(BASE, pattern))):
        try:
            j = json.load(open(p, encoding='utf-8'), strict=False)
        except Exception as e:
            print(f'  !! 読めない: {os.path.basename(p)} ({e})', file=sys.stderr)
            continue
        for r in j.get('results', []):
            d[int(r['rowId'])] = r
    return d


# 正本内部の矛盾(テキストセル vs レイアウト画像 等)を指すレビュー記述
CONFLICT = ('矛盾', '衝突', '両立しない', '一意に定まらない', '一意に決められない', '一意に決め')


def triage(final_cls, drift, cls_verdict, conf, reason=''):
    """トリアージ区分を決定的に導く。"""
    if final_cls in CLOSE:
        return '誤検出-クローズ'
    if drift == 'RESOLVED':
        return '解消済-クローズ'
    if drift == 'UNSURE' and any(k in reason for k in CONFLICT):
        return '要設計判断(正本内で記述が矛盾)'
    if cls_verdict == 'UNSURE' or drift == 'UNSURE' or final_cls == 'UNCERTAIN' or conf == 'low':
        return '要再調査'
    if drift == 'MISDESCRIBED':
        return '要再起票(記述が事実と相違)'
    if drift == 'PARTIAL':
        return '一部解消-残差あり'
    if final_cls == 'SPEC_BACKED':
        return '要修正-設計準拠'
    if final_cls == 'LEGACY_BACKED':
        return '要修正-移植漏れ(設計書追記も要)'
    return '要再調査'


def priority(tri, sev, final_cls):
    if tri.endswith('クローズ'):
        return '-'
    if tri.startswith('要再調査'):
        return 'R'
    if tri.startswith('要設計判断'):
        return 'D'
    if sev == 'high':
        return 'P1'
    if sev == 'low':
        return 'P4'
    return 'P2' if final_cls == 'SPEC_BACKED' else 'P3'


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    mech = {m['rowId']: m for m in json.load(open(os.path.join(BASE, 'mech_check.json'), encoding='utf-8'))}
    rc = load('recheck_results/rc_*.json')
    rc2 = load('recheck_results/rc2_*.json')
    rc.update(rc2)                     # 第2ラウンドを優先
    print(f'再事実確認の結果: {len(rc)} 行分を読み込み')

    fields = list(rows[0].keys()) + ADD
    for i, r in enumerate(rows, 1):
        m = mech[i]
        v = rc.get(i)
        r['機械検証_引用'] = m['quoteVerdict']
        r['機械検証_実装参照'] = m['implVerdict']
        r['機械検証_陳腐化'] = m['staleVerdict']

        if v:
            r['再検証_分類判定'] = v.get('classVerdict', '')
            r['再検証_訂正区分'] = v.get('correctedClass') or ''
            r['再検証_再現判定'] = v.get('driftVerdict', '')
            r['再検証_実害'] = v.get('severityOpinion', '')
            r['再検証_確信度'] = v.get('confidence', '')
            r['再検証_根拠'] = flat(v.get('reason'))
            r['再検証_現実装'] = flat(v.get('currentImpl'))
            r['再検証_検索記録'] = flat(v.get('checkedQuote'))
            cls_verdict = v.get('classVerdict', '')
            final_cls = (v.get('correctedClass') or r['根拠区分']
                         if cls_verdict == 'REFUTED' else r['根拠区分'])
            drift = v.get('driftVerdict', '')
            conf = v.get('confidence', '')
            sev = v.get('severityOpinion') or r['重要度']
        else:
            for k in ADD[3:11]:
                r[k] = ''
            # 第1次レビュー済み・参照ファイル無変更 → 再現性は未測定だが陳腐化なし
            if r['レビュー結果']:
                r['再検証_分類判定'] = f"(第1次:{r['レビュー結果']})"
                r['再検証_再現判定'] = '未測定(参照ファイル無変更)'
                cls_verdict = r['レビュー結果']
            else:
                r['再検証_再現判定'] = '未取得'
                cls_verdict = ''
            final_cls = r['根拠区分']
            drift = ''
            conf = r['レビュー確信度']
            sev = r['重要度']

        r['確定根拠区分'] = final_cls
        tri = triage(final_cls, drift, cls_verdict, conf, r.get('再検証_根拠', ''))
        r['トリアージ区分'] = tri
        r['優先度'] = priority(tri, sev, final_cls)

    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    # ---- サマリ ----
    L = []
    A = L.append
    A('# 乖離指摘 再事実確認・トリアージ結果\n')
    A(f'対象: `drift_findings_list_final.tsv` {len(rows)}件\n')
    A(f'出力: `drift_findings_list_triaged.tsv`\n')

    A('\n## トリアージ区分\n')
    A('| 区分 | 件数 | 意味 |')
    A('|---|---:|---|')
    MEAN = {
        '要修正-設計準拠': 'Excel正本に裏付けがあり、実装が満たしていない。設計どおりに直す',
        '要修正-移植漏れ(設計書追記も要)': '正本に記述は無いが旧実装に根拠。移植漏れ＋設計書の記述漏れ',
        '要再起票(記述が事実と相違)': '乖離は残るが、指摘の実装実態の記述が現物と食い違う。書き直しが要る',
        '一部解消-残差あり': '一部は実装済み。残差だけを起票し直す',
        '解消済-クローズ': '再検証時点で実装が設計を満たしている',
        '誤検出-クローズ': '設計にも旧実装にも根拠が無い／既に充足。指摘自体が誤り',
        '要設計判断(正本内で記述が矛盾)': 'Excel正本の項目表とレイアウト画像などが食い違い、どちらが仕様か決まらない。設計側の裁定が要る',
        '要再調査': '判断材料不足・確信度低。追加調査が要る',
    }
    for k, n in Counter(r['トリアージ区分'] for r in rows).most_common():
        A(f'| {k} | {n} | {MEAN.get(k,"")} |')

    A('\n## 優先度\n')
    A('| 優先度 | 件数 | 基準 |')
    A('|---|---:|---|')
    PR = {'P1': '実害 high（業務停止・データ不整合・外部連携断）',
          'P2': '実害 med かつ設計書に裏付けあり',
          'P3': '実害 med かつ旧実装由来（移植漏れ）',
          'P4': '実害 low（文言・軽微）',
          'D': '設計側の裁定が要る（正本内で記述が矛盾）',
          'R': '要再調査', '-': 'クローズ（対応不要）'}
    for k in ['P1', 'P2', 'P3', 'P4', 'D', 'R', '-']:
        n = sum(1 for r in rows if r['優先度'] == k)
        if n:
            A(f'| {k} | {n} | {PR[k]} |')

    A('\n## 再検証の判定内訳\n')
    A('### 分類(根拠区分)の妥当性')
    A('| 判定 | 件数 |')
    A('|---|---:|')
    for k, n in Counter(r['再検証_分類判定'] for r in rows if r['再検証_分類判定']).most_common():
        A(f'| {k} | {n} |')
    A('\n### 現HEADでの再現性')
    A('| 判定 | 件数 |')
    A('|---|---:|')
    for k, n in Counter(r['再検証_再現判定'] for r in rows if r['再検証_再現判定']).most_common():
        A(f'| {k} | {n} |')

    A('\n### 分類の訂正')
    corr = Counter((r['根拠区分'], r['確定根拠区分']) for r in rows if r['根拠区分'] != r['確定根拠区分'])
    if corr:
        A('| 訂正前 | 訂正後 | 件数 |')
        A('|---|---|---:|')
        for (a, b), n in corr.most_common():
            A(f'| {a} | {b} | {n} |')
    else:
        A('訂正なし')

    A('\n## 機械検証\n')
    A('| 検査 | 結果 |')
    A('|---|---|')
    for key, label in [('機械検証_引用', '正本根拠の引用の所在'),
                       ('機械検証_実装参照', '実装参照ファイル/行の実在'),
                       ('機械検証_陳腐化', '検証時HEAD以降の実装変更')]:
        A(f'| {label} | ' + ' / '.join(f'{k}={v}' for k, v in Counter(r[key] for r in rows).most_common()) + ' |')

    A('\n## ドメイン別 要修正件数（P1-P3）\n')
    A('| ドメイン | P1 | P2 | P3 | P4 | 設計判断 | 要再調査 | クローズ |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|')
    dom = defaultdict(Counter)
    for r in rows:
        dom[r['ドメイン']][r['優先度']] += 1
    for k in sorted(dom, key=lambda x: -(dom[x]['P1'] * 100 + dom[x]['P2'] * 10 + dom[x]['P3'])):
        c = dom[k]
        A(f"| {k} | {c['P1']} | {c['P2']} | {c['P3']} | {c['P4']} | {c['D']} | {c['R']} | {c['-']} |")

    A('\n## P1（実害 high）一覧\n')
    p1 = [r for r in rows if r['優先度'] == 'P1']
    if p1:
        A('| 機能No | 指摘区分 | 確定根拠 | 再現 | 差分の要旨 |')
        A('|---|---|---|---|---|')
        for r in p1:
            A(f"| {r['機能No']} | {r['指摘区分']} | {r['確定根拠区分']} | {r['再検証_再現判定']} | {flat(r['差分内容'])[:90]} |")
    else:
        A('なし')

    def listing(title, pred, col='再検証_根拠'):
        sel = [r for r in rows if pred(r)]
        A(f'\n## {title}（{len(sel)}件）\n')
        if not sel:
            A('なし')
            return
        A('| 機能No | 指摘区分 | 判定 | 理由 |')
        A('|---|---|---|---|')
        for r in sel:
            v = r['再検証_訂正区分'] or r['再検証_再現判定']
            A(f"| {r['機能No']} | {r['指摘区分']} | {v} | {flat(r[col])[:160]} |")

    A('\n## 手法と限界\n')
    A('### やったこと')
    A('1. **機械検証**（`citation_audit/mech_check.py`）: 全1034件について、正本根拠の引用文字列が'
      '参照先HTMLの **Excel正本領域**（`function-design-embed` の外側）に実在するか、'
      '設計書参照のシート行範囲が整合するか、実装参照の `path:line` が現HEADに実在するか、'
      '検証時HEAD以降にその実装ファイルが変更されたかを判定した。')
    A('2. **codexによる批判的レビュー**（`citation_audit/RECHECK_TASK.md`）: '
      '前回のレビュー対象外だった695件（実装違い676＋根拠区分UNCERTAIN 19）を58パケットに分割し、'
      '「分類は正しいか」と「現HEADでも再現するか」の2軸で反証を試みさせた。'
      'さらに、レビュー済みだが検証後に実装ファイルが変更された97件を第2ラウンドで再確認した。')
    A('3. **トリアージ**（`citation_audit/apply_triage.py`）: 上記2つの結果から区分と優先度を'
      '決定的な規則で導いた。人手の裁量は入れていない。')

    A('\n### 限界（結果を読むときの注意）')
    A('- 機械検証の引用照合は**テキストのみ**を見る。Excel正本の文言は base64 埋め込み画像に'
      '入っていることが多く、`NOT_FOUND` / `EMBED_ONLY` は「不在」を意味しない。'
      f'実際、機械フラグと codex の判定は相関が弱かった（`EXCEL` でも {sum(1 for r in rows if r["機械検証_引用"]=="EXCEL" and r["再検証_分類判定"]=="REFUTED")}件が REFUTED）。')
    A('- `設計書参照` 列の行番号は、監査後にHTMLを再生成したため **723/1034 がシート範囲外**で、'
      'そのままでは追跡できない。追跡には `正本根拠` 列の引用文字列を使うこと。')
    A('- `実装参照` 列（旧監査由来）には行番号のずれが9件ある（例: `OrderController.php:91` だがファイルは86行）。'
      '一方 `対応の根拠(現develop)` 列の精度は高い（2100参照中 不良1件）。'
      '実装位置を追うときは後者を使うこと。')
    A('- 「未測定(参照ファイル無変更)」339件は、分類のレビューは済んでいるが再現性は'
      '**検証時HEADの記録に依拠**している。参照先ファイルが変わっていないことは機械確認済み。')
    A('- 「要設計判断」の切り出しは、レビュー記述に矛盾を示す語が含まれるかで機械判定している。'
      '境界例は「要再調査」に混ざり得る。')
    A('- 実害（severityOpinion）はレビュアーの見立てであり、業務側の合意ではない。')

    listing('誤検出としてクローズ', lambda r: r['トリアージ区分'] == '誤検出-クローズ')
    listing('再検証で解消済みと確認', lambda r: r['トリアージ区分'] == '解消済-クローズ')
    listing('記述が事実と相違（要再起票）', lambda r: r['トリアージ区分'] == '要再起票(記述が事実と相違)')
    listing('一部解消・残差あり', lambda r: r['トリアージ区分'] == '一部解消-残差あり')
    listing('要設計判断（Excel正本内でテキストと画像等が矛盾）',
            lambda r: r['トリアージ区分'].startswith('要設計判断'))
    listing('要再調査', lambda r: r['トリアージ区分'] == '要再調査')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')

    print(f'\n出力: {OUT}')
    print(f'      {MD}\n')
    for k, n in Counter(r['トリアージ区分'] for r in rows).most_common():
        print(f'  {k:36s} {n:5d}')
    print()
    for k in ['P1', 'P2', 'P3', 'P4', 'D', 'R', '-']:
        n = sum(1 for r in rows if r['優先度'] == k)
        print(f'  {k:4s} {n:5d}')


if __name__ == '__main__':
    main()
