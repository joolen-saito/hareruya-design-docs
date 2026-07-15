# A02-01（ポップアップ用商品情報取得） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a02-01_api_product_popup_product.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a02-01_api_product_popup_product.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a02_01_api_product_popup_product_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わない機能仕様（記事内ポップアップ用商品情報を返すJSON API・GET参照系）であり、**両レイヤで網羅**する。本APIはブラウザ向け画面を持たず（正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）、結果が管理画面に現れる範囲も無いため、**UIレイヤ＝0、API/統合レイヤ中心**で分類する。API/統合レイヤ＝Playwright `request`（APIRequestContext）でエンドポイントへGET送信し、HTTPステータス・レスポンス構造・データ整合・該当なし時の404で判定する。

**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装のレスポンス形・HTTPライブラリ既定値・Form制約を期待値に流用しない（オラクル独立性）。pf-apiの正本mdは現行（旧システム）のリバース設計であり、刷新先 ec-cube-enterprise との乖離（エンドポイントパス・言語コード値・404本文形・応答型・画像フィールド等）は**設計書/観点表を上位オラクル**として扱い、付帯表4（不具合候補／要確認）に出す。実装からは位置情報（APIパス・メソッド）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。送信先パスは実装の実効パス `GET /api/popup/product/{lang}/{productId}`（App/ProductController.php:150-151）に統一し（テストが実在経路へ届くため）、合否は設計書の意味（正常取得＝商品情報JSON＋200／該当なし＝404 Not Found／不正パラメータ＝404）で判定する。設計⇔実装のパス・本文・型の差異は付帯表4でのみ一元管理し、TSV期待値に実装の現挙動を固定しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（クライアント呼び出しの正常＝005／異常資格情報の負例＝008・要実機確認）・リクエスト（正常／異常パラメータ・想定外項目）・必須条件（パス変数）・受信検証（言語コード）・レスポンス（フィールド構成）・データなし（該当なし404）。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 正常取得のHTTPステータス・実行結果・リクエスト正常・外部取得（商品規格1件取得）。言語別取得・副作用なしを設計書（入出力・副作用・データ整合性）から補完 |
| IT-19 | 同時実行数の制限（設計に同時接続/呼び出し回数制限が無く対象外） |
| IT-10 | HTTPステータス・通信・正常／異常系・重複/順序（冪等参照）・エラー応答。形式不正(028)・障害(029)は観点本文が外部キャッシュ（キャッシュ値のJSON不正・接続障害）で本APIに該当処理が無く対象外（外部キャッシュ2）。決済代行・転送再連携・複数バリデーション一括返却/ソート順も対象外。タイムアウト(015)は手動/要実機。設計書由来の productId 型検証（非数値→404）・DB接続障害時挙動は母集合外として補完（E2E-012/031） |
| IT-33 | 在庫・数量・金額・履歴の更新／外部連携／売上返品は参照系の本APIに該当処理が無く全件対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-001	IT-09	リクエスト	P1	正常な商品ID・言語の指定で200と商品情報JSONが返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN・付帯表3-1）	"1. GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200。本文が1件で、productId=900001・name=「テスト商品Ａ（日本語）」・price01=800・price02=1000・stock=3（価格/在庫は数値文字列）・conditionCode=A・foilFlg=false が SEED-A02-01-PRODUCT-KNOWN 固定値（付帯表3-1）と一致すること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-002	IT-09	実行結果	P2	正常取得時に取得時点の商品情報が加工されず返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED固定：price01=800・price02=1000・stock=3）	"1. GET /api/popup/product/jp/900001 を送信する
2. レスポンス本文の price01・price02・stock を確認する"	price01=800・price02=1000・stock=3 が再計算・丸めなしで SEED 固定値（付帯表3-1）どおり返ること（業務ルール「計算処理を行わない」。数値文字列型は付帯表4#7）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-003	IT-09	HTTPステータス	P2	正常取得時のHTTPステータスが200である	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN）	"1. GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスを確認する"	HTTPステータスが200（成功）であること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-004	IT-09	外部取得	P1	商品ID・言語で該当する商品規格を1件取得する	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED固定：productClassId=900101）	"1. GET /api/popup/product/jp/900001 を送信する
2. レスポンスの件数と productId/productClassId を確認する"	該当規格が1件返り、productId=900001・productClassId=900101（SEED-A02-01-PRODUCT-KNOWN固定値・付帯表3-1）と整合すること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-005	IT-32	資格情報	P1	記事サイト等クライアントからの呼び出しで応答が処理結果と一致する	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	SEED-A02-01-API-ACCESS の有効な資格情報＋ lang=jp, productId=900001	"1. 有効な資格情報で GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスとレスポンス本文を確認する"	呼び出しが許可され、HTTPステータス200・本文が SEED-A02-01-PRODUCT-KNOWN 固定値（付帯表3-1）どおりの処理結果と一致すること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-008	IT-32	資格情報	P2	異常な資格情報での呼び出しが許可されず正常取得とならない	SEED-A02-01-API-ACCESS／SEED-A02-01-PRODUCT-KNOWN	SEED-A02-01-API-ACCESS の無効・欠落資格情報＋ lang=jp, productId=900001	"1. 無効・欠落した資格情報で GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスとレスポンス本文を確認する"	呼び出しが許可されず、商品情報JSON（正常取得＝200・SEED固定値）を返さないこと（権限・認可「認可方式はpf-apiの方針に従う」。認可方式が未確定のため拒否時の具体ステータス〔401/403等〕は要実機確認＝付帯表4#2）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-006	IT-32	レスポンス	P2	成功レスポンスが仕様のフィールド構成と一致する	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN・全フィールド固定）	"1. GET /api/popup/product/jp/900001 を送信する
2. レスポンス本文の各フィールドと型を確認する"	レスポンスに仕様の13フィールド（productId・name・productClassId・price01・price02・stock・nameEn・subFileName・fileName・code・conditionCode・foilFlg・weeklySold）が含まれ、各値が SEED-A02-01-PRODUCT-KNOWN 固定値（付帯表3-1：name=「テスト商品Ａ（日本語）」・price01=800・stock=3・conditionCode=A・foilFlg=false・subFileName=900001_class.jpg・fileName=900001_product.jpg 等）と一致すること。型契約：price01・price02・stock・weeklySold は数値文字列（string）、name・nameEn・code・conditionCode は string、productId・productClassId は integer、foilFlg は真偽値（boolean）、subFileName/fileName は string（該当無し時null）。型・画像・追加フィールドの実装差異は付帯表4#6/#7/#8で管理する。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-007	IT-32	必須条件	P2	パス変数（lang・productId）欠落で取得されず404／ルート不一致となる	SEED-A02-01-API-ACCESS	lang を欠いたパス（/api/popup/product/900001）／productId を欠いたパス（/api/popup/product/jp）	"1. lang もしくは productId を欠いたパス（例 /api/popup/product/900001, /api/popup/product/jp）へGET送信する
2. HTTPステータスを確認する"	必須パス変数を欠いたリクエストは商品情報を返さず、ルート不一致または404となること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-010	IT-32	データなし	P1	該当する商品規格が無い場合に404 Not Found が返る	SEED-A02-01-API-ACCESS／SEED-A02-01-PRODUCT-NONE	lang=jp, productId=999999（SEED-A02-01-PRODUCT-NONE：DBに存在しない）	"1. GET /api/popup/product/jp/999999 を送信する
2. HTTPステータスとレスポンス本文を確認する"	"HTTPステータス404。本文が仕様の {code, message}（message=""Not Found""）形式であること（実装の本文形差異は付帯表4#3）。"				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-011	IT-32	リクエスト	P2	異常なパラメータ値（productId≦0）で404となる	SEED-A02-01-API-ACCESS	lang=jp, productId=0（または負値 -1）	"1. GET /api/popup/product/jp/0 を送信する
2. HTTPステータスを確認する"	異常なパラメータ値では商品情報を返さず、404が返ること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-012	IT-10	形式不正	P2	非数値（型不正）の商品IDで404となる	SEED-A02-01-API-ACCESS	lang=jp, productId=abc（非数値）	"1. GET /api/popup/product/jp/abc を送信する
2. HTTPステータスを確認する"	productId が integer 型でない場合は商品情報を返さず、404となること（productId は型integer・必須）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-013	IT-32	受信検証	P2	想定外の言語コードで404となる	SEED-A02-01-API-ACCESS／SEED-A02-01-PRODUCT-KNOWN	lang=fr（想定外）, productId=900001	"1. GET /api/popup/product/fr/900001 を送信する
2. HTTPステータスを確認する"	言語が想定値（jp/en）以外の場合は対応する商品情報が無く、404となること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-014	IT-32	リクエスト	P3	想定外のクエリ項目を加えてもサーバエラーで停止しない（無視可否は要実機確認）	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001 ＋想定外クエリ（例 ?foo=bar）	"1. GET /api/popup/product/jp/900001?foo=bar を送信する
2. HTTPステータスとレスポンスを確認する"	未知のクエリ項目があってもサーバエラー（5xx）で停止しないことのみを判定する。想定外クエリ項目の扱いは正本に明記が無いため期待値を固定せず、200で無視され正常取得（SEED固定値と同一内容）となるかは要実機確認とする。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-015	IT-10	エラー	P2	エラー発生時に仕様のエラー応答（404 Not Found 本文）が返る	SEED-A02-01-API-ACCESS／SEED-A02-01-PRODUCT-NONE	lang=jp, productId=999999（SEED-A02-01-PRODUCT-NONE）	"1. GET /api/popup/product/jp/999999 を送信する
2. HTTPステータスとレスポンス本文を確認する"	該当商品情報なしのエラーで、コード404・メッセージ「Not Found」のJSONが返ること（エラー処理「該当商品情報なし」）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-016	IT-10	HTTPステータス	P1	異常（該当なし）時のHTTPステータスが仕様の404と一致する	SEED-A02-01-API-ACCESS／SEED-A02-01-PRODUCT-NONE	lang=jp, productId=999999（SEED-A02-01-PRODUCT-NONE）	"1. GET /api/popup/product/jp/999999 を送信する
2. HTTPステータスを確認する"	HTTPステータスが該当なしを示す404であること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-017	IT-10	通信	P1	正常通信で200応答が返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN）	"1. GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200（成功）であること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-018	IT-10	正常	P2	対象条件に該当する正常値で200と商品情報が返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN）	"1. GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスとレスポンスを確認する"	正常取得としてHTTPステータス200で、SEED-A02-01-PRODUCT-KNOWN 固定値（付帯表3-1）どおりの商品情報が返ること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-019	IT-10	異常系	P2	異常系（不正値）受信時のHTTPステータスが仕様通り404となる	SEED-A02-01-API-ACCESS	lang=jp, productId=abc（不正値）／または lang=fr, productId=900001	"1. GET /api/popup/product/jp/abc を送信する
2. HTTPステータスを確認する"	HTTPステータスが異常（該当なし・不正パラメータ）を示す404であること。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-020	IT-10	重複・順序	P2	同一GETの重複呼び出しで同一レスポンス（冪等参照）となる	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001 を2回（SEED-A02-01-PRODUCT-KNOWN）	"1. GET /api/popup/product/jp/900001 を1回目送信する
2. 同一リクエストを2回目送信する
3. 2回のレスポンスを比較する"	参照系のため2回の呼び出しで同一のHTTPステータス200・レスポンス本文（SEED固定値どおり）が返り、副作用（DB更新）が発生しないこと（副作用「無し（参照のみ）」）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-030	IT-10	エラー	P3	タイムアウト時に未捕捉例外で停止せず参照系としてDB不整合が残らない	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001 ＋タイムアウト誘発（SEED-A02-01-PRODUCT-KNOWN）	"1. タイムアウトを誘発して GET /api/popup/product/jp/900001 を送信する
2. 応答とDB状態を確認する"	タイムアウト時の応答仕様は正典に定義が無いため期待値を固定せず（未定義挙動を仕様化しない）、参照系のため呼び出しでDBに不整合が残らないことのみを判定する。タイムアウト時の具体応答とその実再現は要実機確認。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-031	IT-10	障害	P2	DB接続障害時に未捕捉エラーで停止しない（代替応答仕様は要実機確認）	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001 ＋DB接続障害・読み取り失敗を誘発（SEED-A02-01-PRODUCT-KNOWN）	"1. DB接続障害を誘発して GET /api/popup/product/jp/900001 を送信する
2. 応答を確認する"	DB接続障害時の代替応答仕様は正典に定義が無いため期待値を固定せず（未定義挙動を仕様化しない）、未捕捉例外（500）でプロセス停止せずエラー応答へ分岐することのみを判定する。具体応答・障害実再現は要実機確認。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-040	IT-09	リクエスト	P2	言語コード jp 指定で日本語の商品情報が返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED固定：jp規格 productClassId=900101・name=「テスト商品Ａ（日本語）」）	"1. GET /api/popup/product/jp/900001 を送信する
2. HTTPステータスとレスポンスを確認する"	HTTPステータス200で、name=「テスト商品Ａ（日本語）」・code=jp（SEED固定値・付帯表3-1）の日本語商品情報が返ること（正本md 入出力 lang「jpまたはen」。言語コード値の実装差異は付帯表4#4で管理）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-041	IT-09	リクエスト	P2	言語コード en 指定で英語の商品情報が返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=en, productId=900001（SEED固定：en規格 productClassId=900102・nameEn=Test Product A）	"1. GET /api/popup/product/en/900001 を送信する
2. HTTPステータスとレスポンスを確認する"	HTTPステータス200で、nameEn=Test Product A・code=en（SEED固定値・付帯表3-1）の英語商品情報が返ること（データ整合性「指定言語に対応する商品情報を返す」）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-042	IT-32	レスポンス	P3	weeklySold が週間販売数の集計（SUM）値として返る	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED固定：当該週の販売明細を合計5件相当で投入・weeklySold=5）	"1. GET /api/popup/product/jp/900001 を送信する
2. レスポンスの weeklySold を確認する"	weeklySold が週間販売数の集計（SUM）結果として weeklySold=5（SEED固定値・付帯表3-1）で、仕様型の数値文字列（string）で返ること（応答フィールド定義 weeklySold「集計（SUM）結果のため数値文字列で返す」。応答型の実装差異は付帯表4#7で管理）。				
a02-01_api_product_popup_product（API_ポップアップ用商品情報取得）	E2E-A02-01-043	IT-09	実行結果	P3	参照のみで副作用が無い（再取得で対象データ不変）	SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-API-ACCESS	lang=jp, productId=900001（SEED-A02-01-PRODUCT-KNOWN）	"1. 対象商品(900001)の現在値を取得する
2. GET /api/popup/product/jp/900001 を送信する
3. 対象商品の値を再取得し比較する"	API呼び出し前後で対象商品規格(900001)の値（price01=800・price02=1000・stock=3 等のSEED固定値）が変化しないこと（副作用「無し（参照のみ）」・DB操作は参照系のみ）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

