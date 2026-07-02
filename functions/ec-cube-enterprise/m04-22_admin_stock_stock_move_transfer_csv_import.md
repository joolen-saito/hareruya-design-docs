# M04-22（在庫移動・振替CSV登録）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫移動・振替CSV登録 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveTransferController::importStockMoveCsv` / `importStockTransferCsv` / `StockMoveCsvImportType` / `StockTransferCsvImportType` / `StockMoveCsvImportHandler` / `StockTransferCsvImportHandler` / `StockMoveCsvImporter` / `StockTransferCsvImporter`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、フォーム項目・取込手順・バリデーション・履歴更新を実装確認値で具体化。 |

## 1. 在庫移動・振替CSV登録

### 機能の目的と役割

在庫移動・振替検索/一覧（M04-08）画面上のモーダルから、CSVファイルで在庫移動または在庫振替を一括登録する管理画面機能。アップロードした商品コード・点数をもとに、在庫移動振替（親）と明細を作成し、出庫元（振替元）の在庫を点数分減算して在庫変動履歴を記録する。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。挙動・画面の業務要件は基本設計仕様書（在庫管理機能 M04-22シート）を正とし、URLエンドポイント・DBカラム・取込処理順序はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 在庫移動CSV登録／在庫振替CSV登録の入口（エンドポイント）とフォーム項目
- CSV雛形（ヘッダ）と必須列
- 取込手順・バリデーション・エラー行/不正行の扱い・取込履歴
- 登録時の在庫・履歴更新と完了後の遷移

### 本書で扱わないこと

- 在庫移動・振替の検索/一覧（M04-08）、画面からの個別登録/編集（M04-09）の画面仕様
- 出庫承認・入庫承認などステータス遷移そのもの（承認系機能を正とする）
- 編集可能店舗の権限制御の詳細（M11-03 権限制御を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 在庫移動CSV登録 | `POST /%admin%/product/stock/move_transfer/move_csv_import`（`admin_stock_move_transfer_move_csv_import`） | 在庫移動CSVを取込。成功時は出庫承認依頼画面へ遷移。 |
| 在庫振替CSV登録 | `POST /%admin%/product/stock/move_transfer/transfer_csv_import`（`admin_stock_move_transfer_transfer_csv_import`） | 在庫振替CSVを取込。成功時は在庫振替詳細画面へ遷移。 |
| 在庫移動CSV雛形 | `GET /%admin%/product/stock/move_transfer/move_csv_template`（`admin_stock_move_transfer_move_csv_template`） | `stock_move.csv`（ヘッダ: 商品コード／移動点数）を出力。 |
| 在庫振替CSV雛形 | `GET /%admin%/product/stock/move_transfer/transfer_csv_template`（`admin_stock_move_transfer_transfer_csv_template`） | `stock_transfer.csv`（ヘッダ: 振替元商品コード／振替先商品コード／振替点数）を出力。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。登録ルートはすべて一覧画面（`admin_stock_move_transfer`）上のモーダルからPOSTされる。

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

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に対応する在庫移動・振替CSV登録機能は無い。挙動・画面・CSV列は基本設計仕様書（在庫管理機能 M04-22シート）を正とし、DBスキーマ・処理順序は ec-cube-enterprise の実装を正とする。確認できない点は推測せず要確認として残す。

