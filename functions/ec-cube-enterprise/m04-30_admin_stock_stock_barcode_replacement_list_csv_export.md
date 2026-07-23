# 在庫管理 — バーコード貼替リストCSV出力

## 文書情報

| 項目 | 内容 |
|------|------|
| 機能名 | バーコード貼替リストCSV出力 |
| 機能分類 | 管理画面 / 在庫管理 |
| カスタマイズ区分 | 新規実装 |
| 作成日 | 2026-06-11 |
| 参照元 | excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html |
| 実装確認 | ../ec-cube-enterprise（`BarcodeReplacementListController` / `BarcodeReplacementListType` / `BarcodeReplacementListCsvExportService` / `BarcodeReplacementListCsvRowFormatter` / `DtbPriceHistoryRepository::iterateBarcodeReplacementListExportRows` / `CsvExportService`） |

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-06-11 | 新規実装機能として、Excel設計書を主、実装を補完情報として初版作成。 |
| 2026-06-12 | ec-cube-enterprise 実装（Controller/Service/Form/Entity/Repository）と既存テストを読み込み、出力列・抽出条件・整形・並び順を実装確認値で具体化。初版で誤記していた取得元（在庫移動指示系）を実装に合わせ価格変更履歴系へ修正。 |

## 1. バーコード貼替リストCSV出力

### 機能の目的と役割

指定期間で価格調整（価格変更履歴）が発生し、かつ対象店舗のスマレジ在庫にある商品の商品コードリストを、スマレジバーコードシール貼り替え用にCSV出力する機能。出力対象店舗（1店舗・必須）と価格変更発生期間（From/To 必須・最大1か月）を指定して出力する。

本機能のカスタマイズ区分は新規実装であり、現行（pf-eccube3）に対応実装はない。画面・項目・業務条件は基本設計仕様書（0202_基本設計仕様書(在庫管理機能)）を正とし、URLエンドポイント・抽出条件・出力列・整形・並び順はリニューアル先 ec-cube-enterprise 実装を正とする。

> 注: 本機能の出力対象は「価格変更履歴（`dtb_price_history`）× スマレジ在庫」であり、在庫移動指示（`dtb_stock_move_instruction`）とは無関係。初版が DB実装確認値として記載していた在庫移動系テーブル・`StockMoveInstructionLabelCsvExporterService` は誤りのため本改訂で削除した。

### 本書で扱うこと

- バーコード貼替リスト画面の入口（表示・CSV出力）と検索フォーム項目
- 出力対象の抽出条件（価格変更履歴・スマレジ在庫・ステータス）
- 出力列（6列）・各列の整形（商品名トリム・言語/状態・販売価格整形・スマレジバーコード生成）
- 出力順・文字コード・ファイル名・フォームバリデーション・例外

### 本書で扱わないこと

- スマレジ連携・スマレジ在庫数の取り込みそのもの（連携設計を正とする）
- 価格変更履歴（`dtb_price_history`）の生成元（価格変更機能側を正とする）
- バーコードシールの物理仕様・印刷（資料 PPTX/XLSX を正とする）

### 利用者視点の入口（エンドポイント）

| 入口 | URLエンドポイント（ルート名） | HTTPメソッド | ふるまい |
|------|------------------------------|--------------|----------|
| バーコード貼替リスト画面 | `/%admin%/product/stock/barcode_replacement_list`（`admin_stock_barcode_replacement_list`） | GET | 検索フォーム（`BarcodeReplacementListType`）を `@admin/Stock/barcode_replacement_list.twig` で表示。 |
| バーコード貼替リストCSV出力 | `/%admin%/product/stock/barcode_replacement_list/csv_export`（`admin_stock_barcode_replacement_list_csv_export`） | POST | CSRF検証後、フォーム検証→出力対象店舗・価格変更発生期間でCSVを `StreamedResponse` 出力。検証NG時はエラー表示して画面へリダイレクト。 |

`%admin%` は管理画面ルートプレフィックス（`eccube_admin_route`）。管理画面ログインを要する。

### 検索フォーム項目（`BarcodeReplacementListType`）