実装エンドポイントは `#[Route(path: '/api/popup/product/{lang}/{productId}', name: 'popup_product_by_product_id', methods: ['GET'])]`（`src/Eccube/Controller/App/ProductController.php:150-151`）。App コントローラ群は `app_controllers` で prefix 無し（`app/config/eccube/routes.yaml:5-6`）のため実効パスは `GET /api/popup/product/{lang}/{productId}`。**設計書のエンドポイント `GET /popup/product/{lang}/{productId}` と実装は `/api` プレフィクス有無で食い違う（付帯表4#1）。送信先は実装の実効パスへ統一し、合否は設計書の意味で判定する**。productId 検証は `preg_match('/^\d+$/', $productId)` かつ `(int)$productId < 1` で `NotFoundException('Not Found')`（ProductController.php:154-156）。言語は `match(strtolower($lang)) { 'ja'=>'JP','en'=>'EN', default=>throw NotFoundException }`（ProductController.php:158-162／設計の `jp` は未受理＝付帯表4#4）。取得は `productRepository->findPopupProductByProductId((int)$productId, $languageCode)`（ProductController.php:164／ProductRepository.php:2033）、null で 404（ProductController.php:165-167）。成功本文は `PopupResponseBuilder->build()`（PopupResponseBuilder.php:27-52）。404本文は `{code, errors}`（ProductController.php:177-181／設計は `{code, message}`＝付帯表4#3）。受信履歴・DB更新は無し（参照系）。

