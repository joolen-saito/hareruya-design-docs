# A05-01（受注_直接印刷） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a05-01_api_order_print_direct.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a05-01_api_order_print_direct.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a05_01_api_order_print_direct_it_cases.md`（母集合 計90観点行）

本機能は画面を伴わない機能仕様（受注 直接印刷API。`GetRequest`＝スタック用紙の印刷情報XML送信／`SetResponse`＝印刷完了受注のステータス更新）であり、合否の**一次オラクルはDB副作用・API応答・ログ**とする。API/統合レイヤ＝Playwright `request` でエンドポイントへ送信し、HTTPステータス・Content-Type・応答本体（XML／空応答）・ダウンロード発火・DB副作用（受注ステータス`order_status_id`・`confirm_date`・`picking_date`・`browser_print_flg`／印刷ログファイル）で判定する。`SetResponse` のステータス更新等の副作用と `GetRequest` の不更新は**DB照会（送信前後の値比較）を一次オラクル**とし、管理画面（受注一覧・受注編集）の表示は人手確認用の**補助観測**に留める（画面なしAPIのためUIを一次合否オラクルにしない）。

**期待結果は仕様（設計書・観点表）由来**とし、実装のレスポンス形・フレームワーク既定挙動・Form制約・抽出SQLの現挙動を期待値に流用しない（オラクル独立性）。応答はJSONではなくXML（`GetRequest`）または空応答（`SetResponse`）であり、合否は**HTTPステータス・Content-Type・XML構造/値・受注ステータスの副作用**で判定する。実装からは位置情報（APIパス・メソッド・認証配置・抽出条件）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。設計書と実装の食い違いは付帯表4に出す（パス・メソッド・印刷ログ未実装・未定義status等）。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-18 | 帳票フォーマット定義（スタック用紙の印字レイアウト・フォント・文字サイズ・スタイル・色）＝物理印字の目視（手動） |
| IT-16 | 印刷情報送信・ステータス更新の実行結果／エラー（HTTPステータス・更新有無）。文字長境界は本機能に該当入力検証がなく対象外 |
| IT-27 | 印刷ログファイル出力（副作用）・配置先・同名・スキーマ・更新結果。JSON／ファイルのコピー・削除・移動は本機能に非該当（対象外） |
| IT-32 | `ConnectionType` 分岐・リクエスト（異常パラメータ・想定外項目）・資格情報 |
| IT-24 | `GetRequest` のXML出力内容（各印字欄の値が受注と一致）・実行結果・認可（手動）・文字長境界（対象外） |
| IT-17 | `SetResponse` の分岐（直接印刷結果偽・要素なし・受注不存在）・印刷済み更新・例外（手動） |
| IT-33 | 参照系機能（`GetRequest` は受注を更新しない）・対象機能識別・更新結果 |
| IT-09 | HTTPステータス・実行結果・リクエスト正常／認可 |
| IT-19 | 同時実行数の制限（本エンドポイントに同時実行制限・レート制限の仕様/実装がなく対象外） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-001	IT-09	HTTPステータス	P1	GetRequestで印刷対象ありのとき正常応答ステータスが返る	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	"ConnectionType=GetRequest
base_info_id=対象拠点ID"	"1. /api/order/prints/direct/{base_info_id} へ ConnectionType=GetRequest でPOST送信する
2. HTTPステータスを確認する"	HTTPステータスが200（成功）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-002	IT-09	実行結果	P1	GetRequestの応答Content-Typeがapplication/octet-streamである	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. 応答ヘッダのContent-Typeを確認する"	応答のContent-Typeが application/octet-stream であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-003	IT-24	フォーマット定義	P2	GetRequestの応答本体がPrintRequestInfoルート要素（Version属性）で構成される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのルート要素を確認する"	応答本体のルート要素が PrintRequestInfo（Version属性付き）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-004	IT-24	出力内容	P1	GetRequestで対象受注ごとにePOSPrint要素が生成される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（対象3件）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのePOSPrint要素数を確認する"	PrintRequestInfo配下に印刷対象受注の件数分のePOSPrint要素が並ぶこと。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-005	IT-24	出力内容	P2	ePOSPrintのprintjobidに受注IDが設定される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. ePOSPrint/Parameter/printjobid を確認する"	各ePOSPrintのprintjobidが対象受注の受注IDと一致すること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-006	IT-24	出力内容	P2	印字欄（注文番号・お客様名・合計金額）の値が受注データと一致する	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（既知受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. PrintDataの注文番号・お客様名・合計金額欄を確認する"	注文番号・お客様名・合計金額の各印字欄がSEEDで投入した受注の値と一致すること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-007	IT-24	出力内容	P2	注文詳細URLのQRコードとスマレジコードのバーコードが出力される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（既知受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. PrintDataのsymbol(qrcode)とbarcode(jan13)を確認する"	注文詳細URLのQRコードと、スマレジコードを値に持つJAN13バーコードが出力されること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-008	IT-24	出力内容	P2	お客様名欄は氏名カナを優先し、カナが無ければ氏名を出力する	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（カナあり受注・カナなし受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. カナあり・カナなし各受注のお客様名欄を確認する"	お客様名欄がカナあり受注は氏名カナ、カナなし受注は氏名で出力されること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-009	IT-24	出力内容	P2	スムーズ店頭受取の受注は合計金額欄が「スムーズ店頭受取」文言になる	SEED-A05-01-BASEINFO／SEED-A05-01-SMOOTH-OTC	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. スムーズ店頭受取受注の合計金額欄を確認する"	スムーズ店頭受取の受注の合計金額欄が金額ではなく「スムーズ店頭受取」の文言であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-010	IT-24	出力内容	P1	印刷対象受注が無い場合は200で空のデータを返す	SEED-A05-01-BASEINFO／SEED-A05-01-NO-TARGET	ConnectionType=GetRequest	"1. 印刷対象0件の状態で ConnectionType=GetRequest でPOST送信する
2. HTTPステータスと応答本体を確認する"	HTTPステータスが200で、応答本体が空のデータ（印刷情報XMLを持たない）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-011	IT-16	実行結果	P2	印刷対象は最大10件までに制限される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（対象11件以上）	ConnectionType=GetRequest	"1. 印刷対象11件以上の状態で ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのePOSPrint要素数を確認する"	ePOSPrint要素が最大10件までで、11件目以降が含まれないこと。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-012	IT-16	実行結果	P3	店頭受取・注文受領・注文番号あり・スマレジコードありの受注が抽出される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. 抽出条件に合致する受注を用意し ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLに当該受注が含まれるか確認する"	抽出条件（店頭受取・注文受領・注文番号あり・スマレジコードあり）を満たす受注が応答に含まれること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-013	IT-16	実行結果	P3	ブラウザ印刷フラグが立つ受注も印刷対象に含まれる	SEED-A05-01-BASEINFO／SEED-A05-01-BROWSER-FLG	ConnectionType=GetRequest	"1. ブラウザ印刷フラグが立つ受注を用意し ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLに当該受注が含まれるか確認する"	ブラウザ印刷フラグが立つ受注が印刷対象として応答に含まれること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-014	IT-24	出力内容	P2	店頭注文番号欄の値が店頭注文番号（dtb_order_number.value）と一致する	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（店頭注文番号既知受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. PrintDataの店頭注文番号欄を確認する"	店頭注文番号欄がSEEDで投入した店頭注文番号（dtb_order_number.value）と一致すること（実装は受注のorder_numberを出力する乖離があり仕様どおり期待し失敗で検出＝付帯表4#9。印字部の正確な行は要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-015	IT-24	出力内容	P2	注文日欄の値が受注の注文日（order_date）と一致する	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（注文日既知受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. PrintDataの注文日欄を確認する"	注文日欄がSEEDで投入した受注の注文日（order_date）と一致すること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-016	IT-24	出力内容	P3	問い合わせ有無欄が受注の問い合わせ有無に対応した表示になる	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET（問い合わせ有り受注・無し受注）	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. 問い合わせ有り・無し各受注のPrintDataの問い合わせ有無欄を確認する"	問い合わせ有無欄が受注の問い合わせ有無に対応して出力されること（チェック欄の正確な対応欄は要実機確認＝付帯表4#4）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-017	IT-16	実行結果	P2	スムーズ店頭受取の全抽出条件を満たす受注が印刷対象に抽出される（正常）	SEED-A05-01-BASEINFO／SEED-A05-01-SMOOTH-OTC	ConnectionType=GetRequest	"1. スムーズ店頭受取で抽出条件を全て満たす受注を用意し ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのePOSPrintに当該受注が含まれるか確認する"	スムーズ店頭受取（所定支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり）の全条件を満たす受注が応答のePOSPrintに含まれること（抽出条件は設計の処理フローGetRequest#2を期待値とする。実装の支店版に当該条件が無い場合は付帯表4#7で検出）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-018	IT-16	実行結果	P2	スムーズ店頭受取で確定済み（confirm_date設定済み）の受注は抽出されない（異常）	SEED-A05-01-BASEINFO／SEED-A05-01-SMOOTH-OTC	ConnectionType=GetRequest	"1. スムーズ店頭受取で確定済み（confirm_date設定済み）の受注を用意し ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのePOSPrintに当該受注が含まれないか確認する"	抽出条件「未確定（confirm_date未設定）」を満たさない確定済み受注が応答のePOSPrintに含まれないこと（017の正常に対する異常対）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-019	IT-16	実行結果	P2	スムーズ店頭受取でスマレジコードなしの受注は抽出されない（異常）	SEED-A05-01-BASEINFO／SEED-A05-01-SMOOTH-OTC	ConnectionType=GetRequest	"1. スムーズ店頭受取でスマレジコードなしの受注を用意し ConnectionType=GetRequest でPOST送信する
2. 応答本体XMLのePOSPrintに当該受注が含まれないか確認する"	抽出条件「スマレジコードあり」を満たさないスマレジコードなし受注が応答のePOSPrintに含まれないこと（017の正常に対する異常対）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-020	IT-33	参照系機能	P2	GetRequestは受注ステータスを更新しない（参照系・DB照会で前後不変）	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. 対象受注の受注ステータス(order_status_id)をDB照会で記録する
2. ConnectionType=GetRequest でPOST送信する
3. 対象受注の受注ステータス(order_status_id)をDB照会で再取得する（管理画面の受注一覧表示は補助観測）"	GetRequest実行後も対象受注の受注ステータス(order_status_id)が送信前と同一（未印刷のまま）であること（一次オラクル＝DB照会の前後比較。管理画面表示は補助観測）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-030	IT-09	HTTPステータス	P1	SetResponseの正常受信でHTTP200が返る	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=ServerDirectPrint=true かつ ePOSPrint(printjobid=受注ID) を含むXML"	"1. ConnectionType=SetResponse・ResponseFile付きでPOST送信する
2. HTTPステータスを確認する"	HTTPステータスが200であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-031	IT-09	実行結果	P1	SetResponseの応答本体は空（本文長0）である	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	ConnectionType=SetResponse／正常なResponseFile	"1. ConnectionType=SetResponse でPOST送信する
2. 応答本体の長さを確認する"	応答本体が空（本文長0）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-032	IT-16	エラー	P2	ResponseFileのXML解析失敗時は受注ステータスを更新しない	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=不正なXML文字列"	"1. 不正なXMLのResponseFileでPOST送信する
2. 対象受注のステータスを確認する"	更新が行われず受注ステータスが送信前と同一（不変）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-033	IT-16	実行結果	P2	直接印刷結果が偽の場合は更新せず200空本文を返す	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=ServerDirectPrint=false のXML"	"1. ServerDirectPrint=false のResponseFileでPOST送信する
2. 対象受注のステータスと応答を確認する"	更新が行われず受注ステータスが不変で、HTTP200・空本文が返ること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-034	IT-17	フォーマット定義	P2	印刷結果要素が1件も無い場合は更新せず200空本文を返す	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=ePOSPrint要素を持たないXML"	"1. ePOSPrint要素なしのResponseFileでPOST送信する
2. 対象受注のステータスと応答を確認する"	更新が行われず受注ステータスが不変で、HTTP200・空本文が返ること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-035	IT-17	フォーマット定義	P2	受注が見つからない要素はスキップし他要素の処理を継続する	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=存在しない受注IDと存在する受注IDのprintjobidを混在させたXML"	"1. 不存在・存在の受注IDを混在させたResponseFileでPOST送信する
2. 存在受注のステータスと応答を確認する"	不存在の受注要素は飛ばされ、存在する受注はピック中へ更新され、HTTP200が返ること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-036	IT-24	実行結果	P2	printjobidの先頭部分から受注IDを取り出して対象受注を特定する	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=printjobid=「{受注ID}_{連番}」形式のXML"	"1. printjobidが「受注ID_連番」形式のResponseFileでPOST送信する
2. 受注IDで特定された受注のステータスを確認する"	printjobidの先頭部分の受注IDで特定された受注がピック中へ更新されること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-037	IT-09	実行結果	P1	SetResponseの応答Content-Typeがtext/xml; charset=utf-8である	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
正常なResponseFile"	"1. ConnectionType=SetResponse でPOST送信する
2. 応答ヘッダのContent-Typeを確認する"	応答のContent-Typeが text/xml; charset=utf-8 であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-038	IT-16	実行結果	P2	ResponseFileのXML解析失敗時もHTTP200を返す	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=不正なXML文字列"	"1. 不正なXMLのResponseFileでPOST送信する
2. HTTPステータスを確認する"	HTTPステータスが200であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-039	IT-16	実行結果	P2	ResponseFileのXML解析失敗時も応答本体は空である	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	"ConnectionType=SetResponse
ResponseFile=不正なXML文字列"	"1. 不正なXMLのResponseFileでPOST送信する
2. 応答本体の長さを確認する"	応答本体が空（本文長0）であること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-040	IT-33	更新結果	P1	SetResponseで該当受注のステータスがピック中へ更新される（DB照会）	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	ConnectionType=SetResponse／ブラウザ印刷フラグなし受注の正常ResponseFile	"1. ConnectionType=SetResponse でPOST送信する
2. 対象受注の受注ステータス(order_status_id)をDB照会で確認する（管理画面の受注一覧表示は補助観測）"	対象受注の受注ステータス(order_status_id)がピック中（OrderStatus::PICKING）へ更新されること（一次オラクル＝DB照会。管理画面表示は補助観測）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-041	IT-17	実行結果	P1	ブラウザ印刷フラグが立つ受注はフラグを倒すのみでステータスは不変（DB照会）	SEED-A05-01-BASEINFO／SEED-A05-01-BROWSER-FLG	ConnectionType=SetResponse／ブラウザ印刷フラグが立つ受注のResponseFile	"1. ブラウザ印刷フラグが立つ受注のResponseFileでPOST送信する
2. 対象受注のbrowser_print_flgと受注ステータス(order_status_id)をDB照会で確認する（管理画面表示は補助観測）"	対象受注のbrowser_print_flgが倒れ（false）、受注ステータス(order_status_id)はピック中へ更新されず送信前と同一であること（一次オラクル＝DB照会。管理画面表示は補助観測）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-042	IT-27	実行結果	P2	ブラウザ印刷フラグなし受注のステータス更新時に確定日時へ現在時刻が設定される（DB照会）	SEED-A05-01-BASEINFO／SEED-A05-01-RESPONSEFILE	ConnectionType=SetResponse／ブラウザ印刷フラグなし受注のResponseFile	"1. ConnectionType=SetResponse でPOST送信する
2. 対象受注の確定日時(confirm_date)をDB照会で確認する（管理画面の受注編集表示は補助観測）"	ブラウザ印刷フラグなし受注の確定日時(confirm_date)に更新実行時点の日時が設定されること（一次オラクル＝DB照会。管理画面表示は補助観測。設計は本店/支店の別なくブラウザ印刷フラグなし受注一般に確定日時を設定する。実装が本店受注に限定する場合は乖離＝要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-050	IT-32	資格情報	P2	ConnectionTypeがどちらにも一致しない場合は本文を返さない	SEED-A05-01-BASEINFO	ConnectionType=想定外の値（GetRequest/SetResponse以外）	"1. ConnectionTypeに想定外の値を指定してPOST送信する
2. 応答本体を確認する"	いずれの分岐の処理も行われず、応答本体を返さない（空本文）こと（設計のレスポンス（失敗）は「（応答なし）応答を組み立てず本文を返さない」とのみ定める。実装がHTTP400+text/plainの応答を組み立てる場合は「応答を組み立てない」に反する乖離＝不具合候補・付帯表4#5。HTTPステータスは正典が規定しないため固定せず空本文のみを仕様判定とし、期待ステータスは要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-052	IT-32	リクエスト	P3	異常なパラメータ値で実行しても仕様どおりの結果となる	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest／不正な付随パラメータ値	"1. 印刷対象ありの状態で異常なパラメータ値を加えて ConnectionType=GetRequest でPOST送信する
2. 応答と後続状態を確認する"	未定義のエラー応答を組み立てず、印刷対象が存在するため印刷情報XML（GetRequest仕様）が正常に応答されること（対象あり前提に一意化。対象なしの場合は空応答だが本ケースは対象ありで判定する）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-053	IT-32	リクエスト	P3	想定外の項目を加えても処理が停止しない	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest／想定外の項目（項目名と値）を追加	"1. 想定外の項目を加えて ConnectionType=GetRequest でPOST送信する
2. 応答を確認する"	想定外項目があっても処理が停止せず、GetRequestの印刷情報XMLが正常に応答されること。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-060	IT-27	ファイル出力	P2	GetRequestで生成した印刷情報XMLが印刷ログファイルへ書き出される	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	ConnectionType=GetRequest	"1. ConnectionType=GetRequest でPOST送信する
2. 印刷ログ保存ディレクトリ（var/log/print_logs/配下）を確認する"	印刷情報が空でない場合、印刷情報のXMLがタイムスタンプ・一意名付きで var/log/print_logs/ 配下に書き出されること（実装は当該処理が未実装＝付帯表4#3。仕様どおり失敗で検出見込み・要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-061	IT-27	実行結果	P3	印刷対象が無い場合は印刷ログファイルを書き出さない	SEED-A05-01-BASEINFO／SEED-A05-01-NO-TARGET	ConnectionType=GetRequest	"1. 印刷対象0件で ConnectionType=GetRequest でPOST送信する
2. 印刷ログ保存ディレクトリを確認する"	印刷情報が空のため印刷ログファイルが新規に書き出されないこと（要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-062	IT-18	フォーマット定義	P2	スタック用紙の印字レイアウト・フォント・文字サイズ・色が帳票設計書の定義と一致する	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET／実機プリンタ	ConnectionType=GetRequest	"1. ConnectionType=GetRequest で印刷情報を取得する
2. 実機プリンタでスタック用紙を印字し目視確認する"	スタック用紙の印字レイアウト・フォント・文字サイズ・文字色が帳票設計書に定義された印字仕様と一致すること（物理印字の目視＝手動・要実機確認）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-063	IT-09	HTTPステータス	P2	認証なしで印刷情報取得・ステータス更新を実行できる	SEED-A05-01-BASEINFO／SEED-A05-01-PRINT-TARGET	jwt-tokenヘッダなし・未認証のリクエスト	"1. 認証ヘッダなしで ConnectionType=GetRequest／SetResponse でPOST送信する
2. 応答と認可拒否の有無を確認する"	認証判定を持たず、未認証でも印刷情報取得・ステータス更新が実行でき、HTTP401の認証拒否を返さないこと（認可方式・到達制御は要実機確認・付帯表4#6）。				
a05-01_api_order_print_direct（API_受注_直接印刷）	E2E-A05-01-064	IT-17	実行結果	P3	印刷情報生成・データ取得・ファイル書き出し中の例外は共通例外処理に委ねる	SEED-A05-01-BASEINFO	例外を誘発する状態（データ取得失敗・書き出し失敗）	"1. 例外を誘発する状態で ConnectionType=GetRequest でPOST送信する
2. 応答を確認する"	例外発生時は共通例外処理に委ね、HTTP500相当の応答となること（例外の実再現は要実機確認・手動）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

