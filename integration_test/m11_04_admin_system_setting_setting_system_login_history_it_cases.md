# m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.html`

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
| IT-23 | 実行結果、検索条件、登録内容 |
| IT-26 | 登録内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-001	IT-15	CSRF	P1	CSRFの結合確認	ログイン履歴を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン履歴の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理画面ログインの各試行を1行として記録した履歴であること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-002	IT-15	未認証	P1	未認証の結合確認	ログイン試行日時を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン試行日時の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	履歴行の作成日時であること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-003	IT-15	対象データ	P1	対象データの結合確認	詳細検索を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で詳細検索の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ログインID単独・IPアドレス単独・期間・成功失敗区分による絞り込みであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-004	IT-20	出力抑止	P1	出力抑止の結合確認	ログイン履歴一覧を開くを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン履歴一覧を開くの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時の新しい順で1ページ目に表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-005	IT-20	識別子	P1	識別子の結合確認	検索を実行を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索を実行の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	入力した検索条件で絞り込み、1ページ目を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-006	IT-15	状態変化	P1	状態変化の結合確認	ページ送りを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でページ送りの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存済みの検索条件のまま指定ページを表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-007	IT-25	UI部品	P3	UI部品の操作結果確認	表示件数を変更を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示件数を変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数を変更を確認する
3. 画面表示と後続状態を確認する"	表示件数プルダウンの選択でこのURLへ遷移し、件数をセッションへ保存して1ページ目を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-008	IT-25	UI部品	P3	UI部品の操作結果確認	前回条件で再表示を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で前回条件で再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前回条件で再表示を確認する
3. 画面表示と後続状態を確認する"	セッションに保存済みの検索条件・ページ番号で一覧を再表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-009	IT-25	操作起点	P1	操作起点の操作結果確認	表示要素を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	キーワード検索欄、詳細検索の開閉リンク、詳細検索内のログインID欄・IPアドレス欄・期間欄・ステータスのチェックボックス、検索ボタン、検索結果件数、表示件数プルダウン、履歴の一覧表、ページャを表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	JS挙動を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	表示件数プルダウンを変更すると、選択肢の値に設定したURLへwindow.location.hrefで遷移すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	CSS・レイアウトを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	詳細検索ブロックはBootstrapのcollapseで折りたたみ、初期は閉じるであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能はモーダル、確認ダイアログ、トーストを表示しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	画面タイトルを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で画面タイトルの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面タイトルを確認する
3. 画面表示と後続状態を確認する"	一覧画面を表示したときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-014	IT-03	外部画面	P2	外部画面の操作結果確認	詳細検索リンクを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で詳細検索リンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細検索リンク
3. 画面表示と後続状態を確認する"	一覧画面を表示したときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索ボタンを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索ボタン
3. 画面表示と後続状態を確認する"	一覧画面を表示したときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索結果件数を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索結果件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索結果件数
3. 画面表示と後続状態を確認する"	検索結果がある一覧表示時に件数を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	成功区分バッジを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で成功区分バッジの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功区分バッジを確認する
3. 画面表示と後続状態を確認する"	行の区分が成功のときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗区分バッジを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で失敗区分バッジの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗区分バッジを確認する
3. 画面表示と後続状態を確認する"	行の区分が失敗のときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	期間の値が範囲外のときを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で期間の値が範囲外のときの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 期間の値が範囲外のときを確認する
3. 画面表示と後続状態を確認する"	期間欄に範囲下限の検証があること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	表示対象を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示対象の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示対象を確認する
3. 画面表示と後続状態を確認する"	ログイン履歴のうち検索条件に一致する行を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	成功失敗区分の意味を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で成功失敗区分の意味の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功失敗区分の意味を確認する
3. 画面表示と後続状態を確認する"	区分の保存値は失敗が0、成功が1であること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示件数を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	表示件数マスタの値のみ採用すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-023	IT-25	URL	P2	URLの操作結果確認	業務計算を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で業務計算の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 業務計算を確認する
3. 画面表示と後続状態を確認する"	本機能では金額・在庫などの業務計算を行わないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	検索条件をすべて空で検索を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 検索条件をすべて空で検索
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	ステータスを未チェックを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ステータスを未チェックを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索結果が0件を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 検索結果が0件
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示件数に不正値を渡すを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 表示件数に不正値を渡すを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	管理者削除済みの履歴行を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 管理者削除済みの履歴行
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照時点を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	記録との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で記録との整合性の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 記録との整合性を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	失敗履歴の保存失敗を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で失敗履歴の保存失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗履歴の保存失敗
3. 画面表示と後続状態を確認する"	失敗履歴の書き込みに失敗した場合は履歴行が作られず、認証機能側でサーバログに記録されるであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示列との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示列との整合性の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示列との整合性を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	件数との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で件数との整合性の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件数との整合性を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	入力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	mtb_login_history_statusを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. mtb_login_history_statusを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録/更新を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	ログインID・IPアドレスを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログインID・IPアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ログインID・IPアドレスを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	ログイン履歴を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ログイン履歴を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ログイン試行日時を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ログイン試行日時を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	詳細検索を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 詳細検索
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ログイン履歴一覧を開くを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ログイン履歴一覧を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索を実行を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索を実行
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ページ送りを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でページ送りの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ページ送りを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示件数を変更を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示件数を変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数を変更を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	前回条件で再表示を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 前回条件で再表示を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSS・レイアウトを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	画面タイトルを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 画面タイトルを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	詳細検索リンクを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 詳細検索リンク
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	検索ボタンを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索ボタン
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	検索結果件数を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索結果件数
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-056	IT-22	必須制御	P1	必須制御の入力検証	成功区分バッジを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 成功区分バッジを確認する
3. 画面表示と後続状態を確認する"	行の区分が成功のときであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-057	IT-23	検索条件	P2	検索時の検索条件確認	期間の値が範囲外のときを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-058	IT-23	検索条件	P2	検索時の検索条件確認	表示対象を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-059	IT-23	検索条件	P2	検索時の検索条件確認	成功失敗区分の意味を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で成功失敗区分の意味の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	区分の保存値は失敗が0、成功が1であること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-060	IT-23	検索条件	P2	検索時の検索条件確認	表示件数を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-061	IT-23	検索条件	P2	検索時の検索条件確認	業務計算を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-062	IT-23	検索条件	P2	検索時の検索条件確認	検索条件をすべて空で検索を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-063	IT-23	検索条件	P2	検索時の検索条件確認	ステータスを未チェックを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-064	IT-23	検索条件	P2	検索時の検索条件確認	検索結果が0件を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-065	IT-23	検索条件	P2	検索時の検索条件確認	表示件数に不正値を渡すを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-066	IT-23	検索条件	P2	検索時の検索条件確認	管理者削除済みの履歴行を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で管理者削除済みの履歴行の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-067	IT-23	検索条件	P2	検索時の検索条件確認	参照時点を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で参照時点の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-068	IT-23	検索条件	P2	検索時の検索条件確認	記録との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で記録との整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-069	IT-23	検索条件	P2	検索時の検索条件確認	失敗履歴の保存失敗を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で失敗履歴の保存失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-070	IT-23	検索条件	P2	検索時の検索条件確認	表示列との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示列との整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧の各列は履歴行の保存値をそのまま表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-071	IT-23	検索条件	P2	検索時の検索条件確認	件数との整合性を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で件数との整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-072	IT-23	検索条件	P2	検索時の検索条件確認	入力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で入力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-073	IT-23	実行結果	P2	検索時の実行結果確認	成功時出力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-074	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の検証失敗時は一覧を出さず、詳細検索を開いた状態で見直しメッセージを表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-075	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で副作用の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-076	IT-23	実行結果	P2	検索時の実行結果確認	mtb_login_history_statusを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でmtb_login_history_statusの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-077	IT-23	実行結果	P2	検索時の実行結果確認	登録/更新を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で登録/更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-078	IT-26	登録内容	P1	登録時の登録内容確認	ログインID・IPアドレスを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログインID・IPアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-079	IT-26	登録内容	P1	登録時の登録内容確認	ログイン履歴を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン履歴の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-080	IT-26	登録内容	P1	登録時の登録内容確認	ログイン試行日時を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン試行日時の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-081	IT-26	登録内容	P1	登録時の登録内容確認	詳細検索を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で詳細検索の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ログインID単独・IPアドレス単独・期間・成功失敗区分による絞り込みであること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-082	IT-26	登録内容	P1	登録時の登録内容確認	ログイン履歴一覧を開くを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でログイン履歴一覧を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	セッションに保存済みの検索条件があればその条件で、なければ全件を作成日時の新しい順で1ページ目に表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-083	IT-23	登録内容	P1	登録時の登録内容確認	検索を実行を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で検索を実行の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入力した検索条件で絞り込み、1ページ目を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-084	IT-26	登録内容	P1	登録時の登録内容確認	ページ送りを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でページ送りの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存済みの検索条件のまま指定ページを表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-085	IT-26	登録内容	P1	登録時の登録内容確認	表示件数を変更を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示件数を変更の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	表示件数プルダウンの選択でこのURLへ遷移し、件数をセッションへ保存して1ページ目を表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-086	IT-26	登録内容	P1	登録時の登録内容確認	前回条件で再表示を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で前回条件で再表示の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	セッションに保存済みの検索条件・ページ番号で一覧を再表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-087	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	キーワード検索欄、詳細検索の開閉リンク、詳細検索内のログインID欄・IPアドレス欄・期間欄・ステータスのチェックボックス、検索ボタン、検索結果件数、表示件数プルダウン、履歴の一覧表、ページャを表示すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-088	IT-26	登録内容	P1	登録時の登録内容確認	JS挙動を試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でJS挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	表示件数プルダウンを変更すると、選択肢の値に設定したURLへwindow.location.hrefで遷移すること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-089	IT-26	登録内容	P1	登録時の登録内容確認	CSS・レイアウトを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）でCSS・レイアウトの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）	IT-M11-04-ADMIN-SYSTEM-SETTING-SETTING-SYSTEM-LOGIN-HISTORY-090	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m11-04_admin_system_setting_setting_system_login_history（管理画面_ログイン履歴）（m11_04_admin_system_setting_setting_system_login_history）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 元設計HTMLに該当する処理・I/Fがないため |
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
