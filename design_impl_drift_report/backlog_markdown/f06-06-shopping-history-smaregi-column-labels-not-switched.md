/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：注文購入履歴一覧
課題カテゴリ：実装漏れ
課題：スマレジ取引データの列見出しが「購入内容」「支払金額合計」に切り替わらない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. スマレジ取引データまたは店頭受取受注からスマレジ取引になった注文を持つ会員で `http://localhost:8080/ja/mypage/shopping_history` を表示する
2. 対象注文行の「注文内容」「注文金額合計」に相当する見出しを確認する
3. スマレジ取引データの場合だけ、見出しが「購入内容」「支払金額合計」に切り替わるか確認する

# 期待される挙動【必須】
- スマレジの取引データの場合のみ、注文内容の見出しを「購入内容」に変更する
- スマレジの取引データの場合のみ、注文金額合計の見出しを「支払金額合計」に変更する
- スマレジ以外の注文では通常どおり「注文内容」「注文金額合計」を表示する

# 現在の挙動【必須】
- ec-cube-enterprise の購入履歴一覧 `shopping_history.twig` は、購入日・取引番号・レシートNo・支払方法では `Order.isSmaregiTransactionOrder` / `Order.isOtcSmaregiLinkedOrder` の分岐を持つ一方、注文内容と注文金額合計の見出しは無条件で `front.mypage.shopping_history.col.items` / `front.mypage.shopping_history.col.total` を表示している。日本語 locale でもこの2キーはそれぞれ「注文内容」「注文金額合計」で、スマレジ用の「購入内容」「支払金額合計」キーや分岐は確認できない。

