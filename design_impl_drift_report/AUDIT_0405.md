# 実装乖離監査 — 0405_基本設計仕様書(バッチ_受注管理).html

- 正本: `excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **454要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 53 | ○ |
| 実装違い | 実装はあるが設計と違う | 1 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 2 | — |
| 設計どおり | 設計どおり実装されている | 193 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 192 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 13 | — |
| **合計** | | **454** | |

## 不具合 7件（P1 0 / P2 7 / P3 0）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 47件は重複として代表へ折り畳んだ（判定そのものは 54件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R003 | スマレジEC受注連携エラー再連携 | 未実装 | ふるまい | P2 | スマレジ連携エラーになっている受注のスマレジ連携が、定期的に自動で再試行される。 |
| sheet-3-R085 | 注文番号登録 | 未実装 | ふるまい | P2 | スマレジへの商品登録が成功した注文はスマレジ連携済みとして記録され、失敗した注文については運用担当へエラーメールが届く。 |
| sheet-4-R054 | 購入完了手続き再処理 | 未実装 | IO | P2 | 在庫履歴を登録した商品規格について、その在庫数が支店側へ通知される。 |
| sheet-5-R015 | 店頭注文番号初期化 | 未実装 | ふるまい | P2 | 店頭注文番号初期化の処理中にエラーが発生したときは、管理者宛にエラーが発生したことを知らせる通知メールが届く。 |
| sheet-6-R005 | スマレジ商品再連携 | 未実装 | ふるまい | P2 | スマレジ商品連携とスマレジ在庫連携のいずれかが未連携の注文データが抽出される。 |
| sheet-7-R008 | スマレジ商品削除 | 未実装 | IO | P2 | スマレジへの連携が失敗した受注について、管理者宛のメールで失敗が知らされる。 |
| sheet-9-R034 | ポイント利用未反映チェック | 実装違い | IO | P2 | 通知先にカンマ区切りで複数のあて先を設定した場合、その全員に通知メールが届く。未設定のときは該当注文があってもメールを送らずに終了する。 |

### sheet-10-R003 スマレジEC受注連携エラー再連携 — 未実装／ふるまい／P2

- 正本: sheet-10（スマレジEC受注連携エラー再連携） HTML行 1708 付近
- 正本引用: 「取得した注文データのスマレジ連携をリトライする」
- 設計期待値: スマレジ連携エラーになっている受注のスマレジ連携が、定期的に自動で再試行される。
- 画像確認: sheets.tsv記載どおり画像0枚。images/配下にsheet-10_img*.pngは存在せずレイアウト図なし
- 実装参照: `src/Eccube/Repository/OrderRepository.php:1071-1105;src/Eccube/Repository/OrderRepository.php:966-990`
- 実装実態: スマレジ連携エラーフラグが立った受注を取得する検索処理は src/Eccube/Repository/OrderRepository.php:1071-1105 に存在するが呼び出し元が無く、このフラグを起点に再連携を行う定期バッチがeeに存在しない。エラーフラグ付き受注は src/Eccube/Repository/OrderRepository.php:966-990 のように他バッチでは対象外として除外されるだけで、再連携もフラグ解除も行われない。
- 同じ実装実態でまとまる要求: sheet-10-R005（スマレジEC受注連携エラー再連携）、sheet-10-R007（スマレジEC受注連携エラー再連携）、sheet-10-R010（スマレジEC受注連携エラー再連携）、sheet-10-R012（スマレジEC受注連携エラー再連携）、sheet-10-R013（スマレジEC受注連携エラー再連携 / 実装参照 `src/Eccube/Repository/OrderRepository.php:1071-1105;src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:32-79`）、sheet-10-R014（スマレジEC受注連携エラー再連携 / 実装参照 `src/Eccube/Repository/OrderRepository.php:1071-1105;src/Eccube/Service/Smaregi/SmaregiCustomerService.php:375-417`）、sheet-10-R015（スマレジEC受注連携エラー再連携 / 実装参照 `src/Eccube/Repository/OrderRepository.php:1071-1105;src/Eccube/MessageHandler/SmaregiOrderUsePointMessageHandler.php:126-155`）、sheet-10-R021（スマレジEC受注連携エラー再連携）、sheet-10-R025（スマレジEC受注連携エラー再連携）
- 判定根拠: eeの全コマンド定義（src/Eccube/Command/*.php の AsCommand 名一覧）とスマレジ関連サービスを走査したが、連携エラーフラグを条件に受注を取り出して再連携するバッチは存在しない。再試行は受注編集の再保存など人手の操作を起点にしたときだけ行われる
- 確信度: high

### sheet-3-R085 注文番号登録 — 未実装／ふるまい／P2

- 正本: sheet-3（注文番号登録） HTML行 1121 付近
- 正本引用: 「・スマレジ連携が成功した場合スマレジ連携済みフラグを立てる、失敗した場合エラーメールを送信する」
- 設計期待値: スマレジへの商品登録が成功した注文はスマレジ連携済みとして記録され、失敗した注文については運用担当へエラーメールが届く。
- 画像確認: sheet-3は画像0枚（レイアウト図なし）。本文テキストのみで判定した。
- 実装参照: `src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:171-198;src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260;src/Eccube/Service/MailService.php:2533-2578`
- 実装実態: 成功時のフラグ設定は実装されている（src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:194-196）。失敗時はエラーログ出力とスマレジエラーフラグの設定だけで終わり（src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260）、メール送信は行われない。src/Eccube/Service/MailService.php にスマレジ通信エラー用のメール送信は存在せず、スマレジエラー送信先アドレス設定を使うのはポイント重複登録通知メールのみ（src/Eccube/Service/MailService.php:2533-2578）。
- 同じ実装実態でまとまる要求: sheet-3-R086（注文番号登録 / 実装参照 `src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260;src/Eccube/Service/MailService.php:2533-2578;app/DoctrineMigrations/Version20251125161057.php:175-181`）、sheet-3-R091（注文番号登録 / 実装参照 `src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:128-136;src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260;src/Eccube/Service/MailService.php:2533-2578`）、sheet-3-R092（注文番号登録 / 実装参照 `src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260;src/Eccube/Service/MailService.php:2533-2578;app/DoctrineMigrations/Version20251125161057.php:175-181`）、sheet-3-R116（注文番号登録 / 実装参照 `src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260;src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:133-176;src/Eccube/Service/MailService.php:2533-2578`）、sheet-6-R009（スマレジ商品再連携 / 実装参照 `src/Eccube/Service/MailService.php:2538-2578;src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:51-136`）、sheet-6-R012（スマレジ商品再連携 / 実装参照 `src/Eccube/Service/MailService.php:2538-2578;src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:51-136`）、sheet-6-R036（スマレジ商品再連携 / 実装参照 `src/Eccube/Service/MailService.php:2538-2578;src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:51-136`）
- 判定根拠: eeの店頭受取注文スマレジ連携で商品登録APIが失敗する経路は src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:171-198 の失敗分岐と src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:251-260 のみで、いずれもメール送信を呼んでいない。連携ジョブ側も失敗をジョブ状態として記録するだけである（src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:133-176）。「エラーメール」「ErrorMail」の全件検索でも買取集計と週次在庫履歴の2種しか存在しない。
- 確信度: high

### sheet-4-R054 購入完了手続き再処理 — 未実装／IO／P2

- 正本: sheet-4（購入完了手続き再処理） HTML行 1281 付近
- 正本引用: 「在庫履歴を登録するとき、対象になった商品規格の在庫数を支店へ通知する。」
- 設計期待値: 在庫履歴を登録した商品規格について、その在庫数が支店側へ通知される。
- 画像確認: 画像0枚（images/ 配下に sheet-4/6/7 の図は存在しない）。本文のみで判定。
- 実装参照: `src/Eccube/Service/ShoppingService.php:81-101`
- 実装実態: 在庫履歴の登録後に支店へ在庫数を通知する箇所がコメントアウトされ「TODO: 支店側本店在庫更新API連携」の注記だけが残っている。通知用に集めた商品規格ごとの在庫数（productStockArr）はどこにも渡されず捨てられる。支店側へは何も通知されない。
- 判定根拠: src/Eccube/Service/ShoppingService.php:91-92 に通知呼び出しのコメントアウトと TODO が残る。src/Eccube/Service/ShoppingService.php:93-96 で在庫数を集計しているが利用箇所が無く、src/Eccube/Service/ShoppingService.php:101 でそのまま処理を終える。ee 全体を検索しても支店通知の実装（noticeStockUpdate 相当）は存在しない。現行実装（pf-eccube3 ShoppingService::updateStock）は在庫履歴の登録後に支店通知を行っている。
- 確信度: high

### sheet-5-R015 店頭注文番号初期化 — 未実装／ふるまい／P2

- 正本: sheet-5（店頭注文番号初期化） HTML行 1337 付近
- 正本引用: 「・エラーが発生した場合、メールで管理者に通知」
- 設計期待値: 店頭注文番号初期化の処理中にエラーが発生したときは、管理者宛にエラーが発生したことを知らせる通知メールが届く。
- 画像確認: このシートに画像は無い（sheets/*.txt の見出しが画像0枚、images/ に該当ファイル無し）
- 実装参照: `src/Eccube/Command/TruncateWaitingNumberCommand.php:40-49`
- 実装実態: エラーを捕まえた後の処理は実行ログへの文字出力だけで、管理者への通知メールを送る処理が無い: src/Eccube/Command/TruncateWaitingNumberCommand.php:40-49。処理本体も例外を投げ直すのみで通知はしない: src/Eccube/Service/Admin/Order/TruncateWaitingNumberAction.php:54-58。
- 判定根拠: eeの店頭注文番号初期化にはメール送信の経路が一切無く（初期化コマンドと処理本体の双方にメール送信の記述なし）、失敗しても管理者は通知を受け取らない。確信度medは、実行基盤側の失敗通知でメール相当が補われている可能性をee内では否定できないため。
- 確信度: med

### sheet-6-R005 スマレジ商品再連携 — 未実装／ふるまい／P2

- 正本: sheet-6（スマレジ商品再連携） HTML行 1403 付近
- 正本引用: 「・DBから下記に当てはまる注文データを取得する・スマレジ商品コードが登録されている・スマレジ削除していない・スマレジ商品未連携もしくは、スマレジ在庫連携未連携」
- 設計期待値: スマレジ商品連携とスマレジ在庫連携のいずれかが未連携の注文データが抽出される。
- 画像確認: 画像0枚（images/ 配下に sheet-6 の図は存在しない）。本文のみで判定。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:932-949;src/Eccube/Repository/OrderRepository.php:966-989;src/Eccube/Command/OtcOrderSmaregiPostCommand.php:39-64`
- 実装実態: スマレジ商品再連携バッチに当たるコマンドが ee に存在しない。抽出用の処理（getResendSmaregiProduct / findOtcOrdersAwaitingSmaregiSync）は定義されているが呼び出し元が1つも無い。近い名前の店頭受取注文スマレジ連携バッチは、注文日時が直近30分以内で、かつ商品連携フラグと在庫連携フラグの両方が未連携の受注しか拾わないため、片方だけ未連携の受注や30分より前の受注は二度と連携されない。
- 同じ実装実態でまとまる要求: sheet-6-R006（スマレジ商品再連携）、sheet-6-R007（スマレジ商品再連携）、sheet-6-R008（スマレジ商品再連携）、sheet-6-R010（スマレジ商品再連携）、sheet-6-R011（スマレジ商品再連携）、sheet-6-R016（スマレジ商品再連携）、sheet-6-R019（スマレジ商品再連携）、sheet-6-R024（スマレジ商品再連携）、sheet-6-R025（スマレジ商品再連携）、sheet-6-R026（スマレジ商品再連携）、sheet-6-R028（スマレジ商品再連携）、sheet-6-R029（スマレジ商品再連携）、sheet-6-R030（スマレジ商品再連携）、sheet-6-R031（スマレジ商品再連携）、sheet-6-R032（スマレジ商品再連携）、sheet-6-R033（スマレジ商品再連携）、sheet-6-R034（スマレジ商品再連携）、sheet-6-R043（スマレジ商品再連携）、sheet-6-R045（スマレジ商品再連携）、sheet-6-R001（スマレジ商品再連携）、sheet-6-R003（スマレジ商品再連携）、sheet-6-R004（スマレジ商品再連携）、sheet-6-R017（スマレジ商品再連携）、sheet-6-R018（スマレジ商品再連携）、sheet-6-R022（スマレジ商品再連携）、sheet-6-R023（スマレジ商品再連携）、sheet-6-R041（スマレジ商品再連携）
- 判定根拠: src/Eccube/Repository/OrderRepository.php:935 の getResendSmaregiProduct（スマレジ商品コード有り・削除フラグ未設定・商品連携か在庫連携のいずれかが未連携で抽出）と src/Eccube/Repository/OrderRepository.php:966 の findOtcOrdersAwaitingSmaregiSync は、ee 全体を検索しても呼び出し元が無い。src/Eccube/Command 配下のコマンド一覧にスマレジ商品再連携に当たるコマンドは無い。src/Eccube/Command/OtcOrderSmaregiPostCommand.php:47-51 の店頭受取注文スマレジ連携バッチは対象時刻を30分前に固定し、src/Eccube/Repository/OrderRepository.php:2007-2008 で商品連携フラグと在庫連携フラグがともに未連携であることを要求するため、本設計の抽出条件（いずれかが未連携／注文日時の下限なし）を満たさない。連携処理そのもの（src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:51-136）は存在するが、再連携の起点となるバッチが無いため未連携のまま残った受注は再試行されない。
- 確信度: high

