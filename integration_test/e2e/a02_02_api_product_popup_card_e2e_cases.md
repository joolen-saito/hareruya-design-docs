# A02-02（ポップアップ用カード情報取得） E2Eテストケース

元設計md（正本一次）: `functions/pf-api/a02-02_api_product_popup_card.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a02-02_api_product_popup_card.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a02_02_api_product_popup_card_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わないJSON API（`GET /popup/card/{lang}/{cardId}`・参照のみ・副作用無し）であり、ブラウザ向け画面を持たない。したがってE2Eは **API/統合レイヤ（Playwright `request`）一本**で網羅し、UIレイヤは該当無し（0件）。API/統合レイヤはエンドポイントへGET送信し、HTTPステータス・応答本文（JSON）で判定する。

**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装のレスポンス形・HTTPライブラリ既定値・DBクエリの現挙動を期待値に流用しない（オラクル独立性）。本設計はpf-apiのリバース設計であり、挙動はpf-apiを正・DBスキーマはec-cube-enterpriseを正とするため、**基本設計・観点表を上位オラクル**とし、設計（pf-api挙動）と刷新先実装（ec-cube-enterprise）の乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・file:line）のみを取得し、取れないもの・認可方式は `要実機確認`。TSV は既存IT casesと同一の 10 列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | リクエスト（cardId異常値・想定外項目）・必須条件・レスポンス書式・データなし（該当なし404）・受信検証。資格情報（認可）はpf-api方針で要実機確認。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 正常取得のHTTPステータス・実行結果（1件返却）・外部取得（該当なし404）・リクエスト（foil_flg並び反映） |
| IT-19 | 同時実行数の制限／レート制限は設計に記載が無く対象外（理由付き） |
| IT-10 | HTTPステータス・通信・正常／異常系・該当なし応答。バリデーション一括返却/ソート順・外部キャッシュ形式不正/障害・タイムアウト・部分失敗転送は本機能に該当処理が無く対象外 |
| IT-33 | 数量・金額・履歴更新／外部連携売上返品は参照系APIに無く全件対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-001	IT-10	重複・順序	P1	有効なカードID・言語で200と商品情報JSONが返る	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	lang=jp（日本語想定）、cardId=存在する有効なカードID	"1. GET /api/popup/card/{lang}/{cardId} を送信する
2. HTTPステータスと応答本文を確認する"	HTTPステータス200で、カードID・言語に対応するポップアップ用商品情報がJSONで1件返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-002	IT-10	通信	P1	正常通信で200応答が返る	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardIdの正常リクエスト	"1. 対象エンドポイントへGET送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200（成功）であること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-003	IT-10	正常	P2	対象条件に該当する値で200・本文が処理結果と一致する	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	対象条件に該当する有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. HTTPステータスと応答本文を確認する"	HTTPステータス200で、応答本文が指定条件に一致する商品規格1件と一致すること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-004	IT-10	正常系	P1	取得値が参照時点のDB値と整合し副作用が無い	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. 応答各フィールドと呼び出し時点のDB値を照合する
3. 後続のDB状態を確認する"	応答の各フィールド値が呼び出し時点の商品規格情報と整合し、本APIによるデータ更新（副作用）が発生しないこと。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-005	IT-09	実行結果	P3	条件合致時に商品規格が1件返る	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. 応答本文の件数を確認する"	条件に合致する商品規格が1件のJSONとして返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-006	IT-09	HTTPステータス	P3	正常取得時のHTTPステータスが200である	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. HTTPステータスを確認する"	正常取得時のHTTPステータスが200であること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-007	IT-09	リクエスト	P3	foil_flg指定でフォイル区分の並び順が反映される	SEED-A02-02-CARD-FOIL／SEED-A02-02-AUTHZ	"foil_flg=真値（フォイル優先）／偽値、有効なlang・cardId"	"1. foil_flg=真値を指定してGET送信する
2. foil_flg=偽値を指定してGET送信する
3. 返却された商品規格を確認する"	foil_flg真値でフォイル区分が降順、偽値で昇順に並び、並び順先頭の商品規格1件が返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-008	IT-09	外部取得	P1	該当する商品規格が無い場合に404が返る	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	存在しないcardId	"1. 該当無しとなるcardIdでGET送信する
2. HTTPステータスを確認する"	該当する商品規格が無い場合、HTTPステータス404が返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-009	IT-32	レスポンス	P3	成功応答に仕様の全フィールドが含まれる	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. 応答本文のフィールドを確認する"	応答にproductId・name・productClassId・price01・price02・stock・nameEn・subFileName・fileName・code・conditionCode・beltUrl・weeklySoldが仕様通り含まれること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-010	IT-32	データなし	P3	該当なし時に404・本文がNot Foundである	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	該当が無いcardId	"1. 該当無しとなるcardIdでGET送信する
2. HTTPステータスと応答本文を確認する"	HTTPステータス404で、本文が{code, message}（message="Not Found"）の形で返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-011	IT-32	リクエスト	P3	cardIdが非整数・0以下の異常値では成功応答にならず商品情報が返らない	SEED-A02-02-AUTHZ	cardId=非整数（例 abc）または0以下の値	"1. 不正なcardId（非整数・0以下）でGET送信する
2. HTTPステータスと応答本文を確認する"	不正なcardId（非整数・0以下）では成功応答（HTTPステータス200・商品情報JSON）とならず商品情報が返らないこと。正典は異常cardId時の応答ステータスを定義せず404は「該当商品規格なし」のみ規定するため、返却ステータスの確定は要実機確認（付帯表4#11）。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-012	IT-32	リクエスト	P3	想定外のクエリ項目を加えても200で商品情報が返る	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	正常リクエストに想定外のクエリ項目（項目名と値のセット）を追加	"1. 想定外項目を含むGET送信する
2. HTTPステータスと応答本文を確認する"	想定外項目があっても5xxで停止せず、HTTPステータス200で商品情報が返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-013	IT-32	必須条件	P3	必須パスパラメータ欠落のリクエストは成功応答にならず商品情報が返らない	SEED-A02-02-AUTHZ	cardIdまたはlangを欠落させたパス	"1. 必須パスパラメータを欠落させてGET送信する
2. HTTPステータスと応答本文を確認する"	必須パスパラメータ（lang・cardId）欠落時は成功応答（HTTPステータス200・商品情報JSON）とならず商品情報が返らないこと。正典は欠落時の応答ステータスを定義しないため、返却ステータス（経路不一致時の404等）の確定は要実機確認（付帯表4#12）。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-014	IT-32	受信検証	P1	想定外のlang値でも未定義500で停止しない（200/404の確定は要実機確認）	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	lang=想定外値（jp/en以外。例 zz）、有効なcardId	"1. 想定外のlang値でGET送信する
2. HTTPステータスを確認する"	想定外のlang値でも未定義の500エラーで停止しないこと。jp/en以外のlang時に商品が取得され200となるか該当なし404となるかは、正典がlangをjp/enのみ規定し想定外値の挙動を定義しないため要実機確認（言語フォールバック挙動＝付帯表4#2）。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-015	IT-10	HTTPステータス	P1	異常リクエスト時のHTTPステータスが異常応答と一致する	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	該当無しとなる異常リクエスト	"1. 異常リクエストでGET送信する
2. HTTPステータスを確認する"	異常リクエスト（該当なし）時のHTTPステータスが異常を示す404であること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-016	IT-10	異常系	P2	異常系受信時の応答本文が処理結果と一致する	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	該当無しとなる異常リクエスト	"1. 異常系リクエストでGET送信する
2. HTTPステータスと応答本文を確認する"	異常系受信時のHTTPステータスと応答本文が処理結果（404・Not Found）と一致すること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-017	IT-10	異常系	P1	異常応答時も参照のみで状態不整合・二重処理が起きない	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	該当無し・エラー誘発リクエスト	"1. 異常リクエストでGET送信する
2. 応答と後続のDB状態を確認する"	異常応答時も本APIは参照のみで状態不整合・二重処理を起こさず、データが更新されないこと。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-018	IT-10	エラー	P3	設計定義のエラー応答（該当なし404）以外の未定義エラーで停止しない	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	正常な参照系リクエスト（正典は処理途中エラーの誘発手段・500応答を定義しない）	"1. 通常の参照系GETを送信する
2. HTTPステータスと応答本文を確認する"	正典が定義するエラー応答は「該当商品情報なし→404・Not Found」のみであり、参照系の通常処理が設計未定義の500等で停止しないこと。仕様に無い処理途中エラーの誘発（実装のcatch 500経路）は設計に観測可能な契機が無いため対象外とし、500応答書式・誘発条件は要実機確認（付帯表4#7）。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-019	IT-32	資格情報	P1	認可を満たすリクエストのみ処理され満たさないものは拒否される	SEED-A02-02-AUTHZ	認可資格情報あり／なしのリクエスト	"1. 認可資格情報を満たすリクエストでGET送信する
2. 認可資格情報を満たさないリクエストでGET送信する
3. 各応答を確認する"	認可方式（pf-apiの方針）に従い、資格情報を満たすリクエストのみ処理され、満たさないリクエストは拒否されること（認可方式の実体は要実機確認・付帯表4#8）。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-050	IT-09	リクエスト	P2	lang=enで英語優先の商品情報が返る	SEED-A02-02-CARD-MULTILANG／SEED-A02-02-AUTHZ	lang=en、同一cardIdにjp/en両言語の商品規格	"1. lang=enでGET送信する
2. 応答本文の言語コード・商品名を確認する"	lang=en指定時に英語優先で商品情報（英語商品名等）が返り、code（言語コード）が英語を示すこと。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-051	IT-32	レスポンス	P3	価格・在庫・週間販売数が数値文字列で返る	SEED-A02-02-CARD-PRODUCT／SEED-A02-02-AUTHZ	有効なlang・cardId	"1. 対象エンドポイントへGET送信する
2. price01/price02/stock/weeklySoldの型を確認する"	price01・price02・stock・weeklySoldが数値文字列（Doctrine decimal／SUM結果）として返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-052	IT-32	レスポンス	P3	画像が無い場合にsubFileName・fileNameがnullで返る	SEED-A02-02-NO-IMAGE／SEED-A02-02-AUTHZ	画像が紐づかない商品規格のcardId	"1. 対象エンドポイントへGET送信する
2. subFileName/fileNameの値を確認する"	商品規格画像・商品画像が無い場合、subFileName・fileNameがnullで返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-053	IT-09	リクエスト	P3	price指定で販売価格の並び順が反映される	SEED-A02-02-CARD-FOIL／SEED-A02-02-AUTHZ	price=high／その他の値／未指定	"1. price=highでGET送信する
2. price=その他の値でGET送信する
3. priceを未指定でGET送信する
4. 返却された商品規格を確認する"	price=highで販売価格の降順、それ以外の値で昇順、未指定時は価格での並びを行わず、並び順先頭の商品規格1件が返ること。
a02-02_api_product_popup_card（API_ポップアップ用カード情報取得）	E2E-A02-02-054	IT-32	受信検証	P2	境界のcardId値でも未定義500で停止せず該当なし404となる	SEED-A02-02-NONE／SEED-A02-02-AUTHZ	cardId=境界値（integer型上限付近の存在しない大きい整数）、有効なlang	"1. 境界のcardIdでGET送信する
2. HTTPステータスを確認する"	境界のcardId（integer型上限付近）でも未定義の500エラーで停止せず、DBに該当が無いためHTTPステータス404が返ること。
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route(path: '/api/popup/card/{lang}/{cardId}', name: 'popup_product_by_card_id', methods: ['GET'])]`（`src/Eccube/Controller/App/ProductController.php:265`）。`app_controllers` リソースは prefix 無し（`app/config/eccube/routes.yaml:5-7`）のため実効パスは `GET /api/popup/card/{lang}/{cardId}`。**設計書のパス `/popup/card/{lang}/{cardId}` と実装パス `/api/popup/card/...` は `/api` 接頭辞の有無で食い違う**（付帯表4#1）。送信先は実在経路へ届くよう実装の実効パス `GET /api/popup/card/{lang}/{cardId}` に統一し、合否は設計書の意味（成功＝200と商品情報、該当なし＝404、並び＝foil_flg/price反映）で判定する。取得処理は `ProductController::getPopupProductByCardId`（ProductController.php:266）→ `ProductRepository::findPopupProductByCardId(int $cardId, string $languageCode)`（`src/Eccube/Repository/ProductRepository.php:2226`）。応答整形は `PopupResponseBuilder::build`（`src/Eccube/Service/App/Popup/PopupResponseBuilder.php`）。該当なしは `NotFoundException('Not Found')`（ProductController.php:270,280）→ `{code, errors}` 応答（ProductController.php:291-295）。

