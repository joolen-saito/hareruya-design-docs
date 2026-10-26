-- S-M03-30-DATA-001（通常商品価格更新データ(001)）
-- 流す時点: 投入方法の「商品マスター画面で商品名(日/英)に「M0330試験商品001」を入れて検索し、該当商品の商品登録編…」を終えたあと、次の「設計の5列を持つUTF-8・タブ区切りファイルを試験端末へ配置する（ファイルの商…」より前。手順書（S-M03-30-DATA-001.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 販売価格=900は画面で指定できないためDBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-001〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-001〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔商品規格ID-M0330-001〕;

-- [2] 文（投入方法）: 価格履歴=0件は画面で指定できないためDBへ直接設定する（登録時にできた価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-001〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-001〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-001〕;

-- [3] 文（投入方法）: 原価単価=300は画面で指定できないためDBへ直接設定する。
--     備考: 原価単価は「本店・EC-CUBEの在庫の総原価÷在庫数」(アプリの定義)。在庫数が0のときは在庫1にして総原価300、在庫があるときはその在庫数×300 にした
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-001〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-001〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE product_class_id = 〔商品規格ID-M0330-001〕 AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（〔商品規格ID-M0330-001〕・本店・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1), total_cost = 300 * GREATEST(stock, 1) WHERE product_class_id = 〔商品規格ID-M0330-001〕 AND base_info_id = (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop) AND stock_location_id = 1;

COMMIT;
