<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-TSUHAN-予約受注対応シングル-011 予約受注対応（シングルカード）

## 概要
- **目的**: 予約受注対応（シングルカード）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 予約受注対応（シングルカード）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 通販受注管理 / パターン11
  - 出典: `scenario_test/markdown/16_通販受注管理.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、GMO、配送/ラベル印字アプリ
- **関連システム**: EC-CUBE、GMO、メール、海外発送管理アプリ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-tsuhan-011` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `受注番号=ST-ORDER-TSUHAN-011` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-tsuhan-011 |
| 会員番号 | ST-MEMBER-TSUHAN-011 |
| 商品コード | ST-CARD-TSUHAN-011 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 受注番号 | ST-ORDER-TSUHAN-011 |
| 決済状態 | 売上確定済み |
| 受注ステータス | 対応中 |
| 返金対象金額 | 1,000円 |
| 配送方法 | 宅配便 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 通販チーム | 予約受注対応（シングルカード）を行う | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（M05-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 通販チーム | 出荷指示再作成作業として、作業範囲の作成済みの予約受注の出荷指示を削除して解体し | m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（M05-18） | 対象データが登録され、一覧または詳細で確認できる |
| 3 | 通販チーム | 発送準備作業として、再作成した出荷指示ごとに、コメント対応を行いながら | m05-04_admin_order_order_shipping_csv_export（管理画面_受注管理_配送CSV出力）（M05-04） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | 通販チーム | 梱包作業として、ピック・振り分け・梱包を行い発売前日まで保管 | m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）（M05-21） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | 通販チーム | チェックリスト作成として、発売前日の15時締めでチェックシートの作成を行う | m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（M05-22） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | 通販チーム | インポートデータ作成として、インポートデータを作成しておく | m05-23_admin_order_order_shipping_standby_print_delivery_slips_en（管理画面_受注管理_出荷指示_納品書印刷_英語）（M05-23） | 対象データが登録され、一覧または詳細で確認できる |
| 7 | 通販チーム | 発送業務へとして、発送チェックを行い発売日に集荷を開始 | 受注管理 — 配送カスタムCSV出力（M05-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 通販チーム | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「予約受注対応（シングルカード）を行う」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 通販チーム | m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「出荷指示再作成作業として、作業範囲の作成済みの予約受注の出荷指示を削除して解体し」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 3 | 通販チーム | m05-04_admin_order_order_shipping_csv_export（管理画面_受注管理_配送CSV出力）を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「発送準備作業として、再作成した出荷指示ごとに、コメント対応を行いながら」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | 通販チーム | m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「梱包作業として、ピック・振り分け・梱包を行い発売前日まで保管」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 通販チーム | m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「チェックリスト作成として、発売前日の15時締めでチェックシートの作成を行う」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | 通販チーム | m05-23_admin_order_order_shipping_standby_print_delivery_slips_en（管理画面_受注管理_出荷指示_納品書印刷_英語）を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「インポートデータ作成として、インポートデータを作成しておく」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | 通販チーム | 受注管理 — 配送カスタムCSV出力を開き、受注番号=ST-ORDER-TSUHAN-011 を検索して「発送業務へとして、発送チェックを行い発売日に集荷を開始」を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注番号=ST-ORDER-TSUHAN-011 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| A1 | 1 | ピック表作成として、作業日時点でキャンセルされている注文を除外して出荷指示からピック表を印刷 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| E1 | 1 | 発売日前日チェックで予約数と引当在庫が一致しない | 出荷確定へ進めず、予約数と在庫の差異を確認できる状態にする | 予約数、引当在庫、差異件数 |
| A2 | 1 | 予約キャンセル分を発売日集荷/出荷インポート対象から除外できない | キャンセル分を出荷対象に含めず、除外件数を確認できる状態にする | キャンセル件数、出荷対象件数、出荷インポート結果 |
| E2 | 1 | 発売日集荷・出荷インポートの取込に失敗する | 出荷完了にせず、取込エラー行と対象件数を確認できる状態にする | 取込結果、エラー行、出荷ステータス |
| E3 | 1 | 決済失敗または入金額不一致が発生する | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする | 受注ステータス、決済状態、入金額 |
| E4 | 1 | 出荷対象商品の在庫が不足している | 出荷を確定せず、欠品または保留状態として確認できる状態にする | 受注ステータス、在庫数、出荷可否 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | A1 | 通販チーム | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「ピック表作成として、作業日時点でキャンセルされている注文を除外して出荷指示からピック表を印刷」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 2 | E1 | 通販チーム | m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「発売日前日チェックで予約数と引当在庫が一致しない」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 出荷確定へ進めず、予約数と在庫の差異を確認できる状態にする。確認対象: 予約数、引当在庫、差異件数 |
| 3 | A2 | 通販チーム | m05-21_admin_order_order_shipping_standby_picking_list_print（管理画面_受注管理_ピッキングリスト印刷）で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「予約キャンセル分を発売日集荷/出荷インポート対象から除外できない」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | キャンセル分を出荷対象に含めず、除外件数を確認できる状態にする。確認対象: キャンセル件数、出荷対象件数、出荷インポート結果 |
| 4 | E2 | 通販チーム | m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「発売日集荷・出荷インポートの取込に失敗する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 出荷完了にせず、取込エラー行と対象件数を確認できる状態にする。確認対象: 取込結果、エラー行、出荷ステータス |
| 5 | E3 | 通販チーム | m05-23_admin_order_order_shipping_standby_print_delivery_slips_en（管理画面_受注管理_出荷指示_納品書印刷_英語）で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「決済失敗または入金額不一致が発生する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする。確認対象: 受注ステータス、決済状態、入金額 |
| 6 | E4 | 通販チーム | m05-24_admin_order_order_shipping_export_for_import（管理画面_受注管理_出荷実績入力用CSV出力）で 受注番号=ST-ORDER-TSUHAN-011 を対象に、条件「出荷対象商品の在庫が不足している」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-011 | 出荷を確定せず、欠品または保留状態として確認できる状態にする。確認対象: 受注ステータス、在庫数、出荷可否 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 予約受注対応（シングルカード）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | ピック表作成として、作業日時点でキャンセルされている注文を除外して出荷指示からピック表を印刷<br>発売日前日チェックで予約数と引当在庫が一致しない<br>予約キャンセル分を発売日集荷/出荷インポート対象から除外できない<br>発売日集荷・出荷インポートの取込に失敗する | キャンセル状態、在庫戻し、通知結果、操作履歴<br>予約数、引当在庫、差異件数<br>キャンセル件数、出荷対象件数、出荷インポート結果<br>取込結果、エラー行、出荷ステータス |

