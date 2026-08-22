# M12-05（入荷通知依頼 一覧表示）

## 業務ロジック

### 刷新後は実装しない（廃止）
- Excel基本設計 0211 入荷通知依頼 一覧表示(検索項目)「キーワード検索の会員名条件」により廃止。刷新後は実装しない。

### 初期表示

検索画面を開いたときは、保持している検索条件を破棄する。並び順に昇順を設定して検索フォームを表示する。検索していないときは一覧を表示しない。

### 検索と一覧の表示

送信された検索条件を保持したうえで検索する。通知設定が削除済み（論理削除済み）のときも抽出の対象とする。検索したときは同じ画面に一覧を表示し、該当が1件以上のときだけCSV出力のリンクを表示する。

### 検索条件の効き方

| 条件 | 効き方 |
|------|--------|
| 指定の無い条件 | 絞り込みに使わない |
| 依頼日(To) | 指定した日の当日分まで含める |
| 販売金額(From)／(To) | Fromは指定額を含め、Toは指定額を含まない |
| キーワード検索 | 半角空白・全角空白・カンマで区切って複数語を指定でき、指定した語をすべて満たすものを部分一致で絞り込む |

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 検索した結果が0件のとき | 一覧を表示せず、該当なしのメッセージを表示する |
| データベース読み取りの障害 | アプリケーションの共通例外処理に委ねる |

## 入出力

### 入力と出力

| 種類 | 内容 |
|------|------|
| 入力 | 検索フォームで送信された検索条件 |
| 成功時出力 | 入荷通知依頼の一覧を含む画面。該当が0件のときは該当なしのメッセージ |
| 失敗時出力 | データ取得に失敗したときはアプリケーションの共通例外処理に委ねる |

本機能は参照だけを行い、データを更新しない。保持した検索条件は、入荷通知依頼のCSV出力が同じ条件のまま引き継ぐ。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M12-05-MSG-001 | 本文テキスト | 検索条件に該当するデータがありませんでした。 | 商品リクエスト分析を検索し、該当が0件のとき | 同一の検索結果画面に0件通知を表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:24 |
| 初期表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/request.twig:124 |
| 検索と一覧の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:51 |
| 検索と一覧の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:62 |
| 検索と一覧の表示 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/request.twig:128 |
| 検索条件の効き方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:126 |
| 検索条件の効き方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Util/SqlUtil.php:98 |
| エラー時の扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Analysis/request.twig:191 |
| 入力と出力 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/RequestController.php:86 |
