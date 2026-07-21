■バッチ-B16-06 月次商品情報スナップショット
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）月初に店舗・在庫場所・商品規格ごとに一部の事項を抽出し、stock_YYYYMMDD.txt.zip に圧縮して s3://inventorycheck/ へアップロードする月次バッチを、毎月1日 午前1時にStep Functionsから実行する。
　専用Command/Service/Repositoryは確認できない。S3汎用サービスは src/Eccube/Service/S3/FileUploadService.php:57 で単一ファイルputFileを提供し、デモCommandは src/Eccube/Command/TestS3UploadDemoCommand.php:22 の eccube:demo:s3-upload で固定の hello.txt をアップロードするだけ。Command一覧にも月次商品情報スナップショット相当の入口はなく、近い名称の src/Eccube/Command/MonthlySummaryAggregateCommand.php:26 は月次集計テーブル更新、src/Eccube/Command/UpdateWeeklyStockHistoryCommand.php:35 は週間在庫履歴更新である。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-8:1093,1107,1122,1123,1124,1126 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: inventorycheck, stock_YYYYMMDD, branch_YYYYMMDD, monthly-inventory, restore-for-inventory, 月次商品, スナップショット, 毎月1日, 午前1時, FileUploadService, putFile, ZipArchive））

■バッチ-B16-06 月次商品情報スナップショット
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）一時的なDBインスタンスに対して、商品規格の公開フラグが1、商品在庫に紐づく店舗が閉店でないこと、本店支店含め全店舗を対象に、商品コード・販売価格・買取価格・店舗名・在庫区分名・在庫数を出力し、店舗ID昇順、在庫区分名（EC、スマレジの順）で並べる。
　管理画面用の在庫CSVは src/Eccube/Service/Csv/Exporter/StockListCsvExportService.php:33 で類似列を持つが、列は商品ID・商品名・言語・状態・基準価格・原価単価・販売数などを含む管理画面CSVで、src/Eccube/Controller/Admin/Stock/StockListController.php:213 のHTTPダウンロード用。検索Queryは src/Eccube/Repository/ProductStockRepository.php:57 の管理画面在庫一覧用で、src/Eccube/Repository/ProductStockRepository.php:313 では pc.id DESC, ps.stockLocationId ASC に並べており、設計の店舗ID昇順ではない。BaseInfoには src/Eccube/Entity/BaseInfo.php:1518 に test_store_flg はあるが、閉店判定を使った月次抽出条件は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html#sheet-8:1107,1108,1109,1110,1111,1112,1113,1114,1115,1116,1117,1118,1119,1120 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: ProductStock, stock_location_id, product_code, price02, buy_price, visible, closed, 閉店, 在庫区分名, 店舗ID, stock_））
