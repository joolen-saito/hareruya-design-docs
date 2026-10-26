-- S-M04-31-SYNCREFL-114（在庫反映済みの棚卸詳細）
-- 流す時点: 投入方法の「棚卸詳細を登録したあとで、商品CSV登録に、商品登録画面のURLに含まれる商品IDを商品ID列に入れ…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-114-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-SYNCREFL-114.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-114-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-114-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-114-A';

-- [2] 文（投入方法）: 在庫反映済みの状態（棚卸計画の在庫反映日2026/10/12 15:30:00と、棚卸詳細の在庫反映済み）は、差異確認が未実施のままでは画面で作れないためDBへ直接設定する。
--     備考: 棚卸詳細の反映日も同じ日時にした(文は「棚卸詳細の在庫反映済み」とだけ書く)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-114-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-114-A」が1件に決まらない（%件）', n; END IF; END $$;
-- 計画の在庫反映日と、その棚卸詳細の在庫反映日を同じ日時にする
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-114-A'))) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する棚卸計画（「M0431-114-A」）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET stock_reflectioned_date = TIMESTAMPTZ '2026-10-12 15:30:00+09' WHERE id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-114-A'));
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-114-A'))) INTO c; IF c < 1 THEN RAISE EXCEPTION '更新する棚卸詳細（棚卸計画「M0431-114-A」）が1件も無い（%件）', c; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET stock_reflectioned_date = TIMESTAMPTZ '2026-10-12 15:30:00+09' WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-114-A'));

COMMIT;
