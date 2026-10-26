-- S-M04-31-CBRFRUN-177（在庫反映の処理が実行中の棚卸計画と対照の計画）
-- 流す時点: 投入方法の「棚卸計画「M0431-CB177-B」の棚卸計画編集で「商品登録」を押し、棚卸商品CSV登録で、見出…」を終えたあと、次の「棚卸計画「M0431-CB177-A」と「M0431-CB177-B」のそれぞれ…」より前。手順書（S-M04-31-CBRFRUN-177.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
--     備考: 状態・属性に作成日の指定が無い棚卸計画にも同じ日時を設定した（文は「棚卸計画の作成日」と書く）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB177-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB177-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-CB177-A';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB177-B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB177-B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-CB177-B';

COMMIT;
