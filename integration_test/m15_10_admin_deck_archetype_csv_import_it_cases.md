# m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m15-10_admin_deck_archetype_csv_import.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-27 | JSON、コピー、入力JSON、出力失敗、削除、同名ファイル、実行結果、移動・リネーム、配置先 |
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-16 | 実行結果 |
| IT-17 | フォーマット定義 |
| IT-24 | 出力内容 |
| IT-33 | ファイル出力、ファイル登録 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-001	IT-27	出力失敗	P1	出力失敗の結合確認	サイドバー「デッキ管理」「アーキタイプ一覧」で一覧を開き、画面上部の CSV …を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-002	IT-15	CSRF	P1	CSRFの結合確認	一覧画面をブックマークせず、GET /.../csvimport を直接開くを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-003	IT-15	未認証	P1	未認証の結合確認	ソース上バインドのみ存在するを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ソース上バインドのみ存在すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-004	IT-15	対象データ	P1	対象データの結合確認	表示要素を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	画面上部に単一のアップロードフォーム、その下に「アーキタイプ登録 CSV, TSVファイルフォーマット」としてヘッダ 6 列のサンプル行を表示すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-005	IT-20	出力抑止	P1	出力抑止の結合確認	JS 挙動を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	card-csvimport.js がフォーム送信時に送信ボタンを無効化し、#spinner にスピナーを表示すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-006	IT-20	識別子	P1	識別子の結合確認	モーダル・ポップアップを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	取込前の確認モーダルはないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-007	IT-15	状態変化	P1	状態変化の結合確認	UPSERT のキーを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	日本語名・英語名・フォーマット・論理削除でないことを条件に検索した 1 行を更新単位とすること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-008	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示区分を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示区分を確認する
3. 画面表示と後続状態を確認する"	CSV 処理のたびに「表示」を表す値（dtb_archetype の disp、コア側表示区分マスタにおける整数定数 DISPLAY_SHOW と一致する参照へ）へ上書きすること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-009	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	説明文などを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 説明文などを確認する
3. 画面表示と後続状態を確認する"	CSV 経路では comment_jp、comment_en、デッキタグ、記事紐付けは更新しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-010	IT-25	URL	P2	URLの操作結果確認	CSV, TSVファイル選択を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV, TSVファイル選択
3. 画面表示と後続状態を確認する"	一時パスへ移動されたうえで CsvImportService に渡され、処理後の render で一時ファイルは削除試行されるであること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	ヘッダ行は正しいが列の順のみ入れ替わっているを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ヘッダ行は正しいが列の順のみ入れ替わっているを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-012	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	プラグイン無効やルート未登録で admin_route 配下に到達しないを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. プラグイン無効やルート未登録で admin_route 配下に到達しないを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-013	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧との一致を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	UPSERT と同一トランザクションで一覧 API が読むときは一覧・詳細側と一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	削除済みとの関係を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 削除済みとの関係
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSV と画面編集との混在を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. CSV と画面編集との混在を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-017	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	失敗時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	副作用を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-019	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. dtb_archetypeを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-020	IT-22	部分入力	P2	部分入力の入力検証	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. dtb_archetypeを確認する
3. 画面表示と後続状態を確認する"	代表カード名が与えられるときのみ更新し得るであること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-021	IT-23	検索条件	P2	検索時の検索条件確認	dtb_archetype_colorを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-022	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-023	IT-23	検索条件	P2	検索時の検索条件確認	フォーム入力・CSRF・アップロード制約に違反を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-024	IT-23	検索条件	P2	検索時の検索条件確認	フォーマット名や色がマスタに無いを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-025	IT-23	検索条件	P2	検索時の検索条件確認	送信取込処理の開始時を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-026	IT-23	検索条件	P2	検索時の検索条件確認	すべて成功終了後を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-027	IT-23	検索条件	P2	検索時の検索条件確認	サイドバー「デッキ管理」「アーキタイプ一覧」で一覧を開き、画面上部の CSV …を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-028	IT-23	検索条件	P2	検索時の検索条件確認	一覧画面をブックマークせず、GET /.../csvimport を直接開くを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-029	IT-23	検索条件	P2	検索時の検索条件確認	ソース上バインドのみ存在するを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-030	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-031	IT-23	検索条件	P2	検索時の検索条件確認	JS 挙動を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-032	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-033	IT-23	検索条件	P2	検索時の検索条件確認	UPSERT のキーを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-034	IT-23	検索条件	P2	検索時の検索条件確認	表示区分を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-035	IT-23	実行結果	P2	検索時の実行結果確認	説明文などを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-036	IT-23	実行結果	P2	検索時の実行結果確認	CSV, TSVファイル選択を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-037	IT-23	実行結果	P2	検索時の実行結果確認	ヘッダ行は正しいが列の順のみ入れ替わっているを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-038	IT-23	実行結果	P2	検索時の実行結果確認	プラグイン無効やルート未登録で admin_route 配下に到達しないを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-039	IT-26	登録内容	P1	登録時の登録内容確認	一覧との一致を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-040	IT-26	登録内容	P1	登録時の登録内容確認	削除済みとの関係を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-041	IT-26	登録内容	P1	登録時の登録内容確認	CSV と画面編集との混在を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-042	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 302 で GET /{admin_route}/archetype/csvimport へのリダイレクトと、共通成功フラッシュであること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-043	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-044	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-045	IT-26	登録内容	P1	登録時の登録内容確認	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-046	IT-26	登録内容	P1	登録時の登録内容確認	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-047	IT-26	登録内容	P1	登録時の登録内容確認	dtb_archetype_colorを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-048	IT-26	登録内容	P1	登録時の登録内容確認	登録/更新を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-049	IT-26	実行結果	P1	登録時の実行結果確認	フォーム入力・CSRF・アップロード制約に違反を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-050	IT-23	実行結果	P1	登録時の実行結果確認	フォーマット名や色がマスタに無いを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	翻訳付き実行時例外（行番号入りパターン）でロールバックしフラッシュ表示であること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-051	IT-26	更新内容	P1	更新時の更新内容確認	送信取込処理の開始時を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-052	IT-26	更新内容	P1	更新時の更新内容確認	すべて成功終了後を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-053	IT-26	更新内容	P1	更新時の更新内容確認	サイドバー「デッキ管理」「アーキタイプ一覧」で一覧を開き、画面上部の CSV …を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-054	IT-26	更新内容	P1	更新時の更新内容確認	一覧画面をブックマークせず、GET /.../csvimport を直接開くを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧の検索条件は引き継がれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-055	IT-26	更新内容	P1	更新時の更新内容確認	ソース上バインドのみ存在するを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-056	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-057	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-058	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-059	IT-26	更新内容	P1	更新時の更新内容確認	UPSERT のキーを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-060	IT-26	更新内容	P1	更新時の更新内容確認	表示区分を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-061	IT-05	実行結果	P1	更新時の実行結果確認	説明文などを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-062	IT-05	実行結果	P1	更新時の実行結果確認	CSV, TSVファイル選択を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一時パスへ移動されたうえで CsvImportService に渡され、処理後の render で一時ファイルは削除試行されるであること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-063	IT-05	削除条件	P1	削除時の削除条件確認	ヘッダ行は正しいが列の順のみ入れ替わっているを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	文字列完全一致のためヘッダ形式エラーとなること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-064	IT-05	削除条件	P1	削除時の削除条件確認	プラグイン無効やルート未登録で admin_route 配下に到達しないを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 側のふるまいは共通セキュリティ設定に依存し、本書では確定しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-065	IT-05	削除条件	P1	削除時の削除条件確認	一覧との一致を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	UPSERT と同一トランザクションで一覧 API が読むときは一覧・詳細側と一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-066	IT-05	削除条件	P1	削除時の削除条件確認	削除済みとの関係を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除済み行との名前重複検出はしないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-067	IT-05	削除条件	P1	削除時の削除条件確認	CSV と画面編集との混在を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除条件の対象ファイルと処理条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-068	IT-05	実行結果	P1	削除時の実行結果確認	成功時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-069	IT-05	実行結果	P1	削除時の実行結果確認	失敗時出力を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同上のリダイレクトに対しフラッシュ種別エラーの短文列であること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-070	IT-05	実行結果	P1	削除時の実行結果確認	副作用を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-071	IT-05	実行結果	P1	削除時の実行結果確認	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	値は常に CSV 側から表示状態へ張り替えであること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-072	IT-16	実行結果	P2	実行結果の結合確認	dtb_archetypeを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-073	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	dtb_archetype_colorを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でフォーマット定義で対象条件に該当する値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-074	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	登録/更新を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でフォーマット定義で対象条件に該当しない値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示され、対象処理が完了しないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-075	IT-27	実行結果	P2	実行結果の結合確認	フォーム入力・CSRF・アップロード制約に違反を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-076	IT-27	実行結果	P2	実行結果の結合確認	フォーマット名や色がマスタに無いを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-077	IT-24	出力内容	P2	出力内容の結合確認	送信取込処理の開始時を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-078	IT-24	出力内容	P2	出力内容の結合確認	すべて成功終了後を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-079	IT-24	出力内容	P2	出力内容の結合確認	サイドバー「デッキ管理」「アーキタイプ一覧」で一覧を開き、画面上部の CSV …を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-080	IT-24	出力内容	P2	出力内容の結合確認	一覧画面をブックマークせず、GET /.../csvimport を直接開くを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-081	IT-24	出力内容	P2	出力内容の結合確認	ソース上バインドのみ存在するを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容でエラーが表示されず、対象処理を継続できること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-082	IT-27	削除	P1	削除の結合確認	表示要素を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で削除の対象ファイルと処理条件を指定する	"1. 対象画面で削除のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	削除の該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-083	IT-27	移動・リネーム	P2	移動・リネームの結合確認	JS 挙動を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で移動・リネームの対象ファイルと処理条件を指定する	"1. 対象画面で移動・リネームのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	移動・リネームの該当レコードが取得結果に含まれないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-084	IT-27	コピー	P1	コピーの結合確認	モーダル・ポップアップを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でコピーの対象ファイルと処理条件を指定する	"1. 対象画面でコピーのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	コピーのファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-085	IT-33	ファイル登録	P1	ファイル登録の結合確認	UPSERT のキーを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でファイル登録の対象ファイルと処理条件を指定する	"1. 対象画面でファイル登録のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル登録のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-086	IT-33	ファイル出力	P1	ファイル出力の結合確認	表示区分を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でファイル出力の対象ファイルと処理条件を指定する	"1. 対象画面でファイル出力のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル出力のファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-087	IT-27	JSON	P1	JSONの結合確認	説明文などを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）でJSONの対象ファイルと処理条件を指定する	"1. 対象画面でJSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	JSONのファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-088	IT-27	同名ファイル	P1	同名ファイルの結合確認	CSV, TSVファイル選択を試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で同名ファイルの対象ファイルと処理条件を指定する	"1. 対象画面で同名ファイルのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	同名ファイルのファイル出力内容または取り込み結果が対象データと一致すること。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-089	IT-27	入力JSON	P1	入力JSONの結合確認	ヘッダ行は正しいが列の順のみ入れ替わっているを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で入力JSONの対象ファイルと処理条件を指定する	"1. 対象画面で入力JSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	入力JSONの対象レコードの値が変更されないこと。
m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）	IT-M15-10-ADMIN-DECK-ARCHETYPE-CSV-IMPORT-090	IT-27	配置先	P1	配置先の結合確認	プラグイン無効やルート未登録で admin_route 配下に到達しないを試験できる状態である	m15-10_admin_deck_archetype_csv_import（デッキ管理 — アーキタイプ登録 CSV / TSV 取込）（m15_10_admin_deck_archetype_csv_import）で配置先の対象ファイルと処理条件を指定する	"1. 対象画面で配置先のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	配置先の該当レコードが取得結果に含まれること。
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
| ウェブアプリケーション / 一覧 / ページング（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 非同期連携 / 通知引渡し（IT-08） | 本機能は対象の外部I/Fを扱わないため |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 29件 — No.109, No.110, No.111, No.214, No.329, No.330, No.332, No.333, No.334, No.336, No.338, No.346, No.356, No.357, No.358, No.359, No.381, No.382, No.385, No.387, No.412, No.413, No.414, No.416, No.420, No.421, No.505, No.507, No.510。上限緩和または個別ケース化で収載可能。
