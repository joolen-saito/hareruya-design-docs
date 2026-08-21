#!/usr/bin/env python3
"""乖離指摘を「何を直すことになるか」で分類し、改修工数のボリュームを幅で見積もる。

分類は証拠列に現れる語の重み付きスコアで決め、同点は2通りに割り振って感度を見る:
  - 楽観割当(ties→軽いほう) × 各区分の下限工数 = 下限見積
  - 保守割当(ties→重いほう) × 各区分の上限工数 = 上限見積
中央値は保守割当 × 標準工数。工数は実装のみの粗見積で、
テスト・レビュー・設計書改訂・リリース作業は含まない（係数は OVERHEAD で別掲）。
"""
import csv, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_triaged.tsv')
OUT = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
MD = os.path.join(REPORT, 'EFFORT_SUMMARY.md')

OVERHEAD = 1.6      # テスト・レビュー・設計書改訂・リリース込みにする係数

# ---- 区分定義 (キー, 名称, 直す対象, 下限, 標準, 上限[人日], 同点時の優先順) ----
CATS = [
    ('1', '外部インタフェース契約', 'URL・HTTPメソッド・ステータス・レスポンス本文・CSV列・コマンド名',
     0.25, 0.5, 1.5, 4),
    ('2', '画面表示', '文言・ラベル・表示項目・並び・活性制御',
     0.1, 0.25, 0.5, 1),
    ('3', 'データ永続化', '保存先テーブル/カラム・永続値・削除方式（マイグレーション/データ移行を伴う）',
     1.0, 3.0, 8.0, 7),
    ('4', '入力検証', '必須・桁・形式・範囲・重複・相関チェック',
     0.25, 0.5, 1.5, 3),
    ('5', '業務ロジック', '抽出条件・計算・ステータス遷移・分岐',
     0.5, 2.0, 5.0, 6),
    ('6', '未実装機能', '画面・ルート・バッチ・処理そのものの新規実装',
     2.0, 5.0, 15.0, 8),
    ('7', '外部連携・副作用', 'スマレジ/S3/メール送信/支店通知/監査ログ',
     1.0, 3.0, 8.0, 5),
    ('8', '実行制御', 'トランザクション・排他・実行環境設定・同期/非同期',
     0.5, 2.0, 5.0, 2),
]
NAME = {k: n for k, n, *_ in CATS}
TARGET = {k: t for k, _, t, *_ in CATS}
LOW = {k: v for k, _, _, v, *_ in CATS}
STD = {k: c[4] for c in CATS for k in [c[0]]}
HIGH = {k: c[5] for c in CATS for k in [c[0]]}
PRI = {k: c[6] for c in CATS for k in [c[0]]}

