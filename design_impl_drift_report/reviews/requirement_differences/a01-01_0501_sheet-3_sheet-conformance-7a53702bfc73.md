# a01-01_0501_sheet-3_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a01-01_0501_sheet-3_sheet.json#a01-01_0501_sheet-3_sheet-conformance-7a53702bfc73`
- 機能: A01-01 A01-01 スマレジ連携処理
- 観点: ⑦要求網羅・未実装

## 要旨
在庫編集・在庫一括編集で在庫場所区分がスマレジの場合にスマレジ在庫相対値更新APIへ反映する処理と、件数上限超過時にエラー表示してCSV登録を促す分岐が実装されていない。

## 判定理由
在庫編集の保存を担う StockApprovalStoreAction は ProductStock 更新・StockHistory 登録・StockApprovalList 登録のみで(productStockEntityManager->save 行95, stockHistoryEntityManager->save 行105, stockApprovalListEntityManager->save 行128)、スマレジ更新API呼び出しが無い。StockBulkApprovalStoreAction にも Smaregi 依存/呼び出しが無い(rg で smaregi 参照ゼロ)。SmaregiStockApiClient 側にも相対値更新メソッドが無いため反映入口自体が存在しない。設計889-890行の『実行できる件数上限を設定し、上限を越えたらエラーを表示し、CSV登録を促す』に相当する上限判定・CSV誘導エラーも src/Eccube/Service/Admin/Stock・Controller/Admin/Stock に見当たらない(在庫変更CSVの10002件チェックは別処理で、管理画面編集件数上限のスマレジ反映制御ではない)。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:889-890` — 設計要求(在庫編集/一括編集のスマレジ反映と件数上限エラー)

```html
                <tr><td>管理画面</td><td>在庫編集</td><td>2:API個別</td><td>在庫場所区分がスマレジの場合に編集結果をスマレジ側に反映する<br>実行できる件数上限を設定し、上限を越えたらエラーを表示し、CSV登録を促す</td></tr>
                <tr><td>管理画面</td><td>在庫一括編集</td><td>2:API個別</td><td>在庫場所区分がスマレジの場合に編集結果をスマレジ側に反映する<br>実行できる件数上限を設定し、上限を越えたらエラーを表示し、CSV登録を促す</td></tr>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockApprovalStoreAction.php:128-128` — StockApprovalStoreAction(承認/履歴/在庫DBのみ、スマレジ反映なし)

```php
            $this->stockApprovalListEntityManager->save(
```

## 不在確認コマンド

- `rg -rn -i 'smaregi|相対値|CSV登録' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockApprovalStoreAction.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock/StockBulkApprovalStoreAction.php`
- `rg -rn 'SmaregiStockApiClient' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock`

## 反証結果

反証を試みた結果、指摘は覆らなかった。StockApprovalStoreAction は EntityManager->save の5箇所(EditApproval:56, EditApprovalDetail:68, ProductStock:95, StockHistory:105, ApprovalList:128)のみで Smaregi/StockApiClient 参照ゼロ。StockBulkApprovalStoreAction もスマレジ参照ゼロ、件数関連は ProductStockTotalCount: count(input->items):96 の記録のみで上限判定・CSV誘導エラー分岐なし。Admin/Stock 配下の smaregi 参照は STOCK_LOCATION_SMAREGI 定数(在庫場所の区別)と getProductStockBySmaregi(DB行の取得)だけで、いずれも API 押し出しではない。設計882-883行『在庫場所区分がスマレジの場合に編集結果をスマレジ側に反映/上限超過でエラー表示しCSV登録を促す』の入口が実装に不在。指摘は維持。
