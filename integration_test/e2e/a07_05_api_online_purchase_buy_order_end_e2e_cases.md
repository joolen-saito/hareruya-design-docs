# A07-05（オンライン仕入_買取注文完了） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a07-05_api_online_purchase_buy_order_end.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a07-05_api_online_purchase_buy_order_end.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a07_05_api_online_purchase_buy_order_end_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わないJSON API（買取アプリ＝MTGバイヤーが、ネット買取受注の査定を終え、明細とステータスを確定する更新系API）であり、**一次オラクルはAPI/統合レイヤに置く**。Playwright `request` で査定終了処理エンドポイントへ `PUT` 送信し、HTTPステータス・失敗時の `{code, errors}` 本文・成功時の `{code:200}` で判定する。**更新系の副作用（受注のステータス・合計額・更新担当者・更新日時、買取代表カード・個別入力商品の登録／更新／削除、申込時買取価格の引き継ぎ／削除、まとめ買取商品の申込時買取価格削除、ステータス変更時の履歴登録）は、永続化先テーブル（`dtb_buy_order`・`dtb_buy_main_card`・`dtb_buy_order_indivisual_input_product`・`dtb_application_price`・`dtb_buy_order_status_histry`）のDB観測で判定する**。正典が「ブラウザ向けの画面を持たない」と定めるため、**管理画面でのUI確認はスコープ外**とし、母集合外の補助観測（要実機確認）として付帯表に分離する（本体TSV・母集合分類には組み込まない）。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装のレスポンス形・エラーメッセージ文言・ステータスマスタ定義・HTTPライブラリ既定値・Form/DTO制約を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdは基本設計・観点表を上位オラクルとし、実装からは位置情報（APIパス・メソッド・認証方式・検証/更新/履歴/丸めロジックの所在）のみを `file:line` 根拠で取得する。取れないものは `要実機確認`。正本mdと実装の食い違い（パス接頭辞・エラーメッセージ文言・検証失敗時のHTTPステータス・nameの最大長）は付帯表4にのみ出し、TSV期待値・本文へ実装の現挙動を写さない。とくに**正典に応答が定義されない事象（タイムアウト・更新処理中の例外500の実再現・想定外項目の扱い・エラーメッセージのソート順）は固定期待にせず `手動（要実機確認）`** とする。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報・受信検証（jwt-token認証）・必須条件（`order_status`／`order_details`必須）・リクエスト（不正値／想定外項目）・レスポンス（`{code}`／`{code,errors}`契約）・データなし（受注404）。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 正常な査定終了処理のHTTPステータス・実行結果（受注・明細・合計額・担当者・更新日時のDB反映）・外部取得（受注・ステータスマスタ・会員の特定） |
| IT-19 | 同時実行数の制限。正本md「楽観/悲観ロックを持たず後勝ち」＝同時実行数を制限する処理が無く対象外 |
| IT-10 | HTTPステータス・通信・正常／異常系・エラー（必須／整数／マスタ非存在の入力検証400・複数エラーの一括返却）。エラーメッセージのソート順・外部キャッシュ・決済代行・転送再連携は本機能に非該当または正典未定義で対象外/手動。タイムアウト・更新処理中の例外500は手動（要実機） |
| IT-33 | 区分整合（更新対象外項目＝受注の他項目の不変）・エラー（検証エラー時に明細・合計額・履歴が部分更新されない）。数量金額の外部取引・自動加算・実数更新・売上返品・外部連携は本機能に非該当で対象外。明細CRUD・合計額切上げ・履歴登録は正本md補完ケースでDB観測 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-001	IT-09	リクエスト	P1	正常な明細・ステータスで査定終了処理が成功応答となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	"id=対象受注ID
order_status=マスタに存在する有効なステータスID
order_details=1件以上（name・product_class_id・quantity・price・purchase_category）
jwt-token=有効"	"1. 査定終了処理エンドポイントへ有効な明細とorder_statusをPUT送信する
2. HTTPステータスを確認する"	HTTPステータスが200（成功）であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-002	IT-32	レスポンス	P2	成功レスポンス本文が仕様の型契約と一致する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-token=有効	"1. 査定終了処理エンドポイントへPUT送信する
2. レスポンス本文を確認する"	成功時の本文が `{code:200}`（`code`はinteger型・値200）であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-003	IT-09	HTTPステータス	P1	正常処理で成功HTTPステータスが返る	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-token=有効	"1. 査定終了処理エンドポイントへPUT送信する
2. HTTPステータスを確認する"	実行結果に応じたHTTPステータスとして200（成功）が返ること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-004	IT-10	正常	P2	対象条件に該当する正常値で正常処理される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	マスタに存在する正常なorder_statusと整数項目を満たす明細／jwt-token=有効	"1. 正常値でPUT送信する
2. HTTPステータスを確認する"	正常処理としてHTTPステータスが200（成功）であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-010	IT-32	受信検証	P1	jwt-tokenヘッダ欠落は認証拒否となる	SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-tokenヘッダ＝なし	"1. jwt-tokenヘッダを付けずにPUT送信する
2. HTTPステータスを確認する"	認証拒否としてHTTPステータスが401であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-011	IT-32	資格情報	P1	署名不正のjwt-tokenは認証拒否となる	SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-token＝署名不正	"1. 署名不正のjwt-tokenでPUT送信する
2. HTTPステータスを確認する"	認証拒否としてHTTPステータスが401であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-012	IT-09	外部取得	P1	該当する管理者会員のないトークンは認証拒否となる	SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-token＝署名は正当だが対応する管理者会員が存在しない	"1. 会員に紐づかないトークンでPUT送信する
2. HTTPステータスを確認する"	認証拒否としてHTTPステータスが401であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-030	IT-32	データなし	P1	存在しない受注IDは該当なしとなる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-STATUS-MASTER	id=存在しない受注ID／有効な明細・order_status／jwt-token=有効	"1. 存在しない受注IDへPUT送信する
2. HTTPステータスを確認する"	該当なしとしてHTTPステータスが404であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-031	IT-32	必須条件	P2	order_status未指定は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status＝なし／order_details=有効／jwt-token=有効	"1. order_statusを付けずにPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-032	IT-32	リクエスト	P2	マスタに存在しないorder_statusは入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status=999（買取受注ステータスマスタに存在しない）／order_details=有効／jwt-token=有効	"1. order_status=999 をPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-033	IT-32	リクエスト	P3	マスタ非存在order_statusのエラーメッセージが仕様文言となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status=999／order_details=有効／jwt-token=有効	"1. order_status=999 をPUT送信する
2. レスポンス本文のerrorsを確認する"	errorsに「MtbBuyOrderStatusに（値）が見つかりません。」が返ること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-034	IT-10	エラー	P2	order_detailsが空配列は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_details=[]（空配列）／order_status=有効／jwt-token=有効	"1. 空のorder_detailsでPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-035	IT-10	エラー	P3	order_details空・配列以外のエラーメッセージが仕様文言となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_details=空または配列以外／order_status=有効／jwt-token=有効	"1. 空または配列以外のorder_detailsでPUT送信する
2. レスポンス本文のerrorsを確認する"	errorsに「1つ以上の商品を選んでください。」が返ること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-036	IT-10	エラー	P3	明細のname未指定は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でname＝なし／他項目=有効／jwt-token=有効	"1. nameを欠いた明細でPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-037	IT-10	エラー	P3	明細のnameが上限超過は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でname＝最大長（65535）を超える文字列／jwt-token=有効	"1. name上限超過の明細でPUT送信する
2. HTTPステータスを確認する"	正本mdの上限（最大65535）を超えるため入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-038	IT-10	エラー	P3	明細のproduct_class_idが非整数は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でproduct_class_id＝非整数／他項目=有効／jwt-token=有効	"1. product_class_idが非整数の明細でPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-039	IT-10	エラー	P3	明細のquantityが非整数は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でquantity＝非整数／他項目=有効／jwt-token=有効	"1. quantityが非整数の明細でPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-040	IT-10	エラー	P3	明細のpriceが非整数は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でprice＝非整数／他項目=有効／jwt-token=有効	"1. priceが非整数の明細でPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-041	IT-10	エラー	P3	明細のpurchase_categoryが非整数は入力不正となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でpurchase_category＝非整数／他項目=有効／jwt-token=有効	"1. purchase_categoryが非整数の明細でPUT送信する
2. HTTPステータスを確認する"	入力不正としてHTTPステータスが400であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-042	IT-10	エラー	P2	複数の検証エラーが1つのerrors配列に全件まとめて返る	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status未指定＋明細のname未指定＋quantity非整数を同時に与える／jwt-token=有効	"1. 複数項目が検証エラーとなる入力でPUT送信する
2. レスポンス本文のerrorsを確認する"	検証エラーが複数件あるとき、収集されたエラーメッセージが1つのerrors配列に全件まとめて返ること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-043	IT-10	エラー	P3	複数エラーのソート順を実機確認する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	複数項目が検証エラーとなる入力／jwt-token=有効	"1. 複数項目が検証エラーとなる入力でPUT送信する
2. errors配列の並び順を実機で観測する"	正本mdはerrors配列の並び順を定義せず期待挙動を規定できないため、ソート順を実機で観測すること（要実機確認）。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-044	IT-32	レスポンス	P2	失敗時のレスポンス本文が仕様の型契約と一致する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status=999（マスタ非存在）／jwt-token=有効	"1. 入力不正となる値でPUT送信する
2. レスポンス本文の構造を確認する"	失敗時の本文が `{code, errors}` 形式（`errors`は検証メッセージの配列）であること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-045	IT-10	エラー	P3	整数項目の非整数エラーメッセージが仕様文言となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_detailsの1件でproduct_class_id＝非整数／jwt-token=有効	"1. product_class_idが非整数の明細でPUT送信する
2. レスポンス本文のerrorsを確認する"	errorsに「商品規格IDは、整数で入力してください。」が返ること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-050	IT-09	実行結果	P1	査定終了処理で受注のステータス・合計額・担当者・更新日時が更新される	SEED-A07-05-JWT-MEMBER（会員A）／SEED-A07-05-ORDER-OPEN（更新前ステータス＝査定終了前）／SEED-A07-05-STATUS-MASTER	order_status=有効なステータスID／有効な明細／jwt-token＝会員A	"1. 会員Aで有効な明細・order_statusをPUT送信する
2. 受注テーブル（dtb_buy_order）の対象受注をDB観測で確認する"	対象受注の買取受注ステータスID・合計額・更新担当者（会員A）・更新日時が指定値・算出値で更新されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-051	IT-09	実行結果	P2	商品規格ID=0の明細が個別入力商品として新規登録される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS／SEED-A07-05-STATUS-MASTER	order_detailsにproduct_class_id=0かつ受注に同名が無いnameの明細を含める／jwt-token=有効	"1. product_class_id=0で既存同名の無い明細をPUT送信する
2. 個別入力商品テーブル（dtb_buy_order_indivisual_input_product）をDB観測で確認する"	同名の既存が無いため、当該明細が個別入力商品として新規登録されること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-052	IT-09	実行結果	P2	商品規格ID=0で同名既存がある明細は個別入力商品が更新される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS（同名の個別入力商品が既存）／SEED-A07-05-STATUS-MASTER	order_detailsにproduct_class_id=0かつ既存と同名の明細を含める／jwt-token=有効	"1. product_class_id=0で既存同名の明細をPUT送信する
2. 個別入力商品テーブル（dtb_buy_order_indivisual_input_product）をDB観測で確認する"	同名の既存が更新され、同名で重複した新規行が増えないこと。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-053	IT-09	実行結果	P2	商品規格IDを持つ明細が買取代表カードとして登録・更新される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS／SEED-A07-05-STATUS-MASTER	order_detailsに商品規格ID（0以外）を持つ明細を含める／jwt-token=有効	"1. 商品規格IDを持つ明細をPUT送信する
2. 買取代表カードテーブル（dtb_buy_main_card）をDB観測で確認する"	商品規格から特定した買取代表カードが、同一条件の既存があれば更新・無ければ新規登録されること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-054	IT-09	実行結果	P2	今回保持しない既存明細とその申込時買取価格が削除される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS（今回送らない既存カード・個別入力商品・申込時買取価格あり）／SEED-A07-05-STATUS-MASTER	既存明細の一部を含まないorder_details／jwt-token=有効	"1. 既存明細の一部を含まないorder_detailsをPUT送信する
2. 買取代表カード・個別入力商品・申込時買取価格の各テーブルをDB観測で確認する"	今回保持しない既存の買取代表カード・個別入力商品と、それに紐づく申込時買取価格（dtb_application_price）が削除されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-055	IT-09	実行結果	P2	まとめ買取商品は申込時買取価格のみ削除される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS（まとめ買取商品の既存カードあり）／SEED-A07-05-OPTION-BULK／SEED-A07-05-STATUS-MASTER	まとめ買取商品を含む受注に対する査定終了処理／jwt-token=有効	"1. まとめ買取商品を含む受注へPUT送信する
2. 申込時買取価格テーブル（dtb_application_price）をDB観測で確認する"	まとめ買取商品（オプションマスタの設定IDで識別）は申込時買取価格のみが削除対象となること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-056	IT-09	実行結果	P2	新規の買取代表カードへ既存明細から申込時買取価格が引き継がれる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS（引き継ぎ元の申込時買取価格あり）／SEED-A07-05-STATUS-MASTER	既存明細に対応する商品規格で新規カードとなる明細／jwt-token=有効	"1. 新規カードとなる商品規格の明細をPUT送信する
2. 申込時買取価格テーブル（dtb_application_price）をDB観測で確認する"	新規に作られた買取代表カードへ、既存明細から申込時買取価格が引き継ぎ登録されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-057	IT-33	区分整合	P2	合計額が10円単位で切り上げられて確定する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	単価×数量の合計が10円単位に割り切れない明細（例 合計1234）／jwt-token=有効	"1. 合計が10円単位で割り切れない明細をPUT送信する
2. 受注テーブル（dtb_buy_order）の合計額をDB観測で確認する"	受注の合計額が、明細の単価×数量と保持分の合算を10円単位で切り上げた値（例 1234→1240）で確定していること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-058	IT-33	区分整合	P2	サプライ・パック相当の明細は合計額へ加算して保持される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-WITH-DETAILS（カード詳細ID未設定の明細あり）／SEED-A07-05-STATUS-MASTER	カード詳細IDが未設定の既存明細を持つ受注への査定終了処理／jwt-token=有効	"1. サプライ・パック相当の明細を持つ受注へPUT送信する
2. 受注テーブル（dtb_buy_order）の合計額と当該明細の保持をDB観測で確認する"	サプライ・パック相当（カード詳細IDが未設定）の明細が削除されず保持され、その明細額が合計額へ加算されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-059	IT-33	区分整合	P1	査定終了処理で受注の更新対象外項目が変動しない	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	有効な明細・order_status／jwt-token=有効	"1. 更新前に対象受注の更新対象外項目（受注ID等の本APIで変更しない列）を控える
2. 有効な明細でPUT送信する
3. 受注テーブル（dtb_buy_order）の同項目をDB観測で確認する"	更新範囲（ステータス・合計額・買取代表カード・個別入力商品・更新担当者・更新日時）以外の受注の他項目が更新前と変動しないこと。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-060	IT-33	副作用	P1	更新前後でステータスが変わった場合に履歴が1件登録される	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN（更新前ステータス＝指定値と異なる）／SEED-A07-05-STATUS-MASTER	更新前と異なるorder_status／有効な明細／jwt-token=有効	"1. 更新前と異なるorder_statusでPUT送信する
2. ステータス履歴テーブル（dtb_buy_order_status_histry）の対象受注の行数をDB観測で確認する"	対象受注のステータス履歴（dtb_buy_order_status_histry）が1件追加されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-061	IT-10	重複・順序	P1	登録された履歴の内容が更新内容と一致し担当者が記録される	SEED-A07-05-JWT-MEMBER（会員A）／SEED-A07-05-ORDER-OPEN（更新前ステータス＝指定値と異なる）／SEED-A07-05-STATUS-MASTER	更新前と異なるorder_status／jwt-token＝会員A	"1. 会員Aで更新前と異なるorder_statusをPUT送信する
2. 追加されたステータス履歴行の内容をDB観測で確認する"	履歴行に受注ID・指定ステータスID・更新担当者（会員A）・登録日時が更新内容と一致して記録されていること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-062	IT-33	副作用	P2	更新前後でステータスが変わらない場合は履歴が登録されない	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN（更新前ステータス＝指定値と同一）／SEED-A07-05-STATUS-MASTER	更新前と同一のorder_status／有効な明細／jwt-token=有効	"1. 更新前と同一のorder_statusでPUT送信する
2. ステータス履歴テーブル（dtb_buy_order_status_histry）をDB観測で確認する"	更新前後でステータスが変わらないため、対象受注のステータス履歴に新規行が追加されないこと。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-070	IT-10	異常系	P2	更新処理中の例外がサーバ側エラー応答となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	更新処理中に例外を誘発する状態／有効な明細・order_status／jwt-token=有効	"1. 更新処理中の例外を誘発してPUT送信する
2. HTTPステータスとレスポンス本文を実機で観測する"	正典のエラー処理どおり、更新処理中の例外はロールバックのうえ内部エラー（HTTP500）とし `{code, errors}` を返すこと。例外の実再現は外部依存のため要実機確認。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-071	IT-33	データ整合性	P3	更新処理中の例外時に明細・合計額・履歴が部分更新されない	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	更新処理中に例外を誘発する状態／有効な明細・order_status／jwt-token=有効	"1. 更新処理中の例外を誘発してPUT送信し500を受ける
2. 受注・明細・履歴の各テーブルを実機で観測する"	正典の排他制御・トランザクションどおり、例外時はロールバックされ受注のステータス・合計額・明細・ステータス履歴が部分更新されないこと。例外の実再現は外部依存のため要実機確認。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-072	IT-33	エラー	P2	検証エラー時に受注・明細・合計額・履歴が更新されない	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	order_status=999（マスタ非存在）など検証エラーとなる入力／jwt-token=有効	"1. 検証エラーとなる入力でPUT送信し400を受ける
2. 受注テーブル・明細テーブル・ステータス履歴テーブルをDB観測で確認する"	検証エラー（HTTP400）時は更新を行わないため、受注のステータス・合計額・明細・ステータス履歴が更新前のまま変化しないこと。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-080	IT-32	リクエスト	P3	想定外項目を加えたときの挙動を実機確認する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	"有効な明細・order_statusに想定外の項目（項目名とパラメータ値のセット）を追加
jwt-token=有効"	"1. 想定外項目を含めてPUT送信する
2. 応答を実機で観測する"	正本mdは想定外項目（未知フィールド）の扱いを定義せず期待挙動を規定できないため、応答を実機で観測すること（要実機確認）。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-081	IT-09	実行結果	P2	同一受注へ査定終了処理を再実行しても後勝ちで成功応答となる	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	1回目と2回目で異なる明細・order_status／jwt-token=有効	"1. 同一受注へ1回目の査定終了処理をPUT送信する
2. 続けて2回目の査定終了処理をPUT送信する
3. 2回目のHTTPステータスを確認する"	正典の同時更新（後勝ち・排他なし）どおり、2回目もHTTPステータスが200（成功）で受け付けられること。				
a07-05_api_online_purchase_buy_order_end（API_オンライン仕入_買取注文完了）	E2E-A07-05-082	IT-10	通信	P3	タイムアウト時の応答を実機確認する	SEED-A07-05-JWT-MEMBER／SEED-A07-05-ORDER-OPEN／SEED-A07-05-STATUS-MASTER	タイムアウトを誘発する状態／有効な明細・order_status／jwt-token=有効	"1. タイムアウトを誘発してPUT送信する
2. 応答と受注状態を実機で観測する"	正本mdはタイムアウト時の具体応答・部分更新有無を定義せず期待挙動を規定できないため、実機で観測すること（要実機確認）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

