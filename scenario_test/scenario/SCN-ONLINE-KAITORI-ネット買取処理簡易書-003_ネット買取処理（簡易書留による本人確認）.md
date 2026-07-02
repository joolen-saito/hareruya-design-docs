<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）

## 概要
- **目的**: ネット買取処理（簡易書留による本人確認）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: ネット買取処理（簡易書留による本人確認）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: ネット買取 / パターン3
  - 出典: `scenario_test/markdown/14_ネット買取.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、商品管理チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-online-kaitori-003` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-ONLINE-KAITORI-003` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-online-kaitori-003 |
| 会員番号 | ST-MEMBER-ONLINE-KAITORI-003 |
| 商品コード | ST-CARD-ONLINE-KAITORI-003 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| ネット買取申込番号 | ST-OBUY-ONLINE-KAITORI-003 |
| 本人確認状態 | 確認済み |
| 査定対象商品 | ST-CARD-ONLINE-KAITORI-003 |
| 振込先 | テスト銀行 普通 1234567 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 通販チーム | ネット買取処理（簡易書留による本人確認）を行う | 会員 — オンライン本人確認（F06-13） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 2 | 通販チーム | ネット買取業務として、2-1から2-10までは同じ業務 | M08-10（オンライン本人確認）（M08-10） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 通販チーム | 簡易書留対応判定を行う | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（M07-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 4 | 通販チーム | 簡易書留準備として、ステータスを「簡易書留送付済み」に変更し | ネット買取管理 — 買取情報編集（買取詳細）（M07-03） | 対象データの状態または値が更新され、検索結果や詳細で確認できる |
| 5 | 通販チーム | メール受領として、メールを受領する | F05-01（ネット買取トップページ）（F05-01） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 6 | お客様 | 簡易書留発送として、簡易書留を作成しお客様へ発送 | F05-02（ネット買取商品検索）（F05-02） | 対象データが登録され、一覧または詳細で確認できる |
| 7 | お客様 | 簡易書留受領として、お客様が簡易書留を受領 | F05-03（ネット買取商品一覧）（F05-03） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 8 | お客様 | 簡易書留受領対応として、お客様が簡易書留を受領したことを追跡番号から確認 | F05-04（ネット買取商品詳細）（F05-04） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 9 | 通販チーム | 振込依頼作業へとして、振込依頼作業以降の業務を行う | F05-05（ネット買取カート）（F05-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 通販チーム | 会員 — オンライン本人確認を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「ネット買取処理（簡易書留による本人確認）を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 2 | 通販チーム | M08-10（オンライン本人確認）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「ネット買取業務として、2-1から2-10までは同じ業務」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 通販チーム | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「簡易書留対応判定を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 4 | 通販チーム | ネット買取管理 — 買取情報編集（買取詳細）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「簡易書留準備として、ステータスを「簡易書留送付済み」に変更し」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | 通販チーム | F05-01（ネット買取トップページ）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「メール受領として、メールを受領する」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 6 | お客様 | F05-02（ネット買取商品検索）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「簡易書留発送として、簡易書留を作成しお客様へ発送」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | お客様 | F05-03（ネット買取商品一覧）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「簡易書留受領として、お客様が簡易書留を受領」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 8 | お客様 | F05-04（ネット買取商品詳細）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「簡易書留受領対応として、お客様が簡易書留を受領したことを追跡番号から確認」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 9 | 通販チーム | F05-05（ネット買取カート）を開き、商品コード=ST-CARD-ONLINE-KAITORI-003 を検索して「振込依頼作業へとして、振込依頼作業以降の業務を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 本人確認書類に不備がある | 振込または成立処理へ進めず、再確認状態にする | 本人確認状態、買取ステータス、通知結果 |
| E2 | 1 | 振込先情報不備または振込不可が発生する | 支払完了にせず、支払保留状態として確認できる状態にする | 支払状態、振込先情報、通知結果 |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E5 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 通販チーム | 会員 — オンライン本人確認で 商品コード=ST-CARD-ONLINE-KAITORI-003 を対象に、条件「本人確認書類に不備がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果 |
| 2 | E2 | 通販チーム | M08-10（オンライン本人確認）で 商品コード=ST-CARD-ONLINE-KAITORI-003 を対象に、条件「振込先情報不備または振込不可が発生する」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 支払完了にせず、支払保留状態として確認できる状態にする。確認対象: 支払状態、振込先情報、通知結果 |
| 3 | E3 | 通販チーム | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）で 商品コード=ST-CARD-ONLINE-KAITORI-003 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | 通販チーム | ネット買取管理 — 買取情報編集（買取詳細）で 商品コード=ST-CARD-ONLINE-KAITORI-003 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E5 | 通販チーム | F05-01（ネット買取トップページ）で 商品コード=ST-CARD-ONLINE-KAITORI-003 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-003 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- ネット買取処理（簡易書留による本人確認）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 5 | 本人確認書類に不備がある<br>振込先情報不備または振込不可が発生する<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | 本人確認状態、買取ステータス、通知結果<br>支払状態、振込先情報、通知結果<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: ネット買取 / パターン3
- **期待する主要機能No**: F06-13, M08-10, M07-01, M07-03, F05-01, F05-02, F05-03, F05-04, F05-05, F05-06, M07-02, M07-04, M07-05, M07-06, A07-01, A07-02, A07-03, A07-04, A07-05, A07-06, A07-07, O01-02
- **シナリオに紐づく機能No**: F06-13, M08-10, M07-01, M07-03, F05-01, F05-02, F05-03, F05-04, F05-05, F05-06, M07-02, M07-04, M07-05, M07-06, A07-01, A07-02, A07-03, A07-04, A07-05, A07-06, A07-07, O01-02
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | 会員 — オンライン本人確認 | F06-13 | `functions/pf-eccube3/f06-13_front_member_mypage_online_identification.md` | `integration_test/e2e/f06_13_front_member_mypage_online_identification_e2e_cases.md` |
  | M08-10（オンライン本人確認） | M08-10 | `functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md` | `integration_test/e2e/m08_10_admin_customer_customer_online_identification_e2e_cases.md` |
  | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） | M07-01 | `functions/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.md` | `integration_test/e2e/m07_01_admin_online_purchase_purchase_online_search_list_e2e_cases.md` |
  | ネット買取管理 — 買取情報編集（買取詳細） | M07-03 | `functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md` | `integration_test/e2e/m07_03_admin_online_purchase_purchase_online_buy_order_edit_e2e_cases.md` |
  | F05-01（ネット買取トップページ） | F05-01 | `functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md` | `integration_test/e2e/f05_01_front_online_purchase_buy_top_e2e_cases.md` |
  | F05-02（ネット買取商品検索） | F05-02 | `functions/pf-eccube3/f05-02_front_online_purchase_buy_product_search.md` | `integration_test/e2e/f05_02_front_online_purchase_buy_product_search_e2e_cases.md` |
  | F05-03（ネット買取商品一覧） | F05-03 | `functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md` | `integration_test/e2e/f05_03_front_online_purchase_buy_product_list_e2e_cases.md` |
  | F05-04（ネット買取商品詳細） | F05-04 | `functions/pf-eccube3/f05-04_front_online_purchase_buy_product_detail.md` | `integration_test/e2e/f05_04_front_online_purchase_buy_product_detail_e2e_cases.md` |
  | F05-05（ネット買取カート） | F05-05 | `functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md` | `integration_test/e2e/f05_05_front_online_purchase_buy_cart_e2e_cases.md` |
  | F05-06（ネット買取買取手続き〜完了） | F05-06 | `functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md` | `integration_test/e2e/f05_06_front_online_purchase_buy_shopping_complete_e2e_cases.md` |
  | m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力） | M07-02 | `functions/pf-eccube3/m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.md` | `integration_test/e2e/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export_e2e_cases.md` |
  | m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知） | M07-04 | `functions/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.md` | `integration_test/e2e/m07_04_admin_online_purchase_purchase_manual_mail_e2e_cases.md` |
  | m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV） | M07-05 | `functions/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.md` | `integration_test/e2e/m07_05_admin_online_purchase_purchase_csv_export_deposit_e2e_cases.md` |
  | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） | M07-06 | `functions/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md` | `integration_test/e2e/m07_06_admin_online_purchase_purchase_online_product_list_csv_export_e2e_cases.md` |
  | API ネット買取管理 — まとめて買取商品IDの取得 | A07-01 | `functions/pf-api/a07-01_api_online_purchase_bulk_purchase_id.md` | `integration_test/e2e/a07_01_api_online_purchase_bulk_purchase_id_e2e_cases.md` |
  | API ネット買取管理 — ネット買取受注一覧取得 | A07-02 | `functions/pf-api/a07-02_api_online_purchase_buy_order_list.md` | `integration_test/e2e/a07_02_api_online_purchase_buy_order_list_e2e_cases.md` |
  | API ネット買取管理 — ネット買取受注コメント更新 | A07-03 | `functions/pf-api/a07-03_api_online_purchase_buy_order_free_comment.md` | `integration_test/e2e/a07_03_api_online_purchase_buy_order_free_comment_e2e_cases.md` |
  | API ネット買取管理 — ネット買取受注ステータス更新 | A07-04 | `functions/pf-api/a07-04_api_online_purchase_buy_order_status.md` | `integration_test/e2e/a07_04_api_online_purchase_buy_order_status_e2e_cases.md` |
  | API ネット買取管理 — ネット買取注文の査定終了処理 | A07-05 | `functions/pf-api/a07-05_api_online_purchase_buy_order_end.md` | `integration_test/e2e/a07_05_api_online_purchase_buy_order_end_e2e_cases.md` |
  | API ネット買取管理 — 複数ネット買取IDからネット買取受注の商品一覧を取得 | A07-06 | `functions/pf-api/a07-06_api_online_purchase_buy_main_card.md` | `integration_test/e2e/a07_06_api_online_purchase_buy_main_card_e2e_cases.md` |
  | API ネット買取管理 — 複数ネット買取IDから個別入力商品の一覧を取得 | A07-07 | `functions/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.md` | `integration_test/e2e/a07_07_api_online_purchase_buy_order_indivisual_input_product_e2e_cases.md` |
  | o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取） | O01-02 | `functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md` | `integration_test/e2e/o01_02_other_mtg_buyer_mtg_buyer_online_purchase_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html`
  - `excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html`
  - `excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html`
  - `excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
