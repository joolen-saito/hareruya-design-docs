# a06-08_0506_sheet-10_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-08_0506_sheet-10_sheet.json#a06-08_0506_sheet-10_sheet-conformance-10e08e518139`
- 機能: A06-08 A06-08 カード名から買取用商品情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
conditionClasses 配下のフィールド名・型が不一致（設計 productCode/price(string)/stock(string) に対し実装 productClassCode/int|null/int）。

## 判定理由
設計のレスポンス仕様では conditionClasses.<conditionCode> 配下に productCode(string)、price(string 販売価格)、stock(string 在庫数)を返すと明記（HTML 2701行、サンプル 2730-2733行も productCode/"300"/"5"）。実装 BuyingCardsFormatter は 'productClassCode' => $dto->productClassCode（115行）とキー名が productClassCode。price は $dto->standardPrice（117行, DTO 44行 ?int）、stock は $dto->stock（118行, DTO 45行 int）で、いずれも文字列化されない。よってフィールド名と price/stock の型が設計と不一致。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2701-2701` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>cards</code></td><td>object</td><td>1始まりの連番をキーとするオブジェクト。値は各カードの情報。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameJp</code></td><td>string</td><td>カードの日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameEn</code></td><td>string</td><td>カードの英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.imageFileName</code></td><td>string</td><td>カード画像のファイル名。</td></tr><tr><td><code>cards.&lt;n&gt;.details</code></td><td>object</td><td>カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetCode</code></td><td>string</td><td>カードセットのコード。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetName</code></td><td>string</td><td>カードセットの日本語名。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.foilFlg</code></td><td>boolean</td><td>フォイルか否か。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardNo</code></td><td>string</td><td>カード番号。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.promotionName</code></td><td>string</td><td>プロモーションの日本語名。プロモーション未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameJp</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.rarityCode</code></td><td>string</td><td>レアリティのコード。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses</code></td><td>object</td><td>言語コードをキーとするオブジェクト。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses.&lt;languageCode&gt;.conditionClasses</code></td><td>object</td><td>状態コードをキーとするオブジェクト。値は商品規格単位の情報。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.buyPrice</code></td><td>integer</td><td>買取価格。未設定のときはnull。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.price</code></td><td>string</td><td>販売価格（販売価格列の値）。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.sectionId</code></td><td>integer</td><td>部門ID。未設定のときはnull。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:115-118` — 実装(キー名productClassCode)

```php
                'productClassCode' => $dto->productClassCode,
                'buyPrice' => $dto->buyPrice,
                'price' => $dto->standardPrice,
                'stock' => $dto->stock,
```

`ec-cube-enterprise/src/Eccube/Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php:42-45` — 実装(DTO型 int|null / int)

```php
        public string $productClassCode,
        public ?int $buyPrice,
        public ?int $standardPrice,
        public int $stock,
```

## 不在確認コマンド

- `rg -n "'productCode'" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。conditionClasses 配下のJSONキー名が確定的に不一致。設計は productCode（HTML 2701行, サンプル 2730行 "productCode":"P-40001"）だが、実装 BuyingCardsFormatter は 'productClassCode' => $dto->productClassCode（115行）を出力し、キー文字列が異なる。DTO は public string $productClassCode（42行）で product.code ではなく productClass.code AS productClassCode（MtbCardRepository 193行）由来。productCode というキーはフォーマッタ・クエリ双方に存在せず（rg 'productCode' 該当なし）、外部API契約上クライアントは productCode を取得できない。price は $dto->standardPrice（?int, DTO 44行）、stock は (int)キャスト済み int（DTO 45,106行）で、設計の string（2701,2732-2733行 "300"/"5"）と型も相違。キー名の不一致だけでも実装違いは成立。指摘は維持。
