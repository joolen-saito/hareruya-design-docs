/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：APIカード管理
機能：カード詳細IDからカード詳細情報を取得
課題カテゴリ：実装漏れ
課題：カード詳細ID指定でカード詳細情報を取得する GET /cardDetails/{id} が実装されていない
設計書：0514_基本設計仕様書(API_カード管理).xlsx

# 再現手順【必須】
1. GET http://localhost:8080/cardDetails/54321 を実行する
2. レスポンスのHTTPステータスとJSON本文を確認する
3. 近似APIとして管理画面AJAX /{admin_route}/product/detail/search/id?id=54321 や GET http://localhost:8080/api/v1/buying/54321.json が存在するか確認し、設計の /cardDetails/{id} と同一入口かを確認する

# 期待される挙動【必須】
- GET /cardDetails/{id} でパスパラメータ id を受け取り、該当するカード詳細マスタ情報をJSONで返す
- 該当するカード詳細が存在しない場合は HTTP 404 で code と message: Not Found を返す
- 管理画面AJAXやネット買取向け買取商品APIではなく、APIカード管理の公開入口として /cardDetails/{id} を提供する

# 現在の挙動【必須】
- ec-cube-enterprise では、設計が要求する `GET /cardDetails/{id}` の Route は定義されていない。近い実装として管理画面AJAX `/%eccube_admin_route%/product/detail/search/id` はあるが、XHR前提で `id` をリクエストパラメータから受け取り、カード詳細選択UI用の `name`・`productNameJp`・`detailId`・`images` だけを返す。ネット買取向けの `/%eccube_api_v1_route%/buying/{cardDetailId}.json` もカード詳細IDを使うが、買取用商品情報を返す別APIであり、A14-02 のカード詳細マスタ情報取得ではない。

