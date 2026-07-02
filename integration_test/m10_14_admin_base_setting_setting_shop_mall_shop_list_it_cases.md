# m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.html`

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
| IT-23 | 実行結果、更新内容、検索条件 |
| IT-26 | 更新内容 |

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
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	行のチェックボックスを操作するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で行のチェックボックスを操作するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行のチェックボックスを操作するを確認する
3. 画面表示と後続状態を確認する"	「一括操作」のエリアが表示もしくは非表示に切り替わるであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	「削除」を実行するモーダルで確定して一括処理するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「削除」を実行するモーダルで確定して一括処理するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「削除」を実行するモーダルで確定して一括処理する
3. 画面表示と後続状態を確認する"	選択された各行に対応する削除URLへDELETEのAjaxリクエストを並列送信すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	店舗名リンクを押下するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンクを押下するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗名リンクを押下する
3. 画面表示と後続状態を確認する"	店舗詳細編集へ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	画面上部に検索フォームであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	表示件数プルダウン変更でクエリパラメタを付けた同一一覧へブラウザ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	論理削除確認モーダル、進捗バーであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	入力項目を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	検索用テキスト1項目であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でテーブルの行集合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. テーブルの行集合を確認する
3. 画面表示と後続状態を確認する"	モールルートを除いたdtb_base_info行であり、クエリ側は初期時点ですべて読み込んですべて表示すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で画面上の単一検索テキストの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の単一検索テキスト
3. 画面表示と後続状態を確認する"	DBには保存しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除後の再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除後の再表示
3. 画面表示と後続状態を確認する"	標準の一覧クエリはtenant_statusで除外しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索結果ゼロの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索結果ゼロ
3. 画面表示と後続状態を確認する"	「検索結果はありません」系の共通メッセージと案内であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETEで一部失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Ajax DELETEで一部失敗を確認する
3. 画面表示と後続状態を確認する"	並列処理の結果配列側で個別文言をリスト表示し、処理完了文言へ至るであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除
3. 画面表示と後続状態を確認する"	ステータスのみ更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	APIを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	論理削除用DELETEはAjax向けであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	入力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	GETはページングとresumeであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	成功時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML一覧、もしくは削除成功JSONであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-023	IT-25	URL	P2	URLの操作結果確認	失敗時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	HTMLは検索エラー状態付きもしくはAjaxのシステムエラー文言リストであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	副作用を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. dtb_base_infoを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. dtb_base_infoを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. dtb_base_infoを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	mtb_tenant_statusを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. mtb_tenant_statusを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 検索テキスト
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	店舗名リンク押下を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンク押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗名リンク押下
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示件数プルダウン変更を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	同一機能の一覧へGET、ページは1側へ明示付与であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索送信を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索送信
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	Ajax DELETE異常応答またはネットワーク失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE異常応答またはネットワーク失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Ajax DELETE異常応答またはネットワーク失敗を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	Ajax DELETE論理側の失敗応答(JSON success false)を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE論理側の失敗応答(JSON success false)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. Ajax DELETE論理側の失敗応答(JSON success false)を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧正常表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧正常表示を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索条件とページ状態の保存タイミングを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索条件とページ状態の保存タイミング
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示件数を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	店舗一覧画面を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 店舗一覧画面を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索条件セッションを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件セッションの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索条件セッション
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 論理削除
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	メニューから店舗一覧を開くを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でメニューから店舗一覧を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メニューから店舗一覧を開く
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	「検索」ボタンを押下してPOST送信するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 「検索」ボタンを押下してPOST送信する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ページリンクや「表示件数」プルダウンで一覧をページ送りするを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ページリンクや「表示件数」プルダウンで一覧をページ送りするを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	行のチェックボックスを操作するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 行のチェックボックスを操作するを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	「削除」を実行するモーダルで確定して一括処理するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 「削除」を実行するモーダルで確定して一括処理する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	店舗名リンクを押下するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンクを押下するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗名リンクを押下する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. テーブルの行集合を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上の単一検索テキスト
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 論理削除後の再表示
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索結果ゼロ
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. Ajax DELETEで一部失敗を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 論理削除
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-056	IT-22	必須制御	P1	必須制御の入力検証	APIを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	論理削除用DELETEはAjax向けであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-057	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件セッションの更新であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	dtb_base_infoを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	mtb_tenant_statusを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	店舗名リンク押下を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	表示件数プルダウン変更を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	検索送信を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索送信の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	Ajax DELETE異常応答またはネットワーク失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE異常応答またはネットワーク失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	Ajax DELETE論理側の失敗応答(JSON success false)を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でAjax DELETE論理側の失敗応答(JSON success false)の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	一覧正常表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で一覧正常表示の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	専用の業務ログは増やさないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	検索条件とページ状態の保存タイミングを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件とページ状態の保存タイミングの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-071	IT-23	検索条件	P2	検索時の検索条件確認	表示件数を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示件数の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-072	IT-23	実行結果	P2	検索時の実行結果確認	店舗一覧画面を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗一覧画面の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-073	IT-23	実行結果	P2	検索時の実行結果確認	検索条件セッションを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索条件セッションの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索入力の表示復元およびページネーション状態を保持するセッション上の名前空間であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	メニューから店舗一覧を開くを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でメニューから店舗一覧を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-076	IT-23	実行結果	P2	検索時の実行結果確認	「検索」ボタンを押下してPOST送信するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「検索」ボタンを押下してPOST送信するの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-077	IT-26	更新内容	P1	更新時の更新内容確認	ページリンクや「表示件数」プルダウンで一覧をページ送りするを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でページリンクや「表示件数」プルダウンで一覧をページ送りするの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-078	IT-26	更新内容	P1	更新時の更新内容確認	行のチェックボックスを操作するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で行のチェックボックスを操作するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-079	IT-26	更新内容	P1	更新時の更新内容確認	「削除」を実行するモーダルで確定して一括処理するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で「削除」を実行するモーダルで確定して一括処理するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-080	IT-26	更新内容	P1	更新時の更新内容確認	店舗名リンクを押下するを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で店舗名リンクを押下するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	店舗詳細編集へ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-081	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面上部に検索フォームであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-082	IT-23	更新内容	P1	更新時の更新内容確認	JS挙動を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でJS挙動の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	表示件数プルダウン変更でクエリパラメタを付けた同一一覧へブラウザ遷移すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-083	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除確認モーダル、進捗バーであること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-084	IT-26	更新内容	P1	更新時の更新内容確認	入力項目を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で入力項目の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索用テキスト1項目であること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-085	IT-26	更新内容	P1	更新時の更新内容確認	テーブルの行集合を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）でテーブルの行集合の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	モールルートを除いたdtb_base_info行であり、クエリ側は初期時点ですべて読み込んですべて表示すること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-086	IT-26	更新内容	P1	更新時の更新内容確認	画面上の単一検索テキストを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で画面上の単一検索テキストの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DBには保存しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-087	IT-26	更新内容	P1	更新時の更新内容確認	論理削除後の再表示を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で論理削除後の再表示の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	標準の一覧クエリはtenant_statusで除外しないこと。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-088	IT-26	更新内容	P1	更新時の更新内容確認	検索結果ゼロを試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で検索結果ゼロの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-089	IT-26	更新内容	P1	更新時の更新内容確認	Ajax DELETEで一部失敗を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）	IT-M10-14-ADMIN-BASE-SETTING-SETTING-SHOP-MALL-SHOP-LIST-090	IT-26	更新内容	P1	更新時の更新内容確認	論理削除を試験できる状態である	m10-14_admin_base_setting_setting_shop_mall_shop_list（管理画面_店舗設定_基本情報_店舗一覧）（m10_14_admin_base_setting_setting_shop_mall_shop_list）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
| その他 | 同種の対象外観点 20 件は上記分類と同じ理由で対象外 |
