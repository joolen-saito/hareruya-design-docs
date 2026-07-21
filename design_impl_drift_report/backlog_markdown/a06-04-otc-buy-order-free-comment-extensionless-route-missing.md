/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：店頭買取情報コメント更新
課題カテゴリ：実装漏れ
課題：店頭買取情報コメント更新の拡張子なしPUT /admin/otcBuyOrder/{id}/freeCommentが実装されていない
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/freeComment に free_comment をフォーム値で送信する
2. 同じ受注ID・同じリクエストで PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/freeComment.json は Controller に到達することを確認する
3. ec-cube-enterprise の route 定義と pf-api の routes.yaml を比較し、拡張子なし別名が enterprise 側に存在するか確認する

# 期待される挙動【必須】
- 店頭買取受注コメント更新は、PUT /admin/otcBuyOrder/{id}/freeComment と PUT /admin/otcBuyOrder/{id}/freeComment.json の両方を同一処理として提供する
- 拡張子なし別名でも、受注IDの店頭買取受注のフリーコメントと更新担当者を保存し、成功時は code: 200 のJSONを返す

# 現在の挙動【必須】
- ec-cube-enterprise では、店頭買取情報コメント更新APIの route が `/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json` のみとして定義されている。`%eccube_api_v1_route%` の既定値は `api/v1` のため実URLは `/api/v1/admin/otcBuyOrder/{id}/freeComment.json` になるが、同じ `updateFreeComment()` に到達する `/api/v1/admin/otcBuyOrder/{id}/freeComment` の属性 route や YAML route は確認できない。

ec-cube-enterprise は freeComment.json の属性Routeだけを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:153-184`
```php
    /**
     * フリーコメントの更新
     */
    #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', name: 'api_admin_otc_buy_order_update_free_comment', methods: ['PUT'])]
    public function updateFreeComment(int $id, Request $request): JsonResponse
    {
        $OtcBuyOrder = $this->dtbOtcBuyOrderRepository->find($id);
        if (!$OtcBuyOrder instanceof DtbOtcBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
        }

        $raw = $request->request->get('free_comment');
        if ($raw === null) {
            throw new MissingRequiredParameterException('コメントを入力してください');
        }

        $freeComment = (string) $raw;

        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        try {
            $this->updateFreeCommentAction->handle(new UpdateFreeCommentInput($OtcBuyOrder, $Member, $freeComment));

            // システムエラーの場合は隠蔽して500エラーを返す
        } catch (\Throwable $e) {
            throw new InternalException('システムエラーが発生しました', $e);
        }

        return new JsonResponse(['code' => Response::HTTP_OK], Response::HTTP_OK);
```

ec-cube-enterprise のAPI v1 prefix は api/v1: `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:1-6`
```yaml
parameters:
    # EC-CUBE default env parameters
    env(ECCUBE_ADMIN_ROUTE): 'admin'
    env(ECCUBE_MESSENGER_ROUTE): 'messenger'
    env(ECCUBE_USER_DATA_ROUTE): 'user_data'
    env(ECCUBE_API_V1_ROUTE): 'api/v1'
```

ec-cube-enterprise の更新処理本体は freeComment を保存するが route alias は持たない: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateFreeCommentAction.php:31-45`
```php
    public function handle(UpdateFreeCommentInput $input): void
    {
        $this->entityManager->beginTransaction();
        try {
            $input->OtcBuyOrder->setFreeComment($input->freeComment)
            ->setMember($input->Member)
            ->setUpdateDate(new \DateTime());

            $this->entityManager->flush();
            $this->entityManager->commit();
        } catch (\Exception $e) {
            $this->entityManager->rollback();
            $this->logger->error('Failed to update free comment', ['exception' => $e]);
            throw new InternalException('システムエラーが発生しました');
        }
```
- ベース実装(pf-api)では、`/admin/otcBuyOrder/{id}/freeComment.json` と `/admin/otcBuyOrder/{id}/freeComment` の2本をどちらも `OtcBuyOrderFreeCommentController::putAction` に向けている。`putAction()` は認証、受注取得、`free_comment` 必須チェック、フリーコメントと更新担当者の保存、code 200 応答を行うため、拡張子なし別名も `.json` 付きと同じ処理になる。

ベース実装 pf-api は .json と拡張子なしを同一controller/actionへ定義する: `pf-api/config/routes.yaml:41-48`
```yaml
put_otcbuy_free_comment_json:
    path: /admin/otcBuyOrder/{id}/freeComment.json
    controller: App\Controller\Admin\OtcBuyOrderFreeCommentController::putAction
    methods: PUT
put_otcbuy_free_comment:
    path: /admin/otcBuyOrder/{id}/freeComment
    controller: App\Controller\Admin\OtcBuyOrderFreeCommentController::putAction
    methods: PUT
```

ベース実装 pf-api の同一putActionはコメントと更新担当者を保存する: `pf-api/src/Controller/Admin/OtcBuyOrderFreeCommentController.php:19-51`
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

        if (is_null($request->get('free_comment'))) {
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => ['コメントを入力してください'],
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        $em = $this->getDoctrine()->getManager();
        $otcBuyOrder
            ->setFreeComment($request->get('free_comment'))
            ->setMember($this->member);
        $em->flush();
        $em->persist($otcBuyOrder);

        $view = View::create([
            "code" => Response::HTTP_OK,
        ], Response::HTTP_OK);

        return $this->get('fos_rest.view_handler')->handle($view);
```

# 根拠
- 設計：
  - 基本設計は店頭買取情報コメント更新APIのエンドポイントと現行踏襲を示す: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1587-1621`
  - 詳細設計は pf-api のルート定義を正とし、拡張子なしと .json を同一処理として明記する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1667-1699`
- ec-cube-enterprise：
  - enterprise は freeComment.json route のみを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:153-184`
  - API v1 prefix の既定値は api/v1: `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:1-6`
- ベース実装：
  - pf-api は .json と拡張子なしの両方を同じ putAction に向ける: `pf-api/config/routes.yaml:41-48`
  - 同一 putAction は free_comment を保存して code 200 を返す: `pf-api/src/Controller/Admin/OtcBuyOrderFreeCommentController.php:19-51`

# 確認メモ
- 確認コマンド: `rg -n "A06-04|freeComment|otcBuyOrder/.*/freeComment|店頭買取情報コメント更新|コメント更新|/admin/otcBuyOrder" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html ../pf-api ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app/config/eccube --glob '!vendor/**' --glob '!var/**'`
- 確認コマンド: `rg -n "otcBuyOrder/\{id\}/freeComment|freeComment\.json|api_admin_otc_buy_order_update_free_comment|freeComment" ../ec-cube-enterprise/src ../ec-cube-enterprise/app/config ../ec-cube-enterprise/tests --glob '!var/**'`
- 確認コマンド: `rg -n "put_otcbuy_free_comment|/admin/otcBuyOrder/\{id\}/freeComment|OtcBuyOrderFreeCommentController" ../pf-api/config/routes.yaml ../pf-api/src/Controller/Admin/OtcBuyOrderFreeCommentController.php`
- 確認コマンド: `rg -n "eccube_api_v1_route|ECCUBE_API_V1_ROUTE|api/v1" ../ec-cube-enterprise/app/config/eccube/packages/eccube.yaml ../ec-cube-enterprise/app/config/eccube/routes.yaml`
