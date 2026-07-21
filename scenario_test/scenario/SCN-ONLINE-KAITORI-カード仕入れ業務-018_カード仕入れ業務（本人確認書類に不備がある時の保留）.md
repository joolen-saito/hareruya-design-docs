<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-ONLINE-KAITORI-カード仕入れ業務-018 カード仕入れ業務（本人確認書類に不備がある時の保留）

## 概要
- **目的**: カード仕入れ業務の業務経路「カード仕入れ業務（本人確認書類に不備がある時の保留）」を、関連画面・外部システムを横断して最終業務状態まで確認する。
- **分類**: 異常系
- **優先度**: P1
- **業務トリガー**: カード仕入れ業務が必要になり、経路条件「本人確認書類に不備がある」を満たすとき。
- **経路ID**: R02
- **経路種別**: 業務異常
- **親業務フローパターン**: ネット買取 / パターン4 / カード仕入れ業務
- **業務経路条件**: 本人確認書類に不備がある
- **最終業務状態**: 振込または成立処理へ進めず、再確認状態にすること。
- **トレース元要件**:
  - 業務フロー番号: ネット買取 / パターン4 / 経路2
  - 出典: `scenario_test/markdown/14_ネット買取.md`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、商品管理チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール

## 事前条件・テストデータ・環境
- **事前条件**: `st-user-online-kaitori-004-r02` でログインでき、以下のシードデータを検索・更新できる。
- **テストデータ(SEED)**: `商品コード=ST-CARD-ONLINE-KAITORI-004-R02` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | st-user-online-kaitori-004-r02 |
| 会員番号 | ST-MEMBER-ONLINE-KAITORI-004-R02 |
| 商品コード | ST-CARD-ONLINE-KAITORI-004-R02 |
| 数量 | 3 |
| 店舗 | 晴れる屋テスト店舗 |
| ネット買取申込番号 | ST-OBUY-ONLINE-KAITORI-004-R02 |
| 本人確認状態 | 確認済み |
| 査定対象商品 | ST-CARD-ONLINE-KAITORI-004-R02 |
| 振込先 | テスト銀行 普通 1234567 |

## データパターン
| パターンID | 種別 | 対象ステップ/分岐ID | 目的 | 前提差分 | 入力データ | 期待観測点 |
|---|---|---|---|---|---|---|
| DP-N001 | 正常系 代表 | 正常系#1-#2 | 業務異常の代表データで業務経路を確認する。 | 本人確認書類に不備がある 標準権限の担当者でログインし、標準マスタと基準シードデータを使用する。 | 担当者アカウント=st-user-online-kaitori-004-r02 / 商品コード=ST-CARD-ONLINE-KAITORI-004-R02 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004-R02 / 数量=3 / 店舗=晴れる屋テスト店舗 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004-R02 | 出力されたCSV/帳票の件数と内容<br>現物・現品、チェック票/帳票の記入、数量、サイン（EC-CUBE の更新は発生しない）<br>振込または成立処理へ進めず、再確認状態にすること。 |
| DP-B001 | 正常系 境界 | 正常系#2 | 本人確認の代表差分を確認する。 | 簡易書留確認済みと再確認待ちの申込を用意する。 | 商品コード=ST-CARD-ONLINE-KAITORI-004-R02-IDOK / 本人確認状態=確認済み / 商品コード=ST-CARD-ONLINE-KAITORI-004-R02-IDRETRY / 本人確認状態=再確認待ち | 本人確認状態、後続処理可否、通知結果 |
| DP-B002 | 正常系 境界 | 正常系#2 | 到着カード件数の最小/複数境界を確認する。 | 到着カード1件と複数件の申込を用意する。 | 商品コード=ST-CARD-ONLINE-KAITORI-004-R02-ONE / 到着カード=1件 / 商品コード=ST-CARD-ONLINE-KAITORI-004-R02-MULTI / 到着カード=30件 | 査定明細件数、買取ステータス、振込対象金額 |
| DP-E001 | 異常系 | 分岐E1 | 本人確認書類に不備がある | 分岐条件を満たす対象データを、正常代表データとは別IDで用意する。 | 必須項目欠落・形式不正の入力データ / 商品コード=ST-CARD-ONLINE-KAITORI-004-R02-E1 / 基準=商品コード=ST-CARD-ONLINE-KAITORI-004-R02 | 本人確認状態、買取ステータス、通知結果 |

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | 通販チーム | 打ち込みファイルとして、仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行い、 作成準備 その後打ち込みファイル用のデータを出力する | 管理画面_ネット買取管理_買取商品一覧CSV出力（M07-06） | 仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行い、 作成準備 その後打ち込みファイル用のデータを出力すること。 |
| 2 | 通販チーム | 打ち込みファイルとして、打ち込みファイルの作成を行う 作成 マクロにてファイルを作成している | 該当なし（物理作業。EC-CUBE操作なし）（-） | 打ち込みファイルの作成を行うこと。 |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|
| 1 | 通販チーム | 管理画面_ネット買取管理_買取商品一覧CSV出力で「打ち込みファイルとして、仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行い、 作成準備 その後打ち込みファイル用のデータを出力する」を行う | 商品コード=ST-CARD-ONLINE-KAITORI-004-R02 | 仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行い、 作成準備 その後打ち込みファイル用のデータを出力すること。 | 出力されたCSV/帳票の件数と内容 |
| 2 | 通販チーム | 現場作業として「打ち込みファイルとして、打ち込みファイルの作成を行う 作成 マクロにてファイルを作成している」を実施する（EC-CUBE操作なし） | 商品コード=ST-CARD-ONLINE-KAITORI-004-R02 | 打ち込みファイルの作成を行うこと。 | 現物・現品、チェック票/帳票の記入、数量、サイン（EC-CUBE の更新は発生しない） |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| E1 | 1 | 本人確認書類に不備がある | 振込または成立処理へ進めず、再確認状態にする | 本人確認状態、買取ステータス、通知結果 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|---|
| 1 | E1 | 通販チーム | 条件「本人確認書類に不備がある」となるデータ/操作を実行する（実施画面は要確認。機能Noを特定できていない） | 必須項目欠落・形式不正の入力データ（基準: 商品コード=ST-CARD-ONLINE-KAITORI-004-R02） | 振込または成立処理へ進めず、再確認状態にすること。 | 本人確認状態、買取ステータス、通知結果 |

