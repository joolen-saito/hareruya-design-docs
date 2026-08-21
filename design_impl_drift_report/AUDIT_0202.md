# 実装乖離監査 — 0202_基本設計仕様書(在庫管理機能).html

- 正本: `excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `d86fc600e1`
- 母数: 正本HTMLから機械抽出した **5428要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④実装実態が同一の指摘は重複とみなし代表1件だけを載せる（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 42 | ○ |
| 実装違い | 実装はあるが設計と違う | 80 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 3 | — |
| 設計どおり | 設計どおり実装されている | 4116 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 1185 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 2 | — |
| **合計** | | **5428** | |

## 不具合 33件（P1 4 / P2 14 / P3 15）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 77件は重複として代表へ折り畳んだ（判定そのものは 110件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-14-R159 | 在庫移動・振替登録 編集 (移動) | 実装違い | IO | P1 | 在庫移動の登録で在庫と総原価を減らしたとき、在庫変動履歴の増減数と変更後総原価・変更後原価単価は、実際に減算した後の値と一致する。 |
| sheet-14-R502 | 在庫移動・振替登録 編集 (移動) | 未実装 | ふるまい | P1 | 入庫承認で差分があった商品について、出庫元へ通知する。 |
| sheet-15-R241 | 在庫移動・振替登録 編集(振替) | 未実装 | ふるまい | P1 | 在庫振替を承認したとき、登録者へ承認を知らせるメールを送る。 |
| sheet-27-R054 | 在庫変更CSV登録 | 未実装 | ふるまい | P1 | 在庫区分がスマレジの在庫を減算したとき、算出した在庫数をスマレジへ連携する。 |
| sheet-13-R018 | 在庫移動・振替検索一覧(検索・結果) | 実装違い | ふるまい | P2 | CSV登録に失敗して一覧へ戻ったとき、直前の検索条件と一覧の選択状態がそのまま残る。 |
| sheet-13-R078 | 在庫移動・振替検索一覧(検索・結果) | 未実装 | ふるまい | P2 | 出庫日の開始日で在庫移動を絞り込める。 |
| sheet-13-R082 | 在庫移動・振替検索一覧(検索・結果) | 実装違い | IO | P2 | 「振替・入庫承認者」条件で在庫振替の承認者を検索できる。 |
| sheet-14-R312 | 在庫移動・振替登録 編集 (移動) | 実装違い | ふるまい | P2 | 在庫移動・振替一覧へ戻ったとき、遷移前の検索条件で絞り込まれた一覧が表示される。 |
| sheet-14-R532 | 在庫移動・振替登録 編集 (移動) | 実装違い | IO | P2 | 不足差分を出庫元へ戻す履歴は、在庫変動区分「在庫移動(差分加算)」で登録される。 |
| sheet-25-R048 | 欠品履歴検索一覧(検索結果) | 実装違い | IO | P2 | 欠品理由は在庫変動理由とは別の項目として表示・編集される。 |
| sheet-26-R010 | 欠品履歴CSV出力 | 未実装 | IO | P2 | 欠品履歴CSVに「登録元ID」の列が出力される。 |
| sheet-28-R014 | 在庫移動CSV登録 | 実装違い | IO | P2 | 在庫移動CSV登録は1ファイル10,000件まで登録できる。 |
| sheet-3-R035 | 共通処理 | 実装違い | IO | P2 | 所属選択の選択肢は所属マスタから取得する。 |
| sheet-3-R056 | 共通処理 | 実装違い | ふるまい | P2 | 編集画面から一覧に戻ったとき、遷移時の検索条件で絞り込まれた一覧が表示される。 |
| sheet-51-R034 | 別添資料_在庫変動時の履歴作成について | 実装違い | ふるまい | P2 | 在庫移動(減算)の履歴には「在庫移動による減算 <出庫元>から<入庫先> 在庫移動振替ID：…」が自動で記載される。 |
| sheet-51-R071 | 別添資料_在庫変動時の履歴作成について | 実装違い | IO | P2 | 在庫一括編集から登録した在庫変動履歴の履歴登録元は「在庫一括編集」になる。 |
| sheet-6-R068 | 在庫編集 | 未実装 | ふるまい | P2 | 登録時に選んだ承認通知先メンバーが、在庫編集承認一覧で通知送付者として確認できる。 |
| sheet-9-R016 | 在庫情報カスタムCSV出力 | 未実装 | IO | P2 | カスタムCSVの出力項目に「原価単価」を選べる。 |
| sheet-13-R088 | 在庫移動・振替検索一覧(検索・結果) | 実装違い | ふるまい | P3 | 検索条件をクリアは詳細検索条件（識別ID3-1〜3-9）だけを空にし、上部の検索条件は保持する。 |
| sheet-14-R198 | 在庫移動・振替登録 編集 (移動) | 実装違い | IO | P3 | 移動点数は1〜1000000の範囲で入力できる。 |
| sheet-14-R204 | 在庫移動・振替登録 編集 (移動) | 実装違い | IO | P3 | メモは65535byteを超える入力をエラーにする。 |
| sheet-14-R210 | 在庫移動・振替登録 編集 (移動) | 実装違い | ふるまい | P3 | 在庫一覧に戻ったとき、検索条件と、移動対象として選んでいた在庫のチェック状態が両方とも残る。 |
| sheet-14-R490 | 在庫移動・振替登録 編集 (移動) | 実装違い | IO | P3 | 入庫承認画面の在庫移動内容は、差分点数が入力された商品を先頭に表示する。 |
| sheet-15-R124 | 在庫移動・振替登録 編集(振替) | 実装違い | IO | P3 | 在庫移動・振替内容は振替元の商品コードの昇順で並ぶ。 |
| sheet-18-R127 | 在庫分割結合登録編集（分割） | 実装違い | ふるまい | P3 | 在庫一覧に戻ったとき、検索条件と、分割対象として選んでいた在庫のチェック状態が両方とも残る。 |
| sheet-18-R146 | 在庫分割結合登録編集（分割） | 実装違い | IO | P3 | エラー一覧の先頭に「エラーは20件まで表示されます」と表示する。 |
| sheet-22-R045 | 在庫履歴検索一覧(検索入力) | 実装違い | IO | P3 | 店舗の初期値はログイン中メンバーのデフォルト検索表示店舗。 |
| sheet-23-R056 | 在庫履歴検索一覧(検索結果) | 実装違い | IO | P3 | 列名は「在庫区分」。 |
| sheet-32-R174 | 在庫移動指示検索 | 実装違い | IO | P3 | 発送状況の絞り込みは複数選択のセレクトボックスで行う。 |
| sheet-33-R039 | 在庫移動指示詳細 | 実装違い | IO | P3 | 送状No.は16384文字まで入力できる。 |
| sheet-35-R003 | 送り状CSV出力 | 実装違い | IO | P3 | 送り状CSVの1列目の項目名は「オーダーID」。 |
| sheet-7-R018 | 在庫一括編集 | 実装違い | IO | P3 | 状態は在庫編集画面と同じく、状態の名称を表示する。 |
| sheet-9-R019 | 在庫情報カスタムCSV出力 | 実装違い | IO | P3 | カスタムCSVの出力項目名は「前日販売数」である。 |

### sheet-14-R159 在庫移動・振替登録 編集 (移動) — 実装違い／IO／P1

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 2793 付近
- 正本引用: 「・入力された移動点数分、在庫移動対象商品の在庫と総原価を減らし、在庫変動履歴を登録する」
- 設計期待値: 在庫移動の登録で在庫と総原価を減らしたとき、在庫変動履歴の増減数と変更後総原価・変更後原価単価は、実際に減算した後の値と一致する。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:110-140; src/Eccube/Entity/ProductStock.php:308-345; src/Eccube/Entity/ProductStock.php:369-380`
- 実装実態: 在庫変動履歴の増減数が減算なのに正の値で記録され、変更後総原価と変更後原価単価も「増やした場合」の値で記録される。例えば総原価1000円・在庫10個の商品を2個移動すると、在庫情報には在庫8個・総原価800円が保存されるのに、履歴には「変更前在庫10→変更後在庫8／増減数+2／変更前総原価1000→変更後総原価1200」と食い違う内容が残る。在庫振替の登録でも同じ内容の履歴が作られる。
- 同じ実装実態でまとまる要求: sheet-15-R178（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:122-144; src/Eccube/Entity/ProductStock.php:308-345; src/Eccube/Entity/ProductStock.php:369-380`）、sheet-51-R229（別添資料_在庫変動時の履歴作成について / 実装参照 `src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:106-125; src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:122-144; src/Eccube/Entity/ProductStock.php:308-345`）
- 判定根拠: 実際に保存する在庫と総原価は移動点数の符号を反転して算出しているのに（src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:106-108）、履歴に渡す増減数・変更後原価単価・変更後総原価は符号を反転しないまま算出している（src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:114-125）。総原価の算出処理は符号付きの増減数を受け取り現在の総原価に加算する（src/Eccube/Entity/ProductStock.php:308-345）ため、正の値を渡すと増加方向の値になる。在庫振替の登録処理（src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:122-144）も同じ書き方になっている。
- 確信度: high

### sheet-14-R502 在庫移動・振替登録 編集 (移動) — 未実装／ふるまい／P1

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 3178 付近
- 正本引用: 「・差分のあった商品について出庫元に対して通知を行う」
- 設計期待値: 入庫承認で差分があった商品について、出庫元へ通知する。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockMoveInboundApprovalApproveAction.php:54-160; src/Eccube/Controller/Admin/Stock/StockMoveController.php:1144-1230`
- 実装実態: 差分があっても出庫元へは何も通知されない。入庫承認の処理にも画面の処理にもメール送信が無く、出庫元店舗は在庫の食い違いに気づけない。
- 同じ実装実態でまとまる要求: sheet-14-R503（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Service/Admin/Stock/StockMoveInboundApprovalApproveAction.php:54-160; src/Eccube/Service/MailService.php`）
- 判定根拠: 入庫承認の処理（src/Eccube/Service/Admin/Stock/StockMoveInboundApprovalApproveAction.php:54-160）にも画面側の処理（src/Eccube/Controller/Admin/Stock/StockMoveController.php:1144-1230）にも通知の送信が無い。
- 確信度: high

### sheet-15-R241 在庫移動・振替登録 編集(振替) — 未実装／ふるまい／P1

- 正本: sheet-15（在庫移動・振替登録 編集(振替)） HTML行 3751 付近
- 正本引用: 「・在庫振替の登録者に対し承認メールを送信する」
- 設計期待値: 在庫振替を承認したとき、登録者へ承認を知らせるメールを送る。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockTransferController.php:401-515; src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:55-148`
- 実装実態: 在庫振替の承認画面から承認・却下しても登録者へメールが送られない。在庫編集承認一覧から操作したときだけ送られる仕組みで、在庫振替の承認・却下処理には送信が無い。
- 同じ実装実態でまとまる要求: sheet-15-R252（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Controller/Admin/Stock/StockTransferController.php:401-515; src/Eccube/Service/Admin/Stock/StockTransferApprovalRejectAction.php`）
- 判定根拠: 承認の処理（src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:55-148）にも画面側の処理（src/Eccube/Controller/Admin/Stock/StockTransferController.php:401-515）にもメール送信が無い。ステータス変更通知メールの送信は在庫編集承認一覧の更新処理からしか呼ばれていない（src/Eccube/Service/Admin/Stock/StockApprovalListUpdateAction.php:176-199）。
- 確信度: high

### sheet-27-R054 在庫変更CSV登録 — 未実装／ふるまい／P1

- 正本: sheet-27（在庫変更CSV登録） HTML行 6234 付近
- 正本引用: 「2-10-3.在庫区分が「スマレジ」の場合スマレジに3-7-1で算出した在庫数を登録する」
- 設計期待値: 在庫区分がスマレジの在庫を減算したとき、算出した在庫数をスマレジへ連携する。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:113-620; src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php:43-160`
- 実装実態: 在庫区分がスマレジの在庫を廃棄で減算しても、EC-CUBE側の在庫数だけが更新され、スマレジへは在庫数が連携されない。スマレジ側の在庫が減らないまま残るため、EC-CUBEとスマレジで在庫数がずれる。
- 判定根拠: 在庫変更CSV登録の処理にスマレジ連携の呼び出しが無い（src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php:113-620 にスマレジ関連の参照が無い）。スマレジへの在庫連携はバッチの一括補正・店頭取引の同期・Webhook受信の経路にしか実装されていない（src/Eccube/Service/Smaregi/Api/SmaregiStockApiClient.php の利用箇所）。
- 確信度: high

