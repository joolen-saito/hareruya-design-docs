<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-DECK-新規デッキ登録時外部-001 新規デッキ登録時（外部大会などで活躍したデッキを登録）

## 概要
- **目的**: 新規デッキ登録時（外部大会などで活躍したデッキを登録）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 新規デッキ登録時（外部大会などで活躍したデッキを登録）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: デッキ登録 / パターン1
  - 出典: `scenario_test/markdown/18_デッキ登録.md`

## アクター
- **主アクター**: 顧客戦略チーム
- **副アクター**: お客様、店舗チーム
- **関連システム**: デッキ管理、デッキシステム、イベント管理

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-deck-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-DECK-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-deck-001 |
| 会員番号 | ST-MEMBER-DECK-001 |
| 商品コード | ST-CARD-DECK-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| デッキID | ST-DECK-DECK-001 |
| 大会ID | ST-EVENT-DECK-001 |
| デッキ公開状態 | 下書き |
| カード枚数 | 60枚 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 顧客戦略チーム | 新規デッキ登録時（外部大会などで活躍したデッキを登録）を行う | デッキ管理 — 直近の大会管理（編集）（M15-11） | 対象データが登録され、一覧または詳細で確認できる |
| 2 | 顧客戦略チーム | デッキ内容取得として、イベント情報、デッキ情報を取得 | M13-01（イベント一覧検索）（M13-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 顧客戦略チーム | デッキタグ登録として、登録しようとしているデッキに該当するタグが無い場合、登録する | M13-08（デッキ表示）（M13-08） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | 顧客戦略チーム | アーキタイプ登録として、登録しようとしているデッキに該当するアーキタイプが無い場合、登録する | API デッキビルダー — 直近大会情報取得（A15-16） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | 顧客戦略チーム | デッキ登録として、デッキを登録する | デッキ管理 — デッキ検索・一覧（M15-01） | 対象データが登録され、一覧または詳細で確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 顧客戦略チーム | デッキ管理 — 直近の大会管理（編集）を開き、商品コード=ST-CARD-DECK-001 を検索して「新規デッキ登録時（外部大会などで活躍したデッキを登録）を行う」を実行する | 商品コード=ST-CARD-DECK-001 | 商品コード=ST-CARD-DECK-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 2 | 顧客戦略チーム | M13-01（イベント一覧検索）を開き、商品コード=ST-CARD-DECK-001 を検索して「デッキ内容取得として、イベント情報、デッキ情報を取得」を実行する | 商品コード=ST-CARD-DECK-001 | 商品コード=ST-CARD-DECK-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 顧客戦略チーム | M13-08（デッキ表示）を開き、商品コード=ST-CARD-DECK-001 を検索して「デッキタグ登録として、登録しようとしているデッキに該当するタグが無い場合、登録する」を実行する | 商品コード=ST-CARD-DECK-001 | 商品コード=ST-CARD-DECK-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | 顧客戦略チーム | API デッキビルダー — 直近大会情報取得を開き、商品コード=ST-CARD-DECK-001 を検索して「アーキタイプ登録として、登録しようとしているデッキに該当するアーキタイプが無い場合、登録する」を実行する | 商品コード=ST-CARD-DECK-001 | 商品コード=ST-CARD-DECK-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | 顧客戦略チーム | デッキ管理 — デッキ検索・一覧を開き、商品コード=ST-CARD-DECK-001 を検索して「デッキ登録として、デッキを登録する」を実行する | 商品コード=ST-CARD-DECK-001 | 商品コード=ST-CARD-DECK-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | デッキリストのカード枚数またはカード名が不正である | 公開せず、エラー箇所を確認できる状態にする | デッキ内容、エラー表示、公開状態 |
| E2 | 1 | 外部大会情報と登録対象大会が一致しない | 大会紐づけを保留し、不一致内容を確認できる状態にする | 大会情報、デッキ紐づけ、公開状態 |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E5 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E6 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 顧客戦略チーム | デッキ管理 — 直近の大会管理（編集）で 商品コード=ST-CARD-DECK-001 を対象に、条件「デッキリストのカード枚数またはカード名が不正である」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | 公開せず、エラー箇所を確認できる状態にする。確認対象: デッキ内容、エラー表示、公開状態 |
| 2 | E2 | 顧客戦略チーム | M13-01（イベント一覧検索）で 商品コード=ST-CARD-DECK-001 を対象に、条件「外部大会情報と登録対象大会が一致しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | 大会紐づけを保留し、不一致内容を確認できる状態にする。確認対象: 大会情報、デッキ紐づけ、公開状態 |
| 3 | E3 | 顧客戦略チーム | M13-08（デッキ表示）で 商品コード=ST-CARD-DECK-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | 顧客戦略チーム | API デッキビルダー — 直近大会情報取得で 商品コード=ST-CARD-DECK-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E5 | 顧客戦略チーム | デッキ管理 — デッキ検索・一覧で 商品コード=ST-CARD-DECK-001 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E6 | 顧客戦略チーム | デッキ管理 — デッキ CSV 出力で 商品コード=ST-CARD-DECK-001 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-DECK-001 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 新規デッキ登録時（外部大会などで活躍したデッキを登録）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
- 画面、CSV/帳票、メール、外部システムのいずれかで、処理結果が確認できる。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
| 正常系 | ○ |
| 代替系 | ○ |
| 異常系 | ○ |
| 外部連携 | - |
| データ更新 | ○ |
| CSV/帳票 | ○ |
| メール/通知 | - |

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
| 6 | デッキリストのカード枚数またはカード名が不正である<br>外部大会情報と登録対象大会が一致しない<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | デッキ内容、エラー表示、公開状態<br>大会情報、デッキ紐づけ、公開状態<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: デッキ登録 / パターン1
- **期待する主要機能No**: M15-11, M13-01, M13-08, A15-16, M15-01, M15-02, M15-04, M15-05, M15-06, M15-07, M15-08, M15-09, M15-10, A15-06, A15-07, A15-08, A15-09, A15-10, A15-13, A15-14, A15-15, A15-17, A15-18
- **シナリオに紐づく機能No**: M15-11, M13-01, M13-08, A15-16, M15-01, M15-02, M15-04, M15-05, M15-06, M15-07, M15-08, M15-09, M15-10, A15-06, A15-07, A15-08, A15-09, A15-10, A15-13, A15-14, A15-15, A15-17, A15-18
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | デッキ管理 — 直近の大会管理（編集） | M15-11 | `functions/pf-eccube3/m15-11_admin_deck_deck_latest_event.md` | `integration_test/e2e/m15_11_admin_deck_deck_latest_event_e2e_cases.md` |
  | M13-01（イベント一覧検索） | M13-01 | `functions/pf-eccube3/m13-01_admin_event_event_search_list.md` | `integration_test/e2e/m13_01_admin_event_event_search_list_e2e_cases.md` |
  | M13-08（デッキ表示） | M13-08 | `functions/pf-eccube3/m13-08_admin_event_event_deck_view.md` | `integration_test/e2e/m13_08_admin_event_event_deck_view_e2e_cases.md` |
  | API デッキビルダー — 直近大会情報取得 | A15-16 | `functions/pf-api/a15-16_api_deck_builder_deck_recent_event.md` | `integration_test/e2e/a15_16_api_deck_builder_deck_recent_event_e2e_cases.md` |
  | デッキ管理 — デッキ検索・一覧 | M15-01 | `functions/pf-eccube3/m15-01_admin_deck_deck_search.md` | `integration_test/e2e/m15_01_admin_deck_deck_search_e2e_cases.md` |
  | デッキ管理 — デッキ CSV 出力 | M15-02 | `functions/pf-eccube3/m15-02_admin_deck_deck_csv_export.md` | `integration_test/e2e/m15_02_admin_deck_deck_csv_export_e2e_cases.md` |
  | デッキ管理 — 検索一覧からの一括編集 | M15-04 | `functions/pf-eccube3/m15-04_admin_deck_deck_bulk_update.md` | `integration_test/e2e/m15_04_admin_deck_deck_bulk_update_e2e_cases.md` |
  | デッキ管理 — 新規登録・編集・削除・複製 | M15-05 | `functions/pf-eccube3/m15-05_admin_deck_deck_edit.md` | `integration_test/e2e/m15_05_admin_deck_deck_edit_e2e_cases.md` |
  | デッキ管理 — デッキ登録 CSV（取込） | M15-06 | `functions/pf-eccube3/m15-06_admin_deck_deck_csv_import.md` | `integration_test/e2e/m15_06_admin_deck_deck_csv_import_e2e_cases.md` |
  | デッキ管理 — デッキタグ一覧（カスタム管理画面） | M15-07 | `functions/pf-eccube3/m15-07_admin_deck_deck_tag_list.md` | `integration_test/e2e/m15_07_admin_deck_deck_tag_list_e2e_cases.md` |
  | pf-eccube3 — デッキ管理 — アーキタイプ検索条件 | M15-08 | `functions/pf-eccube3/m15-08_admin_deck_deck_archetype_search.md` | `integration_test/e2e/m15_08_admin_deck_deck_archetype_search_e2e_cases.md` |
  | デッキ管理 — アーキタイプ登録・編集・削除 | M15-09 | `functions/pf-eccube3/m15-09_admin_deck_deck_archetype_crud.md` | `integration_test/e2e/m15_09_admin_deck_deck_archetype_crud_e2e_cases.md` |
  | m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込） | M15-10 | `functions/pf-eccube3/m15-10_admin_deck_archetype_csv_import.md` | `integration_test/e2e/m15_10_admin_deck_archetype_csv_import_e2e_cases.md` |
  | API デッキビルダー — マスタ検索 | A15-06 | `functions/pf-api/a15-06_api_deck_builder_deck_master.md` | `integration_test/e2e/a15_06_api_deck_builder_deck_master_e2e_cases.md` |
  | API デッキビルダー — アーキタイプ検索 | A15-07 | `functions/pf-api/a15-07_api_deck_builder_deck_archetype_search.md` | `integration_test/e2e/a15_07_api_deck_builder_deck_archetype_search_e2e_cases.md` |
  | API デッキビルダー — カード検索 | A15-08 | `functions/pf-api/a15-08_api_deck_builder_deck_card_search.md` | `integration_test/e2e/a15_08_api_deck_builder_deck_card_search_e2e_cases.md` |
  | API デッキビルダー — デッキ情報登録 | A15-09 | `functions/pf-api/a15-09_api_deck_builder_deck_register.md` | `integration_test/e2e/a15_09_api_deck_builder_deck_register_e2e_cases.md` |
  | API デッキビルダー — デッキ情報更新 | A15-10 | `functions/pf-api/a15-10_api_deck_builder_deck_update.md` | `integration_test/e2e/a15_10_api_deck_builder_deck_update_e2e_cases.md` |
  | API デッキビルダー — デッキ情報検索 | A15-13 | `functions/pf-api/a15-13_api_deck_builder_deck_search.md` | `integration_test/e2e/a15_13_api_deck_builder_deck_search_e2e_cases.md` |
  | API デッキビルダー — メタゲーム情報参照 | A15-14 | `functions/pf-api/a15-14_api_deck_builder_deck_metagame.md` | `integration_test/e2e/a15_14_api_deck_builder_deck_metagame_e2e_cases.md` |
  | API デッキビルダー — 採用枚数情報参照 | A15-15 | `functions/pf-api/a15-15_api_deck_builder_deck_usage_card.md` | `integration_test/e2e/a15_15_api_deck_builder_deck_usage_card_e2e_cases.md` |
  | API デッキビルダー — デッキ登録インポート | A15-17 | `functions/pf-api/a15-17_api_deck_builder_deck_import_register.md` | `integration_test/e2e/a15_17_api_deck_builder_deck_import_register_e2e_cases.md` |
  | API デッキビルダー — デッキ更新インポート | A15-18 | `functions/pf-api/a15-18_api_deck_builder_deck_import_update.md` | `integration_test/e2e/a15_18_api_deck_builder_deck_import_update_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0212_基本設計仕様書(デッキ管理).html`
  - `excel_to_html/output/0515_基本設計仕様書(API_デッキビルダー).html`
  - `excel_to_html/output/0502_基本設計仕様書(API_商品管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
