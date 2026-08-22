# m04-30_admin_stock_stock_barcode_replacement_list_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. バーコード貼替リストCSV出力

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

---

## 0203に無い定型節（設計書からは削除・2026-08-19）

### 入出力: 永続化
本機能はデータを更新しない。価格変更履歴・スマレジ在庫・商品規格・商品・カテゴリ・区分の各情報を参照するだけである。
