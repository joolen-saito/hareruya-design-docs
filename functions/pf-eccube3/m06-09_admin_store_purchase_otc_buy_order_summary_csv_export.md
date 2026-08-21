# m06-09_admin_store_purchase_otc_buy_order_summary_csv_export（管理画面_店頭買取管理_買取集計データCSV出力）

## 業務ロジック

### 出力する範囲

CSV出力の要求そのものは検索条件を持たない。直前の検索で用いた検索条件（集計日の期間・買取店舗・部門）を保持しておき、同じ条件で集計し直して出力する。

集計日の期間は、開始日の0時0分0秒から含めて集計する。

CSVダウンロードの導線は、検索結果に日別の集計が1件以上あるときだけ画面に出る。

### ヘッダ行

1行目に項目名のヘッダ行を置き、2行目以降に集計結果を書き出す。

### 値が欠けるときの扱い

| 列 | 値が欠けるときの出力 |
| --- | --- |
| 部門コード | 部門が紐づかないときは空欄 |
| 部門 | 部門の名称が取れないときは 未設定 |

### 金額の書式

買取金額と販売金額は、集計した値を整数のまま出す。画面の一覧では通貨の書式に整えて表示するが、CSVには桁区切りや通貨記号を付けない。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | 持たない。直前の検索で用いた検索条件を使う |
| 成功時出力 | 添付ファイルとしてのCSV。ファイル名は買取集計を示す接頭辞に出力日時（年月日時分秒）を続けたもの |

### 文字コードと区切り文字

ファイルの先頭にUTF-8のバイト順マークを書き出す。各値は設定した出力文字コードへ変換して書き出し、列の区切り文字も設定に従う。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 管理画面上部 | 検索条件がありません。先に検索を実行してください。 | 検索を実行しないままCSV出力を実行したとき | 出力せず、買取集計データの画面へ戻す |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力する範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:95 |
| 出力する範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbOtcBuyOrderSummaryRepository.php:22 |
| 出力する範囲 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/summary.twig:121 |
| ヘッダ行 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:112 |
| 値が欠けるときの扱い | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/OtcBuyOrder/OtcBuyOrderSummaryController.php:123 |
| 金額の書式 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/OtcBuyOrder/summary.twig:152 |
| 文字コードと区切り文字 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:369 |
| 文字コードと区切り文字 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:362 |
