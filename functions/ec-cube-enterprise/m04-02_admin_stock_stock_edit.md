# M04-02（在庫編集機能）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫編集機能 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockApprovalController` / `StockApprovalStoreAction` / `StockApprovalHistoryReasonUpdateAction` / `StockChangeHistoryListBuilder` / `StockApprovalType` / Entity `DtbStockEditApproval`・`DtbStockEditApprovalDetail`・`DtbStockApprovalList`・`DtbStockHistory`・`ProductStock` / EntityManager `StockEditApprovalEntityManager`・`StockEditApprovalDetailEntityManager`・`StockApprovalListEntityManager`・`StockHistoryEntityManager`・`ProductStockEntityManager`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫編集機能

### 機能の目的と役割

商品規格単位かつ店舗（在庫区分）ごとに在庫数を編集する管理画面機能。在庫一覧（M04-01）の商品名リンクから対象在庫（`ProductStock`）を指定して在庫承認画面を開き、在庫変動区分（入庫／廃棄）・在庫増減数・在庫変動理由・仕入単価を入力して登録する。登録は即時に在庫へ反映するのではなく、承認機能に投入する。入庫は「未承認」の在庫編集承認情報として承認待ちにし（在庫数は承認後に反映）、廃棄は登録時点で在庫をロック（即時減算）したうえで承認待ちにする。あわせて対象在庫の在庫変動履歴と承認者への通知メールを扱う。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）に承認付き在庫編集の相当機能は無い。画面・項目の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・フォーム項目・処理順序・DBカラムはリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 在庫承認（在庫編集）画面の入口（表示・登録・在庫変動理由の非同期更新）
- 登録フォーム項目とバリデーション（在庫変動区分／在庫増減数／在庫変動理由／仕入単価／承認通知先メンバー）
- 登録処理の順序と対象テーブル（在庫編集承認情報 → 在庫変動履歴 → 在庫承認一覧）
- 入庫／廃棄での在庫反映・在庫ロックの差異とトランザクション
- 承認通知メール送信、在庫変動履歴・承認待ち入庫の一覧表示（直近30件）
- 権限不足・バリデーションエラー・404 等の例外と遷移

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能の設計を正とする。

- 在庫承認一覧での承認／却下の確定処理と在庫反映（在庫承認一覧 `StockApprovalListController` / `StockApprovalListUpdateAction` 側を正とする）
- 在庫一括編集（M04-03 / `StockBulkApprovalController`）、在庫変動履歴一覧（M04 在庫変動履歴）、在庫情報CSV出力（M04-04）
- スマレジ連携（参照時の最新在庫取得・編集後の商品情報連携。0501_基本設計仕様書(API_在庫管理) を正とする。本実装での連携有無は実装要確認）
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | HTTPメソッド | 期待されるふるまい |
|------|------------------------------|--------------|--------------------|
| 在庫承認（編集）画面 | `/%admin%/product/stock/{productStockId}/stock-approval/new`（`admin_stock_approval_new`） | GET | 対象 `ProductStock` の商品・規格・在庫情報と在庫変動履歴一覧を表示し、編集フォームを描画。`productStockId` が存在しなければ404。 |
| 登録（承認申請） | `/%admin%/product/stock/{productStockId}/stock-approval/store`（`admin_stock_approval_store`） | POST | フォーム検証・編集権限確認の後、在庫編集承認情報等を登録。成功で `admin_stock_approval_new` へリダイレクト、失敗は同画面を再表示。 |
| 在庫変動理由の非同期更新 | `/%admin%/product/stock/{productStockId}/stock-approval/history-reason/update`（`admin_stock_approval_history_reason_update`） | POST（XHR） | 一覧上の在庫変動履歴または承認待ち入庫詳細の在庫変動理由のみをAjaxで更新し、JSONを返す。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。`productStockId` は `\d+` 制約。`{productStockId}` は `#[MapEntity]` で `ProductStock` に解決され、未存在時は `createNotFoundException` 相当の404。すべて管理画面ログインを要する。

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
| 在庫変動理由 `stock_change_reason` | Textarea | 必須 | `NotBlank` + `Length(max=eccube_product_stock_change_reason_max_len)`。 |
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

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-02-MSG-001 | 管理画面上部 | 保存に失敗しました | Failed to save | 入力内容に不備がある状態で保存したとき | 在庫承認（編集）画面に留まる |
| M04-02-MSG-002 | 管理画面上部 | この店舗の在庫を編集する権限がありません。 | この店舗の在庫を編集する権限がありません。 | 編集しようとした店舗の在庫を編集する権限がないとき | 在庫承認（編集）画面に留まる |
| M04-02-MSG-004 | 管理画面上部 | 保存しました | 保存しました | 在庫編集を保存したとき | 在庫承認（編集）画面に遷移する |
| M04-02-MSG-005 | 入力項目直下/フォーム上部 | 入庫の場合は仕入単価を入力してください | 入庫の場合は仕入単価を入力してください | 入庫を選択し、仕入単価を入力せず保存したとき | 登録せず在庫承認（編集）画面に留まる |

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に承認付き在庫編集の相当機能は無い。リニューアル先のec-cube-enterpriseに新規追加する。DB関連はec-cube-enterpriseを正とする。

