/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：APIカード管理
機能：カードIDからカード情報を取得
課題カテゴリ：実装漏れ
課題：カードID指定でカード情報を取得する GET /cards/{id} が実装されていない
設計書：0514_基本設計仕様書(API_カード管理).xlsx

# 再現手順【必須】
1. GET http://localhost:8080/cards/300 を実行する
2. レスポンスのHTTPステータスとJSON本文を確認する
3. 近似APIとして GET http://localhost:8080/card?name={カード名}&lang=ja または GET http://localhost:8080/api/cards/300 が存在するか確認し、設計の /cards/{id} と同一入口かを確認する

# 期待される挙動【必須】
- GET /cards/{id} でパスパラメータ id を受け取り、該当するカードマスタ情報をJSONで返す
- 該当するカードが存在しない場合は HTTP 404 で code と message: Not Found を返す
- 検索クエリ用の /card や DeckBuilder 用の /api/cards/{id} ではなく、APIカード管理の公開入口として /cards/{id} を提供する

# 現在の挙動【必須】
- ec-cube-enterprise では、カード検索用の `GET /card`・`GET /card.json` と DeckBuilder 用の `GET /api/cards/{id}` は存在するが、設計が要求する `GET /cards/{id}` の Route は定義されていない。`App\CardController::getSingleCardByParams` は `name` と `lang` のクエリ検索であり、パスのカードIDを受け取らない。`App\DeckBuilder\CardController::getCard` は `/%eccube_api_v1_route%/` 配下の別APIであり、設計の公開入口 `/cards/{id}` とはURL契約が異なる。

ec-cube-enterprise App/CardController は /card と /card.json のクエリ検索のみを定義する: `ec-cube-enterprise/src/Eccube/Controller/App/CardController.php:41-58`
```php
    #[Route(path: '/card', name: 'card_by_params', methods: ['GET'])]
    #[Route(path: '/card.json', name: 'card_by_params_json', methods: ['GET'])]
    public function getSingleCardByParams(Request $request): JsonResponse
    {
        $name = (string) $request->query->get('name', '');
        $lang = (string) $request->query->get('lang', 'en');

        try {
            if ($name === '') {
                throw new NotFoundException('Not Found');
            }

            $card = $this->cardRepository->findOneByParams($name, $lang);
            if ($card === null) {
                throw new NotFoundException('Not Found');
            }

            return $this->json($card, Response::HTTP_OK);
```

ec-cube-enterprise DeckBuilder/CardController は別入口 /api/cards/{id} を定義する: `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:142-158`
```php
    #[Route('/api/cards/{id}', name: 'api_deck_builder_card', methods: ['GET', 'OPTIONS'], requirements: ['id' => '\d+'])]
    public function getCard(Request $request, int $id): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->createCorsResponse(new JsonResponse(null, Response::HTTP_NO_CONTENT));
        }

        $Card = $this->cardRepository->find($id);
        if ($Card === null) {
            return $this->createErrorResponse(
                Response::HTTP_NOT_FOUND,
                trans('api.deck_builder.common.not_found')
            );
        }

        return $this->createCorsResponse(new JsonResponse($Card->toNormalizedArray(), Response::HTTP_OK));
    }
```
- ベース実装(pf-api)では、`config/routes.yaml` に `GET /cards/{id}` が明示され、`CardController::getCardAction($id)` が `MtbCardRepository::find($id)` でカードを取得する。該当なしの場合は `{ code: 404, message: 'Not Found' }` を HTTP 404 で返すため、設計HTMLの入口・取得条件・404契約の根拠になっている。

ベース実装 pf-api は GET /cards/{id} を CardController::getCardAction に割り当てる: `pf-api/config/routes.yaml:167-170`
```yaml
get_card:
    path: /cards/{id}
    controller: App\Controller\CardController::getCardAction
    methods: GET
```

ベース実装 pf-api はカードIDで MtbCard を取得し、該当なしは Not Found のHTTP 404を返す: `pf-api/src/Controller/CardController.php:20-35`
```php
    public function getCardAction($id)
    {
        $card = $this->getDoctrine()
            ->getRepository(MtbCard::class)
            ->find($id);

        if (empty($card)) {
            $view = View::create([
                "code" => 404,
                "message" => 'Not Found'
            ], 404);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        return $card;
```

# 根拠
- 設計：
  - 設計HTMLは A14-01 のエンドポイントを /cards/{id}、HTTPメソッドを GET とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:845-856`
  - 詳細設計は GET /cards/{id} でカードIDに対応するカードマスタ情報を返し、該当なしは404とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:1192-1198`
  - 詳細設計は検索クエリによる取得を本書対象外とし、失敗レスポンス本文を {code, message}("Not Found") とする: `hareruya-design-docs/excel_to_html/output/0514_基本設計仕様書(API_カード管理).html:1184-1212`
- ec-cube-enterprise：
  - enterprise のカード検索Controllerは /card と /card.json のみで、パスID取得の /cards/{id} ではない: `ec-cube-enterprise/src/Eccube/Controller/App/CardController.php:41-58`
  - enterprise の近似ID取得APIは DeckBuilder 配下の /api/cards/{id} で、設計の /cards/{id} と別入口である: `ec-cube-enterprise/src/Eccube/Controller/App/DeckBuilder/CardController.php:142-158`
  - DeckBuilder の404文言は Not Found ではなくロケール定義の「見つかりません」を使う: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:6009-6013`
  - ポップアップ用の近似ルートは商品情報取得であり、カードマスタ情報APIではない: `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:257-266`
- ベース実装：
  - pf-api は設計と同じ GET /cards/{id} を定義している: `pf-api/config/routes.yaml:167-170`
  - pf-api はカードIDで MtbCard を検索し、該当なしはHTTP 404のNot Foundを返す: `pf-api/src/Controller/CardController.php:20-35`

# 確認メモ
- 確認コマンド: `rg -n "A14-01|/cards/\\{id\\}|GET /cards|カードIDからカード情報" excel_to_html/output/0514_基本設計仕様書\(API_カード管理\).html design_impl_drift_report/findings/a14-01_0514_sheet-3_id.json`
- 確認コマンド: `rg -n "get_card:|path: /cards/\\{id\\}|getCardAction|Not Found" ../pf-api/config/routes.yaml ../pf-api/src/Controller/CardController.php`
- 確認コマンド: `rg -n "path: '/cards|Route\\('/cards|cards/\\{id\\}|api_deck_builder_card|card_by_params" ../ec-cube-enterprise/src/Eccube/Controller ../ec-cube-enterprise/app/config`
- 確認コマンド: `rg -n "get_card:|path: /cards|CardController::getCardAction|getCardAction" ../pf-api ../deck-api ../ec-cube-enterprise/src/Eccube/Controller`
- enterprise 側では `/card`・`/card.json` と `/api/cards/{id}` は確認できるが、設計と同じ `/cards/{id}` の Route 定義は確認できなかった。
- ベース実装は pf-api の `GET /cards/{id}` と `CardController::getCardAction($id)` を根拠とした。
- gpt-5.5 high reviewer Popper verdict: VERIFIED. `/card`・`/card.json` は設計HTMLが本書対象外とする検索クエリ取得であり、`/api/cards/{id}` は DeckBuilder 配下の別URL契約かつ404文言も異なるため、A14-01 の代替とは扱えない。
