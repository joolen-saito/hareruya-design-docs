# m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m05-17_admin_order_order_shipping_memo.html`

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
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-001	IT-15	CSRF	P1	CSRFの結合確認	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷情報ブロックに置かれる入力欄であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-002	IT-15	未認証	P1	未認証の結合確認	配達用メモを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で配達用メモの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷用メモを保存する列に対するCSV項目の表示名であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-003	IT-15	対象データ	P1	対象データの結合確認	受注編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	単一のお届け先を持つ受注を編集する画面であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-004	IT-20	出力抑止	P1	出力抑止の結合確認	出荷編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	お届け先（出荷）を編集する画面であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-005	IT-20	識別子	P1	識別子の結合確認	受注編集画面を開く（既存受注）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面を開く（既存受注）の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷が1件の受注では、出荷情報ブロックに出荷用メモ欄が表示され、保存済みのメモが初期表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-006	IT-15	状態変化	P1	状態変化の結合確認	受注新規登録画面を開くを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注新規登録画面を開くの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷情報ブロックに空の出荷用メモ欄が表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-007	IT-25	UI部品	P3	UI部品の操作結果確認	受注編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面で登録するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注編集画面で登録するを確認する
3. 画面表示と後続状態を確認する"	検証に成功すれば出荷用メモを含む出荷情報が受注の保存に同梱されて保存されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-008	IT-25	UI部品	P3	UI部品の操作結果確認	出荷編集画面を開く（お届け先を編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面を開く（お届け先を編集）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷編集画面を開く（お届け先を編集）
3. 画面表示と後続状態を確認する"	受注に紐づく各出荷のブロックに出荷用メモ欄が出荷ごとに表示され、保存済みのメモが初期表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-009	IT-25	操作起点	P1	操作起点の操作結果確認	出荷編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面で登録するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷編集画面で登録するを確認する
3. 画面表示と後続状態を確認する"	検証に成功すれば各出荷の出荷用メモを含む出荷情報が保存されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で未ログインまたは権限・IP制限で拒否される利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは権限・IP制限で拒否される利用者を確認する
3. 画面表示と後続状態を確認する"	管理画面の共通ルールに従いアクセスできないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	表示要素（受注編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で表示要素（受注編集）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素（受注編集）を確認する
3. 画面表示と後続状態を確認する"	出荷情報ブロック（見出し「出荷情報」）の中に、ラベル「出荷用メモ欄」と複数行入力欄を表示すること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素（出荷編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で表示要素（出荷編集）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素（出荷編集）を確認する
3. 画面表示と後続状態を確認する"	各出荷ブロックの中に、ラベル「出荷用メモ欄」と複数行入力欄（行数8）を表示すること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	JS挙動を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	出荷用メモ欄に固有のJavaScriptイベント、非同期取得、表示切替、入力補助は持たないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-014	IT-03	外部画面	P2	外部画面の操作結果確認	CSS・レイアウトを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	管理画面標準のフォームレイアウトに従い、ラベルと入力欄を1行に並べるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	モーダル・ポップアップを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	出荷用メモ欄はモーダル、ポップアップ、トースト、確認ダイアログを表示しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存単位を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で保存単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	出荷用メモは出荷ごとに1つ持つこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	受注編集画面での入力範囲を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面での入力範囲の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注編集画面での入力範囲
3. 画面表示と後続状態を確認する"	受注が複数お届け先でない場合のみ、受注編集画面で先頭の出荷の出荷用メモを編集できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存経路を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で保存経路の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存経路
3. 画面表示と後続状態を確認する"	受注編集画面では受注の保存に同梱して保存すること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	未入力時の扱いを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で未入力時の扱いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未入力時の扱い
3. 画面表示と後続状態を確認する"	出荷用メモ欄は任意項目であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	CSV出力での参照を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でCSV出力での参照の確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSV出力での参照を確認する
3. 画面表示と後続状態を確認する"	保存した出荷用メモは出荷用CSV・受注用CSVの項目「配達用メモ」として出力で参照できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷用メモ欄を確認する
3. 画面表示と後続状態を確認する"	dtb_shipping.note（フォームキー note、複数行入力textarea）であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	出荷用メモを空のまま保存を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモを空のまま保存の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷用メモを空のまま保存
3. 画面表示と後続状態を確認する"	保存先列はNULL相当となること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-023	IT-25	URL	P2	URLの操作結果確認	出荷用メモが3000文字を超えるを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモが3000文字を超えるの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷用メモが3000文字を超えるを確認する
3. 画面表示と後続状態を確認する"	フォームのLength検証で違反となり、保存しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	複数お届け先の受注を受注編集画面で開くを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 複数お届け先の受注を受注編集画面で開く
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	出荷編集画面でお届け先を追加を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 出荷編集画面でお届け先を追加を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	出荷編集画面でお届け先を削除を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 出荷編集画面でお届け先を削除
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	画面と保存値を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 画面と保存値
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	受注編集と出荷編集の整合を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 受注編集と出荷編集の整合を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSVとの整合を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. CSVとの整合を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	同時更新を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	入力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	受注編集画面もしくは出荷編集画面のフォーム送信に含まれる出荷用メモ欄の文字列であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_shippingを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_shippingを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録/更新を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 出荷用メモ欄を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ログイン済み管理者（受注管理を許可）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ログイン済み管理者（受注管理を許可）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ログイン済みだが権限マスタで当該パスが拒否を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でログイン済みだが権限マスタで当該パスが拒否の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ログイン済みだが権限マスタで当該パスが拒否を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	受注編集画面で登録に成功を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面で登録に成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注編集画面で登録に成功を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷用メモ欄を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	配達用メモを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 配達用メモを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 受注編集画面を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	出荷編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 出荷編集画面を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集画面を開く（既存受注）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 受注編集画面を開く（既存受注）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注新規登録画面を開くを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注新規登録画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注新規登録画面を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面で登録するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注編集画面で登録するを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	出荷編集画面を開く（お届け先を編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 出荷編集画面を開く（お届け先を編集）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	出荷編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 出荷編集画面で登録するを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素（受注編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素（受注編集）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素（出荷編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素（出荷編集）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS挙動を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSS・レイアウトを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	保存単位を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-056	IT-22	必須制御	P1	必須制御の入力検証	受注編集画面での入力範囲を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 受注編集画面での入力範囲
3. 画面表示と後続状態を確認する"	受注が複数お届け先でない場合のみ、受注編集画面で先頭の出荷の出荷用メモを編集できること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-057	IT-26	登録内容	P1	登録時の登録内容確認	未入力時の扱いを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で未入力時の扱いの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-058	IT-26	登録内容	P1	登録時の登録内容確認	CSV出力での参照を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でCSV出力での参照の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-059	IT-26	登録内容	P1	登録時の登録内容確認	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-060	IT-26	登録内容	P1	登録時の登録内容確認	出荷用メモを空のまま保存を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモを空のまま保存の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存先列はNULL相当となること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-061	IT-26	登録内容	P1	登録時の登録内容確認	出荷用メモが3000文字を超えるを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモが3000文字を超えるの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームのLength検証で違反となり、保存しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-062	IT-23	登録内容	P1	登録時の登録内容確認	複数お届け先の受注を受注編集画面で開くを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で複数お届け先の受注を受注編集画面で開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注編集画面に出荷用メモ欄を表示せず、当画面からは出荷用メモを編集しないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-063	IT-26	登録内容	P1	登録時の登録内容確認	出荷編集画面でお届け先を追加を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面でお届け先を追加の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	追加された出荷の出荷用メモ欄は空で表示され、登録時に当該出荷へ保存されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-064	IT-26	登録内容	P1	登録時の登録内容確認	出荷編集画面でお届け先を削除を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面でお届け先を削除の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除対象の出荷は明細とともに削除され、その出荷の出荷用メモも保持されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-065	IT-26	登録内容	P1	登録時の登録内容確認	画面と保存値を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で画面と保存値の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷用メモ欄の表示値は、画面を開いた時点で出荷に保存済みのメモであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-066	IT-26	登録内容	P1	登録時の登録内容確認	受注編集と出荷編集の整合を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集と出荷編集の整合の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一出荷の出荷用メモは、受注編集画面（出荷1件時）と出荷編集画面のどちらから編集しても同じ保存先列を更新すること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-067	IT-26	登録内容	P1	登録時の登録内容確認	CSVとの整合を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でCSVとの整合の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷用CSVの「配達用メモ」列は、出力時点で出荷に保存済みのメモを出力すること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-068	IT-26	登録内容	P1	登録時の登録内容確認	同時更新を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で同時更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-069	IT-26	登録内容	P1	登録時の登録内容確認	入力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-070	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-071	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-072	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-073	IT-26	登録内容	P1	登録時の登録内容確認	dtb_shippingを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でdtb_shippingの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-074	IT-26	実行結果	P1	登録時の実行結果確認	登録/更新を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で登録/更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-075	IT-23	実行結果	P1	登録時の実行結果確認	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	textarea（複数行）であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-076	IT-26	更新内容	P1	更新時の更新内容確認	ログイン済み管理者（受注管理を許可）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でログイン済み管理者（受注管理を許可）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-077	IT-26	更新内容	P1	更新時の更新内容確認	ログイン済みだが権限マスタで当該パスが拒否を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）でログイン済みだが権限マスタで当該パスが拒否の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-078	IT-26	更新内容	P1	更新時の更新内容確認	受注編集画面で登録に成功を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面で登録に成功の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-079	IT-26	更新内容	P1	更新時の更新内容確認	出荷用メモ欄を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷用メモ欄の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷情報ブロックに置かれる入力欄であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-080	IT-26	更新内容	P1	更新時の更新内容確認	配達用メモを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で配達用メモの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷用メモを保存する列に対するCSV項目の表示名であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-081	IT-23	更新内容	P1	更新時の更新内容確認	受注編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	単一のお届け先を持つ受注を編集する画面であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-082	IT-26	更新内容	P1	更新時の更新内容確認	出荷編集画面を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	お届け先（出荷）を編集する画面であること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-083	IT-26	更新内容	P1	更新時の更新内容確認	受注編集画面を開く（既存受注）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面を開く（既存受注）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷が1件の受注では、出荷情報ブロックに出荷用メモ欄が表示され、保存済みのメモが初期表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-084	IT-26	更新内容	P1	更新時の更新内容確認	受注新規登録画面を開くを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注新規登録画面を開くの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷情報ブロックに空の出荷用メモ欄が表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-085	IT-26	更新内容	P1	更新時の更新内容確認	受注編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で受注編集画面で登録するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証に成功すれば出荷用メモを含む出荷情報が受注の保存に同梱されて保存されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-086	IT-26	更新内容	P1	更新時の更新内容確認	出荷編集画面を開く（お届け先を編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面を開く（お届け先を編集）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注に紐づく各出荷のブロックに出荷用メモ欄が出荷ごとに表示され、保存済みのメモが初期表示されるであること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-087	IT-26	更新内容	P1	更新時の更新内容確認	出荷編集画面で登録するを試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で出荷編集画面で登録するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-088	IT-26	更新内容	P1	更新時の更新内容確認	未ログインまたは権限・IP制限で拒否される利用者を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-089	IT-26	更新内容	P1	更新時の更新内容確認	表示要素（受注編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）	IT-M05-17-ADMIN-ORDER-ORDER-SHIPPING-MEMO-090	IT-26	更新内容	P1	更新時の更新内容確認	表示要素（出荷編集）を試験できる状態である	m05-17_admin_order_order_shipping_memo（管理画面_受注管理_配達用メモ登録）（m05_17_admin_order_order_shipping_memo）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
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
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 19 件は上記分類と同じ理由で対象外 |
