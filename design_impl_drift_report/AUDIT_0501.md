# 実装乖離監査 — 0501_基本設計仕様書(API_在庫管理).html

- 正本: `excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **253要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 48 | ○ |
| 実装違い | 実装はあるが設計と違う | 6 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 0 | — |
| 設計どおり | 設計どおり実装されている | 46 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 148 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 5 | — |
| **合計** | | **253** | |

## 不具合 5件（P1 2 / P2 1 / P3 2）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 49件は重複として代表へ折り畳んだ（判定そのものは 54件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R014 | スマレジ連携処理 | 未実装 | ふるまい | P1 | 管理画面の在庫操作（在庫編集・在庫一括編集・在庫移動指示の入出庫確定・分割結合の承認確定）で在庫場所区分がスマレジの在庫を増減したとき、その増減がスマレジ側の在庫数にも同じだけ反映される。1回の操作で |
| sheet-3-R015 | スマレジ連携処理 | 未実装 | ふるまい | P1 | 在庫変更CSV登録や棚卸し反映で在庫場所区分がスマレジの在庫を一括で増減したとき、その増減がスマレジ側の在庫数にも反映され、反映結果が非同期に返ってきた時点でEC側の在庫と処理履歴が更新されて、CSV |
| sheet-4-R008 | スマレジwebhook連携エラー再連携 | 実装違い | ふるまい | P2 | 再連携の対象は、バッチ駆動時刻からさかのぼって指定した時間（可変）以内に更新されたスマレジ在庫変動履歴であること。日付をまたぐ時間帯に駆動しても、その時間範囲に入る未連携の在庫変動が取得され再連携され |
| sheet-3-R101 | スマレジ連携処理 | 実装違い | IO | P3 | Webhook受信が正常に受け付けられたとき、応答は200で本文を持たない（ステータスコードだけで結果を伝える）。 |
| sheet-3-R168 | スマレジ連携処理 | 実装違い | ふるまい | P3 | CSV登録画面に登録したCSVの履歴と処理結果が表示され、100件以上のCSVは100件毎の小データに分かれて履歴に並ぶこと。 |

### sheet-3-R014 スマレジ連携処理 — 未実装／ふるまい／P1

- 正本: sheet-3（スマレジ連携処理） HTML行 808 付近
- 正本引用: 「CSV登録等の一括処理ではない管理画面でスマレジ側の在庫変動が発生した場合」
- 設計期待値: 管理画面の在庫操作（在庫編集・在庫一括編集・在庫移動指示の入出庫確定・分割結合の承認確定）で在庫場所区分がスマレジの在庫を増減したとき、その増減がスマレジ側の在庫数にも同じだけ反映される。1回の操作で扱える件数には上限があり、上限を越えたらエラーが表示されて処理は行われず、CSV登録での実施を案内される。
- 画像確認: sheet-3は画像0枚（sheets.tsv・シート本文冒頭に「画像 0枚」と記載）。レイアウト図はExcel図形の文字として本文に展開済みで、参照すべき画像ファイルは無い。
- 実装参照: `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43; src/Eccube/Service/Admin/Stock/StockApprovalStoreAction.php:43; src/Eccube/Service/Admin/Stock/StockBulkApprovalStoreAction.php:46`
- 実装実態: ee には管理画面の在庫操作結果をスマレジ側の在庫数へ反映する処理が無い。スマレジ在庫APIの呼び口は SmaregiStockApiClient の add（店頭受取商品の在庫登録専用・正数のみ）/ getStockChange / listStocks / listStockChanges だけで、在庫編集・在庫一括編集・在庫移動指示の入出庫確定・分割結合の承認確定のいずれの処理からも呼ばれていない（呼び出し元は SmaregiOtcOrderSyncService・SmaregiStockProcessMessageHandler・SmaregiStockBackfillAction のみ）。件数上限による中止・エラー表示・CSV登録への誘導も無い。
- 同じ実装実態でまとまる要求: sheet-3-R020（スマレジ連携処理）、sheet-3-R022（スマレジ連携処理）、sheet-3-R025（スマレジ連携処理）、sheet-3-R026（スマレジ連携処理）、sheet-3-R027（スマレジ連携処理）、sheet-3-R028（スマレジ連携処理）、sheet-3-R029（スマレジ連携処理）、sheet-3-R030（スマレジ連携処理）、sheet-3-R046（スマレジ連携処理）、sheet-3-R047（スマレジ連携処理）、sheet-3-R133（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R135（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R137（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R138（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R143（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R144（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R145（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R146（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Controller/Admin/Stock/StockListController.php:501-524`）、sheet-3-R021（スマレジ連携処理）、sheet-3-R023（スマレジ連携処理）、sheet-3-R032（スマレジ連携処理）
- 判定根拠: ee全体を grep しても管理画面の在庫操作からスマレジ在庫を更新する経路が無い（stockApiClient-> の呼び出しは add=店頭受取商品登録、getStockChange/listStocks/listStockChanges=受信側の取得のみ）。よって本行の反映は未実装。
- 確信度: high

