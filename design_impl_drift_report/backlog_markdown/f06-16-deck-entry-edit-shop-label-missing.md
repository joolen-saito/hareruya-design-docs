/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録編集
課題カテゴリ：実装漏れ
課題：大会デッキ登録編集画面に開催店舗が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. デッキ登録可能なイベントを持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` を表示する
2. 大会情報エリアの大会名、開催日時、プレイヤー名付近を確認する
3. 開催店舗のラベルと店舗名が表示されるか確認する

# 期待される挙動【必須】
- 大会デッキ登録編集画面に No.5「開催店舗」をラベルとして表示する
- 開催店舗には対象イベントの店舗名を表示する
- 本項目はカスタマイズ対応・新規追加として表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `deck_entry_edit.twig` は大会情報エリアで大会名、開催日時、お名前だけを描画しており、開催店舗の `<dt>` / `<dd>` が存在しない。`DeckEntryController::edit()` も `EventDetail`、`Player`、`Customer`、`Formats`、`deckByFormats`、`MyDecks` を返すだけで、店舗名表示用の `shopName` などを view へ渡していない。一方、同じ enterprise のイベント詳細画面 `Event/detail.twig` では `Event.BaseInfo` から `shopName` を作って店舗名を表示しているため、店舗名の取得経路自体はあるがデッキ編集画面には移植されていない。

ec-cube-enterprise デッキ編集画面の大会情報は開催日時とお名前のみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:164-176`
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
```

ec-cube-enterprise デッキ編集Controllerは店舗名view変数を返さない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:60-92`
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

ec-cube-enterprise イベント詳細画面には店舗名表示経路がある: `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:16-23`
```twig
{% set Shop = Event.BaseInfo %}
{% set Rel = Event.Rel %}
{% set eventName = isEn and Event.nameEn ? Event.nameEn : Event.nameJp %}
{% set bannerUrl = isEn and Event.bannerEnUrl ? Event.bannerEnUrl : Event.bannerUrl %}
{% set shopName = Shop ? (isEn and Shop.shopNameEng ? Shop.shopNameEng : Shop.shopName) : '' %}
{% set prize = isEn and Detail.prizeEn ? Detail.prizeEn : Detail.prizeJp %}
{% set _event_shop_str = shopName ? '（' ~ shopName ~ '）' : '' %}
{% set subtitle = 'front.seo.event_detail.subtitle'|trans({'%name%': eventName, '%shop%': _event_shop_str, '%date%': Detail.startDate|date('Y/n/j H:i')}) %}
```

ec-cube-enterprise イベント詳細画面はshopNameを表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:92-98`
```twig
            <dl class="p-hareruya-event-detail__info">
                {% if shopName %}
                    <div class="p-hareruya-event-detail__info-row">
                        <dt class="p-hareruya-event-detail__info-label">{{ 'front.event.detail.info.shop'|trans }}</dt>
                        <dd class="p-hareruya-event-detail__info-value">{{ shopName }}</dd>
                    </div>
                {% endif %}
```
- ベース実装 pf-eccube3 の大会デッキ登録編集画面も、大会名、開催日時、DCIナンバー、お名前を表示するだけで開催店舗は表示していない。設計HTMLは「現行機能をベースに以下カスタマイズを行う」としたうえで「開催店舗を表示する」を追加しているため、これはベース踏襲ではなく追加カスタマイズ要求の未実装として確認した。

ベース実装 pf-eccube3 デッキ編集画面は開催店舗を表示しない: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:40-44`
```twig
            <h2 class="tournamentName">{{ eventDetail.event.nameJp }}({% for format in eventDetail.event.formats %}{{ loop.index == 1 ? '' : '/' }}{{ format.nameJp }}{% endfor %})</h2>
            <p class="tournamentDate" style="padding-bottom: 20px;">開催日時 : {{ eventDetail.startDate|date('Y年n月j日 H時i分') }}</p>
            <p class="tournamentDciNumber">DCIナンバー : {{ player.dciNo }}</p>
            <p class="tournamentDciName">お名前 : {{ player.lastNameEn }} {{ player.firstNameEn }}</p>
            <form method="post" id="decklist_submit" action="{{ url('deckentry_update', { 'eventDetailId': eventDetail.eventDetailId }) }}">
```

ベース実装 pf-eccube3 ControllerはeventDetail等を渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:124-139`
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
  - カスタマイズ説明で開催店舗表示を追加要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4262-4270`
  - 画面部品 No.5 開催店舗: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4304-4309`
- ec-cube-enterprise：
  - デッキ編集画面の大会情報には開催店舗がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig:164-176`
  - イベント詳細画面ではEvent.BaseInfoから店舗名を表示できる: `ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig:16-23`
- ベース実装：
  - pf-eccube3のデッキ編集画面も開催店舗表示なし: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig:40-44`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-16_0306_sheet-13_sheet.json#f06-16_0306_sheet-13_sheet-conformance-6b562a2a4205'`
- 確認コマンド: `rg -n "開催店舗|shopName|BaseInfo|shopNameEng|p-hareruya-deckentry-edit__event-section|EventDetail.event.nameJp|開催日時：|お名前：" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php`
- 確認コマンド: `rg -n "item-sheet-13-5|開催店舗を表示する|No\.5 開催店舗|開催店舗" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4262,4272p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4304,4309p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_edit.twig | sed -n '160,176p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '55,92p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig | sed -n '16,23p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig | sed -n '91,98p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry.twig | sed -n '34,45p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '120,160p'`
