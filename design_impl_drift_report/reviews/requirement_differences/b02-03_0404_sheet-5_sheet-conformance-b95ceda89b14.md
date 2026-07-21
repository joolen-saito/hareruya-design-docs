# b02-03_0404_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0404_sheet-5_sheet.json#b02-03_0404_sheet-5_sheet-conformance-b95ceda89b14`
- 機能: B02-03 B02-03 期間別入庫数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
対象なし時は更新せず完了する設計だが、実装は集計前に全行 DELETE してコミットする。

## 判定理由
設計は『対象が無い場合は更新を行わずに終了する』（HTML 1168 の処理フロー、1193 エラー処理『対象なし→更新を行わず完了する』）と明記。実装 BatchAggregateStockUpAction::handle は beginTransaction 後、まず clearStockUpQuantityForAggregate()（DELETE FROM dtb_stock_up_quantity）を無条件に実行し（39 行, リポジトリ 99-102 行）、その後 getStockUpForAggregate() で対象取得（40 行）、foreach（空でも可）を回し commit（44 行）。対象なし判定・空配列時の早期 return は存在せず、対象なしでも既存集計行が削除・コミットされる。よって実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1168-1168` — 設計要求（対象なし時は更新しない）

```html
          <ol><li>実行時間制限を解除し、SQLロガーを無効化する。</li><li>在庫履歴を商品規格単位で集計し、期間別入庫数（前日・3日・週・2週・3週・月・90日・180日・365日）の一覧を取得する。</li><li>対象が無い場合は更新を行わずに終了する。</li><li>集計結果の行ごとに、商品規格サブの入庫数列を更新する。</li><li>100件ごとに変更を反映しキャッシュをクリアしながら処理する。</li><li>残りの変更を反映して終了する。</li></ol>
```

## ec-cube-enterprise 実装
対象なし判定前に無条件 DELETE
`ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:38-44` — 集計前に全削除→取得の順

```php
        try {
            $this->stockUpQuantityRepository->clearStockUpQuantityForAggregate();
            $stockUpData = $this->stockUpQuantityRepository->getStockUpForAggregate();
            foreach ($stockUpData as $data) {
                $this->stockUpQuantityRepository->updateStockUpQuantityColumns($data);
            }
            $connection->commit();
```

`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:99-103` — DELETE FROM dtb_stock_up_quantity

```php
    public function clearStockUpQuantityForAggregate(): void
    {
        $this->getEntityManager()->getConnection()->executeStatement(
            'DELETE FROM dtb_stock_up_quantity'
        );
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず指摘維持。B02-03 の唯一の入口は AggregateStockUpCommand(eccube:aggregate-stock-up)で、そこから BatchAggregateStockUpAction::handle() を呼ぶだけ(command 48 行)。handle() は beginTransaction(37)後に無条件で clearStockUpQuantityForAggregate()=『DELETE FROM dtb_stock_up_quantity』(39 行/repo 99-103)を実行し、その後 getStockUpForAggregate()(40)で対象取得、foreach(41-43)後 commit(44)。$stockUpData が空でも早期 return や対象なし分岐は存在せず、DELETE 済みのまま commit される。全表 DELETE は明白な DB 変更であり、設計『対象なし→更新を行わず完了する』(HTML 1168 手順3, 1193 エラー処理)と矛盾。別ルート・別 command・空配列ガードを command/action/repo 全走査したが存在せず。指摘どおり実装違い。