| フォームキー | 種別 | 必須 | 初期値 | 説明 |
|--------------|------|------|--------|------|
| `base_info` | `EntityType`（`BaseInfo`、単一選択） | ○（`NotBlank`） | ログイン者のデフォルト検索表示店舗（`Member::getDefaultSearchBaseInfo()`） | 出力対象店舗（Excel識別ID 1）。1店舗のみ選択。 |
| `price_change_period_from` | `DateType`（single_text） | ○（`NotBlank`） | 前日（`yesterday` 00:00:00） | 価格変更発生期間 From（Excel識別ID 2）。出力時は時刻を 00:00:00 に補正。 |
| `price_change_period_to` | `DateType`（single_text） | ○（`NotBlank`） | 当日（`today` 00:00:00） | 価格変更発生期間 To。出力時は時刻を 23:59:59 に補正。 |

- `POST_SUBMIT` で From > To の場合、`price_change_period_to` に `admin.stock.barcode_replacement_list.price_change_period_invalid` のエラーを付与する。
- CSRFトークン保護有効（`csrf_protection: true`、ブロック接頭辞 `admin_barcode_replacement_list`）。

> **Excel記載の「価格変更発生期間は最大で1か月間」の上限を正とする。** 現状のフォーム（POST_SUBMIT）は From>To のみ検証し、1か月上限の明示バリデーションが無いため、**実装側で上限チェックの追加が必要**（テストは1か月超の期間指定→エラーを期待値とする）。

### CSV出力仕様

| 項目 | 内容 |
|------|------|
| 出力列数 | 6列（ヘッダ行 + データ行） |
| 文字コード | `CsvExportService` 経由で `eccube_csv_export_encoding`（既定 `SJIS-win`）に変換して出力。 |
| ファイル名 | `barcode_replacement_list_<YmdHis>.csv`（出力時刻） |
| MIME / 形式 | `Content-Type: application/octet-stream`、`Content-Disposition: attachment`、`StreamedResponse` でストリーム出力 |
| メモリ | DBは `iterateAssociative`、CSVはコールバック内で1行ずつ書き出し全件メモリ保持しない |

### 抽出条件（`DtbPriceHistoryRepository::iterateBarcodeReplacementListExportRows`）

`dtb_price_history` を起点に、規格（`dtb_product_class`）ごとに最新の価格変更1件（`DISTINCT ON (pc.id)`、`create_date DESC`）を取り、以下を満たすものを抽出する。

- 価格変更履歴 `ph.create_date` が `price_change_period_from`〜`price_change_period_to`（From 00:00:00〜To 23:59:59）の範囲内。
- 対象店舗（`base_info_id`）のスマレジ在庫区分（`stock_location_id = ProductStock::STOCK_LOCATION_SMAREGI`）の `dtb_product_stock` が存在し、在庫数 `COALESCE(stock, 0) >= 0`。
- 規格のスマレジ連携フラグ有効（`pc.smaregi_alignment_flg = TRUE`）。
- スマレジ商品ID登録済み（`pc.smaregi_product_id IS NOT NULL AND TRIM(...) <> ''`）。
- 商品・商品規格のステータスが廃止でない（`p_status.id <> DISPLAY_ABOLISHED` かつ `pc_status.id <> DISPLAY_ABOLISHED`。非公開は含む）。

### 出力順

外側クエリで次の優先順に整列する（Excel「出力順」要件に対応）。

1. 色の並び順 昇順（`mtb_color_sequence.sort_no`、欠損は 99999）
2. カードタイプの並び順 昇順（`dtb_card_cardtype` 経由 `mtb_cardtype.sort_no` の最小値、欠損は 99999）
3. 点数で見たマナコスト 昇順（`mtb_card.cmc`、欠損は 99999）
4. 基準価格 降順（`pc.standard_price DESC NULLS LAST`）
5. 規格ID 昇順（`product_class_id ASC`）

### 出力列（`BarcodeReplacementListCsvExportService::CSV_HEADER`）と整形（`BarcodeReplacementListCsvRowFormatter`）

