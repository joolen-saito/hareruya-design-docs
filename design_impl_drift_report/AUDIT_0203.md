# 実装乖離監査 — 0203_基本設計仕様書(受注管理機能).html

- 正本: `excel_to_html/output/0203_基本設計仕様書(受注管理機能).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **2158要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 12 | ○ |
| 実装違い | 実装はあるが設計と違う | 48 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 14 | — |
| 設計どおり | 設計どおり実装されている | 1607 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 462 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 15 | — |
| **合計** | | **2158** | |

## 不具合 36件（P1 1 / P2 20 / P3 15）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 30件は重複として代表へ折り畳んだ（判定そのものは 66件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-15-R061 | 受注情報編集 | 実装違い | ふるまい | P1 | 欠品数を登録しても商品在庫の在庫数と総原価は変わらず、欠品分は廃棄として欠品のデータだけが残る。 |
| sheet-13-R079 | 納品書印刷（日本語） | 実装違い | IO | P2 | 納品書の請求金額欄に出る内税額が、受注の小計に送料と手数料を足し値引きを引いた金額から算出した消費税額であること。 |
| sheet-15-R052 | 受注情報編集 | 実装違い | IO | P2 | 受注ステータスを出荷完了に更新すると、受注の出荷日と配送情報の出荷日の両方に日時が登録され、どちらの経路で更新しても受注編集画面の出荷日欄に「クリア」が出る。 |
| sheet-15-R056 | 受注情報編集 | 実装違い | ふるまい | P2 | 受注編集で明細の注文数や欠品数を変えたとき、EC-CUBE側に保持している原価をもとに商品在庫の総原価と受注明細の総原価が増減する。 |
| sheet-15-R164 | 受注情報編集 | 実装違い | ふるまい | P2 | スマレジ決済でついで買いされた商品は、取消時にEC-CUBE側で在庫数を戻さない（その商品の在庫増加はスマレジからの在庫変動連携だけで起こる）。 |
| sheet-15-R362 | 受注情報編集 | 実装違い | ふるまい | P2 | 商品検索ダイアログでカテゴリーを選んで検索すると、そのカテゴリー（配下のカテゴリーを含む）に属する商品だけが結果に出る。 |
| sheet-15-R389 | 受注情報編集 | 未実装 | ふるまい | P2 | 受注編集で本店の在庫数が変わったときと、キャンセルで在庫を戻したときに、変更後の在庫が支店側にも伝わる。 |
| sheet-15-R417 | 受注情報編集 | 実装違い | ふるまい | P2 | キャンセルでポイントを戻したとき、会員の保持ポイントから引いた量と同じ量がスマレジ側の会員ポイントにも反映される。 |
| sheet-16-R052 | 【新規】受注情報履歴 | 実装違い | ふるまい | P2 | 受注情報履歴の受注商品情報では、欠品登録ボタンだけは押下できる状態で表示され、削除・商品の追加・受注情報を登録など他のボタンだけが押せない状態になる。 |
| sheet-18-R028 | 出荷指示リスト検索 | 実装違い | ふるまい | P2 | 注文番号を入力して検索すると、その注文番号を持つ受注を含む出荷指示リストだけが一覧に出る。 |
| sheet-20-R043 | ピッキングリスト印刷 | 実装違い | ふるまい | P2 | カテゴリを持たない明細、および商品の詳細情報を持たない明細は、ピッキングリストのどのグループにも1行も出さない。 |
| sheet-20-R044 | ピッキングリスト印刷 | 実装違い | IO | P2 | 商品規格と商品名が同じ明細は、受注をまたいでも1行にまとめて出す。数量・価格・色が違っても行は分かれない。 |
| sheet-20-R046 | ピッキングリスト印刷 | 実装違い | ふるまい | P2 | 明細のカテゴリがグッズまたは予約グッズのときだけサプライのグループに出し、それ以外の明細は価格帯のグループに出す。 |
| sheet-24-R003 | 出荷実績インポート登録 | 実装違い | ふるまい | P2 | 取り込んだ注文番号の受注に出荷日が登録されていなければ、その受注が発送済みになり出荷日と送り状No.が登録される。 |
| sheet-26-R031 | 店頭注文番号札管理 | 実装違い | ふるまい | P2 | 既に同じ値の店頭注文番号札があっても同じ値をもう一度登録でき、一覧に同じ値が複数並ぶ。 |
| sheet-3-R019 | 受注情報検索 一覧(検索入力) | 未実装 | ふるまい | P2 | 引き渡し前の注文番号を注文番号欄に入力して検索すると、引き渡し後の受注情報が検索結果に表示される。 |
| sheet-3-R020 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P2 | 対応状況を1つも選択せずに検索したとき、キャンセルと引き渡し済み以外の受注（購入処理中を含む）が検索結果に出る。 |
| sheet-3-R131 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P2 | 注文備考の「注文備考なし」「注文備考あり」のいずれか1件を選んで検索すると、注文備考が未入力（または入力済）の受注だけに絞り込まれた一覧が表示される。 |
| sheet-3-R136 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P2 | 配送先のお名前（フリガナ）に値を入れて検索すると、配送先のセイとメイを連結した文字列に部分一致する受注が一覧に表示される。 |
| sheet-8-R093 | 受注詳細カスタムCSV出力 | 実装違い | IO | P2 | 受注詳細カスタムCSVを出力すると、識別ID:75〜85（配送商品ID・商品ID・商品規格ID・商品名・商品コード・規格名1/2・規格分類名1/2・価格・個数）にその明細の商品の値が出力される。 |
| sheet-9-R042 | メール一括送信 | 実装違い | ふるまい | P2 | 一括メール送信で宛先へ届かなかった受注についても、その1通分の送信履歴（件名・本文・送信日時）が残る。 |
| sheet-14-R074 | 納品書印刷（英語） | 実装違い | IO | P3 | ポイント使用の欄は、通貨記号も3桁ごとの区切りも付けない数値で出る（値引きが0のときは0と出る） |
| sheet-15-R183 | 受注情報編集 | 実装違い | IO | P3 | 受注情報編集画面で、変更先のステータスを選ぶセレクトボックスの見出しが「変更後のステータス」と表示される。 |
| sheet-15-R224 | 受注情報編集 | 実装違い | IO | P3 | Foil のバッジは Foil の商品と特殊 Foil の商品で区別でき、特殊 Foil の商品では「特殊Foil」と表示される。 |
| sheet-15-R333 | 受注情報編集 | 未実装 | IO | P3 | お届け先情報にFAX番号を3つに分けて入力する欄があり、入力した内容が保存され、次に画面を開いたときも同じ値が表示される。 |
| sheet-15-R378 | 受注情報編集 | 実装違い | ふるまい | P3 | 会員検索から会員を選ぶと、その会員の郵便番号が注文者情報の郵便番号欄に入る。 |
| sheet-19-R045 | 出荷指示リスト編集 | 実装違い | ふるまい | P3 | 出荷指示リストを削除した後、直前に見ていた検索結果のページ番号が残っているときは、そのページの出荷指示リスト検索結果へ戻る。残っていないときは出荷指示リスト検索の初期表示へ戻る。 |
| sheet-21-R006 | 出荷指示ー納品書印刷（日本語） | 実装違い | IO | P3 | 会員情報とプレイヤー情報の両方を持つ受注だけが日本語の納品書に出力され、どちらかを持たない受注は選択しても納品書に出ない。 |
| sheet-21-R027 | 出荷指示ー納品書印刷（日本語） | 実装違い | IO | P3 | ポイント使用の欄の値は、通貨記号も3桁区切りも付けずに出力される（例: 1500ポイント）。 |
| sheet-22-R004 | 出荷指示ー納品書印刷（英語） | 実装違い | ふるまい | P3 | 受注を1件も選択せずに納品書印刷を実行したときも納品書の画面自体は開き、納品書が1件も無い状態で表示される。 |
| sheet-3-R134 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P3 | 購入商品コードに入力した値と受注明細の商品コードが完全に一致する受注だけが一覧に表示される。 |
| sheet-3-R147 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P3 | 購入商品名に % や _ を入力して検索すると、その文字自体を含む商品名の受注だけが一覧に表示される。 |
| sheet-3-R159 | 受注情報検索 一覧(検索入力) | 実装違い | ふるまい | P3 | 購入商品名でAND検索を選んだとき、入力した各欄の語がそれぞれ別の受注明細に含まれている受注も一覧に表示される。 |
| sheet-3-R168 | 受注情報検索 一覧(検索入力) | 実装違い | IO | P3 | 受注一覧に並ぶ保存済み検索パターンは、検索パターン名の昇順に表示される。 |
| sheet-3-R186 | 受注情報検索 一覧(検索入力) | 未実装 | ふるまい | P3 | 同じ検索パターンの該当件数を10秒以内に続けて更新しても、前回表示された件数と同じ値が表示される。 |
| sheet-7-R068 | 受注詳細CSV出力 | 未実装 | IO | P3 | 受注詳細CSVの識別ID:67に、適用された送料の種別を識別する『送料ID』列が出力される。 |

### sheet-15-R061 受注情報編集 — 実装違い／ふるまい／P1

- 正本: sheet-15（受注情報編集） HTML行 2830 付近
- 正本引用: 「★総原価・総在庫は変動しないが、廃棄により欠品のデータを作成する」
- 設計期待値: 欠品数を登録しても商品在庫の在庫数と総原価は変わらず、欠品分は廃棄として欠品のデータだけが残る。
- 画像確認: sheet-15_img2（受注商品情報）に「数量」「欠品登録」「欠品数量」「担当者」が描かれている。
- 実装参照: `src/Eccube/Controller/Admin/Order/EditController.php:448-455;src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211`
- 実装実態: 欠品数の分だけ明細数量を減らし（src/Eccube/Controller/Admin/Order/EditController.php:448-455）、その数量差分で在庫数が欠品数の分だけ増える（src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211）。増えた在庫を打ち消す廃棄側の減算は無く、総原価も動かない。設計のパターン4（在庫数9→9）に対し実装は9→10になる。
- 判定根拠: 欠品登録は明細の数量を欠品数の分だけ減らすため、数量差分の在庫更新で在庫数が欠品数の分だけ増えてしまう。設計のパターン4は欠品後も在庫数9のままで変動しないとしている。
- 確信度: med

### sheet-13-R079 納品書印刷（日本語） — 実装違い／IO／P2

- 正本: sheet-13（納品書印刷（日本語）） HTML行 2498 付近
- 正本引用: 「消費税額は、受注の小計に送料と手数料を足し、値引きを引いた金額から算出する。」
- 設計期待値: 納品書の請求金額欄に出る内税額が、受注の小計に送料と手数料を足し値引きを引いた金額から算出した消費税額であること。
- 画像確認: sheet-13_img1.png の請求金額欄に「￥16,810(内税:￥1,528)」とあり、内税額を出す欄であることを確認した。
- 実装参照: `src/Eccube/Repository/DtbShippingStandbyRepository.php:346-348;src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:132`
- 実装実態: 小計＋送料＋手数料－値引きから消費税額を算出してはいるが、その値は納品書へ渡す結果に入らない別の入れ物へ格納されたまま捨てられている（src/Eccube/Repository/DtbShippingStandbyRepository.php:346-348）。版面が出しているのは受注に保存済みの税額そのもの（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:132）で、設計が定める算出結果ではない。
- 同じ実装実態でまとまる要求: sheet-21-R024（出荷指示ー納品書印刷（日本語） / 実装参照 `src/Eccube/Repository/DtbShippingStandbyRepository.php:347; src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:132`）
- 判定根拠: 算出結果を入れている変数は関数内のどこでも読まれず、返す結果（src/Eccube/Repository/DtbShippingStandbyRepository.php:348）にも含まれない。版面 src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:132 は受注の税額項目をそのまま出しているため、値引きがある受注や送料・手数料の課税の扱いが異なる受注では、設計が定める算出結果と表示値が食い違う。
- 確信度: med

### sheet-15-R052 受注情報編集 — 実装違い／IO／P2

- 正本: sheet-15（受注情報編集） HTML行 2821 付近
- 正本引用: 「出荷完了：出荷日を登録。配送情報の出荷日も登録。ポイントを付加。」
- 設計期待値: 受注ステータスを出荷完了に更新すると、受注の出荷日と配送情報の出荷日の両方に日時が登録され、どちらの経路で更新しても受注編集画面の出荷日欄に「クリア」が出る。
- 画像確認: sheet-15_img1のレイアウト図で「出荷日」行に「クリア」が描かれていることを確認した。
- 実装参照: `src/Eccube/Controller/Admin/Order/EditController.php:690-698;src/Eccube/Resource/template/admin/Order/edit.twig:964-971`
- 実装実態: 「受注情報を登録」経由で出荷完了に変わったときは配送情報の出荷日しか登録されない（src/Eccube/Controller/Admin/Order/EditController.php:690-698）。画面の出荷日欄は配送情報の値を表示する一方、「クリア」は受注の出荷日がある場合だけ出るため（src/Eccube/Resource/template/admin/Order/edit.twig:964-971）、この経路では出荷日が表示されているのに個別クリアができない。
- 判定根拠: 「受注情報を登録」から出荷完了へ変更した場合、配送情報の出荷日だけが入り受注側の出荷日が空のままになる。設計は両方に登録すると書いている。ステータス変更ボタン経路（src/Eccube/Controller/Admin/Order/EditController.php:872-874）は両方に入れており、同じ状態にならない。
- 確信度: med

### sheet-15-R056 受注情報編集 — 実装違い／ふるまい／P2

- 正本: sheet-15（受注情報編集） HTML行 2825 付近
- 正本引用: 「★ECCUBE側で保持している原価情報を使用して総原価・総在庫を増減する処理を行う」
- 設計期待値: 受注編集で明細の注文数や欠品数を変えたとき、EC-CUBE側に保持している原価をもとに商品在庫の総原価と受注明細の総原価が増減する。
- 画像確認: sheet-15_img2（受注商品情報）に「数量」「欠品登録」「欠品数量」「担当者」が描かれている。
- 実装参照: `src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211`
- 実装実態: 受注編集の数量差分では在庫数だけを書き換えており（src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211）、商品在庫の総原価も受注明細の総原価も更新していない。総原価の増減は新規受注時とキャンセル時にしか行われない（src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:105-128）。
- 同じ実装実態でまとまる要求: sheet-15-R065（受注情報編集 / 実装参照 `src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211;src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:105-128`）、sheet-15-R073（受注情報編集 / 実装参照 `src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211;src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:105-128`）、sheet-15-R074（受注情報編集 / 実装参照 `src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:205-211;src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:105-128`）
- 判定根拠: 受注編集の数量差分処理は在庫数だけを増減し、総原価（商品在庫の総原価・受注明細の総原価）を一切増減していない。総原価の増減は新規受注とキャンセルの経路（src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:105-128）にしか無い。
- 確信度: high

### sheet-15-R164 受注情報編集 — 実装違い／ふるまい／P2

- 正本: sheet-15（受注情報編集） HTML行 2933 付近
- 正本引用: 「・ついで買いされた商品の場合はECCUBE上では数量を変更するが、在庫はスマレジ連携されてくるのでECCUBEでのキャンセル処理は不要」
- 設計期待値: スマレジ決済でついで買いされた商品は、取消時にEC-CUBE側で在庫数を戻さない（その商品の在庫増加はスマレジからの在庫変動連携だけで起こる）。
- 実装参照: `src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:124; src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:65-68; src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:141`
- 実装実態: 取消受信時に受注の商品明細を区別せず全件在庫を戻している（ついで買い分も対象）。ついで買い分についてはスマレジからの在庫変動連携でも符号付き変動数だけ在庫が増えるため、同じ商品の在庫が二重に増える。
- 同じ実装実態でまとまる要求: sheet-27-R006（別添資料_スマレジ決済後返品処理について / 実装参照 `src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:124;src/Eccube/Service/PurchaseFlow/Processor/StockReduceProcessor.php:91;src/Eccube/Service/Smaregi/Webhook/Transaction/Handler/Pattern/OtcMemberPatternHandler.php:70;src/Eccube/Service/Smaregi/Webhook/Stock/SmaregiStockChangeApplier.php:102`）
- 判定根拠: [gate7/refute] 重要度を P2 へ。乖離自体はCONFIRMED相当。src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php:124 が受注全件に stockReduceProcessor->rollback() をかけ、ついで買い分もEC-CUBE在庫へ戻す(同37行に「受注全件」と明記)。受注 受注作成時（EccubeOtcPatternHandler）ではついで買い分の在庫減算を行っていないのに、取消時のみ全明細を戻している。src/Eccube/Service/Smaregi/Webhook/Transaction/Processor/SmaregiTransactionCanceledProcessor.php の注記にも「ついで買い分の在庫整合性はスマレジから別途送られる在庫変動 webhook で取られる前提」とあり、EC-CUBE側でも戻していることが正本の「ECCUBEでのキャンセル処理は不要」と食い違う。
- 確信度: med

### sheet-15-R362 受注情報編集 — 実装違い／ふるまい／P2

- 正本: sheet-15（受注情報編集） HTML行 3256 付近
- 正本引用: 「・検索ボタンを押下すると、商品名・商品ID・商品コード、カテゴリーを条件として商品を検索できる。」
- 設計期待値: 商品検索ダイアログでカテゴリーを選んで検索すると、そのカテゴリー（配下のカテゴリーを含む）に属する商品だけが結果に出る。
- 画像確認: 画像 sheet-15_img9.png / sheet-15_img10.png（商品検索ダイアログ）で検索欄・カテゴリー・検索ボタン・商品ID・商品名・商品コードのプルダウン・決定・ページングを確認した。 ダイアログにカテゴリーの単一選択欄があることは画像でも確認できる（欄は存在するが絞り込みが効かない）。
- 実装参照: `src/Eccube/Controller/Admin/SearchProductController.php:80-85;src/Eccube/Repository/ProductRepository.php:1263-1281;src/Eccube/Resource/template/admin/Order/edit.twig:1262-1265`
- 実装実態: ダイアログは選んだカテゴリーを1件だけ送り、受け側もカテゴリー1件を検索条件に置くが、条件を組み立てる側は複数件の並びを前提にしているため、1件のときは条件が1つも作られない。結果としてカテゴリーを選んでも選ばなかったときと同じ全件が返る。商品名・商品ID・商品コードによる絞り込みは働く。
- 同じ実装実態でまとまる要求: sheet-15-R357（受注情報編集）
- 判定根拠: 項目表6-17-2のカテゴリー欄はダイアログに単一選択として表示されるが、選んでも検索結果が絞り込まれない。詳細は同じ根本原因の指摘に記載。
- 確信度: med

### sheet-15-R389 受注情報編集 — 未実装／ふるまい／P2

- 正本: sheet-15（受注情報編集） HTML行 3287 付近
- 正本引用: 「本店の在庫が変わったことを支店へ知らせる。」
- 設計期待値: 受注編集で本店の在庫数が変わったときと、キャンセルで在庫を戻したときに、変更後の在庫が支店側にも伝わる。
- 画像確認: 画像 sheet-15_img1.png（画面全体）でブロックの並びと登録ボタン・戻るリンクの位置を確認した。
- 実装参照: `src/Eccube/Service/PurchaseFlow/Processor/StockDiffProcessor.php:174-256;src/Eccube/Service/Product/InventoryReflectService.php:108-112`
- 実装実態: 受注編集の在庫更新には支店へ知らせる処理が無い。支店側へ在庫更新を知らせる仕組みそのものが移されておらず、他の在庫更新箇所にも「移植が必要」という注記だけが残っている。
- 同じ実装実態でまとまる要求: sheet-15-R440（受注情報編集）
- 判定根拠: 受注編集の在庫増減を行う箇所を最後まで読んだが、支店へ通知する呼び出しは無い。リポジトリ全体でも支店通知は注記としてしか残っておらず、実装は存在しない。
- 確信度: high

### sheet-15-R417 受注情報編集 — 実装違い／ふるまい／P2

- 正本: sheet-15（受注情報編集） HTML行 3315 付近
- 正本引用: 「削除したポイント履歴の変動量を合計する。合計が 0 でないときは、会員の保持ポイントから合計を差し引き、同じ量をスマレジへ連携する。合計が 0 のときは、会員の保持ポイントにもスマレジにも触れない。」
- 設計期待値: キャンセルでポイントを戻したとき、会員の保持ポイントから引いた量と同じ量がスマレジ側の会員ポイントにも反映される。
- 画像確認: 画像 sheet-15_img5.png（お支払情報）を確認した。本行の対象ではない。
- 実装参照: `src/Eccube/Service/PointService.php:96-126;src/Eccube/Controller/Admin/Order/EditController.php:760-766`
- 実装実態: キャンセル時はポイント履歴を削除して合計を求め、会員の保持ポイントから差し引くところまでで終わっており、同じ量をスマレジへ戻す処理が呼ばれない。合計が0のときに何もしない点と、ポイント付与時・キャンセル以外の更新時にスマレジへ連携する点は設計どおり。
- 同じ実装実態でまとまる要求: sheet-15-R441（受注情報編集）
- 判定根拠: キャンセル時のポイント戻しを行う処理を最後まで読んだが、スマレジへポイントを送る処理は呼ばれていない。スマレジへポイントを送る仕組みは存在し、ポイント付与時と会員ポイントの手動増減では使われているが、キャンセル時の戻しからは使われていない。
- 確信度: high

### sheet-16-R052 【新規】受注情報履歴 — 実装違い／ふるまい／P2

- 正本: sheet-16（【新規】受注情報履歴） HTML行 3673 付近
- 正本引用: 「・欠品登録以外のボタンは非活性とする」
- 設計期待値: 受注情報履歴の受注商品情報では、欠品登録ボタンだけは押下できる状態で表示され、削除・商品の追加・受注情報を登録など他のボタンだけが押せない状態になる。
- 画像確認: 画像 sheet-16_img2.png（受注商品情報）で該当位置を確認した。 図中の欠品登録ボタンは削除・商品の追加と異なりグレーアウト表現になっていない。
- 実装参照: `src/Eccube/Resource/template/admin/Order/edit.twig:1164; src/Eccube/Resource/template/admin/Order/edit.twig:845`
- 実装実態: 欠品登録ボタンにも履歴表示用の非活性属性を付けており（src/Eccube/Resource/template/admin/Order/edit.twig:1164）、削除・商品の追加・受注情報を登録と同様に押せない。
- 判定根拠: 設計は「欠品登録以外のボタンは非活性とする」と、欠品登録だけを非活性の対象外にしている（項目表でも 4-15 削除・4-17 商品の追加・4-18 受注情報を登録には「非活性」と書かれるのに対し、4-3 欠品登録の画面部品の説明は「-」で非活性指定が無い）。実装は src/Eccube/Resource/template/admin/Order/edit.twig:845 で組み立てた非活性属性を src/Eccube/Resource/template/admin/Order/edit.twig:1164 の欠品登録ボタンにも一律に付けている。
- 確信度: high

### sheet-18-R028 出荷指示リスト検索 — 実装違い／ふるまい／P2

- 正本: sheet-18（出荷指示リスト検索） HTML行 4140 付近
- 正本引用: 「注文番号その注文番号を持つ受注を含む出荷指示リストに限定する」
- 設計期待値: 注文番号を入力して検索すると、その注文番号を持つ受注を含む出荷指示リストだけが一覧に出る。
- 画像確認: sheet-18_img1.png（検索画面全体）/ sheet-18_img2.png（編集・削除のポップアップ）を確認。画像1の「注文番号」欄が対象。
- 実装参照: `src/Eccube/Repository/DtbShippingStandbyRepository.php:85-89; src/Eccube/Resource/template/admin/ShippingStandby/index.twig:133-135`
- 実装実態: 画面の「注文番号」欄に入れた値は、受注の注文番号ではなく受注の連番（内部の受注ID）と突き合わせられる。注文番号は受注IDとは別に採番される文字列（src/Eccube/Entity/Order.php:693-694、画像では 00502419 のような8桁）のため、実際の注文番号を入れると該当なしになり、たまたま受注IDと同じ数字を入れると無関係な出荷指示リストが出る。
- 判定根拠: 入力欄の名称は src/Eccube/Resource/template/admin/ShippingStandby/index.twig:134 で「注文番号」だが、絞り込みは src/Eccube/Repository/DtbShippingStandbyRepository.php:86-88 が受注の連番と比較している。同じ画面でも編集画面側は注文番号を別項目として扱っており（src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:176-180）、両者が別物であることは実装内でも一貫している。
- 確信度: high

### sheet-20-R043 ピッキングリスト印刷 — 実装違い／ふるまい／P2

- 正本: sheet-20（ピッキングリスト印刷） HTML行 4409 付近
- 正本引用: 「商品・商品規格・商品サブ情報・商品規格サブ情報・カテゴリのいずれかを持たない明細は出さない。」
- 設計期待値: カテゴリを持たない明細、および商品の詳細情報を持たない明細は、ピッキングリストのどのグループにも1行も出さない。
- 画像確認: レイアウト図2枚を確認。該当箇所の記載は無し（本行はソート順/現行仕様の記述）。
- 実装参照: `src/Eccube/Repository/DtbShippingStandbyRepository.php:157;src/Eccube/Repository/DtbShippingStandbyRepository.php:177;src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:397`
- 実装実態: カテゴリは任意結合で、カテゴリ数が0のときは1として扱うため（src/Eccube/Repository/DtbShippingStandbyRepository.php:157、src/Eccube/Repository/DtbShippingStandbyRepository.php:177）、カテゴリを持たない明細もそのまま1行として出力される。詳細情報を持たない明細も除外されず、src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:397 と src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:426-427 でサプライのグループへ入る。
- 判定根拠: 商品またはカテゴリを持たない明細を除いているかを src/Eccube/Repository/DtbShippingStandbyRepository.php:173-183 の結合と src/Eccube/Repository/DtbShippingStandbyRepository.php:155-157 の件数算出で確認した。商品・商品規格は必須結合だが、カテゴリは任意結合のうえ件数0を1へ読み替えており、カテゴリを持たない明細も1行として出る。サプライ品判定に使う詳細情報も除外条件ではなく分岐条件で、詳細情報を持たない明細は除かれずサプライのグループに出る（src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:395-397、src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:426-427）。現行（pf-eccube3）はカテゴリと商品サブ情報を必須結合にして除外している。
- 確信度: med

### sheet-20-R044 ピッキングリスト印刷 — 実装違い／IO／P2

- 正本: sheet-20（ピッキングリスト印刷） HTML行 4410 付近
- 正本引用: 「同じ商品規格で同じ商品名の明細は 1 行にまとめる。受注をまたいでもまとめるため、行数は選んだ受注の件数では決まらない。」
- 設計期待値: 商品規格と商品名が同じ明細は、受注をまたいでも1行にまとめて出す。数量・価格・色が違っても行は分かれない。
- 画像確認: レイアウト図2枚を確認。該当箇所の記載は無し（本行はソート順/現行仕様の記述）。
- 実装参照: `src/Eccube/Repository/DtbShippingStandbyRepository.php:188;src/Eccube/Repository/DtbShippingStandbyRepository.php:190;src/Eccube/Repository/DtbShippingStandbyRepository.php:200`
- 実装実態: まとめ単位に色（src/Eccube/Repository/DtbShippingStandbyRepository.php:188）、受注明細の数量（src/Eccube/Repository/DtbShippingStandbyRepository.php:190）、受注明細の価格（src/Eccube/Repository/DtbShippingStandbyRepository.php:200）などが加わっているため、商品規格と商品名が同じでもこれらが違えば別行になる。色が複数あるカードは色の数だけ行が増え、1行あたりのピック数も変わる。
- 判定根拠: まとめ単位を src/Eccube/Repository/DtbShippingStandbyRepository.php:188-213 で確認した。商品規格と商品名のほかに、色・受注明細の数量・受注明細の価格などもまとめ単位に含まれるため、商品規格と商品名が同じでも数量や価格が違う明細は別々の行になり、色が複数付いたカードは色の数だけ行が増える。現行（pf-eccube3 DtbShippingStandbyRepository.php:190）は商品規格と商品名だけでまとめている。
- 確信度: med

### sheet-20-R046 ピッキングリスト印刷 — 実装違い／ふるまい／P2

- 正本: sheet-20（ピッキングリスト印刷） HTML行 4412 付近
- 正本引用: 「サプライ品として扱うのは、グッズと予約グッズのカテゴリの明細である。」
- 設計期待値: 明細のカテゴリがグッズまたは予約グッズのときだけサプライのグループに出し、それ以外の明細は価格帯のグループに出す。
- 画像確認: レイアウト図2枚を確認。該当箇所の記載は無し（本行はソート順/現行仕様の記述）。
- 実装参照: `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:397;src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:425;src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:427;src/Eccube/Repository/DtbShippingStandbyRepository.php:168`
- 実装実態: サプライかどうかを、カテゴリではなく商品規格に詳細情報が紐づくかで決めている（src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:397 の判定、src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:425 と src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:427 の振り分け）。そのためグッズ／予約グッズのカテゴリでも詳細情報があれば価格帯のグループに出て、カード等でも詳細情報が無ければサプライのグループに出る。カテゴリの値は src/Eccube/Repository/DtbShippingStandbyRepository.php:168 で取得しているが使われていない。
- 判定根拠: サプライ品の判定条件を src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:395-397 と src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:425-427 で確認した。カテゴリではなく「商品規格に詳細情報が紐づくか」で分岐している。カテゴリは src/Eccube/Repository/DtbShippingStandbyRepository.php:168 で取得しているが分岐に使われていない。ee にもグッズ／予約グッズのカテゴリ定数は存在する（src/Eccube/Entity/Category.php:42,44）が本機能では未使用。現行（pf-eccube3 ShippingStandbyController.php:250）はカテゴリ定数との一致で判定している。
- 確信度: med

### sheet-24-R003 出荷実績インポート登録 — 実装違い／ふるまい／P2

- 正本: sheet-24（出荷実績インポート登録） HTML行 4700 付近
- 正本引用: 「・指定した注文番号に該当する受注情報データの「出荷日」が登録済みでなければデータを更新する。」
- 設計期待値: 取り込んだ注文番号の受注に出荷日が登録されていなければ、その受注が発送済みになり出荷日と送り状No.が登録される。
- 実装参照: `src/Eccube/Service/Csv/OrderCsv.php:132-143`
- 実装実態: 対応状況が「出荷指示」の受注だけを更新する条件になっており、出荷日が未登録でも対応状況が出荷指示以外の受注は発送済みにならず、出荷日・送り状No.も登録されない（配送先の出荷日だけが更新される）。
- 判定根拠: 設計は出荷日が未登録なら更新すると定めるが、実装は対応状況が「出荷指示」の受注だけを更新対象にしている（src/Eccube/Service/Csv/OrderCsv.php:132-143）。
- 確信度: med

### sheet-26-R031 店頭注文番号札管理 — 実装違い／ふるまい／P2

- 正本: sheet-26（店頭注文番号札管理） HTML行 4932 付近
- 正本引用: 「すでに同じ値の店頭注文番号札が登録されていても、重ねて登録できる。登録時に既存の値との重複は確かめない。」
- 設計期待値: 既に同じ値の店頭注文番号札があっても同じ値をもう一度登録でき、一覧に同じ値が複数並ぶ。
- 画像確認: レイアウト図の一覧には「AA」「BB」「AA」「CC」と同じ値が2回並んでおり、重複して登録できることが図でも示されている。
- 実装参照: `src/Eccube/Service/Admin/Order/WaitingTagStoreAction.php:42-47;src/Eccube/Controller/Admin/Order/WaitingTagController.php:131-141`
- 実装実態: 登録時に同じ値の番号札があるかを（店舗を問わず）調べ、見つかると「同一店頭注文番号札が存在しています」を表示して登録しない。同じ値は2つ目以降を登録できない。
- 判定根拠: 設計は同じ値を重ねて登録できると定めるが、実装は登録前に同じ値の有無を調べ、既にあると登録を拒む（src/Eccube/Service/Admin/Order/WaitingTagStoreAction.php:42-47）。
- 確信度: high

### sheet-3-R019 受注情報検索 一覧(検索入力) — 未実装／ふるまい／P2

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1173 付近
- 正本引用: 「・引き渡し後の受注情報に引き渡し前の注文番号を紐づけておき、引き渡し前の注文番号で検索した際に、引き渡し後の受注情報が検索できるようにする」
- 設計期待値: 引き渡し前の注文番号を注文番号欄に入力して検索すると、引き渡し後の受注情報が検索結果に表示される。
- 画像確認: レイアウト図の「注文番号」入力欄に対応する検索挙動。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:272-277;src/Eccube/Repository/OrderRepository.php:589-591;src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:327`
- 実装実態: 注文番号の検索は受注自身の注文番号への部分一致だけで、引き渡し前の注文番号を保持する項目が引き渡し後の受注に無い。引き渡し後の受注は新規採番された注文番号を持ち、引き渡し前の受注は検索結果から除外されるため、引き渡し前の注文番号で検索すると0件になる。
- 判定根拠: 引き渡し後の受注（統合受注）は新規採番の注文番号を持ち、引き渡し前の受注は結果から除外される。引き渡し前の注文番号を引き渡し後の受注から辿れる項目・条件はee全体を検索しても存在しない。
- 確信度: med

