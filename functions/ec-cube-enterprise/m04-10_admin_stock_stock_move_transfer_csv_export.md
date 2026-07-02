# M04-10（在庫移動・振替情報CSV出力）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫移動・振替情報CSV出力 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveTransferController::exportMoveTransferCsv` / `StockMoveTransferListCsvExportService` / `DtbStockMoveTransferRepository::getQueryBuilderBySearchData` / `DtbStockMoveTransferDetailRepository::getAggregatesByStockMoveTransferIds`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、出力列・整形・ファイル名等を実装確認値で具体化。 |

## 1. 在庫移動・振替情報CSV出力

### 機能の目的と役割

在庫移動・振替検索/一覧（M04-08）の検索条件に一致する在庫移動・振替情報を、全件CSV出力する管理画面機能。出力は14列固定で、各行に在庫移動振替ID・移動指示ID・移動タイプ・出庫元/入庫先の店舗と在庫区分・移動点数・基準価格合計・ステータス・各日付・登録者・登録日を出力する。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。出力項目の業務要件は基本設計仕様書（在庫管理機能）を正とし、URLエンドポイント・出力整形・処理順序はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- CSV出力の入口（エンドポイント）と対象データの決定方法
- 出力列（ヘッダ）・各列の整形・対象件数
- ファイル名・Content-Type・処理方式（ストリーミング）

### 本書で扱わないこと

- 検索条件そのもの（M04-08 在庫移動・振替検索/一覧を正とする）
- 文字コード変換・CSV囲み等の共通整形（`CsvExportService` の共通設計を正とする）
- 戻しリストCSV（M04-33）・バーコード貼替リストCSV（M04-30）など別CSVの列仕様

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 在庫移動振替CSV出力 | `GET /%admin%/product/stock/move_transfer/csv_export`（`admin_stock_move_transfer_csv_export`） | 一覧（M04-08）のセッション検索条件で一致する全件をCSVストリーム出力する。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。`set_time_limit(0)` で時間制限を解除して実行する。

### 対象データの決定

`exportMoveTransferCsv()` はセッション `eccube.admin.stock.move_transfer.search` の検索ビューデータを `SearchStockMoveTransferType` に submit して検索データへ復元する（空の場合はフォーム既定値＝条件なし）。復元した検索データで `DtbStockMoveTransferRepository::getQueryBuilderBySearchData()` を組み立て、ページングせず全件を `StockMoveTransferListCsvExportService::exportBySearchData()` に渡す。並びは登録日降順 → ID降順（一覧と同一）。

### 出力列（CSVヘッダ）

`StockMoveTransferListCsvExportService::CSV_HEADER` の14列。出力順・ヘッダ名は以下のとおり（Excel CSV出力項目の識別ID 1〜14に対応）。

| # | 内部キー | ヘッダ | 値・整形 |
|---|----------|--------|----------|
| 1 | `stock_move_transfer_id` | 在庫移動振替ID | ID |
| 2 | `move_instruction_id` | 移動指示ID | 登録済みのみ出力、未登録は空 |
| 3 | `move_transfer_type` | 移動タイプ | `admin.stock.move.type_move`／`type_transfer` を翻訳（1:在庫移動／2:在庫振替） |
| 4 | `move_from_base_info` | 出庫元店舗 | 出庫元店舗名（`BaseInfo::getShopName`） |
| 5 | `move_from_stock_location` | 出庫元在庫区分 | `ProductStock::STOCK_LOCATION_ID_TO_NAME`（1:EC-CUBE／2:スマレジ） |
| 6 | `move_to_base_info` | 入庫先店舗 | 入庫先店舗名（振替時は出庫元と同一） |
| 7 | `move_to_stock_location` | 入庫先在庫区分 | 在庫区分名（振替時は出庫元と同一） |
| 8 | `move_quantity` | 移動点数 | 明細集計の移動点数合計（既定0） |
| 9 | `standard_total_price` | 基準価格合計 | 明細集計の基準価格合計を四捨五入した整数 |
| 10 | `move_transfer_status` | ステータス | `MtbStockMoveTransferStatus::getStatusName` |
| 11 | `move_from_stock_at` | 出庫日 | 出庫日時を `Y/m/d H:i`（NULLは空） |
| 12 | `move_to_stock_at` | 入庫日 | 入庫日時を `Y/m/d H:i`（NULLは空） |
| 13 | `registered_member` | 登録者 | 登録者氏名（`RegisteredMember::getName`） |
| 14 | `create_date` | 登録日 | 作成日時を `Y/m/d H:i` |

> 出力列はExcel設計の列定義（13列＝登録者／14列＝登録日）を正とし、実装も同一（13列＝登録者氏名、14列＝作成日時）で一致する。Excel識別ID 13/14 の備考（説明文）が「登録者＝新規作成日時／登録日＝登録ユーザ」と入れ替わって記載されているのはExcel側の備考の記載ゆれであり、列定義（=正）とは矛盾しない。

