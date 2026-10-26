-- S-M03-31-DPDATA-083（セールから通常への同じCSVを2回取り込むデータ）
-- 流す時点: 投入方法の「その商品規格登録編集画面で、セールフラグにチェックを入れ、販売価格に1500を入れ、部門が未選択なら…」を終えたあと、次の「状態・属性に書いた値（番号は控えた番号）で sale-off-twice-083…」より前。手順書（S-M03-31-DPDATA-083.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 規格の状態（SP）は画面で指定できないためDBへ直接設定する。
--     備考: 状態の名前の表示用の列は変えない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0331-083〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0331-083〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'SP') WHERE id = 〔商品規格ID-M0331-083〕;

COMMIT;
