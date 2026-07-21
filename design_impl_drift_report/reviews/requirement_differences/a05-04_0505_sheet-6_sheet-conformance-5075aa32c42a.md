# a05-04_0505_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a05-04_0505_sheet-6_sheet.json#a05-04_0505_sheet-6_sheet-conformance-5075aa32c42a`
- 機能: A05-04 A05-04 スマレジ受信処理
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は200で空レスポンスを返すと明記するが、実装は成功/重複時にJSON本文を返し、設計にないsmaregi-event-idヘッダ必須で400を返す分岐を持つ。

## 判定理由
新・基本設計はL1680『200 レスポンスデータは空を返す』、L1544『レスポンス書式 なし(状態コードのみ)』。実装は成功時 JsonResponse(['status'=>'ok'],200)(L107)、重複時 ['status'=>'ok','message'=>'Event is duplicate'](L85)と本文付きJSONを返し、さらに設計に無い smaregi-event-id ヘッダ欠落で 400(L74)を返す。空応答・状態コードのみという設計と、本文あり＋追加必須ヘッダによる400分岐が食い違う。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1680-1680` — 設計要求(200空応答)

```html
            <p class="doc-p" style="--lv:0">200　レスポンスデータは空を返す　https://developers.smaregi.dev/apidoc/common/#section/Webhook</p>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:107-109` — 実装(成功時JSON本文)

```php
            return new JsonResponse([
                'status' => 'ok',
            ], Response::HTTP_OK);
```

`ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:67-78` — 実装(設計に無い必須ヘッダ400)

```php
        $smaregiEventId = $request->headers->get('smaregi-event-id');
        if ($smaregiEventId === null) {
            log_warning('Smaregi-Event-Id header is missing', [
                'uri' => $request->getUri(),
                'headers' => $request->headers->all(),
            ]);

            return new JsonResponse([
                'status' => 'error',
                'message' => 'Smaregi-Event-Id header is required',
            ], Response::HTTP_BAD_REQUEST);
        }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。新・基本設計L1680『200 レスポンスデータは空を返す』、L1544『レスポンス書式 なし(ステータスコードのみ)』。実装は成功時 JsonResponse(['status'=>'ok'],200) L107、重複時 ['status'=>'ok','message'=>'Event is duplicate'] L85 と非空のJSON本文を返し、さらに設計のWebhook受信データ(L1668-1671 契約ID/イベント名/アクション/取引IDリスト)に存在しない smaregi-event-id ヘッダを必須化し欠落時400(L67-78)を返す。反証を試みたが、コード上これらの本文・400分岐は実在し、設計側にsmaregi-event-idヘッダ要求も本文返却許可も見当たらない。新設計の operative な要求(空応答・状態コードのみ)からの逸脱は明白のため指摘を維持。