### sheet-13-R018 在庫移動・振替検索一覧(検索・結果) — 実装違い／ふるまい／P2

- 正本: sheet-13（在庫移動・振替検索一覧(検索・結果)） HTML行 2467 付近
- 正本引用: 「・検索項目および一覧の選択状態は失われない」
- 設計期待値: CSV登録に失敗して一覧へ戻ったとき、直前の検索条件と一覧の選択状態がそのまま残る。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:258-292; src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:366-400; src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:176-205`
- 実装実態: CSV登録に失敗すると検索条件を引き継がないURLで一覧へ戻るため、保存されていた検索条件が破棄され、検索結果も選択状態も消える。担当者は検索と選択をやり直す必要がある。在庫移動・振替一覧と在庫分割結合一覧の双方で同じ。
- 同じ実装実態でまとまる要求: sheet-17-R017（在庫分割結合検索一覧(検索・結果) / 実装参照 `src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:275-365; src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:366-478; src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:103-140`）
- 判定根拠: CSV登録の各エラー経路は検索条件の復元指定を付けずに一覧へ戻している（src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:258-292、366-400）。一覧側はその条件で開かれると保存済みの検索条件を初期値で上書きする（src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:196-205）。
- 確信度: high

### sheet-13-R078 在庫移動・振替検索一覧(検索・結果) — 未実装／ふるまい／P2

- 正本: sheet-13（在庫移動・振替検索一覧(検索・結果)） HTML行 2528 付近
- 正本引用: 「3-5	出庫日(From)	日付（yyyy/mm/dd）」
- 設計期待値: 出庫日の開始日で在庫移動を絞り込める。
- 実装参照: `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:214-226`
- 実装実態: 出庫日時と入庫日時はどの処理でも一度も設定されないため常に未設定で、一覧・詳細・CSVでは空欄または"-"になり、出庫日・入庫日を条件にした検索は常に0件になる。
- 同じ実装実態でまとまる要求: sheet-13-R080（在庫移動・振替検索一覧(検索・結果) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:227-239`）、sheet-13-R084（在庫移動・振替検索一覧(検索・結果) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:263-275`）、sheet-13-R086（在庫移動・振替検索一覧(検索・結果) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Form/Type/Admin/SearchStockMoveTransferType.php:276-288`）、sheet-13-R114（在庫移動・振替検索一覧(検索・結果) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:793`）、sheet-13-R115（在庫移動・振替検索一覧(検索・結果) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:794`）、sheet-14-R200（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Resource/template/admin/Stock/stock_move_transfer_info.twig:55-63`）、sheet-14-R201（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Resource/template/admin/Stock/stock_move_transfer_info.twig:55-63`）、sheet-16-R012（在庫移動・振替情報CSV出力 / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:171`）、sheet-16-R014（在庫移動・振替情報CSV出力 / 実装参照 `src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70; src/Eccube/Entity/DtbStockMoveTransfer.php:236-290; src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php:172`）
- 判定根拠: 在庫移動・振替情報を保存する処理には出庫日時・入庫日時を設定する引数が無く（src/Eccube/Service/EntityManager/StockMoveTransferEntityManager.php:31-70）、値を設定する呼び出しもコード上に存在しない（src/Eccube/Entity/DtbStockMoveTransfer.php:236、282 の設定処理が未使用）。
- 確信度: high

### sheet-13-R082 在庫移動・振替検索一覧(検索・結果) — 実装違い／IO／P2

- 正本: sheet-13（在庫移動・振替検索一覧(検索・結果)） HTML行 2532 付近
- 正本引用: 「在庫移動・振替登録 編集（振替）の ""識別ID1-9"" 「承認者」の検索に利用」
- 設計期待値: 「振替・入庫承認者」条件で在庫振替の承認者を検索できる。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:110-128; src/Eccube/Repository/DtbStockMoveTransferRepository.php:124-136`
- 実装実態: 在庫振替の承認者は出庫承認者の項目に保存されるのに、検索は入庫承認者の項目を見るため、「振替・入庫承認者」で在庫振替を絞り込んでも1件もヒットしない。
- 同じ実装実態でまとまる要求: sheet-15-R192（在庫移動・振替登録 編集(振替)）
- 判定根拠: 在庫振替の承認者は出庫承認者の項目に保存され（src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:110-128）、検索条件は入庫承認者の項目を見ている（src/Eccube/Repository/DtbStockMoveTransferRepository.php:134-136）。
- 確信度: high