| テストID | E2E可否 | 対象APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A02-02-001/002/003/004 | E2E自動化(API/統合) | `GET /api/popup/card/{lang}/{cardId}`（ProductController.php:265／routes.yaml:5-7） | 利用者視点の入口・処理フロー#1-4・レスポンス（成功）／IT-10 | IT-A02-02-...-037,026,027,034 |
| E2E-A02-02-005/006 | E2E自動化(API/統合) | `GET /api/popup/card/...`（ProductController.php:265）／1件取得=findPopupProductByCardId LIMIT 1（ProductRepository.php:2269） | 処理フロー#4・レスポンス（成功）「一件返す」／IT-09 | IT-A02-02-...-002,003 |
| E2E-A02-02-007 | E2E自動化(API/統合)（要実機確認: foil_flg反映） | `GET /api/popup/card/...`＋クエリ `foil_flg`（設計 入出力リクエスト）。**実装はメソッド引数に foil_flg を取らず並び固定**＝付帯表4#3 | 入出力 リクエスト foil_flg（真値降順/偽値昇順）／IT-09 | IT-A02-02-...-004 |
| E2E-A02-02-008/015/016/017 | E2E自動化(API/統合) | 該当なし `NotFoundException('Not Found')`（ProductController.php:270,280）→404 | 処理フロー#3・エラー処理・レスポンス（失敗）404／IT-09・IT-10 | IT-A02-02-...-024,025,030,035 |
| E2E-A02-02-009/051/052 | E2E自動化(API/統合) | 応答整形 `PopupResponseBuilder::build`（PopupResponseBuilder.php）／decimal数値文字列・null画像 | レスポンス（成功）フィールド表・業務ルール 応答値／IT-32 | IT-A02-02-...-032 |
| E2E-A02-02-010 | E2E自動化(API/統合)（要実機確認: 失敗本文キー） | 404本文。**設計は{code, message}／実装は{code, errors}**＝付帯表4#4 | レスポンス（失敗）`{code, message}`("Not Found")／IT-32 | IT-A02-02-...-033 |
| E2E-A02-02-011 | E2E自動化(API/統合)（要実機確認: 異常cardId時の返却ステータス） | cardId検証 `preg_match('/^\d+$/', $cardId) || (int)$cardId<1 → NotFound`（ProductController.php:269-271）／例外時 try-catch（ProductController.php:268,291,296）。**正典は異常cardId時の応答ステータスを定義せず404は該当なしのみ規定**＝付帯表4#11。期待は「成功応答にならない」に一般化し404固定にしない | 入出力 cardId（integer必須）・処理フロー#3・エラー処理／IT-32 | IT-A02-02-...-005 |
| E2E-A02-02-014/054 | E2E自動化(API/統合)（014の200/404確定は要実機確認） | 例外時 try-catch（ProductController.php:268,291,296）で500未定義経路を回避。**014=想定外lang**は `match(strtolower($lang)){'ja'=>'JP', default=>'EN'}`（ProductController.php:273-276）の既定フォールバックにより200/404どちらかが正典未定義＝要実機確認（付帯表4#2）。**054=境界cardId**はDB該当なし→404（ProductController.php:270,280） | 入出力 lang（jp/en想定）・cardId（integer必須）・受信検証で未定義500停止なし／IT-32 | IT-A02-02-...-036（想定外lang／境界cardIdに分割） |
| E2E-A02-02-012 | E2E自動化(API/統合) | `GET /api/popup/card/...`（ProductController.php:265）。未知クエリは無視 | 入出力（任意クエリ）・想定外項目で停止しない／IT-32 | IT-A02-02-...-006 |
| E2E-A02-02-013 | E2E自動化(API/統合)（要実機確認: 欠落時の返却ステータス） | パス必須パラメータ（ProductController.php:266 引数 lang・cardId）。欠落は経路不一致（Symfonyルーティング既定）。**正典は欠落時の応答ステータスを定義しない**＝付帯表4#12。期待は「成功応答にならない」に一般化し404固定にしない | 入出力 lang/cardId（必須）／IT-32 | IT-A02-02-...-031 |
| E2E-A02-02-018 | E2E自動化(API/統合)（仕様に無い500誘発は対象外・500応答書式は要実機確認） | 想定外例外 catch → `{code, errors:['Internal Server Error']}`500（ProductController.php:296-307）は設計未定義経路＝付帯表4#7。設計のエラー定義は該当なし404のみ（ProductController.php:270,280）。期待は設計由来の観測可能事象（404のみ定義・通常処理が未定義500で停止しない）に寄せ、500誘発は対象外 | エラー処理（該当なし404のみ定義・仕様に無い500誘発は対象外/要実機確認）／IT-10 | IT-A02-02-...-008 |
| E2E-A02-02-019 | 手動（要実機確認・認可方式） | 認可は `App` コントローラの認可方針に依存（ProductController.php:32 AbstractController 継承）。**設計は「認可方式はpf-apiの方針に従う」と明記＝実体は要実機確認**＝付帯表4#8 | 権限・認可（pf-api方針）／IT-32 | IT-A02-02-...-001 |
| E2E-A02-02-050 | E2E自動化(API/統合)（要実機確認: 言語コード対応） | 言語判定 `match(strtolower($lang)){'ja'=>'JP', default=>'EN'}`（ProductController.php:273-276）。**設計のlang想定値は jp/en・実装は ja/その他**＝付帯表4#2 | 入出力 lang（jp/en・言語優先順）・データ整合性 条件／IT-09 | IT-A02-02-...-004相当 |
| E2E-A02-02-053 | E2E自動化(API/統合)（要実機確認: price反映） | クエリ `price`（設計 入出力）。**実装はメソッド引数に price を取らず並び固定**＝付帯表4#3 | 入出力 リクエスト price（high降順/その他昇順/未指定なし）／IT-09 | （母集合外・設計書補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文・前提条件がDB列名等の機械的羅列）であり機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・処理フロー・入出力・エラー処理）を一次情報源としてAPI/統合レイヤで網羅した。本機能は画面を持たないためUIレイヤは0件。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a02_02_api_product_popup_card_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。本機能は画面を持たないため `自動化(UI)` は全件0。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 6 | 1 | 1 | リクエスト/必須/レスポンス/データなし/受信検証はHTTPステータス・本文で観測可。受信検証(行036)は想定外lang(014)/境界cardId(054)に2分割（同一母集合行ゆえ集計不変）。資格情報＝手動/要実機（認可pf-api方針）。バージョニング＝対象外（正典にAPIバージョン指定なし） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 実行結果・HTTPステータス・リクエスト（foil並び）・外部取得（404） |
| IT-19 | 1 | 0 | 0 | 0 | 1 | レート制限/同時実行数の制限は本機能の設計に記載が無く（参照系GETで制限定義なし）対象外（理由付き） |
| IT-10 | 18 | 0 | 8 | 0 | 10 | 通信/正常/正常系/異常系/HTTPステータス/重複・順序(=正常取得)/エラー はAPI/統合。バリデーション一括返却・ソート順(6)・外部キャッシュ形式不正/障害(2)・タイムアウト(1)・部分失敗転送(1)は該当処理なしで対象外 |
| IT-33 | 7 | 0 | 0 | 0 | 7 | 区分整合/エラー/外部取引/自動加算/実数更新/売上・返品/連携エラーは参照系APIに数量・金額・履歴更新・外部連携が無く全件対象外 |
| 合計 | 38 | 0 | 18 | 1 | 19 | **未分類 0** |

