### 指摘1（IT-O01-02-070〜072・074〜075）
- 主張: 「ファイル保管先への通信をすべて切断」した状態で受注を指定し、その後、査定表の編集、中断、ログアウトまたは終了を行う。
- 実際: 受注指定時点で状態更新後に査定途中データをダウンロードし、ダウンロード成功時だけ査定画面へ遷移する。通信例外ではダウンロードが失敗するため一覧を再取得し、査定画面へ到達しない。設計書にも「保管先と通信できなかったときは、査定画面へ移らず」とある（`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:94-117`、`front-application/MTGBuyer/Util/TransferUtil.cs:240-268`、`hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:81`）。
- 判定: 成立しない前提・手順
- 修正案: 受注を開いて査定表を編集するまでは保管先へ正常接続させ、対象となる中断・ログアウト・終了操作の直前に通信を切断する手順へ変更する。

### 指摘2（IT-O01-02-073）
- 主張: PUT `api/v1/admin/buyOrder/{ネット買取受注ID}/status.json` が常にHTTP 500になる状態で受注を指定し、査定画面で編集して「査定を中断する」。
- 実際: 受注指定そのものが同じ状態更新APIを呼び、成功した場合だけ査定データの取得と画面遷移を行う。HTTP 500では更新結果がfalseとなり、査定画面へ移らない（`front-application/MTGBuyer/Screen/CustomerList/CustomerList.xaml.cs:68-117`、`front-application/MTGBuyer/Entity/NetBuyOrder.cs:168-196`）。
- 判定: 成立しない前提・手順
- 修正案: 受注を開いて編集するまでは状態更新を成功させ、「査定を中断する」の直前から対象PUTにHTTP 500を返すよう中継条件を切り替える。

### 指摘3（IT-O01-02-039〜041）
- 主張: 査定画面で言語「日本語」を選択する。
- 実際: 言語コンボボックスの選択肢は `Language.All.Code` をそのまま使用しており、値は `JP,EN,CS,...` である。「日本語」という選択肢は存在しない（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:66-71`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml:328-331`、`front-application/MTGBuyer/Configuration/Card.config:3-8`）。
- 判定: 成立しない前提・手順
- 修正案: 手順の「言語『日本語』」を、実際の選択肢である「言語『JP』」へ変更する。

### 指摘4（IT-O01-03-004・005）
- 主張: 追加された一覧行で商品コードを確認し、IT-O01-03-004ではさらにレアリティと略称タグも確認する。
- 実際: 商品コード列は `Visibility="Hidden"` であり、一覧にはレアリティ列と略称タグ列も存在しない。手順どおり一覧を見てもこれらの期待値は確認できない（`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml:171-188`）。
- 判定: 成立しない前提・手順
- 修正案: 画面で確認する期待結果は表示列に限定する。規格別の商品コード等を確認する必要がある場合は、後続のCSV出力を確認する手順に変更する。

### 指摘5（IT-O01-03-004）
- 主張: 追加された行のプロモが「プロモO0103-007」である。
- 実際: アプリはプロモーション名を行へ設定せず、非プロモなら `-`、それ以外なら `○` を設定する。プロモ列はその値を直接表示するため、本ケースの実表示は `○` である。設計書の「取得した商品情報の…プロモの値」という記述は現行実装と一致しない（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1186-1200`、`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml:188`、`front-application/MTGBuyer/Configuration/System.config:11-12`、`hareruya-design-docs/functions/pf-eccube3/o01-03_other_mtg_buyer_mtg_buyer_stock_inbound.md:47-50`）。
- 判定: 設計書の誤り
- 修正案: 設計書を「プロモーション名ではなく、プロモ=`○`・非プロモ=`-`」へ直し、本ケースの期待値も `○` に変更する。

### 指摘6（IT-O01-02-028・029）
- 主張: 査定表のフォイル欄が「ノーマル」である。
- 実際: 申込カードの未設定値および個別入力商品はいずれも `IsFoil=false` となり、査定表には `AssessmentTable.FalseMark` の `-` が表示される。「ノーマル」と表示する設計書の記述は現行実装と一致しない（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:883-885,921-924`、`front-application/MTGBuyer/Entity/AssessmentItem.cs:175-195`、`front-application/MTGBuyer/Configuration/System.config:11-12`、`hareruya-design-docs/functions/pf-eccube3/o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:103-110`）。
- 判定: 設計書の誤り
- 修正案: 設計書に「非フォイルの画面表示は `-`」と明記し、両ケースの期待値を「フォイルが `-`」へ変更する。

### 指摘7（IT-O01-02-076）
- 主張: 再開後の査定表に「削除済みの状態のカードO0102-076-B」も表示される。
- 実際: 査定途中ファイルから削除済み行を内部リストへ読み込む一方、査定表へ設定するフィルターは `CancelFlg` がfalseの行だけを表示する。したがって削除済みのカードBは保持されても画面には表示されない（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:792-842`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:317-353`）。
- 判定: 期待結果の誤り
- 修正案: 画面上の期待結果はカードAと個別入力商品の復元に限定し、削除済みのカードBが表示されるという記述を削除する。
