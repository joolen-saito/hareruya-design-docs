/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：ご注文方法指定
課題カテゴリ：実装漏れ
課題：店頭受取・スムーズ店頭受取時に備考欄を非表示にしてお問い合わせフォーム誘導を表示しない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 店頭受取またはスムーズ店頭受取の配送方法でカートから http://localhost:8080/ja/shopping に進む
2. ご注文方法指定画面のご注文内容確認・備考欄付近を確認する
3. 備考欄が非表示になり、お問合せフォームはこちらエリアが表示されるか確認する

# 期待される挙動【必須】
- 店頭受取・スムーズ店頭受取の場合、備考欄を非表示にする
- 店頭受取・スムーズ店頭受取の場合、お問合せフォームはこちらエリアを表示する
- 店頭受取・スムーズ店頭受取以外の場合、備考欄を表示し、お問合せフォームはこちらエリアを非表示にする

# 現在の挙動【必須】
- ec-cube-enterprise の Shopping/index.twig は `isDeliveryOTC` を定義し、お届け先や配送希望日時には利用している。しかし備考欄セクションは `isDeliveryOTC` 条件で囲まれておらず、`front.shopping.remarks.request` と `front.shopping.message_info` の textarea を常時描画する。`contact` への問い合わせフォーム誘導リンクもこのセクションに存在しない。

