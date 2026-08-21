# m04-09_admin_stock_stock_move_transfer_register_edit — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動・振替登録/編集

### フォーム項目・バリデーション

#### 移動 登録フォーム `StockMoveNewType`（block prefix `admin_stock_move_new`）

| フォームキー | 型 | 必須 | 内容・制約 |
|--------------|----|------|------------|
| `move_from_base_info_id` | Hidden | 必須 | 出庫元店舗ID（先頭 `ProductStock` の `BaseInfo` で初期化）。 |
| `move_from_stock_location_id` | Hidden | 必須 | 出庫元在庫区分（先頭 `ProductStock` の `stockLocationId`）。 |
| `move_to_base_info` | EntityType（`BaseInfo`, `choice_label=shop_name`） | 必須 | 入庫先店舗。未指定プレースホルダあり。 |
| `move_to_stock_location_id` | Choice（`ProductStock::STOCK_LOCATION_NAME_TO_ID`） | 必須 | 入庫先在庫区分（EC-CUBE在庫／スマレジ在庫）。 |
| `memo` | Textarea | 任意 | 在庫移動・振替メモ。 |
| `stock_move_quantities` | Collection（`StockMoveQuantityType`） | — | 対象在庫ごとの移動点数。 |
| └ `product_stock_id` | Hidden | — | 移動元 `ProductStock` ID。 |
| └ `quantity` | Integer | 必須 | 移動点数。`NotBlank` / `GreaterThanOrEqual(1)` / `LessThanOrEqual(eccube_product_stock_change_quantity_max)`。 |

追加バリデーション（`POST_SUBMIT` イベント）:
- 出庫元（店舗＋在庫区分）と入庫先（店舗＋在庫区分）が完全一致する場合、`admin.stock.move.same_store_same_location_error`（「出庫元と入庫先が同じです。」）を `move_to_stock_location_id` に付与。
- 各明細で `quantity` が当該 `ProductStock` の現在庫数を超える場合、`admin.stock.move.movement_quantity_exceeds_stock`（「移動点数が現在の在庫数を超えています。」）を付与（`bccomp` 判定、`StockMoveQuantityType`）。

#### 振替 登録フォーム `StockTransferNewType`（block prefix `admin_stock_transfer_new`）

| フォームキー | 型 | 必須 | 内容・制約 |
|--------------|----|------|------------|
| `memo` | Textarea | 任意 | メモ。 |
| `transfer_details` | Collection（`StockTransferNewDetailType`） | — | 振替明細。 |
| └ `move_from_product_stock_id` | Hidden | 必須 | 振替元 `ProductStock` ID。 |
| └ `dest_product_code` | Text | 必須 | 振替先商品コード。`NotBlank`（`admin.stock.transfer.dest_product_code_required`）。 |
| └ `move_transfer_quantity` | Integer | 必須 | 振替点数。`NotBlank` / `GreaterThanOrEqual(1)` / `LessThanOrEqual(eccube_product_stock_change_quantity_max)`。 |
| `approval_department` | Choice | 任意 | 承認通知先部署（`BaseInfo` 所属メンバーの部署から生成）。 |
| `approval_notification_target_members` | Choice（multiple） | 必須 | 承認通知先メンバー。`Count(min:1)`（`admin.stock.move.approval_notification_target_required`）。 |

`base_info` には `BaseInfoRepository::getMallBaseInfo()`（本店EC）を渡す。振替は移動元・移動先とも同一 `BaseInfo`・同一在庫区分を前提とする。

### プロセスフロー（移動 登録）

