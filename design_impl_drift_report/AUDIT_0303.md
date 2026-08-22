# 実装乖離監査 — 0303_基本設計仕様書(フロント_商品).html

- 正本: `excel_to_html/output/0303_基本設計仕様書(フロント_商品).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **1020要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 12 | ○ |
| 実装違い | 実装はあるが設計と違う | 38 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 9 | — |
| 設計どおり | 設計どおり実装されている | 645 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 316 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 0 | — |
| **合計** | | **1020** | |

## 不具合 25件（P1 0 / P2 6 / P3 19）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 19件は重複として代表へ折り畳んだ（判定そのものは 44件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-10-R072 | お気に入り | 実装違い | ふるまい | P2 | 画面から登録したお気に入り商品がセール対象になったとき、その会員の登録メールアドレスへ通知が届く（会員ごとに1通、対象商品を並べて知らせる）。 |
| sheet-3-R057 | 商品一覧 | 実装違い | IO | P2 | カテゴリを条件に商品一覧を開いたとき、パンくずには上位から末端まで各階層のカテゴリ名が段ごとに並び、途中の段を押すとその段のカテゴリの一覧へ移動できる。商品名で検索していないときは、ホームの次にカテゴ |
| sheet-3-R158 | 商品一覧 | 実装違い | ふるまい | P2 | 商品数の「−」「＋」を押すと、表示されている商品数がそれぞれ1減り／1増え、0で「−」を押すと在庫数、在庫数で「＋」を押すと0になること。カード商品で状態が1種類しかない商品でも同じように動くこと。 |
| sheet-4-R264 | 商品詳細 | 未実装 | ふるまい | P2 | 旧商品コードで来訪すると、対応する新しい商品の商品詳細へ言語指定付きで転送される |
| sheet-7-R028 | 商品リコメンド | 実装違い | ふるまい | P2 | おすすめ商品の各カードに、商品一覧の商品カードと同じ画面項目（お気に入り登録ボタン、カード状態と在庫数の表示）が出る。 |
| sheet-8-R036 | 最近チェックした商品 | 実装違い | ふるまい | P2 | 一覧に並べるのは、カード状態がNMの規格を持ち、その規格の販売価格が0より大きい商品だけとする。 |
| sheet-10-R046 | お気に入り | 実装違い | ふるまい | P3 | ログインボタン押下でモーダルの入力値によるログインを行い、失敗したときは会員ログイン画面へ移動する。 |
| sheet-10-R074 | お気に入り | 実装違い | ふるまい | P3 | お気に入り商品一覧では、高額商品コードを持つ商品は在庫があるものだけを並べる。 |
| sheet-4-R024 | 商品詳細 | 実装違い | IO | P3 | 商品詳細のパンくずリストは、ホームアイコンに続けてカテゴリだけを並べ、最後の要素もカテゴリで終わる。 |
| sheet-4-R073 | 商品詳細 | 未実装 | ふるまい | P3 | 商品画像が読み込まれるまでの間、読込中であることを示す表示が出る。 |
| sheet-4-R110 | 商品詳細 | 実装違い | ふるまい | P3 | 価格表の「状態」の見出しリンクを押すと、カードの状態表記を説明する画面が開く。 |
| sheet-4-R140 | 商品詳細 | 実装違い | IO | P3 | お気に入り登録済みの商品では、ボタンの文言が「お気に入りに登録中」になり、押下で登録が解除される |
| sheet-4-R161 | 商品詳細 | 実装違い | ふるまい | P3 | 「商品画像について」を押下すると、ヘルプ画面が「3.商品の画像について」の位置まで送られた状態で開く |
| sheet-4-R190 | 商品詳細 | 実装違い | IO | P3 | 他のバージョン一覧の各商品でも、ログイン済み会員が既にお気に入り登録している商品はその状態が分かる表示になる |
| sheet-4-R221 | 商品詳細 | 実装違い | IO | P3 | 他のバージョン一覧のページ送りで、ページ数が多いときは先頭ページと最終ページを常に見せ、間を「...」で省略した並びになる |
| sheet-4-R232 | 商品詳細 | 未実装 | ふるまい | P3 | デッキ画像が読み込まれるまでの間、読込中であることを示す表示が出る |
| sheet-4-R258 | 商品詳細 | 未実装 | IO | P3 | 日本語ページの応答に、英語向け表示を含む商品のときだけ英語版ページの対応付けが検索エンジン向けに出る |
| sheet-7-R037 | 商品リコメンド | 実装違い | ふるまい | P3 | おすすめ商品のうちフォイル商品は、商品画像にフォイル用の装飾が重ねて表示される。 |
| sheet-8-R012 | 最近チェックした商品 | 実装違い | ふるまい | P3 | 最近チェックした商品は、どの表示画面でも最大15件を横送りの操作なしに並べて表示する。 |
| sheet-8-R028 | 最近チェックした商品 | 実装違い | ふるまい | P3 | 最近チェックした商品の見出しは、履歴の有無にかかわらず常に表示される。 |
| sheet-8-R030 | 最近チェックした商品 | 未実装 | ふるまい | P3 | フォイル商品のサムネイルには、商品画像にフォイル用の装飾が重ねて表示される。 |
| sheet-9-R053 | 入荷時通知 | 実装違い | IO | P3 | 入荷通知のログインモーダルのメールアドレス欄には『Eメールアドレス』がプレースホルダとして表示される。 |
| sheet-9-R057 | 入荷時通知 | 実装違い | ふるまい | P3 | ログインモーダルのログインボタンは入力値でログインを行い、失敗した場合は会員ログイン画面が表示される。 |
| sheet-9-R083 | 入荷時通知 | 未実装 | ふるまい | P3 | 未ログインで入荷通知を依頼したあとにログインしてマイページを開くと、マイページではなく依頼を指示した画面が表示される。本会員登録の完了時も同じ画面が表示され、一度そこへ移ったあとは通常どおりマイページ |
| sheet-9-R088 | 入荷時通知 | 実装違い | ふるまい | P3 | 入荷した商品規格に依頼している会員へ、依頼の登録日時が古い順に1件ずつ入荷通知メールが届く。 |

### sheet-10-R072 お気に入り — 実装違い／ふるまい／P2

- 正本: sheet-10（お気に入り） HTML行 2926 付近
- 正本引用: 「お気に入りに登録した商品がセール対象になると、その会員の登録メールアドレスへ通知を送る。通知は会員ごとに1通へまとめ、対象となったお気に入り商品を並べて知らせる。」
- 設計期待値: 画面から登録したお気に入り商品がセール対象になったとき、その会員の登録メールアドレスへ通知が届く（会員ごとに1通、対象商品を並べて知らせる）。
- 実装参照: `src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:38; src/Eccube/Repository/CustomerFavoriteProductRepository.php:230; src/Eccube/Service/EntityManager/FavoriteProductEntityManager.php:30`
- 実装実態: セール通知バッチは会員ごとに1通へまとめる形にはなっているが、通知対象を集める先が画面のお気に入り登録の保存先と別の入れ物になっており、画面から登録したお気に入りは1件も通知対象にならない。
- 判定根拠: 画面からの登録は DtbFavoriteProduct（src/Eccube/Service/EntityManager/FavoriteProductEntityManager.php:37）へ保存され、一覧もそこを読む（src/Eccube/Repository/DtbFavoriteProductRepository.php:97）。一方セール通知は CustomerFavoriteProduct を読む（src/Eccube/Repository/CustomerFavoriteProductRepository.php:230）。CustomerFavoriteProduct へ書き込む処理は本番コードに無く（src/Eccube/Repository/CustomerFavoriteProductRepository.php:48 の追加処理はどこからも呼ばれていない）、両者を同期する処理も無い。移植元のセール通知抽出（src/Eccube/Repository/DtbFavoriteProductRepository.php:40-70）はコメントアウトのまま残っている。
- 確信度: med

### sheet-3-R057 商品一覧 — 実装違い／IO／P2

- 正本: sheet-3（商品一覧） HTML行 1113 付近
- 正本引用: 「・カテゴリは階層を表示する」
- 設計期待値: カテゴリを条件に商品一覧を開いたとき、パンくずには上位から末端まで各階層のカテゴリ名が段ごとに並び、途中の段を押すとその段のカテゴリの一覧へ移動できる。商品名で検索していないときは、ホームの次にカテゴリ階層（またはタグ名）が並ぶ。
- 画像確認: sheet-3_img2.png・sheet-3_img7.png のパンくずはいずれも『スタンダード > タルキール：龍嵐録』のようにカテゴリ階層を段ごとに表示している。画像でも階層表示が前提であることを確認した。
- 実装参照: `src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:35-42;src/Eccube/Service/ProductList/ProductListDetailedSearchBreadcrumbBuilder.php:303-322;src/Eccube/Controller/Front/ProductController.php:358-368`
- 実装実態: カテゴリが検索条件に含まれると詳細検索条件の文字列が必ず作られ（src/Eccube/Controller/Front/ProductController.php:358-368）、パンくずは『詳細検索』の次に条件を1つにまとめた文字列を出すだけで、カテゴリ階層の各段は出力されない（src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:35-42）。階層を段ごとに出す分岐（同 56-64 行）へは到達しない。まとめ文字列に入るカテゴリ名も末端1件だけで、上位カテゴリ名は含まれない（src/Eccube/Service/ProductList/ProductListDetailedSearchBreadcrumbBuilder.php:303-322）。
- 同じ実装実態でまとまる要求: sheet-3-R014（商品一覧）、sheet-3-R020（商品一覧）、sheet-3-R023（商品一覧）
- 判定根拠: 項目定義でも同じくカテゴリ階層の表示を求めているが、カテゴリ条件時は階層が段ごとに出力されない（src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:35-42）。
- 確信度: high

### sheet-3-R158 商品一覧 — 実装違い／ふるまい／P2

- 正本: sheet-3（商品一覧） HTML行 1253 付近
- 正本引用: 「・押下すると、(3-13)商品数を1つ減らす」
- 設計期待値: 商品数の「−」「＋」を押すと、表示されている商品数がそれぞれ1減り／1増え、0で「−」を押すと在庫数、在庫数で「＋」を押すと0になること。カード商品で状態が1種類しかない商品でも同じように動くこと。
- 画像確認: sheet-3_img7/8/9/13/14/27/30（商品一覧レイアウト・状態別表示）を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/product.twig:282; src/Eccube/Resource/template/default/Block/product.twig:283; src/Eccube/Resource/template/default/Product/list.twig:547; src/Eccube/Resource/template/default/Product/list.twig:555`
- 実装実態: 状態が2種類以上の商品は一括数量ステッパーで増減・折り返しとも動作するが（src/Eccube/Resource/template/default/Product/list.twig:517-545）、カード商品で状態が1種類の商品は別分岐の数量欄になり（src/Eccube/Resource/template/default/Block/product.twig:282-291）、「−」ボタンに disabled が固定で付いていて押せず、「＋」の処理は数量欄の中にある input.quantity を探すが（src/Eccube/Resource/template/default/Product/list.twig:547-564）その分岐では数量入力が数量欄の外に出力されるため何も見つからず、表示中の商品数が変わらない。
- 同じ実装実態でまとまる要求: sheet-3-R159（商品一覧）、sheet-3-R163（商品一覧）、sheet-3-R164（商品一覧）
- 判定根拠: 状態が1種類のカード商品では商品数の増減が効かない。状態が2種類以上の商品でのみ設計どおり動く。分岐条件は src/Eccube/Resource/template/default/Block/product.twig:270（カード商品以外のときだけ一括ステッパー）。
- 確信度: high

