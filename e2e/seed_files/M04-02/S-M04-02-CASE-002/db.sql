-- S-M04-02-CASE-002（スマレジ在庫表示データ(002)）
-- 流す時点: 投入方法の「② 在庫検索一覧画面で店舗に「TC東京2F」、在庫区分に「スマレジ」、商品コードに「M0402-S-…」を終えたあと、次の「④ スマレジ試験環境の管理画面で同じ商品コードの商品と在庫数99を登録する。」より前。手順書（S-M04-02-CASE-002.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ③ EC-CUBE保持在庫数10は画面で指定できないためDBへ直接設定する（〔在庫ID-M0402-002〕の在庫に設定する。商品規格の登録直後は在庫数0・総原価0である）。
--     備考: 在庫の呼び名の番号に対して設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0402-002〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0402-002〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 0 WHERE id = 〔在庫ID-M0402-002〕;

COMMIT;
