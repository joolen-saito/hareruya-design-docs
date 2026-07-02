<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-EVENT-イベント受付オンライ-002 イベント受付(オンライン受付)

## 概要
- **目的**: イベント受付(オンライン受付)を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: イベント受付(オンライン受付)が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: イベント管理 / パターン2
  - 出典: `scenario_test/markdown/08_イベント管理.md`

## アクター
- **主アクター**: 店舗チーム
- **副アクター**: お客様、顧客戦略チーム
- **関連システム**: EC-CUBE、GMO、デッキシステム、スマレジ、ポイントグランター

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-event-002` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-EVENT-002` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-event-002 |
| 会員番号 | ST-MEMBER-EVENT-002 |
| 商品コード | ST-CARD-EVENT-002 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| イベントID | ST-EVENT-EVENT-002 |
| イベント名 | システムテスト大会 EVENT-002 |
| 定員 | 8名 |
| 受付状態 | 受付前 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | イベント受付(オンライン受付)を行う | M13-06（イベント申込検索）（M13-06） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 店舗チーム | イベント・大会として、オンライン受付ありでイベント作成されている場合、ECサイトより | イベント管理 — イベント申込一括編集（M13-07） | 対象データが登録され、一覧または詳細で確認できる |
| 3 | 店舗チーム | イベント・大会として、デッキ登録ありでイベント作成されている場合、ECサイトより | M13-10（イベント申込詳細・編集）（M13-10） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | 店舗チーム | キャンペーン対象を行う | イベント管理 — イベント申込登録検索（M13-11） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | 店舗チーム | 次へを行う | M13-12（イベント新規申込登録）（M13-12） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | M13-06（イベント申込検索）を開き、商品コード=ST-CARD-EVENT-002 を検索して「イベント受付(オンライン受付)を行う」を実行する | 商品コード=ST-CARD-EVENT-002 | 商品コード=ST-CARD-EVENT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 店舗チーム | イベント管理 — イベント申込一括編集を開き、商品コード=ST-CARD-EVENT-002 を検索して「イベント・大会として、オンライン受付ありでイベント作成されている場合、ECサイトより」を実行する | 商品コード=ST-CARD-EVENT-002 | 商品コード=ST-CARD-EVENT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 3 | 店舗チーム | M13-10（イベント申込詳細・編集）を開き、商品コード=ST-CARD-EVENT-002 を検索して「イベント・大会として、デッキ登録ありでイベント作成されている場合、ECサイトより」を実行する | 商品コード=ST-CARD-EVENT-002 | 商品コード=ST-CARD-EVENT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | 店舗チーム | イベント管理 — イベント申込登録検索を開き、商品コード=ST-CARD-EVENT-002 を検索して「キャンペーン対象を行う」を実行する | 商品コード=ST-CARD-EVENT-002 | 商品コード=ST-CARD-EVENT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 店舗チーム | M13-12（イベント新規申込登録）を開き、商品コード=ST-CARD-EVENT-002 を検索して「次へを行う」を実行する | 商品コード=ST-CARD-EVENT-002 | 商品コード=ST-CARD-EVENT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| A1 | 1 | キャンセル有無を行う | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| A2 | 1 | キャンセル申込として、オンライン受付ありでイベント作成されている場合、ECサイトより | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| A3 | 1 | 返金依頼として、キャンセル内容をフォームに記載する | 返金対象、返金額、返金ステータスを記録し、二重返金を発生させない | 返金額、決済状態、処理履歴、通知結果 |
| A4 | 1 | 返金処理として、返金処理を行う | 返金対象、返金額、返金ステータスを記録し、二重返金を発生させない | 返金額、決済状態、処理履歴、通知結果 |
| A5 | 1 | キャンセル処理として、キャンセル申込をメールを確認し、対象者の申込情報を「キャンセル済み」 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| A6 | 1 | キャンセル完了として、メールにてキャンセル手続きが完了したことを通知する | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | A1 | 店舗チーム | M13-06（イベント申込検索）で 商品コード=ST-CARD-EVENT-002 を対象に、条件「キャンセル有無を行う」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 2 | A2 | 店舗チーム | イベント管理 — イベント申込一括編集で 商品コード=ST-CARD-EVENT-002 を対象に、条件「キャンセル申込として、オンライン受付ありでイベント作成されている場合、ECサイトより」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 3 | A3 | 店舗チーム | M13-10（イベント申込詳細・編集）で 商品コード=ST-CARD-EVENT-002 を対象に、条件「返金依頼として、キャンセル内容をフォームに記載する」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 返金対象、返金額、返金ステータスを記録し、二重返金を発生させない。確認対象: 返金額、決済状態、処理履歴、通知結果 |
| 4 | A4 | 店舗チーム | イベント管理 — イベント申込登録検索で 商品コード=ST-CARD-EVENT-002 を対象に、条件「返金処理として、返金処理を行う」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 返金対象、返金額、返金ステータスを記録し、二重返金を発生させない。確認対象: 返金額、決済状態、処理履歴、通知結果 |
| 5 | A5 | 店舗チーム | M13-12（イベント新規申込登録）で 商品コード=ST-CARD-EVENT-002 を対象に、条件「キャンセル処理として、キャンセル申込をメールを確認し、対象者の申込情報を「キャンセル済み」」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 6 | A6 | 店舗チーム | F07-01（イベント大会TOP）で 商品コード=ST-CARD-EVENT-002 を対象に、条件「キャンセル完了として、メールにてキャンセル手続きが完了したことを通知する」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-002 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- イベント受付(オンライン受付)の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | キャンセル有無を行う<br>キャンセル申込として、オンライン受付ありでイベント作成されている場合、ECサイトより<br>返金依頼として、キャンセル内容をフォームに記載する<br>返金処理として、返金処理を行う | キャンセル状態、在庫戻し、通知結果、操作履歴<br>キャンセル状態、在庫戻し、通知結果、操作履歴<br>返金額、決済状態、処理履歴、通知結果<br>返金額、決済状態、処理履歴、通知結果 |