実装（移行先 ec-cube-enterprise）の実効エンドポイントは `#[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]`（`src/Eccube/Controller/App/OrderController.php:43`）。`OrderDirectPrintAction`・`UpdatePrintedOrderStatusAction` の実在配置は `src/Eccube/Service/Admin/Order/` 配下を推定とし、正確なファイルパスは要実機確認（以降の Action 参照は file:line の簡易表記。`OrderRepository` は `src/Eccube/Repository/` 配下を推定）。`ConnectionType` 分岐＝`OrderController.php:46-89`。`GetRequest` の印刷情報生成＝`OrderDirectPrintAction.php:37-169`（本店/支店判定 `OrderDirectPrintAction.php:42-48`、抽出 `OrderRepository::getDirectPrintOrderList`＝`OrderRepository.php:1550`／`getPrintOrderListMainShop`＝`OrderRepository.php:1493`、LIMIT 10＝`OrderRepository.php:1593`）。`SetResponse` のステータス更新＝`UpdatePrintedOrderStatusAction.php:44-109`（解析失敗 `:48-54`、ServerDirectPrint=false/要素なし `:55-59`、受注不存在スキップ `:82-86`、browser_print_flg分岐 `:87-98`、ピック中=`OrderStatus::PICKING`＝`Master/OrderStatus.php:49`、確定日/ピック日 `:91-97`）。Content-Type＝`OrderController.php:73`（octet-stream）／`:86`（text/xml）。

