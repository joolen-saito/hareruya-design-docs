# a06-02_0506_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-d2bc0805a817`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
applyDate と customerInfo.birth は設計が ISO8601 だが、実装は applyDate='Y/m/d H:i:s'、birth='Y-m-d' で整形しており ISO8601 ではない。

## 判定理由
設計レスポンス定義では applyDate と customerInfo.birth を『ISO8601形式の日時文字列』とする。実装は Controller.php:97 で applyDate を format('Y/m/d H:i:s')、:113 で birth を format('Y-m-d') に整形している。format('c')/DATE_ATOM 等 ISO8601 整形はこの整形箇所に無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1196-1196` — 設計要求（applyDate/birth は ISO8601）

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td>（応答本体）</td><td>array</td><td>査定対象の店頭買取受注の配列。該当が無い場合は空配列。</td></tr><tr><td><code>otcBuyOrderId</code></td><td>integer</td><td>店頭買取受注ID。</td></tr><tr><td><code>assessmentId</code></td><td>integer</td><td>査定ID。</td></tr><tr><td><code>applyDate</code></td><td>string</td><td>申込日時。ISO8601形式の日時文字列。</td></tr><tr><td><code>freeComment</code></td><td>string</td><td>受注に付与されたフリーコメント。未設定の場合はnull。</td></tr><tr><td><code>memberName</code></td><td>string</td><td>査定担当者の会員名。紐づく会員が無い場合はnull。</td></tr><tr><td><code>otcOrderStatusId</code></td><td>integer</td><td>店頭買取ステータスのID。</td></tr><tr><td><code>returnSupply</code></td><td>integer</td><td>返送品の扱いを表す区分値。</td></tr><tr><td><code>callFlg</code></td><td>boolean</td><td>連絡要否のフラグ。</td></tr><tr><td><code>adultFlg</code></td><td>boolean</td><td>成人区分のフラグ。</td></tr><tr><td><code>playingFlg</code></td><td>boolean</td><td>プレイ用区分のフラグ。</td></tr><tr><td><code>orderStatusName</code></td><td>string</td><td>店頭買取ステータスの名称。</td></tr><tr><td><code>identificationId</code></td><td>integer</td><td>本人確認のID。未登録の場合は0。</td></tr><tr><td><code>qualifiedInvoiceIssuerFlg</code></td><td>boolean</td><td>適格請求書発行事業者の該当フラグ。</td></tr><tr><td><code>qualifiedInvoiceIssuerConfirmationFlg</code></td><td>boolean</td><td>適格請求書発行事業者の確認済みフラグ。</td></tr><tr><td><code>qualifiedInvoiceIssuerCode</code></td><td>string</td><td>適格請求書発行事業者の登録番号。紐づく口座が無い場合はnull。</td></tr><tr><td><code>customerInfo</code></td><td>object</td><td>申込者情報のオブジェクト。</td></tr><tr><td><code>customerInfo.firstName</code></td><td>string</td><td>申込者の名。</td></tr><tr><td><code>customerInfo.lastName</code></td><td>string</td><td>申込者の姓。</td></tr><tr><td><code>customerInfo.birth</code></td><td>string</td><td>申込者の生年月日。ISO8601形式の日時文字列。</td></tr><tr><td><code>customerInfo.telNo</code></td><td>string</td><td>申込者の電話番号。</td></tr><tr><td><code>customerInfo.zipcode</code></td><td>string</td><td>申込者の郵便番号。</td></tr><tr><td><code>customerInfo.jobName</code></td><td>string</td><td>申込者の職業名。</td></tr><tr><td><code>customerInfo.address</code></td><td>string</td><td>申込者の住所。国に応じて都道府県名または国名と住所1・住所2を半角空白区切りで連結した文字列。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:97-97` — applyDate 整形

```php
                'applyDate' => $otcBuyOrder['applyDate']?->format('Y/m/d H:i:s') ?? null,
```

`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:113-113` — birth 整形

```php
                    'birth' => $otcBuyOrder['birth']->format('Y-m-d'),
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。Controller.php:97 は applyDate を format('Y/m/d H:i:s')（例 2024/01/15 10:30:00）で整形しており、これは ISO8601 の日時表記（YYYY-MM-DDThh:mm:ss）とは明確に異なる。format('c')/DATE_ATOM 等の使用は当該整形箇所に無し。したがって applyDate について確かな乖離が残るため本 key は反証不能。ただし :113 の birth=format('Y-m-d')（例 2024-01-15）は ISO8601 の日付形式そのものであり、この1フィールドに限れば指摘は過剰。とはいえ本 key は applyDate を含む単一指摘のため全体としては維持。