| # | CSVヘッダ | 取得元 / 整形 | Excel識別ID |
|---|-----------|----------------|-------------|
| 1 | 商品名 | `Product::name`。商品名の**最後の `]` までを残し、それ以降（色・レアリティ等の略称後）を除去**（`strrpos` で末尾の `]` を検索）。`]` が無ければ全文出力。 | 1 |
| 2 | 言語・状態 | 「言語名(日)・状態コード」形式（例: `英語・NM`）。商品/グッズ予約カテゴリ（`Category::GOODS_ID` / `RESERVED_GOODS_ID`）に属する場合は `サプライ品`。片方欠損時は存在する方のみ。 | 2 |
| 3 | 販売価格 | 規格の**基準価格**（`pc.standard_price`）を `number_format()`＋`円` で整形（例: `1,200円`）。null は空文字。 | 3 |
| 4 | スマレジ商品ID | `pc.smaregi_product_id` | 4 |
| 5 | スマレジ商品コード | `pc.smaregi_product_code` | 5 |
| 6 | スマレジバーコード | `'22'` + スマレジ商品コード（6桁・左0埋め）+ 販売価格（基準価格、7桁・左0埋め）。各桁数超過時は下位桁を採用。商品コード空なら空文字。 | 6 |

> ヘッダ名は「販売価格」だが、値はExcel定義どおり**基準価格**（`standard_price`）を出力する（整形・バーコード生成とも基準価格を使用）。Excel記載の「状態記号は既存バーコードに出力済みのため出力不要」は、出力列に状態記号列が無いことで満たされる。

### プロセスフロー

1. `admin_stock_barcode_replacement_list`（GET）で検索フォームを表示。店舗初期値=デフォルト検索表示店舗、期間初期値=前日〜当日。
2. `admin_stock_barcode_replacement_list_csv_export`（POST）受信。`isTokenValid()` でCSRF検証。
3. `BarcodeReplacementListType` を `handleRequest`。未submitまたは不正なら各エラーメッセージを `addError(..., 'admin')` し `admin_stock_barcode_replacement_list` へリダイレクト。
4. `base_info`・`price_change_period_from`（00:00:00補正）・`price_change_period_to`（23:59:59補正）を取得。
5. `BarcodeReplacementListCsvExportService::export($baseInfo, $from, $to)` を呼ぶ。
6. Service は `set_time_limit(0)`、`StreamedResponse` コールバック内でヘッダ行を出力し、`iterateBarcodeReplacementListExportRows()` の各行を `BarcodeReplacementListCsvRowFormatter` で整形して `fputcsv`。完了時 `log_info('バーコード貼替リストCSV出力完了...')`。

### 分岐・例外

- **CSRF不正（`isTokenValid()`）**: リクエストの `Constant::TOKEN_NAME` トークンが不正な場合、`AccessDeniedHttpException`（403）を送出する（`AbstractController.php:252-263`）。addError・リダイレクトは行われない。
- **フォーム未submit・無効（フォーム `_token` 不正含む）**: フォームのエラーメッセージを `addError(..., 'admin')` で表示し、`admin_stock_barcode_replacement_list` へリダイレクト（既存テスト `testCsvExportWithInvalidFormRedirectsToIndex`）。
- **From > To**: フォーム POST_SUBMIT で `price_change_period_to` にエラー付与 → 上記リダイレクト経路でエラー表示。
- **必須未入力（店舗/期間）**: `NotBlank` 違反 → 同上。
- **対象0件**: 条件に該当する規格が無い場合はヘッダ行のみのCSVを出力する。
- 正常時は `StreamedResponse` でCSVをダウンロード（既存テスト `testCsvExportReturnsStreamedResponseWhenValid`）。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。価格変更履歴・スマレジ在庫・規格情報を読み出してCSV化するのみで、業務データを更新しない。 |
| 参照テーブル | `dtb_price_history`（価格変更履歴）、`dtb_product_class`（スマレジ連携フラグ・スマレジ商品ID/コード・基準価格・言語・状態・ステータス）、`dtb_product`（商品名・ステータス・保管コード・カード詳細）、`dtb_product_stock`（対象店舗のスマレジ在庫）、`dtb_product_category` / `mtb_card` / `mtb_color_sequence` / `mtb_cardtype` / `mtb_card_condition` / `mtb_language` 等（区分・並び順）。 |
| ログ | アプリケーションログに出力完了（`log_info`）を記録。 |

