# m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.html`（正本 `functions/pf-eccube3/m03-21_admin_product_product_shelf_number_register_edit.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_21_admin_product_product_shelf_number_register_edit_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・フラッシュメッセージ・ダウンロード発火・(間接)一覧反映などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない（メッセージ文言は設計書が参照する trans キーの確定値＝messages.ja.yaml / ShelfNumberType の固定文言を引用）。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

設計源は pf-eccube3 のリバースであり、**刷新先 ec-cube-enterprise に該当画面（`ShelfNumberController` / `shelf_number.twig` / `ShelfNumberType`）が存在しセレクタを導出できた**（screenExists=true）。設計書と実装の乖離は付帯表4に分離する。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-15 | 未認証ガード・編集対象行バインド・表示件数セッション状態 |
| IT-20 | ログ出力抑止（CSV取込ログの秘匿対象）＝ブラウザ観測外 |
| IT-25 | UI部品（フォーム/一覧/表示件数/CSV導線）・確認ダイアログ属性・HTTPステータス(404)・タイトル/サブタイトル |
| IT-03 | 画面遷移（編集→新規戻り・登録成功リダイレクト・CSV取込画面・削除拒否） |
| IT-13 | URL直接アクセス（未認証誘導・後方互換/csv） |
| IT-22 | 必須/形式（Regex）バリデーション・一意制約相関・CSV行数上限 |
| IT-23 | 一覧 sort_no 昇順・削除実行結果（DB検索条件は本機能に無し＝大半対象外） |
| IT-26 | 登録/更新内容（成功フラッシュ・(間接)一覧反映） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-001	IT-25	UI部品	P1	新規画面に名称・並び順入力欄・登録ボタンと下部一覧が表示される	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く	名称入力欄・並び順入力欄・「登録」ボタン・下部一覧表が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-002	IT-25	UI部品	P2	新規モードのカード見出しが「新規追加」	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く	カード見出しに「新規追加」が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-003	IT-25	表示結果	P2	タイトル「商品管理」・サブタイトル「棚番号登録/編集」が表示される	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く	タイトル「商品管理」・サブタイトル「棚番号登録/編集」が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-004	IT-25	UI部品	P2	一覧ヘッダ(ID/名称/並び順)・編集/削除導線・表示件数セレクトが表示される	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く	一覧にID・名称・並び順の列見出しと編集/削除導線、表示件数セレクトが表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-005	IT-25	操作起点	P2	「CSV出力」「CSV入力」リンクが表示される	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く	画面上部に「CSV出力」「CSV入力」リンクが表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-006	IT-03	画面遷移	P2	編集画面でカード見出し「編集」と「新規登録へ戻る」が表示される	管理者ログイン済／SEED-M03-21-ROW（既存棚番号）	—	1. 一覧の編集リンク（/admin/product/shelf_number/{id}）を開く	カード見出し「編集」と「新規登録へ戻る」リンクが表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-007	IT-03	画面遷移	P2	編集画面の上部フォームが当該行の名称・並び順を反映する	管理者ログイン済／SEED-M03-21-ROW	—	"1. /admin/product/shelf_number/{id} を開く
2. 上部フォームの値と一覧の当該行を照合する"	上部フォームの名称・並び順が当該行の値（一覧にも存在する値）を反映していること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-008	IT-03	画面遷移	P2	編集画面で「新規登録へ戻る」を押すと新規モードへ戻る	管理者ログイン済／SEED-M03-21-ROW	—	"1. /admin/product/shelf_number/{id} を開く
2. 「新規登録へ戻る」を押下"	一覧トップ（/admin/product/shelf_number）へ遷移し、カード見出しが「新規追加」になること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-010	IT-26	登録内容	P1	形式妥当な未登録名称＋並び順で登録すると成功フラッシュが表示される	管理者ログイン済／SEED-M03-21-NEW（未登録の形式妥当名・使い捨て）	名称＝SHELF_NEW_NAME（例 Z-999）、並び順＝999	"1. /admin/product/shelf_number を開く
2. 名称・並び順を入力
3. 「登録」を押下"	「登録が完了しました。」が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-011	IT-03	画面遷移	P1	登録成功後は一覧(admin_product_shelf_number)へリダイレクトされる	管理者ログイン済／SEED-M03-21-NEW	名称＝SHELF_NEW_NAME、並び順＝999	1. 新規登録を成功させる	一覧ルート（/admin/product/shelf_number。生成URLに保存後idが付く場合がある）へリダイレクトされること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-012	IT-26	登録内容	P2	登録後は一覧に登録名称が表示される（間接DB確認）	管理者ログイン済／SEED-M03-21-NEW	名称＝SHELF_NEW_NAME、並び順＝1	"1. 新規登録を成功させる
2. 一覧を確認する"	一覧に登録した名称が表示されること（persist/flushによる即時反映の間接確認）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-013	IT-26	更新内容	P1	編集で値を変更して保存すると成功フラッシュが表示される	管理者ログイン済／SEED-M03-21-ROW（使い捨て更新用）	並び順＝任意の変更値	"1. /admin/product/shelf_number/{id} を開く
2. 並び順を変更
3. 「登録」を押下"	「登録が完了しました。」が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-014	IT-26	更新内容	P2	編集更新後に変更値が一覧/再編集フォームに反映される（間接DB確認）	管理者ログイン済／SEED-M03-21-ROW（使い捨て更新用）	並び順＝変更値	1. /admin/product/shelf_number/{id} を開く 2. 並び順を変更し登録 3. 一覧または再編集フォームで値を確認	変更後の並び順が一覧/再編集フォームに反映されていること（persist/flushによる即時反映の間接確認）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-020	IT-22	必須バリデーション	P1	名称未入力で登録すると失敗フラッシュが表示され同画面が再描画される	管理者ログイン済／SEED-M03-ADMIN	名称＝空、並び順＝100	"1. /admin/product/shelf_number を開く
2. 名称を空のまま並び順を入力
3. 「登録」を押下"	「登録できませんでした。」が表示され、一覧へリダイレクトせず同テンプレート(store)で再描画されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-021	IT-22	文字種バリデーション	P1	形式不正な名称で登録すると名称の形式エラーが表示される	管理者ログイン済／SEED-M03-ADMIN	名称＝abc（形式不正）、並び順＝100	"1. /admin/product/shelf_number を開く
2. 形式不正な名称を入力
3. 「登録」を押下"	「※名称は大文字アルファベットと-(ハイフン)と3桁の数値の形式のみ登録可能です。」が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-022	IT-22	必須バリデーション	P2	並び順未入力で登録すると失敗フラッシュが表示される	管理者ログイン済／SEED-M03-ADMIN	名称＝A-001、並び順＝空	"1. /admin/product/shelf_number を開く
2. 並び順を空のまま名称を入力
3. 「登録」を押下"	「登録できませんでした。」が表示され、同テンプレート(store)で再描画されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-023	IT-22	必須バリデーション	P2	編集モード(/store/{id})でも名称未入力で登録すると失敗フラッシュが表示され同画面が再描画される（非破壊）	管理者ログイン済／SEED-M03-21-ROW（参照のみ・検証失敗でDB不変）	名称＝空、並び順＝任意	1. /admin/product/shelf_number/{id} を開く 2. 名称を空にして「登録」を押下	「登録できませんでした。」が表示され、一覧へリダイレクトせず同テンプレート(store)で再描画されること（更新は確定しない）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-024	IT-22	DBとの相関バリデーション	P1	既存名称と同一名称で登録すると一意制約違反メッセージが表示される	管理者ログイン済／SEED-M03-21-DUP（既存の形式妥当名）	名称＝SHELF_DUP_NAME（既存）、並び順＝998	"1. /admin/product/shelf_number を開く
2. 既存名称と同一の名称を入力
3. 「登録」を押下"	「値が重複しています。」が表示され、一覧（admin_product_shelf_number）へリダイレクトされること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-030	IT-25	確認ダイアログ	P2	一覧の削除リンクが data-method=delete と確認メッセージ属性を持つ	管理者ログイン済／SEED-M03-ADMIN（一覧に1件以上）	—	"1. /admin/product/shelf_number を開く
2. 一覧の削除リンクの属性を確認する"	"削除リンクが data-method=\""delete\"" と確認メッセージ属性（data-message）を持つこと。"				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-031	IT-23	実行結果	P1	商品規格に参照されない棚番号を削除すると削除成功メッセージが表示される	管理者ログイン済／SEED-M03-21-DELETABLE（参照なし・使い捨て）	—	"1. /admin/product/shelf_number を開く
2. 対象行の削除リンクを押下し確認ダイアログを承認"	「削除しました」が表示され、一覧から当該行が消えること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-032	IT-23	実行結果	P1	商品規格に参照される棚番号は削除されずエラーメッセージが表示される	管理者ログイン済／SEED-M03-21-LINKED（商品規格が参照）	—	"1. /admin/product/shelf_number を開く
2. 参照ありの棚番号の削除リンクを押下し確認ダイアログを承認"	「商品で使用されているため、「{名称}」の棚番号は削除することができません。」が表示され、削除されないこと。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-040	IT-25	操作起点	P2	「CSV出力」押下でCSVダウンロードが開始される	管理者ログイン済／SEED-M03-ADMIN	—	"1. /admin/product/shelf_number を開く
2. 「CSV出力」を押下"	CSVダウンロードが開始され、ファイル名が shelf_number_YYYYMMDDHHmmss.csv 形式であること（内容は手動確認）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-041	IT-25	操作起点	P1	「CSV入力」押下でマスタCSVアップロード画面へ遷移する	管理者ログイン済／SEED-M03-ADMIN	—	"1. /admin/product/shelf_number を開く
2. 「CSV入力」を押下"	マスタCSVアップロード画面（/admin/product/shelf_number/master_csv_upload）へ遷移すること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-042	IT-13	URL直接アクセス	P3	後方互換URL(/product/shelf_number/csv)でも取込画面が表示される	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number/csv を直接開く	マスタCSVアップロード画面（master_csv_upload と同一画面）が表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-043	IT-22	その他のバリデーション	P2	CSV取込で行数上限(5010)を超えると件数上限メッセージが表示される	管理者ログイン済／SEED-M03-ADMIN	5010行を超えるCSVファイル	"1. CSVアップロード画面でファイルを選択
2. 取込を実行"	「{N} 行を超えるCSVファイルは登録できません。」が表示され、取込画面へ戻ること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-044	IT-25	操作起点	P2	マスタCSVヘッダー雛形(master_csv_template)のダウンロードが発火する	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number/master_csv_template を開く（または雛形DL導線を押下）	CSV雛形のダウンロードが発火すること（ヘッダーのみ・内容は手動確認。画面上の導線露出は要実機確認）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-045	IT-23	実行結果	P2	CSV出力の内容がヘッダー「ID,名称,並び順」で全行sort_no昇順である	管理者ログイン済／SEED-M03-ADMIN	—	1. 「CSV出力」を押下 2. ダウンロードファイルの中身を確認	1行目が「ID,名称,並び順」で、データ行が並び順(sort_no)昇順であること（SJIS・全件DB状態依存のため手動/間接）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-046	IT-23	実行結果	P2	CSV取込でファイル未選択/フォーム検証失敗時はエラーで取込画面へ戻る	管理者ログイン済／SEED-M03-ADMIN	ファイル未選択 または 不正形式	1. CSVアップロード画面で未選択のまま取込を実行	エラーフラッシュが表示され、master_csv_upload へ戻ること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-047	IT-23	実行結果	P2	CSV取込で行エラーがあると各行メッセージが表示される	管理者ログイン済／SEED-M03-ADMIN	行エラーを含むCSV	1. 行エラーを含むCSVを選択し取込を実行	各行のエラーメッセージが表示され、master_csv_upload へ戻ること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-048	IT-26	登録内容	P2	CSV取込が正常完了すると成功メッセージが表示される	管理者ログイン済／SEED-M03-ADMIN	形式妥当なCSV	1. 妥当なCSVを選択し取込を実行	「登録が完了しました。」が表示され、master_csv_upload へ戻ること（取込後DB反映は間接/手動）。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-049	IT-03	画面遷移	P3	互換POST(/product/shelf_number/import)でも取込処理が成立する	管理者ログイン済／SEED-M03-ADMIN	形式妥当なCSV	1. /product/shelf_number/import へ取込POST	master_import と同一の取込処理が実行され、master_csv_upload へ戻ること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-050	IT-25	送信可否制御	P2	表示件数セレクト変更でURLにpage_countが付き再読込される	管理者ログイン済／SEED-M03-ADMIN	表示件数＝50	"1. /admin/product/shelf_number を開く
2. 表示件数セレクトを50に変更"	URLに page_count=50 が付与され、同一画面構成が再描画されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-051	IT-03	画面遷移	P2	一覧ページリンクで指定ページの一覧が表示される	管理者ログイン済／SEED-M03-21-PAGES（2ページ以上の件数）	—	"1. /admin/product/shelf_number を開く
2. ページリンク（/page/{page_no}）を押下"	指定ページの一覧が返り、セッションのページ番号が更新されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-052	IT-23	実行結果	P2	一覧が並び順(sort_no)昇順で表示される	管理者ログイン済／SEED-M03-ADMIN（2件以上）	—	"1. /admin/product/shelf_number を開く
2. 並び順列の値を上から確認する"	一覧の並び順列が昇順で表示されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-053	IT-25	UI部品	P2	表示件数セレクトの選択肢が仕様の9値(10/50/100/300/500/1000/2000/10000/12000)である	管理者ログイン済／SEED-M03-ADMIN	—	1. /admin/product/shelf_number を開く 2. 表示件数セレクトの選択肢を確認	選択肢が 10,50,100,300,500,1000,2000,10000,12000 のみであること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-054	IT-03	画面遷移	P3	編集時のページリンク(/{id}/page/{page_no})で編集idを保持したまま指定ページが表示される	管理者ログイン済／SEED-M03-21-ROW＋SEED-M03-21-PAGES（2ページ以上）	—	1. /admin/product/shelf_number/{id} を開く 2. ページリンク(/{id}/page/{page_no})を押下	編集中のid を保持したまま指定ページの一覧が返り、セッションのページ番号が更新されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-060	IT-13	URL直接アクセス	P1	未ログインで棚番号画面URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/shelf_number へ直接アクセス	管理ログイン画面へ誘導されること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-061	IT-25	HTTPステータス	P2	存在しないidの編集URLはHTTP404になる	管理者ログイン済／SEED-M03-ADMIN	id＝999999999（不存在）	1. /admin/product/shelf_number/999999999 を開く	HTTPステータス404が返ること。				
m03-21_admin_product_product_shelf_number_register_edit（商品管理 — 棚番号登録/編集）	E2E-M03-21-062	IT-25	HTTPステータス	P3	存在しないidの削除(DELETE)はマスタ行が解決されず404になる	管理者ログイン済／SEED-M03-ADMIN	id＝999999999（不存在）＋有効トークン	1. /admin/product/shelf_number/999999999/delete へDELETE送信	HTTPステータス404が返ること（削除フローのマスタ行未解決・設計書 削除#2）。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の既定 block prefix=`shelf_number`（`ShelfNumberType` に getBlockPrefix 上書きなし）から導出（`name`→`#shelf_number_name`、`sortNo`→`#shelf_number_sortNo`、`_token`→`#shelf_number__token`）。上部フォーム要素の id は Twig 上 `#form_storage_code`（文言流用・`shelf_number.twig:71`）。行番号は ec-cube-enterprise 現行ソース基準。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M03-21-001 | E2E自動化 | #shelf_number_name(shelf_number.twig:86) / #shelf_number_sortNo(:93) / button trans admin.common.registration「登録」(:180-182 / messages.ja.yaml:1436) / table.table(:115) | フロント挙動 表示要素・利用者視点の入口 |
| E2E-M03-21-002 | E2E自動化 | .card-title(shelf_number.twig:79 admin.common.registration__add「新規追加」/ messages.ja.yaml:1438) | フロント挙動（新規時カード見出し） |
| E2E-M03-21-003 | E2E自動化 | title block(shelf_number.twig:5 admin.product.product_management「商品管理」:1723) / sub_title(:6 admin.product.shelf_number_management「棚番号登録/編集」:3754) | フロント挙動 表示要素（タイトル/サブタイトル） |
| E2E-M03-21-004 | E2E自動化 | th admin.common.id(:118) / admin.setting.shop.trade_law.header.name(:119「名称」:2874) / admin.product.format.format_rank(:120「並び順」:4002) / .js-page-count(:105) | フロント挙動 表示要素（一覧/表示件数） |
| E2E-M03-21-005 | E2E自動化 | link admin.product.csv.export「CSV出力」(:61-63 / messages.ja.yaml:2149) / link admin.product.csv.import「CSV入力」(:64-66 / messages.ja.yaml:2148) | フロント挙動 表示要素（CSV導線） |
| E2E-M03-21-006 | E2E自動化(要シード) | .card-title(:79 admin.common.edit「編集」:1439) / link admin.common.back_to_new_registration「新規登録へ戻る」(:57-59 / messages.ja.yaml:1455) | フロント挙動（編集時のみ）・利用者視点の入口 |
| E2E-M03-21-007 | E2E自動化(要シード) | #shelf_number_name / #shelf_number_sortNo の inputValue ＋ table.table | 処理フロー 表示#2（解決された行をフォームに載せる） |
| E2E-M03-21-008 | E2E自動化(要シード) | link「新規登録へ戻る」(:57-59) / リダイレクト先URL / .card-title | 利用者視点の入口（編集時「新規登録へ戻る」→新規モード・保存しない） |
| E2E-M03-21-010 | E2E自動化(要使い捨て名) | #shelf_number_name / #shelf_number_sortNo / button「登録」 / .alert-success | 判定順序#3＋画面遷移（成功→admin.register.complete＋一覧へリダイレクト Controller.php:147-149） |
| E2E-M03-21-011 | E2E自動化(要使い捨て名・破壊的) | リダイレクト先URL(/product/shelf_number) | 画面遷移（POST成功→GET admin_product_shelf_number Controller.php:149） |
| E2E-M03-21-012 | E2E自動化/間接(要使い捨て名・破壊的) | table.table contains 名称 | DB操作（persist/flush即時反映 Controller.php:139-140） |
| E2E-M03-21-013 | E2E自動化(要使い捨てシード・破壊的UPDATE) | #shelf_number_sortNo / button「登録」 / .alert-success | 判定順序#3（更新成功・admin.register.complete） |
| E2E-M03-21-020 | E2E自動化 | .alert-danger(admin.register.failed「登録できませんでした。」:1774) / URL=store | 判定順序#1＋エラー処理（検証失敗→失敗フラッシュ＋同テンプレート200再描画 Controller.php:124-134） |
| E2E-M03-21-021 | E2E自動化 | form_errors(form.name)(shelf_number.twig:87 出力クラス要実機・本文テキストで確認) Regexメッセージ(ShelfNumberType.php:42) | 業務ルール 名称形式 ^[A-Z][-][0-9]{3}$／バリデーション（Regexメッセージはフォーム種別にハードコード） |
| E2E-M03-21-022 | E2E自動化 | .alert-danger(:1774) / URL=store | バリデーション（並び順 必須 ShelfNumberType.php:49-51）→判定順序#1 |
| E2E-M03-21-024 | E2E自動化(要既存名シード) | .alert-danger(admin.error.non_unique「値が重複しています。」:1777) / リダイレクト先URL | 判定順序#2（一意制約違反→non_unique＋一覧へリダイレクト Controller.php:141-144） |
| E2E-M03-21-030 | E2E自動化 | a[data-method=delete](shelf_number.twig:143) data-message=admin.common.delete_modal__message(:1593) | モーダル・ポップアップ（削除アンカーの確認属性） |
| E2E-M03-21-031 | E2E自動化(要使い捨てシード＋確認ダイアログ) | a[data-method=delete] / .alert-success(admin.common.delete_complete「削除しました」:1400) | 削除 判定順序#4（参照なし→remove/flush・delete_complete Controller.php:178-182） |
| E2E-M03-21-032 | E2E自動化(要参照シード＋確認ダイアログ) | a[data-method=delete] / .alert-danger(admin.shelf_number.delete.failed:1781) | 削除 判定順序#3（参照あり→削除せずfailed Controller.php:169-176） |
| E2E-M03-21-040 | E2E自動化(内容は手動) | link「CSV出力」(:61-63) / download.suggestedFilename | CSVエクスポート（ストリーム出力・ファイル名 shelf_number_YmdHis.csv Controller.php:223-226） |
| E2E-M03-21-041 | E2E自動化 | link「CSV入力」(:64-66) / リダイレクト先URL(master_csv_upload) | 利用者視点の入口（CSV取込画面へ遷移 Controller.php:247） |
| E2E-M03-21-042 | E2E自動化 | URL /product/shelf_number/csv | 利用者視点の入口（/csv は同一画面・後方互換 Controller.php:248） |
| E2E-M03-21-043 | 手動(要大規模CSV生成) | .alert-danger(admin.csv.error.upload.maxrecord:1429) | CSV取込（ADMIN_CSV_IMPORT_MAX_ROWS=5010以上で上限メッセージ Controller.php:295-302） |
| E2E-M03-21-050 | E2E自動化 | .js-page-count(:105) / URLに page_count | フロント挙動 JS（page_count付与再読込 :38-43）＋処理フロー#4 |
| E2E-M03-21-051 | E2E自動化(要複数ページシード) | pager(:155-165) / URL /page/{page_no} | 利用者視点の入口／処理フロー#3（page_noセッション更新） |
| E2E-M03-21-052 | E2E自動化(要2件以上) | table.table tbody tr td:nth(2)（並び順列 :134-136） | 集計条件/業務ルール（一覧 sort_no 昇順 Controller.php:193） |
| E2E-M03-21-060 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id | 権限・認可（未到達主体は共通認証で拒否） |
| E2E-M03-21-061 | E2E自動化 | HTTPステータス404 | エラー処理（存在しない編集id→404 処理フロー 表示#2） |
| E2E-M03-21-014 | E2E自動化(要使い捨てシード・破壊的UPDATE)→fixme | #shelf_number_sortNo inputValue / table.table contains 変更値 | DB操作（更新 persist/flush即時反映 Controller.php:139-140／設計書 :200） |
| E2E-M03-21-023 | E2E自動化(要シード行・非破壊) | #shelf_number_name / button「登録」 / .alert-danger(:1774) / URL=store/{id} | 判定順序#1（編集 /store/{id} でも検証失敗→failed＋同テンプレート再描画 Controller.php:124-134／設計書 登録更新#2-3） |
| E2E-M03-21-044 | E2E自動化(直接URL・DL発火／導線露出は要実機確認) | URL /product/shelf_number/master_csv_template / download発火 | 利用者視点の入口（雛形DL 設計書 :47 / ルート :311 admin_product_shelf_number_master_csv_template）。内容はヘッダのみ＝手動 |
| E2E-M03-21-045 | 手動/間接(SJIS・全件DB依存) | download.path() からの本文パース（1行目=ID,名称,並び順 / sort_no昇順） | CSVエクスポート（ヘッダー`ID,名称,並び順`・全件sort_no昇順 設計書 :95 / Controller.php:223-226） |
| E2E-M03-21-046 | 手動(要CSVアップロード) | .alert-danger / URL=master_csv_upload | CSV取込（未選択/フォーム検証失敗→エラー戻し 設計書 :101 / Controller.php:269-302） |
| E2E-M03-21-047 | 手動(要CSVアップロード) | 行メッセージ / URL=master_csv_upload | CSV取込（行エラー→各行メッセージ 設計書 :102 / ShelfNumberMasterImportHandler） |
| E2E-M03-21-048 | 手動(要CSVアップロード) | .alert-success(admin.register.complete:1773) / URL=master_csv_upload | CSV取込（成功完了→admin.register.complete 設計書 :102-103） |
| E2E-M03-21-049 | 手動(要CSVアップロード) | URL /product/shelf_number/import → master_csv_upload | 利用者視点の入口（互換POST /import は master_import と同一取込 設計書 :50 / ルート :315） |
| E2E-M03-21-053 | E2E自動化 | .js-page-count option values [10,50,100,300,500,1000,2000,10000,12000]（shelf_number.twig:105） | フロント挙動 表示要素（表示件数の選択肢 設計書 入口 :42） |
| E2E-M03-21-054 | E2E自動化(要複数ページ＋編集行シード)→fixme | pager(:155-165) / URL /{id}/page/{page_no} | 利用者視点の入口（編集時ページリンク・id保持 設計書 :41 / ルート admin_product_shelf_number_edit_page :304） |
| E2E-M03-21-062 | 手動(要DELETE改竄送信＋有効トークン) | HTTPステータス404 | エラー処理（削除フローのマスタ行未解決→404 設計書 削除#2 :88 / Controller.php:165） |