**設計書のパス `GET/POST /order/print/direct` と実装パス `POST /api/order/prints/direct/{base_info_id}` は不一致（/apiプレフィックス・prints複数形・base_info_id必須パスパラメータ・POSTのみ）。送信先パスは実装の実効パス `POST /api/order/prints/direct/{base_info_id}` 一本に統一し、`GetRequest`/`SetResponse` の別はクエリ/ボディの `ConnectionType` で表す。合否は設計書の意味（成功＝HTTPステータス／応答形式、副作用＝印刷ログ書出・受注ステータス更新）で判定し、TSV期待値に設計パスを混在させない。設計⇔実装の差異は付帯表4でのみ一元管理する。**

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A05-01-001/002 | E2E自動化(API/統合) | `POST /api/order/prints/direct/{base_info_id}`＋ConnectionType=GetRequest（OrderController.php:43,46-48）／Content-Type octet-stream（OrderController.php:73） | レスポンス（成功）GetRequest 200/application/octet-stream／IT-09 | IT-A05-01-...-012,030 相当 |
| E2E-A05-01-003/004/005/006/007/008/009 | E2E自動化(API/統合) | 応答本体XML（OrderDirectPrintAction.php:80-169：PrintRequestInfo/ePOSPrint/printjobid/PrintData） | レスポンス（成功）XML構造・処理フローGetRequest#3／IT-24 | IT-A05-01-...-035,044,070,046 相当 |
| E2E-A05-01-014/015/016 | E2E自動化(API/統合) | PrintData店頭注文番号欄：実装位置＝受注 `order_number`（OrderDirectPrintAction.php:77,97）／設計要求＝店頭注文番号 `dtb_order_number.value`。両者は取得元が異なり乖離（付帯表4#9）。期待値は設計要求の `dtb_order_number.value`／注文日欄＝order_date／問い合わせ有無のチェック欄（OrderDirectPrintAction.php:101-143・正確な対応欄は要実機確認＝付帯表4#4） | 処理フローGetRequest#3「注文日・店頭注文番号・問い合わせ有無を組み立て」・レスポンスXML PrintData／IT-24 | IT-A05-01-...-045,066,067 相当 |
| E2E-A05-01-010 | E2E自動化(API/統合) | 対象なし→空文字（OrderDirectPrintAction.php:50-52） | 処理フローGetRequest#4・レスポンス（失敗）200空データ／IT-24 | IT-A05-01-...-023,050 相当 |
| E2E-A05-01-011 | E2E自動化(API/統合) | LIMIT 10（OrderRepository.php:1593／getPrintOrderListMainShop 同等） | 処理フローGetRequest#2「最大10件」／IT-16 | IT-A05-01-...-047 相当 |
| E2E-A05-01-012/013/017/018/019 | E2E自動化(API/統合) | 抽出条件（OrderRepository.php:1568-1592：店頭受取OTC・注文受領NEW・order_number/smaregi_code・browser_print_flg）。スムーズ店頭受取の細条件（所定支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり）は設計処理フローGetRequest#2を期待値とし、支店版に当該条件が見当たらず本店側のみの疑い＝付帯表4#7 | 処理フローGetRequest#2 抽出条件・DBカラム抽出条件／IT-16 | IT-A05-01-...-012,018,019 相当 |
| E2E-A05-01-020 | E2E自動化(API/統合) | 受注ステータス(order_status_id)のDB照会で送信前後の値を比較（管理画面受注一覧の表示は補助観測。表示セレクタ要実機確認） | データ整合性「GetRequestは受注ステータスを更新しない」／IT-33 | IT-A05-01-...-075 相当 |
| E2E-A05-01-030/031/037 | E2E自動化(API/統合) | ConnectionType=SetResponse→200（030）/text/xml（037）・空本文（031）（OrderController.php:76-88） | レスポンス（成功）SetResponse 200/text/xml/本文長0／IT-09 | IT-A05-01-...-085 相当 |
| E2E-A05-01-032/033/034/038/039 | E2E自動化(API/統合) | 解析失敗（UpdatePrintedOrderStatusAction.php:48-54）／ServerDirectPrint=false・要素なし（:55-59）。解析失敗時の更新なし（032）・HTTP200（038）・空本文（039） | 処理フローSetResponse#2,#3・エラー処理／IT-16/IT-17 | IT-A05-01-...-024,025,052 相当 |
| E2E-A05-01-035 | E2E自動化(API/統合) | 受注不存在スキップ（UpdatePrintedOrderStatusAction.php:82-86） | 処理フローSetResponse#4・エラー処理「飛ばして次へ」／IT-17 | IT-A05-01-...-026,080 相当 |
| E2E-A05-01-036 | E2E自動化(API/統合) | printjobid先頭部抽出（UpdatePrintedOrderStatusAction.php:79） | 処理フローSetResponse#4・XML printjobid＝受注特定／IT-24 | IT-A05-01-...-055,060 相当 |
| E2E-A05-01-040 | E2E自動化(API/統合) | 受注ステータス(order_status_id)＝ピック中（OrderStatus::PICKING=10／Master/OrderStatus.php:49）をDB照会で確認（管理画面受注一覧の表示は補助観測。表示セレクタ要実機確認） | 処理フローSetResponse#5・副作用「ピック中へ更新」／IT-33 | IT-A05-01-...-031,076 相当 |
| E2E-A05-01-041 | E2E自動化(API/統合) | browser_print_flg・order_status_idのDB照会（browser_print_flg分岐＝UpdatePrintedOrderStatusAction.php:87-88。管理画面表示は補助観測。フラグ表示セレクタ要実機確認） | 処理フローSetResponse#5「フラグを倒すだけ」／IT-17 | IT-A05-01-...-028 相当 |
| E2E-A05-01-042 | E2E自動化(API/統合) | 確定日時(confirm_date)/ピック開始日(picking_date)のDB照会（UpdatePrintedOrderStatusAction.php:91-97。管理画面受注編集の表示は補助観測。日時セレクタ要実機確認） | 副作用「確定日時に現在時刻」・DBカラムconfirm_date/picking_date／IT-27 | IT-A05-01-...-031 相当 |
| E2E-A05-01-050 | E2E自動化(API/統合)（要実機確認: 未一致時HTTPステータス） | ConnectionType不一致（OrderController.php:48,76→91-96。実装は400+text/plainだが設計は本文を返さない＝付帯表4#5） | エラー処理「応答を組み立てない」・レスポンス（失敗）（応答なし）／IT-32 | IT-A05-01-...-010,037,064 相当 |
| E2E-A05-01-052/053 | E2E自動化(API/統合) | GetRequest分岐（OrderController.php:48）。想定外項目・異常値は応答を組み立てない範囲 | バリデーション「フォーム型/マスタ存在チェックを行わない」・リクエスト／IT-32 | IT-A05-01-...-088,089 相当 |
| E2E-A05-01-060/061 | 手動（要実機確認・印刷ログ未実装） | 印刷ログ書出ブロックがコメントアウト（OrderController.php:57-67 `// TODO :後ほど対応`） | 処理フローGetRequest#5・副作用「印刷ログ書出 var/log/print_logs/」／IT-27 | IT-A05-01-...-029,056,081,083 相当 |
| E2E-A05-01-062 | 手動（要実機確認・物理印字目視） | スタック用紙の印字レイアウト（OrderDirectPrintAction.php:80-149 の text/rectangle/position/barcode） | 帳票フォーマット定義（レイアウト/フォント/文字サイズ/色）／IT-18 | IT-A05-01-...-001〜006 相当 |
| E2E-A05-01-063 | 手動（要実機確認・認可方式） | route `/api/order/...` は JWT firewall `^/api/v1/`（security.yaml:33）に非該当、default `^/`（security.yaml:71）配下でaccess_control未定義 | 認証・認可「認証処理を行わない／401を返さない」・権限認可／IT-09 | IT-A05-01-...-021,022,032,048,049,086 相当 |
| E2E-A05-01-064 | 手動（要実機確認・例外実再現） | 共通例外処理（OrderDirectPrintAction.php throws \Exception／UpdatePrintedOrderStatusAction.php:104-108 rollback+rethrow） | エラー処理「印刷情報生成・データ取得・書出中の例外＝HTTP500相当」／IT-17 | IT-A05-01-...-027 相当 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（前提・操作・期待が「対象ファイルと処理条件を指定する」「ファイル処理を実行する」等の汎用文）であり、機能固有のシナリオを持たない。本E2Eは設計書本文（利用者視点の入口・処理フロー・入出力・データ整合性・副作用・エラー処理・認証認可）を一次情報源として両レイヤを網羅し、各母集合行を付帯表2bで分類・トレースした。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `a05_01_api_order_print_direct_it_cases.md` の関連ID件数（IT-18=6／IT-16=12／IT-27=15／IT-32=3／IT-24=41／IT-17=3／IT-33=6／IT-09=3／IT-19=1＝計90）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。本機能は画面なしAPIのため一次合否オラクルをUIに置かず、副作用は全てDB照会・API応答・ログを一次オラクルとし、管理画面表示は補助観測に留める（`自動化(UI)` は一次オラクルとしては0件）。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-18 | 6 | 0 | 0 | 6 | 0 | 帳票レイアウト/フォント/文字サイズ/スタイル/色は物理印字の目視＝手動 |
| IT-16 | 12 | 0 | 8 | 0 | 4 | 送信・更新の実行結果/エラーはAPI/統合。文字長境界4件は本機能に該当入力検証がなく対象外（理由付き） |
| IT-27 | 15 | 0 | 6 | 4 | 5 | 印刷ログ出力/配置先/同名は手動、XML応答/更新結果（確定日時はDB照会）はAPI/統合。JSON・ファイルのコピー/削除/移動5件は非該当で対象外 |
| IT-32 | 3 | 0 | 3 | 0 | 0 | ConnectionType分岐・異常パラメータ・想定外項目 |
| IT-24 | 41 | 0 | 32 | 6 | 3 | XML出力内容/実行結果はAPI/統合、認可6件は手動、文字長境界3件は対象外 |
| IT-17 | 3 | 0 | 2 | 1 | 0 | 印刷済み更新（ステータス/フラグはDB照会）はAPI/統合、要素なし/不存在はAPI、例外は手動 |
| IT-33 | 6 | 0 | 6 | 0 | 0 | 参照系で受注不変（DB照会前後比較）・対象機能/更新結果はAPI/統合 |
| IT-09 | 3 | 0 | 2 | 1 | 0 | HTTPステータス/リクエスト正常はAPI、認可は手動 |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 本エンドポイントに同時実行数制限・レート制限の仕様/実装がなく対象外（排他制御「明示的ロックを設けない」） |
| 合計 | 90 | 0 | 59 | 18 | 13 | **未分類 0** |

