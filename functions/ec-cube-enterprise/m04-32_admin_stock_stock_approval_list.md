# 在庫管理 — 承認一覧

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 承認一覧 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockApprovalListController` / `SearchStockApprovalListType` / `DtbStockApprovalListRepository` / `StockApprovalListUpdateAction` / `ApprovalListRowBuilder` / `StockEditLineItemRowBuilder` / `StockApprovalListCsvExportService` / `StockApprovalLineItemsCsvExportService` / Entity `DtbStockApprovalList`・`DtbStockEditApproval`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 承認一覧

### 機能の目的と役割

在庫編集・在庫一括編集・在庫変更CSV登録・在庫移動・在庫振替・在庫分割・在庫結合といった在庫変動の「承認待ち」情報を一覧表示し、検索条件で絞り込んだうえで一括承認・一括却下を行う管理画面機能。承認対象ごとに承認状態・承認対象種別・店舗/在庫区分・対象商品規格数・合計在庫増減数・合計総原価増減数・在庫変動区分・登録日/登録者・承認日/承認者を表示し、在庫編集系の明細はモーダルで参照できる。検索結果の一覧CSV、およびモーダル明細の全件CSVを出力できる。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。画面・項目・承認/却下の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・検索条件・DBカラム・処理順序・並び順はリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 承認一覧の入口（検索・ページング・表示件数）と一覧表示項目・表示順
- 検索条件（フォームキー付き）と検索のセッション保持
- 一括承認・一括却下のアクションと権限判定・トランザクション
- 在庫編集系明細モーダル（Ajax）の表示・ページング
- 検索結果一覧CSV出力、明細CSV出力（出力列・ファイル名）
- 入力不備・権限なし・セッション不整合・例外時の扱い

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能・共通設計を正とする。

- 在庫編集（M04-02）・在庫一括編集（M04-03）・在庫変更CSV登録・在庫移動振替（M04-09）・在庫分割結合（M04-13）など承認対象の登録元機能、および各承認画面（`admin_stock_move` / `admin_stock_transfer` / `admin_stock_split_approval` / `admin_stock_join_approval`）の仕様
- 承認確定後の在庫数・総原価・在庫変動履歴の再計算ロジック詳細（`StockEditApprovalLineItemApprover` / `StockEditApprovalLineItemRejecter`、別添「在庫変動時の履歴作成について」を正とする）
- スマレジ連携（在庫区分スマレジ時の連携・連携失敗ステータス）。最新Excelの検索条件（識別ID 1-4）は未承認／承認済／却下済の3択へ更新され、実装の3値と一致する。一方、同じExcelの検索結果側にはスマレジ連携中・連携失敗を前提とする旧記述が一部残るため、実装済みとは扱わない。0501_基本設計仕様書(API_在庫管理) を正とする。
- ステータス変更通知メール（却下理由のメール本文への付与含む）。実装側に却下理由保存は未実装（Controller 内 TODO コメント）。
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 承認一覧トップ／検索 | `GET,POST /%admin%/product/stock/approval_list`（`admin_stock_approval_list`） | GETは検索条件をセッションから復元して表示（未保持時はログインメンバーのデフォルト店舗で初期検索）、POSTは検索実行。検索条件をセッションに保存し1ページ目を表示する。テンプレート `@admin/Stock/approval_list.twig`。 |
| ページ送り | `GET,POST /%admin%/product/stock/approval_list/page/{page_no}`（`admin_stock_approval_list_page`） | セッションの検索条件を復元し、指定ページを表示する。 |
| 表示件数変更 | `GET,POST /%admin%/product/stock/approval_list/page/{page_no}/count/{page_count}`（`admin_stock_approval_list_page_count`） | `page_count` が表示件数マスタ（`mtb_page_max`）に一致すれば採用しセッション保存、なければ既定件数（`eccube_default_page_count`）に丸める。 |
| 検索結果CSV出力 | `GET /%admin%/product/stock/approval_list/csv`（`admin_stock_approval_list_csv`） | セッションの検索条件で検索結果全件をCSV出力する（ページングに依らず全件）。 |
| 一括承認・一括却下 | `POST /%admin%/product/stock/approval_list/updated`（`admin_stock_approval_list_update`） | `approval_list_ids[]` と `approval_list_status`（2=承認 / 3=却下）を受けて一括処理し、一覧へリダイレクト。 |
| 明細モーダルHTML取得 | `POST /%admin%/product/stock/approval_list/line_items`（`admin_stock_approval_list_line_items`） | Ajax専用。選択した承認一覧IDと明細総件数をセッションに保持し、在庫編集系明細テーブルHTML（`@admin/Stock/approval_list_line_items.twig`）の1ページ目を返す。 |
| 明細モーダルのページ切替 | `GET /%admin%/product/stock/approval_list/line_items/page/{page_no}`（`admin_stock_approval_list_line_items_page`） | Ajax専用。セッションの承認一覧IDで指定ページの明細HTMLを返す。 |
| 明細CSV出力 | `GET /%admin%/product/stock/approval_list/line_items/csv`（`admin_stock_approval_list_line_items_csv`） | セッションの承認一覧IDに紐づく在庫編集明細を表示上限を超えた件数も含め全件CSV出力する。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。すべて管理画面ログインを要する。明細モーダル系（`line_items` / `line_items_page`）は `XMLHttpRequest` かつ CSRF トークン有効でなければ空レスポンスを返す。

### 画面表示・一覧項目

一覧行は `ApprovalListRowBuilder::build()` がエンティティから組み立てる。

| 観点 | 内容 |
|------|------|
| デフォルト表示 | 検索条件がセッションに無い場合、ログインメンバーの所属店舗（`BaseInfo`）を `base_info` 初期値として検索する（`getDefaultSearchViewData()`）。 |
| 表示順 | 承認日 `approved_date` 降順 → 登録日 `registered_date` 昇順 → ID 昇順。承認日が空（未承認等）のレコードが上位、承認済/却下は承認日の新しい順、同日時はID昇順で安定化する（PostgreSQL の DISTINCT 制約のため CASE は用いずカラムのみで実装）。 |
| 一覧項目 | チェックボックス（一括操作用）／承認状態（`approval_status_label`）／承認対象（`approval_target_label`、種別によりリンク・別タブ）／店舗（`store_name`）／在庫区分（`stock_location_name`）／対象商品規格数（`target_product_count`）／合計在庫増減数（`total_change_quantity`）／合計総原価増減数（`total_cost_change`、`¥`書式）／在庫変動区分（`change_type_detail_name`、親/子）／登録日／登録者／承認日／承認者。 |
| 検索結果件数 | 画面に「検索結果：N件が該当しました」を表示（`totalCount`）。 |
| 表示件数 | 既定 `eccube_default_page_count`（テスト上は10件）。選択肢は表示件数マスタ（`mtb_page_max`）。 |

承認対象（`approval_target_label`）とリンクの細分化（`ApprovalListRowBuilder`）:

| 履歴登録区分（`history_source_type_id`） | ラベルキー | リンク先 | 開き方 |
|------|------|------|------|
| 在庫編集 (1) / 在庫一括編集 (2) / 在庫変更CSV登録 (3) | `approval_target_stock_edit` / `_bulk_edit` / `_csv` | `#`（押下で明細モーダル表示） | 同一タブ |
| 在庫移動 (5) | `approval_target_stock_move`（親区分が移動の場合） | `admin_stock_move`（`id`=履歴登録元ID） | 別タブ |
| 在庫振替 (6) | `approval_target_stock_transfer`（親区分が振替の場合） | `admin_stock_transfer` | 別タブ |
| 在庫分割 (7) | （分割ラベル） | `admin_stock_split_approval` | 別タブ |
| 在庫結合 (14) | （結合ラベル） | `admin_stock_join_approval` | 別タブ |

