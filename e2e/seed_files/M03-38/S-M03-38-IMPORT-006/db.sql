-- S-M03-38-IMPORT-006（更新範囲確認データ(006)）
-- 流す時点: 投入方法の「その行の商品名を押して商品登録編集画面を開き、商品公開ステータスで「公開」（全体1）、支店の商品公開…」を終えたあと、次の「控えた商品IDを使い、状態・属性に書いた内容のファイル「m03-38-valid…」より前。手順書（S-M03-38-IMPORT-006.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 更新日時2026-08-01 10:00（〔商品ID-M0338-006A〕）と2026-08-01 10:01（〔商品ID-M0338-006B〕）は画面で指定できないためDBへ直接設定する。
--     備考: 商品の更新日時だけを変える。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = 〔商品ID-M0338-006A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品ID-M0338-006A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product SET update_date = TIMESTAMPTZ '2026-08-01 10:00:00+09' WHERE id = 〔商品ID-M0338-006A〕;

COMMIT;