### sheet-3-R020 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1174 付近
- 正本引用: 「・ステータスを未選択時のデフォルト検索の場合はキャンセル、引き渡し済み以外の受注を検索対象とする」
- 設計期待値: 対応状況を1つも選択せずに検索したとき、キャンセルと引き渡し済み以外の受注（購入処理中を含む）が検索結果に出る。
- 画像確認: レイアウト図の対応状況に「購入処理中」のチェック項目がある。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:301-321;src/Eccube/Form/Type/Admin/SearchOrderType.php:141-157`
- 実装実態: 対応状況未選択時の既定条件が、購入処理中・キャンセル・対応中・引き渡し済み・返品の5つを除外している。購入処理中は対応状況のチェック項目として選択できるにもかかわらず、既定検索では結果に出ない。
- 判定根拠: src/Eccube/Repository/OrderRepository.php:309-320 の既定除外リストに OrderStatus::PROCESSING（購入処理中）が含まれる。購入処理中は項目定義2-3のチェック項目にあり、選択肢からも除外されていない（src/Eccube/Form/Type/Admin/SearchOrderType.php:145-152 が除外するのは対応中・引き渡し済み・返品のみ）ため、既定検索でだけ落ちる。
- 確信度: med

### sheet-3-R131 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1290 付近
- 正本引用: 「選択が 1 件のときだけ、注文備考が未入力か入力済かで絞り込む」
- 設計期待値: 注文備考の「注文備考なし」「注文備考あり」のいずれか1件を選んで検索すると、注文備考が未入力（または入力済）の受注だけに絞り込まれた一覧が表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)右上の「注文備考」欄に『注文備考なし』『注文備考あり』の2チェックボックスがあることを確認。画面には存在するが絞り込みが効かない。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:360`
- 実装実態: src/Eccube/Repository/OrderRepository.php:360-367 の絞り込みは選択値を整数 1／0 と厳密比較しているが、画面から渡る選択値は文字列の '1'／'0'（src/Eccube/Form/Type/Admin/SearchOrderType.php:261-271 の選択肢定義）であるため、どちらの分岐にも入らず条件が一切付かない。注文備考なし／ありを選んでも一覧は絞り込まれない。
- 判定根拠: src/Eccube/Form/Type/Admin/SearchOrderType.php:261-271 で message_flg の選択肢の値は '0'（注文備考なし）と '1'（注文備考あり）の文字列として定義されている。src/Eccube/Repository/OrderRepository.php:361 と src/Eccube/Repository/OrderRepository.php:364 は in_array(1, ..., true) / in_array(0, ..., true) と型まで一致させる比較のため、文字列 '1'／'0' はどちらにも一致しない。同じシートの「各日付の未入力／入力済」は src/Eccube/Repository/OrderRepository.php:461-469 で選択件数が1件のときだけ絞り込む形に実装されており、注文備考だけ絞り込みが成立しない。
- 確信度: high

