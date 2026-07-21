■バッチ-B16-09 サイトマップ生成処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）晴れる屋トップページからリンクを辿りながらアクセス可能なURLのリストからサイトマップファイルを作成し、S3にファイルをアップロードする。Sitemap-Generator-Crawlerを使い、トップページを解析してリンクURLを抽出し、リンク先がなくなるまで巡回したURLリストでサイトマップファイルを作成する。
　実装は `/sitemap.xml` 等のGETルートで、DBのPage/Product/Category/Purchase/Deck情報からTwig XMLレスポンスを返すフロントController。Sitemap-Generator-Crawler依存、トップページ起点のリンク巡回、URLリストからファイルを生成する処理、S3アップロード呼び出しは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-11:1299 ／ 実装: src/Eccube/Controller/Front/SitemapController.php:56）

■バッチ-B16-09 サイトマップ生成処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）前回(昨日)のサイトマップと今回作成したサイトマップを比較し、差異がある場合はS3にアップロードする。
　前回サイトマップ取得、今回サイトマップとの比較、差異がある場合のみS3へアップロードする制御は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-11:1321 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: sitemap/Sitemap, yesterday/前回/昨日, diff/compare/差異/比較, S3Client/putObject/upload））

■バッチ-B16-09 サイトマップ生成処理
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）実行トリガーは Eventbridge+Lamdba、実行タイミングは毎日4:00。実行環境はバッチ処理用EC2インスタンス。
　サイトマップ生成用のSymfony Command、EventBridge/Lambda連携設定、毎日4:00のスケジュール設定は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-11:1303 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/html, app/config/eccube, .github。検索語: EventBridge/Eventbridge/Lambda/Lamdba/cron/schedule/04:00/4:00/sitemap））

■バッチ-B16-09 サイトマップ生成処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）全部のリンクを取得するように設定(階層設定なし)。但し、管理ページ、商品検索ページ(日本語・英語)、カードリスト購入ページ(日本語・英語)、デッキ検索ページ(日本語・英語)、イベント情報(日本語・英語)およびそれ以降のページは取得しない。
　実装は巡回除外ルールではなく、ページ・カテゴリ・商品・買取商品・デッキ系の固定XMLルートをDBから生成している。`page()` ではnoindex/noneやURL変数、管理画面作成ページを除外するが、設計の巡回除外対象一覧とは一致しない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-11:1314 ／ 実装: src/Eccube/Controller/Front/SitemapController.php:164）
