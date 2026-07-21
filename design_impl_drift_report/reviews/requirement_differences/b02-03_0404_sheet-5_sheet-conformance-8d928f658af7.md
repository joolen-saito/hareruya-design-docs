# b02-03_0404_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0404_sheet-5_sheet.json#b02-03_0404_sheet-5_sheet-conformance-8d928f658af7`
- 機能: B02-03 B02-03 期間別入庫数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は途中失敗時に反映済み行が残る部分反映モデルだが、実装はバッチ全体を単一トランザクションで囲み例外時に全ロールバックする。

## 判定理由
設計は『途中失敗時は反映済みの行のみ更新が残る』（HTML 1177 失敗結果、1180 失敗時出力）『部分反映は次回実行で回収される』（1183 データ整合性）と部分反映を前提とする。実装 BatchAggregateStockUpAction::handle は handle 全体を beginTransaction（37 行）で開始し、全 foreach 完了後に commit（44 行）、\Throwable 捕捉時に rollBack（45-46 行）する。途中失敗時は反映済み行も含め全てロールバックされ、部分反映は残らない。別経路での行単位コミット実装は同ファイル・リポジトリに存在しない。よって失敗時の永続化境界が設計と逆であり実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1177-1183` — 設計要求（部分反映が残る）

```html
          <div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>コマンド名。引数は取らない。</td></tr><tr><td>実行条件</td><td>集計対象期間内に入庫・マスタ更新の在庫履歴が存在すること。</td></tr><tr><td>成功結果</td><td>商品規格サブの入庫数列が最新の集計値で更新される。</td></tr><tr><td>失敗結果</td><td>途中失敗時は反映済みの行のみ更新が残る。</td></tr><tr><td>再実行時</td><td>実行時点のデータで再集計し、対象商品規格の入庫数列を上書きする。重複加算は起きない。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b02-03-b02-03_batch_product_product_storage_period_summary-入出力">入出力</h2>
          <div class="table-wrap"><table><thead><tr><th>種類</th><th>内容</th></tr></thead><tbody><tr><td>入力</td><td>コマンド名。</td></tr><tr><td>成功時出力</td><td>商品規格サブの入庫数列の更新。</td></tr><tr><td>失敗時出力</td><td>エラーメッセージのコンソール出力。途中で止まった場合は反映済みの行のみ更新が残る。</td></tr><tr><td>副作用</td><td>商品規格サブの更新。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-b02-03-b02-03_batch_product_product_storage_period_summary-データ整合性">データ整合性</h2>
          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>多重実行</td><td>ロックは持たない。同時実行時は同一行を上書きするため最後の更新値が残る。</td></tr><tr><td>途中失敗・再実行</td><td>上書き更新のため再実行で正しい集計値に収束する。部分反映は次回実行で回収される。</td></tr><tr><td>参照時点</td><td>実行時点の在庫履歴を対象とする。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php:37-47` — 単一トランザクション+例外時ロールバック

```php
        $connection->beginTransaction();
        try {
            $this->stockUpQuantityRepository->clearStockUpQuantityForAggregate();
            $stockUpData = $this->stockUpQuantityRepository->getStockUpForAggregate();
            foreach ($stockUpData as $data) {
                $this->stockUpQuantityRepository->updateStockUpQuantityColumns($data);
            }
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            throw $e;
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず指摘維持。handle() は connection->beginTransaction()(37)で全体を単一トランザクション化し、全 foreach 完了後 commit(44)、\Throwable 捕捉時 rollBack(45-46)で全ロールバックする。行単位/100件単位のコミットや部分反映を残す経路は action・repo・command のいずれにも無い(単一入口で確認済み)。一方 設計は現行踏襲(HTML 1143『現行挙動はpf-eccube3を参照』)を明示したうえで『途中失敗時は反映済みの行のみ更新が残る』(1177 失敗結果, 1180 失敗時出力)『部分反映は次回実行で回収される』(1183)『100件ごとに変更を反映しキャッシュをクリア』(1168 手順5, 1201)を要求。実装は途中失敗で反映済み行も全て失われ、設計の部分反映モデルと永続化境界が逆。指摘どおり実装違い。
