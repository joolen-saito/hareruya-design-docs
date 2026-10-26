-- S-M04-31-CBRFRUN-177（在庫反映の処理が実行中の棚卸計画と対照の計画）
-- 流す時点: 投入方法の「棚卸計画「M0431-CB177-A」と「M0431-CB177-B」のそれぞれで棚卸詳細2件のうち…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-CB177-」で始まる棚卸計画が残っている…」より前。手順書（S-M04-31-CBRFRUN-177.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: 棚卸計画「M0431-CB177-A」だけを在庫反映の処理が実行中の状態にする値は、画面で作れないためDBへ直接設定する。
--     備考: 実行中の印(反映処理中のフラグ)をこの計画だけに付ける
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-CB177-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-CB177-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET reflecting_flg = true WHERE name = 'M0431-CB177-A';

COMMIT;
