# M04-33（戻しリストCSV）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 戻しリストCSV |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockMoveTransferController::exportReturnListCsv` / `StockMoveTransferReturnListCsvExportService` / `RestockListCsvRowFormatter` / `DtbStockMoveTransferRepository::getReturnListExportRows` / `getMoveToBaseInfoAndStatusByIds`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 戻しリストCSV

### 機能の目的と役割

在庫移動・振替一覧（M04-32 相当）でチェック選択した在庫移動・振替情報をもとに、入庫先（移動先）店舗で棚へ戻すための「戻しリスト」をCSV出力する管理画面機能。入庫先在庫（`move_to_product_stock`）を商品規格単位に集計し、入庫先店舗ごとに設定された金額閾値（高額区分の閾値1〜3）＋サプライ品で「ピッキング区分」を振り分けて出力する。出力列・整形ルール・並び順は店頭買取／ネット買取の棚戻しリストと共通化されており、`RestockListCsvRowFormatter` を共用する。

本機能のカスタマイズ区分は新規実装であり、現行（pf-eccube3）に相当機能は無い。画面項目・CSV列・業務上の閾値仕様は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・出力列・整形・並び順・DBカラムはリニューアル先 ec-cube-enterprise 実装を正とする。

### 本書で扱うこと

- 戻しリストCSV出力の入口（エンドポイント）と起動条件
- 出力対象データ（選択された在庫移動・振替情報と入庫先在庫明細）
- CSV出力列・整形ルール（ピッキング区分・言語/状態・略称・色/R・商品名整形）
- 並び順（ピッキング区分→棚番→言語→状態→Foil→略称タグ→レアリティ→色→カード）
- 出力前バリデーション（選択無し・存在しないID・対象外ステータス・権限・入庫先未設定・複数店舗）
- ファイル名・文字コード・ヘッダ行
- エラー時の遷移（一覧への戻し）

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能の設計を正とする。

- 在庫移動・振替一覧画面そのもの（検索・表示・選択UI）と、戻しリストPDF出力（M04-34）
- 在庫移動CSV登録・在庫振替CSV登録・在庫移動振替一覧CSV出力など同一コントローラの他機能
- 入庫先店舗ごとの金額閾値（`expensive_threshold1〜3`）・棚番マスタ・略称タグ（保管コード）等のマスタ登録（マスタデータ管理側）
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | 期待されるふるまい |
|------|------------------------------|--------------------|
| 戻しリストCSV出力 | `POST /%admin%/product/stock/move_transfer/return_list_csv_export`（`admin_stock_move_transfer_return_list_csv_export`） | 一覧で選択した在庫移動・振替情報ID（`ids[]`）を受け取り、CSRFトークン検証・対象バリデーション後にCSVをダウンロード応答（`StreamedResponse`）する。検証NG時は一覧（ページ付き）へリダイレクトする。 |

