# 店舗基本設定 — 配送料無料条件（閾値） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m10-05_admin_base_setting_setting_shop_delivery_free_conditions.html`

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
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-001	IT-15	CSRF	P1	CSRFの結合確認	管理者を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で管理者の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理画面にログインし店舗設定を保存できる利用者（認可の詳細は管理画面共通実装を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-002	IT-15	未認証	P1	未認証の結合確認	店舗基本設定画面の「送料設定」を見るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で店舗基本設定画面の「送料設定」を見るの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	「送料無料条件(金額)」「送料無料条件(数量)」の入力欄が並ぶこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-003	IT-15	対象データ	P1	対象データの結合確認	閾値を入力して画面下部の「登録」を押す（親フォームと一体）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で閾値を入力して画面下部の「登録」を押す（親フォームと一体）の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証に成功すれば dtb_base_info が更新され、管理画面向け登録完了メッセージ後に同一店舗基本設定画面がGETで再表示されるであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-004	IT-20	出力抑止	P1	出力抑止の結合確認	入力が検証ルールを満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力が検証ルールを満たさないの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同一レスポンスでフォームが再描画され、該当フィールドにエラーが付くであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-005	IT-20	識別子	P1	識別子の結合確認	購入者がカートまたは購入フローを使う（閾値保存後）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で購入者がカートまたは購入フローを使う（閾値保存後）の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	保存値が読み込まれた店舗基本情報を参照して、コア実装どおり無料判定・メッセージが行われるであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-006	IT-15	状態変化	P1	状態変化の結合確認	表示要素を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で表示要素の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ボックス見出し「送料設定」であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-007	IT-25	UI部品	P3	UI部品の操作結果確認	入力項目を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	「送料無料条件(金額)」は金額用 money 型であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-008	IT-25	UI部品	P3	UI部品の操作結果確認	金額に負値・数字以外・桁超過を送るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額に負値・数字以外・桁超過を送るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 金額に負値・数字以外・桁超過を送るを確認する
3. 画面表示と後続状態を確認する"	フォーム検証エラーになり保存しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-009	IT-25	操作起点	P1	操作起点の操作結果確認	金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を確認する
3. 画面表示と後続状態を確認する"	テストでは桁区切り文字列がエラーとなる例があること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	delivery_free_quantity は非NULL、delivery_…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でdelivery_free_quantity は非NULL、delivery_…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. delivery_free_quantity は非NULL、delivery_…を確認する
3. 画面表示と後続状態を確認する"	数量側のみによる無料化と表示分岐となること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	保存単位を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	dtb_base_info の単一行であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	全画面共通の参照を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で全画面共通の参照の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 全画面共通の参照を確認する
3. 画面表示と後続状態を確認する"	アプリ各处で読み込まれる BaseInfo はクエリ結果キャッシュの影響を受ける場合がある（店舗マスタ共通の注意）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	検証失敗時を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で検証失敗時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検証失敗時を確認する
3. 画面表示と後続状態を確認する"	画面上の入力とTwigグローバルの閾値表示がずれ得るであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-014	IT-03	外部画面	P2	外部画面の操作結果確認	DBを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. DBを確認する
3. 画面表示と後続状態を確認する"	dtb_base_info の当2列を更新したうえ、flushであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	Doctrineイベントを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDoctrineイベントの確認に必要な条件を指定する	"1. 対象画面を表示する
2. Doctrineイベントを確認する
3. 画面表示と後続状態を確認する"	店舗基本情報エンティティの共通ライフサイクル（更新日時など）が他列とともに適用される（詳細はエンティティ定義側を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	結果キャッシュを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で結果キャッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果キャッシュを確認する
3. 画面表示と後続状態を確認する"	親機能と同様、BaseInfo 更新経路により結果キャッシュクリアが走る設定があり得るであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	成功時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	管理画面成功フラッシュであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	項目エラーであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	登録/更新を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で管理画面へ到達できる管理者で、親画面への拒否設定に該当しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを確認する
3. 画面表示と後続状態を確認する"	「送料設定」含む店舗基本設定の表示・保存が可能であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	未認証・権限・IP要件を満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で未認証・権限・IP要件を満たさないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未認証・権限・IP要件を満たさないを確認する
3. 画面表示と後続状態を確認する"	親画面共通の結果として保存操作に至らない（詳細は管理画面認証を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	保存成功→リダイレクトを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存成功→リダイレクトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存成功→リダイレクト
3. 画面表示と後続状態を確認する"	画面上部に成功メッセージが出た状態で、BaseInfo は保存後の値を読み込み直した表示になること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-023	IT-25	URL	P2	URLの操作結果確認	入力検証エラーを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力検証エラー
3. 画面表示と後続状態を確認する"	該当 form_row にエラー表示であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	結果キャッシュ関連を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 結果キャッシュ関連を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	管理者を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 管理者を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	店舗基本設定画面の「送料設定」を見るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 店舗基本設定画面の「送料設定」を見るを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	閾値を入力して画面下部の「登録」を押す（親フォームと一体）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 閾値を入力して画面下部の「登録」を押す（親フォームと一体）
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	入力が検証ルールを満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 入力が検証ルールを満たさない
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	購入者がカートまたは購入フローを使う（閾値保存後）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 購入者がカートまたは購入フローを使う（閾値保存後）
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-031	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	金額に負値・数字以外・桁超過を送るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額に負値・数字以外・桁超過を送るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 金額に負値・数字以外・桁超過を送るを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	delivery_free_quantity は非NULL、delivery_…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でdelivery_free_quantity は非NULL、delivery_…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. delivery_free_quantity は非NULL、delivery_…を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保存単位を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	全画面共通の参照を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 全画面共通の参照を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検証失敗時を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検証失敗時を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	DBを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. DBを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	Doctrineイベントを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDoctrineイベントの確認に必要な条件を指定する	"1. 対象画面を表示する
2. Doctrineイベントを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	結果キャッシュを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で結果キャッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果キャッシュを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	成功時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	失敗時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	登録/更新を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	未認証・権限・IP要件を満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 未認証・権限・IP要件を満たさないを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	保存成功→リダイレクトを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存成功→リダイレクトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存成功→リダイレクト
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	入力検証エラーを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力検証エラー
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	結果キャッシュ関連を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 結果キャッシュ関連を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	管理者を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 管理者を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	店舗基本設定画面の「送料設定」を見るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で店舗基本設定画面の「送料設定」を見るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗基本設定画面の「送料設定」を見るを確認する
3. 画面表示と後続状態を確認する"	「送料無料条件(金額)」「送料無料条件(数量)」の入力欄が並ぶこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	閾値を入力して画面下部の「登録」を押す（親フォームと一体）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 閾値を入力して画面下部の「登録」を押す（親フォームと一体）
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力が検証ルールを満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力が検証ルールを満たさない
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	購入者がカートまたは購入フローを使う（閾値保存後）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 購入者がカートまたは購入フローを使う（閾値保存後）
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	入力項目を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	金額に負値・数字以外・桁超過を送るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 金額に負値・数字以外・桁超過を送るを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-056	IT-22	必須制御	P1	必須制御の入力検証	金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を確認する
3. 画面表示と後続状態を確認する"	テストでは桁区切り文字列がエラーとなる例があること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-057	IT-26	登録内容	P1	登録時の登録内容確認	保存単位を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存単位の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-058	IT-26	登録内容	P1	登録時の登録内容確認	全画面共通の参照を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で全画面共通の参照の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-059	IT-26	登録内容	P1	登録時の登録内容確認	検証失敗時を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で検証失敗時の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-060	IT-26	登録内容	P1	登録時の登録内容確認	DBを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDBの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_base_info の当2列を更新したうえ、flushであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-061	IT-26	登録内容	P1	登録時の登録内容確認	Doctrineイベントを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDoctrineイベントの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	店舗基本情報エンティティの共通ライフサイクル（更新日時など）が他列とともに適用される（詳細はエンティティ定義側を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-062	IT-23	登録内容	P1	登録時の登録内容確認	結果キャッシュを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で結果キャッシュの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	親機能と同様、BaseInfo 更新経路により結果キャッシュクリアが走る設定があり得るであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-063	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で成功時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面成功フラッシュであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-064	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で失敗時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	項目エラーであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-065	IT-26	登録内容	P1	登録時の登録内容確認	登録/更新を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録/更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-066	IT-26	登録内容	P1	登録時の登録内容確認	管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で管理画面へ到達できる管理者で、親画面への拒否設定に該当しないの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	「送料設定」含む店舗基本設定の表示・保存が可能であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-067	IT-26	登録内容	P1	登録時の登録内容確認	未認証・権限・IP要件を満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で未認証・権限・IP要件を満たさないの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	親画面共通の結果として保存操作に至らない（詳細は管理画面認証を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-068	IT-26	登録内容	P1	登録時の登録内容確認	保存成功→リダイレクトを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存成功→リダイレクトの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-069	IT-26	登録内容	P1	登録時の登録内容確認	入力検証エラーを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-070	IT-26	登録内容	P1	登録時の登録内容確認	結果キャッシュ関連を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-071	IT-26	登録内容	P1	登録時の登録内容確認	管理者を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-072	IT-26	登録内容	P1	登録時の登録内容確認	店舗基本設定画面の「送料設定」を見るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-073	IT-26	登録内容	P1	登録時の登録内容確認	閾値を入力して画面下部の「登録」を押す（親フォームと一体）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で閾値を入力して画面下部の「登録」を押す（親フォームと一体）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-074	IT-26	実行結果	P1	登録時の実行結果確認	入力が検証ルールを満たさないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力が検証ルールを満たさないの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-075	IT-23	実行結果	P1	登録時の実行結果確認	購入者がカートまたは購入フローを使う（閾値保存後）を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で購入者がカートまたは購入フローを使う（閾値保存後）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存値が読み込まれた店舗基本情報を参照して、コア実装どおり無料判定・メッセージが行われるであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-076	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-077	IT-26	更新内容	P1	更新時の更新内容確認	入力項目を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で入力項目の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-078	IT-26	更新内容	P1	更新時の更新内容確認	金額に負値・数字以外・桁超過を送るを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額に負値・数字以外・桁超過を送るの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-079	IT-26	更新内容	P1	更新時の更新内容確認	金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で金額にカンマ付きのみを送った場合など、金額型とRegexの順序によりエラーにな…の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	テストでは桁区切り文字列がエラーとなる例があること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-080	IT-26	更新内容	P1	更新時の更新内容確認	delivery_free_quantity は非NULL、delivery_…を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でdelivery_free_quantity は非NULL、delivery_…の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	数量側のみによる無料化と表示分岐となること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-081	IT-23	更新内容	P1	更新時の更新内容確認	保存単位を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で保存単位の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_base_info の単一行であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-082	IT-26	更新内容	P1	更新時の更新内容確認	全画面共通の参照を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で全画面共通の参照の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アプリ各处で読み込まれる BaseInfo はクエリ結果キャッシュの影響を受ける場合がある（店舗マスタ共通の注意）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-083	IT-26	更新内容	P1	更新時の更新内容確認	検証失敗時を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で検証失敗時の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面上の入力とTwigグローバルの閾値表示がずれ得るであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-084	IT-26	更新内容	P1	更新時の更新内容確認	DBを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDBの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_base_info の当2列を更新したうえ、flushであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-085	IT-26	更新内容	P1	更新時の更新内容確認	Doctrineイベントを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）でDoctrineイベントの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	店舗基本情報エンティティの共通ライフサイクル（更新日時など）が他列とともに適用される（詳細はエンティティ定義側を正とする）であること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-086	IT-26	更新内容	P1	更新時の更新内容確認	結果キャッシュを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で結果キャッシュの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	親機能と同様、BaseInfo 更新経路により結果キャッシュクリアが走る設定があり得るであること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-087	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で成功時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-088	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-089	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
店舗基本設定 — 配送料無料条件（閾値）	IT-M10-05-ADMIN-BASE-SETTING-SETTING-SHOP-DELIVERY-FREE-CONDITIONS-090	IT-26	更新内容	P1	更新時の更新内容確認	管理画面へ到達できる管理者で、親画面への拒否設定に該当しないを試験できる状態である	店舗基本設定 — 配送料無料条件（閾値）（m10_05_admin_base_setting_setting_shop_delivery_free_conditions）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
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
