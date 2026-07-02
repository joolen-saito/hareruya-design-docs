# m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.html`（正本 `functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_13_admin_stock_stock_split_join_register_edit_it_cases.md`（母集合 計90観点行）

分類の母集合は **観点表（`integration-test-viewpoints.md`）の各観点を本機能へ適用したインスタンス**であり、その実体が既存IT cases の90観点行（接頭辞 `IT-M04-13-ADMIN-STOCK-STOCK-SPLIT-JOIN-REGISTER-EDIT-NNN`・観点表の全観点を本機能向けに展開済み）である。よって本書の付帯表2/2bで90行すべてを分類＝観点表母集合の全行を監査対象に含む。

期待結果は画面表示・遷移・URL・フラッシュメッセージ・別画面での間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装の現挙動・POM見出し・Form制約値（min/max/required/NotBlank）・Cookie名をオラクル（期待値）に流用しない。本機能は新規実装でありリバース元（pf-eccube3）に相当機能は無く、業務要件は基本設計、URL/ロジックは ec-cube-enterprise 実装を確認値とする。仕様と実装の食い違いは付帯表4（不具合候補）に分離する。TSV は既存IT casesと同一の10列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-15 | 未認証ガード（保護URLの管理ログイン誘導）。CSRF・対象データ・状態変化はフォーム/DB/Session内部で観測困難 |
| IT-20 | ログ出力抑止＝ブラウザ観測外（対象外） |
| IT-25 | 分割/結合 新規登録画面のUI部品（入力欄・必須バッジ・保存ボタン）・確認ダイアログ表示 |
| IT-03 | 画面遷移（登録成功時の編集画面遷移・種別取り違えリダイレクト・欠品入力遷移） |
| IT-13 | URL直接アクセス（未ログイン誘導） |
| IT-22 | 数量バリデーション（分割数1以上/在庫超過・結合点数1以上）・申請時の必須（分割先/結合元1件以上）・店舗編集権限 |
| IT-26 | 登録/更新成功フラッシュ（在庫分割を登録しました／在庫結合を開始しました／承認申請しました 等）。DB値・在庫増減は間接/手動 |
| IT-23 | 本機能はDB検索を行わない（一覧検索は別機能。DB相関/更新値は間接） |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-001	IT-25	UI部品	P2	分割新規画面に分割元商品・分割数入力欄・保存ボタンが表示される	ログイン済／SEED-M04-13-SPLIT-SRC	—	"1. 分割新規登録画面（/%admin%/product/stock/{productStockId}/split/new）を開く"	「分割元商品」見出し・分割数入力欄・保存ボタンが表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-002	IT-25	表示結果	P3	分割数入力欄に必須バッジ「必須」が表示される	ログイン済／SEED-M04-13-SPLIT-SRC	—	"1. 分割新規登録画面を開く"	分割数の列見出しに必須バッジ「必須」が表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-010	IT-26	登録内容	P1	分割登録成功で編集画面へ遷移し登録完了メッセージが表示される	ログイン済／SEED-M04-13-SPLIT-SRC（分割元在庫数>0・編集権限あり）	分割数＝1（在庫数以下）	"1. 分割新規登録画面を開く
2. 分割数を入力
3. 保存ボタンを押下"	分割編集画面（/product/stock/split/{id}/edit）へ遷移し「在庫分割を登録しました。」が表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-011	IT-22	数値バリデーション	P1	分割数が在庫数を超えると在庫超過メッセージが表示され滞留する	ログイン済／SEED-M04-13-SPLIT-SRC	分割数＝在庫数+1	"1. 分割新規登録画面を開く
2. 在庫数より大きい分割数を入力
3. 保存ボタンを押下"	「分割数が在庫数を超えています。」が表示され、登録されず分割新規登録画面に留まること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-012	IT-22	必須バリデーション	P2	分割数が1未満だと最小値エラーが表示され滞留する	ログイン済／SEED-M04-13-SPLIT-SRC	分割数＝0	"1. 分割新規登録画面を開く
2. 分割数に0を入力
3. 保存ボタンを押下"	「分割数は1以上を入力してください。」が表示され、登録されず分割新規登録画面に留まること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-013	IT-22	DBとの相関バリデーション	P2	編集権限のない店舗の在庫を分割登録すると権限エラーが表示される	ログイン済／SEED-M04-13-NOPERM（ログイン者が編集権限を持たない店舗の在庫）	分割数＝1	"1. 権限のない店舗在庫の分割新規登録画面を開く
2. 分割数を入力し保存ボタンを押下"	「この店舗の在庫を編集する権限がありません。」が表示され、登録されないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-020	IT-25	送信可否制御	P2	結合新規画面に結合先商品・結合数入力欄・保存ボタンが表示される	ログイン済／SEED-M04-13-JOIN-DEST	—	"1. 結合新規登録画面（/%admin%/product/stock/{productStockId}/join/new）を開く"	「結合先商品」見出し・結合数入力欄・保存ボタンが表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-021	IT-25	表示結果	P3	結合数入力欄に必須バッジ「必須」が表示される	ログイン済／SEED-M04-13-JOIN-DEST	—	"1. 結合新規登録画面を開く"	結合数の列見出しに必須バッジ「必須」が表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-030	IT-26	登録内容	P1	結合登録成功で編集画面へ遷移し開始メッセージが表示される	ログイン済／SEED-M04-13-JOIN-DEST（編集権限あり）	結合点数＝1	"1. 結合新規登録画面を開く
2. 結合点数を入力
3. 保存ボタンを押下"	結合編集画面（/product/stock/join/{id}/edit）へ遷移し「在庫結合を開始しました。」が表示されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-031	IT-22	数値バリデーション	P2	結合点数が1未満だと最小値エラーが表示され滞留する	ログイン済／SEED-M04-13-JOIN-DEST	結合点数＝0	"1. 結合新規登録画面を開く
2. 結合点数に0を入力
3. 保存ボタンを押下"	「結合先在庫数に1以上を入力してください。」が表示され、登録されず結合新規登録画面に留まること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-032	IT-22	DBとの相関バリデーション	P2	編集権限のない店舗の在庫を結合登録すると権限エラーが表示される	ログイン済／SEED-M04-13-NOPERM	結合点数＝1	"1. 権限のない店舗在庫の結合新規登録画面を開く
2. 結合点数を入力し保存ボタンを押下"	「この店舗の在庫を編集する権限がありません。」が表示され、登録されないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-040	IT-13	URL直接アクセス	P2	未ログインで分割新規URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. /%admin%/product/stock/{productStockId}/split/new へ直接アクセス"	管理ログイン画面へ誘導されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-041	IT-13	URL直接アクセス	P2	未ログインで結合新規URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. /%admin%/product/stock/{productStockId}/join/new へ直接アクセス"	管理ログイン画面へ誘導されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-042	IT-15	未認証	P2	未ログインで分割編集・承認URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. /%admin%/product/stock/split/{id}/edit または /product/stock/split/{id}/approval へ直接アクセス"	管理ログイン画面へ誘導されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-050	IT-03	画面遷移	P2	分割IDで結合編集URLにアクセスすると分割編集画面へリダイレクトされる	ログイン済／SEED-M04-13-SPLIT-NEW（種別=分割のレコード）	—	"1. 種別=分割のIDで結合編集URL（/product/stock/join/{id}/edit）へアクセス"	分割編集画面（/product/stock/split/{id}/edit）へリダイレクトされること（種別取り違え救済）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-051	IT-03	画面遷移	P2	承認待ちの分割編集POSTは保存せず承認画面へリダイレクトされる	ログイン済／SEED-M04-13-SPLIT-WAITING（分割承認待ち）	編集フォーム送信	"1. 分割承認待ちレコードの編集画面を開く
2. 編集フォームをPOST送信"	編集内容を保存せず分割承認画面（/product/stock/split/{id}/approval）へリダイレクトされること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-060	IT-26	登録内容	P1	分割承認申請で分割先未登録だと未登録エラーが表示される	ログイン済／SEED-M04-13-SPLIT-NEW（分割先0件のNEW）	—	"1. 分割先未登録の分割編集画面を開く
2. 承認申請を実行"	「分割先を1件以上追加してください。」が表示され、承認待ちへ遷移しないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-065	IT-26	その他のバリデーション	P2	分割承認申請で分割先合計が0だと合計0エラーが表示される	ログイン済／SEED-M04-13-SPLIT-NEW（分割先1件以上・数量合計0）	—	"1. 分割先を追加し全数量を0にした分割編集画面を開く
2. 承認申請を実行"	「分割先の分割数合計が0です。1以上になるよう入力してください。」が表示され、承認待ちへ遷移しないこと（destination_total_zero）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-061	IT-26	更新内容	P1	分割承認申請成功で承認申請メッセージが表示される	ログイン済／SEED-M04-13-SPLIT-NEW＋分割先1件以上	承認通知先メンバー選択	"1. 分割先を登録した分割編集画面を開く
2. 承認申請を実行"	「承認申請しました。」が表示され、ステータスが分割承認待ちへ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-062	IT-26	更新内容	P1	分割承認(approve)で承認完了メッセージが表示される	ログイン済／SEED-M04-13-SPLIT-WAITING	承認モード＝approve	"1. 分割承認画面を開く
2. 承認ボタンを押下"	「分割の承認が完了しました。」が表示され、ステータスが入庫済みへ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-063	IT-22	必須バリデーション	P2	分割却下で却下理由が未入力だと必須エラーが表示される	ログイン済／SEED-M04-13-SPLIT-WAITING	却下理由＝空／承認モード＝reject	"1. 分割承認画面を開く
2. 却下理由を空のまま却下ボタンを押下"	「却下する場合は却下理由を入力してください。」が表示され、却下されないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-064	IT-26	更新内容	P2	分割却下成功で却下メッセージが表示される	ログイン済／SEED-M04-13-SPLIT-WAITING	却下理由＝任意の文字列／承認モード＝reject	"1. 分割承認画面を開く
2. 却下理由を入力し却下ボタンを押下"	「却下しました。」が表示され、ステータスが却下へ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-070	IT-03	画面遷移	P2	欠品入力遷移で結合元未登録だと必須エラーが表示される	ログイン済／SEED-M04-13-JOIN-NEW（結合元0件のNEW）	—	"1. 結合元未登録の結合編集画面を開く
2. 欠品入力へ遷移を実行"	「承認申請には結合元を1件以上登録してください。」が表示され、欠品入力画面へ遷移しないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-071	IT-26	更新内容	P1	欠品入力遷移成功で移動メッセージが表示される	ログイン済／SEED-M04-13-JOIN-NEW＋結合元1件以上	—	"1. 結合元を登録した結合編集画面を開く
2. 欠品入力へ遷移を実行"	「欠品入力画面に移動しました。」が表示され、ステータスが結合元登録へ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-072	IT-26	更新内容	P1	結合承認申請成功で承認申請メッセージが表示される	ログイン済／SEED-M04-13-JOIN-SRC-REGISTERED（結合元登録）	承認通知先メンバー選択	"1. 欠品入力画面を開く
2. 承認申請を実行"	「承認申請しました。」が表示され、ステータスが結合承認待ちへ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-073	IT-26	更新内容	P1	結合承認(approve)で承認完了メッセージが表示される	ログイン済／SEED-M04-13-JOIN-WAITING（結合承認待ち）	承認モード＝approve／仕入価格	"1. 結合承認画面を開く
2. 承認ボタンを押下"	「承認しました。」が表示され、ステータスが入庫済みへ変わること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-074	IT-26	その他のバリデーション	P2	結合承認申請で有効結合数の合計が0だと数量0エラーが表示される	ログイン済／SEED-M04-13-JOIN-SRC-REGISTERED（結合元登録・欠品＝結合数で実質0）	—	"1. 欠品入力画面を開く
2. 各結合元の欠品点数を結合数と同値にして承認申請を実行"	「実際に結合する数量（結合数−欠品）の合計が0のため承認申請できません。」が表示され、結合承認待ちへ遷移しないこと（apply_approval_zero_quantity）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-075	IT-26	更新内容	P2	結合却下成功で却下メッセージが表示される	ログイン済／SEED-M04-13-JOIN-WAITING（結合承認待ち）	却下理由＝任意の文字列／承認モード＝reject	"1. 結合承認画面を開く
2. 却下理由を入力し却下ボタンを押下"	「却下しました。」が表示され、ステータスが却下へ変わること（join approval_reject_complete）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-033	IT-22	必須バリデーション	P2	結合却下で却下理由が未入力だと必須エラーが表示される	ログイン済／SEED-M04-13-JOIN-WAITING（結合承認待ち）	却下理由＝空／承認モード＝reject	"1. 結合承認画面を開く
2. 却下理由を空のまま却下ボタンを押下"	「却下する場合は却下理由を入力してください。」が表示され、却下されないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-043	IT-15	未認証	P2	未ログインで結合編集・承認・欠品入力URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. /%admin%/product/stock/join/{id}/edit ・ /join/{id}/approval ・ /join/{id}/shortage-entry へ直接アクセス"	いずれも管理ログイン画面へ誘導されること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-052	IT-03	画面遷移	P2	承認待ちの結合編集POSTは保存せず結合承認画面へリダイレクトされる	ログイン済／SEED-M04-13-JOIN-WAITING（結合承認待ち）	編集フォーム送信	"1. 結合承認待ちレコードの編集画面を開く
2. 編集フォームをPOST送信"	編集内容を保存せず結合承認画面（/product/stock/join/{id}/approval）へリダイレクトされること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-053	IT-03	画面遷移	P2	結合IDで分割編集URLにアクセスすると結合編集画面へリダイレクトされる	ログイン済／SEED-M04-13-JOIN-NEW（種別=結合のレコード）	—	"1. 種別=結合のIDで分割編集URL（/product/stock/split/{id}/edit）へアクセス"	結合編集画面（/product/stock/join/{id}/edit）へリダイレクトされること（種別取り違え救済・逆方向）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-066	IT-26	更新内容	P2	分割承認申請で承認通知先が未選択だと必須エラーが表示される	ログイン済／SEED-M04-13-SPLIT-NEW＋分割先1件以上	承認通知先＝未選択	"1. 分割先を登録した分割編集画面を開く
2. 承認通知先を選択せず承認申請を実行"	「承認通知先のメンバーを1人以上選択してください。」が表示され、承認待ちへ遷移しないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-067	IT-26	更新内容	P2	結合承認申請で承認通知先が未選択だと必須エラーが表示される	ログイン済／SEED-M04-13-JOIN-SRC-REGISTERED（結合元登録）	承認通知先＝未選択	"1. 欠品入力画面を開く
2. 承認通知先を選択せず承認申請を実行"	「承認通知先のメンバーを1人以上選択してください。」が表示され、結合承認待ちへ遷移しないこと。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-076	IT-26	更新内容	P2	結合編集でメモを保存すると保存完了メッセージが表示される	ログイン済／SEED-M04-13-JOIN-NEW（種別=結合・NEW）	結合メモ＝任意の文字列	"1. 結合編集画面を開く
2. メモを入力し保存ボタンを押下"	「保存しました」が表示され、結合編集画面に留まること（メモのみDB保存）。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-077	IT-26	更新内容	P2	欠品入力画面で欠品点数を保存すると保存完了メッセージが表示される	ログイン済／SEED-M04-13-JOIN-SRC-REGISTERED（結合元登録）	欠品点数＝結合数未満の値	"1. 欠品入力画面を開く
2. 欠品点数を入力し保存ボタンを押下"	「欠品登録を保存しました。」が表示され、欠品入力画面に留まること。
m04-13_admin_stock_stock_split_join_register_edit（在庫分割結合登録/編集）	E2E-M04-13-078	IT-26	その他のバリデーション	P2	結合承認で有効結合数が0だと数量0エラーが表示され承認されない	ログイン済／SEED-M04-13-JOIN-WAITING（結合承認待ち・有効結合数0）	承認モード＝approve	"1. 結合承認画面を開く
2. 承認ボタンを押下"	「結合先入庫数量が0のため最終承認できません。」が表示され、入庫済みへ遷移しないこと（approval_no_inbound_quantity）。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは Twig 由来の位置情報のみ。Symfony Form の getBlockPrefix は分割新規=`admin_stock_split_new`（StockSplitNewType.php:53-55）、結合新規=`admin_stock_join_new`（StockJoinNewType.php:52-55）、編集/承認共通=`admin_stock_split_join`（StockSplitJoinType.php:127-130）。ただし分割数 `split_quantity`・結合点数 `destination_stock`・承認モード `approval_mode`・却下メモ `rejected_memo` は Form 外の素の `<input>/<textarea>`（name 属性）で送信される。Form/Type の必須・最大長制約は期待結果に流用せず、必須/数量条件の正は設計書「フォーム項目・バリデーション」「分岐・遷移・例外」。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID |
|----------|---------|----------------------------------------------|----------|--------------|
| E2E-M04-13-001 | E2E自動化(要シード) | 「分割元商品」span trans `admin.stock.split.source_product`(stock_split_new.twig:92 / messages.ja.yaml:4704) / 分割数 input[name=split_quantity] #split-source-stock-input(stock_split_new.twig:122) / 保存 button[form="form-split-register"] trans `admin.common.save`(stock_split_new.twig:168 / :1434) | 利用者視点の入口(分割新規GET)・フロント挙動(表示要素) | 004,080相当 |
| E2E-M04-13-002 | E2E自動化(要シード) | 必須バッジ badge `admin.common.required`=「必須」(stock_split_new.twig:107 / messages.ja.yaml:1528) | フォーム項目(分割数 必須) | 024,065相当 |
| E2E-M04-13-010 | E2E自動化(要シード・破壊的→fixme) | 成功フラッシュ .alert-success(alert.twig:22) trans `admin.stock.split.register_complete`=「在庫分割を登録しました。」(messages.ja.yaml:4698) / 編集URL `/product/stock/split/{id}/edit` | 在庫増減ロジック#1分割登録(成功時編集画面・register_complete) | 005,081相当 |
| E2E-M04-13-011 | E2E自動化(要シード) | .alert-danger(alert.twig:32) trans `admin.stock.split.quantity_exceeds_stock`(messages.ja.yaml:4697) | 分岐・例外(分割数>在庫=quantity_exceeds_stock・在庫操作なし) | 032,036相当 |
| E2E-M04-13-012 | E2E自動化(要シード・クライアント検証回避要) | .alert-danger trans `admin.stock.split.quantity_min`(messages.ja.yaml:4695) | 分岐・例外(分割数<1=quantity_min) | 024,033相当 |
| E2E-M04-13-013 | E2E自動化(要NOPERMシード) | .alert-danger trans `admin.stock.split.not_editable_store`(messages.ja.yaml:4748) | 分岐・例外(店舗編集権限なし) | 048,055相当 |
| E2E-M04-13-020 | E2E自動化(要シード) | 「結合先商品」span trans `admin.stock.join.destination_product`(stock_join_new.twig:88 / messages.ja.yaml:4749) / 結合数 input[name=destination_stock](stock_join_new.twig:128) / 保存 button[form="form-join-register"](stock_join_new.twig:174) | 利用者視点の入口(結合新規GET)・送信可否(保存ボタン) | 013,089相当 |
| E2E-M04-13-021 | E2E自動化(要シード) | 必須バッジ `admin.common.required`(stock_join_new.twig:104) | フォーム項目(結合点数 必須) | 051相当 |
| E2E-M04-13-030 | E2E自動化(要シード) | .alert-success trans `admin.stock.join.register_complete`=「在庫結合を開始しました。」(messages.ja.yaml:4789) / 編集URL `/product/stock/join/{id}/edit` | 在庫増減ロジック#4結合登録(成功時編集画面・register_complete・在庫操作なし) | 014,090相当 |
| E2E-M04-13-031 | E2E自動化(要シード・クライアント検証回避要) | .alert-danger trans `admin.stock.join.destination_stock_min`(messages.ja.yaml:4753) | 分岐・例外(結合点数≤0=destination_stock_min) | 052,054相当 |
| E2E-M04-13-032 | E2E自動化(要NOPERMシード) | .alert-danger trans `admin.stock.join.not_editable_store`(messages.ja.yaml:4872) | 分岐・例外(店舗編集権限なし) | 056相当 |
| E2E-M04-13-040/041 | E2E自動化(資格情報不要) | 管理ログイン #login_id(login.twig:26) | 利用者視点の入口(管理ログイン要)・権限/認可 | 002,021相当 |
| E2E-M04-13-042 | E2E自動化(資格情報不要) | 管理ログイン #login_id | 利用者視点の入口(全エンドポイント管理ログイン要) | 002相当 |
| E2E-M04-13-050 | E2E自動化(要シード→fixme) | リダイレクト先URL(/product/stock/split/{id}/edit) | 分岐・遷移(種別取り違え→対応編集画面へリダイレクト) | 015相当 |
| E2E-M04-13-051 | 手動/間接(要承認待ちシード) | リダイレクト先URL(/product/stock/split/{id}/approval) | 分岐・遷移(承認待ち編集POSTは承認画面へリダイレクト) | 066相当 |
| E2E-M04-13-060 | E2E自動化(deep要シード→fixme) | .alert-danger trans `admin.stock.split.destination_required`(messages.ja.yaml:4699) | 在庫増減ロジック#2(コミット規則・分割先1件以上) | 042,065相当 |
| E2E-M04-13-065 | 手動/間接(deep要シード・数量合計0) | .alert-danger trans `admin.stock.split.destination_total_zero`(messages.ja.yaml:4700) | 在庫増減ロジック#2(コミット規則・分割先合計1以上=destination_total_zero) | 065相当 |
| E2E-M04-13-061 | 手動/間接(deep破壊的・通知メール) | .alert-success trans `admin.stock.split.apply_approval_success`(messages.ja.yaml:4716) | 在庫増減ロジック#2(承認申請成功・承認リスト作成・通知メール) | 010,086相当 |
| E2E-M04-13-062 | 手動/間接(deep破壊的・在庫加算) | .alert-success trans `admin.stock.split.approval_approve_complete`(messages.ja.yaml:4693) | 在庫増減ロジック#3(承認=分割先加算) | 062相当 |
| E2E-M04-13-063 | 手動/間接(要承認待ちシード) | .alert-danger trans `admin.stock.move.rejection_reason_required`(messages.ja.yaml:4398) / textarea[name=rejected_memo](stock_split_approval.twig:184) / button[data-approval-mode=reject](stock_split_approval.twig:282) | 承認・却下(却下メモ必須) | 063相当 |
| E2E-M04-13-064 | 手動/間接(deep破壊的・在庫戻し) | .alert-success trans `admin.stock.move.reject_complete`(messages.ja.yaml:4399) / button[data-approval-mode=reject](stock_split_approval.twig:282) | 承認・却下(却下=分割元戻し) | 064相当 |
| E2E-M04-13-070 | E2E自動化(deep要シード→fixme) | .alert-danger trans `admin.stock.join.require_at_least_one_source`(messages.ja.yaml:4821) | 在庫増減ロジック#5(結合元1件以上) | 019,057相当 |
| E2E-M04-13-071 | 手動/間接(deep破壊的・在庫減算) | .alert-success trans `admin.stock.join.moved_to_shortage_entry`(messages.ja.yaml:4770) | 在庫増減ロジック#5(欠品入力遷移成功) | 071相当 |
| E2E-M04-13-072 | 手動/間接(deep破壊的・通知メール) | .alert-success trans `admin.stock.join.apply_approval_success`(messages.ja.yaml:4828) | 在庫増減ロジック#6(結合承認申請成功) | 072相当 |
| E2E-M04-13-073 | 手動/間接(deep破壊的・結合先加算) | .alert-success trans `admin.stock.join.approval_approve_complete`(messages.ja.yaml:4842) / button[data-approval-mode=approve](stock_join_approval.twig:311) | 在庫増減ロジック#7(結合承認=結合先加算) | 073相当 |
| E2E-M04-13-074 | 手動/間接(deep要シード・欠品=結合数) | .alert-danger trans `admin.stock.join.apply_approval_zero_quantity`(messages.ja.yaml:4830) | 在庫増減ロジック#6(承認申請・有効結合数1以上=apply_approval_zero_quantity) | 072相当 |
| E2E-M04-13-075 | 手動/間接(deep破壊的・在庫戻し) | .alert-success trans `admin.stock.join.approval_reject_complete`(messages.ja.yaml:4841) / button[data-approval-mode=reject](stock_join_approval.twig:310) / textarea[name=rejected_memo](stock_join_approval.twig:216) | 承認・却下(結合却下=却下メモ保存・在庫戻し) | 073相当 |
| E2E-M04-13-033 | 手動/間接(要結合承認待ちシード) | .alert-danger trans `admin.stock.move.rejection_reason_required`=「却下する場合は却下理由を入力してください。」(messages.ja.yaml:4398) / textarea[name=rejected_memo](stock_join_approval.twig:216) / button[data-approval-mode=reject](stock_join_approval.twig:310) | 承認・却下(結合却下メモ必須) | 075相当 |
| E2E-M04-13-043 | E2E自動化(資格情報不要) | 管理ログイン #login_id(login.twig:26) | 利用者視点の入口(結合編集/承認/欠品入力 全エンドポイント管理ログイン要) | 002,021相当 |
| E2E-M04-13-052 | 手動/間接(要結合承認待ちシード) | リダイレクト先URL(/product/stock/join/{id}/approval) | 分岐・遷移(承認待ち結合編集POSTは承認画面へリダイレクト) | 066相当 |
| E2E-M04-13-053 | E2E自動化(要シード→fixme) | リダイレクト先URL(/product/stock/join/{id}/edit) | 分岐・遷移(種別取り違え→対応編集画面へリダイレクト・逆方向) | 015相当 |
| E2E-M04-13-066 | 手動/間接(deep要シード・通知先未選択) | .alert-danger trans `admin.stock.move.approval_notification_target_required`=「承認通知先のメンバーを1人以上選択してください。」(messages.ja.yaml:4295) | フォーム項目(承認通知先 申請時必須・分割) | 010,086相当 |
| E2E-M04-13-067 | 手動/間接(deep要シード・通知先未選択) | .alert-danger trans `admin.stock.split_join.form.approval_notification_required`=「承認通知先のメンバーを1人以上選択してください。」(messages.ja.yaml:4645) | フォーム項目(承認通知先 申請時必須・結合) | 072相当 |
| E2E-M04-13-076 | 手動/間接(要結合NEWシード・メモ保存はDB値) | .alert-success trans `admin.common.save_complete`=「保存しました」(messages.ja.yaml:1398) / 結合メモ textarea[name=split_join_memo] | 結合 編集画面／保存(メモのみDB保存・数量はSession) | 015,082相当 |
| E2E-M04-13-077 | 手動/間接(deep要結合元登録シード) | .alert-success trans `admin.stock.join.shortage_save_complete`=「欠品登録を保存しました。」(messages.ja.yaml:4798) | 欠品入力画面／保存(結合元登録ステータス専用) | 020相当 |
| E2E-M04-13-078 | 手動/間接(deep要シード・欠品=結合数で有効0) | .alert-danger trans `admin.stock.join.approval_no_inbound_quantity`=「結合先入庫数量が0のため最終承認できません。」(messages.ja.yaml:4831) / button[data-approval-mode=approve](stock_join_approval.twig:311) | 在庫増減ロジック#7(結合承認・結合数0以下=approval_no_inbound_quantity) | 073相当 |

