/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：本人確認更新
課題カテゴリ：実装違い
課題：本人確認証明書IDがマスタに存在しない場合にHTTP 400ではなくHTTP 404を返す
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、存在する店頭買取受注IDを指定して PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/identification.json を実行する
2. リクエストボディに mtb_identification に存在しない値を identification=999999 のように指定する
3. レスポンスのHTTPステータスと本文の code / errors を確認する

# 期待される挙動【必須】
- リクエストの identification が未指定、または本人確認証明書マスタに存在しないIDの場合は HTTP 400 を返す
- HTTP 400 の本文は {code, errors} 形式で、errors に「正しい証明書IDを入力してください」を返す
- 受注IDに該当する店頭買取受注が存在しない場合のみ HTTP 404 とする

# 現在の挙動【必須】
- ec-cube-enterprise では、`identification` パラメータ欠落時は `MissingRequiredParameterException` により HTTP 400 になる。一方、指定されたIDで `mtbIdentificationRepository->find()` した結果が `MtbIdentification` でない場合は `NotFoundException('正しい証明書IDを入力してください')` を投げる。`NotFoundException` は HTTP 404 として定義され、例外リスナーがその statusCode をそのまま `JsonResponse` のステータスと本文の `code` に使うため、マスタ不存在IDは設計の HTTP 400 ではなく HTTP 404 になる。

