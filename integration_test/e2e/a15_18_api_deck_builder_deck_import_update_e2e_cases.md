# A15-18（デッキビルダー_デッキインポート更新） E2Eテストケース

元設計md（正本一次／pf-apiリバース）: `functions/pf-api/a15-18_api_deck_builder_deck_import_update.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a15-18_api_deck_builder_deck_import_update.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a15_18_api_deck_builder_deck_import_update_it_cases.md`（母集合 計90観点行）

本機能は**ブラウザ向けの画面を持たない**機能仕様（JWT認証つきPUT API＝デッキビルダー利用者がカードリストテキストで自所有の既存デッキを上書き更新する。正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）であり、**API/統合レイヤ単独で網羅**する。Playwright `request` で `PUT /api/deck/import/{id}` へ送信し、HTTPステータス・レスポンス本文（成功 `{code, message, deck_id}`／限定公開時 `display_token` 付加／解読不能行あり時 `errors` 付加・失敗 `{code, message}`）で判定する。更新副作用（デッキ本体の上書き・採用カード／メイビー／アトラクション／ステッカーの初期化と作り直し・更新対象外データの不変）は、永続化先テーブル（`dtb_deck`・`dtb_deck_card`・`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card`）を直接DB照合（DB副作用観測）して判定する。当該デッキのRedis上の下書き削除はec-cube-enterpriseのDBスキーマ対象外で、観測手段が本リポジトリから取れないため要実機確認とする。本機能は画面を持たないため、別機能（デッキビルダーアプリ画面・管理画面）の表示は合否条件にしない。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装のレスポンス形・バリデーション機構・HTTPライブラリ既定値・JWTクレーム名・trans文言を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdを上位オラクル、観点表（基本設計）と食い違う箇所も上位オラクルとして扱い、乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・認証方式・例外→ステータスの対応）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。仕様に定義の無いステータス／挙動は固定せず `要実機確認` とする。TSV は既存IT casesと同一の 10 列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

本機能は**更新（DB上書き）系**のため、DB更新観点（IT-26/IT-05）と入力検証観点（IT-22）を網羅に含める。正本md・実装には入力検証（バリデーション節＝採用カード・デッキ本体の整合性検証）とDB更新副作用（副作用節・DBカラム節＝既存カードの初期化と上書き保存）とトランザクション・ロールバック（排他制御節）が存在するが、既存IT casesの対象外観点表は「本機能に入力検証対象がないため」「該当する処理・I/Fがないため」と誤って除外している。これを上位オラクル（正本md・基本設計）に照らして補正し、入力検証（IT-22）・保存例外ロールバック（IT-05）を設計書補完ケースとして追加し、DB更新副作用は母集合のIT-27/IT-33（デッキ本体・採用カード・区分整合）経由で網羅した。当該誤分類は付帯表4#9に記録する。