### sheet-3-R136 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P2

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1295 付近
- 正本引用: 「配送先のセイとメイを連結した文字列への部分一致」
- 設計期待値: 配送先のお名前（フリガナ）に値を入れて検索すると、配送先のセイとメイを連結した文字列に部分一致する受注が一覧に表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)の配送先ブロックに「お名前（フリガナ）」欄が存在することを確認。画面項目はあるが検索が成立しない。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:541`
- 実装実態: src/Eccube/Repository/OrderRepository.php:543 の検索条件式は CONCAT( の括弧が閉じておらず（CONCAT(COALESCE(s.kana01,''), COALESCE(s.kana02,'') LIKE :shipping_kana）、配送先フリガナに値を入れて検索すると条件式の解析に失敗して一覧が表示できない。
- 判定根拠: src/Eccube/Repository/OrderRepository.php:534-538（配送先のお名前）や src/Eccube/Repository/OrderRepository.php:555-559（配送先の電話番号）は CONCAT(...) が正しく閉じているのに対し、src/Eccube/Repository/OrderRepository.php:543 だけ閉じ括弧が1つ足りない。この条件は src/Eccube/Repository/OrderRepository.php:541 の通り配送先フリガナが入力されたときだけ組み立てられるため、当該欄を使った検索が成立しない。
- 確信度: high

### sheet-8-R093 受注詳細カスタムCSV出力 — 実装違い／IO／P2

- 正本: sheet-8（受注詳細カスタムCSV出力） HTML行 1986 付近
- 正本引用: 「現行機能の"受注詳細CSV出力”をベースに下記カスタマイズを行う」
- 設計期待値: 受注詳細カスタムCSVを出力すると、識別ID:75〜85（配送商品ID・商品ID・商品規格ID・商品名・商品コード・規格名1/2・規格分類名1/2・価格・個数）にその明細の商品の値が出力される。
- 画像確認: 画像0枚（sheet-8にレイアウト図は無い）
- 実装参照: `src/Eccube/Service/CsvExportService.php:494; src/Eccube/Service/CsvExportService.php:503; src/Eccube/Controller/Admin/Order/OrderController.php:449`
- 実装実態: 受注詳細カスタムCSVは配送1件につき1行を作り、各列の値を受注と配送からしか引き当てていない（src/Eccube/Service/CsvExportService.php:494-508）。注文商品からは引き当てないため、識別ID:75〜85の11列は見出しだけ出て値が常に空になる。ベースとした受注詳細CSVダウンロードは注文商品ごとに1行を作って同じ列に値を入れており（src/Eccube/Controller/Admin/Order/OrderController.php:449-467）、出力内容が食い違う。
- 判定根拠: [gate7/refute] 重要度を P2 へ。欠陥自体は実在する。概要「カスタムCSV機能より配送情報CSV出力の項目を変更した状態で出力」より本シートはカスタムCSV経路であり、src/Eccube/Controller/Admin/CustomExportCsvController.php:42-46 が CSV_TYPE_SHIPPING を exportShipping に割り当て、src/Eccube/Service/CsvExpo 識別ID:76〜85は注文商品の値として、識別ID:75は配送の商品として出力項目に登録されている（app/DoctrineMigrations/Version20260226000001.php:103-113）が、カスタムCSVの出力処理は受注と配送しか見ないため、これらの列に入る値が存在しない。出荷実績入力用のCSVとして商品も個数も出ないため、そのままでは出荷作業に使えない。
- 確信度: high

### sheet-9-R042 メール一括送信 — 実装違い／ふるまい／P2

- 正本: sheet-9（メール一括送信） HTML行 2099 付近
- 正本引用: 「宛先に届かなかったときも送信履歴を登録する。送信の成否は履歴に持たない。受注そのものは更新しない。」
- 設計期待値: 一括メール送信で宛先へ届かなかった受注についても、その1通分の送信履歴（件名・本文・送信日時）が残る。
- 実装参照: `src/Eccube/Service/MailService.php:2399-2412`
- 実装実態: 送信で配送エラーが起きると送信履歴を作らずに失敗として返し、以降の受注も送らずに受注一覧へ戻る。届かなかった受注の履歴は1件も残らない。
- 判定根拠: 設計は宛先へ届かなかったときも1通分の送信履歴を残すと定めるが、実装は配送に失敗した時点で履歴を残さずに打ち切る（src/Eccube/Service/MailService.php:2399-2412）。受注を更新しない点・履歴に成否を持たない点は設計どおり。
- 確信度: med

### sheet-14-R074 納品書印刷（英語） — 実装違い／IO／P3

- 正本: sheet-14（納品書印刷（英語）） HTML行 2668 付近
- 正本引用: 「受注のあとに商品名を変えたときも、納品書に出る商品名は変わらない。金額は通貨記号 ¥ と空白 1 個を前に置き、3 桁ごとに区切って出す。ポイント使用の欄には通貨記号も桁区切りも付けず、値引きが 0 のときも 0 と出す。」
- 設計期待値: ポイント使用の欄は、通貨記号も3桁ごとの区切りも付けない数値で出る（値引きが0のときは0と出る）
- 画像確認: sheet-14_img1.png（英語納品書のレイアウト図）を確認。図のポイント使用は 0Points で、桁区切りの有無は図からは判別できない。
- 実装参照: `src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:108`
- 実装実態: ポイント使用の欄は値引き額を3桁ごとに区切った文字列で出る（値引き1500なら 1,500Points）。通貨記号が付かない点と0のとき0と出る点は設計どおり。
- 同じ実装実態でまとまる要求: sheet-22-R022（出荷指示ー納品書印刷（英語））
- 判定根拠: ポイント使用の欄は値引き額を3桁区切りで整形して出している（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:108）。既定では3桁ごとに区切り記号が入り、本リポジトリにその既定を変える指定は無い（app/config/eccube/packages/twig.yaml）。通貨記号を付けない点と、値引きが0のときに0と出る点は設計どおり。金額欄（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:105-107, src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.en.twig:118）は通貨記号付き・3桁区切りで設計どおり。
- 確信度: med

### sheet-15-R183 受注情報編集 — 実装違い／IO／P3

- 正本: sheet-15（受注情報編集） HTML行 2953 付近
- 正本引用: 「3-6	変更後のステータス	単一選択（セレクトボックス）	-	-	-」
- 設計期待値: 受注情報編集画面で、変更先のステータスを選ぶセレクトボックスの見出しが「変更後のステータス」と表示される。
- 画像確認: sheet-15_img1.png（受注情報編集本体のレイアウト図）を確認
- 実装参照: `src/Eccube/Resource/template/admin/Order/edit.twig:914-921; src/Eccube/Resource/locale/messages.ja.yaml:2541`
- 実装実態: セレクトボックスは実装されているが、見出しは「対応状況」と表示される。直上に別途「現在のステータス」を出しているため、画面上は「現在のステータス」「対応状況」が並ぶ。
- 同じ実装実態でまとまる要求: sheet-15-R192（受注情報編集 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:963-973; src/Eccube/Resource/locale/messages.ja.yaml:2495`）、sheet-15-R211（受注情報編集 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:1704-1712; src/Eccube/Resource/locale/messages.ja.yaml:2568`）、sheet-15-R213（受注情報編集 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:1929-1944`）
- 判定根拠: 正本の項目表は識別ID 3-5 を「現在のステータス」、3-6 を「変更後のステータス」と定義し、レイアウト図でも「変更後のステータス：」と書かれている。実装は 3-5 のみ独自文言を持ち、3-6 は EC-CUBE 標準の「対応状況」のままである。
- 確信度: high

