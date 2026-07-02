# SCN-ZAIKO-移動-001 支店在庫移動（本店トレード→支店）

## 概要
- **目的**: 支店からの融通依頼に対し、本店トレードの在庫を**店舗間移動**で支店へ移し、
  出庫承認〜入庫承認を経て**支店在庫として入庫完了**するまでを一連で完遂する。
- **分類**: 正常系（メインフロー）
- **優先度**: P1（在庫移動はマトリクスで最多画面を横断する本命フロー）
- **業務トリガー**: 支店から「融通してほしいカードがある」と依頼があったとき。
- **トレース元要件**:
  - 業務フロー番号: **5 支店在庫移動（トレード・商品管理→支店）**（マトリクス R13 の「2〜6 在庫移動」内）
  - 出典: `sinario_test/markdown/13_在庫管理_tobe.md`, `01_業務フロー画面マトリクス.md`

## アクター
- **主アクター**: トレードチーム（移動登録・指示・実績）
- **副アクター**: 承認者（出庫承認）、支店（入庫承認・受領）
- **関連システム**: EC-CUBE（本店）／EC-CUBE（支店）

## 事前条件・テストデータ・環境
- **事前条件**: トレードが管理画面にログイン済（在庫編集権限あり）。承認者は承認権限あり。
- **テストデータ(SEED)**: 本店トレードに在庫数が既知の対象商品在庫（`ProductStock`）が存在。
  既存ケースの `SEED-M04-09-MOVE-SRC`（使い捨て）を流用可。入庫先＝支店店舗マスタが存在。
- **環境/マスタ**: 店舗マスタ（本店・支店）、在庫区分マスタ。外部システム連携は本シナリオでは不要。

## メインフロー（正常系：店舗間移動）
| # | アクター | 画面（機能No） | 操作 | 期待結果（画面で観測可能） |
|---|---|---|---|---|
| 1 | トレード | 在庫検索一覧（M04-01） | 対象商品在庫を検索し行をチェック→「在庫移動」へ遷移 | 移動 初期登録画面へ遷移し、出庫元店舗＝本店・出庫元在庫区分（変更不可）が表示される |
| 2 | トレード | 在庫移動・振替登録（M04-09） | 入庫先店舗＝支店、入庫先在庫区分、移動点数（在庫数以内）、メモを入力→「登録」→確認モーダルで確定 | 「保存しました」が表示され、出庫承認申請画面（`/…/product/stock/move/outbound_approval_request/{id}`）へ遷移。出庫元在庫が移動点数分**減算**され、ステータス＝**新規登録** |
| 3 | トレード | 移動 ピック・出庫承認申請（M04-09 編集） | 欠品点数・メモ・承認通知先を確認/更新→更新を確定 | 店舗間移動のためステータス＝**出庫承認待ち**となり、出庫承認画面へ遷移 |
| 4 | 承認者 | 在庫承認一覧（M04-32） | 対象の在庫移動を**出庫承認** | ステータス＝**出庫承認済み**になり、承認一覧から消える/状態表示が更新される |
| 5 | トレード | 在庫移動指示リスト作成検索（M04-24） | 出庫承認済みの移動を対象に移動指示リストを作成 | 指示リストが作成され一覧に表示される |
| 6 | トレード | 指示リストエクスポート（M04-25）／ピッキングリスト印刷（M04-26）／送り状CSV出力（M04-28） | 指示リスト出力・ピッキングリスト印刷・送り状CSV出力 | それぞれのファイル/印刷物が出力される |
| 7 | トレード | （物理作業） | ピッキングし支店へ配送 | （画面外） |
| 8 | トレード | 在庫移動実績入力用CSV出力（M04-27） | 実績入力用CSVを出力 | 実績入力用CSVがダウンロードされる |
| 9 | トレード | 在庫移動実績インポート（M04-29） | 実績CSVを取り込む | 取込完了が表示され、実績が反映される |
| 10 | 支店/承認者 | 在庫承認一覧（M04-32） | 入庫承認申請→**入庫承認** | ステータス＝**入庫完了**となり、入庫先（支店）`ProductStock` が移動点数分**加算**される |
| 11 | トレード | 在庫履歴検索一覧（M04-17）／在庫変動履歴CSV出力（M04-18） | 対象商品の移動履歴を確認 | 出庫（`MOVE_OUTBOUND`）・入庫（`MOVE_INBOUND`）の変動履歴が記録されている |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 |
|---|---|---|---|
| A1（代替：店舗内移動） | 2 | 出庫元店舗＝入庫先店舗（同一店舗・別区分） | 承認不要。出庫承認申請の更新でステータス＝**入庫完了**となり、入庫先在庫が即加算（→別シナリオ `SCN-ZAIKO-品出-001` で詳細化） |
| E1 | 2 | 移動点数＞現在庫数 | 「移動点数が現在の在庫数を超えています。」が表示され、登録されない（IT-22） |
| E2 | 2 | 入庫先店舗 未選択 | 必須入力エラーが表示され、登録画面に留まり登録されない（IT-22） |
| E3 | 2 | 入庫先＝出庫元と同一店舗・同一区分 | 「出庫元と入庫先が同じです。」が表示され、登録されない（IT-22） |
| E4（承認却下） | 4 | 出庫承認で却下/差し戻し | 移動が差し戻され在庫が戻る。`> [要確認]` 却下時の在庫戻し挙動は承認系機能（M04-09対象外）の設計を正とする |
| E5（状態不整合） | 3〜10 | ステータスに合わないURLへ直アクセス | 現ステータスに応じた対応画面へリダイレクト（`redirectByMoveTransferStatus`、IT-03） |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 本店トレードの対象在庫が移動点数分**減少**し、**支店在庫が同数増加**している。
- 在庫移動レコードが**入庫完了**で終端し、出庫・入庫の**変動履歴が整合**している。
- 指示リスト・送り状・実績取込まで業務が**端から端まで完遂**している。

