# m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m09-06_admin_content_content_js.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-23 | 実行結果、更新内容、登録内容 |

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
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-007	IT-25	UI部品	P3	UI部品の操作結果確認	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で未ログインまたは権限・IP制限で拒否される利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは権限・IP制限で拒否される利用者を確認する
3. 画面表示と後続状態を確認する"	管理画面の共通ルールに従いアクセスできない（詳細は管理画面認証・認可の実装を正とする）であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-008	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	見出し「JavaScript管理」、サブ見出し「コンテンツ管理」であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-009	IT-25	操作起点	P1	操作起点の操作結果確認	コードエディタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードエディタの確認に必要な条件を指定する	"1. 対象画面を表示する
2. コードエディタを確認する
3. 画面表示と後続状態を確認する"	Aceエディタを高さ480pxの領域に生成すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	JS挙動（構文チェック）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でJS挙動（構文チェック）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（構文チェック）を確認する
3. 画面表示と後続状態を確認する"	エディタの注釈変更イベントを監視し、注釈にエラー種別が1件でもあれば登録ボタンを非活性にすること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	JS挙動（送信）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でJS挙動（送信）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（送信）
3. 画面表示と後続状態を確認する"	フォーム送信時に、エディタの現在値を非表示textareaへ書き戻してから送信すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能はモーダル、ポップアップ、確認ダイアログを表示しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	エディタ注釈変更を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でエディタ注釈変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. エディタ注釈変更を確認する
3. 画面表示と後続状態を確認する"	サーバ側ではJavaScript構文の妥当性を検証しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-014	IT-03	外部画面	P2	外部画面の操作結果確認	フォーム送信を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフォーム送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム送信
3. 画面表示と後続状態を確認する"	保存先ファイルへの書き込み可否とフロント公開先への配置可否をサーバ側で処理すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	案内を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で案内の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 案内を確認する
3. 画面表示と後続状態を確認する"	画面表示時に未表示であれば1回だけ情報メッセージとして表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存しましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存しました
3. 画面表示と後続状態を確認する"	ロケールキー admin.common.save_completeであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存に失敗しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存に失敗しましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存に失敗しました
3. 画面表示と後続状態を確認する"	ロケールキー admin.common.save_errorであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	読み込み条件を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で読み込み条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 読み込み条件を確認する
3. 画面表示と後続状態を確認する"	編集対象ファイルが存在し、かつ書き込み可能なときに限り、その内容をエディタへ初期表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存単位を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	コード入力1つの内容をそのまま1ファイルへ書き出すであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存経路を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存経路の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存経路
3. 画面表示と後続状態を確認する"	まず管理サーバ上の編集対象ファイルへ書き出し、続いてファイルアダプタでフロント公開先へ配置する2段の経路であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	必須表示と検証の差を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須表示と検証の差の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 必須表示と検証の差を確認する
3. 画面表示と後続状態を確認する"	画面のコード見出しには必須バッジを表示するが、フォーム側のコード入力は必須指定を付与しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	構文チェックの扱いを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で構文チェックの扱いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 構文チェックの扱いを確認する
3. 画面表示と後続状態を確認する"	構文エラーの検知と登録ボタン非活性はブラウザ側のエディタ機能であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-023	IT-25	URL	P2	URLの操作結果確認	フロント反映を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント反映の確認に必要な条件を指定する	"1. 対象画面を表示する
2. フロント反映を確認する
3. 画面表示と後続状態を確認する"	保存とフロント公開先への配置が成功すれば、以後フロント全ページの読み込み対象が更新後の内容になること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	コードを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. コードを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	編集対象ファイルが存在しないを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 編集対象ファイルが存在しないを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	編集対象ファイルが存在するが書き込み不可を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 編集対象ファイルが存在するが書き込み不可を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	コードを空文字で登録を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. コードを空文字で登録を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ブラウザ側でJavaScript構文エラーを検知を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. ブラウザ側でJavaScript構文エラーを検知を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ファイル書き込み中の入出力例外を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. ファイル書き込み中の入出力例外を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	編集対象ファイルとフロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルとフロント公開先の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集対象ファイルとフロント公開先を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	画面表示と保存値を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で画面表示と保存値の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面表示と保存値
3. 画面表示と後続状態を確認する"	画面初期表示は編集対象ファイルの内容を読むであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	同時編集を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で同時編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時編集を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	フロント反映タイミングを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント反映タイミングの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フロント反映タイミングを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	入力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	構文チェックを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 構文チェックを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	なりすまし対策トークンを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. なりすまし対策トークンを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でナビからJavaScript管理を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビからJavaScript管理を開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	登録に成功を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録に成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録に成功を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	カスタマイズ用JavaScriptを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でカスタマイズ用JavaScriptの確認に必要な条件を指定する	"1. 対象画面を表示する
2. カスタマイズ用JavaScriptを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	編集対象ファイルを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 編集対象ファイルを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	フロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. フロント公開先を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ファイルアダプタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ファイルアダプタを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ナビからJavaScript管理を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	登録ボタンを押すを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録ボタンを押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録ボタンを押すを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で未ログインまたは権限・IP制限で拒否される利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは権限・IP制限で拒否される利用者を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	コードエディタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. コードエディタを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS挙動（送信）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS挙動（送信）
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	エディタ注釈変更を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. エディタ注釈変更を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	フォーム送信を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. フォーム送信
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	案内を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 案内を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	保存しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 保存しました
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-056	IT-22	必須制御	P1	必須制御の入力検証	保存に失敗しましたを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 保存に失敗しました
3. 画面表示と後続状態を確認する"	ロケールキー admin.common.save_errorであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-057	IT-26	登録内容	P1	登録時の登録内容確認	保存単位を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存単位の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-058	IT-26	登録内容	P1	登録時の登録内容確認	保存経路を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で保存経路の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-059	IT-26	登録内容	P1	登録時の登録内容確認	必須表示と検証の差を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で必須表示と検証の差の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-060	IT-26	登録内容	P1	登録時の登録内容確認	構文チェックの扱いを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で構文チェックの扱いの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	構文エラーの検知と登録ボタン非活性はブラウザ側のエディタ機能であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-061	IT-26	登録内容	P1	登録時の登録内容確認	フロント反映を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント反映の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存とフロント公開先への配置が成功すれば、以後フロント全ページの読み込み対象が更新後の内容になること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-062	IT-23	登録内容	P1	登録時の登録内容確認	コードを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	eccube_html_dir 配下 /user_data/assets/js/customize.js へ全文書き出し（フォームキー js、複数行入力）であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-063	IT-26	登録内容	P1	登録時の登録内容確認	編集対象ファイルが存在しないを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルが存在しないの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エディタは空で表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-064	IT-26	登録内容	P1	登録時の登録内容確認	編集対象ファイルが存在するが書き込み不可を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルが存在するが書き込み不可の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	既存内容を初期表示しない（空表示）であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-065	IT-26	登録内容	P1	登録時の登録内容確認	コードを空文字で登録を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードを空文字で登録の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォーム検証を通過し、空内容でファイルを上書きすること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-066	IT-26	登録内容	P1	登録時の登録内容確認	ブラウザ側でJavaScript構文エラーを検知を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でブラウザ側でJavaScript構文エラーを検知の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録ボタンが非活性となり送信できないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-067	IT-26	登録内容	P1	登録時の登録内容確認	ファイル書き込み中の入出力例外を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でファイル書き込み中の入出力例外の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存完了メッセージを積まず、保存失敗メッセージを表示し、アプリケーションログにエラーを記録すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-068	IT-26	登録内容	P1	登録時の登録内容確認	編集対象ファイルとフロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルとフロント公開先の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-069	IT-26	登録内容	P1	登録時の登録内容確認	画面表示と保存値を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-070	IT-26	登録内容	P1	登録時の登録内容確認	同時編集を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-071	IT-26	登録内容	P1	登録時の登録内容確認	フロント反映タイミングを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-072	IT-26	登録内容	P1	登録時の登録内容確認	入力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-073	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で成功時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-074	IT-26	実行結果	P1	登録時の実行結果確認	失敗時出力を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-075	IT-23	実行結果	P1	登録時の実行結果確認	構文チェックを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で構文チェックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ブラウザ側のエディタによる注釈で構文エラーを検知し、エラー時のみ登録ボタンを非活性にすること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-076	IT-26	更新内容	P1	更新時の更新内容確認	なりすまし対策トークンを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でなりすまし対策トークンの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-077	IT-26	更新内容	P1	更新時の更新内容確認	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でナビからJavaScript管理を開くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-078	IT-26	更新内容	P1	更新時の更新内容確認	登録に成功を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録に成功の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-079	IT-26	更新内容	P1	更新時の更新内容確認	カスタマイズ用JavaScriptを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でカスタマイズ用JavaScriptの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フロント全ページの共通テンプレートから読み込まれる利用者定義のJavaScriptであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-080	IT-26	更新内容	P1	更新時の更新内容確認	編集対象ファイルを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で編集対象ファイルの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理サーバ上の eccube_html_dir 配下 /user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-081	IT-23	更新内容	P1	更新時の更新内容確認	フロント公開先を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でフロント公開先の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フロントのテーマ公開ディレクトリ eccube_theme_front_dir 配下 /html/user_data/assets/js/customize.jsであること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-082	IT-26	更新内容	P1	更新時の更新内容確認	ファイルアダプタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でファイルアダプタの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存済みファイルを公開先へ配置する出力部品であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-083	IT-26	更新内容	P1	更新時の更新内容確認	ナビからJavaScript管理を開くを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でナビからJavaScript管理を開くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	カスタマイズ用JavaScriptファイルが存在し書き込み可能なら、その内容をエディタへ読み込んで表示すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-084	IT-26	更新内容	P1	更新時の更新内容確認	登録ボタンを押すを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で登録ボタンを押すの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エディタ内容をフォームに反映して送信すること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-085	IT-26	更新内容	P1	更新時の更新内容確認	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で未ログインまたは権限・IP制限で拒否される利用者の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面の共通ルールに従いアクセスできない（詳細は管理画面認証・認可の実装を正とする）であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-086	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	見出し「JavaScript管理」、サブ見出し「コンテンツ管理」であること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-087	IT-26	更新内容	P1	更新時の更新内容確認	コードエディタを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）でコードエディタの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-088	IT-26	更新内容	P1	更新時の更新内容確認	JS挙動（構文チェック）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-089	IT-26	更新内容	P1	更新時の更新内容確認	JS挙動（送信）を試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）	IT-M09-06-ADMIN-CONTENT-CONTENT-JS-090	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m09-06_admin_content_content_js（管理画面_コンテンツ管理_JavaScript管理）（m09_06_admin_content_content_js）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
| データベースアクセス / DB制御 / 更新順序（IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / 排他制御（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / ロールバック（IT-06） | 元設計HTMLに該当する処理・I/Fがないため |
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
| データベースアクセス / 分割・結合 / 分割（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / バッチ / DB影響（IT-26） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-18, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / 参照系機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 受信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 受信処理 / バリデーション（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ログ出力 / ログ出力 / ログ編集（IT-20） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面表示 / 表示結果（IT-12, IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-01, IT-12, IT-14, IT-16, IT-21, IT-25, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ログ出力 / ブラウザ（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 取消（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / フロント / 表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 管理画面-公開側 / 反映（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 管理画面 / 初期表示（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル取込 / 実行結果（IT-16） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル出力 / 実行結果（IT-27） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-19, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 19 件は上記分類と同じ理由で対象外 |
