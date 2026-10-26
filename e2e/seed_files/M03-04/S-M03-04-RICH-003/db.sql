-- S-M03-04-RICH-003（規格行確認商品(003)）
-- 流す時点: 投入方法の「商品コード『GOODS-304-B-003』の規格についても、在庫編集で同じ値（入庫/その他・在庫増…」を終えたあと。手順書（S-M03-04-RICH-003.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 発送日目安（商品コードGOODS-304-A-003の規格はID 736・名称 翌日、GOODS-304-B-003の規格はID 737・名称 3日後）は画面で指定できないためDBへ直接設定する。
--     備考: 発送日目安の行の店舗は本店、日数(duration)は名称から読んだ(翌日=1、N日後=N)、並び順は番号と同じにした(文に無いため)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_delivery_duration (id, base_info_id, name, duration, sort_no) VALUES (736, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), '翌日', 1, 736) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, duration = EXCLUDED.duration;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'GOODS-304-A-003') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードGOODS-304-A-003が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET delivery_duration_id = 736 WHERE product_code = 'GOODS-304-A-003';
INSERT INTO dtb_delivery_duration (id, base_info_id, name, duration, sort_no) VALUES (737, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), '3日後', 3, 737) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, duration = EXCLUDED.duration;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'GOODS-304-B-003') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードGOODS-304-B-003が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET delivery_duration_id = 737 WHERE product_code = 'GOODS-304-B-003';

-- [2] 文（投入方法）: 商品コードGOODS-304-A-003の規格の販売価格900は画面で指定できないためDBへ直接設定する（取込では基準価格の1000で保存される）。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'GOODS-304-A-003') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「GOODS-304-A-003」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'GOODS-304-A-003')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードGOODS-304-A-003）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'GOODS-304-A-003');

-- [3] 文（投入方法）: 商品コードGOODS-304-B-003の規格の部門未設定は画面で指定できないためDBへ直接設定する（登録時に選んだ部門を外す）。
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'GOODS-304-B-003') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードGOODS-304-B-003が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET section_id = NULL WHERE product_code = 'GOODS-304-B-003';

COMMIT;
