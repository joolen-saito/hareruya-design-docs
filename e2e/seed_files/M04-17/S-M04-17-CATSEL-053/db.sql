-- S-M04-17-CATSEL-053（在庫変動理由区分絞り込み履歴(053)）
-- 流す時点: 投入方法の「登録したメンバーとは別の、承認権限のあるメンバーでログインし、在庫編集承認一覧(検索結果)で該当の行…」を終えたあと、次の「そのうえで在庫検索一覧で商品コード「CATSEL-M0417-053-C」を検索…」より前。手順書（S-M04-17-CATSEL-053.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: CATSEL-M0417-053-Cの在庫数1は画面で指定できないためDBへ直接設定する。
--     備考: 対象の在庫(商品コード・店舗・在庫区分)は、前の文または状態・属性の最後の言及のもの
--     備考: 在庫の行は 商品コード+店舗+在庫区分 で1行に決まることを確かめてから設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「本店」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'CATSEL-M0417-053-C' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードCATSEL-M0417-053-C・店舗本店・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'CATSEL-M0417-053-C' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードCATSEL-M0417-053-C・本店・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 1 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'CATSEL-M0417-053-C' AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND s.stock_location_id = 1);

COMMIT;
