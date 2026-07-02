<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-TSUHAN-お客様EC購入フロー-001 お客様EC購入フロー

## 概要
- **目的**: お客様EC購入フローを、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: お客様EC購入フローが必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 通販受注管理 / パターン1
  - 出典: `scenario_test/markdown/16_通販受注管理.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、GMO、配送/ラベル印字アプリ
- **関連システム**: EC-CUBE、GMO、メール、海外発送管理アプリ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-tsuhan-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `受注番号=ST-ORDER-TSUHAN-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-tsuhan-001 |
| 会員番号 | ST-MEMBER-TSUHAN-001 |
| 商品コード | ST-CARD-TSUHAN-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 受注番号 | ST-ORDER-TSUHAN-001 |
| 決済状態 | 売上確定済み |
| 受注ステータス | 対応中 |
| 返金対象金額 | 1,000円 |
| 配送方法 | 宅配便 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | お客様 | お客様EC購入フローを行う | F04-01（買い物かご）（F04-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | お客様 | トップページとして、お客様がECトップページに自然流入 | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文）（F04-02） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 通販チーム | 商品をカートに入れるとして、商品購入のため商品一覧からカートに商品を投入 | F04-03（注文時の配送先登録・変更）（F04-03） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 4 | 通販チーム | 注文処理として、カート画面にて、購入処理を進める | カート — 決済〜購入完了（F04-04） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | お客様 | 注文完了として、注文完了となり注文完了メールがお客様宛に送付される | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（M05-01） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 6 | 通販チーム | メール受領として、メールを受領する | m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力）（M05-02） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 7 | 通販チーム | 決済手段による分岐として、クレジットカード・代金引換以外の場合 | m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード）（M05-03） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 8 | 通販チーム | 決済処理として、コンビニ決済、郵便振替、銀行振込の場合、決済処理を行う | m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（M05-06） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 9 | 通販チーム | 購入完了として、購入完了 | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）（M05-11） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | お客様 | F04-01（買い物かご）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「お客様EC購入フローを行う」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | お客様 | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「トップページとして、お客様がECトップページに自然流入」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 通販チーム | F04-03（注文時の配送先登録・変更）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「商品をカートに入れるとして、商品購入のため商品一覧からカートに商品を投入」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 4 | 通販チーム | カート — 決済〜購入完了を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「注文処理として、カート画面にて、購入処理を進める」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | お客様 | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「注文完了として、注文完了となり注文完了メールがお客様宛に送付される」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 6 | 通販チーム | m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「メール受領として、メールを受領する」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 7 | 通販チーム | m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「決済手段による分岐として、クレジットカード・代金引換以外の場合」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の金額が 1,000円 と一致し、処理履歴に担当者と処理日時が残る |
| 8 | 通販チーム | m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「決済処理として、コンビニ決済、郵便振替、銀行振込の場合、決済処理を行う」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の金額が 1,000円 と一致し、処理履歴に担当者と処理日時が残る |
| 9 | 通販チーム | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集）を開き、受注番号=ST-ORDER-TSUHAN-001 を検索して「購入完了として、購入完了」を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注番号=ST-ORDER-TSUHAN-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 決済失敗または入金額不一致が発生する | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする | 受注ステータス、決済状態、入金額 |
| E2 | 1 | 出荷対象商品の在庫が不足している | 出荷を確定せず、欠品または保留状態として確認できる状態にする | 受注ステータス、在庫数、出荷可否 |
| E3 | 1 | 配送・ラベル印字・海外発送連携に失敗する | 出荷完了にせず、再実行可能な保留状態にする | 連携結果、出荷ステータス、再実行可否 |
| E4 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E5 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 通販チーム | F04-01（買い物かご）で 受注番号=ST-ORDER-TSUHAN-001 を対象に、条件「決済失敗または入金額不一致が発生する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 受注を完了扱いにせず、決済状態または入金差異を確認できる状態にする。確認対象: 受注ステータス、決済状態、入金額 |
| 2 | E2 | 通販チーム | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文）で 受注番号=ST-ORDER-TSUHAN-001 を対象に、条件「出荷対象商品の在庫が不足している」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 出荷を確定せず、欠品または保留状態として確認できる状態にする。確認対象: 受注ステータス、在庫数、出荷可否 |
| 3 | E3 | 通販チーム | F04-03（注文時の配送先登録・変更）で 受注番号=ST-ORDER-TSUHAN-001 を対象に、条件「配送・ラベル印字・海外発送連携に失敗する」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 出荷完了にせず、再実行可能な保留状態にする。確認対象: 連携結果、出荷ステータス、再実行可否 |
| 4 | E4 | 通販チーム | カート — 決済〜購入完了で 受注番号=ST-ORDER-TSUHAN-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 5 | E5 | 通販チーム | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）で 受注番号=ST-ORDER-TSUHAN-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 受注番号=ST-ORDER-TSUHAN-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- お客様EC購入フローの対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 5 | 決済失敗または入金額不一致が発生する<br>出荷対象商品の在庫が不足している<br>配送・ラベル印字・海外発送連携に失敗する<br>担当者に必要な権限がない | 受注ステータス、決済状態、入金額<br>受注ステータス、在庫数、出荷可否<br>連携結果、出荷ステータス、再実行可否<br>権限エラー表示、対象データの更新有無 |