### sheet-7-R008 スマレジ商品削除 — 未実装／IO／P2

- 正本: sheet-7（スマレジ商品削除） HTML行 1492 付近
- 正本引用: 「・連携に失敗した場合はスマレジ通信エラーメール送信」
- 設計期待値: スマレジへの連携が失敗した受注について、管理者宛のメールで失敗が知らされる。
- 画像確認: 画像0枚（images/ 配下に sheet-7 の図は存在しない）。本文のみで判定。
- 実装参照: `src/Eccube/Service/MailService.php:2538-2578;src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:113-146;src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:92-107`
- 実装実態: スマレジ連携の失敗時に管理者へメールで知らせる処理が無い。失敗はログ出力とジョブ台帳の失敗状態の記録だけで終わる。ee のメール送信処理一覧にスマレジ通信エラーの通知は存在せず、通知先アドレスの設定キー（smaregi_error_mail_address）はポイント重複登録通知にのみ使われている。
- 同じ実装実態でまとまる要求: sheet-7-R025（スマレジ商品削除）、sheet-7-R040（スマレジ商品削除）、sheet-7-R041（スマレジ商品削除）、sheet-7-R042（スマレジ商品削除）
- 判定根拠: src/Eccube/Service/Smaregi/Otc/SmaregiOtcDeleteService.php:70-77,92-102 は失敗時にログを出して結果種別を返すだけ、src/Eccube/MessageHandler/SmaregiOtcDeleteMessageHandler.php:115-119,133-146 はジョブを失敗状態にするだけで、いずれもメール送信を行わない。src/Eccube/Service/MailService.php 全体にスマレジ通信エラー通知の送信処理は無く、src/Eccube/Service/MailService.php:2542-2544 の通知先アドレス設定はポイント重複登録通知メールに使われている。現行実装（pf-eccube3 MailService::sendSmaregiErrorMail）は同アドレス宛にスマレジ通信エラーメールを送っている。
- 確信度: high

