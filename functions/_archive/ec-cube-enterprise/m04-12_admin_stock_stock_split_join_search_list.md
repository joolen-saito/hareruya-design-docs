# m04-12_admin_stock_stock_split_join_search_list — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫分割結合検索/一覧

### 画面表示・一覧項目

| 観点 | 内容 |
|------|------|
| 検索前状態 | GET初期表示（`clear`/`resume` 指定なし）は空一覧で、分割CSV登録・結合CSV登録モーダルのフォームのみを返す（`stockSplitJoinSearchPerformed=false`）。 |
| 表示順 | 一覧は登録日時（`s.createDate`）の降順。Excel記載の「ID（実質は登録日）降順」に一致する。 |
| ページング | `getQueryBuilderBySearchData()` の結果を `paginate` せず全件を返す（`pager=null`）。表示件数選択は実装上持たない（実装要確認: 画面側での件数制御の有無）。 |
| 一覧項目（実装で出力される値） | タイプ（分割／結合）／店舗（`ProductStock.baseInfo` の会社名）／在庫区分（`ProductStock` のロケーション名：EC-CUBE在庫／スマレジ在庫）／分割元・結合先商品名（商品名＋規格1・規格2）／分割元・結合先点数（`splitJoinQuantity`）／分割先・結合元点数（明細 `Details` の合計）／基準価格の合計／ステータス（`MtbStockSplitJoinStatus`）／登録日時／登録者。詳細な画面列（識別ID 5-1〜5-14）はExcel設計を正とする。 |

### 検索条件

`SearchStockSplitJoinType`（block prefix `admin_search_stock_split_join` / CSRFトークンID `search_stock_split_join`）で受け取り、`StockSplitJoinIndexAction::normalizeSearchData()` で正規化したうえで `DtbStockSplitJoinRepository::getQueryBuilderBySearchData()` が組み立てる。

| 区分 | 項目（フォームキー） | 実装上の絞り込み |
|------|----------------------|------------------|
| 検索対象切替 | `search_target`（ラジオ、既定 `source`：分割元・結合先／`destination`：分割先・結合元） | 商品名・商品コード検索の対象を、分割=メイン在庫（分割元）か明細（分割先）、結合=メイン在庫（結合先）か明細（結合元）かに切り替える。 |
| 基本検索 | 商品名 `product_name`（部分一致）／商品コード `product_code`（部分一致） | `search_target` に応じてメイン在庫または明細（`DtbStockSplitJoinDetail`）の商品名・コードに `LIKE` を適用。 |
| 基本検索 | 店舗 `store`（テキスト） | 数値なら `baseInfo.id` 一致、文字列なら `baseInfo.shop_name LIKE`。 |
| 基本検索 | 在庫区分 `inventory_category`（チェックボックス複数：EC-CUBE在庫=1／スマレジ在庫=2） | `ProductStock.stockLocationId IN`。未選択は全件。 |
| 基本検索 | タイプ `split_join_type`（チェックボックス複数：分割=1／結合=2） | `s.splitJoinType IN`。未選択は全件。 |
| 基本検索 | ステータス `stock_split_join_status`（`MtbStockSplitJoinStatus` 複数、ID昇順） | `StockSplitJoinStatus.id IN`。未選択は全件。POST時はリクエスト生値の数値IDを優先採用。 |
| 詳細検索 | 登録日From/To `create_date_start`／`create_date_end` | `s.createDate` の範囲。From>To は `admin.product.date_range_error`。 |
| 詳細検索 | 承認・却下日From/To `move_to_approval_at_start`／`move_to_approval_at_end` | `s.moveToApprovalAt` の範囲。From>To は `admin.product.date_range_error`。 |
| 詳細検索 | 登録者 `registered_member`（`Member`） | `s.RegisteredMember` 一致。 |
| 詳細検索 | 承認者 `move_to_approval_member`（`Member`） | `s.MoveToApprovalMember` 一致。 |
| 詳細検索 | 更新日From/To `update_date_start`／`update_date_end` | `s.updateDate` の範囲。From>To は `admin.product.date_range_error`。 |

