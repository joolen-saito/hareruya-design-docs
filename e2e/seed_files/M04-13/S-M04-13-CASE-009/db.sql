-- S-M04-13-CASE-009（分割数異常商品009）
-- 流す時点: 投入方法の「登録者とは別の、試験店舗A（M04-13）を承認できるメンバーでログインし、在庫編集承認一覧(検索結…」を終えたあと、次の「両商品の在庫分割は登録しない。」より前。手順書（S-M04-13-CASE-009.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: M0413-SPLIT-MAX-009の試験店舗A（M04-13）・EC-CUBE在庫の在庫数100000000と総原価100000000は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-13）') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A（M04-13）」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0413-SPLIT-MAX-009' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-13）') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0413-SPLIT-MAX-009・店舗試験店舗A（M04-13）・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0413-SPLIT-MAX-009' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-13）') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0413-SPLIT-MAX-009・店舗「試験店舗A（M04-13）」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 100000000, total_cost = 100000000 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0413-SPLIT-MAX-009' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-13）') AND s.stock_location_id = 1);

COMMIT;
