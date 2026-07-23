# 在庫管理 — 在庫分割結合検索/一覧

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 在庫分割結合検索/一覧 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockSplitJoinController` / `StockSplitJoinIndexAction` / `StockSplitJoinIndexInput` / `SearchStockSplitJoinType` / `DtbStockSplitJoinRepository::getQueryBuilderBySearchData` / `MtbStockSplitJoinStatus` / `DtbStockSplitJoin`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 在庫分割結合検索/一覧

### 機能の目的と役割

在庫分割・在庫結合の登録情報を、商品名・商品コード・店舗・在庫区分・タイプ・ステータス・登録日・承認日・登録者・承認者などの条件で検索し、一覧表示する管理画面機能。一覧からは分割・結合のCSV一括登録（モーダル）、検索結果に対する在庫分割結合情報CSV出力（M04-14）、結合新規画面への遷移ができる。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。画面・項目の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・検索条件・DBカラム・処理順序はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 在庫分割結合一覧の入口（検索・検索条件のセッション保持・クリア）と表示要素
- 検索条件（基本検索／詳細検索）の項目とフォームキー
- 分割CSV登録／結合CSV登録モーダルの入口、在庫分割結合CSV出力の入口
- 一覧から結合新規画面・ステータス照会への遷移
- 未検索・入力不備時の扱い

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能の設計を正とする。

- 在庫分割結合CSV出力の出力列・整形（M04-14）、カスタムCSV出力（M04-15）
- 分割／結合CSV登録の必須ヘッダ・バリデーション・取込処理（M04-23）
- 在庫分割・結合登録／編集・承認の画面・更新仕様（M04-13 ほか）
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

すべて `StockSplitJoinController` が処理する。`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）で、いずれも管理画面ログインを要する。

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 一覧トップ／検索 | `GET,POST /%admin%/product/stock/split-join`（`admin_stock_split_join_list`） | GETは検索前状態（空一覧、`stockSplitJoinSearchPerformed=false`）。POSTは検索実行し、フォーム妥当時に検索条件をセッション `admin.stock.split_join.search` に保存して結果を表示。`?clear=1` はセッションの検索条件を破棄して一覧へリダイレクト。`?resume=1` はセッションの検索条件を復元して再表示。 |
| ステータス照会 | `GET /%admin%/product/stock/split-join/{id}/status-snapshot`（`admin_stock_split_join_status_snapshot`） | 対象 `DtbStockSplitJoin` を `refresh` し、`{ok, status_id}` をJSONで返す（別タブ更新後の軽量再読込用）。 |
| 分割CSV登録 | `POST /%admin%/product/stock/split-join/list-split-csv-import`（`admin_stock_split_join_list_split_csv_import`） | 分割CSVを取り込む（M04-23）。完了後に一覧へリダイレクト。 |
| 結合CSV登録 | `POST /%admin%/product/stock/split-join/list-join-csv-import`（`admin_stock_split_join_list_join_csv_import`） | 結合CSVを取り込む（M04-23）。完了後に一覧へリダイレクト。 |
| 分割CSV雛形 | `GET /%admin%/product/stock/split-join/split-csv-template`（`admin_stock_split_csv_template`） | 4列ヘッダのみのCSV雛形（UTF-8 BOM付き）をダウンロード。 |
| 結合CSV雛形 | `GET /%admin%/product/stock/split-join/join-csv-template`（`admin_stock_join_csv_template`） | 5列ヘッダのみのCSV雛形（UTF-8 BOM付き）をダウンロード。 |
| 在庫分割結合CSV出力 | `GET /%admin%/product/stock/split-join/csv-export`（`admin_stock_split_join_csv_export`） | セッションの検索条件で在庫分割結合情報CSVを出力する（M04-14）。 |
| 承認通知先メンバー取得 | `GET /%admin%/product/stock/split-join/approval-members`（`admin_stock_split_join_approval_members`） | 分割CSV登録モーダル用に、店舗IDに紐づく承認権限メンバーを所属別マトリクス＋選択肢のJSONで返す。編集権限の無い店舗は403。 |
| 結合新規へ遷移 | `GET /%admin%/product/stock/join/new`（`admin_stock_join_new_redirect`） | `productStockId` から在庫を解決し結合新規（`admin_stock_join_new`）へリダイレクト。未指定・不存在は `admin.stock.join.source_not_found` を表示し一覧へ戻す。 |

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

