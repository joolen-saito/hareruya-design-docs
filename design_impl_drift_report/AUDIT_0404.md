# 実装乖離監査 — 0404_基本設計仕様書(バッチ_商品管理).html

- 正本: `excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **374要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 7 | ○ |
| 実装違い | 実装はあるが設計と違う | 4 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 1 | — |
| 設計どおり | 設計どおり実装されている | 188 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 164 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 10 | — |
| **合計** | | **374** | |

## 不具合 5件（P1 0 / P2 2 / P3 3）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 6件は重複として代表へ折り畳んだ（判定そのものは 11件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-6-R001 | 商品部門未設定チェック | 未実装 | ふるまい | P2 | 公開されている商品のうち部門が設定されていないものがあるとき、管理者宛に該当商品を知らせるメールが届く |
| sheet-7-R004 | お気に入り商品セール通知 | 実装違い | ふるまい | P2 | 会員が商品詳細画面で登録したお気に入り商品のうち、セール中のものが通知の対象として取り出される |
| sheet-10-R044 | ユニサーチフィードTSV | 実装違い | IO | P3 | 支店表示フラグは、フィードTSVの項目名 branch_status として出力される |
| sheet-7-R025 | お気に入り商品セール通知 | 実装違い | ふるまい | P3 | 店内注文専用のアカウント区分が付いた会員グループに属する会員には、セール通知を送らない |
| sheet-8-R026 | 在庫初期化 | 実装違い | IO | P3 | 在庫初期化が成功したとき、処理を始めたことと終わったことが、それぞれ実行時刻を伴う経過として出力される |

### sheet-6-R001 商品部門未設定チェック — 未実装／ふるまい／P2

- 正本: sheet-6（商品部門未設定チェック） HTML行 1270 付近
- 正本引用: 「商品の公開ステータスが公開なのに、部門が未設定の商品があった場合、管理者にメールで通知する」
- 設計期待値: 公開されている商品のうち部門が設定されていないものがあるとき、管理者宛に該当商品を知らせるメールが届く
- 画像確認: sheets.tsv記載どおり画像0枚。images/配下に該当シートのimg*.pngは存在せずレイアウト図なし
- 実装参照: `src/Eccube/Repository/ProductClassRepository.php:2344-2419;src/Eccube/Service/MailService.php:1347-1380;src/Eccube/Repository/DtbOtcBuyOrderRepository.php:935-987;src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:40-59`
- 実装実態: 公開ステータスと部門を条件に商品を点検して管理者へ通知する処理がeeに無く、部門未設定を知らせるメールは店頭買取の集計時に買取明細の部門未設定を対象として送られるだけである
- 同じ実装実態でまとまる要求: sheet-6-R004（商品部門未設定チェック）、sheet-6-R005（商品部門未設定チェック）、sheet-6-R006（商品部門未設定チェック）、sheet-6-R008（商品部門未設定チェック）、sheet-6-R018（商品部門未設定チェック）、sheet-6-R023（商品部門未設定チェック）
- 判定根拠: eeの全コマンド定義（src/Eccube/Command/*.php の登録名一覧）を走査したが、公開ステータスが公開で部門が未設定の商品を抽出して通知する処理は無い。抽出処理は src/Eccube/Repository/ProductClassRepository.php:2344-2419 にコメントとして残されているだけで有効な実装ではない。部門未設定商品通知メールの送信処理は src/Eccube/Service/MailService.php:1347-1380 に存在するが、その呼び出し元は店頭買取集計バッチ（src/Eccube/Service/Admin/OtcBuyOrder/BatchAggregateSummaryAction.php:40-59、src/Eccube/Command/OtcBuyOrderAggregateSummaryCommand.php:45-91）だけで、対象の抽出も店頭買取受注明細の部門未設定（src/Eccube/Repository/DtbOtcBuyOrderRepository.php:935-987）であり、商品の公開ステータスと部門を見る本機能の抽出ではない
- 確信度: high

### sheet-7-R004 お気に入り商品セール通知 — 実装違い／ふるまい／P2

- 正本: sheet-7（お気に入り商品セール通知） HTML行 1342 付近
- 正本引用: 「・会員がお気に入りに登録した商品のうち、セールフラグが立っている商品の一覧を取得する。」
- 設計期待値: 会員が商品詳細画面で登録したお気に入り商品のうち、セール中のものが通知の対象として取り出される
- 画像確認: sheets.tsv記載どおり画像0枚。images/配下に該当シートのimg*.pngは存在せずレイアウト図なし
- 実装参照: `src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-255;src/Eccube/Controller/Front/ProductController.php:863-919;src/Eccube/Service/EntityManager/FavoriteProductEntityManager.php:32-46;src/Eccube/Entity/DtbFavoriteProduct.php:35-44`
- 実装実態: 通知バッチが見に行くお気に入りの保持先には、会員のお気に入り登録操作で何も書き込まれない。会員の登録は言語を伴う別の保持先へ入るため、通知の対象は常に0件になる
- 判定根拠: 通知対象の抽出は src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-255 が行うが、その参照先へお気に入りを書き込む処理がeeに無い（src/Eccube/Repository/CustomerFavoriteProductRepository.php:48-61 の登録処理は呼び出し元が無い）。会員が商品詳細で行うお気に入り登録は src/Eccube/Controller/Front/ProductController.php:863-919 から src/Eccube/Service/EntityManager/FavoriteProductEntityManager.php:32-46 を通じて別の保持先（商品・会員・言語の組、src/Eccube/Entity/DtbFavoriteProduct.php:35-44）へ書かれる。このため抽出結果は常に空になり、セール中のお気に入り商品があっても通知されない。あわせて抽出側は言語を持たないため、行に付く言語は会員が登録した言語ではなく商品側の言語区分になる
- 確信度: high

### sheet-10-R044 ユニサーチフィードTSV — 実装違い／IO／P3

- 正本: sheet-10（ユニサーチフィードTSV） HTML行 1630 付近
- 正本引用: 「34 branch_status 支店表示フラグ」
- 設計期待値: 支店表示フラグは、フィードTSVの項目名 branch_status として出力される
- 画像確認: sheet-10 は画像なし（images に sheet-10_img*.png は存在しない）
- 実装参照: `src/Eccube/Service/UniSearch/UniSearchExportService.php:167;src/Eccube/Repository/ProductClassRepository.php:530`
- 実装実態: 支店表示フラグは出力されているが、ヘッダおよび値の項目名が is_branch_published になっており、branch_status という項目名はフィードTSVに現れない
- 判定根拠: 出力項目の一覧（src/Eccube/Service/UniSearch/UniSearchExportService.php:129-172）を設計の項目名と1件ずつ突き合わせると、識別ID34の行だけ項目名が branch_status ではなく is_branch_published になっている（src/Eccube/Service/UniSearch/UniSearchExportService.php:167、値の設定 src/Eccube/Service/UniSearch/UniSearchExportService.php:496、値の元 src/Eccube/Repository/ProductClassRepository.php:530）。他の36項目は設計の項目名と一致しており、この1項目だけ名前が違う。検索時の絞り込み名も fq.is_branch_published（src/Eccube/Service/UniSearch/UniSearchService.php:134）で、設計に書かれた branch_status はどこにも現れない
- 確信度: med

### sheet-7-R025 お気に入り商品セール通知 — 実装違い／ふるまい／P3

- 正本: sheet-7（お気に入り商品セール通知） HTML行 1367 付近
- 正本引用: 「会員グループに「店内注文専用アカウント」または「支店店内注文専用アカウント」が設定されている会員は対象にしない。」
- 設計期待値: 店内注文専用のアカウント区分が付いた会員グループに属する会員には、セール通知を送らない
- 画像確認: sheets.tsv記載どおり画像0枚。images/配下に該当シートのimg*.pngは存在せずレイアウト図なし
- 実装参照: `src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-255;src/Eccube/Form/Type/Admin/CustomerGroupType.php:30-66`
- 実装実態: 通知対象の絞り込みは会員ステータスだけで、会員グループの店内注文専用・支店店内注文専用の区分を条件にしていないため、これらの会員にも通知が送られる
- 判定根拠: src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-255 の抽出条件は会員ステータスだけで、会員グループの区分を見ていない。区分自体は src/Eccube/Form/Type/Admin/CustomerGroupType.php:30-66 に「店内注文専用アカウント」「支店店内注文専用アカウント」として存在する。なお同じ行が述べる「お気に入りは商品と言語の組で判定する」点の不一致は sheet-7-R004 の指摘に含めている
- 確信度: high

### sheet-8-R026 在庫初期化 — 実装違い／IO／P3

- 正本: sheet-8（在庫初期化） HTML行 1447 付近
- 正本引用: 「成功時出力 実行時刻を伴う開始と完了の処理経過の出力」
- 設計期待値: 在庫初期化が成功したとき、処理を始めたことと終わったことが、それぞれ実行時刻を伴う経過として出力される
- 画像確認: sheet-8は画像0枚（images配下にsheet-8_img*.pngは存在しない）。図の文言による追加要求は無い
- 実装参照: `src/Eccube/Command/InitialStockRegistrationCommand.php:50-73`
- 実装実態: 出力されるのは完了時の1文（『在庫初期化が完了しました。（N件作成、新店舗ID=M）』）だけで、開始を知らせる出力が無く、時刻も付かない
- 判定根拠: src/Eccube/Command/InitialStockRegistrationCommand.php:50-73 の出力は src/Eccube/Command/InitialStockRegistrationCommand.php:56 と :66 のエラー文と :71 の完了文だけで、処理開始を知らせる出力が存在せず、完了文にも実行時刻が含まれない。現行の同バッチは開始と完了を実行時刻付きで出力する（/home/y-saito/Developments/ec-cube/app/Customize/Command/ProductStockBatch.php:57,66,69）。当シートは機能を現行踏襲と定めているため、開始出力と時刻の欠落は設計との差である
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 1件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0404/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 8 | 0 | 0 | 0 | 8 |
| sheet-3 | 期間別販売数集計 | 42 | 0 | 0 | 0 | 42 |
| sheet-4 | 入荷通知キャンセル | 39 | 0 | 0 | 0 | 39 |
| sheet-5 | 期間別入庫数集計 | 44 | 0 | 0 | 0 | 44 |
| sheet-6 | 商品部門未設定チェック | 29 | 7 | 0 | 0 | 22 |
| sheet-7 | お気に入り商品セール通知 | 36 | 0 | 2 | 1 | 33 |
| sheet-8 | 在庫初期化 | 28 | 0 | 1 | 0 | 27 |
| sheet-9 | ユニサーチフィード作成 | 78 | 0 | 0 | 0 | 78 |
| sheet-10 | ユニサーチフィードTSV | 48 | 0 | 1 | 0 | 47 |
| sheet-11 | ユニサーチフィード送信 | 15 | 0 | 0 | 0 | 15 |

