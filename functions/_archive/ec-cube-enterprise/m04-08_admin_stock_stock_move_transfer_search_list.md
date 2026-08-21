# m04-08_admin_stock_stock_move_transfer_search_list — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫移動・振替検索/一覧

### 画面表示・一覧項目

| 観点 | 内容 |
|------|------|
| 表示順 | 実装は登録日（`create_date`）降順 → 在庫移動振替ID（`id`）降順（`getQueryBuilderBySearchData`）。Excel要件は「在庫移動振替ID降順」だが、実装は登録日降順を第1キーとする（実IDは登録日順に採番されるため概ね一致する）。 |
| 集計表示 | 各在庫移動振替IDの移動点数合計・基準価格合計を `DtbStockMoveTransferDetailRepository::getAggregatesByStockMoveTransferIds()` で取得し、一覧へ渡す（`stockMoveTransferAggregates`）。 |
| 表示件数 | 既定 `eccube_default_page_count`。クエリ `page_count` が表示件数マスタ（`PageMax`）に一致すれば採用し、セッション `eccube.admin.stock.move_transfer.page_count` に保存する。 |
| モーダル/付帯データ | 在庫移動CSV登録フォーム・在庫振替CSV登録フォーム、店舗一覧（`csvMoveTransferRegisterBaseInfos`）、移動タイプ定数（`MOVE_TRANSFER_TYPE_MOVE=1` / `MOVE_TRANSFER_TYPE_TRANSFER=2`）を画面へ渡す。 |

### 検索条件

`SearchStockMoveTransferType`（ブロックプレフィックス `admin_search_stock_move_transfer`）で受け取り、`getQueryBuilderBySearchData()` がクエリを組み立てる。

| 項目（フォームキー） | 形式・絞り込み |
|----------------------|----------------|
| 在庫移動・振替ID `stock_move_transfer_id` | 数字のみは完全一致、非数字混在は ID文字列の部分一致（LIKE） |
| 移動指示ID `move_instruction_id` | NULL以外を部分一致（LIKE） |
| 送り状No `tracking_no` | 部分一致（LIKE） |
| 出庫元店舗 `move_from_base_info` | `BaseInfo` 複数選択（IN） |
| 入庫先店舗 `move_to_base_info` | `BaseInfo` 複数選択（IN） |
| 出庫元在庫区分 `move_from_stock_location_id` | EC-CUBE在庫／スマレジ在庫の複数選択（IN） |
| 入庫先在庫区分 `move_to_stock_location_id` | EC-CUBE在庫／スマレジ在庫の複数選択（IN） |
| 移動タイプ `move_transfer_type` | 在庫移動／在庫振替の複数選択（IN） |
| ステータス `move_transfer_status` | `MtbStockMoveTransferStatus`（ID昇順）の複数選択（IN） |
| 登録日 `create_date_start`〜`create_date_end` | 範囲（終了日は+1日して未満比較） |
| 出庫承認 所属 `move_from_approval_department`／担当者名 `move_from_approval_member_name` | 出庫承認者で内部結合し、所属名一致・氏名LIKE |
| 登録者 所属 `registered_department`／氏名 `registered_member_name` | 登録者で所属名一致・氏名LIKE |
| 入庫承認 所属 `move_to_approval_department`／担当者名 `move_to_approval_member_name` | 入庫承認者で内部結合し、所属名一致・氏名LIKE |
| 出庫日 `move_from_stock_date_start`〜`move_from_stock_date_end` | 範囲 |
| 入庫日 `move_to_stock_date_start`〜`move_to_stock_date_end` | 範囲 |

日付3ペア（登録日・出庫日・入庫日）は POST_SUBMIT で開始>終了をチェックし、不正時は終了側に `admin.common.date_end_error` を付与する。

### プロセスフロー

