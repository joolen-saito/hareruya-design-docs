/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：ネット買取商品一覧
課題カテゴリ：実装漏れ
課題：買取特集タグが1件指定されたときにタグ説明文が一覧上部へ表示されない
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. 管理画面の商品管理＞タグ登録で、買取特集タグのフリーエリアに説明文を登録する
2. http://localhost:8080/ja/purchase/search?tags[]=<対象タグID>&purchaseFlg=1 で買取商品一覧を表示する
3. 一覧上部に対象タグの説明文（フリーエリア）が表示されるか確認する

# 期待される挙動【必須】
- 買取特集タグが1件指定された場合、そのタグの説明文（フリーエリア）を取得する
- 取得したタグ説明文を買取商品一覧の上部に表示する
- 買取特集タグが複数指定された場合、タグ説明文の表示は行わない

# 現在の挙動【必須】
- ec-cube-enterprise の `Tag` エンティティには `free_area_jp` / `free_area_en` が存在するが、買取検索の `buildPurchaseSearchBreadcrumbVariables()` はカテゴリ、パンくず文言、検索名だけを返しており、タグ1件時の `Tag::getFreeAreaJp()` / `getFreeAreaEn()` を解決していない。`Purchase/search.twig` も検索フォームと一覧領域を描画するだけで、タグ説明文を表示する変数や `freeArea` の出力を持たない。

ec-cube-enterprise Tag はフリーエリア列を持つ: `ec-cube-enterprise/src/Eccube/Entity/Tag.php:191-216`
```php
        #[ORM\Column(name: 'free_area_jp', type: Types::TEXT, nullable: true, options: ['comment' => 'フリーエリア(日)'])]
        private ?string $free_area_jp = null;

        public function getFreeAreaJp(): ?string
        {
            return $this->free_area_jp;
        }

        public function setFreeAreaJp(?string $free_area_jp): Tag
        {
            $this->free_area_jp = $free_area_jp;

            return $this;
        }

        #[ORM\Column(name: 'free_area_en', type: Types::TEXT, nullable: true, options: ['comment' => 'フリーエリア(英)'])]
        private ?string $free_area_en = null;

        public function getFreeAreaEn(): ?string
        {
            return $this->free_area_en;
        }

        public function setFreeAreaEn(?string $free_area_en): Tag
        {
            $this->free_area_en = $free_area_en;
```

ec-cube-enterprise 買取検索の戻り値にタグ説明文がない: `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:575-605`
```php
        $category = $searchForm->get('category_id')->getData();
        if (!$category instanceof Category) {
            $quickCategory = $quickSearchData['category'] ?? null;
            $category = $quickCategory instanceof Category ? $quickCategory : null;
        }

        // パンくずリストを組み立て
        $productListDetailedSearchBreadcrumbText = '';
        if ($request->query->has('front_product_search')) {
            $locale = $request->getLocale() ?: 'ja';
            // InputBag::get() はスカラー前提のため、配列になる front_product_search[...] は all() から取得する
            $rawFrontProductSearch = $request->query->all()['front_product_search'] ?? null;
            $segments = $this->productListDetailedSearchBreadcrumbBuilder->buildSegments(
                $quickSearchData,
                $searchData,
                $locale,
                \is_array($rawFrontProductSearch) ? $rawFrontProductSearch : null,
            );
            $productListDetailedSearchBreadcrumbText = $this->productListDetailedSearchBreadcrumbBuilder->joinBracketText($segments);
        }

        $searchName = '';
        if (isset($searchData['name']) && \is_string($searchData['name'])) {
            $searchName = StringUtil::trimAll($searchData['name']);
        }

        return [
            'category' => $category,
            'productListDetailedSearchBreadcrumbText' => $productListDetailedSearchBreadcrumbText,
            'searchName' => $searchName,
        ];
```

