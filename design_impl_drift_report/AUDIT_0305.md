# 実装乖離監査 — 0305_基本設計仕様書(フロント_ネット買取).html

- 正本: `excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html`（HTML設計書。**これだけを正とする**）
- 実装: `ec-cube-enterprise` HEAD `6c15d1df10`
- 母数: 正本HTMLから機械抽出した **956要求**（既存の指摘一覧は参照していない）
- 規約: 正本HTMLに逐語で存在する記述だけを根拠に採る。HTMLに書かれていないことは指摘にできない（harness が引用の実在を機械照合し、不一致・判定漏れがあれば build を落とす）
- 本書には**指摘だけ**を載せる。設計どおり(MATCHED)・対象外(OUT_OF_SCOPE)・静的解析では確定不能(UNVERIFIABLE)は利用者指示により掲載しない
- 指摘ポリシー（harness が機械で強制）: ①★書きの識別IDずれは対象外に自動で落とす ②設計期待値を実装手段の語で書いた指摘は build を落とす ③実装違いは I/O とふるまいに限り、どちらかの明示を必須にする ④同じ実装欠陥から出た指摘は根本原因キーで1件に畳む（折り畳んだ要求IDは代表に併記する） ⑤実装実態が空欄の指摘は載せない ⑥区分が「表示メッセージ」の指摘は載せない

## 母数の内訳

| 判定 | 意味 | 件数 | 掲載 |
| --- | --- | ---: | :---: |
| 未実装 | 設計の要求に対応する実装が無い | 4 | ○ |
| 実装違い | 実装はあるが設計と違う | 37 | ○ |
| 設計裁定待ち | 正本内部で記述が矛盾し設計裁定待ち | 6 | — |
| 設計どおり | 設計どおり実装されている | 635 | — |
| 対象外 | 見出し・表示メッセージ節など実装対象の記述でない | 265 | — |
| 確定不能 | 実データ・実行時挙動に依存し静的解析では確定できない | 9 | — |
| **合計** | | **956** | |

## 不具合 15件（P1 0 / P2 4 / P3 11）

- **P1**: 業務が回らず商売が止まる、またはデータの整合性が壊れる。手作業でも代替できない
- **P2**: 迂回すれば回る。手作業・再実行・別経路で業務は完了できるが、コア業務の正しさ・効率、または顧客体験を損なう
- **P3**: 業務は回る。業務の完了・データ・判断に影響しない（見出し・ボタン文言・列名の相違／並び順・桁区切りの相違など）

実装実態が同一の指摘 18件は重複として代表へ折り畳んだ（判定そのものは 33件。折り畳んだ要求IDは各指摘の「同じ実装実態でまとまる要求」に全件を書く）。

