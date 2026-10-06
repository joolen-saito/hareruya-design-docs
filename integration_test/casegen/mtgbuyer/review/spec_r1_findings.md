### 指摘1（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「『査定完了』を実行したとき、査定完了を登録」「送る内容: 状態IDと査定明細（JSON）」
- 実際: 送信JSONのトップレベル項目名は `order_status` と `order_details` であるが、設計書にはどちらの項目名も記載されていない。`front-application/MTGBuyer/Util/HttpContentUtil.cs:164-168`
- 判定: 事実の欠落
- 修正案: 査定完了APIへ送るトップレベル項目を、`order_status` と `order_details` と明記する。

### 指摘2（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「`product_class_id`｜商品規格ID。個別入力や金額指定で追加した行の場合は0」
- 実際: 申込カードの商品IDは取得結果に存在しても、言語・状態・フォイル区分が一致する規格が無い行では商品規格IDが設定されず、初期値0のまま行へ追加される。したがって、個別入力・金額指定以外にも `product_class_id=0` となる申込カード行がある。`front-application/MTGBuyer/Entity/AssessmentItem.cs:46-48`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:888-907`
- 判定: 事実の欠落
- 修正案: 一致する規格が無い申込カード行も商品規格IDが0になると明記する。初期表示表にも、規格一致時は商品規格IDを設定することを追加する。

### 指摘3（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「カード情報の欄には、選択中のカードが受注の申込カードに含まれるときに申込時買取価格を表示する」
- 実際: 商品ID・言語・フォイル区分が一致する申込カードについて、現在の状態に対応する価格があればそれを表示するが、対応価格が無ければ申込時買取価格の先頭1件を表示する。`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1092-1117`
- 判定: 事実の欠落
- 修正案: 選択状態に対応する価格を優先し、無い場合は申込時買取価格の先頭1件を表示すると明記する。

### 指摘4（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「商品情報の取得結果が0件の場合｜申込カードの行を1行も作らない。個別入力商品の行だけを作る」
- 実際: 商品情報の一括取得で通信・解析例外が発生した場合も、例外文言をそのままダイアログ表示し、申込カード行を作らず個別入力商品の行だけを作る。設計書にはこの失敗分岐と表示メッセージが無い。`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:867-912`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1443-1472`
- 判定: 事実の欠落
- 修正案: 商品情報の一括取得に失敗した場合も申込カード行を作らず、例外文言を表示して個別入力商品だけを追加すると記載する。

### 指摘5（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「## 表示メッセージ」（以下の共通メッセージは表に記載なし）
- 実際: ネット買取でも、「カード情報がありません。登録に失敗しました。」「査定表を初期化しますか？」「指定されたカードが見つかりませんでした。」「システムを終了しますか？」を表示する経路がある。`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:410-417`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:705-717`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml.cs:220-229`、`front-application/MTGBuyer/Screen/Common/CommonMenu.xaml.cs:31-35`、`front-application/MTGBuyer/Configuration/Message.config:20-22`、`front-application/MTGBuyer/Configuration/Message.config:34`
- 判定: 事実の欠落
- 修正案: 4メッセージを、それぞれカード未選択での登録、査定表初期化、カード検索失敗、アプリ終了要求の条件付きで追加する。

### 指摘6（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「文言はアプリの設定ファイルに定義されている」
- 実際: カード名検索が空白だけの場合の「1文字以上入力してください。」は設定ファイルではなくソースに直接記述され、ネット買取でもこの検索画面を使用する。`front-application/MTGBuyer/Modal/CardNameSearchModal.xaml.cs:101-108`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml.cs:192-206`
- 判定: 事実の誤り
- 修正案: この文言を表示メッセージ表へ追加し、現行ではソースに直接定義されている例外だと記載する。

### 指摘7（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「入力｜ログイン利用者の認証トークンと所属店舗名、ECCUBEから取得する受注一覧・申込カード・個別入力商品・商品情報、査定者の操作」
- 実際: 査定開始時にはS3から受注別CSVを端末へダウンロードし、存在する場合はその端末ファイルを査定表の入力として読み込む。入力欄にS3／端末の査定途中データが含まれていない。`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:94-103`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:144-152`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:792-852`
- 判定: 事実の欠落
- 修正案: 入力に、S3から取り寄せて端末へ置いた受注別の査定途中CSVを追加する。

### 指摘8（o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md）
- 主張: 「成功時出力｜出力を実行したときだけ、端末上のCSVファイル」
- 実際: CSV出力操作以外でも、行の追加・編集等のたびに査定表全行を端末上の利用者別CSVへ書き出す。また画面開始時にはそのCSVを入力として読み込む。`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:792-852`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:934-946`、`front-application/MTGBuyer/Function/TempFile.cs:27-43`
- 判定: 事実の誤り
- 修正案: 成功時出力に利用者別の作業途中CSVの作成・更新を追加し、入力にも同CSVの復元を記載する。「出力を実行したときだけ」は在庫登録用CSVに限定する。

### 指摘9（o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md）
- 主張: 「指定されたカードが見つかりませんでした。｜カード名で検索した結果、画面で選んでいる言語・状態・フォイル区分に一致する規格が無いとき」
- 実際: この文言は規格不一致時だけでなく、検索APIの通信・HTTPエラーや検索結果0件でも表示される。`front-application/MTGBuyer/Card/CardData.cs:183-209`、`front-application/MTGBuyer/Modal/CardNameSearchModal.xaml.cs:122-130`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml.cs:220-229`
- 判定: 事実の誤り
- 修正案: 表示条件を、検索APIの失敗、検索結果0件、または選択中の言語・状態・フォイル区分に一致する規格が無い場合へ広げる。

### 指摘10（o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md）
- 主張: 「文言はアプリの設定ファイルに定義されている」
- 実際: 空白だけでカード名検索を実行した場合の「1文字以上入力してください。」はソースへ直接記述され、入庫モードでもこの検索画面を使用する。`front-application/MTGBuyer/Modal/CardNameSearchModal.xaml.cs:101-108`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml.cs:192-206`
- 判定: 事実の誤り
- 修正案: この文言と表示条件を表へ追加し、現行では設定ファイルではなくソースに直接定義されていると記載する。

### 指摘11（o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md）
- 主張: 「## 表示メッセージ」（アプリ終了要求時の確認は表に記載なし）
- 実際: 入庫画面にも共通メニューがあり、アプリ終了を要求すると「システムを終了しますか？」を表示し、「いいえ」なら終了しない。`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml:49-50`、`front-application/MTGBuyer/Screen/Common/CommonMenu.xaml.cs:31-35`、`front-application/MTGBuyer/Configuration/Message.config:20`
- 判定: 事実の欠落
- 修正案: 「システムを終了しますか？」を、アプリ終了要求時の確認メッセージとして追加する。
