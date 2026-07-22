# M04-13（在庫分割結合登録/編集）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫分割結合登録/編集 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockSplitController` / `StockJoinController` / `StockSplitRegisterAction` / `StockJoinRegisterAction` / `StockSplitApplyApprovalAction` / `StockJoinMoveToShortageEntryAction` / `StockJoinApplyApprovalAction` / `StockSplitApprovalApproveAction` / `StockSplitApprovalRejectAction` / `StockJoinApprovalApproveAction` / `StockSplitNewType` / `StockJoinNewType` / `StockSplitJoinType` / Entity `DtbStockSplitJoin` / `DtbStockSplitJoinDetail` / `DtbStockSplitJoinStatusHistory` / `MtbStockSplitJoinStatus`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫分割結合登録/編集

### 機能の目的と役割

在庫検索一覧（M04-01）で選択した1件の商品在庫（`ProductStock`）を起点に、在庫を「分割」または「結合」する管理画面機能。

- **分割**: 1件の分割元在庫を減算し、複数の分割先在庫へ振り分ける（分割元1 → 分割先複数）。
- **結合**: 複数の結合元在庫を減算し、1件の結合先在庫へまとめる（結合元複数 → 結合先1）。結合元には欠品（不足点数）を登録できる。

分割・結合はいずれも `dtb_stock_split_join`（種別 `split_join_type`）で一元管理し、新規登録→（結合は結合元登録／欠品入力）→承認申請→承認待ち→承認（入庫済み）または却下、というステータス遷移を持つ。各操作時に在庫数・総原価を更新し、在庫変動履歴・ステータス履歴・承認リストへ記録する。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。画面・項目の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・DBカラム・在庫増減ロジック・処理順序はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 分割・結合の新規登録、編集（分割先／結合元の追加・数量・削除）、承認申請、承認・却下の入口と更新仕様
- 分割／結合のフォーム項目・バリデーション（CSRFキー、数量チェック、店舗編集権限）
- 在庫増減ロジック（分割元減算／分割先加算／結合元減算／結合先加算／却下時の戻し）と総原価の再計算
- トランザクション境界・悲観ロック、Session を介した一時保持（NEWステータス）とDB確定タイミング
- 在庫変動履歴（`dtb_stock_history`）・分割結合ステータス履歴（`dtb_stock_split_join_status_history`）・承認リスト（`dtb_stock_approval_list`）・欠品履歴（`dtb_stockout_history`）への記録
- 結合元・分割先CSV雛形ダウンロード／取込（明細置換）、欠品CSV出力／取込

### 本書で扱わないこと

- 在庫検索一覧（M04-01）からの遷移ボタンと遷移可否のアラート判定（M04-01側を正とする）
- 在庫承認一覧（M04-12 系）・在庫変動履歴一覧（M04-05 系）など、本機能が出力するレコードを参照する画面の仕様
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）
- 在庫分割結合一覧（`admin_stock_split_join_list`、`StockSplitJoinController`）の検索・表示仕様

### 利用者視点の入口（エンドポイント）

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。`{productStockId}` は分割元／結合先となる `ProductStock` のID、`{id}` は `dtb_stock_split_join` のID。すべて管理画面ログインを要する。

#### 在庫分割（`StockSplitController`）

| 入口 | ルート名 / メソッド / path | ふるまい |
|------|----------------------------|----------|
| 分割 新規登録画面 | `admin_stock_split_new` / GET / `/product/stock/{productStockId}/split/new` | 分割元在庫の情報と分割数入力フォーム（`StockSplitNewType`）を表示。 |
| 分割 登録処理 | `admin_stock_split_register` / POST / `/product/stock/{productStockId}/split/register` | 分割数で分割元在庫を減算し `DtbStockSplitJoin`（種別=分割, ステータス=新規登録）を作成。成功時は編集画面へ。 |
| 分割 編集画面／保存 | `admin_stock_split_edit` / GET,POST / `/product/stock/split/{id}/edit` | 分割先の追加・数量・メモを編集。POSTはメモをDB保存、分割先数量はSession保持。結合タイプは結合編集へリダイレクト。 |
| 分割先 追加 | `admin_stock_split_add_destination` / POST / `/product/stock/{productStockId}/split/destination/add` | 分割先 `ProductStock` をSessionへ追加（数量0で初期化）。 |
| 分割先 数量更新（Ajax） | `admin_stock_split_update_destination_quantity` / POST / `/product/stock/split/{id}/destination/{destinationId}/update-quantity` | NEWステータス時、分割先1行の数量をSession更新。 |
| 分割先 在庫区分更新（Ajax） | `admin_stock_split_update_destination_stock_location` / POST | 分割先の在庫区分（EC-CUBE/スマレジ）をDB更新。 |
| 分割先 削除 | `admin_stock_split_delete_destination` / POST / `/product/stock/split/{id}/destination/{destinationId}/delete` | NEWステータス時、分割先をSessionから削除（在庫操作なし）。 |
| 分割 承認申請 | `admin_stock_split_apply_approval` / POST / `/product/stock/{productStockId}/split/apply-approval` | Sessionの分割先を `DtbStockSplitJoinDetail` としてDB登録し、ステータスを「分割承認待ち」へ。承認リスト作成・通知メール送信。 |
| 分割 承認画面／承認・却下 | `admin_stock_split_approval` / GET,POST / `/product/stock/split/{id}/approval` | POSTで `approval_mode=approve|reject` を受け、承認（分割先加算）または却下（分割元戻し）を実行。 |
| 登録メモ保存 | `admin_stock_split_update_registration_memo` / POST / `/product/stock/split/{id}/registration-memo` | 全ステータスでメモのみ保存。 |
| 分割先CSV雛形 | `admin_stock_split_new_destination_csv_template` / GET | 「商品コード, 分割先在庫数」2列のテンプレートCSV。 |
| 分割先CSV置換取込（Ajax） | `admin_stock_split_edit_destination_csv_upload` / POST / `/product/stock/split/{id}/edit-destination-csv-upload` | NEWステータス時、分割先をCSVで全置換（Sessionへ）。 |
| 分割先数量更新（旧/停止） | `admin_stock_split_update_destination_stock` / POST | 廃止。常に400を返す（`@deprecated`）。 |

