-- S-M03-27-CASE-032（セール中更新データ(032)）
-- 流す時点: 投入方法の「④商品一覧でその商品の商品登録画面を開き、商品規格登録画面へ進んで、「セールフラグ」にチェックを付け…」を終えたあと、次の「⑥グッズ商品CSV登録画面の「雛形ファイルダウンロード」で32列の雛形を取得し、…」より前。手順書（S-M03-27-CASE-032.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ⑤原価単価=50は画面で指定できないためDBへ直接設定する。
--     備考: 原価単価は「本店・EC-CUBEの在庫の総原価÷在庫数」(アプリの定義)。在庫数が0のときは在庫1にして総原価50、在庫があるときはその在庫数×50 にした
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-032〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0327-032〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-032〕) AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（〔商品ID-M0327-032〕の規格・本店・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1), total_cost = 50 * GREATEST(stock, 1) WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-032〕) AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1;

COMMIT;