### sheet-15-R224 受注情報編集 — 実装違い／IO／P3

- 正本: sheet-15（受注情報編集） HTML行 3026 付近
- 正本引用: 「・FoilについてはFoil、特殊の場合のみ表示する、フレームについては特殊の場合のみ表示する」
- 設計期待値: Foil のバッジは Foil の商品と特殊 Foil の商品で区別でき、特殊 Foil の商品では「特殊Foil」と表示される。
- 画像確認: sheet-15_img3.png に「特殊Foil」、sheet-15_img2.png に「Foil」のバッジを確認
- 実装参照: `src/Eccube/Resource/template/admin/Order/edit.twig:1174-1176; src/Eccube/Entity/Master/MtbCardDetail.php:34-36`
- 実装実態: Foil 区分が 0 以外（Foil・特殊 Foil のいずれでも）のときに一律「Foil」と表示し、特殊 Foil を区別していない。フレーム側は特殊のときだけ「特殊フレーム」と表示しており設計どおり。
- 判定根拠: レイアウト図 sheet-15_img3.png では同じ位置に「特殊Foil」のバッジが描かれ、sheet-15_img2.png では「Foil」のバッジが描かれている。ee 内でも在庫編集側は特殊 Foil を「特殊Foil」と表示している（src/Eccube/Service/Admin/Stock/StockEditLineItemRowBuilder.php:128）ので、受注編集だけ区別が落ちている。
- 確信度: med

