-- S-M03-32-DATA-011（更新日時確認データ）
-- 流す時点: 投入方法の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置く（文字コード・区切…」を終えたあと。手順書（S-M03-32-DATA-011.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】規格の更新日時=2026-09-01 00:00:00 JSTは、画面で登録すると現在日時になり指定できないため、DBへ直接設定する。
--     備考: 日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-011〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-011〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET update_date = TIMESTAMPTZ '2026-09-01 00:00:00+09' WHERE id = 〔商品規格ID-M0332-011〕;

COMMIT;
