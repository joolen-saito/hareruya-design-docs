# a02-02_0502_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-02_0502_sheet-4_sheet.json#a02-02_0502_sheet-4_sheet-conformance-aecd2f753766`
- 機能: A02-02 A02-02 ポップアップ用カード情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は404失敗本文を {code, message} と定めるが、実装は {code, errors} を返し message キーを持たない。

## 判定理由
設計書のレスポンス（失敗）表(line 1183)は404本文の形を {code, message}（"Not Found"）と明記している。実装のA02-02エンドポイント popup_product_by_card_id (ProductController.php line 265) では該当なし時に NotFoundException('Not Found') をthrowし、catch (BaseApiException) ブロック(line 291-295)で ['code' => $e->getStatusCode(), 'errors' => $e->getErrors()] を返している。NotFoundException は親コンストラクタへ errors: [$message] を渡す実装(line 30)であり、値「Not Found」は errors 配列に格納される。message キーを返す処理はA02-02経路に存在せず、JSON契約のキー名が message ではなく errors になっているため設計と不一致。値("Not Found")自体は同等だが本文キーの形が異なる実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1183-1183` — 設計要求（404失敗レスポンス本文の形）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>該当する商品規格が無い</td><td><code>{code, message}</code>（"Not Found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
A02-02 エンドポイント popup_product_by_card_id の例外整形。message キーではなく errors キーを返す。
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:291-295` — 実装: catchでcode/errorsを返す

```php
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
            ], $e->getStatusCode());
```

'Not Found' は errors: [$message] としてerrors配列へ入るため message キーには現れない。
`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:29-34` — 実装: NotFoundExceptionはメッセージをerrors配列に格納

```php
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
            logLevel: $logLevel,
            previous: $previous
        );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を複数試みたが崩せず、指摘は維持。(1)別実装ルートの確認: A02-02経路の404整形は2箇所しか存在せず、いずれも {code, errors} を返す。ProductController::getPopupProductByCardId の inline catch (BaseApiException) が return json(['code'=>getStatusCode(),'errors'=>getErrors()]) を返す(291-295行)。仮に catch を通らずカーネルまで届いた場合の EventListener/ExceptionListener::onKernelException でも isAppApi 経路は JsonResponse(['code'=>$statusCode,'errors'=>$errors]) を返す(136-139行)。message キーを生成する経路はAPIには一切存在しない(message キーは Smaregi Webhook 経路 62-63行 と非API HTML 経路のみ)。rg で popup/card・findPopupProductByCardId を横断しても別Controllerは無し。(2)引用の正しさ: 設計HTML 1183行の失敗レスポンス表は「本文の形」列に literal で <code>{code, message}</code>（"Not Found"）と明記。実装側 NotFoundException は parent::__construct(errors:[$message],...)(30行)で 'Not Found' を errors 配列へ格納、BaseApiException::getErrors() は array を返す(48-51行)ため message キーには決して現れない。両引用とも実在を確認。(3)設計側除外の確認: 「本書で扱わないこと」(1153-1155行)は記事サイト表示仕様・商品ID取得・カードマスタ管理のみで、エラー本文形式は除外していない。「リニューアル移行時の扱い」(1158-1160行)はむしろ挙動をpf-api正とし応答命名も挙動仕様とする旨で、{code, message} 要求を強化する方向。Ph2/対象外/現行踏襲での除外記述は本文形式に無し。(4)要求の読み違い無し: エンドポイント GET /popup/card/{lang}/{cardId} は実装ルート /api/popup/card/{lang}/{cardId} と一致し同一機能。結論: キー名が message ではなく errors、かつ型が string ではなく array であり、設計と実装は構造的に不一致。反証不能。