| 要求ID | 機能 | 区分 | 種別 | 重要度 | 内容 |
| --- | --- | --- | --- | --- | --- |
| sheet-3-R005 | ネット買取トップページ | 実装違い | IO | P2 | 買取トップの当該コーナーには「強化買取」のタグが付いた商品が並ぶこと。 |
| sheet-5-R032 | ネット買取商品一覧 | 実装違い | IO | P2 | パンくずリストにカテゴリを階層のまま並べ、上位カテゴリから順にたどれるようにする |
| sheet-5-R150 | ネット買取商品一覧 | 実装違い | ふるまい | P2 | 検索結果の総件数が上限（9999件）を超えるときは、商品を一覧に出さずに上限超過の案内だけを表示する |
| sheet-5-R155 | ネット買取商品一覧 | 実装違い | ふるまい | P2 | 買取商品一覧の1ページあたりの表示件数は、指定が無いときは60件とする |
| sheet-3-R143 | ネット買取トップページ | 実装違い | ふるまい | P3 | 目玉買取商品のカードでは、カード商品のときだけ言語ラベルを出し、カード以外の商品には出さないこと。 |
| sheet-4-R014 | ネット買取商品検索 | 実装違い | IO | P3 | タグ・カテゴリを指定した買取商品検索の結果URLは、パス部分にタグ名・カテゴリ名が現れる。 |
| sheet-4-R058 | ネット買取商品検索 | 実装違い | ふるまい | P3 | 表示件数の指定が無いとき、買取商品検索の結果一覧は1ページに60件表示する。 |
| sheet-5-R092 | ネット買取商品一覧 | 実装違い | ふるまい | P3 | 商品数が1のときにマイナスを押すと、商品数が20になる |
| sheet-5-R153 | ネット買取商品一覧 | 未実装 | IO | P3 | タグを1件だけ指定して買取商品一覧を開いたとき、そのタグに登録された説明文を一覧の上部に表示する |
| sheet-6-R015 | ネット買取商品詳細 | 実装違い | IO | P3 | 買取商品詳細のパンくずは、ホームアイコンに続けてその商品のカテゴリだけを並べ、末尾もカテゴリで終わる。 |
| sheet-6-R043 | ネット買取商品詳細 | 実装違い | IO | P3 | 言語切替はカード商品のときだけ画面に出す。 |
| sheet-6-R118 | ネット買取商品詳細 | 未実装 | ふるまい | P3 | 旧商品コードで来訪したときは、対応する新しい商品の買取商品詳細を表示する。対応が無いとき、または商品を取得できないときはトップページへ戻す。 |
| sheet-8-R012 | ネット買取買取手続き～完了 | 実装違い | IO | P3 | 適格請求書発行事業者の確認で「はい」を選んだときだけ登録番号の入力欄が現れ、「いいえ」のときは現れない。 |
| sheet-8-R016 | ネット買取買取手続き～完了 | 実装違い | ふるまい | P3 | 規約同意にチェックが無いまま申込みを行うと、画面はそのままでエラーメッセージが出る。 |
| sheet-8-R060 | ネット買取買取手続き～完了 | 実装違い | IO | P3 | ネット買取利用規約の欄には、サイト全体で共通の利用規約の内容が表示される。 |

### sheet-3-R005 ネット買取トップページ — 実装違い／IO／P2

- 正本: sheet-3（ネット買取トップページ） HTML行 1065 付近
- 正本引用: 「・強化買取のタグが付いた商品を表示する」
- 設計期待値: 買取トップの当該コーナーには「強化買取」のタグが付いた商品が並ぶこと。
- 画像確認: img4/img5（買取新着商品レイアウト図）に並ぶ商品カードのコーナーが該当。図では商品の絞り込みタグまでは読み取れない。
- 実装参照: `src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3; src/Eccube/Resource/template/default/Block/purchase_new_product_list_unisearch.twig:71`
- 実装実態: 当該コーナーは「新商品」タグ（Tag::NEW_ITEMS_ID=1）で商品を取得して表示しており、「強化買取」タグの語はee全体に存在しない。
- 同じ実装実態でまとまる要求: sheet-3-R050（ネット買取トップページ）、sheet-3-R052（ネット買取トップページ / 実装参照 `src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3`）、sheet-3-R053（ネット買取トップページ / 実装参照 `src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3`）
- 判定根拠: コーナー本体は src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3 で新着タグを指定。もっと見る先も src/Eccube/Resource/template/default/Block/purchase_new_product_list_unisearch.twig:71 で同じ新着タグ。ee全文検索で「強化買取」の文字列は0件、src/Eccube/Entity/Tag.php:55-71 のタグ定数にも該当が無い。
- 確信度: med

### sheet-5-R032 ネット買取商品一覧 — 実装違い／IO／P2

