# A15-17（デッキビルダー_デッキインポート登録） E2Eテストケース

元設計md（正本一次／pf-apiリバース）: `functions/pf-api/a15-17_api_deck_builder_deck_import_register.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a15-17_api_deck_builder_deck_import_register.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a15_17_api_deck_builder_deck_import_register_it_cases.md`（母集合 計90観点行）

本機能は**ブラウザ向けの画面を持たない**機能仕様（JWT認証つきPOST API＝デッキビルダー利用者が`card_list`テキストを解読してデッキを新規登録。正本md「対象はJSON APIエンドポイントであり、ブラウザ向けの画面を持たない」）であり、**API/統合レイヤ単独で網羅**する。Playwright `request` で実効パス `POST /api/deck/import`（設計パス差異は付帯表4#1管理）へ送信し、HTTPステータス・レスポンス本文（`{code, message, deck_id, display_token, errors}`／`{code, message}`）で判定する。登録副作用（デッキ本体・デッキカード・メイビー/アトラクション/ステッカーカード・閲覧用トークン・本文・所有プレイヤー・作成/更新日時）は永続化先テーブル（`dtb_deck`・`dtb_deck_card`・`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card`）を直接DB照合（DB副作用観測）して判定する。本機能は画面を持たないため、別機能（管理画面 デッキ管理）の表示は合否条件にしない。

**期待結果は仕様（正本md・観点表・基本設計）由来**とし、実装のレスポンス形・バリデーション機構・HTTPライブラリ既定値・DTO/エンティティ制約・ロケール文言を期待値に流用しない（オラクル独立性）。pf-apiリバースの正本mdを上位オラクル、観点表（基本設計）と食い違う箇所も上位オラクルとして扱い、乖離は付帯表4に出す。実装からは位置情報（APIパス・メソッド・認証方式）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。TSV は既存IT casesと同一の 10 列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

