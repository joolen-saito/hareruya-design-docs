# M03-31（セール用価格変更CSV登録）

## 業務ロジック

### 受け付けるファイル

ファイルが選ばれていない、ファイルの大きさが上限を超える、ファイルの種類がCSV・TSV・テキスト・表計算のいずれでもない、のいずれかに当たるときは取込を行わず、同じ画面を再表示する。

拡張子が tsv のファイルはタブ区切り、それ以外はカンマ区切りとして読む。文字コードがUTF-8以外のファイルはUTF-8として読み直す。行頭・行中のゼロ幅空白は読み捨てる。

ファイルの行数が5010行以上のときは、1行も取り込まずに同じ画面を再表示する。

1行目にヘッダ行が無いとき、2行目以降にデータ行が無いときも、1行も取り込まない。

### 取込の中止と取り消し

行の不備を1件でも見つけた時点で取込を打ち切り、それより前の行で更新した内容もすべて取り消す。打ち切った行より後の行は読まない。部分的に取り込まれた状態は残らない。

行の不備として扱うのは次のとき。

- 行の列数がフォーマットの列数と一致しない。
- フォーマットにある列が行に見つからない。
- 必須の列が空、または形式が合わない。
- 指定した言語が存在しない。
- 指定したタグが存在しない。
- 買取価格が販売価格を上回る。
- 指定した商品が存在しない。削除済みの商品は存在しないものとして扱う。

行の不備を見つけたときは、完了のメッセージを出さず、取込履歴にも残さない。

### 更新の対象となる商品規格

対象は、行の商品IDと言語IDの両方に一致する商品規格のすべてであり、価格は規格ごとに算出して更新する。削除済みの規格は対象にしない。

高額商品コードを持つ規格は、本CSVの更新対象から外す。

### 規格ごとの価格の算出

販売価格は、行の販売価格に規格の割引率を掛け、10円単位に切り上げた額とする。割引率が設定されていない規格は割引しないが、10円単位への切り上げは行う。

買取価格は、規格の状態と設定によって次のように決まる。

- 状態がNMの規格は、行の買取価格をそのまま用いる。丸めは行わない。
- 買取減額率が設定された規格は、行の買取価格に減額率を掛け、100円単位に切り上げた額とする。
- 減額率が無く、行の買取価格が1円以上10000円以下の規格は、買取価格表から引いた額をそのまま用いる。丸めは行わない。買取価格表は、行の買取価格・規格の状態・箔押しまたはプロモーションであるかどうかの3つで引く。
- 減額率が無く、行の買取価格が0円または10000円を超える規格は、状態ごとの既定の割合を掛け、100円単位に切り上げた額とする。既定の割合は、箔押しでもプロモーションでもない規格が SP 75%・MP 75%・HP 50%、箔押しまたはプロモーションの規格が SP 70%・MP 70%・HP 40% とする。

### 商品タグの更新

行ごとに、その商品に登録されているタグをすべて削除したうえで、行のタグ列に並んだタグIDで登録し直す。タグ列が空の行では、その商品のタグは全件が消える。

タグは商品単位で持つため、この入れ替えは言語や規格の別によらず、その商品全体に及ぶ。

### 帯URL

帯URLの列が空の行では、対象規格の帯URLを未設定にする。

### 価格履歴の記録

規格の販売価格・買取価格のいずれかが更新前と変わったときだけ、その規格の価格履歴を1件残す。どちらも変わらない規格では残さない。

履歴には、変わった側の価格だけを更新前と更新後の組で記録する。あわせて操作した担当者を記録する。

### 支店システムへの通知と取込履歴

取込が成功したときだけ、取り込んだ商品を支店システムへ通知する。通知は取り込んだ商品IDから重複を除いた一覧で1回行う。

支店システムへの通知に失敗しても取込は成功のままとし、通知できなかった内容を連携エラーとして残す。残した内容は再連携の対象になる。

取込が成功したときだけ、アップロードしたファイルの名前を取込履歴に残す。

## 入出力

| 種類 | 内容 |
|------|------|
| 入力 | CSVまたはTSVのファイル1つと、画面が発行した照合値。 |
| 成功時出力 | 対象規格の販売価格・買取価格・帯URLの更新、商品タグの入れ替え、価格履歴の追加、支店システムへの通知、取込履歴への記録、完了メッセージを付けた同じ画面。 |
| 失敗時出力 | 更新はすべて取り消され、エラーの一覧を付けた同じ画面。取込履歴は増えない。 |

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 後続処理 |
| --- | --- | --- | --- | --- |
| — | 画面上部のフラッシュ領域 | `商品登録CSVファイルをアップロードしました。` | 取込が成功したとき。キー。 | — |
| — | 画面上部のフラッシュ領域 | `ファイルを選択してください。` | ファイル未選択でアップロードしたとき。キー。 | — |
| — | 画面上部のフラッシュ領域 | `CSVファイルは {N} MB以下でアップロードしてください。` | ファイルサイズが上限を超えたとき。キー。 | — |
| — | 画面上部のフラッシュ領域 | `ファイル形式が異なります。CSVファイルをアップロードしてください。` | MIMEがCSVでないとき。キー。 | — |
| — | 画面上部のフラッシュ領域 | `{N} 行を超えるCSVファイルは登録できません。` | 行数が上限以上のとき。`{N}`は上限値。キー。 | — |
| — | — | `CSVのフォーマットが一致しません。` | ヘッダ行が無いとき。キー。 | — |
| — | — | `CSVデータが存在しません。` | データ行が無いとき。キー。 | — |
| — | — | `{N} 行目の販売価格は買取価格より大きい価格を設定してください。` | 買取価格が販売価格を上回る行。キー。 | — |
| — | — | `{N} 行目の {列名} ではデータを取得できません。` | 商品IDが存在しない行など。キー。 | — |

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvImportType.php:27 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Form/Type/Admin/CsvMimeTypeValidator.php:17 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:908 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:131 |
| 受け付けるファイル | P2 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:190 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/BaseCsvImportHandler.php:52 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:71 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Model/ColumnDefinitions.php:122 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/CsvImporter.php:237 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:174 |
| 取込の中止と取り消し | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:920 |
| 更新の対象となる商品規格 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:228 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:368 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:510 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Util/PriceUtil.php:27 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbBuyPriceList.php:13 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Entity/MtbBuyPriceList.php:16 |
| 規格ごとの価格の算出 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Repository/MtbBuyPriceListRepository.php:13 |
| 商品タグの更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:286 |
| 商品タグの更新 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:302 |
| 帯URL | P3 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:432 |
| 価格履歴の記録 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:470 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/Csv/Importer/Event/ProductPriceImportHandler.php:82 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Service/BranchUpdateService.php:66 |
| 支店システムへの通知と取込履歴 | P1 | pf-eccube3:app/Plugin/HareruyaEc/Controller/Admin/Product/ProductCsvController.php:925 |
