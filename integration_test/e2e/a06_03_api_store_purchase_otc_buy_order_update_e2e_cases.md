# A06-03（店頭仕入_店頭買取注文更新） E2Eテストケース

元設計md（正本一次／pf-apiリバース）: `functions/pf-api/a06-03_api_store_purchase_otc_buy_order_update.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a06-03_api_store_purchase_otc_buy_order_update.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a06_03_api_store_purchase_otc_buy_order_update_it_cases.md`（母集合 計38観点行）

本機能は**ブラウザ向けの画面を持たない**機能仕様（JWT認証つきPUT API＝店頭買取受注の詳細更新。正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）であり、**API/統合レイヤ単独で網羅**する。Playwright `request` で `PUT /api/v1/admin/otcBuyOrder/{id}.json` へ送信し、HTTPステータス・レスポンス本文（`{code}`／`{code, errors}`）で判定する。更新副作用（ステータス・買取合計金額・明細全置換・個別入力商品・在庫・在庫履歴・ステータス変更履歴・査定担当者）は永続化先テーブルを直接DB照合（DB副作用観測）して判定する。本機能は画面を持たないため、別機能（管理画面 店頭買取受注詳細）の表示は合否条件にしない。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装のレスポンス形・バリデーション機構・HTTPライブラリ既定値・Form/DTO制約を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdを上位オラクル、観点表（基本設計）と食い違う箇所も上位オラクルとして扱い、乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・認証方式・セレクタ）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

