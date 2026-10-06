# バッチ インフラ — サイトマップ生成処理

## 業務ロジック

### 要求先と応答

サイトマップは、アクセスのたびに最新の内容からその場で組み立てて XML で返す。要求はGETとHEADを受け付ける。HEADはGETと同じ要求先に一致する。要求先は次の7つで、先頭に言語区分が付き、支店の場合はさらに店舗コードが付く。言語区分は設定で与える。XML の中に出力する各URLにも、要求時の言語区分と、支店の場合は店舗コードを引き継ぐ。

| 種類 | ファイル名 |
| --- | --- |
| 索引 | sitemap.xml |
| ページ | sitemap_page.xml |
| カテゴリ | sitemap_category.xml |
| 商品 | sitemap_product_ページ番号.xml |
| 買取商品 | sitemap_purchase_ページ番号.xml |
| デッキ一覧 | sitemap_deck.xml |
| デッキ詳細 | sitemap_deck_show_ページ番号.xml |

ページ番号は数字だけを受け付ける。数字以外のときは要求先に一致しない。商品・買取商品・デッキ詳細でページ番号に0を指定したときは1として扱う。

個別サイトマップは、掲載する各URLの更新頻度を毎日とする。

### サイトマップ索引

索引は、個別サイトマップへの案内を次の順に並べる。ページ、カテゴリ、商品（ページ数分）、買取商品（ページ数分）、デッキ一覧、デッキ詳細（ページ数分）。

ページの最終更新日時は、検索エンジンに載せてよいページのうち、更新日時が最も新しいものとする。載せてよいページとは、検索避け指定に「noindex」も「none」も含まず（指定が無い場合も含む）、共通の既定ページ（識別番号0）でなく、他のページの複製元を持たないものである。

カテゴリの最終更新日時は全カテゴリのうち最も新しいもの、商品の最終更新日時は公開中の商品のうち最も新しいものとする。日時は日付と時刻にタイムゾーンを添えた形式で出力する。

商品の個別サイトマップの数は、公開中の商品を1ファイルあたりの件数で割った数とする。この数の計算では、在庫なしの商品を隠す設定が有効でも、在庫なしの商品を含めて数える。1ファイルあたりの件数は設定で与える。買取商品とデッキ詳細も同じ件数で分割する。

買取商品の最終更新日時は掲載条件を満たす商品のうち最も新しいもの、デッキ詳細の最終更新日時は掲載条件を満たすデッキのうち最も新しいものとする。デッキ一覧の最終更新日時は、公開状態・種別・削除状態を問わない全デッキのうち最も新しいものとする。

買取商品・デッキ一覧・デッキ詳細の案内は、本店のときだけ載せる。この3種類のサイトマップは本店専用で、支店から直接要求されたときも見つからない旨の応答（404）を返す。加えて、買取商品は対象の商品が1件以上あるとき、デッキ一覧はデッキが1件以上あるとき、デッキ詳細は対象のデッキが1件以上あるときだけ載せる。

### ページのサイトマップ

掲載するページは、識別番号0以外で、かつ他のページの複製元を持たないか、既定ページの確認用であるものとし、検索避け指定に「noindex」も「none」も含まないもの（指定が無い場合も含む）に限る。ページは識別番号の昇順に取り出す。

ページは2つに分ける。管理画面から作成したページは、ユーザーページとして掲載する。それ以外は既定ページとして掲載し、次のものは掲載しない。ルートが存在しないページ、URLに変数を含むページ、商品詳細ページ、商品一覧ページ。

ユーザーページのURLはユーザーページ用のURLに、ページのURL欄の値を添えたものとする。各URLに最終更新日時を付ける。

### カテゴリのサイトマップ

全カテゴリを、親子の階層を平らに並べ直して掲載する。親の次にその子孫が続く並びで、同じ階層の中は並び順の値の降順とする。各カテゴリは、そのカテゴリで絞った商品一覧のURLと最終更新日時で掲載する。

### 商品のサイトマップ

公開中の商品を、色順の昇順、カード英語名の昇順、商品識別番号の降順で並べて取り出す。色順が未設定の商品は後ろに置く。基本情報で在庫なしの商品を隠す設定になっているときは、在庫なしの商品を除く。

支店の場合も、支店での公開可否では絞り込まない。そのため、支店では商品詳細を閲覧できない商品も掲載される。

要求されたページ番号に該当する商品が0件のときは、見つからない旨の応答（404）を返す。

各商品は、商品詳細のURLと最終更新日時で掲載し、商品に登録された画像があれば、そのすべての画像のURLを添える。画像のURLは、登録値がHTTPまたはHTTPSのURLならそのまま使い、それ以外は、登録値の先頭のスラッシュを除き、設定で与える配信の基点との間をスラッシュ1個でつないだものとする。そのまま使うのは、小文字の http:// または https:// で始まる登録値だけである。