注: 既存IT cases は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり、機能固有のシナリオを持たない。本E2Eは設計書本文（利用者視点の入口・在庫増減ロジック・分岐/遷移/例外・状態/データ更新）を一次情報源として網羅した。`元ITケースID` は観点の対応付け（接頭辞 `IT-M04-13-ADMIN-STOCK-STOCK-SPLIT-JOIN-REGISTER-EDIT-NNN`）。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_13_..._it_cases.md` の関連ID件数（IT-22=35／IT-26=29／IT-25=9／IT-03=7／IT-15=4／IT-23=3／IT-20=2／IT-13=1＝計90）。各観点行を「本機能においてブラウザで観測可能か」で E2E自動化／手動・間接／対象外 に分類する。内訳は付帯表2bが正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-15 | 4 | 1 | 3 | 0 | 未認証ガードは観測可。CSRF・対象データ・状態変化はフォーム/DB/Session内部で観測困難＝手動/間接 |
| IT-20 | 2 | 0 | 0 | 2 | 秘密値・識別子のログ出力抑止＝ブラウザ観測外 |
| IT-25 | 9 | 2 | 6 | 1 | 新規画面UI・確認ダイアログは観測可。Ajax(数量/区分更新)・CSV取込・廃止I/F は内部/手動 |
| IT-03 | 7 | 3 | 4 | 0 | 登録成功遷移・取り違えリダイレクト・欠品遷移は観測可。Ajax系遷移は手動/間接 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセスの未ログイン誘導は観測可 |
| IT-22 | 35 | 8 | 2 | 25 | 分割数/結合点数/申請必須/権限は観測可。文字列長/文字種/汎用相関/部分入力は本機能の数量入力に非該当 |
| IT-26 | 29 | 5 | 23 | 1 | 登録/更新フラッシュは観測可。明細・在庫・履歴・承認リストのDB値は間接/手動。廃止I/Fは対象外 |
| IT-23 | 3 | 0 | 3 | 0 | 本機能はDB検索なし。CSRF・DB更新値の確認は間接/手動 |
| 合計 | 90 | 20 | 41 | 29 | **未分類 0** |

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 手動 | CSRFトークンはSymfony Form内部で完結しUIから不正化困難（不具合候補#1で要確認） |
| 002 | IT-15 | 未認証 | E2E自動化 | 040/041/042（未ログイン→管理ログイン誘導） |
| 003 | IT-15 | 対象データ | 手動/間接 | 対象 DtbStockSplitJoin はDB内部値で直接観測不能 |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | 手動/間接 | ステータス遷移はDB/Session内部・承認フローで間接確認 |
| 007 | IT-25 | UI部品（分割先数量Ajax） | 手動/間接 | Ajax数量更新はSession内部更新で安定観測が困難 |
| 008 | IT-25 | UI部品（在庫区分Ajax） | 手動/間接 | 在庫区分DB更新Ajaxは内部値・要シード |
| 009 | IT-25 | 操作起点（分割先削除） | 手動/間接 | 削除はSession操作・確認モーダル経由で間接 |
| 010 | IT-25 | 確認ダイアログ（分割承認申請） | E2E自動化 | 060/065（申請ボタン押下→確認後の申請実行経路を観測。deep要シードのため fixme）。確認ダイアログのOK/キャンセル分岐自体（JS confirm）は手動 |
| 011 | IT-25 | 確認ダイアログ（登録メモ保存） | 手動/間接 | メモ保存は全ステータス共通・DB値確認は間接 |
| 012 | IT-25 | 確認ダイアログ（分割先数量旧/停止） | 対象外 | 廃止I/F（常に400）・UI無し |
| 013 | IT-25 | 送信可否制御（結合新規画面） | E2E自動化 | 020（保存ボタン表示）＋030（押下で実送信→編集画面遷移）／031（不正値の送信抑止＝サーバ側エラー）。新規画面の保存ボタンは活性/非活性制御を持たずサーバ側で可否判定 |
| 014 | IT-03 | 外部画面（結合登録処理） | E2E自動化 | 030（結合登録成功→編集画面遷移） |
| 015 | IT-03 | 画面遷移（結合編集画面/保存） | E2E自動化 | 076（結合編集メモ保存→save_complete・要シード）を主対応。関連で 050/053（種別取り違え→対応編集画面リダイレクト・両方向） |
| 016 | IT-03 | 画面遷移（結合元数量Ajax） | 手動/間接 | Ajax更新はSession内部 |
| 017 | IT-03 | 画面遷移（結合元在庫区分Ajax） | 手動/間接 | NEWはSession付替・他はDB更新で間接 |
| 018 | IT-03 | 画面遷移（結合元削除） | 手動/間接 | Session削除・確認モーダル経由 |
| 019 | IT-03 | 画面遷移（欠品入力遷移） | E2E自動化 | 070（結合元未登録→必須エラー）で遷移操作を代表 |
| 020 | IT-03 | 画面遷移（欠品入力画面/保存） | 手動/間接 | 077（欠品点数保存→shortage_save_complete）。結合元登録ステータス専用・要deepシード |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 040/041/042（未ログイン誘導） |
| 022 | IT-25 | HTTPステータス（結合元CSV取込新規Ajax） | 手動/間接 | Ajax JSON応答・取込内容は手動 |
| 023 | IT-25 | URL（欠品CSV出力） | 手動/間接 | ファイルDL発火は観測可だがCSV内容は手動 |
| 024 | IT-22 | 必須バリデーション | E2E自動化 | 012（分割数必須/最小値） |
| 025 | IT-22 | 必須バリデーション | E2E自動化 | 031（結合点数必須/最小値） |
| 026-031 | IT-22 | 文字列長バリデーション | 対象外(6) | 数量入力（split_quantity/destination_stock）に固定長/最大長制約なし・メモは任意でmax無し |
| 032 | IT-22 | 数値バリデーション | E2E自動化 | 011（分割数>在庫） |
| 033 | IT-22 | 数値バリデーション | E2E自動化 | 031（結合点数≤0） |
| 034-039 | IT-22 | 数値バリデーション | 対象外(6) | 在庫/原価等の数値はDB内部・該当する直接入力数値項目なし |
| 040,041 | IT-22 | 文字種バリデーション | 対象外(2) | 数量は整数入力のみで文字種観点は非該当 |
| 042 | IT-22 | その他のバリデーション | E2E自動化 | 060（分割先1件以上=destination_required） |
| 043 | IT-22 | その他のバリデーション | E2E自動化 | 070（結合元1件以上=require_at_least_one_source） |
| 044-047 | IT-22 | その他のバリデーション | 対象外(4) | 該当する直接入力項目なし（Session/DB内部条件） |
| 048 | IT-22 | その他のバリデーション | E2E自動化 | 013（店舗編集権限なし） |
| 049,050 | IT-22 | その他のバリデーション | 対象外(2) | メモ保存・廃止I/F に該当バリデーションなし |
| 051-054 | IT-22 | 相関バリデーション | 対象外(4) | 汎用相関は非該当。本機能の相関は数量×在庫（011/031で代表） |
| 055 | IT-22 | DBとの相関バリデーション | 手動/間接 | 在庫数との相関はDB値（権限は013でカバー） |
| 056 | IT-22 | DBとの相関バリデーション | 手動/間接 | 同上（結合側） |
| 057 | IT-22 | 必須制御 | E2E自動化 | 070（欠品入力遷移時の結合元必須） |
| 058 | IT-22 | 部分入力 | 対象外 | 数量の単一入力に部分入力観点は非該当 |
| 059 | IT-26 | 登録内容（明細追加） | 手動/間接 | dtb_stock_split_join_detail のレコード追加はDB値 |
| 060 | IT-26 | 登録内容（CSV取込新規） | 手動/間接 | Ajax JSON応答・DB保存なし |
| 061 | IT-26 | 登録内容（欠品CSV出力） | 手動/間接 | ファイル出力・内容は手動 |
| 062 | IT-26 | 登録内容（欠品CSV取込） | 手動/間接 | Ajax取込・Session値 |
| 063 | IT-26 | 登録内容（ステータス不整合） | 手動/間接 | 承認ステータス不整合はdeepシード・間接 |
| 064 | IT-23 | 登録内容（CSRF） | 手動/間接 | CSRF不正の登録抑止はUI誘発困難 |
| 065 | IT-26 | 登録内容（分割先未登録/合計0） | E2E自動化 | 060（destination_required・未登録）＋065（destination_total_zero・合計0は手動/間接deep） |
| 066 | IT-26 | 登録内容（承認待ち→リダイレクト） | 手動/間接 | 051（分割・要承認待ちシード・編集POST）＋052（結合・要承認待ちシード・編集POST） |
| 067 | IT-26 | 登録内容（CSV取込CSRF/不正/ステータス） | 手動/間接 | Ajax JSON応答 |
| 068-075 | IT-26 | 登録内容（各テーブル/区分） | 手動/間接(8) | dtb_stock_split_join/detail/status_history/product_stock/approval_list 等のDB値は間接 |
| 076 | IT-26 | 実行結果（在庫・原価更新） | 手動/間接 | 在庫/総原価の更新値はDB内部 |
| 077 | IT-23 | 実行結果 | 手動/間接 | DB更新結果の直接照合は間接 |
| 078,079 | IT-26 | 更新内容 | 手動/間接(2) | 更新値の有無はDB内部 |
| 080 | IT-26 | 更新内容（分割新規画面） | E2E自動化 | 001（分割新規画面表示で代表） |
| 081 | IT-26 | 更新内容（分割登録処理） | E2E自動化 | 010（在庫分割を登録しました） |
| 082 | IT-26 | 更新内容（分割編集） | 手動/間接 | 分割先/数量/メモの編集値はSession/DB |
| 083 | IT-23 | 更新内容（分割先数量Ajax） | 手動/間接 | Ajax Session更新 |
| 084 | IT-26 | 更新内容（在庫区分Ajax） | 手動/間接 | DB更新Ajax |
| 085 | IT-26 | 更新内容（分割先削除） | 手動/間接 | Session削除 |
| 086 | IT-26 | 更新内容（分割承認申請） | 手動/間接 | 061（成功・破壊的・通知メール）＋066（通知先未選択エラー）。結合側は 072（成功）＋067（通知先未選択）＋078（有効結合数0エラー）が対応 |
| 087 | IT-26 | 更新内容（登録メモ保存） | 手動/間接 | メモ保存値はDB |
| 088 | IT-26 | 更新内容（分割先数量旧/停止） | 対象外 | 廃止I/F |
| 089 | IT-26 | 更新内容（結合新規画面） | E2E自動化 | 020（結合新規画面表示で代表） |
| 090 | IT-26 | 更新内容（結合登録処理） | E2E自動化 | 030（在庫結合を開始しました） |

集計（付帯表2と一致）: 自動化 20（002,010,013,014,015,019,021,024,025,032,033,042,043,048,057,065,080,081,089,090 ＝ 各IT-IDで IT-15:1／IT-25:2／IT-03:3／IT-13:1／IT-22:8／IT-26:5）。手動/間接 41。対象外 29（004,005,012,026-031=6,034-039=6,040,041,044-047=4,049,050,051-054=4,058,088）。**未分類 0**（20+41+29=90）。

注（本監査での追記対応）: 新規追記したE2Eケース（033/043/052/053/066/067/076/077/078）は、母集合90観点行のうち既に分類済みの行（IT行015 結合編集保存／IT行020 欠品保存／IT行066 承認待ちリダイレクト／IT-26承認申請・承認系／IT-15未認証）に対する**正常×異常の対・逆方向・別画面**の補完であり、母集合件数・区分集計（20/41/29）は変えない。IT行015（結合編集画面／保存）の対応E2Eは、種別取り違えリダイレクト 050 に加え、実体である結合編集保存 076 を主対応とする（誤対応是正）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-13-ADMIN | dtb_member（管理者） | ログイン用管理者1。`config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用 | fixture(config既定) | 既存利用・撤去不要 | 全認証要ケース |
| SEED-M04-13-SPLIT-SRC | dtb_product_stock / 分割元 | ログイン管理者が編集権限を持つ店舗の在庫1。**在庫数>0**（分割数1の正常系・超過/最小値検証に使用）。productStockId を環境変数で供給 | fixture/migration | 専用ID・参照系。破壊的ケース(010)は使い捨てまたは再投入 | 001,002,010,011,012 |
| SEED-M04-13-JOIN-DEST | dtb_product_stock / 結合先 | ログイン管理者が編集権限を持つ店舗の在庫1（結合先）。結合登録は在庫操作なし | fixture/migration | 専用ID。030は dtb_stock_split_join レコードを作成するため撤去対象 | 020,021,030,031 |
| SEED-M04-13-NOPERM | dtb_product_stock / 権限外 | ログイン管理者が**編集権限を持たない**店舗の在庫1 | fixture/migration | 専用ID・参照系 | 013,032 |
| SEED-M04-13-SPLIT-NEW | dtb_stock_split_join（種別=分割・NEW） | 種別=分割・ステータス=新規登録のレコード1（分割先0件）。承認権限メンバーが当該店舗に1名以上 | fixture/migration | 使い捨て（承認申請で状態遷移） | 050,060,061,066 |
| SEED-M04-13-SPLIT-WAITING | dtb_stock_split_join（分割承認待ち） | 種別=分割・ステータス=分割承認待ちのレコード1（分割先1件以上） | fixture/migration | 使い捨て（承認/却下で状態遷移・在庫変動） | 051,062,063,064 |
| SEED-M04-13-JOIN-NEW | dtb_stock_split_join（種別=結合・NEW） | 種別=結合・ステータス=新規登録のレコード1（結合元0/1件） | fixture/migration | 使い捨て | 053,070,071,076 |
| SEED-M04-13-JOIN-SRC-REGISTERED | dtb_stock_split_join（結合元登録） | 種別=結合・ステータス=結合元登録のレコード1（結合元在庫減算済・欠品入力可） | fixture/migration | 使い捨て | 067,072,077 |
| SEED-M04-13-JOIN-WAITING | dtb_stock_split_join（結合承認待ち） | 種別=結合・ステータス=結合承認待ちのレコード1。078用に欠品＝結合数で有効結合数0になる明細を持つ変種を含む | fixture/migration | 使い捨て（承認で結合先加算） | 033,052,073,075,078 |

