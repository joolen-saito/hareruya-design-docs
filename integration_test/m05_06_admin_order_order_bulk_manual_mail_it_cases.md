# m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、一覧、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 更新内容 |
| IT-05 | 実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-11 | 実行結果 |
| IT-28 | ヘッダ、件名、実行結果、本文 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-001	IT-15	CSRF	P1	CSRFの結合確認	メール送信履歴テーブルを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でメール送信履歴テーブルの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_mail_history（主キー id）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-002	IT-15	未認証	P1	未認証の結合確認	一括送信の確認画面を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一括送信の確認画面の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	確認画面あり（mode=confirm で文面プレビュー → mode=complete で送信、manual_mail_all_confirm.twig）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-003	IT-15	対象データ	P1	対象データの結合確認	送信成功フラッシュを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信成功フラッシュの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	admin.order.mail_send_completeであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-004	IT-20	出力抑止	P1	出力抑止の結合確認	送信後リダイレクトを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信後リダイレクトの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	admin_order へであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-005	IT-20	識別子	P1	識別子の結合確認	受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	テンプレート未選択の一括手動メール入力画面が開くこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-006	IT-15	状態変化	P1	状態変化の結合確認	一覧で未チェックのまま「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一覧で未チェックのまま「メール一括通知」を押すの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	alert で「チェックボックスが選択されていません」と表示し、遷移を止めるであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	入力画面でテンプレートプルダウンを変更するを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で入力画面でテンプレートプルダウンを変更するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力画面でテンプレートプルダウンを変更する
3. 画面表示と後続状態を確認する"	選択IDをクエリに付けたまま、本文プレビュー欄が再構築される（フルページ遷移）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	入力画面で「確認」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で入力画面で「確認」を押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力画面で「確認」を押す
3. 画面表示と後続状態を確認する"	検証成功時、先頭受注を用いた文面プレビュー付き確認画面を返すこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-009	IT-25	URL	P2	URLの操作結果確認	確認画面で「送信」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で確認画面で「送信」を押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認画面で「送信」を押す
3. 画面表示と後続状態を確認する"	受注ごとにメールを送り、成功フラッシュのうえ admin_order へリダイレクトすること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	確認画面で「手動メール通知画面に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 確認画面で「手動メール通知画面に戻る」を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	入力画面で「受注一覧に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力画面で「受注一覧に戻る」
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	一覧は検索結果件数が正のときだけ一括用 form_bulk と「その他」ドロップダウンが描画されるであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	JS挙動を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	件名を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一部の配送IDがDBに存在しないを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一部の配送IDがDBに存在しないを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	確認画面で先頭受注が無い（理論上、受注配列が空）を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 確認画面で先頭受注が無い（理論上、受注配列が空）を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	外部メールを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 外部メールを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-019	IT-22	部分入力	P2	部分入力の入力検証	DBを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でDBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. DBを確認する
3. 画面表示と後続状態を確認する"	送信のたび dtb_mail_history に行を追加し都度 flush すること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-020	IT-23	検索条件	P2	検索時の検索条件確認	ログを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-021	IT-23	検索条件	P2	検索時の検索条件確認	フラッシュを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-022	IT-23	検索条件	P2	検索時の検索条件確認	一覧から入口URLへ遷移成功を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-023	IT-23	検索条件	P2	検索時の検索条件確認	確認で送信POST成功を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-024	IT-23	検索条件	P2	検索時の検索条件確認	配送ID欠落エラーを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-025	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-003を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-026	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-004を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-027	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-005を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-028	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-010を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-010の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-029	IT-23	検索条件	P2	検索時の検索条件確認	EE-JS-MSG-049を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でEE-JS-MSG-049の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-030	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-008を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-008の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-031	IT-23	検索条件	P2	検索時の検索条件確認	M05-06-MSG-009を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-009の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-032	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション境界を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でトランザクション境界の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-033	IT-23	実行結果	P2	検索時の実行結果確認	ロックを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-034	IT-23	実行結果	P2	検索時の実行結果確認	例外時を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で例外時の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-035	IT-23	実行結果	P2	検索時の実行結果確認	メール送信履歴テーブルを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でメール送信履歴テーブルの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-036	IT-23	実行結果	P2	検索時の実行結果確認	一括送信の確認画面を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一括送信の確認画面の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-037	IT-26	更新内容	P1	更新時の更新内容確認	送信成功フラッシュを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信成功フラッシュの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-038	IT-26	更新内容	P1	更新時の更新内容確認	送信後リダイレクトを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信後リダイレクトの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-039	IT-26	更新内容	P1	更新時の更新内容確認	受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-040	IT-26	更新内容	P1	更新時の更新内容確認	一覧で未チェックのまま「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一覧で未チェックのまま「メール一括通知」を押すの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	alert で「チェックボックスが選択されていません」と表示し、遷移を止めるであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-041	IT-26	更新内容	P1	更新時の更新内容確認	入力画面でテンプレートプルダウンを変更するを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で入力画面でテンプレートプルダウンを変更するの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-042	IT-26	更新内容	P1	更新時の更新内容確認	入力画面で「確認」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-043	IT-26	更新内容	P1	更新時の更新内容確認	確認画面で「送信」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-044	IT-26	更新内容	P1	更新時の更新内容確認	確認画面で「手動メール通知画面に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-045	IT-26	更新内容	P1	更新時の更新内容確認	入力画面で「受注一覧に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-046	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-047	IT-05	実行結果	P1	更新時の実行結果確認	JS挙動を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でJS挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-048	IT-05	実行結果	P1	更新時の実行結果確認	モーダル・ポップアップを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	確認は別テンプレートの画面遷移で行う（専用モーダルはない）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-049	IT-02	初期行数	P2	初期行数の結合確認	件名を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で件名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件名を確認する
3. 画面表示と後続状態を確認する"	送信時に sendManualMailForBulk の件名として使われ、履歴の件名にもなること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-050	IT-02	表示順	P2	表示順の結合確認	一部の配送IDがDBに存在しないを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一部の配送IDがDBに存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一部の配送IDがDBに存在しないを確認する
3. 画面表示と後続状態を確認する"	欠落IDごとにエラーフラッシュ、admin_order へ戻ること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-051	IT-25	更新抑止	P1	更新抑止の結合確認	確認画面で先頭受注が無い（理論上、受注配列が空）を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で確認画面で先頭受注が無い（理論上、受注配列が空）の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	プレビュー本文は空であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-052	IT-12	内部情報	P1	内部情報の結合確認	外部メールを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で外部メールの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注ごとに1通ずつ SMTP 等へ送信する（ループ内順次）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-053	IT-15	機密情報	P1	機密情報の結合確認	DBを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でDBの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信のたび dtb_mail_history に行を追加し都度 flush すること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-054	IT-11	実行結果	P2	実行結果の結合確認	ログを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でログの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ログを確認する
3. 画面表示と後続状態を確認する"	本コントローラは送信ログを独自に追記しない（メーラー層のログに依存）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-055	IT-28	実行結果	P2	実行結果の結合確認	フラッシュを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でフラッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フラッシュを確認する
3. 画面表示と後続状態を確認する"	欠落配送ID時はエラー複数、送信完了時は成功1件であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-056	IT-28	実行結果	P2	実行結果の結合確認	一覧から入口URLへ遷移成功を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一覧から入口URLへ遷移成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧から入口URLへ遷移成功を確認する
3. 画面表示と後続状態を確認する"	一括手動メール入力（テンプレ未選もしくは選択済み）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-057	IT-28	ヘッダ	P2	ヘッダの結合確認	確認で送信POST成功を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で確認で送信POST成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認で送信POST成功
3. 画面表示と後続状態を確認する"	admin_order（受注一覧であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-058	IT-28	件名	P2	件名の結合確認	配送ID欠落エラーを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. 配送ID欠落エラーを確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-059	IT-28	件名	P2	件名の結合確認	M05-06-MSG-003を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で件名の対象項目を未入力にする	"1. 対象画面を表示する
2. M05-06-MSG-003を確認する
3. 画面表示と後続状態を確認する"	件名でエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-060	IT-28	件名	P2	件名の結合確認	M05-06-MSG-004を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-004の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-06-MSG-004を確認する
3. 画面表示と後続状態を確認する"	一括手動メール通知画面へのアクセス時、指定した配送IDのうち ShippingRepository で取得できないIDが存在するとき（%s は未取得の配送ID）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-061	IT-28	本文	P2	本文の結合確認	M05-06-MSG-005を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. M05-06-MSG-005を確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示され、対象処理が完了しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-062	IT-28	本文	P2	本文の結合確認	M05-06-MSG-010を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で本文の対象項目を未入力にする	"1. 対象画面を表示する
2. M05-06-MSG-010を確認する
3. 画面表示と後続状態を確認する"	本文でエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-063	IT-28	本文	P2	本文の結合確認	EE-JS-MSG-049を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でEE-JS-MSG-049の確認に必要な条件を指定する	"1. 対象画面を表示する
2. EE-JS-MSG-049を確認する
3. 画面表示と後続状態を確認する"	受注一覧で配送行のチェックが0件のまま「その他」ドロップダウン内の「メール一括通知」（#manualMailAll、a.dropdown-item）を押したときであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-064	IT-28	本文	P2	本文の結合確認	M05-06-MSG-008を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-008の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-06-MSG-008を確認する
3. 画面表示と後続状態を確認する"	手動メール通知画面でテンプレ選択・件名・メッセージ本文のいずれかが未入力のまま mode=confirm／complete を送信したとき（NotBlank違反）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-065	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M05-06-MSG-009を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-009の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-06-MSG-009を確認する
3. 画面表示と後続状態を確認する"	一括手動メール通知画面でテンプレ選択・件名が未入力のまま mode=confirm／complete を送信したとき（NotBlank違反）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-066	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M05-06-MSG-010を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でM05-06-MSG-010の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M05-06-MSG-010を確認する
3. 画面表示と後続状態を確認する"	#send_mail のクリック時、mode=complete のPOST送信前にブラウザ標準confirmを表示であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-067	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	トランザクション境界を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	複数受注へのメール送信全体を包む明示トランザクションは持たないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-068	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ロックを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	受注、配送、メール履歴に対する行ロック・悲観ロック・楽観ロック・ロックファイルは使用しないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-069	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	例外時を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	途中の送信もしくは履歴保存で例外が起きた場合、すでに送信済みのメールとflush済みのメール履歴は戻らないこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-070	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	メール送信履歴テーブルを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でメール送信履歴テーブルの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メール送信履歴テーブル
3. 画面表示と後続状態を確認する"	dtb_mail_history（主キー id）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-071	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	一括送信の確認画面を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一括送信の確認画面の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括送信の確認画面
3. 画面表示と後続状態を確認する"	確認画面あり（mode=confirm で文面プレビュー → mode=complete で送信、manual_mail_all_confirm.twig）であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-072	IT-25	一覧	P2	一覧の結合確認	送信成功フラッシュを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信成功フラッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信成功フラッシュ
3. 画面表示と後続状態を確認する"	admin.order.mail_send_completeであること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-073	IT-12	画面表示データ	P2	画面表示データの結合確認	送信後リダイレクトを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で送信後リダイレクトの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送信後リダイレクト
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-074	IT-25	画面表示データ	P2	画面表示データの結合確認	受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注一覧で1件以上の配送行にチェックを入れ、「その他」→「メール一括通知」を押すを確認する
3. 画面表示と後続状態を確認する"	テンプレート未選択の一括手動メール入力画面が開くこと。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-075	IT-12	画面表示データ	P2	画面表示データの結合確認	一覧で未チェックのまま「メール一括通知」を押すを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で一覧で未チェックのまま「メール一括通知」を押すの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧で未チェックのまま「メール一括通知」を押すを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-076	IT-12	非同期更新	P1	非同期更新の結合確認	確認画面で「手動メール通知画面に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で確認画面で「手動メール通知画面に戻る」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 確認画面で「手動メール通知画面に戻る」を確認する
3. 画面表示と後続状態を確認する"	入力画面に戻ること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-077	IT-12	エラー継続	P3	エラー継続の結合確認	入力画面で「受注一覧に戻る」を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）で入力画面で「受注一覧に戻る」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力画面で「受注一覧に戻る」
3. 画面表示と後続状態を確認する"	一覧へ戻ること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-078	IT-25	欠損値	P2	欠損値の結合確認	JS挙動を試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	テンプレ選択変更時、全 ids_* hidden の値を拾って ids%5B%5D= を連結し、ルート admin_order_manual_mail_all もしくは admin_order_manual_mail_…であること。
m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）	IT-M05-06-ADMIN-ORDER-ORDER-BULK-MANUAL-MAIL-079	IT-25	データなし	P2	データなしの結合確認	モーダル・ポップアップを試験できる状態である	m05-06_admin_order_order_bulk_manual_mail（受注管理 — メール一括通知／手動メール一括）（m05_06_admin_order_order_bulk_manual_mail）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	確認は別テンプレートの画面遷移で行う（専用モーダルはない）であること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 9件 — No.50, No.109, No.110, No.111, No.359, No.381, No.382, No.412, No.416。上限緩和または個別ケース化で収載可能。
