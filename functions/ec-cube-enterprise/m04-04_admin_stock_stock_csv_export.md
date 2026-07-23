# 在庫管理 — 在庫情報CSV出力

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫情報CSV出力 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockListController::exportCsv` / `StockListCsvExportService` / `StockListSearchAction` / `StockListSearchInput` / `SearchStockListType` / `DtbSalesQuantity` / `CsvExportService`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫情報CSV出力

### 機能の目的と役割

在庫検索一覧（M04-01）でセッションに保存された検索条件に一致する在庫情報を、ページングせず全件CSVで出力する機能。商品・規格・店舗・在庫区分ごとに在庫数・価格・原価・各期間の販売数を1行として書き出す。在庫一覧画面の「在庫情報CSV出力」ボタンから起動する。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。出力項目の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・出力列・取得元カラム・整形・処理順序はリニューアル先 ec-cube-enterprise 実装（`StockListCsvExportService`）を正とする。

### 本書で扱うこと

- 在庫情報CSV出力の入口（エンドポイント）と起動条件
- 出力列（19列）・各列の取得元・並び順・対象データ
- 文字コード・ファイル名・MIME/ダウンロード形式
- 検索未実行時・検索条件セッション不整合時の扱い

### 本書で扱わないこと

- 在庫検索一覧そのものの検索条件・表示項目・セッション保持（M04-01を正とする）
- 在庫情報カスタムCSV出力（`StockCustomCsvExportService` / `admin_stock_list_custom_csv`）の出力フォーマット
- 在庫リコメンドCSV出力（M04-16 / `StockRecommendCsvExportService`）
- 管理画面ログイン認証・権限制御（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | HTTPメソッド | ふるまい |
|------|------------------------------|--------------|----------|
| 在庫情報CSV出力 | `/%admin%/product/stock/csv`（`admin_stock_list_csv`） | GET | セッション `admin.stock.list.search` の検索条件を `SearchStockListType` で復元し、一致する在庫を全件CSV出力（`StreamedResponse`）する。検索条件が無い／復元に失敗した場合はエラー表示して在庫一覧へリダイレクトする。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。起動元は在庫検索一覧（M04-01）の「在庫情報CSV出力」ボタン（Excel識別ID 1-5）。

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

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に在庫情報CSV出力の相当機能は無い。リニューアル先のec-cube-enterpriseに新規追加する。DB関連はec-cube-enterpriseを正とする。

- 出力対象の在庫数は規格在庫（`dtb_product_stock.stock`、`base_info_id`・`stock_location_id` 単位）と規格本体（`dtb_product_class.stock`）から取得する。在庫区分名は `ProductStock` の `STOCK_LOCATION_ECCUBE`（EC-CUBE）／`STOCK_LOCATION_SMAREGI`（スマレジ）で出力する。
- 出力は在庫検索一覧（M04-01）の検索条件を適用した全件を対象とし、ページングしない。販売数は `dtb_sales_quantity` から規格×店舗単位で取得する。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫情報CSV出力
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
佐藤
作成日
2025-08-25
更新者
本田
更新日
2026-01-28
機能No
M04-04
機能名
在庫情報CSV出力
概要
—
処理概要
CSV出力項目
識別ID項目名備考
1商品ID-
2商品名-
3商品コード-
5店舗名-
6在庫区分名-
7言語-
8状態-
10基準価格-
11販売価格-
12買取価格-
14原価単価-
15総原価-
13在庫-
16当日販売数-
17前日販売数-
183日間販売数-
191週間販売数-
201ヶ月間販売数-
2190日間販売数-
機能仕様処理概要
在庫情報カスタムCSV出力
・在庫一覧の検索条件を適用した結果をCSVとして出力する。
```

</details>

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|---|---|---|----------|---|----------|
| M04-04-MSG-001 | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | 検索条件を指定してからCSV出力してください。 | 在庫検索を行わずにCSV出力したとき | エラーを表示して在庫一覧画面に遷移する |
| M04-04-MSG-002 | 管理画面上部 | 検索条件を指定してからCSV出力してください。 | 検索条件を指定してからCSV出力してください。 | CSV出力時に、保存された検索条件を読み込めないとき | エラーを表示して在庫一覧画面に遷移する |
