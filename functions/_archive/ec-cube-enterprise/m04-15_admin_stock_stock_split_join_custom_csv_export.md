# m04-15_admin_stock_stock_split_join_custom_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫分割結合情報カスタムCSV出力

### 実装状況（重要・実装要確認）

`../ec-cube-enterprise` を確認した時点では、**在庫分割結合専用のカスタムCSV出力ルート・サービスは未実装**である。確認した事実は以下のとおり。

- `StockSplitJoinController` には `csv-export`（固定列。M04-14）はあるが、フォーマットIDを受け取る `custom-csv` 系ルートは存在しない。
- `StockSplitJoinCsvExportService` は固定12列（`CSV_HEADER`）で出力し、`dtb_csv` のフォーマット選択を適用する分岐を持たない。
- 一方でCSV種別マスタ `Master\CsvType` には `CSV_TYPE_STOCK_SPLIT = 12` が定義されており、在庫分割結合向けのカスタムCSV枠は用意されている。
- 在庫一覧側には `StockListController::stockListCustomCsv`（`admin_stock_list_custom_csv`、`/custom-csv/{csvExtensionId}`）というカスタムCSVの実装があり、在庫分割結合に同等機能を追加する際の参照実装となる。

したがって本書の出力フォーマット適用・選択フローは、Excel設計（要件）を正とし、実装は在庫一覧のカスタムCSV方式に倣う前提で記述する。最終的なエンドポイント・出力列のカスタム適用は ec-cube-enterprise 実装で要確認。

### 想定プロセスフロー（Excel要件 + 在庫一覧方式に倣う）

1. 一覧画面でカスタムCSV出力リンクを押下し、保存済みフォーマット名（または「出力項目設定」）を表示する。
2. フォーマット名を選択すると、対応する `csvExtensionId`（`CSV_TYPE_STOCK_SPLIT` のCSV設定）で出力ルートを呼び出す。
3. セッションの検索条件で在庫分割結合データを取得する（M04-14と同じ対象データ）。
4. カスタムCSV設定の選択列・並びに従って列を組み替えて出力する。

### 出力項目（カスタム対象の母集合）

カスタムCSVで選択可能な列の母集合は、固定出力（M04-14）の12列を基準とする想定。

| # | 項目（M04-14基準） |
|---|--------------------|
| 1〜12 | ID／タイプ／店舗／在庫区分／分割元・結合先商品名／分割元・結合先点数／分割元・結合先基準価格合計／分割先・結合元点数／分割先・結合元基準価格合計／ステータス／登録日時／登録者 |

選択可能列の最終的な定義（追加列の有無、表示名）は ec-cube-enterprise のカスタムCSV設定（`dtb_csv`・CSV種別 `CSV_TYPE_STOCK_SPLIT`）実装で要確認。

### 分岐・例外（実装時の想定）

- **フォーマット不正/不存在**: 在庫一覧方式に倣い、`csvExtensionId` が存在しない／在庫分割結合種別（`CSV_TYPE_STOCK_SPLIT`）でない場合は404とする想定（実装要確認）。
- **0件**: 固定出力（M04-14）と同様にヘッダ行のみを出力する想定。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。`dtb_stock_split_join` / `dtb_stock_split_join_detail` を参照し出力するのみ。 |
| カスタムCSV設定 | 出力列の選択・並びはカスタムCSV共通設定（`dtb_csv`、CSV種別 `CSV_TYPE_STOCK_SPLIT=12`）に従う。 |

### 関連設計への接続点

- 出力項目変更・選択フローの業務定義は参照元Excel設計書（在庫分割結合情報CSV出力シート、識別ID 1-6「在庫情報カスタムCSV出力」）を正とする。
- 固定列の在庫分割結合CSVはM04-14、検索条件はM04-12を参照。
- 実装方式は在庫一覧カスタムCSV（`StockListController::stockListCustomCsv` / `admin_stock_list_custom_csv`）を参照実装とする。
