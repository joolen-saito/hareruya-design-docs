# A06-16（店頭仕入_買取注文ダブルチェック会員更新） E2Eテストケース

元設計md（正本一次）: `functions/ec-cube-enterprise/a06-16_api_store_purchase_otc_buy_order_double_check_member_update.md`
機能詳細HTML: `function_spec_html_preview/ec-cube-enterprise/a06-16_api_store_purchase_otc_buy_order_double_check_member_update.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a06_16_api_store_purchase_otc_buy_order_double_check_member_update_it_cases.md`（母集合 計38観点行）

業務ルール補助根拠: `excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html`（正本mdのExcel抽出・リニューアル移行差分）

本機能は画面を伴わない更新系API（MTGバイヤーから店頭買取受注のダブルチェック者を更新）であり、**API/統合レイヤで網羅**する。Playwright `request`（APIRequestContext）で更新エンドポイントへPUT送信し、**HTTPステータス・更新副作用（DB更新の登録/更新/不変・ロールバック）**で判定する。画面なしAPIのためUIを一次オラクルにしない（管理画面 `admin/OtcBuyOrder/detail.twig` は本APIの合否オラクルにしない）。更新副作用は応答ステータスと再取得/DB照合で観測する。

**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装のレスポンス本文・PHPライブラリ既定値・Form制約を期待値に流用しない（オラクル独立性）。設計書はレスポンスデータを「なし（ステータスコード200）」と定めるため、成功判定は**HTTPステータスと更新副作用**で行い、実装が返すJSON本文（`{code:200}`）はオラクルにしない。実装からは位置情報（APIパス・メソッド・認証方式・リクエスト項目名・更新先テーブル/列）のみを `file:line` 根拠で取得し、取れないものは `要実機確認`。設計書と実装の食い違いは付帯表4に出す。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（認証）・受信検証・必須条件（ダブルチェック者ID欠落）・想定外項目・レスポンス書式・データなし（対象不存在404）。バージョニングは正典にAPIバージョン別挙動の定義が無く対象外 |
| IT-09 | 正常更新のHTTPステータス200・実行結果（更新完了）・正常リクエスト・正当呼出での応答取得 |
| IT-19 | 同時実行（並行更新）時の排他・承認テーブル二重登録なし（実再現は手動/要実機） |
| IT-10 | HTTPステータス・通信・正常／異常系・形式不正（非数値ID）・重複/順序（冪等upsert）・部分失敗（ロールバック）・タイムアウト・障害。複数バリデーション一括返却/ソート順・決済代行・外部キャッシュは本機能非該当で対象外 |
| IT-33 | 区分整合（更新対象外レコード不変）・検証エラー時の部分更新なし・連携エラー時の片側更新なし。数量・金額・自動加算・売上返品は本機能が数量金額管理を持たず対象外 |
| IT-26（補完） | 更新系のDB更新観点。承認テーブル `dtb_otc_buy_order_approver`（role=double_check）登録・`dtb_otc_buy_order.member_id`/`update_date` 更新・upsert・ロールバック（母集合外・設計書/移行差分補完） |
| IT-15（補完） | 認証済管理者のみ実行可（IS_AUTHENTICATED_FULLY）の権限制御（母集合外・実装補完） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-001	IT-09	リクエスト	P1	正常パラメータでダブルチェック者更新が成功し200が返る	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	"対象店頭買取受注ID＝既知ID
ダブルチェック者ID＝更新者と異なる有効なメンバーID"	"1. 認証済セッションで対象エンドポイントへPUT送信する
2. HTTPステータスを確認する"	成功を示す2xx系（200）のHTTPステータスが返ること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-002	IT-09	実行結果	P3	正常時に更新処理が完了し結果が処理結果と一致する	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID	"1. 認証済セッションでPUT送信する
2. 応答と後続状態を確認する"	更新処理が完了し、HTTPステータスとレスポンスが処理結果（更新完了）と一致すること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-003	IT-09	HTTPステータス	P3	正常時のHTTPステータスが仕様の成功応答と一致する	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID	"1. 認証済セッションでPUT送信する
2. HTTPステータスを確認する"	HTTPステータスが200（設計のステータスコード200）であること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-004	IT-09	外部取得	P1	MTGバイヤーからの正当リクエストで応答が返る	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	MTGバイヤー想定の正当リクエスト（対象受注ID・有効なダブルチェック者ID）	"1. 認証済セッションでPUT送信する
2. 応答を確認する"	呼出元へHTTPステータス200の応答が返ること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-005	IT-32	資格情報	P1	未認証リクエストは拒否され更新されない	SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	認証セッションを伴わないリクエスト	"1. 未認証状態でPUT送信する
2. HTTPステータスと対象データを確認する"	認可されず拒否応答（認証不可）となり、対象受注のダブルチェック者・更新者・更新日時が変動しないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-006	IT-32	受信検証	P1	受信検証に失敗したリクエストは更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	受信検証（必須項目）を満たさないリクエスト	"1. 受信検証を満たさない状態でPUT送信する
2. HTTPステータスと対象データを確認する"	受信が拒否（エラー応答）され、対象受注が更新されないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-007	IT-32	必須条件	P3	ダブルチェック者ID欠落でエラー応答となり更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	ダブルチェック者IDを欠落させたリクエスト	"1. ダブルチェック者IDを欠落させてPUT送信する
2. HTTPステータスと対象データを確認する"	必須項目不足によりエラー応答（成功＝200以外のエラー応答）となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-008	IT-32	リクエスト	P3	異常なパラメータ値でエラーとなり更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	異常なパラメータ値（範囲外・型不正のダブルチェック者ID）を含むリクエスト	"1. 異常値でPUT送信する
2. HTTPステータスと対象データを確認する"	異常を示すエラー応答（成功＝200以外のエラー応答）となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-009	IT-32	リクエスト	P3	想定外項目を加えても200で無視される	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	正常リクエストに想定外の項目（項目名と値のセット）を追加	"1. 想定外項目を含めてPUT送信する
2. HTTPステータスと更新内容を確認する"	未知項目があっても5xxで停止せずHTTPステータスが200で、更新内容が指定したダブルチェック者IDのみ反映されること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-010	IT-32	レスポンス	P3	正常応答のレスポンス書式が仕様（ステータスコード200）と一致する	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID	"1. 認証済セッションでPUT送信する
2. HTTPステータスのみで合否を判定する（応答本文の有無・内容は合否条件にしない）"	設計のレスポンスデータ「なし（ステータスコード200）」に従い、成功時のHTTPステータスが200であること。応答本文が返る場合でもその内容を合否条件にしない。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-011	IT-32	データなし	P3	対象店頭買取受注が存在しないIDでエラー応答となる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-MEMBER	存在しない店頭買取受注ID・有効なダブルチェック者ID	"1. 存在しない受注IDでPUT送信する
2. HTTPステータスを確認する"	該当データなし（対象受注不存在）によりエラー応答（成功＝200以外のエラー応答）が返ること（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-012	IT-10	エラー	P3	一般エラー時のHTTPステータスが処理結果と一致する	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	エラーを誘発するリクエスト	"1. エラー誘発リクエストでPUT送信する
2. HTTPステータスと対象データを確認する"	エラーを示すHTTPステータスが返り、対象受注が更新されないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-013	IT-10	HTTPステータス	P1	異常時のHTTPステータスが仕様の異常応答と一致する	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	異常リクエスト	"1. 異常リクエストでPUT送信する
2. HTTPステータスを確認する"	HTTPステータスが成功応答（200）と異なるエラー応答であること（異常時の具体的なHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-014	IT-10	通信	P1	正常通信での更新応答が仕様通りとなる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID	"1. 認証済セッションでPUT送信する
2. HTTPステータスを確認する"	通信が成立し、HTTPステータスが200（成功）であること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-015	IT-10	正常	P2	対象条件に該当する正常値で200となる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象条件に該当する正常値（有効な受注ID・有効なダブルチェック者ID）	"1. 正常値でPUT送信する
2. HTTPステータスと後続状態を確認する"	正常更新としてHTTPステータスが200（成功）であること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-016	IT-10	形式不正	P2	非数値のダブルチェック者IDは成功扱いせずエラーとなる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	非数値・形式不正のダブルチェック者IDを含むリクエスト	"1. 形式不正値でPUT送信する
2. HTTPステータスと対象データを確認する"	成功扱いされず、該当ダブルチェック者なし等のエラー応答（成功＝200以外のエラー応答）となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-017	IT-10	異常系	P2	異常系リクエストでHTTPステータスが仕様通りとなる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	異常系を誘発するリクエスト	"1. 異常系リクエストでPUT送信する
2. HTTPステータスを確認する"	HTTPステータスが成功応答（200）と異なるエラー応答であること（異常時の具体的なHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-018	IT-10	重複・順序	P1	同一更新の重複受信で承認データが二重登録されない（冪等）	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	同一受注ID・同一ダブルチェック者IDの更新を2回送信	"1. 同一更新を1回目PUT送信する
2. 同一更新を2回目PUT送信する
3. 承認データの件数を確認する"	2回目でダブルチェック承認データ（role=double_check）が二重登録されず、対象受注の承認は1件のままであること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-019	IT-10	部分失敗	P1	処理途中失敗時に部分更新されずロールバックされる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	更新処理途中で失敗を誘発するシナリオ	"1. 途中失敗を誘発してPUT送信する
2. 対象受注と承認データを確認する"	失敗時は更新がロールバックされ、対象受注の更新者・更新日時・承認データが受信前と一致し、片側だけ更新された状態にならないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-020	IT-33	区分整合	P1	更新対象外のレコードが変動しない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注IDと有効なダブルチェック者ID（別の受注・別roleの承認データも存在）	"1. 対象受注のダブルチェック者をPUT更新する
2. 対象外の受注・別roleの承認データを確認する"	更新対象（指定受注のrole=double_check）以外の受注・承認データが変動しないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-021	IT-33	エラー	P1	検証エラー時に対象受注と承認データが部分更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	検証エラーを誘発するリクエスト（更新者と同一のダブルチェック者ID）	"1. 検証エラーを誘発してPUT送信する
2. 対象受注と承認データを確認する"	検証エラー応答（成功＝200以外のエラー応答）となり、対象受注の更新者・更新日時・承認データが部分更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-022	IT-33	連携エラー	P1	エラー時に片側だけ更新された状態にならない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	更新途中でエラーを誘発するシナリオ	"1. エラーを誘発してPUT送信する
2. 対象受注と承認データを確認する"	対象受注（更新者・更新日時）と承認データのいずれも片側だけ更新された状態にならないこと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-023	IT-19	同時実行数の制限	P3	同時実行（並行更新）で承認データが二重登録されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	同一受注への並行更新リクエスト	"1. 同一受注へ複数の更新を同時に送信する
2. 承認データの件数を確認する"	並行更新時も対象受注のダブルチェック者は1名のままで、同一受注のダブルチェック承認（role=double_check）が二重登録されず整合すること（同一受注のダブルチェック者は1名／重複登録しないという業務要件で判定。並行実行の実再現は要実機確認）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-024	IT-10	エラー	P3	タイムアウト時に部分更新が残らない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	タイムアウトを誘発するシナリオ	"1. タイムアウトを誘発してPUT送信する
2. 応答と対象データを確認する"	サーバ無応答・未定義例外で停止せず、エラー応答が返るか再試行後に応答が返り、対象受注が受信前と一致（部分更新が残らない）こと（実再現は要実機確認）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-025	IT-10	障害	P2	DB障害時に未定義エラーにならず仕様の代替動作となる	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	DB接続障害・書込失敗を誘発するシナリオ	"1. DB障害を誘発してPUT送信する
2. 応答と対象データを確認する"	未定義エラーにならず、システムエラー応答（成功＝200以外のエラー応答）等の仕様で定めた代替動作となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4。実再現は要実機確認）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-050	IT-26	DB更新	P1	正常更新で承認テーブルにrole=double_checkの行が登録される	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID（承認データ未登録）	"1. 認証済セッションでPUT更新する
2. 承認テーブルの対象受注の行を確認する"	承認テーブル `dtb_otc_buy_order_approver` に role=double_check・approver_id=ダブルチェック者・assigned_by_id=更新者の行が1件登録されること（DB照合手段は要実機確認）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-051	IT-26	DB更新	P1	正常更新で対象受注の更新者と更新日時が更新される	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	対象受注ID・有効なダブルチェック者ID	"1. 更新前の更新日時を記録する
2. 認証済セッションでPUT更新する
3. 対象受注の更新者・更新日時を確認する"	対象受注 `dtb_otc_buy_order` の更新者（member_id）が呼出元の更新者になり、更新日時（update_date）が更新後の時刻に更新されること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-052	IT-26	DB更新	P2	既存ダブルチェック者の再割当で承認データが重複せず更新される	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER／SEED-A06-16-APPROVER-EXIST	対象受注ID・新しいダブルチェック者ID（既にrole=double_check承認データが存在）	"1. 既存承認データがある対象受注へPUT更新する
2. 承認テーブルの対象受注の行を確認する"	対象受注のrole=double_check承認データが新規追加されず1件のまま、approver_id・assigned_by_idが更新されること。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-053	IT-26	ロールバック	P1	同一メンバー禁止エラー時にいずれのテーブルも更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	更新者と同一のメンバーをダブルチェック者に指定したリクエスト	"1. 更新者と同一メンバーIDを指定してPUT送信する
2. 対象受注と承認テーブルを確認する"	更新がロールバックされ、`dtb_otc_buy_order` の更新者・更新日時も `dtb_otc_buy_order_approver` も更新されない（行が作成されない）こと。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-054	IT-10	エラー	P2	更新者とダブルチェック者が同一でエラー応答となり更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	更新者と同一のメンバーをダブルチェック者に指定したリクエスト	"1. 更新者と同一メンバーIDを指定してPUT送信する
2. HTTPステータスを確認する"	同一メンバー割当不可によりエラー応答（成功＝200以外のエラー応答）となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-055	IT-10	エラー	P2	ダブルチェック者が存在しないIDでエラー応答となり更新されない	SEED-A06-16-ADMIN-AUTH／SEED-A06-16-OTC-ORDER	存在しないメンバーIDをダブルチェック者に指定したリクエスト	"1. 存在しないメンバーIDを指定してPUT送信する
2. HTTPステータスと対象データを確認する"	該当ダブルチェック者なしによりエラー応答（成功＝200以外のエラー応答）となり、対象受注が更新されないこと（異常時のHTTPステータス実値は仕様未定義のため固定せず、参考実装値は付帯表4）。				
a06-16_api_store_purchase_otc_buy_order_double_check_member_update（API_店頭仕入_買取注文ダブルチェック会員更新）	E2E-A06-16-056	IT-15	権限	P1	認証済管理者のみ実行でき未ログインは更新できない	SEED-A06-16-OTC-ORDER／SEED-A06-16-MEMBER	未ログイン（認証情報なし）のリクエスト	"1. 未ログイン状態でPUT送信する
2. HTTPステータスと対象データを確認する"	権限制御（認証必須）により実行が拒否され、対象受注のダブルチェック者・更新者・更新日時が変動しないこと。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

