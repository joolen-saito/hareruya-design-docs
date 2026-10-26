-- S-M04-23-CASE-051（結合数量上限データ）
-- 流す時点: 投入方法の「店舗一覧で店名「在庫分割結合試験店舗甲〇五一」の行（同じ店名の行が複数あるときは、店舗IDが最も大き…」を終えたあと、次の「④在庫検索一覧で店舗に「在庫分割結合試験店舗甲〇五一」を選んで検索し、42001…」より前。手順書（S-M04-23-CASE-051.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ③商品コード「420011」のスマレジ在庫数999999999は画面で指定できないためDBへ直接設定する（店舗は控えた〔店舗ID-M0423-051〕で指す）／
--     備考: 店舗は呼び名の番号で指す(店舗の番号は画面で控えたもの)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE id = 〔店舗ID-M0423-051〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「〔店舗ID-M0423-051〕」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '420011' AND s.base_info_id = 〔店舗ID-M0423-051〕 AND s.stock_location_id = 2) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コード420011・店舗〔店舗ID-M0423-051〕・在庫区分2の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '420011' AND s.base_info_id = 〔店舗ID-M0423-051〕 AND s.stock_location_id = 2)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コード420011・〔店舗ID-M0423-051〕・スマレジ）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 999999999 WHERE id = (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = '420011' AND s.base_info_id = 〔店舗ID-M0423-051〕 AND s.stock_location_id = 2);

COMMIT;
