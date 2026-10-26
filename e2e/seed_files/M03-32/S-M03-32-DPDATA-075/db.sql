-- S-M03-32-DPDATA-075（セール中と通常の混在更新データ）
-- 流す時点: 投入方法の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置く（文字コード・区切…」を終えたあと。手順書（S-M03-32-DPDATA-075.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】両規格の買取・販売価格履歴は、規格を登録した時点で価格履歴が1件自動で作られ、価格履歴を削除する画面が無いため、DBへ直接削除して0件にする。
--     備考: 文が「両商品」「各規格」などと全部を指すため、このシードの全ての商品規格に対して行う
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-075S〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-075S〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0332-075S〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-075N〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-075N〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0332-075N〕;

COMMIT;
