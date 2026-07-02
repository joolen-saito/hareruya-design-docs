<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-KAITORI-店頭買取本店支店とも-001 店頭買取（本店、支店ともに同じフロー）

## 概要
- **目的**: 店頭買取（本店、支店ともに同じフロー）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: 店頭買取（本店、支店ともに同じフロー）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: 店頭買取 / パターン1
  - 出典: `scenario_test/markdown/07_店頭買取_tobe.md`

## アクター
- **主アクター**: 店舗チーム
- **副アクター**: お客様、商品管理チーム、経理担当、支店
- **関連システム**: EC-CUBE、MTGバイヤー、スマレジ

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-kaitori-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-KAITORI-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-kaitori-001 |
| 会員番号 | ST-MEMBER-KAITORI-001 |
| 商品コード | ST-CARD-KAITORI-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| 買取受付番号 | ST-BUY-KAITORI-001 |
| 査定対象商品 | ST-CARD-KAITORI-001 |
| 査定金額 | 1,200円 |
| 買取ステータス | 査定中 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 支店担当者 | 店頭買取（本店、支店ともに同じフロー）を行う | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）（M06-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 店舗チーム | 受付として、会員の場合はログイン、会員でない場合は会員情報を入力してもらう | M06-10（戻しリストCSV出力）（M06-10） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 店舗チーム | 査定として、買取アプリを使って査定を開始 | M06-11（戻しリストPDF出力）（M06-11） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 4 | 店舗チーム | 査定表印刷として、査定した結果を印刷する | M06-12（買取商品一覧CSV）（M06-12） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 5 | 店舗チーム | 本人確認として、受付時にコピーした身分証で本人確認を実施する | M04-21（在庫変更CSV登録）（M04-21） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 6 | お客様 | 査定結果確認として、査定結果をお客様と確認する | 店頭買取管理 — 買取詳細（買取情報の確認と保存）（M06-03） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 7 | 店舗チーム | 出金処理として、買取価格を出金する | 店頭買取管理 — 買取ステータス変更（M06-04） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 8 | 店舗チーム | 出金処理として、買取価格を出金する | 店頭買取管理 — 買取商品履歴（検索／一覧）（M06-05） | 金額・対象受注・処理結果が一致し、処理状態を確認できる |
| 9 | 店舗チーム | 買取成立として、買取成立したら | m06-06_admin_store_purchase_purchase_store_history_csv_export_all（管理画面_店頭買取管理_買取商品履歴_検索結果全件CSV出力）（M06-06） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 10 | 通販チーム | 店頭商品通販商品として、日英のNMのみ通販商品とする | m06-07_admin_store_purchase_purchase_store_history_select_csv_export（管理画面_店頭買取管理_買取商品履歴_選択CSV出力）（M06-07） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 11 | 店舗チーム | 店舗商品準備として、バーコード印刷し、商品を店頭に陳列する | API 店頭買取管理 — 店頭買取受注一覧取得（A06-02） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 12 | 店舗チーム | 店頭陳列を行う | API 店頭買取管理 — 店頭買取受注詳細更新（A06-03） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 13 | 店舗チーム | 入庫用CSV作成として、入庫時に用いるCSVファイルを出力する | API 店頭買取管理 — 店頭買取受注ステータス更新（A06-05） | 対象データが登録され、一覧または詳細で確認できる |
| 14 | 店舗チーム | BackLog起票として、Backlogにファイルをアップロードする | API 店頭買取管理 — 本人確認更新（A06-13） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 15 | 店舗チーム | 仕入れ作業として、仕入れ作業を行う | A06-14（店頭買取情報一部キャンセル情報連携）（A06-14） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 16 | 店舗チーム | CSV出力を行う | A06-15（店頭買取情報同一所属店舗メンバー取得）（A06-15） | 業務に必要なCSV/帳票が出力され、対象件数と内容を確認できる |
| 17 | 店舗チーム | 在庫登録として、Backlogにファイルをアップロードする | A06-16（店頭買取情報ダブルチェック者更新）（A06-16） | 対象データが登録され、一覧または詳細で確認できる |
| 18 | 店舗チーム | 戻し作業として、仕入れ作業を行う | B06-01（買取自動入庫バッチ）（B06-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 19 | 通販チーム | 店頭商品通販商品を行う | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（O01-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 20 | 店舗チーム | 店舗商品準備として、バーコード印刷し、商品を店頭に陳列する | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（O01-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 21 | 店舗チーム | 店頭陳列を行う | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（O01-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | 支店担当者 | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店頭買取（本店、支店ともに同じフロー）を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 店舗チーム | M06-10（戻しリストCSV出力）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「受付として、会員の場合はログイン、会員でない場合は会員情報を入力してもらう」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 店舗チーム | M06-11（戻しリストPDF出力）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「査定として、買取アプリを使って査定を開始」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 4 | 店舗チーム | M06-12（買取商品一覧CSV）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「査定表印刷として、査定した結果を印刷する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 店舗チーム | M04-21（在庫変更CSV登録）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「本人確認として、受付時にコピーした身分証で本人確認を実施する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 6 | お客様 | 店頭買取管理 — 買取詳細（買取情報の確認と保存）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「査定結果確認として、査定結果をお客様と確認する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 7 | 店舗チーム | 店頭買取管理 — 買取ステータス変更を開き、商品コード=ST-CARD-KAITORI-001 を検索して「出金処理として、買取価格を出金する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の金額が 1,200円 と一致し、処理履歴に担当者と処理日時が残る |
| 8 | 店舗チーム | 店頭買取管理 — 買取商品履歴（検索／一覧）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「出金処理として、買取価格を出金する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の金額が 1,200円 と一致し、処理履歴に担当者と処理日時が残る |
| 9 | 店舗チーム | m06-06_admin_store_purchase_purchase_store_history_csv_export_all（管理画面_店頭買取管理_買取商品履歴_検索結果全件CSV出力）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「買取成立として、買取成立したら」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 10 | 通販チーム | m06-07_admin_store_purchase_purchase_store_history_select_csv_export（管理画面_店頭買取管理_買取商品履歴_選択CSV出力）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店頭商品通販商品として、日英のNMのみ通販商品とする」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 11 | 店舗チーム | API 店頭買取管理 — 店頭買取受注一覧取得を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店舗商品準備として、バーコード印刷し、商品を店頭に陳列する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 12 | 店舗チーム | API 店頭買取管理 — 店頭買取受注詳細更新を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店頭陳列を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 13 | 店舗チーム | API 店頭買取管理 — 店頭買取受注ステータス更新を開き、商品コード=ST-CARD-KAITORI-001 を検索して「入庫用CSV作成として、入庫時に用いるCSVファイルを出力する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 14 | 店舗チーム | API 店頭買取管理 — 本人確認更新を開き、商品コード=ST-CARD-KAITORI-001 を検索して「BackLog起票として、Backlogにファイルをアップロードする」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 15 | 店舗チーム | A06-14（店頭買取情報一部キャンセル情報連携）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「仕入れ作業として、仕入れ作業を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 16 | 店舗チーム | A06-15（店頭買取情報同一所属店舗メンバー取得）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「CSV出力を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 のCSV/帳票が出力され、対象件数と主要項目がシード値と一致する |
| 17 | 店舗チーム | A06-16（店頭買取情報ダブルチェック者更新）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「在庫登録として、Backlogにファイルをアップロードする」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 18 | 店舗チーム | B06-01（買取自動入庫バッチ）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「戻し作業として、仕入れ作業を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 19 | 通販チーム | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店頭商品通販商品を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 20 | 店舗チーム | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店舗商品準備として、バーコード印刷し、商品を店頭に陳列する」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 21 | 店舗チーム | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）を開き、商品コード=ST-CARD-KAITORI-001 を検索して「店頭陳列を行う」を実行する | 商品コード=ST-CARD-KAITORI-001 | 商品コード=ST-CARD-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| A1 | 1 | 買取キャンセルとして、買取一覧のステータスを「買取キャンセル」に更新される | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする | キャンセル状態、在庫戻し、通知結果、操作履歴 |
| E1 | 1 | 査定結果に不備または対象商品不一致がある | 買取成立に進めず、差戻しまたは再査定状態にする | 査定状態、対象商品、買取明細 |
| E2 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E3 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E4 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |
| E5 | 1 | 入力値の必須項目不足または形式不正がある | エラー内容を表示し、業務データを中途半端に更新しない | 入力エラー表示、対象データの更新有無 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | A1 | 店舗チーム | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「買取キャンセルとして、買取一覧のステータスを「買取キャンセル」に更新される」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | 対象データをキャンセル状態にし、在庫戻し、通知、履歴を確認できる状態にする。確認対象: キャンセル状態、在庫戻し、通知結果、操作履歴 |
| 2 | E1 | 店舗チーム | M06-10（戻しリストCSV出力）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「査定結果に不備または対象商品不一致がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | 買取成立に進めず、差戻しまたは再査定状態にする。確認対象: 査定状態、対象商品、買取明細 |
| 3 | E2 | 店舗チーム | M06-11（戻しリストPDF出力）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 4 | E3 | 店舗チーム | M06-12（買取商品一覧CSV）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 5 | E4 | 店舗チーム | M04-21（在庫変更CSV登録）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |
| 6 | E5 | 店舗チーム | 店頭買取管理 — 買取詳細（買取情報の確認と保存）で 商品コード=ST-CARD-KAITORI-001 を対象に、条件「入力値の必須項目不足または形式不正がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-KAITORI-001 | エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 店頭買取（本店、支店ともに同じフロー）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 買取キャンセルとして、買取一覧のステータスを「買取キャンセル」に更新される<br>査定結果に不備または対象商品不一致がある<br>担当者に必要な権限がない<br>検索条件に一致する対象データが存在しない | キャンセル状態、在庫戻し、通知結果、操作履歴<br>査定状態、対象商品、買取明細<br>権限エラー表示、対象データの更新有無<br>検索結果、更新履歴 |

