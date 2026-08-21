#!/usr/bin/env python3
"""着手のまとまり(波)ごとに、含まれる不具合の型を整理した Markdown を出力する。

波の定義は EFFORT_SUMMARY.md と同じ。各波の中を「不具合の型」で小分けし、
件数・工数・代表例を並べる。型の判定は差分内容の語による機械分類なので、
境界の行は複数の型に当てはまり得る（先に一致した型に入る）。
"""
import csv, os, re
from collections import Counter, defaultdict

csv.field_size_limit(10 ** 9)

BASE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.dirname(BASE)
SRC = os.path.join(REPORT, 'drift_findings_list_effort.tsv')
OUT = os.path.join(REPORT, 'REMEDIATION_WAVES.md')

# 波: (見出し, 説明, 選別条件)
WAVES = [
    ('第1波', '実害high（P1）を区分を問わず全部', lambda r: r['優先度'] == 'P1'),
    ('第2波', '画面表示（文言・ラベル）を一括で直す', lambda r: r['確定改修区分'] == '2'),
    ('第3波', '外部インタフェース契約と入力検証', lambda r: r['確定改修区分'] in ('1', '4')),
    ('第4波', '業務ロジック', lambda r: r['確定改修区分'] == '5'),
    ('第5波', '実行制御', lambda r: r['確定改修区分'] == '8'),
    ('第6波', 'データ永続化・外部連携', lambda r: r['確定改修区分'] in ('3', '7')),
    ('第7波', '未実装機能の新規実装', lambda r: r['確定改修区分'] == '6'),
]