ec-cube-enterprise 管理画面AJAXは /cardDetails/{id} ではなく、XHR前提の部分情報検索である: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:986-1034`
```php
    #[Route(path: '/%eccube_admin_route%/product/detail/search/id', name: 'admin_product_search_card_detail_by_id', methods: ['GET', 'POST'])]
    public function searchCardDetailById(Request $request)
    {
        $data = [];
        $cardDetailId = $request->get('id');

        if (!$request->isXmlHttpRequest() || !isset($cardDetailId)) {
            return $this->json($data);
        }

        $CardDetail = $this->cardDetailRepository->find($cardDetailId);
        if ($CardDetail === null) {
            return $this->json([], 404);
        }

        $Card = $CardDetail->getCard();
        if ($Card === null) {
            return $this->json([], 404);
        }

        $CardColors = $Card->getColors();
        if ($CardColors->isEmpty()) {
            return $this->json([], 404);
        }

        if ($CardDetail->getRarity() === null) {
            return $this->json([], 404);
        }

        $CardImages = $CardDetail->getCardImages();
        if ($CardImages->isEmpty()) {
            return $this->json([], 404);
        }

        $cardDetail = [
            'name' => $Card->getNameJp(),
            'nameEn' => $Card->getNameEn(),
            'productNameJp' => $CardDetail->buildProductNameJp(),
            'productNameEn' => $CardDetail->buildProductNameEn(),
            'cardLabelJp' => $CardDetail->buildCardLabelJp(),
            'detailId' => $cardDetailId,
            'images' => [],
        ];

        foreach ($CardImages as $CardImage) {
            $cardDetail['images'][] = $CardImage->getUrl();
        }

        return $this->json($cardDetail);
```

ec-cube-enterprise ネット買取APIは /api/v1/buying/{cardDetailId}.json で買取用商品情報を返す別機能である: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:43-61`
```php
    /**
     * カード詳細IDから買取用商品情報を取得
     */
    #[Route('/%eccube_api_v1_route%/buying/{cardDetailId}.json', name: 'api_buying', methods: ['GET'])]
    public function getByCardDetailId(int $cardDetailId): JsonResponse
    {
        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        [$storeId, $stockLocationId] = $this->resolveBuyingStockContext($Member);

        $cards = $this->mtbCardRepository->getBuyingCardsByCardDetailIds([$cardDetailId], $storeId, $stockLocationId);
        if (empty($cards)) {
            throw new NotFoundException('カードが見つかりません');
        }

        return new JsonResponse($this->buyingCardsFormatter->format($cards));
```
- ベース実装(pf-api)では、`config/routes.yaml` に `GET /cardDetails/{id}` が明示され、`CardController::getCardDetailAction($id)` が `MtbCardDetailRepository::findOneById($id)` でカード詳細を取得する。該当なしの場合は `{ code: 404, message: 'Not Found' }` を HTTP 404 で返すため、設計HTMLの入口・取得条件・404契約の根拠になっている。

ベース実装 pf-api は GET /cardDetails/{id} を CardController::getCardDetailAction に割り当てる: `pf-api/config/routes.yaml:171-174`
```yaml
get_card_detail:
    path: /cardDetails/{id}
    controller: App\Controller\CardController::getCardDetailAction
    methods: GET
```

ベース実装 pf-api はカード詳細IDで MtbCardDetail を取得し、該当なしは Not Found のHTTP 404を返す: `pf-api/src/Controller/CardController.php:44-59`
```php
    public function getCardDetailAction($id)
    {
        $cardDetail = $this->getDoctrine()
            ->getRepository(MtbCardDetail::class)
            ->findOneById($id);

        if (empty($cardDetail)) {
            $view = View::create([
                "code" => 404,
                "message" => 'Not Found'
            ], 404);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        return $cardDetail;
```

# 根拠
- 設計：
  - 設計HTMLは A14-02 のエンドポイントを /cardDetails/{id}、HTTPメソッドを GET とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:1275-1286`
  - 詳細設計は GET /cardDetails/{id} でカード詳細IDに対応するカード詳細情報を返し、該当なしは404とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:1493-1499`
  - 詳細設計はリクエスト id をパスの必須integerとし、失敗レスポンス本文を {code, message}("Not Found") とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:1504-1513`
- ec-cube-enterprise：
  - enterprise の管理画面AJAXは /cardDetails/{id} ではなく、UI用の部分情報のみを返す: `ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:986-1034`
  - enterprise のネット買取APIはカード詳細IDを使うが、買取用商品情報取得の別APIである: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:43-61`
- ベース実装：
  - pf-api は設計と同じ GET /cardDetails/{id} を定義している: `pf-api/config/routes.yaml:171-174`
  - pf-api はカード詳細IDで MtbCardDetail を検索し、該当なしはHTTP 404のNot Foundを返す: `pf-api/src/Controller/CardController.php:44-59`

# 確認メモ
- 確認コマンド: `rg -n "A14-02|/cardDetails/\\{id\\}|GET /cardDetails|カード詳細IDからカード" excel_to_html/output/0514_基本設計仕様書\(API_カード管理\).html design_impl_drift_report/findings/a14-02_0514_sheet-4_id.json`
- 確認コマンド: `rg -n "get_card_detail:|path: /cardDetails/\\{id\\}|getCardDetailAction|Not Found" ../pf-api/config/routes.yaml ../pf-api/src/Controller/CardController.php`
- 確認コマンド: `rg -n "Route.*cardDetails|/cardDetails|CardDetailAction|getCardDetailAction|admin_product_search_card_detail_by_id|api_buying" ../ec-cube-enterprise/src/Eccube/Controller ../ec-cube-enterprise/app/config`
- 確認コマンド: `rg -n "cardDetails/\\{id\\}|cardDetails|cardDetail|detail/search|buying/\\{cardDetailId\\}|api/buying" ../pf-api/config ../pf-api/src/Controller ../deck-api/config ../deck-api/src/Controller ../ec-cube-enterprise/src/Eccube/Controller ../ec-cube-enterprise/app/config`
- enterprise 側では管理画面AJAX `/%eccube_admin_route%/product/detail/search/id` とネット買取向け `/api/v1/buying/{cardDetailId}.json` は確認できるが、設計と同じ `/cardDetails/{id}` の Route 定義は確認できなかった。
- ベース実装は pf-api の `GET /cardDetails/{id}` と `CardController::getCardDetailAction($id)` を根拠とした。
- gpt-5.5 high reviewer Heisenberg verdict: VERIFIED. 管理画面AJAXはXHR前提・UI用部分情報のみ、`/api/v1/buying/{cardDetailId}.json` は認証必須のネット買取向け買取用商品情報APIであり、A14-02 のカード詳細マスタJSON取得とは同一扱いできない。