#### 在庫結合（`StockJoinController`）

| 入口 | ルート名 / メソッド / path | ふるまい |
|------|----------------------------|----------|
| 結合 新規登録画面 | `admin_stock_join_new` / GET / `/product/stock/{productStockId}/join/new` | 結合先在庫の情報と結合点数入力フォーム（`StockJoinNewType`）を表示。Sessionの結合元候補も復元。 |
| 結合 登録処理 | `admin_stock_join_register` / POST / `/product/stock/{productStockId}/join/register` | 結合点数（`destination_stock`）で `DtbStockSplitJoin`（種別=結合, ステータス=新規登録）を作成。この時点では在庫操作なし。成功時は編集画面へ。 |
| 結合 編集画面／保存 | `admin_stock_join_edit` / GET,POST / `/product/stock/join/{id}/edit` | 結合元の追加・数量・メモを編集。POSTはメモをDB保存、結合元数量はSession保持。 |
| 結合元 追加 | `admin_stock_join_add_source` / POST / `/product/stock/{productStockId}/join/add-source` | 結合元 `ProductStock` と数量をSessionへ追加。 |
| 結合元 数量更新（Ajax） | `admin_stock_join_update_source_quantity` / POST / `/product/stock/join/{id}/source/{sourceId}/update-quantity` | NEWステータス時、結合元1行の数量をSession更新。 |
| 結合元 在庫区分更新（Ajax） | `admin_stock_join_update_source_stock_location` / POST | NEWはSession付け替え、それ以外はDB更新。 |
| 結合元 削除 | `admin_stock_join_delete_source` / POST / `/product/stock/{productStockId}/join/delete-source/{sourceId}` | NEWステータス時、結合元をSessionから削除。 |
| 欠品入力へ遷移 | `admin_stock_join_move_to_shortage_entry` / POST / `/product/stock/{productStockId}/join/move-to-shortage-entry` | Sessionの結合元を `DtbStockSplitJoinDetail` としてDB登録し結合元在庫を減算、ステータスを「結合元登録」へ。 |
| 欠品入力画面／保存 | `admin_stock_join_shortage_entry` / GET,POST / `/product/stock/join/{id}/shortage-entry` | 「結合元登録」ステータス専用。各結合元の欠品点数を入力。 |
| 欠品数量更新（Ajax） | `admin_stock_join_update_shortage` / POST | 欠品点数をSession保持（DB確定は承認申請時）。 |
| 結合 承認申請 | `admin_stock_join_apply_approval` / POST / `/product/stock/{productStockId}/join/apply-approval` | 欠品を確定（欠品調整在庫処理）し、ステータスを「結合承認待ち」へ。承認リスト作成。 |
| 結合 承認画面／承認・却下 | `admin_stock_join_approval` / GET,POST / `/product/stock/join/{id}/approval` | POSTで承認（結合先加算＋仕入価格）または却下を実行。 |
| 登録メモ保存 | `admin_stock_join_update_registration_memo` / POST / `/product/stock/join/{id}/registration-memo` | 全ステータスでメモのみ保存。 |
| 結合元CSV雛形 | `admin_stock_join_new_source_csv_template` / GET | 「商品コード, 結合元数量」2列のテンプレートCSV。 |
| 結合元CSV取込（新規・Ajax） | `admin_stock_join_new_source_csv_upload` / POST / `/product/stock/{productStockId}/join/new-source-csv-upload` | 新規画面用。DB保存せず行データをJSONで返す。 |
| 結合元CSV置換取込（編集・Ajax） | `admin_stock_join_edit_source_csv_upload` / POST / `/product/stock/join/{id}/edit-source-csv-upload` | 編集画面用。結合元明細を全置換（Sessionへ）。 |
| 欠品CSV出力 | `admin_stock_join_shortage_csv_export` / GET / `/product/stock/join/{id}/shortage-csv-export` | 「結合元登録」ステータス時に欠品入力用CSVを出力。 |
| 欠品CSV取込（Ajax） | `admin_stock_join_shortage_csv_import` / POST / `/product/stock/join/{id}/shortage-csv-import` | 「結合元登録」ステータス時に欠品点数をSessionへ取込。 |

### ステータス区分（`MtbStockSplitJoinStatus`）

| ID | 定数 | 名称 | 主な用途 |
|----|------|------|----------|
| 1 | `NEW` | 新規登録 | 分割登録直後／結合登録直後。分割先・結合元はSessionで一時保持。 |
| 2 | `JOIN_SOURCE_REGISTERED` | 結合元登録 | 結合のみ。結合元明細をDB確定し在庫減算済み。欠品入力可。 |
| 3 | `SPLIT_APPROVAL_WAITING` | 分割承認待ち | 分割の承認申請後。 |
| 4 | `JOIN_APPROVAL_WAITING` | 結合承認待ち | 結合の承認申請後。 |
| 5 | `RECEIPT_COMPLETED` | 入庫済み | 承認完了（分割先／結合先へ加算済み）。 |
| 6 | `REJECTED` | 却下 | 承認却下（分割は分割元へ戻し済み）。 |

### フォーム項目・バリデーション

#### 分割 新規登録（`StockSplitNewType` / `admin_stock_split_register`）

