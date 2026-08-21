#!/usr/bin/env python3
"""工程別工数の整理と、品質を下げずに工数・期間を下げる案をまとめる。

前提（変更しない）:
  - 順序は 基本設計書 → 実装修正 → ユニットテスト → レビュー → レビューバック対応
  - 結合テスト・シナリオテストは順守（削減対象にしない）
"""
import csv, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
ROOT = os.path.dirname(REPORT)
DRIFT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
BL = os.path.join(REPORT, 'backlog_wip', 'backlog_wip_effort.tsv')
OV = os.path.join(REPORT, 'backlog_wip', 'overlap_map.tsv')
IT = os.path.join(ROOT, 'integration_test', 'it-target-functions.tsv')
MD = os.path.join(REPORT, 'PLAN_OPTIMIZATION.md')

INV = 0.5                      # 工程2の該当箇所特定・影響範囲
UT, RV, RB = 0.30, 0.10, 0.20  # 工程3/4/5（工程2に対する比率）
BOOK_MAKE, BOOK_REVIEW = 0.50, 0.25


def n(v):
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


def main():
    F = list(csv.DictReader(open(DRIFT, encoding='utf-8'), delimiter='\t'))
    B = list(csv.DictReader(open(BL, encoding='utf-8'), delimiter='\t'))
    O = list(csv.DictReader(open(OV, encoding='utf-8'), delimiter='\t'))
    ITF = list(csv.DictReader(open(IT, encoding='utf-8'), delimiter='\t'))

    fix = [r for r in F if r['優先度'] in ('P1', 'P2', 'P3', 'P4') and r['仕様確定要'] != 'YES']
    doc = [r for r in F if r['設計書作業'] not in ('NONE', '', 'UNSURE')]
    bfix = [r for r in B if r['仕様確定要'] != 'YES']
    books = {m.group(1) for r in doc
             if (m := re.search(r'(\d{4}[^/\s,、]*?)\.html', r['設計書参照']))}

    d_edit = sum(n(r['設計書工数']) for r in doc)
    i_dr = sum(n(r['codex工数']) for r in fix)
    i_bl = sum(n(r['工数']) for r in bfix)

    def model(d_edit, i_dr, i_bl, nbook, c1=0.0):
        """工程別に積む。c1 は工程1の探索重複ぶんの控除。"""
        s1 = d_edit * (1 + INV) + nbook * BOOK_MAKE - c1
        s2 = (i_dr + i_bl) * (1 + INV)
        s3 = s2 * UT
        s4 = (s2 + s1) * RV + nbook * BOOK_REVIEW
        s5 = (s2 + s1) * RB
        return dict(zip(['1 基本設計書', '2 実装修正', '3 ユニットテスト',
                         '4 レビュー', '5 レビューバック対応'], [s1, s2, s3, s4, s5]))

    now = model(d_edit, i_dr, i_bl, len(books))
    now_t = sum(now.values())

    # ---- 削減余地の計算 ----
    # B1 機能×区分のまとめ直し
    g = defaultdict(list)
    for r in fix:
        g[(r['機能No'], r['確定改修区分'])].append(r)
    ALLOC = re.compile(r'配賦|計上済|完全重複|同一改修|まとめて')
    b1 = 0.0
    nalloc = 0
    for v in g.values():
        v.sort(key=lambda x: -n(x['codex工数']))
        for x in v[1:]:
            if ALLOC.search(x['工数根拠']):   # 既に共有ぶんを配賦済み → 再割引しない
                nalloc += 1
                continue
            b1 += n(x['codex工数']) * 0.6
    # B2 設計書シートのまとめ直し
    def sheetkey(v):
        m = re.search(r'(\d{4}[^/\s,、]*?\.html(?:#sheet-\d+)?)', v)
        return m.group(1) if m else v[:40]
    gd = defaultdict(list)
    for r in doc:
        gd[sheetkey(r['設計書参照'])].append(r)
    b2 = 0.0
    for v in gd.values():
        v.sort(key=lambda x: -n(x['設計書工数']))
        b2 += sum(n(x['設計書工数']) * 0.5 for x in v[1:])
    # A1 重複
    dupA = [r for r in O if r['突合確度'].startswith('確度A')]
    dupB = [r for r in O if r['突合確度'].startswith('確度B')]
    a1_lo = sum(n(r['Backlog工数']) for r in dupA)
    a1_hi = sum(n(r['Backlog工数']) for r in dupA + dupB)
    # C1 設計書と実装を同一担当が連続 → 工程1の特定ぶんが半減
    fixids = {id(r) for r in fix}
    d_overlap = sum(n(r['設計書工数']) for r in doc if id(r) in fixids)
    c1 = d_overlap * INV * 0.5
    # 影響機能とIT対象の重なり
    touched = {r['機能No'] for r in fix} | {r['機能No'] for r in doc}
    itset = {r['id'].upper() for r in ITF}
    retest = touched & itset

    L, A = [], lambda x: L.append(x)
    A('# 工程別工数の整理と、品質を下げない圧縮案\n')
    A('前提として次は変えない。')
    A('')
    A('- 順序は **基本設計書 → 実装修正 → ユニットテスト → レビュー → レビューバック対応**')
    A('- **結合テスト・シナリオテストは順守**。削減対象にしない')
    A('')

    A('## 1. 現状の工数（工程別）\n')
    A('| 工程 | 人日 | 割合 | 数字の出どころ |')
    A('|---|---:|---:|---|')
    SRC = {'1 基本設計書': f'codexが513件を個別見積（編集{d_edit:.1f}）＋書籍固定費{len(books)}冊',
           '2 実装修正': f'codexが1,115件を個別見積（乖離{i_dr:.0f}＋Backlog{i_bl:.0f}）＋特定{INV:.0%}',
           '3 ユニットテスト': f'係数（工程2の{UT:.0%}）。**実測なし**',
           '4 レビュー': f'係数（{RV:.0%}）＋書籍レビュー。**実測なし**',
           '5 レビューバック対応': f'係数（{RB:.0%}）。**実測なし**'}
    for k, v in now.items():
        A(f'| {k} | {v:.0f} | {v/now_t*100:.0f}% | {SRC[k]} |')
    A(f'| **小計** | **{now_t:.0f}** | | |')
    A('')
    A('この小計に含まれないものが2つある。')
    A('')
    A(f'- **見積不可 147件**（仕様確定待ち・設計判断待ち・要再調査）。'
      '開発工数ではなく意思決定なので別枠。')
    A(f'- **結合テスト・シナリオテスト**。順守前提だが、今回は工数を出していない。')

    A('\n## 2. 結合テスト・シナリオテストの規模（工数は未算定）\n')
    A('改修が触る機能とテスト資産の重なりは測れる。単価は実績がないと置けないので'
      '**あえて数字を作らない**。')
    A('')
    A('| 項目 | 数 |')
    A('|---|---:|')
    A(f'| 改修が触る機能（実装＋設計書） | {len(touched)} |')
    A(f'| うち結合テスト対象機能に含まれるもの | {len(retest)} / {len(itset)} |')
    A(f'| シナリオテストの具体化済みケース | '
      f'{sum(1 for _ in open(os.path.join(ROOT, "scenario_test/exec/tsv/sti-zaiko_concretized.tsv"))) - 1} '
      f'（在庫のみ。全10モジュールで約1,067） |')
    A('')
    A('**再テストの工数 = 対象機能数 × 1機能あたりの再実行・確認時間**。'
      'この単価は既存の結合テスト実績から出せるはずなので、そちらの数字を当ててほしい。'
      f'仮に1機能0.5人日なら {len(retest)*0.5:.0f}人日、1人日なら {len(retest)*1.0:.0f}人日 になる。')

    # ---- 施策ごとに工程差分で計算する（一律倍率を使わない） ----
    def delta(**kw):
        after = model(kw.get('d', d_edit), kw.get('i1', i_dr), kw.get('i2', i_bl),
                      len(books), kw.get('c1', 0.0))
        return now_t - sum(after.values())

    MEAS = [
        ('A1', '乖離とBacklogの**重複を先に潰す**。同じ不具合を二重に直さない',
         delta(i2=i_bl - a1_lo), delta(i2=i_bl - a1_hi), '工程2→3-5',
         f'突合は機械判定のみ。確度A 8件は内容一致だが、確度B {len(dupB)}件は'
         '「機能Noのみ一致」で別不具合を含む。着手前に人が確認する時間（未計上）が要る'),
        ('B1', f'**同じ機能・同じ区分の指摘をまとめて直す**。{sum(1 for v in g.values() if len(v)>1)}組',
         delta(i1=i_dr - b1 * 0.5), delta(i1=i_dr - b1), '工程2→3-5',
         f'既に共有ぶんを配賦済みの{nalloc}行は割引対象から除外済み。'
         'それでも同一区分に別作業が混在する組（M12-01の集計10件など）があり、上限側は届かない。'
         'PR肥大によるレビュー増は未計上'),
        ('B2', f'**設計書は同じシートをまとめて直す**。{len(gd)}シートに{len(doc)}件',
         delta(d=d_edit - b2 * 0.5), delta(d=d_edit - b2), '工程1→4-5',
         'シート単位で作業順を組む必要がある'),
        ('C1', '**設計書修正と実装修正を同一担当が連続で行う**。該当箇所を2度探さない',
         delta(c1=c1 * 0.5), delta(c1=c1), '工程1→4-5',
         f'対象は設計書と実装が同じ行で発生する{sum(1 for r in doc if id(r) in fixids)}件のみ。'
         '**レビューの独立性が落ちる**ため、設計変更の承認と要件トレース照合は別担当に置く必要があり、'
         'その追加コストは未計上'),
    ]
    A('\n## 3. 品質を下げずに圧縮できるところ\n')
    A('「品質を下げない」とは、**直すべきものを直さない・確認を省く、をやらない**という意味。'
      '以下は作業の重複を減らす案であり、対象や確認の範囲は変えない。')
    A('')
    A('削減額は施策ごとに工程モデルを再計算した差分である（一律の倍率は使っていない）。')
    A('')
    A('| # | 施策 | 慎重 | 楽観 | 効く工程 | 前提・未計上コスト |')
    A('|---|---|---:|---:|---|---|')
    lo = hi = 0.0
    for tag, name, dl, dh, step, note in MEAS:
        lo += dl
        hi += dh
        A(f'| {tag} | {name} | {dl:.0f} | {dh:.0f} | {step} | {note} |')
    A(f'| **計** | | **{lo:.0f}** | **{hi:.0f}** | | |')
    mid = (lo + hi) / 2
    A('')
    A('| | 慎重に見て | 中間 | うまくいって |')
    A('|---|---:|---:|---:|')
    A(f'| 削減額（工程3-5への波及込み） | {lo:.0f} | {mid:.0f} | {hi:.0f} |')
    A(f'| 開発5工程小計 {now_t:.0f}人日 は | {now_t-lo:.0f} | {now_t-mid:.0f} | {now_t-hi:.0f} |')
    A(f'| 削減率（**この小計に対して**） | -{lo/now_t*100:.0f}% | -{mid/now_t*100:.0f}% '
      f'| -{hi/now_t*100:.0f}% |')
    A('')
    A('**この削減率は開発5工程小計に対するものであり、プロジェクト全体に対する率ではない。**'
      '結合テスト・シナリオテスト・意思決定・移行・リリースを積むと分母が増えるため、'
      '全体に対する圧縮率はこれより小さくなる。')
    A('')
    A('数値化していない施策として、B3（画面表示の一括PR）とC2（PR粒度の統一）がある。'
      'いずれも工程4-5のレビュー回数に効くが、**削減量を裏付ける実績がないため額を出していない**。'
      'B3には後述の重大な前提がある。')

    A('\n### B3（画面表示の一括PR）は前提を満たさないと採れない\n')
    A('当初「文言変更は影響が閉じている」としたが、これは実コードに反する。')
    A('')
    A('翻訳キー `front.product.search__product_not_found` は8つのTwigから参照されており、'
      '商品検索(F03-01)と買取検索(F05-03)で**別々の文言**を要求する指摘が同時に存在する。'
      '一括で値を書き換えると、片方の要求を満たすともう片方の画面を壊す。')
    A('')
    A('採るなら先に次が要る（いずれも未計上）。')
    A('')
    A('1. 翻訳キー → 全参照箇所の逆引き表を作る')
    A('2. 要求が異なる画面は専用キーへ分離する')
    A('3. キー衝突の静的チェックと、画面別の表示確認を入れる')

    A('\n## 4. 期間を短くする（工数は減らない）\n')
    A('| # | 施策 | 効果 | 前提・副作用 |')
    A('|---|---|---|---|')
    A('| E1 | **区分別に並列化**。画面表示246件は他と独立性が高い | 期間短縮 '
      '| 同じ messages.ja.yaml に集中して衝突する。'
      '**共有キーは意味も共有する**ため、キー単位に担当を割っても衝突は消えない |')
    A(f'| E2 | **ドメイン別に分割**。上位は m04 {Counter(r["ドメイン"] for r in fix)["m04"]}件、'
      f'm13 {Counter(r["ドメイン"] for r in fix)["m13"]}件、m03 {Counter(r["ドメイン"] for r in fix)["m03"]}件 '
      '| 期間短縮 | スマレジ連携やM12-01の集計のようにドメイン・層を横断する改修は分割できない |')
    A('| E3 | **結合テストを機能単位で改修完了順に着手** | 期間短縮 '
      '| 後続改修で再テストになる機能が出る。依存が凍結するまでは予備確認として扱い、'
      '本番カウントは凍結後にする |')
    A('| E4 | **P1（実害high）64件を先行させる** | リスク低減 | 工数は減らない |')
    A('')
    A('**並列化には統合コストが伴う**（rebase、競合解消、共有基盤の変更調整、'
      '依存変更による再テスト）。これらは上の表にも小計にも入っていない。'
      '共有基盤・DBスキーマ・共通APIを先行して凍結し、依存グラフで波を作るのが前提になる。')

    A('\n## 5. やらないこと（品質を下げる案）\n')
    A('- **結合テスト・シナリオテストの間引き** — 順守が前提。')
    A(f'- **ユニットテストの省略** — 工程3は{now["3 ユニットテスト"]:.0f}人日と大きいが、'
      '削ると回帰を検知できず結合テストで見つかって手戻りが増える。')
    A(f'- **レビューの省略・簡略化** — 工程4-5で{now["4 レビュー"]+now["5 レビューバック対応"]:.0f}人日。'
      '既存挙動を変える改修が多く、レビューが最後の砦になる。')
    A('- **P4（実害low）の切り捨て** — 工数が小さく、切っても効果が薄いわりに不一致が残る。')
    A('- **見積不可の見切り発車** — 実装後に作り直しになる。')

    A('\n## 6. 小計に入っていないコスト（要積み増し）\n')
    A('codexレビューで挙がったもの。**いずれも発生するが今回の1,900人日には入っていない。**')
    A('')
    A('| 分類 | 内容 |')
    A('|---|---|')
    A('| 意思決定 | 見積不可153件（乖離72＋設計判断23＋要再調査19＋設計書判断不能6＋Backlog33）の'
      '決裁会、調査、正本更新、受入条件確定、再見積 |')
    A('| 設計書 | **Backlog255件の設計書更新要否判定と、必要な正本修正**（今回未判定） |')
    A('| 前作業 | A1の82件突合確認、B3の翻訳キー全参照調査、C1の独立レビュー |')
    A('| 開発運用 | PR作成、rebase、マージ競合解消、CI待ち、大規模PRの分割・再レビュー |')
    A('| テスト | 結合/シナリオテスト資産の修正、環境・テストデータ準備、失敗解析、再実行 |')
    A('| 移行 | DBマイグレーション、既存データ補完・再集計、リハーサル、照合、バックアップ/ロールバック |')
    A('| 外部連携 | 連携先の検証環境・認証情報・レート制限調整、疎通試験 |')
    A('| 環境 | 開発/検証環境構築、fixture更新、既存UTの修正、全回帰CIの実行時間 |')
    A('| リリース | リリース計画、運用引継ぎ、変更凍結調整、デプロイ、監視、切戻し |')
    A('| 並列化 | wave統合担当、共有ファイル/サービスの競合調整、依存変更による再テスト |')

    A('\n## 7. 進め方の順序\n')
    A('1. **見積不可153件を決裁**（開発工数外・並行可。論点別に束ねて一括処理する）')
    A(f'2. **重複82件を人が確認して確定**（A1の前提）')
    A('3. **Backlog255件の設計書更新要否を判定**（工程1の抜けを埋める）')
    A('4. **翻訳キーの逆引き表を作る**（B3・E1の前提）')
    A('5. **試行**：局所/横断、低/中/高工数、組サイズ、翻訳/移行で層化し、'
      'クラスター単位で5工程を通す。工程3-5の係数とPRサイズ別レビュー実績を採る')
    A('6. 共有基盤・スキーマを先行凍結し、依存グラフで波を作る')
    A('7. 設計書を書籍単位、実装をクラスター単位でまとめて直す')
    A('8. 改修完了した機能から結合テスト・シナリオテストへ')

    A('\n## 8. この案の弱いところ（codexレビュー反映後）\n')
    A('- **削減見込みの根拠は「2件目以降が4割/5割で済む」という仮定**であり実測ではない。'
      '同一機能×同一区分でも別作業が混在する組があり、上限側は届かない。')
    A(f'- **工程3-5は{sum(now[k] for k in list(now)[2:])/now_t*100:.0f}%を占めるが係数で作った数字**。'
      'ここが実測でずれると、圧縮案の効果より係数の誤差のほうが大きい。')
    A('- **1,900人日はプロジェクト総工数ではない**。第6節のコストを積むまで総額は出せない。')
    A('- 施策の削減額は工程モデルの差分であり、施策どうしの重なり（B1とC2、B2とC1）を'
      '厳密には分離していない。単純合算はやや過大になる。')
    A('- B3・C2・E1のPR粒度方針は互いに矛盾しうる。'
      '基本単位を「機能×共有実装境界」に一本化し、locale変更は別PRに分けるのが穏当。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {MD}')
    print(f'  現状 {now_t:.0f}人日')
    for k, v in now.items():
        print(f'    {k}: {v:.0f}')
    print(f'  削減見込み(工程波及込み) {lo:.0f}〜{hi:.0f} 中間 {mid:.0f}')
    print(f'  再テスト対象機能 {len(retest)}/{len(itset)}')


if __name__ == '__main__':
    main()
