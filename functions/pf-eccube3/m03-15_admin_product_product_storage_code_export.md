# 商品管理 — 略称タグCSV出力

## 業務ロジック

### 出力対象と並び

略称タグを並び順の昇順ですべて出力する。絞り込みの入力項目は持たず、出力する件数の上限も設けない。

### 値の取り方

登録済みの値をそのまま出力する。再計算と補正は行わない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | なし |
| 成功時出力 | 略称タグのCSVファイル |
| 失敗時出力 | なし |

### 出力: CSVファイル

ヘッダ行を先頭に出力し、続けて略称タグを1件1行で出力する。ファイル先頭にはBOMを付ける。区切り文字は出力用の設定値（配布既定はカンマ）とする。ファイル名は `storage_code_` に出力時刻（年月日時分秒）を付け、拡張子を `.csv` とする。画面には表示せず、添付ファイルとしてダウンロードさせる。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力対象と並び | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:116 |
| 値の取り方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:123 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/StorageCodeController.php:119-137 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/HareruyaEcServiceProvider.php:604 |
| 出力: CSVファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:362-371 |
| 出力: CSVファイル | P2 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:249 |