本機能は**インポート登録（DB新規作成）系**のため、DB登録観点（取り込み結果が対象データと一致＝IT-16/IT-24で観測）・入力検証観点（カードリスト行数上限・format_id必須・デッキ内容検証）・トランザクション/ロールバック観点（IT-06）を網羅に含める。正本md・実装には入力検証（バリデーション節）とDB登録副作用（副作用節・DBカラム節）とトランザクション・ロールバック（排他制御節）が存在するが、既存IT casesの対象外観点表は「本機能に入力検証対象がないため」「本機能に更新処理がないため」「該当する処理・I/Fがないため」と入力検証（IT-22）・DB登録/更新（IT-23/IT-26/IT-05）・ロールバック（IT-06）・排他制御（IT-07）を誤って除外している。これを上位オラクル（正本md・基本設計）に照らし、DB登録副作用は母集合のインポート結果観点（IT-16/IT-24）で観測し、ロールバックは設計書補完ケース（IT-06・母集合外）として補正する。当該誤分類は付帯表4#7に記録する。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-09 | 正常インポート登録のHTTPステータス・実行結果・正常リクエスト・成功レスポンス本文 |
| IT-10 | エラー応答・JWT認証検証（欠落／署名不正／該当プレイヤーなし＝すべて401）・デッキ内容検証エラー・複数項目検証の一括返却・保存例外・タイムアウト。ソート順／相関バリ／外部キャッシュ／決済代行／転送再連携は本APIに非該当で対象外 |
| IT-16 | カードリスト解読（全行解読／解読不可行→206）・行数上限（500行／501行）・取り込み結果（dtb_deck本体）が対象データと一致 |
| IT-17 | format_id必須・フォーマット定義検証（ファイルサイズ検証は本APIに非該当＝行数上限へ読み替え）・Redis下書き整合 |
| IT-19 | 同時実行数の制限（本APIはレート制限・排他制御を持たず、上限到達時の応答は正典未定義。実再現は手動・仕様化待ち） |
| IT-24 | 取り込み結果の出力内容（display_token・デッキカード明細・ボード外区分・本文・所有者・公開区分）が対象データと一致・format_id解読挙動 |
| IT-27 | レスポンスJSON書式／スキーマ／入力JSON／配置先（登録後取得に含まれる）。削除／移動・リネーム／コピー／同名ファイルは本APIにファイル操作が無く対象外 |
| IT-32 | 資格情報（JWT認証）・リクエスト（異常パラメータ・想定外項目）。バージョニングは正典にバージョン依存挙動の定義が無く対象外 |
| IT-33 | 対象機能（所有者固定）・区分整合（他プレイヤー・他デッキ不変）・検証エラー時の部分登録なし。ファイル出力／外部取引／売上返品は本APIに非該当で対象外 |
| IT-06 | （設計書補完）保存処理中の例外時に1トランザクションがロールバックされ部分登録が残らない |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-001	IT-09	リクエスト	P1	正常パラメータでPOSTし200が返る	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	"有効なjwt-tokenヘッダ
format_id・card_list（全行解読可）・deck_name等の正常ボディ"	"1. /api/deck/import へPOSTでリクエストを送信する
2. HTTPステータスを確認する"	正常インポート登録としてHTTPステータス200が返ること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-002	IT-09	実行結果	P3	登録実行後の処理結果が成功で一致する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token・正常なインポート登録リクエスト	"1. /api/deck/import へPOSTでリクエストを送信する
2. レスポンスと後続状態を確認する"	インポート登録処理が実行され、処理結果（成功）がレスポンスと一致すること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-003	IT-09	HTTPステータス	P3	成功時のHTTPステータスが200である	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token・正常なインポート登録リクエスト	"1. /api/deck/import へPOSTでリクエストを送信する
2. HTTPステータスを確認する"	HTTPステータスが成功（200）であること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-004	IT-27	JSON	P1	成功レスポンス本文がcode200・message・deck_idを含む	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token・正常なインポート登録リクエスト	"1. /api/deck/import へPOSTでリクエストを送信する
2. レスポンス本文を確認する"	成功時のレスポンス本文がsnake_caseキーで `code:200`・`message:「Deck registration success by import」`・発番された `deck_id` を含むこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-005	IT-32	資格情報	P1	有効なJWTでインポート登録が成功する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token（該当するプレイヤーあり）・正常リクエスト	"1. 有効なjwt-tokenを付与してPOSTで送信する
2. HTTPステータスを確認する"	資格情報が有効な場合、HTTPステータス200でインポート登録が成功すること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-006	IT-27	スキーマ	P1	成功レスポンス書式がcode・message・deck_idと一致する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token・scope_idが公開の正常リクエスト	"1. /api/deck/import へPOSTで送信する
2. レスポンス本文の書式を確認する"	成功時のレスポンス書式が仕様の `{code, message, deck_id}`（限定公開以外は display_token・errors を含まない）と一致すること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-007	IT-27	入力JSON	P2	card_list未指定・空でも空カード配列として登録成功する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-PAYLOAD	有効なjwt-token・format_id指定・card_listを未指定または空文字	"1. card_listを未指定にしてPOSTで送信する
2. HTTPステータスと後続状態を確認する"	card_listが未指定・空のとき空のカード配列として扱われ、検証エラーとならずHTTPステータス200で登録が成功すること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-010	IT-16	実行結果	P1	card_list全行解読で200・errorsなし・明細が一致する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・全行がカード名一致するcard_list	"1. 全行解読可のcard_listでPOSTで送信する
2. HTTPステータス・レスポンス本文・DB副作用（dtb_deck_card）を確認する"	全行が解読され、HTTPステータス200・errorsを含まない応答が返り、取り込まれたカード明細がcard_list内容と一致すること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-011	IT-16	実行結果	P1	解読できない行ありでコード206・errors・登録完了となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・カード名未一致の行を含むcard_list	"1. 解読不可行を含むcard_listでPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	登録は中断されず完了し、コードが206に切り替わり（HTTPステータス206・body `code:206`）、`errors` に解読できない行の行番号（0始まりのインデックス）が含まれ、`deck_id` が返ること（実装は206を返さず常に200の可能性あり＝付帯表4#3）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-012	IT-24	フォーマット定義	P2	format_idの統率者使用設定でcard_list解読が分岐する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	有効なjwt-token・統率者使用設定が有効なformat_id・統率者区切りを含むcard_list	"1. 統率者使用フォーマットのformat_idでPOSTで送信する
2. DB副作用（dtb_deck_cardのboard_id区分）を確認する"	format_idのフォーマット統率者使用設定に応じてcard_listが解読され、統率者区切り以降のカードが統率ボード区分として登録されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-013	IT-16	実行結果	P2	card_listが上限500行ちょうどでエラーにならず登録継続する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	有効なjwt-token・500行ちょうどのcard_list	"1. 500行のcard_listでPOSTで送信する
2. HTTPステータスを確認する"	行数上限の境界（500行）でエラーとならず、HTTPステータス200で登録が継続できること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-014	IT-16	実行結果	P1	card_listが501行（上限超過）で入力不正400となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	有効なjwt-token・501行のcard_list	"1. 501行のcard_listでPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	行数上限（500行）を超過した場合、入力不正を示すHTTPステータス400が返り、`{code, message}` に上限超過のメッセージを含むこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-015	IT-24	出力内容	P1	限定公開でdisplay_tokenが応答に含まれDB値と一致する	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・scope_idが限定公開のリクエスト	"1. scope_id=限定公開でPOSTで送信する
2. レスポンスとDB副作用（dtb_deck.display_token）を照合する"	公開区分が限定公開のとき表示用トークン `display_token` が応答に含まれ、dtb_deckの閲覧用トークン（display_token）と一致すること（DB副作用とレスポンスで判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-016	IT-24	出力内容	P2	公開・非公開ではdisplay_tokenを応答に含めない	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PAYLOAD	有効なjwt-token・scope_idが公開または非公開のリクエスト	"1. scope_id=公開または非公開でPOSTで送信する
2. レスポンス本文を確認する"	公開区分が限定公開でない場合、レスポンス本文に display_token を含めないこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-017	IT-24	出力内容	P2	限定公開かつ解読不可行で206・display_token・errorsを返す	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	有効なjwt-token・scope_idが限定公開・解読不可行を含むcard_list	"1. 限定公開かつ解読不可行を含むcard_listでPOSTで送信する
2. レスポンス本文を確認する"	コード206が返り、レスポンス本文に display_token と解読できない行番号の `errors` をともに含むこと（実装の206挙動は付帯表4#3）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-018	IT-10	エラー	P1	jwt-tokenヘッダ欠落で401となり登録されない	SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	jwt-tokenヘッダを付与しないリクエスト	"1. jwt-tokenヘッダ無しでPOSTで送信する
2. HTTPステータスと後続状態を確認する"	認証拒否を示すHTTPステータス401が返り、デッキが登録されないこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-019	IT-10	エラー	P2	署名不正のJWTで401となり登録されない	SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	署名検証に失敗するjwt-token	"1. 署名不正のjwt-tokenでPOSTで送信する
2. HTTPステータスと後続状態を確認する"	署名不正を認証拒否として扱い、HTTPステータス401が返り、デッキが登録されないこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-020	IT-10	エラー	P2	該当プレイヤーなしのJWTで401となり登録されない	SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	検証は通るが該当するプレイヤーが存在しないjwt-token	"1. 該当プレイヤーなしのjwt-tokenでPOSTで送信する
2. HTTPステータスと後続状態を確認する"	該当するプレイヤーが存在しない場合を認証拒否として扱い、HTTPステータス401が返り、デッキが登録されないこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-021	IT-17	フォーマット定義	P1	format_id未指定で入力不正400となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・format_idを未指定または0以下のリクエスト	"1. format_id未指定のリクエストをPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	必須の format_id が未指定の場合、入力不正を示すHTTPステータス400が返り、`{code, message}` にformat_id必須のメッセージを含むこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-022	IT-10	エラー	P2	デッキ内容検証失敗で400となり検証エラーを返す	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・デッキ・デッキカードの必須項目不足／不正値を含むリクエスト	"1. デッキ内容が検証エラーとなるリクエストをPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	デッキ・デッキカードが保存サービスの検証に失敗した場合、入力不正を示すHTTPステータス400が返り、`{code, message}` に検証エラーメッセージを含むこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-023	IT-10	エラー	P2	複数項目の検証失敗で400となり検証エラー内容を含む	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・デッキ内容の複数項目が検証に失敗するリクエスト	"1. 複数項目が不正なリクエストをPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	複数項目が検証に失敗した場合、HTTPステータス400が返り、`{code, message}` に検証エラー内容を含むこと。全件まとめ返却の有無および返却構造（配列／連結文字列等）は正典未定義のため固定せず、要確認・仕様化待ちとする（付帯表4#5）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-024	IT-24	出力内容	P3	保存処理中のその他の例外で処理失敗500となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-PLAYER-BASE	有効なjwt-token・保存処理中の例外を誘発するシナリオ	"1. 保存例外を誘発してPOSTで送信する
2. 応答を確認する"	保存処理中のその他の例外時に処理失敗を示すHTTPステータス500が返り、`{code, message}` を返すこと（500応答の確実性は要確認＝付帯表4#6、例外の実再現は要実機確認）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-025	IT-16	実行結果	P1	インポート登録後にdtb_deckへデッキ本体が1件登録される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・deck_name・format_id・archetype_id等を指定する正常リクエスト	"1. /api/deck/import へPOSTで送信する
2. DB副作用（dtb_deck）を照合する"	dtb_deckにデッキ本体が1件新規登録され、識別子（id）が発番されデッキ名・フォーマット・所有プレイヤーが指定値で登録されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-026	IT-24	出力内容	P1	デッキカードがdtb_deck_cardにcard_id・board_id・countで登録される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・メイン/サイド/統率の各ボードのカードを含むcard_list	"1. /api/deck/import へPOSTで送信する
2. DB副作用（dtb_deck_card）を照合する"	解読されたカード明細がdtb_deck_cardにdeck_id・card_id・board_id（メイン/サイド/統率の区分）・countで登録されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-027	IT-24	出力内容	P2	メイビー/アトラクション/ステッカーが各表へ振り分け登録される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・ボード外区分（メイビー/アトラクション/ステッカー）を含むcard_list	"1. /api/deck/import へPOSTで送信する
2. DB副作用（dtb_maybe_card・dtb_attraction_card・dtb_sticker_card）を照合する"	ボード外区分のカードがdtb_maybe_card・dtb_attraction_card・dtb_sticker_card（いずれもdeck_id・card_id・count）へ振り分けて登録されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-028	IT-24	出力内容	P2	本文がtext_main・text_side・text_commandに保持される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・メイン/サイド/統率の本文を含むcard_list	"1. /api/deck/import へPOSTで送信する
2. DB副作用（dtb_deckのtext_main・text_side・text_command）を照合する"	メイン・サイド・統率の本文がdtb_deckのtext_main・text_side・text_commandへ保持されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-029	IT-33	対象機能	P1	所有プレイヤーが認証プレイヤーで固定登録される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	認証プレイヤーのjwt-token・正常リクエスト	"1. 認証プレイヤーのjwt-tokenでPOSTで送信する
2. DB副作用（dtb_deck.player_id）を照合する"	登録されたデッキの所有プレイヤー（player_id）が、jwt-tokenから特定した認証プレイヤーで固定登録されること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-030	IT-24	出力内容	P3	作成日時・更新日時に登録時の現在日時が設定される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・正常リクエスト	"1. /api/deck/import へPOSTで送信する
2. dtb_deckのcreate_date・update_dateを確認する"	dtb_deckのcreate_date・update_dateに登録時の現在日時が設定されること（現在日時の確定的判定は要実機確認）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-031	IT-27	配置先	P1	登録後に該当デッキが取得結果に含まれる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・正常リクエスト	"1. /api/deck/import へPOSTで送信し発番されたdeck_idを取得する
2. DB副作用（dtb_deck）で当該deck_idを照合する"	発番されたdeck_idのデッキ本体が永続化先（dtb_deck）に存在し、取得結果に含まれること（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-032	IT-33	区分整合	P1	登録後に他プレイヤー・他デッキのレコードが不変	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST／SEED-A15-17-PLAYER-BASE	有効なjwt-token・自プレイヤーのデッキをインポート登録する正常リクエスト	"1. /api/deck/import へPOSTで送信し200と成功応答を確認する
2. DB副作用（他プレイヤー・他デッキのレコード）を照合する"	登録対象外の他プレイヤー・他デッキのデッキ本体・デッキカードが登録前と一致し、変動しないこと（DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-033	IT-33	エラー	P1	検証エラー時に保存へ到達せず部分登録が残らない	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-PLAYER-BASE	有効なjwt-token・デッキ内容検証に失敗するリクエスト	"1. 検証エラーとなるリクエストをPOSTで送信し4xxを確認する
2. DB副作用（dtb_deck・dtb_deck_card等）を受信前と照合する"	検証エラー時はHTTPステータス4xxが返り、デッキ本体・デッキカード・各カードテーブルが受信前と一致し、部分登録が残らないこと（保存処理中の例外時ロールバックはE2E-150で確認。DB副作用で判定）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-034	IT-17	フォーマット定義	P3	登録成功後にRedis上の下書きが削除される	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-CARDLIST	有効なjwt-token・対象デッキの下書きがRedisに存在する状態	"1. 下書き存在状態で/api/deck/import へPOSTで送信する
2. Redis上の下書き状態を確認する"	保存後に当該デッキのRedis上の下書きが削除され、保存済みデータと下書きの不整合が解消されること（Redis内部状態の観測手段は要実機確認）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-035	IT-19	同時実行数の制限	P3	上限到達時の応答が要実機確認・仕様化待ちである	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・一定時間内に上限を超える並行リクエスト	"1. 上限を超える並行リクエストをPOSTで送信する
2. 応答を確認する"	本APIにレート制限・同時実行数制限の定義が無く、上限到達時の応答は正典未定義のため固定期待にできず、要実機確認・仕様化待ちであること（並行送信の実再現も要実機確認）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-036	IT-10	エラー	P3	処理タイムアウト時に仕様どおりの応答となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPOSTで送信する
2. 応答と後続状態を確認する"	サーバ無応答・未定義例外で停止せず、エラー応答が返り、デッキが部分登録されないこと（タイムアウト実再現は要実機確認）。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-037	IT-32	リクエスト	P3	想定外項目追加時の挙動が要実機確認・仕様化待ちである	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-PAYLOAD	正常リクエストに仕様未定義の想定外項目（項目名と値のセット）を追加	"1. 想定外項目を含むリクエストをPOSTで送信する
2. HTTPステータスを確認する"	正本mdに未定義項目の許容/無視/エラーの仕様が無いため、想定外項目追加時の登録成否を固定期待にできず、許容・無視・エラーいずれの挙動とするかは要実機確認・仕様化待ちであること。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-038	IT-32	リクエスト	P3	異常なパラメータ値で入力不正となる	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER	有効なjwt-token・整合性検証に失敗する異常な値を含むリクエスト	"1. 異常な値を含むリクエストをPOSTで送信する
2. HTTPステータスとレスポンス本文を確認する"	入力不正を示すHTTPステータス400が返り、レスポンス本文に `{code, message}`（検証エラー内容）を含むこと。
a15-17_api_deck_builder_deck_import_register（API_デッキビルダー_デッキインポート登録）	E2E-A15-17-150	IT-06	ロールバック	P2	保存処理中の例外で1トランザクションがロールバックされ部分登録が残らない	SEED-A15-17-JWT-PLAYER／SEED-A15-17-MASTER／SEED-A15-17-PLAYER-BASE	有効なjwt-token・保存処理中の例外を誘発するシナリオ	"1. 保存例外を誘発してPOSTで送信する
2. 応答とDB副作用（dtb_deck・dtb_deck_card等）を照合する"	処理失敗を示すHTTPステータス500が返り、1トランザクションがロールバックされてデッキ本体・デッキカード・各カードテーブルに部分登録が残らないこと（例外の実再現は要実機確認・DB副作用で判定）。
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

