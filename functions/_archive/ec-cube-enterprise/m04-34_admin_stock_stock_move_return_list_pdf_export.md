# m04-34_admin_stock_stock_move_return_list_pdf_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 戻しリストPDF

### 印刷用データ構造（出力単位）

`StockMoveTransferReturnListPdfFormatter::buildReturnListDataByStockMoveTransferIds($ids)` が、CSVと同じ取得・整形済み行を以下の `ReturnList` 構造へ変換する。

| 要素 | 内容 |
|------|------|
| `createdAt` | 戻しリスト作成日時（`Asia/Tokyo`、`Y/m/d H:i:s`）。 |
| `maxPageRows` | 1ページの最大行数。定数 `MAX_PAGE_ROWS = 30`。 |
| `groups[]` | ピッキング区分（`pickingType`＝金額閾値ラベル／`サプライ`）ごとのグループ。`thresholdLabel` と `pages[]` を持つ。SQL由来の行順をグループ内で維持。 |
| `groups[].pages[]` | グループを30行ごとに分割したページ。`currentPage`／`totalPages`／`items[]`／`pageQuantitySubtotal`（ページ内の数量合計）を持つ。 |
| `pages[].items[]` | 各明細行。`rowNo`（ページ内連番1始まり）／`shelfNumber`／`languageAndCondition`／`storageCode`／`colorAndRarity`／`quantity`／`productName`／`standardPrice`／`remarks`（常に空文字）。`pickingType` はグループ化済みのため各行からは除外。 |

ID未選択時は `groups` 空・`createdAt`／`maxPageRows` のみの構造を返す。

### 帳票レイアウト要素（`return_list.twig`）

テンプレート `@admin/Stock/MoveTransfer/return_list.twig`。CSS は `assets/css/pickinglist.css`（受注ピッキングリストと共通スタイル）。

| Excel識別ID | 要素 | 実装での表現 |
|-------------|------|--------------|
| 1 | 「印刷する」ボタン | `<div class="printBox">` 内の `#printButton`。`printBox` を印刷範囲外とし、押下でブラウザ印刷ダイアログを起動（CSS/JS制御）。 |
| 2 | 商品仕訳（タイトル） | グループ見出し。`thresholdLabel == 'サプライ'` なら「戻しリスト（サプライ）」、それ以外は「戻しリスト（商品単位{閾値ラベル}）」。閾値ラベルは基準価格参照のピッキング区分（`●●円未満`／`●●円以上▲▲円未満`／`■■円以上`）。 |
| 3 | ページング | 見出し横に `{currentPage}/{totalPages}`（閾値グループごとのページ数）。 |
| 4 | 作成日時 | `admin.picking_item_list.create_date`：`ReturnList.createdAt`。 |
| 5 | 行番号 | 列「No」＝`item.rowNo`（ページ内連番）。 |
| 6 | 棚番号 | 列「棚番」＝`item.shelfNumber`（本店のみ。支店は空）。 |
| 7 | 言語/状態 | 列「言語/状態」＝`item.languageAndCondition`（例 `FoilJP/NM`、サプライ品は「サプライ品」）。 |
| 8 | 略称 | 列「略称」＝`item.storageCode`（サプライ品は空）。 |
| 9 | 色/R | 列「色/R」＝`item.colorAndRarity`（サプライ品・色なし商品は空）。 |
| 10 | 数 | 列「数」＝`item.quantity`（3桁区切り、数量が1以外は太字）。 |
| 11 | 商品名 | 列「商品名」＝`item.productName`（非サプライは略称・言語・状態・色・レアリティ除去）。 |
| 12 | 価格 | 列「価格」＝`item.standardPrice`（基準価格）。 |
| 13 | 備考 | 列「備考」＝`item.remarks`（実装は常に空文字）。 |
| 14 | ページ内個数小計 | 表末尾に `admin.picking_item_list.all` + `page.pageQuantitySubtotal` + `count`（ページ内数量合計）。 |

