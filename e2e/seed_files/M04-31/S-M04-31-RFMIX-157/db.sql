-- S-M04-31-RFMIX-157（在庫反映済みと未反映が同じ一覧にある棚卸計画(2件)）
-- 流す時点: 投入方法の「棚卸計画「M0431-157-B」は在庫反映を実行しない。」を終えたあと、次の「やり直しのときに棚卸名が「M0431-157-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-RFMIX-157.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
--     備考: 状態・属性に作成日の指定が無い棚卸計画にも同じ日時を設定した（文は「棚卸計画の作成日」と書く）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-157-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-157-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-157-A';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-157-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-157-B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-157-B';

-- [2] 文（投入方法）: 棚卸計画「M0431-157-A」の在庫反映日（2026/10/12 15:30:00）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-157-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-157-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET stock_reflectioned_date = TIMESTAMPTZ '2026-10-12 15:30:00+09' WHERE name = 'M0431-157-A';

COMMIT;