更新エンドポイントは実装で `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}.json', name: 'api_admin_buy_order_update', methods: ['PUT'])]`（`Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:170`）。接頭辞 `eccube_api_v1_route` 既定値 `api/v1`（`app/config/eccube/packages/eccube.yaml:6,55`）＝**実効パス `PUT /api/v1/admin/buyOrder/{id}.json`**。認証は firewall（pattern `^/api/v1/`・`access_token`／`security.yaml:33-39`）＋ `JwtTokenHandler`／`JwtTokenHeaderExtractor`（ヘッダ名 `jwt-token`／`JwtTokenHeaderExtractor.php:29`）＋HS256シークレット（`jwt.yaml:3,5`）で、**正本mdの jwt-token／HS256／認証失敗401と一致**。クラスに `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（`BuyOrderController.php:44`）。更新処理は `updateBuyOrder`（`BuyOrderController.php:170-204`：受注取得→マスタ存在判定→`UpdateBuyOrderAction`→例外は `InternalException` へ集約:202-204）。検証は DTO（`UpdateBuyOrderDto.php:29,30,34,35`／`UpdateBuyOrderDetailDto.php:26,30,35,39,58`）、更新本体は `UpdateBuyOrderAction::handle`（`Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:55`：トランザクション開始:57・明細処理・合計額10円切上げ`roundUpPrice`:271-273／:34・ステータス変更時の履歴保存:111-118・flush/commit:120-121・例外rollback＋`InternalException`:130-138）。まとめ買取商品IDは `BulkPurchaseIdService::get`（`Service/Purchase/BulkPurchaseIdService.php:34`／`MtbOption::BULK_PURCHASE_ID`:77）。**送信先パスは実効パスへ統一し、合否は正本mdの意味（成功＝HTTP200＋`{code:200}`、認証＝jwt-token照合の通過/拒否、入力検証＝必須/整数/マスタ存在の判定、副作用＝受注・明細・合計額・履歴の反映/削除/不変）で判定する。パス接頭辞・エラーメッセージ文言・検証失敗時のHTTPステータス・nameの最大長・整数項目の負値扱いの設計⇔実装差は付帯表4でのみ管理し、TSV期待値へ実装の現挙動を固定しない。**

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（正本md節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A07-05-001/003/004 | E2E自動化(API/統合) | `PUT /api/v1/admin/buyOrder/{id}.json`（BuyOrderController.php:170／eccube.yaml:6,55） | 利用者視点の入口・処理フロー#9（更新→200）／IT-09・IT-10 | IT-A07-05-...-004,003,027 |
| E2E-A07-05-002/044 | E2E自動化(API/統合) | 成功 `{code:200}`／失敗 `{code, errors}`（BuyOrderController.php:170-204／レスポンス本文の正は正本md） | レスポンス（成功）`code`integer・レスポンス（失敗）`{code,errors}`／IT-32 | IT-A07-05-...-032 |
| E2E-A07-05-010/011/012 | E2E自動化(API/統合)（要実機確認: JWT発行・会員紐づけ） | 認証 firewall `^/api/v1/`／`JwtTokenHeaderExtractor`（security.yaml:33-39／JwtTokenHeaderExtractor.php:29／jwt.yaml:3,5） | 認証・認可（jwt-token・HS256・401）・処理フロー#1／IT-32・IT-09 | IT-A07-05-...-036,001,024 |
| E2E-A07-05-030 | E2E自動化(API/統合) | 受注取得404（BuyOrderController.php:170-186／処理フロー#2） | 処理フロー#2・入出力`id`・エラー処理（受注なし404）／IT-32 | IT-A07-05-...-033 |
| E2E-A07-05-031/034/035/036/037/038/039/040/041 | E2E自動化(API/統合) | 入力検証400（UpdateBuyOrderDto.php:29-35／UpdateBuyOrderDetailDto.php:26-58） | 処理フロー#3・バリデーション（必須/整数/上限）・入出力（各明細キー）／IT-32・IT-10 | IT-A07-05-...-031,008,025 |
| E2E-A07-05-032/033 | E2E自動化(API/統合) | マスタ存在判定400（BuyOrderController.php:183-186） | バリデーション`order_status`（マスタ存在）・エラー処理／IT-32 | IT-A07-05-...-005 |
| E2E-A07-05-042 | E2E自動化(API/統合) | 検証エラー収集→errors配列（バリデーション節「収集したエラーメッセージを1つの配列にまとめる」） | バリデーション（1配列集約）・レスポンス（失敗）／IT-10 | IT-A07-05-...-009,011,013 |
| E2E-A07-05-043 | 手動（要実機確認・errors並び順は正本md未定義） | errors並び順（正本md未定義。実機観測） | バリデーション（並び順の定義なし）／IT-10 | IT-A07-05-...-010,012,014 |
| E2E-A07-05-045 | E2E自動化(API/統合) | 整数項目メッセージ（UpdateBuyOrderDetailDto.php:26） | バリデーション（明細`product_class_id`整数）／IT-10。文言差は付帯表4#6 | IT-A07-05-...-025 |
| E2E-A07-05-050/059 | E2E自動化(API/統合)（副作用＝DB観測） | `dtb_buy_order`（ステータスID・合計額・更新担当者・更新日時・他項目／DBカラム節） | 副作用（受注更新）・処理フロー#6・データ整合性（更新範囲）／IT-09・IT-33 | IT-A07-05-...-002,017 |
| E2E-A07-05-051/052/053/054 | E2E自動化(API/統合)（副作用＝DB観測） | `dtb_buy_main_card`・`dtb_buy_order_indivisual_input_product`・`dtb_application_price`（登録/更新/削除／UpdateBuyOrderAction.php:55-121） | 処理フロー#4・#6・副作用（明細CRUD・申込時買取価格削除）／IT-09 | （母集合外・正本md補完＝明細CRUD網羅） |
| E2E-A07-05-055 | E2E自動化(API/統合)（副作用＝DB観測） | まとめ買取商品の申込時買取価格削除（BulkPurchaseIdService.php:34／MtbOption::BULK_PURCHASE_ID:77／UpdateBuyOrderAction.php:61） | 処理フロー#5・副作用（まとめ買取は申込時買取価格のみ削除）／IT-09 | （母集合外・正本md補完） |
| E2E-A07-05-056 | E2E自動化(API/統合)（副作用＝DB観測） | 新規カードへの申込時買取価格引き継ぎ（UpdateBuyOrderAction.php:55-121） | 処理フロー#4（既存明細から申込時買取価格を引き継ぐ）／IT-09 | （母集合外・正本md補完） |
| E2E-A07-05-057/058 | E2E自動化(API/統合)（副作用＝DB観測） | 合計額10円切上げ`roundUpPrice`（UpdateBuyOrderAction.php:271-273／:34）・サプライ/パック相当の保持加算（処理フロー#5） | データ整合性（合計額＝10円単位切上げ・保持分加算）／IT-33 | （母集合外・正本md補完） |
| E2E-A07-05-060/061/062 | E2E自動化(API/統合)（副作用＝DB観測） | `dtb_buy_order_status_histry`（行数・受注ID・ステータスID・更新担当者・登録日時／UpdateBuyOrderAction.php:111-118） | 処理フロー#7・副作用（ステータス変更時のみ履歴1件登録）／IT-33・IT-10 | IT-A07-05-...-037（060/062は母集合外・正本md補完） |
| E2E-A07-05-070/071 | 手動（要実機確認・更新処理中の例外の実再現） | 例外rollback＋`InternalException`（UpdateBuyOrderAction.php:130-138／BuyOrderController.php:202-204） | エラー処理・排他制御/トランザクション（例外→ロールバック・500・部分更新なし）／IT-10・IT-33 | IT-A07-05-...-029,018 |
| E2E-A07-05-072 | E2E自動化(API/統合)（副作用＝DB観測） | 検証エラー時は更新せず（バリデーション節「1件以上あれば更新は行わない」） | バリデーション（更新を行わない）・データ整合性（部分更新なし）／IT-33 | IT-A07-05-...-018 |
| E2E-A07-05-080 | 手動（要実機確認・想定外項目の扱いは正本md未定義） | 想定外項目に対する応答は実機観測 | 入出力（リクエストはid/order_status/order_details/jwt-token規定）・想定外項目の扱いは未定義／IT-32 | IT-A07-05-...-006 |
| E2E-A07-05-081 | E2E自動化(API/統合) | 排他なし後勝ち（排他制御・トランザクション節／データ整合性「同時更新は後勝ち」） | データ整合性・排他制御（楽観/悲観ロックなし・後勝ち）／IT-09 | （母集合外・正本md補完） |
| E2E-A07-05-082 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（正典にタイムアウト時応答の定義なし） | エラー処理。正典にタイムアウト応答・部分更新の定義が無く期待値化せず実機観測／IT-10 | IT-A07-05-...-015 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）で、機能固有シナリオを持たない。本E2Eは正本md本文（処理フロー#1-9・バリデーション・データ整合性・副作用・排他制御）を一次オラクルとし、合否はAPI/統合レイヤ（HTTPステータス・`{code,errors}`／`{code:200}` 本文契約・判定分岐）と、副作用の永続化先テーブルのDB観測で判定する。**本機能は更新系APIのため、明細CRUD・申込時買取価格削除/引き継ぎ・合計額切上げ・履歴登録のDB更新観点を補完ケース（051-058,060-062,072,081）で網羅した。** 正常×異常の対を、完了成功（査定終了処理200⇔検証エラー400 / 受注なし404 / 認証401）・状態不正（マスタ非存在order_status400⇔有効order_status200）・必須（order_status/order_details/name未指定400⇔指定200）・権限（認証成功⇔jwt欠落/署名不正/会員なし401）・二重完了（再実行200後勝ち⇔単発成功200）の各区分で揃えた。

母集合外・補助観測（要実機確認）: 正典は「ブラウザ向けの画面を持たない」とし、本APIに画面は属さない。査定結果（受注ステータス・合計額・買取明細）が管理画面（ネット買取受注画面・ステータス履歴画面、`Controller/Admin/...`／twigセレクタは要実機確認）へどう反映されるかの目視確認は、一次オラクル（DB観測）の上に重ねる補助観測として母集合外に分離し、本体TSV・母集合分類・件数集計には算入しない。対象副作用は 050（受注更新）・051-058（明細・申込時買取価格・合計額）・060/061（履歴）で、UI観測のシードは SEED-M01-ADMIN（付帯表3）。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a07_05_api_online_purchase_buy_order_end_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。本APIは画面を持たず管理画面UI確認はスコープ外（母集合外の補助観測）のため、`自動化(UI)` は母集合では全て0であり、副作用は `自動化(API/統合)`（DB観測）へ集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 6 | 1 | 1 | 資格情報・受信検証・必須条件・リクエスト（不正値）・レスポンス・データなしはHTTPステータス/本文契約で観測可。想定外項目の扱いは正本md未定義で手動・要実機（080）。バージョニングは正典にAPIバージョン指定が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常処理のHTTPステータス・外部取得（受注/会員特定）・実行結果（受注・明細・合計額・担当者・更新日時のDB反映）はAPI/統合（更新反映は副作用のDB観測） |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 同時実行数の制限。正本mdは楽観/悲観ロックを持たず後勝ち＝同時実行数を制限する処理が無く対象外（理由付き） |
| IT-10 | 18 | 0 | 9 | 5 | 4 | エラー（必須/整数/マスタ非存在の400・複数エラー一括返却）・HTTPステータス・通信・正常/異常系はAPI/統合、担当者記録は副作用のDB観測。エラーソート順(3)・タイムアウト(1)・更新例外500(1)は手動。外部キャッシュ形式不正(1)・決済代行(2)・転送再連携(1)は本機能に非該当で対象外(計4) |
| IT-33 | 7 | 0 | 2 | 0 | 5 | 区分整合（他項目不変）・エラー（検証エラー時の部分更新なし）は副作用のDB観測。数量金額の外部取引/自動加算/実数更新/売上返品/連携(数量金額)は本機能に非該当で対象外(5) |
| 合計 | 38 | 0 | 21 | 6 | 11 | **未分類 0** |

注1: 本機能はネット買取受注の更新系API（明細登録/更新/削除・合計額算出・履歴登録）であり、a06-05（ステータス単独更新）と異なり**検証エラーを1配列へ集約する仕様（バリデーション節）を持つため、IT-10の複数バリデーション一括返却(009/011/013)を `自動化(API/統合)` に分類した**（ソート順010/012/014は正本md未定義で手動）。対象外11件の内訳は、IT-10 外部キャッシュ形式不正(1＝本APIは外部キャッシュ非該当)＋決済代行正常/異常(2＝外部決済サービス非該当)＋転送再連携の部分失敗(1＝転送・再連携処理なし)、IT-33 外部取引/自動加算/実数更新/売上返品/連携エラー(5＝外部連携由来の数量金額計算が本機能に非該当。本APIの明細・合計額・履歴のDB更新は補完ケースでDB観測)、IT-32 バージョニング(1＝正典にAPIバージョン指定が無く創作になる)、IT-19 同時実行数の制限(1＝後勝ちで該当処理なし)。手動6件はIT-10 エラーソート順(3＝043。errors並び順が正本md未定義)・タイムアウト(1＝082)・更新処理中の例外500(1＝070。外部キャッシュ障害行を例外500の実再現に充当)＋IT-32 想定外項目(1＝080)。いずれも理由付きで放置ではない。**正典に応答が定義されない事象は異常系ステータスを固定せず要実機確認とした（070/082/043/080）。**

注2（母集合外・正本md補完ケース）: 正本mdの処理フロー#4-7・副作用・データ整合性から、母集合38行に対応行を持たない更新系DB観点の補完ケース 051・052・053・054・055・056・057・058・060・062・072・081（いずれもAPI/統合＝HTTPまたは副作用のDB観測）を追加した（明細CRUD・申込時買取価格削除/引き継ぎ・合計額10円切上げ・サプライ保持・履歴登録/未登録・検証エラー時のDB不変・後勝ち再実行）。母集合集計には算入せず別管理する。補完ケースの観点列は正本md由来表記（区分整合・副作用・データ整合性・実行結果・エラー）で記し、IT-33の対象外観点名（自動加算・実数更新・売上返品・連携エラー＝2b行020/021/022/023）を本体TSVへ再利用しない（対象外分類との名称衝突を避ける）。なお全副作用ケースの管理画面UI確認は母集合外の補助観測（要実機確認）として付帯表1注に分離し、本集計に算入しない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 011（署名不正→401） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 050（受注ステータス・合計額・担当者・更新日時のDB反映観測） |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001（正常処理） |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 032/033（マスタ非存在order_status→400） |
| 006 | IT-32 | リクエスト | 手動（要実機確認） | 080（想定外項目の扱いは正本md未定義で期待挙動を規定できず実機観測） |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 正本mdは楽観/悲観ロックを持たず後勝ち＝同時実行数を制限する処理が無いため |
| 008 | IT-10 | エラー | 自動化(API/統合) | 034（order_details空→400）/036-041（明細検証→400） |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 自動化(API/統合) | 042（収集したエラーを1配列へ全件まとめて返却） |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 手動（要実機確認） | 043（errors並び順は正本md未定義） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 自動化(API/統合) | 042（ステータス・明細を順に検証し1配列へ集約） |
| 012 | IT-10 | エラー(相関バリ ソート順) | 手動（要実機確認） | 043（同上・並び順未定義） |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 自動化(API/統合) | 042（マスタ存在判定を含む検証も1配列へ集約） |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 手動（要実機確認） | 043（同上・並び順未定義） |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 082（タイムアウト実再現。正典に応答定義なし） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン指定が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 自動化(API/統合) | 059（更新対象外の受注他項目がDB上不変） |
| 018 | IT-33 | エラー | 自動化(API/統合) | 072（検証エラー400時に受注・明細・合計額・履歴がDB上不変。例外500時の部分更新なしは071で手動補完） |
| 019 | IT-33 | 外部取引 | 対象外 | 本APIに数量・金額の外部取引計算が無いため |
| 020 | IT-33 | 自動加算 | 対象外 | 外部連携由来の自動加算（連携元ID付き加算）が無いため（合計額算出・履歴作成は補完057/060でDB観測） |
| 021 | IT-33 | 実数更新 | 対象外 | 数量の実数更新が無いため |
| 022 | IT-33 | 売上・返品 | 対象外 | 数量の売上減算・返品加算が無いため |
| 023 | IT-33 | 連携エラー | 対象外 | 連携先システムへの数量金額連携が無いため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 012（トークンから会員を引けない→401） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 003/050 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 003 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 004 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本APIは外部キャッシュを参照しないため |
| 029 | IT-10 | 障害(外部キャッシュ接続障害) | 手動（要実機確認） | 070（更新処理中の例外＝500相当の実再現。外部キャッシュ障害は非該当だが障害系の母集合行を例外500の手動再現に充当。正典に部分更新有無の定義なし） |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 010（jwt欠落→401）/011（署名不正→401） |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 031（order_status未指定→400） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 002/044 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 030（受注なし404） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 決済代行・外部決済サービスが本機能に非該当のため |
| 035 | IT-10 | 異常系(決済代行二重課金) | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 010（jwt-token欠落→401） |
| 037 | IT-10 | 重複・順序（担当者記録） | 自動化(API/統合) | 061（認証会員が更新担当者・履歴へDB記録される） |
| 038 | IT-10 | 部分失敗(転送再連携) | 対象外 | 外部への転送・再連携処理が本機能に非該当のため |

集計（付帯表2と一致）: 自動化(UI) 0（画面はスコープ外＝母集合外補助観測）／自動化(API/統合) 21（001,002,003,004,005,008,009,011,013,017,018,024,025,026,027,030,031,032,033,036,037）／手動・要実機 6（006,010,012,014,015,029）／対象外 11（007,016,019,020,021,022,023,028,034,035,038）。**未分類 0**（母集合38行）。母集合外の正本md補完ケースは別管理（051,052,053,054,055,056,057,058,060,062,071,072,081＝API/統合＝HTTPまたは副作用のDB観測。072は母集合018にも対応、071は例外500時の部分更新なしの手動補完。観点列は正本md由来表記＝区分整合・副作用・データ整合性・実行結果・エラーで記し、IT-33の対象外観点名＝自動加算・実数更新・売上返品・連携エラーを再利用しない）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A07-05-JWT-MEMBER | 管理者会員A＋jwt-token | 有効な管理者会員1（会員A）と、それに対応するjwt-token（HS256・`jwt-token`ヘッダ）。トークン原値・署名シークレットは環境変数で供給し正典・ログに書かない | fixture／env（環境ガード `test.skip`） | 専用会員・撤去可。トークンは環境隔離。原値非記載 | 001-004,030-082 |
| SEED-A07-05-STATUS-MASTER | 買取受注ステータスマスタ（`mtb_buy_order_status`） | 正本md記載の買取受注ステータスID群が存在する。存在しないID（例999）はマスタに無いこと。値定義の正は正本md（実装定数との差は付帯表4#5） | fixture／migration | 固定マスタ・撤去不要 | 全ケース |
| SEED-A07-05-ORDER-OPEN | ネット買取受注（`dtb_buy_order`） | 受注1件。更新前ステータス＝査定終了前の中間状態。既存明細を最小限保持。査定担当者未設定 | fixture／migration | 専用受注・初期状態へ復元してべき等化。更新系はテスト毎にリセット | 001-004,010,011,030,031-045,050,057,059,060,061,062,070,071,072,080,081,082 |
| SEED-A07-05-ORDER-WITH-DETAILS | ネット買取受注（`dtb_buy_order`）＋明細群 | 受注1件＋既存の買取代表カード（`dtb_buy_main_card`）・個別入力商品（`dtb_buy_order_indivisual_input_product`）・申込時買取価格（`dtb_application_price`）・まとめ買取商品の既存カード・サプライ/パック相当（カード詳細ID未設定）の明細を含む。明細CRUD・削除・引き継ぎ・保持の検証用 | fixture／migration | 専用受注・初期状態へ復元してべき等化 | 051,052,053,054,055,056,058 |
| SEED-A07-05-OPTION-BULK | オプションマスタ（`mtb_option`） | まとめ買取商品ID（`BULK_PURCHASE_ID` 相当の設定）が設定済み。まとめ買取商品の判定用。設定値の正は別API（まとめて買取商品IDの取得API）の設計 | fixture／migration | 固定マスタ・撤去不要 | 055 |
| SEED-M01-ADMIN | dtb_member（管理者） | ネット買取受注・ステータス履歴を閲覧する有効な管理者1（ID/PWは config 既定。2FA OFF）。本体TSV（DB観測）では不要で、母集合外のUI補助観測（要実機確認）でのみ使用する | fixture（config既定） | 既存利用・撤去不要 | 050/051-058/060/061（母集合外UI補助観測・要実機） |

注: `order_status` 値・ステータスの意味づけは正本md（用語・入出力）を正とする。**実装のステータス定数は正本mdの定義と異なる可能性があるため、シードは正本mdの値定義で組み、実装差は付帯表4#5で管理する**。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_buy_order`／`dtb_buy_main_card`／`dtb_buy_order_indivisual_input_product`／`dtb_application_price`／`dtb_buy_order_status_histry`／`mtb_buy_order_status`／`mtb_option`）に従い、ステータス履歴は物理テーブル名 `dtb_buy_order_status_histry`（移行先正・付帯表4#1の現行物理名差）を用いる。jwt-token原値・署名シークレット（`auth_magic`／`JWT_SECRET`）は環境変数で供給し、正典・ログに原値を書かない。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様（正本md） | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /admin/buyOrder/{id}.json`（利用者視点の入口） | `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}.json', methods:['PUT'])]`（BuyOrderController.php:170）＋既定 `api/v1`（eccube.yaml:6,55）＝実効 `PUT /api/v1/admin/buyOrder/{id}.json` | **正本md記載パスに接頭辞 `/api/v1` が無く実装に有る**。テストは実効パスへ送信し本差異を記録。合否はパス文字列でなく更新結果で判定 | 全API/統合ケース | 不具合候補(パス接頭辞乖離) |
| 2 | 入力検証失敗は入力不正（HTTP400）（処理フロー#3・バリデーション） | DTOは `#[MapRequestPayload]`（BuyOrderController.php:171）。Symfonyの既定では検証失敗時に422 Unprocessable Entityを返す実装系がある | **検証失敗のHTTPステータスが正本md（400）と実装（422の可能性）で相違し得る**。テストは正本mdの400をオラクルとし、実装が422なら落ちて検出。実際のステータスは要実機確認 | 031,032,034,036-041 | 要確認(検証失敗ステータス400/422) |
| 3 | order_status未指定は「ステータスを選択してください。」／order_details空は「1つ以上の商品を選んでください。」（句点あり／バリデーション） | `'ステータスを選択してください'`（UpdateBuyOrderDto.php:29）／`'1つ以上の商品を選んでください'`（UpdateBuyOrderDto.php:34-35）＝いずれも末尾句点なし | **実装の必須メッセージが末尾句点を欠く**。テストは正本md文言をオラクルとする | 035 | 不具合候補(必須メッセージ文言乖離) |
| 4 | マスタ非存在order_statusは「MtbBuyOrderStatusに（値）が見つかりません。」（バリデーション） | `'正しい買取ステータスIDを入力してください'`（BuyOrderController.php:183-186） | **実装のメッセージが正本mdと不一致**。テストは正本md文言をオラクルとし、実装が違えば落ちて検出 | 033 | 不具合候補(マスタ非存在メッセージ文言乖離) |
| 5 | 買取受注ステータスの値定義・査定終了処理で指定するステータス（用語・入出力） | 実装定数 `MtbBuyOrderStatus.php:29-59`（ORDERED/PRODUCT_ARRIVAL/APPRAISAL_COMPLETE/APPRAISAL_ACCEPTANCE 等） | **正本mdはステータスの個別値定義を明示しない（買取受注ステータスマスタに依存）。実装定数との対応は要確認**。シードは正本mdの「マスタに存在する/しない」区分で組み、個別値の意味づけは要実機確認 | 001,032,050,060 | 要確認(ステータス値定義の対応) |
| 6 | 明細`name`は必須かつ最大65535。整数項目は「整数」のみ検証（バリデーション・入出力） | `name` は `DtbBuyOrderIndivisualInputProduct.name` の列長255（DtbBuyOrderIndivisualInputProduct.php:35）／整数項目は `Assert\PositiveOrZero`（UpdateBuyOrderDetailDto.php:26,35,39,58）で0以上のみ許容 | **(a) nameの最大長が正本md(65535)と個別入力商品の列長(255)で相違し得る。(b) 整数項目は実装が負値も不正扱い（0以上限定）で、正本mdの「整数」より狭い**。テストは正本md（最大65535・整数）をオラクルとし、実装差は落ちて検出。境界長・負値の実挙動は要実機確認 | 037,038,039,040,041 | 不具合候補/要確認(name最大長・整数項目の負値扱い) |
| 7 | 更新処理中の例外は共通例外処理（HTTP500相当・ロールバック／エラー処理・排他制御） | `catch(\Throwable)→InternalException('システムエラーが発生しました')`（UpdateBuyOrderAction.php:130-138／BuyOrderController.php:202-204）＋`beginTransaction`/`commit`（:57,120-121） | 実装は例外を隠蔽し500相当へ集約しトランザクションでロールバック。例外の実再現・部分更新なしの確認は外部依存で要実機確認 | 070,071 | 要確認(例外500・部分更新なしの実再現) |
| 8 | エラーメッセージ配列の並び順（バリデーション「収集したエラーメッセージを1つの配列にまとめる」） | 収集順は実装依存（UpdateBuyOrderDto/DetailDtoの検証順・controllerのマスタ判定順） | **正本mdはerrors配列の並び順を定義しない**。一括返却（全件送出）はオラクル化（042）し、ソート順は固定せず要実機確認 | 042,043 | 要確認(errors並び順) |

