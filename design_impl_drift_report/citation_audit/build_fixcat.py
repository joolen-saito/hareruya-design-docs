#!/usr/bin/env python3
"""1,281件（乖離1,034＋Backlog247）を改修区分の8分類で仕分けた内訳を出す。"""
import csv, os, re, statistics as st
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)
BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_classified.tsv')
MD = os.path.join(REPORT, 'FIX_CATEGORY_BREAKDOWN.md')

INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20
HOURS = 8.0

NAME = {'1': '外部インタフェース契約', '2': '画面表示', '3': 'データ永続化', '4': '入力検証',
        '5': '業務ロジック', '6': '未実装機能', '7': '外部連携・副作用', '8': '実行制御'}
DEF = {
    '1': 'ルート・URL・HTTPメソッド・リクエスト/レスポンスの形など、'
         '**外部から見える契約**が設計と違う。画面のフォーム送信先やCSVの列構成も含む',
    '2': '画面に出る**文言・ラベル・表示項目・並び順・活性制御**が設計と違う。'
         '翻訳値やTwigの出力条件が対象',
    '3': '**保存先テーブル・カラム・永続値・削除方式**が設計と違う。'
         'マイグレーションと既存データの再集計を伴う',
    '4': '**入力チェック**が設計と違う。必須・桁数・形式・重複判定など。'
         'FormTypeの制約やCSV行検証が対象',
    '5': '**抽出条件・計算・ステータス遷移・分岐**が設計と違う。Controller/Repositoryの条件式',
    '6': '設計が求める**機能そのものが存在しない**。ルート・Controller・Service・Twigの新設',
    '7': '**スマレジ/S3/メール送信/支店通知/監査ログ**など、外部への副作用が設計と違う',
    '8': '**トランザクション境界・排他制御・実行時間制限**など、実行のしかたが設計と違う',
}
EX = {'1': 'ルートを1本足す／レスポンス組み立ての1ファイルを直す',
      '2': 'messages.ja.yaml の翻訳値を1行直す／Twigの出力条件を移す',
      '3': 'マイグレーションを書き、Entity・Repository・バッチを直し、既存データを再集計する',
      '4': 'FormTypeに制約を1つ足す／CSV行検証に重複判定を足す',
      '5': 'Controller・Repositoryの条件分岐を直す（1〜2ファイル）',
      '6': 'ルート・Controller・Service・Twigを新設する（既存基盤は流用）',
      '7': 'スマレジ/メール/S3の呼び出し経路を追加または差し替える',
      '8': 'トランザクション境界を組み替える／set_time_limitを1行足す'}


def n(v):
    try:
        return float(v or 0)
    except (ValueError, TypeError):
        return 0.0


