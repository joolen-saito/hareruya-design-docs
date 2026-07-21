# a01-01_0501_sheet-3_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a01-01_0501_sheet-3_sheet.json#a01-01_0501_sheet-3_sheet-conformance-63e8ff81693c`
- 機能: A01-01 A01-01 スマレジ連携処理
- 観点: ⑦要求網羅・未実装

## 要旨
在庫一括相対値更新APIの非同期処理結果をコールバックURLで受信し、問合せID/CSVを特定してS3からダウンロードしECCUBE在庫を更新、処理結果をCSV処理履歴に登録する一連の処理が実装されていない。

## 判定理由
スマレジWebhook受信は WebhookController の単一ルート smaregi_webhook(行41)のみで、受信内容をログ出力し SmaregiWebhookEventMessage を dispatch する検証用実装。在庫一括相対値更新のコールバック(問合せID・結果配列・エラーメッセージ)を受ける専用エンドポイント/処理は無い。Controller・Service/Smaregi 全体に inquiryId/問合せID/callback による対象CSV特定・S3ダウンロード・CSV処理履歴登録の実装が見つからない。Webhook/Stock 配下(StockEventDispatcher/SmaregiStockChangeApplier)は pos:stock の在庫変動履歴を受信して取り込む側(スマレジ→ECCUBE)であり、設計1098-1100行が定義する一括API結果の非同期受信フローは実装されていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1098-1100` — 設計要求(★3-3 コールバック非同期受信・S3ダウンロード・CSV処理履歴登録)

```html
            <h4 class="doc-h doc-h-sub" style="--lv:2">★3-3. 登録した処理結果がリクエストパラメータに登録したURLに非同期で返ってくるので、登録されていれば返ってきたらECCUBE側の在庫データも更新</h4>
            <p class="doc-p" style="--lv:3">処理が成功していれば、問合せ用IDやコールバックURLのパラメータに従い処理対象のCSVを特定し、S3よりダウンロードしてECCUBE側の処理を実行</p>
            <p class="doc-p" style="--lv:3">処理結果をCSV処理履歴に登録する</p>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:41-42` — WebhookController(単一のsmaregi_webhookルート、一括API callback用受信なし)

```php
    #[Route('', name: 'smaregi_webhook', methods: ['POST'])]
    public function index(Request $request): JsonResponse
```

## 不在確認コマンド

- `rg -rn -i 'inquiryId|問合せID|callback|一括相対値' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi`
- `rg -rn -i 's3|amazonaws|CSV処理履歴|processResult' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi`

## 反証結果

反証を試みた結果、指摘は覆らなかった。Controller/Smaregi のルートは #[Route('', name:'smaregi_webhook', methods:['POST'])] の1本のみで、docコメントに『検証用』『リクエスト内容をログ出力し200 OK固定レスポンス』と明記(WebhookController 38-45行)。src/Eccube/Controller・Service/Smaregi 全体を inquiryId|問合せ|callback で探しても一括API結果の非同期受信は皆無(Admin/Stock の setCallback はCSVストリーミング応答用の別物)。問合せID管理・S3ダウンロード・CSV処理履歴登録の実装なし。stock 系 MessageHandler は SmaregiStockProcessMessageHandler(スマレジ→ECCUBE の webhook取込)のみ。設計★3-3(1098-1100行 コールバック非同期受信→CSV特定→S3ダウンロード→ECCUBE更新→CSV処理履歴登録)が不在。指摘は維持。
