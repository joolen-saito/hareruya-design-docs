# m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-27 | JSON、コピー、スキーマ、入力JSON、出力失敗、削除、同名ファイル、実行結果、移動・リネーム、配置先 |
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、フォーム送信、一覧、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-26 | 実行結果、登録内容 |
| IT-23 | 実行結果 |
| IT-16 | ファイル選択、実行結果 |
| IT-17 | フォーマット定義 |
| IT-24 | 出力内容 |
| IT-33 | ファイル出力、ファイル登録 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-001	IT-27	出力失敗	P1	出力失敗の結合確認	同上だがチェックを1件も付けずに「入金CSV」を押すを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-002	IT-15	CSRF	P1	CSRFの結合確認	表示要素を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-003	IT-15	未認証	P1	未認証の結合確認	JS挙動を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	#csvexport_deposit クリック時、チェック済み件数が0ならアラート「CSV出力する買取注文情報をひとつ以上選択してくださいであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-004	IT-15	対象データ	P1	対象データの結合確認	CSS・レイアウトを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ドロップダウン表示のため、Bootstrapのドロップダウンに display:block !important を当てる回避スタイルがテンプレート内にあること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-005	IT-20	出力抑止	P1	出力抑止の結合確認	モーダル・ポップアップを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出力前の確認ダイアログはないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-006	IT-20	識別子	P1	識別子の結合確認	銀行名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	銀行口座マスタ上の銀行コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-007	IT-15	状態変化	P1	状態変化の結合確認	支店名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	銀行口座マスタ上の支店コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-008	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	オンライン本人確認区分を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. オンライン本人確認区分を確認する
3. 画面表示と後続状態を確認する"	プレイヤーに紐付く本人確認ステータスの日本語名称であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-009	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	M07-05-MSG-001を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. M07-05-MSG-001を確認する
3. 画面表示と後続状態を確認する"	買取検索/一覧画面に遷移すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	M07-05-MSG-002を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M07-05-MSG-002を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	POSTの買取注文IDが空を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. POSTの買取注文IDが空を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一部のIDだけ存在するを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一部のIDだけ存在するを確認する
3. 画面表示と後続状態を確認する"	存在する買取注文分だけCSVに行が出るであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	銀行口座または本人確認の結合行が取れないを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 銀行口座または本人確認の結合行が取れないを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	トランザクション境界を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ロックを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	例外時を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	同上だがチェックを1件も付けずに「入金CSV」を押すを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 同上だがチェックを1件も付けずに「入金CSV」を押すを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	表示要素を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-019	IT-22	部分入力	P2	部分入力の入力検証	JS挙動を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	#csvexport_deposit クリック時、チェック済み件数が0ならアラート「CSV出力する買取注文情報をひとつ以上選択してくださいであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-020	IT-26	登録内容	P1	登録時の登録内容確認	CSS・レイアウトを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-021	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-022	IT-26	登録内容	P1	登録時の登録内容確認	銀行名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-023	IT-26	登録内容	P1	登録時の登録内容確認	支店名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	銀行口座マスタ上の支店コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-024	IT-26	登録内容	P1	登録時の登録内容確認	オンライン本人確認区分を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-025	IT-26	登録内容	P1	登録時の登録内容確認	M07-05-MSG-001を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-026	IT-26	登録内容	P1	登録時の登録内容確認	M07-05-MSG-002を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-027	IT-26	登録内容	P1	登録時の登録内容確認	POSTの買取注文IDが空を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-028	IT-26	登録内容	P1	登録時の登録内容確認	一部のIDだけ存在するを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-029	IT-26	登録内容	P1	登録時の登録内容確認	銀行口座または本人確認の結合行が取れないを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-030	IT-26	実行結果	P1	登録時の実行結果確認	トランザクション境界を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-031	IT-23	実行結果	P1	登録時の実行結果確認	ロックを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	行ロック・悲観ロック・楽観ロック・ロックファイルを使用しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-032	IT-16	実行結果	P2	実行結果の結合確認	例外時を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-033	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	同上だがチェックを1件も付けずに「入金CSV」を押すを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でフォーマット定義で対象条件に該当する値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-034	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	表示要素を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でフォーマット定義で対象条件に該当しない値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示され、対象処理が完了しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-035	IT-27	実行結果	P2	実行結果の結合確認	JS挙動を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-036	IT-27	実行結果	P2	実行結果の結合確認	CSS・レイアウトを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-037	IT-24	出力内容	P2	出力内容の結合確認	モーダル・ポップアップを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-038	IT-24	出力内容	P2	出力内容の結合確認	銀行名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-039	IT-24	出力内容	P2	出力内容の結合確認	支店名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-040	IT-24	出力内容	P2	出力内容の結合確認	オンライン本人確認区分を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-041	IT-24	出力内容	P2	出力内容の結合確認	M07-05-MSG-001を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容でエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-042	IT-27	削除	P1	削除の結合確認	M07-05-MSG-002を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で削除の対象ファイルと処理条件を指定する	"1. 対象画面で削除のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	削除の該当レコードが取得結果に含まれないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-043	IT-27	移動・リネーム	P2	移動・リネームの結合確認	POSTの買取注文IDが空を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で移動・リネームの対象ファイルと処理条件を指定する	"1. 対象画面で移動・リネームのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	移動・リネームの該当レコードが取得結果に含まれないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-044	IT-27	コピー	P1	コピーの結合確認	一部のIDだけ存在するを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でコピーの対象ファイルと処理条件を指定する	"1. 対象画面でコピーのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	コピーのファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-045	IT-33	ファイル登録	P1	ファイル登録の結合確認	銀行口座または本人確認の結合行が取れないを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でファイル登録の対象ファイルと処理条件を指定する	"1. 対象画面でファイル登録のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル登録のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-046	IT-33	ファイル出力	P1	ファイル出力の結合確認	トランザクション境界を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でファイル出力の対象ファイルと処理条件を指定する	"1. 対象画面でファイル出力のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル出力のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-047	IT-27	JSON	P1	JSONの結合確認	ロックを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でJSONの対象ファイルと処理条件を指定する	"1. 対象画面でJSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	JSONのファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-048	IT-27	同名ファイル	P1	同名ファイルの結合確認	例外時を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で同名ファイルの対象ファイルと処理条件を指定する	"1. 対象画面で同名ファイルのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	同名ファイルのファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-049	IT-27	入力JSON	P1	入力JSONの結合確認	同上だがチェックを1件も付けずに「入金CSV」を押すを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で入力JSONの対象ファイルと処理条件を指定する	"1. 対象画面で入力JSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	入力JSONの対象レコードの値が変更されないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-050	IT-27	配置先	P1	配置先の結合確認	表示要素を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で配置先の対象ファイルと処理条件を指定する	"1. 対象画面で配置先のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	配置先の該当レコードが取得結果に含まれること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-051	IT-27	スキーマ	P1	スキーマの結合確認	JS挙動を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でスキーマの対象ファイルと処理条件を指定する	"1. 対象画面でスキーマのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	スキーマのファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-052	IT-02	初期行数	P2	初期行数の結合確認	CSS・レイアウトを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で初期行数の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	ドロップダウン表示のため、Bootstrapのドロップダウンに display:block !important を当てる回避スタイルがテンプレート内にあること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-053	IT-02	表示順	P2	表示順の結合確認	モーダル・ポップアップを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で表示順の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	出力前の確認ダイアログはないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-054	IT-25	更新抑止	P1	更新抑止の結合確認	銀行名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で更新抑止の対象ファイルと処理条件を指定する	"1. 対象画面で更新抑止のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	更新抑止のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-055	IT-12	内部情報	P1	内部情報の結合確認	支店名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で内部情報の対象ファイルと処理条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	銀行口座マスタ上の支店コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-056	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	オンライン本人確認区分を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. オンライン本人確認区分を確認する
3. 画面表示と後続状態を確認する"	プレイヤーに紐付く本人確認ステータスの日本語名称であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-057	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M07-05-MSG-001を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. M07-05-MSG-001を確認する
3. 画面表示と後続状態を確認する"	買取検索/一覧画面に遷移すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-058	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	M07-05-MSG-002を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. M07-05-MSG-002を確認する
3. 画面表示と後続状態を確認する"	買取検索/一覧画面に遷移すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-059	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	POSTの買取注文IDが空を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POSTの買取注文IDが空を確認する
3. 画面表示と後続状態を確認する"	エラーメッセージをフラッシュし、買取一覧のページへリダイレクトであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-060	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	一部のIDだけ存在するを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一部のIDだけ存在するを確認する
3. 画面表示と後続状態を確認する"	存在する買取注文分だけCSVに行が出るであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-061	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	銀行口座または本人確認の結合行が取れないを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 銀行口座または本人確認の結合行が取れないを確認する
3. 画面表示と後続状態を確認する"	該当買取注文行の銀行列・本人確認列は空文字であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-062	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	トランザクション境界を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	本機能は参照・出力を主とし、業務データ更新用の明示トランザクションを開始しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-063	IT-25	一覧	P2	一覧の結合確認	ロックを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で一覧の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	行ロック・悲観ロック・楽観ロック・ロックファイルを使用しないこと。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-064	IT-12	画面表示データ	P2	画面表示データの結合確認	例外時を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-065	IT-25	画面表示データ	P2	画面表示データの結合確認	同上だがチェックを1件も付けずに「入金CSV」を押すを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 同上だがチェックを1件も付けずに「入金CSV」を押すを確認する
3. 画面表示と後続状態を確認する"	一覧のJSが未選択を検知し、アラートを出して送信を抑止すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-066	IT-12	画面表示データ	P2	画面表示データの結合確認	表示要素を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-067	IT-25	画面表示データ	P2	画面表示データの結合確認	JS挙動を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	#csvexport_deposit クリック時、チェック済み件数が0ならアラート「CSV出力する買取注文情報をひとつ以上選択してくださいであること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-068	IT-25	フォーム送信	P1	フォーム送信の結合確認	CSS・レイアウトを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でフォーム送信の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	ドロップダウン表示のため、Bootstrapのドロップダウンに display:block !important を当てる回避スタイルがテンプレート内にあること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-069	IT-16	ファイル選択	P2	ファイル選択の結合確認	モーダル・ポップアップを試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でファイル選択の対象ファイルと処理条件を指定する	"1. 対象画面でファイル選択のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル選択のファイル出力内容または取り込み結果が対象データと一致すること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-070	IT-12	非同期更新	P1	非同期更新の結合確認	銀行名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で非同期更新の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 銀行名を確認する
3. 画面表示と後続状態を確認する"	銀行口座マスタ上の銀行コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-071	IT-12	エラー継続	P3	エラー継続の結合確認	支店名を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）でエラー継続の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 支店名を確認する
3. 画面表示と後続状態を確認する"	銀行口座マスタ上の支店コード文字列であること。
m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）	IT-M07-05-ADMIN-ONLINE-PURCHASE-PURCHASE-CSV-EXPORT-DEPOSIT-072	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	オンライン本人確認区分を試験できる状態である	m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV）（m07_05_admin_online_purchase_purchase_csv_export_deposit）で公開コンテンツの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. オンライン本人確認区分を確認する
3. 画面表示と後続状態を確認する"	プレイヤーに紐付く本人確認ステータスの日本語名称であること。
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
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 本機能に更新処理がないため |
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
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はメール送信を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
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
| ウェブアプリケーション / 一覧 / ページング（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 非同期連携 / 通知引渡し（IT-08） | 本機能は対象の外部I/Fを扱わないため |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 8件 — No.109, No.110, No.111, No.412, No.413, No.414, No.415, No.510。上限緩和または個別ケース化で収載可能。
