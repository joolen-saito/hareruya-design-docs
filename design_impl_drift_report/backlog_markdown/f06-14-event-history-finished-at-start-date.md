/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：マイイベント・デッキ登録
課題カテゴリ：実装違い
課題：イベント終了表示が開催日の23:59:59後ではなく開催開始時刻後に切り替わる
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 開始日時が当日 10:00 の予約済みイベントを持つ会員で、同日 10:01 から 23:59:59 までの間に `http://localhost:8080/ja/mypage/event_history` を表示する
2. 対象イベントの「処理状態」欄を確認する
3. 処理状態が申込状態名のままか、「イベント終了」に切り替わっているか確認する

# 期待される挙動【必須】
- 開催日の 23:59:59 を過ぎたイベントだけ、処理状態に「イベント終了」と表示する
- 開催日当日の開始時刻経過後でも、23:59:59 まではイベント終了扱いにしない
- 決済中以外のイベントは、終了済みでない場合は申込状態の名称を表示する

# 現在の挙動【必須】
- ec-cube-enterprise では `event_history.twig` が各行で `detail.hasFinished()` を呼び、true の場合に `front.mypage.event_history.status__finished`、すなわち「イベント終了」を表示する。`DtbEventDetail::hasFinished()` は `return $this->startDate < new \DateTime();` のため、開催日の 23:59:59 ではなく開催開始日時 `startDate` を過ぎた時点で終了扱いになる。

ec-cube-enterprise 終了判定はstartDate基準: `ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php:551-557`
```php
    /**
     * 終了済みのイベントか
     */
    public function hasFinished(): bool
    {
        return $this->startDate < new \DateTime();
    }
```

ec-cube-enterprise マイイベント一覧でhasFinishedを処理状態に使用: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig:91-121`
```twig
                {% for detail in pagination %}
                    {% set Event = detail.getEvent() %}
                    {% set Entry = entryByEventDetailId[detail.getId()] ?? null %}
                    {% set deckId = deckIdByEventDetailId[detail.getId()] ?? null %}
                    {% set isFinished = detail.hasFinished() %}
                    <article class="p-hareruya-deckentry-list__card">
                        <p class="p-hareruya-deckentry-list__card-title">
                            <a class="p-hareruya-deckentry-list__card-title-link" href="{{ url('event_detail', { detailId: detail.getId() }) }}">{{ Event.getNameJp() }}</a>
                        </p>
                        <dl class="p-hareruya-deckentry-list__card-detail">
                            <div class="p-hareruya-deckentry-list__card-row">
                                <dt class="p-hareruya-deckentry-list__card-label">{{ 'front.mypage.event_history.label__format'|trans }}</dt>
                                <dd class="p-hareruya-deckentry-list__card-value">
                                    <div class="p-hareruya-deckentry-list__format-badges">
                                        {% for format in Event.getFormats().getValues() %}
                                            {% set cssClass = formatCssClassMap[format.getCode()] ?? format.getCode()|lower %}
                                            <span class="p-hareruya-deckentry-list__format-badge p-hareruya-deckentry-list__format-badge--{{ cssClass }}">{{ format.getNameJp() }}</span>
                                        {% endfor %}
                                    </div>
                                </dd>
                            </div>
                            <div class="p-hareruya-deckentry-list__card-row">
                                <dt class="p-hareruya-deckentry-list__card-label">{{ 'front.mypage.event_history.label__date'|trans }}</dt>
                                <dd class="p-hareruya-deckentry-list__card-value">{{ detail.getStartDate()|date('Y/n/j H:i') }}</dd>
                            </div>
                            <div class="p-hareruya-deckentry-list__card-row">
                                <dt class="p-hareruya-deckentry-list__card-label">{{ 'front.mypage.event_history.label__status'|trans }}</dt>
                                {% if isFinished %}
                                    <dd class="p-hareruya-deckentry-list__card-value">{{ 'front.mypage.event_history.status__finished'|trans }}</dd>
                                {% elseif Entry is null %}
                                    <dd class="p-hareruya-deckentry-list__card-value">{{ 'front.mypage.event_history.status__not_applied'|trans }}</dd>
