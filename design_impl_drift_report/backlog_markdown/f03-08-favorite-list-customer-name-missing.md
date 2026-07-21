/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：お気に入り
課題カテゴリ：実装漏れ
課題：お気に入り登録商品一覧に会員氏名が表示されない
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. 会員でログインする
2. http://localhost:8080/ja/mypage/favorite を開く
3. お気に入り登録商品一覧の見出し付近にログイン会員の氏名が表示されるか確認する

# 期待される挙動【必須】
- お気に入り登録商品一覧に、ログイン会員の会員氏名を表示する
- お気に入り登録商品一覧には、見出し、会員氏名、セール通知の案内、商品数、セール対象商品のみ表示する切替、お気に入り商品の一覧を表示する

# 現在の挙動【必須】
- ec-cube-enterprise の MypageController::favorite() はログイン会員を取得してお気に入り検索には使っているが、テンプレート戻り値には FavoriteProducts、forms、search_form だけを返している。Mypage/favorite.twig は見出し、リード文、商品数、絞り込み、商品グリッドを描画するが、app.user.name01/name02 や Customer の氏名を出力する箇所がない。

ec-cube-enterprise favorite Controller戻り値にCustomerがない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:299-343`
```php
        /** @var Customer $Customer */
        $Customer = $this->getUser();

        /** @var FormBuilderInterface $builder */
        $builder = $this->formFactory->createNamedBuilder('', SearchFavoriteType::class);

        if ($request->getMethod() === 'GET') {
            $builder->setMethod(Request::METHOD_GET);
        }

        $searchForm = $builder->getForm();

        $searchForm->handleRequest($request);

        $searchData = $searchForm->getData();

        $Player = $Customer->getPlayer();
        $FavoriteProducts = $this->dtbFavoriteProductRepository->getQueryBuilderBySearchFavorite($Player, $searchData);

        $forms = [];
        foreach ($FavoriteProducts as $Favorite) {
            $Language = $Favorite->getLanguage();
            $Product = $Favorite->getProduct();
            $formKey = $Product->getId().'_'.$Language->getCode();
            $classIds = [];
            foreach ($Product->getProductClasses() as $ProductClass) {
                if ($ProductClass->getLanguage() === $Language && $ProductClass->isVisible() && (int) $ProductClass->getPrice02() > 0) {
                    $classIds[] = $ProductClass->getId();
                }
            }
            if ($classIds === []) {
                continue;
            }
            $forms[$formKey] = $this->createForm(FavoriteCartType::class, null, [
                'product' => $Product,
                'product_class_ids' => $classIds,
                'shop_for_stock' => $this->getShop(),
            ])->createView();
        }

        return [
            'FavoriteProducts' => $FavoriteProducts,
            'forms' => $forms,
            'search_form' => $searchForm->createView(),
        ];
```

ec-cube-enterprise favorite Twig見出しから商品数まで: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/favorite.twig:44-90`
```twig
{% block main %}
        <div class="p-hareruya-favorite-list">
            {{ include('breadcrumb_nav.twig') }}
            <div class="p-hareruya-favorite-list__container">
                <div class="p-hareruya-favorite-list__title">
                    <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.favorite_list.page_title'|trans }}</h1>
                    {% if FavoriteProducts|length > 0 %}
                        <p class="c-hareruya-text">{{ 'front.mypage.favorite_list.lead'|trans }}</p>
                    {% endif %}
                    {% if FavoriteProducts|length == 0 %}
                        <div class="p-hareruya-message-box--info">
                            <p>{{ 'front.mypage.favorite_not_found'|trans }}</p>
                        </div>
                    {% endif %}
                </div>

                {% if FavoriteProducts|length > 0 %}
                    {% set current_sale_flg = search_form.sale_flg.vars.data ? 1 : 0 %}
                    {% set first_choice = search_form.orderby.vars.choices|first %}
                    {% set current_orderby_id = search_form.orderby.vars.data
                        ? search_form.orderby.vars.data.id
                        : first_choice.value
                    %}
                    <div class="p-hareruya-favorite-list__content">
                        <div class="p-hareruya-favorite-list__header">
                            <form id="search_form" class="p-hareruya-favorite-list__filter" method="get" action="{{ url('mypage_favorite') }}">
                                {# EC-CUBE の checkbox_widget は label:false でも内側に <label> を出すため、手書き input で整合 #}
                                {% set sale_flg_field = search_form.sale_flg %}
                                <label class="c-hareruya-checkbox" data-filter="sale">
                                    <input type="checkbox"
                                           id="sale_flg"
                                           name="{{ sale_flg_field.vars.full_name }}"
                                           value="{{ sale_flg_field.vars.value|default('1') }}"
                                           class="c-hareruya-checkbox__input"
                                           {% if sale_flg_field.vars.checked %}checked="checked"{% endif %}>
                                    <span class="c-hareruya-checkbox__label">{{ 'front.mypage.favorite_list.sale_only'|trans }}</span>
                                </label>
                                <div style="display:none" aria-hidden="true">
                                    {{ form_widget(search_form.orderby) }}
                                </div>
                            </form>
                            <div class="p-hareruya-toolbar">
                                <div class="p-hareruya-toolbar__count">
                                    <p class="c-hareruya-text u-hareruya-font-bold">
                                        {{ 'front.mypage.favorite_list.product_count_prefix'|trans }}&nbsp;<span class="js-favorite-list-count">{{ 'front.mypage.favorite_list.product_count_suffix'|trans({ '%count%': FavoriteProducts|length }) }}</span>
                                    </p>
                                </div>
```

