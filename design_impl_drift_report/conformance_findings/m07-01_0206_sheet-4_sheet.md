■管理-M07-01 買取一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本人確認欄には「⚠️（未確認）、確認中、オンライン本人確認済み、簡易書留確認済み」を表示すること。
　確認済みはマスタ名を表示するが、簡易書留は「書留確認済み」と短縮し、確認中は cb-eye SVG のみ、未確認等は cb-warning SVG のみで設計文言を出力しない。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-4:1305 ／ 実装: src/Eccube/Resource/template/admin/Purchase/index.twig:247; src/Eccube/Resource/template/admin/Purchase/index.twig:250; src/Eccube/Resource/template/admin/Purchase/index.twig:252; app/DoctrineMigrations/Version20251125145047.php:65）

■管理-M07-01 買取一覧(検索結果)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取商品一覧CSVおよび買取商品（キャンセル）CSVの4列目は「販売価格」として出力すること。
　BuyOrderProductListCsvExportService の CSV_HEADER は standard_price の見出しを「基準価格」としている。キャンセルCSVでは product_count を「キャンセル数」に差し替えるだけなので、4列目は同じく「基準価格」のまま出力される。確認お願いします。（設計根拠: excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-4:1233; excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-7:1735; excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html#sheet-8:1874 ／ 実装: src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:30; src/Eccube/Service/Csv/Exporter/BuyOrderProductListCsvExportService.php:70）
