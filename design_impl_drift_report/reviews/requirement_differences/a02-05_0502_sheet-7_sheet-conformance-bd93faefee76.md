# a02-05_0502_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-05_0502_sheet-7_sheet.json#a02-05_0502_sheet-7_sheet-conformance-bd93faefee76`
- 機能: A02-05 A02-05 更新商品規格取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は保管コードIDのレスポンスキーを result[].strageCodeId と定めるが、実装は storageCodeId を返しており、設計どおりのキー名では取得できない。

## 判定理由
設計HTMLは基本設計のレスポンス表(1685行)・詳細設計のレスポンス表(1810行)・サンプル応答(1714,1736,1832行)のいずれも一貫して `strageCodeId`（typo綴り）を用いる。実装 ProductRepository::findProductClassesByUpdateDate では SQL が `sc.id AS storageCodeId`(2218行)、ResultSetMapping が第2引数 `storageCodeId`(2257行) を使い、getArrayResult() の配列キーは `storageCodeId` になる。Controller getUpdatedProductClasses は `$results` をキー変換せず `'result' => $results` としてそのまま JSON 化する(234-237行)。`strageCodeId` は src 全体に存在せず(`rg -rn 'strageCodeId' src/` が exit=1)、別ルート・別クラス・キー変換層でも設計綴りへの変換は見つからない。よって設計綴り `strageCodeId` と実装出力 `storageCodeId` の実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1810-1810` — 設計要求(詳細設計レスポンス定義)

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>count</code></td><td>integer</td><td>取得した商品規格の件数。</td></tr><tr><td><code>result</code></td><td>array</td><td>商品規格行の配列。各要素は以下のフィールドを持つオブジェクト。0件のときは空配列。</td></tr><tr><td><code>result[].productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>result[].productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>result[].name</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>result[].nameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>result[].descriptionDetail</code></td><td>string</td><td>商品説明（詳細）。</td></tr><tr><td><code>result[].descriptionDetailEn</code></td><td>string</td><td>商品説明（詳細・英語）。</td></tr><tr><td><code>result[].statusId</code></td><td>integer</td><td>商品ステータスのID。</td></tr><tr><td><code>result[].statusName</code></td><td>string</td><td>商品ステータスの名称。</td></tr><tr><td><code>result[].stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>result[].price02</code></td><td>string</td><td>販売価格列の値。</td></tr><tr><td><code>result[].imageFileName</code></td><td>string</td><td>商品画像ファイル名を連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].categoryId</code></td><td>string</td><td>カテゴリIDを連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].categoryName</code></td><td>string</td><td>カテゴリ名を連結した文字列（カンマ区切り）。</td></tr><tr><td><code>result[].strageCodeId</code></td><td>integer</td><td>保管コードのID。未設定のときはnull。</td></tr><tr><td><code>result[].storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>result[].languageCode</code></td><td>string</td><td>言語コード。未設定のときはnull。</td></tr><tr><td><code>result[].cardsetCode</code></td><td>string</td><td>カードセットのコード。未設定のときはnull。</td></tr><tr><td><code>result[].cardConditionCode</code></td><td>string</td><td>カード状態のコード。未設定のときはnull。</td></tr><tr><td><code>result[].productClassUpdateDate</code></td><td>string</td><td>商品規格の更新日時。</td></tr><tr><td><code>result[].productUpdateDate</code></td><td>string</td><td>商品情報の更新日時。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
保管コードIDを storageCodeId として SELECT
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2218-2218` — SQLエイリアス

```php
    sc.id AS storageCodeId,
```

配列キーが storageCodeId になる
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2257-2257` — ResultSetMappingキー

```php
        $rsm->addScalarResult('storagecodeid', 'storageCodeId', 'integer');
```

storageCodeId→strageCodeId の変換なし
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:234-237` — Controllerがキー変換なしで返却

```php
            return $this->json([
                'count' => count($results),
                'result' => $results,
            ], Response::HTTP_OK);
```

## 不在確認コマンド

- `rg -rn 'strageCodeId' /home/y-saito/Developments/ec-cube-enterprise/src`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。(1)引用検証: 設計HTMLは基本設計フィールド表(result.strageCodeId 数値(整数) ストレージコードID)・基本設計サンプル("strageCodeId": 1449)・詳細設計レスポンス表1810行(result[].strageCodeId integer 保管コードのID)・詳細設計サンプル("strageCodeId": null)の全4箇所で一貫してtypo綴り strageCodeId を使用。実装 ProductRepository.php はSQLで sc.id AS storageCodeId、addScalarResult('storagecodeid','storageCodeId','integer') と正綴り storageCodeId を出力。(2)別実装/キー変換の探索: `rg -rn 'strageCodeId' src/` は exit=1 で src 全体に存在せず、リポジトリ全体でも0件。Controller getUpdatedProductClasses(206行) は $results をキー変換せず $this->json(['count'=>count($results),'result'=>$results]) でそのまま返却(234-237行)、Subscriber/Serializer/Normalizer経由の改名も無し。よって設計綴り strageCodeId と実装出力 storageCodeId のキー名不一致は事実で、設計どおりにコーディングしたクライアントは当該フィールドを取得できない。設計側のtypoである可能性は高いが、乖離事実そのものは覆らない。