### sheet-15-R333 受注情報編集 — 未実装／IO／P3

- 正本: sheet-15（受注情報編集） HTML行 3212 付近
- 正本引用: 「・対象受注のお届け先情報を編集できる」
- 設計期待値: お届け先情報にFAX番号を3つに分けて入力する欄があり、入力した内容が保存され、次に画面を開いたときも同じ値が表示される。
- 画像確認: 画像 sheet-15_img7.png（お届け先情報）には電話番号の下にFAX番号の3分割入力欄が描かれており、項目表12-16〜12-18と一致する。実装側にはこの行が無い。
- 実装参照: `src/Eccube/Form/Type/Admin/ShippingType.php:73-242;src/Eccube/Resource/template/admin/Order/edit.twig:1753-1905`
- 実装実態: お届け先情報にFAX番号の入力欄が無い。FAX番号の欄があるのは注文者情報だけで、お届け先にFAX番号を保持する場所も無いため、入力も保存も表示もできない。
- 同じ実装実態でまとまる要求: sheet-15-R334（受注情報編集）、sheet-15-R335（受注情報編集）、sheet-16-R147（【新規】受注情報履歴 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:1843-1861`）、sheet-16-R148（【新規】受注情報履歴 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:1843-1861`）、sheet-16-R149（【新規】受注情報履歴 / 実装参照 `src/Eccube/Resource/template/admin/Order/edit.twig:1843-1861`）、sheet-7-R060（受注詳細CSV出力 / 実装参照 `app/DoctrineMigrations/Version20260226000001.php:88-90;src/Eccube/Entity/Shipping.php:37-120`）、sheet-7-R061（受注詳細CSV出力 / 実装参照 `app/DoctrineMigrations/Version20260226000001.php:88-90;src/Eccube/Entity/Shipping.php:37-120`）、sheet-7-R062（受注詳細CSV出力 / 実装参照 `app/DoctrineMigrations/Version20260226000001.php:88-90;src/Eccube/Entity/Shipping.php:37-120`）
- 判定根拠: お届け先情報のフォーム項目（お名前・ふりがな・郵便番号・国・都道府県・住所1-3・電話番号・会社名・配送方法・お届け日・お届け時間・送り状No.）を全て確認したが、FAX番号に相当する項目は無い。edit.twig でFAX番号が出るのは注文者情報の1か所のみ。
- 確信度: high

