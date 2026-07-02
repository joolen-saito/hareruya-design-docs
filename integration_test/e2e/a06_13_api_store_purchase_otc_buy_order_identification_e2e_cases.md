# A06-13（店頭仕入_買取注文本人確認） E2Eテストケース

元設計md（正本一次／pf-apiリバース）: `functions/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a06-13_api_store_purchase_otc_buy_order_identification.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a06_13_api_store_purchase_otc_buy_order_identification_it_cases.md`（母集合 計38観点行）

本機能は**ブラウザ向けの画面を持たない**機能仕様（JWT認証つきPUT API＝店頭買取受注の本人確認証明書を更新。正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）であり、**API/統合レイヤ単独で網羅**する。Playwright `request` で `PUT /api/v1/admin/otcBuyOrder/{id}/identification.json` へ送信し、HTTPステータス・レスポンス本文（成功`{code:200}`／失敗`{code, errors}`）で判定する。更新副作用（本人確認証明書`identification_id`・更新担当者`member_id`・更新日時`update_date`の3列のみ更新）は永続化先テーブル `dtb_otc_buy_order` を直接DB照合（DB副作用観測）して判定する。本機能は画面を持たないため、別機能（管理画面 店頭買取受注詳細）の表示は合否条件にしない。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装のレスポンス形・例外機構・HTTPライブラリ既定値・Form/DTO制約を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdを上位オラクル、観点表（基本設計）と食い違う箇所も上位オラクルとして扱い、乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・認証方式・セレクタ）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。TSV は既存IT casesと同一の 10 列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

