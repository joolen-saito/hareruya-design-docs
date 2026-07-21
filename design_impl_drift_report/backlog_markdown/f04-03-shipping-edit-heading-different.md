/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：配送先の新規登録_変更
課題カテゴリ：実装違い
課題：配送先の新規登録・変更画面の見出しが設計文言ではなく追加/変更別の文言になっている
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. ログインした状態で商品をカートに入れ、http://localhost:8080/ja/shopping に進む
2. お届け先の追加導線から配送先の新規登録・変更画面（/ja/shopping/shipping_edit/{id}）を表示する
3. 画面見出しが「配送先の新規登録・変更」になっているか確認する

# 期待される挙動【必須】
- 日本語の編集画面見出しは「配送先の新規登録・変更」を表示する
- 英語の編集画面見出しは「Register New/Change Address」を表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `Shopping/shipping_edit.twig` は、会員時に `front.shopping.shipping_edit_header_customer`、非会員時に `front.shopping.shipping_edit_header_nonmember` を見出しとして出力する。日本語ロケールではそれぞれ「お届け先の追加」「お届け先の変更」、英語ロケールでは「Add Delivery Address」「Change Delivery Address」であり、設計の「配送先の新規登録・変更」/「Register New/Change Address」と一致しない。

ec-cube-enterprise 見出しは会員/非会員で別キー: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:71-77`
```twig
        <div class="p-hareruya-entry__container">
            <div class="p-hareruya-entry__title">
                {% if is_granted('ROLE_USER') %}
                    <h1 class="c-hareruya-heading--lev1">{{ 'front.shopping.shipping_edit_header_customer'|trans }}</h1>
                {% else %}
                    <h1 class="c-hareruya-heading--lev1">{{ 'front.shopping.shipping_edit_header_nonmember'|trans }}</h1>
                {% endif %}
```

ec-cube-enterprise 日本語見出しロケール: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1526-1527`
```yaml
front.shopping.shipping_edit_header_customer: お届け先の追加
front.shopping.shipping_edit_header_nonmember: お届け先の変更
```

ec-cube-enterprise 英語見出しロケール: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml:1335-1336`
```yaml
front.shopping.shipping_edit_header_customer: Add Delivery Address
front.shopping.shipping_edit_header_nonmember: Change Delivery Address
```
- ベース実装 pf-eccube3 は、注文中配送先編集画面の見出しを日本語テンプレートで「配送先の新規登録・変更」、英語テンプレートで「Register New/Change Address」と固定表示している。

ベース実装 pf-eccube3 日本語見出し: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:13-14`
```twig
{% block main %}
    <h1 class="common-headline">配送先の新規登録・変更</h1>
```

ベース実装 pf-eccube3 英語見出し: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.en.twig:18-19`
```twig
{% block main %}
    <h1 class="common-headline">Register New/Change Address</h1>
```

# 根拠
- 設計：
  - 編集画面表示時の見出し文言: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2077`
- ec-cube-enterprise：
  - 見出しが追加/変更別のキーになっている: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:71-77`
- ベース実装：
  - pf-eccube3では設計文言を固定表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:13-14`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-0bfec35ef759'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for 配送先の新規登録・変更 and Register New/Change Address ... PY`
- 確認コマンド: `rg -n "配送先の新規登録・変更|Register New/Change Address|shipping_edit_header_customer|shipping_edit_header_nonmember|お届け先の追加|お届け先の変更|Add Delivery Address|Change Delivery Address" ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping ec-cube-enterprise/src/Eccube/Resource/locale pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping pf-eccube3/app/Plugin/HareruyaEc/Resource/locale`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig | sed -n '71,77p'`
- 確認コマンド: `rg -n "shipping_edit_header_customer|shipping_edit_header_nonmember" ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/locale/messages.en.yaml`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig | sed -n '13,14p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.en.twig | sed -n '18,19p'`
