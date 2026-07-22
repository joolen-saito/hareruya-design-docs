# m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-27_admin_order_order_waiting_tag.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
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
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-001	IT-15	CSRF	P1	CSRFの結合確認	管理画面ナビ「受注管理」配下の「店頭注文番号札管理」を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で管理画面ナビ「受注管理」配下の「店頭注文番号札管理」の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	選択店舗の注文番号札一覧と新規登録フォームが表示されるであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-002	IT-15	未認証	P1	未認証の結合確認	画面上の店名プルダウンを変更する（JavaScript がフォーム送信）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で画面上の店名プルダウンを変更する（JavaScript がフォーム送信）の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	選択した店舗を基準に一覧が付け替わるであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-003	IT-15	対象データ	P1	対象データの結合確認	「登録」ボタン（ログイン店舗が選択されているときのみ表示）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で「登録」ボタン（ログイン店舗が選択されているときのみ表示）の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功時は dtb_waiting_tag に行が追加され、一覧へリダイレクトして成功フラッシュが付くであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-004	IT-20	出力抑止	P1	出力抑止の結合確認	一覧行の「削除」からモーダル確定を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で一覧行の「削除」からモーダル確定の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	削除処理後、一覧へリダイレクトすること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-005	IT-20	識別子	P1	識別子の結合確認	「確認」ボタン（別タブ）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で「確認」ボタン（別タブ）の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	店頭側の表示確認用リンクとして別タブで開くこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-006	IT-15	状態変化	P1	状態変化の結合確認	表示要素を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で表示要素の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ページタイトルは admin.order.waiting_tag.titleであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	店名変更で #add_new_waiting_tag の action を m05-27_admin_order_order_waiting_tag に書き換えて自動送信すること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	モーダル・ポップアップを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	Bootstrap 系の削除確認モーダルであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-009	IT-25	URL	P2	URLの操作結果確認	M05-27-MSG-001を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-001を確認する
3. 画面表示と後続状態を確認する"	自店（WaitingTag.BaseInfo.id == BaseInfo.id）の一覧行で「削除」を押し #DeleteModal が shown.bs.modal になったとき（data-message を p.m…であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	M05-27-MSG-002を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M05-27-MSG-002を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	M05-27-MSG-003を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M05-27-MSG-003を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	M05-27-MSG-004を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-004の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-004を確認する
3. 画面表示と後続状態を確認する"	POST登録フォームが有効で、WaitingTagStoreActionが例外なく完了したときであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M05-27-MSG-005を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M05-27-MSG-005を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M05-27-MSG-006を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. M05-27-MSG-006を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	登録可否を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録可否を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	削除前確認を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 削除前確認
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	英字以外・数字のみ・記号混入を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 英字以外・数字のみ・記号混入を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	既に別店舗が同じ waiting_tag を保持を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 既に別店舗が同じ waiting_tag を保持を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-019	IT-22	部分入力	P2	部分入力の入力検証	削除対象 ID が存在しないを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除対象 ID が存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除対象 ID が存在しない
3. 画面表示と後続状態を確認する"	ルート解決段階でエラーになりうる（フレームワークの確認値）であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-020	IT-23	検索条件	P2	検索時の検索条件確認	ログイン店舗以外の店を一覧で見ているを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-021	IT-23	検索条件	P2	検索時の検索条件確認	ナビから開く・初期 GETを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-022	IT-23	検索条件	P2	検索時の検索条件確認	登録成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-023	IT-23	検索条件	P2	検索時の検索条件確認	登録失敗（検証または例外）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-024	IT-23	検索条件	P2	検索時の検索条件確認	登録・削除ボタンの見え方を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-025	IT-23	検索条件	P2	検索時の検索条件確認	DELETE ハンドラの検証を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-026	IT-23	検索条件	P2	検索時の検索条件確認	登録フォーム未送信または検証失敗を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-027	IT-23	検索条件	P2	検索時の検索条件確認	登録処理が重複等で例外を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-028	IT-23	検索条件	P2	検索時の検索条件確認	登録成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-029	IT-23	検索条件	P2	検索時の検索条件確認	削除処理が例外を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除処理が例外の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-030	IT-23	検索条件	P2	検索時の検索条件確認	削除成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-031	IT-23	検索条件	P2	検索時の検索条件確認	重複を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で重複の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-032	IT-23	検索条件	P2	検索時の検索条件確認	フロント連携を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でフロント連携の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-033	IT-23	検索条件	P2	検索時の検索条件確認	DBを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でDBの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-034	IT-23	実行結果	P2	検索時の実行結果確認	セッション（フラッシュ）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でセッション（フラッシュ）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-035	IT-23	実行結果	P2	検索時の実行結果確認	ログを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でログの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-036	IT-23	実行結果	P2	検索時の実行結果確認	トランザクション境界を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でトランザクション境界の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-037	IT-23	実行結果	P2	検索時の実行結果確認	ロックを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-038	IT-26	登録内容	P1	登録時の登録内容確認	例外時を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で例外時の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-039	IT-26	登録内容	P1	登録時の登録内容確認	管理画面ナビ「受注管理」配下の「店頭注文番号札管理」を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で管理画面ナビ「受注管理」配下の「店頭注文番号札管理」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-040	IT-26	登録内容	P1	登録時の登録内容確認	画面上の店名プルダウンを変更する（JavaScript がフォーム送信）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で画面上の店名プルダウンを変更する（JavaScript がフォーム送信）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-041	IT-26	登録内容	P1	登録時の登録内容確認	「登録」ボタン（ログイン店舗が選択されているときのみ表示）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で「登録」ボタン（ログイン店舗が選択されているときのみ表示）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証成功時は dtb_waiting_tag に行が追加され、一覧へリダイレクトして成功フラッシュが付くであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-042	IT-26	登録内容	P1	登録時の登録内容確認	一覧行の「削除」からモーダル確定を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で一覧行の「削除」からモーダル確定の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-043	IT-26	登録内容	P1	登録時の登録内容確認	「確認」ボタン（別タブ）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-044	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-045	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-046	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-047	IT-26	登録内容	P1	登録時の登録内容確認	M05-27-MSG-001を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-001の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-048	IT-26	実行結果	P1	登録時の実行結果確認	M05-27-MSG-002を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-002の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-049	IT-23	実行結果	P1	登録時の実行結果確認	M05-27-MSG-003を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-003の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録処理中にWaitingTagStoreActionが例外を送出したときであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-050	IT-26	更新内容	P1	更新時の更新内容確認	M05-27-MSG-004を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-004の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-051	IT-26	更新内容	P1	更新時の更新内容確認	M05-27-MSG-005を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-005の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-052	IT-26	更新内容	P1	更新時の更新内容確認	M05-27-MSG-006を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-006の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-053	IT-26	更新内容	P1	更新時の更新内容確認	登録可否を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録可否の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	waiting_tag 文字列について dtb_waiting_tag を店舗条件なしで検索し、1 件でもあれば登録拒否する（メッセージキー admin.order.waiting_tag.already_exists）であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-054	IT-26	更新内容	P1	更新時の更新内容確認	削除前確認を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除前確認の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-055	IT-26	更新内容	P1	更新時の更新内容確認	英字以外・数字のみ・記号混入を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-056	IT-26	更新内容	P1	更新時の更新内容確認	既に別店舗が同じ waiting_tag を保持を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-057	IT-26	更新内容	P1	更新時の更新内容確認	削除対象 ID が存在しないを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-058	IT-26	更新内容	P1	更新時の更新内容確認	ログイン店舗以外の店を一覧で見ているを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-059	IT-26	更新内容	P1	更新時の更新内容確認	ナビから開く・初期 GETを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でナビから開く・初期 GETの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-060	IT-05	実行結果	P1	更新時の実行結果確認	登録成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-061	IT-05	実行結果	P1	更新時の実行結果確認	登録失敗（検証または例外）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録失敗（検証または例外）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一テンプレートを描画であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-062	IT-05	削除条件	P1	削除時の削除条件確認	登録・削除ボタンの見え方を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ログイン店舗 ID と、選択店舗・各行の店舗 ID をテンプレートが比較し、一致するときだけ「登録」「削除」を描画すること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-063	IT-05	削除条件	P1	削除時の削除条件確認	DELETE ハンドラの検証を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	URL で指定した ID の行を削除処理へ渡すのみで、ログイン店舗との一致をサーバ側で再検証しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-064	IT-05	削除条件	P1	削除時の削除条件確認	登録フォーム未送信または検証失敗を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一画面を描画であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-065	IT-05	削除条件	P1	削除時の削除条件確認	登録処理が重複等で例外を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一画面を描画であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-066	IT-05	削除条件	P1	削除時の削除条件確認	登録成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録成功の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-067	IT-05	実行結果	P1	削除時の実行結果確認	削除処理が例外を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除処理が例外の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-068	IT-05	実行結果	P1	削除時の実行結果確認	削除成功を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧ルートへリダイレクトであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-069	IT-05	実行結果	P1	削除時の実行結果確認	重複を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で重複の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-070	IT-05	実行結果	P1	削除時の実行結果確認	フロント連携を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でフロント連携の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フロントは店舗 ID をパラメータに英字札一覧を取得すること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-071	IT-02	初期行数	P2	初期行数の結合確認	DBを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でDBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. DBを確認する
3. 画面表示と後続状態を確認する"	dtb_waiting_tag の INSERT（登録）、DELETE（削除）であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-072	IT-02	表示順	P2	表示順の結合確認	セッション（フラッシュ）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でセッション（フラッシュ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. セッション（フラッシュ）を確認する
3. 画面表示と後続状態を確認する"	登録失敗 admin.register.failed、登録成功 admin.register.complete、登録処理例外メッセージそのもの、削除失敗 admin.common.delete_errorであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-073	IT-25	更新抑止	P1	更新抑止の結合確認	ログを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でログの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	本コントローラは専用ログ出力を追加していない（共通ログに依存）であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-074	IT-12	内部情報	P1	内部情報の結合確認	トランザクション境界を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でトランザクション境界の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	明示的なトランザクション境界が実装にある場合は処理フローの保存処理を正とすること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-075	IT-15	機密情報	P1	機密情報の結合確認	ロックを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でロックの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	行ロック・悲観ロック・楽観ロック・ロックファイルを使用しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-076	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	例外時を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	検証エラーもしくは保存前の例外では対象更新を確定しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-077	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	管理画面ナビ「受注管理」配下の「店頭注文番号札管理」を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で管理画面ナビ「受注管理」配下の「店頭注文番号札管理」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面ナビ「受注管理」配下の「店頭注文番号札管理」を確認する
3. 画面表示と後続状態を確認する"	選択店舗の注文番号札一覧と新規登録フォームが表示されるであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-078	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	画面上の店名プルダウンを変更する（JavaScript がフォーム送信）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で画面上の店名プルダウンを変更する（JavaScript がフォーム送信）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の店名プルダウンを変更する（JavaScript がフォーム送信）
3. 画面表示と後続状態を確認する"	選択した店舗を基準に一覧が付け替わるであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-079	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	「登録」ボタン（ログイン店舗が選択されているときのみ表示）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で「登録」ボタン（ログイン店舗が選択されているときのみ表示）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「登録」ボタン（ログイン店舗が選択されているときのみ表示）
3. 画面表示と後続状態を確認する"	検証成功時は dtb_waiting_tag に行が追加され、一覧へリダイレクトして成功フラッシュが付くであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	一覧行の「削除」からモーダル確定を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で一覧行の「削除」からモーダル確定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧行の「削除」からモーダル確定
3. 画面表示と後続状態を確認する"	削除処理後、一覧へリダイレクトすること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-081	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	「確認」ボタン（別タブ）を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で「確認」ボタン（別タブ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「確認」ボタン（別タブ）を確認する
3. 画面表示と後続状態を確認する"	店頭側の表示確認用リンクとして別タブで開くこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	表示要素を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ページタイトルは admin.order.waiting_tag.titleであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-083	IT-12	画面表示データ	P2	画面表示データの結合確認	モーダル・ポップアップを試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-084	IT-12	画面表示データ	P2	画面表示データの結合確認	M05-27-MSG-002を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-002の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-002を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-085	IT-25	画面表示データ	P2	画面表示データの結合確認	M05-27-MSG-003を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-003の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-003を確認する
3. 画面表示と後続状態を確認する"	登録処理中にWaitingTagStoreActionが例外を送出したときであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-086	IT-16	ファイル選択	P2	ファイル選択の結合確認	M05-27-MSG-005を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-005の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-005を確認する
3. 画面表示と後続状態を確認する"	DELETE削除処理中にWaitingTagDeleteActionが例外を送出したときであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-087	IT-12	非同期更新	P1	非同期更新の結合確認	M05-27-MSG-006を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）でM05-27-MSG-006の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-27-MSG-006を確認する
3. 画面表示と後続状態を確認する"	登録POST時、waiting_tagが正規表現 /^[a-zA-Z]+$/ に一致しないこと。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-088	IT-12	エラー継続	P3	エラー継続の結合確認	登録可否を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で登録可否の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録可否を確認する
3. 画面表示と後続状態を確認する"	waiting_tag 文字列について dtb_waiting_tag を店舗条件なしで検索し、1 件でもあれば登録拒否する（メッセージキー admin.order.waiting_tag.already_exists）であること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-089	IT-25	件数上限	P2	件数上限の結合確認	削除前確認を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で削除前確認の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除前確認
3. 画面表示と後続状態を確認する"	削除処理も waiting_tag のみで存在確認し、無ければ admin.order.waiting_tag.not_found で失敗すること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-090	IT-25	欠損値	P2	欠損値の結合確認	英字以外・数字のみ・記号混入を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で英字以外・数字のみ・記号混入の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 英字以外・数字のみ・記号混入を確認する
3. 画面表示と後続状態を確認する"	検証エラーであること。
m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）	IT-M05-27-ADMIN-ORDER-ORDER-WAITING-TAG-091	IT-25	データなし	P2	データなしの結合確認	既に別店舗が同じ waiting_tag を保持を試験できる状態である	m05-27_admin_order_order_waiting_tag（管理画面_受注管理_店頭注文番号札管理）（m05_27_admin_order_order_waiting_tag）で既に別店舗が同じ waiting_tag を保持の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 既に別店舗が同じ waiting_tag を保持を確認する
3. 画面表示と後続状態を確認する"	登録処理が admin.order.waiting_tag.already_exists で失敗し、同一画面にエラーフラッシュであること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 7件 — No.109, No.110, No.111, No.346, No.357, No.381, No.416。上限緩和または個別ケース化で収載可能。
