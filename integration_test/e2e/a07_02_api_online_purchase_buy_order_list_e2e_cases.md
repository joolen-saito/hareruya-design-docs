# A07-02（オンライン仕入_買取注文一覧） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a07-02_api_online_purchase_buy_order_list.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a07-02_api_online_purchase_buy_order_list.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a07_02_api_online_purchase_buy_order_list_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わない参照系JSON API（`GET /admin/buyOrders.json`）であり、買取アプリ（MTGバイヤー）が査定対象のネット買取受注一覧を取得する。両レイヤ網羅のうち実質はAPI/統合レイヤで網羅する。API/統合レイヤ＝Playwright `request` でエンドポイントへ`jwt-token`ヘッダ付きGET送信し、HTTPステータス・応答配列・各フィールド値（SEEDの既知期待値と照合）で判定する。本APIの結果はEC-CUBE管理画面ではなく外部買取アプリで消費されるため、UIレイヤ観測は本機能のスコープ外（UIレイヤ＝0件）。

**期待結果は仕様（正本md・観点表）由来**とし、実装のレスポンス整形（日時書式・null/空文字の差異・整数/文字列キャスト）を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdを上位オラクルとし、実装からは位置情報（パス・メソッド・認証方式・ステータス定数）のみを `file:line` 根拠で取得する。取れないものは `要実機確認`。設計と実装の食い違いは付帯表4に出し、テストは仕様どおりに書く（実装が違えば落ちて検出する）。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 受信検証・資格情報・必須条件・リクエスト・レスポンス契約（配列/フィールド型/null/日時書式/住所連結）・データなし（空配列）。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-09 | 正常取得のHTTPステータス・実行結果・外部取得・並び順 |
| IT-19 | 同時実行数の制限（正典に制限定義が無く対象外） |
| IT-10 | HTTPステータス・通信・正常／異常系・形式不正・障害・重複/順序（参照冪等）。複数バリデーション一括返却/ソート順・決済代行・転送再連携は本機能に非該当で対象外。例外/タイムアウト/障害は手動 |
| IT-33 | 区分整合（査定対象ステータスのみ抽出・対象外除外）。数量/金額更新・売上返品・履歴・連携は参照系で非該当のため対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-001	IT-09	リクエスト	P1	正常なjwt-tokenで査定対象一覧が200で取得できる	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（管理者会員）	"1. GET /api/v1/admin/buyOrders.json にjwt-tokenヘッダ付きで送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200で、査定対象のネット買取受注を要素とする配列が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-002	IT-09	実行結果	P3	正常取得時に受注基本情報と申込者情報を含む配列が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. レスポンス本文の構造を確認する"	各要素が受注の基本情報とcustomerInfo（申込者情報）をネストした構造で返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-003	IT-09	HTTPステータス	P3	認証成功時のHTTPステータスが200となる	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. HTTPステータスを確認する"	認証が成功し、HTTPステータス200が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-004	IT-09	外部取得	P1	買取アプリからの一覧取得要求に200で配列を返す	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200で受注配列が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-005	IT-10	通信	P1	正常通信でHTTPステータス200が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータス200が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-006	IT-10	正常	P2	査定対象が存在する条件で200と該当配列が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200で、査定対象ステータスの受注が配列で返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-010	IT-32	受信検証	P1	署名不正トークンは認証拒否で401となる	SEED-A07-02-JWT-INVALID	署名が不正なjwt-tokenヘッダ	"1. 署名不正トークンでGET送信する
2. HTTPステータスを確認する"	認証拒否としてHTTPステータス401が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-011	IT-32	資格情報	P1	該当する管理者会員がないトークンは401となる	SEED-A07-02-JWT-INVALID	署名は正しいが該当する管理者会員が存在しない利用者IDのjwt-token	"1. 該当会員なしトークンでGET送信する
2. HTTPステータスを確認する"	認証拒否としてHTTPステータス401が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-012	IT-32	必須条件	P3	jwt-tokenヘッダ欠落は401で一覧が返らない	SEED-A07-02-ORDERS-ASSESS	jwt-tokenヘッダなし	"1. jwt-tokenヘッダを付けずにGET送信する
2. HTTPステータスとレスポンス本文を確認する"	認証拒否としてHTTPステータス401が返り、受注一覧が返らないこと。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-013	IT-10	形式不正	P2	JWT形式として不正な文字列は成功扱いせず401となる	SEED-A07-02-JWT-INVALID	JWT形式として不正な文字列のjwt-tokenヘッダ	"1. 不正形式トークンでGET送信する
2. HTTPステータスを確認する"	成功扱いされず認証拒否としてHTTPステータス401が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-014	IT-10	HTTPステータス	P1	認証不可の異常時にHTTPステータス401が返る	SEED-A07-02-JWT-INVALID	認証不可となるjwt-tokenヘッダ	"1. 認証不可リクエストでGET送信する
2. HTTPステータスを確認する"	認証不可の異常時にHTTPステータス401が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-015	IT-10	異常系	P2	異常系リクエストでHTTPステータス401が返る	SEED-A07-02-JWT-INVALID	認証要件を満たさない異常系リクエスト	"1. 異常系リクエストでGET送信する
2. HTTPステータスを確認する"	HTTPステータス401が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-016	IT-09	リクエスト	P1	認証済み会員は絞り込みなしで査定対象を一律取得する	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	複数の管理者会員に紐づく査定対象受注が混在する状態の有効jwt-token	"1. エンドポイントへGET送信する
2. 返る受注の範囲を確認する"	認証した管理者会員に紐づく絞り込みを行わず、査定対象の受注が一律に返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-020	IT-32	リクエスト	P3	査定対象ステータスの受注のみ抽出される	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. 返る受注のステータスを確認する"	商品到着(2)・査定中(10)・保留(11)・査定再開(12)のステータスの受注のみが配列に含まれること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-021	IT-33	区分整合	P1	対象外ステータスの受注は一覧に含まれない	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS
SEED-A07-02-ORDERS-EXCLUDED"	有効なjwt-tokenヘッダ（対象外ステータスの受注も投入済）	"1. エンドポイントへGET送信する
2. 返る受注のステータスを確認する"	受付・成立・キャンセル等の対象外ステータスの受注が配列に含まれないこと。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-022	IT-32	データなし	P3	該当受注が無い場合は200で空配列が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-EMPTY"	有効なjwt-tokenヘッダ（該当受注なし）	"1. エンドポイントへGET送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200で空配列が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-023	IT-09	実行結果	P2	配列要素が受注ID昇順で並ぶ	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（受注ID昇順でない投入順の複数受注）	"1. エンドポイントへGET送信する
2. 返る配列の並び順を確認する"	配列要素が受注ID（netBuyOrderId）の昇順で並ぶこと。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-030	IT-32	レスポンス	P3	応答本体がラッパなしの受注オブジェクト配列である	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. レスポンス本体の形を確認する"	応答本体がラッパオブジェクトや件数フィールドを持たない受注オブジェクトの配列であること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-031	IT-32	リクエスト	P3	想定外クエリパラメータがあっても200で無視される	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ＋想定外のクエリパラメータ（項目名と値のセット）	"1. 想定外クエリ付きでGET送信する
2. HTTPステータスとレスポンス本文を確認する"	想定外パラメータがあってもエラーにならず、HTTPステータス200で査定対象配列が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-032	IT-32	レスポンス	P2	applyDateがISO8601形式で返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. エンドポイントへGET送信する
2. applyDateの書式を確認する"	applyDateがISO8601形式の日時文字列で返ること（付帯表4#2に仕様乖離）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-033	IT-32	レスポンス	P3	フリーコメント未設定の受注でfreeCommentがnullとなる	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（フリーコメント未設定の受注を含む）	"1. エンドポイントへGET送信する
2. 該当受注のfreeCommentを確認する"	フリーコメント未設定の受注でfreeCommentがnullで返ること（付帯表4#3に仕様乖離）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-034	IT-32	レスポンス	P3	会員が紐づかない受注でmemberNameがnullとなる	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（会員未割当の受注を含む）	"1. エンドポイントへGET送信する
2. 該当受注のmemberNameを確認する"	申込者を登録した会員が紐づかない受注でmemberNameがnullで返ること（付帯表4#4に仕様乖離）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-035	IT-32	レスポンス	P2	netBuyOrderIdとnetOrderStatusIdがinteger型で既知値どおり返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（応答主要フィールドの既知値を持つ受注）	"1. エンドポイントへGET送信する
2. 該当受注のnetBuyOrderId・netOrderStatusIdの型と値を確認する"	netBuyOrderIdとnetOrderStatusIdがinteger型で、いずれもシード既知値どおりに返ること（付帯表4#5に仕様乖離）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-036	IT-32	レスポンス	P2	customerInfoの文字列フィールドが型と既知値で返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（申込者情報の既知値を持つ受注）	"1. エンドポイントへGET送信する
2. 該当受注のcustomerInfo.firstName・lastName・telNo・zipcodeの型と値を確認する"	customerInfo.firstName・lastName・telNo・zipcodeがいずれもstring型で、シード既知値どおりに返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-037	IT-32	レスポンス	P2	住所が都道府県名・住所1・住所2の連結となる	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ（都道府県・住所1・住所2を持つ受注）	"1. エンドポイントへGET送信する
2. 該当受注のcustomerInfo.addressを確認する"	customerInfo.addressが都道府県名・住所1・住所2を半角空白区切りで連結した文字列で返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-040	IT-10	エラー	P3	整形処理中の例外時に500相当が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER"	受注取得・整形処理中に例外を誘発するシナリオ	"1. 例外を誘発する状態でGET送信する
2. HTTPステータスを確認する"	受注取得・整形処理中に例外が発生した場合、共通例外処理によりHTTPステータス500相当が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-041	IT-10	エラー	P3	タイムアウト時の応答を実機観測する（期待値非固定）	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER"	タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してGET送信する
2. 応答を確認する"	タイムアウト時の具体的な応答内容は正本mdに定義が無いため期待値を固定せず、実機でHTTPステータスと応答本文を観測し記録する（要実機確認）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-042	IT-10	障害	P2	DB障害時の応答を実機観測する（期待値非固定）	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER"	データ取得時のDB障害を誘発するシナリオ	"1. DB障害を誘発してGET送信する
2. 応答を確認する"	DB障害時の具体的な応答・挙動は正本mdに定義が無いため期待値を固定せず、実機でHTTPステータスと応答本文を観測し記録する（要実機確認）。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-043	IT-10	重複・順序	P3	同一トークンの反復取得で副作用なく同一結果が返る	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ	"1. 同一トークンでGET送信を複数回・順不同に行う
2. 各応答とDB状態を確認する"	複数回・順不同に取得しても副作用なく同一の受注配列が返ること。				
a07-02_api_online_purchase_buy_order_list（API_オンライン仕入_買取注文一覧）	E2E-A07-02-050	IT-20	追跡情報	P3	ログに個人情報・トークン原値が平文出力されない	"SEED-A07-02-JWT-VALID
SEED-A07-02-MEMBER
SEED-A07-02-ORDERS-ASSESS"	有効なjwt-tokenヘッダ／認証失敗トークン	"1. 正常／認証失敗リクエストでGET送信する
2. アプリケーションログの該当エントリを確認する"	一覧取得・認証失敗のログに申込者の氏名・電話番号・郵便番号・住所等の個人情報およびトークン原値が平文出力されないこと。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

