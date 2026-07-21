/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：APIネット買取管理
機能：ネット買取注文の査定終了処理
課題カテゴリ：実装違い
課題：存在しない買取ステータスID指定時のエラーメッセージが設計と異なる
設計書：0507_基本設計仕様書(API_ネット買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、存在するネット買取受注IDを指定して PUT http://localhost:8080/api/v1/admin/buyOrder/{id}.json を実行する
2. JSONボディに order_status: 999999 のような mtb_buy_order_status に存在しないIDと、1件以上の有効な order_details を指定する
3. レスポンスのHTTPステータスと errors の文言を確認する

# 期待される挙動【必須】
- 存在しない order_status は入力不正として HTTP 400 を返す
- errors には「MtbBuyOrderStatusに（指定値）が見つかりません。」形式の検証メッセージを返す
- 入力検証エラーが1件以上ある場合は更新を行わない

# 現在の挙動【必須】
- ec-cube-enterprise では、`BuyOrderController::updateBuyOrder` が `buyOrderStatusRepository->find($updateBuyOrderDto->orderStatusId)` でステータスマスタを検索し、見つからない場合は `InvalidParameterException('正しい買取ステータスIDを入力してください')` を投げる。`InvalidParameterException` は HTTP 400 の `BaseApiException` で、例外リスナーがその `errors` をそのまま返すため、HTTP 400 は一致するが、設計とベース実装が返す `MtbBuyOrderStatusに（値）が見つかりません。` 形式の文言にはならない。enterprise のテストも存在しない `order_status` に対してこの別文言を期待している。

ec-cube-enterprise Controller は存在しない orderStatusId で別文言の InvalidParameterException を投げる: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:170-186`
```php
    #[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}.json', name: 'api_admin_buy_order_update', methods: ['PUT'])]
    public function updateBuyOrder(int $id, #[MapRequestPayload] UpdateBuyOrderDto $updateBuyOrderDto): JsonResponse
    {
        $BuyOrder = $this->buyOrderRepository->find($id);
        if (!$BuyOrder instanceof DtbBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
        }

        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        $BuyOrderStatus = $this->buyOrderStatusRepository->find($updateBuyOrderDto->orderStatusId);
        if (!$BuyOrderStatus instanceof MtbBuyOrderStatus) {
            throw new InvalidParameterException('正しい買取ステータスIDを入力してください');
        }
```

ec-cube-enterprise InvalidParameterException は HTTP 400 の errors として文言を保持する: `ec-cube-enterprise/src/Eccube/Exception/App/InvalidParameterException.php:20-35`
```php
class InvalidParameterException extends BaseApiException
{
    /**
     * @param string $message エラーメッセージ
     * @param ?\Throwable $previous
     * @param string $logLevel ログレベル
     */
    public function __construct(string $message = 'パラメータが不正です', ?\Throwable $previous = null, string $logLevel = 'info')
    {
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_BAD_REQUEST,
            logLevel: $logLevel,
            previous: $previous
        );
    }
```

ec-cube-enterprise テストは存在しない order_status で別文言を期待する: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:650-683`
```php
     * order_statusがマスタに存在しないIDの場合は、400エラーを返すこと
     *
     * @group HARERUYA
     */
    public function testUpdateBuyOrderWhenStatusNotFound(): void
    {
        // Arrange
        $Customer = $this->createCustomer();
        $BuyOrderStatus = $this->entityManager->find(MtbBuyOrderStatus::class, MtbBuyOrderStatus::PRODUCT_ARRIVAL);
        $Pref = $this->entityManager->find(Pref::class, 13);
        $BuyOrder = $this->createBuyOrder($Customer, $BuyOrderStatus, $Pref, $this->Member);

        $updateBuyOrderRequest = [
            'order_status' => 999, // 存在しないステータスID
            'order_details' => [
                ['product_class_id' => 0, 'name' => 'test', 'quantity' => 1, 'price' => 100, 'language_id' => 1, 'condition_id' => 2, 'foil_flg' => 0, 'purchase_category' => 0],
            ],
        ];
        $token = $this->jwtTokenService->createToken($this->Member->getId());

        // Act
        $this->client->request(
            Request::METHOD_PUT,
            '/api/v1/admin/buyOrder/'.$BuyOrder->getId().'.json',
            [],
            [],
            ['HTTP_JWT_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'],
            json_encode($updateBuyOrderRequest)
        );

        // Assert
        $this->assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertContains('正しい買取ステータスIDを入力してください', $response['errors']);
```
- ベース実装(pf-api)では、`PUT /admin/buyOrder/{id}.json` が `BuyOrderController::putBuyOrderEndAction` に入り、リクエストの `order_status` を `BuyOrderEdit::$orderStatusId` に設定して Symfony Validator に渡す。`BuyOrderEdit::$orderStatusId` には `@MasterValue(table="MtbBuyOrderStatus")` が付いており、`MasterValue` の既定メッセージ `{{ table }}に{{ id }}が見つかりません。` にテーブル名と指定値を埋めて検証違反を作る。Controller は収集した検証メッセージ配列を HTTP 400 の `{code, errors}` で返す。

ベース実装 pf-api は buyOrder 更新ルートを putBuyOrderEndAction へ定義する: `pf-api/config/routes.yaml:25-28`
```yaml
put_buy_order_end:
    path: /admin/buyOrder/{id}.json
    controller: App\Controller\Admin\BuyOrderController::putBuyOrderEndAction
    methods: PUT
```

ベース実装 pf-api Controller は検証メッセージをHTTP 400で返す: `pf-api/src/Controller/Admin/BuyOrderController.php:69-99`
```php
        $buyOrderEditEntity = new BuyOrderEdit();
        $buyOrderEditEntity
            ->setOrderStatusId($request->get('order_status'))
            ->setOrderDetails($request->get('order_details'));

        $errorsArray = [];
        $errorsArray[] = $this->get('validator')->validate($buyOrderEditEntity);
        $requestDetails = $buyOrderEditEntity->getOrderDetails();
        if (is_array($requestDetails)) {
            foreach ($requestDetails as $orderDetail) {
                $orderDetailEntity = new BuyOrderDetail();
                $orderDetailEntity->setBuyOrderDetail($orderDetail);
                $errorsArray[] = $this->get('validator')->validate($orderDetailEntity);
            }
        }

        $messages = [];
        foreach ($errorsArray as $errors) {
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
        }

        if (count($messages) > 0) {
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => $messages,
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }
```

ベース実装 pf-api BuyOrderEdit は orderStatusId に MasterValue(MtbBuyOrderStatus) を付ける: `pf-api/src/Entity/Api/BuyOrderEdit.php:10-20`
```php
class BuyOrderEdit
{
    /**
     * @AppAssert\MasterValue(
     *     table = "MtbBuyOrderStatus"
     * )
     * @Assert\NotBlank(
     *     message = "ステータスを選択してください。"
     * )
     */
    private $orderStatusId;
```

ベース実装 pf-api MasterValue は MtbBuyOrderStatusに<値>が見つかりません。形式の文言を生成する: `pf-api/src/Validator/Constraints/MasterValue.php:11-26`
```php
class MasterValue extends Constraint
{
    public $message = "{{ table }}に{{ id }}が見つかりません。";

    protected $table;

    public function __construct(array $options)
    {
        parent::__construct($options);
        $this->table = $options['table'];
    }

    public function getTable()
    {
        return $this->table;
    }
```

ベース実装 pf-api MasterValueValidator は指定IDが見つからない場合に table/id を埋めて違反を追加する: `pf-api/src/Validator/Constraints/MasterValueValidator.php:19-37`
```php
    public function validate($value, Constraint $constraint)
    {
        if (empty($value)) {
            return;
        }
        $tableName =  '\\App\\Entity\\' . $constraint->getTable();
        $tableClass = new $tableName;
        $masterEntity = $this->entityManager
            ->getRepository(get_class($tableClass))
            ->findOneBy([
                'id' => $value,
            ]);

        if (is_null($masterEntity)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ table }}', $constraint->getTable())
                ->setParameter('{{ id }}', $value)
                ->addViolation();
        }
```

# 根拠
- 設計：
  - バリデーション定義は存在しない order_status のエラーメッセージを MtbBuyOrderStatusに（値）が見つかりません。とする: `hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1731-1733`
  - 失敗レスポンス定義は入力検証失敗時にHTTP 400で検証メッセージ配列を返す: `hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1711-1712`
- ec-cube-enterprise：
  - enterprise は存在しないステータスIDで設計と異なる文言を投げる: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:183-186`
  - enterprise テストも設計と異なる文言を期待している: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/BuyOrderControllerTest.php:650-683`
- ベース実装：
  - pf-api の Validator は設計と同じ MtbBuyOrderStatusに<値>が見つかりません。形式を生成する: `pf-api/src/Validator/Constraints/MasterValue.php:11-26`
  - pf-api は BuyOrderEdit の order_status に MtbBuyOrderStatus の MasterValue 検証を付ける: `pf-api/src/Entity/Api/BuyOrderEdit.php:10-20`
  - pf-api Controller は検証メッセージを HTTP 400 の errors に入れて返す: `pf-api/src/Controller/Admin/BuyOrderController.php:85-99`

# 確認メモ
- 確認コマンド: `rg -n "order_status|MtbBuyOrderStatusに|入力不正|検証メッセージ" excel_to_html/output/0507_基本設計仕様書\(API_ネット買取管理\).html`
- 確認コマンド: `rg -n "put_buy_order_end|putBuyOrderEndAction|BuyOrderEdit|MasterValue|MtbBuyOrderStatus|見つかりません|order_status" ../pf-api/config ../pf-api/src`
- 確認コマンド: `rg -n "正しい買取ステータスID|MtbBuyOrderStatusに|orderStatusId|UpdateBuyOrderDto|api_admin_buy_order_update" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/tests --glob '!var/**'`
- 確認コマンド: `rg -n "BaseApiException|getStatusCode|JsonResponse|HTTP_BAD_REQUEST|InvalidParameterException" ../ec-cube-enterprise/src/Eccube/Exception/App ../ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php`
