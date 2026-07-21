■バッチ-B06-01 【新規】買取自動入庫バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入庫待ちの店頭買取（ステータス12）・ネット買取（ステータス16）の買取情報を入庫済みへ更新する。
　店頭買取は STATUS_HAS_UNREGISTERED_STOCK=12、STATUS_STOCKING_PENDING=13、STATUS_STOCKING_COMPLETE=11 と定義され、バッチは STATUS_STOCKING_PENDING を対象にしている。ネット買取は WAITING_FOR_STOCK=16 を対象にしており設計通り。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-3:928 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:58）

■バッチ-B06-01 【新規】買取自動入庫バッチ
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ステータスが入庫待ちの店頭買取情報/ネット買取情報を対象に、実在庫情報を買取店舗または本店のECCUBE在庫に登録する。
　店頭・ネットとも ProductClass->getProductStocks() を走査して BaseInfo の一致だけで既存 ProductStock を選び、保存時は既存の stockLocationId を引き継ぐ。ProductClass には EC-CUBE 在庫専用取得メソッド getProductStockByEccube が存在するが、自動入庫処理では使用されていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-3:851 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder/OtcBuyOrderStockInbound.php:56）

■バッチ-B06-01 【新規】買取自動入庫バッチ
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）ネット買取は dtb_buy_order_stock ・ dtb_buy_order_stock_history、店頭買取は dtb_otc_buy_order_stock ・ dtb_otc_buy_order_stock_history。在庫数は dtb_product_class.stock ・ dtb_product_stock.stock を更新する。
　自動入庫処理で在庫数を更新しているのは ProductStockEntityManager::save の ProductStock->setStock のみ。StockHistory は登録されるが、dtb_product_class.stock を更新する処理は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-3:928 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository。検索語: setStock(, ProductClass.*setStock, dtb_product_class.stock, ProductClassRepository.*stock））