### sheet-15-R378 受注情報編集 — 実装違い／ふるまい／P3

- 正本: sheet-15（受注情報編集） HTML行 3276 付近
- 正本引用: 「会員IDを 1 件指定して、その会員の内容を注文者情報の入力欄へ呼び出す。指定したIDに一致する会員が無いときは、未検出として返す。」
- 設計期待値: 会員検索から会員を選ぶと、その会員の郵便番号が注文者情報の郵便番号欄に入る。
- 画像確認: 画像 sheet-15_img6.png（注文者情報）では郵便番号が前半・後半の2欄に分かれて描かれており、実装の画面と一致する。値を流し込む側だけが1欄前提のまま残っている。
- 実装参照: `src/Eccube/Resource/template/admin/Order/search_customer.twig:18-36;src/Eccube/Resource/template/admin/Order/edit.twig:1513-1523;src/Eccube/Controller/Admin/Order/EditController.php:1387-1412`
- 実装実態: 会員を選ぶと会員ID・氏名・ふりがな・都道府県・住所1・住所2・メールアドレス・電話番号・会社名は入力欄に入るが、郵便番号だけはどの欄にも入らない。画面の郵便番号は前半・後半の2欄に分かれているのに、値を入れようとしている先が画面に無い1つの欄になっている。一致する会員が無いときに未検出を返す点は設計どおり。
- 判定根拠: 会員選択時に値を流し込む処理が指す郵便番号の欄の名前が、受注編集画面に実在する前半・後半2欄の名前と一致しない。edit.twig で郵便番号として出力されているのは postalCode01 と postalCode02 の2欄だけで、単一の郵便番号欄は存在しない。
- 確信度: med

### sheet-19-R045 出荷指示リスト編集 — 実装違い／ふるまい／P3