### sheet-9-R034 ポイント利用未反映チェック — 実装違い／IO／P2

- 正本: sheet-9（ポイント利用未反映チェック） HTML行 1666 付近
- 正本引用: 「通知先メールアドレスが未設定のときは、該当する注文があってもメールを送らずに終了する。通知先はシステム設定の「ポイント利用が反映されない決済の送信先メールアドレス」から取り、カンマ区切りで複数のあて先を指定できる。」
- 設計期待値: 通知先にカンマ区切りで複数のあて先を設定した場合、その全員に通知メールが届く。未設定のときは該当注文があってもメールを送らずに終了する。
- 画像確認: sheets.tsv記載どおり画像0枚。images/配下にsheet-9_img*.pngは存在せずレイアウト図なし
- 実装参照: `src/Eccube/Service/MailService.php:2586-2624;src/Eccube/Service/MailService.php:1037-1061`
- 実装実態: 未設定時に送信せず終了する挙動はあるが、設定値はカンマで区切られず1つのあて先としてそのまま宛先に使われる。カンマを含む値はRFC不適合として引用符付きの単一アドレスへ整形されるため、複数指定した場合はどのあて先にも通知が届かない。
- 判定根拠: src/Eccube/Service/MailService.php:2586-2624 は設定値を空判定のあと分割せずそのまま宛先に渡している。src/Eccube/Service/MailService.php:1037-1061 はカンマを含む文字列を1件のアドレスとして整形するだけで複数宛先には展開しない。未設定時の挙動のみ設計どおりで、複数宛先の指定は満たしていない
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 2件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0405/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 5 | 0 | 0 | 0 | 5 |
| sheet-2 | 目次 | 11 | 0 | 0 | 0 | 11 |
| sheet-3 | 注文番号登録 | 127 | 5 | 0 | 0 | 122 |
| sheet-4 | 購入完了手続き再処理 | 57 | 1 | 0 | 1 | 55 |
| sheet-5 | 店頭注文番号初期化 | 27 | 1 | 0 | 0 | 26 |
| sheet-6 | スマレジ商品再連携 | 47 | 31 | 0 | 0 | 16 |
| sheet-7 | スマレジ商品削除 | 43 | 5 | 0 | 1 | 37 |
| sheet-8 | ポイント二重登録チェック | 30 | 0 | 0 | 0 | 30 |
| sheet-9 | ポイント利用未反映チェック | 39 | 0 | 1 | 0 | 38 |
| sheet-10 | スマレジEC受注連携エラー再連携 | 28 | 10 | 0 | 0 | 18 |
| sheet-11 | スマレジ取引連携エラー再連携 | 40 | 0 | 0 | 0 | 40 |