| テストID | E2E可否 | 対象APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|------------------------------------------------------|--------------------------------|--------------|
| E2E-A02-01-001 | E2E自動化(API/統合) | `GET /api/popup/product/{lang}/{productId}`（ProductController.php:150-151／routes.yaml:5-6） | 処理フロー#4（取得成功時JSON返却）・利用者視点の入口・入出力(成功200)／IT-09 | IT-A02-01-...-004 |
| E2E-A02-01-002 | E2E自動化(API/統合) | 同上＋`PopupResponseBuilder->build`（PopupResponseBuilder.php:27） | 業務ルール・計算（再計算/丸めを行わない・取得時点の値）／IT-09 | IT-A02-01-...-002 |
| E2E-A02-01-003 | E2E自動化(API/統合) | 同上 | 入出力 レスポンス(成功)HTTP200／IT-09 | IT-A02-01-...-003 |
| E2E-A02-01-004 | E2E自動化(API/統合) | 同上＋`findPopupProductByProductId`（ProductRepository.php:2033, LIMIT 1） | レスポンス(成功)「条件に合致する商品規格を一件返す」・処理フロー#2／IT-09 | IT-A02-01-...-024 |
| E2E-A02-01-005 | E2E自動化(API/統合) | 同上 | 権限・認可（クライアントから呼び出す）・利用者視点の入口／IT-32 | IT-A02-01-...-001 |
| E2E-A02-01-008 | 手動（要実機確認・認可方式未確定） | 同上＋認可方式の実体は実機確認（ProductController.php:150-151 に認証/認可属性の記載なし＝付帯表4#2） | 権限・認可（認可方式はpf-api方針）の負例＝異常資格情報は許可しない／IT-32 | IT-A02-01-...-001（負例側） |
| E2E-A02-01-006 | E2E自動化(API/統合) | 同上＋`PopupResponseBuilder->build`（PopupResponseBuilder.php:29-49） | 入出力 レスポンス(成功)フィールド定義（productId〜weeklySold・subFileName/fileName null許容・foilFlg boolean）／IT-32 | IT-A02-01-...-032 |
| E2E-A02-01-007 | E2E自動化(API/統合) | 同上（パス変数 lang/productId 必須） | 入出力 リクエスト（lang・productId 必須）・利用者視点の入口／IT-32 | IT-A02-01-...-031 |
| E2E-A02-01-010 | E2E自動化(API/統合) | 同上＋null時404（ProductController.php:165-167／404本文 errors=付帯表4#3） | 処理フロー#3（取得不可で404 Not Found）・エラー処理（該当商品情報なし）・入出力 レスポンス(失敗)404／IT-32 | IT-A02-01-...-033 |
| E2E-A02-01-011 | E2E自動化(API/統合) | productId検証 `(int)$productId < 1`→404（ProductController.php:154-156） | 入出力 リクエスト（productId integer）・異常パラメータ／IT-32 | IT-A02-01-...-005 |
| E2E-A02-01-012 | E2E自動化(API/統合) | productId検証 `preg_match('/^\d+$/')`→404（ProductController.php:154-156） | 入出力 リクエスト（productId integer・必須）・形式不正／IT-10（母集合行028は外部キャッシュ観点で対象外＝付帯表2b。設計書由来のproductId型検証として補完） | （母集合外・設計書補完） |
| E2E-A02-01-013 | E2E自動化(API/統合) | 言語検証 `match(strtolower($lang)) default→404`（ProductController.php:158-162） | 入出力 リクエスト（lang は jp/en 想定）・データ整合性 言語／IT-32 | IT-A02-01-...-036 |
| E2E-A02-01-014 | E2E自動化(API/統合)（要実機確認） | `GET /api/popup/product/{lang}/{productId}`（クエリ追加・パス変数のみ参照） | 入出力 リクエスト（想定外項目）・処理フロー（指定ID/言語のみ参照）。想定外クエリ200固定は正本に明記が無く要実機確認／IT-32 | IT-A02-01-...-006 |
| E2E-A02-01-015 | E2E自動化(API/統合) | 同上＋404本文（ProductController.php:177-181／設計は {code,message}） | エラー処理（該当商品情報なし→404「Not Found」）／IT-10 | IT-A02-01-...-008 |
| E2E-A02-01-016 | E2E自動化(API/統合) | 同上＋null時404（ProductController.php:165-167） | 入出力 レスポンス(失敗)404・HTTPステータス／IT-10 | IT-A02-01-...-025 |
| E2E-A02-01-017 | E2E自動化(API/統合) | `GET /api/popup/product/{lang}/{productId}` | 入出力 レスポンス(成功)200・通信／IT-10 | IT-A02-01-...-026 |
| E2E-A02-01-018 | E2E自動化(API/統合) | 同上 | 処理フロー#4・正常取得／IT-10 | IT-A02-01-...-027 |
| E2E-A02-01-019 | E2E自動化(API/統合) | 同上＋不正時404（ProductController.php:154-167） | 入出力 レスポンス(失敗)404・異常系／IT-10 | IT-A02-01-...-030 |
| E2E-A02-01-020 | E2E自動化(API/統合) | 同上（GET参照・副作用なし） | 副作用「無し（参照のみ）」・データ整合性 参照時点／IT-10 | IT-A02-01-...-037 |
| E2E-A02-01-030 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理・参照系で不整合なし／IT-10 | IT-A02-01-...-015 |
| E2E-A02-01-031 | 手動（要実機確認・DB障害実再現） | DB接続障害の実再現は外部依存（要実機確認）。500ハンドラ（ProductController.php:182-193） | エラー処理・障害時代替動作／IT-10（母集合行029は外部キャッシュ観点で対象外＝付帯表2b。設計書由来のDB障害時挙動として補完） | （母集合外・設計書補完） |
| E2E-A02-01-040 | E2E自動化(API/統合) | 言語 `match`（ProductController.php:158-162／設計 `jp` は未受理=付帯表4#4） | 入出力 リクエスト lang「jpまたはen」・データ整合性 言語／IT-09 | （母集合外・設計書補完） |
| E2E-A02-01-041 | E2E自動化(API/統合) | 言語 en→EN（ProductController.php:158-162）／nameEn（PopupResponseBuilder.php:36） | データ整合性「指定言語に対応する商品情報」・応答 nameEn／IT-09 | （母集合外・設計書補完） |
| E2E-A02-01-042 | E2E自動化(API/統合) | weeklySold＝SUM副問合せ（ProductRepository.php:2051-2056） | 入出力 応答 weeklySold「集計（SUM）結果」／IT-32 | （母集合外・設計書補完） |
| E2E-A02-01-043 | E2E自動化(API/統合) | GET参照・更新無し（ProductController.php:151-176／DB操作=検索のみ） | 副作用「無し（参照のみ）」・DB操作（参照系）・排他制御（参照のみ）／IT-09 | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文で、決済・在庫更新・外部キャッシュ・転送再連携など本機能に無い文面を含む）。本E2Eは設計書本文（処理フロー・入出力・エラー処理・データ整合性・副作用）を一次情報源として、参照系GET APIに該当する正常×異常（正常取得／該当なし404／不正productId404／不正lang404／想定外項目）の対を網羅し、実装からはAPIパス・メソッドの位置情報のみを取得した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a02_01_api_product_popup_product_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。本機能はブラウザ向け画面を持たない参照系GET APIのため `自動化(UI)`＝0、`自動化(API/統合)` 中心で集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報(正常呼び出し=005)・リクエスト(異常/想定外)・必須条件・受信検証(言語)・レスポンス・データなしはHTTPステータス/レスポンス構造で観測可。資格情報の負例(異常資格情報=008・手動・要実機確認)は同一IT行001の補完で別管理（行本体区分は自動化のまま・集計不変）。バージョニングは正典にAPIバージョン指定が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常取得のHTTPステータス・実行結果・リクエスト・外部取得 |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 設計に同時接続/呼び出し回数制限が無く対象外（理由付き） |
| IT-10 | 18 | 0 | 6 | 1 | 11 | HTTPステータス/通信/正常/異常系/エラー/重複(冪等)はAPI/統合(6)。タイムアウト(015)は手動(1件)。形式不正(028)・障害(029)は観点本文が外部キャッシュ(JSON不正・接続障害)で本APIに該当処理が無く対象外＝外部キャッシュ2。決済代行(2)/複数バリデーション一括返却・ソート順(6)/転送再連携(1)も対象外。対象外計11 |
| IT-33 | 7 | 0 | 0 | 0 | 7 | 在庫/数量/金額/履歴更新・外部連携・売上返品は参照系の本APIに該当処理が無く全件対象外 |
| 合計 | 38 | 0 | 17 | 1 | 20 | **未分類 0** |