- `%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。
- 入力は POST の `ids[]`（在庫移動・振替情報IDの配列）と CSRFトークン `_token`。`set_time_limit(0)` で実行時間制限を解除する。
- 出力先一覧ページは、セッション `eccube.admin.stock.move_transfer.page_no`（既定1）を用いて `admin_stock_move_transfer_page` を生成する。

### CSV出力仕様

| 観点 | 内容 |
|------|------|
| ヘッダ定数 | `StockMoveTransferReturnListCsvExportService::CSV_HEADER`。1行目にヘッダ名を出力する。 |
| 文字コード | `CsvExportService` 経由。`eccube_csv_export_encoding` 設定に従う（UTF-8 設定時は先頭に BOM `\xEF\xBB\xBF` を付与。既定は `SJIS-win`）。区切りは `eccube_csv_export_separator` 設定。 |
| ファイル名 | `stock_move_transfer_return_list_{選択IDの最小値を7桁ゼロ詰め}_{YmdHis}.csv`（例: `stock_move_transfer_return_list_0012345_20260101120000.csv`）。`Content-Type: application/octet-stream`、`Content-Disposition: attachment`。 |
| 完了ログ | `log_info('在庫移動・振替 戻しリストCSV出力完了. ファイル名: …')` を記録する。 |

出力列（`CSV_HEADER` の順）:

| # | 列名（ヘッダ） | 内部キー | 内容・整形ルール |
|---|----------------|----------|------------------|
| 1 | ピッキング区分 | `pickingType` | 入庫先店舗の金額閾値（`expensive_threshold1〜3`）と基準価格で振り分け。閾値を昇順に整列し、基準価格が「最小閾値未満」→`{最小閾値}円未満`、区間内→`{下限}円以上{下限上}円未満`、最大閾値以上→`{最大閾値}円以上`（数値は3桁区切り）。サプライ品（後述）は `サプライ`。基準価格 null または閾値未設定時は空。 |
| 2 | 棚番号 | `shelfNumber` | 本店（`BaseInfo::TC_TOKYO_ID`）の入庫先のみ棚番（`dtb_shelf_number.name`）を出力。支店は空。 |
| 3 | 言語/状態 | `languageAndCondition` | `{Foilなら"Foil"}{言語コード}/{状態コード}`（例 `FoilJP/NM`）。状態コードが空なら `/状態` を付けない。サプライ品は `サプライ品`。 |
| 4 | 略称 | `storageCode` | 保管コード（略称タグ）名 `mtb_storage_code.name`。サプライ品は空。 |
| 5 | 色/R | `colorAndRarity` | 色名（カードに紐づく `mtb_color.name_jp` を id 順連結）＋レアリティコード `mtb_rarity.code`。サプライ品は空。シングルカード以外は色情報が無いため色は付かない。 |
| 6 | 数 | `quantity` | 商品規格単位に集計した移動点数 `SUM(d.move_transfer_quantity)`。 |
| 7 | 商品名 | `productName` | サプライ品はそのまま。非サプライは商品名から略称タグ（`[略称]`、無ければ `[～]`）・`【言語/状態】`・色・レアリティを除去（受注ピッキングリストと同等ロジック）。 |
| 8 | 基準価格 | `standardPrice` | 規格の基準価格 `dtb_product_class.standard_price`（数値、null は空）。 |

> 「サプライ品」の判定: 商品が物販カテゴリ（`Category::GOODS_ID`）または予約物販カテゴリ（`Category::RESERVED_GOODS_ID`）に属するかを `EXISTS` で判定する（1:N JOIN による数量重複を避けるため EXISTS に分離）。
> 既存テスト `testExportByIdsTwoStockMoveTransfersPopulatesCsvColumns` は、2件選択時にヘッダ行＋2データ行が出力され各行の列数が `CSV_HEADER` と一致することを確認している（先頭BOMを除去して比較）。

### 出力対象データと並び順

`DtbStockMoveTransferRepository::getReturnListExportRows($ids)` が生SQLで取得する。

- 主テーブル: `dtb_stock_move_transfer_detail`（明細）→ `dtb_stock_move_transfer`（ヘッダ）→ 入庫先在庫 `dtb_product_stock`（`move_to_product_stock_id`）→ `dtb_product_class` → `dtb_product`。閾値は入庫先店舗 `dtb_base_info`（`move_to_base_info_id`）の `expensive_threshold1〜3` を参照する。
- 集計: 商品規格（`pc.id`）単位で `move_transfer_quantity` を `SUM` する（`GROUP BY`）。
- 時刻: 取得前に接続セッションで `SET TIME ZONE 'Asia/Tokyo'` を実行する。
- 並び順（基本設計の並び順をSQL `ORDER BY` で実装）:
  1. ピッキング区分（円未満→円以上〜円未満→円以上→サプライ。サプライは最後）
  2. 棚番（本店のみ `dtb_shelf_number.sort_no` 昇順。支店は一律0で棚番ソートを行わない）
  3. 言語（`mtb_language.id` 昇順＝日→英→他言語）
  4. 状態（`mtb_card_condition.id` 昇順＝NM→HP）
  5. Foilフラグ（非Foil→Foil）
  6. 略称タグ（`mtb_storage_code.rank` 昇順）
  7. レアリティ（`mtb_rarity.sort_no` 昇順＝M→C）
  8. 色（`mtb_color_sequence.sort_no` 昇順）
  9. カード（略称タグが `alphabet_sort_flg=true` なら英語カード名 `mtb_card.name_en` 昇順、false ならコレクター番号 `mtb_card_detail.card_no` 昇順）

### プロセスフロー

1. `POST .../return_list_csv_export` を受信。`set_time_limit(0)`、CSRFトークン検証（`isTokenValid()`）。
2. 共通バリデーション `validateReturnListExportRequest()` を実行。
   - `ids[]` を整数化・空要素除去。空なら `admin.stock.move_transfer.return_list_csv_export.no_selection`（「1つ以上の在庫移動情報を選択してください。」）をエラー表示し一覧へリダイレクト。
   - `StockMoveTransferReturnListCsvExportService::validateReturnListExportIds($ids, $Member)` で対象を検証（後述）。エラーがあれば各メッセージを表示し一覧へリダイレクト。
3. 検証通過後、`exportByIds($ids)` を呼ぶ。`getReturnListExportRows($ids)` の行を `RestockListCsvRowFormatter::iterateFormattedRows()` で整形しながらストリーム出力（ヘッダ行→データ行）。
4. `StreamedResponse`（CSVダウンロード）を返し、完了ログを記録する。

### 出力前バリデーション（`validateReturnListExportIds`）

入庫先店舗・ステータス（`getMoveToBaseInfoAndStatusByIds`）を取得して以下を判定する。エラーは複数まとめて返す。

| 条件 | エラーメッセージ |
|------|------------------|
| 対象データが1件も見つからない | `対象のデータが見つかりません。` |
| 指定IDが存在しない | `ID: {id} は存在しません。` |
| 入庫先店舗が未設定（`MoveToBaseInfo` が null） | `ID: {id} は入庫先店舗が設定されていません。` |
| 入庫先店舗がログインメンバーの担当店舗（`MemberBaseInfo`）に無い | `ID: {id} は権限のない店舗のデータです。` |
| ステータスが許可対象外 | `ID: {id} は対象外のステータスです。` |
| 複数店舗の入庫先が混在 | `複数店舗の在庫移動・振替情報を同時に処理することはできません。` |

許可ステータス（`ALLOWED_STATUS_IDS`、出庫承認済み以降）: 出庫承認済み（`STATUS_OUTBOUND_APPROVED=4`）／移動中（`STATUS_MOVING=5`）／入庫承認待ち（`STATUS_INBOUND_APPROVAL_PENDING=6`）／入庫承認済み（`STATUS_INBOUND_APPROVED=7`）。新規（1）・差戻し（3）等は対象外。

> 既存テスト（`StockMoveTransferReturnListCsvExportServiceTest`）が各分岐を網羅: 存在しないIDのみ→「対象のデータが見つかりません。」のみ、存在しないID＋対象外ステータス混在、権限の無い入庫先、入庫先未設定、複数店舗混在、許可ステータス＋同一店舗＋権限ありの2件は空配列。

### 分岐・遷移・例外

- **選択無し / 検証NG**: CSVを返さず `admin_stock_move_transfer_page`（セッションのページ番号）へリダイレクト（302）。Web テスト `testExportReturnListCsvWithNoSelectionRedirectsToIndex` / `...WithValidationErrorsRedirectsToIndex` / `...DoesNotExport` が確認。
- **検証OK**: `exportByIds` の `StreamedResponse` をそのまま返す（HTTP 200・`application/octet-stream`・添付ファイル名付き）。Web テスト `testExportReturnListCsvReturnsStreamedResponseFromExporter` が確認。
- **CSRF不正**: `isTokenValid()` により無効トークンは例外。
- **対象なし**: バリデーションで「対象のデータが見つかりません。」として扱い、出力は行わない。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 戻しリストCSVは**参照のみ**で業務データを更新しない（選択IDから集計してCSVを生成するだけ）。 |
| 参照テーブル | `dtb_stock_move_transfer`（ヘッダ）／`dtb_stock_move_transfer_detail`（明細）／入庫先在庫 `dtb_product_stock`（`move_to_product_stock_id`）／`dtb_product_class`・`dtb_product`／入庫先店舗 `dtb_base_info`（`expensive_threshold1〜3`）／`mtb_shelf_number`（棚番）・`mtb_storage_code`（略称タグ）・`mtb_language`・`mtb_card_condition`・`mtb_card_detail`・`mtb_rarity`・`mtb_card`・`mtb_color`・`mtb_color_sequence`。 |
| ログ | 出力完了時にアプリケーションログ（`log_info`）を記録するのみ。CSV取込履歴・在庫履歴は更新しない。 |

### 関連設計への接続点

- CSV列・整形・閾値・並び順の業務要件は参照元Excel設計書（在庫移動戻しリストCSV出力シート）を正とする。
- URLエンドポイント・出力列・整形ロジック・並び順・DBカラムは `../ec-cube-enterprise` の `StockMoveTransferController` / `StockMoveTransferReturnListCsvExportService` / `RestockListCsvRowFormatter` / `DtbStockMoveTransferRepository` 実装を正とする。
- 戻しリストPDF出力（M04-34）は本CSVと同一の取得・整形ロジック（`getReturnListExportRows` / `RestockListCsvRowFormatter`）を共用する。出力対象選択・バリデーションも共通メソッドを用いる。

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に対応する機能は存在しない。仕様は基本設計仕様書を正とする。

移行先 ec-cube-enterprise には戻しリストCSV出力の実装（`StockMoveTransferReturnListCsvExportService`）があり、DB関連の記述はこれを正とする。出力対象は一覧で選択された在庫移動・振替情報であり、在庫移動・振替（テーブル `dtb_stock_move_transfer`）と明細（テーブル `dtb_stock_move_transfer_detail`）、および入庫先在庫・入庫先店舗を参照する。店舗ごとの金額閾値（`dtb_base_info.expensive_threshold1〜3`）・棚番・略称タグなどの出力区分はマスタデータ管理側の設定に従う。列の型・桁・制約の細部は ec-cube-enterprise の Entity / Repository / Migration を正とする。

---

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
在庫移動戻しリストCSV出力
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
2025-09-12
機能No
M04-33
機能名
在庫移動戻しリストCSV出力
概要
—
処理概要（★はカスタマイズ項目）
CSV出力項目
識別ID項目名備考
1ピッキング区分店舗ごとの閾値（ネット買取管理の場合は本店しかないため本店の閾値）とサプライを出力
●●円未満、●●円以上▲▲円未満、■■円以上、サプライ
閾値の表示も基準販売価格を参照して行う（セール中で金額が変わっても棚を移動することはないため）
2棚番号商品がしまってある場所番号(本店のみ)
支店では非表示
3言語/状態Foilの場合はFoilをつけて、言語/状態の形式で出力する（例: FoilJP/NM）、サプライ品の場合は「サプライ品」と表示
4略称商品の略称
サプライ品の場合は表示しない
5色/R商品名から取り出した色とレアリティを出力（例: 金R）。シングルカード以外は色に該当するデータがないため、色情報は非表示
6数商品点数
7商品名サプライ品でない場合は商品名から略称・言語・状態・色・レアリティを取り除く
8基準価格基準価格
カスタマイズ説明
・カスタマイズ要件
・在庫移動一覧画面で選択された在庫移動データを元に棚戻しするための戻しリストをダウンロードする
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
```

</details>
