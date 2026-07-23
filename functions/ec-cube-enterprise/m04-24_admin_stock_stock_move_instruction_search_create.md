# 在庫管理 — 在庫移動指示リスト作成/検索

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫移動指示リスト作成/検索 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveInstructionController` / `SearchStockMoveInstructionType` / `StockMoveInstructionDetailType` / `DtbStockMoveInstructionRepository::getQueryBuilderBySearchData` / `StockMoveInstructionDetailUpdateAction` / `StockMoveInstructionTrackingRegisterAction` / `StockMoveInstructionCsvUploadAction` / `StockMoveInstructionCsvImportHandler` / Entity `DtbStockMoveInstruction`・`DtbStockMoveTransfer`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫移動指示リスト作成/検索

### 機能の目的と役割

在庫移動指示（在庫移動振替一覧から作成された、複数の在庫移動を1件にまとめた指示リスト）を検索・一覧表示し、各指示の詳細を参照・更新する管理画面機能。一覧から送り状No.の登録、在庫移動実績CSV（送り状No.一括登録）の取込、指示の削除、送り状CSV出力（M04-25）を行える。サイドバー「在庫管理 / 在庫移動指示」から遷移する（メニュー `product_stock` > `stock_move_instruction`）。

在庫移動指示そのものの新規作成は本画面では行わず、在庫移動振替一覧（M04-09 系）から作成される（Excel要件「在庫移動指示の作成については、在庫移動振替一覧の処理概要を参照」）。本書は作成済み指示の検索・参照・更新を扱う。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。画面・項目の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・検索条件・DBカラム・処理順序はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 在庫移動指示一覧の入口（検索）と一覧項目
- 検索条件（フォームキー付き）と検索条件のセッション保持・復元
- 在庫移動指示詳細の表示項目と、送り状No.・備考の更新
- 一覧モーダルからの送り状No.登録
- 在庫移動実績CSV（送り状No.一括登録）の取込と行単位バリデーション・エラー扱い
- 在庫移動指示の削除（送り状No.未登録時のみ）と紐づく在庫移動の解除
- 未検索・入力不備・対象なし・状態不整合時の扱い

### 本書で扱わないこと

- 在庫移動指示の新規作成（在庫移動振替一覧 M04-09 系を正とする）
- 送り状CSV出力・在庫移動実績CSV雛形ダウンロードの出力列・整形仕様（M04-25 在庫移動指示リストエクスポートを正とする）
- ピッキングリスト印刷（M04-26）。なお ec-cube-enterprise には在庫移動指示からのピッキングリスト印刷機能は未実装（実装要確認）。
- 在庫移動（`DtbStockMoveTransfer`）自体の登録・承認・ステータス遷移（M04-09 系）
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 一覧／検索 | `GET,POST /%admin%/product/stock/move-instruction`（`admin_stock_move_instruction_list`） | GETは初期表示（検索条件をセッション初期化）、`?resume=1` 付きGETはセッション復元して再検索、POSTは検索実行し検索条件をセッション保存。結果は全件表示（ページングなし）。 |
| 指示詳細／更新 | `GET,POST /%admin%/product/stock/move-instruction/{id}`（`admin_stock_move_instruction_detail`） | GETは詳細表示。POSTは送り状No.・備考を更新し同詳細へリダイレクト。存在しないIDは404。 |
| 送り状No.登録（モーダル） | `POST /%admin%/product/stock/move-instruction/{id}/tracking`（`admin_stock_move_instruction_register_tracking`） | 一覧モーダルから `tracking_no` を登録。指示と紐づく在庫移動へ同値を同期し、一覧（`resume=1`）へリダイレクト。存在しないIDは404。 |
| 指示削除 | `POST /%admin%/product/stock/move-instruction/{id}/delete`（`admin_stock_move_instruction_delete`） | 送り状No.未登録時のみ削除可。送り状No.登録済みはエラー表示し詳細へ戻す。存在しないIDは404。 |
| 在庫移動実績CSV登録 | `POST /%admin%/product/stock/move-instruction/csv-tracking`（`admin_stock_move_instruction_csv_tracking`） | アップロードCSVで送り状No.を一括登録し、一覧（`resume=1`）へリダイレクト。 |
| CSV雛形ダウンロード | `GET /%admin%/product/stock/move-instruction/csv-template`（`admin_stock_move_instruction_csv_download_record`） | 在庫移動実績入力用CSV雛形を出力（出力仕様はM04-25）。 |
| 送り状CSV出力 | `POST /%admin%/product/stock/move-instruction/labels`（`admin_stock_move_instruction_labels_export`） | チェックした指示IDの送り状CSVを出力（出力列・整形はM04-25）。IDが空は404。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。すべて管理画面ログインを要する。更新系（tracking/delete/csv-tracking/labels）は `isTokenValid()` でCSRFトークンを検証する。

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

`admin_stock_move_instruction_detail` は対象指示を `find($id)` で取得（無ければ404）し、`StockMoveInstructionDetailType`（block prefix `admin_stock_move_instruction_detail`、CSRFトークンID `stock_move_instruction_detail`）で送り状No.（`trackingNo`、`Length max=255`）・備考（`memo`、`Textarea`）を編集する。

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
- **CSV取込時の例外**: `Throwable` 捕捉時は `log_error` 出力のうえフラッシュ表示。controller は `RuntimeException` の message が `..._csv_tracking_header_invalid` / `..._csv_tracking_file_invalid` / `..._csv_tracking_temp_dir_invalid` に一致する場合のみ固有メッセージへ振り分けるが、これらの message を throw する実装は現行ソースに存在しない（防御的分岐・要実機確認。`grep` で throw 箇所なし）。実際のヘッダ不正は例外ではなく `StockMoveInstructionCsvImporter::validateBeforeImport`（StockMoveInstructionCsvImporter.php:57-68）が `getErrors()` に「CSVのフォーマットが一致しません。」を積む経路（（除外:要ソース確認））で表示される。上記キー以外の `RuntimeException`/`Throwable` は `..._csv_tracking_upload_error_detail`（`%detail%` 埋込）で表示。
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

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-24-MSG-001 | 送り状No.入力欄直下（インラインエラー） | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | 送り状番号を登録済みの状態から空欄にして保存したとき | 在庫移動指示詳細画面に留まる |
| M04-24-MSG-002 | 管理画面上部 | 保存しました | 保存しました | 在庫移動指示の内容を保存したとき | 在庫移動指示詳細画面に遷移する |
| M04-24-MSG-003 | 管理画面上部 | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | 送り状番号を空に戻して発送状況を未に戻すことはできません。 | 送り状番号を登録済みの状態から空欄にして登録したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-004 | 管理画面上部 | 送り状No.を登録しました。 | 送り状No.を登録しました。 | 送り状番号を登録したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-005 | 管理画面上部 | 送り状No.登録後は削除できません。 | 送り状No.登録後は削除できません。 | 送り状番号を登録済みの在庫移動指示を削除しようとしたとき | 在庫移動指示詳細画面に遷移する |
| M04-24-MSG-006 | 管理画面上部 | 削除しました | Deleted | 在庫移動指示を削除したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-007 | 管理画面上部 | ファイルが不正です。 | ファイルが不正です。 | 不正なCSVファイルをアップロードしたとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-008 | 管理画面上部 | エラーは20件まで表示されます | エラーは20件まで表示されます | CSV取込で21件以上のエラーが発生したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-010 | 管理画面上部 | 送り状No.を一括登録しました。 | 送り状No.を一括登録しました。 | CSVから送り状番号を1件以上登録できたとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-011 | 管理画面上部 | 有効な行がありません。 | 有効な行がありません。 | CSV取込で登録できる行が1件もなかったとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-012 | 管理画面上部 | CSVのヘッダーが不正です。 | CSVのヘッダーが不正です。 | CSV取込でCSVのヘッダーが不正なとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-013 | 管理画面上部 | ファイルが不正です。 | ファイルが不正です。 | CSV取込でファイルが不正なとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-014 | 管理画面上部 | アップロードに失敗しました。一時ディレクトリの設定（eccube_csv_temp_realdir）を確認してください。 | アップロードに失敗しました。一時ディレクトリの設定（eccube_csv_temp_realdir）を確認してください。 | CSV取込時に一時ファイルの保存に失敗したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-015 | 管理画面上部 | アップロードに失敗しました。詳細：%detail% | アップロードに失敗しました。詳細：%detail% | CSV取込時に上記以外のエラーが発生したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-016 | 管理画面上部 | アップロードに失敗しました。詳細：%detail% | アップロードに失敗しました。詳細：%detail% | CSV取込時に予期しないエラーが発生したとき | 在庫移動指示リスト作成/検索画面に遷移する |
| M04-24-MSG-017 | ブラウザ標準ダイアログ（JSアラート） | 送り状CSVを出力する在庫移動指示にチェックを入れてください。 | 送り状CSVを出力する在庫移動指示にチェックを入れてください。 | 送り状CSVを出力する在庫移動指示を選択せずに出力したとき | 送信せず在庫移動指示リスト作成/検索画面に留まる |
| M04-24-MSG-018 | 削除確認モーダル本文 | 在庫移動指示（ID：%id%）を削除してよろしいですか？ | 在庫移動指示（ID：%id%）を削除してよろしいですか？ | 在庫移動指示の削除ボタンを押したとき（削除前確認） | 削除確認モーダルを表示し、キャンセル時は在庫移動指示詳細画面に留まる |
| M04-24-MSG-019 | 登録日/更新日の日付入力欄の下（form_errors出力位置・インラインエラー） | 不正な日付です。 | Invalid DateTime. | 登録日または更新日に1900年1月1日より前の日付を指定したとき | 在庫移動指示リスト作成/検索画面に留まる |
| M04-24-MSG-020 | 登録日/更新日の日付入力欄の下（form_errors出力位置・インラインエラー） | 要ソース確認 | admin.product.date_range_error | 要ソース確認 | 要ソース確認 |
| M04-24-MSG-021 | 送り状No.入力欄直下（インラインエラー） | 要ソース確認 | 長すぎます。この値は{{ limit }}文字以下で入力してください。 | 要ソース確認 | 要ソース確認 |
| M04-24-MSG-022 | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | admin.product.date_range_error | 要ソース確認 | 要ソース確認 |
| M04-24-MSG-023 | 入力項目直下/フォーム上部 | 要ソース確認（key_unknown: admin.product.date_range_error） | admin.product.date_range_error | 要ソース確認 | 要ソース確認 |

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に在庫移動指示の作成・検索の相当機能は無い。リニューアル先のec-cube-enterpriseに新規追加する。DB関連はec-cube-enterpriseを正とする。

| 観点 | 内容 |
|------|------|
| 移動指示の親データ | `dtb_stock_move_instruction`（移行先で実在）。移動件数（`subject_of_moves`）・移動点数（`quantity_of_moves`）・基準価格合計（`standard_total_price`）・移動原価合計（`outbound_total_cost`）・高額商品合計（`high_total_price`）・通常商品合計（`regular_total_price`）・出庫元商品金額閾値（`move_from_price_threshold`）・送り状No.（`tracking_no`）・備考（`memo`）を保持する。 |
| 店舗・登録者・更新者 | 出庫元/入庫先店舗は `move_from_base_info_id` / `move_to_base_info_id`（`BaseInfo`）、登録者は `registered_member_id`、更新者は `update_member_id`（いずれも移行先で実在）。 |
| 在庫移動との関連 | 1移動指示は複数の在庫移動（`dtb_stock_move_transfer`、`move_instruction_id` で関連）をまとめる。送り状No.登録時に在庫移動へ同値を同期する。 |
| 高額/通常合計の算出列 | Excel設計が描く「出庫元店舗の高額商品閾値による●●円以上/未満の合計」は、`high_total_price` / `regular_total_price` と `move_from_price_threshold` に対応すると考えられる（算出ロジックの出処は実装要確認）。 |

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動指示検索
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
本田
更新日
2025-12-08
機能No
M04-24
機能名
在庫移動指示検索
概要
在庫移動指示を検索、送り状No.の登録およびダウンロードが可能
処理概要 移動指示検索画面
※在庫移動指示の作成については、在庫移動振替一覧の処理概要を参照
図形・テキストボックス内テキスト（52件）
レイアウト図 在庫移動指示検索画面
1-1
2-1
2-2
2-3
2-4
2-5
2-9
2-10
2-6
2-7
2-8
3-16
3-4
3-2
3-3
3-5
3-6
3-7
3-8
3-9
3-10
3-11
3-12
3-13
3-14
3-1
3-15
画像レイヤー（2枚）: 在庫移動指示検索 / B7 / image 2 + 在庫移動指示検索 / B7 / image 3
機能仕様処理概要 移動指示検索画面
移動指示検索画面概要
・サイドバーの在庫管理 / 在庫移動指示を押下してこの画面（移動指示検索画面）へ遷移する
・在庫移動振替一覧から作成した在庫移動指示に対して、送状No.を登録することで在庫移動のステータスは移動中となる
機能仕様※在庫移動指示の作成については、在庫移動振替一覧の処理概要を参照
移動登録ステータス遷移（在庫移動のものを転用）
・店舗間移動フロー
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
済み
入庫
承認待ち
NG
差分
登録
在庫移動指示リスト
画面遷移図をExcel図形座標で再構成（画面 16件 / 遷移 18件 / 元コネクタ 20件）
遷移一覧（18件）
遷移元遷移先
新規
登録新規
登録
発送
手続き移動中
欠品
登録出庫
承認待ち
新規
登録ピック
ピック欠品
登録
欠品
登録ピック
出庫
承認待ち出庫
承認
出庫
承認却下
出庫
承認済み発送
手続き
移動中着荷
在庫移動指示詳細
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
堀部
作成日
2025/8/25
更新者
石川
更新日
2026-01-28
機能No
M04-25
機能名
在庫移動指示詳細
概要
—
処理概要 在庫移動指示詳細画面
図形・テキストボックス内テキスト（26件）
レイアウト図 在庫移動指示詳細画面
1-1
1-2
1-3
1-4
1-5
1-6
1-7
1-14
1-8
1-11
1-10
1-12
1-13
1-15
1-16
1-9
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
画像レイヤー（2枚）: 在庫移動指示詳細 / D7 / image 1 + 在庫移動指示詳細 / D7 / image 2
機能仕様処理概要 在庫移動指示詳細画面
在庫移動指示詳細画面概要
・在庫移動指示の一覧から任意の移動指示IDを押下することでこの画面（在庫移動指示詳細画面）へ遷移する
権限制御
・0201_基本設計仕様書(システム設定).xlsxの権限制御シート（機能ID: M11-03）の「2.編集可能店舗処理」に応じた権限制御が行われる
送状No.
・在庫移動指示検索画面で送状No.を登録することで、この画面で送状No.を表示できる
・送状No.の変更はこの画面からのみ可能
・送状No.が登録されている場合、送り状No.の値がフォームに表示される
・フォーム内の値を変更し、登録ボタンを押下すると値が保存される
・変更時の未入力（空白のみ）での更新は許可しない
（送り状番号を空に戻してステータス変更発送状況を「未」に戻す、移動ステータスを「出庫承認済み」に戻す）ことはできないため）
備考情報
・備考情報の内容の登録は、まとめられている移動のステータスが出庫承認済みまたは移動中の時のみ可能
・備考情報のフォームの値を変更後、登録ボタンを押下すると値が保存される
登録
・送り状No.および備考の内容が変更された場合にのみ活性化する
・登録ボタンを押下すると値が保存される
・入力チェック
在庫移動指示詳細 / AG69 / image 3
・送り状No.が空文字のみの場合フォームにその旨のエラーを表示
削除
・発送済みでないかつ送り状No.が登録されていない在庫移動指示のみ削除可能
・削除ボタンを押下すると削除確認モーダルが表示される
・削除確認モーダル内の削除ボタンを押下すると移動指示リストが削除され、移動指示リスト作成検索画面へ遷移する
識別IDラベル書式・制限必須最大値初期値画面部品の説明
在庫移動指示情報
1-1在庫移動指示IDラベル---在庫移動指示リスト作成検索 "識別ID3-5" と同様
登録後自動採番された値を表示
1-2出庫元店舗ラベル---在庫移動指示リスト作成検索 "識別ID3-6" と同様
移動指示リストにまとめられている在庫移動の出庫元店舗
1-3入庫先店舗ラベル---在庫移動指示リスト作成検索 "識別ID3-6" と同様
移動指示リストにまとめられている在庫移動の入庫先店舗
1-4在庫移動数ラベル---移動指示リスト含まれる在庫移動の件数
1-5移動点数ラベル---移動指示リストに含まれる移動する商品の点数
1-6登録日ラベル---移動指示リストの登録日
1-7更新日ラベル---移動指示リストの更新日
1-8最終更新者ラベル---移動指示リストの最終更新者
1-9送状No.全角・半角-65535byte-送状No.がある場合に値を表示
数値だけでなく全角・半角を許容する
1-10総販売価格の合計ラベル---各在庫移動の持つ全ての商品の販売価格の合計金額
1-11総移動原価の合計ラベル---各在庫移動の持つ総移動原価の合計金額
1-12●●円以上の商品の合計ラベル---出庫元店舗の高額商品閾値の最も高い価格を取得し閾値とする
項目名も閾値の値を使って、●●円以上の商品と表記する
商品の基準価格が●●円以上の商品の合計金額
1-13●●円未満の商品の合計ラベル---出庫元店舗の高額商品閾値の最も高い価格を取得し閾値とする
項目名も閾値の値を使って、●●円未満の商品と表記する
商品の基準価格が●●円未満の商品の合計金額
1-14備考全角・半角-65535byte-メモの入力は入庫完了以外で入力可能
1-15登録ボタン---備考の変更内容を登録する処理を実行
1-16削除ボタン---表示中の指示書リストを削除する処理を実行
出庫待ち状態の場合のみ削除可能
在庫移動情報
2-1在庫移動振替IDリンク---機能No.: M04-09 在庫移動・振替登録 編集（移動）の "識別ID2-3" の値を利用する
押下することで対象の在庫移動情報へ遷移
2-2出庫元店舗ラベル---機能No.: M04-09 在庫移動・振替登録 編集（移動）の "識別ID2-1" の値を利用する
2-3入庫先店舗ラベル---機能No.: M04-09 在庫移動・振替登録 編集（移動）の "識別ID2-2" の値を利用する
2-4在庫区分ラベル---機能No.: M04-09 在庫移動・振替登録 編集（移動）の "識別ID2-3" の値を利用する
2-5基準価格合計ラベル---対象の在庫移動が持つ全ての商品の基準価格の合計金額
2-6移動原価合計ラベル---対象の在庫移動が持つ移動原価の合計金額
2-7●●円以上の商品の合計ラベル---出庫元店舗の高額商品閾値の最も高い価格を取得し閾値とする
項目名も閾値の値を使って、●●円以上の商品と表記する
商品の基準価格が●●円以上の商品の合計金額
2-8●●円未満の商品の合計ラベル---出庫元店舗の高額商品閾値の最も高い価格を取得し閾値とする
項目名も閾値の値を使って、●●円未満の商品と表記する
商品の基準価格が●●円未満の商品の合計金額
2-9移動点数ラベル---対象の在庫移動に含まれる商品点数の合計
2-10登録日ラベル---機能No.: M04-09 在庫移動・振替登録 編集（移動）の "識別ID1-4" の値を利用する
図形・テキストボックス内テキスト（26件）
```

</details>