### sheet-4-R264 商品詳細 — 未実装／ふるまい／P2

- 正本: sheet-4（商品詳細） HTML行 1940 付近
- 正本引用: 「旧商品コードで来訪したときは、対応する新しい商品コードを引き当て、その商品の商品詳細へ商品IDと言語を指定して転送する。」
- 設計期待値: 旧商品コードで来訪すると、対応する新しい商品の商品詳細へ言語指定付きで転送される
- 画像確認: レイアウト図(sheet-4_img1〜15)に該当の作図なし
- 実装参照: `src/Eccube/Controller/Front/ProductController.php:489-491;src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php`
- 実装実態: 商品詳細は商品IDでの来訪だけを受け付け(src/Eccube/Controller/Front/ProductController.php:489-491)、旧商品コードでの来訪を受ける入口が無い。旧商品コードと新商品コードの対応表(src/Eccube/Entity/Master/MtbProductCodeMapping.php)とその読み出し口(src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php)は用意されているが、どこからも使われていない。
- 同じ実装実態でまとまる要求: sheet-4-R267（商品詳細）、sheet-4-R270（商品詳細 / 実装参照 `src/Eccube/Controller/Front/ProductController.php:489-495;src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php`）
- 判定根拠: ee 全体で MtbProductCodeMapping を参照するのは実体定義と読み出し口の2ファイルだけで、転送を行う処理が存在しない。src/Eccube/Controller/Front/ProductController.php にも商品ID以外の来訪を受ける入口は無い。
- 確信度: high

