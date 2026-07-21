/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録編集
課題カテゴリ：実装漏れ
課題：マイデッキ取得ポップアップに検索結果総数・表示件数・20件ページングが表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. マイデッキを21件以上持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` を表示する
2. 「マイデッキを取得」ボタンを押下してマイデッキ取得ポップアップを開く
3. 検索結果総数、表示件数、ページングリンクが表示され、1ページ最大20件で切り替わるか確認する

# 期待される挙動【必須】
- マイデッキ取得ポップアップに検索結果総数を表示する
- マイデッキ取得ポップアップに現在の表示件数範囲を表示する
- マイデッキ取得ポップアップにページングリンクを表示し、1ページあたり最大20件で動的にページ切り替えする
- フォーマット絞り込み後の件数に合わせて総数・表示範囲・ページングを更新する

# 現在の挙動【必須】
- ec-cube-enterprise のマイデッキ取得ポップアップは `MyDecks` を全件ループしてボタン表示するだけで、検索結果総数、表示件数範囲、ページングリンクがない。テンプレート内JSも `#select_format` の変更時に `.p-hareruya-deckentry-edit__mydeck-item` を show/hide するだけで、20件単位のページ範囲計算、ページボタン生成、総数表示更新を行っていない。Controllerも `findBy()` の結果を件数制限なしで `MyDecks` として渡しているだけで、ページング用のデータを渡していない。

ec-cube-enterprise マイデッキモーダルは全件ループのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:358-421`
```twig
            <div class="p-hareruya-modal__header">
                <div class="p-hareruya-modal__title">
                    <h3 class="c-hareruya-heading--lev3">マイデッキを取得</h3>
                </div>
            </div>
            <div class="p-hareruya-modal__body">
                {% if MyDecks|length > 0 %}
                <div class="p-hareruya-deckentry-edit__mydeck-filter">
                    <div class="p-hareruya-deckentry-edit__mydeck-filter-heading">
                        <label class="p-hareruya-deckentry-edit__mydeck-filter-label" for="select_format">フォーマットで絞り込む</label>
                    </div>
                    <div class="p-hareruya-deckentry-edit__mydeck-filter-select-wrapper">
                        {% set seenFormatIds = [] %}
                        {% set uniqueMyDeckFormats = [] %}
                        {% for MyDeck in MyDecks %}
                            {% if MyDeck.format is not null and MyDeck.format.id not in seenFormatIds %}
                                {% set seenFormatIds = seenFormatIds|merge([MyDeck.format.id]) %}
                                {% set uniqueMyDeckFormats = uniqueMyDeckFormats|merge([MyDeck.format]) %}
                            {% endif %}
                        {% endfor %}
                        <select class="p-hareruya-deckentry-edit__mydeck-filter-select" id="select_format" name="select_format">
                            <option value="0">指定なし</option>
                            {% for MyDeckFormat in uniqueMyDeckFormats %}
                            <option value="{{ MyDeckFormat.id }}">{{ MyDeckFormat.nameJp }}</option>
                            {% endfor %}
                        </select>
                    </div>
                </div>
                <div class="p-hareruya-deckentry-edit__mydeck-list">
                    {% for MyDeck in MyDecks %}
                    <button class="p-hareruya-deckentry-edit__mydeck-item" type="button"
                        data-deck_id="{{ MyDeck.id }}"
                        data-format="{{ MyDeck.format is not null ? MyDeck.format.id : 0 }}"
                        data-main="{{ MyDeck.textMain|e('html_attr') }}"
                        data-side="{{ MyDeck.textSide|e('html_attr') }}">
                        <span class="p-hareruya-deckentry-edit__mydeck-item-img"{% if MyDeck.cardImage is not null %} style="background-image: url({{ image_path(MyDeck.cardImage.url) }})"{% endif %}></span>
                        <span class="p-hareruya-deckentry-edit__mydeck-item-body">
                            {% if MyDeck.format is not null %}
                            <span class="p-hareruya-deckentry-edit__mydeck-tag p-hareruya-deckentry-edit__mydeck-tag--{{ mydeckTagClassMap[MyDeck.format.code]|default('standard') }}">{{ MyDeck.format.nameJp }}</span>
                            {% endif %}
                            <span class="p-hareruya-deckentry-edit__mydeck-item-name">{{ MyDeck.deckName }}</span>
                            <span class="p-hareruya-deckentry-edit__mydeck-item-info">
                                <span class="p-hareruya-deckentry-edit__mydeck-item-info-row">
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-label">プレイヤー</span>
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-value">{{ MyDeck.playerName }}</span>
                                </span>
                                <span class="p-hareruya-deckentry-edit__mydeck-item-info-row">
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-label">作成日</span>
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-value">{{ MyDeck.createDate|date('Y/n/j') }}</span>
                                </span>
                                <span class="p-hareruya-deckentry-edit__mydeck-item-info-row">
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-label">更新日</span>
                                    <span class="p-hareruya-deckentry-edit__mydeck-item-info-value">{{ MyDeck.updateDate|date('Y/n/j') }}</span>
                                </span>
                            </span>
                        </span>
                    </button>
                    {% endfor %}
                </div>
                {% else %}
                <p class="p-hareruya-deckentry-edit__mydeck-empty">マイデッキがありません。</p>
                {% endif %}
            </div>
        </div>