合計在庫増減数・合計総原価増減数・在庫変動区分は、一覧（`ApprovalListRowBuilder`）では在庫編集・一括編集・変更CSV・分割・結合で表示し、それ以外（移動・振替）は `-`。検索結果CSV（`StockApprovalListCsvExportService`）では在庫編集・一括編集・変更CSVのみ数値・区分を出力し、分割・結合・移動・振替は `-` を出力する（一覧とCSVで分割・結合の扱いが異なる点に注意）。

一括操作対象（チェックボックス活性 `is_bulk_actionable`）の条件: 履歴登録区分が在庫編集/在庫一括編集/在庫変更CSV登録、かつ承認状態が未承認、かつ登録者がログインユーザーと異なる場合のみ。スマレジ連携失敗時の活性化は未実装（TODO）。

### 検索条件

`SearchStockApprovalListType`（ブロックプレフィックス `admin_search_stock_approval_list`）で受け取り、`DtbStockApprovalListRepository::getQueryBuilderBySearchDataForAdmin()` が QueryBuilder を組み立てる。在庫項目同士は AND、複数選択内は IN（OR）。

| 項目（フォームキー） | 形式 | 検索仕様 |
|----------------------|------|----------|
| 店舗 `base_info` | EntityType（BaseInfo・複数） | 店舗ID IN。未指定時はログインメンバー所属店舗が初期値。 |
| 在庫区分 `stock_location_id` | チェックボックス（複数、1=EC-CUBE / 2=スマレジ） | `stock_location_id` IN。 |
| 承認対象の絞り込み `filter_approval_target` | チェックボックス | ON時は承認ステータス=未承認(1)のみに絞り込む。 |
| 承認ステータス `approval_status` | チェックボックス（複数、1=未承認 / 2=承認済 / 3=却下） | `approval_status` IN。複数時OR。 |
| 在庫変動区分 `stock_change_type_detail` | EntityType（`MtbStockChangeTypeDetail`・複数） | 親区分が入庫（BE_STOCKED）/廃棄（DISPOSAL）の子区分を選択肢とし、`StockTransferTypeDetail` IN。 |
| 登録者（所属選択）`registered_department` | ChoiceType（単一） | 画面上で登録者メンバー候補を所属で絞る補助項目（`data-department`）。リポジトリ検索条件には未使用。 |
| 登録者（メンバー選択）`registered_member` | ChoiceType（複数・値はメンバーID） | `RegisteredMember` IN。 |
| 承認者（所属選択）`approval_department` | ChoiceType（単一） | 承認者メンバー候補を所属で絞る補助項目。リポジトリ検索条件には未使用。 |
| 承認者（メンバー選択）`approval_member` | ChoiceType（複数・値はメンバーID） | `ApprovalMember` IN。 |
| 登録日 `registered_date_start` / `registered_date_end` | DateType（single_text） | `registered_date >= start 00:00:00` / `< end 23:59:59`。From>To はフォームエラー `admin.common.date_end_error`。 |
| 承認日 `approved_date_start` / `approved_date_end` | DateType（single_text） | `approved_date >= start 00:00:00` / `< end 23:59:59`。From>To はフォームエラー。承認日が空の行は出力されない。 |