1. リクエスト受信。`BaseInfo` 全件で検索フォーム・CSV登録モーダルフォームを生成。クエリ `page_count` 指定時はマスタ照合し採用値をセッションへ保存。
2. **POST（検索実行）**: フォーム検証。不正なら `has_errors=true`・`pagination=null` で再表示（一覧は描画しない）。正常なら検索条件（`FormUtil::getViewData`）をセッション `eccube.admin.stock.move_transfer.search` に、`page_no=1` を `...page_no` に保存。
3. **GET（`?resume=1`）**: セッションのページ番号・検索条件を復元して再submit。
4. **GET（`page_no` 指定）**: ページ番号をセッションに保存し検索条件を復元（空ならフォーム既定値を保存）。
5. **GET（初回）**: ページ番号=1・フォーム既定値を検索条件としてセッション保存。
6. 復元した検索データで `getQueryBuilderBySearchData()` → `paginator->paginate($qb, $page_no, $pageCount)`。
7. 表示中ページの在庫移動振替IDを収集し、移動点数・基準価格合計を集計して一覧・フォーム・表示件数マスタとともに画面へ返す。

### 一覧からの操作と接続点（設計要件）

| 操作 | 接続先 | 実装上の扱い |
|------|--------|--------------|
| 在庫移動CSV登録／在庫振替CSV登録 | M04-22 | 一覧上のモーダルから上記取込ルートへPOST。エラーは元画面（一覧）上部に表示、モーダルの選択内容はリセット。 |
| 在庫移動振替CSV出力 | M04-10 | セッションの検索条件で全件出力。 |
| 戻しリストCSV出力／PDF出力 | M04-33／M04-34 | 選択した在庫移動振替IDを `ids[]` でPOST。CSRFトークン検証後、`validateReturnListExportRequest()` で選択有無・対象妥当性を検証（移動であること・閾値対象など）。 |
| バーコード貼替リストCSV出力 | M04-30 | 移動かつ入庫先がスマレジ在庫の場合のみ（出力ルートは別機能側。本コントローラ未実装＝実装要確認）。 |
| 在庫移動指示作成 | 在庫移動指示一覧 | 移動タイプ＝移動・同一出庫元/入庫先店舗・ステータス出庫承認済み・移動指示ID未登録の条件を満たす移動をまとめて作成（作成処理ルートは別コントローラ。本コントローラ未実装＝実装要確認）。 |

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 一覧・検索は**参照のみ**で業務データを更新しない。検索条件・ページ番号・表示件数をセッションに保持する。 |
| 永続化先 | 在庫移動振替 `dtb_stock_move_transfer`（`move_transfer_type`・`move_transfer_status_id`・`move_instruction_id`・`tracking_no`・出庫元/入庫先の店舗ID・在庫区分・承認者・各日時・`registered_member_id`・`updated_member_id`）、明細 `dtb_stock_move_transfer_detail`（移動点数・基準価格合計等）。 |
| セッションキー | `eccube.admin.stock.move_transfer.search` / `...page_no` / `...page_count`。 |

### 例外処理

- **検索入力不備**: 日付の開始>終了など検証エラー時はリダイレクトせず `has_errors=true`・`pagination=null` で同一画面を再表示（既存テスト `testIndexPostRejectsWhenCreateDateStartIsAfterEnd`）。
- **CSV登録エラー**: 取込エラーは元画面（一覧）上部にエラー表示。検索項目・一覧の選択状態は維持され、CSV登録モーダルの選択内容はリセットされる（Excel要件）。
- **戻しリスト出力の選択なし**: `ids` 未選択時は `admin.stock.move_transfer.return_list_csv_export.no_selection` を表示し、現在ページへリダイレクト。
- **CSRF不正**: 戻しリストCSV/PDFは `isTokenValid()` を要求する。

### 関連設計への接続点

- 画面項目・一覧列・CSV/PDF列の詳細は、参照元Excel設計書（在庫移動振替一覧シートおよび各CSV/PDF機能）を正とする。
- URLエンドポイント・検索条件・DBカラム・処理順序は `../ec-cube-enterprise` の `StockMoveTransferController` / `SearchStockMoveTransferType` / `DtbStockMoveTransferRepository` 実装を正とする。
