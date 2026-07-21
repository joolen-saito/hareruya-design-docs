/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録編集
課題カテゴリ：実装漏れ
課題：カード名入力時の部分一致サジェスト候補が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. デッキ登録可能なイベントを持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` を表示する
2. カード名入力欄に既存カード名の一部を入力する
3. 部分一致するカード名の候補が表示され、候補選択でカード名入力欄へ自動入力されるか確認する

# 期待される挙動【必須】
- カード名を入力すると、部分一致するカードがサジェスト表示される
- サジェスト表示されたカードを選択するとカード名入力欄へ自動入力される
- フォーマット別のサジェストファイルを参照して候補を生成する
- サジェストを無視して存在しないカード名を入力することもできる

# 現在の挙動【必須】
- ec-cube-enterprise の `deck_entry_edit.twig` はカード名入力欄と空の `<ul data-deckentry-card-suggest-list>` を描画しているが、候補の `<li data-deckentry-card-suggest-item>` を生成していない。テンプレート内JSも入力値の有無で `aria-hidden` を切り替え、候補クリック時にテキストを入力欄へ入れるだけで、カード名JSON/APIの取得、部分一致検索、候補DOM生成を行っていない。`DeckEntryController::edit()` も `EventDetail`、`Formats`、`MyDecks` 等を渡すだけで、ベース実装の `suggestFiles` 相当を渡していない。

ec-cube-enterprise サジェストJSは表示切替と選択だけで候補生成がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:48-80`
```javascript
            $deckMain.val(current && !current.endsWith('\n') ? current + '\n' + line : current + line);
        } else {
            const current = $deckSide.val();
            $deckSide.val(current && !current.endsWith('\n') ? current + '\n' + line : current + line);
        }
        $('#cardNameInput').val('');
        $('[data-deckentry-card-suggest]').attr('aria-hidden', 'true');
    }

    // 枚数ボタン（固定値）
    $('.p-hareruya-deckentry-edit__num-btn').on('click', function() {
        addCardToDecklist(parseInt($(this).data('value'), 10));
    });

    // カスタム枚数追加
    $('.p-hareruya-deckentry-edit__num-submit').on('click', function() {
        const num = Number($('#cardNumInput').val());
        if (Number.isInteger(num) && num > 0) {
            addCardToDecklist(num);
        }
    });

    // カード名サジェスト
    $('#cardNameInput').on('input', function() {
        $('[data-deckentry-card-suggest]').attr('aria-hidden', $(this).val().trim().length === 0 ? 'true' : 'false');
    });

    $(document).on('click', '[data-deckentry-card-suggest-item]', function() {
        $('#cardNameInput').val($(this).text().trim());
        $('[data-deckentry-card-suggest]').attr('aria-hidden', 'true');
    });

    // MTGアリーナ形式インポート
```

ec-cube-enterprise サジェストリストは空のulのみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:230-240`
```twig
                    </div>
                    <div class="p-hareruya-deckentry-edit__card-select-group">
                        <label class="p-hareruya-deckentry-edit__card-select-subtitle" for="cardNameInput">カード名から登録</label>
                        <div class="p-hareruya-deckentry-edit__card-input-wrapper">
                            <input class="p-hareruya-deckentry-edit__card-input" type="text" id="cardNameInput" name="cardNameInput" placeholder="カード名">
                            <div class="p-hareruya-deckentry-edit__card-suggest" data-deckentry-card-suggest aria-hidden="true">
                                <ul class="p-hareruya-deckentry-edit__card-suggest-list" data-deckentry-card-suggest-list>
                                </ul>
                            </div>
                        </div>
                    </div>
```

ec-cube-enterprise ControllerはsuggestFiles相当を渡していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:60-92`
```php
        $EventDetail = $this->eventDetailRepository->find($eventDetailId);
        if ($EventDetail === null || !$EventDetail->canBeRegisteredDeck()) {
            throw new NotFoundHttpException();
        }

        $Event = $EventDetail->getEvent();
        $Formats = $Event->getFormats();

        $deckByFormats = [];
        foreach ($Formats as $Format) {
            $Deck = $this->deckRepository->findOneBy([
                'Player' => $Player,
                'EventDetail' => $EventDetail,
                'Format' => $Format,
            ]);
            if ($Deck !== null) {
                $deckByFormats[$Format->getId()] = $Deck;
            }
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
- ベース実装 pf-eccube3 は Controller でイベントのフォーマットごとに `/list/cardNameList_{formatCode}.json` を組み立て、`suggestFiles` としてテンプレートへ渡している。テンプレートのカード名入力欄は `data-list-card="{{ suggestFiles }}"` と `.cardNameList` を持ち、読み込まれる `deck_card.js` が入力値に対して完全一致/部分一致を検索し、最大10件の候補 `<li><input class="suggest" ...>` を生成して表示する。

ベース実装 pf-eccube3 Controllerはフォーマット別サジェストJSONを渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:78-84`
```php
        // フォーマット別参照サジェストファイル
        $suggestFiles = [];
        foreach ($eventDetail->getEvent()->getFormats() as $format) {
            $suggestFiles[$format->getId()] = $this->app['config']['user_data_urlpath'] . "/list/cardNameList_{$format->getCode()}.json";
        }
        $suggestFilesText = json_encode($suggestFiles);
```

