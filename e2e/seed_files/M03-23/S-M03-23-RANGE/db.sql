-- S-M03-23-RANGE（価格範囲検索データ）
-- 流す時点: 投入方法の「基準価格は買取価格より大きい値にする。」を終えたあと。手順書（S-M03-23-RANGE.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 取り込みでできた価格履歴6件（変更前価格が空のもの）は画面で削除できないため、DBから直接削除する（RANGESETを持つ履歴をCSVでできた6件だけにする）
--     備考: 文の「6件」がこのシードの商品規格の数（6）と同じため、全部に対して行う
--     備考: 「変更前価格が空」の履歴(取り込みでできたもの)だけを消す。取り込みは変更前の価格を0で書くため、0と空(NULL)のどちらも「空」として扱う
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'SALE-MATCH-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「SALE-MATCH-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'SALE-MATCH-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'SALE-OLD-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「SALE-OLD-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'SALE-OLD-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'BUY-ONLY-RANGE-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「BUY-ONLY-RANGE-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'BUY-ONLY-RANGE-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'BUY-MATCH-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「BUY-MATCH-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'BUY-MATCH-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'BUY-OLD-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「BUY-OLD-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'BUY-OLD-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'SELL-ONLY-RANGE-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「SELL-ONLY-RANGE-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'SELL-ONLY-RANGE-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;

COMMIT;
