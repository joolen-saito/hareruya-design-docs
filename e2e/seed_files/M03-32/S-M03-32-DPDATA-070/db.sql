-- S-M03-32-DPDATA-070（基準価格のみ一致し販売価格が異なる通常商品データ）
-- 流す時点: 投入方法の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置く（文字コード・区切…」を終えたあと。手順書（S-M03-32-DPDATA-070.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】HIGHM0332-070-Aの販売価格1000は、セールフラグなしでは画面が基準価格と同じ値で保存するため画面で指定できず、DBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIGHM0332-070-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIGHM0332-070-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIGHM0332-070-A')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードHIGHM0332-070-A）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 1000 WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIGHM0332-070-A');

-- [2] 文（投入方法）: 当該規格の買取・販売価格履歴は、規格を登録した時点で価格履歴が1件自動で作られ、価格履歴を削除する画面が無いため、DBへ直接削除して0件にする。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0332-070A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0332-070A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0332-070A〕;

COMMIT;