注: 既存IT cases（接頭辞 `IT-M03-21-ADMIN-PRODUCT-PRODUCT-SHELF-NUMBER-REGISTER-EDIT-NNN`）は観点名のみの定型自動生成スタブであり、操作手順が汎用文。本E2Eは設計書本文（処理フロー・判定順序・表示メッセージ・業務ルール）を一次情報源として網羅した。行単位の対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_21_..._it_cases.md` の関連ID件数（IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=22／IT-26=10＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は **付帯表2b（行単位明細・全90行）** が正本で、本表はその集計である。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-15 | 4 | 3 | 1 | 0 | 登録/削除のCSRF不正トークン拒否は共通実装・改竄送信が必要＝手動 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止（CSV取込ログの秘匿対象）＝ブラウザ観測外 |
| IT-25 | 9 | 9 | 0 | 0 | UI部品・遷移・HTTPステータスはすべて観測可能 |
| IT-03 | 7 | 4 | 2 | 1 | 同時送信レース・CSV取込後DB値は手動／規格側内部再割当は観測外 |
| IT-13 | 1 | 1 | 0 | 0 | |
| IT-22 | 35 | 10 | 5 | 20 | 名称は形式固定(X-NNN)で長さ/部分入力の細目は非該当、並び順の非整数はサーバ側IntegerType検証だがUIを介さず直接送信が必要＝手動、相関ルール無し |
| IT-23 | 22 | 5 | 2 | 15 | 本機能はDB検索を行わない（一覧は sort_no 昇順分割のみ）。CSV内容は手動 |
| IT-26 | 10 | 7 | 2 | 1 | 同時送信・CSV取込後DB値は手動／規格側再割当は観測外 |
| 合計 | 90 | 39 | 12 | 39 | **未分類 0** |

注1: 対象外39件はいずれも「ブラウザで観測不能」「本機能で非該当（名称形式固定・検索なし・相関なし）」「内部処理/別系統」が理由であり、放置ではない。

注2(自動化の実装状況): 「E2E自動化」が指す対応E2EケースIDのうち、テストID `011/012/013/014/031/032/043/051/054` は破壊的INSERT/UPDATE・破壊的DELETE（共通JSの確認ダイアログ依存）・要使い捨てシード・要大規模CSV生成・要複数ページシードのため spec 上は `test.fixme`（未実行・自動化保留）である。`044`（雛形DL）は直接URLでDL発火を観測でき自動化可能だが画面導線の露出が要実機確認である。残りの観点（060,001-005,061,050,052,053,040,041,042,020,021,022,023,010,024,030,006,007,008 に対応）は spec 実装済。CSV取込POSTの分岐（045 手動/間接・046/047/048/049 手動）と削除404（062 手動）は実CSVアップロード／DELETE改竄送信を要し spec には残さずケース表で全量管理する。本表の「E2E自動化」は「ブラウザ観測でE2E自動化可能」を意味し、実装済か保留(fixme)か手動かは付帯表1のE2E可否注記と spec の `test.fixme` で監査する。

注3(手動/間接 12件の内訳): 014,015,077,078,083,084（既出6件：同時送信レース・CSV取込後DB値・CSV出力内容）＋001（CSRF不正トークン拒否）＋033,034,036,038,039（並び順 非整数のサーバ側検証）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

各行の観点を本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 手動/間接 | 登録/更新はSymfony Formの既定トークン、削除は共通 isTokenValid（設計書 :87,:124,:210-211,:251）。正常トークンは画面操作で自動付与され正常系(010等)が暗黙にカバー。不正/欠落トークンでの拒否は改竄リクエスト送信を要し共通認証層の挙動＝手動 |
| 002 | IT-15 | 未認証 | E2E自動化 | 060（未認証→ログイン誘導） |
| 003 | IT-15 | 対象データ | E2E自動化 | 006/007（編集対象行のバインド） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止（秘匿対象）はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | E2E自動化 | 050（表示件数のセッション状態変化） |
| 007 | IT-25 | UI部品 | E2E自動化 | 030（一覧の削除導線） |
| 008 | IT-25 | UI部品 | E2E自動化 | 005（CSV出力リンク） |
| 009 | IT-25 | 操作起点 | E2E自動化 | 041（CSV取込画面へ遷移） |
| 010 | IT-25 | 確認ダイアログ | E2E自動化 | 042（後方互換URL同一画面） |
| 011 | IT-25 | 確認ダイアログ | E2E自動化 | 003（タイトル/サブタイトル表示） |
| 012 | IT-25 | 確認ダイアログ | E2E自動化 | 030（削除確認属性） |
| 013 | IT-25 | 送信可否制御 | E2E自動化 | 052（一覧総件数 sort_no昇順分割） |
| 014 | IT-03 | 外部画面 | 手動/間接 | 二名同時送信の一意制約レース（単一送信は024でE2E。レースは手動） |
| 015 | IT-03 | 画面遷移 | 手動/間接 | CSV取込で規則外名称が保存され得る＝取込後DB値（手動） |
| 016 | IT-03 | 画面遷移 | E2E自動化 | 032（削除時参照あり→削除拒否） |
| 017 | IT-03 | 画面遷移 | 対象外 | マスタ更新/削除で規格側の自動再割当をしない＝規格側内部・観測外 |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 006/051（GETのid/page_no） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 011/040（成功時 リダイレクト/CSV応答） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 012（登録/更新で直接保存＝一覧反映 間接） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 060/061（直接アクセス・到達/404） |
| 022 | IT-25 | HTTPステータス | E2E自動化 | 011（POST成功→一覧遷移） |
| 023 | IT-25 | URL | E2E自動化 | 020（POST失敗→同URL再描画） |
| 024 | IT-22 | 必須バリデーション | E2E自動化 | 020（名称未入力→失敗） |
| 025 | IT-22 | 必須バリデーション | E2E自動化 | 010（必須充足→正常継続） |
| 026 | IT-22 | 文字列長バリデーション | 対象外 | 名称は形式固定(X-NNN・5文字)でフォーム長制約なし＝最大長観点 非該当 |
| 027 | IT-22 | 文字列長バリデーション | 対象外 | 同上（最大長+1 非該当） |
| 028 | IT-22 | 文字列長バリデーション | 対象外 | 同上（最小長 非該当） |
| 029 | IT-22 | 文字列長バリデーション | E2E自動化 | 021（短い文字列＝形式不正→Regexエラー） |
| 030 | IT-22 | 文字列長バリデーション | 対象外 | 同上（継続側・形式固定で長さ観点 非該当） |
| 031 | IT-22 | 文字列長バリデーション | 対象外 | CSV出力＝長さ観点 非該当 |
| 032 | IT-22 | 数値バリデーション | E2E自動化 | 010（並び順 整数 正常） |
| 033 | IT-22 | 数値バリデーション | 手動/間接 | 並び順は仕様上 整数(IntegerType・設計書 :136,:145,:209)。非整数値のサーバ側拒否はブラウザUIを介さない直接リクエストを要する＝手動 |
| 034 | IT-22 | 数値バリデーション | 手動/間接 | 同上（非整数のサーバ側検証＝直接リクエスト・手動） |
| 035 | IT-22 | 数値バリデーション | 対象外 | 整数正常継続は010で代表（重複観点） |
| 036 | IT-22 | 数値バリデーション | 手動/間接 | 同上（非整数のサーバ側検証＝直接リクエスト・手動） |
| 037 | IT-22 | 数値バリデーション | 対象外 | 整数正常継続は010で代表（重複観点） |
| 038 | IT-22 | 数値バリデーション | 手動/間接 | 同上（非整数のサーバ側検証＝直接リクエスト・手動） |
| 039 | IT-22 | 数値バリデーション | 手動/間接 | 同上（非整数のサーバ側検証＝直接リクエスト・手動） |
| 040 | IT-22 | 文字種バリデーション | E2E自動化 | 010（大文字＋数字の妥当形式） |
| 041 | IT-22 | 文字種バリデーション | E2E自動化 | 021（小文字等 形式不正→Regexエラー） |
| 042 | IT-22 | その他のバリデーション | 対象外 | 本機能に該当する細目なし（名称=Regex・並び順=整数のみ） |
| 043 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 044 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 045 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 046 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 047 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 048 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 049 | IT-22 | その他のバリデーション | 対象外 | 同上 |
| 050 | IT-22 | その他のバリデーション | E2E自動化 | 051（ページ送りでセッションのページ番号更新） |
| 051 | IT-22 | 相関バリデーション | 対象外 | 本機能に項目間相関ルールなし |
| 052 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 053 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 054 | IT-22 | 相関バリデーション | 対象外 | 同上 |
| 055 | IT-22 | DBとの相関バリデーション | E2E自動化 | 010（一意名で正常登録＝該当値継続） |
| 056 | IT-22 | DBとの相関バリデーション | E2E自動化 | 024（既存名→一意制約違反） |
| 057 | IT-22 | 必須制御 | E2E自動化 | 020/022（名称・並び順 必須） |
| 058 | IT-22 | 部分入力 | 対象外 | 名称は形式固定・並び順は整数で部分入力観点 非該当 |
| 059 | IT-23 | 検索条件 | 対象外 | 本機能はDB検索を行わない（一覧は sort_no 昇順分割のみ・検索フォーム無し） |
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
| 072 | IT-23 | 検索条件 | E2E自動化 | 008（新規モードに戻る） |
| 073 | IT-23 | 検索条件 | 対象外 | 本機能はDB検索を行わない |
| 074 | IT-23 | 検索条件 | 対象外 | 同上 |
| 075 | IT-23 | 実行結果 | E2E自動化 | 012（登録後の一覧反映） |
| 076 | IT-23 | 実行結果 | E2E自動化 | 031（参照なし削除→削除成功） |
| 077 | IT-23 | 実行結果 | 手動/間接 | CSV出力内容の検証＝手動 |
| 078 | IT-23 | 実行結果 | 手動/間接 | CSV取込後のDB反映＝手動/間接 |
| 079 | IT-23 | 実行結果 | E2E自動化 | 042（後方互換取込画面表示） |
| 080 | IT-26 | 登録内容 | E2E自動化 | 012（対象レコード追加＝一覧反映 間接） |
| 081 | IT-26 | 登録内容 | E2E自動化 | 020（検証失敗で追加されない） |
| 082 | IT-26 | 登録内容 | E2E自動化 | 010（登録成功） |
| 083 | IT-26 | 登録内容 | 手動/間接 | 二名同時送信の一意制約レース＝手動 |
| 084 | IT-26 | 登録内容 | 手動/間接 | CSV取込で規則外名称が保存され得る＝取込後DB値 手動 |
| 085 | IT-23 | 登録内容 | E2E自動化 | 032（削除時参照あり→削除しない） |
| 086 | IT-26 | 登録内容 | 対象外 | 規格側の自動再割当をしない＝規格側内部・観測外 |
| 087 | IT-26 | 登録内容 | E2E自動化 | 006（GETのid/page_no＝編集表示） |
| 088 | IT-26 | 登録内容 | E2E自動化 | 011/040（成功時 リダイレクト/CSV応答） |
| 089 | IT-26 | 登録内容 | E2E自動化 | 012（直接保存＝一覧反映 間接） |
| 090 | IT-26 | 登録内容 | E2E自動化 | 060/061（運用者到達・到達不能時の挙動） |

集計（付帯表2と一致）: E2E自動化 39／手動・間接 12（001,014,015,033,034,036,038,039,077,078,083,084）／対象外 39。**未分類 0**。

注A(区分の根拠＝行の挙動本文): 既存IT cases は観点ラベル（例 IT行010/011/012 の「確認ダイアログ」）と前提条件・期待結果本文が一致しない定型自動生成スタブである（前掲注のとおり）。本表の区分・対応E2Eは**当該行の期待結果本文（観測対象の挙動）**で決めており、ラベル名では決めていない。例: IT行010 本文＝後方互換URL同一画面表示→042、IT行011 本文＝タイトル/サブタイトル表示→003、IT行050 本文＝ページ送りセッション更新→051、IT行072 本文＝新規モードに戻る→008。これらはラベル（確認ダイアログ/その他のバリデーション/検索条件）と乖離するが、観測挙動は写像先のE2Eで網羅されるため区分は妥当。

注B(本監査での増補): 母集合90行は固定。本監査で追記したE2Eケース（014/023/044/045/046/047/048/049/053/054/062）は、既存の手動/間接行（015→047, 077→045, 078→046/048, 084→047/048）および設計書の未写像分岐（編集モード検証失敗・雛形DL・CSV取込POST各分岐・表示件数選択肢・編集時ページリンク・削除404）へ挙動を補強するもので、行単位の区分（E2E自動化/手動/対象外）の集計値は変えない（細目の追加であり母集合の再分類ではない）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-ADMIN | dtb_member(管理者) | 当ルートへ到達できる有効な管理者1（ID/PWは config 既定）。一覧に1件以上の棚番号 | fixture(config既定) | 既存利用・撤去不要 | 001-005,020,021,022,030,040,041,042,050,052,061 |
| SEED-M03-21-ROW | dtb_shelf_number / 既存ID=`SHELF_ID` | 形式妥当名(例 A-001)・並び順設定済の参照用棚番号1（編集表示・非破壊） | fixture/migration | 専用ID・非破壊参照。013/014(更新)は使い捨て版を用いる。023(編集検証失敗)は非破壊参照。054は編集行＋複数ページ前提 | 006,007,008,013,014,023,054 |
| SEED-M03-21-NEW | dtb_shelf_number / 名称=`SHELF_NEW_NAME` | **未登録の形式妥当名**（^[A-Z][-][0-9]{3}$ 例 Z-999）。登録成功でINSERTされる | synthetic(env供給＋後始末削除) | **使い捨て・テスト後に当該nameを削除してべき等化**（名称空間が限定的なため一意名を予約） | 010,011,012 |
| SEED-M03-21-DUP | dtb_shelf_number / 名称=`SHELF_DUP_NAME` | **既に存在する形式妥当名**。一意制約違反の確認用（INSERTは失敗＝非破壊） | fixture/migration | 専用・非破壊（重複INSERTは失敗するため副作用なし） | 024 |
| SEED-M03-21-DELETABLE | dtb_shelf_number / 商品規格参照なし | 商品規格(dtb_product_class)から参照されない使い捨て棚番号1（削除成功で消費） | synthetic(使い捨て) | 使い捨て・テスト毎に再投入 | 031 |
| SEED-M03-21-LINKED | dtb_shelf_number ＋ dtb_product_class | 商品規格が当該棚番号を参照する状態（削除拒否の確認用・非破壊） | fixture/migration | 専用・非破壊 | 032 |
| SEED-M03-21-PAGES | dtb_shelf_number | 既定10件で2ページ以上になる件数の棚番号（ページ送り確認） | synthetic/fixture | 専用接頭辞で投入・撤去 | 051,054 |

注: 名称は仕様で ^[A-Z][-][0-9]{3}$ に固定され名称空間が 26×1000 と限定的かつ一意制約のため、登録成功は任意のタイムスタンプ名を使えず使い捨て名/既存名のシードを環境変数で受け渡す。`migration` を選ぶ場合は DB=ec-cube-enterprise 正典（reverse-design 1c）。共通ログインは `config/default.config.ts` を流用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

設計源は pf-eccube3 のリバース。刷新先 ec-cube-enterprise の実装との乖離・要確認点を列挙する。テストは仕様どおりに書き、実装が違えば落ちて検出する（期待値を実装へ書き換えない）。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 削除可否は「商品規格の参照有無」で判定（刷新先要件） | ShelfNumberController.php:169 `getProductClasses()->isEmpty()` | 設計書「現行は商品規格サブ(dtb_product_sub_class)、移行先は dtb_product_class で判定」。実装は ProductClasses＝移行先要件どおり。現行リバースとの差は移行仕様で吸収済 | 032 | 要確認(移行差・解消済) |
| 2 | 登録/更新の検証失敗は同テンプレートを200で再描画 | Controller.php:124-134 render（リダイレクトしない） | 兄弟機能(略称タグ m03-14)は失敗時に一覧トップへリダイレクトする実装だが、棚番号は store で再描画＝挙動が異なる。期待は設計書「同テンプレートを200で返す」由来 | 020,021,022 | 要確認(挙動差・仕様準拠) |
| 3 | 名称フィールドの形式エラー表示位置 | form_errors(form.name)(shelf_number.twig:87) bootstrap_4_horizontal_layout | エラー出力クラス(.invalid-feedback 等)は要実機確認。期待文言は ShelfNumberType.php:42 のハードコード由来で確定。本文テキストで確認 | 021 | 要確認(セレクタ) |
| 4 | 登録成功リダイレクトはクエリに id のみ付き編集画面は自動で開かない | Controller.php:149 redirectToRoute('admin_product_shelf_number', ['id'=>...]) ／ 一覧ルートにパス{id}なし | 設計書「生成URLにクエリ?id=が付くが一覧から開き直す必要が生じ得る」。利用者影響の要確認（テストは一覧へリダイレクトのみ観測） | 010,011 | 要確認(UX) |
| 5 | 「CSV入力」リンク文言 | messages.ja.yaml:2148 admin.product.csv.import=「CSV入力」 | 設計書/IT cases は「CSV取込」と記すが trans 確定値は「CSV入力」。セレクタ文言は実装確定値（位置情報）を使い、観点の意味は CSV取込導線で同一 | 005,041 | 要確認(文言差) |
| 6 | 並び順の上下限・符号 | ShelfNumberType.php:46-52 IntegerType＋NotBlank のみ（Range/符号制約なし） | 設計書「フォーム種別に上下限・符号なし検証が無く、DB符号なし定義と整合させる運用」。非整数のサーバ側拒否(IntegerType)はUIを介さない直接送信で観測＝手動 | 022,033-039(手動/対象外) | 要確認(制約欠如・運用依存) |
| 7 | CSV取込ハンドラに名称Regex検証が無い | ShelfNumberMasterImportHandler（画面同等のRegexなし） | 設計書「規則外名称がCSV経由で保存され得る＝画面再編集でRegexに弾かれる可能性」。取込後DB値は手動確認 | 015,084(手動) | 要確認(整合性) |
| 8 | CSV取込POST(master_import/import)の未選択/フォーム検証失敗/行エラー/成功完了 | Controller.php:234- ＋ ShelfNumberMasterImportHandler | 本機能スコープ内だが実CSVアップロードを要し E2E自動化は行数上限(043 fixme)に限定。①未選択/検証失敗・③行エラー・④成功完了は手動/将来fixme。設計書 :98-106 の各分岐を付帯表5 CSV取込行で部分カバーと明示（過剰なカバー宣言を是正） | 043(fixme),078,084(手動) | 要確認(自動化範囲) |
| 9 | 雛形DL(master_csv_template)リンクの画面露出 | shelf_number.twig（CSV出力/CSV入力リンクは確認・雛形DLリンクは未確認） | 設計書 入口 :47 / ルート :311 に雛形DLは存在するが、shelf_number.twig 上に雛形DL導線が出るか未確認。露出すれば040同型でE2E可、出なければ別画面/別導線＝手動 | （雛形DL・対応E2E未割当） | 要確認(導線露出) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

設計書の各節を歩き、テスト可能な挙動が E2Eケースへ写像されていることを照合する。設計書にあって観点表に無い挙動も拾う。

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（ナビ→一覧） | 新規フォーム＋一覧表示 | 001,002,003,004,005 | カバー |
| 利用者視点の入口（編集URL） | 当該行をフォームに載せる | 006,007 | カバー |
| 利用者視点の入口（新規登録へ戻る） | 新規モードへ・保存しない | 008 | カバー |
| 利用者視点の入口（ページリンク・新規時 /page/{page_no}） | 指定ページ一覧・セッション更新 | 051 | 部分カバー(051 fixme・要複数ページ) |
| 利用者視点の入口（ページリンク・編集時 /{id}/page/{page_no}） | 編集id保持で指定ページ一覧・セッション更新（設計書 :41） | 054 | 部分カバー(054 fixme・要複数ページ＋編集行シード) |
| 利用者視点の入口（表示件数） | page_count付与で再描画 | 050 | カバー |
| 利用者視点の入口（CSV出力/取込/後方互換） | CSVダウンロード発火・取込画面遷移・/csv後方互換 | 040,041,042 | カバー |
| 利用者視点の入口（雛形DL admin_product_shelf_number_master_csv_template） | ヘッダー雛形CSVのダウンロード発火（設計書 入口 :47 / ルート :311） | 044 | 部分カバー 044は直接URL `/master_csv_template` でDL発火を観測しE2E自動化可（spec実装）。画面導線(shelf_number.twig)の露出は要実機確認。内容（ヘッダのみ）は手動 |
| フロント挙動 表示要素 | タイトル/サブタイトル・名称/並び順欄・一覧列・CSVボタン | 001,003,004,005 | カバー |
| フロント挙動 表示要素（表示件数の選択肢） | 表示件数セレクトの選択肢が 10,50,100,300,500,1000,2000,10000,12000（設計書 入口 :42） | 053 | カバー |
| フロント挙動 JS（page-count） | page_count付与location置換 | 050 | カバー |
| モーダル・ポップアップ | 削除アンカー data-method=delete・確認属性 | 030 | カバー（確認後DELETEは031/032 fixme） |
| 処理フロー 表示（GET） | 空インスタンス/行解決・不存在404・ページ/件数セッション | 001,006,061,050 | カバー |
| 処理フロー 登録更新（POST） | 検証失敗→failed再描画・成功→complete＋リダイレクト | 020,022,010,011 | カバー |
| 処理フロー 削除（DELETE） | 参照あり→failed・参照なし→delete_complete・不存在id→404 | 032,031,062 | 部分カバー 031/032はspec `test.fixme`（破壊的/確認ダイアログ依存＝実体未実行）。不存在id404(062)はDELETE改竄送信を要し手動。属性確認(030)のみ実装済 |
| 処理フロー CSVエクスポート（発火・ファイル名） | ダウンロード発火・ファイル名 shelf_number_YmdHis.csv（設計書 :96） | 040 | カバー |
| 処理フロー CSVエクスポート（内容） | ヘッダー`ID,名称,並び順`・行のsort_no昇順（設計書 :95） | 045 | 部分カバー(手動/間接) download.path() からの本文パースで自動化も可能だが、SJIS想定かつ全件DB状態（シード非決定）に依存するため手動/間接（040の期待結果はファイル名まで＝内容は045に分離） |
| 処理フロー CSV取込（POST master_import/import 設計書 :98-106） | ①未選択/フォーム検証失敗→エラー戻し ②行数上限(5010)超→件数上限メッセージ戻し ③行エラー→各行メッセージ ④成功→admin.register.complete／いずれも master_csv_upload へリダイレクト | 043（行数上限）／046（未選択/検証失敗）／047（行エラー）／048（成功完了）／049（互換POST /import） | 部分カバー(要確認) 行数上限②は043(fixme/要大規模CSV)。①未選択/検証失敗(046)・③行エラー(047)・④成功完了(048)・互換POST /import(049) は実CSVファイルのアップロードを要し手動（取込後DBは手動/間接 078/084）。各分岐をケース化（過剰なカバー宣言は是正済）。本機能スコープ内（商品コード×棚番号IDの更新CSVは別機能 ProductShelfNumberCsvController＝対象外） |
| 登録・更新時の判定順序 #1 検証（新規 /store） | 失敗→admin.register.failed＋再描画 | 020,021,022 | カバー |
| 登録・更新時の判定順序 #1 検証（編集 /store/{id}） | 編集モードでも失敗→admin.register.failed＋再描画・更新確定しない（設計書 登録更新#2-3 :80-81） | 023 | カバー(非破壊・spec実装済) |
| 登録・更新時の判定順序 #2 一意制約 | 違反→admin.error.non_unique＋一覧リダイレクト | 024 | カバー |
| 登録・更新時の判定順序 #3 成功（登録） | complete＋一覧リダイレクト | 010,011 | カバー(010実装済・011 fixme) |
| 登録・更新時の判定順序 #3 成功（更新） | complete＋一覧リダイレクト・変更値反映 | 013,014 | 部分カバー(013/014ともspec `test.fixme`＝破壊的UPDATE。013は成功フラッシュ・014は更新後反映の間接確認。実体未実行) |
| 業務ルール 一覧の並び | sort_no 昇順 | 052 | カバー |
| 業務ルール 名称の形式 | Regex ^[A-Z][-][0-9]{3}$・メッセージ | 021,010 | カバー |
| 業務ルール 並び順 | 整数入力（上下限なし） | 022 | カバー(必須のみ・範囲は不具合候補#6) |
| 入力項目（名称/並び順 必須） | 必須バリデーション | 020,022 | カバー |
| エッジケース 同時送信→一意制約 | レースで一方捕捉 | （単一送信024で代表） | 手動(レースは間接=014/083) |
| エッジケース CSV規則外名称保存 | 取込で保存され得る | （取込後DB値） | 手動/間接(015/084) |
| エッジケース 削除参照あり | DB削除しない | 032 | カバー(fixme) |
| エッジケース 成功後クエリid | 編集自動で開かない | 011 | カバー(リダイレクトのみ観測・不具合候補#4) |
| データ整合性（規格再割当しない） | マスタ更新で規格側自動再割当なし | （規格側内部） | 対象外(観測外・017/086) |
| DB操作（登録 persist/flush） | 即時反映＝一覧反映 | 012 | カバー(間接・012 fixme＝破壊的INSERT) |
| DB操作（更新 persist/flush） | 即時反映＝変更値の一覧/再編集反映（設計書 :200） | 014 | 部分カバー(014 fixme＝破壊的UPDATE。更新後反映の間接確認は実体未実行) |
| 画面遷移 | ナビ→一覧・成功→一覧・失敗→同URL・DELETE→一覧 | 001,011,020,031 | カバー |
| 遷移時引き継ぐ状態（セッション） | ページ番号・件数の保持 | 050 | カバー |
| エラー処理 存在しない編集id（GET） | 404 | 061 | カバー |
| エラー処理 存在しない削除id（DELETE） | マスタ行未解決→404（設計書 削除#2 :88） | 062 | 部分カバー(手動・DELETE改竄送信を要す) |
| エラー処理 各エラー | failed/non_unique/delete.failed/行数上限/取込各分岐 | 020,024,032,043,046,047 | 部分カバー(020/024実装済・032/043 fixme・046/047 手動) |
| 試行制限 | 本機能では扱わない | （該当なし） | 対象外(仕様で無し) |
| ログ・監査（CSV取込ログ・秘匿） | 開始/異常/完了・秘匿対象 | （対象外＝観測外） | 対象外(理由付き・IT-20) |
| セッション（下書き非保存） | 失敗時POST直後の状態のみ | 020 | カバー(再描画で間接) |
| Cookie | 本機能特有のCookie操作なし | （該当なし） | 対象外(仕様で無し) |
| 排他制御・トランザクション | 楽観ロック/FOR UPDATE 用いない | （該当なし） | 対象外(観測外・汎用インポータ依存) |
| 権限・認可 | 未到達主体は共通認証で拒否 | 060 | カバー |
| CSRF（登録/更新 既定トークン・削除 isTokenValid 設計書 :87,:124,:210-211,:251） | 正常トークンで送信成立／不正・欠落トークンで拒否 | （正常系は010等が暗黙にカバー） | 手動（不正トークン拒否は改竄リクエストを要し共通実装層の挙動・付帯表2b 001） |

未カバーはいずれも理由（観測不能・本機能で仕様上扱わない・規格側内部・別ルート低価値・手動/間接・破壊的でfixme）を明記済み。判定順序#1〜#3は各分岐を行単位に分解しカバーした。
