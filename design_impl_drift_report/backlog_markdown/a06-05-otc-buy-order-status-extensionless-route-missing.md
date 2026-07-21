/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：店頭買取情報ステータス更新
課題カテゴリ：実装漏れ
課題：店頭買取情報ステータス更新の拡張子なしPUT /admin/otcBuyOrder/{id}/statusが実装されていない
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/status に status をフォーム値で送信する
2. 同じ受注ID・同じリクエストで PUT http://localhost:8080/api/v1/admin/otcBuyOrder/{id}/status.json は Controller に到達することを確認する
3. ec-cube-enterprise の route 定義と pf-api の routes.yaml を比較し、拡張子なし別名が enterprise 側に存在するか確認する

# 期待される挙動【必須】
- 店頭買取受注ステータス更新は、PUT /admin/otcBuyOrder/{id}/status.json と PUT /admin/otcBuyOrder/{id}/status の両方を同一処理として提供する
- 拡張子なし別名でも、受注IDの店頭買取受注のステータスと査定担当者・更新日時を保存し、変更履歴を登録して、成功時は code: 200 のJSONを返す

# 現在の挙動【必須】
- ec-cube-enterprise では、店頭買取情報ステータス更新APIの route が `/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json` のみとして定義されている。`%eccube_api_v1_route%` の既定値は `api/v1` のため実URLは `/api/v1/admin/otcBuyOrder/{id}/status.json` になるが、同じ `updateStatus()` に到達する `/api/v1/admin/otcBuyOrder/{id}/status` の属性 route や YAML route は確認できない。

ec-cube-enterprise は status.json の属性Routeだけを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:187-225`
```php
    /**
     * ステータスの更新
     */
    #[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json', name: 'api_admin_otc_buy_order_update_status', methods: ['PUT'])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $OtcBuyOrder = $this->dtbOtcBuyOrderRepository->find($id);
        if (!$OtcBuyOrder instanceof DtbOtcBuyOrder) {
            throw new NotFoundException('買取情報が見つかりません');
        }

        $raw = $request->request->get('status');
        if ($raw === null || $raw === '' || !ctype_digit((string) $raw)) {
            throw new MissingRequiredParameterException('ステータスが不正です');
        }
        $statusId = (int) $raw;

        $Status = $this->entityManager->find(MtbOtcBuyOrderStatus::class, $statusId);
        if (!$Status instanceof MtbOtcBuyOrderStatus) {
            throw new InvalidParameterException('ステータスが見つかりません');
        }

        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        try {
            $this->updateStatusAction->handle(new UpdateStatusInput($OtcBuyOrder, $Member, $Status));

            // カスタムエラーの場合はそのまま返す
        } catch (BaseApiException $e) {
            throw $e;
            // システムエラーの場合は隠蔽して500エラーを返す
        } catch (\Throwable $e) {
            throw new InternalException('システムエラーが発生しました', $e);
        }

        return new JsonResponse(['code' => Response::HTTP_OK], Response::HTTP_OK);
```

ec-cube-enterprise は App controller の属性Routeを読み込むだけで個別aliasを追加していない: `ec-cube-enterprise/app/config/eccube/routes.yaml:1-7`
```yaml
admin_controllers:
    resource: '../../../src/Eccube/Controller/Admin'
    type: attribute

app_controllers:
    resource: '../../../src/Eccube/Controller/App'
    type: attribute
```

ec-cube-enterprise のステータス更新処理本体は履歴付き更新を行うが route alias は持たない: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:104-118`
```php
        $currentTime = new \DateTime();

        $this->entityManager->beginTransaction();
        try {
            $input->OtcBuyOrder
                ->setMember($input->Member)
                ->setUpdateDate($currentTime);

            $this->otcBuyOrderEntityManager->updateStatusWithHistory($input->OtcBuyOrder, $input->NextStatus, $input->Member, $currentTime);
            $this->entityManager->flush();
            $this->entityManager->commit();
        } catch (\Throwable $e) {
            $this->entityManager->rollback();
            $this->logger->error('Failed to update status', ['exception' => $e, 'otcBuyOrderId' => $input->OtcBuyOrder->getId(), 'currentStatusId' => $currentStatusId, 'nextStatusId' => $nextStatusId, 'memberId' => $input->Member->getId()]);
            throw new InternalException('システムエラーが発生しました', $e);
```
- ベース実装(pf-api)では、`/admin/otcBuyOrder/{id}/status.json` と `/admin/otcBuyOrder/{id}/status` の2本をどちらも `OtcBuyOrderStatusController::putAction` に向けている。`putAction()` は認証、受注取得、ステータスマスタ確認、遷移制御、ステータス・担当者・更新日時の保存、ステータス変更履歴登録、code 200 応答を行うため、拡張子なし別名も `.json` 付きと同じ処理になる。

