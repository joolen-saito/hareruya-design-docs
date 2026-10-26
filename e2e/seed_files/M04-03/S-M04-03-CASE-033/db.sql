-- S-M04-03-CASE-033（増減数下限対象(033)）
-- 流す時点: 投入方法の「この取り込みで、公開中の店舗と在庫場所の組み合わせぶんの在庫が在庫数0・総原価0で作られるので、在庫…」を終えたあと、次の「商品規格の登録直後は関連する在庫編集承認情報・在庫変動履歴が無い。」より前。手順書（S-M04-03-CASE-033.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 〔在庫ID-M0403-033〕の在庫数99999999・総原価99999999は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の呼び名の番号に対して設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0403-033〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0403-033〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 99999999, total_cost = 99999999 WHERE id = 〔在庫ID-M0403-033〕;

COMMIT;
