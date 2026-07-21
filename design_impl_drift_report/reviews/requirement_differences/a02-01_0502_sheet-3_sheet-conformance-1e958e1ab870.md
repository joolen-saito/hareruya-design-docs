# a02-01_0502_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-01_0502_sheet-3_sheet.json#a02-01_0502_sheet-3_sheet-conformance-1e958e1ab870`
- 機能: A02-01 A02-01 ポップアップ用商品情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
price01/price02/stock/weeklySold を設計は数値文字列(string)で返す契約だが、実装は integer 型で返す。

## 判定理由
設計(行986)は price01・price02・stock を string(『Doctrineのdecimal値のため数値文字列で返す』)、weeklySold を string(『集計（SUM）結果のため数値文字列で返す』)と定義し、基本設計のレスポンスサンプル(行927 "price02": "50"、行928 "stock": "17"、行935 "weeklySold": "1")および詳細設計サンプル(行995-1004)も全て引用符付き=文字列で示す。一方 ec-cube-enterprise の ProductRepository::findPopupProductByProductId のResultSetMapping(ProductRepository.php:2163-2170)は price01・price02・stock・weeklySold を全て 'integer' scalar として取得し、PopupResponseBuilder::build(PopupResponseBuilder.php:33-41)は price01/price02 をそのまま、stock/weeklySold を (int) キャストで返す。よって JSON 上は数値(非引用符)となり、設計の数値文字列契約と異なる。文字列へ整形する別処理を PopupResponseBuilder と当リポジトリメソッドで確認したが無い。なお基本設計の型列(行906-908,915)は『数値(整数)』とも記すため設計内に型表記の不整合はあるが、両サンプルJSONと詳細設計の型定義が string を示すため、外部JSON契約としては文字列で、実装の integer は実装違いと判定。confidence は設計内不整合を考慮し medium。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:986-986` — 設計要求(成功レスポンス型=string)

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>name</code></td><td>string</td><td>商品名。</td></tr><tr><td><code>productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>price01</code></td><td>string</td><td>通常価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>price02</code></td><td>string</td><td>販売価格。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>stock</code></td><td>string</td><td>在庫数。Doctrineのdecimal値のため数値文字列で返す。</td></tr><tr><td><code>nameEn</code></td><td>string</td><td>英語商品名。</td></tr><tr><td><code>subFileName</code></td><td>string</td><td>商品規格画像のファイル名。該当が無い場合はnull。</td></tr><tr><td><code>fileName</code></td><td>string</td><td>商品画像のファイル名。該当が無い場合はnull。</td></tr><tr><td><code>code</code></td><td>string</td><td>言語コード。</td></tr><tr><td><code>conditionCode</code></td><td>string</td><td>カードコンディションコード。</td></tr><tr><td><code>foilFlg</code></td><td>boolean</td><td>フォイル区分。</td></tr><tr><td><code>weeklySold</code></td><td>string</td><td>週間販売数。集計（SUM）結果のため数値文字列で返す。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
price01/price02/stock/weeklySold を integer で取得
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2163-2170` — 実装(リポジトリ scalar=integer)

```php
        $rsm->addScalarResult('price01', 'price01', 'integer');
        $rsm->addScalarResult('price02', 'price02', 'integer');
        $rsm->addScalarResult('stock', 'stock', 'integer');
        $rsm->addScalarResult('languagecode', 'languageCode', 'string');
        $rsm->addScalarResult('conditioncode', 'conditionCode', 'string');
        $rsm->addScalarResult('foilflg', 'foilFlg', 'boolean');
        $rsm->addScalarResult('imagefilename', 'imageFileName', 'string');
        $rsm->addScalarResult('weeklysold', 'weeklySold', 'integer');
```

stock/weeklySold を (int) にキャストして返す
`ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:33-41` — 実装(ビルダで int キャスト)

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

反証を試みた結果、指摘は覆らなかった。引用は正確。設計はレスポンス型を string と定義: 詳細設計(986)で price01/price02/stock/weeklySold を string(『Doctrineのdecimal値/SUM結果のため数値文字列で返す』)、詳細設計サンプル(995-1004)も引用符付き、基本設計サンプル(927 price02:"50", 928 stock:"17", 935 weeklySold:"1")も文字列。実装は ProductRepository.php:2163-2170 で price01/price02/stock/weeklySold を全て 'integer' scalar 取得、PopupResponseBuilder.php:33-41 で price01/price02 素通し・stock/weeklySold (int)キャスト→ JSON上は数値。反証を2つ以上試したが不成立: (1)最有力の反証=基本設計の型列(906-908,915)が『数値(整数)』で実装のinteger と一致する点。しかし同一の基本設計内サンプル(927-935)自身が文字列で示し矛盾、型列は緩い注記に過ぎず、JSON契約の代表は両文書のサンプル(全て文字列)。 (2)現行踏襲の検証→pf-api(現行系)の DtbProductClass エンティティは stock/price01/price02 を @var string(Doctrine decimal→PHP文字列, pf-api Entity/DtbProductClass.php:23-50)、weeklySold は SUM集計(DtbProductSubClassRepository.php:237)で文字列。よって現行系は文字列を返しており『現行踏襲』契約は string。ec-cube の integer 化は現行契約からの逸脱。 (3)別整形処理探索→ PopupResponseBuilder/該当リポジトリメソッドに文字列整形なし。反証根拠が逆に指摘を補強した。指摘は維持。