### sheet-7-R028 商品リコメンド — 実装違い／ふるまい／P2

- 正本: sheet-7（商品リコメンド） HTML行 2420 付近
- 正本引用: 「画面項目は商品一覧の商品表示部分と同一とする」
- 設計期待値: おすすめ商品の各カードに、商品一覧の商品カードと同じ画面項目（お気に入り登録ボタン、カード状態と在庫数の表示）が出る。
- 画像確認: sheet-7_img1・img2（あなたへのおすすめアイテム枠。各カードにお気に入り(ハート)ボタン・NM/在庫表示・価格・数量・カート追加ボタン・週間販売数、右端に送りボタン）を確認。 画像上、おすすめカードにハート(お気に入り)と「NM 在庫 1,000」がある点を確認。
- 実装参照: `src/Eccube/Resource/template/default/Block/user_recommend_product.twig:34;src/Eccube/Resource/template/default/Block/_product_card.twig:10;src/Eccube/Resource/template/default/Block/_product_card.twig:33`
- 実装実態: おすすめ商品枠のカードは showFavoriteButton:false / showStock:false を指定して描画されるため(src/Eccube/Resource/template/default/Block/user_recommend_product.twig:34)、お気に入りボタン(src/Eccube/Resource/template/default/Block/_product_card.twig:10,73)とカード状態・在庫数の表示(src/Eccube/Resource/template/default/Block/_product_card.twig:33)がいずれも出力されない。
- 判定根拠: 商品一覧の商品カードにはお気に入りボタンと在庫表示があるが、おすすめ商品枠だけ両方を抑止している。レイアウト図(sheet-7_img1/img2)でもおすすめカードにハートボタンと「NM 在庫 1,000」が描かれている。
- 確信度: med

### sheet-8-R036 最近チェックした商品 — 実装違い／ふるまい／P2

