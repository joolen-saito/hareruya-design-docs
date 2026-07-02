# m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m06-10_admin_store_purchase_purchase_store_return_list_csv_export.html`（正本 `functions/ec-cube-enterprise/m06-10_admin_store_purchase_purchase_store_return_list_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m06_10_admin_store_purchase_purchase_store_return_list_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・ダウンロード発火・HTTP応答ヘッダ・ファイル名・別画面での間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。CSV各列の値・帳票内容は手動確認とする。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

本機能は「店頭買取管理 > 買取一覧（`admin_otcbuyorder` = `/admin/otcbuyorder`）」のCSVダウンロードメニュー内「戻しリストCSV」（`data-type="otc_buy_order_restock_list_csv"`）から、チェック選択した買取（`otcBuyOrderIds[]`）を `admin_otcbuyorder_export`（POST `/admin/otcbuyorder/export`）へ送信して StreamedResponse でCSV出力する **bulk＋csv_export** 機能である。自動化は「ダウンロード発火・ファイル名・応答ヘッダ・CSVヘッダ8列構成・UI部品（メニュー/リンク表示・選択）・各エラー分岐のフラッシュ＆CSV非出力・CSRF拒否（無効トークンでCSV非出力）・未認証ガード」に限る。CSV本文の各値（SJIS変換・ピッキング区分閾値・色/レアリティ抽出・サプライ品表示＝対象データ依存）と棚戻し済みフラグ更新（DB内部）は手動/間接。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | CSVダウンロード発火（実行結果。内容一致は手動） |
| IT-27 | 出力失敗（選択なし・対象なし・状態/権限/複数店舗の各エラーでCSV非出力） |
| IT-25 | UI部品（CSVダウンロードメニュー・戻しリストCSVリンク・チェックボックス）・HTTPステータス・操作起点 |
| IT-03 | 画面遷移（一覧表示・検索結果表示・エラー時の一覧リダイレクト） |
| IT-15 | 未認証ガード・CSRF・対象データ（権限）・状態変化（棚戻し済み更新=間接） |
| IT-13 | URL直接アクセス（未ログイン誘導） |
| IT-22 | 必須制御（選択必須）・相関（状態/複数店舗）・DBとの相関（対象なし）・入力値検証（export_type許容外）。数値/文字種/文字列長は本機能の入力に非該当 |
| IT-23 | 検索条件・実行結果（選択IDのCSV内包＝内容で観測＝手動/間接） |
| IT-26 | 更新内容（棚戻し済みフラグ更新＝DB内部＝手動/間接） |
| IT-20 | 出力抑止・識別子（ログ＝ブラウザ観測外＝対象外） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-001	IT-25	操作起点	P1	買取一覧（戻しリストCSV出力の起点）画面が表示される	管理者ログイン済／SEED-M06-10-ADMIN	—	"1. /admin/otcbuyorder を開く"	店頭買取の買取一覧画面（検索フォーム）が表示されること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-002	IT-03	画面遷移	P2	検索実行で買取一覧に検索結果セクションが表示される	管理者ログイン済／SEED-M06-10-OTC（対象データあり）	検索条件＝空（全件）	"1. 買取一覧を開く
2. 検索ボタンを押下"	買取一覧画面に留まり、検索結果の一覧セクションが表示されること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-003	IT-25	UI部品	P2	検索結果があるとCSVダウンロードメニューに「戻しリストCSV」が表示される	管理者ログイン済／SEED-M06-10-OTC（対象データあり）	—	"1. 買取一覧で検索を実行する
2. CSVダウンロードメニューを開く"	メニュー内に「戻しリストCSV」項目が表示されること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-010	IT-16	実行結果	P1	対象を選択し戻しリストCSVを実行するとダウンロードが発火する	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE（棚入れ待ち/棚入れ完了・単一店舗）	対象買取を1件選択	"1. 買取一覧で検索を実行する
2. 対象買取のチェックボックスを選択
3. CSVダウンロードメニューから「戻しリストCSV」を実行"	CSVダウンロードが発火すること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-011	IT-16	実行結果	P2	ダウンロードファイル名が otc_buy_order_restock_list_csv_<日時>.csv 形式である	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE	対象買取を1件選択	"1. 戻しリストCSVを実行する
2. ダウンロードファイル名を確認する"	ファイル名が「otc_buy_order_restock_list_csv_<14桁日時>.csv」形式であること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-012	IT-25	HTTPステータス	P2	エクスポート応答が添付ファイル（octet-stream/attachment）のHTTPヘッダを返す	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE	export_type=otc_buy_order_restock_list_csv、対象ID1件、有効CSRFトークン	"1. 認証済みコンテキストで /admin/otcbuyorder/export へPOSTする"	HTTP 200・Content-Type application/octet-stream・Content-Disposition attachment（filename=otc_buy_order_restock_list_csv_...）を返すこと。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-013	IT-16	実行結果	P2	ダウンロードCSVのヘッダが戻しリスト8列構成である	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE	対象買取を1件選択	"1. 戻しリストCSVを出力する
2. ダウンロード本文をSJIS→UTF-8変換し1行目(ヘッダ)を確認する"	ヘッダがExcel原典の8列（ピッキング区分／棚番号／言語・状態／略称／色R／数／商品名／基準価格）であること。各セル値・閾値・色R抽出は手動(E2E-M06-10-040)。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-040	IT-23	実行結果	P2	出力CSV各値（閾値・色R抽出・サプライ品表示）が原典どおりである	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE（区分閾値・色レアリティ・サプライ品を含む対象）	対象買取を選択	"1. 戻しリストCSVを出力する
2. CSVをExcel等で開く
3. ピッキング区分(閾値判定)・色R(色レアリティ抽出)・サプライ品表示・各列の値を原典と突合する"	Excel原典 戻しリストCSV定義どおり、ピッキング区分が閾値で分類され、色Rが正しく抽出され、サプライ品が規定表示で、8列の各値が一致すること（CSV本文＝手動確認）。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-020	IT-22	必須制御	P1	1件も選択せず実行すると選択必須エラーが表示されCSVが出力されない	管理者ログイン済／SEED-M06-10-ADMIN	export_type=otc_buy_order_restock_list_csv、otcBuyOrderIds=空、有効CSRFトークン	"1. 何も選択せず戻しリストCSVを送信する"	CSV（octet-stream添付）は出力されず、選択必須エラー（1つ以上の買取注文情報を選択してください。）が表示され買取一覧へ戻ること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-021	IT-22	DBとの相関バリデーション	P2	存在しないIDで実行すると対象なしエラーが表示されCSVが出力されない	管理者ログイン済／SEED-M06-10-ADMIN	export_type=otc_buy_order_restock_list_csv、存在しないotcBuyOrderId、有効CSRFトークン	"1. 存在しない買取IDを指定して戻しリストCSVを送信する"	CSV（octet-stream添付）は出力されず、対象なしのエラーが表示され買取一覧へ戻ること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-022	IT-22	相関バリデーション	P2	対象外ステータスの買取を選択するとエラーが表示されCSVが出力されない	管理者ログイン済／SEED-M06-10-OTC-INELIGIBLE-STATUS（棚入れ待ち/完了以外のステータス）	対象外ステータスの買取を選択	"1. 対象外ステータスの買取を選択して戻しリストCSVを実行する"	CSV（octet-stream添付）は出力されず、対象外ステータスのエラーが表示され買取一覧へ戻ること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-023	IT-22	相関バリデーション	P2	複数店舗の買取を同時選択するとエラーが表示されCSVが出力されない	管理者ログイン済／SEED-M06-10-OTC-MULTISHOP（2店舗以上の対象買取）	異なる店舗の買取を複数選択	"1. 異なる店舗の買取を複数選択して戻しリストCSVを実行する"	CSV（octet-stream添付）は出力されず、複数店舗同時処理不可のエラーが表示され買取一覧へ戻ること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-024	IT-15	対象データ	P2	権限のない店舗の買取を選択するとエラーが表示されCSVが出力されない	権限が限定された管理者でログイン済／SEED-M06-10-OTC-NOPERM（編集権限外店舗の買取）	編集権限外店舗の買取を選択	"1. 編集権限外店舗の買取を選択して戻しリストCSVを実行する"	CSV（octet-stream添付）は出力されず、権限のない店舗のエラーが表示され買取一覧へ戻ること。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-025	IT-15	CSRF	P2	無効/欠落CSRFトークンで送信すると拒否されCSVが出力されない	管理者ログイン済／SEED-M06-10-ADMIN	export_type=otc_buy_order_restock_list_csv、対象ID、無効な_token	"1. 無効なCSRFトークンを付与して /admin/otcbuyorder/export へPOSTする"	CSV（octet-stream添付）は出力されないこと（CSRF保護により副作用ありPOSTが拒否される）。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-026	IT-22	その他のバリデーション	P2	許容外のexport_typeで送信するとCSVが出力されない	管理者ログイン済／SEED-M06-10-ADMIN	export_type=許容外の値、対象ID、有効CSRFトークン	"1. 許容外のexport_type（戻しリストCSV以外でも定義集合に無い値）を指定して /admin/otcbuyorder/export へPOSTする"	CSV（octet-stream添付）は出力されないこと（出力種別が許容値でない不正入力は対象を確定しない）。許容値・例外文言は照合しない（オラクル独立性）。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-030	IT-15	未認証	P1	未ログインで買取一覧/エクスポートURLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /admin/otcbuyorder へGETアクセスする
2. 未ログインで /admin/otcbuyorder/export へPOSTする"	いずれも管理ログイン画面へ誘導され、CSVが出力されないこと。
m06-10_admin_store_purchase_purchase_store_return_list_csv_export（店頭買取管理_戻しリストCSV出力）	E2E-M06-10-031	IT-26	更新内容	P2	CSV出力成功後に対象買取が棚戻し済みになる（間接）	管理者ログイン済／SEED-M06-10-OTC-ELIGIBLE	対象買取を1件選択	"1. 戻しリストCSVを出力する
2. 当該買取の棚戻し状態を再検索/詳細で確認する"	出力完了後に当該買取が棚戻し済みとして扱われること（DB内部値のため間接確認＝手動）。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは Twig 由来の位置情報のみ。買取一覧 `src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig`、CSV出力サービス `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php`、戻しリスト検証 `src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderRestockListService.php`、コントローラ `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php`、JS `html/template/admin/assets/js/OtcBuyOrder/otc-buy-order.js`（行番号は ec-cube-enterprise 現行ソース `nl -ba` 基準。以下の付帯表ではファイル名のみで参照）。検索フォーム block prefix 由来の DOM id は要実機確認。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M06-10-001 | E2E自動化 | 買取一覧 route admin_otcbuyorder=GET/POST /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）/ 検索フォーム #search_form（index.twig:35）/ サブタイトル admin.purchase.store.list=「買取一覧」（index.twig:7 / messages.ja.yaml:5172） | 利用者視点の入口・開始条件（設計md 開始条件） |
| E2E-M06-10-002 | E2E自動化(要データ) | 検索ボタン #search_form .searchBtn（index.twig:145 trans admin.purchase.store.form.search.button）/ 結果セクション #result_list（index.twig:156）/ 0件見出し「検索条件に該当するデータがありませんでした。」（index.twig:241） | プロセスフロー#2-3（検索条件受付・対象取得） |
| E2E-M06-10-003 | E2E自動化(要データ) | CSVダウンロードメニュー #result_list__custom_csv_menu .dropdown-toggle（index.twig:181-182「CSVダウンロード」）/ 戻しリストCSVリンク .export-link[data-type="otc_buy_order_restock_list_csv"]（index.twig:186「戻しリストCSV」） | フロント挙動（出力UI部品。設計md 入出力仕様=CSV出力） |
| E2E-M06-10-010 | E2E自動化(要SEED-OTC-ELIGIBLE) | 行チェックボックス input[name="otcBuyOrderIds[]"]（index.twig:215）/ #export_type（index.twig:154）/ #result_form action admin_otcbuyorder_export（index.twig:152）。クリックでexport_type設定＆result_form submit（otc-buy-order.js:81-83） | プロセスフロー#4-5（出力主処理→CSVレスポンス）・対象機能の要点「棚戻し業務用のCSV出力」 |
| E2E-M06-10-011 | E2E自動化(要SEED-OTC-ELIGIBLE) | （ダウンロードファイル名） | 出力ファイル名は exportType_<YmdHis>.csv（OtcBuyOrderCsvExportService.php:122-123）＝出力物の識別。値の照合は仕様「CSV出力」由来で形式のみ |
| E2E-M06-10-012 | E2E自動化(要SEED-OTC-ELIGIBLE) | エクスポートPOST route admin_otcbuyorder_export=POST /<route>/otcbuyorder/export（OtcBuyOrderController.php:162-168）/ 応答ヘッダ（OtcBuyOrderCsvExportService.php:124-128 octet-stream / attachment） | 入出力仕様（CSVダウンロード）・HTTP応答 |
| E2E-M06-10-013 | E2E自動化(要SEED-OTC-ELIGIBLE) | （ダウンロード本文ヘッダ行） | Excel原典 戻しリストCSV 8列定義（ピッキング区分/棚番号/言語・状態/略称/色R/数/商品名/基準価格）。ヘッダ列構成は出力物から観測可能 |
| E2E-M06-10-040 | 手動(要SEED-OTC-ELIGIBLE・CSVを開いて確認) | （CSV本文セル値） | Excel原典 戻しリストCSV定義（ピッキング区分閾値・色R抽出・サプライ品表示・各列値）。値・閾値・抽出ロジックは対象データ依存＝手動 |
| E2E-M06-10-026 | E2E自動化 | #export_type（index.twig:154）に許容外値を入れて #result_form を直接POST / 応答が octet-stream/attachment でない | バリデーション・入力値検証（リクエスト本文 export_type）。出力種別が許容集合に無い不正入力は対象を確定せずCSV非出力（Controller.php:176-184 CSV_TYPES 不一致）。期待は「不正入力＝CSV非出力」を正とし、許容値集合・例外文言・HTTPステータスは照合しない（オラクル独立性） |
| E2E-M06-10-025 | E2E自動化 | #result_form の input[name="_token"]（無効値を付与してPOST）/ 応答が octet-stream/attachment でない | 権限・認可（CSRF保護）。無効/欠落トークンの副作用ありPOSTは拒否（Symfony Form CSRF）。期待は「拒否＝CSV非出力」を正とし、拒否理由の文言・Cookie名・実装定数は照合しない（オラクル独立性） |
| E2E-M06-10-020 | E2E自動化 | #result_form の input[name="_token"]（id無し・name のみ。index.twig:153 Constant::TOKEN_NAME=_token）/ #export_type / .alert-danger（フラッシュ。alert.twig） | 例外処理「入力不備＝エラーとして処理し対象を確定しない」＋選択必須（Controller.php:189-194 no_selection / messages.ja.yaml:5247） |
| E2E-M06-10-021 | E2E自動化 | 同上（CSRFトークン＋export_type＋存在しないID）/ .alert-danger | 例外処理「対象なし＝エラーレスポンス」（OtcBuyOrderRestockListService.php:96-98 対象なし→Controller.php:203-210 redirect） |
| E2E-M06-10-022 | 要実機確認/fixme(要SEED-INELIGIBLE-STATUS) | 行チェックボックス（index.twig:215）/ .alert-danger | 例外処理「状態不整合＝処理対象外/エラー」（OtcBuyOrderRestockListService.php:118-127 対象外ステータス） |
| E2E-M06-10-023 | 要実機確認/fixme(要SEED-MULTISHOP) | 行チェックボックス（index.twig:215）/ #allCheck（index.twig:200）/ .alert-danger | 例外処理「入力不備＝エラー」（OtcBuyOrderRestockListService.php:130-133 複数店舗） |
| E2E-M06-10-024 | 手動(要SEED-NOPERM・権限限定アカウント) | 行チェックボックス（index.twig:215）/ .alert-danger | 例外処理・権限（OtcBuyOrderRestockListService.php:110-116 店舗編集権限）。共通設計の権限判定 |
| E2E-M06-10-030 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id（login.twig） | 利用者視点の入口・権限（開始条件＝ログイン済みの利用者） |
| E2E-M06-10-031 | 手動/間接(要SEED-OTC-ELIGIBLE・DB確認) | （DB dtb_otc_buy_order 棚戻し済みフラグ） | 状態・データ更新（markOtcBuyOrdersAsRestocked OtcBuyOrderCsvExportService.php:118-120 出力完了後フラグ更新）。DB内部値＝間接 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が汎用文）であり、機能固有シナリオを持たない。本E2Eは設計md（入出力仕様・プロセスフロー・例外処理・状態/データ更新）とExcel原典（戻しリストCSV 8列）を一次情報源として網羅した。エラー文言のうち locale 非登録のもの（「対象のデータが見つかりません。」「ID:%d は対象外のステータスです。」「複数店舗の…」「ID:%d は権限のない店舗のデータです。」）は実装ハードコード（付帯表4）であり、期待値は設計md 例外処理由来の「エラー表示＋CSV非出力」を正とし、文言一致では判定しない（オラクル独立性）。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m06_10_..._it_cases.md` の関連ID件数（IT-16=1／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=22／IT-26=7＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は付帯表2bが正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 1 | 0 | 0 | ダウンロード発火は観測可（CSV内容一致は手動だが行は発火に割当） |
| IT-27 | 2 | 1 | 1 | 0 | 出力失敗(エラー＋非出力)は自動化、出力内容一致は手動 |
| IT-15 | 4 | 2 | 2 | 0 | 未認証ガード(030)/CSRF拒否(025=無効トークンでCSV非出力)は自動化、対象データ権限(024=権限限定アカウント要)・状態変化(031=棚戻し済み=DB内部)は手動/間接 |
| IT-20 | 2 | 0 | 1 | 1 | 出力抑止＝ブラウザ観測外（対象外）。識別子（出力完了ログ）はアプリログ＝ログファイルの手動確認に割当 |
| IT-25 | 9 | 5 | 0 | 4 | UI部品/操作起点/HTTPステータス/URLは自動化、確認ダイアログ(3)・送信可否制御(1)は本機能で不使用 |
| IT-03 | 7 | 7 | 0 | 0 | 一覧表示・検索結果表示・エラー時リダイレクトはすべて観測可 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス(未ログイン誘導) |
| IT-22 | 35 | 10 | 0 | 25 | 選択必須/状態/複数店舗/対象なし/export_type許容外は自動化。数値/文字種/文字列長/部分入力は本機能の入力(チェック選択+export_type)に非該当 |
| IT-23 | 22 | 0 | 22 | 0 | 検索フィルタ結果・選択IDのCSV内包は内容/シード依存＝手動・間接 |
| IT-26 | 7 | 0 | 7 | 0 | 棚戻し済みフラグ更新＝DB内部値で間接確認 |
| 合計 | 90 | 27 | 33 | 30 | **未分類 0** |

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | E2E自動化 | 010（ダウンロード発火） |
| 002 | IT-27 | 実行結果 | 手動/間接 | CSV内容一致は実ファイルを開いて手動確認 |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 020/021（エラー＋CSV非出力） |
| 004 | IT-15 | CSRF | E2E自動化 | 025（無効/欠落トークンの副作用ありPOSTは拒否されCSV非出力＝HTTP応答で観測可） |
| 005 | IT-15 | 未認証 | E2E自動化 | 030（未ログイン誘導） |
| 006 | IT-15 | 対象データ | 手動 | 024（権限のない店舗データはエラー＝権限限定アカウントSEED-NOPERM要・手動） |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 手動/間接 | 出力完了ログ（店頭買取CSV出力完了・ファイル名）はアプリログ＝ブラウザ観測外だがログファイルで手動確認可（OtcBuyOrderCsvExportService.php log_info） |
| 009 | IT-15 | 状態変化 | 手動/間接 | 031（棚戻し済みフラグ更新＝DB内部） |
| 010 | IT-25 | UI部品 | E2E自動化 | 003（戻しリストCSVリンク表示） |
| 011 | IT-25 | UI部品 | E2E自動化 | 001（買取一覧の検索フォーム表示） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 003/010（CSVメニュー起点・実行） |
| 013 | IT-25 | 確認ダイアログ | 対象外 | 戻しリストCSVは確認ダイアログを使わない（CSV系は即submit otc-buy-order.js:81-83） |
| 014 | IT-25 | 確認ダイアログ | 対象外 | 同上（モーダル/確認ダイアログ不使用） |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 同上 |
| 016 | IT-25 | 送信可否制御 | 対象外 | 戻しリストCSVリンクは常時活性（CSV系のクライアント側選択ガードなし） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 001（買取一覧画面） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 002（検索結果表示） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 020（エラー時 買取一覧へリダイレクト） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 021（対象なしエラー時 一覧へ） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 022（対象外ステータス時 一覧へ） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 023（複数店舗時 一覧へ） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 030（未ログイン→ログイン画面） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 030（未ログインで一覧/エクスポートURL→ログイン） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 012（200・octet-stream） |
| 026 | IT-25 | URL | E2E自動化 | 012（admin_otcbuyorder_export 応答） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 020（選択なし＝エラー） |
| 028 | IT-22 | 必須バリデーション | E2E自動化 | 010（選択あり＝出力継続） |
| 029-034 | IT-22 | 文字列長バリデーション | 対象外 | 本機能の出力リクエストに文字列長対象の自由入力項目がない（選択+export_type のみ） |
| 035-042 | IT-22 | 数値バリデーション | 対象外 | 同上（数値入力項目なし。idは整数だが利用者入力でない） |
| 043,044 | IT-22 | 文字種バリデーション | 対象外 | 文字種対象の自由入力項目がない |
| 045 | IT-22 | その他のバリデーション | E2E自動化 | 026（export_type が許容集合外＝不正入力でCSV非出力。リクエスト本文の出力種別を許容値で検証） |
| 046-053 | IT-22 | その他のバリデーション | 対象外 | 出力リクエストに該当する細目なし（export_type以外に検証対象の自由入力なし） |
| 054 | IT-22 | 相関バリデーション | E2E自動化 | 022（対象外ステータス相関） |
| 055 | IT-22 | 相関バリデーション | E2E自動化 | 010（適合状態＝継続） |
| 056 | IT-22 | 相関バリデーション | E2E自動化 | 023（複数店舗相関エラー） |
| 057 | IT-22 | 相関バリデーション | E2E自動化 | 024（店舗権限相関エラー） |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 010（DB上の対象＝継続） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 021（DBに対象なし＝エラー） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 020（選択必須制御） |
| 061 | IT-22 | 部分入力 | 対象外 | チェック選択に部分入力観点は非該当 |
| 062-077 | IT-23 | 検索条件 | 手動/間接 | 検索フィルタ結果・対象抽出はシード依存。選択IDのCSV内包はCSV内容＝手動（16行） |
| 078-082 | IT-23 | 実行結果 | 手動/間接 | 検索/出力実行結果はシード依存・CSV内容＝手動（5行） |
| 083 | IT-26 | 更新内容 | 手動/間接 | 031（棚戻し済みフラグ＝値変更・DB内部） |
| 084 | IT-26 | 更新内容 | 手動/間接 | エラー時はフラグ変更されない＝DB内部で間接 |
| 085 | IT-26 | 更新内容 | 手動/間接 | 同上（出力完了でのみ更新） |
| 086 | IT-26 | 更新内容 | 手動/間接 | 同上（開始条件＝ログイン済み利用者の操作） |
| 087 | IT-26 | 更新内容 | 手動/間接 | 同上（終了条件＝出力完了） |
| 088 | IT-23 | 更新内容 | 手動/間接 | dtb_otc_buy_order系の参照/更新＝DB内部で間接（1行） |
| 089 | IT-26 | 更新内容 | 手動/間接 | 履歴・ログ作成＝DB内部で間接 |
| 090 | IT-26 | 更新内容 | 手動/間接 | 対象テーブル(dtb_otc_buy_order等)＝DB内部で間接 |

集計（付帯表2と一致）: 自動化 27（001,003,004,005,010,011,012,017,018,019,020,021,022,023,024,025,026,027,028,045,054,055,056,057,058,059,060）／ 手動・間接 33（002,006,008,009,062-077=16,078-082=5,083-090=8）／ 対象外 30（007,013,014,015,016,029-044=16,046-053=8,061）。**未分類 0**。

注（IT行番号と観点行の対応）: 上記「自動化 27」の各行番号は観点母集合の行番号。026 はE2Eケース番号でIT行045（IT-22 その他のバリデーション）に対応する。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M06-10-ADMIN | dtb_member(管理者) | 店頭買取管理にアクセスできる管理者1。ログインID/PWは config 既定 | fixture(config既定) | 既存利用・撤去不要 | 001,020,021,025,030 |
| SEED-M06-10-OTC | dtb_otc_buy_order 系 | 検索結果として一覧に出る店頭買取が1件以上（店舗・ステータス不問） | fixture/migration | 専用接頭辞・撤去。参照系 | 002,003 |
| SEED-M06-10-OTC-ELIGIBLE | dtb_otc_buy_order, dtb_otc_buy_order_stock | 棚入れ待ち/棚入れ完了ステータス・**単一店舗**・操作管理者の編集権限内。CSV出力で棚戻し済みになるため使い捨て | fixture/migration | 使い捨て（出力でフラグ更新）。テスト毎に再投入 | 010,011,012,013,031,040 |
| SEED-M06-10-OTC-INELIGIBLE-STATUS | dtb_otc_buy_order | 棚入れ待ち/棚入れ完了以外のステータスの買取1件 | fixture/migration | 専用接頭辞・撤去 | 022 |
| SEED-M06-10-OTC-MULTISHOP | dtb_otc_buy_order×2店舗 | 異なる店舗の対象買取を各1件以上 | fixture/migration | 専用接頭辞・撤去 | 023 |
| SEED-M06-10-OTC-NOPERM | dtb_member(権限限定)＋dtb_otc_buy_order | 操作管理者の編集権限外店舗の買取1件＋権限限定管理者 | fixture/migration | 専用アカウント・撤去 | 024 |

注: ステータスは MtbOtcBuyOrderStatus::STATUS_STOCKING_PENDING / STATUS_STOCKING_COMPLETE が対象（OtcBuyOrderRestockListService.php:119-122）。`migration` 時はDB=ec-cube-enterprise正典。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用。CSV本文・棚戻し済みフラグはDB/ファイル確認のため手動。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（設計md 例外処理）どおり「エラー表示＋CSV非出力」で書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 例外処理: 対象なし/状態不整合/権限/複数店舗はエラーとし出力を確定しない | OtcBuyOrderRestockListService.php:96-133（各エラー文言はハードコード。locale未登録） | エラー文言が messages.ja.yaml に無く実装直書き。期待は「エラー表示＋CSV非出力」を正とし文言一致では判定しない。文言の保守性は要確認 | 021,022,023,024 | 要確認(文言ハードコード) |
| 2 | 選択なしはエラー | Controller.php:189-194（admin.purchase.online.csv_export.no_selection / messages.ja.yaml:5247） | locale登録済。文言は静的確認済 | 020 | 確認済 |
| 3 | 選択必須は「選択なし＝エラー＋CSV非出力」で担保（設計md 例外処理。UI側ガードの有無は設計書に規定なし） | otc-buy-order.js:23-28（PDFのみ未選択alert）, :81-83（CSV系は無条件 submit） | 実装観察（仕様乖離ではない）: CSV系は未選択でもsubmitしサーバ側 no_selection で弾く（020で検出）。PDF系のみクライアント側alertがある点はUX差として要確認。テスト期待は設計md由来の「選択必須エラー＋CSV非出力」のみ（実装挙動に寄せない） | 020 | 要確認(UX差・非乖離) |
| 4 | 出力ファイル名 | OtcBuyOrderCsvExportService.php:122-123（exportType_<YmdHis>.csv） | 実在確認済。日時は動的のため形式（otc_buy_order_restock_list_csv_<14桁>.csv）で照合 | 011 | 確認済 |
| 5 | 棚戻し済み更新は出力成功時のみ（途中失敗で更新しない） | OtcBuyOrderCsvExportService.php:116-120（StreamedResponse callback内で更新） | DB内部値のためブラウザ観測不能。間接確認（再検索/詳細）または手動 | 031 | 要確認(DB間接) |
| 6 | 無効な export_type は不正リクエスト（出力種別が許容値でない不正入力＝対象を確定しない） | Controller.php:177-184（CSV_TYPES 不一致で InvalidArgumentException） | 利用者UIからは固定値のみ送られるが、直接POST改ざんで到達可能。期待は設計md 入力値検証由来の「不正入力＝CSV非出力」を正とし、例外文言・HTTPステータス(500系)・許容値集合は照合しない（オラクル独立性） | 026 | E2E自動化(直接POST) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（買取一覧→CSVメニュー） | 一覧画面表示・CSVダウンロードメニュー・戻しリストCSVリンク | 001,003 | カバー |
| 開始条件（ログイン済み利用者） | 未ログインはログイン画面へ誘導 | 030 | カバー |
| 入出力仕様（入力=画面操作/出力=CSVダウンロード） | 選択→ダウンロード発火・octet-stream/attachment・ファイル名 | 010,011,012 | カバー |
| プロセスフロー#1-2（開始・入力受付） | 検索実行→結果表示・選択 | 002,003 | カバー |
| プロセスフロー#3（対象取得＋検証・権限・状態適用） | 対象なし/状態/権限/複数店舗の各検証 | 021,022,023,024 | カバー(一部fixme/手動) |
| プロセスフロー#4-5（出力主処理→CSV応答・失敗時エラー） | 成功=ダウンロード、失敗=エラー＋一覧リダイレクト | 010,020,021 | カバー |
| 例外処理(入力不備) | 選択なし＝選択必須エラー | 020 | カバー |
| バリデーション(入力値=export_type) | 許容外の出力種別＝不正入力でCSV非出力 | 026 | カバー(自動=非出力。許容値・例外文言は非照合) |
| 例外処理(対象なし) | 存在しないID＝対象なしエラー | 021 | カバー |
| 例外処理(状態不整合) | 棚入れ待ち/完了以外＝対象外ステータスエラー | 022 | カバー(fixme/要SEED) |
| 例外処理(権限) | 編集権限外店舗＝権限エラー | 024 | カバー(手動/要SEED) |
| 例外処理(複数店舗) | 異なる店舗同時選択＝複数店舗エラー | 023 | カバー(fixme/要SEED) |
| 状態・データ更新(棚戻し済みフラグ) | 出力成功で棚戻し済みに更新 | 031 | 手動/間接(DB内部) |
| 状態・データ更新(履歴・ログ) | CSV取込/在庫/ステータス履歴・ログ | （対象外＝DB内部・ログ観測外） | 対象外/間接(理由付き) |
| CSV列定義(Excel原典 8列: ピッキング区分/棚番号/言語・状態/略称/色R/数/商品名/基準価格) | ヘッダ列構成（出力物から観測可）／各値・閾値・色レアリティ抽出・サプライ品表示（対象データ依存） | 013（ヘッダ8列=自動・要SEED）／040（各値=手動） | カバー(ヘッダ=自動／各値=手動) |
| 権限・認可 | 未認証ガード・店舗編集権限 | 030,024 | カバー(権限は手動/要SEED) |
| CSRF | POST _token 検証（無効/欠落トークンは副作用ありPOSTを拒否） | 025 | カバー(自動＝拒否でCSV非出力。副作用[棚戻し済みフラグ]非更新は DB内部＝031の対偶で間接) |
| ログ・監査 | 出力完了ログ・出力抑止 | （対象外＝観測外） | 対象外(理由付き) |
| HTTP応答 | 200・octet-stream・attachment | 012 | カバー |

未カバーはいずれも理由（DB内部値・CSV本文＝手動、ログ＝観測外、CSRF＝フレームワーク内部、無効export_type＝UI到達不可）を明記済み。各エラー分岐（選択なし/対象なし/状態/権限/複数店舗）を行単位に分解し、正常系(010-012)と対にした。
