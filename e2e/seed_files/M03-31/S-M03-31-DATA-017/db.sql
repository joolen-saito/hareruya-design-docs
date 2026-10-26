-- S-M03-31-DATA-017（販売価格履歴データ）
-- 流す時点: 投入方法の「その商品規格登録編集画面で、セールフラグにチェックを入れ、販売価格に1500を入れ、部門が未選択なら…」を終えたあと、次の「状態・属性に書いた値（番号は控えた番号）で sell-only-change-0…」より前。手順書（S-M03-31-DATA-017.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 当該規格の価格履歴0件は画面で指定できないためDBへ直接設定する（登録・編集のときに記録された価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-017〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-017〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0331-017〕;

COMMIT;
