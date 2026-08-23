# 実装乖離監査 — 0301_基本設計仕様書(フロント_トップ).html

- 正本: `excel_to_html/output/0301_基本設計仕様書(フロント_トップ).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **842要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 13 | ○ |
| 実装違い | 実装はあるが設計と違う | 32 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 3 | — |
| 設計どおり | 設計どおり実装されている | 489 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 303 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 2 | — |
| **合計** | | **842** | |

## 不具合 15件（P1 0 / P2 5 / P3 10）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 31件は重複として代表へ折り畳んだ（判定そのものは 46件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R178 | ECTOP | 実装違い | ふるまい | P2 | 英語版サイトの more を押すと、「Trending Now」タグで絞り込まれた商品一覧画面が表示される |
| sheet-3-R246 | ECTOP | 実装違い | ふるまい | P2 | 会員がお気に入り登録した公開商品は、在庫の有無にかかわらずあなたのお気に入りに並ぶ |
| sheet-3-R513 | ECTOP | 実装違い | IO | P2 | 最新記事欄に、最新記事jsonファイル作成バッチが作成したjsonファイルの内容が表示される |
| sheet-4-R117 | 支店ECTOP | 未実装 | IO | P2 | 今週の売れ筋商品／SALE中の商品の各カードに「カートに入れる」の押しボタンがあり、押すと表示中の商品数の分だけその商品がカートに入ること。 |
| sheet-4-R257 | 支店ECTOP | 未実装 | ふるまい | P2 | タイルには、カードの状態が NM のものは販売価格1円以上、NM 以外の状態のものは販売価格100円以上の商品規格だけを載せる。 |
| sheet-3-R086 | ECTOP | 実装違い | ふるまい | P3 | (1-1)バナーは7秒ごとに自動で左へ1枚スライドする。 |
| sheet-3-R136 | ECTOP | 未実装 | ふるまい | P3 | 商品画像の読込が終わるまで、その画像枠にローディングが表示される。 |
| sheet-3-R182 | ECTOP | 実装違い | ふるまい | P3 | 左スライドボタンを押すと、並んでいる商品が左へ1つだけ動く |
| sheet-3-R428 | ECTOP | 実装違い | ふるまい | P3 | 対象フォーマットの採用枚数ランキングに該当する商品が1件も無いときは、そのランキングを画面に出さない |
| sheet-3-R455 | ECTOP | 実装違い | IO | P3 | 過去1週間に本店で注文されていない商品では、週間販売数の表示自体を出さない |
| sheet-4-R111 | 支店ECTOP | 実装違い | ふるまい | P3 | 商品数が1のときにマイナスを押すと、商品数が在庫の数に切り替わること（0にはならない）。 |
| sheet-4-R125 | 支店ECTOP | 実装違い | ふるまい | P3 | 右スライドを1回押すと、並んでいる商品が1件分だけ右へ動くこと。 |
| sheet-4-R245 | 支店ECTOP | 実装違い | ふるまい | P3 | 採用情報バナーは PC 版でだけ表示し、スマートフォン版では表示しない。 |
| sheet-4-R259 | 支店ECTOP | 実装違い | ふるまい | P3 | 同一商品でタイルに載せる1件は、言語とカードの状態がいずれも最も上位のものにする。 |
| sheet-4-R263 | 支店ECTOP | 未実装 | ふるまい | P3 | タイルの割り当てが無い区画には、フォーマット別特集のタイルを補って表示し、補うタイルの対象は表示のたびに変える。 |

### sheet-3-R178 ECTOP — 実装違い／ふるまい／P2

- 正本: sheet-3（ECTOP） HTML行 1271 付近
- 正本引用: 「・押下すると、「Trending Now」のタグで絞り込まれた商品一覧画面へ遷移する」
- 設計期待値: 英語版サイトの more を押すと、「Trending Now」タグで絞り込まれた商品一覧画面が表示される
- 画像確認: img6/img11(PC)・img5(SP)の最新入荷アイテム図で、見出し・もっと見る・カード(JP言語ラベル/商品名/NM/在庫/価格/−数量＋/♡/カート/週間販売数)・左右矢印を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/new_items.en.twig:9;src/Eccube/Resource/template/default/Block/new_items.en.twig:21;src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-66`
- 実装実態: 英語版で並べる商品は英語サイト専用タグ(既定値735)から取っている(src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-66)のに、moreの遷移先だけは最新入荷アイテムタグ(Tag::NEW_ITEMS_ID=1)固定になっている(src/Eccube/Resource/template/default/Block/new_items.en.twig:9,21)。押すと英語版に並んでいたのとは別のタグの一覧が開く
- 同じ実装実態でまとまる要求: sheet-3-R180（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/new_items.en.twig:21;src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-66`）、sheet-3-R133（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/new_items.en.twig:9;src/Eccube/Resource/template/default/Block/new_items.en.twig:21;src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-64`）、sheet-3-R134（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/new_items.en.twig:9;src/Eccube/Resource/template/default/Block/new_items.en.twig:21;src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-64`）、sheet-3-R135（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/new_items.en.twig:9;src/Eccube/Resource/template/default/Block/new_items.en.twig:21;src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-64`）
- 判定根拠: src/Eccube/Service/Block/NewItemsBlockPayloadBuilder.php:59-66 で英語版のみ差し替えているタグと、src/Eccube/Resource/template/default/Block/new_items.en.twig:9,21 のリンク先タグが一致しない。既定値は app/DoctrineMigrations/Version20251125161057.php:275 で735
- 確信度: high

