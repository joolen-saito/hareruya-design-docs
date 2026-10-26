-- S-M03-32-DATA-033（基準価格最大桁数データ）
-- 流す時点: 投入方法の「【ファイル】試験者の端末で次の取込ファイルを作り、ブラウザから選択できる場所に置く（文字コード・区切…」を終えたあと。手順書（S-M03-32-DATA-033.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】HIGH-N-0001-033の販売価格900は、セールフラグなしでは画面が基準価格と同じ値で保存するため画面で指定できず、DBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIGH-N-0001-033') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIGH-N-0001-033」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIGH-N-0001-033')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードHIGH-N-0001-033）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIGH-N-0001-033');

COMMIT;
