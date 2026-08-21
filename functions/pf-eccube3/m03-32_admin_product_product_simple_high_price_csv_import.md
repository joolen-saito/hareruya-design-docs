# 商品管理 — 高額商品価格変更CSV登録

## 業務ロジック

### 雛形の出力

見出し行だけを持つCSVを出力する。ファイル名は `simple_high_price.csv` とする。列の説明文言は持たない。

### 取込の受付条件

| 順序 | 判定 | 結果 |
|------|------|------|
| 1 | 送信内容が妥当でないとき | エラーを表示し、取込を開始しない |
| 2 | ファイルが選択されていないとき | CSVデータが無い旨のエラーを表示し、取込を開始しない |
| 3 | 二重引用符に囲まれた改行を除いた改行数が5010以上のとき | 上限超過のエラーを表示し、取込を開始しない |
| 4 | 1行目を見出し行とみなせないとき、または見出し行の直後にデータ行が無いとき | 取込を開始せず、エラーメッセージだけを返す |

ファイルは必須とし、大きさの上限は設定値（確認値5メガバイト）とする。ファイルの種別はCSV・タブ区切り・書式なしテキスト・表計算ソフトの既定種別に限り、それ以外の種別は受け付けない。画面の入力はファイルとなりすまし対策トークンだけであり、他の入力項目は操作できない。

### 行の検証

見出し名と列定義が一致しないとき、必須列が空のときは、当該行で取込全体を中止する。中止したときは、読み込み済みの行も反映しない。

区切り文字は、拡張子がタブ区切りのときはタブ、それ以外のときは設定値とする。取り込むファイルの文字コードはUTF-8でなくてよく、判別したうえでUTF-8へ変換して読み取る。ゼロ幅スペースとバイト順マークは、位置を問わず取り除く。

### 更新の対象と対象外の行

高額対象の規格は、高額商品コードが設定された規格に限り、削除済みの商品・規格は対象としない。商品コードに該当する高額対象の規格が無い行は、行番号を付けたエラーを表示して取込全体を中止し、それまでに読み込んだ行も反映しない。

エラーが1件でもあるときは、完了メッセージを表示せず、取込履歴も残さない。

### 支店システムへの連携

取込を中止せずに終えたとき、更新した商品を支店システムへ通知する。同じ商品が複数の行にあっても通知は1件にまとめる。通知に失敗しても取込は成功として扱い、失敗した商品を再連携の対象として記録する。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | 取込のCSVファイルとなりすまし対策トークン |
| 成功時出力 | 登録完了のメッセージを表示し、アップロード画面へ戻る |
| 失敗時出力 | エラーを表示し、アップロード画面へ戻る |

### 入出力: 永続化

| 操作 | 契機 |
|------|------|
| 更新 | 行が対象規格に該当したとき。規格の更新日を記録する |
| 追加 | エラーなく取込を終えたとき。取込履歴を1件（種別は高額商品価格変更、ファイル名はアップロードしたファイルの名称） |
| 追加 | 価格が変わった行。買取・販売価格履歴を1件（変わった値の更新前と更新後を記録）。値が変わらない行は履歴を残さない |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-32-MSG-001 | 管理画面上部 | The uploaded file was too large. Please try to upload a smaller file. ／ CSRFトークンが無効です、再送信してください。 ／ フィールドグループに追加のフィールドを含んではなりません。 | CSV取込を送信したときに、アップロードしたファイルのサイズが上限を超えた、CSRFトークンが無効になった、または送信内容に未対応の項目が含まれるとき | 高額商品価格変更CSVアップロード画面に戻る |
| M03-32-MSG-002 | 管理画面上部 | CSVデータが存在しません | 送信内容は妥当だが、ファイルを選択せずにCSV取込を実行したとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-003 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | 上限を超える行数のCSVファイルを登録したとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-004 | 管理画面上部 | %d行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません） | CSVの商品コードがセール中の商品規格に該当するとき | 警告を表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-005 | 管理画面上部 | CSVのフォーマットが一致しません。 ／ CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 ／ CSVデータが存在しません。 ／ %s は必須項目です。 %d 行目のデータを確認してください。 ／ %d 行目の %s ではデータを取得できません。 ／ %d 行目の %s は0以上の数値を設定してください。 ／ %d 行目の %s は %d桁以内の数値 を設定してください。 ／ %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 ／ %d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です） | CSVのヘッダー形式が不正、またはデータ行の列数が不正なCSVを取り込んだとき | 高額商品価格変更CSVアップロード画面に戻る |
| M03-32-MSG-006 | 管理画面上部 | 登録が完了しました。 | CSVファイルをエラーなく登録したとき | 成功メッセージを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-007 | 管理画面上部 | %d行目: 対象の商品規格がありません。（商品公開ステータスが0かつ高額商品コードが設定された規格のみ対象です） | CSVの商品コードに価格変更の対象となる商品規格がないとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-008 | 管理画面上部 | %d 行目の %s ではデータを取得できません。 | CSVの商品コードに該当する商品規格が見つからないとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |
| M03-32-MSG-009 | 管理画面上部 | %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 | CSVの商品コードに該当する商品規格が複数あるとき | エラーを表示し、高額商品価格変更CSVアップロード画面に遷移する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 雛形の出力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:474-478 |
| 雛形の出力 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:507-515 |
| 取込の受付条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1126-1145 |
| 取込の受付条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190-213 |
| 取込の受付条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:27-40 |
| 取込の受付条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvMimeTypeValidator.php:17-32 |
| 取込の受付条件 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2284-2289 |
| 行の検証 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52-99 |
| 行の検証 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:144-165 |
| 行の検証 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:166-181 |
| 行の検証 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:222-277 |
| 更新の対象と対象外の行 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:149-163 |
| 更新の対象と対象外の行 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:169-200 |
| 更新の対象と対象外の行 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1149-1158 |
| 支店システムへの連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:63-79 |
| 支店システムへの連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:66-77 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1149-1166 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:267-287 |
| 入出力: 永続化 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/SimpleHighPriceImportHandler.php:331-360 |
