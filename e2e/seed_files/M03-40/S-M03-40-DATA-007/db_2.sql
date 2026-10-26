-- S-M03-40-DATA-007（更新範囲確認データ）
-- 流す時点: 投入方法の「どちらの場合も、商品規格登録画面に表示された商品IDと商品規格IDを控える（〔商品ID-M0340-…」を終えたあと、次の「取込ファイル（m0340-normal-007.csv）は、状態・属性に書いた内…」より前。手順書（S-M03-40-DATA-007.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 商品更新日時（商品甲=2026-09-01 09:00:00、商品乙=2026-09-01 09:02:00）と商品規格更新日時（商品甲=2026-09-01 09:01:00、商品乙=2026-09-01 09:03:00）は、画面で登録すると現在日時になり画面で指定できないためDBへ直接設定する
--     備考: 商品コードで引く。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = '34000701') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コード34000701が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = (SELECT product_id FROM dtb_product_class WHERE product_code = '34000701')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品（商品コード34000701）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product SET update_date = TIMESTAMPTZ '2026-09-01 09:00:00+09' WHERE id = (SELECT product_id FROM dtb_product_class WHERE product_code = '34000701');
UPDATE dtb_product_class SET update_date = TIMESTAMPTZ '2026-09-01 09:01:00+09' WHERE product_code = '34000701';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = '34000702') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コード34000702が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = (SELECT product_id FROM dtb_product_class WHERE product_code = '34000702')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品（商品コード34000702）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product SET update_date = TIMESTAMPTZ '2026-09-01 09:02:00+09' WHERE id = (SELECT product_id FROM dtb_product_class WHERE product_code = '34000702');
UPDATE dtb_product_class SET update_date = TIMESTAMPTZ '2026-09-01 09:03:00+09' WHERE product_code = '34000702';

COMMIT;
