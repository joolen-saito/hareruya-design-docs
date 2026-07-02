# m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.html`

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
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-001	IT-15	CSRF	P1	CSRFの結合確認	ネット買取一覧の行メニュー「メール通知」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でネット買取一覧の行メニュー「メール通知」の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	手動メール入力画面が開くこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-002	IT-15	未認証	P1	未認証の結合確認	入力画面で「確認」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力画面で「確認」の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証に成功すると確認画面が返るであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-003	IT-15	対象データ	P1	対象データの結合確認	確認画面で「送信」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「送信」の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証に成功するとメール送信処理が呼ばれ、翻訳キー admin.order.mail_send_complete の成功フラッシュ付きで詳細編集へリダイレクトすること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-004	IT-20	出力抑止	P1	出力抑止の結合確認	確認画面で「手動メール通知入力画面に戻る」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「手動メール通知入力画面に戻る」の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	コントローラに back 専用分岐は無いが、フォーム POST のまま入力テンプレートへレンダリングされ、入力内容は維持されるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-005	IT-20	識別子	P1	識別子の結合確認	存在しない買取IDで開くを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で存在しない買取IDで開くの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	HTTP 404 を返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-006	IT-15	状態変化	P1	状態変化の結合確認	表示要素を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ページ見出しは翻訳キーで「買取管理」「手動メール通知」であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-007	IT-25	UI部品	P3	UI部品の操作結果確認	JS 挙動を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	入力画面ではテンプレート select の変更時に hidden の mode を change にしてフォーム自動送信すること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-008	IT-25	UI部品	P3	UI部品の操作結果確認	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	確認画面の本文は white-space: pre-wrap の静的ブロックで折り返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-009	IT-25	操作起点	P1	操作起点の操作結果確認	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート候補の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレート候補を確認する
3. 画面表示と後続状態を確認する"	dtb_mail_template で自動送信ではない行のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	送信メールを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信メールの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信メール
3. 画面表示と後続状態を確認する"	プレーン文本のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	テンプレ選択を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレ選択
3. 画面表示と後続状態を確認する"	マスタ選択のプレースホルダ（未選択）であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	フィールドキーは subjectであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本文を確認する
3. 画面表示と後続状態を確認する"	フィールドキーは bodyであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-014	IT-03	外部画面	P2	外部画面の操作結果確認	買取IDが存在しないを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取IDが存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	GET／POST ともリポジトリ取得でヒットしなければ HTTP 404であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	テンプレート Twig が見つからない／実行時エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート Twig が見つからない／実行時エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレート Twig が見つからない／実行時エラー
3. 画面表示と後続状態を確認する"	本文は空文字になり警告ログのみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	買取メール送信元アドレス未設定を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取メール送信元アドレス未設定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取メール送信元アドレス未設定
3. 画面表示と後続状態を確認する"	送信しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	SMTP 等で送信失敗を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でSMTP 等で送信失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. SMTP 等で送信失敗
3. 画面表示と後続状態を確認する"	送信しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	件名が255文字超（履歴保存時）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名が255文字超（履歴保存時）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件名が255文字超（履歴保存時）
3. 画面表示と後続状態を確認する"	DB 制約により例外になりうるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	一覧・詳細との表示差を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で一覧・詳細との表示差の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧・詳細との表示差を確認する
3. 画面表示と後続状態を確認する"	買取番号表示はいずれも同一のゼロ埋め規則でよむであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	メール履歴を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でメール履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. メール履歴を確認する
3. 画面表示と後続状態を確認する"	送信が成功した場合のみ履歴行が増える実装であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	成功時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	入力・確認画面は HTMLであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	失敗時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	検証エラー時は入力 HTML とフォームエラーであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-023	IT-25	URL	P2	URLの操作結果確認	副作用を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	条件が整えばメール送信とメール履歴 INSERT、成功フラッシュ、Doctrine の永続化キューへの追加であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	登録/更新を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 本文を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	未ログインの一般利用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 未ログインの一般利用者を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	管理画面にログインできる運用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 管理画面にログインできる運用者を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	入力で確認に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 入力で確認に成功
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	確認で送信に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 確認で送信に成功
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	送信処理が実質スキップされてもコントローラがリダイレクトに入った場合を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信処理が実質スキップされてもコントローラがリダイレクトに入った場合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信処理が実質スキップされてもコントローラがリダイレクトに入った場合
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	確認から戻るリンクを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認から戻るリンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認から戻るリンクを確認する
3. 画面表示と後続状態を確認する"	POST の応答として入力 HTMLであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	送信完了後の詳細編集を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信完了後の詳細編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信完了後の詳細編集
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	フォーム検証エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でフォーム検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム検証エラーを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	Twig 読込不可やテンプレート実行時例外（変更モード）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でTwig 読込不可やテンプレート実行時例外（変更モード）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Twig 読込不可やテンプレート実行時例外（変更モード）
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	買取メール送信元未設定／送信例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 買取メール送信元未設定／送信例外
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	テンプレート本文生成の Twig 問題を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. テンプレート本文生成の Twig 問題を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	送信元オプション欠如を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 送信元オプション欠如
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	送信トランスポート例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 送信トランスポート例外
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	送信成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信成功
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	検索条件を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索条件
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	ネット買取一覧の行メニュー「メール通知」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でネット買取一覧の行メニュー「メール通知」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ネット買取一覧の行メニュー「メール通知」を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	入力画面で「確認」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力画面で「確認」
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	確認画面で「送信」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 確認画面で「送信」
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	確認画面で「手動メール通知入力画面に戻る」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 確認画面で「手動メール通知入力画面に戻る」
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	存在しない買取IDで開くを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 存在しない買取IDで開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. テンプレート候補を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	テンプレ選択を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. テンプレ選択
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 本文を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	買取IDが存在しないを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 買取IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	テンプレート Twig が見つからない／実行時エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. テンプレート Twig が見つからない／実行時エラー
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	買取メール送信元アドレス未設定を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 買取メール送信元アドレス未設定
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-056	IT-22	必須制御	P1	必須制御の入力検証	SMTP 等で送信失敗を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. SMTP 等で送信失敗
3. 画面表示と後続状態を確認する"	送信しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-057	IT-23	検索条件	P2	検索時の検索条件確認	一覧・詳細との表示差を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-058	IT-23	検索条件	P2	検索時の検索条件確認	メール履歴を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-059	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入力・確認画面は HTMLであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-060	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-061	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-062	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-063	IT-23	検索条件	P2	検索時の検索条件確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-064	IT-23	検索条件	P2	検索時の検索条件確認	未ログインの一般利用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-065	IT-23	検索条件	P2	検索時の検索条件確認	管理画面にログインできる運用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-066	IT-23	検索条件	P2	検索時の検索条件確認	入力で確認に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力で確認に成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-067	IT-23	検索条件	P2	検索時の検索条件確認	確認で送信に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認で送信に成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-068	IT-23	検索条件	P2	検索時の検索条件確認	送信処理が実質スキップされてもコントローラがリダイレクトに入った場合を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信処理が実質スキップされてもコントローラがリダイレクトに入った場合の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-069	IT-23	検索条件	P2	検索時の検索条件確認	確認から戻るリンクを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認から戻るリンクの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-070	IT-23	検索条件	P2	検索時の検索条件確認	送信完了後の詳細編集を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信完了後の詳細編集の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	詳細画面でフラッシュメッセージが表示されるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-071	IT-23	検索条件	P2	検索時の検索条件確認	フォーム検証エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でフォーム検証エラーの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-072	IT-23	検索条件	P2	検索時の検索条件確認	Twig 読込不可やテンプレート実行時例外（変更モード）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でTwig 読込不可やテンプレート実行時例外（変更モード）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-073	IT-23	実行結果	P2	検索時の実行結果確認	買取メール送信元未設定／送信例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取メール送信元未設定／送信例外の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-074	IT-23	実行結果	P2	検索時の実行結果確認	テンプレート本文生成の Twig 問題を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート本文生成の Twig 問題の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	警告ログに例外メッセージ文字列であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-075	IT-23	実行結果	P2	検索時の実行結果確認	送信元オプション欠如を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信元オプション欠如の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-076	IT-23	実行結果	P2	検索時の実行結果確認	送信トランスポート例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信トランスポート例外の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-077	IT-23	実行結果	P2	検索時の実行結果確認	送信成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-078	IT-26	登録内容	P1	登録時の登録内容確認	検索条件を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-079	IT-26	登録内容	P1	登録時の登録内容確認	ネット買取一覧の行メニュー「メール通知」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でネット買取一覧の行メニュー「メール通知」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-080	IT-26	登録内容	P1	登録時の登録内容確認	入力画面で「確認」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力画面で「確認」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-081	IT-26	登録内容	P1	登録時の登録内容確認	確認画面で「送信」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「送信」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証に成功するとメール送信処理が呼ばれ、翻訳キー admin.order.mail_send_complete の成功フラッシュ付きで詳細編集へリダイレクトすること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-082	IT-26	登録内容	P1	登録時の登録内容確認	確認画面で「手動メール通知入力画面に戻る」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「手動メール通知入力画面に戻る」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	コントローラに back 専用分岐は無いが、フォーム POST のまま入力テンプレートへレンダリングされ、入力内容は維持されるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-083	IT-23	登録内容	P1	登録時の登録内容確認	存在しない買取IDで開くを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で存在しない買取IDで開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 404 を返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-084	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ページ見出しは翻訳キーで「買取管理」「手動メール通知」であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-085	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入力画面ではテンプレート select の変更時に hidden の mode を change にしてフォーム自動送信すること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-086	IT-26	登録内容	P1	登録時の登録内容確認	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	確認画面の本文は white-space: pre-wrap の静的ブロックで折り返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-087	IT-26	登録内容	P1	登録時の登録内容確認	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート候補の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_mail_template で自動送信ではない行のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-088	IT-26	登録内容	P1	登録時の登録内容確認	送信メールを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信メールの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	プレーン文本のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-089	IT-26	登録内容	P1	登録時の登録内容確認	テンプレ選択を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-090	IT-26	登録内容	P1	登録時の登録内容確認	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
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
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 元設計HTMLに該当する処理・I/Fがないため |
| メール処理 / メール処理 / メール編集（IT-28） | 元設計HTMLに該当する処理・I/Fがないため |
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