## トレーサビリティ
- **カバーする業務フロー番号**: 5（支店在庫移動）。関連: 2〜7 在庫移動群。
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | 在庫検索一覧 | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | 在庫移動・振替登録/編集 | M04-09 | `functions/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.md` | `integration_test/e2e/m04_09_admin_stock_stock_move_transfer_register_edit_e2e_cases.md` |
  | 在庫承認一覧 | M04-32 | `functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md` | `integration_test/e2e/m04_32_admin_stock_stock_approval_list_e2e_cases.md` |
  | 移動指示リスト作成検索 | M04-24 | `functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md` | `integration_test/e2e/m04_24_admin_stock_stock_move_instruction_search_create_e2e_cases.md` |
  | 指示リストエクスポート | M04-25 | `functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md` | `integration_test/e2e/m04_25_admin_stock_stock_move_instruction_export_e2e_cases.md` |
  | ピッキングリスト印刷 | M04-26 | `functions/ec-cube-enterprise/m04-26_admin_stock_stock_move_instruction_picking_list_print.md` | `integration_test/e2e/m04_26_admin_stock_stock_move_instruction_picking_list_print_e2e_cases.md` |
  | 送り状CSV出力 | M04-28 | `functions/ec-cube-enterprise/m04-28_admin_stock_stock_invoice_csv_export.md` | `integration_test/e2e/m04_28_admin_stock_stock_invoice_csv_export_e2e_cases.md` |
  | 移動実績入力用CSV出力 | M04-27 | `functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md` | `integration_test/e2e/m04_27_admin_stock_stock_move_result_csv_export_e2e_cases.md` |
  | 移動実績インポート | M04-29 | `functions/ec-cube-enterprise/m04-29_admin_stock_stock_move_result_csv_import.md` | `integration_test/e2e/m04_29_admin_stock_stock_move_result_csv_import_e2e_cases.md` |
  | 在庫履歴検索一覧 | M04-17 | `functions/pf-eccube3/m04-17_admin_stock_stock_history_search_list.md` | `integration_test/e2e/m04_17_admin_stock_stock_history_search_list_e2e_cases.md` |
  | 在庫変動履歴CSV出力 | M04-18 | `functions/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.md` | `integration_test/e2e/m04_18_admin_stock_stock_history_csv_export_e2e_cases.md` |
- **関連テスト観点**: IT-22（バリデーション）、IT-03（画面遷移）、IT-26（登録/更新内容）、IT-15（状態変化）。
- **マトリクスとの差分（透明性のため明示）**:
  - マトリクス flow「2〜6 在庫移動」の〇印画面のうち、本正常系は**画面登録経路**を採るため
    在庫移動・振替情報CSV出力(M04-10)・在庫移動・振替CSV登録(M04-22)は**代替（CSV一括）経路**として
    本シナリオでは使用せず（→代替系で別途）。在庫リコメンドCSV出力(M04-16)は flow 2 の画面。
  - 逆に**在庫承認一覧(M04-32)・在庫履歴(M04-17/18)はマトリクスの当該行で未マーク**だが、
    M04-09 の to-be ステータス遷移（出庫承認・入庫承認）と在庫変動履歴の自動記録より**補完**した。

> [要確認] 出庫承認・入庫承認の確定処理は M04-09 の対象外（承認系別機能）。承認画面の正確な
> 操作単位・却下時の在庫戻し挙動は承認系機能仕様の確定後に #4・#10・E4 を追補する。
