/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント買取
機能：買取履歴一覧
課題カテゴリ：実装違い
課題：買取履歴一覧の処理状態が状態別画像ではなくテキストラベルで表示される
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. 買取履歴を持つ会員で `http://localhost:8080/ja/mypage/purchase_history` を表示する
2. 各買取履歴行の「処理状態」欄を確認する
3. 状態別の画像が表示されるか、状態名のテキストラベルが表示されるか確認する

# 期待される挙動【必須】
- 買取履歴一覧の要素10「処理状態」は画像として表示する
- 処理状態の画像表示は「買取ステータスと処理状態の紐付け」シートに従う
- 受付完了、査定中、査定完了、振込待ち、買取完了、キャンセルなどの状態別画像を一覧行に表示する

# 現在の挙動【必須】
- ec-cube-enterprise の買取履歴一覧 `purchase_history.twig` は、`row.mappedStatus` を `completed` / `cancelled` / `pending` の3種CSS修飾子に変換し、`<span class="c-hareruya-label--status ...">{{ row.statusIconAlt }}</span>` としてテキストラベルを描画している。`PurchaseHistoryStatusMapper` は6状態分の `statusIconPath` と `alt` を返し、`PurchaseHistoryRowBuilder` もDTOへ `statusIconPath` を詰めているが、一覧テンプレートでは `statusIconPath` を参照していない。詳細テンプレートでは `d.statusIconPath` を `<img>` で描画しているため、一覧だけが画像表示になっていない。

ec-cube-enterprise 一覧の処理状態はテキストラベル: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147`
```twig
                                <div class="p-hareruya-history-list__order-info-row">
                                    <dt>{{ 'front.mypage.purchase_history.col.status'|trans }}</dt>
                                    <dd>
                                        {% if row.mappedStatus is not empty %}
                                            {% if row.mappedStatus == 'purchase_completed' %}
                                                {% set statusCssModifier = 'completed' %}
                                            {% elseif row.mappedStatus == 'canceled' %}
                                                {% set statusCssModifier = 'cancelled' %}
                                            {% else %}
                                                {% set statusCssModifier = 'pending' %}
                                            {% endif %}
                                            <span class="c-hareruya-label--status c-hareruya-label--status-{{ statusCssModifier }}">{{ row.statusIconAlt }}</span>
                                        {% endif %}
                                    </dd>
                                </div>
```

ec-cube-enterprise 6状態の画像パスは算出されている: `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php:95-127`
```php
    public function resolveStatusIcon(string $mappedStatus): array
    {
        return match ($mappedStatus) {
            self::MAPPED_STATUS_RECEPTION_COMPLETED => [
                'iconPath' => 'assets/img/mypage/reception_completed.svg',
                'alt' => '受付完了',
            ],
            self::MAPPED_STATUS_ASSESSING => [
                'iconPath' => 'assets/img/mypage/assessing.svg',
                'alt' => '査定中',
            ],
            self::MAPPED_STATUS_ASSESSMENT_COMPLETED => [
                'iconPath' => 'assets/img/mypage/assessment_completed.svg',
                'alt' => '査定完了',
            ],
            self::MAPPED_STATUS_TRANSFER_PENDING => [
                'iconPath' => 'assets/img/mypage/transfer_pending.svg',
                'alt' => '振込待ち',
            ],
            self::MAPPED_STATUS_PURCHASE_COMPLETED => [
                'iconPath' => 'assets/img/mypage/purchase_completed.svg',
                'alt' => '買取完了',
            ],
            self::MAPPED_STATUS_CANCELED => [
                'iconPath' => 'assets/img/mypage/canceled.svg',
                'alt' => 'キャンセル',
            ],
            default => [
                'iconPath' => '',
                'alt' => '',
            ],
        };
    }