注1: 対象外20件の内訳は、IT-32 バージョニング(1＝正典にAPIバージョン指定なし)＋IT-19 同時実行数の制限(1＝設計に同時接続/呼び出し制限なし)＋IT-10(11＝決済代行2・外部キャッシュ2〔形式不正028・障害029の観点本文がいずれも外部キャッシュ〕・複数バリデーション一括返却/ソート順6・転送再連携1)＋IT-33(7＝数量金額履歴更新・外部連携・売上返品で本APIに該当処理なし)。いずれも「本機能に該当処理・I/Fが無い」理由付きで放置ではない（既存IT casesの対象外観点表とも整合）。付帯表2と付帯表2bの内訳・件数は完全一致（IT-10＝自動化6・手動1・対象外11）。

注2（母集合外・設計書補完ケース）: 設計書本文（入出力 lang「jp/en」・productId integer 型検証・応答 weeklySold集計・データ整合性 言語・副作用「無し」・エラー処理）から、母集合38行に適用可能な対応行を持たない補完ケースを別管理する。これらは母集合集計には算入しない。内訳＝自動化(API/統合) 5（012 非数値productId→404／040 jp言語取得／041 en言語取得／042 weeklySold集計／043 副作用なし）＋手動・要実機確認 1（031 DB接続障害時の挙動）。E2E-012/031 は母集合 IT行028/029 に名目対応するが、当該行の観点本文が外部キャッシュ（本APIに外部キャッシュ参照処理が無く対象外）のため、設計書由来の productId 型検証・障害時挙動として母集合外で別管理する（母集合38件の区分集計に算入しない＝未分類0維持）。

