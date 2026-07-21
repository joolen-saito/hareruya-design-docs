# a02-03_0502_sheet-5_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-03_0502_sheet-5_id.json#a02-03_0502_sheet-5_id-conformance-f696cbc983f0`
- 機能: A02-03 A02-03 ポップアップ用商品情報取得（旧商品ID）
- 観点: ⑦要求網羅・実装違い

## 要旨
404応答本文のキーが設計の message ではなく errors 配列で返る。

## 判定理由
設計（レスポンス失敗表・エラー処理節）は404本文を {code, message}（message は "Not Found"）と規定する。実装 ProductController の旧商品IDルート（getPopupCardByOldProductId / getPopupProductByOldProductId）は該当なし時に NotFoundException('Not Found') を投げ、catch (BaseApiException) で ['code' => $e->getStatusCode(), 'errors' => $e->getErrors()] を返す。NotFoundException は親 BaseApiException に errors: [$message] を渡すため、外部JSONは {code:404, errors:['Not Found']} となる。HTTP 404 と文言 "Not Found" は一致するが本文キーが message ではなく errors 配列であり、外部契約のキーが異なる実装違い。BaseApiException 側にも message キーで返す経路は無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1381-1381` — 設計要求（404本文の形）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>該当する商品が無い</td><td><code>{code, message}</code>（"Not Found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
NotFoundExceptionを投げ、BaseApiException catchで code/errors を返す
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:323-339` — 404発生と本文組み立て

```php
            if ($result === null) {
                throw new NotFoundException('Not Found');
            }

            $locale = $result['languageCode'] === 'EN' ? 'en' : 'ja';
            $productUrl = $this->generateUrl(
                'product_detail',
                ['id' => (int) $result['productId'], '_locale' => $locale],
                UrlGeneratorInterface::ABSOLUTE_URL
            );

            return $this->json($this->popupResponseBuilder->build($result, $productUrl, true), Response::HTTP_OK);
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
            ], $e->getStatusCode());
```

`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:29-31` — NotFoundExceptionはmessageをerrors配列に格納

```php
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが不成立。(1)引用検証: 設計 HTML 1381行に 404 本文の形 `{code, message}`（"Not Found"）の記載を確認。実装 ProductController の旧商品ID両ルート（getPopupCardByOldProductId:319-350 / getPopupProductByOldProductId:363-399）は該当なし時に throw new NotFoundException('Not Found') し、catch(BaseApiException) で ['code'=>$e->getStatusCode(),'errors'=>$e->getErrors()] を JSON 返却。両ルートともキーは errors で message ではない。(2)別実装探索: NotFoundException.php:29-31 は parent に errors:[$message] を渡す。BaseApiException.php:25-32 は $message を implode で内部例外メッセージにするのみで getErrors() は errors 配列を返し、message キーで外部返却する経路は無い。JSON 応答は controller が catch 内で直接組み立てており、message キーへ変換する Subscriber/正規化層は介在しない。(3)結論: 外部 JSON の本文キーは errors 配列であり設計の message キーと不一致。HTTP404・文言"Not Found"は一致するが契約キー相違は実在。指摘は維持。
