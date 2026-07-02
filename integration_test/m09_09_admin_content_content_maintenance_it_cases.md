# m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m09-09_admin_content_content_maintenance.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、更新抑止、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション |
| IT-26 | 更新内容 |
| IT-23 | 更新内容 |
| IT-05 | 削除条件、実行結果 |
| IT-12 | 内部情報 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-001	IT-15	CSRF	P1	CSRFの結合確認	公開側停止画面を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側停止画面の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同一であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-002	IT-15	未認証	P1	未認証の結合確認	メンテナンスモードを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンスモードの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	公開側フロントの機能を一時停止し、管理画面と管理者のみ利用可能にする状態であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-003	IT-15	対象データ	P1	対象データの結合確認	メンテナンス許可フラグを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス許可フラグの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	設定キー eccube_allow_maintenance_mode（環境変数 ECCUBE_ALLOW_MAINTENANCE_MODE、既定 0）であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-004	IT-20	出力抑止	P1	出力抑止の結合確認	メンテナンス管理画面を開くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス管理画面を開くの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	現在のメンテナンス状態を読み取り、無効中は有効化ボタン、有効中は無効化ボタンを表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-005	IT-20	識別子	P1	識別子の結合確認	切り替えボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で切り替えボタンを押下の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信値に応じてメンテナンスモードを有効化もしくは無効化し、同画面へリダイレクトしてフラッシュメッセージを表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-006	IT-15	状態変化	P1	状態変化の結合確認	メンテナンス許可フラグが偽の環境を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス許可フラグが偽の環境の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ルート条件が成立せず到達できないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-007	IT-25	UI部品	P3	UI部品の操作結果確認	公開側フロントを開く（メンテナンス有効中・トークン不一致）を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側フロントを開く（メンテナンス有効中・トークン不一致）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 公開側フロントを開く（メンテナンス有効中・トークン不一致）
3. 画面表示と後続状態を確認する"	503応答へ振り替わり、メンテナンス中の案内画面を表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-008	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	カードに見出し「メンテナンスモード」と説明文を表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-009	IT-25	操作起点	P1	操作起点の操作結果確認	切り替えボタンを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で切り替えボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 切り替えボタンを確認する
3. 画面表示と後続状態を確認する"	メンテナンス無効中はラベル「有効にする」のボタンを表示し、送信時に隠しフィールド maintenanceの値 onを送るであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	本画面はメンテナンス切り替え専用のJavaScriptを持たないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本画面はモーダル、ポップアップ、確認ダイアログを表示しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	入力項目を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	利用者が値を入力するテキスト欄・ラジオ・トグルは持たないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	メンテナンス切替フォーム送信を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス切替フォーム送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. メンテナンス切替フォーム送信
3. 画面表示と後続状態を確認する"	現在のメンテナンス状態、切替可否、権限、設定ファイル更新可否はサーバ側で判定すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-014	IT-03	外部画面	P2	外部画面の操作結果確認	画面表示を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で画面表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面表示を確認する
3. 画面表示と後続状態を確認する"	状態判定はサーバ側の実ファイル・設定値を正とすること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	カード見出しを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でカード見出しの確認に必要な条件を指定する	"1. 対象画面を表示する
2. カード見出しを確認する
3. 画面表示と後続状態を確認する"	メンテナンス管理画面の表示時であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	説明文を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で説明文の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 説明文を確認する
3. 画面表示と後続状態を確認する"	メンテナンス管理画面の表示時であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	メンテナンスモードを有効にしましたを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンスモードを有効にしましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メンテナンスモードを有効にしましたを確認する
3. 画面表示と後続状態を確認する"	管理画面向けの成功フラッシュとして登録すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	メンテナンスモードを無効にしましたを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンスモードを無効にしましたの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メンテナンスモードを無効にしましたを確認する
3. 画面表示と後続状態を確認する"	管理画面向けの成功フラッシュとして登録すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	ただいまメンテナンス中ですを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でただいまメンテナンス中ですの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ただいまメンテナンス中ですを確認する
3. 画面表示と後続状態を確認する"	見出しおよびページタイトルとして表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	大変お手数ですが、しばらくしてから再度アクセスをお願いしますを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で大変お手数ですが、しばらくしてから再度アクセスをお願いしますの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 大変お手数ですが、しばらくしてから再度アクセスをお願いしますを確認する
3. 画面表示と後続状態を確認する"	説明文として表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	手動無効化の強制削除を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で手動無効化の強制削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 手動無効化の強制削除
3. 画面表示と後続状態を確認する"	本画面からの無効化はモード識別子の一致を確認せず、強制的に目印ファイルを削除すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	利用可否の前提を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で利用可否の前提の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用可否の前提を確認する
3. 画面表示と後続状態を確認する"	メンテナンス許可フラグが真の環境でのみ、画面・メニュー・切り替えを利用できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-023	IT-25	URL	P2	URLの操作結果確認	無効状態で送信値 offが届くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で無効状態で送信値 offが届くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 無効状態で送信値 offが届く
3. 画面表示と後続状態を確認する"	判定順序のいずれにも該当せず、状態を変更せずフラッシュも出さずにリダイレクトすること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	有効状態で送信値 onが届くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 有効状態で送信値 onが届く
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	自動メンテナンス中に本画面で無効化を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 自動メンテナンス中に本画面で無効化を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	目印ファイルへの書き込み・削除が失敗を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 目印ファイルへの書き込み・削除が失敗
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	メンテナンス許可フラグが偽を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. メンテナンス許可フラグが偽を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	状態の保存先を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 状態の保存先
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	画面表示との整合を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 画面表示との整合を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	自動メンテナンスとの整合を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で自動メンテナンスとの整合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 自動メンテナンスとの整合を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	APIを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	本画面の切り替えは専用APIを呼び出さないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	未認証を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 未認証を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	許可フラグが偽を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 許可フラグが偽を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	権限管理での個別制限を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 権限管理での個別制限を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	メンテナンス管理画面を開くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メンテナンス管理画面を開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	有効化ボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で有効化ボタンを押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 有効化ボタンを押下
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	無効化ボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で無効化ボタンを押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 無効化ボタンを押下
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	公開側停止画面を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側停止画面の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 公開側停止画面を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	メンテナンスモードを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メンテナンスモードを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	メンテナンス許可フラグを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メンテナンス許可フラグを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	メンテナンス管理画面を開くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メンテナンス管理画面を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	切り替えボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 切り替えボタンを押下
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	メンテナンス許可フラグが偽の環境を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス許可フラグが偽の環境の確認に必要な条件を指定する	"1. 対象画面を表示する
2. メンテナンス許可フラグが偽の環境を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	公開側フロントを開く（メンテナンス有効中・トークン不一致）を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側フロントを開く（メンテナンス有効中・トークン不一致）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 公開側フロントを開く（メンテナンス有効中・トークン不一致）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	切り替えボタンを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 切り替えボタンを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力項目を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	メンテナンス切替フォーム送信を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. メンテナンス切替フォーム送信
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	画面表示を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 画面表示を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	カード見出しを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. カード見出しを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	説明文を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 説明文を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-056	IT-22	必須制御	P1	必須制御の入力検証	メンテナンスモードを有効にしましたを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. メンテナンスモードを有効にしましたを確認する
3. 画面表示と後続状態を確認する"	管理画面向けの成功フラッシュとして登録すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-057	IT-26	更新内容	P1	更新時の更新内容確認	ただいまメンテナンス中ですを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でただいまメンテナンス中ですの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-058	IT-26	更新内容	P1	更新時の更新内容確認	大変お手数ですが、しばらくしてから再度アクセスをお願いしますを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で大変お手数ですが、しばらくしてから再度アクセスをお願いしますの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-059	IT-26	更新内容	P1	更新時の更新内容確認	手動無効化の強制削除を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で手動無効化の強制削除の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-060	IT-26	更新内容	P1	更新時の更新内容確認	利用可否の前提を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で利用可否の前提の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メンテナンス許可フラグが真の環境でのみ、画面・メニュー・切り替えを利用できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-061	IT-26	更新内容	P1	更新時の更新内容確認	無効状態で送信値 offが届くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で無効状態で送信値 offが届くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	判定順序のいずれにも該当せず、状態を変更せずフラッシュも出さずにリダイレクトすること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-062	IT-23	更新内容	P1	更新時の更新内容確認	有効状態で送信値 onが届くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で有効状態で送信値 onが届くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同上であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-063	IT-26	更新内容	P1	更新時の更新内容確認	自動メンテナンス中に本画面で無効化を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で自動メンテナンス中に本画面で無効化の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	モード識別子を確認せず強制削除するため、自動メンテナンス中でも目印ファイルを削除し無効化すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-064	IT-26	更新内容	P1	更新時の更新内容確認	目印ファイルへの書き込み・削除が失敗を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で目印ファイルへの書き込み・削除が失敗の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ファイル操作の例外はアプリの共通例外処理に委ねるであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-065	IT-26	更新内容	P1	更新時の更新内容確認	メンテナンス許可フラグが偽を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス許可フラグが偽の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面・メニュー・切り替えのいずれも利用できないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-066	IT-26	更新内容	P1	更新時の更新内容確認	状態の保存先を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で状態の保存先の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メンテナンス状態はデータベースではなくファイルシステム上の目印ファイルで保持すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-067	IT-26	更新内容	P1	更新時の更新内容確認	画面表示との整合を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で画面表示との整合の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	表示するボタンは画面表示時点の目印ファイル有無に基づくであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-068	IT-26	更新内容	P1	更新時の更新内容確認	自動メンテナンスとの整合を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で自動メンテナンスとの整合の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-069	IT-26	更新内容	P1	更新時の更新内容確認	APIを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-070	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-071	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-072	IT-26	更新内容	P1	更新時の更新内容確認	副作用を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-073	IT-26	更新内容	P1	更新時の更新内容確認	未認証を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で未認証の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-074	IT-05	実行結果	P1	更新時の実行結果確認	許可フラグが偽を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で許可フラグが偽の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-075	IT-05	実行結果	P1	更新時の実行結果確認	権限管理での個別制限を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で権限管理での個別制限の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面の権限管理設定により、コンテンツ管理配下の表示・操作可否は別レイヤで制御されるであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-076	IT-05	実行結果	P1	更新時の実行結果確認	メンテナンス管理画面を開くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス管理画面を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一画面にメンテナンスモードのカードを表示であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-077	IT-05	削除条件	P1	削除時の削除条件確認	有効化ボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メンテナンス管理画面へリダイレクトであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-078	IT-05	削除条件	P1	削除時の削除条件確認	無効化ボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メンテナンス管理画面へリダイレクトであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-079	IT-05	削除条件	P1	削除時の削除条件確認	公開側停止画面を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側停止画面の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-080	IT-05	削除条件	P1	削除時の削除条件確認	メンテナンスモードを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	公開側フロントの機能を一時停止し、管理画面と管理者のみ利用可能にする状態であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-081	IT-05	削除条件	P1	削除時の削除条件確認	メンテナンス許可フラグを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	設定キー eccube_allow_maintenance_mode（環境変数 ECCUBE_ALLOW_MAINTENANCE_MODE、既定 0）であること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-082	IT-05	削除条件	P1	削除時の削除条件確認	メンテナンス管理画面を開くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス管理画面を開くの確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-083	IT-05	実行結果	P1	削除時の実行結果確認	切り替えボタンを押下を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で切り替えボタンを押下の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-084	IT-05	実行結果	P1	削除時の実行結果確認	メンテナンス許可フラグが偽の環境を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でメンテナンス許可フラグが偽の環境の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ルート条件が成立せず到達できないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-085	IT-05	実行結果	P1	削除時の実行結果確認	公開側フロントを開く（メンテナンス有効中・トークン不一致）を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で公開側フロントを開く（メンテナンス有効中・トークン不一致）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	503応答へ振り替わり、メンテナンス中の案内画面を表示すること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-086	IT-05	実行結果	P1	削除時の実行結果確認	表示要素を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で表示要素の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-087	IT-05	実行結果	P1	削除時の実行結果確認	切り替えボタンを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で切り替えボタンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メンテナンス無効中はラベル「有効にする」のボタンを表示し、送信時に隠しフィールド maintenanceの値 onを送るであること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-088	IT-05	実行結果	P1	削除時の実行結果確認	JS 挙動を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）でJS 挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	本画面はメンテナンス切り替え専用のJavaScriptを持たないこと。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-089	IT-25	更新抑止	P1	更新抑止の結合確認	利用可否の前提を試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で利用可否の前提の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	メンテナンス許可フラグが真の環境でのみ、画面・メニュー・切り替えを利用できること。
m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）	IT-M09-09-ADMIN-CONTENT-CONTENT-MAINTENANCE-090	IT-12	内部情報	P1	内部情報の結合確認	無効状態で送信値 offが届くを試験できる状態である	m09-09_admin_content_content_maintenance（管理画面_コンテンツ管理_メンテナンス管理）（m09_09_admin_content_content_maintenance）で無効状態で送信値 offが届くの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	判定順序のいずれにも該当せず、状態を変更せずフラッシュも出さずにリダイレクトすること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
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
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 16 件は上記分類と同じ理由で対象外 |
