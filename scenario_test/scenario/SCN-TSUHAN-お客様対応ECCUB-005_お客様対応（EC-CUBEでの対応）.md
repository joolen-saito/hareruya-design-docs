<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-TSUHAN-お客様対応ECCUB-005 お客様対応（EC-CUBEでの対応）

## 概要
- **目的**: お客様対応（EC-CUBEでの対応）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: お客様対応（EC-CUBEでの対応）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 通販受注管理 / パターン5
  - 出典: `scenario_test/markdown/16_通販受注管理.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、GMO、配送/ラベル印字アプリ
- **関連システム**: EC-CUBE、GMO、メール、海外発送管理アプリ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-tsuhan-005` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `受注番号=ST-ORDER-TSUHAN-005` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-tsuhan-005 |
| 会員番号 | ST-MEMBER-TSUHAN-005 |
| 商品コード | ST-CARD-TSUHAN-005 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 受注番号 | ST-ORDER-TSUHAN-005 |
| 決済状態 | 売上確定済み |
| 受注ステータス | 対応中 |
| 返金対象金額 | 1,000円 |
| 配送方法 | 宅配便 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | お客様 | お客様対応（EC-CUBEでの対応）を行う | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（M05-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | お客様 | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）を開き、受注番号=ST-ORDER-TSUHAN-005 を検索して「お客様対応（EC-CUBEでの対応）を行う」を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 受注番号=ST-ORDER-TSUHAN-005 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| A1 | 1 | お客様対応として、個別対応・準キャンセル・キャンセル・予約入金メール対応を行うフロー | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| E1 | 1 | メール受領として、※欠品の初回対応はこちらで対応 | 不足内容を表示し、完了扱いにせず保留または欠品状態として記録する | 在庫数、欠品状態、在庫変更履歴 |
| E2 | 1 | 決済失敗または入金額不一致が発生する | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする | 受注ステータス、決済状態、入金額 |
| E3 | 1 | 出荷対象商品の在庫が不足している | 出荷を確定せず、欠品または保留状態として確認できる状態にする | 受注ステータス、在庫数、出荷可否 |
| A2 | 1 | キャンセルまたは返金が必要になる | 対象金額と戻し処理を記録し、通知または返金結果を確認できる状態にする | 返金額、受注ステータス、通知結果 |
| E4 | 1 | 配送・ラベル印字・海外発送連携に失敗する | 出荷完了にせず、再実行可能な保留状態にする | 連携結果、出荷ステータス、再実行可否 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | A1 | お客様 | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「お客様対応として、個別対応・準キャンセル・キャンセル・予約入金メール対応を行うフロー」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 2 | E1 | 通販チーム | m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「メール受領として、※欠品の初回対応はこちらで対応」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 不足内容を表示し、完了扱いにせず保留または欠品状態として記録する。確認対象: 在庫数、欠品状態、在庫変更履歴 |
| 3 | E2 | 通販チーム | m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「決済失敗または入金額不一致が発生する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする。確認対象: 受注ステータス、決済状態、入金額 |
| 4 | E3 | 通販チーム | m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「出荷対象商品の在庫が不足している」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 出荷を確定せず、欠品または保留状態として確認できる状態にする。確認対象: 受注ステータス、在庫数、出荷可否 |
| 5 | A2 | 通販チーム | m05-23_admin_order_order_shipping_standby_print_delivery_slips_en（管理画面_受注管理_出荷指示_納品書印刷_英語）で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「キャンセルまたは返金が必要になる」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 対象金額と戻し処理を記録し、通知または返金結果を確認できる状態にする。確認対象: 返金額、受注ステータス、通知結果 |
| 6 | E4 | 通販チーム | m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）で 受注番号=ST-ORDER-TSUHAN-005 を対象に、条件「配送・ラベル印字・海外発送連携に失敗する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-005 | 出荷完了にせず、再実行可能な保留状態にする。確認対象: 連携結果、出荷ステータス、再実行可否 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- お客様対応（EC-CUBEでの対応）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| メール/通知 | ○ |

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
| 6 | お客様対応として、個別対応・準キャンセル・キャンセル・予約入金メール対応を行うフロー<br>メール受領として、※欠品の初回対応はこちらで対応<br>決済失敗または入金額不一致が発生する<br>出荷対象商品の在庫が不足している | キャンセル状態、在庫戻し、通知結果、操作履歴<br>在庫数、欠品状態、在庫変更履歴<br>受注ステータス、決済状態、入金額<br>受注ステータス、在庫数、出荷可否 |