| 観点 | 内容 |
|------|------|
| 移動・振替の親データ | `dtb_stock_move_transfer`（移動振替区分・初期ステータス・出庫元/入庫先の店舗ID・在庫区分・送り状No・登録者・更新者）。移動の初期ステータスは新規登録、振替は振替承認待ち。 |
| 移動・振替の明細 | `dtb_stock_move_transfer_detail`（移動/振替点数・基準価格合計・出庫総原価）。 |
| 在庫・履歴 | 出庫元/振替元在庫を `dtb_product_stock` で減算し、`dtb_stock_history` に在庫変動履歴を記録する。 |
| 取込履歴 | `dtb_csv_import_history`（`member_id`・`file_name`・`csv_import_type_id`＝17/18）。 |
| CSV列 | 移動は商品コード・移動点数の2列、振替は振替元商品コード・振替先商品コード・振替点数の3列。 |

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動CSV登録
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
2025-12-23
機能No
M04-22
機能名
在庫移動CSV登録
概要
—
処理概要 在庫移動CSV登録モーダル
図形・テキストボックス内テキスト（9件）
レイアウト図 在庫移動CSVモーダル
1-1
1-2
1-4
1-3
1-5
1-6
2-1
2-2
2-3
在庫移動CSV登録 / C8 / image 1
機能仕様処理概要 在庫移動CSV登録モーダル
在庫移動CSV登録画面概要
・在庫移動振替一覧画面から在庫移動CSV出力ボタンを押下し、このモーダル（在庫移動CSV登録モーダル）を表示する
・選択した条件に対して、CSVの商品コードと移動点数をもとに在庫移動の登録を行う
・登録処理完了後、ステータスは新規作成となり、移動対象の店舗の対象の商品の在庫が移動点数分減る
権限制御
・0201_基本設計仕様書(システム設定).xlsxの権限制御シート（機能ID: M11-03）の「2.編集可能店舗処理」に応じた権限制御が行われる
登録処理実行時のエラー
・アップロードされたファイルがcsv以外のファイルの場合
・CSVファイルが下記のカラム以外の場合（フォーマット不一致エラー）
・商品コード、移動点数
・１ファイルあたりに登録できる商品点数の上限を10,000件に設定 上限数について確認する必要がある
エラー発生時の挙動
・モーダルを表示する元画面でエラーを扱う
・本モーダルの選択内容はリセットされる
在庫移動登録
・機能ID: M04-09の「処理概要 初期登録画面」に応じた在庫移動登録処理が行われる
識別IDラベル書式・制限必須最大値初期値画面部品の説明
1-1出庫元店舗単一選択(セレクトボックス)○--在庫移動・振替登録 編集（移動）の "識別ID2-2" と同様に
「出庫元店舗」を選択
1-2出庫元在庫区分単一選択(ラジオボタン)○--在庫移動・振替登録 編集（移動）の "識別ID2-4" と同様に
「出庫元在庫区分」を選択
1-3入庫先店舗単一選択(セレクトボックス)○--在庫移動・振替登録 編集（移動）の "識別ID2-2" と同様に
「入庫先店舗」を選択
1-4入庫先在庫区分単一選択(ラジオボタン)○--在庫移動・振替登録 編集（移動）の "識別ID2-4" と同様に
「入庫先在庫区分」を選択
1-5ファイルを選択ボタン○--ボタンを押下すると、アップロードするためのディレクトリフォームが開き、
csvファイルをアップロードすることが出来る
1-6登録ボタン---在庫移動CSV登録処理を実行
2-1雛形をダウンロードボタン---ボタン押下時に下記のカラムが記入されているCSVファイルを出力する
CSVのカラムは下記の通り
商品コード、移動点数
登録CSV
識別ID項目名主キー書式・制限必須最大文字数入力例説明
2-2商品コード○文字列○255ABCD1234在庫移動対象の商品コードを記入
2-3移動点数○数値○0~999999999100在庫移動対象の商品の移動点数を記入
図形・テキストボックス内テキスト（9件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
C11(1-1)
R11(1-2)
C15(1-3)
R15(1-4)
C18(1-5)
C21(1-6)
Y23(2-1)
C26(2-2)
C28(2-3)
在庫振替CSV登録
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
2025-12-23
機能No
M04-22
機能名
在庫振替CSV登録
概要
—
処理概要 在庫振替CSV登録モーダル
図形・テキストボックス内テキスト（10件）
レイアウト図 在庫振替CSVモーダル
1-1
2-1
1-3
1-2
1-5
1-6
2-2
1-4
2-3
2-4
在庫振替CSV登録 / D8 / image 1
機能仕様処理概要 在庫振替CSV登録モーダル
在庫振替CSV登録画面概要
・在庫移動振替一覧画面から在庫振替CSV出力ボタンを押下し、このモーダル（在庫振替CSV登録モーダル）を表示する
・選択した条件に対して、CSVの振替元商品コードと振替先商品コード、振替点数をもとに在庫振替の登録を行う
・登録処理完了後、ステータスは振替承認待ちとなり、振替対象の商品の在庫が振替点数分減る
権限制御
・0201_基本設計仕様書(システム設定).xlsxの権限制御シート（機能ID: M11-03）の「2.編集可能店舗処理」に応じた権限制御が行われる
登録処理実行時のエラー
・アップロードされたファイルがcsv以外のファイルの場合
・CSVファイルが下記のカラム以外の場合（フォーマット不一致エラー）
・振替元商品コード、振替先商品コード、移動点数
・１ファイルあたりに登録できる商品点数の上限を2,000件に設定
エラー発生時の挙動
・モーダルを表示する元画面でエラーを扱う
・本モーダルの選択内容はリセットされる
在庫移動登録
・機能ID: M04-09の「処理概要 初期登録画面」に応じた在庫振替登録処理が行われる
・画面での登録とはことなり、振替元商品コードは同じ商品が複数行あっても許容する（NMの商品をSPとMPにそれぞれ振替するパターンも考えられるため）
・上記に関連し、振替元商品と振替先商品がまったく同一の行が複数あった場合はエラーとする
識別IDラベル書式・制限必須最大値初期値画面部品の説明
1-1店舗単一選択(セレクトボックス)○--在庫移動・振替登録 編集（振替）の "識別ID2-1" と同様に
「店舗」を選択
1-2在庫区分単一選択(ラジオボタン)○--在庫移動・振替登録 編集（振替）の "識別ID2-2" と同様に
「在庫区分」を選択
1-3承認通知先（所属選択）単一選択(セレクトボックス)---共通処理識別ID1-1参照
表示内容については下記条件を追加とする
編集している在庫を保持している店舗の所属マスターデータから取得し選択肢とする
1-4承認通知先（メンバー選択）複数選択(セレクトボックス)○--承認を行う担当者にメール通知を送るために、対象メンバーを選択するためのフォーム
共通処理識別ID1-2参照
1-5ファイルを選択ボタン○--ボタンを押下すると、アップロードするためのディレクトリフォームが開き、
csvファイルをアップロードすることが出来る
1-6登録ボタン---在庫振替CSV登録処理を実行
2-1雛形をダウンロードボタン---ボタン押下時に下記のカラムが記入されているCSVファイルを出力する
CSVのカラムは下記の通り
商品コード、移動点数
登録CSV
識別ID項目名主キー書式・制限必須最大文字数入力例説明
2-2振替元商品コード○文字列○255ABCD1234在庫振替元の商品コードを記入
2-3振替先商品コード○文字列○255ABCD1234在庫振替先の商品コードを記入
2-4振替点数○数値○0~999999999100在庫振替対象の商品の振替点数を記入
図形・テキストボックス内テキスト（10件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
D11(1-1)
D14(1-2)
D18(1-3)
P18(1-4)
D21(1-5)
D24(1-6)
V26(2-1)
D28(2-2)
D30(2-3)
D32(2-4)
```

</details>
