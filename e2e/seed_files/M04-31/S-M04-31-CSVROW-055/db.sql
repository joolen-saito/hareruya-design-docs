-- S-M04-31-CSVROW-055（出力値確認用の棚卸計画）
-- 流す時点: 投入方法の「棚卸詳細を登録したあとで、商品CSV登録に、商品登録画面のURLに含まれる商品IDを商品ID列に入れ…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-055-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-CSVROW-055.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸詳細の最終更新日（M0431055P1は2026-10-12 09:30:00、M0431055P2は2026-10-13 10:45:10）は画面で指定できないためDBへ直接設定する。
--     備考: 棚卸詳細は 棚卸計画の名前+商品コード で引き、1件に決まることを確かめる。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-055-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-055-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-055-A')) AND product_stock_id IN (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431055P1')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-055-A」の商品コードM0431055P1の棚卸詳細が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET update_date = TIMESTAMPTZ '2026-10-12 09:30:00+09' WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-055-A')) AND product_stock_id IN (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431055P1');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-055-A')) AND product_stock_id IN (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431055P2')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-055-A」の商品コードM0431055P2の棚卸詳細が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan_detail SET update_date = TIMESTAMPTZ '2026-10-13 10:45:10+09' WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name IN ('M0431-055-A')) AND product_stock_id IN (SELECT s.id FROM dtb_product_stock s JOIN dtb_product_class c ON c.id = s.product_class_id WHERE c.product_code = 'M0431055P2');

COMMIT;
