-- S-M03-35-SECTIONS（部門更新試験用部門）
-- 流す時点: 投入方法の「部門一覧で部門コード31、32、33の行のID列に表示された部門IDを控える（〔部門ID-M0335…」を終えたあと。手順書（S-M03-35-SECTIONS.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: スマレジ試験用部門ID（SMR-SECTION-31、SMR-SECTION-32、SMR-SECTION-33）は画面で指定できないためDBへ直接設定する（部門コード31、32、33の部門のスマレジ部門IDとして設定する）
--     備考: スマレジ連携先の部門IDは部門コードで引いた部門に設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_section WHERE code = '31') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '部門コード31が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_section SET smaregi_category_id = 'SMR-SECTION-31' WHERE code = '31';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_section WHERE code = '32') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '部門コード32が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_section SET smaregi_category_id = 'SMR-SECTION-32' WHERE code = '32';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_section WHERE code = '33') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '部門コード33が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_section SET smaregi_category_id = 'SMR-SECTION-33' WHERE code = '33';

COMMIT;