| 項目 | フォームキー／パラメータ | 必須 | 検証 |
|------|--------------------------|------|------|
| 分割メモ | `admin_stock_split_new[split_join_memo]`（TextareaType） | 任意 | — |
| 分割数 | `split_quantity` | 必須 | 1以上（`admin.stock.split.quantity_min`）かつ分割元在庫数以下（`admin.stock.split.quantity_exceeds_stock`）。 |
| CSRF | `_token`（トークンID `stock_split_register`） | 必須 | 不正時 `admin.common.save_error`。 |
| 店舗編集権限 | （ログインメンバー） | — | `Member::isEditableShop(BaseInfo)` が false なら `admin.stock.split.not_editable_store`。 |

#### 結合 新規登録（`StockJoinNewType` / `admin_stock_join_register`）

| 項目 | フォームキー／パラメータ | 必須 | 検証 |
|------|--------------------------|------|------|
| 結合メモ | `split_join_memo`（TextareaType。`StockJoinNewType` submit経由でも検証） | 任意 | — |
| 結合点数 | `destination_stock` | 必須 | 0超（`admin.stock.join.destination_stock_min`）。整数化（`filter_var`）。 |
| CSRF | `_token`（トークンID `stock_join_register`） | 必須 | 不正時 `admin.common.csrf_invalid`。 |
| 店舗編集権限 | （ログインメンバー） | — | false なら `admin.stock.join.not_editable_store`。 |

#### 編集・承認共通（`StockSplitJoinType`）

分割編集・結合編集・欠品入力・承認申請で共通利用。項目は分割結合メモ `split_join_memo`（TextareaType）と承認通知先メンバー `approval_notification_target_members`（ChoiceType, 複数選択）。通知先候補は `MemberRepository::getApprovalAuthorityMembers(BaseInfo)`（当該店舗の承認権限保有メンバー）。承認申請成功時、選択された通知先のうち承認権限を持つメンバーへ承認依頼メール（`MailService::sendStockApprovalAlertMail`）を送信する。

#### 承認・却下（`StockSplitApprovalSubmitAction` ほか）

| 項目 | パラメータ | 検証 |
|------|-----------|------|
| 承認モード | `approval_mode` | `approve` / `reject` 以外は `admin.common.save_error`。 |
| 却下メモ | `rejected_memo` | 却下時は必須（全角/NBSP正規化後に空なら `admin.stock.move.rejection_reason_required`）。 |
| 仕入価格（結合承認） | `purchase_price` | 数字以外を除去。結合先の総原価加算に使用。 |
| CSRF | `_token`（トークンID `authenticate`） | 不正時 `admin.common.csrf_invalid`。 |
| ステータス | — | 分割は `SPLIT_APPROVAL_WAITING`、結合は `JOIN_APPROVAL_WAITING` 以外なら不整合エラー。 |

### 在庫増減ロジック・プロセスフロー

在庫数・総原価・原価単価の更新は `ProductStockEntityManager::save()`（`dtb_product_stock` と `dtb_product_class.stock` を更新）を経由し、在庫変動履歴は `StockHistoryEntityManager::save()`（`dtb_stock_history`）で記録する。総原価の出庫計算は `ProductStock::getMovementTotalCost()`、原価単価は「総原価 ÷ 在庫数」で再計算する。

#### 1. 分割 登録（`StockSplitRegisterAction`）

基本設計4-4の処理順（在庫減算→在庫変動履歴→ステータス履歴→在庫分割情報）に対応。実装は単一トランザクション（`wrapInTransaction`）で分割元 `ProductStock` を `PESSIMISTIC_WRITE` ロック・`refresh` 後に以下を実行する。

1. 在庫不足チェック: 分割数 > 現在庫なら中断し `admin.stock.split.quantity_exceeds_stock`（在庫操作なし＝ロールバック）。
2. **①在庫減算**: 新在庫 = `max(0, 現在庫 - 分割数)`、新総原価 = 現総原価 - 出庫総原価、原価単価を再計算して `ProductStock` を更新。
3. **④在庫分割情報登録**: `DtbStockSplitJoin`（種別=分割, ステータス=新規登録）を作成。減算前の在庫数・総原価・原価単価・基準価格をスナップショットとして保持し、`outbound_total_cost` に出庫総原価を記録。在庫変動履歴が `history_source_id` としてIDを参照するため先に flush。
4. **②在庫変動履歴登録**: `SPLIT_OUTBOUND` 種別、履歴ソース `STOCK_SPLIT_EDIT`、変動数 `-分割数`、減算前後の在庫・原価を記録。
5. **③ステータス履歴登録**: `dtb_stock_split_join_status_history` に新規登録ステータスを記録。

成功時 `admin.stock.split.register_complete` を表示し編集画面へ。分割先はこの時点では未登録（編集画面でSession追加）。

#### 2. 分割 編集～承認申請（`StockSplitApplyApprovalAction`）

編集画面で分割先（`ProductStock`）と各数量をSession（キー `stock_split_edit_destinations_{id}`）に保持。承認申請で以下を実行する。

1. Sessionの分割先から `DtbStockSplitJoinDetail` を作成（`cost_price`=分割先原価単価, `total_cost`=原価単価×数量, `stock`=分割先在庫スナップショット）し flush。
2. コミット規則検証: 分割数1以上、分割先1件以上（`admin.stock.split.destination_required`）、分割先合計1以上（`admin.stock.split.destination_total_zero`）。
3. ステータスを「分割承認待ち」へ変更、`move_to_approval_at`／`move_to_approval_member` を記録、ステータス履歴を追加。
4. 承認リスト `DtbStockApprovalList`（未承認）を1行作成（対象在庫数=分割先件数+1、変動数=分割先合計、移動総原価=分割元原価単価×分割数）。

却下済み（`REJECTED`）からの承認申請は `admin.stock.split.apply_approval_invalid_status`。