- 正本: sheet-5（ネット買取商品一覧） HTML行 1518 付近
- 正本引用: 「・カテゴリは階層を表示する」
- 設計期待値: パンくずリストにカテゴリを階層のまま並べ、上位カテゴリから順にたどれるようにする
- 画像確認: 画像1(PC)のパンくずは 🏠 > 商品詳細検索 > 最新セット > タルキール：龍嵐録 > 「タルキール：龍嵐録・Normal・神話レア…」で、カテゴリ階層が個別のリンクとして並んでいる
- 実装参照: `src/Eccube/Resource/template/default/breadcrumb_nav.twig:173-174; src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:35-49; src/Eccube/Service/ProductList/ProductListDetailedSearchBreadcrumbBuilder.php:84-88`
- 実装実態: 詳細検索条件が1つでも付いていると、パンくずは ホーム > 詳細検索 > 「カテゴリ名・条件…」の3段で固定され、カテゴリの親階層は個別のリンクとして出ない（カテゴリ名は他の条件と同じ1つの区切りに混ぜて並ぶ）。カテゴリだけを選んだとき・タグだけのときも同じ経路を通るため、商品名の検索でなくても「詳細検索」が入り、タグだけのときは「商品詳細検索」の1段だけになる。カテゴリ階層をリンクで並べる分岐は src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:45-48 にあるが到達しない
- 同じ実装実態でまとまる要求: sheet-5-R016（ネット買取商品一覧）、sheet-5-R022（ネット買取商品一覧）、sheet-5-R025（ネット買取商品一覧）、sheet-5-R033（ネット買取商品一覧）、sheet-5-R017（ネット買取商品一覧）
- 判定根拠: 項目表のパンくずリストも同じ実装を使うため、カテゴリ階層の段が出ない（src/Eccube/Resource/template/default/Block/_product_list_breadcrumb_items.twig:35-42）
- 確信度: med

### sheet-5-R150 ネット買取商品一覧 — 実装違い／ふるまい／P2

- 正本: sheet-5（ネット買取商品一覧） HTML行 1649 付近
- 正本引用: 「超えるときは商品を取得せず、上限超過の案内を表示し」
- 設計期待値: 検索結果の総件数が上限（9999件）を超えるときは、商品を一覧に出さずに上限超過の案内だけを表示する
- 画像確認: 画像1の商品数は733点で上限超過の状態は図に無い
- 実装参照: `src/Eccube/Service/UniSearch/UniSearchService.php:60; html/template/default/assets/hareruya/js/hareruya-unisearch-list-client-core.js:338-341; html/template/default/assets/hareruya/js/hareruya-unisearch-list-client-core.js:683-706`
- 実装実態: 上限は4000件（UniSearchService::MAX_ROWS_SIZE）で、9999件ではない。上限を超えても商品は取得・表示され、上限超過の案内は「総件数が上限超」かつ「表示中ページが上限で頭打ちになった最終ページ」のときだけ出る（html/template/default/assets/hareruya/js/hareruya-unisearch-list-client-core.js:339）
- 判定根拠: 上限は9999ではなく4000（src/Eccube/Service/UniSearch/UniSearchService.php:60）。上限を超えても商品は取得して並べ、案内は上限で頭打ちになった最終ページを開いたときにしか出ない（html/template/default/assets/hareruya/js/hareruya-unisearch-list-client-core.js:338-341）
- 確信度: med

### sheet-5-R155 ネット買取商品一覧 — 実装違い／ふるまい／P2

- 正本: sheet-5（ネット買取商品一覧） HTML行 1654 付近
- 正本引用: 「1ページの件数は既定60件で、指定によって変更できる。」
- 設計期待値: 買取商品一覧の1ページあたりの表示件数は、指定が無いときは60件とする
- 実装参照: `src/Eccube/Controller/Front/Purchase/PurchaseController.php:711-722; src/Eccube/Resource/template/default/Purchase/search.twig:42`
- 実装実態: 指定が無いときの1ページ件数が20件になる。既定値を表示件数マスタの並び順の先頭から採っており、その先頭は20件である（src/Eccube/Resource/doctrine/import_csv/ja/mtb_product_list_max.csv:2）。販売の商品一覧は60件を先に探してから並び順の先頭に落とす（src/Eccube/Controller/Front/ProductController.php:2223-2226）
- 判定根拠: 買取側は 60件を探す処理が無く、いきなり表示件数マスタの並び順の先頭（20件）を既定にしている（src/Eccube/Controller/Front/Purchase/PurchaseController.php:711-717）。指定があれば変更できる点（src/Eccube/Controller/Front/Purchase/PurchaseController.php:719-722）は設計どおり
- 確信度: med

