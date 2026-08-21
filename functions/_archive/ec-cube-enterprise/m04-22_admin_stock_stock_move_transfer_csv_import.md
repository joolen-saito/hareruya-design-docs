# m04-22_admin_stock_stock_move_transfer_csv_import — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動・振替CSV登録

### フォーム項目（モーダル）

**在庫移動CSV登録（`StockMoveCsvImportType`、ブロックプレフィックス `stock_move_csv_import`）**

| フォームキー | 形式 | 必須 | 内容 |
|--------------|------|------|------|
| `move_from_base_info` | `BaseInfo` セレクト | ○ | 出庫元店舗 |
| `move_to_base_info` | `BaseInfo` セレクト | ○ | 入庫先店舗 |
| `move_from_stock_location_id` | ラジオ（EC-CUBE/スマレジ） | ○ | 出庫元在庫区分 |
| `move_to_stock_location_id` | ラジオ（EC-CUBE/スマレジ） | ○ | 入庫先在庫区分 |
| `import_file` | ファイル（mapped=false） | ○ | CSVファイル。`NotBlank` ＋ `File`（最大 `eccube_csv_size` MB） |

**在庫振替CSV登録（`StockTransferCsvImportType`、ブロックプレフィックス `stock_transfer_csv_import`）**

| フォームキー | 形式 | 必須 | 内容 |
|--------------|------|------|------|
| `transfer_base_info` | `BaseInfo` セレクト | ○ | 店舗（振替元・先共通） |
| `transfer_stock_location_id` | ラジオ（EC-CUBE/スマレジ） | ○ | 在庫区分 |
| `approval_department` | 所属セレクト | 任意 | 承認通知先の所属（承認権限保持メンバーの所属） |
| `approval_notification_target_members` | メンバー複数選択 | 任意 | 承認通知メール送付先メンバー（承認権限保持者） |
| `import_file` | ファイル（mapped=false） | ○ | CSVファイル。`NotBlank` ＋ `File`（最大 `eccube_csv_size` MB） |

### CSV雛形・必須列

| 種別 | 雛形ファイル名 | 列（ヘッダ） |
|------|----------------|--------------|
| 在庫移動 | `stock_move.csv` | 商品コード／移動点数 |
| 在庫振替 | `stock_transfer.csv` | 振替元商品コード／振替先商品コード／振替点数 |

列定義は `ColumnDefinitions`（`productCode`・`stockMoveQuantity`・`stockTransferFromProductCode`・`stockTransferToProductCode`・`stockTransferQuantity`、いずれも必須）に対応する。

### 取込手順（在庫移動）

1. フォーム検証。不正なら各エラーを `addError(..., 'admin')` し一覧へリダイレクト。
2. `import_file` が null の場合 `admin.common.csv_invalid_format` を表示し一覧へ。
3. 行数が `ADMIN_CSV_IMPORT_MAX_ROWS`（=5010）以上なら `admin.csv.error.upload.maxrecord`（`%maxRecord%`=5010）を表示し一覧へ。
4. `StockMoveCsvImportHandler` ＋ `StockMoveCsvImporter` で取込実行。
   - **onBeforeImport**: ステータス「新規登録」（`MtbStockMoveTransferStatus::STATUS_NEW=1`）で在庫移動振替（親）を作成・flush。
   - **行検証（onValidateRow）**: ヘッダ形式不一致は `admin.csv.error.format.header`。商品コード未存在は `admin.csv.error.product.not_exists`（breakAll）。移動点数が1未満は `admin.csv.error.product.invalid`（breakAll）。
   - **行取込（onReadRow）**: 商品コードから `ProductClass` を特定し、出庫元/入庫先の `ProductStock`（店舗・在庫区分一致）を取得。明細（`DtbStockMoveTransferDetail`：移動点数・基準価格合計・出庫総原価）を作成。在庫変動履歴（変動種別 `MtbStockChangeTypeDetail::MOVE_OUTBOUND`、履歴元種別 `STOCK_MOVE_EDIT`）を作成し、出庫元在庫を点数分減算（在庫数・総原価更新）。出庫元/入庫先の在庫が見つからない場合は例外。
5. 取込エラーがあれば `log_info('在庫移動CSV登録 異常終了')`、各エラーを表示し一覧へリダイレクト（登録は確定しない）。
6. 成功時は `addSuccess('admin.register.complete')`、`dtb_csv_import_history` に登録（種別 `STOCK_MOVE_IMPORT_CSV_ID=17`／ファイル名／ログインメンバーID）。在庫移動振替IDがあれば出庫承認依頼画面（`admin_stock_move_outbound_approval_request`）へ、無ければ一覧へ遷移。

### 取込手順（在庫振替）

在庫移動と同様の前段検証（フォーム・ファイル有無・最大行数）を行い、`StockTransferCsvImportHandler` ＋ `StockTransferCsvImporter` で取込。

