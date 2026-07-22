# m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-04_admin_online_purchase_purchase_manual_mail.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ |
| IT-11 | 実行結果 |
| IT-28 | ヘッダ、件名、実行結果、本文 |
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
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	入力画面ではテンプレート select の変更時に hidden の mode を change にしてフォーム自動送信すること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	確認画面の本文は white-space: pre-wrap の静的ブロックで折り返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-009	IT-25	URL	P2	URLの操作結果確認	M07-04-MSG-001を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でM07-04-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M07-04-MSG-001を確認する
3. 画面表示と後続状態を確認する"	POST mode=completeでフォームが送信済み・有効、かつtemplateがMailTemplateであるときであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. テンプレート候補を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	送信メールを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 送信メール
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	テンプレ選択を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレ選択
3. 画面表示と後続状態を確認する"	マスタ選択のプレースホルダ（未選択）であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 本文を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	買取IDが存在しないを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 買取IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	テンプレート Twig が見つからない／実行時エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. テンプレート Twig が見つからない／実行時エラー
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	買取メール送信元アドレス未設定を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 買取メール送信元アドレス未設定
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	SMTP 等で送信失敗を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. SMTP 等で送信失敗
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-019	IT-22	部分入力	P2	部分入力の入力検証	件名が255文字超（履歴保存時）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名が255文字超（履歴保存時）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件名が255文字超（履歴保存時）
3. 画面表示と後続状態を確認する"	DB 制約により例外になりうるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-020	IT-23	検索条件	P2	検索時の検索条件確認	一覧・詳細との表示差を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-021	IT-23	検索条件	P2	検索時の検索条件確認	メール履歴を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-022	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-023	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-024	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-025	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-026	IT-23	検索条件	P2	検索時の検索条件確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-027	IT-23	検索条件	P2	検索時の検索条件確認	未ログインの一般利用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-028	IT-23	検索条件	P2	検索時の検索条件確認	管理画面にログインできる運用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で管理画面にログインできる運用者の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-029	IT-23	検索条件	P2	検索時の検索条件確認	入力で確認に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力で確認に成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-030	IT-23	検索条件	P2	検索時の検索条件確認	確認で送信に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認で送信に成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-031	IT-23	検索条件	P2	検索時の検索条件確認	送信処理が実質スキップされてもコントローラがリダイレクトに入った場合を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信処理が実質スキップされてもコントローラがリダイレクトに入った場合の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-032	IT-23	検索条件	P2	検索時の検索条件確認	確認から戻るリンクを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認から戻るリンクの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-033	IT-23	検索条件	P2	検索時の検索条件確認	送信完了後の詳細編集を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信完了後の詳細編集の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-034	IT-23	実行結果	P2	検索時の実行結果確認	フォーム検証エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でフォーム検証エラーの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-035	IT-23	実行結果	P2	検索時の実行結果確認	Twig 読込不可やテンプレート実行時例外（変更モード）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でTwig 読込不可やテンプレート実行時例外（変更モード）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-036	IT-23	実行結果	P2	検索時の実行結果確認	買取メール送信元未設定／送信例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取メール送信元未設定／送信例外の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-037	IT-23	実行結果	P2	検索時の実行結果確認	テンプレート本文生成の Twig 問題を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート本文生成の Twig 問題の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-038	IT-26	登録内容	P1	登録時の登録内容確認	送信元オプション欠如を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信元オプション欠如の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-039	IT-26	登録内容	P1	登録時の登録内容確認	送信トランスポート例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信トランスポート例外の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-040	IT-26	登録内容	P1	登録時の登録内容確認	送信成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信成功の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-041	IT-26	登録内容	P1	登録時の登録内容確認	ネット買取一覧の行メニュー「メール通知」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でネット買取一覧の行メニュー「メール通知」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	手動メール入力画面が開くこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-042	IT-26	登録内容	P1	登録時の登録内容確認	入力画面で「確認」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力画面で「確認」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-043	IT-26	登録内容	P1	登録時の登録内容確認	確認画面で「送信」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-044	IT-26	登録内容	P1	登録時の登録内容確認	確認画面で「手動メール通知入力画面に戻る」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-045	IT-26	登録内容	P1	登録時の登録内容確認	存在しない買取IDで開くを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-046	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-047	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-048	IT-26	実行結果	P1	登録時の実行結果確認	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-049	IT-23	実行結果	P1	登録時の実行結果確認	M07-04-MSG-001を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でM07-04-MSG-001の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	POST mode=completeでフォームが送信済み・有効、かつtemplateがMailTemplateであるときであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-050	IT-26	更新内容	P1	更新時の更新内容確認	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート候補の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-051	IT-26	更新内容	P1	更新時の更新内容確認	送信メールを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信メールの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-052	IT-26	更新内容	P1	更新時の更新内容確認	テンプレ選択を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-053	IT-26	更新内容	P1	更新時の更新内容確認	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フィールドキーは subjectであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-054	IT-26	更新内容	P1	更新時の更新内容確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-055	IT-26	更新内容	P1	更新時の更新内容確認	買取IDが存在しないを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-056	IT-26	更新内容	P1	更新時の更新内容確認	テンプレート Twig が見つからない／実行時エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-057	IT-26	更新内容	P1	更新時の更新内容確認	買取メール送信元アドレス未設定を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-058	IT-26	更新内容	P1	更新時の更新内容確認	SMTP 等で送信失敗を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-059	IT-26	更新内容	P1	更新時の更新内容確認	件名が255文字超（履歴保存時）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名が255文字超（履歴保存時）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-060	IT-05	実行結果	P1	更新時の実行結果確認	一覧・詳細との表示差を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で一覧・詳細との表示差の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-061	IT-05	実行結果	P1	更新時の実行結果確認	メール履歴を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でメール履歴の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	送信が成功した場合のみ履歴行が増える実装であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-062	IT-02	初期行数	P2	初期行数の結合確認	成功時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	入力・確認画面は HTMLであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-063	IT-02	表示順	P2	表示順の結合確認	失敗時出力を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	検証エラー時は入力 HTML とフォームエラーであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-064	IT-25	更新抑止	P1	更新抑止の結合確認	副作用を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で副作用の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	条件が整えばメール送信とメール履歴 INSERT、成功フラッシュ、Doctrine の永続化キューへの追加であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-065	IT-12	内部情報	P1	内部情報の結合確認	登録/更新を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で登録/更新の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-066	IT-15	機密情報	P1	機密情報の結合確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	NotBlankであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-067	IT-11	実行結果	P2	実行結果の結合確認	未ログインの一般利用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で未ログインの一般利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインの一般利用者を確認する
3. 画面表示と後続状態を確認する"	管理画面ファイアウォールにより当パスへ到達しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-068	IT-28	実行結果	P2	実行結果の結合確認	管理画面にログインできる運用者を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で管理画面にログインできる運用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面にログインできる運用者を確認する
3. 画面表示と後続状態を確認する"	当ルートに追加のアノテーション制約は無く、管理領域へ入れる主体であれば利用できる実装であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-069	IT-28	実行結果	P2	実行結果の結合確認	入力で確認に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力で確認に成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力で確認に成功
3. 画面表示と後続状態を確認する"	同一 URL の POST 応答として確認 HTMLであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-070	IT-28	ヘッダ	P2	ヘッダの結合確認	確認で送信に成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認で送信に成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認で送信に成功
3. 画面表示と後続状態を確認する"	/{admin_route}/purchase/{id}/edit へのリダイレクトであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-071	IT-28	件名	P2	件名の結合確認	送信処理が実質スキップされてもコントローラがリダイレクトに入った場合を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 送信処理が実質スキップされてもコントローラがリダイレクトに入った場合
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-072	IT-28	件名	P2	件名の結合確認	確認から戻るリンクを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 確認から戻るリンクを確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-073	IT-28	件名	P2	件名の結合確認	送信完了後の詳細編集を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信完了後の詳細編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信完了後の詳細編集
3. 画面表示と後続状態を確認する"	詳細画面でフラッシュメッセージが表示されるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-074	IT-28	本文	P2	本文の結合確認	フォーム検証エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. フォーム検証エラーを確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-075	IT-28	本文	P2	本文の結合確認	Twig 読込不可やテンプレート実行時例外（変更モード）を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. Twig 読込不可やテンプレート実行時例外（変更モード）
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-076	IT-28	本文	P2	本文の結合確認	買取メール送信元未設定／送信例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取メール送信元未設定／送信例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取メール送信元未設定／送信例外
3. 画面表示と後続状態を確認する"	メール送信サービスが致命ログのみで終了であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-077	IT-28	本文	P2	本文の結合確認	テンプレート本文生成の Twig 問題を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート本文生成の Twig 問題の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレート本文生成の Twig 問題を確認する
3. 画面表示と後続状態を確認する"	警告ログに例外メッセージ文字列であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-078	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	送信元オプション欠如を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信元オプション欠如の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信元オプション欠如
3. 画面表示と後続状態を確認する"	致命ログに論理キー名を含むメッセージであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-079	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	送信トランスポート例外を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信トランスポート例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信トランスポート例外
3. 画面表示と後続状態を確認する"	致命ログに例外メッセージであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-080	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	送信成功を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信成功
3. 画面表示と後続状態を確認する"	情報ログに買取IDであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-081	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ネット買取一覧の行メニュー「メール通知」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でネット買取一覧の行メニュー「メール通知」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ネット買取一覧の行メニュー「メール通知」を確認する
3. 画面表示と後続状態を確認する"	手動メール入力画面が開くこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	入力画面で「確認」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で入力画面で「確認」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力画面で「確認」
3. 画面表示と後続状態を確認する"	検証に成功すると確認画面が返るであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-083	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	確認画面で「送信」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「送信」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認画面で「送信」
3. 画面表示と後続状態を確認する"	検証に成功するとメール送信処理が呼ばれ、翻訳キー admin.order.mail_send_complete の成功フラッシュ付きで詳細編集へリダイレクトすること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-084	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	確認画面で「手動メール通知入力画面に戻る」を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で確認画面で「手動メール通知入力画面に戻る」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認画面で「手動メール通知入力画面に戻る」
3. 画面表示と後続状態を確認する"	コントローラに back 専用分岐は無いが、フォーム POST のまま入力テンプレートへレンダリングされ、入力内容は維持されるであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-085	IT-25	一覧	P2	一覧の結合確認	存在しない買取IDで開くを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で存在しない買取IDで開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 存在しない買取IDで開く
3. 画面表示と後続状態を確認する"	HTTP 404 を返すこと。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-086	IT-12	画面表示データ	P2	画面表示データの結合確認	表示要素を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-087	IT-12	画面表示データ	P2	画面表示データの結合確認	CSS・レイアウトを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-088	IT-25	フォーム送信	P1	フォーム送信の結合確認	テンプレート候補を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート候補の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレート候補を確認する
3. 画面表示と後続状態を確認する"	dtb_mail_template で自動送信ではない行のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-089	IT-16	ファイル選択	P2	ファイル選択の結合確認	送信メールを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で送信メールの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信メール
3. 画面表示と後続状態を確認する"	プレーン文本のみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-090	IT-12	エラー継続	P3	エラー継続の結合確認	件名を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で件名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	フィールドキーは subjectであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-091	IT-25	件数上限	P2	件数上限の結合確認	本文を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で本文の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本文を確認する
3. 画面表示と後続状態を確認する"	フィールドキーは bodyであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-092	IT-25	欠損値	P2	欠損値の結合確認	買取IDが存在しないを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取IDが存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	GET／POST ともリポジトリ取得でヒットしなければ HTTP 404であること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-093	IT-25	データなし	P2	データなしの結合確認	テンプレート Twig が見つからない／実行時エラーを試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）でテンプレート Twig が見つからない／実行時エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレート Twig が見つからない／実行時エラー
3. 画面表示と後続状態を確認する"	本文は空文字になり警告ログのみであること。
m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）	IT-M07-04-ADMIN-ONLINE-PURCHASE-PURCHASE-MANUAL-MAIL-094	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	買取メール送信元アドレス未設定を試験できる状態である	m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知）（m07_04_admin_online_purchase_purchase_manual_mail）で買取メール送信元アドレス未設定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取メール送信元アドレス未設定
3. 画面表示と後続状態を確認する"	送信しないこと。
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
| その他 | 同種の対象外観点 2 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 6件 — No.109, No.110, No.111, No.357, No.359, No.385。上限緩和または個別ケース化で収載可能。
