-- S-M03-04-RICH-002（新規列確認商品(002)）
-- 流す時点: 投入方法の「続けて、M03-04試験管理者とは別の、本店の在庫を承認できる管理者でログインし、在庫編集承認一覧で…」を終えたあと。手順書（S-M03-04-RICH-002.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 発送日目安（ID 736・名称 翌日）は画面で指定できないためDBへ直接設定する。
--     備考: 発送日目安の行の店舗は本店、日数(duration)は名称から読んだ(翌日=1、N日後=N)、並び順は番号と同じにした(文に無いため)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_delivery_duration (id, base_info_id, name, duration, sort_no) VALUES (736, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), '翌日', 1, 736) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, duration = EXCLUDED.duration;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔規格ID-M0304-002〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔規格ID-M0304-002〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET delivery_duration_id = 736 WHERE id = 〔規格ID-M0304-002〕;

-- [2] 文（投入方法）: 販売価格900は画面で指定できないためDBへ直接設定する（取込では販売価格が基準価格の1000で保存される）。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔規格ID-M0304-002〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔規格ID-M0304-002〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔規格ID-M0304-002〕;

COMMIT;