注3（既存IT行の負例補完ケース）: IT行001（資格情報）の負例として E2E-A02-01-008（異常資格情報＝許可せず正常取得を返さない）を追加した。認可方式が正本で未確定（付帯表4#2）のため区分は `手動（要実機確認）`。これは既存IT行001を正常側（005）と負例側（008）の独立オラクルで分けた補完であり、母集合38件の区分集計（IT-32 自動化7・手動0・対象外1）は変えない（未分類0維持）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 005（正常呼び出し＝200・自動化）／008（異常資格情報の負例＝手動・要実機確認。認可方式未確定＝付帯表4#2）。行区分は正常側の自動化を本体とし、負例008を要実機確認で補完 |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001 |
| 005 | IT-32 | リクエスト（異常パラメータ） | 自動化(API/統合) | 011 |
| 006 | IT-32 | リクエスト（想定外項目） | 自動化(API/統合) | 014 |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 設計に同時接続数/呼び出し回数の制限が無く非該当（viewpoints:473「制限する設計となっている場合」） |
| 008 | IT-10 | エラー | 自動化(API/統合) | 015 |
| 009 | IT-10 | エラー（単項目バリ一括返却） | 対象外 | 本APIはパス変数のみで複数項目バリの一括返却を持たない |
| 010 | IT-10 | エラー（単項目バリ ソート順） | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー（相関バリ一括返却） | 対象外 | 同上 |
| 012 | IT-10 | エラー（相関バリ ソート順） | 対象外 | 同上 |
| 013 | IT-10 | エラー（DB相関バリ一括返却） | 対象外 | 同上 |
| 014 | IT-10 | エラー（DB相関バリ ソート順） | 対象外 | 同上 |
| 015 | IT-10 | エラー（タイムアウト） | 手動 | 030（タイムアウト実再現＝要実機確認） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン指定が無く、バージョン依存挙動は創作になるため対象外（理由付き） |
| 017 | IT-33 | 区分整合 | 対象外 | 数量別管理・区分整合の更新処理が本参照APIに無いため |
| 018 | IT-33 | エラー（数量更新失敗等） | 対象外 | 数量・金額・履歴の更新処理が無いため |
| 019 | IT-33 | 外部取引 | 対象外 | 外部取引による加減算処理が無いため |
| 020 | IT-33 | 自動加算 | 対象外 | 外部連携由来の自動加算処理が無いため |
| 021 | IT-33 | 実数更新 | 対象外 | 実数更新処理が無いため |
| 022 | IT-33 | 売上・返品 | 対象外 | 売上・返品の数量金額更新処理が無いため |
| 023 | IT-33 | 連携エラー | 対象外 | 外部連携の更新処理が無いため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004 |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 016 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 017 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 018 |
| 028 | IT-10 | 形式不正 | 対象外 | 観点本文が外部キャッシュ（キャッシュ値のJSON不正・必須キー欠落・期限切れ）で、本APIは外部キャッシュ参照処理を持たず非該当（外部キャッシュ2の1件）。設計書由来の productId 型検証（非数値→404）は E2E-012（母集合外・付帯表2注2）で別途カバー |
| 029 | IT-10 | 障害 | 対象外 | 観点本文が外部キャッシュへの接続障害・読み書き失敗で、本APIは外部キャッシュ処理を持たず非該当（外部キャッシュ2の1件）。設計書由来の DB接続障害時挙動は E2E-031（母集合外・手動／要実機確認・付帯表2注2）で別途カバー |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 019 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 007 |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 006 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 010 |
| 034 | IT-10 | 正常系（決済代行） | 対象外 | 決済代行・外部決済サービス連携が本APIに無いため |
| 035 | IT-10 | 異常系（決済代行） | 対象外 | 同上 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 013（言語コード検証→404へ写像） |
| 037 | IT-10 | 重複・順序 | 自動化(API/統合) | 020（参照系の冪等呼び出し） |
| 038 | IT-10 | 部分失敗 | 対象外 | 外部通知/結果を別システムへ転送・再連携する処理が本APIに無いため |

