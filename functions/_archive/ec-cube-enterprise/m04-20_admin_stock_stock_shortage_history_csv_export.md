# m04-20_admin_stock_stock_shortage_history_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 欠品履歴CSV出力

### 起動方法（入力）

- 入口は POST のみ。出力対象は**在庫履歴ID配列** `ids[]`（`dtb_stock_history.id`）。一覧画面のCSV出力フォームには検索結果全件分の `ids[]` が hidden で自動設定されて送信される（行のチェック選択UIは無い。`history.twig:595-608`、`PaginationAll`）。
- コントローラは `ids` を `intval` 変換し、0以下を除外して有効なIDのみ採用する（`array_filter(...) fn($id) => $id > 0`）。有効IDが0件の場合はエラー応答。
- 一覧側で「欠品検索」状態のときに表示・選択された行が対象となる前提（廃棄系の在庫変動区分に限定された一覧から選択される）。

### 出力対象データと表示順

- 対象データは `DtbStockHistoryRepository::getStockHistories($ids)` が取得する。`sh.id IN (:ids)` で選択IDの在庫履歴を取得し、`ProductStock`・`Member`・`ProductClass`・`Product`・`CardDetail` を結合する。
- 表示順（CSV行順）は以下の3段ソート。Excel M04-19の一覧ソート要件と一致する。
  1. 商品コード `pc.code` の降順（第一ソート）
  2. 店舗 `ps.baseInfo` の降順（第二ソート＝店舗IDの降順）
  3. 登録日時 `sh.createDate` の降順（第三ソート＝最新順）
- 本店・支店・スマレジの在庫はすべて EC-CUBE のDB（`dtb_stock_history` / `dtb_product_stock`）が保持するため、通常の検索で横断的に出力される。

### CSV出力列

`StockHistoryController::getStockHistoryDisposalCsvHeader()` で定義したヘッダ（表示名）をそのまま1行目に出力し、`StockHistoryDisposalCsv::convertExportCsvRows()` で各行を生成する。列は以下の15列・この順。

| # | 列名（ヘッダ） | 値の取得元 | 整形 |
|---|----------------|------------|------|
| 1 | 商品コード | `ProductClass::getCode()` | — |
| 2 | 商品名 | `Product::getName()` | — |
| 3 | 言語 | `ProductClass::getLanguageNameJp()` | 日本語名 |
| 4 | 状態 | `ProductClass::getCardCondition()->getCode()` | カード状態コード |
| 5 | Foil | （固定で空文字） | Foilマスタ未実装のため空（実装上 TODO） |
| 6 | 店舗 | `ProductStock::getBaseInfo()` | — |
| 7 | 在庫場所 | `ProductStock::getLocationName()` | EC-CUBE / スマレジ（`STOCK_LOCATION_*`） |
| 8 | 登録元 | `DtbStockHistory::getHistorySourceType()` | — |
| 9 | 欠品点数 | `DtbStockHistory::getStock()` | — |
| 10 | 欠品時販売価格 | `DtbStockHistory::getSellPrice()` | — |
| 11 | 欠品理由 | `DtbStockHistory::getStockChangeReason()` | — |
| 12 | 登録日 | `DtbStockHistory::getRegisteredAt()` | `Y-m-d H:i`（null時は空） |
| 13 | 登録者 | `DtbStockHistory::getRegisteredMember()` | — |
| 14 | 最終更新日 | `DtbStockHistory::getUpdateDate()` | `Y-m-d H:i`（null時は空） |
| 15 | 最終更新者 | `DtbStockHistory::getUpdateMember()` | — |

各行は `ProductStock`（`product_stock_id` から）→ `ProductClass` → `Product` を辿って商品情報を補完する。ヘッダのキー順に値を並べ、未設定値は空文字で出力する。

> **Excel設計書のCSV列（16列）を正とする。** 現状の実装（disposalヘッダ15列）はExcel設計と差異があり、以下は実装側の是正対象（テストはExcel期待値=16列で設計する）:
> - Excelは「7 在庫区分」を求めるが、実装は「在庫場所」列（`ProductStock::getLocationName()` の EC-CUBE / スマレジ）として出力している。列名・粒度をExcel（在庫区分：EC-CUBE在庫／スマレジ在庫）に合わせる必要がある。
> - Excelは「9 登録元ID」を求めるが、欠品履歴CSV（disposalヘッダ）には**登録元ID列が無い**（在庫履歴CSV側のヘッダには `登録元ID` が存在する）。Excel設計どおり列を追加する必要がある（実装側の欠落）。

### 文字コード・ファイル名・レスポンス

