# b06-01_0406_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b06-01_0406_sheet-3_sheet.json#b06-01_0406_sheet-3_sheet-conformance-aa5d8221b7d7`
- 機能: B06-01 B06-01 【新規】買取自動入庫バッチ
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は店頭買取の入庫待ちをステータス12と明記するが、実装ではステータス12は「未登録在庫あり」で入庫待ちは13、バッチも13を対象にしている。

## 判定理由
設計書の入力データ検索条件（HTML 883行）は『店頭買取情報.ステータス 12: 入庫待ち』と明記する。一方、実装の MtbOtcBuyOrderStatus では STATUS_HAS_UNREGISTERED_STOCK=12（未登録在庫あり）、STATUS_STOCKING_PENDING=13（入庫待ち）と定義され（59-60行、コメント41-42行）、自動入庫バッチ BatchAutoStockAction は findBy(['OtcBuyOrderStatus' => STATUS_STOCKING_PENDING])（=13）を対象にしている（45行）。ネット買取側の 16=入庫待ち（MtbBuyOrderStatus::WAITING_FOR_STOCK）は設計通り。店頭買取のステータスID 12 を入庫待ちとして扱う実装は存在せず、業務意味（入庫待ち）は実装上ID 13 に割り当てられている。設計値12と実装値13のIDが不一致であり、実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html:883-883` — 設計要求

```html
            <p class="doc-p" style="--lv:0">店頭買取情報.ステータス　12: 入庫待ち</p>
```

## ec-cube-enterprise 実装
12=未登録在庫あり、13=入庫待ち。設計の12=入庫待ちと不一致
`ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:58-60` — 実装（ステータス定義）

```php
    public const STATUS_STOCKING_COMPLETE = 11;
    public const STATUS_HAS_UNREGISTERED_STOCK = 12;
    public const STATUS_STOCKING_PENDING = 13;
```

自動入庫バッチが対象にするのはステータス13（STATUS_STOCKING_PENDING）
`ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/BatchAutoStockAction.php:45-45` — 実装（バッチ対象ステータス）

```php
        $OtcBuyOrders = $this->otcBuyOrderRepository->findBy(['OtcBuyOrderStatus' => MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING]);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。3層で不一致を確認し反証不成立。(1)設計: HTML 883/987行の入力データ検索条件が『店頭買取情報.ステータス 12: 入庫待ち』と明記（引用正確）。(2)実装コード: MtbOtcBuyOrderStatus.php 41-42行コメント・59-60行定数で STATUS_HAS_UNREGISTERED_STOCK=12（未登録在庫あり）/STATUS_STOCKING_PENDING=13（入庫待ち）。BatchAutoStockAction.php:45 は findBy(['OtcBuyOrderStatus' => STATUS_STOCKING_PENDING])=13 を対象（引用正確）。(3)DBシード: Version20260115080738.php:36-37 で id=12 name='未登録在庫あり'、id=13 name='入庫待ち' と確定。別実装の可能性を検討: 状態12を入庫待ちとして扱う経路をrg（MtbOtcBuyOrderStatus全定数/SUMMARY_STATUSES/isXxx群）で確認したが存在しない。設計値12と実装値13は業務意味レベルで別物（12=未登録在庫あり）であり、設計通り12でフィルタすれば誤った集合を拾う。要求読み違いや設計側除外注記も無い。ID不一致は事実で指摘維持。
