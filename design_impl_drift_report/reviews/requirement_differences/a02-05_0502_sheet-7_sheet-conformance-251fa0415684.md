# a02-05_0502_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-05_0502_sheet-7_sheet.json#a02-05_0502_sheet-7_sheet-conformance-251fa0415684`
- 機能: A02-05 A02-05 更新商品規格取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は日時をISO8601で返すと定め result[].productClassUpdateDate / productUpdateDate をISO8601文字列と規定するが、実装はDBの update_date を無整形の string としてそのまま返す。

## 判定理由
詳細設計は副作用節(1844行)で「プロパティはcamelCase、日時はISO8601とする」と明記し、サンプル(1837-1838行)も `2026-06-01T10:00:00+09:00` のISO8601形式を示す。実装 ProductRepository::findProductClassesByUpdateDate は SQL で `pc.update_date AS productClassUpdateDate`・`p.update_date AS productUpdateDate`(2223-2224行) を取得し、ResultSetMapping では両者を `string`(2262-2263行) にマッピングするのみで T 区切りや +09:00 形式へのフォーマットを行わない。Controller も `$results` を整形せず JSON 化する(234-237行)。App の ProductController には出力日時の ATOM/`format('c')`/ISO8601整形が存在せず（該当 grep が空）、パラメータ側の `->format('c')`(2266-2267行) はクエリ条件用で応答整形ではない。よってDB無整形文字列（PostgreSQLは空白区切り・オフセット短縮形になりISO8601と非一致）を返す実装違いが事実。ただし最終的なJSON文字列の厳密書式はDBドライバ挙動に依存するため confidence は medium。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1844-1844` — 設計要求(日時はISO8601)

```html
          <p>応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601とする。</p>
```

## ec-cube-enterprise 実装
ISO8601整形なし
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2223-2224` — SQL: update_date を無整形で SELECT

```php
    pc.update_date AS productClassUpdateDate,
    p.update_date AS productUpdateDate
```

DateTime整形せず生文字列
`ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2262-2263` — ResultSetMapping: string マッピングのみ

```php
        $rsm->addScalarResult('productclassupdatedate', 'productClassUpdateDate', 'string');
        $rsm->addScalarResult('productupdatedate', 'productUpdateDate', 'string');
```

ATOM/format('c') による応答整形なし
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:232-237` — Controllerが整形なしで返却

```php
            $results = $this->productRepository->findProductClassesByUpdateDate($fromDate, $toDate);

            return $this->json([
                'count' => count($results),
                'result' => $results,
            ], Response::HTTP_OK);
```

## 不在確認コマンド

- `rg -n "ATOM|format\('c'\)|8601|productClassUpdateDate|productUpdateDate" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。実装SQLは pc.update_date AS productClassUpdateDate・p.update_date AS productUpdateDate を to_char 等の整形無しで生SELECTし、RSMは両者を type 'string' でマッピングするのみ(DateTime変換もフォーマットも無し)。`rg 'to_char|datestyle|ATOM|format\(''c''\)|DATE_ATOM'` を Repository/Controller に掛けても応答日時の整形箇所は無く、param側の format('c') はクエリ条件用。Controllerも $results 無整形で $this->json 返却。設計は副作用節1844行『プロパティはcamelCase、日時はISO8601とする』と明記し、両サンプルとも 2026-06-01T10:00:00+09:00 の T区切りISO8601を示す。PostgreSQL の timestamp 文字列既定表現は空白区切り(例 2025-08-01 20:20:00+09)でありISO8601のT区切りと不一致になるため、生文字列返却は設計要求を満たさない。厳密書式がDBドライバ挙動依存である点で原confidence medium は妥当だが、整形処理が実装に存在しないこと自体は事実であり反証できない。
