# 在庫管理 — 在庫移動・振替登録/編集

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫移動・振替登録/編集 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveController` / `StockTransferController`、`StockMoveStoreAction` / `StockTransferStoreAction` / `StockMoveOutboundApprovalRequestUpdateAction`、`StockMoveNewType` / `StockMoveQuantityType` / `StockTransferNewType` / `StockTransferNewDetailType`、`StockMoveTransferEntityManager` / `StockMoveTransferDetailEntityManager` / `StockMoveTransferStatusHistoryEntityManager` / `ProductStockEntityManager` / `StockHistoryEntityManager` / `StockApprovalListEntityManager`、`DtbStockMoveTransfer` / `DtbStockMoveTransferDetail` / `DtbStockMoveTransferStatusHistory` / `MtbStockMoveTransferStatus` / `ProductStock`、`StockMoveTransferEventSubscriber`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫移動・振替登録/編集

### 機能の目的と役割

在庫検索一覧（M04-01）でチェックした商品在庫（`ProductStock`）を持って遷移し、店舗間の在庫「移動（move）」または同一店舗内の在庫区分間の「振替（transfer）」を登録・編集する管理画面機能。

- **移動（move）**: 出庫元店舗・在庫区分から入庫先店舗・在庫区分へ在庫を動かす。登録時点で移動元在庫を減算し、ステータスを「新規登録」とする。以降はピック・出庫承認申請 → 出庫承認 → 入庫承認申請 → 入庫承認の各フェーズを経て入庫先在庫を加算する（承認系フェーズの詳細は別機能の設計を正とする）。ただし出庫元と入庫先が同一店舗の場合は承認不要で、出庫承認申請の更新時に即入庫完了とする。
- **振替（transfer）**: 同一店舗・同一店舗内の在庫区分間で、1対1の商品移動（状態変更による移動。例: ショーケース品＝スマレジ在庫から EC 在庫＝EC-CUBE への移動）を登録する。登録時点で振替元在庫を減算し、ステータスを「振替承認待ち」として承認一覧（`DtbStockApprovalList`）へ載せる。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。画面・項目・業務条件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・フォーム項目・DBカラム・在庫増減ロジック・トランザクション境界はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 在庫移動の初期登録（`admin_stock_move_new` / `admin_stock_move_store`）のフォーム項目・バリデーション・在庫減算・履歴記録
- 在庫移動の編集（ピック・出庫承認申請のデータ更新 `admin_stock_move_outbound_approval_request_update`）における欠品登録・メモ更新・店舗内移動時の入庫先在庫加算
- 在庫振替の登録（`admin_stock_transfer_new` / `admin_stock_transfer_store`）のフォーム項目・バリデーション・在庫減算・履歴記録・承認一覧登録
- 登録/編集に伴うトランザクション境界、ステータス遷移、ステータス履歴の自動記録
- 入力不備・対象なし・状態不整合時の扱い（実メッセージキー）

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能・対応シートの設計を正とする。

- 出庫承認（`admin_stock_move_outbound_approval(_submit)`）、入庫承認申請・入庫承認（`admin_stock_move_inbound_approval_request(_update)` / `admin_stock_move_inbound_approval(_submit)`）、振替承認（`admin_stock_transfer_approval(_submit)`）の承認・却下・差し戻し・在庫加算の確定処理
- 在庫移動振替一覧（M04 別機能 `StockMoveTransferController`）、在庫移動実績インポート、在庫移動指示、在庫移動CSV出力、ピックリスト/返品リストPDFの仕様
- 在庫検索一覧（M04-01）側の遷移可否判定（複数店舗／複数在庫区分／編集権限なし／在庫0のアラート）。本機能はそれらを通過した在庫を受け取る前提
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | ルート名 / HTTPメソッド / path | ふるまい |
|------|------------------------------|----------|
| 移動 初期登録画面 | `admin_stock_move_new` / GET,POST / `/%admin%/product/stock/move/new` | 受け取った `productStockIds`（POST=`request`、GET=`query`）から `ProductStock` を ID昇順取得し、先頭在庫の店舗・在庫区分を出庫元として `StockMoveNewType` を初期表示する。 |
| 移動 登録処理 | `admin_stock_move_store` / POST / `/%admin%/product/stock/move/store` | フォーム検証後 `StockMoveStoreAction` を実行。成功で `admin_stock_move_outbound_approval_request` へリダイレクト。失敗は同画面再表示。 |
| 移動 ピック・出庫承認申請画面（編集） | `admin_stock_move_outbound_approval_request` / GET / `/%admin%/product/stock/move/outbound_approval_request/{id}` | ステータスに応じてリダイレクト判定後、明細・履歴・`StockMoveOutboundApprovalRequestType` を表示。欠品点数・メモ・承認通知先を編集する画面。 |
| 移動 出庫承認申請の更新（編集確定） | `admin_stock_move_outbound_approval_request_update` / POST / `/%admin%/product/stock/move/outbound_approval_request/{id}/update` | 欠品登録者・メモを更新。店舗内移動なら入庫先在庫を加算しステータスを「入庫完了」、店舗間なら「出庫承認待ち」へ遷移。 |
| 振替 初期登録画面 | `admin_stock_transfer_new` / GET,POST / `/%admin%/product/stock/transfer/new` | `productStockIds` から `ProductStock` を取得し、`StockTransferNewType`（振替先商品コード入力・承認通知先）と商品検索モーダルを表示。 |
| 振替 登録処理 | `admin_stock_transfer_store` / POST / `/%admin%/product/stock/transfer/store` | フォーム検証後 `StockTransferStoreAction` を実行。成功で `admin_stock_transfer_approval` へリダイレクト。失敗は同画面再表示。 |
| 振替 振替先商品情報取得（補助） | `admin_stock_transfer_dest_product_class_info` / GET / `/%admin%/product/stock/transfer/dest-product-class-info` | `product_class_id` から商品名・コード・言語・カード状態・Foil・基準価格をJSONで返す（振替先セル表示用）。`product_class_id<=0` は400、未存在は404。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。すべて管理画面ログインを要する。`{id}` 系は `requirements: ['id' => '\d+']` かつ `#[MapEntity]` で `DtbStockMoveTransfer` を解決し、未存在時は404（既存テスト `testOutboundApprovalRequestWithNonExistentId`）。