### sheet-3-R143 ネット買取トップページ — 実装違い／ふるまい／P3

- 正本: sheet-3（ネット買取トップページ） HTML行 1221 付近
- 正本引用: 「・カード商品のみ表示する」
- 設計期待値: 目玉買取商品のカードでは、カード商品のときだけ言語ラベルを出し、カード以外の商品には出さないこと。
- 画像確認: img1/img7 では、カード以外の商品（まとめて買取）に言語ラベルが描かれておらず、カード商品のみという記述と一致する。
- 実装参照: `src/Eccube/Resource/template/default/Block/purchase_feature_product_list_unisearch.twig:6-11; src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:18-20`
- 実装実態: 言語ラベルの表示条件は言語コードが空でないことだけで、カード商品かどうかを見ていない（src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:18）。カード以外の商品でも言語が入っていればラベルが出る。
- 判定根拠: 買取新着商品（src/Eccube/Resource/template/default/Block/purchase_new_product_list_unisearch.twig:25）と買取特集コーナー（src/Eccube/Resource/template/default/Block/purchase_product_list_unisearch.twig:24）は同じ項目をカード商品のときだけ出す条件で実装しているのに対し、目玉買取商品が使う src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:18 だけ条件が異なる。
- 確信度: med

### sheet-4-R014 ネット買取商品検索 — 実装違い／IO／P3

- 正本: sheet-4（ネット買取商品検索） HTML行 1382 付近
- 正本引用: 「(例) 　タグが「最新入荷アイテム(New Items)」、カテゴリが「シングルカード(Single Cards)」である商品の場合、下記のようなURLとする」
- 設計期待値: タグ・カテゴリを指定した買取商品検索の結果URLは、パス部分にタグ名・カテゴリ名が現れる。
- 実装参照: `src/Eccube/Controller/Front/Purchase/PurchaseController.php:397-401;src/Eccube/Resource/template/default/Block/js/product_list_search_path_form_submit_js.twig:64-73`
- 実装実態: パスに入るのは名称ではなく数値ID（/purchase/search/cate/123/tag/45）で、タグ名・カテゴリ名はURLに現れない。
- 同じ実装実態でまとまる要求: sheet-4-R015（ネット買取商品検索）、sheet-4-R016（ネット買取商品検索）、sheet-4-R017（ネット買取商品検索）
- 判定根拠: パスの受け口は数値のみを受け付ける（src/Eccube/Controller/Front/Purchase/PurchaseController.php:397-401 の categoryId・tagId）。検索実行側もカテゴリID・タグIDを連結してパスを作る（src/Eccube/Resource/template/default/Block/js/product_list_search_path_form_submit_js.twig:64-73）。名称でパスを作る箇所は ee 内に見当たらない。
- 確信度: med

### sheet-4-R058 ネット買取商品検索 — 実装違い／ふるまい／P3

- 正本: sheet-4（ネット買取商品検索） HTML行 1431 付近
- 正本引用: 「1ページの表示件数は、指定がないときは60件とする。表示するページは、指定がないときは1ページ目とする。」
- 設計期待値: 表示件数の指定が無いとき、買取商品検索の結果一覧は1ページに60件表示する。
- 実装参照: `src/Eccube/Controller/Front/Purchase/PurchaseController.php:710-717;src/Eccube/Resource/doctrine/import_csv/ja/mtb_product_list_max.csv:2`
- 実装実態: 表示件数の指定が無いときは表示件数マスタの並び順が最も早い行（20件）が使われ、1ページ20件になる。ページ番号の既定が1ページ目である点は設計どおり。
- 判定根拠: 件数未指定時の1ページ件数は src/Eccube/Controller/Front/Purchase/PurchaseController.php:710-717 で表示件数マスタの先頭行の値になり、そのマスタは20/40/60で先頭が20（src/Eccube/Resource/doctrine/import_csv/ja/mtb_product_list_max.csv:2）。60を既定にする箇所は買取検索側に無い（買取トップのブロックだけが60を使う src/Eccube/Service/UniSearch/UniSearchService.php:55）。ページ番号は指定が無ければ1（src/Eccube/Controller/Front/Purchase/PurchaseController.php:726-729）。
- 確信度: med

