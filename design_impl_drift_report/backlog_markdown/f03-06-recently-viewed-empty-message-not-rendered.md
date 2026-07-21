/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：最近チェックした商品
課題カテゴリ：実装漏れ
課題：履歴Cookieがない場合に最近見た商品なしメッセージが表示されない
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. 履歴Cookieがないブラウザ状態で http://localhost:8080/ja/ を開く
2. トップページ下部の最近チェックした商品ブロックを確認する
3. 必要に応じて http://localhost:8080/ja/products/list または商品詳細画面でも同ブロックを確認する

# 期待される挙動【必須】
- 履歴Cookieがない場合でも、最近見た商品の見出しを表示する
- 履歴Cookieがない場合は、履歴無しメッセージ「最近見た商品はありません。」を表示する
- 英語表示では履歴無しメッセージ「No Recently Seen Items」を表示する

# 現在の挙動【必須】
- ec-cube-enterprise では RecentlyViewedBlockPayloadBuilder::build() が history Cookie 空文字時に ProductClasses を空配列で返す。Block/recently_viewed.twig は `{% if ProductClasses|length > 0 %}` の中に見出し・一覧描画をすべて入れており、else 分岐や no-content メッセージがないため、履歴Cookieがない場合はブロック自体が出力されない。

ec-cube-enterprise history Cookieなし時は空配列を返す: `ec-cube-enterprise/src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68`
```php
        $historyCookie = $mainRequest->cookies->get('history', '');
        if ($historyCookie === '') {
            return [
                'ProductClasses' => [],
                'layout' => $this->resolveLayout($route),
            ];
        }

        $productIds = array_filter(
            array_map('intval', explode(',', $historyCookie)),
            static fn (int $id): bool => $id > 0,
        );

        if ($productIds === []) {
            return [
                'ProductClasses' => [],
                'layout' => $this->resolveLayout($route),
            ];
        }
```

ec-cube-enterprise ProductClassesが0件ならブロック全体を描画しない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/recently_viewed.twig:1-58`
```twig
{% set ProductClasses = (recentlyViewedBlockPayload|default({})).ProductClasses|default([]) %}
{% set layout = (recentlyViewedBlockPayload|default({})).layout|default('detail') %}

{% if ProductClasses|length > 0 %}

{% if layout == 'list' %}
<div class="p-hareruya-product-list__history">
  <div class="p-hareruya-product-list__history-inner">
    <h2 class="p-hareruya-product-list__history-title">{{ 'front.top.recently_viewed.title'|trans }}</h2>
    <div class="p-hareruya-product-history-grid">
      {% for ProductClass in ProductClasses %}
      {% set Product = ProductClass.Product %}
      {% include 'Block/_product_card_simple.twig' with { Product: Product, ProductClass: ProductClass, showWeeklySales: false } %}
      {% endfor %}
    </div>
  </div>
</div>

{% elseif layout == 'top' %}
<section class="p-hareruya-section">
  <div class="l-hareruya-container--md">
    <div class="p-hareruya-heading__wrap p-hareruya-section__heading">
      <h2 class="c-hareruya-heading--lev2">{{ 'front.top.recently_viewed.title'|trans }}</h2>
    </div>
    <div class="p-hareruya-product-carousel p-hareruya-product-carousel--simple">
      <div class="p-hareruya-product-carousel__wrapper">
        <div class="p-hareruya-product-carousel__slider" data-js-target="product-carousel-slider">
          {% for ProductClass in ProductClasses %}
          {% set Product = ProductClass.Product %}
          <div class="p-hareruya-product-carousel__item">
            {% include 'Block/_product_card_simple.twig' with { Product: Product, ProductClass: ProductClass } %}
          </div>
          {% endfor %}
        </div>
      </div>
      <div class="p-hareruya-product-carousel__nav">
        <button class="p-hareruya-product-carousel__nav-prev" type="button" aria-label="{{ 'front.top.carousel.prev'|trans }}"><i class="icon-hareruya-slide-arrow-left c-hareruya-icon--lg"></i></button>
        <button class="p-hareruya-product-carousel__nav-next" type="button" aria-label="{{ 'front.top.carousel.next'|trans }}"><i class="icon-hareruya-slide-arrow-right c-hareruya-icon--lg"></i></button>
      </div>
    </div>
  </div>
</section>

{% else %}
<div class="p-hareruya-product-detail__section p-hareruya-product-detail__history">
  <div class="p-hareruya-product-detail__history-inner">
    <h2 class="c-hareruya-heading--lev2">{{ 'front.top.recently_viewed.title'|trans }}</h2>
    <div class="p-hareruya-product-history-grid">
      {% for ProductClass in ProductClasses %}
      {% set Product = ProductClass.Product %}
      {% include 'Block/_product_card_simple.twig' with { Product: Product, ProductClass: ProductClass, showWeeklySales: false } %}
      {% endfor %}
    </div>
  </div>