> 参考: 登録後の以降フェーズ（本書対象外）は移動が `admin_stock_move_outbound_approval(_submit)` → `admin_stock_move_inbound_approval_request(_update)` → `admin_stock_move_inbound_approval(_submit)` → `admin_stock_move`（完了）、振替が `admin_stock_transfer_approval(_submit)` → `admin_stock_transfer`（完了）。

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

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-09-MSG-001 | 管理画面上部 | 保存に失敗しました | Failed to save | 必須項目の未入力など、入力内容に不備があるまま保存したとき | 移動初期登録画面に留まる |
| M04-09-MSG-002 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | （英訳なし） | 出庫元店舗の在庫を編集する権限がないとき | 在庫一覧画面に遷移する |
| M04-09-MSG-003 | 管理画面上部 | 保存に失敗しました | Failed to save | 在庫移動の登録中にエラーが起きたとき | 移動初期登録画面に留まる |
| M04-09-MSG-004 | 管理画面上部 | 保存しました | Saved | 在庫移動を登録したとき | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-005 | 管理画面上部 | 保存に失敗しました | Failed to save | 必須項目の未入力など、入力内容に不備があるまま保存したとき | 移動ピック・出庫承認申請画面に留まる |
| M04-09-MSG-006 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | （英訳なし） | 出庫元店舗を確認できない、またはその在庫を編集する権限がないとき | 在庫一覧画面に遷移する |
| M04-09-MSG-007 | 管理画面上部 | 保存に失敗しました | Failed to save | 出庫の承認申請を更新中にエラーが起きたとき | 移動ピック・出庫承認申請画面に留まる |
| M04-09-MSG-008 | 管理画面上部 | 保存しました | Saved | 出庫の承認申請を更新したとき | 同一店舗は在庫移動完了画面、その他は移動出庫承認画面に遷移する |
| M04-09-MSG-009 | 管理画面上部 | ピック表を出力できるステータスではありません。 | （英訳なし） | ピック表を出力できない在庫移動の状態で出力しようとしたとき | エラー情報をJSONで返す |
| M04-09-MSG-010 | 管理画面上部 | ピック表を出力する権限がありません。 | （英訳なし） | 出庫元店舗を確認できない状態でピック表を出力しようとしたとき | エラー情報をJSONで返す |
| M04-09-MSG-011 | 管理画面上部 | ピック表を出力する権限がありません。 | （英訳なし） | 出庫元店舗のピック表を出力する権限がないとき | エラー情報をJSONで返す |
| M04-09-MSG-012 | 管理画面上部 | 出庫承認待ちの状態でないため、操作できません。 | （英訳なし） | 出庫承認待ちではない在庫移動を操作しようとしたとき | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-013 | 管理画面上部 | 保存に失敗しました | Failed to save | 承認操作として使用できない操作を送信したとき | 移動出庫承認画面に遷移する |
| M04-09-MSG-014 | 管理画面上部 | 保存に失敗しました ／ 却下する場合は却下理由を入力してください。 | Failed to save ／ （英訳なし） | 在庫移動の却下時に入力内容が不正なとき | 移動出庫承認画面に遷移する |
| M04-09-MSG-015 | 管理画面上部 | 承認権限がありません。 | （英訳なし） | 承認する権限がないとき | 移動出庫承認画面に遷移する |
| M04-09-MSG-016 | 管理画面上部 | 保存に失敗しました | Failed to save | 出庫承認を却下する処理中にエラーが起きたとき | 移動出庫承認画面に遷移する |
| M04-09-MSG-017 | 管理画面上部 | 却下しました。 | （英訳なし） | 出庫承認を却下したとき | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-018 | 管理画面上部 | 保存に失敗しました | Failed to save | 出庫承認の処理中にエラーが起きたとき | 移動出庫承認画面に遷移する |
| M04-09-MSG-019 | 管理画面上部 | 承認しました。 | （英訳なし） | 出庫承認を行ったとき | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-020 | 管理画面上部 | 保存に失敗しました | Failed to save | 移動先店舗を確認できないとき | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-021 | 管理画面上部 | 保存に失敗しました | Failed to save | 画面の有効期限切れなどで、送信を確認できなかったとき | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-022 | 管理画面上部 | 差分CSV登録可能なステータスではありません。 ／ 保存に失敗しました ／ 入庫先の商品在庫が見つかりません。 ／ この商品は既に一覧に登録されています。 ／ 出庫元の商品在庫が見つかりません。 | The current status does not allow differential CSV import. ／ Failed to save ／ Destination product stock was not found. ／ This product is already listed. ／ Source product stock was not found. | 入庫承認申請画面で差分商品を追加し、追加条件を満たさないとき | 移動入庫承認申請画面に遷移する |
| M04-09-MSG-023 | 管理画面上部 | 保存に失敗しました | Failed to save | 移動先店舗を確認できないとき | 移動ピック・出庫承認申請画面に遷移する |
| M04-09-MSG-024 | 管理画面上部 | 保存に失敗しました | Failed to save | 必須項目の未入力など、入力内容に不備があるまま保存したとき | 移動入庫承認申請画面に留まる |
| M04-09-MSG-025 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | （英訳なし） | 移動先店舗の在庫を編集する権限がないとき | 在庫一覧画面に遷移する |
| M04-09-MSG-026 | 管理画面上部 | 保存に失敗しました | Failed to save | 入庫の承認申請を更新中にエラーが起きたとき | 移動入庫承認申請画面に留まる |
| M04-09-MSG-027 | 管理画面上部 | 保存しました | Saved | 入庫の承認申請を更新したとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-028 | 管理画面上部 | 保存に失敗しました | Failed to save | 入庫承認操作として使用できない操作を送信したとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-029 | 管理画面上部 | 保存に失敗しました | Failed to save | 入力内容に不備があるまま送信したとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-030 | 管理画面上部 | 承認権限がありません。 | （英訳なし） | 承認する権限がないとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-031 | 管理画面上部 | 保存に失敗しました | Failed to save | 入庫を再確認する処理中にエラーが起きたとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-032 | 管理画面上部 | 保存に失敗しました | Failed to save | 入庫承認の処理中にエラーが起きたとき | 移動入庫承認画面に遷移する |
| M04-09-MSG-033 | 管理画面上部 | 承認しました。 | （英訳なし） | 入庫承認を行ったとき | 在庫移動完了画面に遷移する |
| M04-09-MSG-034 | 管理画面上部 | 戻しリストPDFを出力できるステータスではありません。 | Return list PDF cannot be exported in the current status. | 戻しリストPDFを出力できない状態で出力しようとしたとき | エラー情報をJSONで返す |
| M04-09-MSG-035 | 管理画面上部 | 対象のデータが見つかりません。 ／ ID: %d は入庫先店舗が設定されていません。 ／ ID: %d は権限のない店舗のデータです。 ／ ID: %d は対象外のステータスです。 ／ ID: %d は存在しません。 ／ 複数店舗の在庫移動・振替情報を同時に処理することはできません。 | No matching data found. ／ （英訳なし） ／ Stock move/transfer records from multiple stores cannot be processed at the same time. | 戻しリストPDFを出力し、対象データ・入庫先店舗・操作権限のいずれかに問題があるとき | エラー情報をJSONで返す |
| M04-09-MSG-036 | 管理画面上部 | 保存に失敗しました | Failed to save | 必須項目の未入力など、入力内容に不備があるまま保存したとき | 在庫振替初期登録画面に留まる |
| M04-09-MSG-037 | 管理画面上部 | 承認待ちの在庫振替ではありません。または既に処理済みです。 | This stock transfer is not awaiting approval, or it has already been processed. | 承認待ちではない、または処理済みの在庫振替を操作しようとしたとき | 在庫履歴一覧画面に遷移する |
| M04-09-MSG-038 | 管理画面上部 | 保存に失敗しました | Failed to save | 在庫振替の登録中にエラーが起きたとき | 在庫振替初期登録画面に留まる |
| M04-09-MSG-039 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | （英訳なし） | 基準店舗の在庫を編集する権限がないとき | 在庫一覧画面に遷移する |
| M04-09-MSG-040 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | （英訳なし） | 振替元店舗の在庫を編集する権限がないとき | 在庫一覧画面に遷移する |
| M04-09-MSG-041 | 管理画面上部 | 保存に失敗しました | Failed to save | 在庫振替の登録中にエラーが起きたとき | 在庫振替初期登録画面に留まる |
| M04-09-MSG-042 | 管理画面上部 | 保存しました | Saved | 在庫振替を登録したとき | 在庫振替承認画面に遷移する |
| M04-09-MSG-043 | 管理画面上部 | 保存に失敗しました | Failed to save | 承認操作として使用できない操作を送信したとき | 在庫振替承認画面に遷移する |
| M04-09-MSG-044 | 管理画面上部 | 保存に失敗しました ／ 却下する場合は却下理由を入力してください。 | Failed to save ／ （英訳なし） | 在庫振替の却下時に入力内容が不正なとき | 在庫振替承認画面に留まる |
| M04-09-MSG-045 | 管理画面上部 | 承認権限がありません。 | （英訳なし） | 承認する権限がないとき | 在庫振替承認画面に遷移する |
| M04-09-MSG-046 | 管理画面上部 | 保存に失敗しました | Failed to save | 在庫振替を却下する処理中にエラーが起きたとき | 在庫振替承認画面に遷移する |
| M04-09-MSG-047 | 管理画面上部 | 却下しました。 | （英訳なし） | 在庫振替を却下したとき | 在庫振替完了画面に遷移する |
| M04-09-MSG-048 | 管理画面上部 | 保存に失敗しました | Failed to save | 在庫振替を承認する処理中にエラーが起きたとき | 在庫振替承認画面に遷移する |
| M04-09-MSG-049 | 管理画面上部 | 承認しました。 | （英訳なし） | 在庫振替を承認したとき | 在庫振替完了画面に遷移する |
| M04-09-MSG-050 | 欠品CSV取込モーダル内 | セッションがタイムアウトしました。もう一度やり直してください。 | （英訳なし） | 画面の有効期限切れなどで、送信を確認できなかったとき | モーダルは開いたまま |
| M04-09-MSG-051 | 欠品CSV取込モーダル内 | CSVファイルを選択してください。 | Please select a CSV file. | CSVファイルを選択せずに取り込もうとしたとき | モーダルは開いたまま |
| M04-09-MSG-052 | 欠品CSV取込モーダル内 | 欠品CSV登録可能なステータスではありません。 | The current status does not allow shortage CSV import. | 欠品CSVを登録できない在庫移動の状態で取り込もうとしたとき | モーダルは開いたまま |
| M04-09-MSG-053 | 欠品CSV取込モーダル内 | 保存に失敗しました | Failed to save | CSVの取込中にエラーが起きたとき | モーダルは開いたまま |
| M04-09-MSG-055 | 差分CSV取込モーダル内 | セッションがタイムアウトしました。もう一度やり直してください。 | （英訳なし） | 画面の有効期限切れなどで、送信を確認できなかったとき | モーダルは開いたまま |
| M04-09-MSG-056 | 差分CSV取込モーダル内 | CSVファイルを選択してください。 | Please select a CSV file. | CSVファイルを選択せずに取り込もうとしたとき | モーダルは開いたまま |
| M04-09-MSG-057 | 差分CSV取込モーダル内 | 差分CSV登録可能なステータスではありません。 | The current status does not allow differential CSV import. | 差分CSVを登録できない在庫移動の状態で取り込もうとしたとき | モーダルは開いたまま |
| M04-09-MSG-058 | 差分CSV取込モーダル内 | 保存に失敗しました | Failed to save | CSVの取込中にエラーが起きたとき | モーダルは開いたまま |
| M04-09-MSG-060 | 画面上部フラッシュ | 保存に失敗しました | Failed to save | 在庫振替ではないデータを操作しようとしたとき | 画面に留まる（保存されず） |
| M04-09-MSG-061 | JSアラート | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | （英訳なし） | ピック表を開こうとしたが、ブラウザにポップアップをブロックされたとき | ピック表を出力せず、現在の画面に留まる |
| M04-09-MSG-062 | JSアラート | ピック表用データの取得に失敗しました。 | （英訳なし） | ピック表用データの取得中にエラーが起きたとき | ポップアップを閉じ、現在の画面に留まる |
| M04-09-MSG-063 | JSアラート | ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。 | Pop-up was blocked. Could not open the return list PDF. Please check your browser settings. | 戻しリストPDFを開こうとしたが、ブラウザにポップアップをブロックされたとき | 戻しリストPDFを出力せず、現在の画面に留まる |
| M04-09-MSG-064 | 別ウィンドウ | 読み込み中… | Loading… | ポップアップを開いた後、データの読み込みが完了するまで | PDFデータ取得後、ポップアップに戻しリストPDFを表示する |
| M04-09-MSG-065 | JSアラート | 戻しリストPDF用データの取得に失敗しました。 | Failed to retrieve return list PDF data. | 戻しリストPDF用データの取得中にエラーが起きたとき | ポップアップを閉じ、現在の画面に留まる |
| M04-09-MSG-066 | JSアラート | 商品の検索に失敗しました。 | Product search failed. | 商品を検索中にエラーが起きたとき | 商品検索結果を更新せず、現在の画面に留まる |
| M04-09-MSG-067 | JSアラート | 選択されていません | No file selected | 規格のある商品で、規格を選ばずに追加しようとしたとき | 商品を追加せず、入庫承認申請画面に留まる |
| M04-09-MSG-068 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を新規登録してよろしいですか？ | （英訳なし） | 在庫移動の新規登録を送信するときの確認表示 | OKでモーダルを閉じて在庫移動を登録し、キャンセルでモーダルを閉じる |
| M04-09-MSG-069 | 確認モーダル | ※新規登録時に、移動対象の商品の在庫が移動点数分減る処理が行われます。 | （英訳なし） | 在庫移動の新規登録を送信するときの確認表示 | OKでモーダルを閉じて在庫移動を登録し、キャンセルでモーダルを閉じる |
| M04-09-MSG-070 | 確認モーダル | この操作はあとから取り消すことができません。店舗内入庫を確定してよろしいですか？ | （英訳なし） | 同一店舗への入庫を確定するときの確認表示 | OKでモーダルを閉じて店舗内入庫を確定し、キャンセルでモーダルを閉じる |
| M04-09-MSG-071 | 確認モーダル | ※欠品点数の登録と入庫処理が完了します。 | （英訳なし） | 同一店舗への入庫を確定するときの確認表示 | OKでモーダルを閉じて店舗内入庫を確定し、キャンセルでモーダルを閉じる |
| M04-09-MSG-072 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認申請してよろしいですか？ | （英訳なし） | 他店舗への在庫移動を承認申請するときの確認表示 | OKでモーダルを閉じて承認申請を実行し、キャンセルでモーダルを閉じる |
| M04-09-MSG-073 | 確認モーダル | ※欠品については、承認申請するボタンをクリックすると欠品登録されます。 | （英訳なし） | 他店舗への在庫移動を承認申請するときの確認表示 | OKでモーダルを閉じて承認申請を実行し、キャンセルでモーダルを閉じる |
| M04-09-MSG-074 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を却下してよろしいですか？ | （英訳なし） | 在庫移動の却下を実行するときの確認表示 | OKでモーダルを閉じて入庫承認申請画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-075 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認してよろしいですか？ | （英訳なし） | 在庫移動の承認を実行するときの確認表示 | OKでモーダルを閉じて入庫承認申請画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-076 | 確認モーダル | この操作はあとから取り消すことができません。入庫処理について承認申請してよろしいですか？ | （英訳なし） | 入庫処理の承認申請を送信するときの確認表示 | OKでモーダルを閉じて入庫承認画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-077 | 確認モーダル | ※差分があるものについて、この申請で差分に関わる処理は実行されません。 | （英訳なし） | 入庫処理の承認申請を送信するときの確認表示 | OKでモーダルを閉じて入庫承認画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-078 | 確認モーダル | この操作を行うと再度入庫処理を行うことになりますが、よろしいですか？ | （英訳なし） | 入庫処理を再確認するときの確認表示 | OKでモーダルを閉じて再入庫処理を実行し、キャンセルでモーダルを閉じる |
| M04-09-MSG-079 | 確認モーダル | この操作はあとから取り消すことができません。在庫移動を承認してよろしいですか？ | （英訳なし） | 在庫移動の承認を実行するときの確認表示 | OKでモーダルを閉じて在庫移動画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-080 | 確認モーダル | ※差分があるものについては出庫元に通知が行きます | （英訳なし） | 在庫移動の承認を実行するときの確認表示 | OKでモーダルを閉じて在庫移動画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-081 | 確認モーダル | この操作はあとから取り消すことができません。在庫振替を却下してよろしいですか？ | This action cannot be undone. Reject this stock transfer? | 在庫振替の却下を実行するときの確認表示 | OKでモーダルを閉じて在庫振替画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-082 | 確認モーダル | この操作はあとから取り消すことができません。在庫振替を承認してよろしいですか？ | This action cannot be undone. Approve this stock transfer? | 在庫振替の承認を実行するときの確認表示 | OKでモーダルを閉じて在庫振替画面に遷移、キャンセルでモーダルを閉じる |
| M04-09-MSG-083 | 確認モーダル | 商品を削除（振替対象外）にします。よろしいですか。 | This product will be removed from the transfer (excluded). Continue? | 振替対象の商品を削除するときの確認表示 | OKでモーダルを閉じて対象明細を削除し、キャンセルでモーダルを閉じる |
| M04-09-MSG-084 | 入力項目付近（インライン） | 振替先の商品コードを入力してください。 | Please enter the destination product code. | 振替先の商品コードを入力せずに送信したとき | 新規登録画面に留まる |
| M04-09-MSG-085 | 画面上部フラッシュ | 却下する場合は却下理由を入力してください。 | （英訳なし） | 却下理由を入力せずに却下しようとしたとき | 承認画面に遷移する |
| M04-09-MSG-086 | 画面中央(ダイアログ) | 選択されていません | No file selected | 規格を選ばずに商品を確定しようとしたとき | 送信せず現在の画面に留まる |
| M04-09-MSG-087 | 画面中央(ダイアログ) | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | （英訳なし） | ピック表を開こうとしたが、ブラウザにポップアップをブロックされたとき | 現在の画面に留まる |
| M04-09-MSG-088 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | （英訳なし） | ピック表用データを取得できなかったとき | 元画面に留まる |
| M04-09-MSG-089 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | （英訳なし） | ピック表用データの取得中に通信エラーが起きたとき | 元画面に留まる |
| M04-09-MSG-090 | 画面中央(ダイアログ) | ポップアップがブロックされているため、戻しリストPDFを開けませんでした。ブラウザの設定を確認してください。 | Pop-up was blocked. Could not open the return list PDF. Please check your browser settings. | 戻しリストPDFを開こうとしたが、ブラウザにポップアップをブロックされたとき | 現在の画面に留まる |
| M04-09-MSG-091 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | Failed to retrieve return list PDF data. | 戻しリストPDF用データを取得できなかったとき | 元画面に留まる |
| M04-09-MSG-092 | 画面中央(ダイアログ) | 戻しリストPDF用データの取得に失敗しました。 | Failed to retrieve return list PDF data. | 戻しリストPDF用データの取得中に通信エラーが起きたとき | 元画面に留まる |
| M04-09-MSG-093 | 画面中央(モーダル) | セッションがタイムアウトしました。もう一度やり直してください。 | （英訳なし） | 差分CSVの取込時に、画面の有効期限切れなどで送信を確認できなかったとき | モーダルは開いたまま |
| M04-09-MSG-094 | 画面中央(モーダル) | 保存に失敗しました | Failed to save | 差分CSVの取込中に通信エラーが起きたとき | モーダルは開いたまま |
| M04-09-MSG-095 | 画面中央(モーダル) | セッションがタイムアウトしました。もう一度やり直してください。 | （英訳なし） | 欠品CSVの取込時に、画面の有効期限切れなどで送信を確認できなかったとき | モーダルは開いたまま |
| M04-09-MSG-096 | 画面中央(モーダル) | 保存に失敗しました | Failed to save | 欠品CSVの取込中に通信エラーが起きたとき | モーダルは開いたまま |

