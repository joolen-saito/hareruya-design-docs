# m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.html`（正本 `functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_33_admin_product_product_sale_high_price_csv_import_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・フラッシュメッセージ・URL・ダウンロード発火・DB状態(間接)などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言や Form 制約(NotBlank/maxSize/桁数)をオラクル化しない。設計源は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）に出す。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | ファイル取込の実行結果（成功メッセージ・取込履歴追記＝要シード/破壊的） |
| IT-27 | 雛形ファイルダウンロード発火・ファイル名（内容は手動） |
| IT-15 | 未認証ガード・CSRF不備（不正トークンPOSTのリダイレクト観測）。一時ファイル読捨ては観測外 |
| IT-20 | ログ出力抑止＝ブラウザ観測外（対象外） |
| IT-25 | UI部品・フォーマット表必須バッジ・履歴件数プルダウン・確認ダイアログ無・成功/エラーフラッシュ |
| IT-03 | 画面遷移（取込後リダイレクト・履歴件数変更のクエリ付きGET・失敗時エラーフラッシュ） |
| IT-13 | URL直接アクセス（未ログイン誘導・page_count許容外でも表示） |
| IT-22 | アップロードバリデーション（必須・形式・列数・数値・桁・選択肢・DB相関・行数上限） |
| IT-23 | DB業務検索なし（履歴は取込種別固定クエリ＝対象外） |
| IT-26 | 規格更新・価格履歴・取込履歴の登録内容（多くは間接/要シード/破壊的） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-001	IT-25	UI部品	P2	アップロードフォーム・雛形リンクが表示される	管理ログイン済／SEED-M03-33-ADMIN	—	1. アップロード画面(/admin/product/sale_high_price/csv_upload)を表示する	ファイル入力欄・アップロードボタン・雛形ダウンロードリンクが表示されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-002	IT-25	表示結果	P2	タイトル・サブタイトルが表示される	管理ログイン済／SEED-M03-33-ADMIN	—	1. アップロード画面を表示する	タイトルに「商品管理」、サブタイトルに「セール用高額商品価格変更CSVアップロード」が表示されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-003	IT-25	UI部品	P2	フォーマット表で必須列に必須バッジが付く	管理ログイン済／SEED-M03-33-ADMIN	—	"1. アップロード画面を表示する
2. フォーマット説明表を確認する"	仕様の必須列（商品コード・販売価格・買取価格・セールフラグ・スマレジ連携フラグ）の5列に「必須」バッジが表示されること（帯URL・タグ(ID)は任意）。※刷新先実装は3列のみ＝不具合候補#1。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-004	IT-25	確認ダイアログ	P3	送信前の確認ダイアログがない	管理ログイン済／SEED-M03-33-ADMIN	ヘッダ不一致CSV（col1,col2）	"1. アップロード画面を表示する
2. CSVを選択しアップロードボタンを押下"	確認ダイアログが表示されず直接送信され、エラーフラッシュが表示されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-005	IT-25	表示結果	P3	取込履歴件数プルダウンが表示される	管理ログイン済／SEED-M03-33-ADMIN	—	"1. アップロード画面を表示する
2. 取込履歴セクションを確認する"	履歴の表示件数プルダウンが表示されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-006	IT-27	実行結果	P2	雛形ダウンロードが発火しファイル名が得られる	管理ログイン済／SEED-M03-33-ADMIN	—	"1. アップロード画面を表示する
2. 雛形ダウンロードリンクを押下"	sale_high_price_template.csv のダウンロードが発火すること（内容は手動確認）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-007	IT-03	画面遷移	P2	履歴件数変更でクエリ付きGETへ遷移する	管理ログイン済／SEED-M03-33-ADMIN	表示件数＝50	"1. アップロード画面を表示する
2. 履歴件数プルダウンを50件に変更する"	page_count=50 のクエリ付きURLへ遷移すること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-008	IT-13	URL直接アクセス	P3	page_count許容外でもエラーにならず表示される	管理ログイン済／SEED-M03-33-ADMIN	page_count=7（許容外）	1. /admin/product/sale_high_price/csv_upload?page_count=7 へアクセスする	エラーにならず画面が正常表示されること（許容外は既定/セッション値を採用）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-010	IT-15	未認証	P2	未ログインでアップロードURLへアクセスするとログイン画面へ誘導される	未ログイン	—	1. /admin/product/sale_high_price/csv_upload へ直接アクセスする	管理ログイン画面へ誘導されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-011	IT-15	CSRF	P2	CSRFトークン不正のPOSTはエラーで取込されずリダイレクトされる	管理ログイン済／SEED-M03-33-ADMIN	不正トークン付きの import POST	1. 管理ログイン後、不正なCSRFトークンで import ルートへ直接POSTする	フォーム妥当性エラーで取込が実行されず、アップロード画面(csv_upload)へリダイレクトされること（副作用なし）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-012	IT-03	画面遷移	P2	取込POST後は常にアップロード画面へリダイレクトされる	管理ログイン済／SEED-M03-33-ADMIN	ヘッダ不一致CSV	"1. アップロード画面を表示する
2. CSVをアップロードする"	処理後は常にアップロード画面(csv_upload)へリダイレクトされること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-020	IT-22	必須バリデーション	P1	ファイル未選択でアップロードするとエラーで同画面へ戻る	管理ログイン済／SEED-M03-33-ADMIN	ファイル未選択	"1. アップロード画面を表示する
2. ファイル未選択のままアップロードボタンを押下"	エラーフラッシュが表示され、アップロード画面へリダイレクトされること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-021	IT-22	その他のバリデーション	P2	ヘッダ不一致CSVで形式不一致エラーになる	管理ログイン済／SEED-M03-33-ADMIN	先頭行が定義ヘッダと不一致のCSV	"1. アップロード画面を表示する
2. ヘッダ不一致CSVをアップロードする"	「CSVのフォーマットが一致しません。」が表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-022	IT-22	必須バリデーション	P2	データ行ゼロのCSVでデータ不存在エラーになる	管理ログイン済／SEED-M03-33-ADMIN	ヘッダのみ（データ行なし）	"1. アップロード画面を表示する
2. ヘッダ行のみのCSVをアップロードする"	「CSVデータが存在しません。」が表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-023	IT-22	その他のバリデーション	P2	物理列数不一致のCSVで形式不正エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	定義7列に対し3列のデータ行	"1. アップロード画面を表示する
2. 列数不一致CSVをアップロードする"	「…行目のデータを確認してください」を含む形式不正メッセージが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-024	IT-22	必須バリデーション	P2	必須列（販売価格）が空だと必須エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	販売価格セルが空のデータ行	"1. アップロード画面を表示する
2. 販売価格が空のCSVをアップロードする"	「…は必須項目です」を含むメッセージが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-025	IT-22	数値バリデーション	P2	販売価格が非数値だと値異常エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	販売価格＝abc	"1. アップロード画面を表示する
2. 販売価格が非数値のCSVをアップロードする"	販売価格の値異常エラーが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-026	IT-22	文字列長バリデーション	P2	販売価格が9桁超過だと桁数エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	販売価格＝1234567890（10桁）	"1. アップロード画面を表示する
2. 販売価格10桁のCSVをアップロードする"	「…桁以内の数値…」を含む桁数エラーが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-027	IT-22	数値バリデーション	P2	セールフラグが0/1以外だと値異常エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	セールフラグ＝2	"1. アップロード画面を表示する
2. セールフラグ=2のCSVをアップロードする"	「…の値が異常です」を含むメッセージが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-030	IT-22	DBとの相関バリデーション	P2	高額・非公開規格に該当しない商品コードで不存在エラーになる	管理ログイン済／SEED-M03-33-ADMIN	実在しない商品コード	"1. アップロード画面を表示する
2. 不存在の商品コードのCSVをアップロードする"	「…ではデータを取得できません」を含む不存在エラーが表示され、アップロード画面に留まること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-031	IT-22	DBとの相関バリデーション	P2	同一商品コードの規格が2件以上だと重複エラーで全体中断する	管理ログイン済／SEED-M03-33-DUP	重複規格に一致する商品コード	"1. アップロード画面を表示する
2. 重複規格に一致する商品コードのCSVをアップロードする"	商品コード重複エラーが表示され、取込が全体中断（ロールバック）されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-032	IT-22	その他のバリデーション	P2	タグ(ID)がマスタに存在しないと取込エラーになる	管理ログイン済／SEED-M03-33-HIGH-PRICE	存在しないタグIDを含む有効規格行	"1. アップロード画面を表示する
2. 不正タグIDを含むCSVをアップロードする"	タグIDマスタ不存在のエラーが表示され、取込が中断されること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-040	IT-16	実行結果	P1	有効CSV取込で成功メッセージが表示され取込履歴が1件増える	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的・後始末必須）	高額・非公開規格に一致する有効CSV	"1. アップロード画面を表示する
2. 有効CSVをアップロードする"	「登録が完了しました。」が表示され、取込履歴にアップロードファイル名の行が1件増えること。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-041	IT-26	更新内容	P2	セールOFF→CSVセールONで販売価格・セールフラグが更新される	管理ログイン済／SEED-M03-33-SALE-OFF（破壊的）	セールフラグ=1・販売価格指定の有効CSV	"1. 有効CSVをアップロードする
2. 規格の price02・sale_flg を確認する"	規格の販売価格がCSV値・セールフラグがONに更新されること（DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-042	IT-26	更新内容	P2	セールON→CSVセールOFFで基準価格へ戻し販売列≠0なら警告が出る	管理ログイン済／SEED-M03-33-SALE-ON（破壊的）	セールフラグ=0・販売価格≠0の有効CSV	"1. 有効CSVをアップロードする
2. 警告フラッシュを確認する"	「セール外のため…」の警告が表示され、販売価格が基準価格へ戻ること（DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-043	IT-26	更新内容	P2	通常(OFF)かつCSVセールOFFで既存price02維持＋警告が出る	管理ログイン済／SEED-M03-33-SALE-OFF（破壊的）	セールフラグ=0の有効CSV	"1. 有効CSVをアップロードする
2. 警告フラッシュを確認する"	「通常商品のため…」の警告が表示され、販売価格は既存price02が維持されること（DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-044	IT-25	状態変化	P2	販売・買取・基準のいずれも不変なら価格履歴は増えない	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	現行と同値の有効CSV	"1. 価格履歴件数を記録する
2. 同値CSVをアップロードする
3. 価格履歴件数を再確認する"	価格履歴(dtb_price_history)の行数が増えないこと（DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-045	IT-26	更新内容	P2	買取価格はCSV値で常に更新される	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	買取価格指定の有効CSV	"1. 有効CSVをアップロードする
2. 規格の buy_price を確認する"	規格の買取価格(dtb_product_class.buy_price)がCSV値で更新されること（DB値＝手動/間接）。※刷新先実装に買取価格列が無い＝不具合候補#1。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-046	IT-26	更新内容	P2	スマレジ連携フラグはCSV値で更新される	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	スマレジ連携フラグ指定の有効CSV	"1. 有効CSVをアップロードする
2. 規格の smaregi_alignment_flg を確認する"	規格のスマレジ連携フラグ(dtb_product_class.smaregi_alignment_flg)がCSV値で更新されること（DB値＝手動/間接）。※刷新先実装にスマレジ連携フラグ列が無い＝不具合候補#1。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-050	IT-22	その他のバリデーション	P2	5010行以上のCSVは取込前に拒否される	管理ログイン済／SEED-M03-33-ADMIN	データ行5011のCSV	"1. アップロード画面を表示する
2. 大量行CSVをアップロードする"	行数上限超過メッセージ（…登録できません。）が表示され、取込本体が開始されないこと。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-009	IT-03	画面遷移	P3	ナビ導線でアップロード画面に到達する	管理ログイン済／SEED-M03-33-ADMIN	—	1. 商品管理→商品CSV管理→セール用高額商品価格変更CSVアップロードのナビをたどる	アップロード画面(csv_upload)が表示されること（利用者視点の入口）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-013	IT-15	未認証	P2	未ログインでimportへ直接POSTすると取込されずログイン誘導	未ログイン	未ログイン状態の import POST	1. 未ログイン状態で import ルートへ直接POSTする	管理ログイン画面へ誘導され、取込が実行されないこと（副作用なし）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-014	IT-13	URL直接アクセス	P3	page_no指定でもエラーにならず表示される（ページ番号セッション保存）	管理ログイン済／SEED-M03-33-ADMIN	page_no=2	1. /admin/product/sale_high_price/csv_upload?page_no=2&page_count=50 へアクセスする	エラーにならず画面が表示されること（page_noはセッションへ保存される＝処理フローGET4）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-028	IT-22	数値バリデーション	P2	スマレジ連携フラグが0/1以外だと値異常エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	スマレジ連携フラグ＝2	"1. アップロード画面を表示する
2. スマレジ連携フラグ=2のCSVをアップロードする"	「…の値が異常です」を含むメッセージが表示され、アップロード画面に留まること。※刷新先実装にスマレジ連携フラグ列が無い＝不具合候補#1。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-029	IT-22	数値バリデーション	P2	買取価格が非数値だと値異常エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	買取価格＝abc	"1. アップロード画面を表示する
2. 買取価格が非数値のCSVをアップロードする"	買取価格の値異常エラーが表示され、アップロード画面に留まること。※刷新先実装に買取価格列が無い＝不具合候補#1。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-033	IT-22	必須バリデーション	P2	必須列（商品コード）が空だと必須エラーで打ち切られる	管理ログイン済／SEED-M03-33-ADMIN	商品コードセルが空のデータ行	"1. アップロード画面を表示する
2. 商品コードが空のCSVをアップロードする"	「…は必須項目です」を含むメッセージが表示され、アップロード画面に留まること（024の別必須列対）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-058	IT-22	その他のバリデーション	P3	.tsv拡張子はタブ区切りとして取り込まれる	管理ログイン済／SEED-M03-33-ADMIN	ヘッダ不一致のタブ区切りTSV	"1. アップロード画面を表示する
2. ヘッダ不一致のTSVファイルをアップロードする"	タブ区切りとして解釈され「CSVのフォーマットが一致しません。」が表示されること（汎用インポータ内部1＝tsv分岐）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-051	IT-22	DBとの相関バリデーション	P2	高額コード空/公開規格の商品コードで不存在エラーになる	管理ログイン済／SEED-M03-33-PUBLIC（要シード）	規格は存在するが高額コード空または公開ステータスの商品コード	"1. アップロード画面を表示する
2. 公開（または高額コード空）規格の商品コードのCSVをアップロードする"	「…ではデータを取得できません」を含む不存在エラーが表示され、取込が中断されること（030の別失敗分岐）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-047	IT-26	更新内容	P2	帯URLはCSV値で更新され空ならnullになる	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	帯URL指定／空の有効CSV	"1. 有効CSVをアップロードする
2. 規格の belt_url を確認する"	規格のbelt_url(dtb_product_class.belt_url)がCSV値で更新され、空欄ならnullになること（DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-048	IT-26	更新内容	P2	正常タグIDで商品タグが置換されタグ空でクリアされる	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	既存タグID／タグ空の有効CSV	"1. 有効CSVをアップロードする
2. dtb_product_tag を確認する"	商品タグ(dtb_product_tag.tag_id)がCSV値で置換され、タグ空なら紐付けがクリアされること（032の正常対・DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-049	IT-25	状態変化	P2	販売・買取・基準のいずれか変化で価格履歴が1件増える	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	現行と異なる価格の有効CSV	"1. 価格履歴件数を記録する
2. 価格変更CSVをアップロードする
3. 価格履歴件数を再確認する"	価格履歴(dtb_price_history)が1件増えること（044の正常対・DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-053	IT-26	更新内容	P2	セールON→CSVセールONで販売価格がCSV値に更新され警告は出ない	管理ログイン済／SEED-M03-33-SALE-ON（破壊的）	セールフラグ=1・販売価格指定の有効CSV	"1. 有効CSVをアップロードする
2. 規格の price02・sale_flg とフラッシュを確認する"	販売価格がCSV値・セールONが維持され、警告フラッシュが出ないこと（決定順序2・DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-054	IT-26	更新内容	P2	セールON→CSVセールOFFかつ販売列=0では警告が出ず基準へ戻す	管理ログイン済／SEED-M03-33-SALE-ON（破壊的）	セールフラグ=0・販売価格=0の有効CSV	"1. 有効CSVをアップロードする
2. 警告フラッシュの有無を確認する"	販売価格が基準価格へ戻り、警告（セール外のため…）が出ないこと（決定順序3の販売0分岐・042の対・DB値＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-055	IT-16	実行結果	P2	取込成功後、取込履歴にアップロード日時・作業者が表示される	管理ログイン済／SEED-M03-33-HIGH-PRICE（破壊的）	有効CSV	"1. 有効CSVをアップロードする
2. 取込履歴行を確認する"	履歴行にファイル名・アップロード日時・作業者が表示されること（040の表示確認・要シード）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-056	IT-26	更新内容	P2	取込失敗時は取込履歴が増えない	管理ログイン済／SEED-M03-33-HIGH-PRICE	不正CSV（breakAll）	"1. 取込履歴件数を記録する
2. 不正CSVをアップロードする
3. 取込履歴件数を再確認する"	取込履歴件数が増えないこと（IT084対応・ベースライン要・DB件数＝手動/間接）。				
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	E2E-M03-33-057	IT-22	その他のバリデーション	P3	ファイルサイズ上限超過は取込前に拒否される	管理ログイン済／SEED-M03-33-ADMIN	eccube_csv_size超過の大容量CSV	"1. アップロード画面を表示する
2. サイズ上限超過のCSVをアップロードする"	サイズ制約エラーで取込本体が開始されないこと（生成困難・文言はframework依存＝手動）。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（`Form/Type/Admin/CsvImportType.php:80-82`）から導出（`import_file`→`#admin_csv_import_import_file`）。画面 Twig は `csv_product_sale_high_price.twig`（`base_csv_upload.twig` 継承）。フラッシュは `alert.twig`（`default_frame.twig:200` include）。行番号は ec-cube-enterprise 現行ソース基準。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M03-33-001 | E2E自動化 | #admin_csv_import_import_file(base_csv_upload.twig:65) / #upload-button(twig:73 trans admin.common.csv_upload messages:1547) / a#download-template-button(twig:83 trans admin.common.csv_skeleton_download messages:1548) | フロント挙動（表示要素） |
| E2E-M03-33-002 | E2E自動化 | title block admin.product.product_management(base_csv_upload.twig:3 messages:1723) / sub_title admin.product.sale_high_price_csv(csv_product_sale_high_price.twig:5 messages:1812) | フロント挙動（タイトル・サブタイトル） |
| E2E-M03-33-003 | E2E自動化 | .badge.bg-primary(base_csv_upload.twig:101 trans admin.common.required) / 必須列=商品コード,販売価格,買取価格,セールフラグ,スマレジ連携フラグ（仕様 functions md 列表。帯URL/タグ(ID)は任意） | フロント挙動（必須バッジ。期待5列は仕様由来。実装3列は不具合候補#1） |
| E2E-M03-33-004 | E2E自動化 | page.on('dialog') / .alert.alert-danger(alert.twig:32) | フロント挙動（モーダルなし）＋エラー処理 |
| E2E-M03-33-005 | E2E自動化 | #page_count_pulldown(csv_import_history.twig:10) | フロント挙動（履歴件数プルダウン） |
| E2E-M03-33-006 | E2E自動化 | a#download-template-button(twig:83) / download.suggestedFilename | 利用者視点の入口（雛形DL Controller.php:52-58 sale_high_price_template.csv） |
| E2E-M03-33-007 | E2E自動化 | #page_count_pulldown option value=path(...page_count)(csv_import_history.twig:12) / URL page_count=50 | 画面遷移＋セッション（page_count 許容値保存） |
| E2E-M03-33-008 | E2E自動化 | URLクエリ page_count=7 / #page_count_pulldown | 処理フロー3（許容外は既定/セッション値）＋URL直接アクセス |
| E2E-M03-33-010 | E2E自動化（資格情報不要） | 管理ログイン画面 #login_id(login.twig) | 権限・認可（未認証はログイン誘導） |
| E2E-M03-33-011 | E2E自動化（生POST・資格情報要） | import ルートへ不正 _token POST / リダイレクト先URL(csv_upload) | エラー処理（フォーム・CSRF不備→エラーフラッシュ＋リダイレクト Controller.php:113-118）。期待は仕様由来。フィールド名 admin_csv_import[_token]（blockPrefix由来）は入力プラミングで非オラクル、要実機確認 |
| E2E-M03-33-012 | E2E自動化 | リダイレクト先URL(csv_upload) | 画面遷移（取込POSTは常に csv_upload へリダイレクト Controller.php:118,126,132,172） |
| E2E-M03-33-020 | E2E自動化 | .alert.alert-danger(alert.twig:32,42) / リダイレクト先URL | エラー処理（フォーム不正→エラーフラッシュ＋リダイレクト Controller.php:113-118）※文言は不具合候補#2 |
| E2E-M03-33-021 | E2E自動化 | .alert.alert-danger | バリデーション（1行目ヘッダ必須）＝admin.csv.error.format.header(messages:2209 / CsvImporter.php:191) |
| E2E-M03-33-022 | E2E自動化 | .alert.alert-danger | バリデーション（最低1データ行）＝admin.csv.error.data.empty(messages:2211 / CsvImporter.php:201) |
| E2E-M03-33-023 | E2E自動化 | .alert.alert-danger | バリデーション（物理列数一致）＝admin.csv.error.format.body(messages:2210 / BaseCsvImportHandler.php:75 breakAll) |
| E2E-M03-33-024 | E2E自動化 | .alert.alert-danger | バリデーション（必須列の値）＝admin.csv.error.data.require(messages:2213 / BaseCsvImportHandler.php:94 breakAll) |
| E2E-M03-33-025 | E2E自動化 | .alert.alert-danger（「販売価格」を含む） | バリデーション（数値列は半角数字0以上）＝列バリデータ ※厳密文言は不具合候補#3 |
| E2E-M03-33-026 | E2E自動化 | .alert.alert-danger | バリデーション（数値9桁上限）＝admin.csv.error.product.max_length(messages:2221) |
| E2E-M03-33-027 | E2E自動化 | .alert.alert-danger | バリデーション（セールは0/1）＝admin.csv.error.product.invalid(messages:2217) |
| E2E-M03-33-030 | E2E自動化（資格情報のみ） | .alert.alert-danger | 行ターゲット検証2（高額・非公開規格の存在必須）＝admin.csv.error.product.not_exists(messages:2218 / SaleHighPriceImportHandler.php:197 breakAll) |
| E2E-M03-33-031 | E2E自動化（要シード DUP） | .alert.alert-danger | 行ターゲット検証1（商品コード重複禁止）＝product_code_duplicated(messages:2225 / Handler.php:191 breakAll) |
| E2E-M03-33-032 | E2E自動化（要シード HIGH-PRICE） | .alert.alert-danger | 各列（タグIDマスタ存在検証）＝列バリデータ ※対象規格存在が前提 |
| E2E-M03-33-040 | E2E自動化（要シード HIGH-PRICE・破壊的） | .alert.alert-success(alert.twig:22 admin.register.complete messages:1773) / 履歴テーブル fileName(csv_import_history.twig:32) | 処理フロー8（成功フラッシュ＋dtb_csv_import_history INSERT Controller.php:163-169） |
| E2E-M03-33-041 | 手動/間接（要シード・DB値） | （DB dtb_product_class.price02/sale_flg） | 決定順序1（OFF→ON Handler.php:122-124・updateProductClassForHighPriceSaleCsv） |
| E2E-M03-33-042 | E2E自動化（要シード SALE-ON・破壊的） | .alert.alert-warning(alert.twig:52 alert_off_sale_buy_only messages:1815) | 決定順序3（ON→OFF Handler.php:128-133） |
| E2E-M03-33-043 | E2E自動化（要シード SALE-OFF・破壊的） | .alert.alert-warning(alert.twig:52 alert_end_sale_sell_from_standard messages:1816) | 決定順序4（OFF→OFF Handler.php:134-137） |
| E2E-M03-33-044 | 手動/間接（要シード・DB値） | （DB dtb_price_history 件数差分） | データ整合性（変化なしなら履歴増えない Handler.php:148-157 addSellBuyPriceHistoryIfChanged） |
| E2E-M03-33-045 | 手動/間接（要シード・DB値） | （DB dtb_product_class.buy_price） | 入力項目（買取価格は常にCSV値で更新 functions md 列表）。※刷新先に買取価格列なし＝不具合候補#1 |
| E2E-M03-33-046 | 手動/間接（要シード・DB値） | （DB dtb_product_class.smaregi_alignment_flg） | 入力項目（スマレジ連携フラグはCSV値で更新 functions md 列表）。※刷新先にスマレジ列なし＝不具合候補#1 |
| E2E-M03-33-050 | E2E自動化 | .alert.alert-danger | バリデーション（改行カウント5010未満）＝admin.csv.error.upload.maxrecord(messages:1429 / Controller.php:129-132) |
| E2E-M03-33-009 | E2E自動化 | getByRole link admin.product.sale_high_price_csv(messages:1812) / URL csv_upload | 利用者視点の入口（ナビ導線：商品管理→商品CSV管理→セール用…）。リンク名は仕様由来 |
| E2E-M03-33-013 | E2E自動化（資格情報不要） | 未ログインの import 生POST / リダイレクト先 /login | 権限・認可（未認証POST取込はログイン誘導・取込されず副作用なし）。010(GET)の対 |
| E2E-M03-33-014 | E2E自動化 | URLクエリ page_no=2 / #page_count_pulldown | 処理フローGET4（page_no をクエリ/セッションから決め都度保存）＋URL直接アクセス |
| E2E-M03-33-028 | E2E自動化 | .alert.alert-danger（「…の値が異常です」） | バリデーション（スマレジは0/1）＝admin.csv.error.product.invalid(messages:2217)。027(セール)の対列。※スマレジ列は刷新先欠落＝不具合候補#1 |
| E2E-M03-33-029 | E2E自動化 | .alert.alert-danger（「買取価格」を含む） | バリデーション（買取価格は半角数字0以上）＝列バリデータ。025(販売価格)の対列。※買取価格列は刷新先欠落＝不具合候補#1・厳密文言は不具合候補#3 |
| E2E-M03-33-033 | E2E自動化 | .alert.alert-danger（「…は必須項目です」） | バリデーション（必須列の値）＝admin.csv.error.data.require(messages:2213)。024(販売価格)の別必須列対 |
| E2E-M03-33-058 | E2E自動化 | .alert.alert-danger / name=*.tsv mime text/tab-separated-values | 汎用インポータ内部1（拡張子tsvはタブ区切りで読む CsvImporter.php）。タブ分割→ヘッダ不一致=admin.csv.error.format.header |
| E2E-M03-33-051 | E2E自動化（要シード PUBLIC・fixme） | .alert.alert-danger | 行ターゲット検証2の別分岐（高額コード空/公開規格→不存在 admin.csv.error.product.not_exists messages:2218）。030の別失敗分岐 |
| E2E-M03-33-047 | 手動/間接（要シード・DB値） | （DB dtb_product_class.belt_url） | 行更新処理5（belt_url を CSV値で更新・空はnull Handler.php）。決定順序非依存 |
| E2E-M03-33-048 | 手動/間接（要シード・DB値） | （DB dtb_product_tag.tag_id） | 行更新処理3（タグ置換・空でクリア Handler.php）。032の正常対 |
| E2E-M03-33-049 | 手動/間接（要シード・DB値） | （DB dtb_price_history 件数差分） | 行更新処理7（販売/買取/基準のいずれか変化で履歴+1 Handler.php addSellBuyPriceHistoryIfChanged）。044の正常対 |
| E2E-M03-33-053 | 手動/間接（要シード SALE-ON・DB値） | （DB dtb_product_class.price02/sale_flg / 警告なし .alert-warning不在） | 決定順序2（ON→ON 新販売価格=CSV・警告なし Handler.php:122-127） |
| E2E-M03-33-054 | 手動/間接（要シード SALE-ON・DB値） | （DB price02=基準 / 警告なし .alert-warning不在） | 決定順序3の販売列0分岐（ON→OFFかつ販売0→info積まない Handler.php:128-133）。042の対 |
| E2E-M03-33-055 | 手動/間接（要シード・破壊的） | 履歴テーブル createDate/作業者(csv_import_history.twig:32 近傍列) | フロント挙動（履歴の日時・作業者表示）＋処理フロー8。040の表示確認 |
| E2E-M03-33-056 | 手動/間接（ベースライン要・DB件数） | （DB dtb_csv_import_history 件数差分=0） | データ整合性（失敗時は履歴が増えない 設計書 履歴/失敗時）。IT084対応・040の否定対 |
| E2E-M03-33-057 | 手動（生成困難・文言framework依存） | （Symfony ファイルサイズ制約 eccube_csv_size） | バリデーション（最大サイズ eccube_csv_size M）。大容量生成は実機/手動 |

