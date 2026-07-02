# m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m02-05_admin_home_home_ec_cube_news.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力内容、出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション、部分入力 |
| IT-12 | 内部情報、画面表示データ |
| IT-01 | UI部品 |
| IT-27 | ファイル取得 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-001	IT-15	CSRF	P1	CSRFの結合確認	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_urlの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	アプリケーション設定に保持される文字列であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-002	IT-15	未認証	P1	未認証の結合確認	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開くの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	EC-CUBEお知らせカードが表示され、情報iframe が設定された URL を読み込み開始すること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-003	IT-15	対象データ	P1	対象データの結合確認	情報iframe 内を閲覧・操作するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe 内を閲覧・操作するの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	表示される内容・遷移・スクロールは、読み込み先ドキュメントおよびブラウザのふるまいに従うであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-004	IT-20	出力抑止	P1	出力抑止の結合確認	非管理者・未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で非管理者・未認証の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ホーム画面自体に到達できないため、本カードも利用できないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-005	IT-20	識別子	P1	識別子の結合確認	表示要素を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で表示要素の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	カード見出しは翻訳キーに基づくタイトルであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-006	IT-15	状態変化	P1	状態変化の結合確認	モーダル・ポップアップを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	本カード自体はモーダルやトーストを開かないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-007	IT-25	UI部品	P3	UI部品の操作結果確認	eccube_info_url が空文字になる運用設定を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_url が空文字になる運用設定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. eccube_info_url が空文字になる運用設定を確認する
3. 画面表示と後続状態を確認する"	iframe の src が空になり、ブラウザは空の文書を読み込むであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-008	IT-25	UI部品	P3	UI部品の操作結果確認	外部サイトが iframe 埋め込みを拒否するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で外部サイトが iframe 埋め込みを拒否するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部サイトが iframe 埋め込みを拒否するを確認する
3. 画面表示と後続状態を確認する"	ブラウザがコンテンツを表示しない、もしくはエラー表示にすること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-009	IT-25	操作起点	P1	操作起点の操作結果確認	ネットワーク不通・タイムアウトを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でネットワーク不通・タイムアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ネットワーク不通・タイムアウトを確認する
3. 画面表示と後続状態を確認する"	ブラウザのエラー表示に委ねるであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	ホーム画面を開いたまま時間が経過するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開いたまま時間が経過するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面を開いたまま時間が経過するを確認する
3. 画面表示と後続状態を確認する"	情報iframe 内のコンテンツは自動では更新されないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	参照時点を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で参照時点の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	情報iframe の内容は、ブラウザが eccube_info_url を取得した時点の応答であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	APIを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	本カードはお知らせ取得のための専用 API を呼び出さないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	失敗時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で失敗時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時を確認する
3. 画面表示と後続状態を確認する"	アプリケーションが定義するお知らせ用 API の成否を本カード内で判定しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-014	IT-03	外部画面	P2	外部画面の操作結果確認	入力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	ホーム画面の GET 表示要求であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	成功時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	お知らせカードを含むホーム画面 HTMLであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	サーバがホーム HTML を生成できない場合はフレームワークの例外処理に委ねるであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	副作用を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	本カードのレンダリングのみでは、お知らせ内容に関するデータベース更新やキャッシュ書き込みは行わないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	利用者入力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で利用者入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用者入力
3. 画面表示と後続状態を確認する"	本カードはフォームを持たないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_urlの確認に必要な条件を指定する	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	本カードの Twig は値の形式検証を行わず、そのまま src に出力すること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	利用不可であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	管理者として認証済みを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で管理者として認証済みの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理者として認証済みを確認する
3. 画面表示と後続状態を確認する"	ホーム画面が表示される範囲で本カードを閲覧できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	細粒度の権限を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で細粒度の権限の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 細粒度の権限を確認する
3. 画面表示と後続状態を確認する"	ホーム上のカード単位で表示を切り替える実装は本カードに無いであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-023	IT-25	URL	P2	URLの操作結果確認	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面を開く
3. 画面表示と後続状態を確認する"	同一画面内にお知らせカードと情報iframe を表示すること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	情報iframe 内のリンクを押下を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 情報iframe 内のリンクを押下
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	情報iframe の読み込み失敗・拒否を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 情報iframe の読み込み失敗・拒否を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	TLS 証明書エラー等を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. TLS 証明書エラー等を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	お知らせカードの表示のみを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. お知らせカードの表示のみを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ホーム画面表示時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. ホーム画面表示時を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面を開く
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	情報iframe 内を閲覧・操作するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe 内を閲覧・操作するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 情報iframe 内を閲覧・操作するを確認する
3. 画面表示と後続状態を確認する"	表示される内容・遷移・スクロールは、読み込み先ドキュメントおよびブラウザのふるまいに従うであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	非管理者・未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示要素を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	eccube_info_url が空文字になる運用設定を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. eccube_info_url が空文字になる運用設定を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	外部サイトが iframe 埋め込みを拒否するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 外部サイトが iframe 埋め込みを拒否するを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ネットワーク不通・タイムアウトを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ネットワーク不通・タイムアウトを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ホーム画面を開いたまま時間が経過するを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ホーム画面を開いたまま時間が経過するを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	参照時点を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で参照時点の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	APIを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	失敗時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で失敗時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	入力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	成功時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	失敗時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	副作用を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	利用者入力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で利用者入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用者入力
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_urlの確認に必要な条件を指定する	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	管理者として認証済みを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 管理者として認証済みを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ホーム画面を開く
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	情報iframe 内のリンクを押下を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 情報iframe 内のリンクを押下
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	情報iframe の読み込み失敗・拒否を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 情報iframe の読み込み失敗・拒否を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	TLS 証明書エラー等を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. TLS 証明書エラー等を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	お知らせカードの表示のみを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. お知らせカードの表示のみを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ホーム画面表示時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ホーム画面表示時を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-056	IT-22	必須制御	P1	必須制御の入力検証	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	アプリケーション設定に保持される文字列であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-057	IT-22	部分入力	P2	部分入力の入力検証	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面を開く
3. 画面表示と後続状態を確認する"	EC-CUBEお知らせカードが表示され、情報iframe が設定された URL を読み込み開始すること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-058	IT-20	出力内容	P3	出力内容の結合確認	非管理者・未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	ホーム画面自体に到達できないため、本カードも利用できないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-059	IT-20	出力内容	P3	出力内容の結合確認	表示要素を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	カード見出しは翻訳キーに基づくタイトルであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-060	IT-20	出力内容	P3	出力内容の結合確認	モーダル・ポップアップを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本カード自体はモーダルやトーストを開かないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-061	IT-25	更新抑止	P1	更新抑止の結合確認	入力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で入力の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ホーム画面の GET 表示要求であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-062	IT-12	内部情報	P1	内部情報の結合確認	成功時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で成功時出力の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	お知らせカードを含むホーム画面 HTMLであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-063	IT-15	機密情報	P1	機密情報の結合確認	失敗時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で失敗時出力の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	サーバがホーム HTML を生成できない場合はフレームワークの例外処理に委ねるであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-064	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	情報iframe 内のリンクを押下を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe 内のリンクを押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 情報iframe 内のリンクを押下
3. 画面表示と後続状態を確認する"	iframe 内のナビゲーションもしくは新規タブ等、読み込み先 HTML の指定に従うであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-065	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	情報iframe の読み込み失敗・拒否を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe の読み込み失敗・拒否の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 情報iframe の読み込み失敗・拒否を確認する
3. 画面表示と後続状態を確認する"	ブラウザの表示に委ねるであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-066	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	TLS 証明書エラー等を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でTLS 証明書エラー等の確認に必要な条件を指定する	"1. 対象画面を表示する
2. TLS 証明書エラー等を確認する
3. 画面表示と後続状態を確認する"	ブラウザのインタースティシャルに委ねるであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-067	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	お知らせカードの表示のみを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でお知らせカードの表示のみの確認に必要な条件を指定する	"1. 対象画面を表示する
2. お知らせカードの表示のみを確認する
3. 画面表示と後続状態を確認する"	本ブロック単体では業務監査ログを追加で書く処理は持たないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-068	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	ホーム画面表示時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面表示時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面表示時を確認する
3. 画面表示と後続状態を確認する"	お知らせカードの表示のためだけにセッションを更新しないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-069	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_urlの確認に必要な条件を指定する	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	アプリケーション設定に保持される文字列であること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-070	IT-12	画面表示データ	P2	画面表示データの結合確認	未認証を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-071	IT-25	画面表示データ	P2	画面表示データの結合確認	管理者として認証済みを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 管理者として認証済みを確認する
3. 画面表示と後続状態を確認する"	ホーム画面が表示される範囲で本カードを閲覧できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-072	IT-12	画面表示データ	P2	画面表示データの結合確認	細粒度の権限を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で画面表示データの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 細粒度の権限を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-073	IT-25	画面表示データ	P2	画面表示データの結合確認	ホーム画面を開くを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面を開く
3. 画面表示と後続状態を確認する"	画面表示データの該当レコードが取得結果に含まれないこと。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-074	IT-12	画面表示データ	P2	画面表示データの結合確認	情報iframe 内のリンクを押下を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe 内のリンクを押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 情報iframe 内のリンクを押下
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-075	IT-12	画面表示データ	P2	画面表示データの結合確認	情報iframe の読み込み失敗・拒否を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）で情報iframe の読み込み失敗・拒否の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 情報iframe の読み込み失敗・拒否を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-076	IT-12	画面表示データ	P2	画面表示データの結合確認	TLS 証明書エラー等を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でTLS 証明書エラー等の確認に必要な条件を指定する	"1. 対象画面を表示する
2. TLS 証明書エラー等を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-077	IT-12	画面表示データ	P2	画面表示データの結合確認	ホーム画面表示時を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でホーム画面表示時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホーム画面表示時を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-078	IT-01	UI部品	P3	UI部品の結合確認	成功時出力を試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でUI部品の対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	お知らせカードを含むホーム画面 HTMLであること。
m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）	IT-M02-05-ADMIN-HOME-HOME-EC-CUBE-NEWS-079	IT-27	ファイル取得	P2	ファイル取得の結合確認	eccube_info_urlを試験できる状態である	m02-05_admin_home_home_ec_cube_news（管理画面_EC-CUBEお知らせ）（m02_05_admin_home_home_ec_cube_news）でeccube_info_urlの確認に必要な条件を指定する	"1. 対象画面を表示する
2. eccube_info_urlを確認する
3. 画面表示と後続状態を確認する"	ファイル取得の該当レコードが取得結果に含まれること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 本機能に更新処理がないため |
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
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-12, IT-14, IT-16, IT-21, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
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
| その他 | 同種の対象外観点 16 件は上記分類と同じ理由で対象外 |
