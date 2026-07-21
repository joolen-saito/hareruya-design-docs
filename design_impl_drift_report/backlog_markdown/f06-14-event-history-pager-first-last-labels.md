/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：マイイベント・デッキ登録
課題カテゴリ：実装違い
課題：ページネーションの先頭・末尾リンクが「＜最初」「最後＞」ではなくページ番号と省略記号で表示される
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 予約済みイベントまたはデッキ登録済みイベントがページ分割される件数の会員で `http://localhost:8080/ja/mypage/event_history` を表示する
2. 現在ページの前後4ページ範囲に収まらない先頭方向・末尾方向のページがある状態にする
3. ページネーションの端に「＜最初」「最後＞」の文言リンクが表示されるか、先頭/末尾のページ番号と「…」が表示されるか確認する

# 期待される挙動【必須】
- 表示しきれないページが存在する場合、先頭方向には「＜最初」のリンクを表示する
- 表示しきれないページが存在する場合、末尾方向には「最後＞」のリンクを表示する
- ページネーションはマイイベント・デッキ登録画面の(9)(10)(11)として表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `EventHistoryController` は `paginate()` した結果を `event_history.twig` に渡し、画面上下で共有 `pager.twig` を include している。共有 `pager.twig` は先頭方向で `pages.first` の数字リンクを出し、範囲外は「…」を表示する。末尾方向も `pages.last` の数字リンクと「…」であり、「＜最初」「最後＞」という文言リンクは出力しない。