### sheet-14-R312 在庫移動・振替登録 編集 (移動) — 実装違い／ふるまい／P2

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 2962 付近
- 正本引用: 「7-3	在庫移動・振替一覧画面	ボタン」
- 設計期待値: 在庫移動・振替一覧へ戻ったとき、遷移前の検索条件で絞り込まれた一覧が表示される。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/move_outbound_approval_request.twig:485; src/Eccube/Resource/template/admin/Stock/move_inbound_approval_request.twig:553; src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:176-205`
- 実装実態: 一覧へ戻るリンクが検索条件を引き継がないURLを指すため、押すと一覧の検索条件が初期化され、直前に見ていた検索結果が再現されない。在庫移動・振替の6画面と在庫分割・結合の4画面で同じ。
- 同じ実装実態でまとまる要求: sheet-15-R270（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:226; src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:176-205`）、sheet-18-R219（在庫分割結合登録編集（分割） / 実装参照 `src/Eccube/Resource/template/admin/Stock/stock_split_edit.twig:418; src/Eccube/Resource/template/admin/Stock/stock_split_approval.twig:269; src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:103-140`）、sheet-19-R198（在庫分割結合登録編集（結合) / 実装参照 `src/Eccube/Resource/template/admin/Stock/stock_join_edit.twig:1338; src/Eccube/Resource/template/admin/Stock/stock_join_approval.twig:296; src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:103-140`）、sheet-15-R229（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Resource/template/admin/Stock/transfer_approval.twig:226; src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:176-205`）
- 判定根拠: 各画面の戻るリンクに検索条件の復元指定が無く（move_outbound_approval_request.twig:485 ほか）、一覧側は保存済みの検索条件を初期値で上書きする（src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:196-205）。
- 確信度: high

### sheet-14-R532 在庫移動・振替登録 編集 (移動) — 実装違い／IO／P2

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 3208 付近
- 正本引用: 「・入庫の際、在庫変動履歴の在庫変動区分を在庫移動(差分加算)で登録する」
- 設計期待値: 不足差分を出庫元へ戻す履歴は、在庫変動区分「在庫移動(差分加算)」で登録される。
- 実装参照: `src/Eccube/Service/Admin/Stock/Util/UndeliveredStockAdjuster.php:85-100; app/DoctrineMigrations/Version20260108130821.php:197-220`
- 実装実態: 在庫変動区分マスタに「在庫移動(差分加算)」「在庫移動(差分減算)」が無い。不足分を出庫元へ戻すときは「在庫移動(差し戻し)」、余剰分を出庫元から引くときは「在庫移動(棄却)」で履歴が登録され、移動そのものが棄却されたかのような区分が残る。
- 同じ実装実態でまとまる要求: sheet-14-R549（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Service/Admin/Stock/Util/OverDeliveredStockAdjuster.php:85-100; app/DoctrineMigrations/Version20260108130821.php:197-220`）、sheet-51-R037（別添資料_在庫変動時の履歴作成について / 実装参照 `app/DoctrineMigrations/Version20260108130821.php:197-220; src/Eccube/Service/Admin/Stock/Util/OverDeliveredStockAdjuster.php:85-100`）、sheet-51-R038（別添資料_在庫変動時の履歴作成について / 実装参照 `app/DoctrineMigrations/Version20260108130821.php:197-220; src/Eccube/Service/Admin/Stock/Util/UndeliveredStockAdjuster.php:85-100`）
- 判定根拠: 不足差分の戻しは「在庫移動(差し戻し)」で登録している（src/Eccube/Service/Admin/Stock/Util/UndeliveredStockAdjuster.php:91）。在庫変動区分マスタの登録内容（app/DoctrineMigrations/Version20260108130821.php:197-220）にも差分加算・差分減算は無い。
- 確信度: high

### sheet-25-R048 欠品履歴検索一覧(検索結果) — 実装違い／IO／P2

