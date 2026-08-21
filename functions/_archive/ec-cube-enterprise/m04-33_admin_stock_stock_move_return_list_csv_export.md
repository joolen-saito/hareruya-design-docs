# m04-33_admin_stock_stock_move_return_list_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 戻しリストCSV

### CSV出力仕様

| 観点 | 内容 |
|------|------|
| ヘッダ定数 | `StockMoveTransferReturnListCsvExportService::CSV_HEADER`。1行目にヘッダ名を出力する。 |
| 文字コード | `CsvExportService` 経由。`eccube_csv_export_encoding` 設定に従う（UTF-8 設定時は先頭に BOM `\xEF\xBB\xBF` を付与。既定は `SJIS-win`）。区切りは `eccube_csv_export_separator` 設定。 |
| ファイル名 | `stock_move_transfer_return_list_{選択IDの最小値を7桁ゼロ詰め}_{YmdHis}.csv`（例: `stock_move_transfer_return_list_0012345_20260101120000.csv`）。`Content-Type: application/octet-stream`、`Content-Disposition: attachment`。 |
| 完了ログ | `log_info('在庫移動・振替 戻しリストCSV出力完了. ファイル名: …')` を記録する。 |

出力列（`CSV_HEADER` の順）:

| # | 列名（ヘッダ） | 内部キー | 内容・整形ルール |
|---|----------------|----------|------------------|
| 1 | ピッキング区分 | `pickingType` | 入庫先店舗の金額閾値（`expensive_threshold1〜3`）と基準価格で振り分け。閾値を昇順に整列し、基準価格が「最小閾値未満」→`{最小閾値}円未満`、区間内→`{下限}円以上{下限上}円未満`、最大閾値以上→`{最大閾値}円以上`（数値は3桁区切り）。サプライ品（後述）は `サプライ`。基準価格 null または閾値未設定時は空。 |
| 2 | 棚番号 | `shelfNumber` | 本店（`BaseInfo::TC_TOKYO_ID`）の入庫先のみ棚番（`dtb_shelf_number.name`）を出力。支店は空。 |
| 3 | 言語/状態 | `languageAndCondition` | `{Foilなら"Foil"}{言語コード}/{状態コード}`（例 `FoilJP/NM`）。状態コードが空なら `/状態` を付けない。サプライ品は `サプライ品`。 |
| 4 | 略称 | `storageCode` | 保管コード（略称タグ）名 `mtb_storage_code.name`。サプライ品は空。 |
| 5 | 色/R | `colorAndRarity` | 色名（カードに紐づく `mtb_color.name_jp` を id 順連結）＋レアリティコード `mtb_rarity.code`。サプライ品は空。シングルカード以外は色情報が無いため色は付かない。 |
| 6 | 数 | `quantity` | 商品規格単位に集計した移動点数 `SUM(d.move_transfer_quantity)`。 |
| 7 | 商品名 | `productName` | サプライ品はそのまま。非サプライは商品名から略称タグ（`[略称]`、無ければ `[～]`）・`【言語/状態】`・色・レアリティを除去（受注ピッキングリストと同等ロジック）。 |
| 8 | 基準価格 | `standardPrice` | 規格の基準価格 `dtb_product_class.standard_price`（数値、null は空）。 |

> 「サプライ品」の判定: 商品が物販カテゴリ（`Category::GOODS_ID`）または予約物販カテゴリ（`Category::RESERVED_GOODS_ID`）に属するかを `EXISTS` で判定する（1:N JOIN による数量重複を避けるため EXISTS に分離）。
> 既存テスト `testExportByIdsTwoStockMoveTransfersPopulatesCsvColumns` は、2件選択時にヘッダ行＋2データ行が出力され各行の列数が `CSV_HEADER` と一致することを確認している（先頭BOMを除去して比較）。

### 出力対象データと並び順

`DtbStockMoveTransferRepository::getReturnListExportRows($ids)` が生SQLで取得する。

- 主テーブル: `dtb_stock_move_transfer_detail`（明細）→ `dtb_stock_move_transfer`（ヘッダ）→ 入庫先在庫 `dtb_product_stock`（`move_to_product_stock_id`）→ `dtb_product_class` → `dtb_product`。閾値は入庫先店舗 `dtb_base_info`（`move_to_base_info_id`）の `expensive_threshold1〜3` を参照する。
- 集計: 商品規格（`pc.id`）単位で `move_transfer_quantity` を `SUM` する（`GROUP BY`）。
- 時刻: 取得前に接続セッションで `SET TIME ZONE 'Asia/Tokyo'` を実行する。
- 並び順（基本設計の並び順をSQL `ORDER BY` で実装）:
  1. ピッキング区分（円未満→円以上〜円未満→円以上→サプライ。サプライは最後）
  2. 棚番（本店のみ `dtb_shelf_number.sort_no` 昇順。支店は一律0で棚番ソートを行わない）
  3. 言語（`mtb_language.id` 昇順＝日→英→他言語）
  4. 状態（`mtb_card_condition.id` 昇順＝NM→HP）
  5. Foilフラグ（非Foil→Foil）
  6. 略称タグ（`mtb_storage_code.rank` 昇順）
  7. レアリティ（`mtb_rarity.sort_no` 昇順＝M→C）
  8. 色（`mtb_color_sequence.sort_no` 昇順）
  9. カード（略称タグが `alphabet_sort_flg=true` なら英語カード名 `mtb_card.name_en` 昇順、false ならコレクター番号 `mtb_card_detail.card_no` 昇順）