更新系のため、DB更新観点（IT-23/IT-26）を網羅に含める。正本md・実装には入力検証とDB更新が存在するが、既存IT casesの対象外観点表は「本機能に入力検証対象がないため」「該当する処理・I/Fがないため」と誤って除外している。これを上位オラクル（正本md・基本設計）に照らして補正し、入力検証（IT-22）・DB更新（IT-26/IT-05）を設計書補完ケースとして追加した（母集合外・別管理）。当該誤分類は付帯表4#9に記録する。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（JWT認証）・受信検証・必須条件・想定外項目・レスポンス書式（`{code}`）・データなし（対象受注なし→404）。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-09 | 正常更新のHTTPステータス・実行結果・リクエスト正常・成功レスポンス本文 |
| IT-19 | 同時実行数の制限（本APIは排他制御を持たず同時更新は後勝ち。実再現は手動） |
| IT-10 | HTTPステータス・通信・正常／異常系・複数エラーのerrors配列一括返却・DB照合（ステータスマスタ存在）・JWT認証検証。外部キャッシュ／決済代行／転送再連携／ソート順／相関バリは本機能に非該当で対象外 |
| IT-33 | 区分整合（更新対象外の他受注・区分の在庫数量・金額が不変）・検証エラー時の部分更新なし。外部取引／売上返品／自動加算／連携エラー（外部決済・外部連携由来）は本APIに非該当で対象外 |
| IT-22 | （設計書補完）ステータス必須・マスタ存在・明細必須・商品名必須／最大長・各項目の整数形式バリデーション |
| IT-26/IT-05 | （設計書補完）ステータス・買取合計金額・明細全置換・在庫集計・在庫履歴・個別入力商品・ステータス変更履歴・査定担当者のDB更新をDB副作用照合／間接で観測 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-001	IT-09	リクエスト	P1	正常パラメータでPUTし200が返る	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION	"有効なjwt-tokenヘッダ
order_status=成立(1)・order_details=1件以上の正常明細・qualified_invoice_issuer_confirmation_flg"	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	正常更新としてHTTPステータス200が返ること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-002	IT-09	実行結果	P3	更新実行後の処理結果が一致する	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンスと後続状態を確認する"	更新処理が実行され、処理結果（成功）がレスポンスと一致すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-003	IT-09	HTTPステータス	P3	成功時のHTTPステータスが200である	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	HTTPステータスが成功（200）であること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-004	IT-09	外部取得	P1	成功レスポンス本文がcode=200を含む	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンス本文を確認する"	成功時のレスポンス本文が `{code:200}` であること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-005	IT-10	通信	P1	正常通信で200が返る	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200（成功）であること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-006	IT-10	正常	P2	対象条件に該当する正常値で200が返る	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	対象条件に該当する正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスと後続状態を確認する"	正常更新としてHTTPステータスが200（成功）であること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-007	IT-32	レスポンス	P3	成功レスポンス書式がcode:200と一致する	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・正常な更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンス本文の書式を確認する"	成功時のレスポンス書式が仕様の `{code:200}`（codeフィールドのみ・camelCase）と一致すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-008	IT-32	受信検証	P1	入力検証を満たすリクエストで更新成功200となる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION	ステータス・明細・明細各項目すべて検証を満たすリクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	受注全体・明細各件の入力検証を満たし、HTTPステータス200で更新が成功すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-009	IT-32	リクエスト	P3	想定外項目追加時の挙動が要実機確認・仕様化待ちである	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	正常リクエストに仕様未定義の想定外項目（項目名と値のセット）を追加	"1. 想定外項目を含むリクエストをPUTで送信する
2. HTTPステータスを確認する"	正本mdに未定義項目の許容/無視/エラーの仕様が無いため、想定外項目追加時の更新成否を固定期待にできず、許容・無視・エラーいずれの挙動とするかは要実機確認・仕様化待ちであること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-020	IT-32	資格情報	P1	有効なJWTで更新が成功する	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token（該当する管理者会員あり）・正常リクエスト	"1. 有効なjwt-tokenを付与してPUTで送信する
2. HTTPステータスを確認する"	資格情報が有効な場合、HTTPステータス200で更新が成功すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-021	IT-32	資格情報	P1	jwt-tokenヘッダ欠落で401となり更新されない	SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	jwt-tokenヘッダを付与しないリクエスト	"1. jwt-tokenヘッダ無しでPUTで送信する
2. HTTPステータスと受注状態を確認する"	認証拒否を示すHTTPステータス401が返り、対象受注が更新されないこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-022	IT-10	重複・順序	P1	該当する管理者会員が無いJWTで401となる	SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	利用者IDに該当する管理者会員が存在しないjwt-token	"1. 該当会員なしのjwt-tokenでPUTで送信する
2. HTTPステータスと受注状態を確認する"	JWTの利用者IDから管理者会員を特定できず、HTTPステータス401が返り更新されないこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-023	IT-32	資格情報	P1	署名不正のJWTで401となり更新されない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	署名検証に失敗するjwt-token（署名シークレット不正）	"1. 署名不正のjwt-tokenでPUTで送信する
2. HTTPステータスと受注状態を確認する"	署名検証に失敗し、認証拒否を示すHTTPステータス401が返り、対象受注が更新されないこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-030	IT-32	データなし	P1	存在しない受注IDで404となり更新されない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-STATUS-MTB	有効なjwt-token・該当しない受注ID	"1. 存在しない受注IDへPUTで送信する
2. HTTPステータスと後続状態を確認する"	該当なしを示すHTTPステータス404が返り、明細・在庫・受注の更新が行われないこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-040	IT-10	エラー	P2	order_status未指定で400となりerrorsを含む	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER	有効なjwt-token・order_status未指定・order_detailsは正常	"1. order_statusを未指定にしてPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	入力不正を示すHTTPステータス400が返り、レスポンス本文 `errors` 配列にステータス必須の検証メッセージを含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-041	IT-10	エラー	P2	複数の検証エラーをerrors配列に全件まとめて返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER	有効なjwt-token・ステータス未指定かつ明細の複数項目が不正なリクエスト	"1. 複数項目が不正なリクエストをPUTで送信する
2. レスポンス本文のerrorsを確認する"	受注全体と明細各件で検出した全検証メッセージが `errors` 配列にまとめて返ること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-042	IT-10	エラー	P2	ステータスマスタ照合エラーを含む検証結果をerrorsで返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・ステータスマスタに存在しないorder_statusと他の不正項目	"1. マスタ非存在ステータスを含むリクエストをPUTで送信する
2. レスポンス本文のerrorsを確認する"	ステータスマスタとのDB照合エラーを含む全検証メッセージが `errors` 配列に返ること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-043	IT-10	異常系	P2	異常リクエストで4xxとなり更新されない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER	有効なjwt-token・検証に失敗する異常リクエスト	"1. 異常リクエストをPUTで送信する
2. HTTPステータスと受注状態を確認する"	異常を示すHTTPステータス4xxが返り、削除・登録・保存が行われず受注が更新されないこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-044	IT-10	HTTPステータス	P1	入力不正時のHTTPステータスが400である	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER	有効なjwt-token・入力検証に失敗するリクエスト	"1. 入力不正リクエストをPUTで送信する
2. HTTPステータスを確認する"	入力不正を示すHTTPステータスが400であること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-045	IT-32	必須条件	P3	order_details未指定で400となり必須メッセージを返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details未指定または空・order_statusは正常	"1. order_detailsを空にしてPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス400が返り、`errors` 配列に「1つ以上の商品を選んでください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-046	IT-32	リクエスト	P3	整数でない明細項目を含むと400となる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・明細のquantity等に整数でない値を指定	"1. 整数でない明細項目を含むリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス400が返り、`errors` 配列に該当項目の整数形式メッセージを含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-050	IT-33	区分整合	P1	更新後に更新対象外の他受注・区分の在庫数量と金額が不変	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER（対象受注＋別受注）／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION／SEED-M01-ADMIN	有効なjwt-token・対象受注のみを更新する正常リクエスト	"1. 対象受注IDへPUTで送信し200と成功応答を確認する
2. 一次オラクルとしてDB副作用（別受注・対象外区分の在庫数量・買取合計金額）を照合する"	別受注・対象外区分の在庫数量と買取合計金額が更新前と一致し、変動しないこと（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-051	IT-33	エラー	P1	検証エラー時に明細・在庫・金額・履歴が部分更新されない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・入力検証に失敗するリクエスト	"1. 検証エラーとなるリクエストをPUTで送信し4xxを確認する
2. 一次オラクルとしてDB副作用（対象受注の明細・在庫・買取合計金額・ステータス変更履歴）を受信前と照合する"	検証エラー時は削除・登録・保存が行われず、明細・在庫・買取合計金額・ステータス変更履歴がDB副作用上で受信前と一致（部分更新されない）こと（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-060	IT-19	同時実行数の制限	P3	同一受注の同時更新で片側更新の不整合が残らない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・同一受注への並行する2リクエスト	"1. 同一受注へ2リクエストを並行してPUTで送信する
2. 最終状態を確認する"	本APIは排他制御を持たず同時更新は後勝ちとなり、いずれか一方の更新が一貫して反映され、明細・在庫・金額・履歴が片側だけ更新された不整合が残らないこと（並行送信の実再現は要実機確認）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-061	IT-10	エラー	P3	処理タイムアウト時に仕様どおりの応答となる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPUTで送信する
2. 応答と受注状態を確認する"	サーバ無応答・未定義例外で停止せず、エラー応答が返り、対象受注が部分更新されず一致すること（タイムアウト実再現は要実機確認）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-100	IT-22	必須バリデーション	P2	order_status未指定でステータス必須メッセージを返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER	有効なjwt-token・order_status未指定	"1. order_statusを未指定にしてPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「ステータスを選択してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-101	IT-22	その他のバリデーション	P2	マスタに無いステータスIDでマスタ非存在メッセージを返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・店頭買取ステータスマスタに存在しないorder_status	"1. マスタ非存在のorder_statusでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-102	IT-22	必須バリデーション	P2	order_details空で明細必須メッセージを返す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_detailsが空配列	"1. order_detailsを空にしてPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「1つ以上の商品を選んでください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-103	IT-22	必須バリデーション	P2	明細の商品名未入力で商品名必須エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].nameが未入力	"1. 商品名未入力の明細でPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に商品名必須の検証メッセージを含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-104	IT-22	文字列長バリデーション	P3	商品名が最大長(65535文字)では更新が成功する	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].nameが65535文字（境界内）	"1. 商品名65535文字の明細でPUTで送信する
2. HTTPステータスを確認する"	境界内のためエラーとならず、HTTPステータス200で更新が成功すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-105	IT-22	文字列長バリデーション	P2	商品名が最大長+1(65536文字)で最大長超過エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].nameが65536文字（境界外）	"1. 商品名65536文字の明細でPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「商品名は、 65535 以下で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-106	IT-22	数値バリデーション	P3	product_class_idが整数でない場合に整数形式エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].product_class_idが非整数	"1. 非整数のproduct_class_idでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「商品規格IDは、整数で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-107	IT-22	数値バリデーション	P3	quantityが整数でない場合に整数形式エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].quantityが非整数	"1. 非整数のquantityでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「数量は、整数で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-108	IT-22	数値バリデーション	P3	priceが整数でない場合に整数形式エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].priceが非整数	"1. 非整数のpriceでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「単価は、整数で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-109	IT-22	数値バリデーション	P3	sell_priceが整数でない場合に整数形式エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].sell_priceが非整数	"1. 非整数のsell_priceでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「販売価格は、整数で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-110	IT-22	数値バリデーション	P3	section_idが整数でない場合に整数形式エラーとなる	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_details[].section_idが非整数	"1. 非整数のsection_idでPUTで送信する
2. レスポンス本文のerrorsを確認する"	HTTPステータス400が返り、`errors` 配列に「部門IDは、整数で入力してください。」を含むこと。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-111	IT-22	任意未入力	P2	任意項目を未指定にしても更新が成功する	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_status正常・order_details[].nameあり・quantity/price/sell_price/section_id/qualified_invoice_issuer_confirmation_flgを未指定	"1. 任意項目を未指定にしてPUTで送信する
2. HTTPステータスを確認する"	任意項目（数量・単価・販売価格・部門ID・確認済みフラグ）を未指定にしても検証エラーとならず、HTTPステータス200で更新が成功すること。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-120	IT-26	更新内容	P1	更新後に店頭買取受注のステータスが指定値へ更新される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・更新後ステータスを指定する正常リクエスト	"1. 対象受注IDへPUTで送信する
2. DB副作用（店頭買取受注のステータス）を照合する"	店頭買取受注のステータスが指定したステータスに更新されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-121	IT-26	更新内容	P1	買取合計金額が明細から10円単位切り上げした額で更新される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・単価×数量の合計が10円単位でない明細	"1. 対象受注IDへPUTで送信する
2. DB副作用（店頭買取受注の買取合計金額）を照合する"	買取合計金額が明細の単価×数量の総和を10円単位へ切り上げた額で更新されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-122	IT-26	更新内容	P1	明細が送信内容で全置換され送信外の旧明細が残らない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER（既存明細あり）／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・既存明細と異なる明細を送信	"1. 対象受注IDへPUTで送信する
2. DB副作用（店頭買取受注明細）を照合する"	既存明細が削除され送信した明細で全置換され、送信しなかった旧明細が残らないこと（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-123	IT-26	登録内容	P1	商品規格ごとに集計した数量で在庫が作り直される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION／SEED-M01-ADMIN	有効なjwt-token・同一商品規格を複数含む明細	"1. 対象受注IDへPUTで送信する
2. DB副作用（在庫の商品規格別集計数量）を照合する"	商品規格に紐づく明細が商品規格ごとに数量集計され、その集計数量で在庫が作り直されること（個別入力商品は集計に含まれない・DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-124	IT-26	登録内容	P2	在庫登録時に在庫履歴が1件追加される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION／SEED-M01-ADMIN	有効なjwt-token・商品規格に紐づく明細を含むリクエスト	"1. 対象受注IDへPUTで送信する
2. DB副作用（在庫履歴）を照合する"	在庫登録に伴い、更新後数量・登録者・登録日時を記録した在庫履歴が1件追加されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-125	IT-26	登録内容	P2	商品規格IDなしの明細が個別入力商品として登録される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・product_class_idが空の明細を含むリクエスト	"1. 対象受注IDへPUTで送信する
2. DB副作用（個別入力商品）を照合する"	商品規格IDが空の明細が個別入力商品として登録されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-126	IT-26	更新内容	P2	成立(1)で成立日時、それ以外でキャンセル日時が更新される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・order_status=成立(1)／成立以外それぞれのリクエスト	"1. 成立(1)とそれ以外でそれぞれPUTで送信する
2. 受注の成立日時・キャンセル日時を確認する"	成立(1)指定時は成立日時、それ以外の指定時はキャンセル日時が現在日時で更新されること（日時カラムの観測は要実機確認）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-127	IT-26	登録内容	P1	更新前後でステータスが異なる場合に変更履歴が1件登録される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER（更新前ステータス既知）／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・更新前と異なるステータスを指定	"1. 更新前と異なるステータスでPUTで送信する
2. DB副作用（ステータス変更履歴）を照合する"	受注ID・更新後ステータスID・更新担当者ID・登録日時を記録したステータス変更履歴が1件登録されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-128	IT-26	更新内容	P2	更新前後で同一ステータスでは変更履歴を登録せず明細は作り直す	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER（更新前ステータス既知）／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	有効なjwt-token・更新前と同一のステータスを指定	"1. 更新前と同一ステータスでPUTで送信する
2. DB副作用（明細・在庫・ステータス変更履歴）を照合する"	ステータス変更履歴は登録されず、明細・在庫の作り直しと受注更新は実施されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-129	IT-26	更新内容	P2	査定担当者に認証した管理者会員が記録される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-M01-ADMIN	認証した管理者会員のjwt-token・正常リクエスト	"1. 認証管理者会員のjwt-tokenでPUTで送信する
2. DB副作用（査定担当者）を照合する"	査定担当者にjwt-tokenから特定した認証管理者会員が記録されること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-130	IT-26	更新内容	P3	適格請求書発行事業者該当時のみ確認済みフラグが更新される	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER（適格該当／非該当の2種）／SEED-A06-03-STATUS-MTB	有効なjwt-token・qualified_invoice_issuer_confirmation_flgを指定	"1. 適格該当・非該当それぞれの受注へPUTで送信する
2. 確認済みフラグを確認する"	受注が適格請求書発行事業者に該当する場合のみ確認済みフラグが指定値で更新され、非該当の場合は更新されないこと（フラグの観測は要実機確認）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-131	IT-26	登録内容	P2	該当部門が存在しないsection_idでは明細に部門が設定されない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB／SEED-A06-03-SECTION／SEED-M01-ADMIN	有効なjwt-token・order_details[].section_idに該当部門が存在しない整数を指定	"1. 該当部門なしのsection_idでPUTで送信する
2. DB副作用（明細・個別入力商品の部門）を照合する"	該当部門が存在しないsection_idを指定した明細・個別入力商品では部門が設定されず、更新自体は成功すること（DB副作用で判定）。				
a06-03_api_store_purchase_otc_buy_order_update（API_店頭仕入_店頭買取注文更新）	E2E-A06-03-150	IT-05	実行結果	P3	保存処理中の例外時に部分更新が残らない	SEED-A06-03-JWT-ADMIN／SEED-A06-03-ORDER／SEED-A06-03-STATUS-MTB	有効なjwt-token・削除登録保存中の例外を誘発するシナリオ	"1. 保存例外を誘発してPUTで送信する
2. 応答と受注状態を確認する"	共通例外処理に委ね（HTTP 500相当）、対象受注の明細・在庫・金額・履歴が受信前と一致し部分更新が残らないこと（例外の実再現は要実機確認）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}.json', name: 'api_admin_otc_buy_order_update', methods: ['PUT'])]`（`src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:129`）。`eccube_api_v1_route` 既定値 `api/v1`（`app/config/eccube/packages/eccube.yaml:6,55`）。実効パスは `PUT /api/v1/admin/otcBuyOrder/{id}.json`。**正本mdのパス `PUT /admin/otcBuyOrder/{id}.json` は `/api/v1` プレフィクスを欠き実装と食い違う。送信先パスは実装の実効パス `/api/v1/admin/otcBuyOrder/{id}.json` に統一し、合否は正本mdの意味（成功＝code:200、認証＝資格情報照合の通過/拒否、対象なし＝404、検証＝400＋errors、副作用＝更新の有無）で判定する。差異は付帯表4#1で一元管理し、TSV本体の期待値には設計パスを混在させない**。認証は firewall `app`（`^/api/v1/`・access_token・`JwtTokenHandler`＋`JwtTokenHeaderExtractor`＝`app/config/eccube/packages/security.yaml:33-39`）。対象なし→`NotFoundException`（`OtcBuyOrderController.php:132-135`）、未認証→`UnauthenticatedException`（`OtcBuyOrderController.php:137-140`）。入力検証は `#[MapRequestPayload] UpdateOtcBuyOrderDto`（`OtcBuyOrderController.php:130`／`src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php`／明細 `UpdateOtcBuyOrderDetailDto.php`）。更新本体は `UpdateOtcBuyOrderAction`（`OtcBuyOrderController.php:143`）。本APIは正本md記載のとおりブラウザ向け画面を持たないため、更新副作用は永続化先テーブル（`dtb_otc_buy_order`・`dtb_otc_buy_order_detail`・`dtb_otc_buy_order_indivisual_input_product`・`dtb_otc_buy_order_stock`・`dtb_otc_buy_order_stock_history`・`dtb_otc_buy_order_status_history`＝正本md DBカラム節・リニューアル移行表）を直接DB照合（DB副作用観測）して判定し、別機能の管理画面 店頭買取受注詳細の表示は合否条件にしない。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A06-03-001/002/003/004/005/006/007/008 | E2E自動化(API/統合) | `PUT /api/v1/admin/otcBuyOrder/{id}.json`（OtcBuyOrderController.php:129／eccube.yaml:6,55） | 利用者視点の入口・処理フロー#8・レスポンス(成功)`{code:200}`／IT-09・IT-10・IT-32 | IT-A06-03-...-004,002,003,024,026,027,032,036 |
| E2E-A06-03-009 | 手動（要実機確認・想定外項目の許容/無視/エラー仕様未定義） | `PUT /api/v1/...`（OtcBuyOrderController.php:129）／要実機確認: 未定義項目の許容/無視/エラー挙動 | データ整合性・処理フロー（正本mdに未定義項目の許容/無視/エラー定義が無く固定期待にできず仕様化待ち）／IT-32 | IT-A06-03-...-006 |
| E2E-A06-03-020/021/022/023 | E2E自動化(API/統合) | firewall app access_token JwtTokenHandler/JwtTokenHeaderExtractor（security.yaml:33-39）／`UnauthenticatedException`（OtcBuyOrderController.php:137-140）／要実機確認: HS256署名検証の実方式 | 認証・認可（jwt-token/HS256・ヘッダ欠落/署名不正/該当会員なし＝すべて401・正本md認証・認可節:83,146）・処理フロー#1／IT-32・IT-10 | IT-A06-03-...-001,037 |
| E2E-A06-03-030 | E2E自動化(API/統合) | `NotFoundException`（OtcBuyOrderController.php:132-135） | 処理フロー#2・エラー処理(受注なし→404)／IT-32 | IT-A06-03-...-033 |
| E2E-A06-03-040/041/042/043/044/045/046 | E2E自動化(API/統合) | `#[MapRequestPayload] UpdateOtcBuyOrderDto`（OtcBuyOrderController.php:130／UpdateOtcBuyOrderDto.php:32-51） | 処理フロー#3・バリデーション節・レスポンス(失敗)`{code,errors}`／IT-10・IT-32 | IT-A06-03-...-008,009,013,030,025,031,005 |
| E2E-A06-03-050/051 | E2E自動化(API/統合) | `PUT /api/v1/...`（OtcBuyOrderController.php:129）＋`UpdateOtcBuyOrderAction`（OtcBuyOrderController.php:143）。一次オラクル＝APIレスポンス（成功200／4xx）＋DB副作用（在庫数量・買取合計金額・明細・履歴の各テーブルをDB照合） | データ整合性(更新範囲・明細の作り直し)・バリデーション(検証エラー時は保存しない)／IT-33 | IT-A06-03-...-017,018 |
| E2E-A06-03-060 | 手動（要実機確認・並行送信実再現） | 排他制御・トランザクション節（楽観/悲観ロックなし・後勝ち） | 排他制御・トランザクション・データ整合性(同時更新)／IT-19 | IT-A06-03-...-007 |
| E2E-A06-03-061 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理(例外)・処理フロー／IT-10 | IT-A06-03-...-015 |
| E2E-A06-03-100/101/102/103/104/105/106/107/108/109/110/111 | E2E自動化(API/統合) | `UpdateOtcBuyOrderDto`（NotNull/Choice/Count＝UpdateOtcBuyOrderDto.php:33,35,48,49）／`UpdateOtcBuyOrderDetailDto`（NotBlank/Length/PositiveOrZero＝UpdateOtcBuyOrderDetailDto.php:25-51）。111＝任意項目（quantity/price/sell_price/section_id/qualified_invoice_issuer_confirmation_flg）に必須制約が無く未指定でも検証を通過 | バリデーション節（ステータス必須・マスタ存在・明細必須・商品名必須/最大長65535・各項目整数／任意項目は必須・任意未入力でエラーにならない）／IT-22（設計書補完） | （母集合外・設計書補完。IT cases対象外観点の誤分類を補正＝付帯表4#9） |
| E2E-A06-03-120/121/122/123/124/125/127/128/129/131 | E2E自動化(API/統合) | DB副作用照合（`dtb_otc_buy_order`＝ステータス・買取合計金額・査定担当者／`dtb_otc_buy_order_detail`＝明細全置換・部門設定／`dtb_otc_buy_order_indivisual_input_product`＝個別入力商品・部門設定／`dtb_otc_buy_order_stock`＝在庫集計／`dtb_otc_buy_order_stock_history`＝在庫履歴／`dtb_otc_buy_order_status_history`＝ステータス変更履歴）。131＝部門IDがあり該当部門が存在する場合のみ部門設定（処理フロー#5）の非存在側分岐。本APIはブラウザ向け画面を持たず（正本md「ブラウザ向けの画面を持たない」）、別機能の管理画面表示は合否にしない | 副作用節・DBカラム節・集計条件・処理フロー#5（部門設定分岐）・データ整合性／IT-26（設計書補完） | （母集合外・設計書補完） |
| E2E-A06-03-126/130 | 手動／間接（要実機確認・日時/フラグ列の観測手段） | 成立日時/キャンセル日時・適格請求書確認済みフラグは成功応答`{code:200}`に含まれず、`dtb_otc_buy_order` 該当列の観測手段（現在日時の確定的判定・該当判定）は要実機確認 | 処理フロー#6・副作用節・DBカラム節／IT-26（設計書補完） | （母集合外・設計書補完） |
| E2E-A06-03-150 | 手動（要実機確認・保存例外実再現） | 共通例外処理（OtcBuyOrderController.php:144-148 InternalException）／例外の実再現は実機依存 | エラー処理(保存例外→500相当)・排他制御／IT-05（設計書補完） | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）で機能固有シナリオを持たず、外部キャッシュ・決済代行・転送再連携・売上返品等の本機能に非該当な観点を多く含む。本E2Eは正本md本文（処理フロー#1-8・バリデーション節・副作用節・DBカラム節）を一次オラクルに、API/統合レイヤ単独（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）で網羅し、正常×異常の対（更新成功↔バリデーション/認証/対象なし/部分更新なし）を揃えた。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a06_03_api_store_purchase_otc_buy_order_update_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 6 | 1 | 1 | 資格情報・受信検証・必須条件・レスポンス・データなしはHTTPステータス/レスポンス本文で観測可。想定外項目は正本mdに未定義項目の許容/無視仕様が無く固定期待にできず手動・要実機（仕様化待ち）。バージョニングは正典にバージョン依存挙動の定義が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常更新のHTTPステータス・実行結果・成功レスポンス本文 |
| IT-19 | 1 | 0 | 0 | 1 | 0 | 同時実行数の制限＝本APIは排他制御なし・後勝ち。並行送信の実再現は手動/要実機 |
| IT-10 | 18 | 0 | 8 | 1 | 9 | エラー一括返却/DB照合/通信/正常・異常系/HTTPステータス/JWT認証はAPI/統合。タイムアウト(1)は手動。ソート順(3)・相関バリ(2)・外部キャッシュ(2)・決済代行(2)＝計9は本機能に非該当で対象外 |
| IT-33 | 7 | 0 | 2 | 0 | 5 | 区分整合・部分更新なしはAPI/統合。外部取引/自動加算/実数更新/売上返品/連携エラー（外部決済・外部連携由来）＝5は本APIに非該当で対象外 |
| 合計 | 38 | 0 | 20 | 3 | 15 | **未分類 0** |