移動点数・基準価格合計は `DtbStockMoveTransferDetailRepository::getAggregatesByStockMoveTransferIds()` でチャンク単位に集計して埋める。

### プロセスフロー

1. `set_time_limit(0)`。検索フォーム生成 → セッション検索条件を復元（空なら既定値）。
2. `getQueryBuilderBySearchData()` でクエリを生成。
3. `StreamedResponse` のコールバック内で `CsvExportService::fopen()` → ヘッダ行を出力。
4. クエリ結果を `toIterable()` で逐次取得し、100件チャンク（`EXPORT_CHUNK_SIZE`）ごとに集計・行出力 → `EntityManager::clear()` でメモリ解放。
5. 端数チャンクを出力後、`fclose()`。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。業務データの更新は行わない。 |
| 参照テーブル | 在庫移動振替 `dtb_stock_move_transfer`（店舗・ステータス・登録者を結合参照）、明細 `dtb_stock_move_transfer_detail`（移動点数・基準価格合計の集計）。 |
| ログ | 出力完了時に `log_info('在庫移動・振替一覧CSV出力完了. ファイル名: …')`。 |

### 出力ファイル・レスポンス

- ファイル名: `stock_move_transfer_list_{YmdHis}.csv`（実行時刻）。
- Content-Type: `application/octet-stream`、`Content-Disposition: attachment; filename=…`。
- 文字コード・囲み等は共通の `CsvExportService` に従う（本サービスでは個別指定なし）。

既存テスト `StockMoveTransferControllerTest::testExportMoveTransferCsvSuccess` が `StreamedResponse`・`application/octet-stream`・`attachment`・`stock_move_transfer_list_` 接頭辞を確認している。

### 例外処理

- **検索未実行**: セッションに検索条件が無い場合はフォーム既定値（条件なし）で全件を対象とする。エラーにはならない。
- **対象なし**: 一致データが0件の場合はヘッダ行のみのCSVを出力する。

### 関連設計への接続点

- 出力項目順・項目名の業務要件は参照元Excel設計書（在庫移動・振替情報CSV出力シート）を正とする。
- URLエンドポイント・出力整形・処理順序は `../ec-cube-enterprise` の `StockMoveTransferListCsvExportService` 実装を正とする。
- 検索条件は M04-08（在庫移動・振替検索/一覧）を正とする。

## リニューアル移行時の扱い

- 本機能は新規実装であり、対応する現行（pf-eccube3）の同等機能は存在しない。出力項目順は基本設計仕様書（CSV出力項目）を正とする。
- CSV出力の対象は M04-08 の検索結果（セッション検索条件）であり、移行先 ec-cube-enterprise では在庫移動振替（`dtb_stock_move_transfer`）と明細（`dtb_stock_move_transfer_detail`）を参照する。移動点数・基準価格合計は明細集計で算出する。
- 出力対象テーブル・列の対応、整形（日時 `Y/m/d H:i`、基準価格合計の整数化、店舗/在庫区分/ステータスの表示名解決）は移行先 ec-cube-enterprise 実装を正とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動・振替情報CSV出力
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
堀部
作成日
2025-08-25
更新者
石川
更新日
2026-01-27
機能No
M04-10
機能名
在庫移動・振替情報CSV出力
概要
—
処理概要（★はカスタマイズ項目）
CSV出力項目
識別ID項目名備考
1在庫移動振替ID在庫移動振替情報のID
2移動指示ID移動指示が登録済みの場合に表示する、未登録の場合は何も表示しない
3移動タイプ在庫移動のタイプ 1:在庫移動 2:在庫振替
4出庫元店舗出庫元の店舗名
5出庫元在庫区分出庫元の在庫区分名 1:ECCUBE 2:スマレジ
6入庫先店舗入庫先の店舗名、振替の時は出庫元と同一となる
7入庫先在庫区分入庫先の在庫区分名 1:ECCUBE 2:スマレジ、振替の時は出庫元と同一となる
8移動点数移動または振替する商品の点数の合計
9基準価格合計移動または振替する商品の基準価格の合計
10ステータス在庫移動振替情報の現在のステータス名
11出庫日移動の場合はステータスが移動中になった日時
振替の場合はステータスが出庫承認済みになった日時
12入庫日ステータスが入庫完了になった日時
13登録者在庫移動振替情報が新規作成された日時
14登録日在庫移動振替情報を新規登録した管理画面ユーザ
カスタマイズ説明
・カスタマイズ要件
・在庫移動振替検索した結果をCSVとして出力する
機能仕様処理概要（★はカスタマイズ項目）
・在庫移動振替検索一覧の結果をCSV出力する
```

</details>
