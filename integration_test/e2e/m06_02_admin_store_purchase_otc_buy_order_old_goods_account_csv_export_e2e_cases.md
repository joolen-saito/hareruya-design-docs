# m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.html`（正本 `functions/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火・HTTP応答ヘッダ・ファイル名などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。本機能は `csv_export` 型のため、CSVの各列値・住所/年齢/電話形式・数量集計・並び順・BOM/エンコードといった**ファイル内容の照合は手動**とする（ダウンロード発火・ファイル名・応答ヘッダのみ自動化）。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

設計源は pf-eccube3（HareruyaEcプラグイン）のリバースだが、刷新先 **ec-cube-enterprise に同一画面（買取一覧 `admin_otcbuyorder` ＋ CSV出力 `admin_otcbuyorder_export`）が実在**するためE2E化した。設計（pf-eccube3）と実装（ec-cube-enterprise）の乖離は付帯表4に出し、テストは仕様どおりに書く。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | 検索結果0件時にCSVダウンロード入口が描画されない（実行できない） |
| IT-27 | 選択なし送信時の出力失敗（エラーフラッシュ＋リダイレクト）・種別不正の出力失敗 |
| IT-15 | 未認証ガード（保護URL→管理ログイン誘導）。CSRF・対象データ・状態変化はブラウザ観測外/CSV内容で手動 |
| IT-20 | ログ出力抑止＝ログファイル検査（手動）・年齢算出＝CSV列値（手動）。ブラウザ観測外だが検証手段あり |
| IT-25 | UI部品（CSVダウンロードドロップダウン/古物台帳リンク/チェックボックス/allCheck）・確認ダイアログ不在・HTTPステータス・URL |
| IT-03 | 画面遷移（ダウンロード応答で画面遷移しない・選択なしでリダイレクト）・外部画面（StreamedResponse） |
| IT-13 | URL直接アクセス（CSV送信成功＝ダウンロード応答／未認証誘導） |
| IT-22 | 必須（選択なし）・JS送信挙動・部分入力（0件）。文字列長/数値/文字種/相関は本機能に非該当 |
| IT-23 | DB抽出結果＝CSV内容（手動/間接）。種別不正の例外応答のみ自動化 |
| IT-26 | 本機能は登録/更新しない（対象外）。種別不正/選択なしの応答のみ自動化、ログ・CSVクォートは観測外/手動 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-001	IT-03	外部画面	P1	検索結果から注文を1件チェックし古物台帳入力用CSVを選ぶとCSVダウンロードが発火する	管理者ログイン済／SEED-M06-02-OTC-ORDERS（買取注文1件以上）	export_type=old_goods_account、otcBuyOrderIds[]＝チェックした1件	"1. 買取一覧（/admin/otcbuyorder）を開き検索して結果を表示する
2. 一覧の任意の行のチェックボックス（otcBuyOrderIds[]）をオンにする
3. 「CSVダウンロード」ドロップダウンを開き「古物台帳入力用CSV」を押下する"	ブラウザのダウンロードが発火すること（HTML画面遷移を伴わない）。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-002	IT-13	URL直接アクセス	P2	ダウンロードファイル名が old_goods_account_<日時>.csv 形式である	管理者ログイン済／SEED-M06-02-OTC-ORDERS	export_type=old_goods_account、otcBuyOrderIds[]＝1件	"1. 検索結果から1件チェックする
2. 「古物台帳入力用CSV」を押下しダウンロードを取得する"	ダウンロードファイル名が接頭辞 old_goods_account_ ＋ 14桁の日時 ＋ 拡張子 .csv であること（例 old_goods_account_20260619123000.csv）。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-003	IT-03	外部画面	P2	エクスポート応答のContent-Typeがoctet-streamである	管理者ログイン済／SEED-M06-02-OTC-ORDERS	export_type=old_goods_account（リンク押下でJS代入）、otcBuyOrderIds[]＝チェックした1件	"1. 検索結果から1件チェックし「古物台帳入力用CSV」を押下する（実UIフォーム送信）
2. /admin/otcbuyorder/export への応答ヘッダを確認する"	Content-Type が application/octet-stream であること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-004	IT-13	URL直接アクセス	P2	エクスポート応答のContent-Dispositionがattachmentでファイル名を含む	管理者ログイン済／SEED-M06-02-OTC-ORDERS	export_type=old_goods_account（リンク押下でJS代入）、otcBuyOrderIds[]＝チェックした1件	"1. 検索結果から1件チェックし「古物台帳入力用CSV」を押下する（実UIフォーム送信）
2. /admin/otcbuyorder/export への応答ヘッダを確認する"	Content-Disposition が attachment; filename=old_goods_account_<日時>.csv であること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-010	IT-25	UI部品	P2	検索結果が1件以上のとき「CSVダウンロード」ドロップダウンと「古物台帳入力用CSV」リンクが表示される	管理者ログイン済／SEED-M06-02-OTC-ORDERS	—	"1. 買取一覧を開き検索して結果（1件以上）を表示する
2. 「CSVダウンロード」ドロップダウンを開く"	「CSVダウンロード」ドロップダウンと配下の「古物台帳入力用CSV」（data-type=old_goods_account）リンクが表示されること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-011	IT-25	UI部品	P3	検索結果の各行にチェックボックスと表頭の全選択チェックが表示される	管理者ログイン済／SEED-M06-02-OTC-ORDERS	—	1. 買取一覧を開き検索して結果を表示する	各行に name=otcBuyOrderIds[] のチェックボックスがあり、表頭に全選択チェック（#allCheck）が表示されること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-012	IT-25	確認ダイアログ	P3	古物台帳入力用CSVの出力前に確認ダイアログがない	管理者ログイン済／SEED-M06-02-OTC-ORDERS	—	"1. 買取一覧を開き検索して結果を表示する
2. 「CSVダウンロード」ドロップダウンを開く"	「古物台帳入力用CSV」は通常のリンク（確認モーダル属性 data-bs-toggle=modal を持たない）で、押下前に確認ダイアログが出ないこと。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-013	IT-25	UI部品	P3	表頭の全選択チェックを押すと全行のチェックが一括でオンになる	管理者ログイン済／SEED-M06-02-OTC-ORDERS（2件以上推奨）	—	"1. 買取一覧を開き検索して結果を表示する
2. 表頭の全選択チェック（#allCheck）をオンにする"	一覧の全行のチェックボックス（otcBuyOrderId 属性を持つ要素）が一括でオンになること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-014	IT-16	実行結果	P2	検索結果が0件のとき「CSVダウンロード」ドロップダウンが表示されない	管理者ログイン済／SEED-M06-02-OTC-EMPTY（該当0件になる検索条件）	該当0件となる検索条件	1. 買取一覧を開き、該当0件となる条件で検索する	「検索条件に該当するデータがありませんでした。」が表示され、「CSVダウンロード」ドロップダウンが描画されないこと（この入口から実行できない）。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-020	IT-27	出力失敗	P1	チェックを1つも付けずに古物台帳入力用CSVを選ぶと選択なしエラーが表示される	管理者ログイン済／SEED-M06-02-OTC-ORDERS	otcBuyOrderIds[]＝なし（未選択）	"1. 買取一覧を開き検索して結果を表示する
2. どの行もチェックせずに「CSVダウンロード」→「古物台帳入力用CSV」を押下する"	選択なしのエラーフラッシュ（仕様: admin.purchase.online.csv_export.no_selection）が表示されること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-021	IT-25	HTTPステータス	P2	選択なし送信は買取一覧の該当ページへリダイレクトされる	管理者ログイン済／SEED-M06-02-OTC-ORDERS	otcBuyOrderIds[]＝なし（未選択）	1. 検索後どの行もチェックせず「古物台帳入力用CSV」を押下する	買取一覧ページ（admin_otcbuyorder_page／ページ番号はセッション値）へHTTPリダイレクトされ、ダウンロードは発火しないこと。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-022	IT-25	URL	P2	export_typeが許可リスト外だとエラー応答になり一覧リダイレクトにならない	管理者ログイン済／SEED-M06-02-OTC-ORDERS	export_type＝不正値（例 invalid）、otcBuyOrderIds[]＝1件、CSRFトークン	"1. 隠し項目 #export_type を許可リスト外の値に書き換える
2. 1件チェックして result_form を送信する"	種別不正の例外によりエラー応答（システムエラー相当・HTTP 500）となり、買取一覧へのアプリ制御リダイレクトにはならないこと。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-023	IT-22	その他のバリデーション	P2	otcBuyOrderIdsに非整数値のみを送ると整数化後に空になり選択なしエラーでリダイレクトされる	管理者ログイン済／SEED-M06-02-OTC-ORDERS	otcBuyOrderIds[]＝非整数のみ（例 abc）、export_type=old_goods_account	"1. 隠しフォーム #result_form に otcBuyOrderIds[]=非整数（整数化で0→array_filterで除去され空になる値）を注入する
2. 「古物台帳入力用CSV」を押下して result_form を送信する"	整数化（intval→array_filter）後に対象が空となり、選択なしエラーフラッシュ（仕様: admin.purchase.online.csv_export.no_selection）付きで買取一覧ページへリダイレクトされ、ダウンロードが発火しないこと（未選択＝空配列とは別経路だが同一の失敗分岐＝処理フロー#4）。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-030	IT-15	未認証	P1	未ログインで買取一覧URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. 未ログインで /admin/otcbuyorder へ直接アクセスする	管理ログイン画面へ誘導されること。				
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	E2E-M06-02-031	IT-15	未認証	P2	未ログインでエクスポートエンドポイントへ送信すると管理ログイン画面へ誘導される	未ログイン	export_type=old_goods_account	1. 未ログインで /admin/otcbuyorder/export へPOST送信する	エクスポート処理に到達せず管理ログイン画面へ誘導されること。				
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは ec-cube-enterprise の Twig 由来（位置情報のみ）。買取一覧テンプレート `src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig`、JS `html/template/admin/assets/js/OtcBuyOrder/otc-buy-order.js`、コントローラ `src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php`、サービス `src/Eccube/Service/Csv/Exporter/OtcBuyOrderCsvExportService.php`、文言 `messages.ja.yaml`。行番号は現行ソース基準。`CSRFトークン名=_token`（Constant.php:41）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠（設計書節/IT-ID） | 元ITケースID |
|----------|---------|----------------------------------------------|----------------------------|--------------|
| E2E-M06-02-001 | E2E自動化(要シード) | チェック input[name="otcBuyOrderIds[]"](index.twig:215) / ドロップダウン `#result_list__custom_csv_menu` トグル `a.dropdown-toggle`「CSVダウンロード」(index.twig:181-182) / `a.export-link[data-type="old_goods_account"]`「古物台帳入力用CSV」(index.twig:184) / JS submit `#result_form`(otc-buy-order.js:82-83 / index.twig:152) | 利用者視点の入口／処理フロー#6-8／画面遷移(成功=DL応答 画面遷移なし) | -017,-024,-034 |
| E2E-M06-02-002 | E2E自動化(要シード) | download.suggestedFilename() | 処理フロー#8（接頭辞 old_goods_account_＋YmdHis＋.csv） | -024 |
| E2E-M06-02-003 | E2E自動化(要シード) | POST /otcbuyorder/export 応答ヘッダ Content-Type（実UIフォーム送信を waitForResponse で観測。OtcBuyOrderController.php:162-169 export） | 処理フロー#8（Content-Type application/octet-stream） | -017,-077,-082 |
| E2E-M06-02-004 | E2E自動化(要シード) | 応答ヘッダ Content-Disposition（実UIフォーム送信の export 応答を waitForResponse で観測。_token 等のForm制約値は手で固定しない） | 処理フロー#8（Content-Disposition attachment; filename=...） | -024 |
| E2E-M06-02-010 | E2E自動化(要シード) | `#result_list__custom_csv_menu`(index.twig:181) / `a.export-link[data-type="old_goods_account"]`(index.twig:184) | フロント挙動(表示要素 totalItemCount>0)／IT-25 UI部品 | -010,-018 |
| E2E-M06-02-011 | E2E自動化(要シード) | input[name="otcBuyOrderIds[]"](index.twig:215) / `#allCheck`(index.twig:200) | フロント挙動(各行チェック・表頭allCheck)／IT-25 UI部品 | -010 |
| E2E-M06-02-012 | E2E自動化(要シード) | `a.export-link[data-type="old_goods_account"]` に data-bs-toggle=modal が無い(index.twig:184) | フロント挙動「出力前の確認ダイアログはない」／IT-25 確認ダイアログ | -013 |
| E2E-M06-02-013 | E2E自動化(要シード) | `#allCheck`(index.twig:200) / `[otcBuyOrderId]`(index.twig:215) / JS(otc-buy-order.js:16-18) | フロント挙動(allCheckで一括オンオフ) | -010 |
| E2E-M06-02-014 | E2E自動化(要シード・0件条件投入は要実機確認) | 「検索条件に該当するデータがありませんでした。」(index.twig:241) / `#result_list__custom_csv_menu` の不在(index.twig:159 totalItemCount>0 条件) | 利用者視点の入口(0件はメニュー描画されない)／フロント挙動／IT-16,IT-22部分入力 | -001,-061 |
| E2E-M06-02-020 | E2E自動化(要シード) | フラッシュ領域（要実機確認） / メッセージキー `admin.purchase.online.csv_export.no_selection`=「1つ以上の買取注文情報を選択してください。」(messages.ja.yaml:5247 / Controller.php:190) | 処理フロー#4／エラー処理(0件)／IT-27 出力失敗 | -002,-027 |
| E2E-M06-02-021 | E2E自動化(要シード) | リダイレクト先URL（admin_otcbuyorder_page Controller.php:192-194） | 画面遷移(空→admin_otcbuyorder_pageリダイレクト)／IT-25 HTTPステータス | -025,-023,-087,-018 |
| E2E-M06-02-022 | 自動化予定/要実機確認(隠し項目改ざん＋エラー画面観測) | `#export_type`(index.twig:154) を改ざん / 例外 throw(Controller.php:177-184) | バリデーション(export_type許可リスト外は例外)／エラー処理／IT-25 URL | -026,-086,-088 |
| E2E-M06-02-023 | 自動化予定/要実機確認(otcBuyOrderIds[]に非整数注入＋リダイレクト観測) | `#result_form`(index.twig:152) に otcBuyOrderIds[]=非整数 を注入 / `array_filter(array_map('intval', ...))` 後の空判定→addError＋redirect(OtcBuyOrderController.php:187-194 / 要実機確認) | バリデーション(otcBuyOrderIds整数化後空→エラー)／処理フロー#4／IT-22 その他のバリデーション | -053 |
| E2E-M06-02-030 | E2E自動化(資格情報不要) | 管理ログイン画面 `#login_id`(login.twig) | 権限・認可(未ログインは管理ログインへ誘導)／IT-15 未認証 | -005 |
| E2E-M06-02-031 | E2E自動化(資格情報不要) | 管理ログイン誘導（リダイレクト/ステータス） | 権限・認可(認証到達制御)／IT-15 未認証 | -005 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が汎用文）であり、機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・フロント挙動・処理フロー・画面遷移・エラー処理）を一次情報源として網羅した。行単位の対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m06_02_..._it_cases.md` の関連ID件数（IT-16=1／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=22／IT-26=7＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は付帯表2b（行単位明細・全90行）が正本。

「自動化予定」は完成した自動化と区別して数える保留行で、3系統ある。(a) 種別不正(export_type許可リスト外)の異常系 E2E-M06-02-022（隠し項目改ざん＋500画面観測が要実機確認・spec `test.fixme`）。(b) otcBuyOrderIds整数化後空の異常系 E2E-M06-02-023（otcBuyOrderIds[]非整数注入が要実機確認・spec `test.fixme`）。(c) 検索結果0件の入口不在 E2E-M06-02-014（0件状態の生成＝SEED-M06-02-OTC-EMPTY の検索条件投入が要実機確認のため、specは0件表示時のみ検証し非0件は `test.skip`）。いずれも観測手段の実機確認待ちで、確定自動化には数えない。

| IT-ID | 母集合 | E2E自動化 | 自動化予定 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 0 | 1 | 0 | 0 | 014は0件状態（SEED-M06-02-OTC-EMPTY の検索条件投入）が要実機確認＝自動化予定 |
| IT-27 | 2 | 2 | 0 | 0 | 0 | |
| IT-15 | 4 | 1 | 0 | 3 | 0 | CSRFは設計（検証なし）と実装（isTokenValid検証あり）が乖離＝付帯表4#1で記録し別途確認＝手動。対象データ・状態変化はCSV内容＝手動 |
| IT-20 | 2 | 0 | 0 | 2 | 0 | ログ出力抑止はログファイル検査＝手動／間接。年齢算出はCSV列値＝手動（いずれもブラウザ観測外だが手段あり） |
| IT-25 | 9 | 3 | 1 | 5 | 0 | 種別不正URL(022)はfixme＝自動化予定。数量0・電話形式・ヘッダのみCSV・一覧との対応はCSV内容＝手動。トランザクション無更新はDB before/after照合＝手動 |
| IT-03 | 7 | 3 | 0 | 3 | 1 | 身分証名・職業名はCSV内容＝手動。副作用無更新はDB before/after照合＝手動。検索抽出（別機能m06_01の一覧検索）は対象外 |
| IT-13 | 1 | 1 | 0 | 0 | 0 | |
| IT-22 | 35 | 2 | 2 | 1 | 30 | 文字列長/数値/文字種/相関は本機能の入力（選択チェック＋種別）に非該当。061(0件入口不在)・053(整数化後空)は要実機確認＝自動化予定。fputcsvクォートはCSV内容＝手動 |
| IT-23 | 22 | 0 | 1 | 21 | 0 | DB抽出結果（CSVに含まれる/含まれない）はCSV内容を開いて照合＝手動/間接。種別不正の例外応答(022)はfixme＝自動化予定 |
| IT-26 | 7 | 1 | 1 | 2 | 3 | 本機能は登録/更新しない（対象外）。種別不正(022)はfixme＝自動化予定。情報ログのファイル名出力はログ検査＝手動。fputcsvクォートはCSV内容＝手動 |
| 合計 | 90 | 13 | 6 | 37 | 34 | **未分類 0** |

注: 対象外34件・手動37件・自動化予定6件はいずれも「本機能で非該当（入力欄なし）」「CSV内容＝手動照合」「DB before/after＝手動照合」「ログファイル検査＝手動」「別機能m06_01（一覧検索）へ委譲」「要実機確認（fixme/0件条件投入）」が理由であり、放置ではない。ログ出力・DB副作用・年齢算出はブラウザ観測外だが手段（ログ/DB/CSV照合）があるため対象外ではなく手動/間接に分類する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。集計は付帯表2と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 自動化予定 | 014（0件でCSVダウンロード入口が描画されない＝実行できない。0件状態の生成＝SEED-M06-02-OTC-EMPTY の検索条件投入が要実機確認のため spec は非0件時 skip） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 020（選択なしエラー） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 020（選択なしの出力失敗）／010(表示要素) |
| 004 | IT-15 | CSRF | 手動/間接 | 設計はCSRF検証なし・実装はisTokenValid()で検証＝仕様乖離（付帯表4#1）。乖離自体は別途手動で確認 |
| 005 | IT-15 | 未認証 | E2E自動化 | 030/031（未認証ガード） |
| 006 | IT-15 | 対象データ | 手動/間接 | 出力対象行（存在するID）はCSV内容＝手動 |
| 007 | IT-20 | 出力抑止 | 手動/間接 | 秘匿情報のログ出力抑止はログファイル検査＝手動（ブラウザ観測外だが検証手段あり） |
| 008 | IT-20 | 識別子 | 手動/間接 | 年齢算出（AGE/EXTRACT(YEAR)）はCSV列値＝手動照合（ブラウザ観測外だが検証手段あり） |
| 009 | IT-15 | 状態変化 | 手動/間接 | 事業者番号列はCSV内容＝手動 |
| 010 | IT-25 | UI部品 | E2E自動化 | 011（otcBuyOrderIds チェックボックス） |
| 011 | IT-25 | UI部品 | 手動/間接 | 明細なし注文の数量0出力はCSV内容＝手動 |
| 012 | IT-25 | 操作起点 | 手動/間接 | 電話番号NULL/空の出力形式はCSV内容＝手動 |
| 013 | IT-25 | 確認ダイアログ | E2E自動化 | 012（出力前の確認ダイアログがない） |
| 014 | IT-25 | 確認ダイアログ | 手動/間接 | 全ID存在しない→ヘッダのみCSVはCSV内容＝手動 |
| 015 | IT-25 | 確認ダイアログ | 手動/間接 | 一覧との対応（DB状態がCSVに反映）はCSV内容＝手動 |
| 016 | IT-25 | 送信可否制御 | 手動/間接 | 参照のみで注文を更新しない＝DB before/after照合＝手動（ブラウザ観測外だが検証手段あり） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 001/003（StreamedResponse＝ダウンロード応答） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 020/021（失敗時＝選択なしフラッシュ＋リダイレクト） |
| 019 | IT-03 | 画面遷移 | 手動/間接 | old_goods_accountで注文レコードを更新しない＝DB before/after照合＝手動（ブラウザ観測外だが検証手段あり） |
| 020 | IT-03 | 画面遷移 | 手動/間接 | mtb_identification 身分証名はCSV内容＝手動 |
| 021 | IT-03 | 画面遷移 | 手動/間接 | mtb_job 職業名はCSV内容＝手動（CSV列「職業」は付帯表4#2） |
| 022 | IT-03 | 画面遷移 | 対象外 | 検索条件抽出は買取一覧検索＝別機能m06_01へ委譲（本機能は選択IDのCSV出力） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 021（otcBuyOrderIds空→エラーリダイレクト） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 001/002/004（CSV送信成功＝ダウンロード応答・画面遷移なし） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 021（admin_otcbuyorder_page へリダイレクト） |
| 026 | IT-25 | URL | 自動化予定 | 022（export_type不正→エラー応答・spec fixme＝要実機確認） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 020（選択なしエラー） |
| 028 | IT-22 | 必須バリデーション | 対象外 | 「export_type未知で処理継続」に該当するバリデーションは本機能に無い |
| 029 | IT-22 | 文字列長バリデーション | 対象外 | 本機能の入力（選択チェック＋種別）に文字列長検証は無い |
| 030 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 031 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 032 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 033 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 034 | IT-22 | 文字列長バリデーション | E2E自動化 | 001（.export-link押下で#export_type代入→#result_form送信＝JS挙動） |
| 035 | IT-22 | 数値バリデーション | 対象外 | 本機能に数値入力欄が無い（otcBuyOrderIdsは選択値） |
| 036 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 037 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 038 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 039 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 040 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 041 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 042 | IT-22 | 数値バリデーション | 対象外 | 同上 |
| 043 | IT-22 | 文字種バリデーション | 対象外 | 本機能に文字入力欄が無い |
| 044 | IT-22 | 文字種バリデーション | 対象外 | 同上 |
| 045 | IT-22 | その他のバリデーション | 対象外 | 本機能に該当する追加バリデーションが無い |
| 046 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 047 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 048 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 049 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 050 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 051 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 052 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 053 | IT-22 | その他のバリデーション | 自動化予定 | 023（otcBuyOrderIds[]に非整数のみ→整数化（intval→array_filter）後空→選択なしエラーでリダイレクト。非整数注入が要実機確認＝spec fixme。未選択＝空配列(021)とは別経路で同一失敗分岐） |
| 054 | IT-22 | 相関バリデーション | 対象外 | 本機能に相関検証が無い |
| 055 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 056 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 057 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 058 | IT-22 | DBとの相関バリデーション | 対象外 | 本機能にDB相関検証が無い（存在しないIDは結果に現れずエラーにしない） |
| 059 | IT-22 | DBとの相関バリデーション | 対象外 | 同上 |
| 060 | IT-22 | 必須制御 | 手動/間接 | fputcsvのクォート（エンクロージャ/エスケープ）はCSV内容＝手動 |
| 061 | IT-22 | 部分入力 | 自動化予定 | 014（0件はドロップダウン不描画＝この入口から実行できない。0件状態の生成が要実機確認のため spec は非0件時 skip） |
| 062 | IT-23 | 検索条件/実行結果 | 手動/間接 | 選択IDのDB抽出結果（CSVに含まれる/含まれない）はCSVを開いて照合＝手動 |
| 063 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 064 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 065 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 066 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 067 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 068 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 069 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 070 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 071 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 072 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 073 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 074 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 075 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 076 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 077 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 078 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 079 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 080 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 081 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 082 | IT-23 | 検索条件/実行結果 | 手動/間接 | 同上 |
| 083 | IT-26 | 登録内容 | 対象外 | 本機能はレコードを追加しない（参照系） |
| 084 | IT-26 | 登録内容 | 対象外 | 本機能は登録しない（追加されないは自明・登録試験対象外） |
| 085 | IT-26 | 登録内容 | 対象外 | 本機能は登録しない |
| 086 | IT-26 | 登録内容 | 自動化予定 | 022（export_type不正→例外エラー応答・spec fixme＝要実機確認） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 020/021（選択なし→一覧該当ページ再表示＋エラーメッセージ） |
| 088 | IT-23 | 登録内容 | 自動化予定 | 022（export_type未知→例外によるエラー応答・spec fixme＝要実機確認） |
| 089 | IT-26 | 登録内容 | 手動/間接 | 情報ログへのファイル名出力はログファイル検査＝手動（ブラウザ観測外だが検証手段あり） |
| 090 | IT-26 | 登録内容 | 手動/間接 | fputcsvのクォートはCSV内容＝手動 |

集計（付帯表2と一致）: 自動化 13（002,003,005,010,013,017,018,023,024,025,027,034,087）／ 自動化予定 6（001・061＝E2E-014／053＝E2E-023／026・086・088＝E2E-022）／ 手動・間接 37（004,006,007,008,009,011,012,014,015,016,019,020,021,060,089,090 ＋ 062-082=21）／ 対象外 34（残り）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M06-02-ADMIN | dtb_member（管理者） | 買取一覧へ到達できる有効な管理者1。ログインID/パスワードは config 既定（`config/default.config.ts` の ECCUBE_ADMIN_USER/PASS） | fixture(config既定) | 既存利用・撤去不要 | 全認証必須ケース |
| SEED-M06-02-OTC-ORDERS | dtb_otc_buy_order（＋detail/individual/各マスタ） | 検索結果に1件以上現れる店頭買取注文。assessment_id・complete_date・total_price 等を持つ。複数行テスト（013）は2件以上 | fixture/migration（現行pf-eccube3からの移行。DB対応は ec-cube-enterprise 正典） | 専用識別接頭辞・撤去可。参照系のみで使い注文を更新しない | 001,002,003,004,010,011,012,013,020,021,022 |
| SEED-M06-02-OTC-EMPTY | （検索条件） | 該当0件となる検索条件（存在しない査定ID等）。レコード投入は不要 | synthetic（UI検索条件） | データ投入なし・常にべき等 | 014 |

注: 本機能は参照系（検索・CSV出力）であり登録/更新/削除を行わない。`migration` を充てる場合は現行(pf-eccube3 HareruyaEc)の店頭買取データを ec-cube-enterprise スキーマへ移すため DB対応は reverse-design 1c（DB=ec-cube-enterprise 正典）に従う。CSVの内容照合（住所・年齢・電話形式・数量集計・並び順）は手動工程で別途検証する。

## 付帯表4：不具合候補（仕様乖離）／要確認

仕様（pf-eccube3 リバース設計）と実装（ec-cube-enterprise）の食い違い。テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 「エクスポート用 result_form にCSRFフィールドはなく、当エンドポイントでもCSRFトークン検証は行わない」（設計: セキュリティ補足(CSRF)） | result_form に隠しCSRFトークン `<input name="_token" value="{{ csrf_token(...) }}">`(index.twig:153)、コントローラ `$this->isTokenValid();`(OtcBuyOrderController.php:173) | ec-cube-enterprise はCSRFトークンを付与・検証する＝設計（pf-eccube3）と乖離。UI経由送信ではフォームにトークンが含まれるためダウンロードは成立する。リニューアル移行で強化された差異として要確認 | E2E-M06-02-001,003 | 不具合候補(仕様乖離) |
| 2 | 設計のCSV列対応表は 査定ID/年月日/代金/数量/氏名/身分証/住所/年齢/電話番号/事業者であるか/事業者番号 を列挙（「職業」列の記載なし）。一方、設計本文の他節（エッジケース・DBカラム）には職業/`mtb_job` の記載がある | CSV_TYPES['old_goods_account']['header'] に `'job' => '職業'`（電話番号と事業者であるかの間）を含む(OtcBuyOrderCsvExportService.php) | 正典内でCSV列対応表と他節（職業/mtb_job）が不整合。実装は職業列を持つため、設計のCSV列表側の網羅漏れの可能性が高い＝要確認。CSV列順・列内容は手動照合 | （CSV内容＝手動） | 要確認(正典内の列定義不整合) |
| 3 | 種別不正は「例外経由のエラー応答（HTTP500とシステムエラー文言）」 | export_type が CSV_TYPES に無いとき `throw new \InvalidArgumentException`(OtcBuyOrderController.php:177-184) | 仕様どおり（500/システムエラー）。UI からは隠し項目改ざんが必要でE2Eは要実機確認 | E2E-M06-02-022 | 要確認(観測手段) |
| 4 | 選択なしは admin_otcbuyorder_page（ページ番号はセッション `eccube.admin.otcbuyorder.search.page_no`） | Controller.php:189-194（セッション値、無ければ1） | 仕様どおり。静的確認済 | E2E-M06-02-021 | 一致(確認済) |
| 5 | 古物台帳CSVは戻しリスト向け追加バリデーションを実行しない | Controller.php:198 で `otc_buy_order_restock_list_csv` のみ追加検証（old_goods_account は対象外） | 仕様どおり。静的確認済 | E2E-M06-02-001 | 一致(確認済) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | 1件以上選択→CSV／0件はメニュー描画なし／未選択→エラーリダイレクト | 001,014,020,021 | 部分カバー(001,020,021は自動化／014は自動化予定＝0件状態の生成が要実機確認) |
| フロント挙動(表示要素) | CSVダウンロードドロップダウン・古物台帳リンク・各行チェック・allCheck・totalItemCount>0条件 | 010,011,013,014 | 部分カバー(010,011,013は自動化／014は自動化予定) |
| フロント挙動(JS挙動) | .export-link で #export_type 代入→#result_form 送信（同一ウィンドウPOST） | 001,034相当 | カバー |
| フロント挙動(モーダル) | 出力前の確認ダイアログはない | 012 | カバー |
| フロント挙動(CSS) | #result_list__custom_csv_menu のインラインスタイル | （表示崩れ＝視覚回帰で別管理） | 対象外(視覚回帰・低価値) |
| 処理フロー(成功) | ストリーム応答・ヘッダ行・ファイル名・octet-stream・attachment | 001,002,003,004 | カバー(内容は手動) |
| 処理フロー#4(選択なし) | no_selection フラッシュ＋admin_otcbuyorder_page リダイレクト | 020,021 | カバー |
| 処理フロー#3(種別不正) | 許可リスト外は例外エラー応答 | 022 | 自動化予定(fixme・要実機確認) |
| 処理フロー#7(一部存在しないID) | 存在するIDのみ行になる | （CSV内容＝手動） | 手動 |
| 処理フロー(全ID不存在) | ヘッダのみCSV・エラーにしない | （CSV内容＝手動） | 手動 |
| 集計条件(数量/並び順/住所/年齢/電話) | 数量合計・assessment_id降順・住所連結・年齢・電話形式 | （CSV内容＝手動） | 手動(ファイル照合) |
| CSV列とデータソース | 各列値・ヘッダラベル・列順（職業列は付帯表4#2） | （CSV内容＝手動） | 手動 |
| バリデーション | otcBuyOrderIds空→エラーリダイレクト・整数化後空→エラーリダイレクト・export_type許可リスト | 020,021,022,023 | 部分カバー(020,021は自動化／022(種別不正)・023(整数化後空)は自動化予定/fixme＝要実機確認) |
| 権限・認可 | 未ログインは管理ログイン誘導／ログイン済みは到達で実行 | 030,031,001 | カバー |
| 画面遷移 | 成功=DL応答(画面遷移なし)／空=リダイレクト／種別不正=エラー応答 | 001,021,022 | 部分カバー(001,021は自動化／022は自動化予定/fixme) |
| エラー処理 | 0件フラッシュ・整数化後空フラッシュ・種別不正例外 | 020,022,023 | 部分カバー(020は自動化／022,023は自動化予定/fixme) |
| DB操作 | 参照のみ（更新/削除なし。old_goods_account はエクスポート前に店舗権限/ステータスの追加チェックもしない＝設計バリデーション節）。抽出結果はCSV内容 | 001（成功応答＝追加チェックなしを間接確認・付帯表4#5）／無更新はDB before/after照合＝手動 | 部分カバー(001で間接)/手動(DB照合) |
| 試行制限 | 本機能では扱わない | （該当なし） | 対象外(機能なし) |
| ログ・監査 | 情報ログへファイル名出力・秘匿情報の出力抑止 | （観測外） | 対象外(ブラウザ観測外) |
| セッション | 選択なし時のリダイレクト先ページ番号をセッション(eccube.admin.otcbuyorder.search.page_no)から読む（無ければ1） | 021(一覧ルートURLのみ確認) | 保留(要確認: 021は買取一覧ルートへの遷移のみ確認し、セッション値あり/なしによるページ番号分岐は未検証＝過大主張を是正) |
| Cookie | 本機能単体で新規Cookieを設定しない | （該当なし） | 対象外(機能なし) |
| セキュリティ補足(CSRF) | 設計はCSRF検証なし／実装は検証あり | （付帯表4#1で乖離記録） | 要確認(乖離) |
| 文字コード・区切り(BOM/カンマ) | UTF-8 BOM・カンマ区切り | （CSV内容＝手動） | 手動 |

未カバーはいずれも理由（CSV内容＝ファイル手動照合・DB内部値・ログ観測外・機能なし・視覚回帰・別機能m06_01委譲）を明記済み。設計書の各節を歩き、ブラウザで観測可能な挙動はすべてE2Eケースへ写像した。
