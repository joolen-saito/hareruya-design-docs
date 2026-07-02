<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-PRICE-セール管理-001 セール管理

## 概要
- **目的**: セール管理を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: セール管理が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 価格管理 / パターン1
  - 出典: `scenario_test/markdown/11_価格管理.md`

## アクター
- **主アクター**: トレードチーム
- **副アクター**: 商品管理チーム、支店、セール担当者
- **関連システム**: EC-CUBE、分析集計

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-price-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-PRICE-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-price-001 |
| 会員番号 | ST-MEMBER-PRICE-001 |
| 商品コード | ST-CARD-PRICE-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 価格変更CSV | ST-PRICE-PRICE-001.csv |
| 対象商品コード | ST-CARD-PRICE-001 |
| 変更前価格 | 500円 |
| 変更後価格 | 550円 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | トレードチーム | セール管理を行う | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）（M03-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | トレードチーム | セール品選定依頼対応として、セール品選定依頼のメールを送付し | M03-31（セール用価格変更CSV登録）（M03-31） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 3 | トレードチーム | 作業用ファイル取得として、セール品選定作業用のCSVファイルを | m03-34_admin_product_product_discount_csv_import（管理画面_商品管理_割引率変更CSV登録）（M03-34） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 4 | トレードチーム | セール品リスト作成として、セール対象とする商品のリストを作成する | m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（M09-02） | 対象データが登録され、一覧または詳細で確認できる |
| 5 | トレードチーム | セール品情報更新作業として、セール用価格変更CSVアップロード画面よりセール品の更新対応を行う | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（M03-01） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 6 | トレードチーム | セールバナー差し替え対応として、セールバナー差し替え作業を行う | 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力）（M03-23） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 7 | 支店担当者 | 各支店へのリスト共有として、メールにて、セール品の各支店にリストを共有 | 商品管理 — 買取/販売価格履歴 CSV 出力（M03-24） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 8 | トレードチーム | メール返信対応として、セール品設定依頼完了メールに返信して終了 | m03-30_admin_product_product_product_price_csv_import（管理画面_商品管理_セール用価格変更CSV登録）（M03-30） | 対象者へ通知され、送信状態または通知結果を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | トレードチーム | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）を開き、商品コード=ST-CARD-PRICE-001 を検索して「セール管理を行う」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | トレードチーム | M03-31（セール用価格変更CSV登録）を開き、商品コード=ST-CARD-PRICE-001 を検索して「セール品選定依頼対応として、セール品選定依頼のメールを送付し」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | トレードチーム | m03-34_admin_product_product_discount_csv_import（管理画面_商品管理_割引率変更CSV登録）を開き、商品コード=ST-CARD-PRICE-001 を検索して「作業用ファイル取得として、セール品選定作業用のCSVファイルを」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 4 | トレードチーム | m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）を開き、商品コード=ST-CARD-PRICE-001 を検索して「セール品リスト作成として、セール対象とする商品のリストを作成する」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 5 | トレードチーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）を開き、商品コード=ST-CARD-PRICE-001 を検索して「セール品情報更新作業として、セール用価格変更CSVアップロード画面よりセール品の更新対応を行う」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 6 | トレードチーム | 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力）を開き、商品コード=ST-CARD-PRICE-001 を検索して「セールバナー差し替え対応として、セールバナー差し替え作業を行う」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 7 | 支店担当者 | 商品管理 — 買取/販売価格履歴 CSV 出力を開き、商品コード=ST-CARD-PRICE-001 を検索して「各支店へのリスト共有として、メールにて、セール品の各支店にリストを共有」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 8 | トレードチーム | m03-30_admin_product_product_product_price_csv_import（管理画面_商品管理_セール用価格変更CSV登録）を開き、商品コード=ST-CARD-PRICE-001 を検索して「メール返信対応として、セール品設定依頼完了メールに返信して終了」を実行する | 商品コード=ST-CARD-PRICE-001 | 商品コード=ST-CARD-PRICE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 価格CSVに形式不正または存在しない商品コードが含まれる | 該当行をエラーにし、正常行の更新結果とエラー行を確認できる状態にする | CSV取込結果、価格、エラー行 |
| E2 | 1 | 価格変更後の販売価格が許容範囲外になる | 価格更新を止め、対象商品と不正価格を確認できる状態にする | 商品価格、エラー表示、更新履歴 |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E5 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E6 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | トレードチーム | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「価格CSVに形式不正または存在しない商品コードが含まれる」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | 該当行をエラーにし、正常行の更新結果とエラー行を確認できる状態にする。確認対象: CSV取込結果、価格、エラー行 |
| 2 | E2 | トレードチーム | M03-31（セール用価格変更CSV登録）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「価格変更後の販売価格が許容範囲外になる」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | 価格更新を止め、対象商品と不正価格を確認できる状態にする。確認対象: 商品価格、エラー表示、更新履歴 |
| 3 | E3 | トレードチーム | m03-34_admin_product_product_discount_csv_import（管理画面_商品管理_割引率変更CSV登録）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | トレードチーム | m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E5 | トレードチーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E6 | トレードチーム | 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力）で 商品コード=ST-CARD-PRICE-001 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-PRICE-001 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- セール管理の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 価格CSVに形式不正または存在しない商品コードが含まれる<br>価格変更後の販売価格が許容範囲外になる<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | CSV取込結果、価格、エラー行<br>商品価格、エラー表示、更新履歴<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: 価格管理 / パターン1
- **期待する主要機能No**: M03-05, M03-31, M03-34, M09-02, M03-01, M03-23, M03-24, M03-30, M03-32, M03-33, M03-36
- **シナリオに紐づく機能No**: M03-05, M03-31, M03-34, M09-02, M03-01, M03-23, M03-24, M03-30, M03-32, M03-33, M03-36
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力） | M03-05 | `functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md` | `integration_test/e2e/m03_05_admin_product_product_sale_price_csv_export_e2e_cases.md` |
  | M03-31（セール用価格変更CSV登録） | M03-31 | `functions/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.md` | `integration_test/e2e/m03_31_admin_product_product_sale_price_csv_import_e2e_cases.md` |
  | m03-34_admin_product_product_discount_csv_import（管理画面_商品管理_割引率変更CSV登録） | M03-34 | `functions/pf-eccube3/m03-34_admin_product_product_discount_csv_import.md` | `integration_test/e2e/m03_34_admin_product_product_discount_csv_import_e2e_cases.md` |
  | m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理） | M09-02 | `functions/ec-cube-enterprise/m09-02_admin_content_content_file.md` | `integration_test/e2e/m09_02_admin_content_content_file_e2e_cases.md` |
  | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | M03-01 | `functions/pf-eccube3/m03-01_admin_product_product_search_list.md` | `integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md` |
  | 商品管理 — 買取/販売価格履歴（検索・一覧・CSV出力） | M03-23 | `functions/pf-eccube3/m03-23_admin_product_product_buy_sale_price_history.md` | `integration_test/e2e/m03_23_admin_product_product_buy_sale_price_history_e2e_cases.md` |
  | 商品管理 — 買取/販売価格履歴 CSV 出力 | M03-24 | `functions/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.md` | `integration_test/e2e/m03_24_admin_product_product_buy_sale_price_history_csv_export_e2e_cases.md` |
  | m03-30_admin_product_product_product_price_csv_import（管理画面_商品管理_セール用価格変更CSV登録） | M03-30 | `functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md` | `integration_test/e2e/m03_30_admin_product_product_product_price_csv_import_e2e_cases.md` |
  | m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録） | M03-32 | `functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md` | `integration_test/e2e/m03_32_admin_product_product_simple_high_price_csv_import_e2e_cases.md` |
  | m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録） | M03-33 | `functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md` | `integration_test/e2e/m03_33_admin_product_product_sale_high_price_csv_import_e2e_cases.md` |
  | m03-36_admin_product_product_buy_discount_csv_import（管理画面_商品管理_買取減額率変更CSV登録） | M03-36 | `functions/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.md` | `integration_test/e2e/m03_36_admin_product_product_buy_discount_csv_import_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  - `excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html`
  - `excel_to_html/output/0209_基本設計仕様書(基本情報設定).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