更新エンドポイントは実装で `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/doubleCheckMember.json', name: 'api_admin_otc_buy_order_update_double_check_member', methods: ['PUT'])]`（`src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:231`）。`eccube_api_v1_route` は環境変数 `ECCUBE_API_V1_ROUTE` 由来（`app/config/eccube/packages/eccube.yaml:55`）で、実効パス `PUT /{ECCUBE_API_V1_ROUTE}/admin/otcBuyOrder/{id}/doubleCheckMember.json` の具体値は要実機確認。認証はクラスレベル `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（`OtcBuyOrderController.php:51`）。リクエスト項目は `$request->request->get('double_check_member_id')`（`OtcBuyOrderController.php:239`）。**設計書のエンドポイント `PUT /api/otcBuyOrder/{id}/doublecheck.json`／認証方式 `IP制限`／リクエスト項目 `member_id`／レスポンスデータ「なし」と実装は食い違う。送信先パスは実装の実効パス一本に統一し、合否は設計書の意味（成功＝ステータスコード200、認証＝認証セッションの通過/拒否、副作用＝承認/更新の登録・更新/不変）で判定する。パス・認証方式・項目名・応答書式の設計⇔実装差異は付帯表4でのみ不具合候補として一元管理し、TSV期待値・本文に実装固有値を期待値として固定しない**。

更新副作用の実装根拠: 対象受注更新 `setMember($input->Member)->setUpdateDate(new \DateTime())`（`UpdateDoubleCheckMemberAction.php:42-44`）、承認登録/更新 `saveDoubleCheckApproval`（`OtcBuyOrderApproverEntityManager.php:saveDoubleCheckApproval`：role=double_check の既存行があれば更新、無ければ新規＝upsert）、トランザクション `beginTransaction/commit/rollback`（`UpdateDoubleCheckMemberAction.php:40,50,52`）、同一メンバー禁止 `InvalidMemberAssignmentException`（`UpdateDoubleCheckMemberAction.php:36-37`／status 400 ＝`InvalidMemberAssignmentException.php:29`）。承認テーブル一意制約 `uk_otc_buy_order_approver_otc_buy_order_id_approver_id_role`（`DtbOtcBuyOrderApprover.php:27`）、role定数 `ROLE_DOUBLE_CHECK='double_check'`（`DtbOtcBuyOrderApprover.php:37,56-57`）。例外ステータス: 必須欠落/不正＝400（`MissingRequiredParameterException.php:31`／`InvalidParameterException.php:31`）、対象/会員不存在＝404（`NotFoundException.php:31`）、未認証＝401（`UnauthenticatedException.php:31`／※IsGranted拒否は別経路で403/リダイレクトの可能性＝要実機確認）、システムエラー＝500（`InternalException.php:31`）。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A06-16-001/002/003/004 | E2E自動化(API/統合) | `PUT /{api_v1_route}/admin/otcBuyOrder/{id}/doubleCheckMember.json`（OtcBuyOrderController.php:231／eccube.yaml:55・実効値は要実機確認） | 入出力仕様・プロセスフロー#4-5・Excel抽出（PUT/ステータス200）／IT-09 | IT-A06-16-...-004,002,003,024 |
| E2E-A06-16-005/006/056 | E2E自動化(API/統合) | 認証 `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（OtcBuyOrderController.php:51・拒否時ステータスは要実機確認） | 開始条件（認証・認可通過）・判定条件（権限/ログイン状態）／IT-32・IT-15 | IT-A06-16-...-001,036（056は実装補完） |
| E2E-A06-16-007 | E2E自動化(API/統合) | 必須検証 `double_check_member_id` 欠落→400（OtcBuyOrderController.php:239-241／MissingRequiredParameterException.php:31） | 例外処理（入力不備）・必須条件／IT-32 | IT-A06-16-...-031 |
| E2E-A06-16-008/009/010/011 | E2E自動化(API/統合) | `PUT .../doubleCheckMember.json`（OtcBuyOrderController.php:231）／対象不存在→404（OtcBuyOrderController.php:234-235／NotFoundException.php:31） | 例外処理（入力不備・対象なし）・レスポンス書式「なし(200)」／IT-32 | IT-A06-16-...-005,006,032,033 |
| E2E-A06-16-012/013/014/015/017 | E2E自動化(API/統合) | `PUT .../doubleCheckMember.json`（OtcBuyOrderController.php:231） | 例外処理・プロセスフロー#5（失敗時応答）／IT-10 | IT-A06-16-...-008,025,026,027,030 |
| E2E-A06-16-016 | E2E自動化(API/統合) | 形式不正ID `(int)$raw`→会員find→404（OtcBuyOrderController.php:249-253／NotFoundException.php:31・キャスト挙動は要実機確認） | 例外処理（入力不備・形式不正）／IT-10 | IT-A06-16-...-028 |
| E2E-A06-16-018/052 | E2E自動化(API/統合)（要実機確認: DB照合手段） | 承認upsert `saveDoubleCheckApproval`（OtcBuyOrderApproverEntityManager.php）／一意制約（DtbOtcBuyOrderApprover.php:27） | 例外処理（状態不整合）・重複/順序の整合・DB更新（upsert）／IT-10・IT-26 | IT-A06-16-...-037（052は移行差分補完） |
| E2E-A06-16-019/021/022/053 | E2E自動化(API/統合)（要実機確認: DB照合手段） | トランザクション rollback（UpdateDoubleCheckMemberAction.php:40,52）／同一メンバー禁止（:36-37） | 例外処理（状態不整合）・部分更新なし・ロールバック／IT-10・IT-33・IT-26 | IT-A06-16-...-038,018,023（053は移行差分補完） |
| E2E-A06-16-020 | E2E自動化(API/統合)（要実機確認: DB照合手段） | 更新対象限定（指定受注×role=double_check のみ／saveDoubleCheckApproval の findOneBy 条件） | 状態・データ更新（更新対象限定）・区分整合／IT-33 | IT-A06-16-...-017 |
| E2E-A06-16-050/051 | E2E自動化(API/統合)（要実機確認: DB照合手段） | 承認登録（DtbOtcBuyOrderApprover.php:37,45,49,53,56-57）／対象受注 member_id・update_date 更新（UpdateDoubleCheckMemberAction.php:42-44） | 状態・データ更新・DB関連実装確認値（dtb_otc_buy_order_approver／dtb_otc_buy_order.update_date）／IT-26 | （母集合外・DB更新観点補完） |
| E2E-A06-16-054/055 | E2E自動化(API/統合) | 同一メンバー→400（UpdateDoubleCheckMemberAction.php:36-37／InvalidMemberAssignmentException.php:29）／会員不存在→404（OtcBuyOrderController.php:251-253） | リニューアル移行差分（同一メンバー禁止・新規挙動）・例外処理／IT-10 | （母集合外・移行差分補完） |
| E2E-A06-16-023 | 手動（要実機確認・並行実行再現） | 同一受注のダブルチェック者は1名（重複登録しない）の整合確認。一意制約は `(otc_buy_order_id, approver_id, role)` で同一受注×role の一意性は無く、異なる approver の並行更新ではDB制約だけで二重登録を防げない（付帯表4#9）。並行リクエストの実再現は実機依存 | 同時実行数の制限・排他（同一受注のダブルチェック者は1名）／IT-19 | IT-A06-16-...-007 |
| E2E-A06-16-024 | 手動（要実機確認・タイムアウト実再現） | タイムアウト誘発は外部依存（要実機確認） | 例外処理・タイムアウト／IT-10 | IT-A06-16-...-015 |
| E2E-A06-16-025 | 手動（要実機確認・DB障害実再現） | DB障害誘発は実機依存。実装は catch→rollback→500（UpdateDoubleCheckMemberAction.php:51-54／InternalException.php:31） | 例外処理（外部連携失敗・状態不整合）・障害／IT-10 | IT-A06-16-...-029 |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文で、数量・金額・外部キャッシュ・決済代行など本機能に無い文言を含む）であり、機能固有のシナリオを持たない。本E2Eは設計書本文（プロセスフロー・例外処理・リニューアル移行差分）と実装の位置情報（パス・認証・更新先テーブル/列）を一次情報源として、更新系APIのDB更新観点・排他・権限・正常×異常の対を網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a06_16_..._it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。本機能は画面なしAPIのため `自動化(UI)` は 0。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報・受信検証・必須条件・想定外項目・レスポンス・データなしはHTTPステータス/更新副作用で観測可。バージョニングは正典にAPIバージョン別挙動の定義が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常更新のHTTPステータス・実行結果・正当呼出応答 |
| IT-19 | 1 | 0 | 0 | 1 | 0 | 同時実行（並行更新）排他の実再現は手動/要実機 |
| IT-10 | 18 | 0 | 8 | 2 | 8 | 複数バリデーション一括返却/ソート順(6件)・決済代行(2件)は本機能非該当=対象外。タイムアウト/障害(2件)は手動 |
| IT-33 | 7 | 0 | 3 | 0 | 4 | 区分整合・部分更新なし・連携エラー(片側更新なし)はDB副作用で観測。数量・金額/外部取引/自動加算/実数更新/売上返品(4件)は本機能が数量金額管理を持たず対象外 |
| 合計 | 38 | 0 | 22 | 3 | 13 | **未分類 0** |

