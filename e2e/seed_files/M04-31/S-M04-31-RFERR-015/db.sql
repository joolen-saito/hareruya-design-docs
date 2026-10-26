-- S-M04-31-RFERR-015（在庫反映が途中で止まった棚卸計画）
-- 流す時点: 投入方法の「棚卸計画「M0431-015-B」には棚卸詳細を登録しなくてよい（在庫反映済みの棚卸詳細が0件であれ…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-015-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-RFERR-015.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
--     備考: 状態・属性に作成日の指定が無い棚卸計画にも同じ日時を設定した（文は「棚卸計画の作成日」と書く）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-015-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-015-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-015-A';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-015-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-015-B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-015-B';

-- [2] 文（投入方法）: 棚卸計画「M0431-015-A」の棚卸詳細2件のうち1件だけを在庫反映済みにする値は、画面で作れないためDBへ直接設定する（棚卸計画の在庫反映日は空のままにする）。
--     備考: どの詳細を反映済みにするかは文に無いので、棚卸詳細の番号が小さいほうから指定件数にした。反映した日時は流した時刻(文に無い)。棚卸計画の在庫反映日は触らない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-015-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-015-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan_detail WHERE id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-015-A') ORDER BY id LIMIT 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する棚卸詳細（棚卸計画「M0431-015-A」・番号の小さいほうから1件）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET stock_reflectioned_date = now() WHERE id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-015-A') ORDER BY id LIMIT 1);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-015-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-015-B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET stock_reflectioned_date = now() WHERE id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id = (SELECT id FROM dtb_inventory_plan WHERE name = 'M0431-015-B') ORDER BY id LIMIT 0);

COMMIT;
