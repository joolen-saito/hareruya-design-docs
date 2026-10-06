### 指摘1（要求先と応答：受付方式）
- 主張: 「要求はGETだけを受け付ける。」
- 実際: 各経路はGET指定だが、使用中の経路照合処理はHEADをGETと同等に扱うため、HEADも受け付ける（ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:56、ec-cube-enterprise/vendor/symfony/routing/Matcher/UrlMatcher.php:113）。
- 判定: 事実の誤り
- 修正案: 要求はGETとHEADを受け付ける。HEADはGETと同じ経路に一致する。

### 指摘2（サイトマップ索引：公開中の商品が0件の場合）
- 主張: 「索引は、個別サイトマップへの案内を次の順に並べる。ページ、カテゴリ、商品（ページ数分）」
- 実際: 公開中の商品が0件ならページ数は0になるが、索引は商品部分を無条件に「1からページ数まで」で反復する（ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:69、ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:75、ec-cube-enterprise/src/Eccube/Resource/template/default/sitemap_index.xml.twig:11）。この範囲指定は実際には1から0への降順範囲となるため、通常環境ではページ番号1と0の案内が生成され、いずれも直接要求すると404になる（ec-cube-enterprise/vendor/twig/twig/src/Node/Expression/Binary/RangeBinary.php:22、ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:147）。
- 判定: 取りこぼし
- 修正案: 公開中の商品が0件の場合、索引には商品サイトマップのページ番号1と0が生成され、どちらも直接要求時は404になる。

### 指摘3（サイトマップ索引：在庫なし商品を隠す場合）
- 主張: 「そのため、設定が有効なときは、索引が案内する末尾のページが見つからない旨の応答（404）になることがある。」
- 実際: 索引のページ数は在庫なし商品を含めて算出する一方、個別サイトマップでは在庫なし商品を除外する（ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:73、ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:138、ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:1225）。したがって404になるのは最後の1ページだけとは限らず、在庫あり件数から算出したページ数を超える末尾側の複数ページすべてが404になり得る（ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:152）。
- 判定: 事実の誤り
- 修正案: 設定が有効な場合、索引が案内する末尾側の1ページ以上が404になることがある。

### 指摘4（商品のサイトマップ：画像URL）
- 主張: 「画像のURLは、登録値がHTTPまたはHTTPSのURLならそのまま使い、それ以外は設定で与える配信の基点に登録値を続けたものとする。」
- 実際: そのまま使うのは、小文字の `http://` または `https://` で始まる場合だけである。それ以外は登録値の先頭のスラッシュを除去し、配信の基点との間を1個のスラッシュで連結する（ec-cube-enterprise/src/Eccube/Twig/Extension/EccubeExtension.php:438）。
- 判定: 事実の誤り
- 修正案: 小文字の `http://` または `https://` で始まる登録値だけをそのまま使う。それ以外は先頭のスラッシュを除き、設定から決まる配信の基点へ連結する。

### 指摘5（入出力：デッキ一覧の最終更新日時）
- 主張: 「個別サイトマップは URL・最終更新日時・更新頻度（毎日）を載せる。」
- 実際: デッキ一覧の個別サイトマップは各URLと更新頻度だけを出力し、最終更新日時を出力しない（ec-cube-enterprise/src/Eccube/Resource/template/default/sitemap_deck.xml.twig:3）。
- 判定: 事実の誤り
- 修正案: 個別サイトマップはURLと更新頻度を載せる。デッキ一覧を除く個別サイトマップでは最終更新日時も載せる。

### 指摘6（入出力：出力URLの言語・店舗）
- 主張: 「先頭に言語区分が付き、支店の場合はさらに店舗コードが付く。」「個別サイトマップは URL・最終更新日時・更新頻度（毎日）を載せる。」
- 実際: 要求先だけでなく、XML内で生成する索引・ページ・カテゴリ・商品・デッキ等のURLにも、現在の要求の言語区分と店舗コードが引き継がれる（ec-cube-enterprise/src/Eccube/EventListener/TwigInitializeListener.php:84、ec-cube-enterprise/src/Eccube/Resource/template/default/sitemap_index.xml.twig:4、ec-cube-enterprise/src/Eccube/Resource/template/default/sitemap.xml.twig:8）。
- 判定: 取りこぼし
- 修正案: XML内の各URLには、要求時の言語区分と、支店の場合は店舗コードを引き継ぐ。

### 指摘7（入出力：応答の種類）
- 主張: 「成功時出力｜XML 形式のサイトマップ。」
- 実際: 成功時の応答には、XML本文に加えて `Content-Type: application/xml` が明示的に設定される（ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:249）。
- 判定: 取りこぼし
- 修正案: 成功時は、応答のContent-Typeを `application/xml` としてXML形式のサイトマップを返す。
