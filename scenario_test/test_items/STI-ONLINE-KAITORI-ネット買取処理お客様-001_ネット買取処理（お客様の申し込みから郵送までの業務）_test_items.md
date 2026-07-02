<!-- generated-by: hareruya-scenario-test-items -->
# SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務） シナリオテスト項目書

元シナリオ: `scenario_test/scenario/SCN-ONLINE-KAITORI-ネット買取処理お客様-001_ネット買取処理（お客様の申し込みから郵送までの業務）.md`

- **業務**: ネット買取
- **業務フローキー**: ネット買取 / パターン1
- **主アクター**: 通販チーム
- **関連システム**: EC-CUBE、MTGバイヤー、メール
- **優先度**: P1

期待結果は画面表示、ステータス、履歴、件数、金額、CSV/帳票、メール/通知、外部連携結果など、試験で観測できる結果で判定する。
TSV は10列固定で、Excel/Googleスプレッドシートへコードフェンス内を A1 に貼り付ける。

## 観点別件数

| テスト観点 | 件数 |
|---|---|
| CSV/帳票 | 3 |
| データ更新 | 4 |
| バリデーション | 2 |
| メール/通知 | 5 |
| 権限 | 1 |
| 照合 | 2 |
| 異常制御 | 3 |

## テスト項目TSV

