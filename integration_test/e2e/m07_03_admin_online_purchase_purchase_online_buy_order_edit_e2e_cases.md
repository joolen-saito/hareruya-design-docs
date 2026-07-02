# m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集） E2Eテストケース

元設計(機能詳細HTML): `function_spec_html_preview/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.html`（正本 `functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m07_03_admin_online_purchase_purchase_online_buy_order_edit_it_cases.md`（母集合 計90観点行）

母集合の定義: 上流の観点表 `integration-test-viewpoints.md` は全機能共通のより広い観点集合であり、本機能向けに具体化（インスタンス化）した結果が既存IT cases の90観点行である。本E2Eの未分類0監査は「本機能に適用された90行」を母集合とする。上流観点表のうち本機能に非該当の観点（試行制限・Cookie発行等）は既存IT casesへ展開されず、`付帯表5`の設計書節マトリクスで「対象外(理由付き)」として監査する。**要確認**: 90行が上流観点表の本機能適用分を漏れなく具体化しているかは生成元スクリプト側の保証に依存する。

期待結果は画面表示・遷移・URL・HTTPステータス・別画面での間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・ec-cube-enterprise確認値）由来**とし、実装/POM由来の表示文言をオラクル化しない（設計書はpf-eccube3のリバースだが、DB・メッセージの確認値は刷新先ec-cube-enterprise=正典）。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

