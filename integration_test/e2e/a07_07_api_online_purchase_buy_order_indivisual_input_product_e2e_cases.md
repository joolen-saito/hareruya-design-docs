# A07-07（オンライン仕入_買取注文個別入力商品） E2Eテストケース

元設計md（正本一次／pf-apiリバース）: `functions/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a07-07_api_online_purchase_buy_order_indivisual_input_product.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a07_07_api_online_purchase_buy_order_indivisual_input_product_it_cases.md`（母集合 計38観点行）

本機能は**ブラウザ向けの画面を持たない**参照系のJSON API（複数のネット買取受注ID→各受注に紐づく個別入力商品一覧の一括取得）であり、**API/統合レイヤ単独で網羅**する。参照系POSTで結果が管理画面に現れる範囲を持たないため**UIレイヤは0**。Playwright `request` で `POST /api/v1/admin/buyOrderIndivisualInputProduct.json` へ送信し、HTTPステータス・レスポンス本文（配列構造・フィールド・型・値・null契約）で判定する。本APIは参照のみ（副作用 無し）でDB更新観点を持たない。

**期待結果は仕様（正本md・観点表）由来**とし、実装のレスポンス形・型キャスト・HTTPライブラリ既定値を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本md・観点表を上位オラクルとし、乖離は付帯表4に出す。型契約（`buyOrderIndivisualInputProductId`/`buyOrderId`=integer・`name`=string・`price`/`count`=integer（未設定null）・`saleFlg`=boolean（未設定null）・`serialize_null`有効）は仕様の型で期待値化する。認証は正本mdが `jwt-token` ヘッダ・HS256・失敗時HTTP401（ヘッダ欠落／署名不正／該当管理者会員なし）と特定しているためJWT負例はAPI/統合レイヤで固定（署名検証の実方式は付帯表4#2の要実機確認）。仕様未定義の挙動（非数値ID・想定外項目・異常系の具体HTTPステータス・タイムアウト・レート制限・取得処理中の例外500の実再現）は固定せず `要実機確認`／`手動`。送信先は実装の実効パス `POST /api/v1/admin/buyOrderIndivisualInputProduct.json` に統一し、設計パス `POST /admin/buyOrderIndivisualInputProduct.json` との差異は付帯表4#1でのみ管理する。実装からは位置情報（APIパス・メソッド・認証方式・整形位置）のみを `file:line` 根拠で取得した。TSV は既存IT casesと同一の 10 列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | リクエスト（非数値ID・想定外項目＝正典未定義は要実機）・必須条件（空ids→空配列）・データなし（非対象IDのみ→空配列）・レスポンス（配列構造・型契約・null契約・フィールド名）・受信検証（形式受理）・資格情報（jwt-token/HS256・欠落/署名不正で401）。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 正常受信のHTTPステータス・実行結果・リクエスト正常（値照合）・外部取得（複数買取ID一括取得）・一部不存在 |
| IT-19 | 同時実行数の制限／レート制限（本APIのレート制限有無が正典未特定→手動/要実機確認） |
| IT-10 | HTTPステータス（0件でも200）・通信・正常・重複/順序・異常系・認証拒否（該当会員なし401）。タイムアウト・取得処理中の例外500は手動。複数バリデーション一括返却/ソート順・外部キャッシュ・決済代行・下流転送・専用失敗応答は本参照系APIに非該当＝対象外 |
| IT-33 | 数量・金額更新・外部連携（区分整合/外部取引/自動加算/実数更新/売上・返品/連携エラー）は本APIが参照のみで非該当＝対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-001	IT-09	実行結果	P1	複数買取ID正常取得でHTTP200・個別入力商品配列が返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の個別入力商品を持つネット買取受注IDを2件以上カンマ区切りで指定（ids）	"1. 対象エンドポイント（POST /api/v1/admin/buyOrderIndivisualInputProduct.json）へidsを指定して送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータスが200で、指定した買取受注IDに紐づく個別入力商品が配列としてJSONで返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-002	IT-09	HTTPステータス	P3	正常取得時のHTTPステータスが200	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の個別入力商品を持つ買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. HTTPステータスを確認する"	HTTPステータスが200（成功）であること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-003	IT-09	リクエスト	P1	正常パラメータでSEED期待値どおりの個別入力商品が返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の買取受注ID（SEED期待値が定義済）	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス本文の各フィールド値を確認する"	返却された各要素のbuyOrderIndivisualInputProductId・buyOrderId・name・price・count・saleFlgがSEEDの既知期待値と一致すること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-004	IT-09	外部取得	P1	複数買取受注に跨るIDで全対象の個別入力商品が一括取得される	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	異なるネット買取受注に属する個別入力商品を持つ買取受注IDを複数指定	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス配列のbuyOrderId集合を確認する"	指定した全買取受注IDに紐づく個別入力商品が過不足なく一括で返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-005	IT-10	通信	P1	通信成立しJSONで応答する	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. Content-Typeを確認する"	通信が成立し、レスポンスがJSON（application/json）で返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-006	IT-10	正常	P2	正常値で各フィールド値がSEED期待値と一致する	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	対象条件に該当する正常値（既知の買取受注ID）	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. 各要素のフィールド値を照合する"	各個別入力商品のname・price・count・saleFlgがSEEDの既知期待値と一致すること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-007	IT-10	HTTPステータス	P1	該当0件でも失敗ステータスを返さずHTTP200	SEED-A07-07-JWT-ADMIN／SEED-A07-07-ORDER-NOPRODUCT	紐づく個別入力商品が無い買取受注IDのみ指定	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. HTTPステータスを確認する"	専用の失敗ステータスを返さず、HTTPステータスが200であること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-008	IT-10	重複・順序	P1	重複/順不同の買取受注IDでも対応する個別入力商品を返す	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	同一買取受注IDの重複・順不同を含むidsリスト	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス本文を確認する"	重複・順序によらず、指定買取受注IDに紐づく個別入力商品がJSONで返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-009	IT-32	レスポンス	P3	正常応答が個別入力商品の配列で各要素が仕様フィールドを持つ	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンスの構造とフィールドを確認する"	レスポンスのルートが個別入力商品の配列で、各要素がbuyOrderIndivisualInputProductId・buyOrderId・name・price・count・saleFlgのフィールドを持つこと。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-010	IT-32	受信検証	P1	正しい形式のPOSTボディを受理しHTTP200	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	idsをボディに持つ正しい形式のPOSTリクエスト	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. HTTPステータスを確認する"	受信検証を通過し、HTTPステータスが200で正常応答が返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-011	IT-32	必須条件	P2	ids空/未指定でも必須エラーにせず空配列を返す	SEED-A07-07-JWT-ADMIN	idsを空文字または未指定	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス本文を確認する"	必須エラー（HTTP400）とならず、仕様どおり空配列（[]）がHTTP200で返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-012	IT-32	データなし	P2	紐づく個別入力商品が無い買取受注IDのみで0件正常応答を返す	SEED-A07-07-JWT-ADMIN／SEED-A07-07-ORDER-NOPRODUCT	個別入力商品が紐づかない買取受注IDのみ	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. HTTPステータスと本文を確認する"	エラーとせず0件正常応答（HTTP200）として返り、応答全体が空配列（[]）であること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-020	IT-32	資格情報	P1	有効なjwt-tokenで個別入力商品を取得できHTTP200	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	該当する管理者会員に紐づく有効なjwt-tokenヘッダ・正常なids	"1. 有効なjwt-tokenを付与してPOSTで送信する
2. HTTPステータスを確認する"	資格情報が有効な場合、HTTPステータス200で個別入力商品一覧を取得できること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-021	IT-32	資格情報	P1	jwt-tokenヘッダ欠落で401となり取得できない	SEED-A07-07-PRODUCTS-KNOWN	jwt-tokenヘッダを付与しないリクエスト	"1. jwt-tokenヘッダ無しでPOSTで送信する
2. HTTPステータスを確認する"	認証拒否を示すHTTPステータス401が返り、個別入力商品を取得できないこと。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-022	IT-10	重複・順序	P1	該当する管理者会員が無いjwt-tokenで401となり取得できない	SEED-A07-07-PRODUCTS-KNOWN	利用者IDに該当する管理者会員が存在しないjwt-token	"1. 該当会員なしのjwt-tokenでPOSTで送信する
2. HTTPステータスを確認する"	JWTの利用者IDから管理者会員を特定できず、HTTPステータス401が返り取得できないこと。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-023	IT-32	資格情報	P1	署名不正のjwt-tokenで401となり取得できない	SEED-A07-07-PRODUCTS-KNOWN	署名検証に失敗するjwt-token（署名シークレット不正）	"1. 署名不正のjwt-tokenでPOSTで送信する
2. HTTPステータスを確認する"	署名検証に失敗し、認証拒否を示すHTTPステータス401が返り、取得できないこと。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-030	IT-32	リクエスト	P3	非数値/型不正IDの受理・除外挙動が正典未定義である	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	既知の買取受注IDに非数値/型不正値を混在	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス本文を確認する"	非数値/型不正IDの受理・除外（エラー化・除外・0件化のいずれか）は正典未定義のため、期待結果を固定せず要実機確認とすること（付帯表4#3）。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-031	IT-32	リクエスト	P3	想定外項目を加えて送信した結果が正典未定義である	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	idsに加え想定外の項目（項目名と値のセット）を付与	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. 応答を確認する"	想定外項目の無視可否は正典未定義のため、期待結果を固定せず要実機確認とすること（付帯表4#3）。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-032	IT-10	異常系	P2	異常入力でもサーバエラーで停止しない	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	異常系を誘発する入力	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. 応答を確認する"	サーバ無応答・未定義例外で停止しないこと（異常入力時の具体的なHTTPステータスは正典未定義のため要実機確認・付帯表4#3）。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-050	IT-32	レスポンス	P2	price/count/saleFlgが未設定時にnullで返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-NULLFIELDS	price・count・saleFlgが未設定の個別入力商品を持つ買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. 該当フィールドの値を確認する"	price・count・saleFlgが未設定のとき、serialize_null有効によりnullで返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-051	IT-32	レスポンス	P3	priceとcountがinteger型で返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	price・countに値を持つ個別入力商品の買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. price・countの型を確認する"	査定金額priceと個数countが仕様どおりinteger型で返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-052	IT-32	レスポンス	P3	saleFlgがboolean型で返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	saleFlgに値を持つ個別入力商品の買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. saleFlgの型を確認する"	売却フラグsaleFlgが仕様どおりboolean型で返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-053	IT-32	レスポンス	P3	個数列が応答ではフィールド名countで返る	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	個数を持つ個別入力商品の買取受注ID	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. 個数のフィールド名を確認する"	個別入力商品の個数列が応答ではフィールド名countとして返ること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-054	IT-10	正常	P3	連続呼び出しで応答が同一（参照のみ・副作用なし）	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	同一idsを2回送信	"1. 同一リクエストを1回目送信する
2. 同一リクエストを2回目送信する
3. 両応答を比較する"	2回の応答内容が同一で、参照のみ（副作用なし）であること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-055	IT-09	リクエスト	P1	一部不存在で存在する個別入力商品のみ返り非対象IDは含まれない	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN／SEED-A07-07-ORDER-NOPRODUCT	個別入力商品ありの買取受注IDと、個別入力商品なし/存在しない買取受注IDを混在指定	"1. POST /api/v1/admin/buyOrderIndivisualInputProduct.json へ送信する
2. レスポンス配列のbuyOrderId集合を確認する"	個別入力商品が紐づく買取受注IDの商品のみが返り、紐づきの無い/存在しない買取受注IDは結果に含まれないこと。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-070	IT-19	同時実行数の制限	P3	同時実行数/レート制限の有無と超過時挙動を確認	SEED-A07-07-JWT-ADMIN	一定時間内に上限を超える連続リクエスト	"1. 上限を超える件数を短時間に連続送信する
2. 上限超過分の応答を確認する"	本APIにレート制限・同時実行数制限が設計されているか（有無）が正典未特定のため、期待結果を固定せず、制限の有無と超過時の挙動を要実機確認とすること。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-071	IT-10	エラー	P3	タイムアウト時に仕様で定めた挙動となる	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPOSTで送信する
2. 応答を確認する"	タイムアウト時に仕様で定めた挙動となること（タイムアウト実再現は外部依存のため要実機確認）。
a07-07_api_online_purchase_buy_order_indivisual_input_product（API_オンライン仕入_買取注文個別入力商品）	E2E-A07-07-072	IT-10	エラー	P2	取得処理中の例外時に処理失敗（HTTP500）として共通例外処理に委ねる	SEED-A07-07-JWT-ADMIN／SEED-A07-07-PRODUCTS-KNOWN	取得処理中の例外を誘発するシナリオ	"1. 取得処理中の例外を誘発してPOSTで送信する
2. 応答を確認する"	取得処理中の例外時に処理失敗を示すHTTPステータス500として共通例外処理に委ねられること（例外の実再現は要実機確認）。
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route(path: '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json', name: 'api_admin_buy_order_indivisual_input_product', methods: ['POST'])]`（`src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php:37`）。`eccube_api_v1_route` 既定値 `api/v1`（`app/config/eccube/packages/eccube.yaml:6,55`）。**実効パスは `POST /api/v1/admin/buyOrderIndivisualInputProduct.json`。正本mdのパス `POST /admin/buyOrderIndivisualInputProduct.json` は `/api/v1` プレフィクスを欠き実装と食い違う（付帯表4#1）。送信先は実効パスに統一し、合否は仕様の意味（200・配列構造・型契約・0件正常）で判定する**。認証は `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（`BuyOrderIndivisualInputProductController.php:26`）＋firewall `app`（`^/api/v1/`・access_token・`JwtTokenHandler`＋`JwtTokenHeaderExtractor`＝`app/config/eccube/packages/security.yaml:32-39`）。正本mdが `jwt-token`/HS256・失敗時401（ヘッダ欠落／署名不正／該当管理者会員なし）を特定しているためJWT負例は401で固定し、HS256署名検証の実方式・ヘッダ名一致のみ付帯表4#2の要実機確認とする。`ids` は `request->request->get('ids')`（`BuyOrderIndivisualInputProductController.php:40`）でカンマ分解（`explode(',', $ids)`:49）、空/未指定・有効ID無しはいずれも `new JsonResponse([])`＝空配列（`:43-44,55-57`）を返し、**0件応答形は正本md（空配列 `[]`）と一致（乖離なし）**。応答整形（`:61-71`）は `buyOrderIndivisualInputProductId`=`getId()`（int）／`buyOrderId`=`getBuyOrder()->getId()`（int）／`name`=`getName()`（string）／`price`=`getPrice()`（`?int`・`Entity/DtbBuyOrderIndivisualInputProduct.php:79`）／`count`=`getQuantity()`（`?int`・`:91`）／`saleFlg`=`isSaleFlg()`（`?bool`・`:103`）で、**型・フィールド名・null契約は正本mdと一致（乖離なし）**。非数値IDは `preg_match('/^\d+$/')` で除外・intval（`:48-52`）で正本md未記載＝付帯表4#3。本APIは画面を持たないため、判定はAPI/統合レイヤ（HTTPステータス・レスポンス本文）に閉じ、管理画面表示は合否条件にしない。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A07-07-001/002/003/004 | E2E自動化(API/統合) | `POST /api/v1/admin/buyOrderIndivisualInputProduct.json`（BuyOrderIndivisualInputProductController.php:37／eccube.yaml:6,55） | 利用者視点の入口・処理フロー#1-4・レスポンス(成功HTTP200・配列)／IT-09 | IT-...-002,003,004,024 |
| E2E-A07-07-005/006/007/008 | E2E自動化(API/統合) | 整形（BuyOrderIndivisualInputProductController.php:59-73）／0件分岐（:43-44,55-57） | レスポンス(成功)・データ整合性(参照時点・0件許容)／IT-10 | IT-...-026,027,025,037（008は補完） |
| E2E-A07-07-009/050/051/052/053 | E2E自動化(API/統合) | 応答フィールド整形（BuyOrderIndivisualInputProductController.php:61-71）／型`Entity/DtbBuyOrderIndivisualInputProduct.php:79,91,103` | レスポンス(成功)フィールド定義・型契約・serialize_null（正本md:108-116,154）／IT-32 | IT-...-032（009）／補完（050,051,052,053） |
| E2E-A07-07-010 | E2E自動化(API/統合) | `methods:['POST']`／ids `request->request->get('ids')`（BuyOrderIndivisualInputProductController.php:37,40） | 入出力・リクエスト（ids任意・受信検証）／IT-32 | IT-...-036 |
| E2E-A07-07-011 | E2E自動化(API/統合) | 空ids分岐（BuyOrderIndivisualInputProductController.php:43-44） | 入出力「未指定・空文字のときは0件」・レスポンス0件→空配列（正本md:99,125）／IT-32 | IT-...-031 |
| E2E-A07-07-012 | E2E自動化(API/統合) | 該当0件（findBy結果空→array_map空＝[]）（BuyOrderIndivisualInputProductController.php:59-73） | エラー処理「0件はエラーとせず空配列」・データ整合性0件許容（正本md:125,173,201）／IT-32 | IT-...-033 |
| E2E-A07-07-020/021/023 | E2E自動化(API/統合) | `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderIndivisualInputProductController.php:26）＋access_token JwtTokenHandler/JwtTokenHeaderExtractor（security.yaml:32-39）／要実機確認: HS256署名検証の実方式・ヘッダ名 | 認証・認可（jwt-token/HS256・ヘッダ欠落/署名不正＝401・正本md:62-68,192）・処理フロー#1／IT-32 | IT-...-001 |
| E2E-A07-07-022 | E2E自動化(API/統合) | access_token（該当管理者会員特定不可→401・security.yaml:32-39）／要実機確認: 署名検証の実方式 | 認証・認可（該当する管理者会員なし＝401・正本md:65,192）・権限・認可／IT-10 | IT-...-037 |
| E2E-A07-07-030/031/032 | E2E自動化(API/統合)（要実機確認） | 非数値ID除外（BuyOrderIndivisualInputProductController.php:48-52）／想定外項目・異常系の具体応答は正典未定義 | バリデーション「形式・件数の検証は行わない」・入力に対する明示的検証エラー(400)は返さない（正本md:160-164）／異常系は正典未定義（要実機）／IT-32・IT-10 | IT-...-005,006,030 |
| E2E-A07-07-054 | E2E自動化(API/統合) | 参照のみ（副作用 無し・正本md:150-152） | 副作用「無し（参照のみ）」・データ整合性「本APIはデータを更新しない」（正本md:152,172）／IT-10 | 補完（副作用なし） |
| E2E-A07-07-055 | E2E自動化(API/統合) | `findBy(['BuyOrder' => $buyOrderIds])`（BuyOrderIndivisualInputProductController.php:59） | 処理フロー#3（紐づく一覧を取得）・データ整合性0件許容（正本md:78,173）／IT-09 | 補完（一部不存在） |
| E2E-A07-07-070 | 手動（要実機確認・レート制限実再現） | レート制限・同時実行数制限は実装・正典とも未確認 | 排他制御「参照のみ・ロック対象なし」（正本md:216-218）にレート制限記載なし／IT-19 | IT-...-007 |
| E2E-A07-07-071 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | タイムアウト挙動は正典未定義／IT-10 | IT-...-015 |
| E2E-A07-07-072 | 手動（要実機確認・例外実再現） | 共通例外処理（正本md エラー処理・レスポンス(失敗)500）／例外の実再現は実機依存 | エラー処理「取得処理中の例外→HTTP500・共通例外処理」（正本md:123,202）／IT-10 | （エラー処理節・補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）で機能固有シナリオを持たず、外部キャッシュ・決済代行・転送再連携・売上返品等の本機能に非該当な観点を多く含む。本E2Eは正本md本文（処理フロー#1-4・入出力・レスポンス・認証認可・エラー処理）を一次オラクルに、参照系APIのAPI/統合レイヤ単独（HTTPステータス・レスポンス本文。本APIは画面を持たずUIレイヤ0）で網羅し、正常×異常の対（複数ID取得001/003 ↔ 一部不存在055・空011・データなし012・非数値ID030・想定外項目031／認証成功020 ↔ 欠落021・該当会員なし022・署名不正023）を揃えた。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a07_07_api_online_purchase_buy_order_indivisual_input_product_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。本機能は参照系APIで結果が管理画面に現れる範囲を持たないため `自動化(UI)` は0。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報・リクエスト(非数値/想定外)・必須条件・レスポンス・データなし・受信検証はHTTPステータス/本文で観測可（資格情報はjwt-token/HS256・401を正典が特定）。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常取得のHTTPステータス・実行結果・リクエスト・外部取得 |
| IT-19 | 1 | 0 | 0 | 1 | 0 | レート制限・同時実行数制限の有無が正典未特定＝手動/要実機 |
| IT-10 | 18 | 0 | 5 | 1 | 12 | 通信/正常/HTTPステータス(0件200)/重複・順序(認証401)/異常系はAPI/統合。タイムアウト(1)は手動。複数バリ一括返却・ソート順(6)・外部キャッシュ(2)・決済代行(2)・下流転送(1)・専用失敗応答(1)は本参照系APIに非該当＝対象外 |
| IT-33 | 7 | 0 | 0 | 0 | 7 | 数量・金額更新・外部連携は本APIが参照のみで非該当＝対象外 |
| 合計 | 38 | 0 | 16 | 2 | 20 | **未分類 0** |

注1（対象外20件の内訳）: IT-32 1件＝バージョニング(016＝正典にAPIバージョン指定なし)。IT-10 12件＝複数バリデーション一括返却・ソート順(009/010/011/012/013/014＝本APIは入力検証で複数エラー本文を一括返却・ソートしない。明示的検証エラー400を返さない＝正本md:164)＋外部キャッシュ(028/029＝本APIは外部キャッシュを利用しない)＋決済代行(034/035＝本APIは外部決済連携を行わない)＋下流転送部分失敗(038＝本APIは外部転送/再連携を行わない)＋専用失敗応答エラー(008＝本APIは0件をエラーとせず専用失敗ステータスを持たない)。IT-33 7件＝区分整合/エラー/外部取引/自動加算/実数更新/売上・返品/連携エラー(017-023＝参照系で数量・金額更新・外部連携なし)。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 正本md本文（型契約・null契約・フィールド名契約・副作用なし・一部不存在・取得処理中の例外500）から、母集合38行に対応行を持たない補完ケースを追加した。母集合集計には算入せず別管理する。内訳＝自動化(API/統合) 6（008 重複・順序取得／050 null契約／051 price/count型／052 saleFlg型／053 countフィールド名／054 副作用なし／055 一部不存在＝計7のうち母集合037が022へ対応するため008・050-055の7件を補完計上）。正確には補完＝008,050,051,052,053,054,055 の7件が自動化(API/統合)、072（例外500）の1件が手動。補完ケースの観点名（重複・順序／レスポンス／正常／リクエスト）はいずれも本機能で活性の観点であり、対象外観点名の再利用ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 020（有効JWTで200）/021（ヘッダ欠落401）/023（署名不正401） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 001 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 002 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 003（SEED既知値照合） |
| 005 | IT-32 | リクエスト | 自動化(API/統合)（要実機確認） | 030（非数値/型不正ID＝受理・除外正典未定義） |
| 006 | IT-32 | リクエスト | 自動化(API/統合)（要実機確認） | 031（想定外項目＝無視可否正典未定義） |
| 007 | IT-19 | 同時実行数の制限 | 手動（要実機確認） | 070（レート制限の有無が正典未特定） |
| 008 | IT-10 | エラー | 対象外 | 本APIは0件をエラーとせず専用の失敗応答を持たないため |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本APIは明示的検証エラー(400)を返さず複数エラー本文を一括返却しないため（正本md:164） |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 同上（相関バリデーション該当処理なし） |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 同上（DB相関バリデーション該当処理なし） |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 071（タイムアウト実再現は外部依存） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン指定が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 対象外 | 本APIは参照系で数量・金額を別管理・更新しないため |
| 018 | IT-33 | エラー | 対象外 | 本APIは数量・金額・履歴を更新しないため |
| 019 | IT-33 | 外部取引 | 対象外 | 本APIは外部取引による加減算を行わないため |
| 020 | IT-33 | 自動加算 | 対象外 | 本APIは外部連携由来の自動加算を行わないため |
| 021 | IT-33 | 実数更新 | 対象外 | 本APIは実数更新を行わないため |
| 022 | IT-33 | 売上・返品 | 対象外 | 本APIは売上・返品の数量・金額更新を行わないため |
| 023 | IT-33 | 連携エラー | 対象外 | 本APIは連携元・連携先の更新を行わないため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004（複数買取ID一括取得） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 007（0件でも200・失敗ステータスなし） |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 005 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 006 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本APIは外部キャッシュを利用しないため |
| 029 | IT-10 | 障害(外部キャッシュ) | 対象外 | 本APIは外部キャッシュを利用しないため |
| 030 | IT-10 | 異常系 | 自動化(API/統合)（要実機確認） | 032（異常入力で停止しない／具体応答は正典未定義） |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 011（空ids→空配列） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 009 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 012（該当0件→空配列） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本APIは決済代行・外部決済連携を行わないため |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 本APIは決済代行・外部決済連携を行わないため |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 010（正しい形式POST受理） |
| 037 | IT-10 | 重複・順序(認証拒否401) | 自動化(API/統合) | 022（該当管理者会員なし→401。期待結果が「認証拒否（HTTP 401）」のため認証負例に対応） |
| 038 | IT-10 | 部分失敗(下流転送) | 対象外 | 本APIは外部転送・再連携を行わないため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 16（001,002,003,004,005,006,024,025,026,027,030,031,032,033,036,037）／手動・要実機 2（007,015）／対象外 20（008,009,010,011,012,013,014,016,017,018,019,020,021,022,023,028,029,034,035,038）。**未分類 0**（母集合38行）。母集合外の設計書補完ケースは別管理（008,050,051,052,053,054,055＝自動化(API/統合)／072＝手動）。

注: 005/006/030 は区分=自動化(API/統合)だが、非数値ID・想定外項目・異常系の具体応答が正典未定義のため `要実機確認` 修飾子を付し、期待値を固定しない（付帯表4#3）。修飾子は集計上あくまで自動化(API/統合)に算入する。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A07-07-JWT-ADMIN | dtb_member（管理者会員）／jwt-token | 有効な管理者会員1。利用者IDが当該会員に紐づくHS256署名のjwt-tokenを供給（トークン原値・署名シークレットは環境変数で供給しログ/設計に書かない）。021/022/023用に「ヘッダ欠落」「該当会員なし」「署名不正」のトークン状態を別途用意 | fixture／env（JWT発行は買取アプリ用ログインAPI またはenv供給。HS256署名検証の実方式は付帯表4#2の要実機確認） | 専用会員・撤去可。トークンは使い捨て | 全API/統合ケース（021/022/023はトークン状態を変えて適用） |
| SEED-A07-07-PRODUCTS-KNOWN | dtb_buy_order_indivisual_input_product（＋親 dtb_buy_order） | 複数のネット買取受注に紐づく個別入力商品を複数件。buyOrderIndivisualInputProductId・buyOrderId・name・price・count（個数列）・saleFlg の既知値。複数の買取受注IDに跨る（004/055用） | fixture／migration | 専用受注・既知値へ復元してべき等化。参照のみで後始末不要 | 001-006,008-010,020,023,030-032,050-055,070-072 |
| SEED-A07-07-ORDER-NOPRODUCT | dtb_buy_order（個別入力商品の紐づきなし） | 個別入力商品が1件も紐づかないネット買取受注ID1件以上 | fixture | 専用受注・撤去可 | 007,012,055 |
| SEED-A07-07-NULLFIELDS | dtb_buy_order_indivisual_input_product（未設定項目あり） | price・count・saleFlg のいずれも未設定（NULL）の個別入力商品1件を持つ買取受注ID | fixture | 専用商品・撤去可 | 050 |

注: 本APIは参照のみ（副作用 無し・正本md:150-152）のため更新系シードのリセットは不要。リクエストボディ（ids）は正本md記載フィールドのみで最小構成し、値はテスト内生成（synthetic）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_buy_order_indivisual_input_product`／親 `dtb_buy_order`＝現行・移行先で同一スキーマ・正本md リニューアル移行表）に従う。共通ログイン/資格情報は `config/default_login_information.json`／`config/default.config.ts` を流用し、JWTトークン・署名シークレットの原値は設計書・ログに書かない（正本md ログ・監査節）。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md・観点表）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。0件応答形（空配列 `[]`）・応答フィールドの型（price/count=integer・saleFlg=boolean・未設定null）・フィールド名（count）・serialize_nullは実装（BuyOrderIndivisualInputProductController.php:43-44,55-73／Entity:79,91,103）と正本md（:99,108-116,125,154,183）が一致しており乖離なし（静的確認済）。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `POST /admin/buyOrderIndivisualInputProduct.json`（正本md 利用者視点の入口:54） | `#[Route(path: '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json' …methods:['POST'])]`（BuyOrderIndivisualInputProductController.php:37）＋既定 `api/v1`（eccube.yaml:6,55）＝実効 `POST /api/v1/admin/buyOrderIndivisualInputProduct.json` | **正本mdパスは `/api/v1` プレフィクスを欠き実装と不一致**。テストは実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 認証は `jwt-token` ヘッダのJWT・HS256署名検証、失敗時HTTP401（正本md 認証・認可:62-68） | `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderIndivisualInputProductController.php:26）＋access_token firewall `app`＋`JwtTokenHandler`/`JwtTokenHeaderExtractor`（security.yaml:32-39） | **401応答は仕様と整合するが、HS256署名検証の実方式・`jwt-token` ヘッダ名の一致は要実機確認**。テストは「認証を満たさないとHTTP401で取得できない」を仕様で判定 | 020,021,022,023 | 要確認(署名検証実方式) |
| 3 | `ids` はカンマ区切りstring、形式・件数の検証は行わない、明示的検証エラー(400)は返さない、未指定・空文字は0件（正本md バリデーション:160-164・入出力:99） | 非数値は `preg_match('/^\d+$/', trim($id))` で除外し intval（BuyOrderIndivisualInputProductController.php:48-52） | **非数値ID・想定外項目・異常系の応答は正典未定義**。期待値を固定せず要実機確認とする（030/031/032）。空ids→空配列のみ別途仕様判定（011/012） | 030,031,032 | 要確認(未定義挙動) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要（複数買取ID→個別入力商品の一括取得・0件は空配列） | 正常取得・0件正常応答 | 001,012 | カバー |
| 利用者視点の入口（POST /admin/buyOrderIndivisualInputProduct.json） | 実効パスへの正常POST | 001,010 | カバー（付帯表4#1で乖離記録） |
| 認証・認可（jwt-token/HS256・401＝欠落/署名不正/該当会員なし） | 有効JWTで200・欠落/署名不正/該当なしで401 | 020,021,022,023 | カバー（HS256実方式は要実機・付帯表4#2） |
| 処理フロー#1（トークン検証→管理者特定・401） | 認証拒否（欠落/署名不正/該当なし） | 021,022,023 | カバー |
| 処理フロー#2（idsをカンマ分解しID配列化） | 複数ID・重複/順不同の取得 | 001,008 | カバー |
| 処理フロー#3（買取受注IDリストに紐づく一覧取得） | 一部不存在で存在分のみ取得 | 055,004 | カバー |
| 処理フロー#4（配列をJSON返却・0件は空配列） | 非対象IDのみ/紐づきなしで0件正常応答 | 012,007 | カバー |
| 入出力・リクエスト（ids任意・空/未指定は0件・形式検証なし） | 空/未指定idsで空配列・必須エラーなし・受信検証通過 | 011,010 | カバー |
| レスポンス(成功・HTTP200・配列) | 200・配列構造・複数買取ID一括 | 002,009,004 | カバー |
| レスポンス フィールド定義・型（price/count=integer・saleFlg=boolean・null・count名・serialize_null） | 型契約・null契約・フィールド名契約・値照合 | 050,051,052,053,003,006 | カバー（実装と一致・付帯表4で乖離なし確認済） |
| レスポンス(失敗・401/500) | 認証拒否401・取得処理中の例外500 | 021,022,023,072 | カバー（072は手動/要実機） |
| データ整合性（参照時点・本APIは更新しない・0件許容） | 連続呼び出しで応答同一・副作用なし・0件許容 | 054,012 | カバー |
| 副作用（無し・参照のみ） | 参照のみ・DB不変 | 054 | カバー |
| バリデーション（形式・件数の検証なし・明示的検証エラー400を返さない） | 非数値ID・想定外項目・異常系（正典未定義） | 030,031,032 | カバー（要実機確認・付帯表4#3） |
| 権限・認可（認証済み管理者会員のみ取得可・未認証/不正は401） | 認証成功で取得・未認証/不正で401 | 020,021,022,023 | カバー |
| エラー処理（認証不可401・0件は空配列・取得処理中の例外500） | 各エラー応答・0件正常 | 021,012,072 | カバー（072は手動/要実機） |
| 排他制御・トランザクション（参照のみ・ロック対象なし） | （更新・ロックなし） | （対象外＝該当処理なし） | 対象外（参照系で更新・ロックを持たないため） |
| ログ・監査（JWT原値・署名シークレット・Cookie値の非出力） | 機密値のログ非出力 | （対象外＝サーバログ実機観測） | 対象外（API応答に現れず・サーバログ実機観測は本E2E範囲外） |
| 同時実行数の制限（観点表IT-19・正典にレート制限記載なし） | レート制限の有無・超過時挙動の確認 | 070 | カバー（手動/要実機） |
| タイムアウト（IT-10・正典未定義） | タイムアウト時の挙動 | 071 | カバー（手動/要実機） |
| 複数バリデーション一括返却・ソート順／外部キャッシュ／決済代行／下流転送（IT-10細目） | （該当処理なし） | （対象外） | 対象外（本参照系APIに非該当・理由付き） |
| 数量・金額更新・外部連携（IT-33） | （該当処理なし） | （対象外） | 対象外（参照系で数量・金額・履歴を更新しないため） |
| バージョニング（IT-32） | （該当処理なし） | （対象外） | 対象外（正典にAPIバージョン指定なし） |

未カバーはいずれも理由（参照系で更新・ロック・数量金額更新・外部連携・外部キャッシュ・決済代行・下流転送を持たない／バージョニングは正典にAPIバージョン指定なし／署名検証実方式・未定義挙動・レート制限・タイムアウト・取得処理中の例外500の実再現は要実機確認／機密値のログ非出力はサーバログ実機観測で本E2E範囲外）を明記済み。参照系POST想定でUIレイヤは0とし、正常×異常の対（複数ID取得001/003 ↔ 一部不存在055・空011・データなし012・非数値ID030・想定外項目031・認証成功020↔欠落021/該当会員なし022/署名不正023）を揃えた。型契約・0件応答形・フィールド名は設計⇔実装が一致しており（付帯表4で乖離なしを確認）、期待値は仕様型・仕様キー名・仕様の空配列に固定した（オラクル独立性）。