- 正本: sheet-8（最近チェックした商品） HTML行 2530 付近
- 正本引用: 「販売可能な規格 カード状態がNMの規格を持ち、その規格の販売価格が0より大きいこと サムネイルに使う画像は、その商品に登録された商品画像のうち表示順が最も先の1枚とする。」
- 設計期待値: 一覧に並べるのは、カード状態がNMの規格を持ち、その規格の販売価格が0より大きい商品だけとする。
- 画像確認: sheet-8_img1(SALEラベルと拡大アイコン付きの単票カード)・img2(「最近チェックした商品」見出し＋5件を1行グリッドで送りボタン無し)・img3(SALE付きカードを複数行グリッド)を確認。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:719-741;src/Eccube/Repository/ProductRepository.php:681-698`
- 実装実態: 対象条件は「表示可能な規格があること」と「表示中店舗の在庫が1以上あること」で組まれており(src/Eccube/Repository/ProductRepository.php:725-732)、カード状態がNMであることも販売価格が0より大きいことも条件に入っていない。規格の選択はカード状態のID順で最良のものを選ぶだけ(src/Eccube/Repository/ProductRepository.php:681-698)。
- 判定根拠: カード状態がNM以外しか持たない商品や、販売価格が0の規格しか持たない商品でも、在庫があれば一覧に並ぶ。逆に、NM規格を持っていても在庫0なら並ばない。設計が定める抽出条件と実装の抽出条件が一致しない。
- 確信度: med

### sheet-10-R046 お気に入り — 実装違い／ふるまい／P3

- 正本: sheet-10（お気に入り） HTML行 2888 付近
- 正本引用: 「・モーダル内の入力値をもとにログインを実行し、ログインが失敗すれば会員ログイン画面に遷移する」
- 設計期待値: ログインボタン押下でモーダルの入力値によるログインを行い、失敗したときは会員ログイン画面へ移動する。
- 画像確認: img3のログインボタンに一致。遷移先画面はレイアウト図に無い。
- 実装参照: `src/Eccube/Resource/template/default/Block/js/product_js.twig:564-586`
- 実装実態: モーダルの入力値でログインを試みるところまでは設計どおりだが、失敗時はモーダルを開いたままエラー文言を出すだけで、会員ログイン画面へ移動しない。
- 同じ実装実態でまとまる要求: sheet-10-R029（お気に入り / 実装参照 `src/Eccube/Resource/template/default/Block/js/product_js.twig:579-585`）
- 判定根拠: 失敗分岐（src/Eccube/Resource/template/default/Block/js/product_js.twig:579-586）に遷移処理が無い。成功時のみモーダルを閉じて元の操作を再実行する。R029 と同一の実装欠陥。
- 確信度: med

### sheet-10-R074 お気に入り — 実装違い／ふるまい／P3

- 正本: sheet-10（お気に入り） HTML行 2928 付近
- 正本引用: 「高額商品コードを持つ商品は、在庫があるものだけを表示する。」
- 設計期待値: お気に入り商品一覧では、高額商品コードを持つ商品は在庫があるものだけを並べる。
- 実装参照: `src/Eccube/Repository/DtbFavoriteProductRepository.php:97-137; src/Eccube/Resource/template/default/Mypage/favorite.twig:124-130`
- 実装実態: 一覧は公開中・該当言語の規格をすべて並べ、高額商品コードの有無による在庫ありへの絞り込みを行っていない。在庫0の高額商品も売り切れ表示のまま一覧に残る。
- 判定根拠: 一覧の抽出条件は会員・公開状態・（任意で）セール絞り込みだけで、高額商品コードの条件が無い（src/Eccube/Repository/DtbFavoriteProductRepository.php:99-114）。テンプレート側も公開規格を言語で絞るだけである（src/Eccube/Resource/template/default/Mypage/favorite.twig:127）。移植元の該当条件はコメントアウトで残っている（src/Eccube/Repository/ProductClassRepository.php:832）。会員ログイン要求・公開中限定・言語別に別行という他の3点は満たしている。
- 確信度: med

### sheet-4-R024 商品詳細 — 実装違い／IO／P3

- 正本: sheet-4（商品詳細） HTML行 1630 付近
- 正本引用: 「★下記のような表示形式とする {ホームアイコン} > {カテゴリ}」
- 設計期待値: 商品詳細のパンくずリストは、ホームアイコンに続けてカテゴリだけを並べ、最後の要素もカテゴリで終わる。
- 画像確認: img1（🏠 > エルドレインの森 > アンコモン）・img3（🏠 > 商品詳細検索 > 最新セット > タルキール：龍嵐録 > アンコモン）のいずれもパンくず末尾はカテゴリで、商品名は含まれない。
- 実装参照: `src/Eccube/Resource/template/default/breadcrumb_nav.twig:227-235`
- 実装実態: カテゴリ階層を並べた後、最後に商品名を現在地として1要素追加している（current_li(product_crumb_label)）。
- 判定根拠: src/Eccube/Resource/template/default/breadcrumb_nav.twig:230 でカテゴリ階層のリンクを出力した直後、src/Eccube/Resource/template/default/breadcrumb_nav.twig:232 で商品名を現在地要素として追加している。設計の表示形式および例はいずれもカテゴリで終わっており、商品名の要素は含まれない。
- 確信度: med

### sheet-4-R073 商品詳細 — 未実装／ふるまい／P3

- 正本: sheet-4（商品詳細） HTML行 1701 付近
- 正本引用: 「・(2-2)商品画像の読込中は、ローディングを表示する」
- 設計期待値: 商品画像が読み込まれるまでの間、読込中であることを示す表示が出る。
- 画像確認: img4・img3 の商品画像領域を確認。読込中表示の指定は図からは読み取れないため本文の記述で判定した。
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:176-227`
- 実装実態: 商品画像は img 要素をそのまま並べるだけで、読込中を示す表示は出さない。
- 判定根拠: src/Eccube/Resource/template/default/Product/detail.twig:176-227 の画像ギャラリーには読込中の表示要素が無く、front 用CSS（html/template/default/assets/hareruya/css/hareruya-product-detail.css・hareruya-common.css）にも商品画像用のローディング表示の定義が無い（slick-loading は読み込み中にスライドを不可視にするだけで、読込中の表示は出さない）。
- 確信度: med

