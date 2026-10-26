-- S-M03-32-CBSMA-085（スマレジ連携フラグの組合せ確認データ(085)）
-- 流す時点: 投入方法の「商品規格登録編集画面の商品規格ID欄に表示された番号を控える（〔商品規格ID-M0332-085〕）…」を終えたあと、次の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置…」より前。手順書（S-M03-32-CBSMA-085.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】M32CB085Sのスマレジ商品ID=SMR-M0332-CB085-Aは、画面に入力欄が無く（表示のみ。連携するで登録すると試験応答が返した値が入る）指定できないため、DBへ直接設定する。
--     備考: スマレジ商品IDの値は文の「SMR-M0332-CB085-A」
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-085〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-085〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = 'SMR-M0332-CB085-A' WHERE id = 〔商品規格ID-M0332-085〕;

COMMIT;
