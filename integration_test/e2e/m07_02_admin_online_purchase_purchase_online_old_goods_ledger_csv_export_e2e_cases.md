# m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.html`（正本 `functions/pf-eccube3/m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火・HTTP応答ヘッダ・ファイル名・クライアントalert・エラーフラッシュなどブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。本機能は `csv_export` 型のため、CSVの各列値（日付・受注番号・氏名・住所・年齢・職業・身分証・点数・金額・利用回数・前回利用日）・集計・並び順・BOM/エンコードといった**ファイル内容の照合は手動**とする（ダウンロード発火・ファイル名・応答ヘッダのみ自動化）。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

設計源は pf-eccube3（HareruyaEcプラグイン）のリバースだが、刷新先 **ec-cube-enterprise に同一画面（買取一覧 `admin_purchase_list` ＋ 買取詳細 `admin_purchase_edit` ＋ CSV出力 `admin_purchase_csv_export`）が実在**するためE2E化した。設計（pf-eccube3）と実装（ec-cube-enterprise）の乖離は付帯表4に出し、テストは仕様どおりに書く。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | 一覧で1件以上選択→古物台帳入力用CSVのダウンロード発火（実行結果） |
| IT-27 | 詳細からの1件CSV出力（実行結果）・選択なし/全件不存在の出力失敗（フラッシュ＋一覧リダイレクト） |
| IT-15 | 未認証ガード（保護URL／エクスポートエンドポイント→管理ログイン誘導）。CSRF・対象データ・状態変化はブラウザ観測外/CSV内容で手動 |
| IT-20 | ログ出力抑止・識別子＝ブラウザ観測外（対象外） |
| IT-25 | UI部品（ダウンロードドロップダウン/#csvexport/チェックボックス/#allCheck/詳細#export_csv）・確認ダイアログ不在・送信可否制御（未選択alert）・URL（ファイル名） |
| IT-03 | 画面遷移（ダウンロード応答で画面遷移しない・#allCheck一括）・外部画面（StreamedResponse・詳細CSV） |
| IT-13 | URL直接アクセス（エクスポートエンドポイントの応答ヘッダ＝attachment） |
| IT-22 | 必須（選択なし）・数値正規化境界（buyOrderIds[]=0→intval/array_filterで除去→no_selection＝023）・JS送信挙動（#allCheck）・部分入力（存在/不存在混在＝024手動）。文字列長/文字種/相関は本機能の入力（選択チェックのみ）に非該当 |
| IT-23 | DB抽出結果＝CSV内容（手動/間接）。本機能はDB検索条件を持たず選択IDで出力 |
| IT-26 | 本機能は登録/更新しない（対象外）。選択なし/全件不存在の応答のみ自動化、ログ・CSV内容は観測外/手動 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-001	IT-16	実行結果	P1	買取一覧で1件チェックし古物台帳入力用CSVを押すとCSVダウンロードが発火する	管理者ログイン済／SEED-M07-02-BUY-ORDERS（買取注文1件以上）	buyOrderIds[]＝チェックした1件	"1. 買取一覧（/admin/purchase/list）を開き検索して結果を表示する
2. 任意の行のチェックボックス（buyOrderIds[]）をオンにする
3. 「ダウンロード」ドロップダウンを開き「古物台帳入力用CSV」（#csvexport）を押下する"	ブラウザのダウンロードが発火すること（HTML画面遷移を伴わない）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-002	IT-25	URL	P2	ダウンロードファイル名が purchase_<最小IDの7桁ゼロ埋め>_<日時>.csv 形式である	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds[]＝1件	"1. 一覧で1件チェックする
2. 「古物台帳入力用CSV」を押下しダウンロードを取得する"	ダウンロードファイル名が接頭辞 purchase_ ＋ 送信IDの最小値を7桁ゼロ埋めした番号 ＋ _ ＋ 14桁の日時 ＋ 拡張子 .csv であること（例 purchase_0000123_20260619123000.csv）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-003	IT-03	外部画面	P2	エクスポート応答のContent-Typeがoctet-streamである	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds[]＝1件	"1. 一覧で1件チェックし「古物台帳入力用CSV」を押下する（実UIフォーム送信）
2. /admin/purchase/csv_export への応答ヘッダを確認する"	Content-Type が application/octet-stream であること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-004	IT-13	URL直接アクセス	P2	エクスポート応答のContent-Dispositionがattachmentでファイル名を含む	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds[]＝1件	"1. 一覧で1件チェックし「古物台帳入力用CSV」を押下する（実UIフォーム送信）
2. /admin/purchase/csv_export への応答ヘッダを確認する"	Content-Disposition が attachment; filename=purchase_<最小ID7桁>_<日時>.csv であること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-005	IT-27	実行結果	P1	買取詳細で古物台帳入力用CSV出力を押すと1件分のCSVダウンロードが発火する	管理者ログイン済／SEED-M07-02-BUY-ORDERS（任意の買取注文1件）	隠し buyOrderIds[]＝当該買取注文ID	"1. 任意の買取注文の詳細（/admin/purchase/{id}/edit）を開く
2. 「古物台帳入力用CSV出力」（#export_csv）を押下する"	当該買取IDが隠しフィールドで送信され、ブラウザのダウンロードが発火すること（選択チェックの対象外で常に送信）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-010	IT-25	UI部品	P2	検索結果が1件以上のとき「ダウンロード」ドロップダウンと「古物台帳入力用CSV」が表示される	管理者ログイン済／SEED-M07-02-BUY-ORDERS	—	"1. 買取一覧を開き検索して結果（1件以上）を表示する
2. 「ダウンロード」ドロップダウンを開く"	「ダウンロード」ドロップダウンと配下の「古物台帳入力用CSV」（#csvexport）が表示されること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-011	IT-25	UI部品	P3	検索結果の各行にチェックボックスと表頭の全選択チェックが表示される	管理者ログイン済／SEED-M07-02-BUY-ORDERS	—	"1. 買取一覧を開き検索して結果を表示する"	各行に name=buyOrderIds[]（class=searched_buy_order_id）のチェックボックスがあり、表頭に全選択チェック（#allCheck）が表示されること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-012	IT-25	確認ダイアログ	P3	古物台帳入力用CSVの出力前にサーバ確認ダイアログ（モーダル）がない	管理者ログイン済／SEED-M07-02-BUY-ORDERS	—	"1. 買取一覧を開き検索して結果を表示する
2. 「ダウンロード」ドロップダウンを開く"	「古物台帳入力用CSV」は確認モーダル属性（data-bs-toggle=modal）を持たない通常のsubmitであること（出力前の確認モーダルがない。未選択時のみクライアントalertで案内）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-013	IT-03	画面遷移	P2	表頭の全選択チェックを押すと全行のチェックが一括でオンになる	管理者ログイン済／SEED-M07-02-BUY-ORDERS（2件以上推奨）	—	"1. 買取一覧を開き検索して結果を表示する
2. 表頭の全選択チェック（#allCheck）をオンにする"	同フォーム内の buyOrderId 属性付きチェックボックスが一括でオンになること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-014	IT-03	外部画面	P2	買取詳細に古物台帳入力用CSV出力ボタンと隠しbuyOrderIdsが存在する	管理者ログイン済／SEED-M07-02-BUY-ORDERS	—	"1. 任意の買取注文の詳細（/admin/purchase/{id}/edit）を開く"	「古物台帳入力用CSV出力」ボタン（#export_csv）と隠し入力（#buyOrderIds、name=buyOrderIds[]、value=当該ID）が存在すること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-020	IT-25	送信可否制御	P1	一覧でチェックを1つも付けずに古物台帳入力用CSVを押すとクライアントalertで中断されダウンロードしない	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds[]＝なし（未選択）	"1. 買取一覧を開き検索して結果を表示する
2. どの行もチェックせず「ダウンロード」→「古物台帳入力用CSV」（#csvexport）を押下する"	クライアントのalertで選択を促し、ダウンロードが開始されないこと（一覧に留まる）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-021	IT-27	出力失敗	P1	buyOrderIdsが空でエクスポートに到達すると選択なしエラーで一覧へ戻る	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds＝空（クライアントJSを介さずエンドポイント送信）	"1. /admin/purchase/csv_export へ buyOrderIds を含めずPOST送信する"	選択なしのエラーフラッシュ（仕様: admin.purchase.online.csv_export.no_selection）が表示され、買取一覧ページへリダイレクトされること（ダウンロードは発火しない）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-022	IT-27	出力失敗	P2	指定IDがすべてDB不存在のとき存在しないIDエラーで一覧へ戻る	管理者ログイン済	buyOrderIds[]＝存在しない買取注文ID（例 99999999）のみ	"1. /admin/purchase/csv_export へ存在しないIDのみを含めてPOST送信する"	存在しないIDのエラーフラッシュ（仕様: admin.purchase.online.csv_export.not_registered_buy_order_id）が表示され、買取一覧ページへリダイレクトされること（ダウンロードは発火しない）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-023	IT-22	数値バリデーション	P2	buyOrderIdsが0のみ（正規化で除去され空）でエクスポート到達すると選択なしエラーで一覧へ戻る	管理者ログイン済	buyOrderIds[]＝0 のみ（クライアントJSを介さずエンドポイント送信）	"1. /admin/purchase/csv_export へ buyOrderIds[]=0 のみを含めてPOST送信する"	0はintval後にarray_filterで除去され配列が空になるため、選択なしのエラーフラッシュ（仕様: admin.purchase.online.csv_export.no_selection／処理フロー#3-#4）が表示され、買取一覧ページへリダイレクトされること（ダウンロードは発火しない）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-024	IT-22	部分入力	P2	存在IDと不存在IDを混在送信すると存在分のみCSV出力され依頼ID本数と行数が一致しない（CSV内容＝手動照合）	管理者ログイン済／SEED-M07-02-BUY-ORDERS（存在する買取注文1件以上）	buyOrderIds[]＝存在する買取注文ID ＋ 存在しないID（例 99999999）の混在	"1. 一覧で存在する1件を選択し、存在しないIDを buyOrderIds[] に加えてエクスポート送信する（または同一内容を直接POST）
2. ダウンロードされたCSVのデータ行数を確認する"	ダウンロードが発火し（octet-stream／attachment）、CSVのデータ行は存在する買取注文の分のみで、依頼したID本数とは一致しないこと（処理フロー#7・エッジケース「一部のIDだけ存在」由来。少なくとも1件存在するため not_registered には至らない。行数・各列値の照合はCSVを開いて手動）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-025	IT-25	送信可否制御	P3	古物台帳入力用CSV押下直後の約500msは送信ボタンの多重押下が抑止される（要実機確認）	管理者ログイン済／SEED-M07-02-BUY-ORDERS	buyOrderIds[]＝1件	"1. 一覧で1件選択し「古物台帳入力用CSV」を素早く連続で押下する
2. 送信ボタン（[type=submit]）のpointer-eventsが一時的に無効化されるか確認する"	クリック直後の約500ms間は [type=submit] の pointer-events が空にされ多重押下が抑止されること（フロント挙動「JS挙動」由来。タイミング依存のため手動/要実機確認）。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-030	IT-15	未認証	P1	未ログインで買取一覧URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /admin/purchase/list へ直接アクセスする"	管理ログイン画面へ誘導されること。
m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力）	E2E-M07-02-031	IT-15	未認証	P2	未ログインでエクスポートエンドポイントへ送信すると処理に到達せず管理ログインへ誘導される	未ログイン	buyOrderIds[]＝1件	"1. 未ログインで /admin/purchase/csv_export へPOST送信する"	CSV応答（octet-stream）にならず管理ログイン画面へ誘導されること。
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは ec-cube-enterprise の Twig/JS 由来（位置情報のみ）。一覧テンプレート `src/Eccube/Resource/template/admin/Purchase/index.twig`、詳細テンプレート `src/Eccube/Resource/template/admin/Purchase/detail.twig`、JS `html/template/admin/assets/js/Purchase/purchase.js`、コントローラ `src/Eccube/Controller/Admin/Purchase/PurchaseController.php`、サービス `src/Eccube/Service/Csv/Exporter/BuyOrderCsvExportService.php`、フラッシュ描画 `src/Eccube/Resource/template/admin/alert.twig`、文言 `messages.ja.yaml`。行番号は現行ソース基準。**エクスポートルート export() はCSRFトークン検証を行わない**（PurchaseController.php:536-559、付帯表4#3）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠（設計書節/IT-ID） | 元ITケースID |
|----------|---------|----------------------------------------------|----------------------------|--------------|
| E2E-M07-02-001 | E2E自動化(要シード) | チェック input.searched_buy_order_id(name=buyOrderIds[] index.twig:231) / ドロップダウン #result_list__custom_csv_menu トグル button.dropdown-toggle「ダウンロード」(index.twig:166-169 / admin.common.download) / #csvexport「古物台帳入力用CSV」(index.twig:171 formaction admin_purchase_csv_export / messages.ja.yaml:5250) / form #bulk_csv_export(index.twig:162) | 利用者視点の入口／処理フロー#3-12／画面遷移(成功=DL応答 画面遷移なし) | -001,-011,-016,-061,-086 |
| E2E-M07-02-002 | E2E自動化(要シード) | download.suggestedFilename() | 処理フロー#11（接頭辞 purchase_＋最小IDの7桁ゼロ埋め＋_＋YmdHis＋.csv BuyOrderCsvExportService.php:101-102） | -026 |
| E2E-M07-02-003 | E2E自動化(要シード) | POST /purchase/csv_export 応答ヘッダ Content-Type（実UIフォーム送信を waitForResponse で観測。PurchaseController.php:535-559） | 処理フロー#12（Content-Type application/octet-stream Service.php:104-107） | -011,-026 |
| E2E-M07-02-004 | E2E自動化(要シード) | 応答ヘッダ Content-Disposition（実UIフォーム送信の export 応答を waitForResponse で観測） | 処理フロー#12（Content-Disposition attachment; filename=... Service.php:105-107） | -024 |
| E2E-M07-02-005 | E2E自動化(要シード) | 一覧→詳細リンク td[id^=result_list_main__purchase_number--] a[href$=/edit](admin_purchase_edit index.twig:234) / 詳細 #export_csv(detail.twig:313 formaction admin_purchase_csv_export / admin.purchase.online.detail.btn.csvexport=messages.ja.yaml:5253) / 隠し #buyOrderIds(name=buyOrderIds[] detail.twig:315) | 利用者視点の入口(詳細)／フロント挙動(詳細は選択チェック対象外で常時送信) | -002,-017 |
| E2E-M07-02-010 | E2E自動化(要シード) | #result_list__custom_csv_menu(index.twig:166) / #csvexport(index.twig:171) | フロント挙動(表示要素 totalItemCount>0 index.twig:161)／IT-25 UI部品 | -018 |
| E2E-M07-02-011 | E2E自動化(要シード) | input.searched_buy_order_id(index.twig:231) / #allCheck(index.twig:212) | フロント挙動(各行チェック・表頭allCheck)／IT-25 UI部品 | -018 |
| E2E-M07-02-012 | E2E自動化(要シード) | #csvexport に data-bs-toggle=modal が無い(index.twig:171) | フロント挙動「出力前の確認ダイアログはない（alertのみ）」／IT-03 モーダル・ポップアップ(021) | -021 |
| E2E-M07-02-013 | E2E自動化(要シード) | #allCheck(index.twig:212) / input[type=checkbox][buyOrderId](index.twig:231) / JS(purchase.js:2-5) | フロント挙動(allCheckで同フォーム内を一括オンオフ)／IT-03 JS挙動(019) | -019,-034,-064,-079 |
| E2E-M07-02-014 | E2E自動化(要シード) | 一覧→詳細リンク a[href$=/edit](index.twig:234) / 詳細 #export_csv(detail.twig:313) / #buyOrderIds(name=buyOrderIds[]・value=当該ID detail.twig:315) | フロント挙動(詳細の表示要素・隠しfieldは当該買取ID) ／IT-03 外部画面(017) | -017 |
| E2E-M07-02-020 | E2E自動化(要シード・dialogハンドラ) | #csvexport(index.twig:171) / JS 選択0件でalert＋return false(purchase.js:13-19 「CSV出力する買取注文情報をひとつ以上選択してください。」) | フロント挙動(JS:未選択はalertで中断・DL開始しない)／IT-25 送信可否制御(016) | -016,-027 |
| E2E-M07-02-021 | E2E自動化(直接POST・要シード) | フラッシュ .alert-danger(alert.twig:42 eccube.admin.danger) / メッセージキー admin.purchase.online.csv_export.no_selection=「1つ以上の買取注文情報を選択してください。」(messages.ja.yaml:5247 / Controller.php:545-549) | 処理フロー#4／エラー処理(buyOrderIds空)／IT-27 出力失敗(003) | -003,-012,-027,-087 |
| E2E-M07-02-022 | E2E自動化(直接POST) | フラッシュ .alert-danger(alert.twig:42) / not_registered_buy_order_id=「存在しない買取注文情報IDが含まれています。」(messages.ja.yaml:5248 / Service.php:73 throw＋Controller.php:553-557 catch) | 処理フロー#6／エラー処理(全件不存在)／IT-27 出力失敗 | -003,-012 |
| E2E-M07-02-023 | E2E自動化(直接POST) | フラッシュ .alert-danger(alert.twig:42) / no_selection(messages.ja.yaml:5247) / buyOrderIds[]=0送信→array_filter(array_map('intval'))で除去(Controller.php:542-543) → ===[]判定(Controller.php:545-549) | 処理フロー#3-#4（intval/array_filterで0除去→空→no_selection） | -035 |
| E2E-M07-02-024 | 手動/間接(CSV内容照合) | DL発火＝octet-stream/attachment(Service.php:101-107)は自動化可だがデータ行数照合はCSVを開く＝手動 | 処理フロー#7・エッジケース「一部のIDだけ存在」（findBy一意・存在分のみ Service.php） | -010,-025,-058,-061 |
| E2E-M07-02-025 | 手動/要実機確認 | [type=submit] の pointer-events 一時無効化(purchase.js:21-22 setTimeout→css pointer-events"") | フロント挙動「JS挙動：クリック後約500msは[type=submit]のpointer-eventsを空にして多重押下抑止」 | （設計書のみ・IT母集合に対応行なし） |
| E2E-M07-02-030 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig) | 権限・認可(未ログインは管理ログインへ誘導)／IT-15 未認証(005) | -005 |
| E2E-M07-02-031 | E2E自動化(資格情報不要) | 管理ログイン誘導（応答Content-Type/最終URL） | 権限・認可(認証到達制御)／IT-15 未認証(005) | -005 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が汎用文）であり、機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・フロント挙動・処理フロー・画面遷移・エラー処理）を一次情報源として網羅した。行単位の対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m07_02_..._it_cases.md` の関連ID件数（IT-16=1／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=22／IT-26=7＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は付帯表2b（行単位明細・全90行）が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 1 | 0 | 0 | |
| IT-27 | 2 | 2 | 0 | 0 | |
| IT-15 | 4 | 1 | 3 | 0 | CSRFは付帯表4#3の仕様乖離（export()に検証なし）＝手動/要確認（負例として監査可能）。対象データ・状態変化はCSV内容＝手動 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子はブラウザ観測外 |
| IT-25 | 9 | 4 | 3 | 2 | 数量0出力・電話形式・一覧との対応はCSV内容＝手動。トランザクション/ロック無更新はDB観測外＝対象外 |
| IT-03 | 7 | 5 | 1 | 1 | 利用回数はCSV内容＝手動。CSSドロップダウン表示崩れは視覚回帰＝対象外 |
| IT-13 | 1 | 1 | 0 | 0 | |
| IT-22 | 35 | 5 | 3 | 27 | buyOrderIds正規化境界(0除去→no_selection=023)・全件不存在(=022)を自動化、存在/不存在混在(=024)は手動。文字列長/文字種/相関は選択チェックのみの入力に非該当＝対象外。fputcsvクォート・利用回数集計はCSV内容＝手動 |
| IT-23 | 22 | 0 | 21 | 1 | 選択IDのDB抽出結果（CSVに含まれる/含まれない）はCSVを開いて照合＝手動/間接。無更新の境界は対象外 |
| IT-26 | 7 | 2 | 1 | 4 | 本機能は登録/更新しない（対象外）。選択なし/全件不存在の応答は自動化。ログ出力は観測外、fputcsvはCSV内容＝手動 |
| 合計 | 90 | 21 | 32 | 37 | **未分類 0** |

注: 対象外37件・手動32件はいずれも「ブラウザで観測不能」「本機能で非該当」「CSV内容＝手動照合」「DB内部値」「視覚回帰」「ログ観測外」「セキュリティ乖離の手動/要確認(付帯表4#3)」が理由であり、放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。集計は付帯表2と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | E2E自動化 | 001（一覧1件選択→DL発火） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 005（詳細#export_csv→1件DL発火） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 021/022（選択なし・全件不存在の出力失敗フラッシュ） |
| 004 | IT-15 | CSRF | 手動/間接 | 付帯表4#3の仕様乖離（export()はCSRFトークンを検証しない／一覧フォームはhidden付与）。直POST成立＝負例として手動/要確認で監査（ブラウザ自動観測は困難・セキュリティ確認） |
| 005 | IT-15 | 未認証 | E2E自動化 | 030/031（未認証ガード） |
| 006 | IT-15 | 対象データ | 手動/間接 | 出力対象行（存在するID）はCSV内容＝手動 |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子（ファイル名情報ログ）はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 前回利用日列の算出はCSV内容＝手動 |
| 010 | IT-25 | UI部品 | 手動/間接 | 一部IDのみ存在→存在分だけ出力はCSV内容＝手動 |
| 011 | IT-25 | UI部品 | E2E自動化 | 001（エクスポート成功＝ブラウザDL処理） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 021（ID未選択/不存在→フラッシュ＋リダイレクト） |
| 013 | IT-25 | 確認ダイアログ | 対象外 | トランザクション境界（無更新）はDB観測外 |
| 014 | IT-25 | 確認ダイアログ | 対象外 | ロック未使用はDB観測外 |
| 015 | IT-25 | 確認ダイアログ | 手動/間接 | 例外時の未送信出力は手動（部分書き込みの不完全性確認） |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 020（未選択でalert中断・DL開始しない） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 005/014（詳細CSV出力＝StreamedResponse） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 010/011（表示要素＝ドロップダウン/#csvexport/チェックボックス/#allCheck） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 013（#allCheckで一括オンオフ） |
| 020 | IT-03 | 画面遷移 | 対象外 | ドロップダウン暫定スタイルはCSS視覚回帰＝別管理 |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 012（出力前の確認ダイアログがない） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 001（buyOrderIds[]が整数配列で送信されDL） |
| 023 | IT-03 | 画面遷移 | 手動/間接 | 利用回数集計はCSV内容＝手動 |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 004（エクスポートエンドポイントの応答＝attachment） |
| 025 | IT-25 | HTTPステータス | 手動/間接 | 一部IDのみ存在→存在分だけ出力はCSV内容＝手動 |
| 026 | IT-25 | URL | E2E自動化 | 002/003（ファイル名・octet-stream） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 020/021（選択なし→alert/フラッシュ） |
| 028 | IT-22 | 必須バリデーション | 対象外 | 「未入力でも継続」に該当する任意項目が本機能に無い |
| 029 | IT-22 | 文字列長バリデーション | 対象外 | 本機能の入力（選択チェックのみ）に文字列長検証は無い |
| 030 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 031 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 032 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 033 | IT-22 | 文字列長バリデーション | 対象外 | 同上 |
| 034 | IT-22 | 文字列長バリデーション | E2E自動化 | 013（#allCheckで同フォーム内を一括オンオフ＝JS挙動） |
| 035 | IT-22 | 数値バリデーション | E2E自動化 | 023（buyOrderIds[]=0のみ→intval/array_filterで除去→no_selection＝数値正規化の境界） |
| 036 | IT-22 | 数値バリデーション | 対象外 | buyOrderIdsは選択値。0除去境界は023、有効ID残存の成功は001、全件不存在は022で別途検証。桁/最大最小型の数値範囲検証欄は本機能に無い |
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
| 053 | IT-22 | その他のバリデーション | 手動/間接 | 利用回数集計はCSV内容＝手動 |
| 054 | IT-22 | 相関バリデーション | 対象外 | 本機能に相関検証が無い |
| 055 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 056 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 057 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 058 | IT-22 | DBとの相関バリデーション | 手動/間接 | 024（存在/不存在混在→存在分のみ出力・依頼本数と行数不一致。行数照合はCSV手動） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 022（全件不存在→not_registered＝DB存在相関の異常分岐） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 020（選択0件は送信不可＝alert中断） |
| 061 | IT-22 | 部分入力 | 手動/間接 | 一部IDのみ存在→存在分だけ出力はCSV内容＝手動 |
| 062 | IT-23 | 検索条件 | 手動/間接 | 選択IDのDB抽出結果（CSVに含まれる/含まれない）はCSVを開いて照合＝手動 |
| 063 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 064 | IT-23 | 検索条件 | 手動/間接 | 同上（JS#allCheck表示は013で別途カバー） |
| 065 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 066 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 067 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 068 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 069 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 070 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 071 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 072 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 073 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 074 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 075 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 076 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 077 | IT-23 | 検索条件 | 手動/間接 | 同上 |
| 078 | IT-23 | 実行結果 | 手動/間接 | 同上 |
| 079 | IT-23 | 実行結果 | 手動/間接 | 同上（JS#allCheck表示は013で別途カバー） |
| 080 | IT-23 | 実行結果 | 手動/間接 | 同上 |
| 081 | IT-23 | 実行結果 | 手動/間接 | 同上 |
| 082 | IT-23 | 実行結果 | 手動/間接 | 同上 |
| 083 | IT-26 | 登録内容 | 対象外 | 本機能はレコードを追加しない（参照系・DB更新なし） |
| 084 | IT-26 | 登録内容 | 対象外 | 本機能は登録しない（追加されないは自明・登録試験対象外） |
| 085 | IT-26 | 登録内容 | 対象外 | 本機能は登録しない |
| 086 | IT-26 | 登録内容 | E2E自動化 | 001（エクスポート成功＝ブラウザDL処理） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 021（ID未選択→フラッシュ＋一覧リダイレクト） |
| 088 | IT-23 | 登録内容 | 対象外 | 明示トランザクションを開始しない（無更新）＝DB観測外 |
| 089 | IT-26 | 登録内容 | 対象外 | ロック未使用はDB観測外 |
| 090 | IT-26 | 登録内容 | 手動/間接 | 例外時の未送信出力（部分書き込みの不完全性）は手動 |

集計（付帯表2と一致）: 自動化 21（001,002,003,005,011,012,016,017,018,019,021,022,024,026,027,034,035,059,060,086,087）／ 手動・間接 32（004,006,009,010,015,023,025,053,058,061,090 ＋ 062-082=21）／ 対象外 37（残り）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M07-02-ADMIN | dtb_member（管理者） | 買取一覧・詳細へ到達できる有効な管理者1。ログインID/パスワードは config 既定（`config/default.config.ts` の ECCUBE_ADMIN_USER/PASS） | fixture(config既定) | 既存利用・撤去不要 | 全認証必須ケース |
| SEED-M07-02-BUY-ORDERS | dtb_buy_order（＋dtb_buy_main_card / dtb_buy_order_indivisual_input_product / 会員・プレイヤー・本人確認・職業/身分証マスタ） | 検索結果に1件以上現れるネット買取注文。order_date・total_price・会員（生年月日/住所/職業/身分証）等を持つ。#allCheckテスト（013）と最小ID検証（002）は2件以上 | fixture/migration（現行pf-eccube3 HareruyaEcからの移行。DB対応は ec-cube-enterprise 正典） | 専用識別接頭辞・撤去可。参照系のみで使い注文を更新しない | 001,002,003,004,005,010,011,012,013,014,020,021 |

注: 本機能は参照系（選択IDのCSV出力）であり登録/更新/削除を行わない。022（全件不存在）と030/031（未認証）は買取注文レコードに依存しない（022は存在しないID固定値、030/031は資格情報不要）。`migration` を充てる場合は現行(pf-eccube3 HareruyaEc)の買取データを ec-cube-enterprise スキーマへ移すため DB対応は reverse-design 1c（DB=ec-cube-enterprise 正典）に従う。CSVの内容照合（各列値・点数/利用回数/前回利用日の集計・住所連結・年齢・並び順・BOM/エンコード）は手動工程で別途検証する。

## 付帯表4：不具合候補（仕様乖離）／要確認

仕様（pf-eccube3 リバース設計）と実装（ec-cube-enterprise）の食い違い。テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 一覧の未選択CSV押下は「クライアントalertで選択を促し、ダウンロードは開始されない」 | purchase.js:13-19（#csvexport等で `.searched_buy_order_id:checked`==0 なら alert「CSV出力する買取注文情報をひとつ以上選択してください。」＋return false） | 仕様どおり（client alert中断）。alert文言はJSハードコードでありi18n外＝オラクル化しない。主オラクルは「DLが発火しない」 | E2E-M07-02-020 | 一致(確認済) |
| 2 | サーバの選択なしエラーは admin.purchase.online.csv_export.no_selection、全件不存在は not_registered_buy_order_id | Controller.php:545-549(no_selection)／Service.php:73 throw＋Controller.php:553-557 catch(not_registered) | 仕様どおり。ただし一覧UIはJSが空送信を中断するため、サーバ no_selection 到達には JS非経由のエンドポイント送信が必要（021） | E2E-M07-02-021,022 | 要確認(到達経路) |
| 3 | （設計に明記なし／pf-eccube3 入口） | export() はCSRFトークン検証を行わない（PurchaseController.php:535-559 に isTokenValid 呼び出しなし）。一覧フォームには CSRFトークン hidden が存在(index.twig:163) | 一覧フォームはトークンを付与するがエクスポート処理は検証しない＝フォーム付与とサーバ検証の不整合。エンドポイント直POST（021/022）が成立する根拠でもある。CSRF保護の要否は要確認 | E2E-M07-02-021,022,031 | 要確認(セキュリティ) |
| 4 | ファイル名は接頭辞 purchase_ ＋ 買取注文IDの最小値を7桁ゼロ埋め ＋ _ ＋ YmdHis ＋ .csv | Service.php:101-102（'purchase_'.sprintf('%07d', min($buyOrderIds)).'_'.YmdHis.'.csv'） | 仕様どおり。最小値は「リクエストに含まれたID」で算出（存在しないIDも min 対象）＝最小IDが不存在でもファイル名に使われ得る。CSV行は存在分のみ | E2E-M07-02-002,004 | 要確認(最小ID算出元) |
| 5 | エラー時はセッション eccube.admin.purchase.search.page_no を復元したURL（admin_purchase_page/{page_no}）へリダイレクト | Controller.php:772-776(redirectToPurchaseSearchResult、無ければ1) | 仕様どおり。静的確認済 | E2E-M07-02-021,022 | 一致(確認済) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口(一覧) | 1件以上選択→CSV／未選択→alert中断 | 001,020 | カバー |
| 利用者視点の入口(詳細) | 詳細#export_csvで1件CSV（隠しbuyOrderIds送信） | 005,014 | カバー |
| フロント挙動(表示要素) | ダウンロードドロップダウン・#csvexport・各行チェック・#allCheck・詳細ボタン/隠し入力 | 010,011,014 | カバー |
| フロント挙動(JS挙動) | #allCheckで同フォーム内checkbox一括／未選択alert／500ms多重押下抑止 | 013,020,025 | 部分カバー(#allCheck=013・未選択alert=020は自動化／500ms多重押下抑止=025は手動・要実機確認 purchase.js:21-22) |
| フロント挙動(モーダル) | 出力前の確認ダイアログはない（alertのみ） | 012 | カバー |
| フロント挙動(CSS) | ドロップダウン暫定スタイル | （視覚回帰で別管理） | 対象外(視覚回帰・低価値) |
| 処理フロー#3-#5(取得・正規化) | buyOrderIds intval/array_filter（0除去境界含む） | 001,021,023 | カバー(021=パラメータ無し・023=0のみ→正規化後空→no_selection／負数・混在の残存はDB存在判定#6-#7へ流れる) |
| 処理フロー#4(選択なし) | no_selection フラッシュ＋一覧リダイレクト | 021 | カバー |
| 処理フロー#6-#7(全件不存在/一部存在) | 全件不存在→not_registered／一部存在→存在分のみ | 022／024（一部存在＝手動） | カバー(全件不存在=022自動／一部存在=024手動で行数不一致を照合) |
| 処理フロー#8-#10(集計・組み立て・ストリーム) | 点数/利用回数/前回利用日/列順/BOM/エンコード | （CSV内容＝手動） | 手動(ファイル照合) |
| 処理フロー#11(ファイル名) | purchase_<最小ID7桁>_<YmdHis>.csv | 002,004 | カバー |
| 処理フロー#12(応答ヘッダ) | octet-stream／attachment | 003,004 | カバー |
| 処理フロー#13(情報ログ) | 「古物台帳入力用CSV出力完了」＋ファイル名 | （観測外） | 対象外(ブラウザ観測外) |
| POSTパラメータ | buyOrderIds[]（整数配列・実質必須）／詳細は他フィールド同梱もエクスポートはbuyOrderIdsのみ読む | 001,021,023,005 | カバー(0正規化=023／詳細の他フィールド無視・無保存はDB観測外＝手動) |
| 集計条件(点数/利用回数/前回利用日) | 明細合計・会員累計・直近過去日 | （CSV内容＝手動） | 手動(ファイル照合) |
| 出力列とデータの対応 | 日付/受注番号/氏名/住所/年齢/職業/電話/身分証/点数/金額/区別/品目/特徴/利用回数/前回利用日 | （CSV内容＝手動） | 手動(ファイル照合) |
| エッジケース(重複ID/一部存在/年齢/文字コード) | 重複は一意化・存在分のみ・年差年齢・UTF-8時BOM | 024（一部存在の行数不一致）／重複・年齢(2/29)・文字コードはCSV内容 | 手動(024で一部存在を照合・重複/年齢/BOMはCSV手動) |
| 画面遷移 | 成功=DL応答(画面遷移なし)／失敗=一覧リダイレクト | 001,021,022,023 | カバー(失敗時は/purchase/page/{n}へ／セッションpage_no値の復元は付帯表4#5で静的確認) |
| エラー処理 | no_selection・not_registered | 021,022 | カバー |
| 権限・認可 | 未ログインは管理ログイン誘導／ログイン済みは到達で実行 | 030,031,001 | カバー |
| DB操作 | 参照のみ（更新/削除なし）。抽出結果はCSV内容 | （無更新は対象外・抽出はCSV手動） | 対象外/手動 |
| 排他制御・トランザクション | 明示トランザクション/ロックなし | （無更新＝DB観測外） | 対象外(機能なし) |
| 副作用 | DB更新なし・成功時ログ・失敗時フラッシュ＋リダイレクト | 021,022,023（フラッシュ＋一覧リダイレクト） | 部分カバー(フラッシュ/リダイレクトのみ自動化／DB無更新・成功時情報ログはブラウザ観測外＝対象外) |
| 副作用(CSRF/RememberMe) | 本機能固有Cookie/RememberMeは扱わない／CSRF検証は本ルートになし | （付帯表4#3で記録） | 要確認(乖離) |
| API/バッチ | 扱わない | （該当なし） | 対象外(機能なし) |

未カバーはいずれも理由（CSV内容＝ファイル手動照合・DB内部値・ログ観測外・機能なし・視覚回帰・要実機確認）を明記済み。設計書の各節を歩き、ブラウザで観測可能な挙動はすべてE2Eケースへ写像した。