### sheet-3-R246 ECTOP — 実装違い／ふるまい／P2

- 正本: sheet-3（ECTOP） HTML行 1372 付近
- 正本引用: 「★以下1~6の条件で商品を表示する」
- 設計期待値: 会員がお気に入り登録した公開商品は、在庫の有無にかかわらずあなたのお気に入りに並ぶ
- 画像確認: img30/img31/img32(あなたのお気に入り欄のレイヤ画像)は簡易カード(SALEラベル/言語ラベル/商品名/価格/週間販売数)と左右矢印・もっと見るのみで、数量やカートは無い
- 実装参照: `src/Eccube/Repository/CustomerFavoriteProductRepository.php:120-126;src/Eccube/Service/Block/FavoritesBlockPayloadBuilder.php:64-68`
- 実装実態: 設計が挙げていない在庫の条件が足されており、在庫が1以上ある規格を持つ商品しか取り出さない(src/Eccube/Repository/CustomerFavoriteProductRepository.php:120-126)。売り切れたお気に入り商品はブロックに出てこない
- 判定根拠: 設計の6条件(お気に入り登録済み・公開・言語・登録日降順・最大30件・0件時非表示)には在庫条件が無く、同シートのSALE開催中では在庫条件を『3 在庫が1以上』と明記して区別している。実装はsrc/Eccube/Repository/CustomerFavoriteProductRepository.php:120-126 で在庫>0 を必須にしている
- 確信度: med

### sheet-3-R513 ECTOP — 実装違い／IO／P2

- 正本: sheet-3（ECTOP） HTML行 1738 付近
- 正本引用: 「・最新記事jsonファイル作成バッチによって作成されたjsonファイルから動的に取得する」
- 設計期待値: 最新記事欄に、最新記事jsonファイル作成バッチが作成したjsonファイルの内容が表示される
- 画像確認: sheet-3_img42(SP)/img43(PC)の最新記事図で「記事一覧を見る」リンク・サムネイル・カテゴリラベル・タイトル・著者の4件並びを確認
- 実装参照: `src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:27-28;src/Eccube/Service/CreateLatestArticleListAction.php:25-27;src/Eccube/Service/CreateLatestArticleListAction.php:98-101`
- 実装実態: バッチは利用者データ配下の list に latestArticleList.json を出力するのに対し、最新記事ブロックはそれとは別の外部所在にある latest_articles.json を読みに行く。実装のコメントにも当該所在は404であると記されており、記事が取れないと最新記事欄そのものが出ない
- 判定根拠: src/Eccube/Service/CreateLatestArticleListAction.php:25-27,98-101 が作るファイルは latestArticleList.json だが、src/Eccube/Service/Block/LatestArticlesBlockPayloadBuilder.php:28 が読むのは latest_articles.json で名前も所在も一致しない。同ファイル27行目のコメントが当該所在は404であると明記している。取得できない場合は空配列となり、src/Eccube/Resource/template/default/Block/latest_articles.twig:2 の条件で最新記事欄ごと出力されない
- 確信度: high