実効エンドポイントは `GET /api/v1/admin/buyOrders.json`（route name `api_admin_buy_orders_product_arrival`／`BuyOrderController.php:59`）。`eccube_api_v1_route` 既定値 `api/v1`（`app/config/eccube/packages/eccube.yaml:6,55`）。認証はfirewall `app`（pattern `^/api/v1/`・`access_token` token_handler `JwtTokenHandler`・extractor `JwtTokenHeaderExtractor`／`app/config/eccube/packages/security.yaml:33-39`）で、ヘッダ名は `jwt-token`（`JwtTokenHeaderExtractor.php:29`）、署名方式HS256（`JwtTokenService.php:41,86`）、ペイロードの利用者IDから管理者会員を引く（`JwtTokenHandler.php:72`）、コントローラは `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（`BuyOrderController.php:44`）。認証失敗は401。**正本mdのパス `GET /admin/buyOrders.json` は実装では `api/v1` プレフィクス付き `/api/v1/admin/buyOrders.json` で公開される。送信先は実装の実効パス一本に統一し、合否は仕様の意味（200＝査定対象配列／401＝認証拒否／フィールド契約）で判定する。パス差異は付帯表4（#1）でのみ不具合候補として一元管理し、TSV期待値には実装パスを契約として固定しない。** 抽出処理は `findToAssessBuyOrders`（`DtbBuyOrderRepository.php:286`・受注ID昇順 `orderBy('buyOrder.id','ASC')`／`:314`）、抽出ステータス集合は `[PRODUCT_ARRIVAL(2),ASSESSING(10),PENDING(11),RESUMPTION(12)]`（`DtbBuyOrderRepository.php:288-293`＋`MtbBuyOrderStatus.php:31,47,49,51`）、`IN (:targetStatusIds)`（`:312`）。応答整形は `BuyOrderController.php:64-87`、住所連結は `implode(' ', array_filter([prefName,addr01,addr02]))`（`:65-69`）。本APIの結果は外部買取アプリで消費されEC-CUBE管理画面に現れないため、UIレイヤは本機能のスコープ外。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A07-02-001/002/003/004 | E2E自動化(API/統合) | `GET /api/v1/admin/buyOrders.json`（BuyOrderController.php:59／eccube.yaml:6,55） | 利用者視点の入口・処理フロー#1-4・レスポンス（成功）／IT-09 | IT-A07-02-...-004,002,003,024 |
| E2E-A07-02-005/006 | E2E自動化(API/統合) | `GET /api/v1/admin/buyOrders.json`（BuyOrderController.php:59） | 利用者視点の入口・レスポンス（成功）／IT-10 | IT-A07-02-...-026,027 |
| E2E-A07-02-010/011/012/013/014/015 | E2E自動化(API/統合) | firewall `app` access_token（security.yaml:33-39／JwtTokenHeaderExtractor.php:29／JwtTokenService.php:41,86／JwtTokenHandler.php:72）＋IsGranted（BuyOrderController.php:44） | 認証・認可・処理フロー#1・エラー処理（認証不可→401）／IT-32・IT-10 | IT-A07-02-...-036,001,031,028,025,030 |
| E2E-A07-02-016 | E2E自動化(API/統合) | 絞り込みなしで一律取得（findToAssessBuyOrdersに会員/店舗条件なし・DtbBuyOrderRepository.php:286-316） | 認証・認可（紐づく絞り込みは行わず一律返す）・権限・認可表・処理フロー#2／IT-09 | IT-A07-02-...-004 |
| E2E-A07-02-020/021 | E2E自動化(API/統合) | 抽出ステータス `[2,10,11,12]`（DtbBuyOrderRepository.php:288-293／MtbBuyOrderStatus.php:31,47,49,51）／`IN (:targetStatusIds)`（:312） | 集計条件 抽出対象（商品到着2・査定中10・保留11・査定再開12のみ・それ以外除外）・データ整合性 抽出範囲／IT-32・IT-33 | IT-A07-02-...-005,017 |
| E2E-A07-02-022 | E2E自動化(API/統合) | 応答整形（BuyOrderController.php:64,87）／空配列 | 処理フロー#4（該当なしは空配列）・レスポンス（成功 該当が無い場合は空配列）／IT-32 | IT-A07-02-...-033 |
| E2E-A07-02-023 | E2E自動化(API/統合) | `orderBy('buyOrder.id','ASC')`（DtbBuyOrderRepository.php:314） | 集計条件 並び順（受注ID昇順）／IT-09 | （母集合外・設計書補完） |
| E2E-A07-02-030/031 | E2E自動化(API/統合) | 応答整形（BuyOrderController.php:71-84）／`JsonResponse($response)`（:87） | レスポンス（成功 配列・ラッパ無し）・入出力 リクエスト（jwt-token以外のパラメータを持たない）／IT-32 | IT-A07-02-...-032,006 |
| E2E-A07-02-032 | E2E自動化(API/統合)（要実機確認・付帯表4#2） | `applyDate ... format('Y/m/d H:i:s')`（BuyOrderController.php:73） | レスポンス（成功 applyDate＝ISO8601）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-033 | E2E自動化(API/統合)（要実機確認・付帯表4#3） | `freeComment => $buyOrder['memo'] ?? ''`（BuyOrderController.php:74） | レスポンス（成功 freeComment 未設定はnull）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-034 | E2E自動化(API/統合)（要実機確認・付帯表4#4） | `memberName => ... ?? ''`（BuyOrderController.php:75）／leftJoin Member（DtbBuyOrderRepository.php:296） | レスポンス（成功 memberName 紐づき無し時null）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-035 | E2E自動化(API/統合)（要実機確認・付帯表4#5） | `netBuyOrderId => (string)`（BuyOrderController.php:72）／`netOrderStatusId => (string)`（:76） | レスポンス（成功 netBuyOrderId・netOrderStatusId＝integer）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-036 | E2E自動化(API/統合) | customerInfo整形（BuyOrderController.php:77-83）／`JsonResponse($response)`（:87） | レスポンス（成功 フィールド契約：firstName/lastName/telNo/zipcode＝string・既知値照合）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-037 | E2E自動化(API/統合) | 住所連結 `implode(' ', array_filter([prefName,addr01,addr02]))`（BuyOrderController.php:65-69／leftJoin Pref DtbBuyOrderRepository.php:297） | 集計条件 結合（都道府県名・住所1・住所2を半角空白区切りで連結）・レスポンス（成功 address）／IT-32 | （母集合外・設計書補完） |
| E2E-A07-02-040 | 手動（要実機確認・500実再現） | 共通例外処理（受注取得・整形中の例外送出）／例外誘発は実機依存 | エラー処理（整形中の例外→HTTP500相当）／IT-10 | IT-A07-02-...-008 |
| E2E-A07-02-041 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は実機依存 | エラー処理・データ整合性／IT-10 | IT-A07-02-...-015 |
| E2E-A07-02-042 | 手動（要実機確認・DB障害実再現） | DB障害誘発は実機依存 | エラー処理（共通例外処理）／IT-10 | IT-A07-02-...-029 |
| E2E-A07-02-043 | E2E自動化(API/統合) | `GET /api/v1/admin/buyOrders.json`（BuyOrderController.php:59）／副作用 無し（正本md:165-167,256） | 副作用（参照のみ）・データ整合性 参照時点／IT-10 | IT-A07-02-...-037 |
| E2E-A07-02-050 | 手動（要実機確認・ログ実機観測） | ログ・監査「ログに出してはいけないもの」（正本md:243-251）／実装のログ抑止は要実機確認 | ログ・監査（個人情報・トークン原値を出力しない）／観点表IT-20 | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）で、多くがバリデーション一括返却・決済代行・数量金額更新・転送再連携など本参照系APIに非該当の観点を含む。本E2Eは正本md（処理フロー・集計条件・入出力・認証認可・権限・エラー処理・ログ）を一次オラクルとして網羅し、非該当観点は付帯表2で理由付き対象外に分類した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a07_02_api_online_purchase_buy_order_list_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報・受信検証・必須条件・リクエスト・レスポンス・データなしはHTTPステータス/応答配列で観測可。バージョニングは正典にバージョン依存挙動の定義が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常取得のHTTPステータス・実行結果・外部取得・リクエスト |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 同時実行数の制限は正典に制限定義が無く対象外（理由付き） |
| IT-10 | 18 | 0 | 6 | 3 | 9 | 複数バリデーション一括返却/ソート順(6件)・決済代行(2件)・転送再連携(1件)は本機能に非該当で対象外。例外/タイムアウト/障害(3件)は手動 |
| IT-33 | 7 | 0 | 1 | 0 | 6 | 区分整合は抽出ステータス整合としてAPI/統合。数量金額更新・売上返品・外部取引・自動加算・実数更新・連携エラー(6件)は参照系で非該当の対象外 |
| 合計 | 38 | 0 | 18 | 3 | 17 | **未分類 0** |

注1: 対象外17件＝IT-32 バージョニング(1)＋IT-19 同時実行制限(1)＋IT-10 複数バリデーション一括返却/ソート順(6)・決済代行(2)・転送再連携(1)＋IT-33 数量金額/売上返品/外部取引/自動加算/実数更新/連携エラー(6)。いずれも本参照系GET APIに対象処理・I/Fが無いため理由付き対象外（放置ではない）。

注2（母集合外・設計書補完ケース）: 正本md本文（権限・認可表／集計条件 並び順・住所連結／レスポンス フィールド契約／ログ・監査）から、母集合38行に対応行を持たない補完ケースを追加した。母集合集計には算入せず別管理する。内訳＝自動化(API/統合) 8（023,032,033,034,035,036,037＋016の再掲はIT-09母集合内のため除く）。正確には 023,032,033,034,035,036,037＝7件＋手動 1（050 ログ・個人情報抑止＝観点表IT-20相当）。016は母集合004（IT-09 リクエスト）に対応するため母集合内。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 011 |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001（＋一律取得016） |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 020（抽出対象ステータス） |
| 006 | IT-32 | リクエスト | 自動化(API/統合) | 031（想定外項目無視） |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 正典に同時実行数制限の定義が無く、固定期待を作れないため |
| 008 | IT-10 | エラー | 手動（要実機確認） | 040（整形中例外→500実再現） |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本機能は入力検証対象がなく複数エラー本文の一括返却を持たない |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 同上 |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 同上 |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 041（タイムアウト実再現） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン依存挙動の定義が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 自動化(API/統合) | 021（対象外ステータス除外） |
| 018 | IT-33 | エラー | 対象外 | 参照系で数量・金額・履歴の更新が無いため非該当 |
| 019 | IT-33 | 外部取引 | 対象外 | 参照系で外部取引の数量金額計算が無いため非該当 |
| 020 | IT-33 | 自動加算 | 対象外 | 参照系で加算処理・履歴作成が無いため非該当 |
| 021 | IT-33 | 実数更新 | 対象外 | 参照系で実数更新が無いため非該当 |
| 022 | IT-33 | 売上・返品 | 対象外 | 参照系で売上・返品の数量金額更新が無いため非該当 |
| 023 | IT-33 | 連携エラー | 対象外 | 参照系で外部連携の更新が無いため非該当 |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004 |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 014 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 005 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 006 |
| 028 | IT-10 | 形式不正 | 自動化(API/統合) | 013（不正トークン形式→401） |
| 029 | IT-10 | 障害 | 手動（要実機確認） | 042（DB障害実再現） |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 015 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 012（jwt-token欠落→401） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 030（配列・ラッパ無し） |
| 033 | IT-32 | データなし | 自動化(API/統合) | 022（空配列） |
| 034 | IT-10 | 正常系(決済代行整合) | 対象外 | 本機能は決済代行・外部決済を扱わないため非該当 |
| 035 | IT-10 | 異常系(決済代行二重課金) | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 010（署名不正→401） |
| 037 | IT-10 | 重複・順序 | 自動化(API/統合) | 043（参照冪等・反復で同一結果） |
| 038 | IT-10 | 部分失敗(転送・再連携) | 対象外 | 本機能は転送・再連携を行わないため非該当 |

集計（付帯表2と一致）: 自動化(API/統合) 18（001,002,003,004,005,006,017,024,025,026,027,028,030,031,032,033,036,037）／手動 3（008,015,029）／対象外 17（007,009,010,011,012,013,014,016,018,019,020,021,022,023,034,035,038）。**未分類 0**（母集合38行）。自動化(UI) 0。母集合外の設計書補完ケースは別管理（023,032,033,034,035,036,037＝自動化(API/統合) 7、050＝手動 1）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A07-02-JWT-VALID | JWT（jwt-tokenヘッダ・HS256） | 有効な管理者会員の利用者IDを含む正しい署名のJWT。署名シークレットはテスト環境固定 | env／fixture（原値はログ・設計書に書かない） | 環境隔離・撤去可。トークンは使い捨て | 001-006,016,020-024,030-043,050 |
| SEED-A07-02-JWT-INVALID | JWT（異常系） | 署名不正／JWT形式不正／該当管理者会員が存在しない利用者ID／欠落の各バリエーション | env／synthetic | テスト内生成・後始末不要 | 010,011,013,014,015,050 |
| SEED-A07-02-MEMBER | dtb_member（管理者会員） | SEED-A07-02-JWT-VALIDの利用者IDに対応する有効な管理者会員1。会員名 `name` を既知値で設定 | fixture／migration | 専用会員・撤去可 | 001-006,016,020-024,030-043,050 |
| SEED-A07-02-ORDERS-ASSESS | dtb_buy_order（査定対象） | 査定対象ステータス（2/10/11/12）の受注を複数。国内住所（都道府県・住所1・住所2）、フリーコメント未設定（null期待）、申込者を登録した会員未割当（null期待）、受注ID昇順でない投入順を含む。型・既知値照合用に応答主要フィールド（netBuyOrderId・netOrderStatusId・customerInfo.firstName/lastName/telNo/zipcode・applyDate）に既知値を設定 | fixture／migration | 専用受注・初期状態へ復元してべき等化 | 001,002,004,006,016,020,021,023,030,032-037,043,050 |
| SEED-A07-02-ORDERS-EXCLUDED | dtb_buy_order（対象外） | 受付(1)・成立・キャンセル等の対象外ステータス（2/10/11/12以外）の受注を複数 | fixture／migration | 専用受注・撤去可 | 021 |
| SEED-A07-02-EMPTY | dtb_buy_order | 査定対象ステータスの受注が1件も無い状態 | fixture／migration | 撤去可・空状態を保証 | 022 |

注: 受注データは正本md「レスポンス（成功）」「集計条件」「DBカラム」記載のフィールドに基づき最小構成する。受注主キーは移行先（ec-cube-enterprise）の `dtb_buy_order.id`（現行 `buy_order_id`）、会員結合は `dtb_member.id`／会員名 `name`、都道府県は `mtb_pref.name` を正典とする（正本md リニューアル移行時の扱い・DBカラム）。JWT署名シークレット（`auth_magic`／`JWT_SECRET`）・トークン原値・申込者個人情報はログ・設計書に書かず環境変数で供給する。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典に従う。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `GET /admin/buyOrders.json`（利用者視点の入口） | `#[Route('/%eccube_api_v1_route%/admin/buyOrders.json', methods:['GET'])]`（BuyOrderController.php:59）＋既定 `api/v1`（eccube.yaml:6,55）＝実効 `/api/v1/admin/buyOrders.json` | **正本mdのパスに `api/v1` プレフィクスが付く**。テストは実効パスへ送信し、本差異を記録（合否は仕様の意味で判定） | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | applyDateはISO8601形式の日時文字列（レスポンス（成功）） | `applyDate ... format('Y/m/d H:i:s')`（BuyOrderController.php:73） | **実装は `Y/m/d H:i:s`（スラッシュ区切り・非ISO8601）で返す**。テストはISO8601を期待 | 032 | 不具合候補(日時書式) |
| 3 | freeCommentは未設定の場合null（レスポンス（成功）） | `freeComment => $buyOrder['memo'] ?? ''`（BuyOrderController.php:74） | **実装は未設定時に空文字('')を返す（nullでない）**。テストはnullを期待 | 033 | 不具合候補(未設定値) |
| 4 | memberNameは紐づく会員が無い場合null（レスポンス（成功）） | `memberName => ... ?? ''`（BuyOrderController.php:75） | **実装は会員紐づき無し時に空文字('')を返す（nullでない）**。テストはnullを期待 | 034 | 不具合候補(未設定値) |
| 5 | netBuyOrderIdはinteger・netOrderStatusIdはinteger（レスポンス（成功）） | `netBuyOrderId => (string)`（BuyOrderController.php:72）／`netOrderStatusId => (string)`（:76） | **実装は両フィールドを文字列にキャストして返す（integerでない）**。テストはinteger型を期待 | 035 | 不具合候補(型乖離) |
| 6 | customerInfo.telNoはstring（レスポンス（成功）） | `telNo => $buyOrder['telNo'] ?? ''`（BuyOrderController.php:80） | 電話番号が未登録のとき実装は空文字を返す。正本mdは未設定時の値を明記せず、nullの可否は要確認 | 036 | 要確認(未設定値) |
| 7 | 認証失敗（欠落・署名不正・該当会員なし）は認証拒否でHTTP401・本文を持たない（認証・認可／レスポンス（失敗）） | firewall `app` access_token＋`JwtTokenHeaderExtractor`（HEADER_NAME `jwt-token`／:29）＋HS256（JwtTokenService.php:41,86）＋`JwtTokenHandler.php:72` | 認証方式・ヘッダ名・署名方式・会員特定は実装と一致。**401応答の本文形（正本md「本文を持たない」）は例外ハンドラ経由で要確認** | 010-015 | 要確認(401応答書式) |
| 8 | ログに申込者個人情報・トークン原値を出力しない（ログ・監査） | 一覧取得・認証経路のログ出力内容は未確認 | 個人情報・機密値のログ抑止の実装は要実機確認。テストは仕様どおり「平文出力されない」を期待 | 050 | 要確認(個人情報ログ抑止) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET /admin/buyOrders.json） | 正常取得200・配列／パス乖離記録 | 001,004（パスは付帯表4#1） | カバー |
| 認証・認可（jwt-token HS256／401／会員特定／絞り込みなし一律取得） | 署名不正・該当会員なし・欠落・形式不正→401／一律取得 | 010,011,012,013,016 | カバー |
| 処理フロー#1-4（認証→抽出→整形→空配列） | 認証・抽出・整形・空配列 | 010,020,030,022 | カバー |
| 集計条件 抽出対象（2/10/11/12のみ・それ以外除外） | 対象ステータスのみ抽出・対象外除外 | 020,021 | カバー |
| 集計条件 結合・一意化 | 受注単位の基本情報＋申込者情報のネスト／住所連結 | 002,030,037 | カバー |
| 集計条件 並び順（受注ID昇順）・ページングなし | 昇順・全件 | 023 | カバー |
| 入出力 リクエスト（jwt-token以外のパラメータなし） | 想定外クエリ無視・必須はjwt-tokenのみ | 031,012 | カバー |
| 入出力 レスポンス（成功 フィールド契約） | 配列・ラッパ無し／netBuyOrderId・netOrderStatusId integer／applyDate ISO8601／freeComment・memberName 未設定null／customerInfo文字列（firstName/lastName/telNo/zipcode）／address連結 の型・必須・既知値照合 | 030,032,033,034,035,036,037 | カバー（applyDate書式・null値・integer型は付帯表4#2-5で乖離記録） |
| 入出力 レスポンス（失敗 401/500） | 認証拒否401・整形例外500 | 014,015,040 | カバー（401書式は付帯表4#7要確認・500は手動） |
| バリデーション（入力検証なし） | 入力検証対象なし | （対象外＝付帯表2b 009-014） | 対象外（理由付き：入力検証対象が無く複数エラー本文の一括返却を持たない） |
| 業務ルール・計算（参照のみ・再計算なし）／副作用 無し | 反復取得で副作用なく同一結果 | 043 | カバー |
| データ整合性（参照時点・抽出範囲・一覧と詳細） | 査定対象のみ返す・明細を含まない | 020,030 | カバー |
| 権限・認可（認証済み会員は一律取得・未認証は401） | 一律取得／認証拒否 | 016,014 | カバー |
| エラー処理（認証不可401・整形例外500） | 401／500相当／タイムアウト／DB障害 | 014,040,041,042 | カバー（一部手動/要実機） |
| ログ・監査（個人情報・トークン原値を出力しない） | 機密値・個人情報のログ抑止 | 050 | 手動/要実機（サーバログ実機観測） |
| 同時実行数の制限（観点表IT-19） | レート制限 | （対象外） | 対象外（正典に同時実行数制限の定義なし） |
| バージョニング（観点表IT-32） | バージョン依存挙動 | （対象外） | 対象外（正典にバージョン依存挙動の定義なし） |
| 数量金額更新・売上返品・外部連携（観点表IT-33/IT-10 決済代行・転送再連携） | 数量金額・履歴・外部連携の整合 | （対象外） | 対象外（本参照系GET APIに更新処理・外部連携・転送が無く非該当） |

未カバーはいずれも理由（本機能が参照のみで入力検証・数量金額更新・外部連携・バージョニング・同時実行制限の定義を持たない／例外・タイムアウト・DB障害・ログ抑止は要実機）を明記済み。正本mdの各節（利用者視点の入口・認証認可・処理フロー・集計条件・入出力・権限・エラー処理・ログ）は両レイヤ網羅のうちAPI/統合レイヤへ写像し、正常×異常の対（正常取得001-006 ↔ 認証拒否010-015／抽出対象020 ↔ 対象外除外021／該当あり ↔ 空配列022／フィールド契約030-037 ↔ 整形例外040）を揃えた。設計と実装の食い違い（パス・日時書式・未設定値null/空文字・integer/string型・401書式・ログ抑止）は付帯表4に一元管理した。
