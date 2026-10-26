-- S-M04-31-UPDDUP-043（同名更新の確認用(2件)）
-- 流す時点: 投入方法の「棚卸計画新規作成で棚卸名に「M0431-043-B」を入れ、店舗に「店舗A」を選び、在庫区分に「EC…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-043-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-UPDDUP-043.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
--     備考: 状態・属性に作成日の指定が無い棚卸計画にも同じ日時を設定した（文は「棚卸計画の作成日」と書く）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-043-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-043-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-043-A';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-043-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-043-B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-043-B';

COMMIT;