- 正本: sheet-19（出荷指示リスト編集） HTML行 4284 付近
- 正本引用: 「削除後の戻り先は、検索時のページ番号を保持しているかどうかで決まる。」
- 設計期待値: 出荷指示リストを削除した後、直前に見ていた検索結果のページ番号が残っているときは、そのページの出荷指示リスト検索結果へ戻る。残っていないときは出荷指示リスト検索の初期表示へ戻る。
- 画像確認: sheet-19_img1.png（出荷指示リスト編集画面）を確認。戻り先は画像1では確認できない（画面遷移のため）。
- 実装参照: `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:305-307`
- 実装実態: 削除後は常に出荷指示リスト検索の初期表示へ戻る。ページ番号を読み出す先が検索時に書き込む先と違う名前になっているため、何ページ目から削除しても番号は取り出せず、検索結果のページへは戻らない。さらに番号が取り出せた場合に使う遷移先の指定は実在しないため、その分岐は成立しない。
- 同じ実装実態でまとまる要求: sheet-19-R047（出荷指示リスト編集）
- 判定根拠: 削除後の分岐は src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:305-307。検索時にページ番号を書き込むのは src/Eccube/Controller/Admin/SearchControllerTrait.php:112,190 で、書き込む名前と読み出す名前が食い違う。読み出せた場合の遷移先 admin_shipping_standby_search は実装のどこにも定義が無く（同名の定義は src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:95-109 の admin_shipping_standby / admin_shipping_standby_page のみ）、仮に番号が取り出せても遷移できない。
- 確信度: high

### sheet-21-R006 出荷指示ー納品書印刷（日本語） — 実装違い／IO／P3

- 正本: sheet-21（出荷指示ー納品書印刷（日本語）） HTML行 4487 付近
- 正本引用: 「出荷指示リストで選んだ受注のうち、次をすべて満たす受注だけが納品書に出る。満たさない受注は、選んでいても納品書に出ない。会員情報とプレイヤー情報を持つ」
- 設計期待値: 会員情報とプレイヤー情報の両方を持つ受注だけが日本語の納品書に出力され、どちらかを持たない受注は選択しても納品書に出ない。
- 画像確認: 本シートに画像は無い（images/ に sheet-21_img* が存在しない）。レイアウトは納品書テンプレート delivery_slips.ja.twig の記述で確認した。
- 実装参照: `src/Eccube/Repository/DtbShippingStandbyRepository.php:304-305; src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:86-90`
- 実装実態: 会員・プレイヤーが紐付いていない受注も納品書に出力され、会員番号欄が『非会員』と表示される。
- 同じ実装実態でまとまる要求: sheet-22-R007（出荷指示ー納品書印刷（英語） / 実装参照 `src/Eccube/Repository/DtbShippingStandbyRepository.php:304-305`）
- 判定根拠: 納品書対象受注の取得では会員・プレイヤーが未紐付けでも受注が残る作りになっており（src/Eccube/Repository/DtbShippingStandbyRepository.php:304-305 とその直前のコメント『スマレジ非会員取引など Customer 未紐付け受注も納品書対象とする』）、会員番号欄はスマレジ会員IDが無いとき『非会員』と表示される（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:86-90）。設計は会員情報とプレイヤー情報を持つ受注だけが納品書に出るとしており、対象受注の集合が設計と異なる。
- 確信度: high

### sheet-21-R027 出荷指示ー納品書印刷（日本語） — 実装違い／IO／P3

- 正本: sheet-21（出荷指示ー納品書印刷（日本語）） HTML行 4508 付近
- 正本引用: 「金額は通貨記号「¥」を前に付け、3 桁ごとに区切って出す。ポイント使用の欄だけは、どちらも付けない。」
- 設計期待値: ポイント使用の欄の値は、通貨記号も3桁区切りも付けずに出力される（例: 1500ポイント）。
- 画像確認: 本シートに画像は無い（images/ に sheet-21_img* が存在しない）。レイアウトは納品書テンプレート delivery_slips.ja.twig の記述で確認した。
- 実装参照: `src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:120`
- 実装実態: ポイント使用の欄が3桁区切り付きで出力される（例: 1,500ポイント）。
- 判定根拠: 金額欄は通貨記号と3桁区切りの付く書式で出るが（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:117-119,132,160,166）、ポイント使用欄は3桁区切りの付く数値書式で出力されている（src/Eccube/Resource/template/admin/ShippingStandby/delivery_slips.ja.twig:120）。通貨記号は付かないものの、設計が『どちらも付けない』としている3桁区切りが付く。
- 確信度: med

### sheet-22-R004 出荷指示ー納品書印刷（英語） — 実装違い／ふるまい／P3

- 正本: sheet-22（出荷指示ー納品書印刷（英語）） HTML行 4545 付近
- 正本引用: 「受注を 1 件も選択していないときも画面は開くが、納品書は 1 件も出ない。」
- 設計期待値: 受注を1件も選択せずに納品書印刷を実行したときも納品書の画面自体は開き、納品書が1件も無い状態で表示される。
- 画像確認: 本シートに画像は無い（images/ に sheet-22_img* が存在しない）。レイアウトは英語納品書テンプレート delivery_slips.en.twig の記述で確認した。
- 実装参照: `src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:471-473`
- 実装実態: 受注が1件も選択されていないと未検出応答となり、開いたウィンドウには納品書の画面ではなくエラー応答が表示される。
- 判定根拠: 出荷指示リストが取得できないときに未検出応答を返す点は設計どおり（src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:465-467）。一方、受注を1件も選択せずに実行した場合は納品書の画面を組み立てずに未検出応答を返しており（src/Eccube/Controller/Admin/Order/ShippingStandbyController.php:471-473）、印刷用に開いたウィンドウには納品書ではなくエラー応答の画面が出る。編集画面のチェックは既定で全件ONだが利用者が外せるため（src/Eccube/Resource/template/admin/ShippingStandby/edit.twig:157）、この状態は画面操作で発生する。
- 確信度: med

### sheet-3-R134 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1293 付近
- 正本引用: 「受注明細の商品コードへの完全一致 配送先のお名前 配送先の姓と名を連結した文字列への部分一致」
- 設計期待値: 購入商品コードに入力した値と受注明細の商品コードが完全に一致する受注だけが一覧に表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)の「購入商品コード」欄に対応。図からは一致条件までは読み取れない。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:514`
- 実装実態: src/Eccube/Repository/OrderRepository.php:514-518 は oi.product_code LIKE '%値%' の部分一致で検索しており、入力した商品コードを含む別コードの受注も一覧に出る。
- 判定根拠: 設計（現行仕様の検索条件表）は購入商品コードを『受注明細の商品コードへの完全一致』と定めているが、src/Eccube/Repository/OrderRepository.php:516-517 は前後にワイルドカードを付けた部分一致になっている。注文番号など部分一致と定めた項目と同じ書き方であり、完全一致の指定は実装に無い。参考に、スマレジ取引IDは src/Eccube/Repository/OrderRepository.php:583-587 で完全一致として実装されている。
- 確信度: high

### sheet-3-R147 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1306 付近
- 正本引用: 「フリーワード 3 欄と購入商品名の 3 欄は、入力値のワイルドカード文字 % と _ をエスケープして文字そのものとして扱う。」
- 設計期待値: 購入商品名に % や _ を入力して検索すると、その文字自体を含む商品名の受注だけが一覧に表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)の「購入商品名」3欄に対応。図からはエスケープ有無は読み取れない。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:484; src/Eccube/Util/SqlUtil.php:141`
- 実装実態: フリーワード3欄は SqlUtil.php:141 で % と _ をエスケープしているが、購入商品名3欄は src/Eccube/Repository/OrderRepository.php:487-489 で入力値をそのまま前後ワイルドカード付きの部分一致に渡しており、入力した % や _ がワイルドカードとして働く。
- 判定根拠: 設計はフリーワード3欄と購入商品名3欄の両方をエスケープ対象と定め、エスケープしない項目を列挙している（購入商品名は列挙に含まれない）。実装ではフリーワード側（SqlUtil.php:141 の addcslashes）だけがエスケープされ、購入商品名側（src/Eccube/Repository/OrderRepository.php:489）にエスケープが無い。
- 確信度: med

