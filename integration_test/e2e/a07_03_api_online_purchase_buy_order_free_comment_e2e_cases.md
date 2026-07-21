# A07-03（オンライン仕入_買取注文フリーコメント） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a07-03_api_online_purchase_buy_order_free_comment.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a07-03_api_online_purchase_buy_order_free_comment.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a07_03_api_online_purchase_buy_order_free_comment_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わない機能仕様（JWT認証付きのネット買取受注フリーコメント更新API＝PUTで更新する更新系API）であり、**両レイヤで網羅**する。API/統合レイヤ＝Playwright `request` で当該エンドポイントへPUT送信し、HTTPステータス・レスポンス本文（`{code}`／`{code, errors}`）・更新成否で判定。UIレイヤ＝更新結果が管理画面（買取管理＝ネット買取受注の編集画面のフリーコメント（メモ）表示・受注他項目の不変）に現れる範囲をブラウザで観測して判定。

**期待結果は仕様（正本md＝pf-apiリバース／観点表／基本設計）由来**とし、実装のレスポンス形・例外クラスの既定挙動・HTTPライブラリ既定値・Form制約を期待値に流用しない（オラクル独立性）。**pf-apiリバースを基本設計・観点表を上位オラクル**とし、乖離は付帯表4に出す。実装（ec-cube-enterprise）からは位置情報（APIパス・メソッド・認証方式・セレクタ）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。送信先パスは実装の実効パスに統一し（テストが実在経路へ届くため）、設計パスとの差異は付帯表4でのみ管理する。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（JWT認証）・受信検証・必須条件（free_comment）・想定外項目・レスポンス本文・データなし（該当受注なし404）。バージョニングは正典にAPIバージョン依存挙動の定義が無く対象外 |
| IT-09 | 正常更新のHTTPステータス・実行結果・リクエスト正常。外部取得は本APIが外部取得を行わないため対象外 |
| IT-19 | 同時実行数の制限。本APIは排他制御を持たず後勝ちのため、エラー前提の観点は対象外（後勝ち挙動は手動補完） |
| IT-10 | HTTPステータス・通信・正常／異常系・エラー（free_comment未指定400・該当なし404・認証拒否401）・更新担当者記録・タイムアウト。複数バリデーション一括返却／ソート順・外部キャッシュ・決済代行・転送再連携は本機能に非該当で対象外 |
| IT-33 | 数量・金額・在庫・外部連携・履歴の更新は本APIに無く（金額・税・ポイント・在庫の再計算を行わない）すべて対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-001	IT-32	資格情報	P1	有効JWTで認証通過しコメント更新が成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	"有効なjwt-tokenヘッダ
free_comment=任意の文字列
path id=既存のネット買取受注ID"	"1. 当該エンドポイントへPUT送信する
2. HTTPステータスとレスポンスを確認する"	認証が通過し、HTTP200（成功）が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-002	IT-09	リクエスト	P3	正常パラメータでコメント更新が成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. レスポンスと後続状態を確認する"	正常なパラメータ値での実行結果がHTTP200（code:200）で処理結果と一致すること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-003	IT-09	実行結果	P3	更新成功の実行結果がレスポンスと一致する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. レスポンスと後続状態を確認する"	更新成功の実行結果としてレスポンス本文が code:200 で処理結果と一致すること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-004	IT-09	HTTPステータス	P3	正常更新時のHTTPステータスが成功と一致する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. HTTPステータスを確認する"	正常更新時のHTTPステータスが200であること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-005	IT-10	正常	P2	対象条件に該当する正常値で成功応答する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	対象条件に該当する正常なfree_comment	"1. 当該エンドポイントへPUT送信する
2. HTTPステータスとレスポンスを確認する"	対象条件に該当する正常値でHTTP200（code:200）が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-006	IT-10	通信	P1	正常通信で成功応答が返る	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200であること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-007	IT-10	HTTPステータス	P1	正常時のHTTPステータスが成功と一致する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. HTTPステータスを確認する"	正常時のHTTPステータスが200であること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-008	IT-32	レスポンス	P3	成功レスポンス本文が仕様の形と一致する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なid・free_comment・jwt-token	"1. 当該エンドポイントへPUT送信する
2. レスポンス本文を確認する"	成功時のレスポンス本文が `{code:200}`（codeフィールドはinteger・200）であること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-009	IT-32	必須条件	P3	free_comment指定ありで成功応答する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	free_comment=非null文字列・jwt-token	"1. free_commentを指定してPUT送信する
2. HTTPステータスを確認する"	必須項目free_commentを指定して送信するとHTTP200（code:200）が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-010	IT-09	実行結果	P1	空コメント受注へ新規コメント登録で成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER-EMPTY	"フリーコメント未設定の受注ID
free_comment=新規コメント"	"1. 空コメント受注へfree_commentを指定してPUT送信する
2. HTTPステータスを確認する"	新規コメント登録としてHTTP200（code:200）が返ること（登録値のUI反映は E2E-A07-03-040 で確認）。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-011	IT-10	正常	P1	既存コメントの上書き更新で成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER-FILLED	"フリーコメント設定済の受注ID
free_comment=別の値"	"1. 既存コメント受注へ別値のfree_commentを指定してPUT送信する
2. HTTPステータスを確認する"	既存コメントの上書き更新としてHTTP200（code:200）が返ること（上書き値のUI反映は E2E-A07-03-040 で確認）。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-012	IT-10	正常	P2	空文字コメントは入力不正とならず成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	"free_comment=空文字（""""・非null）"	"1. free_comment=空文字でPUT送信する
2. HTTPステータスを確認する"	空文字はpf-api側で入力不正と判定せず、HTTP200（code:200）が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-013	IT-10	正常	P2	最大長相当の長大コメントもAPIは上限判定せず成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	free_comment=長大な文字列（最大長相当）	"1. 長大なfree_commentでPUT送信する
2. HTTPステータスを確認する"	文字数の上限はpf-api側で判定せず、HTTP200（code:200）が返ること（DBカラム長を超える場合の挙動は付帯表4#7・要実機確認）。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-014	IT-32	リクエスト	P3	想定外項目を加えてもfree_commentのみ反映され成功する	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	正常なfree_commentに想定外の項目（項目名と値のセット）を追加	"1. 想定外項目を含むボディでPUT送信する
2. HTTPステータスを確認する"	想定外項目があってもエラーで停止せずHTTP200（code:200）が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-020	IT-32	受信検証	P1	jwt-tokenヘッダ欠落で認証拒否となる	SEED-A07-03-NET-ORDER	jwt-tokenヘッダなし・free_comment=任意	"1. jwt-tokenヘッダを付けずにPUT送信する
2. HTTPステータスを確認する"	受信検証（認証）に失敗し、認証拒否のHTTP401が返り、応答本文を持たない（空）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-021	IT-32	資格情報	P1	署名不正JWTで認証拒否となる	SEED-A07-03-NET-ORDER	署名不正のjwt-tokenヘッダ・free_comment=任意	"1. 署名不正のjwt-tokenでPUT送信する
2. HTTPステータスを確認する"	署名検証に失敗し、認証拒否のHTTP401が返り、応答本文を持たない（空）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-022	IT-32	資格情報	P2	該当する管理者会員なしのJWTで認証拒否となる	SEED-A07-03-NET-ORDER	署名は正当だが該当管理者会員が存在しない利用者IDのjwt-token	"1. 該当会員なしのjwt-tokenでPUT送信する
2. HTTPステータスを確認する"	ペイロードの利用者IDから管理者会員を引けず、認証拒否のHTTP401が返り、応答本文を持たない（空）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-023	IT-10	異常系	P2	異常リクエストで異常応答が返る	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	異常なリクエスト（不正な認証・該当なしid・必須欠落のいずれか）	"1. 異常リクエストでPUT送信する
2. HTTPステータスを確認する"	HTTPステータスが異常を示す4xx（401／404／400のいずれか仕様分岐どおり）であり、401・404は応答本文を持たない（空）・400は `{code, errors}` を返すこと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-030	IT-32	リクエスト	P3	非該当ID（異常パラメータ）で該当なしとなる	SEED-A07-03-AUTH-MEMBER	有効jwt-token・存在しない受注ID・free_comment=任意	"1. 非該当IDでPUT送信する
2. HTTPステータスを確認する"	受注IDに該当するネット買取受注が無く、該当なしのHTTP404が返り、応答本文を持たない（空）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-031	IT-32	データなし	P3	該当受注なしIDで該当なし応答となる	SEED-A07-03-AUTH-MEMBER	有効jwt-token・対象データが存在しない受注ID	"1. 該当受注なしIDでPUT送信する
2. HTTPステータスを確認する"	該当するネット買取受注が無い場合にHTTP404が返り、応答本文を持たない（空）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-032	IT-10	エラー	P2	free_comment未指定で入力不正となる	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	有効jwt-token・free_comment未指定（null）	"1. free_commentを送らずにPUT送信する
2. HTTPステータスを確認する"	コメント未指定（null）で入力不正のHTTP400が返ること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-033	IT-10	エラー	P2	free_comment未指定でエラーメッセージが返る	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	有効jwt-token・free_comment未指定（null）	"1. free_commentを送らずにPUT送信する
2. レスポンス本文のerrorsを確認する"	HTTP400のレスポンス本文 `{code, errors}` の errors に「コメントを入力してください」が含まれること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-040	IT-09	実行結果	P2	更新後に管理画面詳細でフリーコメントが更新値で表示される	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER／SEED-M01-ADMIN	更新したfree_commentの値	"1. APIでfree_commentを更新する
2. 管理画面で当該ネット買取受注の編集画面を開く
3. フリーコメント（メモ）欄の値を確認する"	ネット買取受注編集画面のフリーコメント（メモ）欄に、APIで更新した値が表示されること。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-041	IT-10	正常	P2	更新後に受注のステータス・他項目が変更されない	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER／SEED-M01-ADMIN	更新前後の受注ステータス・他項目	"1. 更新前に管理画面詳細でステータス・他項目を控える
2. APIでfree_commentのみ更新する
3. 詳細を再表示しステータス・他項目を確認する"	更新により変わるのはフリーコメント（メモ）と更新担当者のみで、それ以外（受注ステータス・他項目）は更新前と一致して不変であること（実装の更新日時更新の扱いは付帯表4#6で別確認）。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-050	IT-10	重複・順序	P1	更新担当者として認証会員がdtb_member（id）で記録される	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	認証会員（既知のid）・free_comment=任意	"1. 既知の認証会員のjwt-tokenでfree_commentを更新する
2. 当該受注の更新担当者を確認する（DBまたは管理画面の更新者欄）"	更新担当者に、認証した管理者会員が dtb_member の id で記録されること（移行先で会員の主キー名がid・dtb_buy_order.member_id が参照）。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-051	IT-10	エラー	P3	タイムアウト時に仕様通りの挙動となる	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPUT送信する
2. 応答と更新状態を確認する"	タイムアウト時に未定義エラーで停止せず、仕様通りの応答が返り、フリーコメントが部分更新されないこと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-053	IT-10	エラー	P3	保存処理中の例外時に500応答とロールバックで更新が残らない	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	"有効jwt-token・free_comment=任意
保存処理（flush/commit）で例外を誘発するシナリオ"	"1. 保存処理中に例外を誘発して当該エンドポイントへPUT送信する
2. HTTPステータス・レスポンス本文・更新状態を確認する"	保存処理中の例外でHTTP500が返り、本文 `{code, errors}`（errorsは例外メッセージ）を持ち、トランザクションがロールバックされてフリーコメントが更新前から変化しない（更新なし）こと。				
a07-03_api_online_purchase_buy_order_free_comment（API_オンライン仕入_買取注文フリーコメント）	E2E-A07-03-052	IT-19	同時実行数の制限	P2	同一受注への同時更新は後勝ちとなる	SEED-A07-03-AUTH-MEMBER／SEED-A07-03-NET-ORDER	同一受注へ異なるfree_commentを並行PUT送信	"1. 同一受注へ2件のfree_comment更新をほぼ同時に送信する
2. 最終のフリーコメント値を確認する"	排他制御を持たず（楽観／悲観ロック対象なし）、後に確定した更新のfree_commentが最終値として残る（後勝ち）こと。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

実効エンドポイントは `PUT /api/v1/admin/buyOrder/{id}/freeComment.json`。根拠＝ルート `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}/freeComment.json', methods:['PUT'])]`（`src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:93`）＋ `eccube_api_v1_route` 既定値 `api/v1`（`app/config/eccube/packages/eccube.yaml:6,55`）。認証＝firewall `app`（pattern `^/api/v1/`・access_token・stateless:false・provider member_provider）（`app/config/eccube/packages/security.yaml:32-39`）＋ JWT抽出ヘッダ `jwt-token`（`src/Eccube/Security/AccessToken/JwtTokenHeaderExtractor.php:29`）＋ `JwtTokenHandler`（security.yaml:37）＋ クラスレベル `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderController.php:44）。判定順序（メソッド内）＝**free_comment=null→400（`MissingRequiredParameterException('コメントを入力してください')` :96-99／例外は400・errors付き MissingRequiredParameterException.php:30-31）→該当受注なし→404（`NotFoundException` :101-104）→getUser=null→401（`UnauthenticatedException` :106-109。ただし firewall 認証がメソッド実行に先行するため未認証は到達前に401）**。成功応答＝`new JsonResponse(['code'=>Response::HTTP_OK], 200)`（:120）。更新＝`setMemo()->setMember()->setUpdateDate()`＋flush/commit、失敗時rollback＋`RuntimeException`をコントローラが `InternalException`(500)へ隠蔽（`src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateFreeCommentAction.php:35-44`／BuyOrderController.php:116-117）。永続化先は `dtb_buy_order`（メモ列 `memo`・更新担当者 `member_id`）・更新担当者は `dtb_member`（`Member`／移行先で主キー名 id）。UI観測＝買取管理（ネット買取受注）編集画面のフリーコメント（メモ）欄 `form_widget(form.memo)`（`src/Eccube/Resource/template/admin/Purchase/detail.twig:349`・親div id `edit_purchase_info_box__memo` :348）／編集ルート `admin_purchase_edit` path `/%eccube_admin_route%/purchase/{id}/edit`（`src/Eccube/Controller/Admin/Purchase/PurchaseController.php:199`）。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（正本md節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A07-03-001 | E2E自動化(API/統合) | `PUT /api/v1/admin/buyOrder/{id}/freeComment.json`＋JWT認証（BuyOrderController.php:93／security.yaml:32-39／JwtTokenHeaderExtractor.php:29） | 認証・認可（正本md:67-72）・処理フロー#1／IT-32 | IT-A07-03-...-001 |
| E2E-A07-03-002/003/004 | E2E自動化(API/統合) | `PUT .../freeComment.json`（BuyOrderController.php:93）／成功応答 JsonResponse code:200（:120） | 処理フロー#5・レスポンス成功（正本md:110-116）／IT-09 | IT-A07-03-...-004,002,003 |
| E2E-A07-03-005/006/007 | E2E自動化(API/統合) | `PUT .../freeComment.json`（BuyOrderController.php:93） | 利用者視点の入口（正本md:55-61）・成功応答／IT-10 | IT-A07-03-...-027,026,025 |
| E2E-A07-03-008 | E2E自動化(API/統合) | 成功応答本文 `{code:200}`（JsonResponse BuyOrderController.php:120） | レスポンス（成功）code:integer・200（正本md:114-116）／IT-32 | IT-A07-03-...-032 |
| E2E-A07-03-009 | E2E自動化(API/統合) | free_comment必須（BuyOrderController.php:96-99） | バリデーション free_comment必須（正本md:107,149）・入出力／IT-32 | IT-A07-03-...-031 |
| E2E-A07-03-010 | E2E自動化(API/統合) | 更新 setMemo（UpdateFreeCommentAction.php:35）／成功応答（:120） | 処理フロー#4-5（指定値で更新し保存）・副作用DB更新（正本md:84,139）／IT-09補完 | （母集合外・正本md補完） |
| E2E-A07-03-011 | E2E自動化(API/統合) | 更新 setMemo 上書き（UpdateFreeCommentAction.php:35） | 業務ルール 更新方法（上書き）（正本md:94）・データ整合性 更新範囲（:159）／IT-10補完 | （母集合外・正本md補完） |
| E2E-A07-03-012/013 | E2E自動化(API/統合)（013は要実機確認: DBカラム長） | free_comment は null のみ400・空文字/長大は判定せず保存（BuyOrderController.php:96-99／UpdateFreeCommentAction.php:35） | バリデーション「空文字や文字数の上限はpf-api側では判定しない」（正本md:149）／IT-10補完 | （母集合外・正本md補完） |
| E2E-A07-03-014 | E2E自動化(API/統合) | free_comment のみ参照（BuyOrderController.php:96）・想定外項目は未参照 | データ整合性 更新範囲（メモと更新担当者のみ更新・正本md:159）／IT-32 | IT-A07-03-...-006 |
| E2E-A07-03-020 | E2E自動化(API/統合) | JWT欠落→firewall 401（security.yaml:32-39／JwtTokenHeaderExtractor.php:29） | 認証失敗時 401（ヘッダ欠落・正本md:70,122）・受信検証／IT-32 | IT-A07-03-...-036 |
| E2E-A07-03-021/022 | E2E自動化(API/統合)（要実機確認: 署名検証/会員解決の401経路） | JWT署名不正・会員なし→401（security.yaml:37 JwtTokenHandler／provider member_provider security.yaml:35） | 認証失敗時 401（署名不正・該当管理者会員なし・正本md:70,122）／IT-32 | （母集合外・正本md補完／母001資格情報と対） |
| E2E-A07-03-023 | E2E自動化(API/統合) | 異常分岐 400/404/401（BuyOrderController.php:98,103,108） | エラー処理（401/404/400・正本md:197-202）／IT-10 | IT-A07-03-...-030 |
| E2E-A07-03-030/031 | E2E自動化(API/統合) | 該当なし→404 NotFoundException（BuyOrderController.php:101-104） | 処理フロー#2・該当なし404（正本md:82,123,150）／IT-32 | IT-A07-03-...-005,033 |
| E2E-A07-03-032/033 | E2E自動化(API/統合) | free_comment=null→400＋errors（BuyOrderController.php:96-99／MissingRequiredParameterException.php:30-31） | 処理フロー#3・400「コメントを入力してください」（正本md:83,124,201）／IT-10 | IT-A07-03-...-008 |
| E2E-A07-03-040 | E2E自動化(UI) | 編集画面メモ欄 `form_widget(form.memo)`（Purchase/detail.twig:349／親div id `edit_purchase_info_box__memo` :348。textarea id末尾は要実機確認）／ルート admin_purchase_edit（PurchaseController.php:199） | 副作用 DB更新（メモ上書き・正本md:84,139,173）／IT-09補完 | （母集合外・正本md補完） |
| E2E-A07-03-041 | E2E自動化(UI) | 編集画面のステータス・他項目（Purchase/detail.twig・要実機確認: 対象項目セレクタ） | データ整合性 更新範囲「受注の他項目・ステータスは変更しない」（正本md:159）／IT-10補完 | （母集合外・正本md補完） |
| E2E-A07-03-050 | 手動（要実機確認・DB/画面の更新者欄） | 更新担当者 setMember（UpdateFreeCommentAction.php:36）／dtb_buy_order.member_id→dtb_member id（移行先・正本md:40,174）。更新者の画面表示有無は要実機確認 | 認可・更新担当者記録（正本md:71,84）・移行 member_id 参照先 id（:40）／IT-10 | IT-A07-03-...-037 |
| E2E-A07-03-051 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理・データ整合性（部分更新を残さない・正本md:159,218）／IT-10 | IT-A07-03-...-015 |
| E2E-A07-03-053 | 手動（要実機確認・保存例外注入） | 保存処理（flush/commit）失敗→rollback＋RuntimeExceptionを `InternalException`(500)へ隠蔽（UpdateFreeCommentAction.php:35-44／BuyOrderController.php:116-117）。例外注入は外部依存（要実機確認） | エラー処理「保存処理中の例外→500・`{code, errors}`・ロールバック」（正本md:125,202）・副作用「例外時はロールバック」（:139）・データ整合性 更新範囲（更新を残さない:159）／IT-10 | （母集合外・正本md補完） |
| E2E-A07-03-052 | 手動（要実機確認・並行実行再現） | 排他制御なし＝楽観/悲観ロック対象を持たない（正本md:160,218。実装にロック注入なし UpdateFreeCommentAction.php:30-46） | 排他制御・トランザクション「後勝ち」（正本md:160,218）・同時更新（:160）／IT-19 | IT-A07-03-...-007（観点は対象外・後勝ち挙動を手動補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文で、決済代行・外部キャッシュ・数量金額・転送再連携など本機能に非該当の観点を多く含む）。本E2Eは正本md本文（利用者視点の入口・認証認可・処理フロー・バリデーション・エラー処理・データ整合性・排他制御）を一次情報源とし、非該当観点は付帯表2/2bで対象外に一元分類した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a07_03_..._it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報・受信検証・必須条件・想定外項目・レスポンス・データなしはHTTPステータス/レスポンスで観測可。バージョニングは正典にAPIバージョン依存挙動の定義が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 3 | 0 | 1 | 実行結果・HTTPステータス・リクエスト正常はAPI/統合。外部取得は本APIが外部取得を行わず対象外 |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 同時実行数の制限（エラー前提）は本APIが排他制御を持たず後勝ちで非該当＝対象外。後勝ち挙動は手動補完(052) |
| IT-10 | 18 | 0 | 5 | 2 | 11 | エラー(400/404/401)・HTTPステータス・通信・正常/異常系はAPI/統合(5)。更新担当者記録(037)・タイムアウト(015)は手動(2)。複数バリデーション一括返却/ソート順・外部キャッシュ・決済代行・転送再連携(11)は本機能に非該当で対象外 |
| IT-33 | 7 | 0 | 0 | 0 | 7 | 数量・金額・在庫・外部連携・履歴の更新は本APIに無く（金額/税/在庫の再計算を行わない・正本md:95）すべて対象外 |
| 合計 | 38 | 0 | 15 | 2 | 21 | **未分類 0** |

注1: 対象外21件の内訳＝IT-10(11: 複数バリデーション一括返却・ソート順 6／外部キャッシュ形式不正・障害 2／決済代行 正常系・異常系 2／転送再連携 部分失敗 1)＋IT-33(7: 数量/金額/外部連携/履歴の更新が本APIに無し)＋IT-32 バージョニング(1)＋IT-09 外部取得(1)＋IT-19 同時実行数の制限(1)。いずれも理由付きで放置ではない。

注2（母集合外・正本md補完ケース）: 正本md本文から母集合38行に対応行を持たない補完ケースを追加した（母集合集計には算入せず別管理）。内訳＝自動化(API/統合) 6（010 新規登録／011 上書き更新／012 空文字許容／013 最大長＝上限判定なし／021 署名不正401／022 会員なし401）／自動化(UI) 2（040 コメントUI反映／041 更新範囲限定）／手動 2（052 後勝ち／053 保存処理中例外→500・ロールバック）。

注3（母集合外・観点表DB操作=更新系の写像）: 正本mdが明示する「副作用 DB更新（メモ＝フリーコメント・更新担当者）」（正本md:84,139,159,173-174）は、観点表のDB操作=更新系（観点表 更新内容＝IT-26／更新実行結果＝IT-05。関連してDB操作 登録/更新＝IT-23）に対応する。当該更新系観点は本機能の既存IT cases（38行TSV）には生成行が無く、既存ITの『対象外観点』表で「本機能に更新処理がないため」と誤って対象外化されている（既存IT cases:120）。しかし本APIは `DtbBuyOrder` の `setMemo()`／`setMember()` で実更新を行う（UpdateFreeCommentAction.php:35-37、正本md DB操作 登録/更新:178-182）ため、当該DB更新観点は本機能に該当する。母集合38行には対応行を持たないので母集合集計外として別管理し、040（メモ列の更新がDB反映＝UI観測）・050（更新担当者列 member_id→dtb_member id の更新）へ写像してカバーする。よって本機能のDB操作=更新系は『母集合内では未生成＝既存ITで誤って対象外扱い』だが、正本md準拠の母集合外補完としてカバー済みであり、『更新系DB観点は未カバー0』の無条件主張は本注で是正する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 001（JWT認証通過） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 003 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 004 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 002 |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 030（非該当id→404） |
| 006 | IT-32 | リクエスト | 自動化(API/統合) | 014（想定外項目） |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 本APIは排他制御を持たず後勝ち（正本md:160,218）。エラー前提の観点は非該当（後勝ち挙動は手動補完052で確認） |
| 008 | IT-10 | エラー | 自動化(API/統合) | 032（free_comment未指定→400） |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本APIの入力検証はfree_comment必須(単一)のみで複数エラーの一括返却を持たない |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（複数エラーのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 本APIに相関バリデーションが無い |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 本APIにDB相関バリデーションが無い |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 051（タイムアウト実再現） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン依存挙動の定義が無く、バージョン依存挙動は創作になるため対象外（理由付き） |
| 017 | IT-33 | 区分整合 | 対象外 | 本APIは数量を区分別管理せず（金額/在庫の再計算なし・正本md:95） |
| 018 | IT-33 | エラー | 対象外 | 数量・金額・履歴の部分更新が本APIに無い |
| 019 | IT-33 | 外部取引 | 対象外 | 外部取引による加減算計算が本APIに無い |
| 020 | IT-33 | 自動加算 | 対象外 | 自動加算・連携元ID付き履歴が本APIに無い |
| 021 | IT-33 | 実数更新 | 対象外 | 実数更新・履歴反映が本APIに無い |
| 022 | IT-33 | 売上・返品 | 対象外 | 売上/返品の数量金額更新が本APIに無い |
| 023 | IT-33 | 連携エラー | 対象外 | 外部連携・連携元/先の数量金額更新が本APIに無い |
| 024 | IT-09 | 外部取得 | 対象外 | 本APIは外部取得を行わない（受注の更新のみ） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 007 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 006 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 005 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本APIは外部キャッシュを持たない |
| 029 | IT-10 | 障害(外部キャッシュ) | 対象外 | 同上（外部キャッシュ接続障害が非該当） |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 023 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 009 |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 008 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 031（該当受注なし→404） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本APIは決済代行・外部決済を扱わない |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 020（JWT欠落→401） |
| 037 | IT-10 | 重複・順序(更新担当者=dtb_member id) | 手動（要実機確認） | 050（更新担当者がdtb_member idで記録） |
| 038 | IT-10 | 部分失敗(転送再連携) | 対象外 | 本APIは外部への転送・再連携を持たない |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 15（001,002,003,004,005,006,008,025,026,027,030,031,032,033,036）／手動 2（015,037）／対象外 21（007,009,010,011,012,013,014,016,017,018,019,020,021,022,023,024,028,029,034,035,038）。**未分類 0**（母集合38行）。母集合外の正本md補完ケースは別管理（010,011,012,013,021,022=自動化(API/統合)／040,041=自動化(UI)／052,053=手動）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A07-03-AUTH-MEMBER | dtb_member（管理者）／JWT資格情報 | 買取アプリ用JWTで認証可能な有効な管理者会員1（jwt-tokenのペイロード利用者IDから引ける）。署名シークレット（auth_magic）は環境変数で供給し原値を書かない | fixture／env（環境ガード `test.skip`） | 専用会員・撤去可。020/021/022 は本トークンを欠落/署名不正/会員なしに差し替えて異常系を再現 | 001-014,023,030-033,040,041,050,051,052,053 |
| SEED-A07-03-NET-ORDER | dtb_buy_order（ネット買取受注） | 更新対象のネット買取受注1（既存の受注ID。メモ＝フリーコメント任意・受注ステータスは更新範囲確認のため既知） | fixture／migration | 専用受注・更新前値へ復元してべき等化。更新系(010-013,040,041,050,052)はテスト毎にリセット | 001-009,012-014,020-023,032,033,040,041,050,051,052,053 |
| SEED-A07-03-NET-ORDER-EMPTY | dtb_buy_order（メモ未設定） | メモ（フリーコメント）が空（未設定）のネット買取受注1 | fixture／migration | 専用受注・空へ復元してべき等化 | 010（新規登録） |
| SEED-A07-03-NET-ORDER-FILLED | dtb_buy_order（メモ設定済） | 既定のメモ（フリーコメント）が設定済のネット買取受注1 | fixture／migration | 専用受注・既定値へ復元してべき等化 | 011（上書き更新） |
| SEED-A07-03-PAYLOAD | リクエストボディ（synthetic） | 正本md入出力準拠の最小ボディ（path id・free_comment フォーム値・jwt-tokenヘッダ）。空文字／長大／想定外項目追加／null未指定のバリエーション | synthetic（正本md:102-108由来。トークン原値・シークレットは書かない） | テスト内生成・後始末不要。値は正本md記載フィールドのみ、未記載は要実機確認 | 全送信ケース |
| SEED-M01-ADMIN | dtb_member（管理者・管理画面ログイン） | ネット買取受注（買取管理）編集画面を閲覧する有効な管理者1（ID/PWは config 既定。2FA OFF） | fixture（config既定） | 既存利用・撤去不要 | 040,041（UI観測） |

注: JWT資格情報（jwt-tokenヘッダ・署名シークレット auth_magic）は環境変数で供給し、正本md・ログに原値を書かない（正本md ログ・監査:206-212）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_buy_order`／メモ列 `memo`／更新担当者 `member_id`→`dtb_member` id）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md＝pf-apiリバース／観点表／基本設計）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /admin/buyOrder/{id}/freeComment.json`（`.json`付きのみ・拡張子なし別名は存在しない）（正本md:57-61） | ルート `'/%eccube_api_v1_route%/admin/buyOrder/{id}/freeComment.json'`（BuyOrderController.php:93）＋既定 `api/v1`（eccube.yaml:6,55）＝実効 `PUT /api/v1/admin/buyOrder/{id}/freeComment.json` | **正本mdのパスに `/api/v1` プレフィックスが明記されない**（移行先はAPIバージョンルート配下と正本md:41が示すのみ）。テストは実装の実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 認証方式: `jwt-token`ヘッダのJWTをHS256で検証し利用者IDから管理者会員を引く（正本md:69） | firewall `app` access_token＋`JwtTokenHandler`（security.yaml:37）＋`JwtTokenHeaderExtractor` HEADER_NAME `jwt-token`（:29）＋provider member_provider（security.yaml:35） | ヘッダ名・JWT・会員解決は整合。**署名方式HS256の具体は実装側で要確認** | 001,020,021,022 | 要確認(署名方式HS256) |
| 3 | 認証失敗時 HTTP401（ヘッダ欠落・署名不正・該当管理者会員なし／本文を持たない）（正本md:70,122） | 未認証は firewall が拒否（access_token・stateless:false security.yaml:32-39）。メソッド内 `UnauthenticatedException`→401（:108, BaseApiException errors付き UnauthenticatedException.php:30-31） | **firewallの未認証応答ステータス（401/403）と本文有無は要実機確認**。正本mdは401・本文なしを定めるが実装の例外応答は errors 本文を持つ可能性 | 020,021,022 | 要確認(401応答・本文) |
| 4 | 該当なし HTTP404（本文を持たない）（正本md:123,150） | `NotFoundException('買取情報が見つかりません')`→404＋errors本文（BuyOrderController.php:103／NotFoundException.php:30-31） | **正本mdは404本文なし、実装は errors（メッセージ）本文を返す**。テストはHTTP404を仕様で判定し、本文有無の差異を記録 | 030,031 | 要確認(404応答書式) |
| 5 | コメント未指定 HTTP400・本文 `{code, errors}`（errors=「コメントを入力してください」）（正本md:107,124,201） | `MissingRequiredParameterException('コメントを入力してください')`→400・errors:[message]（BuyOrderController.php:96-99／MissingRequiredParameterException.php:30-31） | メッセージ・400は整合。レスポンス本文の `code` 同梱有無は要実機確認（実装の例外→JSON整形を確認） | 032,033 | 要確認(400本文 code同梱) |
| 6 | 更新する列はメモ（フリーコメント）・更新担当者のみ（正本md:159,173-174） | `setMemo()->setMember()->setUpdateDate(new \DateTime())`（UpdateFreeCommentAction.php:35-37） | **実装は更新日時(updateDate)も更新する**が正本mdのDBカラム節は更新日時を列挙しない。更新範囲（他項目・ステータス不変）はテストで担保し、更新日時更新の扱いは要確認 | 041,050 | 要確認(更新日時の更新) |
| 7 | 文字数の上限はpf-api側で判定しない（空文字・長大も入力不正としない）（正本md:149） | free_comment は null のみ400、それ以外はそのまま保存（BuyOrderController.php:96-99／UpdateFreeCommentAction.php:35） | API層は上限判定しないが、**DBカラム長（memo）を超える長大コメントの保存可否はDB制約に依存＝要実機確認**。テストはAPIが上限で400を返さないことを仕様で判定 | 013 | 要確認(DBカラム長) |
| 8 | 判定順序: ①認証(401)→②該当なし(404)→③コメント未指定(400)（正本md:79-85 処理フロー1-3） | メソッド内は **①未指定400(:96-99)→②該当なし404(:101-104)→③getUser=null 401(:106-109)** の順（firewall認証はメソッド実行に先行 IsGranted BuyOrderController.php:44）。**正本mdは②該当なし(404)が③未指定(400)より先だが、実装は未指定(400)を先に判定する** | **未認証は firewall で先に401となり正本mdの「認証が最初」と整合。ただし実装は「コメント未指定(400)」を「該当なし(404)」より先に判定しており、正本md処理フロー（受注特定→コメント検証）と順序が逆**。コメント欠落かつ該当なしIDの同時送信時、正本mdは404・実装は400となる差異あり。テストは各分岐を単一変数で独立検証し（030-033は他条件正常）本順序差異を記録。判定順序の最終挙動は要実機確認 | 020,023,030,032 | **不具合候補(判定順序: 400と404の前後逆転)** |
| 9 | 排他制御を持たず同一受注の同時更新は後勝ち（楽観/悲観ロック対象なし）（正本md:160,218） | `UpdateFreeCommentAction::handle` はトランザクションのみでロック取得なし（UpdateFreeCommentAction.php:30-46） | 整合。後勝ちの実挙動（並行実行の確定順）は要実機確認 | 052 | 要確認(後勝ち実挙動) |

## 付帯表5：設計書網羅マトリクス（正本md節→テストID・未カバーは理由付き）

| 正本mdの節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（PUT /admin/buyOrder/{id}/freeComment.json・.json付きのみ） | 実効パスへのPUT・成功応答 | 001,002,005,006 | カバー（パス差異は付帯表4#1） |
| 認証・認可（jwt-token・HS256・401） | 認証通過／欠落401／署名不正401／会員なし401 | 001,020,021,022 | カバー（署名方式は付帯表4#2） |
| 処理フロー#1（トークン検証・401） | 認証拒否 | 020,021,022 | カバー |
| 処理フロー#2（受注特定・404） | 非該当id/該当なし404 | 030,031 | カバー（判定順序差は付帯表4#8） |
| 処理フロー#3（コメント未指定・400） | free_comment=null→400・メッセージ | 032,033 | カバー（判定順序差は付帯表4#8） |
| 処理フロー#4-5（指定値で更新・更新担当者設定・保存・code200） | 新規登録／上書き更新／成功応答 | 010,011,003,004 | カバー（UI反映040・担当者050） |
| 入出力 リクエスト（id/free_comment/jwt-token・必須） | 必須項目指定／想定外項目 | 009,014 | カバー |
| 入出力 レスポンス（成功 `{code:200}`／失敗 401/404/400） | 成功本文・異常応答 | 008,023 | カバー（本文書式差異は付帯表4#3-5） |
| バリデーション（free_comment必須・空文字/上限は判定しない） | 未指定400／空文字200／長大200 | 032,012,013 | カバー（DBカラム長は付帯表4#7） |
| エラー処理（401/404/400／500=保存例外） | 各エラー分岐 | 020,030,032,053 | カバー（500=保存例外は053で明示確認＝保存処理中の例外時にHTTP500・`{code, errors}`・ロールバックで更新が残らないこと。外部障害注入のため手動/要実機。タイムアウト051とは別ケース） |
| 副作用 DB更新（メモ・更新担当者）＝観点表 DB操作=更新系 更新内容(IT-26)／更新実行結果(IT-05)相当（母集合外・付帯表2注3） | メモ列の更新がDB反映（UI観測）・更新担当者列 member_id→dtb_member id 記録 | 040,050 | カバー（040=UI自動化でDB更新後値を観測／050=手動でDB更新者列を確認・要実機。観点表DB操作=更新系は既存IT 38行に未生成のため母集合外補完として写像。既存ITの「更新処理なし」誤分類を正本md準拠で是正） |
| データ整合性（更新範囲＝他項目/ステータス不変・参照時点） | 更新範囲限定・他項目不変 | 041 | カバー（UI自動化） |
| 業務ルール・計算（金額/税/在庫の再計算を行わない） | （該当処理なし） | （IT-33対象外） | 対象外（本APIに数量金額更新が無い・理由付き） |
| 排他制御・トランザクション（後勝ち・ロックなし） | 同時更新の後勝ち | 052 | カバー（手動・要実機） |
| ログ・監査（トークン原値・シークレット・Cookieを出力しない） | 機密値の出力抑止 | （手動・要実機） | 手動/要実機（サーバログ実機観測。SEEDで原値を渡さず確認） |
| 同時実行数の制限（観点表IT-19・エラー前提） | レート制限/同時実行制限エラー | （対象外） | 対象外（本APIは制限を持たず後勝ち。後勝ちは052で補完） |
| 外部取得・外部キャッシュ・決済代行・転送再連携・数量金額（観点表IT-09/IT-10/IT-33の非該当細目） | （該当処理なし） | （対象外） | 対象外（本機能に非該当・付帯表2b各行に理由明記） |
| タイムアウト（観点表IT-10） | タイムアウト時の仕様通り挙動・部分更新なし | 051 | カバー（手動・要実機） |

未カバーはいずれも理由（本APIに数量金額/外部連携/外部キャッシュ/決済代行/転送が無い・バージョニングは正典に定義なし・タイムアウト/排他/ログ機密抑止/保存例外500は要実機）を明記済み。正本mdの各節（利用者視点の入口・認証認可・処理フロー#1-5・入出力・バリデーション・エラー処理・副作用DB更新・データ整合性・排他制御）は両レイヤ（API/統合＝認証/該当なし/未指定/成功、UI＝コメント反映/更新範囲）へ写像し、正常×異常の対（コメント登録010/更新011／空文字012/未指定032／最大長013／認証通過001/拒否020-022／該当あり成功/該当なし030-031）を揃えた。更新系のDB更新観点（メモ上書き・更新担当者記録）は観点表のDB操作=更新系（更新内容 IT-26／更新実行結果 IT-05相当）に該当するが、既存IT 38行には生成されず（既存ITは『更新処理なし』と誤分類）母集合外であるため、母集合外の正本md補完ケースとしてUI反映040・手動050へ写像して担保した（付帯表2注3）。したがって本機能の更新系DB観点は『母集合内では未生成』だが正本md準拠で別管理カバー済みであり、母集合外補完を含めてカバーである（無条件の『未カバー0』主張は注3で是正済み）。
