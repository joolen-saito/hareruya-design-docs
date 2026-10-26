-- S-M04-09-GF-HIST-147（在庫変動履歴の画面表示確認商品(147)）
-- 流す時点: 投入方法の「【移動前の在庫数】商品規格の登録で自動で作られたM0409-147-Aの試験店舗A・在庫区分EC-C…」を終えたあと、次の「【在庫移動の登録】M04-09作業者でログインし、在庫検索一覧画面でM0409-…」より前。手順書（S-M04-09-GF-HIST-147.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: この在庫数は画面で指定できないためDBへ直接設定する（在庫変動履歴は作らない）。
--     備考: 「この在庫数と総原価」は、前の文または状態・属性に書かれた「商品コード・店舗・在庫区分と在庫数・総原価」の並びのとおり
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-147-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0409-147-A・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-147-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0409-147-A・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0409-147-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);

COMMIT;
