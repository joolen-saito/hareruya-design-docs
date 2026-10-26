-- S-M04-17-LINK-042（受注リンク履歴(042)）
-- 流す時点: 投入方法の「グッズ商品は状態ニアミントの規格が1件作られる。」を終えたあと、次の「フロント画面に試験用の会員でログインし、商品詳細画面で商品コード「LINK-OR…」より前。手順書（S-M04-17-LINK-042.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: この商品の本店・EC-CUBEの在庫数1は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「本店」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'LINK-ORDER-042' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードLINK-ORDER-042・店舗本店・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'LINK-ORDER-042' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードLINK-ORDER-042・本店・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 1 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'LINK-ORDER-042' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1);

COMMIT;