## リニューアル移行時の扱い

- 本機能は新規実装であり、対応する現行（pf-eccube3）の同等機能は存在しない。仕様は基本設計仕様書（在庫管理機能）を正とする。
- 移行先のec-cube-enterpriseでの永続化先は在庫移動振替本体（`dtb_stock_move_transfer`）、明細（`dtb_stock_move_transfer_detail`）、ステータス履歴（`dtb_stock_move_transfer_status_history`）であり、いずれもec-cube-enterprise実装に実在する。在庫は規格在庫（`dtb_product_stock`）、在庫変動履歴は `dtb_stock_history`、承認一覧は `dtb_stock_approval_list` を用いる。
- ステータス遷移（新規登録・出庫承認待ち・出庫承認済み・移動中・入庫承認待ち・入庫完了・却下・振替承認待ち）は `mtb_stock_move_transfer_status`（ID 1〜8）で管理し、在庫加減算・スマレジ連携・差し戻し/欠品/差分の業務条件は基本設計仕様書を正とする。
- 現行に同等のテーブルは無いため、テーブル分割（移動振替本体・明細・ステータス履歴）の構成およびステータス履歴の自動記録（Doctrineリスナー方式）は移行先のec-cube-enterprise実装を正とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動・振替登録 編集 (移動)
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
堀部
作成日
2025-08-25
更新者
石川
更新日
2026-02-06
機能No
M04-09
機能名
在庫移動・振替登録 編集（移動１（新規））
概要
—
処理概要 初期登録画面
処理概要 ピック・出庫処理申請画面
処理概要 出庫承認画面
処理概要 入庫承認申請画面
処理概要 入庫承認画面
処理概要 完了画面
図形・テキストボックス内テキスト（214件）
レイアウト図 初期登録画面
1-2
1-4
1-5
2-1
1-7
1-6
2-2
2-3
2-4
1-1
3-1
1-3
3-2
3-3
3-4
3-5
3-6
1-8
1-9
1-11
1-10
3-7
4-1
4-2
4-3
5-1
6-1
6-2
6-3
7-2
7-1
画像レイヤー（2枚）: 在庫移動・振替登録 編集 (移動) / B7 / image 9 + 在庫移動・振替登録 編集 (移動) / B7 / image 10
機能仕様処理概要 初期登録画面
初期登録画面概要
・在庫検索一覧画面から任意の商品在庫を選択し、在庫検索一覧画面の「在庫移動登録」ボタンを押下すると、選択商品在庫を移動対象とし、この画面（在庫移動登録の初期画面）へ遷移する
・選択した商品に対して、移動点数を入力して登録を行う
・登録後、ステータスは新規作成となり、移動対象の商品の在庫が移動点数分減る
移動登録ステータス遷移
アクション
ステータス
新規
登録
ピック
欠品
登録
新規
登録
入庫
完了
アクション
ステータス
入庫先
NG
新規
登録
ピック
欠品
登録
出庫
承認
発送
手続き
着荷
入庫
承認
差分
通知
新規
登録
出庫
承認待ち
却下
出庫
承認済み
移動中
入庫
完了
入庫
承認待ち
NG
差分
登録
新規登録画面
アクション
ステータス
入庫先
NG
新規
登録
ピック
欠品
在庫移動・振替登録 編集(振替)
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
堀部
作成日
2025-08-25
更新者
石川
更新日
2025-11-08
機能No
M04-09
機能名
在庫移動・振替登録 編集（振替）
概要
在庫の振替を行う
・ 状態変更による移動をこの機能について対応とする
処理概要 初期登録画面
処理概要 在庫振替承認待ち画面
処理概要 入庫完了・却下画面
処理概要 商品検索モーダル
図形・テキストボックス内テキスト（66件）
レイアウト図 初期登録画面
4-1
5-1
5-2
1-1
1-2
1-4
1-5
1-6
2-1
2-2
2-3
2-4
3-1
3-2
3-7
3-4
3-11
3-12
3-3
1-3
3-5
3-6
3-9
3-10
3-8
3-13
3-14
1-7
1-8
1-9
画像レイヤー（2枚）: 在庫移動・振替登録 編集(振替) / A8 / image 9 + 在庫移動・振替登録 編集(振替) / A8 / image 10
要件説明（要件定義の内容）
概要
在庫の店舗間移動することが可能
機能
データの権限について
・移動元の在庫データに関してはユーザーが編集権限を保持している店舗に関連付けられた在庫データを編集可能とする
・移動先に関してはユーザーの編集権限がなくても指定することを可能とする
在庫移動対象について
・店舗間での在庫移動が可能とする
※本店EC(2F)から本店バックヤード（3F,B2F）、成田倉庫への移動も含む
・他店舗への在庫移動の場合、在庫区分区分は同じ区分しか選択できないものとする。ECCUBEの在庫からスマレジ在庫への移動、もしくはその反対のパターンを禁止
・同一店舗内も移動可能とする。自店舗内移動の場合のみ別区分を選択可能とする。また同一店舗内の移動の場合、承認は不要
例）同一店舗内にてショーケース品（スマレジ在庫）からEC在庫（EC-CUBE）への移動
・状態変更による移動をこの機能について対応とする
※1対１の商品移動
操作要件
・在庫検索/一覧画面で選択した商品を移動させることが可能とする
・商品登録されていない物品や什器などは在庫移動機能の対象外とする
登録後のデータ変更に関して
・送付ミス等による在庫状況に問題がある場合、差し戻しを行う為、在庫移動内容の修正・追加を実施できるようにする
・在庫移動時に入庫側では却下は選択できず、「差し戻し」を選択し、物理在庫と論理在庫が一致するような修正登録を行う
差し戻し登録について
・入庫先で発送内容に不備を発見し、問題がある状態になっている論理在庫を物理在庫の状況に合わせるよう管理画面で差分情報を登録する
数量の不備 --- 差分点数を登録
発送カードの種類違いのミス --- 差分商品追加からダイアログを開き、ミスのあった商品を在庫移動に追加する
・差し戻しのステータスが届いた出庫元は内容を確認し、承認を行う。出庫元が承認を行なった檀家で、出庫元の在庫を差し戻し内容に沿って更新を行う
差し戻し承認前に出庫元による欠品登録は可能とする
想定以上の点数を送付してしまっている状態で出庫元側で受注等で在庫変動が発生した状態で欠品が発覚するケースが考えられるため
欠品登録について
・現行システムの受注登録と同じように、欠品登録を行えるようにする
欠品登録は移動元店舗が行う
欠品理由を登録できるようにする
・廃棄、棚卸ロスは切り出して計上する
廃棄理由を登録できるようにする
※廃棄理由と欠品理由は分けて登録し、分析機能で集計できるようにする
在庫変更理由について
・在庫変動理由を在庫移動とし入力項目は不要とする
・在庫変動履歴は、下記の内容を表示する
1． 受注の時のように、在庫変動による在庫数、増減という表現とする
2． 店舗移動の移動元と移動先を表示する※○○店から○○店に移動のようなメッセージを表示する
3． 在庫移動登録IDを表示する
・詳細は「在庫変動時の履歴作成について」シートを参照
在庫変動について
・在庫移動を新規登録すると移動元店舗の商品在庫が減算とする
・入庫後に入庫完了にされると移動先の店舗に商品在庫が加算とする
・差し戻し後に移動元店舗側で承認を行うと、差分の修正変動(加算・減算どちらも)が発生する
・在庫移動が新規登録されたのち、承認されず却下された場合は出庫元の在庫移動を戻す処理を行う(在庫を加算する)
ステータス管理について
・在庫移動状況をステータスで管理する
・「在庫移動実績インポート」にてインポートが行われた際もステータスが変更とする
※通販チームによって本店から支店に在庫移動する場合などを想定
在庫移動指示リストについて
・"在庫移動指示"機能にてリスト作成時対象データとする
入庫時振り分けについて
本店に発送する際は、いったんすべて3Fにすればよい。その後統合仕入れにて振り分けを行う。
そのため、在庫移動時に振り分けは不要
支店は即入庫されても懸念がなく、合理的であると考えている（本店だと入庫されたことの通知が行くため、配慮が必要）
移動時スマレジ連携について
・在庫変動時、連携対象の条件を満たしている場合に限り、スマレジへ商品情報を連携する
・スマレジに情報がない場合にEC-CUBEから商品マスターの連携を行うとする
承認プロセスについて
```

</details>