1. `admin_stock_move_new`（GET/POST）: `productStockIds` から `ProductStock` を取得。先頭在庫の店舗名・在庫区分名を表示し、`move_from_*` と各明細 `product_stock_id` を初期値に `StockMoveNewType` を生成。`formAction` は `admin_stock_move_store?productStockIds=...`。
2. `admin_stock_move_store`（POST）: `productStockIds` を再取得し、`stock_move_quantities` を束ねて `StockMoveNewType` を `handleRequest`。
3. 未submit/不正なら `admin.common.save_error` を表示し同画面（`move_new.twig`）を再描画。
4. 正常なら `StockMoveStoreInput`（出庫元/入庫先 `BaseInfo`・在庫区分ID・メモ・ログインメンバー・移動点数配列）を組み立て `StockMoveStoreAction::handle()` を実行。
5. `StockMoveStoreAction`（トランザクション内）:
   1. ステータス `STATUS_NEW(1)` を取得。
   2. `StockMoveTransferEntityManager::save()` で `DtbStockMoveTransfer`（`move_transfer_type=1: 移動`）を新規作成し flush。
   3. 明細ごとに、移動元 `ProductStock` と、商品規格＋入庫先店舗＋入庫先在庫区分が一致する移動先 `ProductStock` を取得（無ければ例外「移動先の商品在庫が見つかりません」）。基準総額（基準価格×点数）・出庫総原価を計算し `DtbStockMoveTransferDetail` を作成。
   4. 在庫変動履歴 `DtbStockHistory` を作成（変動種別 `MtbStockChangeTypeDetail::MOVE_OUTBOUND`、ソース種別 `STOCK_MOVE_EDIT`、`historySourceId=移動振替ID`）。
   5. 移動元 `ProductStock` の在庫数・総原価を減算（`ProductStockEntityManager::save()`）。
   6. flush → commit。例外時は rollback。
6. 成功で `admin.common.save_complete` を表示し `admin_stock_move_outbound_approval_request?id=...` へリダイレクト。`StockMoveStoreAction` 内例外は catch して `admin.common.save_error` で同画面再表示（既存テスト `testStoreException`）。

### プロセスフロー（移動 編集＝ピック・出庫承認申請の更新）

1. `admin_stock_move_outbound_approval_request`（GET）: 現在ステータスから本ルートが適切かを `redirectByMoveTransferStatus()` で判定（不適切なら対応画面へリダイレクト）。明細（ID昇順）・ステータス履歴（更新日降順）・`StockMoveOutboundApprovalRequestType`（欠品点数・メモ・承認通知先）を表示。
2. `admin_stock_move_outbound_approval_request_update`（POST）: `StockMoveOutboundApprovalRequestUpdateAction::handle()` を実行。
   - 店舗内移動（`isSameStore()`＝出庫元店舗＝入庫先店舗）なら次ステータスを `STATUS_INBOUND_APPROVED(7)`、店舗間なら `STATUS_OUTBOUND_APPROVAL_PENDING(2)` とする。
   - 欠品点数 > 0 の明細は欠品登録者（`StockoutMember`）を更新。
   - 店舗内移動の場合は、入庫数（移動点数−欠品点数）を明細へ反映し、入庫先 `ProductStock` の在庫数・総原価を加算、変動種別 `MOVE_INBOUND` で在庫変動履歴を作成（入庫数0の明細はスキップ）。
   - 在庫承認一覧 `DtbStockApprovalList`（種別 `MOVE_OUTBOUND`、未承認）を作成。
   - flush → commit。
3. 成功で `admin.common.save_complete`。店舗内移動は `admin_stock_move_outbound_approval_request`（→ステータスが入庫完了のため完了画面へ連鎖リダイレクト）、店舗間は `admin_stock_move_outbound_approval` へリダイレクト。

> 欠品点数・差分の編集UIは設計要件（差し戻し・欠品登録）。欠品理由・廃棄理由の区別、差分商品追加は基本設計の業務要件を正とする。

### プロセスフロー（振替 登録）

1. `admin_stock_transfer_new`（GET/POST）: `productStockIds` から `ProductStock` を取得。本店EC（`getMallBaseInfo()`）と先頭在庫の在庫区分名を表示し、明細初期値（`move_from_product_stock_id`）と商品検索モーダル（`SearchProductType`）付きで `StockTransferNewType` を生成。
2. `admin_stock_transfer_store`（POST）: フォーム検証後 `StockTransferStoreInput`（本店 `BaseInfo`・在庫区分・メモ・メンバー・明細配列）で `StockTransferStoreAction::handle()` を実行。
3. `StockTransferStoreAction`（トランザクション内）:
   1. ステータス `STATUS_TRANSFER_APPROVAL_PENDING(8)` を取得。
   2. `DtbStockMoveTransfer`（`move_transfer_type=2: 振替`、出庫元＝入庫先＝本店、同一在庫区分）を作成し flush。
   3. 明細ごとに、点数≦0または商品コード空はスキップ。振替元 `ProductStock`（無ければ例外）、振替先商品コードから `ProductClass`（無ければ「振替先の商品コード「…」が見つかりません」）、振替先 `ProductStock`（商品規格＋本店＋在庫区分、無ければ例外）を解決。明細作成、在庫変動履歴 `TRANSFER_OUTBOUND`（ソース `STOCK_TRANSFER_EDIT`）作成、振替元在庫を減算。
   4. 登録できた明細が0件なら例外「登録可能な振替明細がありません」。
   5. 在庫承認一覧 `DtbStockApprovalList`（種別 `TRANSFER_OUTBOUND`、未承認、件数=登録明細数）を作成。
   6. flush → commit。