# 不具合の型: (波, 型名, 正規表現)。上から順に判定し、最初に一致した型に入れる。
TYPES = [
    # --- 第1波 ---
    ('第1波', '権限・アクセス制御が効いていない',
     r'権限|isEditableShop|編集可能店舗|アクセス制御|ITチーム|経理のみ|POST改ざん'),
    ('第1波', 'データが壊れる・在庫や履歴が合わなくなる',
     r'在庫|物理削除|論理削除|全削除|履歴|丸めて|登録者|price02|集計行を削除|ポイント履歴'),
    ('第1波', '外部連携が成立していない',
     r'スマレジ|Smaregi|SP\.LINKS|取引照会|中継|ポイント増減'),
    ('第1波', '集計値が実態と違う', r'集計|合算|売上|出荷完了'),
    ('第1波', '認証・監査ログの欠陥', r'認証|IP制限|token|Cookie|ロールバック|ログ'),
    ('第1波', '外部インタフェース契約の不一致',
     r'外部契約|URL|パス|ルート|レスポンス|JSONキー|api/v1|エンドポイント|\.json|GET|POST'),
    ('第1波', '入力検証の欠落', r'検証|バリデーション|未入力|書式エラー|拒否|必須'),
    # --- 第2波 画面表示 ---
    ('第2波', '文言・ラベルが設計と違う',
     r'文言|ラベル|表示名|見出し|タイトル|サブタイトル|メッセージ|フラッシュ|翻訳キー|パンくず'),
    ('第2波', '日時・通貨などの表示書式',
     r'書式|Y年m月d日|Y/m/d|円|¥|桁区切り|number_format|秒毎|ms\)|ISO'),
    ('第2波', 'ページング・件数表示', r'ページング|ページャ|pager|前後|該当件数|総件数'),
    ('第2波', '表示項目の過不足',
     r'表示(要素|項目|しない|されない)|非表示|列(見出し|が)|項目が(無い|ない)|欠落|出力されない|不在'),
    ('第2波', '初期値・選択肢・表示件数',
     r'初期値|選択肢|表示件数|プルダウン|セレクト|ラジオ|チェックボックス'),
    ('第2波', '並び順・ソート', r'並び順|ソート|降順|昇順|順序'),
    ('第2波', '表示対象データが違う',
     r'タグ|対象|バーコード|固定値|レイアウト|スライダー|カルーセル|装飾'),
    ('第2波', 'ボタン活性制御・画面内挙動',
     r'活性|disabled|押下|モーダル|遷移|リンク|JS|スピナー|alert'),
    # --- 第3波 契約・入力検証 ---
    ('第3波', 'URL・ルートの不一致',
     r'URL|パス|ルート|route|エンドポイント|遷移先|api/v1|拡張子なし'),
    ('第3波', 'レスポンス本文・HTTPステータスの不一致',
     r'レスポンス|本文キー|JSONキー|ステータス|HTTP ?[45]\d\d|応答|返す|ペイロード|iss/aud'),
    ('第3波', 'CSV列名・フォーマットの不一致',
     r'CSV|TSV|ヘッダ|列名|列順|列数|フォーマット'),
    ('第3波', 'バッチのコマンド名の不一致', r'コマンド名|AsCommand|batch '),
    ('第3波', 'バッチのコンソール出力・終了仕様',
     r'コンソール|開始|完了|日時付き|終了コード|例外を捕捉|伝播|writeln|\$io->'),
    ('第3波', '必須・相関チェックの欠落', r'必須|未入力|相関|整合|From.*To|重複'),
    ('第3波', '桁・範囲・形式の検証漏れ',
     r'桁|最大値|上限|下限|範囲|形式|書式|数値|文字数|検証|バリデ'),
    # --- 第4波 業務ロジック ---
    ('第4波', '抽出条件・検索条件が違う',
     r'抽出条件|検索条件|絞り込み|条件が|WHERE|対象外|除外|LIKE|ワイルドカード'),
    ('第4波', '集計・計算が違う', r'集計|合算|計算|算出|丸め|端数|金額|価格|原価|0埋め'),
    ('第4波', 'ステータス遷移・分岐が違う',
     r'ステータス|遷移|分岐|判定順|優先順位|フォールバック|承認'),
    ('第4波', '権限・アクセス制御', r'権限|編集可能店舗|isEditableShop|アクセス'),
    ('第4波', 'セッション・状態の保持', r'セッション|検索状態|resume|保持|復元'),
    ('第4波', 'データ取得元・参照先が違う',
     r'参照|取得元|JOIN|Repository|依存先|dtb_|mtb_|テーブル|カラム'),
    ('第4波', '必須・任意の扱いが違う', r'任意|必須|null|拒否|受け付け'),
    ('第4波', '表示・出力要素の欠落', r'表示|出力|欄|印字|画面'),
    # --- 第5波 実行制御 ---
    ('第5波', 'トランザクション境界・ロールバック範囲',
     r'トランザクション|ロールバック|commit|部分反映|全体'),
    ('第5波', '排他制御・ロック', r'排他|(?<![ブプ])ロック|PESSIMISTIC|OPTIMISTIC'),
    ('第5波', '実行環境設定（時間・メモリ・SQLロガー）',
     r'set_time_limit|memory_limit|SQLロガー|実行時間|メモリ'),
    ('第5波', '同期／非同期・再実行性', r'同期|非同期|MessageBus|キュー|再実行|冪等|件数ごと|チャンク'),
    # --- 第6波 永続化・外部連携 ---
    ('第6波', '削除方式（論理／物理）が違う', r'論理削除|物理削除|deleted_at|remove\('),
    ('第6波', 'スマレジ連携', r'スマレジ|Smaregi'),
    ('第6波', 'メール送信・通知', r'メール|MailService|通知'),
    ('第6波', 'S3・ファイル出力・支店連携', r'S3|SFTP|SCP|ZIP|ファイル|支店|Step ?Functions'),
    ('第6波', '監査ログ', r'ログ|log_info|log_error|監査'),
    ('第6波', '保存先テーブル・カラムが違う',
     r'保存先|dtb_|mtb_|カラム|テーブル|永続化|保存'),
    # --- 第7波 未実装機能 ---
    ('第7波', 'バッチが丸ごと無い', r'バッチ|Command|コマンド|Step ?Functions|定期実行'),
    ('第7波', '画面・ルートが無い', r'画面|ルート|URL|パス|Controller|遷移|入口'),
    ('第7波', '画面内の機能が空（器だけある）', r'サジェスト|候補|JS|UI|器|供給|表示'),
]
COMPILED = defaultdict(list)
for w, n, p in TYPES:
    COMPILED[w].append((n, re.compile(p)))


def cx(r):
    try:
        return float(r['codex工数'] or 0)
    except ValueError:
        return 0.0


def clean(s, n=150):
    return re.sub(r'[\s　]+', ' ', s or '')[:n]


def typeof(wave, r):
    text = r['差分内容'] + ' ' + r['設計期待値']
    for n, rx in COMPILED[wave]:
        if rx.search(text):
            return n
    return 'その他'


