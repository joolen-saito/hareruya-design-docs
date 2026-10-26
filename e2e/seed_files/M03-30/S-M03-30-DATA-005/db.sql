-- S-M03-30-DATA-005（更新対象0件データ(005)）
-- 流す時点: 投入方法の「商品規格一覧画面で〔商品規格ID-M0330-005A〕の規格の編集ボタンを押し、商品規格登録編集画…」を終えたあと、次の「設計の5列を持つUTF-8・タブ区切りファイルを試験端末へ配置する（ファイルの商…」より前。手順書（S-M03-30-DATA-005.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 各規格の販売価格=900は画面で指定できないためDBへ直接設定する。
--     備考: 文が「両商品」「各規格」などと全部を指すため、このシードの全ての商品規格に対して行う
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-005A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-005A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔商品規格ID-M0330-005A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-005B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-005B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔商品規格ID-M0330-005B〕;

-- [2] 文（投入方法）: 価格履歴=0件は画面で指定できないためDBへ直接設定する（登録時にできた価格履歴を削除する）。
--     備考: 文が対象を名指しせず、節の見出し・直前の手順からも決まらないため、このシードの全ての商品規格に対して行う（状態・属性の書き方から全部に当たると読んだ）
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-005A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-005A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-005A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-005B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-005B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-005B〕;

COMMIT;