注1: 対象外13件の内訳＝IT-16 文字長境界4件（014,015,016,017：本機能はフォーム型/文字長検証を行わない＝バリデーション節）／IT-27 JSON・入力JSON・ファイルのコピー/削除/移動5件（071,072,073,080,082：応答はXML・空応答、ファイル操作は本機能に非該当）／IT-24 文字長境界3件（053,054,059）／IT-19 同時実行数制限1件（090）。いずれも理由付きで放置ではない。

注2: 認証・認可・印刷ログ副作用・例外・帳票物理印字は「画面/APIレスポンスに直接現れない、または実機/外部依存」のため手動（要実機確認）に置き、自動化したことにしていない。印刷ログ書出は実装が未実装（付帯表4#3）だが、仕様は副作用を定めるため対象外にせず手動（要実機確認）＝仕様どおり期待し失敗で検出する方針とした。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-18 | フォーマット定義 | 手動 | 062（帳票印字目視） |
| 002 | IT-18 | フォーマット定義 | 手動 | 062 |
| 003 | IT-18 | フォーマット定義 | 手動 | 062 |
| 004 | IT-18 | フォーマット定義 | 手動 | 062 |
| 005 | IT-18 | フォーマット定義 | 手動 | 062 |
| 006 | IT-18 | フォーマット定義 | 手動 | 062 |
| 007 | IT-16 | 実行結果 | 自動化(API/統合) | 030（ステータス更新の実行結果） |
| 008 | IT-27 | 実行結果 | 自動化(API/統合) | 003（計算処理＝再計算なしのXML応答） |
| 009 | IT-27 | 出力失敗 | 手動（要実機確認） | 064（書き出し失敗/例外500実再現） |
| 010 | IT-32 | 資格情報 | 自動化(API/統合) | 050（ConnectionType分岐） |
| 011 | IT-16 | 実行結果 | 自動化(API/統合) | 032（ResponseFile） |
| 012 | IT-16 | 実行結果 | 自動化(API/統合) | 017（スムーズ店頭受取 全条件満たす→抽出） |
| 013 | IT-16 | 実行結果 | 自動化(API/統合) | 018/019（スムーズ店頭受取 条件外→非抽出） |
| 014 | IT-16 | 実行結果（最大長） | 対象外 | 本機能に文字長入力検証がない（バリデーション節） |
| 015 | IT-16 | 実行結果（最大長+1） | 対象外 | 同上 |
| 016 | IT-16 | 実行結果（最小長） | 対象外 | 同上 |
| 017 | IT-16 | 実行結果（最小長-1） | 対象外 | 同上 |
| 018 | IT-16 | 実行結果 | 自動化(API/統合) | 004（受注ごとePOSPrint） |
| 019 | IT-16 | 実行結果 | 自動化(API/統合) | 005（printjobid） |
| 020 | IT-16 | 実行結果 | 自動化(API/統合) | 010（対象なし/検索） |
| 021 | IT-24 | 実行結果 | 手動（要実機確認） | 063（認可・呼出クライアント照合） |
| 022 | IT-24 | 実行結果 | 手動（要実機確認） | 063 |
| 023 | IT-24 | 実行結果 | 自動化(API/統合) | 010（対象なし） |
| 024 | IT-16 | エラー | 自動化(API/統合) | 032（解析失敗） |
| 025 | IT-24 | フォーマット定義 | 自動化(API/統合) | 033（直接印刷結果偽） |
| 026 | IT-17 | フォーマット定義 | 自動化(API/統合) | 035（受注不存在） |
| 027 | IT-17 | フォーマット定義 | 手動（要実機確認） | 064（例外500実再現） |
| 028 | IT-17 | フォーマット定義 | 自動化(API/統合) | 040/041（印刷済み更新＝DB照会で受注ステータス/browser_print_flg。管理画面は補助観測） |
| 029 | IT-27 | 実行結果 | 手動（要実機確認） | 060（印刷ログ書出・未実装） |
| 030 | IT-27 | 実行結果 | 自動化(API/統合) | 001/004（GetRequest送信） |
| 031 | IT-27 | 実行結果 | 自動化(API/統合) | 042（SetResponse更新結果・確定日時＝DB照会 confirm_date。管理画面は補助観測） |
| 032 | IT-24 | 実行結果 | 手動（要実機確認） | 063（認可） |
| 033 | IT-27 | 実行結果 | 自動化(API/統合) | 036（更新対象＝printjobid特定） |
| 034 | IT-27 | エラー | 自動化(API/統合) | 032（更新方法/解析失敗） |
| 035 | IT-24 | フォーマット定義 | 自動化(API/統合) | 003（計算処理） |
| 036 | IT-24 | フォーマット定義 | 自動化(API/統合) | 031（応答値） |
| 037 | IT-24 | フォーマット定義 | 自動化(API/統合) | 050（ConnectionType） |
| 038 | IT-24 | フォーマット定義 | 自動化(API/統合) | 030（ResponseFile） |
| 039 | IT-24 | フォーマット定義 | 自動化(API/統合) | 001（GetRequest） |
| 040 | IT-24 | 出力内容 | 自動化(API/統合) | 001（参照時点） |
| 041 | IT-24 | 出力内容 | 自動化(API/統合) | 003（更新の有無） |
| 042 | IT-24 | 出力内容 | 自動化(API/統合) | 036（取得と更新の一致） |
| 043 | IT-24 | 出力内容 | 自動化(API/統合) | 003（印刷とステータスの関係＝XML出力） |
| 044 | IT-24 | 出力内容 | 自動化(API/統合) | 006（受注dtb_order値） |
| 045 | IT-24 | 出力内容 | 自動化(API/統合) | 014（店頭注文番号欄＝dtb_order_number.value・付帯表4#9検出） |
| 046 | IT-24 | 出力内容 | 自動化(API/統合) | 008（お客様名カナ優先） |
| 047 | IT-24 | 出力内容 | 自動化(API/統合) | 011（検索/最大10件） |
| 048 | IT-24 | 出力内容 | 手動（要実機確認） | 063（店頭プリンタ認可） |
| 049 | IT-24 | 出力内容 | 手動（要実機確認） | 063（その他クライアント認可） |
| 050 | IT-24 | 出力内容 | 自動化(API/統合) | 010（対象なし） |
| 051 | IT-24 | 出力内容 | 自動化(API/統合) | 032（解析失敗） |
| 052 | IT-24 | 出力内容 | 自動化(API/統合) | 033（直接印刷結果偽） |
| 053 | IT-24 | 出力内容（最大長） | 対象外 | 本機能に文字長入力検証がない |
| 054 | IT-24 | 出力内容（最小長） | 対象外 | 同上 |
| 055 | IT-24 | 出力内容 | 自動化(API/統合) | 036（印刷済み更新＝特定） |
| 056 | IT-24 | 出力内容 | 手動（要実機確認） | 060（印刷ログ書出・未実装） |
| 057 | IT-24 | 出力内容 | 自動化(API/統合) | 001（GetRequest送信） |
| 058 | IT-24 | 出力内容 | 自動化(API/統合) | 030（SetResponse更新） |
| 059 | IT-24 | 出力内容（最大長） | 対象外 | 認可＋文字長境界＝本機能に該当入力検証がない |
| 060 | IT-24 | 出力内容 | 自動化(API/統合) | 036（更新対象） |
| 061 | IT-24 | 出力内容 | 自動化(API/統合) | 030（更新方法） |
| 062 | IT-24 | 出力内容 | 自動化(API/統合) | 003（計算処理） |
| 063 | IT-24 | 出力内容 | 自動化(API/統合) | 031（応答値） |
| 064 | IT-24 | 出力内容 | 自動化(API/統合) | 050（ConnectionType） |
| 065 | IT-24 | 出力内容 | 自動化(API/統合) | 030（ResponseFile） |
| 066 | IT-24 | 出力内容 | 自動化(API/統合) | 015（注文日欄＝order_date） |
| 067 | IT-24 | 出力内容 | 自動化(API/統合) | 016（問い合わせ有無欄・付帯表4#4） |
| 068 | IT-24 | 出力内容 | 自動化(API/統合) | 003（更新の有無） |
| 069 | IT-24 | 出力内容 | 自動化(API/統合) | 036（取得と更新の一致） |
| 070 | IT-24 | 出力内容 | 自動化(API/統合) | 005（印刷とステータス＝printjobid） |
| 071 | IT-27 | 削除 | 対象外 | 本機能はファイル削除を行わない |
| 072 | IT-27 | 移動・リネーム | 対象外 | 本機能はファイル移動・リネームを行わない |
| 073 | IT-27 | コピー | 対象外 | 本機能はファイルコピーを行わない |
| 074 | IT-33 | 対象機能 | 自動化(API/統合) | 001（GetRequest＝参照系識別） |
| 075 | IT-33 | 対象機能 | 自動化(API/統合) | 020（GetRequestで受注ステータス不変＝DB照会の前後比較。管理画面は補助観測） |
| 076 | IT-33 | 更新結果 | 自動化(API/統合) | 030（SetResponse更新結果） |
| 077 | IT-33 | ファイル登録 | 自動化(API/統合) | 004（対象受注が印刷情報XMLへ取り込まれる＝出力への登録） |
| 078 | IT-33 | 参照系機能 | 自動化(API/統合) | 032（解析失敗で更新なし） |
| 079 | IT-33 | ファイル出力 | 自動化(API/統合) | 033（直接印刷結果偽） |
| 080 | IT-27 | JSON | 対象外 | 応答はXML・空応答でJSON非該当 |
| 081 | IT-27 | 同名ファイル | 手動（要実機確認） | 060（印刷ログ同名・配置先） |
| 082 | IT-27 | 入力JSON | 対象外 | 入力はXML（ResponseFile）でJSON非該当 |
| 083 | IT-27 | 配置先 | 手動（要実機確認） | 060（印刷ログ配置先 var/log/print_logs/） |
| 084 | IT-27 | スキーマ | 自動化(API/統合) | 003（PrintRequestInfoスキーマ） |
| 085 | IT-09 | 実行結果 | 自動化(API/統合) | 031（SetResponse応答） |
| 086 | IT-09 | HTTPステータス | 手動（要実機確認） | 063（認可） |
| 087 | IT-09 | リクエスト | 自動化(API/統合) | 001（正常パラメータ実行） |
| 088 | IT-32 | リクエスト | 自動化(API/統合) | 052（異常パラメータ） |
| 089 | IT-32 | リクエスト | 自動化(API/統合) | 053（想定外項目） |
| 090 | IT-19 | 同時実行数の制限 | 対象外 | 本エンドポイントに同時実行数制限・レート制限の仕様/実装がない（排他制御「明示的ロックを設けない」） |

