# m04-29_admin_stock_stock_move_result_csv_import — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動実績 インポート

### 取込CSV仕様（必須ヘッダ・列定義）

ヘッダーは0行目（1行目）に必須。BOM付きUTF-8の先頭BOMは除去し、列数がヘッダーと不一致の行はパディング／切り詰めしてヘッダー順に整列する（`StockMoveInstructionCsvImportService`）。

| 列ヘッダー | 必須 | 変換／検証 | 用途 |
|------------|------|-----------|------|
| `移動指示ID` | ○ | 整数変換（`IntConverter`）＋数値チェック（`NumericValidator`） | 取込先の在庫移動指示を特定する照合キー |
| `出庫元店舗(名称)` | − | − | 値があれば指示の出庫元店舗名と照合（不一致はエラー） |
| `入庫先店舗(名称)` | − | − | 値があれば指示の入庫先店舗名と照合（不一致はエラー） |
| `送り状No.` | ○ | 必須チェック（`RequiredValidator`） | 登録する送り状No.（空はエラー） |

区切り文字は `eccube_csv_import_delimiter`（拡張子 `tsv` のときはタブ）、囲み文字は `eccube_csv_import_enclosure`。データ行0件（ヘッダーのみ）はヘッダー検証上はエラーとしない（後述のとおり結果として「有効な行がありません」となる）。

### 取込手順（プロセスフロー）

1. Controller でCSRFトークン（`isTokenValid()`）を検証し、`csv_file`（`UploadedFile`）の存在・`isValid()` を確認する。不正なら `csv_tracking_file_invalid`（「ファイルが不正です。」）を表示して一覧へリダイレクト。
2. `StockMoveInstructionCsvUploadAction::handle()` が `StockMoveInstructionCsvImporter`（＋`StockMoveInstructionCsvImportHandler`）を生成し `import()` を実行。
3. ヘッダー行（0行目）を読み取り。ヘッダーが取得できなければヘッダーフォーマットエラーを返す。
4. 各データ行について `onValidateRow` で検証 → `onReadRow` で取込。
   - 行の列数が定義列数と不一致なら列数不正エラーで当該行スキップ。
   - 各列の存在・個別バリデーション（移動指示ID＝数値必須、送り状No.＝必須）を満たさなければ当該行スキップ。
5. `onReadRow`（取込本体）:
   1. 移動指示ID ≤ 0、または該当指示が存在しない → `…csv_tracking_error_instruction_not_found`（「移動指示が見つかりません」）を当該行番号付きで記録し、この行は失敗。
   2. `出庫元店舗(名称)` に値があり指示の出庫元店舗名と不一致 → `…csv_tracking_error_shop_mismatch_from`（「出庫元店舗が一致しません」）で失敗。
   3. `入庫先店舗(名称)` に値があり指示の入庫先店舗名と不一致 → `…csv_tracking_error_shop_mismatch_to`（「入庫先店舗が一致しません」）で失敗。
   4. 送り状No.がtrim後に空 → `…csv_tracking_error_tracking_no_empty`（「送り状Noが空欄です」）で失敗。
   5. すべて通過したら、指示に送り状No.・更新日時・更新者を設定し、紐づく全 `DtbStockMoveTransfer`（`moveInstructionId` 一致、`id ASC`）の `tracking_no` にも同値を設定する（上書き）。
6. 取込結果（成功件数・エラーメッセージ一覧）を Controller へ返す。

### 結果メッセージ・エラー行／不正行の扱い

- 行単位の個別エラーは収集して継続する（`breakAll()` ではなく `skipRow()`／失敗行は行番号付きメッセージを蓄積）。1ファイル内で正常行のみ反映し、不正行はスキップする。
- Controller での集約:
  - 取込結果のエラーは各行ごとに `addError()` で表示。
  - 成功件数 > 0 のとき `csv_tracking_success`（「送り状No.を一括登録しました。」）を表示。
  - 成功件数 = 0 かつエラー0件（ヘッダーのみ等）のとき `csv_tracking_no_valid_rows`（「有効な行がありません。」）を表示。
