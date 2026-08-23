# 実装乖離監査 — 0408_基本設計仕様書(バッチ_会員).html

- 正本: `excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **493要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 28 | ○ |
| 実装違い | 実装はあるが設計と違う | 6 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 4 | — |
| 設計どおり | 設計どおり実装されている | 289 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 155 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 11 | — |
| **合計** | | **493** | |

## 不具合 5件（P1 1 / P2 1 / P3 3）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 29件は重複として代表へ折り畳んだ（判定そのものは 34件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R002 | リニューアル時パスワードリセットメール送信 | 未実装 | IO | P1 | リニューアル対象の会員へ、パスワード再設定を促す案内メールが送られる。 |
| sheet-4-R039 | ポイント失効 | 実装違い | ふるまい | P2 | スマレジのポイント増減が失敗した会員は、その回は保有ポイントの更新もポイント履歴への失効記録も行われず、翌日以降の実行に持ち越される |
| sheet-4-R048 | ポイント失効 | 実装違い | ふるまい | P3 | 対象会員を1件ずつ順に処理し、1件を処理し終えるごとに0.1秒の待ち時間を置いてから次の会員へ進む |
| sheet-6-R031 | 必須項目が空欄の会員発生通知 | 実装違い | IO | P3 | 管理者へ送る通知メールの各会員の行で、電話番号の1列目には tel01、2列目には tel02、3列目には tel03 の見出し語を付けて値を並べる。 |
| sheet-7-R051 | ポイント差分発生通知 | 実装違い | IO | P3 | 通知先メールアドレスをカンマ区切りで複数設定した場合、その全ての宛先へポイント差分発生通知メールが届く |

### sheet-3-R002 リニューアル時パスワードリセットメール送信 — 未実装／IO／P1

- 正本: sheet-3（リニューアル時パスワードリセットメール送信） HTML行 1035 付近
- 正本引用: 「リニューアル時にパスワード再設定を促すメールを送信する」
- 設計期待値: リニューアル対象の会員へ、パスワード再設定を促す案内メールが送られる。
- 画像確認: 本シートは画像0枚（images/ に sheet-3 の図は存在しない）。文面はシート本文のテキストで確認。
- 実装参照: `src/Eccube/Service/MailService.php:643;src/Eccube/Resource/template/default/Mail/customer_migration.twig:1`
- 実装実態: ee に会員移行（リニューアル時パスワードリセット）メールを送る処理が無い。src/Eccube/Service/MailService.php の送信メソッド一覧に会員移行メールの送信は無く（:643 はパスワード再設定通知メールで、会員本人が再設定を申請したときだけ送る）、src/Eccube/Command/ 配下にも該当する会員バッチが無い。文面（app/DoctrineMigrations/Version20251204111453.php:1493-1552 と src/Eccube/Resource/template/default/Mail/customer_migration.twig）だけが登録済みで、送る側が無い。
- 同じ実装実態でまとまる要求: sheet-3-R004（リニューアル時パスワードリセットメール送信）、sheet-3-R012（リニューアル時パスワードリセットメール送信）、sheet-3-R013（リニューアル時パスワードリセットメール送信）、sheet-3-R014（リニューアル時パスワードリセットメール送信）、sheet-3-R017（リニューアル時パスワードリセットメール送信）、sheet-3-R019（リニューアル時パスワードリセットメール送信）、sheet-3-R023（リニューアル時パスワードリセットメール送信）、sheet-3-R026（リニューアル時パスワードリセットメール送信）、sheet-3-R027（リニューアル時パスワードリセットメール送信）、sheet-3-R030（リニューアル時パスワードリセットメール送信）、sheet-3-R091（リニューアル時パスワードリセットメール送信）、sheet-3-R094（リニューアル時パスワードリセットメール送信）、sheet-3-R011（リニューアル時パスワードリセットメール送信）、sheet-3-R015（リニューアル時パスワードリセットメール送信）、sheet-3-R031（リニューアル時パスワードリセットメール送信）、sheet-3-R080（リニューアル時パスワードリセットメール送信）、sheet-3-R081（リニューアル時パスワードリセットメール送信）、sheet-3-R082（リニューアル時パスワードリセットメール送信）、sheet-3-R083（リニューアル時パスワードリセットメール送信）、sheet-3-R084（リニューアル時パスワードリセットメール送信）、sheet-3-R085（リニューアル時パスワードリセットメール送信）、sheet-3-R087（リニューアル時パスワードリセットメール送信）、sheet-3-R088（リニューアル時パスワードリセットメール送信）、sheet-3-R093（リニューアル時パスワードリセットメール送信）、sheet-3-R097（リニューアル時パスワードリセットメール送信）、sheet-3-R099（リニューアル時パスワードリセットメール送信）、sheet-3-R101（リニューアル時パスワードリセットメール送信）
- 判定根拠: ee 全体を customer_migration / account_migration / 会員移行 / 日付を指定してください で横断検索したが、見つかるのは文面の登録（app/DoctrineMigrations/Version20251204111453.php:1493）と twig（src/Eccube/Resource/template/default/Mail/customer_migration.twig:1）と自動送信フラグ更新（app/DoctrineMigrations/Version20251223094816.php:62）だけで、送信を起動する処理は無い。現行 pf 側には実装がある（pf-eccube3 app/Plugin/HareruyaEc/Service/Customer/SendAccountMigration.php）ので移植漏れであり、廃止・Ph2の台帳（functions/phase2_specs.json / superseded_specs.json）にも登録が無い。
- 確信度: high

### sheet-4-R039 ポイント失効 — 実装違い／ふるまい／P2

- 正本: sheet-4（ポイント失効） HTML行 1178 付近
- 正本引用: 「エラーが発生したユーザーのポイント失効処理(スマレジ・ユーザーポイント増減含め)は今回は行わず、次のユーザーの処理を行う」
- 設計期待値: スマレジのポイント増減が失敗した会員は、その回は保有ポイントの更新もポイント履歴への失効記録も行われず、翌日以降の実行に持ち越される
- 画像確認: 画像なし（0408 の images/ に本シートの図は1枚も無く、判定は本文のみで行った）
- 実装参照: `src/Eccube/Service/Admin/Customer/LostPointsAction.php:65-115;src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:90-113`
- 実装実態: 保有ポイントの更新とポイント履歴の失効記録を先に確定し、スマレジへの反映は後続の非同期処理に委ねている（src/Eccube/Service/Admin/Customer/LostPointsAction.php:68-85 で確定、src/Eccube/Service/Admin/Customer/LostPointsAction.php:113-115 で送出）。そのためスマレジ側の更新が失敗しても EC 側の失効は取り消されず、失敗ジョブは FAILED として記録され手動照合に回るだけである（src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:105、src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:111）。保有ポイントが既に減っているため、当該会員は翌日以降の抽出条件（保有ポイント > 有効期限内の加算合計）に合致せず再処理もされない
- 同じ実装実態でまとまる要求: sheet-4-R040（ポイント失効 / 実装参照 `src/Eccube/Service/Admin/Customer/LostPointsAction.php:65-115;src/Eccube/Repository/DtbPointHistoryRepository.php:356`）
- 判定根拠: スマレジ側の失敗時に当該会員の保有ポイント更新とポイント履歴登録を取り消す処理が無く、次の会員へ進む点だけが一致する（src/Eccube/Service/Admin/Customer/LostPointsAction.php:85-115、src/Eccube/MessageHandler/SmaregiCustomerPointAddMessageHandler.php:104-113）。
- 確信度: med

### sheet-4-R048 ポイント失効 — 実装違い／ふるまい／P3

- 正本: sheet-4（ポイント失効） HTML行 1191 付近
- 正本引用: 「対象会員は1件ずつ順に処理し、1件を処理するごとに0.1秒の待ち時間を置いてから次の会員へ進む。」
- 設計期待値: 対象会員を1件ずつ順に処理し、1件を処理し終えるごとに0.1秒の待ち時間を置いてから次の会員へ進む
- 画像確認: 画像なし（0408 の images/ に本シートの図は1枚も無く、判定は本文のみで行った）
- 実装参照: `src/Eccube/Service/Admin/Customer/LostPointsAction.php:52-116`
- 実装実態: 会員ごとのループに待ち時間が無く、全件を連続して処理する（src/Eccube/Service/Admin/Customer/LostPointsAction.php:52-116 に待機処理が無い）
- 判定根拠: 対象会員を1件ずつ順に処理する点は一致するが（src/Eccube/Service/Admin/Customer/LostPointsAction.php:52-116）、1件処理するごとの待ち時間が無く全件を連続処理する。src/Eccube/Service/Admin/Customer/LostPointsAction.php および呼び出し先（src/Eccube/Command/LostPointsCommand.php、src/Eccube/Service/Smaregi/SmaregiCustomerPointEventService.php）に待機処理は無い。
- 確信度: med

### sheet-6-R031 必須項目が空欄の会員発生通知 — 実装違い／IO／P3

- 正本: sheet-6（必須項目が空欄の会員発生通知） HTML行 1393 付近
- 正本引用: 「・該当するユーザーがある場合、会員IDおよび上記項目全てをコロン(:)区切りを取得(以下 ユーザー情報抜粋データ)を取得する ・取得例 contory:[国名]:pref:[都道府県名]:name01:[名前(姓)]:name02:[名前(姓)]:tel01:[電話番号(1列目)]:tel02:[電話番号(2列目)]:tel03:[電話番号(3列目)]:email:[メールアドレス]:addr01:[住所1]:addr02:[住所2] :addr03:[住所3]:postal_code:[郵便番号]」
- 設計期待値: 管理者へ送る通知メールの各会員の行で、電話番号の1列目には tel01、2列目には tel02、3列目には tel03 の見出し語を付けて値を並べる。
- 画像確認: 画像0枚のシートのためレイアウト図は無い（sheets.tsv 画像=0）
- 実装参照: `src/Eccube/Repository/CustomerRepository.php:653`
- 実装実態: 抜粋文字列を組み立てる箇所で電話番号1列目の見出し語が tel02 になっており（src/Eccube/Repository/CustomerRepository.php:653）、送信される本文は tel01 の見出し語が現れず「:tel02:<1列目>:tel02:<2列目>:tel03:<3列目>」と同じ見出し語が2回続く形で出力される。
- 同じ実装実態でまとまる要求: sheet-6-R060（必須項目が空欄の会員発生通知）
- 判定根拠: 抜粋文字列を生成している箇所を確認したところ、電話番号1列目の直前の見出し語が tel01 ではなく tel02 になっている（src/Eccube/Repository/CustomerRepository.php:653）。設計の取得例は tel01 / tel02 / tel03 の順で見出し語を並べており、管理者が受け取る本文の表記が設計と異なる。テストも件名・宛先・会員IDだけを見ており見出し語を検証していない（tests/Eccube/Tests/Service/MailServiceTest.php:1027-1029）。
- 確信度: high

### sheet-7-R051 ポイント差分発生通知 — 実装違い／IO／P3

- 正本: sheet-7（ポイント差分発生通知） HTML行 1505 付近
- 正本引用: 「通知先はカンマ区切りで複数を指定できる。」
- 設計期待値: 通知先メールアドレスをカンマ区切りで複数設定した場合、その全ての宛先へポイント差分発生通知メールが届く
- 画像確認: 画像なし（0408 の images/ に本シートの図は1枚も無く、判定は本文のみで行った）
- 実装参照: `src/Eccube/Service/MailService.php:1477-1511`
- 実装実態: 設定値をカンマで分割せずそのまま1件の宛先として扱うため、複数指定するとメールアドレスとして成立せず、どの宛先にも通知が届かない（src/Eccube/Service/MailService.php:1511）。同じ MailService でも身分証有効期限切れ通知の管理者宛は分割している（src/Eccube/Service/MailService.php:1266-1269）
- 判定根拠: 通知先が未設定なら通知せず終了する点と、その場合も保有ポイントの補正が行われる点は一致する（src/Eccube/Service/MailService.php:1481-1485、補正は src/Eccube/Service/Admin/Customer/AdjustPointVarianceAction.php:54-66 で先に確定）。一方、複数指定の扱いが異なる。同書の身分証有効期限切れ通知では宛先文字列をカンマで分割して複数宛先にしているのに対し（src/Eccube/Service/MailService.php:1266-1269）、本バッチは分割せず1件の宛先として渡している（src/Eccube/Service/MailService.php:1511）。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 4件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0408/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 9 | 0 | 0 | 0 | 9 |
| sheet-3 | リニューアル時パスワードリセットメール送信 | 102 | 28 | 0 | 0 | 74 |
| sheet-4 | ポイント失効 | 54 | 0 | 3 | 0 | 51 |
| sheet-5 | ポイント有効期限通知 | 97 | 0 | 0 | 3 | 94 |
| sheet-6 | 必須項目が空欄の会員発生通知 | 66 | 0 | 2 | 1 | 63 |
| sheet-7 | ポイント差分発生通知 | 56 | 0 | 1 | 0 | 55 |
| sheet-8 | スマレジ使用ポイント連携 | 37 | 0 | 0 | 0 | 37 |
| sheet-9 | 身分証有効期限切れ通知 | 65 | 0 | 0 | 0 | 65 |

