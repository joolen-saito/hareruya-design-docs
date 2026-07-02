# M04-34（戻しリストPDF）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 戻しリストPDF |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveTransferController::exportReturnListPdf` / `StockMoveTransferReturnListPdfFormatter` / `RestockListCsvRowFormatter` / `DtbStockMoveTransferRepository::getReturnListExportRows` / テンプレート `@admin/Stock/MoveTransfer/return_list.twig`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Formatter/Twig）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 戻しリストPDF

### 機能の目的と役割

在庫移動・振替一覧でチェック選択した在庫移動・振替情報をもとに、入庫先（移動先）店舗で棚へ戻すための「戻しリスト」を印刷用レイアウトで表示する管理画面機能。サーバは戻しリストのHTMLを生成し、別ウィンドウ（ポップアップ）で表示してブラウザの印刷ダイアログから印刷する方式。データ取得・整形・並び順は戻しリストCSV（M04-33）と完全に共通化されており（`getReturnListExportRows` ＋ `RestockListCsvRowFormatter`）、PDF専用フォーマッタ `StockMoveTransferReturnListPdfFormatter` が「ピッキング区分（金額閾値）ごとのグループ化」と「1ページ30行のページ分割」を行う。

本機能のカスタマイズ区分は新規実装であり、現行（pf-eccube3）に相当機能は無い。帳票レイアウト・閾値仕様は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・出力構造・ページ分割・DBカラムはリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 戻しリストPDF出力の入口（エンドポイント）と起動条件・レスポンス形式（JSONでHTMLを返す）
- 印刷用レイアウト要素（タイトル・閾値グループ・ページング・作成日時・明細列・ページ内小計）
- 出力単位（ピッキング区分=金額閾値ごとのグループ、1ページ30行）
- 出力前バリデーション（CSVと共通。選択無し・存在しないID・対象外ステータス・権限・入庫先未設定・複数店舗）
- 表示制御（印刷ボタンを印刷範囲に含めない、印刷ダイアログ起動）

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能の設計を正とする。

- 戻しリストCSV出力（M04-33）の出力列・整形・並び順（同一ロジックを共用。詳細はM04-33を正とする）
- 在庫移動・振替一覧画面そのもの（検索・表示・選択UI・ポップアップ起動のJS）
- 入庫先店舗ごとの金額閾値・棚番マスタ・略称タグ等のマスタ登録（マスタデータ管理側）
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 戻しリストPDF出力 | `POST /%admin%/product/stock/move_transfer/return_list_pdf_export`（`admin_stock_move_transfer_return_list_pdf_export`） | 選択した在庫移動・振替情報ID（`ids[]`）を受け取り、CSRF検証・対象バリデーション後に戻しリストHTMLを `JsonResponse` で返す。成功時 `{success:true, html:"…"}`、検証NG時 `{success:false, redirectUrl:"…一覧ページ…"}`。 |

