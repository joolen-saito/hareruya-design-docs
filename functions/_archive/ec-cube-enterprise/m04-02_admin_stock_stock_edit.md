# m04-02_admin_stock_stock_edit — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫編集機能

### 画面表示・一覧項目

| 観点 | 内容 |
|------|------|
| 表示要素 | 商品（`Product`）・商品規格（`ProductClass`）・在庫（`ProductStock`）・店舗（`BaseInfo`）の各情報と、編集フォーム、在庫変動履歴一覧。 |
| 在庫変動履歴一覧 | `StockChangeHistoryListBuilder::build()` が「在庫変動履歴（`DtbStockHistory`、`findLatestByProductStockId` で直近30件）」と「承認待ち入庫詳細（`DtbStockEditApprovalDetail` のうち承認状態が未承認の入庫）」を同一形式の行（`StockChangeHistoryDisplayRow`）に整形し結合する。 |
| 表示順 | 各行の基準日時（承認日時 → 登録日時 → 作成日時 の優先で決定）の降順。結合後に上位30件へ切り詰める（`DISPLAY_LIMIT=30`）。 |
| 在庫数のマスク | 承認フローあり（区分 STOCK_EDIT/STOCK_BULK_EDIT/STOCK_CHANGE_CSV_IMPORT）かつ未承認の加算系（入庫）は変更前後在庫を `-` でマスク。減算系（廃棄）は登録時に即時減算済みのため `old_stock`/`stock` をそのまま表示する。 |
| 承認者列 | 承認済みは承認者名、未承認の承認フロー行は `admin.stock.approval_list.approval_waiting`（承認待ち）を表示。 |

### 登録フォーム項目とバリデーション

`StockApprovalType`（ブロックプレフィックス `admin_stock_approval_new`）。区分選択肢は入庫（`MtbStockChangeType::BE_STOCKED`）と廃棄（`MtbStockChangeType::DISPOSAL`）の在庫変動区分詳細に限定。

| 項目（フォームキー） | 型 | 必須 | バリデーション |
|----------------------|----|------|----------------|
| 在庫変動区分 `stock_change_type_detail` | EntityType（`MtbStockChangeTypeDetail`） | 必須 | `NotBlank`。入庫／廃棄の区分詳細のみ選択可。 |
| 在庫変動理由 `stock_change_reason` | Textarea | 必須 | `NotBlank` + `Length(max=eccube_product_stock_change_reason_max_len)`。設定値は16384文字で、Excel識別ID 3-2 と一致する。 |
| 在庫増減数 `stock_change_quantity` | Number | 必須 | `NotBlank` + `Range(min/max=eccube_product_stock_change_quantity_min/max)`。 |
| 仕入単価 `purchase_price` | Number | 任意 | `Range(min/max=eccube_product_stock_purchase_price_min/max)`。未入力は登録時に `0` 扱い。 |
| 承認部署 `approval_department` | Choice | 任意 | 対象店舗メンバーの部署候補（画面上の絞り込み用）。 |
| 承認通知先メンバー `approval_notification_target_members` | Choice（複数） | 必須 | `Count(min=1)`。候補は対象店舗の承認権限メンバー（`MemberRepository::getApprovalAuthorityMembers`）。 |

POST_SUBMIT イベントでの相関バリデーション:

- 入庫区分で在庫増減数が1未満 → `admin.stock.form.change_quantity.be_stocked_error`
- 廃棄区分で在庫増減数が-1超（負数でない）→ `admin.stock.form.change_quantity.disposal_error`
- 入庫区分で「現在在庫+増減数」が在庫増減数最大値を超過 → `admin.stock.form.change_quantity.be_stocked_max_stock_error`
- 廃棄区分で廃棄数（絶対値）が現在在庫を超過 → `admin.stock.form.change_quantity.disposal_exceeds_stock_error`

> 廃棄選択時に仕入単価入力を不可とする制御（Excel識別ID 3-1×3-4）は画面側（JS/Twig）の制御。サーバ側は廃棄時に入力された仕入単価を在庫計算に使用しない（減算では総在庫のみ減）。

### プロセスフロー（登録 `store`）

