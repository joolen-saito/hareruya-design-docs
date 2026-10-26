-- S-M04-23-CASE-046（分割数量上限データ）
-- 流す時点: 投入方法の「店舗一覧で店名「在庫分割結合試験店舗甲〇四六」の行（同じ店名の行が複数あるときは、店舗IDが最も大き…」を終えたあと、次の「④在庫検索一覧で店舗に「在庫分割結合試験店舗甲〇四六」を選んで検索し、41001…」より前。手順書（S-M04-23-CASE-046.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
-- 手順書: e2e/.runs/seed_files_private/M04-23/S-M04-23-CASE-046.md（シード表の文にパスワードを含むため非公開側に置いてある。git に入れない）
BEGIN;

-- [1] 文（投入方法）: ③商品コード「410010」のEC-CUBE在庫数999999999は画面で指定できないためDBへ直接設定する（店舗は控えた〔店舗ID-M0423-046〕で指す）／
--     備考: 店舗は呼び名の番号で指す(店舗の番号は画面で控えたもの)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE id = 〔店舗ID-M0423-046〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「〔店舗ID-M0423-046〕」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '410010' AND s.base_info_id = 〔店舗ID-M0423-046〕 AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コード410010・店舗〔店舗ID-M0423-046〕・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '410010' AND s.base_info_id = 〔店舗ID-M0423-046〕 AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コード410010・〔店舗ID-M0423-046〕・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 999999999 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '410010' AND s.base_info_id = 〔店舗ID-M0423-046〕 AND s.stock_location_id = 1);

COMMIT;
