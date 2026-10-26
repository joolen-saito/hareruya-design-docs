-- S-M03-32-ASYNC-059（非同期受渡しデータ(059)）
-- 流す時点: 投入方法の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置く（文字コード・区切…」を終えたあと。手順書（S-M03-32-ASYNC-059.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】HIGH-M0332-059-Aのスマレジ商品ID=SMR-M0332-059-Aは、画面に入力欄が無く（表示のみ。連携するで登録すると試験応答が返した値が入る）指定できないため、DBへ直接設定する。
--     備考: スマレジ商品IDの値は文の「SMR-M0332-059-A」
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-059〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-059〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = 'SMR-M0332-059-A' WHERE id = 〔商品規格ID-M0332-059〕;

COMMIT;
