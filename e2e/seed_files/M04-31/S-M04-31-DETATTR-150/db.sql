-- S-M04-31-DETATTR-150（言語・状態・作成時間・商品画像の確認用棚卸計画）
-- 流す時点: 投入方法の「棚卸計画「M0431-150-A」の棚卸計画編集で「商品登録」を押し、棚卸商品CSV登録で、見出し行…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-150-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-DETATTR-150.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-150-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-150-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-150-A';

-- [2] 文（投入方法）: 棚卸詳細データの作成時間（2026/10/10 09:30）は画面で指定できないためDBへ直接設定する。
--     備考: その棚卸計画の棚卸詳細すべてに設定する(商品の指名が文に無いため)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-150-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-150-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-150-A'))) INTO c; IF c < 1 THEN RAISE EXCEPTION '棚卸計画「M0431-150-A」の棚卸詳細が1件も無い（%件）', c; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET create_date = TIMESTAMPTZ '2026-10-10 09:30:00+09' WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-150-A'));

COMMIT;
