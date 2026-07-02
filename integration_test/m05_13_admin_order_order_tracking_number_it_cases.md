# m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m05-13_admin_order_order_tracking_number.html`

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
| IT-23 | 実行結果、検索条件、登録内容 |
| IT-26 | 登録内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-001	IT-15	CSRF	P1	CSRFの結合確認	受注一覧を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷行を一覧表示する管理画面であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-002	IT-15	未認証	P1	未認証の結合確認	出荷情報を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で出荷情報の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷を表す台帳であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-003	IT-15	対象データ	P1	対象データの結合確認	受注一覧を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧を開くの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷行を含む受注一覧を表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-004	IT-20	出力抑止	P1	出力抑止の結合確認	受注一覧で問い合わせ番号を入力し更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧で問い合わせ番号を入力し更新の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	入力欄の値を非同期（XHR）で送信し、当該出荷の問い合わせ番号を保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-005	IT-20	識別子	P1	識別子の結合確認	受注編集を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注編集を開くの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出荷情報の中に問い合わせ番号（送り状No.）欄を、現在の保存値を初期値として表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-006	IT-15	状態変化	P1	状態変化の結合確認	受注編集で受注を保存を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注編集で受注を保存の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	問い合わせ番号欄を含む出荷情報フォームを受注全体の保存と同時に検証・保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-007	IT-25	UI部品	P3	UI部品の操作結果確認	非管理者・未認証を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	管理用ファイアウォールにより到達できず、本機能を利用できないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-008	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で表示要素（受注一覧）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素（受注一覧）を確認する
3. 画面表示と後続状態を確認する"	出荷行ごとに問い合わせ番号の入力欄（1行テキスト）と更新ボタンを表示する設計のJSを持つこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-009	IT-25	操作起点	P1	操作起点の操作結果確認	JS挙動（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でJS挙動（受注一覧）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（受注一覧）を確認する
3. 画面表示と後続状態を確認する"	更新ボタンは初期状態で無効であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	JS挙動（失敗応答）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でJS挙動（失敗応答）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（失敗応答）を確認する
3. 画面表示と後続状態を確認する"	XHRがHTTPエラー応答（4xx／5xx）を返した場合、応答JSONのmessages配列を改行連結してアラート表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	CSS・レイアウトを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でCSS・レイアウトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	更新ボタンのアイコンは未変更時がtext-secondary、変更検知時がtext-successであること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で表示要素（受注編集）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素（受注編集）を確認する
3. 画面表示と後続状態を確認する"	出荷情報の中に「送り状No.」ラベルとツールチップ付きの1行テキスト欄を表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	JS挙動（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でJS挙動（受注編集）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動（受注編集）を確認する
3. 画面表示と後続状態を確認する"	受注編集の問い合わせ番号欄は専用の非同期送信を持たず、受注編集フォームの通常送信で保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-014	IT-03	外部画面	P2	外部画面の操作結果確認	モーダル・ポップアップを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	本機能はモーダル・ポップアップ・トーストを表示しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	半角変換を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で半角変換の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 半角変換を確認する
3. 画面表示と後続状態を確認する"	受注一覧の非同期保存では、受け取った値を全角英数字から半角英数字へ変換してから検証・保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	文字種を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で文字種の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 文字種を確認する
3. 画面表示と後続状態を確認する"	半角英数字とハイフンのみを許可すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	最大長（一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で最大長（一覧の非同期保存）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最大長（一覧の非同期保存）
3. 画面表示と後続状態を確認する"	確認値255文字であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	最大長（受注編集フォーム）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で最大長（受注編集フォーム）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最大長（受注編集フォーム）を確認する
3. 画面表示と後続状態を確認する"	確認値200文字であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	保存単位を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で保存単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存単位
3. 画面表示と後続状態を確認する"	問い合わせ番号は出荷単位で保持すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	既存値の上書きを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で既存値の上書きの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 既存値の上書きを確認する
3. 画面表示と後続状態を確認する"	保存時は当該出荷の伝票番号列を受信値で上書きすること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	送り状No.（受注一覧の出荷行）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で送り状No.（受注一覧の出荷行）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送り状No.（受注一覧の出荷行）を確認する
3. 画面表示と後続状態を確認する"	dtb_shipping.tracking_numberであること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	送り状No.（受注編集の出荷情報）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で送り状No.（受注編集の出荷情報）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送り状No.（受注編集の出荷情報）を確認する
3. 画面表示と後続状態を確認する"	dtb_shipping.tracking_numberであること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-023	IT-25	URL	P2	URLの操作結果確認	値が空（受注一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で値が空（受注一覧の非同期保存）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 値が空（受注一覧の非同期保存）
3. 画面表示と後続状態を確認する"	文字種検証が空文字に一致せず検証エラーとなり保存しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	値が空（受注編集フォーム）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 値が空（受注編集フォーム）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	全角英数字を入力（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 全角英数字を入力（受注一覧）
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	全角英数字を入力（受注編集フォーム）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 全角英数字を入力（受注編集フォーム）
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ハイフン以外の記号・空白を含むを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. ハイフン以外の記号・空白を含むを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	最大長を超えるを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 最大長を超えるを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	存在しない出荷識別子（非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 存在しない出荷識別子（非同期保存）
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧と編集の一致を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で一覧と編集の一致の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と編集の一致を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照時点を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で参照時点の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	一覧・編集とも画面表示時点の永続化済みの値を表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	最大長の差を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で最大長の差の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 最大長の差を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	同時更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_shippingを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_shippingを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_shippingを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_shippingを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録/更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	送り状No.（受注一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で送り状No.（受注一覧の非同期保存）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送り状No.（受注一覧の非同期保存）
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	受注一覧を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注一覧を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	出荷情報を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 出荷情報を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注一覧を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 受注一覧を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注一覧で問い合わせ番号を入力し更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 受注一覧で問い合わせ番号を入力し更新
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 受注編集を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集で受注を保存を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注編集で受注を保存の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注編集で受注を保存
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	非管理者・未認証を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で非管理者・未認証の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 非管理者・未認証を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素（受注一覧）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS挙動（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. JS挙動（受注一覧）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSS・レイアウトを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素（受注編集）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS挙動（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS挙動（受注編集）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	半角変換を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 半角変換を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	文字種を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 文字種を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-056	IT-22	必須制御	P1	必須制御の入力検証	最大長（一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 最大長（一覧の非同期保存）
3. 画面表示と後続状態を確認する"	確認値255文字であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-057	IT-23	検索条件	P2	検索時の検索条件確認	保存単位を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-058	IT-23	検索条件	P2	検索時の検索条件確認	既存値の上書きを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-059	IT-23	検索条件	P2	検索時の検索条件確認	送り状No.（受注一覧の出荷行）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で送り状No.（受注一覧の出荷行）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_shipping.tracking_numberであること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-060	IT-23	検索条件	P2	検索時の検索条件確認	送り状No.（受注編集の出荷情報）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-061	IT-23	検索条件	P2	検索時の検索条件確認	値が空（受注一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-062	IT-23	検索条件	P2	検索時の検索条件確認	値が空（受注編集フォーム）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-063	IT-23	検索条件	P2	検索時の検索条件確認	全角英数字を入力（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-064	IT-23	検索条件	P2	検索時の検索条件確認	全角英数字を入力（受注編集フォーム）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-065	IT-23	検索条件	P2	検索時の検索条件確認	ハイフン以外の記号・空白を含むを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-066	IT-23	検索条件	P2	検索時の検索条件確認	最大長を超えるを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で最大長を超えるの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-067	IT-23	検索条件	P2	検索時の検索条件確認	存在しない出荷識別子（非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で存在しない出荷識別子（非同期保存）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-068	IT-23	検索条件	P2	検索時の検索条件確認	一覧と編集の一致を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で一覧と編集の一致の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-069	IT-23	検索条件	P2	検索時の検索条件確認	参照時点を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で参照時点の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-070	IT-23	検索条件	P2	検索時の検索条件確認	最大長の差を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で最大長の差の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	非同期保存は255文字まで、編集フォームは200文字までを許すであること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-071	IT-23	検索条件	P2	検索時の検索条件確認	同時更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で同時更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-072	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-073	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-074	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で副作用の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷情報の伝票番号列の更新であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-075	IT-23	実行結果	P2	検索時の実行結果確認	dtb_shippingを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でdtb_shippingの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-076	IT-23	実行結果	P2	検索時の実行結果確認	登録/更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で登録/更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-077	IT-26	登録内容	P1	登録時の登録内容確認	送り状No.（受注一覧の非同期保存）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で送り状No.（受注一覧の非同期保存）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-078	IT-26	登録内容	P1	登録時の登録内容確認	受注一覧を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-079	IT-26	登録内容	P1	登録時の登録内容確認	出荷情報を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で出荷情報の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-080	IT-26	登録内容	P1	登録時の登録内容確認	受注一覧を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷行を含む受注一覧を表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-081	IT-26	登録内容	P1	登録時の登録内容確認	受注一覧で問い合わせ番号を入力し更新を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注一覧で問い合わせ番号を入力し更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入力欄の値を非同期（XHR）で送信し、当該出荷の問い合わせ番号を保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-082	IT-23	登録内容	P1	登録時の登録内容確認	受注編集を開くを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注編集を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷情報の中に問い合わせ番号（送り状No.）欄を、現在の保存値を初期値として表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-083	IT-26	登録内容	P1	登録時の登録内容確認	受注編集で受注を保存を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で受注編集で受注を保存の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	問い合わせ番号欄を含む出荷情報フォームを受注全体の保存と同時に検証・保存すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-084	IT-26	登録内容	P1	登録時の登録内容確認	非管理者・未認証を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で非管理者・未認証の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理用ファイアウォールにより到達できず、本機能を利用できないこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-085	IT-26	登録内容	P1	登録時の登録内容確認	表示要素（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で表示要素（受注一覧）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出荷行ごとに問い合わせ番号の入力欄（1行テキスト）と更新ボタンを表示する設計のJSを持つこと。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-086	IT-26	登録内容	P1	登録時の登録内容確認	JS挙動（受注一覧）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でJS挙動（受注一覧）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新ボタンは初期状態で無効であること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-087	IT-26	登録内容	P1	登録時の登録内容確認	JS挙動（失敗応答）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でJS挙動（失敗応答）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	XHRがHTTPエラー応答（4xx／5xx）を返した場合、応答JSONのmessages配列を改行連結してアラート表示すること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-088	IT-26	登録内容	P1	登録時の登録内容確認	CSS・レイアウトを試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）でCSS・レイアウトの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-089	IT-26	登録内容	P1	登録時の登録内容確認	表示要素（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）	IT-M05-13-ADMIN-ORDER-ORDER-TRACKING-NUMBER-090	IT-26	登録内容	P1	登録時の登録内容確認	JS挙動（受注編集）を試験できる状態である	m05-13_admin_order_order_tracking_number（管理画面_受注_問い合わせ番号入力）（m05_13_admin_order_order_tracking_number）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
| その他 | 同種の対象外観点 20 件は上記分類と同じ理由で対象外 |