更新系のため、DB更新観点（IT-26/IT-05）を網羅に含める。正本md・実装には入力検証（証明書IDの存在確認）とDB更新（3列更新）が存在するが、既存IT casesの対象外観点表は「本機能に入力検証対象がないため」「本機能に更新処理がないため」と誤って除外している。これを上位オラクル（正本md 副作用節・バリデーション節・DBカラム節）に照らして補正し、DB更新（IT-26/IT-05）を設計書補完ケースとして追加した（母集合外・別管理）。当該誤分類は付帯表4#6に記録する。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（JWT認証）・受信検証（証明書IDマスタ存在）・必須条件（identification必須）・想定外項目・レスポンス書式（`{code:200}`）・データなし（対象受注なし→404）。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-09 | 正常更新のHTTPステータス・実行結果・リクエスト正常・成功レスポンス本文 |
| IT-19 | 同時実行数の制限（本APIは排他制御を持たず同時更新は後勝ち。実再現は手動） |
| IT-10 | HTTPステータス・通信・正常／異常系・証明書ID不正（400＋errors）・JWT認証検証。複数バリデーション一括返却／ソート順／相関バリ／外部キャッシュ／決済代行／転送再連携は本機能に非該当で対象外 |
| IT-33 | 区分整合（更新対象外の他受注・他列の数量金額が不変）・検証エラー時の部分更新なし。外部取引／売上返品／自動加算／実数更新／連携エラー（外部決済・外部連携由来）は本APIに非該当で対象外 |
| IT-26/IT-05 | （設計書補完）本人確認証明書`identification_id`・更新担当者`member_id`・更新日時`update_date`のDB更新をDB副作用照合／間接で観測。保存例外時の部分更新なし |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-001	IT-09	リクエスト	P1	正常な証明書IDでPUTし200が返る	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	"有効なjwt-tokenヘッダ
identification=本人確認証明書マスタに存在するID"	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	正常更新としてHTTPステータス200が返ること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-002	IT-09	実行結果	P3	更新実行後の処理結果が一致する	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンスと後続状態を確認する"	更新処理が実行され、処理結果（成功）がレスポンスと一致すること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-003	IT-09	HTTPステータス	P3	成功時のHTTPステータスが200である	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	HTTPステータスが成功（200）であること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-004	IT-09	外部取得	P1	成功レスポンス本文がcode=200を含む	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンス本文を確認する"	成功時のレスポンス本文が `{code:200}` であること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-005	IT-10	通信	P1	正常通信で200が返る	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200（成功）であること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-006	IT-10	正常	P2	対象条件に該当する正常値で200が返る	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	対象条件に該当する正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスと後続状態を確認する"	正常更新としてHTTPステータスが200（成功）であること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-007	IT-32	レスポンス	P3	成功レスポンス書式がcode:200と一致する	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・正常な本人確認更新リクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. レスポンス本文の書式を確認する"	成功時のレスポンス書式が仕様の `{code:200}`（codeフィールドのみ・camelCase・日時はISO8601）と一致すること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-008	IT-32	受信検証	P1	マスタ存在の証明書IDで本人確認更新が成功200となる	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	本人確認証明書マスタに存在するidentificationを指定したリクエスト	"1. 対象受注IDへPUTでリクエストを送信する
2. HTTPステータスを確認する"	証明書IDが本人確認証明書マスタに存在する検証を満たし、HTTPステータス200で更新が成功すること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-009	IT-32	リクエスト	P3	想定外項目追加時の挙動が要実機確認・仕様化待ちである	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	正常リクエストに仕様未定義の想定外項目（項目名と値のセット）を追加	"1. 想定外項目を含むリクエストをPUTで送信する
2. HTTPステータスを確認する"	正本mdに未定義項目の許容/無視/エラーの仕様が無いため、想定外項目追加時の更新成否を固定期待にできず、許容・無視・エラーいずれの挙動とするかは要実機確認・仕様化待ちであること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-020	IT-32	資格情報	P1	有効なJWTで更新が成功する	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token（該当する管理者会員あり）・正常リクエスト	"1. 有効なjwt-tokenを付与してPUTで送信する
2. HTTPステータスを確認する"	資格情報が有効な場合、HTTPステータス200で更新が成功すること。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-021	IT-32	資格情報	P1	jwt-tokenヘッダ欠落で401となり更新されない	SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	jwt-tokenヘッダを付与しないリクエスト	"1. jwt-tokenヘッダ無しでPUTで送信する
2. HTTPステータスと受注状態を確認する"	認証拒否を示すHTTPステータス401が返り、応答本文を持たない（空）こと（実装の共通例外リスナーが本文を返すなら落ちて検出＝付帯表4#8）。対象受注の本人確認証明書が更新されないこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-022	IT-10	重複・順序	P1	該当する管理者会員が無いJWTで401となる	SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	利用者IDに該当する管理者会員が存在しないjwt-token	"1. 該当会員なしのjwt-tokenでPUTで送信する
2. HTTPステータスと受注状態を確認する"	JWTの利用者IDから管理者会員を特定できず、HTTPステータス401が返り更新されないこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-023	IT-32	資格情報	P1	署名不正のJWTで401となり更新されない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	署名検証に失敗するjwt-token（署名シークレット不正）	"1. 署名不正のjwt-tokenでPUTで送信する
2. HTTPステータスと受注状態を確認する"	署名検証に失敗し、認証拒否を示すHTTPステータス401が返り、対象受注が更新されないこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-030	IT-32	データなし	P1	存在しない受注IDで404となり更新されない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-IDENT-MTB	有効なjwt-token・該当しない受注ID	"1. 存在しない受注IDへPUTで送信する
2. HTTPステータスと後続状態を確認する"	該当なしを示すHTTPステータス404が返り、応答本文を持たない（空）こと（実装の共通例外リスナーが本文を返すなら落ちて検出＝付帯表4#8）。本人確認証明書の更新が行われないこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-040	IT-10	エラー	P2	identification未指定で400となりerrorsを含む	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER	有効なjwt-token・identification未指定（ボディに証明書IDなし）	"1. identificationを未指定にしてPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	入力不正を示すHTTPステータス400が返り、レスポンス本文 `errors` に「正しい証明書IDを入力してください」を含むこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-041	IT-10	異常系	P2	マスタ非存在の証明書IDで400となりerrorsを含む	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・本人確認証明書マスタに存在しないidentification	"1. マスタ非存在のidentificationでPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	入力不正を示すHTTPステータス400が返り、レスポンス本文 `errors` に「正しい証明書IDを入力してください」を含むこと（実装は404を返す可能性＝付帯表4#2。期待は仕様の400で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-042	IT-10	HTTPステータス	P1	証明書ID不正時のHTTPステータスが400である	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・証明書IDが不正（未指定またはマスタ非存在）なリクエスト	"1. 証明書ID不正のリクエストをPUTで送信する
2. HTTPステータスを確認する"	入力不正を示すHTTPステータスが400であること（実装は404を返す可能性＝付帯表4#2。期待は仕様の400で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-043	IT-32	必須条件	P3	identificationは必須で未指定時に更新されない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER	有効なjwt-token・identification未指定	"1. identificationを未指定にしてPUTで送信する
2. HTTPステータスと受注状態を確認する"	identificationが必須であり、未指定時はHTTPステータス400が返り、対象受注の本人確認証明書が更新されないこと。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-050	IT-33	区分整合	P1	更新後に更新対象外の他受注・他列の数量と金額が不変	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER（対象受注＋別受注）／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	有効なjwt-token・対象受注のみを更新する正常リクエスト	"1. 対象受注IDへPUTで送信し200と成功応答を確認する
2. 一次オラクルとしてDB副作用（別受注の各列・対象受注の本人確認以外の列＝買取合計金額・ステータス・明細）を照合する"	別受注の各列、および対象受注の本人確認証明書・更新担当者・更新日時以外の列（数量・金額・ステータス）が更新前と一致し変動しないこと（DB副作用で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-051	IT-33	エラー	P1	証明書ID不正時に本人確認・更新担当者・更新日時が部分更新されない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	有効なjwt-token・証明書IDが不正（マスタ非存在）なリクエスト	"1. 証明書ID不正のリクエストをPUTで送信し4xxを確認する
2. 一次オラクルとしてDB副作用（対象受注の identification_id・member_id・update_date）を受信前と照合する"	証明書ID不正時は保存が行われず、本人確認証明書・更新担当者・更新日時がDB副作用上で受信前と一致（部分更新されない）こと（DB副作用で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-060	IT-19	同時実行数の制限	P3	同一受注の同時更新で片側更新の不整合が残らない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・同一受注への並行する2リクエスト（異なる証明書ID）	"1. 同一受注へ2リクエストを並行してPUTで送信する
2. 最終状態を確認する"	本APIは排他制御を持たず同時更新は後勝ちとなり、いずれか一方の証明書IDが一貫して反映され、本人確認・更新担当者・更新日時が片側だけ更新された不整合が残らないこと（並行送信の実再現は要実機確認）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-061	IT-10	エラー	P3	処理タイムアウト時に仕様どおりの応答となる	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPUTで送信する
2. 応答と受注状態を確認する"	サーバ無応答・未定義例外で停止せず、エラー応答が返り、対象受注が部分更新されず一致すること（タイムアウト実再現は要実機確認）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-120	IT-26	更新内容	P1	更新後に本人確認証明書が指定証明書へ更新される	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	有効なjwt-token・指定証明書IDを設定する正常リクエスト	"1. 対象受注IDへPUTで送信する
2. DB副作用（dtb_otc_buy_order.identification_id）を照合する"	店頭買取受注の本人確認証明書（identification_id）が指定した証明書IDに更新されること（DB副作用で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-121	IT-26	更新内容	P1	更新担当者に認証した管理者会員が記録される	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	認証した管理者会員のjwt-token・正常リクエスト	"1. 認証管理者会員のjwt-tokenでPUTで送信する
2. DB副作用（dtb_otc_buy_order.member_id）を照合する"	更新担当者（member_id）にjwt-tokenから特定した認証管理者会員が記録されること（DB副作用で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-122	IT-26	更新内容	P2	更新日時が更新時の現在時刻で更新される	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	有効なjwt-token・正常リクエスト	"1. 対象受注IDへPUTで送信する
2. dtb_otc_buy_order.update_date を確認する"	更新日時（update_date）が更新時の現在時刻で更新されること（現在時刻の確定的判定は要実機確認）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-123	IT-26	更新内容	P1	本人確認・担当者・日時の3列のみ更新し受注他項目は不変	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB／SEED-M01-ADMIN	有効なjwt-token・正常リクエスト	"1. 対象受注IDへPUTで送信する
2. DB副作用（dtb_otc_buy_order の identification_id・member_id・update_date と他項目・ステータス）を照合する"	本人確認証明書・更新担当者・更新日時の3列のみが更新され、受注の他項目・ステータスは変更されないこと（DB副作用で判定）。
a06-13_api_store_purchase_otc_buy_order_identification（API_店頭仕入_買取注文本人確認）	E2E-A06-13-150	IT-05	実行結果	P3	保存処理中の例外時に部分更新が残らない	SEED-A06-13-JWT-ADMIN／SEED-A06-13-ORDER／SEED-A06-13-IDENT-MTB	有効なjwt-token・保存中の例外を誘発するシナリオ	"1. 保存例外を誘発してPUTで送信する
2. 応答と受注状態を確認する"	共通例外処理に委ね（HTTP 500相当）、対象受注の本人確認証明書・更新担当者・更新日時が受信前と一致し部分更新が残らないこと（例外の実再現は要実機確認）。
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', name: 'api_admin_otc_buy_order_update_identification', methods: ['PUT'])]`（`src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:273`）。`eccube_api_v1_route` は env `ECCUBE_API_V1_ROUTE`（`app/config/eccube/packages/eccube.yaml:55`／既定 `api/v1`）。実効パスは `PUT /api/v1/admin/otcBuyOrder/{id}/identification.json`。**正本md「利用者視点の入口」のパス `PUT /admin/otcBuyOrder/{id}/identification`（.json 別名あり）は `/api/v1` プレフィクスを欠き実装と食い違う（正本mdの移行表は移行先に `/{api_v1_route}` プレフィクスを記す）。送信先パスは実装の実効パス `/api/v1/admin/otcBuyOrder/{id}/identification.json` に統一し、合否は正本mdの意味（成功＝code:200、認証＝資格情報照合の通過/拒否、対象なし＝404、証明書ID不正＝400＋errors、副作用＝3列更新の有無）で判定する。差異は付帯表4#1で一元管理し、TSV本体の期待値には設計パスを混在させない**。認証は firewall `app`（`pattern: ^/api/v1/`・access_token・`JwtTokenHandler`＋`JwtTokenHeaderExtractor`＝`app/config/eccube/packages/security.yaml:33-39`）。受注なし→`NotFoundException`（`OtcBuyOrderController.php:276-279`／404）、証明書ID未指定→`MissingRequiredParameterException`（`OtcBuyOrderController.php:281-284`／400）、証明書IDマスタ非存在→`NotFoundException`（`OtcBuyOrderController.php:288-291`／**実装404**・仕様400）、未認証→`UnauthenticatedException`（`OtcBuyOrderController.php:293-296`／401。一次的にはfirewallが先行拒否）。更新本体は `UpdateIdentificationAction`（`OtcBuyOrderController.php:299`／入力 `UpdateIdentificationInput(OtcBuyOrder, Member, Identification)`）。成功応答は `JsonResponse(['code' => 200], 200)`（`OtcBuyOrderController.php:309`）。本APIは正本md記載のとおりブラウザ向け画面を持たないため、更新副作用は永続化先テーブル `dtb_otc_buy_order`（`identification_id`・`member_id`・`update_date`＝正本md DBカラム節・リニューアル移行表）を直接DB照合（DB副作用観測）して判定し、別機能の管理画面 店頭買取受注詳細の表示は合否条件にしない。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A06-13-001/002/003/004/005/006/007/008 | E2E自動化(API/統合) | `PUT /api/v1/admin/otcBuyOrder/{id}/identification.json`（OtcBuyOrderController.php:273／eccube.yaml:55）／成功 `JsonResponse(['code'=>200],200)`（OtcBuyOrderController.php:309） | 利用者視点の入口・処理フロー#4-5・レスポンス(成功)`{code:200}`／IT-09・IT-10・IT-32 | IT-A06-13-...-004,002,003,024,026,027,032,036 |
| E2E-A06-13-009 | 手動（要実機確認・想定外項目の許容/無視/エラー仕様未定義） | `PUT /api/v1/...identification.json`（OtcBuyOrderController.php:273）／要実機確認: 未定義項目の許容/無視/エラー挙動 | データ整合性・処理フロー（正本mdに未定義項目の許容/無視/エラー定義が無く固定期待にできず仕様化待ち）／IT-32 | IT-A06-13-...-006 |
| E2E-A06-13-020/021/022/023 | E2E自動化(API/統合) | firewall app access_token JwtTokenHandler/JwtTokenHeaderExtractor（security.yaml:33-39）／`UnauthenticatedException`（OtcBuyOrderController.php:293-296）／要実機確認: HS256署名検証の実方式・`jwt-token` ヘッダ名 | 認証・認可（jwt-token/HS256・ヘッダ欠落/署名不正/該当会員なし＝すべて401・正本md認証・認可節:76,129）・処理フロー#1／IT-32・IT-10 | IT-A06-13-...-001,037 |
| E2E-A06-13-030 | E2E自動化(API/統合) | `NotFoundException`（OtcBuyOrderController.php:276-279） | 処理フロー#2・エラー処理(受注なし→404)・バリデーション(id)／IT-32 | IT-A06-13-...-033 |
| E2E-A06-13-040/043 | E2E自動化(API/統合) | `MissingRequiredParameterException`（OtcBuyOrderController.php:281-284／400） | 処理フロー#3・バリデーション(identification必須)・レスポンス(失敗)`{code,errors}`／IT-10・IT-32 | IT-A06-13-...-008,031 |
| E2E-A06-13-041/042 | E2E自動化(API/統合)（要実機確認: 実HTTPステータス） | 証明書IDマスタ非存在 `NotFoundException`（OtcBuyOrderController.php:288-291）。**実装は404・仕様は400＝付帯表4#2**。期待は仕様400で判定 | 処理フロー#3・エラー処理(証明書ID不正→400)・レスポンス(失敗)`{code,errors}`／IT-10 | IT-A06-13-...-030,025,005 |
| E2E-A06-13-050/051 | E2E自動化(API/統合) | `PUT /api/v1/...identification.json`＋`UpdateIdentificationAction`（OtcBuyOrderController.php:299）。一次オラクル＝APIレスポンス（成功200／4xx）＋DB副作用（dtb_otc_buy_order の本人確認以外の列・別受注をDB照合） | データ整合性(更新範囲＝3列のみ・他項目不変)・バリデーション(証明書ID不正時は保存しない)／IT-33 | IT-A06-13-...-017,018 |
| E2E-A06-13-060 | 手動（要実機確認・並行送信実再現） | 排他制御・トランザクション節（楽観/悲観ロックなし・後勝ち） | 排他制御・トランザクション・データ整合性(同時更新)／IT-19 | IT-A06-13-...-007 |
| E2E-A06-13-061 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理(例外)・処理フロー／IT-10 | IT-A06-13-...-015 |
| E2E-A06-13-120/121/123 | E2E自動化(API/統合) | DB副作用照合（`dtb_otc_buy_order`＝`identification_id`(本人確認証明書)／`member_id`(更新担当者)／3列のみ更新・他項目不変＝正本md DBカラム節・副作用節）。本APIはブラウザ向け画面を持たず（正本md「ブラウザ向けの画面を持たない」）、別機能の管理画面表示は合否にしない | 副作用節・DBカラム節・データ整合性(更新範囲)・処理フロー#4／IT-26（設計書補完） | （母集合外・設計書補完。IT cases対象外観点の誤分類を補正＝付帯表4#6） |
| E2E-A06-13-122 | 手動／間接（要実機確認・update_date列の観測手段） | 更新日時 `update_date` は成功応答`{code:200}`に含まれず、`dtb_otc_buy_order.update_date` の観測手段（現在時刻の確定的判定）は要実機確認 | 処理フロー#4・副作用節・DBカラム節(update_date)／IT-26（設計書補完） | （母集合外・設計書補完） |
| E2E-A06-13-150 | 手動（要実機確認・保存例外実再現） | 共通例外処理（OtcBuyOrderController.php:302-307＝BaseApiExceptionは再送出・`\Throwable`は`InternalException`で500）／例外の実再現は実機依存 | エラー処理(保存例外→500相当)・排他制御／IT-05（設計書補完） | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）で機能固有シナリオを持たず、外部キャッシュ・決済代行・転送再連携・売上返品等の本機能に非該当な観点を多く含む。本E2Eは正本md本文（処理フロー#1-5・バリデーション節・副作用節・DBカラム節）を一次オラクルに、API/統合レイヤ単独（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）で網羅し、正常×異常の対（更新成功↔認証失敗/対象なし/証明書ID不正/部分更新なし）を揃えた。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a06_13_api_store_purchase_otc_buy_order_identification_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 6 | 1 | 1 | 資格情報・受信検証・必須条件・レスポンス・データなしはHTTPステータス/レスポンス本文で観測可。想定外項目は正本mdに未定義項目の許容/無視仕様が無く固定期待にできず手動・要実機（仕様化待ち）。バージョニングは正典にバージョン依存挙動の定義が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常更新のHTTPステータス・実行結果・成功レスポンス本文 |
| IT-19 | 1 | 0 | 0 | 1 | 0 | 同時実行数の制限＝本APIは排他制御なし・後勝ち。並行送信の実再現は手動/要実機 |
| IT-10 | 18 | 0 | 6 | 1 | 11 | エラー(証明書ID不正)/通信/正常・異常系/HTTPステータス/JWT認証はAPI/統合。タイムアウト(1)は手動。複数バリデーション一括返却・ソート順(6)・外部キャッシュ(2)・決済代行(2)・転送再連携(1)＝計11は本機能に非該当で対象外 |
| IT-33 | 7 | 0 | 2 | 0 | 5 | 区分整合・部分更新なしはAPI/統合。外部取引/自動加算/実数更新/売上返品/連携エラー（外部決済・外部連携由来）＝5は本APIに非該当で対象外 |
| 合計 | 38 | 0 | 18 | 3 | 17 | **未分類 0** |