注1: 対象外15件の内訳は、IT-32 バージョニング1（正典にバージョン依存挙動の定義なし）／IT-10 9（複数エラーのソート順3＝正典にソート順定義なし、相関バリ2＝本機能に相関バリデーション該当処理なし、外部キャッシュ2＝本APIに外部キャッシュなし、決済代行2＝本APIに決済代行・外部決済なし）／IT-33 5（外部取引・自動加算・実数更新・売上返品・連携エラー＝いずれも外部決済/外部連携由来で本APIに該当処理なし）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 正本md本文（バリデーション節・副作用節・DBカラム節）から、母集合38行に対応行を持たない補完ケースを追加した。母集合集計には算入せず別管理する。本APIはブラウザ向け画面を持たないため、DB更新副作用は管理画面表示でなく永続化先テーブルのDB副作用照合で観測し、自動化(UI)は0とする。内訳＝自動化(API/統合) 22（100-110,111 入力検証＝IT-22。111＝任意項目未指定でエラーにならない正常系／120,121,122,123,124,125,127,128,129,131 DB更新副作用のDB照合＝IT-26。131＝該当部門が存在しないsection_idでは部門を設定しない分岐）／手動・要実機 3（126 日時分岐・130 確認済みフラグ＝IT-26、150 保存例外→500＝IT-05）。既存IT casesの対象外観点表が入力検証(IT-22)・DB更新(IT-26/IT-05)を「該当処理なし」と誤除外していたため、上位オラクル（正本md・基本設計）に照らして補正した（付帯表4#9）。任意項目の単独未指定の全網羅・部門設定分岐の全網羅は完全網羅が重く、代表ケースのみカバーで残りは付帯表5に未カバー（理由付き・要確認）として記録する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 020（成功）/021（欠落401）/023（署名不正401） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001 |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 046（異常パラメータ→400） |
| 006 | IT-32 | リクエスト | 手動（要実機確認） | 009（想定外項目＝正本mdに未定義項目の許容/無視仕様が無く固定期待にできず仕様化待ち） |
| 007 | IT-19 | 同時実行数の制限 | 手動（要実機確認） | 060（排他制御なし・後勝ち・並行送信実再現） |
| 008 | IT-10 | エラー | 自動化(API/統合) | 040 |
| 009 | IT-10 | エラー(複数単項目バリ一括返却) | 自動化(API/統合) | 041（errors配列に全件） |
| 010 | IT-10 | エラー(複数単項目バリ ソート順) | 対象外 | 正典にエラーメッセージのソート順定義が無く、固定期待にできないため |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 本機能に相関（クロス項目）バリデーション該当処理が無いため（単項目＋DB照合のみ） |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上＋ソート順定義なし |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 自動化(API/統合) | 042（ステータスマスタ存在照合を含む一括返却） |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 正典にソート順定義が無いため |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 061（タイムアウト実再現） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン依存の挙動定義が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 自動化(API/統合) | 050（更新対象外データ不変。一次オラクル＝API応答＋DB副作用照合） |
| 018 | IT-33 | エラー | 自動化(API/統合) | 051（検証エラー時部分更新なし。一次オラクル＝API応答＋DB副作用照合） |
| 019 | IT-33 | 外部取引 | 対象外 | 外部取引由来の加減算処理が本APIに無いため |
| 020 | IT-33 | 自動加算 | 対象外 | 外部連携由来の自動加算処理が本APIに無いため |
| 021 | IT-33 | 実数更新 | 対象外 | 外部連携由来の実数更新処理が本APIに無いため |
| 022 | IT-33 | 売上・返品 | 対象外 | 外部連携の売上減算/返品加算処理が本APIに無いため |
| 023 | IT-33 | 連携エラー | 対象外 | 外部連携（連携元・連携先双方更新）が本APIに無いため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004（成功レスポンス本文） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 044 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 005 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 006 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本APIに外部キャッシュの参照/判定処理が無いため |
| 029 | IT-10 | 障害(外部キャッシュ接続障害) | 対象外 | 本APIに外部キャッシュの接続/フォールバック処理が無いため |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 043 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 045（order_details必須） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 007 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 030（対象受注なし→404） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本APIに決済代行・外部決済サービス連携が無いため |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 008（入力検証通過で更新成功） |
| 037 | IT-10 | 重複・順序(認証方式JWT) | 自動化(API/統合) | 022（JWTで管理者特定・該当なし401） |
| 038 | IT-10 | 部分失敗(転送再連携) | 対象外 | 本APIに外部通知/外部取得結果の転送・再連携が無いため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 20（001,002,003,004,005,008,009,013,017,018,024,025,026,027,030,031,032,033,036,037）／手動・要実機 3（006,007,015）／対象外 15（010,011,012,014,016,019,020,021,022,023,028,029,034,035,038）。**未分類 0**（母集合38行）。母集合外の設計書補完ケース（100-110＝IT-22・120-130＝IT-26・150＝IT-05）は別管理で母集合集計を変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A06-03-JWT-ADMIN | dtb_member（査定担当者）／jwt-token | 有効な管理者会員1。利用者IDが当該会員に紐づくHS256署名のjwt-tokenを供給（トークン原値・署名シークレットは環境変数で供給しログ/設計に書かない）。021/022/023用に「ヘッダ欠落」「該当会員なし」「署名不正」のトークン状態を別途用意 | fixture／env（JWT発行は a06-01 買取アプリ用ログインAPI またはenv供給。`pf-api`方針に依存する署名検証は要実機確認） | 専用会員・撤去可。トークンは使い捨て | 020以外の全API/統合ケース |
| SEED-A06-03-ORDER | dtb_otc_buy_order（＋既存の明細/個別入力商品/在庫/在庫履歴） | 既知IDの店頭買取受注1件。既存明細・在庫・履歴あり。更新前ステータス既知。適格請求書発行事業者「該当」「非該当」の2種。別受注1件（区分整合050用） | fixture／migration | 専用受注・テスト毎に初期状態へ復元してべき等化。更新系（120-129等）は実行前にリセット | 全更新ケース |
| SEED-A06-03-STATUS-MTB | mtb_otc_buy_order_status | 成立(1)・キャンセル(2)等の店頭買取ステータスが存在。101用にマスタ非存在となるID（範囲外）を確定 | fixture（既定マスタ） | 既存利用・撤去不要 | ステータス指定/検証の全ケース |
| SEED-A06-03-SECTION | mtb_section／商品規格（product_class） | 既知の部門1件・商品規格1件以上。明細の部門設定・在庫集計に使用 | fixture／migration | 専用データ・撤去可 | 008,050,106,110,123 |
| SEED-A06-03-PAYLOAD | リクエストボディ（synthetic） | 正本md入出力節準拠の最小ボディ（order_status・order_details[]＝product_class_id/name/quantity/price/sell_price/section_id・qualified_invoice_issuer_confirmation_flg）。正常/各検証異常/想定外項目/境界(65535/65536)のバリエーション | synthetic（正本md由来。実装DTOの追加項目smaregi_transaction_idは期待値に含めない＝付帯表4#7） | テスト内生成・後始末不要。記載フィールドのみ、未記載は要実機確認コメント | 全送信ケース |
| SEED-M01-ADMIN | dtb_member（管理者） | DB副作用照合の基準・整合に用いる有効な管理者会員1（ID/PWは config 既定。2FA OFF）。本APIは画面を持たず、副作用は永続化先テーブルを直接DB照合して観測するため画面閲覧は行わない | fixture（config既定） | 既存利用・撤去不要 | 050,051,120-129（DB副作用観測） |

