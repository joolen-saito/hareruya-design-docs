# M04-20（欠品履歴CSV出力）

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | 欠品履歴CSV出力 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`StockHistoryController::csvStockHistoryDispozalExport` / `Service\Csv\StockHistoryDisposalCsv` / `Service\Csv\AbstractCsvService` / `CsvExportService` / `DtbStockHistoryRepository::getStockHistories` ・ `getQueryBuilderBySearchDataForAdmin` / Entity `DtbStockHistory`・`ProductStock`・`ProductClass`・`Product`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化。 |

## 1. 欠品履歴CSV出力

### 機能の目的と役割

欠品履歴検索一覧（M04-19）で検索・表示した欠品履歴（検索結果全件。一覧フォームが `ids[]` を自動送信し、行のチェック選択UIは無い）を対象にCSVとして出力する管理画面機能。欠品（在庫変動理由区分が廃棄系＝廃棄／欠品減算（受注）／欠品減算（移動））に該当する在庫変動履歴（`dtb_stock_history`）を、本店・支店・スマレジ（実店頭）在庫を横断して1ファイルに出力する。

本機能のカスタマイズ区分は新規実装であり、対応する現行（pf-eccube3）実装は無い。出力対象・出力列の業務要件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能) M04-20シート）を正とし、URLエンドポイント・出力列の永続化元・整形・文字コード・ファイル名はリニューアル先 ec-cube-enterprise 実装を正とする。

実装上、欠品履歴の一覧表示（M04-19）と在庫変動履歴の一覧表示（M04-17相当）は同一コントローラ `StockHistoryController` で扱われ、欠品履歴は検索時に「欠品検索（`disposal_search`）」が指定された状態を指す。CSV出力も、在庫履歴CSV（`admin_stock_history_csv_export`）と欠品履歴CSV（`admin_stock_history_disposal_csv_export`）の2系統に分かれており、本書は後者（欠品履歴＝disposal）を扱う。

### 本書で扱うこと

- 欠品履歴CSV出力の入口（エンドポイント）と起動方法（一覧で選択した行のID配列を受け取る）
- 出力対象データの取得と表示順
- CSV出力列（15列）と各列の永続化元・整形
- 文字コード・ファイル名・レスポンスヘッダ
- 対象なし・ID未指定・不正IDなどの例外時の挙動

### 本書で扱わないこと

以下は本書では仕様確定せず、対応機能の設計を正とする。

- 欠品履歴検索一覧（M04-19）の検索条件・一覧項目・欠品理由インライン編集
- 在庫履歴（廃棄系以外）のCSV出力（`admin_stock_history_csv_export`、在庫履歴CSV）。本書とはヘッダ定義・対象が異なる
- 管理画面ログイン認証・権限制御そのもの（共通設計を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | HTTPメソッド | 期待されるふるまい |
|------|------------------------------|--------------|--------------------|
| 欠品履歴CSV出力 | `/%admin%/product/stock/history/disposal/csv_export`（`admin_stock_history_disposal_csv_export`） | POST | リクエストの `ids[]`（在庫履歴ID配列。一覧フォームが検索結果全件分を hidden で自動送信する）を受け取り、該当する欠品履歴のCSVを `StreamedResponse` で返す。対象が無い場合は一覧へリダイレクト。 |

（参考・本書対象外）在庫履歴CSV出力は `/%admin%/product/stock/history/csv_export`（`admin_stock_history_csv_export`、POST）。欠品履歴一覧の表示は `/%admin%/product/stock/history`（`admin_stock_history`。ページ送りは `admin_stock_history_page` / `admin_stock_history_page_count`）。

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。すべて管理画面ログインを要する。

### 起動方法（入力）

- 入口は POST のみ。出力対象は**在庫履歴ID配列** `ids[]`（`dtb_stock_history.id`）。一覧画面のCSV出力フォームには検索結果全件分の `ids[]` が hidden で自動設定されて送信される（行のチェック選択UIは無い。`history.twig:595-608`、`PaginationAll`）。
- コントローラは `ids` を `intval` 変換し、0以下を除外して有効なIDのみ採用する（`array_filter(...) fn($id) => $id > 0`）。有効IDが0件の場合はエラー応答。
- 一覧側で「欠品検索」状態のときに表示・選択された行が対象となる前提（廃棄系の在庫変動区分に限定された一覧から選択される）。

### 出力対象データと表示順