エンドポイントは実装で `#[Route('/api/deck/import', name: 'api_deck_builder_deck_import_post', methods: ['POST', 'OPTIONS'])]`（`src/Eccube/Controller/App/DeckBuilder/DeckController.php:667`）。**正本mdのパス `POST /deck/import` は `/api` プレフィクスを欠き実装と食い違う。送信先パスは実装の実効パス `/api/deck/import` に統一し、合否は正本mdの意味（成功＝code:200＋message＋deck_id、解読不可行あり＝code:206＋errors、認証＝JWT照合の通過/拒否＝401、format_id必須/検証＝400、保存例外＝500、副作用＝登録の有無）で判定する。差異は付帯表4#1で一元管理し、TSV本体の期待値には設計パスを混在させない**。認証は `jwt-token` ヘッダ→`ImportDeckAction`内の`JwtPlayerAuthenticator::authenticate`（ImportDeckAction.php:62／`src/Eccube/Service/App/DeckBuilder/JwtPlayerAuthenticator.php:35-53`）。トークン欠落・検証失敗→`InvalidTokenException`、該当プレイヤーなし→`PlayerNotFoundException`（ImportDeckAction.php:63-65）、いずれも401（DeckController.php:698-702）。format_id不備→`InvalidRequestException('format_id is required')`→400（ImportDeckAction.php:82-85／DeckController.php:718-724）。デッキ内容検証失敗→`BadRequestHttpException`→`InvalidRequestException`→400（ImportDeckAction.php:122-148,163-173／DeckController.php:726）。card_list行数上限超過→`BadRequestHttpException`（`CardUtil::decodeCardList` MAX_LINE_COUNT=500・CardUtil.php:53-54。beginTransaction前のためグローバルハンドラ依存＝付帯表4#8）。保存例外→`SystemErrorException`（ImportDeckAction.php:149-153。handleImportDeckで明示catchせずグローバルハンドラ依存＝付帯表4#6）。登録本体は`ImportDeckAction::handle`（ImportDeckAction.php:60-161／`beginTransaction`/`commit`/`rollback`・`DeckBuilderDeckEntityManager`での`dtb_deck`・`dtb_deck_card`・`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card`保存・`createDisplayToken`）。`display_token`は`scope_id===3`（DISPLAY_UNLISTED・DeckController.php:54,735-738）の場合のみ応答に含む。`errors`は解読不可行があるときのみ含む（DeckController.php:740-742）。本APIは正本md記載のとおりブラウザ向け画面を持たないため、登録副作用は永続化先テーブル（正本md DBカラム節・リニューアル移行表）を直接DB照合（DB副作用観測）して判定し、別機能の管理画面 デッキ管理の表示は合否条件にしない。