## 付帯表5：設計書網羅マトリクス（正本md節→テストID・未カバーは理由付き）

| 正本mdの節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（PUT buyOrder/{id}.json） | 実効パスへの正常な査定終了処理200応答 | 001,002,003 | カバー（.json実効パス。接頭辞差は付帯表4#1） |
| 認証・認可（jwt-token・HS256・401） | トークン欠落/署名不正/会員なし→401 | 010,011,012 | カバー |
| 処理フロー#1 認証 | 認証拒否401 | 010,011,012 | カバー |
| 処理フロー#2 受注取得 | 該当なし404 | 030 | カバー |
| 処理フロー#3 入力検証 | order_status必須/マスタ存在・order_details必須・各明細の名称必須/整数・複数エラー集約→400 | 031-042,044,045 | カバー（HTTPステータス400は付帯表4#2要確認。並び順は手動043） |
| 処理フロー#4 明細処理（個別入力/代表カードの登録・更新・申込時買取価格引き継ぎ） | product_class_id=0の新規/更新・商品規格カードの新規/更新・申込時買取価格引き継ぎ | 051,052,053,056 | カバー（API/統合＝DB観測） |
| 処理フロー#5 まとめ買取/サプライ保持 | まとめ買取は申込時買取価格のみ削除・サプライ/パック相当は合計額加算保持 | 055,058 | カバー（API/統合＝DB観測） |
| 処理フロー#6 受注更新・不要明細削除 | ステータス・合計額・代表カード・個別入力商品・担当者・更新日時の設定／保持しない明細と申込時買取価格の削除 | 050,054 | カバー（API/統合＝DB観測） |
| 処理フロー#7 ステータス変更時の履歴登録 | 変更時のみ履歴1件登録／内容一致／変更なしは未登録 | 060,061,062 | カバー（API/統合＝DB観測） |
| 処理フロー#8 トランザクション/ロールバック | 例外時ロールバック・500・部分更新なし | 070,071 | カバー（正典どおり500相当のみ期待値化＝手動/要実機。部分更新なしは要実機確認） |
| 処理フロー#9 成功応答 | 成功200・`{code:200}` | 001,002 | カバー |
| 入出力（リクエスト：id/order_status/order_details/各明細キー・jwt-token） | 必須項目・想定外項目の扱い | 031,034,036,080 | カバー（想定外項目は手動・要実機080） |
| 入出力（レスポンス成功 `{code:200}`／失敗 `{code,errors}`） | 成功/失敗の本文型契約 | 002,044 | カバー |
| バリデーション（必須/整数/上限/マスタ存在/1配列集約） | 必須/非整数/上限超過/非存在/複数集約 | 031,034,036,037,038,039,040,041,032,042 | カバー（メッセージ文言の差は付帯表4#3,#4,#6） |
| 業務ルール・計算（合計額10円単位切上げ） | 単価×数量＋保持分を10円単位で切上げ | 057,058 | カバー（API/統合＝DB観測） |
| データ整合性（更新範囲＝他項目を変更しない／参照時点／同時更新後勝ち） | 他項目不変・受注なし404・後勝ち再実行 | 059,030,081 | カバー（API/統合＝HTTP/DB観測） |
| 副作用（受注更新／明細CRUD／申込時買取価格削除・引き継ぎ／履歴登録） | 各テーブルのDB反映・削除・登録 | 050,051,052,053,054,055,056,060,061 | カバー（API/統合＝DB観測。管理画面表示は母集合外の補助観測・要実機） |
| エラー処理（認証/受注なし/入力検証/更新例外） | 401/404/400各分岐・500相当 | 010,030,031,032,070 | カバー（更新例外は正典どおり500相当のみ期待値化＝手動/要実機。タイムアウト応答は正典未定義で要実機確認082） |
| 権限・認可（認証済み管理者のみ更新可・担当者/履歴に記録） | 認証成功⇔401の対・担当者記録 | 001,010,061 | カバー |
| 排他制御・トランザクション（楽観/悲観ロックなし・後勝ち・1トランザクション） | 同時実行数の制限は持たない／後勝ち | 081／（同時実行数制限は対象外＝IT-19 007） | カバー（後勝ち081）／同時実行数制限は対象外（該当処理なし・理由付き） |
| ログ・監査（例外メッセージのエラーログ出力／機密値ログ抑止） | アプリログの例外出力・機密値抑止はサーバログ実機観測 | （ログ出力は要実機） | 手動・要実機（ブラウザ/APIレスポンスに現れずログのみ＝観測外。機密値抑止はサーバログ実機観測） |

