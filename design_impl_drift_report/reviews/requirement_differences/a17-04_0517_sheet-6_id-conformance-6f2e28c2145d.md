# a17-04_0517_sheet-6_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a17-04_0517_sheet-6_id.json#a17-04_0517_sheet-6_id-conformance-6f2e28c2145d`
- 機能: A17-04 A17-04 商品IDに紐づく商品詳細の情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は card_detail.formats を array で返す要求だが、実装は STRING_AGG のカンマ区切り文字列をそのまま設定しており型が異なる。

## 判定理由
設計(2059の型定義=array, 2086のサンプル=["スタンダード"])は card_detail.formats を配列として示す。実装 SQL(ProductRepository.php:292)は STRING_AGG(DISTINCT fmt.name_en, ',') AS formats で文字列として取得し、ResultSetMapping も 'formats' を 'string' で addScalarResult。ProductDetailResponseBuilder::buildCardDetail(line139)は 'formats' => $detail['formats'] ?? '' と文字列をそのまま設定。配列化(explode/array_values等)は同ビルダ内に見当たらず、応答はカンマ区切り文字列となる。指摘は事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0517_基本設計仕様書(API_その他).html:2086-2086` — 設計要求（formatsはarray）

```html
              "formats": ["スタンダード"]
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:292-292` — SQLで文字列連結取得

```php
    STRING_AGG(DISTINCT fmt.name_en, ',') AS formats,
```

`ec-cube-enterprise/src/Eccube/Service/App/ProductDetail/ProductDetailResponseBuilder.php:139-139` — ビルダで文字列のまま設定

```php
            'formats' => $detail['formats'] ?? '',
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)引用の正しさ: SQL(ProductRepository.php:292)は `STRING_AGG(DISTINCT fmt.name_en, ',') AS formats` で文字列連結、ResultSetMapping も `addScalarResult('formats','formats','string')`(line 367)。ProductDetailResponseBuilder::buildCardDetail は `'formats' => $detail['formats'] ?? ''`(line 139)と文字列をそのまま設定することを実ファイルで確認。(2)配列化処理なし: 同ビルダには splitString(line 82-91, explode+array_values で配列化)が存在するが、categories(line 57)・imageFileNames(line 190)にのみ適用され、formats には適用されていない。応答はコントローラ line70 で `$this->json($response)` されるだけで以降の変換も無い。(3)要求の読み違いなし: 設計 line 2059 の型定義で `card_detail.formats` は array、サンプル line 2086 は `"formats": ["スタンダード"]` と配列。対して colors(2075)・card_type(2078)は設計でも string で実装(line 128,131)と一致しており、finding は formats のみを正しく切り分けている。実装はカンマ区切り文字列を返すため型不一致。指摘は事実。
