# a02-04_0502_sheet-6_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-04_0502_sheet-6_id.json#a02-04_0502_sheet-6_id-conformance-45afd3b94cd7`
- 機能: A02-04 A02-04 ポップアップ用カード情報取得（旧商品ID）
- 観点: ⑦要求網羅・実装違い

## 要旨
404の本文キーが設計の {code, message} ではなく {code, errors} で返る。

## 判定理由
設計 line 1568 は 404 の本文の形を明示的に {code, message}（"Not Found"）と定めている。実装は ProductController.php:372-373 で該当なし時に NotFoundException('Not Found') を投げ、384-388 の BaseApiException 捕捉で {'code' => $e->getStatusCode(), 'errors' => $e->getErrors()} を返す。NotFoundException.php:29-31 は受け取った message を errors: [$message] として保持するため、本文は {code, errors:['Not Found']} となり、message キーではなく errors 配列で返る。当該旧商品IDルートで {code, message} を返す分岐は存在しないため実装違いと確認した。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1568-1568` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>該当する商品規格が無い</td><td><code>{code, message}</code>（"Not Found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
BaseApiException捕捉で errors キーを返す
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:384-388` — 実装(応答生成)

```php
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
            ], $e->getStatusCode());
```

message を errors 配列に格納
`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:27-34` — 実装(例外)

```php
    public function __construct(string $message = 'リソースが見つかりません', ?\Throwable $previous = null, string $logLevel = 'info')
    {
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
            logLevel: $logLevel,
            previous: $previous
        );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。(1)引用検証: 設計HTML line1568は 404本文を明示的に <code>{code, message}</code>（"Not Found"）と記載（確認済）。実装 ProductController.php:361-399 の getPopupProductByOldProductId は該当なし時 NotFoundException('Not Found') を投げ、380-388 の catch(BaseApiException) で {'code'=>getStatusCode(), 'errors'=>getErrors()} を返す。NotFoundException.php は parent::__construct(errors:[$message]) で 'Not Found' を errors配列に格納。よって実際の本文は {code, errors:['Not Found']} で message キー無し（確認済）。(2)別実装探索: rg で 'message' => の全出現を確認したところ、ProductController.php:125-126 で {code, message} を返す分岐は存在するが、それは別ルート products_search（/product/search）であり本件の旧商品IDルートではない。同ファイル line226 も別ルートで {code, errors:['Not Found']} を返す。当該旧商品IDルート(386-387)は明確に errors キー。ExceptionListener による再整形も、コントローラが BaseApiException を自前 catch して直接 JsonResponse を返すため経由しない。(3)設計除外/読み違い/重複: 該当なし。message→errors の観測可能な差異は実在。