- 正本: sheet-25（欠品履歴検索一覧(検索結果)） HTML行 5987 付近
- 正本引用: 「2-12	欠品理由	テキスト	-	-	-	欠品理由を表示する」
- 設計期待値: 欠品理由は在庫変動理由とは別の項目として表示・編集される。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/history.twig:786-796; src/Eccube/Repository/DtbStockHistoryRepository.php:426-438; src/Eccube/Entity/DtbStockHistory.php:242-255`
- 実装実態: 欠品理由は在庫変動理由と別項目として扱われていない。欠品履歴一覧の「欠品理由」列は在庫変動理由を表示し、ペンのアイコンからの編集も在庫変動理由を上書きする。在庫変動履歴が持つ欠品理由の項目はどの処理からも値が入らないため、在庫編集画面での「欠品理由：…」の併記も一度も表示されない。廃棄理由と欠品理由を分けた集計もできない。
- 同じ実装実態でまとまる要求: sheet-6-R148（在庫編集 / 実装参照 `src/Eccube/Resource/template/admin/Stock/history.twig:786-796; src/Eccube/Repository/DtbStockHistoryRepository.php:426-438; src/Eccube/Entity/DtbStockHistory.php:242-255; src/Eccube/Service/Admin/Stock/StockChangeReasonDisplayBuilder.php:34-48`）、sheet-6-R149（在庫編集 / 実装参照 `src/Eccube/Resource/template/admin/Stock/history.twig:786-796; src/Eccube/Repository/DtbStockHistoryRepository.php:426-438; src/Eccube/Entity/DtbStockHistory.php:242-255; src/Eccube/Service/Admin/Stock/StockChangeReasonDisplayBuilder.php:34-48`）、sheet-6-R150（在庫編集 / 実装参照 `src/Eccube/Resource/template/admin/Stock/history.twig:786-796; src/Eccube/Repository/DtbStockHistoryRepository.php:426-438; src/Eccube/Entity/DtbStockHistory.php:242-255; src/Eccube/Service/Admin/Stock/StockChangeReasonDisplayBuilder.php:34-48`）
- 判定根拠: 欠品履歴一覧の欠品理由セルは在庫変動理由を描画し（src/Eccube/Resource/template/admin/Stock/history.twig:791）、編集の保存先も在庫変動理由の列である（src/Eccube/Repository/DtbStockHistoryRepository.php:430-437 の UPDATE が stock_change_reason を更新）。欠品理由専用の列（src/Eccube/Entity/DtbStockHistory.php:242-255）に値を設定する処理は無い。
- 確信度: high

### sheet-26-R010 欠品履歴CSV出力 — 未実装／IO／P2

- 正本: sheet-26（欠品履歴CSV出力） HTML行 6081 付近
- 正本引用: 「9	登録元ID」
- 設計期待値: 欠品履歴CSVに「登録元ID」の列が出力される。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:483-500`
- 実装実態: 欠品履歴CSVに「登録元ID」の列が無く、どの登録元データから発生した欠品なのかをCSVから追えない。同じ画面の在庫変動履歴CSVには登録元IDが出力される。
- 判定根拠: 欠品履歴CSVのヘッダ定義（src/Eccube/Controller/Admin/Stock/StockHistoryController.php:483-500）は商品コードから最終更新者までの15列で、登録元IDが含まれていない。在庫変動履歴CSVのヘッダ定義（src/Eccube/Controller/Admin/Stock/StockHistoryController.php:426-456）には登録元IDがある。
- 確信度: high

### sheet-28-R014 在庫移動CSV登録 — 実装違い／IO／P2

- 正本: sheet-28（在庫移動CSV登録） HTML行 6416 付近
- 正本引用: 「・１ファイルあたりに登録できる商品点数の上限を10,000件に設定」
- 設計期待値: 在庫移動CSV登録は1ファイル10,000件まで登録できる。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:273; src/Eccube/Controller/AbstractController.php:364`
- 実装実態: 在庫移動CSV登録と在庫振替CSV登録は共通の既定上限（5,010行）で判定しており、設計の上限が効いていない。移動は10,000件のファイルを登録できず、振替は2,000件を超えるファイルも登録できてしまう。
- 同じ実装実態でまとまる要求: sheet-29-R014（在庫振替CSV登録 / 実装参照 `src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:381; src/Eccube/Controller/AbstractController.php:364`）
- 判定根拠: 行数判定に共通の既定上限を使っており（src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php:273）、その値は5,010（src/Eccube/Controller/AbstractController.php:364）。在庫分割・在庫結合は機能ごとの上限（2,000件）を持っている（src/Eccube/Service/Csv/Importer/Event/StockSplitListCsvImportHandler.php:45、src/Eccube/Service/Csv/Importer/Event/StockJoinListCsvImportHandler.php:46）のに対し、移動・振替は既定値のまま。
- 確信度: high

### sheet-3-R035 共通処理 — 実装違い／IO／P2

- 正本: sheet-3（共通処理） HTML行 1160 付近
- 正本引用: 「所属マスターから取得し選択肢とする」
- 設計期待値: 所属選択の選択肢は所属マスタから取得する。
- 実装参照: `src/Eccube/Form/Type/Admin/StockApprovalType.php:224-238; src/Eccube/Form/Type/Admin/StockApprovalType.php:245-265; src/Eccube/Repository/MemberRepository.php:162-199`
- 実装実態: 所属の選択肢は所属マスタからではなく、メンバーの所属名から重複を除いて作られる。所属マスタの並び順は使われず、母集合もメンバー選択側と異なる（所属側はメンバーのテナント項目で、メンバー選択側は店舗との紐付けで絞る）ため、所属で絞ると選べないメンバーが出る場合がある。
- 同じ実装実態でまとまる要求: sheet-6-R126（在庫編集）、sheet-3-R036（共通処理）
- 判定根拠: 所属の選択肢はメンバーを走査して所属名を集めて作っており、所属マスタは参照していない（src/Eccube/Form/Type/Admin/StockApprovalType.php:224-238）。
- 確信度: high

### sheet-3-R056 共通処理 — 実装違い／ふるまい／P2

- 正本: sheet-3（共通処理） HTML行 1181 付近
- 正本引用: 「また一覧から編集画面に遷移している場合は、遷移時の検索条件を用いて在庫検索一覧画面を表示する」
- 設計期待値: 編集画面から一覧に戻ったとき、遷移時の検索条件で絞り込まれた一覧が表示される。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/approval.twig:655; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/move_new.twig:211`
- 実装実態: 戻るリンクは検索条件を引き継がない在庫一覧のURLを指すため、押すと検索条件が破棄され、結果0件の初期状態の一覧が表示される。担当者は検索をやり直す必要がある。
- 同じ実装実態でまとまる要求: sheet-6-R172（在庫編集）、sheet-7-R030（在庫一括編集 / 実装参照 `src/Eccube/Resource/template/admin/Stock/bulkapproval.twig:360; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/move_new.twig:211`）
- 判定根拠: 在庫編集の戻るリンクは検索条件の復元指定が無いURLを生成しており（src/Eccube/Resource/template/admin/Stock/approval.twig:655）、在庫一覧側はその条件で開かれると保持していた検索条件を削除して空の一覧を返す（src/Eccube/Controller/Admin/Stock/StockListController.php:190-200）。在庫移動・分割・結合の各画面は復元指定付きのURLを使っている（src/Eccube/Resource/template/admin/Stock/move_new.twig:211）。
- 確信度: high

### sheet-51-R034 別添資料_在庫変動時の履歴作成について — 実装違い／ふるまい／P2