| テストID | E2E可否 | 対象/APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A15-17-001/002/003 | E2E自動化(API/統合) | `POST /api/deck/import`（DeckController.php:667）／成功応答（DeckController.php:729-744） | 利用者視点の入口・処理フロー#5・レスポンス(成功)`{code,message,deck_id}`／IT-09 | IT-A15-17-...-075,073,074 |
| E2E-A15-17-004/006 | E2E自動化(API/統合) | 成功応答のsnake_caseキー・書式（DeckController.php:729-744／副作用節「JSONキーはsnake_case」） | レスポンス(成功)・副作用(JSON応答整形)／IT-27 | IT-A15-17-...-068,072 |
| E2E-A15-17-005 | E2E自動化(API/統合) | JWT認証（JwtPlayerAuthenticator.php:35-53）→成功（DeckController.php:729-744） | 認証・認可(有効JWTで登録可)・処理フロー#1／IT-32 | IT-A15-17-...-004 |
| E2E-A15-17-007 | E2E自動化(API/統合) | card_list任意・空時は空カード配列（ImportDeckAction.php:92-98／`decodeCardList`） | 入出力(card_list任意・未指定は空配列)・バリデーション節／IT-27 | IT-A15-17-...-070 |
| E2E-A15-17-010/011/017 | E2E自動化(API/統合) | `decodeCardList`の`errors`（CardUtil.php:57-93／ImportDeckAction.php:156-160）・206切替（正本md処理フロー#6。実装はcode/HTTPを206に切替えず常に200＝付帯表4#3） | 処理フロー#6・レスポンス(成功206)・入出力(errors=0始まり行番号)・エラー処理(解読不可行は登録完了)／IT-16・IT-24 | IT-A15-17-...-001,016,029,059 |
| E2E-A15-17-012 | E2E自動化(API/統合) | format_id統率者使用設定で解読分岐（ImportDeckAction.php:97／`getUseCommandFlg`） | 処理フロー#3(format_idの統率者使用設定で解読)・用語(ボード)／IT-24 | IT-A15-17-...-019 |
| E2E-A15-17-013/014 | E2E自動化(API/統合) | 行数上限500（CardUtil.php:26,53-54／`BadRequestHttpException`）。014＝501行で400 | 入出力(card_list上限500行・超過時400)・バリデーション節／IT-16 | IT-A15-17-...-008,046,009,028 |
| E2E-A15-17-015/016 | E2E自動化(API/統合) | `scope_id===3`(DISPLAY_UNLISTED)のみdisplay_token応答（DeckController.php:735-738）＋DB副作用（dtb_deck.display_token） | 処理フロー#5(限定公開時display_token)・レスポンス(成功)・DBカラム(閲覧用トークン)／IT-24 | IT-A15-17-...-015,034,045,031,042 |
| E2E-A15-17-018/019/020 | E2E自動化(API/統合) | 401（DeckController.php:698-702）／`InvalidTokenException`(欠落・署名不正＝JwtPlayerAuthenticator.php:37-49)／`PlayerNotFoundException`(該当なし＝ImportDeckAction.php:63-65)／要実機確認: HS256署名検証の実方式 | 認証・認可(欠落/署名不正/該当プレイヤーなし＝すべて401)・処理フロー#1・権限・認可節／IT-10 | IT-A15-17-...-006,026,056,027,057 |
| E2E-A15-17-021 | E2E自動化(API/統合) | `InvalidRequestException('format_id is required')`→400（ImportDeckAction.php:82-85／DeckController.php:718-724） | 入出力(format_id必須)・バリデーション節・処理フロー#3／IT-17 | IT-A15-17-...-021 |
| E2E-A15-17-022/023/038 | E2E自動化(API/統合) | デッキ内容検証→`BadRequestHttpException`→400（ImportDeckAction.php:122,163-173／DeckController.php:726）。023＝複数メッセージ空白連結（ImportDeckAction.php:167-171） | バリデーション節(デッキ内容検証→400)・処理フロー#4・レスポンス(失敗)`{code,message}`／IT-10・IT-32 | IT-A15-17-...-017,058,080,084,076 |
| E2E-A15-17-024/150 | 手動（要実機確認・保存例外実再現／500の確実性） | 保存例外→`SystemErrorException`（ImportDeckAction.php:149-153）／`rollback`（ImportDeckAction.php:150-151）／handleImportDeckで500を明示catchせずグローバルハンドラ依存（付帯表4#6）／例外の実再現は実機依存 | エラー処理(保存例外→500)・排他制御・トランザクション(例外時ロールバック)・データ整合性／IT-24・IT-06(補完) | IT-A15-17-...-030,060（150は母集合外・設計書補完） |
| E2E-A15-17-025/026/027/028/030/031 | E2E自動化(API/統合) | DB副作用照合（`dtb_deck`＝本体・本文・日時／`dtb_deck_card`＝card_id/board_id/count／`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card`＝ボード外区分）。`DeckBuilderDeckEntityManager`保存（ImportDeckAction.php:104-140）。本APIはブラウザ向け画面を持たず、別機能の管理画面表示は合否にしない。030＝日時の確定的判定は要実機 | 副作用節・DBカラム節・データ整合性(新規登録)・処理フロー#4-5／IT-16・IT-24・IT-27 | IT-A15-17-...-002,051,022,052,023,053,017,038,071 |
| E2E-A15-17-029 | E2E自動化(API/統合) | 所有プレイヤー固定（ImportDeckAction.php:110／`Player`）＋DB副作用（dtb_deck.player_id） | 認証・認可(認証プレイヤーを所有者)・DBカラム(所有プレイヤー)・権限・認可節／IT-33 | IT-A15-17-...-007,033,065 |
| E2E-A15-17-032/033 | E2E自動化(API/統合) | `POST /api/deck/import`（DeckController.php:667）＋`ImportDeckAction`（ImportDeckAction.php:60-161）。一次オラクル＝APIレスポンス（成功200／4xx）＋DB副作用（`dtb_deck`・`dtb_deck_card`等をDB照合） | データ整合性(更新範囲は新規作成・所有者固定)・バリデーション(検証は保存より前＝検証エラー時は保存に到達せず未登録)・排他制御(保存例外時の1トランザクションロールバックは150)／IT-33 | IT-A15-17-...-088,089,018 |
| E2E-A15-17-034 | 手動（要実機確認・Redis下書き状態の観測手段） | 保存後にRedis下書き削除（正本md データ整合性・副作用節。Redis内部状態はAPI応答に現れず観測手段が実機依存） | データ整合性(下書きとの整合)・副作用節(Redis下書き削除)／IT-17 | IT-A15-17-...-020,050 |
| E2E-A15-17-035 | 手動（要実機確認・上限/並行送信実再現・正典にレート制限定義なし） | `POST /api/deck/import`（DeckController.php:667）／要実機確認: レート制限・同時実行数制限（正本md・実装に定義なし） | 排他制御・トランザクション節(楽観/悲観ロックなし)・正典にレート制限定義なし／IT-19 | IT-A15-17-...-078 |
| E2E-A15-17-036 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | エラー処理(例外)・処理フロー／IT-10 | IT-A15-17-...-086 |
| E2E-A15-17-037 | 手動（要実機確認・想定外項目の許容/無視/エラー仕様未定義） | `parseJsonBody`で全キー参照（DeckController.php:690）・正本md未定義。要実機確認: 未定義項目の許容/無視/エラー挙動 | データ整合性・入出力(リクエスト)（正本mdに未定義項目の許容/無視/エラー定義が無く固定期待にできず仕様化待ち）／IT-32 | IT-A15-17-...-077 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象画面でファイル処理を実行する」「対象機能を実行する」等の汎用文）で機能固有シナリオを持たず、ファイル取込/出力・移動・コピー・外部取引等の本機能（JSON API）に非該当な観点を多く含む。本E2Eは正本md本文（処理フロー#1-6・バリデーション節・副作用節・DBカラム節・排他制御節）を一次オラクルに、API/統合レイヤ単独（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）で網羅し、正常×異常の対（インポート登録成功↔形式不正(card_list上限/解読不可行206)↔バリデーション(format_id必須/デッキ内容検証)↔未ログイン(401)↔DB登録/部分登録なし/ロールバック）を揃えた。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `a15_17_api_deck_builder_deck_import_register_it_cases.md` の関連ID件数（IT-09=3／IT-10=8／IT-16=12／IT-17=3／IT-19=1／IT-24=37／IT-27=15／IT-32=4／IT-33=7＝計90）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-09 | 3 | 0 | 3 | 0 | 0 | 正常登録のHTTPステータス・実行結果・正常リクエスト |
| IT-10 | 8 | 0 | 2 | 2 | 4 | 複数単項目バリ一括返却・DB相関バリ一括返却(2)はAPI/統合。保存例外時のエラー応答(1)・タイムアウト(1)＝計2は手動（要実機確認）。ソート順(2)・相関バリ(2)＝計4は本機能に非該当で対象外 |
| IT-16 | 12 | 0 | 12 | 0 | 0 | カードリスト解読・行数上限・取り込み結果(dtb_deck本体)が対象データと一致はHTTPステータス/レスポンス本文/DB副作用で観測可 |
| IT-17 | 3 | 0 | 2 | 1 | 0 | format_id必須・デッキ内容検証はAPI/統合。下書き整合(Redis)は観測手段が実機依存で手動。ファイルサイズ検証は本APIに非該当で行数上限へ読み替え |
| IT-19 | 1 | 0 | 0 | 1 | 0 | 同時実行数の制限＝本APIにレート制限・排他制御なし。上限到達応答は正典未定義で手動・要実機(仕様化待ち) |
| IT-24 | 37 | 0 | 32 | 3 | 2 | 取り込み結果の出力内容(display_token・明細・ボード外区分・本文・所有者・公開区分)・format_id解読はAPI/統合(DB副作用照合)。日時(1)・保存例外実再現(2)＝計3は手動。計算処理(1)・削除方式(1)＝計2は本APIに非該当で対象外 |
| IT-27 | 15 | 0 | 11 | 0 | 4 | JSON・スキーマ・入力JSON・配置先(登録後取得)・取り込み結果はAPI/統合。削除(1)・移動リネーム(1)・コピー(1)・同名ファイル(1)＝計4はファイル操作で本APIに非該当で対象外 |
| IT-32 | 4 | 0 | 2 | 1 | 1 | 資格情報・リクエスト(異常パラメータ)はAPI/統合。想定外項目(1)は正本mdに未定義項目仕様が無く手動・要実機。バージョニング(1)は正典にバージョン依存挙動の定義が無く対象外 |
| IT-33 | 7 | 0 | 5 | 0 | 2 | 対象機能(所有者固定)・区分整合・部分登録なし・ファイル登録(取込)はAPI/統合。ファイル出力(1)・外部取引(1)＝計2は本APIに非該当で対象外 |
| 合計 | 90 | 0 | 69 | 8 | 13 | **未分類 0** |