注1: 対象外19件の内訳は、IT-10 のバリデーション一括返却/ソート順6（本機能はパスパラメータのみで複数項目バリデーションの一括返却・ソート順を持たない）＋外部キャッシュ形式不正/障害2（本機能は外部キャッシュを使用しない）＋タイムアウト1（外部呼出/キャッシュが無くタイムアウト分岐の定義なし）＋部分失敗転送1（転送・再連携機能が無い）、IT-32 バージョニング1（正典にAPIバージョン指定なし）、IT-19 同時実行数の制限1（設計にレート制限記載なし）、IT-33 全7（参照系で更新処理なし）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 設計書 入出力（lang=en英語優先・decimal数値文字列・null画像・price並び）から母集合38行に直接対応行を持たない補完ケースを追加した。これらは母集合集計に算入せず別管理する。内訳＝自動化(API/統合) 4（050 lang=en／051 数値文字列／052 null画像／053 price並び）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 手動（要実機確認） | 019（認可方式はpf-api方針＝要実機確認） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 005 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 006 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 007（foil_flg並び。反映実装は要実機確認） |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 011（cardId異常値・成功応答にならないで判定・返却ステータスは要実機確認・付帯表4#11） |
| 006 | IT-32 | リクエスト | 自動化(API/統合) | 012（想定外項目） |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 本機能の設計にレート制限/同時実行数制限の記載が無く、参照系GETで制限定義なし |
| 008 | IT-10 | エラー | 自動化(API/統合) | 018（設計定義の404のみで判定・仕様に無い500誘発は対象外/500書式は要実機確認・付帯表4#7） |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本機能はパスパラメータのみで複数エラー本文の一括返却を持たない |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 同上 |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 同上 |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 対象外 | 外部呼出/キャッシュが無くタイムアウト分岐の定義なし（DB参照のみ） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン指定が無く、バージョン依存挙動は創作になるため |
| 017 | IT-33 | 区分整合 | 対象外 | 参照系APIで数量・区分別管理の更新処理が無い |
| 018 | IT-33 | エラー | 対象外 | 参照系APIで数量・金額・履歴の更新が無い |
| 019 | IT-33 | 外部取引 | 対象外 | 参照系APIで外部取引による数量・金額計算が無い |
| 020 | IT-33 | 自動加算 | 対象外 | 参照系APIで自動加算・連携元ID付き履歴作成が無い |
| 021 | IT-33 | 実数更新 | 対象外 | 参照系APIで実数更新が無い |
| 022 | IT-33 | 売上・返品 | 対象外 | 参照系APIで売上減算・返品加算が無い |
| 023 | IT-33 | 連携エラー | 対象外 | 参照系APIで連携元・連携先の更新整合対象が無い |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 008（該当なし404） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 015 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 002 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 003 |
| 028 | IT-10 | 形式不正 | 対象外 | 本機能は外部キャッシュを使用しない（観点が外部キャッシュ前提） |
| 029 | IT-10 | 障害 | 対象外 | 本機能は外部キャッシュを使用しない（観点が外部キャッシュ接続障害前提） |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 016 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 013（必須欠落・成功応答にならないで判定・返却ステータスは要実機確認・付帯表4#12） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 009（＋補完 051/052） |
| 033 | IT-32 | データなし | 自動化(API/統合) | 010 |
| 034 | IT-10 | 正常系 | 自動化(API/統合) | 004 |
| 035 | IT-10 | 異常系 | 自動化(API/統合) | 017 |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 014（想定外lang・200/404は要実機確認）＋054（境界cardId該当なし404）。同一母集合行を2分割 |
| 037 | IT-10 | 重複・順序 | 自動化(API/統合) | 001（IT-case期待結果が主正常系＝商品情報JSON返却） |
| 038 | IT-10 | 部分失敗 | 対象外 | 転送・再連携機能が無い（参照系・単一取得） |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 18（002,003,004,005,006,008,024,025,026,027,030,031,032,033,034,035,036,037）／手動・要実機 1（001）／対象外 19（007,009,010,011,012,013,014,015,016,017,018,019,020,021,022,023,028,029,038）。**未分類 0**（母集合38行）。母集合外の設計書補完ケースは別管理（050,051,052,053＝すべて自動化(API/統合)）。なお 054 は母集合行036（受信検証）を想定外lang(014)／境界cardId(054)へ2分割したサブケースであり、設計書補完（別管理）ではなく行036に内包＝母集合集計は不変（自動化(API/統合) 18・未分類0を維持）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A02-02-CARD-PRODUCT | dtb_product / dtb_product_class / dtb_product_stock / mtb_card / mtb_card_detail / mtb_language / mtb_card_condition | 有効なカード（mtb_card.id）＋カード明細（mtb_card_detail.foil_flg）＋商品（dtb_product.name・name_en・card_detail_id）＋商品規格（dtb_product_class.card_condition_id・language_id・belt_url・price01・price02・stock）＋在庫＋言語（mtb_language.code）。表示状態（product_status_id=表示）の1件。jp言語で引ける | fixture／migration | 専用カード・撤去可。参照のみで値変化なし | 001,002,003,004,005,006,009,012,014,018,051 |
| SEED-A02-02-CARD-MULTILANG | dtb_product_class / mtb_language | 同一cardIdに対し日本語(jp)・英語(en)双方の商品規格を持つ。言語優先順の判定で英語が選ばれる構成 | fixture／migration | 専用カード・撤去可 | 050 |
| SEED-A02-02-CARD-FOIL | dtb_product / mtb_card_detail / dtb_product_class | 同一cardIdにフォイル(foil_flg真)・非フォイル(偽)双方の明細、価格(price02)差のある複数規格 | fixture／migration | 専用カード・撤去可 | 007,053 |
| SEED-A02-02-NO-IMAGE | dtb_product_class / dtb_product_class_image | 画像（dtb_product_image）が紐づかない商品規格を持つカード | fixture／migration | 専用カード・撤去可 | 052 |
| SEED-A02-02-NONE | （存在しないID） | 商品規格が一切該当しないcardId（DBに存在しない値。054は integer型上限付近の境界値で該当なしを再現） | synthetic（存在しないID指定） | 後始末不要 | 008,010,015,016,017,054 |
| SEED-A02-02-AUTHZ | 認可資格情報（pf-api方針） | 本APIを呼び出せる認可資格情報。**認可方式の実体は設計が「pf-apiの方針に従う」と記すのみで要実機確認（付帯表4#8）** | env／fixture（環境ガード `test.skip`） | 環境隔離・撤去可。019は資格情報なしで拒否を再現 | 全ケース |