- 正本: sheet-51（別添資料_在庫変動時の履歴作成について） HTML行 8913 付近
- 正本引用: 「出庫	在庫移動	在庫移動(減算)	移動で使われる新たなステータス	自動」
- 設計期待値: 在庫移動(減算)の履歴には「在庫移動による減算 <出庫元>から<入庫先> 在庫移動振替ID：…」が自動で記載される。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:121; src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:136; src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:98; src/Eccube/Service/Admin/Stock/StockTransferApprovalRejectAction.php:98; src/Eccube/Service/Admin/Stock/StockMoveOutboundApprovalRejectAction.php:93; src/Eccube/Service/Admin/Stock/StockJoinApplyApprovalAction.php:172`
- 実装実態: 在庫移動・在庫振替・結合元登録の在庫変動履歴で、在庫変動理由が空欄のまま登録される。設計が定める自動記載（「在庫移動による減算 <出庫元>から<入庫先> 在庫移動振替ID：…」など）が入らないため、在庫履歴一覧やCSVを見ても、その増減がどの操作によるものか理由欄からは分からない。
- 同じ実装実態でまとまる要求: sheet-51-R039（別添資料_在庫変動時の履歴作成について）
- 判定根拠: 在庫変動理由に空文字を渡している箇所が、在庫移動の出庫登録（src/Eccube/Service/Admin/Stock/StockMoveStoreAction.php:121）、在庫振替の登録（src/Eccube/Service/Admin/Stock/StockTransferStoreAction.php:136）、在庫振替の承認（src/Eccube/Service/Admin/Stock/StockTransferApprovalApproveAction.php:98）と却下（src/Eccube/Service/Admin/Stock/StockTransferApprovalRejectAction.php:98）、在庫移動の出庫却下（src/Eccube/Service/Admin/Stock/StockMoveOutboundApprovalRejectAction.php:93）、在庫結合の結合元登録（src/Eccube/Service/Admin/Stock/StockJoinApplyApprovalAction.php:172、214）にある。
- 確信度: high

### sheet-51-R071 別添資料_在庫変動時の履歴作成について — 実装違い／IO／P2

- 正本: sheet-51（別添資料_在庫変動時の履歴作成について） HTML行 8950 付近
- 正本引用: 「②在庫一括編集」
- 設計期待値: 在庫一括編集から登録した在庫変動履歴の履歴登録元は「在庫一括編集」になる。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockBulkApprovalStoreAction.php:82-88; src/Eccube/Service/Admin/Stock/StockBulkApprovalStoreAction.php:133-140`
- 実装実態: 在庫一括編集で廃棄したときの在庫変動履歴は、履歴登録元が「在庫編集」で記録される。同じ操作で作られる承認一覧側は「在庫一括編集」で記録されるため、履歴と承認一覧で登録元が食い違う。
- 判定根拠: 一括編集の在庫変動履歴は在庫編集の履歴登録元種別を指定している（StockBulkApprovalStoreAction.php:135 の STOCK_EDIT 指定）のに対し、同じ処理で作る承認一覧は在庫一括編集の種別を指定している（同:82 の STOCK_BULK_EDIT 指定）。
- 確信度: high

### sheet-6-R068 在庫編集 — 未実装／ふるまい／P2

- 正本: sheet-6（在庫編集） HTML行 1722 付近
- 正本引用: 「3-10.承認通知先にて指定したメンバーを通知送付者として在庫編集承認一覧に表示されるようにする」
- 設計期待値: 登録時に選んだ承認通知先メンバーが、在庫編集承認一覧で通知送付者として確認できる。
- 実装参照: `src/Eccube/Service/Admin/Stock/StockApprovalStoreAction.php:43-152; src/Eccube/Controller/Admin/Stock/StockApprovalController.php:105-122; src/Eccube/Entity/DtbStockApprovalList.php:50-286`
- 実装実態: 選んだ承認通知先メンバーは通知メールの宛先に使うだけで、どこにも保存されない。承認一覧には通知送付者を保持する項目自体が無く、承認者は誰に通知が飛んだのかを画面で確認できない。
- 判定根拠: 登録処理は承認通知先メンバーIDを入力として受け取るが（src/Eccube/Controller/Admin/Stock/StockApprovalController.php:105-122）、src/Eccube/Service/Admin/Stock/StockApprovalStoreAction.php:43-152 の登録処理はこの値を一切使用しない。承認一覧エンティティ（src/Eccube/Entity/DtbStockApprovalList.php）にも通知送付者に相当する項目が無い。
- 確信度: high

### sheet-9-R016 在庫情報カスタムCSV出力 — 未実装／IO／P2

- 正本: sheet-9（在庫情報カスタムCSV出力） HTML行 2058 付近
- 正本引用: 「15	原価単価」
- 設計期待値: カスタムCSVの出力項目に「原価単価」を選べる。
- 実装参照: `app/DoctrineMigrations/Version20260523100000.php:33-125; src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:42-66`
- 実装実態: カスタムCSVの出力項目候補に次の25項目が登録されておらず、出力フォーマットに追加できないため出力もできない：原価単価（識別ID15・42）／割引率ID／購入グループ名／商品画像／商品カテゴリ(ID)／商品カテゴリ(名称)／タグID／タグ名／規格画像／略称タグ(ID)／略称タグ名称／地域別販売制限／販売制限名／売上分析タグ(ID)／売上分析タグ名称／商品削除フラグ／タグ(英)／カテゴリ名(英)／割引率／色(英)／ブロック名(日)／ブロック名(英)／買取減額率ID／買取減額率。
- 同じ実装実態でまとまる要求: sheet-9-R043（在庫情報カスタムCSV出力）、sheet-9-R045（在庫情報カスタムCSV出力）、sheet-9-R046（在庫情報カスタムCSV出力）、sheet-9-R048（在庫情報カスタムCSV出力）、sheet-9-R049（在庫情報カスタムCSV出力）、sheet-9-R050（在庫情報カスタムCSV出力）、sheet-9-R051（在庫情報カスタムCSV出力）、sheet-9-R052（在庫情報カスタムCSV出力）、sheet-9-R065（在庫情報カスタムCSV出力）、sheet-9-R070（在庫情報カスタムCSV出力）、sheet-9-R071（在庫情報カスタムCSV出力）、sheet-9-R072（在庫情報カスタムCSV出力）、sheet-9-R073（在庫情報カスタムCSV出力）、sheet-9-R074（在庫情報カスタムCSV出力）、sheet-9-R075（在庫情報カスタムCSV出力）、sheet-9-R076（在庫情報カスタムCSV出力）、sheet-9-R077（在庫情報カスタムCSV出力）、sheet-9-R078（在庫情報カスタムCSV出力）、sheet-9-R080（在庫情報カスタムCSV出力）、sheet-9-R083（在庫情報カスタムCSV出力）、sheet-9-R088（在庫情報カスタムCSV出力）、sheet-9-R089（在庫情報カスタムCSV出力）、sheet-9-R106（在庫情報カスタムCSV出力）、sheet-9-R107（在庫情報カスタムCSV出力）
- 判定根拠: カスタムCSVの出力項目候補は在庫用CSV項目マスタの登録内容で決まるが（src/Eccube/Service/Csv/Exporter/StockCustomCsvExportService.php:42-66）、その登録一覧（app/DoctrineMigrations/Version20260523100000.php:51-125）に「原価単価」が無い。
- 確信度: high

### sheet-13-R088 在庫移動・振替検索一覧(検索・結果) — 実装違い／ふるまい／P3

