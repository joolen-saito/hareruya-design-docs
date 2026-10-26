-- S-M03-32-CBHIST-079（価格履歴の組合せ確認データ(079)）
-- 流す時点: 投入方法の「【画面】商品マスター（検索結果）の該当商品の商品登録編集画面を開き、規格設定ボタンで商品規格一覧画面…」を終えたあと、次の「【ファイル】試験者の端末で、高額商品価格変更CSVアップロード画面の「雛形ファイ…」より前。手順書（S-M03-32-CBHIST-079.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 【DB直接】M32CB079Aの規格の販売価格1500は、セールフラグなしでは画面が基準価格と同じ値で保存するため画面で指定できず、DBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M32CB079A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「M32CB079A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M32CB079A')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードM32CB079A）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 1500 WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M32CB079A');

COMMIT;
