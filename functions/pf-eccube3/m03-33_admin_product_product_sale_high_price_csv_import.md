# 商品管理 — セール用高額商品価格変更CSV登録

## 業務ロジック

### 受け付けるファイル

ファイルが選ばれていない、ファイルの大きさが上限を超える、ファイルの種類がCSV・TSV・テキスト・表計算のいずれでもない、のいずれかに当たるときは取込を行わず、同じ画面を再表示する。

ファイルの行数が5010行以上のときは、1行も取り込まずに同じ画面を再表示する。行数は、取込ファイル全文の改行のうち、二重引用符の内側にある改行を除いて数える。

拡張子が tsv のファイルはタブ区切り、それ以外はカンマ区切りとして読む。文字コードがUTF-8以外のファイルはUTF-8として読み直す。行頭・行中のゼロ幅空白は読み捨てる。

1行目をヘッダ行として扱い、ヘッダ行が無いとき、2行目以降にデータ行が無いときは1行も取り込まない。

### 取込の中止と取り消し

行の不備を1件でも見つけた時点で取込を打ち切り、それより前の行で更新した内容もすべて取り消す。打ち切った行より後の行は読まない。部分的に取り込まれた状態は残らない。

行の不備として扱うのは次のとき。

- 行の列数がフォーマットの列数と一致しない。
- フォーマットにある列が行に見つからない。
- 必須の列が空、または形式が合わない。
- 指定したタグが存在しない。
- 買取価格が販売価格を上回る。
- 対象の商品規格が見つからない。

行の不備を見つけたときは、完了のメッセージを出さず、取込履歴にも残さない。取込の途中で処理が続けられなくなったときも、それまでの更新をすべて取り消す。

取込中は、同じ行を他の処理が押さえているときの待ち時間を5秒とする。

5秒待っても押さえが外れないときは、取込を継続せずに中止し、それまでの更新をすべて取り消す。この中止では完了のメッセージを出さず、取込履歴にも残さない。

### 更新の対象となる商品規格

対象は、行の商品コードに一致し、高額商品コードを持つ商品規格1件とする。削除済みの商品・商品規格は対象にしない。

### 更新する項目

対象の商品規格では、価格とセールフラグのほかに、帯URLと更新日時が書き換わる。これ以外の項目はこの取込では変わらない。

帯URLの列が空の行では、対象規格の帯URLを未設定にする。

### 商品タグの更新

行ごとに、その商品に登録されているタグをすべて削除したうえで、行のタグ(ID)列に並んだIDで登録し直す。タグは商品単位で持つため、この入れ替えは規格の別によらず、その商品全体に及ぶ。

### 価格履歴の記録

規格の販売価格・買取価格のいずれかが更新前と変わったときだけ、その規格の価格履歴を1件残す。どちらも変わらない行では残さない。

履歴には、変わった側の価格だけを更新前と更新後の組で記録する。あわせて操作した担当者を記録する。

### 支店システムへの通知と取込履歴

取込が成功したときだけ、取り込んだ商品を支店システムへ通知する。通知は取り込んだ商品から重複を除いた一覧で1回行う。

支店システムへの通知に失敗しても取込は成功のままとし、通知できなかった内容を連携エラーとして残す。残した内容は再連携の対象になる。

取込が成功したときだけ、セール用高額商品価格変更として、アップロードしたファイルの名前と操作した担当者を取込履歴に残す。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | CSVまたはTSVのファイル1つと、画面が発行した照合値。 |
| 成功時出力 | 対象規格の販売価格・買取価格・セールフラグ・帯URLの更新、商品タグの入れ替え、価格履歴の追加、支店システムへの通知、取込履歴への記録、完了メッセージを付けた同じ画面。 |
| 失敗時出力 | 更新はすべて取り消され、エラーの一覧を付けた同じ画面。取込履歴は増えない。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| M03-33-MSG-001 | 管理画面上部 | アップロードされたファイルが大きすぎます。小さなファイルで再度アップロードしてください。 ／ CSRFトークンが無効です、再送信してください。 ／ フィールドグループに追加のフィールドを含んではなりません。 | CSV取込を送信したときに、アップロードしたファイルのサイズが上限を超えた、CSRFトークンが無効になった、または送信内容に未対応の項目が含まれるとき | 取込を中止し、セール用高額商品価格変更CSVアップロード画面に遷移する |
| M03-33-MSG-002 | 管理画面上部 | CSVのフォーマットが一致しません | フォームが有効であるにもかかわらず、取込ファイルが指定されていないとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |
| M03-33-MSG-003 | 管理画面上部 | %maxRecord% 行を超えるCSVファイルは登録できません。 | CSVの行数が登録可能な上限以上のとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |
| M03-33-MSG-006 | 管理画面上部 | 登録が完了しました。 | CSVの登録処理がエラーなく完了したとき | 管理画面_商品管理_セール用高額商品価格変更CSV登録画面に遷移する |
| M03-33-MSG-004 | 管理画面上部 | %d行目: セール外のため、買取価格および販売価格はデータベースにある基準価格で更新してます。 ／ %d行目: 通常商品のため、買取価格はCSVの値で更新しました。 | セール中の商品をセール外（セールフラグ0）として、販売価格を入力したCSVをアップロードしたとき | 対象商品の販売価格を登録済みの基準価格にしてセール外へ更新し、CSVアップロード画面へ戻る |
| M03-33-MSG-005 | 管理画面上部 | CSVのフォーマットが一致しません。 ／ CSVデータが存在しません。 ／ CSVのフォーマットが一致しません。 %d 行目のデータを確認してください。 ／ %s は必須項目です。 %d 行目のデータを確認してください。 ／ %d 行目の %s の値が異常です。 ／ %d 行目の %s ではデータを取得できません。 ／ %d 行目の %s は0以上の数値を設定してください。 ／ %d 行目の %s は %d桁以内の数値 を設定してください。 ／ %s : %s がマスターから取得できません。 %d 行目のデータを確認してください。 ／ %d 行目の商品コードの値 %s は重複して登録されてるため更新できません。 | CSV取込でフォーマット不一致・データ不足・値不正があるとき | CSV登録画面に留まる |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:27 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvMimeTypeValidator.php:20 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1064 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:2284 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:131 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:100 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:237 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/PriceConsistencyRowValidator.php:43 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:99 |
| 更新の対象となる商品規格 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:188 |
| 更新の対象となる商品規格 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:228 |
| 更新する項目 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:382 |
| 更新する項目 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:414 |
| 商品タグの更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:263 |
| 商品タグの更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Validator/Repository/TagIdValidator.php:45 |
| 価格履歴の記録 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:453 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/HighPriceImportHandler.php:74 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:66 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:1081 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:288 |
