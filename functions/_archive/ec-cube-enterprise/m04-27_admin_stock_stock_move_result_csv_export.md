# m04-27_admin_stock_stock_move_result_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動実績入力用CSV出力

### CSV出力仕様

| 観点 | 内容 |
|------|------|
| 出力列（ヘッダー） | `移動指示ID` / `出庫元店舗(名称)` / `入庫先店舗(名称)` / `送り状No.` の4列固定。 |
| データ行 | 出力しない（ヘッダー1行のみ）。利用者が記入する雛形。 |
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`）。`UTF-8` 設定時のみ先頭にBOM（`\xEF\xBB\xBF`）を付与し、Excelでの文字化けを防ぐ。 |
| 区切り文字 | `eccube_csv_export_separator`（既定 `,`）。 |
| ファイル名 | `stock_move_instruction_record_template_{YmdHis}.csv`（`{YmdHis}` は出力時刻）。 |
| Content-Type | `text/csv; charset=...`（`SJIS-win` のときは `windows-31j`、それ以外は設定値）。 |
| Content-Disposition | `attachment; filename=...`（ダウンロード）。 |

各列の記入要領（画面のCSVフォーマット説明 `admin.stock.move_instruction.csv_format_*`）:

| 列 | 記入内容 |
|----|----------|
| 移動指示ID | 移動指示リストのIDを記入（取込時の照合キー）。 |
| 出庫元店舗(名称) | 出庫元店舗の名称を記入（取込時に指示の出庫元店舗名と照合）。 |
| 入庫先店舗(名称) | 入庫先店舗の名称を記入（取込時に指示の入庫先店舗名と照合）。 |
| 送り状No. | 送り状No.を入力。複数ある場合はカンマ（,）区切り（スペース不要）。 |

### プロセスフロー

1. 在庫移動指示一覧画面でダウンロードリンク（`admin.stock.move_instruction.csv_download_record`）を押下し、本ルートをGETする。
2. `set_time_limit(0)` 後、`StreamedResponse` のコールバックで `php://output` を開く。
3. 文字コードが `UTF-8` の場合はBOMを書き込む。
4. 4列のヘッダー名を出力エンコーディングへ変換し、`fputcsv` で1行出力してクローズする。
5. Content-Type / Content-Disposition を設定し、雛形CSVをダウンロードさせる。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照・更新なし**。雛形（ヘッダーのみ）を生成して返すだけで、DBは読み書きしない。 |
| 履歴・ログ | 本機能では取込履歴・在庫履歴等は作成しない。 |

### 例外処理

- 本機能は固定ヘッダーの雛形出力であり、入力値・対象データに依存しないため、通常のダウンロードで失敗する分岐は実装上存在しない（既存テスト `testCsvTemplateDownloadSuccess` で 200・`text/csv`・`attachment`・ファイル名プレフィックス `stock_move_instruction_record_template` を確認）。
- 一時ディレクトリ等のインフラ起因の失敗は共通のWebサーバ/PHP例外として扱う。

### 関連設計への接続点

- 出力列は取込側ハンドラ `StockMoveInstructionCsvImportHandler` の必須ヘッダー（`移動指示ID`/`出庫元店舗(名称)`/`入庫先店舗(名称)`/`送り状No.`）と一致する。記入後CSVの取込・反映仕様は M04-29 を正とする。
- 送り状（ゆうプリR）用CSVは別機能（M04-28 送り状CSV出力、`StockMoveInstructionLabelCsvExporterService`）であり、列構成・対象・出力契機が異なる。
- 永続化先テーブルは在庫移動指示（`dtb_stock_move_instruction`）。本機能では参照しないが、取込時の照合キー（移動指示ID・店舗名）はこのテーブルおよび店舗（`BaseInfo`）に対応する。