## トレーサビリティ
- **カバーする業務フロー番号**: 店頭買取 / パターン1
- **期待する主要機能No**: M06-01, M06-10, M06-11, M06-12, M04-21, M06-03, M06-04, M06-05, M06-06, M06-07, A06-02, A06-03, A06-05, A06-13, A06-14, A06-15, A06-16, B06-01, O01-01
- **シナリオに紐づく機能No**: M06-01, M06-10, M06-11, M06-12, M04-21, M06-03, M06-04, M06-05, M06-06, M06-07, A06-02, A06-03, A06-05, A06-13, A06-14, A06-15, A06-16, B06-01, O01-01
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | m06-01_admin_store_purchase_purchase_store_search_list（管理画面_店頭買取管理_買取検索一覧） | M06-01 | `functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md` | `integration_test/e2e/m06_01_admin_store_purchase_purchase_store_search_list_e2e_cases.md` |
  | M06-10（戻しリストCSV出力） | M06-10 | `functions/ec-cube-enterprise/m06-10_admin_store_purchase_purchase_store_return_list_csv_export.md` | `integration_test/e2e/m06_10_admin_store_purchase_purchase_store_return_list_csv_export_e2e_cases.md` |
  | M06-11（戻しリストPDF出力） | M06-11 | `functions/ec-cube-enterprise/m06-11_admin_store_purchase_purchase_store_return_list_pdf_export.md` | `integration_test/e2e/m06_11_admin_store_purchase_purchase_store_return_list_pdf_export_e2e_cases.md` |
  | M06-12（買取商品一覧CSV） | M06-12 | `functions/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.md` | `integration_test/e2e/m06_12_admin_store_purchase_purchase_store_product_list_csv_export_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | 店頭買取管理 — 買取詳細（買取情報の確認と保存） | M06-03 | `functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md` | `integration_test/e2e/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit_e2e_cases.md` |
  | 店頭買取管理 — 買取ステータス変更 | M06-04 | `functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md` | `integration_test/e2e/m06_04_admin_store_purchase_purchase_store_status_change_e2e_cases.md` |
  | 店頭買取管理 — 買取商品履歴（検索／一覧） | M06-05 | `functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md` | `integration_test/e2e/m06_05_admin_store_purchase_purchase_store_history_e2e_cases.md` |
  | m06-06_admin_store_purchase_purchase_store_history_csv_export_all（管理画面_店頭買取管理_買取商品履歴_検索結果全件CSV出力） | M06-06 | `functions/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.md` | `integration_test/e2e/m06_06_admin_store_purchase_purchase_store_history_csv_export_all_e2e_cases.md` |
  | m06-07_admin_store_purchase_purchase_store_history_select_csv_export（管理画面_店頭買取管理_買取商品履歴_選択CSV出力） | M06-07 | `functions/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.md` | `integration_test/e2e/m06_07_admin_store_purchase_purchase_store_history_select_csv_export_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注一覧取得 | A06-02 | `functions/pf-api/a06-02_api_store_purchase_otc_buy_order_list.md` | `integration_test/e2e/a06_02_api_store_purchase_otc_buy_order_list_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注詳細更新 | A06-03 | `functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md` | `integration_test/e2e/a06_03_api_store_purchase_otc_buy_order_update_e2e_cases.md` |
  | API 店頭買取管理 — 店頭買取受注ステータス更新 | A06-05 | `functions/pf-api/a06-05_api_store_purchase_otc_buy_order_status.md` | `integration_test/e2e/a06_05_api_store_purchase_otc_buy_order_status_e2e_cases.md` |
  | API 店頭買取管理 — 本人確認更新 | A06-13 | `functions/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.md` | `integration_test/e2e/a06_13_api_store_purchase_otc_buy_order_identification_e2e_cases.md` |
  | A06-14（店頭買取情報一部キャンセル情報連携） | A06-14 | `functions/ec-cube-enterprise/a06-14_api_store_purchase_otc_buy_order_partial_cancel_sync.md` | `integration_test/e2e/a06_14_api_store_purchase_otc_buy_order_partial_cancel_sync_e2e_cases.md` |
  | A06-15（店頭買取情報同一所属店舗メンバー取得） | A06-15 | `functions/ec-cube-enterprise/a06-15_api_store_purchase_otc_buy_order_same_store_members.md` | `integration_test/e2e/a06_15_api_store_purchase_otc_buy_order_same_store_members_e2e_cases.md` |
  | A06-16（店頭買取情報ダブルチェック者更新） | A06-16 | `functions/ec-cube-enterprise/a06-16_api_store_purchase_otc_buy_order_double_check_member_update.md` | `integration_test/e2e/a06_16_api_store_purchase_otc_buy_order_double_check_member_update_e2e_cases.md` |
  | B06-01（買取自動入庫バッチ） | B06-01 | `functions/ec-cube-enterprise/b06-01_batch_purchase_purchase_auto_stock.md` | `integration_test/e2e/b06_01_batch_purchase_purchase_auto_stock_e2e_cases.md` |
  | o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取） | O01-01 | `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md` | `integration_test/e2e/o01_01_other_mtg_buyer_mtg_buyer_store_purchase_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html`
  - `excel_to_html/output/0308_基本設計仕様書(フロント_店頭買取).html`
  - `excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html`
  - `excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html`
- **関連テスト観点**: 業務フロー、画面遷移、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