1. `ProductStock` から店舗（`BaseInfo`）を取得し、`StockApprovalType` でフォームを生成・`handleRequest`。
2. 未送信／無効なら `admin.common.save_error` を表示し画面を再描画。
3. ログインメンバーが対象店舗の編集権限を持つか確認（`Member::isEditableShop`）。権限なしは `admin.stock.approval.not_editable_store` を表示し再描画（登録しない）。
4. フォーム値から `StockApprovalStoreInput` を生成し `StockApprovalStoreAction::handle()` を実行。
5. `StockApprovalStoreAction` 内（単一トランザクション。`beginTransaction` → 各 `flush` → `commit`、例外時 `rollback` し再送出）:
   1. 在庫変動履歴ソース種別を STOCK_EDIT（`MtbStockHistorySourceType::STOCK_EDIT`）で取得。
   2. **在庫編集承認情報 `DtbStockEditApproval` を登録**（`StockEditApprovalEntityManager::save`）。店舗・在庫変動区分詳細・承認ステータス=未承認（`APPROVAL_STATUS_UNAPPROVED=1`）・登録日時=現在・登録者=ログインメンバー、承認日時/承認者は null。`flush` で在庫編集承認IDを採番。
   3. **在庫編集承認詳細 `DtbStockEditApprovalDetail` を登録**（`StockEditApprovalDetailEntityManager::save`）。採番した承認情報・対象 `ProductStock`・編集数=在庫増減数・在庫変動理由・仕入単価（空は `0`）・出庫総原価（`ProductStock::getMovementTotalCost`）・登録者・変更前在庫数（`getStock`）・変更前仕入単価（`getUnitCost`）。
   4. **廃棄区分のみ即時在庫反映**（在庫ロック）: 変更後在庫=`getStockQuantityAfterChange`、変更後総原価=`getTotalCostAfterChange`、変更後単価=`getUnitCostPriceAfterChange` を算出し、`ProductStockEntityManager::save` で `dtb_product_stock`（stock/total_cost）を更新。続けて `StockHistoryEntityManager::save` で **在庫変動履歴 `DtbStockHistory`** を登録（old_stock/stock/stock_change_quantity、原価の before/after、stock_change_reason、ソース種別=STOCK_EDIT、history_source_id=在庫編集承認ID、登録者・操作者名）。
   5. `flush` 後、**在庫承認一覧 `DtbStockApprovalList` を登録**（`StockApprovalListEntityManager::save`）。店舗・在庫区分・ソース種別=STOCK_EDIT・history_source_id=在庫編集承認ID・在庫変動区分詳細・承認状態=未承認（`APPROVAL_STATUS_UNAPPROVED`）・登録日時・登録者・承認日時/承認者=null・対象商品規格数=1・合計在庫増減数=在庫増減数・変更前総原価。`flush` → `commit`。
6. 成功後、通知先メンバーが指定されていれば各メンバーへ在庫管理承認通知メール（`MailService::sendStockApprovalAlertMail`、本文に在庫承認一覧URLを含む）を送信。
7. `admin.common.save_complete` を表示し、`admin_stock_approval_new` へリダイレクト。

> 入庫区分は手順5-4をスキップする（在庫・履歴は登録時点では更新せず、承認待ちの `DtbStockEditApprovalDetail` として保持。実在庫反映は在庫承認一覧での承認時）。廃棄区分は登録時点で在庫を減算（ロック）し履歴も即時作成する。

### 在庫変動理由の非同期更新（`updateHistoryReason`）

一覧行の在庫変動理由のみを編集する。XHR 以外のリクエストは `HTTP 400` で `admin.common.save_error`。`StockApprovalHistoryReasonType` で `stock_change_reason` と排他の対象ID（`stock_history_id` または `stock_edit_approval_detail_id`）を受け取り、両方指定／両方未指定は `HTTP 400`。`StockApprovalHistoryReasonUpdateAction` が以下を更新（個別 `flush`）:

- 在庫変動履歴（`stock_history_id`）: 対象が当該在庫を参照し、ソース種別が STOCK_EDIT/STOCK_BULK_EDIT かつ区分が入庫/廃棄の場合のみ編集可。`stock_change_reason`・更新者・更新日時を更新。
- 承認待ち入庫詳細（`stock_edit_approval_detail_id`）: 対象が当該在庫を参照し、承認情報が未承認かつ区分が入庫の場合のみ編集可。理由・更新者・更新日時を更新。