注: 既存IT cases は観点名のみの定型自動生成スタブであり機能固有シナリオを持たない。本E2Eは設計書本文（処理フロー・決定順序・バリデーション・エラー処理）を一次情報源として網羅し、各行を付帯表2bで分類した。`元ITケースID` 接頭辞は `IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-NNN`。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_33_..._it_cases.md` の関連ID件数（IT-16=1/IT-27=2/IT-15=4/IT-20=2/IT-25=9/IT-03=7/IT-13=1/IT-22=35/IT-23=22/IT-26=7＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は付帯表2b（行単位明細・全90行）が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 1 | 0 | 0 | |
| IT-27 | 2 | 1 | 0 | 1 | 出力失敗はE2Eで誘発不可（対象外） |
| IT-15 | 4 | 2 | 1 | 1 | 一時ファイル読捨ては観測外（CSRF不備は不正トークンPOSTのリダイレクト観測でE2E化） |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止はブラウザ観測外 |
| IT-25 | 9 | 4 | 3 | 2 | 取込開始/異常終了ログは観測外 |
| IT-03 | 7 | 5 | 2 | 0 | 副作用群(更新)はDB間接 |
| IT-13 | 1 | 1 | 0 | 0 | |
| IT-22 | 35 | 15 | 3 | 17 | 本機能の入力CSV列に非該当の汎用バリデーション細目はブラウザ観測対象にならない |
| IT-23 | 22 | 4 | 2 | 16 | 本機能はDB業務検索を行わない（履歴は取込種別固定クエリ）。ただし重複/不存在/ロールバック/登録更新の観点行は本機能の検証に写像（064,066,067,075,079,088） |
| IT-26 | 7 | 5 | 1 | 1 | 規格更新の原値照合は画面観測不能（一時ファイル読捨ては観測外） |
| 合計 | 90 | 38 | 12 | 40 | **未分類 0** |

注: 対象外40件はいずれも「ブラウザで観測不能」「本機能で非該当」「ログ/サーバ内部」が理由であり、放置ではない。前版で一括対象外としていた IT-22 行037-042 と IT-23 行062-082 のうち、本機能の検証（数値異常/重複/不存在/価格履歴/一覧一致/ロールバック/登録更新）に写像できる行をE2E自動化・手動/間接へ是正した（付帯表2b参照）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | E2E自動化 | 040（取込成功＋履歴追記。要シード/破壊的） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 006（雛形ダウンロード発火） |
| 003 | IT-27 | 出力失敗 | 対象外 | 出力失敗（雛形DL生成失敗）はE2Eで人為的に誘発できず、DL成功(006)で代表すると監査不能のため対象外 |
| 004 | IT-15 | CSRF | E2E自動化 | 011（不正トークンPOST→フォーム妥当性エラー＋csv_upload へリダイレクト・副作用なしを観測。仕様エラー処理由来） |
| 005 | IT-15 | 未認証 | E2E自動化 | 010（未ログイン誘導） |
| 006 | IT-15 | 対象データ | 対象外 | 一時ディレクトリのファイル読捨て/削除はサーバ内部・観測外 |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | 商品コードのキー性はDB内部。不存在は030で間接確認 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 041（規格 price02/sale_flg 更新＝DB値） |
| 010 | IT-25 | UI部品 | E2E自動化 | 030（不存在エラー全体中断） |
| 011 | IT-25 | UI部品 | E2E自動化 | 031（重複エラー全体中断。要シード） |
| 012 | IT-25 | 操作起点 | 手動/間接 | 043（セール外OFF→price02維持。DB値・破壊的） |
| 013 | IT-25 | 確認ダイアログ | 手動/間接 | 044（価格履歴 変化なしで増えない。DB件数） |
| 014 | IT-25 | 確認ダイアログ | 手動/間接 | コミット後参照クエリ更新値＝DB値（044近傍） |
| 015 | IT-25 | 確認ダイアログ | E2E自動化 | 040（取込履歴は成功のみ1件増。履歴テーブル表示） |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 040（成功フラッシュ admin.register.complete） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 021/020（失敗時 admin エラーフラッシュ） |
| 018 | IT-03 | 画面遷移 | 手動/間接 | 041（副作用＝規格/タグ/履歴更新群。DB値） |
| 019 | IT-03 | 画面遷移 | 手動/間接 | 041（登録/更新の直接保存。DB値） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 007/008（GET 保存ページサイズ・ページ番号で再取得） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 012（POST後フラッシュ表示＋リダイレクト） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 020（フォーム・CSRF不備→エラーフラッシュ＋リダイレクト） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 021/023/030（CSV不備→ロールバック） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 010/008（URL直接アクセス・未ログイン誘導） |
| 025 | IT-25 | HTTPステータス | 対象外 | 取込開始ログはブラウザ観測外 |
| 026 | IT-25 | URL | 対象外 | 異常終了ログはブラウザ観測外 |
| 027,028 | IT-22 | 必須バリデーション | E2E自動化 | 020（ファイル未選択）/024（必須列空） |
| 029 | IT-22 | 文字列長バリデーション | E2E自動化 | 026（販売価格9桁上限） |
| 030-034 | IT-22 | 文字列長バリデーション | 対象外 | 文字列長制約はない（帯URLは列検証なし。数値桁は026で代表） |
| 035 | IT-22 | 数値バリデーション | E2E自動化 | 025（販売価格 非数値） |
| 036 | IT-22 | 数値バリデーション | E2E自動化 | 026（販売価格 桁上限） |
| 037 | IT-22 | 数値バリデーション | E2E自動化 | 025/029（販売価格・買取価格の非数値＝値異常） |
| 038 | IT-22 | 数値バリデーション | 対象外 | 数値列の追加細目（小数/符号等）は本機能のCSV列に該当なし |
| 039 | IT-22 | 数値バリデーション | E2E自動化 | 031（同一商品コード重複の検出。要シード） |
| 040 | IT-22 | 数値バリデーション | E2E自動化 | 043（通常OFF×CSV OFFで既存price02維持の正常分岐・要シードfixme） |
| 041 | IT-22 | 数値バリデーション | 手動/間接 | 049（価格変化で価格履歴+1。DB件数） |
| 042 | IT-22 | 数値バリデーション | 手動/間接 | 040/044（取込後一覧一致＝コミット後更新値。DB値） |
| 043 | IT-22 | 文字種バリデーション | E2E自動化 | 025（半角数字以外＝値異常） |
| 044 | IT-22 | 文字種バリデーション | 対象外 | 文字種観点は025で代表、他列に文字種制約なし |
| 045 | IT-22 | その他のバリデーション | E2E自動化 | 027（セールフラグ0/1選択肢） |
| 046 | IT-22 | その他のバリデーション | E2E自動化 | 050（行数上限5010） |
| 047 | IT-22 | その他のバリデーション | E2E自動化 | 032（タグIDマスタ存在。要シード） |
| 048-053 | IT-22 | その他のバリデーション | 対象外 | 本機能のCSV列に該当する追加細目なし |
| 054-057 | IT-22 | 相関バリデーション | 対象外 | 汎用相関は非該当。DB相関は058,059（030/031）で代表 |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 030（不存在規格） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 031（重複規格。要シード） |
| 060 | IT-22 | 必須制御 | 手動/間接 | JSのファイル名ラベル表示（hidden inputへのsetInputFilesでchange発火が要実機確認） |
| 061 | IT-22 | 部分入力 | E2E自動化 | 004（送信前の確認ダイアログなし） |
| 062-063 | IT-23 | 検索条件 | 対象外 | 本機能はDB業務検索を行わない（履歴は取込種別固定クエリ。件数表示は005/007で代表） |
| 064 | IT-23 | 検索条件 | E2E自動化 | 030（商品コードをキーに規格を特定。不存在で打ち切り） |
| 065 | IT-23 | 検索条件 | 対象外 | 業務検索条件なし |
| 066 | IT-23 | 検索条件 | E2E自動化 | 051（高額コード空/公開規格の除外＝不存在。要シードfixme） |
| 067 | IT-23 | 実行結果 | E2E自動化 | 031（同一商品コード重複の検出。要シード） |
| 068-074 | IT-23 | 検索条件/実行結果 | 対象外 | 本機能はDB業務検索を行わない |
| 075 | IT-23 | 実行結果 | 手動/間接 | 040/041（登録/更新を直接保存。DB値） |
| 076-078 | IT-23 | 実行結果 | 対象外 | 本機能はDB業務検索を行わない |
| 079 | IT-23 | 実行結果 | E2E自動化 | 021/023/030（CSV不備→ロールバック） |
| 080-082 | IT-23 | 実行結果 | 対象外 | 本機能はDB業務検索を行わない |
| 083 | IT-26 | 登録内容 | E2E自動化 | 040（取込履歴 追加） |
| 084 | IT-26 | 登録内容 | 手動/間接 | 056（失敗時に履歴が増えないことの否定確認。ベースライン要・DB件数） |
| 085 | IT-26 | 登録内容 | E2E自動化 | 040（成功時レコード追加） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 007（件数セッション保存・ページサイズ変化） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 001/002（base_csv_upload 継承＝共通アップロード要素表示） |
| 088 | IT-23 | 登録内容 | 手動/間接 | 048/060（タグ置換の保存・JSファイル名ラベル表示＝DB値/要実機。060と整合） |
| 089 | IT-26 | 登録内容 | E2E自動化 | 004（送信前の確認ダイアログなし） |
| 090 | IT-26 | 登録内容 | 対象外 | 一時ファイル読捨て/削除はサーバ内部・観測外 |

集計（付帯表2と一致）: 自動化 38 ／ 手動・間接 12（009,012,013,014,018,019,041,042,060,075,084,088）／ 対象外 40。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-33-ADMIN | dtb_member（管理者） | 商品CSV管理へ到達できる有効な管理者1（ログインID/PWは config 既定） | fixture(config既定) | 既存利用・撤去不要 | 001-008,010,012,020-027,030,050 |
| SEED-M03-33-HIGH-PRICE | dtb_product_class（高額・非公開規格1）＋ dtb_product | high_price_code を持ち非公開ステータスの規格1件。product_code は一意。既知の price02/buy_price/standard_price/sale_flg。dtb_csv_import_history は取込種別 ID 8 の履歴を参照 | fixture/migration | 専用 product_code。取込後に価格/タグ/履歴を復元する後始末（または使い捨て） | 032,040,044 |
| SEED-M03-33-DUP | dtb_product_class（同一 product_code 規格2件） | 同一 product_code を持つ規格を2件以上。重複エラーを誘発 | fixture/migration | 専用 product_code・削除。breakAll＝非破壊だがデータは隔離 | 031 |
| SEED-M03-33-SALE-ON | dtb_product_class（高額・非公開・sale_flg=ON） | sale_flg=1 の高額・非公開規格1件。standard_price 既知 | fixture/migration | 使い捨て（取込で sale_flg/price02 が変わる）・値復元 | 042 |
| SEED-M03-33-SALE-OFF | dtb_product_class（高額・非公開・sale_flg=OFF/NULL） | sale_flg=0/NULL の高額・非公開規格1件。price02 既知 | fixture/migration | 使い捨て・値復元 | 041,043 |
| SEED-M03-33-PUBLIC | dtb_product_class（規格は存在するが高額コード空 or 公開ステータス） | product_code は実在するが high_price_code が空/NULL、または規格ステータスが公開の規格1件。検索要件を満たさず不存在エラーを誘発 | fixture/migration | 専用 product_code・隔離。breakAll＝非破壊 | 051 |

注: `migration` を選ぶ場合は DB=ec-cube-enterprise 正典（reverse-design 1c）に従う。識別接頭辞 `E2E_` を product_code に付与し撤去可能にする。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

設計源 pf-eccube3 のリバース仕様と刷新先 ec-cube-enterprise 実装の食い違い。テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値は実装へ書き換えない。

| # | 仕様（設計書 m03-33 由来） | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | CSV列は 商品コード/販売価格/買取価格/セールフラグ/帯URL/タグ(ID)/スマレジ連携フラグ の7列で、買取価格を `buy_price`、スマレジを `smaregi_alignment_flg` へ更新する | enterprise の getCsvHeader/getColumns は 商品コード/販売価格/セールフラグ/帯URL/タグ(ID) の5列のみ（Controller.php:180-187, Handler.php:165-173）。updateProductClassForHighPriceSaleCsv は price02/belt_url/sale_flg のみ更新（Handler.php:140-145）。買取価格・スマレジ列なし | **重大乖離。買取価格・スマレジ連携フラグ列が刷新先に存在しない。価格履歴の買取は変更前後同値（Handler.php:155）。設計書(基本設計)を上位オラクルとし、刷新先の列欠落を不具合候補として明示。E2Eは仕様7列/必須5列を期待値とする（HEADER・必須バッジ数5・買取/スマレジ更新）** | 003,023-027,040-046 | 仕様乖離（要設計判断） |
| 2 | ファイル未選択時はキー `admin.common.csv_invalid_format`（「CSVのフォーマットが一致しません」）を表示しリダイレクト | フォームの NotBlank で form 不正となり Controller.php:113-118 のフォームエラー枝（NotBlank 既定文言）でリダイレクトされる。csv_invalid_format(Controller.php:124)は form 妥当かつ file=null の時のみ | 表示文言が NotBlank 既定文言になる可能性。テストは「エラー表示＋リダイレクト」を期待しメッセージはハードコードしない | 020 | 要確認（表示文言） |
| 3 | 販売価格は半角数字のみ・0以上・最大9桁 | 列バリデータ（ColumnDefinitions）。非数値時の確定メッセージ（over_zero か invalid か）はラベル/定義依存 | 非数値時の厳密メッセージは要実機確認。025は列名「販売価格」を含むことのみ期待 | 025,026 | 要確認（列バリデータ文言） |
| 4 | 強制反映チェック等の他フィールドはテンプレートで非表示 | CsvImportType に force_file_to_db/is_split_csv/csv_file_no が定義されるが base_csv_upload.twig は出力しない（form._token と import_file のみ） | 仕様どおり（未出力）。画面操作はファイル入力と CSRF に限る | 001 | 確認済（乖離なし） |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | アップロード画面表示・雛形DL・履歴件数変更・未認証誘導・ナビ導線 | 001,006,007,009,010 | カバー |
| フロント挙動（表示要素） | ファイル入力・アップロードボタン・フォーマット表/必須バッジ・履歴件数プルダウン・タイトル | 001,002,003,005 | カバー |
| フロント挙動（JS） | ファイル名ラベル表示・$.changeLoading・件数プルダウンで location 差替 | 007（プルダウン遷移）/060は手動 | 一部手動（ファイル名ラベルは要実機） |
| フロント挙動（モーダル） | 送信前の確認ダイアログはない | 004 | カバー |
| 処理フロー GET（page_count/page_no セッション） | 許容値保存・許容外は既定/セッション・page_no保存 | 007,008,014 | カバー（page_no直接指定は014） |
| 処理フロー POST 2（フォーム不正→エラー＋リダイレクト） | エラーフラッシュ＋csv_upload へ | 020 | カバー |
| 処理フロー POST 3（import_file=null） | csv_invalid_format＋リダイレクト | 020（NotBlankフォームエラー経路で代表） | 部分カバー（csv_invalid_format分岐の厳密誘発・文言は要実機＝不具合候補#2） |
| 処理フロー POST 4（行数上限5010） | maxrecord＋リダイレクト | 050 | カバー |
| バリデーション（アップロードファイル サイズ上限 eccube_csv_size） | サイズ超過拒否 | 057 | 手動（大容量生成困難・文言framework依存） |
| 処理フロー POST 7,8（info/エラー集約・成功時履歴INSERT） | warning表示・error表示・成功フラッシュ・履歴追記 | 042,043,021,040 | カバー（成功/警告は要シード/破壊的＝fixme） |
| 処理フロー POST 9（常にリダイレクト） | 取込後 csv_upload へ | 012 | カバー |
| 汎用インポータ（ヘッダ必須・データ行必須・列数(仕様7列)・必須・型・桁・選択肢） | 形式不一致・データ不存在・列数(7列基準)・必須(販売024/商品コード033)・数値(販売025/買取029)・桁・選択肢(セール027/スマレジ028) | 021,022,023,024,025,026,027,028,029,033 | カバー（列数基準は仕様7列=023。必須/数値/選択肢を全必須列へ拡張） |
| 汎用インポータ内部1（tsv拡張子＝タブ区切り） | tsvはタブ区切りで読む | 058 | カバー（ヘッダ不一致TSVで形式エラー） |
| 行ターゲット検証1（商品コード重複禁止） | 重複エラー全体中断 | 031 | カバー（要シード・fixme） |
| 行ターゲット検証2（高額・非公開規格の存在必須） | 不存在エラー全体中断 | 030 | カバー |
| 行更新処理（タグ置換・SQL UPDATE・価格履歴） | タグID異常検証(032)・正常タグ置換(048)・帯URL更新(047)・価格/セール/買取/スマレジ更新・価格履歴増減(044/049) | 032,047,048,041,044,045,046,049 | 一部手動/間接・要シード（正常タグ置換048・帯URL047・価格履歴増049を補完。032は異常系） |
| 決定順序1,2（OFF→ON=041 / ON→ON=053 新販売価格=CSV） | 販売価格更新 | 041,053 | 手動/間接（DB値。ON→ON は053で補完） |
| 決定順序3（ON→OFF 基準へ戻し・販売≠0で警告/販売0で警告なし） | alert_off_sale_buy_only 警告(042)・販売0で警告なし(054) | 042,054 | 一部fixme・一部手動/間接（054は警告不在=DB値） |
| 決定順序4（OFF→OFF price02維持・警告） | alert_end_sale_sell_from_standard 警告 | 043 | カバー（要シード・fixme） |
| 集計条件 | 業務集計なし（履歴は固定クエリ） | （該当なし） | 対象外（業務集計なし） |
| データ整合性（一覧一致・履歴・スマレジ） | コミット後参照(040)・変化なしで履歴不変(044)・変化で履歴増(049)・失敗時履歴不変(056) | 040,044,049,056 / スマレジ連携コーディネータの予約完了フックは対象外 | 一部手動/間接（スマレジ予約処理は対象外。046は smaregi_alignment_flg 列値のみで予約完了は範囲外） |
| DBカラム/DB操作 | 規格更新（price02/sale_flg/buy_price/belt_url/smaregi_alignment_flg）・タグ置換・履歴INSERT・価格履歴INSERT | 040,041,044,045,046,047,048,049 | 手動/間接・要シード（belt_url=047・タグ=048・価格履歴=049で補完。買取/スマレジ列は刷新先欠落＝不具合候補#1） |
| 権限・認可 | 未認証はログイン誘導（GET/POST） | 010,013 | カバー（未認証POST取込ガードは013） |
| 画面遷移 | 取込後リダイレクト・履歴件数クエリ付きGET | 012,007 | カバー |
| エラー処理（フォーム/CSRF・ファイル未選択・行数上限・CSV不備・例外） | エラーフラッシュ＋リダイレクト | 011,020,050,021,022,023 / 例外再送出は対象外 | カバー（CSRFは011・例外注入は対象外） |
| 試行制限 | 独自レート制限なし | （該当なし） | 対象外（仕様上なし） |
| ログ・監査（開始/異常終了/完了・秘匿） | 情報ログ・秘匿 | （対象外＝観測外） | 対象外（ログはブラウザ観測外） |
| セッション（page_count/page_no） | 許容値保存・再取得 | 007,008 | カバー |
| Cookie | セッションCookieのみ（共通設定） | （管理共通＝別設計） | 対象外（共通設定） |
| 排他制御・トランザクション | 1取込1トランザクション・行ロック | （DB内部＝観測外。ロールバックは打ち切りで間接） | 対象外/間接（030等で間接） |

未カバーはいずれも理由（業務集計なし・ログ観測外・例外注入不可・スマレジ別処理・DB内部・共通設定）を明記済み。買取価格/スマレジ連携フラグ列の刷新先欠落は付帯表4#1の不具合候補として明示した。

## 付帯表6：正常系/異常系の対応（境界値の正常側）

各バリデーションの異常側（020-032,050）に対する正常側は、いずれも「有効な高額・非公開規格に一致する行を含む取込が成功する」という同一経路に帰着するため、成功系 040（および更新内容 041-046）の入力で正常側境界を満たす形でカバーする。単独の正常値検証ケースを多数作らず 040 系の入力条件として網羅する設計とした（いずれも要シード SEED-M03-33-HIGH-PRICE・破壊的）。

| 異常系ケース | 対応する正常側（040系入力条件） | 区分 |
|--------------|--------------------------------|------|
| 024 必須列空 | 必須5列すべて充足の有効行 | 040（手動/間接・要シード） |
| 025 販売価格非数値 | 販売価格＝半角数字0以上 | 040（要シード） |
| 026 販売価格9桁超 | 販売価格＝9桁以内（境界9桁） | 040（要シード） |
| 027 セールフラグ2 | セールフラグ＝0または1 | 040/041/042/043（要シード） |
| 032 タグID不正 | 既存タグIDのみ／タグ空 | 040（要シード） |
| 023 列数不一致 | 物理列数＝仕様7列に一致 | 040（要シード） |
| 028 スマレジ0/1以外 | スマレジ連携フラグ＝0または1 | 040/053（要シード） |
| 029 買取価格非数値 | 買取価格＝半角数字0以上 | 040/045（要シード） |
| 033 商品コード空 | 商品コードに既存の高額・非公開規格コード | 040（要シード） |
| 051 高額コード空/公開規格→不存在 | 高額コード設定済・非公開の規格 | 040（要シード・fixme） |
| 042/054 ON→OFF（販売≠0警告/販売0警告なし） | 基準価格へ戻し・分岐ごとの警告有無 | 042,054（要シード） |
| 044 不変で履歴増えない | 価格変化で価格履歴+1 | 049（手動/間接・要シード） |
| 047 帯URL更新 / 048 タグ置換 | 正常な帯URL更新・正常タグ置換/空クリア | 047,048（手動/間接・要シード） |
| 056 失敗時履歴不変 | 成功時に取込履歴+1 | 040/055（要シード） |
| 045/046 | 買取価格・スマレジ連携フラグの正常更新 | 045,046（手動/間接・要シード） |

注: 正常側は破壊的（取込成功）かつ要シードのため spec では test.fixme（040,042,043,051）または手動/間接（041,044-049,053-056）として残し、ここで異常系との対を監査可能化する。境界値の正常側（販売価格=9桁・0、スマレジ/セール=0/1）は 040 系入力条件として満たすが、単独の正常値ケースは破壊的経路のため自動化せず本表で対を保証する。
