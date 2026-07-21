# o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
| IT-16 | ファイル選択 |

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
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-007	IT-02	初期行数	P2	初期行数の結合確認	ステータスを更新するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でステータスを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータスを更新するを確認する
3. 画面表示と後続状態を確認する"	ネット買取受注のステータス・査定担当者・更新日時を保存し、ステータス変更履歴を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-008	IT-02	表示順	P2	表示順の結合確認	フリーコメントを更新するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でフリーコメントを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フリーコメントを更新するを確認する
3. 画面表示と後続状態を確認する"	ネット買取受注のフリーコメント（メモ）を保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-009	IT-25	更新抑止	P1	更新抑止の結合確認	個別入力商品を登録するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で個別入力商品を登録するの確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	商品規格に紐づかない買取商品を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-010	IT-12	内部情報	P1	内部情報の結合確認	メインカードを登録するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でメインカードを登録するの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	査定明細となるメインカード（商品規格・状態等）を登録すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-011	IT-15	機密情報	P1	機密情報の結合確認	買取用商品情報を検索・取得するを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で買取用商品情報を検索・取得するの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	査定入力に使う商品・カード・部門・固定価格部門などの情報を取得すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-012	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	表示要素を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体の表示要素はリポジトリ外のため本書では仕様確定しないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-013	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	モーダル・ポップアップを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体のモーダルは扱わないこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-014	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	買取合計金額を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で買取合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取合計金額を確認する
3. 画面表示と後続状態を確認する"	明細（メインカード）・個別入力商品の単価×数量等から、査定確定時にサーバ側で再計算して受注へ保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-015	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	受注と明細を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で受注と明細の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注と明細を確認する
3. 画面表示と後続状態を確認する"	査定確定（PUT buyOrder）は明細・個別入力商品を全置換するため、同じ受注に再送すると送信内容で上書きされるであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-016	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	合計金額を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 合計金額を確認する
3. 画面表示と後続状態を確認する"	受注の買取合計金額は明細から再計算した値で保存すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-017	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	ステータス履歴を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でステータス履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス履歴を確認する
3. 画面表示と後続状態を確認する"	ステータス更新時に履歴を1件追加すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-018	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	APIを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーはpf-apiのネット買取系API（ログイン、受注一覧取得、査定確定、ステータス更新、コメント更新、個別入力商品・メインカード登録）を利用すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-019	IT-25	一覧	P2	一覧の結合確認	成功結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功結果を確認する
3. 画面表示と後続状態を確認する"	参照APIはJSONで対象データを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-020	IT-12	画面表示データ	P2	画面表示データの結合確認	失敗結果を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗結果を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-021	IT-25	画面表示データ	P2	画面表示データの結合確認	再実行時を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で再実行時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 再実行時
3. 画面表示と後続状態を確認する"	参照APIは最新データを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-022	IT-12	画面表示データ	P2	画面表示データの結合確認	入庫を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-023	IT-25	画面表示データ	P2	画面表示データの結合確認	成功時出力を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	JSON応答、ネット買取受注の更新、明細・個別入力商品の作成、ステータス変更履歴の作成であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-024	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	失敗時出力を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	認証拒否・該当なし・入力不正・処理失敗のJSON応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-025	IT-25	フォーム送信	P1	フォーム送信の結合確認	副作用を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DB更新、ステータス変更履歴、管理画面・CSV・集計（M07系）への反映であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-026	IT-16	ファイル選択	P2	ファイル選択の結合確認	dtb_buy_orderを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でdtb_buy_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_buy_orderを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーの対象受注・ステータス更新・査定確定の中心データであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-027	IT-12	非同期更新	P1	非同期更新の結合確認	mtb_buy_order_statusを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）でmtb_buy_order_statusの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_buy_order_statusを確認する
3. 画面表示と後続状態を確認する"	ステータス存在確認・表示に使うこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-028	IT-12	エラー継続	P3	エラー継続の結合確認	登録/更新を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-029	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	認証トークンを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証トークンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証トークンを確認する
3. 画面表示と後続状態を確認する"	各APIで検証すること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-030	IT-25	件数上限	P2	件数上限の結合確認	査定明細・個別入力商品を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で査定明細・個別入力商品の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定明細・個別入力商品
3. 画面表示と後続状態を確認する"	数量・価格などの形式・必須は各API設計の検証に従うであること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-031	IT-25	欠損値	P2	欠損値の結合確認	認証トークン無効を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証トークン無効の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証トークン無効を確認する
3. 画面表示と後続状態を確認する"	各APIは認証エラーを返すこと。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-032	IT-25	データなし	P2	データなしの結合確認	認証済み管理者を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証済み管理者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証済み管理者を確認する
3. 画面表示と後続状態を確認する"	ネット買取受注の取得・査定確定・ステータス更新等を実行できること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-033	IT-25	URL	P2	URLの操作結果確認	認証失敗を試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で認証失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証失敗を確認する
3. 画面表示と後続状態を確認する"	認証エラーのJSON応答であること。
o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）	IT-O01-02-OTHER-MTG-BUYER-MTG-BUYER-ONLINE-PURCHASE-034	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	入力検証エラーを試験できる状態である	o01-02_other_mtg_buyer_mtg_buyer_online_purchase（その他_MTGバイヤー_ネット買取）（o01_02_other_mtg_buyer_mtg_buyer_online_purchase）で入力検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力検証エラー
3. 画面表示と後続状態を確認する"	エラー応答であること。
```

## テスト層による母集合除外（結合テスト対象外）

結合テスト観点マスタは各観点に「テスト層」を付与し、**結合層のみ**を機能×観点のクロス積対象とする。以下の層は本結合テストの母集合から除外し、それぞれの行き先で担保する（除外の根拠はマスタ `integration_test/integration-test-viewpoints.md` のテスト層列）。

| テスト層 | 除外観点数 | 行き先 |
|---|---:|---|
| UT | 108 | 単体テスト粒度（単項目境界値・単機能ロジック）→単体テストで担保。表内に保持しマーク。 |
| 委譲 | 143 | 期待値を設計書へ委譲（「記載通り」）→機能別チェックリストへ降格。per機能で設計書の具体値を引用してケース化。 |
| e2e | 33 | 見た目／ブラウザ挙動→e2e（Playwright）＋手動で担保。 |
| 非機能 | 5 | 方式／性能／基盤（ロック方式・リトライ間隔・MQクラスタ・レート制限等）→非機能・障害試験へ分離。 |
| 対象外 | 1 | 合否オラクルを持たない管理・スコーピング指示→テスト観点ではないため除外。 |
| 統合 | 6 | 他観点に統合吸収済み（冗長削除）。統合先が同一バグクラスを検出するため重複クロス積を回避。行は監査用に保持しクロス積からのみ除外（codex+fable5承認）。 |

## 対象外観点（結合層のうち本機能に非該当）

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / バリデーション / 相関バリデーション（IT-22） | 本機能に入力検証対象がないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 本機能に入力検証対象がないため |
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 本機能に更新処理がないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
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
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 正常終了（IT-09） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / バッチ / 異常終了（IT-10） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / フロント / 外部キャッシュ（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / フロント / 外部取得（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 抽出条件（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 正常応答（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 認証・認可（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 決済連携 / 外部決済（IT-10） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 決済連携 / 二重実行（IT-08） | 本機能はバッチ処理を起動しないため |
| ウェブアプリケーション / 決済連携 / 状態表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 決済連携 / 金額整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / Webhook・外部通知（IT-10, IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 下流転送（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 12 件は上記分類と同じ理由で対象外 |
