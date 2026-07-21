# a06-03_0506_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-03_0506_sheet-5_sheet.json#a06-03_0506_sheet-5_sheet-conformance-b7389d6a549b`
- 機能: A06-03 A06-03 店頭買取情報更新
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は成立以外を一律キャンセル日時設定対象とするが、実装は買取キャンセル時のみ設定し経理払出し待ち等で日時が更新されない。

## 判定理由
設計(1524,1552)は『指定ステータスが成立（1）の場合は成立日時を、それ以外の場合はキャンセル日時を現在日時に設定する』と規定。実装のOtcBuyOrderEntityManager::updateはisComplete()時にcompleteDateを、elseif isCancel()時にのみcancelDateを設定する(52-59)。受付対象ASSESSMENT_COMPLETED_STATUSESには経理払出し待ち(STATUS_ACCOUNTING_PAYMENT_PENDING=10)が含まれるが、isComplete()もisCancel()も真にならないためcancelDateが設定されず、設計の『成立以外→キャンセル日時』を満たさない。別途status10でキャンセル日時を設定する経路は見当たらなかった。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1524-1524` — 設計要求(成立以外はキャンセル日時)

```html
          <ol><li><code>jwt-token</code>ヘッダのトークンを検証し、管理者会員を特定する。検証できない場合は認証拒否（HTTP 401）とする。</li><li>パスの受注IDで店頭買取受注を1件取得する。該当が無い場合は該当なし（HTTP 404）とする。</li><li>リクエストのステータス（<code>order_status</code>）・明細配列（<code>order_details</code>）・適格請求書発行事業者の確認済みフラグ（<code>qualified_invoice_issuer_confirmation_flg</code>）を受け取り、ステータス・明細の入力検証と、明細1件ごとの入力検証を行う。検証エラーが1件以上あれば、入力不正（HTTP 400）とし全エラーメッセージを<code>errors</code>配列で返す。</li><li>受注に紐づく既存の明細・個別入力商品・在庫・在庫履歴を削除する。</li><li>送られた明細を1件ずつ処理する。商品規格IDが空の明細は個別入力商品として登録し、商品規格IDがある明細は明細として登録する。いずれも部門IDがあり該当部門が存在すれば部門を設定する。明細の単価×数量を合算し、買取合計金額を10円単位へ切り上げる。商品規格に紐づく明細は商品規格ごとに数量を集計し、在庫と在庫履歴を作る。</li><li>受注にステータス・買取合計金額・明細・個別入力商品・在庫を設定し、査定担当者に認証した管理者会員を、更新日時に現在日時を設定する。指定ステータスが成立（1）の場合は成立日時を、それ以外の場合はキャンセル日時を現在日時に設定する。受注が適格請求書発行事業者に該当する場合は確認済みフラグを指定値で更新する。</li><li>更新前と指定ステータスが異なる場合は、ステータス変更履歴を1件登録する。</li><li>一連の保存を行い、コード200のJSONを返す。</li></ol>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:52-59` — cancelはisCancel()時のみ設定

```php
        if ($OtcBuyOrderStatus->isComplete()) {
            $OtcBuyOrder
                ->setCompleteDate($currentTime)
                ->setTransactionId($smaregiTransactionId);

        // 買取キャンセルの場合、cancelDateを設定
        } elseif ($OtcBuyOrderStatus->isCancel()) {
            $OtcBuyOrder->setCancelDate($currentTime);
```

isCancelはSTATUS_CANCEL=2のみ、経理払出し待ち=10は対象外
`ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:91-94` — status10は成立でもキャンセルでもない

```php
    public const ASSESSMENT_COMPLETED_STATUSES = [
        self::STATUS_COMPLETE,
        self::STATUS_CANCEL,
        self::STATUS_ACCOUNTING_PAYMENT_PENDING,
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。status10経路の別設定箇所を探したが無く維持。設計は3箇所で一貫し『指定ステータスが成立(1)なら成立日時、それ以外はキャンセル日時を現在日時に設定』(1524,1552,1566)。実装 OtcBuyOrderEntityManager.php:52-59 は `if ($OtcBuyOrderStatus->isComplete())`→completeDate、`elseif ($OtcBuyOrderStatus->isCancel())`→cancelDate のみで、else 無し。MtbOtcBuyOrderStatus.php:154-161 で isCancel()=id===2、isComplete()=id===1。受付許可値 ASSESSMENT_COMPLETED_STATUSES={1,2,10} に含まれる経理払出し待ち(10)は両分岐とも偽→cancelDate 未設定。status10 は到達可能な有効入力で（UpdateOtcBuyOrderAction は isAccountingPaymentPending() でメール送信まで実装済み）、設計の『成立以外→キャンセル日時』を満たさない。status10 に cancelDate を設定する別経路は Action/EntityManager 内に存在せず。乖離を実コードで確認。指摘維持。