正常×異常の対（インポート更新成功 ↔ 形式不正／未ログイン／所有者外／対象なし／部分更新なし・即時上書きのDB更新 ↔ 検証エラー時ロールバック・全行解読(code200) ↔ 解読不能行あり(code206)）を揃えた。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-09 | 正常更新のHTTPステータス・実行結果・正常パラメータ・成功レスポンス本文（`code:200`・`deck_id`） |
| IT-16 | 更新インポート実行結果一致・card_list行数の境界（最大長500行成功／最大長+1超過→400／最小長＝空で成功）・deck_id返却。計算処理は本APIに金額・在庫の再計算が無く対象外 |
| IT-17 | フォーマット定義（`format_id`必須／カードリスト解読／デッキ内容の整合性検証→400・更新の有無） |
| IT-19 | 同時実行数の制限（本APIは排他制御を持たず後勝ち。実再現は手動） |
| IT-24 | 出力内容（成功本文・`message`・`scope_id`/`display_token`・解読不能行→`errors`・全行解読→`errors`なし・対象なし→404）。POST（新規登録）は本書対象外、計算処理は対象外 |
| IT-27 | デッキ本体（`dtb_deck`）上書き・採用カード（`dtb_deck_card`）初期化と作り直し・ボード外区分（メイビー／アトラクション／ステッカー）初期化・配置先（更新反映）・JSON応答。トランザクション・下書き整合は手動／要実機 |
| IT-32 | 資格情報（JWT認証）・受信検証・レスポンス書式・異常パラメータ→400。想定外項目は正本mdに未定義項目の許容/無視仕様が無く手動・要実機（仕様化待ち）。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-33 | 対象機能（正常更新・未認証時の不変）・区分整合（更新対象外の別デッキ・他プレイヤーデッキが不変）・検証エラー時の部分更新なし。外部取引由来の加減算は本APIに非該当で対象外 |
| IT-10 | エラー（署名不正→401・該当プレイヤーなし→401・複数違反同時→400・タイムアウト）。複数件のソート順／相関バリ／DB相関バリは正典に定義が無い／本機能に該当処理が無く対象外 |
| IT-22 | （設計書補完）採用カード・デッキ本体の整合性検証（入力検証）未充足で入力不正（400・本文`{code, message}`） |
| IT-05 | （設計書補完）保存処理中の例外時にトランザクションをロールバックし処理失敗（500）・部分更新が残らない |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-001	IT-09	リクエスト	P1	正常パラメータでPUTし200が返る	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	"有効なjwt-tokenヘッダ
所有デッキIDのパス・format_id・全行解読できるcard_list・正常な更新リクエスト"	"1. 所有デッキIDへ PUT /api/deck/import/{id} でリクエストを送信する
2. HTTPステータスを確認する"	インポート更新成功としてHTTPステータス200が返ること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-002	IT-09	実行結果	P3	更新実行後の処理結果が一致する	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・正常な更新リクエスト	"1. 所有デッキIDへPUTでリクエストを送信する
2. レスポンスと後続状態を確認する"	インポート更新処理が実行され、処理結果（成功）がレスポンスと一致すること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-003	IT-09	HTTPステータス	P1	成功時のHTTPステータスが200で本文がcode=200を含む	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・正常な更新リクエスト	"1. 所有デッキIDへPUTでリクエストを送信する
2. HTTPステータスとレスポンス本文を確認する"	HTTPステータス200が返り、成功レスポンス本文が `code:200` を含むこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-004	IT-32	レスポンス	P2	成功レスポンス書式がcode・message・deck_idを持つ	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・全行解読できる正常リクエスト（scope_id=公開）	"1. 所有デッキIDへPUTでリクエストを送信する
2. レスポンス本文の書式を確認する"	成功時のレスポンス書式が仕様の `{code, message, deck_id}`（snake_caseキー）であること（messageの文言は付帯表4#4の乖離記録に従い要確認）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-005	IT-32	資格情報	P1	有効なJWTで更新が成功する	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token（該当プレイヤーあり・対象デッキの所有者）・正常リクエスト	"1. 有効なjwt-tokenを付与してPUTで送信する
2. HTTPステータスを確認する"	資格情報が有効な場合、HTTPステータス200で更新が成功すること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-006	IT-32	受信検証	P1	整合性検証を満たすリクエストで更新成功200となる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	採用カード・デッキ本体の整合性検証を満たすリクエスト	"1. 所有デッキIDへPUTで送信する
2. HTTPステータスを確認する"	採用カード・デッキ本体の整合性検証を満たし、HTTPステータス200で更新が成功すること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-007	IT-16	実行結果	P2	デッキ更新インポートの取り込み結果が対象データと一致する	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・card_listを指定した正常リクエスト	"1. 所有デッキIDへPUTで送信する
2. レスポンスとDB副作用（更新後のデッキ内容）を照合する"	card_listを解読した取り込み結果が対象データ（更新後のデッキ内容）と一致すること（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-008	IT-24	出力内容	P2	更新成功時のmessageが更新メッセージである	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・パスにデッキ識別子を持つPUT（更新）リクエスト	"1. 所有デッキIDへPUTで送信する
2. レスポンス本文のmessageを確認する"	パスにデッキ識別子を持つPUT（更新）として処理され、成功本文のmessageが更新を示す「Deck update success by import」であること（実装はローカライズ文言＝付帯表4#4の乖離記録に従い、文言一致は要確認）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-009	IT-16	エラー	P2	成功本文に更新したデッキのdeck_idが返る	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・所有デッキID（既知）への正常リクエスト	"1. 所有デッキIDへPUTで送信する
2. レスポンス本文のdeck_idを確認する"	成功本文の `deck_id` が更新対象デッキの識別子（パスの既知ID）と一致すること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-020	IT-32	資格情報	P1	jwt-tokenヘッダ欠落で401となり更新されない	SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	jwt-tokenヘッダを付与しないリクエスト	"1. jwt-tokenヘッダ無しでPUTで送信する
2. HTTPステータスとデッキ状態を確認する"	認証拒否を示すHTTPステータス401が返り、対象デッキが更新されないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-021	IT-10	エラー	P1	署名不正のJWTで401となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	署名検証に失敗するjwt-token（署名シークレット不正）	"1. 署名不正のjwt-tokenでPUTで送信する
2. HTTPステータスとデッキ状態を確認する"	署名検証に失敗し、認証拒否を示すHTTPステータス401が返り、対象デッキが更新されないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-022	IT-10	エラー	P1	該当するプレイヤーが無いJWTで401となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	顧客IDに該当するプレイヤーが存在しないjwt-token	"1. 該当プレイヤーなしのjwt-tokenでPUTで送信する
2. HTTPステータスとデッキ状態を確認する"	JWTの顧客IDからプレイヤーを特定できず、HTTPステータス401が返り更新されないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-023	IT-33	対象機能	P1	他人のデッキを更新しようとすると401となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK（別プレイヤー所有デッキ）／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token（認証プレイヤー）・認証プレイヤーが所有しないデッキIDを指定	"1. 他人所有のデッキIDへPUTで送信する
2. HTTPステータスとDB副作用（対象デッキ）を照合する"	所有者でないため認証拒否を示すHTTPステータス401（「Authentication failed」）が返り、対象デッキが更新されないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-024	IT-33	対象機能	P1	未認証・トークン不正時に対象レコードの値が変更されない	SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	jwt-token欠落または不正なトークン・対象デッキID	"1. 未認証（または不正トークン）でPUTで送信し401を確認する
2. DB副作用（対象デッキのデッキ本体・採用カード）を受信前と照合する"	未認証・トークン不正時は対象デッキのデッキ本体・採用カードの値が受信前から変更されないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-030	IT-24	フォーマット定義	P1	存在しないデッキIDで404となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・該当しないデッキID	"1. 存在しないデッキIDへPUTで送信する
2. HTTPステータスと後続状態を確認する"	該当なしを示すHTTPステータス404（「The deck does not exist」）が返り、更新が行われないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-040	IT-17	フォーマット定義	P2	format_id未指定で400となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・format_idを含まない（または不正な）リクエスト	"1. format_id未指定のリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	format_idは必須のため、入力不正を示すHTTPステータス400・本文 `{code, message}` が返り更新されないこと（messageの文言は付帯表4#4の要確認に従う）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-041	IT-16	実行結果	P1	card_listが501行（上限超過）で400となる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・501行（上限500行＋1）のcard_list	"1. 501行のcard_listを含むリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	カードリストが上限行数（500行）を超えるため、入力不正を示すHTTPステータス400・本文 `{code, message}` が返ること（正本md 入出力・バリデーション・エラー処理節どおり期待値を固定する。実装が上限超過時にSymfony既定応答形となり `{code, message}` 形にならない差異は付帯表4#7の不具合候補で記録し、期待は仕様どおり落として検出する）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-042	IT-16	実行結果	P2	card_listが500行ちょうど（上限）で更新が成功する	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・全行解読できる500行（上限ちょうど）のcard_list	"1. 500行のcard_listを含むリクエストをPUTで送信する
2. HTTPステータスを確認する"	カードリストが上限行数（500行）以内のため、エラーとならずHTTPステータス200で更新が成功すること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-043	IT-17	フォーマット定義	P1	デッキ内容の整合性検証失敗で400となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・採用カードまたはデッキ本体の整合性検証に失敗するリクエスト	"1. 整合性検証に失敗するリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	入力不正を示すHTTPステータス400・本文 `{code, message}`（messageは検証エラー内容）が返り、更新されないこと（messageの文言は付帯表4#4の要確認に従う）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-044	IT-10	エラー	P2	複数の整合性違反を同時に含むリクエストで400となる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・採用カードとデッキ本体に複数の整合性違反を同時に含むリクエスト	"1. 複数の整合性違反を含むリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	複数の整合性違反を同時に含む場合もHTTPステータス400・本文 `{code, message}` が返ること（複数違反を個別に全件列挙する返却構造・ソート順は正典に定義が無く付帯表4#5の要確認に従い固定しない）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-045	IT-32	リクエスト	P2	異常なパラメータ値で400となる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・整合性検証に失敗する異常なパラメータ値を設定	"1. 異常なパラメータ値でPUTで送信する
2. HTTPステータスを確認する"	異常なパラメータ値の実行結果としてHTTPステータス400が返ること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-050	IT-24	出力内容	P1	解読できない行があるとcode206でerrorsに行番号が返る	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・一部の行がカード名未一致（解読不能）で、形式自体は妥当なcard_list	"1. 解読できない行を含むcard_listでPUTで送信する
2. HTTPステータスとレスポンス本文のcodeとerrorsを確認する"	解読できない行がある場合、HTTPステータスが206に切り替わり、レスポンス本文の `code` も206となって `errors` に該当行の行番号（0始まりインデックス）配列が返ること（正本md レスポンス節「HTTP 200（解読できない行がある場合はHTTP 206）」どおりHTTPステータス206を期待値に固定する。実装はHTTPステータス・本文codeとも200のままerrors配列のみ付加＝付帯表4#2の乖離。テストは正本md仕様の206で判定し落とす）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-051	IT-24	出力内容	P1	解読できない行があっても更新自体は完了する	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・一部の行が解読不能なcard_list	"1. 解読できない行を含むcard_listでPUTで送信する
2. DB副作用（更新後のデッキ内容）を照合する"	解読できない行があっても更新は中断せず完了し、解読できた行の内容でデッキが更新されること（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-052	IT-24	出力内容	P2	全行解読できた場合はcode200でerrorsを含まない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・全行解読できるcard_list	"1. 全行解読できるcard_listでPUTで送信する
2. レスポンス本文のcodeとerrorsの有無を確認する"	全行を解読できた場合、レスポンス本文の `code` が200で、`errors` フィールドを含まないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-060	IT-24	出力内容	P1	公開区分が限定公開のとき応答にdisplay_tokenを含む	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・scope_id=限定公開・正常リクエスト	"1. scope_id=限定公開でPUTで送信する
2. レスポンス本文を確認する"	公開区分が限定公開の場合、成功本文に表示用トークン `display_token` が含まれること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-061	IT-24	出力内容	P2	公開区分が公開・非公開のとき応答にdisplay_tokenを含まない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・scope_id=公開または非公開	"1. scope_id=公開／非公開でPUTで送信する
2. レスポンス本文を確認する"	公開区分が限定公開以外の場合、成功本文に `display_token` が含まれないこと。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-062	IT-16	実行結果	P2	card_list未指定・空のとき空のカード配列として200で更新される	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・card_listを未指定または空文字で指定	"1. card_list未指定（空）でPUTで送信する
2. HTTPステータスとDB副作用（採用カード）を照合する"	card_list未指定・空のときは空のカード配列として扱われ、HTTPステータス200で更新が成功し採用カードが空になること（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-070	IT-27	実行結果	P1	既存デッキ本体が指定値へ上書き更新される	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・deck_name/format_id/archetype_id/scope_id/image_card_idを指定	"1. 所有デッキIDへPUTで送信する
2. DB副作用（dtb_deckのデッキ名・フォーマット・アーキタイプ・非公開フラグ・本文）を照合する"	既存デッキ本体（デッキ名・フォーマット・アーキタイプ・非公開フラグ・本文）が指定値へ上書き更新されること（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-071	IT-27	実行結果	P1	採用カードが初期化されカードリスト解読結果で作り直される	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK（既存採用カードあり）／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・既存と異なる内容のcard_list	"1. 所有デッキIDへPUTで送信する
2. DB副作用（dtb_deck_card）を照合する"	既存の採用カード（dtb_deck_card）が初期化され、card_list解読結果で作り直され、旧採用カードが残らないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-072	IT-27	削除	P1	メイビー・アトラクション・ステッカーが初期化され作り直される	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK（既存ボード外カードあり）／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・ボード外区分を含むcard_list	"1. 所有デッキIDへPUTで送信する
2. DB副作用（dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を照合する"	既存のメイビー・アトラクション・ステッカーが初期化され作り直され、旧レコードが取得結果に含まれないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-073	IT-33	区分整合	P1	更新後に更新対象外の別デッキ・他プレイヤーデッキが不変	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK（対象デッキ＋別デッキ）／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・対象デッキのみを更新する正常リクエスト	"1. 対象デッキIDへPUTで送信し200を確認する
2. DB副作用（更新対象外の別デッキ・他プレイヤーデッキのデッキ本体・採用カード）を照合する"	更新対象外の別デッキ・他プレイヤーデッキのデッキ本体と採用カードが更新前と一致し変動しないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-074	IT-33	エラー	P1	検証エラー時にデッキ本体・採用カードが部分更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・整合性検証に失敗するリクエスト	"1. 検証エラーとなるリクエストをPUTで送信し400を確認する
2. DB副作用（対象デッキのデッキ本体・初期化対象の採用カード）を受信前と照合する"	検証エラー時はトランザクションがロールバックされ、デッキ本体・採用カード（初期化対象を含む）がDB副作用上で受信前と一致し部分更新が残らないこと（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-075	IT-27	配置先	P2	更新後もデッキ識別子は同一のまま内容が上書きされる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・所有デッキID（既知）への正常リクエスト	"1. 所有デッキIDへPUTで送信する
2. レスポンスのdeck_idとDB副作用（dtb_deckの識別子）を照合する"	デッキ本体は同一識別子のまま内容が上書きされ、応答 `deck_id` とDB上の識別子がパスのIDと一致すること（DB副作用で判定）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-081	IT-27	実行結果	P3	更新確定後に当該デッキのRedis下書きが削除される	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK（Redis下書きあり）／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・当該デッキのRedis下書きが存在する状態・正常リクエスト	"1. 当該デッキのRedis下書きがある状態でPUTを送信する
2. Redis下書きの有無を確認する"	更新の保存後に当該デッキのRedis上の下書きが削除され、保存済みデータと下書きの不整合が解消されること（Redis観測手段が本リポジトリから取れないため要実機確認。実装に下書き削除処理が見当たらない点は付帯表4#8の要確認）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-090	IT-19	同時実行数の制限	P3	同一デッキの同時更新で片側更新の不整合が残らない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・同一デッキへの並行する2リクエスト	"1. 同一デッキへ2リクエストを並行してPUTで送信する
2. 最終状態を確認する"	本APIは排他制御を持たず同時更新は後勝ちとなり、いずれか一方の更新が一貫して反映され、デッキ本体・採用カードが片側だけ更新された不整合が残らないこと（並行送信の実再現は要実機確認）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-091	IT-32	リクエスト	P3	想定外項目追加時の挙動が要実機確認・仕様化待ちである	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	正常リクエストに仕様未定義の想定外項目（項目名と値のセット）を追加	"1. 想定外項目を含むリクエストをPUTで送信する
2. HTTPステータスを確認する"	正本mdに未定義項目の許容/無視/エラーの仕様が無いため、想定外項目追加時の更新成否を固定期待にできず、許容・無視・エラーいずれの挙動とするかは要実機確認・仕様化待ちであること。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-092	IT-10	エラー	P3	処理タイムアウト時に仕様どおりの応答となる	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPUTで送信する
2. 応答とデッキ状態を確認する"	サーバ無応答・未定義例外で停止せず、エラー応答が返り、対象デッキが部分更新されず一致すること（タイムアウト実再現は要実機確認）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-110	IT-22	バリデーション	P2	採用カードの制約を満たさないと400となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・解読結果の採用カード（メイビー・アトラクション・ステッカーを含む）がボード区分ごとの制約を満たさないcard_list	"1. 採用カードの制約に違反するリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	ボード区分ごとに組み立てた採用カードの制約が未充足の場合、入力不正としてHTTPステータス400・本文 `{code, message}` が返り更新されないこと（messageの文言は付帯表4#4の要確認に従う）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-111	IT-22	バリデーション	P2	デッキ本体の制約を満たさないと400となり更新されない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・フォーマット・公開区分・採用カードを設定したうえでデッキ本体の制約を満たさないリクエスト	"1. デッキ本体の制約に違反するリクエストをPUTで送信する
2. HTTPステータスとレスポンス本文を確認する"	デッキ本体の制約が未充足の場合、入力不正としてHTTPステータス400・本文 `{code, message}`（messageは検証エラー内容）が返り更新されないこと（messageの文言は付帯表4#4の要確認に従う）。
a15-18_api_deck_builder_deck_import_update（API_デッキビルダー_デッキインポート更新）	E2E-A15-18-150	IT-05	実行結果	P3	保存処理中の例外時にロールバックし部分更新が残らない	SEED-A15-18-JWT-PLAYER／SEED-A15-18-DECK／SEED-A15-18-MASTER／SEED-A15-18-PAYLOAD	有効なjwt-token・保存処理中の例外を誘発するシナリオ	"1. 保存例外を誘発してPUTで送信する
2. 応答とDB副作用（デッキ本体・採用カード）を照合する"	保存処理中に例外が発生した場合はトランザクションをロールバックし処理失敗（HTTP 500）として応答し、デッキ本体・採用カードが受信前と一致し部分更新が残らないこと（例外の実再現は要実機確認）。
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route('/api/deck/import/{id}', name: 'api_deck_builder_deck_import_put', methods: ['PUT', 'OPTIONS'], requirements: ['id' => '\d+'])]`（`src/Eccube/Controller/App/DeckBuilder/DeckController.php:677`）。実効パスは `PUT /api/deck/import/{id}`。**正本mdのパス `PUT /deck/import/{id}` は `/api` プレフィクスを欠き実装と食い違う。送信先パスは実装の実効パス `/api/deck/import/{id}` に統一し、合否は正本mdの意味（成功＝code:200・更新message・deck_id、解読不能行あり＝code:206＋errors、認証＝JWT検証の通過/拒否、所有者外＝認証拒否401、対象なし＝404、format_id未指定/整合性検証＝400、副作用＝既存カード初期化と上書き保存のDB更新）で判定する。差異は付帯表4#1で一元管理し、TSV本体の期待値には設計パスを混在させない**。POST（`POST /api/deck/import`＝DeckController.php:667）とPUTは `handleImportDeck`（DeckController.php:685）を共有し、パスのデッキ識別子の有無（PUT＝id非null／POST＝null）で更新/新規を分岐する。本書はPUT（更新）のみを扱い、POST（新規登録）はデッキ登録インポートAPI（a15-09相当）の範囲で本書対象外。JWT認証は `jwt-token` ヘッダを直接読み（DeckController.php:686）`ImportDeckAction->handle`（ImportDeckAction.php:59）で `JwtPlayerAuthenticator->authenticate`（ImportDeckAction.php:59）→`JwtTokenService->verifyToken` を経て検証する。署名方式はHS256（正本md 認証・認可節）。トークン欠落/署名不正→`InvalidTokenException`→401、JWTの顧客IDに該当プレイヤーなし→`PlayerNotFoundException`→401（DeckController.php:697-701／ImportDeckAction.php:60-61。プレイヤー特定＝`findOneBy(['Customer'=>(int)$sub])`＝JwtPlayerAuthenticator.php:52）、所有者外→`DeckAccessDeniedException`→**401**（DeckController.php:702-706／ImportDeckAction.php:71-75＝正本md仕様401と一致）、対象デッキなし→`DeckNotFoundException`→404（DeckController.php:707-711／ImportDeckAction.php:69）、フォーマット不存在→`FormatNotFoundException`→**404**（DeckController.php:712-716／ImportDeckAction.php:86＝正本md未定義の404＝付帯表4#6）、format_id未指定→`InvalidRequestException('format_id is required')`→400（DeckController.php:719-723／ImportDeckAction.php:78-82）、整合性検証失敗→`BadRequestHttpException`→`InvalidRequestException`→400（DeckController.php:725／ImportDeckAction.php:140-149・`validateDeck`＝ImportDeckAction.php:161-172）、保存例外→`SystemErrorException`→500（ImportDeckAction.php:150-153）。card_list上限超過/不正行→`BadRequestHttpException`（CardUtil.php:53-54,161,169）はトランザクション外（ImportDeckAction.php:96）で送出されコントローラのcatch対象外のため、Symfony既定で400となるが本文が `{code, message}` 形でない可能性（付帯表4#7）。即時上書きは `beginTransaction`（ImportDeckAction.php:99）→`buildSaveData`→`save`（既存カード初期化を含む）→`validateDeck`→`flush`→採用カード/メイビー/アトラクション/ステッカー再登録→`flush`→`commit`（ImportDeckAction.php:99-139）、例外時 `rollback`（ImportDeckAction.php:141-152）。成功応答は `code:200`・`message`（trans）・`deck_id`、`scope_id===DISPLAY_UNLISTED`（限定公開）のとき `display_token` を付加、`errors!==[]` のとき `errors` を付加（DeckController.php:729-744）。**正本mdは解読不能行あり時にコードを206へ切り替える（利用者視点の入口・処理フロー#7・レスポンス節）が、実装はHTTPステータス・本文codeとも200のまま `errors` 配列のみ付加する＝付帯表4#2**。本APIはブラウザ向け画面を持たないため、更新副作用は永続化先テーブル（`dtb_deck`・`dtb_deck_card`・`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card`＝正本md DBカラム節・リニューアル移行表）を直接DB照合（DB副作用観測）して判定し、別機能のデッキビルダーアプリ画面・管理画面の表示は合否条件にしない。下書き保存先のRedisはec-cube-enterpriseのDBスキーマ対象外であり、Redis下書き削除の観測手段は本リポジトリから取れず要実機確認とする。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A15-18-001/002/003/004/005/006/007/008/009 | E2E自動化(API/統合) | `PUT /api/deck/import/{id}`（DeckController.php:677）・成功応答`code:200`＋message＋deck_id（DeckController.php:729-733） | 利用者視点の入口・処理フロー#4-6・レスポンス(成功)`{code:200, message, deck_id}`／IT-09・IT-16・IT-24・IT-32 | IT-A15-18-...-004,073,074,075,063,025,027,015,017,018,049,053 |
| E2E-A15-18-020/021/022 | E2E自動化(API/統合) | `jwt-token`ヘッダ直接読み（DeckController.php:686）＋`authenticate`（ImportDeckAction.php:59）／トークン欠落・署名不正→`InvalidTokenException`→401・該当プレイヤーなし→`PlayerNotFoundException`→401（DeckController.php:697-701／ImportDeckAction.php:60-61）／要実機確認: HS256署名検証の実方式・署名シークレット | 認証・認可（jwt-token/HS256・ヘッダ欠落/署名不正/該当プレイヤーなし＝401・正本md認証・認可節:72-76）・処理フロー#1／IT-32・IT-10 | IT-A15-18-...-004,007,030,031,042,074,077 |
| E2E-A15-18-023/024 | E2E自動化(API/統合) | 所有者外→`DeckAccessDeniedException`→401「Authentication failed」（DeckController.php:702-706／ImportDeckAction.php:71-75）。一次オラクル＝APIレスポンス401＋DB副作用（対象デッキ不変）。024＝未認証時のDB不変 | 認証・認可（所有者でない/未認証＝401・正本md:74-76）・処理フロー#3・権限認可節・エラー処理節／IT-33 | IT-A15-18-...-028,029,031,064,065,066 |
| E2E-A15-18-030 | E2E自動化(API/統合) | 対象デッキなし→`DeckNotFoundException`→404「The deck does not exist」（DeckController.php:707-711／ImportDeckAction.php:69） | 処理フロー#2・エラー処理(デッキなし→404)・レスポンス(失敗)404／IT-24 | IT-A15-18-...-032,067 |
| E2E-A15-18-040 | E2E自動化(API/統合) | format_id未指定/不正→`InvalidRequestException('format_id is required')`→400（DeckController.php:719-723／ImportDeckAction.php:78-82）。レスポンス(失敗)`{code, message}` | 入出力(format_id必須)・バリデーション節(format_id)・処理フロー#4／IT-17 | IT-A15-18-...-011,021 |
| E2E-A15-18-041/042 | E2E自動化(API/統合) | card_list上限500行＝`MAX_LINE_COUNT`（CardUtil.php:26）・超過→`BadRequestHttpException`（CardUtil.php:53-54）。041＝501行→400・本文`{code,message}`を期待値に固定（実装のSymfony既定応答形との差異は付帯表4#7の不具合候補で落として検出）・042＝500行ちょうど→200 | 入出力(カードリスト上限500行・超過→400)・バリデーション節(card_list)／IT-16 | IT-A15-18-...-009,008,033,068 |
| E2E-A15-18-043/044/045 | E2E自動化(API/統合) | 整合性検証失敗→`validateDeck`→`BadRequestHttpException`→`InvalidRequestException`→400（DeckController.php:725／ImportDeckAction.php:140-149,161-172）。044＝複数違反は空白結合で1メッセージ化（付帯表4#5。複数違反同時でも400を確認し全件個別列挙の構造は固定しない） | 処理フロー#5・バリデーション節(採用カード・デッキ本体の整合性検証・未充足→400)・レスポンス(失敗)400／IT-17・IT-10・IT-32 | IT-A15-18-...-021,056,079,080,076 |
| E2E-A15-18-050/051/052 | E2E自動化(API/統合) | 解読不能行→`errors`記録（ImportDeckAction.php:155-159・CardUtil decodeCardList の errors）。正本mdはHTTP・本文codeとも206へ切替（利用者視点・処理フロー#7・レスポンス節）だが実装はHTTPステータス・本文codeとも200のままerrors付加（DeckController.php:740-744）＝付帯表4#2。050＝HTTPステータス206・本文code206を期待値に固定し実装の200を落として検出。051＝解読できた行で更新完了をDB副作用照合。052＝全行解読でerrors無し | 利用者視点の入口・処理フロー#7・レスポンス(成功)(206・errors)・エラー処理(解読できない行あり)／IT-24 | IT-A15-18-...-034,069,055 |
| E2E-A15-18-060/061 | E2E自動化(API/統合) | `display_token` 付加条件＝`scope_id===self::DISPLAY_UNLISTED`（DeckController.php:735-738） | レスポンス(成功)・処理フロー#6（限定公開時のみ表示用トークン応答）・DBカラム節(display_token)／IT-24 | IT-A15-18-...-005,019,036,040,051,054 |
| E2E-A15-18-062 | E2E自動化(API/統合) | card_list未指定/空→空カード配列（正本md 入出力 card_list 任意）。DB副作用（採用カード空）照合 | 入出力(card_list任意・未指定/空は空配列)・バリデーション節／IT-16 | IT-A15-18-...-010,047 |
| E2E-A15-18-070/071/072/075 | E2E自動化(API/統合) | DB副作用照合（`dtb_deck`＝deck_name/format_id/archetype_id/private_flg/本文・上書き＝ImportDeckAction.php:101-117／採用カード初期化を含む`save`＋再登録`saveDeckCard`/`saveMaybeCard`/`saveAttractionCard`/`saveStickerCard`＝ImportDeckAction.php:125-136）。本APIは画面を持たず別機能の画面表示は合否にしない | 副作用節(既存カード初期化して上書き保存)・DBカラム節・データ整合性(更新の有無・同一識別子)・処理フロー#5／IT-27 | IT-A15-18-...-002,003,025,026,027,037,038,039,060,061,062,071,072 |
| E2E-A15-18-073/074 | E2E自動化(API/統合) | 一次オラクル＝APIレスポンス（200／400）＋DB副作用（`dtb_deck`・採用カード各テーブルをDB照合）。073＝更新対象外データ不変・074＝整合性検証失敗時`rollback`（ImportDeckAction.php:141-149） | データ整合性(更新範囲)・バリデーション(検証エラー時は確定しない)・排他制御トランザクション(ロールバック)・処理フロー#5／IT-33 | IT-A15-18-...-088,089 |
| E2E-A15-18-081 | 手動（要実機確認・Redis観測手段／下書き削除処理） | 正本md副作用節は「当該デッキのRedis下書きを削除」と定めるが、`ImportDeckAction` にRedis削除処理が見当たらない（付帯表4#8）。Redisの観測手段は本リポジトリから取れず要実機確認 | 副作用節(Redis下書き削除)・データ整合性(下書きとの整合)／IT-27 | IT-A15-18-...-024,059 |
| E2E-A15-18-090 | 手動（要実機確認・並行送信実再現） | 排他制御・トランザクション節（楽観/悲観ロックなし・後勝ち。実装は同一デッキの直列確定＝ImportDeckAction.php:99-139） | 排他制御・トランザクション・データ整合性(同時更新後勝ち)／IT-19 | IT-A15-18-...-078 |
| E2E-A15-18-091 | 手動（要実機確認・想定外項目の許容/無視/エラー仕様未定義） | `parseJsonBody`（AbstractDeckBuilderController.php:30）で受領し `buildSaveData` が既知キーのみ参照＝未知キーは無視。正本mdに未定義項目の許容/無視/エラー定義が無く固定期待にしない | データ整合性・入出力リクエスト(未定義項目の扱い未定義)／IT-32 | IT-A15-18-...-077 |
| E2E-A15-18-092 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理(例外)・処理フロー／IT-10 | IT-A15-18-...-086 |
| E2E-A15-18-110/111 | E2E自動化(API/統合) | 整合性検証＝`validateDeck`（ImportDeckAction.php:161-172）。ボード区分別の採用カード（採用カード・メイビー・アトラクション・ステッカー）とデッキ本体の制約検証→400（DeckController.php:725） | バリデーション節(採用カード・デッキ本体の整合性検証・未充足→400)／IT-22（設計書補完。観点表の入力検証誤除外を補正＝付帯表4#9） | （母集合外・設計書補完。既存IT cases対象外観点表のIT-22誤除外を補正） |
| E2E-A15-18-150 | 手動（要実機確認・保存例外実再現） | 保存例外→`rollback`→`SystemErrorException`→500（ImportDeckAction.php:150-153）／例外の実再現は実機依存。一次オラクル＝APIレスポンス500＋DB副作用（部分更新なし） | エラー処理(保存例外→500)・排他制御トランザクション(ロールバック)・副作用節／IT-05（設計書補完） | （母集合外・設計書補完。既存IT cases対象外観点表のIT-05誤除外を補正） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象画面でファイル処理を実行する」「対象機能を実行する」等の汎用文で、画面を持たないAPIに不整合な「ファイル出力」「移動・リネーム」「同名ファイル」等のファイル処理語を多用）で機能固有シナリオを持たない。本E2Eは正本md本文（処理フロー#1-7・バリデーション節・副作用節・DBカラム節・排他制御トランザクション節）を一次オラクルに、API/統合レイヤ単独（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）で網羅し、正常×異常の対（更新成功↔認証/所有者外/対象なし/形式不正・即時上書きDB更新↔検証エラー時ロールバック・全行解読code200↔解読不能行ありcode206）を揃えた。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `a15_18_api_deck_builder_deck_import_update_it_cases.md` の関連ID件数（IT-09=3／IT-10=8／IT-16=12／IT-17=3／IT-19=1／IT-24=37／IT-27=15／IT-32=4／IT-33=7＝計90）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-09 | 3 | 0 | 3 | 0 | 0 | 正常更新のHTTPステータス・実行結果・正常パラメータ |
| IT-10 | 8 | 0 | 2 | 1 | 5 | 署名不正/該当プレイヤーなし(401相当のエラー)・複数違反同時(400)はAPI/統合。タイムアウト1は手動。ソート順1＋相関バリ一括/ソート順2＋DB相関バリ一括/ソート順2＝計5は正典にソート順定義なし／本機能に相関・DB相関バリデーション該当処理なしで対象外 |
| IT-16 | 12 | 0 | 10 | 0 | 2 | 更新インポート実行結果・card_list境界(500行成功/501行400/空成功)・deck_id返却はAPI/統合。計算処理2(POST分岐・計算処理)は対象外 |
| IT-17 | 3 | 0 | 3 | 0 | 0 | format_id必須/カードリスト解読/デッキ内容整合性検証→400・更新の有無 |
| IT-19 | 1 | 0 | 0 | 1 | 0 | 同時実行数の制限＝本APIは排他制御なし・後勝ち。並行送信の実再現は手動/要実機 |
| IT-24 | 37 | 0 | 33 | 2 | 2 | 出力内容(成功本文・message・scope_id/display_token・解読不能行errors・対象なし404・DB副作用)はAPI/統合。保存例外1・下書き整合1は手動。POST分岐1・計算処理1は対象外 |
| IT-27 | 15 | 0 | 13 | 2 | 0 | デッキ本体上書き・採用カード/ボード外初期化作り直し・配置先・JSON応答はAPI/統合(DB副作用照合)。トランザクション(検証エラーは074で自動化、保存例外は150で手動)・下書き整合は手動/要実機 |
| IT-32 | 4 | 0 | 2 | 1 | 1 | 資格情報・異常パラメータはAPI/統合。想定外項目は正本mdに未定義項目仕様が無く手動・要実機。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-33 | 7 | 0 | 6 | 0 | 1 | 対象機能(正常/未認証不変)・区分整合・部分更新なしはAPI/統合(DB副作用照合)。外部取引(加減算)1は本APIに非該当で対象外 |
| 合計 | 90 | 0 | 72 | 7 | 11 | **未分類 0** |

注1: 対象外11件の内訳は、IT-10 5（複数単項目バリ ソート順1＝正典にソート順定義なし／相関バリ一括返却1＋ソート順1＝本機能に相関バリデーション該当処理なし／DB相関バリ一括返却1＋ソート順1＝DB相関バリデーション該当処理なし）／IT-16 2（POST（新規登録）分岐1＝本書対象外・デッキ登録インポートAPIの範囲／計算処理1＝本APIに金額・在庫の再計算なし）／IT-24 2（POST（新規登録）分岐1＝本書対象外／計算処理1＝再計算なし）／IT-32 1（バージョニング＝正典にバージョン依存挙動の定義なし）／IT-33 1（外部取引＝外部取引由来の加減算が本APIに無し）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 正本md本文（バリデーション節・副作用節・排他制御トランザクション節）から、母集合90行に対応する適切な観点（入力検証IT-22・保存例外ロールバックIT-05）を持たない補完ケースを追加した。母集合集計には算入せず別管理する。内訳＝自動化(API/統合) 2（110 採用カード制約未充足→400／111 デッキ本体制約未充足→400＝IT-22）／手動・要実機 1（150 保存例外→ロールバック→500＝IT-05）。既存IT casesの対象外観点表が入力検証（IT-22）・DB操作 登録/更新/削除（IT-05/IT-23/IT-26）を「本機能に入力検証対象がないため」「該当する処理・I/Fがないため」と誤除外していたため、上位オラクル（正本md・基本設計）に照らして補正し、入力検証はIT-22（110/111）・保存例外ロールバックはIT-05（150）を設計書補完ケースで網羅、DB更新副作用は母集合のIT-27/IT-33（070-075）経由で網羅した（付帯表4#9）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点／前提概念 | 区分 | 対応E2E / 理由 |
|------|-------|----------------|------|----------------|
| 001 | IT-16 | 実行結果/公開区分 | 自動化(API/統合) | 070（デッキ本体上書き・公開区分反映） |
| 002 | IT-27 | 実行結果/ボード外区分 | 自動化(API/統合) | 072（メイビー/アトラクション/ステッカー初期化作り直し） |
| 003 | IT-27 | 出力失敗/削除方式 | 自動化(API/統合) | 072（旧ボード外カード初期化＝取得結果に含まれない） |
| 004 | IT-32 | 資格情報/プレイヤー | 自動化(API/統合) | 005（有効JWTで成功）/020/021/022 |
| 005 | IT-16 | 実行結果/表示用トークン | 自動化(API/統合) | 060（限定公開→display_token） |
| 006 | IT-16 | 実行結果/デッキ更新インポート | 自動化(API/統合) | 007（取り込み結果一致）/001 |
| 007 | IT-16 | 実行結果/認証失敗時 | 自動化(API/統合) | 020/021/022（認証失敗→401） |
| 008 | IT-16 | 実行結果/認可(最大長) | 自動化(API/統合) | 042（card_list最大長500行→成功） |
| 009 | IT-16 | 実行結果/メソッドPUT(最大長+1) | 自動化(API/統合) | 041（card_list501行→400） |
| 010 | IT-16 | 実行結果/メソッドPOST(最小長) | 対象外 | POST（新規登録）は本書対象外・デッキ登録インポートAPIの範囲（処理フロー 新規登録との分岐） |
| 011 | IT-16 | 実行結果/更新対象(最小長-1) | 自動化(API/統合) | 040（必須未充足＝format_id未指定→400） |
| 012 | IT-16 | 実行結果/更新方法 | 自動化(API/統合) | 071（上書き・作り直し） |
| 013 | IT-16 | 実行結果/計算処理 | 対象外 | 本APIは金額・税・ポイント・在庫の再計算や丸めを行わないため |
| 014 | IT-16 | 実行結果/応答値 | 自動化(API/統合) | 003（応答値＝保存結果code:200・deck_id） |
| 015 | IT-24 | 実行結果/id | 自動化(API/統合) | 009（id指定で対象特定・deck_id返却） |
| 016 | IT-24 | 実行結果/scope_id | 自動化(API/統合) | 060/061（scope_idによるdisplay_token有無） |
| 017 | IT-24 | 実行結果/message | 自動化(API/統合) | 008（更新message・文言は付帯表4#4要確認） |
| 018 | IT-16 | エラー/deck_id | 自動化(API/統合) | 009（deck_id返却） |
| 019 | IT-24 | フォーマット定義/display_token | 自動化(API/統合) | 060（限定公開→display_token） |
| 020 | IT-17 | フォーマット定義/card_list(該当値→継続) | 自動化(API/統合) | 052（全行解読→code200）/001 |
| 021 | IT-17 | フォーマット定義/デッキ内容(該当しない値→エラー) | 自動化(API/統合) | 043（整合性検証失敗→400） |
| 022 | IT-17 | フォーマット定義/更新の有無 | 自動化(API/統合) | 070（上書き更新の有無をDB副作用照合） |
| 023 | IT-27 | 実行結果/トランザクション | 自動化(API/統合) | 074（検証エラー時ロールバック・部分更新なし） |
| 024 | IT-27 | 実行結果/下書きとの整合 | 手動（要実機確認） | 081（Redis下書き削除・観測手段なし＝付帯表4#8） |
| 025 | IT-27 | 実行結果/デッキ(dtb_deck) | 自動化(API/統合) | 070（dtb_deck上書き） |
| 026 | IT-24 | 実行結果(操作結果)/メイビー等(初期化して作り直す) | 自動化(API/統合) | 072（ボード外カード初期化作り直し） |
| 027 | IT-27 | 実行結果/登録/更新 | 自動化(API/統合) | 070/071（デッキ本体・採用カード上書き） |
| 028 | IT-27 | エラー/認証済みかつ所有プレイヤー | 自動化(API/統合) | 005（認可OK・正常更新）/001 |
| 029 | IT-24 | フォーマット定義/認証済みだが所有者でない | 自動化(API/統合) | 023（所有者外→401・不変） |
| 030 | IT-24 | フォーマット定義/未認証・トークン不正 | 自動化(API/統合) | 020/021（未認証/不正→401） |
| 031 | IT-24 | フォーマット定義/認証不可・所有者不一致 | 自動化(API/統合) | 023（所有者外→401）/022 |
| 032 | IT-24 | フォーマット定義/デッキが存在しない | 自動化(API/統合) | 030（対象なし→404） |
| 033 | IT-24 | 出力内容/検証失敗・行数超過 | 自動化(API/統合) | 041（行超過→400）/043（検証失敗→400） |
| 034 | IT-24 | 出力内容/解読できない行あり | 自動化(API/統合) | 050（解読不能行→code206・errors） |
| 035 | IT-24 | 出力内容/保存処理中のその他の例外 | 手動（要実機確認） | 150（保存例外→500・実再現は実機依存） |
| 036 | IT-24 | 出力内容/公開区分 | 自動化(API/統合) | 060/061（scope_idによるdisplay_token有無） |
| 037 | IT-24 | 出力内容/ボード外区分 | 自動化(API/統合) | 072（ボード外カード作り直し） |
| 038 | IT-24 | 出力内容/削除方式 | 自動化(API/統合) | 072（旧カード初期化＝取得結果に含まれない） |
| 039 | IT-24 | 出力内容/プレイヤー | 自動化(API/統合) | 070（dtb_deckの所有プレイヤーをDB副作用照合） |
| 040 | IT-24 | 出力内容/表示用トークン | 自動化(API/統合) | 060（限定公開→display_token） |
| 041 | IT-24 | 出力内容/デッキ更新インポート | 自動化(API/統合) | 001（正常更新成功） |
| 042 | IT-24 | 出力内容/認証失敗時 | 自動化(API/統合) | 020（認証失敗→401） |
| 043 | IT-24 | 出力内容/認可 | 自動化(API/統合) | 005（認可OK）/023（所有者外） |
| 044 | IT-24 | 出力内容/メソッドPUTかつidが非null | 自動化(API/統合) | 008（PUT更新分岐・更新message） |
| 045 | IT-24 | 出力内容/メソッドPOST | 対象外 | POST（新規登録）は本書対象外・デッキ登録インポートAPIの範囲 |
| 046 | IT-24 | 出力内容/更新対象(最大長) | 自動化(API/統合) | 042（card_list最大長500行→成功） |
| 047 | IT-24 | 出力内容/更新方法(最小長) | 自動化(API/統合) | 062（card_list最小＝空→成功） |
| 048 | IT-24 | 出力内容/計算処理(該当しない値) | 対象外 | 本APIは金額・在庫の再計算を行わないため |
| 049 | IT-24 | 出力内容/応答値 | 自動化(API/統合) | 003/004（成功本文の応答値） |
| 050 | IT-24 | 出力内容/id | 自動化(API/統合) | 009（id指定・deck_id返却）/075 |
| 051 | IT-24 | 出力内容/scope_id | 自動化(API/統合) | 060/061 |
| 052 | IT-24 | 出力内容/message | 自動化(API/統合) | 008（更新message・要確認） |
| 053 | IT-24 | 出力内容/deck_id | 自動化(API/統合) | 009（deck_id返却） |
| 054 | IT-24 | 出力内容/display_token | 自動化(API/統合) | 060/061 |
| 055 | IT-24 | 出力内容/card_list | 自動化(API/統合) | 052（解読成功）/050（解読不能行） |
| 056 | IT-24 | 出力内容/デッキ内容 | 自動化(API/統合) | 043（デッキ内容整合性検証→400）/007 |
| 057 | IT-24 | 出力内容/更新の有無 | 自動化(API/統合) | 070（上書き更新の有無） |
| 058 | IT-24 | 出力内容/トランザクション | 自動化(API/統合) | 074（検証エラー時ロールバック） |
| 059 | IT-24 | 出力内容/下書きとの整合 | 手動（要実機確認） | 081（Redis下書き削除・観測手段なし） |
| 060 | IT-24 | 出力内容/デッキ(dtb_deck) | 自動化(API/統合) | 070（dtb_deck上書き） |
| 061 | IT-27 | 削除/メイビー等(該当レコード不含) | 自動化(API/統合) | 072（旧ボード外カードが取得結果に含まれない） |
| 062 | IT-27 | 移動・リネーム/登録更新(該当レコード不含) | 自動化(API/統合) | 071（旧採用カードが残らない） |
| 063 | IT-27 | コピー/認証済み所有 | 自動化(API/統合) | 001（正常更新・取り込み結果一致）/007 |
| 064 | IT-33 | 対象機能/認証済みだが所有者でない | 自動化(API/統合) | 023（所有者外→401・不変） |
| 065 | IT-33 | 対象機能/未認証・トークン不正(値変更されない) | 自動化(API/統合) | 024（未認証→401・対象不変） |
| 066 | IT-33 | ファイル登録/認証不可・所有者不一致 | 自動化(API/統合) | 023（所有者外→401・不変） |
| 067 | IT-33 | ファイル出力/デッキが存在しない | 自動化(API/統合) | 030（対象なし→404） |
| 068 | IT-27 | JSON/検証失敗・行数超過 | 自動化(API/統合) | 041（行超過→400）/043（検証失敗→400） |
| 069 | IT-27 | 同名ファイル/解読できない行あり | 自動化(API/統合) | 050（解読不能行→code206・errors） |
| 070 | IT-27 | 入力JSON/保存処理中の例外(値変更されない) | 手動（要実機確認） | 150（保存例外→ロールバック→500・部分更新なし） |
| 071 | IT-27 | 配置先/公開区分(該当レコードが取得結果に含まれる) | 自動化(API/統合) | 070（更新反映＝該当レコードが取得結果に含まれる） |
| 072 | IT-27 | スキーマ/ボード外区分 | 自動化(API/統合) | 072（ボード外カード作り直し） |
| 073 | IT-09 | 実行結果/削除方式 | 自動化(API/統合) | 002（更新実行結果一致） |
| 074 | IT-09 | HTTPステータス/プレイヤー | 自動化(API/統合) | 003（HTTPステータス200・本文code200） |
| 075 | IT-09 | リクエスト/表示用トークン(正常パラメータ) | 自動化(API/統合) | 001（正常パラメータ→200） |
| 076 | IT-32 | リクエスト/デッキ更新インポート(異常パラメータ) | 自動化(API/統合) | 045（異常パラメータ→400） |
| 077 | IT-32 | リクエスト/認証失敗時(想定外項目追加) | 手動（要実機確認） | 091（想定外項目＝正本mdに未定義項目仕様なし・仕様化待ち） |
| 078 | IT-19 | 同時実行数の制限/認可 | 手動（要実機確認） | 090（排他制御なし・後勝ち・並行送信実再現） |
| 079 | IT-10 | エラー/メソッドPUT(エラー発生時) | 自動化(API/統合) | 043（整合性検証失敗→400の代表異常） |
| 080 | IT-10 | エラー/複数単項目バリ一括返却 | 自動化(API/統合) | 044（複数違反同時送信→400。全件個別列挙の構造は固定せず＝付帯表4#5） |
| 081 | IT-10 | エラー/複数単項目バリ ソート順 | 対象外 | 正典にエラーメッセージのソート順定義が無く固定期待にできないため |
| 082 | IT-10 | エラー/複数相関バリ一括返却 | 対象外 | 本機能に相関（クロス項目）バリデーション該当処理が無いため |
| 083 | IT-10 | エラー/複数相関バリ ソート順 | 対象外 | 同上＋ソート順定義なし |
| 084 | IT-10 | エラー/DB相関バリ一括返却 | 対象外 | 本機能にDB相関バリデーション該当処理が無いため |
| 085 | IT-10 | エラー/DB相関バリ ソート順 | 対象外 | 同上＋ソート順定義なし |
| 086 | IT-10 | エラー/タイムアウト | 手動（要実機確認） | 092（タイムアウト実再現） |
| 087 | IT-32 | バージョニング/message | 対象外 | 正典にAPIバージョン依存の挙動定義が無く、バージョン依存挙動は創作になるため |
| 088 | IT-33 | 区分整合/deck_id(更新対象外不変) | 自動化(API/統合) | 073（更新対象外の別デッキ・他プレイヤーデッキ不変） |
| 089 | IT-33 | エラー/display_token(部分更新されず整合) | 自動化(API/統合) | 074（検証エラー時部分更新なし・ロールバック） |
| 090 | IT-33 | 外部取引/card_list | 対象外 | 外部取引由来の数量・金額の加減算処理が本APIに無いため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 72／手動・要実機 7（行024,035,059,070,077,078,086）／対象外 11（行010,013,045,048,081,082,083,084,085,087,090）。**未分類 0**（母集合90行）。母集合外の設計書補完ケース（110/111＝IT-22 入力検証・150＝IT-05 保存例外ロールバック）は別管理で母集合集計を変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A15-18-JWT-PLAYER | dtb_player・dtb_customer／jwt-token | 有効な会員（顧客）1と、その顧客IDに紐づくプレイヤー1。顧客IDをクレーム（正本mdは`aud`／実装は`sub`＝付帯表4#3）に持つHS256署名のjwt-tokenを供給（トークン原値・署名シークレットは環境変数で供給しログ/設計に書かない）。020/021/022用に「ヘッダ欠落」「署名不正」「該当プレイヤーなし（顧客IDに対応するプレイヤー不在）」のトークン状態を別途用意 | fixture／env（JWT発行は a15 デッキビルダー用ログインAPI またはenv供給。HS256署名検証・クレーム名は要実機確認） | 専用会員・プレイヤー・撤去可。トークンは使い捨て | 020を除く全API/統合ケース |
| SEED-A15-18-DECK | dtb_deck（＋既存の dtb_deck_card/dtb_maybe_card/dtb_attraction_card/dtb_sticker_card） | 認証プレイヤーが所有する既知IDのデッキ1件。既存採用カード・ボード外カード（メイビー/アトラクション/ステッカー）・更新前のデッキ名/フォーマット/アーキタイプ/本文・公開区分（display_token既知）あり。023用に別プレイヤー所有のデッキ1件。073用に更新対象外の別デッキ1件。081用に当該デッキのRedis下書きが存在する状態 | fixture／migration | 専用デッキ・テスト毎に初期状態へ復元してべき等化。更新系（070-075等）は実行前にリセット | 全更新・DB副作用ケース |
| SEED-A15-18-MASTER | mtb_format・アーキタイプ・カード・キャンペーンタグ等の参照マスタ | カードリスト解読・整合性検証・レギュレーション判定に必要な参照マスタ（フォーマットの統率者使用設定・枚数範囲・禁止制限・4枚制限）。card_listのカード名が解決できる構成、050用に一部カード名未一致（解読不能行）となる構成、041用に501行・042用に500行ちょうどのcard_list、043/044/110/111用に整合性検証に失敗する構成（採用カード制約違反・デッキ本体制約違反・複数違反同時）を確定 | fixture（既定マスタ）／migration | 既存利用・撤去不要 | カードリスト解読・整合性検証・DB副作用ケース |
| SEED-A15-18-PAYLOAD | リクエストボディ（synthetic） | 正本md入出力節準拠の最小ボディ（format_id・card_list・deck_name・scope_id・archetype_id・image_card_id・campaign_tag_ids）。正常／format_id未指定／card_list（全行解読・解読不能行あり・501行・500行・空/未指定）／整合性違反（採用カード制約違反・デッキ本体制約違反・複数違反同時）／scope_id=公開/非公開/限定公開／想定外項目追加のバリエーション | synthetic（正本md由来。実装が受け取るがmdに無い項目は期待値に含めない） | テスト内生成・後始末不要。記載フィールドのみ、未記載は要実機確認コメント | 全送信ケース |

注: ペイロードは正本md入出力節記載のフィールドのみで最小構成し、deck-api実環境は使わない。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_deck`＝`id`/`deck_name`/`format_id`/`archetype_id`/`private_flg`/`player_id`/`display_token`/`text_main`/`text_side`/`text_command`/`update_date`/`deleted_at`・採用カード各テーブル＝`deck_id`/`card_id`/`board_id`/`count`。プレイヤー特定は顧客ID）に従う。下書き保存先のRedisはDBスキーマ対象外で観測手段は要実機確認。JWTトークン・署名シークレット（`auth_magic`）・表示用トークンの原値は環境変数で供給し原値を書かない（正本md ログ・監査節「ログに出してはいけないもの」）。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md・観点表・基本設計）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /deck/import/{id}`（正本md 利用者視点の入口） | `#[Route('/api/deck/import/{id}', name: 'api_deck_builder_deck_import_put', methods: ['PUT', 'OPTIONS'])]`（DeckController.php:677）＝実効 `/api/deck/import/{id}` | **正本mdパスは `/api` プレフィクスを欠き実装と不一致**。テストは実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | 解読できない行があるときはコードを206に切り替える（正本md 利用者視点の入口・処理フロー#7・レスポンス節・エラー処理節） | 成功本文 `'code' => Response::HTTP_OK`（DeckController.php:730）固定で、`errors!==[]` のとき `errors` を付加するのみ・HTTPステータスも `Response::HTTP_OK`（DeckController.php:744）＝code/HTTPとも200のまま | **解読不能行あり時に正本mdはHTTP・本文codeとも206、実装はHTTPステータス・本文codeとも200のままerrors配列のみ付加**。テストはHTTPステータス206・本文code206を期待値に固定し（050）、実装が200のままの差異を落として検出する | 050,051,052 | 不具合候補(部分成功コード206/200) |
| 3 | JWTペイロードの `aud`（顧客ID）からプレイヤーを特定（正本md 認証・認可節） | `$sub = $payload['sub']`（JwtPlayerAuthenticator.php:47）＝`sub`クレームを顧客IDとして使用し `findOneBy(['Customer'=>(int)$sub])`（JwtPlayerAuthenticator.php:52） | **正本mdは`aud`、実装は`sub`をプレイヤー特定キーに使用**。検証クレーム名が食い違う。SEED発行時はトークンが正常検証されるよう要実機確認 | 全API/統合ケース | 要確認(クレーム名aud/sub) |
| 4 | 成功時メッセージは「Deck update success by import」、失敗時messageは「Access Token is incorrect」「Authentication failed」「The deck does not exist」等（正本md レスポンス節） | 成功＝`trans('api.deck_builder.deck.import_update_success')`（DeckController.php:731）／401＝`trans('api.deck_builder.auth.token_incorrect')`（DeckController.php:699）・`trans('api.deck_builder.auth.failed')`（DeckController.php:704）／404＝`trans('api.deck_builder.deck.not_found')`（DeckController.php:709）＝いずれもローカライズ文言 | **メッセージ文言が仕様（英語リテラル）と実装（ローカライズ）で食い違う**。文言は固定せずHTTPステータス・`{code,message}`書式・code:200/206で判定し、文言一致は要確認 | 004,008,040,043,110,111 | 要確認(メッセージ文言) |
| 5 | 検証エラーのmessageは「検証エラー内容」（正本md レスポンス(失敗)・バリデーション節） | 複数の制約違反を `implode(' ', $messages)` で空白結合し1つの `BadRequestHttpException` message として返す（ImportDeckAction.php:163-171）＝errors配列でなく結合文字列 | **複数検証メッセージが errors 配列でなく空白結合の単一 message で返る**。テストは400＋`{code,message}`で判定し（044は複数違反同時送信でも400となることのみ確認）、複数件を個別に全件列挙する返却構造・ソート順は固定せず要確認 | 043,044,110,111 | 要確認(複数検証の返却構造) |
| 6 | 404は「パスの`id`に一致するデッキが無い」場合のみ（正本md レスポンス(失敗)・エラー処理節） | `format_id` に該当フォーマットが無いとき→`FormatNotFoundException`→`Response::HTTP_NOT_FOUND`(404)＋`api.deck_builder.deck.format_not_found`（DeckController.php:712-716／ImportDeckAction.php:86） | **正本mdは404をデッキ不存在に限定し、フォーマット不存在時のステータスを定義していない（実装は404）**。テストはデッキ不存在404のみを固定し、フォーマット不存在時の応答ステータスは固定せず要確認 | 030 | 要確認(フォーマット不存在のステータス未定義) |
| 7 | カードリストが上限500行超過時は入力不正（HTTP 400）とし本文は`{code, message}`（正本md 入出力・バリデーション・エラー処理節） | 上限超過/不正行→`BadRequestHttpException`（CardUtil.php:53-54,161,169）は `decodeCardList`（ImportDeckAction.php:96）でトランザクション外・コントローラの`catch`対象外（InvalidRequestException等のみcatch）に送出され、Symfony既定の400エラー応答となる | **行超過時はHTTP400となるが、本文が `createErrorResponse` 由来の `{code, message}` 形でなくSymfony既定形になり得る**。期待値は正本mdどおり「HTTP400＋本文`{code, message}`」を固定し（041）、実装がSymfony既定形を返す差異はテストが落ちて検出する | 041 | 不具合候補(上限超過の応答本文形) |
| 8 | 保存後に当該デッキのRedis上の下書きを削除する（正本md 副作用節・データ整合性節） | `ImportDeckAction`（ImportDeckAction.php:59-159）に当該デッキのRedis下書き削除処理が見当たらない（保存後はImportDeckResultを返すのみ） | **正本mdはRedis下書き削除を定めるが、実装に削除処理が確認できない**。Redis観測手段が本リポジトリから取れず要実機確認。テストは仕様（保存後に下書きが削除される）で判定 | 081 | 不具合候補(Redis下書き削除の欠落) |
| 9 | 正本md・実装に入力検証（バリデーション節＝採用カード・デッキ本体の整合性検証）とDB更新（副作用節・DBカラム節＝既存カード初期化と上書き保存）と保存例外ロールバック（排他制御節）が存在 | 既存IT cases 対象外観点表が「バリデーション（IT-22）…本機能に入力検証対象がないため」「DB操作 登録/更新/削除（IT-05/IT-23/IT-26）…該当する処理・I/Fがないため」と記載 | **既存IT cases（観点表側）が入力検証・DB更新・保存例外ロールバックを誤って対象外にしている**。上位オラクル（正本md・基本設計）に照らし補正し、入力検証はIT-22（110/111＝採用カード・デッキ本体の整合性検証→400）、保存例外ロールバックはIT-05（150）を設計書補完ケースで網羅、DB更新は母集合のIT-27/IT-33（070-075）経由で網羅 | 070,071,072,073,074,075,110,111,150 | 不具合候補(観点表の誤分類) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（自所有デッキのインポート更新・所有者照合・カードリスト解読・部分成功） | 正常更新の成功応答 | 001,002,006,007 | カバー |
| 利用者視点の入口（`PUT /deck/import/{id}`・成功code200/解読不能行あり206のJSON） | 実効パスへの送信・成功code200・解読不能行206 | 001,003,050,052 | カバー（付帯表4#1でパス乖離・#2で206乖離を記録） |
| 認証・認可（jwt-token/HS256・aud顧客IDでプレイヤー特定・所有者照合・401） | 有効JWTで成功・欠落/署名不正/該当なしで401・所有者外で401 | 005,020,021,022,023 | カバー（HS256実方式・aud/subクレームは要実機＝付帯表4#3） |
| 処理フロー#1（トークン検証→プレイヤー特定・検証不可/該当なしで401） | 認証拒否（欠落/署名不正/該当なし） | 020,021,022 | カバー |
| 処理フロー#2（デッキIDで対象取得・該当なし404） | 対象デッキなし404 | 030 | カバー |
| 処理フロー#3（所有者一致しない場合401） | 所有者外で更新不可・対象不変 | 023,024 | カバー |
| 処理フロー#4（format_id→フォーマット取得・card_list解読→cards） | format_id必須・card_list解読・空配列・解読不能行 | 040,050,052,062 | カバー（フォーマット不存在ステータスは付帯表4#6で要確認） |
| 処理フロー#5（既存カード初期化→組み立て直し→検証→保存・Redis下書き削除・検証エラー400・例外500） | 既存カード初期化・上書き保存・検証失敗400・部分更新なし・Redis削除・保存例外500 | 043,070,071,072,074,081,150 | カバー（DB副作用観測。Redis081・保存例外150は手動/要実機・付帯表4#8） |
| 処理フロー#6（成功code200・message・限定公開時display_token） | 成功本文書式・限定公開時のdisplay_token付加/非付加 | 003,004,008,060,061 | カバー（message文言は付帯表4#4で要確認） |
| 処理フロー#7（解読できない行ありはcode206・errors） | 解読不能行→code206・errors行番号配列・更新は完了 | 050,051,052 | カバー（206/200乖離は付帯表4#2） |
| 新規登録との分岐（PUTかつid非null＝更新／POST＝新規） | PUTでidありは更新（message=update）として処理 | 008 | カバー（POST新規登録は本書対象外＝デッキ登録インポートAPIの範囲） |
| 業務ルール・計算（入力値を上書き・金額/在庫の再計算なし） | デッキ本体・採用カードの上書き更新／再計算なし（計算処理観点は対象外） | 070,071 | カバー（計算処理は対象外＝本APIに再計算なし） |
| 入出力・リクエスト（id/jwt-token/format_id必須・card_list任意/上限500行・scope_id等） | 各パラメータの必須/任意・受信検証・行数上限・空card_list | 006,020,030,040,041,042,062 | カバー |
| 入出力・レスポンス(成功)（code・message・deck_id・display_token・errors） | 成功本文の各フィールド・限定公開display_token・解読不能errors | 003,004,008,009,050,060,061 | カバー |
| 入出力・レスポンス(失敗)（401/404/400/500の本文`{code,message}`） | 各エラー応答の書式 | 020,023,030,040,043,150 | カバー（500は手動/要実機。行超過の本文形は付帯表4#7） |
| 副作用節（既存カード初期化して上書き保存・Redis下書き削除・トランザクション・serialize_null有効） | DB更新副作用のDB照合・採用カード/ボード外全置換・Redis削除・ロールバック | 070,071,072,074,081,150 | カバー（070-074はDB副作用観測。081は手動/要実機・付帯表4#8） |
| バリデーション節（format_id必須→400・採用カード/デッキ本体の整合性検証→400・card_list上限→400・解読不能行は中断せずerrors） | format_id未指定400・採用カード制約400・デッキ本体制約400・複数違反同時400・行超過400・解読不能行errors | 040,041,043,044,110,111,050 | カバー（110＝採用カード制約・111＝デッキ本体制約＝IT-22入力検証を補完。複数件の個別全件列挙構造は付帯表4#5で要確認） |
| データ整合性（既存カード初期化して作り直し・同一識別子・下書きとの整合） | 採用カード全置換・デッキ識別子不変・更新対象外データ不変・下書き削除 | 062,071,072,073,075,081 | カバー（073区分整合はDB副作用観測。081は手動/要実機） |
| DBカラム節（dtb_deck各列・採用カード各テーブル・private_flg/display_token・deleted_at） | デッキ本体各列上書き・採用カード/ボード外全置換・display_token・識別子不変 | 060,070,071,072,075 | カバー（DB副作用観測） |
| 権限・認可（認証済み所有者更新可・他人デッキ401・未認証401） | 認証成功/所有者外401/未認証401 | 005,023,020,024 | カバー |
| エラー処理（401/404/400/解読不能行206/保存例外500） | 各エラー応答・解読不能行206・保存例外で部分更新なし | 020,030,040,050,074,150 | カバー（150は手動/要実機） |
| 排他制御・トランザクション（カード初期化と上書きを1トランザクション・例外時ロールバック・ロックなし後勝ち） | 同時更新の片側更新なし・検証/保存例外時ロールバック | 074,090,150 | カバー（090,150は手動/要実機） |
| ログ・監査（JWT原値・署名シークレット・パスワード・Cookie値の非出力） | 機密値の非出力 | （対象外＝サーバログ実機観測） | 対象外（API応答に現れず。サーバログ実機観測は本E2E範囲外） |
| 複数バリデーションの全件返却・ソート順・相関バリ・DB相関バリ（IT-10細目） | 複数違反同時送信時のHTTPステータス（400）／全件個別列挙の返却構造・ソート順 | 044（複数違反→400の代表）／全件個別列挙の構造・ソート順は要確認／相関・DB相関は対象外 | 一部カバー（044で複数違反同時送信→400を確認。実装は空白結合の単一messageで返し、全件個別列挙の返却構造・ソート順は正典に定義が無く固定不能＝要確認＝付帯表4#5）・相関/DB相関バリは対象外（本APIに該当処理なし） |
| 想定外項目・バージョニング・外部取引（IT-32/IT-33細目） | 想定外項目追加時の挙動／バージョン依存挙動／外部取引加減算 | 091（想定外項目＝仕様化待ち）／（バージョニング・外部取引は対象外） | 一部カバー（091は手動/要実機・仕様化待ち。バージョニングは正典にバージョン依存挙動の定義なし・外部取引は本APIに加減算処理なしで対象外） |
| 同時実行数の制限（IT-19）・タイムアウト（IT-10） | 並行更新の整合・タイムアウト時の応答 | 090,092 | カバー（手動/要実機） |

未カバーはいずれも理由（正典にソート順/バージョン依存挙動の定義なし・本APIに相関/DB相関バリ・外部取引由来の加減算・金額/在庫の再計算なし・Redis下書き削除/観測手段・保存例外/タイムアウト/並行送信の実再現は要実機確認・アプリログ機密値抑止はサーバログ実機観測で本E2E範囲外）を明記済み。正本mdの各節（処理フロー#1-7・バリデーション・副作用・データ整合性・エラー処理・排他制御トランザクション）はAPI/統合レイヤ（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）へ写像し、正常×異常の対（更新成功001/006/007 ↔ 認証失敗020/021・該当プレイヤーなし022・所有者外023・対象なし030・形式不正040/041/043/044・部分更新なし074／全行解読code200の052 ↔ 解読不能行ありcode206の050／即時上書きDB更新070-072 ↔ 検証エラー時ロールバック074・保存例外ロールバック150）を揃えた。