集計（付帯表2と一致・区分は4区分本体に統一し要実機確認は修飾子として扱う）: 自動化(UI) 0／自動化(API/統合) 17（001,002,003,004,005,006,008,024,025,026,027,030,031,032,033,036,037）／手動 1（015＝要実機確認）／対象外 20（007,009,010,011,012,013,014,016,017,018,019,020,021,022,023,028,029,034,035,038）。**未分類 0**（母集合38行）。IT行028（形式不正）・029（障害）は観点本文がいずれも外部キャッシュで本APIに該当処理が無く対象外（外部キャッシュ2）＝付帯表2のIT-10対象外内訳と完全一致。母集合外の設計書補完ケース 012/031/040/041/042/043（012・040-043＝自動化(API/統合)、031＝手動・要実機確認）は別管理し、母集合38件の区分集計を変えない。IT行001（資格情報）は正常呼び出し（E2E-005・自動化）を行本体区分とし、異常資格情報の負例（E2E-008・手動・要実機確認）を同一行の補完として別管理する（母集合38件の区分集計に算入しない＝未分類0維持）。E2E-014（想定外クエリ）はTSV/付帯表1で（要実機確認）の修飾子を付すが4区分本体は自動化(API/統合)のまま変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A02-01-PRODUCT-KNOWN | dtb_product_class／dtb_product_sub_class（商品サブ規格。ec-cube-enterprise実装で要確認・付帯表4#5）／カード詳細・カードコンディション・言語・商品サブ規格画像 | 公開（表示）状態の実在商品1件以上。商品ID・言語（jp/en）・商品規格ID・price01/price02/stock・カードコンディション・フォイル区分・画像ファイル名・週間販売実績が既知。日本語規格と英語規格を持つ | fixture／migration | 専用商品・既知値へ復元してべき等化。参照系のためテスト後の値変動なし | 001-006,013,014,017,018,020,030,031,040,041,042,043 |
| SEED-A02-01-PRODUCT-NONE | （該当なし状態） | 当該言語で該当商品規格が存在しない商品ID（未登録IDまたは非公開・price02≦0で対象外となるID）を既知に確保 | synthetic（未存在IDを指定） | 後始末不要（存在しないIDを使う） | 010,015,016,019 |
| SEED-A02-01-API-ACCESS | API呼び出し資格情報／アクセス許可 | pf-apiの認可方式（正本md 権限・認可「認可方式はpf-apiの方針に従う」）を満たす呼び出し元・資格情報。負例008用に**無効・欠落した資格情報**も用意する（拒否を確認）。**実装のApp APIエンドポイントの認可方式は要確認（付帯表4#2）** | fixture／env（環境ガード `test.skip`） | 環境隔離・撤去可。資格情報の原値（正常・異常とも）はログ・設計書に書かない（ログ・監査「認証情報を出さない」） | 全API/統合ケース＋008（負例＝無効/欠落資格情報・要実機確認） |

注: 商品サブ規格・カード詳細・カードコンディション・言語・商品サブ規格画像は現行（pf-api）のテーブル名で、ec-cube-enterpriseに対応実装が見当たらないため推測でスキーマ化せず要確認（正本md リニューアル移行時の扱い・付帯表4#5）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（dtb_product_class 等）に従う。本APIは参照系のため更新系シード・後始末は不要。API資格情報は環境変数で供給する。