### 関連設計への接続点

- 出力列・出力対象・商品名トリム規則・出力順の業務要件はExcel設計書（バーコード貼替リストCSV出力シート）を正とする。
- URLエンドポイント・抽出条件・整形・並び順・ファイル名・文字コードは `BarcodeReplacementListController` / `BarcodeReplacementListCsvExportService` / `BarcodeReplacementListCsvRowFormatter` / `DtbPriceHistoryRepository` を正とする。
- スマレジバーコード仕様（`22` + 商品コード6桁 + 価格7桁）は資料（バーコード関連資料）を出典とし、実装で確定。

## 表示メッセージ

CSV出力（`csvExport`）でフォームが未submitまたは不正なとき、`$form->getErrors(true)` の各エラーメッセージを `addError(..., 'admin')` で管理画面上部のフラッシュに表示し、`admin_stock_barcode_replacement_list` へリダイレクトする（`BarcodeReplacementListController.php:70-75`）。表示される文言はフォーム制約由来で、以下が該当する。

| メッセージID | 表示位置 | 画面上の文言 | 画面上の文言(英語) | 表示条件 | 後続処理 |
|--------------|----------|--------------|----------|----------|----------|
| M04-30-MSG-001 | 管理画面上部 | 入力されていません。 | 入力されていません。 | 出力対象店舗または価格変更発生期間を入力せずにCSV出力したとき | エラーを表示し、バーコード貼替リスト画面に遷移する |
| M04-30-MSG-002 | 管理画面上部 | 価格変更発生期間の終了日は開始日以降を指定してください。 | 価格変更発生期間の終了日は開始日以降を指定してください。 | 価格変更発生期間の終了日に開始日より前の日付を入力したとき | エラーを表示し、バーコード貼替リスト画面に遷移する |
| — | 管理画面上部フラッシュ（エラー） | 日付形式の検証エラー（Symfony `DateType` 既定 `invalid_message`） | — | 期間フィールドに不正な日付を入力したとき。日本語ロケール文言は本一覧のソース（EE locale）に未定義のため確定不可（要確認） | — |
| — | 管理画面上部フラッシュ（エラー） | フォームCSRFトークン不正エラー（Symfony Form 既定 `csrf_message`） | — | フォームの `_token` が不正なとき（`csrf_protection: true`、`BarcodeReplacementListType.php:101`）。同じ `getErrors(true)`→`addError` 経路で表示される。日本語ロケール文言は本一覧のソース（EE locale）に未定義のため確定不可（要確認） | — |
| M04-30-MSG-003 | 入力項目直下/フォーム上部 | 価格変更発生期間の終了日は開始日以降を指定してください。 | 価格変更発生期間の終了日は開始日以降を指定してください。 | 開始日が終了日より後の状態でCSV出力したとき | エラーを表示し、バーコード貼替リスト画面に遷移する |

> 上記フラッシュは `$error->getMessage()` の逐次表示であり、文言はフォーム制約・ロケール由来のもののみ。固定の成功メッセージは無く、正常時は `StreamedResponse` でCSVをダウンロードする（フラッシュ表示なし）。

## リニューアル移行時の扱い

- 本機能は新規実装であり、現行（pf-eccube3）に同等機能はない。移行後はec-cube-enterpriseの実装が初出となる。DB関連はec-cube-enterpriseを正とする。
- 出力は価格変更履歴（`dtb_price_history`）と対象店舗のスマレジ在庫（`dtb_product_stock` の `stock_location_id = スマレジ`）を突き合わせ、規格（`dtb_product_class`）単位で抽出する。永続化先テーブルの新規作成は無く、既存テーブルの参照で構成される。
- スマレジ商品ID・スマレジ商品コード・スマレジ連携フラグは `dtb_product_class`（`smaregi_product_id` / `smaregi_product_code` / `smaregi_alignment_flg`）、スマレジ在庫は `dtb_product_stock`（`stock_location_id = ProductStock::STOCK_LOCATION_SMAREGI`）で確認済み。

