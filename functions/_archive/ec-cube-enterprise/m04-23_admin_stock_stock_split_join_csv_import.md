# m04-23_admin_stock_stock_split_join_csv_import — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫分割結合CSV登録

### アップロードフォーム項目

| フォーム | block prefix / CSRFトークンID | 項目（フォームキー） |
|----------|-------------------------------|----------------------|
| 分割 | `admin_stock_split_csv_upload` | 店舗 `store`（必須セレクト）／在庫区分 `inventory_category`（必須ラジオ：EC-CUBE在庫=1／スマレジ在庫=2）／承認通知先所属 `approval_department`（任意・unmapped）／承認通知先メンバー `approval_notification_target_members`（複数。`approval_notification_required=true` 時は必須）／アップロードファイル `import_file`（必須。MIME `text/csv`・`text/plain`・`application/csv`） |
| 結合 | `admin_stock_join_csv_upload` | 店舗 `store`／在庫区分 `inventory_category`（EC-CUBE在庫=1／スマレジ在庫=2）／アップロードファイル `import_file`（必須）。承認通知先メンバー項目は持たない。 |

### CSV必須ヘッダ（雛形・取込）

| 種別 | 必須ヘッダ（実装値・順序） | 列数 |
|------|----------------------------|------|
| 分割 | `分割元商品コード`／`分割数`／`分割先商品コード`／`分割先在庫数` | 4列 |
| 結合 | `結合先商品コード`／`結合数量`／`結合元商品コード`／`結合元在庫区分`／`結合元数量` | 5列 |

> CSVヘッダ表記はExcel設計の「結合数」「結合元在庫数」を正とする。現状の実装（雛形 `admin_stock_*_csv_template` と取込ハンドラ）は `結合数量`・`結合元数量` を用いており表記がExcelと異なるため、**実装側の是正対象**（Excel表記に合わせたCSVが取り込めるようヘッダ定義の修正が必要。テスト／取込CSVはExcel表記を期待値とする）。

### コントローラ前段の検証順序（分割／結合 共通）

1. CSRFトークン検証（分割 `admin_stock_split_csv_upload` ／結合 `admin_stock_join_csv_upload`）。不正は `admin.common.csrf_invalid` を表示し一覧へリダイレクト。
2. アップロードファイルの存在・妥当性（`UploadedFile::isValid`）。不正は `admin.common.csv_upload_error` を表示しリダイレクト。
3. 店舗の解決（`store` が正なら `BaseInfo` を `find`、未指定は既定 `BaseInfo` を取得）。解決不可は `admin.common.csv_upload_error`。
4. 在庫区分の検証。分割は `inventory_category ∈ {1,2}` のみ許可。結合は `inventory_category ≥ 1` を要求（CSV行内の `結合元在庫区分` から結合元ロケーションを別途解決）。不正は `admin.common.csv_upload_error`。
5. ログインメンバーの確認。未ログインは `admin.stock.split.login_required`。
6. ハンドラ＋`CsvImporter` を構築して `import()` を実行。例外時は `log_error`＋`admin.common.csv_import_error` を表示しリダイレクト。
7. 取込結果のエラー（行エラー・業務エラー）を `addError`、成功メッセージを `addSuccess` で表示。
8. 取込成功時のみ、選択された承認通知先メンバーに承認アラートメール（`MailService::sendStockApprovalAlertMail`）を送信。
9. 完了イベント（分割 `ADMIN_STOCK_SPLIT_JOIN_LIST_SPLIT_CSV_IMPORT_COMPLETE`／結合 `ADMIN_STOCK_SPLIT_JOIN_LIST_JOIN_CSV_IMPORT_COMPLETE`）を発火し、一覧へリダイレクト。

### 取込処理（ハンドラ）の挙動

`StockSplitListCsvImportHandler` / `StockJoinListCsvImportHandler` が `CsvImporter` のライフサイクルで動作する。**ファイル全体を1トランザクションで処理し、1件でもエラーがあれば全件ロールバックする。**