集計（付帯表2と一致）: 自動化(UI) 0（画面なしAPIのため一次オラクルをUIに置かない。旧UI分類の028,031,075はDB副作用照会を一次オラクル化し管理画面表示は補助観測へ）／自動化(API/統合) 59／手動 18（要実機確認。001-006,009,021,022,027,029,032,048,049,056,081,083,086）／対象外 13（014,015,016,017,053,054,059,071,072,073,080,082,090）。**未分類 0**（母集合90行）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A05-01-BASEINFO | 拠点情報 dtb_base_info（本店/支店）／base_info_id | 本店（isMainShop=true）と支店の base_info_id 各1。GetRequest/SetResponse のパスパラメータに用いる。**設計書に base_info_id の記載がなく実装が必須化＝付帯表4#2** | fixture／migration | 専用拠点・撤去不要。テスト環境固定値 | 全ケース |
| SEED-A05-01-PRINT-TARGET | 受注 dtb_order／配送 dtb_shipping／店頭注文番号 dtb_order_number | 印刷対象抽出条件を満たす受注（店頭受取・注文受領・order_number/smaregi_code あり・confirm_date未設定）複数件。氏名・氏名カナ・payment_total・order_date 既知 | synthetic／fixture | 専用受注・初期ステータスへ復元してべき等化。最大10件確認用に11件以上のバリエーションも用意 | 001-008,010-016,020,052,053,060,062,063 |
| SEED-A05-01-SMOOTH-OTC | 受注 dtb_order／配送 dtb_shipping | スムーズ店頭受取の配送方法の受注。(a)合計金額欄の文言切替確認用1件（009）。(b)抽出条件を全て満たす正常受注1件（017）。(c)抽出条件を1つ外した異常受注（確定済み＝confirm_date設定済み／スマレジコードなし）各1件（018,019）。order_status・confirm_date・smaregi_code・payment_total 既知 | synthetic／fixture | 専用受注・初期値へ復元してべき等化・撤去可 | 009,017,018,019 |
| SEED-A05-01-BROWSER-FLG | 受注 dtb_order | browser_print_flg=true の受注1件（GetRequest対象・SetResponseでフラグを倒す検証） | synthetic／fixture | 専用受注・フラグ初期値trueへ復元してべき等化 | 013,041 |
| SEED-A05-01-NO-TARGET | 受注 dtb_order | 印刷対象抽出条件に合致する受注が0件の状態 | synthetic（対象受注を退避/無効化） | テスト前に対象0件へ初期化してべき等化 | 010,061 |
| SEED-A05-01-RESPONSEFILE | ResponseFile XML（synthetic）／受注 dtb_order | ServerDirectPrint=true・ePOSPrint(Parameter/printjobid=受注ID または「受注ID_連番」) を含むXML。解析失敗用（不正XML）・false用・要素なし用・不存在受注ID混在用のバリエーション。対象受注は更新前ステータス既知 | synthetic（設計書 入出力/サンプルレスポンス由来。プリンタ実機は使わない） | テスト内生成・後始末不要。対象受注はテスト毎に更新前ステータスへ復元 | 030-040,042,050 |
| SEED-M01-ADMIN | dtb_member（管理者） | 受注一覧・受注編集を閲覧する有効な管理者1（ID/PWは config 既定。2FA OFF）。**一次オラクルはDB照会のため必須ではなく、管理画面での補助観測を行う場合のみ使用** | fixture（config既定） | 既存利用・撤去不要 | 020,040,041,042（管理画面での補助観測用・任意） |

