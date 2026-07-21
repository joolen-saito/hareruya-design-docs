/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：ネット買取商品詳細
課題カテゴリ：実装漏れ
課題：旧商品コードから買取商品詳細へ転送するルートが実装されていない
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. 旧商品コードを指定して http://localhost:8080/ja/purchase/forward/{oldCode} にGETアクセスする
2. 旧商品コードに対応する新商品コードがある場合、新しい買取商品詳細へ遷移するか確認する
3. 旧商品コードに対応がない場合、トップページへ遷移するか確認する

# 期待される挙動【必須】
- GET /{_locale}/purchase/forward/{oldCode} で旧商品コードから新商品コードへのマッピングを取得する
- マッピングが存在する場合、新商品コードの商品を取得し、買取商品詳細へリダイレクトする
- マッピングが存在しない場合、または商品取得不可の場合はトップページへリダイレクトする

# 現在の挙動【必須】
- ec-cube-enterpriseのPurchaseControllerには買取商品詳細とカート追加のルートはあるが、設計が要求する /purchase/forward/{oldCode} ルートおよび旧商品コードマッピングを使う転送処理が存在しない。

ec-cube-enterprise PurchaseControllerの既存ルート: `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:926-1044`
```php
    #[Route(path: '/purchase/detail/{id}', name: 'purchase_detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    #[Template(template: 'Purchase/detail.twig')]
    public function detail(Request $request, int $id): array
    {
        $product = $this->productRepository->getProductForPurchase($id);
        if ($product === null) {
            throw new NotFoundHttpException();
        }

        $productsByLanguage = $product->getProductsByLanguage();
        $initialLanguage = $request->get('lang');
        if ($initialLanguage === null || !array_key_exists($initialLanguage, $productsByLanguage)) {
            $initialLanguage = key($productsByLanguage);
        }

        $initialClass = $request->get('class');
        if ($initialClass !== null) {
            $initialClass = (int) $initialClass;
        }
        if ($initialLanguage === null) {
            $initialClass = null;
        } elseif ($initialClass === null || !array_key_exists($initialClass, $productsByLanguage[$initialLanguage])) {
            $initialClass = key($productsByLanguage[$initialLanguage]);
        }

        $languageForShare = $initialLanguage !== null && $initialLanguage !== ''
            ? (string) $initialLanguage
            : 'ja';
        $purchaseDetailParams = [
            'id' => $product->getId(),
            'lang' => $languageForShare,
        ];
        if ($initialClass !== null) {
            $purchaseDetailParams['class'] = $initialClass;
        }
        $purchaseDetailUrl = $this->generateUrl(
            'purchase_detail',
            $purchaseDetailParams,
            UrlGeneratorInterface::ABSOLUTE_URL
        );
        $shareText = $product->getSnsShareText($purchaseDetailUrl, $languageForShare);
        $shareUrlX = 'https://twitter.com/intent/tweet?'.http_build_query(['text' => $shareText], '', '&', PHP_QUERY_RFC3986);
        $shareUrlLine = 'https://line.me/R/msg/text/'.rawurlencode($shareText);

        // 買取詳細・同名一覧向けの UniSearch クエリを生成する。
        $useUnisearchSameName = false;
        /** @var array<string, string> $sameNameUnisearchRequests */
        $sameNameUnisearchRequests = [];

        $cardDetail = $product->getCardDetail();
        // Note：基本土地は移植元に合わせて同名一覧非表示にする
        if ($cardDetail !== null && !$cardDetail->isBasicLand()) {
            $card = $cardDetail->getCard();
            if ($card !== null) {
                $useUnisearchSameName = true;
                $sameNameUnisearchRequests = $this->buildPurchaseSameNameUnisearchRequests($card->getId());
            }
        }

        // カテゴリー一覧の生成
        $locale = $request->getLocale();
        $categoryGroups = $this->topCategoryListBuilder->build($locale, CategorySidebarLinkContext::forPurchase());
        $categoryFormatGroups = [
            ['type' => TopCategoryListBuilder::GROUP_STANDARD, 'items' => $categoryGroups[TopCategoryListBuilder::GROUP_STANDARD]['items']],
            ['type' => TopCategoryListBuilder::GROUP_PIONEER, 'items' => $categoryGroups[TopCategoryListBuilder::GROUP_PIONEER]['items']],
            ['type' => TopCategoryListBuilder::GROUP_MODERN, 'items' => $categoryGroups[TopCategoryListBuilder::GROUP_MODERN]['items']],
            ['type' => TopCategoryListBuilder::GROUP_LEGACY, 'items' => $categoryGroups[TopCategoryListBuilder::GROUP_LEGACY]['items']],
            ['type' => TopCategoryListBuilder::GROUP_COMMANDER, 'items' => $categoryGroups[TopCategoryListBuilder::GROUP_COMMANDER]['items']],
        ];

        return [
            'title' => $this->translator->trans('front.purchase.detail.page_title'),
            'subtitle' => $this->translator->trans('front.purchase.detail.document_title', ['%name%' => $product->getName()]),
            'Product' => $product,
            'initialLanguage' => $initialLanguage,
            'initialClass' => $initialClass,
            'minBuyPrice' => self::PURCHASE_MIN_PRICE,
            'maxSameNameProductShow' => self::MAX_SAME_NAME_PRODUCT_SHOW,
            'purchaseCartMaxQtyPerLine' => PurchaseCartService::MAX_QUANTITY_PER_LINE,
            'shareUrlX' => $shareUrlX,
            'shareUrlLine' => $shareUrlLine,
            'useUnisearchSameName' => $useUnisearchSameName,
            'sameNameUnisearchRequests' => $sameNameUnisearchRequests,
            'latestSetItems' => $categoryGroups[TopCategoryListBuilder::GROUP_LATEST_SET]['items'],
            'formatGroups' => $categoryFormatGroups,
            'othersItems' => $categoryGroups[TopCategoryListBuilder::GROUP_OTHERS]['items'],
        ];
    }

    /**
     * 買取詳細・同名一覧向け UniSearch クエリ文字列（ソート別）を生成する。
     *
     * @return array{buy_price_asc: string, buy_price_desc: string}
     */
    private function buildPurchaseSameNameUnisearchRequests(int $cardId): array
    {
        $baseQuery = [
            'cardId' => $cardId,
            'page' => UniSearchService::DEFAULT_PAGE,
            'pageSize' => self::PURCHASE_SAME_NAME_UNISEARCH_PAGE_SIZE,
        ];

        return [
            'buy_price_asc' => $this->uniSearchService->createUnisearchParameter(
                array_merge($baseQuery, ['sort' => 'buy_price', 'order' => 'ASC']),
                true
            ),
            'buy_price_desc' => $this->uniSearchService->createUnisearchParameter(
                array_merge($baseQuery, ['sort' => 'buy_price', 'order' => 'DESC']),
                true
            ),
        ];
    }

    /**
     * 買取カートへ追加
     */
    #[Route(path: '/purchase/add', name: 'purchase_add', methods: ['POST'])]
    public function add(Request $request): JsonResponse
```