- `%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。
- 別ウィンドウで開く前提のため、ファイルダウンロードではなくJSONでHTML本文を返す（画面側JSがポップアップに書き込む想定）。
- 入力は POST の `ids[]` と CSRFトークン `_token`。

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

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に対応する機能は存在しない。仕様は基本設計仕様書を正とする。

移行先 ec-cube-enterprise には戻しリストPDF出力の実装（`StockMoveTransferReturnListPdfFormatter` ＋ `return_list.twig`）があり、DB関連の記述はこれを正とする。印刷対象は一覧で選択された在庫移動・振替情報であり、在庫移動・振替（テーブル `dtb_stock_move_transfer`）と明細（テーブル `dtb_stock_move_transfer_detail`）、および入庫先在庫・入庫先店舗を参照する。帳票は印刷用に整形したHTMLを別ウィンドウで表示し、ブラウザの印刷ダイアログで出力する方式であり、DBへの書き込みは行わない。ページ分割は1ページ30行（`MAX_PAGE_ROWS=30`）、出力単位はピッキング区分（金額閾値）ごとのグループである。列の型・桁・制約の細部は ec-cube-enterprise の Entity / Repository / Migration を正とする。

---

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動戻しリストPDF
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
堀部
更新日
2025-09-18
機能No
M04-34
機能名
在庫移動戻しリストPDF
概要
—
処理概要（★はカスタマイズ項目）
図形・テキストボックス内テキスト（14件）
レイアウト図
1
3
4
5
6
7
8
9
10
11
12
13
14
2
在庫移動戻しリストPDF / D9 / image 1
在庫移動戻しリストPDF / AD49 / image 2
カスタマイズ説明
・カスタマイズ要件
・在庫移動一覧画面で選択された在庫移動データを元に棚戻しするための戻しリストをポップアップにて表示する
・本店3F,2F,B2Fや支店で閾値が異なるため、マスターデータ管理にて、店舗ごとに金額の閾値を分けられるようにする
→フォーマットがそれぞれ3F,2F,B2Fで異なるものとなる
備考
３F在庫 現行運用での金額の閾値について
シングルカード
低額：4800円未満
高額：4800円以上
金庫：基本的にEC在庫で500万以上のものを保管。あとは備品などを入れている
シングルカード以外
倉庫：2Fに置ききれない（商品化していない）サプライパックボックス等を保管
・その他、基本的な仕様は「在庫移動指示リスト ピッキングリスト印刷」に準じる
機能仕様処理概要（★はカスタマイズ項目）
表示制御
ページ内で印刷に最適化した状態でページを表示する
「印刷する」ボタン(1)を印刷範囲に含まない
印刷ボタン
PC端末の印刷ダイアログが表示され、印刷を実行する
印刷対象取得
★一覧画面で選択された買取情報に紐づく実在庫情報を、対象店舗ごとに指定された閾値情報+サプライで分けて取得する
・サプライ品でない場合は商品名から略称・言語・状態・色・レアリティを取り除く
・商品名内に[略称タグ]が含まれない場合は[～]（[]内にある文字を[]ごと）を削除
・並び順は金額閾値の昇順(最後にサプライ)が最優先となる
・金額閾値内の並び順は以下の通りとなる
・棚番（昇順、支店の場合は棚番のソートは行わない）
・言語（日→英→他言語）
・状態（NM→HP）
・Foilフラグ（非Foil→Foil）
・略称タグ（昇順）
・レアリティ（M→C）
・色（マスターデータ色順参照）
・設定されている略称タグについてコレクター番号でのソートだった場合、コレクター番号（昇順）
・設定されている略称タグについてアルファベットでのソートだった場合、英語のカード名（昇順）
識別IDラベル書式・制限必須最大値初期値画面部品の説明
1印刷するボタン---ボタンを押下すると、PC端末の印刷ダイアログが表示され、印刷を開始する
2商品仕訳ラベル---店舗ごとの閾値とサプライを出力
●●円未満、●●円以上▲▲円未満、■■円以上、サプライ
閾値の表示も基準価格を参照して行う（セール中で金額が変わっても棚を移動することはないため）
3ページングラベル---閾値ごとのページ数を表示
4作成日時ラベル---戻しリストを作成した日時
※「戻しリストPDF」を選択した日時
5行番号ラベル---各ページ毎に商品に割り振られる行番号
6棚番号ラベル---商品がしまってある場所番号(本店のみ)
支店では非表示
7言語 / 状態ラベル---Foilの場合はFoilをつけて、言語/状態の形式で出力する（例: FoilJP/NM）、サプライ品の場合は「サプライ品」と表示
8略称ラベル---商品の略称
サプライ品の場合は表示しない
9色 / Rラベル---商品情報から取り出した色とレアリティを出力（例: 赤R）。シングルカード以外は色に該当するデータがないため、色情報は非表示
10数ラベル---商品点数
11商品名ラベル---サプライ品でない場合は商品名から略称・言語・状態・色・レアリティを取り除く
12価格ラベル---基準価格を表示する
13備考ラベル---備考
14ページ内個数小計ラベル---ページ内の商品個数の総計
図形・テキストボックス内テキスト（14件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
T9(1)
X11(2)
AD11(3)
AO12(4)
D13(5)
H13(6)
L13(7)
O13(8)
R13(9)
T13(10)
Y13(11)
AF13(12)
AI13(13)
Y43(14)
```

</details>