注1: 対象外13件の内訳は、IT-10 4（複数単項目バリのソート順1＝正典にソート順定義なし、相関バリ一括返却1＋ソート順1＝本機能に相関バリデーション該当処理なし、DB相関バリのソート順1＝正典にソート順定義なし）／IT-24 2（計算処理1＝本APIは金額/税/在庫の再計算を行わない、削除方式1＝新規登録に削除処理なし）／IT-27 4（削除1・移動リネーム1・コピー1・同名ファイル1＝本APIにファイル削除/移動/コピー/同名ファイル出力の処理なし＝JSON APIでカードリストをボディ受領）／IT-32 1（バージョニング＝正典にAPIバージョン依存の挙動定義なし）／IT-33 2（ファイル出力1＝本APIはファイル出力を行わない、外部取引1＝本APIに外部取引・売上返品なし）。いずれも理由付きで放置ではない。

注2（母集合外・設計書補完ケース）: 正本md本文（排他制御・トランザクション節）から、母集合90行に対応行を持たない補完ケース E2E-150（IT-06 ロールバック）を追加した。母集合集計には算入せず別管理する。入力検証（IT-22）・DB登録副作用（IT-23/IT-26）は、母集合のインポート結果観点（IT-16/IT-24「取り込み結果が対象データと一致」）で観測できるため母集合内に分類し、別途の補完ケースは作らない。既存IT casesの対象外観点表が入力検証(IT-22)・DB登録/更新(IT-23/IT-26/IT-05)・ロールバック(IT-06)・排他制御(IT-07)を「該当処理・I/Fがないため」「更新処理がないため」と誤除外していたため、上位オラクル（正本md・基本設計）に照らして補正した（付帯表4#7）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 自動化(API/統合) | 010（全行解読で取り込み結果が一致） |
| 002 | IT-27 | 実行結果 | 自動化(API/統合) | 025（dtb_deck本体登録） |
| 003 | IT-27 | 出力失敗 | 自動化(API/統合) | 005（プレイヤー特定・認証成功で登録） |
| 004 | IT-32 | 資格情報 | 自動化(API/統合) | 005（有効JWTで200） |
| 005 | IT-16 | 実行結果 | 自動化(API/統合) | 001（正常インポート登録） |
| 006 | IT-16 | 実行結果 | 自動化(API/統合) | 018（jwt欠落で401） |
| 007 | IT-16 | 実行結果 | 自動化(API/統合) | 029（所有者固定） |
| 008 | IT-16 | 実行結果 | 自動化(API/統合) | 013（card_list上限500行でエラーなし） |
| 009 | IT-16 | 実行結果 | 自動化(API/統合) | 014（card_list 501行で400） |
| 010 | IT-16 | 実行結果 | 自動化(API/統合) | 007（card_list空＝最小で登録成功） |
| 011 | IT-16 | 実行結果 | 自動化(API/統合) | 022（最小未満相当＝検証エラーで400） |
| 012 | IT-16 | 実行結果 | 自動化(API/統合) | 015/016（scope_id別display_token） |
| 013 | IT-16 | 実行結果 | 自動化(API/統合) | 004（message） |
| 014 | IT-16 | 実行結果 | 自動化(API/統合) | 004/025（deck_id） |
| 015 | IT-24 | 実行結果 | 自動化(API/統合) | 015（display_token応答とDB一致） |
| 016 | IT-24 | 実行結果 | 自動化(API/統合) | 010（card_list取り込み結果） |
| 017 | IT-24 | 実行結果 | 自動化(API/統合) | 028（デッキ内容＝本文保持） |
| 018 | IT-16 | エラー | 自動化(API/統合) | 033（更新の有無＝検証エラー時未登録） |
| 019 | IT-24 | フォーマット定義 | 自動化(API/統合) | 012（format_id統率者使用で解読分岐） |
| 020 | IT-17 | フォーマット定義 | 手動（要実機確認） | 034（下書き整合＝Redis状態の観測手段が実機依存） |
| 021 | IT-17 | フォーマット定義 | 自動化(API/統合) | 021（format_id必須→400） |
| 022 | IT-17 | フォーマット定義 | 自動化(API/統合) | 026（dtb_deck_card明細登録） |
| 023 | IT-27 | 実行結果 | 自動化(API/統合) | 027（メイビー/アトラクション/ステッカー振り分け） |
| 024 | IT-27 | 実行結果 | 自動化(API/統合) | 025（登録/更新＝新規登録） |
| 025 | IT-27 | 実行結果 | 自動化(API/統合) | 005/029（認証済みプレイヤー） |
| 026 | IT-24 | 実行結果 | 自動化(API/統合) | 018（未認証・トークン不正で401） |
| 027 | IT-27 | 実行結果 | 自動化(API/統合) | 018/019/020（認証不可で401） |
| 028 | IT-27 | エラー | 自動化(API/統合) | 014/022（検証失敗・行数超過で400） |
| 029 | IT-24 | フォーマット定義 | 自動化(API/統合) | 011/017（解読できない行ありで206・errors） |
| 030 | IT-24 | フォーマット定義 | 手動（要実機確認） | 024（保存処理中その他例外の実再現） |
| 031 | IT-24 | フォーマット定義 | 自動化(API/統合) | 015/016（公開区分別display_token） |
| 032 | IT-24 | フォーマット定義 | 対象外 | 新規登録に削除処理が無く、削除方式は本APIで作用しないため（正本md データ整合性「新規時には対象が無いため作用しない」） |
| 033 | IT-24 | 出力内容 | 自動化(API/統合) | 029（プレイヤー＝所有者固定） |
| 034 | IT-24 | 出力内容 | 自動化(API/統合) | 015（表示用トークン） |
| 035 | IT-24 | 出力内容 | 自動化(API/統合) | 025（デッキ登録インポート結果） |
| 036 | IT-24 | 出力内容 | 自動化(API/統合) | 018（認証失敗時） |
| 037 | IT-24 | 出力内容 | 自動化(API/統合) | 029（認可＝所有者） |
| 038 | IT-24 | 出力内容 | 自動化(API/統合) | 030（更新対象＝作成/更新日時） |
| 039 | IT-24 | 出力内容 | 自動化(API/統合) | 025（更新方法＝上書き/追加登録） |
| 040 | IT-24 | 出力内容 | 対象外 | 本APIは金額・税・ポイント・在庫数量の再計算や丸めを行わないため（正本md 業務ルール・計算） |
| 041 | IT-24 | 出力内容 | 自動化(API/統合) | 004（応答値） |
| 042 | IT-24 | 出力内容 | 自動化(API/統合) | 016（scope_id別display_token） |
| 043 | IT-24 | 出力内容 | 自動化(API/統合) | 004（message） |
| 044 | IT-24 | 出力内容 | 自動化(API/統合) | 004/025（deck_id） |
| 045 | IT-24 | 出力内容 | 自動化(API/統合) | 015（display_token） |
| 046 | IT-24 | 出力内容 | 自動化(API/統合) | 013（card_list最大長500行） |
| 047 | IT-24 | 出力内容 | 自動化(API/統合) | 007（デッキ内容最小＝空card_list） |
| 048 | IT-24 | 出力内容 | 自動化(API/統合) | 033（更新の有無＝該当しない値で未登録） |
| 049 | IT-24 | 出力内容 | 自動化(API/統合) | 033/150（トランザクション＝部分登録なし） |
| 050 | IT-24 | 出力内容 | 手動（要実機確認） | 034（下書きとの整合＝Redis状態の観測手段が実機依存） |
| 051 | IT-24 | 出力内容 | 自動化(API/統合) | 025（dtb_deck本体登録） |
| 052 | IT-24 | 出力内容 | 自動化(API/統合) | 026（dtb_deck_card明細登録） |
| 053 | IT-24 | 出力内容 | 自動化(API/統合) | 027（メイビー/アトラクション/ステッカー振り分け） |
| 054 | IT-24 | 出力内容 | 自動化(API/統合) | 025（登録/更新＝新規登録） |
| 055 | IT-24 | 出力内容 | 自動化(API/統合) | 005/029（認証済みプレイヤー） |
| 056 | IT-24 | 出力内容 | 自動化(API/統合) | 018（未認証・トークン不正で401） |
| 057 | IT-24 | 出力内容 | 自動化(API/統合) | 020（認証不可＝該当プレイヤーなしで401） |
| 058 | IT-24 | 出力内容 | 自動化(API/統合) | 022/014（検証失敗・行数超過で400） |
| 059 | IT-24 | 出力内容 | 自動化(API/統合) | 011/017（解読できない行ありで206） |
| 060 | IT-24 | 出力内容 | 手動（要実機確認） | 024（保存処理中その他例外の実再現） |
| 061 | IT-27 | 削除 | 対象外 | 本APIは削除処理を行わない（新規登録のPOST。論理削除deleted_atは当機能の対象外）ため |
| 062 | IT-27 | 移動・リネーム | 対象外 | 本APIにファイルの移動・リネーム処理が無いため（JSON APIでカードリストをボディ受領） |
| 063 | IT-27 | コピー | 対象外 | 本APIにファイルのコピー処理が無いため |
| 064 | IT-33 | 対象機能 | 自動化(API/統合) | 015（表示用トークン） |
| 065 | IT-33 | 対象機能 | 自動化(API/統合) | 029/032（所有者固定・対象レコード不変） |
| 066 | IT-33 | ファイル登録 | 自動化(API/統合) | 018/025（取込登録＝認証失敗時は登録なし） |
| 067 | IT-33 | ファイル出力 | 対象外 | 本APIはファイル出力を行わない（JSON応答整形のみ）ため |
| 068 | IT-27 | JSON | 自動化(API/統合) | 004（レスポンスJSON書式） |
| 069 | IT-27 | 同名ファイル | 対象外 | 本APIに同名ファイル出力の処理が無いため |
| 070 | IT-27 | 入力JSON | 自動化(API/統合) | 007（リクエストJSON＝card_list未指定で空配列） |
| 071 | IT-27 | 配置先 | 自動化(API/統合) | 031（登録後取得に含まれる） |
| 072 | IT-27 | スキーマ | 自動化(API/統合) | 006（成功レスポンス書式/スキーマ） |
| 073 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 074 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 075 | IT-09 | リクエスト | 自動化(API/統合) | 001（正常リクエストで200） |
| 076 | IT-32 | リクエスト(異常パラメータ) | 自動化(API/統合) | 038（異常リクエストで400） |
| 077 | IT-32 | リクエスト(想定外項目) | 手動（要実機確認） | 037（正本mdに未定義項目の許容/無視仕様が無く固定期待にできず仕様化待ち） |
| 078 | IT-19 | 同時実行数の制限 | 手動（要実機確認） | 035（レート制限定義なし・上限到達応答が正典未定義・並行送信実再現） |
| 079 | IT-10 | エラー | 手動（要実機確認） | 024（保存例外時のエラー応答・例外の実再現が実機依存） |
| 080 | IT-10 | エラー(複数単項目バリ一括返却) | 自動化(API/統合) | 023（複数項目検証失敗で400。一括返却構造は要確認＝付帯表4#5） |
| 081 | IT-10 | エラー(複数単項目バリ ソート順) | 対象外 | 正典にエラーメッセージのソート順定義が無く、固定期待にできないため |
| 082 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 本機能に相関（クロス項目）バリデーション該当処理が無いため（単項目＋エンティティ制約のみ） |
| 083 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上＋ソート順定義なし |
| 084 | IT-10 | エラー(DB相関バリ一括返却) | 自動化(API/統合) | 023（マスタ解決を伴う検証失敗で400。一括返却構造は要確認＝付帯表4#5） |
| 085 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 正典にソート順定義が無いため |
| 086 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 036（タイムアウト実再現） |
| 087 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン依存の挙動定義が無く、バージョン依存挙動は創作になるため |
| 088 | IT-33 | 区分整合 | 自動化(API/統合) | 032（登録対象外データ不変。一次オラクル＝API応答＋DB副作用照合） |
| 089 | IT-33 | エラー | 自動化(API/統合) | 033（検証エラー時は保存に到達せず部分登録なし。保存例外時ロールバックは150） |
| 090 | IT-33 | 外部取引 | 対象外 | 外部取引による売上・返品・取消等の加減算処理が本APIに無いため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 69／手動・要実機 8（020,030,050,060,077,078,079,086）／対象外 13（032,040,061,062,063,067,069,081,082,083,085,087,090）。**未分類 0**（母集合90行）。母集合外の設計書補完ケース（150＝IT-06）は別管理で母集合集計を変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A15-17-JWT-PLAYER | dtb_player（＋紐づくdtb_customer）／jwt-token | 有効なプレイヤー1。JWTペイロードの利用者IDが当該プレイヤーに紐づくHS256署名のjwt-tokenを供給（トークン原値・署名シークレットは環境変数で供給しログ/設計に書かない）。018/019/020用に「ヘッダ欠落」「署名不正」「該当プレイヤーなし」のトークン状態を別途用意 | fixture／env（JWT発行は a15 デッキビルダー用ログインAPI またはenv供給。署名検証方式・クレーム名は要実機確認＝付帯表4#2） | 専用プレイヤー・撤去可。トークンは使い捨て | 018/019/020以外の全API/統合ケース |
| SEED-A15-17-MASTER | mtb_format／mtb_archetype／mtb_card_image／ボード区分／カードマスタ／キャンペーンタグ | フォーマット（統率者使用設定ON/OFFの双方）・アーキタイプ・代表カード画像・ボード区分（メイン/サイド/統率/メイビー/アトラクション/ステッカー）・card_list解読で名前一致するカードマスタ・キャンペーンタグの各既定マスタ。解読不可行（カード名未一致）を再現できるよう、未登録カード名を含むcard_listを別途用意 | fixture（既定マスタ） | 既存利用・撤去不要 | マスタ解決・解読・登録の全ケース |
| SEED-A15-17-CARDLIST | card_list テキスト（synthetic） | 全行解読可／解読不可行（カード名未一致）を含む／500行ちょうど／501行（上限超過）／統率者区切りを含む／メイビー・アトラクション・ステッカー区切りを含む／空、の各バリエーション。行番号は0始まりインデックスで`errors`照合に用いる | synthetic（正本md 用語・入出力節由来。現行deck-api実環境は使わない） | テスト内生成・後始末不要 | 010/011/012/013/014/017/026/027/028 等のcard_list送信ケース |
| SEED-A15-17-PLAYER-BASE | dtb_deck（＋dtb_deck_card等）／別プレイヤー | 区分整合・部分登録なし・ロールバック照合の基準。別プレイヤーの既存デッキ1件以上＋自プレイヤーの既存デッキ（任意）。DB副作用照合の更新前スナップショットを取得 | fixture／migration | 専用データ・テスト前に初期状態へ復元してべき等化 | 010,015,024,025,026,027,028,029,030,031,032,033,150（DB副作用観測） |
| SEED-A15-17-PAYLOAD | リクエストボディ（synthetic） | 正本md入出力節準拠の最小ボディ（format_id・card_list・deck_name・scope_id=1/2/3・archetype_id・image_card_id・campaign_tag_ids）。正常／format_id未指定／デッキ内容検証異常／想定外項目／scope_id各値、のバリエーション | synthetic（正本md入出力節由来。実装DTOの追加項目は期待値に含めない＝付帯表4#9） | テスト内生成・後始末不要。記載フィールドのみ、未記載は要実機確認コメント | 全送信ケース |

