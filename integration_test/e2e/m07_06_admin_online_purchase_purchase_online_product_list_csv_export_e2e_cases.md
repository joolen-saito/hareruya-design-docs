# m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.html`（正本 `functions/pf-eccube3/m07-06_admin_online_purchase_purchase_online_product_list_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m07_06_admin_online_purchase_purchase_online_product_list_csv_export_it_cases.md`（母集合 計90観点行）

期待結果はダウンロード発火・HTTP応答ヘッダ（Content-Disposition のファイル名接頭辞）・フラッシュ表示・画面遷移（リダイレクト先URL）・UI部品表示などブラウザで観測できる結果で判定する。**CSVの中身（行・列・値・文字コード・区切り）の厳密検査は手動**とする。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない（pf-eccube3はリバース設計のため設計書・観点表を上位オラクルとし、刷新先ec-cube-enterpriseとの乖離は付帯表4に不具合候補として出す）。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | CSV出力内容の一致（厳密検査は手動・ダウンロード発火のみ自動化） |
| IT-27 | 出力失敗（存在しないIDのみ→エラーフラッシュ＋一覧へ戻る） |
| IT-25 | UI部品（ダウンロードメニュー項目・詳細ボタン・隠しID）・操作起点・ダウンロード発火・ファイル名接頭辞・エラーフラッシュ＋リダイレクト |
| IT-03 | 一覧/詳細の表示要素・JS（#allCheck 一括チェック）・詳細からの送信 |
| IT-13 | 未ログイン誘導（管理ルートの共通認証ガード。一覧URL=040、出力ルート`csv_export_product_list`自体=041。POST専用ルートへのGET直接アクセス時のメソッド不許可405は管理画面共通基盤の挙動＝要確認/付帯表4#2） |
| IT-15 | 未認証ガード（040/041）。CSRFは対象ルートに`isTokenValid()`なし＝手動/要確認(付帯表4#2)。対象データはCSV内容＝手動。状態変化なし |
| IT-22 | buyOrderIds 必須（未選択）・type 必須/相関（不正値）・DB相関（存在しないID）。一部のみ存在の混在出力は要POST構築＝手動/間接 |
| IT-23 | CSV抽出SQL（`getProductListDataForExportCsv`のJOIN・集約・ORDER BY）は本機能内だがブラウザ観測不可＝CSV内容として手動/間接。検索条件UI自体は呼び出し元一覧へ委譲 |
| IT-26 | 登録内容（本機能はDB更新なし・読み取りのみ＝対象外/手動） |
| IT-20 | ログ出力（完了ログ・抑止対象）＝ブラウザ観測外（対象外） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-001	IT-25	UI部品	P2	一覧のダウンロードメニューに「買取商品一覧CSV」が表示される	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	—	"1. /admin/purchase/list を開く
2. 「ダウンロード」ドロップダウンを開く"	ドロップダウン内に「買取商品一覧CSV」項目が表示されること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-002	IT-25	UI部品	P2	一覧のダウンロードメニューに「買取商品（キャンセル）CSV」が表示される	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	—	"1. /admin/purchase/list を開く
2. 「ダウンロード」ドロップダウンを開く"	ドロップダウン内に「買取商品（キャンセル）CSV」項目が表示されること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-003	IT-03	外部画面	P2	買取詳細に「買取商品一覧CSV出力」ボタンと隠しbuyOrderIdsが表示される	管理者ログイン済／買取注文1件／SEED-M07-06-BUYORDER	—	"1. 買取詳細（/admin/purchase/{id}/edit）を開く"	送信ボタン「買取商品一覧CSV出力」と、当該買取IDを値に持つ隠し入力 name=\"buyOrderIds[]\" が存在すること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-010	IT-16	実行結果	P1	一覧で1件選択し売却CSVを押すとダウンロードが発火する	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=sale	"1. /admin/purchase/list を開く
2. 行頭チェックボックスを1件オンにする
3. ダウンロード→「買取商品一覧CSV」を押下"	ブラウザのファイルダウンロードが発火すること（CSV内容の一致確認は手動）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-011	IT-25	URL	P1	売却CSVのファイル名接頭辞が purchase_product_list_ である	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=sale	"1. 一覧で1件選択し「買取商品一覧CSV」を押下
2. ダウンロードファイル名を確認"	ダウンロードファイル名が purchase_product_list_ で始まり拡張子 .csv であること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-012	IT-25	操作起点	P2	一覧で1件選択しキャンセルCSVを押すとダウンロードが発火する	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=notSale	"1. /admin/purchase/list を開く
2. 行頭チェックボックスを1件オンにする
3. ダウンロード→「買取商品（キャンセル）CSV」を押下"	ブラウザのファイルダウンロードが発火すること（CSV内容の一致確認は手動）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-013	IT-25	URL	P2	キャンセルCSVのファイル名接頭辞が purchase_product_cancel_list_ である	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=notSale	"1. 一覧で1件選択し「買取商品（キャンセル）CSV」を押下
2. ダウンロードファイル名を確認"	ダウンロードファイル名が purchase_product_cancel_list_ で始まり拡張子 .csv であること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-014	IT-27	実行結果	P1	買取詳細から売却CSVを押すとダウンロードが発火する	管理者ログイン済／買取注文1件／SEED-M07-06-BUYORDER	隠し buyOrderIds[]＝当該買取ID／type=sale	"1. 買取詳細を開く
2. 「買取商品一覧CSV出力」ボタンを押下"	ブラウザのファイルダウンロードが発火すること（CSV内容の一致確認は手動）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-020	IT-03	画面遷移	P2	一覧の#allCheckで同フォーム内の行チェックが一括オンになる	管理者ログイン済／買取一覧に複数件／SEED-M07-06-BUYORDER	—	"1. /admin/purchase/list を開く
2. ヘッダの全選択チェックボックス（#allCheck）をオンにする"	同フォーム内の buyOrderIds[] 行チェックボックスがすべてオンになること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-030	IT-22	必須制御	P1	buyOrderIds未選択でサーバ到達時に未選択フラッシュが表示される	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds 空／type=sale	"1. クライアントJSを介さずに csv_export_product_list?type=sale へ buyOrderIds なしでPOSTする"	設計書エラー処理の翻訳キー admin.purchase.online.csv_export.no_selection に対応する未選択エラーフラッシュが表示されること（具体文言「1つ以上の買取注文情報を選択してください。」は messages.ja.yaml 実装由来＝参考・要確認、付帯表4#7）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-031	IT-25	URL	P1	buyOrderIds未選択でサーバ到達時に買取一覧へリダイレクトされる	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds 空／type=sale	"1. クライアントJSを介さずに csv_export_product_list?type=sale へ buyOrderIds なしでPOSTする"	買取一覧（/admin/purchase/page/{page_no}）へリダイレクトされること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-032	IT-25	確認ダイアログ	P1	type が sale/notSale 以外だと不正種別フラッシュが表示される	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds[]＝1件／type=foo	"1. csv_export_product_list?type=foo へ buyOrderIds 付きでPOSTする"	フラッシュに「不正なCSV種別です。」が表示されること（設計書の固定文言。実装乖離は付帯表4#1）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-033	IT-25	URL	P2	不正type のとき買取一覧へリダイレクトされる	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds[]＝1件／type=foo	"1. csv_export_product_list?type=foo へ buyOrderIds 付きでPOSTする"	買取一覧（/admin/purchase/page/{page_no}）へリダイレクトされること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-034	IT-27	出力失敗	P1	存在しないIDのみ指定時に存在しないID含むフラッシュが表示される	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds[]＝DBに存在しない大きな整数／type=sale	"1. csv_export_product_list?type=sale へ存在しないIDのみでPOSTする"	設計書エラー処理の翻訳キー admin.purchase.online.csv_export.not_registered_buy_order_id に対応するエラーフラッシュが表示され、ダウンロードされないこと（具体文言「存在しない買取注文情報IDが含まれています。」は messages.ja.yaml 実装由来＝参考・要確認、付帯表4#7）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-035	IT-25	送信可否制御	P2	一覧で未選択のままCSVボタンを押すとJSのalertで中断される	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	行チェックなし	"1. /admin/purchase/list を開く
2. どの行も選択せずダウンロード→「買取商品一覧CSV」を押下"	ブラウザのalert（未選択案内）が表示され、ダウンロードもPOSTも発生しないこと。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-040	IT-15	未認証	P2	未ログインで買取一覧URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /admin/purchase/list へアクセスする"	管理ログイン画面へ誘導されること。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-041	IT-13	未認証	P1	未ログインでCSV出力ルートへアクセスすると管理ログイン画面へ誘導される	未ログイン	type=sale（クエリ）	"1. 未ログインで /admin/purchase/csv_export_product_list?type=sale へアクセスする"	設計書「管理画面の認証・共通制約を通過」（処理フロー#1）どおり管理ログイン画面へ誘導され、CSVがダウンロードされないこと（一覧URLだけでなく出力ルート自体の認可ガードを確認）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-015	IT-25	HTTPステータス	P2	売却CSV応答のContent-Typeがapplication/octet-streamである	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=sale	"1. 一覧で1件選択し「買取商品一覧CSV」を押下
2. 応答ヘッダ Content-Type / Content-Disposition を確認"	応答の Content-Type が application/octet-stream、Content-Disposition が attachment であること（処理フロー#13）。Playwright の download API ではヘッダ取得が制約のため手動/要確認。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-016	IT-25	URL	P2	エラー時のリダイレクト先ページ番号がセッションのpage_no（無ければ1）である	管理者ログイン済／SEED-M07-06-BUYORDER／一覧で特定ページを閲覧しセッション eccube.admin.purchase.search.page_no を設定済	buyOrderIds 空／type=sale	"1. 一覧の特定ページを表示し page_no をセッションに残す
2. 未選択でPOSTしリダイレクト先URLのページ番号を確認"	/admin/purchase/page/{page_no} の page_no がセッション値（未設定時は1）と一致すること（処理フロー#4・セッション節）。セッション値の確認が必要なため手動/間接。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-017	IT-25	URL	P2	売却CSVのファイル名が接頭辞＋7桁ゼロ埋めID＋_日時＋.csv形式である	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	buyOrderIds[]＝選択した1件／type=sale	"1. 一覧で1件選択し「買取商品一覧CSV」を押下
2. ダウンロードファイル名を確認"	ファイル名が purchase_product_list_ ＋ 7桁ゼロ埋め番号（指定IDの最小値）＋ _ ＋ 14桁日時（YmdHis）＋ .csv の形式であること（処理フロー#12）。番号・日時の具体値は実行時刻/データ依存のため形式（正規表現）で判定する。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-036	IT-25	確認ダイアログ	P1	typeクエリ欠損だと不正種別フラッシュが表示される	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds[]＝1件／type なし	"1. csv_export_product_list へ type を付けず buyOrderIds 付きでPOSTする"	設計書「欠損やその他の値は固定文言のフラッシュとリダイレクト」（POSTパラメータ節）どおり、フラッシュに「不正なCSV種別です。」が表示され買取一覧へリダイレクトされること（設計＝句点あり。実装は句点なし＝付帯表4#1で検出見込み）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-037	IT-22	必須制御	P1	buyOrderIdsが0のみだと正規化後に空となり未選択フラッシュが表示される	管理者ログイン済／SEED-M07-06-BUYORDER	buyOrderIds[]=0／type=sale	"1. csv_export_product_list?type=sale へ buyOrderIds[]=0 でPOSTする"	intval→array_filter で 0 が除かれ空配列となり（処理フロー#3）、翻訳キー admin.purchase.online.csv_export.no_selection の未選択エラーフラッシュが表示され一覧へリダイレクトされること（処理フロー#4。具体文言は messages.ja.yaml 実装由来＝参考・付帯表4#7）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-038	IT-25	送信可否制御	P2	一覧で未選択のままキャンセルCSVボタンを押すとJSのalertで中断される	管理者ログイン済／買取一覧に1件以上／SEED-M07-06-BUYORDER	行チェックなし	"1. /admin/purchase/list を開く
2. どの行も選択せずダウンロード→「買取商品（キャンセル）CSV」を押下"	ブラウザのalert（未選択案内）が表示され、ダウンロードもPOSTも発生しないこと（フロント挙動: #csv_export_product_cancel も .searched_buy_order_id:checked==0 で alert 中断＝売却ボタン035と対になる異常系）。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-091	IT-25	UI部品	P3	CSV列見出しが売却=「在庫増減数」/非売却=「キャンセル数」で差し替わる	SEED-M07-06-BUYORDER（売却・非売却双方の明細）	type=sale および type=notSale	"1. 売却CSV/キャンセルCSVをそれぞれ出力
2. 1行目ヘッダの数量列見出しを比較"	売却側は数量列見出しが「在庫増減数」、非売却側は同一キー product_count の見出しが「キャンセル数」に置換され、列数は同一であること（出力列とデータの対応）。CSV内容のため手動。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-092	IT-23	実行結果	P2	CSV列順と各列の値が設計の内部キー対応どおりである	SEED（状態あり通常/状態なし通常/個別入力の各明細）	type=sale	"1. 売却CSVを出力
2. 列順・各セル値をDB値と突合"	ヘッダキー順に9列（商品コード/在庫増減数/商品名/基準価格/買取価格/言語ID/略称タグ/レアリティ/状態）が並び、状態なし・個別入力枝では商品コード・基準価格・状態等が空文字、個別入力枝の言語IDが1となるなど設計どおりであること（出力列とデータの対応）。CSV内容のため手動。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-093	IT-23	実行結果	P2	明細が条件に合致しない買取注文を指定するとヘッダのみのCSVが返る	SEED（存在するが売却/非売却条件に合致する明細を持たない買取注文）	buyOrderIds[]＝当該注文／type=sale	"1. 当該注文を選択し売却CSVを出力
2. CSV行数を確認"	データ行が出力されずヘッダ行のみのCSVとなること（エッジケース「存在するが明細が条件に合わない」）。CSV内容のため手動。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-094	IT-26	登録内容	P2	CSVの文字コード・区切り・クォートが既存CSV仕様どおりである	eccube_csv_export_encoding / eccube_csv_export_separator 既定	type=sale	"1. 売却CSVを出力
2. バイナリで先頭BOM・区切り文字・クォートを確認"	eccube_csv_export_encoding がUTF-8（大小無視）のときのみ先頭BOMを付与、区切りは eccube_csv_export_separator（既定カンマ）、引用・エスケープは fputcsv 相当であること（エッジケース）。CSV内容のため手動。
m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力）	E2E-M07-06-095	IT-23	検索条件	P2	抽出SQLの集約・並び順・キャンセル除外がCSV行集合に反映される	SEED（同一規格・同一単価で集約される明細／単価違いで別行になる明細／非売却側でキャンセルステータスの注文）	type=sale / type=notSale	"1. 各CSVを出力
2. 行の集約（SUM(count)）・ORDER BY並び順・非売却側キャンセル注文除外を確認"	同一キー・同一単価は1行に集約され単価違いは別行、ORDER BY（個別入力でない行優先→product_id昇順→商品コードNULL後置→カード状態ID昇順）順、非売却側ではキャンセル注文が通常枝・個別入力枝の両方から除外されること（集計条件）。CSV内容のため手動。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは ec-cube-enterprise の Twig 由来（位置情報のみ）。一覧フォームは `#bulk_csv_export`（CSRFトークン隠しを内包 index.twig:163）、詳細は買取更新フォーム内に `formaction` 差し替えのボタンを置く。DOM id は Twig の静的 id をそのまま使用（Symfony Form 経由でない静的ボタン）。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|----------------------------------------------|------------------------------|--------------|
| E2E-M07-06-001 | E2E自動化(要シード) | ダウンロードトグル `admin.common.download`=「ダウンロード」(index.twig:167-168 / messages.ja.yaml:1459) / #csvexport_product_list(index.twig:173 trans `...btn.csvexport_product_list`=「買取商品一覧CSV」messages.ja.yaml:5252) | フロント挙動（表示要素）・利用者視点の入口 | IT-...-010 |
| E2E-M07-06-002 | E2E自動化(要シード) | #csv_export_product_cancel(index.twig:174 trans `...btn.csv_export_product_cancel`=「買取商品（キャンセル）CSV」messages.ja.yaml:5258) | 利用者視点の入口（キャンセルCSV） | IT-...-010 |
| E2E-M07-06-003 | E2E自動化(要シード) | 詳細 #csvexport_product_list(detail.twig:314 trans `...detail.btn.csvexport_product_list`=「買取商品一覧CSV出力」messages.ja.yaml:5254) / #buyOrderIds(detail.twig:315 name=`buyOrderIds[]`) | 利用者視点の入口（詳細から出力）・フロント挙動 | IT-...-017 |
| E2E-M07-06-010/011 | E2E自動化(要シード＋download受信) | #bulk_csv_export(index.twig:162) / .searched_buy_order_id[name=`buyOrderIds[]`](index.twig:231) / #csvexport_product_list(index.twig:173 formaction type=sale) | 処理フロー#11-13＋#12(接頭辞`purchase_product_list_`)・画面遷移(成功=ダウンロード) | IT-...-001/016 |
| E2E-M07-06-012/013 | E2E自動化(要シード＋download受信) | #csv_export_product_cancel(index.twig:174 formaction type=notSale) | 利用者視点の入口(notSale 接頭辞`purchase_product_cancel_list_` 処理フロー#12) | IT-...-016 |
| E2E-M07-06-014 | E2E自動化(要シード＋download受信) | 詳細 #csvexport_product_list(detail.twig:314 formaction type=sale) / #buyOrderIds(detail.twig:315) | 利用者視点の入口（詳細から売却CSV）・IT-27 | IT-...-002/017 |
| E2E-M07-06-020 | E2E自動化(要シード複数件・JS) | #allCheck(index.twig:212) / .searched_buy_order_id(index.twig:231) | フロント挙動（JS #allCheck 一括オンオフ） | IT-...-019 |
| E2E-M07-06-030/031 | 自動化予定/fixme(要POST構築＋flashセレクタ要実機確認) | フラッシュ表示領域 要実機確認 / リダイレクト先URL admin_purchase_page(PurchaseController.php:605,608) | 処理フロー#4＋エラー処理(`...csv_export.no_selection`=「1つ以上の買取注文情報を選択してください。」messages.ja.yaml:5247) | IT-...-027/060 |
| E2E-M07-06-032/033 | 自動化予定/fixme(要POST構築＋flashセレクタ要実機確認) | フラッシュ表示領域 要実機確認 / リダイレクト先URL(PurchaseController.php:620-622) | 処理フロー#5＋エラー処理（設計＝固定文言「不正なCSV種別です。」。実装は「不正なCSV種別です」で末尾「。」なし＝付帯表4#1） | IT-...-014 |
| E2E-M07-06-034 | 自動化予定/fixme(要シード＋POST構築＋flashセレクタ要実機確認) | フラッシュ表示領域 要実機確認 / RuntimeException→翻訳(PurchaseController.php:625-630) | 処理フロー#8＋エラー処理(`...not_registered_buy_order_id`=「存在しない買取注文情報IDが含まれています。」messages.ja.yaml:5248) | IT-...-003 |
| E2E-M07-06-035 | 自動化予定/fixme(purchase.js のロード前提・dialogハンドラ要実機確認) | #csvexport_product_list クリック時 `.searched_buy_order_id:checked`==0 で alert（html/template/admin/assets/js/Purchase/purchase.js 設計書フロント挙動節） | フロント挙動（JS未選択alert中断） | IT-...-013/016 |
| E2E-M07-06-040 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig 由来・login.page.ts) | 利用者視点の入口・権限認可（未ログインは管理ログイン対象） | IT-...-005 |
| E2E-M07-06-041 | E2E自動化(資格情報不要) | 出力ルート `/{admin_route}/purchase/csv_export_product_list`(PurchaseController.php:594 methods=POST) / 管理ログイン画面 #login_id | 権限・認可（処理フロー#1 管理画面の認証・共通制約）。出力ルート自体の未認証ガード。POST専用ルートへのGETアクセス時の405は管理共通基盤＝付帯表4#2、本ケースは未認証→ログイン誘導のみを判定 | IT-...-024 |
| E2E-M07-06-015 | 手動/要確認(downloadヘッダ取得制約) | 応答ヘッダ Content-Type/Content-Disposition(BuyOrderProductListCsvExportService→StreamedResponse) | 処理フロー#13（Content-Type=application/octet-stream・Content-Disposition=attachment） | IT-...-025 |
| E2E-M07-06-016 | 手動/間接(セッション値確認要) | リダイレクト先URL admin_purchase_page / セッション `eccube.admin.purchase.search.page_no`(redirectToPurchaseSearchResult) | 処理フロー#4・セッション節（page_no 復元・無ければ1） | IT-...-026 |
| E2E-M07-06-017 | E2E自動化(要シード＋download受信) | ダウンロードファイル名(suggestedFilename) 正規表現 `^purchase_product_list_\d{7}_\d{14}\.csv$` | 処理フロー#12（接頭辞＋`printf('%07d')`＋`_YmdHis`＋`.csv`） | IT-...-026 |
| E2E-M07-06-036 | 自動化予定/fixme(要POST構築＋flashセレクタ要実機確認) | フラッシュ表示領域 要実機確認 / type 欠損→default枝(PurchaseController.php:618-622) | POSTパラメータ節（type欠損も固定文言）＋処理フロー#5（設計＝「不正なCSV種別です。」句点あり。実装は句点なし＝付帯表4#1） | IT-...-014 |
| E2E-M07-06-037 | 自動化予定/fixme(要POST構築＋flashセレクタ要実機確認) | フラッシュ表示領域 要実機確認 / `array_filter(array_map('intval', …))`空判定(PurchaseController.php:601-606) | 処理フロー#3-4（0正規化で空→no_selection。`...csv_export.no_selection` messages.ja.yaml:5247） | IT-...-027/060 |
| E2E-M07-06-038 | 自動化予定/fixme(purchase.js ロード前提・dialogハンドラ要実機確認) | #csv_export_product_cancel クリック時 `.searched_buy_order_id:checked`==0 で alert（purchase.js 設計書フロント挙動節） | フロント挙動（JS未選択alert中断。売却ボタン035と対になるキャンセルボタンの異常系） | IT-...-016 |
| E2E-M07-06-091 | 手動(CSV内容) | CSVヘッダ行 数量列見出し(BuyOrderProductListCsvExportService CSV_HEADER) | 出力列とデータの対応（売却=在庫増減数/非売却=キャンセル数・列数同一） | IT-...-008/023 |
| E2E-M07-06-092 | 手動(CSV内容) | CSV列順・各セル値(getProductListDataForExportCsv／CSV_HEADERキー順) | 出力列とデータの対応（9列・状態あり/なし/個別入力枝の空文字・言語ID=1） | IT-...-078-082 |
| E2E-M07-06-093 | 手動(CSV内容) | CSVデータ行数(StreamedResponse コールバック) | エッジケース「存在するが明細が条件に合わない」＝ヘッダのみCSV | IT-...-078-082 |
| E2E-M07-06-094 | 手動(CSV内容) | BOM/区切り/クォート(CsvExportService fopen/fputcsv・eccube_csv_export_encoding/separator) | エッジケース（文字コード・区切り・クォート） | IT-...-087 |
| E2E-M07-06-095 | 手動(CSV内容) | 集約/ORDER BY/キャンセル除外(getProductListDataForExportCsv の GROUP BY・ORDER BY・WHERE) | 集計条件（数量集約・並び順・非売却側キャンセル注文除外） | IT-...-062-082 |

