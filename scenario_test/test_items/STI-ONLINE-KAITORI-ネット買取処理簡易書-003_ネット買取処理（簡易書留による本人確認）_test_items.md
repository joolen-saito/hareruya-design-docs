<!-- generated-by: hareruya-scenario-test-items -->
# SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認） シナリオテスト項目書

元シナリオ: `scenario_test/scenario/SCN-ONLINE-KAITORI-ネット買取処理簡易書-003_ネット買取処理（簡易書留による本人確認）.md`

- **業務**: ネット買取
- **業務フローキー**: ネット買取 / パターン3
- **主アクター**: 通販チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール
- **優先度**: P1

期待結果は画面表示、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果など、試験で観測できる結果で判定する。
TSV は10列固定で、Excel/Googleスプレッドシートへコードフェンス内を A1 に貼り付ける。

## 観点別件数

| テスト観点 | 件数 |
|---|---|
| データ更新 | 6 |
| バリデーション | 1 |
| メール/通知 | 1 |
| 権限 | 1 |
| 照合 | 2 |
| 異常制御 | 3 |

## テスト項目TSV

```tsv
シナリオID	テストID	フロー種別	テスト観点	優先度	テスト項目名	前提条件	入力データ/対象	操作手順/実行方法	期待結果
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-001	正常系	照合	P1	正常系 #1: 通販チームが「ネット買取処理（簡易書留による本人確認）を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが 会員 — オンライン本人確認 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. ネット買取処理（簡易書留による本人確認）を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-002	正常系	データ更新	P1	正常系 #2: 通販チームが「ネット買取業務として、2-1から2-10までは同じ業務」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが M08-10（オンライン本人確認） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. ネット買取業務として、2-1から2-10までは同じ業務 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-003	正常系	データ更新	P1	正常系 #3: 通販チームが「簡易書留対応判定を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 簡易書留対応判定を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-004	正常系	データ更新	P1	正常系 #4: 通販チームが「簡易書留準備として、ステータスを「簡易書留送付済み」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが ネット買取管理 — 買取情報編集（買取詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 簡易書留準備として、ステータスを「簡易書留送付済み を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-005	正常系	メール/通知	P1	正常系 #5: 通販チームが「メール受領として、メールを受領する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. メール受領として、メールを受領する を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-006	正常系	データ更新	P1	正常系 #6: お客様が「簡易書留発送として、簡易書留を作成しお客様へ発送」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: お客様
1. お客様が F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 簡易書留発送として、簡易書留を作成しお客様へ発送 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-007	正常系	データ更新	P1	正常系 #7: お客様が「簡易書留受領として、お客様が簡易書留を受領」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: お客様
1. お客様が F05-03（ネット買取商品一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 簡易書留受領として、お客様が簡易書留を受領 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-008	正常系	照合	P1	正常系 #8: お客様が「簡易書留受領対応として、お客様が簡易書留を受領したことを追跡番号から確認」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: お客様
1. お客様が F05-04（ネット買取商品詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 簡易書留受領対応として、お客様が簡易書留を受領したことを追跡番号から確認 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-009	正常系	データ更新	P1	正常系 #9: 通販チームが「振込依頼作業へとして、振込依頼作業以降の業務を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-003	"担当者: 通販チーム
1. 通販チームが F05-05（ネット買取カート） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 振込依頼作業へとして、振込依頼作業以降の業務を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-003 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-010	異常系	異常制御	P1	異常系 E1 #1: 通販チームが「本人確認書類に不備がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	"E1
商品コード=ST-CARD-ONLINE-KAITORI-003"	"担当者: 通販チーム
1. 通販チームが 会員 — オンライン本人確認 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 条件「本人確認書類に不備がある」を満たすデータで実行する"	振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-011	異常系	異常制御	P1	異常系 E2 #2: 通販チームが「振込先情報不備または振込不可が発生する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	"E2
商品コード=ST-CARD-ONLINE-KAITORI-003"	"担当者: 通販チーム
1. 通販チームが M08-10（オンライン本人確認） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 条件「振込先情報不備または振込不可が発生する」を満たすデータで実行する"	支払完了にせず、支払保留状態として確認できる状態にする。確認対象: 支払状態、振込先情報、通知結果
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-012	異常系	権限	P1	異常系 E3 #3: 通販チームが「担当者に必要な権限がない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	"E3
商品コード=ST-CARD-ONLINE-KAITORI-003"	"担当者: 通販チーム
1. 通販チームが m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 条件「担当者に必要な権限がない」を満たすデータで実行する"	処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-013	異常系	異常制御	P1	異常系 E4 #4: 通販チームが「検索条件に一致する対象データが存在しない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	"E4
商品コード=ST-CARD-ONLINE-KAITORI-003"	"担当者: 通販チーム
1. 通販チームが ネット買取管理 — 買取情報編集（買取詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 条件「検索条件に一致する対象データが存在しない」を満たすデータで実行する"	0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴
SCN-ONLINE-KAITORI-ネット買取処理簡易書-003	STI-ONLINE-KAITORI-003-014	異常系	バリデーション	P1	異常系 E5 #5: 通販チームが「入力値の必須項目不足または形式不正がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理簡易書-003 ネット買取処理（簡易書留による本人確認）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-003 / 会員番号=ST-MEMBER-ONLINE-KAITORI-003 / 商品コード=ST-CARD-ONLINE-KAITORI-003 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-003 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-003 / 振込先=テスト銀行 普通 1234567"	"E5
商品コード=ST-CARD-ONLINE-KAITORI-003"	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-003 を検索または指定する
3. 条件「入力値の必須項目不足または形式不正がある」を満たすデータで実行する"	エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無
```