ベース実装 pf-api は .json と拡張子なしを同一controller/actionへ定義する: `pf-api/config/routes.yaml:57-64`
```yaml
put_otcbuy_status_json:
    path: /admin/otcBuyOrder/{id}/status.json
    controller: App\Controller\Admin\OtcBuyOrderStatusController::putAction
    methods: PUT
put_otcbuy_status:
    path: /admin/otcBuyOrder/{id}/status
    controller: App\Controller\Admin\OtcBuyOrderStatusController::putAction
    methods: PUT
```

ベース実装 pf-api の同一putActionはステータス更新と履歴登録を行う: `pf-api/src/Controller/Admin/OtcBuyOrderStatusController.php:21-97`
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

        $oldStatus = $otcBuyOrder->getOtcBuyOrderStatus();

        $putStatus = $this->getDoctrine()
              ->getRepository(MtbOtcBuyOrderStatus::class)
              ->findOneBy(['id' => $request->get('status')]);

        if (empty($putStatus)) {
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => ['正しい店頭買取ステータスIDを入力してください'],
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        // 査定終了後のステータスは変更不可。
        if (in_array($oldStatus->getId(), MtbOtcBuyOrderStatus::ASSESSMENT_COMPLETED_STATUS, true)) {
            $message = in_array($putStatus->getId(), MtbOtcBuyOrderStatus::ASSESSMENT_ACTIVE_STATUS, true)
                ? 'この査定はすでに終了しているため開くことができません。'
                : 'この査定はすでに終了しているためステータスの更新に失敗しました。';
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => [$message],
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        // 査定者本人を除き、査定中または査定再開のものは査定開始できない。
        if (in_array($oldStatus->getId(), MtbOtcBuyOrderStatus::ASSESSMENT_ACTIVE_STATUS, true)
            && in_array($putStatus->getId(), MtbOtcBuyOrderStatus::ASSESSMENT_ACTIVE_STATUS, true)
            && (!is_null($otcBuyOrder->getMember()) && $otcBuyOrder->getMember()->getMemberId() !== $this->member->getMemberId()))
        {
            $view = View::create([
                'code' => Response::HTTP_BAD_REQUEST,
                'errors' => ["この受注は「{$otcBuyOrder->getMember()->getName()}」が査定中です。"],
            ], Response::HTTP_BAD_REQUEST);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        if ($oldStatus !== $putStatus) {
            $em = $this->getDoctrine()->getManager();
            $otcBuyOrder
                ->setOtcBuyOrderStatus($putStatus)
                ->setMember($this->member)
                ->setUpdateDate(new \DateTime());
            $em->persist($otcBuyOrder);

            $otcBuyOrderStatusHistory = new DtbOtcBuyOrderStatusHistory();
            $otcBuyOrderStatusHistory
                ->setOtcBuyOrderId($id)
                ->setOtcBuyOrderStatusId($putStatus->getId())
                ->setMemberId($this->memberId)
                ->setCreateDate(new \DateTime());
            $em->persist($otcBuyOrderStatusHistory);
            $em->flush();
        }

        $view = View::create([
            "code" => Response::HTTP_OK,
        ], Response::HTTP_OK);

        return $this->get('fos_rest.view_handler')->handle($view);
    }
```

# 根拠
- 設計：
  - 基本設計は店頭買取情報ステータス更新APIのエンドポイントとステータス更新・履歴登録を示す: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1768-1798`
  - 詳細設計は pf-api のルート定義を正とし、.json と拡張子なしを同一処理として明記する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1843-1874`
- ec-cube-enterprise：
  - enterprise は status.json route のみを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:187-225`
  - App controller は attribute import のみで、個別 YAML alias はない: `ec-cube-enterprise/app/config/eccube/routes.yaml:1-7`
- ベース実装：
  - pf-api は .json と拡張子なしの両方を同じ putAction に向ける: `pf-api/config/routes.yaml:57-64`
  - 同一 putAction はステータスを保存し、履歴を登録して code 200 を返す: `pf-api/src/Controller/Admin/OtcBuyOrderStatusController.php:21-97`

# 確認メモ
- 確認コマンド: `rg -n "A06-05|status|otcBuyOrder/.*/status|店頭買取情報ステータス更新|ステータス更新|/admin/otcBuyOrder" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html ../pf-api ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app/config/eccube --glob '!vendor/**' --glob '!var/**'`
- 確認コマンド: `rg -n "otcBuyOrder/\{id\}/status|/status\.json|api_admin_otc_buy_order_update_status|updateStatus" ../ec-cube-enterprise/src ../ec-cube-enterprise/app/config/eccube ../ec-cube-enterprise/tests --glob '!var/**'`
- 確認コマンド: `rg -n "put_otcbuy_status|/admin/otcBuyOrder/\{id\}/status|OtcBuyOrderStatusController" ../pf-api/config/routes.yaml ../pf-api/src/Controller/Admin/OtcBuyOrderStatusController.php`
- 確認コマンド: `rg -n "app_controllers|src/Eccube/Controller/App|type: attribute|api/v1" ../ec-cube-enterprise/app/config/eccube/routes.yaml ../ec-cube-enterprise/app/config/eccube/packages/eccube.yaml`
