# a01-01_0501_sheet-3_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a01-01_0501_sheet-3_sheet.json#a01-01_0501_sheet-3_sheet-conformance-52d4079f412f`
- 機能: A01-01 A01-01 スマレジ連携処理
- 観点: ⑦要求網羅・未実装

## 要旨
在庫変更CSV登録の一括処理でスマレジ在庫一括相対値更新API連携・CSVのS3保存・100件毎分割・CSV履歴への処理結果反映が実装されていない。

## 判定理由
在庫変更CSVを取り込む StockChangeCsvImportHandler には smaregi/s3/callback/相対値/一括/100件分割 のいずれの参照も無く(rg 結果ゼロ)、CSV行から DtbStockEditApprovalDetail と DtbStockApprovalList を作成するDB登録のみ。Service/Smaregi 配下にも S3 保存・在庫一括相対値更新API(postBulkUpdate)呼び出し・100件毎分割の実装が見つからない。SmaregiStockApiClient に一括相対値更新メソッドも無い。設計1088-1093行が定義するPatch一括連携(コールバックURL設定・CSVのS3保存・100件毎分割・CSV履歴表示)の要求が満たされていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1090-1093` — 設計要求(Patch一括: S3保存/100件毎分割/CSV履歴)

```html
            <h4 class="doc-h doc-h-sub" style="--lv:2">★3-1. 管理画面操作によってスマレジ側の在庫のCSVによる登録処理</h4>
            <p class="doc-p" style="--lv:3">コールバックURLは処理結果が返ってきた時に処理ができるようにパラメータを設定する。</p>
            <p class="doc-p" style="--lv:3">CSVファイルはコールバックで返ってきた時に処理に使用するので、S3に保存しておく</p>
            <p class="doc-p" style="--lv:3">登録したCSVは各CSV登録画面で、CSV履歴として表示し処理結果を明示できるようにしておく。100件以上ある場合は、100件毎の小データにCSVを分割してS3に上げて履歴表示する</p>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:38-38` — StockChangeCsvImportHandler(承認明細/承認一覧のDB登録のみ、スマレジ一括API/S3なし)

```php
class StockChangeCsvImportHandler extends BaseCsvImportHandler
```

## 不在確認コマンド

- `rg -n -i 'smaregi|s3|callback|相対値|bulk|100|分割' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php`
- `rg -rn -i 's3|amazonaws|putObject|一括相対値|postBulkUpdate' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi`

## 反証結果

反証を試みた結果、指摘は覆らなかった。StockChangeCsvImportHandler を smaregi|s3|callback|bulk|100|分割|StockApiClient で grep しても class 宣言以外ヒットせず、CSV行→DtbStockEditApprovalDetail/DtbStockApprovalList のDB登録に留まる。Service/Smaregi 配下に在庫一括相対値更新API(postBulkUpdate)も 100件分割も無い(pos/stock URL は add/changes/list のみ)。S3 実装は S3FileAdapter/UniSearchExportService/TestS3UploadDemoCommand に存在するが在庫CSVのスマレジ連携用の保存ではない。設計★3-1(コールバックURL設定・CSVをS3保存・100件毎分割してS3・CSV履歴表示, 1088-1093行)の要求が不在。指摘は維持。
