<!-- generated-by: hareruya-scenario-test-cases -->
# SCN-TSUHAN-海外EMS購入と出荷-915 海外住所の会員がEMSで購入し、出荷実績の取込みで英語の出荷完了メールが届く

## 概要
- **目的**: 海外住所の会員がEMSで購入し、出荷実績の取込みで英語の出荷完了メールが届くの業務経路「海外住所の会員がEMSで購入し、出荷実績の取込みで英語の出荷完了メールが届く」を、関連画面・外部システムを横断して最終業務状態まで確認する。
- **分類**: 代替系
- **優先度**: P1
- **業務トリガー**: 海外住所の会員がEMSで購入し、出荷実績の取込みで英語の出荷完了メールが届くが必要になり、経路条件「観点の当てはめ契約 VPR-TSUHAN-01-04-01 の経路（観点 SV-01-04・SV-05-03・SV-08-07・SV-17-08。設計書本文: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545）」を満たすとき。
- **経路ID**: R01
- **経路種別**: 主要代替
- **親業務フローパターン**: 通販受注管理 / パターン915 / 海外住所の会員がEMSで購入し、出荷実績の取込みで英語の出荷完了メールが届く
- **業務経路条件**: 観点の当てはめ契約 VPR-TSUHAN-01-04-01 の経路（観点 SV-01-04・SV-05-03・SV-08-07・SV-17-08。設計書本文: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545）
- **最終業務状態**: 同じ受注に出荷日と送り状No.が登録され、注文者へ英語の定型文の出荷完了メールが届いていることことを確認できること。
- **分岐根拠**: 観点 SV-01-04・SV-05-03・SV-08-07・SV-17-08 の当てはめで追加した経路。ご注文方法指定は配送先の国がJapan以外のとき配送方法をEMS・Small packetだけにすると定める。発送業務は海外ラベルデータ作業（4-5）とEMS後納表作成（4-8）を経て、EMSの当日出荷が確定したら出荷実績インポートへ取り込む（4-14）。出荷実績インポート登録は注文者の都道府県が海外のとき英語の定型文で出荷完了メールを送ると定める。既存経路は国内配送の購入（SCN-001・SCN-901）と海外の受注を前提にした発送業務（SCN-007）に分かれ、海外配送の分岐を購入から出荷完了まで通していない。 観点上の種別: 主要代替。 会員の国・商品・決済手段は実行用の具体値。海外の受注の支払方法の制限は設計書に無いため、クレジットカード決済で行う（SPLINKSの試験環境が必要） / 英語の定型文の文面は原典に無いため、日本語の定型文と異なる英語の件名・本文で届くことを判定する / 注文完了メールの言語は設計書に定めが無いため判定しない / 海外用ラベル生成マクロ・海外発送管理アプリの実ファイルと試験環境は外部原本の提示が前提（既存 SCN-007 と同じ保留条件）
- **トレース元要件**:
  - 業務フロー番号: 通販受注管理 / パターン915 / 経路1
  - 出典: `scenario_test/coverage/viewpoint_contracts.json`

## アクター
- **主アクター**: 通販チーム
- **副アクター**: お客様、SPLINKS、配送/ラベル印字アプリ
- **関連システム**: EC-CUBE、SPLINKS、メール、海外発送管理アプリ

## 事前条件・テストデータ・環境
- **事前条件**: 実施者識別子 `各担当者の実在テストアカウントを役割と店舗権限に対応付けて記録する` を証跡へ記録し、各工程の担当者権限を持つ実アカウントでログインできる。以下の論理IDは実データの採番値と対応付ける。
- **テストデータ(SEED)**: `商品コード=ST-CARD-TSUHAN-206` を正常系の主対象として使用する。
- **環境/マスタ**: 店舗、支払方法、配送方法、商品カテゴリ、在庫区分、外部連携先はテスト環境の標準マスタを使用する。

## 実行用テストデータ
| 項目 | 値 |
|---|---|
| 担当者アカウント | 各担当者の実在テストアカウントを役割と店舗権限に対応付けて記録する |
| 会員 | ST-MEMBER-TSUHAN-206 |
| 会員の国 | United States |
| 商品コード | ST-CARD-TSUHAN-206 |
| 数量 | 1 |
| 配送方法 | EMS |
| 支払方法 | クレジットカード決済 |
| 顧客氏名 | 試験 太郎 |
| 顧客フリガナ | シケン タロウ |
| 顧客区分 | 登録会員 |
| 顧客メール | scenario-915@example.test |
| 言語 | 日本語 |
| 商品状態 | NM |
| 出力ID対応 | 登録画面で採番した実IDを論理IDと対応付け、同じ対象を全工程で引き継ぐ |
| 販売単価 | 1,000円 |
| 商品代金 | 3,000円 |