### sheet-4-R117 支店ECTOP — 未実装／IO／P2

- 正本: sheet-4（支店ECTOP） HTML行 2287 付近
- 正本引用: 「・押下すると、(2-9)商品数の数量分商品をカートに追加する」
- 設計期待値: 今週の売れ筋商品／SALE中の商品の各カードに「カートに入れる」の押しボタンがあり、押すと表示中の商品数の分だけその商品がカートに入ること。
- 画像確認: sheet-4_img5.png/img7.png/img8.png のいずれのカードにも赤い「カートに入れる」ボタンが描かれており、必須の部品であることを確認した。
- 実装参照: `src/Eccube/Resource/template/default/Block/_product_card.twig:73-85; src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:23; src/Eccube/Resource/template/default/Block/shop_sale.twig:23`
- 実装実態: カートに入れる押しボタンは src/Eccube/Resource/template/default/Block/_product_card.twig:79-83 にあるが、73行目の条件（本店であること、かつ読み込み側がお気に入り表示を許していること）の内側に置かれている。支店サイトでは本店の条件が成り立たず、さらに src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:23 と src/Eccube/Resource/template/default/Block/shop_sale.twig:23 はお気に入り表示を無効にして読み込むため、支店トップの両ブロックのカードには押しボタンが1つも出ない。数量入力の枠（src/Eccube/Resource/template/default/Block/_product_card.twig:52-63）だけが残り、送信する手段が無い。
- 判定根拠: 押しボタンの表示条件が本店限定になっており、支店トップでは出力されない。押下時の処理（src/Eccube/Resource/template/default/Block/_top_page_scripts.twig:29-58）は押しボタンの押下を待つ作りなので、押しボタンが無ければカートに追加する経路が無い。
- 確信度: high

### sheet-4-R257 支店ECTOP — 未実装／ふるまい／P2

- 正本: sheet-4（支店ECTOP） HTML行 2487 付近
- 正本引用: 「4	カードの状態がNMのものは販売価格が1円以上、NM以外の状態のものは販売価格が100円以上であること」
- 設計期待値: タイルには、カードの状態が NM のものは販売価格1円以上、NM 以外の状態のものは販売価格100円以上の商品規格だけを載せる。
- 画像確認: タイル レイアウト図(sheet-4_img13=PC/img14=SP/img15)を確認。1区画3件のカード＋『もっと見る』、最後の区画にお取り寄せサービス/高価買取はこちらのバナー。img9はカード画像のマウスオーバー時『画像を拡大』オーバーレイ。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:578-604;src/Eccube/Repository/ProductRepository.php:488-508`
- 実装実態: 販売価格の下限を見ていないため、状態に応じた下限を下回る商品規格もタイルの候補に入る。
- 同じ実装実態でまとまる要求: sheet-4-R258（支店ECTOP）、sheet-4-R260（支店ECTOP）
- 判定根拠: タイルの候補を絞る条件に、カードの状態に応じた販売価格の下限が無い。src/Eccube/Repository/ProductRepository.php:578-604 の条件は公開状態・タグ・表示対象・支店在庫・地域制限だけで、販売価格を見ていない（同:531-535 のコメントも、現行から引き継いだのは在庫と地域制限だけだと述べている）。ピックアップ商品タイル(同:488-508)も同様。そのため NM で1円未満、NM以外で100円未満の商品規格もタイルに載る。
- 確信度: med

### sheet-3-R086 ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-3（ECTOP） HTML行 1154 付近
- 正本引用: 「・7秒ごとに動的に(1-1)バナーを左へ1枚スライドする」
- 設計期待値: (1-1)バナーは7秒ごとに自動で左へ1枚スライドする。
- 画像確認: sheet-3_img3.png（新スライドバナー: PCで2枚並び＋左右矢印＋下部サムネイル列）と sheet-3_img4.png（現行本店: バナー左に「カード検索/カードセット/カラー/レアリティ/検索」の検索フォーム）を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/mv_carousel.twig:11;html/template/default/assets/hareruya/js/hareruya-top.js:1`
- 実装実態: MVカルーセルの自動送り間隔が4秒（autoplaySpeed:4e3）で設定されており、7秒ごとではなく4秒ごとに1枚送られる。
- 同じ実装実態でまとまる要求: sheet-3-R082（ECTOP）
- 判定根拠: R082と同一の実装欠陥。html/template/default/assets/hareruya/js/hareruya-top.js:1 の mv-slider 初期化が autoplaySpeed:4e3。
- 確信度: high

