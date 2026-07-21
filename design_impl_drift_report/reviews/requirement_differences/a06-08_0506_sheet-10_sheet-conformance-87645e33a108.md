# a06-08_0506_sheet-10_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-08_0506_sheet-10_sheet.json#a06-08_0506_sheet-10_sheet-conformance-87645e33a108`
- 機能: A06-08 A06-08 カード名から買取用商品情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は該当なし時に404を返すが、実装は name 空・検索0件のいずれも HTTP 200 で cards を返す。

## 判定理由
設計は取得結果が空の場合はページが見つからない扱い（404）とし標準例外応答JSONを返すと明記（HTML 2639,2689,2704行）。実装 getByCardName は name 空のとき new JsonResponse(['cards'=>[]])（105行）で HTTP 200 を返し、検索結果が空でも NotFoundException を投げず formatter が ['cards'=>new stdClass()]（BuyingCardsFormatter 123行）を返し HTTP 200 になる。NotFoundException はカード詳細ID取得メソッド（58行）にしか存在せず、カード名検索経路には404分岐が無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2689-2704` — 設計要求

```html
          <ol><li>クエリパラメータの検索条件（カード名等）を受け取る。</li><li>商品のリポジトリから、条件に一致する買取用商品を取得する。</li><li>取得結果が空の場合はページが見つからない扱い（404）とする。</li><li>取得できた場合は、カードの一覧を1始まりの索引で整形してJSONで返す。</li></ol>
          <hr>
          <h2 id="function-design-a06-08-a06-08_api_store_purchase_buying_products_search-集計条件">集計条件</h2>
          <div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>取得対象</td><td>クエリパラメータ（カード名等）の条件に一致する買取用商品。</td></tr><tr><td>応答整形</td><td>カードの一覧を1始まりの索引付きで返す。</td></tr></tbody></table></div>
          <hr>
          <h2 id="function-design-a06-08-a06-08_api_store_purchase_buying_products_search-入出力">入出力</h2>
          <h3 id="function-design-a06-08-a06-08_api_store_purchase_buying_products_search-リクエスト">リクエスト</h3>
          <div class="table-wrap"><table><thead><tr><th>パラメータ</th><th>位置</th><th>型</th><th>必須／任意</th><th>説明</th></tr></thead><tbody><tr><td><code>name</code></td><td>クエリ</td><td>string</td><td>任意</td><td>カード名（商品名）の前方一致検索キー。商品名がこの値で始まる買取用商品を取得する。<code>%</code>と<code>_</code>はエスケープして扱う。</td></tr></tbody></table></div>
          <p><code>name</code>は@QueryParam（パラメータフェッチャ）で受け取る。既定値・必須指定・書式制約はいずれも実装で定義していない。</p>
          <h3 id="function-design-a06-08-a06-08_api_store_purchase_buying_products_search-レスポンス-成功">レスポンス（成功）</h3>
          <p>HTTP 200。</p>
          <p>応答は<code>cards</code>オブジェクトを最上位に持つ。検索で得たカードを1始まりの連番でキー付けし直して格納する。各カードの配下はカード詳細ID（<code>details</code>）、言語コード（<code>languageClasses</code>）、状態コード（<code>conditionClasses</code>）の順で入れ子になる。</p>
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>cards</code></td><td>object</td><td>1始まりの連番をキーとするオブジェクト。値は各カードの情報。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameJp</code></td><td>string</td><td>カードの日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameEn</code></td><td>string</td><td>カードの英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.imageFileName</code></td><td>string</td><td>カード画像のファイル名。</td></tr><tr><td><code>cards.&lt;n&gt;.details</code></td><td>object</td><td>カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetCode</code></td><td>string</td><td>カードセットのコード。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetName</code></td><td>string</td><td>カードセットの日本語名。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.foilFlg</code></td><td>boolean</td><td>フォイルか否か。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardNo</code></td><td>string</td><td>カード番号。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.promotionName</code></td><td>string</td><td>プロモーションの日本語名。プロモーション未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameJp</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.rarityCode</code></td><td>string</td><td>レアリティのコード。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses</code></td><td>object</td><td>言語コードをキーとするオブジェクト。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses.&lt;languageCode&gt;.conditionClasses</code></td><td>object</td><td>状態コードをキーとするオブジェクト。値は商品規格単位の情報。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.buyPrice</code></td><td>integer</td><td>買取価格。未設定のときはnull。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.price</code></td><td>string</td><td>販売価格（販売価格列の値）。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.sectionId</code></td><td>integer</td><td>部門ID。未設定のときはnull。</td></tr></tbody></table></div>
          <p>ページング用の件数フィールド（<code>total_count</code>・<code>per_page</code>等）は持たない。</p>
          <h3 id="function-design-a06-08-a06-08_api_store_purchase_buying_products_search-レスポンス-失敗">レスポンス（失敗）</h3>
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>条件に一致する買取用商品が無い</td><td>標準の例外応答（メッセージを含むJSON）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:104-105` — 実装(name空で200返却)

```php
        if (empty($cardName)) {
            return new JsonResponse(['cards' => []]);
```

`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:123-123` — 実装(0件でもstdClassを200返却)

```php
        return ['cards' => empty($cards) ? new \stdClass() : $cards];
```

## 不在確認コマンド

- `rg -n "NotFoundException" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。404 要求は二次資料だけでなくExcel原本のステータスコード表（HTML 2639行「404 指定された名称に紐づく商品が見つからなかった場合」）に明記されており、リバース設計（2689,2704行）とも一致する強い要求。実装は BuyingController::getByCardName で name 空時に return new JsonResponse(['cards'=>[]]) を HTTP200 で返し（104-105行）、検索0件でも format() が ['cards'=>new stdClass()] を200で返す（BuyingCardsFormatter 123行）。NotFoundException は getByCardDetailId（58行）にのみ存在し、search 経路には404分岐が皆無。JsonResponse を直接返しており404へ変換する上位ハンドラも無い。別ルート・別実装を確認したが該当なし。指摘は維持。