刷新先ec-cube-enterprise に当該画面は存在する（`Controller/Admin/Purchase/PurchaseController.php` edit:199 / update:352、Twig `Resource/template/admin/Purchase/detail.twig`、Form `Form/Type/Admin/Purchase/{PurchaseDetailType,BankAccountType,QualifiedInvoiceIssuerAccountType}.php`）。screenExists=true。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-15 | 未認証ガード（管理ログイン誘導）・対象データ表示・状態変化（一括売却=手動） |
| IT-20 | ログ出力抑止（パスワード・トークン・Cookie値）＝ブラウザ観測外 |
| IT-25 | UI部品・操作起点・HTTPステータス(404)・URL・確認ダイアログ/JS挙動 |
| IT-03 | 画面遷移（保存成功→同一詳細・一覧戻り）・外部画面（会員詳細）・相関エラー |
| IT-13 | URL直接アクセス（未ログイン誘導・存在しないid） |
| IT-22 | 必須/形式/相関/DB相関バリデーション（口座・メール・適格請求書・ステータス・実在庫） |
| IT-23 | DB検索（本機能はユーザー向け一覧検索を主題としない＝別機能へ委譲。保存後レコードは間接） |
| IT-26 | 登録内容（保存の永続化＝画面はフラッシュで観測、DB値は間接） |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-001	IT-25	UI部品	P1	買取詳細(編集GET)が表示され保存ボタン・一覧戻りが見える	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 管理者でログインする
2. /admin/purchase/{id}/edit を開く"	買取詳細が表示され、保存ボタン・一覧戻りリンクが表示されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-002	IT-25	UI部品	P2	フッタの保存・一括売却・手動メール・一覧戻りボタンが表示される	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. フッタ(変換エリア)を確認する"	保存・一括売却登録・手動メール通知・一覧戻りの各ボタン/リンクが表示されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-003	IT-25	操作起点	P2	買取情報ブロックに商品追加・査定編集・CSVボタンが表示される	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 買取情報ブロックを確認する"	商品追加・査定編集・CSVエクスポートの各ボタンが表示されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-005	IT-25	操作起点	P3	選んで買取の商品追加モーダルが開く	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 「商品追加」を押下"	商品検索モーダルが開き、検索ボタンが表示されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-006	IT-25	UI部品	P3	実在庫の商品検索モーダル(商品追加／実在庫情報登録)が開く	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 実在庫情報ブロックの「商品追加／実在庫情報登録」を押下"	実在庫用の商品検索モーダル(admin_search_product)が開くこと（起点セレクタは要実機確認）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-004	IT-25	確認ダイアログ	P3	まとめて買取アコーディオン初回展開でXHR行が生成される	ログイン済み管理者／SEED-M07-03-ORDER-BULK	bulk明細を持つ買取注文ID	"1. 買取詳細を開く
2. 「まとめて買取」アコーディオンを初めて開く"	XHR(admin_purchase_bulk_purchase_load)で取得した明細行がテーブルに挿入されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-010	IT-15	未認証	P1	未ログインで買取詳細URLへアクセスすると管理ログイン画面へ誘導	未ログイン	任意の買取注文URL	"1. 未ログインで /admin/purchase/1/edit へアクセス"	管理ログイン画面へ誘導されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-011	IT-25	HTTPステータス	P1	存在しないidの買取詳細GETは404	ログイン済み管理者	存在しない買取注文ID	"1. 存在しないidで /admin/purchase/{id}/edit を開く"	HTTP 404 が返ること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-012	IT-13	URL直接アクセス	P2	存在しないidのupdate POSTは404	ログイン済み管理者	存在しない買取注文ID	"1. 存在しないidへ /admin/purchase/{id}/update をPOST"	HTTP 404 が返ること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-013	IT-03	画面遷移	P2	一覧戻りリンクはネット買取一覧へ遷移する	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 一覧戻りリンクを押下"	ネット買取一覧(/admin/purchase/page/{page_no})へ遷移すること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-014	IT-25	確認ダイアログ	P2	査定編集ボタンで商品系入力の編集可否が切り替わる	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 「査定編集」を押下"	商品系入力(.product)の編集可否(readonly/pointer-events)が切り替わること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-015	IT-25	確認ダイアログ	P3	依頼者編集ボタンで会員系入力が切り替わる	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 依頼者情報の「編集」を押下"	会員系入力(.customer)のreadonly/疑似readonlyが切り替わること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-020	IT-26	登録内容	P1	正常保存で「登録が完了しました。」が表示される	ログイン済み管理者／SEED-M07-03-ORDER-SAVE（使い捨て）	全必須を満たす有効な編集値	"1. 買取詳細を開く
2. 妥当な値で保存ボタンを押下"	成功フラッシュ「登録が完了しました。」が表示されること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-021	IT-26	画面遷移	P1	正常保存後に同一買取詳細へリダイレクトする	ログイン済み管理者／SEED-M07-03-ORDER-SAVE（使い捨て）	全必須を満たす有効な編集値	"1. 買取詳細を開く
2. 妥当な値で保存ボタンを押下"	同一買取詳細(/admin/purchase/{id}/edit)へリダイレクトされること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-022	IT-22	必須バリデーション	P1	口座名義未入力で保存するとエラーで保存されない	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	口座名義＝空	"1. 買取詳細を開く
2. 口座名義を空にして保存"	エラーとなり成功メッセージが出ず、保存されないこと（200で詳細再表示）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-023	IT-22	その他のバリデーション	P2	E-mail形式不正で保存するとエラーで保存されない	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	E-mail＝不正形式	"1. 買取詳細を開く
2. E-mailを不正形式にして保存"	エラーとなり成功メッセージが出ず、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-024	IT-22	必須バリデーション	P2	適格請求書 事業者選択で登録番号未入力なら必須エラー	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	事業者状況＝事業者／登録番号＝空	"1. 買取詳細を開く
2. 事業者を選び登録番号を空にして保存"	必須エラーとなり成功メッセージが出ず、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-025	IT-22	文字列長バリデーション	P2	適格請求書 登録番号が14文字以外なら形式エラー	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	事業者状況＝事業者／登録番号＝14文字以外	"1. 買取詳細を開く
2. 登録番号に14文字以外を入力して保存"	形式エラーとなり成功メッセージが出ず、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-026	IT-22	必須バリデーション	P2	口座番号未入力で保存するとエラーで保存されない	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	口座番号＝空	"1. 買取詳細を開く
2. 口座番号を空にして保存"	エラーとなり成功メッセージが出ず、保存されないこと（200で詳細再表示）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-027	IT-22	その他のバリデーション	P3	適格請求書 事業者選択＋登録番号14文字英数字なら検証エラーが出ない（正常系）	ログイン済み管理者／SEED-M07-03-ORDER-SAVE（使い捨て）	事業者状況＝事業者／登録番号＝14文字英数字	"1. 買取詳細を開く
2. 事業者を選び登録番号に14文字英数字を入力して保存"	適格請求書の必須／形式エラーが出ないこと（024・025の正常対）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-030	IT-22	DBとの相関バリデーション	P1	入庫済みからのステータス変更は拒否される	ログイン済み管理者／SEED-M07-03-ORDER-STOCKED	入庫済み注文／別ステータスへ変更	"1. 入庫済みの買取詳細を開く
2. 買取状況を別ステータスへ変更して保存"	「入庫済みステータスは他のステータスに変更できません。」が表示され、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-031	IT-22	相関バリデーション	P1	実在庫編集不可ステータスで増減を入れるとエラー	ログイン済み管理者／SEED-M07-03-ORDER-NOSTOCKEDIT	実在庫編集不可ステータス／増減≠0	"1. 該当買取詳細を開く
2. 実在庫の増減に0以外を入れて保存"	「実在庫情報の登録は「査定内容承諾」〜「入庫待ち」のステータスの場合のみ可能です。」が表示され、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-032	IT-03	外部画面	P1	振込依頼済みへ遷移で身分証未登録だとエラー	ログイン済み管理者／SEED-M07-03-ORDER-TRANSFERREADY	身分証未登録／振込依頼済みへ変更	"1. 該当買取詳細を開く
2. 身分証未選択のまま買取状況を振込依頼済みへ変更して保存"	「買取依頼者の身分証明書が未登録です。」が表示され、保存されないこと。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-033	IT-22	文字列長バリデーション	P2	実在庫増減で数量が負になると保存失敗（ロールバック）	ログイン済み管理者／SEED-M07-03-ORDER-NEGSTOCK	既存数量を超える減算	"1. 該当買取詳細を開く
2. 既存数量を超える減算を入れて保存"	保存に失敗し、成功メッセージが出ないこと（例外でロールバック）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-034	IT-03	外部画面	P2	振込依頼済みへ遷移で高額時に会員本人確認未完了だとエラー	ログイン済み管理者／SEED-M07-03-ORDER-TRANSFERHIGH	高額査定／本人確認未完了／振込依頼済みへ変更	"1. 該当買取詳細を開く
2. 買取状況を振込依頼済みへ変更して保存"	エラーとなり成功メッセージが出ず、保存されないこと（身分証032の本人確認分岐の対）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-040	IT-25	操作起点	P2	CSVエクスポートボタンでダウンロードが発火する	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. CSVエクスポートボタンを押下"	ダウンロードが発火すること（ファイル内容の検査は手動）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-042	IT-26	操作起点	P3	商品一覧CSV(type=sale)エクスポートでダウンロードが発火する	ログイン済み管理者／SEED-M07-03-ORDER-EDITABLE	編集可能な買取注文ID	"1. 買取詳細を開く
2. 商品一覧CSVエクスポートボタンを押下"	ダウンロードが発火すること（ファイル内容の検査は手動）。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-041	IT-15	状態変化	P2	一括売却登録ボタンで確認後に別ルートへ送信される	ログイン済み管理者／SEED-M07-03-ORDER-BULK（使い捨て）	bulk明細を持つ買取注文ID	"1. 買取詳細を開く
2. 「一括売却登録」を押下し確認ダイアログを承認"	別ルート(admin_purchase_bulk_detail_sell)へ送信され売却フラグ一括更新後に詳細へ戻ること。
m07-03_admin_online_purchase_purchase_online_buy_order_edit（ネット買取管理_買取情報編集）	E2E-M07-03-043	IT-13	URL直接アクセス	P3	個別入力商品の実在庫紐付け別ルートの不正IDは404	ログイン済み管理者	存在しない買取ID／個別入力商品ID	"1. 存在しないIDで /admin/purchase/{buyOrderId}/register-individual-stock/{individualProductId} をPOST"	HTTP 404 が返ること（別トークン経路・正常系の起点はモーダル内動的フォームで手動）。
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の getBlockPrefix 由来。`admin_purchase_detail`（PurchaseDetailType.php:440-442）／`admin_purchase_bank_account`（BankAccountType.php:95-97）／`admin_purchase_qualified_invoice_issuer_account`（QualifiedInvoiceIssuerAccountType.php:107-109）。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M07-03-001 | E2E自動化(要シード) | #save_btn(detail.twig:899 trans admin.common.save messages.ja.yaml:1434) / a.c-baseLink(detail.twig:882) | 利用者視点の入口(GET admin_purchase_edit)・フロント挙動(表示要素) |
| E2E-M07-03-002 | E2E自動化(要シード) | #save_btn(:899) / #sell_btn(:896) / #alert_no_assessment_send_mail(:892) / a.c-baseLink(:882) | フロント挙動(フッタ部品) |
| E2E-M07-03-003 | E2E自動化(要シード) | #add_product(:311) / #edit_appraisal_switch(:312) / #export_csv(:313) | フロント挙動(買取情報ブロック操作起点) |
| E2E-M07-03-005 | E2E自動化(要シード) | #add_product(:311 data-bs-target=#searchProductModal) / #searchProductModal(:909) / #searchProductModalButton(:933) | フロント挙動(選んで買取モーダル admin_purchase_search_product) |
| E2E-M07-03-004 | E2E自動化/未実装(fixme) | [data-bs-target="#bulkPurchaseCollapse"](:461) / #bulkPurchaseCollapse(:470) / #bulk_buy_main_cards_field_list(:486) | フロント挙動(XHR admin_purchase_bulk_purchase_load) ※挿入行セレクタ・タイミング要実機確認 |
| E2E-M07-03-010 | E2E自動化(資格情報不要) | 管理ログイン #login_id(login.twig) | 権限・認可(未ログインは管理ログインへ) |
| E2E-M07-03-011 | E2E自動化 | HTTPステータス404(PurchaseController.php:204-206 find→NotFound) | エラー処理(主キー不存在=404) |
| E2E-M07-03-012 | E2E自動化 | HTTPステータス404(PurchaseController.php:359-361) | エラー処理(主キー不存在=404・CSRF検査前) |
| E2E-M07-03-013 | E2E自動化(要シード) | a.c-baseLink href=admin_purchase_page(detail.twig:882) | 画面遷移(一覧戻り・セッションpage_no) |
| E2E-M07-03-014 | E2E自動化/未実装(fixme・観測点要実機) | #edit_appraisal_switch(:312) / .product 入力(:425,:429) | フロント挙動(査定編集トグルで編集可否切替) ※readonly/pointer-events観測点が未確定でオラクル不成立のためfixme |
| E2E-M07-03-015 | E2E自動化/未実装(fixme) | #edit_customer_switch(:728) / .customer 入力 | フロント挙動(依頼者編集トグル) ※観測点要実機確認 |
| E2E-M07-03-020 | E2E自動化/未実装(fixme・破壊的) | #save_btn(:899) / フラッシュ admin.register.complete(messages.ja.yaml:1773 / PurchaseController.php:438 addSuccess) | 処理フロー#8(成功フラッシュ) |
| E2E-M07-03-021 | E2E自動化/未実装(fixme・破壊的) | リダイレクト先URL admin_purchase_edit(PurchaseController.php:439) | 処理フロー#9(同一詳細へリダイレクト) |
| E2E-M07-03-022 | E2E自動化(要シード) | #admin_purchase_bank_account_accountHolder(BankAccountType add('accountHolder')) / #save_btn | バリデーション(口座名義必須)・エラー処理(200再表示 PurchaseController.php:399-417) |
| E2E-M07-03-023 | E2E自動化(要シード) | #edit_customer_switch(:728 依頼者編集解除) → #admin_purchase_detail_email(PurchaseDetailType add('email'):186) | バリデーション(メール形式) ※E-mailは依頼者ブロックで初期ロック・依頼者編集トグルで解除してから入力 |
| E2E-M07-03-024 | E2E自動化(要シード/ラジオvalue要実機) | 事業者ラジオ #..._qualifiedInvoiceIssuerFlg_1(expanded ChoiceType QualifiedInvoiceIssuerAccountType.php:54-64) / #..._qualifiedInvoiceIssuerCode | バリデーション(事業者選択時 登録番号NotBlank。検証は事業者on時のみ発火) |
| E2E-M07-03-025 | E2E自動化(要シード/ラジオvalue要実機) | 事業者ラジオ #..._qualifiedInvoiceIssuerFlg_1 / #..._qualifiedInvoiceIssuerCode | バリデーション(登録番号 英数字ちょうど14文字。検証は事業者on時のみ発火) |
| E2E-M07-03-030 | E2E自動化/未実装(fixme・選択肢値要実機) | #admin_purchase_detail_BuyOrderStatus(detail.twig:249) / メッセージ validators.ja.yaml:74 | 業務ルール(入庫済からの変更拒否)・エラー処理 ※買取状況の選択肢value/順序がmtb_buy_order_status rank依存で「別ステータス選択」を保証できずfixme |
| E2E-M07-03-031 | E2E自動化(要シード) | input[name^="admin_purchase_buy_order_stock"][name*="[diff_stock]"](BuyOrderStockType.php:56-58 prefix / PurchaseStockProductClassType.php:36 diff_stock) / メッセージ validators.ja.yaml:75 | 業務ルール(実在庫編集可否)・エラー処理 |
| E2E-M07-03-032 | E2E自動化/未実装(fixme・選択肢値要実機) | #admin_purchase_detail_BuyOrderStatus / メッセージ validators.ja.yaml:71 | 業務ルール(振込依頼時 身分証必須) ※「振込依頼済み」の選択肢valueがrank依存で確定できずfixme |
| E2E-M07-03-033 | E2E自動化/未実装(fixme) | input[name^="buy_order_stock"] / 例外挙動 | エッジケース(数量負→InvalidArgumentException・ロールバック) ※エラーUIは環境依存 |
| E2E-M07-03-040 | E2E自動化/未実装(fixme・内容手動) | #export_csv(:313 formaction=admin_purchase_csv_export) / #buyOrderIds(:315) | 利用者視点の入口(CSV) ※発火のみ自動化・内容手動 |
| E2E-M07-03-041 | E2E自動化/未実装(fixme・破壊的) | #sell_btn(:896 formaction=admin_purchase_bulk_detail_sell) | 利用者視点の入口(一括売却・別ルート) ※confirm要実機 |
| E2E-M07-03-006 | 手動/要確認(起点セレクタ未確定) | 実在庫情報ブロックの「商品追加／実在庫情報登録」起点（要実機確認） → #searchProductModal(detail.twig:909 共通モーダル) | 利用者視点の入口(実在庫の商品検索 admin_search_product `POST /search/product`) ※選んで買取(005)とは別入口。起点ボタンのセレクタが未確定で手動 |
| E2E-M07-03-026 | E2E自動化(要シード) | #admin_purchase_bank_account_accountNo(BankAccountType add('accountNo')) / #save_btn | バリデーション(口座番号 必須・数値7桁Range)・エラー処理(200再表示) ※IT行024(口座番号必須)の実体。022(口座名義)とは別項目 |
| E2E-M07-03-027 | E2E自動化/未実装(fixme・破壊的) | 事業者ラジオ #..._qualifiedInvoiceIssuerFlg_1 / #..._qualifiedInvoiceIssuerCode / #save_btn | バリデーション(事業者時 登録番号14文字英数字成功=正常系) ※024/025の正常対。保存成立で破壊的のためfixme |
| E2E-M07-03-034 | E2E自動化/未実装(fixme・選択肢値/高額シード要実機) | #admin_purchase_detail_BuyOrderStatus(detail.twig:249) / メッセージ validators.ja.yaml(本人確認) | 業務ルール(振込依頼 高額時 会員本人確認未完了) ※身分証032の本人確認分岐の異常対。「振込依頼済み」選択肢value・高額シードが要実機確認 |
| E2E-M07-03-042 | E2E自動化/未実装(fixme・内容手動) | #csvexport_product_list(detail.twig:314 formaction=admin_purchase_csv_export_product_list) / #buyOrderIds(detail.twig:315) | 利用者視点の入口(商品一覧CSV type=sale) ※発火のみ自動化・内容手動。040(admin_purchase_csv_export)とは別ルート |
| E2E-M07-03-043 | 手動/要確認(別トークン・モーダル経由) | ルート admin_purchase_register_individual_stock(PurchaseController.php:711 別トークン purchase_register_individual_stock) | 利用者視点の入口(個別入力実在庫紐付け・別ルート) ※不正IDの404は観測可だが正常系起点はモーダル内動的フォーム組立で手動 |