### 買取商品のサイトマップ

掲載する商品は、公開中で、買取価格が0を超え、表示対象で、カードの状態がNMの商品規格を持つものとする。高額買取のコードが付いた規格は対象にしない。予約扱いの販売グループに属する商品は対象にしない。

並びは更新日時の降順で、同じ日時なら商品の識別番号の降順とする。1商品につき1件とする。

該当する商品が0件のページ番号が要求されたときは、見つからない旨の応答（404）を返す。各商品は、買取の商品詳細のURLと最終更新日時で掲載する。

### デッキのサイトマップ

デッキ一覧のサイトマップは、デッキのトップページを先頭に載せ、次にランキング表示または他メタゲーム表示のどちらかが有効なフォーマットを順位の昇順に並べて、フォーマットごとにメタゲームのURLと使用率ランキングのURLの2件を載せる。デッキ一覧のサイトマップには最終更新日時を付けない。

デッキ詳細のサイトマップは、表示するデッキのうち、ユーザーが作成した種別でなく、非公開でなく、削除されていないものを、更新日時の降順に載せる。各デッキは、デッキ詳細のURLと最終更新日時で掲載する。

該当するデッキが0件のページ番号が要求されたときは、見つからない旨の応答（404）を返す。

### 旧サイトのアドレスの維持

サイトマップのファイル名（sitemap で始まり .xml で終わるもの）がルート直下で要求されたときは、日本語サイトの同名のアドレスへ恒久的に転送する。検索条件は引き継ぐ。

## 入出力

| 種類 | 内容 |
| --- | --- |
| 入力 | GETまたはHEADの要求。言語区分（設定で与える）、支店の場合の店舗コード、要求するサイトマップの種類。商品・買取商品・デッキ詳細ではページ番号（数字のみ。0は1として扱う） |
| 成功時出力 | XML 形式のサイトマップ。索引は個別サイトマップの案内を、個別サイトマップは URL と更新頻度（毎日）を載せ、デッキ一覧を除いて最終更新日時も載せる。応答の種類は application/xml とする。商品のサイトマップは画像のURLも載せる |
| 失敗時出力 | 商品・買取商品・デッキ詳細のサイトマップで、要求されたページ番号に該当するものが0件のとき、見つからない旨の応答（404）を返す。買取商品・デッキ一覧・デッキ詳細を支店から要求したときも同じ応答を返す |

本機能は、いずれの場合も他のAPIの呼び出しを行わない。

### 入出力: 永続化

| 操作 | 契機 |
| --- | --- |
| 無し | サイトマップの組み立てでは、データの登録も更新も行わない |

## 表示メッセージ

この機能は、いずれの場合も画面のメッセージを扱わない。

## 出典

| 小見出し | 重要度 | 出典 |
| --- | --- | --- |
| 要求先と応答 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:56 |
| 要求先と応答 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:134 |
| 要求先と応答 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:147 |
| 要求先と応答 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:252 |
| 要求先と応答 | P1 | ec-cube-enterprise:app/config/eccube/routes.yaml:42 |
| 要求先と応答 | P1 | ec-cube-enterprise:vendor/symfony/routing/Matcher/UrlMatcher.php:113 |
| 要求先と応答 | P1 | ec-cube-enterprise:src/Eccube/EventListener/TwigInitializeListener.php:84 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:59 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:69 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap_index.xml.twig:3 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap_index.xml.twig:17 |
| サイトマップ索引 | P1 | ec-cube-enterprise:app/config/eccube/packages/eccube.yaml:144 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:71 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap_index.xml.twig:11 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:92 |
| サイトマップ索引 | P1 | ec-cube-enterprise:src/Eccube/EventListener/BranchShopNotFoundListener.php:70 |
| ページのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:167 |
| ページのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:172 |
| ページのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/PageRepository.php:153 |
| ページのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap.xml.twig:6 |
| ページのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap.xml.twig:18 |
| カテゴリのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:124 |
| カテゴリのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/CategoryRepository.php:140 |
| カテゴリのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap.xml.twig:28 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:138 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:152 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap.xml.twig:41 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/ProductRepository.php:1193 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/ProductController.php:250 |
| 商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Twig/Extension/EccubeExtension.php:440 |
| 買取商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/ProductRepository.php:1469 |
| 買取商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:206 |
| 買取商品のサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap.xml.twig:53 |
| デッキのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/Master/MtbFormatRepository.php:58 |
| デッキのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Resource/template/default/sitemap_deck.xml.twig:3 |
| デッキのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Repository/DtbDeckRepository.php:1217 |
| デッキのサイトマップ | P1 | ec-cube-enterprise:src/Eccube/Controller/Front/SitemapController.php:237 |
| 旧サイトのアドレスの維持 | P2 | ec-cube-enterprise:html/.htaccess:70 |