注: 承認ステータスの検索選択肢は、最新Excel識別ID 1-4と実装の双方で3値（未承認／承認済／却下）。ただしExcelの検索結果シートにはスマレジ連携中・スマレジ連携失敗を含む表示条件や処理説明が残る。これら2状態は実装未確認であり、実装済みとして扱わない。検索条件「クリア」リンクは画面側制御。

### プロセスフロー（一覧）

1. リクエスト受信。`page_count` 指定時は `mtb_page_max` 照合し採用値をセッション `eccube.admin.stock.approval_list.search.page_count` に保存。`page_no` をセッション `...search.pageNo` に保持。
2. **POST（検索実行）**: `SearchStockApprovalListType` を検証。妥当なら `page_no=1` にし、フォームのビューデータをセッション `eccube.admin.stock.approval_list.search.search` に保存。検証エラー時は `has_errors=true`・空一覧・件数0で同一画面を再表示。
3. **GET**: セッションの検索条件を復元（無ければデフォルト店舗で初期検索データを生成）し、CSRFトークンを補完して `submit()`、再びセッションへ保存。
4. 復元/検証済みの `searchData` で `getQueryBuilderBySearchDataForAdmin()` → `paginate($qb, $pageNo, $pageCount)`。
5. `ApprovalListRowBuilder::build()` で表示行を構築し、`totalCount`・ページャ・検索フォーム・表示件数マスタを画面へ返す。

### 一括承認・一括却下（`update` → `StockApprovalListUpdateAction`）

1. `approval_list_ids[]`（正の整数のみ抽出）と `approval_list_status`（2=承認 / 3=却下）、ログインメンバーを `StockApprovalListUpdateInput` に詰める。
2. 権限判定 `isGrantedForStockApprovalList()`:
   - 対象IDが空、またはログインメンバーが登録者である行が1件でも含まれる場合は不許可（`countByRegisteredMemberId > 0`）。
   - 承認可能件数（`countApprovableByMemberId`: 登録者本人でない・対象店舗に所属・承認権限ロールを持つ ＝ `deny_url='/approval_authority'` を持たない）が対象件数と一致しない場合は不許可。
   - 不許可時は `errorMessage = admin.stock.approval_list.not_granted` を返し、Controller が `addError` のうえ一覧へリダイレクト。
3. トランザクション開始（`beginTransaction`）。対象IDごとに `DtbStockApprovalList` を取得し、履歴登録区分が在庫編集/在庫一括編集/在庫変更CSV登録のもののみ処理（それ以外はスキップ）。
4. `DtbStockApprovalList` の `approval_status` / `approved_date`（現在時刻）/ `approval_member`（ログインメンバー）を更新。対応する `DtbStockEditApproval`（`history_source_id` で取得）の `approval_status` / `approval_member` / `approved_at` も更新。
5. 明細 `DtbStockEditApprovalDetail`（`findByStockEditApprovalId`）ごとに、承認時は `StockEditApprovalLineItemApprover::approve()`、却下時は `StockEditApprovalLineItemRejecter::reject()` を実行（在庫数・総原価・在庫変動履歴の更新は各 Util を正とする）。
6. `flush()` → `commit()`。例外時は `rollback()` して再スロー。Controller 側で例外を捕捉し、入荷通知バッファ（`RestockNotificationProductClassIdsBuffer`）を `clear()` のうえ `admin.common.save_error` を表示して一覧へリダイレクト。
7. 正常時は `EccubeEvents::ADMIN_STOCK_APPROVAL_LIST_UPDATE_COMPLETE` を dispatch し、`admin.common.save_complete` を表示して一覧へリダイレクト。

### 在庫編集系明細モーダル（`line_items`）