### sheet-5-R092 ネット買取商品一覧 — 実装違い／ふるまい／P3

- 正本: sheet-5（ネット買取商品一覧） HTML行 1585 付近
- 正本引用: 「・商品数が1の場合に押下すると、商品数を20にする」
- 設計期待値: 商品数が1のときにマイナスを押すと、商品数が20になる
- 画像確認: 画像1・画像3の商品数欄は「− 1 ＋」で、初期値1のときのマイナスの見た目は図から読み取れない
- 実装参照: `src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:17-29; src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:49-51`
- 実装実態: マイナスは1で止まり、20には戻らない。さらに商品数が1のときマイナスは押せない状態で描画される（src/Eccube/Resource/template/default/Block/_purchase_product_card_common.twig:49 の初期状態、src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:23,28）
- 判定根拠: マイナスの処理は v>1 のときだけ1減らし、押下後は v<=1 でボタンを押せなくする（src/Eccube/Resource/template/default/Block/js/Purchase/purchase_js.twig:23,28）。1のときに20へ回り込む処理は無い
- 確信度: med

### sheet-5-R153 ネット買取商品一覧 — 未実装／IO／P3

- 正本: sheet-5（ネット買取商品一覧） HTML行 1652 付近
- 正本引用: 「タグが1件だけ指定されているときは、そのタグに登録された説明文を一覧の上部に表示する。」
- 設計期待値: タグを1件だけ指定して買取商品一覧を開いたとき、そのタグに登録された説明文を一覧の上部に表示する
- 実装参照: `src/Eccube/Resource/template/default/Purchase/search.twig:78-124; src/Eccube/Controller/Front/Purchase/PurchaseController.php:399-470`
- 実装実態: 買取商品一覧のどこにもタグの説明文を出す描画が無い。タグは検索条件として渡されるだけで（src/Eccube/Controller/Front/Purchase/PurchaseController.php:410-412）、説明文を取り出して画面へ渡す処理も無い
- 判定根拠: 一覧の上部（パンくず・関連ワード・絞り込み・件数の各枠 src/Eccube/Resource/template/default/Purchase/search.twig:84-124）にタグ説明文の描画箇所が無く、src/Eccube/Controller/Front/Purchase/PurchaseController.php:448-470 で画面へ渡す値にもタグ説明文が含まれない
- 確信度: med

### sheet-6-R015 ネット買取商品詳細 — 実装違い／IO／P3

- 正本: sheet-6（ネット買取商品詳細） HTML行 1744 付近
- 正本引用: 「★下記のような表示形式とする {ホームアイコン} > {カテゴリ}」
- 設計期待値: 買取商品詳細のパンくずは、ホームアイコンに続けてその商品のカテゴリだけを並べ、末尾もカテゴリで終わる。
- 画像確認: sheet-6_img2.png(パンくず拡大:🏠>エルドレインの森>アンコモン。末尾はカテゴリで商品名は出ていない)とsheet-6_img1.png(🏠>タルキール：龍嵐録)を確認した。
- 実装参照: `src/Eccube/Resource/template/default/breadcrumb_nav.twig:210-235;src/Eccube/Resource/template/default/Purchase/detail.twig:49-51`
- 実装実態: 買取商品詳細のパンくずは、カテゴリの並びの後ろにさらに商品名を現在地として足すため、末尾が「カテゴリ」ではなく商品名になる。またカテゴリは商品が持つカテゴリのうち1系統ぶんしか出さない。
- 判定根拠: パンくずの組み立ては src/Eccube/Resource/template/default/breadcrumb_nav.twig:210-235 で、purchase_detail のときも product_detail と同じ枝を通り、カテゴリの階層をリンクで並べたあと src/Eccube/Resource/template/default/breadcrumb_nav.twig:232 で商品名を現在地として出力している。買取商品詳細はこのパンくずをそのまま埋め込んでいる（src/Eccube/Resource/template/default/Purchase/detail.twig:49-51）。設計の表示形式と2枚のレイアウト図はいずれもカテゴリで終わっており、商品名の要素が無い。
- 確信度: med

