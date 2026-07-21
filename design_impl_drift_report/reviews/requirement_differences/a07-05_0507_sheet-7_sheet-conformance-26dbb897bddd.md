# a07-05_0507_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-05_0507_sheet-7_sheet.json#a07-05_0507_sheet-7_sheet-conformance-26dbb897bddd`
- 機能: A07-05 A07-05 ネット買取注文の査定終了処理
- 観点: ⑦要求網羅・実装違い

## 要旨
受注が無い404応答を設計は本文なしとするが、実装は{code, errors}のJSON本文を返す。

## 判定理由
設計はレスポンス失敗表・エラー処理節で、受注IDに該当が無い場合を「該当なし（HTTP 404）」かつ『本文を持たない』と明記（401と同様に本文なし。400/500のみ{code, errors}本文を持つと区別している）。実装 updateBuyOrder は対象受注が無い場合 NotFoundException('買取情報が見つかりません') を投げ、NotFoundException は BaseApiException で statusCode=HTTP_NOT_FOUND(404)・errors=['買取情報が見つかりません']。ExceptionListener は isAppApi 分岐で BaseApiException の statusCode/errors を採り、常に new JsonResponse(['code'=>$statusCode,'errors'=>$errors], $statusCode) を返す。したがって404でも {code:404, errors:['買取情報が見つかりません']} のJSON本文が返り、設計の『本文を持たない』と食い違う。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1712-1712` — 設計要求（404は本文なし）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>404</td><td>受注IDに該当するネット買取受注が無い</td><td>該当なし（本文を持たない）</td></tr><tr><td>400</td><td>ステータス・明細の入力検証に1件以上失敗</td><td><code>{code, errors}</code>（<code>errors</code>は検証メッセージの配列）</td></tr><tr><td>500</td><td>更新処理中の例外（ロールバック後に返す）</td><td><code>{code, errors}</code>（<code>errors</code>は例外メッセージの配列）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:174-175` — 対象なし時にNotFoundExceptionを送出

```php
        if (!$BuyOrder instanceof DtbBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
```

`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:31-31` — NotFoundExceptionは404を持つBaseApiException

```php
            statusCode: Response::HTTP_NOT_FOUND,
```

`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136-139` — APIは常に{code, errors}のJSON本文を返す

```php
            $response = new JsonResponse([
                'code' => $statusCode,
                'errors' => $errors,
            ], $statusCode);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。設計HTML行1712のレスポンス失敗表は401/404を『本文を持たない』、400/500のみ『{code, errors}』と明確に区別し、エラー処理節(1745-1746)も404は本文言及なし。実装 BuyOrderController.php:175 は対象無しで NotFoundException('買取情報が見つかりません') を送出、NotFoundException.php:29-34 は BaseApiException として statusCode=HTTP_NOT_FOUND(404)・errors=['買取情報が見つかりません'] を保持。ExceptionListener.php:72-142 の isAppApi 分岐には空ボディを返す経路が一切存在せず、必ず new JsonResponse(['code'=>$statusCode,'errors'=>$errors], $statusCode)(136-139)を返す。別経路(404を先に握って空ボディ化する別リスナ/Controller)を探したが無し。当ルートは App/MTGBuyer 配下の買取アプリ向けAPIで isAppApi=真(同一分岐に400/500の他指摘も依存)。よって404でも {code:404, errors:[...]} のJSON本文が返り、設計『本文を持たない』と食い違う。指摘維持。
