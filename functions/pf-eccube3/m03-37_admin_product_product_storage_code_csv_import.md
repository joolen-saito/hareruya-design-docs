# 商品管理 — 略称タグ更新CSV登録

## 業務ロジック

### 取込ファイルの読み方

1行目を見出し行として扱う。文字コードがUTF-8以外のときはUTF-8へ変換し、改行の種類をそろえ、ゼロ幅の空白文字とバイト順序記号を取り除いてから解釈する。拡張子が tsv のファイルはタブ区切りとして読み、それ以外は設定した区切り文字（既定はカンマ）と囲み文字で読む。

エラーに付く行番号は、見出し行を1行目として数えたファイル上の行番号とする。最初のデータ行は2行目になる。

### 取り込む前の確認

ファイルを選んでいないとき、設定した上限より大きいファイルのとき、選んだファイルの形式がCSVとして扱えないときは、エラーを表示して取込画面を再表示し、1行も取り込まない。

1行目を見出し行として読み取れないとき、およびデータ行が1行も無いときは、エラーを表示して1行も取り込まない。

### 行ごとの確認

データ行は先頭から順に確認する。次のいずれかに当たった行があると、その行で読み取りを打ち切る。

| 条件 |
|------|
| 行の要素数が、取り込みに使う項目の数と一致しない |
| 取り込みに使う項目が行に無い |
| 必須の項目が空である |
| 商品IDが0以上の数値でない |
| 商品IDに該当する商品が無い。削除された商品も「無い」として扱う |
| 略称タグの名称が、登録済みの略称タグのいずれとも一致しない |

### 取り込みの確定

取り込みは全行をひとまとまりとして確定する。途中の行で読み取りを打ち切ったときは、それより前の行の更新も残らない。部分的に取り込まれた状態にはならない。

同じ商品IDの行が複数あるときは、後の行の内容が残る。

### 支店システムへの連携

取り込みが最後まで通ったときにかぎり、更新した商品を支店システムへ通知する。

通知に失敗しても取り込みは成功のままとし、画面にはエラーを出さない。失敗した対象は、あとで連携をやり直せるように記録する。

### 取込履歴

取り込みが最後まで通ったときにかぎり、取り込んだファイル名・日時・作業者を履歴に残す。エラーで終わったときは履歴に残さない。

履歴の作業者は、その後に削除された管理者であっても名前を表示する。

履歴はアップロード日時の新しい順に並べて表示する。

### 雛形ファイル

雛形ファイルは、取り込みに使う項目名を並べた見出し行だけのCSVとする。データ行は含まない。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | CSVファイル（見出し行と1行以上のデータ行）、なりすまし対策トークン |
| 成功時出力 | 商品の略称タグの更新、完了メッセージ、支店システムへの通知、取込履歴の記録、取込画面の再表示 |
| 失敗時出力 | 取り込みの取り消し、行番号を含むエラーメッセージ、取込画面の再表示 |

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 更新 | 確認を通ったデータ行の取り込み（対象の商品の略称タグ） |
| 追加 | 取り込みが最後まで通ったときの取込履歴 |
| 追加 | 支店システムへの通知に失敗したときの、やり直し用の記録 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|
| M03-37-MSG-001 | 管理画面上部 | 商品登録CSVファイルをアップロードしました。 | 全行の取り込みが終わったとき | 取込画面を再表示する |
| M03-37-MSG-002 | 管理画面上部 | ファイルを選択してください。 | ファイルを選ばずにアップロードしたとき | 取込画面を再表示する |
| M03-37-MSG-003 | 管理画面上部 | CSVファイルは %d MB以下でアップロードしてください。 | 設定した上限より大きいファイルのとき | 取込画面を再表示する |
| M03-37-MSG-004 | 管理画面上部 | ファイル形式が異なります。CSVファイルをアップロードしてください。 | 選んだファイルの形式がCSVとして扱えないとき | 取込画面を再表示する |
| M03-37-MSG-005 | 管理画面上部 | %d 行を超えるCSVファイルは登録できません。 | 行数が上限に達したとき | 取込画面を再表示する |
| M03-37-MSG-006 | アップロード欄 | CSVのフォーマットが一致しません。 | 1行目を見出し行として読み取れないとき | 取込画面を再表示する |
| M03-37-MSG-007 | アップロード欄 | CSVデータが存在しません。 | データ行が1行も無いとき | 取込画面を再表示する |
| M03-37-MSG-008 | アップロード欄 | CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 | 行の要素数が、取り込みに使う項目の数と一致しないとき | 取り込みを取り消して取込画面を再表示する |
| M03-37-MSG-009 | アップロード欄 | %s は必須項目です。 %d 行目のデータを確認してください。 | 必須の項目が空のとき | 取り込みを取り消して取込画面を再表示する |
| M03-37-MSG-010 | アップロード欄 | %d 行目の %s は0以上の数値を設定してください。 | 商品IDが0以上の数値でないとき | 取り込みを取り消して取込画面を再表示する |
| M03-37-MSG-011 | アップロード欄 | %d 行目の %s ではデータを取得できません。 | 取り込みに使う項目が行に無いとき、商品IDに該当する商品が無いとき、略称タグの名称が登録済みの略称タグと一致しないとき | 取り込みを取り消して取込画面を再表示する |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 取込ファイルの読み方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:131 |
| 取込ファイルの読み方 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:237 |
| 取り込む前の確認 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1359 |
| 取り込む前の確認 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190 |
| 行ごとの確認 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52 |
| 行ごとの確認 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:137 |
| 取り込みの確定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:272 |
| 取り込みの確定 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:237 |
| 支店システムへの連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/StorageCodeImportHandler.php:57 |
| 支店システムへの連携 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:66 |
| 取込履歴 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1388 |
| 取込履歴 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1859 |
| 取込履歴 | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1860 |
| 雛形ファイル | P3 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:508 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbProductSubRepository.php:171 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Repository/DtbCsvImportHistoryRepository.php:25 |
| 入出力: 永続化 | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:205 |
