# b02-01_0404_sheet-3_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-01_0404_sheet-3_sheet.json#b02-01_0404_sheet-3_sheet-conformance-f6f05b013074`
- 機能: B02-01 B02-01 期間別販売数集計
- 観点: ⑦要求網羅・未実装

## 要旨
設計はスマレジの取引データも集計対象とし店舗ごとにECCUBEとスマレジで分けて集計する要求だが、実装は EC 受注のみを集計対象とし、スマレジ実店舗販売は未実装として除外している。

## 判定理由
設計(line 869・876)は本店・支店に加えスマレジ販売情報を集計対象とし、店舗ごとにECCUBEとスマレジで分けて販売数を集計することを要求。実装は AggregateSalesCommand の docコメントで『現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される』と明記(AggregateSalesCommand.php:29)。getSalesForAggregate() の SQL は dtb_order_item/dtb_order/dtb_shipping のみを対象とし、スマレジ用テーブルや UNION は無く、『スマレジ受注が別テーブル管理の場合は UNION 等で本クエリを拡張すること』という TODO が残る(DtbSalesQuantityRepository.php:432-434)。BatchAggregateSalesAction にも同旨の TODO(line 39-41)。ECCUBE/スマレジ種別を分離する列・キーも集計に存在しない。よってスマレジ集計は実装漏れ。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:869-876` — 設計要求

```html
            <p class="doc-p" style="--lv:2">本店のほか、支店やスマレジの販売情報も集計対象として取り扱う</p>
            <p class="doc-p" style="--lv:2">閉店した店舗は集計の対象外とする</p>
            <h3 class="doc-h doc-h-section doc-h-spec" id="sheet-3-spec-1" style="--lv:0"><span class="spec-badge">機能仕様</span>処理概要（★はカスタマイズ項目）</h3>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>定時処理で実行されて日付から下記期間範囲ごとの商品販売数を本店を含む店舗ごとに行う</span></div>
            <p class="doc-p" style="--lv:1">昨日の販売数,3日間の販売数,1週間の販売数,1か月の販売数,90日間の販売数,180日間の販売数,365日間の販売数</p>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>閉店した店舗は集計の対象外とする</span></div>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>本店の支店IDは0として処理する</span></div>
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">★</span><span>スマレジの取引データも集計対象とし、それぞれ店舗ごとにECCUBEとスマレジで分けて販売数を集計する</span></div>
```

## ec-cube-enterprise 実装
コマンド docコメント
`ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php:28-29` — EC受注のみ・スマレジ未実装の明記

```php
 * 商品規格・店舗ごとに期間別の販売数を集計し、dtb_sales_quantity を更新する。
 * 現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される。
```

UNION未実装
`ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:432-434` — 集計SQLはEC受注のみ・拡張はTODO

```php
        // TODO: スマレジ実店舗販売の dtb_order 取り込みが実装されたら、
        //       スマレジ受注が dtb_order + dtb_shipping 経由で集計されるか確認する。
        //       スマレジ受注が別テーブル管理の場合は UNION 等で本クエリを拡張すること。
```

## 不在確認コマンド

- `rg -ni 'smaregi|スマレジ|union' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchAggregateSalesAction.php /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/AggregateSalesCommand.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計 line869-875『本店のほか支店やスマレジの販売情報も集計対象』『★スマレジの取引データも集計対象とし店舗ごとにECCUBEとスマレジで分けて販売数を集計する』を実在確認。実装 AggregateSalesCommand docコメント『現在は EC 受注のみ対象。スマレジ実店舗販売は未実装のため除外される』(:29)、SQL は dtb_order_item/dtb_order/dtb_shipping/dtb_base_info のみで UNION も種別分離列も無く『スマレジ受注が別テーブル管理の場合は UNION 等で本クエリを拡張すること』TODO 残置(Repo:432-434)、handle() にも同旨TODO(:38-40)。rg -ril 'smaregi|スマレジ' src/Eccube のヒットは il Webhook 受信・会員連携・在庫連携系のみで、スマレジ取引を dtb_order へ取込む処理も別の販売数集計処理も存在しない(他に sales_quantity 集計コマンドは AggregateSales 系のみ)。ECCUBE/スマレジ分離集計も未実装。指摘は維持。
