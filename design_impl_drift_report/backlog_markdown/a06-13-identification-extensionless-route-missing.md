/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：本人確認更新
課題カテゴリ：実装漏れ
課題：本人確認更新APIの拡張子なしPUTルートが実装されていない
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、存在する店頭買取受注IDと本人確認証明書IDを用意する
2. PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/identification に identification=<本人確認証明書ID> を指定して実行する
3. 同じ入力で PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/identification.json を実行し、拡張子なしURLでも同一処理として成功するか確認する

# 期待される挙動【必須】
- PUT /admin/otcBuyOrder/{id}/identification と PUT /admin/otcBuyOrder/{id}/identification.json を同一処理として提供する
- 拡張子なしURLでも、受注IDの店頭買取受注に本人確認証明書を設定し、更新担当者・更新日時とともに保存する
- 成功時は code: 200 のJSONを返す

# 現在の挙動【必須】
- ec-cube-enterprise では、本人確認更新APIの Route 属性が `/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json` の1本だけで、拡張子なしの `/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification` は定義されていない。`app/config/eccube/routes.yaml` は App Controller 配下を attribute route として読み込むだけで、対象APIの拡張子なし alias を追加する定義もない。`rg` で `otcBuyOrder/{id}/identification`、`api_admin_otc_buy_order_update_identification`、`identification.json` を Controller/config/html 配下に検索しても、この `.json` ルート以外の対象PUTルートは見つからない。

ec-cube-enterprise Controller は .json 付きRouteのみを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:270-309`
```php
    /**
     * 身分証明書種別の更新
     */
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

        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        try {
            $this->updateIdentificationAction->handle(new UpdateIdentificationInput($OtcBuyOrder, $Member, $Identification));

            // カスタムエラーの場合はそのまま返す
        } catch (BaseApiException $e) {
            throw $e;
            // システムエラーの場合は隠蔽して500エラーを返す
        } catch (\Throwable $e) {
            throw new InternalException('システムエラーが発生しました', $e);
        }

        return new JsonResponse(['code' => Response::HTTP_OK], Response::HTTP_OK);
```

ec-cube-enterprise routes.yaml は App Controller の attribute route 読み込みのみで個別aliasを持たない: `ec-cube-enterprise/app/config/eccube/routes.yaml:1-7`
```yaml
admin_controllers:
    resource: '../../../src/Eccube/Controller/Admin'
    type: attribute

app_controllers:
    resource: '../../../src/Eccube/Controller/App'
    type: attribute
```

ec-cube-enterprise 更新Serviceは保存処理のみでRoute alias定義ではない: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateIdentificationAction.php:31-39`
```php
    public function handle(UpdateIdentificationInput $input): void
    {
        $this->entityManager->beginTransaction();
        try {
            $input->OtcBuyOrder->setIdentification($input->Identification)
            ->setMember($input->Member)
            ->setUpdateDate(new \DateTime());

            $this->entityManager->flush();
```
- ベース実装(pf-api)では、`/admin/otcBuyOrder/{id}/identification.json` と `/admin/otcBuyOrder/{id}/identification` の両方を `OtcBuyOrderIdentificationController::putAction` に向けており、同一メソッドで本人確認証明書・更新担当者・更新日時を保存して `code: 200` を返す。

ベース実装 pf-api は .json と拡張子なしの両ルートを同一Controllerへ定義する: `pf-api/config/routes.yaml:49-56`
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

ベース実装 pf-api の putAction は本人確認証明書・担当者・更新日時を保存して code 200 を返す: `pf-api/src/Controller/Admin/OtcBuyOrderIdentificationController.php:20-59`
```php
    public function putAction(Request $request, int $id) : Response
    {
        $this->authAdminToken($request);

        $otcBuyOrder = $this->getDoctrine()
            ->getRepository(DtbOtcBuyOrder::class)
            ->findOneBy(['otcBuyOrderId' => $id]);

        if (empty($otcBuyOrder)) {
            throw new NotFoundHttpException();
        }

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

        $em = $this->getDoctrine()->getManager();
        $otcBuyOrder
            ->setIdentification($putIdentification)
            ->setMember($this->member)
            ->setUpdateDate(new \DateTime());

        $em->persist($otcBuyOrder);
        $em->flush();

        $view = View::create([
            "code" => Response::HTTP_OK,
        ], Response::HTTP_OK);

        return $this->get('fos_rest.view_handler')->handle($view);
```

# 根拠
- 設計：
  - 利用者視点の入口で拡張子なしと .json 別名を同一処理として列挙している: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3420-3422`
  - 移行時扱いでは pf-api 側を拡張子あり別名ありとし、移行先はAPI版数プレフィックス付き .json として整理している: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3412-3415`
- ec-cube-enterprise：
  - enterprise は .json 付きRouteのみを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:270-309`
  - routes.yaml 側にも対象APIの拡張子なしaliasはない: `ec-cube-enterprise/app/config/eccube/routes.yaml:1-7`
- ベース実装：
  - pf-api は .json と拡張子なしを同じ putAction へ向ける: `pf-api/config/routes.yaml:49-56`
  - pf-api の putAction は設計どおり本人確認更新と code 200 応答を行う: `pf-api/src/Controller/Admin/OtcBuyOrderIdentificationController.php:20-59`

# 確認メモ
- 確認コマンド: `rg -n "PUT /admin/otcBuyOrder/\{id\}/identification|identification\.json|上と同一処理|応答形式はJSON" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html`
- 確認コマンド: `rg -n "put_otcbuy_identification|/admin/otcBuyOrder/\{id\}/identification|OtcBuyOrderIdentificationController::putAction" ../pf-api/config/routes.yaml ../pf-api/src/Controller/Admin/OtcBuyOrderIdentificationController.php`
- 確認コマンド: `rg -n "otcBuyOrder/\{id\}/identification|api_admin_otc_buy_order_update_identification|identification\.json|updateIdentification" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app/config ../ec-cube-enterprise/html --glob '!var/**'`
- 確認コマンド: `rg -n "path: /admin/otcBuyOrder/\{id\}/identification|Route\('.*otcBuyOrder/\{id\}/identification|otcBuyOrder/.*/identification" ../ec-cube-enterprise/app/config ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/html --glob '!var/**'`