- 対象データは `DtbStockHistoryRepository::getStockHistories($ids)` が取得する。`sh.id IN (:ids)` で選択IDの在庫履歴を取得し、`ProductStock`・`Member`・`ProductClass`・`Product`・`CardDetail` を結合する。
- 表示順（CSV行順）は以下の3段ソート。Excel M04-19の一覧ソート要件と一致する。
  1. 商品コード `pc.code` の降順（第一ソート）
  2. 店舗 `ps.baseInfo` の降順（第二ソート＝店舗IDの降順）
  3. 登録日時 `sh.createDate` の降順（第三ソート＝最新順）
- 本店・支店・スマレジの在庫はすべて EC-CUBE のDB（`dtb_stock_history` / `dtb_product_stock`）が保持するため、通常の検索で横断的に出力される。

### CSV出力列

`StockHistoryController::getStockHistoryDisposalCsvHeader()` で定義したヘッダ（表示名）をそのまま1行目に出力し、`StockHistoryDisposalCsv::convertExportCsvRows()` で各行を生成する。列は以下の15列・この順。

| # | 列名（ヘッダ） | 値の取得元 | 整形 |
|---|----------------|------------|------|
| 1 | 商品コード | `ProductClass::getCode()` | — |
| 2 | 商品名 | `Product::getName()` | — |
| 3 | 言語 | `ProductClass::getLanguageNameJp()` | 日本語名 |
| 4 | 状態 | `ProductClass::getCardCondition()->getCode()` | カード状態コード |
| 5 | Foil | （固定で空文字） | Foilマスタ未実装のため空（実装上 TODO） |
| 6 | 店舗 | `ProductStock::getBaseInfo()` | — |
| 7 | 在庫場所 | `ProductStock::getLocationName()` | EC-CUBE / スマレジ（`STOCK_LOCATION_*`） |
| 8 | 登録元 | `DtbStockHistory::getHistorySourceType()` | — |
| 9 | 欠品点数 | `DtbStockHistory::getStock()` | — |
| 10 | 欠品時販売価格 | `DtbStockHistory::getSellPrice()` | — |
| 11 | 欠品理由 | `DtbStockHistory::getStockChangeReason()` | — |
| 12 | 登録日 | `DtbStockHistory::getRegisteredAt()` | `Y-m-d H:i`（null時は空） |
| 13 | 登録者 | `DtbStockHistory::getRegisteredMember()` | — |
| 14 | 最終更新日 | `DtbStockHistory::getUpdateDate()` | `Y-m-d H:i`（null時は空） |
| 15 | 最終更新者 | `DtbStockHistory::getUpdateMember()` | — |

各行は `ProductStock`（`product_stock_id` から）→ `ProductClass` → `Product` を辿って商品情報を補完する。ヘッダのキー順に値を並べ、未設定値は空文字で出力する。

> **Excel設計書のCSV列（16列）を正とする。** 現状の実装（disposalヘッダ15列）はExcel設計と差異があり、以下は実装側の是正対象（テストはExcel期待値=16列で設計する）:
> - Excelは「7 在庫区分」を求めるが、実装は「在庫場所」列（`ProductStock::getLocationName()` の EC-CUBE / スマレジ）として出力している。列名・粒度をExcel（在庫区分：EC-CUBE在庫／スマレジ在庫）に合わせる必要がある。
> - Excelは「9 登録元ID」を求めるが、欠品履歴CSV（disposalヘッダ）には**登録元ID列が無い**（在庫履歴CSV側のヘッダには `登録元ID` が存在する）。Excel設計どおり列を追加する必要がある（実装側の欠落）。

### 文字コード・ファイル名・レスポンス