ec-cube-enterprise Controller は未指定のみ400、不存在IDは NotFoundException を投げる: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273-291`
```php
    #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])]
    public function updateIdentification(int $id, Request $request): JsonResponse
    {
        $OtcBuyOrder = $this->dtbOtcBuyOrderRepository->find($id);
        if (!$OtcBuyOrder instanceof DtbOtcBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
        }

        $raw = $request->request->get('identification');
        if ($raw === null) {
            throw new MissingRequiredParameterException('正しい証明書IDを入力してください');
        }

        $identificationId = (int) $raw;

        $Identification = $this->mtbIdentificationRepository->find($identificationId);
        if (!$Identification instanceof MtbIdentification) {
            throw new NotFoundException('正しい証明書IDを入力してください');
        }
```

ec-cube-enterprise NotFoundException は HTTP 404 を設定する: `ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:20-35`
```php
class NotFoundException extends BaseApiException
{
    /**
     * @param string $message エラーメッセージ
     * @param ?\Throwable $previous
     * @param string $logLevel ログレベル
     */
    public function __construct(string $message = 'リソースが見つかりません', ?\Throwable $previous = null, string $logLevel = 'info')
    {
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
            logLevel: $logLevel,
            previous: $previous
        );
    }
```

ec-cube-enterprise ExceptionListener は BaseApiException の statusCode をJSON応答に使う: `ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:80-140`
```php
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
            $event->setResponse($response);
```

ec-cube-enterprise テストは存在しない証明書IDを HTTP 404 として期待する: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:794-813`
```php
    /**
     * updateIdentification - 異常系
     * 身分証明書種別がみつからない場合は、404エラーを返すこと
     *
     * @group HARERUYA
     */
    public function testUpdateIdentificationWhenIdentificationNotFound(): void
    {
        // Arrange
        $OtcBuyOrder = $this->generator->createDtbOtcBuyOrder();
        $nonExistingIdentificationId = 999; // 存在しない身分証明書種別id
        $token = $this->jwtTokenService->createToken($this->Member->getId());

        // Act
        $this->client->request(Request::METHOD_PUT, '/api/v1/admin/otcBuyOrder/'.$OtcBuyOrder->getId().'/identification.json', ['identification' => $nonExistingIdentificationId], [], ['HTTP_JWT_TOKEN' => $token]);

        // Assert
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame(Response::HTTP_NOT_FOUND, $response['code']);
        $this->assertContains('正しい証明書IDを入力してください', $response['errors']);
```
- ベース実装(pf-api)では、同じ本人確認更新処理で `MtbIdentification` を `findOneBy(['id' => $identificationId])` し、空の場合は `code` に 400、`errors` に「正しい証明書IDを入力してください」を入れた `View` を HTTP 400 で返している。テストでも未指定・空文字・存在しないIDのいずれも HTTP 400 と同じエラーメッセージを期待している。

ベース実装 pf-api は本人確認更新ルートを同一Controllerへ定義する: `pf-api/config/routes.yaml:49-56`
```yaml
put_otcbuy_identification_json:
    path: /admin/otcBuyOrder/{id}/identification.json
    controller: App\Controller\Admin\OtcBuyOrderIdentificationController::putAction
    methods: PUT
put_otcbuy_identification:
    path: /admin/otcBuyOrder/{id}/identification
    controller: App\Controller\Admin\OtcBuyOrderIdentificationController::putAction
    methods: PUT
```

ベース実装 pf-api は証明書IDが見つからない場合に HTTP 400 を返す: `pf-api/src/Controller/Admin/OtcBuyOrderIdentificationController.php:32-44`
```php
        $identificationId = $request->get('identification');
        $putIdentification = $this->getDoctrine()
              ->getRepository(MtbIdentification::class)
              ->findOneBy(['id' => $identificationId]);

        if (empty($putIdentification)) {
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => ['正しい証明書IDを入力してください'],
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }
```

ベース実装 pf-api のテストは不存在IDも HTTP 400 と同じエラー文言を期待する: `pf-api/src/Tests/Controller/Admin/OtcBuyOrderIdentificationControllerPutActionTest.php:78-108`
```php
     * Not input identification
     */
    public function testFailureNoRequestIdentification()
    {
        $client = $this->submitTestRequest([], 1);
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $client->getResponse()->getStatusCode());
        $content = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals(self::BAD_REQUEST_MESSAGE, $content['errors'][0]);
    }

    /**
     * Not input identification
     */
    public function testFailureIdentificationIdEmpty()
    {
        $client = $this->submitTestRequest(['identification' => ''], 1);
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $client->getResponse()->getStatusCode());
        $content = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals(self::BAD_REQUEST_MESSAGE, $content['errors'][0]);
    }

    /**
     * Not input identification
     */
    public function testFailureIrregularIdentificationId()
    {
        $client = $this->submitTestRequest(['identification' => 99], 1);
        $this->assertEquals(Response::HTTP_BAD_REQUEST, $client->getResponse()->getStatusCode());
        $content = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals(self::BAD_REQUEST_MESSAGE, $content['errors'][0]);
    }
```

# 根拠
- 設計：
  - 設計は pf-api の挙動を正とし、証明書IDのマスタ不存在を HTTP 400 とする: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3412-3430`
  - 入出力定義は、証明書IDが本人確認証明書マスタに存在しない場合を HTTP 400 と明記する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3435-3442`
  - バリデーション定義も未指定・存在しないIDを HTTP 400 とする: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3452-3453`
- ec-cube-enterprise：
  - enterprise は存在しない証明書IDで NotFoundException を投げる: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:281-291`
  - NotFoundException は HTTP 404、MissingRequiredParameterException は HTTP 400 として定義される: `ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:20-35`
  - enterprise テストも存在しない証明書IDを HTTP 404 として固定している: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OtcBuyOrderControllerTest.php:794-813`
- ベース実装：
  - pf-api は本人確認証明書マスタに該当しない場合、HTTP 400 と設計指定メッセージを返す: `pf-api/src/Controller/Admin/OtcBuyOrderIdentificationController.php:32-44`
  - pf-api のテストは存在しない証明書IDを HTTP 400 として固定している: `pf-api/src/Tests/Controller/Admin/OtcBuyOrderIdentificationControllerPutActionTest.php:99-108`

# 確認メモ
- 確認コマンド: `rg -n "本人確認更新|証明書ID|正しい証明書ID|HTTP 400|identification" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html`
- 確認コマンド: `rg -n "OtcBuyOrderIdentification|otcBuyOrder/\{id\}/identification|正しい証明書ID|Identification" ../pf-api/config ../pf-api/src`
- 確認コマンド: `rg -n "api_admin_otc_buy_order_update_identification|otcBuyOrder/\{id\}/identification|正しい証明書ID|MissingRequiredParameterException|NotFoundException|InvalidParameterException|mtbIdentificationRepository" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app/config`
- 確認コマンド: `rg -n "BaseApiException|getStatusCode|JsonResponse|HTTP_NOT_FOUND|HTTP_BAD_REQUEST" ../ec-cube-enterprise/src/Eccube/Exception/App ../ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php`