```

ec-cube-enterprise JSはフォーマット絞り込みのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-149`
```javascript
    // マイデッキ選択
    $(document).on('click', '.p-hareruya-deckentry-edit__mydeck-item', function() {
        $deckMain.val($(this).data('main') || '');
        $deckSide.val($(this).data('side') || '');
        persistCurrentFormatDraft();
        $('#deckentry-mydeck [data-js-modal-close]').trigger('click');
    });

    // how-to-import へのスクロール（グローバルJSがアンカー遷移を横取りするため明示的に実装）
    $('a[href="#how-to-import"]').on('click', function(e) {
        e.preventDefault();
        const $target = $('#how-to-import');
        if ($target.length) {
            $('html, body').animate({ scrollTop: $target.offset().top }, 300, function() {
                history.pushState(null, null, '#how-to-import');
            });
        }
    });

    // マイデッキ フォーマット絞り込み
    $('#select_format').on('change', function() {
        const val = $(this).val();
        if (val === '0') {
            $('.p-hareruya-deckentry-edit__mydeck-item').show();
        } else {
            $('.p-hareruya-deckentry-edit__mydeck-item').each(function() {
                $(this).toggle(String($(this).data('format')) === val);
            });
        }
    });
});
```

ec-cube-enterprise ControllerはMyDecksを無制限findByで渡す: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:78-92`
```php
        }

        $MyDecks = $this->deckRepository->findBy(
            ['Player' => $Player, 'DeckType' => $this->entityManager->find(MtbDeckType::class, MtbDeckType::USER_ID)],
            ['createDate' => 'DESC']
        );

        return [
            'EventDetail' => $EventDetail,
            'Player' => $Player,
            'Customer' => $Customer,
            'Formats' => $Formats,
            'deckByFormats' => $deckByFormats,
            'MyDecks' => $MyDecks,
        ];
