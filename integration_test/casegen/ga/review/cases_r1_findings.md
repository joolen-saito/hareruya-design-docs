### 指摘1（F10-02 全26件）
- 主張: 事前準備で「完全ログイン」「購入処理中の受注」「主かごの内容も同じ」とし、投入方法は「DB投入で会員・受注・かごを登録する」としている。
- 実際: DB投入だけではブラウザをログイン状態にできず、購入画面はロック済みかごを要求する。さらに対象受注は、主かごのプレオーダーIDと一致する受注だけが取得されるが、全シードでその対応付けがない（`integration_test/casegen/ga/cases/F10-02_ga_seed_data.tsv:4-29`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:62-99,210-227`、`pf-eccube3/src/Eccube/Service/ShoppingService.php:78-98`）。F04-04のシードは専用ブラウザでの完全ログインと主カート設定を明記している（`integration_test/casegen/cases/F04-04_seed_data.tsv:7`）。
- 判定: 成立しない前提・手順
- 修正案: 専用ブラウザへの完全ログイン、主カート設定、かごのロック、受注とのプレオーダーID対応付けをシードに追加する。非会員ケース014は非会員情報を専用ブラウザのセッションへ設定する。

### 指摘2（IT-F10-03-004）
- 主張: 「数量-加算ボタンを押して数量を2にする／ブラウザの再読み込み」を行い、`gtm_cart_value` が1100になると期待している。
- 実際: 数量ボタンは入力欄の値を変えるだけで保存要求を送らず、数量更新は「再計算」によるフォーム送信で初めて行われる。再読み込みすると未送信の2は破棄され、数量1のままである（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/assets/js/ec.js:288-317`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Cart/index.twig:17,42,74`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php:115-120`）。
- 判定: 成立しない前提・手順
- 修正案: 加算後に「再計算」を押して数量更新を確定してから、再表示後の1100を確認する。

### 指摘3（F10-03）
- 主張: IT-F10-03-029はECTOPを対象外画面として全連携項目0件を期待し、report.mdも「1画面に複数の商品並びを作れない」としてケースを省略している。
- 実際: 現行ソースはTOPページ（page_id=1）へ新着・値下げ・おすすめの商品ブロックを複数配置する。各ブロックは商品一覧を遅延取得し、空の商品並びでも `gtm_search_ids` を積む（`pf-eccube3/src/Eccube/Resource/doctrine/migration/Version20150613000000.php:458`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20190131015000.php:13-67,82-86,135-170`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/ec_top_product.twig:13-15`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_product_list_js.twig:1-6`）。設計書の対象画面を買い物かご・商品詳細・商品一覧だけとする記述と現行が食い違う（`functions/pf-eccube3/f10-03_front_analytics_retargeting.md:9,60,82`）。
- 判定: 設計書の誤り
- 修正案: 設計書へTOP等に埋め込まれた商品並びも対象になることを追記する。029は商品並びを持たない画面へ変更し、TOPの複数並び件数を別ケースで確認する。

### 指摘4（IT-F10-01-019）
- 主張: 未ログインで本店ECTOPを開くと「`dataLayer` が未定義」と期待している。
- 実際: F10-01が未ログイン時に領域を作らないのは当該会員IDブロックだけの挙動である（`functions/pf-eccube3/f10-01_front_analytics_customer_id.md:18-19`）。現行ECTOPには複数の商品一覧ブロックがあり、それらが `window.dataLayer = window.dataLayer || []` を実行するため、GTMを無効にしても領域は定義される（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_product_list_js.twig:1-5`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/doctrine/migration/Version20190131015000.php:82-86,135-170`）。
- 判定: 期待結果の誤り
- 修正案: ECTOPではグローバル領域の未定義を期待せず、`uid` を持つ要素が0件であることを確認する。領域未作成を確認するなら、他の生成機能を持たない専用ページを用いる。

### 指摘5（IT-F10-03-024）
- 主張: 同名の別商品P・Qが「まとめて1件で表示される」と事前準備で断定している。
- 実際: 現行検索は商品名ではなく商品ID・言語・高額商品コードでグループ化し、返された各商品を個別に描画する。同じ商品名を付けるだけではP・Qは1表示にまとまらない（`pf-eccube3/app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:186-202`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/product_list.twig:38-53`）。事前準備が未確認の画面結果を先取りしている（`integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:26`）。
- 判定: 成立しない前提・手順
- 修正案: 現行で実際に同名商品群となるカードID等の関連データまでシードし、画面で条件成立を確認してから連携値を検証する。

### 指摘6（IT-F10-03-024）
- 主張: `gtm_search_ids` にP・Qが含まれれば「並び順は問わない」としている。
- 実際: 設計書は「差し込む商品の並び順」で積むと定め、同名商品の場合も「まとめる前の商品IDを並べる」としている（`functions/pf-eccube3/f10-03_front_analytics_retargeting.md:60,64-65,75`）。順序を不問にすると、逆順でも合格してしまう。
- 判定: 期待結果の誤り
- 修正案: シードと検索条件で差し込み順を一意にし、その順の具体的なID配列を期待する。

