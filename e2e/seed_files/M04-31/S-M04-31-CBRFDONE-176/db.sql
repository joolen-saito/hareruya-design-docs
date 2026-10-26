-- S-M04-31-CBRFDONE-176（在庫反映日が設定済みの棚卸計画）
-- 流す時点: 投入方法の「棚卸計画「M0431-CB176-A」の棚卸計画編集で「棚卸結果の在庫反映」を押し、棚卸在庫反映で「…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-CB176-」で始まる棚卸計画が残っている…」より前。手順書（S-M04-31-CBRFDONE-176.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB176-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB176-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-CB176-A';

-- [2] 文（投入方法）: 棚卸計画の在庫反映日（2026/10/12 15:30:00）と在庫反映実行時の更新者名（「M0431更新者CB176」）は、画面で実行者と日時を指定できないためDBへ直接設定する。
--     備考: 更新者は管理者の名前で引く。日時は日本時間(+09)。棚卸計画の担当の管理者の列に入れた
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB176-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB176-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE name = 'M0431更新者CB176') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '管理者「M0431更新者CB176」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-CB176-A'))) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する棚卸計画（「M0431-CB176-A」）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET stock_reflectioned_date = TIMESTAMPTZ '2026-10-12 15:30:00+09', member_id = (SELECT id FROM dtb_member WHERE name = 'M0431更新者CB176') WHERE id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-CB176-A'));

COMMIT;