## データパターン
| パターンID | 種別 | 対象ステップ/分岐ID | 目的 | 前提差分 | 入力データ | 期待観測点 |
|---|---|---|---|---|---|---|
| DP-N001 | 正常系 代表 | 正常系#1-#5 | 主要代替の代表データで業務経路を確認する。 | 観点の当てはめ契約 VPR-TSUHAN-01-04-01 の経路（観点 SV-01-04・SV-05-03・SV-08-07・SV-17-08。設計書本文: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545） 標準権限の担当者でログインし、標準マスタと基準シードデータを使用する。 国にJapan以外（United States）、都道府県に国外を登録した会員（ST-MEMBER-TSUHAN-206）と、在庫のある商品（ST-CARD-TSUHAN-206）、SPLINKSの試験用クレジットカードを用意する。 | 担当者アカウント=各担当者の実在テストアカウントを役割と店舗権限に対応付けて記録する / 会員=ST-MEMBER-TSUHAN-206 / 会員の国=United States / 商品コード=ST-CARD-TSUHAN-206 / 数量=1 / 配送方法=EMS / 支払方法=クレジットカード決済 / 顧客氏名=試験 太郎 / 顧客フリガナ=シケン タロウ / 顧客区分=登録会員 / 顧客メール=scenario-915@example.test / 言語=日本語 / 商品状態=NM / 出力ID対応=登録画面で採番した実IDを論理IDと対応付け、同じ対象を全工程で引き継ぐ / 販売単価=1,000円 / 商品代金=3,000円 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。<br>照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。<br>照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。<br>同じ受注に出荷日と送り状No.が登録され、注文者へ英語の定型文の出荷完了メールが届いていることことを確認できること。 |

> 分岐条件・対象ステップ・期待観測点は業務フロー原典由来。**入力データ列の具体値（在庫=0・数量=N・日時・シードID等）は、原典の分岐条件を実行可能にするための実行用の具体化（非原典値）**であり、原典に literal に書かれた値ではない（`## 実行用テストデータ` のシードIDと同種）。

## メインフロー（正常系）
| # | 担当者 | 業務行動 | 利用画面・機能 | 確認する業務結果 |
|---|---|---|---|---|
| 1 | お客様 | 買い物かご→ご注文方法指定として、商品をカートに入れて購入手続きへを押し、お届け先を会員情報住所のままにして配送方法指定の選択肢を記録する | 買い物かご→ご注文方法指定（F04-01・F04-02） | 海外住所の会員の注文手続きで、配送方法指定の選択肢がEMSとSmall packetだけで、それ以外の配送方法が表示されないこと。 |
| 2 | お客様 | ご注文方法指定→SPLINKS決済→注文完了 配送方法にEMS、お支払い方法にクレジットカード決済を選び、試験用カードで決済して注文を完了する | ご注文方法指定→SPLINKS決済→注文完了（F04-02・F04-04） | 注文完了画面にご注文番号が表示されること。 |
| 3 | 通販チーム | 受注情報検索・一覧→送り状CSV出力として、受注情報検索・一覧で同じ受注を選び、送り状CSV出力でCSVをダウンロードする | 受注情報検索・一覧→送り状CSV出力（M05-01・M05-07） | 送り状CSVに同じ受注が1行で出力され、発送先国コードが空欄でなく出力されること。 |
| 4 | 通販チーム | 海外用ラベル生成マクロ→海外発送管理アプリ（EC-CUBE操作なし） 工程3の送り状CSVを海外用ラベル生成マクロで成型して海外発送管理アプリに取り込み、出荷チェックのあとEMS後納表（出荷書類）を作成する | 外部システム/ツール作業（EC-CUBE操作なし）（-） | 海外発送管理アプリに同じ受注番号の出荷書類が作成・保存され、送り状No.が記録された状態であること。 |
| 5 | 通販チーム | 出荷実績インポート登録として、EMSの当日出荷が確定したら、ヘッダ「注文番号,出荷日,送り状No.」で同じ受注の1行のCSVを出荷実績インポート登録で取り込む | 出荷実績インポート登録（M05-26・M05-11） | 「登録が完了しました。」が表示され、同じ受注の出荷日と送り状No.がCSVの値で登録され、注文者の試験受信箱へ英語の定型文の出荷完了メールが送信されること。 |