## データ連鎖（業務フロー原典のデータ遷移線）
本層は機能テストではなく、**データのつながりで業務が完遂できるか**を見る。下表は業務フロー図の
データ遷移線（点線）だけを根拠に、「どの工程が何を産出し、それを次にどの工程が参照するか」を示す。
原典に無い結線・照合キーは創作しない。`自由端` は原典で接続先が未定義であることを示す実在の穴である。

| 連鎖ID | 産出工程 | 産出データ/帳票 | 消費工程 | 期待（データのつながり） | 照合キー | 判定 |
|---|---|---|---|---|---|---|
| DL-01 | #78 打ち込みファイル作成 | #79 打ち込みファイル*1 | (自由端＝原典で接続先未定義) | 「打ち込みファイル作成」で産出/更新された「打ち込みファイル*1」が確認できること。 | 原典上の照合キー未定義（要業務確認） | 要確認（消費先が原典未定義） |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 振込または成立処理へ進めず、再確認状態にすること。
- 画面、CSV/帳票、メール、外部システムのいずれかで、処理結果が確認できる。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
| 正常系 | ○ |
| 代替系 | - |
| 異常系 | ○ |
| 外部連携 | ○ |
| データ更新 | ○ |
| CSV/帳票 | ○ |
| メール/通知 | - |

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
| 1 | 本人確認書類に不備がある | 本人確認状態、買取ステータス、通知結果 |

## 他層委譲（結合テスト）
権限・必須/形式・重複実行・0件検索は機構的な確認であり、結合テスト層（`integration-test-viewpoints.md`）が
機能単位で網羅する。本シナリオでは重複して実行せず、下表の結合テストケースで担保する。
`未整備` は結合テスト側に該当ケースが無いことを示す実在の穴であり、隠さずに出す。

| 機構的観点 | 委譲先IT観点 | 結合テストケースID | 状態 |
|---|---|---|---|
| 担当者に必要な権限がない | IT-15 | `IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-002`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-003`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-004`<br>ほか 27 件 | 委譲済 |
| 入力値の必須項目不足または形式不正がある | IT-22 | `IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-011`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-012`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-013`<br>ほか 27 件 | 委譲済 |
| 同一対象に対して同じ処理を重複実行する | IT-08 | - | 未整備（結合テスト側に該当ケースなし） |
| 検索条件に一致する対象データが存在しない | IT-23 / IT-14 | `IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-021`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-022`<br>`IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-023`<br>ほか 36 件 | 委譲済 |

## トレーサビリティ
- **カバーする業務フロー番号**: ネット買取 / パターン4 / 経路2
- **期待する主要機能No**: M07-06, M04-21, M04-01
- **シナリオに紐づく機能No**: M07-06, M04-21, M04-01, O01-01, O01-02, O01-03
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | 管理画面_ネット買取管理_買取商品一覧CSV出力 | M07-06 | `functions/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md` | `integration_test/e2e/m07_06_admin_online_purchase_purchase_online_product_list_csv_export_e2e_cases.md` |
  | M04-21（在庫変更CSV登録） | M04-21 | `functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md` | `integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md` |
  | M04-01（在庫検索/一覧） | M04-01 | `functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md` | `integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md` |
  | その他_MTGバイヤー_店頭買取 | O01-01 | `functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md` | `integration_test/e2e/o01_01_other_mtg_buyer_mtg_buyer_store_purchase_e2e_cases.md` |
  | その他_MTGバイヤー_ネット買取 | O01-02 | `functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md` | `integration_test/e2e/o01_02_other_mtg_buyer_mtg_buyer_online_purchase_e2e_cases.md` |
  | その他_MTGバイヤー_入庫モード | O01-03 | `functions/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md` | `integration_test/e2e/o01_03_other_mtg_buyer_mtg_buyer_stock_inbound_e2e_cases.md` |
- **関連HTML設計書**:
  - `excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html`
  - `excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html`
  - `excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html`
  - `excel_to_html/output/0601_基本設計仕様書(その他_MTGBuyer).html`
- **関連テスト観点**: 業務フロー、業務経路（担当者・画面をまたぐ引き継ぎ）、最終業務状態、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
- **本シナリオで実行しない観点**: 画面遷移・バック・リロード・値引き継ぎ（IT-03）、および `## 他層委譲（結合テスト）` に挙げた機構的異常系。
