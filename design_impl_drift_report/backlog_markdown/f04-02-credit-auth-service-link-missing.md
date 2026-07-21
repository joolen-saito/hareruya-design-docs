/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：ご注文方法指定
課題カテゴリ：実装漏れ
課題：クレジットカード決済選択時に本人認証サービスリンクが表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. クレジットカード決済を選択できる商品をカートに入れ、http://localhost:8080/ja/shopping に進む
2. ご注文方法指定画面のお支払い方法で「クレジットカード決済」を選択する
3. お支払い方法欄に本人認証サービスリンクが表示されるか確認する

# 期待される挙動【必須】
- クレジットカード決済を選択した場合のみ、本人認証サービスリンクを表示する
- クレジットカード決済以外を選択した場合は、本人認証サービスリンクを表示しない

# 現在の挙動【必須】
- ec-cube-enterprise のご注文方法指定画面は、お支払い方法欄で `form.Payment` のラジオボタンと支払方法ラベルを描画するのみで、クレジットカード決済選択時に表示する本人認証サービスリンクや `notice_creditcard_payment` 相当の領域を持たない。関連JS `hareruya-checkout.js` も支払確認チェックボックスの有効化制御だけで、本人認証サービスリンクの表示制御を行っていない。

ec-cube-enterprise お支払い方法欄は支払方法ラジオのみを描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:415-555`
```twig
                        {# お支払い情報 #}
                        <section class="p-hareruya-shipping__section">
                            <div class="p-hareruya-shipping__row">
                                <div class="p-hareruya-shipping__heading-wrap">
                                    <h2 class="c-hareruya-heading--lev3">{{ 'front.shopping.payment_method'|trans }}</h2>
                                    <button class="p-hareruya-shipping__help" type="button" data-js-modal-trigger="shipping-payment-modal" aria-controls="shipping-payment-modal"><span class="c-hareruya-text--link">{{ 'front.shopping.payment_modal.heading'|trans }}</span><span class="c-hareruya-icon--sm icon-hareruya-help" aria-hidden="true"></span></button>
                                    <div class="p-hareruya-modal" id="shipping-payment-modal" data-js-modal="" aria-hidden="true" role="dialog" aria-modal="true">
                                        <div class="p-hareruya-modal__container">
                                            <button class="p-hareruya-modal__close" type="button" data-js-modal-close="" aria-label="{{ 'common.close'|trans }}"><i class="icon-hareruya-plus c-hareruya-icon--xs"></i></button>
                                            <div class="p-hareruya-modal__wrapper">
                                                <div class="p-hareruya-modal__header">
                                                    <div class="p-hareruya-modal__title">
                                                        <h3 class="c-hareruya-heading--lev3">{{ 'front.shopping.payment_modal.heading'|trans }}</h3>
                                                    </div>
                                                </div>
                                                <div class="p-hareruya-modal__body">
                                                    <h4 class="c-hareruya-heading--lev4">{{ 'front.shopping.payment_modal.deadline.title'|trans }}</h4>
                                                    <p class="c-hareruya-text">{{ 'front.shopping.payment_modal.deadline.body'|trans|raw }}</p>
                                                    <h4 class="c-hareruya-heading--lev4 u-hareruya-mt20">{{ 'front.shopping.payment_modal.methods.title'|trans }}</h4>
                                                    <p class="c-hareruya-text">{{ 'front.shopping.payment_modal.methods.intro'|trans }}</p>
                                                    <ul>
                                                        <li>{{ 'front.shopping.payment_modal.methods.li1'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.methods.li2'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.methods.li3'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.methods.li4'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.methods.li5'|trans }}</li>
                                                    </ul>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.credit.title'|trans|raw }}</p>
                                                    <ul>
                                                        <li>{{ 'front.shopping.payment_modal.credit.li1'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.credit.li2'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.credit.li3'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.credit.li4'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.credit.li5'|trans }}</li>
                                                    </ul>
                                                    <p class="c-hareruya-text">{{ 'front.shopping.payment_modal.credit.notes'|trans|raw }}</p>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.cod.title'|trans|raw }}</p>
                                                    <ul>
                                                        <li>{{ 'front.shopping.payment_modal.cod.fee1'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.cod.fee2'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.cod.fee3'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.cod.fee4'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.cod.fee5'|trans }}</li>
                                                    </ul>
                                                    <p class="c-hareruya-text">{{ 'front.shopping.payment_modal.cod.notes'|trans|raw }}</p>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.convenience.title'|trans|raw }}</p>
                                                    <ul>
                                                        <li>{{ 'front.shopping.payment_modal.convenience.li1'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.convenience.li2'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.convenience.li3'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.convenience.li4'|trans }}</li>
                                                        <li>{{ 'front.shopping.payment_modal.convenience.li5'|trans }}</li>
                                                    </ul>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.convenience.notes'|trans|raw }}</p>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.bank.title'|trans }}<br>{{ 'front.shopping.payment_modal.bank.intro'|trans }}</p>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.bank.info'|trans|raw }}</p>
                                                    <p class="c-hareruya-text u-hareruya-mt20">{{ 'front.shopping.payment_modal.postal.title'|trans }}<br>{{ 'front.shopping.payment_modal.postal.info'|trans|raw }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-hareruya-shipping__content">
                                    <div class="p-hareruya-shipping__payment">
                                        <div class="p-hareruya-shipping__payment-method">
                                            <fieldset class="p-hareruya-shipping__payment-radio-fieldset">
                                                <legend class="p-hareruya-shipping__payment-method-label">{{ 'front.shopping.payment_info'|trans }}</legend>
                                                <div class="p-hareruya-shipping__radio-list">
                                                    {% if Order.paymentTotal == 0 %}
                                                        {% for key, child in form.Payment %}
                                                            {% if child.vars.value == constant('Eccube\\Entity\\Payment::EC_PAYMENT_NONE') %}
                                                                <label class="c-hareruya-radio" for="{{ child.vars.id }}">
                                                                    {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-trigger': 'change' }, 'label': false }) }}
                                                                    <span class="c-hareruya-text">{{ 'front.shopping.payment_none'|trans }}</span>
                                                                </label>
                                                            {% endif %}
                                                        {% endfor %}
                                                    {% else %}
                                                        {% for key, child in form.Payment %}
                                                            <label class="c-hareruya-radio" for="{{ child.vars.id }}">
                                                                {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-trigger': 'change' }, 'label': false }) }}
                                                                <span class="c-hareruya-text">{{ child.vars.label|trans }}</span>
                                                            </label>
                                                        {% endfor %}
                                                    {% endif %}
                                                    <div class="{{ has_errors(form.Payment) ? 'error' }}">{{ form_errors(form.Payment) }}</div>
                                                </div>
                                            </fieldset>
                                        </div>

                                        {% if BaseInfo.isOptionPoint and Order.Customer is not null %}
                                            {% if canUsePoint %}
                                                {% set point_balance = Order.Customer.Player.point|default(0) %}
                                                {% set payment_total_before_point = Order.subtotal + Order.deliveryFeeTotal + Order.charge %}
                                                {% set max_use_point = min(point_balance, payment_total_before_point) %}
                                                <div class="p-hareruya-shipping__payment-point">
                                                    <span class="p-hareruya-shipping__payment-point-label">{{ 'front.shopping.point_info'|trans }}</span>
                                                    <div class="p-hareruya-shipping__payment-point-content" data-js-point-interaction data-point-max-balance="{{ point_balance }}" data-point-max-payment="{{ payment_total_before_point }}">
                                                        <p class="c-hareruya-text">{{ 'front.shopping.payment.point_balance_label'|trans }}<span class="p-hareruya-shipping__payment-point-balance-unit">{{ Order.Customer.Player.Point|number_format }}pt</span></p>
                                                        <fieldset class="p-hareruya-shipping__payment-radio-fieldset">
                                                            <legend class="u-hareruya-dsp-visually-hidden">{{ 'front.shopping.payment.point_usage_method'|trans }}</legend>
                                                            <div class="p-hareruya-shipping__payment-radio-list p-hareruya-shipping__radio-list">
                                                                {% for key, child in form.pointpay %}
                                                                    {% if loop.first %}
                                                                        <label class="c-hareruya-radio" for="{{ child.vars.id }}">
                                                                            {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-point-save': '' }, 'label': false }) }}
                                                                            <span class="c-hareruya-text">{{ child.vars.label|trans }}</span>
                                                                        </label>
                                                                    {% else %}
                                                                        <div class="p-hareruya-shipping__payment-point-use">
                                                                            <label class="c-hareruya-radio" for="{{ child.vars.id }}">
                                                                                {{ form_widget(child, { 'attr': { 'class': 'c-hareruya-radio__input', 'data-point-use': '' }, 'label': false }) }}
                                                                                <span class="c-hareruya-text">{{ child.vars.label|trans }}</span>
                                                                            </label>
                                                                            <div class="p-hareruya-shipping__payment-point-input-wrap" data-js-point-input-wrapper>
                                                                                <div class="c-hareruya-form-input u-hareruya-w-170" data-js-point-input-field>
                                                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.use_point.vars.id }}">{{ 'front.shopping.payment.use_point_count'|trans }}</label>
                                                                                    {{ form_widget(form.use_point, { 'attr': { 'type': 'number', 'class': 'c-hareruya-form-input__field', 'data-point-input': '', 'data-trigger': 'change', 'min': 0, 'max': max_use_point }}) }}
                                                                                </div>
                                                                                <span class="p-hareruya-shipping__payment-point-unit">pt</span>
                                                                            </div>
                                                                        </div>
                                                                    {% endif %}
                                                                {% endfor %}
                                                                {{ form_errors(form.pointpay) }}
                                                                {{ form_errors(form.use_point) }}
                                                            </div>
                                                        </fieldset>
                                                    </div>
                                                </div>
                                            {% else %}
                                                <div class="p-hareruya-shipping__payment-point">
                                                    <span class="p-hareruya-shipping__payment-point-label">{{ 'front.shopping.point_info'|trans }}</span>
                                                    <p class="c-hareruya-text">{{ 'front.shopping.point_otc_notice'|trans }}</p>
                                                </div>
                                            {% endif %}
                                        {% endif %}
                                    </div>
                                </div>
                            </div>
                        </section>
```

ec-cube-enterprise チェックアウトJSは本人認証サービスリンクを制御していない: `ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-checkout.js:1`
```javascript
(()=>{"use strict";var e,t,n={},a={};function r(e){var t=a[e];if(void 0!==t)return t.exports;var i=a[e]={exports:{}};return n[e](i,i.exports,r),i.exports}r.rv=()=>"1.7.5",r.ruid="bundler=rspack@1.7.5";var i=document.querySelector("[data-point-input]"),o=document.querySelector("[data-point-use]"),d=document.querySelector("[data-point-save]");if(i&&o&&d){var c=function(){o.checked?(i.readOnly=!1,i.style.backgroundColor=""):(i.readOnly=!0,i.style.backgroundColor="rgb(222, 222, 222)")};i.addEventListener("click",function(){i.readOnly&&(o.checked=!0,i.readOnly=!1,i.style.backgroundColor="",i.focus())}),o.addEventListener("change",c),d.addEventListener("change",c),c()}!function(){var e,t=document.querySelector("[data-js-shipping-remarks]"),n=document.querySelector("[data-js-shipping-summary-confirm]");if(t&&n&&"true"!==t.dataset.jsShippingRemarksInitialized){t.dataset.jsShippingRemarksInitialized="true";var a=document.createComment("shipping-remarks-placeholder");null==(e=t.parentNode)||e.insertBefore(a,t);var r=window.matchMedia("(max-width: 1023px)"),i=function(){var e=n.parentNode;e&&e.insertBefore(t,n)},o=function(){var e=a.parentNode;e&&e.insertBefore(t,a.nextSibling)},d=function(){var e,n=document.activeElement,a=(null!=(e=HTMLElement)&&"u">typeof Symbol&&e[Symbol.hasInstance]?!!e[Symbol.hasInstance](n):n instanceof e)&&t.contains(n);r.matches?i():o(),a&&n.focus()};d(),"function"==typeof r.addEventListener?r.addEventListener("change",d):r.addListener(d)}}(),function(){var e=document.querySelector("[data-js-point-interaction]");if(e){var t=e.querySelector("[data-js-point-save]"),n=e.querySelector("[data-js-point-use]"),a=e.querySelector("[data-js-point-input]"),r=e.querySelector("[data-js-point-input-wrapper]"),i=e.querySelector("[data-js-point-input-field]"),o=e.querySelector("[data-js-point-input-overlay]");if(t&&n&&a&&r&&i&&o){var d=function(e){i.classList.toggle("is-point-input-disabled",e),o.disabled=!e,o.tabIndex=e?0:-1},c=function(){n.checked=!0,a.disabled=!1,d(!1),a.focus()},u=function(){n.checked?(a.disabled=!1,d(!1),a.focus()):(a.disabled=!0,a.value="0",d(!0))};t.addEventListener("change",u),n.addEventListener("change",u),o.addEventListener("click",function(){a.disabled&&c()}),u()}}}();var u=document.querySelector("[data-js-payment-confirm-checkbox]"),s=document.querySelector("[data-js-payment-submit]");if(u&&s){var l=function(e){if(s.disabled=!e,s.removeAttribute("tabindex"),!e)return};l(u.checked),u.addEventListener("change",function(){l(u.checked)}),s.addEventListener("click",function(e){s.disabled&&e.preventDefault()})}e=document.querySelector("[data-js-invoice-code-validation]"),t=document.querySelector("[data-js-invoice-code-error]"),e&&t&&e.addEventListener("blur",function(){var n=e.value;n&&14!==n.length?t.textContent="14文字で入力してください":t.textContent=""})})();
```
- ベース実装 pf-eccube3 では、お支払い方法欄の直下に `.notice_creditcard_payment` を置き、本人認証サービス（3Dセキュア2.0）の案内と `id="about-3dsv2"` のリンクを描画している。`shopping_js.twig` は選択中の支払方法ラベルがクレジットカード決済の場合だけ `.notice_creditcard_payment` を表示する。

ベース実装 pf-eccube3 本人認証サービスリンク: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:204-228`
```twig
                <h2 class="common_headline2_" id="payment_info" name="payment_info">お支払い情報</h2>

                <div class="method_box_" id="method_pay">
                    <h3>お支払い方法</h3>
                    <span class="method_none_msg" style="display: none;">配送方法を選択してください</span>
                    <div class="method_box_content_" id="method_box_content">
                        {% if Order.paymentTotal == 0 %}
                            <div class="radio">
                                <label for="payment_none" class="required method_label">
                                    <input type="radio" id="payment_none" name="shopping[payment]" required="required" class="payment" value="{{ paymentNone.id}}" checked="checked"></input>
                                    {{ trans('front.shopping.payment_none') }}
                                </label>
                            </div>
                        {% else %}
                            {% for child in form.payment %}
                                {{ form_widget(child, {'parent_label_class' : 'method_label', 'attr': {'class': 'payment', 'disabled':'disabled'}}) }}
                            {% endfor %}
                        {% endif %}
                        {{ form_errors(form.payment) }}
                    </div>
                    <div class="notice_creditcard_payment">
                        <p>※ 2022年12月21日より、本人認証サービス（3Dセキュア2.0）を導入いたしました。決済へ進む前にご確認ください。</p>
                        <a id="about-3dsv2">本人認証サービス（3Dセキュア2.0）について</a>
                    </div>
                </div>
```

ベース実装 pf-eccube3 クレジットカード決済選択時だけ表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/shopping_js.twig:6-18`
```javascript
        $(document).ready(function () {
            if ("{{ app.locale }}" == 'ja') {
                if ($('input[name="shopping[payment]"]:checked').parent().text().replace(' ', '') == "{{ trans('クレジットカード決済') }}") {
                    $('.notice_creditcard_payment').css('display', 'block');
                }

                return;
            }

            if ($('input[name="shopping[payment]"]:checked').parent().text().replace(' ', '') == "{{ trans('クレジットカード決済') }}") {
                $('.next-message').text(PAYMENT_CREDIT);
                $('.notice_creditcard_payment').css('display', 'block');
            }
```

# 根拠
- 設計：
  - 本人認証サービスリンクはクレジットカード決済選択時のみ表示: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1599`
- ec-cube-enterprise：
  - お支払い方法欄に本人認証サービスリンクの描画がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:415-555`
  - 検索では本人認証サービスリンク相当の実装が見つからず、3Dセキュアはプライバシーポリシー文言と汎用PaymentResultコメントのみ: `ec-cube-enterprise/src/Eccube/Service/Payment/PaymentResult.php:79`
- ベース実装：
  - pf-eccube3ではお支払い方法欄直下に本人認証サービスリンクを表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig:224-227`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02_0304_sheet-4_sheet-conformance-ebc99bc30f32'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for 本人認証サービスリンク excluding data:image lines ... PY`
- 確認コマンド: `rg -n "本人認証|認証サービス|3D|3-D|3d|secure|セキュア|クレジットカード決済|notice_creditcard|creditcard|credit card" pf-eccube3/app/Plugin/HareruyaEc ec-cube-enterprise/src/Eccube ec-cube-enterprise/html/template/default/assets/hareruya/js`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/index.twig | sed -n '204,228p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/shopping_js.twig | sed -n '1,22p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig | sed -n '400,565p'`
- 確認コマンド: `python3 - <<'PY' ... confirm absence terms in enterprise Shopping/index.twig and hareruya-checkout.js ... PY`