ec-cube-enterprise 買取一覧テンプレートはタグ説明文を描画しない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/search.twig:83-120`
```twig
                        <div class="p-hareruya-product-list__keywords"
                             id="purchase-list-related-keywords"
                             data-unisearch-related-keywords
                             data-rword-api-url="{{ path('product_search_unisearch_rword_api') }}"
                             data-search-url-base="{{ url('purchase_search') }}"
                             data-search-url-params="purchaseFlg=1&amp;product="
                             data-unisearch-query="{{ unisearch_purchase_list_query|default('')|e('html_attr') }}"
                             hidden>
                            <p class="p-hareruya-product-list__keywords-title">{% if app.locale == 'ja' %}関連キーワード{% else %}Related keywords{% endif %}</p>
                        </div>
                        <form id="purchase-search-form" name="purchase_search_form" method="get" action="{{ url('purchase_search') }}">
                <input type="hidden" name="purchaseFlg" value="1">
                {% if app.request.query.get('cardId') %}
                    <input type="hidden" name="cardId" value="{{ app.request.query.get('cardId') }}">
                {% endif %}
                {% for item in search_form %}
                    {% if item.vars.name not in ['disp_number', 'orderby', 'tags', 'pageno'] %}
                        <input type="hidden" id="{{ item.vars.id }}" name="{{ item.vars.full_name }}"{% if item.vars.value is not empty %} value="{{ item.vars.value }}"{% endif %}>
                    {% endif %}
                {% endfor %}
                {% if search_form.tags|length > 0 %}
                    <div class="d-none" aria-hidden="true">
                        {{ form_widget(search_form.tags) }}
                    </div>
                {% endif %}
                {% if default_product_list_max is defined %}
                    <input type="hidden" name="{{ search_form.disp_number.vars.full_name }}" value="{% if search_form.disp_number.vars.value is not empty %}{% if search_form.disp_number.vars.value.id is defined %}{{ search_form.disp_number.vars.value.id }}{% else %}{{ search_form.disp_number.vars.value }}{% endif %}{% else %}{{ default_product_list_max.id }}{% endif %}">
                {% endif %}
                <input type="hidden" name="pageno" value="{{ app.request.query.get('pageno')|default(1) }}">

                {% include 'Block/_purchase_search_quick_filters.twig' with {
                    quick_search_form: quick_search_form,
                } only %}
            </form>

            <div class="ec-purchaseSearch__content p-hareruya-product-list__content">
                <input type="hidden" form="purchase-search-form" name="{{ search_form.orderby.vars.full_name }}" value="{{ current_product_list_order_by_id }}" id="purchase-search-orderby-input">
```
- ベース実装 pf-eccube3 では、買取検索時に `tags` が指定されていれば `tag_sub` リポジトリから `tagSubs` を取得し、テンプレートへ渡す。`Purchase/product_list.twig` は `tagSubs|length == 1` の場合に `tagSubs[0].getFreeAreaJp|raw` を一覧上部へ表示している。

ベース実装 pf-eccube3 買取検索で tagSubs を取得: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:497-508`
```php
        $query = $request->query->all();

        if (empty($query)) {
            return $app->render('Purchase/product_list.twig', [
                'searchForm' => $searchForm->createView(),
            ]);
        }

        // イベント・セールの説明文表示のため
        if (isset($query['tags'])) {
            $tagSubs = $app['hareruya_ec.repository.tag_sub']->findByTagId($query['tags']);
        }
```

ベース実装 pf-eccube3 tagSubs をテンプレートへ渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:532-540`
```php
            'productSubClasses' => $productSubClasses,
            'page' => $page,
            'pageSize' => $pageSize,
            'query' => array_filter($query),
            'rarityEntity' => $rarityEntity,
            'colorEntity' => $colorEntity,
            'cardtypeEntity' => $cardtypeEntity,
            'tagSubs' => $tagSubs ?? null,
            'productCard' => $productCard,
```

ベース実装 pf-eccube3 買取一覧上部にタグフリーエリアを表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:125-127`
```twig
{% if tagSubs is defined and tagSubs|length == 1 %}
    <div class="evMessage">{{ tagSubs[0].getFreeAreaJp|raw }}</div>
{% endif %}
```

# 根拠
- 設計：
  - 買取特集タグ説明を表示要素とする: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1996`
  - タグ1件時は説明文を一覧上部に表示: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2014`
  - 複数タグでは表示しない: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2020`
- ec-cube-enterprise：
  - Tagにはフリーエリアがあるが買取検索に渡していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php:575-605`
- ベース実装：
  - pf-eccube3ではタグ1件時にフリーエリアを表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:125-127`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-cd2a1cba08fe'`
- 確認コマンド: `rg -n "買取特集タグ説明|タグ説明|フリーエリア|free_area|freeArea|getFreeArea|tagSubs|Tag.*free|説明文" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube/Controller/Front/Purchase ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase ec-cube-enterprise/src/Eccube/Entity/Tag.php pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase pf-eccube3/app/Plugin/HareruyaEc/Entity/MtbTagSub.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '1996,2020p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/Tag.php | sed -n '191,216p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Purchase/PurchaseController.php | sed -n '575,606p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/search.twig | sed -n '80,120p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php | sed -n '497,508p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php | sed -n '532,540p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig | sed -n '125,127p'`
