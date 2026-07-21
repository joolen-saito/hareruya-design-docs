# a07-05_0507_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-05_0507_sheet-7_sheet.json#a07-05_0507_sheet-7_sheet-conformance-7238baebc48d`
- 機能: A07-05 A07-05 ネット買取注文の査定終了処理
- 観点: ⑦要求網羅・実装違い

## 要旨
明細nameは設計上最大65535だが、個別入力商品として永続化するカラムは255文字上限で設計値を保存できない。

## 判定理由
設計はリクエストパラメータ表・入出力・バリデーション節でいずれも name（商品名）を必須・最大65535と規定。実装の入力検証 UpdateBuyOrderDetailDto.name は Assert\Length(max: 65535) で65535まで許容する。一方、商品規格ID=0 の明細を個別入力商品として保存する DtbBuyOrderIndivisualInputProduct.name は ORM 上 type: STRING, length: 255 のカラムである。よって256〜65535文字の name は検証を通過しても個別入力商品として設計どおり永続化できず（DBエラーまたは切り詰め）、永続化可能な最大長が設計より小さい実装違いとなる。カード明細（product_class_id≠0）は買取代表カード経由で商品規格を参照し name を直接保持しないため、この不整合は個別入力商品に固有。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1624-1624` — 設計要求（name最大65535）

```html
                <tr><td>name</td><td>文字列</td><td>〇</td><td>65535</td><td>【EN】セラの天使</td><td>商品名</td></tr>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDetailDto.php:32-32` — DTO検証は最大65535を許容

```php
        #[Assert\Length(max: 65535, maxMessage: '商品名は、{{ limit }}文字以下で入力してください。')]
```

`ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php:35-35` — 個別入力商品の保存カラムは255

```php
    #[ORM\Column(name: 'name', type: Types::STRING, length: 255)]
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。設計は入出力表(1707)・バリデーション節(1732)で明細 name を必須・最大65535と規定。実装 UpdateBuyOrderDetailDto.php:32 は Assert\Length(max: 65535) で65535まで検証通過。保存先を確認すると UpdateBuyOrderAction.php:184-187 で productClassId===null||===0 の明細を個別入力商品と判定し、:216-223 buildIndivisualInputProduct が DtbBuyOrderIndivisualInputProduct を生成し :223 で ->setName($orderDetail->name) にDTOのnameを直接格納。当該カラムは DtbBuyOrderIndivisualInputProduct.php:35 で type: STRING, length: 255 と実確認。別の保存先(より大きいカラム)を探したが、個別入力商品の name はこのエンティティのみで、カード明細(product_class_id≠0)は買取代表カード経由で name を直接保持しない。したがって256〜65535文字の name は検証通過後に255カラムへ永続化できず(DBエラー/切り詰め)、永続化可能最大長が設計65535に満たない実装違いは実在。指摘維持。
