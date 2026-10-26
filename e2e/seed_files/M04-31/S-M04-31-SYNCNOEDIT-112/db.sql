-- S-M04-31-SYNCNOEDIT-112（編集権限の無い店舗の棚卸詳細）
-- 流す時点: 投入方法の「棚卸詳細を登録したあとで、商品CSV登録に、商品登録画面のURLに含まれる商品IDを商品ID列に入れ…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-112-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-SYNCNOEDIT-112.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-112-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-112-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-112-A';

COMMIT;