#### 3. 分割 承認（`StockSplitApprovalApproveAction`）／却下（`StockSplitApprovalRejectAction`）

- **承認**: ステータス `SPLIT_APPROVAL_WAITING` を `PESSIMISTIC_WRITE` ロック・`refresh`。各分割先 `ProductStock` をロックし、移動総原価（分割元総原価 × 分割数 / 分割元在庫）を、分割先の買取金額×個数の比で按分して加算。分割先在庫を `+数量`、総原価加算、原価単価再計算し `SPLIT_INBOUND` 履歴を記録。ステータスを「入庫済み」、承認リストを承認済みに更新。既に入庫済みなら冪等成功、その他ステータスは `admin.stock.split.approval_status_error`。
- **却下**: ステータス `SPLIT_APPROVAL_WAITING` 前提。分割元 `ProductStock` をロックし、分割登録時に減算した在庫（`+分割数`）と原価（原価単価×分割数）を戻し、`SPLIT_REJECT` 履歴を記録。ステータスを「却下」、却下メモを保存、承認リストを却下に更新。

#### 4. 結合 登録（`StockJoinRegisterAction`）

結合点数（`destination_stock`>0）で `DtbStockSplitJoin`（種別=結合, ステータス=新規登録）を作成。`stock`／`split_join_quantity` に結合点数、原価単価・総原価は結合先 `ProductStock` の現在値を記録。ステータス履歴を追加。**この時点では在庫操作を行わない**（結合先への加算は承認時）。成功時 `admin.stock.join.register_complete`。

#### 5. 結合 編集～欠品入力遷移（`StockJoinMoveToShortageEntryAction`）

編集画面で結合元と数量をSession（キー `stock_join_edit_sources_{id}`）に保持。欠品入力へ遷移する操作で、NEWステータスなら単一トランザクションで以下を実行する。

1. 検証: 結合元1件以上（`admin.stock.join.require_at_least_one_source`）、計画結合数1以上（`admin.stock.join.apply_approval_zero_quantity`）。
2. 各結合元 `ProductStock` をロック・`refresh`。数量は `min(入力数量, 在庫数)` に丸め、0以下はスキップ。
3. `DtbStockSplitJoinDetail` を作成（基準価格・原価単価・総原価・在庫スナップショット・結合数量）。
4. 結合元在庫を `-数量`、総原価減算、原価単価再計算し `JOIN_OUTBOUND` 履歴を記録。
5. ヘッダ（`DtbStockSplitJoin`）の派生原価を `StockJoinDetailDerivedHeaderCostApplier` で再計算。
6. ステータスを「結合元登録」へ変更しステータス履歴を追加。

既に「結合元登録」ステータスの場合はDB明細を検証のみして遷移する。NEW/結合元登録以外は `admin.stock.join.move_to_shortage_only_from_registered`。

#### 6. 結合 欠品入力～承認申請（`StockJoinShortageEntryAction` / `StockJoinApplyApprovalAction`）

- 欠品入力画面は「結合元登録」ステータス専用（不一致は `admin.stock.join.shortage_entry_invalid_status`）。結合数0の明細は表示対象外。欠品点数はSession（キー `eccube.admin.stock.join.shortage.{id}`）に保持。
- 承認申請: 「結合元登録」前提。各結合元の欠品点数を確定し、有効結合数（結合量-欠品量）の合計が1未満なら `admin.stock.join.apply_approval_zero_quantity`。欠品>0の明細は「案B方式」で在庫調整する。
  - **欠品加算[`JOIN_SHORTAGE_ADD`]**: `JOIN_OUTBOUND` で出庫した全量を結合元へ戻す。
  - **欠品減算[`JOIN_SHORTAGE_SUBTRACT`]**: 有効数量（結合量-欠品量）のみを再減算する。
  - 欠品分は `DtbStockoutHistory`（欠品履歴）を作成し、`DtbStockSplitJoinDetail.missing_quantity`／`missing_member_id` を更新。
  - ステータスを「結合承認待ち」へ、承認リスト `DtbStockApprovalList`（未承認, 種別 `JOIN_INBOUND`）を作成。

#### 7. 結合 承認（`StockJoinApprovalApproveAction`）

ステータス `JOIN_APPROVAL_WAITING` を `PESSIMISTIC_WRITE` ロック・`refresh`。結合先 `ProductStock`（`DtbStockSplitJoin.product_stock_id`）をロックし、在庫を `+結合数量`、総原価に仕入価格（`purchase_price`）を加算、原価単価を再計算し `JOIN_INBOUND` 履歴を記録。ステータスを「入庫済み」へ。結合数量が0以下なら例外（`admin.stock.join.approval_no_inbound_quantity`）。却下は分割と同様に承認画面POSTから処理する。

### トランザクション・同時実行制御

- 在庫を増減する各 Action（分割登録／分割承認・却下／結合欠品入力遷移／結合承認申請／結合承認）は、対象 `ProductStock` および `DtbStockSplitJoin` を `LockMode::PESSIMISTIC_WRITE` でロックし `refresh()` で最新化したうえで単一トランザクション内で在庫・履歴・ステータスを更新する。例外時は `rollback()`。
- NEWステータス中の分割先・結合元・欠品の入力値は **DBではなくSession** に保持し、承認申請・欠品入力遷移のタイミングで一括してDB確定する。登録メモのみ各ステータスでDB即時保存可能。
- 結合承認申請で同一結合元 `ProductStock` を複数明細が参照する場合に備え、明細ごとに `flush()` してDB値を確定する。

### 分岐・遷移・例外（実メッセージキー）