`元ITケースID` の行単位対応は付帯表2b（接頭辞 `IT-M07-03-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-BUY-ORDER-EDIT-NNN`）。既存IT casesは観点名のみの定型自動生成スタブのため、本E2Eは設計書本文（利用者視点の入口・処理フロー・業務ルール・エラー処理・入力項目）を一次情報源として網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

注: 「E2E自動化」列は**ケース表に自動化区分として写像した数**であり、付帯表1で `fixme`/`要実機確認`/`破壊的` と明記したものは未実装（実装済み自動化数とは別）である。実装済み/未実装の内訳は付帯表5・spec を正とする。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-15 | 4 | 2 | 1 | 1 | CSRFはForm内部完結=対象外。一括売却の状態変化=手動 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止（パスワード・トークン・Cookie値）はブラウザ観測外 |
| IT-25 | 9 | 6 | 3 | 0 | 実在庫モーダル起点(006)・CSV内容・査定合計のJS再計算は手動 |
| IT-03 | 7 | 3 | 3 | 1 | まとめめrefresh・total_price・売却flgの保存はDB間接。hidden送信値は観測外 |
| IT-13 | 1 | 1 | 0 | 0 | |
| IT-22 | 35 | 13 | 6 | 16 | 6種フォーム以外の汎用数値/文字種/部分入力スタブは本機能で非該当 |
| IT-23 | 22 | 0 | 1 | 21 | 本機能はユーザー向けDB検索を主題としない。検索条件/実行結果は別機能へ委譲。商品追加DOM(085)は保存後DB反映が間接 |
| IT-26 | 10 | 3 | 6 | 1 | 保存の永続化はフラッシュで観測・DB値は間接。新規追加なし行は非該当 |
| 合計 | 90 | 28 | 20 | 42 | **未分類 0** |

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 対象外 | CSRFはSymfony Form内部で完結しブラウザ観測外（不具合候補#1で要確認） |
| 002 | IT-15 | 未認証 | E2E自動化 | 010（未ログイン→管理ログイン） |
| 003 | IT-15 | 対象データ | E2E自動化 | 001（対象IDの最新状態を詳細表示） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | 手動/間接 | 041（一括売却=破壊的fixme・DB更新は間接） |
| 007 | IT-25 | UI部品(一覧戻り) | E2E自動化 | 002/013 |
| 008 | IT-25 | UI部品(実在庫モーダル) | 手動/間接 | 006（実在庫の商品検索 admin_search_product。起点セレクタ未確定で手動・005の選んで買取とは別入口） |
| 009 | IT-25 | 操作起点(CSV) | 手動/間接 | 040（発火はfixme・内容手動） |
| 010 | IT-25 | 確認ダイアログ(表示要素) | E2E自動化 | 001/002/003 |
| 011 | IT-25 | 確認ダイアログ(JS挙動) | E2E自動化 | 014（査定編集トグル） |
| 012 | IT-25 | 確認ダイアログ(査定合計表示) | 手動/間接 | JS再計算の数値検証はfragile=手動 |
| 013 | IT-25 | 送信可否制御(実在庫編集可否) | E2E自動化 | 031（編集不可ステータスエラー） |
| 014 | IT-03 | 外部画面(振込依頼 身分証) | E2E自動化 | 032 |
| 015 | IT-03 | 画面遷移(入庫済ステータス変更) | E2E自動化 | 030 |
| 016 | IT-03 | 画面遷移(まとめめrefresh) | 手動/間接 | refreshでDB値優先=保存結果は間接観測 |
| 017 | IT-03 | 画面遷移(管理者メモ) | E2E自動化 | 020（メモ含む保存） |
| 018 | IT-03 | 画面遷移(査定金額合計) | 手動/間接 | total_priceはreadonly保存=DB間接 |
| 019 | IT-03 | 画面遷移(選んで買取hidden) | 対象外 | hidden送信値はブラウザ観測外 |
| 020 | IT-03 | 画面遷移(まとめて買取売却) | 手動/間接 | sale_flg保存=DB間接 |
| 021 | IT-13 | URL直接アクセス(個別入力売却) | E2E自動化 | 010/011/012（URL直接・未ログイン・404） |
| 022 | IT-25 | HTTPステータス(実在庫増減) | E2E自動化 | 011（404）/033（増減負） |
| 023 | IT-25 | URL(口座銀行コード) | E2E自動化 | 022/026（口座フォーム送信先 update URL を保存系で確認。観点は送信先URLで口座項目値そのものではない） |
| 024 | IT-22 | 必須バリデーション(口座番号) | E2E自動化 | 026（口座番号 未入力で保存失敗。022の口座名義とは別項目） |
| 025 | IT-22 | 必須バリデーション(適格事業者状況) | E2E自動化 | 024（事業者時 登録番号必須） |
| 026 | IT-22 | 文字列長(適格登録番号) | E2E自動化 | 025 |
| 027 | IT-22 | 文字列長(適格発行事業者ラジオ・基本情報) | 対象外 | disabledで送信されない（依頼者ブロックを正とする） |
| 028 | IT-22 | 文字列長(適格確認状況) | 対象外 | フラグ項目で長さ検証非該当 |
| 029 | IT-22 | 文字列長(実在庫増減負) | E2E自動化 | 033 |
| 030 | IT-22 | 文字列長(まとめめ削除) | 対象外 | フォーム構造上ほぼ固定行 |
| 031 | IT-22 | 文字列長(個別入力数量0) | 対象外 | 行非描画・bind結果依存 |
| 032 | IT-22 | 数値(CSRF) | 対象外 | 汎用スタブ・本機能の数値項目に非該当 |
| 033 | IT-22 | 数値(一覧と詳細) | 対象外 | 同上 |
| 034 | IT-22 | 数値(まとめめ買取) | 対象外 | 同上 |
| 035 | IT-22 | 数値(メール送信) | 対象外 | 同上 |
| 036 | IT-22 | 数値(成功時出力) | 対象外 | 同上 |
| 037 | IT-22 | 数値(失敗時出力) | 対象外 | 同上 |
| 038 | IT-22 | 数値(副作用) | 対象外 | 同上 |
| 039 | IT-22 | 数値(dtb_buy_main_card) | 対象外 | 査定価格の数字/桁検証は読み取り編集モード依存で本汎用行に直接対応せず |
| 040 | IT-22 | 文字種(登録/更新) | 対象外 | 汎用スタブ・6フォームに文字種固有検証なし |
| 041 | IT-22 | 文字種(一覧編集リンク) | 対象外 | 同上 |
| 042 | IT-22 | その他(保存) | E2E自動化 | 021（保存リダイレクト） |
| 043 | IT-22 | その他(査定編集) | E2E自動化 | 014 |
| 044 | IT-22 | その他(まとめて買取開く) | 手動/間接 | 004（XHR行=fixme） |
| 045 | IT-22 | その他(商品追加) | E2E自動化 | 005 |
| 046 | IT-22 | その他(一括売却登録) | 手動/間接 | 041（破壊的fixme） |
| 047 | IT-22 | その他(一覧戻り) | E2E自動化 | 013 |
| 048 | IT-22 | その他(実在庫モーダル) | 手動/間接 | 006（実在庫の商品検索 admin_search_product。起点セレクタ未確定で手動） |
| 049 | IT-22 | その他(CSV) | 手動/間接 | 040（内容手動） |
| 050 | IT-22 | その他(表示要素) | E2E自動化 | 001 |
| 051 | IT-22 | 相関(JS挙動) | E2E自動化 | 014 |
| 052 | IT-22 | 相関(査定合計) | 対象外 | JS再計算は数値検証=本相関行に直接対応する観測なし |
| 053 | IT-22 | 相関(実在庫編集可否) | E2E自動化 | 031 |
| 054 | IT-22 | 相関(振込依頼遷移) | E2E自動化 | 032 |
| 055 | IT-22 | DB相関(入庫済ステータス変更) | E2E自動化 | 030 |
| 056 | IT-22 | DB相関(まとめめ査定価格数量状態) | 手動/間接 | refreshでDB優先=観測難 |
| 057 | IT-22 | 必須制御(管理者メモ) | 手動/間接 | 020（メモは設計上「任意」で必須制御は非該当。任意項目として保存系020で間接観測） |
| 058 | IT-22 | 部分入力(査定金額合計) | 対象外 | readonly・部分入力非該当 |
| 059-074 | IT-23 | 検索条件 | 対象外 | 本機能はユーザー向けDB検索を主題としない（一覧検索は別機能へ委譲）。レコード取得結果はDB内部=観測外（16行） |
| 075-079 | IT-23 | 実行結果 | 対象外 | 同上（検索実行結果なし）（5行） |
| 080 | IT-26 | 登録内容(登録/更新) | 手動/間接 | レコード更新の確認はDB間接（成功は020で観測） |
| 081 | IT-26 | 登録内容(追加されない) | 対象外 | 本機能はレコード新規追加を行わない（更新のみ） |
| 082 | IT-26 | 登録内容(保存・追加される) | 手動/間接 | 保存のDB反映は間接（フラッシュは020でカバー） |
| 083 | IT-26 | 登録内容(査定編集) | E2E自動化 | 014 |
| 084 | IT-26 | 登録内容(まとめて買取開く) | 手動/間接 | 004（XHR行=fixme） |
| 085 | IT-23 | 登録内容(商品追加DOM) | 手動/間接 | 005（モーダルで明細行DOM追加。IT-23のDB登録/ループ観点としては親フォーム保存後のDB反映が間接） |
| 086 | IT-26 | 登録内容(一括売却登録) | 手動/間接 | 041（破壊的fixme） |
| 087 | IT-26 | 登録内容(一覧戻り) | E2E自動化 | 013 |
| 088 | IT-26 | 登録内容(実在庫モーダル) | 手動/間接 | 006（実在庫の商品検索 admin_search_product。起点セレクタ未確定で手動） |
| 089 | IT-26 | 登録内容(CSV) | 手動/間接 | 040（内容手動） |
| 090 | IT-26 | 登録内容(表示要素) | E2E自動化 | 001 |

