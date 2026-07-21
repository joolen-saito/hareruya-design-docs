/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：注文購入履歴一覧
課題カテゴリ：実装漏れ
課題：購入履歴一覧の下部に件数表示と表示件数プルダウンが表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 注文履歴を持つ会員で `http://localhost:8080/ja/mypage/shopping_history` を表示する
2. 一覧上部に件数表示、ページング、表示件数プルダウンが表示されていることを確認する
3. 一覧下部に移動し、件数表示、ページング、表示件数プルダウンが同様に表示されているか確認する

# 期待される挙動【必須】
- 一覧下部の要素15として件数ラベルを表示する
- 一覧下部の要素16としてページングリンクを表示する
- 一覧下部の要素17として表示件数プルダウンを表示する
- 要素15/16/17はいずれの注文区分でも表示対象とする

# 現在の挙動【必須】
- ec-cube-enterprise の購入履歴一覧では、上部ツールバーに件数表示、ページャ、`form.disp_number` の表示件数プルダウンを描画している。一方、下部の `p-hareruya-history-list__pagination-wrap--bottom` は `pager.twig` の include だけで、件数表示と表示件数プルダウンを描画していない。`ShoppingHistoryType` には `disp_number` フィールドがあるため入力部品は定義済みだが、下部には出力されていない。

ec-cube-enterprise 上部ツールバーは件数・ページャ・表示件数を描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:60-80`
```twig
                <div class="p-hareruya-toolbar">
                    <div class="p-hareruya-toolbar__count">
                        <p class="c-hareruya-text u-hareruya-font-bold">{{ 'front.mypage.history_count'|trans }}&nbsp;<span>{{ 'front.mypage.history_count_suffix'|trans({'%count%': pagination.totalItemCount}) }}</span></p>
                    </div>
                    <div class="p-hareruya-toolbar__pagination">
                        <div class="p-hareruya-pagination">
                            {% include "pager.twig" with {'pages': pagination.paginationData} %}
                        </div>
                    </div>
                    <div class="p-hareruya-toolbar__sort">
                        <div class="p-hareruya-toolbar__sort-sp">
                            <label class="p-hareruya-toolbar__sort-label" for="js-shopping-history-disp-number">
                                <span class="c-hareruya-text--sm u-hareruya-font-bold">{{ 'front.mypage.shopping_history.display_count'|trans }}</span>
                            </label>
                            <div class="p-hareruya-toolbar__sort-select-wrapper">
                                {{ form_widget(form.disp_number, {'attr': {'id': 'js-shopping-history-disp-number', 'class': 'p-hareruya-toolbar__sort-select', 'form': 'form1'}}) }}
                                <span class="p-hareruya-toolbar__sort-icon" aria-hidden="true"></span>
                            </div>
                        </div>
                    </div>
                </div>
```

ec-cube-enterprise 下部はページャのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216`
```twig
                <div class="p-hareruya-history-list__pagination-wrap--bottom">
                    <div class="p-hareruya-pagination">
                        {% include "pager.twig" with {'pages': pagination.paginationData} %}
                    </div>
                </div>
```

ec-cube-enterprise 表示件数フィールド定義: `ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingHistoryType.php:56-63`
```php
        $builder->add('pageno', HiddenType::class, []);
        $builder->add('disp_number', ChoiceType::class, [
            'label' => false,
            'choices' => $choices,
            'placeholder' => false,
            'required' => false,
        ]);
    }
```
- ベース実装 pf-eccube3 の購入履歴一覧は、上部に表示件数セレクトと件数・ページャを描画し、下部にも `[表示範囲 件]`、総件数、ページャを描画している。ただし表示件数セレクトは旧実装でも上部のみで、下部表示件数プルダウンの要求は設計側で追加された要素17として確認できる。

