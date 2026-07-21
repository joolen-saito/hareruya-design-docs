/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：大会デッキ登録確認～完了
課題カテゴリ：実装漏れ
課題：デッキ登録完了画面に開催店舗が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. デッキ登録可能なイベントを持つ会員で `http://localhost:8080/ja/mypage/deckentry/{eventDetailId}/edit` からデッキを提出する
2. 遷移先のデッキ登録完了画面 `http://localhost:8080/ja/mypage/deckentry/{deckId}/check` を表示する
3. 大会名・お名前・フォーマット付近に開催店舗のラベルと店舗名が表示されるか確認する

# 期待される挙動【必須】
- デッキ登録完了画面に No.4「開催店舗」をラベルとして表示する
- 開催店舗には対象イベントの店舗名を表示する
- 本項目はカスタマイズ対応として、DCIナンバー削除とあわせて追加表示する

# 現在の挙動【必須】
- ec-cube-enterprise の `deck_entry_check.twig` はデッキ登録完了画面で大会名とお名前を表示するだけで、開催店舗の `<dt>` / `<dd>` が存在しない。`DeckEntryController::check()` も `Deck`、`EventDetail`、`Player`、`Customer`、カードチェック結果を返すだけで、店舗名表示用の `shopName` などを view へ渡していない。一方、同じ enterprise のイベント詳細画面 `Event/detail.twig` では `Event.BaseInfo` から `shopName` を作って店舗名を表示しているため、店舗名取得経路自体はあるが完了画面には移植されていない。

ec-cube-enterprise 完了画面のイベント情報は大会名とお名前のみ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:14-35`
```twig
        <h1 class="c-hareruya-heading--lev1">デッキ登録完了</h1>
        <div class="p-hareruya-deckentry-check__header">
            <p class="p-hareruya-deckentry-check__user-name">{{ Customer.name01 }} {{ Customer.name02 }} 様</p>
            <div class="p-hareruya-deckentry-check__event-info">
                <h2 class="p-hareruya-deckentry-check__event-title">{{ EventDetail.event.nameJp }}</h2>
                <dl class="p-hareruya-deckentry-check__event-detail">
                    <div class="p-hareruya-deckentry-check__event-row">
                        <dt class="p-hareruya-deckentry-check__event-label">お名前：</dt>
                        <dd class="p-hareruya-deckentry-check__event-value">{{ Deck.playerName }}</dd>
                    </div>
                </dl>
            </div>
        </div>
        <div class="p-hareruya-deckentry-check__message">
            <p class="p-hareruya-deckentry-check__message-text">以下の内容でデッキ登録を行いました。<br>内容に間違いがないことをご確認ください。</p>
        </div>
        <div class="p-hareruya-deckentry-check__result-card">
            {% if Deck.format %}
            <div class="p-hareruya-deckentry-check__format">
                <h3 class="p-hareruya-deckentry-check__format-title">フォーマット</h3>
                <p class="p-hareruya-deckentry-check__format-value">{{ Deck.format.nameJp }}</p>
            </div>
