■管理-M13-14 バナー設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口は GET /{admin_route}/banner/event、GET /{admin_route}/banner/event/{html_class}、POST /{admin_route}/banner/event または /{admin_route}/banner/event/{html_class}、DELETE /{admin_route}/banner/event/delete とする。
　実装は GET /%eccube_admin_route%/event/banner、GET /%eccube_admin_route%/event/banner/{htmlClass}、POST /%eccube_admin_route%/event/banner/settings、POST /%eccube_admin_route%/event/banner/{htmlClass}/settings、DELETE /%eccube_admin_route%/event/banner/delete を定義している。ナビも admin_event_banner を参照している。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-21:5477 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php:57）

■管理-M13-14 バナー設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）バナーの「削除」は DELETE /{admin_route}/banner/event/delete で指定したバナーを削除し、イベントバナーの設定・更新・削除を成功時出力および副作用とする。
　DELETE admin_event_banner_delete は select_file クエリを受け取り、EventBannerStorageService::deleteObjectIfExists で S3 上の画像ファイルを削除する。MtbBanner の削除、dtb_banner_base_info/dtb_banner_language 関連の削除、EntityManager::remove は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0214_基本設計仕様書(イベント管理).html#sheet-21:5488 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Event/BannerController.php:121）