ec-cube-enterprise 商品コード対応表Repository: `ec-cube-enterprise/src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30`
```php
class MtbProductCodeMappingRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MtbProductCodeMapping::class);
    }
```
- ベース実装(pf-eccube3)では、/purchase/forward/{oldCode} のルートが定義され、旧商品コードを findOneByOldProductCode($oldCode) で取得し、新商品詳細またはトップへリダイレクトしている。

ベース実装 pf-eccube3 旧コード転送ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/Front/PurchaseControllerProvider.php:44-48`
```php
        $c->match('/detail/{id}', '\Plugin\HareruyaEc\Controller\PurchaseController::detail')
            ->bind('purchase_detail')
            ->assert('id', '\d+');
        $c->match('/forward/{oldCode}', '\Plugin\HareruyaEc\Controller\PurchaseController::forward')
            ->bind('purchase_forward_old_to_new');
```

ベース実装 pf-eccube3 旧コード転送処理: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:626-646`
```php
    /**
     * 旧コードから新商品詳細へ転送
     *
     * @param Application $app
     * @param Request $request
     * @param string $oldCode 旧商品コード
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function forward(Application $app, Request $request, $oldCode)
    {
        $mapping = $app['hareruya_ec.repository.product_code_mapping']->findOneByOldProductCode($oldCode);
        if (empty($mapping)) {
            return $app->redirect($app->path('top'));
        }
        $product = $app['hareruya_ec.repository.product_sub_class']->findProductByCode($mapping->getProductCode());
        if (empty($product)) {
            return $app->redirect($app->path('top'));
        }

        return $app->redirect($app->path('purchase_detail',['id' => $product['id'], 'lang' => $product['lang']]));
    }
```

# 根拠
- 設計：
  - 旧商品コード転送の入口と期待挙動: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2423-2434`
  - 旧コードアクセス時の遷移先とエラー処理: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2475-2478`
- ec-cube-enterprise：
  - 買取商品詳細とカート追加のみでforwardルートがない: `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:926-1044`
  - 商品コード対応表Repositoryは存在するが転送用メソッドを持たない: `ec-cube-enterprise/src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30`
  - 商品コード対応表Entityにはproduct_code/old_product_codeがある: `ec-cube-enterprise/src/Eccube/Entity/Master/MtbProductCodeMapping.php:23-37`
- ベース実装：
  - 旧コード転送ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/Front/PurchaseControllerProvider.php:44-48`
  - 旧コード転送処理: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:626-646`

# 確認メモ
- 確認コマンド: `rg -n "purchase/forward|forward/\\{oldCode\\}|旧商品コード|旧コード|mtb_product_code_mapping|old_product_code|product_code_mapping" excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html`
- 確認コマンド: `rg -n "purchase/forward|forward|oldCode|old_code|MtbProductCodeMapping|ProductCodeMapping|old_product_code|product_code_mapping" ../ec-cube-enterprise/src/Eccube/Controller/Front/Purchase ../ec-cube-enterprise/src/Eccube/Repository ../ec-cube-enterprise/src/Eccube/Entity ../ec-cube-enterprise/src/Eccube/Service ../ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase`
- 確認コマンド: `rg -n "purchase_forward|PurchaseController.*forward|forward/\\{oldCode\\}|purchase/forward" ../pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider ../pf-eccube3/app/Plugin/HareruyaEc/ServiceProvider ../pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "class .*ProductCodeMapping|findOneByOldProductCode|oldProductCode|product_code_mapping" ../pf-eccube3/app/Plugin/HareruyaEc/Repository ../pf-eccube3/app/Plugin/HareruyaEc/Entity`
- ec-cube-enterpriseでは商品コード対応表Entity/Repositoryは存在するが、PurchaseControllerに /purchase/forward/{oldCode} のRouteがない。
- ec-cube-enterpriseの該当検索ではPaymentDispatcher等の一般的なforward語はヒットするが、買取旧コード転送の入口・処理ではない。
- pf-eccube3では /forward/{oldCode} ルートと PurchaseController::forward() が存在し、旧商品コード対応がない場合と商品取得不可の場合にトップへ戻す処理がある。
