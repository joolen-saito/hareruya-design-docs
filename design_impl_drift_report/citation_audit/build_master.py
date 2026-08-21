#!/usr/bin/env python3
"""全体工数・作業内容・算出根拠を1本にまとめる（正）。

対象:
  A 設計書乖離 1,034件（設計書HTML/正本Excel と実装の突合）
  C Backlog カテゴリ「不具合（バグ）」着手中 250件（API取得・最新）
  B 正本Excelの最新化（A の各行について要否を判定したもの）

工程モデル（他の生成物と同一係数）:
  1 基本設計書 = 編集見積 x (1+INV) + 冊数 x BOOK_MAKE
  2 実装修正   = (乖離見積 + Backlog見積) x (1+INV)
  3 UT         = 工程2 x UT
  4 レビュー   = (工程1+工程2) x RV + 冊数 x BOOK_REVIEW
  5 レビューバック = (工程1+工程2) x RB
"""
import csv, json, os, re, statistics as st
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ROOT = os.path.dirname(REPORT)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BLCUR = os.path.join(REPORT, 'backlog_wip', 'backlog_bug_inprogress.tsv')
BLALL = os.path.join(REPORT, 'backlog_wip', 'issues_bug_all.json')
IT = os.path.join(ROOT, 'integration_test', 'it-target-functions.tsv')
MD = os.path.join(REPORT, 'TOTAL_WORK_AND_BASIS.md')

HOURS = 8.0
INV = 0.5
UT, RV, RB = 0.30, 0.10, 0.20
BOOK_MAKE, BOOK_REVIEW = 0.50, 0.25

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
WN = {'ADD': '記述が無い項目を書き足す', 'FIX': '実装と食い違う既存記述を直す',
      'IMAGE': '画面レイアウト画像を差し替える', 'RESOLVE': '正本内部の矛盾を解消する'}


def n(v):
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


