/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録編集
課題カテゴリ：実装漏れ
課題：大会デッキ登録編集画面の大会名にフォーマットが表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. デッキ登録可能なイベントを持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` を表示する
2. 大会情報エリアの大会名を確認する
3. 大会名の後ろに括弧付きでフォーマット名が表示されるか確認する

# 期待される挙動【必須】
- 大会デッキ登録編集画面の No.4「大会名」はラベルとして表示する
- 大会名の `()` 内に対象イベントのフォーマットを表示する
- 複数フォーマットがある場合はベース実装と同様にフォーマット名を `/` 区切りで併記する

# 現在の挙動【必須】
- ec-cube-enterprise の `deck_entry_edit.twig` は大会名を `{{ EventDetail.event.nameJp }}` だけで描画しており、`Formats` または `EventDetail.event.formats` を括弧内に連結する処理がない。`DeckEntryController::edit()` は `$Formats = $Event->getFormats()` を取得して view に渡しているためフォーマット情報自体は利用可能だが、タイトル表示には使われていない。

ec-cube-enterprise デッキ編集画面の大会名はイベント名のみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:164-190`
```twig
            <div class="p-hareruya-deckentry-edit__event-section">
                <h2 class="p-hareruya-deckentry-edit__event-title">{{ EventDetail.event.nameJp }}</h2>
                <dl class="p-hareruya-deckentry-edit__event-detail">
                    <div class="p-hareruya-deckentry-edit__event-row">
                        <dt class="p-hareruya-deckentry-edit__event-label">開催日時：</dt>
                        <dd class="p-hareruya-deckentry-edit__event-value">{{ EventDetail.startDate|date('Y/n/j H:i') }}</dd>
                    </div>
                    <div class="p-hareruya-deckentry-edit__event-row">
                        <dt class="p-hareruya-deckentry-edit__event-label">お名前：</dt>
                        <dd class="p-hareruya-deckentry-edit__event-value">{{ Player.lastNameEn }} {{ Player.firstNameEn }}</dd>
                    </div>
                </dl>
            </div>

            {% set formatLabelClassMap = {'St': 'st', 'Mo': 'mo', 'Le': 'le', 'Vi': 'vi', 'Co': 'co', 'Pa': 'pa', 'SP': 'sp', 'Pi': 'pi', 'Pm': 'pm', 'Dr': 'li', 'Se': 'li'} %}

            <form class="p-hareruya-deckentry-edit__form" method="post" id="decklist_submit" action="{{ url('mypage_deckentry_update', { eventDetailId: EventDetail.id }) }}">
                <input type="hidden" name="_token" value="{{ csrf_token('_token') }}">

                {% set selectableFormats = [] %}
                {% for Format in Formats %}
                    {% if Format.rankingFlg or Format.otherMetaFlg %}
                        {% set selectableFormats = selectableFormats|merge([Format]) %}
                    {% endif %}
                {% endfor %}

                {% if selectableFormats|length > 1 %}
```

ec-cube-enterprise ControllerはFormatsを取得してviewへ渡している: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:60-92`
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
- ベース実装 pf-eccube3 の `Mypage/deckentry.twig` では、大会名の直後に `({% for format in eventDetail.event.formats %}...{{ format.nameJp }}{% endfor %})` を描画している。enterprise はこのフォーマット併記を移植していないため、設計の「()内にフォーマットを表示」と一致しない。

ベース実装 pf-eccube3 は大会名の括弧内にフォーマット名を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:36-46`
```twig
                <div class="ripple"></div>
                <div class="square"></div>
                <div class="triangle"></div>
            </div>
            <h2 class="tournamentName">{{ eventDetail.event.nameJp }}({% for format in eventDetail.event.formats %}{{ loop.index == 1 ? '' : '/' }}{{ format.nameJp }}{% endfor %})</h2>
            <p class="tournamentDate" style="padding-bottom: 20px;">開催日時 : {{ eventDetail.startDate|date('Y年n月j日 H時i分') }}</p>
            <p class="tournamentDciNumber">DCIナンバー : {{ player.dciNo }}</p>
            <p class="tournamentDciName">お名前 : {{ player.lastNameEn }} {{ player.firstNameEn }}</p>
            <form method="post" id="decklist_submit" action="{{ url('deckentry_update', { 'eventDetailId': eventDetail.eventDetailId }) }}">
                {% set heading_count = 1 %}
                {% if 0 < eventDetail.event.constructDeckCount %}
```

ベース実装 pf-eccube3 ControllerはeventDetailをテンプレートへ渡している: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:124-139`
```php
        return $app->render('Mypage/deckentry.twig', [
            'eventDetail' => $eventDetail,
            'suggestFiles' => $suggestFilesText,
            'decks' => $deckByFormats,
            'myDecks' => $myDecks,
            'player' => $player,
            'selectedFormatId' => $selectedFormat,
            'deckbuilderFormats' => $deckbuilderFormats,
            'textMain' => $textMain,
            'textSide' => $textSide,
            'errorMain' => $errorMain,
            'errorSide' => $errorSide,
            'token' => $this->app['form.csrf_provider']->getToken(Constant::TOKEN_NAME)->getValue(),
            'jwtToken' => $jwtToken,
            'getDeckApiUrl' => $getDeckApiUrl,
        ]);
```

# 根拠
- 設計：
  - 画面部品 No.4 大会名は括弧内にフォーマットを表示する要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4298-4310`
- ec-cube-enterprise：
  - 大会名は EventDetail.event.nameJp のみで、フォーマット併記がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:164-190`
  - ControllerはFormatsを渡しているが、タイトル用の併記文字列は作っていない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:60-92`
- ベース実装：
  - pf-eccube3は大会名の直後にフォーマット名を括弧付きで表示している: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:36-46`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-e12375b047e8'`
- 確認コマンド: `rg -n "item-sheet-13-4|大会名|フォーマットを表示|EventDetail.event.nameJp|eventDetail.event.nameJp|event.formats|Formats|formats" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php`
- 確認コマンド: `rg -n "item-sheet-13-4|大会名|\(\)内にフォーマットを表示" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "p-hareruya-deckentry-edit__event-title|EventDetail\.event\.nameJp|Formats|Format\.nameJp|Format\.name" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php`
- 確認コマンド: `rg -n "tournamentName|eventDetail\.event\.formats|format\.nameJp|deckentry.twig" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4298,4310p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '160,190p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '60,92p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig | sed -n '36,46p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '120,140p'`
