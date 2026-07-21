/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：商品詳細
課題カテゴリ：実装漏れ
課題：高額商品コードが登録された在庫なし商品の入荷通知ボタンが非表示にならない
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. 本店の商品詳細画面で、高額商品コードが登録されているカード商品を表示する
2. 該当の商品規格が在庫なしになる状態を確認する
3. 在庫なし行に「入荷通知/通知待ち」ボタンが表示されるか確認する

# 期待される挙動【必須】
- 高額商品コードを登録している商品の場合、入荷通知/通知待ちボタンを非表示にする
- 高額商品コード自体は状態表示に表示しても、入荷通知依頼の導線は出さない

# 現在の挙動【必須】
- ec-cube-enterprise では class.highPriceCode を状態表示に出しているが、在庫なし時の入荷通知ボタン表示条件は _show_customer_favorite_and_notify のみで、class.highPriceCode の有無を判定していない。

ec-cube-enterprise 高額商品コード表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig:306-318`
```twig
                                            {% if class.id == initialClass %}
                                                {{ class.memo is empty ? class.CardCondition.code : class.memo }}{% if class.highPriceCode %}<br>({{ class.highPriceCode }}){% endif %}
                                            {% else %}
                                                <a class="p-hareruya-product-detail__col-status-link productClassChange"
                                                href="{{ url('product_detail', {'id': Product.id}) }}?lang={{ languageProductsKey }}&class={{ class.id }}"
                                                data-language="{{ languageProductsKey }}"
                                                data-classid="{{ class.id }}"
                                                data-images='[{% for image in class.ProductClassImages %}"{{ image.product_image_id }}"{% if not loop.last %},{% endif %}{% endfor %}]'
                                                {% if Product.CardDetail and 'back' in languageProducts|keys and languageProducts['back'] %}
                                                    data-backs='["{{ languageProducts['back'].id }}"]'
                                                {% endif %}
                                                >{{ class.memo is empty ? class.CardCondition.code : class.memo }}{% if class.highPriceCode %}<br>({{ class.highPriceCode }}){% endif %}</a>
                                            {% endif %}
```

ec-cube-enterprise 入荷通知ボタン表示条件: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig:341-352`
```twig
                                        {% else %}
                                            {% if _show_customer_favorite_and_notify %}
                                                {% set hasNotify = requests[class.id] is defined %}
                                                <button class="p-hareruya-product-card__notify-btn p-hareruya-mail-btn c-hareruya-btn--sm notifyme{{ hasNotify ? '-cancel' : '' }}{% if hasNotify %} is-selected{% endif %}"
                                                        type="button"
                                                        data-productclass="{{ class.id }}">
                                                    <i class="icon-hareruya-mail-small c-hareruya-icon--sm"></i>
                                                    <i class="icon-hareruya-close c-hareruya-icon--sm"></i>
                                                    <span>{{ 'front.product.restock_notify'|trans }}</span>
                                                    <span>{{ 'front.product.restock_notify_waiting'|trans }}</span>
                                                </button>
                                            {% endif %}
```

ec-cube-enterprise ProductClass highPriceCode: `ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:867-872`
```php
        public function getHighPriceCode(): ?string
        {
            return $this->high_price_code;
        }

        public function setHighPriceCode(?string $high_price_code): ProductClass
```
- ベース実装 pf-eccube3 でも highPriceCode は状態表示に使われている一方、在庫なし時の notifyme ボタンに highPriceCode 判定はない。今回の起票根拠は設計書の明記であり、ベース側は同じ観点の近傍実装として確認した。

