# m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-20_admin_order_order_shipping_standby_detail_edit_delete.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、フォーム送信、一覧、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-001	IT-15	CSRF	P1	CSRFの結合確認	出荷指示一覧で番号リンクまたは「編集」から詳細を開くを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で出荷指示一覧で番号リンクまたは「編集」から詳細を開くの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	備考・登録日時・最終更新者・紐付く受注一覧が表示されるであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-002	IT-15	未認証	P1	未認証の結合確認	詳細で備考を入力し「登録」相当の送信ボタンを押すを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細で備考を入力し「登録」相当の送信ボタンを押すの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	CSRF 付きフォームが検証を通れば備考が保存され、フラッシュ成功のうえ同一詳細へ戻ること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-003	IT-15	対象データ	P1	対象データの結合確認	詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	トークン確認後、リスト削除と関連受注の出荷指示日クリアが行われ、一覧の入口へ戻ること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-004	IT-20	出力抑止	P1	出力抑止の結合確認	表示要素を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で表示要素の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	詳細上部に出荷指示番号・作成日時・更新日時・最終更新者名、備考用テキストエリア、登録ボタン、ラベルが「リスト削除」の危険色ボタン風入力を内包するリンクであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-005	IT-20	識別子	P1	識別子の結合確認	JS 挙動を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でJS 挙動の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	印刷・一部 CSV は #form_bulk の action と target を切り替えて送信すること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-006	IT-15	状態変化	P1	状態変化の結合確認	モーダル・ポップアップを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	詳細テンプレート内に商品恒久的削除用と思われるモーダル断片がテーブル行付近に存在するが、本備考・リスト削除フローではこのモーダルを開くトリガは詳細画面の主要操作としては結び付いていないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	備考更新を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 備考更新を確認する
3. 画面表示と後続状態を確認する"	検証通過後、当該リスト行の備考列と最終更新者 ID 列だけを上書きすること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	リスト削除を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でリスト削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. リスト削除
3. 画面表示と後続状態を確認する"	紐付く各受注の出荷指示日を NULL にしたのち、リスト行を削除すること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-009	IT-25	URL	P2	URLの操作結果確認	詳細の読込結合を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細の読込結合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細の読込結合を確認する
3. 画面表示と後続状態を確認する"	受注に明細が 1 行も無い場合、内部結合によりリストが取得クエリに現れず 404 となりうるであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	{id} が存在しないを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. {id} が存在しないを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	備考が長さ制約超過を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 備考が長さ制約超過を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	リストに受注が無い、または受注に明細が無いを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でリストに受注が無い、または受注に明細が無いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. リストに受注が無い、または受注に明細が無いを確認する
3. 画面表示と後続状態を確認する"	詳細取得クエリの結合によりヒットしない可能性があり 404であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	削除後リダイレクトのセッションキーを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 削除後リダイレクトのセッションキー
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	詳細表示と DBを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 詳細表示と DBを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	削除と受注を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 削除と受注
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	再表示を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 再表示を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	成功時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	失敗時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-019	IT-22	部分入力	P2	部分入力の入力検証	副作用を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	dtb_shipping_standby、dtb_order.commit_date の一括 NULL 化、中間表削除、トランザクションコミットであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-020	IT-23	検索条件	P2	検索時の検索条件確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-021	IT-23	検索条件	P2	検索時の検索条件確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-022	IT-23	検索条件	P2	検索時の検索条件確認	dtb_orderを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-023	IT-23	検索条件	P2	検索時の検索条件確認	dtb_order_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-024	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-025	IT-23	検索条件	P2	検索時の検索条件確認	CSRFを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-026	IT-23	検索条件	P2	検索時の検索条件確認	備考保存成功を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-027	IT-23	検索条件	P2	検索時の検索条件確認	備考保存失敗（検証など）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-028	IT-23	検索条件	P2	検索時の検索条件確認	削除成功（現行の多くのケース）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除成功（現行の多くのケース）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-029	IT-23	検索条件	P2	検索時の検索条件確認	削除成功（セッションに誤キーで無いページ番号があった場合など）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除成功（セッションに誤キーで無いページ番号があった場合など）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-030	IT-23	検索条件	P2	検索時の検索条件確認	備考保存・保存失敗を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考保存・保存失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-031	IT-23	検索条件	P2	検索時の検索条件確認	削除成功を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-032	IT-23	検索条件	P2	検索時の検索条件確認	フォーム検証失敗を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でフォーム検証失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-033	IT-23	検索条件	P2	検索時の検索条件確認	DB 例外（更新・削除）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でDB 例外（更新・削除）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-034	IT-23	実行結果	P2	検索時の実行結果確認	削除後のリダイレクト分岐を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除後のリダイレクト分岐の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-035	IT-23	実行結果	P2	検索時の実行結果確認	出荷指示一覧で番号リンクまたは「編集」から詳細を開くを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で出荷指示一覧で番号リンクまたは「編集」から詳細を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-036	IT-23	実行結果	P2	検索時の実行結果確認	詳細で備考を入力し「登録」相当の送信ボタンを押すを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細で備考を入力し「登録」相当の送信ボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-037	IT-23	実行結果	P2	検索時の実行結果確認	詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-038	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-039	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-040	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-041	IT-26	登録内容	P1	登録時の登録内容確認	備考更新を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証通過後、当該リスト行の備考列と最終更新者 ID 列だけを上書きすること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-042	IT-26	登録内容	P1	登録時の登録内容確認	リスト削除を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でリスト削除の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-043	IT-26	登録内容	P1	登録時の登録内容確認	詳細の読込結合を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-044	IT-26	登録内容	P1	登録時の登録内容確認	{id} が存在しないを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-045	IT-26	登録内容	P1	登録時の登録内容確認	備考が長さ制約超過を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-046	IT-26	登録内容	P1	登録時の登録内容確認	リストに受注が無い、または受注に明細が無いを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-047	IT-26	登録内容	P1	登録時の登録内容確認	削除後リダイレクトのセッションキーを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除後リダイレクトのセッションキーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-048	IT-26	実行結果	P1	登録時の実行結果確認	詳細表示と DBを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細表示と DBの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-049	IT-23	実行結果	P1	登録時の実行結果確認	削除と受注を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除と受注の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除後、関連受注の出荷指示日は NULLであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-050	IT-26	更新内容	P1	更新時の更新内容確認	再表示を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で再表示の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-051	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で成功時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-052	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で失敗時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-053	IT-26	更新内容	P1	更新時の更新内容確認	副作用を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で副作用の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_shipping_standby、dtb_order.commit_date の一括 NULL 化、中間表削除、トランザクションコミットであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-054	IT-26	更新内容	P1	更新時の更新内容確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でdtb_shipping_standbyの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-055	IT-26	更新内容	P1	更新時の更新内容確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-056	IT-26	更新内容	P1	更新時の更新内容確認	dtb_orderを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-057	IT-26	更新内容	P1	更新時の更新内容確認	dtb_order_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-058	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-059	IT-26	更新内容	P1	更新時の更新内容確認	CSRFを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でCSRFの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-060	IT-05	実行結果	P1	更新時の実行結果確認	備考保存成功を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考保存成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-061	IT-05	実行結果	P1	更新時の実行結果確認	備考保存失敗（検証など）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考保存失敗（検証など）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET 詳細（エラーフラッシュ）であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-062	IT-05	削除条件	P1	削除時の削除条件確認	削除成功（現行の多くのケース）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET 出荷指示一覧入口 admin_shipping_standbyであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-063	IT-05	削除条件	P1	削除時の削除条件確認	削除成功（セッションに誤キーで無いページ番号があった場合など）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ルート admin_shipping_standby_search を指す生成がコード上あるがルート未定義のリスクがあること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-064	IT-05	削除条件	P1	削除時の削除条件確認	備考保存・保存失敗を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	詳細再描画でメッセージ表示であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-065	IT-05	削除条件	P1	削除時の削除条件確認	削除成功を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧側は検索セッションに依存して初期表示もしくは前回検索の復元が行われる（一覧実装を正とする）であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-066	IT-05	削除条件	P1	削除時の削除条件確認	フォーム検証失敗を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でフォーム検証失敗の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-067	IT-05	実行結果	P1	削除時の実行結果確認	DB 例外（更新・削除）を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でDB 例外（更新・削除）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-068	IT-05	実行結果	P1	削除時の実行結果確認	削除後のリダイレクト分岐を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除後のリダイレクト分岐の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin.shipping_standby.search.page_no を読む実装があること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-069	IT-05	実行結果	P1	削除時の実行結果確認	出荷指示一覧で番号リンクまたは「編集」から詳細を開くを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で出荷指示一覧で番号リンクまたは「編集」から詳細を開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-070	IT-05	実行結果	P1	削除時の実行結果確認	詳細で備考を入力し「登録」相当の送信ボタンを押すを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細で備考を入力し「登録」相当の送信ボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	CSRF 付きフォームが検証を通れば備考が保存され、フラッシュ成功のうえ同一詳細へ戻ること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-071	IT-02	初期行数	P2	初期行数の結合確認	詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細または一覧のドロップダウンから「リスト削除」相当のリンクを辿る（アンカーに…
3. 画面表示と後続状態を確認する"	トークン確認後、リスト削除と関連受注の出荷指示日クリアが行われ、一覧の入口へ戻ること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-072	IT-02	表示順	P2	表示順の結合確認	表示要素を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	詳細上部に出荷指示番号・作成日時・更新日時・最終更新者名、備考用テキストエリア、登録ボタン、ラベルが「リスト削除」の危険色ボタン風入力を内包するリンクであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-073	IT-25	更新抑止	P1	更新抑止の結合確認	JS 挙動を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でJS 挙動の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	印刷・一部 CSV は #form_bulk の action と target を切り替えて送信すること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-074	IT-12	内部情報	P1	内部情報の結合確認	モーダル・ポップアップを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	詳細テンプレート内に商品恒久的削除用と思われるモーダル断片がテーブル行付近に存在するが、本備考・リスト削除フローではこのモーダルを開くトリガは詳細画面の主要操作としては結び付いていないこと。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-075	IT-15	機密情報	P1	機密情報の結合確認	備考更新を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考更新の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証通過後、当該リスト行の備考列と最終更新者 ID 列だけを上書きすること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-076	IT-07	排他制御	P1	排他制御の結合確認	リスト削除を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でリスト削除の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	紐付く各受注の出荷指示日を NULL にしたのち、リスト行を削除すること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-077	IT-07	排他制御	P1	排他制御の結合確認	詳細の読込結合を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細の読込結合の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注に明細が 1 行も無い場合、内部結合によりリストが取得クエリに現れず 404 となりうるであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-078	IT-06	ロールバック	P3	ロールバックの結合確認	{id} が存在しないを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で{id} が存在しないの確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	表示・更新・削除とも HTTP 404であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-079	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	備考が長さ制約超過を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で備考が長さ制約超過の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 備考が長さ制約超過を確認する
3. 画面表示と後続状態を確認する"	サーバ側検証エラーとなり、保存エラーフラッシュで編集画面へ戻ること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-080	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	削除後リダイレクトのセッションキーを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除後リダイレクトのセッションキーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除後リダイレクトのセッションキー
3. 画面表示と後続状態を確認する"	一覧が書き込むキーと削除処理が読むキーが異なるため、意図した検索結果ページへの復帰は現行では期待しにくいであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-081	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	詳細表示と DBを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で詳細表示と DBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 詳細表示と DBを確認する
3. 画面表示と後続状態を確認する"	詳細表示時点の備考と一覧の行は別クエリであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	削除と受注を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で削除と受注の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除と受注
3. 画面表示と後続状態を確認する"	削除後、関連受注の出荷指示日は NULLであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-083	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	再表示を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 再表示を確認する
3. 画面表示と後続状態を確認する"	保存成功後はリダイレクトで詳細を再表示するため、フラッシュ後の画面は永続化後の値に追従すること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-084	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	成功時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML 詳細、もしくはリダイレクト応答であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-085	IT-25	一覧	P2	一覧の結合確認	失敗時出力を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	バリデーション失敗時はリダイレクトとエラーフラッシュであること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-086	IT-12	画面表示データ	P2	画面表示データの結合確認	副作用を試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-087	IT-25	画面表示データ	P2	画面表示データの結合確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でdtb_shipping_standbyの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_shipping_standbyを確認する
3. 画面表示と後続状態を確認する"	最終更新者であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-088	IT-12	画面表示データ	P2	画面表示データの結合確認	dtb_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でdtb_shipping_standbyの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_shipping_standbyを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-089	IT-25	画面表示データ	P2	画面表示データの結合確認	dtb_orderを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でdtb_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	リスト削除時に NULL 一括更新であること。
m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）	IT-M05-20-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-DETAIL-EDIT-DELETE-090	IT-25	フォーム送信	P1	フォーム送信の結合確認	dtb_order_shipping_standbyを試験できる状態である	m05-20_admin_order_order_shipping_standby_detail_edit_delete（管理画面_受注管理_出荷指示リスト詳細_備考編集・リスト削除）（m05_20_admin_order_order_shipping_standby_detail_edit_delete）でdtb_order_shipping_standbyの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_order_shipping_standbyを確認する
3. 画面表示と後続状態を確認する"	リスト削除で中間行が消える（テストにより cascade 的に除去されることを確認）であること。
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
| データベースアクセス / ポイント / ライフサイクル（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| その他 | 同種の対象外観点 3 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 8件 — No.330, No.382, No.385, No.387, No.412, No.413, No.414, No.416。上限緩和または個別ケース化で収載可能。
