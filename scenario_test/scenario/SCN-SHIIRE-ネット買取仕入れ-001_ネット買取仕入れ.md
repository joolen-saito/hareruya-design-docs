<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-SHIIRE-ネット買取仕入れ-001 ネット買取仕入れ

## 概要
- **目的**: ネット買取仕入れを、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: ネット買取仕入れが必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 仕入れ業務 / パターン1
  - 出典: `scenario_test/markdown/15_仕入れ業務.md`

## アクター
- **主アクター**: 商品管理チーム
- **副アクター**: 店舗チーム、通販チーム、トレードチーム
- **関連システム**: EC-CUBE、MTGバイヤー、Backlog

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-shiire-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-SHIIRE-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-shiire-001 |
| 会員番号 | ST-MEMBER-SHIIRE-001 |
| 商品コード | ST-CARD-SHIIRE-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 仕入番号 | ST-PURCHASE-SHIIRE-001 |
| 仕入対象商品 | ST-CARD-SHIIRE-001 |
| 仕入数量 | 5 |
| 仕入ステータス | 未確定 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 商品管理チーム | ネット買取仕入れを行う | M06-12（買取商品一覧CSV）（M06-12） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 商品管理チーム | ソート作業として、買取したカードのソート作業を行う | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）（M07-06） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 商品管理チーム | Wチェック作業として、あらかじめ作成された打ち込みファイルを参照し | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（M03-01） | 対象データが登録され、一覧または詳細で確認できる |
| 4 | 通販チーム | 価格ソート作業として、金庫（赤）4800円以上、キャビネット(橙)980円～4790円、通販棚～970円 | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）（M03-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | 商品管理チーム | スリーブ入れ作業として、カードをスリーブに入れていく | 商品管理 — 買取/販売価格履歴 CSV 出力（M03-24） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 6 | 商品管理チーム | インポート依頼として、インポート依頼を送る | M04-01（在庫検索/一覧）（M04-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 7 | 商品管理チーム | 仕入れ統合作業へとして、仕入れ統合作業へ | M04-21（在庫変更CSV登録）（M04-21） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 商品管理チーム | M06-12（買取商品一覧CSV）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「ネット買取仕入れを行う」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 商品管理チーム | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「ソート作業として、買取したカードのソート作業を行う」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 商品管理チーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「Wチェック作業として、あらかじめ作成された打ち込みファイルを参照し」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 4 | 通販チーム | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「価格ソート作業として、金庫（赤）4800円以上、キャビネット(橙)980円～4790円、通販棚～970円」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 商品管理チーム | 商品管理 — 買取/販売価格履歴 CSV 出力を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「スリーブ入れ作業として、カードをスリーブに入れていく」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 6 | 商品管理チーム | M04-01（在庫検索/一覧）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「インポート依頼として、インポート依頼を送る」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 7 | 商品管理チーム | M04-21（在庫変更CSV登録）を開き、商品コード=ST-CARD-SHIIRE-001 を検索して「仕入れ統合作業へとして、仕入れ統合作業へ」を実行する | 商品コード=ST-CARD-SHIIRE-001 | 商品コード=ST-CARD-SHIIRE-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 仕入れ対象データと商品マスタが一致しない | 仕入れ確定にせず、対象不一致を確認できる状態にする | 商品マスタ、仕入れ明細、処理ステータス |
| E2 | 1 | 仕入れ入庫が重複する | 二重在庫計上を防止し、既存の入庫履歴を確認できる状態にする | 在庫数、入庫履歴、仕入れステータス |
| E3 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E4 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 商品管理チーム | M06-12（買取商品一覧CSV）で 商品コード=ST-CARD-SHIIRE-001 を対象に、条件「仕入れ対象データと商品マスタが一致しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-SHIIRE-001 | 仕入れ確定にせず、対象不一致を確認できる状態にする。確認対象: 商品マスタ、仕入れ明細、処理ステータス |
| 2 | E2 | 商品管理チーム | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）で 商品コード=ST-CARD-SHIIRE-001 を対象に、条件「仕入れ入庫が重複する」となるデータまたは操作を実行する | 商品コード=ST-CARD-SHIIRE-001 | 二重在庫計上を防止し、既存の入庫履歴を確認できる状態にする。確認対象: 在庫数、入庫履歴、仕入れステータス |
| 3 | E3 | 商品管理チーム | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）で 商品コード=ST-CARD-SHIIRE-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-SHIIRE-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E4 | 商品管理チーム | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力）で 商品コード=ST-CARD-SHIIRE-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-SHIIRE-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- ネット買取仕入れの対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 4 | 仕入れ対象データと商品マスタが一致しない<br>仕入れ入庫が重複する<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | 商品マスタ、仕入れ明細、処理ステータス<br>在庫数、入庫履歴、仕入れステータス<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: 仕入れ業務 / パターン1
- **期待する主要機能No**: M06-12, M07-06, M03-01, M03-05, M03-24, M04-01, M04-21
- **シナリオに紐づく機能No**: M06-12, M07-06, M03-01, M03-05, M03-24, M04-01, M04-21
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | M06-12（買取商品一覧CSV） | M06-12 | `functions/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.md` | `integration_test/e2e/m06_12_admin_store_purchase_purchase_store_product_list_csv_export_e2e_cases.md` |
  | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） | M07-06 | `functions/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md` | `integration_test/e2e/m07_06_admin_online_purchase_purchase_online_product_list_csv_export_e2e_cases.md` |
  | m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） | M03-01 | `functions/pf-eccube3/m03-01_admin_product_product_search_list.md` | `integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md` |
  | m03-05_admin_product_product_sale_price_csv_export（管理画面_商品管理_セール用価格変更CSV出力） | M03-05 | `functions/pf-eccube3/m03-05_admin_product_product_sale_price_csv_export.md` | `integration_test/e2e/m03_05_admin_product_product_sale_price_csv_export_e2e_cases.md` |
  | 商品管理 — 買取/販売価格履歴 CSV 出力 | M03-24 | `functions/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.md` | `integration_test/e2e/m03_24_admin_product_product_buy_sale_price_history_csv_export_e2e_cases.md` |
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html`
  - `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
  - `excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html`
  - `excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
