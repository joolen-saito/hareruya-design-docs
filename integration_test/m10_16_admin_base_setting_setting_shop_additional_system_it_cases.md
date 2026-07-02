# 追加システム設定（HareruyaEcプラグイン） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m10-16_admin_base_setting_setting_shop_additional_system.html`

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
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-001	IT-15	CSRF	P1	CSRFの結合確認	追加システム設定を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で追加システム設定の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	画面タイトルおよびサイドメニュー表示名であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-002	IT-15	未認証	P1	未認証の結合確認	利用者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で利用者の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	本機能では管理者アカウント（dtb_member 由来のログイン主体）を指すであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-003	IT-15	対象データ	P1	対象データの結合確認	管理画面ナビから当機能を開くを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で管理画面ナビから当機能を開くの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	mtb_option を全件読み込み、論理キーから連想配列を組み立てたうえでフォームに現在値が表示されるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-004	IT-20	出力抑止	P1	出力抑止の結合確認	値を入力して「設定」を押す（検証成功）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証成功）の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	変更のあったキーについて option_value と最終更新者相当の member_id が更新され、成功メッセージの後に同一画面を GET で開き直す遷移となること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-005	IT-20	識別子	P1	識別子の結合確認	値を入力して「設定」を押す（検証失敗）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証失敗）の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存は行わず、同一テンプレートを再描画してフィールドエラーを表示すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-006	IT-15	状態変化	P1	状態変化の結合確認	CSRF 検証に失敗するを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRF 検証に失敗するの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	Symfony のアクセス拒否（HTTP 403）が投げられる実装である（表示文言やHTTPコードはフレームワークとエラーハンドラを正とする）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-007	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	{% block title %} は「追加システム設定」であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-008	IT-25	UI部品	P3	UI部品の操作結果確認	CSS・レイアウトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	Form/config_layout.html.twig が bootstrap_3_horizontal_layout を継承すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-009	IT-25	操作起点	P1	操作起点の操作結果確認	モーダル・ポップアップを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能ではモーダルや確認ダイアログは用いないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	送信を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信
3. 画面表示と後続状態を確認する"	"method=""post""、アクションは GET で画面を開くのと同じパスを指す生成URL（メソッドのみ POST で別ハンドラにつながる構成）であること。"
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	買取査定申込み完了画面の自動遷移秒数を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で買取査定申込み完了画面の自動遷移秒数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取査定申込み完了画面の自動遷移秒数を確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	スマレジへの送信URLを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でスマレジへの送信URLの確認に必要な条件を指定する	"1. 対象画面を表示する
2. スマレジへの送信URL
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	スマレジ通信エラー送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でスマレジ通信エラー送信メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. スマレジ通信エラー送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-014	IT-03	外部画面	P2	外部画面の操作結果確認	入荷通知メールの許可を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で入荷通知メールの許可の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入荷通知メールの許可を確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	固定価格商品部門IDを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で固定価格商品部門IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 固定価格商品部門IDを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	買取部門集計送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で買取部門集計送信メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取部門集計送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	必須項目が空欄である会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須項目が空欄である会員送信メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 必須項目が空欄である会員送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	ポイント利用が反映されない決済の送信先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でポイント利用が反映されない決済の送信先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ポイント利用が反映されない決済の送信先メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	ポイント差分発生通知メールを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でポイント差分発生通知メールの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ポイント差分発生通知メールを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	支店システム連携エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で支店システム連携エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 支店システム連携エラー通知先メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	購入処理エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で購入処理エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 購入処理エラー通知先メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	イベント決済確認エラー通知メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でイベント決済確認エラー通知メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. イベント決済確認エラー通知メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-023	IT-25	URL	P2	URLの操作結果確認	身分証の有効期限切れ会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で身分証の有効期限切れ会員送信メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 身分証の有効期限切れ会員送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	フォームに存在するキーが findAll() の結果に無いを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. フォームに存在するキーが findAll() の結果に無いを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	送信値と現行値が文字列として同一を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 送信値と現行値が文字列として同一
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	複数管理者が短時間に順に保存を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 複数管理者が短時間に順に保存
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	update_date 列を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. update_date 列を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照側との一致を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 参照側との一致を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	文字列としての比較を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 文字列としての比較を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	成功時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	失敗時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	同一レスポンスでフィールドエラー表示であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でmtb_optionの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_optionを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録/更新を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	CSRFを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSRFを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	管理画面に入れた管理者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 管理画面に入れた管理者を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保存成功を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 保存成功
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保存失敗を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存失敗
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	保存成功→リダイレクトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存成功→リダイレクトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存成功→リダイレクト
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	追加システム設定を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で追加システム設定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 追加システム設定を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	利用者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 利用者を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	管理画面ナビから当機能を開くを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 管理画面ナビから当機能を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	値を入力して「設定」を押す（検証成功）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 値を入力して「設定」を押す（検証成功）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	値を入力して「設定」を押す（検証失敗）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 値を入力して「設定」を押す（検証失敗）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSRF 検証に失敗するを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRF 検証に失敗するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSRF 検証に失敗するを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSS・レイアウトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-049	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	買取査定申込み完了画面の自動遷移秒数を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 買取査定申込み完了画面の自動遷移秒数を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	スマレジへの送信URLを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. スマレジへの送信URL
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	スマレジ通信エラー送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. スマレジ通信エラー送信メールアドレス
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入荷通知メールの許可を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 入荷通知メールの許可を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-053	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	固定価格商品部門IDを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 固定価格商品部門IDを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	買取部門集計送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 買取部門集計送信メールアドレス
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-055	IT-22	必須制御	P1	必須制御の入力検証	必須項目が空欄である会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 必須項目が空欄である会員送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-056	IT-26	登録内容	P1	登録時の登録内容確認	ポイント差分発生通知メールを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でポイント差分発生通知メールの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-057	IT-26	登録内容	P1	登録時の登録内容確認	支店システム連携エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で支店システム連携エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-058	IT-26	登録内容	P1	登録時の登録内容確認	購入処理エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で購入処理エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-059	IT-26	登録内容	P1	登録時の登録内容確認	イベント決済確認エラー通知メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でイベント決済確認エラー通知メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-060	IT-26	登録内容	P1	登録時の登録内容確認	身分証の有効期限切れ会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で身分証の有効期限切れ会員送信メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-061	IT-23	登録内容	P1	登録時の登録内容確認	フォームに存在するキーが findAll() の結果に無いを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でフォームに存在するキーが findAll() の結果に無いの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存ループの対象外となり、INSERT は行わないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-062	IT-26	登録内容	P1	登録時の登録内容確認	送信値と現行値が文字列として同一を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で送信値と現行値が文字列として同一の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	persist しない（member_id も更新しない）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-063	IT-26	登録内容	P1	登録時の登録内容確認	複数管理者が短時間に順に保存を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で複数管理者が短時間に順に保存の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	楽観ロックは無いであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-064	IT-26	登録内容	P1	登録時の登録内容確認	update_date 列を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でupdate_date 列の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当コントローラは option_value と member_id のみ更新対象として明示していること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-065	IT-26	登録内容	P1	登録時の登録内容確認	参照側との一致を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で参照側との一致の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メール送信や受注画面などは各リクエストで mtb_option を読み直す実装が多く、保存後の次リクエストでは更新値が見えるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-066	IT-26	登録内容	P1	登録時の登録内容確認	文字列としての比較を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列としての比較の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	整数フィールドでも保存判定は文字列キャスト後であるため、0 と 00 のような差が入力経路で生じた場合のみ更新扱いになりうるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-067	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で成功時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-068	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-069	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-070	IT-26	登録内容	P1	登録時の登録内容確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-071	IT-26	登録内容	P1	登録時の登録内容確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-072	IT-26	登録内容	P1	登録時の登録内容確認	登録/更新を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録/更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-073	IT-26	実行結果	P1	登録時の実行結果確認	CSRFを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRFの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-074	IT-23	実行結果	P1	登録時の実行結果確認	管理画面に入れた管理者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で管理画面に入れた管理者の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当パスが権限拒否や IP 制限に該当しない限り、表示・保存が可能であることを前提とする（プラグイン側に個別 Voter は無く、管理画面配下の共通セキュリティに依拠する実装である）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-075	IT-26	更新内容	P1	更新時の更新内容確認	保存成功を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存成功の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-076	IT-26	更新内容	P1	更新時の更新内容確認	保存失敗を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存失敗の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-077	IT-26	更新内容	P1	更新時の更新内容確認	保存成功→リダイレクトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存成功→リダイレクトの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-078	IT-26	更新内容	P1	更新時の更新内容確認	追加システム設定を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で追加システム設定の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面タイトルおよびサイドメニュー表示名であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-079	IT-26	更新内容	P1	更新時の更新内容確認	利用者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で利用者の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	本機能では管理者アカウント（dtb_member 由来のログイン主体）を指すであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-080	IT-23	更新内容	P1	更新時の更新内容確認	管理画面ナビから当機能を開くを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で管理画面ナビから当機能を開くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_option を全件読み込み、論理キーから連想配列を組み立てたうえでフォームに現在値が表示されるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-081	IT-26	更新内容	P1	更新時の更新内容確認	値を入力して「設定」を押す（検証成功）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証成功）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	変更のあったキーについて option_value と最終更新者相当の member_id が更新され、成功メッセージの後に同一画面を GET で開き直す遷移となること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-082	IT-26	更新内容	P1	更新時の更新内容確認	値を入力して「設定」を押す（検証失敗）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証失敗）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存は行わず、同一テンプレートを再描画してフィールドエラーを表示すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-083	IT-26	更新内容	P1	更新時の更新内容確認	CSRF 検証に失敗するを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRF 検証に失敗するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	Symfony のアクセス拒否（HTTP 403）が投げられる実装である（表示文言やHTTPコードはフレームワークとエラーハンドラを正とする）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-084	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	{% block title %} は「追加システム設定」であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-085	IT-26	更新内容	P1	更新時の更新内容確認	CSS・レイアウトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSS・レイアウトの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	Form/config_layout.html.twig が bootstrap_3_horizontal_layout を継承すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-086	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-087	IT-26	更新内容	P1	更新時の更新内容確認	送信を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-088	IT-26	更新内容	P1	更新時の更新内容確認	買取査定申込み完了画面の自動遷移秒数を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-089	IT-26	更新内容	P1	更新時の更新内容確認	スマレジへの送信URLを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-090	IT-26	更新内容	P1	更新時の更新内容確認	スマレジ通信エラー送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
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
