-- S-M04-22-MOVE-MAX-016（移動点数上限データ(016)）
-- 流す時点: 投入方法の「新しく登録した商品のため、本商品を対象とする在庫移動情報・履歴は0件である。」を終えたあと。手順書（S-M04-22-MOVE-MAX-016.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 店舗A・EC-CUBEの在庫数999999999は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'MOVE-MAX-001-016' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードMOVE-MAX-001-016・店舗店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'MOVE-MAX-001-016' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードMOVE-MAX-001-016・店舗「店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 999999999 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'MOVE-MAX-001-016' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 1);

COMMIT;
