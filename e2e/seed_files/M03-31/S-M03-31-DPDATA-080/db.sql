-- S-M03-31-DPDATA-080（価格が変わる規格と変わらない規格が混在する商品データ）
-- 流す時点: 投入方法の「商品規格一覧で新規作成を押し、商品規格登録編集画面で言語に日本語、状態にニアミント、商品コードに「M…」を終えたあと、次の「状態・属性に書いた値（番号は控えた番号）で mixed-change-080.c…」より前。手順書（S-M03-31-DPDATA-080.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 両規格の状態（SP）は画面で指定できないためDBへ直接設定する。
--     備考: 文が「両商品」「各規格」などと全部を指すため、このシードの全ての商品規格に対して行う
--     備考: 状態の名前の表示用の列は変えない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-080A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-080A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'SP') WHERE id = 〔商品規格ID-M0331-080A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-080B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-080B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'SP') WHERE id = 〔商品規格ID-M0331-080B〕;

-- [2] 文（投入方法）: 当該規格の価格履歴0件は画面で指定できないためDBへ直接設定する（登録・編集のときに記録された価格履歴を削除する）。
--     備考: 文が対象を名指しせず、節の見出し・直前の手順からも決まらないため、このシードの全ての商品規格に対して行う（状態・属性の書き方から全部に当たると読んだ）
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-080A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-080A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0331-080A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-080B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-080B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0331-080B〕;

COMMIT;