RULES = [
    # 1 外部インタフェース契約
    ('1', 3, r'(外部契約|外部URL|利用者視点の入口|URL契約|エンドポイント|ルート契約|外部JSON契約)'),
    ('1', 3, r'(パス|URL|ルート|ルート名)が(一致しない|異なる|存在しない)'),
    ('1', 3, r'(HTTPステータス|ステータスコード|HTTP ?[45]\d\d|HTTP ?200|HTTP ?302)'),
    ('1', 3, r'(レスポンス(本文|データ|項目|フィールド|スキーマ|キー|形)|本文キー|JSONキー|応答本文)'),
    ('1', 3, r'(CSV(の)?(列|項目|ヘッダ|フォーマット)|列順|CSVヘッダ|ヘッダ名|列名|列数)'),
    ('1', 3, r'(コマンド名|AsCommand|実行コマンド)'),
    ('1', 2, r'(GET|POST|PUT|DELETE)\s*/|methods:|#\[Route'),
    ('1', 2, r'(api/v1|/api/|拡張子なし|\.json)'),
    ('1', 2, r'(ファイル名|接頭辞|prefix).{0,12}(規則|一致しない|異なる)'),
    # 2 画面表示
    ('2', 3, r'(文言|ラベル|表示名|見出し|タイトル|サブタイトル|メッセージ)[はがも]?(一致しない|異なる|相違|不一致)'),
    ('2', 3, r'(利用者が(直接)?(目にする|見る)|画面に表示|表示文言|表示メッセージ|画面ラベル)'),
    ('2', 3, r'(フラッシュ|成功メッセージ|完了メッセージ|確認(ダイアログ|文言|モーダル)|パンくず)'),
    ('2', 2, r'(表示件数|初期値|選択肢|プルダウン|チェックボックス|セレクトボックス|ラジオ|入力欄)'),
    ('2', 2, r'(表示(順|しない|されない|要素|項目)|非表示|活性|disabled|並び順|ソート|列見出し)'),
    ('2', 2, r'(翻訳キー|messages\.(ja|en)\.yaml|twig)'),
    # 3 データ永続化
    ('3', 4, r'(保存先|永続化先|格納先|保存モデル)[^。]{0,14}(テーブル|異なる|一致しない)'),
    ('3', 3, r'(dtb_|mtb_)\w+[^。]{0,24}(保存|登録|更新|INSERT|カラム|列)'),
    ('3', 3, r'(論理削除|物理削除|deleted_at|del_flg|remove\(\))'),
    ('3', 3, r'(マイグレーション|migration|スキーマ|カラムが(無い|存在しない)|新規カラム|新規の?カラム)'),
    ('3', 2, r'(DB(に|へ)?(保存|登録|更新)|永続化|EntityManager)'),
    # 4 入力検証
    ('4', 4, r'(バリデーション|バリデータ|validator|Constraint)'),
    ('4', 3, r'(必須|桁|最大値|最大長|上限|下限|範囲|形式|書式)[^。]{0,18}(検証|チェック|制限|拒否|エラー|制約)'),
    ('4', 3, r'(NotBlank|Length\(|Range|Regex|LessThanOrEqual|GreaterThanOrEqual|is_numeric|ctype_)'),
    ('4', 3, r'(重複(検証|チェック|検出)|相関(チェック|検証)|整合(性)?(検証|チェック))'),
    ('4', 2, r'(エラーとする|エラーにしない|受け付け(る|ない))'),
    # 5 業務ロジック
    ('5', 3, r'(抽出条件|検索条件|絞り込み|WHERE|条件が(異なる|無い|不足))'),
    ('5', 3, r'(集計|合算|計算|算出|丸め|端数|再計算)'),
    ('5', 3, r'(ステータス(遷移|条件|判定)|分岐|判定順|優先順位|フォールバック)'),
    ('5', 2, r'(業務ルール|仕様が異なる|挙動が(異なる|違う)|ロジック)'),
    ('5', 2, r'(在庫|ポイント|価格|金額|税|買取価格|原価)'),
    # 6 未実装機能（指摘区分=未実装 のときだけ効かせる）
    ('6', 4, r'(ルート|Controller|Command|エンドポイント|入口|画面|バッチ|専用画面)[はがも]?'
             r'[^。]{0,18}(存在しない|見つからず|不在|無い|ない)'),
    ('6', 4, r'(機能|画面|バッチ|処理|入口|該当Command)(そのもの|自体)[はがも]?[^。]{0,12}'
             r'(存在しない|無い|ない|不在)'),
    ('6', 3, r'(新規(実装|開発)|一から実装|全く(存在しない|無い|ない)|丸ごと)'),
    ('6', 2, r'(TODO|コメントアウト|移植(待ち|漏れ)|未移植)'),
    # 7 外部連携・副作用
    ('7', 4, r'(スマレジ|Smaregi|S3|SFTP|SCP|Step ?Functions|EventBridge|WordPress|支店(システム)?へ|支店転送)'),
    ('7', 4, r'(メール(送信|通知)|MailService|mailer|通知メール|エラーメール)'),
    ('7', 3, r'(副作用|外部連携|連携(処理|方式|フラグ)|Webhook)'),
    ('7', 3, r'(監査ログ|ログ(出力|記録|監査)|log_info|log_error)'),
    # 8 実行制御
    ('8', 4, r'(トランザクション|ロールバック|beginTransaction|排他|(?<![ブプ])ロック|PESSIMISTIC|OPTIMISTIC)'),
    ('8', 4, r'(set_time_limit|memory_limit|SQLロガー|setSQLLogger|実行時間制限|メモリ制限)'),
    ('8', 3, r'(同期|非同期|MessageBus|キュー|再実行|冪等|部分反映)'),
    ('8', 2, r'(件数ごと|100件|チャンク|バッチサイズ|キャッシュクリア)'),
]
COMPILED = [(c, w, re.compile(p)) for c, w, p in RULES]

