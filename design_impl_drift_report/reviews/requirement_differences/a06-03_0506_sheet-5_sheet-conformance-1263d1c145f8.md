# a06-03_0506_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-03_0506_sheet-5_sheet.json#a06-03_0506_sheet-5_sheet-conformance-1263d1c145f8`
- 機能: A06-03 A06-03 店頭買取情報更新
- 観点: ⑦要求網羅・実装違い

## 要旨
適格請求書発行事業者確認フラグはfalse更新が無視され、かつ『受注が該当する場合のみ』の条件判定が無い。

## 判定理由
設計(1531,1524)はqualified_invoice_issuer_confirmation_flgを任意booleanとし『受注が適格請求書発行事業者に該当する場合は確認済みフラグを指定値で更新する』と規定。DTOは?boolで受けるが、OtcBuyOrderEntityManager.php:62のif ($qualifiedInvoiceIssuerConfirmationFlg)はtruthy時のみsetterを呼ぶため、false（未確認へ戻す指定値）が保存されない。また同更新箇所には受注側の適格請求書発行事業者該当判定（getQualifiedInvoiceIssuerFlg等）が無く、非該当受注でもtrueなら確認済みフラグが更新され得る。『指定値で更新』『該当する場合のみ』の双方に反する。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1524-1524` — 設計要求(該当時のみ指定値で更新)

```html
          <ol><li><code>jwt-token</code>ヘッダのトークンを検証し、管理者会員を特定する。検証できない場合は認証拒否（HTTP 401）とする。</li><li>パスの受注IDで店頭買取受注を1件取得する。該当が無い場合は該当なし（HTTP 404）とする。</li><li>リクエストのステータス（<code>order_status</code>）・明細配列（<code>order_details</code>）・適格請求書発行事業者の確認済みフラグ（<code>qualified_invoice_issuer_confirmation_flg</code>）を受け取り、ステータス・明細の入力検証と、明細1件ごとの入力検証を行う。検証エラーが1件以上あれば、入力不正（HTTP 400）とし全エラーメッセージを<code>errors</code>配列で返す。</li><li>受注に紐づく既存の明細・個別入力商品・在庫・在庫履歴を削除する。</li><li>送られた明細を1件ずつ処理する。商品規格IDが空の明細は個別入力商品として登録し、商品規格IDがある明細は明細として登録する。いずれも部門IDがあり該当部門が存在すれば部門を設定する。明細の単価×数量を合算し、買取合計金額を10円単位へ切り上げる。商品規格に紐づく明細は商品規格ごとに数量を集計し、在庫と在庫履歴を作る。</li><li>受注にステータス・買取合計金額・明細・個別入力商品・在庫を設定し、査定担当者に認証した管理者会員を、更新日時に現在日時を設定する。指定ステータスが成立（1）の場合は成立日時を、それ以外の場合はキャンセル日時を現在日時に設定する。受注が適格請求書発行事業者に該当する場合は確認済みフラグを指定値で更新する。</li><li>更新前と指定ステータスが異なる場合は、ステータス変更履歴を1件登録する。</li><li>一連の保存を行い、コード200のJSONを返す。</li></ol>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:62-63` — truthyのみ反映・条件判定なし

```php
        if ($qualifiedInvoiceIssuerConfirmationFlg) {
            $OtcBuyOrder->setQualifiedInvoiceIssuerConfirmationFlg($qualifiedInvoiceIssuerConfirmationFlg);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。該当判定の別置き場を全域grepしたが更新経路に無く維持。設計(1524)『受注が適格請求書発行事業者に該当する場合は確認済みフラグを指定値で更新する』・(1531)『該当する場合のみ反映』・(1566)『該当する場合に更新』の3箇所で『該当時のみ』『指定値で』を明記。実装 OtcBuyOrderEntityManager.php:62-63 は `if ($qualifiedInvoiceIssuerConfirmationFlg) { setter($flg) }` の truthy ガードのみ。(a)false（=未確認へ戻す指定値）は if を通らず保存されず『指定値で更新』に反する。(b)受注側の適格請求書発行事業者該当判定が無い。grep -rn で getQualifiedInvoiceIssuerFlg は DtbOtcBuyOrder.php:696 に定義があるものの、src/Eccube/Service/App/MTGBuyer 配下・UpdateOtcBuyOrderAction・EntityManager のいずれの更新経路でも未参照（frontのOtcBuyController等でしか使われない）。非該当受注でも true なら確認済みフラグが更新され得る。双方の乖離を実コードで確認。指摘維持。
