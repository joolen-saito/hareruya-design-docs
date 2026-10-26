-- S-M04-02-CASE-003（履歴統合データ(003)）
-- 流す時点: 投入方法の「② 在庫検索一覧画面で店舗に「TC東京2F」、在庫区分に「EC-CUBE」、商品コードに「M0402…」を終えたあと、次の「④ 在庫変動履歴1件（在庫変動履歴ID=402041003・試験識別子H-MIX…」より前。手順書（S-M04-02-CASE-003.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ③ 在庫数10・総原価10000は画面で指定できないためDBへ直接設定する（〔在庫ID-M0402-003〕の在庫に設定する。商品規格の登録直後は在庫数0・総原価0である）。
--     備考: 在庫の呼び名の番号に対して設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0402-003〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0402-003〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 10000 WHERE id = 〔在庫ID-M0402-003〕;

COMMIT;