### プロセスフロー

1. `POST .../return_list_csv_export` を受信。`set_time_limit(0)`、CSRFトークン検証（`isTokenValid()`）。
2. 共通バリデーション `validateReturnListExportRequest()` を実行。
   - `ids[]` を整数化・空要素除去。空なら `admin.stock.move_transfer.return_list_csv_export.no_selection`（「1つ以上の在庫移動情報を選択してください。」）をエラー表示し一覧へリダイレクト。
   - `StockMoveTransferReturnListCsvExportService::validateReturnListExportIds($ids, $Member)` で対象を検証（後述）。エラーがあれば各メッセージを表示し一覧へリダイレクト。
3. 検証通過後、`exportByIds($ids)` を呼ぶ。`getReturnListExportRows($ids)` の行を `RestockListCsvRowFormatter::iterateFormattedRows()` で整形しながらストリーム出力（ヘッダ行→データ行）。
4. `StreamedResponse`（CSVダウンロード）を返し、完了ログを記録する。

### 出力前バリデーション（`validateReturnListExportIds`）

入庫先店舗・ステータス（`getMoveToBaseInfoAndStatusByIds`）を取得して以下を判定する。エラーは複数まとめて返す。

| 条件 | エラーメッセージ |
|------|------------------|
| 対象データが1件も見つからない | `対象のデータが見つかりません。` |
| 指定IDが存在しない | `ID: {id} は存在しません。` |
| 入庫先店舗が未設定（`MoveToBaseInfo` が null） | `ID: {id} は入庫先店舗が設定されていません。` |
| 入庫先店舗がログインメンバーの担当店舗（`MemberBaseInfo`）に無い | `ID: {id} は権限のない店舗のデータです。` |
| ステータスが許可対象外 | `ID: {id} は対象外のステータスです。` |
| 複数店舗の入庫先が混在 | `複数店舗の在庫移動・振替情報を同時に処理することはできません。` |

許可ステータス（`ALLOWED_STATUS_IDS`、出庫承認済み以降）: 出庫承認済み（`STATUS_OUTBOUND_APPROVED=4`）／移動中（`STATUS_MOVING=5`）／入庫承認待ち（`STATUS_INBOUND_APPROVAL_PENDING=6`）／入庫承認済み（`STATUS_INBOUND_APPROVED=7`）。新規（1）・差戻し（3）等は対象外。

> 既存テスト（`StockMoveTransferReturnListCsvExportServiceTest`）が各分岐を網羅: 存在しないIDのみ→「対象のデータが見つかりません。」のみ、存在しないID＋対象外ステータス混在、権限の無い入庫先、入庫先未設定、複数店舗混在、許可ステータス＋同一店舗＋権限ありの2件は空配列。

### 分岐・遷移・例外

- **選択無し / 検証NG**: CSVを返さず `admin_stock_move_transfer_page`（セッションのページ番号）へリダイレクト（302）。Web テスト `testExportReturnListCsvWithNoSelectionRedirectsToIndex` / `...WithValidationErrorsRedirectsToIndex` / `...DoesNotExport` が確認。
- **検証OK**: `exportByIds` の `StreamedResponse` をそのまま返す（HTTP 200・`application/octet-stream`・添付ファイル名付き）。Web テスト `testExportReturnListCsvReturnsStreamedResponseFromExporter` が確認。
- **CSRF不正**: `isTokenValid()` により無効トークンは例外。
- **対象なし**: バリデーションで「対象のデータが見つかりません。」として扱い、出力は行わない。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 戻しリストCSVは**参照のみ**で業務データを更新しない（選択IDから集計してCSVを生成するだけ）。 |
| 参照テーブル | `dtb_stock_move_transfer`（ヘッダ）／`dtb_stock_move_transfer_detail`（明細）／入庫先在庫 `dtb_product_stock`（`move_to_product_stock_id`）／`dtb_product_class`・`dtb_product`／入庫先店舗 `dtb_base_info`（`expensive_threshold1〜3`）／`mtb_shelf_number`（棚番）・`mtb_storage_code`（略称タグ）・`mtb_language`・`mtb_card_condition`・`mtb_card_detail`・`mtb_rarity`・`mtb_card`・`mtb_color`・`mtb_color_sequence`。 |
| ログ | 出力完了時にアプリケーションログ（`log_info`）を記録するのみ。CSV取込履歴・在庫履歴は更新しない。 |

### 関連設計への接続点

- CSV列・整形・閾値・並び順の業務要件は参照元Excel設計書（在庫移動戻しリストCSV出力シート）を正とする。
- URLエンドポイント・出力列・整形ロジック・並び順・DBカラムは `../ec-cube-enterprise` の `StockMoveTransferController` / `StockMoveTransferReturnListCsvExportService` / `RestockListCsvRowFormatter` / `DtbStockMoveTransferRepository` 実装を正とする。
- 戻しリストPDF出力（M04-34）は本CSVと同一の取得・整形ロジック（`getReturnListExportRows` / `RestockListCsvRowFormatter`）を共用する。出力対象選択・バリデーションも共通メソッドを用いる。