注: ResponseFile・付随パラメータは設計書（入出力・サンプルレスポンス）記載のフィールドのみで最小構成し、プリンタ実機・外部連携の実呼び出しはしない（帳票物理印字・例外・認可方式・印刷ログファイルの実観測は手動/要実機＝062,063,064,060,061）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（dtb_order／dtb_order_number／dtb_shipping／mtb_order_status 等）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。jwt-tokenヘッダの原値・署名シークレットは設計書・ログに書かない。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `GET/POST /order/print/direct`（利用者視点の入口） | `#[Route(path: '/api/order/prints/direct/{base_info_id}', methods: ['POST'])]`（OrderController.php:43） | **設計書パス `/order/print/direct` と実装パス `/api/order/prints/direct/{base_info_id}` が不一致**（/apiプレフィックス・prints複数形・base_info_id必須）。テストは実装の実効パスへ送信し本差異を記録 | 全ケース | 不具合候補(パス乖離) |
| 2 | `GetRequest` は GET、`SetResponse` は POST（利用者視点の入口・入出力「GET・POSTいずれからも取得」）。base_info_id の記載なし | route は `methods: ['POST']` のみ（OrderController.php:43）。base_info_id は必須数値パスパラメータで本店/支店を判定（OrderController.php:44／OrderDirectPrintAction.php:42-48） | **実装はPOSTのみで GET 分岐が無く、設計に無い base_info_id を必須化**。GET経路の有無・base_info_id の採番元は要実機確認。テストは実効パス(POST)へ統一し差異を記録 | 全ケース | 不具合候補(メソッド/パラメータ乖離) |
| 3 | `GetRequest` 副作用：印刷情報が空でない場合に印刷情報XMLを `var/log/print_logs/` 配下へ書き出す（処理フローGetRequest#5・副作用） | 書き出しブロックが `// TODO :後ほど対応` でコメントアウト＝未実装（OrderController.php:57-67） | **印刷ログファイル書き出しが未実装**。テストは仕様どおり「ファイル生成」を期待し、未実装なら落ちて検出する（期待値を実装へ寄せない） | 060,061 | 不具合候補(副作用未実装) |
| 4 | スタック用紙の印字項目（サンプルレスポンス）：店頭注文番号・QR・注文日・注文番号・お客様名・合計金額・スマレジコードバーコード・問い合わせ有無のチェック欄 | 上記に加え「変更後金額」「高額」「サプライ」「欠品」「Wチェック」「備考」欄を出力（OrderDirectPrintAction.php:101-143） | 設計サンプルは代表値だが、実装の追加印字項目（チェック欄等）が帳票仕様に含まれるか、問い合わせ有無がどのチェック欄に対応するかは要実機確認 | 006,016,062 | 要確認(帳票項目) |
| 5 | `ConnectionType` が想定値に一致しない場合は応答を組み立てず本文を返さない（エラー処理・レスポンス（失敗）（応答なし）） | HTTP 400 + Content-Type text/plain・空本文を返す（OrderController.php:91-96） | **設計は「応答を組み立てない」だが実装はHTTP400+Content-Type text/plainの応答を組み立てており、「応答を組み立てない」に反する＝不具合候補**。空本文部分のみ設計と一致するためテストは空本文を仕様で判定し、HTTPステータスは正典が規定しないため固定しない（期待ステータスは要実機確認） | 050 | 不具合候補(応答組立乖離・status要実機確認) |
| 6 | 認証・認可：本エンドポイントは認証処理を行わず、未認証で実行でき HTTP401 を返さない（認証・認可・権限認可） | route `/api/order/...` は JWT firewall `^/api/v1/`（security.yaml:33）に非該当、default `^/` firewall（security.yaml:71）配下でアクセス制御は access_control 未定義 | **設計の「認証なし」とアプリ層の照合なしは整合だが、default firewall 配下での実到達可否・認可方式（経路/ネットワーク依存）は要実機確認**。テストは「未認証で実行でき401を返さない」を仕様で判定 | 063 | 要確認(認可方式) |
| 7 | `GetRequest` 抽出条件：店頭受取で注文受領／スムーズ店頭受取で所定支払方法かつ未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり／ブラウザ印刷フラグ（処理フローGetRequest#2） | 支店版 `getDirectPrintOrderList` は OTC配送・order_status=NEW・order_number/smaregi_code not null OR browser_print_flg=true・LIMIT 10（OrderRepository.php:1568-1593）でスムーズ店頭受取条件が見当たらない。本店版 `getPrintOrderListMainShop`（:1493）側のみに存在する疑い | **設計はスムーズ店頭受取の細条件（所定支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり）を本店/支店の別なく要求するが、支店版 `getDirectPrintOrderList` に当該条件が見当たらず本店側のみに実装されている疑い＝不具合候補**。テストは設計の抽出条件を期待値とし、支店側で条件が効かない場合は017〜019で落ちて検出する（本店/支店それぞれの実装有無の確定は file:line 不足のため要実機確認） | 009,012,013,017,018,019 | 不具合候補(抽出条件乖離・要実機確認) |
| 8 | スムーズ店頭受取の受注は合計金額欄を金額ではなく「スムーズ店頭受取」の文言にする（処理フローGetRequest#3・DBカラム合計金額`payment_total`） | 配送方法に関わらず合計金額欄へ `payment_total` を出力し、スムーズ店頭受取時の文言置換が無い（OrderDirectPrintAction.php:74,129） | **設計はスムーズ店頭受取時に合計金額欄を「スムーズ店頭受取」文言とするが、実装は常に `payment_total` を出力し文言置換が無い**。テストは仕様どおり文言を期待し、未実装なら落ちて検出する（期待値を実装へ寄せない） | 009 | 不具合候補(文言置換未実装) |
| 9 | 印刷情報の店頭注文番号欄は店頭注文番号 `dtb_order_number.value`（受注IDで引く・DBカラム店頭注文番号） | 店頭注文番号欄に受注の `o.order_number`（注文番号）を出力（OrderDirectPrintAction.php:101-143 の店頭注文番号欄印字部。`dtb_order_number` 参照の有無・正確な行は file:line 根拠が取れず要実機確認） | **設計は店頭注文番号欄に `dtb_order_number.value`（待ち番号）を用いるが、実装は受注の `order_number`（注文番号）を出力する疑い**。値の取得元が乖離。検出ケース014で店頭注文番号欄の値を `dtb_order_number.value` と明示アサートし、仕様どおり期待して失敗で検出する（実装の取得元確定は file:line 不足のため要実機確認） | 014 | 不具合候補(取得元乖離・要実機確認) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET=GetRequest／POST=SetResponse） | 印刷情報送信・ステータス更新の起動と応答 | 001,030（実行先は実効パスPOST。正典GET経路は実装にGET分岐がなく付帯表4#2でメソッド/パス乖離として検出・要実機確認） | 仕様乖離検出/要実機確認（POST分岐の起動と応答は001/030で実行・カバー。正典GET経路は実機未到達で実行先は実効パスPOSTに統一し、メソッド/パス乖離は付帯表4#2で検出・要実機確認に紐付け。GET経路自体のカバー済みは主張しない） |
| 認証・認可（認証なし・401を返さない・アプリ層照合なし） | 未認証実行・認可 | 063 | カバー（手動/要実機） |
| 処理フローGetRequest#1-2（ConnectionType判定・対象抽出 最大10件・店頭受取/ブラウザ印刷フラグ） | GetRequest分岐・店頭受取抽出条件・10件上限 | 001,011,012,013 | カバー |
| 処理フローGetRequest#2（スムーズ店頭受取の抽出条件：所定支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードあり） | 各抽出条件の正常（満たす→抽出）/異常（外れ→非抽出）の対 | 017（全条件満たす→抽出）,018（確定済み→非抽出）,019（スマレジコードなし→非抽出） | 一部カバー（代表条件のみケース化＝正常017／異常018,019。**未確定・スマレジコードありの2条件は正常/異常対あり。残る所定支払方法・未出荷・未取消・未受領・店頭予約日なしの各異常対は未カバー＝要確認（条件数が多く最終巡で代表化）**。支店版抽出条件に当該条件が見当たらず本店側のみの乖離は付帯表4#7で不具合候補として記録） |
| 処理フローGetRequest#3（受注ごと印刷情報生成・スムーズ店頭受取の文言） | ePOSPrint生成・printjobid・注文番号/お客様名/合計金額/QR/バーコードの各印字欄値・スムーズ文言 | 004,005,006,007,008,009（スムーズ文言は付帯表4#8） | カバー（個別期待のある印字欄＝004,005,006,007,008,009。店頭注文番号・注文日・問い合わせ有無は下行で個別カバー） |
| レスポンスXML PrintData の店頭注文番号・注文日・問い合わせ有無欄 | 各欄の値が受注と一致 | 014（店頭注文番号＝dtb_order_number.value・付帯表4#9）,015（注文日＝order_date）,016（問い合わせ有無・付帯表4#4） | カバー（店頭注文番号・注文日・問い合わせ有無を個別期待ケースで明示アサート。店頭注文番号の取得元乖離は付帯表4#9で検出・問い合わせ有無のチェック欄対応は要実機確認＝付帯表4#4） |
| 処理フローGetRequest#4（対象なし→空文字） | 対象なし200空データ | 010 | カバー |
| 処理フローGetRequest#5・副作用（印刷ログ書出 var/log/print_logs/） | ログファイル生成・対象なし時非生成 | 060,061 | カバー（手動/要実機・実装未実装＝付帯表4#3） |
| 処理フローGetRequest#6・レスポンス（成功）（octet-streamストリーム送信） | 200・Content-Type・XML本体 | 001,002,003 | カバー |
| データ整合性（GetRequestは受注を更新しない） | 参照系・受注ステータス不変 | 020 | カバー（DB照会で送信前後の order_status_id を比較。管理画面表示は補助観測） |
| 処理フローSetResponse#1-2（ConnectionType判定・ResponseFile解析・解析失敗で戻る） | SetResponse分岐・解析失敗で更新なし・200・空本文 | 030,032,038,039 | カバー |
| 処理フローSetResponse#3（直接印刷結果偽・要素なしで戻る） | false/要素なしで更新なし | 033,034 | カバー |
| 処理フローSetResponse#4（printjobid先頭部から受注特定・不存在はスキップ） | 受注特定・不存在スキップ・処理継続 | 035,036 | カバー |
| 処理フローSetResponse#5-6・副作用（browser_print_flg分岐・ピック中更新・確定日時/ピック日設定） | フラグ倒し・ステータス更新・日時設定 | 040,041,042 | カバー（DB照会＝order_status_id/browser_print_flg/confirm_date。管理画面表示は補助観測） |
| 処理フローSetResponse#7・レスポンス（成功）（200/text/xml/空本文） | 200・Content-Type・本文長0 | 030,037,031 | カバー |
| 入出力 リクエスト（ConnectionType必須・ResponseFile・GET/POST両取得） | 分岐パラメータ・想定外/異常値 | 050,052,053 | カバー（GET経路は付帯表4#2） |
| レスポンス（失敗）（ConnectionType不一致＝応答を組み立てない） | 不一致時の空本文 | 050 | カバー（status要実機確認＝付帯表4#5） |
| エラー処理（解析失敗・false/要素なし・受注不存在・例外500） | 各分岐のログ記録・更新なし・例外 | 032,033,034,035,064 | カバー（例外は手動/要実機） |
| バリデーション（フォーム型/文字長検証を行わない） | 文字長境界が本機能に非該当 | （対象外：014-017,053,054,059） | 対象外（理由付き） |
| レスポンス（成功）XML構造（PrintRequestInfo/ePOSPrint/PrintData/printjobid） | ルート要素・要素構成・スキーマ | 003,004,005 | カバー |
| データ出力 帳票フォーマット（レイアウト/フォント/文字サイズ/色） | 物理印字の見た目 | 062 | カバー（手動/要実機） |
| 排他制御・トランザクション（明示的ロックを設けない／同時実行制限なし） | 同時実行数の制限 | （対象外：090） | 対象外（同時実行制限・レート制限の仕様/実装なし） |
| ログ・監査（解析失敗・false・受注不存在時のログ記録） | エラーログの実出力内容の確認 | 032,035（DB照会で更新なしを観測）／ログ本文の実出力は手動 | 手動（要実機確認）。ログ記録処理の実装根拠は `src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:48-86`（解析失敗 :48-54／false・要素なし :55-59／受注不存在 :82-86）。ログ本文・出力先の実観測は実機ログ参照が必要 |
| ログ・監査（機密値（JWT原値・auth_magic・セッションID完全値）をログに出さない） | 機密値のログ抑止 | （実観測のみ） | 手動（要実機確認）。実装根拠は `src/Eccube/Service/Admin/Order/`（UpdatePrintedOrderStatusAction/OrderDirectPrintAction）のログ出力箇所。抑止の確認は実機ログ目視 |

