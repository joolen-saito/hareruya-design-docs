/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：商品一覧
課題カテゴリ：実装違い
課題：商品一覧の0件時メッセージが設計文言と異なる
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. 商品一覧画面(例: http://localhost:8080/ja/products/list )を表示する
2. 存在しない商品名など、抽出件数が0件になる条件で検索する
3. 一覧領域に表示される0件時メッセージを確認する

# 期待される挙動【必須】
- 抽出件数が0件のとき、一覧領域に「ご指定の条件に一致する商品が見つかりませんでした。」を表示する

# 現在の挙動【必須】
- ec-cube-enterprise では、商品一覧の0件時表示は翻訳キー front.product.search__product_not_found を使い、その日本語値は「お探しの商品は見つかりませんでした」になっている。DB検索経路の else 分岐も同じキーを表示する。

ec-cube-enterprise 0件時メッセージ翻訳: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1103-1105`
```yaml
front.product.search__category_not_found: ご指定のカテゴリは存在しません
front.product.search__product_not_found: お探しの商品は見つかりませんでした
front.product.unisearch_load_failed: 読み込みに失敗しました。
```

ec-cube-enterprise 商品一覧0件分岐: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:872-879`
```twig
                    <div class="p-hareruya-pagination ec-mt2">
                        {% include 'pager.twig' with { pages: product_list_pager } %}
                    </div>
                </div>
                {% endif %}
            {% else %}
                <p class="ec-text ec-mb0">{{ 'front.product.search__product_not_found'|trans }}</p>
            {% endif %}
```

ec-cube-enterprise ユニサーチ設定: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:620-630`
```twig
                    lazyUrl: path('product_search_unisearch_lazy_load'),
                    countTpl: 'front.product_list.product_count'|trans({ '%count%': '__COUNT__' }),
                    loadFailedMsg: product_list_unisearch_load_failed_message|default('Failed to load.'),
                    pagerPrev: 'common.prev'|trans,
                    pagerNext: 'common.next'|trans,
                    pagerNavAria: 'common.pager.nav_aria'|trans,
                    pagerPrevAria: 'common.pager.prev_aria'|trans,
                    pagerNextAria: 'common.pager.next_aria'|trans,
                    pagerPageAria: 'common.pager.page_aria'|trans({'%page%': '__PAGE__'}),
                    emptyResultMsg: 'front.product.search__product_not_found'|trans,
                    loadingHtml: product_unisearch_loading_html,
```
- ベース実装 pf-eccube3 では、通常の商品一覧とユニサーチ商品一覧の0件時メッセージに、設計と同じ「ご指定の条件に一致する商品が見つかりませんでした。」を直接出力している。

ベース実装 pf-eccube3 商品一覧0件分岐: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/product_list.twig:427-431`
```twig
    {% elseif isSearchLimitOver %}
    <p class="message_ search_results_exceeded"><strong>ご指定の条件に一致する商品が多すぎます。<br>さらに絞り込むための条件を追加してください。</strong><p>
    {% else %}
    <p class="message_"><strong>ご指定の条件に一致する商品が見つかりませんでした。</strong></p>
    {% endif %}
```

ベース実装 pf-eccube3 ユニサーチ0件メッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/product_list_unisearch.twig:436-442`
```twig
            <a style="display:none;" class="page_first unisearch_first page_link_" data-page="1">≪最初</a>
            <span class="page_links_sp"></span>
            <a style="display:none;" class="page_last unisearch_last page_link_">最後≫</a>
        </div>
    </div>
    <p class="message_ no_search_results" style="display:none;"><strong>ご指定の条件に一致する商品が見つかりませんでした。</strong></p>
</div>
```

# 根拠
- 設計：
  - 商品一覧0件時の表示文言: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:1486-1490`
- ec-cube-enterprise：
  - 設計と異なる翻訳値: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1103-1105`
  - 商品一覧の0件時分岐が翻訳キーを表示する: `ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig:872-879`
- ベース実装：
  - 通常商品一覧の0件時文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/product_list.twig:427-431`
  - ユニサーチ商品一覧の0件時文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/product_list_unisearch.twig:436-442`

# 確認メモ
- 確認コマンド: `rg -n "ご指定の条件に一致する商品が見つかりませんでした|抽出件数が0件|商品が見つかりません" hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html`
- 確認コマンド: `rg -n "ご指定の条件に一致する商品が見つかりませんでした|お探しの商品は見つかりませんでした|front\.product\.search__product_not_found|emptyResultMsg|numFound===0" ec-cube-enterprise/src ec-cube-enterprise/app --glob '!var/cache/**'`
- 確認コマンド: `rg -n "ご指定の条件に一致する商品が見つかりませんでした|お探しの商品は見つかりませんでした|front\.product\.search__product_not_found|emptyResultMsg|numFound===0" pf-eccube3 ec-cube --glob '!var/cache/**'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Product/list.twig | sed -n '872,879p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/product_list.twig | sed -n '427,431p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。
- ec-cube-enterprise には設計文言そのものは見つからず、商品一覧表示経路では front.product.search__product_not_found の別文言が使われている。