### sheet-4-R110 商品詳細 — 実装違い／ふるまい／P3

- 正本: sheet-4（商品詳細） HTML行 1740 付近
- 正本引用: 「・押下すると、カードの状態表記画面に遷移する」
- 設計期待値: 価格表の「状態」の見出しリンクを押すと、カードの状態表記を説明する画面が開く。
- 画像確認: img4・img5 の価格表「状態」見出しの?アイコン付きリンクに対応。遷移先は図からは読み取れないため本文の記述で判定した。
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:258-262`
- 実装実態: 「状態」の見出しリンクの遷移先が、カードの状態表記の画面ではなくオンラインショップについてのヘルプ画面（user_data の help_onlineshop）になっている。テンプレートにも遷移先未確定のTODOコメントが残っている。
- 判定根拠: src/Eccube/Resource/template/default/Product/detail.twig:260-261 は遷移先を help_onlineshop としており、直前行に遷移先未確定のTODOコメントがある。同じ「状態」見出しリンクでも買取商品詳細（src/Eccube/Resource/template/default/Purchase/detail.twig:138）は card_condition の画面を開いており、カードの状態表記の画面がシステム上存在することが分かる。
- 確信度: high

### sheet-4-R140 商品詳細 — 実装違い／IO／P3

- 正本: sheet-4（商品詳細） HTML行 1770 付近
- 正本引用: 「・お気に入りに登録済みの場合は「お気に入りに登録中」と表示し、押下するとお気に入りを解除する」
- 設計期待値: お気に入り登録済みの商品では、ボタンの文言が「お気に入りに登録中」になり、押下で登録が解除される
- 画像確認: sheet-4_img4(商品詳細SPレイアウト図)で該当の表示を確認
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:351-356;src/Eccube/Resource/locale/messages.ja.yaml:1120-1121`
- 実装実態: 登録済み状態で表示される文言は「お気に入りに追加済です。」(src/Eccube/Resource/locale/messages.ja.yaml:1121 front.product.add_favorite_alrady)で、「お気に入りに登録中」ではない。解除自体は実装済み(src/Eccube/Controller/Front/ProductController.php:925-932)。
- 判定根拠: src/Eccube/Resource/template/default/Product/detail.twig:354-355 が未登録／登録済みの2文言を出し分けており、登録済み側の文言が src/Eccube/Resource/locale/messages.ja.yaml:1121 の「お気に入りに追加済です。」。項目表のラベル(2-16「お気に入りに追加/お気に入り登録中」)とも一致しない。
- 確信度: high

### sheet-4-R161 商品詳細 — 実装違い／ふるまい／P3

- 正本: sheet-4（商品詳細） HTML行 1791 付近
- 正本引用: 「・押下すると、ヘルプ画面に遷移し、「3.商品の画像について」の項目にスクロールした状態にする」
- 設計期待値: 「商品画像について」を押下すると、ヘルプ画面が「3.商品の画像について」の位置まで送られた状態で開く
- 画像確認: sheet-4_img5(商品詳細SP下部レイアウト図)で該当の表示を確認
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:421;app/template/user_data/help_onlineshop.twig:198-200`
- 実装実態: リンク先がヘルプ画面の先頭のままで、位置指定が付いていない(src/Eccube/Resource/template/default/Product/detail.twig:421)。ヘルプ画面側には「3.商品の画像について」の位置指定(block3)が存在する(app/template/user_data/help_onlineshop.twig:198-200)。
- 判定根拠: app/template/user_data/help_onlineshop.twig:95 の目次が同画面内の block3 を指しており、位置指定付きで開ける作りがある。商品詳細のリンクだけ位置指定が無く、常にヘルプ画面の先頭が表示される。
- 確信度: high

### sheet-4-R190 商品詳細 — 実装違い／IO／P3

- 正本: sheet-4（商品詳細） HTML行 1845 付近
- 正本引用: 「・会員がログイン済みの場合、会員のお気に入り商品かどうか分かることを表示」
- 設計期待値: 他のバージョン一覧の各商品でも、ログイン済み会員が既にお気に入り登録している商品はその状態が分かる表示になる
- 画像確認: sheet-4_img12(他のバージョンSPレイアウト図)で該当の表示を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/product_detail.twig:50-61;src/Eccube/Resource/template/default/Block/product_detail_same_name_rows.twig:49-55`
- 実装実態: 他のバージョン一覧の商品カードは、お気に入りボタンを常に未登録の見た目で描画し、会員の登録状態を渡していない(src/Eccube/Resource/template/default/Block/product_detail.twig:50-58)。登録状態は押下時に更新されるだけ(src/Eccube/Resource/template/default/Block/js/product_js.twig:325-340)。
- 判定根拠: 商品一覧側のカードは登録状態を受け取って選択状態を付ける作りがある(src/Eccube/Resource/template/default/Block/_product_card.twig:75)が、他のバージョン一覧が使う src/Eccube/Resource/template/default/Block/product_detail.twig には同等の受け渡しが無く、src/Eccube/Resource/template/default/Block/product_detail_same_name_rows.twig:49-55 でも渡していない。
- 確信度: med

