# m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.html`（正本 `functions/pf-eccube3/m03-17_admin_product_product_sales_analysis_management.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_17_admin_product_product_sales_analysis_management_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・HTTPステータス・別画面/DB状態の間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言や Form/Type の制約値（NotBlank/Length=64/Range=1..65535/maxlength）をオラクル化しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

設計源は pf-eccube3 のリバース詳細であり、刷新先 ec-cube-enterprise（`TagSalesAnalysisController.php` ほか）に当該画面が存在することを確認済み。設計書の「確認値」文言と実装の翻訳文言に差がある箇所（削除拒否メッセージ等）は付帯表4「不具合候補・要確認」に列挙し、テストは仕様（メッセージキーの趣旨）どおりに書く。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 各画面のUI部品（名称/並び順入力欄・登録ボタン・一覧ヘッダ・表示件数セレクト）・タイトル・カード見出し・削除確認モーダル文言・HTTPステータス・page_count URL |
| IT-03 | 画面遷移（一覧⇄編集モード・保存成功リダイレクト・検証失敗再描画・削除拒否リダイレクト・ページャ経路） |
| IT-13 | URL直接アクセス（編集モード直アクセス・未ログイン誘導） |
| IT-15 | CSRF（DELETE 403）・未認証ガード・対象データ（一覧/状態変化＝削除で行が消える） |
| IT-22 | 必須（名称/並び順）・文字列長（64境界/+1）・数値範囲（1..65535）・DB相関（名称一意） |
| IT-23 | 本機能はDB検索を行わない（一覧は全件 rank 昇順のページネーション）。実行結果は一覧表示/削除拒否で間接確認 |
| IT-26 | 登録/更新の永続化（成功フラッシュ・リダイレクト・クエリid）の間接確認 |
| IT-20 | ログ出力（専用ログなし・フラッシュとHTTP状態が主フィードバック）＝ブラウザ観測外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-001	IT-25	UI部品	P1	新規フォーム（名称・並び順入力欄・登録ボタン）と一覧が表示される	ログイン済／SEED-M03-17-ADMIN	—	1. /admin/product/tag_sales_analysis を開く	名称入力欄・並び順入力欄・「登録」ボタンと一覧テーブル・表示件数セレクトが表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-002	IT-25	表示結果	P2	親フレームタイトル「商品管理」・サブタイトル「売上分析タグ」が表示される	ログイン済／SEED-M03-17-ADMIN	—	1. 新規画面を表示する	タイトル「商品管理」とサブタイトル「売上分析タグ」が表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-003	IT-25	UI部品	P2	新規モードのカード見出しが「新規追加」	ログイン済／SEED-M03-17-ADMIN	—	1. 新規画面を表示する	上半分カードの見出しが「新規追加」であること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-004	IT-03	表示結果	P2	一覧テーブル（ID/名称/並び順ヘッダ）と表示件数セレクトが表示される	ログイン済／SEED-M03-17-ADMIN／SEED-M03-17-TAG	—	1. 新規画面を表示する	一覧ヘッダに「ID」「名称」「並び順」が表示され、表示件数セレクトが表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-005	IT-25	URL	P2	表示件数セレクト変更で page_count クエリ付きURLへ再描画される	ログイン済／SEED-M03-17-ADMIN	表示件数＝50	"1. 新規画面を表示する
2. 表示件数セレクトを50に変更する"	現在画面へ page_count=50 クエリを付けてフル読み込みされること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-006	IT-13	URL直接アクセス	P2	/tag_sales_analysis/{id} 直接アクセスで編集モードが表示される	ログイン済／SEED-M03-17-TAG（既存id）	既存タグの id	1. /admin/product/tag_sales_analysis/{id} を直接開く	カード見出しが「編集」になり、名称欄に当該行の現行値が載ること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-007	IT-25	操作起点	P2	一覧の編集リンク押下で編集モードへ遷移する	ログイン済／SEED-M03-17-TAG	—	"1. 新規画面を表示する
2. 一覧の当該行の編集リンクを押下する"	/tag_sales_analysis/{id} へ遷移し、カード見出しが「編集」になること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-008	IT-03	画面遷移	P3	新規時の一覧ページャリンクが /tag_sales_analysis/page/ を指す	ログイン済／SEED-M03-17-TAG（表示件数超のレコード）	—	"1. 新規画面を表示する
2. ページャのリンクを確認する"	ページャのリンクが /tag_sales_analysis/page/{page_no} を指すこと（新規モードのページャ経路）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-009	IT-03	画面遷移	P3	編集時の一覧ページャリンクが /{id}/page/ を指す	ログイン済／SEED-M03-17-TAG（表示件数超のレコード）	既存タグの id	"1. /tag_sales_analysis/{id} を開く
2. ページャのリンクを確認する"	ページャのリンクが /tag_sales_analysis/{id}/page/{page_no} を指すこと（編集モードのページャ経路）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-010	IT-25	確認ダイアログ	P2	一覧の削除リンクに削除確認モーダル文言が設定される	ログイン済／SEED-M03-17-TAG（1件以上）	—	"1. 新規画面を表示する
2. 一覧の削除リンクの属性を確認する"	削除リンク（data-method=delete）に削除確認モーダル文言（名称を埋めた「…削除してよろしいですか？」相当）が設定されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-011	IT-15	未認証	P2	未ログインで一覧URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/tag_sales_analysis へ直接アクセス	管理ログイン画面へ誘導されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-012	IT-13	URL直接アクセス	P2	未ログインで編集URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/tag_sales_analysis/1 へ直接アクセス	管理ログイン画面へ誘導されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-013	IT-25	HTTPステータス	P2	存在しない id の編集GETで 404 となる	ログイン済／SEED-M03-17-ADMIN	存在しない id	1. /admin/product/tag_sales_analysis/99999999 を開く	HTTP 404 が返ること（マスタ読み込み失敗）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-014	IT-25	UI部品	P2	表示件数セレクトに設計どおりの選択肢が表示される	ログイン済／SEED-M03-17-ADMIN	—	"1. 新規画面を表示する
2. 表示件数セレクトの選択肢を確認する"	表示件数セレクトに 10／50／100／300／500／1000／2000／10000／12000 の選択肢が表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-015	IT-03	表示結果	P2	新規モードのフォーム初期値が空欄である	ログイン済／SEED-M03-17-ADMIN	—	"1. 新規画面を表示する
2. 名称欄・並び順欄の初期値を確認する"	新規モードでは名称欄・並び順欄が空欄であること（編集モードの現行値表示E2E-006と対）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-016	IT-03	画面遷移	P3	フォームのactionが新規=store／編集=store/{id}に切り替わる	ログイン済／SEED-M03-17-TAG（既存id）	既存タグの id	"1. 新規画面でフォームのaction属性を確認する
2. /tag_sales_analysis/{id} を開きフォームのaction属性を確認する"	新規時のactionは無修飾 store、編集時は同一主キーを付けた store/{id} を指すこと。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-017	IT-25	操作起点	P3	ナビ「売上分析登録/編集」から当該画面へ遷移しメニューがハイライトされる	ログイン済／SEED-M03-17-ADMIN	—	1. 管理ナビ「売上分析登録/編集」を押下する	/product/tag_sales_analysis へ遷移し新規フォームと一覧が表示され、メニューの product・tag_sales_analysis がハイライトされること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-020	IT-22	必須バリデーション	P1	名称未入力で登録すると検証失敗となり保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝空／並び順＝1	"1. 新規画面を表示する
2. 名称を空のまま並び順を入力し登録を押下する"	検証失敗となり「登録が完了しました。」は表示されず、同一画面に「登録できませんでした。」相当のエラーで再描画されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-021	IT-22	必須バリデーション	P1	並び順未入力で登録すると検証失敗となり保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝任意／並び順＝空	"1. 新規画面を表示する
2. 並び順を空のまま名称を入力し登録を押下する"	検証失敗となり保存されず、同一画面にエラーで再描画されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-022	IT-22	文字列長バリデーション	P2	名称が最大長+1（65文字）で登録すると文字列長エラーで保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝65文字／並び順＝1	"1. 新規画面を表示する
2. 名称に65文字を入力し登録を押下する"	文字列長エラーで保存されず、同一画面に再描画されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-023	IT-22	文字列長バリデーション	P2	名称が最大長ちょうど（64文字）・並び順最小（1）で登録成功する	ログイン済／SEED-M03-17-ADMIN（使い捨て）	名称＝64文字／並び順＝1	"1. 新規画面を表示する
2. 名称64文字・並び順1を入力し登録を押下する"	境界内のため保存され「登録が完了しました。」が表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-024	IT-22	数値バリデーション	P2	並び順が範囲外（0）で登録すると範囲エラーで保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝任意／並び順＝0	"1. 新規画面を表示する
2. 並び順に0を入力し登録を押下する"	範囲エラー（並び順は1〜65535）で保存されないこと。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-025	IT-22	数値バリデーション	P2	並び順が範囲外（65536）で登録すると範囲エラーで保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝任意／並び順＝65536	"1. 新規画面を表示する
2. 並び順に65536を入力し登録を押下する"	範囲エラー（並び順は1〜65535）で保存されないこと。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-026	IT-22	数値バリデーション	P3	並び順に非数値を入力すると登録できず保存されない	ログイン済／SEED-M03-17-ADMIN	名称＝任意／並び順＝非数値	"1. 新規画面を表示する
2. 並び順に非数値を入力し登録を押下する"	整数以外は受け付けられず保存されないこと（並び順は整数）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-027	IT-22	文字列長バリデーション	P2	名称が最小長（1文字）・並び順1で登録成功する	ログイン済／SEED-M03-17-ADMIN（使い捨て）	名称＝1文字／並び順＝1	"1. 新規画面を表示する
2. 名称1文字・並び順1を入力し登録を押下する"	境界内のため保存され「登録が完了しました。」が表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-028	IT-22	数値バリデーション	P2	並び順が上限ちょうど（65535）で登録成功する	ログイン済／SEED-M03-17-ADMIN（使い捨て）	名称＝新規一意名／並び順＝65535	"1. 新規画面を表示する
2. 並び順65535を入力し登録を押下する"	範囲上限内のため保存され「登録が完了しました。」が表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-030	IT-26	登録内容	P1	名称・並び順を入力して新規登録すると成功メッセージと一覧へリダイレクトされる	ログイン済／SEED-M03-17-ADMIN（使い捨て）	名称＝新規一意名／並び順＝任意（1..65535）	"1. 新規画面を表示する
2. 名称・並び順を入力し登録を押下する"	「登録が完了しました。」が表示され、一覧（クエリ id 付き）へリダイレクトされること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-031	IT-26	更新内容	P1	既存行を更新すると成功メッセージが表示される	ログイン済／SEED-M03-17-TAG-RESET（使い捨て）	既存id／変更後の名称・並び順	"1. /tag_sales_analysis/{id} を開く
2. 値を変更し登録を押下する"	「登録が完了しました。」が表示され、一覧へリダイレクトされること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-032	IT-22	DBとの相関バリデーション	P1	既存名称と重複する名称で登録すると一意制約違反メッセージが表示される	ログイン済／SEED-M03-17-DUP（既存名称あり）	名称＝既存と重複／並び順＝任意	"1. 新規画面を表示する
2. 既存と重複する名称を入力し登録を押下する"	「値が重複しています。」が表示され、同一画面に再描画され保存されないこと。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-033	IT-03	画面遷移	P2	検証失敗時は一覧付きフォームが同一画面に再描画される	ログイン済／SEED-M03-17-ADMIN	検証に失敗する入力	"1. 新規画面を表示する
2. 検証失敗する入力で登録を押下する"	一覧付きフォームHTMLが同一画面に再描画され「登録できませんでした。」相当のエラーが表示されること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-034	IT-03	画面遷移	P3	検証失敗時に送信済みの入力値がフォームへ保持される	ログイン済／SEED-M03-17-ADMIN	検証に失敗する入力（例 名称のみ入力／並び順空）	"1. 新規画面を表示する
2. 一方の項目のみ入力し検証失敗する入力で登録を押下する"	同一画面に再描画され、送信済みの入力値がフォームに保持されること（送信失敗時はPOST済みデータがフォームに残る）。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-040	IT-15	状態変化	P1	紐付けの無いタグをDELETE削除すると行が消え一覧へリダイレクトされる	ログイン済／SEED-M03-17-TAG-DELETABLE（使い捨て・紐付けなし）	削除対象の id／有効なCSRFトークン	1. 削除確認モーダルから削除（DELETE）を実行する	「削除しました」が表示され、一覧へリダイレクトされ当該行が消えること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-041	IT-03	外部画面	P2	商品に紐付くタグはDELETEしても削除されずエラーメッセージが表示される	ログイン済／SEED-M03-17-TAG-PRODUCT（商品紐付けあり）	削除対象の id／有効なCSRFトークン	1. 削除確認モーダルから削除（DELETE）を実行する	「商品で使用されているため…削除することができません。」相当のエラーが表示され、一覧へリダイレクトされタグ本体は残ること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-042	IT-03	画面遷移	P2	注文明細に紐付くタグはDELETEしても削除されずエラーメッセージが表示される	ログイン済／SEED-M03-17-TAG-ORDER（注文明細紐付けあり）	削除対象の id／有効なCSRFトークン	1. 削除確認モーダルから削除（DELETE）を実行する	「購入済の商品で使用されているため…削除することができません。」相当のエラーが表示され、一覧へリダイレクトされタグ本体は残ること。				
m03-17_admin_product_product_sales_analysis_management（商品管理 — 売上分析タグ登録/編集）	E2E-M03-17-043	IT-15	CSRF	P1	DELETEのCSRFトークンが不正だとアクセス拒否（403）となる	ログイン済／SEED-M03-17-TAG-DELETABLE	削除対象の id／不正なCSRFトークン	1. 不正なトークンで削除（DELETE）を発火させる	HTTP 403（アクセス拒否）となり、削除されないこと。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form のブロックプレフィックス `tag_sales_analysis`（`src/Eccube/Form/Type/Admin/TagSalesAnalysisType.php` は class 宣言:28／buildForm:35-65／configureOptions:70-75 のみで `getBlockPrefix()` を**定義していない**ため Symfony 既定＝クラス名 `TagSalesAnalysis` のスネーク化由来。送信キー `tag_sales_analysis[name]`/`[rank]` は設計書「入力項目」と一致）から導出（`name`→`#tag_sales_analysis_name`、`rank`→`#tag_sales_analysis_rank`、`_token`→`#tag_sales_analysis__token`）。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M03-17-001 | E2E自動化 | #tag_sales_analysis_name(tag_sales_analysis.twig:66) / #tag_sales_analysis_rank(:73) / button trans admin.common.registration「登録」(:160-161 / messages.ja.yaml:1436) / table.table-striped(:95) / .js-page-count(:85) | フロント挙動(表示要素)・入力項目(名称/並び順の2欄) |
| E2E-M03-17-002 | E2E自動化 | block title admin.product.product_management「商品管理」(tag_sales_analysis.twig:5 / messages.ja.yaml:1723) / block sub_title admin.product.tag_sales_analysis「売上分析タグ」(:6 / messages.ja.yaml:2039) | フロント挙動(親フレームタイトル/見出し) |
| E2E-M03-17-003 | E2E自動化 | h4.card-title admin.common.registration__add「新規追加」(tag_sales_analysis.twig:59 / messages.ja.yaml:1438) | フロント挙動(上半分カード見出し 新規時) |
| E2E-M03-17-004 | E2E自動化(要シード) | thead th admin.common.id「ID」(tag_sales_analysis.twig:98 / messages.ja.yaml:1612) / 名称(form.name.vars.label :99) / 並び順(form.rank.vars.label :100) / .js-page-count(:85) | フロント挙動(一覧 ID/名称/並び順ヘッダ・表示件数セレクト) |
| E2E-M03-17-005 | E2E自動化 | .js-page-count change で URL に page_count 付与しフル遷移(tag_sales_analysis.twig:37-44) | 画面遷移(表示件数変更→page_count付きGETでフル読み込み)・JS挙動 |
| E2E-M03-17-006 | E2E自動化(要シード) | リダイレクト/URL(/tag_sales_analysis/{id}) / h4.card-title admin.common.edit「編集」(tag_sales_analysis.twig:59 / messages.ja.yaml:1439) / #tag_sales_analysis_name 現行値(Controller.php:55-62 既存エンティティ読込) | 利用者視点の入口(編集GET 当該行をフォームに載せる)・画面遷移 |
| E2E-M03-17-007 | E2E自動化(要シード) | 一覧 編集リンク a[href$="/tag_sales_analysis/{id}"]「編集」(tag_sales_analysis.twig:118-120) | 利用者視点の入口(一覧のID・名称または編集)・操作起点 |
| E2E-M03-17-008 | E2E自動化(要シード) | ページャ a[href*="/tag_sales_analysis/page/"](pager.twig include routes=admin_product_tag_sales_analysis_page tag_sales_analysis.twig:141-144) | 利用者視点の入口(新規時ページリンク)・画面遷移 |
| E2E-M03-17-009 | E2E自動化(要シード) | ページャ a[href*="/tag_sales_analysis/{id}/page/"](pager.twig include routes=admin_product_tag_sales_analysis_edit_page params id tag_sales_analysis.twig:135-139) | 利用者視点の入口(編集時ページリンク)・画面遷移 |
| E2E-M03-17-010 | E2E自動化(要シード) | 削除リンク a[data-method="delete"] data-message=admin.common.delete_modal__message(tag_sales_analysis.twig:123 / messages.ja.yaml:1593) | モーダル・ポップアップ(削除確認モーダル文言・名称埋め込み) |
| E2E-M03-17-011/012 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig) | 権限・認可(未ログインはログインへ誘導) |
| E2E-M03-17-013 | E2E自動化 | HTTP 404(ルート要件 id=\d+ で MtbTagSalesAnalysis 読込失敗 Controller.php:53,55) | エッジケース(存在しない id で編集GET→404) |
| E2E-M03-17-014 | E2E自動化 | .js-page-count option（選択肢 10/50/100/300/500/1000/2000/10000/12000 tag_sales_analysis.twig:85） | フロント挙動(表示件数セレクトの選択肢全量)・利用者視点の入口(件数変更の選択肢) |
| E2E-M03-17-015 | E2E自動化 | #tag_sales_analysis_name 初期空（新規は空欄 Controller.php:55-62 主キー無→新規インスタンス）/ #tag_sales_analysis_rank 初期空 | 処理フロー(GET表示・新規は空フォーム)・入力項目(新規は空欄) |
| E2E-M03-17-016 | E2E自動化(要シード) | #form_tag_sales_analysis[action]（新規=…/store・編集=…/store/{id} tag_sales_analysis.twig:54 / Controller.php:93 action は id 有無で切替） | 処理フロー(GET表示・action 切替)・画面遷移 |
| E2E-M03-17-017 | E2E自動化(要実機確認＝ナビセレクタ) | 管理ナビ「売上分析登録/編集」(eccube_nav キー sales_analysis 共通メニューtwig＝要実機確認) / メニューハイライト product・tag_sales_analysis(設計書フロント挙動) | 利用者視点の入口(ナビからの到達)・フロント挙動(メニューハイライト) |
| E2E-M03-17-027 | E2E自動化(破壊的・要後始末) | #tag_sales_analysis_name(1文字) / #tag_sales_analysis_rank / .alert-success「登録が完了しました。」(admin.register.complete messages.ja.yaml:1773 / Controller.php:138) | バリデーション(名称 最小長1境界内→成功) |
| E2E-M03-17-028 | E2E自動化(破壊的・要後始末) | #tag_sales_analysis_rank(65535) / .alert-success | バリデーション(並び順 上限65535境界内→成功) |
| E2E-M03-17-034 | E2E自動化(要確認＝HTML5検証バイパス) | #tag_sales_analysis_name / #tag_sales_analysis_rank 再描画後の value 保持(handleRequest 後フォーム値を保持 Controller.php:108-118) | 画面遷移/セッション(送信失敗時はPOST済みデータがフォームに残る) |
| E2E-M03-17-020/021 | E2E自動化(要確認＝HTML5 required) | #tag_sales_analysis_name / #tag_sales_analysis_rank / .alert-danger(alert.twig:32,42) / .invalid-feedback(bootstrap_4_horizontal_layout.html.twig:55) | 判定順序#1(未送信/検証失敗→admin.register.failed Controller.php:108-109)・バリデーション(名称/並び順 必須) |
| E2E-M03-17-022 | E2E自動化(要確認＝maxlength=64で65文字目抑止) | #tag_sales_analysis_name(attr maxlength=64 TagSalesAnalysisType.php:42) / .invalid-feedback | バリデーション(名称 最大64・最大長+1はエラー) |
| E2E-M03-17-023 | E2E自動化(破壊的・要後始末) | #tag_sales_analysis_name / #tag_sales_analysis_rank / .alert-success「登録が完了しました。」(admin.register.complete messages.ja.yaml:1773 / Controller.php:138) | バリデーション(名称64境界内/並び順1境界内→成功) |
| E2E-M03-17-024/025 | E2E自動化(要確認＝number min/max遮断) | #tag_sales_analysis_rank(attr min=1/max=65535 TagSalesAnalysisType.php:52-54) / .invalid-feedback | バリデーション(並び順 1〜65535・範囲外はエラー) |
| E2E-M03-17-026 | E2E自動化(要確認＝input[type=number]に非数値を入れられない) | #tag_sales_analysis_rank(IntegerType→number TagSalesAnalysisType.php:49) | バリデーション(並び順は整数) |
| E2E-M03-17-030 | E2E自動化(破壊的・要後始末) | #tag_sales_analysis_name / #tag_sales_analysis_rank / .alert-success / リダイレクトURL(?id=) | 判定順序#3(成功→persist/flush＋admin.register.complete＋admin_product_tag_sales_analysis へクエリid付リダイレクト Controller.php:122-140) |
| E2E-M03-17-031 | E2E自動化(破壊的・要使い捨て) | #tag_sales_analysis_name / #tag_sales_analysis_rank / .alert-success | 処理フロー(更新成功→admin.register.complete Controller.php:138)・DB操作(UPDATE) |
| E2E-M03-17-032 | E2E自動化(要重複シード・破壊的試行) | #tag_sales_analysis_name / .alert-danger「値が重複しています。」(admin.error.non_unique messages.ja.yaml:1777 / Controller.php:125-126) | 判定順序#2(一意制約違反→admin.error.non_unique＋再描画)・エッジケース(名称重複でDBが一意を返す) |
| E2E-M03-17-033 | E2E自動化(要確認＝HTML5検証バイパス) | .alert-danger「登録できませんでした。」(admin.register.failed messages.ja.yaml:1774 / Controller.php:109) / 一覧 table.table-striped | エラー処理(フォーム検証失敗→admin.register.failed＋一覧付き同テンプレ再描画 Controller.php:108-118) |
| E2E-M03-17-040 | E2E自動化(破壊的・要CSRF・要使い捨て) | 削除 DELETE /tag_sales_analysis/{id}/delete(Controller.php:151) / .alert-success「削除しました」(admin.common.delete_complete messages.ja.yaml:1400 / Controller.php:176) | 処理フロー(削除)#4(紐付けなし→remove/flush＋delete_complete＋一覧リダイレクト Controller.php:174-178) |
| E2E-M03-17-041 | E2E自動化(要商品紐付けシード) | .alert-danger admin.tag.delete.failed(messages.ja.yaml:1423 / Controller.php:156-158 getProducts() not empty) | 処理フロー(削除)#2(商品紐付けあり→admin.tag.delete.failed＋一覧リダイレクト・本体残存)・エッジケース |
| E2E-M03-17-042 | E2E自動化(要注文明細紐付けシード) | .alert-danger admin.order_tag.delete.failed(messages.ja.yaml:1424 / Controller.php:165-167 getOrderItems() not empty) | 処理フロー(削除)#3(注文明細紐付けあり→admin.order_tag.delete.failed＋一覧リダイレクト) |
| E2E-M03-17-043 | E2E自動化(要不正トークン発火) | HTTP 403(isTokenValid() Controller.php:154) | エラー処理(DELETE CSRF検証失敗→アクセス拒否403)・エッジケース |

