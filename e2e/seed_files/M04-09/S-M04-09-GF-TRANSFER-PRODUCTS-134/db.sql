-- S-M04-09-GF-TRANSFER-PRODUCTS-134（振替登録の履歴確認商品(134)）
-- 流す時点: 投入方法の「M0409-134-Bの試験店舗A・在庫区分EC-CUBEは在庫数4・総原価600とする。」を終えたあと、次の「在庫振替は登録しない。」より前。手順書（S-M04-09-GF-TRANSFER-PRODUCTS-134.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: この在庫数と総原価は画面で指定できないためDBへ直接設定する（在庫変動履歴は作らない）。
--     備考: 「この在庫数と総原価」は、前の文または状態・属性に書かれた「商品コード・店舗・在庫区分と在庫数・総原価」の並びのとおり
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0409-134-A・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0409-134-A・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 1000 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0409-134-B・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0409-134-B・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 4, total_cost = 600 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-134-B' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);

COMMIT;
