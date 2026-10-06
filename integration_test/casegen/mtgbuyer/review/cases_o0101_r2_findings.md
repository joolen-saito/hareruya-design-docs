### 指摘1（O01-01 登録番号確認）
- 主張: 受注一覧で受け取った登録番号確認値が `true` なら、欄を操作しなくても「確認済み」として買取成立・経理払い出し待ちを実行できる。
- 実際: 設計書は未操作時に受信値を使うとしているが、画面のチェック状態は常に `false` で初期化され、受信値を反映する処理がない。買取成立・経理払い出し待ちの可否判定はこの画面状態を見るため、受信値が `true` でも未確認として中止される（`hareruya-design-docs/functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:121`、同`:143`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml:91`、`front-application/MTGBuyer/Screen/Document/DocumentConfirmation.xaml.cs:41`、同`:199`、同`:255`）。
- 判定: 設計書の誤り
- 修正案: 現行仕様を正とするなら、受信済みの `true` でも画面上は未確認として再確認が必要だと設計書を直す。受信値を確認状態へ反映する仕様なら、アプリ側でチェック状態を初期化する必要がある。

### 指摘2（IT-O01-01-064、065、067、068）
- 主張: 確認ダイアログで「OK」を選んだ直後に、一覧再取得のGETまたは端末データ削除を確認できる。
- 実際: 成功時は完了メッセージの `MessageBox.Show` が閉じられた後に、端末データ削除、キャッシュ消去、画面遷移が行われる。一覧のGETはその遷移後であるため、手順に完了ダイアログを閉じる操作がない064・065・067・068では期待状態に到達していない（`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:65`、同`:66`、同`:68`、同`:69`、`front-application/MTGBuyer/Modal/PurchaseCompleteViewModel.cs:71`、同`:78`、同`:81`、`front-application/MTGBuyer/Modal/PurchaseAccountingPendingViewModel.cs:68`、同`:75`、`front-application/MTGBuyer/Modal/PurchaseCancelViewModel.cs:71`、同`:78`）。
- 判定: 成立しない前提・手順
- 修正案: 064・065・067・068にも、111〜113と同じく「完了のダイアログを閉じる」を追加してから、GETまたは端末データを確認する。

### 指摘3（IT-O01-01-025、109ほか新規査定ケース）
- 主張: 事前準備の受注から査定を始めれば空の査定表になり、025では追加後に1行、109では送信明細が1件になる。
- 実際: これらの前提には対象受注の保管先ファイルおよび端末ファイルが存在しないことがない。受注指定時には必ず保管先から同名ファイルを取得し、査定画面は端末ファイルがあれば内容を復元するため、再実行時などの残存ファイルによって行数・送信明細が変わる（`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:26`、同`:110`、`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_seed_data.tsv:42`、同`:210`、`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:94`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:135`、`hareruya-design-docs/integration_test/casegen/precond/README.md:23`）。
- 判定: 成立しない前提・手順
- 修正案: 空の査定表から始める全ケースで、対象の `c{受注ID}.csv` が保管先と端末の双方にないこと、および査定キャッシュがないことを事前準備に明記する。

### 指摘4（IT-O01-01-014）
- 主張: 査定途中ファイルの取得にHTTP 500が返っても、身分証スキャン画面へ移る。
- 実際: 現行ソースはファイル取得時の `AmazonS3Exception` を一律に成功扱いしているため、この遷移自体は実装どおりである。しかし設計書は再開時にデータを取り寄せて復元するとしか記載せず、取得時のHTTP 500を成功扱いする記述がなく、エラー時の扱いにもこの事象がない（`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:15`、`front-application/MTGBuyer/Util/TransferUtil.cs:257`、同`:262`、`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:94`、同`:103`、`hareruya-design-docs/functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:174`、同`:176`）。
- 判定: 設計書に無い期待
- 修正案: HTTP 500を「ファイルなし」と同じ成功扱いにする現行挙動を設計書へ明記するか、意図しない挙動なら実装を修正し、ケース014の期待結果も変更する。

### 指摘5（O01-01 `qualified_invoice_issuer_confirmation_flg`）
- 主張: 1巡目の裁定どおり、受注シードに登録番号確認値の「値なし／true／false」を用意し、未操作時には受信値を送る分岐を反映した。
- 実際: 裁定は3値を明示するとしているが、反映後の報告も認めるとおり全受注シードが「値なし」であり、050は操作してtrue、110は操作してfalse、051はnullの未送信しか確認していない。受信値がtrueまたはfalseで、欄を操作しない分岐は未検証である（`hareruya-design-docs/integration_test/casegen/mtgbuyer/review/cases_o0101_r1_dispositions.md:9`、`hareruya-design-docs/integration_test/casegen/mtgbuyer/gen_O01-01/report.md:44`、`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_seed_data.tsv:92`、同`:94`、同`:212`、`hareruya-design-docs/functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:143`）。
- 判定: 取りこぼし
- 修正案: 受信値trueとfalseをそれぞれ設定し、欄を操作せず買取キャンセルして、同じ値が送られる2ケースを追加する。

### 指摘6（IT-O01-01-067、068）
- 主張: 成功後の後処理は066〜068で検証しており、保管先データを消さないことも含まれる。
- 実際: 設計書は買取成立・経理払い出し待ち・買取キャンセルのすべてで保管先データを消さないとしているが、保管先に残ることを確認するのは買取成立の066だけで、067・068は端末データの削除しか確認していない。経理払い出し待ちとキャンセルは別々の実装で、それぞれ保管先削除を呼ばないコードになっている（`hareruya-design-docs/functions/pf-eccube3/o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md:134`、`hareruya-design-docs/integration_test/casegen/mtgbuyer/cases/O01-01_mb_test_cases.tsv:67`、同`:68`、同`:69`、`front-application/MTGBuyer/Modal/PurchaseAccountingPendingViewModel.cs:68`、同`:72`、`front-application/MTGBuyer/Modal/PurchaseCancelViewModel.cs:71`、同`:75`）。
- 判定: 取りこぼし
- 修正案: 経理払い出し待ちと買取キャンセルについても、成功後に保管先ファイルが内容付きで残ることを別ケースで確認する。
