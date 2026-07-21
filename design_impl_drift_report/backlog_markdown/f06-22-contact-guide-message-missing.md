/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：お問い合わせ
課題カテゴリ：実装漏れ
課題：お問い合わせ入力画面・確認画面に設計指定の案内文が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. `http://localhost:8080/ja/contact` を表示する
2. 入力画面に「当店へのご要望は、下記フォームにご記入のうえ送信してください。」が表示されるか確認する
3. 必須項目を入力して確認画面へ進み、確認画面にも同じ案内文が表示されるか確認する

# 期待される挙動【必須】
- お問い合わせ画面・確認画面の表示時に、案内文「当店へのご要望は、下記フォームにご記入のうえ送信してください。」を常時表示する
- 英語表示では「To contact the shop, please fill out the form below.」を表示する

# 現在の挙動【必須】
- ec-cube-enterprise のお問い合わせ入力画面は、ガイドバナーと見出し `front.contact.title` のみを表示し、設計指定の案内文を出していない。確認画面も `front.contact.confirm_lead_before_br` / `front.contact.confirm_lead_after_br` の別文言を表示しており、設計指定の案内文ではない。

ec-cube-enterprise 入力画面はバナーと見出しのみで案内文がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig:46-68`
```twig
<div class="p-hareruya-entry p-hareruya-entry--contact">
    {{ include('breadcrumb_nav.twig') }}
    <div class="p-hareruya-entry__container">
        {# ガイドバナー（ec-cube-design-assets ja/contact/index.html 相当） #}
        <div class="p-hareruya-entry__top-banner p-hareruya-banner__item">
            <a class="p-hareruya-banner__link" href="{{ url('help_guide') }}">
                <img
                    class="p-hareruya-banner__image"
                    src="{{ asset('assets/img/contact/guide-banner.webp') }}"
                    alt="{{ 'front.contact.banner.guide_alt'|trans }}"
                    width="343"
                    height="64"
                    loading="lazy"
                >
            </a>
        </div>
        <div class="p-hareruya-entry__title">
            <h1 class="c-hareruya-heading--lev1">{{ 'front.contact.title'|trans }}</h1>
        </div>

        <div class="p-hareruya-entry__content">
            <form method="post" action="{{ url('contact') }}" class="p-hareruya-entry__form h-adr" id="form1" novalidate>
                <span class="p-country-name" style="display:none;">Japan</span>
```

ec-cube-enterprise 確認画面は別の確認誘導文言を表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/confirm.twig:22-29`
```twig
<div class="p-hareruya-entry p-hareruya-entry--contact p-hareruya-entry--confirm">
    {{ include('breadcrumb_nav.twig') }}
        <div class="p-hareruya-entry__container">
            <div class="p-hareruya-entry__title">
                <h1 class="c-hareruya-heading--lev1">{{ 'front.contact.title'|trans }}</h1>
                <p class="c-hareruya-text">{{ 'front.contact.confirm_lead_before_br'|trans }}<br class="u-hareruya-dsp-sp">{{ 'front.contact.confirm_lead_after_br'|trans }}</p>
            </div>
```

ec-cube-enterprise localeには確認画面用の別文言だけが定義されている: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:363-368`
```yaml
front.contact.title: お問い合わせ
front.contact.confirm_lead_before_br: 下記の内容で送信してもよろしいでしょうか？
front.contact.confirm_lead_after_br: よろしければ「送信する」へお進みください。
front.contact.banner.guide_alt: ご利用案内はこちら
front.contact.field.full_name: 氏名
front.contact.order_notice: ご注文に関するお問い合わせには、必ず「ご注文番号」をご記入くださいますようお願いいたします。
```
- ベース実装 pf-eccube3 では、お問い合わせ入力画面と確認画面の双方に `当店へのご要望は、下記フォームにご記入のうえ送信してください。` が直接出力されている。英語テンプレートにも `To contact the shop, please fill out the form below.` があり、設計の確認値と一致する。

ベース実装 pf-eccube3 入力画面に案内文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:8-15`
```twig
{% block main %}
    <div class="event-main-middle-wrapper">
        <h1 class="common-headline">お問い合わせ</h1>
        <div class="contents">
            <p class="contact__message">
                当店へのご要望は、下記フォームにご記入のうえ送信してください。
            </p>
```

ベース実装 pf-eccube3 確認画面に案内文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/confirm.twig:7-10`
```twig
        <p class="contact__message">
            当店へのご要望は、下記フォームにご記入のうえ送信してください。
        </p>
```

ベース実装 pf-eccube3 英語入力画面にも案内文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.en.twig:12-14`
```twig
            <p class="contact__message">
                To contact the shop, please fill out the form below.
            </p>
```

# 根拠
- 設計：
  - 表示要素として案内文を指定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6528-6530`
  - 日本語・英語の案内文と表示条件: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6543-6546`
- ec-cube-enterprise：
  - 入力画面は案内文なし: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig:46-68`
  - 確認画面は設計案内文ではなく別文言: `ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/confirm.twig:22-29`
- ベース実装：
  - pf-eccube3 入力画面は案内文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig:8-15`
  - pf-eccube3 確認画面も案内文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/confirm.twig:7-10`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json#f06-22_0306_sheet-18_sheet-conformance-cb0347cd1fd9'`
- 確認コマンド: `rg -n "cb0347cd1fd9|当店へのご要望|To contact the shop|下記フォーム|案内文|入力画面|確認画面" design_impl_drift_report/findings/f06-22_0306_sheet-18_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "当店へのご要望|To contact the shop|下記フォーム|inquiry_notice|order_notice|confirm_lead|contact\.title|contact\.order_notice" ec-cube-enterprise/src/Eccube/Resource/template/default/Contact ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml ec-cube-enterprise/src/Eccube/Controller/Front/ContactController.php`
- 確認コマンド: `rg -n "当店へのご要望|To contact the shop|下記フォーム|inquiry_notice|order_notice|confirm_lead|contact\.title|contact\.order_notice" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact pf-eccube3/app/Plugin/HareruyaEc/Controller/ContactController.php pf-eccube3/src/Eccube/Resource/template/default/Contact ec-cube/src/Eccube/Resource/template/default/Contact ec-cube/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '6528,6547p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/index.twig | sed -n '46,68p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Contact/confirm.twig | sed -n '22,29p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/index.twig | sed -n '8,15p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Contact/confirm.twig | sed -n '7,10p'`
