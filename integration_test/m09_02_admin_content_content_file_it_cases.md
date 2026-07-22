# m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m09-02_admin_content_content_file.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-27 | JSON、コピー、スキーマ、入力JSON、出力失敗、削除、同名ファイル、実行結果、移動・リネーム、配置先 |
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
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
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-001	IT-27	出力失敗	P1	出力失敗の結合確認	カレントディレクトリを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-002	IT-15	CSRF	P1	CSRFの結合確認	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-003	IT-15	未認証	P1	未認証の結合確認	jailパスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	画面表示やリンクに使う、user_data領域の絶対パスを取り除いた相対表現であること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-004	IT-15	対象データ	P1	対象データの結合確認	ファイル管理画面を開くを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	user_data領域を起点に、カレントディレクトリのファイル・フォルダ一覧、ディレクトリツリー、パンくずを表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-005	IT-20	出力抑止	P1	出力抑止の結合確認	フォルダへ移動を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	選択したフォルダをカレントディレクトリとして同画面を再表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-006	IT-20	識別子	P1	識別子の結合確認	ファイルをアップロードを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	mode=uploadで送信し、選択したファイルをカレントディレクトリへ保存すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-007	IT-15	状態変化	P1	状態変化の結合確認	フォルダを作成を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	mode=createで送信し、入力したフォルダ名でカレントディレクトリ配下に新規フォルダを作成すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-008	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	ファイル・フォルダを削除を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル・フォルダを削除
3. 画面表示と後続状態を確認する"	なりすまし対策トークン検証後、対象がuser_data配下なら削除し、削除時のカレントディレクトリで一覧へ戻ること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-009	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	ファイルを表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイルを表示を確認する
3. 画面表示と後続状態を確認する"	対象ファイルがuser_data配下なら別タブでファイル内容を返すこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-010	IT-25	URL	P2	URLの操作結果確認	アップロード制限が有効な状態でアクセスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. アップロード制限が有効な状態でアクセス
3. 画面表示と後続状態を確認する"	アップロード制限が有効なとき、ファイル管理メニューを表示せず、URLへ到達してもアクセス拒否（HTTP403）として扱うこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	表示要素を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-012	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	一覧の表示分けを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧の表示分けを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-013	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ファイル選択欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル選択欄
3. 画面表示と後続状態を確認する"	複数ファイル選択に対応する（multiple）であること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	フォルダ作成欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. フォルダ作成欄を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ディレクトリツリーを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	パンくずを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. パンくずを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-017	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	パスコピーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. パスコピーを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	削除モーダルを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 削除モーダル
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-019	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ディレクトリツリーのフォルダ押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ディレクトリツリーのフォルダ押下
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-020	IT-22	部分入力	P2	部分入力の入力検証	パンくず押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. パンくず押下
3. 画面表示と後続状態を確認する"	許可ルート外への移動、存在しないパス、ファイル指定はサーバ側で排除すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-021	IT-23	検索条件	P2	検索時の検索条件確認	パスコピー押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-022	IT-23	検索条件	P2	検索時の検索条件確認	削除ボタン押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-023	IT-23	検索条件	P2	検索時の検索条件確認	アップロードファイル選択を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-024	IT-23	検索条件	P2	検索時の検索条件確認	情報を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-025	IT-23	検索条件	P2	検索時の検索条件確認	更新日時を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-026	IT-23	検索条件	P2	検索時の検索条件確認	削除確認を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-027	IT-23	検索条件	P2	検索時の検索条件確認	○件のファイルをアップロードしましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-028	IT-23	検索条件	P2	検索時の検索条件確認	削除しましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-029	IT-23	検索条件	P2	検索時の検索条件確認	ファイル表示・ダウンロードで領域外・フォルダを指定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-030	IT-23	検索条件	P2	検索時の検索条件確認	操作領域の固定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-031	IT-23	検索条件	P2	検索時の検索条件確認	削除対象の制限を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-032	IT-23	検索条件	P2	検索時の検索条件確認	成功件数表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-033	IT-23	検索条件	P2	検索時の検索条件確認	計算を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-034	IT-23	検索条件	P2	検索時の検索条件確認	ファイルを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-035	IT-23	実行結果	P2	検索時の実行結果確認	フォルダを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-036	IT-23	実行結果	P2	検索時の実行結果確認	カレントディレクトリ指定が領域外・..を含むを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-037	IT-23	実行結果	P2	検索時の実行結果確認	アップロード先（now_dir）が領域外を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-038	IT-23	実行結果	P2	検索時の実行結果確認	複数ファイルの一部が検証に外れるを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-039	IT-26	登録内容	P1	登録時の登録内容確認	同一の検証エラーが複数ファイルで発生を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-040	IT-26	登録内容	P1	登録時の登録内容確認	同名ファイルの再アップロードを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-041	IT-26	登録内容	P1	登録時の登録内容確認	カレントディレクトリを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-042	IT-26	登録内容	P1	登録時の登録内容確認	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	右側に表示する、user_data配下のフォルダ階層であること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-043	IT-26	登録内容	P1	登録時の登録内容確認	jailパスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-044	IT-26	登録内容	P1	登録時の登録内容確認	ファイル管理画面を開くを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-045	IT-26	登録内容	P1	登録時の登録内容確認	フォルダへ移動を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-046	IT-26	登録内容	P1	登録時の登録内容確認	ファイルをアップロードを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-047	IT-26	登録内容	P1	登録時の登録内容確認	フォルダを作成を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-048	IT-26	登録内容	P1	登録時の登録内容確認	ファイル・フォルダを削除を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-049	IT-26	実行結果	P1	登録時の実行結果確認	ファイルを表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-050	IT-23	実行結果	P1	登録時の実行結果確認	アップロード制限が有効な状態でアクセスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アップロード制限が有効なとき、ファイル管理メニューを表示せず、URLへ到達してもアクセス拒否（HTTP403）として扱うこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-051	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-052	IT-26	更新内容	P1	更新時の更新内容確認	一覧の表示分けを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-053	IT-26	更新内容	P1	更新時の更新内容確認	ファイル選択欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-054	IT-26	更新内容	P1	更新時の更新内容確認	フォルダ作成欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォルダ名のテキスト入力であること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-055	IT-26	更新内容	P1	更新時の更新内容確認	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-056	IT-26	更新内容	P1	更新時の更新内容確認	パンくずを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-057	IT-26	更新内容	P1	更新時の更新内容確認	パスコピーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-058	IT-26	更新内容	P1	更新時の更新内容確認	削除モーダルを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-059	IT-26	更新内容	P1	更新時の更新内容確認	ディレクトリツリーのフォルダ押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-060	IT-26	更新内容	P1	更新時の更新内容確認	パンくず押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-061	IT-05	実行結果	P1	更新時の実行結果確認	パスコピー押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-062	IT-05	実行結果	P1	更新時の実行結果確認	削除ボタン押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	対象の存在、ディレクトリ空判定、削除権限、トークンはサーバ側で再判定すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-063	IT-05	削除条件	P1	削除時の削除条件確認	アップロードファイル選択を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	サイズ、拡張子、保存先、上書き可否はサーバ側で検証すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-064	IT-05	削除条件	P1	削除時の削除条件確認	情報を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ファイル管理画面の表示時に一度だけ情報メッセージとして表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-065	IT-05	削除条件	P1	削除時の削除条件確認	更新日時を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧の各行で更新日時に続けて表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-066	IT-05	削除条件	P1	削除時の削除条件確認	削除確認を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除モーダル内に、対象名を差し込んで表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-067	IT-05	削除条件	P1	削除時の削除条件確認	○件のファイルをアップロードしましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除条件の対象ファイルと処理条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-068	IT-05	実行結果	P1	削除時の実行結果確認	削除しましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-069	IT-05	実行結果	P1	削除時の実行結果確認	ファイル表示・ダウンロードで領域外・フォルダを指定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	専用文言は出さず、見つからない（HTTP404）として扱うこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-070	IT-05	実行結果	P1	削除時の実行結果確認	操作領域の固定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-071	IT-05	実行結果	P1	削除時の実行結果確認	削除対象の制限を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	空・未指定・/の選択は削除しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-072	IT-16	実行結果	P2	実行結果の結合確認	成功件数表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-073	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	計算を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でフォーマット定義で対象条件に該当する値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-074	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	ファイルを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でフォーマット定義で対象条件に該当しない値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示され、対象処理が完了しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-075	IT-27	実行結果	P2	実行結果の結合確認	フォルダを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-076	IT-27	実行結果	P2	実行結果の結合確認	カレントディレクトリ指定が領域外・..を含むを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-077	IT-24	出力内容	P2	出力内容の結合確認	アップロード先（now_dir）が領域外を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-078	IT-24	出力内容	P2	出力内容の結合確認	複数ファイルの一部が検証に外れるを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-079	IT-24	出力内容	P2	出力内容の結合確認	同一の検証エラーが複数ファイルで発生を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-080	IT-24	出力内容	P2	出力内容の結合確認	同名ファイルの再アップロードを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-081	IT-24	出力内容	P2	出力内容の結合確認	カレントディレクトリを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容でエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-082	IT-27	削除	P1	削除の結合確認	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で削除の対象ファイルと処理条件を指定する	"1. 対象画面で削除のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	削除の該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-083	IT-27	移動・リネーム	P2	移動・リネームの結合確認	jailパスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で移動・リネームの対象ファイルと処理条件を指定する	"1. 対象画面で移動・リネームのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	移動・リネームの該当レコードが取得結果に含まれないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-084	IT-27	コピー	P1	コピーの結合確認	ファイル管理画面を開くを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でコピーの対象ファイルと処理条件を指定する	"1. 対象画面でコピーのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	コピーのファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-085	IT-33	ファイル登録	P1	ファイル登録の結合確認	フォルダへ移動を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でファイル登録の対象ファイルと処理条件を指定する	"1. 対象画面でファイル登録のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル登録のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-086	IT-33	ファイル出力	P1	ファイル出力の結合確認	ファイルをアップロードを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でファイル出力の対象ファイルと処理条件を指定する	"1. 対象画面でファイル出力のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル出力のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-087	IT-27	JSON	P1	JSONの結合確認	フォルダを作成を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でJSONの対象ファイルと処理条件を指定する	"1. 対象画面でJSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	JSONのファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-088	IT-27	同名ファイル	P1	同名ファイルの結合確認	ファイル・フォルダを削除を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で同名ファイルの対象ファイルと処理条件を指定する	"1. 対象画面で同名ファイルのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	同名ファイルのファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-089	IT-27	入力JSON	P1	入力JSONの結合確認	ファイルを表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で入力JSONの対象ファイルと処理条件を指定する	"1. 対象画面で入力JSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	入力JSONの対象レコードの値が変更されないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-090	IT-27	配置先	P1	配置先の結合確認	アップロード制限が有効な状態でアクセスを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で配置先の対象ファイルと処理条件を指定する	"1. 対象画面で配置先のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	配置先の該当レコードが取得結果に含まれること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-091	IT-27	スキーマ	P1	スキーマの結合確認	表示要素を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でスキーマの対象ファイルと処理条件を指定する	"1. 対象画面でスキーマのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	スキーマのファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-092	IT-02	初期行数	P2	初期行数の結合確認	一覧の表示分けを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で初期行数の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧の表示分けを確認する
3. 画面表示と後続状態を確認する"	フォルダ行はフォルダアイコンと名前リンク（押下で移動）を表示し、操作は削除のみとすること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-093	IT-02	表示順	P2	表示順の結合確認	ファイル選択欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で表示順の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル選択欄
3. 画面表示と後続状態を確認する"	複数ファイル選択に対応する（multiple）であること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-094	IT-25	更新抑止	P1	更新抑止の結合確認	フォルダ作成欄を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で更新抑止の対象ファイルと処理条件を指定する	"1. 対象画面で更新抑止のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	更新抑止のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-095	IT-12	内部情報	P1	内部情報の結合確認	ディレクトリツリーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で内部情報の対象ファイルと処理条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	サーバから渡すツリーデータをもとに、user_dataを根としたフォルダ階層をJavaScriptで構築すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-096	IT-15	機密情報	P1	機密情報の結合確認	パンくずを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で機密情報の対象ファイルと処理条件を指定する	"1. 対象画面で機密情報のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	機密情報のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-097	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	パスコピーを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. パスコピーを確認する
3. 画面表示と後続状態を確認する"	ファイル行のコピーボタン押下で、公開URL入力欄を表示してフォーカスし、ブラウザのコピーを実行すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-098	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	削除モーダルを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 削除モーダル
3. 画面表示と後続状態を確認する"	削除ボタン押下でモーダルを開き、対象名を含む確認文を表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-099	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ディレクトリツリーのフォルダ押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ディレクトリツリーのフォルダ押下
3. 画面表示と後続状態を確認する"	対象パスが許可ルート配下か、存在するか、操作可能かをサーバ側で判定すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-100	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	パンくず押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. パンくず押下
3. 画面表示と後続状態を確認する"	許可ルート外への移動、存在しないパス、ファイル指定はサーバ側で排除すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-101	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	パスコピー押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. パスコピー押下
3. 画面表示と後続状態を確認する"	再検証なしであること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-102	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	削除ボタン押下を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 削除ボタン押下
3. 画面表示と後続状態を確認する"	対象の存在、ディレクトリ空判定、削除権限、トークンはサーバ側で再判定すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-103	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	アップロードファイル選択を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. アップロードファイル選択
3. 画面表示と後続状態を確認する"	サイズ、拡張子、保存先、上書き可否はサーバ側で検証すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-104	IT-25	一覧	P2	一覧の結合確認	情報を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で一覧の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 情報を確認する
3. 画面表示と後続状態を確認する"	ファイル管理画面の表示時に一度だけ情報メッセージとして表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-105	IT-12	画面表示データ	P2	画面表示データの結合確認	更新日時を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 更新日時を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-106	IT-25	画面表示データ	P2	画面表示データの結合確認	削除確認を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 削除確認
3. 画面表示と後続状態を確認する"	削除モーダル内に、対象名を差し込んで表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-107	IT-12	画面表示データ	P2	画面表示データの結合確認	○件のファイルをアップロードしましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ○件のファイルをアップロードしました
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-108	IT-25	画面表示データ	P2	画面表示データの結合確認	削除しましたを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 削除しました
3. 画面表示と後続状態を確認する"	ファイル・フォルダの削除に成功したときであること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-109	IT-25	フォーム送信	P1	フォーム送信の結合確認	ファイル表示・ダウンロードで領域外・フォルダを指定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でフォーム送信の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル表示・ダウンロードで領域外・フォルダを指定
3. 画面表示と後続状態を確認する"	専用文言は出さず、見つからない（HTTP404）として扱うこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-110	IT-16	ファイル選択	P2	ファイル選択の結合確認	操作領域の固定を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でファイル選択の対象ファイルと処理条件を指定する	"1. 対象画面でファイル選択のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル選択のファイル出力内容または取り込み結果が対象データと一致すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-111	IT-12	非同期更新	P1	非同期更新の結合確認	削除対象の制限を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で非同期更新の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 削除対象の制限
3. 画面表示と後続状態を確認する"	空・未指定・/の選択は削除しないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-112	IT-12	エラー継続	P3	エラー継続の結合確認	成功件数表示を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でエラー継続の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功件数表示を確認する
3. 画面表示と後続状態を確認する"	アップロードは選択ファイルごとに検証し、成功件数と選択件数を「成功/選択」の形で表示すること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-113	IT-25	件数上限	P2	件数上限の結合確認	計算を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で件数上限の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 計算を確認する
3. 画面表示と後続状態を確認する"	金額計算・税計算・丸めは行わないこと。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-114	IT-25	欠損値	P2	欠損値の結合確認	ファイルを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で欠損値の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイルを追加を確認する
3. 画面表示と後続状態を確認する"	フォームキーfileであること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-115	IT-25	データなし	P2	データなしの結合確認	フォルダを追加を試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）でデータなしの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. フォルダを追加を確認する
3. 画面表示と後続状態を確認する"	フォームキーcreate_fileであること。
m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）	IT-M09-02-ADMIN-CONTENT-CONTENT-FILE-116	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	カレントディレクトリ指定が領域外・..を含むを試験できる状態である	m09-02_admin_content_content_file（管理画面_コンテンツ管理_ファイル管理）（m09_02_admin_content_content_file）で公開コンテンツの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. カレントディレクトリ指定が領域外・..を含むを確認する
3. 画面表示と後続状態を確認する"	領域外として扱い、user_data領域のトップを起点に表示すること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 3件 — No.109, No.110, No.111。上限緩和または個別ケース化で収載可能。