```
- ベース実装 pf-eccube3 の `deckentry.twig` は `perPage = 20`、`maxPage`、ページングボタン、`myDeck_modal_count` / `myDeck_modal_pagination` の件数表示を持っている。さらに `mydeck_modal_js.twig` で `PER_PAGE = 20`、現在ページ、総件数、表示範囲、ページングボタン生成、前後移動を制御しているため、設計の要求に対応するベース挙動が確認できる。

ベース実装 pf-eccube3 は20件ページングと件数表示を描画: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:220-320`
```twig
<div style="display: none;" id="modal-deck-select" class="ec-alertPopupContent js-ec-alert-popup-content">
    <div class="ec-alertPopupContent__background js-ec-alert-popup-close"></div>
    <div class="deckRegist__importModal ec-alertPopupContent__inner">
        {% set perPage = 20 %}
        <div class="deckRegist__importModal__title">マイデッキを取得</div>
        <div class="pages__user_content_wrapper bases__padding--left24 col-12 col-lg-12">
            {% if myDecks|length > 0 %}
                <div class="bases__font--12">フォーマットで絞り込む</div>
                <select id="select_format" class="components__select bases__padding--horizontal8">
                    <option value="0">指定なし</option>
                    {% for format in deckbuilderFormats %}
                        <option value="{{ format.id }}">{{ format.nameJp }}</option>
                    {% endfor %}
                </select>
                {% set maxPage = (myDecks|length / perPage) | round(0, 'ceil') %}
                <div class="components__pagination bases__margin--top24 d-flex flex-wrap justify-content-center align-items-center">
                    <button class="bases__border--gray components__button bases__font--18 bases__background--white bases__text--white components__pagination_arrow components__pagination_left">
                        <img class="bases__filter--gray no-js-left-arrow" src="{{ path('assets', {path: 'img/sys/button/left-arrow.svg' }) }}" width="17" height="17" draggable="false"/>
                        <div class="bases__text--bold components__button-text"></div>
                    </button>
                    {% for i in 1..maxPage %}
                        <button name="pagination_button" class="bases__border--gray components__button bases__font--16 bases__background--gray bases__text--white">
                            <div class="bases__text--bold components__button-text">{{ i }}</div>
                        </button>
                    {% endfor %}
                    <button class="bases__border--gray components__button bases__font--18 bases__background--white bases__text--white components__pagination_arrow components__pagination_right">
                        <img class="no-js-right-arrow" src="{{ path('assets', {path: 'img/sys/button/right-arrow.svg' }) }}" width="17" height="17" draggable="false"/>
                        <div class="bases__text--bold components__button-text"></div>
                    </button>
                </div>
                <div class="bases__font--12 bases__margin--bottom16">
                    <span id="myDeck_modal_count">{{ myDecks|length }}</span>件中<span id="myDeck_modal_pagination"></span>件を表示
                </div>
                <div class="pages__user_content">
                    {% for myDeck in myDecks %}
                        <a name="myDeckLink" class="components__tile components__tile--height d-flex flex-wrap bases__p--cursor" href="javascript:void(0);"
                            data-deck_id="{{ myDeck.id }}" data-format="{{ myDeck.format.id }}">
                            <div class="col-3 d-none d-lg-block d-none overflow-hidden">
                                <img
                                    class="components__tile_thumbnail bases__imageScale no-js-1229"
                                    {% if myDeck.cardImage and myDeck.cardImage.url %}src="{{ image_path(myDeck.cardImage.url) }}"{% endif %}
                                    draggable="false"
                                />
                            </div>
                            <div class="col-12 col-lg-9 col-md-9 bases__padding12">
                                <div class="d-flex align-items-center">
                                    {% if myDeck.format %}
                                        {% set formatNameEn = myDeck.format.nameEn|lower %}
                                        <div class="components__tag bases__background--{{ formatNameEn }} bases__margin--right8">
                                            <div class="bases__text--white components__tag_label">
                                                {{ myDeck.format.nameJp }}
                                            </div>
                                        </div>
                                    {% endif %}
                                    {% if myDeck.archetype %}
                                        <div class="components__tag bases__background--gray bases__margin--right8">
                                            <div class="bases__text--black components__tag_label">{{ myDeck.archetype.nameJp }}</div>
                                        </div>
                                    {% endif %}
                                </div>
                                <div class="d-flex align-items-end bases__margin--vertical8 bases__text--ellipsis flex-wrap">
                                    <div class="">
                                        <div class="bases__text--bold bases__font--16 bases__text--black mb-0 bases__margin--right8">
                                            {{ myDeck.deckName }}
                                        </div>
                                    </div>
                                    <div class="">
                                        <div class="bases__p--cursor bases__padding--bottom2 bases__font--20 bases__text--red bases__text--bold"></div>
                                    </div>
                                    <div class="w-100"></div>
                                </div>
                                <div class="bases__margin--bottom12 components__tile_info">
                                    <div class="bases__font--12">ユーザー: {{ myDeck.player.nickName }}</div>
                                </div>
                                <div class="d-flex justify-content-start">
                                    <div class="bases__margin--right16 bases__font--12">
                                        作成日: {{ myDeck.createDate|date("Y/m/d") }}
                                    </div>
                                    <div class="bases__margin--right16 bases__font--12">
                                        最終更新日: {{ myDeck.updateDate|date("Y/m/d") }}
                                    </div>
                                </div>
                            </div>
                        </a>
                    {% endfor %}
                </div>
                <div class="components__pagination bases__margin--top24 d-flex flex-wrap justify-content-center align-items-center">
                    <button class="bases__border--gray components__button bases__font--18 bases__background--white bases__text--white components__pagination_arrow components__pagination_left">
                        <img class="bases__filter--gray no-js-left-arrow" src="{{ path('assets', {path: 'img/sys/button/left-arrow.svg' }) }}" width="17" height="17" draggable="false"/>
                        <div class="bases__text--bold components__button-text"></div>
                    </button>
                    {% for i in 1..maxPage %}
                        <button name="pagination_button" class="bases__border--gray components__button bases__font--16 bases__background--gray bases__text--white">
                            <div class="bases__text--bold components__button-text">{{ i }}</div>
                        </button>
                    {% endfor %}
                    <button class="bases__border--gray components__button bases__font--18 bases__background--white bases__text--white components__pagination_arrow components__pagination_right">
                        <img class="no-js-right-arrow" src="{{ path('assets', {path: 'img/sys/button/right-arrow.svg' }) }}" width="17" height="17" draggable="false"/>
                        <div class="bases__text--bold components__button-text"></div>
                    </button>
                </div>
```

