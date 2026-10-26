-- S-M04-21-VALIDATION-024（0件行継続データ(024)）
-- 流す時点: 投入方法の「在庫一覧画面で商品コードM421-IN-024を検索し、店舗試験店舗A（M04-21）・在庫区分EC…」を終えたあと、次の「在庫変更CSV登録画面の「雛形をダウンロード」で3列（商品コード・在庫増減数・仕…」より前。手順書（S-M04-21-VALIDATION-024.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 商品コードM421-IN-024の試験店舗A（M04-21）・EC-CUBEの店舗別在庫の在庫数=10・総原価=1000は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A（M04-21）」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M421-IN-024' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM421-IN-024・店舗試験店舗A（M04-21）・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M421-IN-024' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM421-IN-024・店舗「試験店舗A（M04-21）」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 1000 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M421-IN-024' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1);

COMMIT;
