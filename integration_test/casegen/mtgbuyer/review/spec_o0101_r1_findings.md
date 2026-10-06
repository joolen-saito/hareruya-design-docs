### 指摘1（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「カード名で検索したとき、商品を検索」
- 実際: 検索文字が空白だけの場合は「1文字以上入力してください。」を表示してAPIを呼ばない。検索結果が空、通信失敗、またはエラー応答の場合は「指定されたカードが見つかりませんでした。」を表示する（`front-application/MTGBuyer/Modal/CardNameSearchModal.xaml.cs:101`、`front-application/MTGBuyer/Modal/CardNameSearchModal.xaml.cs:122`、`front-application/MTGBuyer/Card/CardData.cs:183`、`front-application/MTGBuyer/Configuration/Message.config:34`）。
- 判定: 事実の欠落
- 修正案: 空文字検索ではAPIを呼ばないことと、検索失敗時の扱いを業務ロジックへ追加する。両メッセージも表示メッセージ表へ追加する。

### 指摘2（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「カードを読み取り、またはカード名で検索して『登録する』を実行したとき」
- 実際: カード詳細IDが0、または商品情報が取得されていない状態では行を追加せず、「カード情報がありません。登録に失敗しました。」を表示する（`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:410`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:412`、`front-application/MTGBuyer/Configuration/Message.config:22`）。
- 判定: 事実の欠落
- 修正案: 商品情報が無い場合は行を追加しない条件と、その際のメッセージを追加する。

### 指摘3（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「査定途中のデータが端末にある場合は読み込む」
- 実際: CSVの行の読込・型変換に失敗すると「中断された査定データの読み込みに失敗しました。査定表を初期化して表示します。」を表示して読込処理を終了する（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:803`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:843`、`front-application/MTGBuyer/Configuration/Message.config:23`）。
- 判定: 事実の欠落
- 修正案: 端末CSVの読込失敗時の扱いと文言を、査定表および表示メッセージ節へ追加する。

### 指摘4（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「査定表を初期化したときは、そのつど査定途中のデータを端末に保存する」
- 実際: 初期化前に「査定表を初期化しますか？」というYes/No確認を行い、Yes以外では初期化も保存も行わない。Yesの場合だけ一覧を消して保存する（`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:705`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:708`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:713`、`front-application/MTGBuyer/Configuration/Message.config:21`）。
- 判定: 事実の欠落
- 修正案: 初期化前の確認、取消時は何もしないこと、および確認文言を追加する。

### 指摘5（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「条件を満たしたときは確認を求め、『OK』の場合に次の順で処理する」
- 実際: 確認文言は処理別に異なり、買取成立は「買取成立にしてよろしいですか。」、経理払い出し待ちは「経理払い出し待ちにしてよろしいですか。」、買取キャンセルは「買取キャンセルを登録し、本査定を終了します。よろしいですか？」である（`front-application/MTGBuyer/Modal/PurchaseCompleteModal.xaml:24`、`front-application/MTGBuyer/Modal/PurchaseAccountingPendingModal.xaml:24`、`front-application/MTGBuyer/Modal/PurchaseCancelModal.xaml:24`）。
- 判定: 事実の欠落
- 修正案: 3種類の確認文言と表示条件を表示メッセージ表へ追加する。

### 指摘6（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「商品規格ID・商品名・買取価格がすべて同じ行同士でまとめ、枚数を合計する」「`sell_price`＝基準価格」「`section_id`＝部門のID」
- 実際: 同一判定は商品規格ID・商品名・買取価格だけで行い、一致済み明細には枚数だけを加算する。したがって、基準価格または部門が異なる行もまとめられ、`sell_price`と`section_id`には最初に処理した行の値が残る（`front-application/MTGBuyer/Util/HttpContentUtil.cs:80`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:86`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:93`、`front-application/MTGBuyer/Util/HttpContentUtil.cs:109`）。
- 判定: 事実の欠落
- 修正案: まとめられた行の基準価格・部門には、最初に処理した行の値を送ることを明記する。

### 指摘7（o01-01_other_mtg_buyer_mtg_buyer_store_purchase.md）
- 主張: 「身分証の画像は、オモテとウラを読み取り、端末内に暗号化して置く」
- 実際: 画面を開いた際は受注ID別の暗号化済み両面ファイルを復号して再表示し、復号用の一時画像を削除する。また、暗号化ファイルはアプリ起動時に作成から32日を過ぎたものを削除する（`front-application/MTGBuyer/Screen/IDScan/IdentificationScan.xaml.cs:52`、`front-application/MTGBuyer/Screen/IDScan/IdentificationScan.xaml.cs:151`、`front-application/MTGBuyer/Screen/IDScan/IdScanCamera.cs:192`、`front-application/MTGBuyer/App.xaml.cs:196`、`front-application/MTGBuyer/Configuration/System.config:10`）。
- 判定: 事実の欠落
- 修正案: 暗号化済み画像の再読込、一時復号画像の削除、および32日経過後の削除を端末ファイルの入出力として追加する。
