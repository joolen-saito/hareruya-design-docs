-- S-M03-27-CBSMSTK-088（スマレジ在庫あり・公開更新データ(088)）
-- 流す時点: 投入方法の「④スマレジ試験環境の管理画面で、商品コード900327088000088の商品の在庫を1にする（EC…」を終えたあと、次の「⑥グッズ商品CSV登録画面の「雛形ファイルダウンロード」で32列の雛形を取得し、…」より前。手順書（S-M03-27-CBSMSTK-088.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ⑤価格履歴の0件は画面で作れないためDBへ直接設定する（登録時にできた、この商品の規格の価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-088〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0327-088〕の規格」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0327-088〕);

COMMIT;
