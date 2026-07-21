# b02-03_0404_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0404_sheet-5_sheet.json#b02-03_0404_sheet-5_sheet-conformance-eeddc0ecbe63`
- 機能: B02-03 B02-03 期間別入庫数集計
- 観点: ⑦要求網羅・実装違い

## 要旨
本店の支店IDを0として処理する設計だが、実装は base_info_id をそのまま使用し本店を0へ変換しない。

## 判定理由
設計はカスタマイズ項目（★）として『本店の支店IDは0として処理する』（HTML 1116 行）を要求。実装 getStockUpForAggregate は SELECT で sh.base_info_id をそのまま base_info_id とし（153 行）、GROUP BY ps.product_class_id, sh.base_info_id で集計・登録する（179 行）。本店は BaseInfo::TC_TOKYO_ID = 1（BaseInfo.php 45 行）であり、本店を支店ID 0 へ変換する処理は集計クエリにも handle にも存在しない。本店・TC_TOKYO_ID・base_info_id=0 での反証検索でも 0 変換は見つからず、本店は base_info_id=1 のまま格納される。よって設計値と異なる実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1116-1116` — 設計要求（本店支店ID=0）

```html
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>本店の支店IDは0として処理する</span></div>
```

## ec-cube-enterprise 実装
本店を0へ変換していない
`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:153-153` — base_info_id をそのまま集計

```php
                sh.base_info_id,
```

`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:179-179` — GROUP BY で base_info_id をそのまま使用

```php
            GROUP BY ps.product_class_id, sh.base_info_id
```

`ec-cube-enterprise/src/Eccube/Entity/BaseInfo.php:45-45` — 本店定数は1

```php
        public const TC_TOKYO_ID = 1;
```

## 不在確認コマンド

- `rg -n '本店|TC_TOKYO_ID|base_info_id.*0' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateStockUpAction.php`
- `rg -rn 'base_info_id\s*=\s*0|本店.*0' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube`

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず指摘維持。設計は★カスタマイズ項目として『本店の支店IDは0として処理する』(HTML 1116)を要求し、出力先 dtb_stock_up_quantity の支店ID列(base_info_id)へ本店=0 で登録することを含意(1128 実行結果詳細)。実装 getStockUpForAggregate は SELECT で sh.base_info_id をそのまま出力(153)、GROUP BY ps.product_class_id, sh.base_info_id(179)し、updateStockUpQuantityColumns も :base_info_id をそのまま INSERT/UPDATE(199,219,246)。本店は BaseInfo::TC_TOKYO_ID=1(BaseInfo.php 45,1645)であり、base_info_id を 0 へ変換する CASE/条件は集計クエリにも handle にも皆無(repo の CASE WHEN は全て日付判定のみ、grep で確認)。よって本店は base_info_id=1 のまま格納され、設計値 0 と不一致。指摘どおり実装違い。