## トレーサビリティ
- **カバーする業務フロー番号**: イベント管理 / パターン2
- **期待する主要機能No**: M13-06, M13-07, M13-10, M13-11, M13-12, F07-01, F07-02, F07-03, F07-04, B13-01, B13-02, M13-08, F06-16, F06-17, M15-01, M15-05, M13-01, M13-02, M13-03, M13-04, M13-05, M13-09
- **シナリオに紐づく機能No**: M13-06, M13-07, M13-10, M13-11, M13-12, F07-01, F07-02, F07-03, F07-04, B13-01, B13-02, M13-08, F06-16, F06-17, M15-01, M15-05, M13-01, M13-02, M13-03, M13-04, M13-05, M13-09
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | M13-06（イベント申込検索） | M13-06 | `functions/pf-eccube3/m13-06_admin_event_event_entry_management_search.md` | `integration_test/e2e/m13_06_admin_event_event_entry_management_search_e2e_cases.md` |
  | イベント管理 — イベント申込一括編集 | M13-07 | `functions/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.md` | `integration_test/e2e/m13_07_admin_event_event_entry_bulk_update_e2e_cases.md` |
  | M13-10（イベント申込詳細・編集） | M13-10 | `functions/pf-eccube3/m13-10_admin_event_event_entry_edit.md` | `integration_test/e2e/m13_10_admin_event_event_entry_edit_e2e_cases.md` |
  | イベント管理 — イベント申込登録検索 | M13-11 | `functions/pf-eccube3/m13-11_admin_event_event_entry_search.md` | `integration_test/e2e/m13_11_admin_event_event_entry_search_e2e_cases.md` |
  | M13-12（イベント新規申込登録） | M13-12 | `functions/pf-eccube3/m13-12_admin_event_event_entry_register.md` | `integration_test/e2e/m13_12_admin_event_event_entry_register_e2e_cases.md` |
  | F07-01（イベント大会TOP） | F07-01 | `functions/pf-eccube3/f07-01_front_event_event_top.md` | `integration_test/e2e/f07_01_front_event_event_top_e2e_cases.md` |
  | F07-02（大会詳細検索） | F07-02 | `functions/pf-eccube3/f07-02_front_event_event_search.md` | `integration_test/e2e/f07_02_front_event_event_search_e2e_cases.md` |
  | F07-03（大会詳細） | F07-03 | `functions/pf-eccube3/f07-03_front_event_event_detail.md` | `integration_test/e2e/f07_03_front_event_event_detail_e2e_cases.md` |
  | F07-04（大会申込～完了） | F07-04 | `functions/pf-eccube3/f07-04_front_event_event_entry_complete.md` | `integration_test/e2e/f07_04_front_event_event_entry_complete_e2e_cases.md` |
  | バッチ イベント管理 — 決済処理中チェックバッチ | B13-01 | `functions/pf-eccube3/b13-01_batch_event_event_check_processing_payment.md` | `integration_test/e2e/b13_01_batch_event_event_check_processing_payment_e2e_cases.md` |
  | バッチ イベント管理 — コンビニ支払チェックバッチ | B13-02 | `functions/pf-eccube3/b13-02_batch_event_event_check_cvs_payment.md` | `integration_test/e2e/b13_02_batch_event_event_check_cvs_payment_e2e_cases.md` |
  | M13-08（デッキ表示） | M13-08 | `functions/pf-eccube3/m13-08_admin_event_event_deck_view.md` | `integration_test/e2e/m13_08_admin_event_event_deck_view_e2e_cases.md` |
  | F06-16（大会デッキ登録編集） | F06-16 | `functions/pf-eccube3/f06-16_front_member_mypage_event_deck_edit.md` | `integration_test/e2e/f06_16_front_member_mypage_event_deck_edit_e2e_cases.md` |
  | F06-17（大会に登録するデッキの確認・登録） | F06-17 | `functions/pf-eccube3/f06-17_front_member_mypage_event_deck_complete.md` | `integration_test/e2e/f06_17_front_member_mypage_event_deck_complete_e2e_cases.md` |
  | デッキ管理 — デッキ検索・一覧 | M15-01 | `functions/pf-eccube3/m15-01_admin_deck_deck_search.md` | `integration_test/e2e/m15_01_admin_deck_deck_search_e2e_cases.md` |
  | デッキ管理 — 新規登録・編集・削除・複製 | M15-05 | `functions/pf-eccube3/m15-05_admin_deck_deck_edit.md` | `integration_test/e2e/m15_05_admin_deck_deck_edit_e2e_cases.md` |
  | M13-01（イベント一覧検索） | M13-01 | `functions/pf-eccube3/m13-01_admin_event_event_search_list.md` | `integration_test/e2e/m13_01_admin_event_event_search_list_e2e_cases.md` |
  | M13-02（イベント編集/削除） | M13-02 | `functions/pf-eccube3/m13-02_admin_event_event_edit_delete.md` | `integration_test/e2e/m13_02_admin_event_event_edit_delete_e2e_cases.md` |
  | イベント管理 — 日程追加 | M13-03 | `functions/pf-eccube3/m13-03_admin_event_event_schedule_add.md` | `integration_test/e2e/m13_03_admin_event_event_schedule_add_e2e_cases.md` |
  | イベント管理 — 繰り返し日程登録 | M13-04 | `functions/pf-eccube3/m13-04_admin_event_event_repeat_schedule.md` | `integration_test/e2e/m13_04_admin_event_event_repeat_schedule_e2e_cases.md` |
  | M13-05（複製新規） | M13-05 | `functions/pf-eccube3/m13-05_admin_event_event_duplicate_register.md` | `integration_test/e2e/m13_05_admin_event_event_duplicate_register_e2e_cases.md` |
  | M13-09（CSVダウンロード） | M13-09 | `functions/pf-eccube3/m13-09_admin_event_event_csv_export.md` | `integration_test/e2e/m13_09_admin_event_event_csv_export_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0214_基本設計仕様書(イベント管理).html`
  - `excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html`
  - `excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