集計（付帯表2と一致）: 自動化 28 ／ 手動・間接 20 ／ 対象外 42。**未分類 0**。（前回の付帯表2は手動16/対象外41でIT-22のサマリと行単位2bが1行ズレていた=本監査で2bを正として是正。さらに実在庫モーダル008/048/088・管理者メモ057・商品追加DOM085を実体に合わせ手動/間接へ再分類）

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M07-03-ADMIN | dtb_member(管理者) | 当画面に到達できる有効な管理者1（ログインID/PWはconfig既定） | fixture(config既定) | 既存利用・撤去不要 | 全要ログインケース |
| SEED-M07-03-ORDER-EDITABLE | dtb_buy_order / 編集可能な1件 | 査定承諾〜入庫待ち範囲の買取状況。会員・口座・適格情報を持つ参照系。BUY_ORDER_EDITABLE_ID で受け渡し | fixture/migration | 専用ID・参照のみ（保存はしない）。表示/検証で破壊しない | 001,002,003,005,006,013,014,022,023,024,025,026,040,042 |
| SEED-M07-03-ORDER-SAVE | dtb_buy_order / 使い捨て1件 | 全必須を満たし保存成功できる編集可能注文。保存でDBが変わるため使い捨て | fixture/migration | 使い捨て・テスト毎に再投入 | 020,021,027 |
| SEED-M07-03-ORDER-STOCKED | dtb_buy_order / 入庫済み | 買取状況=入庫済み（STOCKING_COMPLETE相当）。BUY_ORDER_STOCKED_ID | fixture/migration | 専用ID・参照のみ（保存は失敗し変化しない） | 030 |
| SEED-M07-03-ORDER-NOSTOCKEDIT | dtb_buy_order / 実在庫編集不可 | 実在庫増減が許されない買取状況。実在庫行あり。BUY_ORDER_NOSTOCKEDIT_ID | fixture/migration | 専用ID・参照のみ | 031 |
| SEED-M07-03-ORDER-TRANSFERREADY | dtb_buy_order / 振込依頼可能・身分証未登録 | 振込依頼済みへ遷移可能だが identification 未登録 | fixture/migration | 専用ID・参照のみ | 032 |
| SEED-M07-03-ORDER-TRANSFERHIGH | dtb_buy_order / 高額・本人確認未完了 | 査定合計が `eccube_purchase_identification_required_amount`（確認値10000）以上で、会員にプレイヤーが無い／本人確認未完了。振込依頼済みへ遷移しようとするとエラー | fixture/migration | 専用ID・参照のみ | 034 |
| SEED-M07-03-ORDER-NEGSTOCK | dtb_buy_order_stock / 既存数量あり | 既存数量を超える減算で負になる構成 | fixture/migration | 専用ID・参照のみ | 033 |
| SEED-M07-03-ORDER-BULK | dtb_buy_main_card(bulk区分) | まとめて買取(bulk)明細を持つ注文。041は売却flg更新で破壊的=使い捨て | fixture/migration | 004は参照・041は使い捨て | 004,041 |