```tsv
シナリオID	テストID	フロー種別	テスト観点	優先度	テスト項目名	前提条件	入力データ/対象	操作手順/実行方法	期待結果
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-001	正常系	データ更新	P1	正常系 #1: お客様が「ネット買取処理（お客様の申し込みから郵送までの業務）を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: お客様
1. お客様が 会員 — オンライン本人確認 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. ネット買取処理（お客様の申し込みから郵送までの業務）を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-002	正常系	データ更新	P1	正常系 #2: 通販チームが「買取申し込みカード選択として、顧客が買取ページにアクセスし」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが M08-10（オンライン本人確認） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 買取申し込みカード選択として、顧客が買取ページにアクセスし を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-003	正常系	照合	P1	正常系 #3: 通販チームが「買取申し込み処理として、カート内の買取希望の商品を確認し、買取依頼処理を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 買取申し込み処理として、カート内の買取希望の商品を確認し、買取依頼処理を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-004	正常系	メール/通知	P1	正常系 #4: 通販チームが「買取依頼受付メール受領として、買取依頼処理が完了すると」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが ネット買取管理 — 買取情報編集（買取詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 買取依頼受付メール受領として、買取依頼処理が完了すると を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-005	正常系	データ更新	P1	正常系 #5: 通販チームが「買取希望カード郵送として、買取希望のカードを顧客が晴れる屋に郵送する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 買取希望カード郵送として、買取希望のカードを顧客が晴れる屋に郵送する を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の処理ステータス、処理履歴、担当者、処理日時が確認できる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-006	正常系	照合	P1	正常系 #6: 通販チームが「オンライン本人確認として、PCの場合マイページ内のオンライン本人確認画面よりQRコードが」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. オンライン本人確認として、PCの場合マイページ内のオンライン本人確認画面よりQRコードが を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-007	正常系	メール/通知	P1	正常系 #7: 通販チームが「本人確認受付メール受領として、本人確認作業が完了すると」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが F05-03（ネット買取商品一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認受付メール受領として、本人確認作業が完了すると を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-008	正常系	メール/通知	P1	正常系 #8: 通販チームが「本人確認受付通知メール受領を行う」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが F05-04（ネット買取商品詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認受付通知メール受領を行う を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-009	正常系	メール/通知	P1	正常系 #9: お客様が「本人確認書類確認として、お客様に通知したメールと同じメールがネット買取に届くため」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: お客様
1. お客様が F05-05（ネット買取カート） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認書類確認として、お客様に通知したメールと同じメールがネット買取に届くため を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-010	正常系	データ更新	P1	正常系 #10: 通販チームが「本人確認書類確認判定として、身分証の内容に問題があったり、登録情報に問題がないか確認」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが F05-06（ネット買取買取手続き〜完了） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認書類確認判定として、身分証の内容に問題があったり、登録情報に問題がないか確認 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-011	正常系	CSV/帳票	P1	正常系 #11: 通販チームが「オンライン本人確認再登録として、本人情報変更し、再度オンライン本人確認申請」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが m07-02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export（管理画面_ネット買取管理_古物台帳入力用CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. オンライン本人確認再登録として、本人情報変更し、再度オンライン本人確認申請 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-012	正常系	メール/通知	P1	正常系 #12: 通販チームが「身分証に問題がない場合として、身分証と登録情報を確認し問題がなければ」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが m07-04_admin_online_purchase_purchase_manual_mail（管理画面_ネット買取管理_手動メール通知） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 身分証に問題がない場合として、身分証と登録情報を確認し問題がなければ を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の登録/更新後の値がシード値と一致し、更新履歴が1件追加される
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-013	正常系	CSV/帳票	P1	正常系 #13: お客様が「本人確認完了メール送付として、お客様にオンライン本人確認が完了したことをメール通知する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: お客様
1. お客様が m07-05_admin_online_purchase_purchase_csv_export_deposit（ネット買取管理_入金CSV） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認完了メール送付として、お客様にオンライン本人確認が完了したことをメール通知する を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-014	正常系	CSV/帳票	P1	正常系 #14: 通販チームが「本人確認完了メール受領として、本人確認完了メールを受領」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	商品コード=ST-CARD-ONLINE-KAITORI-001	"担当者: 通販チーム
1. 通販チームが m07-06_admin_online_purchase_purchase_online_product_list_csv_export（管理画面_ネット買取管理_買取商品一覧CSV出力） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 本人確認完了メール受領として、本人確認完了メールを受領 を実行する"	商品コード=ST-CARD-ONLINE-KAITORI-001 の照合結果が画面に表示され、不一致時は後続処理ボタンが実行不可になる
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-015	異常系	バリデーション	P1	異常系 E1 #1: 通販チームが「本人確認失敗メール送付として、身分証の更新や登録情報の変更と再申請をするようメール送付する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E1
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが 会員 — オンライン本人確認 を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「本人確認失敗メール送付として、身分証の更新や登録情報の変更と再申請をするようメール送付する」を満たすデータで実行する"	エラー内容を表示し、対象データを中途半端に更新しない。確認対象: 本人確認状態、後続処理ボタンの活性/非活性、通知結果
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-016	異常系	バリデーション	P1	異常系 E2 #2: 通販チームが「本人確認失敗メール受領として、本人確認失敗メールを受領」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E2
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが M08-10（オンライン本人確認） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「本人確認失敗メール受領として、本人確認失敗メールを受領」を満たすデータで実行する"	エラー内容を表示し、対象データを中途半端に更新しない。確認対象: 本人確認状態、後続処理ボタンの活性/非活性、通知結果
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-017	異常系	異常制御	P1	異常系 E3 #3: 通販チームが「本人確認書類に不備がある」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E3
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「本人確認書類に不備がある」を満たすデータで実行する"	振込または成立処理へ進めず、再確認状態にする。確認対象: 本人確認状態、買取ステータス、通知結果
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-018	異常系	権限	P1	異常系 E4 #4: 通販チームが「担当者に必要な権限がない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E4
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが ネット買取管理 — 買取情報編集（買取詳細） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「担当者に必要な権限がない」を満たすデータで実行する"	処理を開始させず、権限エラーを表示して対象データを更新しない。確認対象: 権限エラー表示、対象データの更新有無
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-019	異常系	異常制御	P1	異常系 E5 #5: 通販チームが「検索条件に一致する対象データが存在しない」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E5
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが F05-01（ネット買取トップページ） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「検索条件に一致する対象データが存在しない」を満たすデータで実行する"	0件結果を表示し、後続の更新操作へ進ませない。確認対象: 検索結果、更新履歴
SCN-ONLINE-KAITORI-ネット買取処理お客様-001	STI-ONLINE-KAITORI-001-020	異常系	異常制御	P1	異常系 E6 #6: 通販チームが「同一対象に対して同じ処理を重複実行する」を実行した結果を確認する	"元シナリオ: SCN-ONLINE-KAITORI-ネット買取処理お客様-001 ネット買取処理（お客様の申し込みから郵送までの業務）
業務: ネット買取
主アクター: 通販チーム
関連システム: EC-CUBE、MTGバイヤー、メール
シードデータ: 担当者アカウント=st-user-online-kaitori-001 / 会員番号=ST-MEMBER-ONLINE-KAITORI-001 / 商品コード=ST-CARD-ONLINE-KAITORI-001 / 数量=3 / 店舗=晴れる屋テスト店舗 / ネット買取申込番号=ST-OBUY-ONLINE-KAITORI-001 / 本人確認状態=確認済み / 査定対象商品=ST-CARD-ONLINE-KAITORI-001 / 振込先=テスト銀行 普通 1234567"	"E6
商品コード=ST-CARD-ONLINE-KAITORI-001"	"担当者: 通販チーム
1. 通販チームが F05-02（ネット買取商品検索） を開く
2. 商品コード=ST-CARD-ONLINE-KAITORI-001 を検索または指定する
3. 条件「同一対象に対して同じ処理を重複実行する」を満たすデータで実行する"	二重登録・二重更新を防止し、既存の処理結果を確認できる状態にする。確認対象: 対象データ、処理履歴
```
