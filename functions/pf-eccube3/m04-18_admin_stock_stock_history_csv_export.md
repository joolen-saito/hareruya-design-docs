# 在庫管理 — 在庫履歴CSV出力

## 業務ロジック

### 出力対象の在庫履歴

出力対象は該当する在庫変動履歴の全件とし、一覧のページ区切りでは分割しない。画面の入力項目は持たない。

該当が0件の場合もヘッダ行だけのCSVを出力する。

### 列の値の取り方

値は在庫変動履歴と参照先のマスターから取得したものをそのまま出力し、集計や再計算は行わない。

商品コードは規格コードを出力する。

言語は日本語表記の言語名を出力する。

状態は、規格拡張のメモがあればメモを出力し、無ければ状態の略号（NM／SP／MP／HP）を出力する。

在庫変動理由は在庫変動理由名を出力する。

登録者は操作した管理者の名前を出力する。

登録日は年月日と時分（`Y/m/d H:i`）の書式で出力する。

## 入出力

### 出力: CSVファイル

文字コードはUTF-8とし、先頭にBOMを付ける。ファイル名は `product_stock_history_` に出力時刻（年月日時分秒）を付け、拡張子を `.csv` とする。

在庫変動履歴1件を1行として出力する。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M04-18-MSG-001 | 管理画面上部 | 存在しない在庫履歴IDが含まれています。／在庫履歴データが存在しないためエクスポートできません。 | 選択した在庫履歴が存在しないとき、または出力対象の在庫履歴が無いとき | 出力せず操作前の画面に戻る。操作前の画面が無い場合は在庫履歴一覧画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力対象の在庫履歴 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/HistoryController.php:107 |
| 列の値の取り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/HistoryCsv.php:101 |
| 列の値の取り方 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbStockHistoryRepository.php:119 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/HistoryCsv.php:47 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:369 |
