# a07-04_0507_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-04_0507_sheet-6_sheet.json#a07-04_0507_sheet-6_sheet-conformance-fdde371a521b`
- 機能: A07-04 A07-04 ネット買取受注ステータス更新
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は失敗時401/404を『本文を持たない』と定義するが、実装はApp API共通ExceptionListenerで必ずJSON本文 {code, errors} を返す。

## 判定理由
設計(1510行)の失敗レスポンス表は 401=『認証拒否（本文を持たない）』、404=『該当なし（本文を持たない）』と明記。実装では受注なし時に BuyOrderController::updateStatus が NotFoundException を throw する(BuyOrderController.php:131)。NotFoundException/UnauthenticatedException はいずれも BaseApiException を継承し statusCode(404/401)と errors を保持する。ExceptionListener は isAppApi() 配下(ExceptionListener.php:72)で BaseApiException の getErrors() を取り(81-83行)、必ず JsonResponse(['code'=>$statusCode,'errors'=>$errors], $statusCode) を返す(136-139行)。よって404は {code:404, errors:['買取情報が見つかりません']} の本文付き応答となり、設計の『本文を持たない』と食い違う。認証『該当する管理者会員なし』も controller の UnauthenticatedException(BuyOrderController.php:148)経由で同様にJSON本文401となる。本文なしへ分岐する実装は見つからなかった。（なおトークン欠落・署名不正はSecurityファイアウォール層(security.yaml app: access_token)で処理されるため本文有無は別経路だが、少なくとも404および会員なし401はJSON本文を返す点で設計と相違する。）

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1510-1510` — 設計要求（失敗レスポンス表）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>404</td><td>受注IDに該当するネット買取受注が無い</td><td>該当なし（本文を持たない）</td></tr><tr><td>400</td><td>指定ステータスIDが買取ステータスマスタに存在しない</td><td><code>{code, errors}</code>（<code>errors</code>は「正しい店頭買取ステータスIDを入力してください」）</td></tr><tr><td>400</td><td>更新前ステータスが査定終了で、指定ステータスが査定中・査定再開</td><td><code>{code, errors}</code>（<code>errors</code>は「この査定はすでに終了しているため開くことができません。」）</td></tr><tr><td>400</td><td>更新前ステータスが査定終了で、指定ステータスがそれ以外</td><td><code>{code, errors}</code>（<code>errors</code>は「この査定はすでに終了しているためステータスの更新に失敗しました。」）</td></tr><tr><td>400</td><td>査定中・査定再開の受注を、査定担当者本人以外が査定中・査定再開へ更新</td><td><code>{code, errors}</code>（<code>errors</code>は「この受注は「（査定担当者名）」が査定中です。」）</td></tr><tr><td>500</td><td>保存処理中の例外</td><td><code>{code, errors}</code>（<code>errors</code>は例外メッセージ。トランザクションはロールバックする）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
404はBaseApiException経由でExceptionListenerへ渡る
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:127-131` — 受注なしでNotFoundExceptionをthrow

```php
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $BuyOrder = $this->buyOrderRepository->find($id);
        if (!$BuyOrder instanceof DtbBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
```

本文なしに分岐しない
`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:72-139` — App API例外は必ずJSON本文{code,errors}を返す

```php
        if ($this->requestContext->isAppApi()) {
            $logLevel = 'error';
            $errors = ['システムエラーが発生しました'];
            $statusCode = Response::HTTP_INTERNAL_SERVER_ERROR;

            $logException = $exception->getPrevious() ?: $exception;
            $errorClass = (new \ReflectionClass($exception))->getShortName();

            // カスタムエラーの場合は、エラーコードとメッセージを取得
            if ($exception instanceof BaseApiException) {
                $statusCode = $exception->getStatusCode();
                $errors = $exception->getErrors();
                $logLevel = $exception->getLogLevel();
            // HttpException は statusCode を尊重（4xxはwarning, 5xxはerror）
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
                    Response::HTTP_UNAUTHORIZED => ['認証エラー'],
                    Response::HTTP_FORBIDDEN => ['権限エラー'],
                    default => ['システムエラーが発生しました'],
                };
            }

            // ログ出力
            $logContext = [
                'status' => $statusCode,
                'title' => $title,
                'message' => $message,
                'errors' => $errors,
                'line' => $logException->getLine(),
                'level' => $logLevel,
            ];
            switch ($logLevel) {
                case 'error':
                    $logContext += [
                        'method' => $this->requestContext->getMainRequest()?->getMethod(),
                        'file' => $logException->getFile(),
                        'trace' => $logException->getTraceAsString(),
                    ];
                    log_error($errorClass, $logContext);
                    break;
                case 'warning':
                    log_warning($errorClass, $logContext);
                    break;
                case 'info':
                    log_info($errorClass, $logContext);
                    break;
                case 'debug':
                    log_debug($errorClass, $logContext);
                    break;
                default:
                    log_error('Unknown LogLevel: '.$logLevel, $logContext);
                    break;
            }

            $response = new JsonResponse([
                'code' => $statusCode,
                'errors' => $errors,
            ], $statusCode);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。引用・別実装ともに検証したが反証できず。設計1510行は 404『受注IDに該当するネット買取受注が無い＝該当なし（本文を持たない）』と明記（Read で確認、一意な表記）。実装は BuyOrderController::updateStatus が受注なし時に throw new NotFoundException('買取情報が見つかりません')（BuyOrderController.php:131 確認）。NotFoundException は BaseApiException(statusCode=404, errors=[$message]) を継承（NotFoundException.php, BaseApiException.php 確認）。App API の例外応答ハンドラを全数探索: KernelEvents::EXCEPTION を購読するのは ExceptionListener / TransactionListener / LogListener の3つのみで、Response をセットするのは ExceptionListener だけ。ExceptionListener は isAppApi() 配下(72行)で必ず new JsonResponse(['code'=>$statusCode,'errors'=>$errors], $statusCode) を返す(136-139行、本文なしへ分岐する枝は存在しない)。isAppApi() は /api/v1/ 始まりで true を返し(Context.php:74-86)、当ルート /%eccube_api_v1_route%/admin/buyOrder/{id}/status.json は該当。よって 404 は {code:404, errors:['買取情報が見つかりません']} の本文付き応答となり、設計『本文を持たない』と明確に相違する。設計に『現行踏襲』『対象外』等の除外注記も無し(1490-1546行確認)。トークン欠落/署名不正の401は security.yaml app: access_token のファイアウォール層で別処理となり得るが、404は本文付きで確定するため指摘は維持。