### sheet-6-R043 ネット買取商品詳細 — 実装違い／IO／P3

- 正本: sheet-6（ネット買取商品詳細） HTML行 1776 付近
- 正本引用: 「1.0 言語切替 リンク - - - ・カード商品のみ表示する」
- 設計期待値: 言語切替はカード商品のときだけ画面に出す。
- 画像確認: sheet-6_img1.png(PC全体:パンくず🏠>タルキール：龍嵐録／左カテゴリ一覧／カード画像／JP・EN切替／状態・価格・数量表／カートに追加／査定例はこちら／他のバージョン／SNSでシェアするX・LINE)とsheet-6_img5.png(PC拡大)、sheet-6_img3.png(SP)を確認した。
- 実装参照: `src/Eccube/Resource/template/default/Purchase/detail.twig:54-67;src/Eccube/Resource/template/default/Product/detail.twig:151`
- 実装実態: 買取商品詳細のテンプレートには、カード以外の商品（サプライ・グッズ）で言語切替タブと状態列を隠す条件が無い。言語切替タブは src/Eccube/Resource/template/default/Purchase/detail.twig:54-67 で商品クラスに言語があれば出し、状態列は src/Eccube/Resource/template/default/Purchase/detail.twig:137-139,149-168 で常に出す。商品クラスの言語は登録時の必須項目（src/Eccube/Form/Type/Admin/ProductClassType.php:166-170）なのでサプライ・グッズでも言語が付き、両方ともカード以外の商品で表示される。販売側の同じ画面は src/Eccube/Resource/template/default/Product/detail.twig:151 と src/Eccube/Resource/template/default/Product/detail.twig:258 でカードのときだけ出しており、買取側だけこの条件が欠けている。
- 同じ実装実態でまとまる要求: sheet-6-R031（ネット買取商品詳細 / 実装参照 `src/Eccube/Resource/template/default/Purchase/detail.twig:54-67;src/Eccube/Resource/template/default/Purchase/detail.twig:137-139;src/Eccube/Resource/template/default/Purchase/detail.twig:149-168;src/Eccube/Resource/template/default/Product/detail.twig:151;src/Eccube/Resource/template/default/Product/detail.twig:258`）、sheet-6-R032（ネット買取商品詳細 / 実装参照 `src/Eccube/Resource/template/default/Purchase/detail.twig:54-67;src/Eccube/Resource/template/default/Product/detail.twig:151;src/Eccube/Form/Type/Admin/ProductClassType.php:166-170`）、sheet-6-R033（ネット買取商品詳細 / 実装参照 `src/Eccube/Resource/template/default/Purchase/detail.twig:137-139;src/Eccube/Resource/template/default/Purchase/detail.twig:149-168;src/Eccube/Resource/template/default/Product/detail.twig:258`）
- 判定根拠: 言語切替タブ（src/Eccube/Resource/template/default/Purchase/detail.twig:54-67）はカードかどうかを見ておらず、言語を持つ商品クラスがあれば出る。販売側の同等箇所 src/Eccube/Resource/template/default/Product/detail.twig:151 はカードのときだけ出している。
- 確信度: med

### sheet-6-R118 ネット買取商品詳細 — 未実装／ふるまい／P3

