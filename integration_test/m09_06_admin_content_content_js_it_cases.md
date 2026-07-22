# m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m09-06_admin_content_content_js.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、フォーム送信、一覧、更新抑止、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-23 | 実行結果 |
| IT-05 | 実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-16 | ファイル選択 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-001	IT-15	CSRF	P1	CSRFの結合確認	カスタマイズ用JavaScriptを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でカスタマイズ用JavaScriptの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	フロント全ページの共通テンプレートから読み込まれる利用者定義のJavaScriptであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-002	IT-15	未認証	P1	未認証の結合確認	編集対象ファイルを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理サーバ上の eccube_html_dir 配下 /user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-003	IT-15	対象データ	P1	対象データの結合確認	フロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント公開先の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	フロントのテーマ公開ディレクトリ eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-004	IT-20	出力抑止	P1	出力抑止の結合確認	ファイルアダプタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でファイルアダプタの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存済みファイルを公開先へ配置する出力部品であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-005	IT-20	識別子	P1	識別子の結合確認	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でナビからJavaScript管理を開くの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	カスタマイズ用JavaScriptファイルが存在し書き込み可能なら、その内容をエディタへ読み込んで表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-006	IT-15	状態変化	P1	状態変化の結合確認	登録ボタンを押すを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録ボタンを押すの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	エディタ内容をフォームに反映して送信すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で未ログインまたは権限・IP制限で拒否される利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは権限・IP制限で拒否される利用者を確認する
3. 画面表示と後続状態を確認する"	管理画面の共通ルールに従いアクセスできない（詳細は管理画面認証・認可の実装を正とする）であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示要素を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	見出し「JavaScript管理」、サブ見出し「コンテンツ管理」であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-009	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	コードエディタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. コードエディタを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	JS挙動（構文チェック）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS挙動（構文チェック）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-011	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	JS挙動（送信）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でJS挙動（送信）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（送信）
3. 画面表示と後続状態を確認する"	フォーム送信時に、エディタの現在値を非表示textareaへ書き戻してから送信すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-012	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	エディタ注釈変更を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. エディタ注釈変更を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	フォーム送信を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. フォーム送信
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	案内を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 案内を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-016	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	保存しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 保存しました
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	保存に失敗しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 保存に失敗しました
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-018	IT-22	部分入力	P2	部分入力の入力検証	M09-06-MSG-001を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でM09-06-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M09-06-MSG-001を確認する
3. 画面表示と後続状態を確認する"	情報フラッシュを積むのみであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-019	IT-26	登録内容	P1	登録時の登録内容確認	M09-06-MSG-002を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でM09-06-MSG-002の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-020	IT-26	登録内容	P1	登録時の登録内容確認	M09-06-MSG-003を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でM09-06-MSG-003の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-021	IT-26	登録内容	P1	登録時の登録内容確認	読み込み条件を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で読み込み条件の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-022	IT-26	登録内容	P1	登録時の登録内容確認	保存単位を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存単位の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	コード入力1つの内容をそのまま1ファイルへ書き出すであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-023	IT-26	登録内容	P1	登録時の登録内容確認	保存経路を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存経路の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-024	IT-26	登録内容	P1	登録時の登録内容確認	必須表示と検証の差を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-025	IT-26	登録内容	P1	登録時の登録内容確認	構文チェックの扱いを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-026	IT-26	登録内容	P1	登録時の登録内容確認	フロント反映を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-027	IT-26	登録内容	P1	登録時の登録内容確認	コードを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-028	IT-26	登録内容	P1	登録時の登録内容確認	編集対象ファイルが存在しないを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルが存在しないの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-029	IT-26	実行結果	P1	登録時の実行結果確認	編集対象ファイルが存在するが書き込み不可を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルが存在するが書き込み不可の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-030	IT-23	実行結果	P1	登録時の実行結果確認	コードを空文字で登録を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードを空文字で登録の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォーム検証を通過し、空内容でファイルを上書きすること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-031	IT-26	更新内容	P1	更新時の更新内容確認	ブラウザ側でJavaScript構文エラーを検知を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でブラウザ側でJavaScript構文エラーを検知の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-032	IT-26	更新内容	P1	更新時の更新内容確認	ファイル書き込み中の入出力例外を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でファイル書き込み中の入出力例外の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-033	IT-26	更新内容	P1	更新時の更新内容確認	編集対象ファイルとフロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルとフロント公開先の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-034	IT-26	更新内容	P1	更新時の更新内容確認	画面表示と保存値を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で画面表示と保存値の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面初期表示は編集対象ファイルの内容を読むであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-035	IT-26	更新内容	P1	更新時の更新内容確認	同時編集を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で同時編集の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-036	IT-26	更新内容	P1	更新時の更新内容確認	フロント反映タイミングを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-037	IT-26	更新内容	P1	更新時の更新内容確認	入力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-038	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-039	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-040	IT-26	更新内容	P1	更新時の更新内容確認	構文チェックを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で構文チェックの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-041	IT-05	実行結果	P1	更新時の実行結果確認	カスタマイズ用JavaScriptを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でカスタマイズ用JavaScriptの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-042	IT-05	実行結果	P1	更新時の実行結果確認	編集対象ファイルを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理サーバ上の eccube_html_dir 配下 /user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-043	IT-02	初期行数	P2	初期行数の結合確認	フロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント公開先の確認に必要な条件を指定する	"1. 対象画面を表示する
2. フロント公開先を確認する
3. 画面表示と後続状態を確認する"	フロントのテーマ公開ディレクトリ eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-044	IT-02	表示順	P2	表示順の結合確認	ファイルアダプタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でファイルアダプタの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ファイルアダプタを確認する
3. 画面表示と後続状態を確認する"	保存済みファイルを公開先へ配置する出力部品であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-045	IT-25	更新抑止	P1	更新抑止の結合確認	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でナビからJavaScript管理を開くの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	カスタマイズ用JavaScriptファイルが存在し書き込み可能なら、その内容をエディタへ読み込んで表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-046	IT-12	内部情報	P1	内部情報の結合確認	登録ボタンを押すを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録ボタンを押すの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	エディタ内容をフォームに反映して送信すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-047	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	コードエディタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードエディタの確認に必要な条件を指定する	"1. 対象画面を表示する
2. コードエディタを確認する
3. 画面表示と後続状態を確認する"	Aceエディタを高さ480pxの領域に生成すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-048	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	JS挙動（構文チェック）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でJS挙動（構文チェック）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（構文チェック）を確認する
3. 画面表示と後続状態を確認する"	エディタの注釈変更イベントを監視し、注釈にエラー種別が1件でもあれば登録ボタンを非活性にすること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-049	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	モーダル・ポップアップを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能はモーダル、ポップアップ、確認ダイアログを表示しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-050	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	エディタ注釈変更を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でエディタ注釈変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. エディタ注釈変更を確認する
3. 画面表示と後続状態を確認する"	サーバ側ではJavaScript構文の妥当性を検証しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-051	IT-25	一覧	P2	一覧の結合確認	フォーム送信を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフォーム送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム送信
3. 画面表示と後続状態を確認する"	保存先ファイルへの書き込み可否とフロント公開先への配置可否をサーバ側で処理すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-052	IT-12	画面表示データ	P2	画面表示データの結合確認	案内を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で案内の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 案内を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-053	IT-25	画面表示データ	P2	画面表示データの結合確認	保存しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存しましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存しました
3. 画面表示と後続状態を確認する"	ロケールキー admin.common.save_completeであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-054	IT-12	画面表示データ	P2	画面表示データの結合確認	保存に失敗しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存に失敗しましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存に失敗しました
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-055	IT-25	フォーム送信	P1	フォーム送信の結合確認	M09-06-MSG-002を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でM09-06-MSG-002の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M09-06-MSG-002を確認する
3. 画面表示と後続状態を確認する"	成功フラッシュを積み、続けてファイルアダプタで /html/user_data/assets/js/ へ customize.js を配置したうえで admin_content_js へリダイレクトする（リダイレクト先…であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-056	IT-16	ファイル選択	P2	ファイル選択の結合確認	M09-06-MSG-003を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でM09-06-MSG-003の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M09-06-MSG-003を確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュを積み、同文言と [対象パス, 例外] を log_error へ出力すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-057	IT-12	非同期更新	P1	非同期更新の結合確認	読み込み条件を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で読み込み条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 読み込み条件を確認する
3. 画面表示と後続状態を確認する"	編集対象ファイルが存在し、かつ書き込み可能なときに限り、その内容をエディタへ初期表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-058	IT-12	エラー継続	P3	エラー継続の結合確認	保存単位を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	コード入力1つの内容をそのまま1ファイルへ書き出すであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-059	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	保存経路を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存経路の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存経路
3. 画面表示と後続状態を確認する"	まず管理サーバ上の編集対象ファイルへ書き出し、続いてファイルアダプタでフロント公開先へ配置する2段の経路であること。
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
| その他 | 同種の対象外観点 5 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 12件 — No.109, No.110, No.111, No.329, No.330, No.334, No.359, No.412, No.413, No.414, No.415, No.510。上限緩和または個別ケース化で収載可能。
