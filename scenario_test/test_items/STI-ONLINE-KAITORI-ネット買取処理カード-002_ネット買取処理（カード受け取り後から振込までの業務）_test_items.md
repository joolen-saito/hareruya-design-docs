<!-- generated-by: hareruya-scenario-test-items -->
# SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務） シナリオテスト項目書

元シナリオ: `scenario_test/scenario/SCN-ONLINE-KAITORI-ネット買取処理カード-002_ネット買取処理（カード受け取り後から振込までの業務）.md`

- **業務**: ネット買取
- **業務フローキー**: ネット買取 / パターン2
- **主アクター**: 通販チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール
- **優先度**: P1

期待結果は画面表示、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果など、試験で観測できる結果で判定する。
TSV は10列固定で、Excel/Googleスプレッドシートへコードフェンス内を A1 に貼り付ける。

## 観点別件数

| テスト観点 | 件数 |
|---|---|
| CSV/帳票 | 4 |
| データ更新 | 10 |
| バリデーション | 1 |
| メール/通知 | 3 |
| 外部連携 | 2 |
| 権限 | 1 |
| 照合 | 1 |
| 異常制御 | 4 |

## テスト項目TSV

```tsv
シナリオID	テストID	フロー種別	テスト観点	優先度	テスト項目名	前提条件	入力データ/対象	操作手順/実行方法	期待結果
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-001	正常系	CSV/帳票	P1	正常系 #1: 通販チームが「ネット買取処理（カード受け取り後から振込までの業務）を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. ネット買取処理（カード受け取り後から振込までの業務）を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-002	正常系	CSV/帳票	P1	正常系 #2: 通販チームが「買取カード受領として、郵送されてきたカードを受領」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが M04-21（在庫変更CSV登録） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 買取カード受領として、郵送されてきたカードを受領 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-003	正常系	データ更新	P1	正常系 #3: 通販チームが「商品到着対応として、ネット買取画面より商品到着にステータス変更を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが M04-01（在庫検索/一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 商品到着対応として、ネット買取画面より商品到着にステータス変更を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-004	正常系	データ更新	P1	正常系 #4: 通販チームが「カード仕分け作業として、「価格が付く」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. カード仕分け作業として、「価格が付く を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-005	正常系	データ更新	P1	正常系 #5: 通販チームが「カード査定作業開始として、「価格が付く」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. カード査定作業開始として、「価格が付く を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-006	正常系	外部連携	P1	正常系 #6: 通販チームが「MTGバイヤー査定作業として、「査定前」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-03（ネット買取商品一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. MTGバイヤー査定作業として、「査定前 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-007	正常系	外部連携	P1	正常系 #7: 通販チームが「MTGバイヤー査定結果確認として、MTGバイヤーにて査定した査定金額が挿入される」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-04（ネット買取商品詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. MTGバイヤー査定結果確認として、MTGバイヤーにて査定した査定金額が挿入される を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-008	正常系	メール/通知	P1	正常系 #8: 通販チームが「査定内容メール通知として、手動メール通知にて査定内容について顧客にお知らせする」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-05（ネット買取カート） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 査定内容メール通知として、手動メール通知にて査定内容について顧客にお知らせする を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-009	正常系	データ更新	P1	正常系 #9: 通販チームが「査定結果確認として、査定内容をマイページの買取履歴より確認し」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが F05-06（ネット買取買取手続き〜完了） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 査定結果確認として、査定内容をマイページの買取履歴より確認し を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-010	正常系	メール/通知	P1	正常系 #10: 通販チームが「査定承諾メール処理として、査定承諾メール送付処理が行われる」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 査定承諾メール処理として、査定承諾メール送付処理が行われる を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-011	正常系	CSV/帳票	P1	正常系 #11: 通販チームが「査定承諾メール受領として、査定承諾メールを受け取る」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 査定承諾メール受領として、査定承諾メールを受け取る を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-012	正常系	照合	P1	正常系 #12: 通販チームが「承認状況確認として、承諾内容を確認する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが ネット買取管理 — 買取情報編集（買取詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 承認状況確認として、承諾内容を確認する を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-013	正常系	メール/通知	P1	正常系 #13: 通販チームが「売却するか判定として、売却すると選択されていた場合は、振込手続きを進める」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 売却するか判定として、売却すると選択されていた場合は、振込手続きを進める を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-014	正常系	CSV/帳票	P1	正常系 #14: 通販チームが「振込依頼として、振込依頼を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 振込依頼として、振込依頼を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-015	正常系	データ更新	P1	正常系 #15: 通販チームが「振込依頼ステータス変更として、振込依頼済みに変更」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが API ネット買取管理 — まとめて買取商品IDの取得 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 振込依頼ステータス変更として、振込依頼済みに変更 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-016	正常系	データ更新	P1	正常系 #16: 経理担当が「振込作業として、経理チームが振込作業を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 経理担当
1. 経理担当が API ネット買取管理 — ネット買取受注一覧取得 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 振込作業として、経理チームが振込作業を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-017	正常系	データ更新	P1	正常系 #17: 通販チームが「振込完了ステータス変更として、完了報告を受けたら、振込完了に変更」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが API ネット買取管理 — ネット買取受注コメント更新 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 振込完了ステータス変更として、完了報告を受けたら、振込完了に変更 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-018	正常系	データ更新	P1	正常系 #18: 通販チームが「カード仕入れ業務へとして、カード仕入れ業務へ」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが API ネット買取管理 — ネット買取受注ステータス更新 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. カード仕入れ業務へとして、カード仕入れ業務へ を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-019	正常系	データ更新	P1	正常系 #19: 通販チームが「返送作業として、返送作業を行い、買取しないカードを顧客に戻す」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが API ネット買取管理 — ネット買取注文の査定終了処理 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 返送作業として、返送作業を行い、買取しないカードを顧客に戻す を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-020	正常系	データ更新	P1	正常系 #20: 通販チームが「返送完了後として、買取しないカードを受領」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-002	"担当者: 通販チーム
1. 通販チームが API ネット買取管理 — 複数ネット買取IDからネット買取受注の商品一覧を取得 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 返送完了後として、買取しないカードを受領 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-002 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-021	異常系	異常制御	P1	異常系 E1 #1: 通販チームが「本人確認書類に不備がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E1
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「本人確認書類に不備がある」を満たすデータで実行する"	振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-022	異常系	異常制御	P1	異常系 E2 #2: 通販チームが「振込先情報不備または振込不可が発生する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E2
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが M04-21（在庫変更CSV登録） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「振込先情報不備または振込不可が発生する」を満たすデータで実行する"	支払完了にせず、支払保留状態として確認できる状態にする。確認対象: 支払状態、振込先情報、通知結果
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-023	異常系	権限	P1	異常系 E3 #3: 通販チームが「担当者に必要な権限がない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E3
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが M04-01（在庫検索/一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「担当者に必要な権限がない」を満たすデータで実行する"	処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-024	異常系	異常制御	P1	異常系 E4 #4: 通販チームが「検索条件に一致する対象データが存在しない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E4
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「検索条件に一致する対象データが存在しない」を満たすデータで実行する"	0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-025	異常系	異常制御	P1	異常系 E5 #5: 通販チームが「同一対象に対して同じ処理を重複実行する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E5
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「同一対象に対して同じ処理を重複実行する」を満たすデータで実行する"	二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴
SCN-ONLINE-KAITORI-ネット買取処理カード-002	STI-ONLINE-KAITORI-002-026	異常系	バリデーション	P1	異常系 E6 #6: 通販チームが「入力値の必須項目不足または形式不正がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理カード-002 ネット買取処理（カード受け取り後から振込までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-002 / 会員番号=ST-MEMBER-ONLINE-KAITORI-002 / 商品コード=ST-CARD-ONLINE-KAITORI-002 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-002 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-002 / 振込先=テスト銀行 普通 1234567"	"E6
商品コード=ST-CARD-ONLINE-KAITORI-002"	"担当者: 通販チーム
1. 通販チームが F05-03（ネット買取商品一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-002 を検索または指定する
3. 条件「入力値の必須項目不足または形式不正がある」を満たすデータで実行する"	エラー内容を表示し、業務データを中途半端に更新しない。確認対象: 入力エラー表示、対象データの更新有無
```
