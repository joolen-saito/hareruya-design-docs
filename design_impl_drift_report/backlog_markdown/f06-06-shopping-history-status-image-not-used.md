/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：注文購入履歴一覧
課題カテゴリ：実装違い
課題：購入履歴一覧の処理状態が注文ステータス別画像ではなくテキストラベルで表示される
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 任意の注文履歴を持つ会員で `http://localhost:8080/ja/mypage/shopping_history` を表示する
2. 注文行の「処理状態」欄を確認する
3. 注文ステータスに応じた画像が表示されるか、ステータス名のテキストラベルが表示されるか確認する

# 期待される挙動【必須】
- 注文購入履歴一覧の要素13「処理状態」は画像として表示する
- 注文ステータスと表示画像の紐付けは「別添資料_注文ステータスと表示画像の紐付け」シートに従う
- スマレジの取引データの場合は処理状態を非表示にする

# 現在の挙動【必須】
- ec-cube-enterprise の購入履歴一覧 `shopping_history.twig` は、注文ステータスIDから `completed` / `cancelled` / `pending` のCSS修飾子を決め、処理状態欄では `<span class="c-hareruya-label--status ...">{{ Order.OrderStatus.name }}</span>` を描画する。`img` やステータス画像パスは使っておらず、注文ステータス別画像ではなく色付きテキストラベルで表示している。

ec-cube-enterprise ステータスIDをCSS修飾子へ変換: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:82-95`
```twig
                <div class="p-hareruya-history-list__list">
                    {% for Order in pagination %}
                        {% set statusId = Order.OrderStatus.id %}
                        {% if statusId in [
                            constant('Eccube\\Entity\\Master\\OrderStatus::DELIVERED'),
                            constant('Eccube\\Entity\\Master\\OrderStatus::PAID'),
                            constant('Eccube\\Entity\\Master\\OrderStatus::PASSED')
                        ] %}
                            {% set statusCssModifier = 'completed' %}
                        {% elseif statusId == constant('Eccube\\Entity\\Master\\OrderStatus::CANCEL') %}
                            {% set statusCssModifier = 'cancelled' %}
                        {% else %}
                            {% set statusCssModifier = 'pending' %}
                        {% endif %}
```

ec-cube-enterprise 処理状態はテキストラベルで描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:193-200`
```twig
                                {# EC / 店頭受取　#}
                                {% if Order.isEcOrder or Order.isOtcAwaitingPickup %}
                                <div class="p-hareruya-history-list__order-info-row">
                                    <dt>{{ 'front.mypage.shopping_history.col.status'|trans }}</dt>
                                    <dd>
                                        <span class="c-hareruya-label--status c-hareruya-label--status-{{ statusCssModifier }}">{{ Order.OrderStatus.name }}</span>
                                    </dd>
                                </div>
```

ec-cube-enterprise 詳細画面もテキストラベル表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:107-112`
```twig
                        {% if Order.isEcOrder or Order.isOtcAwaitingPickup %}
                            <div class="p-hareruya-history-detail__order-info-row">
                                <dt>{{ 'front.mypage.shopping_history.col.order_status'|trans }}</dt>
                                <dd>
                                    <span class="c-hareruya-label--status c-hareruya-label--status-{{ statusCssModifier }}">{{ Order.CustomerOrderStatus }}</span>
                                    <p class="u-hareruya-mt5 c-hareruya-text">{# TODO: ステータス補足メッセージ #}</p>
```
- ベース実装 pf-eccube3 の購入履歴一覧は、処理状態欄で `<img src="... img/sys/shopping_status_{{ order.OrderStatus.id }}.gif">` を表示している。購入履歴詳細でも同じ `img/sys/shopping_status_<注文ステータスID>.gif` を `alt="処理状態"` 付きで表示しており、注文ステータスIDに応じた画像表示になっている。

ベース実装 pf-eccube3 購入履歴一覧の処理状態画像: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:125-129`
```twig
                                        <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__condition" aria-label="処理状態">
                                            <div class="ec-orderHistory__list__item__content__rightSideInSp">
                                                <a href="{{ path('mypage_shopping_history_detail', {id: order.id}) }}">
                                                    <img src="{{ path('assets', {path: 'img/sys/shopping_status_' ~ order.OrderStatus.id ~ '.gif'}) }}">
                                                </a>
```

ベース実装 pf-eccube3 購入履歴詳細の処理状態画像: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig:56-58`
```twig
                            <div class="rightfloat_ processimage_">
                                <img src="{{ path('assets', {path: 'img/sys/shopping_status_' ~ order.OrderStatus.id ~ '.gif'}) }}" alt="処理状態">
                            </div>
```

# 根拠
- 設計：
  - 処理状態は画像で、注文ステータスと表示画像の紐付けシートを参照する: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2705-2707`
  - 用語定義とJS挙動でも状態に応じた画像と規定: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2783-2790`
  - 別添資料として注文ステータスと表示画像の紐付けがある: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:3359-3368`
- ec-cube-enterprise：
  - 処理状態をOrderStatus.nameのspanラベルで表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:193-200`
- ベース実装：
  - pf-eccube3は注文ステータスID別gif画像を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:125-129`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json#f06-06_0304_sheet-8_sheet-conformance-c9d958dbae28'`
- 確認コマンド: `rg -n "処理状態|注文ステータス|表示画像|ステータス.*画像|注文ステータスと表示画像|item-sheet-8-13|sheet-8" hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html`
- 確認コマンド: `rg -n "処理状態|OrderStatus|status|order_status|img|画像|c-hareruya-label--status" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '2661,2707p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '2783,2790p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '3359,3368p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig | sed -n '80,102p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig | sed -n '190,201p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig | sed -n '40,112p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig | sed -n '82,130p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history_detail.twig | sed -n '52,59p'`