- 正本: sheet-13（在庫移動・振替検索一覧(検索・結果)） HTML行 2538 付近
- 正本引用: 「押下すると3-1~3-9の内容を空にする」
- 設計期待値: 検索条件をクリアは詳細検索条件（識別ID3-1〜3-9）だけを空にし、上部の検索条件は保持する。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:473-499`
- 実装実態: 検索条件をクリアを押すと、詳細検索条件だけでなく商品名・商品コード・店舗・ステータスなど上部の検索条件もすべて消える。
- 同じ実装実態でまとまる要求: sheet-17-R064（在庫分割結合検索一覧(検索・結果) / 実装参照 `src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig:270-273; src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php:103-140`）
- 判定根拠: クリア処理は検索フォーム全体の入力欄とセレクトボックスを対象に値を初期化しており（src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig:473-499）、詳細検索条件に限定していない。
- 確信度: high

### sheet-14-R198 在庫移動・振替登録 編集 (移動) — 実装違い／IO／P3

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 2833 付近
- 正本引用: 「3-7 移動点数 数値（整数） ○ 1～1000000」
- 設計期待値: 移動点数は1〜1000000の範囲で入力できる。
- 実装参照: `src/Eccube/Form/Type/Admin/StockMoveQuantityType.php:40-56; app/config/eccube/packages/eccube.yaml:131-132`
- 実装実態: 入力上限が設計値ではなく在庫増減数の共通上限（-99999999〜99999999）になっている。移動点数は1000000を超える値、差分点数は±999999を超える値でも入力できる。
- 同じ実装実態でまとまる要求: sheet-14-R455（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Form/Type/Admin/StockMoveInboundApprovalRequestDetailType.php:36-53; app/config/eccube/packages/eccube.yaml:131-132`）、sheet-15-R216（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Form/Type/Admin/StockTransferNewDetailType.php; app/config/eccube/packages/eccube.yaml:131-132`）
- 判定根拠: 移動点数の上限は共通設定の在庫増減数上限を使っており（src/Eccube/Form/Type/Admin/StockMoveQuantityType.php:40、49、56）、その値は99999999（app/config/eccube/packages/eccube.yaml:132）。
- 確信度: high

### sheet-14-R204 在庫移動・振替登録 編集 (移動) — 実装違い／IO／P3

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 2839 付近
- 正本引用: 「5-1 在庫移動・振替メモ 全角・半角 - 65535byte」
- 設計期待値: メモは65535byteを超える入力をエラーにする。
- 実装参照: `src/Eccube/Form/Type/Admin/StockMoveNewType.php:75-81; src/Eccube/Entity/DtbStockMoveTransfer.php:167-168`
- 実装実態: メモ・却下理由に文字数の検証が無く、設計の上限（65535byte）を超える入力もそのまま保存される。保管先の項目に長さの上限が無いため、超過してもエラーにならない。
- 同じ実装実態でまとまる要求: sheet-14-R381（在庫移動・振替登録 編集 (移動) / 実装参照 `src/Eccube/Form/Type/Admin/StockMoveOutboundApprovalType.php; src/Eccube/Entity/DtbStockMoveTransfer.php:182-183`）、sheet-15-R219（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Form/Type/Admin/StockTransferNewType.php; src/Eccube/Entity/DtbStockMoveTransfer.php:167-168`）、sheet-15-R263（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Form/Type/Admin/StockTransferApprovalType.php; src/Eccube/Entity/DtbStockMoveTransfer.php:182-183`）、sheet-19-R358（在庫分割結合登録編集（結合) / 実装参照 `src/Eccube/Controller/Admin/Stock/StockJoinController.php:240-294; src/Eccube/Entity/DtbStockSplitJoin.php`）
- 判定根拠: メモの入力欄に長さの検証が付いていない（src/Eccube/Form/Type/Admin/StockMoveNewType.php:75-81）。保管先の項目は長さ無制限の型（src/Eccube/Entity/DtbStockMoveTransfer.php:167）。
- 確信度: high

### sheet-14-R210 在庫移動・振替登録 編集 (移動) — 実装違い／ふるまい／P3

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 2845 付近
- 正本引用: 「初期登録画面には在庫一覧検索画面からしか遷移しないため、在庫一覧検索画面の検索条件および商品選択状態を維持したまま在庫一覧検索画面へ遷移する」
- 設計期待値: 在庫一覧に戻ったとき、検索条件と、移動対象として選んでいた在庫のチェック状態が両方とも残る。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/move_new.twig:211; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580`
- 実装実態: 検索条件は復元されるが、在庫一覧で選んでいた在庫のチェックは全て外れた状態で表示される。移動対象を選び直す必要がある。
- 同じ実装実態でまとまる要求: sheet-15-R221（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Resource/template/admin/Stock/transfer_new.twig:159; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580`）、sheet-15-R139（在庫移動・振替登録 編集(振替) / 実装参照 `src/Eccube/Resource/template/admin/Stock/transfer_new.twig:159; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580`）
- 判定根拠: 戻るリンクは検索条件の復元指定付きで在庫一覧を開く（src/Eccube/Resource/template/admin/Stock/move_new.twig:211、src/Eccube/Controller/Admin/Stock/StockListController.php:176-190）。一方で選択状態を保存・復元する仕組みは無く、一覧のチェックボックスは常に未選択で描画される（src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580）。
- 確信度: high

### sheet-14-R490 在庫移動・振替登録 編集 (移動) — 実装違い／IO／P3

- 正本: sheet-14（在庫移動・振替登録 編集 (移動)） HTML行 3166 付近
- 正本引用: 「・差分点数が入力された商品を一番上に表示する」
- 設計期待値: 入庫承認画面の在庫移動内容は、差分点数が入力された商品を先頭に表示する。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockMoveController.php:1106-1109; src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:152-176`
- 実装実態: 差分や欠品を入力した明細を先頭に出す並べ替えが無く、明細IDの昇順のまま表示される。在庫移動の入庫承認画面と在庫結合の結合計画承認画面の双方で同じ。
- 同じ実装実態でまとまる要求: sheet-19-R316（在庫分割結合登録編集（結合) / 実装参照 `src/Eccube/Service/Admin/Stock/StockJoinApprovalAction.php:42; src/Eccube/Repository/DtbStockSplitJoinDetailRepository.php:41`）
- 判定根拠: 明細の取得は明細IDの昇順で固定されており（src/Eccube/Controller/Admin/Stock/StockMoveController.php:1106-1109）、画面側にも並べ替えは無い（src/Eccube/Resource/template/admin/Stock/move_inbound_approval.twig:152-176）。
- 確信度: high

### sheet-15-R124 在庫移動・振替登録 編集(振替) — 実装違い／IO／P3

- 正本: sheet-15（在庫移動・振替登録 編集(振替)） HTML行 3619 付近
- 正本引用: 「・表示順は[振替元]商品コードの昇順とする」
- 設計期待値: 在庫移動・振替内容は振替元の商品コードの昇順で並ぶ。
- 実装参照: `src/Eccube/Controller/Admin/Stock/StockTransferController.php:129; src/Eccube/Controller/Admin/Stock/StockTransferController.php:320-323; src/Eccube/Controller/Admin/Stock/StockTransferController.php:361-364`
- 実装実態: 在庫移動・振替内容は商品コードではなく在庫ID・明細IDの昇順で並ぶ。
- 判定根拠: 初期登録画面は在庫IDの昇順で在庫を取得し（src/Eccube/Controller/Admin/Stock/StockTransferController.php:129）、登録後の各画面も明細IDの昇順で取得している（src/Eccube/Controller/Admin/Stock/StockTransferController.php:320-323、361-364）。商品コードで並べ替える処理は無い。
- 確信度: high

### sheet-18-R127 在庫分割結合登録編集（分割） — 実装違い／ふるまい／P3