- 1ページ未満の行は `maxPageRows`（30行）まで空行を補完してレイアウトを揃える。
- タイトル文言キー: `admin.stock.move_transfer.return_list.pdf_title`（ページタイトル「戻しリスト」）、`...title_per_item`／`...title_per_supply`。

### プロセスフロー

1. `POST .../return_list_pdf_export` を受信。CSRFトークン検証（`isTokenValid()`）。
2. 共通バリデーション `validateReturnListExportRequest()` を実行（M04-33 と同一）。
   - `ids[]` 空→`admin.stock.move_transfer.return_list_csv_export.no_selection` を表示し `{success:false, redirectUrl}` を返す。
   - `StockMoveTransferReturnListCsvExportService::validateReturnListExportIds($ids, $Member)` でエラーがあれば各メッセージを表示し `{success:false, redirectUrl}` を返す。
3. 検証通過後、`getReturnListExportRows($ids)` の行を `RestockListCsvRowFormatter` で整形し、`StockMoveTransferReturnListPdfFormatter` で閾値グループ化・30行ページ分割。
4. `return_list.twig` を `renderView()` でHTML化し、`{success:true, html:HTML}` をJSONで返す。
5. 画面側JSが別ウィンドウ（ポップアップ）にHTMLを書き込み、`#printButton` で印刷ダイアログを起動する。

### 分岐・遷移・例外

- **選択無し / 検証NG**: HTTP 200 のまま `{success:false, redirectUrl: 一覧ページ}` を返す。`redirectUrl` はセッション `eccube.admin.stock.move_transfer.page_no`（既定1）から `admin_stock_move_transfer_page` を生成。Web テスト `testExportReturnListPdfWithNoSelectionReturnsJsonRedirect` / `...WithValidationErrorsReturnsJsonRedirect` が確認。
- **検証NG時はデータ取得しない**: バリデーションNGでは `getReturnListExportRows` を呼ばない。Web テスト `testExportReturnListPdfWithValidationErrorsDoesNotFetchExportRows`（Repositoryモックで `never()`）が確認。
- **検証OK**: `{success:true, html:string}` を返す。Web テスト `testExportReturnListPdfReturnsHtmlJson` が確認。
- **CSRF不正**: `isTokenValid()` により無効トークンは例外。
- **ポップアップ/取得失敗（画面側）**: `admin.stock.move_transfer.return_list_pdf_export.popup_blocked`（ポップアップブロック時）・`...fetch_failed`（データ取得失敗時）のメッセージキーを用意（画面側で表示）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 戻しリストPDFは**参照のみ**で業務データを更新しない（選択IDから集計してHTMLを生成するだけ。DBへの書き込みは行わない）。 |
| 参照テーブル | M04-33 と同一（`dtb_stock_move_transfer` / `dtb_stock_move_transfer_detail` / 入庫先 `dtb_product_stock` / `dtb_product_class` / `dtb_product` / 入庫先店舗 `dtb_base_info` の `expensive_threshold1〜3` / `mtb_shelf_number`・`mtb_storage_code`・`mtb_language`・`mtb_card_condition`・`mtb_card_detail`・`mtb_rarity`・`mtb_card`・`mtb_color`・`mtb_color_sequence`）。 |
| ログ・履歴 | CSV取込履歴・在庫履歴・ステータス履歴は更新しない。 |

### 関連設計への接続点

- 帳票レイアウト・閾値・並び順の業務要件は参照元Excel設計書（在庫移動戻しリストPDFシート）を正とする。
- URLエンドポイント・印刷用データ構造・ページ分割・テンプレートは `../ec-cube-enterprise` の `StockMoveTransferController` / `StockMoveTransferReturnListPdfFormatter` / `return_list.twig` 実装を正とする。
- 出力対象データの取得・整形・並び順・バリデーションは戻しリストCSV（M04-33）と共通（`getReturnListExportRows` / `RestockListCsvRowFormatter` / `validateReturnListExportIds`）。列の意味・整形ルールの詳細はM04-33を正とする。
