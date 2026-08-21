# 商品管理 — カテゴリ CSV 出力

## 業務ロジック

### 出力する列

出力する列は、カテゴリCSV種別で有効にしたCSV出力項目設定を、設定した並び順の昇順に並べたものである。1行目には各項目の表示名を並べる。

| 項目 | 内容 |
|------|------|
| セル値 | 項目定義のエンティティ名が出力中のカテゴリと一致し、かつ項目名がカテゴリの保持する項目に存在するときだけ値を取り出す。関連する情報は参照する項目名で単一値にする。複数値は重複を除いて出力用の区切り文字で連結し、日時は出力用の日付書式にする。一致しないとき、または存在しないときは空セルにする |
| 値の正規化 | 取り出した値が未設定のときは空セルにする |

### 出力する対象

全カテゴリを条件なしで取得する。ツリーで下位カテゴリを開いた状態から起動しても、開いている親カテゴリでは絞り込まれず、対象は常に全カテゴリである。

| 場合 | 結果 |
|------|------|
| カテゴリが0件のとき | ヘッダ行だけを書き、データ行が無いファイルとなる |
| 有効なCSV出力項目が1件も無いとき | ヘッダが空となり、データ行はカテゴリの件数分だけ空行が並ぶ（運用上は出力項目設定で有効項目を残す前提） |

### 出力ファイル

ファイル名は`category_YYYYMMDDhhmmss.csv`とし、添付ファイルのダウンロードとして応答する。ファイルの先頭にはBOMを書く。フィールドの区切り文字は出力用の設定値に従う。出力するカテゴリが多くても、実行時間の上限で打ち切らない。

### エラー時の扱い

| エラー内容 | 処理 |
|------------|------|
| 出力の途中で例外が発生したとき | 利用者向けの専用メッセージの分岐は無い |

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 無し。ツリーで開いている親カテゴリは渡らない |
| 成功時出力 | CSVファイル。1行目はヘッダ、2行目以降がデータ |
| 失敗時出力 | 本処理に完了メッセージや遷移の分岐は無い |

## 表示メッセージ

本機能は画面メッセージを表示しない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 出力する列 | P2 | pf-eccube3:src/Eccube/Service/CsvExportService.php:176 |
| 出力する列 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:99 |
| 出力する列 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:194 |
| 出力する対象 | P2 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:216 |
| 出力する対象 | P2 | pf-eccube3:app/Plugin/HareruyaEc/ServiceProvider/Admin/ProductServiceProvider.php:244 |
| 出力する対象 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Resource/template/admin/Product/category.twig:185 |
| 出力ファイル | P3 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:255 |
| 出力ファイル | P3 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:201 |
| 出力ファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:369 |
| 出力ファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/CsvExportService.php:360 |
| エラー時の扱い | P3 | pf-eccube3:src/Eccube/Controller/Admin/Product/CategoryController.php:198-258 |