ベース実装 pf-eccube3 はmydeck_modal_jsで動的ページングする: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/mydeck_modal_js.twig:1-178`
```javascript
<script type="text/javascript">
window.addEventListener('load', function() {
    const FORMAT_NO_SELECT_ID = 0;  // フォーマット絞り込みなしの状態ID
    const PER_PAGE = 20;            // 1ページあたりのデッキ表示件数
    const BOARD_MAIN_ID = Number("{{ constant('Plugin\\HareruyaEc\\Entity\\MtbBoard::BOARD_ID_MAIN') }}");
    const BOARD_SIDE_ID = Number("{{ constant('Plugin\\HareruyaEc\\Entity\\MtbBoard::BOARD_ID_SIDE') }}");
    const BOARD_COMMAND_ID = Number("{{ constant('Plugin\\HareruyaEc\\Entity\\MtbBoard::BOARD_ID_COMMAND') }}");
    const IMPORT_BOARD_IDS = [
        BOARD_MAIN_ID,
        BOARD_SIDE_ID,
        BOARD_COMMAND_ID,
    ];

    let currentPage = 1;    // 現在開いているページインデックス
    let totalDeckCount = 0; // フィルタ適用後の総デッキ数

    // マイデッキ一覧モーダルを開く
    $('.deckRegistLeft__select').on('click', function() {
        let defaultFormat = $('#deckFormat').val();
        $('#select_format').val(defaultFormat);
        currentPage = 1;
        displayMyDecks();
        createPagination();
        changePagination();
        $('#modal-deck-select').fadeIn();
    });

    // マイデッキ一覧モーダルを閉じる
    $('.close-button').on('click', function() {
        $('#modal-deck-select').fadeOut();
    });
    $(document).on('click', function() {
        if (!$(event.target).is('.deckRegistLeft__select')
            && !$(event.target).parents().is('#modal-deck-select')) {
            $('#modal-deck-select').fadeOut();
        }
    });

    // フォーマット変更時の処理
    $('#select_format').on('change', function() {
        currentPage = 1;
        displayMyDecks();
        createPagination();
        changePagination();
    });

    // ページネーションボタンクリック時の処理
    $(document).on('click', 'button[name="pagination_button"]', function() {
        currentPage = $(this).find('.components__button-text').text();
        displayMyDecks();
        changePagination();        
    });

    // 前のページに移動
    $('.components__pagination_left').on('click', function() {
        if (currentPage <= 1) {
            return;
        }
        currentPage--;
        displayMyDecks();
        changePagination();
    })

    // 次のページに移動
    $('.components__pagination_right').on('click', function() {
        if (currentPage >= Math.ceil(totalDeckCount / PER_PAGE)) {
            return;
        }
        currentPage++;
        displayMyDecks();
        changePagination();
    })

    // デッキ選択時の処理
    $('a[name="myDeckLink"]').on('click', function() {
        let url = "{{ getDeckApiUrl }}" + $(this).data('deck_id');
        let jwtToken = "{{ jwtToken }}"
        // Ajaxでデッキ情報取得APIを実行
        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                'jwt-token': jwtToken
            }
        }).done(function(data) {
            console.log("ajax get deck information success");
            let textList = getDeckCardText(data['cards']);
            let deckMain = textList[BOARD_MAIN_ID] ?? '';
            let deckSide = textList[BOARD_SIDE_ID] ?? '';
            let deckCommand = textList[BOARD_COMMAND_ID] ?? '';
            deckMain = deckCommand !== '' ? deckCommand + "\n" + deckMain : deckMain;
            $('#deckMain').val(deckMain);
            $('#deckSide').val(deckSide);
            $('#modal-deck-select').fadeOut();
        }).fail(function(data) {
            console.log("ajax get deck information fail");
        });
    });

    // マイデッキ一覧の表示を変更
    function displayMyDecks() {
        let selectedFormat = Number($('#select_format').val());
        let displayCount = 0;   // 画面に表示したデッキ数
        let deckIndex = 0;      // フォーマットフィルタ後のデッキインデックス

        $('a[name="myDeckLink"]').each(function() {
            // フォーマット絞り込みありの場合、選択されたフォーマット外のデッキは非表示
            if (selectedFormat != FORMAT_NO_SELECT_ID && selectedFormat != $(this).data('format')) {
                $(this).hide();
                return;
            }
            // 指定ページ範囲のデッキを表示、それ以外を非表示
            if (deckIndex >= (currentPage - 1) * PER_PAGE && deckIndex < currentPage * PER_PAGE) {
                $(this).show();
            } else {
                $(this).hide();
            }
            deckIndex++;
        });

        totalDeckCount = deckIndex;

        let from = totalDeckCount > 0 ? (currentPage - 1) * PER_PAGE + 1 : 0;
        let to = currentPage * PER_PAGE > totalDeckCount ? totalDeckCount : currentPage * PER_PAGE; 
        let range = String(from) + '～' + String(to);
        $('#myDeck_modal_pagination').text(range);
        $('#myDeck_modal_count').text(totalDeckCount);
    }

    // ページネーションボタンを生成
    function createPagination() {
        // 古いページネーションを削除
        removePagination();

        let maxPage = Math.ceil(totalDeckCount / PER_PAGE);
        for (let i = 1; i < maxPage + 1; i++) {
            let newButton = $('<button>', {
                name: 'pagination_button',
                class: 'bases__border--gray components__button bases__font--16 bases__background--gray bases__text--white',
                html: '<div class="bases__text--bold components__button-text">' + i + '</div>'
            })
            $('.components__pagination_right').each(function() {
                $(this).before(newButton.clone());
            });
        }
    }

    // ページネーションボタン削除
    function removePagination() {
        $('button[name="pagination_button"]').remove();
    }

    // ページネーションのデザイン変更
    function changePagination() {
        $('button[name="pagination_button"]').each(function() {
            if (currentPage == $(this).find('.components__button-text').text()) {
                $(this).addClass('bases__background--gray bases__text--white');
                $(this).removeClass('bases__background--gray bases__text--gray');
            } else {
                $(this).addClass('bases__background--gray bases__text--gray');
                $(this).removeClass('bases__background--gray bases__text--white');
            }
        });

        let maxPage = Math.ceil(totalDeckCount / PER_PAGE);
        if (currentPage <= 1) {
            $('.components__pagination_left img').addClass('bases__filter--gray'); 
        }
        if (currentPage > 1) {
            $('.components__pagination_left img').removeClass('bases__filter--gray'); 
        }
        if (currentPage >= maxPage) {
            $('.components__pagination_right img').addClass('bases__filter--gray'); 
        }
        if (currentPage < maxPage) {
            $('.components__pagination_right img').removeClass('bases__filter--gray'); 
        }
    }
