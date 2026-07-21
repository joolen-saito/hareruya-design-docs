# a06-02_0506_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-92f6fa682dfe`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
identificationId は未登録時に設計では 0 を返すべきだが、実装は null を返す。

## 判定理由
設計レスポンス定義は identificationId を『本人確認のID。未登録の場合は0』とする。実装は Repository.php:1041 で本人確認を leftJoin し identification.id as identificationId を取得、Controller.php:106 で 'identificationId' => $otcBuyOrder['identificationId'] ?? null としている。未登録（leftJoin 未一致）時は null となり、0 への補正（?? 0 / COALESCE）はこの整形箇所に無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1196-1196` — 設計要求（未登録時 identificationId=0）

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td>（応答本体）</td><td>array</td><td>査定対象の店頭買取受注の配列。該当が無い場合は空配列。</td></tr><tr><td><code>otcBuyOrderId</code></td><td>integer</td><td>店頭買取受注ID。</td></tr><tr><td><code>assessmentId</code></td><td>integer</td><td>査定ID。</td></tr><tr><td><code>applyDate</code></td><td>string</td><td>申込日時。ISO8601形式の日時文字列。</td></tr><tr><td><code>freeComment</code></td><td>string</td><td>受注に付与されたフリーコメント。未設定の場合はnull。</td></tr><tr><td><code>memberName</code></td><td>string</td><td>査定担当者の会員名。紐づく会員が無い場合はnull。</td></tr><tr><td><code>otcOrderStatusId</code></td><td>integer</td><td>店頭買取ステータスのID。</td></tr><tr><td><code>returnSupply</code></td><td>integer</td><td>返送品の扱いを表す区分値。</td></tr><tr><td><code>callFlg</code></td><td>boolean</td><td>連絡要否のフラグ。</td></tr><tr><td><code>adultFlg</code></td><td>boolean</td><td>成人区分のフラグ。</td></tr><tr><td><code>playingFlg</code></td><td>boolean</td><td>プレイ用区分のフラグ。</td></tr><tr><td><code>orderStatusName</code></td><td>string</td><td>店頭買取ステータスの名称。</td></tr><tr><td><code>identificationId</code></td><td>integer</td><td>本人確認のID。未登録の場合は0。</td></tr><tr><td><code>qualifiedInvoiceIssuerFlg</code></td><td>boolean</td><td>適格請求書発行事業者の該当フラグ。</td></tr><tr><td><code>qualifiedInvoiceIssuerConfirmationFlg</code></td><td>boolean</td><td>適格請求書発行事業者の確認済みフラグ。</td></tr><tr><td><code>qualifiedInvoiceIssuerCode</code></td><td>string</td><td>適格請求書発行事業者の登録番号。紐づく口座が無い場合はnull。</td></tr><tr><td><code>customerInfo</code></td><td>object</td><td>申込者情報のオブジェクト。</td></tr><tr><td><code>customerInfo.firstName</code></td><td>string</td><td>申込者の名。</td></tr><tr><td><code>customerInfo.lastName</code></td><td>string</td><td>申込者の姓。</td></tr><tr><td><code>customerInfo.birth</code></td><td>string</td><td>申込者の生年月日。ISO8601形式の日時文字列。</td></tr><tr><td><code>customerInfo.telNo</code></td><td>string</td><td>申込者の電話番号。</td></tr><tr><td><code>customerInfo.zipcode</code></td><td>string</td><td>申込者の郵便番号。</td></tr><tr><td><code>customerInfo.jobName</code></td><td>string</td><td>申込者の職業名。</td></tr><tr><td><code>customerInfo.address</code></td><td>string</td><td>申込者の住所。国に応じて都道府県名または国名と住所1・住所2を半角空白区切りで連結した文字列。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
未一致なら null
`ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1011-1041` — 本人確認 leftJoin と ID取得

```php
            ->leftJoin('otcBuyOrder.Identification', 'identification')
            ->leftJoin(
                'otcBuyOrder.QualifiedInvoiceIssuerAccount',
                'qualifiedInvoiceIssuerAccount',
            )
            ->leftJoin('otcBuyOrder.BaseInfo', 'baseInfo')
            ->select(
                'otcBuyOrder.id',
                'otcBuyOrder.assessmentId',
                'otcBuyOrder.applyDate',
                'otcBuyOrder.firstName',
                'otcBuyOrder.lastName',
                'otcBuyOrder.birth',
                'otcBuyOrder.telNo',
                'otcBuyOrder.zipcode',
                'otcBuyOrder.freeComment',
                'job.name as jobName',
                'm.name as memberName',
                'otcBuyOrderStatus.id as otcOrderStatusId',
                'otcBuyOrder.returnSupply',
                'otcBuyOrder.callFlg',
                'otcBuyOrder.adultFlg',
                'otcBuyOrder.playingFlg',
                'otcBuyOrder.addr01',
                'otcBuyOrder.addr02',
                'otcBuyOrder.addr03',
                'country.id as countryId',
                'country.name as countryName',
                'pref.name as prefName',
                'otcBuyOrderStatus.name as otcOrderStatusName',
                'identification.id as identificationId',
```

`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:106-106` — 未登録時 null 返却

```php
                'identificationId' => $otcBuyOrder['identificationId'] ?? null,
```

## 不在確認コマンド

- `rg -n "identificationId" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。Repository:1011 で otcBuyOrder.Identification を leftJoin し :1041 で identification.id as identificationId を取得（未一致時は null）。Controller.php:106 は 'identificationId' => $otcBuyOrder['identificationId'] ?? null と明示的に null を維持しており、?? 0 / COALESCE 等の 0 補正は無い。設計は未登録時 0 を要求。未登録時に null が返るため指摘は維持。