- 正本: sheet-6（ネット買取商品詳細） HTML行 1862 付近
- 正本引用: 「旧商品コードから新商品コードへの対応を取得する。対応が無いときはトップページへ戻す。新商品コードで商品を取得できないときもトップページへ戻す。取得できたときは、その商品の買取商品詳細（商品ID・言語付き）へ遷移する。」
- 設計期待値: 旧商品コードで来訪したときは、対応する新しい商品の買取商品詳細を表示する。対応が無いとき、または商品を取得できないときはトップページへ戻す。
- 画像確認: sheet-6の画像10枚(img1〜img10)を通読したが、この行に対応する記述は画像に無い。
- 実装参照: `src/Eccube/Controller/Front/Purchase/PurchaseController.php:958-1046;src/Eccube/Entity/Master/MtbProductCodeMapping.php:36-37;src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30`
- 実装実態: 旧商品コードから買取商品詳細へ転送する入口が ee に無い。買取の入口は src/Eccube/Controller/Front/Purchase/PurchaseController.php:958-962 の商品ID指定だけで、旧商品コードと新商品コードの対応表（src/Eccube/Entity/Master/MtbProductCodeMapping.php:36-37）を読む処理はどこにも無く（src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30 は参照元なし）、旧コードでの来訪をトップページへ戻す処理も無い。
- 同じ実装実態でまとまる要求: sheet-6-R121（ネット買取商品詳細 / 実装参照 `src/Eccube/Controller/Front/Purchase/PurchaseController.php:958-1046;src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30`）、sheet-6-R124（ネット買取商品詳細 / 実装参照 `src/Eccube/Controller/Front/Purchase/PurchaseController.php:960-964;src/Eccube/Controller/Front/Purchase/PurchaseController.php:958-1046;src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30`）
- 判定根拠: 買取商品詳細の入口は商品ID指定の1つだけ（src/Eccube/Controller/Front/Purchase/PurchaseController.php:958-962）で、旧商品コードを受ける入口が無い。旧・新商品コードの対応表（src/Eccube/Entity/Master/MtbProductCodeMapping.php:36-37）を読む処理は ee 全体に無く、対応表の取り出し口（src/Eccube/Repository/Master/MtbProductCodeMappingRepository.php:25-30）もどこからも使われていない。転送も、対応が無いときにトップページへ戻す処理も存在しない。
- 確信度: high

### sheet-8-R012 ネット買取買取手続き～完了 — 実装違い／IO／P3

- 正本: sheet-8（ネット買取買取手続き～完了） HTML行 2081 付近
- 正本引用: 「・適格請求書発行事業者選択で「はい」を選択した場合は、登録番号の入力フォームを表示する」
- 設計期待値: 適格請求書発行事業者の確認で「はい」を選んだときだけ登録番号の入力欄が現れ、「いいえ」のときは現れない。
- 画像確認: img2: お振込み口座情報・箱数・買取金額の承諾方法・適格請求書発行事業者登録の確認の各入力欄を確認。 図は「はい」を選択した状態で登録番号欄が出ている図であり、「いいえ」時の図は無い。
- 実装参照: `src/Eccube/Resource/template/default/Purchase/fill.twig:368-377`
- 実装実態: 登録番号の入力欄は「はい」「いいえ」のどちらを選んでいても常に表示される。選択に応じて表示を切り替える処理が画面側に無い。
- 判定根拠: fill.twig:368-377 の登録番号入力欄は条件分岐の外にあり、fill.twig:355-366 のラジオ選択と連動していない。html/template/default/assets/hareruya/js/hareruya-checkout.js にも表示切替は無く、CSS でも既定非表示にしていない（.p-hareruya-purchase-confirm__invoice-code-wrap は margin-top のみ）。
- 確信度: med

### sheet-8-R016 ネット買取買取手続き～完了 — 実装違い／ふるまい／P3