ec-cube-enterprise 氏名表示はnaviにあるがfavoriteからincludeされない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig:33-38`
```twig
<div class="ec-welcomeMsg">
    <p>{{ 'front.mypage.welcome'|trans({ '%last_name%': app.user.name01, '%first_name%': app.user.name02 }) }}</p>
    {% if BaseInfo.option_point %}
        <p>{{ 'front.mypage.welcome__point'|trans({ '%point%': app.user.point|number_format}) }}</p>
    {% endif %}
</div>
```

ec-cube-enterprise navi includeはhistoryのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/history.twig:20-24`
```twig
            <div class="ec-pageHeader">
                <h1>{{ 'front.mypage.title'|trans }}/{{ 'front.mypage.nav__history_detail'|trans }}</h1>
            </div>
            {% include 'Mypage/navi.twig' %}
        </div>
```
- ベース実装 pf-eccube3 の Mypage/favorite_list.twig は、一覧見出し直下の customer__status 内で `{{ app.user.name01 }} {{ app.user.name02 }} 様` を出力している。英語テンプレートでも `{{ app.user.name02 }} {{ app.user.name01 }}` を出力しており、設計の会員氏名表示を満たしている。

ベース実装 pf-eccube3 日本語favorite一覧の会員氏名: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig:23-37`
```twig
{% block main %}
<div class="event-main-middle-wrapper">
    <h1 class="common-headline">お気に入り登録商品一覧</h1>
    <div class="contents favoriteItemContents" id="category_item">
        <div class="customer__status">
            <div class="loginname">{{ app.user.name01 }} {{ app.user.name02 }} 様</div>
        </div>
        <p class="message_">お気に入り登録した商品がセール対象になった際、ご登録されているメールアドレスにお知らせをお送りいたします。</p>
        <div class="category_result_header">
            <div id="narrow_menu">
                <div class="search_item">
                    <p class="search_item_title">商品数:&nbsp;</p>
                    <p class="count_number">{{ productSubClasses|length }}</p>
                    <p>&nbsp;点</p>
                </div>
```

ベース実装 pf-eccube3 英語favorite一覧の会員氏名: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.en.twig:23-37`
```twig
{% block main %}
<div class="event-main-middle-wrapper">
    <h1 class="common-headline">List of your bookmark</h1>
    <div class="contents favoriteItemContents" id="category_item">
        <div class="customer__status">
            <div class="loginname">{{ app.user.name02 }} {{ app.user.name01 }}</div>
        </div>
        <p class="message_">You will receive a notification to your registered e-mail address when your bookmarked items become on sale.</p>
        <div class="category_result_header">
            <div id="narrow_menu">
                <div class="search_item">
                    <p class="search_item_title">Items:&nbsp;</p>
                    <p class="count_number">{{ productSubClasses|length }}</p>
                </div>
                <div class="goods_filter_">
```

# 根拠
- 設計：
  - お気に入り一覧の表示要素に会員氏名が含まれる: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:3664-3669`
  - お気に入り一覧の処理フロー: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:3676-3677`
- ec-cube-enterprise：
  - favorite画面はCustomerを返さず氏名表示に使っていない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:299-343`
  - favoriteテンプレートの見出し周辺に会員氏名出力がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/favorite.twig:44-90`
- ベース実装：
  - pf-eccube3では会員氏名を明示表示する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig:23-37`
  - 英語テンプレートも会員氏名を表示する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.en.twig:23-37`

# 確認メモ
- 確認コマンド: `rg -n "F03-08|f03-08|お気に入り登録商品一覧|会員氏名|お気に入り登録した商品|セール対象|商品数|表示順" hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html`
- 確認コマンド: `rg -n "app\.user\.name01|front\.mypage\.welcome|Customer\.name|name01|name02|loginname|welcome" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/favorite.twig ec-cube-enterprise/src/Eccube/Resource/template/default/default_frame.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/navi.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml`
- 確認コマンド: `rg -n "mypage_favorite|favorite_list|お気に入り|Customer|app\.user|loginname|name01|name02" pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/favorite_list.en.twig`
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f03-08_0303_sheet-10_sheet.json#f03-08_0303_sheet-10_sheet-conformance-ead761c82ace'`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f03-08-favorite-list-customer-name-missing --dry-run`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f03-08-favorite-list-customer-name-missing`
