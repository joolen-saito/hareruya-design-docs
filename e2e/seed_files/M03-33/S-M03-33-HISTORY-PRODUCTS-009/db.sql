-- S-M03-33-HISTORY-PRODUCTS-009（販売価格履歴データ）
-- 流す時点: 投入方法の「セール用高額商品価格変更CSVアップロード画面のCSVインポート履歴に、用意したファイルと同じファイ…」を終えたあと。手順書（S-M03-33-HISTORY-PRODUCTS-009.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 価格履歴0件は、商品規格を登録すると価格履歴が1件作られ、消す画面も無く、画面で指定できないためDBへ直接設定する（登録した商品規格の価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0333-009〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0333-009〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0333-009〕;

COMMIT;