注: `migration` を選ぶ場合、DB対応は ec-cube-enterprise 正典（reverse-design 1c）に従い、現行pf-eccube3(HareruyaEcプラグイン)の買取関連テーブルを移行する。共通ログインは `config/default.config.ts`／注文IDは環境変数で供給する。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | CSRFはメイン・実在庫・口座・適格請求書の各トークン欠落/不一致で検証エラー | detail.twig:131(form._token) ほか各サブフォーム _token | 主キー不存在は404が先（update:359-361 find→NotFound）。CSRF単独のエラー表示はトークン改竄が必要で実機確認 | 012 | 要確認 |
| 2 | フォーム検証エラーは詳細を再表示しエラーを積む | PurchaseController.php:399-417（main $form エラーは addError('admin')フラッシュ／口座・適格は再描画inline） | メインフォームのエラーはフラッシュ、口座・適格請求書のエラーは inline 表示で出力先が異なる。本機能のメッセージ表示位置(flash/inline)を実機確認 | 022,023,024,025,030,031,032 | 要確認(表示位置) |
| 3 | 設計書はpf-eccube3リバース。確認値はec-cube-enterprise正典 | サブタイトル detail.twig:7「買取詳細」／messages.ja.yaml確認値「買取情報編集」あり | 表示名が「買取詳細」「買取情報編集」で揺れ。E2Eは画面の存在/部品で判定し名称をオラクル化しない | 001 | 要確認(表示名) |
| 4 | 実在庫数量が負→利用者向け整形エラーでない経路あり | エッジケース(InvalidArgumentException) / エラー処理「エラーUIは環境依存」 | 数量負時のエラーUIは環境依存のためfixme。例外時の画面挙動を実機確認 | 033 | 要確認(環境依存) |
| 5 | 買取状況の選択肢値（入庫済み/振込依頼済み）は移行先マスタ mtb_buy_order_status の rank順 | detail.twig:249 form.BuyOrderStatus | ステータス選択肢のvalue/indexはシード依存。selectOptionの指定値は実機確認 | 030,032 | 要確認(選択肢値) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口(GET edit) | 買取詳細表示・各ブロック描画 | 001,002,003 | カバー |
| 利用者視点の入口(POST update) | 保存成功→永続化・成功フラッシュ・同一URLリダイレクト | 020,021 | **部分カバー(fixme・破壊的)**: 020/021は成功フラッシュ・同一URLリダイレクトのみ(かつ未実装fixme)。永続化・DB値確認は実体なし＝DB操作行へ委譲(手動/間接) |
| 利用者視点の入口(存在しないid) | 404 | 011,012 | カバー |
| 利用者視点の入口(まとめて買取load/選んで買取商品検索/一括売却/CSV) | XHR行生成・モーダル・別ルート・CSV発火 | 004,005,040,041 | カバー(一部fixme/手動) |
| 利用者視点の入口(実在庫の商品検索 admin_search_product `POST /search/product`) | 実在庫モーダルの商品検索HTML返却 | 006 | **部分カバー(手動/要確認)**: 選んで買取モーダル(005)と別入口としてケース化。起点ボタンのセレクタ未確定で手動 |
| 利用者視点の入口(CSV商品リスト admin_purchase_csv_export_product_list) | type=sale のCSV出力 | 042 | カバー(fixme・内容手動): #csvexport_product_list の発火を042でケース化。040(csv_export)とは別ルート |
| 利用者視点の入口(個別入力商品の実在庫紐付け admin_purchase_register_individual_stock) | 別トークンでの紐付けPOST | 043 | **部分カバー(手動/要確認)**: 不正IDの404を043でケース化。正常系起点はモーダル内動的フォーム組立で手動 |
| フロント挙動(表示要素) | 基本情報/買取情報/実在庫/依頼者/フッタの部品 | 001,002,003 | カバー |
| フロント挙動(JS: 査定編集/依頼者編集トグル) | 編集可否切替 | 014,015 | 部分(014,015とも観測点要確認でfixme) |
| フロント挙動(JS: 査定合計再計算) | 行小計/総合計の再計算 | （JS数値検証=手動） | 手動(fragile) |
| 処理フロー(保存 判定#6 失敗時) | 200で詳細再表示＋エラー | 022,023,024,025,031（030,032=fixme） | カバー(030,032は選択肢値要確認でfixme) |
| 処理フロー(保存 判定#7-9 成功時) | 成功フラッシュ・リダイレクト | 020,021 | カバー(fixme) |
| 業務ルール(実在庫編集可否) | 不可ステータスで増減→エラー | 031 | カバー |
| 業務ルール(振込依頼時 身分証/本人確認) | 身分証未登録→エラー／高額時 会員本人確認未完了→エラー | 032,034 | **部分カバー(fixme)**: 身分証未登録032・高額本人確認未完了034ともに選択肢値/高額シード要確認でfixme。正常遷移は破壊的で手動 |
| 業務ルール(入庫済からの変更拒否) | 拒否メッセージ | 030 | fixme(選択肢値要確認) |
| 入力項目・バリデーション(代表) | 口座名義必須・口座番号必須・メール形式・適格登録番号(事業者時 必須/14文字・正常14文字成功) | 022,023,024,025,026,027 | **部分カバー(代表のみ)**: 026(口座番号必須)・027(事業者14文字成功=正常対)を追加 |
| 入力項目・バリデーション(未個別検証) | 氏名/カナ/郵便番号/住所/電話/職業/生年月日・銀行コード/支店コード/口座種別/口座番号Range・査定金額/送料/査定価格の数値桁等 | — | **未カバー(要確認)**: 設計書の入力項目を個別ケース化していない。Form制約値のオラクル固定を避け、代表項目で検証経路を担保。残りは追加ケース化または手動を要判断 |
| エッジケース(実在庫数量負) | 例外でロールバック | 033 | カバー(fixme・環境依存) |
| エッジケース(まとめめ削除/個別入力数量0/CSRF) | 構造固定/bind依存/トークン | （対象外・要確認） | 対象外/要確認(#1) |
| 画面遷移(保存成功→同一詳細) | リダイレクト | 021 | カバー(fixme) |
| 画面遷移(一覧戻り・会員詳細・手動メール) | 別ルート遷移 | 013,002 | **部分カバー**: 一覧戻り013のみ遷移実行を確認。会員詳細・手動メールは002の入口ボタン表示のみで遷移実行は未ケース化(手動/要追加) |
| DB操作(注文・明細・実在庫・履歴・口座・適格・振込完了メール) | レコード更新・メール送信 | 020(fixme・間接)/031(失敗で非更新) | **未自動化(手動/間接)**: 保存系020は破壊的fixme。DB値・メール送信の確認は自動化外＝**E2Eでは未カバー**。DB検証はIT/手動へ委譲 ※要確認 |
| 権限・認可 | 未ログイン誘導・ログイン済み到達 | 010,001 | カバー |
| 試行制限 | 本機能では扱わない | — | 対象外(設計書「試行制限を扱わない」) |
| ログ・監査(出力抑止) | パスワード/トークン/Cookie値の出力抑止 | （対象外＝観測外） | 対象外(理由付き) |
| セッション(検索page_no/商品検索) | 一覧戻りのページ番号引継ぎ | 013 | カバー(間接) |
| Cookie | 本機能単体で新規Cookie設定なし | — | 対象外(要件なし) |
| API/バッチ | バッチ起動なし・XHRはHTML/JSON断片 | 004,005,006 | **部分カバー/保留**: 004(bulkpurchaseload)はfixme・005/006はモーダル表示のみで検索POST/DOM追加結果まで未確認 |

注: 本マトリクスは**未カバー0ではない**。未自動化/未追加の節（実在庫商品検索・CSV商品リスト・個別入力実在庫紐付けの各入口、入力項目バリデーションの個別検証、DB値・メール送信の確認、トグル観測点、ステータス選択肢値依存の030/032）を**要確認/要追加**として明示する。各未カバーには理由（観測不能・JS数値検証fragile・DB内部値・環境依存・別機能委譲・要件なし・破壊的fixme・選択肢/制約値の実機未確定）を付す。`付帯表2`の集計が示すのは「観点行の未分類0（監査可能性）」であって、設計書節の全自動化ではない。