成功は `success=true` と表示用整形理由（欠品理由があれば結合）を JSON で返す。`InvalidArgumentException`（対象不正・別在庫参照・編集不可）は `HTTP 400`、その他例外は `HTTP 500`。

### 分岐・遷移・例外

| 状況 | 挙動 |
|------|------|
| `productStockId` 未存在 | 404（`#[MapEntity]` 解決失敗）。既存テスト `testNewWithNonExistentProductStockId` / `testStoreWithNonExistentProductStockId`。 |
| フォーム未送信／バリデーションエラー | リダイレクトせず `admin.common.save_error` を表示し同画面（200）再描画。既存テスト `testStoreWithValidationError`。 |
| 編集権限のない店舗 | `admin.stock.approval.not_editable_store` を表示し再描画（200、`.alert-danger`）。既存テスト `testStoreWithoutEditPermission`。 |
| 登録成功 | `admin.common.save_complete` 表示後 `admin_stock_approval_new` へリダイレクト。既存テスト `testStoreSuccess`。 |
| Action 内部例外 | トランザクションをロールバックし、例外メッセージを `addError` で表示して再描画（在庫・履歴・承認情報は確定しない）。 |

### 状態・データ更新

| 対象 | 実テーブル / Entity | 更新内容 |
|------|----------------------|----------|
| 在庫編集承認情報 | `dtb_stock_edit_approval`（`DtbStockEditApproval`） | 登録（未承認）。`approval_status` / `approval_member_id` / `approved_at` を保持。 |
| 在庫編集承認詳細 | `dtb_stock_edit_approval_detail`（`DtbStockEditApprovalDetail`） | 登録。`edit_quantity` / `stock_change_reason` / `purchase_unit_price` / `outbound_total_cost` / `before_edit_quantity` / `before_purchase_unit_price`。 |
| 在庫承認一覧 | `dtb_stock_approval_list`（`DtbStockApprovalList`） | 登録（未承認）。承認一覧画面で承認行為を行うための集約行（対象規格数=1・合計在庫増減数・変更前総原価など）。 |
| 規格在庫 | `dtb_product_stock`（`ProductStock`、`stock` / `total_cost`） | **廃棄のみ即時更新**（在庫ロック）。入庫は承認後に反映。 |
| 在庫変動履歴 | `dtb_stock_history`（`DtbStockHistory`） | **廃棄のみ即時登録**。`old_stock` / `stock` / `stock_change_quantity` / `stock_change_reason` / 原価 before/after、ソース種別=STOCK_EDIT、`history_source_id`=在庫編集承認ID。入庫は承認時に登録。 |
| CSV添付 | `dtb_stock_edit_csv`（`DtbStockEditCsv`、`stock_edit_id` 関連） | 在庫編集に紐づくCSVファイル管理用（主にCSV取込経由の在庫編集で使用）。本画面の手入力登録では使用しない（実装要確認）。 |
| 通知 | メール送信のみ（DB更新なし） | 承認通知先メンバーへ `sendStockApprovalAlertMail`。 |

承認ステータスは `DtbStockEditApproval::APPROVAL_STATUS_UNAPPROVED=1` / `APPROVED=2` / `REJECTED=3`。`DtbStockApprovalList` は `APPROVAL_STATUS_UNAPPROVED` で登録する。

### 関連設計への接続点

- 画面項目・履歴一覧列・帳票の詳細は、参照元Excel設計書（在庫編集シート）を正とする。
- URLエンドポイント・フォーム項目・処理順序・DBカラムは `../ec-cube-enterprise` の `StockApprovalController` / `StockApprovalStoreAction` / `StockApprovalHistoryReasonUpdateAction` / `StockChangeHistoryListBuilder` / `StockApprovalType` と各 Entity・EntityManager 実装を正とする。
- 承認確定・在庫反映は在庫承認一覧（M04 在庫承認一覧 / `StockApprovalListController`）を正とする。在庫一括編集（M04-03）は同じ承認フロー（ソース種別 STOCK_BULK_EDIT）を共有する。