## 付帯表3-1：SEED固定値（合成の既知値・期待オラクル）

実施者はこの表の固定値で入力を組み立て、応答をこの固定値と**等値照合**して合否を判定する。値は合成（実カード非依存）だが、**仕様どおりの期待値を先に固定したオラクル**であり、実装がこの値と異なれば落として検出する（型・画像・言語コードの実装乖離は付帯表4で管理）。テスト帯IDは他機能と衝突しない専用帯（90xxxx）から採番し、テスト後は同値へべき等復元する（参照系のため値変動なし）。

| SEEDキー | フィールド | 固定値（jp規格） | 固定値（en規格） | 備考 |
|----------|-----------|------------------|------------------|------|
| PRODUCT-KNOWN | productId | 900001 | 900001（同一商品） | 公開状態・テスト帯の専用ID |
| PRODUCT-KNOWN | productClassId | 900101 | 900102 | 言語別の商品規格 |
| PRODUCT-KNOWN | name | テスト商品Ａ（日本語） | － | jp規格の名称 |
| PRODUCT-KNOWN | nameEn | － | Test Product A | en規格の名称 |
| PRODUCT-KNOWN | code | jp | en | code＝言語コード（付帯表4#4：実装は ja/en 受理・jp 未受理） |
| PRODUCT-KNOWN | price01 | "800" | "800" | 数値文字列（付帯表4#7：実装のint化を検出） |
| PRODUCT-KNOWN | price02 | "1000" | "1000" | 数値文字列 |
| PRODUCT-KNOWN | stock | "3" | "3" | 数値文字列 |
| PRODUCT-KNOWN | conditionCode | A | A | カードコンディション |
| PRODUCT-KNOWN | foilFlg | false | false | 真偽値 |
| PRODUCT-KNOWN | weeklySold | "5" | "5" | 週間販売数の集計(SUM)・数値文字列。対象週の販売明細を合計5件相当で投入 |
| PRODUCT-KNOWN | subFileName | 900001_class.jpg | 900001_class.jpg | 商品規格画像（付帯表4#6：fileNameと別ソース＝別値） |
| PRODUCT-KNOWN | fileName | 900001_product.jpg | 900001_product.jpg | 商品画像（subFileNameと別値であること） |
| PRODUCT-NONE | productId | 999999 | 999999 | 未登録＝該当なし(404誘発)。DBに存在させない |

