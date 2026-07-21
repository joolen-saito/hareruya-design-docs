/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：配送先の新規登録_変更
課題カテゴリ：実装漏れ
課題：配送先の新規登録・変更画面に注文済み情報は変更されない旨の注意文が表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. ログインした状態で商品をカートに入れ、http://localhost:8080/ja/shopping に進む
2. お届け先の追加導線から配送先の新規登録・変更画面（/ja/shopping/shipping_edit/{id}）を表示する
3. 画面見出し付近に、注文済み情報は変更されない旨の注意文が表示されるか確認する

# 期待される挙動【必須】
- 編集画面の表示時に注意文「既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。」を表示する
- 英語表示では対応する注意文を表示する

# 現在の挙動【必須】
- ec-cube-enterprise の注文中配送先編集画面は `Shopping/shipping_edit.twig` を描画するが、見出し直下に注意文を出力していない。注意文キー `front.mypage.delivery.edit_notice` は存在するものの、使用箇所はマイページの `Mypage/delivery_edit.twig` であり、注文中の `Shopping/shipping_edit.twig` では使用されていない。

ec-cube-enterprise 注文中配送先編集画面のルートとテンプレート: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:792-794`
```php
    #[Route(path: '/shopping/shipping_edit/{id}', name: 'shopping_shipping_edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    #[Template(template: 'Shopping/shipping_edit.twig')]
    public function shippingEdit(Request $request, Shipping $Shipping): Response|RedirectResponse|array
```

ec-cube-enterprise Shopping/shipping_edit.twig は見出しだけで注意文を出していない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:71-83`
```twig
        <div class="p-hareruya-entry__container">
            <div class="p-hareruya-entry__title">
                {% if is_granted('ROLE_USER') %}
                    <h1 class="c-hareruya-heading--lev1">{{ 'front.shopping.shipping_edit_header_customer'|trans }}</h1>
                {% else %}
                    <h1 class="c-hareruya-heading--lev1">{{ 'front.shopping.shipping_edit_header_nonmember'|trans }}</h1>
                {% endif %}
            </div>
            <div class="p-hareruya-entry__content">
                <form class="p-hareruya-entry__form h-adr" method="post" action="{{ url('shopping_shipping_edit', {'id': shippingId}) }}" novalidate>
                    <div class="p-hareruya-entry__form-body">
                        <span class="p-country-name" style="display:none;">Japan</span>
                        {{ form_widget(form._token) }}
```

ec-cube-enterprise 注意文キーはマイページ配送先編集だけで使用: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/delivery_edit.twig:59-63`
```twig
        <div class="p-hareruya-entry__container">
            <div class="p-hareruya-entry__title">
                <h1 class="c-hareruya-heading--lev1">{{ 'front.mypage.title.delivery'|trans }}</h1>
                <p class="p-hareruya-entry__title-text">{{ 'front.mypage.delivery.edit_notice'|trans }}</p>
            </div>
```

ec-cube-enterprise 注意文ロケールは存在する: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:747`
```yaml
front.mypage.delivery.edit_notice: 既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。
```
- ベース実装 pf-eccube3 の注文中配送先編集テンプレート `Shopping/delivery_edit.twig` は、見出しと会員名の直後に同じ注意文を `<p class="message_">` として直接表示している。

ベース実装 pf-eccube3 注文中配送先編集画面の注意文: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:13-24`
```twig
{% block main %}
    <h1 class="common-headline">配送先の新規登録・変更</h1>
    <div class="customer__status">
        <div class="loginname">{{ app.user.name01 }}
            {{ app.user.name02 }}
            様</div>
    </div>
    <p class="message_">
        既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。
    </p>
    <div class="contents">
        <form role="form" id="customer_address_form" action="{{ id is empty ? path('shopping_delivery_new_edit') : path('shopping_delivery_edit', {'id': id})}}" method="post" class="h-adr">
```

# 根拠
- 設計：
  - 編集画面表示時の注意文: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2077`
- ec-cube-enterprise：
  - 注文中配送先編集画面では注意文キーを使っていない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:71-83`
- ベース実装：
  - pf-eccube3では注文中配送先編集画面に注意文を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:20-22`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-e5949f9e255d'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for 既にいただいて and 変更されません ... PY`
- 確認コマンド: `rg -n "既にいただいて|変更されません|弊社へご連絡|edit_notice|delivery\.edit_notice|front\.mypage\.delivery\.edit_notice" ec-cube-enterprise/src/Eccube/Resource/template/default ec-cube-enterprise/src/Eccube/Resource/locale pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default pf-eccube3/app/Plugin/HareruyaEc/Resource/locale`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig | sed -n '50,110p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig | sed -n '1,35p'`