## 実行手順（正常系）
| # | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|
| 1 | お客様 | 商品をカートに入れて購入手続きへを押し、お届け先を会員情報住所のままにして配送方法指定の選択肢を記録する。 | 注文番号=前工程の実行記録にある値。初回採番時は当該登録後に記録する | 海外住所の会員の注文手続きで、配送方法指定の選択肢がEMSとSmall packetだけで、それ以外の配送方法が表示されないこと。 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。 |
| 2 | お客様 | 配送方法にEMS、お支払い方法にクレジットカード決済を選び、試験用カードで決済して注文を完了する。 | 注文番号=前工程の実行記録にある値。初回採番時は当該登録後に記録する | 注文完了画面にご注文番号が表示されること。 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。 |
| 3 | 通販チーム | 受注情報検索・一覧で同じ受注を選び、送り状CSV出力でCSVをダウンロードする。 | 注文番号=前工程の実行記録にある値。初回採番時は当該登録後に記録する | 送り状CSVに同じ受注が1行で出力され、発送先国コードが空欄でなく出力されること。 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。 |
| 4 | 通販チーム | 工程3の送り状CSVを海外用ラベル生成マクロで成型して海外発送管理アプリに取り込み、出荷チェックのあとEMS後納表（出荷書類）を作成する。 | 注文番号=前工程の実行記録にある値。初回採番時は当該登録後に記録する | 海外発送管理アプリに同じ受注番号の出荷書類が作成・保存され、送り状No.が記録された状態であること。 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。 |
| 5 | 通販チーム | EMSの当日出荷が確定したら、ヘッダ「注文番号,出荷日,送り状No.」で同じ受注の1行のCSVを出荷実績インポート登録で取り込む。 | 注文番号=前工程の実行記録にある値。初回採番時は当該登録後に記録する | 「登録が完了しました。」が表示され、同じ受注の出荷日と送り状No.がCSVの値で登録され、注文者の試験受信箱へ英語の定型文の出荷完了メールが送信されること。 | 照合キー: 注文番号 / 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545#sheet-4 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546#sheet-4 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756#sheet-24 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770#sheet-24 / 設計差・留意点: HTML/業務フローの明記を補完。出典は確認対象を参照。 |

## 代替フロー / 異常系分岐
| 分岐ID | 起点# | 条件 | 期待挙動 | 確認対象 |
|---|---|---|---|---|
| - | - | この経路に業務分岐は無い（業務フローに分岐記載なし） | - | 機構的異常系は `## 他層委譲（結合テスト）` を参照 |

## 実行手順（代替系・異常系）
| # | 分岐ID | 担当者 | 操作 | 入力/対象 | 期待結果 | 確認対象 |
|---|---|---|---|---|---|---|
| - | - | - | 該当なし（この経路に業務分岐は無い） | - | 機構的異常系は `## 他層委譲（結合テスト）` の結合テストケースで実施すること。 | - |

## データ連鎖（業務フロー原典のデータ遷移線）
本層は機能テストではなく、**データのつながりで業務が完遂できるか**を見る。下表は業務フロー図の
データ遷移線（点線）だけを根拠に、「どの工程が何を産出し、それを次にどの工程が参照するか」を示す。
原典に無い結線・照合キーは創作しない。`自由端` は原典で接続先が未定義であることを示す実在の穴である。