### sheet-3-R015 スマレジ連携処理 — 未実装／ふるまい／P1

- 正本: sheet-3（スマレジ連携処理） HTML行 809 付近
- 正本引用: 「CSV登録等の一括処理でスマレジ側の在庫変動が発生した場合」
- 設計期待値: 在庫変更CSV登録や棚卸し反映で在庫場所区分がスマレジの在庫を一括で増減したとき、その増減がスマレジ側の在庫数にも反映され、反映結果が非同期に返ってきた時点でEC側の在庫と処理履歴が更新されて、CSV登録画面で処理結果を確認できる。
- 画像確認: sheet-3は画像0枚（sheets.tsv・シート本文冒頭に「画像 0枚」と記載）。レイアウト図はExcel図形の文字として本文に展開済みで、参照すべき画像ファイルは無い。
- 実装参照: `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:1; src/Eccube/Service/Product/InventoryReflectService.php:53; src/Eccube/Controller/Smaregi/WebhookController.php:41`
- 実装実態: ee には一括処理の在庫変動をスマレジ側へまとめて登録し、その結果を非同期で受け取ってEC側の処理を進める仕組みが無い。スマレジ在庫APIの呼び口は add / getStockChange / listStocks / listStockChanges だけで一括更新の呼び口が無く、処理結果を受ける受信口も src/Eccube/Controller/Smaregi/WebhookController.php の1本（スマレジWebhook受信）だけで一括登録の結果を受ける口は無い。在庫変更CSV登録（StockChangeCsvImportHandler）・棚卸し反映（InventoryReflectService）はどちらもEC内の在庫更新のみで、スマレジ連携もCSVの分割保存・CSV処理履歴への結果登録も行っていない。
- 同じ実装実態でまとまる要求: sheet-3-R024（スマレジ連携処理）、sheet-3-R031（スマレジ連携処理）、sheet-3-R052（スマレジ連携処理）、sheet-3-R053（スマレジ連携処理）、sheet-3-R163（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R165（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R166（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R170（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192; src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183`）、sheet-3-R171（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R173（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R174（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R175（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R179（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R180（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R181（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R182（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R183（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R187（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R188（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R192（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R204（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R209（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R210（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R211（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R212（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）、sheet-3-R213（スマレジ連携処理 / 実装参照 `src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-183; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:126-192`）
- 判定根拠: 一括での在庫反映と、その結果を非同期で受け取ってEC側の在庫・CSV処理履歴を更新する経路が ee に無い。在庫変更CSV登録と棚卸し反映はEC内の在庫更新で完結している。
- 確信度: high

### sheet-4-R008 スマレジwebhook連携エラー再連携 — 実装違い／ふるまい／P2

- 正本: sheet-4（スマレジwebhook連携エラー再連携） HTML行 1130 付近
- 正本引用: 「★1. APIでバッチ駆動時間から5時間前までの間のスマレジの在庫変動履歴データを取得する」
- 設計期待値: 再連携の対象は、バッチ駆動時刻からさかのぼって指定した時間（可変）以内に更新されたスマレジ在庫変動履歴であること。日付をまたぐ時間帯に駆動しても、その時間範囲に入る未連携の在庫変動が取得され再連携されること。
- 画像確認: 本シートに図の画像は0枚（0501/images に sheet-4 の図は無い）ため画像確認は不要。
- 実装参照: `src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:65-96; src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:160-207; src/Eccube/Command/SmaregiStockBackfillCommand.php:41-58`
- 実装実態: 再連携バッチは対象日（既定は駆動日）を1日単位で受け取り、その日の在庫変動履歴を取得する。取引更新時間による時間範囲の絞り込みは無く、駆動時刻からさかのぼる時間幅の指定もできない。既定動作では駆動日の分しか対象にならないため、閉店後から日付が変わった後に駆動すると前日の未連携分は対象外になる。
- 同じ実装実態でまとまる要求: sheet-4-R013（スマレジwebhook連携エラー再連携）、sheet-4-R027（スマレジwebhook連携エラー再連携）
- 判定根拠: バッチは対象日を1日単位で指定して在庫変動履歴を取得しており（src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:160-207 の target_date、既定値は src/Eccube/Service/Smaregi/Stock/SmaregiStockBackfillAction.php:65-69 で駆動日）、駆動時刻からY時間前までという時間範囲での抽出になっていない。そのため日付をまたぐ時間帯の未連携分は既定では取得されない。
- 確信度: med

### sheet-3-R101 スマレジ連携処理 — 実装違い／IO／P3

- 正本: sheet-3（スマレジ連携処理） HTML行 895 付近
- 正本引用: 「レスポンスデータは空を返す」
- 設計期待値: Webhook受信が正常に受け付けられたとき、応答は200で本文を持たない（ステータスコードだけで結果を伝える）。
- 画像確認: sheet-3は画像0枚（sheets.tsv・シート本文冒頭に「画像 0枚」と記載）。レイアウト図はExcel図形の文字として本文に展開済みで、参照すべき画像ファイルは無い。
- 実装参照: `src/Eccube/Controller/Smaregi/WebhookController.php:107; src/Eccube/Controller/Smaregi/WebhookController.php:85`
- 実装実態: 受け付け成功時に200で本文 {"status":"ok"} を返している（src/Eccube/Controller/Smaregi/WebhookController.php:107-109）。重複受信時も200で {"status":"ok","message":"Event is duplicate"} を返す（同:85-88）。設計が求める「空」ではない。
- 判定根拠: src/Eccube/Controller/Smaregi/WebhookController.php:107 の JsonResponse が本文を持つため、200応答の本文は空にならない。受信側スマレジは本文を評価しないため業務影響は小さくP3とした。
- 確信度: high

### sheet-3-R168 スマレジ連携処理 — 実装違い／ふるまい／P3

- 正本: sheet-3（スマレジ連携処理） HTML行 962 付近
- 正本引用: 「登録したCSVは各CSV登録画面で、CSV履歴として表示し処理結果を明示できるようにしておく。100件以上ある場合は、100件毎の小データにCSVを分割してS3に上げて履歴表示する」
- 設計期待値: CSV登録画面に登録したCSVの履歴と処理結果が表示され、100件以上のCSVは100件毎の小データに分かれて履歴に並ぶこと。
- 画像確認: 本シートに図の画像は0枚（0501/images に sheet-3 の図は無い）ため画像確認は不要。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:147-160; src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:150-175`
- 実装実態: 在庫変更CSV登録画面はCSV登録履歴を一覧表示するが、登録されたCSVは1件のままS3へ保存され、100件毎に分割して履歴に並べる処理は無い。
- 判定根拠: [gate7/refute] 重要度を P3 へ。事実は確認できた。CSV登録履歴の一覧表示は src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:147-160 で実装済みだが、S3保存は取込ファイル1件をそのまま上げるだけで100件毎の分割が無い（src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHand CSV登録履歴の表示は実装されている（src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:147-160）が、S3保存は取込ファイルを分割せず1件で行っており（src/Eccube/Service/Csv/Importer/Event/StockChangeCsvImportHandler.php:150-175）、100件毎の小データに分ける処理が ee に無い。 重要度は、CSV登録履歴と処理結果の表示自体は実装済みで（src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:147-160）欠けているのは100件毎の分割表示だけであり、履歴は分割されないまま全件が確認できて迂回に業務手当を要さないためP3とした。根本原因キーは、この欠陥がスマレジ一括連携の不在（SmaregiStockApiClient-no-bulk-stock-sync-callback）とは別のファイルの別欠陥であるためCSV取込側のキーに直した。
- 確信度: high

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 4 | 0 | 0 | 0 | 4 |
| sheet-3 | スマレジ連携処理 | 213 | 48 | 3 | 0 | 162 |
| sheet-4 | スマレジwebhook連携エラー再連携 | 30 | 0 | 3 | 0 | 27 |

