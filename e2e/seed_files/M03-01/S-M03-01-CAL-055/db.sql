-- S-M03-01-CAL-055（カレンダー選択商品(055)）
-- 流す時点: 投入方法の「商品マスター(検索入力)でコードに各行の商品コードを1つずつ入れて「検索する >」を押し、商品マスタ…」を終えたあと。手順書（S-M03-01-CAL-055.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 規格更新日時（2026-09-03 12:00:00）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0301-055〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0301-055〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0301-055〕)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（〔商品ID-M0301-055〕の規格）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET update_date = TIMESTAMPTZ '2026-09-03 12:00:00+09' WHERE id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0301-055〕);

COMMIT;