- **POST**（モーダル初回）: `approval_list_ids[]`（正整数）をセッション `eccube.admin.stock.approval_list.line_items.ids` に保存、明細総件数（`countStockEditLineItemsForApprovalListIds`）を `...line_items.total` に保存し1ページ目を返す。
- **GET**（ページ切替）: セッションの承認一覧IDで指定ページを返す。
- 明細取得は `createDbalQueryBuilderForStockEditLineItems()`（表示上限 `eccube_admin_stock_approval_modal_line_items_display_max` でサブクエリ制限 → `eccube_admin_stock_approval_modal_line_items_per_page` でページング）。対象は履歴登録区分=在庫編集/在庫一括編集/在庫変更CSV登録のみ。行は `StockEditLineItemRowBuilder::buildFromRawRows()` で整形。
- 明細表示項目: 商品名/商品コード・言語・状態（カードコンディション）・Foil・店舗/在庫区分・編集前在庫・編集後在庫・在庫増減数・仕入単価・総原価増減・編集前総原価・編集後総原価・在庫変動区分・在庫変更理由。金額は `¥` + 桁区切り（仕入単価は小数2桁）。

### CSV出力

#### 検索結果CSV（`StockApprovalListCsvExportService::exportBySearchParameters`）

- 対象: セッションの検索条件に一致する承認一覧の**全件**（一覧のページングに依らない）。
- ファイル名: `stock_approval_list_YmdHis.csv`（`Content-Disposition: attachment`、`application/octet-stream`）。
- 文字コード・区切り: 共通の `CsvExportService::fputcsv()` に従う（`eccube_csv_export_encoding` 既定 SJIS-win、`eccube_csv_export_separator`）。
- 出力列（`CSV_HEADER`、15列）: 承認状態 / 承認対象 / 店舗 / 在庫区分 / 対象商品規格数 / 合計在庫増減数 / 合計総原価増減数 / 在庫変動区分（親区分）/ 在庫変動区分（子区分）/ 登録日（`Y/m/d H:i`）/ 登録者 / 承認日（`Y/m/d H:i`、空は `-`）/ 承認者（未承認等は「承認待ち」）/ 最終更新日 / 最終更新者。
- 整形: 在庫編集/一括編集/変更CSV以外は合計在庫増減数・合計総原価増減数・在庫変動区分（親/子）を `-`。承認者が空なら `admin.stock.approval_list.approval_waiting`（承認待ち）を出力。最終更新日・最終更新者は現状固定で `-`（実装上ハードコード、要確認）。

#### 明細CSV（`StockApprovalLineItemsCsvExportService::exportByApprovalListIds`）

- 対象: 直前の明細モーダルPOSTでセッション保持した承認一覧IDに紐づく在庫編集明細の**全件**（表示上限を超えた件数も含む）。セッションに承認一覧IDが無い場合は `admin.stock.approval_list.csv_export_no_session` を表示して一覧へリダイレクト。
- ファイル名: `stock_approval_line_items_YmdHis.csv`。文字コード・区切りは検索結果CSVと同様に共通サービスに従う。
- 出力列（`CSV_HEADER`、14列、ヘッダは `messages` ドメイン翻訳）: 商品名/コード・言語・状態・Foil・店舗/在庫区分・編集前在庫・編集後在庫・在庫増減数・仕入単価・総原価増減・編集前総原価・編集後総原価・在庫変動区分・在庫変更理由。

### 分岐・遷移・例外

- **検索入力不備**: 登録日・承認日の From>To はフォームエラー `admin.common.date_end_error`。POST検証エラー時はリダイレクトせず `has_errors=true`・空一覧で同一画面を再表示。
- **一括承認/却下の権限なし**: `admin.stock.approval_list.not_granted` を表示し一覧へリダイレクト。登録者本人による自己承認/却下、承認権限ロールなしは不許可。
- **一括処理の例外**: `admin.common.save_error` を表示し入荷通知バッファをクリアのうえ一覧へリダイレクト（トランザクションはロールバック）。
- **明細モーダルの不正リクエスト**: 非Ajaxまたはトークン無効は空レスポンス（`Response('')`）。
- **明細CSVのセッション欠落**: `admin.stock.approval_list.csv_export_no_session` を表示し一覧へリダイレクト。
- **表示件数の不正値**: `mtb_page_max` に無い値は既定件数へ丸める。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 参照系 | 一覧表示・検索・明細モーダル・各種CSV出力は参照のみ。検索条件・ページ番号・表示件数・明細選択IDをセッションに保持する。 |
| 更新系（一括承認/却下） | 承認一覧 `dtb_stock_approval_list`（`approval_status` / `approved_date` / `approval_member_id`）と在庫編集承認 `dtb_stock_edit_approval`（`approval_status` / `approved_at` / `approval_member_id`）を更新。明細 `dtb_stock_edit_approval_detail` を起点に在庫数・総原価・在庫変動履歴を `StockEditApprovalLineItemApprover` / `...Rejecter` が更新する（更新の細部は各 Util と「在庫変動時の履歴作成について」を正とする）。 |
| セッションキー | 検索条件 `eccube.admin.stock.approval_list.search.search` / ページ `...search.pageNo` / 表示件数 `...search.page_count` / 明細選択ID `eccube.admin.stock.approval_list.line_items.ids` / 明細総件数 `...line_items.total`。 |

