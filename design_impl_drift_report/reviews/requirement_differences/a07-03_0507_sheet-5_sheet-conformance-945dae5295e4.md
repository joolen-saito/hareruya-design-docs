# a07-03_0507_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-03_0507_sheet-5_sheet.json#a07-03_0507_sheet-5_sheet-conformance-945dae5295e4`
- 機能: A07-03 A07-03 ネット買取受注コメント更新
- 観点: ⑦要求網羅・実装違い

## 要旨
500応答の errors に保存例外のメッセージを返すべき設計に対し、実装は例外メッセージを破棄し固定文言「システムエラーが発生しました」へ置換している。

## 判定理由
設計書（1326行・1354行）は保存処理中の例外時に HTTP 500 と {code, errors} を返し、errors は『例外メッセージ』であることを要求している。実装を追うと、UpdateFreeCommentAction::handle は catch 節で entityManager->rollback() 後、元の $e のメッセージを使わず throw new \RuntimeException('システムエラーが発生しました') を投げる（UpdateFreeCommentAction.php:44）。Controller::updateFreeComment は Throwable を catch し throw new InternalException('システムエラーが発生しました', $e) と固定文言で包み直す（BuyOrderController.php:117）。InternalException は errors: [$message] を持ち、$message の既定値も固定文言（InternalException.php:27,30）。ExceptionListener は BaseApiException から $exception->getErrors() を取り出し（ExceptionListener.php:83）、JsonResponse に code と errors を詰めて返す（ExceptionListener.php:136-139）。よって外部契約上、errors には保存例外の実メッセージではなく固定の汎用文言が露出する。ロールバック（UpdateFreeCommentAction.php:42）と {code, errors} の JSON 形は設計どおり実装済みで、差異は errors の値のみ。別ルート・別ハンドラで例外メッセージを返す経路は存在せず、置換が確定的。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1353-1354` — 設計要求（エラー処理／レスポンス失敗）

```html
          <h2 id="function-design-a07-03-a07-03_api_online_purchase_buy_order_free_comment-エラー処理">エラー処理</h2>
          <div class="table-wrap"><table><thead><tr><th>エラー内容</th><th>処理</th></tr></thead><tbody><tr><td>認証不可</td><td>認証拒否（HTTP 401）とする。</td></tr><tr><td>受注が存在しない</td><td>該当なし（HTTP 404）とする。</td></tr><tr><td>コメント未指定</td><td>入力不正（HTTP 400）とし、「コメントを入力してください」を返す。</td></tr><tr><td>保存処理中の例外</td><td>処理失敗（HTTP 500）とし、例外メッセージを返す。トランザクションをロールバックする。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
元の $e のメッセージを使わず固定文言で再スロー
`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateFreeCommentAction.php:41-44` — Action が固定文言の例外を投げる

```php
        } catch (\Exception $e) {
            $this->entityManager->rollback();
            $this->logger->error('Failed to update free comment', ['exception' => $e]);
            throw new \RuntimeException('システムエラーが発生しました');
```

`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:115-118` — Controller が固定文言で InternalException に包み直す

```php
            // システムエラーの場合は隠蔽して500エラーを返す
        } catch (\Throwable $e) {
            throw new InternalException('システムエラーが発生しました', $e);
        }
```

`ec-cube-enterprise/src/Eccube/Exception/App/InternalException.php:27-31` — InternalException は errors に固定文言メッセージを格納

```php
    public function __construct(string $message = 'システムエラーが発生しました', ?\Throwable $previous = null, string $logLevel = 'error')
    {
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_INTERNAL_SERVER_ERROR,
```

`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:81-138` — ExceptionListener が errors をそのまま JSON 応答に返す

```php
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
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが全て崩れ、指摘は維持。(1)引用検証:UpdateFreeCommentAction.php:44 は catch(\Exception $e) 内で rollback + logger->error 後、元の $e のメッセージを使わず throw new \RuntimeException('システムエラーが発生しました') を投げる（引用正確）。BuyOrderController.php:117 は catch(\Throwable $e){ throw new InternalException('システムエラーが発生しました', $e); } で固定文言に包み直す（引用正確、しかも直前に『システムエラーの場合は隠蔽して500エラーを返す』というコメントあり=意図的隠蔽）。InternalException.php:29 は errors:[$message] で $message 既定も固定文言（正確）。ExceptionListener.php:83 は BaseApiException から getErrors() を取得、:136-139 で {code, errors} JsonResponse を返す（正確）。(2)別実装:rg で freeComment/UpdateFreeCommentAction を全 src 横断。対象機能(ネット買取受注 A07-03)を処理するのは BuyOrder\UpdateFreeCommentAction のみで、もう一つ存在する OtcBuyOrder\UpdateFreeCommentAction は別機能(店頭買取)。500 時に保存例外の実メッセージを errors へ返す経路は存在しない。InternalException は BaseApiException なので ExceptionListener は常に固定 getErrors() を返し、仮に RuntimeException が漏れても default 分岐で 'システムエラーが発生しました' となる。$previous のメッセージを errors へ復元する処理は ExceptionListener/Exception 配下に無い。(3)設計側除外:設計HTML(0507_...html)は line~1329 レスポンス(失敗)表『500|保存処理中の例外|{code, errors}（errorsは例外メッセージ。トランザクションはロールバックする）』および line~1354 エラー処理表『保存処理中の例外|処理失敗(HTTP 500)とし、例外メッセージを返す。トランザクションをロールバックする。』の2箇所で明示要求。Ph2/対象外/現行踏襲/隠蔽の注記は近傍に無い。(4)要求読み違い:400 は固定文言『コメントを入力してください』、500 は『例外メッセージ』と明確に対比させており、500 は原例外メッセージの露出を意図。実装は原メッセージを破棄し固定汎用文言へ置換=外部契約不一致が確定。ロールバックと {code,errors} 形は実装済みで差異は errors の値のみ。