### sheet-3-R136 ECTOP — 未実装／ふるまい／P3

- 正本: sheet-3（ECTOP） HTML行 1228 付近
- 正本引用: 「・(2-3)商品画像の読込中は、ローディングが表示される」
- 設計期待値: 商品画像の読込が終わるまで、その画像枠にローディングが表示される。
- 画像確認: sheet-3_img5.png/img6.png/img8.png（最新入荷アイテム: 見出し＋もっと見る、カード画像・言語ラベル・商品名・状態・在庫・価格・数量±・♡・カート・週間販売数、末尾に「もっと見る」スライド）を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/new_items.twig:17;src/Eccube/Resource/template/default/Block/_product_card.twig:14`
- 実装実態: 商品カードの画像は素の img 要素で出力されるだけで、読込中に代わりに見せる表示が無い。フロントのスタイルにもローディング用の指定が存在しない。
- 同じ実装実態でまとまる要求: sheet-3-R203（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/sale.twig:15;src/Eccube/Resource/template/default/Block/_product_card_simple.twig:13-20;src/Eccube/Resource/template/default/Block/new_items.twig:17;html/template/default/assets/hareruya/css/hareruya-common.css:1`）、sheet-3-R253（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/favorites.twig:17;src/Eccube/Resource/template/default/Block/_product_card.twig:13-20;html/template/default/assets/hareruya/css/hareruya-common.css:1`）、sheet-3-R339（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/_product_card_simple.twig:13-20; src/Eccube/Resource/template/default/Block/price_down.twig:15; html/template/default/assets/hareruya/css/hareruya-common.css`）、sheet-3-R380（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/_product_card_simple.twig:13-20; src/Eccube/Resource/template/default/Block/restocked.twig:15; html/template/default/assets/hareruya/css/hareruya-common.css`）、sheet-3-R430（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:33-38;html/template/default/assets/hareruya/css/hareruya-common.css`）、sheet-3-R473（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:102-107;html/template/default/assets/hareruya/css/hareruya-common.css`）、sheet-4-R088（支店ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/_product_card.twig:12-21; src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:23`）
- 判定根拠: src/Eccube/Resource/template/default/Block/_product_card.twig:14 の画像出力には読込中の代替表示が無く、src/Eccube/Resource/template/default/Block/new_items.twig:17 が取り込むカード全体を見てもローディング要素は出力されない。フロント用CSS（html/template/default/assets/hareruya/css/）にもローディングに相当する定義が無い。
- 確信度: med

