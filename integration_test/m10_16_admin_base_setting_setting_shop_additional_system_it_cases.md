# 追加システム設定（HareruyaEcプラグイン） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m10-16_admin_base_setting_setting_shop_additional_system.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-23 | 実行結果 |
| IT-05 | 実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-28 | 件名、実行結果、本文 |
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
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	{% block title %} は「追加システム設定」であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	CSS・レイアウトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	Form/config_layout.html.twig が bootstrap_3_horizontal_layout を継承すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-009	IT-25	URL	P2	URLの操作結果確認	モーダル・ポップアップを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能ではモーダルや確認ダイアログは用いないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	送信を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 送信
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	買取査定申込み完了画面の自動遷移秒数を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 買取査定申込み完了画面の自動遷移秒数を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	スマレジへの送信URLを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でスマレジへの送信URLの確認に必要な条件を指定する	"1. 対象画面を表示する
2. スマレジへの送信URL
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	スマレジ通信エラー送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. スマレジ通信エラー送信メールアドレス
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入荷通知メールの許可を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入荷通知メールの許可を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	固定価格商品部門IDを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 固定価格商品部門IDを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	買取部門集計送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 買取部門集計送信メールアドレス
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	必須項目が空欄である会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 必須項目が空欄である会員送信メールアドレス
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ポイント利用が反映されない決済の送信先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ポイント利用が反映されない決済の送信先メールアドレス
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-019	IT-22	部分入力	P2	部分入力の入力検証	ポイント差分発生通知メールを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でポイント差分発生通知メールの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ポイント差分発生通知メールを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-020	IT-26	登録内容	P1	登録時の登録内容確認	支店システム連携エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で支店システム連携エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-021	IT-26	登録内容	P1	登録時の登録内容確認	購入処理エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で購入処理エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-022	IT-26	登録内容	P1	登録時の登録内容確認	イベント決済確認エラー通知メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でイベント決済確認エラー通知メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-023	IT-26	登録内容	P1	登録時の登録内容確認	身分証の有効期限切れ会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で身分証の有効期限切れ会員送信メールアドレスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-024	IT-26	登録内容	P1	登録時の登録内容確認	フォームに存在するキーが findAll() の結果に無いを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でフォームに存在するキーが findAll() の結果に無いの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-025	IT-26	登録内容	P1	登録時の登録内容確認	送信値と現行値が文字列として同一を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-026	IT-26	登録内容	P1	登録時の登録内容確認	複数管理者が短時間に順に保存を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-027	IT-26	登録内容	P1	登録時の登録内容確認	update_date 列を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-028	IT-26	登録内容	P1	登録時の登録内容確認	参照側との一致を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-029	IT-26	登録内容	P1	登録時の登録内容確認	文字列としての比較を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列としての比較の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-030	IT-26	実行結果	P1	登録時の実行結果確認	成功時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-031	IT-23	実行結果	P1	登録時の実行結果確認	失敗時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一レスポンスでフィールドエラー表示であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-032	IT-26	更新内容	P1	更新時の更新内容確認	副作用を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で副作用の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-033	IT-26	更新内容	P1	更新時の更新内容確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でmtb_optionの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-034	IT-26	更新内容	P1	更新時の更新内容確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でmtb_optionの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-035	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録/更新の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-036	IT-26	更新内容	P1	更新時の更新内容確認	CSRFを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRFの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-037	IT-26	更新内容	P1	更新時の更新内容確認	管理画面に入れた管理者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-038	IT-26	更新内容	P1	更新時の更新内容確認	保存成功を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-039	IT-26	更新内容	P1	更新時の更新内容確認	保存失敗を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-040	IT-26	更新内容	P1	更新時の更新内容確認	保存成功→リダイレクトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-041	IT-26	更新内容	P1	更新時の更新内容確認	追加システム設定を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で追加システム設定の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-042	IT-05	実行結果	P1	更新時の実行結果確認	利用者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で利用者の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-043	IT-05	実行結果	P1	更新時の実行結果確認	管理画面ナビから当機能を開くを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で管理画面ナビから当機能を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_option を全件読み込み、論理キーから連想配列を組み立てたうえでフォームに現在値が表示されるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-044	IT-02	初期行数	P2	初期行数の結合確認	値を入力して「設定」を押す（検証成功）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証成功）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 値を入力して「設定」を押す（検証成功）
3. 画面表示と後続状態を確認する"	変更のあったキーについて option_value と最終更新者相当の member_id が更新され、成功メッセージの後に同一画面を GET で開き直す遷移となること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-045	IT-02	表示順	P2	表示順の結合確認	値を入力して「設定」を押す（検証失敗）を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で値を入力して「設定」を押す（検証失敗）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 値を入力して「設定」を押す（検証失敗）
3. 画面表示と後続状態を確認する"	保存は行わず、同一テンプレートを再描画してフィールドエラーを表示すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-046	IT-25	更新抑止	P1	更新抑止の結合確認	CSRF 検証に失敗するを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRF 検証に失敗するの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	Symfony のアクセス拒否（HTTP 403）が投げられる実装である（表示文言やHTTPコードはフレームワークとエラーハンドラを正とする）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-047	IT-12	内部情報	P1	内部情報の結合確認	表示要素を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で表示要素の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	{% block title %} は「追加システム設定」であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-048	IT-15	機密情報	P1	機密情報の結合確認	CSS・レイアウトを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSS・レイアウトの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	Form/config_layout.html.twig が bootstrap_3_horizontal_layout を継承すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-049	IT-28	実行結果	P2	実行結果の結合確認	送信を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信
3. 画面表示と後続状態を確認する"	"method=""post""、アクションは GET で画面を開くのと同じパスを指す生成URL（メソッドのみ POST で別ハンドラにつながる構成）であること。"
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-050	IT-28	実行結果	P2	実行結果の結合確認	買取査定申込み完了画面の自動遷移秒数を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で買取査定申込み完了画面の自動遷移秒数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取査定申込み完了画面の自動遷移秒数を確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-051	IT-28	件名	P2	件名の結合確認	スマレジ通信エラー送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. スマレジ通信エラー送信メールアドレス
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-052	IT-28	件名	P2	件名の結合確認	入荷通知メールの許可を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 入荷通知メールの許可を確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-053	IT-28	件名	P2	件名の結合確認	固定価格商品部門IDを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で固定価格商品部門IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 固定価格商品部門IDを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-054	IT-28	本文	P2	本文の結合確認	買取部門集計送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 買取部門集計送信メールアドレス
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-055	IT-28	本文	P2	本文の結合確認	必須項目が空欄である会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 必須項目が空欄である会員送信メールアドレス
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-056	IT-28	本文	P2	本文の結合確認	ポイント利用が反映されない決済の送信先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でポイント利用が反映されない決済の送信先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ポイント利用が反映されない決済の送信先メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-057	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	支店システム連携エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で支店システム連携エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 支店システム連携エラー通知先メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-058	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	購入処理エラー通知先メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で購入処理エラー通知先メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 購入処理エラー通知先メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-059	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	イベント決済確認エラー通知メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でイベント決済確認エラー通知メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. イベント決済確認エラー通知メールアドレスを確認する
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-060	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	身分証の有効期限切れ会員送信メールアドレスを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で身分証の有効期限切れ会員送信メールアドレスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 身分証の有効期限切れ会員送信メールアドレス
3. 画面表示と後続状態を確認する"	mtb_option.option_valueであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-061	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	フォームに存在するキーが findAll() の結果に無いを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でフォームに存在するキーが findAll() の結果に無いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォームに存在するキーが findAll() の結果に無いを確認する
3. 画面表示と後続状態を確認する"	保存ループの対象外となり、INSERT は行わないこと。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-062	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	送信値と現行値が文字列として同一を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で送信値と現行値が文字列として同一の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信値と現行値が文字列として同一
3. 画面表示と後続状態を確認する"	persist しない（member_id も更新しない）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-063	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	複数管理者が短時間に順に保存を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で複数管理者が短時間に順に保存の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 複数管理者が短時間に順に保存
3. 画面表示と後続状態を確認する"	楽観ロックは無いであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-064	IT-25	一覧	P2	一覧の結合確認	update_date 列を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でupdate_date 列の確認に必要な条件を指定する	"1. 対象画面を表示する
2. update_date 列を確認する
3. 画面表示と後続状態を確認する"	当コントローラは option_value と member_id のみ更新対象として明示していること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-065	IT-12	画面表示データ	P2	画面表示データの結合確認	参照側との一致を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で参照側との一致の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 参照側との一致を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-066	IT-25	画面表示データ	P2	画面表示データの結合確認	文字列としての比較を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で文字列としての比較の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 文字列としての比較を確認する
3. 画面表示と後続状態を確認する"	整数フィールドでも保存判定は文字列キャスト後であるため、0 と 00 のような差が入力経路で生じた場合のみ更新扱いになりうるであること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-067	IT-12	画面表示データ	P2	画面表示データの結合確認	成功時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-068	IT-25	画面表示データ	P2	画面表示データの結合確認	失敗時出力を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	同一レスポンスでフィールドエラー表示であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-069	IT-25	フォーム送信	P1	フォーム送信の結合確認	副作用を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	変更が検出された mtb_option 行の option_value と member_id を更新し flush すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-070	IT-16	ファイル選択	P2	ファイル選択の結合確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でmtb_optionの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_optionを確認する
3. 画面表示と後続状態を確認する"	最終更新した管理者の識別子（dtb_member.id 参照）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-071	IT-12	非同期更新	P1	非同期更新の結合確認	mtb_optionを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でmtb_optionの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_optionを確認する
3. 画面表示と後続状態を確認する"	日時であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-072	IT-12	エラー継続	P3	エラー継続の結合確認	登録/更新を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-073	IT-25	件数上限	P2	件数上限の結合確認	CSRFを試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）でCSRFの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSRFを確認する
3. 画面表示と後続状態を確認する"	フォーム名をトークン ID に用い、POST パラメータからネストされたトークンを検証すること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-074	IT-25	欠損値	P2	欠損値の結合確認	管理画面に入れた管理者を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で管理画面に入れた管理者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面に入れた管理者を確認する
3. 画面表示と後続状態を確認する"	当パスが権限拒否や IP 制限に該当しない限り、表示・保存が可能であることを前提とする（プラグイン側に個別 Voter は無く、管理画面配下の共通セキュリティに依拠する実装である）であること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-075	IT-25	データなし	P2	データなしの結合確認	保存成功を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存成功
3. 画面表示と後続状態を確認する"	同一機能の初期表示（GET）へ HTTP リダイレクトすること。
追加システム設定（HareruyaEcプラグイン）	IT-M10-16-ADMIN-BASE-SETTING-SETTING-SHOP-ADDITIONAL-SYSTEM-076	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	保存失敗を試験できる状態である	追加システム設定（HareruyaEcプラグイン）（m10_16_admin_base_setting_setting_shop_additional_system）で保存失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存失敗
3. 画面表示と後続状態を確認する"	同一テンプレートをその場で再描画すること。
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
| その他 | 同種の対象外観点 3 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 6件 — No.109, No.110, No.111, No.215, No.228, No.261。上限緩和または個別ケース化で収載可能。
