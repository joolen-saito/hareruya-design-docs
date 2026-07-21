# b02-07_0404_sheet-10_tsv 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-07_0404_sheet-10_tsv.json#b02-07_0404_sheet-10_tsv-conformance-d2579ec21c60`
- 機能: B02-07 B02-07 ユニサーチフィードTSV
- 観点: ⑦要求網羅・実装違い

## 要旨
TSVヘッダで設計のbranch_statusがis_branch_publishedに改名され、設計表に無いcategory_name_en/search_wordが追加されている。

## 判定理由
設計TSV表（1697-1734行）は識別ID34をbranch_status（支店表示フラグ）とし、category_name_enとsearch_wordは存在しない。実装 UniSearchExportService::getHeader() は列名 is_branch_published（167行）を出力し、設計に無い category_name_en（159行）と search_word（171行）を含む。ヘッダ配列は40エントリで設計表項目より多い。TSV外部契約の項目名・列がそのまま設計と食い違う。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1731-1731` — 設計要求(TSV表 ID34)

```html
                <tr><td>34</td><td>branch_status</td><td>支店表示フラグ</td><td>〇</td><td></td><td></td></tr>
```

## ec-cube-enterprise 実装
is_branch_published改名・category_name_en/search_word追加
`ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchExportService.php:155-172` — getHeaderの出力列

```php
            'stock',
            'weekly_sales',
            'category_id',
            'category_name',
            'category_name_en',
            'product_class',
            'card_condition',
            'sale_flg',
            'high_price_code',
            'belt_url',
            'color_identity',
            'product_code',
            'is_branch_published',
            'frame_flg',
            'buy_price',
            'reservation_flg',
            'search_word',
        ];
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず。設計TSV表（1697-1734行）を実際に確認し、識別ID34は branch_status（支店表示フラグ）で、category_name_en / search_word は存在しない。実装 getHeader()（UniSearchExportService.php:131-172）は 40 エントリで、is_branch_published（167行）に改名し category_name_en（159行）と search_word（171行）を追加している。反証検索として (1) 0404文書全体、(2) excel_to_html/output 配下と functions/ 配下の全設計ドキュメントに対し is_branch_published / category_name_en / search_word を rg した（find の該当ヒットは M03/0204 の別文脈=検索ワード=dtb_product.ln、category_sub.name_en、search_parameters であり本TSVの列名ではない）。UniSearchフィードTSVの列名としての設計根拠はどこにも無く、外部連携TSVへ設計外2列が混入し1列が改名されている事実は確認された。is_branch_published は branch_status と意味的に等価だが、追加2列は設計に無い実在の乖離であり指摘は維持。
