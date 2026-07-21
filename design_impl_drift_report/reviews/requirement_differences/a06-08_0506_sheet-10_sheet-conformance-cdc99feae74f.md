# a06-08_0506_sheet-10_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-08_0506_sheet-10_sheet.json#a06-08_0506_sheet-10_sheet-conformance-cdc99feae74f`
- 機能: A06-08 A06-08 カード名から買取用商品情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は cards を1始まりの連番でキー付けし直すが、実装は DB の cardId をそのままキーにしている。

## 判定理由
設計は応答の cards を、検索で得たカードを1始まりの連番でキー付けし直して格納すると明記し、サンプルも "1" キー（HTML 2700,2701,2709行）。実装 BuyingCardsFormatter::format は $cardId = $dto->cardId（68行）を $cards[$cardId]（75行）のキーにして返し、1,2,3... への array_values 等の再採番処理が無い。よってカードIDが 10001 なら cards.10001 になり設計の連番キーと不一致。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2700-2701` — 設計要求

```html
          <p>応答は<code>cards</code>オブジェクトを最上位に持つ。検索で得たカードを1始まりの連番でキー付けし直して格納する。各カードの配下はカード詳細ID（<code>details</code>）、言語コード（<code>languageClasses</code>）、状態コード（<code>conditionClasses</code>）の順で入れ子になる。</p>
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td><code>cards</code></td><td>object</td><td>1始まりの連番をキーとするオブジェクト。値は各カードの情報。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameJp</code></td><td>string</td><td>カードの日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.cardNameEn</code></td><td>string</td><td>カードの英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.imageFileName</code></td><td>string</td><td>カード画像のファイル名。</td></tr><tr><td><code>cards.&lt;n&gt;.details</code></td><td>object</td><td>カード詳細IDをキーとするオブジェクト。値は各カード詳細の情報。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetCode</code></td><td>string</td><td>カードセットのコード。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardsetName</code></td><td>string</td><td>カードセットの日本語名。カードセット未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.foilFlg</code></td><td>boolean</td><td>フォイルか否か。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.cardNo</code></td><td>string</td><td>カード番号。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.promotionName</code></td><td>string</td><td>プロモーションの日本語名。プロモーション未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productId</code></td><td>integer</td><td>商品ID。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameJp</code></td><td>string</td><td>商品の日本語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.productNameEn</code></td><td>string</td><td>商品の英語名。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.rarityCode</code></td><td>string</td><td>レアリティのコード。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.storageCodeName</code></td><td>string</td><td>保管コードの名称。未設定のときはnull。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses</code></td><td>object</td><td>言語コードをキーとするオブジェクト。</td></tr><tr><td><code>cards.&lt;n&gt;.details.&lt;detailId&gt;.languageClasses.&lt;languageCode&gt;.conditionClasses</code></td><td>object</td><td>状態コードをキーとするオブジェクト。値は商品規格単位の情報。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productClassId</code></td><td>integer</td><td>商品規格ID。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.productCode</code></td><td>string</td><td>商品コード。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.buyPrice</code></td><td>integer</td><td>買取価格。未設定のときはnull。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.price</code></td><td>string</td><td>販売価格（販売価格列の値）。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.stock</code></td><td>string</td><td>在庫数。</td></tr><tr><td><code>…conditionClasses.&lt;conditionCode&gt;.sectionId</code></td><td>integer</td><td>部門ID。未設定のときはnull。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:68-75` — 実装(cardIdをキーに使用)

```php
            $cardId = $dto->cardId;
            $detailId = $dto->detailId;
            $languageCode = $dto->languageCode;
            $conditionCode = $dto->conditionCode;

            // Cardレベル
            if (!isset($cards[$cardId])) {
                $cards[$cardId] = [
```

## 不在確認コマンド

- `rg -n "array_values|array_is_list|再採番" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計は「検索で得たカードを1始まりの連番でキー付けし直して格納する」を本文（HTML 2700行）と型表（2701行「1始まりの連番をキーとするオブジェクト」）とサンプル（2709行 "1"）の3箇所で明記し、pf-api挙動を正とする旨（2681行）とも整合する具体的要求。実装 BuyingCardsFormatter::format は $cardId=$dto->cardId（68行）を $cards[$cardId]（74-75行）のキーに使い、array_values 等の再採番が皆無（rg でも array_values/連番なし）。cardId は DB 値（MtbCardRepository select card.id AS cardId, 176行）で 1始まり保証は無く、JSON化すると {"cards":{"10001":...}} となり設計の {"1":...} と不一致。別実装・上位再採番も無い。指摘は維持。