### sheet-3-R182 ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-3（ECTOP） HTML行 1275 付近
- 正本引用: 「・押下すると、表示されている商品を左へ1つスライドする」
- 設計期待値: 左スライドボタンを押すと、並んでいる商品が左へ1つだけ動く
- 画像確認: img6/img11(PC)・img5(SP)の最新入荷アイテム図で、見出し・もっと見る・カード(JP言語ラベル/商品名/NM/在庫/価格/−数量＋/♡/カート/週間販売数)・左右矢印を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/new_items.twig:28;src/Eccube/Resource/template/default/Block/price_down.twig:25-28;html/template/default/assets/hareruya/js/hareruya-top.js:1`
- 実装実態: 商品カルーセルは1回の送りで表示枚数分(PC幅で6枚、1280px未満で5枚、1156px未満で4枚)まとめて動く設定になっており(html/template/default/assets/hareruya/js/hareruya-top.js:1 の slidesToScroll に slidesToShow を渡している)、1つずつは動かない。同じ送り方がトップの他の商品カルーセル(値下げしました！/補充しました！など)にも共通で効いている
- 同じ実装実態でまとまる要求: sheet-3-R184（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/new_items.twig:29;html/template/default/assets/hareruya/js/hareruya-top.js:1`）、sheet-3-R230（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/sale.twig:26;html/template/default/assets/hareruya/js/hareruya-top.js:1`）、sheet-3-R232（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/sale.twig:27;html/template/default/assets/hareruya/js/hareruya-top.js:1`）、sheet-3-R274（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/favorites.twig:23;html/template/default/assets/hareruya/js/hareruya-top.js:1`）、sheet-3-R276（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/favorites.twig:24;html/template/default/assets/hareruya/js/hareruya-top.js:1`）、sheet-3-R362（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/price_down.twig:25-28; src/Eccube/Resource/template/default/Block/restocked.twig:25-28; html/template/default/assets/hareruya/js/hareruya-main.js; html/template/default/assets/hareruya/js/hareruya-top.js`）、sheet-3-R364（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/price_down.twig:25-28; src/Eccube/Resource/template/default/Block/restocked.twig:25-28; html/template/default/assets/hareruya/js/hareruya-main.js; html/template/default/assets/hareruya/js/hareruya-top.js`）、sheet-3-R403（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/price_down.twig:25-28; src/Eccube/Resource/template/default/Block/restocked.twig:25-28; html/template/default/assets/hareruya/js/hareruya-main.js; html/template/default/assets/hareruya/js/hareruya-top.js`）、sheet-3-R405（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/price_down.twig:25-28; src/Eccube/Resource/template/default/Block/restocked.twig:25-28; html/template/default/assets/hareruya/js/hareruya-main.js; html/template/default/assets/hareruya/js/hareruya-top.js`）、sheet-3-R456（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:77;html/template/default/assets/hareruya/js/hareruya-main.js:1`）、sheet-3-R458（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:78;html/template/default/assets/hareruya/js/hareruya-main.js:1`）、sheet-3-R495（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:135;html/template/default/assets/hareruya/js/hareruya-main.js:1`）、sheet-3-R497（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:136;html/template/default/assets/hareruya/js/hareruya-main.js:1`）、sheet-4-R123（支店ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/shop_sale.twig:33-36; src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:33-36; html/template/default/assets/hareruya/js/hareruya-top.js:1`）
- 判定根拠: html/template/default/assets/hareruya/js/hareruya-top.js:1 の product-carousel-slider 初期化で slidesToShow:6 と slidesToScroll:r.slidesToShow が指定され、ブレークポイント側も slidesToScroll:e.slidesToShow。左右ボタンはこのカルーセルの矢印として渡されている
- 確信度: high

### sheet-3-R428 ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-3（ECTOP） HTML行 1621 付近
- 正本引用: 「7　1件もなければ表示しない」
- 設計期待値: 対象フォーマットの採用枚数ランキングに該当する商品が1件も無いときは、そのランキングを画面に出さない
- 画像確認: sheet-3_img33(PC)/img37(SP)のデッキ採用枚数ランキング図でフォーマットタブ・順位の王冠・SALE・言語ラベル・価格・週間販売数・左右矢印を確認。img39でPCマウスオーバー時のグレーアウト＋「画像を拡大」を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/ranking.twig:21;src/Eccube/Resource/template/default/Block/ranking.twig:82;src/Eccube/Resource/locale/messages.ja.yaml:1228`
- 実装実態: 0件のフォーマットではランキングを出さない代わりに「データがありません」という文言を表示する
- 判定根拠: ranking.twig:21 の条件分岐は0件のとき ranking.twig:82 の分岐へ落ち、messages.ja.yaml:1228 の「データがありません」を出力する。フォーマットタブ自体も残るため、1件も無いフォーマットが空表示として画面に残る
- 確信度: high

### sheet-3-R455 ECTOP — 実装違い／IO／P3

