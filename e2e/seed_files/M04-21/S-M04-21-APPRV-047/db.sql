-- S-M04-21-APPRV-047（入庫承認後の在庫更新確認データ(047)）
-- 流す時点: 投入方法の「在庫一覧画面で商品コードM0421-047-Aを検索し、店舗試験店舗A（M04-21）・在庫区分EC…」を終えたあと、次の「③【画面】権限管理画面を開き、2メンバーに付ける権限（在庫管理の画面を開ける権限…」より前。手順書（S-M04-21-APPRV-047.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 手順書: e2e/.runs/seed_files_private/M04-21/S-M04-21-APPRV-047.md（シード表の文にパスワードを含むため非公開側に置いてある。git に入れない）
BEGIN;

-- [1] 文（投入方法）: ②商品コードM0421-047-Aの試験店舗A（M04-21）・EC-CUBEの店舗別在庫の在庫数=10・総原価=10000は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A（M04-21）」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0421-047-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0421-047-A・店舗試験店舗A（M04-21）・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0421-047-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0421-047-A・店舗「試験店舗A（M04-21）」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 10000 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0421-047-A' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A（M04-21）') AND s.stock_location_id = 1);

COMMIT;
