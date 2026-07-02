# o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力内容、出力抑止、識別子 |
| IT-02 | 初期行数、表示順 |
| IT-25 | UI部品、データなし、件数上限、更新抑止、画面レイアウト、画面表示データ |
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
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-001	IT-15	CSRF	P1	CSRFの結合確認	店頭買取受注を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で店頭買取受注の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同名テーブルであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-002	IT-15	未認証	P1	未認証の結合確認	ステータスマスタを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータスマスタの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同名テーブルであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-003	IT-15	対象データ	P1	対象データの結合確認	店頭買取ステータスを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で店頭買取ステータスの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	店頭買取の進行状態であること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-004	IT-20	出力抑止	P1	出力抑止の結合確認	MTGバイヤーでログインするを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーでログインするの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	管理者認証に成功すると、以降の店頭買取APIで使う認証トークンを返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-005	IT-20	識別子	P1	識別子の結合確認	MTGバイヤーで査定対象を取得するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで査定対象を取得するの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	査定対象の店頭買取受注一覧を取得すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-006	IT-15	状態変化	P1	状態変化の結合確認	MTGバイヤーで査定結果を確定するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで査定結果を確定するの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	受注の既存明細・個別入力商品・在庫・在庫履歴を作り直し、ステータス、買取合計金額、査定担当者、更新日時などを保存すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-007	IT-20	出力内容	P3	出力内容の結合確認	MTGバイヤーでステータスを更新するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーでステータスを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーでステータスを更新するを確認する
3. 画面表示と後続状態を確認する"	店頭買取受注のステータス、査定担当者、更新日時を保存し、ステータス変更履歴を登録すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-008	IT-20	出力内容	P3	出力内容の結合確認	MTGバイヤーでフリーコメントを更新するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーでフリーコメントを更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーでフリーコメントを更新するを確認する
3. 画面表示と後続状態を確認する"	店頭買取受注のフリーコメントを保存すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-009	IT-20	出力内容	P3	出力内容の結合確認	MTGバイヤーで本人確認状態を更新するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで本人確認状態を更新するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーで本人確認状態を更新するを確認する
3. 画面表示と後続状態を確認する"	店頭買取受注に紐づく本人確認情報を更新すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-010	IT-20	出力内容	P3	出力内容の結合確認	MTGバイヤーで買取用商品情報を検索・取得するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで買取用商品情報を検索・取得するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーで買取用商品情報を検索・取得する
3. 画面表示と後続状態を確認する"	査定入力に使う商品、カード、部門、固定価格部門などの情報を取得すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-011	IT-20	出力内容	P3	出力内容の結合確認	表示要素を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体の表示要素はリポジトリ外のため本書では仕様確定しないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-012	IT-20	出力内容	P3	出力内容の結合確認	モーダル・ポップアップを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤー本体のモーダルは扱わないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-013	IT-20	出力内容	P3	出力内容の結合確認	査定対象の抽出を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で査定対象の抽出の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定対象の抽出を確認する
3. 画面表示と後続状態を確認する"	店頭買取受注一覧取得APIは、商品到着、査定中、振込前、保留、査定再開の状態にある受注を対象にすること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-014	IT-20	出力内容	P3	出力内容の結合確認	店舗絞り込みを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で店舗絞り込みの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗絞り込みを確認する
3. 画面表示と後続状態を確認する"	認証した管理者に所属店舗がある場合は、その店舗に一致する店頭買取受注だけを返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-015	IT-20	出力内容	P3	出力内容の結合確認	明細の全置換を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で明細の全置換の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 明細の全置換を確認する
3. 画面表示と後続状態を確認する"	査定結果確定APIは、既存の明細・個別入力商品・在庫・在庫履歴を削除して、送信された明細で作り直すであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-016	IT-02	初期行数	P2	初期行数の結合確認	個別入力商品の扱いを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で個別入力商品の扱いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 個別入力商品の扱い
3. 画面表示と後続状態を確認する"	商品規格IDが空の明細は個別入力商品として登録すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-017	IT-02	表示順	P2	表示順の結合確認	買取合計金額を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で買取合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取合計金額を確認する
3. 画面表示と後続状態を確認する"	送信明細の買取単価×数量を合算し、10円単位へ切り上げるであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-018	IT-25	更新抑止	P1	更新抑止の結合確認	ステータス変更履歴を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータス変更履歴の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	更新前後でステータスが異なる場合に履歴を登録すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-019	IT-12	内部情報	P1	内部情報の結合確認	外部運用を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で外部運用の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	査定表印刷、本人確認の実作業、出金、バーコード印刷、Backlog、スマレジ、仕入れ統合作業はEC-CUBE側で確認できる範囲外の運用を正とすること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-020	IT-15	機密情報	P1	機密情報の結合確認	フリーコメントを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でフリーコメントの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	店頭買取受注のフリーコメントへ保存すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-021	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	本人確認情報を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で本人確認情報の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本人確認情報を確認する
3. 画面表示と後続状態を確認する"	店頭買取受注に紐づく本人確認状態を更新すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-022	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	認証不可を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で認証不可の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 認証不可を確認する
3. 画面表示と後続状態を確認する"	APIは認証拒否とし、店頭買取データを返さず更新しないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-023	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	査定対象が0件を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で査定対象が0件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定対象が0件を確認する
3. 画面表示と後続状態を確認する"	店頭買取受注一覧取得APIは空配列を返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-024	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	受注IDが存在しないを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で受注IDが存在しないの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注IDが存在しないを確認する
3. 画面表示と後続状態を確認する"	詳細更新、ステータス更新、コメント更新、本人確認更新は該当なしとして扱うこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-025	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	明細が空を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で明細が空の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 明細が空を確認する
3. 画面表示と後続状態を確認する"	詳細更新APIは入力不正とし、既存明細・在庫を削除しないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-026	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	同じステータスで詳細更新を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で同じステータスで詳細更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同じステータスで詳細更新を確認する
3. 画面表示と後続状態を確認する"	明細・個別入力商品・在庫・在庫履歴は送信内容で作り直すであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-027	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	同時更新を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	専用の楽観ロック・悲観ロックは持たないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-028	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	参照時点を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で参照時点の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーの一覧取得、商品情報取得、管理画面の一覧・詳細・CSVは、それぞれ実行時点で永続化済みのデータを参照すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-029	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	査定結果と管理画面を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で査定結果と管理画面の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 査定結果と管理画面を確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーで確定した受注明細、個別入力商品、在庫、在庫履歴、ステータス、査定担当者、更新日時は、保存成功後に管理画面の店頭買取詳細・履歴・CSVの参照元になること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-030	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	在庫と履歴を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で在庫と履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫と履歴を確認する
3. 画面表示と後続状態を確認する"	詳細更新時に商品規格ごとの数量で店頭買取受注在庫を作り直し、対応する在庫履歴を登録すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-031	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	ステータスと集計を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータスと集計の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータスと集計を確認する
3. 画面表示と後続状態を確認する"	買取成立、ダブルチェック済、データ出力済など集計対象のステータスへ変わると、店頭買取集計やCSV出力の対象になること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-032	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	外部運用との整合を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で外部運用との整合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部運用との整合を確認する
3. 画面表示と後続状態を確認する"	Backlog、スマレジ、Excelマクロ、バーコード印刷は本リポジトリ内で直接整合を保証しないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-033	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	同時更新を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	DB行ロックを使った査定占有は確認できないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-034	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	APIを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でAPIの確認に必要な条件を指定する	"1. 対象画面を表示する
2. APIを確認する
3. 画面表示と後続状態を確認する"	MTGバイヤーはpf-apiのA06系APIを利用すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-035	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	成功結果を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で成功結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功結果を確認する
3. 画面表示と後続状態を確認する"	参照APIはJSONで対象データを返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-036	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	失敗結果を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で失敗結果の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗結果を確認する
3. 画面表示と後続状態を確認する"	認証不可、対象なし、入力不正、保存例外は各API設計のHTTPステータスと本文形式に従うであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-037	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	バッチを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でバッチの確認に必要な条件を指定する	"1. 対象画面を表示する
2. バッチを確認する
3. 画面表示と後続状態を確認する"	店頭買取集計はotcBuyOrder:batch updateSummaryで実行されるであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-038	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	再実行時を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で再実行時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 再実行時
3. 画面表示と後続状態を確認する"	参照APIは実行時点の最新データを返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-039	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	入力を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	認証トークン、店頭買取受注ID、ステータスID、査定明細、コメント、本人確認情報、商品検索条件などであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-040	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	成功時出力を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	JSON応答、店頭買取受注の更新、明細・個別入力商品・在庫・在庫履歴の作成、ステータス変更履歴の作成であること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-041	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	店頭買取受注を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で店頭買取受注の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店頭買取受注を確認する
3. 画面表示と後続状態を確認する"	同名テーブルであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-042	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ステータスマスタを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータスマスタの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータスマスタを確認する
3. 画面表示と後続状態を確認する"	同名テーブルであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-043	IT-25	UI部品	P2	UI部品の結合確認	店頭買取ステータスを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で店頭買取ステータスの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店頭買取ステータスを確認する
3. 画面表示と後続状態を確認する"	店頭買取の進行状態であること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-044	IT-25	UI部品	P2	UI部品の結合確認	MTGバイヤーでログインするを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーでログインするの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーでログインするを確認する
3. 画面表示と後続状態を確認する"	管理者認証に成功すると、以降の店頭買取APIで使う認証トークンを返すこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-045	IT-25	UI部品	P2	UI部品の結合確認	MTGバイヤーで査定対象を取得するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで査定対象を取得するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーで査定対象を取得するを確認する
3. 画面表示と後続状態を確認する"	査定対象の店頭買取受注一覧を取得すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-046	IT-25	UI部品	P2	UI部品の結合確認	MTGバイヤーで査定結果を確定するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで査定結果を確定するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーで査定結果を確定するを確認する
3. 画面表示と後続状態を確認する"	受注の既存明細・個別入力商品・在庫・在庫履歴を作り直し、ステータス、買取合計金額、査定担当者、更新日時などを保存すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-047	IT-12	画面表示データ	P2	画面表示データの結合確認	モーダル・ポップアップを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-048	IT-25	画面表示データ	P2	画面表示データの結合確認	査定対象の抽出を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で画面表示データの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 査定対象の抽出を確認する
3. 画面表示と後続状態を確認する"	店頭買取受注一覧取得APIは、商品到着、査定中、振込前、保留、査定再開の状態にある受注を対象にすること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-049	IT-12	画面表示データ	P2	画面表示データの結合確認	店舗絞り込みを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で画面表示データの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 店舗絞り込みを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-050	IT-25	画面表示データ	P2	画面表示データの結合確認	明細の全置換を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で明細の全置換の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 明細の全置換を確認する
3. 画面表示と後続状態を確認する"	画面表示データの該当レコードが取得結果に含まれないこと。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-051	IT-12	画面表示データ	P2	画面表示データの結合確認	個別入力商品の扱いを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で個別入力商品の扱いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 個別入力商品の扱い
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-052	IT-12	画面表示データ	P2	画面表示データの結合確認	買取合計金額を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で買取合計金額の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取合計金額を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-053	IT-12	画面表示データ	P2	画面表示データの結合確認	ステータス変更履歴を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータス変更履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス変更履歴を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-054	IT-25	画面表示データ	P2	画面表示データの結合確認	外部運用を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）で外部運用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 外部運用を確認する
3. 画面表示と後続状態を確認する"	査定表印刷、本人確認の実作業、出金、バーコード印刷、Backlog、スマレジ、仕入れ統合作業はEC-CUBE側で確認できる範囲外の運用を正とすること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-055	IT-12	画面表示データ	P2	画面表示データの結合確認	フリーコメントを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でフリーコメントの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フリーコメントを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-056	IT-01	UI部品	P3	UI部品の結合確認	バッチを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でUI部品の対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. バッチを確認する
3. 画面表示と後続状態を確認する"	店頭買取集計はotcBuyOrder:batch updateSummaryで実行されるであること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-057	IT-27	ファイル取得	P2	ファイル取得の結合確認	MTGバイヤーで査定対象を取得するを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でMTGバイヤーで査定対象を取得するの確認に必要な条件を指定する	"1. 対象画面を表示する
2. MTGバイヤーで査定対象を取得するを確認する
3. 画面表示と後続状態を確認する"	ファイル取得の該当レコードが取得結果に含まれること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-058	IT-25	件数上限	P2	件数上限の結合確認	ステータス変更履歴を試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でステータス変更履歴の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス変更履歴を確認する
3. 画面表示と後続状態を確認する"	更新前後でステータスが異なる場合に履歴を登録すること。
o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）	IT-O01-01-OTHER-MTG-BUYER-MTG-BUYER-STORE-PURCHASE-059	IT-25	データなし	P2	データなしの結合確認	フリーコメントを試験できる状態である	o01-01_other_mtg_buyer_mtg_buyer_store_purchase（その他_MTGバイヤー_店頭買取）（o01_01_other_mtg_buyer_mtg_buyer_store_purchase）でフリーコメントの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フリーコメントを確認する
3. 画面表示と後続状態を確認する"	店頭買取受注のフリーコメントへ保存すること。
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
| ウェブアプリケーション / 画面表示 / 表示結果（IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ウェブアプリケーション / フロント / 表示（IT-25） | 本機能は対象の外部I/Fを扱わないため |
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
