<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-PRODUCT-新弾発表発売週の2週-002 新弾発表 発売週の2週間前 予約シングルの販売準備

## 概要
- **目的**: 新弾発表 発売週の2週間前 予約シングルの販売準備を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 新弾発表 発売週の2週間前 予約シングルの販売準備が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 商品登録・編集 / パターン2
  - 出典: `scenario_test/markdown/10_商品登録・編集_tobe.md`

## アクター
- **主アクター**: トレードチーム
- **副アクター**: ITチーム、通販チーム、デザインチーム
- **関連システム**: EC-CUBE、AWS S3、在庫管理

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-product-002` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-PRODUCT-PRODUCT-002` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-product-002 |
| 会員番号 | ST-MEMBER-PRODUCT-002 |
| 商品コード | ST-PRODUCT-PRODUCT-002 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| カテゴリ | テストカテゴリ |
| 販売価格 | 500円 |
| 公開状態 | 非公開 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | トレードチーム | 新弾発表として、発売週の2週間前 予約シングルの販売準備 | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（M03-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | トレードチーム | カードリストとして、公式からカードリストが公開されたタイミングで | カード管理 — カード検索（一覧・条件抽出）（M14-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | トレードチーム | カード画像として、公式サイトのイメージギャラリーより | カード管理 — 新規登録・編集・削除（詳細フォーム）（M14-04） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 4 | トレードチーム | カード画像として、ITチームにて、トレードチームがS3にアップした画像と商品名を | カード管理 — カード CSV 登録（取込）（M14-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | トレードチーム | カード管理からとして、新弾の販売予定のシングルカードの登録を行うため | カード管理 — カードセット一覧（M14-06） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | トレードチーム | カード登録として、登録用CSVを作成する | カード管理 — カードセット新規登録・編集・削除（M14-08） | 対象データが登録され、一覧または詳細で確認できる |
| 7 | トレードチーム | カード管理として、作成したカード登録CSVを投入し、カードを登録 | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（M03-26） | 対象データが登録され、一覧または詳細で確認できる |
| 8 | トレードチーム | カード商品CSVとして、商品マスターに登録する | m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（M03-03） | 対象データが登録され、一覧または詳細で確認できる |
| 9 | トレードチーム | カード商品CSVとして、カード商品CSVを作成する | M03-02（商品編集機能）（M03-02） | 対象データが登録され、一覧または詳細で確認できる |
| 10 | トレードチーム | カード商品として、作成したCSVをアップロードし商品登録を行う | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）（M03-27） | 対象データが登録され、一覧または詳細で確認できる |
| 11 | トレードチーム | 商品情報編集として、調整が必要なカード情報の編集を行う | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（M03-38） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 12 | トレードチーム | 発売日1週間前として、プレリリース業務へ移る | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（M03-08） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | トレードチーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「新弾発表として、発売週の2週間前 予約シングルの販売準備」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | トレードチーム | カード管理 — カード検索（一覧・条件抽出）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カードリストとして、公式からカードリストが公開されたタイミングで」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | トレードチーム | カード管理 — 新規登録・編集・削除（詳細フォーム）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード画像として、公式サイトのイメージギャラリーより」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 4 | トレードチーム | カード管理 — カード CSV 登録（取込）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード画像として、ITチームにて、トレードチームがS3にアップした画像と商品名を」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | トレードチーム | カード管理 — カードセット一覧を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード管理からとして、新弾の販売予定のシングルカードの登録を行うため」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | トレードチーム | カード管理 — カードセット新規登録・編集・削除を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード登録として、登録用CSVを作成する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード管理として、作成したカード登録CSVを投入し、カードを登録」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 8 | トレードチーム | m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード商品CSVとして、商品マスターに登録する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 9 | トレードチーム | M03-02（商品編集機能）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード商品CSVとして、カード商品CSVを作成する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 10 | トレードチーム | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「カード商品として、作成したCSVをアップロードし商品登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 11 | トレードチーム | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「商品情報編集として、調整が必要なカード情報の編集を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 12 | トレードチーム | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-002 を検索して「発売日1週間前として、プレリリース業務へ移る」を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 商品コード=ST-PRODUCT-PRODUCT-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 発売日前日チェックで予約数と引当在庫が一致しない | 出荷確定へ進めず、予約数と在庫の差異を確認できる状態にする | 予約数、引当在庫、差異件数 |
| A1 | 1 | 予約キャンセル分を発売日集荷/出荷インポート対象から除外できない | キャンセル分を出荷対象に含めず、除外件数を確認できる状態にする | キャンセル件数、出荷対象件数、出荷インポート結果 |
| E2 | 1 | 発売日集荷・出荷インポートの取込に失敗する | 出荷完了にせず、取込エラー行と対象件数を確認できる状態にする | 取込結果、エラー行、出荷ステータス |
| E3 | 1 | 商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる | 保存または公開を止め、不整合項目を確認できる状態にする | 商品詳細、カテゴリ、公開状態 |
| E4 | 1 | 価格または在庫連動に必要な値が未設定である | 公開または販売可能状態にせず、不足項目を表示する | 価格、在庫区分、公開状態 |
| A2 | 1 | 公開・非公開の一括切替対象に対象外商品が含まれる | 対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする | 処理結果、商品公開状態、除外件数 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | トレードチーム | カード管理 — カード検索（一覧・条件抽出）で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「発売日前日チェックで予約数と引当在庫が一致しない」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 出荷確定へ進めず、予約数と在庫の差異を確認できる状態にする。確認対象: 予約数、引当在庫、差異件数 |
| 2 | A1 | トレードチーム | カード管理 — 新規登録・編集・削除（詳細フォーム）で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「予約キャンセル分を発売日集荷/出荷インポート対象から除外できない」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | キャンセル分を出荷対象に含めず、除外件数を確認できる状態にする。確認対象: キャンセル件数、出荷対象件数、出荷インポート結果 |
| 3 | E2 | トレードチーム | カード管理 — カード CSV 登録（取込）で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「発売日集荷・出荷インポートの取込に失敗する」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 出荷完了にせず、取込エラー行と対象件数を確認できる状態にする。確認対象: 取込結果、エラー行、出荷ステータス |
| 4 | E3 | トレードチーム | カード管理 — カードセット一覧で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 保存または公開を止め、不整合項目を確認できる状態にする。確認対象: 商品詳細、カテゴリ、公開状態 |
| 5 | E4 | トレードチーム | カード管理 — カードセット新規登録・編集・削除で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「価格または在庫連動に必要な値が未設定である」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 公開または販売可能状態にせず、不足項目を表示する。確認対象: 価格、在庫区分、公開状態 |
| 6 | A2 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）で 商品コード=ST-PRODUCT-PRODUCT-002 を対象に、条件「公開・非公開の一括切替対象に対象外商品が含まれる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-002 | 対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする。確認対象: 処理結果、商品公開状態、除外件数 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 新弾発表 発売週の2週間前 予約シングルの販売準備の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 発売日前日チェックで予約数と引当在庫が一致しない<br>予約キャンセル分を発売日集荷/出荷インポート対象から除外できない<br>発売日集荷・出荷インポートの取込に失敗する<br>商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる | 予約数、引当在庫、差異件数<br>キャンセル件数、出荷対象件数、出荷インポート結果<br>取込結果、エラー行、出荷ステータス<br>商品詳細、カテゴリ、公開状態 |