ec-cube-enterprise isDeliveryOTC定義と一部利用: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:126-197`
```twig
{% block main %}
    {% set delivery = Order.Shippings.0.Delivery %}
    {% set isDeliveryOTC = delivery.id is defined and delivery.id in constant('Eccube\\Entity\\Delivery::OTC_GROUP') %}
    {% set canUsePoint = delivery.id is defined and delivery.id != constant('Eccube\\Entity\\Delivery::OTC') %}

    <div class="p-hareruya-shipping p-hareruya-checkout">
        <div class="p-hareruya-shipping__container">
            <h1 class="c-hareruya-heading--lev1">{{ 'front.shopping.title'|trans }}</h1>

            <div class="p-hareruya-checkout__progress-wrap">
                <nav class="p-hareruya-cart-progress" aria-label="{{ 'front.cart.progress_aria_label'|trans }}">
                    <ol class="p-hareruya-cart-progress__list">
                        <li class="p-hareruya-cart-progress__item p-hareruya-cart-progress__item--completed">
                            <div class="p-hareruya-cart-progress__step">
                                <div class="p-hareruya-cart-progress__marker p-hareruya-cart-progress__marker--completed" aria-hidden="true">
                                    <i class="c-hareruya-icon--28 icon-hareruya-circle-check"></i>
                                </div>
                                <span class="p-hareruya-cart-progress__label">{{ 'front.cart.progress_step.cart'|trans }}</span>
                            </div>
                        </li>
                        <li class="p-hareruya-cart-progress__item p-hareruya-cart-progress__item--current" aria-current="step">
                            <div class="p-hareruya-cart-progress__step">
                                <div class="p-hareruya-cart-progress__marker p-hareruya-cart-progress__marker--img">
                                    <img class="p-hareruya-cart-progress__img" src="{{ asset('assets/hareruya/img/cart/cart-step-character.webp') }}" alt="" width="48" height="48" loading="lazy">
                                </div>
                                <span class="p-hareruya-cart-progress__label">{{ 'front.cart.progress_step.order_method'|trans }}</span>
                            </div>
                        </li>
                        <li class="p-hareruya-cart-progress__item p-hareruya-cart-progress__item--pending">
                            <div class="p-hareruya-cart-progress__step">
                                <div class="p-hareruya-cart-progress__marker p-hareruya-cart-progress__marker--number">
                                    <span class="p-hareruya-cart-progress__number">3</span>
                                </div>
                                <span class="p-hareruya-cart-progress__label">{{ 'front.cart.progress_step.complete'|trans }}</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>

            {{ include('Shopping/alert.twig') }}

            <form class="p-hareruya-shipping__form" id="shopping-form" method="post" action="{{ url('shopping_confirm') }}">
                {{ form_widget(form._token) }}
                {{ form_widget(form.redirect_to) }}

                <div class="p-hareruya-checkout__layout">
                    <div class="p-hareruya-checkout__main">

                        {% if app.user.isNotOtcGroupPlayer and app.user.isNotOtcShitenGroupPlayer %}
                            {# ご注文主 #}
                            <section class="p-hareruya-shipping__section p-hareruya-shipping__host">
                                <div class="p-hareruya-shipping__row">
                                    <div class="p-hareruya-shipping__heading-wrap">
                                        <h2 class="c-hareruya-heading--lev3">{{ 'front.shopping.customer_info'|trans }}</h2>
                                    </div>
                                    <div class="p-hareruya-shipping__content">
                                        <address class="p-hareruya-shipping__address">
                                            <p class="p-hareruya-shipping__address-name">{{ 'common.name.prefix'|trans }}<span class="customer-name01">{{ Order.name01 }}</span> <span class="customer-name02">{{ Order.name02 }}</span>{{ 'common.name.suffix'|trans }}</p>
                                            <p class="p-hareruya-shipping__address-postal">{{ 'common.postal_symbol'|trans }}<span class="customer-postal_code">{{ Order.postal_code }}{{ Order.abroad_postal_code }}</span></p>
                                            <p class="p-hareruya-shipping__address-street">
                                                <span class="customer-pref">{{ Order.pref }}</span><span class="customer-addr01">{{ Order.addr01 }}</span><span class="customer-addr02">{{ Order.addr02 }}</span><span class="customer-addr03">{{ Order.addr03 }}</span>
                                            </p>
                                            <p class="p-hareruya-shipping__address-tel"><abbr title="{{ 'front.shopping.delivery.phone_number_short'|trans }}">{{ 'front.shopping.delivery.phone_number_short'|trans }}:</abbr> <span class="customer-phone_number">{{ Order.phone_number }}</span></p>
                                        </address>
                                    </div>
                                </div>
                            </section>

                            {# お届け先 - 本店+非店頭受取のみ表示 #}
                            {% if not isDeliveryOTC and isMainShop %}
                                <section class="p-hareruya-shipping__section p-hareruya-shipping__address-selector">
```

ec-cube-enterprise 備考欄セクションはOTC条件なしで常時描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:557-679`
```twig
                        {# 備考欄 #}
                        <section class="p-hareruya-shipping__section p-hareruya-shipping__section--remarks">
                            <div class="p-hareruya-shipping__remarks" data-js-shipping-remarks>
                                <div class="p-hareruya-shipping__remarks-description">
                                    <p>{{ 'front.shopping.remarks.confirm'|trans }}</p>
                                    <p>{{ 'front.shopping.remarks.request'|trans }}</p>
                                    {% if not isDeliveryOTC %}
                                        <p><strong class="u-hareruya-font-bold">{{ 'front.shopping.remarks.combined_note'|trans }}</strong></p>
                                    {% endif %}
                                    <div class="p-hareruya-shipping__remarks-link-wrap">{{ 'front.shopping.remarks.other_notes_prefix'|trans }}
                                        <button class="c-hareruya-text--link" type="button" data-js-modal-trigger="reserve-return-modal" aria-controls="reserve-return-modal">{{ 'front.shopping.remarks.other_notes_link'|trans }}</button>
                                        <div class="p-hareruya-modal p-hareruya-modal--tabs" id="reserve-return-modal" data-js-modal="" aria-hidden="true" role="dialog" aria-modal="true">
                                            <div class="p-hareruya-modal__container">
                                                <button class="p-hareruya-modal__close" type="button" data-js-modal-close="" aria-label="{{ 'common.close'|trans }}"><i class="icon-hareruya-plus c-hareruya-icon--xs"></i></button>
                                                <div class="p-hareruya-modal__wrapper">
                                                    <div class="p-hareruya-modal__header">
                                                        <div class="p-hareruya-modal__tabs">
                                                            <div class="c-hareruya-tabs" data-tab-group="reserve-return-tabs">
                                                                <div class="c-hareruya-tabs__item is-active" data-tab-target="tab-reserve">{{ 'front.shopping.reserve_return_modal.tab.reserve'|trans }}</div>
                                                                <div class="c-hareruya-tabs__item" data-tab-target="tab-return">{{ 'front.shopping.reserve_return_modal.tab.return'|trans }}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="p-hareruya-modal__body">
                                                        <div class="p-hareruya-modal__tabs-contents">
                                                            <div class="c-hareruya-tabs__content is-active" data-tab-content="reserve-return-tabs" data-tab-id="tab-reserve">
                                                                <h4 class="c-hareruya-heading--lev4">{{ 'front.shopping.reserve_return_modal.reserve.heading'|trans }}</h4>
                                                                <dl>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.order.title'|trans }}</dt>
                                                                    <dd>
                                                                        <ul>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.order.li1'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.order.li2'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.order.li3'|trans }}</li>
                                                                        </ul>
                                                                    </dd>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.limit.title'|trans }}</dt>
                                                                    <dd>
                                                                        <ul>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.limit.li1'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.limit.li2'|trans }}</li>
                                                                        </ul>
                                                                    </dd>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.cancel.title'|trans }}</dt>
                                                                    <dd>
                                                                        <ul>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.cancel.li1'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.cancel.li2'|trans }}</li>
                                                                        </ul>
                                                                    </dd>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.payment.title'|trans }}</dt>
                                                                    <dd>
                                                                        <ul>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.payment.li1'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.payment.li2'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.payment.li3'|trans }}</li>
                                                                        </ul>
                                                                        <p class="c-hareruya-text u-hareruya-mt10">{{ 'front.shopping.reserve_return_modal.reserve.payment.note'|trans|raw }}</p>
                                                                    </dd>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.shipping.title'|trans }}</dt>
                                                                    <dd>
                                                                        <ul>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.shipping.li1'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.shipping.li2'|trans }}</li>
                                                                            <li>{{ 'front.shopping.reserve_return_modal.reserve.shipping.li3'|trans }}</li>
                                                                        </ul>
                                                                        <p class="c-hareruya-text u-hareruya-mt10">{{ 'front.shopping.reserve_return_modal.reserve.shipping.note'|trans }}</p>
                                                                    </dd>
                                                                    <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.reserve.congestion.title'|trans }}</dt>
                                                                    <dd>
                                                                        <p class="c-hareruya-text">{{ 'front.shopping.reserve_return_modal.reserve.congestion.body'|trans|raw }}</p>
                                                                    </dd>
                                                                </dl>
                                                            </div>
                                                            <div class="c-hareruya-tabs__content" data-tab-content="reserve-return-tabs" data-tab-id="tab-return">
                                                                <h4 class="c-hareruya-heading--lev4">{{ 'front.shopping.reserve_return_modal.return.heading'|trans }}</h4>
                                                                <ol class="p-hareruya-modal__ordered-list">
                                                                    <li class="p-hareruya-modal__ordered-list-item u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.return.customer.title'|trans }}
                                                                        <p class="c-hareruya-text">{{ 'front.shopping.reserve_return_modal.return.customer.body'|trans }}</p>
                                                                    </li>
                                                                    <li class="p-hareruya-modal__ordered-list-item u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.return.nonconformity.title'|trans }}
                                                                        <dl class="u-hareruya-mt10">
                                                                            <dt>{{ 'front.shopping.reserve_return_modal.return.nonconformity.policy.title'|trans }}</dt>
                                                                            <dd>
                                                                                <p class="c-hareruya-text">{{ 'front.shopping.reserve_return_modal.return.nonconformity.policy.body'|trans }}</p>
                                                                            </dd>
                                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.return.nonconformity.condition.title'|trans }}</dt>
                                                                            <dd>
                                                                                <p class="c-hareruya-text">{{ 'front.shopping.reserve_return_modal.return.nonconformity.condition.body1'|trans }}</p>
                                                                                <p class="c-hareruya-text u-hareruya-mt10"><a class="c-hareruya-text--link" href="https://www.hareruyamtg.com/ja/user_data/card_condition" target="_blank" rel="noopener noreferrer">https://www.hareruyamtg.com/ja/user_data/card_condition</a></p>
                                                                                <p class="c-hareruya-text u-hareruya-mt10">{{ 'front.shopping.reserve_return_modal.return.nonconformity.condition.body2'|trans|raw }}</p>
                                                                            </dd>
                                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.return.nonconformity.applicable.title'|trans }}</dt>
                                                                            <dd>
                                                                                <ul>
                                                                                    <li>{{ 'front.shopping.reserve_return_modal.return.nonconformity.applicable.li1'|trans }}</li>
                                                                                    <li>{{ 'front.shopping.reserve_return_modal.return.nonconformity.applicable.li2'|trans }}</li>
                                                                                </ul>
                                                                            </dd>
                                                                            <dt class="u-hareruya-mt20">{{ 'front.shopping.reserve_return_modal.return.nonconformity.not_applicable.title'|trans }}</dt>
                                                                            <dd>
                                                                                <ul>
                                                                                    <li>{{ 'front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li1'|trans }}</li>
                                                                                    <li>{{ 'front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li2'|trans }}</li>
                                                                                    <li>{{ 'front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li3'|trans }}</li>
                                                                                </ul>
                                                                            </dd>
                                                                        </dl>
                                                                    </li>
                                                                </ol>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-hareruya-shipping__remarks-textarea">
                                    <label class="p-hareruya-shipping__remarks-textarea-label" for="{{ form.message.vars.id }}">{{ 'front.shopping.message_info'|trans }}</label>
                                    {{ form_widget(form.message, {'attr': {'class': 'p-hareruya-shipping__remarks-textarea-input', 'placeholder': 'front.shopping.message_placeholder'|trans, 'rows': '3'}}) }}
                                    {{ form_errors(form.message) }}
                                </div>
```

ec-cube-enterprise 備考欄ロケール: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1422-1502`
```yaml
front.shopping.remarks.confirm: 上記、ご注文内容で注文を確定します。
front.shopping.remarks.request: ご注文内容に関してのご要望がございましたら下記備考欄にご記入ください。
front.shopping.remarks.combined_note: 配送方法【同梱】をお選びいただいた場合は同梱先の「注文番号」をご記入ください。
front.shopping.remarks.other_notes_prefix: その他の注意事項は
front.shopping.remarks.other_notes_link: こちら
front.shopping.notice.point: ※獲得ポイントは商品出荷時に有効になります。
front.shopping.notice.stock: ※在庫状況や諸事情により、ご希望に添えない場合がございます。
front.shopping.point_otc_notice: ポイントのご利用は、店頭にてお支払いいただく際にお申し付けください。
front.shopping.otc_notice.title: 「店頭受取」「スムーズ店頭受取」について
front.shopping.otc_notice.li1: 「晴れる屋トーナメントセンター東京」受取となります。
front.shopping.otc_notice.li2: "「商品取り置き期間」は%date%まで、期間超過で自動キャンセルとなります"
front.shopping.reserve_return_modal.tab.reserve: 予約商品について
front.shopping.reserve_return_modal.tab.return: 返品について
front.shopping.reserve_return_modal.reserve.heading: 《予約商品》
front.shopping.reserve_return_modal.reserve.order.title: ・予約商品の注文
front.shopping.reserve_return_modal.reserve.order.li1: 予約商品を含むご注文については『同梱/追加注文』はお断りさせていただいております。
front.shopping.reserve_return_modal.reserve.order.li2: トーナメントセンター東京店頭用アカウントからの予約商品のご注文はお断りさせていただいております。
front.shopping.reserve_return_modal.reserve.order.li3: お手数ですがお客様のアカウントからのご注文をお願いいたします。
front.shopping.reserve_return_modal.reserve.limit.title: ・シングルカードの予約枚数制限
front.shopping.reserve_return_modal.reserve.limit.li1: シングルカードの予約商品のみ、予約枚数の上限を4枚とさせていただきます。
front.shopping.reserve_return_modal.reserve.limit.li2: 複数回に分けてご注文頂いた場合も、予約販売期間中の注文合計枚数が4枚迄になるようにご注文をお願いいたします。
front.shopping.reserve_return_modal.reserve.cancel.title: ・キャンセル
front.shopping.reserve_return_modal.reserve.cancel.li1: 予約商品は商品の特性上、お客様都合によるキャンセルをお断りさせていただいております。
front.shopping.reserve_return_modal.reserve.cancel.li2: よくご検討いただいたうえで、ご利用下さいませ。
front.shopping.reserve_return_modal.reserve.payment.title: ・予約商品の入金
front.shopping.reserve_return_modal.reserve.payment.li1: ご注文をいただいた日を含めて7日間を期限とさせていただいております。
front.shopping.reserve_return_modal.reserve.payment.li2: 全てのお支払方法での購入が可能となっております。
front.shopping.reserve_return_modal.reserve.payment.li3: 銀行振込・郵便振替を選択して、ご入金が遅れる場合には必ず事前にご連絡をお願いいたします。
front.shopping.reserve_return_modal.reserve.payment.note: "※シングルカードの予約商品につきましては、店頭支払い以外のお支払い方法での購入が可能となっております。<br>※全ての予約商品に関して、クレジットカードのご注文は注文日に決済を確定させていただいております。"
front.shopping.reserve_return_modal.reserve.shipping.title: ・予約商品の発送
front.shopping.reserve_return_modal.reserve.shipping.li1: "予約商品は、正式発売日の発送を予定しております。(※発売日前日に発送させていただく場合もございます。)"
front.shopping.reserve_return_modal.reserve.shipping.li2: 日時指定にて発売日以前をご希望頂いた場合、正式発売日以降の発送となります。
front.shopping.reserve_return_modal.reserve.shipping.li3: 特に日時指定をいただかなかったお客様につきましては、商品の発売日以降「最速」での発送とさせていただきます。
front.shopping.reserve_return_modal.reserve.shipping.note: ※交通事情や天候等により、指定した日時に届かない場合が稀にございますが、当店では責任を負いかねます。
front.shopping.reserve_return_modal.reserve.congestion.title: ・混雑について
front.shopping.reserve_return_modal.reserve.congestion.body: "新セット発売時は注文が殺到します。<br>即日出荷はお約束しておりますが、通常時よりも発送が遅れてしまう事がございます。ご了承くださいませ。"
front.shopping.reserve_return_modal.return.heading: 返品・交換に関する規約
front.shopping.reserve_return_modal.return.customer.title: お客様のご都合による返品・交換について
front.shopping.reserve_return_modal.return.customer.body: "当社が取り扱う商品は、その性質上、一点ものが多くを占める古物（中古品）です。そのため、商品に契約不適合がある場合を除き、お客様のご都合（「イメージと違った」「注文を間違えた」等）による返品・交換は一切お受けできません。"
front.shopping.reserve_return_modal.return.nonconformity.title: 商品の契約不適合による返品・交換について
front.shopping.reserve_return_modal.return.nonconformity.policy.title: ① 基本方針
front.shopping.reserve_return_modal.return.nonconformity.policy.body: "お届けした商品がご注文内容と異なる場合、または以下に定める契約不適合に該当する場合には、商品到着後8日以内にご連絡をいただくことで、当社の送料負担にて交換または返金（返品）の対応をいたします。"
front.shopping.reserve_return_modal.return.nonconformity.condition.title: ② 商品の状態と契約内容について
front.shopping.reserve_return_modal.return.nonconformity.condition.body1: "当社では、古物（中古品）の特性を踏まえ、お客様に商品の状態を正確にご理解いただくため、商品状態について当社独自の基準に基づき確認し、商品ページへ表記しています。状態の詳細な基準は、別途ご案内しているページにてご確認ください。"
front.shopping.reserve_return_modal.return.nonconformity.condition.body2: "お客様には、商品ページと当社基準に記載された商品の状態に関する説明をご確認・ご同意いただいた上で、ご購入いただくものとします。<br>この商品ページに表示された商品の状態が、お客様と当社の間の売買契約における品質に関する合意内容となります。"
front.shopping.reserve_return_modal.return.nonconformity.applicable.title: "③ 返品・交換の対象となる場合（契約不適合に該当するケース）"
front.shopping.reserve_return_modal.return.nonconformity.applicable.li1: ご注文内容と異なる商品が届いた場合
front.shopping.reserve_return_modal.return.nonconformity.applicable.li2: "商品ページや当社独自の詳細な基準に記載のない、客観的に見て明らかな破損がある場合"
front.shopping.reserve_return_modal.return.nonconformity.not_applicable.title: ④ 返品・交換の対象とならない場合
front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li1: 商品ページに記載済みの傷、汚れ、経年劣化等を理由とする場合
front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li2: "お客様の主観的な判断（例：「思ったより傷が目立つ」など）と、当社が商品ページでご提示した状態説明との間に相違がない場合"
front.shopping.reserve_return_modal.return.nonconformity.not_applicable.li3: 商品到着後、9日以上が経過した場合
front.shopping.delivery_provider: 配送方法
front.shopping.delivery_date: 配送希望日時指定
front.shopping.delivery_time: お届け時間
front.shopping.delivery.change: お届け先情報を変更する
front.shopping.delivery.add: 新しいお届け先を追加する
front.shopping.delivery.phone_number_short: TEL
front.shopping.delivery.membership_information_address: 会員情報住所 / Membership Information Address
front.shopping.pickup_today: 当日中に受け取ります
front.shopping.to_multiple: お届け先を追加する
front.shopping.payment_method: お支払い情報
front.shopping.payment_info: お支払い方法
front.shopping.point_info: ポイント使用
front.shopping.available_point: "現在のポイント残高: %point% pt"
front.shopping.payment.point_balance_label: 現在のポイント残高:
front.shopping.payment.point_usage_method: ポイントの使用方法を選択
front.shopping.payment.use_point_count: 使用ポイント数
front.shopping.payment.enable_point_input: ポイント入力を有効化
front.shopping.point_prev: 利用ポイント
front.shopping.prev_point: ご注文前のポイント
front.shopping.next_point: ご注文後のポイント
front.shopping.add_point: 加算ポイント
front.shopping.use_point: ご利用ポイント
front.shopping.point_balance: ポイント残高
front.shopping.save: ポイントをためる
front.shopping.use: ポイントを使う
front.shopping.payment_none: 全額ポイント支払い
front.shopping.accept_order: この内容で注文を確定します。
front.shopping.message_info: 備考欄
front.shopping.message_placeholder: お問い合わせ事項がございましたら、こちらにご入力ください。(3000文字まで)
```
- ベース実装 pf-eccube3 では `isDeliveryOTC` の場合に、備考欄ではなく「ご注文内容に関してのご要望がございましたら下記よりお問い合わせください。」と `url('contact', {'tctokyo': 'true'})` の問い合わせフォームリンクを表示する。`isDeliveryOTC` 以外の場合だけ、備考欄案内と `form.message` textarea を描画している。

ベース実装 pf-eccube3 isDeliveryOTC定義: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:14-19`
```twig
{% block main %}
    {% set delivery = Order.Shippings.0.Delivery %}
    {% set isDeliveryOTC = delivery.id is defined and delivery.id in constant('Plugin\\HareruyaEc\\Entity\\Delivery::OTC_GROUP') %}
    {% set isPaymentOTC = Order.Payment is not empty and Order.Payment.method == '店頭支払' %}
    {% set canUsePoint = delivery.id is defined and delivery.id != constant('Plugin\\HareruyaEc\\Entity\\Delivery::OTC') %}
```

ベース実装 pf-eccube3 OTC時は問い合わせ誘導、非OTC時は備考欄: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:297-318`
```twig
                <hr class="hidden_">
                上記、ご注文内容で注文を確定します。<br>
                {% if isDeliveryOTC %}
                    ご注文内容に関してのご要望がございましたら下記よりお問い合わせください。<br>
                    <br>
                    <a href="{{ url('contact', {'tctokyo': 'true'}) }}"
                       style="color: #3C86E9; text-decoration: underline;" target="_blank">
                        【お問い合わせフォーム】はこちら
                    </a>
                {% else %}
                    ご注文内容に関してのご要望がございましたら下記備考欄にご記入ください。<br>
                    <strong>配送方法【同梱】をお選び頂いた場合は同梱先の「注文番号」をご記入ください。</strong><br>
                    <br>
                    <br>
                    <div style="text-align: center;position: relative;top: -5px;" class="scroll_mark">
                        <strong>↓↓↓↓【備考欄】はこちら↓↓↓↓</strong>
                    </div>
                    <div id="contact_message" class="column">
                        {{ form_widget(form.message, {'attr': {'rows': '3'}}) }}
                        {{ form_errors(form.message) }}
                    </div>
                {% endif %}
```

ベース実装 pf-eccube3 英語版もOTC時にContact Usへ誘導: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.en.twig:284-302`
```twig
                <hr class="hidden_">
                {% if isDeliveryOTC %}
                    Please confirm the above is all correct and leave any remarks regarding your order "Contact Us" page.<br>
                    <strong>Please click the "<span class="next-message">Next</span>" button to place your order.</strong><br>
                    <br>
                    <a href="{{ url('contact', {'tctokyo': 'true'}) }}"
                       style="color: #3C86E9; text-decoration: underline;" target="_blank">
                        Contact Us
                    </a>
                {% else %}
                    Please confirm the above is all correct and leave any remarks regarding your order in the field below.<br>
                    <strong>Please click the "<span class="next-message">Next</span>" button to place your order.</strong><br>
                    <br>
                    <br>
                    <div id="contact_message" class="column">
                        {{ form_widget(form.message, {'attr': {'rows': '3'}}) }}
                        {{ form_errors(form.message) }}
                    </div>
                {% endif %}
```

# 根拠
- 設計：
  - 店頭受取・スムーズ店頭受取時の備考欄と問い合わせ誘導の出し分け: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1248-1258`
  - 備考欄の項目定義: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1270-1274`
  - レイアウト注釈でも問い合わせフォーム誘導を要求: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1698-1703`
- ec-cube-enterprise：
  - 備考欄がOTC条件なしで描画される: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:557-679`
- ベース実装：
  - pf-eccube3ではOTC時と非OTC時で問い合わせ誘導・備考欄を分岐: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:297-318`

# 確認メモ
- 確認コマンド: `rg -n "備考欄|お問合せフォーム|お問い合わせフォーム|店頭受取・スムーズ店頭受取|スムーズ店頭受取|通常配送" hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html`
- 確認コマンド: `rg -n "message_info|message_placeholder|remarks|備考欄|お問い合わせフォームはこちら|お問合せフォームはこちら|contact|isDeliveryOTC|data-js-shipping-remarks" ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml`
- 確認コマンド: `rg -n "message_info|message_placeholder|remarks|備考欄|お問い合わせフォームはこちら|お問合せフォームはこちら|contact|isDeliveryOTC|Delivery::OTC_GROUP|form.message" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.en.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.en.yml`
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02-0304-sheet-4-sheet-b88ee5d2eb-01'`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f04-02-shopping-otc-remarks-contact-switch-missing --dry-run`
- 確認コマンド: `python3 design_impl_drift_report/export_verified_backlog_items.py --id f04-02-shopping-otc-remarks-contact-switch-missing`
