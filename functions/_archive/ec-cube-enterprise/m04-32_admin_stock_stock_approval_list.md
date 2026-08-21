# m04-32_admin_stock_stock_approval_list — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 承認一覧

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