ベース実装 pf-eccube3 上部の表示件数セレクトとページャ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:27-67`
```twig
                            <div class="navipage_">
                                <div class="deckSearch-searchResult__displayNumber">
                                    <select id="selectPageSize" name="selectPageSize">
                                    {% set pageSizeArr = [10, 20, 50, 100] %}
                                    {% set pageSize = query.pageSize|default(10) %}
                                    {% for size in pageSizeArr %}
                                        <option value="{{ size }}" {{ size == pageSize ? "selected" : "" }}>{{ size }}件</option>
                                    {% endfor %}
                                    </select>
                                </div>
                            </div>
                            <div class="navipage_ top_">
                                [
                                {% if orders.getTotalItemCount == 0 %}
                                    {{ orders.getTotalItemCount }} ~
                                {% else %}
                                    {{ (orders.getCurrentPageNumber - 1) * orders.getItemNumberPerPage + 1}} ~
                                {% endif %}
                                {% if orders.getCurrentPageNumber * orders.getItemNumberPerPage > orders.getTotalItemCount %}
                                    {{ orders.getTotalItemCount }}
                                {% else %}
                                    {{ orders.getCurrentPageNumber * orders.getItemNumberPerPage }}
                                {% endif %}
                                件]
                                <br class="smp">
                                <span class="count_number">{{ orders.getTotalItemCount }} 件あります</span>
                                <br class="smp">
                                {% if orders.getCurrentPageNumber - 1 > 0 %}
                                    <span><a href="{{ path('mypage_shopping_history', query|merge({'page': 1})) }}">最初</a></span>
                                    {% for p in range(1, orders.getCurrentPageNumber - 1) if p > orders.getCurrentPageNumber - 1 - limit %}
                                        <span><a href="{{ path('mypage_shopping_history', query|merge({'page': p})) }}">{{ p }}</a></span>
                                    {% endfor %}
                                {% endif %}
                                <span class="navipage_now_">{{ orders.getCurrentPageNumber }}</span>
                                {% if orders.getCurrentPageNumber < pages %}
                                    {% for p in range(orders.getCurrentPageNumber + 1, pages) if p < orders.getCurrentPageNumber + 1 + limit %}
                                        <span><a href="{{ path('mypage_shopping_history', query|merge({'page': p})) }}">{{ p }}</a></span>
                                    {% endfor %}
                                    <span><a href="{{ path('mypage_shopping_history', query|merge({'page': pages})) }}">最後</a></span>
                                {% endif %}
                            </div>
```

ベース実装 pf-eccube3 下部の件数・ページャ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:135-164`
```twig
                            <div class="navipage_ bottom_">
                                [
                                {% if orders.getTotalItemCount == 0 %}
                                    {{ orders.getTotalItemCount }} ~
                                {% else %}
                                    {{ (orders.getCurrentPageNumber - 1) * orders.getItemNumberPerPage + 1}} ~
                                {% endif %}
                                {% if orders.getCurrentPageNumber * orders.getItemNumberPerPage > orders.getTotalItemCount %}
                                    {{ orders.getTotalItemCount }}
                                {% else %}
                                    {{ orders.getCurrentPageNumber * orders.getItemNumberPerPage }}
                                {% endif %}
                                件]
                                <br class="smp">
                                <span class="count_number">{{ orders.getTotalItemCount }} 件あります</span>
                                <br class="smp">
                                {% if orders.getCurrentPageNumber - 1 > 0 %}
                                    <span><a href="{{ path('mypage_shopping_history', query|merge({'page': 1})) }}">最初</a></span>
                                    {% for p in range(1, orders.getCurrentPageNumber - 1) if p > orders.getCurrentPageNumber - 1 - limit %}
                                        <span><a href="{{ path('mypage_shopping_history', query|merge({'page': p})) }}">{{ p }}</a></span>
                                    {% endfor %}
                                {% endif %}
                                <span class="navipage_now_">{{ orders.getCurrentPageNumber }}</span>
                                {% if orders.getCurrentPageNumber < pages %}
                                    {% for p in range(orders.getCurrentPageNumber + 1, pages) if p < orders.getCurrentPageNumber + 1 + limit %}
                                        <span><a href="{{ path('mypage_shopping_history', query|merge({'page': p})) }}">{{ p }}</a></span>
                                    {% endfor %}
                                    <span><a href="{{ path('mypage_shopping_history', query|merge({'page': pages})) }}">最後</a></span>
                                {% endif %}
                            </div>
```

# 根拠
- 設計：
  - 画面上のピンで下部に15件数、16ページング、17表示件数が配置されている: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2633-2649`
  - 要素表で下部15/16/17が全区分表示対象として定義されている: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2708-2710`
- ec-cube-enterprise：
  - 下部はpager.twigだけを描画し、件数表示・表示件数プルダウンがない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig:212-216`
- ベース実装：
  - pf-eccube3は下部にも件数範囲・総件数・ページャを描画している: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig:135-164`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-06_0304_sheet-8_sheet.json#f06-06_0304_sheet-8_sheet-conformance-6dada7e76bf5'`
- 確認コマンド: `rg -n "item-sheet-8-1[567]|表示件数|件数|ページング|p-hareruya-history-list__pagination-wrap--bottom|disp_number|pager\.twig|search_pagination|pagination" hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig`
- 確認コマンド: `rg -n "表示件数|disp_number|件数|最初|最後|pagination|pager|pages" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/ShoppingController.php`
- 確認コマンド: `rg -n "function .*shoppingHistory|mypage_shopping_history|ShoppingHistoryType|disp_number" ec-cube-enterprise/src/Eccube/Controller ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingHistoryType.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書\(フロント_注文\).html | sed -n '2633,2710p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig | sed -n '52,86p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/shopping_history.twig | sed -n '204,236p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Form/Type/Front/ShoppingHistoryType.php | sed -n '1,100p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/shopping_history.twig | sed -n '1,170p'`
