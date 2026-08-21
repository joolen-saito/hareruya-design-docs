# m04-04_admin_stock_stock_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫情報CSV出力

### CSV出力仕様

| 項目 | 内容 |
|------|------|
| 出力列数 | 19列（ヘッダ行 + データ行） |
| 文字コード | `CsvExportService` 経由で `eccube_csv_export_encoding`（既定 `SJIS-win`）に変換して出力。UTF-8設定時はBOM付与。 |
| 区切り | CSV（`fputcsv`） |
| ファイル名 | `stock_list_<YmdHis>.csv`（出力時刻） |
| MIME / 形式 | `Content-Type: application/octet-stream`、`Content-Disposition: attachment`、`StreamedResponse` でストリーム出力 |
| 対象データ | `StockListSearchAction::handle($input)` が組み立てる QueryBuilder の全件（`ProductStock` 単位、ページング無し）。在庫一覧と同じ検索条件・横断範囲（本店・支店・バックヤード・スマレジ）。 |
| 並び順 | 在庫一覧の検索クエリの並び（M04-01に従う） |

### 出力列（`StockListCsvExportService::CSV_HEADER`）

| # | CSVヘッダ | 取得元（実装） | Excel識別ID |
|---|-----------|----------------|-------------|
| 1 | 商品ID | `Product::getId()` | 1 |
| 2 | 商品名 | `Product::getName()` | 2 |
| 3 | 商品コード | `ProductClass::getCode()` | 3 |
| 4 | 店舗名 | `ProductStock` の `BaseInfo::getShopName()` | 5 |
| 5 | 在庫区分名 | `ProductStock::getLocationName()`（`EC-CUBE` / `スマレジ`） | 6 |
| 6 | 言語 | `ProductClass::getLanguageNameJp()` | 7 |
| 7 | 状態 | `ProductClass::getCardConditionNameJp()` | 8 |
| 8 | 基準価格 | `ProductClass::getStandardPrice()` | 10 |
| 9 | 販売価格 | `ProductClass::getPrice02()` | 11 |
| 10 | 買取価格 | `ProductClass::getBuyPrice()` | 12 |
| 11 | 在庫 | `ProductStock::getStock()`（null時は `0`） | 13 |
| 12 | 原価単価 | `ProductStock::getUnitCost()` | 14 |
| 13 | 総原価 | `ProductStock::getTotalCost()` | 15 |
| 14 | 当日販売数 | `DtbSalesQuantity::getSalesQuantity_01()` | 16 |
| 15 | 前日販売数 | `DtbSalesQuantity::getSalesQuantity_02()` | 17 |
| 16 | 3日間販売数 | `DtbSalesQuantity::getSalesQuantity_03()` | 18 |
| 17 | 1週間販売数 | `DtbSalesQuantity::getSalesQuantity_04()` | 19 |
| 18 | 1ヶ月間販売数 | `DtbSalesQuantity::getSalesQuantity_05()` | 20 |
| 19 | 90日間販売数 | `DtbSalesQuantity::getSalesQuantity_06()` | 21 |

販売数（14〜19列）は、出力対象 `ProductStock` の規格（`ProductClass`）と店舗（`BaseInfo`）をキーに `DtbSalesQuantity` を一括ロードして突き合わせる（キー `"productClassId_baseInfoId"`）。該当データが無い販売数列は空文字を出力する（既存テスト `testExportBySearchInputOutputsEmptySalesQuantityColumnsWhenNoSalesQuantity`）。Excel定義の19項目と実装の19列は一致する。

### プロセスフロー

1. `admin_stock_list_csv`（GET）を受信する。
2. セッション `admin.stock.list.search` を取得。空なら `admin.stock.list.search_required_for_csv` をエラー表示し `admin_stock_list` へリダイレクト。
3. `SearchStockListType` を生成し、`FormUtil::submitAndGetData()` でセッション値を再submit。例外時は `log_error` 出力・該当セッション破棄・`admin.stock.list.search_required_for_csv` エラー表示・`admin_stock_list` へリダイレクト。
4. `StockListSearchInput::fromFormData($form->getData())` を生成し、`StockListCsvExportService::exportBySearchInput($input)` を呼ぶ。
5. Service は `set_time_limit(0)`・SQLLogger無効化のうえ、`StockListSearchAction::handle($input)` の QueryBuilder で `ProductStock[]` を取得。
6. 対象規格IDで `DtbSalesQuantity` を一括ロードしマップ化。各 `ProductStock` を19列の行データへ整形。
7. `StreamedResponse` のコールバックでヘッダ行→各データ行を `fputcsv` し、`stock_list_<YmdHis>.csv` としてダウンロード。`log_info('在庫一覧CSV出力完了...')` を出力。

### 分岐・例外

- **検索未実行**: セッションに在庫一覧の検索条件が無い場合、`admin.stock.list.search_required_for_csv` をエラー表示して `admin_stock_list` へリダイレクト（CSVを出力しない）。
- **セッション不整合**: 保存済み条件が現行フォーム構造と不整合で `submitAndGetData` が例外を投げる場合、`log_error` のうえ当該セッションを破棄し、同メッセージを表示して在庫一覧へ戻す。
- **対象0件**: 検索条件に該当する `ProductStock` が無い場合はヘッダ行のみのCSVを出力する（既存テスト `testExportBySearchInputOutputsHeaderOnlyWhenNoMatchingProductStock`）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。在庫・販売数・価格を読み出してCSV化するのみで、業務データを更新しない。 |
| 在庫の取得元 | 店舗・在庫区分別の在庫は規格在庫 `dtb_product_stock`（`base_info_id`・`stock_location_id` 単位）の `stock`。規格本体は `dtb_product_class.stock`。 |
| 販売数の取得元 | `dtb_sales_quantity`（`ProductClass`・`BaseInfo` 単位の `sales_quantity_01`〜`06`）。 |
| ログ | アプリケーションログに出力完了（`log_info`）／セッション不整合（`log_error`）を記録。 |

### 関連設計への接続点

- 出力対象・検索条件は在庫検索一覧（M04-01）の検索条件をそのまま適用する。検索条件の項目・セッション保持・横断範囲はM04-01を正とする。
- 出力列の業務定義はExcel設計書（在庫情報CSV出力シート）を正とし、取得元カラム・整形・ファイル名・文字コードは `StockListCsvExportService` / `CsvExportService` を正とする。
