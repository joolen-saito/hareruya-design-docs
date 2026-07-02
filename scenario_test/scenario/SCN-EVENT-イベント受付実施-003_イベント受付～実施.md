<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-EVENT-イベント受付実施-003 イベント受付～実施

## 概要
- **目的**: イベント受付～実施を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: イベント受付～実施が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: イベント管理 / パターン3
  - 出典: `scenario_test/markdown/08_イベント管理.md`

## アクター
- **主アクター**: 店舗チーム
- **副アクター**: お客様、顧客戦略チーム
- **関連システム**: EC-CUBE、GMO、デッキシステム、スマレジ、ポイントグランター

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-event-003` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-EVENT-003` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-event-003 |
| 会員番号 | ST-MEMBER-EVENT-003 |
| 商品コード | ST-CARD-EVENT-003 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| イベントID | ST-EVENT-EVENT-003 |
| イベント名 | システムテスト大会 EVENT-003 |
| 定員 | 8名 |
| 受付状態 | 受付前 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | イベント受付～実施を行う | M13-06（イベント申込検索）（M13-06） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 店舗チーム | オンライン受付として、オンライン受付するイベントの場合、申込一覧をCSV出力する | イベント管理 — イベント申込一括編集（M13-07） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 3 | 店舗チーム | イベント受付として、イベントの受付を行う | M13-10（イベント申込詳細・編集）（M13-10） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 4 | 店舗チーム | イベント実施として、イベント実施する | イベント管理 — イベント申込登録検索（M13-11） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | 店舗チーム | 会員登録有無として、会員登録されていない場合は、会員登録を促す | M13-12（イベント新規申込登録）（M13-12） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | 店舗チーム | 新規会員登録として、会員登録する | F07-01（イベント大会TOP）（F07-01） | 対象データが登録され、一覧または詳細で確認できる |
| 7 | 店舗チーム | デッキ登録として、当大会で使用したデッキを登録していただく | F07-02（大会詳細検索）（F07-02） | 対象データが登録され、一覧または詳細で確認できる |
| 8 | 店舗チーム | ポイント付与として、ポイントグランターを用いてポイント付与を行う | F07-03（大会詳細）（F07-03） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 9 | 店舗チーム | 売上登録として、スマレジに当日のイベント金額を登録する | F07-04（大会申込～完了）（F07-04） | 対象データが登録され、一覧または詳細で確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 店舗チーム | M13-06（イベント申込検索）を開き、商品コード=ST-CARD-EVENT-003 を検索して「イベント受付～実施を行う」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 店舗チーム | イベント管理 — イベント申込一括編集を開き、商品コード=ST-CARD-EVENT-003 を検索して「オンライン受付として、オンライン受付するイベントの場合、申込一覧をCSV出力する」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 3 | 店舗チーム | M13-10（イベント申込詳細・編集）を開き、商品コード=ST-CARD-EVENT-003 を検索して「イベント受付として、イベントの受付を行う」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 4 | 店舗チーム | イベント管理 — イベント申込登録検索を開き、商品コード=ST-CARD-EVENT-003 を検索して「イベント実施として、イベント実施する」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 店舗チーム | M13-12（イベント新規申込登録）を開き、商品コード=ST-CARD-EVENT-003 を検索して「会員登録有無として、会員登録されていない場合は、会員登録を促す」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | 店舗チーム | F07-01（イベント大会TOP）を開き、商品コード=ST-CARD-EVENT-003 を検索して「新規会員登録として、会員登録する」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | 店舗チーム | F07-02（大会詳細検索）を開き、商品コード=ST-CARD-EVENT-003 を検索して「デッキ登録として、当大会で使用したデッキを登録していただく」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 8 | 店舗チーム | F07-03（大会詳細）を開き、商品コード=ST-CARD-EVENT-003 を検索して「ポイント付与として、ポイントグランターを用いてポイント付与を行う」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 9 | 店舗チーム | F07-04（大会申込～完了）を開き、商品コード=ST-CARD-EVENT-003 を検索して「売上登録として、スマレジに当日のイベント金額を登録する」を実行する | 商品コード=ST-CARD-EVENT-003 | 商品コード=ST-CARD-EVENT-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 定員超過または受付期間外に申込が行われる | 受付完了にせず、受付不可理由を確認できる状態にする | 受付状態、定員、受付期間 |
| E2 | 1 | GMO決済またはポイント付与に失敗する | 参加確定にせず、決済・付与結果を確認できる状態にする | 決済状態、ポイント付与結果、受付状態 |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E5 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E6 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 店舗チーム | M13-06（イベント申込検索）で 商品コード=ST-CARD-EVENT-003 を対象に、条件「定員超過または受付期間外に申込が行われる」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | 受付完了にせず、受付不可理由を確認できる状態にする。確認対象: 受付状態、定員、受付期間 |
| 2 | E2 | 店舗チーム | イベント管理 — イベント申込一括編集で 商品コード=ST-CARD-EVENT-003 を対象に、条件「GMO決済またはポイント付与に失敗する」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | 参加確定にせず、決済・付与結果を確認できる状態にする。確認対象: 決済状態、ポイント付与結果、受付状態 |
| 3 | E3 | 店舗チーム | M13-10（イベント申込詳細・編集）で 商品コード=ST-CARD-EVENT-003 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | 店舗チーム | イベント管理 — イベント申込登録検索で 商品コード=ST-CARD-EVENT-003 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E5 | 店舗チーム | M13-12（イベント新規申込登録）で 商品コード=ST-CARD-EVENT-003 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E6 | 店舗チーム | F07-01（イベント大会TOP）で 商品コード=ST-CARD-EVENT-003 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-EVENT-003 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- イベント受付～実施の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 定員超過または受付期間外に申込が行われる<br>GMO決済またはポイント付与に失敗する<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | 受付状態、定員、受付期間<br>決済状態、ポイント付与結果、受付状態<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: イベント管理 / パターン3
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
