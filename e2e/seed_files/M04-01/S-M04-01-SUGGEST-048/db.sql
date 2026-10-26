-- S-M04-01-SUGGEST-048（部門・棚番号サジェスト用マスタ(048)）
-- 流す時点: 投入方法の「続けて、部門名に「部門M0401-048-B」、部門コードに未使用の数字、免税区分に「対象外」を入れ…」を終えたあと。手順書（S-M04-01-SUGGEST-048.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚番号=棚M0401-048-A・棚M0401-048-Bは画面で指定できないためDBへ直接設定する（名称にM0401-048を含むほかの棚番号があれば、あわせてDBで直接削除する）。
--     備考: 棚番号は名前で作る(同じ名前があれば作らない)。並び順は文に無いので0。作ったあと、名前ごとに棚番号が1件だけあることを確かめる
--     備考: 名称に「M0401-048」を含むほかの棚番号を消す前に、その棚番号を使っている商品規格の棚番号を空にする（文には書かれていないが、商品規格が棚番号を外部キーで指すため、空にしないと消せない。文が残す2件の棚番号を使う商品規格は変えない）
UPDATE dtb_product_class SET shelf_number_id = NULL WHERE shelf_number_id IN (SELECT id FROM dtb_shelf_number WHERE name LIKE '%M0401-048%' AND name NOT IN ('棚M0401-048-A', '棚M0401-048-B'));
DELETE FROM dtb_shelf_number WHERE name LIKE '%M0401-048%' AND name NOT IN ('棚M0401-048-A', '棚M0401-048-B');
INSERT INTO dtb_shelf_number (name, sort_no) SELECT '棚M0401-048-A', 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = '棚M0401-048-A');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_shelf_number WHERE name = '棚M0401-048-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚番号「棚M0401-048-A」が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_shelf_number (name, sort_no) SELECT '棚M0401-048-B', 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = '棚M0401-048-B');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_shelf_number WHERE name = '棚M0401-048-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚番号「棚M0401-048-B」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
