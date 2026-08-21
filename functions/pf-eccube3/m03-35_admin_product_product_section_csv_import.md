# 商品管理 — 部門更新CSV登録

## 業務ロジック

### アップロード画面の表示

部門更新の取込履歴だけを、新しいものから順に並べて表示する。作業者には取込を実行した管理者の氏名を表示し、その管理者が削除済みであっても氏名を表示する。

### 雛形の出力

見出し行だけを持つCSVを出力する。ファイル名は `product_section_update.csv` とする。

### 取込の判定順序

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | ファイルを選択していないとき、ファイルの種別がテキスト・CSV・タブ区切り・表計算のいずれでもないとき、またはファイルの大きさが上限（設定値。配布時の既定は5メガバイト）を超えるとき | エラーを表示してアップロード画面へ戻り、取込を開始しない |
| 2 | 見出し行が読めないとき、または2行目以降のデータ行が無いとき | エラーを表示し、取込を行わない |
| 3 | データ行の列数が2でないとき | 全体を中止する |
| 4 | 見出しに商品コード・部門コードの列が無いとき、または商品コードが空のとき | 全体を中止する |
| 5 | 削除されていない商品の規格に、商品コードが一致するものが無いとき | 商品コードでデータを取得できない旨のエラーを積み、全体を中止する |
| 6 | 部門コードに一致する部門が存在しないとき | 部門コードでデータを取得できない旨のエラーを積み、全体を中止する |
| 7 | 上記のいずれにも該当しないとき | 商品コードが一致するすべての規格の部門を更新する |

全体を中止したときは、それまでに読んだ行の更新も含めて何も反映しない。同一のCSV内に同じ商品コードが複数行あるときは、最後の行の部門で確定する。

## 入出力

### 入出力: 取り込むファイルの読み取り

拡張子が tsv のファイルはタブ区切りとして読み、それ以外は設定した区切り文字（配布時の既定はカンマ）で読む。文字コードがUTF-8以外のファイルは変換して読み取り、ファイル全体から幅の無い空白を取り除く。

### 入出力: 永続化

| 操作 | 契機 |
|------|------|
| 追加 | エラーなく取込を終えたとき。取込履歴を1件（種別は部門更新、ファイル名はアップロードしたファイルの名称、実行した利用者） |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-35-MSG-001 | 管理画面上部 | CSRFトークンが無効です、再送信してください。 | CSV取込時にCSRFトークンが無効なとき | 部門更新CSV取込画面に遷移する |
| M03-35-MSG-002 | 管理画面上部 | CSVのフォーマットが一致しません | 送信内容は妥当だが、ファイルを選択せずにCSV取込を実行したとき | エラーを表示し、部門更新CSV登録画面に遷移する |
| M03-35-MSG-003 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | 上限を超える行数のCSVファイルを登録したとき | エラーを表示し、部門更新CSV登録画面に遷移する |
| M03-35-MSG-004 | 管理画面上部 | CSVのフォーマットが一致しません。 ／ CSVデータが存在しません。 ／ CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 ／ %d 行目の %s ではデータを取得できません。 ／ %s は必須項目です。 %d 行目のデータを確認してください。 ／ %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 | CSV取込時にヘッダーがない、データ行がない、またはデータ行の列数が不正なとき | 部門更新CSV取込画面に遷移する |
| M03-35-MSG-005 | 管理画面上部 | 登録が完了しました。 | CSVの登録がエラーなく完了したとき | 登録完了を表示し、部門更新CSV登録画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| アップロード画面の表示 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1859-1860 |
| 雛形の出力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:459-461 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:27-40 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvMimeTypeValidator.php:20 |
| 取込の判定順序 | P2 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:31 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190-211 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52-99 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductSectionUpdateImportHandler.php:131-252 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1391-1414 |
| 取込の判定順序 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:272-278 |
| 入出力: 取り込むファイルの読み取り | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:131-164 |
| 入出力: 取り込むファイルの読み取り | P3 | pf-eccube3:src/Eccube/Resource/config/constant.yml.dist:256 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:848-856 |