## 表示メッセージ

本表は `message_inventory/slices/M04-12.resolved.tsv` を正とし、文言は ec-cube-enterprise 実ソース（`StockJoinController.php` / `StockSplitJoinController.php` と `messages.ja.yaml`）由来。可変部は代入元の性質を記す。

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-12-MSG-062 | 管理画面上部 | 指定の在庫が見つかりません。 | 指定の在庫が見つかりません。 | 一覧から在庫結合の新規登録を開くとき、対象在庫が指定されていないとき | 在庫分割結合検索/一覧画面に遷移する |
| M04-12-MSG-063 | 管理画面上部 | 指定の在庫が見つかりません。 | 指定の在庫が見つかりません。 | 一覧から在庫結合の新規登録を開くとき、指定した在庫が存在しないとき | 在庫分割結合検索/一覧画面に遷移する |
| M04-12-MSG-064 | 入力項目直下/フォーム上部 | admin.product.date_range_error | admin.product.date_range_error | 作成日時の開始日が終了日より後の日付で検索したとき | 検索条件を保存せず、一覧画面に留まる |
| M04-12-MSG-065 | 入力項目直下/フォーム上部 | admin.product.date_range_error | admin.product.date_range_error | 承認・却下日時の開始日が終了日より後の日付で検索したとき | 検索条件を保存せず、一覧画面に留まる |
| M04-12-MSG-066 | 入力項目直下/フォーム上部 | admin.product.date_range_error | admin.product.date_range_error | 更新日時の開始日が終了日より後の日付で検索したとき | 検索条件を保存せず、一覧画面に留まる |

## リニューアル移行時の扱い

