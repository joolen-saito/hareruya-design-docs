-- S-M03-31-DPDATA-077（複数商品のCSV取込データ）
-- 流す時点: 投入方法の「その行の商品名を押して商品登録編集画面を開き、割引率に率が100%の選択肢、買取減額率に率が100%…」を終えたあと、次の「グッズ商品CSV登録画面で、商品IDを空、商品コードに「M0331-077C」、…」より前。手順書（S-M03-31-DPDATA-077.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [2] 文（投入方法）: 規格の状態（SP）は画面で指定できないためDBへ直接設定する。
--     備考: 文が名指ししないため、対象は直前の手順で出てきた最後の商品（〔商品規格ID-M0331-077B〕）とした（このシードの商品規格は複数）
--     備考: 状態の名前の表示用の列は変えない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-077B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-077B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'SP') WHERE id = 〔商品規格ID-M0331-077B〕;

COMMIT;
