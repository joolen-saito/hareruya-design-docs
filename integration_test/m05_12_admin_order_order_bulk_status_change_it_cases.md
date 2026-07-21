# m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、フォーム送信、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |
| IT-11 | 実行結果 |
| IT-28 | ヘッダ、件名、実行結果、本文 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-001	IT-15	CSRF	P1	CSRFの結合確認	対応状況を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注の進行状態を表す区分であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-002	IT-15	未認証	P1	未認証の結合確認	出荷を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で出荷の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注配下の発送単位であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-003	IT-15	対象データ	P1	対象データの結合確認	対応状況プルダウンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況プルダウンの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧上部の変更先選択セレクトであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-004	IT-20	出力抑止	P1	出力抑止の結合確認	状態遷移ルールを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で状態遷移ルールの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ある対応状況から別の対応状況へ変更できる組み合わせの定義であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-005	IT-20	識別子	P1	識別子の結合確認	確認モーダルを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で確認モーダルの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	決定ボタン押下後に表示され、進捗バーと結果一覧を出すダイアログであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-006	IT-15	状態変化	P1	状態変化の結合確認	一括対象を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括対象の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	チェックを入れた出荷行の集合であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	受注一覧画面を開くを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で受注一覧画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注一覧画面を開く
3. 画面表示と後続状態を確認する"	出荷行ごとのチェックボックス、対応状況プルダウン、決定ボタンを含む一覧を表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	対応状況プルダウンで変更先を選び決定ボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況プルダウンで変更先を選び決定ボタンを押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況プルダウンで変更先を選び決定ボタンを押すを確認する
3. 画面表示と後続状態を確認する"	変更先が未選択なら警告を出して中断すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-009	IT-25	URL	P2	URLの操作結果確認	一括変更の各出荷の更新（画面側からの順次呼び出し）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括変更の各出荷の更新（画面側からの順次呼び出し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括変更の各出荷の更新（画面側からの順次呼び出し）を確認する
3. 画面表示と後続状態を確認する"	出荷IDごとに、変更先の対応状況IDを送信すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	変更完了後に閉じるボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 変更完了後に閉じるボタンを押すを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	非管理者・未認証を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	一覧の各出荷行の左端にチェックボックスを表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動（選択）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動（選択）
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動（決定）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動（決定）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動（順次送信）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS 挙動（順次送信）
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動（完了）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. JS 挙動（完了）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	メール送信欄を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メール送信欄
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	CSS・レイアウトを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-019	IT-22	部分入力	P2	部分入力の入力検証	モーダル・ポップアップを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	確認モーダルを表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-020	IT-23	検索条件	P2	検索時の検索条件確認	入力項目を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-021	IT-23	検索条件	P2	検索時の検索条件確認	一括操作見出しを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-022	IT-23	検索条件	P2	検索時の検索条件確認	プルダウン初期行を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-023	IT-23	検索条件	P2	検索時の検索条件確認	決定ボタンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-024	IT-23	検索条件	P2	検索時の検索条件確認	モーダル処理中を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-025	IT-23	検索条件	P2	検索時の検索条件確認	モーダル完了を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-026	IT-23	検索条件	P2	検索時の検索条件確認	閉じるボタンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-027	IT-23	検索条件	P2	検索時の検索条件確認	対応状況を選択してくださいを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-028	IT-23	検索条件	P2	検索時の検索条件確認	システムエラーが発生しましたを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でシステムエラーが発生しましたの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-029	IT-23	検索条件	P2	検索時の検索条件確認	一部の出荷だけがスキップ・遷移不可だったを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一部の出荷だけがスキップ・遷移不可だったの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-030	IT-23	検索条件	P2	検索時の検索条件確認	遷移可否を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で遷移可否の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-031	IT-23	検索条件	P2	検索時の検索条件確認	在庫・ポイントの調整を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で在庫・ポイントの調整の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-032	IT-23	検索条件	P2	検索時の検索条件確認	会員集計の更新を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で会員集計の更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-033	IT-23	検索条件	P2	検索時の検索条件確認	メール送信を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でメール送信の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-034	IT-23	実行結果	P2	検索時の実行結果確認	計算の有無を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で計算の有無の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-035	IT-23	実行結果	P2	検索時の実行結果確認	チェックを1件も入れずに決定ボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でチェックを1件も入れずに決定ボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-036	IT-23	実行結果	P2	検索時の実行結果確認	変更先プルダウンが未選択を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更先プルダウンが未選択の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-037	IT-23	実行結果	P2	検索時の実行結果確認	変更先が現在の対応状況と同一を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更先が現在の対応状況と同一の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-038	IT-26	登録内容	P1	登録時の登録内容確認	遷移できない組み合わせを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で遷移できない組み合わせの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-039	IT-26	登録内容	P1	登録時の登録内容確認	変更先の対応状況IDが存在しないを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更先の対応状況IDが存在しないの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-040	IT-26	登録内容	P1	登録時の登録内容確認	XHR以外のリクエスト、またはトークン不正を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でXHR以外のリクエスト、またはトークン不正の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-041	IT-26	登録内容	P1	登録時の登録内容確認	対応状況を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注の進行状態を表す区分であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-042	IT-26	登録内容	P1	登録時の登録内容確認	出荷を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で出荷の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-043	IT-26	登録内容	P1	登録時の登録内容確認	対応状況プルダウンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-044	IT-26	登録内容	P1	登録時の登録内容確認	状態遷移ルールを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-045	IT-26	登録内容	P1	登録時の登録内容確認	確認モーダルを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-046	IT-26	登録内容	P1	登録時の登録内容確認	一括対象を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-047	IT-26	登録内容	P1	登録時の登録内容確認	受注一覧画面を開くを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で受注一覧画面を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-048	IT-26	実行結果	P1	登録時の実行結果確認	対応状況プルダウンで変更先を選び決定ボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況プルダウンで変更先を選び決定ボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-049	IT-23	実行結果	P1	登録時の実行結果確認	一括変更の各出荷の更新（画面側からの順次呼び出し）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括変更の各出荷の更新（画面側からの順次呼び出し）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷IDごとに、変更先の対応状況IDを送信すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-050	IT-26	更新内容	P1	更新時の更新内容確認	変更完了後に閉じるボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更完了後に閉じるボタンを押すの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-051	IT-26	更新内容	P1	更新時の更新内容確認	非管理者・未認証を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で非管理者・未認証の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-052	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-053	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動（選択）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でJS 挙動（選択）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	チェックボックスが1件以上選択されたとき一括操作領域を表示し、0件のとき隠すであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-054	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動（決定）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でJS 挙動（決定）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-055	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動（順次送信）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-056	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動（完了）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-057	IT-26	更新内容	P1	更新時の更新内容確認	メール送信欄を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-058	IT-26	更新内容	P1	更新時の更新内容確認	CSS・レイアウトを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-059	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-060	IT-05	実行結果	P1	更新時の実行結果確認	入力項目を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で入力項目の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-061	IT-05	実行結果	P1	更新時の実行結果確認	一括操作見出しを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括操作見出しの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	1件以上チェックしたとき一括操作領域に表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-062	IT-02	初期行数	P2	初期行数の結合確認	プルダウン初期行を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でプルダウン初期行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. プルダウン初期行を確認する
3. 画面表示と後続状態を確認する"	変更先未選択時にプルダウンへ表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-063	IT-02	表示順	P2	表示順の結合確認	決定ボタンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で決定ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 決定ボタンを確認する
3. 画面表示と後続状態を確認する"	一括操作領域に常時表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-064	IT-25	更新抑止	P1	更新抑止の結合確認	モーダル処理中を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でモーダル処理中の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一括変更の送信中にモーダル本文へ表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-065	IT-12	内部情報	P1	内部情報の結合確認	モーダル完了を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でモーダル完了の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	全件の送信が終わったときモーダル本文へ表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-066	IT-15	機密情報	P1	機密情報の結合確認	閉じるボタンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で閉じるボタンの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	完了後に表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-067	IT-07	排他制御	P1	排他制御の結合確認	対応状況を選択してくださいを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況を選択してくださいの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	サーバへ送信せず中断すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-068	IT-07	排他制御	P1	排他制御の結合確認	システムエラーが発生しましたを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でシステムエラーが発生しましたの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ロケールキーadmin.common.system_errorであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-069	IT-06	ロールバック	P3	ロールバックの結合確認	一部の出荷だけがスキップ・遷移不可だったを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一部の出荷だけがスキップ・遷移不可だったの確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当該出荷について注意行を結果一覧へ追記すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-070	IT-11	実行結果	P2	実行結果の結合確認	遷移可否を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で遷移可否の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 遷移可否を確認する
3. 画面表示と後続状態を確認する"	状態遷移ルールで許可された組み合わせのみ変更すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-071	IT-28	実行結果	P2	実行結果の結合確認	在庫・ポイントの調整を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で在庫・ポイントの調整の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫・ポイントの調整を確認する
3. 画面表示と後続状態を確認する"	状態遷移に伴い在庫の戻し・引き当て、ポイントの調整がワークフローの遷移処理で行われるであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-072	IT-28	実行結果	P2	実行結果の結合確認	会員集計の更新を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で会員集計の更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 会員集計の更新を確認する
3. 画面表示と後続状態を確認する"	受注に会員がひもづくとき、変更後に会員の購入回数・購入金額などの集計を更新すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-073	IT-28	ヘッダ	P2	ヘッダの結合確認	メール送信を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でメール送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. メール送信
3. 画面表示と後続状態を確認する"	一括の対応状況変更ではメールを送らないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-074	IT-28	件名	P2	件名の結合確認	計算の有無を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 計算の有無を確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-075	IT-28	件名	P2	件名の結合確認	チェックを1件も入れずに決定ボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. チェックを1件も入れずに決定ボタンを押すを確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-076	IT-28	件名	P2	件名の結合確認	変更先プルダウンが未選択を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更先プルダウンが未選択の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更先プルダウンが未選択
3. 画面表示と後続状態を確認する"	警告を出し、サーバへ送信せず中断すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-077	IT-28	本文	P2	本文の結合確認	変更先が現在の対応状況と同一を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 変更先が現在の対応状況と同一を確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-078	IT-28	本文	P2	本文の結合確認	遷移できない組み合わせを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 遷移できない組み合わせを確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-079	IT-28	本文	P2	本文の結合確認	変更先の対応状況IDが存在しないを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更先の対応状況IDが存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更先の対応状況IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	当該出荷の更新は異常応答（HTTP400）となり、結果一覧へシステムエラーを表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-080	IT-28	本文	P2	本文の結合確認	XHR以外のリクエスト、またはトークン不正を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でXHR以外のリクエスト、またはトークン不正の確認に必要な条件を指定する	"1. 対象画面を表示する
2. XHR以外のリクエスト、またはトークン不正を確認する
3. 画面表示と後続状態を確認する"	当該出荷の更新は異常応答（HTTP400）となること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-081	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	対応状況を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況を確認する
3. 画面表示と後続状態を確認する"	受注の進行状態を表す区分であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-082	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	出荷を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で出荷の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷を確認する
3. 画面表示と後続状態を確認する"	受注配下の発送単位であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-083	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	対応状況プルダウンを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で対応状況プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況プルダウンを確認する
3. 画面表示と後続状態を確認する"	一覧上部の変更先選択セレクトであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-084	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	状態遷移ルールを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で状態遷移ルールの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 状態遷移ルールを確認する
3. 画面表示と後続状態を確認する"	ある対応状況から別の対応状況へ変更できる組み合わせの定義であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-085	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	確認モーダルを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で確認モーダルの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認モーダルを確認する
3. 画面表示と後続状態を確認する"	決定ボタン押下後に表示され、進捗バーと結果一覧を出すダイアログであること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-086	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	一括対象を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括対象の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括対象を確認する
3. 画面表示と後続状態を確認する"	チェックを入れた出荷行の集合であること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-087	IT-12	画面表示データ	P2	画面表示データの結合確認	一括変更の各出荷の更新（画面側からの順次呼び出し）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で一括変更の各出荷の更新（画面側からの順次呼び出し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括変更の各出荷の更新（画面側からの順次呼び出し）を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-088	IT-25	画面表示データ	P2	画面表示データの結合確認	変更完了後に閉じるボタンを押すを試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で変更完了後に閉じるボタンを押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更完了後に閉じるボタンを押すを確認する
3. 画面表示と後続状態を確認する"	受注一覧へ戻り、検索条件をセッションから復旧して再表示すること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-089	IT-12	画面表示データ	P2	画面表示データの結合確認	非管理者・未認証を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）	IT-M05-12-ADMIN-ORDER-ORDER-BULK-STATUS-CHANGE-090	IT-25	フォーム送信	P1	フォーム送信の結合確認	JS 挙動（選択）を試験できる状態である	m05-12_admin_order_order_bulk_status_change（管理画面_受注管理_対応状況一括変更）（m05_12_admin_order_order_bulk_status_change）でJS 挙動（選択）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動（選択）
3. 画面表示と後続状態を確認する"	チェックボックスが1件以上選択されたとき一括操作領域を表示し、0件のとき隠すであること。
```

## テスト層による母集合除外（結合テスト対象外）

結合テスト観点マスタは各観点に「テスト層」を付与し、**結合層のみ**を機能×観点のクロス積対象とする。以下の層は本結合テストの母集合から除外し、それぞれの行き先で担保する（除外の根拠はマスタ `integration_test/integration-test-viewpoints.md` のテスト層列）。

| テスト層 | 除外観点数 | 行き先 |
|---|---:|---|
| UT | 108 | 単体テスト粒度（単項目境界値・単機能ロジック）→単体テストで担保。表内に保持しマーク。 |
| 委譲 | 143 | 期待値を設計書へ委譲（「記載通り」）→機能別チェックリストへ降格。per機能で設計書の具体値を引用してケース化。 |
| e2e | 33 | 見た目／ブラウザ挙動→e2e（Playwright）＋手動で担保。 |
| 非機能 | 5 | 方式／性能／基盤（ロック方式・リトライ間隔・MQクラスタ・レート制限等）→非機能・障害試験へ分離。 |
| 対象外 | 1 | 合否オラクルを持たない管理・スコーピング指示→テスト観点ではないため除外。 |
| 統合 | 6 | 他観点に統合吸収済み（冗長削除）。統合先が同一バグクラスを検出するため重複クロス積を回避。行は監査用に保持しクロス積からのみ除外（codex+fable5承認）。 |

## 対象外観点（結合層のうち本機能に非該当）

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
| データベースアクセス / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 増加処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 減少処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 実数反映（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 按分処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 更新履歴（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 算出値表示（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 調整 / 減少理由（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 通知 / 復活通知（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動開始（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動完了（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 例外処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 区分変更（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 結合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 正常終了（IT-09） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / バッチ / 異常終了（IT-10） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / フロント / 外部キャッシュ（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / フロント / 外部取得（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 抽出条件（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 正常応答（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 認証・認可（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 決済連携 / 外部決済（IT-10） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 決済連携 / 二重実行（IT-08） | 本機能はバッチ処理を起動しないため |
| ウェブアプリケーション / 決済連携 / 状態表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 決済連携 / 金額整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / Webhook・外部通知（IT-10, IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 下流転送（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| データベースアクセス / 在庫引当 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 在庫引当 / 競合（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 注文・決済・在庫 / 原子性（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 状態遷移 / 遷移可否（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 買取・査定 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額計算 / 税・端数（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / 時刻境界 / 日時切替（IT-30） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / 冪等・再処理 / 冪等キー（IT-08） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / ポイント / ライフサイクル（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 販売価格 / 価格改定（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| その他 | 同種の対象外観点 2 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 10件 — No.338, No.346, No.359, No.382, No.385, No.387, No.412, No.413, No.414, No.416。上限緩和または個別ケース化で収載可能。
