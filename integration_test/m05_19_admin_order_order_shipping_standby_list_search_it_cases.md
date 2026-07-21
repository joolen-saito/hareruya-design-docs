# m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、フォーム送信、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |
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
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-001	IT-15	CSRF	P1	CSRFの結合確認	「検索する」ボタンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で「検索する」ボタンの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信内容を処理し、条件とソートで一覧を 1 ページ目から表示であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-002	IT-15	未認証	P1	未認証の結合確認	ページネーションのリンクを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でページネーションのリンクの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの検索条件とソートを復元し、N ページ目を表示すること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-003	IT-15	対象データ	P1	対象データの結合確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	他一覧画面では #page_count_pulldown の change で location.href を変える実装があるが、当 index.twig の javascript ブロックは空であり、同一パターンのハ…であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-004	IT-20	出力抑止	P1	出力抑止の結合確認	出荷指示番号のリンクまたは行メニューの編集を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で出荷指示番号のリンクまたは行メニューの編集の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	編集画面へ遷移（本書範囲外）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-005	IT-20	識別子	P1	識別子の結合確認	パスパラメータ page_no（1 以上の数字）でページ指定を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でパスパラメータ page_no（1 以上の数字）でページ指定の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	パスパラメータ page_no（1 以上の数字）でページ指定であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-006	IT-15	状態変化	P1	状態変化の結合確認	表示要素を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示要素の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ページタイトルは「出荷指示」、サブタイトルは受注管理であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	当テンプレート専用の block javascript は空であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	モーダル・ポップアップを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	各行付近に商品永久削除用と思われるモーダル断片がテンプレートに含まれるであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-009	IT-25	URL	P2	URLの操作結果確認	登録日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録日（開始）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録日（開始）を確認する
3. 画面表示と後続状態を確認する"	キー create_date_fromであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	登録日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 登録日（終了）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	最終更新日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 最終更新日（開始）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	最終更新日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で最終更新日（終了）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最終更新日（終了）を確認する
3. 画面表示と後続状態を確認する"	キー update_date_toであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ソート方向パラメータが不正を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ソート方向パラメータが不正を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	セッションに検索ビューが無くフォームデータも取れないを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. セッションに検索ビューが無くフォームデータも取れない
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示件数プルダウンを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧と DBを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	成功時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	失敗時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-019	IT-22	部分入力	P2	部分入力の入力検証	副作用を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	セッション更新（検索条件・ページ・ソート・表示件数）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-020	IT-23	検索条件	P2	検索時の検索条件確認	ナビから開く（GET、ページクエリなし）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-021	IT-23	検索条件	P2	検索時の検索条件確認	検索送信成功を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-022	IT-23	検索条件	P2	検索時の検索条件確認	CSRF 等のフォームエラーを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-023	IT-23	検索条件	P2	検索時の検索条件確認	更新タイミングを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-024	IT-23	検索条件	P2	検索時の検索条件確認	「検索する」ボタンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-025	IT-23	検索条件	P2	検索時の検索条件確認	ページネーションのリンクを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-026	IT-23	検索条件	P2	検索時の検索条件確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-027	IT-23	検索条件	P2	検索時の検索条件確認	出荷指示番号のリンクまたは行メニューの編集を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-028	IT-23	検索条件	P2	検索時の検索条件確認	パスパラメータ page_no（1 以上の数字）でページ指定を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でパスパラメータ page_no（1 以上の数字）でページ指定の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-029	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示要素の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-030	IT-23	検索条件	P2	検索時の検索条件確認	JS 挙動を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でJS 挙動の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-031	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-032	IT-23	検索条件	P2	検索時の検索条件確認	登録日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録日（開始）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-033	IT-23	検索条件	P2	検索時の検索条件確認	登録日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録日（終了）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-034	IT-23	実行結果	P2	検索時の実行結果確認	最終更新日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で最終更新日（開始）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-035	IT-23	実行結果	P2	検索時の実行結果確認	最終更新日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で最終更新日（終了）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-036	IT-23	実行結果	P2	検索時の実行結果確認	ソート方向パラメータが不正を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でソート方向パラメータが不正の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-037	IT-23	実行結果	P2	検索時の実行結果確認	セッションに検索ビューが無くフォームデータも取れないを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でセッションに検索ビューが無くフォームデータも取れないの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-038	IT-26	登録内容	P1	登録時の登録内容確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-039	IT-26	登録内容	P1	登録時の登録内容確認	一覧と DBを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で一覧と DBの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-040	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で成功時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-041	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で失敗時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ソート不正時はエラーフラッシュと初期表示寄りのレスポンスであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-042	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で副作用の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-043	IT-26	登録内容	P1	登録時の登録内容確認	ナビから開く（GET、ページクエリなし）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-044	IT-26	登録内容	P1	登録時の登録内容確認	検索送信成功を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-045	IT-26	登録内容	P1	登録時の登録内容確認	CSRF 等のフォームエラーを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-046	IT-26	登録内容	P1	登録時の登録内容確認	更新タイミングを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-047	IT-26	登録内容	P1	登録時の登録内容確認	「検索する」ボタンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で「検索する」ボタンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-048	IT-26	実行結果	P1	登録時の実行結果確認	ページネーションのリンクを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でページネーションのリンクの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-049	IT-23	実行結果	P1	登録時の実行結果確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	他一覧画面では #page_count_pulldown の change で location.href を変える実装があるが、当 index.twig の javascript ブロックは空であり、同一パターンのハ…であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-050	IT-26	更新内容	P1	更新時の更新内容確認	出荷指示番号のリンクまたは行メニューの編集を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で出荷指示番号のリンクまたは行メニューの編集の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-051	IT-26	更新内容	P1	更新時の更新内容確認	パスパラメータ page_no（1 以上の数字）でページ指定を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でパスパラメータ page_no（1 以上の数字）でページ指定の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-052	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-053	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でJS 挙動の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当テンプレート専用の block javascript は空であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-054	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-055	IT-26	更新内容	P1	更新時の更新内容確認	登録日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-056	IT-26	更新内容	P1	更新時の更新内容確認	登録日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-057	IT-26	更新内容	P1	更新時の更新内容確認	最終更新日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-058	IT-26	更新内容	P1	更新時の更新内容確認	最終更新日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-059	IT-26	更新内容	P1	更新時の更新内容確認	ソート方向パラメータが不正を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でソート方向パラメータが不正の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-060	IT-05	実行結果	P1	更新時の実行結果確認	セッションに検索ビューが無くフォームデータも取れないを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でセッションに検索ビューが無くフォームデータも取れないの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-061	IT-05	実行結果	P1	更新時の実行結果確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	前述のとおり change ハンドラが無く、選択だけでは遷移しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-062	IT-02	初期行数	P2	初期行数の結合確認	一覧と DBを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で一覧と DBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	一覧表示時点のトランザクション分離レベルにおける dtb_shipping_standby の投影であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-063	IT-02	表示順	P2	表示順の結合確認	成功時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML（@admin/ShippingStandby/index.twig）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-064	IT-25	更新抑止	P1	更新抑止の結合確認	失敗時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で失敗時出力の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ソート不正時はエラーフラッシュと初期表示寄りのレスポンスであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-065	IT-12	内部情報	P1	内部情報の結合確認	副作用を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で副作用の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッション更新（検索条件・ページ・ソート・表示件数）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-066	IT-15	機密情報	P1	機密情報の結合確認	ナビから開く（GET、ページクエリなし）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でナビから開く（GET、ページクエリなし）の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同一 URL の初期状態であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-067	IT-07	排他制御	P1	排他制御の結合確認	検索送信成功を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で検索送信成功の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一 URL 上で結果描画であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-068	IT-07	排他制御	P1	排他制御の結合確認	CSRF 等のフォームエラーを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でCSRF 等のフォームエラーの確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フレームワークの通常処理（本書では網羅しない）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-069	IT-06	ロールバック	P3	ロールバックの結合確認	更新タイミングを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で更新タイミングの確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索処理が成功したループ内で、search メソッドが各キーを書き込むであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-070	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	「検索する」ボタンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で「検索する」ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「検索する」ボタン
3. 画面表示と後続状態を確認する"	送信内容を処理し、条件とソートで一覧を 1 ページ目から表示であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-071	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	ページネーションのリンクを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でページネーションのリンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ページネーションのリンクを確認する
3. 画面表示と後続状態を確認する"	セッションの検索条件とソートを復元し、N ページ目を表示すること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-072	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウンを確認する
3. 画面表示と後続状態を確認する"	他一覧画面では #page_count_pulldown の change で location.href を変える実装があるが、当 index.twig の javascript ブロックは空であり、同一パターンのハ…であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-073	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	出荷指示番号のリンクまたは行メニューの編集を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で出荷指示番号のリンクまたは行メニューの編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷指示番号のリンクまたは行メニューの編集を確認する
3. 画面表示と後続状態を確認する"	編集画面へ遷移（本書範囲外）であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-074	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	パスパラメータ page_no（1 以上の数字）でページ指定を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でパスパラメータ page_no（1 以上の数字）でページ指定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. パスパラメータ page_no（1 以上の数字）でページ指定を確認する
3. 画面表示と後続状態を確認する"	パスパラメータ page_no（1 以上の数字）でページ指定であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-075	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	表示要素を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ページタイトルは「出荷指示」、サブタイトルは受注管理であること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-076	IT-12	画面表示データ	P2	画面表示データの結合確認	登録日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録日（開始）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録日（開始）を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-077	IT-25	画面表示データ	P2	画面表示データの結合確認	登録日（終了）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で登録日（終了）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録日（終了）を確認する
3. 画面表示と後続状態を確認する"	キー create_date_toであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-078	IT-12	画面表示データ	P2	画面表示データの結合確認	最終更新日（開始）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で最終更新日（開始）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最終更新日（開始）を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-079	IT-25	フォーム送信	P1	フォーム送信の結合確認	ソート方向パラメータが不正を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でソート方向パラメータが不正の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ソート方向パラメータが不正を確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュを積み index へであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-080	IT-16	ファイル選択	P2	ファイル選択の結合確認	セッションに検索ビューが無くフォームデータも取れないを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でセッションに検索ビューが無くフォームデータも取れないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. セッションに検索ビューが無くフォームデータも取れない
3. 画面表示と後続状態を確認する"	index の初期表示へであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-081	IT-12	非同期更新	P1	非同期更新の結合確認	表示件数プルダウンを試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウンを確認する
3. 画面表示と後続状態を確認する"	前述のとおり change ハンドラが無く、選択だけでは遷移しないこと。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-082	IT-25	欠損値	P2	欠損値の結合確認	失敗時出力を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	ソート不正時はエラーフラッシュと初期表示寄りのレスポンスであること。
m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）	IT-M05-19-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-SEARCH-083	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	ナビから開く（GET、ページクエリなし）を試験できる状態である	m05-19_admin_order_order_shipping_standby_list_search（管理画面_受注管理_出荷指示リスト検索）（m05_19_admin_order_order_shipping_standby_list_search）でナビから開く（GET、ページクエリなし）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビから開く（GET、ページクエリなし）
3. 画面表示と後続状態を確認する"	同一 URL の初期状態であること。
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
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
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
| その他 | 同種の対象外観点 4 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 6件 — No.338, No.346, No.359, No.387, No.412, No.414。上限緩和または個別ケース化で収載可能。