| 状況 | 実装の扱い |
|------|-----------|
| CSRFトークン不正 | 分割登録 `admin.common.save_error`、結合登録・承認系 `admin.common.csrf_invalid`。元画面へリダイレクト。 |
| 店舗編集権限なし | 分割 `admin.stock.split.not_editable_store`／結合 `admin.stock.join.not_editable_store`。 |
| 分割数 < 1 | `admin.stock.split.quantity_min`。 |
| 分割数 > 在庫 | `admin.stock.split.quantity_exceeds_stock`（トランザクション中断）。 |
| 結合点数 ≤ 0 | `admin.stock.join.destination_stock_min`。 |
| 分割先未登録／合計0 | `admin.stock.split.destination_required` / `admin.stock.split.destination_total_zero`。 |
| 分割先・結合元の重複追加 | `admin.stock.split_join.destination_already_exists`。 |
| 対象 `DtbStockSplitJoin` が見つからない／種別不一致 | `admin.stock.split_join.not_found` / `admin.stock.join.source_not_found`。 |
| 種別取り違え（分割IDで結合画面など） | 対応する編集画面（`admin_stock_split_edit` / `admin_stock_join_edit`）へリダイレクト。 |
| 編集対象が承認待ちステータス | 編集POSTは保存せず承認画面（`admin_stock_split_approval` / `admin_stock_join_approval`）へリダイレクト。 |
| 承認モード不正 | `admin.common.save_error`。 |
| 却下メモ未入力 | `admin.stock.move.rejection_reason_required`。 |
| 承認ステータス不整合 | 分割 `admin.stock.split.approval_status_error` / `admin.stock.split.approval_invalid_status`、結合 `admin.stock.join.apply_approval_invalid_status` / `admin.stock.join.shortage_entry_invalid_status`。 |
| メモ専用エンドポイントを別種別で呼出 | `createNotFoundException()`（404）。 |
| マスタ未整備（ステータス／変動種別／履歴ソース欠落） | `\LogicException`（`admin.stock.join.status_not_found` 等）。 |
| CSV取込時のCSRF/ファイル不正・ステータス不可 | JSONで `ok=false` とエラーメッセージ（例 `admin.stock.split_join.already_applied`、`admin.stock.join.receipt_completed_locked`）。 |

成功時の主なメッセージキー: `admin.stock.split.register_complete`、`admin.stock.split.apply_approval_success`、`admin.stock.split.approval_approve_complete`、`admin.stock.move.reject_complete`、`admin.stock.join.register_complete`、`admin.stock.join.moved_to_shortage_entry`、`admin.stock.join.apply_approval_success`、`admin.stock.join.approval_approve_complete`、共通 `admin.common.save_complete` / `admin.common.delete_complete`。

### 表示メッセージ（メッセージ一覧・在庫分割 `StockSplitController`）