- **onBeforeImport**: ステータス「振替承認待ち」（`STATUS_TRANSFER_APPROVAL_PENDING=8`）、移動タイプ＝振替（`MOVE_TRANSFER_TYPE_TRANSFER=2`）、出庫元/入庫先の店舗・在庫区分を `transfer_base_info`／`transfer_stock_location_id` で同一に設定して親を作成・flush。
- **行検証**: 振替元・振替先それぞれの商品コード未存在は `admin.csv.error.product.not_exists`、振替点数1未満は `admin.csv.error.product.invalid`（いずれも breakAll）。
- **行取込**: 振替元・振替先の `ProductClass`／`ProductStock`（同一店舗・在庫区分）を取得し、明細を作成。在庫変動履歴（変動種別 `TRANSFER_OUTBOUND`、履歴元種別 `STOCK_TRANSFER_EDIT`）を記録し、振替元在庫を点数分減算。
- **onAfterImport**: `approval_notification_target_members` の各メンバーへ承認通知メール（`MailService::sendStockApprovalAlertMail`、リンクは `admin_stock_transfer`）を送信。送信失敗時は次のメンバーへ継続。
- 成功時は `dtb_csv_import_history` に種別 `STOCK_TRANSFER_IMPORT_CSV_ID=18` で登録し、在庫振替詳細（`admin_stock_transfer`）へ遷移。

> **Excel要件「振替元・振替先がまったく同一の行が複数あった場合はエラー」を正とする。** 現行ハンドラ内に相当する重複行チェックの明示実装が見当たらないため、**実装側で追加が必要**（テストは重複行→エラーを期待値とする）。

### エラー行／不正行の扱い

- 行検証でエラーを検出すると `breakAll()` し、以降の行は処理しない。取込全体は `import()` のトランザクション内でロールバックされ、エラーは `result->getErrors()` 経由で元画面（一覧）に表示される（部分登録は発生しない）。
- 不正フォーマット（ヘッダ不一致・空データ）はメッセージストアの該当キー（`admin.csv.error.format.header`／`admin.csv.error.data.empty` 等）で扱う。
- エラー発生時、CSV登録モーダルの選択内容はリセットされ、一覧の検索条件・選択状態は維持される（Excel要件・M04-08側）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 親データ | 在庫移動振替 `dtb_stock_move_transfer`（移動タイプ・初期ステータス・出庫元/入庫先の店舗ID・在庫区分・登録者 `registered_member_id`・更新者 `updated_member_id`）。 |
| 明細 | `dtb_stock_move_transfer_detail`（移動/振替点数・基準価格合計・出庫総原価）。 |
| 在庫 | 規格在庫 `dtb_product_stock`（出庫元/振替元の在庫数・総原価を点数分減算）。 |
| 在庫変動履歴 | `dtb_stock_history`（変動種別＝移動出庫/振替出庫、履歴元種別＝移動編集/振替編集、履歴元IDに在庫移動振替ID）。 |
| 取込履歴 | `dtb_csv_import_history`（`csv_import_type_id`＝17/18、`file_name`、`member_id`）。 |
| ステータス履歴 | 取込時は親に初期ステータスを設定するのみで、`dtb_stock_move_transfer_status_history` への明示的な履歴行追加は本取込処理内に見当たらない（ステータス遷移は承認系機能側）。Excel設計が取込時点のステータス履歴記録を要する場合はExcelを正とし、実装側の是正対象とする（**要確認**）。 |

### 最大行数について

**Excel記載の上限（移動10,000件・振替2,000件）を正とする。** 現状の実装は共通定数 `ADMIN_CSV_IMPORT_MAX_ROWS=5010` 以上で一律エラーとしており、移動・振替で個別上限になっていないためExcel要件と異なる（**実装側の是正対象**）。テストはExcel上限（移動10,000／振替2,000）を境界値として設計する。

### 例外処理

- **ファイル未指定**: `admin.common.csv_invalid_format` を表示し一覧へリダイレクト。
- **最大行数超過**: `admin.csv.error.upload.maxrecord` を表示し一覧へリダイレクト。
- **在庫未存在**: 出庫元/入庫先（振替元/先）の在庫が見つからない場合は例外を送出し、取込はエラーとして確定しない。
- **権限**: 編集可能店舗の権限制御（M11-03）に従う（共通設計を正とする）。

### 関連設計への接続点

- 画面項目・CSV列・上限値の業務要件は参照元Excel設計書（在庫移動CSV登録／在庫振替CSV登録シート）を正とする。
- URLエンドポイント・DBカラム・取込処理順序・エラーメッセージキーは `../ec-cube-enterprise` の `StockMoveTransferController` / 各 Import Handler / Importer 実装を正とする。
- 取込後の遷移先（出庫承認依頼 M04系・在庫振替詳細）の画面仕様は各機能設計を正とする。
