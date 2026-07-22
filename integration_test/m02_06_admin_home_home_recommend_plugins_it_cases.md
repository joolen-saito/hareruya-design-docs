# m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m02-06_admin_home_home_recommend_plugins.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 更新内容 |
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
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-001	IT-15	CSRF	P1	CSRFの結合確認	おすすめプラグインを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でおすすめプラグインの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	外部のプラグイン API から取得する、ホーム画面に掲載する推奨プラグインの配列であること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-002	IT-15	未認証	P1	未認証の結合確認	プラグイン詳細モーダルを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン詳細モーダルの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	おすすめプラグインの画像もしくは名称から開く、価格、対応バージョン、公開日、制作者、説明、インストール・購入導線を表示するモーダルであること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-003	IT-15	対象データ	P1	対象データの結合確認	インストール状態を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でインストール状態の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	外部 API のプラグイン ID、購入要否、購入済み情報と、ローカルに登録済みのプラグイン情報を突き合わせて算出する表示・操作状態であること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-004	IT-20	出力抑止	P1	出力抑止の結合確認	オーナーズストアを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でオーナーズストアの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	プラグイン検索、購入、入手、詳細確認を行う外部ストアおよび管理画面内の関連機能であること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-005	IT-20	識別子	P1	識別子の結合確認	ホーム画面を開くを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でホーム画面を開くの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	おすすめプラグインカードに、外部 API から取得できたプラグインの画像、名称、短い説明が縦に表示されるであること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-006	IT-15	状態変化	P1	状態変化の結合確認	おすすめ一覧の取得に失敗した状態でホーム画面を開くを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でおすすめ一覧の取得に失敗した状態でホーム画面を開くの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ホーム画面の表示は継続し、おすすめプラグインの行は表示されないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	プラグイン画像または名称を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン画像または名称を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. プラグイン画像または名称を押下
3. 画面表示と後続状態を確認する"	同一画面上で対象プラグインの詳細モーダルを開くこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	詳細モーダルで「入手する」または「アップデート」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「入手する」または「アップデート」を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細モーダルで「入手する」または「アップデート」を押下
3. 画面表示と後続状態を確認する"	対象プラグインのインストール確認へ遷移すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-009	IT-25	URL	P2	URLの操作結果確認	詳細モーダルで「購入する」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「購入する」を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細モーダルで「購入する」を押下
3. 画面表示と後続状態を確認する"	外部ストアの購入導線を別ウィンドウで開くフォームを送信すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	詳細モーダルで「インストール済み」を表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 詳細モーダルで「インストール済み」を表示を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	カード下部の「オーナーズストア」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でカード下部の「オーナーズストア」を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. カード下部の「オーナーズストア」を押下
3. 画面表示と後続状態を確認する"	管理画面内のオーナーズストア検索へ遷移すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	非管理者・未認証を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧レイアウトを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧レイアウトを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. モーダル表示を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	モーダル内容を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. モーダル内容を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	対応バージョン警告を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 対応バージョン警告を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-019	IT-22	部分入力	P2	部分入力の入力検証	JS 挙動を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	本ブロック固有の JavaScript ファイルは持たないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-020	IT-23	検索条件	P2	検索時の検索条件確認	入力項目を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-021	IT-23	検索条件	P2	検索時の検索条件確認	おすすめプラグイン件数を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-022	IT-23	検索条件	P2	検索時の検索条件確認	ローカルプラグイン突き合わせを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-023	IT-23	検索条件	P2	検索時の検索条件確認	外部 API の取得先を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-024	IT-23	検索条件	P2	検索時の検索条件確認	送信ヘッダを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-025	IT-23	検索条件	P2	検索時の検索条件確認	対応バージョンを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-026	IT-23	検索条件	P2	検索時の検索条件確認	価格表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-027	IT-23	検索条件	P2	検索時の検索条件確認	外部 API が空配列を返すを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-028	IT-23	検索条件	P2	検索時の検索条件確認	外部 API 通信に失敗するを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で外部 API 通信に失敗するの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-029	IT-23	検索条件	P2	検索時の検索条件確認	HTTP ステータスが 200 ではないを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でHTTP ステータスが 200 ではないの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-030	IT-23	検索条件	P2	検索時の検索条件確認	同じ取得元 ID のローカルプラグインが複数あるを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で同じ取得元 ID のローカルプラグインが複数あるの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-031	IT-23	検索条件	P2	検索時の検索条件確認	未購入かつ購入が必要なプラグインが、ローカル取得元 ID とも一致するを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で未購入かつ購入が必要なプラグインが、ローカル取得元 ID とも一致するの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-032	IT-23	検索条件	P2	検索時の検索条件確認	対応バージョン一覧に現在バージョンが含まれないを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で対応バージョン一覧に現在バージョンが含まれないの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-033	IT-23	検索条件	P2	検索時の検索条件確認	問い合わせ URL またはマニュアル URL が空を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で問い合わせ URL またはマニュアル URL が空の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-034	IT-23	実行結果	P2	検索時の実行結果確認	プラグイン画像が空を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン画像が空の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-035	IT-23	実行結果	P2	検索時の実行結果確認	参照時点を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で参照時点の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-036	IT-23	実行結果	P2	検索時の実行結果確認	ローカルプラグインとの整合性を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でローカルプラグインとの整合性の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-037	IT-23	実行結果	P2	検索時の実行結果確認	一覧と詳細の整合性を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で一覧と詳細の整合性の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-038	IT-26	更新内容	P1	更新時の更新内容確認	更新との整合性を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で更新との整合性の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-039	IT-26	更新内容	P1	更新時の更新内容確認	APIを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でAPIの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-040	IT-26	更新内容	P1	更新時の更新内容確認	API 失敗時を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でAPI 失敗時の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-041	IT-26	更新内容	P1	更新時の更新内容確認	おすすめプラグインを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でおすすめプラグインの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	外部のプラグイン API から取得する、ホーム画面に掲載する推奨プラグインの配列であること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-042	IT-26	更新内容	P1	更新時の更新内容確認	プラグイン詳細モーダルを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン詳細モーダルの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-043	IT-26	更新内容	P1	更新時の更新内容確認	インストール状態を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-044	IT-26	更新内容	P1	更新時の更新内容確認	オーナーズストアを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-045	IT-26	更新内容	P1	更新時の更新内容確認	ホーム画面を開くを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-046	IT-26	更新内容	P1	更新時の更新内容確認	おすすめ一覧の取得に失敗した状態でホーム画面を開くを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-047	IT-26	更新内容	P1	更新時の更新内容確認	プラグイン画像または名称を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン画像または名称を押下の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-048	IT-05	実行結果	P1	更新時の実行結果確認	詳細モーダルで「入手する」または「アップデート」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「入手する」または「アップデート」を押下の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-049	IT-05	実行結果	P1	更新時の実行結果確認	詳細モーダルで「購入する」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「購入する」を押下の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	外部ストアの購入導線を別ウィンドウで開くフォームを送信すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-050	IT-02	初期行数	P2	初期行数の結合確認	詳細モーダルで「インストール済み」を表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「インストール済み」を表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細モーダルで「インストール済み」を表示を確認する
3. 画面表示と後続状態を確認する"	インストール確認や購入には進めず、状態表示として扱うこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-051	IT-02	表示順	P2	表示順の結合確認	詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細モーダルで「資料請求・お問い合わせ」または「マニュアルダウンロード」を押下
3. 画面表示と後続状態を確認する"	外部 URL を別ウィンドウで開くこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-052	IT-25	更新抑止	P1	更新抑止の結合確認	カード下部の「オーナーズストア」を押下を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でカード下部の「オーナーズストア」を押下の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理画面内のオーナーズストア検索へ遷移すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-053	IT-12	内部情報	P1	内部情報の結合確認	非管理者・未認証を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で非管理者・未認証の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ホーム画面自体に到達できないため、本カードも利用できないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-054	IT-15	機密情報	P1	機密情報の結合確認	表示要素を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で表示要素の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	おすすめプラグインカードには、見出し、プラグイン画像、プラグイン名、短い説明、カード下部のオーナーズストアリンクを表示すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-055	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	一覧レイアウトを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で一覧レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧レイアウトを確認する
3. 画面表示と後続状態を確認する"	カード本文は最大高さを持ち、縦スクロールすること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-056	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	モーダル表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でモーダル表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル表示を確認する
3. 画面表示と後続状態を確認する"	プラグイン画像もしくは名称のリンクは Bootstrap のモーダル属性で対象プラグインの詳細モーダルを開くこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-057	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	モーダル内容を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でモーダル内容の確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル内容を確認する
3. 画面表示と後続状態を確認する"	画像、名称、短い説明、税込価格、ダウンロード数、バージョン、対応 EC-CUBE バージョン、公開日、最終更新日、ライセンス、制作者、問い合わせ URL、マニュアル URL、長い説明を表示すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-058	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	対応バージョン警告を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で対応バージョン警告の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応バージョン警告を確認する
3. 画面表示と後続状態を確認する"	現在の EC-CUBE バージョンが対象プラグインの対応バージョン一覧に含まれない場合、モーダル内に警告を表示すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-059	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	入力項目を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	本ブロックは登録・更新のためのフォーム POST を持たないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-060	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	おすすめプラグイン件数を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でおすすめプラグイン件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. おすすめプラグイン件数を確認する
3. 画面表示と後続状態を確認する"	外部 API が返した配列件数をそのまま表示対象件数とすること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-061	IT-25	一覧	P2	一覧の結合確認	ローカルプラグイン突き合わせを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でローカルプラグイン突き合わせの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ローカルプラグイン突き合わせを確認する
3. 画面表示と後続状態を確認する"	ローカルの登録済みプラグイン全件を取得し、外部 API のプラグイン ID とローカルの取得元 ID が一致するかをプラグインごとに確認すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-062	IT-12	画面表示データ	P2	画面表示データの結合確認	外部 API の取得先を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で外部 API の取得先の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部 API の取得先を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-063	IT-25	画面表示データ	P2	画面表示データの結合確認	送信ヘッダを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で送信ヘッダの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信ヘッダ
3. 画面表示と後続状態を確認する"	プラグイン認証キー、現在のサイト URL、EC-CUBE バージョンを送信すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-064	IT-12	画面表示データ	P2	画面表示データの結合確認	対応バージョンを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で対応バージョンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応バージョンを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-065	IT-25	画面表示データ	P2	画面表示データの結合確認	価格表示を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で価格表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 価格表示を確認する
3. 画面表示と後続状態を確認する"	モーダルでは価格を税込表記として表示すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-066	IT-25	フォーム送信	P1	フォーム送信の結合確認	外部 API が空配列を返すを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で外部 API が空配列を返すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部 API が空配列を返すを確認する
3. 画面表示と後続状態を確認する"	おすすめプラグイン行は表示しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-067	IT-16	ファイル選択	P2	ファイル選択の結合確認	外部 API 通信に失敗するを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で外部 API 通信に失敗するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部 API 通信に失敗するを確認する
3. 画面表示と後続状態を確認する"	ホーム画面表示を継続し、おすすめプラグイン行は表示しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-068	IT-12	非同期更新	P1	非同期更新の結合確認	HTTP ステータスが 200 ではないを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でHTTP ステータスが 200 ではないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. HTTP ステータスが 200 ではないを確認する
3. 画面表示と後続状態を確認する"	プラグイン API 例外として扱い、ホーム画面では空配列表示にフォールバックすること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-069	IT-12	エラー継続	P3	エラー継続の結合確認	同じ取得元 ID のローカルプラグインが複数あるを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で同じ取得元 ID のローカルプラグインが複数あるの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同じ取得元 ID のローカルプラグインが複数あるを確認する
3. 画面表示と後続状態を確認する"	実装上は全件を走査し、一致したものに基づき状態を上書きすること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-070	IT-25	件数上限	P2	件数上限の結合確認	未購入かつ購入が必要なプラグインが、ローカル取得元 ID とも一致するを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で未購入かつ購入が必要なプラグインが、ローカル取得元 ID とも一致するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未購入かつ購入が必要なプラグインが、ローカル取得元 ID とも一致するを確認する
3. 画面表示と後続状態を確認する"	購入要否判定が後段で評価されるため、表示状態は「購入する」側に上書きされるであること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-071	IT-25	欠損値	P2	欠損値の結合確認	対応バージョン一覧に現在バージョンが含まれないを試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で対応バージョン一覧に現在バージョンが含まれないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応バージョン一覧に現在バージョンが含まれないを確認する
3. 画面表示と後続状態を確認する"	一覧行は表示すること。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-072	IT-25	データなし	P2	データなしの結合確認	問い合わせ URL またはマニュアル URL が空を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）で問い合わせ URL またはマニュアル URL が空の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 問い合わせ URL またはマニュアル URL が空を確認する
3. 画面表示と後続状態を確認する"	該当する外部リンクボタンは表示しないこと。
m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）	IT-M02-06-ADMIN-HOME-HOME-RECOMMEND-PLUGINS-073	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	プラグイン画像が空を試験できる状態である	m02-06_admin_home_home_recommend_plugins（管理画面_トップおすすめプラグイン）（m02_06_admin_home_home_recommend_plugins）でプラグイン画像が空の確認に必要な条件を指定する	"1. 対象画面を表示する
2. プラグイン画像が空を確認する
3. 画面表示と後続状態を確認する"	一覧の画像は API 取得値をそのまま参照すること。
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
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 4件 — No.109, No.110, No.111, No.334。上限緩和または個別ケース化で収載可能。