注: `元ITケースID` の行単位対応付けは付帯表2bで実施（既存IT cases接頭辞 `IT-M03-17-ADMIN-PRODUCT-PRODUCT-SALES-ANALYSIS-MANAGEMENT-NNN`）。既存IT casesは観点名のみの定型自動生成スタブであり、本E2Eは設計書本文（利用者視点の入口・処理フロー・判定順序・表示メッセージ・エラー処理・バリデーション）を一次情報源として網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_17_admin_product_product_sales_analysis_management_it_cases.md` の関連ID件数（IT-22=35/IT-23=22/IT-26=10/IT-25=9/IT-03=7/IT-15=4/IT-20=2/IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は **付帯表2b（行単位明細・全90行）** が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-15 | 4 | 4 | 0 | 0 | CSRF(DELETE403)・未認証・対象データ・状態変化(削除で行が消える)はすべてブラウザ観測可 |
| IT-20 | 2 | 0 | 0 | 2 | 専用ログなし＝ブラウザ観測外（フラッシュ/HTTP状態は他観点で確認） |
| IT-25 | 9 | 9 | 0 | 0 | UI部品・タイトル・カード見出し・JS(page_count)・削除確認モーダル文言・HTTPステータス・URLはすべて観測可 |
| IT-03 | 7 | 6 | 1 | 0 | 同時更新(楽観ロックなし)の後勝ち挙動は並行制御が要り自動化困難＝手動/間接 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス(編集モード/未ログイン誘導)は観測可 |
| IT-22 | 35 | 14 | 1 | 20 | 本機能の入力は名称(text/最大64)・並び順(整数1..65535)のみ。数値細目・文字種・その他/相関の汎用観点は2項目に非該当。部分入力(No.35)は一部項目のみ送信→検証エラーで020/021/034に該当。セッションpage状態は間接 |
| IT-23 | 22 | 4 | 2 | 16 | 本機能はDB検索を行わない(一覧は全件rank昇順のページネーション)。検索条件は非該当。実行結果は一覧表示/削除拒否で代表、関連件数は間接 |
| IT-26 | 10 | 9 | 1 | 0 | 登録/更新は成功メッセージ・リダイレクト・一覧表示で間接確認。セッションpage状態のみ間接 |
| 合計 | 90 | 47 | 5 | 38 | **未分類 0** |

注: 対象外38件・手動5件はいずれも「ブラウザで観測不能(ログ/セッション内部値)」「本機能で非該当(検索なし・2項目フォーム)」「並行制御依存」が理由であり、放置ではない。部分入力(IT行058)は当初対象外としていたが、観点No.35「一部項目だけ入力→サーバ側検証エラー・部分保存されない」に本機能(2項目フォームの片方未入力)が該当するため E2E自動化(020/021/034)へ是正した。

注（spec 実装状態＝「E2E自動化」の実行可否区分）: 「E2E自動化」47件は『ブラウザで観測可能でE2E化対象』という**分類**であり、現時点で spec が**実行可能**なのは非破壊（表示／ナビ／遷移／未認証誘導／404）の **001〜016**（うち 011/012 は資格情報不要、004/006/007/008/009/010/016 は参照系シード時のみ）。ナビ到達 **017** はナビセレクタが Twig 未確認のため `test.fixme`（要実機確認）。DB副作用を伴う破壊系・要CSRF・HTML5クライアント検証バイパスを要する **020〜028／030〜034／040〜043** は、テストを実装へ寄せない方針のもと spec で `test.fixme`（理由付き雛形）として明示し、実機（使い捨てシード／CSRFトークン付与／`novalidate` 等）整備後に本実装する。したがって本表・付帯表5の「カバー」は**ケース設計済み**を意味し、自動実行可否は付帯表1の `E2E可否` 注記および spec の `test.fixme` で監査する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を、本機能でのブラウザ観測可否で `E2E自動化／手動・間接／対象外` に分類し、対応E2EケースIDまたは理由を付す。スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | E2E自動化 | 043（DELETE CSRF不正→403） |
| 002 | IT-15 | 未認証 | E2E自動化 | 011/012（未ログイン誘導） |
| 003 | IT-15 | 対象データ | E2E自動化 | 008（新規時ページリンク＝ページ番号更新の対象データ。IT行内容「一覧のページリンク（新規時）→ページ番号更新」に整合） |
| 004 | IT-20 | 出力抑止 | 対象外 | 専用ログ出力抑止＝ブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子＝ブラウザ観測外 |
| 006 | IT-15 | 状態変化 | E2E自動化 | 040（紐付けなし削除で行が消える） |
| 007 | IT-25 | UI部品 | E2E自動化 | 001（新規フォームUI） |
| 008 | IT-25 | UI部品 | E2E自動化 | 002（親フレームタイトル「商品管理」） |
| 009 | IT-25 | 操作起点 | E2E自動化 | 005（.js-page-count change でfull遷移） |
| 010 | IT-25 | 確認ダイアログ | E2E自動化 | 010（削除確認モーダル文言） |
| 011 | IT-25 | 確認ダイアログ | E2E自動化 | 001（名称入力欄） |
| 012 | IT-25 | 確認ダイアログ | E2E自動化 | 001（並び順入力欄） |
| 013 | IT-25 | 送信可否制御 | E2E自動化 | 032（名称重複→値が重複しています） |
| 014 | IT-03 | 外部画面 | E2E自動化 | 041（商品紐付け削除拒否） |
| 015 | IT-03 | 画面遷移 | E2E自動化 | 004（一覧＝全件ページネーション表示） |
| 016 | IT-03 | 画面遷移 | E2E自動化 | 041（商品関連あれば削除しない） |
| 017 | IT-03 | 画面遷移 | E2E自動化 | 042（注文明細関連あれば削除しない） |
| 018 | IT-03 | 画面遷移 | 手動/間接 | 同時更新＝楽観ロックなし後勝ち。並行制御が要り自動化困難 |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 030（成功時リダイレクト＋成功フラッシュ） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 033（失敗時 一覧付きフォーム再描画＋エラー） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 006/012（編集モード直アクセス・未ログイン誘導） |
| 022 | IT-25 | HTTPステータス | E2E自動化 | 013/024/025（404・範囲外検証） |
| 023 | IT-25 | URL | E2E自動化 | 005（page_count付きURL再描画） |
| 024 | IT-22 | 必須バリデーション | E2E自動化 | 020（名称未入力→失敗） |
| 025 | IT-22 | 必須バリデーション | E2E自動化 | 021（並び順未入力→失敗） |
| 026 | IT-22 | 文字列長バリデーション | E2E自動化 | 023（名称64境界内→成功） |
| 027 | IT-22 | 文字列長バリデーション | E2E自動化 | 022（名称最大+1(65)→エラー） |
| 028 | IT-22 | 文字列長バリデーション | E2E自動化 | 027（名称最小長(1文字)→成功） |
| 029 | IT-22 | 文字列長バリデーション | E2E自動化 | 020（名称最小-1=空→必須エラー） |
| 030 | IT-22 | 文字列長バリデーション | 対象外 | 「専用ログ」観点＝本画面に専用ログなし・ブラウザ観測外 |
| 031 | IT-22 | 文字列長バリデーション | 手動/間接 | セッション page_no/page_count 更新＝内部値で間接 |
| 032 | IT-22 | 数値バリデーション | 対象外 | 「削除方式」観点＝数値入力に非該当 |
| 033 | IT-22 | 数値バリデーション | E2E自動化 | 024（並び順0 範囲外→エラー） |
| 034 | IT-22 | 数値バリデーション | E2E自動化 | 025（並び順65536 範囲外→エラー） |
| 035 | IT-22 | 数値バリデーション | E2E自動化 | 028（並び順 上限65535境界内→成功。範囲内境界の代表） |
| 036 | IT-22 | 数値バリデーション | E2E自動化 | 026（並び順 非数値→保存されない） |
| 037 | IT-22 | 数値バリデーション | 対象外 | 「削除」観点＝数値入力に非該当 |
| 038 | IT-22 | 数値バリデーション | 対象外 | 該当する数値入力項目なし（2項目フォーム） |
| 039 | IT-22 | 数値バリデーション | 対象外 | 「表示要素」観点＝数値入力に非該当 |
| 040 | IT-22 | 文字種バリデーション | 対象外 | 名称は文字種制約なし＝非該当 |
| 041 | IT-22 | 文字種バリデーション | 対象外 | 並び順は number input で文字種観点が非該当 |
| 042 | IT-22 | その他のバリデーション | 対象外 | 2項目フォームに該当する他バリデーションなし |
| 043 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 044 | IT-22 | その他のバリデーション | 対象外 | 同上（一意は055/056・013で代表） |
| 045 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 046 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 047 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 048 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 049 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 050 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 051 | IT-22 | 相関バリデーション | 対象外 | 名称・並び順間に相関検証なし＝非該当 |
| 052 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 053 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 054 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 055 | IT-22 | DBとの相関バリデーション | E2E自動化 | 032（名称一意・DB相関） |
| 056 | IT-22 | DBとの相関バリデーション | E2E自動化 | 032（重複でエラー） |
| 057 | IT-22 | 必須制御 | E2E自動化 | 020/021（必須・空入力） |
| 058 | IT-22 | 部分入力 | E2E自動化 | 020/021/034（一部項目だけ入力で送信→サーバ側検証エラー・部分保存されない＝観点No.35に該当） |
| 059 | IT-23 | 検索条件 | 対象外 | 本機能はDB検索なし（一覧は全件rank昇順） |
| 060 | IT-23 | 検索条件 | 対象外 | 同上 |
| 061 | IT-23 | 検索条件 | 対象外 | 同上 |
| 062 | IT-23 | 検索条件 | 対象外 | 同上 |
| 063 | IT-23 | 検索条件 | 対象外 | 同上 |
| 064 | IT-23 | 検索条件 | 対象外 | 同上 |
| 065 | IT-23 | 検索条件 | 対象外 | 同上 |
| 066 | IT-23 | 検索条件 | 対象外 | 同上 |
| 067 | IT-23 | 検索条件 | 対象外 | 同上 |
| 068 | IT-23 | 検索条件 | 対象外 | 同上 |
| 069 | IT-23 | 検索条件 | 対象外 | 同上 |
| 070 | IT-23 | 検索条件 | 対象外 | 同上 |
| 071 | IT-23 | 検索条件 | 対象外 | 同上 |
| 072 | IT-23 | 検索条件 | 対象外 | 同上（削除確認モーダルは010で代表） |
| 073 | IT-23 | 検索条件 | 対象外 | 同上 |
| 074 | IT-23 | 検索条件 | 対象外 | 同上 |
| 075 | IT-23 | 実行結果 | E2E自動化 | 032（名称重複でDBが一意を返す実行結果→non_unique再描画。IT行内容「名称の重複でDBが一意を返す」に整合） |
| 076 | IT-23 | 実行結果 | E2E自動化 | 041（商品紐付け削除拒否） |
| 077 | IT-23 | 実行結果 | E2E自動化 | 004（一覧＝全件クエリのページネーション結果） |
| 078 | IT-23 | 実行結果 | 手動/間接 | dtb_product_tag_sales_analysis 件数＝DB内部値で間接 |
| 079 | IT-23 | 実行結果 | 手動/間接 | dtb_order_item_tag_sales_analysis 件数＝DB内部値で間接 |
| 080 | IT-26 | 登録内容 | E2E自動化 | 030（新規登録でレコード追加） |
| 081 | IT-26 | 登録内容 | E2E自動化 | 032（重複/検証失敗で追加されない） |
| 082 | IT-26 | 登録内容 | E2E自動化 | 030（成功で追加される） |
| 083 | IT-26 | 登録内容 | E2E自動化 | 030/031（登録・更新で直接保存） |
| 084 | IT-26 | 登録内容 | E2E自動化 | 024/025（並び順 範囲 1〜65535） |
| 085 | IT-23 | 登録内容 | E2E自動化 | 005（page_count付きフル読み込み） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 030（成功→一覧 admin_product_tag_sales_analysis へ） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 033（検証失敗→同一画面HTML再描画） |
| 088 | IT-26 | 登録内容 | 手動/間接 | GET時セッションpage状態書込＝内部値で間接 |
| 089 | IT-26 | 登録内容 | E2E自動化 | 030（保存後リダイレクトにクエリid付） |
| 090 | IT-26 | 登録内容 | E2E自動化 | 041（削除拒否 admin.tag.delete.failed） |

集計（付帯表2と一致）: 自動化 47 ／ 手動・間接 5（018,031,078,079,088）／ 対象外 38（004,005,030,032,037,038,039,040,041,042-050=9,051-054=4,059-074=16）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-17-ADMIN | dtb_member(管理者) | /product 配下に到達できる有効な管理者1。2FA OFF。ID/PW は config 既定 | fixture(config既定) | 既存利用・撤去不要 | 001,002,003,004,005,008,009,013,014,015,016,017,020,021,022,023,024,025,026,027,028,030,033,034 |
| SEED-M03-17-TAG | mtb_tag_sales_analysis / 既知 id（環境変数 TAG_SA_EDIT_ID） | 参照系用の既存タグ1件以上（name/rank 設定済）。**更新も削除もしない参照専用** | fixture/migration | 専用・参照のみ・撤去不要 | 004,006,007,008,009,010,016 |
| SEED-M03-17-TAG-RESET | mtb_tag_sales_analysis / 専用 id | 更新対象の使い捨てタグ。**更新で値が変わるためテスト毎に既知値へ復元または使い捨て** | fixture/migration | 使い捨て・復元 | 031 |
| SEED-M03-17-DUP | mtb_tag_sales_analysis / 既存 name | 既知の重複対象 name を持つ行が1件存在（一意制約に当てる） | fixture/migration | 専用・参照のみ | 032 |
| SEED-M03-17-TAG-DELETABLE | mtb_tag_sales_analysis / 専用 id（紐付けなし） | 商品・注文明細いずれにも紐付かない使い捨てタグ（削除可能） | synthetic(UI登録)/fixture | 使い捨て・削除前提・接頭辞付き | 040,043 |
| SEED-M03-17-TAG-PRODUCT | mtb_tag_sales_analysis ＋ dtb_product_tag_sales_analysis | 商品に1件以上紐付くタグ（削除拒否対象） | fixture/migration | 専用・参照のみ・撤去不要 | 041 |
| SEED-M03-17-TAG-ORDER | mtb_tag_sales_analysis ＋ dtb_order_item_tag_sales_analysis | 商品紐付けは無く注文明細に1件以上紐付くタグ（削除拒否対象） | fixture/migration | 専用・参照のみ・撤去不要 | 042 |

注: 023/027/028/030 で作成する行は識別接頭辞（例 `e2e_sa_`）を付け、テスト後に撤去できるようにする。`migration` を選ぶ場合は DB=ec-cube-enterprise 正典（reverse-design 1c）に従い、`mtb_tag_sales_analysis`(`name` varchar(64)/`rank` SMALLINT UNSIGNED) と結合表 `dtb_product_tag_sales_analysis`・`dtb_order_item_tag_sales_analysis` の対応を別途定義する。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

仕様（設計書/メッセージキーの趣旨）と実装(Twig/ソース)の食い違い・要確認。テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 削除拒否メッセージ（設計書確認値）「商品で使用されているため、当該名称のタグは削除することができません。」 | messages.ja.yaml:1423 admin.tag.delete.failed=「商品で使用されているため、「%name%」のタグは削除することができません。」 | 文言は「当該名称」→「「%name%」（実名埋め込み）」で表現差。メッセージキーの趣旨は一致。テストは「削除することができません」の趣旨で部分一致確認 | E2E-M03-17-041 | 要確認(文言差) |
| 2 | 削除完了メッセージ（設計書確認値の節は delete_complete を参照） | messages.ja.yaml:1400 admin.common.delete_complete=「削除しました」（句点なし） | 句点有無の表現差。期待は仕様キー趣旨。部分一致で確認 | E2E-M03-17-040 | 要確認(文言差) |
| 3 | 名称は必須・最大64／並び順は必須・整数1〜65535 | TagSalesAnalysisType.php:38-64（NotBlank/Length max=64/Range 1..65535・attr maxlength=64/min=1/max=65535）。twig form に novalidate なし | フォーム制約は静的確認済だが**期待値は設計書(必須/最大64/範囲)由来**でオラクル化。HTML5 required・number min/max・maxlength により未入力/範囲外/65文字目/非数値が**クライアント遮断**されサーバ側検証へ到達しない可能性。操作経路の成否を実機確認 | E2E-M03-17-020,021,022,024,025,026 | 要確認(クライアント検証) |
| 4 | 保存成功後は一覧へリダイレクト | Controller.php:140 redirectToRoute('admin_product_tag_sales_analysis', ['id'=>...]) | 設計書どおりクエリ id 付き。ただしパス側に {id} が無く一覧トップ表示となり編集状態は復元しない（設計書「保存後リダイレクト」記載と整合）。クエリ id の利用有無を実機確認 | E2E-M03-17-030 | 要確認(リダイレクト先) |
| 5 | フォーム検証失敗時の HTTP ステータス | 設計書「無効フォームは通常 422」。Controller.php:108-118 は render（明示ステータス指定なし＝200想定） | 設計書の「コントローラ基底により422」という記載と、本コントローラが render（既定200）を返す点が乖離の可能性。実機でステータスを確認 | E2E-M03-17-033 | 要確認(HTTPステータス) |
| 6 | 一覧の各行に「編集」「削除」ボタン | tag_sales_analysis.twig:117-126（編集＝btn-primary／削除＝btn-primary data-method=delete） | 設計書「表は…編集ボタン、削除ボタン」と一致。削除は DELETE メソッド＋csrf_token_for_anchor() で共通JSが送信。モーダル発火/トークン付与の挙動は要実機確認 | E2E-M03-17-010,040,043 | 要確認(JS/CSRF発火) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（ナビ/一覧/編集/ページ/件数/登録/削除） | 新規GET表示・編集GET・ページリンク・件数変更・登録POST・削除DELETE・ナビからの到達 | 001,004,005,006,007,008,009,014,017,030,040 | カバー(017=ナビ到達はナビセレクタ未確認でspec fixme＝要実機) |
| フロント挙動（表示要素：タイトル/見出し/名称/並び順/件数/一覧/登録ボタン） | タイトル「商品管理」/サブ「売上分析タグ」・カード見出し・2入力欄・件数セレクト選択肢全量・一覧ヘッダ・登録ボタン・新規初期値空欄 | 001,002,003,004,014,015 | カバー |
| フロント挙動（JS：.js-page-count change で page_count フル遷移） | 件数変更→page_count付きURL | 005 | カバー |
| モーダル・ポップアップ（削除確認モーダル文言・名称埋め込み） | 削除リンクの data-message | 010 | カバー(JS発火は要実機) |
| 処理フロー(GET表示) | 新規は空フォーム＋一覧／編集は当該行＋一覧・ページャ経路切替・フォームaction切替(store/store/{id}) | 001,006,008,009,015,016 | カバー |
| 処理フロー(POST登録/更新) | 成功→complete＋リダイレクト／検証失敗→failed再描画／一意違反→non_unique再描画 | 030,031,033,032 | 部分カバー(ケース設計済・自動実行は spec `test.fixme`＝破壊系/HTML5検証バイパス要・実機整備後に本実装) |
| 処理フロー(DELETE) | CSRF不正→403／商品紐付け→tag.delete.failed／注文明細紐付け→order_tag.delete.failed／両方なし→削除＋complete | 043,041,042,040 | 部分カバー(ケース設計済・自動実行は spec `test.fixme`＝DELETE/CSRF/使い捨てシード要・実機整備後に本実装) |
| 集計条件（一覧総件数＝全件rank昇順をpage_countで分割） | 一覧表示・件数変更・件数選択肢 | 004,005,014 | 部分カバー(004=一覧存在/005=page_count付与URL/014=選択肢全量表示。件数の厳密分割・選択肢外page_countの扱い＝手動/間接) |
| 登録・更新時の判定順序 #1 検証 | 否→エラーフラッシュ＋再描画／送信値はフォーム保持 | 020,021,033,034 | 部分カバー(ケース設計済・自動実行は spec `test.fixme`＝HTML5検証バイパス要) |
| 登録・更新時の判定順序 #2 persist/flush 一意違反 | 一意違反→エラーフラッシュ＋再描画 | 032 | 部分カバー(ケース設計済・自動実行は spec `test.fixme`＝重複シード要) |
| 登録・更新時の判定順序 #3 全成功 | 成功フラッシュ＋一覧リダイレクト(クエリid) | 030 | 部分カバー(ケース設計済・自動実行は spec `test.fixme`＝破壊的・後始末要) |
| 業務ルール(一覧並び rank 昇順) | 一覧は rank 昇順 | 004 | 手動/間接(004はヘッダ/一覧存在の確認のみで行順は未検証。rank昇順の厳密確認は既知rankの複数シードを要し手動/間接) |
| 入力項目(名称 必須/最大64) | 必須・最小長1境界・最大64境界・最大+1(65) | 020,027,023,022 | 部分カバー(最大64/最小1の成功境界は設計済だが spec `test.fixme`＝破壊的・要確認:クライアント検証) |
| 入力項目(並び順 必須/整数/1..65535) | 必須・下限1・上限65535・範囲外(0/65536)・整数 | 021,024,025,026,028 | 部分カバー(下限1/上限65535の成功境界は設計済だが spec `test.fixme`＝破壊的・要確認:クライアント検証) |
| エッジケース(存在しないid編集GET→404) | 404 | 013 | カバー |
| エッジケース(DELETE CSRF不正→403) | 403 | 043 | カバー |
| エッジケース(名称重複でDBが一意を返す) | non_unique再描画 | 032 | カバー |
| エッジケース(商品のみ紐付き/注文明細のみ紐付き) | 各削除拒否 | 041,042 | カバー |
| データ整合性(一覧とフォームの起源別) | 一覧＝全件クエリ／フォーム＝id行or新規 | 004,006 | カバー |
| データ整合性(同時更新＝楽観ロックなし後勝ち) | 並行更新で後勝ち上書き | （並行制御依存） | 手動/間接 |
| 画面遷移(件数変更/ページクリック/保存成功/検証失敗/DELETE完了/action切替/送信値保持) | page_count・ページャ・リダイレクト・再描画・action切替・送信値保持 | 005,008,009,016,030,033,034,040 | 部分カバー(005/008/009/016は実行可・030/033/034/040は spec `test.fixme`＝破壊系/検証バイパス要) |
| 遷移時に引き継ぐ状態(GET時 page_no/page_count をセッションへ) | セッションpage状態 | （内部値） | 手動/間接 |
| エラー処理(検証失敗/一意違反/削除拒否×2/DELETE CSRF) | 各フラッシュ・ステータス | 033,032,041,042,043 | 部分カバー(ケース設計済・自動実行は全件 spec `test.fixme`＝破壊系/検証バイパス/CSRF要・実機整備後に本実装。検証失敗時HTTP 422/200は付帯表4#5の要確認) |
| 権限・認可(未ログイン→ログイン誘導/ROLE) | 未ログイン誘導 / ROLE別拒否 | 011,012 | 未ログイン誘導＝カバー(011/012)。ROLE別拒否(権限不足ロールで /product 配下が拒否されるか)は**手動/間接**＝要ロールシード（権限を絞った管理者の準備が必要でブラウザ単体では再現困難。下記要確認） |
| セッション(page_no/page_count 更新・入力はフォーム側) | セッションpage状態 | （内部値） | 手動/間接 |
| Cookie(本機能固有なし・共通セッションCookie前提) | — | （固有仕様なし） | 対象外(固有仕様なし) |
| 排他制御・トランザクション(明示なし・flushがコミット単位) | 後勝ち上書き | （並行制御依存） | 手動/間接 |
| 試行制限(独自に増やさない) | — | （該当なし） | 対象外(該当なし) |
| ログ・監査(専用ログなし・出力禁止項目) | 専用ログ出力抑止 | （観測外） | 対象外(ブラウザ観測外) |
| API/バッチ結果(なし) | — | （該当なし） | 対象外(該当なし) |
| DB検索(本機能は検索なし) | — | （該当なし＝一覧は全件ページネーション） | 対象外(検索機能なし) |

未カバー・部分カバーはいずれも理由（並行制御依存＝手動/間接・セッション内部値・固有仕様なし・該当なし・ブラウザ観測外・検索機能なし・行順/件数の厳密確認は複数シード要で手動/間接・ROLE別拒否は要ロールシードで手動/間接）を明記済み。判定順序#1〜#3は各分岐を行単位に分解し、すべて E2E ケースへ写像した（#1の一部はHTML5クライアント検証のため要確認）。なお本マトリクスの「カバー」は**ケース設計済み**を意味し、破壊系・要確認系の自動実行可否は付帯表1の `E2E可否` 区分および spec の `test.fixme` 注記で管理する（付帯表2「spec 実装状態」注を参照）。