- 正本: sheet-18（在庫分割結合登録編集（分割）） HTML行 4332 付近
- 正本引用: 「4-1	在庫一覧	リンク」
- 設計期待値: 在庫一覧に戻ったとき、検索条件と、分割対象として選んでいた在庫のチェック状態が両方とも残る。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/stock_split_new.twig:159; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580`
- 実装実態: 検索条件は復元されるが、在庫一覧で選んでいた在庫のチェックは全て外れた状態で表示される。対象を選び直す必要がある。
- 同じ実装実態でまとまる要求: sheet-19-R130（在庫分割結合登録編集（結合) / 実装参照 `src/Eccube/Resource/template/admin/Stock/stock_join_new.twig:166; src/Eccube/Controller/Admin/Stock/StockListController.php:163-200; src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580`）
- 判定根拠: 戻るリンクは検索条件の復元指定付きで在庫一覧を開く（src/Eccube/Resource/template/admin/Stock/stock_split_new.twig:159）が、選択状態を保存・復元する仕組みが無く、一覧のチェックボックスは常に未選択で描画される（src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:570-580）。
- 確信度: high

### sheet-18-R146 在庫分割結合登録編集（分割） — 実装違い／IO／P3

- 正本: sheet-18（在庫分割結合登録編集（分割）） HTML行 4374 付近
- 正本引用: 「3-5-2.エラーメッセージには固定で、「エラーは20件まで表示されます」、とエラーメッセージの上に表示する」
- 設計期待値: エラー一覧の先頭に「エラーは20件まで表示されます」と表示する。
- 実装参照: `src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:305-312; src/Eccube/Resource/locale/messages.ja.yaml:2415`
- 実装実態: エラー一覧の先頭に出る文言が「エラーを最大20件まで表示しています。」になっている。
- 判定根拠: 先頭に差し込む文言は admin.stock.csv.error_limit_notice（src/Eccube/Service/Csv/Importer/Event/StockSplitEditReplaceDestinationsImportHandler.php:309）で、その定義は「エラーを最大20件まで表示しています。」（src/Eccube/Resource/locale/messages.ja.yaml:2415）。
- 確信度: high

### sheet-22-R045 在庫履歴検索一覧(検索入力) — 実装違い／IO／P3

- 正本: sheet-22（在庫履歴検索一覧(検索入力)） HTML行 5487 付近
- 正本引用: 「1-2	店舗	複数選択(セレクトボックス)	-	-	ログインしているメンバーのデフォルト検索表示店舗」
- 設計期待値: 店舗の初期値はログイン中メンバーのデフォルト検索表示店舗。
- 実装参照: `src/Eccube/Form/Type/Admin/StockHistoryType.php:79-510; src/Eccube/Controller/Admin/Stock/StockHistoryController.php:66-120`
- 実装実態: 在庫履歴検索フォームに初期値の設定が無く、店舗（ログイン中メンバーのデフォルト検索表示店舗）・登録日(from)（表示日の月の1日）・公開種別（公開）・状態（NM）のいずれも未選択・未入力の状態で表示される。担当者は毎回これらを選び直す必要があり、選ばずに検索すると全店・全期間が対象になる。
- 同じ実装実態でまとまる要求: sheet-22-R048（在庫履歴検索一覧(検索入力)）、sheet-22-R067（在庫履歴検索一覧(検索入力)）、sheet-22-R077（在庫履歴検索一覧(検索入力)）、sheet-22-R005（在庫履歴検索一覧(検索入力)）
- 判定根拠: 検索フォームの各項目に初期値の指定が無く（src/Eccube/Form/Type/Admin/StockHistoryType.php:79-510）、画面側でも初期値を流し込んでいない（src/Eccube/Controller/Admin/Stock/StockHistoryController.php:74-120 がフォームを空で生成している）。
- 確信度: high

### sheet-23-R056 在庫履歴検索一覧(検索結果) — 実装違い／IO／P3

- 正本: sheet-23（在庫履歴検索一覧(検索結果)） HTML行 5714 付近
- 正本引用: 「2-7	在庫区分	文字列」
- 設計期待値: 列名は「在庫区分」。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/history.twig:698; src/Eccube/Resource/locale/messages.ja.yaml:4883`
- 実装実態: 「在庫区分」の列名が「在庫場所」になっている。在庫履歴一覧・欠品履歴一覧の画面列と、在庫変動履歴CSV・欠品履歴CSVの列名のいずれも同じ。
- 同じ実装実態でまとまる要求: sheet-24-R008（在庫変動履歴CSV出力 / 実装参照 `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:435; src/Eccube/Controller/Admin/Stock/StockHistoryController.php:492`）、sheet-25-R041（欠品履歴検索一覧(検索結果)）、sheet-26-R008（欠品履歴CSV出力 / 実装参照 `src/Eccube/Controller/Admin/Stock/StockHistoryController.php:435; src/Eccube/Controller/Admin/Stock/StockHistoryController.php:492`）
- 判定根拠: 一覧の列見出しは admin.stock.history.stock_location（src/Eccube/Resource/template/admin/Stock/history.twig:698）で、その定義は「在庫場所」（src/Eccube/Resource/locale/messages.ja.yaml:4883）。
- 確信度: high

### sheet-32-R174 在庫移動指示検索 — 実装違い／IO／P3

- 正本: sheet-32（在庫移動指示検索） HTML行 6984 付近
- 正本引用: 「2-7	発送状況	複数選択(セレクトボックス)」
- 設計期待値: 発送状況の絞り込みは複数選択のセレクトボックスで行う。
- 実装参照: `src/Eccube/Form/Type/Admin/SearchStockMoveInstructionType.php:152-160; src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig`
- 実装実態: 発送状況の絞り込みが「未」「済」の2つのチェックボックスになっており、セレクトボックスではない。
- 判定根拠: 発送状況の入力欄はチェックボックス2つで作られている（src/Eccube/Form/Type/Admin/SearchStockMoveInstructionType.php:152-160）。
- 確信度: high

### sheet-33-R039 在庫移動指示詳細 — 実装違い／IO／P3

- 正本: sheet-33（在庫移動指示詳細） HTML行 7211 付近
- 正本引用: 「1-9	送状No.	全角・半角	-	16384文字」
- 設計期待値: 送状No.は16384文字まで入力できる。
- 実装参照: `src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:38-51; app/config/eccube/packages/eccube.yaml:130`
- 実装実態: 文字数上限が設計値と揃っていない。在庫変動理由と送状No.は16383文字までしか入力できず（設計は16384文字）、備考は上限の検証自体が無い。
- 同じ実装実態でまとまる要求: sheet-33-R049（在庫移動指示詳細 / 実装参照 `src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:52-58; src/Eccube/Entity/DtbStockMoveInstruction.php`）、sheet-6-R102（在庫編集 / 実装参照 `src/Eccube/Form/Type/Admin/StockApprovalType.php:107-116; app/config/eccube/packages/eccube.yaml:130`）
- 判定根拠: 送状No.の最大長は eccube_text_type_column_max_len を使っており（src/Eccube/Form/Type/Admin/StockMoveInstructionDetailType.php:38、49）、その値は16383（app/config/eccube/packages/eccube.yaml:130）。
- 確信度: high

### sheet-35-R003 送り状CSV出力 — 実装違い／IO／P3

- 正本: sheet-35（送り状CSV出力） HTML行 7374 付近
- 正本引用: 「1	オーダーID	移動指示ID」
- 設計期待値: 送り状CSVの1列目の項目名は「オーダーID」。
- 実装参照: `src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:32-34`
- 実装実態: 送り状CSVの1列目の項目名が「オーダーID」ではなく「注文番号」になっている。
- 判定根拠: CSVヘッダ定義の1件目が「注文番号」（src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php:33）。
- 確信度: high

### sheet-7-R018 在庫一括編集 — 実装違い／IO／P3

