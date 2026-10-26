-- S-M04-08-CBTWOSTORES-040（バーコード印刷用CSV 複数店舗にまたがる出力データ(040)）
-- 流す時点: 投入方法の「その商品の商品規格一覧で、取り込みで作られた規格の行を開き、商品規格登録編集画面でスマレジ商品コード…」を終えたあと、次の「【移動A】M04-09作業者（S-M04-08-OP-A）でログインし、在庫一覧…」より前。手順書（S-M04-08-CBTWOSTORES-040.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: この商品規格のスマレジ商品ID 4084088と、試験店舗A・EC-CUBEの在庫（在庫数1以上）は画面で指定できないためDBへ直接設定する。
--     備考: 対象は、この文が書かれた節の見出しが指す商品（M0408-040-A）
--     備考: 在庫数は、1未満のときだけ1にする(1以上ならそのまま)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0408-040-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「M0408-040-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0408-040-A')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードM0408-040-A）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = '4084088' WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0408-040-A');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s WHERE s.product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0408-040-A') AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格M0408-040-A・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s WHERE s.product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0408-040-A') AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0408-040-A・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1) WHERE id = (SELECT s.id FROM dtb_product_stock s WHERE s.product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0408-040-A') AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);

COMMIT;
