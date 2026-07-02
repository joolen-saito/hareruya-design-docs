# m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m05-14_admin_order_order_status_change.html`

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
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-001	IT-15	CSRF	P1	CSRFの結合確認	遷移先ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で遷移先ステータスの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	対応状況プルダウンで選べる、現在のステータスから変更可能なステータスであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-002	IT-15	未認証	P1	未認証の結合確認	受注ステータス遷移の許可規則を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で受注ステータス遷移の許可規則の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	状態遷移の定義により、現在のステータスから到達できる遷移先を限定する仕組みであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-003	IT-15	対象データ	P1	対象データの結合確認	対応状況変更操作を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更操作の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注編集（詳細）画面で対応状況だけを変更して保存する操作であること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-004	IT-20	出力抑止	P1	出力抑止の結合確認	現在のステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で現在のステータスの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	画面表示時点の受注の対応状況であること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-005	IT-20	識別子	P1	識別子の結合確認	受注編集（詳細）画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で受注編集（詳細）画面を開くの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注の現在の対応状況を表示名で表示し、対応状況プルダウンに遷移可能なステータスを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-006	IT-15	状態変化	P1	状態変化の結合確認	対応状況変更操作を送信を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更操作を送信の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	選択した遷移先ステータスへ変更・保存し、同じ受注編集（詳細）画面へリダイレクトしてフラッシュメッセージを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-007	IT-25	UI部品	P3	UI部品の操作結果確認	新規受注登録画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で新規受注登録画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 新規受注登録画面を開く
3. 画面表示と後続状態を確認する"	新規受注では対応状況プルダウンと対応状況変更操作を表示しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-008	IT-25	UI部品	P3	UI部品の操作結果確認	未認証・管理画面へ到達できない利用者を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で未認証・管理画面へ到達できない利用者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未認証・管理画面へ到達できない利用者を確認する
3. 画面表示と後続状態を確認する"	受注編集（詳細）画面自体に到達できないため、本操作も利用できないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-009	IT-25	操作起点	P1	操作起点の操作結果確認	表示要素を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	受注情報領域に「現在のステータス」として現在の対応状況の表示名を表示し、その下に「対応状況」プルダウンを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	対応状況プルダウンを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況プルダウンを確認する
3. 画面表示と後続状態を確認する"	単一選択のプルダウンであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	対応状況変更ボタンを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況変更ボタンを確認する
3. 画面表示と後続状態を確認する"	押下すると受注編集フォームの送信種別を status_change にし、フォームのアクションを受注編集（詳細）画面のパスへ戻したうえでフォームを送信すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	JS 挙動による確認ダイアログを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でJS 挙動による確認ダイアログの確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動による確認ダイアログを確認する
3. 画面表示と後続状態を確認する"	取消へ変更する場合と、取消から他ステータスへ変更する場合に、在庫・ポイントの変動内容を説明する確認ダイアログを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	入力項目を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	本操作で利用者が入力するのは対応状況プルダウンの選択のみであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-014	IT-03	外部画面	P2	外部画面の操作結果確認	%from% から %to% にはステータス変更できませんを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で%from% から %to% にはステータス変更できませんの確認に必要な条件を指定する	"1. 対象画面を表示する
2. %from% から %to% にはステータス変更できませんを確認する
3. 画面表示と後続状態を確認する"	受注編集フォームの受注ステータス検証で表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	変更前後が同一ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で変更前後が同一ステータスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更前後が同一ステータスを確認する
3. 画面表示と後続状態を確認する"	メッセージなしで受注編集（詳細）画面を再表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できないを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できないを確認する
3. 画面表示と後続状態を確認する"	フラッシュなしで受注編集（詳細）画面を再表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	遷移先の絞り込みを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で遷移先の絞り込みの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 遷移先の絞り込みを確認する
3. 画面表示と後続状態を確認する"	対応状況プルダウンの選択肢は、受注ステータス遷移の許可規則で現在のステータスから到達できる遷移先に限るであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	変更の成立条件を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で変更の成立条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更の成立条件を確認する
3. 画面表示と後続状態を確認する"	変更前ステータスと変更後ステータスがともに取得でき、両者が異なり、受注フォームが妥当であることを成立条件とすること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	日時の自動セットを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で日時の自動セットの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 日時の自動セットを確認する
3. 画面表示と後続状態を確認する"	出荷完了・取消・入金済み・ピック中への遷移で、それぞれ出荷日・取消日・入金日・確認日を現在日時でセットすること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	出荷完了時のポイントを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で出荷完了時のポイントの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷完了時のポイントを確認する
3. 画面表示と後続状態を確認する"	出荷完了へ新たに遷移したときのみ、付与ポイントを会員残高へ反映し、外部在庫連携へ発生ポイントを連携すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	更新者・更新日時を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で更新者・更新日時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 更新者・更新日時を確認する
3. 画面表示と後続状態を確認する"	変更成立時に受注の更新者を操作中の管理者、更新日時を現在日時で更新すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	対応状況を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況を確認する
3. 画面表示と後続状態を確認する"	dtb_order.order_status_idであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-023	IT-25	URL	P2	URLの操作結果確認	変更前と変更後が同一ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で変更前と変更後が同一ステータスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更前と変更後が同一ステータスを確認する
3. 画面表示と後続状態を確認する"	変更せず受注編集（詳細）画面へリダイレクトすること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	変更前または変更後のステータスが取得できないを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 変更前または変更後のステータスが取得できないを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	許可されない遷移先を強制送信を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 許可されない遷移先を強制送信
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	取消日・入金日・確認日が既に設定済みを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 取消日・入金日・確認日が既に設定済みを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	出荷完了へ遷移、ただし変更前が既に出荷完了を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 出荷完了へ遷移、ただし変更前が既に出荷完了を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	取消から他ステータスへ戻すを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 取消から他ステータスへ戻すを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照時点を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	変更の原子性を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で変更の原子性の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 変更の原子性を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	出荷日の整合を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で出荷日の整合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 出荷日の整合を確認する
3. 画面表示と後続状態を確認する"	出荷完了へ遷移したとき、受注の出荷日と各配送の出荷日に同一の現在日時をセットすること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧との整合を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で一覧との整合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧との整合を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	APIを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で失敗時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	入力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_orderを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でdtb_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	dtb_orderを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でdtb_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	遷移先ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で遷移先ステータスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 遷移先ステータスを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注ステータス遷移の許可規則を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 受注ステータス遷移の許可規則を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	対応状況変更操作を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 対応状況変更操作を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	現在のステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 現在のステータスを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注編集（詳細）画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 受注編集（詳細）画面を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	対応状況変更操作を送信を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更操作を送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対応状況変更操作を送信
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	新規受注登録画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で新規受注登録画面を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 新規受注登録画面を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	未認証・管理画面へ到達できない利用者を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 未認証・管理画面へ到達できない利用者を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	対応状況変更ボタンを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 対応状況変更ボタンを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS 挙動による確認ダイアログを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動による確認ダイアログを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力項目を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	%from% から %to% にはステータス変更できませんを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. %from% から %to% にはステータス変更できませんを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	変更前後が同一ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 変更前後が同一ステータスを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できないを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 受注フォームが妥当でない、または変更前後のいずれかのステータスが取得できないを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-056	IT-22	必須制御	P1	必須制御の入力検証	遷移先の絞り込みを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 遷移先の絞り込みを確認する
3. 画面表示と後続状態を確認する"	対応状況プルダウンの選択肢は、受注ステータス遷移の許可規則で現在のステータスから到達できる遷移先に限るであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-057	IT-23	検索条件	P2	検索時の検索条件確認	日時の自動セットを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-058	IT-23	検索条件	P2	検索時の検索条件確認	出荷完了時のポイントを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-059	IT-23	検索条件	P2	検索時の検索条件確認	更新者・更新日時を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で更新者・更新日時の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	変更成立時に受注の更新者を操作中の管理者、更新日時を現在日時で更新すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-060	IT-23	検索条件	P2	検索時の検索条件確認	対応状況を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-061	IT-23	検索条件	P2	検索時の検索条件確認	変更前と変更後が同一ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-062	IT-23	検索条件	P2	検索時の検索条件確認	変更前または変更後のステータスが取得できないを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-063	IT-23	検索条件	P2	検索時の検索条件確認	許可されない遷移先を強制送信を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-064	IT-23	検索条件	P2	検索時の検索条件確認	取消日・入金日・確認日が既に設定済みを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-065	IT-23	検索条件	P2	検索時の検索条件確認	出荷完了へ遷移、ただし変更前が既に出荷完了を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-066	IT-23	検索条件	P2	検索時の検索条件確認	取消から他ステータスへ戻すを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で取消から他ステータスへ戻すの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-067	IT-23	検索条件	P2	検索時の検索条件確認	参照時点を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で参照時点の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-068	IT-23	検索条件	P2	検索時の検索条件確認	変更の原子性を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で変更の原子性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-069	IT-23	検索条件	P2	検索時の検索条件確認	出荷日の整合を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で出荷日の整合の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-070	IT-23	検索条件	P2	検索時の検索条件確認	一覧との整合を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で一覧との整合の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注一覧で表示するステータス・各日時は、本操作の保存完了後の永続化済みデータに従うであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-071	IT-23	検索条件	P2	検索時の検索条件確認	APIを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でAPIの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-072	IT-23	検索条件	P2	検索時の検索条件確認	失敗時を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で失敗時の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-073	IT-23	実行結果	P2	検索時の実行結果確認	入力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で入力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-074	IT-23	実行結果	P2	検索時の実行結果確認	成功時出力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注ステータスと関連日時・更新者・更新日時を保存し、受注編集（詳細）画面へリダイレクトしてフラッシュメッセージを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-075	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-076	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で副作用の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-077	IT-23	実行結果	P2	検索時の実行結果確認	dtb_orderを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でdtb_orderの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-078	IT-26	登録内容	P1	登録時の登録内容確認	dtb_orderを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）でdtb_orderの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-079	IT-26	登録内容	P1	登録時の登録内容確認	遷移先ステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で遷移先ステータスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-080	IT-26	登録内容	P1	登録時の登録内容確認	受注ステータス遷移の許可規則を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で受注ステータス遷移の許可規則の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-081	IT-26	登録内容	P1	登録時の登録内容確認	対応状況変更操作を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更操作の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注編集（詳細）画面で対応状況だけを変更して保存する操作であること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-082	IT-26	登録内容	P1	登録時の登録内容確認	現在のステータスを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で現在のステータスの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	画面表示時点の受注の対応状況であること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-083	IT-23	登録内容	P1	登録時の登録内容確認	受注編集（詳細）画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で受注編集（詳細）画面を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注の現在の対応状況を表示名で表示し、対応状況プルダウンに遷移可能なステータスを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-084	IT-26	登録内容	P1	登録時の登録内容確認	対応状況変更操作を送信を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更操作を送信の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	選択した遷移先ステータスへ変更・保存し、同じ受注編集（詳細）画面へリダイレクトしてフラッシュメッセージを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-085	IT-26	登録内容	P1	登録時の登録内容確認	新規受注登録画面を開くを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で新規受注登録画面を開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	新規受注では対応状況プルダウンと対応状況変更操作を表示しないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-086	IT-26	登録内容	P1	登録時の登録内容確認	未認証・管理画面へ到達できない利用者を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で未認証・管理画面へ到達できない利用者の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注編集（詳細）画面自体に到達できないため、本操作も利用できないこと。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-087	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	受注情報領域に「現在のステータス」として現在の対応状況の表示名を表示し、その下に「対応状況」プルダウンを表示すること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-088	IT-26	登録内容	P1	登録時の登録内容確認	対応状況プルダウンを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況プルダウンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	単一選択のプルダウンであること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-089	IT-26	登録内容	P1	登録時の登録内容確認	対応状況変更ボタンを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で対応状況変更ボタンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）	IT-M05-14-ADMIN-ORDER-ORDER-STATUS-CHANGE-090	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動による確認ダイアログを試験できる状態である	m05-14_admin_order_order_status_change（管理画面_受注対応状況の変更）（m05_14_admin_order_order_status_change）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
