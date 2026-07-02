# M04-14（在庫分割結合情報CSV出力）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫分割結合情報CSV出力 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockSplitJoinController::csvExport` / `StockSplitJoinCsvExportService` / `DtbStockSplitJoinRepository::getQueryBuilderBySearchData` / `CsvExportService` / `DtbStockSplitJoin` / `DtbStockSplitJoinDetail`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Repository/Entity）と既存テストを読み込み、出力列・並び・ファイル名・整形を実装確認値で具体化。 |

## 1. 在庫分割結合情報CSV出力

### 機能の目的と役割

在庫分割結合一覧（M04-12）の検索条件に一致する在庫分割・結合情報を、固定12列のCSVとして出力する管理画面機能。一覧画面の在庫分割結合CSV出力ボタンから呼び出される。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。出力列・出力条件の業務要件は基本設計仕様書を正とし、出力列の値・並び・ファイル名・文字コードはリニューアル先 ec-cube-enterprise 実装（`StockSplitJoinCsvExportService`）を正とする。

### 本書で扱うこと

- 在庫分割結合情報CSVの入口（エンドポイント）と対象データ
- 出力列（固定12列）・並び順・ファイル名・文字コード・整形
- 検索条件の引き継ぎ（セッション）と0件時の扱い

### 本書で扱わないこと

- 出力フォーマットを選択するカスタムCSV出力（M04-15）
- 一覧・検索条件そのもの（M04-12）
- 結合欠品の検品CSV出力（`StockJoinShortageCsvExportService`、欠品入力画面の機能）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 在庫分割結合CSV出力 | `GET /%admin%/product/stock/split-join/csv-export`（`admin_stock_split_join_csv_export`） | セッション `admin.stock.split_join.search` の検索条件を `SearchStockSplitJoinType` に復元し、一致データ全件をCSVとして `StreamedResponse` で返す。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。

### 出力対象データと出力列

`StockSplitJoinCsvExportService::exportBySearchData()` が `DtbStockSplitJoinRepository::getQueryBuilderBySearchData()` のクエリに `orderBy('s.id', 'ASC')` を上書きして取得した `DtbStockSplitJoin` を行に展開する。Excelの出力項目（識別ID 1〜12）と実装の `CSV_HEADER` が1対1で対応する。

| # | ヘッダ（実装値） | 出力値（実装） |
|---|------------------|----------------|
| 1 | ID | `DtbStockSplitJoin.id` |
| 2 | タイプ | 分割（`SPLIT_JOIN_TYPE_SPLIT=1`）／結合（`SPLIT_JOIN_TYPE_JOIN=2`）のラベル |
| 3 | 店舗 | `ProductStock.baseInfo` の会社名（無い場合 `-`） |
| 4 | 在庫区分 | `ProductStock` のロケーション名（EC-CUBE在庫／スマレジ在庫） |
| 5 | 分割元・結合先商品名 | 商品名＋規格分類1・規格分類2を ` - ` 連結 |
| 6 | 分割元・結合先点数 | `DtbStockSplitJoin.splitJoinQuantity`（分割数／結合数） |
| 7 | 分割元・結合先商品の基準価格の合計 | `standardPrice × splitJoinQuantity`（四捨五入の整数） |
| 8 | 分割先・結合元点数 | 明細 `Details` の `splitJoinQuantity` 合計 |
| 9 | 分割先・結合元商品の基準価格の合計 | 明細ごとの `standardPrice × splitJoinQuantity` の合計 |
| 10 | ステータス | `MtbStockSplitJoinStatus.name` |
| 11 | 登録日時 | `createDate` を `Y/m/d H:i` で整形 |
| 12 | 登録者 | `RegisteredMember` の氏名（無い場合 `-`） |

### 整形・ファイル仕様

| 観点 | 内容 |
|------|------|
| 並び順 | 在庫分割結合ID（`s.id`）の昇順。一覧表示（`createDate` 降順）とは異なり、出力時にID昇順へ上書きする。 |
| ファイル名 | `stock_split_join_YmdHis.csv`（出力時刻）。 |
| Content-Type | `application/octet-stream`、`Content-Disposition: attachment`。 |
| 文字コード | `CsvExportService` の共通設定 `eccube_csv_export_encoding`（既定 `SJIS-win`）でUTF-8から変換して出力。 |
| 0件時 | ヘッダ行のみを出力する（既存テスト `testExportBySearchDataOutputsHeaderOnlyWhenNoResults`）。 |
| ログ | 出力完了時に `log_info('在庫分割結合CSV出力完了. ファイル名: ...')`。 |

### プロセスフロー

1. `csv-export` をGET受信。
2. セッション `admin.stock.split_join.search` の検索ビューデータを取得し、`SearchStockSplitJoinType` に `FormUtil::submitAndGetData()` で submit して `searchData` を得る（未検索・空セッション時は条件なし＝全件）。
3. `StockSplitJoinCsvExportService::exportBySearchData($searchData)` を呼び出す。
4. `getQueryBuilderBySearchData()` で条件付きクエリを構築し `orderBy('s.id', 'ASC')` を適用、`getResult()` で `DtbStockSplitJoin` 一覧を取得。
5. 各レコードを上表の12列に展開して行を生成。
6. `StreamedResponse` のコールバックで `CsvExportService::fopen/fputcsv/fclose` によりヘッダ→データ行を書き出す。