- 正本: sheet-7（在庫一括編集） HTML行 1874 付近
- 正本引用: 「2-5	状態	文字列	-	-	-	「在庫編集」シート識別ID:1-7状態を参照」
- 設計期待値: 状態は在庫編集画面と同じく、状態の名称を表示する。
- 実装参照: `src/Eccube/Resource/template/admin/Stock/bulkapproval.twig:322; src/Eccube/Entity/ProductClass.php:1247-1252; src/Eccube/Resource/template/admin/Stock/approval.twig:488-493`
- 実装実態: 状態の列に名称ではなく状態コードが表示される。在庫編集画面の同じ項目は名称を表示するため、同じ在庫でも画面によって見え方が変わる。
- 判定根拠: 一括編集は状態コードを描画している（src/Eccube/Resource/template/admin/Stock/bulkapproval.twig:322）。参照元の在庫編集は名称を返す処理を使っている（approval.twig:488-493、src/Eccube/Entity/ProductClass.php:1247-1252）。
- 確信度: high

### sheet-9-R019 在庫情報カスタムCSV出力 — 実装違い／IO／P3

- 正本: sheet-9（在庫情報カスタムCSV出力） HTML行 2061 付近
- 正本引用: 「18	前日販売数」
- 設計期待値: カスタムCSVの出力項目名は「前日販売数」である。
- 実装参照: `app/DoctrineMigrations/Version20260523100000.php:51-125`
- 実装実態: 出力項目の名称が設計と異なる：「前日販売数」は「昨日販売数」、「1ヶ月間販売数」は「1ヶ月販売数」、「1ヶ月間入庫数」は「1ヶ月入庫数」として登録されている。
- 同じ実装実態でまとまる要求: sheet-9-R022（在庫情報カスタムCSV出力）、sheet-9-R100（在庫情報カスタムCSV出力）
- 判定根拠: 項目名は「昨日販売数」で登録されている（app/DoctrineMigrations/Version20260523100000.php:51-125）。
- 確信度: high

## 掲載しなかった判定

- 実装実態が空欄の判定 1件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 12件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0202/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 58 | 0 | 0 | 0 | 58 |
| sheet-3 | 共通処理 | 57 | 0 | 3 | 0 | 54 |
| sheet-4 | 在庫検索一覧(検索入力) | 190 | 0 | 12 | 0 | 178 |
| sheet-5 | 在庫検索一覧(検索結果) | 59 | 0 | 0 | 0 | 59 |
| sheet-6 | 在庫編集 | 178 | 1 | 6 | 0 | 171 |
| sheet-7 | 在庫一括編集 | 85 | 0 | 2 | 1 | 82 |
| sheet-8 | 在庫情報CSV出力 | 26 | 0 | 0 | 0 | 26 |
| sheet-9 | 在庫情報カスタムCSV出力 | 114 | 25 | 3 | 0 | 86 |
| sheet-10 | 在庫切れ、在庫警戒リストCSV出力 | 11 | 0 | 0 | 0 | 11 |
| sheet-11 | 在庫切れリストCSV出力 | 26 | 0 | 0 | 0 | 26 |
| sheet-12 | 在庫警戒リストCSV出力 | 31 | 0 | 0 | 0 | 31 |
| sheet-13 | 在庫移動・振替検索一覧(検索・結果) | 148 | 6 | 3 | 0 | 139 |
| sheet-14 | 在庫移動・振替登録 編集 (移動) | 686 | 4 | 10 | 0 | 672 |
| sheet-15 | 在庫移動・振替登録 編集(振替) | 307 | 2 | 10 | 0 | 295 |
| sheet-16 | 在庫移動・振替情報CSV出力 | 18 | 2 | 0 | 0 | 16 |
| sheet-17 | 在庫分割結合検索一覧(検索・結果) | 99 | 0 | 2 | 0 | 97 |
| sheet-18 | 在庫分割結合登録編集（分割） | 359 | 0 | 3 | 0 | 356 |
| sheet-19 | 在庫分割結合登録編集（結合) | 368 | 0 | 4 | 0 | 364 |
| sheet-20 | 在庫分割結合情報CSV出力 | 28 | 0 | 0 | 0 | 28 |
| sheet-21 | 在庫リコメンドCSV出力 | 58 | 0 | 0 | 0 | 58 |
| sheet-22 | 在庫履歴検索一覧(検索入力) | 192 | 0 | 5 | 0 | 187 |
| sheet-23 | 在庫履歴検索一覧(検索結果) | 123 | 0 | 1 | 0 | 122 |
| sheet-24 | 在庫変動履歴CSV出力 | 85 | 0 | 1 | 0 | 84 |
| sheet-25 | 欠品履歴検索一覧(検索結果) | 93 | 0 | 2 | 0 | 91 |
| sheet-26 | 欠品履歴CSV出力 | 37 | 1 | 1 | 0 | 35 |
| sheet-27 | 在庫変更CSV登録 | 171 | 1 | 0 | 0 | 170 |
| sheet-28 | 在庫移動CSV登録 | 36 | 0 | 1 | 0 | 35 |
| sheet-29 | 在庫振替CSV登録 | 40 | 0 | 1 | 0 | 39 |
| sheet-30 | 在庫分割CSV登録 | 58 | 0 | 0 | 0 | 58 |
| sheet-31 | 在庫結合CSV登録 | 39 | 0 | 0 | 0 | 39 |
| sheet-32 | 在庫移動指示検索 | 236 | 0 | 1 | 0 | 235 |
| sheet-33 | 在庫移動指示詳細 | 68 | 0 | 2 | 0 | 66 |
| sheet-34 | 在庫移動指示リスト ピッキングリスト印刷 | 15 | 0 | 0 | 0 | 15 |
| sheet-35 | 送り状CSV出力 | 30 | 0 | 1 | 0 | 29 |
| sheet-36 | バーコード貼替リストCSV出力 | 55 | 0 | 0 | 0 | 55 |
| sheet-37 | 棚卸計画一覧 | 80 | 0 | 0 | 0 | 80 |
| sheet-38 | 棚卸計画新規作成 | 13 | 0 | 0 | 0 | 13 |
| sheet-39 | 棚卸計画編集 | 60 | 0 | 0 | 0 | 60 |
| sheet-40 | 棚卸詳細登録CSV | 16 | 0 | 0 | 0 | 16 |
| sheet-41 | 棚卸詳細CSV出力 | 21 | 0 | 0 | 0 | 21 |
| sheet-42 | 棚卸在庫確認 | 56 | 0 | 0 | 0 | 56 |
| sheet-43 | 棚卸在庫反映 | 35 | 0 | 0 | 2 | 33 |
| sheet-44 | 在庫編集承認一覧(検索入力) | 52 | 0 | 0 | 0 | 52 |
| sheet-45 | 在庫編集承認一覧(検索結果) | 184 | 0 | 0 | 0 | 184 |
| sheet-46 | 承認一覧CSV出力 | 22 | 0 | 0 | 0 | 22 |
| sheet-47 | 承認対象在庫一覧CSV出力 | 31 | 0 | 0 | 0 | 31 |
| sheet-48 | 在庫移動戻しリストCSV出力 | 40 | 0 | 0 | 0 | 40 |
| sheet-49 | 在庫移動戻しリストPDF | 51 | 0 | 0 | 0 | 51 |
| sheet-50 | エラー表示 | 15 | 0 | 0 | 0 | 15 |
| sheet-51 | 別添資料_在庫変動時の履歴作成について | 431 | 0 | 6 | 0 | 425 |
| sheet-52 | 別添資料_在庫移動ステータス遷移概要 | 105 | 0 | 0 | 0 | 105 |
| sheet-53 | 別添資料_リコメンドCSV出力仕様 | 26 | 0 | 0 | 0 | 26 |

