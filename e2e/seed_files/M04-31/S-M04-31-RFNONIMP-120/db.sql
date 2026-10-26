-- S-M04-31-RFNONIMP-120（在庫反映の影響範囲確認用）
-- 流す時点: 投入方法の「棚卸計画「M0431-120-A」の棚卸計画編集の一覧で、M0431120P1のそれぞれについて、商…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-120-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-RFNONIMP-120.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-120-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-120-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-120-A';

-- [2] 文（投入方法）: 商品M0431120P1の店舗A・スマレジの在庫7と店舗B・EC-CUBEの在庫99は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431120P1・店舗店舗A・在庫区分2の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0431120P1・店舗「店舗A」・スマレジ）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 7 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '店舗B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「店舗B」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗B') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431120P1・店舗店舗B・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗B') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0431120P1・店舗「店舗B」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 99 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431120P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗B') AND s.stock_location_id = 1);

COMMIT;