注: ペイロードは正本md入出力節記載のフィールドのみで最小構成し、買取アプリ（MTGバイヤー）実環境は使わない。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（dtb_otc_buy_order 等の同名スキーマ。査定担当者の主キーは member_id→id へ移行）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。JWTトークン・署名シークレットは環境変数で供給し原値を書かない。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md・観点表・基本設計）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /admin/otcBuyOrder/{id}.json`（正本md 利用者視点の入口） | `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}.json' ...)]`（OtcBuyOrderController.php:129）＋既定 `api/v1`（eccube.yaml:6,55）＝実効 `/api/v1/admin/otcBuyOrder/{id}.json` | **正本mdパスは `/api/v1` プレフィクスを欠き実装と不一致**。テストは実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 入力検証エラーは入力不正＝HTTP 400（正本md レスポンス(失敗)・バリデーション節） | `#[MapRequestPayload]`（OtcBuyOrderController.php:130）はSymfony既定で検証失敗時 HTTP 422 を返す | **検証失敗時のHTTPステータスが仕様400と実装既定422で食い違う可能性**。テストは仕様の400で判定し落とす（実機の実ステータスは要確認） | 040-046,100-110 | 要確認(検証ステータス400/422) |
| 3 | order_status は店頭買取ステータスマスタに存在する値であること（正本md バリデーション節） | `#[Assert\Choice(choices: MtbOtcBuyOrderStatus::ASSESSMENT_COMPLETED_STATUSES ...)]`（UpdateOtcBuyOrderDto.php:35／MtbOtcBuyOrderStatus.php:91-93＝成立1・キャンセル2のみ） | **実装はマスタ全体でなく{成立,キャンセル}の2値に限定**。マスタ存在だが対象外のステータスの扱いが仕様と食い違う可能性 | 101 | 要確認(許容ステータス範囲) |
| 4 | 検証メッセージ「ステータスを選択してください。」「1つ以上の商品を選んでください。」（末尾「。」あり・正本md） | `message: 'ステータスを選択してください'`／`'1つ以上の商品を選んでください'`（末尾「。」なし＝UpdateOtcBuyOrderDto.php:33,48,49） | **実装メッセージが末尾の句点「。」を欠く**。テストは正本mdの文言で判定 | 100,102,045 | 不具合候補(文言乖離) |
| 5 | ステータスID非存在は「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」（正本md） | `#[Assert\Choice(... message: 'order_status is invalid')]`（UpdateOtcBuyOrderDto.php:35） | **実装メッセージ・機構（Choice）が仕様の「マスタ非存在」文言と食い違う**。テストは正本mdの文言で判定 | 101 | 不具合候補(文言・機構乖離) |
| 6 | 商品名最大長超過は「商品名は、 65535 以下で入力してください。」（正本md） | `maxMessage: '商品名は、{{ limit }}文字以下で入力してください。'`（UpdateOtcBuyOrderDetailDto.php:32）＝「商品名は、65535文字以下で入力してください。」 | **実装メッセージ（「文字以下」表記）が仕様文言と食い違う**。テストは正本mdの文言で判定 | 105 | 不具合候補(文言乖離) |
| 7 | リクエスト項目は order_status・order_details[]・qualified_invoice_issuer_confirmation_flg（正本md 入出力節。`smaregi_transaction_id` の記載なし） | DTOに `#[SerializedName('smaregi_transaction_id')]`（端末取引ID・UpdateOtcBuyOrderDto.php:42-45）が存在 | **実装は正本md未記載の入力項目 `smaregi_transaction_id` を受け取る**。仕様未記載のため期待値に含めない（要確認） | 009 | 要確認(仕様未記載項目) |
| 8 | 数量・単価・販売価格・部門ID・商品規格IDは「整数のみ」（正本md。負値の扱いは未定義） | `#[Assert\PositiveOrZero(...)]`（UpdateOtcBuyOrderDetailDto.php:26,35,39,44,49）＝負値も拒否 | **実装は0以上に限定し負値を拒否するが、正本mdは「整数のみ」で負値の扱いを定義していない**。負値ケースは固定期待にせず要確認 | 106-110 | 要確認(負値の許容範囲) |
| 9 | 正本md・実装に入力検証（バリデーション節）とDB更新（副作用・DBカラム節）が存在 | 既存IT cases 対象外観点表が「バリデーション(IT-22)…本機能に入力検証対象がないため」「更新(IT-05/IT-23/IT-26)…該当する処理・I/Fがないため」と記載 | **既存IT cases（観点表側）が入力検証・DB更新を誤って対象外にしている**。上位オラクル（正本md・基本設計）に照らし補正し、IT-22/IT-26/IT-05を設計書補完ケースで網羅 | 100-110,120-130,150 | 不具合候補(観点表の誤分類) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（受注IDで特定し明細等を作り直し更新） | 正常更新の成功応答 | 001,002,008 | カバー |
| 利用者視点の入口（`PUT /admin/otcBuyOrder/{id}.json`・成功時code200） | 実効パスへの送信・成功code200 | 001,004,007 | カバー（付帯表4#1でパス乖離記録） |
| 認証・認可（jwt-token/HS256・401・査定担当者記録） | 有効JWTで成功・欠落/署名不正/該当なしで401・査定担当者=認証会員 | 020,021,022,023,129 | カバー（HS256実方式は要実機） |
| 処理フロー#1（トークン検証→管理者特定・401） | 認証拒否（欠落/署名不正/該当なし） | 021,022,023 | カバー |
| 処理フロー#2（受注IDで取得・該当なし404） | 対象なし404 | 030 | カバー |
| 処理フロー#3（ステータス・明細・各件の検証→400 errors） | 各検証エラー・複数一括返却 | 040,041,042,045,046,100-110 | カバー |
| 処理フロー#4-5（既存削除→明細作り直し・個別入力商品・在庫集計・買取合計10円切上げ・部門設定） | 明細全置換・個別入力商品・在庫集計・金額切上げ・部門設定の非存在側分岐 | 122,125,123,121,131 | カバー（DB副作用観測。131＝該当部門なしで部門未設定の代表。部門あり側は123） |
| 処理フロー#6（ステータス・査定担当者・更新日時・成立/キャンセル日時・確認済みフラグ） | ステータス更新・査定担当者・日時分岐・確認済みフラグ | 120,129,126,130 | カバー（126,130は手動/間接・要実機） |
| 処理フロー#7（更新前後でステータス相違時に変更履歴1件登録） | 履歴登録・同一時は非登録 | 127,128 | カバー |
| 処理フロー#8・レスポンス(成功)（code200のJSON） | 成功レスポンス書式 | 003,004,005,006,007 | カバー |
| 集計条件（買取合計10円切上げ・在庫数量=商品規格別集計・個別入力は除外） | 金額切上げ・在庫集計 | 121,123 | カバー |
| 入出力・バリデーション節（必須・マスタ存在・整数・最大長65535・任意項目は必須/任意未入力でエラーにならない） | 各項目検証・境界(65535/65536)・任意項目未指定の正常系 | 100-110,111 | カバー（111＝任意項目同時未指定の代表） |
| 任意項目未入力（IT-22「必須入力・任意未入力でエラーにならない」） | product_class_id/quantity/price/sell_price/section_id/qualified_invoice_issuer_confirmation_flg の各単独未指定でエラーにならない | 111（全任意項目を同時未指定の代表） | 一部カバー・残り未カバー（要確認）。代表として全任意項目の同時未指定をカバー。各任意項目を1つずつ単独未指定にする網羅は組合せが多く完全網羅が重いため未カバー＝追加ケース/要実機で確認 |
| 処理フロー#5（部門IDがあり該当部門が存在すれば部門を設定する分岐） | section_idの存在/非存在の分岐（明細側・個別入力商品側） | 123（部門存在側）,131（部門非存在側） | 一部カバー・残り未カバー（要確認）。代表として部門の存在/非存在をカバー。明細側と個別入力商品側を分けた全分岐の組合せ網羅は完全網羅が重いため未カバー＝追加ケース/要実機で確認 |
| 副作用節（削除→再登録・受注更新・成立/キャンセル日時・確認済みフラグ・履歴登録・在庫履歴） | DB更新副作用のDB照合/間接観測 | 120-130 | カバー（一部手動/要実機） |
| データ整合性（更新範囲・明細全置換・同一ステータスでも作り直し・同時更新後勝ち） | 全置換・同一時作り直し・後勝ち | 122,128,060 | カバー（060は手動/要実機） |
| エラー処理（401/404/400/保存例外→500相当） | 各エラー応答・保存例外で部分更新なし | 021,030,043,150 | カバー（150は手動/要実機） |
| 権限・認可（認証済み更新可・未認証401） | 認証成功/失敗 | 020,021 | カバー |
| 排他制御・トランザクション（ロックなし・後勝ち） | 同時更新の片側更新なし | 060 | カバー（手動/要実機） |
| ログ・監査（ステータス/在庫履歴のDB業務履歴・機密値非出力） | 業務履歴のDB永続化（DB副作用観測）／アプリログ機密値抑止 | 127,124 | カバー（アプリログ機密値抑止はAPI応答に現れず対象外＝下記） |
| 同時実行数の制限（IT-19） | 並行更新の整合 | 060 | カバー（手動/要実機） |
| タイムアウト・障害（IT-10） | 仕様どおりの応答・部分更新なし | 061,150 | カバー（手動/要実機） |
| 複数バリデーションのソート順・相関バリ（IT-10細目） | （該当処理なし） | （対象外） | 対象外（正典にソート順定義なし・本機能に相関バリデーションなし） |
| 外部キャッシュ・決済代行・転送再連携・外部取引/売上返品/自動加算（IT-10/IT-33細目） | （該当処理なし） | （対象外） | 対象外（本APIに外部キャッシュ/決済/外部連携由来の加減算が無い） |
| バージョニング（IT-32） | （定義なし） | （対象外） | 対象外（正典にAPIバージョン依存の挙動定義なし） |
| アプリケーションログの機密値抑止（ログ・監査節「ログに出してはいけないもの」） | JWT原値・署名シークレット・Cookie値の非出力 | （対象外＝サーバログ実機観測） | 対象外（API応答に現れず。サーバログ実機観測は本E2E範囲外） |

未カバーはいずれも理由（正典にソート順/バージョン依存挙動の定義なし・本APIに外部キャッシュ/決済/外部連携由来処理なし・アプリログ機密値抑止はサーバログ実機観測で本E2E範囲外。加えて任意項目の単独未指定の全組合せ・部門設定分岐の明細側/個別入力商品側の全組合せは完全網羅が重く代表ケースのみカバーで残りは要確認）を明記済み。正本mdの各節（処理フロー#1-8・バリデーション・副作用・データ整合性・エラー処理）はAPI/統合レイヤ（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）へ写像し、正常×異常の対（更新成功001/008/020 ↔ 認証失敗021/022/023・対象なし030・検証エラー040-046/100-110・部分更新なし051）を揃えた。