| フェーズ | 内容 |
|----------|------|
| onBeforeImport | トランザクション開始・状態初期化。 |
| onValidateRow（形式検証） | 行ごとに検証。登録上限 `MAX_ROWS=2000` を超えたら以降を中断（`breakAll`）。列数不一致（分割4列／結合5列でない）はその行をスキップしエラー。必須ヘッダ欠落は中断しエラー。各フィールドの空・数値・正数チェック（分割：分割数>0、分割先在庫数≥1。結合：結合数量>0、結合元数量≥1）。不正行は `skipRow` してエラー記録。 |
| onReadRow | 有効行をバッファに蓄積。 |
| onAfterImport（業務登録） | エラー有り・空・未成功なら即ロールバック。正常時はグループ化して登録。 |

#### 分割の登録単位・業務検証（onAfterImport）

- 分割元商品コード＋分割数でグループ化。
- 分割元 `ProductStock` を「商品コード×店舗×在庫区分（`inventory_category`）」で解決。見つからなければエラー。
- 各分割先 `ProductStock` を同条件で解決。見つからない／分割元と同一在庫はエラー。同一分割先は数量を合算。
- `StockSplitRegisterInput` →`StockSplitRegisterAction::handle()` で分割登録（`errorMessage` 返却時はエラー）。
- 続けて `StockSplitApplyApprovalInput`→`StockSplitApplyApprovalAction::handle()` で承認申請（ステータス＝分割承認待ち）。
- 全グループ成功時のみ commit し、`admin.stock.split_join.list_csv_split_import_done`（成功件数）を成功表示。

#### 結合の登録単位・業務検証（onAfterImport）

- 結合先商品コード＋結合数量でグループ化。
- 結合先 `ProductStock` を「商品コード×店舗×在庫区分（`inventory_category`）」で解決。見つからなければエラー。
- 結合元 `ProductStock` を、CSV行の `結合元在庫区分`（`1`/`EC-CUBE`/`自社` ほか→EC-CUBE、`2`/`スマレジ` ほか→スマレジに正規化）から解決。区分不正・不存在・結合先と同一はエラー。
- `StockJoinRegisterInput`→`StockJoinRegisterAction::handle()` で結合登録（ステータス＝結合元登録）。
- 続けて `StockJoinMoveToShortageEntryAction::handle()` で欠品入力へ遷移（`StockJoinMoveToShortageValidationException` はエラー）。
- 全グループ成功時のみ commit し、`admin.stock.split_join.list_csv_join_import_done`（成功件数）を成功表示。

### エラー行・不正行・エラー時の挙動

- 行単位の形式エラー（列数・空・数値不正）と業務エラー（コード未解決・在庫不足・同一在庫等）は、いずれも一覧画面上部のエラー表示エリアに `addError` で表示する。
- **部分コミットはしない**: 形式エラー・業務エラーのどちらか1件でもあれば全件ロールバックし、登録は一切確定しない。
- エラー発生時、モーダルの選択内容はリセットされ、一覧の検索条件・状態は維持される（基本設計の要件。リダイレクト後の一覧で再描画）。
- 登録上限 `2,000件` 超過は中断しエラー（基本設計の上限。最終値は性能試験で確定）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 在庫分割結合 `dtb_stock_split_join`（タイプ・基準価格・原価単価・総原価・在庫数・分割結合数・ステータス等）と明細 `dtb_stock_split_join_detail`（基準価格・原価単価・在庫数・欠品点数等）を登録する。 |
| ステータス | 分割＝分割承認待ち（`SPLIT_APPROVAL_WAITING=3`）、結合＝結合元登録（`JOIN_SOURCE_REGISTERED=2`）へ。ステータス履歴は `dtb_stock_split_join_status_history`。 |
| 在庫 | 各Actionにより分割元/結合元の在庫が分割数/結合元数量分の確保・更新を受ける（M04-13の登録ロジック）。 |
| 取込履歴 | 本取込ルートの `CsvImporter` は `dtb_csv_import_history` への記録処理を持たない（実装確認値。取込履歴を残す場合は要追加・実装要確認）。 |
| 通知 | 取込成功時、承認通知先メンバーへ承認アラートメールを送信。 |

### 関連設計への接続点

- CSV列・モーダル項目・権限制御の業務定義は参照元Excel設計書（在庫分割CSV登録／在庫結合CSV登録シート）および M11-03（権限制御）を正とする。
- 必須ヘッダ・バリデーション・処理順序・トランザクションは `../ec-cube-enterprise` の各取込ハンドラ・Action実装を正とする。
- 登録/承認ロジックはM04-13、一覧はM04-12を参照。
