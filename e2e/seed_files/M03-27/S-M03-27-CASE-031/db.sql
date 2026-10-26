-- S-M03-27-CASE-031（通常商品の全項目更新データ(031)）
-- 流す時点: 投入方法の「③商品一覧の詳細検索「コード」に「GOODS-OLD-001-031」を入れて「検索する」を押し、該…」を終えたあと、次の「⑤グッズ商品CSV登録画面の「雛形ファイルダウンロード」で32列の雛形を取得し、…」より前。手順書（S-M03-27-CASE-031.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: （セールフラグは新規登録で0になる）④規格の発送日目安ID=736と原価単価=50は画面で指定できないためDBへ直接設定する。
--     備考: 原価単価は「本店・EC-CUBEの在庫の総原価÷在庫数」(アプリの定義)。在庫数が0のときは在庫1にして総原価50、在庫があるときはその在庫数×50 にした
--     備考: 発送日目安の番号は文のとおり。その番号の発送日目安の行が無ければ確認で止まる。発送日目安（番号736）は、この機能（M03-27）のシードは作らない。別の機能のシード S-M03-04-RICH-002（M03-04）・S-M03-04-RICH-003（M03-04） のSQLが作る。そのシードを先に登録して流さないと、このSQLは確認で止まる
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0327-031〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕) AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（〔商品ID-M0327-031〕の規格・本店・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1), total_cost = 50 * GREATEST(stock, 1) WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕) AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_delivery_duration WHERE id = 736) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '発送日目安（番号736）が1件に決まらない（先に発送日目安を登録しておく）（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（〔商品ID-M0327-031〕の規格）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET delivery_duration_id = 736 WHERE id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-031〕);

COMMIT;
