-- S-M03-27-CBSALE-085（セール中・非公開更新データ(085)）
-- 流す時点: 投入方法の「④商品一覧でその商品の商品登録画面を開き、商品規格登録画面へ進んで、「セールフラグ」にチェックを付け…」を終えたあと、次の「⑥グッズ商品CSV登録画面の「雛形ファイルダウンロード」で32列の雛形を取得し、…」より前。手順書（S-M03-27-CBSALE-085.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ⑤価格履歴の0件は画面で作れないためDBへ直接設定する（登録時にできた、この商品の規格の価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-085〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0327-085〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-085〕);

COMMIT;
