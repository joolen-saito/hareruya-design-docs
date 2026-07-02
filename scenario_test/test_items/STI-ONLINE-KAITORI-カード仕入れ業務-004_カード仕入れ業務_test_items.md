<!-- generated-by: hareruya-scenario-test-items -->
# SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務 シナリオテスト項目書

元シナリオ: `scenario_test/scenario/SCN-ONLINE-KAITORI-カード仕入れ業務-004_カード仕入れ業務.md`

- **業務**: ネット買取
- **業務フローキー**: ネット買取 / パターン4
- **主アクター**: 通販チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール
- **優先度**: P1

期待結果は画面表示、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果など、試験で観測できる結果で判定する。
TSV は10列固定で、Excel/Googleスプレッドシートへコードフェンス内を A1 に貼り付ける。

## 観点別件数

| テスト観点 | 件数 |
|---|---|
| CSV/帳票 | 2 |
| データ更新 | 2 |
| バリデーション | 1 |
| メール/通知 | 1 |
| 権限 | 1 |
| 異常制御 | 3 |

## テスト項目TSV

```tsv
シナリオID	テストID	フロー種別	テスト観点	優先度	テスト項目名	前提条件	入力データ/対象	操作手順/実行方法	期待結果
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-001	正常系	CSV/帳票	P1	正常系 #1: 通販チームが「カード仕入れ業務を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-004	"担当者: 通販チーム
1. 通販チームが m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. カード仕入れ業務を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-004 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-002	正常系	CSV/帳票	P1	正常系 #2: 通販チームが「打ち込みファイルとして、仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-004	"担当者: 通販チーム
1. 通販チームが M04-21（在庫変更CSV登録） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 打ち込みファイルとして、仕入れ対象のデータのステータスを仕入れ済みにステータス変更を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-003	正常系	データ更新	P1	正常系 #3: 通販チームが「打ち込みファイルとして、打ち込みファイルの作成を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-004	"担当者: 通販チーム
1. 通販チームが M04-01（在庫検索/一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 打ち込みファイルとして、打ち込みファイルの作成を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-004	正常系	メール/通知	P1	正常系 #4: 通販チームが「バックログ課題作成として、依頼メールを送付し」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-004	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. バックログ課題作成として、依頼メールを送付し を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-004 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-005	正常系	データ更新	P1	正常系 #5: 通販チームが「仕入れ業務へとして、仕入れ業務の「1.ネット買取仕入れ」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-004	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 仕入れ業務へとして、仕入れ業務の「1.ネット買取仕入れ を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-004 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-006	異常系	異常制御	P1	異常系 E1 #1: 通販チームが「本人確認書類に不備がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	"E1
商品コード=ST-CARD-ONLINE-KAITORI-004"	"担当者: 通販チーム
1. 通販チームが m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 条件「本人確認書類に不備がある」を満たすデータで実行する"	振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-007	異常系	異常制御	P1	異常系 E2 #2: 通販チームが「振込先情報不備または振込不可が発生する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	"E2
商品コード=ST-CARD-ONLINE-KAITORI-004"	"担当者: 通販チーム
1. 通販チームが M04-21（在庫変更CSV登録） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 条件「振込先情報不備または振込不可が発生する」を満たすデータで実行する"	支払完了にせず、支払保留状態として確認できる状態にする。確認対象: 支払状態、振込先情報、通知結果
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-008	異常系	権限	P1	異常系 E3 #3: 通販チームが「担当者に必要な権限がない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	"E3
商品コード=ST-CARD-ONLINE-KAITORI-004"	"担当者: 通販チーム
1. 通販チームが M04-01（在庫検索/一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 条件「担当者に必要な権限がない」を満たすデータで実行する"	処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-009	異常系	異常制御	P1	異常系 E4 #4: 通販チームが「検索条件に一致する対象データが存在しない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	"E4
商品コード=ST-CARD-ONLINE-KAITORI-004"	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 条件「検索条件に一致する対象データが存在しない」を満たすデータで実行する"	0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴
SCN-ONLINE-KAITORI-カード仕入れ業務-004	STI-ONLINE-KAITORI-004-010	異常系	バリデーション	P1	異常系 E5 #5: 通販チームが「入力値の必須項目不足または形式不正がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-カード仕入れ業務-004 カード仕入れ業務
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-004 / 会員番号=ST-MEMBER-ONLINE-KAITORI-004 / 商品コード=ST-CARD-ONLINE-KAITORI-004 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-004 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-004 / 振込先=テスト銀行 普通 1234567"	"E5
商品コード=ST-CARD-ONLINE-KAITORI-004"	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-004 を検索または指定する
3. 条件「入力値の必須項目不足または形式不正がある」を満たすデータで実行する"	エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無
```
