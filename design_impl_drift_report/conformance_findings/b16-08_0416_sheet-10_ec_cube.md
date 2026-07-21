■バッチ-B16-08 EC-CUBE 同期ディレクトリ処理バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）S3パス : s3://[S3バケット名]/html/sitemap.xml → EC-CUBE 同期ディレクトリ : /var/ec-cube/html/sitemap.xml。カスタマイズ時にサイトマップ同期も当スクリプトに追加する。
　同期cron本体は app/template/default、app/template/user_data、html/user_data の3系統だけを aws s3 sync しており、html/sitemap.xml を S3 から /var/ec-cube/html/sitemap.xml へ同期する処理がない。src/Eccube には /sitemap.xml を動的出力する SitemapController は存在するが、設計要求である S3 ファイル同期対象への追加ではない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-10:1239 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/dockerbuild/eccube/file_sync_command.sh, /home/y-saito/Developments/ec-cube-enterprise/dockerbuild/docker-php-entrypoint, /home/y-saito/Developments/ec-cube-enterprise/Dockerfile, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: sitemap, サイトマップ, html/sitemap, sitemap.xml, AWS_S3_BUCKET, file_sync_command））
