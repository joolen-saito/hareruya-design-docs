-- S-M04-31-CBSMMINUS-167（スマレジ在庫の棚卸計画（差異マイナス・計画後に在庫変動なし））
-- 流す時点: 投入方法の「前回の実行で同じ商品コードの商品が残っているときは新しく登録せず、商品登録画面のURLに含まれる商品…」を終えたあと、次の「店舗Aと店舗Bを編集できる管理者m0431_admin（S-M04-31-ADM…」より前。手順書（S-M04-31-CBSMMINUS-167.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 商品M0431CB167P1の店舗A・スマレジの在庫10は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB167P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431CB167P1・店舗店舗A・在庫区分2の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB167P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0431CB167P1・店舗「店舗A」・スマレジ）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431CB167P1' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '店舗A') AND s.stock_location_id = 2);

COMMIT;
