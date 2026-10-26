-- S-M04-03-L-STOCK-049（入庫登録対象(L001)）
-- 流す時点: 投入方法の「この登録で全店舗・全在庫区分の在庫が在庫数0・総原価0で作られるので、在庫検索一覧（検索結果）で商品…」を終えたあと、次の「商品マスター（検索結果）で商品「一括商品B」の商品規格一覧を開き、商品規格登録編…」より前。手順書（S-M04-03-L-STOCK-049.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 〔在庫ID-M0403-049A〕の在庫数10・総原価10000は画面で指定できないためDBへ直接設定する。
--     備考: 在庫の呼び名の番号に対して設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0403-049A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0403-049A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = 10, total_cost = 10000 WHERE id = 〔在庫ID-M0403-049A〕;

COMMIT;
