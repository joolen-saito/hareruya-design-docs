# a02-04_0502_sheet-6_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-04_0502_sheet-6_id.json#a02-04_0502_sheet-6_id-conformance-571f2ae20163`
- 機能: A02-04 A02-04 ポップアップ用カード情報取得（旧商品ID）
- 観点: ⑦要求網羅・実装違い

## 要旨
price01/price02/stock/weeklySold を設計は数値文字列(string)で返す想定だが、実装は integer で返す。

## 判定理由
設計 line 1566 の成功レスポンス表は price01/price02/stock を string（Doctrineのdecimal値のため数値文字列）、weeklySold を string（集計SUM結果のため数値文字列）と定める。両サンプル(line 1510-1518, 1575-1581)も "50"/"17"/"1" 等の文字列で示す。実装は旧商品ID用の ProductRepository.php:findPopupProductByOldProductId(2404-) の RSM で price01/price02/stock/weeklySold をいずれも 'integer' スカラにマッピング(2463-2465,2470)し、PopupResponseBuilder.php:35,41 で stock・weeklySold を (int) にキャストして返す。したがって JSON は整数で返り、設計の数値文字列契約と一致しない。旧商品IDレスポンスで文字列化する処理は見当たらないため実装違いと確認した。（なお元指摘の行番号 2356-2363 は findPopupProductByCardId 側の行で誤り。正しくは 2463-2470。）

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1566-1566` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>name</code></td><td>string</td><td>商品名。</td></tr><tr><td><code>productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>price01</code></td><td>string</td><td>通常価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>price02</code></td><td>string</td><td>販売価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>stock</code></td><td>string</td><td>在庫数。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>nameEn</code></td><td>string</td><td>英語商品名。</td></tr><tr><td><code>subFileName</code></td><td>string</td><td>商品規格画像のファイル名。該当が無い場合はnull。</td></tr><tr><td><code>fileName</code></td><td>string</td><td>商品画像のファイル名。該当が無い場合はnull。</td></tr><tr><td><code>weeklySold</code></td><td>string</td><td>週間販売数。集計（SUM）結果のため数値文字列で返す。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
旧商品ID用メソッドの integer マッピング
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2458-2470` — 実装(RSM型)

```php
        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('productid', 'productId', 'integer');
        $rsm->addScalarResult('productname', 'productName', 'string');
        $rsm->addScalarResult('nameen', 'nameEn', 'string');
        $rsm->addScalarResult('productclassid', 'productClassId', 'integer');
        $rsm->addScalarResult('price01', 'price01', 'integer');
        $rsm->addScalarResult('price02', 'price02', 'integer');
        $rsm->addScalarResult('stock', 'stock', 'integer');
        $rsm->addScalarResult('languagecode', 'languageCode', 'string');
        $rsm->addScalarResult('conditioncode', 'conditionCode', 'string');
        $rsm->addScalarResult('belturl', 'beltUrl', 'string');
        $rsm->addScalarResult('imagefilename', 'imageFileName', 'string');
        $rsm->addScalarResult('weeklysold', 'weeklySold', 'integer');
```

stock/weeklySold を int キャスト
`ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:33-41` — 実装(応答整形)

```php
            'price01' => $result['price01'],
            'price02' => $result['price02'],
            'stock' => (int) ($result['stock'] ?? 0),
            'nameEn' => $result['nameEn'],
            'subFileName' => $result['imageFileName'],
            'fileName' => $result['imageFileName'],
            'code' => $result['languageCode'],
            'conditionCode' => $result['conditionCode'],
            'weeklySold' => (int) ($result['weeklySold'] ?? 0),
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。最強の反証候補=設計の内部矛盾を検討した。Excel項目表(line1497周辺)は price01/price02/stock/weeklySold を『数値(整数)』=integer と宣言しており、実装(integer)と一致するように見える。しかし同一Excelシート自身のサンプルレスポンス(line1508-1518)は "price02":"50", "stock":"17", "weeklySold":"1" と全て引用符付き文字列で示す。すなわちExcel内部でも『型欄=integer』と『サンプル=string』が矛盾し、具体的なJSONワイヤ契約であるサンプルは string。詳細設計(リバース)line1566 はこの曖昧さを明示的に解消し price01/price02/stock=『Doctrineのdecimal値のため数値文字列で返す』、weeklySold=『集計(SUM)結果のため数値文字列で返す』と理由付きで string を規定、そのサンプル(line1575-1581)も "500.00"/"12.00"/"3" と文字列。4記述中サンプル×2+リバース型表の計3つが string。実装検証: ProductRepository.php:findPopupProductByOldProductId の RSM は price01/price02/stock/weeklySold を全て addScalarResult(...,'integer') でマッピング(Doctrine integer型→PHP int)、PopupResponseBuilder.php:33-34 は price01/price02 を素通し(既にint)、35/41 で stock/weeklySold を (int) キャスト。$this->json()→json_encode で非引用の整数(例 500)を出力し、全サンプルの引用文字列と不一致。同一review set が a4fac59479b1 を『サンプルが項目表を上書きする』論理で REFUTED した基準を本件へ一貫適用すると、サンプル=string / 実装=integer の観測可能な差異は CONFIRMED を支持する。文字列化処理も別ルートも見当たらず反証不成立。