def flat(s, m=120):
    s = re.sub(r'[\s　]+', ' ', str(s or '')).strip()
    return s[:m] + ('…' if len(s) > m else '')


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    C = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))

    # 共通スキーマへ寄せる
    U = []
    for r in F:
        U.append({'src': '乖離', 'cat': r['確定改修区分'], 'id': r['機能No'],
                  'name': r['機能名'], 'dom': r['ドメイン'],
                  'pri': r['優先度'], 'kind': r['指摘区分'], 'basis': r['確定根拠区分'],
                  'doc': r['設計書作業'], 'days': n(r['codex工数']),
                  'est': r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES',
                  'target': r['直す対象'], 'why': r['工数根拠'], 'diff': r['差分内容']})
    for r in C:
        U.append({'src': 'BL', 'cat': r['改修区分'], 'id': r['課題キー'],
                  'name': r['件名'], 'dom': '', 'pri': r['優先度(実害基準)'],
                  'kind': r['指摘区分'], 'basis': r['根拠区分'], 'doc': r['設計書作業'],
                  'days': n(r['実装見積']), 'est': r['仕様確定要'] != 'YES',
                  'target': r['直す対象'], 'why': r['見積根拠'], 'diff': r['件名']})

    by = defaultdict(list)
    for r in U:
        by[r['cat']].append(r)

    L, A = [], lambda x: L.append(x)
    A('# 改修区分による仕分け（1,281件）\n')
    A('設計書乖離1,034件とBacklog不具合247件を、**8つの改修区分**にまとめたもの。'
      '区分は「どこを、どう直すか」で分けてある。')
    A('')
    A('工数は実装のみの素の値。仕様確定待ちの行は工数を積んでいない。'
      '「工程2-5」は 実装見積 × 1.5 × 1.6 の概算で、**工程1（設計書）を含まない**。'
      '工程1を含む正式な積み上げは `MANMONTH_BY_CATEGORY.md` を参照。\n')

    A('## 全体\n')
    A('| 区分 | 乖離 | BL | 計 | 見積可 | 実装(人日) | 工程2-5(概算) | 1件中央値 |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|')
    tot = te = 0
    for k in sorted(NAME):
        g = by[k]
        e = [r for r in g if r['est']]
        d = sum(r['days'] for r in e)
        med = st.median([r['days'] for r in e]) if e else 0
        tot += len(g)
        te += d
        A(f'| ({k}) {NAME[k]} | {sum(1 for r in g if r["src"]=="乖離")} | '
          f'{sum(1 for r in g if r["src"]=="BL")} | **{len(g)}** | {len(e)} | {d:.1f} | '
          f'{d*(1+INV)*(1+UT+RV+RB):.0f} | {med*HOURS:.1f}h |')
    A(f'| **計** | **{len(F)}** | **{len(C)}** | **{tot}** | '
      f'**{sum(1 for r in U if r["est"])}** | **{te:.1f}** | '
      f'**{te*(1+INV)*(1+UT+RV+RB):.0f}** | |')
    A('')
    A('**件数が多い区分と工数が重い区分は一致しない。**'
      f'画面表示は{len(by["2"])}件で{sum(r["days"] for r in by["2"] if r["est"]):.0f}人日、'
      f'データ永続化は{len(by["3"])}件で{sum(r["days"] for r in by["3"] if r["est"]):.0f}人日。')

    A('\n## 優先度の分布\n')
    A('| 区分 | P1 | P2 | P3 | P4 | D | R | クローズ |')
    A('|---|---:|---:|---:|---:|---:|---:|---:|')
    for k in sorted(NAME):
        c = Counter(r['pri'] for r in by[k])
        A(f'| ({k}) {NAME[k]} | ' + ' | '.join(
            str(c.get(p, 0)) for p in ['P1', 'P2', 'P3', 'P4', 'D', 'R', '-']) + ' |')
    cc = Counter(r['pri'] for r in U)
    A('| **計** | ' + ' | '.join(
        f'**{cc.get(p,0)}**' for p in ['P1', 'P2', 'P3', 'P4', 'D', 'R', '-']) + ' |')

    A('\n## 指摘の性質と根拠\n')
    A('| 区分 | 未実装 | 実装違い | 正本に裏付け | 移植漏れ | 設計書も直す |')
    A('|---|---:|---:|---:|---:|---:|')
    for k in sorted(NAME):
        g = by[k]
        A(f'| ({k}) {NAME[k]} | {sum(1 for r in g if r["kind"]=="未実装")} | '
          f'{sum(1 for r in g if r["kind"]=="実装違い")} | '
          f'{sum(1 for r in g if r["basis"]=="SPEC_BACKED")} | '
          f'{sum(1 for r in g if r["basis"]=="LEGACY_BACKED")} | '
          f'{sum(1 for r in g if r["doc"] not in ("NONE", "", "UNSURE"))} |')

    # ---- 区分ごとの詳細 ----
    for k in sorted(NAME):
        g = by[k]
        e = [r for r in g if r['est']]
        d = sum(r['days'] for r in e)
        A(f'\n---\n')
        A(f'## ({k}) {NAME[k]} — {len(g)}件 / {d:.1f}人日\n')
        A(f'**何が違うのか**: {DEF[k]}')
        A('')
        A(f'**やる作業**: {EX[k]}')
        A('')
        A('| | |')
        A('|---|---|')
        A(f'| 件数 | 乖離 {sum(1 for r in g if r["src"]=="乖離")} ＋ '
          f'Backlog {sum(1 for r in g if r["src"]=="BL")} = **{len(g)}** |')
        A(f'| 見積可 | {len(e)}件 / {d:.1f}人日（5工程込み概算 {d*(1+INV)*(1+UT+RV+RB):.0f}人日） |')
        A(f'| 1件あたり | 中央値 {(st.median([r["days"] for r in e]) if e else 0)*HOURS:.1f}h / '
          f'最大 {(max([r["days"] for r in e]) if e else 0)*HOURS:.0f}h |')
        A(f'| 実害high(P1) | {sum(1 for r in g if r["pri"]=="P1")}件 |')
        A(f'| 設計書も直す | {sum(1 for r in g if r["doc"] not in ("NONE","","UNSURE"))}件 |')
        dom = Counter(r['dom'] for r in g if r['dom'])
        if dom:
            A(f'| 多いドメイン | ' + '、'.join(f'{a} {b}' for a, b in dom.most_common(5)) + ' |')

        p1 = sorted([r for r in g if r['pri'] == 'P1'], key=lambda x: -x['days'])
        if p1:
            A(f'\n**実害high の例**（{len(p1)}件中 上位3）')
            A('')
            A('| 出所 | ID | 人日 | 内容 |')
            A('|---|---|---:|---|')
            for r in p1[:3]:
                A(f'| {r["src"]} | {r["id"]} | {r["days"]:.2f} | {flat(r["diff"], 110)} |')

        if e:
            s = sorted(e, key=lambda x: x['days'])
            picks = [s[len(s) // 2], s[-1]]
            A('\n**典型例（中央値の行）と最大の行**')
            A('')
            A('| | 出所 | ID | 人日 | 直す対象 | 根拠 |')
            A('|---|---|---|---:|---|---|')
            for lbl, r in zip(['中央値', '最大'], picks):
                A(f'| {lbl} | {r["src"]} | {r["id"]} | {r["days"]:.2f} | '
                  f'{flat(r["target"], 60)} | {flat(r["why"], 110)} |')

    A('\n---\n')
    A('## この仕分けの読み方\n')
    A('- **区分は「直し方」で分けてある。**同じ区分は同じ種類の作業なので、'
      'まとめて着手すると探索と確認が1回で済む。')
    A('- **(3)データ永続化と(6)未実装機能は件数が少なく工数が重い。**'
      'マイグレーションと既存データの再集計、新規実装を伴うため。ここは並列化しにくい。')
    A('- **(2)画面表示は件数が最も多く工数は軽い。**ただし翻訳キーは複数画面で共有されており、'
      '同じキーに別々の文言を求める指摘が同時に存在する。一括変更はできない。')
    A('- Backlog側の根拠区分は SPEC_BACKED に偏っている（238/247）。'
      'チケットが設計書を根拠に起票されているためで、旧実装側の探索は薄い。'
      '**移植漏れの件数は乖離側の502件が下限**と見るべき。')
    A('- 乖離とBacklogは重複する（確度A 8件・確度B 73件）。この表は重複を含む。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    for k in sorted(NAME):
        g = by[k]
        e = [r for r in g if r['est']]
        print(f'  ({k}) {NAME[k]}: {len(g)}件 {sum(r["days"] for r in e):.1f}人日')
    print(f'  計 {tot}件 {te:.1f}人日')


if __name__ == '__main__':
    main()
