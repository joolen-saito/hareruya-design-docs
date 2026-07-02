# o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力内容、出力抑止、識別子 |
| IT-02 | 初期行数、表示順 |
| IT-25 | 更新抑止、画面レイアウト、画面表示データ |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ |
| IT-01 | UI部品 |
| IT-27 | ファイル取得 |
| IT-03 | 外部画面、画面遷移 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-001	IT-15	CSRF	P1	CSRFの結合確認	ネット買取受注を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でネット買取受注の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	オンライン申込の買取受注であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-002	IT-15	未認証	P1	未認証の結合確認	メインカードを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でメインカードの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ネット買取査定の商品明細であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-003	IT-15	対象データ	P1	対象データの結合確認	個別入力商品を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で個別入力商品の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	商品規格に紐づかない手入力の買取商品であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-004	IT-20	出力抑止	P1	出力抑止の結合確認	MTGバイヤーでログインするを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でMTGバイヤーでログインするの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理者認証に成功すると、以降のネット買取APIで使う認証トークンを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-005	IT-20	識別子	P1	識別子の結合確認	査定対象のネット買取受注を取得するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定対象のネット買取受注を取得するの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	査定対象のネット買取受注一覧を取得すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-006	IT-15	状態変化	P1	状態変化の結合確認	査定結果を確定するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定結果を確定するの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注の明細（メインカード）・個別入力商品を作り直し、買取合計金額・ステータス・査定担当者・更新日時などを保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-007	IT-20	出力内容	P3	出力内容の結合確認	ステータスを更新するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でステータスを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータスを更新するを確認する
3. 画面表示と後続状態を確認する"	ネット買取受注のステータス・査定担当者・更新日時を保存し、ステータス変更履歴を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-008	IT-20	出力内容	P3	出力内容の結合確認	フリーコメントを更新するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でフリーコメントを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フリーコメントを更新するを確認する
3. 画面表示と後続状態を確認する"	ネット買取受注のフリーコメント（メモ）を保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-009	IT-20	出力内容	P3	出力内容の結合確認	個別入力商品を登録するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で個別入力商品を登録するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 個別入力商品を登録する
3. 画面表示と後続状態を確認する"	商品規格に紐づかない買取商品を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-010	IT-20	出力内容	P3	出力内容の結合確認	メインカードを登録するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でメインカードを登録するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メインカードを登録するを確認する
3. 画面表示と後続状態を確認する"	査定明細となるメインカード（商品規格・状態等）を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-011	IT-20	出力内容	P3	出力内容の結合確認	買取用商品情報を検索・取得するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で買取用商品情報を検索・取得するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取用商品情報を検索・取得する
3. 画面表示と後続状態を確認する"	査定入力に使う商品・カード・部門・固定価格部門などの情報を取得すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-012	IT-20	出力内容	P3	出力内容の結合確認	表示要素を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体の表示要素はリポジトリ外のため本書では仕様確定しないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-013	IT-20	出力内容	P3	出力内容の結合確認	モーダル・ポップアップを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体のモーダルは扱わないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-014	IT-20	出力内容	P3	出力内容の結合確認	買取合計金額を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で買取合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取合計金額を確認する
3. 画面表示と後続状態を確認する"	明細（メインカード）・個別入力商品の単価×数量等から、査定確定時にサーバ側で再計算して受注へ保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-015	IT-20	出力内容	P3	出力内容の結合確認	受注と明細を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で受注と明細の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注と明細を確認する
3. 画面表示と後続状態を確認する"	査定確定（PUT buyOrder）は明細・個別入力商品を全置換するため、同じ受注に再送すると送信内容で上書きされるであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-016	IT-02	初期行数	P2	初期行数の結合確認	合計金額を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 合計金額を確認する
3. 画面表示と後続状態を確認する"	受注の買取合計金額は明細から再計算した値で保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-017	IT-02	表示順	P2	表示順の結合確認	ステータス履歴を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でステータス履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス履歴を確認する
3. 画面表示と後続状態を確認する"	ステータス更新時に履歴を1件追加すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-018	IT-25	更新抑止	P1	更新抑止の結合確認	APIを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でAPIの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	MTGバイヤーはpf-apiのネット買取系API（ログイン、受注一覧取得、査定確定、ステータス更新、コメント更新、個別入力商品・メインカード登録）を利用すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-019	IT-12	内部情報	P1	内部情報の結合確認	成功結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功結果の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	参照APIはJSONで対象データを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-020	IT-15	機密情報	P1	機密情報の結合確認	失敗結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗結果の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	認証不可・対象なし・入力不正・保存例外は各API設計のHTTPステータスと本文形式に従うであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-021	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	再実行時を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で再実行時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 再実行時
3. 画面表示と後続状態を確認する"	参照APIは最新データを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-022	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	入庫を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫を確認する
3. 画面表示と後続状態を確認する"	ネット買取成立後の在庫登録（入庫）は本機能では行わないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-023	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	成功時出力を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	JSON応答、ネット買取受注の更新、明細・個別入力商品の作成、ステータス変更履歴の作成であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-024	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	失敗時出力を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	認証拒否・該当なし・入力不正・処理失敗のJSON応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-025	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	副作用を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DB更新、ステータス変更履歴、管理画面・CSV・集計（M07系）への反映であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-026	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	dtb_buy_orderを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でdtb_buy_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_buy_orderを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーの対象受注・ステータス更新・査定確定の中心データであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-027	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	mtb_buy_order_statusを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でmtb_buy_order_statusの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_buy_order_statusを確認する
3. 画面表示と後続状態を確認する"	ステータス存在確認・表示に使うこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-028	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	登録/更新を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-029	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	認証トークンを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証トークンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証トークンを確認する
3. 画面表示と後続状態を確認する"	各APIで検証すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-030	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	査定明細・個別入力商品を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定明細・個別入力商品の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定明細・個別入力商品
3. 画面表示と後続状態を確認する"	数量・価格などの形式・必須は各API設計の検証に従うであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-031	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	認証トークン無効を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証トークン無効の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証トークン無効を確認する
3. 画面表示と後続状態を確認する"	各APIは認証エラーを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-032	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	認証済み管理者を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証済み管理者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証済み管理者を確認する
3. 画面表示と後続状態を確認する"	ネット買取受注の取得・査定確定・ステータス更新等を実行できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-033	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	認証失敗を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証失敗を確認する
3. 画面表示と後続状態を確認する"	認証エラーのJSON応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-034	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	入力検証エラーを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で入力検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力検証エラー
3. 画面表示と後続状態を確認する"	エラー応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-035	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	保存例外を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で保存例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存例外
3. 画面表示と後続状態を確認する"	失敗応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-036	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	ネット買取受注を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でネット買取受注の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ネット買取受注を確認する
3. 画面表示と後続状態を確認する"	オンライン申込の買取受注であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-037	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	メインカードを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でメインカードの確認に必要な条件を指定する	"1. 対象画面を表示する
2. メインカードを確認する
3. 画面表示と後続状態を確認する"	ネット買取査定の商品明細であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-038	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	個別入力商品を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で個別入力商品の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 個別入力商品
3. 画面表示と後続状態を確認する"	商品規格に紐づかない手入力の買取商品であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-039	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	MTGバイヤーでログインするを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でMTGバイヤーでログインするの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーでログインするを確認する
3. 画面表示と後続状態を確認する"	管理者認証に成功すると、以降のネット買取APIで使う認証トークンを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-040	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	査定対象のネット買取受注を取得するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定対象のネット買取受注を取得するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定対象のネット買取受注を取得するを確認する
3. 画面表示と後続状態を確認する"	査定対象のネット買取受注一覧を取得すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-041	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	査定結果を確定するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定結果を確定するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定結果を確定するを確認する
3. 画面表示と後続状態を確認する"	受注の明細（メインカード）・個別入力商品を作り直し、買取合計金額・ステータス・査定担当者・更新日時などを保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-042	IT-12	画面表示データ	P2	画面表示データの結合確認	ステータス履歴を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. ステータス履歴を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-043	IT-25	画面表示データ	P2	画面表示データの結合確認	APIを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーはpf-apiのネット買取系API（ログイン、受注一覧取得、査定確定、ステータス更新、コメント更新、個別入力商品・メインカード登録）を利用すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-044	IT-12	画面表示データ	P2	画面表示データの結合確認	成功結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で画面表示データの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 成功結果を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-045	IT-25	画面表示データ	P2	画面表示データの結合確認	失敗結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗結果を確認する
3. 画面表示と後続状態を確認する"	画面表示データの該当レコードが取得結果に含まれないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-046	IT-12	画面表示データ	P2	画面表示データの結合確認	再実行時を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で再実行時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 再実行時
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-047	IT-12	画面表示データ	P2	画面表示データの結合確認	入庫を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-048	IT-12	画面表示データ	P2	画面表示データの結合確認	成功時出力を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-049	IT-12	画面表示データ	P2	画面表示データの結合確認	副作用を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-050	IT-01	UI部品	P3	UI部品の結合確認	ステータスを更新するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でUI部品の対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. ステータスを更新するを確認する
3. 画面表示と後続状態を確認する"	ネット買取受注のステータス・査定担当者・更新日時を保存し、ステータス変更履歴を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-051	IT-27	ファイル取得	P2	ファイル取得の結合確認	受注と明細を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で受注と明細の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注と明細を確認する
3. 画面表示と後続状態を確認する"	ファイル取得の該当レコードが取得結果に含まれること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-052	IT-03	外部画面	P2	外部画面の操作結果確認	APIを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーはpf-apiのネット買取系API（ログイン、受注一覧取得、査定確定、ステータス更新、コメント更新、個別入力商品・メインカード登録）を利用すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-053	IT-12	エラー継続	P3	エラー継続の結合確認	成功結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功結果を確認する
3. 画面表示と後続状態を確認する"	参照APIはJSONで対象データを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-054	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗結果を確認する
3. 画面表示と後続状態を確認する"	認証不可・対象なし・入力不正・保存例外は各API設計のHTTPステータスと本文形式に従うであること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / バリデーション / 相関バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 本機能に入力検証対象がないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 本機能に更新処理がないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
| データベースアクセス / DB制御 / 更新順序（IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / 排他制御（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / ロールバック（IT-06） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 増加処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 減少処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 実数反映（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 按分処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 更新履歴（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 算出値表示（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 調整 / 減少理由（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 通知 / 復活通知（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動開始（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動完了（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 例外処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 区分変更（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 結合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 分割（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / バッチ / DB影響（IT-26） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-18, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / 参照系機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 受信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 受信処理 / バリデーション（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 画面表示 / 表示結果（IT-12, IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-12, IT-14, IT-16, IT-21, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / 遷移結果（IT-03, IT-13, IT-25） | 本機能に該当する画面操作起点がないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
| ウェブアプリケーション / ログ出力 / ブラウザ（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 取消（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / フロント / 表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / フロント / リンク（IT-25） | 本機能に該当する画面操作起点がないため |
| ウェブアプリケーション / 管理画面-公開側 / 反映（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル取込 / 実行結果（IT-16） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル出力 / 実行結果（IT-27） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-19, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 18 件は上記分類と同じ理由で対象外 |
