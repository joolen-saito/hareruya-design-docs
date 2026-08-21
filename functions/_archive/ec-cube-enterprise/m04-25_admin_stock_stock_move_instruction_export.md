# m04-25_admin_stock_stock_move_instruction_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動指示リストエクスポート

### 送り状CSV（`StockMoveInstructionLabelCsvExporterService`）

選択した指示IDを `DtbStockMoveInstructionRepository::findByIdsForLabelExport($ids)` で取得（`MoveFromBaseInfo`・`MoveToBaseInfo` と各 `Pref` をJOIN、`id ASC`）し、1指示=1行で出力する。

| 観点 | 内容 |
|------|------|
| 出力サービス | `CsvExportService`（`fopen`/`fputcsv`/`fclose`）。文字コードは `eccube_csv_export_encoding`（既定 `SJIS-win`、UTF-8時はBOM付与）、区切りは `eccube_csv_export_separator`。 |
| ファイル名 | `stock_move_instruction_labels_YmdHis.csv`。 |
| Content-Type | `application/octet-stream`、`Content-Disposition: attachment`。 |
| ログ | 出力完了時 `log_info`「在庫移動指示 送り状CSV出力完了. ファイル名: …」。 |

出力列（ヘッダ23列。出庫元店舗=注文者、入庫先店舗=配送先にマッピング）:

| 列 | 値（`buildRow`） |
|----|------------------|
| 注文番号 | 移動指示ID |
| 注文金額合計 | `standard_total_price`（基準価格合計） |
| 注文者氏名 | 出庫元 会社名＋半角空白＋店名（`company_name`/`shop_name`） |
| 注文者カナ | 出庫元 会社名カナ＋半角空白＋店名カナ |
| 注文者郵便番号 | 出庫元 `postal_code` |
| 注文者都道府県 | 出庫元 `Pref.name` |
| 注文者住所 / 住所2 | 出庫元 `addr01` / `addr02` |
| 注文者電話番号 | 出庫元 `phone_number` |
| 商品金額合計 | `standard_total_price`（基準価格合計） |
| 送料 / 送料(税抜) / 手数料 / 手数料(税抜) | いずれも `0` 固定 |
| 配送先氏名 | 入庫先 会社名＋半角空白＋店名 |
| 配送先カナ | 入庫先 会社名カナ＋半角空白＋店名カナ |
| 配送先郵便番号 | 入庫先 `postal_code` |
| 配送先都道府県 | 入庫先 `Pref.name` |
| 配送先住所 / 住所2 | 入庫先 `addr01` / `addr02` |
| 配送先電話番号 | 入庫先 `phone_number` |
| 郵便種別 | `0` 固定（0：ゆうパック） |
| 発送方法 | `ゆうパック` 固定 |

氏名/カナは会社名と店名を `trim` し、両方あれば半角空白1つで連結、片方のみならその値、両方空なら空文字（`joinWithHalfWidthSpace`）。

### 在庫移動実績入力用CSV雛形（`csvTemplateDownload`）

| 観点 | 内容 |
|------|------|
| 出力列（ヘッダのみ） | `移動指示ID` / `出庫元店舗(名称)` / `入庫先店舗(名称)` / `送り状No.` |
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`）。UTF-8時のみBOM（`\xEF\xBB\xBF`）を出力。各列値を `mb_convert_encoding(値, encoding, 'UTF-8')`。 |
| 区切り | `eccube_csv_export_separator`（既定 `,`）。 |
| ファイル名 | `stock_move_instruction_record_template_YmdHis.csv`。 |
| Content-Type | `text/csv; charset=...`（SJIS-win時は `windows-31j`）、`Content-Disposition: attachment`。 |

この雛形のヘッダはM04-24のCSV取込（`StockMoveInstructionCsvImportHandler`）が要求する4列と一致する。

### プロセスフロー

1. 一覧でチェックボックス（`ids[]`）を選択し送り状CSV出力ボタンを押下（JSが非表示フォームにIDを詰めてPOST）、または雛形ダウンロードリンクを押下。
2. 送り状CSV: CSRF検証 → `ids` 空なら404 → `exportByInstructionIds($ids)` で対象指示と関連店舗を取得 → ヘッダ＋各行をストリーム出力。
3. 雛形: 列ヘッダのみをストリーム出力。

### 分岐・例外

- **送り状CSVでID無し**: `ids` が空配列/未指定 → `NotFoundHttpException`（404）。
- **対象なし**: `findByIdsForLabelExport` が空（該当指示なし）→ ヘッダのみのCSV（明示エラーなし）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 在庫移動指示 `dtb_stock_move_instruction` と関連店舗 `BaseInfo`（出庫元/入庫先・`Pref`）を**参照のみ**。出力により業務データは更新しない。 |
| ログ | 送り状CSV出力完了を `log_info` に記録。 |

### 関連設計への接続点

- 出力項目の業務要件は参照元Excel設計書（在庫移動指示詳細シート）を正とする。なおExcel設計が描く「総販売価格/総移動原価/高額・通常別合計」のラベルは在庫移動指示詳細（M04-24）の表示項目であり、本送り状CSVは配送ラベル用途の別フォーマットである。
- URLエンドポイント・出力列・DBカラムは `../ec-cube-enterprise` の `StockMoveInstructionLabelCsvExporterService` / `csvTemplateDownload` / `DtbStockMoveInstructionRepository::findByIdsForLabelExport` 実装を正とする。