```

ec-cube-enterprise 一覧DTOに画像パスを保持: `ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php:88-108`
```php
        // ステータスから画面表示用の処理状態アイコンを取得する。
        $mappedStatus = $this->purchaseHistoryStatusMapper->resolveMappedStatusLabelForNet(
            $buyOrder->getBuyOrderStatus()->getId(),
        );
        $icon = $this->purchaseHistoryStatusMapper->resolveStatusIcon($mappedStatus);

        $displayTotal = $this->purchaseHistoryStatusMapper->shouldDisplayTotalAmountForMappedStatus($mappedStatus)
            ? $buyOrder->getApplicationTotalPrice()
            : null;

        return new PurchaseHistoryRowDto(
            requestedAt: $buyOrder->getOrderDate(),
            shopName: $this->translator->trans('front.mypage.purchase_history.shop.online_shop'),
            purchaseNo: sprintf('%07d', $buyOrder->getId()),
            summaryLines: $this->buildNetSummaryLines($buyOrder),
            displayTotalAmount: $displayTotal,
            statusIconPath: $icon['iconPath'],
            statusIconAlt: $icon['alt'],
            channel: PurchaseHistoryRowDto::CHANNEL_NET,
            orderInternalId: $buyOrder->getId(),
            mappedStatus: $mappedStatus,
```

ec-cube-enterprise 詳細画面は画像を描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:43-49`
```twig
            <dt>{{ 'front.mypage.purchase_history.col.status'|trans }}</dt>
            <dd>
                <span class="d-inline-flex align-items-center">
                    {% if d.statusIconPath %}
                        <img src="{{ asset(d.statusIconPath) }}" alt="{{ d.statusIconAlt|e }}" width="120" height="120" loading="lazy" class="img-fluid">
                    {% elseif d.statusIconAlt %}
                        <span class="text-muted small">{{ d.statusIconAlt|e }}</span>
```
- ベース実装 pf-eccube3 の買取履歴一覧は、処理状態欄で `img/buy_order_status_{{ buyOrder.buyOrderStatusId }}.png` を `<img>` として表示している。設計の「処理状態=画像」はこのベース実装の画像表示を踏襲する要求として確認できる。

ベース実装 pf-eccube3 買取履歴一覧の処理状態見出し: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:72-86`
```twig
                                </div>
                                <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__id ec-orderHistory__list__item__content--purchase">
                                    オーダーID
                                </div>
                                <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__orderContent ec-orderHistory__list__item__content--purchase">
                                    買取依頼内容
                                </div>
                                <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__sum ec-orderHistory__list__item__content--purchase">
                                    申込時買取金額合計
                                </div>
                                <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__condition ec-orderHistory__list__item__content--purchase">
                                    処理状態
                                </div>
                            </li>
                            {% set selectType = constant('Plugin\\HareruyaEc\\Entity\\DtbBuyMainCard::SELECT_TYPE') %}
```

ベース実装 pf-eccube3 処理状態画像: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:150-155`
```twig
                                    <div class="ec-orderHistory__list__item__content ec-orderHistory__list__item__condition ec-orderHistory__list__item__content--purchase" aria-label="処理状態">
                                        <div class="ec-orderHistory__list__item__content__rightSideInSp">
                                            <a href="{{ path('mypage_purchase_history_detail', {id: buyOrder.buyOrderId}) }}">
                                                <img src="{{ path('assets', {path: 'img/buy_order_status_' ~ buyOrder.buyOrderStatusId ~ '.png'}) }}">
                                            </a>
                                        </div>
```

# 根拠
- 設計：
  - カスタマイズ説明でステータス画像変更と紐付けシート参照を定義: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3314-3338`
  - 要素表で処理状態の書式を画像と定義: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3364-3366`
  - リバース詳細でも各行の処理状態を状態画像と説明: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3408`
- ec-cube-enterprise：
  - 一覧は画像ではなくspanテキストラベルを描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig:133-147`
- ベース実装：
  - pf-eccube3は買取ステータスID別png画像を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig:150-155`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-11_0305_sheet-10_sheet.json#f06-11_0305_sheet-10_sheet-conformance-0731b504f876'`
- 確認コマンド: `rg -n "買取履歴一覧|処理状態|状態画像|受付完了|査定中|査定完了|振込待ち|買取完了|キャンセル|statusIcon|c-hareruya-label--status|purchase_history" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Service ec-cube-enterprise/src/Eccube/Controller/Front/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage`
- 確認コマンド: `rg -n "statusIcon|statusIconAlt|resolveStatusIcon|purchase_history|処理状態|img/sys|status_" ec-cube-enterprise/src/Eccube pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '3314,3408p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig | sed -n '120,150p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryStatusMapper.php | sed -n '91,127p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Front/Mypage/PurchaseHistory/PurchaseHistoryRowBuilder.php | sed -n '84,108p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig | sed -n '39,50p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig | sed -n '72,86p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history.twig | sed -n '146,160p'`
