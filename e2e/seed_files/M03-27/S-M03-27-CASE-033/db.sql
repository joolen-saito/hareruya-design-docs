-- S-M03-27-CASE-033（価格変更履歴データ(033)）
-- 流す時点: 投入方法の「③商品一覧の詳細検索「コード」に「GOODS-OLD-001-033」を入れて「検索する」を押し、該…」を終えたあと、次の「⑤グッズ商品CSV登録画面の「雛形ファイルダウンロード」で32列の雛形を取得し、…」より前。手順書（S-M03-27-CASE-033.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: （セールフラグは新規登録で0になる）④価格履歴の0件は画面で作れないためDBへ直接設定する（②の新規登録でできた、この商品の規格の価格履歴1件を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-033〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0327-033〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-033〕);

COMMIT;
