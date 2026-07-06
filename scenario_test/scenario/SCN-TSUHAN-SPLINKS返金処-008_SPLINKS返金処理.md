<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-TSUHAN-SPLINKS返金処-008 SPLINKS返金処理

## 概要
- **目的**: SPLINKS返金処理を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: SPLINKS返金処理が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 通販受注管理 / パターン8
  - 出典: `scenario_test/markdown/16_通販受注管理.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、GMO、配送/ラベル印字アプリ
- **関連システム**: EC-CUBE、GMO、メール、海外発送管理アプリ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-tsuhan-008` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `受注番号=ST-ORDER-TSUHAN-008` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-tsuhan-008 |
| 会員番号 | ST-MEMBER-TSUHAN-008 |
| 商品コード | ST-CARD-TSUHAN-008 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 受注番号 | ST-ORDER-TSUHAN-008 |
| 決済状態 | 売上確定済み |
| 受注ステータス | 対応中 |
| 返金対象金額 | 1,000円 |
| 配送方法 | 宅配便 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 通販チーム | SPLINKS返金処理を行う | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（M05-01） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 2 | 通販チーム | SPLINKS返金依頼として、顧客対応で決済の減額か請求のキャンセルが必要な要項が発生したため | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）（M05-11） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 3 | 通販チーム | SPLINKS返金対応として、依頼を確認した通販社員が依頼内容に不備がないか確認する | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知）（M05-15） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 4 | 通販チーム | 対応完了報告として、依頼者に対応完了を報告 | f06-19_front_member_mypage_credit_card（フロント_会員_クレジットカード情報登録・変更）（F06-19） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 通販チーム | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）を開き、受注番号=ST-ORDER-TSUHAN-008 を検索して「SPLINKS返金処理を行う」を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 受注番号=ST-ORDER-TSUHAN-008 の金額が 1,000円 と一致し、処理履歴に担当者と処理日時が残る |
| 2 | 通販チーム | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）を開き、受注番号=ST-ORDER-TSUHAN-008 を検索して「SPLINKS返金依頼として、顧客対応で決済の減額か請求のキャンセルが必要な要項が発生したため」を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 受注番号=ST-ORDER-TSUHAN-008 の金額が 1,000円 と一致し、処理履歴に担当者と処理日時が残る |
| 3 | 通販チーム | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知）を開き、受注番号=ST-ORDER-TSUHAN-008 を検索して「SPLINKS返金対応として、依頼を確認した通販社員が依頼内容に不備がないか確認する」を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 受注番号=ST-ORDER-TSUHAN-008 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 4 | 通販チーム | f06-19_front_member_mypage_credit_card（フロント_会員_クレジットカード情報登録・変更）を開き、受注番号=ST-ORDER-TSUHAN-008 を検索して「対応完了報告として、依頼者に対応完了を報告」を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 受注番号=ST-ORDER-TSUHAN-008 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | SPLINKS側の減額/取消が実行できない | EC-CUBE側を返金完了にせず、報告のみで各部署対応へ委譲する状態にする | SPLINKS処理結果、返金ステータス、委譲先の記録 |
| E2 | 1 | 同一受注に対して二重返金/二重減額を実行する | 二重処理を防止し、既存の返金結果を確認できる状態にする | 返金履歴、決済状態、処理回数 |
| A1 | 1 | 一部返金（減額）と全額返金を取り違える | 対象金額を取り違えず、依頼内容と処理金額の一致を確認できる状態にする | 依頼金額、減額/返金額、決済状態 |
| E3 | 1 | 依頼チャネル（ラインワークス/Gメール/依頼フォーム）ごとに依頼内容に不備がある | 不備依頼を処理へ進めず、依頼元チャネルと不備内容を確認できる状態にする | 依頼チャネル、依頼内容、不備理由 |
| E4 | 1 | 決済失敗または入金額不一致が発生する | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする | 受注ステータス、決済状態、入金額 |
| A2 | 1 | キャンセルまたは返金が必要になる | 対象金額と戻し処理を記録し、通知または返金結果を確認できる状態にする | 返金額、受注ステータス、通知結果 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 通販チーム | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「SPLINKS側の減額/取消が実行できない」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | EC-CUBE側を返金完了にせず、報告のみで各部署対応へ委譲する状態にする。確認対象: SPLINKS処理結果、返金ステータス、委譲先の記録 |
| 2 | E2 | 通販チーム | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「同一受注に対して二重返金/二重減額を実行する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 二重処理を防止し、既存の返金結果を確認できる状態にする。確認対象: 返金履歴、決済状態、処理回数 |
| 3 | A1 | 通販チーム | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「一部返金（減額）と全額返金を取り違える」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 対象金額を取り違えず、依頼内容と処理金額の一致を確認できる状態にする。確認対象: 依頼金額、減額/返金額、決済状態 |
| 4 | E3 | 通販チーム | f06-19_front_member_mypage_credit_card（フロント_会員_クレジットカード情報登録・変更）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「依頼チャネル（ラインワークス/Gメール/依頼フォーム）ごとに依頼内容に不備がある」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 不備依頼を処理へ進めず、依頼元チャネルと不備内容を確認できる状態にする。確認対象: 依頼チャネル、依頼内容、不備理由 |
| 5 | E4 | 通販チーム | F04-01（買い物かご）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「決済失敗または入金額不一致が発生する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする。確認対象: 受注ステータス、決済状態、入金額 |
| 6 | A2 | 通販チーム | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文）で 受注番号=ST-ORDER-TSUHAN-008 を対象に、条件「キャンセルまたは返金が必要になる」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-008 | 対象金額と戻し処理を記録し、通知または返金結果を確認できる状態にする。確認対象: 返金額、受注ステータス、通知結果 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- SPLINKS返金処理の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | SPLINKS側の減額/取消が実行できない<br>同一受注に対して二重返金/二重減額を実行する<br>一部返金（減額）と全額返金を取り違える<br>依頼チャネル（ラインワークス/Gメール/依頼フォーム）ごとに依頼内容に不備がある | SPLINKS処理結果、返金ステータス、委譲先の記録<br>返金履歴、決済状態、処理回数<br>依頼金額、減額/返金額、決済状態<br>依頼チャネル、依頼内容、不備理由 |

