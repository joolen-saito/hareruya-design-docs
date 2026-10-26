-- S-M03-30-MULTI-077（異なる2商品の更新データ(077)）
-- 流す時点: 投入方法の「販売価格は画面で指定できないためDBへ直接設定する（商品Aを900、商品Bを1800にする）。」を終えたあと、次の「設計の5列を持つUTF-8・タブ区切りファイルを試験端末へ配置する（ファイルの商…」より前。手順書（S-M03-30-MULTI-077.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [2] 文（投入方法）: 価格履歴=0件は画面で指定できないためDBへ直接設定する（登録時にできた価格履歴を削除する）。
--     備考: 文が対象を名指しせず、節の見出し・直前の手順からも決まらないため、このシードの全ての商品規格に対して行う（状態・属性の書き方から全部に当たると読んだ）
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-077A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-077A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-077A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-077B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-077B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-077B〕;

COMMIT;
