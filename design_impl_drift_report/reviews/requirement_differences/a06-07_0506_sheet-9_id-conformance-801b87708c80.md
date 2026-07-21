# a06-07_0506_sheet-9_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-07_0506_sheet-9_id.json#a06-07_0506_sheet-9_id-conformance-801b87708c80`
- 機能: A06-07 A06-07 商品IDリストから買取用商品情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は0件時の応答全体を空配列 [] とするが、実装は cards キー付きオブジェクト（{"cards":[]} または {"cards":{}}）を返す。

## 判定理由
設計書レスポンス（成功）節（2280行）に『0件のときは空配列を返す。』、フィールド表（2281行）に『0件のときは応答全体が空配列。』、0件時の応答例（2324行）に literal で `[]` が明記され、0件時のトップレベル応答は空配列 [] が正である。実装 BuyingController::getByProductIds では、ids が空／非数値のみのとき 81行 `return new JsonResponse(['cards' => []]);` を返し、これは JSON 上 {"cards":[]} となる。数値ID指定で検索0件のときは 91-93行で formatter を経由し、BuyingCardsFormatter::format の 123行 `return ['cards' => empty($cards) ? new \stdClass() : $cards];` により {"cards":{}} を返す。いずれの0件経路でも設計が求めるトップレベル [] ではなく cards キー付きオブジェクトを返しており、外部JSON契約が設計と一致しない。0件を正常応答とする点自体（エラーにしない挙動）は実装も満たすが、応答の形（空配列 vs cardsオブジェクト）が設計と異なるため実装違い。同ルート/別経路の確認として POST /buying/products (api_buying_products, 67行) 以外に該当応答を返す箇所は無く、formatter が唯一の整形経路である。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2280-2281` — 設計要求（0件時応答＝空配列）

```html
          <p>応答はカードIDをキーとする<code>cards</code>オブジェクトを最上位に持つ階層構造とする。各カードの配下にカード詳細ID（<code>details</code>）、言語コード（<code>languageClasses</code>）、状態コード（<code>conditionClasses</code>）の順で入れ子になる。0件のときは空配列を返す。</p>
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>cards</code></td><td>object</td><td>カードIDをキーとするオブジェクト。値は各カードの情報。0件のときは応答全体が空配列。</td></tr><tr><td><code>cards.&lt;cardId&gt;.cardNameJp</code></td><td>string</td><td>カードの日本語名。</td></tr><tr><td><code>cards.&lt;cardId&gt;.cardNameEn</code></td><td>string</td><td>カードの英語名。</td></tr><tr><td><code>cards.&lt;cardId&gt;.imageFileName</code></td><td>string</td><td>カード画像のファイル名。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details</code></td><td>object</td><td>カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.cardsetCode</code></td><td>string</td><td>カードセットのコード。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.cardsetName</code></td><td>string</td><td>カードセットの日本語名。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.foilFlg</code></td><td>boolean</td><td>フォイルか否か。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.cardNo</code></td><td>string</td><td>カード番号。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.promotionName</code></td><td>string</td><td>プロモーションの日本語名。プロモーション未設定のときはnull。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.productNameJp</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.productNameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.rarityCode</code></td><td>string</td><td>レアリティのコード。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.languageClasses</code></td><td>object</td><td>言語コードをキーとするオブジェクト。</td></tr><tr><td><code>cards.&lt;cardId&gt;.details.&lt;detailId&gt;.languageClasses.&lt;languageCode&gt;.conditionClasses</code></td><td>object</td><td>状態コードをキーとするオブジェクト。値は商品規格単位の情報。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.buyPrice</code></td><td>integer</td><td>買取価格。未設定のときはnull。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.price</code></td><td>string</td><td>販売価格（販売価格列の値）。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.sectionId</code></td><td>integer</td><td>部門ID。未設定のときはnull。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
ids が空または非数値のみのとき cards キー付き空配列を返す
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:80-81` — 実装（ids空/非数値時）

```php
        if (empty($productIds)) {
            return new JsonResponse(['cards' => []]);
```

数値ID指定で検索0件のとき cards に stdClass を入れ {"cards":{}} を返す
`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123-123` — 実装（検索0件時）

```php
        return ['cards' => empty($cards) ? new \stdClass() : $cards];
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)引用検証: 設計側は 2280行『0件のときは空配列を返す』, 2281行フィールド表『0件のときは応答全体が空配列』, 2283行『0件時もHTTP 200で空配列を返す』, 2324行の0件応答例が literal `[]` と、トップレベル空配列を4回明記。実装側も Controller:81 `return new JsonResponse(['cards' => []]);`（JSON上 {"cards":[]}）と Formatter:123 `return ['cards' => empty($cards) ? new \stdClass() : $cards];`（0件で {"cards":{}}）を実ファイルで確認、いずれもトップレベル [] を返さない。引用は全て正確。(2)別実装: `rg buying/products|api_buying_products|getByProductIds` の結果、当該応答を返すのは BuyingController::getByProductIds(67-94) の単一ルートのみ。V2や別Controllerは無し。KernelEvents::VIEW/RESPONSE のリスナはテンプレート系(MissingLocaleTemplateRedirectListener/TemplateUpdateListener)のみで JSON応答を再整形するSubscriber・Normalizerは MTGBuyer 名前空間に存在せず、JsonResponse の json_encode を経て {"cards":...} がそのまま出力される。(3)設計側除外の検討: 2261行『挙動（取得条件・0件許容）は現行（pf-api）を正とする』は“0件をエラーにしない許容挙動”を pf-api準拠とする注記であり、応答の形（[] vs cardsオブジェクト）を実装任せにする免責ではない。むしろ設計は形を [] と明示。加えて同名前空間の他エンドポイント(BuyOrderIndivisualInputProductController:44/56, BuyMainCardController:44/56)は0件で `new JsonResponse([])` とトップレベル [] を返しており、[] が想定慣習である裏付けとなる（本エンドポイントだけが逸脱）。(4)要求読み違い・重複も該当なし。設計が [] を要求し実装が {"cards":[]}/{"cards":{}} を返す外部JSON契約の相違は実在する。
