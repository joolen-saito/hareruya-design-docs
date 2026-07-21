# a06-02_0506_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-41ef44b084c2`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
認証失敗時、設計は HTTP 401 で本文なしとするが、実装は {code:401, errors:['認証エラー']} の JSON 本文を返す。

## 判定理由
設計のレスポンス（失敗）定義は 401 を『認証拒否（本文を持たない）』とする。実装では Controller が認証失敗時に UnauthenticatedException('認証エラー') を投げ（:74）、App API では ExceptionListener が isAppApi 時に必ず (code, errors) を JSON で返す（:136-139）。401 の errors は固定文言 ['認証エラー'] に集約される（:98）。本文なしで返す経路は App API には無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1198-1198` — 設計要求（401 本文なし）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>500</td><td>受注取得・整形処理中の例外</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:74-74` — 認証失敗で例外送出

```php
            throw new UnauthenticatedException('認証エラー');
```

App API は常に code/errors を返す
`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:98-139` — 401 固定文言＋JSON本文返却

```php
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

反証を試みた結果、指摘は覆らなかった。ExceptionListener.php を実読。:72 で isAppApi() 分岐に入り、:98 で HTTP_UNAUTHORIZED の errors を固定 ['認証エラー'] とし、:136-139 で必ず JsonResponse(['code'=>$statusCode,'errors'=>$errors], $statusCode) を返す。App API では 401 でも (code, errors) の JSON 本文が付与される経路に集約され、本文なしで返す分岐は当該リスナーに存在しない。設計は 401 本文なしを要求。指摘は維持。（懐疑点として、実際の未認証リクエストは Symfony firewall のエントリポイントが先に応答する可能性はあるが、App API 例外は本リスナーで JSON 本文化される構造が確認できるため反証には至らず。）
