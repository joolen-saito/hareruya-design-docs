-- S-M04-31-CBSMPLUS-166（スマレジ在庫の棚卸計画（差異プラス・計画後に在庫変動あり））
-- 流す時点: 投入方法の「棚卸計画「M0431-CB166-A」の棚卸計画編集の一覧で、M0431CB166P1のそれぞれにつ…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-CB166-」で始まる棚卸計画が残っている…」より前。手順書（S-M04-31-CBSMPLUS-166.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 棚卸詳細を登録したあとで、商品M0431CB166P1の店舗A・スマレジの在庫を12にDBへ直接更新する（画面で指定できないため。棚卸詳細の在庫数量は変わらず、現在庫だけが変わる）。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB166P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431CB166P1・店舗店舗A・在庫区分2の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB166P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0431CB166P1・店舗「店舗A」・スマレジ）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 12 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB166P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2);

-- [3] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB166-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB166-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-CB166-A';

COMMIT;
