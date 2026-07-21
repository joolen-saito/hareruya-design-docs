# a06-02_0506_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-092ff312e7c3`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
抽出ステータスは設計が 5,6,7,8,9 だが、実装 ASSESSMENT_UNCOMPLETED_STATUSES は 5,6,8,9 のみで 7（振込前）を含まない。

## 判定理由
設計の集計条件は抽出対象を『商品到着（5）・査定中（6）・振込前（7）・保留（8）・査定再開（9）』とする。実装は Controller.php:79 で MtbOtcBuyOrderStatus::ASSESSMENT_UNCOMPLETED_STATUSES を渡すが、その定数（MtbOtcBuyOrderStatus.php:84-89）は STATUS_ASSESSMENT_PENDING(5)・STATUS_ASSESSMENT_IN_PROGRESS(6)・STATUS_ASSESSMENT_PAUSED(8)・STATUS_ASSESSMENT_RESUMED(9) のみで、STATUS_BEFORE_PAY(7) は含まれず（同ファイル:53-54 で 7 は @deprecated 扱い）。7 を含める別定数・別呼び出しはこの一覧APIに見当たらない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1188-1188` — 設計要求（抽出対象ステータス）

```html
          <div class="table-wrap"><table><thead><tr><th>指標</th><th>集計の要点</th></tr></thead><tbody><tr><td>抽出対象</td><td>店頭買取ステータスが商品到着（5）・査定中（6）・振込前（7）・保留（8）・査定再開（9）のいずれかの店頭買取受注。それ以外の状態（成立・キャンセル・ダブルチェック済・データ出力済）は除外する。</td></tr><tr><td>結合</td><td>受注に店頭買取ステータス・職業マスタ・国マスタを内部結合し、会員（査定担当者）・都道府県マスタ・本人確認・適格請求書発行事業者口座を左結合する。</td></tr><tr><td>絞り込み</td><td>認証した管理者会員に所属店舗がある場合は、その店舗に一致する受注のみに絞り込む。所属店舗が無い場合は絞り込まない。</td></tr><tr><td>住所連結</td><td>国が日本（国ID 392）の場合は都道府県名・住所1・住所2を半角空白区切りで連結する。日本以外の場合は国名・住所2・住所1の順で連結する。</td></tr><tr><td>一意化</td><td>受注IDごとに1要素へ整形する。受注の基本情報と申込者情報を1件に集約する。</td></tr><tr><td>並び順</td><td>受注ID昇順。</td></tr><tr><td>ページング</td><td>行わない。該当する受注を全件返す。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
5,6,8,9 のみ
`ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:84-89` — 抽出ステータス定数（7欠落）

```php
    public const ASSESSMENT_UNCOMPLETED_STATUSES = [
        self::STATUS_ASSESSMENT_PENDING,
        self::STATUS_ASSESSMENT_IN_PROGRESS,
        self::STATUS_ASSESSMENT_PAUSED,
        self::STATUS_ASSESSMENT_RESUMED,
    ];
```

STATUS_BEFORE_PAY=7 は @deprecated
`ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:53-54` — 7は廃止扱い

```php
    /** @deprecated 廃止されたステータスです */
    public const STATUS_BEFORE_PAY = 7;
```

`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:79-79` — 一覧取得での使用箇所

```php
        $otcBuyOrders = $this->dtbOtcBuyOrderRepository->getOtcBuyOrdersByShopIdAndStatus($shopId, MtbOtcBuyOrderStatus::ASSESSMENT_UNCOMPLETED_STATUSES);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。MtbOtcBuyOrderStatus.php:84-89 の ASSESSMENT_UNCOMPLETED_STATUSES を実際に開いて確認: STATUS_ASSESSMENT_PENDING(5)/IN_PROGRESS(6)/PAUSED(8)/RESUMED(9) のみで STATUS_BEFORE_PAY(7) は含まれず、7 は :53-54,:76 で DEPRECATED_STATUSES 扱い。Controller.php:79 は一覧APIでこの定数のみを渡す。7 を加える別定数・別呼び出しは無い（ASSESSMENT_ACTIVE_STATUSES=6,9 / COMPLETED=1,2,10 のいずれも7を含まない）。設計は 5,6,7,8,9 を要求。指摘は維持。