## トレーサビリティ
- **カバーする業務フロー番号**: 通販受注管理 / パターン8
- **期待する主要機能No**: M05-01, M05-11, M05-15, F06-19, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-12, M05-13, M05-14, M05-16, M05-17
- **シナリオに紐づく機能No**: M05-01, M05-11, M05-15, F06-19, F04-01, F04-02, F04-03, F04-04, M05-02, M05-03, M05-06, M05-12, M05-13, M05-14, M05-16, M05-17
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧） | M05-01 | `functions/pf-eccube3/m05-01_admin_order_order_search_list.md` | `integration_test/e2e/m05_01_admin_order_order_search_list_e2e_cases.md` |
  | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集） | M05-11 | `functions/pf-eccube3/m05-11_admin_order_order_edit.md` | `integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md` |
  | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知） | M05-15 | `functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md` | `integration_test/e2e/m05_15_admin_order_order_mail_e2e_cases.md` |
  | f06-19_front_member_mypage_credit_card（フロント_会員_クレジットカード情報登録・変更） | F06-19 | `functions/ec-cube-enterprise/f06-19_front_member_mypage_credit_card.md` | `integration_test/e2e/f06_19_front_member_mypage_credit_card_e2e_cases.md` |
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
  | m05-16_admin_order_order_shop_memo（管理画面_受注編集_ショップ用メモ登録） | M05-16 | `functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md` | `integration_test/e2e/m05_16_admin_order_order_shop_memo_e2e_cases.md` |
  | m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録） | M05-17 | `functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md` | `integration_test/e2e/m05_17_admin_order_order_shipping_memo_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html`
  - `excel_to_html/output/0304_基本設計仕様書(フロント_注文).html`
  - `excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html`
  - `excel_to_html/output/0505_基本設計仕様書(API_受注管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
