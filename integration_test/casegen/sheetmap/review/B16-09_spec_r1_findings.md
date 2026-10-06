### 指摘1（商品の並び順）
- 主張: 「商品はフロントの商品一覧と同じ条件で、新着順に取り出す」
- 実際: 商品は新着順ではなく、色順の昇順、カード英語名の昇順、商品識別番号の降順で並ぶ。色順が未設定の商品は後ろになる（src/Eccube/Repository/ProductRepository.php:1193、src/Eccube/Repository/ProductRepository.php:1200）。
- 判定: 事実の誤り
- 修正案: 商品は色順、カード英語名、商品識別番号の順で並べる。色順が未設定の商品は後ろに配置する。

### 指摘2（商品サイトマップのページ数）
- 主張: 「商品の個別サイトマップの数は、フロントの商品一覧と同じ条件で、新着順に並べた商品を1ファイルあたりの件数で割った数とする」
- 実際: 索引でページ数を計算するときは在庫なし商品を隠す処理を有効にしていないが、個別の商品サイトマップでは設定に応じて有効にする（src/Eccube/Controller/Front/SitemapController.php:71、src/Eccube/Controller/Front/SitemapController.php:75、src/Eccube/Controller/Front/SitemapController.php:138、src/Eccube/Controller/Front/SitemapController.php:145）。この処理は既定では無効である（app/config/eccube/packages/doctrine.yaml:76）。
- 判定: 事実の誤り
- 修正案: 在庫なし商品を隠す設定が有効でも、索引のページ数は在庫なし商品を含めて計算する。そのため、索引が案内する末尾のページが404になる場合がある。

### 指摘3（支店の商品掲載条件）
- 主張: 「商品はフロントの商品一覧と同じ条件で、新着順に取り出す」
- 実際: 支店のフロント商品一覧は支店で公開する商品だけに絞るが、商品サイトマップにはその条件がない（src/Eccube/Controller/Front/ProductController.php:250、src/Eccube/Controller/Front/SitemapController.php:141）。その結果、支店では商品サイトマップに掲載されても商品詳細を閲覧できない商品が生じる（src/Eccube/Controller/Front/ProductController.php:1718）。
- 判定: 事実の誤り
- 修正案: 支店の商品サイトマップは、支店での公開可否を条件にせず、公開中の商品を掲載する。支店非公開の商品を含む場合、その商品詳細は支店では閲覧できない。

### 指摘4（本店専用サイトマップへの直接アクセス）
- 主張: 「買取商品・デッキ一覧・デッキ詳細の案内は、本店のときだけ載せる」
- 実際: 索引から案内を除くだけでなく、支店から買取商品、デッキ一覧、デッキ詳細の各サイトマップへ直接アクセスした場合も404になる（src/Eccube/Controller/Front/SitemapController.php:196、src/Eccube/Controller/Front/SitemapController.php:216、src/Eccube/Controller/Front/SitemapController.php:227、src/Eccube/EventListener/BranchShopNotFoundListener.php:70）。
- 判定: 取りこぼし
- 修正案: 買取商品、デッキ一覧、デッキ詳細のサイトマップは本店専用であり、支店から直接要求された場合は404を返す。

### 指摘5（索引の最終更新日時）
- 主張: 「ページの最終更新日時は……。カテゴリの最終更新日時は……、商品の最終更新日時は……」
- 実際: 索引では買取商品、デッキ一覧、デッキ詳細にも最終更新日時を出力する（src/Eccube/Resource/template/default/sitemap_index.xml.twig:21、src/Eccube/Resource/template/default/sitemap_index.xml.twig:28、src/Eccube/Resource/template/default/sitemap_index.xml.twig:35）。買取商品とデッキ詳細はそれぞれ掲載条件を満たす最新の対象、デッキ一覧は公開・種別・削除状態を問わない全デッキ中の最新デッキを基準にする（src/Eccube/Controller/Front/SitemapController.php:84、src/Eccube/Controller/Front/SitemapController.php:92、src/Eccube/Controller/Front/SitemapController.php:94）。
- 判定: 取りこぼし
- 修正案: 索引に載せる買取商品、デッキ一覧、デッキ詳細の最終更新日時の決め方も記載する。特にデッキ一覧は、掲載可能なデッキではなく全デッキ中の最新日時を使用する。

### 指摘6（ページ番号0）
- 主張: 「個別サイトマップのページ番号（商品・買取商品・デッキ詳細のみ）」／「要求されたページ番号に該当するものが0件のとき、見つからない旨の応答（404）を返す」
- 実際: 経路は数字の0も受け付けるが、商品・買取商品・デッキ詳細のいずれもページ番号0を1に置き換えるため、先頭ページに対象があれば404ではなく先頭ページを返す（src/Eccube/Controller/Front/SitemapController.php:134、src/Eccube/Controller/Front/SitemapController.php:147、src/Eccube/Controller/Front/SitemapController.php:202、src/Eccube/Controller/Front/SitemapController.php:233）。
- 判定: 取りこぼし
- 修正案: ページ番号0は先頭ページとして扱う。数字以外のページ番号は経路に一致せず、対象がない正のページ番号は404になる。

### 指摘7（アクセス経路）
- 主張: 「入力｜個別サイトマップのページ番号（商品・買取商品・デッキ詳細のみ）。バッチの実行引数は無い」
- 実際: 本機能にはGET専用の7経路があり、索引、ページ、カテゴリ、商品、買取商品、デッキ一覧、デッキ詳細でそれぞれファイル名が異なる（src/Eccube/Controller/Front/SitemapController.php:56、src/Eccube/Controller/Front/SitemapController.php:121、src/Eccube/Controller/Front/SitemapController.php:134、src/Eccube/Controller/Front/SitemapController.php:164、src/Eccube/Controller/Front/SitemapController.php:196、src/Eccube/Controller/Front/SitemapController.php:216、src/Eccube/Controller/Front/SitemapController.php:227）。各経路の先頭には言語区分と、支店の場合は店舗コードが付く（app/config/eccube/routes.yaml:35、app/config/eccube/routes.yaml:42）。
- 判定: 取りこぼし
- 修正案: 入力として、設定で与える言語区分、支店の場合の店舗コード、要求するサイトマップの種類、対象となる種類ではページ番号を記載する。要求方法はGETに限る。

### 指摘8（商品画像URLの組み立て）
- 主張: 「商品に登録された画像があれば、そのすべての画像のURLを添える」
- 実際: 登録値がHTTPまたはHTTPSのURLならそのまま出力し、それ以外は設定された配信基点を付ける。配信基点が設定されていない場合は、設定された保管先の接続先と格納先を使う（src/Eccube/Resource/template/default/sitemap.xml.twig:41、src/Eccube/Twig/Extension/EccubeExtension.php:440、src/Eccube/Twig/Extension/EccubeExtension.php:445、src/Eccube/Twig/Extension/EccubeExtension.php:450）。
- 判定: 取りこぼし
- 修正案: 商品画像URLの基点は設定で与える。登録値がHTTPまたはHTTPSのURLである場合は、基点を付けずそのまま使用する。
