# a06-05_0506_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-05_0506_sheet-7_sheet.json#a06-05_0506_sheet-7_sheet-conformance-04f8de66896c`
- 機能: A06-05 A06-05 店頭買取情報ステータス更新
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は 401/404 を本文なしと定めるが、App API 共通例外リスナーは 401/404 でも {code, errors} 本文を返す。

## 判定理由
設計のレスポンス失敗表（1887行）は 401 を「認証拒否（本文を持たない）」、404 を「該当なし（本文を持たない）」と明記する。実装 ExceptionListener::onKernelException は isAppApi 経路（72行）で必ず JsonResponse(['code'=>$statusCode,'errors'=>$errors])（136-139行）を返す。401 は Unauthenticated(BaseApiException 401, errors=['認証エラー'])・404 は NotFoundException(BaseApiException 404, errors=[メッセージ])としていずれも本文を持ち、設計の本文なし要求と異なる。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1887-1887` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>404</td><td>受注IDに該当する店頭買取受注が無い</td><td>該当なし（本文を持たない）</td></tr><tr><td>400</td><td>指定ステータスIDが店頭買取ステータスマスタに存在しない</td><td><code>{code, errors}</code>（<code>errors</code>は「正しい店頭買取ステータスIDを入力してください」）</td></tr><tr><td>400</td><td>更新前ステータスが査定終了で、指定ステータスが査定中・査定再開</td><td><code>{code, errors}</code>（<code>errors</code>は「この査定はすでに終了しているため開くことができません。」）</td></tr><tr><td>400</td><td>更新前ステータスが査定終了で、指定ステータスがそれ以外</td><td><code>{code, errors}</code>（<code>errors</code>は「この査定はすでに終了しているためステータスの更新に失敗しました。」）</td></tr><tr><td>400</td><td>査定中・査定再開の受注を、査定担当者本人以外が査定中・査定再開へ更新</td><td><code>{code, errors}</code>（<code>errors</code>は「この受注は「（査定担当者名）」が査定中です。」）</td></tr><tr><td>500</td><td>保存処理中の例外</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
必ず本文を設定
`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136-139` — App API 共通例外応答

```php
            $response = new JsonResponse([
                'code' => $statusCode,
                'errors' => $errors,
            ], $statusCode);
```

本文ありで返す
`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:94-101` — 401 文言固定

```php
                $errors = match ($statusCode) {
                    Response::HTTP_BAD_REQUEST => [$exception->getMessage() ?: 'リクエストが不正です'],
                    Response::HTTP_NOT_FOUND => [$exception->getMessage() ?: 'リソースが見つかりません'],
                    Response::HTTP_UNPROCESSABLE_ENTITY => [$exception->getMessage() ?: '入力値が不正です'],
                    Response::HTTP_UNAUTHORIZED => ['認証エラー'],
                    Response::HTTP_FORBIDDEN => ['権限エラー'],
                    default => ['システムエラーが発生しました'],
                };
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計(1887行 レスポンス失敗表)は401=『認証拒否（本文を持たない）』、404=『該当なし（本文を持たない）』と明記。実装 ExceptionListener::onKernelException は isAppApi() 経路(72行)で例外種別に依らず必ず JsonResponse(['code'=>statusCode,'errors'=>errors])(136-139行)を返す。当機能で throw される UnauthenticatedException・NotFoundException はいずれも BaseApiException を継承(UnauthenticatedException.php:20 / NotFoundException.php:20, statusCode=HTTP_NOT_FOUND)であり、81-83行で statusCode/errors を取得→本文設定。401は errors=['認証エラー']、404は errors=[メッセージ] が本文に載る。全234行を通読したが App API 経路で401/404の本文を空にする分岐は存在しない。よって設計の『本文を持たない』要求と実装が不一致。別ルート/除外注記も無し。指摘は維持。
