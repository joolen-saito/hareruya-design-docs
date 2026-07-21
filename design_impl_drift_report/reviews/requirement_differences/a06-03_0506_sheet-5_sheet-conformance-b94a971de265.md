# a06-03_0506_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-03_0506_sheet-5_sheet.json#a06-03_0506_sheet-5_sheet-conformance-b94a971de265`
- 機能: A06-03 A06-03 店頭買取情報更新
- 観点: ⑦要求網羅・実装違い

## 要旨
order_details[].quantity/priceは設計上任意（サンプルでnull許容）だが、実装は全明細でnullを一律拒否する。

## 判定理由
設計(1531)はquantity/priceを『任意・整数のみ』とし、サンプルJSON(1479)の個別入力商品はquantity/priceともにnull。DTO(UpdateOtcBuyOrderDetailDto.php:37,41)もNotNullを付けず?intで受ける。しかしBuildOtcBuyOrderDetailUpdatePlan.php:51で全明細を走査しprice===null||quantity===nullを検出するとInvalidRequestParameterException('価格または数量が指定されていません')を投げ、削除・登録処理へ進まない。商品規格IDが空の個別入力商品も同じ集計ループを通るため、設計サンプルの個別入力商品(null)を登録できない。null許容を維持する別経路は見当たらなかった。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1531-1531` — 設計要求(quantity/price任意)

```html
          <div class="table-wrap"><table><thead><tr><th>パラメータ</th><th>位置</th><th>型</th><th>必須／任意</th><th>説明</th></tr></thead><tbody><tr><td><code>id</code></td><td>パス</td><td>integer</td><td>必須</td><td>更新対象の店頭買取受注ID。</td></tr><tr><td><code>order_status</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>必須</td><td>更新後の店頭買取ステータスID。店頭買取ステータスマスタに存在する値であること。</td></tr><tr><td><code>order_details</code></td><td>ボディ（フォーム値）</td><td>array</td><td>必須</td><td>査定明細の配列。1件以上であること。各要素は明細1件分のオブジェクト。</td></tr><tr><td><code>order_details[].product_class_id</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>任意</td><td>商品規格ID。空のときは個別入力商品として扱う。整数のみ。</td></tr><tr><td><code>order_details[].name</code></td><td>ボディ（フォーム値）</td><td>string</td><td>必須</td><td>商品名。最大65535文字。</td></tr><tr><td><code>order_details[].quantity</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>任意</td><td>数量。整数のみ。</td></tr><tr><td><code>order_details[].price</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>任意</td><td>単価。整数のみ。</td></tr><tr><td><code>order_details[].sell_price</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>任意</td><td>販売価格。整数のみ。</td></tr><tr><td><code>order_details[].section_id</code></td><td>ボディ（フォーム値）</td><td>integer</td><td>任意</td><td>部門ID。整数のみ。該当部門が存在する場合のみ設定する。</td></tr><tr><td><code>qualified_invoice_issuer_confirmation_flg</code></td><td>ボディ（フォーム値）</td><td>boolean</td><td>任意</td><td>適格請求書発行事業者の確認済みフラグ。受注が適格請求書発行事業者に該当する場合のみ反映する。</td></tr><tr><td><code>jwt-token</code></td><td>ヘッダ</td><td>string</td><td>必須</td><td>認証用のJWTトークン。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
設計サンプルJSON
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1479-1479` — サンプルで個別入力商品はnull

```html
                  <tr data-shape-index="1" data-shape-ref="B97"><td class="shape-ref">B97</td><td>{<br>  "order_status": 1 ,<br>  "qualified_invoice_issuer_confirmation_flg": true,<br>  "order_details": [<br>    {<br>      "product_class_id": 565771,<br>      "name": "【EN】セラの天使",<br>      "quantity": 1,<br>      "price": 100,<br>      "sell_price": 200,<br>      "section_id": 1<br>    },<br>    {<br>      "product_class_id": null,<br>      "name": "商品名テスト",<br>      "quantity": null,<br>      "price": null,<br>      "sell_price": null,<br>      "section_id": null<br>    }<br>  ]<br>}</td></tr>
```

`ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/BuildOtcBuyOrderDetailUpdatePlan.php:51-53` — null一律拒否

```php
            if ($detail->price === null || $detail->quantity === null) {
                // Validationでガードしているが、念のためチェックしている
                throw new InvalidRequestParameterException('価格または数量が指定されていません');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。null許容を保つ別経路を探したが存在せず維持。設計(1531)は quantity/price を『任意・整数のみ』、サンプルJSON(1479)の個別入力商品は quantity:null/price:null。UpdateOtcBuyOrderDetailDto は NotNull を付けず ?int で受ける（DTO段では通る）。ところが BuildOtcBuyOrderDetailUpdatePlan.php:51-53 が分類前に全明細を走査し `if ($detail->price === null || $detail->quantity === null) throw new InvalidRequestParameterException('価格または数量が指定されていません')` を無条件実行。この build() は UpdateOtcBuyOrderAction::handle 内で唯一かつ無条件に呼ばれ、迂回経路なし。コード内コメント『Validationでガードしているが念のため』は誤認で、実際にはDTOに NotNull が無いため null が本ガードで拒否される。設計サンプルの null 個別入力商品を登録不能＝乖離を実コードで確認。指摘維持。