- 本機能は新規実装であり、対応する現行（pf-eccube3）の同等機能は存在しない。仕様は基本設計仕様書（在庫管理機能）を正とする。
- 永続化先は在庫分割結合（`dtb_stock_split_join`）と明細（`dtb_stock_split_join_detail`）、ステータスマスタ（`mtb_stock_split_join_status`）、ステータス履歴（`dtb_stock_split_join_status_history`）で、いずれもec-cube-enterprise実装に実在する。
- 一覧の既定並びは登録日時（`create_date`）の降順。列名・関連・ステータス値は移行先のec-cube-enterprise実装を正とする。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫分割結合検索一覧(検索・結果)
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
2026-02-04
機能No
M04-12
機能名
在庫分割結合一覧（検索・結果）
概要
—
処理概要 在庫分割結合一覧（検索・結果）画面
図形・テキストボックス内テキスト（34件）
レイアウト図 在庫分割結合一覧（検索・結果）画面
4-2
4-3
5-1
5-2
5-3
5-4
5-13
4-4
5-5
5-7
5-6
5-14
5-8
5-12
5-11
5-10
5-9
1-1
1-2
2-4
2-5
2-6
2-7
3-1
3-3
3-7
4-1
3-4
3-2
3-5
3-6
2-2
2-3
2-1
画像レイヤー（3枚）: 在庫分割結合検索一覧(検索・結果) / C8 / image 1 + 在庫分割結合検索一覧(検索・結果) / C8 / image 2 + 在庫分割結合検索一覧(検索・結果) / C8 / image 3
機能仕様処理概要 在庫分割結合一覧（検索・結果）画面
在庫分割結合一覧画面（検索・結果）概要
・在庫分割・結合の一覧として機能する
・在庫分割・結合についてCSVを利用してそれぞれ一括登録できる
・選択した一覧の分割・結合について、各種CSVを出力することができる
CSVファイル登録
・在庫分割CSV登録ボタンを押下すると、在庫分割CSV登録モーダルが表示される
・在庫分割が登録されると、対象の在庫分割のステータスは分割承認待ちとなる
・機能ID: M04-23の在庫分割CSV登録のモーダルを表示
・在庫結合CSV登録ボタンを押下すると、在庫結合CSV登録モーダルが表示される
・在庫結合が登録されると、対象の在庫結合のステータスは結合元登録となる
・機能ID: M04-23の在庫振替CSV登録のモーダルを表示
CSVファイル登録時のエラー挙動
・CSVファイル登録時にエラーがあり登録が行われなかった場合、一覧画面上部のエラー表示エリアにエラー内容を表示
・検索項目および一覧の選択状態は失われない
・機能ID: M04-23の在庫分割CSV登録および在庫結合CSV登録モーダルの選択内容はリセットされる
検索結果の表示
・検索ボタン押下後、検索が完了したらページを再描画し、検索結果の件数表示と、検索結果一覧を表示する
・一覧はID（実質は登録日）を降順として表示する
各種出力について
・検索結果一覧テーブルで分割・結合をチェックした場合、各種出力ボタンが活性化する
・在庫分割結合CSV出力
・機能ID: M04-15のCSVを利用
識別IDラベル書式・制限必須最大値初期値画面部品の説明検索対象項目
CSVファイル登録在庫分割在庫結合
1-1在庫分割CSV登録ボタン-----
1-2在庫結合CSV登録ボタン-----
検索条件
2-1商品名・商品コード検索対象チェックボックス--分割元・結合先2-2, 2-3 の商品の検索対象を「分割元・結合先」または「分割先・結合元」とするかの指定するために利用○○
2-2商品名数値--在庫分割・結合登録 編集（分割）の "識別ID2-1" 「商品名」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID2-1" 「商品名」の検索に利用○○
2-3商品コード数値---在庫分割・結合登録 編集（分割）の "識別ID2-2" 「商品コード」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID2-2" 「商品コード」の検索に利用○○
2-4店舗複数選択(セレクトボックス)---在庫分割・結合登録 編集（分割）の "識別ID1-3" 「店舗」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-3" 「店舗」の検索に利用○○
2-5在庫区分チェックボックス---在庫分割・結合登録 編集（分割）の "識別ID1-4" 「在庫区分」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-4" 「在庫区分」の検索に利用○○
2-6タイプチェックボックス---在庫分割・結合登録 編集（分割）の "識別ID1-2" 「処理タイプ」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-2" 「処理タイプ」の検索に利用○○
2-7ステータスチェックボックス---在庫分割・結合登録 編集（分割）の "識別ID1-5" 「ステータス」の検索に利用
選択肢（分割）：新規登録、分割承認待ち、却下、入庫完了
在庫分割・結合登録 編集（結合）の "識別ID1-5" 「ステータス」の検索に利用
選択肢（結合）：新規登録、結合元登録、結合承認待ち、却下、入庫完了○○
詳細検索条件
3-1登録日(From)日付（yyyy/mm/dd）---在庫分割・結合登録 編集（分割）の "識別ID1-6" 「登録日」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-6" 「登録日」の検索に利用
期間の開始日、カレンダー選択機能あり○○
3-2登録日(To)日付（yyyy/mm/dd）---在庫分割・結合登録 編集（分割）の "識別ID1-6" 「登録日」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-6" 「登録日」の検索に利用
期間の終了日、カレンダー選択機能あり○○
3-3登録者文字列---共通処理識別ID1-1, 1-2参照
在庫分割・結合登録 編集（分割）の "識別ID1-9" 「登録者」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-9" 「登録者」の検索に利用○○
3-4承認日(From)日付（yyyy/mm/dd）---在庫分割・結合登録 編集（分割）の "識別ID1-8" 「承認日」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-8" 「承認日」の検索に利用
期間の開始日、カレンダー選択機能あり○○
3-5承認日(To)日付（yyyy/mm/dd）---在庫分割・結合登録 編集（分割）の "識別ID1-8" 「承認日」の検索に利用
在庫分割・結合登録 編集（結合）の "識別ID1-8" 「承認日」の検索に利用
期間の終了日、カレンダー選択機能あり○○
3-6承認者文字列---共通処理識別ID1-1, 1-2参照
在庫分割・結合登録 編集（分割）の "識別ID1-11" 「承認者」の検索に利用
```

</details>