### sheet-4-R221 商品詳細 — 実装違い／IO／P3

- 正本: sheet-4（商品詳細） HTML行 1878 付近
- 正本引用: 「・ページ番号が多い場合は、一部を「...（省略）」で表記する」
- 設計期待値: 他のバージョン一覧のページ送りで、ページ数が多いときは先頭ページと最終ページを常に見せ、間を「...」で省略した並びになる
- 画像確認: sheet-4_img12(他のバージョンSPレイアウト図)で該当の表示を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/js/product_detail_same_name_js.twig:29-58`
- 実装実態: 現在ページの前後4ページ分を並べるだけで、先頭・最終ページの番号も「...」も出さない(src/Eccube/Resource/template/default/Block/js/product_detail_same_name_js.twig:29-58)。
- 同じ実装実態でまとまる要求: sheet-4-R222（商品詳細）、sheet-4-R223（商品詳細）、sheet-4-R224（商品詳細）、sheet-4-R225（商品詳細）
- 判定根拠: src/Eccube/Resource/template/default/Block/js/product_detail_same_name_js.twig:30-31 で表示範囲を現在ページ±4に決め、src/Eccube/Resource/template/default/Block/js/product_detail_same_name_js.twig:47-58 でその範囲の番号だけを並べる。省略記号と先頭・最終ページを出す作りは共通のページ送り(src/Eccube/Resource/template/default/pager.twig:21-60)にはあるが、他のバージョン一覧では使っていない。
- 確信度: high

### sheet-4-R232 商品詳細 — 未実装／ふるまい／P3

- 正本: sheet-4（商品詳細） HTML行 1903 付近
- 正本引用: 「・デッキ画像の読込中は、ローディングを表示する」
- 設計期待値: デッキ画像が読み込まれるまでの間、読込中であることを示す表示が出る
- 画像確認: sheet-4_img14(デッキ一覧SPレイアウト図)で該当の表示を確認
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:519-521`
- 実装実態: デッキ画像は遅延読込の画像をそのまま置くだけで(src/Eccube/Resource/template/default/Product/detail.twig:520)、読込中の表示は無い。デッキ画像の枠にも読込中を示す装飾は無い(html/template/default/assets/hareruya/css/hareruya-product-detail.css の .p-hareruya-product-detail__deck-img)。
- 判定根拠: 他のバージョン一覧には読込中表示がある(src/Eccube/Resource/template/default/Block/js/product_detail_unisearch_same_name_js.twig:26-32)のに対し、デッキ側には同等の表示が src/Eccube/Resource/template/default/Product/detail.twig:507-562 のどこにも無い。
- 確信度: high

### sheet-4-R258 商品詳細 — 未実装／IO／P3

- 正本: sheet-4（商品詳細） HTML行 1934 付近
- 正本引用: 「日本語ページでは、商品の販売制限に英語向けの表示が含まれるときだけ、検索エンジン向けに英語版ページの対応付けを出力する。含まれないときは出力しない。」
- 設計期待値: 日本語ページの応答に、英語向け表示を含む商品のときだけ英語版ページの対応付けが検索エンジン向けに出る
- 画像確認: レイアウト図(sheet-4_img1〜15)に該当の作図なし
- 実装参照: `src/Eccube/Controller/Front/ProductController.php:716-722;src/Eccube/Resource/template/default/Product/detail.twig:69-95`
- 実装実態: 英語版ページの有無の判定値は作られるが(src/Eccube/Controller/Front/ProductController.php:716-722)、画面のどこにも出力されない。検索エンジン向けの言語対応付けの出力は商品詳細にも共通枠にも無い。
- 判定根拠: src/Eccube/Controller/Front/ProductController.php:716-722 で求めた値は src/Eccube/Controller/Front/ProductController.php:773 で受け渡されるだけで、Product/detail.twig を含むどのテンプレートでも参照されていない(ee 全体で hasNotEnPage の参照は src/Eccube/Controller/Front/ProductController.php のみ、言語対応付けの出力も皆無)。
- 確信度: high

### sheet-7-R037 商品リコメンド — 実装違い／ふるまい／P3

- 正本: sheet-7（商品リコメンド） HTML行 2434 付近
- 正本引用: 「商品画像は遅延読み込みで表示し、フォイル商品は画像にフォイル用の装飾を付す。」
- 設計期待値: おすすめ商品のうちフォイル商品は、商品画像にフォイル用の装飾が重ねて表示される。
- 画像確認: sheet-7_img1・img2（あなたへのおすすめアイテム枠。各カードにお気に入り(ハート)ボタン・NM/在庫表示・価格・数量・カート追加ボタン・週間販売数、右端に送りボタン）を確認。
- 実装参照: `src/Eccube/Resource/template/default/Block/user_recommend_product.twig:34;src/Eccube/Resource/template/default/Block/_product_card.twig:14-29`
- 実装実態: おすすめ商品カードはフォイル商品でも商品名の先頭に「【Foil】」を付けるだけで(src/Eccube/Resource/template/default/Block/_product_card.twig:29)、商品画像側にフォイル用の装飾クラスを付けていない(src/Eccube/Resource/template/default/Block/_product_card.twig:14)。
- 判定根拠: フォイル装飾のスタイル(foilImg)は共通CSSに存在し、他のカード（Block/product_detail_same_name_rows.twig:43）では画像側に付与しているが、おすすめ商品カードでは付与していない。横スライダー・前後送りボタン・遅延読み込み・見出し文言・英語名表示は実装済み。
- 確信度: med