### 指摘7（F10-03）
- 主張: report.mdは「同じ商品IDが一覧で重複して出る状態の作り方が無い」として、一覧の重複除去ケースを書いていない。
- 実際: 現行検索は商品IDに加えて言語と高額商品コードでもグループ化するため、同一商品に複数言語を持たせれば同じ商品IDが複数行になり得る。一方、連携テンプレートは商品ID単位で重複除去する（`pf-eccube3/app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/BaseQueryBuilderSubscriber.php:200-202`、`pf-eccube3/app/Plugin/HareruyaEc/Util/ProductSearch/Event/Subscriber/LanguageSubscriber.php:34-38`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_product_list_js.twig:1-5`、`integration_test/casegen/ga/gen_F10-03/report.md:38`）。
- 判定: 取りこぼし
- 修正案: 同一商品IDに日本語版・英語版を持たせ、一覧の複数行が `gtm_search_ids` では1 IDになるケースを追加する。

### 指摘8（F10-03）
- 主張: report.mdは「既存の受け渡し領域をブラウザ操作だけで作る方法が設計書に無い」として、既存値保持・末尾追加を省略している。
- 実際: レイアウトのHeadブロックはページ固有のJavaScriptブロックより先に実行されるため、F10-01-005と同じ試験用ブロックでmarkerを事前に積める（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/default_frame.twig:100-107,236`、`integration_test/casegen/ga/cases/F10-01_ga_seed_data.tsv:9`）。省略理由は成立しない（`integration_test/casegen/ga/gen_F10-03/report.md:37`）。
- 判定: 取りこぼし
- 修正案: 対象画面のHeadへmarkerを積む試験用ブロックを配置し、marker保持と対象要素の末尾追加を確認する。

### 指摘9（F10-01）
- 主張: report.mdは本人確認3ページを「到達手順と画面名が既存ケースに無い」として省略している。
- 実際: 依頼規約が除外したのは導入時配置・削除不可であり、本人確認3ページは除外していない（`integration_test/casegen/ga/GEN_GA_PROMPT.md:37-39`）。現行には3ルートがあり、開始画面、モバイルかつ本人確認種別が必要な撮影画面、フォーム送信後の完了画面という到達条件も特定できる（`pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:147-153`、`pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/IdentificationController.php:30-44,54-78,88-115`）。
- 判定: 取りこぼし
- 修正案: 専用会員・モバイルブラウザ・本人確認フォーム用画像を用意し、3ページそれぞれで `uid` が積まれるケースを追加する。

### 指摘10（F10-03）
- 主張: report.mdは「型と同じ要素内か別要素かは設計書に無い」として検証しない。
- 実際: 現行は、かごでは1オブジェクト内に数値配列と数値、詳細では1オブジェクト内に2つの数値、一覧では数値配列を積む（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/retargeting_cart_js.twig:1-7`、`retargeting_product_detail_js.twig:1-6`、`retargeting_product_list_js.twig:1-6`）。機能設計書の表にはこの型・入れ子構造が欠け、IT-0341の正解を定義できていない（`functions/pf-eccube3/f10-03_front_analytics_retargeting.md:16-22`、`integration_test/casegen/ga/gen_F10-03/report.md:40-41`）。
- 判定: 設計書の誤り
- 修正案: 設計書へ各値の型と、かご・詳細の2項目が同一オブジェクトに入る構造を追記する。その後、IT-0341ケースを具体的な型・構造で作り直す。

### 指摘11（F10-02）
- 主張: 001〜011・013〜016・021などは「文字列の値」を期待しながら、IT-0342・IT-0343・IT-0344へ割り当てている。
- 実際: 型・入れ子構造はIT-0341、業務データとの値一致はIT-0342、条件切替はIT-0343、空表現はIT-0344の判定単位である（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:342-345`、`integration_test/casegen/ga/GEN_GA_PROMPT.md:31-35,45`）。たとえば001は受注IDとの一致と文字列型を一つのIT-0342ケースで同時判定している（`integration_test/casegen/ga/cases/F10-02_ga_test_cases.tsv:2`）。
- 判定: 判定IDの誤り
- 修正案: 値一致ケースから型判定を外し、各文字列項目の型はIT-0341ケースへ分離する。空文字・0円も条件・空表現と型を別判定にする。

