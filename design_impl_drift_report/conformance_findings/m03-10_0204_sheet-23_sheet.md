■管理-M03-10 買取・基準価格一括編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）販売価格（NM）（隠し）を保持し、検証コールバックで買取価格との大小比較に使用する。買取が販売を超えると admin.product_class.buyprice_valid_bulk を返す。
　BulkUpdateProductPriceType は buy_price_nm と standard_price_nm のみ比較し、admin.product.buy_price_exceeds_standard を返す。DetailType/集約クエリ/Twig に sell_price_nm は無く、対象ロケールにも admin.product_class.buyprice_valid_bulk は無い。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-23:5717,5751,5756,5775 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Product/ProductBulkUpdateBuyPriceController.php, src/Eccube/Form/Type/Admin/BulkUpdateProductPriceType.php, src/Eccube/Form/Type/Admin/BulkUpdateProductPriceDetailType.php, src/Eccube/Repository/ProductClassRepository.php#getProductClassForPriceUpdate, src/Eccube/Resource/template/admin/Product/edit_bulk_update_buy_price.twig, src/Eccube/Resource/locale/messages.ja.yaml; 検索語: sell_price_nm, buyprice_valid_bulk, admin.product_class.buyprice_valid_bulk, price02.*bulk））

■管理-M03-10 買取・基準価格一括編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力された standard_price_nm を同一商品・同一言語・通常規格すべての standard_price に同じ値で書き込み、SP/MP/HP の POST 値は保存計算に使わない。
　StoreAction は standard_price_sp/mp/hp を conditionStandardPrices に採用し、ProductClassRepository と DtbPriceHistoryRepository は NM/SP/MP/HP ごとの CASE で standard_price と履歴を更新している。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-23:5749,5751,5769 ／ 実装: src/Eccube/Service/Admin/Product/ProductBulkUpdateBuyPriceStoreAction.php:79; src/Eccube/Repository/ProductClassRepository.php:1936; src/Eccube/Repository/ProductClassRepository.php:1993; src/Eccube/Repository/DtbPriceHistoryRepository.php:243）
