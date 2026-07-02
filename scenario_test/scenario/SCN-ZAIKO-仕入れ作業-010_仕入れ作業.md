<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-ZAIKO-仕入れ作業-010 仕入れ作業

## 概要
- **目的**: 仕入れ作業を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 仕入れ作業が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 在庫管理 / パターン9
  - 出典: `scenario_test/markdown/12_在庫管理.md`

## アクター
- **主アクター**: トレードチーム
- **副アクター**: 店舗チーム、商品管理チーム、通販チーム、支店
- **関連システム**: EC-CUBE、スマレジ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-zaiko-009` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-STOCK-ZAIKO-009` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-zaiko-009 |
| 会員番号 | ST-MEMBER-ZAIKO-009 |
| 商品コード | ST-STOCK-ZAIKO-009 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 移動元ロケーション | 本店バックヤード |
| 移動先ロケーション | 支店テスト棚 |
| 移動数量 | 3 |
| 在庫状態 | 移動可能 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | トレードチーム | 仕入れ作業を行う | M04-01（在庫検索/一覧）（M04-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 商品管理チーム | 現在庫データをダウンロードとして、商品管理＞商品マスター よりダウンロード | M04-02（在庫編集機能）（M04-02） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 3 | トレードチーム | 打ち込みファイル作成として、ダウンロードした在庫データに「並び順ファイル」を用い並び順を充てる | M04-03（在庫一括編集）（M04-03） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | トレードチーム | Wチェックとして、打ち込みファイルのコピーを作成し、別の人が同じ仕入れものを | M04-04（在庫情報CSV出力）（M04-04） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | トレードチーム | 在庫インポート作業として、インポート担当者が 商品CSV管理＞在庫変更CSV登録 にてインポート | M04-08（在庫移動・振替検索/一覧）（M04-08） | 対象データが登録され、一覧または詳細で確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | トレードチーム | M04-01（在庫検索/一覧）を開き、商品コード=ST-STOCK-ZAIKO-009 を検索して「仕入れ作業を行う」を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 商品コード=ST-STOCK-ZAIKO-009 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 商品管理チーム | M04-02（在庫編集機能）を開き、商品コード=ST-STOCK-ZAIKO-009 を検索して「現在庫データをダウンロードとして、商品管理＞商品マスター よりダウンロード」を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 商品コード=ST-STOCK-ZAIKO-009 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 3 | トレードチーム | M04-03（在庫一括編集）を開き、商品コード=ST-STOCK-ZAIKO-009 を検索して「打ち込みファイル作成として、ダウンロードした在庫データに「並び順ファイル」を用い並び順を充てる」を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 商品コード=ST-STOCK-ZAIKO-009 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | トレードチーム | M04-04（在庫情報CSV出力）を開き、商品コード=ST-STOCK-ZAIKO-009 を検索して「Wチェックとして、打ち込みファイルのコピーを作成し、別の人が同じ仕入れものを」を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 商品コード=ST-STOCK-ZAIKO-009 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | トレードチーム | M04-08（在庫移動・振替検索/一覧）を開き、商品コード=ST-STOCK-ZAIKO-009 を検索して「在庫インポート作業として、インポート担当者が 商品CSV管理＞在庫変更CSV登録 にてインポート」を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 商品コード=ST-STOCK-ZAIKO-009 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 在庫変更依頼ファイル作成として、差異チェック後、在庫変更依頼用ファイルとして保存する | 差異内容を表示し、確認または承認なしに確定処理へ進ませない | 在庫数、欠品状態、在庫変更履歴 |
| E2 | 1 | 移動・出庫・引当の対象在庫が不足している | 処理を完了扱いにせず、在庫数と不足理由を確認できる状態にする | 在庫数、在庫変更履歴、処理ステータス |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E5 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E6 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | トレードチーム | M04-01（在庫検索/一覧）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「在庫変更依頼ファイル作成として、差異チェック後、在庫変更依頼用ファイルとして保存する」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 差異内容を表示し、確認または承認なしに確定処理へ進ませない。確認対象: 在庫数、欠品状態、在庫変更履歴 |
| 2 | E2 | トレードチーム | M04-02（在庫編集機能）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「移動・出庫・引当の対象在庫が不足している」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 処理を完了扱いにせず、在庫数と不足理由を確認できる状態にする。確認対象: 在庫数、在庫変更履歴、処理ステータス |
| 3 | E3 | トレードチーム | M04-03（在庫一括編集）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | トレードチーム | M04-04（在庫情報CSV出力）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E5 | トレードチーム | M04-08（在庫移動・振替検索/一覧）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E6 | トレードチーム | M04-09（在庫移動・振替登録/編集）で 商品コード=ST-STOCK-ZAIKO-009 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-STOCK-ZAIKO-009 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 仕入れ作業の対象データが、業務フロー上の次工程または完了状態として追跡できる。
- 画面、CSV/帳票、メール、外部システムのいずれかで、処理結果が確認できる。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
| 正常系 | ○ |
| 代替系 | ○ |
| 異常系 | ○ |
| 外部連携 | ○ |
| データ更新 | ○ |
| CSV/帳票 | ○ |
| メール/通知 | - |

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
| 6 | 在庫変更依頼ファイル作成として、差異チェック後、在庫変更依頼用ファイルとして保存する<br>移動・出庫・引当の対象在庫が不足している<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | 在庫数、欠品状態、在庫変更履歴<br>在庫数、在庫変更履歴、処理ステータス<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: 在庫管理 / パターン9
- **期待する主要機能No**: M04-01, M04-02, M04-03, M04-04, M04-08, M04-09, M04-10, M04-21, M04-22, M04-24, M04-25, M04-26, M04-27, M04-28, M04-29, M04-32, M04-33, M04-34
- **シナリオに紐づく機能No**: M04-01, M04-02, M04-03, M04-04, M04-08, M04-09, M04-10, M04-21, M04-22, M04-24, M04-25, M04-26, M04-27, M04-28, M04-29, M04-32, M04-33, M04-34
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | M04-02（在庫編集機能） | M04-02 | `functions/ec-cube-enterprise/m04-02_admin_stock_stock_edit.md` | `integration_test/e2e/m04_02_admin_stock_stock_edit_e2e_cases.md` |
  | M04-03（在庫一括編集） | M04-03 | `functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md` | `integration_test/e2e/m04_03_admin_stock_stock_bulk_edit_e2e_cases.md` |
  | M04-04（在庫情報CSV出力） | M04-04 | `functions/ec-cube-enterprise/m04-04_admin_stock_stock_csv_export.md` | `integration_test/e2e/m04_04_admin_stock_stock_csv_export_e2e_cases.md` |
  | M04-08（在庫移動・振替検索/一覧） | M04-08 | `functions/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.md` | `integration_test/e2e/m04_08_admin_stock_stock_move_transfer_search_list_e2e_cases.md` |
  | M04-09（在庫移動・振替登録/編集） | M04-09 | `functions/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.md` | `integration_test/e2e/m04_09_admin_stock_stock_move_transfer_register_edit_e2e_cases.md` |
  | M04-10（在庫移動・振替情報CSV出力） | M04-10 | `functions/ec-cube-enterprise/m04-10_admin_stock_stock_move_transfer_csv_export.md` | `integration_test/e2e/m04_10_admin_stock_stock_move_transfer_csv_export_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | M04-22（在庫移動・振替CSV登録） | M04-22 | `functions/ec-cube-enterprise/m04-22_admin_stock_stock_move_transfer_csv_import.md` | `integration_test/e2e/m04_22_admin_stock_stock_move_transfer_csv_import_e2e_cases.md` |
  | M04-24（在庫移動指示リスト作成/検索） | M04-24 | `functions/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.md` | `integration_test/e2e/m04_24_admin_stock_stock_move_instruction_search_create_e2e_cases.md` |
  | M04-25（在庫移動指示リストエクスポート） | M04-25 | `functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md` | `integration_test/e2e/m04_25_admin_stock_stock_move_instruction_export_e2e_cases.md` |
  | M04-26（ピッキングリスト印刷） | M04-26 | `functions/ec-cube-enterprise/m04-26_admin_stock_stock_move_instruction_picking_list_print.md` | `integration_test/e2e/m04_26_admin_stock_stock_move_instruction_picking_list_print_e2e_cases.md` |
  | M04-27（在庫移動実績入力用CSV出力） | M04-27 | `functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md` | `integration_test/e2e/m04_27_admin_stock_stock_move_result_csv_export_e2e_cases.md` |
  | M04-28（送り状CSV出力） | M04-28 | `functions/ec-cube-enterprise/m04-28_admin_stock_stock_invoice_csv_export.md` | `integration_test/e2e/m04_28_admin_stock_stock_invoice_csv_export_e2e_cases.md` |
  | M04-29（在庫移動実績 インポート） | M04-29 | `functions/ec-cube-enterprise/m04-29_admin_stock_stock_move_result_csv_import.md` | `integration_test/e2e/m04_29_admin_stock_stock_move_result_csv_import_e2e_cases.md` |
  | M04-32（承認一覧） | M04-32 | `functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md` | `integration_test/e2e/m04_32_admin_stock_stock_approval_list_e2e_cases.md` |
  | M04-33（戻しリストCSV） | M04-33 | `functions/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.md` | `integration_test/e2e/m04_33_admin_stock_stock_move_return_list_csv_export_e2e_cases.md` |
  | M04-34（戻しリストPDF） | M04-34 | `functions/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.md` | `integration_test/e2e/m04_34_admin_stock_stock_move_return_list_pdf_export_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html`
  - `excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html`
  - `excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