### 指摘12（F10-02）
- 主張: report.mdは017を「商品の値の形式・配列の構造」ケースとしているが、トップレベル構造のケースはない。
- 実際: 現行は `transactionId` から `transactionProducts` までの7項目を同一の1オブジェクトとしてpushする（`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/ecommerce_js.twig:2-11`）。017が確認するのは `transactionProducts` 配列内の1商品だけであり、各トップレベル項目が別々の要素に積まれる誤実装でも既存ケースは合格し得る（`integration_test/casegen/ga/cases/F10-02_ga_test_cases.tsv:18`）。
- 判定: 取りこぼし
- 修正案: 7項目が同じ要素にあり、`transactionProducts` のみが商品配列として入れ子になることをIT-0341で追加確認する。

### 指摘13（IT-F10-02-026）
- 主張: 売上要素がタグ管理サービスの要素より前にあることをIT-0343としている。
- 実際: IT-0343はログイン有無・対象画面・言語による「積む／積まない」の切替であり、026は条件分岐を確認していない（`integration_test/viewpoint_canonical/viewpoints_canonical.tsv:344`）。確認対象は項目・順序・構造を扱うIT-0341に近い。
- 判定: 判定IDの誤り
- 修正案: 026を順序確認のIT-0341へ移す。物理的なhead内配置を試す意図なら、dataLayer要素順ではなくページHTML上のスクリプト順を確認する。

### 指摘14（IT-F10-03-030〜032）
- 主張: 030〜032をIT-0341の項目・構造ケースとして追加している。
- 実際: 030は001と002、031は011と012、032は023と同じ項目名・値・並びを再確認しているだけで、型や同一オブジェクトへの入れ子を確認していない（`integration_test/casegen/ga/cases/F10-03_ga_test_cases.tsv:2-3,12-13,24,31-33`）。report.md自身も型・入れ子構造は確認しないと記載している（`integration_test/casegen/ga/gen_F10-03/report.md:40-41`）。
- 判定: 重複
- 修正案: 現状の030〜032は削除し、設計書へ型・構造を追記した後、その差だけを確認するIT-0341ケースへ置き換える。

### 指摘15（IT-F10-02-016・017）
- 主張: 016は配列件数と4項目の値・型を、017は配列構造・5項目名・全項目の型を一つの期待結果にしている。
- 実際: 規約は「1ケース1期待結果」で、設計書の項目表は1項目ずつケース化するよう要求している（`integration_test/casegen/ga/GEN_GA_PROMPT.md:37,43`）。両ケースは一部だけ誤ってもケース全体のどの判定が落ちたか分からない（`integration_test/casegen/ga/cases/F10-02_ga_test_cases.tsv:17-18`）。
- 判定: 期待結果の誤り
- 修正案: `sku`・`name`・`price`・`quantity` の値一致と、商品オブジェクトの構造・各型を別ケースへ分割する。

### 指摘16（IT-F10-03-005）
- 主張: 1ケースで `gtm_cart_ids` と `gtm_cart_value` の各件数を、初回表示と再読み込み後の双方について期待している。
- 実際: これは2項目×2表示時点の複数期待結果であり、「1ケース1期待結果」に反する（`integration_test/casegen/ga/GEN_GA_PROMPT.md:43`、`integration_test/casegen/ga/cases/F10-03_ga_test_cases.tsv:6`）。
- 判定: 期待結果の誤り
- 修正案: 1回のpush要素に両項目が同居する構造をまず設計書で定義し、「各表示で対象要素が1件」という単一判定にするか、項目別に分割する。

### 指摘17（IT-F10-03-013・017）
- 主張: 「商品規格にSPを指定して開く」「商品規格にPLを指定して開く」とだけ記載している。
- 実際: 現行の初期規格指定は表示名・状態コードではなく、URLの `class` に商品規格IDを渡す方式である。存在しない値なら先頭規格へフォールバックするが、両シードには商品規格IDがない（`pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php:264-267`、`pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/product_detail_js.twig:63-71`、`integration_test/casegen/ga/cases/F10-03_ga_seed_data.tsv:15,19`）。report.mdも指定方法が未確定と認めている（`integration_test/casegen/ga/gen_F10-03/report.md:47`）。
- 判定: 成立しない前提・手順
- 修正案: 商品規格IDをシードへ明記し、`lang` と `class` を含む具体URLで開く手順にする。代替として画面で規格を選択してURLを更新後、再読み込みする手順を明記する。

### 指摘18（IT-F10-01-021・022）
- 主張: 再読み込みや別画面への遷移後、`uid` が1件なので「増えない」「重ならない」としている。
- 実際: どちらも確認は最後の画面だけであり、フルリロード・画面遷移により前画面のJavaScriptコンテキストと `dataLayer` は破棄される。したがって最終画面の1件確認は020と同じで、前画面からの重複を観測していない（`integration_test/casegen/ga/cases/F10-01_ga_test_cases.tsv:21-23`）。
- 判定: 重複
- 修正案: 021・022は削除し、表示1回につき1件を確認する020へ集約する。再表示間の送信重複を確認したい場合は受信側観測が必要で、今回の対象外である。