## 実装要確認（未解決）

- Excel記載の「価格変更発生期間は最大1か月」の上限バリデーションは、`BarcodeReplacementListType` では From>To チェックのみで、1か月上限の明示チェックは未確認。

<details>
<summary>Excel設計書からの抽出（原典・テスト網羅の根拠）</summary>

```text
バーコード貼替リストCSV出力
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
石川
更新日
2025-12-11
機能No
M04-30
機能名
バーコード貼替リストCSV出力
概要
対象店舗のスマレジ在庫にある商品の
商品コードリストを出力
処理概要
図形・テキストボックス内テキスト（3件）
レイアウト図
1
2
3
バーコード貼替リストCSV出力 / C7 / image 1
カスタマイズ説明
・カスタマイズ要件
・指定期間で価格調整が発生した商品、かつ、対象店舗のスマレジ在庫にある商品の商品コードリストを出力する
機能仕様処理概要
・初期表示
・出力対象店舗はログイン者のデフォルト検索店舗をデフォルト表示とする
・価格変更発生期間はFromに前日、Toに当日を設定し、前日の00:00:00から当日の23:59:59までを対象とする
・検索
・出力対象店舗は1店舗のみ選択可能で、必須とする
・価格変更発生期間はFromとToどちらも必須とする
・価格変更発生期間のFromの時間は00:00:00、Toの時間は23:59:59で検索を行う
・価格変更発生期間は最大で1か月間を選択可能
・以下の条件で検索を行う
・対象店舗のスマレジ在庫の在庫数が0以上のもの
・スマレジ商品IDが登録済み
・スマレジ連携フラグが有効
・商品および商品規格のステータスが廃止でない（非公開は検索結果に含む）
・価格変更発生期間で指定された期間内に価格変更履歴が存在する
・出力項目について
・商品名
・[]で囲まれた略称の後だけ出さないようにする
例: 【ネオンインク・Foil】(361)■ボーダーレス■《恐れを知らぬ者、カタラ/Katara, the Fearless》[TLA] 金R
↓
【ネオンインク・Foil】(361)■ボーダーレス■《恐れを知らぬ者、カタラ/Katara, the Fearless》[TLA]
※金Rだけ不要なので出さない
・[]がなければすべて出す
・略称は後ろの方についているので、[]を後ろから検索し、略称以前を取り出す
・状態記号
・既存のバーコードに出力されている状態記号は出力不要
・出力順について
・色の並び順昇順
・カードタイプの並び順昇順
・点数で見たマナコストの昇順
・基準価格降順（価格が高い順）
識別IDラベル書式・制限必須最大値初期値画面部品の説明
1出力対象店舗単一選択--デフォルト検索店舗-
2価格調整発生期間日付--Frrom:前日
To:当日-
3バーコード貼替リストCSV出力ボタン---バーコード貼替リストをダウンロード
CSV出力項目
識別ID項目名備考
1商品名商品名の出力方法については処理概要に記載
2言語・状態言語の日本語名・状態のコードの形式で出力（例: 英語・NM）
3販売価格基準価格を出力
#,###円の形で整形して出力
4スマレジ商品IDスマレジ商品ID
5スマレジ商品コードスマレジ商品コード
6スマレジバーコード22 + スマレジ商品コード(6桁0埋め) + 販売価格(7桁0埋め)
参考ファイル: 晴れる屋様_共有フォルダ\03_基本設計フェーズ\基本設計書\資料\バーコード関連資料\09161332プレイド品.xlsx
画像レイヤー（2枚）: バーコード貼替リストCSV出力 / A81 / image 2 + バーコード貼替リストCSV出力 / A88 / image 3
参考ファイル: 晴れる屋様_共有フォルダ\03_基本設計フェーズ\基本設計書\資料\バーコード関連資料\バーコードシール仕様.pptx
画像レイヤー（2枚）: バーコード貼替リストCSV出力 / B116 / image 4 + バーコード貼替リストCSV出力 / A137 / image 5
図形・テキストボックス内テキスト（3件）
画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。
位置テキスト
L6(1)
Z6(2)
AA11(3)
```

</details>
