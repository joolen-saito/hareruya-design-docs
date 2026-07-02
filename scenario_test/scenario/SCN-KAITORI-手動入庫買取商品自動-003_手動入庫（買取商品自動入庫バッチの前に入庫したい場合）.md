<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-KAITORI-手動入庫買取商品自動-003 手動入庫（買取商品自動入庫バッチの前に入庫したい場合）

## 概要
- **目的**: 手動入庫（買取商品自動入庫バッチの前に入庫したい場合）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 手動入庫（買取商品自動入庫バッチの前に入庫したい場合）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 店頭買取 / パターン3
  - 出典: `scenario_test/markdown/06_店頭買取.md`

## アクター
- **主アクター**: 店舗チーム
- **副アクター**: お客様、商品管理チーム、経理担当、支店
- **関連システム**: EC-CUBE、MTGバイヤー、スマレジ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-kaitori-003` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-KAITORI-003` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-kaitori-003 |
| 会員番号 | ST-MEMBER-KAITORI-003 |
| 商品コード | ST-CARD-KAITORI-003 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 買取受付番号 | ST-BUY-KAITORI-003 |
| 査定対象商品 | ST-CARD-KAITORI-003 |
| 査定金額 | 1,200円 |
| 買取ステータス | 査定中 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | 手動入庫（買取商品自動入庫バッチの前に入庫したい場合）を行う | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）（M06-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 店舗チーム | 買取として、店頭買取の1-1～1-9までの処理を行う | M06-12（買取商品一覧CSV）（M06-12） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 店舗チーム | 棚戻し業務用として、選択し棚戻し業務用CSVを出力する | M04-21（在庫変更CSV登録）（M04-21） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 4 | 店舗チーム | 在庫インポート用として、棚戻し業務用CSVから在庫インポート用CSVの作成を行う | M04-01（在庫検索/一覧）（M04-01） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | 店舗チーム | 買取商品入庫として、在庫変更CSVを登録し、買取商品の入庫を行う | 店頭買取管理 — 買取詳細（買取情報の確認と保存）（M06-03） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | 店舗チーム | 戻し作業として、使用する棚戻し業務用PDFは3-2で出力した買取を対象に出力したもの | 店頭買取管理 — 買取ステータス変更（M06-04） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）を開き、商品コード=ST-CARD-KAITORI-003 を検索して「手動入庫（買取商品自動入庫バッチの前に入庫したい場合）を行う」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 店舗チーム | M06-12（買取商品一覧CSV）を開き、商品コード=ST-CARD-KAITORI-003 を検索して「買取として、店頭買取の1-1～1-9までの処理を行う」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 店舗チーム | M04-21（在庫変更CSV登録）を開き、商品コード=ST-CARD-KAITORI-003 を検索して「棚戻し業務用として、選択し棚戻し業務用CSVを出力する」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 4 | 店舗チーム | M04-01（在庫検索/一覧）を開き、商品コード=ST-CARD-KAITORI-003 を検索して「在庫インポート用として、棚戻し業務用CSVから在庫インポート用CSVの作成を行う」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | 店舗チーム | 店頭買取管理 — 買取詳細（買取情報の確認と保存）を開き、商品コード=ST-CARD-KAITORI-003 を検索して「買取商品入庫として、在庫変更CSVを登録し、買取商品の入庫を行う」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | 店舗チーム | 店頭買取管理 — 買取ステータス変更を開き、商品コード=ST-CARD-KAITORI-003 を検索して「戻し作業として、使用する棚戻し業務用PDFは3-2で出力した買取を対象に出力したもの」を実行する | 商品コード=ST-CARD-KAITORI-003 | 商品コード=ST-CARD-KAITORI-003 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 査定結果に不備または対象商品不一致がある | 買取成立に進めず、差戻しまたは再査定状態にする | 査定状態、対象商品、買取明細 |
| A1 | 1 | お客様が査定結果を承認しない | 買取不成立として記録し、在庫入庫や支払を行わない | 買取ステータス、在庫入庫有無、支払有無 |
| E2 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E3 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E4 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E5 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 店舗チーム | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「査定結果に不備または対象商品不一致がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | 買取成立に進めず、差戻しまたは再査定状態にする。確認対象: 査定状態、対象商品、買取明細 |
| 2 | A1 | 店舗チーム | M06-12（買取商品一覧CSV）で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「お客様が査定結果を承認しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | 買取不成立として記録し、在庫入庫や支払を行わない。確認対象: 買取ステータス、在庫入庫有無、支払有無 |
| 3 | E2 | 店舗チーム | M04-21（在庫変更CSV登録）で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E3 | 店舗チーム | M04-01（在庫検索/一覧）で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E4 | 店舗チーム | 店頭買取管理 — 買取詳細（買取情報の確認と保存）で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E5 | 店舗チーム | 店頭買取管理 — 買取ステータス変更で 商品コード=ST-CARD-KAITORI-003 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-003 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 手動入庫（買取商品自動入庫バッチの前に入庫したい場合）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 査定結果に不備または対象商品不一致がある<br>お客様が査定結果を承認しない<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | 査定状態、対象商品、買取明細<br>買取ステータス、在庫入庫有無、支払有無<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: 店頭買取 / パターン3
- **期待する主要機能No**: M06-01, M06-12, M04-21, M04-01, M06-03, M06-04, M06-05, M06-06, M06-07, A06-02, A06-03, A06-05, A06-13, A06-15, A06-16, B06-01, O01-01
- **シナリオに紐づく機能No**: M06-01, M06-12, M04-21, M04-01, M06-03, M06-04, M06-05, M06-06, M06-07, A06-02, A06-03, A06-05, A06-13, A06-15, A06-16, B06-01, O01-01
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧） | M06-01 | `functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md` | `integration_test/e2e/m06_01_admin_store_purchase_purchase_store_search_list_e2e_cases.md` |
  | M06-12（買取商品一覧CSV） | M06-12 | `functions/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.md` | `integration_test/e2e/m06_12_admin_store_purchase_purchase_store_product_list_csv_export_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | 店頭買取管理 — 買取詳細（買取情報の確認と保存） | M06-03 | `functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md` | `integration_test/e2e/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit_e2e_cases.md` |
  | 店頭買取管理 — 買取ステータス変更 | M06-04 | `functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md` | `integration_test/e2e/m06_04_admin_store_purchase_purchase_store_status_change_e2e_cases.md` |
  | 店頭買取管理 — 買取商品履歴（検索／一覧） | M06-05 | `functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md` | `integration_test/e2e/m06_05_admin_store_purchase_purchase_store_history_e2e_cases.md` |
  | m06-06_admin_store_purchase_purchase_store_history_csv_export_all（管理画面_店頭買取管理_買取商品履歴_検索結果全件CSV出力） | M06-06 | `functions/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.md` | `integration_test/e2e/m06_06_admin_store_purchase_purchase_store_history_csv_export_all_e2e_cases.md` |
  | m06-07_admin_store_purchase_purchase_store_history_select_csv_export（管理画面_店頭買取管理_買取商品履歴_選択CSV出力） | M06-07 | `functions/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.md` | `integration_test/e2e/m06_07_admin_store_purchase_purchase_store_history_select_csv_export_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注一覧取得 | A06-02 | `functions/pf-api/a06-02_api_store_purchase_otc_buy_order_list.md` | `integration_test/e2e/a06_02_api_store_purchase_otc_buy_order_list_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注詳細更新 | A06-03 | `functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md` | `integration_test/e2e/a06_03_api_store_purchase_otc_buy_order_update_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注ステータス更新 | A06-05 | `functions/pf-api/a06-05_api_store_purchase_otc_buy_order_status.md` | `integration_test/e2e/a06_05_api_store_purchase_otc_buy_order_status_e2e_cases.md` |
  | API 店頭買取管理 — 本人確認更新 | A06-13 | `functions/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.md` | `integration_test/e2e/a06_13_api_store_purchase_otc_buy_order_identification_e2e_cases.md` |
  | A06-15（店頭買取情報同一所属店舗メンバー取得） | A06-15 | `functions/ec-cube-enterprise/a06-15_api_store_purchase_otc_buy_order_same_store_members.md` | `integration_test/e2e/a06_15_api_store_purchase_otc_buy_order_same_store_members_e2e_cases.md` |
  | A06-16（店頭買取情報ダブルチェック者更新） | A06-16 | `functions/ec-cube-enterprise/a06-16_api_store_purchase_otc_buy_order_double_check_member_update.md` | `integration_test/e2e/a06_16_api_store_purchase_otc_buy_order_double_check_member_update_e2e_cases.md` |
  | B06-01（買取自動入庫バッチ） | B06-01 | `functions/ec-cube-enterprise/b06-01_batch_purchase_purchase_auto_stock.md` | `integration_test/e2e/b06_01_batch_purchase_purchase_auto_stock_e2e_cases.md` |
  | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取） | O01-01 | `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md` | `integration_test/e2e/o01_01_other_mtg_buyer_mtg_buyer_store_purchase_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html`
  - `excel_to_html/output/0308_基本設計仕様書(フロント_店頭買取).html`
  - `excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html`
  - `excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
