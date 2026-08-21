# m04-10_admin_stock_stock_move_transfer_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動・振替情報CSV出力

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