- 例外（`import()` が `\Throwable` をスロー）時はログ出力（`log_error`）のうえ、メッセージ別に振り分け:
  - `RuntimeException` でメッセージが `…csv_tracking_header_invalid` → 「CSVのヘッダーが不正です。」
  - 同 `…csv_tracking_file_invalid` → 「ファイルが不正です。」
  - 同 `…csv_tracking_temp_dir_invalid` → 一時ディレクトリ設定（`eccube_csv_temp_realdir`）確認を促すメッセージ
  - それ以外（空メッセージ含む）／`RuntimeException` 以外の `Throwable` → `csv_tracking_upload_error_detail`（「アップロードに失敗しました。詳細：%detail%」）に例外メッセージ（無ければクラス名）を埋め込み表示。
- いずれの場合も最後に一覧へリダイレクト（POSTのクエリを引き継ぎ `resume=1` を付与）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **更新系**。正常行ごとに在庫移動指示（`dtb_stock_move_instruction`）の `tracking_no`・`update_date`・更新者（`update_member`）を更新し、紐づく在庫移動・振替（`dtb_stock_move_transfer`）の `tracking_no` を上書きする。既登録の送り状No.も上書きされる。 |
| 更新しないもの | 在庫数（`ProductStock` 等）・移動ステータス（`MtbStockMoveTransferStatus`）はこの取込では更新しない。 |
| 履歴・ログ | 取込実行者は `CsvImporter` 基盤にログインメンバーとして渡る。出力ログは `log_error`（例外時）。CSV取込履歴テーブル（`dtb_csv_import_history`。取込実行者列 `member_id`）への本機能固有の記録有無は実装要確認。 |

### 例外処理

- **ファイル未送信／不正**: `csv_file` が `UploadedFile` でない・`isValid()` false → `csv_tracking_file_invalid` を表示してリダイレクト（既存テスト `testCsvTrackingUploadNoFile` / `testCsvTrackingUploadInvalidFile`）。
- **存在しない移動指示**: 行の移動指示IDが0以下／DB未存在 → 当該行を「移動指示が見つかりません」で失敗（既存テスト `testCsvTrackingUploadWithResultErrors` で ID=999999 行のエラー＆リダイレクトを確認）。
- **店舗名不一致**: 出庫元／入庫先の店舗名が指示と不一致なら当該行失敗。
- **送り状No.空**: trim後空なら当該行失敗。
- **有効行0件**: ヘッダーのみ等で成功0・エラー0なら `csv_tracking_no_valid_rows`（既存テスト `testCsvTrackingUploadEmptyCsvNoValidRows`）。
- **取込基盤の例外**: ヘッダー不正・一時ディレクトリ不正・その他例外を Controller で振り分け表示（既存テスト `testCsvTrackingUploadThrowsRuntimeException*` 各種・`testCsvTrackingUploadThrowsOtherThrowable`）。
- 正常取込は既存テスト `testCsvTrackingUploadSuccess` で、移動指示の `tracking_no` がCSV値に更新されることを確認。

### 関連設計への接続点

- 取込対象CSVの列は、在庫移動実績入力用CSV雛形（M04-27、`admin_stock_move_instruction_csv_download_record`）の出力列と一致する。雛形に記入して本機能で取り込む運用。
- 送り状No.は在庫移動指示詳細（M04-25）画面・送り状No.単体登録（`admin_stock_move_instruction_register_tracking`）でも登録でき、本取込はその一括版。送り状No.登録後の移動指示は削除不可（`StockMoveInstructionDeleteException`）。
- 反映先は在庫移動指示（`dtb_stock_move_instruction`）と在庫移動・振替（`dtb_stock_move_transfer`）の `tracking_no`。
