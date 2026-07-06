<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-PRODUCT-高額商品登録ナンバー-006 高額商品登録(#ナンバー等個別登録商品作成)

## 概要
- **目的**: 高額商品登録(#ナンバー等個別登録商品作成)を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 高額商品登録(#ナンバー等個別登録商品作成)が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 商品登録・編集 / パターン6
  - 出典: `scenario_test/markdown/10_商品登録・編集_tobe.md`

## アクター
- **主アクター**: トレードチーム
- **副アクター**: ITチーム、通販チーム、デザインチーム
- **関連システム**: EC-CUBE、AWS S3、在庫管理

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-product-006` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-PRODUCT-PRODUCT-006` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-product-006 |
| 会員番号 | ST-MEMBER-PRODUCT-006 |
| 商品コード | ST-PRODUCT-PRODUCT-006 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| カテゴリ | テストカテゴリ |
| 販売価格 | 500円 |
| 公開状態 | 非公開 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | トレードチーム | 高額商品登録(#ナンバー等個別登録商品作成)を行う | カード管理 — カード CSV 登録（取込）（M14-05） | 対象データが登録され、一覧または詳細で確認できる |
| 2 | トレードチーム | 商品画像準備として、スキャンや写真撮影等で商品画像を用意 | カード管理 — カードセット一覧（M14-06） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | トレードチーム | カードデータ有無として、カードデータが無い場合カードデータの新規登録を行う | カード管理 — カード検索（一覧・条件抽出）（M14-01） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | トレードチーム | カードデータ登録として、カードデータの登録および商品登録を行う | カード管理 — 新規登録・編集・削除（詳細フォーム）（M14-04） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | トレードチーム | 商品登録として、商品マスターから商品の設定ページ(商品登録)へ | カード管理 — カードセット新規登録・編集・削除（M14-08） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | トレードチーム | 在庫変更を行う | M04-01（在庫検索/一覧）（M04-01） | 対象データの状態または値が更新され、検索結果や詳細で確認できる |
| 7 | トレードチーム | 販促として、特集ページやへの記載や告知等を販売開始時に併せて行う | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（M03-26） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | トレードチーム | カード管理 — カード CSV 登録（取込）を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「高額商品登録(#ナンバー等個別登録商品作成)を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 2 | トレードチーム | カード管理 — カードセット一覧を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「商品画像準備として、スキャンや写真撮影等で商品画像を用意」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | トレードチーム | カード管理 — カード検索（一覧・条件抽出）を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「カードデータ有無として、カードデータが無い場合カードデータの新規登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | トレードチーム | カード管理 — 新規登録・編集・削除（詳細フォーム）を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「カードデータ登録として、カードデータの登録および商品登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | トレードチーム | カード管理 — カードセット新規登録・編集・削除を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「商品登録として、商品マスターから商品の設定ページ(商品登録)へ」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | トレードチーム | M04-01（在庫検索/一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「在庫変更を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-006 を検索して「販促として、特集ページやへの記載や告知等を販売開始時に併せて行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 商品コード=ST-PRODUCT-PRODUCT-006 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる | 保存または公開を止め、不整合項目を確認できる状態にする | 商品詳細、カテゴリ、公開状態 |
| E2 | 1 | 価格または在庫連動に必要な値が未設定である | 公開または販売可能状態にせず、不足項目を表示する | 価格、在庫区分、公開状態 |
| A1 | 1 | 公開・非公開の一括切替対象に対象外商品が含まれる | 対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする | 処理結果、商品公開状態、除外件数 |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E5 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | トレードチーム | カード管理 — カード検索（一覧・条件抽出）で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 保存または公開を止め、不整合項目を確認できる状態にする。確認対象: 商品詳細、カテゴリ、公開状態 |
| 2 | E2 | トレードチーム | カード管理 — 新規登録・編集・削除（詳細フォーム）で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「価格または在庫連動に必要な値が未設定である」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 公開または販売可能状態にせず、不足項目を表示する。確認対象: 価格、在庫区分、公開状態 |
| 3 | A1 | トレードチーム | カード管理 — カード CSV 登録（取込）で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「公開・非公開の一括切替対象に対象外商品が含まれる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする。確認対象: 処理結果、商品公開状態、除外件数 |
| 4 | E3 | トレードチーム | カード管理 — カードセット一覧で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 5 | E4 | トレードチーム | カード管理 — カードセット新規登録・編集・削除で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E5 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）で 商品コード=ST-PRODUCT-PRODUCT-006 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-006 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 高額商品登録(#ナンバー等個別登録商品作成)の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる<br>価格または在庫連動に必要な値が未設定である<br>公開・非公開の一括切替対象に対象外商品が含まれる<br>担当者に必要な権限がない | 商品詳細、カテゴリ、公開状態<br>価格、在庫区分、公開状態<br>処理結果、商品公開状態、除外件数<br>権限エラー表示、対象データの更新有無 |

## トレーサビリティ
- **カバーする業務フロー番号**: 商品登録・編集 / パターン6
- **期待する主要機能No**: M14-01, M14-04, M14-05, M14-06, M14-08, M03-26, M03-03, M04-01, M04-21, M04-12, M04-13, M04-23, M03-01, M03-02, M03-08, M03-09, M03-20, M03-27, M03-35, M03-37
- **シナリオに紐づく機能No**: M14-01, M14-04, M14-05, M14-06, M14-08, M03-26, M03-03, M04-01, M04-21, M04-12, M04-13, M04-23, M03-01, M03-02, M03-08, M03-09, M03-20, M03-27, M03-35, M03-37
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
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | M04-12（在庫分割結合検索/一覧） | M04-12 | `functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md` | `integration_test/e2e/m04_12_admin_stock_stock_split_join_search_list_e2e_cases.md` |
  | M04-13（在庫分割結合登録/編集） | M04-13 | `functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md` | `integration_test/e2e/m04_13_admin_stock_stock_split_join_register_edit_e2e_cases.md` |
  | M04-23（在庫分割結合CSV登録） | M04-23 | `functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md` | `integration_test/e2e/m04_23_admin_stock_stock_split_join_csv_import_e2e_cases.md` |
  | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | M03-01 | `functions/pf-eccube3/m03-01_admin_product_product_search_list.md` | `integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md` |
  | M03-02（商品編集機能） | M03-02 | `functions/pf-eccube3/m03-02_admin_product_product_edit.md` | `integration_test/e2e/m03_02_admin_product_product_edit_e2e_cases.md` |
  | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） | M03-08 | `functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md` | `integration_test/e2e/m03_08_admin_product_product_product_class_list_e2e_cases.md` |
  | M03-09（商品規格登録/編集） | M03-09 | `functions/pf-eccube3/m03-09_admin_product_product_class_edit.md` | `integration_test/e2e/m03_09_admin_product_product_class_edit_e2e_cases.md` |
  | 商品管理 — 部門CSV入力 | M03-20 | `functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md` | `integration_test/e2e/m03_20_admin_product_product_department_csv_import_e2e_cases.md` |
  | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録） | M03-27 | `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md` | `integration_test/e2e/m03_27_admin_product_product_goods_csv_import_e2e_cases.md` |
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