| 項目 | 値 |
|------|----|
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`）。各セルは `mb_convert_encoding($value, 設定エンコード, 'UTF-8')` で変換して出力する（`CsvExportService`）。 |
| Content-Type | `text/csv;charset=windows-31j`（`SJIS-win` の場合 `windows-31j` に読み替え。それ以外は設定値そのまま）。 |
| Content-Disposition | `attachment; filename=<ファイル名>`（ダウンロード）。 |
| ファイル名 | `stock_history_disposal_` + 出力時刻 `YmdHis` + `.csv`（例: `stock_history_disposal_20260612153000.csv`）。`AbstractCsvService::createFileName()` で生成。 |
| 出力方式 | `StreamedResponse`。コールバック内で `fopen()` → ヘッダ行 `fputcsv()` → 各行 `fputcsv()` → `fclose()`。出力前に `set_time_limit(0)` とSQLロガー無効化でメモリ・タイムアウト対策を行う。 |

ファイル名生成時に `log_info('欠品履歴CSV出力ファイル名', [$filename])` をアプリケーションログへ出力する。

### プロセスフロー

1. 欠品履歴一覧（`admin_stock_history`、欠品検索状態）でCSVダウンロードを実行（POST）。フォームに hidden で自動設定された検索結果全件分の `ids[]` を送信（行のチェック選択UIは無い）。
2. コントローラ `csvStockHistoryDispozalExport()` が `ids` を整数化し、0以下を除外。有効IDが0件なら `responseNoStockHistoryIdError()` でエラーリダイレクト（後述）。
3. `set_time_limit(0)`・SQLロガー無効化のうえ、`StockHistoryDisposalCsv` をヘッダ定義（`getStockHistoryDisposalCsvHeader()` / 必須ヘッダ `getRequiredStockHistoryCsvHeader()`）とともに生成。
4. `exportCsv($ids)` を実行。`getStockHistories($ids)` で対象在庫履歴を取得（前述のソート順）。
5. 取得0件の場合は `RuntimeException`（`admin.csv.error.export.not_registered_stock_history_id`）。`convertExportCsvRows()` 結果が0件の場合は `admin.csv.error.export.no_stock_history_data`。
6. 正常時は `StreamedResponse` を生成し、文字コード変換・ヘッダ設定のうえCSVをストリーム出力する。

### 分岐・遷移・例外

| 条件 | 挙動 |
|------|------|
| `ids` パラメータ無し / 空配列 / 0以下のみ（有効ID0件） | `responseNoStockHistoryIdError()`：`addError('eccube.admin.error', trans('admin.stock_history.not_select'))` を実行し、`admin_stock_history_page`（セッション `eccube.admin.stock_history.search.page_no` の現在ページ、既定1）へリダイレクト。※第2引数=namespace 誤用によりフラッシュは `eccube.admin.stock_history.not_select.error` バッグへ格納され、`alert.twig` が購読するバッグではないため画面には表示されないと推定（要実機確認。M04-20-MSG-002 参照）。 |
| 指定IDに該当する在庫履歴が存在しない / 変換結果が空 | `StockHistoryDisposalCsv::exportCsv()` が `RuntimeException` を送出。コントローラが `addError($e->getMessage(), 'admin')` でメッセージ表示し、リファラがあればリファラへ、無ければ `admin_stock_history` へリダイレクト。 |
| 正常 | `StreamedResponse`（HTTP 200、`text/csv`、`attachment`）を返す。 |

既存テスト `StockHistoryDisposalCsvControllerTest` で、ID無し・idsパラメータ無し・無効ID（0/-1/空）・存在しないID（999999）はいずれもリダイレクト、正常系（廃棄区分の履歴を `disposal_search=1` で検索して得たIDを送信）は HTTP 200・`text/csv`・`attachment` を返すことを確認済み。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）。 |
| 参照テーブル | `dtb_stock_history`（`DtbStockHistory`）。商品情報は `dtb_product_stock` → `dtb_product_class` → `dtb_product` を結合参照。区分は `mtb_stock_change_type` / `mtb_stock_change_type_detail`（欠品＝`MtbStockChangeType::DISPOSAL` 配下）。 |
| ログ | 出力ファイル名を `log_info` でアプリケーションログに記録する。 |

> 欠品理由の更新（`DtbStockHistoryRepository::updateDisposalReason`、`dtb_stock_history.stock_change_reason` / `update_member_id` / `update_date` を更新）は欠品履歴一覧側（`admin_stock_history_update`）の機能であり、本CSV出力では行わない。

### 関連設計への接続点

- 出力対象・出力列の業務要件は、参照元Excel設計書（欠品履歴CSV出力 M04-20、欠品履歴検索一覧 M04-19）を正とする。
- 出力列の永続化元・整形・文字コード・ファイル名・ソート順は `../ec-cube-enterprise` の `StockHistoryController` / `StockHistoryDisposalCsv` / `AbstractCsvService` / `CsvExportService` / `DtbStockHistoryRepository` / Entity 実装を正とする。
- 出力対象IDの供給元（一覧フォームが自動送信する検索結果全件分の `ids[]`）は欠品履歴検索一覧（M04-19）。一覧の「欠品検索」状態が前提となる。
