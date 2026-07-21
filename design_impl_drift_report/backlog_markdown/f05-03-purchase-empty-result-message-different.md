/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：ネット買取商品一覧
課題カテゴリ：実装漏れ
課題：検索結果0件時に買取最低保証とヘルプへの案内が表示されない
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. http://localhost:8080/ja/purchase/search?purchaseFlg=1&product=<該当しない検索語> を表示し、検索結果0件の状態にする
2. 一覧本文に表示される0件メッセージを確認する
3. 「お探しのカードは見つかりませんでした」と買取最低保証・ヘルプへの案内が含まれるか確認する

# 期待される挙動【必須】
- 検索結果が0件のとき、一覧本文に「お探しのカードは見つかりませんでした」を表示する
- 同じ0件案内内に、買取最低保証の説明を表示する
- 同じ0件案内内に、ヘルプへの案内リンクを表示する
- 0件時はページ全体をHTTP404の一覧として扱う

# 現在の挙動【必須】
- ec-cube-enterprise の買取一覧は、UniSearch クライアント設定 `emptyResultMsg` に共通キー `front.product.search__product_not_found` を渡している。この日本語文言は「お探しの商品は見つかりませんでした」の一文のみで、設計の「カード」文言、買取最低保証の説明、ヘルプリンクを含まない。0件時の JS 分岐も `.no_search_results` を表示するだけで、買取専用の補足文やリンクを組み立てていない。

ec-cube-enterprise 買取一覧の0件文言設定: `ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/search.twig:48-57`
```twig
            countTpl: 'front.product_list.product_count'|trans({ '%count%': '__COUNT__' }),
            loadFailedMsg: purchase_list_unisearch_load_failed_message|default('Failed to load.'),
            pagerPrev: 'common.prev'|trans,
            pagerNext: 'common.next'|trans,
            pagerNavAria: 'common.pager.nav_aria'|trans,
            pagerPrevAria: 'common.pager.prev_aria'|trans,
            pagerNextAria: 'common.pager.next_aria'|trans,
            pagerPageAria: 'common.pager.page_aria'|trans({'%page%': '__PAGE__'}),
            emptyResultMsg: 'front.product.search__product_not_found'|trans,
            loadingHtml: purchase_unisearch_loading_html,
```

ec-cube-enterprise 共通0件文言: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1103-1105`
```yaml
front.product.search__category_not_found: ご指定のカテゴリは存在しません
front.product.search__product_not_found: お探しの商品は見つかりませんでした
front.product.unisearch_load_failed: 読み込みに失敗しました。
```

ec-cube-enterprise UniSearch 0件分岐: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_js.twig:741-749`
```twig
                // 検索件数が0件の場合
                if (data.response.numFound === 0) {
                    $('.message_' + '.no_search_results').css('display', 'block');
                    $('.result_second').css('display', 'none');
                    $('.autopagerize_page_element').css('display', 'none');
                    hideSearchForm();

                    return;
                }
```
- ベース実装 pf-eccube3 では、買取一覧の0件時に「お探しのカードは見つかりませんでした。」を表示し、続けて買取最低保証の説明と `/ja/user_data/help_buying#block4` へのヘルプリンクを表示している。

ベース実装 pf-eccube3 買取一覧0件メッセージ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:342-350`
```twig
    {% elseif isSearchLimitOver %}
    <p class="message_ search_results_exceeded"><strong>ご指定の条件に一致する商品が多すぎます。<br>さらに絞り込むための条件を追加してください。</strong><p>
    {% else %}
    <p class="message_"><strong>お探しのカードは見つかりませんでした。</strong><br><br>
現在、買取価格が30円未満のカードについては掲載しておりませんが、「買取最低保証」として価格が付く場合がございます。<br>
詳しくは下記のページをご覧ください<br>
    <a href="/ja/user_data/help_buying#block4" target="_blank" style="text-decoration:underline;">ヘルプ　4.まとめて買取について</a>
    </p>
    {% endif %}
```

# 根拠
- 設計：
  - 0件時は買取最低保証・ヘルプ案内を含む: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2013`
  - 0件時の扱い: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:2020`
- ec-cube-enterprise：
  - 0件文言は共通の「商品」文言: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1103-1105`
  - 0件時は no_search_results 表示のみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_js.twig:741-749`
- ベース実装：
  - pf-eccube3では買取最低保証とヘルプ案内を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig:342-350`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-11dc3c4d1823'`
- 確認コマンド: `rg -n "お探しのカード|お探しの商品|最低保証|ヘルプ|見つかりません|search__product_not_found|showEmptyResult|0件|HTTP404" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube/Resource/template/default ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '2011,2021p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Purchase/search.twig | sed -n '48,60p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '1100,1106p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/product_unisearch_js.twig | sed -n '735,755p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/product_list.twig | sed -n '340,351p'`
