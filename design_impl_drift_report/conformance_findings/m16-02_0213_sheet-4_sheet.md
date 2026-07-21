■管理-M16-02 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は GET/POST /{admin_route}/banner/top、店舗絞り込みは /{admin_route}/banner/top/{html_class}#upload_wrap、削除は DELETE /{admin_route}/banner/top/delete または /banner/top/delete/{html_class} とする。
　実装ルートは /%eccube_admin_route%/data/top_banner、/%eccube_admin_route%/data/top_banner/{base_info_digit}、削除は /data/top_banner/delete および /data/top_banner/{base_info_digit}/delete。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-4:1147 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/TopBannerController.php:52）

■管理-M16-02 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）画像ファイルはオブジェクトストレージ上の banner/ 配下、店舗別は banner/{html_class}/ に格納・一覧・削除する。
　一覧は TOP_BANNER_S3_DIRECTORY = 'banner/top/'、アップロードは TOP_BANNER_S3_DIRECTORY = 'banner/top'、削除許可プレフィックスは TOP_BANNER_S3_PREFIX = 'banner/top/'。店舗別は banner/top/{shopDigit}/。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-4:1138 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Data/TopBannerFileListAction.php:22）

■管理-M16-02 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）アップロード成功時、店舗未選択なら null、選択済みなら htmlClassName を返し、GET に #upload_wrap を付けて、選択店舗の絞り込み先へリダイレクトする。
　アップロード成功後は常に generateUrl('admin_data_top_banner').'#upload_wrap' へ 303 リダイレクトする。handleUpload は void で店舗別リダイレクト判定値を返さない。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-4:1157 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Data/TopBannerController.php:121）

■管理-M16-02 画像設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）表示要素は、ページタイトルが「データ管理」、サブタイトルが「トップバナー管理」。
　Twig は block title に admin.data.top_banner（トップバナー管理）、block sub_title に admin.data.data_management（データ管理）を設定している。確認お願いします。（設計根拠: excel_to_html/output/0213_基本設計仕様書(データ管理).html#sheet-4:1150 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Data/top_banner.twig:15）