## トレーサビリティ
- **カバーする業務フロー番号**: 商品登録・編集 / パターン2
- **期待する主要機能No**: M14-01, M14-04, M14-05, M14-06, M14-08, M03-26, M03-03, M03-01, M03-02, M03-27, M03-38, M03-08, M03-09, M03-20, M03-35, M03-37
- **シナリオに紐づく機能No**: M14-01, M14-04, M14-05, M14-06, M14-08, M03-26, M03-03, M03-01, M03-02, M03-27, M03-38, M03-08, M03-09, M03-20, M03-35, M03-37
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | カード管理 — カード検索（一覧・条件抽出） | M14-01 | `functions/pf-eccube3/m14-01_admin_card_card_search.md` | `integration_test/e2e/m14_01_admin_card_card_search_e2e_cases.md` |
  | カード管理 — 新規登録・編集・削除（詳細フォーム） | M14-04 | `functions/pf-eccube3/m14-04_admin_card_card_register_update_delete.md` | `integration_test/e2e/m14_04_admin_card_card_register_update_delete_e2e_cases.md` |
  | カード管理 — カード CSV 登録（取込） | M14-05 | `functions/pf-eccube3/m14-05_admin_card_card_csv_import.md` | `integration_test/e2e/m14_05_admin_card_card_csv_import_e2e_cases.md` |
  | カード管理 — カードセット一覧 | M14-06 | `functions/pf-eccube3/m14-06_admin_card_cardset_list.md` | `integration_test/e2e/m14_06_admin_card_cardset_list_e2e_cases.md` |
  | カード管理 — カードセット新規登録・編集・削除 | M14-08 | `functions/pf-eccube3/m14-08_admin_card_cardset_register_update_delete.md` | `integration_test/e2e/m14_08_admin_card_cardset_register_update_delete_e2e_cases.md` |
  | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録） | M03-26 | `functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md` | `integration_test/e2e/m03_26_admin_product_product_card_csv_import_e2e_cases.md` |
  | m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力） | M03-03 | `functions/pf-eccube3/m03-03_admin_product_product_card_csv_export.md` | `integration_test/e2e/m03_03_admin_product_product_card_csv_export_e2e_cases.md` |
  | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | M03-01 | `functions/pf-eccube3/m03-01_admin_product_product_search_list.md` | `integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md` |
  | M03-02（商品編集機能） | M03-02 | `functions/pf-eccube3/m03-02_admin_product_product_edit.md` | `integration_test/e2e/m03_02_admin_product_product_edit_e2e_cases.md` |
  | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録） | M03-27 | `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md` | `integration_test/e2e/m03_27_admin_product_product_goods_csv_import_e2e_cases.md` |
  | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録） | M03-38 | `functions/pf-eccube3/m03-38_admin_product_product_status_csv.md` | `integration_test/e2e/m03_38_admin_product_product_status_csv_e2e_cases.md` |
  | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） | M03-08 | `functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md` | `integration_test/e2e/m03_08_admin_product_product_product_class_list_e2e_cases.md` |
  | M03-09（商品規格登録/編集） | M03-09 | `functions/pf-eccube3/m03-09_admin_product_product_class_edit.md` | `integration_test/e2e/m03_09_admin_product_product_class_edit_e2e_cases.md` |
  | 商品管理 — 部門CSV入力 | M03-20 | `functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md` | `integration_test/e2e/m03_20_admin_product_product_department_csv_import_e2e_cases.md` |
  | m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録） | M03-35 | `functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md` | `integration_test/e2e/m03_35_admin_product_product_section_csv_import_e2e_cases.md` |
  | m03-37_admin_product_product_storage_code_csv_import（管理画面_商品管理_略称タグ更新CSV登録） | M03-37 | `functions/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.md` | `integration_test/e2e/m03_37_admin_product_product_storage_code_csv_import_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  - `excel_to_html/output/0208_基本設計仕様書(カード管理).html`
  - `excel_to_html/output/0303_基本設計仕様書(フロント_商品).html`
  - `excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html`
  - `excel_to_html/output/0502_基本設計仕様書(API_商品管理).html`
  - `excel_to_html/output/0514_基本設計仕様書(API_カード管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