### 関連設計への接続点

- 画面項目・一覧列・CSV列・モーダルレイアウトの詳細は、参照元Excel設計書（在庫編集承認一覧 検索入力／検索結果シート、承認一覧CSV出力シート）を正とする。
- 承認対象リンク先（移動 `admin_stock_move`・振替 `admin_stock_transfer`・分割 `admin_stock_split_approval`・結合 `admin_stock_join_approval`）は各登録元機能の設計を正とする。
- URLエンドポイント・検索条件・DBカラム・処理順序・並び順は `../ec-cube-enterprise` の `StockApprovalListController` / `SearchStockApprovalListType` / `DtbStockApprovalListRepository` / `StockApprovalListUpdateAction` / `ApprovalListRowBuilder` / CSV出力サービス・Entity 実装を正とする。

## 表示メッセージ

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-32-MSG-001 | 管理画面上部 | 在庫編集の承認権限がありません。 | （英訳なし） | 選択した承認対象に、承認できないものが含まれるとき | 承認一覧画面に遷移する |
| M04-32-MSG-002 | 管理画面上部 | 承認一覧IDが指定されていません。 ／ 在庫編集の承認権限がありません。 | （英訳なし） | 一括承認または一括却下を実行したとき、承認一覧を選択していない場合 ／ 在庫編集の承認権限がない場合 | 承認一覧画面に遷移する |
| M04-32-MSG-003 | 管理画面上部 | 保存に失敗しました | （英訳なし） | 承認内容を保存するときにエラーが起きたとき | 承認一覧画面に遷移する |
| M04-32-MSG-004 | 管理画面上部 | 保存しました | （英訳なし） | 承認内容を保存したとき | 承認一覧画面に遷移する |
| M04-32-MSG-005 | 管理画面上部 | 明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。 | （英訳なし） | 明細CSVをダウンロードするとき、選択情報がないとき | 承認一覧画面に遷移する |
| M04-32-MSG-006 | 画面中央(ダイアログ) | 却下理由は入力必須です | （英訳なし） | 却下理由を入力せずに却下するとき | 現在の画面に留まる |
| M04-32-MSG-007 | 確認モーダル内(明細エリア) | 読み込みに失敗しました。しばらく経ってから再度お試しください。 | （英訳なし） | 明細を読み込むときにエラーが起きたとき | モーダルは開いたまま |
| M04-32-MSG-008 | 画面中央(ダイアログ) | 却下理由は入力必須です | （英訳なし） | 却下理由を入力せずに却下するとき | 現在の画面に留まる |
| M04-32-MSG-009 | 入力項目直下/フォーム上部 | 終了日は、開始日より大きく設定してください | （英訳なし） | 登録日の開始日を終了日より後に指定したとき | エラーを表示して承認一覧画面に留まる |
| M04-32-MSG-010 | 入力項目直下/フォーム上部 | 終了日は、開始日より大きく設定してください | （英訳なし） | 承認日の開始日を終了日より後に指定したとき | エラーを表示して承認一覧画面に留まる |
| M04-32-MSG-011 | 画面中央(ダイアログ) | 明細がありません。 | （英訳なし） | 承認明細モーダルで取得した明細件数が0件のとき | 明細なしを表示し、承認明細モーダルに留まる |
| M04-32-MSG-012 | 画面中央(ダイアログ) | 参照している在庫情報が表示上限（%max%件）を超えているため、全件を確認する場合はCSVダウンロードして確認してください。 | （英訳なし） | 承認明細の総件数がモーダル表示上限を超えたとき | CSVダウンロードで全件確認を促し、承認明細モーダルに留まる |
| M04-32-MSG-013 | 画面中央(モーダル) | 本当に承認してもよろしいですか？ | （英訳なし） | 承認一覧で、1件または複数件の承認対象を選択して確認モーダルを開き、承認するボタンを押したとき。 | OKで選択した対象の承認処理をPOSTし、処理結果のメッセージを表示して承認一覧へ遷移する。キャンセル時は処理せずモーダルを閉じる。 |
| M04-32-MSG-014 | 画面中央(モーダル) | 本当に却下してもよろしいですか？ | （英訳なし） | 承認一覧で、1件または複数件の承認対象を選択して確認モーダルを開き、却下理由を入力して却下するボタンを押したとき。 | OKで選択した対象の却下処理をPOSTし、処理結果のメッセージを表示して承認一覧へ遷移する。キャンセル時は処理せずモーダルを閉じる。 |

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に対応する機能は存在しない。仕様は基本設計仕様書を正とする。

