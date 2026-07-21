# a02-05_0502_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-05_0502_sheet-7_sheet.json#a02-05_0502_sheet-7_sheet-conformance-8ebccee366bd`
- 機能: A02-05 A02-05 更新商品規格取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は result[].stock と result[].price02 を string で返すと定めるが、実装は ResultSetMapping で integer にマッピングし数値として返す。

## 判定理由
詳細設計のレスポンス表(1810行)は `result[].stock` と `result[].price02` の型を string と明記し、詳細設計サンプル(1827-1828行)も "5"/"300" と引用符付き文字列、基本設計サンプル(1709-1710行)も "1"/"6000" と文字列で示す。実装 ProductRepository::findProductClassesByUpdateDate の ResultSetMapping は `addScalarResult('stock', 'stock', 'integer')`(2252行)、`addScalarResult('price02', 'price02', 'integer')`(2253行) で PHP int に変換し、Controller は `$results` を整形なしで JSON 化する(234-237行)ため JSON では数値として出力される。設計は文字列契約であり、対象API用の文字列キャストや ResponseBuilder は反証検索でも見つからないため実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1810-1810` — 設計要求(詳細設計レスポンス定義: string型)

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>count</code></td><td>integer</td><td>取得した商品規格の件数。</td></tr><tr><td><code>result</code></td><td>array</td><td>商品規格行の配列。各要素は以下のフィールドを持つオブジェクト。0件のときは空配列。</td></tr><tr><td><code>result[].productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>result[].productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>result[].name</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>result[].nameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>result[].descriptionDetail</code></td><td>string</td><td>商品説明（詳細）。</td></tr><tr><td><code>result[].descriptionDetailEn</code></td><td>string</td><td>商品説明（詳細・英語）。</td></tr><tr><td><code>result[].statusId</code></td><td>integer</td><td>商品ステータスのID。</td></tr><tr><td><code>result[].statusName</code></td><td>string</td><td>商品ステータスの名称。</td></tr><tr><td><code>result[].stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>result[].price02</code></td><td>string</td><td>販売価格列の値。</td></tr><tr><td><code>result[].imageFileName</code></td><td>string</td><td>商品画像ファイル名を連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].categoryId</code></td><td>string</td><td>カテゴリIDを連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].categoryName</code></td><td>string</td><td>カテゴリ名を連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].strageCodeId</code></td><td>integer</td><td>保管コードのID。未設定のときはnull。</td></tr><tr><td><code>result[].storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>result[].languageCode</code></td><td>string</td><td>言語コード。未設定のときはnull。</td></tr><tr><td><code>result[].cardsetCode</code></td><td>string</td><td>カードセットのコード。未設定のときはnull。</td></tr><tr><td><code>result[].cardConditionCode</code></td><td>string</td><td>カード状態のコード。未設定のときはnull。</td></tr><tr><td><code>result[].productClassUpdateDate</code></td><td>string</td><td>商品規格の更新日時。</td></tr><tr><td><code>result[].productUpdateDate</code></td><td>string</td><td>商品情報の更新日時。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
設計 string に対し integer マッピング
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2252-2253` — ResultSetMapping: stock/price02 を integer 変換

```php
        $rsm->addScalarResult('stock', 'stock', 'integer');
        $rsm->addScalarResult('price02', 'price02', 'integer');
```

文字列キャストなし
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:234-237` — Controllerが整形なしで返却

```php
            return $this->json([
                'count' => count($results),
                'result' => $results,
            ], Response::HTTP_OK);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。実装 ProductRepository.php の ResultSetMapping は addScalarResult('stock','stock','integer')・addScalarResult('price02','price02','integer') で PHP int に変換し、Controller は文字列キャスト無しで $this->json(...) するため JSON では数値出力。src に (string)/strval/ResponseBuilder 等の型変換は無し。設計側は詳細設計レスポンス表1810行が result[].stock string・result[].price02 string と明記し、基本設計サンプル("stock":"1","price02":"6000")と詳細設計サンプル("stock":"5","price02":"300") の両サンプルとも引用符付き文字列で示す。反証観点として設計内矛盾を指摘しておく: 基本設計のフィールド表(1685行付近)は result.stock/result.price02 を『数値(整数)』と記し、この一箇所のみ実装(integer)と一致する。しかし成功応答の契約を定める詳細設計レスポンス表と2つのJSONサンプルはいずれも string を要求しており、ワイヤ形式の意図はstringと読むのが妥当。よって integer 出力の乖離は事実(設計内に整数記載が1箇所ある点は付記)。
