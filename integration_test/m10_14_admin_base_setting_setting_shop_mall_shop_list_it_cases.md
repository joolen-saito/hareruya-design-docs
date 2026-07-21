# m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 更新内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |
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
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	店舗一覧画面を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗一覧画面の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	「基本情報」配下メニューを開いたときに表示される、テナント店舗の検索結果テーブルを持つページであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-002	IT-15	未認証	P1	未認証の結合確認	検索条件セッションを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件セッションの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索入力の表示復元およびページネーション状態を保持するセッション上の名前空間であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-003	IT-15	対象データ	P1	対象データの結合確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	DELETE APIが行う処理のうち、tenant_statusを「削除」を表すマスタ状態に書き換えてフラッシュすること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	メニューから店舗一覧を開くを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でメニューから店舗一覧を開くの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索欄にはフォーム項目「店舗名」相当の入力欄が並ぶこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-005	IT-20	識別子	P1	識別子の結合確認	「検索」ボタンを押下してPOST送信するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「検索」ボタンを押下してPOST送信するの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	CSRFおよびフォーム項目を含んだ検索送信が処理されるであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	ページリンクや「表示件数」プルダウンで一覧をページ送りするを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でページリンクや「表示件数」プルダウンで一覧をページ送りするの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	GETによりページ番号と表示件数を更新しつつ、resumeフラグもしくはパスパラメタに応じてセッション上の検索条件を復元して再クエリすること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	行のチェックボックスを操作するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で行のチェックボックスを操作するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行のチェックボックスを操作するを確認する
3. 画面表示と後続状態を確認する"	「一括操作」のエリアが表示もしくは非表示に切り替わるであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	「削除」を実行するモーダルで確定して一括処理するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「削除」を実行するモーダルで確定して一括処理するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「削除」を実行するモーダルで確定して一括処理する
3. 画面表示と後続状態を確認する"	選択された各行に対応する削除URLへDELETEのAjaxリクエストを並列送信すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-009	IT-25	URL	P2	URLの操作結果確認	店舗名リンクを押下するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンクを押下するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗名リンクを押下する
3. 画面表示と後続状態を確認する"	店舗詳細編集へ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	論理削除確認モーダル、進捗バーであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力項目を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. テーブルの行集合を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 画面上の単一検索テキスト
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 論理削除後の再表示
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索結果ゼロ
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. Ajax DELETEで一部失敗を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-019	IT-22	部分入力	P2	部分入力の入力検証	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除
3. 画面表示と後続状態を確認する"	ステータスのみ更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-020	IT-23	検索条件	P2	検索時の検索条件確認	APIを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-021	IT-23	検索条件	P2	検索時の検索条件確認	入力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-022	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-023	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-024	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-025	IT-23	検索条件	P2	検索時の検索条件確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-026	IT-23	検索条件	P2	検索時の検索条件確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-027	IT-23	検索条件	P2	検索時の検索条件確認	mtb_tenant_statusを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でmtb_tenant_statusの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-028	IT-23	検索条件	P2	検索時の検索条件確認	検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索テキストの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-029	IT-23	検索条件	P2	検索時の検索条件確認	店舗名リンク押下を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンク押下の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-030	IT-23	検索条件	P2	検索時の検索条件確認	表示件数プルダウン変更を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-031	IT-23	検索条件	P2	検索時の検索条件確認	検索送信を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索送信の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-032	IT-23	検索条件	P2	検索時の検索条件確認	Ajax DELETE異常応答またはネットワーク失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE異常応答またはネットワーク失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-033	IT-23	実行結果	P2	検索時の実行結果確認	Ajax DELETE論理側の失敗応答(JSON success false)を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE論理側の失敗応答(JSON success false)の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-034	IT-23	実行結果	P2	検索時の実行結果確認	一覧正常表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で一覧正常表示の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-035	IT-23	実行結果	P2	検索時の実行結果確認	検索条件とページ状態の保存タイミングを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件とページ状態の保存タイミングの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-036	IT-23	実行結果	P2	検索時の実行結果確認	表示件数を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-037	IT-26	更新内容	P1	更新時の更新内容確認	店舗一覧画面を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗一覧画面の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-038	IT-26	更新内容	P1	更新時の更新内容確認	検索条件セッションを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件セッションの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-039	IT-26	更新内容	P1	更新時の更新内容確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-040	IT-26	更新内容	P1	更新時の更新内容確認	メニューから店舗一覧を開くを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でメニューから店舗一覧を開くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索欄にはフォーム項目「店舗名」相当の入力欄が並ぶこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-041	IT-26	更新内容	P1	更新時の更新内容確認	「検索」ボタンを押下してPOST送信するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「検索」ボタンを押下してPOST送信するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-042	IT-26	更新内容	P1	更新時の更新内容確認	ページリンクや「表示件数」プルダウンで一覧をページ送りするを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-043	IT-26	更新内容	P1	更新時の更新内容確認	行のチェックボックスを操作するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-044	IT-26	更新内容	P1	更新時の更新内容確認	「削除」を実行するモーダルで確定して一括処理するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-045	IT-26	更新内容	P1	更新時の更新内容確認	店舗名リンクを押下するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-046	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-047	IT-05	実行結果	P1	更新時の実行結果確認	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でJS挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-048	IT-05	実行結果	P1	更新時の実行結果確認	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除確認モーダル、進捗バーであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-049	IT-05	削除条件	P1	削除時の削除条件確認	入力項目を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索用テキスト1項目であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-050	IT-05	削除条件	P1	削除時の削除条件確認	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	モールルートを除いたdtb_base_info行であり、クエリ側は初期時点ですべて読み込んですべて表示すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-051	IT-05	削除条件	P1	削除時の削除条件確認	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DBには保存しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-052	IT-05	削除条件	P1	削除時の削除条件確認	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	標準の一覧クエリはtenant_statusで除外しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-053	IT-05	削除条件	P1	削除時の削除条件確認	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索結果ゼロの確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-054	IT-05	実行結果	P1	削除時の実行結果確認	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETEで一部失敗の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-055	IT-05	実行結果	P1	削除時の実行結果確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ステータスのみ更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-056	IT-05	実行結果	P1	削除時の実行結果確認	APIを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAPIの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-057	IT-05	実行結果	P1	削除時の実行結果確認	入力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GETはページングとresumeであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-058	IT-02	初期行数	P2	初期行数の結合確認	成功時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML一覧、もしくは削除成功JSONであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-059	IT-02	表示順	P2	表示順の結合確認	失敗時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	HTMLは検索エラー状態付きもしくはAjaxのシステムエラー文言リストであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-060	IT-25	更新抑止	P1	更新抑止の結合確認	副作用を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で副作用の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索条件セッションの更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-061	IT-12	内部情報	P1	内部情報の結合確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でdtb_base_infoの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧および検索ID条件、リンク生成に利用であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-062	IT-15	機密情報	P1	機密情報の結合確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でdtb_base_infoの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧に表示および検索のLIKE参照であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-063	IT-07	排他制御	P1	排他制御の結合確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でdtb_base_infoの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DELETEにより「削除」を表すマスタ参照へ更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-064	IT-07	排他制御	P1	排他制御の結合確認	mtb_tenant_statusを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でmtb_tenant_statusの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	「削除」を表す行の主キーであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-065	IT-06	ロールバック	P3	ロールバックの結合確認	検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索テキストの確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	Symfonyフォーム単体ではほぼ束縛が無いであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-066	IT-11	実行結果	P2	実行結果の結合確認	店舗名リンク押下を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンク押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗名リンク押下
3. 画面表示と後続状態を確認する"	店舗詳細編集であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-067	IT-28	実行結果	P2	実行結果の結合確認	表示件数プルダウン変更を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	同一機能の一覧へGET、ページは1側へ明示付与であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-068	IT-28	実行結果	P2	実行結果の結合確認	検索送信を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索送信
3. 画面表示と後続状態を確認する"	保存済み入力でクエリであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-069	IT-28	ヘッダ	P2	ヘッダの結合確認	Ajax DELETE異常応答またはネットワーク失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE異常応答またはネットワーク失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Ajax DELETE異常応答またはネットワーク失敗を確認する
3. 画面表示と後続状態を確認する"	モーダル内リストへエラー文を増やすであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-070	IT-28	件名	P2	件名の結合確認	Ajax DELETE論理側の失敗応答(JSON success false)を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. Ajax DELETE論理側の失敗応答(JSON success false)を確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-071	IT-28	件名	P2	件名の結合確認	一覧正常表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧正常表示を確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-072	IT-28	件名	P2	件名の結合確認	検索条件とページ状態の保存タイミングを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件とページ状態の保存タイミングの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索条件とページ状態の保存タイミング
3. 画面表示と後続状態を確認する"	POST検索有効時およびページ送りGET／resume付きGET、検索入力初期化GETであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-073	IT-28	本文	P2	本文の結合確認	表示件数を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-074	IT-28	本文	P2	本文の結合確認	店舗一覧画面を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. 店舗一覧画面を確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-075	IT-28	本文	P2	本文の結合確認	検索条件セッションを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件セッションの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索条件セッション
3. 画面表示と後続状態を確認する"	検索入力の表示復元およびページネーション状態を保持するセッション上の名前空間であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-076	IT-28	本文	P2	本文の結合確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除
3. 画面表示と後続状態を確認する"	DELETE APIが行う処理のうち、tenant_statusを「削除」を表すマスタ状態に書き換えてフラッシュすること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-077	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	メニューから店舗一覧を開くを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でメニューから店舗一覧を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メニューから店舗一覧を開く
3. 画面表示と後続状態を確認する"	検索欄にはフォーム項目「店舗名」相当の入力欄が並ぶこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-078	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	「検索」ボタンを押下してPOST送信するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「検索」ボタンを押下してPOST送信するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「検索」ボタンを押下してPOST送信する
3. 画面表示と後続状態を確認する"	CSRFおよびフォーム項目を含んだ検索送信が処理されるであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-079	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ページリンクや「表示件数」プルダウンで一覧をページ送りするを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でページリンクや「表示件数」プルダウンで一覧をページ送りするの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ページリンクや「表示件数」プルダウンで一覧をページ送りするを確認する
3. 画面表示と後続状態を確認する"	GETによりページ番号と表示件数を更新しつつ、resumeフラグもしくはパスパラメタに応じてセッション上の検索条件を復元して再クエリすること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	画面上部に検索フォームであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-081	IT-25	一覧	P2	一覧の結合確認	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	表示件数プルダウン変更でクエリパラメタを付けた同一一覧へブラウザ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-082	IT-12	画面表示データ	P2	画面表示データの結合確認	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-083	IT-25	画面表示データ	P2	画面表示データの結合確認	入力項目を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	検索用テキスト1項目であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-084	IT-12	画面表示データ	P2	画面表示データの結合確認	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でテーブルの行集合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テーブルの行集合を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-085	IT-25	画面表示データ	P2	画面表示データの結合確認	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で画面上の単一検索テキストの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の単一検索テキスト
3. 画面表示と後続状態を確認する"	DBには保存しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-086	IT-25	フォーム送信	P1	フォーム送信の結合確認	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除後の再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除後の再表示
3. 画面表示と後続状態を確認する"	標準の一覧クエリはtenant_statusで除外しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-087	IT-16	ファイル選択	P2	ファイル選択の結合確認	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索結果ゼロの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索結果ゼロ
3. 画面表示と後続状態を確認する"	「検索結果はありません」系の共通メッセージと案内であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-088	IT-12	非同期更新	P1	非同期更新の結合確認	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETEで一部失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Ajax DELETEで一部失敗を確認する
3. 画面表示と後続状態を確認する"	並列処理の結果配列側で個別文言をリスト表示し、処理完了文言へ至るであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-089	IT-25	件数上限	P2	件数上限の結合確認	APIを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	論理削除用DELETEはAjax向けであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-090	IT-25	欠損値	P2	欠損値の結合確認	入力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	GETはページングとresumeであること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 7件 — No.44, No.333, No.334, No.336, No.387, No.414, No.416。上限緩和または個別ケース化で収載可能。
