-- S-M04-31-UPDWORKER-137（作業者が別の管理者の棚卸計画）
-- 流す時点: 投入方法の「店舗Bを編集できる管理者m0431_noedit（管理者名「試験管理者B」。S-M04-31-ADM…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-137-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-UPDWORKER-137.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-137-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-137-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-137-A';

COMMIT;