ec-cube-enterprise F06-14はpaginationを生成: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/EventHistoryController.php:92-103`
```php
        if ($allEventDetailIds === []) {
            $EventDetails = [];
        } else {
            $EventDetails = $this->eventDetailRepository->findBy(['id' => $allEventDetailIds]);
            usort($EventDetails, static fn (DtbEventDetail $a, DtbEventDetail $b) => $b->getStartDate() <=> $a->getStartDate());
        }

        $pagination = $paginator->paginate($EventDetails, $pageNo, $dispNumber);

        return [
            'Customer' => $Customer,
            'pagination' => $pagination,
```

ec-cube-enterprise F06-14画面は共有pagerを上下にinclude: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig:55-61`
```twig
                        {{ 'front.mypage.history_count'|trans }}&nbsp;<span>{{ 'front.mypage.history_count_suffix'|trans({'%count%': pagination.totalItemCount}) }}</span>
                    </p>
                </div>
                <div class="p-hareruya-toolbar__pagination">
                    <div class="p-hareruya-pagination">
                        {% include 'pager.twig' with { pages: pagination.paginationData } %}
                    </div>
```

ec-cube-enterprise 下部も共有pagerをinclude: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig:155-158`
```twig
            <div class="p-hareruya-history-list__pagination-wrap--bottom">
                <div class="p-hareruya-pagination">
                    {% include 'pager.twig' with { pages: pagination.paginationData } %}
                </div>
```

ec-cube-enterprise pagerは先頭/末尾を数字リンクと省略記号で表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/pager.twig:21-60`
```twig
        {# 1ページリンクが表示されない場合、「...」を表示 #}
        {% if pages.firstPageInRange != 1 %}
        <li class="p-hareruya-pagination__item">
            <a class="p-hareruya-pagination__link" href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.first})) }}" data-page="{{ pages.first }}" aria-label="{{ 'common.pager.page_aria'|trans({'%page%': pages.first}) }}"><span class="p-hareruya-pagination__number">{{ pages.first }}</span></a>
        </li>
        {% endif %}

        {# 省略記号 #}
        {% if pages.firstPageInRange > 2 %}
        <li class="p-hareruya-pagination__item p-hareruya-pagination__item--ellipsis" aria-hidden="true">
            <span class="p-hareruya-pagination__ellipsis">…</span>
        </li>
        {% endif %}

        {# ページ範囲 #}
        {% for page in pages.pagesInRange %}
            {% if page == pages.current %}
            <li class="p-hareruya-pagination__item p-hareruya-pagination__item--current">
                <span class="p-hareruya-pagination__number" aria-current="page">{{ page }}</span>
            </li>
            {% else %}
            <li class="p-hareruya-pagination__item">
                <a class="p-hareruya-pagination__link" href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': page})) }}" data-page="{{ page }}" aria-label="{{ 'common.pager.page_aria'|trans({'%page%': page}) }}"><span class="p-hareruya-pagination__number">{{ page }}</span></a>
            </li>
            {% endif %}
        {% endfor %}

        {# 最終ページリンクが表示されない場合、「...」を表示 #}
        {% if pages.last > pages.lastPageInRange + 1 %}
        <li class="p-hareruya-pagination__item p-hareruya-pagination__item--ellipsis" aria-hidden="true">
            <span class="p-hareruya-pagination__ellipsis">…</span>
        </li>
        {% endif %}

        {# 末尾ページ #}
        {% if pages.last != pages.lastPageInRange %}
        <li class="p-hareruya-pagination__item">
            <a class="p-hareruya-pagination__link" href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.last})) }}" data-page="{{ pages.last }}" aria-label="{{ 'common.pager.page_aria'|trans({'%page%': pages.last}) }}"><span class="p-hareruya-pagination__number">{{ pages.last }}</span></a>
        </li>
        {% endif %}
```
- ベース実装 pf-eccube3 の F06-14 `event_history.twig` は `entries` を全件ループするだけでページャを呼び出していない。一方、旧共通 `pagination.twig` には先頭・末尾ジャンプとして「最初へ」「最後へ」の文言リンクが存在する。設計の「＜最初」「最後＞」は旧共通部品の文言リンク系統に近いが、enterprise の F06-14 では数字リンク＋省略記号の共有pagerになっている。

ベース実装 pf-eccube3 F06-14はentries全件を渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:22-30`
```php
    public function eventHistory(Application $app)
    {
        $player = $app['hareruya_ec.repository.player']->findOneByCustomerId($app->user()['id']);
        //ユーザのイベント申し込みリスト取得
        $entries = $app['hareruya_ec.repository.event_entry']->getEntriesByPlayerId($player['playerid']);

        return $app->render('Mypage/event_history.twig', [
            'entries' => $entries,
        ]);
```

ベース実装 pf-eccube3 F06-14画面はentriesをループしpagerを呼ばない: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig:12-20`
```twig
            {% if entries %}
                <ul class="event-history-list-wrapper">
                    <li class="event-history-list event-history-list-title pc flex">
                        <div class="event-history-list__item event-history-list__item--th event-history-list__item-name">イベント名</div>
                        <div class="event-history-list__item event-history-list__item--th event-history-list__item-format">フォーマット</div>
                        <div class="event-history-list__item event-history-list__item--th event-history-list__item-date">開催日時</div>
                        <div class="event-history-list__item event-history-list__item--th event-history-list__item-status">ステータス</div>
                    </li>
                    {% for entry in entries %}
```

ベース実装 pf-eccube3 共通paginationは最初へ/最後へ文言リンクを持つ: `pf-eccube3/src/Eccube/Resource/template/default/pagination.twig:32-78`
```twig
        {% if pageinrange and pages.firstPageInRange != 1 %}
            {# 最初へリンクを表示 #}
            <li class="pagenation__item-first">
                <a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.first})) }}"
                   aria-label="First"><span aria-hidden="true">最初へ</span></a>
            </li>
        {% endif %}

        {% if pages.previous is defined %}
            <li class="pagenation__item-previous">
                <a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.previous})) }}"
                   aria-label="Previous"><span aria-hidden="true">前へ</span></a>
            </li>
        {% endif %}

        {% if pageinrange and pages.firstPageInRange != 1 %}
            {# 1ページリンクが表示されない場合、「...」を表示 #}
            <li>...</li>
        {% endif %}

        {% for page in pages.pagesInRange %}
            {% if page == pages.current %}
                <li class="pagenation__item active"><a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': page})) }}"> {{ page }} </a></li>
            {% else %}
                <li class="pagenation__item"><a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': page})) }}"> {{ page }} </a></li>
            {% endif %}
        {% endfor %}

        {% if pageinrange and pages.last != pages.lastPageInRange %}
            {# 最終ページリンクが表示されない場合、「...」を表示 #}
            <li>...</li>
        {% endif %}

        {% if pages.next is defined %}
            <li class="pagenation__item-next">
                <a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.next})) }}"
                   aria-label="Next"><span aria-hidden="true">次へ</span></a>
            </li>
        {% endif %}

        {% if pageinrange and pages.last != pages.lastPageInRange %}
            {# 最後へリンクを表示 #}
            <li class="pagenation__item-last">
                <a href="{{ path(app.request.attributes.get('_route'), app.request.query.all|merge({'pageno': pages.last})) }}"
                   aria-label="Last"><span aria-hidden="true">最後へ</span></a>
            </li>
        {% endif %}
```

# 根拠
- 設計：
  - ページネーション表示と先頭/末尾文言を指定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4016-4034`
- ec-cube-enterprise：
  - F06-14で共有pagerをinclude: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig:55-61`
  - 共有pagerは数字リンクと省略記号を出す: `ec-cube-enterprise/src/Eccube/Resource/template/default/pager.twig:21-60`
- ベース実装：
  - pf-eccube3のF06-14はページャ未使用でentries全件表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig:12-20`
  - pf-eccube3共通paginationは最初へ/最後へ文言リンクを持つ: `pf-eccube3/src/Eccube/Resource/template/default/pagination.twig:32-78`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json#f06-14_0306_sheet-12_sheet-conformance-75c8cce1728d'`
- 確認コマンド: `rg -n "＜最初|最後＞|最初へ|最後へ|firstPageInRange|lastPageInRange|pages\.first|pages\.last|include 'pager\.twig'|paginationData|paginate\(" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/EventHistoryController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig ec-cube-enterprise/src/Eccube/Resource/template/default/pager.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig pf-eccube3/src/Eccube/Resource/template/default/pagination.twig`
- 確認コマンド: `rg --files pf-eccube3 | rg 'pager|pagination|event_history\.twig$'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4016,4034p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/EventHistoryController.php | sed -n '85,104p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig | sed -n '55,61p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig | sed -n '155,158p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/pager.twig | sed -n '1,70p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php | sed -n '20,31p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig | sed -n '1,75p'`
- 確認コマンド: `nl -ba pf-eccube3/src/Eccube/Resource/template/default/pagination.twig | sed -n '1,120p'`