未カバーはいずれも理由を明記済み。想定外項目（IT-32・080）は正本mdが扱いを定義せず期待挙動を規定できないため手動・要実機とした。同時実行数の制限（IT-19）は正本mdが楽観/悲観ロックを持たず後勝ちと定めるため対象外（該当処理なし）。エラーメッセージのソート順／外部キャッシュ／決済代行／転送再連携（IT-10）・数量金額の外部取引/自動加算/実数更新/売上返品/連携（IT-33）は本機能（明細・合計額・履歴のDB更新APIで、外部決済/キャッシュ/転送なし・数量金額の外部連携計算なし）に非該当または正典未定義で対象外/手動。バージョニング（IT-32）は正典にAPIバージョン指定が無く対象外。タイムアウト・更新処理中の例外500（IT-10）は正典に応答定義が無く手動・要実機。正本mdの各節はAPI/統合レイヤ（HTTPステータス・本文契約・判定分岐／副作用は永続化先テーブルのDB観測で受注・明細・合計額・担当者・更新日時・履歴を確認）へ写像し、正常×異常の対（完了成功⇔検証エラー/受注なし/認証拒否・状態不正（マスタ非存在）⇔有効ステータス・必須⇔指定・権限⇔認証拒否・二重完了（後勝ち再実行）⇔単発成功）を独立ケースで揃えた。管理画面でのUI確認は正典がスコープ外とするため母集合外の補助観測（要実機確認）に分離した。