### sheet-3-R159 受注情報検索 一覧(検索入力) — 実装違い／ふるまい／P3

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1318 付近
- 正本引用: 「それ以外のとき: 入力済みの各欄ごとに受注明細を個別に絞り込むため、語どうしは AND になる。」
- 設計期待値: 購入商品名でAND検索を選んだとき、入力した各欄の語がそれぞれ別の受注明細に含まれている受注も一覧に表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)の「購入商品名」3欄と「AND/OR選択」に対応。図からは AND の意味までは読み取れない。
- 実装参照: `src/Eccube/Repository/OrderRepository.php:493`
- 実装実態: src/Eccube/Repository/OrderRepository.php:493-500 は同一の受注明細に対して各欄の条件を重ねているため、1件の受注明細の商品名が入力した全ての語を含む受注しか一覧に出ない。欄ごとに別の受注明細が一致する受注は結果から漏れる。
- 判定根拠: 設計は各欄が受注明細を個別に絞り込むと定めている。実装は src/Eccube/Repository/OrderRepository.php:494 のコメントどおり『同一 OrderItem の product_name がすべての語句を含む』条件で、同じ受注明細に対する AND になっている。
- 確信度: med

### sheet-3-R168 受注情報検索 一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1327 付近
- 正本引用: 「画面キーで絞るのは一覧への列挙だけで、列挙はパターン名の昇順に並べる。」
- 設計期待値: 受注一覧に並ぶ保存済み検索パターンは、検索パターン名の昇順に表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)最下部で検索パターンA・B・C がパターン名順に並んでいることを確認。実装は名称順を保証しない。
- 実装参照: `src/Eccube/Controller/Admin/Order/OrderController.php:276; src/Eccube/Controller/Admin/Order/SearchOrderController.php:135; src/Eccube/Resource/template/admin/Order/index.twig:1052`
- 実装実態: src/Eccube/Controller/Admin/Order/OrderController.php:276 と src/Eccube/Controller/Admin/Order/SearchOrderController.php:135 はいずれも画面キーでの絞り込みだけを指定して列挙しており、並び順の指定が無い。src/Eccube/Resource/template/admin/Order/index.twig:1052-1065 は受け取った順にそのまま描画するため、パターン名の昇順にならない。
- 判定根拠: 設計は列挙をパターン名の昇順に並べると定めている。実装は画面キーによる絞り込みのみで並び順を与えておらず、画面上の検索パターンの並びはパターン名順にならない。
- 確信度: high

### sheet-3-R186 受注情報検索 一覧(検索入力) — 未実装／ふるまい／P3

- 正本: sheet-3（受注情報検索 一覧(検索入力)） HTML行 1345 付近
- 正本引用: 「同じ保存済み検索条件については最大 10 秒間、前回取得した件数をそのまま返す。」
- 設計期待値: 同じ検索パターンの該当件数を10秒以内に続けて更新しても、前回表示された件数と同じ値が表示される。
- 画像確認: レイアウト図(sheet-3_img1.png)最下部の検索パターン件数表示とリロードアイコンに対応。図からは据え置き時間は読み取れない。
- 実装参照: `src/Eccube/Controller/Admin/Order/SearchOrderController.php:231; src/Eccube/Resource/template/admin/Order/index.twig:280`
- 実装実態: src/Eccube/Controller/Admin/Order/SearchOrderController.php:231-274 は要求のたびに該当件数を数え直して返しており、直前に取得した件数を一定時間そのまま返す据え置きが無い。src/Eccube/Resource/template/admin/Order/index.twig:280-301 も押下のたびに件数取得を要求する。
- 判定根拠: 設計は同じ保存済み検索条件について最大10秒間は前回取得した件数をそのまま返すと定めている。src/Eccube/Controller/Admin/Order/SearchOrderController.php:231-274 には据え置き時間に相当する判定も前回値の保持も無く、リロードアイコンや全件更新を連打するたびに数え直しになる。
- 確信度: high

### sheet-7-R068 受注詳細CSV出力 — 未実装／IO／P3

- 正本: sheet-7（受注詳細CSV出力） HTML行 1812 付近
- 正本引用: 「受注詳細CSV出力項目設定
識別ID	項目名	備考
1	注文番号	本店、支店、スマレジの注文データを出力対象とする」
- 設計期待値: 受注詳細CSVの識別ID:67に、適用された送料の種別を識別する『送料ID』列が出力される。
- 画像確認: 画像0枚（本シートにレイアウト図は無く、項目表とカスタマイズ説明のみ）
- 実装参照: `app/DoctrineMigrations/Version20260226000001.php:95-96;src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv:193;app/DoctrineMigrations/Version20210831190000.php:35`
- 実装実態: 配送CSVの出力項目定義は識別ID:66『お届け希望日』の次を識別ID:68『送料』にしており、『送料ID』という出力項目はどこにも登録されていない。初期データからも削除済みで復活していない。
- 同じ実装実態でまとまる要求: sheet-8-R068（受注詳細カスタムCSV出力 / 実装参照 `app/DoctrineMigrations/Version20260226000001.php:95; app/DoctrineMigrations/Version20260226000001.php:96`）
- 判定根拠: 設計は識別ID:67に『送料ID』、識別ID:68に『送料』を別々の列として並べている（sheet-7 項目表 94・95行目）。実装は app/DoctrineMigrations/Version20260226000001.php:95 でお届け希望日を66番目、app/DoctrineMigrations/Version20260226000001.php:96 で送料を68番目に置くのみで67番目が空いており、『送料ID』の登録は無い。初期データ src/Eccube/Resource/doctrine/import_csv/ja/dtb_csv.csv も192行目(お届け希望日)の次が193行目(送料)で送料IDの行が欠けており、app/DoctrineMigrations/Version20210831190000.php:35 が該当行を削除したまま再登録していない。送料の金額自体は識別ID:33・68で出力されるため重要度はP3。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 6件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 1件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0203/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 27 | 0 | 0 | 0 | 27 |
| sheet-3 | 受注情報検索 一覧(検索入力) | 222 | 2 | 7 | 8 | 205 |
| sheet-4 | 受注情報検索 一覧(検索結果) | 67 | 0 | 0 | 2 | 65 |
| sheet-5 | 受注一覧CSV出力 | 80 | 0 | 0 | 0 | 80 |
| sheet-6 | 受注一覧カスタムCSV出力 | 80 | 0 | 0 | 0 | 80 |
| sheet-7 | 受注詳細CSV出力 | 106 | 1 | 3 | 1 | 101 |
| sheet-8 | 受注詳細カスタムCSV出力 | 106 | 1 | 1 | 1 | 103 |
| sheet-9 | メール一括送信 | 48 | 0 | 2 | 0 | 46 |
| sheet-10 | 【新規】手動メール通知(確認画面) | 15 | 0 | 0 | 0 | 15 |
| sheet-11 | 送り状CSV出力 | 58 | 0 | 0 | 0 | 58 |
| sheet-12 | スタック用紙印刷 | 27 | 0 | 0 | 0 | 27 |
| sheet-13 | 納品書印刷（日本語） | 87 | 0 | 1 | 0 | 86 |
| sheet-14 | 納品書印刷（英語） | 79 | 0 | 1 | 0 | 78 |
| sheet-15 | 受注情報編集 | 476 | 5 | 17 | 0 | 454 |
| sheet-16 | 【新規】受注情報履歴 | 155 | 3 | 1 | 1 | 150 |
| sheet-17 | 出荷指示リスト生成 | 40 | 0 | 0 | 0 | 40 |
| sheet-18 | 出荷指示リスト検索 | 52 | 0 | 1 | 0 | 51 |
| sheet-19 | 出荷指示リスト編集 | 56 | 0 | 2 | 0 | 54 |
| sheet-20 | ピッキングリスト印刷 | 65 | 0 | 3 | 0 | 62 |
| sheet-21 | 出荷指示ー納品書印刷（日本語） | 32 | 0 | 3 | 0 | 29 |
| sheet-22 | 出荷指示ー納品書印刷（英語） | 28 | 0 | 3 | 0 | 25 |
| sheet-23 | 出荷実績入力用CSV出力 | 65 | 0 | 0 | 0 | 65 |
| sheet-24 | 出荷実績インポート登録 | 46 | 0 | 1 | 1 | 44 |
| sheet-25 | 出荷実績登録CSVフォーマット | 66 | 0 | 0 | 0 | 66 |
| sheet-26 | 店頭注文番号札管理 | 45 | 0 | 1 | 0 | 44 |
| sheet-27 | 別添資料_スマレジ決済後返品処理について | 24 | 0 | 1 | 0 | 23 |