| 連鎖ID | 産出工程 | 産出データ/帳票 | 消費工程 | 期待（データのつながり） | 照合キー | 判定 |
|---|---|---|---|---|---|---|
| DL-01 | #1 買い物かご→ご注文方法指定 | 同一受注の記録 | #2 ご注文方法指定→SPLINKS決済→注文完了 | 工程1で採番した注文番号と工程2の対象が同一であり、注文番号を工程間の実行記録で照合できること。 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770 | 注文番号=工程1で実際に採番した値を全工程で保持・記録（再シード不可） | 連鎖あり（HTML・業務フローの同一対象照合） |
| DL-02 | #1 買い物かご→ご注文方法指定 | 同一受注の記録 | #3 受注情報検索・一覧→送り状CSV出力 | 工程1で採番した注文番号と工程3の対象が同一であり、注文番号を工程間の実行記録で照合できること。 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770 | 注文番号=工程1で実際に採番した値を全工程で保持・記録（再シード不可） | 連鎖あり（HTML・業務フローの同一対象照合） |
| DL-03 | #1 買い物かご→ご注文方法指定 | 同一受注の記録 | #4 海外用ラベル生成マクロ→海外発送管理アプリ（EC-CUBE操作なし） | 工程1で採番した注文番号と工程4の対象が同一であり、注文番号を工程間の実行記録で照合できること。 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770 | 注文番号=工程1で実際に採番した値を全工程で保持・記録（再シード不可） | 連鎖あり（HTML・業務フローの同一対象照合） |
| DL-04 | #1 買い物かご→ご注文方法指定 | 同一受注の記録 | #5 出荷実績インポート登録 | 工程1で採番した注文番号と工程5の対象が同一であり、注文番号を工程間の実行記録で照合できること。 出典: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1545 / excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1546 / scenario_test/markdown/17_通販受注管理_tobe.md:36 / scenario_test/markdown/17_通販受注管理_tobe.md:39 / scenario_test/markdown/17_通販受注管理_tobe.md:48 / scenario_test/markdown/17_通販受注管理_tobe.md:55 / functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md:26 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4767 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4756 / excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:4770 | 注文番号=工程1で実際に採番した値を全工程で保持・記録（再シード不可） | 連鎖あり（HTML・業務フローの同一対象照合） |

## 完了条件（業務的ゴール／データ状態の最終確認）
- 同じ受注に出荷日と送り状No.が登録され、注文者へ英語の定型文の出荷完了メールが届いていることことを確認できること。
- 同じ案件の実IDを引き継ぎ、経路内の全工程の期待結果とデータ連鎖・別業務への引き継ぎが、各工程で指定した確認場所の原本と実測値に一致する。
- 必須判定に不合格がある場合は経路不合格とする。未実施・保留・証跡不足がある場合は経路を合格にしない。
- 別のデータパターン・代替分岐は別案件で実施して判定する。排他的な状態を一つの案件へ混在させない。

## システムテストカバレッジ
| 観点 | カバー |
|---|---|
| 正常系 | ○ |
| 代替系 | ○ |
| 異常系 | - |
| 外部連携 | ○ |
| データ更新 | ○ |
| CSV/帳票 | ○ |
| メール/通知 | ○ |

## エッジケース要約
| 件数 | 主なエッジケース | 確認対象 |
|---|---|---|
| 0 | 業務分岐なし（機構的異常系は他層委譲） | `## 他層委譲（結合テスト）` を参照 |

## 他層委譲（結合テスト）
権限・必須/形式・重複実行・0件検索は結合テスト層の機構的な確認に分担する。
現行正本 `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv` の操作・期待結果を照合した参照先を示す。
ケースの実在、実行準備、実行結果を区別する。対応未確認は対象機能の該当ケースを特定できない状態であり、適用外や試験済みとは扱わない。