def flat(s, m=110):
    s = re.sub(r'[\s　]+', ' ', s or '').strip()
    return s[:m] + ('…' if len(s) > m else '')


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    C_ALL = list(csv.DictReader(open(BLCUR, encoding='utf-8'), delimiter='\t'))
    C = [r for r in C_ALL if r['状態'] == '処理中']   # 母集合＝カテゴリ不具合×状態 処理中
    C_SUB = [r for r in C_ALL if r['状態'] != '処理中']
    ALL = json.load(open(BLALL, encoding='utf-8'))
    ITF = list(csv.DictReader(open(IT, encoding='utf-8'), delimiter='\t'))

    live = [r for r in F if not r['トリアージ区分'].endswith('クローズ')]
    closed = [r for r in F if r['トリアージ区分'].endswith('クローズ')]
    fix = [r for r in F if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES']
    doc = [r for r in F if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    cfix = [r for r in C if r['仕様確定要'] != 'YES']
    books = {m.group(1) for r in doc
             if (m := re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']))}

    def sheetkey(v):
        m = re.search(r'(\d{4}[^/\s,、]*?\.html(?:#sheet-\d+)?)', v)
        return m.group(1) if m else v[:40]
    sheets = {sheetkey(r['設計書参照']) for r in doc}

    d_edit = sum(n(r['設計書工数']) for r in doc)
    i_dr = sum(n(r['codex工数']) for r in fix)
    i_bl = sum(n(r['実装見積']) for r in cfix)

    def model(d=None, a=None, c=None, nbook=None, c1=0.0):
        d = d_edit if d is None else d
        a = i_dr if a is None else a
        c = i_bl if c is None else c
        nb = len(books) if nbook is None else nbook
        s1 = d * (1 + INV) + nb * BOOK_MAKE - c1
        s2 = (a + c) * (1 + INV)
        s3 = s2 * UT
        s4 = (s2 + s1) * RV + nb * BOOK_REVIEW
        s5 = (s2 + s1) * RB
        return [s1, s2, s3, s4, s5]

    S = model()
    s1, s2, s3, s4, s5 = S
    TOT = sum(S)
    RAWSUM = d_edit + i_dr + i_bl
    COEF = TOT - RAWSUM

    # 軸別の内訳（工程2だけは軸で分けられる）
    a2 = i_dr * (1 + INV)
    c2 = i_bl * (1 + INV)

    # 意思決定
    nd_a = [r for r in F if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] == 'YES']
    dj = [r for r in live if r['優先度'] == 'D']
    rr = [r for r in live if r['優先度'] == 'R']
    b_uns = [r for r in F if r['設計書作業'] == 'UNSURE']
    c_nd = [r for r in C if r['仕様確定要'] == 'YES']
    UNDEC = len(nd_a) + len(dj) + len(rr) + len(b_uns) + len(c_nd)

    # 重複
    dupA = [r for r in C if r['乖離との重複'].startswith('確度A')]
    dupB = [r for r in C if r['乖離との重複'].startswith('確度B')]
    dupC = [r for r in C if r['乖離との重複'].startswith('確度C')]
    nodup = [r for r in C if not r['乖離との重複'] or r['乖離との重複'] == 'なし']
    a1_lo = sum(n(r['実装見積']) for r in dupA)
    a1_hi = sum(n(r['実装見積']) for r in dupA + dupB)

    # 圧縮施策
    g = defaultdict(list)
    for r in fix:
        g[(r['機能No'], r['確定改修区分'])].append(r)
    ALLOC = re.compile(r'配賦|計上済|完全重複|同一改修|まとめて')
    b1, nalloc = 0.0, 0
    for v in g.values():
        v.sort(key=lambda x: -n(x['codex工数']))
        for x in v[1:]:
            if ALLOC.search(x['工数根拠']):
                nalloc += 1
                continue
            b1 += n(x['codex工数']) * 0.6
    gd = defaultdict(list)
    for r in doc:
        gd[sheetkey(r['設計書参照'])].append(r)
    b2 = 0.0
    for v in gd.values():
        v.sort(key=lambda x: -n(x['設計書工数']))
        b2 += sum(n(x['設計書工数']) * 0.5 for x in v[1:])
    fixids = {id(r) for r in fix}
    d_overlap = sum(n(r['設計書工数']) for r in doc if id(r) in fixids)
    c1v = d_overlap * INV * 0.5

    def delta(**kw):
        return TOT - sum(model(**kw))

    MEAS = [('A1', '乖離とBacklogの**重複を先に潰す**', delta(c=i_bl - a1_lo), delta(c=i_bl - a1_hi)),
            ('B1', f'**同じ機能・同じ区分をまとめて直す**（{sum(1 for v in g.values() if len(v)>1)}組）',
             delta(a=i_dr - b1 * 0.5), delta(a=i_dr - b1)),
            ('B2', f'**設計書は同じシートをまとめて直す**（{len(sheets)}シートに{len(doc)}件）',
             delta(d=d_edit - b2 * 0.5), delta(d=d_edit - b2)),
            ('C1', '**設計書修正と実装修正を同一担当が連続で行う**',
             delta(c1=c1v * 0.5), delta(c1=c1v))]
    LO = sum(x[2] for x in MEAS)
    HI = sum(x[3] for x in MEAS)
    MID = (LO + HI) / 2

    # 再テスト規模
    touched = {r['機能No'] for r in fix} | {r['機能No'] for r in doc}
    itset = {r['id'].upper() for r in ITF}
    retest = touched & itset

    L, A = [], lambda x: L.append(x)
    A('# 全体工数・作業内容・算出根拠\n')
    A(f'**母集合は 設計書乖離 {len(F):,}件 ＋ Backlog不具合(状態:処理中) {len(C)}件 = '
      f'{len(F)+len(C):,}件**。これに正本Excelの最新化を加えて'
      '**同じ工程モデルで積んだ1本の見積**。各工数がどの作業の時間で、'
      'その数字がどこから来たのか（個別に見て積んだ数字か、係数で作った数字か）を明示する。')
    A('')
    A(f'このうち**見積が取れたのは {len(fix)+len(cfix):,}件**'
      f'（乖離{len(fix)}＋Backlog{len(cfix)}）。残りは誤検出クローズ・解消済、'
      'または仕様確定待ちで工数を積めないものである（内訳は第2節）。')
    A('')
    A(f'1人日 = {HOURS:.0f}時間。工程は **1 基本設計書 → 2 実装修正 → 3 ユニットテスト → '
      '4 レビュー → 5 レビューバック対応**。結合テスト・シナリオテストは順守（削減対象にしない）。')

    # =============== 1 ===============
    A('\n---\n')
    A('## 1. 全体像\n')
    A('| 工程 | 人日 | 割合 | 対象 | 根拠の等級 |')
    A('|---|---:|---:|---|---|')
    A(f'| 1 基本設計書 | {s1:.0f} | {s1/TOT*100:.0f}% | {len(doc)}件 / {len(sheets)}シート / '
      f'{len(books)}冊 | 個別見積＋仮置き係数 |')
    A(f'| 2 実装修正 | {s2:.0f} | {s2/TOT*100:.0f}% | {len(fix)+len(cfix)}件'
      f'（乖離{len(fix)}＋Backlog{len(cfix)}） | 個別見積＋仮置き係数 |')
    A(f'| 3 ユニットテスト | {s3:.0f} | {s3/TOT*100:.0f}% | 同上 | **係数のみ・実測なし** |')
    A(f'| 4 レビュー | {s4:.0f} | {s4/TOT*100:.0f}% | 同上＋書籍 | **係数のみ・実測なし** |')
    A(f'| 5 レビューバック対応 | {s5:.0f} | {s5/TOT*100:.0f}% | 同上 | **係数のみ・実測なし** |')
    A(f'| **開発5工程 小計** | **{TOT:.0f}** | | | |')
    A('')
    A(f'**{TOT:.0f}人日はプロジェクト総額ではない。**次の3つが入っていない。')
    A('')
    A('| 未計上 | 規模 | 節 |')
    A('|---|---|---|')
    A(f'| 意思決定（何を作るか未定） | {UNDEC}件 | 第6節 |')
    A(f'| 結合テスト・シナリオテスト | 対象{len(retest)}機能 / 約1,067ケース | 第7節 |')
    A('| 移行・環境・リリース・PR運用・並列化 | 未算定 | 第8節 |')
    A('')
    A(f'また、乖離とBacklogは**重複する**（第5節）。上の{TOT:.0f}人日は重複を含んだ上限側の値。')

    A('\n### 数字の性質\n')
    A('| | 人日 | |')
    A('|---|---:|---|')
    A(f'| 個別に見て積んだ素の見積 | {RAWSUM:.1f} | '
      f'codexが1件ずつ実コード・正本を見て算出（設計書{d_edit:.1f}＋乖離実装{i_dr:.1f}＋Backlog{i_bl:.1f}） |')
    A(f'| 係数で作った上乗せ | {COEF:.0f} | 探索{INV:.0%}・書籍固定費・工程3-5の比率 |')
    A(f'| **計** | **{TOT:.0f}** | **{COEF/TOT*100:.0f}%が仮置きの係数に依存している** |')

    # =============== 2 ===============
    A('\n---\n')
    A('## 2. 母集合（何を数えているのか）\n')
    A('### A 設計書乖離 1,034件\n')
    A('設計書（正本Excel由来のHTML）と実装を突き合わせて出た指摘。'
      '機械検証 → codexによる批判的レビュー3巡 → トリアージを通している。')
    A('')
    A('| 区分 | 件数 |')
    A('|---|---:|')
    A(f'| 誤検出・解消済でクローズ | {len(closed)} |')
    A(f'| 実装の修正が要る（見積可） | {len(fix)} |')
    A(f'| 仕様確定・設計判断・再調査が先（見積不可） | {len(nd_a)+len(dj)+len(rr)} |')
    A(f'| **計** | **{len(F)}** |')
    A('')
    A('### B 正本Excelの最新化\n')
    A(f'A の各行について「設計書側も直す必要があるか」を1件ずつ判定した結果、'
      f'**{len(doc)}件 / {len(sheets)}シート / {len(books)}冊**が対象。')
    A('')
    A('### C Backlog「不具合（バグ）」状態:処理中 {len(C)}件\n')
    A('Backlog API v2 で取得（`ECCUBE_HARERUYA` / カテゴリ id 511360）。'
      '**このプロジェクトに「対応中」という状態名は無い**ため、'
      f'標準状態の「処理中」{len(C)}件を母集合として採用した。'
      '進捗サブ状態（実装中(25%) 1件・レビュー中(80%) 2件）は着手済みで残工数のみのため含めていない。')
    A('')
    A('| 状態 | 件数 |')
    A('|---|---:|')
    for k, v in Counter(i['status']['name'] for i in ALL).most_common():
        mark = ' ←対象' if k in ('処理中', '実装中(25%)', 'レビュー中(80%)', '単体テスト実装中(50%)') else ''
        A(f'| {k}{mark} | {v} |')
    A(f'| **カテゴリ配下 計** | **{len(ALL)}** |')
    A('')
    A(f'{len(C)}枚に含まれる不具合は {sum(int(r["内包件数"] or 1) for r in C)}件'
      '（1枚に複数まとめられているものがある）。')

    # =============== 3 ===============
    A('\n---\n')
    A('## 3. 工程1〜2：作業内容と算出根拠（個別に見た部分）\n')
    A('### 工程1 基本設計書（{:.0f}人日）\n'.format(s1))
    A('**やる作業**')
    A('')
    A('| # | 作業 | 対象 |')
    A('|---|---|---|')
    A(f'| 1-1 | 指摘が指す正本Excelのブック・シート・セルを特定する | {len(doc)}件 |')
    A('| 1-2 | 記述を書き足す／直す／レイアウト画像を差し替える／正本内部の矛盾を解消する | 同上 |')
    A('| 1-3 | 改版履歴・版数を更新する | 書籍単位 |')
    A(f'| 1-4 | `convert.py` でHTMLを再生成し差分を確認する | {len(books)}冊 |')
    A('')
    A('**HTMLを直接編集しても意味がない**（再生成で消える）。正本はExcelなので'
      'Excelを直してから再生成する。この再生成・差分確認・改版管理が書籍単位の固定費になる。')
    A('')
    A('**作業種別の内訳**')
    A('')
    A('| 種類 | 何をするか | 件数 | 編集工数 |')
    A('|---|---|---:|---:|')
    bw = defaultdict(list)
    for r in doc:
        bw[r['設計書作業']].append(r)
    for k in ['ADD', 'FIX', 'IMAGE', 'RESOLVE']:
        gg = bw.get(k, [])
        if gg:
            A(f'| {k} | {WN[k]} | {len(gg)} | {sum(n(r["設計書工数"]) for r in gg):.1f} |')
    A(f'| **計** | | **{len(doc)}** | **{d_edit:.1f}** |')
    A('')
    A('**算出式**')
    A('')
    A('```')
    A(f'工程1 = 編集見積 {d_edit:.1f} × (1 + 探索 {INV:.0%}) + {len(books)}冊 × {BOOK_MAKE}人日/冊')
    A(f'      = {d_edit*(1+INV):.1f} + {len(books)*BOOK_MAKE:.1f} = {s1:.1f}人日')
    A('```')
    A('')
    A('| 数字 | 根拠 |')
    A('|---|---|')
    A(f'| 編集見積 {d_edit:.1f}人日 | **codexが{len(doc)}件を1件ずつ判定**。'
      'どのブックのどのシートの何を直すかを書かせている |')
    A(f'| 探索 +{INV:.0%} | **仮置き**。該当シートを探す時間。1冊やれば実測できる |')
    A(f'| 書籍固定費 {BOOK_MAKE}人日/冊 | **仮置き**。再生成・差分確認・改版管理。'
      f'別に工程4で{BOOK_REVIEW}人日/冊の書籍レビューを積んでいる |')
    A('')
    A('**実データの例**（codexが書いた根拠のまま／各種別の中央値の行）')
    A('')
    A('| 種類 | 人日 | 根拠 |')
    A('|---|---:|---|')
    for k in ['ADD', 'FIX', 'IMAGE', 'RESOLVE']:
        gg = sorted(bw.get(k, []), key=lambda x: n(x['設計書工数']))
        if gg:
            r = gg[len(gg) // 2]
            A(f'| {k} | {n(r["設計書工数"]):.2f} | {flat(r["設計書工数根拠"], 130)} |')

    A('\n### 工程2 実装修正（{:.0f}人日）\n'.format(s2))
    A('**やる作業**')
    A('')
    A('| # | 作業 | 備考 |')
    A('|---|---|---|')
    A('| 2-1 | 実装箇所を特定する | Controller/Service/Repository/Form/Twig/locale のどれか |')
    A('| 2-2 | 影響範囲を確認する | 同じメソッド・同じ翻訳キーを使う他画面への波及 |')
    A('| 2-3 | コードを直す | 下表の「具体的に何をするか」 |')
    A('| 2-4 | 手元で動作を確認する | |')
    A('')
    A(f'2-1・2-2ぶんとして、codexの見積に **+{INV:.0%}** している。'
      'codexの見積は「どこを直すか分かっている前提」の値で、探す時間が入っていないため。')
    A('')
    A(f'**A 設計書乖離（見積が取れた{len(fix)}件）**')
    A('')
    A('| 区分 | 件数 | 見積 | +探索後 | 1件中央値 | 具体的に何をするか |')
    A('|---|---:|---:|---:|---:|---|')
    by = defaultdict(list)
    for r in fix:
        by[r['確定改修区分']].append(r)
    for k in sorted(NAME):
        gg = by.get(k, [])
        if not gg:
            continue
        e = sum(n(r['codex工数']) for r in gg)
        m = st.median([n(r['codex工数']) for r in gg]) * (1 + INV)
        A(f'| ({k}) {NAME[k]} | {len(gg)} | {e:.1f} | {e*(1+INV):.1f} | {m*HOURS:.1f}h | {EX[k]} |')
    A(f'| **計** | **{len(fix)}** | **{i_dr:.1f}** | **{a2:.1f}** | | |')
    A('')
    A(f'**C Backlog（見積が取れた{len(cfix)}件）**')
    A('')
    A('| 区分 | 件数 | 見積 | +探索後 |')
    A('|---|---:|---:|---:|')
    cb = defaultdict(list)
    for r in cfix:
        cb[r['改修区分']].append(r)
    for k in sorted(NAME):
        gg = cb.get(k, [])
        if not gg:
            continue
        e = sum(n(r['実装見積']) for r in gg)
        A(f'| ({k}) {NAME[k]} | {len(gg)} | {e:.1f} | {e*(1+INV):.1f} |')
    A(f'| **計** | **{len(cfix)}** | **{i_bl:.1f}** | **{c2:.1f}** |')
    A('')
    A('Backlogのチケットは**既に起票・再現済み**なので2-1は本来もっと軽い。'
      f'ここでは乖離側と同じ+{INV:.0%}を当てており、**保守側に振れている**。')
    A('')
    A('**実データの例**（各区分の中央値の行）')
    A('')
    A('| 区分 | 機能 | 人日 | 根拠 |')
    A('|---|---|---:|---|')
    for k in sorted(NAME):
        gg = sorted(by.get(k, []), key=lambda x: n(x['codex工数']))
        if not gg:
            continue
        r = gg[len(gg) // 2]
        A(f'| ({k}) | {r["機能No"]} | {n(r["codex工数"]):.2f} | {flat(r["工数根拠"], 120)} |')

    # =============== 4 ===============
    A('\n---\n')
    A('## 4. 工程3〜5：作業内容と算出根拠（係数で作った部分）\n')
    A(f'**この3工程 {s3+s4+s5:.0f}人日（全体の{(s3+s4+s5)/TOT*100:.0f}%）は、すべて係数で作った数字**。'
      'このプロジェクトの実測はゼロ。')
    A('')
    A('| 工程 | 人日 | 算出式 | やる作業 |')
    A('|---|---:|---|---|')
    A(f'| 3 ユニットテスト | {s3:.0f} | 工程2 × {UT:.0%} '
      '| テストを書く／既存テストを直す（fixture・期待値含む）／実行して通す |')
    A(f'| 4 レビュー | {s4:.0f} | (工程1+工程2) × {RV:.0%} ＋ {len(books)}冊 × {BOOK_REVIEW} '
      '| PRを出す／レビュアーが読み指摘する／設計書の変更もレビューする／書籍単位の通し設計レビュー |')
    A(f'| 5 レビューバック対応 | {s5:.0f} | (工程1+工程2) × {RB:.0%} '
      '| 指摘を直す／再テスト／再レビューに出す（往復ぶん） |')
    A('')
    A('工程4・5の分母に工程1を含めているのは、**設計書の変更にもレビューが発生する**ため'
      '（含めないと設計レビューがゼロになる）。')
    A('')
    A('### 係数の弱さ\n')
    A(f'- **工程3の{UT:.0%}は区分によって実態が大きく違う。**'
      f'翻訳値1行を直す画面表示{len(by["2"])}件にも一律で掛けているので上振れ、'
      'マイグレーションを伴うデータ永続化や新規実装では下振れしている可能性がある。')
    A('- **工程4・5はPR粒度で変わる。**小さいPRを大量に出せば1件は軽いが本数が増え、'
      'まとめれば本数は減るが1件が重くなる。粒度方針を決めた時点で見直しが要る。')
    A(f'- **工程5の{RB:.0%}は工程4の2倍**を置いただけで、'
      '「見る時間より直す時間のほうが長い」という一般則にすぎない。')

    A('\n### 係数をどう実測に置き換えるか\n')
    A('| 係数 | 現在値 | 影響額 | 実測の取り方 |')
    A('|---|---:|---:|---|')
    A(f'| 工程2の探索 | {INV:.0%} | {(i_dr+i_bl)*INV:.0f}人日 '
      '| 試行時に「探す時間」と「直す時間」を分けて記録する |')
    A(f'| 工程1の探索 | {INV:.0%} | {d_edit*INV:.0f}人日 | 1冊通してやりシート特定の時間を測る |')
    A(f'| 工程3 UT比率 | {UT:.0%} | {s3:.0f}人日 '
      '| 直近PRで実装コミットとテストコミットの時間比を出す |')
    A(f'| 工程4 レビュー比率 | {RV:.0%} | {(s2+s1)*RV:.0f}人日 '
      '| PR作成からapproveまでのレビュアー実作業時間 |')
    A(f'| 工程5 レビューバック比率 | {RB:.0%} | {s5:.0f}人日 '
      '| 初回PRからマージまでの指摘対応コミットの時間 |')
    A(f'| 書籍固定費 | {BOOK_MAKE+BOOK_REVIEW}人日/冊 | {len(books)*(BOOK_MAKE+BOOK_REVIEW):.0f}人日 '
      '| 1冊通してやる |')
    A('')
    A('**取り方**: 局所修正／横断修正、低／中／高工数、翻訳／移行 で層化して各区分から数件ずつ、'
      f'5工程を通して実行する。数十件・数日の作業で {TOT:.0f}人日の確度が決まる。')

    # =============== 5 ===============
    A('\n---\n')
    A('## 5. 乖離とBacklogの重複（合算前に引く）\n')
    A(f'Backlog {len(C)}件を乖離リストと機械突合した結果。')
    A('')
    A('| 突合確度 | 意味 | 件数 | Backlog側見積 |')
    A('|---|---|---:|---:|')
    A(f'| 確度A | 機能Noが一致し内容も一致 | {len(dupA)} | {a1_lo:.1f} |')
    A(f'| 確度B | 機能Noのみ一致 / 書籍＋内容一致 | {len(dupB)} | {a1_hi-a1_lo:.1f} |')
    A(f'| 確度C | 書籍は一致するが内容の一致は弱い | {len(dupC)} '
      f'| {sum(n(r["実装見積"]) for r in dupC):.1f} |')
    A(f'| なし | 対応する乖離指摘が見つからない（Backlog固有） | {len(nodup)} '
      f'| {sum(n(r["実装見積"]) for r in nodup):.1f} |')
    A('')
    A(f'| どこまで重複とみなすか | Backlog実装見積 | 開発5工程 小計 |')
    A('|---|---:|---:|')
    A(f'| 重複なしとして全部足す | {i_bl:.1f} | {TOT:.0f} |')
    A(f'| 確度Aを引く | {i_bl-a1_lo:.1f} | {sum(model(c=i_bl-a1_lo)):.0f} |')
    A(f'| 確度A＋Bを引く | {i_bl-a1_hi:.1f} | {sum(model(c=i_bl-a1_hi)):.0f} |')
    A('')
    A('**確度Aの8件は同じ不具合を指している可能性が高い。**'
      '確度B・Cは機械判定のみで人が確認していないため、そのまま差し引くことはできない。'
      '着手前に人が確認する時間が要る（未計上）。')

    # =============== 6 ===============
    A('\n---\n')
    A(f'## 6. 意思決定（{UNDEC}件・開発工数の外）\n')
    A('**何を作るか決まっていないもの**。工数を積む対象ではなく、先に決める対象。')
    A('')
    A('| 種類 | 件数 | 何を決めるのか |')
    A('|---|---:|---|')
    A(f'| 仕様確定待ち（乖離） | {len(nd_a)} | 設計と実装のどちらを正とするか |')
    A(f'| 設計判断待ち | {len(dj)} | 正本の中でテキストと画像が矛盾している。どちらが正か |')
    A(f'| 要再調査 | {len(rr)} | 判断材料が足りず指摘自体の妥当性が確定していない |')
    A(f'| 設計書側の作業を判断できず | {len(b_uns)} | 設計書を触る必要があるか判定不能 |')
    A(f'| 仕様確定待ち（Backlog） | {len(c_nd)} | 同上 |')
    A(f'| **計** | **{UNDEC}** | |')
    A('')
    A('**1件1人日で積むのは誤り。**決裁会・調査・正本更新・受入条件確定・再見積が要り、'
      '論点別に束ねれば1件あたりは軽くなる。まとめ方で総額が変わるので**別枠で管理する**。')
    A('')
    A(f'決まった後は工程1から通常どおり流れる。つまり'
      f'**{UNDEC}件ぶんの開発工数は上の{TOT:.0f}人日に未計上**である。')

    # =============== 7 ===============
    A('\n---\n')
    A('## 7. 結合テスト・シナリオテスト（順守／工数未算定）\n')
    A('順守が前提なので削減対象にしていない。規模だけ測れる。')
    A('')
    A('| 項目 | 数 |')
    A('|---|---:|')
    A(f'| 改修が触る機能（実装＋設計書） | {len(touched)} |')
    A(f'| うち結合テスト対象機能に含まれるもの | {len(retest)} / {len(itset)} |')
    A('| シナリオテストの具体化済みケース | 全10モジュールで約1,067 |')
    A('')
    A('**やる作業**: 改修で挙動が変わる機能のテストケース（期待値）を直す → '
      'テストデータ・環境を用意する → 実行する → 失敗を解析し実装とテストのどちらが悪いか切り分ける → 再実行する。')
    A('')
    A(f'**工数 = 対象機能数 × 1機能あたりの再実行・確認時間**。'
      f'単価は既存の結合テスト実績から出せるはずなのでそちらを当ててほしい。'
      f'仮に1機能0.5人日なら {len(retest)*0.5:.0f}人日、1人日なら {len(retest)*1.0:.0f}人日。')
    A('')
    A('**単価に実績がないため、ここで数字を作ることはしない。**')

    # =============== 8 ===============
    A('\n---\n')
    A('## 8. どの工程にも入っていないコスト\n')
    A('| 分類 | 内容 |')
    A('|---|---|')
    A(f'| 設計書 | **Backlog {len(C)}件の設計書更新要否判定と、必要な正本修正**（未判定。工程1は0で計上） |')
    A('| 前作業 | 重複の人による確認、翻訳キーの全参照調査 |')
    A('| 開発運用 | PR作成、rebase、マージ競合解消、CI待ち、大規模PRの分割・再レビュー |')
    A('| 移行 | DBマイグレーション、既存データ補完・再集計、リハーサル、照合、切戻し |')
    A('| 外部連携 | 連携先の検証環境・認証情報・レート制限調整、疎通試験 |')
    A('| 環境 | 開発/検証環境構築、fixture更新、既存UTの修正、全回帰CIの実行時間 |')
    A('| リリース | リリース計画、運用引継ぎ、変更凍結調整、デプロイ、監視 |')
    A('| 並列化 | wave統合担当、共有ファイル/サービスの競合調整、依存変更による再テスト |')

    # =============== 9 ===============
    A('\n---\n')
    A('## 9. 品質を下げずに圧縮できるところ\n')
    A('「品質を下げない」とは、**直すべきものを直さない・確認を省く、をやらない**という意味。'
      '以下は作業の重複を減らす案で、対象や確認の範囲は変えない。'
      '削減額は施策ごとに工程モデルを再計算した差分。')
    A('')
    A('| # | 施策 | 慎重 | 楽観 |')
    A('|---|---|---:|---:|')
    for tag, nm, dl, dh in MEAS:
        A(f'| {tag} | {nm} | {dl:.0f} | {dh:.0f} |')
    A(f'| **計** | | **{LO:.0f}** | **{HI:.0f}** |')
    A('')
    A('| | 慎重 | 中間 | 楽観 |')
    A('|---|---:|---:|---:|')
    A(f'| 開発5工程 小計 {TOT:.0f}人日 は | {TOT-LO:.0f} | {TOT-MID:.0f} | {TOT-HI:.0f} |')
    A(f'| 削減率（**この小計に対して**） | -{LO/TOT*100:.0f}% | -{MID/TOT*100:.0f}% | -{HI/TOT*100:.0f}% |')
    A('')
    A('**この率は開発5工程小計に対するもので、プロジェクト全体に対する率ではない。**'
      '第6〜8節を積むと分母が増えるため、全体への圧縮効果はこれより小さくなる。')
    A('')
    A('期間短縮（工数は減らない）としては、区分別・ドメイン別の並列化、'
      '改修完了順の結合テスト着手、P1先行がある。'
      'ただし**並列化には統合コストが伴う**（rebase、競合解消、共有基盤の変更調整、'
      '依存変更による再テスト）。共有基盤・DBスキーマ・共通APIを先行凍結し、'
      '依存グラフで波を作るのが前提になる。')
    A('')
    A('### やらないこと（品質を下げる案）\n')
    A('- 結合テスト・シナリオテストの間引き — 順守が前提')
    A(f'- ユニットテストの省略 — 工程3は{s3:.0f}人日と大きいが、'
      '削ると回帰を検知できず結合テストで見つかって手戻りが増える')
    A(f'- レビューの省略・簡略化 — 工程4-5で{s4+s5:.0f}人日。既存挙動を変える改修が多く最後の砦になる')
    A('- P4（実害low）の切り捨て — 工数が小さく、切っても効果が薄いわりに不一致が残る')
    A('- 見積不可の見切り発車 — 実装後に作り直しになる')

    # =============== 10 ===============
    A('\n---\n')
    A('## 10. この見積の読み方\n')
    A('| 判断 | 根拠の強さ |')
    A('|---|---|')
    A(f'| 改修対象は{len(fix)+len(cfix)}件、重い区分は(3)データ永続化・(6)未実装機能・(7)外部連携 '
      '| **強い**。1件ずつ実コードを見て判定し、codexの批判的レビューを通している |')
    A(f'| 設計書を触るのは{len(doc)}件・{len(books)}冊 | **強い**。1件ずつ判定 |')
    A(f'| 素の作業量は約{RAWSUM:.0f}人日 | **中**。個別見積の積み上げだが、見積自体の当たり外れは未検証 |')
    A(f'| 開発5工程で{TOT:.0f}人日 | **弱い**。{COEF/TOT*100:.0f}%が実測ゼロの係数。'
      '試行で置き換えるまでは幅で見るべき |')
    A('| プロジェクト総額 | **出せない**。第6〜8節が未計上 |')
    A('')
    A('### 進め方の順序\n')
    A(f'1. **意思決定{UNDEC}件を決裁**（開発工数外・並行可。論点別に束ねて一括処理）')
    A(f'2. **重複{len(dupA)+len(dupB)}件を人が確認して確定**')
    A(f'3. **Backlog {len(C)}件の設計書更新要否を判定**（工程1の抜けを埋める）')
    A('4. **翻訳キーの逆引き表を作る**（画面表示のまとめ直しの前提）')
    A('5. **試行**：層化して数十件を5工程通し、工程3-5の係数とPRサイズ別レビュー実績を採る')
    A('6. 共有基盤・スキーマを先行凍結し、依存グラフで波を作る')
    A('7. 設計書を書籍単位、実装をクラスター単位でまとめて直す')
    A('8. 改修完了した機能から結合テスト・シナリオテストへ')

    A('\n---\n')
    A('## 出典\n')
    A('| 生成物 | 内容 |')
    A('|---|---|')
    A('| `drift_findings_list_effort.tsv` | 乖離1,034件の全列（判定・トリアージ・改修区分・工数・根拠） |')
    A(f'| `backlog_wip/backlog_bug_inprogress.tsv` | Backlog処理中{len(C)}件（見積・根拠・重複突合） |')
    A('| `backlog_wip/issues_bug_all.json` | Backlog APIの生データ（カテゴリ配下867件） |')
    A('| `PROCESS_WORK_AND_BASIS.md` | 工程別の作業分解（本書の第3-4節の詳細版） |')
    A('| `BACKLOG_BUG_INPROGRESS_EFFORT.md` | Backlog単独の集計 |')
    A('| `PLAN_OPTIMIZATION.md` | 圧縮案の詳細（本書の第9節の詳細版） |')
    A('| `REMEDIATION_WAVES.md` | 着手のまとまりと不具合内容 |')
    A('| `TRIAGE_SUMMARY.md` / `OVERLAP_ANALYSIS.md` | トリアージ結果 / 重複突合 |')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    print(f'  工程1 {s1:.1f} / 2 {s2:.1f} / 3 {s3:.1f} / 4 {s4:.1f} / 5 {s5:.1f} = {TOT:.0f}')
    print(f'  素 {RAWSUM:.1f} / 係数 {COEF:.0f} ({COEF/TOT*100:.0f}%)')
    print(f'  意思決定 {UNDEC} / 重複 A{len(dupA)} B{len(dupB)} C{len(dupC)} なし{len(nodup)}')
    print(f'  圧縮 {LO:.0f}〜{HI:.0f}（中間{MID:.0f}）→ {TOT-MID:.0f}')
    print(f'  再テスト {len(retest)}/{len(itset)}')


if __name__ == '__main__':
    main()