### sheet-8-R012 最近チェックした商品 — 実装違い／ふるまい／P3

- 正本: sheet-8（最近チェックした商品） HTML行 2500 付近
- 正本引用: 「・最大15件をスライダーなしで表示する、表示順は最近見た順（新しい順）とする」
- 設計期待値: 最近チェックした商品は、どの表示画面でも最大15件を横送りの操作なしに並べて表示する。
- 画像確認: sheet-8_img1(SALEラベルと拡大アイコン付きの単票カード)・img2(「最近チェックした商品」見出し＋5件を1行グリッドで送りボタン無し)・img3(SALE付きカードを複数行グリッド)を確認。
- 実装参照: `src/Eccube/Resource/template/default/Block/recently_viewed.twig:25-39;src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:70`
- 実装実態: 件数15件(src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:70)と最近見た順(src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:78-79)は満たすが、本店ECTOPのレイアウトだけ前送り・後送りボタン付きの横スライダーとして描画される(src/Eccube/Resource/template/default/Block/recently_viewed.twig:25-39)。商品一覧・商品詳細のレイアウトはグリッド表示。
- 判定根拠: 本店ECTOPの表示だけがスライダーになっており、レイアウト図(sheet-8_img2)の「送りボタン無しで1行に並べる」表示と一致しない。
- 確信度: med

### sheet-8-R028 最近チェックした商品 — 実装違い／ふるまい／P3

- 正本: sheet-8（最近チェックした商品） HTML行 2521 付近
- 正本引用: 「見出し 常に表示する」
- 設計期待値: 最近チェックした商品の見出しは、履歴の有無にかかわらず常に表示される。
- 画像確認: sheet-8_img1(SALEラベルと拡大アイコン付きの単票カード)・img2(「最近チェックした商品」見出し＋5件を1行グリッドで送りボタン無し)・img3(SALE付きカードを複数行グリッド)を確認。
- 実装参照: `src/Eccube/Resource/template/default/Block/recently_viewed.twig:4;src/Eccube/Resource/template/default/Block/recently_viewed.en.twig:4`
- 実装実態: テンプレート全体が「表示できる商品が1件以上あるとき」の条件で囲まれているため(src/Eccube/Resource/template/default/Block/recently_viewed.twig:4)、履歴が無い・または表示できる商品が無いときは見出しごと何も描画されない。
- 同じ実装実態でまとまる要求: sheet-8-R029（最近チェックした商品 / 実装参照 `src/Eccube/Resource/template/default/Block/recently_viewed.twig:4;src/Eccube/Resource/template/default/Block/recently_viewed.en.twig:4;src/Eccube/Resource/locale/messages.ja.yaml:1214`）、sheet-8-R039（最近チェックした商品 / 実装参照 `src/Eccube/Resource/template/default/Block/recently_viewed.twig:4;src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:51-56`）、sheet-8-R041（最近チェックした商品）、sheet-8-R043（最近チェックした商品）、sheet-8-R044（最近チェックした商品 / 実装参照 `src/Eccube/Resource/template/default/Block/recently_viewed.twig:4;src/Eccube/Service/Block/RecentlyViewedBlockPayloadBuilder.php:51-56`）
- 判定根拠: 日本語・英語どちらのテンプレートも同じ条件分岐で、見出しが常時表示にならない。
- 確信度: med

### sheet-8-R030 最近チェックした商品 — 未実装／ふるまい／P3

- 正本: sheet-8（最近チェックした商品） HTML行 2523 付近
- 正本引用: 「商品画像の装飾 フォイル商品のときはフォイル用の装飾を付す 商品画像は遅延読み込みで取得する。」
- 設計期待値: フォイル商品のサムネイルには、商品画像にフォイル用の装飾が重ねて表示される。
- 画像確認: sheet-8_img1(SALEラベルと拡大アイコン付きの単票カード)・img2(「最近チェックした商品」見出し＋5件を1行グリッドで送りボタン無し)・img3(SALE付きカードを複数行グリッド)を確認。
- 実装参照: `src/Eccube/Resource/template/default/Block/recently_viewed.twig:13;src/Eccube/Resource/template/default/Block/_product_card_simple.twig:14`
- 実装実態: 最近チェックした商品のカードはフォイル商品でも商品名の先頭に「【Foil】」を付けるだけで(src/Eccube/Resource/template/default/Block/_product_card_simple.twig:29)、商品画像にフォイル用の装飾クラスを付けていない(src/Eccube/Resource/template/default/Block/_product_card_simple.twig:14)。
- 判定根拠: フォイル装飾のスタイル(foilImg)は共通CSSに存在し、他のカード（Block/product_detail_same_name_rows.twig:43）では画像側に付与しているが、このブロックのカードでは付与していない。
- 確信度: med

### sheet-9-R053 入荷時通知 — 実装違い／IO／P3

