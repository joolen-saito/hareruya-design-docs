# a02-03_0502_sheet-5_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-03_0502_sheet-5_id.json#a02-03_0502_sheet-5_id-conformance-a04cfa7b043f`
- 機能: A02-03 A02-03 ポップアップ用商品情報取得（旧商品ID）
- 観点: ⑦要求網羅・実装違い

## 要旨
price01/price02/stock を設計は string（数値文字列）とするが実装は integer 型で返す。

## 判定理由
設計の成功レスポンス表（1379行）は price01・price02・stock の型を string とし『Doctrineのdecimal値のため数値文字列で返す』と明記、サンプルも "500.00"/"480.00"/"12.00" と文字列。実装 ProductRepository::findPopupProductByOldProductId の ResultSetMapping は price01/price02/stock をいずれも addScalarResult(..., 'integer') で取得し、さらに PopupResponseBuilder::build は stock を (int) にキャストして返す。よって数値文字列ではなく整数型で応答される実装違い。findPopupProductByOldProductIdWithoutLang 側も同一のRSM整数マッピングを用いており別経路でも string 化されていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1379-1379` — 設計要求（成功レスポンスの型）

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>name</code></td><td>string</td><td>商品名。</td></tr><tr><td><code>productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>price01</code></td><td>string</td><td>通常価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>price02</code></td><td>string</td><td>販売価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>stock</code></td><td>string</td><td>在庫数。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>nameEn</code></td><td>string</td><td>英語商品名。</td></tr><tr><td><code>fileName</code></td><td>string</td><td>商品画像のファイル名。</td></tr><tr><td><code>cardId</code></td><td>integer</td><td>紐づくカードID。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2463-2465` — RSMがprice01/price02/stockをintegerで取得

```php
        $rsm->addScalarResult('price01', 'price01', 'integer');
        $rsm->addScalarResult('price02', 'price02', 'integer');
        $rsm->addScalarResult('stock', 'stock', 'integer');
```

`ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:33-35` — PopupResponseBuilderがstockを(int)キャスト

```php
            'price01' => $result['price01'],
            'price02' => $result['price02'],
            'stock' => (int) ($result['stock'] ?? 0),
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが不成立。(1)引用検証: 設計 HTML 1379行の成功レスポンス表で price01/price02/stock は型 string、『Doctrineのdecimal値のため数値文字列で返す』と明記、1388-1390行サンプルも "500.00"/"480.00"/"12.00" と文字列。(2)実装検証: A02-03 該当関数 findPopupProductByOldProductId(2404行) の RSM 2463-2465 は price01/price02/stock を addScalarResult(...,'integer') で取得（Doctrine IntegerType が (int) 変換）。別経路 findPopupProductByOldProductIdWithoutLang(2491行) の RSM 2543-2545 も同一の integer マッピング。PopupResponseBuilder::build(33-35) は price01/price02 を int のまま透過、stock は (int) キャスト。よって数値文字列化する箇所は無い。(3)別実装探索: 兄弟 popup 関数（ByProductId/ByCardId 等 2163-2165,2376-2378 ほか）も全て integer マッピングで、string を返す代替実装は存在しない。$this->json() の Symfony シリアライズも int を int のまま出力。結論: price01/price02/stock は整数型で応答され設計の string と不一致。指摘は維持。
