# b02-07_0402_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-07_0402_sheet-6_sheet.json#b02-07_0402_sheet-6_sheet-conformance-83bef25206c8`
- 機能: B02-07 B02-07 週間在庫履歴更新バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
対象データを商品在庫の全商品規格IDとする設計に対し、実装は在庫履歴テーブルを起点に集計するため履歴が1件も無い商品在庫が出力対象から欠落する。

## 判定理由
設計(集計条件/処理フロー)は『商品在庫に存在する全商品規格ID』を対象とし、商品在庫から全規格IDを取得したうえで在庫履歴が無い週は0とする、と明記。しかし実装 DtbWeeklyStockHistoryTempRepository::getStockData の SQL は FROM dtb_stock_history sh を起点に WHERE sh.product_stock_id BETWEEN :start AND :end で GROUP BY sh.product_stock_id している。よって在庫履歴行が1件も存在しない product_stock_id は結果行自体が生成されず、一時テーブル(insertBatch)にも本テーブル(replaceFromTemp)にもコピーされない。週欠損は CASE WHEN...ELSE NULL→0 で0化されるが、これは履歴が1件でもある product_stock_id 内の週単位のみで、商品在庫単位で全欠損の場合は行が作られない。BatchUpdateWeeklyStockHistoryAction は getLastProductStockId() で ProductStock の MAX(id) を取り offset を刻むが、実クエリの FROM は dtb_stock_history のままで ProductStock 起点の LEFT JOIN 等の反証実装はリポジトリ内に存在しない。設計要求と実装の集計起点が食い違う実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1351-1351` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>対象データ</td><td>商品在庫に存在する全商品規格ID。</td></tr><tr><td>各週の在庫</td><td>当日から対象週数を引いた日付以前で作成日が最も新しい在庫履歴の在庫を1件取得する。</td></tr><tr><td>集計期間</td><td>当日基準で1週前から11週前までの各週末。</td></tr><tr><td>欠損時</td><td>該当する在庫履歴が無い場合は0とする。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
FROM が dtb_stock_history 起点で GROUP BY sh.product_stock_id のため履歴無しの商品在庫が脱落
`ec-cube-enterprise/src/Eccube/Repository/DtbWeeklyStockHistoryTempRepository.php:72-78` — 実装(集計SQL)

```php
                {$query}
            FROM
                dtb_stock_history sh
            WHERE
                sh.product_stock_id BETWEEN :start AND :end
            GROUP BY
                sh.product_stock_id
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。実装確認済み。DtbWeeklyStockHistoryTempRepository::getStockData(72-79行)の SQL は FROM dtb_stock_history sh / WHERE sh.product_stock_id BETWEEN :start AND :end / GROUP BY sh.product_stock_id で、引用は正確。出力行の母集団は dtb_stock_history のみで、履歴行が1件も無い product_stock_id はグループ自体が生成されず脱落する。ProductStock は getLastProductStockId()(148-159行)の MAX(id) 取得＝offset範囲の上限決定にしか使われず、母集団供給の LEFT JOIN/UNION は無い。rg 'ProductStock|dtb_product_stock' で対象3ファイルを横断したが ProductStock 起点の集計は皆無。別実装(StockRecommendCsvExportService 等)も出力ではなく本テーブルを読む側で、集計母集団を補完しない。DtbWeeklyStockHistoryRepository::copyDataFromTemp/replaceFromTemp(34-81行)は temp→本の単純コピーで欠落を埋めない。テストはリポジトリを mock しており SQL 母集団挙動を検証していないため反証にならない。設計 1345/1348/1350-1351 は『商品在庫に存在する全商品規格ID』を対象と明記し、Ph2/対象外/現行踏襲の除外注記も該当行近傍に無い(1330の対象外リストは在庫履歴作成等で本要求ではない)。指摘は維持。