注1: 対象外17件の内訳は、IT-32 バージョニング1（正典にバージョン依存挙動の定義なし）／IT-10 11（複数単項目バリ一括返却・ソート順2＝本APIは単一項目`identification`のみで複数エラー一括返却・ソート順を持たない、相関バリ一括返却・ソート順2＝相関バリデーション該当処理なし、DB相関バリ一括返却・ソート順2＝DB照合は証明書存在の単一照合で複数一括返却なし、外部キャッシュ2＝本APIに外部キャッシュなし、決済代行2＝本APIに決済代行・外部決済なし、転送再連携1＝本APIに転送・再連携なし）／IT-33 5（外部取引・自動加算・実数更新・売上返品・連携エラー＝いずれも外部決済/外部連携由来で本APIに該当処理なし。本APIは数量・金額を更新しない）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 正本md本文（副作用節・DBカラム節・処理フロー#4）から、母集合38行に対応行を持たない補完ケースを追加した。母集合集計には算入せず別管理する。本APIはブラウザ向け画面を持たないため、DB更新副作用は管理画面表示でなく永続化先テーブル `dtb_otc_buy_order` のDB副作用照合で観測し、自動化(UI)は0とする。内訳＝自動化(API/統合) 3（120 identification_id更新・121 member_id更新・123 3列のみ更新／他項目不変＝IT-26）／手動・要実機 2（122 update_date現在時刻＝IT-26、150 保存例外→500＝IT-05）。既存IT casesの対象外観点表がDB更新（IT-26/IT-05）を「本機能に更新処理がないため」と誤除外していたため、上位オラクル（正本md 副作用節「DB更新。参照のみではない」・DBカラム節）に照らして補正した（付帯表4#6）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 020（成功）/021（欠落401）/023（署名不正401） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001 |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 041（異常パラメータ＝マスタ非存在証明書ID） |
| 006 | IT-32 | リクエスト | 手動（要実機確認） | 009（想定外項目＝正本mdに未定義項目の許容/無視仕様が無く固定期待にできず仕様化待ち） |
| 007 | IT-19 | 同時実行数の制限 | 手動（要実機確認） | 060（排他制御なし・後勝ち・並行送信実再現） |
| 008 | IT-10 | エラー | 自動化(API/統合) | 040（identification未指定→400 errors） |
| 009 | IT-10 | エラー(複数単項目バリ一括返却) | 対象外 | 本APIは単一項目`identification`のみで複数エラー本文の一括送出を持たないため |
| 010 | IT-10 | エラー(複数単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 本機能に相関（クロス項目）バリデーション該当処理が無いため |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上＋ソート順を持たない |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | DB照合は証明書ID存在の単一照合で、複数エラーの一括返却を持たないため |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上＋ソート順を持たない |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 061（タイムアウト実再現） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン依存の挙動定義が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 自動化(API/統合) | 050（更新対象外データ・他列不変。一次オラクル＝API応答＋DB副作用照合） |
| 018 | IT-33 | エラー | 自動化(API/統合) | 051（証明書ID不正時部分更新なし。一次オラクル＝API応答＋DB副作用照合） |
| 019 | IT-33 | 外部取引 | 対象外 | 外部取引由来の加減算処理が本APIに無いため（本APIは数量・金額を更新しない） |
| 020 | IT-33 | 自動加算 | 対象外 | 外部連携由来の自動加算処理が本APIに無いため |
| 021 | IT-33 | 実数更新 | 対象外 | 外部連携由来の実数更新処理が本APIに無いため |
| 022 | IT-33 | 売上・返品 | 対象外 | 外部連携の売上減算/返品加算処理が本APIに無いため |
| 023 | IT-33 | 連携エラー | 対象外 | 外部連携（連携元・連携先双方更新）が本APIに無いため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004（成功レスポンス本文） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 042（証明書ID不正→400。実装404の可能性は付帯表4#2） |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 005 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 006 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本APIに外部キャッシュの参照/判定処理が無いため |
| 029 | IT-10 | 障害(外部キャッシュ接続障害) | 対象外 | 本APIに外部キャッシュの接続/フォールバック処理が無いため |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 041（マスタ非存在証明書ID→400） |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 043（identification必須） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 007 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 030（対象受注なし→404） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本APIに決済代行・外部決済サービス連携が無いため |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 008（証明書IDマスタ存在検証通過で更新成功） |
| 037 | IT-10 | 重複・順序(認証方式JWT) | 自動化(API/統合) | 022（JWTで管理者特定・該当なし401） |
| 038 | IT-10 | 部分失敗(転送再連携) | 対象外 | 本APIに外部通知/外部取得結果の転送・再連携が無いため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 18（001,002,003,004,005,008,017,018,024,025,026,027,030,031,032,033,036,037）／手動・要実機 3（006,007,015）／対象外 17（009,010,011,012,013,014,016,019,020,021,022,023,028,029,034,035,038）。**未分類 0**（母集合38行）。母集合外の設計書補完ケース（120,121,123＝IT-26・122＝IT-26・150＝IT-05）は別管理で母集合集計を変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A06-13-JWT-ADMIN | dtb_member（更新担当者）／jwt-token | 有効な管理者会員1。利用者IDが当該会員に紐づくHS256署名のjwt-tokenを供給（トークン原値・署名シークレットは環境変数で供給しログ/設計に書かない）。021/022/023用に「ヘッダ欠落」「該当会員なし」「署名不正」のトークン状態を別途用意 | fixture／env（JWT発行は a06-01 買取アプリ用ログインAPI またはenv供給。`pf-api`方針に依存する署名検証は要実機確認） | 専用会員・撤去可。トークンは使い捨て | 021/030（JWT-ADMIN未適用＝欠落）以外の全API/統合ケース |
| SEED-A06-13-ORDER | dtb_otc_buy_order（更新前の本人確認・担当者・日時が既知） | 既知IDの店頭買取受注1件。更新前の identification_id・member_id・update_date が既知。別受注1件（区分整合050用） | fixture／migration | 専用受注・テスト毎に初期状態へ復元してべき等化。更新系（120-123等）は実行前にリセット | 030以外の全更新ケース |
| SEED-A06-13-IDENT-MTB | mtb_identification（id・name） | 本人確認証明書マスタに存在する証明書ID1件以上。041/042用にマスタ非存在となるID（範囲外）を確定。060用に異なる証明書ID2件 | fixture（既定マスタ） | 既存利用・撤去不要 | 証明書ID指定/検証の全ケース |
| SEED-A06-13-PAYLOAD | リクエストボディ（synthetic） | 正本md入出力節準拠の最小ボディ（identification＝フォーム値・integer）。正常/未指定/マスタ非存在/想定外項目のバリエーション | synthetic（正本md由来。買取アプリ実環境は使わない） | テスト内生成・後始末不要。記載フィールドのみ、未記載は要実機確認コメント | 全送信ケース |
| SEED-M01-ADMIN | dtb_member（管理者） | DB副作用照合の基準・整合に用いる有効な管理者会員1（ID/PWは config 既定。2FA OFF）。本APIは画面を持たず、副作用は永続化先テーブルを直接DB照合して観測するため画面閲覧は行わない | fixture（config既定） | 既存利用・撤去不要 | 050,051,120-123（DB副作用観測） |

注: ペイロードは正本md入出力節記載のフィールド（identification）のみで最小構成し、買取アプリ（MTGバイヤー）実環境は使わない。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（dtb_otc_buy_order の identification_id／member_id／update_date、mtb_identification の id／name。現行スキーマの保存列差異は要確認＝正本mdリニューアル移行表）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。JWTトークン・署名シークレットは環境変数で供給し原値を書かない（正本md ログ・監査節「ログに出してはいけないもの」）。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md・観点表・基本設計）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /admin/otcBuyOrder/{id}/identification`（正本md 利用者視点の入口。.json 別名あり） | `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json' ...)]`（OtcBuyOrderController.php:273）＋既定 `api/v1`（eccube.yaml:55）＝実効 `/api/v1/admin/otcBuyOrder/{id}/identification.json` | **正本md「利用者視点の入口」パスは `/api/v1` プレフィクスを欠き実装と不一致**（移行表は移行先に `/{api_v1_route}` を記載）。テストは実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 証明書IDが本人確認証明書マスタに存在しない場合は入力不正＝HTTP 400（正本md レスポンス(失敗)・バリデーション節・エラー処理節） | マスタ非存在は `NotFoundException('正しい証明書IDを入力してください')`（OtcBuyOrderController.php:288-291）＝`Response::HTTP_NOT_FOUND`(404)（NotFoundException.php:31） | **証明書IDマスタ非存在時のHTTPステータスが仕様400と実装404で食い違う**。テストは仕様の400で判定し落とす（実機の実ステータスは要確認） | 041,042 | 不具合候補(ステータス乖離 400/404) |
| 3 | 失敗時の本文は 400＝`{code, errors}`（errors=「正しい証明書IDを入力してください」）（正本md レスポンス(失敗) 131行） | 例外は `BaseApiException`（メッセージ保持・statusCode＝MissingRequiredParameterException 400／NotFoundException 404／UnauthenticatedException 401）。400本文の `{code, errors}` 整形は共通例外リスナー依存 | **400失敗本文の `{code, errors}` 整形は共通例外リスナーの実装に依存し未確認**。テストは仕様の本文形で判定（要実機確認） | 040,041,043 | 要確認(失敗本文の整形) |
| 4 | 判定順序は #1 トークン検証(401)→#2 受注取得(404)→#3 証明書ID検証(400)→#4 保存（正本md 処理フロー） | コントローラ内は #1 受注取得(276)→#2 証明書ID未指定(281)/マスタ(288)→#3 `getUser()`(293)の順。認証は firewall `^/api/v1/`（security.yaml:33-39）が先行拒否（401） | **コントローラ内の `getUser()` ガードは末尾だが、認証はfirewallが先行するため未認証は受注取得前に401となり仕様判定順序#1と整合**。受注なしより前にトークン検証が走るかの確定は要実機確認 | 020,021,022,023,030 | 要確認(判定順序＝firewall先行) |
| 5 | 認証方式は `jwt-token` ヘッダのJWT・署名方式HS256（正本md 認証・認可節） | firewall app の access_token＋`JwtTokenHeaderExtractor`（security.yaml:33-39）。抽出するヘッダ名・HS256署名検証の実方式は実装で要確認 | **`jwt-token` ヘッダ名・HS256署名検証の実方式が実装で未確認**。テストは「資格情報を満たさないと401」を仕様で判定 | 020,021,022,023 | 要確認(認証ヘッダ名・署名方式) |
| 6 | 正本md・実装にDB更新（副作用節「DB更新。参照のみではない」・DBカラム節の identification_id／member_id／update_date 更新）が存在 | 既存IT cases 対象外観点表が「データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26）…本機能に更新処理がないため」等と記載 | **既存IT cases（観点表側）がDB更新を誤って対象外にしている**。上位オラクル（正本md 副作用節・DBカラム節）に照らし補正し、IT-26/IT-05を設計書補完ケースで網羅 | 120,121,122,123,150 | 不具合候補(観点表の誤分類) |
| 7 | 本人確認証明書・更新担当者・更新日時の3列のみを更新する（正本md データ整合性 更新範囲・リニューアル移行表） | `UpdateIdentificationAction`（OtcBuyOrderController.php:299／UpdateIdentificationInput(OtcBuyOrder, Member, Identification)）。実更新列の範囲（他項目・ステータスの不変）は Action 実装で要確認 | 更新が3列に限定されること（他項目・ステータスを変更しない）は Action 実装の確認待ち。テストは仕様（3列のみ更新）で判定 | 050,123 | 要確認(更新列範囲) |
| 8 | 401（トークン欠落・署名不正・該当会員なし）・404（受注なし）の失敗応答は本文を持たない（空）（正本md レスポンス(失敗) 129-130行） | 共通例外リスナーが `BaseApiException`（UnauthenticatedException 401／NotFoundException 404）を捕捉し常に `{code, errors}` 形のJSON本文を返す | **401/404の「本文なし」仕様に対し実装の共通例外リスナーは常に `{code, errors}` 本文を返すため仕様乖離**。テストは仕様どおり「応答本文を持たない（空）」で判定し、実装が本文を返せば落ちて検出 | 021,030 | 不具合候補(本文なし仕様乖離) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（受注IDで特定し本人確認証明書・更新担当者・更新日時を保存） | 正常更新の成功応答 | 001,002,008 | カバー |
| 利用者視点の入口（`PUT /admin/otcBuyOrder/{id}/identification`・成功時code200） | 実効パスへの送信・成功code200 | 001,004,007 | カバー（付帯表4#1でパス乖離記録） |
| 認証・認可（jwt-token/HS256・401・更新担当者記録） | 有効JWTで成功・欠落/署名不正/該当なしで401・更新担当者=認証会員 | 020,021,022,023,121 | カバー（HS256実方式・ヘッダ名は要実機＝付帯表4#5） |
| 処理フロー#1（トークン検証→管理者特定・401） | 認証拒否（欠落/署名不正/該当なし） | 021,022,023 | カバー（firewall先行＝付帯表4#4） |
| 処理フロー#2（受注IDで取得・該当なし404） | 対象なし404 | 030 | カバー |
| 処理フロー#3（証明書IDでマスタを引く・該当なし400 errors） | 証明書ID未指定/マスタ非存在で400・errors | 040,041,042,043 | カバー（マスタ非存在の実装404は付帯表4#2。期待は仕様400） |
| 処理フロー#4（本人確認証明書設定・更新担当者・更新日時を保存） | 3列のDB更新副作用 | 120,121,122,123 | カバー（122 update_dateは手動/間接・要実機） |
| 処理フロー#5・レスポンス(成功)（code200のJSON） | 成功レスポンス書式 | 003,004,005,006,007 | カバー |
| 入出力・バリデーション節（identification必須・マスタ存在のみ受付・未指定/非存在は400） | identification必須・マスタ存在検証・各エラー | 008,040,041,043 | カバー |
| 副作用節（本人確認証明書・更新担当者・更新日時を更新＝DB更新・参照のみでない） | DB更新副作用のDB照合/間接観測 | 120,121,122,123 | カバー（一部手動/要実機） |
| DBカラム節（identification_id／member_id／update_date／mtb_identification.id） | 各列の更新・証明書ID存在確認 | 120,121,122,008 | カバー |
| データ整合性（参照時点・更新範囲＝3列のみ・同時更新は排他なし後勝ち） | 3列のみ更新・他項目不変・後勝ち | 123,050,060 | カバー（060は手動/要実機。更新列範囲は付帯表4#7） |
| エラー処理（401/404/400/保存例外→500相当・401/404は本文なし） | 各エラー応答・401/404の本文なし・保存例外で部分更新なし | 021,030,040,051,150 | カバー（150は手動/要実機。401/404本文なしの実装乖離は付帯表4#8） |
| 権限・認可（認証済み更新可・未認証/トークン不正401） | 認証成功/失敗 | 020,021 | カバー |
| 排他制御・トランザクション（ロックなし・後勝ち） | 同時更新の片側更新なし | 060 | カバー（手動/要実機） |
| 同時実行数の制限（IT-19） | 並行更新の整合 | 060 | カバー（手動/要実機） |
| タイムアウト（IT-10） | 仕様どおりの応答・部分更新なし | 061,150 | カバー（手動/要実機） |
| 複数バリデーションの一括返却・ソート順・相関バリ（IT-10細目） | （該当処理なし） | （対象外） | 対象外（本機能は単一項目`identification`のみで複数エラー一括返却・ソート順・相関バリを持たない） |
| 外部キャッシュ・決済代行・転送再連携・外部取引/売上返品/自動加算/実数更新/連携エラー（IT-10/IT-33細目） | （該当処理なし） | （対象外） | 対象外（本APIに外部キャッシュ/決済/外部連携由来の加減算が無く、数量・金額を更新しない） |
| バージョニング（IT-32） | （定義なし） | （対象外） | 対象外（正典にAPIバージョン依存の挙動定義なし） |
| ログ・監査（ログに出してはいけないもの＝JWT原値・署名シークレット・Cookie・個人情報） | 機密値の非出力 | （対象外＝サーバログ実機観測） | 対象外（API応答に現れず。サーバログ実機観測は本E2E範囲外。SEEDで原値を環境変数供給し設計/ログに書かない方針を反映） |

未カバーはいずれも理由（本APIは単一項目`identification`のみで複数バリデーション一括返却/ソート順/相関バリを持たない・正典にバージョン依存挙動の定義なし・本APIに外部キャッシュ/決済/外部連携由来処理なしで数量金額を更新しない・アプリログ機密値抑止はサーバログ実機観測で本E2E範囲外。並行送信/タイムアウト/保存例外/update_date確定判定は要実機）を明記済み。正本mdの各節（処理フロー#1-5・バリデーション・副作用・DBカラム・データ整合性・エラー処理）はAPI/統合レイヤ（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）へ写像し、正常×異常の対（更新成功001/008/020 ↔ 認証失敗021/022/023・対象なし030・証明書ID不正040/041/043・部分更新なし051）を揃えた。
