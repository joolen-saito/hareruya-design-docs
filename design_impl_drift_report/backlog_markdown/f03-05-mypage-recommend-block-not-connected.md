/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：商品リコメンド
課題カテゴリ：実装漏れ
課題：マイページで種別mypageの商品リコメンドを非同期取得して表示しない
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. ログイン会員で http://localhost:8080/ja/mypage/ を開く
2. マイページのおすすめ商品ブロックを確認する
3. ページ種別 mypage として最新注文商品を基準にしたおすすめ取得が行われるか確認する

# 期待される挙動【必須】
- マイページ・購入完了・商品詳細・買い物かごの各ページに、おすすめ商品をスライダー表示する
- ブロックはページ表示後に非同期でおすすめ内容を取得して描画する
- ページ種別が mypage の場合、ログイン会員の最新注文の商品を基準商品とする
- 基準商品がある場合は注文実績からおすすめ商品を抽出し、0件の場合のみおすすめなしメッセージを表示する

# 現在の挙動【必須】
- ec-cube-enterprise の MypageController::index は Customer と nextDeadlinePointHistory だけを返しており、recommendProducts も block_product_recommend 呼び出し用の値もセットしていない。Mypage/index.twig には『商品リコメンド実装時に追加する』というTODOが残り、recommend_type: mypage の recommend_js include はコメントアウトされているため、マイページから非同期おすすめ取得が起動しない。