注1: 対象外13件の内訳は、IT-32 バージョニング(1)＝正典にAPIバージョン別挙動の定義なし／IT-10 複数バリデーション一括返却・ソート順(6＝本機能は単一パラメータでステータスコード応答のため複数エラー本文の一括返却・ソート順を持たない)＋決済代行・外部決済の正常/異常(2＝本機能に決済処理なし)／IT-33 数量・金額管理系(4＝外部取引・自動加算・実数更新・売上返品は本機能に数量金額管理なし)。いずれも理由付きで放置ではない。

注2（母集合外・設計書/移行差分・DB更新観点補完）: 更新系API要件（CHECKLISTのDB更新観点 IT-23/IT-26）とリニューアル移行差分（正本md:89-101）から、母集合38行に対応行を持たない補完ケースを追加した。母集合集計には算入せず別管理する。内訳＝自動化(API/統合) 7（050 承認テーブル登録／051 受注member_id・update_date更新／052 upsert重複なし／053 同一メンバー禁止時ロールバック／054 同一メンバー禁止400／055 ダブルチェック者不存在404／056 権限制御）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 005（未認証拒否・更新なし） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 001 |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 008（異常パラメータ） |
| 006 | IT-32 | リクエスト | 自動化(API/統合) | 009（想定外項目） |
| 007 | IT-19 | 同時実行数の制限 | 手動（要実機確認） | 023（並行更新排他の実再現） |
| 008 | IT-10 | エラー | 自動化(API/統合) | 012 |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本機能は単一パラメータでステータスコード応答のため複数エラー本文の一括送出を持たない |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 同上 |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 同上 |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 024（タイムアウト実再現） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン別の挙動定義が無く、バージョン依存の合否は創作になるため対象外（理由付き） |
| 017 | IT-33 | 区分整合 | 自動化(API/統合) | 020（更新対象外レコードが変動しない） |
| 018 | IT-33 | エラー | 自動化(API/統合) | 021（検証エラー時に部分更新されない） |
| 019 | IT-33 | 外部取引 | 対象外 | 本機能は数量・金額の取引計算を持たないため |
| 020 | IT-33 | 自動加算 | 対象外 | 本機能は数量・金額の自動加算を持たないため |
| 021 | IT-33 | 実数更新 | 対象外 | 本機能は数量・金額の実数更新を持たないため |
| 022 | IT-33 | 売上・返品 | 対象外 | 本機能は数量の売上減算/返品加算を持たないため |
| 023 | IT-33 | 連携エラー | 自動化(API/統合) | 022（片側更新なし） |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 004 |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 013 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 014 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 015 |
| 028 | IT-10 | 形式不正 | 自動化(API/統合) | 016（非数値ID） |
| 029 | IT-10 | 障害 | 手動（要実機確認） | 025（DB障害実再現） |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 017 |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 007 |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 010 |
| 033 | IT-32 | データなし | 自動化(API/統合) | 011 |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本機能に決済代行・外部決済処理がないため |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 本機能に決済代行・外部決済処理がないため |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 006 |
| 037 | IT-10 | 重複・順序 | 自動化(API/統合) | 018（冪等upsert・二重登録なし） |
| 038 | IT-10 | 部分失敗 | 自動化(API/統合) | 019（ロールバック） |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 22（001,002,003,004,005,006,008,017,018,023,024,025,026,027,028,030,031,032,033,036,037,038）／手動・要実機 3（007,015,029）／対象外 13（009,010,011,012,013,014,016,019,020,021,022,034,035）。**未分類 0**（母集合38行）。母集合外の補完ケース（050-056＝自動化(API/統合)）は別管理。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A06-16-ADMIN-AUTH | dtb_member（更新者）／認証セッション | IS_AUTHENTICATED_FULLY を満たす有効な管理者（更新者）1。ログインID/PWは config 既定。MTGバイヤー想定の認証済セッション | fixture（config既定） | 既存利用・撤去不要。005/056 は本セット未適用（未認証）で権限異常を再現 | 001-004,006-025,050-055 |
| SEED-A06-16-OTC-ORDER | dtb_otc_buy_order（対象受注） | 更新対象の店頭買取受注1（既知id）。更新前の member_id・update_date は既知。承認データ未登録 | fixture／migration | 専用受注・テスト毎に初期状態（更新者・update_date・承認なし）へ復元してべき等化 | 001-025,050-056 |
| SEED-A06-16-MEMBER | dtb_member（ダブルチェック者候補） | 更新者と異なる有効なメンバー1以上（ダブルチェック者）。同一メンバー禁止検証用に更新者と同一idも参照可能 | fixture | 既存利用・撤去不要。011/055 は存在しないIDを指定 | 001-004,009,014,015,018-024,050-052,056 |
| SEED-A06-16-APPROVER-EXIST | dtb_otc_buy_order_approver（既存承認） | 対象受注に role=double_check の承認データ1件を事前登録（upsert/再割当検証用） | synthetic／fixture | 専用データ・テスト毎に既存1件へ復元してべき等化 | 052 |
| SEED-A06-16-UNAUTH | 認証コンテキスト（未認証） | 認証セッション/トークンを伴わない状態 | env（環境ガード `test.skip`／コンテキスト分離） | コンテキスト分離・後始末不要 | 005,056 |

