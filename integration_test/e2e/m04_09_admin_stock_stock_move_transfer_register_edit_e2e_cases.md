# m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.html`（正本 `functions/ec-cube-enterprise/m04-09_admin_stock_stock_move_transfer_register_edit.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_09_admin_stock_stock_move_transfer_register_edit_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・HTTPステータス・別画面での間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約（min/max/NotBlank）をオラクル化しない。本機能は新規実装でありpf-eccube3の対応機能は無く、基本設計仕様書（在庫管理機能）とec-cube-enterprise実装を正典とする。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 各画面のUI部品（移動/振替/編集フォーム）・確認モーダル/商品検索モーダル・補助APIのHTTP応答・URL |
| IT-03 | 画面遷移（登録成功→出庫承認申請/振替承認待ち画面・ステータス不整合のリダイレクト） |
| IT-13 | URL直接アクセス（未ログイン誘導） |
| IT-15 | 未認証ガード・対象データ・状態変化（登録/更新の間接確認） |
| IT-22 | 必須/数値/相関バリデーション（入庫先・移動点数・同一店舗同一区分・在庫超過・振替先コード・承認通知先） |
| IT-23 | DB検索・取得（補助API取得は観測可、永続レコードの区分/件数は間接/対象外） |
| IT-26 | 登録/更新内容（保存メッセージ・遷移で間接確認。在庫減算・履歴・承認一覧の内部値は手動/対象外） |
| IT-20 | ログ出力抑止・識別子＝ブラウザ観測外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-001	IT-25	UI部品	P1	移動 初期登録画面に入庫先店舗・在庫区分・移動点数・メモ・登録ボタンが表示される	ログイン済／SEED-M04-09-MOVE-SRC	移動対象の productStockIds	1. /admin/product/stock/move/new?productStockIds[]=… を開く	入庫先店舗選択・入庫先在庫区分選択・移動点数入力欄・メモ入力欄・「登録」ボタンが表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-002	IT-25	表示結果	P2	移動 初期登録画面に出庫元店舗・出庫元在庫区分（変更不可）が表示される	ログイン済／SEED-M04-09-MOVE-SRC	先頭在庫が属する店舗・在庫区分	1. 移動 初期登録画面を開く	先頭在庫の店舗名（出庫元店舗）・在庫区分名（出庫元在庫区分）が表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-003	IT-25	確認ダイアログ	P2	移動 登録ボタン押下で在庫移動登録確認モーダルが表示される	ログイン済／SEED-M04-09-MOVE-SRC	有効な入庫先・移動点数	"1. 移動 初期登録画面で必要項目を入力
2. 「登録」ボタンを押下"	在庫移動登録確認モーダル（確認見出し・確定/キャンセル）が表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-010	IT-26	登録内容	P1	移動 正常登録で保存メッセージが表示され出庫承認申請画面へ遷移する	ログイン済／SEED-M04-09-MOVE-SRC（使い捨て）	入庫先店舗・在庫区分・移動点数（在庫数以内）	"1. 移動 初期登録画面で入庫先・移動点数を入力
2. 確認モーダルで確定送信"	「保存しました」が表示され、出庫承認申請画面（/product/stock/move/outbound_approval_request/{id}）へ遷移すること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-011	IT-26	登録内容	P2	移動 移動先商品在庫が無い場合は保存に失敗し移動 初期登録画面が再表示される	ログイン済／SEED-M04-09-MOVE-NODEST（移動先ProductStock不在）	入庫先店舗・在庫区分（対応する移動先在庫が存在しない組合せ）・移動点数（在庫数以内）	"1. 移動 初期登録画面で移動先在庫が存在しない入庫先・在庫区分・点数を入力
2. 確認モーダルで確定送信"	「保存に失敗しました」が表示され、移動 初期登録画面に留まり登録されないこと（移動先在庫なしのAction例外→save_error同画面再表示）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-020	IT-22	必須バリデーション	P1	移動 入庫先店舗未選択で登録するとエラーが表示され登録されない	ログイン済／SEED-M04-09-MOVE-SRC	入庫先店舗＝未選択	"1. 移動 初期登録画面で入庫先店舗を選ばず移動点数のみ入力
2. 登録を確定送信"	入力不備のエラーが表示され、移動 初期登録画面に留まり登録されないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-021	IT-22	必須バリデーション	P1	移動 移動点数未入力で登録するとエラーが表示され登録されない	ログイン済／SEED-M04-09-MOVE-SRC	移動点数＝空	"1. 移動 初期登録画面で入庫先を選び移動点数を空のまま
2. 登録を確定送信"	移動点数の入力エラーが表示され、移動 初期登録画面に留まり登録されないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-022	IT-22	相関バリデーション	P1	移動 出庫元と入庫先が同一店舗・同一区分のとき同一指定エラーが表示される	ログイン済／SEED-M04-09-MOVE-SRC	入庫先＝出庫元と同一店舗・同一在庫区分	"1. 移動 初期登録画面で入庫先に出庫元と同じ店舗・区分を指定
2. 登録を確定送信"	「出庫元と入庫先が同じです。」が表示され、移動 初期登録画面に留まること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-023	IT-22	DBとの相関バリデーション	P1	移動 移動点数が現在庫数を超えると在庫超過エラーが表示される	ログイン済／SEED-M04-09-MOVE-SRC（在庫数既知）	移動点数＝現在庫数＋1	"1. 移動 初期登録画面で移動点数に現在庫数を超える値を入力
2. 登録を確定送信"	「移動点数が現在の在庫数を超えています。」が表示され、移動 初期登録画面に留まること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-024	IT-22	数値バリデーション	P2	移動 移動点数に1未満を入力するとエラーが表示され登録されない	ログイン済／SEED-M04-09-MOVE-SRC	移動点数＝0	"1. 移動 初期登録画面で移動点数に0を入力
2. 登録を確定送信"	移動点数の入力エラーが表示され、移動 初期登録画面に留まり登録されないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-025	IT-22	必須バリデーション	P1	移動 入庫先在庫区分未選択で登録するとエラーが表示され登録されない	ログイン済／SEED-M04-09-MOVE-SRC	入庫先在庫区分＝未選択	"1. 移動 初期登録画面で入庫先店舗のみ選び在庫区分を未選択のまま移動点数を入力
2. 登録を確定送信"	入力不備のエラーが表示され、移動 初期登録画面に留まり登録されないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-030	IT-25	UI部品	P1	振替 初期登録画面に承認通知先・振替先コード（検索）・振替点数・メモ・登録が表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	振替対象の productStockIds	1. /admin/product/stock/transfer/new?productStockIds[]=… を開く	承認通知先選択・振替先商品コード入力欄と「検索」ボタン・振替点数入力欄・メモ・「登録」ボタンが表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-031	IT-25	確認ダイアログ	P2	振替 振替先「検索」ボタンで商品検索モーダルが開く	ログイン済／SEED-M04-09-TRANSFER-SRC	—	1. 振替 初期登録画面で明細行の「検索」ボタンを押下	商品検索モーダル（商品検索見出し・検索フォーム）が表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-032	IT-25	表示結果	P2	振替 初期登録画面に出庫元（本店EC）店舗・在庫区分が表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	本店EC所属・先頭在庫の在庫区分	1. 振替 初期登録画面を開く	本店EC（出庫元）店舗名・先頭在庫の在庫区分名が表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-040	IT-26	登録内容	P1	振替 正常登録で保存メッセージが表示され振替承認待ち画面へ遷移する	ログイン済／SEED-M04-09-TRANSFER-SRC（使い捨て）	振替先商品コード・振替点数・承認通知先メンバー	"1. 振替 初期登録画面で振替先コード・点数・承認通知先を入力
2. 「登録」を送信"	「保存しました」が表示され、振替承認待ち画面（/product/stock/transfer/{id}/approval）へ遷移すること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-041	IT-22	必須バリデーション	P1	振替 振替先商品コード未入力で登録するとコード必須エラーが表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	振替先商品コード＝空	"1. 振替 初期登録画面で振替先コードを空のまま点数・承認通知先を入力
2. 「登録」を送信"	「振替先の商品コードを入力してください。」が表示され、振替 初期登録画面に留まること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-042	IT-22	必須バリデーション	P1	振替 承認通知先メンバー未選択で登録すると通知先必須エラーが表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	承認通知先メンバー＝未選択	"1. 振替 初期登録画面で承認通知先を選ばず振替先コード・点数を入力
2. 「登録」を送信"	「承認通知先のメンバーを1人以上選択してください。」が表示され、振替 初期登録画面に留まること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-043	IT-22	数値バリデーション	P2	振替 振替点数に1未満を入力するとエラーが表示され登録されない	ログイン済／SEED-M04-09-TRANSFER-SRC	振替点数＝0	"1. 振替 初期登録画面で振替点数に0を入力
2. 「登録」を送信"	振替点数の入力エラーが表示され、振替 初期登録画面に留まり登録されないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-044	IT-22	その他のバリデーション	P2	振替 振替先商品コードが不正（未存在）の場合は保存に失敗し振替 初期登録画面が再表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	振替先商品コード＝未存在コード・振替点数・承認通知先メンバー	"1. 振替 初期登録画面で未存在の振替先コードを設定し点数・承認通知先を入力
2. 「登録」を送信"	「保存に失敗しました」が表示され、振替 初期登録画面に留まり登録されないこと（振替先コード不正のAction例外→save_error同画面再表示）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-045	IT-22	部分入力	P2	振替 登録可能な振替明細が0件の場合は保存に失敗し振替 初期登録画面が再表示される	ログイン済／SEED-M04-09-TRANSFER-SRC	全明細＝点数0またはコード空（登録可能明細0件）	"1. 振替 初期登録画面で全明細の点数を0／コードを空のまま
2. 「登録」を送信"	「保存に失敗しました」が表示され、振替 初期登録画面に留まり登録されないこと（登録可能明細0件のAction例外→save_error。点数下限のForm検証が先行する可能性は要実機確認）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-050	IT-25	UI部品	P2	移動 編集（ピック・出庫承認申請）画面に明細・履歴・欠品点数・メモが表示される	ログイン済／SEED-M04-09-MOVE-NEW（新規登録済の移動）	移動振替ID	1. /admin/product/stock/move/outbound_approval_request/{id} を開く	移動明細・ステータス履歴・欠品点数/メモの編集フォームが表示されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-051	IT-26	更新内容	P1	移動 編集 店舗内移動の更新確定で入庫完了となり保存メッセージが表示される	ログイン済／SEED-M04-09-MOVE-SAMESTORE（店舗内移動・新規登録済・使い捨て）	欠品点数・メモ	"1. 店舗内移動の編集画面で欠品点数・メモを入力
2. 更新を送信"	「保存しました」が表示され、ステータスが入庫完了相当の完了画面へ連鎖遷移すること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-052	IT-03	画面遷移	P1	移動 編集 店舗間移動の更新確定で出庫承認待ちとなり出庫承認画面へ遷移する	ログイン済／SEED-M04-09-MOVE-CROSSSTORE（店舗間移動・新規登録済・使い捨て）	欠品点数・メモ	1. 店舗間移動の編集画面で更新を送信	「保存しました」が表示され、出庫承認画面（/product/stock/move/outbound_approval/{id}）へ遷移すること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-026	IT-22	数値バリデーション	P2	移動 編集 欠品点数に不正な数値（移動点数超過/負数）を入力すると更新されず編集画面が再表示される	ログイン済／SEED-M04-09-MOVE-NEW（新規登録済の移動）	欠品点数＝移動点数超過 または 負数	"1. 移動 編集画面で欠品点数に移動点数を超える値（または負数）を入力
2. 更新を送信"	入力不備のエラーが表示され、移動 編集画面に留まり更新されないこと（欠品点数のForm制約は要実機確認）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-055	IT-22	必須制御	P2	移動 編集 店舗間移動で承認通知先メンバー未選択の場合は更新されず編集画面が再表示される	ログイン済／SEED-M04-09-MOVE-CROSSSTORE（店舗間移動・新規登録済）	承認通知先メンバー＝未選択	1. 店舗間移動の編集画面で承認通知先を選ばず更新を送信	承認通知先必須のエラーが表示され、移動 編集画面に留まり更新されないこと（編集フォームの承認通知先必須制約は要実機確認）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-053	IT-25	HTTPステータス	P2	存在しない移動振替IDの編集URLは404となる	ログイン済	存在しないID	1. /admin/product/stock/move/outbound_approval_request/99999999 を開く	HTTP 404 が返ること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-060	IT-23	実行結果	P2	振替補助API 有効なproduct_class_idで商品情報JSONが200で返る	ログイン済／SEED-M04-09-PRODUCT-CLASS	有効な product_class_id	1. /admin/product/stock/transfer/dest-product-class-info?product_class_id=<有効ID> をGET	HTTP 200 で商品名・コード・言語・カード状態・Foil・基準価格を含むJSONが返ること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-061	IT-25	HTTPステータス	P2	振替補助API product_class_id<=0で400となる	ログイン済	product_class_id＝0	1. /admin/product/stock/transfer/dest-product-class-info?product_class_id=0 をGET	HTTP 400 が返ること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-062	IT-25	HTTPステータス	P2	振替補助API 未存在のproduct_class_idで404となる	ログイン済	未存在の product_class_id	1. /admin/product/stock/transfer/dest-product-class-info?product_class_id=99999999 をGET	HTTP 404 が返ること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-070	IT-13	URL直接アクセス	P2	未ログインで移動 初期登録URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/stock/move/new へ直接アクセス	管理ログイン画面へ誘導されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-071	IT-13	URL直接アクセス	P2	未ログインで振替 初期登録URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/stock/transfer/new へ直接アクセス	管理ログイン画面へ誘導されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-072	IT-15	未認証	P1	未ログインで移動 編集URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/stock/move/outbound_approval_request/1 へ直接アクセス	管理ログイン画面へ誘導されること。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-073	IT-13	URL直接アクセス	P2	未ログインで振替補助API URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/product/stock/transfer/dest-product-class-info?product_class_id=1 へ直接アクセス	管理ログイン画面へ誘導され、商品情報JSONが返らないこと。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-074	IT-13	URL直接アクセス	P2	未ログインでPOST系URL（move/store・transfer/store・update）へアクセスすると処理されず管理ログイン画面へ誘導される	未ログイン	—	1. 未認証で各POSTエンドポイント（move/store・transfer/store・outbound_approval_request/{id}/update）へリクエスト	管理ログイン画面へ誘導され、登録/更新が実行されないこと（POST未認証時の遷移挙動は要実機確認）。				
m04-09_admin_stock_stock_move_transfer_register_edit（在庫移動・振替登録/編集）	E2E-M04-09-080	IT-03	画面遷移	P2	ステータスが現ルートに不適合な移動振替IDの編集URLは対応画面へリダイレクトされる	ログイン済／SEED-M04-09-MOVE-INBOUND（入庫承認待ち等）	ステータス不適合の移動振替ID	1. 現ステータスに対応しないルート（出庫承認申請）の編集URLを開く	ステータスに対応する画面へリダイレクトされ、編集画面が表示されないこと。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の getBlockPrefix から導出する。移動 登録は `admin_stock_move_new`（`StockMoveNewType.php:124-127`）、振替 登録は `admin_stock_transfer_new`（`StockTransferNewType.php:119-122`）。明細コレクションの行は `_0_`（先頭行）連番。行番号は ec-cube-enterprise 現行ソース基準。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M04-09-001 | E2E自動化(要シード) | #admin_stock_move_new_move_to_base_info(move_new.twig:102) / #admin_stock_move_new_move_to_stock_location_id(move_new.twig:114) / #admin_stock_move_new_stock_move_quantities_0_quantity(move_new.twig:164) / #admin_stock_move_new_memo(move_new.twig:195) / 登録ボタン #stock_move_register_btn trans `admin.common.registration`(move_new.twig:220 / messages.ja.yaml:1436) | フォーム項目（移動 登録フォーム）・フロント挙動 |
| E2E-M04-09-002 | E2E自動化(要シード) | 出庫元店舗ラベル `admin.stock.move.move_from_base_info_name`=「出庫元店舗」(move_new.twig:74 / messages.ja.yaml:4267) / 出庫元在庫区分 `admin.stock.move.move_from_stock_location`(move_new.twig:85 / messages.ja.yaml:4268) / 値は new() 先頭在庫由来(StockMoveController.php:172-173) | プロセスフロー（移動 登録）#1 先頭在庫の店舗・区分表示 |
| E2E-M04-09-003 | E2E自動化(要シード/モーダルJS要実機確認) | #stock_move_register_btn(move_new.twig:220) / 確認モーダル #stockMoveConfirmModal(move_new.twig:235) / モーダル submit button[type=submit](move_new.twig:248) | フロント挙動（登録確認モーダル） |
| E2E-M04-09-010 | E2E自動化/破壊的(要使い捨てシード) | 上記入力欄＋モーダル submit / 成功フラッシュ `admin.common.save_complete`=「保存しました」(messages.ja.yaml:1398 / StockMoveController.php:262 addSuccess) / リダイレクト先URL outbound_approval_request | プロセスフロー（移動 登録）#6 成功→save_complete＋遷移 |
| E2E-M04-09-020 | E2E自動化(要シード) | #admin_stock_move_new_move_to_base_info(必須 move_new.twig:99 required badge) / エラー領域 form_errors(move_new.twig:103) ＝.invalid-feedback 要実機確認 | フォーム項目（move_to_base_info 必須）＋分岐（save_error 同画面再描画 StockMoveController.php:214-221） |
| E2E-M04-09-021 | E2E自動化(要シード) | #admin_stock_move_new_stock_move_quantities_0_quantity(move_new.twig:164) / form_errors(move_new.twig:165) | フォーム項目（quantity NotBlank・movement_quantity_required messages.ja.yaml:4274） |
| E2E-M04-09-022 | E2E自動化(要シード) | #admin_stock_move_new_move_to_stock_location_id / エラー `admin.stock.move.same_store_same_location_error`=「出庫元と入庫先が同じです。」(messages.ja.yaml:4290 / StockMoveNewType POST_SUBMIT) | 追加バリデーション（同一店舗・同一区分） |
| E2E-M04-09-023 | E2E自動化(要シード・在庫数既知) | quantity欄 / エラー `admin.stock.move.movement_quantity_exceeds_stock`=「移動点数が現在の在庫数を超えています。」(messages.ja.yaml:4291 / StockMoveQuantityType bccomp) | 追加バリデーション（在庫超過） |
| E2E-M04-09-024 | E2E自動化(要シード) | quantity欄 / form_errors / `admin.stock.move.movement_quantity_min`=「移動点数は1以上で入力してください。」(messages.ja.yaml:4275) | フォーム項目（GreaterThanOrEqual(1)）。**期待値は設計書「移動点数1以上」由来でForm制約をオラクル化しない** |
| E2E-M04-09-030 | E2E自動化(要シード) | #admin_stock_transfer_new_approval_notification_target_members(transfer_new.twig:283) / #admin_stock_transfer_new_transfer_details_0_dest_product_code(transfer_new.twig:342) / 検索 .btn-transfer-product-search trans `admin.stock.transfer.search`=「検索」(transfer_new.twig:344 / messages.ja.yaml:4501) / #admin_stock_transfer_new_transfer_details_0_move_transfer_quantity(transfer_new.twig:363) / #admin_stock_transfer_new_memo(transfer_new.twig:397) / 登録 button[type=submit] trans `admin.common.registration`(transfer_new.twig:418) | フォーム項目（振替 登録フォーム）・フロント挙動 |
| E2E-M04-09-031 | E2E自動化(要シード) | .btn-transfer-product-search(transfer_new.twig:344) / モーダル #stockTransferProductModal(transfer_new.twig:451) / モーダル見出し `admin.stock.transfer.product_search_modal_title`=「商品検索」(messages.ja.yaml:4512) | フロント挙動（商品検索モーダル） |
| E2E-M04-09-040 | E2E自動化/破壊的(要使い捨てシード) | 上記入力欄 / 成功フラッシュ `admin.common.save_complete`(messages.ja.yaml:1398 / StockTransferController.php redirect) / リダイレクト先 transfer/{id}/approval(StockTransferController.php:245) | プロセスフロー（振替 登録）#4 成功→save_complete＋遷移 |
| E2E-M04-09-041 | E2E自動化(要シード) | dest_product_code欄 / form_errors(transfer_new.twig:343) / `admin.stock.transfer.dest_product_code_required`=「振替先の商品コードを入力してください。」(messages.ja.yaml:4506 / StockTransferNewDetailType:47-57 NotBlank) | 分岐（振替先コード未入力）。**必須はNotBlankでなく設計書「振替先コード必須」由来** |
| E2E-M04-09-042 | E2E自動化(要シード) | #admin_stock_transfer_new_approval_notification_target_members / `admin.stock.move.approval_notification_target_required`=「承認通知先のメンバーを1人以上選択してください。」(messages.ja.yaml:4295 / StockTransferNewType:65 Count(min:1)) | 分岐（承認通知先未選択） |
| E2E-M04-09-043 | E2E自動化(要シード) | move_transfer_quantity欄 / form_errors(transfer_new.twig:364) | フォーム項目（GreaterThanOrEqual(1)）。期待値は設計書「振替点数1以上」由来 |
| E2E-M04-09-050 | E2E自動化(要シード) | move_outbound_approval_request.twig（明細テーブル・履歴・StockMoveOutboundApprovalRequestType）要実機確認 | プロセスフロー（移動 編集）#1 明細・履歴・欠品/メモ表示 |
| E2E-M04-09-051 | E2E自動化/破壊的(要使い捨てシード 店舗内移動) | 更新フォーム submit / 成功フラッシュ save_complete / 完了画面遷移 | プロセスフロー（移動 編集）#2-3 店舗内移動→入庫完了(7)＋連鎖リダイレクト |
| E2E-M04-09-052 | E2E自動化/破壊的(要使い捨てシード 店舗間移動) | 更新フォーム submit / リダイレクト先 outbound_approval(StockMoveController.php:406) | プロセスフロー（移動 編集）#3 店舗間→出庫承認待ち(2)＋出庫承認画面 |
| E2E-M04-09-053 | E2E自動化 | HTTPステータス（#[MapEntity] 未存在→404 StockMoveController.php:270-272） | 分岐・遷移・例外（対象なし404） |
| E2E-M04-09-060 | E2E自動化(要シード ProductClass) | JSON応答（StockTransferController.php:451-475）product_name/product_code/language/card_condition/foil/standard_price | 利用者視点の入口（振替補助API 正常時JSON） |
| E2E-M04-09-061 | E2E自動化 | HTTP 400（StockTransferController.php:454-456 product_class_id<=0） | 分岐（補助API 400） |
| E2E-M04-09-062 | E2E自動化(要creds) | HTTP 404（StockTransferController.php:458-460 ProductClass未存在） | 分岐（補助API 404） |
| E2E-M04-09-070/071/072 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig:26) / リダイレクト先 /login | 利用者視点の入口（全ルート管理ログイン要・未ログインは誘導） |
| E2E-M04-09-080 | E2E自動化/間接(要シード特定ステータス) | redirectByMoveTransferStatus()(StockMoveController.php:137-149) / リダイレクト先URL | ステータスと遷移（STATUS_TO_ROUTE・無限ループ防止） |
| E2E-M04-09-011 | 手動/間接(要シード SEED-M04-09-MOVE-NODEST) | 入力欄＋モーダル submit / save_error `admin.common.save_error`=「保存に失敗しました」(messages.ja.yaml:1399 / StockMoveController.php catch→addError) | プロセスフロー（移動 登録）#5-#6 移動先ProductStock不在→例外「移動先の商品在庫が見つかりません」→save_error同画面再表示 |
| E2E-M04-09-025 | E2E自動化(要シード) | #admin_stock_move_new_move_to_stock_location_id(必須 move_new.twig:111 required badge / move_new.twig:114) / form_errors（出力先 要実機確認） | フォーム項目（move_to_stock_location_id 必須）＋分岐（save_error 同画面再表示） |
| E2E-M04-09-032 | E2E自動化(要シード) | 出庫元（本店EC）店舗名・在庫区分名表示（transfer_new.twig 出庫元表示部 要実機確認 / 値は getMallBaseInfo()＋先頭在庫由来 StockTransferController.php） | 利用者視点の入口（振替 初期登録）／プロセスフロー（振替 登録）#1 本店EC・先頭在庫区分表示 |
| E2E-M04-09-044 | 手動/間接(要シード 未存在コード) | dest_product_code（モーダル経由設定・readonly transfer_new.twig:342）/ save_error `admin.common.save_error`(messages.ja.yaml:1399 / StockTransferController.php catch) | プロセスフロー（振替 登録）#3-#4 振替先コードからProductClass未解決→例外「振替先の商品コード「…」が見つかりません」→save_error。**コード不正は設計書「振替先コード不正はAction例外」由来** |
| E2E-M04-09-045 | 手動/間接(要確認: 点数下限Form検証の先行可否) | 全明細 quantity=0/コード空 / save_error(messages.ja.yaml:1399) | プロセスフロー（振替 登録）#4 登録できた明細0件→例外「登録可能な振替明細がありません」→save_error。点数0はGreaterThanOrEqual(1)のForm検証が先行する可能性＝要実機確認 |
| E2E-M04-09-026 | 手動/間接(要シード SEED-M04-09-MOVE-NEW・要実機確認) | move_outbound_approval_request.twig 欠品点数欄（StockMoveOutboundApprovalRequestDetailType 欠品点数の範囲制約は要実機確認）/ form_errors | プロセスフロー（移動 編集）#2 欠品点数の数値検証（移動点数超過/負数）→更新されず同画面 |
| E2E-M04-09-055 | 手動/間接(要シード SEED-M04-09-MOVE-CROSSSTORE・要実機確認) | move_outbound_approval_request.twig 承認通知先欄（StockMoveOutboundApprovalRequestType 承認通知先の必須制約は要実機確認）/ form_errors | プロセスフロー（移動 編集）#2 店舗間移動の承認通知先未選択→更新されず同画面 |
| E2E-M04-09-073 | E2E自動化(資格情報不要) | 補助APIルート admin_stock_transfer_dest_product_class_info（管理ログイン要 StockTransferController.php:450）/ リダイレクト先 /login | 利用者視点の入口（全ルート管理ログイン要・補助APIも未ログインは誘導） |
| E2E-M04-09-074 | 手動/間接(要確認: POST未認証の遷移挙動) | POST move/store(StockMoveController.php:198)・transfer/store(:172)・outbound_approval_request/{id}/update(:316)（管理ログイン要）/ リダイレクト先 /login | 利用者視点の入口（POST系も管理ログイン要・未認証は処理されず誘導） |