ec-cube-enterprise MypageController index戻り値: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:126-137`
```php
    #[Template(template: 'Mypage/index.twig')]
    public function index(Request $request, PaginatorInterface $paginator): array
    {
        /** @var Customer $Customer */
        $Customer = $this->getUser();

        $NextDeadlinePointHistory = $this->pointHistoryRepository->getNextDeadlinePointHistory($Customer->getPlayer());

        return [
            'Customer' => $Customer,
            'nextDeadlinePointHistory' => $NextDeadlinePointHistory,
        ];
```

ec-cube-enterprise マイページのrecommend_js未接続TODO: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:17-24`
```twig
{% block javascript %}
<script src="{{ asset('assets/js/vendor/jquery.simple.timer.js') }}"></script>
<script src="{{ asset('assets/js/vendor/jquery-barcode.min.js') }}"></script>
{# TODO: ECCUBE_HARERUYA-164 マイページ 別紙「0303_基本設計仕様書(フロント_商品)」のシート「商品リコメンド」実装時に追加する #}
{#{% include 'Block/js/recommend_js.twig' with {'recommend_type': 'mypage'} %}#}
{% include 'Block/js/point_barcode_js.twig' %}
{% include 'Block/_top_page_scripts.twig' %}
{% if recommendProducts is defined and recommendProducts is not empty %}
```

ec-cube-enterprise マイページのrecommendProducts参照: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:242-267`
```twig
    <div class="p-hareruya-mypage__recommend" id="recommendMain">
        <div class="p-hareruya-section__heading">
            <h2 class="c-hareruya-heading--lev2">{{ 'front.mypage.title.recommend'|trans }}</h2>
        </div>
        {% if recommendProducts is defined and recommendProducts is not empty %}
        <div class="p-hareruya-mypage__recommend-carousel p-hareruya-product-carousel p-hareruya-product-carousel--simple">
            <div class="p-hareruya-product-carousel__wrapper">
                <div class="p-hareruya-product-carousel__slider" data-js-target="mypage-recommend-carousel">
                    {% for Product in recommendProducts %}
                    {% set ProductClass = Product.ProductClasses|filter(pc => pc.visible)|first %}
                    {% if ProductClass %}
                    <div class="p-hareruya-product-carousel__item">
                        {% include 'Block/_product_card.twig' with { Product: Product, ProductClass: ProductClass, showFavoriteButton: false, cardModifier: 'p-hareruya-product-card--simple' } %}
                    </div>
                    {% endif %}
                    {% endfor %}
                </div>
            </div>
            <div class="p-hareruya-product-carousel__nav">
                <button class="p-hareruya-product-carousel__nav-prev" type="button" aria-label="{{ 'front.mypage.recommend.prev'|trans }}"><i class="icon-hareruya-slide-arrow-left c-hareruya-icon--28" aria-hidden="true"></i></button>
                <button class="p-hareruya-product-carousel__nav-next" type="button" aria-label="{{ 'front.mypage.recommend.next'|trans }}"><i class="icon-hareruya-slide-arrow-right c-hareruya-icon--28" aria-hidden="true"></i></button>
            </div>
        </div>
        {% else %}
        <p class="p-hareruya-mypage__recommend-empty">{{ 'front.product.recommend_no_items'|trans }}</p>
        {% endif %}
```

ec-cube-enterprise 共通リコメンドブロックController: `ec-cube-enterprise/src/Eccube/Controller/Block/ProductRecommendController.php:42-75`
```php
    #[Route(path: '/block/product_recommend', name: 'block_product_recommend', methods: ['GET'])]
    #[Template(template: 'Block/user_recommend_product.twig')]
    public function index(Request $request): array|Response
    {
        if (!$this->blockTemplateExistCheckService->checkFileExist($request)) {
            return $this->render('Block/null.twig');
        }

        $productId = $request->query->getInt('product_id', 0);

        /** @var Customer|null $Customer */
        $Customer = $this->getUser() instanceof Customer ? $this->getUser() : null;

        if ($productId === 0 && $Customer !== null) {
            $LatestItem = $this->orderItemRepository->findLatestExpensiveItem($Customer);
            if ($LatestItem !== null && $LatestItem->getProduct() !== null) {
                $productId = (int) $LatestItem->getProduct()->getId();
            }
        }

        if ($productId === 0) {
            return ['Products' => [], 'forms' => [], 'favorites' => []];
        }

        $locale = $request->getLocale();
        $shopId = $this->getShop()->getId();

        $ProductClasses = $this->recommendService->getRecommendProductClasses($productId, $locale, $shopId, $Customer);
        $Products = array_map(static fn ($ProductClass) => $ProductClass->getProduct(), $ProductClasses);

        return [
            'Products' => $Products,
            'forms' => $this->frontTopBlockProductViewService->createAddCartForms($ProductClasses),
            'favorites' => $this->frontTopBlockProductViewService->getFavoriteProductIds(),
```
- ベース実装 pf-eccube3 では、Mypage/index.twig が recommend_type: mypage の recommend_js を読み込み、JSが user_recommend_get に非同期POSTする。Block RecommendController は recommend_type が mypage または complete の場合に findLatestOrder() でログイン会員の最新注文の最高額明細を基準商品にし、OrderDetailRepository::getRecommendItems() でおすすめを抽出して recommend_detail.twig に描画している。

ベース実装 pf-eccube3 マイページrecommend_js接続: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:12-17`
```twig
{% block javascript %}
<script src="{{ url('assets', {path: 'js/vendor/jquery.simple.timer.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/vendor/jquery-barcode.min.js'}) }}" defer></script>
{% include 'Block/js/recommend_js.twig' with {'recommend_type': 'mypage'} %}
{% include 'Block/js/point_barcode_js.twig' %}
{% endblock %}
```

ベース実装 pf-eccube3 recommend_js非同期取得: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/recommend_js.twig:1-40`
```twig
{% set product_id = product_id|default('') %}
<script>
window.addEventListener('load', function() {
    $(function($) {
        $('#recommendMain').on('inview', function() {
            $.ajax({
                url:  "{{ path('user_recommend_get') }}",
                type: 'POST',
                data: {'recommend_type' : '{{ recommend_type }}', 'product_id': '{{ product_id }}'},
            }).done(function(data) {
                $('.StyleR_Line_').html(data);
                $('img.lazy').lazyload();
                $('#recommendMain .swiper-slide img.lazy').lazyload({
                    event: 'sporty'
                });
                $('#recommendMain').find('.swiper-container').each(function(){
                    var recommendSliderContainer = $(this);
                    var mySwiper = recommendSliderContainer.swiper({
                        effect: "slide",
                        loop: false,
                        width: 120,
                        spaceBetween: 15,
                        grabCursor: true,
                        nextButton: '.swiper-button-next',
                        prevButton: '.swiper-button-prev',
                        breakpoints: {
                        767: {
                            width: 90,
                            freeMode: true
                        }
                    }});
                    mySwiper.once('onSlideChangeStart', function(){
                        recommendSliderContainer.find('.lazy').trigger('sporty');
                    });
                });
                $('#recommendMain').off('inview');
            });
        });
    });
}, false);
```

ベース実装 pf-eccube3 recommend_type=mypageの基準商品決定: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/RecommendController.php:24-55`
```php
    public function getUserRecommendProduct(Application $app, Request $request)
    {
        session_write_close();

        $productId = $this->getCondition($app, $request);
        $products = [];
        if (isset($productId)) {
            $products = $app['hareruya_ec.repository.order_detail']->getRecommendItems($app, $productId, $app['locale']);
        }

        return $app->render('Block/recommend_detail.twig', [
            'products' => $products,
        ]);
    }

    /**
     * おすすめ商品の検索条件取得
     * @param Application $app
     * @param Request $request
     * @return integer
     */
    private function getCondition(Application $app, Request $request)
    {
        $recommendType = $request->get('recommend_type');
        $productId = '';
        if ($recommendType === 'mypage' || $recommendType === 'complete') {
            $customer = $app->user();
            $orderDetail = $app['hareruya_ec.repository.order_detail']->findLatestOrder($customer);
            if (!empty($orderDetail)) {
                $productId = $orderDetail->getProduct()->getId();
            }
        } elseif ($recommendType === 'detail') {
```

ベース実装 pf-eccube3 最新注文の最高額明細取得: `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:362-375`
```php
    public function findLatestOrder($customer)
    {
        $qb = $this->createQueryBuilder('od');
        $qb
            ->join('Plugin\HareruyaEc\Entity\Order', 'o', 'WITH', 'od.orderId = o.id')
            ->join('o.OrderStatus', 'os')
            ->where('o.Customer = :customer')
            ->andWhere('os.id <> ' . OrderStatus::ORDER_PROCESSING)
            ->orderBy('o.order_date', 'DESC')
            ->addOrderBy('od.price', 'DESC')
            ->setParameter('customer', $customer)
            ->setMaxResults(1);

        return $qb->getQuery()->getOneOrNullResult();
```

ベース実装 pf-eccube3 おすすめ抽出: `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:384-456`
```php
    public function getRecommendItems(Application $app, $productId, $locale)
    {
        $option = $app['hareruya_ec.repository.option']->findOneByOptionKey(MtbOption::RECOMMEND_SEARCH_DAYS);
        $user = $app['user'];
        $userCondition = '';
        $userId = 0;
        if ($user instanceof \Eccube\Entity\Customer) {
            $userId = $user->getId();
            $userCondition = "
            where od.product_id not in (
                select od.product_id
                from dtb_order_detail od
                join dtb_order o on od.order_id = o.order_id
                where o.customer_id = {$userId}
            )";
        }
        $value = $option->getOptionValue();
        $date = new \DateTime();
        $dateStr = $date->format('Y-m-d');
        $dispStatus = Disp::DISPLAY_SHOW;
        $rmStatus = OrderStatus::ORDER_PROCESSING;

        $nameColumn = 'p.name';
        if ($locale === 'en') {
            $nameColumn = 'ps.name_en';
        }

        $rsm = new ResultSetMapping();
        $rsm
            ->addScalarResult('product_id', 'product_id')
            ->addScalarResult('file_name', 'file_name')
            ->addScalarResult('product_name', 'product_name')
            ->addScalarResult('foil_flg', 'foil_flg');

        $query = "
            select sum(od.quantity) as sales,
                   od.product_id,
                   {$nameColumn} as product_name,
                   pi.file_name,
                   cd.foil_flg
            from dtb_order_detail od
                join dtb_order o on od.order_id = o.order_id and o.order_date > date_sub('{$dateStr}', interval {$value} day) and o.status <> {$rmStatus}
                join dtb_product p on od.product_id = p.product_id and p.del_flg = 0 and p.status = {$dispStatus}
                join dtb_product_class pc on od.product_id = pc.product_id and pc.del_flg = 0 and pc.stock > 0
                join dtb_product_sub ps on od.product_id = ps.product_id
                join mtb_region_restriction rr on ps.region_restriction_id = rr.id AND rr.display_locale_list LIKE :locale
                left join dtb_product_sub_class_image psi on od.product_class_id = psi.product_class_id
                left join dtb_product_image pi on psi.product_image_id = pi.product_image_id
                left join mtb_card_detail cd on ps.card_detail_id = cd.id
                join (
                    select same_order.order_id,
                           same_order.product_id,
                           icd.card_id
                    from dtb_order_detail same_order
                    join dtb_product_sub ips on same_order.product_id = ips.product_id
                    left join mtb_card_detail icd on ips.card_detail_id = icd.id
                    where same_order.product_id = :product_id
                ) as latest on od.order_id = latest.order_id
                           and od.product_id <> latest.product_id
                           and (cd.card_id is null or cd.card_id <> latest.card_id)
                {$userCondition}
            group by od.product_id
            order by sales desc
            limit 10";

        return $app['orm.em']
            ->createNativeQuery($query, $rsm)
            ->useResultCache(true, self::RESULT_CACHING_TIME, "recommend-customer-{$userId}-product_id-{$productId}-locale-{$locale}")
            ->setParameters([
                'product_id' => $productId,
                'locale' => "%{$locale}%",
            ])
            ->getResult();
```

ベース実装 pf-eccube3 0件時メッセージ描画: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/recommend_detail.twig:1-24`
```twig
<div class="StyleR_Item_detail_slider swiper-container">
    {% if products %}
    <div class="StyleR_Item_detail_list swiper-wrapper">
        {% for product in products %}
        <div class="StyleR_Item item_detail_recommend_item swiper-slide">
            <div class="img_ {{ product.foil_flg ? 'foil_img' : '' }}">
                <img class="lazy" alt="{{ product.product_name }}" src="{{ path('assets', {path: 'img/ajax-loader.gif'}) }}" data-original="{{ image_path(product.file_name) }}?d=110x110" style="display: block;">
            </div>
            <div class="desc_">
                <div class="name_">
                    <p class="name1_">{{ product.product_name }}</p>
                </div>
                <a href="{{ path('product_detail', {'id': product.product_id, 'lang': app.locale}) }}" onclick="javascript:window.location.href='{{ path('product_detail', {'id': product.product_id, 'lang': app.locale}) }}';">
                </a>
            </div>
        </div>
        {% endfor %}
    </div>
    <div class="swiper-button-prev"><span><img src="{{ path('assets', {path: 'img/cursor_left.png'}) }}"></span></div>
    <div class="swiper-button-next"><span><img src="{{ path('assets', {path: 'img/cursor_right.png'}) }}"></span></div>
    {% else %}
    <p class="message_">{{ trans('hareruyaec.product.no_recommend') }}</p>
    {% endif %}
</div>
```

# 根拠
- 設計：
  - 商品リコメンドの対象ページと非同期取得: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2766-2772`
  - ページ種別mypageの基準商品決定と抽出: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2774-2778`
  - おすすめ0件時メッセージ: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2780-2782`
- ec-cube-enterprise：
  - MypageControllerはおすすめデータを返していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:126-137`
  - recommend_type=mypageのJS接続がTODOとしてコメントアウトされている: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:17-24`
  - マイページはrecommendProducts変数を直接参照するがControllerから渡されない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig:242-267`
- ベース実装：
  - マイページでrecommend_type=mypageを接続: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/index.twig:12-17`
  - recommend_type=mypageで最新注文から基準商品を決める: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/RecommendController.php:24-55`
  - 最新注文内の高額明細を基準にする: `pf-eccube3/app/Plugin/HareruyaEc/Repository/OrderDetailRepository.php:362-375`
  - おすすめ抽出と0件時メッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/recommend_detail.twig:1-24`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f03-05_0303_sheet-7_sheet.json#f03-05_0303_sheet-7_sheet-conformance-125cb18180b5'`
- 確認コマンド: `rg -n "mypage|マイページ|recommend|リコメンド|おすすめ|ProductRecommend|recommendProducts|block_product_recommend|最新注文|最高額" hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html hareruya-design-docs/design_impl_drift_report/findings/f03-05_0303_sheet-7_sheet.json`
- 確認コマンド: `rg -n "recommendProducts|block_product_recommend|ProductRecommend|RecommendService|mypage|user_recommend_product|context.*mypage|TODO.*mypage" ec-cube-enterprise/src/Eccube/Controller ec-cube-enterprise/src/Eccube/Resource/template/default ec-cube-enterprise/src/Eccube/Service`
- 確認コマンド: `rg -n "おすすめ商品|おすすめ|recommend|Recommend|no_recommend|hareruyaec\.product\.no_recommend|商品リコメンド|最新注文|最高額" pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Service pf-eccube3/app/Plugin/HareruyaEc/Repository pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default pf-eccube3/app/Plugin/HareruyaEc/Resource/locale`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/index.twig | sed -n '17,24p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/RecommendController.php | sed -n '24,55p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。