`StockSplitController`（分割系）のフラッシュメッセージをメッセージIDで一覧化する。文言は `messages.ja.yaml` 由来のロケール解決値、可変（例外・フォーム検証由来）行はその旨を明記。結合系 `StockJoinController` は別途採番。

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 | 種別 |
|--------------|----------|--------------|----------|------|
| M04-13-MSG-001 | 管理画面上部フラッシュ | 保存に失敗しました | 新規登録画面の保存ボタン／CSRFトークン不正 | エラー |
| M04-13-MSG-002 | 管理画面上部フラッシュ | この店舗の在庫を編集する権限がありません。 | 新規登録画面の保存ボタン／ログインメンバーが対象店舗を編集不可 | エラー |
| M04-13-MSG-003 | 管理画面上部フラッシュ | 分割数は1以上を入力してください。 | 新規登録画面の保存ボタン／split_quantityが1未満 | エラー |
| M04-13-MSG-004 | 管理画面上部フラッシュ | 要ソース確認 | 新規登録画面の保存ボタン／StockSplitRegisterActionのLogicException（StockSplitController.php:179-184 は `$e->getMessage()` を表示。固定の表示文言に確定不可） | エラー |
| M04-13-MSG-005 | 管理画面上部フラッシュ | 要ソース確認 | 新規登録画面の保存ボタン／登録ActionがerrorMessageを返却。分岐により単一キー由来（候補: `分割数は1以上を入力してください。` messages.ja.yaml:4992 ／ `分割数が在庫数を超えています。` messages.ja.yaml:4994）。単一の逐語連結文言は実在しない | エラー |
| M04-13-MSG-006 | 管理画面上部フラッシュ | 在庫分割を登録しました。 | 新規登録画面の保存ボタン／在庫分割登録成功 | インフォ(成功) |
| M04-13-MSG-007 | 管理画面上部フラッシュ | 要ソース確認 | 編集画面フォーム送信／フォームが不正（StockSplitController.php:222-227 は `$error->getMessage()` を表示。StockSplitJoinType.php:74-76 の制約由来で固定の単一文言に確定不可） | エラー |
| M04-13-MSG-008 | 管理画面上部フラッシュ | 保存しました | 編集画面フォーム送信／フォーム送信が有効、かつ承認待ちではない | インフォ(成功) |
| M04-13-MSG-009 | 管理画面上部フラッシュ | 保存に失敗しました | 承認申請ボタン／CSRFトークン不正 | エラー |
| M04-13-MSG-010 | 管理画面上部フラッシュ | この店舗の在庫を編集する権限がありません。 | 承認申請ボタン／ログインメンバーが対象店舗を編集不可 | エラー |
| M04-13-MSG-011 | 管理画面上部フラッシュ | 承認通知先のメンバーを1人以上選択してください。 | 承認申請ボタン／approval_notification_target_membersが空 | エラー |
| M04-13-MSG-012 | 管理画面上部フラッシュ | 要ソース確認 | 承認申請ボタン／承認申請ActionがerrorMessageを返却。分岐により単一キー由来（候補: messages.ja.yaml:4992 `分割数は1以上を入力してください。`／4996／4997／5014 `却下済みのため、再申請はできません。新規分割から操作してください。`。`admin.stock.split_join.not_found` はlocale未定義）。単一の逐語連結文言は実在しない | エラー |
| M04-13-MSG-013 | 管理画面上部フラッシュ | 承認申請しました。 | 承認申請ボタン／承認申請成功 | インフォ(成功) |
| M04-13-MSG-014 | 管理画面上部フラッシュ | セッションがタイムアウトしました。もう一度やり直してください。 | 承認画面の承認／却下ボタン／CSRFトークン不正 | エラー |
| M04-13-MSG-015 | 管理画面上部フラッシュ | 承認権限がありません。 | 承認画面の承認／却下ボタン／canApprove判定がfalse | エラー |
| M04-13-MSG-016 | 管理画面上部フラッシュ | 保存に失敗しました | 分割先追加操作／CSRFトークン不正 | エラー |
| M04-13-MSG-017 | 管理画面上部フラッシュ | 要ソース確認 | 分割先追加操作／対象分割データがない・対象外ステータス（StockSplitController.php:407-411 が `admin.stock.split_join.not_found` を指定するが messages.ja.yaml に当該キー未定義） | エラー |
| M04-13-MSG-018 | 管理画面上部フラッシュ | 要ソース確認 | 分割先追加操作／destination_product_stock_idが0以下（StockSplitController.php:413-417 が `admin.stock.split_join.not_found` を指定するが messages.ja.yaml に当該キー未定義） | エラー |
| M04-13-MSG-019 | 管理画面上部フラッシュ | 要ソース確認 | 分割先追加操作／分割元と同じ在庫を分割先に指定（StockSplitController.php:420-424 が `admin.stock.split_join.destination_already_exists` を指定するが messages.ja.yaml に当該キー未定義） | エラー |
| M04-13-MSG-020 | 管理画面上部フラッシュ | 要ソース確認 | 分割先追加操作／同じ分割先在庫が既にSessionに存在（StockSplitController.php:427-435 が `admin.stock.split_join.destination_already_exists` を指定するが messages.ja.yaml に当該キー未定義） | エラー |
| M04-13-MSG-021 | 管理画面上部フラッシュ | セッションがタイムアウトしました。もう一度やり直してください。 | 分割先削除ボタン／CSRFトークン不正 | エラー |
| M04-13-MSG-022 | 管理画面上部フラッシュ | 保存に失敗しました | 分割先削除ボタン／分割ステータスがNEW以外 | エラー |
| M04-13-MSG-023 | 管理画面上部フラッシュ | 削除しました | 分割先削除ボタン／CSRFが有効かつ分割ステータスがNEW | インフォ(成功) |
| M04-13-MSG-024 | 管理画面上部フラッシュ | セッションがタイムアウトしました。もう一度やり直してください。 | 登録メモ保存フォーム／CSRFトークン不正 | エラー |
| M04-13-MSG-025 | 管理画面上部フラッシュ | 保存に失敗しました | 登録メモ保存フォーム／StockSplitUpdateMemoActionがLogicException | エラー |
| M04-13-MSG-026 | 管理画面上部フラッシュ | 保存しました | 登録メモ保存フォーム／登録メモ保存成功 | インフォ(成功) |
| M04-13-MSG-027 | 管理画面上部フラッシュ | 要ソース確認 | 承認画面の承認／却下ボタン／承認処理結果にerrorMessageが存在。分岐により単一キー由来（候補: messages.ja.yaml:1592 `保存に失敗しました`／4692 `却下する場合は却下理由を入力してください。`／4989 `分割の承認待ちではないか、または既に処理済みです。`。`admin.stock.split.approval_invalid_status`・`admin.stock.split_join.status_not_found` はlocale未定義、例外由来値も含む）。単一の逐語連結文言は実在しない | エラー |
| M04-13-MSG-028 | 管理画面上部フラッシュ | 要ソース確認 | 承認画面の承認／却下ボタン／承認処理結果にsuccessMessageが存在。分岐により単一キー由来（候補: messages.ja.yaml:4693 `却下しました。`／4990 `分割の承認が完了しました。`）。単一の逐語連結文言は実在しない | インフォ(成功) |

### 状態・データ更新（更新系）

本機能は**更新系**であり、以下の実Entity／テーブルを更新する。

| 対象テーブル | Entity | 用途・主な列 |
|--------------|--------|--------------|
| `dtb_stock_split_join` | `DtbStockSplitJoin` | 分割・結合の基本情報。`split_join_type`（1=分割/2=結合）、`stock_split_join_status_id`、`product_stock_id`（分割元/結合先）、`standard_price`、`unit_cost_price`、`total_cost`、`stock`、`split_join_quantity`、`split_join_memo`、`outbound_total_cost`、`move_to_approval_member_id`/`move_to_approval_at`、`rejected_memo`、登録者/更新者/登録日/更新日。 |
| `dtb_stock_split_join_detail` | `DtbStockSplitJoinDetail` | 分割先／結合元の明細。`subject_product_stock_id`、`standard_price`、`cost_price`、`total_cost`、`stock`、`split_join_quantity`、**欠品点数 `missing_quantity`**、**欠品登録者 `missing_member_id`**。 |
| `dtb_stock_split_join_status_history` | `DtbStockSplitJoinStatusHistory` | ステータス遷移履歴。`stock_split_join_id`、`stock_split_join_status_id`、`update_member_id`、`update_date`。 |
| `dtb_product_stock` / `dtb_product_class` | `ProductStock` / `ProductClass` | 在庫数 `stock`・総原価 `total_cost` を `ProductStockEntityManager::save()` で更新。 |
| `dtb_stock_history` | `DtbStockHistory` | 在庫変動履歴。変動種別 `SPLIT_OUTBOUND` / `SPLIT_INBOUND` / `SPLIT_REJECT` / `JOIN_OUTBOUND` / `JOIN_INBOUND` / `JOIN_SHORTAGE_ADD` / `JOIN_SHORTAGE_SUBTRACT`、履歴ソース `STOCK_SPLIT_EDIT` / `STOCK_JOIN_EDIT`、`history_source_id`=`DtbStockSplitJoin.id`。 |
| `dtb_stock_approval_list` | `DtbStockApprovalList` | 承認申請時に未承認で作成、承認・却下時に状態更新。 |
| `dtb_stockout_history` | `DtbStockoutHistory` | 結合の欠品確定時に欠品点数を記録。 |