- 正本: sheet-9（入荷時通知） HTML行 2646 付近
- 正本引用: 「・プレースホルダ: Eメールアドレス・入力せずに(7)ログインを押下すると入力必須のバリデーションメッセージを表示する」
- 設計期待値: 入荷通知のログインモーダルのメールアドレス欄には『Eメールアドレス』がプレースホルダとして表示される。
- 画像確認: img7=ログインモーダル（現在在庫切れとなっております／Eメールアドレス／パスワード／ログイン／新規登録）
- 実装参照: `src/Eccube/Resource/template/default/Product/detail.twig:595; src/Eccube/Resource/template/default/Product/list.twig:1053`
- 実装実態: プレースホルダは common.mail_address の『メールアドレス』で、先頭の『E』が無い（src/Eccube/Resource/template/default/Product/detail.twig:595、src/Eccube/Resource/locale/messages.ja.yaml:69）。
- 判定根拠: レイアウト図img7でも入力欄のプレースホルダは『Eメールアドレス』で、実装文言と一致しない。入力必須のバリデーション表示は required 指定で満たされている。
- 確信度: med

### sheet-9-R057 入荷時通知 — 実装違い／ふるまい／P3

- 正本: sheet-9（入荷時通知） HTML行 2650 付近
- 正本引用: 「・モーダル内の入力値をもとにログインを実行し、ログインが失敗すれば会員ログイン画面に遷移する」
- 設計期待値: ログインモーダルのログインボタンは入力値でログインを行い、失敗した場合は会員ログイン画面が表示される。
- 画像確認: img7=ログインモーダル（現在在庫切れとなっております／Eメールアドレス／パスワード／ログイン／新規登録）
- 実装参照: `src/Eccube/Resource/template/default/Block/js/product_js.twig:517-545`
- 実装実態: 入力値でログインは行うが、失敗時はモーダルを開いたままエラー文言を出すだけで会員ログイン画面へ移動しない（src/Eccube/Resource/template/default/Block/js/product_js.twig:532-540）。
- 同じ実装実態でまとまる要求: sheet-9-R041（入荷時通知 / 実装参照 `src/Eccube/Resource/template/default/Block/js/product_js.twig:532-540`）
- 判定根拠: 失敗分岐に画面移動が無い。成功時のみモーダルを閉じて元の依頼を続行する。
- 確信度: med

### sheet-9-R083 入荷時通知 — 未実装／ふるまい／P3

- 正本: sheet-9（入荷時通知） HTML行 2690 付近
- 正本引用: 「戻り先を保持した状態でログイン後にマイページを開くと、マイページを表示せずその戻り先へ遷移する。」
- 設計期待値: 未ログインで入荷通知を依頼したあとにログインしてマイページを開くと、マイページではなく依頼を指示した画面が表示される。本会員登録の完了時も同じ画面が表示され、一度そこへ移ったあとは通常どおりマイページ・会員登録完了画面が表示される。
- 実装参照: `src/Eccube/Controller/Front/Mypage/MypageController.php:118-138; src/Eccube/Controller/Front/CartController.php:489`
- 実装実態: 依頼時に戻り先は保存される（src/Eccube/Controller/Front/CartController.php:489）が、保存された戻り先を読み出す箇所がリポジトリ内に一つも無く、マイページも会員登録完了も常に自画面を表示する。
- 判定根拠: PRODUCT_SEARCH_REFERER は3箇所で書き込まれるだけで読み出しが無い。マイページ表示（src/Eccube/Controller/Front/Mypage/MypageController.php:118-138）にも戻り先を見る処理が無い。なおリニューアルではログインモーダルで元画面に留まる流れが用意されており、この現行の遷移は別経路。
- 確信度: med

### sheet-9-R088 入荷時通知 — 実装違い／ふるまい／P3

- 正本: sheet-9（入荷時通知） HTML行 2695 付近
- 正本引用: 「入荷した商品規格を依頼している会員へ、依頼の登録日時の昇順に1件ずつ送信する」
- 設計期待値: 入荷した商品規格に依頼している会員へ、依頼の登録日時が古い順に1件ずつ入荷通知メールが届く。
- 実装参照: `src/Eccube/Repository/DtbProductRequestRepository.php:155-188; src/Eccube/Repository/DtbProductRequestRepository.php:195-218`
- 実装実態: 送信対象の依頼を取り出す検索に並び順の指定が無く（src/Eccube/Repository/DtbProductRequestRepository.php:174-178、同:207-217）、登録日時の昇順で送られる保証が無い。
- 判定根拠: 規格単位・商品×言語単位のどちらの取得にも登録日時での並べ替えが無い。src/Eccube/Service/Stock/RestockNotificationMailSender.php:120-124 は取得した順にそのまま送信する。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 8件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 7件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0303/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 13 | 0 | 0 | 0 | 13 |
| sheet-3 | 商品一覧 | 305 | 0 | 9 | 3 | 293 |
| sheet-4 | 商品詳細 | 273 | 6 | 10 | 1 | 256 |
| sheet-5 | 商品詳細検索 | 77 | 0 | 0 | 0 | 77 |
| sheet-6 | カテゴリ一覧 | 67 | 0 | 0 | 0 | 67 |
| sheet-7 | 商品リコメンド | 41 | 0 | 2 | 1 | 38 |
| sheet-8 | 最近チェックした商品 | 49 | 5 | 8 | 0 | 36 |
| sheet-9 | 入荷時通知 | 99 | 1 | 4 | 2 | 92 |
| sheet-10 | お気に入り | 89 | 0 | 5 | 2 | 82 |

