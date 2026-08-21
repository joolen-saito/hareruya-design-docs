# m04-24_admin_stock_stock_move_instruction_search_create — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動指示リスト作成/検索

### 画面表示・一覧項目

| 観点 | 内容 |
|------|------|
| 表示順 | 登録日（`create_date`）降順（`getQueryBuilderBySearchData` の `orderBy('s.createDate', 'DESC')`）。 |
| 件数 | ページングなし。検索条件に一致する全件を取得（`getQuery()->getResult()`）し件数を表示。 |
| 一覧項目 | チェックボックス（`ids[]`、送り状CSV出力の選択用）／移動指示ID（詳細へのリンク）／出庫元店舗（`MoveFromBaseInfo.shopName`）／入庫先店舗（`MoveToBaseInfo.shopName`）／在庫移動（`subjectOfMoves`、移動件数）／移動点数（`quantityOfMoves`）／基準価格合計（`standardTotalPrice`）／移動原価合計（`outboundTotalCost`）／登録日（`createDate`）／更新日（`updateDate`）／送り状No.（`trackingNo`。未登録時は「送り状No.登録」ボタンを表示しモーダルで登録）／発送状況（送り状No.有=「済」、無=「未」）。 |
| 初回表示 | GET（`resume` 無し）では検索条件セッションを初期化し、検索フォームのビューデータのみ表示（一覧は空）。 |

### 検索条件

`SearchStockMoveInstructionType`（block prefix `admin_search_stock_move_instruction`、CSRFトークンID `search_stock_move_instruction`）で受け取り、`DtbStockMoveInstructionRepository::getQueryBuilderBySearchData($searchData)` が絞り込む。

| 項目（フォームキー） | 種別・絞り込み |
|----------------------|----------------|
| 出庫元店舗 `move_from_base_info` | `BaseInfo` 選択。`s.MoveFromBaseInfo` 完全一致。 |
| 入庫先店舗 `move_to_base_info` | `BaseInfo` 選択。`s.MoveToBaseInfo` 完全一致。 |
| 移動指示ID `instruction_id` | テキスト。`CONCAT(s.id,'') LIKE %値%`（部分一致、`%`・`_` はエスケープ）。 |
| 在庫移動振替ID `stock_move_transfer_id` | テキスト。`DtbStockMoveTransfer`（`moveInstructionId = s.id`）をJOINし `CONCAT(t.id,'') = 値`（完全一致、`distinct`）。 |
| 登録日 `create_date_start` / `create_date_end` | 日付。`createDate >= start`、`createDate < end+1日`。 |
| 更新日 `update_date_start` / `update_date_end` | 日付。`updateDate >= start`、`updateDate < end+1日`。 |
| 発送状況・未 `shipment_status_not_done` | チェック。送り状No.が NULL または空文字の指示。 |
| 発送状況・済 `shipment_status_done` | チェック。送り状No.が NULL でなく空文字でない指示。 |

発送状況は「未のみ」「済のみ」チェック時に絞り込み、両方チェックまたは両方未チェックでは送り状No.条件を付けない。日付は From>To のときフォームの POST_SUBMIT で `admin.product.date_range_error` を該当 To 欄に付与し検証エラーとする。

### 在庫移動指示詳細

`admin_stock_move_instruction_detail` は対象指示を `find($id)` で取得（無ければ404）し、`StockMoveInstructionDetailType`（block prefix `admin_stock_move_instruction_detail`、CSRFトークンID `stock_move_instruction_detail`）で送り状No.（`trackingNo`、`Length max=255`）・備考（`memo`、`Textarea`）を編集する。Excel識別ID 1-9 / 1-14 は両項目を最大16384文字とするため、送り状No.はExcelより実装上限が小さく、備考はフォームにLength制約がないという実装差がある。

表示項目（読取）: 移動指示ID／発送状況／出庫元店舗／入庫先店舗／登録日／登録者（`RegisteredMember.name`）／更新日／最終更新者（`UpdateMember.name`）／基準価格合計（`standardTotalPrice`）／移動原価合計（`outboundTotalCost`）／高額商品合計（`highTotalPrice`）／通常商品合計（`regularTotalPrice`）。下部に当該指示に紐づく在庫移動一覧（`DtbStockMoveTransfer` を `moveInstructionId` で `id ASC` 取得）を表示。

POST更新時は `StockMoveInstructionDetailUpdateAction` が `updateDate`・`UpdateMember`（ログインメンバー）を更新し、フォーム上の `trackingNo` を紐づく在庫移動（`DtbStockMoveTransfer.trackingNo`）へ同期して `flush`。成功時は `admin.common.save_complete` を表示し同詳細へリダイレクト。

> Excel設計の「送り状No.変更時の未入力（空白のみ）での更新は許可しない」「備考は出庫承認済み/移動中のみ入力可」は基本設計要件。実装では `trackingNo` は `required:false`・`Length` のみで、空白のみ禁止や備考のステータス制御はフォーム/Action上は未確認（実装要確認）。

### 送り状No.登録（一覧モーダル）

一覧の各行（送り状No.未登録）に「送り状No.登録」ボタンがあり、モーダルで `tracking_no` を送信する。`StockMoveInstructionTrackingRegisterAction` が指示の `trackingNo`（空文字は NULL 扱い）・`updateDate`・`UpdateMember` を設定し、紐づく在庫移動へ `trackingNo` を同期して `flush`。成功時 `admin.stock.move_instruction.tracking_register_success` を表示し一覧（`resume=1`）へリダイレクト。

