# a07-05_0507_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-05_0507_sheet-7_sheet.json#a07-05_0507_sheet-7_sheet-conformance-e93dfe110454`
- 機能: A07-05 A07-05 ネット買取注文の査定終了処理
- 観点: ⑦要求網羅・実装違い

## 要旨
入力検証失敗時、設計はHTTP 400を要求するが、MapRequestPayload既定によりHTTP 422を返す。

## 判定理由
設計はステータス・明細の入力検証失敗を入力不正（HTTP 400）と明記（レスポンス失敗表・処理フロー・バリデーション節）。実装 updateBuyOrder は #[MapRequestPayload] UpdateBuyOrderDto を validationFailedStatusCode 未指定で使用しており、MapRequestPayload の既定 validationFailedStatusCode は Response::HTTP_UNPROCESSABLE_ENTITY(422)。UpdateBuyOrderDto は order_status に NotNull('ステータスを選択してください')、order_details に NotNull/Count('1つ以上の商品を選んでください')、明細 DTO に NotBlank/Length 等の Assert 制約を持つため、これら（設計が400とする検証）に失敗すると Symfony が 422 の HttpException を投げる。ExceptionListener は isAppApi 分岐で HttpExceptionInterface の getStatusCode()=422 をそのまま採用し {code:422, errors:[...]} を返す。よって設計の400と実装の422が食い違う。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1712-1712` — 設計要求（レスポンス失敗表）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>404</td><td>受注IDに該当するネット買取受注が無い</td><td>該当なし（本文を持たない）</td></tr><tr><td>400</td><td>ステータス・明細の入力検証に1件以上失敗</td><td><code>{code, errors}</code>（<code>errors</code>は検証メッセージの配列）</td></tr><tr><td>500</td><td>更新処理中の例外（ロールバック後に返す）</td><td><code>{code, errors}</code>（<code>errors</code>は例外メッセージの配列）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:170-171` — コントローラ（MapRequestPayload利用・statusCode未指定）

```php
    #[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}.json', name: 'api_admin_buy_order_update', methods: ['PUT'])]
    public function updateBuyOrder(int $id, #[MapRequestPayload] UpdateBuyOrderDto $updateBuyOrderDto): JsonResponse
```

`ec-cube-enterprise/vendor/symfony/http-kernel/Attribute/MapRequestPayload.php:42-42` — MapRequestPayload既定 validationFailedStatusCode=422

```php
        public readonly int $validationFailedStatusCode = Response::HTTP_UNPROCESSABLE_ENTITY,
```

`ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDto.php:28-38` — 検証制約を持つDTO

```php
        #[SerializedName('order_status')]
        #[Assert\NotNull(message: 'ステータスを選択してください')]
        #[Assert\Type('int')]
        public ?int $orderStatusId,

        #[SerializedName('order_details')]
        #[Assert\NotNull(message: '1つ以上の商品を選んでください')]
        #[Assert\Count(min: 1, minMessage: '1つ以上の商品を選んでください')]
        #[Assert\Valid]
        /** @var UpdateBuyOrderDetailDto[]|null */
        public ?array $orderDetails = null,
```

`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:86-97` — ExceptionListenerがHTTP例外のstatusCodeをそのまま返す

```php
            } elseif ($exception instanceof HttpExceptionInterface) {
                $statusCode = $exception->getStatusCode();
                $logLevel = $statusCode >= 500 ? 'error' : 'warning';

                // 返却メッセージのポリシー:
                // - 401/403 は固定文言（漏洩防止）
                // - 400/404/422 は元メッセージを返す
                // - それ以外は汎用文言
                $errors = match ($statusCode) {
                    Response::HTTP_BAD_REQUEST => [$exception->getMessage() ?: 'リクエストが不正です'],
                    Response::HTTP_NOT_FOUND => [$exception->getMessage() ?: 'リソースが見つかりません'],
                    Response::HTTP_UNPROCESSABLE_ENTITY => [$exception->getMessage() ?: '入力値が不正です'],
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。設計はHTML行1698/1705/1707/1712/1732/1746で一貫して入力検証失敗をHTTP 400と明記し、サンプル(1719-1725)も code:400 に「ステータスを選択してください。」「1つ以上の商品を選んでください。」を返す。これらは UpdateBuyOrderDto の Assert メッセージ(order_status NotNull, order_details NotNull/Count, #[Assert\Valid]で UpdateBuyOrderDetailDto の name NotBlank/Length へカスケード)と完全一致し、いずれも #[MapRequestPayload] 経由で検証される。BuyOrderController.php:171 は #[MapRequestPayload] を validationFailedStatusCode 未指定で使用。vendor MapRequestPayload.php:42 で既定は Response::HTTP_UNPROCESSABLE_ENTITY(422) と実確認。別実装の反証を試みたが、(a) src 内に validationFailedStatusCode の上書きは皆無、(b) MapRequestPayload( に引数を与える箇所なし(全て素の属性)、(c) 独自 RequestPayloadValueResolver 等のカスタムリゾルバも存在せず、(d) ExceptionListener.php:94-101 の HttpExceptionInterface 分岐は HTTP_UNPROCESSABLE_ENTITY を 422 のまま返し 400 へ再マップしない。よって設計400と実装422の食い違いは実在。指摘維持。