# 「反証として〜を検索したが見つからない」は指摘の中身ではなく検証の手続き。
# 残すと全行が「存在しない＝未実装」へ寄るので、その文だけ落とす。
BOILER = re.compile(r'[^。]*(反証|別キーワード|探索範囲|検索語|再検索|別名検索|翻案|'
                    r'で確認したが|を検索したが|で検索したが)[^。]*。?')


def score_of(r):
    text = BOILER.sub(' ', ' '.join(
        [r['差分内容'], r['設計期待値'], r['実装実態'][:400]])) + ' ' + r['実装参照'][:300]
    score, hits = Counter(), defaultdict(list)
    for c, w, rx in COMPILED:
        if c == '6' and r['指摘区分'] != '未実装':
            continue
        m = rx.search(text)
        if m:
            score[c] += w
            hits[c].append(m.group(0)[:26])
    return score, hits


def pick(score, heavy):
    if not score:
        return '5'
    top = max(score.values())
    cands = [c for c in score if score[c] == top]
    # ⑥は最も高価な区分なので同点では勝たせない（他区分が並ぶなら他を採る）
    if len(cands) > 1 and '6' in cands:
        cands = [c for c in cands if c != '6']
    return max(cands, key=lambda c: PRI[c]) if heavy else min(cands, key=lambda c: PRI[c])