## トレーサビリティ
- **カバーする業務フロー番号**: 通販受注管理 / パターン1
- **期待する主要機能No**: F04-01, F04-02, F04-03, F04-04, M05-01, M05-02, M05-03, M05-06, M05-11, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
- **シナリオに紐づく機能No**: F04-01, F04-02, F04-03, F04-04, M05-01, M05-02, M05-03, M05-06, M05-11, M05-12, M05-13, M05-14, M05-15, M05-16, M05-17
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | F04-01（買い物かご） | F04-01 | `functions/pf-eccube3/f04-01_front_cart_cart_index.md` | `integration_test/e2e/f04_01_front_cart_cart_index_e2e_cases.md` |
  | F04-02（ご注文方法指定 — 注文情報の入力・確認・注文） | F04-02 | `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md` | `integration_test/e2e/f04_02_front_cart_shopping_order_method_e2e_cases.md` |
  | F04-03（注文時の配送先登録・変更） | F04-03 | `functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md` | `integration_test/e2e/f04_03_front_cart_shopping_delivery_edit_e2e_cases.md` |
  | カート — 決済〜購入完了 | F04-04 | `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md` | `integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md` |
  | m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧） | M05-01 | `functions/pf-eccube3/m05-01_admin_order_order_search_list.md` | `integration_test/e2e/m05_01_admin_order_order_search_list_e2e_cases.md` |
  | m05-02_admin_order_order_csv_export（受注管理_受注情報CSV出力） | M05-02 | `functions/pf-eccube3/m05-02_admin_order_order_csv_export.md` | `integration_test/e2e/m05_02_admin_order_order_csv_export_e2e_cases.md` |
  | m05-03_admin_order_order_custom_csv_export（受注管理 — カスタム受注CSVダウンロード） | M05-03 | `functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md` | `integration_test/e2e/m05_03_admin_order_order_custom_csv_export_e2e_cases.md` |
  | m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括） | M05-06 | `functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md` | `integration_test/e2e/m05_06_admin_order_order_bulk_manual_mail_e2e_cases.md` |
  | m05-11_admin_order_order_edit（管理画面_受注管理_受注情報編集） | M05-11 | `functions/pf-eccube3/m05-11_admin_order_order_edit.md` | `integration_test/e2e/m05_11_admin_order_order_edit_e2e_cases.md` |
  | m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更） | M05-12 | `functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md` | `integration_test/e2e/m05_12_admin_order_order_bulk_status_change_e2e_cases.md` |
  | m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力） | M05-13 | `functions/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.md` | `integration_test/e2e/m05_13_admin_order_order_tracking_number_e2e_cases.md` |
  | m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更） | M05-14 | `functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md` | `integration_test/e2e/m05_14_admin_order_order_status_change_e2e_cases.md` |
  | m05-15_admin_order_order_mail（管理画面_受注詳細メール通知） | M05-15 | `functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md` | `integration_test/e2e/m05_15_admin_order_order_mail_e2e_cases.md` |
  | m05-16_admin_order_order_shop_memo（管理画面_受注編集_ショップ用メモ登録） | M05-16 | `functions/ec-cube-enterprise/m05-16_admin_order_order_shop_memo.md` | `integration_test/e2e/m05_16_admin_order_order_shop_memo_e2e_cases.md` |
  | m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録） | M05-17 | `functions/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.md` | `integration_test/e2e/m05_17_admin_order_order_shipping_memo_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html`
  - `excel_to_html/output/0304_基本設計仕様書(フロント_注文).html`
  - `excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html`
  - `excel_to_html/output/0505_基本設計仕様書(API_受注管理).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