ベース実装 pf-eccube3 高額商品コード表示と通知ボタン: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:224-268`
```twig
                                        <div class="col-xs-2 ng-star-inserted">
                                            {% if productDetail.productSub.cardDetail is not null %}
                                            <a
                                                href=""
                                                class="productClassChange {% if class.productClassId == initialClass %}selected{% endif %}"
                                                data-language="{{ languageProductsKey }}"
                                                data-classid="{{ class.productClassId }}"
                                                data-images='[{% for image in class.productSubClassImages %}"{{ image.productImageId }}"{% if not loop.last %},{% endif %}{% endfor %}]'>
                                                <strong>
                                                    {{ class.memo is null ? class.cardCondition.code : class.memo }}{% if class.highPriceCode %}<br>({{ class.highPriceCode }}){% endif %}
                                                </strong>
                                            </a>
                                            {% endif %}
                                        </div>
                                        <div class="col-xs-3 ng-star-inserted">￥{{ class.productClass.price02 | number_format(0, '.', ',') }}</div>
                                        <div class="col-xs-2">{{ class.productClass.stock }}</div>
                                        {% if class.productClass.stock > 0 %}
                                            <div class="col-xs-1 ng-star-inserted">
                                                <div tabindex="0" class="asSpinner">
                                                    <select class="form-control product-listing__qty-to-buy" name="quantityToBuy" id="quantity_detail_{{ class.productClassId }}">
                                                        {% for i in 1..class.getMaxOrderQuantity() %}
                                                            <option value="{{ i }}">{{ i }}</option>
                                                        {% endfor %}
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-xs-4 ng-star-inserted">
                                                <button class="btn btn-primary btn-sm addCart detail" title="カートに追加" type="button" data-productClass="{{ class.productClassId }}" data-product="{{ productDetail.productSub.productId }}" data-price="{{ class.productClass.price02 }}">
                                                    <i aria-hidden="true" class="fas fa-shopping-cart">カートに追加</i>
                                                </button>
                                            </div>
                                        {% else %}
                                            <div class="col-xs-1 ng-star-inserted">
                                            </div>
                                            <div class="col-xs-4 ng-star-inserted">
                                                {% set hasNotify = requests[class.productClassId] is defined %}
                                                <button class="btn btn-primary btn-sm {{ hasNotify ? 'notifyme-cancel' : 'notifyme' }}"
                                                        type="button"
                                                        title="{{ hasNotify ? trans('front.product_request.button.cancel.title') : trans('front.product_request.button.request.title') }}"
                                                        data-productclass="{{ class.productClassId }}">
                                                    <i aria-hidden="true" class="icon fas {{ hasNotify ? 'fa-times' : 'fa-exclamation-circle' }}">
                                                        <span class="notifyme-label">{{ hasNotify ? trans('front.product_request.button.cancel.label') : trans('front.product_request.button.request.label') }}</span>
                                                    </i>
                                                </button>
                                            </div>
```

ベース実装 pf-eccube3 DtbProductSubClass highPriceCode: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbProductSubClass.php:368-389`
```php
     * Set highPriceCode
     *
     * @param string $highPriceCode
     *
     * @return DtbProductSubClass
     */
    public function setHighPriceCode($highPriceCode)
    {
        $this->highPriceCode = $highPriceCode;

        return $this;
    }

    /**
     * Get highPriceCode
     *
     * @return string
     */
    public function getHighPriceCode()
    {
        return $this->highPriceCode;
    }
```

# 根拠
- 設計：
  - 2-14 入荷通知/通知待ちの高額商品コード非表示条件: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1752-1756`
- ec-cube-enterprise：
  - 高額商品コードは表示している: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig:306-318`
  - 入荷通知ボタン表示条件に highPriceCode 判定がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig:341-352`
- ベース実装：
  - ベース側の近傍実装。highPriceCode 表示と notifyme ボタンはあるが、notifyme 側に highPriceCode 判定はない: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig:224-268`
  - ベース側の highPriceCode プロパティ: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbProductSubClass.php:368-389`

# 確認メモ
- 確認コマンド: `rg -n "高額商品コード|入荷通知/通知待ち|2-14" hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html`
- 確認コマンド: `rg -n "highPriceCode.*notify|notify.*highPriceCode|high_price_code.*notify|notify.*high_price_code|class\.highPriceCode|front\.product\.restock_notify" ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig ec-cube-enterprise/src/Eccube/Entity/ProductClass.php`
- 確認コマンド: `rg -n "highPriceCode.*notify|notify.*highPriceCode|high_price_code.*notify|notify.*high_price_code|class\.highPriceCode|notifyme" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbProductSubClass.php`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Product/detail.twig | sed -n '306,352p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/detail.twig | sed -n '224,268p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。
- ベース実装は設計要求を満たす根拠ではなく、同じ商品詳細の近傍実装として highPriceCode と notifyme の扱いを確認した。設計HTMLが本件の直接根拠。
