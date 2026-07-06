<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-PRODUCT-新商品登録既製品オリ-004 新商品登録（既製品・オリパ・デッキセット）

## 概要
- **目的**: 新商品登録（既製品・オリパ・デッキセット）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 新商品登録（既製品・オリパ・デッキセット）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 商品登録・編集 / パターン4
  - 出典: `scenario_test/markdown/10_商品登録・編集_tobe.md`

## アクター
- **主アクター**: トレードチーム
- **副アクター**: ITチーム、通販チーム、デザインチーム
- **関連システム**: EC-CUBE、AWS S3、在庫管理

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-product-004` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-PRODUCT-PRODUCT-004` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-product-004 |
| 会員番号 | ST-MEMBER-PRODUCT-004 |
| 商品コード | ST-PRODUCT-PRODUCT-004 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| カテゴリ | テストカテゴリ |
| 販売価格 | 500円 |
| 公開状態 | 非公開 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | トレードチーム | 新商品登録（既製品・オリパ・デッキセット）を行う | M03-02（商品編集機能）（M03-02） | 対象データが登録され、一覧または詳細で確認できる |
| 2 | トレードチーム | 商品画像準備として、サプライ品、構築済みデッキなど既製品の場合や | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（M03-26） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | トレードチーム | デッキセット判定として、デッキセット作成の場合デッキリスト作成を行う | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）（M03-27） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | トレードチーム | デッキリスト作成として、商品ページへの埋め込み用にECサイトのデッキ構築より | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（M03-38） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | トレードチーム | インポート用CSV作成として、EC-CUBEに登録するためのインポート用CSVを作成する | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（M03-08） | 対象データが登録され、一覧または詳細で確認できる |
| 6 | トレードチーム | 商品登録として、CSVをアップロードし商品登録を行う | M03-09（商品規格登録/編集）（M03-09） | 対象データが登録され、一覧または詳細で確認できる |
| 7 | トレードチーム | 部門更新として、CSVをアップロードし部門更新を行う | 商品管理 — 部門CSV入力（M03-20） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 8 | トレードチーム | 在庫入荷時を行う | M04-01（在庫検索/一覧）（M04-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 9 | トレードチーム | 在庫更新として、入荷した商品数に更新する | M04-21（在庫変更CSV登録）（M04-21） | 対象データの状態または値が更新され、検索結果や詳細で確認できる |
| 10 | トレードチーム | デッキセットの在庫登録を行う | M04-12（在庫分割結合検索/一覧）（M04-12） | 対象データが登録され、一覧または詳細で確認できる |
| 11 | トレードチーム | デッキセット以外の在庫登録を行う | M04-13（在庫分割結合登録/編集）（M04-13） | 対象データが登録され、一覧または詳細で確認できる |
| 12 | トレードチーム | 在庫インポート用CSV作成を行う | M04-23（在庫分割結合CSV登録）（M04-23） | 対象データが登録され、一覧または詳細で確認できる |
| 13 | トレードチーム | 在庫変更CSV登録として、作成したCSVを在庫変更CSV登録で取り込む | m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）（M03-35） | 対象データが登録され、一覧または詳細で確認できる |
| 14 | トレードチーム | 公開設定として、非公開商品だった場合公開設定に変更する | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（M03-01） | 対象データの状態または値が更新され、検索結果や詳細で確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | トレードチーム | M03-02（商品編集機能）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「新商品登録（既製品・オリパ・デッキセット）を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 2 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「商品画像準備として、サプライ品、構築済みデッキなど既製品の場合や」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | トレードチーム | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「デッキセット判定として、デッキセット作成の場合デッキリスト作成を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | トレードチーム | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「デッキリスト作成として、商品ページへの埋め込み用にECサイトのデッキ構築より」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | トレードチーム | m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「インポート用CSV作成として、EC-CUBEに登録するためのインポート用CSVを作成する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 6 | トレードチーム | M03-09（商品規格登録/編集）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「商品登録として、CSVをアップロードし商品登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 7 | トレードチーム | 商品管理 — 部門CSV入力を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「部門更新として、CSVをアップロードし部門更新を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 8 | トレードチーム | M04-01（在庫検索/一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「在庫入荷時を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 9 | トレードチーム | M04-21（在庫変更CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「在庫更新として、入荷した商品数に更新する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 10 | トレードチーム | M04-12（在庫分割結合検索/一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「デッキセットの在庫登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 11 | トレードチーム | M04-13（在庫分割結合登録/編集）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「デッキセット以外の在庫登録を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 12 | トレードチーム | M04-23（在庫分割結合CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「在庫インポート用CSV作成を行う」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 13 | トレードチーム | m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「在庫変更CSV登録として、作成したCSVを在庫変更CSV登録で取り込む」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 14 | トレードチーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）を開き、商品コード=ST-PRODUCT-PRODUCT-004 を検索して「公開設定として、非公開商品だった場合公開設定に変更する」を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 商品コード=ST-PRODUCT-PRODUCT-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |

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
| 1 | E1 | トレードチーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「商品コード、カテゴリ、発売日、公開状態の組み合わせが不整合になる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 保存または公開を止め、不整合項目を確認できる状態にする。確認対象: 商品詳細、カテゴリ、公開状態 |
| 2 | E2 | トレードチーム | M03-02（商品編集機能）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「価格または在庫連動に必要な値が未設定である」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 公開または販売可能状態にせず、不足項目を表示する。確認対象: 価格、在庫区分、公開状態 |
| 3 | A1 | トレードチーム | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「公開・非公開の一括切替対象に対象外商品が含まれる」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 対象外商品を更新せず、処理結果で成功件数と除外件数を確認できる状態にする。確認対象: 処理結果、商品公開状態、除外件数 |
| 4 | E3 | トレードチーム | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 5 | E4 | トレードチーム | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E5 | トレードチーム | M04-01（在庫検索/一覧）で 商品コード=ST-PRODUCT-PRODUCT-004 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-PRODUCT-PRODUCT-004 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 新商品登録（既製品・オリパ・デッキセット）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
- **カバーする業務フロー番号**: 商品登録・編集 / パターン4
- **期待する主要機能No**: M03-01, M03-02, M03-26, M03-27, M03-38, M04-01, M04-21, M04-12, M04-13, M04-23, M03-08, M03-09, M03-20, M03-35, M03-37
- **シナリオに紐づく機能No**: M03-01, M03-02, M03-26, M03-27, M03-38, M04-01, M04-21, M04-12, M04-13, M04-23, M03-08, M03-09, M03-20, M03-35, M03-37
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | M03-01 | `functions/pf-eccube3/m03-01_admin_product_product_search_list.md` | `integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md` |
  | M03-02（商品編集機能） | M03-02 | `functions/pf-eccube3/m03-02_admin_product_product_edit.md` | `integration_test/e2e/m03_02_admin_product_product_edit_e2e_cases.md` |
  | m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録） | M03-26 | `functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md` | `integration_test/e2e/m03_26_admin_product_product_card_csv_import_e2e_cases.md` |
  | m03-27_admin_product_product_goods_csv_import（管理画面_商品管理_グッズ商品CSV登録） | M03-27 | `functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md` | `integration_test/e2e/m03_27_admin_product_product_goods_csv_import_e2e_cases.md` |
  | m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録） | M03-38 | `functions/pf-eccube3/m03-38_admin_product_product_status_csv.md` | `integration_test/e2e/m03_38_admin_product_product_status_csv_e2e_cases.md` |
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | M04-12（在庫分割結合検索/一覧） | M04-12 | `functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md` | `integration_test/e2e/m04_12_admin_stock_stock_split_join_search_list_e2e_cases.md` |
  | M04-13（在庫分割結合登録/編集） | M04-13 | `functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md` | `integration_test/e2e/m04_13_admin_stock_stock_split_join_register_edit_e2e_cases.md` |
  | M04-23（在庫分割結合CSV登録） | M04-23 | `functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md` | `integration_test/e2e/m04_23_admin_stock_stock_split_join_csv_import_e2e_cases.md` |
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
