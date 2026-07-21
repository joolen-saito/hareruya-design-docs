# a17-03_0517_sheet-5_pointgranterapi 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-03_0517_sheet-5_pointgranterapi.json#a17-03_0517_sheet-5_pointgranterapi-conformance-9e30c8c7c6f9`
- 機能: A17-03 A17-03 PointGranterAPI連携
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はポイント履歴に transaction_id（スマレジ取引ID）を付与時に登録するよう要求するが、実装は常に transactionId: null を渡し保存しない。

## 判定理由
設計はDBカラム表(line 1816)およびリニューアル移行時の扱い(line 1769)で dtb_point_history が『スマレジ取引ID（transaction_id）』を持ち付与時に登録すると明記。実装 PointGranterAction::handle は pointHistoryEntityManager->save() に transactionId: null（line 76）を渡す。PointHistoryEntityManager::save() は $transactionId が null でないときのみ setTransactionId する（PointHistoryEntityManager.php:73-74）ため、常に未設定となる。DtbPointHistory には transaction_id カラム（DtbPointHistory.php:58-59、コメント『スマレジ取引ID』）と setTransactionId が存在するが、PointGranter付与経路では取引IDが保存されない。なお本項目は中継スタブ（item1）に起因して実取引IDが得られない構造だが、設計要求（transaction_id 登録）に対し実装がnull固定である事実は成立する。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:1816-1816` — 設計要求（DBカラム）

```html
          <div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td>会員（<code>dtb_customer</code>）</td><td>ポイント残高（<code>point</code>）</td><td>取引更新時にポイントを加算する。</td></tr><tr><td>プレイヤー（<code>dtb_player</code>）</td><td>スマレジID（<code>smaregi_id</code>）</td><td>会員に紐づくプレイヤーのスマレジIDで会員を特定する。</td></tr><tr><td>ポイント履歴（<code>dtb_point_history</code>）</td><td>会員（<code>customer_id</code>）・増減ポイント（<code>point_change</code>）・備考（<code>note</code>）・発行日（<code>issue_date</code>）・作成日（<code>create_date</code>）・ポイント種別（<code>point_type_id</code>）・スマレジ取引ID（<code>transaction_id</code>）</td><td>付与時に登録する。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:68-77` — transaction_id を null 固定で保存

```php
            $this->pointHistoryEntityManager->save(
                PointHistory: null,
                Customer: $Player->getCustomer(),
                Order: null,
                PointType: $PointType ?? null,
                pointChange: $newPoint,
                note: $memo ?? '',
                issueDate: $issueDate,
                transactionId: null,
            );
```

`ec-cube-enterprise/src/Eccube/Service/EntityManager/PointHistoryEntityManager.php:73-74` — null時はsetTransactionIdしない

```php
        if ($transactionId !== null) {
            $PointHistory->setTransactionId($transactionId);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず、指摘を維持。(1)引用の正しさ: PointGranterAction::handle は pointHistoryEntityManager->save(..., transactionId: null) (PointGranterAction.php:76) を渡す。PointHistoryEntityManager::save は `if ($transactionId !== null) { setTransactionId(...) }` (PointHistoryEntityManager.php:73-74) のため、PointGranter付与経路では transaction_id が常に未設定。DtbPointHistory には該当列(コメント『スマレジ取引ID』)と setter が存在するが populate されない。(2)別経路の検討: rg で transaction_id を設定するのは Webhook系(SmaregiOrderPointApplier/PointAdjustmentApplier/Reverter が PointService 経由で取引ID記録)だが、これは注文/Webhook起点の別フローであり、本設計シートが要求する PointGranter admin_api 付与経路(『付与時に登録する』line 1770近傍のDBカラム節)ではない。当該経路での取引ID保存機構は存在しない。(3)設計側除外の検討: line 1770 の実装優先条項は『列名・型の最終確定』を実装に委ねるのみで、列を populate しない挙動を許容するものではない(列は実在する)。よって設計要求(transaction_id を付与時に登録)に対し実装はnull固定で未充足。指摘成立。なお本項は中継スタブ(88b47dcc)に起因する構造だが、transaction_id 非保存の事実は独立して成立する。