```

ベース実装 pf-eccube3 はmydeck_modal_jsを読み込む: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:15-20`
```twig
<script src="{{ url('assets', {path: 'js/vendor/jquery.toast.min.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/deck_regist.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/deck_card.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/ec.js'}) }}" defer></script>
{% include "Block/js/mydeck_modal_js.twig" %}
{% endblock %}
```

ベース実装 pf-eccube3 ControllerもmyDecksを渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:90-99`
```php
        $tokenName = $this->app['config']['token_name'] ?? SecurityEventListener::DEFAULT_TOKEN_NAME;
        $jwtToken = $this->app['request']->cookies->get($cookieName . '_' . $tokenName);

        // デッキビルダーマイデッキ一覧
        $myDecks = $app['hareruya_ec.repository.deck']->findBy(['player' => $player, 'deckTypeId' => MtbDeckType::USER_ID], ['createDate' => 'DESC']);

        // デッキビルダーで選択可能なフォーマット一覧
        $deckbuilderFormats = $app['hareruya_ec.repository.format']->findByDeckbuilderFlg(true);

        // デッキビルダーで選択されたデッキのインポート
```

# 根拠
- 設計：
  - マイデッキ取得ポップアップ表示要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4276-4282`
  - 検索結果総数・表示件数・ページングの画面部品要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4428-4436`
  - マイデッキ一覧モーダルはフォーマット絞り込み・ページング付き: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4568-4572`