### 在庫移動実績CSV登録（送り状No.一括登録）

一覧上部「CSV登録」モーダルから CSVをアップロードし、`admin_stock_move_instruction_csv_tracking` が処理する。`StockMoveInstructionCsvUploadAction` → `StockMoveInstructionCsvImporter`（BOM除去・列数パディング対応の `StockMoveInstructionCsvImportService`）→ `StockMoveInstructionCsvImportHandler` で取り込む。

- 必須ヘッダ（順不同・列定義名）: `移動指示ID`（必須・数値）／`出庫元店舗(名称)`／`入庫先店舗(名称)`／`送り状No.`（必須）。ヘッダ行が取得できない場合はヘッダ書式エラー。
- 行バリデーション（不正行は当該行をスキップして処理継続。`skipRow()`、`breakAll()` ではない）:
  - 列数がヘッダ数と不一致 → 列数不整合エラー。
  - 各列の存在/必須/数値検証。
  - `移動指示ID` が数値0以下・該当指示なし → `admin.stock.move_instruction.csv_tracking_error_instruction_not_found`。
  - `出庫元店舗(名称)`/`入庫先店舗(名称)` が指定ありで指示の店舗名と不一致 → `..._error_shop_mismatch_from` / `..._error_shop_mismatch_to`。
  - `送り状No.` が空（trim後）→ `..._error_tracking_no_empty`。
- 取込成功行は指示・紐づく在庫移動へ送り状No.を反映（`persistTrackingNo`）。
- 結果: 成功>0件で `admin.stock.move_instruction.csv_tracking_success`。成功0かつエラー0（ヘッダのみ等）で `..._csv_tracking_no_valid_rows`。行エラーは各メッセージを表示。

### プロセスフロー（一覧／検索）

1. リクエスト受信。
2. **POST（検索実行）**: フォーム検証。不正なら `has_errors=true`・一覧空・`is_search_filter_active=true` で再表示。正常なら検索条件を `FormUtil::getViewData` でセッション `admin.stock.move_instruction.search` に保存し検索。
3. **GET（`?resume=1`）**: セッションの検索条件を `FormUtil::submitAndGetData` で復元・再検索。
4. **GET（初回）**: 検索フォームのビューデータをセッションへ初期化し、一覧は空で返す。
5. 検索は `getQueryBuilderBySearchData($searchData)->getQuery()->getResult()`（全件、登録日降順）。

### 分岐・遷移・例外

- **検索入力不備**: 日付 From>To でフォーム検証エラー。リダイレクトせず一覧空で再表示。
- **詳細/登録/削除の対象なし**: `find($id)` が null で `NotFoundHttpException`（404）。
- **削除可否**: 送り状No.登録済み（`trackingNo` が非null・非空）の指示は削除不可。`StockMoveInstructionDeleteException` を捕捉し `admin.stock.move_instruction.delete_error_after_tracking` を表示、詳細へリダイレクト。削除可の場合は紐づく在庫移動の `moveInstructionId`・`trackingNo` を null にしてから指示を `remove`、`admin.common.delete_complete` を表示し一覧（`resume=1`）へ。
- **CSV未選択/不正ファイル**: `csv_file` が未指定・`isValid()` false → `admin.stock.move_instruction.csv_tracking_file_invalid`、一覧へリダイレクト。
- **CSV取込時の例外**: `Throwable` 捕捉時は `log_error` 出力のうえフラッシュ表示。controller は `RuntimeException` の message が `..._csv_tracking_header_invalid` / `..._csv_tracking_file_invalid` / `..._csv_tracking_temp_dir_invalid` に一致する場合のみ固有メッセージへ振り分けるが、これらの message を throw する実装は現行ソースに存在しない（防御的分岐・要実機確認。`grep` で throw 箇所なし）。実際のヘッダ不正は例外ではなく `StockMoveInstructionCsvImporter::validateBeforeImport`（StockMoveInstructionCsvImporter.php:57-68）が `getErrors()` に「CSVのフォーマットが一致しません。」を積む経路（対応メッセージは単一の逐語文言に確定不能のため本表から除外済み）で表示される。上記キー以外の `RuntimeException`/`Throwable` は `..._csv_tracking_upload_error_detail`（`%detail%` 埋込）で表示。
- **送り状CSV出力でID無し**: `ids` 空配列は404。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ（参照） | 一覧・詳細・検索は在庫移動指示 `dtb_stock_move_instruction` を参照。 |
| 主データ（更新） | 詳細更新・送り状No.登録・CSV登録で `dtb_stock_move_instruction` の `tracking_no`・`memo`・`update_date`・`update_member_id` を更新。 |
| 連動更新 | 送り状No.の登録/更新時、紐づく在庫移動 `dtb_stock_move_transfer.tracking_no` を同値に同期。削除時は紐づく `dtb_stock_move_transfer` の `move_instruction_id`・`tracking_no` を null 化。 |
| セッション | 検索条件を `admin.stock.move_instruction.search` に保持。 |

### 関連設計への接続点

- 画面項目・一覧列の業務要件は参照元Excel設計書（在庫移動指示検索／在庫移動指示詳細シート）を正とする。
- URLエンドポイント・検索条件・DBカラム・処理順序は `../ec-cube-enterprise` の `StockMoveInstructionController` 系実装を正とする。
- 送り状CSV・実績CSV雛形の出力仕様はM04-25、ピッキングリスト印刷はM04-26を参照。在庫移動指示の作成はM04-09 系を参照。