移行先 ec-cube-enterprise には承認一覧の実装があり、DB関連の記述はこれを正とする。承認対象の一覧情報は在庫承認一覧（テーブル `dtb_stock_approval_list`）に保持し、承認ステータスは列 `approval_status`（1=未承認 / 2=承認済 / 3=却下）、登録日は列 `registered_date`、承認日は列 `approved_date`、登録者は列 `registered_member_id`、承認者は列 `approval_member_id`、対象商品規格数は列 `product_stock_total_count`、合計在庫増減数は列 `inventory_change_total_count`、合計総原価増減数は列 `total_cost_price_before`、店舗は `base_info_id`、在庫区分は `stock_location_id`、承認対象種別は `history_source_type_id`（`mtb_stock_history_source_type`）、在庫変動区分は `stock_transfer_type_detail_id`（`mtb_stock_change_type_detail`）、登録元IDは `history_source_id` である。在庫編集の承認待ち情報は在庫編集承認（テーブル `dtb_stock_edit_approval`、明細は `dtb_stock_edit_approval_detail`）で保持し、承認者は列 `approval_member_id`、承認日は `approved_at` である。列の型・桁・制約の細部は ec-cube-enterprise の Entity / Repository / Migration を正とする。

### 実装要確認の残点

- 最新Excelの検索条件は3値（未承認／承認済／却下済）で実装と一致するが、検索結果側の説明・表示条件には「スマレジ連携中・スマレジ連携失敗」が残存する。Excel内の不整合であり、実装は3値のみ。残存記述を根拠に2状態を実装済みとは判定しない。
- 却下理由の保存・却下時のステータス変更通知メール（メールテンプレート・却下理由のタグ付与）はExcel設計が要求するが実装は未対応（Controller 内 TODO）。**Excelを正とし、実装側で追加が必要。**
- 検索結果CSVの「最終更新日・最終更新者」列は現状固定 `-`。Excelが値出力を求める場合はExcelを正とし、実装側の是正対象とする（要確認）。
- 一覧（`ApprovalListRowBuilder`）は在庫分割・結合でも合計値・在庫変動区分を表示するが、検索結果CSVは在庫編集/一括編集/変更CSVのみ表示し分割・結合は `-`。仕様上の正否は要確認。

