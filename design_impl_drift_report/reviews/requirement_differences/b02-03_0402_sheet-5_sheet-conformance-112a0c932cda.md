# b02-03_0402_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json#b02-03_0402_sheet-5_sheet-conformance-112a0c932cda`
- 機能: B02-03 B02-03 期間別入庫数集計バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は商品コード・店舗・在庫区分（在庫場所）単位での集計/更新を要求するが、実装は商品規格ID・店舗ID単位でのみ集計し在庫場所を集計キーに含めない。

## 判定理由
基本設計の★カスタマイズ項目は「商品コードごと、店舗ごと、在庫区分ごとに集計」（line 1148/1152/1156）、更新判定は「商品コード、店舗、在庫場所が一致する集計データ」（line 1158）と在庫場所（区分）を集計/一致キーとして要求する。実装の getStockUpForAggregate は GROUP BY ps.product_class_id, sh.base_info_id のみ（DtbStockUpQuantityRepository.php:179）、更新判定も WHERE product_class_id AND base_info_id のみ（line 199 の findOneBy / line 246 の UPDATE WHERE）で stock_location_id を扱わない。反映先 DtbStockUpQuantity エンティティも ProductClass と BaseInfo のみを保持し stock_location_id 列を持たない（DtbStockUpQuantity.php:57,73）。在庫場所は ProductStock.stock_location_id（ProductStock.php:263 '在庫場所（区分）'）として存在するが当該集計SQLでは SELECT/GROUP BY に使われていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html:1152-1158` — 設計要求

```html
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>指定の期間に入庫した在庫数を商品コード、店舗、在庫区分ごとに集計するバッチ</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>起動日から366日の在庫変動履歴を取得する</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">★</span><span>取得対象（＝集計対象）の在庫変動区分は親区分が「入庫」「買取」のもののみとする</span></div>
            <p class="doc-p" style="--lv:3">※移動や分割などで入庫した在庫は集計に含まない</p>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">★</span><span>取得した在庫変動履歴を商品コードごと、店舗ごと、在庫区分ごと、期間ごと（当日、前日、3日間、1週間、1ヶ月間、90日間、180日間、365日間）に集計する</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">★</span><span>集計した在庫変動履歴を支店の仕様を踏襲し、専用の集計テーブルに保存する</span></div>
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>商品コード、店舗、在庫場所が一致する集計データがすでに集計テーブルにある場合は更新を行う</span></div>
```

## ec-cube-enterprise 実装
在庫場所/在庫区分を含まず product_class_id と base_info_id のみで GROUP BY
`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:179-179` — 集計SQLの集計キー

```php
            GROUP BY ps.product_class_id, sh.base_info_id
```

在庫場所一致条件が無い
`ec-cube-enterprise/src/Eccube/Repository/DtbStockUpQuantityRepository.php:246-246` — 更新判定キー

```php
                WHERE product_class_id = :product_class_id AND base_info_id = :base_info_id';
```

stock_location_id 列を持たない
`ec-cube-enterprise/src/Eccube/Entity/DtbStockUpQuantity.php:57-75` — 反映先エンティティ

```php
    #[ORM\JoinColumn(name: 'product_class_id', referencedColumnName: 'id')]
    #[ORM\ManyToOne(targetEntity: ProductClass::class, inversedBy: 'ShopStockUpQuantities')]
    private ?ProductClass $ProductClass = null;

    public function getProductClass(): ?ProductClass
    {
        return $this->ProductClass;
    }

    public function setProductClass(?ProductClass $productClass): DtbStockUpQuantity
    {
        $this->ProductClass = $productClass;

        return $this;
    }

    #[ORM\JoinColumn(name: 'base_info_id', referencedColumnName: 'id')]
    #[ORM\ManyToOne(targetEntity: BaseInfo::class)]
    private ?BaseInfo $BaseInfo = null;
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが実装は要求を満たさない。(1)別実装の不在: DtbStockUpQuantity エンティティ(実読)は ProductClass(product_class_id, line57-59)と BaseInfo(base_info_id, line73-75)の2キーのみで、stock_location 系の列/関連を一切持たない。集計SQL(DtbStockUpQuantityRepository.php:179)は GROUP BY ps.product_class_id, sh.base_info_id、更新判定(line199 findOneBy / line246 UPDATE WHERE)も product_class_id と base_info_id のみ。rg でも当該バッチ経路に stock_location_id の SELECT/GROUP BY/WHERE は無い。(2)用語の正しさ: 設計★の『在庫区分』『在庫場所』は ProductStock.stock_location_id(実読 line263 コメント『在庫場所（区分）』, default STOCK_LOCATION_ECCUBE=1)を指し、店舗(base_info_id)とは別次元。default=1 以外(スマレジ等)の在庫場所が存在し得るのに、実装は商品規格×店舗へ在庫場所を畳み込んで合算し、在庫区分別の内訳を失う。(3)設計側除外の不在: line1199 が deferする対象は『在庫変動区分による対象判定』であって、集計キー(在庫区分/在庫場所)の粒度ではない。★項目(line1148/1152/1156/1158)は新規カスタマイズ要求として在庫区分/在庫場所を集計・一致キーに繰り返し明示しており除外注記も無い。実装は当該★要求を満たさない。指摘は維持。
