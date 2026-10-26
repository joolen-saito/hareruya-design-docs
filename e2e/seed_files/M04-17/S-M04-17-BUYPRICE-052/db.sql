-- S-M04-17-BUYPRICE-052（買取価格保存対象在庫(052)）
-- 流す時点: 投入方法の「この画面では登録を押さない。」を終えたあと。手順書（S-M04-17-BUYPRICE-052.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: この在庫の在庫数10と総原価10000は画面で指定できないためDBへ直接設定する
--     備考: 対象の在庫は、前の文までに控えた最後の在庫の呼び名 〔在庫ID-M0417-052〕
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0417-052〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0417-052〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 10000 WHERE id = 〔在庫ID-M0417-052〕;

COMMIT;