## トレーサビリティ
- **カバーする業務フロー番号**: 通販受注管理 / パターン5
- **期待する主要機能No**: M05-01, M05-18, M05-21, M05-22, M05-23, M05-24, M05-26, M05-11, B05-08, B05-09, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
- **シナリオに紐づく機能No**: M05-01, M05-18, M05-21, M05-22, M05-23, M05-24, M05-26, M05-11, B05-08, B05-09, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧） | M05-01 | `functions/pf-eccube3/m05-01_admin_order_order_search_list.md` | `integration_test/e2e/m05_01_admin_order_order_search_list_e2e_cases.md` |
  | m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成） | M05-18 | `functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md` | `integration_test/e2e/m05_18_admin_order_order_shipping_standby_list_create_e2e_cases.md` |
  | m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷） | M05-21 | `functions/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.md` | `integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md` |
  | m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語）） | M05-22 | `functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md` | `integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md` |
  | m05-23_admin_order_order_shipping_standby_print_delivery_slips_en（管理画面_受注管理_出荷指示_納品書印刷_英語） | M05-23 | `functions/pf-eccube3/m05-23_admin_order_order_shipping_standby_print_delivery_slips_en.md` | `integration_test/e2e/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en_e2e_cases.md` |
  | m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力） | M05-24 | `functions/pf-eccube3/m05-24_admin_order_order_shipping_export_for_import.md` | `integration_test/e2e/m05_24_admin_order_order_shipping_export_for_import_e2e_cases.md` |
  | m05-26_admin_order_order_shipping_result_csv_import（管理画面_受注管理_出荷実績インポート登録） | M05-26 | `functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md` | `integration_test/e2e/m05_26_admin_order_order_shipping_result_csv_import_e2e_cases.md` |
  | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集） | M05-11 | `functions/pf-eccube3/m05-11_admin_order_order_edit.md` | `integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md` |
  | バッチ 受注管理 — スマレジEC受注連携エラー再連携 | B05-08 | `functions/pf-eccube3/b05-08_batch_order_smaregi_check_error_order.md` | `integration_test/e2e/b05_08_batch_order_smaregi_check_error_order_e2e_cases.md` |
  | バッチ 受注管理 — スマレジ取引連携エラー再連携 | B05-09 | `functions/pf-eccube3/b05-09_batch_order_smaregi_check_transaction.md` | `integration_test/e2e/b05_09_batch_order_smaregi_check_transaction_e2e_cases.md` |
  | F04-01（買い物かご） | F04-01 | `functions/pf-eccube3/f04-01_front_cart_cart_index.md` | `integration_test/e2e/f04_01_front_cart_cart_index_e2e_cases.md` |
  | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文） | F04-02 | `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md` | `integration_test/e2e/f04_02_front_cart_shopping_order_method_e2e_cases.md` |
  | F04-03（注文時の配送先登録・変更） | F04-03 | `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md` | `integration_test/e2e/f04_03_front_cart_shopping_delivery_edit_e2e_cases.md` |
  | カート — 決済〜購入完了 | F04-04 | `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md` | `integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md` |
  | m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力） | M05-02 | `functions/pf-eccube3/m05-02_admin_order_order_csv_export.md` | `integration_test/e2e/m05_02_admin_order_order_csv_export_e2e_cases.md` |
  | m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード） | M05-03 | `functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md` | `integration_test/e2e/m05_03_admin_order_order_custom_csv_export_e2e_cases.md` |
  | m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括） | M05-06 | `functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md` | `integration_test/e2e/m05_06_admin_order_order_bulk_manual_mail_e2e_cases.md` |
  | m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更） | M05-12 | `functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md` | `integration_test/e2e/m05_12_admin_order_order_bulk_status_change_e2e_cases.md` |
  | m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力） | M05-13 | `functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md` | `integration_test/e2e/m05_13_admin_order_order_tracking_number_e2e_cases.md` |
  | m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更） | M05-14 | `functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md` | `integration_test/e2e/m05_14_admin_order_order_status_change_e2e_cases.md` |
  | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知） | M05-15 | `functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md` | `integration_test/e2e/m05_15_admin_order_order_mail_e2e_cases.md` |
  | m05-16_admin_order_order_shop_memo（管理画面_受注編集_ショップ用メモ登録） | M05-16 | `functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md` | `integration_test/e2e/m05_16_admin_order_order_shop_memo_e2e_cases.md` |
  | m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録） | M05-17 | `functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md` | `integration_test/e2e/m05_17_admin_order_order_shipping_memo_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html`
  - `excel_to_html/output/0304_基本設計仕様書(フロント_注文).html`
  - `excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html`
  - `excel_to_html/output/0505_基本設計仕様書(API_受注管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