ステータス選択肢（`MtbStockSplitJoinStatus`、ID昇順）: 新規登録(1)／結合元登録(2)／分割承認待ち(3)／結合承認待ち(4)／入庫済み(5)／却下(6)。Excel記載の選択肢（分割：新規登録・分割承認待ち・却下・入庫完了／結合：新規登録・結合元登録・結合承認待ち・却下・入庫完了）は、画面でのタイプ別表示要件として扱う。

### プロセスフロー

1. リクエスト受信。`?clear=1` の場合はセッション `admin.stock.split_join.search` を破棄して一覧へリダイレクト。
2. 検索フォーム `SearchStockSplitJoinType` を生成。
3. **POST（検索実行）**: `handleRequest`。妥当（`isValid`）なら検索条件のビューデータをセッションに保存。POST生データ（`admin_search_stock_split_join`）も保持し、ステータスIDの確実な採用に用いる。
4. **GET（`?resume=1`）**: セッションの検索条件を復元してフォームに submit。
5. **GET（初回・パラメータ無し）**: 空一覧と各CSV登録モーダルフォームを返して終了（検索前状態）。
6. 検索データを `StockSplitJoinIndexInput`（`searchData` + `rawFormPayload`）に詰め、`StockSplitJoinIndexAction::handle()` が `normalizeSearchData()`（タイプ・ステータスの未選択を全件に正規化）を経て `DtbStockSplitJoinRepository::findBySearchData()` を実行。
7. 結果（`createDate` 降順）と検索フォーム・分割/結合CSV登録モーダルフォームを画面へ返す。

### 分岐・遷移・例外

- **検索条件クリア**: `?clear=1` → セッション破棄 → `admin_stock_split_join_list` へリダイレクト。
- **日付範囲不正**: 登録日／承認日／更新日のFrom>Toは各 `*_end` に `admin.product.date_range_error` を付与。フォーム不正時はセッション保存を行わない。
- **ステータス未選択での0件化防止**: チェックなし送信で `['']` 等が渡ると0件になるため、`normalizeSearchData()` と Repository 双方で「未選択＝全件」に正規化する。
- **結合新規遷移**: `productStockId` 未指定・不存在は `admin.stock.join.source_not_found` を表示し一覧へ戻す。
- **承認通知先取得**: 店舗未解決は空JSON、編集権限の無い店舗は403。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 一覧・検索は**参照のみ**で業務データを更新しない。検索条件はセッション `admin.stock.split_join.search` に保持する。 |
| 永続化先（参照） | 在庫分割結合 `dtb_stock_split_join`（`split_join_type`・`stock`・`split_join_quantity`・`standard_price`・`unit_cost_price`・`total_cost`・`move_to_approval_at` ほか、`ProductStock`／`StockSplitJoinStatus`／`RegisteredMember`／`MoveToApprovalMember` を関連）と明細 `dtb_stock_split_join_detail`。 |
| ステータス | `mtb_stock_split_join_status`（1新規登録／2結合元登録／3分割承認待ち／4結合承認待ち／5入庫済み／6却下）。ステータス履歴は `dtb_stock_split_join_status_history`。 |

### 関連設計への接続点

- 画面項目・一覧列・検索条件UIの詳細は、参照元Excel設計書（在庫分割結合検索一覧シート）を正とする。
- URLエンドポイント・検索条件・DBカラム・処理順序は `../ec-cube-enterprise` の `StockSplitJoinController` / `StockSplitJoinIndexAction` / `SearchStockSplitJoinType` / `DtbStockSplitJoinRepository` 実装を正とする。
- CSV出力はM04-14、カスタムCSVはM04-15、分割・結合CSV登録はM04-23を参照。