- 正本: sheet-3（ECTOP） HTML行 1649 付近
- 正本引用: 「・過去1週間のうちに本店サイトで注文されていない場合、非表示にする」
- 設計期待値: 過去1週間に本店で注文されていない商品では、週間販売数の表示自体を出さない
- 画像確認: sheet-3_img33(PC)/img37(SP)のデッキ採用枚数ランキング図でフォーマットタブ・順位の王冠・SALE・言語ラベル・価格・週間販売数・左右矢印を確認。img39でPCマウスオーバー時のグレーアウト＋「画像を拡大」を確認
- 実装参照: `src/Eccube/Resource/template/default/Block/ranking.twig:69`
- 実装実態: 週間販売数は値が0でも「週間販売数0点」と常に表示され、非表示にする分岐が無い
- 同じ実装実態でまとまる要求: sheet-3-R494（ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/ranking.twig:127`）
- 判定根拠: src/Eccube/Resource/template/default/Block/ranking.twig:69 は値が無いときに0を補って必ず出力しており、0のときに行ごと出さない分岐が存在しない
- 確信度: high

### sheet-4-R111 支店ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-4（支店ECTOP） HTML行 2281 付近
- 正本引用: 「・(2-9)商品数が1の場合に押下すると、(2-9)商品数を(2-6)在庫の数にする」
- 設計期待値: 商品数が1のときにマイナスを押すと、商品数が在庫の数に切り替わること（0にはならない）。
- 画像確認: sheet-4_img7.png のカードでは商品数の初期値が10で、0の状態は描かれていない。
- 実装参照: `src/Eccube/Resource/template/default/Block/_top_page_scripts.twig:74-77; src/Eccube/Resource/template/default/shop_top.twig:63`
- 実装実態: src/Eccube/Resource/template/default/Block/_top_page_scripts.twig:76 の折り返しは0を境にしており、商品数が1のときにマイナスを押すと0になる。在庫の数に戻るのは、さらにもう一度押して0から押したときである。
- 同じ実装実態でまとまる要求: sheet-4-R115（支店ECTOP / 実装参照 `src/Eccube/Resource/template/default/Block/_top_page_scripts.twig:74-79; src/Eccube/Resource/template/default/shop_top.twig:63`）
- 判定根拠: 折り返しの下限が設計は1、実装は0で1段ずれている。商品数0の状態が画面に出るため、そのままカートに入れる操作へ進める余地が生じる。
- 確信度: high

### sheet-4-R125 支店ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-4（支店ECTOP） HTML行 2295 付近
- 正本引用: 「・押下すると、表示されている商品を右へ1つスライドする」
- 設計期待値: 右スライドを1回押すと、並んでいる商品が1件分だけ右へ動くこと。
- 画像確認: sheet-4_img7.png/img8.png のPC図に左右の矢印が描かれている（送り量は図からは判別できない）。
- 実装参照: `src/Eccube/Resource/template/default/Block/shop_sale.twig:33-36; src/Eccube/Resource/template/default/Block/shop_best_sellers.twig:33-36; html/template/default/assets/hareruya/js/hareruya-top.js:1`
- 実装実態: 送り量が1件ではなく、そのとき並んでいる件数分（PC幅で6件、画面幅により5件・4件）に設定されているため、1回押すと商品が6件分まとめて動く。
- 判定根拠: 左スライド（sheet-4-R123）と同じ横並び表示の設定を共有しており、送り量が表示件数と同じ値になっている。
- 確信度: low

### sheet-4-R245 支店ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-4（支店ECTOP） HTML行 2471 付近
- 正本引用: 「9-2	採用情報	画像	-	-	-	・PC版のみに表示される」
- 設計期待値: 採用情報バナーは PC 版でだけ表示し、スマートフォン版では表示しない。
- 画像確認: QRコード&採用情報 レイアウト図(sheet-4_img22/img23/img24)を確認。img24(PC)は左に『最新情報はXでチェック』、右に赤枠『ご自宅から簡単予約！』の2枚＋下に採用情報バナー。img22(SP)はXのQR1枚のみで採用情報バナーが無い。
- 実装参照: `src/Eccube/Resource/template/default/Block/shop_recruit.twig:11-16;src/Eccube/Resource/template/default/shop_top.twig:49`
- 実装実態: 採用情報バナーは PC・SP のどちらでも表示される。表示を PC に限る条件が記述にもスタイルにも無い。
- 判定根拠: 採用情報バナーは PC 版だけの表示と定められているが、実装は画面幅にかかわらず出している。src/Eccube/Resource/template/default/Block/shop_recruit.twig:11-16 は条件なしで出力し、html/template/default/assets/hareruya/css/hareruya-top.css には .p-hareruya-branch-top__recruit を狭い画面で消す指定が無く、逆に画面幅1023px以下向けに左右余白を与える指定だけがあるため、SP でも表示される。レイアウト図でも SP 版(sheet-4_img22)には採用情報バナーが無い。
- 確信度: med

### sheet-4-R259 支店ECTOP — 実装違い／ふるまい／P3

- 正本: sheet-4（支店ECTOP） HTML行 2489 付近
- 正本引用: 「6	同一商品では、条件2・4を満たすもののうち、言語とカードの状態が最も上位の1件だけを残すこと
7	同一商品・同一言語に、状態NMかつ販売価格1円以上の商品規格が、表示している支店の在庫として登録されていること（在庫数は問わない）」
- 設計期待値: 同一商品でタイルに載せる1件は、言語とカードの状態がいずれも最も上位のものにする。
- 画像確認: タイル レイアウト図(sheet-4_img13=PC/img14=SP/img15)を確認。1区画3件のカード＋『もっと見る』、最後の区画にお取り寄せサービス/高価買取はこちらのバナー。img9はカード画像のマウスオーバー時『画像を拡大』オーバーレイ。
- 実装参照: `src/Eccube/Repository/ProductRepository.php:652-673`
- 実装実態: 残す1件はカードの状態と内部の登録順だけで決まり、言語の上下は考慮されない。
- 判定根拠: 同一商品から1件を残す選び方に言語の順位が入っていない。src/Eccube/Repository/ProductRepository.php:652-673 は、タグの優先商品コード→カードの状態→内部の登録順で1件を選んでおり、言語の並び順（src/Eccube/Entity/Master/MtbLanguage.php:212-218 の並び順）を見ていない。そのため同じ商品で言語違いが複数ある場合、上位の言語ではないものが残ることがある。
- 確信度: med

### sheet-4-R263 支店ECTOP — 未実装／ふるまい／P3

- 正本: sheet-4（支店ECTOP） HTML行 2493 付近
- 正本引用: 「タイルの割り当てが無い区画は、空のままにせずタイル属性がフォーマット別特集のタイルを補って表示する。補うタイルの対象タグは表示のたびに変わる。」
- 設計期待値: タイルの割り当てが無い区画には、フォーマット別特集のタイルを補って表示し、補うタイルの対象は表示のたびに変える。
- 画像確認: タイル レイアウト図(sheet-4_img13=PC/img14=SP/img15)を確認。1区画3件のカード＋『もっと見る』、最後の区画にお取り寄せサービス/高価買取はこちらのバナー。img9はカード画像のマウスオーバー時『画像を拡大』オーバーレイ。
- 実装参照: `src/Eccube/Controller/Shop/ShopTopController.php:133-150`
- 実装実態: 割り当ての無い区画は読み飛ばされ、何も表示されない。
- 判定根拠: 割り当てが無い区画を補う処理が無い。src/Eccube/Controller/Shop/ShopTopController.php:133-150 は、ピックアップ商品でもタグ指定でもない区画を読み飛ばすだけで、フォーマット別特集のタイルを代わりに置く処理が無い。そのため割り当ての無い区画は空のまま何も出ない。
- 確信度: med

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 7 | 0 | 0 | 0 | 7 |
| sheet-2 | 目次 | 6 | 0 | 0 | 0 | 6 |
| sheet-3 | ECTOP | 558 | 7 | 26 | 2 | 523 |
| sheet-4 | 支店ECTOP | 271 | 6 | 6 | 1 | 258 |

