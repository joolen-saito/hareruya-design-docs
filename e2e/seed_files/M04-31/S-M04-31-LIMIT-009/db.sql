-- S-M04-31-LIMIT-009（12件の棚卸計画）
-- 流す時点: 投入方法の「棚卸計画新規作成で棚卸名に「M0431-009-12」を入れ、店舗に「店舗A」を選び、在庫区分に「E…」を終えたあと。手順書（S-M04-31-LIMIT-009.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 棚卸計画の作成日（「M0431-009-01」を2026/10/01とし、番号が1増えるごとに1日後。「M0431-009-12」は2026/10/12）は画面で指定できないためDBへ直接設定する。
--     備考: 番号が1増えるごとに1日後(M0431-009- の番号1が 2026/10/01)。日時は日本時間(+09)
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name ~ '^M0431\-009\-[0-9]+$') INTO c; IF c < 1 THEN RAISE EXCEPTION '棚卸計画「M0431-009-…」が1件も無い（%件）', c; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-01 00:00:00+09' + (((substring(name from '[0-9]+$'))::int - 1) / 1) * 1 * interval '1 day' WHERE name ~ '^M0431\-009\-[0-9]+$';

COMMIT;