注: 対象受注・ダブルチェック者は実テーブル（`dtb_otc_buy_order`／`dtb_member`／`dtb_otc_buy_order_approver`）の最小レコードで構成し、外部システム（MTGバイヤー）実連携はしない。DB副作用の照合手段（再取得API/直接DB照合）は要実機確認（付帯表4#3・#8）。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_otc_buy_order_approver` 等）に従う。共通ログインは `config/default_login_information.json`／`config/default.config.ts` を流用。認証情報・更新者IDの原値はログ・設計書に書かない。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `PUT /api/otcBuyOrder/{id}/doublecheck.json`（Excel抽出 エンドポイントURL） | `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/doubleCheckMember.json', ..., methods: ['PUT'])]`（OtcBuyOrderController.php:231）＋`ECCUBE_API_V1_ROUTE`（eccube.yaml:55） | **設計書パスと実装パスが不一致**（`/admin/` 階層・`doubleCheckMember`・APIバージョンプレフィックス）。テストは実装の実効パスへ送信し本差異を記録（正本md:95でも差分明記） | 全ケース | 不具合候補(パス乖離) |
| 2 | 認証方式 `IP制限`（Excel抽出 認証方式） | クラスレベル `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（OtcBuyOrderController.php:51） | **実装はセッション認証（完全認証）であり、IP制限firewallではない**。未認証拒否のステータス（401/403/リダイレクト）は要実機確認。テストは「認証を満たさないと更新拒否」を仕様で判定 | 005,056 | 要確認(認証方式) |
| 3 | リクエスト項目 `member_id`（Excel抽出。数値・必須）／正本md:96「リクエストボディの doubleCheckMemberId」 | `$request->request->get('double_check_member_id')`（OtcBuyOrderController.php:239。form/POSTボディ・snake_case） | **項目名と書式が三者（Excel=member_id／md=doubleCheckMemberId／実装=double_check_member_id）で不一致。かつExcelは「クエリ書式」、mdは「JSONリクエストボディ」だが実装は `request->get`（form-encoded）で取得**。送信書式・項目名は要実機確認とし期待値に固定しない | 001,007,008,016,054 | 要確認(項目名・送信書式) |
| 4 | ダブルチェック者は新規カラムに追加（Excel抽出／正本md:97） | 承認テーブル `dtb_otc_buy_order_approver`（role=double_check）へ登録（OtcBuyOrderApproverEntityManager.php／DtbOtcBuyOrderApprover.php:37,57） | **保存先が新規カラムではなく承認テーブル**（正本md:97-101で移行差分明記）。テストは実装の保存先で副作用を観測しつつ、仕様の意味（ダブルチェック者が記録される）で判定 | 018,020,050,052 | 不具合候補(保存先差異/移行差分) |
| 5 | 同一メンバー禁止: 記載なし（正本md:99） | 更新者==ダブルチェック者で `InvalidMemberAssignmentException`（400）（UpdateDoubleCheckMemberAction.php:36-37／InvalidMemberAssignmentException.php:29） | **Excel基本設計に同一メンバー禁止の記載が無く、実装の新規挙動**。基本設計（上位オラクル）に無い挙動だが移行先実装の確定要件として正本md:99が採用。テストは移行差分要件で判定（要確認） | 021,053,054 | 要確認(新規挙動/移行差分) |
| 6 | レスポンスデータ「なし」（Excel抽出 レスポンスデータ。ステータスコード200） | 実装は `JsonResponse(['code'=>200], 200)`（OtcBuyOrderController.php:267） | **実装はJSON本文 `{code:200}` を返す**。設計はステータスコードのみ。テストの合否はHTTPステータス＋更新副作用で判定し、JSON本文をオラクルにしない | 001,003,010,014,015 | 要確認(応答書式乖離) |
| 7 | 更新担当者・更新日時の更新: 記載なし（正本md:98） | `setMember($input->Member)->setUpdateDate(new \DateTime())`（UpdateDoubleCheckMemberAction.php:42-44） | **Excel基本設計に更新者・更新日時更新の記載が無く、実装の追加更新**（正本md:98で移行差分明記）。テストは移行先実装の確定要件で判定 | 051 | 要確認(追加更新/移行差分) |
| 8 | 更新副作用（承認登録・受注更新・ロールバック）の観測 | DB更新は応答本文に詳細を返さない（OtcBuyOrderController.php:267）。承認/受注の確定値は `dtb_otc_buy_order_approver`／`dtb_otc_buy_order`（Action:42-47） | **更新副作用をAPI応答だけで観測できず、再取得API（一覧/詳細）または直接DB照合が必要**。照合手段は要実機確認。テストは仕様の更新結果（登録/更新/不変・ロールバック）で判定 | 018,019,020,021,022,050,051,052,053 | 要確認(DB副作用の観測手段) |
| 9 | 同一受注のダブルチェック者は1名（重複登録しない）（正本md:97 ダブルチェック者の保存・移行差分） | 一意制約は `(otc_buy_order_id, approver_id, role)`（uk_otc_buy_order_approver_otc_buy_order_id_approver_id_role：DtbOtcBuyOrderApprover.php:27）。`saveDoubleCheckApproval` は role=double_check の既存行を findOneBy で更新（OtcBuyOrderApproverEntityManager.php） | **同一受注×role の一意性が不足。一意制約に approver_id を含むため、異なる approver の並行更新ではDB制約だけで二重登録を防げない**（並行時に findOneBy が双方で空判定→各々 insert され role=double_check が2行になる恐れ）。テストは「同一受注のダブルチェック者は1名」を仕様で判定し、二重登録が観測されれば一意性不足として検出 | 023 | 不具合候補(一意性不足/異なるapproverで並行二重登録) |
| 10 | 設計書（正典）は成功＝ステータスコード200のみ定義し、レスポンスデータは「なし」。**異常系のHTTPステータス実値は仕様未定義** | 例外別ステータス（実装由来・参考実装値）: 必須欠落/不正＝400（MissingRequiredParameterException.php:31／InvalidParameterException.php:31）、対象/会員不存在＝404（NotFoundException.php:31）、同一メンバー＝400（InvalidMemberAssignmentException.php:29）、未認証＝401（UnauthenticatedException.php:31／IsGranted拒否は403/リダイレクトの可能性）、システムエラー＝500（InternalException.php:31） | **異常系ステータス実値は実装例外由来で仕様未定義のため期待値に固定しない**。TSV期待値は「エラー応答（成功＝200以外）となり更新されない」に一般化し、上記の具体ステータスは本行の参考実装値（要実機確認）として一元管理する。成功系（200・本文なし）は正典明示のため固定維持 | 007,008,011,013,016,017,021,025,054,055 | 要確認(異常系ステータス実値) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 機能の目的と役割（MTGバイヤーからダブルチェック者を更新） | 正常更新・成功応答 | 001,004 | カバー |
| 入出力仕様（入力=APIリクエスト／出力=APIレスポンス／副作用=更新・履歴記録） | 更新応答・承認登録・受注更新 | 001,050,051 | カバー |
| 開始条件・終了条件（認証・認可・署名通過／応答とDB更新完了） | 認証通過/拒否・正常応答・更新完了 | 005,001,002,056 | カバー |
| 判定条件（対象条件・実処理順序・権限/ログイン状態） | 権限制御・対象受注存在・更新対象限定 | 056,011,020 | カバー |
| プロセスフロー#1-5（受付→検証→主処理→成功/失敗応答・不整合を残さない） | 正常応答・失敗時整合（ロールバック） | 001,012,019 | カバー |
| ビジネスロジック（UpdateDoubleCheckMemberAction・同一メンバー禁止） | 同一メンバーエラー・正常更新 | 054,053,001 | カバー |
| 状態・データ更新（dtb_otc_buy_order_approver／dtb_otc_buy_order.member_id・update_date） | 承認登録・受注更新者/更新日時・upsert | 050,051,052 | カバー（IT-26補完） |
| 例外処理（入力不備：必須・形式不正・想定外項目） | 必須欠落400・非数値404・想定外項目無視 | 007,016,009 | カバー |
| 例外処理（対象なし：対象ID不存在） | 対象受注404・ダブルチェック者404 | 011,055 | カバー |
| 例外処理（状態不整合：重複・部分失敗） | 冪等upsert・部分更新なし・片側更新なし | 018,019,022 | カバー |
| 例外処理（外部連携失敗・障害・タイムアウト） | システムエラー500・部分更新が残らない | 025,024 | カバー（手動/要実機） |
| 同時実行・排他（同一受注のダブルチェック者は1名／IT-19） | 並行更新で承認二重登録なし | 023 | カバー（手動/要実機・一意性不足は付帯表4#9） |
| Excel抽出（PUT・認証IP制限・ステータス200・member_id） | 実効パスへのPUT・成功ステータス・必須項目 | 001,003,007 | カバー（パス/認証/項目名は付帯表4で乖離記録） |
| リニューアル移行差分（保存先=承認テーブル／更新者・更新日時更新／同一メンバー禁止） | 承認テーブル登録・受注更新・同一メンバー400 | 050,051,054 | カバー（移行差分・要確認） |
| 資格情報・受信検証・必須条件・レスポンス・データなし（IT-32） | 各受信検証分岐 | 005,006,007,010,011 | カバー（バージョニングは正典にAPIバージョン別挙動なしで対象外） |
| HTTPステータス・通信・正常/異常系・部分失敗（IT-10） | 応答ステータス・部分失敗整合 | 013,014,015,017,019 | カバー |
| 区分整合・検証エラー・連携エラーの双方整合（IT-33） | 更新対象外不変・部分更新なし・片側更新なし | 020,021,022 | カバー |
| 複数バリデーション一括返却・ソート順（IT-10 細目） | （該当処理なし） | （対象外） | 対象外（本機能は単一パラメータでステータスコード応答・複数エラー本文の一括返却を持たない） |
| 決済代行・外部決済の正常/異常（IT-10 細目） | （該当処理なし） | （対象外） | 対象外（本機能に決済処理なし） |
| 数量・金額管理（外部取引・自動加算・実数更新・売上返品 IT-33） | （該当処理なし） | （対象外） | 対象外（本機能は数量・金額管理を持たない） |
| タイムアウト・DB障害（IT-10） | 仕様通り挙動・代替動作 | 024,025 | カバー（手動/要実機） |
| ログ・監査（更新失敗時の error ログ／UpdateDoubleCheckMemberAction.php:53） | 失敗時の追跡情報ログ・機密値抑止 | （手動/要実機・観測外） | 手動/要実機（実装は logger->error 出力。実出力・機密抑止はサーバログ実機観測） |

未カバーはいずれも理由（本機能が単一パラメータ・ステータスコード応答で複数エラー本文非該当／決済・数量金額管理なし／バージョニングは正典にAPIバージョン別挙動なし／タイムアウト・DB障害・並行実行・ログは要実機）を明記済み。更新系APIのDB更新観点（承認テーブル登録・受注更新者/更新日時・upsert・ロールバック）はCHECKLISTのIT-23/IT-26要件に基づき母集合外補完として写像し、正常×異常の対（更新成功↔同一メンバー/不存在/未認証で更新なし、登録↔ロールバック、冪等upsert↔二重登録なし）を揃えた。設計書の各節とリニューアル移行差分（正本md:89-101）はAPI/統合レイヤ＋DB副作用観測へ写像し、設計⇔実装の差異は付帯表4で一元管理した。