ベース実装 pf-eccube3 ControllerはsuggestFilesをテンプレートへ渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:124-130`
```php
        return $app->render('Mypage/deckentry.twig', [
            'eventDetail' => $eventDetail,
            'suggestFiles' => $suggestFilesText,
            'decks' => $deckByFormats,
            'myDecks' => $myDecks,
            'player' => $player,
            'selectedFormatId' => $selectedFormat,
```

ベース実装 pf-eccube3 テンプレートはdeck_card.jsとサジェスト用data/listを持つ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:15-22`
```twig
<script src="{{ url('assets', {path: 'js/vendor/jquery.toast.min.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/deck_regist.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/deck_card.js'}) }}" defer></script>
<script src="{{ url('assets', {path: 'js/ec.js'}) }}" defer></script>
{% include "Block/js/mydeck_modal_js.twig" %}
{% endblock %}

{% block main %}
```

ベース実装 pf-eccube3 カード名入力欄はsuggestFilesと候補ulを持つ: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:84-92`
```twig
                    </div>

                    <div class="process process1">
                        <p>カード名を入力して下さい</p>
                        <div class="inputOuter">
                            <input type="text" class="cardNameInput cardNameBox" data-list-card="{{ suggestFiles }}">
                            <ul class="cardNameList"></ul>
                            <span id="cardErrorEmpty" class="cardNameError errorText" hidden="hidden">
                                カード名が入力されていません。
```

ベース実装 pf-eccube3 deck_card.jsは部分一致候補を生成して表示する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_card.js:190-236`
```javascript
    function createCardNameList(cardNameBox, suggestList)
    {
        //プルダウンリストを削除
        suggestList.empty();
        var suggestType = $('#suggest_type').val();
        var inputText = cardNameBox.val();
        inputText = inputText.replace('+', '\\+');
        //検索用正規表現を制作
        var pattern = "^" + inputText + "$";
        var searchCtext = new RegExp(pattern,"i");
        var searchText = new RegExp(inputText,"i");

        if (suggestType === 'card' || suggestType  == undefined || cardNameBox.attr('class') === 'cardNameBox cardNameBoxSp') {
            targetList = globalList['card'];
        } else if (suggestType === 'all') {
            targetList = globalList['card'];
            targetList = targetList.concat(globalList['supply'][$('#locale').val()]);
        } else {
            targetList = globalList[suggestType][$('#locale').val()];
        }

        //全カードリストから最大10件まで検出
        for (var i=0,j=0; i < targetList.length ;i++) {
            var cardName = targetList[i];
            if (cardName == undefined) {
                continue;
            }
            var escapedCardName = escapeText(cardName);
            //検索用正規表現とマッチ
            if (cardName.match(searchCtext)) {
                suggestList.prepend('<li class="pMatch" data-name="' + escapedCardName + '"><input type="button" class="suggest" value="' + escapedCardName+ '" title="' + escapedCardName + '"></li>');
                var checkflag = 1;
            } else if (j >= 10) {
                if (checkflag == 1) break;
            } else if (cardName.match(searchText)) {
                //DOM要素を構築
                suggestList.append('<li data-name="' + escapedCardName + '"><input type="button" class="suggest" value="' + escapedCardName + '" title="' + escapedCardName + '"></li>');

                j++;
            }
        }

        //inputに何か文字が入っているならプルダウンリストを表示
        if (cardNameBox.val()) {
            suggestList.show();
        } else {
            suggestList.hide();
```

# 根拠
- 設計：
  - カード名入力で部分一致サジェストを表示し選択自動入力する要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4280-4283`
  - カード名サジェストは本機能の入力補助UI: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4550-4553`
  - JS挙動でフォーマット別サジェストファイル参照を要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4570-4577`
- ec-cube-enterprise：
  - サジェスト候補生成処理がなく表示状態だけを切り替える: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:48-80`
  - 候補リストは空のul: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:230-240`
- ベース実装：
  - pf-eccube3はフォーマット別サジェストファイルを生成して渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:78-84`
  - pf-eccube3のdeck_card.jsは部分一致候補をDOM生成する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_card.js:190-236`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-576695c2c401'`
- 確認コマンド: `rg -n "カード名|サジェスト|部分一致|suggest|suggestFiles|card-suggest|deckentry-card-suggest|getSuggest|suggestFilesText|CardSuggest|フォーマット別" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-deck.js ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-event.js pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/deck_entry_js.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_card.js`
- 確認コマンド: `rg --files pf-eccube3 ec-cube-enterprise | rg -i 'suggest|deck.*js|card.*js|deckentry|hareruya-deck'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4280,4283p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4550,4553p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4570,4577p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '48,80p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '230,240p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '60,92p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '74,84p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '124,130p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig | sed -n '15,22p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig | sed -n '84,92p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/deck_card.js | sed -n '190,236p'`
