<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）

## 概要
- **目的**: ネット買取処理（お客様の申し込みから郵送までの業務）を、関連画面・外部システムを横断して業務完了状態まで確認する。
- **分類**: 正常系 / 代替系 / 異常系
- **優先度**: P1
- **業務トリガー**: ネット買取処理（お客様の申し込みから郵送までの業務）が必要になったとき。
- **トレース元要件**:
  - 業務フロー番号: ネット買取 / パターン1
  - 出典: `scenario_test/markdown/14_ネット買取.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、商品管理チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-online-kaitori-001` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-ONLINE-KAITORI-001` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-online-kaitori-001 |
| 会員番号 | ST-MEMBER-ONLINE-KAITORI-001 |
| 商品コード | ST-CARD-ONLINE-KAITORI-001 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| ネット買取申込番号 | ST-OBUY-ONLINE-KAITORI-001 |
| 本人確認状態 | 確認済み |
| 査定対象商品 | ST-CARD-ONLINE-KAITORI-001 |
| 振込先 | テスト銀行 普通 1234567 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | お客様 | ネット買取処理（お客様の申し込みから郵送までの業務）を行う | F05-01（ネット買取トップページ）（F05-01） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 2 | 通販チーム | 買取申し込みカード選択として、顧客が買取ページにアクセスし | F05-02（ネット買取商品検索）（F05-02） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 3 | 通販チーム | 買取申し込み処理として、カート内の買取希望の商品を確認し、買取依頼処理を行う | F05-03（ネット買取商品一覧）（F05-03） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 4 | 通販チーム | 買取依頼受付メール受領として、買取依頼処理が完了すると | F05-04（ネット買取商品詳細）（F05-04） | 対象者へ通知され、送信状態または通知結果を確認できる |
| 5 | 通販チーム | 買取希望カード郵送として、買取希望のカードを顧客が晴れる屋に郵送する | F05-05（ネット買取カート）（F05-05） | 対象データの処理ステータス、処理履歴、担当者、処理日時を確認できる |
| 6 | 通販チーム | オンライン本人確認として、PCの場合マイページ内のオンライン本人確認画面よりQRコードが | 会員 — オンライン本人確認（F06-13） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 7 | 通販チーム | 本人確認受付メール受領として、本人確認作業が完了すると | M08-10（オンライン本人確認）（M08-10） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 8 | 通販チーム | 本人確認受付通知メール受領を行う | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（M07-01） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 9 | お客様 | 本人確認書類確認として、お客様に通知したメールと同じメールがネット買取に届くため | ネット買取管理 — 買取情報編集（買取詳細）（M07-03） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 10 | 通販チーム | 本人確認書類確認判定として、身分証の内容に問題があったり、登録情報に問題がないか確認 | F05-06（ネット買取買取手続き〜完了）（F05-06） | 対象データが登録され、一覧または詳細で確認できる |
| 11 | 通販チーム | オンライン本人確認再登録として、本人情報変更し、再度オンライン本人確認申請 | m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）（M07-02） | 対象データが登録され、一覧または詳細で確認できる |
| 12 | 通販チーム | 身分証に問題がない場合として、身分証と登録情報を確認し問題がなければ | m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（M07-04） | 対象データが登録され、一覧または詳細で確認できる |
| 13 | お客様 | 本人確認完了メール送付として、お客様にオンライン本人確認が完了したことをメール通知する | m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（M07-05） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |
| 14 | 通販チーム | 本人確認完了メール受領として、本人確認完了メールを受領 | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）（M07-06） | 対象情報の一致/不一致を判断でき、不一致時は後続処理へ進まない |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|
| 1 | お客様 | F05-01（ネット買取トップページ）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「ネット買取処理（お客様の申し込みから郵送までの業務）を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 2 | 通販チーム | F05-02（ネット買取商品検索）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「買取申し込みカード選択として、顧客が買取ページにアクセスし」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 3 | 通販チーム | F05-03（ネット買取商品一覧）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「買取申し込み処理として、カート内の買取希望の商品を確認し、買取依頼処理を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 4 | 通販チーム | F05-04（ネット買取商品詳細）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「買取依頼受付メール受領として、買取依頼処理が完了すると」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 5 | 通販チーム | F05-05（ネット買取カート）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「買取希望カード郵送として、買取希望のカードを顧客が晴れる屋に郵送する」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる |
| 6 | 通販チーム | 会員 — オンライン本人確認を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「オンライン本人確認として、PCの場合マイページ内のオンライン本人確認画面よりQRコードが」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 7 | 通販チーム | M08-10（オンライン本人確認）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認受付メール受領として、本人確認作業が完了すると」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 8 | 通販チーム | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認受付通知メール受領を行う」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 9 | お客様 | ネット買取管理 — 買取情報編集（買取詳細）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認書類確認として、お客様に通知したメールと同じメールがネット買取に届くため」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 10 | 通販チーム | F05-06（ネット買取買取手続き〜完了）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認書類確認判定として、身分証の内容に問題があったり、登録情報に問題がないか確認」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 11 | 通販チーム | m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「オンライン本人確認再登録として、本人情報変更し、再度オンライン本人確認申請」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 12 | 通販チーム | m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「身分証に問題がない場合として、身分証と登録情報を確認し問題がなければ」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される |
| 13 | お客様 | m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認完了メール送付として、お客様にオンライン本人確認が完了したことをメール通知する」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |
| 14 | 通販チーム | m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）を開き、商品コード=ST-CARD-ONLINE-KAITORI-001 を検索して「本人確認完了メール受領として、本人確認完了メールを受領」を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 本人確認失敗メール送付として、身分証の更新や登録情報の変更と再申請をするようメール送付する | エラー内容を表示し、対象データを中途半端に更新しない | 本人確認状態、後続処理ボタンの活性/非活性、通知結果 |
| E2 | 1 | 本人確認失敗メール受領として、本人確認失敗メールを受領 | エラー内容を表示し、対象データを中途半端に更新しない | 本人確認状態、後続処理ボタンの活性/非活性、通知結果 |
| E3 | 1 | 本人確認書類に不備がある | 振込または成立処理へ進めず、再確認状態にする | 本人確認状態、買取ステータス、通知結果 |
| E4 | 1 | 担当者に必要な権限がない | 処理を開始させず、権限エラーを表示して対象データを更新しない | 権限エラー表示、対象データの更新有無 |
| E5 | 1 | 検索条件に一致する対象データが存在しない | 0件結果を表示し、後続の更新操作へ進ませない | 検索結果、更新履歴 |
| E6 | 1 | 同一対象に対して同じ処理を重複実行する | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする | 対象データ、処理履歴 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 |
|---|---|---|---|---|---|
| 1 | E1 | 通販チーム | 会員 — オンライン本人確認で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「本人確認失敗メール送付として、身分証の更新や登録情報の変更と再申請をするようメール送付する」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | エラー内容を表示し、対象データを中途半端に更新しない。確認対象: 本人確認状態、後続処理ボタンの活性/非活性、通知結果 |
| 2 | E2 | 通販チーム | M08-10（オンライン本人確認）で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「本人確認失敗メール受領として、本人確認失敗メールを受領」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | エラー内容を表示し、対象データを中途半端に更新しない。確認対象: 本人確認状態、後続処理ボタンの活性/非活性、通知結果 |
| 3 | E3 | 通販チーム | m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「本人確認書類に不備がある」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果 |
| 4 | E4 | 通販チーム | ネット買取管理 — 買取情報編集（買取詳細）で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「担当者に必要な権限がない」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無 |
| 5 | E5 | 通販チーム | F05-01（ネット買取トップページ）で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「検索条件に一致する対象データが存在しない」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴 |
| 6 | E6 | 通販チーム | F05-02（ネット買取商品検索）で 商品コード=ST-CARD-ONLINE-KAITORI-001 を対象に、条件「同一対象に対して同じ処理を重複実行する」となるデータまたは操作を実行する | 商品コード=ST-CARD-ONLINE-KAITORI-001 | 二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴 |

## 完了条件（業務的ゴール／データ状態の最終確認）
- ネット買取処理（お客様の申し込みから郵送までの業務）の対象データが、業務フロー上の次工程または完了状態として追跡できる。
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
| 6 | 本人確認失敗メール送付として、身分証の更新や登録情報の変更と再申請をするようメール送付する<br>本人確認失敗メール受領として、本人確認失敗メールを受領<br>本人確認書類に不備がある<br>担当者に必要な権限がない | 本人確認状態、後続処理ボタンの活性/非活性、通知結果<br>本人確認状態、後続処理ボタンの活性/非活性、通知結果<br>本人確認状態、買取ステータス、通知結果<br>権限エラー表示、対象データの更新有無 |

## トレーサビリティ
- **カバーする業務フロー番号**: ネット買取 / パターン1
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
