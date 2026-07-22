# 店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m10-08_admin_base_setting_setting_shop_auto_mail.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、フォーム送信、一覧、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-11 | 実行結果 |
| IT-28 | ヘッダ、件名、実行結果、本文 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-001	IT-15	CSRF	P1	CSRFの結合確認	削除方式を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除方式の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	del_flg 列は無いであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-002	IT-15	未認証	P1	未認証の結合確認	自動送信対象の判定を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で自動送信対象の判定の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_mail_template.is_auto_send（真偽型、自動送信フラグ）で判定であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-003	IT-15	対象データ	P1	対象データの結合確認	名称・本文ファイル・ヘッダー・フッター・作成者・作成更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で名称・本文ファイル・ヘッダー・フッター・作成者・作成更新の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同名（dtb_mail_template 上で一致）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-004	IT-20	出力抑止	P1	出力抑止の結合確認	メールテンプレート行を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でメールテンプレート行の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_mail_template の1行であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-005	IT-20	識別子	P1	識別子の結合確認	自動送信対象テンプレートを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で自動送信対象テンプレートの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	HareruyaEc の MailTemplate::AUTO_SEND_MAILS に含まれるテンプレート識別子の集合であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-006	IT-15	状態変化	P1	状態変化の結合確認	管理者を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で管理者の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理画面にログインした利用者であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	管理ナビの「店舗設定」配下から「自動送信メール」を開くを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で管理ナビの「店舗設定」配下から「自動送信メール」を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理ナビの「店舗設定」配下から「自動送信メール」を開く
3. 画面表示と後続状態を確認する"	テンプレ選択のセレクトと、名称・件名、本文プレビュー用ボックス、登録ボタンが表示されるであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	テンプレ選択を変更するを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択を変更するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレ選択を変更する
3. 画面表示と後続状態を確認する"	ページ全体が選択した識別子付きの編集表示へ遷移する（同一機能内の別テンプレ編集状態）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-009	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	値を入力して「登録」を押すを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 値を入力して「登録」を押す
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	自動送信対象外の識別子をURL等で直接指定するを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 自動送信対象外の識別子をURL等で直接指定する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-011	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ページタイトル「ショップ設定」、サブタイトル「メール管理」であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-012	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSS・レイアウトを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	テンプレ選択を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. テンプレ選択
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	AUTO_SEND_MAILS に含まれない識別子で開くを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. AUTO_SEND_MAILS に含まれない識別子で開く
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	POSTで現在行nullを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. POSTで現在行nullを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-016	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	一覧との一致を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	本文ファイルとの関係を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 本文ファイルとの関係を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-018	IT-22	部分入力	P2	部分入力の入力検証	同時更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	楽観ロックは持たないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-019	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-020	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-021	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-022	IT-23	検索条件	P2	検索時の検索条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-023	IT-23	検索条件	P2	検索時の検索条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-024	IT-23	検索条件	P2	検索時の検索条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-025	IT-23	検索条件	P2	検索時の検索条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-026	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録/更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-027	IT-23	実行結果	P2	検索時の実行結果確認	CSRFを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でCSRFの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-028	IT-23	実行結果	P2	検索時の実行結果確認	ログイン済みで IP 制限内を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でログイン済みで IP 制限内の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-029	IT-23	実行結果	P2	検索時の実行結果確認	テンプレ選択を変更を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択を変更の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-030	IT-23	実行結果	P2	検索時の実行結果確認	登録成功を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-031	IT-26	登録内容	P1	登録時の登録内容確認	POSTかつ編集中行なしを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でPOSTかつ編集中行なしの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-032	IT-26	登録内容	P1	登録時の登録内容確認	登録成功リダイレクトを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録成功リダイレクトの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-033	IT-26	登録内容	P1	登録時の登録内容確認	フォーム検証エラーを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でフォーム検証エラーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-034	IT-26	登録内容	P1	登録時の登録内容確認	M10-08-MSG-001を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でM10-08-MSG-001の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	店舗設定／自動送信メールテンプレート編集画面に遷移すること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-035	IT-26	登録内容	P1	登録時の登録内容確認	削除方式を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除方式の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-036	IT-26	登録内容	P1	登録時の登録内容確認	自動送信対象の判定を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-037	IT-26	登録内容	P1	登録時の登録内容確認	名称・本文ファイル・ヘッダー・フッター・作成者・作成更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-038	IT-26	登録内容	P1	登録時の登録内容確認	メールテンプレート行を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-039	IT-26	登録内容	P1	登録時の登録内容確認	自動送信対象テンプレートを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-040	IT-26	登録内容	P1	登録時の登録内容確認	管理者を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で管理者の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-041	IT-26	実行結果	P1	登録時の実行結果確認	管理ナビの「店舗設定」配下から「自動送信メール」を開くを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で管理ナビの「店舗設定」配下から「自動送信メール」を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-042	IT-23	実行結果	P1	登録時の実行結果確認	テンプレ選択を変更するを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択を変更するの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ページ全体が選択した識別子付きの編集表示へ遷移する（同一機能内の別テンプレ編集状態）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-043	IT-26	更新内容	P1	更新時の更新内容確認	値を入力して「登録」を押すを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で値を入力して「登録」を押すの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-044	IT-26	更新内容	P1	更新時の更新内容確認	自動送信対象外の識別子をURL等で直接指定するを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で自動送信対象外の識別子をURL等で直接指定するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-045	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-046	IT-26	更新内容	P1	更新時の更新内容確認	CSS・レイアウトを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面標準の横型フォーム（Bootstrap 3 horizontal）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-047	IT-26	更新内容	P1	更新時の更新内容確認	テンプレ選択を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-048	IT-26	更新内容	P1	更新時の更新内容確認	AUTO_SEND_MAILS に含まれない識別子で開くを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-049	IT-26	更新内容	P1	更新時の更新内容確認	POSTで現在行nullを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-050	IT-26	更新内容	P1	更新時の更新内容確認	一覧との一致を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-051	IT-26	更新内容	P1	更新時の更新内容確認	本文ファイルとの関係を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-052	IT-26	更新内容	P1	更新時の更新内容確認	同時更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で同時更新の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-053	IT-05	実行結果	P1	更新時の実行結果確認	成功時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-054	IT-05	実行結果	P1	更新時の実行結果確認	失敗時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	再描画HTMLと項目エラー、もしくは404、もしくはCSRFエラーであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-055	IT-05	削除条件	P1	削除時の削除条件確認	副作用を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_mail_template の更新、Doctrineflush、Twigローダへのディレクトリ追加、ソフトデリートフィルタ設定の一時書き換えであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-056	IT-05	削除条件	P1	削除時の削除条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	テンプレ名称であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-057	IT-05	削除条件	P1	削除時の削除条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	本文Twigの論理パスであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-058	IT-05	削除条件	P1	削除時の削除条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	件名であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-059	IT-05	削除条件	P1	削除時の削除条件確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-060	IT-05	実行結果	P1	削除時の実行結果確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-061	IT-05	実行結果	P1	削除時の実行結果確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存成功時にログイン中管理者へ更新であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-062	IT-05	実行結果	P1	削除時の実行結果確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	自動送信フラグであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-063	IT-02	初期行数	P2	初期行数の結合確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_mail_templateを確認する
3. 画面表示と後続状態を確認する"	移行先のテンプレ識別キーであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-064	IT-02	表示順	P2	表示順の結合確認	dtb_mail_templateを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でdtb_mail_templateの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_mail_templateを確認する
3. 画面表示と後続状態を確認する"	保存成功時に現在日時へ更新であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-065	IT-25	更新抑止	P1	更新抑止の結合確認	登録/更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録/更新の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-066	IT-12	内部情報	P1	内部情報の結合確認	CSRFを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でCSRFの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	FormValidHelper で検証であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-067	IT-11	実行結果	P2	実行結果の結合確認	ログイン済みで IP 制限内を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でログイン済みで IP 制限内の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ログイン済みで IP 制限内を確認する
3. 画面表示と後続状態を確認する"	画面表示・保存が可能であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-068	IT-28	実行結果	P2	実行結果の結合確認	テンプレ選択を変更を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択を変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレ選択を変更
3. 画面表示と後続状態を確認する"	同一機能内の別識別子の編集表示（GET）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-069	IT-28	実行結果	P2	実行結果の結合確認	登録成功を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で登録成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録成功を確認する
3. 画面表示と後続状態を確認する"	同一識別子の編集表示（リダイレクトGET）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-070	IT-28	ヘッダ	P2	ヘッダの結合確認	POSTかつ編集中行なしを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でPOSTかつ編集中行なしの確認に必要な条件を指定する	"1. 対象画面を表示する
2. POSTかつ編集中行なしを確認する
3. 画面表示と後続状態を確認する"	識別子なしの初期表示へリダイレクトであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-071	IT-28	件名	P2	件名の結合確認	登録成功リダイレクトを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 登録成功リダイレクトを確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-072	IT-28	件名	P2	件名の結合確認	フォーム検証エラーを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. フォーム検証エラーを確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-073	IT-28	件名	P2	件名の結合確認	M10-08-MSG-001を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でM10-08-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M10-08-MSG-001を確認する
3. 画面表示と後続状態を確認する"	店舗設定／自動送信メールテンプレート編集画面に遷移すること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-074	IT-28	本文	P2	本文の結合確認	削除方式を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 削除方式
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-075	IT-28	本文	P2	本文の結合確認	自動送信対象の判定を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 自動送信対象の判定
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-076	IT-28	本文	P2	本文の結合確認	名称・本文ファイル・ヘッダー・フッター・作成者・作成更新を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で名称・本文ファイル・ヘッダー・フッター・作成者・作成更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 名称・本文ファイル・ヘッダー・フッター・作成者・作成更新を確認する
3. 画面表示と後続状態を確認する"	同名（dtb_mail_template 上で一致）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-077	IT-28	本文	P2	本文の結合確認	メールテンプレート行を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でメールテンプレート行の確認に必要な条件を指定する	"1. 対象画面を表示する
2. メールテンプレート行を確認する
3. 画面表示と後続状態を確認する"	dtb_mail_template の1行であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-078	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	自動送信対象テンプレートを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で自動送信対象テンプレートの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 自動送信対象テンプレート
3. 画面表示と後続状態を確認する"	HareruyaEc の MailTemplate::AUTO_SEND_MAILS に含まれるテンプレート識別子の集合であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-079	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	管理者を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で管理者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理者を確認する
3. 画面表示と後続状態を確認する"	管理画面にログインした利用者であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	値を入力して「登録」を押すを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で値を入力して「登録」を押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 値を入力して「登録」を押す
3. 画面表示と後続状態を確認する"	CSRFと入力検証に成功すればDBへ保存し、管理画面向け成功メッセージを積んだうえで、同じテンプレートの編集表示へリダイレクトすること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-081	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	自動送信対象外の識別子をURL等で直接指定するを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で自動送信対象外の識別子をURL等で直接指定するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 自動送信対象外の識別子をURL等で直接指定する
3. 画面表示と後続状態を確認する"	該当行が検索条件に合致しないため、見つからない扱いとなりブラウザには404相当の応答となること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-082	IT-25	一覧	P2	一覧の結合確認	CSS・レイアウトを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	管理画面標準の横型フォーム（Bootstrap 3 horizontal）であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-083	IT-12	画面表示データ	P2	画面表示データの結合確認	テンプレ選択を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でテンプレ選択の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テンプレ選択
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-084	IT-25	画面表示データ	P2	画面表示データの結合確認	AUTO_SEND_MAILS に含まれない識別子で開くを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でAUTO_SEND_MAILS に含まれない識別子で開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. AUTO_SEND_MAILS に含まれない識別子で開く
3. 画面表示と後続状態を確認する"	リポジトリ検索が空になり404であること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-085	IT-12	画面表示データ	P2	画面表示データの結合確認	POSTで現在行nullを試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）でPOSTで現在行nullの確認に必要な条件を指定する	"1. 対象画面を表示する
2. POSTで現在行nullを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-086	IT-25	画面表示データ	P2	画面表示データの結合確認	一覧との一致を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で一覧との一致の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	同一テーブルの行を直接更新すること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-087	IT-25	フォーム送信	P1	フォーム送信の結合確認	本文ファイルとの関係を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で本文ファイルとの関係の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本文ファイルとの関係を確認する
3. 画面表示と後続状態を確認する"	file_name は当画面の入力からは変更しないこと。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-088	IT-12	非同期更新	P1	非同期更新の結合確認	成功時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	リダイレクト応答と成功フラッシュメッセージであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-089	IT-12	エラー継続	P3	エラー継続の結合確認	失敗時出力を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	再描画HTMLと項目エラー、もしくは404、もしくはCSRFエラーであること。
店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）	IT-M10-08-ADMIN-BASE-SETTING-SETTING-SHOP-AUTO-MAIL-090	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	副作用を試験できる状態である	店舗設定／自動送信メールテンプレート編集（pf-eccube3 + HareruyaEc）（m10_08_admin_base_setting_setting_shop_auto_mail）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	dtb_mail_template の更新、Doctrineflush、Twigローダへのディレクトリ追加、ソフトデリートフィルタ設定の一時書き換えであること。
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
| ウェブアプリケーション / 一覧 / ページング（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| その他 | 同種の対象外観点 1 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 19件 — No.42, No.43, No.44, No.47, No.48, No.50, No.105, No.109, No.110, No.111, No.332, No.333, No.338, No.382, No.412, No.413, No.414, No.415, No.510。上限緩和または個別ケース化で収載可能。
