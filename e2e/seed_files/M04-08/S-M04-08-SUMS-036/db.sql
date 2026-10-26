-- S-M04-08-SUMS-036（明細2件の移動(036)）
-- 流す時点: 投入方法の「規格の基準価格・販売価格はCSVで入れた値のままにする。」を終えたあと、次の「M04-09作業者（S-M04-08-OP-A）でログインし、在庫一覧画面で店舗…」より前。手順書（S-M04-08-SUMS-036.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 2商品の試験店舗A・EC-CUBEの在庫（在庫数1以上）は画面で指定できないためDBへ直接設定する。
--     備考: 在庫数は、1未満のときだけ1にする。対象の商品コード: M0408-036-A・M0408-036-B
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0408-036-A・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0408-036-A・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1) WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0408-036-B・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0408-036-B・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1) WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0408-036-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);

COMMIT;