| 機構的観点 | 委譲先IT観点 | 結合テストケースID | 状態 |
|---|---|---|---|
| 担当者に必要な権限がない（F04-01） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（F04-02） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（F04-04） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（M05-01） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（M05-07） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（M05-11） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 担当者に必要な権限がない（M05-26） | ITA-19 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 入力値の必須項目不足または形式不正がある（F04-01） | ITA-10 | `IT-F04-01-FRONT-CART-CART-INDEX-021`<br>`IT-F04-01-FRONT-CART-CART-INDEX-033` | 参照ケースあり・実行結果未確認 |
| 入力値の必須項目不足または形式不正がある（F04-02） | ITA-10 | `IT-F04-02-FRONT-CART-SHOPPING-ORDER-METHOD-021`<br>`IT-F04-02-FRONT-CART-SHOPPING-ORDER-METHOD-033` | 参照ケースあり・実行準備未確定 |
| 入力値の必須項目不足または形式不正がある（F04-04） | ITA-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 入力値の必須項目不足または形式不正がある（M05-01） | ITA-10 | `IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-038` | 参照ケースあり・実行準備未確定 |
| 入力値の必須項目不足または形式不正がある（M05-07） | ITA-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 入力値の必須項目不足または形式不正がある（M05-11） | ITA-10 | `IT-M05-11-ADMIN-ORDER-ORDER-EDIT-039`<br>`IT-M05-11-ADMIN-ORDER-ORDER-EDIT-051` | 参照ケースあり・実行結果未確認 |
| 入力値の必須項目不足または形式不正がある（M05-26） | ITA-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（F04-01） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（F04-02） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（F04-04） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（M05-01） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（M05-07） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（M05-11） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 同一対象に対して同じ処理を重複実行する（M05-26） | ITA-15 / ITA-17 / ITB-16 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 検索条件に一致する対象データが存在しない（F04-01） | ITA-08 | `IT-F04-01-FRONT-CART-CART-INDEX-074` | 参照ケースあり・実行結果未確認 |
| 検索条件に一致する対象データが存在しない（F04-02） | ITA-08 | `IT-F04-02-FRONT-CART-SHOPPING-ORDER-METHOD-065` | 参照ケースあり・実行準備未確定 |
| 検索条件に一致する対象データが存在しない（F04-04） | ITA-08 | `IT-F04-04-FRONT-CART-SHOPPING-COMPLETE-073` | 参照ケースあり・実行結果未確認 |
| 検索条件に一致する対象データが存在しない（M05-01） | ITA-08 / ITB-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 検索条件に一致する対象データが存在しない（M05-07） | ITA-08 / ITB-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 検索条件に一致する対象データが存在しない（M05-11） | ITA-08 / ITB-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |
| 検索条件に一致する対象データが存在しない（M05-26） | ITA-08 / ITB-10 | - | 対応未確認（現行正本に条件を実行するケースを特定できず。適用外とは断定しない） |

## トレーサビリティ
- **カバーする業務フロー番号**: 通販受注管理 / パターン915 / 経路1
- **期待する主要機能No**: M05-01, M05-04, M05-05, M05-07, M05-18, M05-19, M05-20, M05-21, M05-22, M05-23, M05-24, M05-26, M04-27, M04-29
- **シナリオに紐づく機能No**: F04-01, F04-02, F04-04, M05-01, M05-01, M05-07, M05-11, M05-26, M05-26
- **触れる画面と既存ケース**:
  | 画面 | 機能No | 機能仕様 | 既存ケース |
  |---|---|---|---|
  | F04-01（買い物かご） | F04-01 | `functions/pf-eccube3/f04-01_front_cart_cart_index.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（65件、機構別の該当IDは他層委譲表） |
  | ご注文方法指定 — 注文情報の入力・確認・注文 | F04-02 | `functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（57件、機構別の該当IDは他層委譲表） |
  | カート — 決済〜購入完了 | F04-04 | `functions/pf-eccube3/f04-04_front_cart_shopping_complete.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（57件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 受注情報検索・一覧 | M05-01 | `functions/pf-eccube3/m05-01_admin_order_order_search_list.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（50件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 受注情報検索・一覧 検索結果 | M05-01 | `functions/pf-eccube3/m05-01_admin_order_order_search_result.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（50件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 送り状CSV | M05-07 | `functions/pf-eccube3/m05-07_admin_order_order_labels_csv_export.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（47件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 受注情報編集 | M05-11 | `functions/pf-eccube3/m05-11_admin_order_order_edit.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（56件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 出荷実績登録CSVフォーマット | M05-26 | `functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_format.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（52件、機構別の該当IDは他層委譲表） |
  | 受注管理 — 出荷実績インポート登録 | M05-26 | `functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md` | `integration_test/manual_test_cases/ketsugo_manual_cases_active.tsv`（52件、機構別の該当IDは他層委譲表） |
- **関連HTML設計書**:
  - `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html`
  - `excel_to_html/output/0304_基本設計仕様書(フロント_注文).html`
- **関連テスト観点**: 業務フロー、業務経路（担当者・画面をまたぐ引き継ぎ）、最終業務状態、ステータス更新、CSV/帳票、メール、外部連携、DB更新。
- **本シナリオで実行しない観点**: 画面単位の遷移・バック・リロード・値引き継ぎ、および `## 他層委譲（結合テスト）` に挙げた機構的異常系。業務工程間で同じデータを引き渡す確認は本シナリオの対象とする。
