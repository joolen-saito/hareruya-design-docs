/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントグローバルナビ
機能：支店スマホ版ナビゲーション
課題カテゴリ：実装漏れ
課題：店舗紹介ページのスマホ・タブレット表示に「閲覧店舗を選択」の店舗一覧が表示されない
設計書：0302_基本設計仕様書(フロント_グローバルナビ).xlsx

# 再現手順【必須】
1. スマホ幅またはタブレット幅で支店トップページ(例: http://localhost:8080/ja/tokyo/ )を表示する
2. ページ上部または店舗紹介ページ内に「閲覧店舗を選択」と店舗一覧が表示されるか確認する
3. 店舗一覧の店舗リンク押下で、選択した店舗の店舗紹介ページへ遷移するか確認する

# 期待される挙動【必須】
- 店舗紹介ページのスマホ・タブレット表示では「閲覧店舗を選択」とともに並び順付きの全店舗一覧を表示する
- 表示中の店舗を選択状態にする
- 店舗リンク押下で選択した店舗の店舗紹介ページへ遷移する

# 現在の挙動【必須】
- ec-cube-enterprise の支店トップは ShopTopController が現在店舗の Shop、商品ブロック用の tiles/banner 等を返し、shop_top.twig は商品・検索・カテゴリ・おすすめ等のブロックを include する構成で、「閲覧店舗を選択」付きの店舗一覧を描画していない。

ec-cube-enterprise ShopTopController 返却変数: `ec-cube-enterprise/src/Eccube/Controller/Shop/ShopTopController.php:67-121`
```php
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

ec-cube-enterprise shop_top.twig 支店トップ構成: `ec-cube-enterprise/src/Eccube/Resource/template/default/shop_top.twig:35-50`
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
- ベース実装 pf-eccube3 では、ShopPageController が rank 昇順の全店舗一覧を shops として渡し、ShopPage/index.twig が tablet 用 storeList に「閲覧店舗を選択」と店舗リンク、表示中店舗の selected クラスを描画している。

ベース実装 pf-eccube3 全店舗一覧取得: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShopPageController.php:32-62`
```php
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

ベース実装 pf-eccube3 tablet 店舗一覧: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig:33-50`
```twig
    <!--SMP店舗カラム-->
    <section class="storeList tablet">

        <!--店舗一覧(SMP)-->
        {% if shops %}
        <ul class="storeList-listOuter">
            <p>
                閲覧店舗を選択
            </p>
            {% for shop in shops %}
            <li class="storeList-listInner {% if shop.id == shopId %}selected{% endif %}">
                <a href="{{ url('shop_page', { name: shop.htmlClassName}) }}">{{ shop.nameJp }}</a>
            </li>
            {% endfor %}
        </ul>
        {% endif %}

    </section>
```

# 根拠
- 設計：
  - タブレット用店舗一覧の概要・入口: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3323-3326`
  - 店舗一覧取得・表示中店舗の選択状態要件: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3352-3356`
  - 店舗一覧の表示名・選択状態のデータ要件: `hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書(フロント_グローバルナビ).html:3358-3366`
- ec-cube-enterprise：
  - 支店トップテンプレートに店舗一覧ブロックがない: `ec-cube-enterprise/src/Eccube/Resource/template/default/shop_top.twig:35-50`
- ベース実装：
  - rank 昇順の全店舗一覧を shops として渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShopPageController.php:35-62`
  - tablet 用の「閲覧店舗を選択」付き店舗一覧: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig:33-50`

# 確認メモ
- 確認コマンド: `rg -n "閲覧店舗を選択|タブレット用店舗一覧|並び順付きの全店舗一覧|表示中の店舗を選択状態" hareruya-design-docs/excel_to_html/output/0302_基本設計仕様書\(フロント_グローバルナビ\).html`
- 確認コマンド: `rg -n "閲覧店舗を選択|storeList tablet|storeList-listOuter|shop_page|shops|htmlClassName" ec-cube-enterprise/src/Eccube/Resource/template/default ec-cube-enterprise/app/template ec-cube-enterprise/src/Eccube/Controller --glob '!var/cache/**'`
- 確認コマンド: `rg -n "閲覧店舗を選択|storeList tablet|storeList-listOuter|shop_page|shops|htmlClassName" pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/shop_top.twig | sed -n '35,50p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/ShopPage/index.twig | sed -n '33,50p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。
- ec-cube-enterprise の front template 検索では「閲覧店舗を選択」は支店トップ描画経路に存在せず、admin/mall/tenant 等の別文脈のみが近傍ヒットだった。