注（spec実装状態。網羅マトリクスの「カバー」は設計意図であり、Playwright spec の実装状態とは別管理）:
- spec 実装済（実行可能・非破壊）: 001,002,003,020,022,023,025,030,031,041,053,060,061,062,070,071,072,073。
- 032（振替 出庫元表示）: 出庫元表示部のセレクタが要実機確認のため spec 未実装（050同様・E2E自動化方針）。
- spec `test.fixme`（自動化方針だが実機でのセレクタ/操作確定が前提の残課題）: 010,021,024,040,042,043,051,052,080。
  - 021/024/043: 入力エラー表示要素（form_errors 出力先）のセレクタを実機確認後に実装。
  - 042: 承認通知先必須エラーの単独オラクル化には他必須＝振替先コード（readonly・商品検索モーダル経由設定＝不具合候補#3）を満たす必要があり、モーダル操作確定後に実装。
  - 010/040/051/052: DBを書き換える破壊的成功系で使い捨てシードと後始末が前提。080: 特定ステータスシードが前提。
- 050: 編集画面テンプレート（move_outbound_approval_request.twig）のセレクタが要実機確認のため spec 未実装（要確認）。
- 手動/間接（ケース表のみ・spec未実装。要シード/要実機確認のためfixme羅列はしない）: 011（移動先在庫なし→save_error）/026（編集 欠品点数 数値検証）/044（振替先コード不正→save_error）/045（振替明細0件→save_error）/055（編集 店舗間 承認通知先未選択）/074（POST系 未認証ガード）。いずれも設計書（プロセスフロー#5-#6・分岐/例外・編集#2・全ルート管理ログイン要）由来の異常系で、Action例外系は save_error 同画面再表示として観測可能だが、特定シード（移動先在庫なし/店舗間移動）と編集フォームのForm制約セレクタ確定が前提。

