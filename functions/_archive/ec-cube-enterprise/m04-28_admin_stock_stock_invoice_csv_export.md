# m04-28_admin_stock_stock_invoice_csv_export — 5分類外の退避

<!-- 5分類（処理フロー / 入出力 / 業務ロジック / 表示メッセージ / エラー処理）へ
     写像しなかった節の退避先。設計書本体から外した内容をそのまま保持する。
     規約は .cursor/skills/output-exclusion-policy/SKILL.md を正本とする。 -->

## 1. 送り状CSV出力

### CSV出力仕様

| 観点 | 内容 |
|------|------|
| 出力単位 | 在庫移動指示1件＝CSV1行。`ids[]` に複数指定すると複数行を出力する。 |
| 対象取得 | `findByIdsForLabelExport($ids)`。`s.id IN (:ids)` を移動元店舗（`MoveFromBaseInfo`）・移動先店舗（`MoveToBaseInfo`）と各 `Pref`（都道府県）を JOIN して取得し、`id ASC` で並べる。 |
| 文字コード | `CsvExportService` 経由で `eccube_csv_export_encoding`（既定 `SJIS-win`）へ変換。区切り文字 `eccube_csv_export_separator`、囲み文字 `"`。 |
| ファイル名 | `stock_move_instruction_labels_{YmdHis}.csv`（`{YmdHis}` は出力時刻）。 |
| Content-Type | `application/octet-stream`（ダウンロード）。 |
| 完了ログ | `log_info` に「在庫移動指示 送り状CSV出力完了. ファイル名: …」を記録。 |

#### 出力列（23列・ヘッダー固定）

| # | ヘッダー | 値（実装） |
|---|----------|------------|
| 1 | 注文番号 | 移動指示ID（`DtbStockMoveInstruction::getId()`） |
| 2 | 注文金額合計 | 基準価格合計（`getStandardTotalPrice()`） |
| 3 | 注文者氏名 | 移動元店舗の「会社名 + 半角空白 + 店名」（例: 株式会社 晴れる屋 大宮） |
| 4 | 注文者カナ | 移動元店舗の「会社名カナ + 半角空白 + 店名カナ」 |
| 5 | 注文者郵便番号 | 移動元店舗の郵便番号（`BaseInfo::getPostalCode()`） |
| 6 | 注文者都道府県 | 移動元店舗の都道府県名（`Pref::getName()`、未設定は空） |
| 7 | 注文者住所 | 移動元店舗の住所1（`getAddr01()`） |
| 8 | 注文者住所2 | 移動元店舗の住所2（`getAddr02()`） |
| 9 | 注文者電話番号 | 移動元店舗の電話番号（`getPhoneNumber()`） |
| 10 | 商品金額合計 | 基準価格合計（2と同値） |
| 11 | 送料 | `0` 固定 |
| 12 | 送料(税抜) | `0` 固定 |
| 13 | 手数料 | `0` 固定 |
| 14 | 手数料(税抜) | `0` 固定 |
| 15 | 配送先氏名 | 移動先店舗の「会社名 + 半角空白 + 店名」 |
| 16 | 配送先カナ | 移動先店舗の「会社名カナ + 半角空白 + 店名カナ」 |
| 17 | 配送先郵便番号 | 移動先店舗の郵便番号 |
| 18 | 配送先都道府県 | 移動先店舗の都道府県名 |
| 19 | 配送先住所 | 移動先店舗の住所1 |
| 20 | 配送先住所2 | 移動先店舗の住所2 |
| 21 | 配送先電話番号 | 移動先店舗の電話番号 |
| 22 | 郵便種別 | `0` 固定（0：ゆうパック） |
| 23 | 発送方法 | `ゆうパック`（固定文字列） |

会社名と店名の連結（3・4・15・16列）は、両者をtrimのうえ双方とも空でなければ半角スペース1つで連結し、片方のみのときはその値、両方空のときは空文字列とする（`joinWithHalfWidthSpace`）。

> Excel設計書の識別ID（1〜23）と実装の列順は一致する。識別IDの呼称「オーダーID／注文者…／配送先…」に対し、実装ヘッダーは受注の送り状CSVに合わせた「注文番号／注文者…／配送先…」となっている。

### プロセスフロー

1. 一覧画面でチェックした移動指示の `ids[]` をPOST送信する。
2. `set_time_limit(0)` ののち `isTokenValid()` でCSRFトークンを検証。
3. `ids` が空配列なら `NotFoundHttpException`（404）。
4. `StockMoveInstructionLabelCsvExporterService::exportByInstructionIds($ids)` を呼ぶ。
5. `StreamedResponse` のコールバックでヘッダー（23列）を出力後、`findByIdsForLabelExport` で対象を取得し、各指示について `buildRow()` で1行ずつ出力する。
6. ファイル名・Content-Type を設定し、完了ログを出力してダウンロードさせる。

### 状態・データ更新

| 対象 | 内容 |
|------|------|
| 主データ | **参照のみ**。`dtb_stock_move_instruction` と移動元・移動先の店舗（`BaseInfo`、`Pref`）を参照してCSVを生成するだけで、業務データは更新しない。 |
| 履歴・ログ | 出力完了時にアプリケーションログ（`log_info`）を記録。取込履歴・在庫履歴等は作成しない。 |

### 例外処理

- **対象未選択**: `ids` が未指定／空配列の場合は404（既存テスト `testExportLabelCsvWithoutIdsReturns404` で `ids` 無し・`ids=[]` の双方を確認）。画面側ではチェック0件のとき `csv_invoice_select_rows` のアラートを表示し送信させない。
- **CSRF不正**: `isTokenValid()` 失敗時は共通の不正トークン処理。
- **対象なし**: 指定IDが存在しない場合、ヘッダーのみのCSV（データ行なし）を出力する（`findByIdsForLabelExport` が空配列を返すため）。
- **店舗情報の欠落**: 郵便番号・都道府県・住所・電話番号・会社名・店名が未設定の列は空文字列として出力する（`?? ''`／都道府県は `Pref` が null なら空）。

### 関連設計への接続点

- 送り元・送り先の会社名・カナ・郵便番号・都道府県・住所1/2・電話番号は店舗管理（`BaseInfo` および `Pref`）から取得する。各列の登録仕様は店舗管理設計を正とする。
- 出力対象の移動指示は `dtb_stock_move_instruction`、基準価格合計は同テーブルの `standard_total_price`。
- 在庫移動実績入力用CSV雛形（M04-27）・在庫移動実績CSV取込（M04-29）とは列構成・対象・契機が異なる別機能である。
