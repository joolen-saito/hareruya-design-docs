-- S-M03-30-DATA-027（買取価格履歴データ(027)）
-- 流す時点: 投入方法の「続けて同じ商品規格登録編集画面でセールフラグにチェックを入れ、販売価格に800を入れ、部門に任意の1…」を終えたあと、次の「設計の5列を持つUTF-8・タブ区切りファイルを配置する（ファイルの商品IDには…」より前。手順書（S-M03-30-DATA-027.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 価格履歴=0件は画面で指定できないためDBへ直接設定する（登録時にできた価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-027〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-027〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-027〕;

COMMIT;