</div>
{% endif %}

{% endif %}
```

ec-cube-enterprise 見出しキーのみ存在し履歴無しキーがない: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1209`
```yaml
front.top.recently_viewed.title: 最近チェックした商品
```
- ベース実装 pf-eccube3 では HistoryController が history Cookie がない場合に `Block/history.twig` を変数なしで描画し、テンプレート側が `history is defined` で分岐する。history 未定義時は見出しを表示したうえで `hareruyaec.history.no_content` を出力するため、履歴無しメッセージが表示される。

ベース実装 pf-eccube3 history Cookieなし時はテンプレートをそのまま描画: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/HistoryController.php:10-31`
```php
    public function history(Application $app, Request $request)
    {
        $history = $request->cookies->get('history');
        if (is_null($history)) {
            return $app->render('Block/history.twig');
        }
        $historyArray = array_map('intval', explode(',', $history));

        $historyImageUrl = $app['hareruya_ec.repository.product']->getOptimalCardImagesByProductIds($app, $historyArray);

        $historyData = [];
        if (!empty($historyImageUrl)) {
            foreach($historyArray as $value){
                $historyData[] = $historyImageUrl[$value] ?? null;
            }
        };

        $historyData = array_filter($historyData);

        return $app->render('Block/history.twig', [
            'history' => $historyData
        ]);
```

ベース実装 pf-eccube3 history未定義時の履歴無しメッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/history.twig:1-17`
```twig
<section id="history">
    <h2>{{ trans('hareruyaec.history.title') }}</h2>
    {% if history is defined %}
        <ul class="itemListHistory">
            {% for product in history %}
                <a href="{{ path('product_detail', {id: product.id}) }}" class="spTopPopup popup_product" data-product_id="{{ product.id }}" data-on-mouse="0">
                    <li>
                        <div class="itemImg {{ product.foil_flg ? 'foilImg' : '' }}"><img class="lazy" alt="{{ product.name }}" src="{{ path('assets', {path: 'img/ajax-loader.gif'}) }}" data-original="{{ image_path(product.url) }}?d=130x120"></div>
                    </li>
                </a>
            {% endfor %}
        </ul>
    {% else %}
        <div id="historyCaution">
            <span id="messNothing">{{ trans('hareruyaec.history.no_content') }}</span>
        </div>
    {% endif %}
```

ベース実装 pf-eccube3 英語履歴無しメッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.en.yml:312-314`
```yaml
    history:
        title: Recently Viewed
        no_content: No Recently Seen Items
```

ベース実装 pf-eccube3 日本語履歴無しメッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:328-330`
```yaml
    history:
        title: 最近チェックした商品
        no_content: 最近見た商品はありません。
```

# 根拠
- 設計：
  - 最近見た商品ブロックは履歴無し表示を扱う: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2937-2944`
  - 履歴なし時の表示要件: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2961-2966`
  - エッジケース・エラー処理・表示文言: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2972-3011`
- ec-cube-enterprise：
  - 空履歴時はProductClasses空配列: `ec-cube-enterprise/src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:50-68`
  - 0件時のelseがないため見出しも履歴無しメッセージも出ない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/recently_viewed.twig:1-58`
- ベース実装：
  - Cookieなし時のController挙動: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Block/HistoryController.php:10-31`
  - 履歴なし時のテンプレート分岐: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/history.twig:1-17`

# 確認メモ
- 確認コマンド: `rg -n "履歴Cookie|最近見た商品はありません|No Recently Seen Items|history.no_content|block/history" hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html`
- 確認コマンド: `rg -n "front\.top\.recently_viewed\.title|recently_viewed\.no|No Recently Seen|最近見た商品はありません|RecentlyViewed|block/history|history" ec-cube-enterprise/src/Eccube/Controller ec-cube-enterprise/src/Eccube/Service ec-cube-enterprise/src/Eccube/Resource/template ec-cube-enterprise/src/Eccube/Resource/locale`
- 確認コマンド: `rg -n "history\.no_content|最近見た商品はありません|No Recently Seen Items|Recently Viewed|最近見た商品|block/history|HistoryController|history.twig" pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Resource`
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f03-06_0303_sheet-8_sheet.json#f03-06_0303_sheet-8_sheet-conformance-dee3a0ea42e6'`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f03-06-recently-viewed-empty-message-not-rendered --dry-run`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f03-06-recently-viewed-empty-message-not-rendered`