### 結合テスト観点（既存テストの出典）

既存の `tests/Eccube/Tests/Web/Admin/Stock/StockSplitControllerTest.php` / `StockJoinControllerTest.php` がエンドポイントごとの挙動を網羅する。

- 分割: 新規GET（既存分割あり/なし）、登録のCSRF不正・成功・在庫不足エラー・権限なし、編集GET（分割/結合種別）・POST成功・承認待ち時リダイレクト・不正フォーム、承認申請のCSRF不正・成功・joinId有無別エラー、承認画面の承認成功・却下（メモ空/成功/例外）・不明モード、分割先の追加（CSRF/不正ID/未存在/ステータス不正/重複/成功）・削除・CSV雛形・CSV取込。
- 結合: 新規200、登録成功・CSRF不正・LogicException・権限なし、編集GET/POST・承認待ち時リダイレクト、結合元の追加/削除、欠品入力遷移（成功/検証例外）、登録メモ保存（成功/承認へ戻り/例外）、欠品入力GET・ステータス不正、欠品数量更新、承認申請の対象なし、結合元CSV雛形・取込（新規/編集）、結合元数量更新（Ajax/非Ajax/ステータス別）、在庫区分更新（非Ajax/LogicException/Throwable）。

### 関連設計への接続点

- 在庫検索一覧（M04-01）の「在庫分割登録」「在庫結合登録」ボタンが本機能の新規登録画面（`admin_stock_split_new` / `admin_stock_join_new`）への入口。遷移可否のアラート（複数店舗選択時など）はM04-01側の要件。
- 承認申請で作成する `DtbStockApprovalList` は在庫承認関連画面（`StockApprovalController` / `StockApprovalListController`）の対象。
- 在庫変動履歴（`dtb_stock_history`）は在庫変動履歴一覧（M04-05系）から参照される。
- 画面項目・CSV列・帳票レイアウトの詳細は参照元Excel設計書の該当シートを正とする。

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に在庫分割結合の相当機能は無い。移行先 ec-cube-enterprise の実装を確認値とし、移行先スキーマを記録する。

| 観点 | 移行先（ec-cube-enterprise）の扱い |
|------|------------------------------------|
| 在庫分割結合の基本情報 | `dtb_stock_split_join` に保持（`split_join_type` で分割/結合を区別、登録日 `create_date` 等）。 |
| 分割先・結合元などの明細 | `dtb_stock_split_join_detail` に保持。欠品点数は `missing_quantity`、欠品登録者は `missing_member_id`。 |
| ステータス履歴 | `dtb_stock_split_join_status_history` に記録する。 |
| ステータス区分 | マスタ `mtb_stock_split_join_status`（新規登録1/結合元登録2/分割承認待ち3/結合承認待ち4/入庫済み5/却下6）。 |
| 欠品の列名 | 基本設計の「欠品」は移行先で `missing_quantity` / `missing_member_id` として実装する（旧称 `shortage_quantity` / `source_stock` 等は Entity の互換メソッドで読み替え）。 |
| 在庫・原価の更新先 | `dtb_product_stock.stock` / `total_cost` と `dtb_product_class.stock`、在庫変動履歴 `dtb_stock_history`。 |