### 分岐・例外

- **未検索でのCSV要求**: 在庫一覧（M04-01）と異なり、本ルートは検索必須ガードを持たず、空セッション時は条件なしで全件出力する（実装確認値）。
- **0件**: ヘッダ行のみ出力（エラーにはしない）。
- **検索条件の構造不整合**: フォーム submit で復元できない条件は無視され、結果が条件なしに近づく（実装要確認: 旧構造セッションのリセット処理は本ルートには無い）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。`dtb_stock_split_join` と `dtb_stock_split_join_detail` を結合参照し、CSVへ整形出力するだけで更新しない。 |
| 履歴・ログ | 取込履歴等の作成は無し。出力完了の `log_info` のみ。 |

### 関連設計への接続点

- 出力項目（識別ID 1〜12）の業務定義は参照元Excel設計書（在庫分割結合情報CSV出力シート）を正とする。
- 出力列の値・並び・ファイル名・文字コードは `../ec-cube-enterprise` の `StockSplitJoinCsvExportService` / `DtbStockSplitJoinRepository` / `CsvExportService` 実装を正とする。
- 検索条件はM04-12、出力フォーマット選択はM04-15を参照。

## リニューアル移行時の扱い

本機能は新規実装であり、現行リポ（pf-eccube3 など）に対応機能は存在しない。移行先 ec-cube-enterprise の実装を確認値とする。

| 観点 | 移行先（ec-cube-enterprise）の扱い |
|------|------------------------------------|
| 出力対象データ | `dtb_stock_split_join` と `dtb_stock_split_join_detail` を結合した在庫分割結合情報。 |
| 出力サービス | `StockSplitJoinCsvExportService::exportBySearchData()` で生成。固定12列（`CSV_HEADER`）。 |
| 並び順 | 在庫分割結合ID（`s.id`）の昇順で出力（基本設計の記載どおり）。 |
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`）。 |

Excelの出力列はすべて `CSV_HEADER` の12列に対応づけられている。出力値の細部（基準価格合計の丸め等）は上記サービス実装を正とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫分割結合情報CSV出力
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
2026-02-05
機能No
M04-14
機能名
在庫分割結合情報CSV出力
概要
—
処理概要
CSV出力項目
識別ID項目名備考
1ID在庫分割・結合登録 編集（分割）の "識別ID1-1" 「在庫分割結合ID」
在庫分割・結合登録 編集（結合）の "識別ID1-1" 「在庫結合結合ID」
2タイプ在庫分割・結合登録 編集（分割）の "識別ID1-2" 「処理タイプ」
在庫分割・結合登録 編集（結合）の "識別ID1-2" 「処理タイプ」
3店舗在庫分割・結合登録 編集（分割）の "識別ID1-3" 「店舗」
在庫分割・結合登録 編集（結合）の "識別ID1-3" 「店舗」
4在庫区分在庫分割・結合登録 編集（分割）の "識別ID1-4" 「在庫区分」
在庫分割・結合登録 編集（結合）の "識別ID1-4" 「在庫区分」
5分割元・結合先商品名在庫分割・結合登録 編集（分割）の "識別ID2-1" 「分割元商品名」
在庫分割・結合登録 編集（結合）の "識別ID2-1" 「結合先商品名」
6分割元・結合先点数在庫分割・結合登録 編集（分割）の "識別ID2-10" 「分割数」
在庫分割・結合登録 編集（結合）の "識別ID2-10" 「結合数」
7分割元・結合先商品の基準価格の合計在庫分割・結合一覧検索の "識別ID5-7" 「基準価格の合計」
8分割先・結合元点数在庫分割・結合登録 編集（分割）の "識別ID2-21" 「分割先在庫数」
在庫分割・結合登録 編集（結合）の "識別ID7-1" 「結合元点数」
9分割先・結合元商品の基準価格の合計在庫分割・結合一覧検索の "識別ID5-9" 「基準価格の合計」
10ステータス在庫分割・結合登録 編集（分割）の "識別ID1-5" 「ステータス」
在庫分割・結合登録 編集（結合）の "識別ID1-5" 「ステータス」
11登録日時在庫分割・結合登録 編集（分割）の "識別ID1-6" 「登録日」
在庫分割・結合登録 編集（結合）の "識別ID1-6" 「登録日」
12登録者在庫分割・結合登録 編集（分割）の "識別ID1-9" 「登録者」
在庫分割・結合登録 編集（結合）の "識別ID1-9" 「登録者」
機能仕様処理概要
在庫分割結合CSV出力
・在庫分割結合一覧画面の在庫分割結合CSV出力ボタンを押下してCSVを出力する
・検索結果のデータを取得しCSV出力する
・在庫分割結合IDの昇順で出力
```

</details>
