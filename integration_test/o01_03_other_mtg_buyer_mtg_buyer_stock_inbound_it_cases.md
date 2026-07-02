# o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力内容、出力抑止、識別子 |
| IT-02 | 初期行数、表示順 |
| IT-25 | 更新抑止、画面レイアウト、画面表示データ |
| IT-12 | 内部情報、画面レイアウト、画面表示データ |
| IT-01 | UI部品 |
| IT-27 | ファイル取得 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-001	IT-15	CSRF	P1	CSRFの結合確認	入庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	買取で取得した商品を在庫（ProductStock）へ登録すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-002	IT-15	未認証	P1	未認証の結合確認	MTGバイヤー入庫モードでステータスを進めるを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でMTGバイヤー入庫モードでステータスを進めるの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	買取受注のステータスを入庫待ち・入庫済みへ更新すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-003	IT-15	対象データ	P1	対象データの結合確認	管理画面で入庫を確定するを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で管理画面で入庫を確定するの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ステータスを入庫済みへ遷移させると、買取在庫を商品在庫へ反映し在庫履歴を作成する（内部サービス）であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-004	IT-20	出力抑止	P1	出力抑止の結合確認	一括入庫（バッチ）を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で一括入庫（バッチ）の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	入庫待ちの全受注を入庫済みへ遷移させ、入庫処理を実行すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-005	IT-20	識別子	P1	識別子の結合確認	入庫対象を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫対象の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ステータスが入庫待ちの買取受注を対象とすること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-006	IT-15	状態変化	P1	状態変化の結合確認	買取在庫と商品在庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で買取在庫と商品在庫の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	入庫により買取在庫の数量が商品在庫へ反映されるであること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-007	IT-20	出力内容	P3	出力内容の結合確認	ステータスと入庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でステータスと入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータスと入庫を確認する
3. 画面表示と後続状態を確認する"	入庫処理はステータス遷移に連動すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-008	IT-20	出力内容	P3	出力内容の結合確認	APIを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	入庫専用の外部APIは pf-api に存在しないこと。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-009	IT-20	出力内容	P3	出力内容の結合確認	バッチを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でバッチの確認に必要な条件を指定する	"1. 対象画面を表示する
2. バッチを確認する
3. 画面表示と後続状態を確認する"	入庫待ちの受注を対象とする自動入庫バッチが ec-cube-enterprise に存在すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-010	IT-20	出力内容	P3	出力内容の結合確認	成功結果を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で成功結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功結果を確認する
3. 画面表示と後続状態を確認する"	商品在庫の更新、買取在庫・在庫履歴の作成、ステータスの入庫済みへの更新であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-011	IT-20	出力内容	P3	出力内容の結合確認	入力を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	買取受注ID（入庫待ち）、ステータス更新、もしくは一括入庫の起動であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-012	IT-20	出力内容	P3	出力内容の結合確認	成功時出力を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	商品在庫の増加、買取在庫・在庫履歴の作成、ステータス入庫済みであること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-013	IT-20	出力内容	P3	出力内容の結合確認	失敗時出力を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	入庫未実行（入庫待ちのまま）であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-014	IT-20	出力内容	P3	出力内容の結合確認	副作用を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	商品在庫（ProductStock）の更新、在庫履歴の作成、ステータス変更であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-015	IT-20	出力内容	P3	出力内容の結合確認	dtb_buy_orderを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でdtb_buy_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_buy_orderを確認する
3. 画面表示と後続状態を確認する"	入庫対象の買取受注であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-016	IT-02	初期行数	P2	初期行数の結合確認	mtb_buy_order_statusを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でmtb_buy_order_statusの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_buy_order_statusを確認する
3. 画面表示と後続状態を確認する"	入庫待ち・入庫済み・未登録在庫あり等であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-017	IT-02	表示順	P2	表示順の結合確認	登録/更新を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-018	IT-25	更新抑止	P1	更新抑止の結合確認	認証済み管理者を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で認証済み管理者の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ステータス更新・入庫確定を実行できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-019	IT-12	内部情報	P1	内部情報の結合確認	入庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	買取で取得した商品を在庫（ProductStock）へ登録すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-020	IT-15	機密情報	P1	機密情報の結合確認	MTGバイヤー入庫モードでステータスを進めるを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でMTGバイヤー入庫モードでステータスを進めるの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	買取受注のステータスを入庫待ち・入庫済みへ更新すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-021	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	管理画面で入庫を確定するを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で管理画面で入庫を確定するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面で入庫を確定するを確認する
3. 画面表示と後続状態を確認する"	ステータスを入庫済みへ遷移させると、買取在庫を商品在庫へ反映し在庫履歴を作成する（内部サービス）であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-022	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	一括入庫（バッチ）を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で一括入庫（バッチ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括入庫（バッチ）を確認する
3. 画面表示と後続状態を確認する"	入庫待ちの全受注を入庫済みへ遷移させ、入庫処理を実行すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-023	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	入庫対象を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫対象の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫対象を確認する
3. 画面表示と後続状態を確認する"	ステータスが入庫待ちの買取受注を対象とすること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-024	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	買取在庫と商品在庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で買取在庫と商品在庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取在庫と商品在庫を確認する
3. 画面表示と後続状態を確認する"	入庫により買取在庫の数量が商品在庫へ反映されるであること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-025	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	認証済み管理者を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で認証済み管理者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証済み管理者を確認する
3. 画面表示と後続状態を確認する"	ステータス更新・入庫確定を実行できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-026	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	入庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫を確認する
3. 画面表示と後続状態を確認する"	買取で取得した商品を在庫（ProductStock）へ登録すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-027	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	MTGバイヤー入庫モードでステータスを進めるを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でMTGバイヤー入庫モードでステータスを進めるの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤー入庫モードでステータスを進めるを確認する
3. 画面表示と後続状態を確認する"	買取受注のステータスを入庫待ち・入庫済みへ更新すること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-028	IT-12	画面表示データ	P2	画面表示データの結合確認	mtb_buy_order_statusを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. mtb_buy_order_statusを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-029	IT-25	画面表示データ	P2	画面表示データの結合確認	登録/更新を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-030	IT-12	画面表示データ	P2	画面表示データの結合確認	認証済み管理者を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で画面表示データの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 認証済み管理者を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-031	IT-25	画面表示データ	P2	画面表示データの結合確認	入庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で入庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入庫を確認する
3. 画面表示と後続状態を確認する"	画面表示データの該当レコードが取得結果に含まれないこと。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-032	IT-12	画面表示データ	P2	画面表示データの結合確認	MTGバイヤー入庫モードでステータスを進めるを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でMTGバイヤー入庫モードでステータスを進めるの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤー入庫モードでステータスを進めるを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-033	IT-12	画面表示データ	P2	画面表示データの結合確認	管理画面で入庫を確定するを試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で管理画面で入庫を確定するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面で入庫を確定するを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-034	IT-12	画面表示データ	P2	画面表示データの結合確認	一括入庫（バッチ）を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で一括入庫（バッチ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括入庫（バッチ）を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-035	IT-12	画面表示データ	P2	画面表示データの結合確認	買取在庫と商品在庫を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で買取在庫と商品在庫の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取在庫と商品在庫を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-036	IT-01	UI部品	P3	UI部品の結合確認	入庫対象を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）でUI部品の対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 入庫対象を確認する
3. 画面表示と後続状態を確認する"	ステータスが入庫待ちの買取受注を対象とすること。
o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）	IT-O01-03-OTHER-MTG-BUYER-MTG-BUYER-STOCK-INBOUND-037	IT-27	ファイル取得	P2	ファイル取得の結合確認	失敗時出力を試験できる状態である	o01-03_other_mtg_buyer_mtg_buyer_stock_inbound（その他_MTGバイヤー_入庫モード）（o01_03_other_mtg_buyer_mtg_buyer_stock_inbound）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	ファイル取得の該当レコードが取得結果に含まれること。
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
