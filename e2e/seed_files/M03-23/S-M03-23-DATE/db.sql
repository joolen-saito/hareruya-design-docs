-- S-M03-23-DATE（登録日時境界データ）
-- 流す時点: 投入方法の「どの商品も商品名に「DATESET」を含む名前、商品コードに識別子（DATE-BEFORE-001・…」を終えたあと。手順書（S-M03-23-DATE.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 価格履歴の登録日時（DATE-BEFORE-001=2026-08-30 23:59:59、DATE-START-001=2026-08-31 00:00:00、DATE-END-001=2026-08-31 23:59:59、DATE-AFTER-001=2026-09-01 00:00:00）は
--     備考: 商品コードで引いた規格の価格履歴(1件)の日時を変える。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-BEFORE-001')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードDATE-BEFORE-001の価格履歴が1件に決まらない(商品規格1件・価格を変えていない前提)（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-30 23:59:59+09' WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-BEFORE-001');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-START-001')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードDATE-START-001の価格履歴が1件に決まらない(商品規格1件・価格を変えていない前提)（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-31 00:00:00+09' WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-START-001');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-END-001')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードDATE-END-001の価格履歴が1件に決まらない(商品規格1件・価格を変えていない前提)（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-31 23:59:59+09' WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-END-001');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-AFTER-001')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードDATE-AFTER-001の価格履歴が1件に決まらない(商品規格1件・価格を変えていない前提)（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-09-01 00:00:00+09' WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'DATE-AFTER-001');

COMMIT;
