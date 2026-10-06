### 指摘1（o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md）
- 主張: 「状態の更新が成功すると、中断時に保管した査定途中のデータを取り寄せ、査定画面へ移る。」「状態の更新に失敗したときは査定画面へ移らず、一覧を取得し直す。」
- 実際: 状態更新が成功しても、査定途中データのダウンロード結果が偽なら査定画面へ移らず一覧を取得し直す。ダウンロード処理は一般例外時に偽を返すが、この失敗分岐は設計書にない。`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:94-117`、`front-application/MTGBuyer/Util/TransferUtil.cs:240-269`
- 判定: 事実の欠落
- 修正案: 査定画面へ移るのは、状態更新と査定途中データの取得がともに成功した場合であると明記する。取得結果が偽の場合はメッセージを表示せず、受注一覧を取得し直す。

### 指摘2（o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md）
- 主張: 「枚数・買取価格｜『登録する』を実行したときのカード情報の欄の値」
- 実際: カード情報欄には枚数の入力・表示項目がなく、新規に読み取り・検索したカードの枚数は初期値1となる。既存行を編集した場合だけ、編集前の枚数をカードデータへ移して再登録する。`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml:351-395`、`front-application/MTGBuyer/Card/ProductData.cs:39-42`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1195`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1266-1278`
- 判定: 事実の誤り
- 修正案: 枚数は、新規追加では1、既存行の編集では編集前の枚数になると修正する。「カード情報の欄の値」という説明は買取価格に限定する。