- 正本: sheet-8（ネット買取買取手続き～完了） HTML行 2085 付近
- 正本引用: 「・「ネット買取規約同意」チェックボックスにチェックがない場合は画面遷移せずにエラーメッセージを表示する」
- 設計期待値: 規約同意にチェックが無いまま申込みを行うと、画面はそのままでエラーメッセージが出る。
- 画像確認: img3: 確認事項（ネット買取利用規約のテキストエリア、同意チェックボックス、戻る／申込みボタン）を確認。 図では同意チェックボックスが未チェックでも申込みボタンが活性色で描かれており、押下時にエラーを出す想定と読める。
- 実装参照: `src/Eccube/Resource/template/default/Purchase/fill.twig:403-413`
- 実装実態: 規約同意にチェックが入るまで申込みボタンが押せない状態（disabled）になるだけで、押しても何も起きず、エラーメッセージは表示されない。
- 判定根拠: fill.twig:413 の申込みボタンは初期状態で disabled、fill.twig:404 のチェックボックスと連動して有効化されるのみ。未チェックのまま送信する経路が無いため、エラーメッセージの表示にも到達しない。
- 確信度: med

### sheet-8-R060 ネット買取買取手続き～完了 — 実装違い／IO／P3

- 正本: sheet-8（ネット買取買取手続き～完了） HTML行 2130 付近
- 正本引用: 「・共通の利用規約を表示」
- 設計期待値: ネット買取利用規約の欄には、サイト全体で共通の利用規約の内容が表示される。
- 画像確認: img3: 確認事項（ネット買取利用規約のテキストエリア、同意チェックボックス、戻る／申込みボタン）を確認。
- 実装参照: `src/Eccube/Resource/template/default/Purchase/include/net_purchase_terms_text.twig:1-52;src/Eccube/Resource/template/default/Purchase/fill.twig:420-434`
- 実装実態: 表示されるのは買取専用に用意された規約文だけで、サイト共通の利用規約とは別本文のまま。
- 同じ実装実態でまとまる要求: sheet-8-R004（ネット買取買取手続き～完了）、sheet-8-R009（ネット買取買取手続き～完了）
- 判定根拠: sheet-8-R004 と同一の実装欠陥。項目23.0の備考が求める共通規約への一本化が行われていない。
- 確信度: med

## 掲載しなかった判定

- 実装実態が空欄の判定 4件（正本内部の記述が食い違い、実装と突き合わせる前に設計裁定が要るもの）
- 区分が「表示メッセージ」の指摘 9件

いずれも利用者指示により本書に載せない。判定そのものは `design_audit/0305/verdicts.tsv` に残している。

## シート別の網羅状況

判定の件数で数える。実装実態が同一で折り畳んだ指摘も、折り畳み前の判定として数えている（掲載件数は「不具合」の節を見ること）。

| シート | 機能 | 要求 | 未実装 | 実装違い | 裁定待ち | 掲載外 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| sheet-1 | 表紙 | 6 | 0 | 0 | 0 | 6 |
| sheet-2 | 目次 | 16 | 0 | 0 | 0 | 16 |
| sheet-3 | ネット買取トップページ | 171 | 0 | 5 | 1 | 165 |
| sheet-4 | ネット買取商品検索 | 63 | 0 | 5 | 0 | 58 |
| sheet-5 | ネット買取商品一覧 | 166 | 1 | 12 | 3 | 150 |
| sheet-6 | ネット買取商品詳細 | 127 | 3 | 5 | 0 | 119 |
| sheet-7 | ネット買取カート | 69 | 0 | 5 | 0 | 64 |
| sheet-8 | ネット買取買取手続き～完了 | 105 | 0 | 5 | 0 | 100 |
| sheet-9 | 買取依頼完了 | 10 | 0 | 0 | 0 | 10 |
| sheet-10 | 買取履歴一覧 | 73 | 0 | 0 | 1 | 72 |
| sheet-11 | 買取履歴詳細 | 115 | 0 | 0 | 1 | 114 |
| sheet-12 | まとめて買取査定結果 | 18 | 0 | 0 | 0 | 18 |
| sheet-13 | 別添_買取ステータスと処理状態の紐付け | 17 | 0 | 0 | 0 | 17 |