ec-cube-enterprise スマレジ判定は他項目に存在: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:100-153`
```twig
                                    {# EC / 店頭受取受注: 注文日 / 店頭受取→スマレジ取引 / スマレジ取引: 購入日 #}
                                    {# 店頭受取→スマレジ取引: 複数取引した場合は一番若い注文日を表示 #}
                                    {% if Order.isOtcSmaregiLinkedOrder %}
                                        <dt>{{ 'front.mypage.shopping_history.col.buy_date'|trans }}</dt>
                                        <dd>{{ (Order.otcSmaregiLinkedPurchaseDate ?? Order.order_date)|date('Y/n/j') }}</dd>
                                    {# スマレジ取引 #}
                                    {% elseif Order.isSmaregiTransactionOrder %}
                                        <dt>{{ 'front.mypage.shopping_history.col.buy_date'|trans }}</dt>
                                        <dd>{{ Order.order_date|date('Y/n/j') }}</dd>
                                    {# EC / 店頭受取受注 #}
                                    {% else %}
                                        <dt>{{ 'front.mypage.shopping_history.col.order_date'|trans }}</dt>
                                        <dd>{{ Order.order_date|date('Y/n/j') }}</dd>
                                    {% endif %}
                                </div>
                                <div class="p-hareruya-history-list__order-info-row">
                                    <dt>{{ 'front.mypage.shopping_history.col.shop'|trans }}</dt>
                                    <dd class="c-hareruya-text">
                                        {# EC = オンラインショップ / EC以外 = 受取店舗名 #}
                                        {% if Order.isEcOrder %}
                                            {{ 'front.block.footer.online_shop'|trans }}    
                                        {% else %}
                                            {{ Order.BaseInfo.shop_name }}
                                        {% endif %}
                                    </dd>
                                </div>
                                
                                {# EC / 店頭受取受注 #}
                                {% if Order.isEcOrder or Order.isOtcAwaitingPickup %}
                                    <div class="p-hareruya-history-list__order-info-row">
                                        <dt>{{ 'front.mypage.shopping_history.col.order_no'|trans }}</dt>
                                        <dd>
                                            <a class="c-hareruya-link" href="{{ url('mypage_shopping_history_detail', {'order_id': Order.id}) }}">{{ Order.order_number }}</a>
                                        </dd>
                                    </div>
                                {# 店頭受取→スマレジ取引 #}
                                {% elseif Order.isOtcSmaregiLinkedOrder %}
                                    <div class="p-hareruya-history-list__order-info-row">
                                        <dt>{{ 'front.mypage.shopping_history.col.transaction_no'|trans }}</dt>
                                        <dd>
                                            {{ Order.otcSmaregiLinkedOrderNumbers|join(', ') }}
                                        </dd>
                                    </div>
                                {% endif %}
           
                                {# 店頭受取→スマレジ取引 / スマレジ取引　#}
                                {% if Order.isSmaregiTransactionOrder or Order.isOtcSmaregiLinkedOrder %}
                                    <div class="p-hareruya-history-list__order-info-row">
                                        <dt>{{ 'front.mypage.shopping_history.col.receipt_no'|trans }}</dt>
                                        <dd>
                                            <a href="{{ url('mypage_shopping_history_detail', {'order_id': Order.id }) }}">{{ Order.smaregi_receipt_no }}</a>
                                        </dd>
                                    </div>
                                {% endif %}
```

ec-cube-enterprise 注文内容と合計見出しは固定キー: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:155-172`
```twig
                                <div class="p-hareruya-history-list__order-info-row is-vertical-sp">
                                    <dt>{{ 'front.mypage.shopping_history.col.items'|trans }}</dt>
                                    <dd>
                                        <ul>
                                            {% for OrderItem in Order.MergedProductOrderItems %}
                                                {% set productClassInfo = product_class_info(OrderItem.ProductClass.id, isLocaleJa ? 'ja' : 'en') %}
                                                    <li class="c-hareruya-text">
                                                        {{ productClassInfo.name }} {{ productClassInfo.condition }} {{ productClassInfo.memo }}{% if productClassInfo.high_price_code %} ({{ productClassInfo.high_price_code }}){% endif %}
                                                    </li>
                                            {% endfor %}
                                        </ul>
                                    </dd>
                                </div>

                                <div class="p-hareruya-history-list__order-info-row">
                                    <dt>{{ 'front.mypage.shopping_history.col.total'|trans }}</dt>
                                    <dd class="c-hareruya-text">{{ Order.payment_total|price }}</dd>
                                </div>
```

ec-cube-enterprise locale は通常見出しのみ: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:981-1004`
```yaml
front.mypage.shopping_history.col.shop: 店舗
front.mypage.shopping_history.col.order_date: 注文日
front.mypage.shopping_history.col.order_no: 注文番号
front.mypage.shopping_history.col.items: 注文内容
front.mypage.shopping_history.col.total: 注文金額合計
front.mypage.shopping_history.col.payment_method: 支払方法
front.mypage.shopping_history.col.status: 処理状態

front.mypage.shopping_history.col.transaction_no: 取引番号
front.mypage.shopping_history.col.purchase_no: 購入番号
front.mypage.shopping_history.col.buy_date: 購入日
front.mypage.shopping_history.col.shipping_date: 出荷日
front.mypage.shopping_history.col.order_status: ステータス
front.mypage.shopping_history.col.order_receipt: 領収書発行
front.mypage.shopping_history.col.receipt_no: レシートNo
front.mypage.shopping_history.col.product_information: 注文商品情報
front.mypage.shopping_history.col.coupon_name: クーポン名
front.mypage.shopping_history.col.coupon_discount: クーポン値引き
front.mypage.shopping_history.col.tax_free: 免税
front.mypage.shopping_history.col.point_used: ポイント使用
front.mypage.shopping_history.col.total_tax_included: 注文金額合計（税込）
front.mypage.shopping_history.col.point_generated: ポイント発生
front.mypage.shopping_history.col.orderer_payment_information: 注文者・支払情報
front.mypage.shopping_history.col.payment_method_otc: 店頭支払
```
- ベース実装 pf-eccube3 の購入履歴一覧は、スマレジ取引データを表示する分岐を持たない旧実装で、一覧見出しを「注文内容」「注文金額合計」として固定表示している。今回の切替要求はベース実装由来ではなく、設計書のスマレジ対応カスタマイズ注記に由来する。

ベース実装 pf-eccube3 購入履歴一覧の固定見出し: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:70-87`
```twig
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__date">
                                        注文日
                                    </div>
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__id">
                                        注文番号
                                    </div>
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__orderContent">
                                        注文内容
                                    </div>
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__sum">
                                        注文金額合計
                                    </div>
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__method">
                                        支払方法
                                    </div>
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__condition">
                                        処理状態
                                    </div>
```

ベース実装 pf-eccube3 行側 aria-label も通常見出し: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:99-118`
```twig
                                        <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__orderContent" aria-label="注文内容">
                                            <div class="ec-orderHistory__list__item__content__rightSideInSp">
                                                <ul>
                                                    {% for orderDetail in order.orderDetails %}
                                                        <li>
                                                            <div class="name_">
                                                                <div class="name1_">{{ orderDetail.productName }}</div>
                                                            </div>
                                                        </li>
                                                    {% endfor %}
                                                </ul>
                                                <div id="repurchaseButton_{{ order.id }}" class="ec-orderHistory__orderAgain">
                                                    <a>
                                                        この注文内容で再度購入する
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__sum" aria-label="注文金額合計">
                                            <div class="ec-orderHistory__list__item__content__rightSideInSp">{{ order.total|price }}</div>
```

# 根拠
- 設計：
  - スマレジ取引データ表示とスマレジ対応文言のカスタマイズが要求されている: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2659-2675`
  - 図形注記で注文内容と注文金額合計の文言変更を明記: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2741-2745`
- ec-cube-enterprise：
  - 注文内容と注文金額合計の見出しはスマレジ分岐なしで固定キーを表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:155-172`
  - locale上も通常見出しキーのみで、購入内容・支払金額合計のショッピング履歴列キーがない: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:981-1004`
- ベース実装：
  - pf-eccube3は通常の購入履歴一覧で固定見出しを表示しており、設計のスマレジ文言切替はベース由来ではなくカスタマイズ注記由来: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:70-87`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json#f06-06_0304_sheet-8_sheet-conformance-e156ea548423'`
- 確認コマンド: `rg -n "スマレジ|購入内容|支払金額合計|注文内容|注文金額合計|isSmaregi|smaregi|col\.items|col\.total" hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html`
- 確認コマンド: `rg -n "isSmaregi|smaregi|col\.items|col\.total|注文内容|注文金額合計|購入内容|支払金額合計|front\.mypage\.shopping_history\.col" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Resource/locale`
- 確認コマンド: `rg -n "注文内容|注文金額合計|購入内容|支払金額合計|smaregi|スマレジ" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '2637,2745p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig | sed -n '96,184p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '978,1006p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig | sed -n '70,122p'`