```

ec-cube-enterprise check Controllerは店舗名view変数を返さない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:158-194`
```php
     */
    #[Route(path: '/deckentry/{deckId}/check', name: 'mypage_deckentry_check', requirements: ['deckId' => '\d+'], methods: ['GET'])]
    #[Template(template: 'Mypage/deck_entry_check.twig')]
    public function check(int $deckId): array|Response
    {
        /** @var Customer $Customer */
        $Customer = $this->getUser();
        $Player = $Customer->getPlayer();
        if ($Player === null) {
            throw new NotFoundHttpException();
        }

        $Deck = $this->deckRepository->find($deckId);
        if ($Deck === null || $Deck->getPlayer()?->getId() !== $Player->getId()) {
            throw new NotFoundHttpException();
        }

        $EventDetail = $Deck->getEventDetail();
        if ($EventDetail === null) {
            throw new NotFoundHttpException();
        }

        $checkData = $this->deckValidationService->getCheckData($Deck);

        return [
            'Deck' => $Deck,
            'EventDetail' => $EventDetail,
            'Player' => $Player,
            'Customer' => $Customer,
            'mainErrors' => $checkData['mainErrors'],
            'sideErrors' => $checkData['sideErrors'],
            'mainCount' => $checkData['mainCount'],
            'sideCount' => $checkData['sideCount'],
            'mainCards' => $checkData['mainCards'],
            'sideCards' => $checkData['sideCards'],
        ];
    }
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
- ベース実装 pf-eccube3 の `deckentry_check.twig` は大会名、DCIナンバー、お名前、フォーマット、デッキリストを表示するが、開催店舗は表示していない。設計HTMLは「現行機能をベースに以下カスタマイズを行う」として `DCIナンバーを削除` と `開催店舗を表示する` を明記しているため、開催店舗はベース踏襲ではなく追加カスタマイズ要求であり、enterprise側で未実装と確認した。

ベース実装 pf-eccube3 完了画面は開催店舗を表示しない: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry_check.twig:15-33`
```twig
        <div class="deckRegist">
        <section class="deckResult">
            <p class="tournamentName">{{ eventDetail.event.nameJp }}({% for format in eventDetail.event.formats %}{{ loop.index == 1 ? '' : '/' }}{{ format.nameJp }}{% endfor %})</p>
            <p class="tournamentDciNumber">DCIナンバー : {{ player.dciNo }}</p>
            <p class="tournamentDciName">お名前 : {{ player.lastNameEn }} {{ player.firstNameEn }}</p>
            <p class="message_">
                以下の内容でデッキ登録を行いました。<br>
                内容に間違いがないことをご確認ください。<br>
                <br>
                ※「領界路の彼方」のカードは「マジック：ザ・ギャザリング | マーベル スパイダーマン」のカードに変換されます。
            </p>

            <div class="resultDecklist">
                {% if 1 < eventDetail.event.formats|length %}
                    <section id="deckFormat">
                        <h3>フォーマット</h3>
                        <p>{{ deck.format.nameJp }}</p>
                    </section>
                {% endif %}
```

ベース実装 pf-eccube3 check ControllerはeventDetail等を渡す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php:334-340`
```php
        return $app->render('Mypage/deckentry_check.twig', array(
            'eventDetail' => $eventDetail,
            'deck' => $deck,
            'player' => $player,
            'cardList' => $cardList,
            'boardErrors' => $boardErrors,
            'cardErrors' => $cardErrors,
```

# 根拠
- 設計：
  - カスタマイズ説明で開催店舗表示を追加要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4730-4735`
  - 画面部品 No.4 開催店舗: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4753-4759`
- ec-cube-enterprise：
  - 完了画面のイベント情報には開催店舗がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig:14-35`
  - check Controllerは店舗名を渡さない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php:158-194`
- ベース実装：
  - pf-eccube3完了画面も開催店舗表示なし。設計ではこれに対する追加カスタマイズとして開催店舗表示を要求: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry_check.twig:15-33`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-17_0306_sheet-14_sheet.json#f06-17_0306_sheet-14_sheet-conformance-eeb5690f79c9'`
- 確認コマンド: `rg -n "現行機能をベースに以下カスタマイズを行う|DCIナンバーを削除|開催店舗を表示する|item-sheet-14-4|<td>開催店舗</td>|カスタマイズ対応、開催店舗" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "店舗|開催店舗|shop|Shop|BaseInfo|p-hareruya-deckentry-check__event|Deck\.playerName|EventDetail\.event\.nameJp|EventDetail|Customer|mainCards|sideCards" ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig`
- 確認コマンド: `rg -n "店舗|開催店舗|shop|eventDetail\.event\.nameJp|tournamentName|tournamentDciNumber|tournamentDciName|eventDetail|player|cardList|boardErrors" pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry_check.twig pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4730,4735p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4753,4759p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/deck_entry_check.twig | sed -n '1,105p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/DeckEntryController.php | sed -n '158,194p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig | sed -n '16,23p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Event/detail.twig | sed -n '92,98p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/deckentry_check.twig | sed -n '1,100p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/DeckentryController.php | sed -n '334,340p'`