未カバーはいずれも理由（本機能に文字長入力検証がない・同時実行制限/レート制限の仕様や実装がない・帳票物理印字/例外/認可方式/印刷ログ/ログ内容は実機/外部依存・スムーズ店頭受取の抽出細条件は条件数が多く最終巡で代表条件のみケース化し残りは要確認＝付帯表4#7）を明記済み。スムーズ店頭受取の抽出条件は正常017↔異常018/019で代表的な正常/異常対を揃えたが、所定支払方法・未出荷・未取消・未受領・店頭予約日なしの各異常対は未カバー（要確認）として正直に記録し、未カバー0とはしない。正典「利用者視点の入口」のGET経路は実装にGET分岐がなく実機未到達のため、実行先は実効パス（POST）に統一し、メソッド/パス乖離として付帯表4#2で検出・要実機確認に紐付けた（GET経路のカバー済みは主張しない）。設計書の各節（利用者視点の入口・処理フローGetRequest/SetResponse・入出力・データ整合性・副作用・エラー処理・認証認可・排他制御）をAPI/統合レイヤ（DB副作用照会を含む一次オラクル。管理画面表示は補助観測）へ写像し、正常×異常の対を `GetRequest`（対象あり001 ↔ 対象なし010）・`SetResponse`（正常030/040 ↔ 解析失敗032/false033/要素なし034/不存在035）ともに独立ケースで揃えた。