注: 本APIは参照のみ（副作用なし）でDBを更新しないため、各シードは初期化のみでべき等。テーブル名は ec-cube-enterprise を正典（dtb_product_class へ card_condition_id・language_id・belt_url 等を統合。現行pf-apiの補助表 dtb_product_sub_class とは配置が異なる＝設計「リニューアル移行時の扱い」）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典に従う。認可資格情報は環境変数で供給し、設計書・ログに原値を書かない（設計「ログに出してはいけないもの: API接続の認証情報」）。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（設計書・観点表・基本設計＝上位オラクル）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。設計はpf-api挙動を正とするリバース設計であり、下表は設計（pf-api挙動）と刷新先実装（ec-cube-enterprise）の食い違い。pf-api側の実挙動は要実機確認。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `GET /popup/card/{lang}/{cardId}`（利用者視点の入口） | `#[Route(path: '/api/popup/card/{lang}/{cardId}', methods: ['GET'])]`（ProductController.php:265）＋ app_controllers prefix無し（routes.yaml:5-7）＝実効 `GET /api/popup/card/...` | **設計パス `/popup/card/...` と実装パス `/api/popup/card/...` が `/api` 接頭辞の有無で不一致**。テストは実装実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | lang は `jp` または `en` を想定（言語優先順の判定）（入出力 リクエスト） | 言語判定 `match(strtolower($lang)){'ja'=>'JP', default=>'EN'}`（ProductController.php:273-276） | **実装は `ja`→日本語、それ以外（設計が想定する `jp` を含む）→英語にフォールバック**。設計の `jp` は実装で日本語に対応せず英語になる可能性＝想定値不一致。テストは設計（jp=日本語）で判定し、実装が違えば落ちて検出 | 001,050 | 不具合候補(言語コード想定値) |
| 3 | クエリ `foil_flg`（真値降順/偽値昇順）・`price`（high降順/その他昇順/未指定なし）を並び条件に反映（入出力 リクエスト） | 取得メソッド `getPopupProductByCardId(string $lang, string $cardId)`（ProductController.php:266）は foil_flg/price を引数に取らず、`findPopupProductByCardId(int $cardId, string $languageCode)`（ProductRepository.php:2226）の ORDER BY は固定（foil_flg ASC 等・ProductRepository.php:2258-2269）でクエリ値を受けない | **設計のクエリ条件 foil_flg/price が実装の取得処理に渡らず並びに反映されない可能性**。テストは設計に沿って「指定で並びが反映」を期待し、実装が無視すれば落ちて検出 | 007,053 | 不具合候補(クエリ未反映) |
| 4 | 失敗時本文は `{code, message}`（message="Not Found"）（レスポンス（失敗）） | 404は `NotFoundException('Not Found')`（ProductController.php:270,280）→ catch で `{code, errors}`（errors配列・ProductController.php:291-295） | **設計は `message` キー、実装は `errors` 配列キー**。合否は主にHTTPステータス404で判定し、本文キー名の差異を記録（テストは設計の `message` を期待） | 010 | 要確認(失敗本文キー) |
| 5 | 成功応答フィールドは設計の13項目（productId…weeklySold）。subFileName=商品規格画像、fileName=商品画像 | `PopupResponseBuilder::build` は subFileName・fileName とも同一の `imageFileName` を設定（PopupResponseBuilder.php build 内）。さらに設計に無い `productUrl` を付与 | **実装は subFileName と fileName に同一画像名を返し、設計が分ける2画像の区別が無い／余剰フィールド `productUrl` あり**。テストは設計の13フィールド存在を期待、余剰フィールドは合否にしない | 009,052 | 要確認(画像フィールド/余剰項目) |
| 6 | conditionCode＝カードコンディションコード（mtb_card_condition由来） | `CASE WHEN pc.memo != '' THEN pc.memo ELSE cc.code END`（ProductRepository.php:2238） | **実装は商品規格メモ(pc.memo)を優先し、無い時のみ card_condition.code を返す**。conditionCodeの算出元が設計（コンディションコード）と一致するか要実機確認 | 009 | 要確認(conditionCode算出元) |
| 7 | エラー処理は「該当商品情報なし→404・Not Found」のみ定義（エラー処理） | 想定外例外 catch で `{code, errors:['Internal Server Error']}` 500応答（ProductController.php:296-307）＋ log_error（ProductController.php:297） | **実装は設計未定義の500応答経路を持つ**。500時の応答書式は設計に無く要実機確認。テストは「未定義エラーで停止しない」を仕様で判定 | 018 | 要確認(500未定義) |
| 8 | 権限・認可: 「認可方式はpf-apiの方針に従う」（権限・認可） | `App\ProductController` は AbstractController 継承（ProductController.php:32）。認可（IP/トークン/署名等）の実体はコード上で本ルートに明示が無い | **設計が認可方式を pf-api 方針へ委譲しており、刷新先 App ルートの認可実体が未確定＝要実機確認**。テストは「資格情報を満たさないと拒否」を仕様で判定 | 019 | 要確認(認可方式) |
| 9 | ログに API接続の認証情報を出してはいけない（ログ・監査） | エラー時 `log_error('...', ['lang'=>..., 'card_id'=>..., 'error'=>...])`（ProductController.php:297-301）。認証情報は出力していないが網羅確認は実機 | 現状ログに認証情報は含まないが、全経路で機密値が出ないことは要実機確認 | 018 | 要確認(ログ機密値) |
| 10 | 成功応答の `price01`・`price02`・`stock`・`weeklySold` は string（数値文字列。Doctrine decimal／SUM結果。レスポンス（成功）フィールド表 型欄） | `PopupResponseBuilder::build` で `stock`・`weeklySold` を `(int)` キャスト、`findPopupProductByCardId` の ResultSetMapping（ProductRepository.php:2226〜）で `price01`・`price02` 等を integer 型としてマップ（int で返す） | **設計はレスポンス型を string（数値文字列）と定義する一方、実装は `stock`/`weeklySold` を int キャスト・RSM で `price01` 等を integer 扱いとし、レスポンス型の中核（金額・在庫・週間販売数の型）が string⇔int で不一致**。テストは設計の string 型を期待し、実装が int を返せば落ちて検出（期待値は仕様の string 型のまま） | 051,009 | 不具合候補(レスポンス型) |
| 11 | エラー処理は「該当商品情報なし→404・Not Found」のみ定義。cardIdはinteger必須だが**異常cardId（非整数・0以下）時の応答ステータスは正典に明示が無い**（エラー処理・入出力） | cardId検証 `preg_match('/^\d+$/', $cardId) || (int)$cardId<1 → NotFoundException('Not Found')`（ProductController.php:269-271）→404 | **設計は異常cardId時のステータスを定義せず、404は『該当商品規格なし』のみ規定**。実装は404を返すが、これを期待固定にせず観測可能期待を「成功応答（200・商品情報JSON）にならない」に一般化し、返却ステータス確定は要実機確認 | 011 | 要確認(異常cardId応答未定義) |
| 12 | lang・cardId はパス必須。**欠落時の応答ステータスは正典に明示が無い**（入出力・必須条件） | パス必須パラメータ欠落はルーティング段階で経路不一致（Symfony既定の応答） | **設計は欠落時のステータスを定義しない**。観測可能期待を「成功応答（200・商品情報JSON）にならない」に一般化し、返却ステータス（経路不一致時の404等）確定は要実機確認 | 013 | 要確認(必須欠落応答未定義) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（カードID・言語による取得／フォイル有無・価格条件／該当なし応答） | 正常取得・条件反映・404 | 001,007,008,053 | カバー |
| 利用者視点の入口（GET /popup/card/{lang}/{cardId}・JSON応答・該当なし404） | エンドポイント送信・200/404 | 001,002,008 | カバー（パス乖離は付帯表4#1） |
| 処理フロー#1（パス/クエリ受領） | lang/cardId・foil_flg/price受領 | 007,011,053 | カバー |
| 処理フロー#2（条件に対応する商品情報取得） | 言語・フォイル・価格条件で選択 | 003,007,050,053 | カバー（クエリ反映は付帯表4#3） |
| 処理フロー#3（取得不可→404 Not Found） | 該当なし404・Not Found本文 | 008,010,015 | カバー |
| 処理フロー#4（取得→JSON返却） | 200・商品情報1件JSON | 001,005,009 | カバー |
| 業務ルール・計算（再計算なし・取得値整形・参照のみ） | 副作用無し・取得値整合・数値文字列整形 | 004,051 | カバー |
| 入出力 リクエスト（lang必須jp/en・cardId必須integer・foil_flg任意・price任意） | 必須欠落404・cardId異常404・lang想定値・並び指定 | 013,011,050,007,053 | カバー（言語想定値は付帯表4#2） |
| 入出力 レスポンス（成功）13フィールド・decimal数値文字列・null画像 | フィールド存在・型・null | 009,051,052 | カバー（画像/余剰は付帯表4#5、数値文字列の型乖離は付帯表4#10） |
| 入出力 レスポンス（失敗）404 `{code, message}` Not Found | 404本文キー | 010 | カバー（キー差異は付帯表4#4） |
| 入出力 副作用（無し・参照のみ） | データ更新が起きない | 004,017 | カバー |
| 想定外項目・想定外パラメータでの停止防止 | 未知クエリ200・想定外値で500回避 | 012,014,054 | カバー（014の想定外lang時200/404は要実機確認・付帯表4#2） |
| エラー処理（該当なし→404） | 404応答 | 008,015,016 | カバー |
| 権限・認可（pf-api方針） | 認可を満たすもののみ処理・拒否 | 019 | カバー（手動/要実機・付帯表4#8） |
| ログ・監査（認証情報を出さない） | エラー時ログに機密値を含めない | 018 | カバー（要実機・付帯表4#9） |
| 排他制御・トランザクション（参照のみ・ロック対象なし） | （更新処理が無く検証対象なし） | （対象外＝参照系） | 対象外（理由付き） |
| バージョニング（IT-32） | （正典にAPIバージョン指定なし） | （対象外） | 対象外（バージョン依存は創作になる） |
| レート制限/同時実行数の制限（IT-19） | （設計に記載なし） | （対象外） | 対象外（参照系GETで制限定義なし） |
| 数量・金額・履歴更新／外部連携売上返品（IT-33） | （参照系で更新処理が無い） | （対象外7件） | 対象外（参照のみ・副作用なし） |
| バリデーション一括返却・ソート順／外部キャッシュ形式不正・障害／タイムアウト・部分失敗転送（IT-10細目） | （該当処理なし） | （対象外） | 対象外（パスパラメータのみ・外部キャッシュ/転送機能なし） |

未カバーはいずれも理由（参照系で更新・ロック処理なし・正典にAPIバージョン/レート制限記載なし・外部キャッシュ/転送機能なし）を明記済み。設計（pf-api挙動）と刷新先実装（ec-cube-enterprise）の乖離（パス・言語コード・クエリ反映・失敗本文・画像/余剰・500・認可・ログ・レスポンス型）は付帯表4で一元管理し、テストは上位オラクル（設計・観点表）どおりに期待値を置いた。本機能は画面を持たないためUIレイヤは0件、API/統合レイヤで正常×異常の対（正常取得001-007 ↔ 該当なし008/010/015-017、想定どおり012/014 ↔ 異常cardId011/必須欠落013）を揃えた。