補足: jp/en は同一 productId=900001 の言語別規格（productClassId 900101/900102）として持たせる。この固定値は付帯表3のシードセット（SEED-A02-01-PRODUCT-KNOWN／SEED-A02-01-PRODUCT-NONE）を具体化したもので、TSVの各ケースはこの値を参照して入力・期待を確定する。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `GET /popup/product/{lang}/{productId}`（利用者視点の入口） | `#[Route(path: '/api/popup/product/{lang}/{productId}', methods: ['GET'])]`（App/ProductController.php:150-151）＋App群 prefix無し（routes.yaml:5-6）＝実効 `GET /api/popup/product/{lang}/{productId}` | **設計書パス `/popup/product/...` と実装パス `/api/popup/product/...` が `/api` プレフィクスの有無で不一致**。テストは実装の実効パスへ送信し本差異を不具合候補として記録（合否は設計の意味で判定） | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 認可方式はpf-apiの方針に従う（権限・認可） | App コントローラの当該ルートに認証/認可属性の記載が確認できない（ProductController.php:150-151。firewall/IP制限等は要実機確認） | **実装の認可方式（公開／IP制限／APIキー等）が設計書から確定できず要確認**。テストは正常側（005）で「クライアントから呼び出し可・応答が処理結果と一致」を仕様で判定し、負例側（008）で「異常資格情報は許可せず正常取得を返さない」を判定する。認可方式・拒否時の具体ステータス（401/403等）の実体は実機確認のため008は `手動（要実機確認）` | 005,008 | 要確認(認可方式) |
| 3 | 失敗時の本文は `{code, message}`（message="Not Found"）（入出力 レスポンス(失敗)） | 404本文は `{code: $e->getStatusCode(), errors: $e->getErrors()}`（ProductController.php:177-181）＝`message` ではなく `errors` 配列 | **設計は本文キー `message`、実装は `errors`**。テストは仕様の `{code, message}` を期待し、実装が違えば落ちて検出（HTTPステータス404は一致見込み） | 010,015 | 不具合候補(404本文形乖離) |
| 4 | 言語 `lang` は `jp`または`en`を想定（入出力 リクエスト） | `match(strtolower($lang)) { 'ja'=>'JP','en'=>'EN', default=>throw NotFoundException }`（ProductController.php:158-162）＝受理は `ja`/`en`、`jp` は default で404 | **設計は `jp`、実装は `ja` を受理**。`jp` 指定時、設計は200・実装は404となり乖離。テストは仕様どおり `jp` で200を期待し、実装が違えば落ちて検出 | 040,013 | 不具合候補(言語コード値乖離) |
| 5 | 主参照テーブルは dtb_product_sub_class（商品サブ規格。Hareruya独自）／カード詳細・コンディション・言語・商品サブ規格画像（DBカラム・リニューアル移行時の扱い） | 実装は dtb_product / dtb_product_class＋mtb_card_condition / mtb_card_detail / mtb_language / dtb_product_image を結合（ProductRepository.php:2057-2063）。dtb_product_sub_class 相当の参照は確認できない | **設計が挙げる商品サブ規格テーブルが ec-cube-enterprise に見当たらず、実装は別テーブル構成で取得**。応答の subFileName/fileName・conditionCode 等の出所が設計と実装で異なる可能性＝要確認 | 006,042 | 要確認(参照テーブル乖離) |
| 6 | subFileName＝商品規格画像のファイル名、fileName＝商品画像のファイル名（別ソース）（入出力 応答） | `'subFileName'=>$result['imageFileName'], 'fileName'=>$result['imageFileName']`（PopupResponseBuilder.php:37-38）＝両者に同一値を設定 | **設計は subFileName（商品規格画像）と fileName（商品画像）を別ソースとするが、実装は同一の imageFileName を両フィールドへ設定**。正本が別ソースと明記しているため、テストは両フィールドが別ソース由来で返ることを期待し、同一値なら仕様乖離として落ちて検出する（実装の同一値挙動へ期待値を寄せない） | 006 | 不具合候補(画像フィールド乖離) |
| 7 | price01/price02/stock/weeklySold は数値文字列（string）で返す（入出力 応答 型定義） | price01/price02/stock/weeklySold は integer 取得＋`(int)` キャスト（ProductRepository.php:2081-2088／PopupResponseBuilder.php:35,41） | **設計は数値文字列（Doctrine decimal/SUM文字列）、実装は整数値**で返す乖離。テストは仕様の string（数値文字列）型を期待値とし（006/042 の期待結果に型契約を明記）、実装が int 等を返せば仕様型と不一致で落ちて検出する（期待値を実装の int 化へ寄せない） | 002,006,042 | 不具合候補(応答型乖離) |
| 8 | 応答フィールドは設計の13項目（productId〜weeklySold）（入出力 応答） | 実装は追加で `productUrl` を返す（PopupResponseBuilder.php:42／ProductController.php:170-176） | **実装は設計に無い `productUrl` を付与**。テストは設計の13フィールド存在を期待（追加フィールドの有無は不合格条件にしない）し、差異は要確認 | 006 | 要確認(追加フィールド) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET /popup/product/{lang}/{productId}・JSON応答） | 正常取得200・該当なし404 | 001,005,010 | カバー（付帯表4#1パス乖離記録） |
| 処理フロー#1-2（パスの商品ID・言語受領→リポジトリ取得） | 商品ID・言語で1件取得 | 001,004 | カバー |
| 処理フロー#3（取得不可で404 Not Found） | 該当なし404 | 010,015,016 | カバー |
| 処理フロー#4（取得成功でJSON返却） | 正常取得200・実行結果 | 001,002,018 | カバー |
| 業務ルール・計算（再計算/丸めをしない・取得時点の値） | 値が加工されず返る | 002 | カバー |
| 入出力 リクエスト（lang 必須 jp/en・productId 必須 integer） | 必須欠落・型不正・想定外言語・想定外項目 | 007,011,012,013,014,040,041 | カバー |
| 入出力 レスポンス(成功)（200・13フィールド・null許容・boolean） | フィールド構成・型・null | 006,042 | カバー（型/画像/追加フィールドは付帯表4#6/7/8） |
| 入出力 レスポンス(失敗)（404 {code, message} "Not Found"） | 404本文形 | 010,015 | カバー（本文形乖離 付帯表4#3） |
| 副作用（無し・参照のみ） | 冪等参照・呼び出し前後の不変 | 020,043 | カバー |
| データ整合性（参照時点・指定言語に対応） | 言語別取得 | 040,041 | カバー |
| 業務ルール 応答値 weeklySold（集計SUM結果） | weeklySold集計値 | 042 | カバー |
| DB操作（検索のみ・登録更新削除なし）／排他制御（参照のみ） | 副作用なし・冪等 | 020,043 | カバー |
| 権限・認可（クライアントから呼び出し・pf-api方針） | 呼び出し可・応答整合（正常）／異常資格情報は許可しない（負例） | 005,008 | カバー（正常005＝自動化・負例008＝手動/要実機。認可方式の実体は付帯表4#2要確認） |
| エラー処理（該当商品情報なし→404 Not Found） | 404応答 | 010,015 | カバー |
| ログ・監査（認証情報を出さない） | 機密値の出力抑止 | （対象外＝サーバログ実機観測） | 手動/対象外（API応答に現れず・シード注記で原値非記載を担保） |
| 同時実行数の制限（IT-19） | レート制限エラー | （対象外） | 対象外（設計に同時接続/呼び出し回数制限なし） |
| タイムアウト・障害（IT-10） | 未捕捉停止しない・参照系で不整合なし（代替応答仕様は正典未定義） | 030,031 | カバー(手動/要実機・未定義挙動は仕様化しない) |
| 複数バリデーション一括返却・ソート順／決済代行／外部キャッシュ／転送再連携（IT-10 細目） | （該当処理なし） | （対象外） | 対象外（本APIはパス変数のみの参照系で該当処理が無い） |
| 在庫・数量・金額・履歴更新／外部連携／売上返品（IT-33） | （該当処理なし） | （対象外） | 対象外（参照系で更新・連携処理が無い） |

未カバーはいずれも理由（参照系GET APIで該当処理・I/Fが無い・設計に同時実行制限なし・ログ機密値はサーバログ実機観測・外部障害/タイムアウトは要実機）を明記済み。設計書の各節（利用者視点の入口・処理フロー・業務ルール・入出力・副作用・データ整合性・DB操作・権限認可・エラー処理）はAPI/統合レイヤへ写像し、正常×異常の対（正常取得001/004/017/018 ↔ 該当なし010/015/016・不正productId011/012・不正lang013・必須欠落007、資格情報の正常005 ↔ 異常資格情報008）を揃えた。本機能はブラウザ向け画面・管理画面反映を持たないためUIレイヤは0（正本md「ブラウザ向けの画面を持たない」）。
