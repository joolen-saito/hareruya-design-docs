# b02-03_0402_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json#b02-03_0402_sheet-5_sheet-conformance-8de1795d9358`
- 機能: B02-03 B02-03 期間別入庫数集計バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は対象が無い場合は更新を行わず終了することを要求するが、実装は対象有無を判定する前に集計テーブルを全 DELETE する。

## 判定理由
設計の処理フローは「集計一覧取得→対象が無い場合は更新を行わずに終了する」（line 1210 step3）、エラー処理表でも対象なしは「更新を行わず完了する」（line 1235）。実装 handle() は集計データ取得より前に clearStockUpQuantityForAggregate() を呼び（BatchAggregateStockUpAction.php:39）、その後 getStockUpForAggregate() を取得する（line 40）。clearStockUpQuantityForAggregate は DELETE FROM dtb_stock_up_quantity を実行する（DtbStockUpQuantityRepository.php:99-103）。対象が空でも復元処理はなく、対象なし判定より破壊的削除が先行する。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1210-1210` — 設計要求

```html
          <ol><li>実行時間制限を解除し、SQLロガーを無効化する。</li><li>在庫履歴を商品規格単位で集計し、期間別入庫数（前日・3日・週・2週・3週・月・90日・180日・365日）の一覧を取得する。</li><li>対象が無い場合は更新を行わずに終了する。</li><li>集計結果の行ごとに、商品規格サブの入庫数列を更新する。</li><li>100件ごとに変更を反映しキャッシュをクリアしながら処理する。</li><li>残りの変更を反映して終了する。</li></ol>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:39-40` — 処理順序（削除が集計取得より先）

```php
            $this->stockUpQuantityRepository->clearStockUpQuantityForAggregate();
            $stockUpData = $this->stockUpQuantityRepository->getStockUpForAggregate();
```

`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:99-103` — 全削除の実体

```php
    public function clearStockUpQuantityForAggregate(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM dtb_stock_up_quantity'
        );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが実装挙動は設計と実際に乖離する。BatchAggregateStockUpAction::handle()(実読 line36-44)は beginTransaction 後、無条件で clearStockUpQuantityForAggregate() を先に呼び(line39)、その後 getStockUpForAggregate()(line40)、foreach で行更新、最後に commit(line44)する。clearStockUpQuantityForAggregate は DELETE FROM dtb_stock_up_quantity を実行(DtbStockUpQuantityRepository.php:99-103)。getStockUpForAggregate が空配列を返した場合でも foreach は素通りし commit(line44)されるため、全削除が確定コミットされる。ガード/復元処理は存在しない(handle 全文確認)。設計モデルは upsert(該当行を更新、無ければ新規)であって全削除→再挿入ではなく、line1210 step3 と line1235 は『対象なし→更新を行わず終了/完了』を要求する。よって『対象なし時に既存集計を全削除して確定する』という破壊的挙動は設計要求と観測可能に異なり、データ消失リスクを伴う実挙動差。別実装・別ガードも無い。指摘は維持。