注: 既存IT cases（接頭辞 `IT-M04-09-ADMIN-STOCK-STOCK-MOVE-TRANSFER-REGISTER-EDIT-NNN`）は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文・期待結果が設計書本文の断片）であり、機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・フォーム項目・プロセスフロー・分岐/遷移/例外・ステータス遷移）を一次情報源として網羅した。行単位の対応は付帯表2bで全量照合する。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_09_..._it_cases.md` の関連ID件数（IT-22=35／IT-23=22／IT-26=10／IT-25=9／IT-03=7／IT-15=4／IT-20=2／IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外（理由）に振り分ける。スタブは観点が汎用のため同一観点が連番で重複する。内訳は **付帯表2b（行単位明細・全90行）** が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 11 | 2 | 22 | 本機能の入力は数値点数・コード・選択（必須/数値/相関）に限られ、文字種・文字列長・汎用「その他/相関」スタブはブラウザ観測対象にならない。振替登録点数の数値（行035）は043に自動化、移動編集の欠品点数 数値検証（行033）は026に手動/間接で写像。部分入力(登録明細0件)は save_error 同画面再表示として手動/間接で観測可 |
| IT-23 | 22 | 1 | 1 | 20 | 永続レコードの区分/件数/更新値は画面から観測不能（DB内部）。補助APIの取得結果のみE2E可、登録レコードの取得は間接 |
| IT-26 | 10 | 3 | 5 | 2 | 保存メッセージ・遷移・更新成功は自動化。在庫減算/加算・履歴・承認一覧の内部値は間接、移動先在庫なしのAction例外で未登録になる系（行081）は save_error 同画面再表示として手動/間接で観測可 |
| IT-25 | 9 | 8 | 0 | 1 | UI部品・確認/検索モーダル・補助API HTTP・URLは観測可。送信可否制御のクライアント制御は本機能で不使用 |
| IT-03 | 7 | 6 | 0 | 1 | 登録/更新成功遷移・ステータス不整合リダイレクトは観測可。重複スタブ1件は同義のため対象外 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセスの未ログイン誘導は観測可 |
| IT-15 | 4 | 1 | 2 | 1 | 未認証ガードは観測可。対象データ/状態変化は登録更新の間接確認。CSRFはフレームワーク内部完結で観測外 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子＝ブラウザ観測外 |
| 合計 | 90 | 31 | 10 | 49 | **未分類 0** |

注: 対象外49件はいずれも「ブラウザで観測不能（DB内部値/ログ/CSRF）」「本機能で非該当（文字種/文字列長/送信可否制御）」が理由であり、放置ではない。IT-25の HTTPステータス/URL（既存IT 022/023）は補助API・編集URLのHTTP応答として E2E自動化済（付帯表2bで全量照合）。本監査で IT行035（振替登録点数の数値）を043へ自動化、IT行033（移動編集 欠品点数の数値）を026へ手動/間接、IT行081（移動先在庫なしで未登録）を011へ手動/間接に是正し、誤分類を解消した。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 対象外 | CSRFはSymfony Form内部で完結しブラウザ観測外 |
| 002 | IT-15 | 未認証 | E2E自動化 | 070/071/072（未ログインで各URL→ログイン誘導） |
| 003 | IT-15 | 対象データ | 手動/間接 | 010/040の登録対象データは保存成功で間接確認（DBレコード値は手動） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | 手動/間接 | 051/052の状態（ステータス）変化は遷移先で間接確認（DB値は手動） |
| 007 | IT-25 | UI部品 | E2E自動化 | 050（編集画面 明細・履歴・欠品/メモ） |
| 008 | IT-25 | UI部品 | E2E自動化 | 030（振替 初期登録画面UI） |
| 009 | IT-25 | 操作起点 | E2E自動化 | 001（移動 初期登録画面UI＝在庫検索一覧から遷移する登録画面） |
| 010 | IT-25 | 確認ダイアログ | E2E自動化 | 003（移動 登録確認モーダル） |
| 011 | IT-25 | 確認ダイアログ | E2E自動化 | 031（振替 商品検索モーダル） |
| 012 | IT-25 | 確認ダイアログ | E2E自動化 | 003（確認モーダル表示・代表） |
| 013 | IT-25 | 送信可否制御 | 対象外 | 本機能の送信ボタンはクライアント側の活性/非活性制御を持たない（検証はサーバ側） |
| 014 | IT-03 | 外部画面 | E2E自動化 | 070/071（管理ログイン外部画面誘導） |
| 015 | IT-03 | 画面遷移 | E2E自動化 | 010（移動登録成功→出庫承認申請） |
| 016 | IT-03 | 画面遷移 | E2E自動化 | 040（振替登録成功→振替承認待ち） |
| 017 | IT-03 | 画面遷移 | E2E自動化 | 052（店舗間移動更新→出庫承認画面） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 051（店舗内移動更新→完了画面連鎖） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 080（ステータス不整合リダイレクト） |
| 020 | IT-03 | 画面遷移 | 対象外 | 重複スタブ（014-019・051/052と同義の遷移観点で新規観測なし） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 070/071/072（URL直接アクセス未ログイン誘導） |
| 022 | IT-25 | HTTPステータス | E2E自動化 | 053（編集URL未存在404）/061（補助API400）/062（補助API404） |
| 023 | IT-25 | URL | E2E自動化 | 060/061/062（振替補助API dest-product-class-info のURL/HTTP応答） |
| 024,025 | IT-22 | 必須バリデーション | E2E自動化 | 020/021（入庫先・移動点数の必須） |
| 026-031 | IT-22 | 文字列長バリデーション | 対象外 | 本機能の入力に文字列長制約のある項目は無い（点数=整数・コード=参照値・メモは任意で上限観点未定義） |
| 032,034,035,036,038,039 | IT-22 | 数値バリデーション | E2E自動化 | 024/043（移動点数・振替点数 1未満）。行035（前提＝振替 登録処理）は振替点数の数値検証として043に写像 |
| 033 | IT-22 | 数値バリデーション | 手動/間接 | 026（前提＝移動 出庫承認申請の更新。欠品点数の数値検証＝移動点数超過/負数→更新されず同画面再表示。欠品点数のForm制約は要実機確認） |
| 037 | IT-22 | 数値バリデーション | 対象外 | 汎用数値スタブ（登録点数下限は024/043・編集欠品は026で代表）。新規観測なし |
| 040,041 | IT-22 | 文字種バリデーション | 対象外 | 数値点数・参照コードのみで文字種観点は非該当 |
| 042-050 | IT-22 | その他のバリデーション | 対象外 | 6項目の汎用「その他」スタブに本機能該当の追加細目なし（同一店舗・在庫超過は051-056で代表） |
| 051 | IT-22 | 相関バリデーション | E2E自動化 | 022（同一店舗・同一在庫区分の相関エラー） |
| 052,053,054 | IT-22 | 相関バリデーション | 対象外 | 汎用相関スタブ（本機能の相関は022/023/042で代表）。新規観測なし |
| 055 | IT-22 | DBとの相関バリデーション | E2E自動化 | 023（移動点数が在庫数超過＝DB在庫との相関） |
| 056 | IT-22 | DBとの相関バリデーション | 対象外 | 汎用DB相関スタブ（023で代表） |
| 057 | IT-22 | 必須制御 | E2E自動化 | 025（前提＝移動 登録処理。入庫先在庫区分未選択で同画面滞留＝移動側の必須制御に写像）。振替の承認通知先必須（Count(min:1)）は別途042 |
| 058 | IT-22 | 部分入力 | 手動/間接 | 026（前提＝移動 ピック・出庫承認申請画面（編集）の部分入力＝欠品点数の一部入力/不正値で同画面再表示）。振替登録の登録可能明細0件→例外は別途045で写像。DB不変は手動 |
| 059-074 | IT-23 | 検索条件 | 対象外 | 永続レコードの検索条件/件数はDB内部でブラウザ観測不能（登録は010/040で間接確認） |
| 075 | IT-23 | 実行結果 | E2E自動化 | 060（補助API dest-product-class-info 取得結果JSON） |
| 076 | IT-23 | 実行結果 | 手動/間接 | dtb_stock_move_transfer 本体レコードは保存成功(010)で間接確認（区分/値は手動） |
| 077,078,079 | IT-23 | 実行結果 | 対象外 | 明細/承認一覧/汎用の取得結果はDB内部で観測不能 |
| 080 | IT-26 | 登録内容 | 手動/間接 | 在庫減算・履歴レコード追加は010の保存成功で間接（内部値は手動） |
| 081 | IT-26 | 登録内容 | 手動/間接 | 011（移動先在庫なしのAction例外→save_error同画面で未登録を観測）。検証失敗の未登録は020-025/026の滞留でも代替確認。DB件数不変は手動 |
| 082 | IT-26 | 登録内容 | E2E自動化 | 010（移動登録レコード追加→保存メッセージ＋遷移） |
| 083 | IT-26 | 登録内容 | E2E自動化 | 040（振替登録レコード追加→保存メッセージ＋遷移） |
| 084 | IT-26 | 登録内容 | 手動/間接 | 移動編集の更新（欠品/メモ/入庫先在庫加算）は051で保存成功＝間接（在庫値は手動） |
| 085 | IT-23 | 登録内容 | 手動/間接 | 更新後レコード（欠品登録者・メモ）は051の保存成功で間接（DB値は手動） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 030（振替 初期登録画面の表示＝登録準備） |
| 087 | IT-26 | 登録内容 | 手動/間接 | 振替明細・在庫減算は040の保存成功で間接（内部値は手動） |
| 088 | IT-26 | 登録内容 | 対象外 | 補助APIは登録を行わない（060でAPI取得は別途カバー・登録観点としては非該当） |
| 089 | IT-26 | 登録内容 | 対象外 | dtb_stock_move_transfer 本体の内部カラム値はブラウザ観測不能 |
| 090 | IT-26 | 登録内容 | 対象外 | 明細テーブルの内部カラム値はブラウザ観測不能 |

集計（付帯表2と一致／IT行番号で表記）: 自動化 31（002,007,008,009,010,011,012,014,015,016,017,018,019,021,022,023,024/025の2行,032/034/035/036/038/039の6行,051,055,057,075,082,083,086）／ 手動・間接 10（003,006,033,058,076,080,081,084,085,087）／ 対象外 49（残り）。**未分類 0**（90行全量＝自動化31＋手動10＋対象外49）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

本機能は新規実装でありpf-eccube3の移行元が無いため、源は synthetic（UI/factory生成）または fixture を基本とする。`migration` は採らない。

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-09-ADMIN | dtb_member（管理者） | 在庫管理URLを許可する管理者1（ID/PWは config 既定。2FA OFF） | fixture(config既定) | 既存利用・撤去不要 | 全認証必須ケース |
| SEED-M04-09-MOVE-SRC | dtb_product_stock（移動元） | 在庫数>1の規格在庫1件以上。属する店舗・在庫区分が既知。productStockId が既知（GET productStockIds 用）。表示・検証のみで在庫は変更しない参照系 | fixture/synthetic | 専用・参照系（減算しない）。検証失敗ケースは非破壊 | 001,002,003,020,021,022,023,024 |
| SEED-M04-09-MOVE-NEW | dtb_stock_move_transfer（移動・新規登録(1)） | move_transfer_type=1・status=新規登録(1) の移動1件。編集画面表示用 | synthetic(010の登録結果を流用可) | 専用ID・参照系 | 050 |
| SEED-M04-09-MOVE-SAMESTORE | 移動・新規登録(店舗内) | 出庫元店舗＝入庫先店舗 の移動・status=新規登録(1)。更新で入庫完了に遷移する使い捨て | synthetic | 使い捨て・テスト毎再投入 | 051 |
| SEED-M04-09-MOVE-CROSSSTORE | 移動・新規登録(店舗間) | 出庫元≠入庫先 の移動・status=新規登録(1)。更新で出庫承認待ちに遷移する使い捨て | synthetic | 使い捨て・テスト毎再投入 | 052 |
| SEED-M04-09-MOVE-INBOUND | 移動・ステータス不適合 | 出庫承認申請ルートに不適合なステータス（例 入庫承認待ち(6)）の移動1件 | synthetic | 専用・参照系 | 080 |
| SEED-M04-09-TRANSFER-SRC | dtb_product_stock（振替元・本店EC） | 本店EC（getMallBaseInfo）所属・EC-CUBE在庫区分の規格在庫1件以上。在庫数>1。productStockId既知。振替先商品コードに対応する ProductClass/ProductStock も用意 | fixture/synthetic | 専用・参照系（040のみ使い捨て） | 030,031,040,041,042,043 |
| SEED-M04-09-PRODUCT-CLASS | dtb_product_class | 有効な product_class_id 1件（商品名・コード・基準価格設定済） | fixture | 専用・参照系 | 060 |

注: 共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用。移動/振替の登録成功・更新（010/040/051/052）は在庫減算・ステータス変更を伴うため使い捨てシードとし、識別接頭辞 `e2e_` 等で後始末する。productStockIds は GET クエリで渡せるため、表示・検証系は在庫検索一覧（M04-01）を経由せず直接URLで再現できる。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 移動 登録は「登録」ボタン押下→確認モーダル→確定で送信 | move_new.twig:220(#stock_move_register_btn type=button)＋:248(modal submit) / JS move_new.twig:41 | 登録ボタンはJSでモーダルを開くため、Playwrightはモーダル確定ボタンの押下が必要。JSバリデーションでモーダルが開かない条件があるか要実機確認 | 003,010,020-024 | 要確認(モーダルJS) |
| 2 | フォーム検証NGは同一画面再描画＋入力不備メッセージ | StockMoveController.php:214-221(save_error addError)・StockMoveNewType POST_SUBMIT(項目エラー) | save_error フラッシュ（admin.common.save_error=「保存に失敗しました」messages.ja.yaml:1399）と項目別エラー（same_store/在庫超過）の表示位置・併記有無を実機確認。エラーセレクタ(.invalid-feedback)はform_errors出力先で要実機確認 | 020,021,022,023,024,041,042,043 | 要確認(エラー表示位置/セレクタ) |
| 3 | 振替先商品コードは検索モーダルから設定（readonly） | transfer_new.twig:342(readonly)＋:344(検索ボタン) | dest_product_code は readonly のため直接 fill 不可。041の「未入力」は初期空のまま送信で再現するが、有効値の投入(040)はモーダル経由かJS介入が必要＝要実機確認 | 040,041 | 要確認(readonly/モーダル) |
| 4 | 移動点数/振替点数の上限は eccube_product_stock_change_quantity_max（正本 m04-09_...md:78 にパラメータ名明記） | StockMoveQuantityType.php:44-/StockTransferNewDetailType.php:58- LessThanOrEqual | 上限超過で点数エラー＝同画面再表示として観測可能（手動/間接）。固定値はパラメータ依存のためテストでハードコードしない（オラクル混入回避）。設定値を実機で取得し上限+1で超過させる手順は要確認 | 024,043 | 手動/間接(要確認: パラメータ値) |
| 5 | 全ルートは管理ログイン要・{id}系は未存在404 | StockMoveController.php:270(requirements id=\d+, MapEntity) | 404はMapEntity由来で静的確認済。未ログイン時のリダイレクト先（/login）はフレームワーク共通設定に従う想定（要実機確認） | 053,072 | 要確認(リダイレクト先) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（移動 初期登録） | move/new 表示・productStockIds受領 | 001,002 | カバー |
| 利用者視点の入口（移動 登録処理） | move/store POST検証→成功遷移/失敗再表示 | 010,011,020-025 | カバー（移動先在庫なしAction例外011・入庫先在庫区分必須025を追加） |
| 利用者視点の入口（移動 編集＝出庫承認申請） | 編集画面表示・404・ステータスリダイレクト | 050,053,080 | カバー |
| 利用者視点の入口（移動 編集確定＝update） | 店舗内→入庫完了/店舗間→出庫承認待ち（＋更新時の入力不備/Action例外→同画面再表示） | 051,052,026,055 | 部分カバー（正常遷移は051/052。欠品点数の数値検証=026・店舗間の承認通知先未選択=055は手動/間接・要実機確認） |
| 利用者視点の入口（振替 初期登録） | transfer/new 表示・商品検索モーダル・出庫元（本店EC）店舗/在庫区分表示 | 030,031,032 | カバー（出庫元表示=032を追加） |
| 利用者視点の入口（振替 登録処理） | transfer/store POST検証→成功遷移/失敗 | 040,041,042,043 | カバー |
| 利用者視点の入口（振替補助API） | dest-product-class-info 200/400/404 | 060,061,062 | カバー |
| フォーム項目（移動 StockMoveNewType） | 入庫先店舗/区分/移動点数/メモ/出庫元表示 | 001,002,020,021,025 | カバー（入庫先在庫区分必須=025を追加） |
| 権限・認可（全ルート管理ログイン要） | GET画面/補助API/POST系（store・update）の未ログイン誘導 | 070,071,072,073,074 | 部分カバー（GET画面070-072・補助API073は自動化。POST系074は未認証遷移挙動が要実機確認） |
| フォーム項目（振替 StockTransferNewType） | 承認通知先/振替先コード/振替点数/メモ | 030,041,042,043 | カバー |
| 追加バリデーション（移動） | 同一店舗同一区分・在庫超過 | 022,023 | カバー |
| プロセスフロー（移動 登録）#1-#6 | 初期化→検証→Action→成功save_complete＋遷移／失敗save_error | 001,010,020,011 | 部分カバー（成功010・検証失敗020。移動先在庫なしのAction例外→save_error=011は手動/間接・要シード。在庫減算・履歴の内部値は手動/間接） |
| プロセスフロー（移動 編集）#1-#3 | 表示→update→ステータス遷移＋遷移先（異常系含む） | 050,051,052,026,055 | 部分カバー（正常は050/051/052。欠品点数・承認通知先の異常系=026/055は手動/間接・要実機確認） |
| プロセスフロー（振替 登録）#1-#4 | 初期化→検証→Action→成功＋遷移／失敗save_error | 030,040,044,045 | 部分カバー（成功040。振替先コード不正=044・登録可能明細0件=045のAction例外→save_error同画面再表示は手動/間接・要確認） |
| フォーム項目（移動点数/振替点数 下限・上限） | 下限 GreaterThanOrEqual(1)／上限 LessThanOrEqual(eccube_product_stock_change_quantity_max) 超過エラー | 下限=024,043／上限=（実体ケース未設置） | 部分カバー（下限1未満は024/043で写像。上限超過は専用ケース無し＝手動/間接・要確認: パラメータ値。固定値はオラクル化しない＝付帯表4 #4） |
| ステータスと遷移（STATUS_TO_ROUTE） | 現ルート不適合→対応画面リダイレクト（2→出庫承認/3,4,7→完了/5→入庫承認申請/6→入庫承認の各分岐） | 080 | 部分カバー（080は不適合リダイレクトの代表1分岐。各ステータス分岐の個別確認は手動/間接・要特定ステータスシード） |
| 在庫増減・履歴記録のまとめ | 登録時減算・店舗内移動の入庫加算・履歴 | 010,051 | 手動/間接（DB在庫値・dtb_stock_history はブラウザ観測外） |
| トランザクション境界 | 例外時rollbackで一切確定しない | （Action例外→save_error同画面）020-024 | 手動/間接（rollback後のDB不変はDB確認＝対象外） |
| 状態・データ更新（各テーブル） | 本体/明細/履歴/在庫/承認一覧の更新 | 010,040,051 | 手動/間接（内部カラム値は観測外） |
| 分岐・遷移・例外（メッセージキー） | save_complete/save_error/同一店舗/在庫超過/通知先/コード必須/コード不正/明細0件/404 | 010,020,022,023,042,041,053,011,044,045 | 部分カバー（form検証エラー・404は自動化。save_errorのAction例外系=移動先在庫なし011/振替コード不正044/明細0件045は手動/間接・要シード） |
| 分岐（状態不整合 outbound/approval_status_error） | 承認系の状態エラー | （承認フェーズは本書対象外＝別機能） | 対象外（別機能委譲） |
| 関連設計への接続点（在庫検索一覧M04-01 遷移可否） | 複数店舗/区分/在庫0/権限の遷移判定 | （M04-01へ委譲） | 対象外（別機能委譲） |
| 承認・却下・差し戻し・欠品/差分確定フェーズ | 出庫承認/入庫承認/振替承認 | （本書対象外＝別M04機能） | 対象外（別機能委譲） |
| CSV/PDF・実績インポート・移動指示 | 帳票・取込 | （本書対象外＝別M04機能） | 対象外（別機能委譲） |
| ログ・監査（IT-20） | 出力抑止・識別子 | （観測外） | 対象外（理由付き） |

未カバー・部分カバーはいずれも理由（DB内部値=ブラウザ観測外・別機能（承認フェーズ/在庫検索一覧/CSV/PDF）へ委譲・上限パラメータ未確定・Action例外系/編集フォーム制約は要シード/要実機確認）を明記済み。正常系（010移動登録・040振替登録・051/052更新）と各異常系（020-026/041-045の検証エラー・011/044/045のAction例外→save_error・053の404・080のリダイレクト）が対で揃っている。本監査でのカバー過大主張（移動編集確定/編集#1-#3/上限/STATUS_TO_ROUTE/分岐メッセージ）は「部分カバー」へ是正し、自動化済みと手動/間接（要シード・要実機確認）を区別した。
