-- S-M04-01-MASTER（検索選択肢マスタ）
-- 流す時点: 投入方法の「在庫区分のEC-CUBE・スマレジは画面に固定の選択肢で、登録は要らない。」を終えたあと。手順書（S-M04-01-MASTER.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚番号=A-01は画面で指定できないためDBへ直接設定する。
--     備考: 棚番号は名前で作る(同じ名前があれば作らない)。並び順は文に無いので0。作ったあと、名前ごとに棚番号が1件だけあることを確かめる
INSERT INTO dtb_shelf_number (name, sort_no) SELECT 'A-01', 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = 'A-01');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_shelf_number WHERE name = 'A-01') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚番号「A-01」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