注: 既存IT cases は観点名のみの定型自動生成スタブ（操作手順・前提が汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（処理フロー・エラー処理・利用者視点の入口・フロント挙動）を一次情報源として網羅した。`元ITケースID` 接頭辞は `IT-M07-06-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-PRODUCT-LIST-CSV-EXPORT-NNN`。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m07_06_..._it_cases.md` の関連ID件数（IT-16=1/IT-27=2/IT-15=4/IT-20=2/IT-25=9/IT-03=7/IT-13=1/IT-22=35/IT-23=22/IT-26=7＝計90）。本機能は「読み取りのみのCSVストリーム出力」であり、入力はチェックされた買取注文ID（`buyOrderIds[]`）とクエリ`type`のみ。よって項目別バリデーション（文字列長・数値・文字種・部分入力）や DB登録は本機能に非該当で対象外とする。一方、本機能の CSV抽出SQL（`getProductListDataForExportCsv` の JOIN・売却/非売却の `sale_flg` 限定・キャンセル除外・数量集約・ORDER BY）は本機能内ロジックだがブラウザで直接観測できないため、その結果（IT-23 検索条件・実行結果）は CSV の中身として **手動/間接** に分類する（対象外ではない）。CSVの中身は手動とする。母集合は本機能に対応する既存IT cases 90観点行に限定（観点表全516行ではない）。内訳は **付帯表2b（行単位明細・全90行）** が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 0 | 1 | 0 | CSV出力内容の一致は厳密検査＝手動（ダウンロード発火は010で自動化） |
| IT-27 | 2 | 1 | 1 | 0 | 出力失敗(034)は自動化／詳細CSV内容一致は手動 |
| IT-15 | 4 | 1 | 2 | 1 | 未認証は自動化。CSRF(行004)は対象ルートに isTokenValid なし＝手動/要確認(付帯表4#2)。対象データはCSV内容＝手動。状態変化なし＝対象外 |
| IT-20 | 2 | 0 | 0 | 2 | 完了ログ・抑止対象はブラウザ観測外 |
| IT-25 | 9 | 6 | 2 | 1 | UI/操作起点/ダウンロード発火/ファイル名/エラー遷移は自動化。「存在する注文だけSQL対象」(行011)・言語ID(行025)はCSV内容＝手動/間接。完了ログ(行015)は観測外 |
| IT-03 | 7 | 4 | 1 | 2 | 表示要素/JS/詳細送信/alertは自動化。CSV見出し値は手動、CSS・POST内容は観測外 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス（未認証誘導）を自動化 |
| IT-22 | 35 | 6 | 1 | 28 | 必須(buyOrderIds)/相関(type)/DB相関(存在ID)は自動化。一部のみ存在の混在出力(061)は要POST構築＝手動/間接。項目別の長さ・数値・文字種・部分入力は該当フィールドなし＝非該当 |
| IT-23 | 22 | 1 | 21 | 0 | CSV抽出SQL(JOIN/集約/ORDER BY)は本機能内だがブラウザ観測不可＝CSV内容として手動/間接。ダウンロード処理(088)のみ自動化 |
| IT-26 | 7 | 1 | 2 | 4 | 本機能はDB更新なし（読み取りのみ）。エラー遷移(089)は自動化、CSV区切り(087)・「存在する注文だけSQL対象」(086)は手動/間接、登録系・完了ログは非該当/観測外 |
| 合計 | 90 | 21 | 31 | 38 | **未分類 0** |

注: 母集合は本機能に対応する既存IT cases の90観点行に限定（観点表 `integration-test-viewpoints.md` 全行のうち本機能分の抽出済み部分集合）であり、観点表全体516行を母集合にしたものではない。対象外38件はいずれも「ブラウザで観測不能（ログ/POST内容）」「本機能で非該当（項目別バリデーション・DB登録）」が理由であり、放置ではない。手動/間接31件には CSV抽出SQL結果（JOIN/集約/ORDER BY＝CSV内容で検証）、CSRF(行004・付帯表4#2要確認)、SQL対象判定(行011/086)、言語ID(行025)を含む。「自動化」21観点行は **(a)実装spec済み（実行可能なE2E）** と **(b)自動化予定（`test.fixme`・サーバ側フラッシュ/JS依存・要実機確認）** の2種に分かれる。(a)実装spec済みケースは E2E-001/002/003/010/011/012/013/014/017/020/040/041 の12ケース、(b)自動化予定fixmeは 030/031/032/033/034/035/036/037/038 である。**観点行の集計上は (a)+(b) を「自動化(予定含む)」としてカウントするが、fixme は未実行のため付帯表5では「カバー(自動化済)」と「部分カバー(自動化予定/fixme・未実行)」を厳密に区別する**（codex指摘D是正）。E2E-015(Content-Type)・016(page_no)・091-095(CSV内容)は手動/間接で付帯表5にも手動として明記する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を、本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動/間接 | CSV出力内容の一致＝厳密検査は手動（発火は010で自動化） |
| 002 | IT-27 | 実行結果 | 手動/間接 | 詳細CSVの出力内容一致＝手動（発火は014で自動化） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 034（存在しないIDのみ→エラーフラッシュ） |
| 004 | IT-15 | CSRF | 手動/間接 | 一覧フォームはCSRF隠しを送信する（index.twig:163）が、対象ルート `csv_export_product_list` は `isTokenValid()` を呼ばない（隣の csv_export_return_list は呼ぶ）＝他CSVルートと不一致のテスト可能な乖離候補。トークン除去/改変POSTの挙動は手動/要確認（付帯表4#2。実装オラクル化しない）。「対象外」ではなく手動/要確認へ是正（codex指摘B） |
| 005 | IT-15 | 未認証 | E2E自動化 | 040（一覧URL未ログイン誘導）/041（出力ルート自体の未認証ガード） |
| 006 | IT-15 | 対象データ | 手動/間接 | 出力対象データ＝CSV内容の一致で手動 |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 対象外 | 本機能はDB更新なし（状態変化なし） |
| 010 | IT-25 | UI部品 | E2E自動化 | 001/002（一覧メニュー）/003（詳細ボタン） |
| 011 | IT-25 | UI部品 | 手動/間接 | 「存在する注文だけSQL対象」＝出力結果（CSV内容）で検証する手動/間接。同観点の行061/086と分類を統一（codex指摘B是正：旧「対象外」） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 010/012（出力操作の起点＝ダウンロード発火） |
| 013 | IT-25 | 確認ダイアログ | E2E自動化 | 010（エクスポート成功＝ダウンロード処理） |
| 014 | IT-25 | 確認ダイアログ | E2E自動化 | 030-033（ID未選択/不正type→フラッシュ＋リダイレクト）/036（type欠損→不正種別フラッシュ） |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 完了ログ記録＝ブラウザ観測外 |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 010（1件選択→売却CSVダウンロード）/035（売却ボタン未選択alert）/038（キャンセルボタン未選択alert＝対の異常系） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 003（詳細CSVボタン） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 001（一覧表示要素・ドロップダウン項目） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 020（#allCheck 一括オンオフ） |
| 020 | IT-03 | 画面遷移 | 対象外 | CSV出力専用の追加スタイルなし＝低価値・観測薄 |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 035（出力前ダイアログなし＝alert案内のみ） |
| 022 | IT-03 | 画面遷移 | 対象外 | buyOrderIds が整数配列＝POST内容で観測外 |
| 023 | IT-03 | 画面遷移 | 手動/間接 | 「在庫増減数」見出し＝CSV内容で手動 |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 040（一覧URL未ログイン誘導）/041（出力ルート自体の未認証ガード）。POST専用ルートへのGET直接アクセス時の405メソッド不許可は管理共通基盤の挙動＝付帯表4#2で要確認 |
| 025 | IT-25 | HTTPステータス | 手動/間接 | 言語ID＝CSV列値で、CSV内容として手動/間接で検証（他のCSV内容行と分類統一。092でも列値検証。応答Content-Typeは015で手動/要確認）。codex指摘B是正：旧「対象外」 |
| 026 | IT-25 | URL | E2E自動化 | 031/033（リダイレクト先URL）/017（ファイル名形式の正規表現）/016（page_no復元は手動/間接） |
| 027,028 | IT-22 | 必須バリデーション | E2E自動化 | 030（未選択→必須フラッシュ）/037（0正規化で空→必須フラッシュ境界）/010（選択あり→継続） |
| 029-053 | IT-22 | 文字列長/数値/文字種/その他のバリデーション | 対象外 | 本機能に該当する入力フィールドなし（入力は buyOrderIds[] と type のみ）＝非該当 |
| 054 | IT-22 | 相関バリデーション | E2E自動化 | 030（未入力相関→未選択フラッシュ） |
| 055,056,057 | IT-22 | 相関バリデーション | 対象外 | 汎用相関は非該当（本機能の相関は type と存在IDで代表＝058/059） |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 010/014（条件該当→出力継続） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 034（存在しないID→エラー） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 030（buyOrderIds 必須制御） |
| 061 | IT-22 | 部分入力 | 手動/間接 | 「一部のみ存在でも空でなければ出力」（処理フロー#9）は存在ID＋非存在IDの混在POST構築が必要＝fixme相当、ダウンロード発火と出力内容は手動/間接（010は正常な1件選択のみで本観点を代表しない） |
| 062-077 | IT-23 | 検索条件 | 手動/間接 | 本機能の CSV抽出SQL（`getProductListDataForExportCsv` の規格JOIN・`sale_flg`限定・キャンセル除外・数量集約条件）は本機能内ロジックだがブラウザ観測不可＝CSV内容として手動/間接で検証（検索条件UIは呼び出し元一覧へ委譲） |
| 078-082 | IT-23 | 実行結果 | 手動/間接 | 抽出SQLの実行結果（行集合・ORDER BY並び順・集約値）はCSV内容として手動/間接で検証（ダウンロード発火のみ088で自動化） |
| 083,084,085 | IT-26 | 登録内容 | 対象外 | 本機能はDB登録/更新を行わない（読み取りのみ） |
| 086 | IT-26 | 登録内容 | 手動/間接 | 「存在する注文だけSQL対象」＝出力結果（CSV内容）で検証する手動/間接。行011/061と分類統一（codex指摘B是正：旧「対象外」） |
| 087 | IT-26 | 登録内容 | 手動/間接 | CSV区切り・クォート＝CSV形式で手動 |
| 088 | IT-23 | 登録内容 | E2E自動化 | 010（ブラウザがダウンロードを処理） |
| 089 | IT-26 | 登録内容 | E2E自動化 | 030-033（フラッシュ＋リダイレクト） |
| 090 | IT-26 | 登録内容 | 対象外 | 完了ログ記録＝ブラウザ観測外 |

集計（付帯表2と一致）: 自動化 21（うち実装spec済み12＝001/002/003/010/011/012/013/014/017/020/040/041、自動化予定fixme＝030-038系の観点行）／ 手動・間接 31（001,002,004,006,011,023,025,086,087,061,062-082）／ 対象外 38。**未分類 0**。
注: 観点行011/025/086/004 を是正で「対象外」→「手動/間接」へ移し（CSV内容/SQL対象判定/言語ID列値/CSRFトークン検証要確認）、対象外42→38・手動27→31とした。母集合90・未分類0は維持。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M07-06-BUYORDER | dtb_buy_order ＋ dtb_buy_main_card ＋ dtb_product_class 等 | ネット買取注文を最低2件（売却側 sale_flg=true の明細を含む1件以上＋一覧に複数行表示できる件数）。買取詳細を開ける有効な1件。キャンセル側（非売却 sale_flg=false／キャンセル除外確認用）明細も1件。手動CSV内容検証(091-095)用に状態あり/状態なし/個別入力枝・単価違い集約・明細0(ヘッダのみ)を表現できる明細を含む | fixture/migration（pf-eccube3→ec-cube-enterprise、DB正典はec-cube-enterprise） | 専用接頭辞で識別・撤去。読み取りのみで破壊しない（DB副作用なし） | 001,002,003,010,011,012,013,014,015,016,017,020,030,031,032,033,035,036,037,038,091,092,093,094,095 |
| 共通管理者ログイン | dtb_member（管理者） | 有効な管理者1（ECCUBE_ADMIN_USER/PASS）。ロック回避に専用テストアカウント推奨 | fixture（config/default.config.ts 既定） | 既存利用・撤去不要 | 040/041以外の全件 |

注: 040（一覧URL未ログイン誘導）・041（出力ルート未認証ガード）はシード不要・資格情報不要。030-034・036-038 はクライアントJSを介さないPOST構築（同一セッションでのフォーム送信/リクエスト）が必要で、フラッシュ表示領域のセレクタは要実機確認のため fixme。016（page_no）はセッションの page_no を事前に設定する手順が必要。CSVの中身（列・値・文字コード・区切り＝091-095）と Content-Type（015）は本付帯表のシードに紐づく手動検証とする。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 不正typeのフラッシュ固定文言は「不正なCSV種別です。」（設計書・観点表 末尾「。」あり） | PurchaseController.php:620 `addError('不正なCSV種別です', 'admin')`（末尾「。」なし） | 設計＝句点あり／実装＝句点なし。テストは仕様どおり「不正なCSV種別です。」を期待＝実装が違えば落ちて検出 | E2E-M07-06-032 | 不具合候補 |
| 2 | 設計書「管理画面の認証・共通制約を通過する」 | PurchaseController.php:594-633 当ルートは `isTokenValid()` を呼ばない（隣の csv_export_return_list:641 は呼ぶ）。一覧フォームはCSRF隠しを送る(index.twig:163) | サーバ側CSRFトークン検証の有無が他CSVルートと不一致。CSRF観点(IT-15 行004)は観測外だが要ソース確認 | E2E-M07-06-040 | 要確認 |
| 3 | 未選択時はフラッシュ＋一覧へ戻る／不正type／存在しないID の各分岐 | PurchaseController.php:603-631 | 各分岐は静的確認済。フラッシュ表示領域のDOMセレクタ（index.twig のアラート出力位置）は要実機確認 | E2E-M07-06-030,031,032,033,034 | 要確認(セレクタ) |
| 4 | ファイル名は接頭辞＋最小ID `printf('%07d')`＋`_YmdHis.csv` | 設計書 処理フロー#12（サービス BuyOrderProductListCsvExportService） | 接頭辞は Content-Disposition で観測可。ID番号・日時部分は実行時刻依存で接頭辞のみ判定（厳密一致は手動） | E2E-M07-06-011,013 | 要確認(動的部分) |
| 5 | 一覧未選択クリック時 JS alert 中断（フロント挙動節） | html/template/admin/assets/js/Purchase/purchase.js（旧assetsパス） | 当該JSが刷新先テンプレートでロードされるか・ハンドラ対象セレクタは要実機確認 | E2E-M07-06-035 | 要確認(JSロード) |
| 6 | クリック後約500msは`[type=submit]`の`pointer-events`を空にして多重押下を抑止する（フロント挙動節） | purchase.js は `setTimeout(...500)` で `pointer-events` を空（=有効化）へ戻すのみで、クリック直後に `none` へ無効化する記述が当該ハンドラに見当たらない（別JS/CSS依存の可能性） | 多重押下抑止の実装根拠が不明確。仕様の「抑止」挙動と実装の対応は要確認（E2Eではタイミング依存のため自動化対象外、観点行021） | E2E-M07-06-035 | 要確認(多重押下) |
| 7 | エラーフラッシュ文言: no_selection/not_registered は設計書本文では翻訳キーのみ記載（具体文言は未記載）。不正typeのみ設計書に固定文言「不正なCSV種別です。」あり | messages.ja.yaml:5247（no_selection）/5248（not_registered） | 030/034 の具体文言「1つ以上の…」「存在しない…」は messages.ja.yaml 実装由来＝オラクル混入回避のため期待結果は翻訳キーを一次オラクルとし、具体文言は参考扱い（実装変更で文言が変わってもキー対応で判定）。不正type文言は設計書由来のため固定値を期待してよい（#1） | E2E-M07-06-030,034 | 要確認(文言オラクル) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（一覧 売却/キャンセルCSV） | ダウンロードメニュー項目表示・選択して出力 | 001,002,010,011,012,013 | カバー |
| 利用者視点の入口（詳細 売却CSV） | 詳細ボタン＋隠しID・押下で出力 | 003,014 | カバー |
| 利用者視点の入口（不正type／type欠損） | 固定文言フラッシュ＋一覧へ | 032,033,036 | 部分カバー(自動化予定/fixme・未実行)：032/033(不正値)＋036(欠損)。実行可能な自動化実体なし |
| フロント挙動（表示要素） | 行頭チェックボックス・ドロップダウン項目・詳細隠し入力 | 001,002,003,020 | カバー(自動化済) |
| フロント挙動（JS #allCheck） | 一括オンオフ | 020 | カバー(自動化済) |
| フロント挙動（未選択alert中断・多重押下抑止） | 0件選択でalert中断（売却ボタン／キャンセルボタン双方） | 035,038 | 部分カバー(自動化予定/fixme・要実機)：035(売却)＋038(キャンセル＝対の異常系)。多重押下抑止は対象外(タイミング依存) |
| 処理フロー#3-4（buyOrderIds空／0正規化で空） | no_selection フラッシュ＋一覧リダイレクト | 030,031,037 | 部分カバー(自動化予定/fixme・未実行)：030/031(空)＋037(0正規化境界)。実行可能な自動化実体なし |
| 処理フロー#5（type分岐・不正値／欠損） | 不正種別フラッシュ＋一覧 | 032,033,036 | 部分カバー(自動化予定/fixme・未実行)：実行可能な自動化実体なし |
| 処理フロー#7-8（取得空＝RuntimeException） | not_registered フラッシュ | 034 | 部分カバー(自動化予定/fixme・未実行)：実行可能な自動化実体なし |
| 処理フロー#9（存在しないID混在でも空でなければ出力） | 一部存在でダウンロード | （観点行061＝手動/間接・要POST構築） | 未自動化(手動/間接)：存在ID＋非存在IDの混在POST構築が必要。010は正常な1件選択のみで本エッジを代表しない（E2E-M07-06-061 は未作成） |
| 処理フロー#11-13（ストリーム・ヘッダ・Content-Type/Disposition・ファイル名形式） | ダウンロード発火・ファイル名形式・応答ヘッダ | 010,012,014（発火・自動化済）／017（ファイル名形式 正規表現・自動化済）／015（Content-Type=octet-stream・手動/要確認） | 部分カバー：発火＋接頭辞＋ファイル名形式(7桁ID/_YmdHis/.csv)は自動化。Content-Type/Disposition はdownload API制約で手動/要確認。CSVストリーム内容は手動(091-095) |
| 処理フロー#12（接頭辞 sale/notSale 差し替え） | purchase_product_list_ / purchase_product_cancel_list_ | 011,013,017 | カバー(自動化済) |
| 集計条件（売却/非売却・キャンセル除外・JOIN・並び順・集約） | CSV行集合の中身（GROUP BY/ORDER BY/キャンセル除外） | 095（手動・CSV内容） | 手動(内容厳密検査)：手動ケース095に手順・期待値を明記（旧:ラベルのみ） |
| 出力列とデータの対応（見出し・空値・キャンセル数置換・9列・言語ID=1） | 列見出し「在庫増減数」/「キャンセル数」・列順・値 | 091（見出し差替・手動）／092（列順・値対応・手動） | 手動(内容厳密検査)：手動ケース091/092に手順・期待値を明記（旧:ラベルのみ） |
| エッジケース（一部のみ存在/明細0でヘッダのみ/文字コードBOM/区切り） | ダウンロード成否は010、ヘッダのみ/BOM/区切りはCSV内部 | 010（発火・自動化済）／093（ヘッダのみCSV・手動）／094（BOM/区切り/クォート・手動） | 一部カバー(発火)・残りは手動ケース093/094に明記 |
| 画面遷移（成功＝ダウンロード／失敗＝一覧へ） | ダウンロード発火・リダイレクト先URL | 010(自動化済),031,033(自動化予定/fixme) | 部分カバー：成功発火は自動化済、失敗リダイレクトは fixme |
| エラー処理（3メッセージ） | no_selection / not_registered / 不正type固定文言 | 030,034,032（＋036 type欠損） | 部分カバー(自動化予定/fixme・未実行)：3メッセージ全て fixme |
| 副作用（DB更新なし・成功時ログ・エラー時フラッシュ） | DB更新なし／ログ／フラッシュ | 030-034,036,037（フラッシュ） | DB更新なし＝対象外・ログ＝対象外・フラッシュは fixme(自動化予定) |
| ログ・監査（完了ログ・抑止対象） | 「買取商品一覧CSV出力完了.」等 | （対象外＝観測外） | 対象外(理由付き) |
| セッション（page_no でリダイレクト先決定） | リダイレクト先ページ番号（セッション値・無ければ1） | 016（手動/間接） | 部分カバー：リダイレクト発生は031/033(fixme)で確認予定だが、page_no厳密値（セッション値/既定1）は016で手動/間接。自動化実体なし |
| 権限・認可（管理ログイン要） | 未ログイン誘導（一覧URL／出力ルート） | 040,041 | カバー(自動化済)：040(一覧URL)＋041(出力ルート自体) |
| 排他制御・トランザクション（読み取りのみ） | 書き込みなし | （対象なし＝対象外） | 対象外(要件なし) |
| API／バッチ（扱わない） | — | — | 対象外(機能なし) |
| データベース検索条件（IT-23） | CSV抽出SQL（JOIN/sale_flg限定/キャンセル除外/集約/ORDER BY）は本機能内だが結果はCSV内容 | （CSV内容＝手動/間接、観点行062-082） | 手動/間接(CSV内容厳密検査)。検索条件UIは呼び出し元一覧へ委譲 |

未カバーはいずれも理由（CSV内容＝手動厳密検査・ログ＝観測外・DB更新なし・JSロード要実機・別機能委譲・タイミング依存）を明記済み。処理フローの各失敗分岐（空・0正規化・type欠損/不正・取得空）は独立ケースに分解した。**「カバー(自動化済)」は spec 実装済みで実行可能なケース、「部分カバー(自動化予定/fixme)」は `test.fixme`（未実行・要実機確認）を指し区別する**（codex指摘D是正：旧「カバー(fixme)」の過大主張を解消）。CSV内容（集計/列/ヘッダのみ/BOM/区切り）は手動ケース091-095に手順・期待値を materialize し、ラベルのみの状態を解消した。
