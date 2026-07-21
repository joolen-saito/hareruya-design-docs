/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントグローバルナビ
機能：支店スマホ版ナビゲーション
課題カテゴリ：実装漏れ
課題：店舗紹介ページの右カラムセクションナビが表示されない
設計書：0302_基本設計仕様書(フロント_グローバルナビ).xlsx

# 再現手順【必須】
1. スマホ幅またはタブレット幅で支店トップページ(例: http://localhost:8080/ja/tokyo/ )を表示する
2. 店舗紹介ページ内に、登録済みセクションへ移動する右カラムセクションナビが表示されるか確認する
3. 「初心者講習会」「取り扱い商品」などのナビ押下で同一ページ内アンカーへ移動するか確認する

# 期待される挙動【必須】
- dtb_shop_page_element の element/value を参照し、値のある右カラム項目だけをセクションナビに表示する
- 右カラムセクションナビは「店舗案内・初心者講習会・取り扱い商品・買取・スタッフ・その他・アクセス」の順で表示する
- 出力順の末尾要素へ末尾用クラスを付与し、各リンク押下で同一ページ内アンカーへ移動する

# 現在の挙動【必須】
- ec-cube-enterprise では DtbShopPageElement の Entity/Repository は存在するが、ShopTopController には DtbShopPageElementRepository の注入・取得処理がなく、テンプレートへ rightColumns や lastElement 相当を渡していない。

ec-cube-enterprise ShopTopController: `ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:43-121`
```php
    public function __construct(
        private readonly BaseInfoRepository $baseInfoRepository,
        private readonly ProductRepository $productRepository,
        private readonly DtbSalesQuantityRepository $dtbSalesQuantityRepository,
        private readonly FrontTopBlockProductViewService $frontTopBlockProductViewService,
        private readonly QrCodeService $qrCodeService,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
    }

    /**
     * @return array<string, mixed>|Response
     */
    #[Route(
        path: '/{_locale}{_shop}/',
        name: 'shop_top',
        requirements: ['_locale' => 'ja|en', '_shop' => '/[a-zA-Z0-9]+'],
        methods: ['GET'],
        priority: 100,
        condition: "service('shop_route_condition_service').isShopByPath(params['_shop'])",
    )]
    #[Template(template: 'shop_top.twig')]
    public function index(Request $request): array|Response
    {
        $shopSlug = ltrim((string) $request->attributes->get('_shop'), '/');
        $Shop = $this->baseInfoRepository->findOneBy(['html_class_name' => $shopSlug]);
        if (!$Shop instanceof BaseInfo || !$Shop->getIsOpenShop()) {
            throw $this->createNotFoundException();
        }

        $locale = $request->getLocale();

        $BestSellerProductClasses = $this->dtbSalesQuantityRepository->findTopSellingProductsByBaseInfo(
            $Shop->getId(),
            $locale,
            self::BEST_SELLER_LIMIT,
        );

        $SaleProductClasses = $this->productRepository->findTopSaleProductsByBaseInfo(
            $Shop->getId(),
            $locale,
            self::SALE_PRODUCT_LIMIT,
        );

        $TileBaseInfo = $Shop->getCommonSettingflg()
            ? $this->baseInfoRepository->getMallBaseInfo()
            : $Shop;
        $tiles = $this->buildTiles($TileBaseInfo, $Shop->getId(), $locale);
        $banner = $this->buildBanner($TileBaseInfo);

        $bestSellerForms = $this->frontTopBlockProductViewService->createAddCartForms($BestSellerProductClasses);
        $saleForms = $this->frontTopBlockProductViewService->createAddCartForms($SaleProductClasses);
        $favorites = $this->frontTopBlockProductViewService->getFavoriteProductIds();

        $shopTopUrl = $this->urlGenerator->generate(
            'shop_top',
            ['_locale' => $locale, '_shop' => '/'.$shopSlug],
            UrlGeneratorInterface::ABSOLUTE_URL,
        );
        $xAccountUrl = $Shop->getXAccountUrl();

        $projectDir = $this->getParameter('kernel.project_dir');
        $xQrLogoPath = $projectDir.'/'.self::X_QR_LOGO_RELATIVE;
        $keepQrLogoPath = $projectDir.'/'.self::KEEP_QR_LOGO_RELATIVE;

        return [
            'Shop' => $Shop,
            'isBranchShopFront' => $this->isBranchShopFrontCustomer(),
            'BestSellerProductClasses' => $BestSellerProductClasses,
            'SaleProductClasses' => $SaleProductClasses,
            'tiles' => $tiles,
            'banner' => $banner,
            'bestSellerForms' => $bestSellerForms,
            'saleForms' => $saleForms,
            'favorites' => $favorites,
            'shopTopUrl' => $shopTopUrl,
            'shopTopQrDataUri' => $this->qrCodeService->generateDataUri($shopTopUrl, $keepQrLogoPath),
            'xAccountQrDataUri' => $xAccountUrl !== null ? $this->qrCodeService->generateDataUri($xAccountUrl, $xQrLogoPath, true) : null,
        ];
```

ec-cube-enterprise DtbShopPageElementRepository: `ec-cube-enterprise/src/Eccube/Repository/DtbShopPageElementRepository.php:19-30`
```php
use Eccube\Entity\DtbShopPageElement;

/**
 * @extends AbstractRepository<DtbShopPageElement>
 */
class DtbShopPageElementRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DtbShopPageElement::class);
    }
}
```

ec-cube-enterprise shop_top.twig: `ec-cube-enterprise/src/Eccube/Resource/template/default/shop_top.twig:35-50`
```twig
    <div class="p-hareruya-branch-top">
        {% include 'Block/shop_order_method.twig' with { isBranchShopFront: isBranchShopFront, Shop: Shop } %}
        {% include 'Block/shop_best_sellers.twig' with { ProductClasses: BestSellerProductClasses, forms: bestSellerForms, favorites: favorites } %}
        {% include 'Block/shop_sale.twig' with { ProductClasses: SaleProductClasses, forms: saleForms, favorites: favorites } %}
        {% include 'Block/shop_item_list.twig' with {
            Shop: Shop,
            tiles: tiles,
            banner: banner,
            favorites: favorites,
        } %}
        {% include 'Block/search_items.twig' %}
        {% include 'Block/category_list.twig' %}
        {% include 'Block/shop_recommend.twig' %}
        {% include 'Block/shop_promo.twig' with { Shop: Shop, isBranchShopFront: isBranchShopFront, shopTopUrl: shopTopUrl, shopTopQrDataUri: shopTopQrDataUri, xAccountQrDataUri: xAccountQrDataUri } %}
        {% include 'Block/shop_recruit.twig' %}
    </div>
```
- ベース実装 pf-eccube3 では、ShopPageController が shop_page_element を取得して rightColumns/lastElement を作り、ShopPage/index.twig が rightColumns に応じて storeNav のページ内アンカーリンクと NavLast を描画している。

ベース実装 pf-eccube3 ShopPageController: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShopPageController.php:9-62`
```php
    // 右カラムの出力順
    const RightColumns = [
        1 => 'shop_guide',
        2 => 'handson_session',
        3 => 'selection',
        4 => 'buying',
        5 => 'staff',
        6 => 'other',
        7 => 'access',
    ];

    public function index(Application $app, $name)
    {
        $shop = $app['hareruya_ec.repository.shop']->findOneByHtmlClassName($name);
        if (!$shop) {
            return $app->abort(404);
        }
        $id = $shop->getId();
        $shopPageElements = $app['hareruya_ec.repository.shop_page_element']->findBy(['shopId' => $id, 'languageCode' => $app['locale'] === 'ja' ? 'jp' : 'en']);
        if (!$shopPageElements) {
            return $app->abort(404);
        }

        $values = [];
        $rightColumns = [];
        $lastElement = null;
        $shops = $app['hareruya_ec.repository.shop']->findBy([], ['rank' => 'ASC']);

        // elementをkeyとした連想配列
        foreach ($shopPageElements as $shopPageElement) {
            $e = $shopPageElement->getElement();
            $v = $shopPageElement->getValue();
            foreach (self::RightColumns as $ck => $cv) {
                if (strpos($e, $cv) !== false && !in_array($cv, $rightColumns) && $v){
                    $rightColumns[] = $cv;
                    if (empty($lastElement) || $lastElement < $ck) {
                        $lastElement = $ck;
                    }
                }
            }
            $values += [$e => $v];
        }
        // 最後の要素名
        if ($lastElement) {
            $lastElement = self::RightColumns[$lastElement];
        }

        return $app->render('ShopPage/index.twig', [
            'shopId' => $id,
            'values' => $values,
            'rightColumns' => $rightColumns,
            'lastElement' => $lastElement,
            'shops' => $shops,
        ]);
```

ベース実装 pf-eccube3 ShopPage/index.twig 右カラムナビ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig:90-106`
```twig
    <!--店舗右カラム-->
    <div class="storeRight">

        <!--ナビゲーション-->
        {% if rightColumns %}
        
            <nav class="storeNav">
                <ul class="storeNavList">
                    {% if 'shop_guide' in rightColumns %}<li {% if 'shop_guide' == lastElement %}class="NavLast"{% endif %}><a href="#storeGuide">店舗案内</a></li>{% endif %}
                    {% if 'handson_session' in rightColumns %}<li {% if 'handson_session' == lastElement %}class="NavLast"{% endif %}><a href="#storeAd">初心者講習会</a></li>{% endif %}
                    {% if 'selection' in rightColumns %}<li {% if 'selection' == lastElement %}class="NavLast"{% endif %}><a href="#storeItem">取り扱い商品</a></li>{% endif %}
                    {% if 'buying' in rightColumns %}<li {% if 'buying' == lastElement %}class="NavLast"{% endif %}><a href="#storePurchase">買取</a></li>{% endif %}
                    {% if 'staff' in rightColumns %}<li {% if 'staff' == lastElement %}class="NavLast"{% endif %}><a href="#storeStaff">スタッフ</a></li>{% endif %}
                    {% if 'other' in rightColumns %}<li {% if 'other' == lastElement %}class="NavLast"{% endif %}><a href="#storeOther">その他</a></li>{% endif %}
                    {% if 'access' in rightColumns %}<li {% if 'access' == lastElement %}class="NavLast"{% endif %}><a href="#storeAccess">アクセス</a></li>{% endif %}
                </ul>
            </nav>
```

# 根拠
- 設計：
  - 右カラムセクションナビの表示・順序・末尾クラス要件: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3352-3359`
  - dtb_shop_page_element の element/value を表示有無判定に用いる要件: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3374-3379`
- ec-cube-enterprise：
  - 支店トップの返却変数に rightColumns/lastElement 相当がない: `ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:108-121`
  - DtbShopPageElementRepository は存在するが基本リポジトリ定義のみ: `ec-cube-enterprise/src/Eccube/Repository/DtbShopPageElementRepository.php:19-30`
- ベース実装：
  - shop_page_element から rightColumns/lastElement を構成する処理: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShopPageController.php:27-62`
  - rightColumns に応じたページ内アンカーの描画: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig:93-106`

# 確認メモ
- 確認コマンド: `rg -n "右カラムセクションナビ|dtb_shop_page_element|末尾用クラス|登録済みの右カラム" hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書\(フロント_グローバルナビ\).html`
- 確認コマンド: `rg -n "DtbShopPageElement|ShopPageElement|shop_page_element|rightColumns|NavLast|storeNav|handson_session|selection|storeAd|storeItem" ec-cube-enterprise/src ec-cube-enterprise/app --glob '!var/cache/**'`
- 確認コマンド: `rg -n "shop_page_element|rightColumns|NavLast|storeNav|handson_session|selection|storeAd|storeItem" pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php | sed -n '43,121p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig | sed -n '90,106p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。
- ec-cube-enterprise の rg 結果では DtbShopPageElement 参照は Entity/Repository 定義に限られ、ShopTopController/shop_top.twig の描画経路では rightColumns/lastElement/storeNav/NavLast が確認できなかった。