注: ペイロード・card_listは正本md記載のフィールドのみで最小構成し、deck-api（現行）実環境は使わない。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_deck`・`dtb_deck_card`・`dtb_maybe_card`・`dtb_attraction_card`・`dtb_sticker_card` の同名スキーマ。公開区分は `scope_id` でなく `private_flg`／`display_token` で表現＝付帯表4#9）に従う。JWTトークン・署名シークレット・閲覧用トークンの原値は環境変数で供給し、設計・ログに原値を書かない（正本md ログ・監査節）。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md・観点表・基本設計）どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `POST /deck/import`（正本md 利用者視点の入口） | `#[Route('/api/deck/import', name: 'api_deck_builder_deck_import_post', methods: ['POST','OPTIONS'])]`（DeckController.php:667）＝実効 `/api/deck/import` | **正本mdパスは `/api` プレフィクスを欠き実装と不一致**。テストは実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | JWTペイロード `aud` の顧客IDからプレイヤーを引く（正本md 認証・認可節） | `$payload['sub']` の整数から `findOneBy(['Customer' => (int) sub])` で特定（JwtPlayerAuthenticator.php:47-52） | **正本mdは `aud` クレーム、実装は `sub` クレームと食い違う**。クレーム名・署名方式(HS256)の実方式は要実機確認。テストは「有効JWTで成功・不正/該当なしで401」の意味で判定 | 005,018,019,020,029 | 要確認(認証クレーム/署名方式) |
| 3 | 解読できない行があるときコードを206に切り替える（正本md 処理フロー#6・レスポンス(成功)・利用者視点の入口「コード206を返す」） | 応答は常に `'code' => Response::HTTP_OK`(200)・HTTPステータス200で、`errors` のみ非空時に付加（DeckController.php:729-744）。206への切替が無い | **実装は解読不可行があっても206を返さず常に200を返し、正本mdの206切替と不一致**。テストは仕様の206（body code・HTTPステータス）で判定し、落ちて検出 | 011,017 | 不具合候補(206切替欠落) |
| 4 | 失敗系は401/400/500（正本md レスポンス(失敗)・エラー処理）。format_id不正値は400 | format_id有効値だがマスタ不在時 `FormatNotFoundException`→404（ImportDeckAction.php:87-89／DeckController.php:713-717） | **正本mdは404を定義せず、フォーマット不在時の404は仕様未定義**。テストはformat_id未指定→400(format_id_required)で判定し、マスタ不在404は固定期待にしない（要実機確認） | 021 | 要確認(未定義ステータス404) |
| 5 | 検証失敗は入力不正＝HTTP 400・検証エラーメッセージ（正本md レスポンス(失敗)・バリデーション節） | `BadRequestHttpException`→`InvalidRequestException`→400（ImportDeckAction.php:144-148／DeckController.php:726）。`validateDeck`は複数メッセージを空白連結（ImportDeckAction.php:167-171） | 実装は400で仕様と一致。ただし複数エラーの一括返却の構造（配列/連結文字列）は仕様未定義につき要確認 | 023 | 要確認(複数エラー返却構造) |
| 6 | 保存処理中のその他の例外は処理失敗＝HTTP 500（正本md エラー処理・レスポンス(失敗)） | `ImportDeckAction` が `SystemErrorException` を投げる（ImportDeckAction.php:149-153）が、`handleImportDeck` は 401/404/400 のみ明示catchし `SystemErrorException` を明示catchしない（DeckController.php:698-727） | **handleImportDeckが500を明示catchせず、500応答はグローバル例外ハンドラ依存**。500が確実に返るかは要実機確認。テストは仕様の500で判定 | 024,150 | 要確認(500ハンドリング) |
| 7 | 正本md・実装に入力検証（バリデーション節）・DB登録副作用（副作用・DBカラム節）・トランザクションロールバック（排他制御節）が存在 | 既存IT cases 対象外観点表が「バリデーション(IT-22)…本機能に入力検証対象がないため」「登録/更新(IT-23/IT-26/IT-05)…本機能に更新処理がないため／該当する処理・I/Fがないため」「ロールバック(IT-06)・排他制御(IT-07)…該当する処理・I/Fがないため」と記載 | **既存IT cases（観点表側）が入力検証・DB登録・ロールバック・排他制御を誤って対象外にしている**。上位オラクル（正本md・基本設計）に照らし、DB登録は母集合IT-16/IT-24で観測しロールバックはIT-06補完で網羅 | 010,022,025-033,150 | 不具合候補(観点表の誤分類) |
| 8 | カードリスト500行超過は入力不正＝HTTP 400・上限超過メッセージ（正本md 入出力・バリデーション節） | `CardUtil::decodeCardList` が `BadRequestHttpException`('The maximum card list length is 500 lines') を beginTransaction前(CardUtil.php:53-54／ImportDeckAction.php:97)に投げる。`handleImportDeck` は `BadRequestHttpException` を明示catchせず（DeckController.php:698-727）グローバルハンドラ依存 | 実装は400想定だが、`InvalidRequestException` 経路でなくグローバルハンドラ経由のため400/メッセージの確実性は要確認。テストは仕様の400・上限超過メッセージで判定 | 014 | 要確認(行数超過の400経路) |
| 9 | 公開区分はリクエスト `scope_id`（公開・非公開・限定公開）で受領（正本md 入出力節） | 実装は `scope_id` を `private_flg`／`display_token` へ写像（DISPLAY_PUBLIC=1/PRIVATE=2/UNLISTED=3＝DeckController.php:52-54）。3値の公開区分移行可否はec-cube-enterprise実装で要確認（正本md リニューアル移行表） | **公開区分の永続化方式（`scope_id` 列か `private_flg`＋`display_token` か）が要確認**。テストは応答の display_token 含有有無（限定公開時のみ）で判定 | 015,016 | 要確認(公開区分の保持方式) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（card_listを解読してデッキ新規登録・所有者=認証プレイヤー） | 正常インポート登録の成功応答 | 001,005,010 | カバー |
| 利用者視点の入口（`POST /deck/import`・成功時code200＋deck_id・解読不可行はcode206） | 実効パスへの送信・成功code200・deck_id発番・206切替 | 001,004,011 | カバー（付帯表4#1でパス乖離・#3で206切替欠落を記録） |
| 認証・認可（jwt-token/HS256・aud→プレイヤー・401） | 有効JWTで成功・欠落/署名不正/該当なしで401・所有者=認証プレイヤー | 005,018,019,020,029 | カバー（クレーム名/HS256実方式は要実機＝付帯表4#2） |
| 処理フロー#1（トークン検証→プレイヤー特定・401） | 認証拒否（欠落/署名不正/該当なし） | 018,019,020 | カバー |
| 処理フロー#2-3（新規対象・format_id取得・card_list解読・cards組込） | format_id統率者使用での解読分岐・format_id必須・card_list解読 | 012,021,010 | カバー |
| 処理フロー#4（デッキ組立・検証→保存・Redis下書き削除・検証エラー400・例外500） | デッキ内容検証エラー400・本体/明細保存・下書き削除・保存例外500 | 022,025,026,034,024 | カバー（024/034は手動/要実機） |
| 処理フロー#5（成功code200・限定公開時display_token） | 成功レスポンス・限定公開時/以外のdisplay_token | 004,006,015,016 | カバー |
| 処理フロー#6（解読不可行はcode206に切替・errorsに行番号） | 206切替・errors（0始まり行番号）・登録は完了 | 011,017 | カバー（実装は206を返さない可能性＝付帯表4#3） |
| 業務ルール・計算（入力値を上書き/追加登録・金額/在庫再計算なし） | 追加登録（新規レコード）・計算処理なし | 025,032 | カバー（計算処理観点は対象外＝再計算なし） |
| 入出力・バリデーション節（jwt-token必須・format_id必須・card_list任意/上限500行・デッキ内容検証） | format_id必須400・card_list空で成功・500行/501行・デッキ内容検証400 | 007,013,014,021,022,023 | カバー |
| レスポンス(成功)（code・message・deck_id・display_token・errors・snake_case） | 成功本文・書式・snake_caseキー | 004,006,011,015 | カバー |
| レスポンス(失敗)（401/400/500・本文形`{code,message}`） | 各エラー応答 | 018,021,022,024 | カバー（500は手動/要実機＝付帯表4#6） |
| 副作用節（デッキ・デッキカード・メイビー/アトラクション/ステッカー新規登録・Redis下書き削除・1トランザクション・例外ロールバック） | DB登録副作用のDB照合・下書き削除・ロールバック | 025,026,027,028,034,150 | カバー（034/150は手動/要実機・DB副作用観測） |
| データ整合性（新規登録・登録前初期化は新規時作用せず・1トランザクション・下書き整合） | 新規登録・部分登録なし・下書き整合 | 025,033,034,150 | カバー |
| DBカラム節（id発番・deck_name・format_id・archetype_id・private_flg・player_id・display_token・本文・create/update日時） | 各列の登録値・所有者固定・本文・日時 | 025,028,029,030,015 | カバー（030＝日時は手動/間接・要実機・#9公開区分要確認） |
| 権限・認可（認証済みプレイヤー登録可・未認証/トークン不正401） | 認証成功/失敗 | 005,018 | カバー |
| エラー処理（認証不可401/検証失敗・行数超過400/解読不可行は登録完了206/保存例外500） | 各エラー応答・部分成功206 | 018,014,022,011,024 | カバー（024は手動/要実機） |
| 排他制御・トランザクション（1トランザクション・例外時ロールバック・ロックなし） | 部分登録なし・ロールバック | 033,150 | カバー（150は手動/要実機） |
| 区分整合（更新対象外データ不変＝IT-33） | 他プレイヤー・他デッキ不変 | 032 | カバー |
| ログ・監査（JWT原値・署名シークレット・閲覧用トークン原値・Cookie値の非出力） | 機密値の非出力 | （対象外＝サーバログ実機観測） | 対象外（API応答に現れず。サーバログ実機観測は本E2E範囲外） |
| 同時実行数の制限（IT-19） | 上限到達時の応答 | 035 | カバー（手動/要実機・正典にレート制限定義なし） |
| タイムアウト（IT-10） | 仕様どおりの応答・部分登録なし | 036,150 | カバー（手動/要実機） |
| 複数バリデーションのソート順・相関バリ（IT-10細目） | （該当処理なし） | （対象外） | 対象外（正典にソート順定義なし・本機能に相関バリデーションなし） |
| ファイル削除/移動/コピー/同名ファイル/出力・外部取引（IT-27/IT-33細目） | （該当処理なし） | （対象外） | 対象外（本APIはJSON APIでファイル操作・外部取引を行わない） |
| バージョニング（IT-32） | （定義なし） | （対象外） | 対象外（正典にAPIバージョン依存の挙動定義なし） |

未カバーはいずれも理由（正典にソート順/バージョン依存挙動/レート制限の定義なし・本APIにファイル操作/外部取引/相関バリデーションなし・アプリログ機密値抑止はサーバログ実機観測で本E2E範囲外）を明記済み。正本mdの各節（処理フロー#1-6・バリデーション・副作用・データ整合性・排他制御・エラー処理）はAPI/統合レイヤ（HTTPステータス・レスポンス本文＋DB副作用照合。本APIは画面を持たない）へ写像し、正常×異常の対（インポート登録成功001/005/010 ↔ 形式不正014(行数超過)/011・017(解読不可行206) ↔ バリデーション021/022/023 ↔ 未ログイン018/019/020 ↔ DB登録025-031・部分登録なし033・ロールバック150）を揃えた。