- 在庫数の保持先は規格在庫（`dtb_product_stock.stock`）と規格本体（`dtb_product_class.stock`）で、ee実装で確認できる。
- 在庫変更履歴は `dtb_stock_history`（ee）に保持する。eeの `dtb_stock_history` は在庫変動理由を `stock_change_reason`、在庫変動区分を `stock_change_type_detail_id`（区分マスタ `mtb_stock_change_type` / `mtb_stock_change_type_detail`）で持ち、原価管理として `total_cost_price_before` / `total_cost_price_after` / `unit_cost_price_before` / `unit_cost_price_after`、増減数を `stock_change_quantity` で持つ。ソース種別は `mtb_stock_history_source_type`（STOCK_EDIT=1 / STOCK_BULK_EDIT=2 / STOCK_CHANGE_CSV_IMPORT=3）。
- 承認機能の在庫編集承認情報は `dtb_stock_edit_approval` / `dtb_stock_edit_approval_detail` / `dtb_stock_approval_list`（ee）に保持する。承認状態は `approval_status`、承認者は `approval_member_id`、承認日時は `approved_at` で持つ。
- 入庫は承認待ち（在庫即時反映なし）、廃棄は登録時点での在庫ロック（即時減算・履歴即時作成）として実装されている。総原価・原価単価は規格在庫（`ProductStock`）の `total_cost` / 単価算出メソッドで管理する。
- 基本設計が示す廃棄ロック・スマレジ連携・原価日次記録のうち、廃棄ロックは実装で確認できる。スマレジ連携（参照時取得・編集後連携）および原価の一日単位記録の実装有無は、ec-cube-enterprise 実装で要確認とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫編集
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
加藤
更新日
2025-11-04
機能No
M04-02
機能名
在庫編集
概要
商品規格単位かつ店舗ごとに在庫数の編集を行える
処理概要
図形・テキストボックス内テキスト（33件）
レイアウト図
3-1
4-1
4-2
4-3
4-4
4-5
4-6
4-7
4-8
4-9
1-1
1-2
1-3
1-4
1-5
1-6
1-7
1-8
2-1
2-2
2-3
2-4
2-5
3-2
3-3
3-4
3-6
3-7
5-2
5-1
2-6
3-5
画像レイヤー（2枚）: 在庫編集 / A7 / image 2 + 在庫編集 / A7 / image 3
要件説明（要件定義の内容）
標準の商品規格編集機能をベースに下記の要件を定義する
・ユーザーが編集権限を保持している店舗に関連付けられた在庫データを編集可能とする
・商品に紐づく商品規格の在庫数を一覧表示する
・商品規格単位で在庫数の編集が可能とする
・在庫差異の状況把握ができるように在庫変更理由を必須入力とする
・現行システム同様に選択して入力できる内容とフリー入力どちらも可能とする
・利用想定として在庫変動区分を選択し、区分をその他に選択のみ備考としてフリー入力欄に入力する
・原価入力項目を追加する
・在庫追加時は原価を必須入力とする
※在庫が減る場合は入力された原価は参照せず、総在庫のみ減となる
・在庫破棄を可能とする
・承認機能を追加する
・総原価と原価単価を商品規単位で管理する
・総原価及び商品ごとの原価単は一日単位で記録し、呼び出せるようにする
・画面を表示した際に最新の在庫情報をスマレジから取得する
・在庫数を編集後、連携対象の条件を満たしている場合に限り、スマレジへ商品情報を連携する
機能仕様処理概要
1.表示内容
1-1.参照している在庫の商品情報・在庫情報・在庫履歴情報を表示 ※画面部品一覧にて詳細記載
1-2.在庫区分が「スマレジ」の場合、参照時にスマレジ連携を行いスマレジから最新の在庫数を取得する
（0501_基本設計仕様書(API_在庫管理).xlsx「スマレジ連携処理」シート）
1-1-1.取得の際にEC-CUBEとスマレジで在庫差異がある場合、「共通処理」シート2の.スマレジ在庫修正処理を行う
※スマレジ側では正確な在庫数は持たない仕様となったため、ECCUBEからスマレジの在庫を参照することはなくなった。ECCUBEのスマレジ在庫数を正とする。
1-3.在庫履歴情報と、入庫承認待ち在庫情報の両方から取得した情報を同一形式に整形した上で結合（統合）し、画面に在庫履歴情報一覧として表示する
1-3-1.入庫承認待ち在庫情報は承認状態が「却下」以外の情報を表示する
1-4.在庫履歴情報の一覧は、各レコードの「登録日時」と「承認日時」のうち後の日時（以下「基準日時」）をソートキーとし、基準日時の降順（最新順）で表示する
1-5.承認日時が未設定の場合は、登録日時を基準日時とする
1-6.在庫履歴情報は、基準日時の降順で上位30件を表示する
2.入力制限
2-1.画面部品一覧表にて詳細を記載
2-2.識別ID:3-1在庫変動区分の親区分「廃棄」を選択した際は識別ID:3-4「仕入単価」の入力を不可とする
2-2.画面イメージ
在庫編集 / D81 / image 1
3.登録処理
3-1.登録時に入力値チェックを行う
3-2.入力値チェックについては画面部品一覧表の必須・最大値・画面部品の説明に記載されている条件に従いエラーとする
3-3.入力チェックの結果エラーがなければ在庫編集承認情報と在庫変更履歴の登録処理を行う
3-4.登録順は、在庫編集承認情報→在庫変更履歴の順で登録を行う
3-5.在庫編集承認情報の登録時に発番される在庫編集承認IDを在庫変動履歴に登録する
3-6.在庫編集承認一覧にて承認行為が行えるように下記を登録する
・承認状態を「未承認」で登録
・承認対象を「在庫編集」で登録※機能名を入れる
・登録対象の在庫の店舗
・登録対象の在庫の在庫区分
・対象商品規格数を１で登録
・合計在庫増減数を在庫増減数で登録
・合計総原価増減数を総原価増減数で登録
・在庫変動区分
・在庫変動理由
・登録日
・登録者
・承認日を空で登録
・承認者を「承認待ち」で登録
※在庫編集承認一覧にて表示する変更前原価単価・変更後原価単価と変更前総原価・変更後総原価は、計算して表示するためここでは登録しない
3-7.在庫変動区分の親区分が廃棄の場合、在庫ロックするため下記の処理を行う
3-7-1.在庫数の計算を行いロック数量分（在庫増減数）減算し登録する
※計算式は、「登録時点での在庫数+在庫増減数(マイナスの値)」とする
3-7-2.在庫数を減算した後の在庫の総原価を計算し登録する
※計算式は「別添資料_在庫変動時の履歴作成について」シートの「⑤在庫変更のタイミングで必ず対象在庫の総原価の更新を行う」【出庫時】を参照
3-7-3.在庫区分が「スマレジ」の場合スマレジに3-7-1で算出した在庫数を登録する
※連携処理は、0501_基本設計仕様書(API_在庫管理).xlsxの「スマレジ連携処理」シートの2. ECCUBE -> スマレジ(API個別) 処理概要を参照
3-8.在庫変動区分の親区分が「入庫」の場合、「入庫承認待ち在庫情報」に、「廃棄」の場合、「在庫変動履歴」に下記を登録する
```

</details>