上記以外で基本設計に記載があり ec-cube-enterprise 実装で確認しきれない列は、推測でスキーマ化せず「ec-cube-enterprise 実装で要確認」とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫分割結合登録編集（分割）
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
佐藤
作成日
2025-08-25
更新者
石川
更新日
2026-02-06
機能No
M04-13
機能名
在庫分割結合登録編集
概要
在庫分割結合の詳細、編集画面
処理概要
図形・テキストボックス内テキスト（70件）
レイアウト図 新規登録
1-1
1-2
1-3
1-4
1-5
1-6
1-7
1-8
1-9
1-10
2-1
2-2
2-3
2-4
2-5
2-6
2-7
2-8
2-9
2-10
4-1
4-2
3-1
1-11
在庫分割結合登録編集（分割） / B7 / image 6
機能仕様処理概要
1. 初期登録画面概要
・在庫検索一覧画面から任意の商品在庫を1つ選択し、在庫検索一覧画面の「在庫分割登録」ボタンを押下すると、選択商品在庫を分割対象とし、この画面（在庫分割登録の初期画面）へ遷移する
・選択した商品に対して、分割点数を入力し登録を行う
・登録後、ステータスは新規登録となり、分割対象の商品の在庫が分割点数分減る
2. 在庫分割登録ステータス遷移
入庫完了
在庫一覧から分割登録を押下し遷移
新規登録
分割対象の商品在庫を減らす
分割先商品
登録
承認申請
分割承認待ち
承認
却下
入庫済み
却下
分割先の商品在庫を増やす
分割元の商品在庫を戻す
画面遷移図をExcel図形座標で再構成（画面 8件 / 遷移 7件 / 元コネクタ 7件）
遷移一覧（7件）
遷移元遷移先
在庫一覧から分割登録を押下し遷移新規登録
新規登録分割先商品
登録
承認申請
分割先商品
登録
承認申請分割承認待ち
分割承認待ち承認
承認入庫済み
分割承認待ち却下
却下却下
接続関係整理図
分割先商品
登録
承認申請
在庫一覧から分割登録を押下し遷移
承認
新規登録
分割承認待ち
入庫済み
却下
3. 表示内容
3-1.在庫一覧にて選択した商品情報・在庫情報を表示 ※画面部品一覧にて詳細記載
4.分割元商品登録処理
4-1.登録時に入力値チェックを行う
4-2.入力値チェックについては画面部品一覧表の必須・最大値・画面部品の説明に記載されている条件に従いエラーとする
必須：必須列に”○”がある場合、項目が未入力の場合エラー
最大値：入力値が最大値を超える場合エラー
画面部品の説明にあるチェック条件：チェック条件該当する場合エラー
4-3.入力チェックの結果エラーがなければ在庫分割情報と在庫変動履歴、分割ステータス履歴の登録処理および分割元在庫の減算処理を行う
4-4.処理順は、在庫減算処理→在庫変動履歴登録→分割ステータス履歴登録→在庫分割情報の順で処理を行う
4-5.在庫減算するため下記の処理を行う
4-5-1.在庫数の計算を行い分割数量分減算し登録する
※計算式は、「現在の在庫数-分割数」とする
4-5-2.在庫数を減算した後の在庫の総原価を計算し登録する
※計算式は「別添資料_在庫変動時の履歴作成について」シートの「⑤在庫変更のタイミングで必ず対象在庫の総原価の更新を行う」【出庫時】を参照
4-6.在庫変動履歴を登録する
・登録内容は「別添資料_在庫変動時の履歴作成について」参照
4-7.在庫分割情報として下記を登録する
4-7-1.基本情報として下記を登録する
項目 内容
在庫分割結合ID 自動採番
処理タイプ 在庫分割
ステータス 新規登録
登録日 登録日
更新日 更新日
登録者 登録者
更新者 更新者
在庫分割結合登録編集（結合)
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
佐藤
作成日
2025-08-25
更新者
本田
更新日
2026-01-13
機能No
M04-13
機能名
在庫分割結合登録編集（結合）
概要
—
処理概要 在庫分割結合登録編集（結合）新規登録画面
処理概要 在庫分割結合登録編集（結合）結合承認申請画面
処理概要 在庫分割結合登録編集（結合）結合承認画面
処理概要 在庫分割結合登録編集（結合）完了画面
図形・テキストボックス内テキスト（135件）
レイアウト図 在庫分割結合登録編集（結合）画面
1-1
1-2
1-3
1-4
1-6
1-5
1-7
1-8
1-9
1-10
1-11
2-1
2-2
2-3
2-5
2-6
2-7
2-8
2-9
2-10
3-1
4-1
4-2
4-3
5-1
5-2
2-11
6-1
6-2
8-1
7-17
7-18
2-4
在庫分割結合登録編集（結合) / C7 / image 7
機能仕様処理概要 在庫分割結合登録編集（結合）新規登録画面
結合登録画面概要
・在庫検索一覧画面から任意の商品在庫を1つ選択し、在庫検索一覧画面の「在庫結合登録」ボタンを押下すると、選択商品在庫を結合元商品とし、この画面（在庫結合登録の初期画面）へ遷移する
・選択した商品に対して、結合点数を入力し登録を行う
・登録後、ステータスは新規登録となる
結合登録ステータス遷移
アクション
ステータス
ピック
作業
新規登録
NG
新規登録
欠品登録
結合
承認待ち
結合
承認
却下
入庫済み
結合作業
結合元
登録
結合元
登録
アクション
ステータス
ピック
作業
新規登録
NG
新規登録
欠品登録
結合
承認待ち
結合
承認
却下
入庫済み
結合作業
結合元
登録
結合元
登録
結合元登録画面
アクション
ステータス
ピック
作業
新規登録
NG
新規登録
欠品登録
結合
承認待ち
結合
承認
却下
入庫済み
結合作業
結合元
登録
結合元
登録
```

</details>

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 表示条件 |
|--------------|----------|--------------|----------|
| M04-13-MSG-029 | 画面中央(ダイアログ) | 保存に失敗しました | 結合元の在庫区分をchangeした際のfetch（admin_stock_join_update_source_stock_location）がcatchに入ったとき（通信失敗、または応答JSONの解析失敗。HTTPエラーでもJSONが返る場合はthen側の alert(msg) 分岐=同twig:826-827 でありcatchに入らない） |
| M04-13-MSG-030 | 画面中央(ダイアログ) | ポップアップがブロックされているため、ピック表を開けませんでした。ブラウザの設定を確認してください。 | 欠品入力画面でピック表出力ボタンを押下し、window.open がnullを返した（ポップアップがブロックされた）とき |
| M04-13-MSG-031 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajax（admin_stock_join_pick_list_pdf_export）のdoneで success===true かつ html が得られず、かつ redirectUrl も返らなかったとき |
| M04-13-MSG-032 | 画面中央(ダイアログ) | ピック表用データの取得に失敗しました。 | ピック表PDF出力Ajax（admin_stock_join_pick_list_pdf_export）が fail コールバックに入ったとき（通信失敗のほか、CSRFトークン不正時のHTTP 403 JSON応答 StockJoinController.php:1206-1208 も含む） |
| M04-13-MSG-033 | 画面中央(ダイアログ) | 保存に失敗しました | 数量入力欄を変更（change）して data-update-url（admin_stock_split_update_destination_quantity）へ Ajax POST した際、fetch が通信例外で失敗（.catch）したとき |
| M04-13-MSG-034 | 画面中央(ダイアログ) | 保存に失敗しました | 在庫区分セレクトを変更（change）して data-update-dest-location-url（admin_stock_split_update_destination_stock_location、stock_split_edit.twig:179）へ Ajax POST した際、fetch が通信例外で失敗（.catch）したとき |