## トレーサビリティ
- **カバーする業務フロー番号**: 通販受注管理 / パターン11
- **期待する主要機能No**: M05-01, M05-18, M05-21, M05-22, M05-23, M05-24, M05-26, M05-04, M05-05, M05-07, M05-19, M05-20, M04-27, M04-29, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-11, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
- **シナリオに紐づく機能No**: M05-01, M05-18, M05-21, M05-22, M05-23, M05-24, M05-26, M05-04, M05-05, M05-07, M05-19, M05-20, M04-27, M04-29, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-11, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
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
  | m05-04_admin_order_order_shipping_csv_export（管理画面_受注管理_配送CSV出力） | M05-04 | `functions/pf-eccube3/m05-04_admin_order_order_shipping_csv_export.md` | `integration_test/e2e/m05_04_admin_order_order_shipping_csv_export_e2e_cases.md` |
  | 受注管理 — 配送カスタムCSV出力 | M05-05 | `functions/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.md` | `integration_test/e2e/m05_05_admin_order_order_shipping_custom_csv_export_e2e_cases.md` |
  | m05-07_admin_order_order_labels_csv_export（管理画面_受注管理_送り状CSV出力） | M05-07 | `functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md` | `integration_test/e2e/m05_07_admin_order_order_labels_csv_export_e2e_cases.md` |
  | m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索） | M05-19 | `functions/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.md` | `integration_test/e2e/m05_19_admin_order_order_shipping_standby_list_search_e2e_cases.md` |
  | m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除） | M05-20 | `functions/pf-eccube3/m05-20_admin_order_order_shipping_standby_detail_edit_delete.md` | `integration_test/e2e/m05_20_admin_order_order_shipping_standby_detail_edit_delete_e2e_cases.md` |
  | M04-27（在庫移動実績入力用CSV出力） | M04-27 | `functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md` | `integration_test/e2e/m04_27_admin_stock_stock_move_result_csv_export_e2e_cases.md` |
  | M04-29（在庫移動実績 インポート） | M04-29 | `functions/ec-cube-enterprise/m04-29_admin_stock_stock_move_result_csv_import.md` | `integration_test/e2e/m04_29_admin_stock_stock_move_result_csv_import_e2e_cases.md` |
  | F04-01（買い物かご） | F04-01 | `functions/pf-eccube3/f04-01_front_cart_cart_index.md` | `integration_test/e2e/f04_01_front_cart_cart_index_e2e_cases.md` |
  | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文） | F04-02 | `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md` | `integration_test/e2e/f04_02_front_cart_shopping_order_method_e2e_cases.md` |
  | F04-03（注文時の配送先登録・変更） | F04-03 | `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md` | `integration_test/e2e/f04_03_front_cart_shopping_delivery_edit_e2e_cases.md` |
  | カート — 決済〜購入完了 | F04-04 | `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md` | `integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md` |
  | m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力） | M05-02 | `functions/pf-eccube3/m05-02_admin_order_order_csv_export.md` | `integration_test/e2e/m05_02_admin_order_order_csv_export_e2e_cases.md` |
  | m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード） | M05-03 | `functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md` | `integration_test/e2e/m05_03_admin_order_order_custom_csv_export_e2e_cases.md` |
  | m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括） | M05-06 | `functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md` | `integration_test/e2e/m05_06_admin_order_order_bulk_manual_mail_e2e_cases.md` |
  | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集） | M05-11 | `functions/pf-eccube3/m05-11_admin_order_order_edit.md` | `integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md` |
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