4. 成功で `admin.common.save_complete` を表示し `admin_stock_transfer_approval?id=...` へリダイレクト。例外時は catch して `admin.common.save_error` で同画面（`transfer_new.twig`）再表示（既存テスト `testStoreHandleThrowsReturnsFormView`）。

### ステータスと遷移

`MtbStockMoveTransferStatus`（`mtb_stock_move_transfer_status`）の定数:

| ID | 定数 | 名称（用途） |
|----|------|--------------|
| 1 | `STATUS_NEW` | 新規登録（移動 登録直後） |
| 2 | `STATUS_OUTBOUND_APPROVAL_PENDING` | 出庫承認待ち |
| 3 | `STATUS_REJECTED` | 却下 |
| 4 | `STATUS_OUTBOUND_APPROVED` | 出庫承認済み |
| 5 | `STATUS_MOVING` | 移動中 |
| 6 | `STATUS_INBOUND_APPROVAL_PENDING` | 入庫承認待ち |
| 7 | `STATUS_INBOUND_APPROVED` | 入庫完了（店舗内移動の更新確定先・入庫承認確定先） |
| 8 | `STATUS_TRANSFER_APPROVAL_PENDING` | 振替承認待ち（振替 登録直後） |

移動のステータス→画面リダイレクト対応（`StockMoveController::STATUS_TO_ROUTE`）: 1→出庫承認申請、2→出庫承認、3/4/7→完了、5→入庫承認申請、6→入庫承認。現ルートと一致する場合はリダイレクトせず表示（無限ループ防止）。振替のステータス→画面対応（`StockTransferController::TRANSFER_STATUS_TO_ROUTE`）: 8→承認待ち、3/7→完了。`move_transfer_type` が振替でない場合や未知ステータスは `admin.common.save_error` / `admin.stock.transfer.approval_status_error` を表示し `admin_stock_history_new` へリダイレクト。

### 在庫増減・履歴記録のまとめ

- **登録時の減算**: 移動登録・振替登録の双方で、登録時点に移動（振替）元 `ProductStock.stock`・`total_cost` を点数分減算し、変動種別 `MOVE_OUTBOUND` / `TRANSFER_OUTBOUND` の在庫変動履歴 `DtbStockHistory` を記録する（基本設計「在庫移動を新規登録すると移動元店舗の商品在庫が減算」）。
- **入庫時の加算**: 店舗内移動は出庫承認申請の更新で入庫先 `ProductStock` に即加算（変動種別 `MOVE_INBOUND`）。店舗間移動・振替は本書対象外の承認フェーズで加算する（基本設計「入庫完了で移動先に加算」）。
- **在庫変動理由**: 在庫変動理由は「在庫移動／在庫振替」とし、`stockChangeReason` は空文字で登録（理由入力項目は不要という基本設計要件に整合）。
- **ステータス履歴の自動記録**: `DtbStockMoveTransfer` の永続化/更新時、Doctrine リスナー `StockMoveTransferEventSubscriber`（`postPersist` / `postUpdate`）が `move_transfer_status_id` の変化を検知した場合のみ `DtbStockMoveTransferStatusHistory` を `StockMoveTransferStatusHistoryEntityManager` で追記する（更新者は `getUpdatedMember()`）。登録Action側は履歴を明示生成せず、ステータス変更を起点に自動記録される。

### トランザクション境界