```

ec-cube-enterprise イベント終了の翻訳値: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:659`
```yaml
front.mypage.event_history.status__finished: イベント終了
```
- ベース実装 pf-eccube3 でも、`Mypage/event_history.twig` は `detail.hasFinished() ? 'イベント終了' : entry.getEntryStatus().getName()` で処理状態を出し分け、`DtbEventDetail::hasFinished()` は `startDate < new \DateTime()` を返している。したがってこの候補は、ベース実装由来の差ではなく、設計HTMLで追加された 23:59:59 基準の要求に対して enterprise もベースも開始時刻基準のままになっている差分として確認した。

ベース実装 pf-eccube3 終了判定はstartDate基準: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:909-916`
```php
    /**
     * 終了済みのイベントか
     * @return boolean
     */
    public function hasFinished()
    {
        return $this->startDate < new \DateTime();
    }
```

ベース実装 pf-eccube3 マイイベント一覧でhasFinishedを処理状態に使用: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig:46-54`
```twig
                            <div class="event-history-list__item event-history-list__item-status">
                                {% if entry.getEntryStatus().id == 1 %}
                                <div class="event-history-list__item__container event-history-list__item__container--status event-history-list__item__container--error">
                                    決済中<a href="/ja/help/guide#block4" class="event-history-list__item__errorLink"><img src="/ja/assets/img/help.png" title="決済が中断されました。お手数ですが、約30分後に再度お申込みいただけますようお願いいたします。"></a>
                                {% else %} 
                                <div class="event-history-list__item__container event-history-list__item__container--status {{ entry.isEntered() ? 'event-history-list__item__container--complete'}}">
                                    {{ detail.hasFinished() ? 'イベント終了' : entry.getEntryStatus().getName() }}
                                {% endif %}
                                </div>
```

# 根拠
- 設計：
  - 処理概要で開催日23:59:59後にイベント終了表示と指定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4006-4014`
  - リバース詳細でも終了時はイベント終了、未終了時は申込状態名と定義: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4102-4115`
- ec-cube-enterprise：
  - 終了判定は開催開始日時startDateを現在時刻と比較: `ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php:551-557`
  - マイイベント一覧はhasFinishedの結果でイベント終了表示へ分岐: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig:91-121`
- ベース実装：
  - pf-eccube3も終了判定は開催開始日時startDateを現在時刻と比較: `pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php:909-916`
  - pf-eccube3の一覧もhasFinishedでイベント終了表示へ分岐: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig:46-54`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-14_0306_sheet-12_sheet.json#f06-14_0306_sheet-12_sheet-conformance-68b9125e8ede'`
- 確認コマンド: `rg -n "開催日の23:59:59|イベント終了|hasFinished|startDate < new|front\.mypage\.event_history\.status__finished" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig`
- 確認コマンド: `rg -n "23:59|イベント終了|終了済み|開催日の|開催日.*23|ステータス.*終了|No\.4|item-sheet-12" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "23:59:59|イベント終了|hasFinished|startDate|endDate|終了|デッキ登録状況|status" pf-eccube3/app/Plugin/HareruyaEc/Controller pf-eccube3/app/Plugin/HareruyaEc/Entity pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage`
- 確認コマンド: `rg -n "23:59:59|イベント終了|hasFinished|startDate|endDate|event_history|mypage_event|デッキ登録状況|deckRegist" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Repository`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4006,4014p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '4102,4116p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/DtbEventDetail.php | sed -n '540,562p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/event_history.twig | sed -n '91,121p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbEventDetail.php | sed -n '907,917p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/event_history.twig | sed -n '46,54p'`
