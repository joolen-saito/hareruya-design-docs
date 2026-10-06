### 指摘1（IT-O01-02-079・080）
- 主張: 手順では受注ID `9102079`・`9102080`を選ぶが、シードの受注IDは `91020079`・`91020080`である。
- 実際: 一覧に存在するのはシード投入したIDだけであり、一時ファイル名も受注IDから `n{受注ID}.csv` と生成される（`cases/O01-02_mb_seed_data.tsv:92-95`、`front-application/MTGBuyer/Entity/NetBuyOrder.cs:104-109`）。したがって手順の受注もファイルも対応しない（`cases/O01-02_mb_test_cases.tsv:80-81`）。
- 判定: 成立しない前提・手順
- 修正案: 受注ID、商品等の識別子、ファイル名、手順、期待結果を同じ番号体系に統一する。少なくとも `91020079` と `9102079`、`91020080` と `9102080`のどちらかへ揃える必要がある。

### 指摘2（IT-O01-02-081）
- 主張: 受注 `9102081`を開き、商品名「カードO0102-081-A」の行を編集すると、カード詳細ID `81020813`のGETが送られる。
- 実際: シードされた受注IDは `91020081`であり、申込カードの商品も `810200811`・「カードO0102-0081-A」である。期待する詳細ID `81020813`は別商品 `81020811`・「カードO0102-081-A」に紐付いている（`cases/O01-02_mb_seed_data.tsv:96`、`cases/O01-02_mb_test_cases.tsv:82`）。初期行は申込カードの商品IDに一致する商品情報から作られ、その行のカード詳細IDを編集時のGETに用いる（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:863-905`、`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:1266-1276`）。
- 判定: 成立しない前提・手順
- 修正案: 受注IDを統一したうえで、申込カードの商品ID・商品名・規格とカード詳細IDを同一商品へ揃える。

### 指摘3（IT-O01-02-080）
- 主張: 保管先からの取得をHTTP 500にすると、申込カードから作った行だけが表示される。
- 実際: 保管ファイルを作る準備操作そのものが端末に `n9102080.csv`を保存し、中断時にはそれをアップロードするだけで端末ファイルを削除しない（`cases/O01-02_mb_seed_data.tsv:95`、`front-application/MTGBuyer/Screen/Common/CommonHeader.xaml.cs:135-168`）。取得エラー時も既存の端末ファイルは削除されず、画面初期化は端末ファイルがあれば申込カードより先に読み込む（`front-application/MTGBuyer/Util/TransferUtil.cs:240-268`、`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:144-152`）。
- 判定: 成立しない前提・手順
- 修正案: 保管ファイルは別端末で作成し、実行端末には対象の端末ファイルが存在しないことを明記する。実行端末を分けない場合、現行アプリでは「個別O0102-080」が読み込まれる。

### 指摘4（IT-O01-02-079）
- 主張: 保管先への削除をHTTP 500にしても、成功ダイアログが出て一覧へ移り、端末ファイルが消えることを確認する。
- 実際: 1巡目の対象は「保管データを消せなかった場合も遷移する」分岐だが、現在の期待結果は削除要求の発生も保管先ファイルの残存も確認していない（`cases/O01-02_mb_test_cases.tsv:80`、`review/cases_r1_dispositions.md:7`）。実ソースは削除結果を無視して端末ファイルを削除し遷移するため、削除処理を一度も呼ばない実装でも現ケースは通る（`front-application/MTGBuyer/Screen/Assessment/AssessmentTable.cs:653-661`、`front-application/MTGBuyer/Util/TransferUtil.cs:272-300`）。
- 判定: 取りこぼし
- 修正案: 失敗した削除要求が1件記録され、試験用保管先には対象ファイルが残ることも確認する。

### 指摘5（IT-O01-02-012〜014）
- 主張: まとめて買取ID、申込カード、個別入力商品の各APIがHTTP 500を返せば、取得失敗ダイアログが表示され一覧が以前のままになる。
- 実際: これら3つの呼出しはHTTPステータスを確認せず、応答本文をそのまま解析する。本文が正常なJSONならHTTP 500でも処理を続行できる（`front-application/MTGBuyer/Screen/CustomerList/CustomerListViewModel.cs:240-252`、同`:259-273`、同`:280-294`）。ケースの前提は応答本文を定めていない（`cases/O01-02_mb_test_cases.tsv:13-15`）。
- 判定: 成立しない前提・手順
- 修正案: 解析または整数変換が必ず失敗する応答本文まで中継条件に指定するか、通信切断で発生させる。HTTP 500だけでは期待結果が一意にならない。

### 指摘6（IT-O01-03-014〜016・032・033）
- 主張: 中継の記録で更新要求が0件であることだけにより、IT-0080の「ECCUBEの状態が変わらない」を確認する。
- 実際: IT-0080は実行前後の数量・金額・履歴件数、および外部連携先に登録・更新がないことの判定である（`viewpoint_canonical/viewpoints_canonical.tsv:81`）。現在の期待結果は中継記録しか確認せず、ECCUBEの状態を観測していない（`cases/O01-03_mb_test_cases.tsv:15-17`、同`:33-34`）。特に014〜016は、1巡目で「要求0件かつECCUBEの状態が変わらないこと」へ直すと裁定された箇所である（`review/cases_r1_dispositions.md:19`）。
- 判定: 確認方法の誤り
- 修正案: 比較対象となるECCUBE側の数量・金額・履歴件数を事前準備に置き、実行後も同値であることを管理画面、代替不能ならDBで確認する。

### 指摘7（IT-O01-02-046）
- 主張: 「5円」を実行するだけで固定価格行を追加し、査定完了JSONを確認できる。
- 実際: 現行画面は固定価格ボタンから枚数入力モーダルを開き、確定した場合だけ行を登録する（`front-application/MTGBuyer/Screen/Assessment/MainWindow.xaml.cs:894-910`）。初期枚数は空で、未入力なら0になる（`front-application/MTGBuyer/Modal/FixedPriceQuantityViewModel.cs:15-28`、`front-application/MTGBuyer/Modal/FixedPriceQuantityModal.xaml.cs:93-97`）。ケースには枚数入力と確定操作がなく、送信する `quantity`も定まらない（`cases/O01-02_mb_test_cases.tsv:47`）。
- 判定: 成立しない前提・手順
- 修正案: 固定価格モーダルへ具体的な枚数を入力して確定する手順を追加し、その枚数を `quantity`の期待値にも含める。

### 指摘8（IT-O01-02-065）
- 主張: 保管CSVの「データ行（見出し行を除く）」が3行である。
- 実際: 査定途中CSVはヘッダー出力フラグを `false`として保存され、CSV処理もフラグが真の場合にしか見出しを書かない（`front-application/MTGBuyer/Screen/Assessment/MainWindowViewModel.cs:934-946`、`front-application/MTGBuyer/Function/Csv.cs:132-145`）。したがってこのファイルに除外すべき見出し行はない。報告書自身も見出し行は設計書に無く確認しないとしている（`gen_O01-02/report.md:49-50`）。
- 判定: 期待結果の誤り
- 修正案: 「見出し行を除く」を削り、ファイル内の3レコードすべてが査定データであることを確認する。

### 指摘9（IT-O01-03-004）
- 主張: 空白だけの検索で検索要求が0件であるケースに、正常送信のIT-0317を割り当てている。
- 実際: IT-0317の判定文は「送信が正常終了すること」だが、このケースの期待は `api/v1/search`を送信しないことである（`viewpoint_canonical/viewpoints_canonical.tsv:318`、`cases/O01-03_mb_test_cases.tsv:5`）。報告書でも同ケースを検索API呼出しの確認に数えており、期待結果と矛盾する（`gen_O01-03/report.md:11,18`）。
- 判定: 判定IDの誤り
- 修正案: 適合する許可済み判定IDがなければケースを削除する。ローカル入力チェックとダイアログだけを確認する現内容は、正常送信の判定にはならない。

### 指摘10（IT-O01-02-020）
- 主張: 他担当者が査定中なら、ダイアログに「この受注は『担当O0102-020』が査定中です。」と表示される。
- 実際: O01-02設計書が定めるのは「ECCUBEが返したエラー文言の1件目を表示する」ことだけで、当該文言自体は表示メッセージ表にもない（`o01-02_other_mtg_buyer_mtg_buyer_online_purchase.md:193-195`、同`:218-241`）。実ソースも応答JSONの `errors[0]`をそのまま表示するだけである（`front-application/MTGBuyer/Entity/NetBuyOrder.cs:182-188`）。中継は単なる転送で、ケース内には返却文言の指定がない（`cases/O01-02_mb_test_cases.tsv:21`）。
- 判定: 設計書に無い期待
- 修正案: 中継が返す `errors[0]`の値を事前条件で明示し、その同値が表示されることを確認する。O01-02設計書だけを根拠にするなら、特定文言を固定してはならない。