- `StockMoveStoreAction` / `StockTransferStoreAction` / `StockMoveOutboundApprovalRequestUpdateAction` はいずれも `EntityManager::beginTransaction()` 〜 `commit()` で囲み、例外時 `rollback()` のうえ再throwする。本体・明細・在庫更新・在庫変動履歴・承認一覧・ステータス履歴は単一トランザクション内で確定し、失敗時は在庫減算を含め一切確定しない。
- Controller は Action 例外を catch し `admin.common.save_error` で同一登録画面を再表示する。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 移動振替本体 | `dtb_stock_move_transfer`（`move_transfer_type`、`move_transfer_status_id`、`move_from_base_info_id` / `move_from_stock_location_id`、`move_to_base_info_id` / `move_to_stock_location_id`、`memo`、`rejected_memo`、`registered_member_id`、`updated_member_id`、各承認者/承認日時、`tracking_no`、`move_instruction_id` ほか）。登録系で新規作成・編集系で更新。 |
| 明細 | `dtb_stock_move_transfer_detail`（移動元/移動先 `ProductStock`、`move_transfer_quantity`、`standard_total_price`、`outbound_total_cost`、`stockout_quantity`、`difference_quantity`、`move_to_quantity`、欠品/差分登録者 ほか）。 |
| ステータス履歴 | `dtb_stock_move_transfer_status_history`（`stock_move_transfer_id`、`stock_move_transfer_status_id`、`update_member_id`）。ステータス変化時に自動追記。 |
| 在庫 | `dtb_product_stock`（`stock` / `total_cost`、store・stock_location単位）を増減。 |
| 在庫変動履歴 | `dtb_stock_history`（変動種別 `MOVE_OUTBOUND` / `MOVE_INBOUND` / `TRANSFER_OUTBOUND`、ソース種別 `STOCK_MOVE_EDIT` / `STOCK_TRANSFER_EDIT`、`history_source_id=移動振替ID`）。 |
| 在庫承認一覧 | `dtb_stock_approval_list`（振替登録・店舗内移動更新で未承認データを作成）。 |

### 分岐・遷移・例外（実メッセージキー）

- **保存成功**: `admin.common.save_complete`（移動/振替 登録・更新）。
- **入力不備・保存失敗**: `admin.common.save_error`（フォーム未submit/不正、Action例外）。同一登録/編集画面を再描画。
- **移動 同一店舗・同一在庫区分指定**: `admin.stock.move.same_store_same_location_error`。
- **移動 点数が在庫超過**: `admin.stock.move.movement_quantity_exceeds_stock`。
- **承認通知先未選択**: `admin.stock.move.approval_notification_target_required`。
- **振替 振替先コード未入力**: `admin.stock.transfer.dest_product_code_required`。振替先コード不正・在庫なしは Action 例外（メッセージは `dest_product_code_not_found` / `dest_product_code_no_stock` 等を画面側で案内、サーバは `admin.common.save_error`）。
- **状態不整合**: 移動の出庫承認送信で承認待ちでない場合 `admin.stock.move.outbound_approval_status_error`。振替の承認系で振替区分でない/未知ステータスは `admin.stock.transfer.approval_status_error`、登録者本人の承認・却下は `admin.stock.transfer.approval_self_error`（いずれも本書では遷移先として参照）。
- **対象なし（404）**: `{id}` に該当する `DtbStockMoveTransfer` が無い場合は `#[MapEntity]` により404。
- **振替補助API**: `admin_stock_transfer_dest_product_class_info` は `product_class_id<=0` で400、`ProductClass` 未存在で404、正常時JSON。

### 関連設計への接続点

- 入口（チェックした在庫を持って遷移、複数店舗／複数在庫区分／編集権限なし／在庫0の遷移可否）は在庫検索一覧（M04-01）を正とする。
- 画面項目・帳票（ピック表・返品リストPDF）・CSV列の詳細は参照元Excel設計書の該当シートを正とする。
- 承認・却下・差し戻し・欠品/差分確定の各フェーズ、在庫移動振替一覧・在庫移動実績インポート・在庫移動指示、スマレジ連携条件は対応する M04 機能設計を正とする。
- URLエンドポイント・フォーム項目・DBカラム・在庫増減ロジックは `../ec-cube-enterprise` の `StockMoveController` / `StockTransferController`、各 `*StoreAction` / `*UpdateAction`、`*EntityManager`、`DtbStockMoveTransfer` 群 Entity を正とする。