注: 本機能は新規実装でリバース元（pf-eccube3）に相当機能が無いため、`migration` を充てる場合も DB は ec-cube-enterprise 正典に従う。承認申請系（061/072）は通知メール送信を伴うため**メール実受信は手動**（送信操作とフラッシュのみE2E対象）。破壊的ケース（010/061/062/064/071/072/073）は在庫数・総原価を変動させるため使い捨てシードで隔離する。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 分割登録のCSRF不正は `admin.common.save_error`、結合登録・承認系は `admin.common.csrf_invalid` | StockSplit/JoinController（設計書「分岐・遷移・例外」） | CSRFトークンはSymfony Form内部で生成され、ブラウザUIから不正値に差し替える安定手段が無い。E2Eでは誘発困難＝手動。文言は messages.ja.yaml:1399/3941 で静的確認済 | 014,033,064(IT) | 要確認(UI誘発困難) |
| 2 | 分割数<1=quantity_min、分割数>在庫=quantity_exceeds_stock、結合点数≤0=destination_stock_min（いずれもサーバ側判定） | stock_split_new.twig:122 input min="1" max="{在庫}" required ／ stock_join_new.twig:128 input min="1" required | input の HTML5 制約（min/max/required）でブラウザがクライアント側に送信をブロックすると、設計書が定めるサーバ側フラッシュが表示されない可能性。**期待値は設計書(サーバ判定)由来**でオラクル化し、E2Eはクライアント検証を回避して送信する（属性除去）。在庫超過値もこの `max` 属性からは算出せず、シードDBの在庫数（環境変数 SPLIT_SRC_STOCK）由来とする（属性をテストデータ源に流用しない）。実機での回避要否を確認 | 011,012,031 | 要確認(クライアント検証) |
| 3 | 分割数 `split_quantity`・結合点数 `destination_stock`・承認モード `approval_mode`・却下メモ `rejected_memo` の入力部品 | stock_split_new.twig:122(name=split_quantity, id=split-source-stock-input) ／ stock_join_new.twig:128(name=destination_stock, id無し) ／ stock_split_approval.twig:281-282(hidden approval_mode＋data-approval-mode) | 結合点数 input に id が無く name セレクタ依存。承認は JS が hidden `approval_mode` に値を設定して submit するため、E2Eはボタン押下を再現する（JS依存・要実機確認） | 011,012,031,062,063,064,073 | 要確認(セレクタ/JS依存) |
| 4 | 登録成功時の編集画面遷移・フラッシュ表示 | alert.twig:22/32（.alert-success/.alert-danger）はフラッシュ汎用領域 | フラッシュは画面共通領域で表示。遷移先URL（/edit）とメッセージ文言の双方で判定する。リダイレクト後のフラッシュ保持を実機確認 | 010,030 | 要確認(リダイレクト後保持) |
| 5 | 承認申請成功時に承認権限メンバーへ通知メール送信 | StockSplitApplyApprovalAction（MailService::sendStockApprovalAlertMail） | 送信操作とフラッシュは観測可、実受信・本文は手動 | 061,072 | 手動(メール実受信) |
| 6 | 承認モード `approval_mode` が approve/reject 以外で `admin.common.save_error`（設計書「承認・却下」） | 承認画面の hidden `approval_mode` は承認/却下ボタンのJSが固定値を設定して submit | UIからは approve/reject 以外を選べず（hidden固定）、不正モードはリクエスト改ざんでしか誘発できないため対象外（CSRF #1 と同種）。文言は messages.ja.yaml で静的確認 | 062,063,073,075(IT) | 対象外(UI誘発困難) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（分割） | 分割新規GET表示・分割登録POST | 001,002,010 | カバー |
| 利用者視点の入口（結合） | 結合新規GET表示・結合登録POST | 020,021,030 | カバー |
| 利用者視点の入口（全エンドポイント） | 管理ログイン要・未ログイン誘導 | 040,041,042,043 | 部分カバー（分割新規/結合新規/分割編集・承認/結合編集・承認・欠品入力の各GET入口を直接確認。POST/Ajax/CSV入口は同一認証ガードで間接） |
| フォーム項目・バリデーション（分割新規） | 分割数 必須・1以上・在庫以下／店舗編集権限 | 002,011,012,013 | カバー |
| フォーム項目・バリデーション（結合新規） | 結合点数 必須・0超／店舗編集権限 | 021,031,032 | カバー |
| フォーム項目（編集/承認共通 StockSplitJoinType） | メモ・承認通知先メンバー（必須は申請時） | 061,072（成功）／066,067（通知先未選択エラー） | 部分カバー（成功はfixme・手動/間接。未選択エラーは手動/間接deep。文言は messages.ja.yaml:4295/4645 で静的確認） |
| 結合 編集画面／保存（StockJoinController） | メモのみDB保存・結合元数量はSession保持 | 076 | 部分カバー（save_complete=「保存しました」は観測可だがメモ値はDB内部・要シード手動/間接） |
| 欠品入力画面／保存（結合元登録専用） | 欠品点数の保存（shortage_save_complete） | 077 | 部分カバー（保存完了フラッシュは観測可・欠品値はSession/DB内部・要deepシード手動/間接） |
| 在庫増減ロジック#1 分割登録 | 成功時 register_complete＋編集画面・在庫減算 | 010 | カバー(在庫減算は間接) |
| 在庫増減ロジック#2 分割承認申請 | 分割先1件以上(destination_required)・分割先合計1以上(destination_total_zero)・成功・承認リスト・通知先必須 | 060,065,061,066 | 部分カバー(060はfixme・061/065/066は手動/間接deep) |
| 在庫増減ロジック#3 分割承認/却下 | 承認=分割先加算・却下=分割元戻し・却下メモ必須 | 062,063,064 | 手動/間接(破壊的) |
| 在庫増減ロジック 結合承認/却下 却下メモ必須 | 結合却下メモ未入力エラー(rejection_reason_required) | 033 | 部分カバー(033は要結合承認待ちシード手動/間接。分割の対=063) |
| 在庫増減ロジック#4 結合登録 | 成功時 register_complete＋編集画面・在庫操作なし | 030 | カバー |
| 在庫増減ロジック#5 結合 欠品入力遷移 | 結合元1件以上(require_at_least_one_source)・成功・在庫減算 | 070,071 | 部分カバー(070はfixme・071は手動/間接) |
| 在庫増減ロジック#6 結合 承認申請 | 欠品確定・有効結合数1以上(apply_approval_zero_quantity)・成功・承認リスト | 072,074 | 手動/間接(破壊的) |
| 在庫増減ロジック#7 結合 承認/却下 | 承認=結合先加算＋仕入価格・結合数0以下エラー(approval_no_inbound_quantity)・却下=戻し(approval_reject_complete)・却下メモ必須 | 073,078,075,033 | 部分カバー(073/075は破壊的手動/間接・078は有効結合数0の異常系deep・033は却下メモ未入力) |
| 分岐・遷移・例外（CSRF不正） | save_error／csrf_invalid | （不具合候補#1） | 手動(UI誘発困難) |
| 分岐・遷移・例外（店舗編集権限なし） | not_editable_store | 013,032 | カバー |
| 分岐・遷移・例外（数量条件） | quantity_min／quantity_exceeds_stock／destination_stock_min | 011,012,031 | カバー(クライアント検証 要実機) |
| 分岐・遷移・例外（種別取り違え） | 対応する編集画面へリダイレクト（両方向） | 050,053 | 部分カバー(050=分割IDで結合編集URL／053=結合IDで分割編集URL・いずれも要シード fixme) |
| 分岐・遷移・例外（承認待ち編集POST） | 保存せず承認画面へリダイレクト（分割・結合） | 051,052 | 手動/間接(要承認待ちシード。051=分割／052=結合) |
| 分岐・遷移・例外（承認モード不正） | approval_mode が approve/reject 以外で save_error | （不具合候補#6） | 対象外(UI誘発困難・JS固定) |
| 分岐・遷移・例外（承認ステータス不整合） | 分割 approval_status_error／apply_approval_invalid_status・結合 apply_approval_invalid_status／shortage_entry_invalid_status／move_to_shortage_only_from_registered | （062/073で正常系・不整合はdeep） | 手動/間接(deep) |
| 分岐・遷移・例外（メモ専用を別種別で呼出=404） | createNotFoundException | （観測価値低・別種別呼出はdeep） | 対象外(deep・低価値) |
| 状態・データ更新（更新系DB） | 在庫/総原価/明細/履歴/承認リストの更新値 | 010,030,061,062 等で間接 | 手動/間接(DB内部値) |
| トランザクション・同時実行制御 | 悲観ロック・ロールバック | （DB内部・並行制御） | 対象外(観測外) |
| Session一時保持（NEWの分割先/結合元/欠品） | Ajaxでの数量/区分/削除のSession更新 | （Ajax内部Session） | 手動/間接 |
| CSV雛形DL／取込（分割先/結合元/欠品） | ダウンロード発火・取込結果・CSV内容 | （内容は手動・取込はAjax JSON） | 手動 |
| 通知メール（承認依頼） | 送信操作・成功フラッシュ／実受信 | 061,072 / 実受信は手動 | 手動(メール実受信) |
| ログ出力抑止（秘密値・識別子） | ブラウザ観測外 | （対象外＝観測外） | 対象外(理由付き) |
| 廃止I/F（分割先数量更新 旧/停止） | 常に400 | （UI無し・廃止） | 対象外(廃止) |

未カバーはいずれも理由（DB/Session内部値・Ajax内部・CSV内容・メール実受信・並行制御・CSRFのUI誘発困難・廃止I/F・低価値deep）を明記済み。本監査で追記した結合側・通知先・却下メモ・有効結合数0・両方向リダイレクトの対により、正常系（010/030/061/062/071/072/073/076/077）と各エラー分岐（011/012/013/031/032/060/063/066/067/070/078／結合却下メモ033）の対を分割・結合の双方で備える。「カバー」と断定していた節のうち、構成要素にfixme/手動/間接を含むものは「部分カバー」へ是正し、過大主張を解消した。