| 項目 | 値 |
|------|----|
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`）。各セルは `mb_convert_encoding($value, 設定エンコード, 'UTF-8')` で変換して出力する（`CsvExportService`）。 |
| Content-Type | `text/csv;charset=windows-31j`（`SJIS-win` の場合 `windows-31j` に読み替え。それ以外は設定値そのまま）。 |
| Content-Disposition | `attachment; filename=<ファイル名>`（ダウンロード）。 |
| ファイル名 | `stock_history_disposal_` + 出力時刻 `YmdHis` + `.csv`（例: `stock_history_disposal_20260612153000.csv`）。`AbstractCsvService::createFileName()` で生成。 |
| 出力方式 | `StreamedResponse`。コールバック内で `fopen()` → ヘッダ行 `fputcsv()` → 各行 `fputcsv()` → `fclose()`。出力前に `set_time_limit(0)` とSQLロガー無効化でメモリ・タイムアウト対策を行う。 |

ファイル名生成時に `log_info('欠品履歴CSV出力ファイル名', [$filename])` をアプリケーションログへ出力する。

### プロセスフロー

1. 欠品履歴一覧（`admin_stock_history`、欠品検索状態）でCSVダウンロードを実行（POST）。フォームに hidden で自動設定された検索結果全件分の `ids[]` を送信（行のチェック選択UIは無い）。
2. コントローラ `csvStockHistoryDispozalExport()` が `ids` を整数化し、0以下を除外。有効IDが0件なら `responseNoStockHistoryIdError()` でエラーリダイレクト（後述）。
3. `set_time_limit(0)`・SQLロガー無効化のうえ、`StockHistoryDisposalCsv` をヘッダ定義（`getStockHistoryDisposalCsvHeader()` / 必須ヘッダ `getRequiredStockHistoryCsvHeader()`）とともに生成。
4. `exportCsv($ids)` を実行。`getStockHistories($ids)` で対象在庫履歴を取得（前述のソート順）。
5. 取得0件の場合は `RuntimeException`（`admin.csv.error.export.not_registered_stock_history_id`）。`convertExportCsvRows()` 結果が0件の場合は `admin.csv.error.export.no_stock_history_data`。
6. 正常時は `StreamedResponse` を生成し、文字コード変換・ヘッダ設定のうえCSVをストリーム出力する。

### 分岐・遷移・例外

| 条件 | 挙動 |
|------|------|
| `ids` パラメータ無し / 空配列 / 0以下のみ（有効ID0件） | `responseNoStockHistoryIdError()`：`addError('eccube.admin.error', trans('admin.stock_history.not_select'))` を実行し、`admin_stock_history_page`（セッション `eccube.admin.stock_history.search.page_no` の現在ページ、既定1）へリダイレクト。※第2引数=namespace 誤用によりフラッシュは `eccube.admin.stock_history.not_select.error` バッグへ格納され、`alert.twig` が購読するバッグではないため画面には表示されないと推定（要実機確認。M04-20-MSG-005 参照）。 |
| 指定IDに該当する在庫履歴が存在しない / 変換結果が空 | `StockHistoryDisposalCsv::exportCsv()` が `RuntimeException` を送出。コントローラが `addError($e->getMessage(), 'admin')` でメッセージ表示し、リファラがあればリファラへ、無ければ `admin_stock_history` へリダイレクト。 |
| 正常 | `StreamedResponse`（HTTP 200、`text/csv`、`attachment`）を返す。 |

既存テスト `StockHistoryDisposalCsvControllerTest` で、ID無し・idsパラメータ無し・無効ID（0/-1/空）・存在しないID（999999）はいずれもリダイレクト、正常系（廃棄区分の履歴を `disposal_search=1` で検索して得たIDを送信）は HTTP 200・`text/csv`・`attachment` を返すことを確認済み。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | 欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）。 |
| 参照テーブル | `dtb_stock_history`（`DtbStockHistory`）。商品情報は `dtb_product_stock` → `dtb_product_class` → `dtb_product` を結合参照。区分は `mtb_stock_change_type` / `mtb_stock_change_type_detail`（欠品＝`MtbStockChangeType::DISPOSAL` 配下）。 |
| ログ | 出力ファイル名を `log_info` でアプリケーションログに記録する。 |

> 欠品理由の更新（`DtbStockHistoryRepository::updateDisposalReason`、`dtb_stock_history.stock_change_reason` / `update_member_id` / `update_date` を更新）は欠品履歴一覧側（`admin_stock_history_update`）の機能であり、本CSV出力では行わない。

### 関連設計への接続点

- 出力対象・出力列の業務要件は、参照元Excel設計書（欠品履歴CSV出力 M04-20、欠品履歴検索一覧 M04-19）を正とする。
- 出力列の永続化元・整形・文字コード・ファイル名・ソート順は `../ec-cube-enterprise` の `StockHistoryController` / `StockHistoryDisposalCsv` / `AbstractCsvService` / `CsvExportService` / `DtbStockHistoryRepository` / Entity 実装を正とする。
- 出力対象IDの供給元（一覧フォームが自動送信する検索結果全件分の `ids[]`）は欠品履歴検索一覧（M04-19）。一覧の「欠品検索」状態が前提となる。

## 表示メッセージ

欠品履歴一覧（＝欠品検索状態）と同一画面で発生するメッセージ。表示形態はフラッシュ／インページアラート／インラインフォームエラーが混在する。文言はすべて ec-cube-enterprise 実ソース由来の逐語リテラル（`messages.ja.yaml`／`validators.ja.yaml` のロケール解決値、またはロケール未定義キーの生文字列）で、確定できないものは「要ソース確認」と記載する。

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-20-MSG-004 | 管理画面上部 | 要ソース確認 | 存在しない在庫履歴IDが含まれています。 ／ 在庫履歴データが存在しないためエクスポートできません。 | 要ソース確認 | 要ソース確認 |
| M04-20-MSG-005 | 要ソース確認 | eccube.admin.error | eccube.admin.error | 欠品履歴CSVを出力するとき、出力対象が選ばれていないとき | 欠品履歴検索/一覧画面に遷移する |
| M04-20-MSG-007 | 当該入力欄直下 | 不正な日付です。 | Invalid DateTime. | 欠品履歴を検索するとき、1900年1月1日より前の日付を指定したとき | 欠品履歴検索/一覧画面に留まる |

> 注: 同一コントローラ／同一画面（`history.twig`）に属するが本CSV出力機能（M04-20）本体のトリガーではないメッセージ（欠品理由編集・在庫履歴CSV出力・在庫変動理由の非同期編集・検索フォーム由来）は、codex+fable5 の批判レビューにより M04-17/M04-18/M04-19 側の各機能へ再割当済み。

## リニューアル移行時の扱い

本機能は新規実装であり、現行（pf-eccube3）に対応する欠品履歴CSV出力機能は無い。挙動・出力列は基本設計仕様書（在庫管理機能 M04-20シート）を正とし、DBスキーマ・整形は ec-cube-enterprise の実装を正とする。確認できない点は推測せず要確認として残す。

| 観点 | 内容 |
|------|------|
| 出力対象の在庫履歴 | `dtb_stock_history`（移行先で実在）。在庫変動理由区分が廃棄系（廃棄・欠品減算（受注）・欠品減算（移動）＝`MtbStockChangeType::DISPOSAL` 配下の `StockChangeTypeDetail`）の履歴を、一覧で選択したIDに限定して出力する。 |
| 欠品履歴の参照 | `dtb_stock_history` を参照。欠品理由は `stock_change_reason`、最終更新は `update_date` / `update_member_id`。 |
| CSV列の追加仕様 | **Excelの列要件（店舗・在庫区分・登録元・登録元ID・欠品時販売価格・欠品理由・最終更新日・最終更新者）を正とする。** 実装の disposal ヘッダは「在庫区分」を「在庫場所」として出力し「登録元ID」を欠くため、Excel設計に合わせる是正が必要（実装側の乖離）。 |
| 文字コード | `eccube_csv_export_encoding`（既定 `SJIS-win`／Content-Type は `windows-31j`）。 |

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
欠品履歴検索一覧(検索結果)
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
M04-19
概要
在庫一覧で欠品のみを選択時の一覧画面
処理概要（★はカスタマイズ項目）
図形・テキストボックス内テキスト（19件）
欠品履歴検索一覧(検索結果)
レイアウト図
1-1
1-2
2-2
2-3
2-4
2-5
2-6
2-7
2-8
2-9
2-1
2-10
2-12
2-13
3-1
2-14
2-16
2-15
2-11
欠品履歴検索一覧(検索結果) / B8 / image 1
カスタマイズ説明
・カスタマイズ要件
・本店在庫・支店在庫・スマレジ（実店頭）の在庫情報を横断的に検索が可能とする
・最終欠品理由の記載を追加する
運用想定として金額次第では行わないこととする（捜索を1種合計で、980円以下は行わない）
→理由区分をキーワード選択とし、理由の説明をフリーワードの二つとする 欠品理由はキーワード選択を行わないことになりました
→振替の場合は欠品から振替を行えるようにしたい※ユースケース確認 振替の要件はなくなりました
・欠品登録時に総在庫を減らす処理を行う
※欠品のため総原価は変えない
・カスタマイズ要件に記載の内容以外は現行踏襲とする。
機能仕様処理概要（★はカスタマイズ項目）
★1.一覧表示
1-1.検索した結果の在庫変動履歴の内、在庫変動理由区分が「廃棄」（親区分）、「欠品減算（受注）」・「欠品減算（移動）」（子区分）の履歴を検索し表示
1-1-1.入庫承認待ち在庫情報は表示しない
1-2.在庫履歴情報の一覧は、下記ソート順とする
1-2-1.第一ソートを商品コードの降順とする※現行踏襲
1-2-2.第二ソートを店舗のIDを降順とする※在庫区分でのソートは行わない
1-2-3.第三ソートを各レコードの「登録日時」の降順（最新順）で表示する
★2.表示条件
2-1.在庫変動履歴の検索で欠品履歴一覧を表示を選択された場合に表示
★3.表示項目カスタマイズ追加
3-1.現行より、下記項目の追加を行う
・識別ID:2-6店舗を追加
・識別ID:2-7在庫区分を追加
・識別ID:2-8登録元を追加
・識別ID:2-9登録元IDを追加
・識別ID:2-11欠品時販売価格を追加
・識別ID:2-12欠品理由を追加
・識別ID:2-15最終更新日を追加
・識別ID:2-16最終更新者を追加
識別IDラベル書式・制限必須最大値初期値画面部品の説明
上部表示項目
1-1表示件数単一選択--50件EC-CUBE標準のマスタデータ管理の最大ページ表示にて、設定されている表示件数の選択肢を表示する
1-2CSVダウンロードボタン---在庫変動履歴CSVを出力する
リスト表示項目
2-1商品コード文字列---「在庫編集」シート識別ID:1-5商品コードを参照
2-2商品名リンク---「在庫編集」シート識別ID:1-3商品名を参照
商品名を押下すると、押下した商品在庫の在庫編集画面を別タブで表示
※運用想定では欠品商品を発見した場合の補填目的で設置
2-3言語文字列---「在庫編集」シート識別ID:1-6言語を参照
2-4状態文字列---「在庫編集」シート識別ID:1-7状態を参照
2-5Foil文字列---「在庫編集」シート識別ID:1-8Foilを参照
2-6店舗文字列---「在庫編集」シート識別ID:2-2店舗を参照
2-7在庫区分文字列---「在庫編集」シート識別ID:2-3在庫区分を参照
2-8登録元テキスト---「在庫履歴検索一覧(検索結果)」シート識別ID:2-8登録元を参照
2-9登録元IDリンク---「在庫履歴検索一覧(検索結果)」シート識別ID:2-9登録元IDを参照
2-10欠品点数文字列---欠品登録された商品に対する欠品点数を表示
2-11欠品時販売価格テキスト---欠品登録時の販売販売価格を表示
受注の場合は、受注情報で保持している販売価格を参照
移動の場合も、移動情報で保持している販売価格を参照
2-12欠品理由テキスト---欠品理由を表示する
・編集機能
欠品理由の編集ができるようペンのアイコンを押下するとテキストエリアが表示され、再びペンのアイコンを押下すると編集内容が登録される
更新された場合は、更新された更新日と、ログインしているメンバーを更新者として更新する
2-13登録日日付(yyyy/mm/dd hh:mm)---「在庫編集」シート識別ID:4-6登録日を参照
2-14登録者文字列---「在庫編集」シート識別ID:4-7登録者を参照
2-15最終更新日日付(yyyy/mm/dd hh:mm)---「在庫履歴検索一覧(検索結果)」シート識別ID:2-26最終更新日を参照
2-16最終更新者文字列---「在庫履歴検索一覧(検索結果)」シート識別ID:2-27最終更新者を参照
画面下部
3-1 ページング リンク - - - 再検索実行し、移動先内容の範囲の内容を表示する画面に遷移する
※在庫編集承認一覧(検索入力)の内容を表示する
図形・テキストボックス内テキスト（19件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
AQ7(1-1)
AT7(1-2)
B8(2-1)
F8(2-2)
H8(2-3)
J8(2-4)
K8(2-5)
M8(2-6)
N8(2-7)
P8(2-8)
R8(2-9)
V8(2-10)
X8(2-11)
欠品履歴CSV出力
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
2025-11-12
機能No
M04-20
機能名
欠品履歴CSV出力
概要
在庫一覧で欠品のみを選択時の一覧CSV出力
処理概要（★はカスタマイズ項目）
CSV出力項目
識別ID項目名備考
1商品コード
2商品名
3言語
4状態
5Foil
6店舗
7在庫区分
8登録元
9登録元ID
10欠品点数
11欠品時販売価格
12欠品理由
13登録日
14登録者
15最終更新日
16最終更新者
カスタマイズ説明
・カスタマイズ要件
・欠品履歴を検索した結果をCSVとして出力
※本店・支店・スマレジの在庫を横断して出力可能とする
・カスタマイズ要件に記載の内容以外は現行踏襲とする。
機能仕様処理概要（★はカスタマイズ項目）
・在庫履歴検索一覧(検索入力)の検索条件でデータを取得しCSV出力する
・一覧表示されている順番と同じ順でCSV出力する
※参照情報は「在庫編集承認一覧(検索結果)」シート1-1を参照
★・現行より、下記項目の追加を行う
識別ID:6店舗を追加
識別ID:7在庫区分を追加
識別ID:8登録元を追加
識別ID:9登録元IDを追加
識別ID:11欠品時販売価格を追加
識別ID:12欠品理由を追加
識別ID:15最終更新日を追加
識別ID:16最終更新者を追加
```

</details>
