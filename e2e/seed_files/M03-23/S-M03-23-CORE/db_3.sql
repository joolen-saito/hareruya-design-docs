-- S-M03-23-CORE（一覧表示基本データ）
-- 流す時点: 投入方法の「CSVの値は、HIST-BUY-ONLY-001は買取価格400（基準価格は登録時と同じ値）、HIS…」を終えたあと、次の「MULTI-001の価格履歴IDは画面に表示されないため、DBを参照して控える（…」より前。手順書（S-M03-23-CORE.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: HIST-BUY-ONLY-001とHIST-SELL-ONLY-001の、取り込みでできた価格履歴（変更前価格が空のもの）各1件は画面で削除できないため、DBから直接削除する。
--     備考: 「変更前価格が空」の履歴(取り込みでできたもの)だけを消す。取り込みは変更前の価格を0で書くため、0と空(NULL)のどちらも「空」として扱う
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIST-BUY-ONLY-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIST-BUY-ONLY-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-BUY-ONLY-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIST-SELL-ONLY-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIST-SELL-ONLY-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-SELL-ONLY-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;

COMMIT;
