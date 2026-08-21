# m04-14_admin_stock_stock_split_join_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫分割結合情報CSV出力

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