def main():
    rows = [r for r in csv.DictReader(open(SRC, encoding='utf-8'), delimiter='\t')
            if r['優先度'] in ('P1', 'P2', 'P3', 'P4')]

    assigned, waves = set(), []
    for label, desc, pred in WAVES:
        g = [r for r in rows if pred(r) and id(r) not in assigned]
        for r in g:
            assigned.add(id(r))
        waves.append((label, desc, g))

    L, A = [], lambda x: L.append(x)
    A('# 乖離指摘 着手のまとまり別 不具合内容\n')
    A('`drift_findings_list_effort.tsv` の改修対象 '
      f'{len(rows)}件を、着手のまとまり（波）ごとに整理したもの。')
    A('工数は codex が1件ずつ見積もった実装工数（人日）。'
      'テスト・レビュー・設計書改訂・リリースは含まない（含めるなら約1.6倍）。')
    A('「要仕様確定」は設計が矛盾していて何を作るか決まらず、工数を出せない行。\n')

    A('## 全体\n')
    A('| まとまり | 内容 | 件数 | 工数(人日) | 要仕様確定 | 累計 |')
    A('|---|---|---:|---:|---:|---:|')
    cum = 0.0
    for label, desc, g in waves:
        e = sum(cx(r) for r in g)
        cum += e
        nd = sum(1 for r in g if r['仕様確定要'] == 'YES')
        A(f'| {label} | {desc} | {len(g)} | {e:.0f} | {nd} | {cum:.0f} |')
    A(f'| | **合計** | **{len(rows)}** | **{sum(cx(r) for r in rows):.0f}** | '
      f'**{sum(1 for r in rows if r["仕様確定要"] == "YES")}** | |')

    for label, desc, g in waves:
        e = sum(cx(r) for r in g)
        nd = [r for r in g if r['仕様確定要'] == 'YES']
        A(f'\n---\n\n# {label}: {desc}\n')
        A(f'**{len(g)}件 / {e:.0f}人日**'
          + (f'（うち要仕様確定 {len(nd)}件は工数未算入）' if nd else '') + '\n')
        A('画面種別: ' + ' / '.join(f'{k} {v}'
                                for k, v in Counter(r['区分(画面種別)'] for r in g).most_common()))
        A('\n主なドメイン: ' + ' / '.join(f'{k} {v}件'
                                     for k, v in Counter(r['ドメイン'] for r in g).most_common(6)))

        by = defaultdict(list)
        for r in g:
            by[typeof(label, r)].append(r)

        A('\n## 含まれる不具合の型\n')
        A('| 型 | 件数 | 工数(人日) |')
        A('|---|---:|---:|')
        for t in sorted(by, key=lambda x: -sum(cx(r) for r in by[x])):
            A(f'| {t} | {len(by[t])} | {sum(cx(r) for r in by[t]):.1f} |')

        for t in sorted(by, key=lambda x: -sum(cx(r) for r in by[x])):
            sel = sorted(by[t], key=lambda r: -cx(r))
            A(f'\n### {t}（{len(sel)}件・{sum(cx(r) for r in sel):.1f}人日）\n')
            A('| 機能No | 工数 | 内容 |')
            A('|---|---:|---|')
            for r in sel[:8]:
                d = '要仕様確定' if r['仕様確定要'] == 'YES' else f'{cx(r):.2f}'
                A(f'| {r["機能No"]} | {d} | {clean(r["差分内容"], 150)} |')
            if len(sel) > 8:
                A(f'| … | | 他 {len(sel)-8} 件（`drift_findings_list_effort.tsv` を'
                  f'`確定改修区分`と`優先度`で絞り込む） |')

        if nd:
            A(f'\n### 要仕様確定（{len(nd)}件・工数未算入）\n')
            A('設計と実装のどちらが正かを決めないと着手できない。')
            A('')
            A('| 機能No | 内容 |')
            A('|---|---|')
            for r in nd[:12]:
                A(f'| {r["機能No"]} | {clean(r["差分内容"], 150)} |')
            if len(nd) > 12:
                A(f'| … | 他 {len(nd)-12} 件 |')

    A('\n---\n\n## この整理の前提\n')
    A('- 波の割り当ては上から順に排他。第1波(P1)に入った行は以降の波に重複して出てこない。')
    A('- 「不具合の型」は差分内容の語による機械分類で、境界の行は複数の型に当てはまり得る'
      '（先に一致した型に入る）。件数の目安として読むこと。')
    A('- 改修区分そのものは codex のレビュー済み（965件中353件を訂正）。'
      '工数も codex が1件ずつ見積もった値。')
    A('- 同一機能の複数指摘をまとめて直す効果は織り込んでいないため、実際は下振れの余地がある。')

    open(OUT, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'出力: {OUT}')
    for label, desc, g in waves:
        print(f'  {label} {len(g):4d}件 {sum(cx(r) for r in g):6.1f}人日  '
              + ' / '.join(f'{t}:{len(v)}' for t, v in
                           sorted(defaultdict(list, {t: [r for r in g if typeof(label, r) == t]
                                                     for t in {typeof(label, r) for r in g}}).items(),
                                  key=lambda x: -len(x[1]))[:4]))


if __name__ == '__main__':
    main()