def adjust(d, r, cat):
    if r['指摘区分'] == '未実装' and cat != '6':
        d *= 1.5
    sev = r['再検証_実害'] or r['重要度']
    if sev == 'high':
        d *= 1.5
    elif sev == 'low':
        d *= 0.6
    return d


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t'))
    ADD = ['改修区分', '改修区分名', '直す対象', '工数下限', '工数中央', '工数上限',
           '工数まとめ', '同点割当', '分類の手掛かり']
    fields = list(rows[0].keys()) + ADD

    for r in rows:
        sc, hits = score_of(r)
        heavy, light = pick(sc, True), pick(sc, False)
        closed = r['トリアージ区分'].endswith('クローズ')
        r['改修区分'] = heavy
        r['改修区分名'] = NAME[heavy]
        r['直す対象'] = TARGET[heavy]
        r['同点割当'] = '' if heavy == light else f'{light}or{heavy}'
        r['分類の手掛かり'] = ' / '.join(hits[heavy][:4])
        r['工数下限'] = 0 if closed else round(adjust(LOW[light], r, light), 2)
        r['工数中央'] = 0 if closed else round(adjust(STD[heavy], r, heavy), 2)
        r['工数上限'] = 0 if closed else round(adjust(HIGH[heavy], r, heavy), 2)

    with open(OUT, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n')
        w.writeheader()
        w.writerows(rows)

    live = [r for r in rows if not r['トリアージ区分'].endswith('クローズ')]
    fix = [r for r in live if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]

    # 同じ機能・同じ改修区分の指摘はまとめて直せる。2件目以降を4割で数える。
    grp = defaultdict(list)
    for r in fix:
        grp[(r['機能No'], r['改修区分'])].append(r)
    for g in grp.values():
        g.sort(key=lambda x: -float(x['工数中央']))
        for i, r in enumerate(g):
            r['工数まとめ'] = round(float(r['工数中央']) * (1.0 if i == 0 else 0.4), 2)
    for r in rows:
        r.setdefault('工数まとめ', 0)

    def s(g, k):
        return sum(float(x[k]) for x in g)

    L, A = [], lambda x: L.append(x)
    A('# 乖離指摘 改修区分別 工数ボリューム\n')
    A(f'対象 {len(rows)}件 = クローズ済 {len(rows)-len(live)}件 + 残 {len(live)}件。')
    A(f'うち **改修対象(P1-P4)は {len(fix)}件**、'
      f'設計判断待ち/要再調査が {len(live)-len(fix)}件。\n')
    A('工数は**実装のみ**の粗見積。テスト・レビュー・設計書改訂・リリースを含めるなら'
      f'約 {OVERHEAD} 倍。\n')
    A('出力: `drift_findings_list_effort.tsv`\n')

    A('\n## 改修区分別（P1-P4のみ）\n')
    A('| 区分 | 名称 | 直す対象 | 件数 | 下限 | 中央 | 上限 | まとめ直し |')
    A('|---|---|---|---:|---:|---:|---:|---:|')
    byc = defaultdict(list)
    for r in fix:
        byc[r['改修区分']].append(r)
    for k, n, t, *_ in CATS:
        g = byc.get(k, [])
        A(f'| ({k}) | {n} | {t} | {len(g)} | {s(g,"工数下限"):.0f} | '
          f'{s(g,"工数中央"):.0f} | {s(g,"工数上限"):.0f} | {s(g,"工数まとめ"):.0f} |')
    A(f'| | **合計** | | **{len(fix)}** | **{s(fix,"工数下限"):.0f}** | '
      f'**{s(fix,"工数中央"):.0f}** | **{s(fix,"工数上限"):.0f}** | **{s(fix,"工数まとめ"):.0f}** |')
    A(f'| | **同上 ＋諸経費({OVERHEAD}倍)** | | | **{s(fix,"工数下限")*OVERHEAD:.0f}** | '
      f'**{s(fix,"工数中央")*OVERHEAD:.0f}** | **{s(fix,"工数上限")*OVERHEAD:.0f}** | '
      f'**{s(fix,"工数まとめ")*OVERHEAD:.0f}** |')

    A('\n## 優先度別\n')
    A('| 優先度 | 件数 | 下限 | 中央 | 上限 | 最も多い区分 |')
    A('|---|---:|---:|---:|---:|---|')
    for p in ['P1', 'P2', 'P3', 'P4', 'D', 'R']:
        g = [r for r in live if r['優先度'] == p]
        if not g:
            continue
        top = Counter(r['改修区分名'] for r in g).most_common(1)[0][0]
        A(f'| {p} | {len(g)} | {s(g,"工数下限"):.0f} | {s(g,"工数中央"):.0f} | '
          f'{s(g,"工数上限"):.0f} | {top} |')

    A('\n## 優先度 × 改修区分（件数）\n')
    A('| 優先度 | ' + ' | '.join(f'({k})' for k, *_ in CATS) + ' | 計 |')
    A('|---|' + '---:|' * (len(CATS) + 1))
    for p in ['P1', 'P2', 'P3', 'P4', 'D', 'R']:
        g = [r for r in live if r['優先度'] == p]
        if not g:
            continue
        c = Counter(r['改修区分'] for r in g)
        A(f'| {p} | ' + ' | '.join(str(c.get(k, 0)) for k, *_ in CATS) + f' | {len(g)} |')

    A('\n## 着手のまとまり（費用対効果の順）\n')
    A('| まとまり | 内容 | 件数 | 中央(人日) | 累計 |')
    A('|---|---|---:|---:|---:|')
    steps = [
        ('第1波', '実害high（P1）を区分を問わず全部', lambda r: r['優先度'] == 'P1'),
        ('第2波', '画面表示（文言・ラベル）だけ一括で直す', lambda r: r['改修区分'] == '2'),
        ('第3波', '外部インタフェース契約と入力検証', lambda r: r['改修区分'] in ('1', '4')),
        ('第4波', '業務ロジック', lambda r: r['改修区分'] == '5'),
        ('第5波', '実行制御', lambda r: r['改修区分'] == '8'),
        ('第6波', 'データ永続化・外部連携（移行と連携先調整を伴う）',
         lambda r: r['改修区分'] in ('3', '7')),
        ('第7波', '未実装機能の新規実装', lambda r: r['改修区分'] == '6'),
    ]
    seen, cum = set(), 0.0
    for label, desc, pred in steps:
        g = [r for r in fix if pred(r) and id(r) not in seen]
        for r in g:
            seen.add(id(r))
        cum += s(g, '工数中央')
        A(f'| {label} | {desc} | {len(g)} | {s(g,"工数中央"):.0f} | {cum:.0f} |')

    A('\n## ドメイン別 工数上位15\n')
    A('| ドメイン | 件数 | 中央(人日) | 最も多い区分 |')
    A('|---|---:|---:|---|')
    dom = defaultdict(list)
    for r in fix:
        dom[r['ドメイン']].append(r)
    for k in sorted(dom, key=lambda x: -s(dom[x], '工数中央'))[:15]:
        g = dom[k]
        A(f'| {k} | {len(g)} | {s(g,"工数中央"):.0f} | '
          f'{Counter(r["改修区分名"] for r in g).most_common(1)[0][0]} |')

    A('\n## この見積もりの前提と限界\n')
    A('- 分類は証拠列の語をスコア化した機械判定で、1件ずつ人が読んで決めたものではない。'
      f'同点で区分が割れた行が {sum(1 for r in fix if r["同点割当"])} 件あり、'
      '下限側と上限側で別の区分に割り当てて幅に反映している。')
    A('- 1件あたりの工数は区分ごとの代表値であり、個別の難易度は見ていない。'
      '**件数×代表値のボリューム把握**が目的で、個別見積の代わりにはならない。')
    A('- 同一機能内の指摘はまとめて直せるものが多い（例: 同じ画面の文言5件は1回の修正）。'
      f'改修対象 {len(fix)}件は {len(set(r["機能No"] for r in fix))} 機能に分布しており、'
      'まとめ直しを織り込めば中央値より下振れする。')
    A('- 「設計判断待ち(D)」「要再調査(R)」は工数に含めていない。'
      'これらは先に仕様を決める作業が要る。')
    A('- テスト・レビュー・設計書改訂・リリース作業は含まない。'
      f'含める場合の係数を {OVERHEAD} 倍として別掲した。')

    open(MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {OUT}\n      {MD}\n')
    print(f'改修対象(P1-P4) {len(fix)}件 / 残 {len(live)}件')
    for k, n, *_ in CATS:
        g = byc.get(k, [])
        print(f'  ({k}) {n:16s} {len(g):5d}件  下限{s(g,"工数下限"):7.0f}  '
              f'中央{s(g,"工数中央"):7.0f}  上限{s(g,"工数上限"):7.0f}')
    print(f'      {"合計":16s} {len(fix):5d}件  下限{s(fix,"工数下限"):7.0f}  '
          f'中央{s(fix,"工数中央"):7.0f}  上限{s(fix,"工数上限"):7.0f}')
    print(f'      諸経費{OVERHEAD}倍込み          下限{s(fix,"工数下限")*OVERHEAD:7.0f}  '
          f'中央{s(fix,"工数中央")*OVERHEAD:7.0f}  上限{s(fix,"工数上限")*OVERHEAD:7.0f}')


if __name__ == '__main__':
    main()
