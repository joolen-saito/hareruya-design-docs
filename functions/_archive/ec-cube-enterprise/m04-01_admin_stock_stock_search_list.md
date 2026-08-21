# m04-01_admin_stock_stock_search_list — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 在庫検索/一覧

### 画面表示・一覧項目

| 観点 | 内容 |
|------|------|
| デフォルト表示 | メンバー管理で設定された「デフォルト検索表示店舗」で絞り込んだ在庫一覧を初期表示する（設計要件）。 |
| 表示順 | 一覧はID降順。 |
| 一覧項目 | 販売数ラベル／チェックボックス／ID（商品ID）／商品名（在庫編集へのリンク）／商品コード／店舗／在庫区分／言語／状態／基準価格／販売価格／買取価格／在庫数／原価単価／総原価／各期間の販売数／在庫変動履歴リンク（押下で「在庫変動履歴」「価格履歴」リンクを表示し、選択行のみ絞り込んで各画面へ遷移）。（Excel識別ID 2-1〜2-17） |
| 表示件数 | 既定 `eccube_default_page_count`。選択肢は表示件数マスタ（10/50/100/300/500/1000/2000/10000/12000 件 等）。 |

### 検索条件

`SearchStockListType` で受け取り、`StockListSearchInput::fromFormData()` で正規化する。

| 区分 | 項目（フォームキー） |
|------|----------------------|
| 基本検索 | 商品名 `product_name`（部分一致）／カード名 `card_name`（部分一致）／商品ID `product_id`／商品コード `product_code`（部分一致）／店舗 `base_info`／在庫区分 `stock_zone`（EC-CUBE在庫／スマレジ在庫） |
| 詳細検索 | カテゴリ `category_id`／カードセット `cardset`／言語 `language`／Foil `foil`／プロモーション `promotion`／タグ `tag_id`／高額区分 `expensive`／基準価格 `base_price_from`〜`base_price_to`（在庫一覧のみ）／発注日 `order_date`／更新日 `update_date_from`〜`update_date_to`／セクション `section`／棚番 `shelf_number`／状態 `status`／レアリティ `rarity`／カード状態 `card_condition`／フレーム `frame`／保管コード `storage_code_id`／売上分析タグ `tag_sales_analysis`／販売価格 `sell_price_from`〜`sell_price_to`／発注数 `order_quantity_from`〜`order_quantity_to`／在庫数 `stock_from`〜`stock_to` |

検索本体は `ProductStockRepository::getQueryBuilderForAdminStockList($input)` が組み立て、結果を `paginate()` する。全店舗・スマレジの在庫を EC-CUBE の DB が保持するため通常の検索処理で横断検索する。

### プロセスフロー

1. リクエスト受信。表示件数（`page_count`）指定時はマスタ照合し、採用値をセッション `admin.stock.list.page_count` に保存。
2. **POST（検索実行）**: フォーム検証。不正なら `has_errors=true` で空一覧を返す。正常なら検索条件をセッション `admin.stock.list.search` に保存し、`page_no=1`・検索パターンIDをリセット。
3. **GET（`page_no` 指定 or `?resume=1`）**: セッションの検索条件を復元して再submit。構造不整合時はセッションをリセットして空一覧に戻す。
4. **GET（パラメータ無し・初回）**: 検索条件・ページ・パターンIDのセッションを破棄し、空一覧を返す（検索前状態）。
5. 復元した条件で `StockListSearchInput` を生成 → `StockListSearchAction::handle()` → QueryBuilder を `paginate($qb, $pageNo, $pageCount)`。
6. 一覧・検索フォーム・表示件数マスタ・在庫CSV拡張を画面へ返す。

### 画面遷移と遷移可否の分岐（設計要件）

チェックボックス（識別ID 2-2）で選択した商品規格を持って各画面へ遷移する。

| 遷移ボタン | 遷移先 | 遷移させない条件（アラート表示） |
|------------|--------|----------------------------------|
| 在庫一括編集 | 在庫一括編集（M04-03 / `stock-bulk-approval`） | 複数店舗の規格が選択／編集権限の無い店舗の在庫が選択 |
| 在庫移動・振替登録 | 在庫移動・振替登録（M04-09） | 複数店舗の在庫／複数在庫区分の在庫／編集権限の無い店舗の在庫／在庫0の在庫が選択 |
| 在庫結合登録・在庫分割登録 | 在庫分割結合登録（M04-13） | 複数店舗の規格が選択 |
| 在庫変動履歴 | 在庫変動履歴（選択行で絞り込み） | — |

> 遷移可否のアラート判定は基本設計の要件。サーバ側ディスパッチ（`admin_stock_list_bulk_edit_dispatch`）は対象IDがあれば一括編集へリダイレクト、無ければ一覧へ戻す挙動を実装確認済み。選択チェック自体は画面側（JS/Twig）制御。

### 検索パターンの保存・削除

- 保存（`save-pattern`）: フォーム不正は `admin.common.csrf_invalid`、パターン名未入力は `admin.common.save_pattern.error.name_empty` をエラー表示。`DtbSearchPattern` を名称で upsert し、`display_key='在庫一覧'`・ログインメンバーの `BaseInfo` を設定。**店舗は検索条件の保存に含めない**（Excel要件）。
- 削除（`delete-pattern`）: 選択中パターンを削除。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 在庫一覧は**参照のみ**で業務データを更新しない（検索・表示・CSV出力）。検索条件・ページ・表示件数・パターンIDをセッションに保持する。 |
| 在庫の保持先 | 在庫数は規格在庫 `dtb_product_stock.stock`（store・stock_location単位）と規格本体 `dtb_product_class.stock`。在庫変動履歴は `dtb_stock_history`（`product_stock_id` 関連）。 |
| 検索パターン | `dtb_search_pattern`（`display_key='在庫一覧'`） |

### 例外処理

- **検索入力不備**: 基準価格／販売価格の範囲（From>To）など検証エラー時はリダイレクトせず `has_errors=true` で同一画面を再表示（既存テスト `testIndexPostValidationErrorOnBasePriceRange` / `...SellPriceRange`）。
- **検索未実行でCSV要求**: セッションに検索条件が無い状態でCSV／カスタムCSV／リコメンドCSVを要求した場合、`admin.stock.list.search_required_for_csv` をエラー表示して一覧へリダイレクト。
- **セッション不整合**: 保存済み検索条件が旧フォーム構造と不整合の場合、当該セッションを破棄し空一覧（一覧）に戻す。CSV系はログ出力のうえ同様にリセット・エラー表示する。
- **カスタムCSV対象不正**: `csvExtensionId` が存在しない／在庫種別（`CSV_TYPE_STOCK`）でない場合は404。

### 関連設計への接続点

- 画面項目・一覧列・CSV列の詳細は、参照元Excel設計書（在庫検索一覧 検索入力／検索結果シート）を正とする。
- URLエンドポイント・検索条件・DBカラム・処理順序は `../ec-cube-enterprise` の `StockListController` / `StockListSearchAction` / `StockListSearchInput` / `SearchStockListType` / `ProductStockRepository` 実装を正とする。