---

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫編集承認一覧(検索入力)
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
佐藤
作成日
2025/8/25
更新者
加藤
更新日
2025-11-04
機能No
M04-38
機能名
在庫編集承認一覧(検索入力)
概要
在庫編集の承認一覧の検索フォーム
処理概要
図形・テキストボックス内テキスト（16件）
レイアウト図
1-1
1-2
1-4
1-6
1-10
1-7
1-12
1-14
2-1
2-2
1-5
1-3
1-9
1-13
1-8
1-11
在庫編集承認一覧(検索入力) / B7 / image 1
機能仕様処理概要
1.初期処理
1-1.アクセス時に、初期値を用いて検索が行われた状態を表示する
2.検索処理
2-1.在庫承認一覧データに対して、検索条件フォームに入力された内容を用いて検索を行う
2-2.在庫項目同士の条件はAND条件とする
例）店舗(入力値:A店舗)と在庫区分(入力値:EC-CUBE)にそれぞれ値が入力されて場合、A店舗かつEC-CUBEの情報のみに絞り込む
2-3.それぞれの項目の検索チェックについては画面部品一覧表の必須・最大値・画面部品の説明に記載されている条件に従い処理を行う
2-4.検索が完了したらページを再描画し、検索結果の件数表示と、検索した結果の一覧を表示する
識別IDラベル書式・制限必須最大値初期値画面部品の説明
検索条件フォーム
1-1店舗複数選択(セレクトボックス)--ログインしているメンバーのデフォルト検索表示店舗共通処理識別ID1-3参照
1-2在庫区分チェックボックス---共通処理識別ID1-4参照
1-3承認対象の絞り込みチェックボックス--承認可能な在庫のみ表示選択肢:承認可能な在庫のみ表示
チェックがついている場合下記の処理を行う
・検索時に識別ID:1-1で選択された中で、
ログインしているメンバーの承認権限を持っている承認対象かつ、承認状態が未承認のみを絞り込む
・識別ID:1-4承認ステータスは選択できないようにし、検索条件から除外する
1-4承認ステータスチェックボックス---選択肢:未承認,承認済,却下済
複数チェックが入力されている場合はOR条件とする
※全てチェックが入っている際は、全てチェックが無いのと同じ条件となる
1-5在庫変動区分単一選択(セレクトボックス)---「在庫編集」シート識別ID:3-1在庫変動区分を参照
1-6登録者（所属選択）単一選択(セレクトボックス)---共通処理識別ID1-1参照
1-7登録者（メンバー選択）複数選択(セレクトボックス)---共通処理識別ID1-2参照
1-8登録日(from）日時(YYYY/MM/DD HH:mm)-~9999/12/31 23:59-登録日(From)>登録日(To)の場合エラーとし検索を行わない
入力された日時以降を検索対象に含めます（入力した日時も含む）
1-9登録日(to)日時(YYYY/MM/DD HH:mm)-~9999/12/31 23:59-入力した日時以前を検索対象に含めます（入力した日時も含む）
1-10承認者（所属選択）単一選択(セレクトボックス)---共通処理識別ID1-1参照
1-11承認者（メンバー選択）複数選択(セレクトボックス)---共通処理識別ID1-2参照
1-12承認日(from）日時(YYYY/MM/DD HH:mm)-~9999/12/31 23:59-承認日(From)>承認日(To)の場合エラーとし検索を行わない
入力されている場合、承認日が空のものは検索結果として出力されない
1-13承認日(to)日時(YYYY/MM/DD HH:mm)-~9999/12/31 23:59-入力した日時以前を検索対象に含めます（入力した日時も含む）
入力されている場合、承認日が空のものは検索結果として出力されない
1-14検索条件をクリアリンク---押下すると1-1~1-13の内容を空にする
検索条件フォーム外
2-1検索ボタン---押下すると検索処理を実行する
2-2検索結果件数文字列---検索処理実行後の件数を表示する
図形・テキストボックス内テキスト（16件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
B7(1-1)
B7(1-2)
B7(1-4)
B7(1-6)
B7(1-10)
B7(1-7)
B7(1-12)
B7(1-14)
B7(2-1)
B7(2-2)
B7(1-5)
B7(1-3)
B7(1-9)
B7(1-13)
B7(1-8)
B7(1-11)
在庫編集承認一覧(検索結果)
ドキュメント名
在庫管理 基本設計
セクション
—
プロジェクト名
サイトリニューアル
作成者
佐藤
作成日
2025/8/25
更新者
加藤
更新日
2025-11-07
機能No
M04-38
概要
在庫編集の承認一覧
処理概要
図形・テキストボックス内テキスト（37件）
在庫編集承認一覧(検索結果)
レイアウト図 検索結果一覧
2-1
1-1
1-2
1-3
2-2
2-3
2-4
2-5
2-6
2-7
2-8
2-9
2-10
2-11
2-12
3-1
1-4
在庫編集承認一覧(検索結果) / B8 / image 2
機能仕様処理概要
1.一覧表示
1-1.検索した結果の承認一覧を表示 ※画面部品一覧にて詳細記載
1-2.承認状態が「未承認」の状態が長くなっているものを優先的に上に表示し、履歴として参照したい「承認済」/「却下済」は新しい順で表示できるよう下記のソート順とする
1-2-1.承認状態が「未承認」「スマレジ連携中」「スマレジ連携失敗」のレコードを最上位に表示（承認日が空のもの）また、承認日が空のもの同士では「登録日が古い順」に並べる
1-2-2.承認状態が「承認済」/「却下済」レコードについては、「承認日が新しい順」で表示（履歴として直近の操作を上に表示）
1-2-3.登録日または承認日が同一のレコードが存在する場合、表示順が不定にならないよう、在庫編集承認ID（レコード登録順）をサブソート条件として追加し、昇順にて制御を行う
2.承認権限制限
2-1.ログインしているメンバーが承認権限を所持している店舗の在庫のみ、3.承認処理、4.却下処理を実行できる
2-2.権限がなく承認/却下ができない場合はエラーとする
2-3.ログインしているメンバーが登録者の場合、3.承認処理・4.却下処理を実行しようとした場合、実行前にエラーとする
3.承認処理
3-1.在庫変更理由の親区分が「入庫」の場合、承認となった承認対象の在庫情報を更新する
3-1-1.承認対象の入庫承認待ち在庫情報に登録された在庫増減数から現在庫数を計算し、登録する
※計算式は、「登録時点での在庫数+在庫増減数」とする
3-1-2.承認対象の在庫の総原価を計算し登録する
※計算式は「別添資料_在庫変動時の履歴作成について」シートの「⑤在庫変更のタイミングで必ず対象在庫の総原価の更新を行う」【入庫時】【出庫時】を参照
※「在庫変動時の履歴作成について」シートの「2. 在庫変更のタイミング別の機能と履歴登録例について」【入庫時】【在庫調整による減少（廃棄）】を参照
3-2.在庫区分が「スマレジ」の場合、更新後の在庫数をスマレジに連携する
※連携処理は、0501_基本設計仕様書(API_在庫管理).xlsxの「スマレジ連携処理」シートの「3. ECCUBE -> スマレジ連携(Patch一括) 処理概要」を参照
3-2-1.スマレジ連携時に、EC-CUBEとの在庫差異があった場合は、在庫情報更新前にスマレジ在庫修正処理（「共通処理」シートの「1.スマレジ在庫修正処理」を参照）を行う
3-2-2.スマレジ連携時に、連携失敗した際は、承認ステータスを「スマレジ連携失敗」とする
3-3.3-1または3-2の処理完了後に、在庫変動履歴の更新を行う
3-3-1.更新時に、3-1,3-2にて更新された情報に加え、更新された更新日と、ログインしているメンバーを更新者として更新する
3-4.入庫承認待ち在庫情報を論理削除する
3-5.在庫変更理由の親区分が「廃棄」の場合、承認となった承認対象の在庫情報履歴を更新する
3-5-1.更新対象として承認押下時の承認日とログインユーザーを承認者として更新する
3-5-2.更新時に、更新された更新日と、ログインしているメンバーを更新者として更新する
4.却下処理
4-1.在庫変更理由の親区分が「入庫」の場合、却下となった承認対象の在庫情報の更新を行わない
4-2.承認待ちから却下となった在庫の入庫承認待ち在庫情報の承認状態を却下に更新する（この画面以外での在庫変動履歴を参照する画面で表示しないようにするため）
4-3.在庫編集承認一覧の情報は操作ステータスを却下の状態に変更して情報を残す
4-4.在庫変更理由の親区分が「廃棄」の場合、却下となった承認対象の在庫情報の更新処理を行う
4-4-1.承認対象の在庫変動履歴に登録された在庫増減数から現在庫数を計算し、登録する
※計算式は、「却下時点での在庫数+(在庫増減数*-1)」とする
4-4-2.承認対象の在庫の総原価を計算し登録する
※計算式は、「却下時点での在庫の総原価+(総原価増減数*-1)」とする
4-4-3.4-4-2の処理完了後に、在庫変動履歴の更新を行う
更新対象としては、4-4-1、4-4-2で更新した情報に加え、更新された更新日と、ログインしているメンバーを更新者として更新する
5.ステータス変更時の通知
5-1.識別ID2-9登録者に紐づいているメールアドレスを用いてステータス変更のメールにて通知を行う
5-2.メールを送付する際は、承認ステータス変更時用のメールテンプレートを用いて送付を行う
5-2-1.却下の場合、識別ID6-1 却下理由をメール本文に加える。※メールテンプレート内にて表示位置をタグ指定する
識別IDラベル書式・制限必須最大値初期値画面部品の説明
一覧上部表示項目
1-1一括却下ボタン---2-1のチェックボックスで選択したデータを一括で却下対象とし確認モーダルを表示する
1-2一括承認ボタン---2-1のチェックボックスで選択したデータを一括で承認対象とし確認モーダルを表示する
1-3表示件数単一選択（セレクトボックス）--100件EC-CUBE標準のマスタデータ管理の最大ページ表示にて、設定されている表示件数の選択肢を表示する
1-4CSVダウンロードボタン---CSVダウンロードを押下すると、識別ID2-2~2-12の項目でCSVが出力される
出力される情報は検索した結果を出力
※「承認一覧CSV出力」シートにて項目定義
一覧表示項目
2-1チェックボックスチェックボックス---チェックがついている場合、一括承認、一括却下の操作対象となる
チェックボックスが表示される条件は下記とする
・承認状態が「未承認」、「スマレジ連携失敗」
・承認対象が「在庫編集」、「在庫一括編集」、「在庫変更CSV登録」
・登録者がログインしているユーザー以外の場合のみチェックボックスが表示される
ヘッダ行のチェックボックスを押下すると、表示されているページ内のすべての行のチェックボックスに全てチェックを入れ、チェックを外すとすべてのチェックが外れる。
※全てチェックがある場合でも、ヘッダ行にチェックがついていない場合はチェックを入れる動作となり、チェックがついている場合はチェックを外す動作となる。
2-2承認状態文字列---未承認,承認済,スマレジ連携中,スマレジ連携失敗,却下済
2-3承認対象文字列 リンク---承認対象なっている在庫変更手続きが作成された機能名が表示される
承認対象が「在庫編集」、「在庫一括編集」、「在庫変更CSV登録」の場合
・押下すると、押下した承認対象に紐づく在庫変動履歴を確認できる確認モーダルが表示される
それ以外の場合
・当該機能の承認画面を別タブで開く
例）在庫移動であれば押下した在庫移動情報を別タブで開く
2-4店舗/在庫区分文字列---承認対象の在庫の店舗/在庫区分を表示
2-5対象商品規格数数値---承認対象の対象商品規格数を表示
2-6合計在庫増減数数値---承認対象が「在庫編集」、「在庫一括編集」、「在庫変更CSV登録」の場合
承認対象の合計在庫増減数を表示
それ以外の場合
"-"を表示
2-7合計総原価増減数数値---承認対象が「在庫編集」、「在庫一括編集」、「在庫変更CSV登録」の場合
承認対象の合計総原価増減数を表示
それ以外の場合
"-"を表示
2-8在庫変動区分文字列---「在庫編集」シート識別ID:3-1在庫変動区分を参照
承認対象が「在庫編集」、「在庫一括編集」、「在庫変更CSV登録」では無い場合、
移動・振替など2種類以上の在庫変動が承認時に発生し表では表現できないので、"-"を表示
```

</details>
