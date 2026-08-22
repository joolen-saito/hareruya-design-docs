# 分析 — 受注/売上分析CSVダウンロード

## 業務ロジック

### 出力対象

保持している受注/売上分析の検索条件で集計した結果を出力する。保持している検索条件が無いときは空の条件として扱い、空の条件で集計して出力する。

集計一覧の表示件数の上限は適用せず、集計結果の全件を出力する。

### 出力する行の並び順

集計一覧で指定した並び替え項目と昇順/降順の指定に従って並べる。

### 平均単価の求め方

合計を数量で割り、小数点以下を切り捨てる。数量が0のときは0とする。

### ファイルの形式

ファイル名は「sales_report_」に出力日時を付けたものとし、拡張子は「.csv」とする。文字コードの判別用に先頭へバイト順マークを付ける。

### 他機能との境界

本機能は画面上の入力フォームを持たない。出力する検索条件は受注/売上分析の集計一覧で保持した値による。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 保持している受注/売上分析の検索条件。 |
| 成功時出力 | 集計結果のCSVファイル。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M12-04-MSG-001 | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | 検索を実行せずにCSVをダウンロードしたとき | エラーを表示し、受注/売上分析 集計一覧表示画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:90 |
| 出力対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:271 |
| 出力する行の並び順 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:268 |
| 平均単価の求め方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:119 |
| ファイルの形式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:130 |
| ファイルの形式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:102 |
| 他機能との境界 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Analysis/SalesController.php:90 |