- ec-cube-enterprise：
  - モーダルはMyDecks全件のボタン列挙のみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:358-421`
  - JSにページング処理はなくフォーマット絞り込みのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:119-149`
- ベース実装：
  - pf-eccube3はポップアップに件数表示とページングを持つ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:220-320`
  - pf-eccube3はmydeck_modal_jsで20件ごとの動的表示切替を行う: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/mydeck_modal_js.twig:1-178`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-28af8b937cd0'`
- 確認コマンド: `rg -n "マイデッキ取得|検索結果総数|表示件数|ページング|20件|MyDecks|myDecks|deck-modal|deck-select|p-hareruya-deckentry-edit__modal|data-deckentry-mydeck|pagination|pager|paginate|findBy\(" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/mydeck_modal_js.twig`
- 確認コマンド: `rg -n "myDeck_modal|pagination_button|components__pagination|mydeck-filter|p-hareruya-deckentry-edit__mydeck|select_format" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-deck.js ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-mypage.js ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-event.js`
- 確認コマンド: `rg -n "myDeck_modal|pagination_button|components__pagination|select_format|myDeckLink|deckentry|deck-entry|data-deck_id|perPage" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4276,4282p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4428,4436p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4568,4572p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '108,149p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '358,421p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '78,92p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig | sed -n '220,320p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/mydeck_modal_js.twig | sed -n '1,185p'`
- 確認コマンド: `rg -n "mydeck_modal_js|include.*mydeck|Block/js/mydeck" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/*.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/*.twig`
