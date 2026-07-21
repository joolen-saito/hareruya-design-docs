# a17-04_0517_sheet-6_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-04_0517_sheet-6_id.json#a17-04_0517_sheet-6_id-conformance-1921aa5b190e`
- 機能: A17-04 A17-04 商品IDに紐づく商品詳細の情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は商品IDと言語で商品詳細を絞り込む要求だが、実装は言語をLEFT JOIN条件に留め抽出条件は p.id と pc.id IS NOT NULL のみで、指定言語以外の商品規格も混入し得る。

## 判定理由
設計(2049,2111)は『商品IDと言語で商品詳細を取得する』『指定言語に対応する商品詳細を返す』と明記。実装 findProductById の SQL(ProductRepository.php)は mtb_language を LEFT JOIN lang ON pc.language_id = lang.id AND lang.code = :languageCode とするのみで、WHERE は p.id = :productId AND pc.id IS NOT NULL だけ。lang.code による絞り込みが WHERE に無いため、指定言語に一致しない商品規格も抽出される。さらに応答 languageCode は COALESCE(lang.code, :languageCode) のため、非一致行は指定言語コードとして返り得る。ProductController は lang クエリを受けて findProductById に渡すのみで言語絞り込みは加えていない。別ルート・別メソッドでの絞り込みは確認できず、指摘は事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:2111-2111` — 設計要求（言語で絞り込み）

```html
          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>参照時点</td><td>呼び出し時点の商品・商品規格・在庫・価格を返す。本APIはデータを更新しない。</td></tr><tr><td>言語</td><td>指定言語に対応する商品詳細を返す。未指定時は日本語を返す。</td></tr><tr><td>表示条件</td><td>表示下限価格や良品（NM）判定により、応答に含まれる商品規格は実在の規格の一部となることがある。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
WHERE は productId と pc.id IS NOT NULL のみ
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:320-322` — 抽出条件（言語絞り込み無し）

```php
WHERE
    p.id = :productId
    AND pc.id IS NOT NULL
```

`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:301-301` — 言語はLEFT JOIN条件に留まる

```php
    LEFT JOIN mtb_language lang ON pc.language_id = lang.id AND lang.code = :languageCode
```

`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:267-267` — 応答言語コードの補完

```php
    COALESCE(lang.code, :languageCode) AS languageCode,
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)別実装なし: `grep -rn findProductById src/` は定義1件(ProductRepository.php:259)・呼出1件(ProductController.php:59)のみで、A17-04詳細取得は他ルート/他メソッドを経由しない。応答整形のProductDetailResponseBuilder::build も products[0]と全明細を無条件にイテレートするだけで言語による絞り込みは無い(builder line 48-72)。(2)引用の正しさ: SQL(ProductRepository.php)は `LEFT JOIN mtb_language lang ON pc.language_id = lang.id AND lang.code = :languageCode`(line 301)、WHEREは `p.id = :productId AND pc.id IS NOT NULL`(line 320-322)のみで、lang.code や pc.language_id による絞り込みが WHERE に無いことを実ファイルで確認。LEFT JOIN のため非一致言語の product_class 行も除外されない。さらに `COALESCE(lang.code, :languageCode) AS languageCode`(line 267)も実在。(3)設計側除外なし: 設計 line 2049 step2『商品IDと言語で商品詳細を取得する』、line 2111 データ整合性『指定言語に対応する商品詳細を返す。未指定時は日本語を返す。』が明記され、Ph2/対象外/現行踏襲の注記は近傍に無い。言語は retrieval 条件として設計が要求している。実装は言語を絞り込みに使わずJOIN条件と補完に留めており、指摘は事実。
